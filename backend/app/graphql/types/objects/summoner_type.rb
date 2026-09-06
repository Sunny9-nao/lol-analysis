# frozen_string_literal: true

module Types
  module Objects
    class SummonerType < Types::BaseObject
      description "Summoner profile and persistent match history"

      field :id, ID, null: false
      field :puuid, String, null: true
      field :game_name, String, null: false
      field :tag_line, String, null: false
      field :riot_id, String, null: false, description: "Full Riot ID (gameName#tagLine)"
      field :summoner_level, Integer, null: true
      field :profile_icon_id, Integer, null: true
      field :profile_icon_url, String, null: true
      field :is_private, Boolean, null: false, description: "Whether this account is private"
      field :last_synced_at, GraphQL::Types::ISO8601DateTime, null: true
      field :recent_win_rate, Float, null: true, description: "Win rate percentage across recorded matches"
      field :sync_status, String, null: false, description: "Background sync status (idle, syncing, failed)"
      field :sync_error, String, null: true, description: "Error message if sync failed"

      def sync_status
        if object.sync_stale?
          object.heal_stale_sync!
          return "failed"
        end
        object.sync_status
      end

      def sync_error
        if object.sync_stale?
          object.heal_stale_sync!
          return "前回の同期処理がタイムアウトしました。再試行してください。"
        end
        object.sync_error
      end

      # 直近の参加試合レコード一覧 (最新順、デフォルトはRanked Solo/Duo: 420)
      field :match_participants, [ Types::Objects::MatchParticipantType ], null: false,
        description: "Participant records with matchup and item data" do
        argument :queue_id, Integer, required: false, default_value: 420, description: "Queue filter (420 for Ranked Solo/Duo)"
      end

      def match_participants(queue_id: 420)
        return [] if object.is_private
        scope = object.match_participants.joins(:match).includes(:match, :match_notes, :champion, :opponent_champion)
        scope = scope.where(matches: { queue_id: queue_id }) if queue_id.present?
        scope.order("matches.game_creation DESC")
      end

      # 対面分析: 使用チャンピオン一覧
      field :played_champions, [ Types::Objects::PlayedChampionType ], null: false,
        description: "List of champions played by this summoner with summary statistics" do
        argument :position, String, required: false, description: "Role filter (TOP, JUNGLE, MIDDLE, BOTTOM, UTILITY)"
      end

      def played_champions(position: nil)
        return [] if object.is_private
        MatchupAnalysisService.new(summoner: object, current_user: context[:current_user]).played_champions(position: position)
      end

      # 対面分析: 対面別サマリ一覧
      field :matchup_summaries, [ Types::Objects::MatchupSummaryType ], null: false,
        description: "Aggregated matchup summaries against opponents for a specific champion" do
        argument :champion_name, String, required: true, description: "Player champion identifier"
        argument :position, String, required: false, description: "Role filter (TOP, JUNGLE, MIDDLE, BOTTOM, UTILITY)"
      end

      def matchup_summaries(champion_name:, position: nil)
        return [] if object.is_private
        MatchupAnalysisService.new(summoner: object, current_user: context[:current_user]).summaries_for(champion_name: champion_name, position: position)
      end

      # 対面分析: 特定マッチアップ詳細
      field :matchup_detail, Types::Objects::MatchupDetailType, null: true,
        description: "Detailed match history and statistics against a specific opponent champion" do
        argument :champion_name, String, required: true, description: "Player champion identifier"
        argument :opponent_champion_name, String, required: true, description: "Opponent champion identifier"
        argument :position, String, required: false, description: "Role filter (TOP, JUNGLE, MIDDLE, BOTTOM, UTILITY)"
      end

      def matchup_detail(champion_name:, opponent_champion_name:, position: nil)
        return nil if object.is_private
        MatchupAnalysisService.new(summoner: object, current_user: context[:current_user]).detail_for(
          champion_name: champion_name,
          opponent_champion_name: opponent_champion_name,
          position: position
        )
      end

      # 対面分析: 相手チャンピオンに対する逆引きカウンターレコメンド
      field :counter_recommendations, [ Types::Objects::MatchupSummaryType ], null: false,
        description: "Your best champions against a specific opponent champion" do
        argument :opponent_champion_name, String, required: true, description: "Target opponent champion identifier"
        argument :position, String, required: false, description: "Role filter"
      end

      def counter_recommendations(opponent_champion_name:, position: nil)
        return [] if object.is_private
        MatchupAnalysisService.new(summoner: object, current_user: context[:current_user]).counters_for(
          opponent_champion_name: opponent_champion_name,
          position: position
        )
      end
    end
  end
end
