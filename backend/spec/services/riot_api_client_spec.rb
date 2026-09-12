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

  describe "HTTP リクエストとエラー耐障害性 (公開メソッド経由の振る舞い検証)" do
    let(:game_name) { "Sunny9" }
    let(:tag_line) { "hono" }
    let(:account_url) { "https://asia.api.riotgames.com/riot/account/v1/accounts/by-riot-id/#{game_name}/#{tag_line}" }

    it "200 OK のレスポンスを正しく JSON パースして返すこと" do
      stub_request(:get, account_url)
        .with(headers: { "X-Riot-Token" => api_key })
        .to_return(status: 200, body: '{"puuid": "test_puuid", "gameName": "Sunny9"}', headers: { "Content-Type" => "application/json" })

      result = client.fetch_account_by_riot_id(game_name, tag_line)
      expect(result).to eq("puuid" => "test_puuid", "gameName" => "Sunny9")
    end

    it "404 の場合は AccountNotFoundError を即座に発生させること (リトライなし)" do
      stub_request(:get, account_url).to_return(status: 404, body: '{"status":{"message":"Not Found"}}')

      expect {
        client.fetch_account_by_riot_id(game_name, tag_line)
      }.to raise_error(RiotApiClient::AccountNotFoundError, /Resource not found/)
    end

    it "403 の場合は PrivateAccountError を即座に発生させること (リトライなし)" do
      stub_request(:get, account_url).to_return(status: 403, body: '{"status":{"message":"Forbidden"}}')

      expect {
        client.fetch_account_by_riot_id(game_name, tag_line)
      }.to raise_error(RiotApiClient::PrivateAccountError, /Access forbidden/)
    end

    context "429 レート制限 (Retry-After) の処理" do
      it "429 を受け取った際に Retry-After に従って待機し、再試行で 200 が返れば成功すること" do
        # 1回目: 429 (Retry-After: 3), 2回目: 200 OK
        stub_request(:get, account_url)
          .to_return(
            { status: 429, body: '{"status":{"message":"Rate limit exceeded"}}', headers: { "Retry-After" => "3" } },
            { status: 200, body: '{"puuid": "recovered_puuid"}', headers: { "Content-Type" => "application/json" } }
          )

        expect(client).to receive(:sleep_duration).at_least(:once)

        result = client.fetch_account_by_riot_id(game_name, tag_line)
        expect(result).to eq("puuid" => "recovered_puuid")
      end

      it "429 が連続して最大試行回数を超えた場合、RateLimitError を発生させ Retry-After を保持すること" do
        stub_request(:get, account_url)
          .to_return(status: 429, body: '{"status":{"message":"Rate limit exceeded"}}', headers: { "Retry-After" => "5" })

        expect {
          client.fetch_account_by_riot_id(game_name, tag_line)
        }.to raise_error(RiotApiClient::RateLimitError) do |error|
          expect(error.retry_after).to eq(5)
          expect(error.message).to include("Retry-After: 5s")
        end

        expect(described_class.rate_limited?).to be true
      end
    end

    context "5xx サーバー障害時の指数バックオフ" do
      it "503 障害から 2 回目の再試行で 200 復旧した場合に成功すること" do
        stub_request(:get, account_url)
          .to_return(
            { status: 503, body: "Service Unavailable" },
            { status: 200, body: '{"status": "ok"}', headers: { "Content-Type" => "application/json" } }
          )

        expect(client).to receive(:sleep_duration).at_least(:once)

        result = client.fetch_account_by_riot_id(game_name, tag_line)
        expect(result).to eq("status" => "ok")
      end

      it "5xx 障害が連続した場合、最大試行回数後に RiotApiError を発生させること" do
        stub_request(:get, account_url)
          .to_return(status: 500, body: "Internal Server Error")

        expect {
          client.fetch_account_by_riot_id(game_name, tag_line)
        }.to raise_error(RiotApiClient::RiotApiError, /Riot API server error 500/)
      end
    end

    context "タイムアウトおよび接続障害" do
      it "Faraday::TimeoutError 発生時に再試行し、上限を超えたら TimeoutError を発生させること" do
        stub_request(:get, account_url).to_timeout

        expect {
          client.fetch_account_by_riot_id(game_name, tag_line)
        }.to raise_error(RiotApiClient::TimeoutError, /Riot API request timed out/)
      end

      it "Faraday::ConnectionFailed 発生時に再試行し、上限を超えたら RiotApiError を発生させること" do
        stub_request(:get, account_url).to_raise(Faraday::ConnectionFailed.new("Connection refused"))

        expect {
          client.fetch_account_by_riot_id(game_name, tag_line)
        }.to raise_error(RiotApiClient::RiotApiError, /Riot API connection failed/)
      end
    end
  end

  describe ".infer_platform" do
    it "タグラインに応じて適切なプラットフォームを判定すること" do
      expect(RiotApiClient.infer_platform("JP1")).to eq("jp1")
      expect(RiotApiClient.infer_platform("jp")).to eq("jp1")
      expect(RiotApiClient.infer_platform("KR")).to eq("kr")
      expect(RiotApiClient.infer_platform("kr1")).to eq("kr")
      expect(RiotApiClient.infer_platform("NA1")).to eq("na1")
      expect(RiotApiClient.infer_platform("EUW1")).to eq("euw1")
      expect(RiotApiClient.infer_platform("unknown_tag")).to eq("jp1")
    end
  end

  describe ".infer_region" do
    it "プラットフォームに応じて適切な広域ルーティングリージョンを判定すること" do
      expect(RiotApiClient.infer_region("jp1")).to eq("asia")
      expect(RiotApiClient.infer_region("kr")).to eq("asia")
      expect(RiotApiClient.infer_region("na1")).to eq("americas")
      expect(RiotApiClient.infer_region("br1")).to eq("americas")
      expect(RiotApiClient.infer_region("euw1")).to eq("europe")
      expect(RiotApiClient.infer_region("unknown")).to eq("asia")
    end
  end
end
