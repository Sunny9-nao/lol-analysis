# frozen_string_literal: true

require "rails_helper"

RSpec.describe MatchupAnalysisService do
  let(:summoner) { create(:summoner) }
  let(:service) { described_class.new(summoner: summoner) }

  # テストデータの準備
  let!(:classic_match1) { create(:match, game_mode: "CLASSIC", game_duration: 1800) } # 30分
  let!(:classic_match2) { create(:match, game_mode: "CLASSIC", game_duration: 1200) } # 20分
  let!(:classic_match3) { create(:match, game_mode: "CLASSIC", game_duration: 1500) } # 25分
  let!(:aram_match) { create(:match, game_mode: "ARAM", queue_id: 450, game_duration: 900) }

  describe "#played_champions" do
    before do
      # Jax TOP 2試合 (1勝1敗)
      create(:match_participant, summoner: summoner, match: classic_match1,
                                 champion_name: "Jax", opponent_champion_name: "Yorick",
                                 position: "TOP", win: true)
      create(:match_participant, summoner: summoner, match: classic_match2,
                                 champion_name: "Jax", opponent_champion_name: "Darius",
                                 position: "TOP", win: false)

      # Aatrox TOP 1試合 (1勝0敗)
      create(:match_participant, summoner: summoner, match: classic_match3,
                                 champion_name: "Aatrox", opponent_champion_name: "Darius",
                                 position: "TOP", win: true)

      # ARAMの試合 (除外対象)
      create(:match_participant, summoner: summoner, match: aram_match,
                                 champion_name: "Ezreal", opponent_champion_name: "Jinx",
                                 position: "BOTTOM", win: true)

      # 対面なしの試合 (除外対象)
      classic_match4 = create(:match, game_mode: "CLASSIC", game_duration: 1200)
      create(:match_participant, summoner: summoner, match: classic_match4,
                                 champion_name: "Jax", opponent_champion_name: nil,
                                 position: "TOP", win: true)
    end

    it "CLASSICモードかつ対面が存在する自チャンピオンの一覧を試合数降順で返す" do
      result = service.played_champions

      expect(result.size).to eq(2)
      expect(result.first[:champion_name]).to eq("Jax")
      expect(result.first[:match_count]).to eq(2)
      expect(result.first[:win_rate]).to eq(50.0)
      expect(result.first[:most_played_position]).to eq("TOP")

      expect(result.second[:champion_name]).to eq("Aatrox")
      expect(result.second[:match_count]).to eq(1)
      expect(result.second[:win_rate]).to eq(100.0)
    end

    it "position を指定した場合はそのポジションの試合のみで集計する" do
      result = service.played_champions(position: "BOTTOM")
      expect(result).to be_empty
    end
  end

  describe "#summaries_for" do
    let(:part1) do
      create(:match_participant, summoner: summoner, match: classic_match1,
                                 champion_name: "Jax", opponent_champion_name: "Darius",
                                 position: "TOP", win: true,
                                 kills: 6, deaths: 2, assists: 4, cs: 240) # 30分 240cs = 8.0 cs/min
    end
    let(:part2) do
      create(:match_participant, summoner: summoner, match: classic_match2,
                                 champion_name: "Jax", opponent_champion_name: "Darius",
                                 position: "TOP", win: false,
                                 kills: 2, deaths: 6, assists: 1, cs: 140) # 20分 140cs = 7.0 cs/min
    end
    let!(:part3) do
      create(:match_participant, summoner: summoner, match: classic_match3,
                                 champion_name: "Jax", opponent_champion_name: "Yorick",
                                 position: "TOP", win: true,
                                 kills: 5, deaths: 1, assists: 3, cs: 200) # 25分 200cs = 8.0 cs/min
    end
    let!(:note1) { create(:match_note, match_participant: part1, content: "耐えて後半勝ち", matchup_tag: "Hard", created_at: 1.day.ago) }
    let!(:note2) { create(:match_note, match_participant: part2, content: "序盤ソロキルで圧倒", matchup_tag: "Easy", created_at: Time.current) }

    before do
      part1
      part2
    end

    it "指定チャンピオンの対面ごとの戦績サマリを正確に計算して返す" do
      summaries = service.summaries_for(champion_name: "Jax")

      expect(summaries.size).to eq(2)

      darius_summary = summaries.find { |s| s[:opponent_champion_name] == "Darius" }
      expect(darius_summary).to be_present
      expect(darius_summary[:match_count]).to eq(2)
      expect(darius_summary[:win_rate]).to eq(50.0)
      # KDA: (6+4 + 2+1) / (2+6) = 13 / 8 = 1.63
      expect(darius_summary[:average_kda]).to eq(1.63)
      # CS/min: (240 + 140) / ((1800 + 1200) / 60.0) = 380 / 50.0 = 7.6
      expect(darius_summary[:average_cs_per_minute]).to eq(7.6)
      expect(darius_summary[:hard_count]).to eq(1)
      expect(darius_summary[:easy_count]).to eq(1)
      expect(darius_summary[:even_count]).to eq(0)
      expect(darius_summary[:latest_note]).to eq(note2)
    end
  end

  describe "#detail_for" do
    let!(:part1) do
      create(:match_participant, summoner: summoner, match: classic_match1,
                                 champion_name: "Jax", opponent_champion_name: "Darius",
                                 position: "TOP", win: true,
                                 kills: 6, deaths: 2, assists: 4, cs: 240)
    end
    let!(:note) { create(:match_note, match_participant: part1, content: "Eを温存する", matchup_tag: "Hard") }

    it "特定対面との全試合詳細と統計を返す" do
      detail = service.detail_for(champion_name: "Jax", opponent_champion_name: "Darius")

      expect(detail[:champion_name]).to eq("Jax")
      expect(detail[:opponent_champion_name]).to eq("Darius")
      expect(detail[:match_count]).to eq(1)
      expect(detail[:win_rate]).to eq(100.0)
      expect(detail[:average_kda]).to eq(5.0)
      expect(detail[:average_cs_per_minute]).to eq(8.0)
      expect(detail[:participants].first).to eq(part1)
      expect(detail[:participants].first.match_note).to eq(note)
    end
  end
end
