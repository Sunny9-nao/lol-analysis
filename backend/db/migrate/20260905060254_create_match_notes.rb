class CreateMatchNotes < ActiveRecord::Migration[8.1]
  def change
    create_table :match_notes do |t|
      t.references :match_participant, index: { unique: true }, null: false, foreign_key: true
      t.text :content
      t.string :matchup_tag

      t.timestamps
    end
  end
end
