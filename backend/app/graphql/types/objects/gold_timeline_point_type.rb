# frozen_string_literal: true

module Types
  module Objects
    class GoldTimelinePointType < Types::BaseObject
      description "Minute-by-minute gold difference data point"

      field :minute, Integer, null: false, description: "Game minute (0, 1, 2, ...)"
      field :gold_diff, Integer, null: true, description: "Gold difference against direct lane opponent (myGold - oppGold)"
      field :my_gold, Integer, null: false, description: "Cumulative gold of the participant"
      field :opp_gold, Integer, null: true, description: "Cumulative gold of the lane opponent"

      def minute
        object["minute"] || object[:minute]
      end

      def gold_diff
        object["gold_diff"] || object[:gold_diff]
      end

      def my_gold
        object["my_gold"] || object[:my_gold]
      end

      def opp_gold
        object["opp_gold"] || object[:opp_gold]
      end
    end
  end
end
