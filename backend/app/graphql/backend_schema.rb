# frozen_string_literal: true

class BackendSchema < GraphQL::Schema
  mutation(Types::MutationType)
  query(Types::QueryType)

  # For batch-loading (see https://graphql-ruby.org/dataloader/overview.html)
  use GraphQL::Dataloader

  # GraphQL-Ruby calls this when something goes wrong while running a query:
  def self.type_error(err, context)
    # if err.is_a?(GraphQL::InvalidNullError)
    #   # report to your bug tracker here
    #   return nil
    # end
    super
  end

  # Union and Interface Resolution
  def self.resolve_type(abstract_type, obj, ctx)
    # TODO: Implement this method
    # to return the correct GraphQL object type for `obj`
    raise(GraphQL::RequiredImplementationMissingError)
  end

  # Limit the depth and size of incoming queries:
  max_depth 12
  max_complexity 300
  max_query_string_tokens 5000

  # Disable GraphQL introspection in production unless explicitly enabled:
  disable_introspection_entry_points if Rails.env.production? && ENV["ENABLE_INTROSPECTION"] != "true"

  # Stop validating when it encounters this many errors:
  validate_max_errors 100
end
