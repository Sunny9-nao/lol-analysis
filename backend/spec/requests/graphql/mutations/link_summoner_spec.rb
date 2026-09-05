# frozen_string_literal: true

require "rails_helper"

RSpec.describe "linkSummoner mutation", type: :request do
  let(:headers) { { "CONTENT_TYPE" => "application/json" } }
  let(:mutation) do
    <<~GQL
      mutation LinkSummoner($input: LinkSummonerInput!) {
        linkSummoner(input: $input) {
          user {
            id
            email
          }
          summoner {
            id
            riotId
          }
          errors
        }
      }
    GQL
  end

  let!(:user) { create(:user) }
  let(:auth_headers) { headers.merge("Authorization" => "Bearer #{user.auth_token}") }

  context "認証済みユーザーの場合" do
    let(:mock_sync_service) { instance_double(SummonerSyncService) }

    before do
      allow(SummonerSyncService).to receive(:new).and_return(mock_sync_service)
    end

    it "有効なRiot IDでサモナーが同期され、ユーザーに紐づけられること" do
      synced_summoner = create(:summoner, game_name: "ProPlayer", tag_line: "KR1")
      allow(mock_sync_service).to receive(:sync).with(game_name: "ProPlayer", tag_line: "KR1", force: true).and_return(synced_summoner)

      variables = { input: { gameName: "ProPlayer", tagLine: "KR1" } }
      post "/graphql", params: { query: mutation, variables: variables }.to_json, headers: auth_headers

      json = JSON.parse(response.body)
      data = json.dig("data", "linkSummoner")

      expect(data["errors"]).to be_empty
      expect(data.dig("summoner", "riotId")).to eq("ProPlayer#KR1")
      expect(user.reload.summoner_id).to eq(synced_summoner.id)
    end

    it "存在しないRiot IDの場合、エラーメッセージが返ること" do
      allow(mock_sync_service).to receive(:sync).and_return(nil)

      variables = { input: { gameName: "NoSuchPlayer", tagLine: "NA1" } }
      post "/graphql", params: { query: mutation, variables: variables }.to_json, headers: auth_headers

      json = JSON.parse(response.body)
      data = json.dig("data", "linkSummoner")

      expect(data["errors"]).to include("サモナー情報の取得に失敗しました。Riot IDを確認してください。")
      expect(data["summoner"]).to be_nil
    end
  end

  context "未認証ユーザーの場合" do
    it "ログインが必要である旨のエラーが返ること" do
      variables = { input: { gameName: "AnyPlayer", tagLine: "JP1" } }
      post "/graphql", params: { query: mutation, variables: variables }.to_json, headers: headers

      json = JSON.parse(response.body)
      data = json.dig("data", "linkSummoner")

      expect(data["errors"]).to include("ログインが必要です")
      expect(data["summoner"]).to be_nil
    end
  end
end
