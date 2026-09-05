# frozen_string_literal: true

module Mutations
  class SaveMatchNote < BaseMutation
    description "試合の反省メモを保存または更新する"

    argument :match_participant_id, ID, required: true, description: "対象の試合参加ID"
    argument :content, String, required: true, description: "メモ本文"
    argument :matchup_tag, String, required: false, description: "対面相性タグ (Hard, Even, Easy)"

    field :match_note, Types::Objects::MatchNoteType, null: true, description: "保存されたメモ"
    field :errors, [ String ], null: false, description: "エラーメッセージ一覧"

    def resolve(match_participant_id:, content:, matchup_tag: nil)
      participant = MatchParticipant.find_by(id: match_participant_id)
      return { match_note: nil, errors: [ "対象の試合記録が見つかりません" ] } unless participant

      note = participant.match_note || participant.build_match_note
      note.content = content
      note.matchup_tag = matchup_tag if matchup_tag.present?

      if note.save
        { match_note: note, errors: [] }
      else
        { match_note: nil, errors: note.errors.full_messages }
      end
    end
  end
end
