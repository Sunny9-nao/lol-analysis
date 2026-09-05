# frozen_string_literal: true

require "rails_helper"

RSpec.describe "saveMatchNote ミューテーション", type: :request do
  let(:mutation) do
    <<~GQL
      mutation SaveMatchNote($input: SaveMatchNoteInput!) {
        saveMatchNote(input: $input) {
          matchNote {
            id
            content
            matchupTag
          }
          errors
        }
      }
    GQL
  end

  let!(:participant) { create(:match_participant) }

  context "正常系" do
    it "メモが存在しない場合、新しく作成できること" do
      variables = {
        input: {
          matchParticipantId: participant.id,
          content: "Lv1 Eスタートでミニオンを触らず耐える",
          matchupTag: "Hard"
        }
      }

      result = execute_graphql(mutation, variables: variables)
      data = result.dig("data", "saveMatchNote")

      expect(result["errors"]).to be_nil
      expect(data["errors"]).to be_empty

      note = data["matchNote"]
      expect(note["content"]).to eq("Lv1 Eスタートでミニオンを触らず耐える")
      expect(note["matchupTag"]).to eq("Hard")

      # DBの永続化検証
      saved = participant.reload.match_note
      expect(saved).not_to be_nil
      expect(saved.content).to eq("Lv1 Eスタートでミニオンを触らず耐える")
    end

    it "メモが既に存在する場合、内容を更新できること" do
      create(:match_note, match_participant: participant, content: "初期メモ", matchup_tag: "Even")

      variables = {
        input: {
          matchParticipantId: participant.id,
          content: "更新されたメモ: Lv2先行を狙う",
          matchupTag: "Easy"
        }
      }

      result = execute_graphql(mutation, variables: variables)
      data = result.dig("data", "saveMatchNote")

      expect(data["errors"]).to be_empty
      expect(data.dig("matchNote", "content")).to eq("更新されたメモ: Lv2先行を狙う")
      expect(data.dig("matchNote", "matchupTag")).to eq("Easy")
      expect(participant.reload.match_note.content).to eq("更新されたメモ: Lv2先行を狙う")
    end
  end

  context "異常系" do
    it "該当の参加レコードが存在しない場合、エラーを返すこと" do
      variables = {
        input: {
          matchParticipantId: 999_999,
          content: "メモ内容"
        }
      }

      result = execute_graphql(mutation, variables: variables)
      data = result.dig("data", "saveMatchNote")

      expect(data["matchNote"]).to be_nil
      expect(data["errors"]).to include("対象の試合記録が見つかりません")
    end

    it "本文が空の場合、バリデーションエラーを返すこと" do
      variables = {
        input: {
          matchParticipantId: participant.id,
          content: ""
        }
      }

      result = execute_graphql(mutation, variables: variables)
      data = result.dig("data", "saveMatchNote")

      expect(data["matchNote"]).to be_nil
      expect(data["errors"]).not_to be_empty
    end
  end
end
