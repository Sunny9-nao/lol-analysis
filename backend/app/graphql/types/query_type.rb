# frozen_string_literal: true

module Types
  class QueryType < Types::BaseObject
    field :node, Types::NodeType, null: true, description: "Fetches an object given its ID." do
      argument :id, ID, required: true, description: "ID of the object."
    end

    def node(id:)
      context.schema.object_from_id(id, context)
    end

    field :nodes, [ Types::NodeType, null: true ], null: true, description: "Fetches a list of objects given a list of IDs." do
      argument :ids, [ ID ], required: true, description: "IDs of the objects."
    end

    def nodes(ids:)
      ids.map { |id| context.schema.object_from_id(id, context) }
    end

    # Add root-level fields here.
    # They will be entry points for queries on your schema.

    # ログイン中のユーザー情報
    field :me, Types::Objects::UserType, null: true, description: "現在のログインユーザー"

    def me
      context[:current_user]
    end

    # ログインユーザー本人のサモナー戦績（個人専用・他人のデータは見せない）
    field :my_summoner, Types::Objects::SummonerType, null: true, description: "ログインユーザー本人のサモナーデータ" do
      argument :force, Boolean, required: false, default_value: false, description: "最新の試合を強制再同期"
    end

    def my_summoner(force: false)
      user = context[:current_user]
      return nil unless user&.summoner

      if force
        SummonerSyncService.new.sync(
          game_name: user.summoner.game_name,
          tag_line: user.summoner.tag_line,
          force: true
        )
      else
        user.summoner
      end
    end

    # サモナー戦績検索（DBキャッシュ ＋ 自動API同期）
    field :search_summoner, Types::Objects::SummonerType, null: true,
      description: "Search for a summoner by Riot ID (auto-syncs with Riot API and caches in DB)" do
      argument :game_name, String, required: true, description: "Game name (e.g. Sunny9)"
      argument :tag_line, String, required: true, description: "Tag line (e.g. hono)"
      argument :force, Boolean, required: false, default_value: false, description: "Force re-sync with Riot API"
    end

    def search_summoner(game_name:, tag_line:, force: false)
      SummonerSyncService.new.sync(game_name: game_name, tag_line: tag_line, force: force)
    end
  end
end
