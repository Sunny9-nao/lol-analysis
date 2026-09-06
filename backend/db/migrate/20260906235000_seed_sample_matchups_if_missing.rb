# frozen_string_literal: true

class SeedSampleMatchupsIfMissing < ActiveRecord::Migration[8.0]
  def up
    unless Summoner.exists?(game_name: "Sunny9", tag_line: "hono")
      load Rails.root.join("db/sample_matchups_seed.rb")
    end
  end

  def down
    # No-op
  end
end
