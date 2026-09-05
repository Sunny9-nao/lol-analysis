# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_09_05_061249) do
  create_table "champions", force: :cascade do |t|
    t.string "champion_name"
    t.datetime "created_at", null: false
    t.string "image_url"
    t.string "name"
    t.string "title"
    t.datetime "updated_at", null: false
    t.index ["champion_name"], name: "index_champions_on_champion_name", unique: true
  end

  create_table "match_notes", force: :cascade do |t|
    t.text "content"
    t.datetime "created_at", null: false
    t.integer "match_participant_id", null: false
    t.string "matchup_tag"
    t.datetime "updated_at", null: false
    t.index ["match_participant_id"], name: "index_match_notes_on_match_participant_id", unique: true
  end

  create_table "match_participants", force: :cascade do |t|
    t.integer "assists", default: 0, null: false
    t.string "champion_name", null: false
    t.datetime "created_at", null: false
    t.integer "cs", default: 0, null: false
    t.integer "deaths", default: 0, null: false
    t.integer "gold_earned", default: 0, null: false
    t.json "items"
    t.integer "kills", default: 0, null: false
    t.integer "match_id", null: false
    t.string "opponent_champion_name"
    t.string "position"
    t.json "raw_participant"
    t.json "spells"
    t.integer "summoner_id", null: false
    t.integer "total_damage_dealt", default: 0, null: false
    t.datetime "updated_at", null: false
    t.boolean "win", null: false
    t.index ["champion_name"], name: "index_match_participants_on_champion_name"
    t.index ["match_id"], name: "index_match_participants_on_match_id"
    t.index ["opponent_champion_name"], name: "index_match_participants_on_opponent_champion_name"
    t.index ["summoner_id", "match_id"], name: "index_match_participants_on_summoner_id_and_match_id", unique: true
    t.index ["summoner_id"], name: "index_match_participants_on_summoner_id"
    t.index ["win"], name: "index_match_participants_on_win"
  end

  create_table "matches", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "game_creation"
    t.integer "game_duration", null: false
    t.string "game_mode", null: false
    t.string "match_id", null: false
    t.json "raw_info"
    t.datetime "updated_at", null: false
    t.index ["match_id"], name: "index_matches_on_match_id", unique: true
  end

  create_table "summoners", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "game_name", null: false
    t.boolean "is_private", default: false, null: false
    t.datetime "last_synced_at"
    t.integer "profile_icon_id"
    t.string "puuid", null: false
    t.json "raw_data"
    t.integer "summoner_level"
    t.string "tag_line", null: false
    t.datetime "updated_at", null: false
    t.index ["game_name", "tag_line"], name: "index_summoners_on_game_name_and_tag_line"
    t.index ["puuid"], name: "index_summoners_on_puuid", unique: true
  end

  add_foreign_key "match_notes", "match_participants"
  add_foreign_key "match_participants", "matches"
  add_foreign_key "match_participants", "summoners"
end
