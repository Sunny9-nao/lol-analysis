# frozen_string_literal: true

class Summoner < ApplicationRecord
  has_many :match_participants, dependent: :destroy
  has_many :matches, through: :match_participants

  validates :puuid, presence: true, uniqueness: true
  validates :game_name, :tag_line, presence: true

  def riot_id
    "#{game_name}##{tag_line}"
  end

  def profile_icon_url
    return nil unless profile_icon_id
    "https://ddragon.leagueoflegends.com/cdn/14.24.1/img/profileicon/#{profile_icon_id}.png"
  end

  def recent_win_rate
    ranked_parts = match_participants.joins(:match).where(matches: { queue_id: 420 })
    total = ranked_parts.count
    return nil if total.zero?

    wins = ranked_parts.where(win: true).count
    ((wins.to_f / total) * 100).round(1)
  end
end
