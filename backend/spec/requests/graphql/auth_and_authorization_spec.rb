# frozen_string_literal: true

require "rails_helper"

RSpec.describe "GraphQL Authentication & Authorization", type: :request do
  let(:headers) { { "CONTENT_TYPE" => "application/json" } }

  describe "signUp mutation" do
    let(:mutation) do
      <<~GQL
        mutation SignUp($email: String!, $password: String!) {
          signUp(input: { email: $email, password: $password }) {
            user { id email }
            authToken
            errors
          }
        }
      GQL
    end

    it "creates a new user and returns auth token" do
      post "/graphql", params: { query: mutation, variables: { email: "newuser@example.com", password: "password123" } }.to_json, headers: headers

      json = JSON.parse(response.body)
      data = json.dig("data", "signUp")
      expect(data["errors"]).to be_empty
      expect(data["authToken"]).to be_present
      expect(data.dig("user", "email")).to eq("newuser@example.com")
    end

    it "returns error on duplicate email" do
      User.create!(email: "existing@example.com", password: "password123")

      post "/graphql", params: { query: mutation, variables: { email: "existing@example.com", password: "password123" } }.to_json, headers: headers

      json = JSON.parse(response.body)
      data = json.dig("data", "signUp")
      expect(data["errors"]).to include("Email has already been taken")
    end
  end

  describe "signIn mutation" do
    let!(:user) { User.create!(email: "login@example.com", password: "securepassword") }

    let(:mutation) do
      <<~GQL
        mutation SignIn($email: String!, $password: String!) {
          signIn(input: { email: $email, password: $password }) {
            user { id email }
            authToken
            errors
          }
        }
      GQL
    end

    it "authenticates with valid credentials" do
      post "/graphql", params: { query: mutation, variables: { email: "login@example.com", password: "securepassword" } }.to_json, headers: headers

      json = JSON.parse(response.body)
      data = json.dig("data", "signIn")
      expect(data["errors"]).to be_empty
      expect(data["authToken"]).to eq(user.auth_token)
    end

    it "fails with invalid password" do
      post "/graphql", params: { query: mutation, variables: { email: "login@example.com", password: "wrongpassword" } }.to_json, headers: headers

      json = JSON.parse(response.body)
      data = json.dig("data", "signIn")
      expect(data["errors"]).to include("メールアドレスまたはパスワードが正しくありません")
      expect(data["authToken"]).to be_nil
    end
  end

  describe "mySummoner query" do
    let(:summoner) { create(:summoner, game_name: "MySumm", tag_line: "JP1") }
    let(:user) { User.create!(email: "summ_owner@example.com", password: "password123", summoner: summoner) }

    let(:query) do
      <<~GQL
        query {
          mySummoner {
            id
            gameName
            tagLine
          }
        }
      GQL
    end

    it "returns null when not authenticated" do
      post "/graphql", params: { query: query }.to_json, headers: headers

      json = JSON.parse(response.body)
      expect(json.dig("data", "mySummoner")).to be_nil
    end

    it "returns user's own summoner when authenticated" do
      auth_headers = headers.merge("Authorization" => "Bearer #{user.auth_token}")
      post "/graphql", params: { query: query }.to_json, headers: auth_headers

      json = JSON.parse(response.body)
      data = json.dig("data", "mySummoner")
      expect(data["gameName"]).to eq("MySumm")
      expect(data["tagLine"]).to eq("JP1")
    end
  end

  describe "saveMatchNote authorization guard (P0)" do
    let(:my_summoner) { create(:summoner, game_name: "Owner", tag_line: "JP1") }
    let(:other_summoner) { create(:summoner, game_name: "Victim", tag_line: "JP1") }

    let(:user) { User.create!(email: "owner@example.com", password: "password123", summoner: my_summoner) }

    let(:match) { create(:match) }
    let(:my_participant) { create(:match_participant, summoner: my_summoner, match: match) }
    let(:other_participant) { create(:match_participant, summoner: other_summoner, match: match) }

    let(:mutation) do
      <<~GQL
        mutation SaveMatchNote($matchParticipantId: ID!, $content: String!, $matchupTag: String) {
          saveMatchNote(input: { matchParticipantId: $matchParticipantId, content: $content, matchupTag: $matchupTag }) {
            matchNote {
              id
              content
              matchupTag
            }
            errors
          }
        }
      GQL
    end

    it "rejects when unauthenticated" do
      post "/graphql", params: {
        query: mutation,
        variables: {
          matchParticipantId: my_participant.id.to_s,
          content: "未ログイン保存"
        }
      }.to_json, headers: headers

      json = JSON.parse(response.body)
      data = json.dig("data", "saveMatchNote")
      expect(data["errors"]).to include("ログインが必要です")
      expect(data["matchNote"]).to be_nil
    end

    it "strictly rejects editing other person's match note (CRITICAL P0)" do
      auth_headers = headers.merge("Authorization" => "Bearer #{user.auth_token}")

      post "/graphql", params: {
        query: mutation,
        variables: {
          matchParticipantId: other_participant.id.to_s,
          content: "他人のメモを不正改ざんしようとする"
        }
      }.to_json, headers: auth_headers

      json = JSON.parse(response.body)
      data = json.dig("data", "saveMatchNote")
      expect(data["errors"]).to include("権限がありません (他者の試合メモは編集できません)")
      expect(data["matchNote"]).to be_nil

      # DBにメモが作成されていないこと
      expect(other_participant.reload.match_note).to be_nil
    end

    it "allows editing user's own match note" do
      auth_headers = headers.merge("Authorization" => "Bearer #{user.auth_token}")

      post "/graphql", params: {
        query: mutation,
        variables: {
          matchParticipantId: my_participant.id.to_s,
          content: "自分の試合の正しい反省メモ",
          matchupTag: "Hard"
        }
      }.to_json, headers: auth_headers

      json = JSON.parse(response.body)
      data = json.dig("data", "saveMatchNote")
      expect(data["errors"]).to be_empty
      expect(data.dig("matchNote", "content")).to eq("自分の試合の正しい反省メモ")
      expect(data.dig("matchNote", "matchupTag")).to eq("Hard")

      # DBに永続化されていること
      expect(my_participant.reload.match_note.content).to eq("自分の試合の正しい反省メモ")
    end
  end
end
