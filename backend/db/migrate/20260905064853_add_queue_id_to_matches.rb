class AddQueueIdToMatches < ActiveRecord::Migration[8.1]
  def change
    add_column :matches, :queue_id, :integer
    add_index :matches, :queue_id
  end
end
