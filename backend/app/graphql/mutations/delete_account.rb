# frozen_string_literal: true

module Mutations
  class DeleteAccount < BaseMutation
    description "ログイン中ユーザーのアカウントおよび紐づく反省メモを完全に削除する"

    field :success, Boolean, null: false, description: "削除成功フラグ"
    field :errors, [ String ], null: false, description: "エラーメッセージ一覧"

    def resolve
      current_user = context[:current_user]
      return { success: false, errors: [ "ログインが必要です" ] } unless current_user

      summoner = current_user.summoner
      summoner&.update(sync_status: "idle", sync_error: nil) if summoner&.sync_status == "syncing"

      if current_user.destroy
        { success: true, errors: [] }
      else
        { success: false, errors: current_user.errors.full_messages }
      end
    end
  end
end
