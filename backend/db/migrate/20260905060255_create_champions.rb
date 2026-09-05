class CreateChampions < ActiveRecord::Migration[8.1]
  def change
    create_table :champions do |t|
      t.string :champion_name
      t.string :title
      t.string :image_url

      t.timestamps
    end
    add_index :champions, :champion_name, unique: true
  end
end
