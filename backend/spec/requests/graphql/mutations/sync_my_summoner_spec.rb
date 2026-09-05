# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Mutations::SyncMySummoner", type: :request do
  let(:headers) { { "CONTENT_TYPE" => "application/json" } }
  let(:query) do
    <<~GQL
      mutation SyncMySummoner($input: SyncMySummonerInput!) {
        syncMySummoner(input: $input) {
          syncStatus
          errors
          summoner {
            id
            gameName
            syncStatus
          }
        }
      }
    GQL
  end

  let(:summoner) do
    Summoner.create!(
      puuid: "puuid-mutation-1",
      game_name: "SyncUser",
      tag_line: "JP1",
      sync_status: "idle"
    )
  end

  let(:user) do
    User.create!(
      email: "sync_test@example.com",
      password: "password123",
      summoner: summoner
    )
  end

  before do
    ActiveJob::Base.queue_adapter = :test
  end

  it "requires authentication" do
    post "/graphql", params: { query: query, variables: { input: {} } }.to_json, headers: headers
    json = JSON.parse(response.body)
    data = json.dig("data", "syncMySummoner")

    expect(data["errors"]).to include("ログインが必要です")
    expect(data["syncStatus"]).to be_nil
  end

  it "enqueues SyncSummonerJob for authenticated user" do
    auth_headers = headers.merge("Authorization" => "Bearer #{user.auth_token}")

    expect {
      post "/graphql", params: { query: query, variables: { input: { force: true } } }.to_json, headers: auth_headers
    }.to have_enqueued_job(SyncSummonerJob).with(summoner.id, force: true)

    json = JSON.parse(response.body)
    data = json.dig("data", "syncMySummoner")

    expect(data["errors"]).to be_empty
    expect(data["syncStatus"]).to eq("syncing")
    expect(data.dig("summoner", "syncStatus")).to eq("syncing")
    expect(summoner.reload.sync_status).to eq("syncing")
  end

  it "does not double enqueue if already syncing" do
    summoner.update!(sync_status: "syncing")
    auth_headers = headers.merge("Authorization" => "Bearer #{user.auth_token}")

    expect {
      post "/graphql", params: { query: query, variables: { input: { force: true } } }.to_json, headers: auth_headers
    }.not_to have_enqueued_job(SyncSummonerJob)

    json = JSON.parse(response.body)
    data = json.dig("data", "syncMySummoner")

    expect(data["errors"]).to be_empty
    expect(data["syncStatus"]).to eq("syncing")
  end
end
