# frozen_string_literal: true

FactoryBot.define do
  factory :summoner do
    sequence(:puuid) { |n| "puuid_test_#{n}" }
    game_name { "Sunny9" }
    tag_line { "hono" }
    summoner_level { 84 }
    profile_icon_id { 907 }
    is_private { false }
    last_synced_at { Time.current }
  end

  factory :match do
    sequence(:match_id) { |n| "JP1_#{n + 600000000}" }
    game_mode { "CLASSIC" }
    queue_id { 420 }
    game_duration { 2468 }
    game_creation { Time.current }
  end

  factory :match_participant do
    summoner
    match
    champion_name { "Jax" }
    opponent_champion_name { "Yorick" }
    position { "TOP" }
    win { false }
    kills { 4 }
    deaths { 9 }
    assists { 2 }
    cs { 292 }
    gold_earned { 14444 }
    total_damage_dealt { 27187 }
    items { [ 6610, 3157, 6333, 3047, 3153, 3340 ] }
    spells { [ 12, 4 ] }
  end

  factory :user do
    sequence(:email) { |n| "user_#{n}@example.com" }
    password { "password123" }
    summoner { nil }
  end

  factory :match_note do
    user
    match_participant
    content { "Lv1 Eスタートでミニオン触らず耐える" }
    matchup_tag { "Hard" }
  end

  factory :champion do
    champion_name { "Jax" }
    name { "ジャックス" }
    title { "武器の達人" }
    image_url { "https://ddragon.leagueoflegends.com/cdn/14.24.1/img/champion/Jax.png" }
  end
end
