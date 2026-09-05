class CreateMatches < ActiveRecord::Migration[8.1]
  def change
    create_table :matches do |t|
      t.string :match_id, null: false
      t.string :game_mode, null: false
      t.integer :game_duration, null: false
      t.datetime :game_creation
      t.json :raw_info

      t.timestamps
    end
    add_index :matches, :match_id, unique: true
  end
end
