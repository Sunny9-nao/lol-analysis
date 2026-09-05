class CreateSummoners < ActiveRecord::Migration[8.1]
  def change
    create_table :summoners do |t|
      t.string :puuid, null: false
      t.string :game_name, null: false
      t.string :tag_line, null: false
      t.integer :summoner_level
      t.integer :profile_icon_id
      t.boolean :is_private, default: false, null: false
      t.datetime :last_synced_at
      t.json :raw_data

      t.timestamps
    end
    add_index :summoners, :puuid, unique: true
    add_index :summoners, [ :game_name, :tag_line ]
  end
end
