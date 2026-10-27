class ContentRelease < ApplicationRecord
  validates :version, presence: true, uniqueness: true
  validates :schema_version, :size_bytes, numericality: { only_integer: true, greater_than: 0 }
  validates :checksum, format: { with: /\A[a-f0-9]{64}\z/ }
  validates :asset_url, format: { with: /\Ahttps:\/\// }
end
