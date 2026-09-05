# frozen_string_literal: true

require "rails_helper"

RSpec.describe Match, type: :model do
  describe "バリデーションと一意制約" do
    it "有効な属性を持つ場合は有効であること" do
      match = build(:match)
      expect(match).to be_valid
    end

    it "match_id がない場合は無効であること" do
      match = build(:match, match_id: nil)
      expect(match).not_to be_valid
      expect(match.errors[:match_id]).to include("can't be blank")
    end

    it "同じ match_id の重複作成を許さないこと" do
      create(:match, match_id: "JP1_UNIQUE_TEST")
      duplicate = build(:match, match_id: "JP1_UNIQUE_TEST")
      expect(duplicate).not_to be_valid
      expect(duplicate.errors[:match_id]).to include("has already been taken")
    end
  end

  describe "MatchParticipant との関連と一意制約" do
    let!(:summoner) { create(:summoner) }
    let!(:match) { create(:match) }

    it "同一サモナーかつ同一試合の参加記録は2重作成できないこと" do
      create(:match_participant, summoner: summoner, match: match)

      duplicate_participant = build(:match_participant, summoner: summoner, match: match)
      expect(duplicate_participant).not_to be_valid
      expect(duplicate_participant.errors[:summoner_id]).to include("has already been taken")
    end

    it "別サモナーであれば同一試合の参加記録を作成できること" do
      create(:match_participant, summoner: summoner, match: match)

      other_summoner = create(:summoner)
      other_participant = build(:match_participant, summoner: other_summoner, match: match)
      expect(other_participant).to be_valid
    end
  end
end
