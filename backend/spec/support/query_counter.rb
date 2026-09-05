# frozen_string_literal: true

module QueryCounterHelper
  # ブロック内で発行された SQL クエリの回数をカウントする
  def count_queries(&block)
    count = 0
    counter = ->(*, payload) {
      # SCHEMA や EXPLAIN 以外の SQL をカウント
      count += 1 unless %w[SCHEMA EXPLAIN].include?(payload[:name])
    }
    ActiveSupport::Notifications.subscribed(counter, "sql.active_record", &block)
    count
  end
end

RSpec.configure do |config|
  config.include QueryCounterHelper
end
