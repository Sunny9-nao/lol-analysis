# frozen_string_literal: true

module Types
  module Objects
    class MatchNoteType < Types::BaseObject
      description "Player's note for a specific match"

      field :id, ID, null: false
      field :content, String, null: false
      field :matchup_tag, String, null: true
      field :created_at, GraphQL::Types::ISO8601DateTime, null: false
      field :updated_at, GraphQL::Types::ISO8601DateTime, null: false
    end
  end
end
