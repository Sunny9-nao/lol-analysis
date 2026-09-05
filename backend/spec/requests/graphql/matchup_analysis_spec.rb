# frozen_string_literal: true

require "rails_helper"

RSpec.describe "GraphQL Matchup Analysis Queries", type: :request do
  let!(:summoner) { create(:summoner, game_name: "Sunny9", tag_line: "hono") }

  let!(:jax) do
    create(:champion, champion_name: "Jax", name: "ジャックス", title: "武器の達人",
                      image_url: "https://ddragon.leagueoflegends.com/cdn/14.24.1/img/champion/Jax.png")
  end
  let!(:darius) do
    create(:champion, champion_name: "Darius", name: "ダリウス", title: "ノクサスの戦斧",
                      image_url: "https://ddragon.leagueoflegends.com/cdn/14.24.1/img/champion/Darius.png")
  end
  let!(:yorick) do
    create(:champion, champion_name: "Yorick", name: "ヨリック", title: "魂の導き手",
                      image_url: "https://ddragon.leagueoflegends.com/cdn/14.24.1/img/champion/Yorick.png")
  end

  let!(:match1) { create(:match, game_mode: "CLASSIC", game_duration: 1800) } # 30分
  let!(:match2) { create(:match, game_mode: "CLASSIC", game_duration: 1200) } # 20分

  let!(:part1) do
    create(:match_participant, summoner: summoner, match: match1,
                               champion_name: "Jax", opponent_champion_name: "Darius",
                               position: "TOP", win: true,
                               kills: 6, deaths: 2, assists: 4, cs: 240, items: [ 3078, 3153 ])
  end
  let!(:part2) do
    create(:match_participant, summoner: summoner, match: match2,
                               champion_name: "Jax", opponent_champion_name: "Darius",
                               position: "TOP", win: false,
                               kills: 2, deaths: 6, assists: 1, cs: 140, items: [ 3078 ])
  end

  let!(:note1) { create(:match_note, match_participant: part1, content: "耐えて後半勝ち", matchup_tag: "Hard", created_at: 1.day.ago) }
  let!(:note2) { create(:match_note, match_participant: part2, content: "ソロキルされた", matchup_tag: "Hard", created_at: Time.current) }

  describe "playedChampions" do
    let(:query) do
      <<~GQL
        query GetPlayedChampions($gameName: String!, $tagLine: String!, $position: String) {
          searchSummoner(gameName: $gameName, tagLine: $tagLine) {
            playedChampions(position: $position) {
              championName
              matchCount
              winCount
              winRate
              mostPlayedPosition
              champion {
                name
                title
                imageUrl
              }
            }
          }
        }
      GQL
    end

    it "使用チャンピオン一覧とサマリ情報を返す" do
      result = execute_graphql(query, variables: { gameName: "Sunny9", tagLine: "hono" })
      played = result.dig("data", "searchSummoner", "playedChampions")

      expect(played).not_to be_nil
      expect(played.size).to eq(1)

      first_champ = played.first
      expect(first_champ["championName"]).to eq("Jax")
      expect(first_champ["matchCount"]).to eq(2)
      expect(first_champ["winCount"]).to eq(1)
      expect(first_champ["winRate"]).to eq(50.0)
      expect(first_champ["mostPlayedPosition"]).to eq("TOP")
      expect(first_champ.dig("champion", "name")).to eq("ジャックス")
    end

    it "該当のないポジションでフィルタした場合は空配列を返す" do
      result = execute_graphql(query, variables: { gameName: "Sunny9", tagLine: "hono", position: "BOTTOM" })
      played = result.dig("data", "searchSummoner", "playedChampions")

      expect(played).to eq([])
    end
  end

  describe "matchupSummaries" do
    let(:query) do
      <<~GQL
        query GetMatchupSummaries($gameName: String!, $tagLine: String!, $championName: String!, $position: String) {
          searchSummoner(gameName: $gameName, tagLine: $tagLine) {
            matchupSummaries(championName: $championName, position: $position) {
              opponentChampionName
              matchCount
              winCount
              winRate
              averageKda
              averageCsPerMinute
              hardCount
              evenCount
              easyCount
              latestNote {
                content
                matchupTag
              }
              opponentChampion {
                name
                title
                imageUrl
              }
            }
          }
        }
      GQL
    end

    it "対面チャンピオンごとの集計サマリを返す" do
      result = execute_graphql(query, variables: { gameName: "Sunny9", tagLine: "hono", championName: "Jax" })
      summaries = result.dig("data", "searchSummoner", "matchupSummaries")

      expect(summaries).not_to be_nil
      expect(summaries.size).to eq(1)

      darius_summary = summaries.first
      expect(darius_summary["opponentChampionName"]).to eq("Darius")
      expect(darius_summary["matchCount"]).to eq(2)
      expect(darius_summary["winCount"]).to eq(1)
      expect(darius_summary["winRate"]).to eq(50.0)
      expect(darius_summary["averageKda"]).to eq(1.63)
      expect(darius_summary["averageCsPerMinute"]).to eq(7.6)
      expect(darius_summary["hardCount"]).to eq(2)
      expect(darius_summary["evenCount"]).to eq(0)
      expect(darius_summary["easyCount"]).to eq(0)
      expect(darius_summary.dig("latestNote", "content")).to eq("ソロキルされた")
      expect(darius_summary.dig("opponentChampion", "name")).to eq("ダリウス")
    end
  end

  describe "matchupDetail" do
    let(:query) do
      <<~GQL
        query GetMatchupDetail($gameName: String!, $tagLine: String!, $championName: String!, $opponentChampionName: String!, $position: String) {
          searchSummoner(gameName: $gameName, tagLine: $tagLine) {
            matchupDetail(championName: $championName, opponentChampionName: $opponentChampionName, position: $position) {
              championName
              opponentChampionName
              matchCount
              winRate
              averageKda
              averageCsPerMinute
              champion {
                name
              }
              opponentChampion {
                name
              }
              participants {
                id
                win
                kills
                deaths
                assists
                kdaRatio
                cs
                items
                matchNote {
                  content
                  matchupTag
                }
              }
            }
          }
        }
      GQL
    end

    it "特定対面との全試合詳細と統計を返す" do
      result = execute_graphql(query, variables: {
        gameName: "Sunny9",
        tagLine: "hono",
        championName: "Jax",
        opponentChampionName: "Darius"
      })
      detail = result.dig("data", "searchSummoner", "matchupDetail")

      expect(detail).not_to be_nil
      expect(detail["championName"]).to eq("Jax")
      expect(detail["opponentChampionName"]).to eq("Darius")
      expect(detail["matchCount"]).to eq(2)
      expect(detail["winRate"]).to eq(50.0)
      expect(detail.dig("champion", "name")).to eq("ジャックス")
      expect(detail.dig("opponentChampion", "name")).to eq("ダリウス")

      parts = detail["participants"]
      expect(parts.size).to eq(2)
      expect(parts.map { |p| p.dig("matchNote", "content") }).to include("耐えて後半勝ち", "ソロキルされた")
    end
  end

  describe "N+1 クエリ検証" do
    let(:summary_query) do
      <<~GQL
        query GetMatchupSummaries($gameName: String!, $tagLine: String!, $championName: String!) {
          searchSummoner(gameName: $gameName, tagLine: $tagLine) {
            matchupSummaries(championName: $championName) {
              opponentChampionName
              matchCount
              winRate
              averageKda
              latestNote {
                content
              }
              opponentChampion {
                name
                imageUrl
              }
            }
          }
        }
      GQL
    end

    it "対面数や試合数が増加してもクエリ発行回数が急増しないこと" do
      # 1対面の状態でのクエリ数
      count_before = count_queries do
        execute_graphql(summary_query, variables: { gameName: "Sunny9", tagLine: "hono", championName: "Jax" })
      end

      # 新しい対面 Yorick を3試合追加
      3.times do
        m = create(:match, game_mode: "CLASSIC", game_duration: 1500)
        p = create(:match_participant, summoner: summoner, match: m,
                                       champion_name: "Jax", opponent_champion_name: "Yorick",
                                       position: "TOP", win: true)
        create(:match_note, match_participant: p, content: "対ヨリックメモ")
      end

      count_after = count_queries do
        execute_graphql(summary_query, variables: { gameName: "Sunny9", tagLine: "hono", championName: "Jax" })
      end

      # 試合数・対面数が増えてもクエリ数は一定
      expect(count_after).to eq(count_before)
    end
  end
end
