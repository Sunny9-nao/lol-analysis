# frozen_string_literal: true

require "rubocop"

module RuboCop
  module Cop
    module Custom
      # Service層およびJob層での生 puts/print/p の直接呼び出しを禁止し、
      # 構造化ログ（Rails.logger.info, Rails.logger.error 等）の使用を強制するカスタムCop。
      class NoRawPutsInServices < Base
        MSG = "Service層やJob層で `%<method>s` を直接呼び出さないでください。代わりに `Rails.logger` を使用してください。"
        RESTRICT_ON_SEND = %i[puts print p].freeze

        def on_send(node)
          return unless in_service_or_job?

          # レシーバがない呼び出し（例: puts "hello"）または Kernel.puts などの場合を対象
          return if node.receiver && !node.receiver.const_name&.eql?("Kernel")

          add_offense(node, message: format(MSG, method: node.method_name))
        end

        private

        def in_service_or_job?
          file_path = processed_source.file_path
          file_path.include?("/app/services/") || file_path.include?("/app/jobs/")
        end
      end
    end
  end
end
