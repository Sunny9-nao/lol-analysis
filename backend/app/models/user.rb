# frozen_string_literal: true

class User < ApplicationRecord
  has_secure_password
  has_secure_token :auth_token

  belongs_to :summoner, optional: true
  has_many :match_notes, dependent: :destroy

  validates :email, presence: true, uniqueness: { case_sensitive: false }, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :auth_token, uniqueness: true, allow_nil: true
end
