# frozen_string_literal: true

require "rails_helper"

RSpec.describe "GraphQL N+1クエリ検証", type: :request do
  let(:query) do
    <<~GQL
      query GetSummonerMatches($gameName: String!, $tagLine: String!) {
        searchSummoner(gameName: $gameName, tagLine: $tagLine) {
          riotId
          matchParticipants {
            id
            championName
            gameMode
            gameCreation
            matchNote {
              id
              content
            }
          }
        }
      }
    GQL
  end

  it "試合数が増加してもSQLクエリ発行回数が一定であること" do
    # サモナーA: 1試合
    summoner_a = create(:summoner, game_name: "PlayerA", tag_line: "JP1")
    p_a = create(:match_participant, summoner: summoner_a)
    create(:match_note, match_participant: p_a)

    # サモナーB: 5試合
    summoner_b = create(:summoner, game_name: "PlayerB", tag_line: "JP1")
    5.times do
      p_b = create(:match_participant, summoner: summoner_b)
      create(:match_note, match_participant: p_b)
    end

    # 1試合のクエリ数を計測
    queries_for_one = count_queries do
      execute_graphql(query, variables: { gameName: "PlayerA", tagLine: "JP1" })
    end

    # 5試合のクエリ数を計測
    queries_for_five = count_queries do
      execute_graphql(query, variables: { gameName: "PlayerB", tagLine: "JP1" })
    end

    # N+1が解消されていれば、1試合でも5試合でもクエリ数は同一（一定）になるはず
    expect(queries_for_five).to eq(queries_for_one)
  end
end
