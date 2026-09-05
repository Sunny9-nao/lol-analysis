# frozen_string_literal: true

class AddSyncStatusToSummoners < ActiveRecord::Migration[8.0]
  def change
    add_column :summoners, :sync_status, :string, default: "idle", null: false
    add_column :summoners, :sync_error, :string
  end
end
