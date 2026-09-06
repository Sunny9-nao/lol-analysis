# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Mutations::ResetSummonerSyncStatus", type: :request do
  let(:headers) { { "CONTENT_TYPE" => "application/json" } }
  let(:query) do
    <<~GQL
      mutation ResetSummonerSyncStatus {
        resetSummonerSyncStatus(input: {}) {
          success
          errors
          summoner {
            id
            syncStatus
            syncError
          }
        }
      }
    GQL
  end

  let(:summoner) do
    Summoner.create!(
      puuid: "puuid-reset-1",
      game_name: "ResetUser",
      tag_line: "JP1",
      sync_status: "syncing",
      sync_error: "Some error"
    )
  end

  let(:user) do
    User.create!(
      email: "reset_test@example.com",
      password: "password123",
      summoner: summoner
    )
  end

  it "requires authentication" do
    post "/graphql", params: { query: query }.to_json, headers: headers
    json = JSON.parse(response.body)
    data = json.dig("data", "resetSummonerSyncStatus")

    expect(data["success"]).to be false
    expect(data["errors"]).to include("ログインが必要です")
  end

  it "resets syncing summoner to idle successfully" do
    auth_headers = headers.merge("Authorization" => "Bearer #{user.auth_token}")

    post "/graphql", params: { query: query }.to_json, headers: auth_headers
    json = JSON.parse(response.body)
    data = json.dig("data", "resetSummonerSyncStatus")

    expect(data["success"]).to be true
    expect(data["errors"]).to be_empty
    expect(data.dig("summoner", "syncStatus")).to eq("idle")
    expect(data.dig("summoner", "syncError")).to be_nil

    summoner.reload
    expect(summoner.sync_status).to eq("idle")
    expect(summoner.sync_error).to be_nil
  end
end
