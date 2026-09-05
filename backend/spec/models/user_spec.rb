# frozen_string_literal: true

require "rails_helper"

RSpec.describe User, type: :model do
  describe "バリデーション" do
    it "有効な属性を持つ場合は有効であること" do
      user = build(:user, email: "player@example.com", password: "password123")
      expect(user).to be_valid
    end

    it "メールアドレスが未入力の場合は無効であること" do
      user = build(:user, email: nil)
      expect(user).not_to be_valid
      expect(user.errors[:email]).to include("can't be blank")
    end

    it "メールアドレスの形式が不正な場合は無効であること" do
      user = build(:user, email: "invalid-email")
      expect(user).not_to be_valid
      expect(user.errors[:email]).to include("is invalid")
    end

    it "メールアドレスの大文字小文字を区別せず重複を許さないこと" do
      create(:user, email: "unique@example.com")
      duplicate = build(:user, email: "UNIQUE@example.com")
      expect(duplicate).not_to be_valid
      expect(duplicate.errors[:email]).to include("has already been taken")
    end
  end

  describe "認証とトークン" do
    it "パスワード認証が正しく機能すること" do
      user = create(:user, password: "securepassword")
      expect(user.authenticate("securepassword")).to eq(user)
      expect(user.authenticate("wrongpassword")).to be false
    end

    it "作成時に自動的に auth_token が生成されること" do
      user = create(:user)
      expect(user.auth_token).to be_present
      expect(user.auth_token.length).to be >= 24
    end
  end

  describe "関連と依存削除" do
    let!(:user) { create(:user) }
    let!(:other_user) { create(:user) }
    let!(:summoner) { create(:summoner) }
    let!(:participant) { create(:match_participant, summoner: summoner) }
    let!(:user_note) { create(:match_note, user: user, match_participant: participant) }
    let!(:other_note) { create(:match_note, user: other_user, match_participant: participant) }

    it "ユーザー削除時に紐づく反省メモのみが削除され、サモナーや他ユーザーのメモは残ること" do
      expect {
        user.destroy
      }.to change(MatchNote, :count).by(-1)

      expect(MatchNote.find_by(id: user_note.id)).to be_nil
      expect(MatchNote.find_by(id: other_note.id)).to be_present
      expect(Summoner.find_by(id: summoner.id)).to be_present
      expect(MatchParticipant.find_by(id: participant.id)).to be_present
    end
  end
end
