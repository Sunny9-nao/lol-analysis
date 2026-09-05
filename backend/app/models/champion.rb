# frozen_string_literal: true

class Champion < ApplicationRecord
  validates :champion_name, presence: true, uniqueness: true
end
