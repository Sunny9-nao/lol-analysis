# frozen_string_literal: true

require "faraday"
require "json"

class RiotApiClient
  class RiotApiError < StandardError; end
  class AccountNotFoundError < RiotApiError; end
  class PrivateAccountError < RiotApiError; end
  class TimeoutError < RiotApiError; end

  class RateLimitError < RiotApiError
    attr_reader :retry_after

    def initialize(message = "Riot API rate limit exceeded", retry_after: nil)
      super(message)
      @retry_after = retry_after
    end
  end

  DEFAULT_OPEN_TIMEOUT = 3
  DEFAULT_READ_TIMEOUT = 5
  MAX_RETRIES = 3
  INITIAL_BACKOFF = 0.5

  @rate_limited_until = nil
  @rate_limit_mutex = Mutex.new

  class << self
    attr_accessor :rate_limited_until

    def set_rate_limit(seconds)
      @rate_limit_mutex.synchronize do
        @rate_limited_until = Time.current + seconds
      end
    end

    def reset_rate_limit!
      @rate_limit_mutex.synchronize do
        @rate_limited_until = nil
      end
    end

    def rate_limited?
      until_time = @rate_limit_mutex.synchronize { @rate_limited_until }
      until_time.present? && until_time > Time.current
    end
  end

  attr_reader :api_key

  def initialize(api_key: ENV["RIOT_API_KEY"])
    @api_key = api_key
    raise RiotApiError, "RIOT_API_KEY is not configured" if @api_key.blank?
  end

  # サモナーの総合情報をまとめて取得するハイレベルメソッド
  def fetch_summoner_overview(game_name:, tag_line:, platform: nil, region: nil)
    platform ||= infer_platform(tag_line)
    region   ||= infer_region(platform)

    # 1. Account-V1: PUUIDを取得
    account = fetch_account_by_riot_id(game_name, tag_line, region: region)
    puuid = account["puuid"]

    # 2. Summoner-V4: サモナーレベル・アイコンを取得
    summoner = fetch_summoner_by_puuid(puuid, platform: platform)

    # 3. Match-V5: 直近の試合ID（最新15件）を取得
    match_ids = fetch_match_ids_by_puuid(puuid, count: 15, region: region)

    # 4. 各試合の詳細を取得して自プレイヤーの戦績を抽出
    matches = match_ids.map do |match_id|
      fetch_match_for_participant(match_id: match_id, puuid: puuid, region: region)
    end.compact

    {
      puuid: puuid,
      game_name: account["gameName"],
      tag_line: account["tagLine"],
      summoner_level: summoner["summonerLevel"],
      profile_icon_id: summoner["profileIconId"],
      is_private: false,
      matches: matches
    }
  rescue AccountNotFoundError
    nil
  rescue PrivateAccountError
    # 非公開設定アカウントのハンドリング
    {
      puuid: nil,
      game_name: game_name,
      tag_line: tag_line,
      summoner_level: nil,
      profile_icon_id: nil,
      is_private: true,
      matches: []
    }
  end

  # --- 低レベルREST API呼び出し ---

  def fetch_account_by_riot_id(game_name, tag_line, region: "asia")
    path = "/riot/account/v1/accounts/by-riot-id/#{URI.encode_uri_component(game_name)}/#{URI.encode_uri_component(tag_line)}"
    get_json(host_for(region), path)
  end

  def fetch_summoner_by_puuid(puuid, platform: "jp1")
    path = "/lol/summoner/v4/summoners/by-puuid/#{puuid}"
    get_json(host_for(platform), path)
  end

  def fetch_match_ids_by_puuid(puuid, start: 0, count: 5, queue: nil, region: "asia")
    path = "/lol/match/v5/matches/by-puuid/#{puuid}/ids?start=#{start}&count=#{count}"
    path += "&queue=#{queue}" if queue.present?
    get_json(host_for(region), path)
  end

  def fetch_match_detail(match_id, region: "asia")
    path = "/lol/match/v5/matches/#{match_id}"
    get_json(host_for(region), path)
  end

  def fetch_match_timeline(match_id, region: "asia")
    path = "/lol/match/v5/matches/#{match_id}/timeline"
    get_json(host_for(region), path)
  end

  def fetch_match_for_participant(match_id:, puuid:, region: "asia")
    detail = fetch_match_detail(match_id, region: region)
    info = detail["info"]
    participant = info["participants"]&.find { |p| p["puuid"] == puuid }
    return nil unless participant

    {
      match_id: match_id,
      game_mode: info["gameMode"],
      game_duration: info["gameDuration"],
      game_creation: info["gameCreation"],
      champion_name: participant["championName"],
      win: participant["win"],
      kills: participant["kills"],
      deaths: participant["deaths"],
      assists: participant["assists"],
      total_damage_dealt: participant["totalDamageDealtToChampions"],
      gold_earned: participant["goldEarned"]
    }
  end

  private

  def host_for(routing_value)
    "https://#{routing_value}.api.riotgames.com"
  end

  def get_json(host, path, max_retries: MAX_RETRIES)
    wait_if_rate_limited!

    attempt = 0
    conn = Faraday.new(url: host) do |f|
      f.headers["X-Riot-Token"] = api_key
      f.options.open_timeout = DEFAULT_OPEN_TIMEOUT
      f.options.timeout = DEFAULT_READ_TIMEOUT
      f.adapter Faraday.default_adapter
    end

    loop do
      attempt += 1
      response = conn.get(path)

      case response.status
      when 200
        return JSON.parse(response.body)
      when 404
        raise AccountNotFoundError, "Resource not found at #{path}"
      when 403, 401
        raise PrivateAccountError, "Access forbidden (private or unauthorized)"
      when 429
        retry_after = parse_retry_after(response)
        self.class.set_rate_limit(retry_after)

        if attempt <= max_retries
          sleep_with_jitter(retry_after)
          next
        end

        raise RateLimitError.new("Riot API rate limit exceeded (Retry-After: #{retry_after}s)", retry_after: retry_after)
      when 500, 502, 503, 504
        if attempt <= max_retries
          backoff = (INITIAL_BACKOFF * (2**(attempt - 1))) + rand(0.05..0.2)
          sleep_duration(backoff)
          next
        end

        raise RiotApiError, "Riot API server error #{response.status}: #{response.body}"
      else
        raise RiotApiError, "Riot API returned status #{response.status}: #{response.body}"
      end
    rescue Faraday::TimeoutError => e
      if attempt <= max_retries
        backoff = INITIAL_BACKOFF * (2**(attempt - 1))
        sleep_duration(backoff)
        next
      end

      raise TimeoutError, "Riot API request timed out: #{e.message}"
    rescue Faraday::ConnectionFailed => e
      if attempt <= max_retries
        backoff = INITIAL_BACKOFF * (2**(attempt - 1))
        sleep_duration(backoff)
        next
      end

      if e.message =~ /timeout|execution expired/i
        raise TimeoutError, "Riot API request timed out: #{e.message}"
      else
        raise RiotApiError, "Riot API connection failed: #{e.message}"
      end
    end
  end

  def wait_if_rate_limited!
    until_time = self.class.rate_limited_until
    return unless until_time && until_time > Time.current

    wait_sec = (until_time - Time.current).ceil
    sleep_duration(wait_sec) if wait_sec.positive?
  end

  def parse_retry_after(response)
    header = response.headers["Retry-After"]
    if header.present? && header.to_i.positive?
      header.to_i
    else
      2
    end
  end

  def sleep_with_jitter(seconds)
    jitter = rand(0.1..0.5)
    sleep_duration(seconds + jitter)
  end

  def sleep_duration(seconds)
    sleep(seconds)
  end

  def infer_platform(tag_line)
    tag = tag_line.to_s.upcase
    case tag
    when "KR", "KR1" then "kr"
    when "JP", "JP1" then "jp1"
    when "NA", "NA1" then "na1"
    when "EUW", "EUW1" then "euw1"
    else "jp1"
    end
  end

  def infer_region(platform)
    case platform.to_s.downcase
    when "kr", "jp1" then "asia"
    when "na1", "br1", "la1", "la2" then "americas"
    when "euw1", "eun1", "tr1", "ru" then "europe"
    else "asia"
    end
  end
end
