# frozen_string_literal: true

module Types
  module Objects
    class ChampionType < Types::BaseObject
      description "Champion master data"

      field :id, ID, null: false
      field :champion_name, String, null: false, description: "英語識別子 (例: Jax)"
      field :name, String, null: true, description: "日本語表示名 (例: ジャックス)"
      field :title, String, null: true, description: "称号 (例: 武器の達人)"
      field :image_url, String, null: true, description: "公式アイコン画像URL"
    end
  end
end
