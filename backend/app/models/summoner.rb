# frozen_string_literal: true

class Summoner < ApplicationRecord
  has_many :match_participants, dependent: :destroy
  has_many :matches, through: :match_participants
  has_one :user, dependent: :nullify

  validates :puuid, presence: true, uniqueness: true
  validates :game_name, :tag_line, presence: true
  validates :sync_status, inclusion: { in: %w[idle syncing failed] }

  SYNC_TIMEOUT = 2.minutes

  # 同期中かつタイムアウト（2分以上経過）しているかを判定
  def sync_stale?
    sync_status == "syncing" && (updated_at.blank? || updated_at < SYNC_TIMEOUT.ago)
  end

  # 現在実際に同期中（アクティブ）であるか
  def currently_syncing?
    sync_status == "syncing" && !sync_stale?
  end

  # ゾンビ同期状態を安全にリセット
  def heal_stale_sync!
    return unless sync_stale?

    update_columns(
      sync_status: "failed",
      sync_error: "前回の同期処理がタイムアウトしました。再試行してください。",
      updated_at: Time.current
    )
  end

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
