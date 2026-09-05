# frozen_string_literal: true

module Types
  module Objects
    class MatchType < Types::BaseObject
      description "A single match record for a player"

      field :match_id, String, null: false, description: "Match identifier (e.g. JP1_600691112)"
      field :game_mode, String, null: false, description: "Game mode (e.g. CLASSIC, ARAM)"
      field :game_duration, Integer, null: false, description: "Match duration in seconds"
      field :champion_name, String, null: false, description: "Champion played by the player"
      field :win, Boolean, null: false, description: "Whether the player won the match"
      field :kills, Integer, null: false
      field :deaths, Integer, null: false
      field :assists, Integer, null: false
      field :total_damage_dealt, Integer, null: true, description: "Total damage dealt to champions"
      field :gold_earned, Integer, null: true, description: "Gold earned in the match"

      # --- 計算フィールド（GraphQLのType層で追加する便利プロパティ） ---

      # KDA 比率の計算: (K + A) / max(D, 1)
      field :kda_ratio, Float, null: false, description: "Calculated KDA ratio (K+A)/D"
      def kda_ratio
        # object は Service層から渡された Hash または Struct
        k = object[:kills] || object["kills"] || 0
        d = object[:deaths] || object["deaths"] || 0
        a = object[:assists] || object["assists"] || 0
        ((k + a) / [d, 1].max.to_f).round(2)
      end

      # 試合時間（分:秒 形式の文字列）
      field :formatted_duration, String, null: false, description: "Formatted duration (mm:ss)"
      def formatted_duration
        sec = object[:game_duration] || object["game_duration"] || 0
        min = sec / 60
        remaining_sec = sec % 60
        format("%02d:%02d", min, remaining_sec)
      end
    end
  end
end
