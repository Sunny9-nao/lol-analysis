# frozen_string_literal: true

require "rails_helper"

RSpec.describe "deleteAccount mutation", type: :request do
  let(:headers) { { "CONTENT_TYPE" => "application/json" } }
  let(:mutation) do
    <<~GQL
      mutation DeleteAccount {
        deleteAccount(input: {}) {
          success
          errors
        }
      }
    GQL
  end

  let!(:user) { User.create!(email: "user_to_delete@example.com", password: "password123") }
  let!(:other_user) { User.create!(email: "keep_user@example.com", password: "password123") }

  let!(:summoner) do
    Summoner.create!(
      puuid: "puuid-123",
      game_name: "TestPlayer",
      tag_line: "JP1",
      summoner_level: 50,
      profile_icon_id: 1,
      last_synced_at: Time.current
    )
  end

  let!(:match) do
    Match.create!(
      match_id: "JP1_12345",
      game_mode: "CLASSIC",
      queue_id: 420,
      game_duration: 1800,
      game_creation: Time.current
    )
  end

  let!(:participant) do
    MatchParticipant.create!(
      summoner: summoner,
      match: match,
      champion_name: "Aatrox",
      win: true,
      kills: 5,
      deaths: 2,
      assists: 4,
      cs: 180,
      gold_earned: 12_000,
      total_damage_dealt: 25_000
    )
  end

  let!(:user_note) do
    MatchNote.create!(
      user: user,
      match_participant: participant,
      content: "Deleted user note",
      matchup_tag: "Easy"
    )
  end

  let!(:other_user_note) do
    MatchNote.create!(
      user: other_user,
      match_participant: participant,
      content: "Other user note must remain",
      matchup_tag: "Hard"
    )
  end

  context "認証済みユーザーの場合" do
    let(:auth_headers) { headers.merge("Authorization" => "Bearer #{user.auth_token}") }

    it "ユーザー自身と紐づく反省メモを完全に削除し、他ユーザーのデータには影響を与えないこと" do
      expect {
        post "/graphql", params: { query: mutation }.to_json, headers: auth_headers
      }.to change(User, :count).by(-1)
       .and change(MatchNote, :count).by(-1)

      json = JSON.parse(response.body)
      data = json.dig("data", "deleteAccount")
      expect(data["success"]).to be true
      expect(data["errors"]).to be_empty

      # 削除対象ユーザーが存在しないこと
      expect(User.find_by(id: user.id)).to be_nil
      expect(MatchNote.find_by(id: user_note.id)).to be_nil

      # 他ユーザーとそのメモ、公共のサモナー・試合レコードは安全に残っていること
      expect(User.find_by(id: other_user.id)).to be_present
      expect(MatchNote.find_by(id: other_user_note.id)).to be_present
      expect(Summoner.find_by(id: summoner.id)).to be_present
      expect(MatchParticipant.find_by(id: participant.id)).to be_present
    end
  end

  context "未認証ユーザーの場合" do
    it "エラーとなり削除されないこと" do
      expect {
        post "/graphql", params: { query: mutation }.to_json, headers: headers
      }.not_to change(User, :count)

      json = JSON.parse(response.body)
      data = json.dig("data", "deleteAccount")
      expect(data["success"]).to be false
      expect(data["errors"]).to include("ログインが必要です")
    end
  end
end
