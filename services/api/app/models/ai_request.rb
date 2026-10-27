class AiRequest < ApplicationRecord
  belongs_to :installation
  validates :request_identifier, presence: true, uniqueness: true
  validates :provider, :model, presence: true
  validates :status, inclusion: { in: %w[pending succeeded failed rate_limited] }
  validates :input_tokens, :output_tokens, :cost_microusd, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
end
