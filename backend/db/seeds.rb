# frozen_string_literal: true

require "faraday"
require "json"

puts "Data Dragon (CDN) からチャンピオンマスタを取得中..."

versions_response = Faraday.get("https://ddragon.leagueoflegends.com/api/versions.json")
raise "Data Dragon からのバージョン取得に失敗しました: #{versions_response.status}" unless versions_response.status == 200

versions = JSON.parse(versions_response.body)
version = versions.first # 最新バージョンを取得
puts "最新バージョン: #{version}"

url = "https://ddragon.leagueoflegends.com/cdn/#{version}/data/ja_JP/champion.json"

response = Faraday.get(url)
raise "Data Dragon からのデータ取得に失敗しました: #{response.status}" unless response.status == 200

champions_data = JSON.parse(response.body)["data"]
puts "対象チャンピオン数: #{champions_data.size} 体"

imported_count = 0
ActiveRecord::Base.transaction do
  champions_data.each do |key, data|
    image_full = data.dig("image", "full") || "#{key}.png"
    image_url = "https://ddragon.leagueoflegends.com/cdn/#{version}/img/champion/#{image_full}"

    champion = Champion.find_or_initialize_by(champion_name: data["id"])
    champion.assign_attributes(
      name: data["name"],
      title: data["title"],
      image_url: image_url
    )
    champion.save!
    imported_count += 1
  end
end

puts "完了: #{imported_count} 体のチャンピオンマスタをインポートしました。"
