# frozen_string_literal: true

class MatchupAnalysisService
  attr_reader :summoner

  def initialize(summoner:)
    @summoner = summoner
  end

  # 自サモナーがプレイしたチャンピオン一覧と勝率・試合数を返す
  def played_champions(position: nil)
    scope = base_scope
    scope = scope.where(position: position) if position.present?

    participants = scope.to_a
    grouped = participants.group_by(&:champion_name)
    champions_map = Champion.where(champion_name: grouped.keys).index_by(&:champion_name)

    grouped.map do |champion_name, parts|
      total = parts.size
      wins = parts.count(&:win)
      win_rate = ((wins.to_f / total) * 100).round(1)

      pos_counts = parts.group_by(&:position).transform_values(&:size)
      most_played_pos = pos_counts.max_by { |_pos, count| count }&.first

      {
        champion_name: champion_name,
        champion: champions_map[champion_name],
        match_count: total,
        win_count: wins,
        win_rate: win_rate,
        most_played_position: most_played_pos
      }
    end.sort_by { |item| [-item[:match_count], -item[:win_rate]] }
  end

  # 指定した自チャンピオンに対する対面チャンピオンごとの集計サマリ一覧を返す
  def summaries_for(champion_name:, position: nil)
    scope = base_scope.where(champion_name: champion_name)
    scope = scope.where(position: position) if position.present?

    participants = scope.includes(:match, :match_note).to_a
    grouped = participants.group_by(&:opponent_champion_name)
    champions_map = Champion.where(champion_name: grouped.keys).index_by(&:champion_name)

    grouped.map do |opp_name, parts|
      stats = calculate_stats_for_group(opp_name, parts)
      stats.merge(opponent_champion: champions_map[opp_name])
    end.sort_by { |item| [-item[:match_count], -item[:win_rate]] }
  end

  # 指定した相手チャンピオンに対して、自チャンピオンごとの戦績比較サマリ一覧を返す（逆引き・カウンターレコメンド）
  def counters_for(opponent_champion_name:, position: nil)
    term = opponent_champion_name.to_s.strip
    return [] if term.blank?

    matched_champ = Champion.where("LOWER(champion_name) = ? OR name = ?", term.downcase, term).first ||
                    Champion.where("LOWER(champion_name) LIKE ? OR name LIKE ?", "%#{term.downcase}%", "%#{term}%").first
    target_name = matched_champ&.champion_name || term

    scope = base_scope.where("LOWER(opponent_champion_name) = ?", target_name.downcase)
    scope = scope.where(position: position) if position.present?

    participants = scope.includes(:match, :match_note).to_a
    return [] if participants.empty?

    grouped = participants.group_by(&:champion_name)
    champions_map = Champion.where(champion_name: grouped.keys).index_by(&:champion_name)

    grouped.map do |my_champ_name, parts|
      stats = calculate_stats_for_group(opponent_champion_name, parts)
      stats.merge(
        champion_name: my_champ_name,
        champion: champions_map[my_champ_name]
      )
    end.sort_by { |item| [-item[:win_rate], -item[:match_count]] }
  end

  # 特定マッチアップの全試合記録と集計スタッツを返す
  def detail_for(champion_name:, opponent_champion_name:, position: nil)
    scope = base_scope.where(champion_name: champion_name, opponent_champion_name: opponent_champion_name)
    scope = scope.where(position: position) if position.present?

    parts = scope.includes(:match, :match_note, :champion, :opponent_champion)
                 .order(created_at: :desc)
                 .to_a

    return nil if parts.empty?

    champions_map = Champion.where(champion_name: [champion_name, opponent_champion_name]).index_by(&:champion_name)
    stats = calculate_stats_for_group(opponent_champion_name, parts)
    stats.merge(
      champion_name: champion_name,
      champion: champions_map[champion_name],
      opponent_champion: champions_map[opponent_champion_name],
      participants: parts
    )
  end

  SOLO_DUO_QUEUE_ID = 420 # Ranked Solo/Duo のみ

  private

  def base_scope
    summoner.match_participants
            .joins(:match)
            .where(matches: { queue_id: SOLO_DUO_QUEUE_ID })
            .where.not(opponent_champion_name: [nil, ""])
  end

  def calculate_stats_for_group(opp_name, parts)
    total = parts.size
    wins = parts.count(&:win)
    win_rate = ((wins.to_f / total) * 100).round(1)

    total_k = parts.sum(&:kills)
    total_d = parts.sum(&:deaths)
    total_a = parts.sum(&:assists)
    average_kda = ((total_k + total_a) / [total_d, 1].max.to_f).round(2)

    total_cs = parts.sum(&:cs)
    total_duration_sec = parts.sum { |p| p.match&.game_duration || 0 }
    average_cs_per_minute = if total_duration_sec.positive?
      (total_cs / (total_duration_sec / 60.0)).round(1)
    else
      0.0
    end

    notes = parts.map(&:match_note).compact
    hard_count = notes.count { |n| n.matchup_tag == "Hard" }
    even_count = notes.count { |n| n.matchup_tag == "Even" }
    easy_count = notes.count { |n| n.matchup_tag == "Easy" }
    latest_note = notes.max_by(&:created_at)

    {
      opponent_champion_name: opp_name,
      match_count: total,
      win_count: wins,
      win_rate: win_rate,
      average_kda: average_kda,
      average_cs_per_minute: average_cs_per_minute,
      hard_count: hard_count,
      even_count: even_count,
      easy_count: easy_count,
      latest_note: latest_note
    }
  end
end
