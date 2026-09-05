# frozen_string_literal: true

module Types
  module Objects
    class TimelineKillEventType < Types::BaseObject
      description "Kill/Death event during the match for timeline plotting"

      field :minute, Float, null: false, description: "Minute of the event (e.g. 8.5)"
      field :timestamp, String, null: false, description: "Timestamp mm:ss"
      field :category, String, null: false, description: "solo_kill_opp, death_to_opp, kill_other, death_other, assist"
      field :label, String, null: false, description: "Japanese label for UI (対面キル, 対面にデス, etc.)"
      field :killer, String, null: false, description: "Champion name of killer"
      field :victim, String, null: false, description: "Champion name of victim"

      def minute
        object["minute"] || object[:minute]
      end

      def timestamp
        object["timestamp"] || object[:timestamp]
      end

      def category
        object["category"] || object[:category]
      end

      def label
        object["label"] || object[:label]
      end

      def killer
        object["killer"] || object[:killer]
      end

      def victim
        object["victim"] || object[:victim]
      end
    end
  end
end
