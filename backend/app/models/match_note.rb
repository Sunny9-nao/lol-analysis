# frozen_string_literal: true

class MatchNote < ApplicationRecord
  belongs_to :match_participant

  validates :content, presence: true
end
