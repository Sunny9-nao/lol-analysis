# frozen_string_literal: true

module Mutations
  class LinkSummoner < BaseMutation
    description "自身のRiot IDを登録・連携する"

    argument :game_name, String, required: true, description: "Game Name"
    argument :tag_line, String, required: true, description: "Tag Line"

    field :user, Types::Objects::UserType, null: true
    field :summoner, Types::Objects::SummonerType, null: true
    field :errors, [ String ], null: false

    def resolve(game_name:, tag_line:)
      current_user = context[:current_user]
      return { user: nil, summoner: nil, errors: [ "ログインが必要です" ] } unless current_user

      summoner = SummonerSyncService.new.sync(game_name: game_name.strip, tag_line: tag_line.strip, force: true)

      if summoner&.persisted?
        summoner.update!(sync_status: "idle", sync_error: nil) if summoner.sync_status == "syncing"
        current_user.update!(summoner: summoner)
        { user: current_user, summoner: summoner, errors: [] }
      else
        { user: current_user, summoner: nil, errors: [ "サモナー情報の取得に失敗しました。Riot IDを確認してください。" ] }
      end
    rescue StandardError => e
      { user: current_user, summoner: nil, errors: [ e.message ] }
    end
  end
end
