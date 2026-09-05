# frozen_string_literal: true

require "rails_helper"

RSpec.describe "CORS Policy", type: :request do
  after do
    ENV.delete("ALLOWED_ORIGINS")
  end

  describe "Origin header checks" do
    it "allows configured default localhost origins" do
      post "/graphql",
           params: { query: "{ __typename }" }.to_json,
           headers: { "Origin" => "http://localhost:3000", "CONTENT_TYPE" => "application/json" }

      expect(response.headers["Access-Control-Allow-Origin"]).to eq("http://localhost:3000")
    end

    it "allows configured default 127.0.0.1:3000 origin" do
      post "/graphql",
           params: { query: "{ __typename }" }.to_json,
           headers: { "Origin" => "http://127.0.0.1:3000", "CONTENT_TYPE" => "application/json" }

      expect(response.headers["Access-Control-Allow-Origin"]).to eq("http://127.0.0.1:3000")
    end

    it "blocks unlisted origins by omitting Access-Control-Allow-Origin" do
      post "/graphql",
           params: { query: "{ __typename }" }.to_json,
           headers: { "Origin" => "http://unauthorized-domain.com", "CONTENT_TYPE" => "application/json" }

      expect(response.headers["Access-Control-Allow-Origin"]).to be_nil
    end

    it "respects ALLOWED_ORIGINS environment variable when set" do
      ENV["ALLOWED_ORIGINS"] = "https://app.lol-analysis.com,https://preview.lol-analysis.com"

      post "/graphql",
           params: { query: "{ __typename }" }.to_json,
           headers: { "Origin" => "https://app.lol-analysis.com", "CONTENT_TYPE" => "application/json" }
      expect(response.headers["Access-Control-Allow-Origin"]).to eq("https://app.lol-analysis.com")

      post "/graphql",
           params: { query: "{ __typename }" }.to_json,
           headers: { "Origin" => "http://localhost:3000", "CONTENT_TYPE" => "application/json" }
      expect(response.headers["Access-Control-Allow-Origin"]).to be_nil
    end
  end

  describe "Preflight OPTIONS request" do
    it "responds successfully with allowed methods and headers" do
      options "/graphql",
              headers: {
                "Origin" => "http://localhost:3000",
                "Access-Control-Request-Method" => "POST",
                "Access-Control-Request-Headers" => "content-type,authorization"
              }

      expect(response).to have_http_status(:ok)
      expect(response.headers["Access-Control-Allow-Origin"]).to eq("http://localhost:3000")
      expect(response.headers["Access-Control-Allow-Methods"]).to include("POST")
    end
  end
end
