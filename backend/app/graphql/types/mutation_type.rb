# frozen_string_literal: true

module Types
  class MutationType < Types::BaseObject
    # 認証
    field :sign_in, mutation: Mutations::SignIn
    field :sign_up, mutation: Mutations::SignUp

    # サモナー連携
    field :link_summoner, mutation: Mutations::LinkSummoner

    # 試合反省メモの保存・更新
    field :save_match_note, mutation: Mutations::SaveMatchNote

    # アカウントおよび個人データの完全削除
    field :delete_account, mutation: Mutations::DeleteAccount
  end
end
