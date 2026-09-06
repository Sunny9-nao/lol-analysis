# frozen_string_literal: true

module Mutations
  class ResetSummonerSyncStatus < BaseMutation
    description "スタックした同期ステータスを強制的にリセット（idle化）する"

    field :summoner, Types::Objects::SummonerType, null: true
    field :success, Boolean, null: false
    field :errors, [ String ], null: false

    def resolve
      current_user = context[:current_user]
      return { summoner: nil, success: false, errors: [ "ログインが必要です" ] } unless current_user

      summoner = current_user.summoner
      return { summoner: nil, success: false, errors: [ "連携されているサモナーがありません" ] } unless summoner

      summoner.update!(sync_status: "idle", sync_error: nil)
      { summoner: summoner, success: true, errors: [] }
    rescue StandardError => e
      { summoner: summoner, success: false, errors: [ e.message ] }
    end
  end
end
