# frozen_string_literal: true

module Mutations
  class SignIn < BaseMutation
    description "ユーザーログイン"

    argument :email, String, required: true, description: "メールアドレス"
    argument :password, String, required: true, description: "パスワード"

    field :user, Types::Objects::UserType, null: true
    field :auth_token, String, null: true
    field :errors, [ String ], null: false

    def resolve(email:, password:)
      user = User.find_by("LOWER(email) = ?", email.downcase.strip)

      if user&.authenticate(password)
        user.regenerate_auth_token if user.auth_token.blank?
        { user: user, auth_token: user.auth_token, errors: [] }
      else
        { user: nil, auth_token: nil, errors: [ "メールアドレスまたはパスワードが正しくありません" ] }
      end
    end
  end
end
