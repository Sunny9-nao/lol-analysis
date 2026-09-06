# frozen_string_literal: true

class SummonerSyncService
  attr_reader :client

  def initialize(client: nil)
    @client = client
  end

  # サモナーを検索し、必要に応じてRiot APIと同期してActiveRecordを返す
  def sync(game_name:, tag_line:, force: false)
    summoner = Summoner.find_by(game_name: game_name, tag_line: tag_line)

    # 開発・レビュー用サンプルサモナー（puuid が sample_ で始まる場合）は外部APIを呼ばずに即返却
    if summoner.present? && summoner.puuid&.start_with?("sample_")
      return summoner
    end

    # 1時間以内に同期済みかつforceでなければDBから即返却
    if summoner.present? && !force && summoner.last_synced_at.present? && summoner.last_synced_at > 1.hour.ago
      return summoner
    end

    # 1. Riot APIからアカウント情報を取得
    account = client.fetch_account_by_riot_id(game_name, tag_line)
    return nil unless account

    puuid = account["puuid"]

    # 2. サモナー詳細（レベル・アイコン）を取得
    platform = client.send(:infer_platform, tag_line)
    region   = client.send(:infer_region, platform)
    sum_data = client.fetch_summoner_by_puuid(puuid, platform: platform)

    # 3. Summoner レコードを Upsert
    summoner ||= Summoner.find_or_initialize_by(puuid: puuid)
    summoner.assign_attributes(
      game_name: account["gameName"],
      tag_line: account["tagLine"],
      summoner_level: sum_data["summonerLevel"],
      profile_icon_id: sum_data["profileIconId"],
      is_private: false,
      last_synced_at: Time.current,
      raw_data: { account: account, summoner: sum_data }
    )
    summoner.save!

    # 4. 直近のソロ/デュオランク試合を取得して保存 (最新30件)
    match_ids = client.fetch_match_ids_by_puuid(puuid, count: 30, queue: 420, region: region)
    match_ids.each do |match_id|
      sync_match(match_id: match_id, summoner: summoner, region: region)
    end

    summoner.reload
  rescue RiotApiClient::AccountNotFoundError
    nil
  rescue RiotApiClient::PrivateAccountError
    # 非公開アカウントの場合 (puuid を生成して確実に保存)
    require "digest"
    summoner ||= Summoner.find_or_initialize_by(game_name: game_name, tag_line: tag_line)
    summoner.puuid ||= "private_#{Digest::SHA256.hexdigest("#{game_name}##{tag_line}")[0..31]}"
    summoner.is_private = true
    summoner.last_synced_at = Time.current
    summoner.save
    summoner.persisted? ? summoner : nil
  end

  # 過去の試合をチャンク（指定件数: デフォルト30件）単位で遡って取得する
  def backfill_past_matches(summoner, count: 30, queue: 420)
    return { imported_count: 0, has_more: false } if summoner.blank? || summoner.is_private || summoner.puuid.blank?

    # サンプルサモナーの場合は外部APIを呼ばない
    if summoner.puuid.start_with?("sample_")
      return { imported_count: 0, has_more: false }
    end

    platform = client.send(:infer_platform, summoner.tag_line)
    region   = client.send(:infer_region, platform)

    # 既にDBに保存されている試合数をオフセットとして使用
    offset = summoner.match_participants.joins(:match).where(matches: { queue_id: queue }).count

    match_ids = client.fetch_match_ids_by_puuid(summoner.puuid, start: offset, count: count, queue: queue, region: region)
    return { imported_count: 0, has_more: false } if match_ids.blank?

    imported_count = 0
    match_ids.each do |match_id|
      unless MatchParticipant.joins(:match).exists?(summoner: summoner, matches: { match_id: match_id })
        sync_match(match_id: match_id, summoner: summoner, region: region)
        imported_count += 1
      end
    end

    summoner.update!(last_synced_at: Time.current)
    {
      imported_count: imported_count,
      has_more: match_ids.size >= count
    }
  rescue RiotApiClient::RiotApiError => e
    Rails.logger.error("[SummonerSyncService#backfill_past_matches] #{e.message}")
    raise e
  end

  private

  def client
    @client ||= RiotApiClient.new
  end

  def sync_match(match_id:, summoner:, region:)
    match = Match.find_by(match_id: match_id)
    detail = match&.raw_info.presence

    # 未保存の試合のみ外部APIから取得
    if detail.blank?
      sleep 0.06 unless Rails.env.test? # レートリミット対策 (最大秒間16リクエスト)
      detail = client.fetch_match_detail(match_id, region: region)
    end

    info = detail["info"]
    return unless info

    # 1. Match レコードを Upsert (10人分の生JSON raw_info を保存)
    game_creation_time = Time.at(info["gameCreation"] / 1000.0) rescue Time.current
    match ||= Match.find_or_initialize_by(match_id: match_id)

    # タイムラインの取得（未保存の場合のみ）
    timeline = match.raw_timeline.presence
    if timeline.blank?
      sleep 0.06 unless Rails.env.test? # レートリミット対策
      begin
        timeline = client.fetch_match_timeline(match_id, region: region)
      rescue RiotApiClient::RiotApiError => e
        Rails.logger.warn("Failed to fetch timeline for #{match_id}: #{e.message}")
        timeline = nil
      end
    end

    match.update!(
      game_mode: info["gameMode"],
      queue_id: info["queueId"],
      game_duration: info["gameDuration"],
      game_creation: game_creation_time,
      raw_info: detail,
      raw_timeline: timeline
    )

    # 2. 該当プレイヤーと対面プレイヤーの特定
    participants = info["participants"] || []
    my_p = participants.find { |p| p["puuid"] == summoner.puuid }
    return unless my_p

    # 対面（同じレーンポジションで敵チーム）の特定
    my_pos = my_p["teamPosition"].presence || my_p["individualPosition"]
    opp_p = participants.find do |p|
      pos = p["teamPosition"].presence || p["individualPosition"]
      pos == my_pos && p["teamId"] != my_p["teamId"]
    end

    # アイテム一覧 (item0〜item6)
    items = (0..6).map { |i| my_p["item#{i}"] }.compact.reject(&:zero?)
    spells = [ my_p["summoner1Id"], my_p["summoner2Id"] ].compact

    # タイムライン解析（GD@14, CSD@14, 序盤アイテム購入ログ）
    timeline_insights = TimelineAnalysisService.new(
      timeline_data: timeline,
      match_raw_info: detail,
      puuid: summoner.puuid,
      opponent_champion_name: opp_p&.dig("championName")
    ).analyze

    # 3. MatchParticipant を Upsert (本人分156項目生JSON raw_participant を保存)
    participant = MatchParticipant.find_or_initialize_by(summoner: summoner, match: match)
    participant.update!(
      champion_name: my_p["championName"],
      opponent_champion_name: opp_p&.dig("championName"),
      position: my_pos,
      win: my_p["win"],
      kills: my_p["kills"] || 0,
      deaths: my_p["deaths"] || 0,
      assists: my_p["assists"] || 0,
      cs: (my_p["totalMinionsKilled"] || 0) + (my_p["neutralMinionsKilled"] || 0),
      gold_earned: my_p["goldEarned"] || 0,
      total_damage_dealt: my_p["totalDamageDealtToChampions"] || 0,
      items: items,
      spells: spells,
      raw_participant: my_p,
      gold_diff_at_14: timeline_insights[:gold_diff_at_14],
      cs_diff_at_14: timeline_insights[:cs_diff_at_14],
      lane_outcome: timeline_insights[:lane_outcome],
      early_items: timeline_insights[:early_items]
    )
  end
end
