# frozen_string_literal: true

class Match < ApplicationRecord
  has_many :match_participants, dependent: :destroy
  has_many :summoners, through: :match_participants

  validates :match_id, presence: true, uniqueness: true
end
