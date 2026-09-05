# frozen_string_literal: true

class MatchNote < ApplicationRecord
  belongs_to :user
  belongs_to :match_participant

  validates :content, presence: true
  validates :user_id, uniqueness: { scope: :match_participant_id }
end
