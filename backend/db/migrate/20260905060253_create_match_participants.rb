class CreateMatchParticipants < ActiveRecord::Migration[8.1]
  def change
    create_table :match_participants do |t|
      t.references :summoner, null: false, foreign_key: true
      t.references :match, null: false, foreign_key: true
      t.string :champion_name, null: false
      t.string :opponent_champion_name
      t.string :position
      t.boolean :win, null: false
      t.integer :kills, default: 0, null: false
      t.integer :deaths, default: 0, null: false
      t.integer :assists, default: 0, null: false
      t.integer :cs, default: 0, null: false
      t.integer :gold_earned, default: 0, null: false
      t.integer :total_damage_dealt, default: 0, null: false
      t.json :items
      t.json :spells
      t.json :raw_participant

      t.timestamps
    end
    add_index :match_participants, [ :summoner_id, :match_id ], unique: true
    add_index :match_participants, :champion_name
    add_index :match_participants, :opponent_champion_name
    add_index :match_participants, :win
  end
end
