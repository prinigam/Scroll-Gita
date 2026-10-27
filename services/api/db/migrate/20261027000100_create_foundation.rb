class CreateFoundation < ActiveRecord::Migration[8.1]
  def change
    create_table :installations, id: :uuid do |t|
      t.string :credential_digest, null: false
      t.datetime :revoked_at
      t.timestamps
    end
    add_index :installations, :credential_digest, unique: true
    add_check_constraint :installations, "credential_digest ~ '^[a-f0-9]{64}$'", name: "installation_digest_format"

    create_table :ai_requests do |t|
      t.references :installation, null: false, type: :uuid, foreign_key: true
      t.string :request_identifier, null: false
      t.string :verse_ref
      t.string :provider, null: false
      t.string :model, null: false
      t.string :status, null: false, default: "pending"
      t.integer :input_tokens, null: false, default: 0
      t.integer :output_tokens, null: false, default: 0
      t.bigint :cost_microusd, null: false, default: 0
      t.timestamps
    end
    add_index :ai_requests, :request_identifier, unique: true
    add_index :ai_requests, [:installation_id, :created_at]
    add_check_constraint :ai_requests, "input_tokens >= 0 AND output_tokens >= 0 AND cost_microusd >= 0", name: "ai_usage_nonnegative"
    add_check_constraint :ai_requests, "status IN ('pending', 'succeeded', 'failed', 'rate_limited')", name: "ai_status_valid"

    create_table :content_releases do |t|
      t.string :version, null: false
      t.integer :schema_version, null: false
      t.string :checksum, null: false
      t.text :asset_url, null: false
      t.bigint :size_bytes, null: false
      t.datetime :published_at
      t.timestamps
    end
    add_index :content_releases, :version, unique: true
    add_index :content_releases, [:schema_version, :published_at]
    add_check_constraint :content_releases, "size_bytes > 0 AND schema_version > 0", name: "content_release_positive_sizes"
    add_check_constraint :content_releases, "checksum ~ '^[a-f0-9]{64}$'", name: "content_checksum_format"
    add_check_constraint :content_releases, "asset_url LIKE 'https://%'", name: "content_asset_https"

    create_table :subscription_events do |t|
      t.string :revenuecat_event_id, null: false
      t.string :app_user_id, null: false
      t.string :event_type, null: false
      t.jsonb :payload, null: false, default: {}
      t.datetime :processed_at
      t.timestamps
    end
    add_index :subscription_events, :revenuecat_event_id, unique: true
    add_index :subscription_events, :app_user_id
  end
end
