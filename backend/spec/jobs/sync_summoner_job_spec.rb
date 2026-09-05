# frozen_string_literal: true

require "rails_helper"

RSpec.describe SyncSummonerJob, type: :job do
  let(:summoner) do
    Summoner.create!(
      puuid: "test-puuid-job-1",
      game_name: "JobTest",
      tag_line: "JP1",
      sync_status: "idle"
    )
  end
  let(:mock_service) { instance_double(SummonerSyncService) }

  before do
    allow(SummonerSyncService).to receive(:new).and_return(mock_service)
  end

  it "updates status to syncing then idle on success" do
    expect(mock_service).to receive(:sync).with(game_name: "JobTest", tag_line: "JP1", force: true) do
      # During execution, status should be syncing
      expect(summoner.reload.sync_status).to eq("syncing")
    end

    described_class.perform_now(summoner.id, force: true)

    expect(summoner.reload.sync_status).to eq("idle")
    expect(summoner.sync_error).to be_nil
  end

  it "updates status to failed with error message when service raises" do
    allow(mock_service).to receive(:sync).and_raise(StandardError.new("Rate limit exceeded"))

    expect {
      described_class.perform_now(summoner.id, force: true)
    }.to raise_error(StandardError, "Rate limit exceeded")

    expect(summoner.reload.sync_status).to eq("failed")
    expect(summoner.sync_error).to eq("Rate limit exceeded")
  end

  it "ignores missing summoner gracefully" do
    expect {
      described_class.perform_now(999_999)
    }.not_to raise_error
  end
end
