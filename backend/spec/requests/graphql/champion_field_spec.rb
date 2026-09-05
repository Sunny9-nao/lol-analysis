# frozen_string_literal: true

require "rails_helper"

RSpec.describe "GraphQL チャンピオンマスタ情報取得", type: :request do
  let(:query) do
    <<~GQL
      query GetParticipantWithChampion($gameName: String!, $tagLine: String!) {
        searchSummoner(gameName: $gameName, tagLine: $tagLine) {
          matchParticipants {
            id
            championName
            champion {
              championName
              name
              title
              imageUrl
            }
            opponentChampion {
              championName
              name
              title
              imageUrl
            }
          }
        }
      }
    GQL
  end

  let!(:summoner) { create(:summoner, game_name: "Sunny9", tag_line: "hono") }
  let!(:jax) { create(:champion, champion_name: "Jax", name: "ジャックス", title: "武器の達人") }
  let!(:yorick) { create(:champion, champion_name: "Yorick", name: "ヨリック", title: "魂の導き手") }

  let!(:participant) do
    create(
      :match_participant,
      summoner: summoner,
      champion_name: "Jax",
      opponent_champion_name: "Yorick"
    )
  end

  it "自チャンプおよび対面チャンプのマスタ情報（日本語名、称号、画像）を正常に取得できること" do
    result = execute_graphql(query, variables: { gameName: "Sunny9", tagLine: "hono" })

    data = result.dig("data", "searchSummoner", "matchParticipants", 0)
    expect(result["errors"]).to be_nil
    expect(data).not_to be_nil

    # 自チャンピオンのマスタ
    champ = data["champion"]
    expect(champ["championName"]).to eq("Jax")
    expect(champ["name"]).to eq("ジャックス")
    expect(champ["title"]).to eq("武器の達人")

    # 対面チャンピオンのマスタ
    opp_champ = data["opponentChampion"]
    expect(opp_champ["championName"]).to eq("Yorick")
    expect(opp_champ["name"]).to eq("ヨリック")
    expect(opp_champ["title"]).to eq("魂の導き手")
  end
end
