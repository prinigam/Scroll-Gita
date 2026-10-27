class SubscriptionEvent < ApplicationRecord
  validates :revenuecat_event_id, presence: true, uniqueness: true
  validates :app_user_id, :event_type, presence: true
end
