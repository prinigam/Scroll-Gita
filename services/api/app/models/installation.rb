class Installation < ApplicationRecord
  before_create { self.id ||= SecureRandom.uuid }
  has_many :ai_requests, dependent: :restrict_with_exception
  validates :credential_digest, presence: true, uniqueness: true, format: { with: /\A[a-f0-9]{64}\z/ }
end
