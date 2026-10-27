require "test_helper"

class FoundationTest < ActiveSupport::TestCase
  test "installation stores a digest and database rejects duplicate credentials" do
    digest = Digest::SHA256.hexdigest(SecureRandom.hex(32))
    installation = Installation.create!(credential_digest: digest)
    assert_match(/\A[0-9a-f-]{36}\z/, installation.id)
    assert_not Installation.column_names.include?("credential")
    assert_raises(ActiveRecord::RecordNotUnique) do
      Installation.insert_all!([{ id: SecureRandom.uuid, credential_digest: digest, created_at: Time.current, updated_at: Time.current }])
    end
  end

  test "subscription event ID has a database uniqueness constraint" do
    attributes = { revenuecat_event_id: "event-1", app_user_id: "anonymous-user", event_type: "INITIAL_PURCHASE", created_at: Time.current, updated_at: Time.current }
    SubscriptionEvent.insert_all!([attributes])
    assert_raises(ActiveRecord::RecordNotUnique) { SubscriptionEvent.insert_all!([attributes]) }
  end

  test "AI database rejects negative usage" do
    installation = Installation.create!(credential_digest: "a" * 64)
    attributes = { installation_id: installation.id, request_identifier: SecureRandom.uuid, provider: "test", model: "test", created_at: Time.current, updated_at: Time.current }
    assert_raises(ActiveRecord::StatementInvalid) { AiRequest.insert_all!([attributes.merge(input_tokens: -1)]) }
  end

  test "AI database requires an existing installation" do
    attributes = { installation_id: SecureRandom.uuid, request_identifier: SecureRandom.uuid, provider: "test", model: "test", created_at: Time.current, updated_at: Time.current }
    assert_raises(ActiveRecord::InvalidForeignKey) { AiRequest.insert_all!([attributes]) }
  end

  test "content database enforces valid release checksums" do
    attributes = { version: "test", schema_version: 1, checksum: "invalid", asset_url: "https://example.com/content.db", size_bytes: 100, created_at: Time.current, updated_at: Time.current }
    assert_raises(ActiveRecord::StatementInvalid) { ContentRelease.insert_all!([attributes]) }
  end
end
