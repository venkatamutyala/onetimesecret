# tests/unit/ruby/rspec/onetime/refinements/rack_refinements_spec.rb

require_relative '../../spec_helper.rb'

require 'onetime/refinements/rack_refinements'

RSpec.describe Onetime::RackRefinements do
  module RefineTest
    using Onetime::RackRefinements

    def self.fetch_with_refinements(hash, key, *args, &block)
      hash.fetch(key, *args, &block)
    end

    def self.dig_with_refinements(hash, *keys)
      hash.dig(*keys)
    end
  end

  let(:nested_hash) do
    {
      "level1" => {
        "level2" => {
          symbol_key: "nested_value_symbol_key",
          "string_key" => "nested_value_string_key"
        }
      },
      deep: {
        nested: {
          value: "found"
        }
      }
    }
  end

  let(:test_hash) { {"string_key" => "value1", symbol_key: "value2"} }

  describe "#fetch" do
    context "with refinements" do
      def fetch(hash, *args, &block)
        RefineTest.fetch_with_refinements(hash, *args, &block)
      end

      it "retrieves string keys" do
        expect(fetch(test_hash, "string_key")).to eq("value1")
      end

      it "retrieves symbol keys using strings" do
        expect(fetch(test_hash, "symbol_key")).to eq("value2")
      end

      it "retrieves symbol keys using actual symbol)" do
        expect(fetch(test_hash, :symbol_key)).to eq("value2")
      end

      it "retrieves string keys using incorrect symbol" do
        expect(fetch(test_hash, :string_key)).to eq("value1")
      end

      it "returns default for missing keys" do
        expect(fetch(test_hash, "missing", "default")).to eq("default")
      end

      it "executes block for missing keys" do
        expect(fetch(test_hash, "missing") { |k| "#{k}_not_found" }).to eq("missing_not_found")
      end

      it "raises KeyError without default or block" do
        expect { fetch(test_hash, "missing") }.to raise_error(KeyError)
      end

      it "handles nil keys, by raising an error when no default provided" do
        expect { fetch(test_hash, nil) }.to raise_error(KeyError)
      end

      it "handles nil keys, by returning a default value when provided (nil)" do
        expect(fetch(test_hash, nil, nil)).to eq(nil)
      end

      it "handles nil keys, by returning a default value when provided (empty hash)" do
        expect(fetch(test_hash, nil, {})).to eq({})
      end

      it "handles nil keys, by returning a default value when provided (string)" do
        expect(fetch(test_hash, nil, 'default')).to eq('default')
      end
    end
  end

  describe '#dig' do
    let(:nested_hash) { {'a' => {'b' => {'c' => 1}}} }
    def dig(hash, *args, &block)
      RefineTest.dig_with_refinements(hash, *args, &block)
    end

    it 'retrieves nested values' do
      expect(dig(nested_hash, 'a', 'b', 'c')).to eq(1)
    end

    it 'handles symbol keys' do
      expect(dig(nested_hash, :a, :b, :c)).to eq(1)
    end


    it 'returns nil for missing nested keys' do
      expect(dig(nested_hash, 'a', 'missing', 'c')).to be_nil
    end

  end
end
