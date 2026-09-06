# frozen_string_literal: true

class AddTimelineSummaryToMatchParticipants < ActiveRecord::Migration[8.1]
  def change
    add_column :match_participants, :gold_timeline, :json
    add_column :match_participants, :kill_events, :json
    add_column :match_participants, :item_timeline, :json
  end
end
