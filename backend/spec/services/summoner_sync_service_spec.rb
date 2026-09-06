# frozen_string_literal: true

require "rails_helper"

RSpec.describe SummonerSyncService, type: :service do
  let(:mock_client) { instance_double(RiotApiClient) }
  subject(:service) { described_class.new(client: mock_client) }

  let(:puuid) { "test-puuid-12345" }
  let(:game_name) { "Sunny9" }
  let(:tag_line) { "hono" }

  describe "#sync" do
    context "1時間以内に同期済みのサモナーが存在する場合（キャッシュ有効）" do
      let!(:recent_summoner) do
        create(:summoner, game_name: game_name, tag_line: tag_line, last_synced_at: 30.minutes.ago)
      end

      it "APIキー未設定でも外部APIクライアントを初期化せずにDBから返却すること" do
        expect(RiotApiClient).not_to receive(:new)

        result = described_class.new.sync(game_name: game_name, tag_line: tag_line, force: false)
        expect(result.id).to eq(recent_summoner.id)
      end

      it "外部APIを呼び出さず、DBから即座にサモナーを返却すること" do
        expect(mock_client).not_to receive(:fetch_account_by_riot_id)

        result = service.sync(game_name: game_name, tag_line: tag_line, force: false)
        expect(result.id).to eq(recent_summoner.id)
      end

      it "force: true の場合はキャッシュをバイパスして外部APIから再同期すること" do
        allow(mock_client).to receive(:fetch_account_by_riot_id).with(game_name, tag_line).and_return(
          { "puuid" => recent_summoner.puuid, "gameName" => game_name, "tagLine" => tag_line }
        )
        allow(mock_client).to receive(:send).with(:infer_platform, tag_line).and_return("jp1")
        allow(mock_client).to receive(:send).with(:infer_region, "jp1").and_return("asia")
        allow(mock_client).to receive(:fetch_summoner_by_puuid).and_return(
          { "summonerLevel" => 85, "profileIconId" => 908 }
        )
        allow(mock_client).to receive(:fetch_match_ids_by_puuid).and_return([])

        result = service.sync(game_name: game_name, tag_line: tag_line, force: true)
        expect(result.reload.summoner_level).to eq(85)
      end
    end

    context "未登録または1時間以上経過したサモナーの場合" do
      let(:account_data) { { "puuid" => puuid, "gameName" => game_name, "tagLine" => tag_line } }
      let(:sum_data) { { "summonerLevel" => 100, "profileIconId" => 500 } }
      let(:match_id) { "JP1_999999" }
      let(:match_detail) do
        {
          "info" => {
            "gameMode" => "CLASSIC",
            "queueId" => 420,
            "gameDuration" => 1800,
            "gameCreation" => (Time.current.to_f * 1000).to_i,
            "participants" => [
              {
                "puuid" => puuid,
                "teamPosition" => "TOP",
                "teamId" => 100,
                "championName" => "Jax",
                "win" => true,
                "kills" => 7,
                "deaths" => 1,
                "assists" => 5,
                "totalMinionsKilled" => 160,
                "neutralMinionsKilled" => 10,
                "goldEarned" => 12500,
                "totalDamageDealtToChampions" => 21000,
                "item0" => 3078,
                "item1" => 0,
                "summoner1Id" => 12,
                "summoner2Id" => 4
              },
              {
                "puuid" => "opp-puuid",
                "teamPosition" => "TOP",
                "teamId" => 200,
                "championName" => "Aatrox"
              }
            ]
          }
        }
      end

      before do
        allow(mock_client).to receive(:fetch_account_by_riot_id).with(game_name, tag_line).and_return(account_data)
        allow(mock_client).to receive(:send).with(:infer_platform, tag_line).and_return("jp1")
        allow(mock_client).to receive(:send).with(:infer_region, "jp1").and_return("asia")
        allow(mock_client).to receive(:fetch_summoner_by_puuid).with(puuid, platform: "jp1").and_return(sum_data)
        allow(mock_client).to receive(:fetch_match_ids_by_puuid).and_return([ match_id ])
      end

      it "新規サモナー・試合・参加者レコードを保存し、タイムライン解析を適用すること" do
        allow(mock_client).to receive(:fetch_match_detail).with(match_id, region: "asia").and_return(match_detail)
        allow(mock_client).to receive(:fetch_match_timeline).with(match_id, region: "asia").and_return(nil)

        expect {
          service.sync(game_name: game_name, tag_line: tag_line)
        }.to change(Summoner, :count).by(1)
         .and change(Match, :count).by(1)
         .and change(MatchParticipant, :count).by(1)

        saved_sum = Summoner.find_by(puuid: puuid)
        expect(saved_sum.game_name).to eq(game_name)
        expect(saved_sum.summoner_level).to eq(100)

        saved_participant = MatchParticipant.find_by(summoner: saved_sum)
        expect(saved_participant.champion_name).to eq("Jax")
        expect(saved_participant.opponent_champion_name).to eq("Aatrox")
        expect(saved_participant.win).to be true
      end

      it "既にDBに存在する試合は外部APIから再取得せずスキップすること（差分・増分同期）" do
        # 事前に同じ試合をDBに登録（raw_info, raw_timeline 双方あり）
        create(:match, match_id: match_id, raw_info: match_detail, raw_timeline: { "metadata" => {} })

        # fetch_match_detail も fetch_match_timeline も呼ばれないはず
        expect(mock_client).not_to receive(:fetch_match_detail)
        expect(mock_client).not_to receive(:fetch_match_timeline)

        expect {
          service.sync(game_name: game_name, tag_line: tag_line)
        }.to change(Match, :count).by(0)
         .and change(MatchParticipant, :count).by(1)
      end

      it "複数回同期を実行しても同じレコードが二重作成されないこと（冪等性）" do
        allow(mock_client).to receive(:fetch_match_detail).and_return(match_detail)
        allow(mock_client).to receive(:fetch_match_timeline).and_return(nil)

        service.sync(game_name: game_name, tag_line: tag_line)
        expect {
          service.sync(game_name: game_name, tag_line: tag_line, force: true)
        }.not_to change(MatchParticipant, :count)
      end
    end

    context "アカウントが見つからない場合" do
      it "AccountNotFoundError を捕捉して nil を返すこと" do
        allow(mock_client).to receive(:fetch_account_by_riot_id).and_raise(RiotApiClient::AccountNotFoundError.new("not found"))

        result = service.sync(game_name: "Unknown", tag_line: "JP1")
        expect(result).to be_nil
      end
    end

    context "非公開アカウントの場合" do
      it "PrivateAccountError を捕捉して is_private: true で保存・返却すること" do
        allow(mock_client).to receive(:fetch_account_by_riot_id).and_raise(RiotApiClient::PrivateAccountError.new("private"))

        result = service.sync(game_name: "PrivateUser", tag_line: "JP1")
        expect(result).to be_present
        expect(result.is_private).to be true
      end
    end
  end

  describe "#backfill_past_matches" do
    let(:summoner) { create(:summoner, game_name: "TestUser", tag_line: "JP1", puuid: "test-backfill-puuid") }

    before do
      allow(mock_client).to receive(:send).with(:infer_platform, "JP1").and_return("jp1")
      allow(mock_client).to receive(:send).with(:infer_region, "jp1").and_return("asia")
    end

    it "指定オフセットから未登録の過去試合を取得して保存すること" do
      allow(mock_client).to receive(:fetch_match_ids_by_puuid)
        .with("test-backfill-puuid", start: 0, count: 30, queue: 420, region: "asia")
        .and_return([ "JP1_PAST_001", "JP1_PAST_002" ])

      detail1 = { "info" => { "gameMode" => "CLASSIC", "gameDuration" => 1500, "gameCreation" => 1_700_000_000_000, "queueId" => 420, "participants" => [ { "puuid" => "test-backfill-puuid", "championName" => "Jax", "win" => true } ] } }
      detail2 = { "info" => { "gameMode" => "CLASSIC", "gameDuration" => 1600, "gameCreation" => 1_699_900_000_000, "queueId" => 420, "participants" => [ { "puuid" => "test-backfill-puuid", "championName" => "Darius", "win" => false } ] } }

      allow(mock_client).to receive(:fetch_match_detail).with("JP1_PAST_001", region: "asia").and_return(detail1)
      allow(mock_client).to receive(:fetch_match_timeline).with("JP1_PAST_001", region: "asia").and_return(nil)
      allow(mock_client).to receive(:fetch_match_detail).with("JP1_PAST_002", region: "asia").and_return(detail2)
      allow(mock_client).to receive(:fetch_match_timeline).with("JP1_PAST_002", region: "asia").and_return(nil)

      expect {
        result = service.backfill_past_matches(summoner, count: 30, queue: 420)
        expect(result[:imported_count]).to eq(2)
        expect(result[:has_more]).to be false
      }.to change(Match, :count).by(2)
       .and change(MatchParticipant, :count).by(2)
    end
  end
end
