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
      field :items, [Integer], null: true, description: "List of item IDs purchased"
      field :spells, [Integer], null: true, description: "Summoner spell IDs"

      # モデルのメソッドから自動解決されるフィールド
      field :kda_ratio, Float, null: false, description: "Calculated KDA ratio"
      field :formatted_duration, String, null: false, description: "Match duration (mm:ss)"

      # 関連テーブル
      field :match_note, Types::Objects::MatchNoteType, null: true, description: "Personal note for this match"
      field :champion, Types::Objects::ChampionType, null: true, description: "自チャンピオンのマスタ情報"
      field :opponent_champion, Types::Objects::ChampionType, null: true, description: "対面チャンピオンのマスタ情報"

      # 親 Match の情報
      field :game_mode, String, null: false
      def game_mode
        object.match.game_mode
      end

      field :game_creation, GraphQL::Types::ISO8601DateTime, null: true
      def game_creation
        object.match.game_creation
      end
    end
  end
end
