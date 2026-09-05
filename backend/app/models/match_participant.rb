# frozen_string_literal: true

class MatchParticipant < ApplicationRecord
  belongs_to :summoner
  belongs_to :match
  has_many :match_notes, dependent: :destroy
  belongs_to :champion, foreign_key: :champion_name, primary_key: :champion_name, optional: true
  belongs_to :opponent_champion, class_name: "Champion", foreign_key: :opponent_champion_name, primary_key: :champion_name, optional: true

  validates :champion_name, presence: true
  validates :summoner_id, uniqueness: { scope: :match_id }

  def kda_ratio
    ((kills + assists) / [ deaths, 1 ].max.to_f).round(2)
  end

  def formatted_duration
    sec = match&.game_duration || 0
    min = sec / 60
    format("%02d:%02d", min, sec % 60)
  end
end
