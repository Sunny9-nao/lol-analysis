# frozen_string_literal: true

require "rails_helper"

RSpec.describe Summoner, type: :model do
  describe "バリデーション" do
    it "正常な属性であれば有効" do
      summoner = build(:summoner)
      expect(summoner).to be_valid
    end

    it "puuid がなければ無効" do
      summoner = build(:summoner, puuid: nil)
      expect(summoner).not_to be_valid
    end

    it "puuid は一意でなければ無効" do
      create(:summoner, puuid: "duplicate_puuid")
      duplicate = build(:summoner, puuid: "duplicate_puuid")
      expect(duplicate).not_to be_valid
    end
  end

  describe "#riot_id" do
    it "game_name と tag_line を結合した文字列を返す" do
      summoner = build(:summoner, game_name: "Sunny9", tag_line: "hono")
      expect(summoner.riot_id).to eq("Sunny9#hono")
    end
  end

  describe "#profile_icon_url" do
    it "profile_icon_id があれば CDN URL を返す" do
      summoner = build(:summoner, profile_icon_id: 907)
      expect(summoner.profile_icon_url).to include("907.png")
    end

    it "profile_icon_id が nil なら nil を返す" do
      summoner = build(:summoner, profile_icon_id: nil)
      expect(summoner.profile_icon_url).to be_nil
    end
  end

  describe "#recent_win_rate" do
    it "参加試合の勝率を計算する" do
      summoner = create(:summoner)
      create(:match_participant, summoner: summoner, win: true)
      create(:match_participant, summoner: summoner, win: false)
      expect(summoner.recent_win_rate).to eq(50.0)
    end
  end
end
