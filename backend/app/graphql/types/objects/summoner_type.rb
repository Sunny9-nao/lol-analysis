# frozen_string_literal: true

module Types
  module Objects
    class SummonerType < Types::BaseObject
      description "Summoner profile and persistent match history"

      field :id, ID, null: false
      field :puuid, String, null: true
      field :game_name, String, null: false
      field :tag_line, String, null: false
      field :riot_id, String, null: false, description: "Full Riot ID (gameName#tagLine)"
      field :summoner_level, Integer, null: true
      field :profile_icon_id, Integer, null: true
      field :profile_icon_url, String, null: true
      field :is_private, Boolean, null: false, description: "Whether this account is private"
      field :last_synced_at, GraphQL::Types::ISO8601DateTime, null: true
      field :recent_win_rate, Float, null: true, description: "Win rate percentage across recorded matches"

      # 直近の参加試合レコード一覧 (最新順)
      field :match_participants, [Types::Objects::MatchParticipantType], null: false,
        description: "Participant records with matchup and item data"

      def match_participants
        return [] if object.is_private
        object.match_participants.includes(:match, :match_note, :champion, :opponent_champion).order(created_at: :desc)
      end
    end
  end
end
