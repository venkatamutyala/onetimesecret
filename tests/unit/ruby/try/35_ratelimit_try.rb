# frozen_string_literal: true

# These tryouts test the rate limiting functionality in the OneTime application.
# They cover various aspects of rate limiting, including:
#
# 1. Defining and registering rate limit events
# 2. Creating and managing rate limiters
# 3. Checking if limits are exceeded
# 4. Handling exceptions when limits are exceeded
# 5. Redis key management and expiration
# 6. Integration with the RateLimited mixin
# 7. Familia::String inheritance behavior
# 8. Time window management
#
# These tests aim to verify the correct behavior of the OT::RateLimit class
# and RateLimited mixin, which are essential for preventing abuse and ensuring
# fair usage of the application.

require 'onetime'

# Use the default config file for tests
OT::Config.path = File.join(Onetime::HOME, 'tests', 'unit', 'ruby', 'config.test.yaml')
OT.boot! :test

# Setup section - define instance variables accessible across all tryouts
@stamp = OT::RateLimit.eventstamp
@identifier = "tryouts-#{OT.entropy[0,8]}"
@limiter = OT::RateLimit.new @identifier, :test_limit

# Create a test class that includes RateLimited
class TestRateLimited
  include Onetime::Models::RateLimited
  attr_accessor :id
  def initialize(id)
    @id = id
  end
  def external_identifier
    "test-#{id}"
  end
end

@test_obj = TestRateLimited.new("abc123")

## Has events defined
OT::RateLimit.events.class
#=> Hash

## Can register a new event
OT::RateLimit.register_event :test_limit, 3
#=> 3

## Can register multiple events at once
OT::RateLimit.register_events(bulk_limit: 5, api_limit: 10)
[OT::RateLimit.events[:bulk_limit], OT::RateLimit.events[:api_limit]]
#=> [5, 10]

## Uses default limit for unregistered events
OT::RateLimit.event_limit(:unknown_event)
#=> 25

## Creates limiter with proper Redis key format
[@limiter.class, @limiter.rediskey]
#=> [Onetime::RateLimit, "limiter:#{@identifier}:test_limit:#{@stamp}:counter"]

## Can get the external identifier of the limiter
pp [:identifier, @limiter.identifier, @identifier]
@limiter.external_identifier
#=> @identifier

## Can extract event from Redis key
@limiter.event
#=> :test_limit

## Redis key does not exist initially
@limiter.exists?
#=> false

## Redis key is created after first increment
p @limiter.incr!
@limiter.exists?
#=> true

## Redis relation key has proper TTL (should be around 1200 seconds / 20 minutes)
ttl = @limiter.realttl
p [:ttl, ttl, @limiter.realttl, @limiter.class.ttl]
(ttl > 1100 && ttl <= 1200)
#=> true

## Redis relation key is updated when parent is updated
before_ttl = @limiter.realttl
p [:before, before_ttl]
@limiter.update_expiration(ttl: 5)
after_ttl = @limiter.realttl
p [:after, after_ttl]
[before_ttl, after_ttl]
#=> [1200, 5]

## Can track multiple increments
@limiter.clear
2.times { @limiter.incr! }
@limiter.count
#=> 2

## Knows when not exceeded
@limiter.exceeded?
#=> false

## Knows when exceeded
begin
  4.times { @limiter.incr! } # Will exceed limit of 3
rescue OT::LimitExceeded => ex
  [ex.class, ex.event, ex.identifier, ex.count]
end
#=> [OT::LimitExceeded, :test_limit, @identifier, 4]

## Can clear limiter data
@limiter.clear
@limiter.redis.exists?(@limiter.rediskey)
#=> false

## RateLimited objects can increment events
@test_obj.event_incr! :test_limit
OT::RateLimit.load(@test_obj.external_identifier, :test_limit).value
#=> 1

## RateLimited objects can get event counts
@test_obj.event_get(:test_limit)
#=> 1

## RateLimited objects can clear events
@test_obj.event_clear! :test_limit
@test_obj.event_get(:test_limit)
#=> 0

## Different events use different Redis keys
limiter1 = OT::RateLimit.new @identifier, :test_limit
limiter2 = OT::RateLimit.new @identifier, :other_limit
[limiter1.rediskey == limiter2.rediskey, limiter1.rediskey.include?("test_limit"), limiter2.rediskey.include?("other_limit")]
#=> [false, true, true]

## Different identifiers use different Redis keys
limiter1 = OT::RateLimit.new "id1", :test_limit
limiter2 = OT::RateLimit.new "id2", :test_limit
[limiter1.rediskey == limiter2.rediskey, limiter1.rediskey.include?("id1"), limiter2.rediskey.include?("id2")]
#=> [false, true, true]

## Time windows are properly rounded
now = Time.now.utc
rounded = now - (now.to_i % (20 * 60)) # 20 minutes in seconds
expected = rounded.strftime('%H%M')
#=> OT::RateLimit.eventstamp

## Time windows round properly at edges
now = Time.now.utc
window_size = 20 * 60 # 20 minutes in seconds
rounded = now - (now.to_i % window_size)
edge = Time.at(rounded.to_i + 1).utc # 1 second after window start
OT::RateLimit.eventstamp == rounded.strftime('%H%M')
#=> true

## Time windows round properly near boundaries
now = Time.now.utc
window_size = 20 * 60 # 20 minutes in seconds
rounded = now - (now.to_i % window_size)
near_edge = Time.at(rounded.to_i + window_size - 1).utc # 1 second before next window
OT::RateLimit.eventstamp == rounded.strftime('%H%M')
#=> true

## Different time windows use different Redis keys
@limiter.clear
window1_stamp = OT::RateLimit.eventstamp
@limiter.incr!
# Create key for next time window (20 minutes later)
next_window = Time.now.utc + (20 * 60)
window2_stamp = next_window.strftime('%H%M')
key1 = "limiter:#{@identifier}:test_limit:#{window1_stamp}:counter"
key2 = "limiter:#{@identifier}:test_limit:#{window2_stamp}:counter"
[key1 == key2, @limiter.redis.exists?(key1), @limiter.redis.exists?(key2)]
#=> [false, true, false]

## Counts are isolated between time windows
@limiter.clear
# Set up data in current window
current_key = @limiter.rediskey
3.times { @limiter.incr! }
@limiter.redis.get(current_key).to_i
#=> 3

## Cleanup: clear all test data
[@limiter, OT::RateLimit.new("id1", :test_limit), OT::RateLimit.new("id2", :test_limit)].each(&:clear)
OT::RateLimit.clear! @test_obj.external_identifier, :test_limit
[:test_limit, :bulk_limit, :api_limit].each do |event|
  OT::RateLimit.clear! @identifier, event
end
