# frozen_string_literal: true

require "rails_helper"

RSpec.describe "MY_SUMMONER_QUERY test", type: :request do
  let(:headers) { { "CONTENT_TYPE" => "application/json" } }
  let(:query) do
    <<~GQL
      query MySummoner($force: Boolean) {
        mySummoner(force: $force) {
          id
          puuid
          gameName
          tagLine
          riotId
          summonerLevel
          profileIconId
          profileIconUrl
          isPrivate
          lastSyncedAt
          recentWinRate
          syncStatus
          syncError
          matchParticipants {
            id
            matchId
            championName
            opponentChampionName
            position
            win
            kills
            deaths
            assists
            kdaRatio
            cs
            goldEarned
            totalDamageDealt
            items
            spells
            formattedDuration
            gameMode
            queueId
            queueName
            gameCreation
            champion {
              name
              title
              imageUrl
            }
            opponentChampion {
              name
              title
              imageUrl
            }
            matchNote {
              id
              content
              matchupTag
              updatedAt
            }
            earlyItems {
              timestamp
              itemId
            }
            goldTimeline {
              minute
              goldDiff
              myGold
              oppGold
            }
            killEvents {
              minute
              timestamp
              category
              label
              killer
              victim
            }
            itemTimeline {
              timestamp
              itemId
            }
          }
          playedChampions {
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

  let(:summoner) do
    Summoner.create!(
      puuid: "puuid-test-debug",
      game_name: "Sunny9",
      tag_line: "hono",
      sync_status: "idle"
    )
  end

  let(:user) do
    User.create!(
      email: "ashcelery46@gmail.com",
      password: "password123",
      summoner: summoner
    )
  end

  it "executes MY_SUMMONER_QUERY without 500" do
    auth_headers = headers.merge("Authorization" => "Bearer #{user.auth_token}")
    post "/graphql", params: { query: query, variables: { force: false } }.to_json, headers: auth_headers

    expect(response.status).to eq(200)
    json = JSON.parse(response.body)
    expect(json["errors"]).to be_nil
    expect(json.dig("data", "mySummoner", "gameName")).to eq("Sunny9")
  end

  it "executes MY_SUMMONER_QUERY with matches and stale sync" do
    summoner.update!(sync_status: "syncing")
    summoner.update_columns(updated_at: 5.minutes.ago)

    match = Match.create!(
      match_id: "JP1_12345",
      game_mode: "CLASSIC",
      queue_id: 420,
      game_duration: 1800,
      game_creation: Time.current
    )

    MatchParticipant.create!(
      summoner: summoner,
      match: match,
      champion_name: "Jax",
      opponent_champion_name: "Aatrox",
      position: "TOP",
      win: true,
      kills: 5,
      deaths: 1,
      assists: 3,
      cs: 150,
      gold_earned: 10000,
      total_damage_dealt: 15000,
      items: [ 1055, 3078 ],
      spells: [ 4, 12 ]
    )

    auth_headers = headers.merge("Authorization" => "Bearer #{user.auth_token}")
    post "/graphql", params: { query: query, variables: { force: false } }.to_json, headers: auth_headers

    expect(response.status).to eq(200)
    json = JSON.parse(response.body)
    expect(json["errors"]).to be_nil
    expect(json.dig("data", "mySummoner", "syncStatus")).to eq("failed")
  end
end
