# frozen_string_literal: true

module Types
  module Objects
    class MatchupDetailType < Types::BaseObject
      description "Detailed matchup analysis including all individual match records"

      field :champion_name, String, null: false, description: "Player champion identifier"
      field :opponent_champion_name, String, null: false, description: "Opponent champion identifier"
      field :match_count, Integer, null: false, description: "Total matches"
      field :win_count, Integer, null: false, description: "Total wins"
      field :win_rate, Float, null: false, description: "Win rate percentage"
      field :average_kda, Float, null: false, description: "Average KDA ratio"
      field :average_cs_per_minute, Float, null: false, description: "Average CS per minute"
      field :hard_count, Integer, null: false, description: "Number of matches tagged as Hard"
      field :even_count, Integer, null: false, description: "Number of matches tagged as Even"
      field :easy_count, Integer, null: false, description: "Number of matches tagged as Easy"

      field :champion, Types::Objects::ChampionType, null: true, description: "Player champion master details"
      field :opponent_champion, Types::Objects::ChampionType, null: true, description: "Opponent champion master details"
      field :participants, [ Types::Objects::MatchParticipantType ], null: false, description: "All individual match participant records"
    end
  end
end
