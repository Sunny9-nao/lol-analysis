# frozen_string_literal: true

require "rails_helper"

RSpec.describe "GraphQL searchSummoner", type: :request do
  let(:query) do
    <<~GQL
      query SearchSummoner($gameName: String!, $tagLine: String!, $force: Boolean) {
        searchSummoner(gameName: $gameName, tagLine: $tagLine, force: $force) {
          id
          riotId
          summonerLevel
          profileIconUrl
          isPrivate
          recentWinRate
          matchParticipants {
            id
            championName
            opponentChampionName
            position
            win
            kills
            deaths
            assists
            kdaRatio
            cs
            items
          }
        }
      }
    GQL
  end

  context "DBにサモナーが存在する場合（キャッシュヒット）" do
    let!(:summoner) { create(:summoner, game_name: "Sunny9", tag_line: "hono", summoner_level: 84) }
    let!(:participant) do
      create(
        :match_participant,
        summoner: summoner,
        champion_name: "Jax",
        opponent_champion_name: "Yorick",
        win: false,
        kills: 4,
        deaths: 9,
        assists: 2,
        cs: 292,
        items: [ 6610, 3157, 6333 ]
      )
    end

    it "ローカルDBからサモナーと試合詳細（対面、アイテム、CS）を返す" do
      result = execute_graphql(query, variables: { gameName: "Sunny9", tagLine: "hono" })

      data = result.dig("data", "searchSummoner")
      expect(data).not_to be_nil
      expect(data["riotId"]).to eq("Sunny9#hono")
      expect(data["summonerLevel"]).to eq(84)
      expect(data["isPrivate"]).to be(false)

      participants = data["matchParticipants"]
      expect(participants.size).to eq(1)

      p = participants.first
      expect(p["championName"]).to eq("Jax")
      expect(p["opponentChampionName"]).to eq("Yorick")
      expect(p["kdaRatio"]).to eq(0.67)
      expect(p["cs"]).to eq(292)
      expect(p["items"]).to eq([ 6610, 3157, 6333 ])
    end
  end

  context "非公開サモナーの場合" do
    let!(:private_summoner) { create(:summoner, game_name: "SecretUser", tag_line: "JP1", is_private: true) }
    let!(:participant) { create(:match_participant, summoner: private_summoner) }

    it "isPrivate: true を返し、matchParticipants を空にする" do
      result = execute_graphql(query, variables: { gameName: "SecretUser", tagLine: "JP1" })

      data = result.dig("data", "searchSummoner")
      expect(data["isPrivate"]).to be(true)
      expect(data["matchParticipants"]).to eq([])
    end
  end

  context "サモナーが存在せず外部APIも404の場合" do
    before do
      stub_request(:get, %r{https://asia\.api\.riotgames\.com/riot/account/v1/accounts/by-riot-id/.*})
        .to_return(status: 404, body: '{"status":{"message":"Not Found","status_code":404}}')
    end

    it "searchSummoner が null になる" do
      result = execute_graphql(query, variables: { gameName: "NonExistent", tagLine: "NA1" })

      expect(result.dig("data", "searchSummoner")).to be_nil
      expect(result["errors"]).to be_nil
    end
  end
end
