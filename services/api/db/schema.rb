# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_10_27_000100) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "ai_requests", force: :cascade do |t|
    t.uuid "installation_id", null: false
    t.string "request_identifier", null: false
    t.string "verse_ref"
    t.string "provider", null: false
    t.string "model", null: false
    t.string "status", default: "pending", null: false
    t.integer "input_tokens", default: 0, null: false
    t.integer "output_tokens", default: 0, null: false
    t.bigint "cost_microusd", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["installation_id", "created_at"], name: "index_ai_requests_on_installation_id_and_created_at"
    t.index ["installation_id"], name: "index_ai_requests_on_installation_id"
    t.index ["request_identifier"], name: "index_ai_requests_on_request_identifier", unique: true
    t.check_constraint "input_tokens >= 0 AND output_tokens >= 0 AND cost_microusd >= 0", name: "ai_usage_nonnegative"
    t.check_constraint "status::text = ANY (ARRAY['pending'::character varying, 'succeeded'::character varying, 'failed'::character varying, 'rate_limited'::character varying]::text[])", name: "ai_status_valid"
  end

  create_table "content_releases", force: :cascade do |t|
    t.string "version", null: false
    t.integer "schema_version", null: false
    t.string "checksum", null: false
    t.text "asset_url", null: false
    t.bigint "size_bytes", null: false
    t.datetime "published_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["schema_version", "published_at"], name: "index_content_releases_on_schema_version_and_published_at"
    t.index ["version"], name: "index_content_releases_on_version", unique: true
    t.check_constraint "asset_url ~~ 'https://%'::text", name: "content_asset_https"
    t.check_constraint "checksum::text ~ '^[a-f0-9]{64}$'::text", name: "content_checksum_format"
    t.check_constraint "size_bytes > 0 AND schema_version > 0", name: "content_release_positive_sizes"
  end

  create_table "installations", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "credential_digest", null: false
    t.datetime "revoked_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["credential_digest"], name: "index_installations_on_credential_digest", unique: true
    t.check_constraint "credential_digest::text ~ '^[a-f0-9]{64}$'::text", name: "installation_digest_format"
  end

  create_table "subscription_events", force: :cascade do |t|
    t.string "revenuecat_event_id", null: false
    t.string "app_user_id", null: false
    t.string "event_type", null: false
    t.jsonb "payload", default: {}, null: false
    t.datetime "processed_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["app_user_id"], name: "index_subscription_events_on_app_user_id"
    t.index ["revenuecat_event_id"], name: "index_subscription_events_on_revenuecat_event_id", unique: true
  end

  add_foreign_key "ai_requests", "installations"
end
