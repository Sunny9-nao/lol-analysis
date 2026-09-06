# frozen_string_literal: true

class BackfillMatchesJob < ApplicationJob
  queue_as :default

  def perform(summoner_id, count: 30, queue: 420)
    summoner = Summoner.find_by(id: summoner_id)
    return unless summoner

    summoner.update!(sync_status: "syncing", sync_error: nil)

    begin
      result = SummonerSyncService.new.backfill_past_matches(summoner, count: count, queue: queue)
      Rails.logger.info("[BackfillMatchesJob] Summoner #{summoner_id}: imported #{result[:imported_count]} matches (has_more: #{result[:has_more]})")
      summoner.reload.update!(sync_status: "idle", sync_error: nil)
    rescue StandardError => e
      Rails.logger.error("[BackfillMatchesJob] Error backfilling summoner #{summoner_id}: #{e.message}")
      summoner.update!(sync_status: "failed", sync_error: e.message)
      raise e unless Rails.env.production?
    end
  end
end
