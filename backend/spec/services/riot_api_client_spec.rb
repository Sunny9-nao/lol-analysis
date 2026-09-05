# frozen_string_literal: true

require "rails_helper"

RSpec.describe RiotApiClient, type: :service do
  let(:api_key) { "RGAPI-test-api-key" }
  let(:client) { described_class.new(api_key: api_key) }

  before do
    described_class.reset_rate_limit!
    # テスト高速化のため sleep 呼び出しをモック化
    allow(client).to receive(:sleep_duration)
  end

  after do
    described_class.reset_rate_limit!
  end

  describe "#initialize" do
    it "APIキーが指定されていない場合は例外を発生させること" do
      expect { described_class.new(api_key: nil) }.to raise_error(RiotApiClient::RiotApiError, /RIOT_API_KEY is not configured/)
      expect { described_class.new(api_key: "") }.to raise_error(RiotApiClient::RiotApiError, /RIOT_API_KEY is not configured/)
    end
  end

  describe "HTTP リクエストとエラー耐障害性 (get_json)" do
    let(:host) { "https://asia.api.riotgames.com" }
    let(:path) { "/test/endpoint" }
    let(:url) { "#{host}#{path}" }

    it "200 OK のレスポンスを正しく JSON パースして返すこと" do
      stub_request(:get, url)
        .with(headers: { "X-Riot-Token" => api_key })
        .to_return(status: 200, body: '{"success": true}', headers: { "Content-Type" => "application/json" })

      result = client.send(:get_json, host, path)
      expect(result).to eq("success" => true)
    end

    it "404 の場合は AccountNotFoundError を即座に発生させること (リトライなし)" do
      stub_request(:get, url).to_return(status: 404, body: '{"status":{"message":"Not Found"}}')

      expect {
        client.send(:get_json, host, path)
      }.to raise_error(RiotApiClient::AccountNotFoundError, /Resource not found/)
    end

    it "403 の場合は PrivateAccountError を即座に発生させること (リトライなし)" do
      stub_request(:get, url).to_return(status: 403, body: '{"status":{"message":"Forbidden"}}')

      expect {
        client.send(:get_json, host, path)
      }.to raise_error(RiotApiClient::PrivateAccountError, /Access forbidden/)
    end

    context "429 レート制限 (Retry-After) の処理" do
      it "429 を受け取った際に Retry-After に従って待機し、再試行で 200 が返れば成功すること" do
        # 1回目: 429 (Retry-After: 3), 2回目: 200 OK
        stub_request(:get, url)
          .to_return(
            { status: 429, body: '{"status":{"message":"Rate limit exceeded"}}', headers: { "Retry-After" => "3" } },
            { status: 200, body: '{"recovered": true}', headers: { "Content-Type" => "application/json" } }
          )

        expect(client).to receive(:sleep_duration).at_least(:once)

        result = client.send(:get_json, host, path)
        expect(result).to eq("recovered" => true)
      end

      it "429 が連続して最大試行回数を超えた場合、RateLimitError を発生させ Retry-After を保持すること" do
        stub_request(:get, url)
          .to_return(status: 429, body: '{"status":{"message":"Rate limit exceeded"}}', headers: { "Retry-After" => "5" })

        expect {
          client.send(:get_json, host, path, max_retries: 2)
        }.to raise_error(RiotApiClient::RateLimitError) do |error|
          expect(error.retry_after).to eq(5)
          expect(error.message).to include("Retry-After: 5s")
        end

        expect(described_class.rate_limited?).to be true
      end
    end

    context "5xx サーバー障害時の指数バックオフ" do
      it "503 障害から 2 回目の再試行で 200 復旧した場合に成功すること" do
        stub_request(:get, url)
          .to_return(
            { status: 503, body: "Service Unavailable" },
            { status: 200, body: '{"status": "ok"}', headers: { "Content-Type" => "application/json" } }
          )

        expect(client).to receive(:sleep_duration).at_least(:once)

        result = client.send(:get_json, host, path)
        expect(result).to eq("status" => "ok")
      end

      it "5xx 障害が連続した場合、最大試行回数後に RiotApiError を発生させること" do
        stub_request(:get, url)
          .to_return(status: 500, body: "Internal Server Error")

        expect {
          client.send(:get_json, host, path, max_retries: 2)
        }.to raise_error(RiotApiClient::RiotApiError, /Riot API server error 500/)
      end
    end

    context "タイムアウトおよび接続障害" do
      it "Faraday::TimeoutError 発生時に再試行し、上限を超えたら TimeoutError を発生させること" do
        stub_request(:get, url).to_timeout

        expect {
          client.send(:get_json, host, path, max_retries: 2)
        }.to raise_error(RiotApiClient::TimeoutError, /Riot API request timed out/)
      end

      it "Faraday::ConnectionFailed 発生時に再試行し、上限を超えたら RiotApiError を発生させること" do
        stub_request(:get, url).to_raise(Faraday::ConnectionFailed.new("Connection refused"))

        expect {
          client.send(:get_json, host, path, max_retries: 2)
        }.to raise_error(RiotApiClient::RiotApiError, /Riot API connection failed/)
      end
    end
  end

  describe "#fetch_summoner_overview" do
    let(:game_name) { "Sunny9" }
    let(:tag_line) { "hono" }

    it "Account, Summoner, Match 情報を統合して正常に概要を返すこと" do
      account_url = "https://asia.api.riotgames.com/riot/account/v1/accounts/by-riot-id/#{game_name}/#{tag_line}"
      summoner_url = "https://jp1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/test_puuid_123"
      match_ids_url = "https://asia.api.riotgames.com/lol/match/v5/matches/by-puuid/test_puuid_123/ids?count=15&start=0"
      match_detail_url = "https://asia.api.riotgames.com/lol/match/v5/matches/JP1_12345"

      stub_request(:get, account_url)
        .to_return(status: 200, body: { puuid: "test_puuid_123", gameName: "Sunny9", tagLine: "hono" }.to_json)

      stub_request(:get, summoner_url)
        .to_return(status: 200, body: { summonerLevel: 100, profileIconId: 555 }.to_json)

      stub_request(:get, match_ids_url)
        .to_return(status: 200, body: [ "JP1_12345" ].to_json)

      stub_request(:get, match_detail_url)
        .to_return(status: 200, body: {
          info: {
            gameMode: "CLASSIC",
            gameDuration: 1800,
            gameCreation: 1700000000000,
            participants: [
              {
                puuid: "test_puuid_123",
                championName: "Jax",
                win: true,
                kills: 5,
                deaths: 2,
                assists: 8,
                totalDamageDealtToChampions: 25000,
                goldEarned: 12000
              }
            ]
          }
        }.to_json)

      overview = client.fetch_summoner_overview(game_name: game_name, tag_line: tag_line)
      expect(overview[:puuid]).to eq("test_puuid_123")
      expect(overview[:summoner_level]).to eq(100)
      expect(overview[:profile_icon_id]).to eq(555)
      expect(overview[:is_private]).to be false
      expect(overview[:matches].size).to eq(1)
      expect(overview[:matches].first[:champion_name]).to eq("Jax")
      expect(overview[:matches].first[:win]).to be true
    end

    it "アカウントが存在しない (404) 場合は nil を返すこと" do
      account_url = "https://asia.api.riotgames.com/riot/account/v1/accounts/by-riot-id/NonExistent/None"
      stub_request(:get, account_url).to_return(status: 404, body: '{"status":{"message":"Not Found"}}')

      result = client.fetch_summoner_overview(game_name: "NonExistent", tag_line: "None")
      expect(result).to be_nil
    end

    it "非公開アカウント (403) の場合は is_private: true を返すこと" do
      account_url = "https://asia.api.riotgames.com/riot/account/v1/accounts/by-riot-id/PrivateUser/Hide"
      stub_request(:get, account_url).to_return(status: 403, body: '{"status":{"message":"Forbidden"}}')

      result = client.fetch_summoner_overview(game_name: "PrivateUser", tag_line: "Hide")
      expect(result[:is_private]).to be true
      expect(result[:matches]).to be_empty
    end
  end
end
