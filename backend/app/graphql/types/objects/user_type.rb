# frozen_string_literal: true

module Types
  module Objects
    class UserType < Types::BaseObject
      description "ログインユーザー情報"

      field :id, ID, null: false
      field :email, String, null: false
      field :auth_token, String, null: true
      field :summoner, Types::Objects::SummonerType, null: true
      field :created_at, GraphQL::Types::ISO8601DateTime, null: false
      field :updated_at, GraphQL::Types::ISO8601DateTime, null: false
    end
  end
end
