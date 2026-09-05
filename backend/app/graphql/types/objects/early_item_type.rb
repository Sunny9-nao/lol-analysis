# frozen_string_literal: true

module Types
  module Objects
    class EarlyItemType < Types::BaseObject
      description "Early item purchase event log item"

      field :timestamp, String, null: false, description: "Time of purchase in mm:ss"
      field :item_id, Integer, null: false, description: "Item ID"

      def item_id
        object["itemId"] || object[:itemId] || object["item_id"] || object[:item_id]
      end

      def timestamp
        object["timestamp"] || object[:timestamp]
      end
    end
  end
end
