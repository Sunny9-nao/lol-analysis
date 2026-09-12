# frozen_string_literal: true

require "rubocop"

module RuboCop
  module Cop
    module Custom
      # 本番コードおよびテストコードにおいて、privateメソッドをこじ開けるための
      # `send` や `__send__` の呼び出しを完全に禁止するカスタムCop。
      class NoPrivateSend < Base
        MSG = "`%<method>s` による非公開メソッドの呼び出しは禁止されています。" \
              "テストコードであっても公開メソッド（振る舞い）を通じてテストするか、適切なクラス設計を行ってください。"
        RESTRICT_ON_SEND = %i[send __send__].freeze

        def on_send(node)
          # 引数なしの呼び出し（例: socket.send など特殊な引数形態）を除外するため、
          # 第一引数がシンボルまたは文字列でメソッド名を指定している呼び出しを検知
          first_arg = node.first_argument
          return unless first_arg && (first_arg.sym_type? || first_arg.str_type?)

          add_offense(node, message: format(MSG, method: node.method_name))
        end
      end
    end
  end
end
