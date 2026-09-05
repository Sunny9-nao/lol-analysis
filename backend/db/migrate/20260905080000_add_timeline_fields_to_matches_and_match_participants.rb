class AddTimelineFieldsToMatchesAndMatchParticipants < ActiveRecord::Migration[8.1]
  def change
    add_column :matches, :raw_timeline, :json
    add_column :match_participants, :gold_diff_at_14, :integer
    add_column :match_participants, :cs_diff_at_14, :integer
    add_column :match_participants, :lane_outcome, :string
    add_column :match_participants, :early_items, :json

    add_index :match_participants, :lane_outcome
  end
end
