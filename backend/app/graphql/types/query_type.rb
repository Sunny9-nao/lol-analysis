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
