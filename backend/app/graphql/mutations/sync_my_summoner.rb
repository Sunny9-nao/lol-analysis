# frozen_string_literal: true

module Mutations
  class SyncMySummoner < BaseMutation
    description "ログイン中のユーザーに紐づくサモナーの最新戦績を非同期ジョブで同期開始する"

    argument :force, Boolean, required: false, default_value: true, description: "キャッシュを無視して外部APIから強制再取得するか"

    field :summoner, Types::Objects::SummonerType, null: true
    field :sync_status, String, null: true
    field :errors, [ String ], null: false

    def resolve(force: true)
      current_user = context[:current_user]
      return { summoner: nil, sync_status: nil, errors: [ "ログインが必要です" ] } unless current_user

      summoner = current_user.summoner
      return { summoner: nil, sync_status: nil, errors: [ "連携されているサモナーがありません" ] } unless summoner

      if summoner.sync_status == "syncing"
        return { summoner: summoner, sync_status: "syncing", errors: [] }
      end

      summoner.update!(sync_status: "syncing", sync_error: nil)
      SyncSummonerJob.perform_later(summoner.id, force: force)

      { summoner: summoner, sync_status: "syncing", errors: [] }
    rescue StandardError => e
      { summoner: summoner, sync_status: "failed", errors: [ e.message ] }
    end
  end
end
