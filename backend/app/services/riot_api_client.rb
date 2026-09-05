# frozen_string_literal: true

require "faraday"
require "json"

class RiotApiClient
  class RiotApiError < StandardError; end
  class AccountNotFoundError < RiotApiError; end
  class PrivateAccountError < RiotApiError; end
  class RateLimitError < RiotApiError; end

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

    # 3. Match-V5: 直近の試合ID（最新3件）を取得
    match_ids = fetch_match_ids_by_puuid(puuid, count: 3, region: region)

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

  def fetch_match_ids_by_puuid(puuid, count: 5, region: "asia")
    path = "/lol/match/v5/matches/by-puuid/#{puuid}/ids?start=0&count=#{count}"
    get_json(host_for(region), path)
  end

  def fetch_match_detail(match_id, region: "asia")
    path = "/lol/match/v5/matches/#{match_id}"
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

  def get_json(host, path)
    conn = Faraday.new(url: host) do |f|
      f.headers["X-Riot-Token"] = api_key
      f.adapter Faraday.default_adapter
    end

    response = conn.get(path)

    case response.status
    when 200
      JSON.parse(response.body)
    when 404
      raise AccountNotFoundError, "Resource not found at #{path}"
    when 403, 401
      # キー失効または非公開プロファイル
      raise PrivateAccountError, "Access forbidden (private or unauthorized)"
    when 429
      raise RateLimitError, "Riot API rate limit exceeded"
    else
      raise RiotApiError, "Riot API returned status #{response.status}: #{response.body}"
    end
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
