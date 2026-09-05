ENV["BUNDLE_GEMFILE"] ||= File.expand_path("../Gemfile", __dir__)

require "bundler/setup" # Set up gems listed in the Gemfile.
require "bootsnap/setup" # Speed up boot time by caching expensive operations.

# Normalize empty database URLs to nil so ActiveRecord doesn't crash on empty strings
%w[DATABASE_URL SOLID_CACHE_DATABASE_URL SOLID_QUEUE_DATABASE_URL SOLID_CABLE_DATABASE_URL].each do |var|
  ENV.delete(var) if ENV[var]&.strip&.empty?
end
