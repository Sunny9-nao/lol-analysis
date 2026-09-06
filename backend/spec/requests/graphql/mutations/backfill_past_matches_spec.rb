# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Mutations::BackfillPastMatches", type: :request do
  let(:headers) { { "CONTENT_TYPE" => "application/json" } }
  let(:query) do
    <<~GQL
      mutation BackfillPastMatches($input: BackfillPastMatchesInput!) {
        backfillPastMatches(input: $input) {
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
      puuid: "puuid-backfill-1",
      game_name: "BackfillUser",
      tag_line: "JP1",
      sync_status: "idle"
    )
  end

  let(:user) do
    User.create!(
      email: "backfill_test@example.com",
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
    data = json.dig("data", "backfillPastMatches")

    expect(data["errors"]).to include("ログインが必要です")
    expect(data["syncStatus"]).to be_nil
  end

  it "returns error if user has no summoner linked" do
    user_without_summoner = User.create!(
      email: "no_summoner@example.com",
      password: "password123"
    )
    auth_headers = headers.merge("Authorization" => "Bearer #{user_without_summoner.auth_token}")

    post "/graphql", params: { query: query, variables: { input: {} } }.to_json, headers: auth_headers
    json = JSON.parse(response.body)
    data = json.dig("data", "backfillPastMatches")

    expect(data["errors"]).to include("連携されているサモナーがありません")
  end

  it "enqueues BackfillMatchesJob for authenticated user with default count" do
    auth_headers = headers.merge("Authorization" => "Bearer #{user.auth_token}")

    expect {
      post "/graphql", params: { query: query, variables: { input: {} } }.to_json, headers: auth_headers
    }.to have_enqueued_job(BackfillMatchesJob).with(summoner.id, count: 30)

    json = JSON.parse(response.body)
    data = json.dig("data", "backfillPastMatches")

    expect(data["errors"]).to be_empty
    expect(data["syncStatus"]).to eq("syncing")
    expect(data.dig("summoner", "syncStatus")).to eq("syncing")
    expect(summoner.reload.sync_status).to eq("syncing")
  end

  it "enqueues BackfillMatchesJob with custom count" do
    auth_headers = headers.merge("Authorization" => "Bearer #{user.auth_token}")

    expect {
      post "/graphql", params: { query: query, variables: { input: { count: 30 } } }.to_json, headers: auth_headers
    }.to have_enqueued_job(BackfillMatchesJob).with(summoner.id, count: 30)

    json = JSON.parse(response.body)
    data = json.dig("data", "backfillPastMatches")

    expect(data["errors"]).to be_empty
    expect(data["syncStatus"]).to eq("syncing")
  end

  it "does not double enqueue if already syncing" do
    summoner.update!(sync_status: "syncing")
    auth_headers = headers.merge("Authorization" => "Bearer #{user.auth_token}")

    expect {
      post "/graphql", params: { query: query, variables: { input: {} } }.to_json, headers: auth_headers
    }.not_to have_enqueued_job(BackfillMatchesJob)

    json = JSON.parse(response.body)
    data = json.dig("data", "backfillPastMatches")

    expect(data["errors"]).to be_empty
    expect(data["syncStatus"]).to eq("syncing")
  end

  it "enqueues job if previous sync is stale (> 2 minutes)" do
    summoner.update!(sync_status: "syncing")
    summoner.update_columns(updated_at: 3.minutes.ago)
    auth_headers = headers.merge("Authorization" => "Bearer #{user.auth_token}")

    expect {
      post "/graphql", params: { query: query, variables: { input: {} } }.to_json, headers: auth_headers
    }.to have_enqueued_job(BackfillMatchesJob).with(summoner.id, count: 30)

    json = JSON.parse(response.body)
    data = json.dig("data", "backfillPastMatches")

    expect(data["errors"]).to be_empty
    expect(data["syncStatus"]).to eq("syncing")
  end

  it "returns idle immediately without enqueueing if summoner is sample" do
    sample_summoner = Summoner.create!(
      puuid: "sample_sunny9",
      game_name: "Sunny9",
      tag_line: "hono",
      sync_status: "idle"
    )
    sample_user = User.create!(
      email: "sample_user@example.com",
      password: "password123",
      summoner: sample_summoner
    )
    auth_headers = headers.merge("Authorization" => "Bearer #{sample_user.auth_token}")

    expect {
      post "/graphql", params: { query: query, variables: { input: {} } }.to_json, headers: auth_headers
    }.not_to have_enqueued_job(BackfillMatchesJob)

    json = JSON.parse(response.body)
    data = json.dig("data", "backfillPastMatches")

    expect(data["errors"]).to be_empty
    expect(data["syncStatus"]).to eq("idle")
  end
end
