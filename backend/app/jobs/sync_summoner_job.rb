# frozen_string_literal: true

class SyncSummonerJob < ApplicationJob
  queue_as :default

  def perform(summoner_id, force: true)
    summoner = Summoner.find_by(id: summoner_id)
    return unless summoner

    summoner.update!(sync_status: "syncing", sync_error: nil)

    begin
      SummonerSyncService.new.sync(game_name: summoner.game_name, tag_line: summoner.tag_line, force: force)
      summoner.reload.update!(sync_status: "idle", sync_error: nil)
    rescue StandardError => e
      Rails.logger.error("[SyncSummonerJob] Error syncing summoner #{summoner_id}: #{e.message}")
      summoner.update!(sync_status: "failed", sync_error: e.message)
      raise e unless Rails.env.production?
    end
  end
end
