# frozen_string_literal: true

class UpdateMatchNotesAndUsersForPersonalNotes < ActiveRecord::Migration[8.0]
  def up
    # 1. users.summoner_id の一意制約を解除し、同一サモナーを複数ユーザーが分析可能にする
    remove_index :users, :summoner_id if index_exists?(:users, :summoner_id)
    add_index :users, :summoner_id

    # 2. match_notes に user_id を追加 (初期は null: true)
    add_reference :match_notes, :user, null: true, foreign_key: true

    # 3. 既存の match_notes レコードに user_id をバックフィル
    default_user = User.first
    if default_user
      execute "UPDATE match_notes SET user_id = #{default_user.id} WHERE user_id IS NULL"
    else
      execute "DELETE FROM match_notes WHERE user_id IS NULL"
    end

    change_column_null :match_notes, :user_id, false

    # 4. 単一の match_participant_id インデックスを削除し、[user_id, match_participant_id] の複合ユニークにする
    remove_index :match_notes, :match_participant_id if index_exists?(:match_notes, :match_participant_id)
    add_index :match_notes, [ :user_id, :match_participant_id ], unique: true
    add_index :match_notes, :match_participant_id
  end

  def down
    remove_index :match_notes, [ :user_id, :match_participant_id ]
    remove_index :match_notes, :match_participant_id
    add_index :match_notes, :match_participant_id, unique: true

    remove_reference :match_notes, :user

    remove_index :users, :summoner_id
    add_index :users, :summoner_id, unique: true
  end
end
