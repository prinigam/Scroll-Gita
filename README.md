# Scroll Gita

An iPhone-first Bhagavad Gita reader inspired by Scroll The Bible's verse feed and study interactions. Original implementation; working brand only. **Sprint 1 prototype: all bundled content is explicitly non-scriptural layout text.** No production translations have been approved.

## Repository

```text
apps/mobile/        Expo Router / React Native / TypeScript reader
services/api/       Rails API / PostgreSQL foundation
packages/storage/   Shared SQLite schemas and integration tests
content/            JSON schema, fixtures, validation, SQLite generation, rights
docs/               PRD, architecture, database, API, design, roadmap, decisions
.github/workflows/  Automated mobile/content and API checks
```

See [PRD](docs/PRD.md), [architecture](docs/ARCHITECTURE.md), [roadmap](docs/ROADMAP.md), [research](docs/RESEARCH.md) and [validation status](docs/VALIDATION.md). The reader uses bundled SQLite; it never waits for Rails.

## Mobile

Use Node 24 LTS (local validation also uses Node 26.10) and npm.

```sh
npm ci
npm run content:build
npm run mobile
```

The installed `expo-dev-client` makes a development build the default target. With an SDK-58-compatible Expo Go, use:

```sh
npm run start --workspace @scroll-gita/mobile -- --go
```

If your Expo Go does not support SDK 58, use an SDK-58 development build. `npm run ios --workspace @scroll-gita/mobile` opens an existing compatible simulator build and requires Xcode. Building native binaries requires Xcode locally (`npx expo run:ios`) or an authorized EAS setup. No remote builds have been submitted. The development EAS profile targets a simulator; preview targets physical internal distribution.

The prototype supports vertical paging, an English/Hindi control, system light/dark mode, local progress and explicit next/previous navigation. It visibly labels all fixture content. The reader can open a local verse-details/study route; reviewed explanations are pending content approval. Bookmarks, AI, onboarding, subscriptions and chapter navigation are subsequent milestones.

## Rails API

Use Ruby 3.4.2, PostgreSQL 18 (or a compatible supported version), and Bundler. `.env.example` documents variables; Rails does not automatically load this file.

```sh
cd services/api
bundle config set --local path vendor/bundle
bundle install
export PGHOST=localhost PGPORT=5432
# Set PGUSER and PGPASSWORD for your local PostgreSQL installation.
bin/rails db:prepare
bin/rails server
```

`GET http://localhost:3000/api/v1/health` verifies PostgreSQL and returns a request ID. The remaining endpoints are specified in [API.md](docs/API.md) and are not implemented yet. Production requires DATABASE_URL and SECRET_KEY_BASE, shared rate-limit storage, host restrictions and deployment configuration. No AI or billing credentials are needed for the offline prototype.

## Checks

```sh
npm run check
npm run export:ios --workspace @scroll-gita/mobile
cd services/api
RAILS_ENV=test bin/rails db:prepare
bin/rails test
bin/rails zeitwerk:check
```

`npm run content:release` **must fail** with the bundled sample dataset. Approve sources and supply complete production input before attempting a real release. Build/type checks are not proof of native rendering, offline startup, VoiceOver, frame rate or App Store readiness; those require device checks.

## Delivery boundary

Sprint 1 builds the foundation and prototype. Full functional parity remains the product target, implemented in reviewable milestones. Do not publish, purchase services, or deploy production without explicit approval. Never put provider keys in EXPO_PUBLIC variables or commit local credential files.
