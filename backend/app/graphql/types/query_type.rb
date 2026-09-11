# frozen_string_literal: true

module Types
  class QueryType < Types::BaseObject
    # Root-level entry points for queries on your schema.

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
