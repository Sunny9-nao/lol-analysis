# frozen_string_literal: true

module Mutations
  class BackfillPastMatches < BaseMutation
    description "ログイン中のユーザーに紐づくサモナーの過去の試合を非同期ジョブで追加取得する"

    argument :count, Integer, required: false, default_value: 30, description: "遡って取得する試合数（デフォルト30件）"

    field :summoner, Types::Objects::SummonerType, null: true
    field :sync_status, String, null: true
    field :errors, [ String ], null: false

    def resolve(count: 30)
      current_user = context[:current_user]
      return { summoner: nil, sync_status: nil, errors: [ "ログインが必要です" ] } unless current_user

      summoner = current_user.summoner
      return { summoner: nil, sync_status: nil, errors: [ "連携されているサモナーがありません" ] } unless summoner

      if summoner.sync_status == "syncing"
        return { summoner: summoner, sync_status: "syncing", errors: [] }
      end

      # サンプルサモナーの場合は即座に完了
      if summoner.puuid&.start_with?("sample_")
        return { summoner: summoner, sync_status: "idle", errors: [] }
      end

      summoner.update!(sync_status: "syncing", sync_error: nil)
      BackfillMatchesJob.perform_later(summoner.id, count: count)

      { summoner: summoner, sync_status: "syncing", errors: [] }
    rescue StandardError => e
      { summoner: summoner, sync_status: "failed", errors: [ e.message ] }
    end
  end
end
