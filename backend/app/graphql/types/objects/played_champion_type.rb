# frozen_string_literal: true

module Types
  module Objects
    class PlayedChampionType < Types::BaseObject
      description "Summary of a champion played by the summoner"

      field :champion_name, String, null: false, description: "Champion identifier"
      field :match_count, Integer, null: false, description: "Total matches played with this champion"
      field :win_count, Integer, null: false, description: "Total wins with this champion"
      field :win_rate, Float, null: false, description: "Win rate percentage"
      field :most_played_position, String, null: true, description: "Most played role/position"
      field :champion, Types::Objects::ChampionType, null: true, description: "Champion master details"
    end
  end
end
