# frozen_string_literal: true

require "rails_helper"

RSpec.describe "GraphQL Abuse Protection", type: :request do
  let(:headers) { { "CONTENT_TYPE" => "application/json" } }

  describe "Query depth limit" do
    it "rejects queries with depth exceeding 12" do
      deep_query = <<~GQL
        query DeepQuery {
          __schema {
            types {
              fields {
                type {
                  ofType {
                    ofType {
                      ofType {
                        ofType {
                          ofType {
                            ofType {
                              ofType {
                                ofType {
                                  name
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      GQL

      post "/graphql", params: { query: deep_query }.to_json, headers: headers

      json = JSON.parse(response.body)
      expect(json["errors"]).to be_present
      expect(json["errors"].first["message"]).to match(/Query has depth of \d+, which exceeds max depth of 12/)
    end

    it "permits standard nested queries within max depth" do
      shallow_query = <<~GQL
        query ShallowQuery {
          __schema {
            queryType {
              name
            }
          }
        }
      GQL

      post "/graphql", params: { query: shallow_query }.to_json, headers: headers

      json = JSON.parse(response.body)
      expect(json["errors"]).to be_blank
      expect(json.dig("data", "__schema", "queryType", "name")).to eq("Query")
    end
  end

  describe "Query complexity limit" do
    it "rejects queries exceeding max complexity of 300" do
      aliased_fields = (1..305).map { |i| "f#{i}: __typename" }.join("\n")
      complex_query = "query HighComplexity {\n#{aliased_fields}\n}"

      post "/graphql", params: { query: complex_query }.to_json, headers: headers

      json = JSON.parse(response.body)
      expect(json["errors"]).to be_present
      expect(json["errors"].first["message"]).to match(/Query has complexity of \d+, which exceeds max complexity of 300/)
    end

    it "permits queries with complexity within limits" do
      aliased_fields = (1..20).map { |i| "f#{i}: __typename" }.join("\n")
      normal_query = "query NormalComplexity {\n#{aliased_fields}\n}"

      post "/graphql", params: { query: normal_query }.to_json, headers: headers

      json = JSON.parse(response.body)
      expect(json["errors"]).to be_blank
      expect(json.dig("data", "f1")).to eq("Query")
    end
  end

  describe "Query token limit" do
    it "rejects queries exceeding max query string tokens of 5000" do
      excessive_tokens = (1..5100).map { |i| "token#{i}" }.join(" ")
      token_bomb_query = "query TokenBomb { __typename #{excessive_tokens} }"

      post "/graphql", params: { query: token_bomb_query }.to_json, headers: headers

      json = JSON.parse(response.body)
      expect(json["errors"]).to be_present
      expect(json["errors"].first["message"]).to match(/too large to execute|tokens/i)
    end
  end
end
