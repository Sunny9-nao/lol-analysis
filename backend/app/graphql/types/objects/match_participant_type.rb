# frozen_string_literal: true

module Types
  module Objects
    class MatchParticipantType < Types::BaseObject
      description "Participant record for a player in a specific match"

      field :id, ID, null: false
      field :match_id, ID, null: false
      field :champion_name, String, null: false, description: "Champion played by this participant"
      field :opponent_champion_name, String, null: true, description: "Direct lane opponent champion (e.g. Yorick)"
      field :position, String, null: true, description: "Lane role (TOP, JUNGLE, MIDDLE, BOTTOM, UTILITY)"
      field :win, Boolean, null: false, description: "Victory or Defeat"
      field :kills, Integer, null: false
      field :deaths, Integer, null: false
      field :assists, Integer, null: false
      field :cs, Integer, null: false, description: "Total minions and neutral creeps killed"
      field :gold_earned, Integer, null: false
      field :total_damage_dealt, Integer, null: false
      field :items, [ Integer ], null: true, description: "List of item IDs purchased"
      field :spells, [ Integer ], null: true, description: "Summoner spell IDs"

      field :kda_ratio, Float, null: false, description: "Calculated KDA ratio"
      field :formatted_duration, String, null: false, description: "Match duration (mm:ss)"

      # Timeline API 解析フィールド
      field :gold_diff_at_14, Integer, null: true, description: "Gold difference against lane opponent at 14 minutes"
      field :cs_diff_at_14, Integer, null: true, description: "CS difference against lane opponent at 14 minutes"
      field :lane_outcome, String, null: true, description: "Objective lane outcome based on GD@14 (win, even, loss)"
      field :early_items, [ Types::Objects::EarlyItemType ], null: true, description: "Early item purchase sequence up to 14 mins"
      field :gold_timeline, [ Types::Objects::GoldTimelinePointType ], null: true, description: "Minute-by-minute gold difference against opponent"
      field :kill_events, [ Types::Objects::TimelineKillEventType ], null: true, description: "Kill/death timeline events"
      field :item_timeline, [ Types::Objects::EarlyItemType ], null: true, description: "Full-game item purchase timeline"

      def early_items
        timeline_analysis[:early_items]
      end

      def gold_timeline
        timeline_analysis[:gold_timeline]
      end

      def kill_events
        timeline_analysis[:kill_events]
      end

      def item_timeline
        timeline_analysis[:item_timeline]
      end

      field :match_note, Types::Objects::MatchNoteType, null: true, description: "Personal note for this match"
      def match_note
        current_user = context[:current_user]
        return nil unless current_user

        object.match_notes.find_by(user_id: current_user.id)
      end
      field :champion, Types::Objects::ChampionType, null: true, description: "自チャンピオンのマスタ情報"
      field :opponent_champion, Types::Objects::ChampionType, null: true, description: "対面チャンピオンのマスタ情報"

      # 親 Match の情報
      field :game_mode, String, null: false
      def game_mode
        object.match.game_mode
      end

      field :game_duration, Integer, null: false, description: "Match duration in seconds"
      def game_duration
        object.match.game_duration
      end

      field :game_creation, GraphQL::Types::ISO8601DateTime, null: true
      def game_creation
        object.match.game_creation
      end

      field :queue_id, Integer, null: true
      def queue_id
        object.match.queue_id
      end

      field :queue_name, String, null: false
      def queue_name
        case object.match.queue_id
        when 420 then "Ranked Solo"
        when 440 then "Ranked Flex"
        when 400 then "Normal Draft"
        when 430 then "Normal Blind"
        when 450 then "ARAM"
        when 490 then "Quickplay"
        else "Classic"
        end
      end

      private

      def timeline_analysis
        @timeline_analysis ||= begin
          raw_timeline = object.match&.raw_timeline
          raw_info = object.match&.raw_info
          if raw_timeline.present? && raw_info.present?
            TimelineAnalysisService.new(
              timeline_data: raw_timeline,
              match_raw_info: raw_info,
              puuid: object.summoner.puuid,
              opponent_champion_name: object.opponent_champion_name
            ).analyze
          else
            {}
          end
        end
      end
    end
  end
end
