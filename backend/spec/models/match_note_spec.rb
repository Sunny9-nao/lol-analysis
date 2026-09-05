# frozen_string_literal: true

require "rails_helper"

RSpec.describe MatchNote, type: :model do
  let(:user) { create(:user) }
  let(:participant) { create(:match_participant) }

  it "有効な属性を持つ場合は有効であること" do
    note = build(:match_note, user: user, match_participant: participant, content: "良いメモ")
    expect(note).to be_valid
  end

  it "本文が空の場合は無効であること" do
    note = build(:match_note, user: user, match_participant: participant, content: "")
    expect(note).not_to be_valid
    expect(note.errors[:content]).to be_present
  end

  it "同一ユーザーかつ同一試合参加レコードに対して2重作成できないこと (ユニーク制約)" do
    create(:match_note, user: user, match_participant: participant, content: "最初のメモ")

    duplicate_note = build(:match_note, user: user, match_participant: participant, content: "重複メモ")
    expect(duplicate_note).not_to be_valid
    expect(duplicate_note.errors[:user_id]).to be_present
  end

  it "別ユーザーであれば同一試合参加レコードに対してそれぞれメモを作成できること" do
    create(:match_note, user: user, match_participant: participant, content: "ユーザー1のメモ")

    other_user = create(:user)
    other_note = build(:match_note, user: other_user, match_participant: participant, content: "ユーザー2のメモ")
    expect(other_note).to be_valid
  end
end
