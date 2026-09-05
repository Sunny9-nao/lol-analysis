# frozen_string_literal: true

module Mutations
  class SignUp < BaseMutation
    description "ユーザー新規登録"

    argument :email, String, required: true, description: "メールアドレス"
    argument :password, String, required: true, description: "パスワード"

    field :user, Types::Objects::UserType, null: true
    field :auth_token, String, null: true
    field :errors, [ String ], null: false

    def resolve(email:, password:)
      user = User.new(email: email.strip, password: password)

      if user.save
        { user: user, auth_token: user.auth_token, errors: [] }
      else
        { user: nil, auth_token: nil, errors: user.errors.full_messages }
      end
    end
  end
end
