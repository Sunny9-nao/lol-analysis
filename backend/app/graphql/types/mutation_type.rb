# frozen_string_literal: true

module Types
  class MutationType < Types::BaseObject
    # 試合反省メモの保存・更新
    field :save_match_note, mutation: Mutations::SaveMatchNote
  end
end
