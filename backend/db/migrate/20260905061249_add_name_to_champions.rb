class AddNameToChampions < ActiveRecord::Migration[8.1]
  def change
    add_column :champions, :name, :string
  end
end
