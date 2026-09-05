# frozen_string_literal: true

module GraphQLHelper
  # GraphQL クエリを実行して結果の Hash を返すヘルパー
  def execute_graphql(query, variables: {}, context: {})
    result = BackendSchema.execute(
      query,
      variables: variables.deep_stringify_keys,
      context: context
    )
    result.to_h
  end
end

RSpec.configure do |config|
  config.include GraphQLHelper, type: :request
  config.include GraphQLHelper, type: :graphql
end
