# frozen_string_literal: true

module Types
  module Objects
    class MatchupSummaryType < Types::BaseObject
      description "Aggregated matchup statistics against a specific opponent champion"

      field :opponent_champion_name, String, null: false, description: "Direct lane opponent champion identifier"
      field :match_count, Integer, null: false, description: "Total matches against this opponent"
      field :win_count, Integer, null: false, description: "Total wins against this opponent"
      field :win_rate, Float, null: false, description: "Win rate percentage against this opponent"
      field :average_kda, Float, null: false, description: "Average KDA ratio against this opponent"
      field :average_cs_per_minute, Float, null: false, description: "Average CS per minute"
      field :hard_count, Integer, null: false, description: "Number of matches tagged as Hard"
      field :even_count, Integer, null: false, description: "Number of matches tagged as Even"
      field :easy_count, Integer, null: false, description: "Number of matches tagged as Easy"

      field :champion_name, String, null: true, description: "Player champion identifier (used in reverse matchup queries)"
      field :champion, Types::Objects::ChampionType, null: true, description: "Player champion master details"
      field :latest_note, Types::Objects::MatchNoteType, null: true, description: "Most recent match note against this opponent"
      field :opponent_champion, Types::Objects::ChampionType, null: true, description: "Opponent champion master details"
    end
  end
end
