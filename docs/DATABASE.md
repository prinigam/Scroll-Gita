# Databases and migrations

## Mobile

Content schema version 1 lives in `packages/storage/src/index.ts`; generator embeds it in `gita_content.db`. Tables:

| Table            | Key and purpose                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------ |
| chapters         | number 1–18; title and expected canonical verse count                                            |
| verses           | stable ref; chapter FK; unique chapter/verse and position; Sanskrit and optional transliteration |
| translations     | composite verse_ref/language key; verse FK; text and source ID                                   |
| explanations     | composite verse_ref/language key; source and reviewed flag; empty in fixture release             |
| content_metadata | source register, content/schema version, sample flag and counts                                  |

Chapter/verse and translation constraints prevent duplicate coordinates. `verses_chapter_position` supports chapter browsing. Source provenance is recorded in the metadata register and validated against every JSON source ID before generation. The current JSON importer supports scripture/translations; explanation authoring/import is a later content schema revision, not silently generated material.

`gita_user.db` version 1 contains bookmarks keyed by verse_ref, singleton reading_progress keyed by id=1, and key/value settings. SQL is parameterized. No foreign keys cross database files; repositories validate refs against content. On a content update, retain unmatched bookmarks for recovery, flag them for review, and never silently delete user state.

User migrations run inside an exclusive transaction and increment `PRAGMA user_version` only after the SQL succeeds. A version newer than the app understands is rejected. Database restart tests use real SQLite; migration rollback and schema-upgrade cases must be extended whenever new migrations are introduced. Content databases are regenerated, not mutated into user storage.

## Canonical coverage

This project chooses the conventional 700-verse chapter counts:

`47, 72, 43, 42, 29, 47, 30, 28, 34, 42, 55, 20, 34, 27, 20, 24, 28, 78`.

Document edition/numbering differences during content approval rather than coercing another recension into these coordinates. Samples may omit references and chapters, but never claim completeness. Production requires every reference and both translations.

## PostgreSQL

Sprint 1 bootstraps Rails/PostgreSQL and creates the following foundation tables. Their public business endpoints arrive in later sprints.

- installations: UUID primary identifier, unique SHA-256 credential digest, revoked_at and timestamps; no plain credential retained.
- ai_requests: installation FK, optional verse_ref, provider/model, status, input/output tokens, cost in integer micro-USD, request identifier and timestamps. No question/answer columns by default. Nonnegative numeric checks.
- content_releases: unique version, schema version, SHA-256, HTTPS asset URL, positive size and published_at.
- subscription_events: unique RevenueCat event ID, anonymous app user ID, event type, JSONB payload and processed_at. Payload retention must be limited and reviewed before webhooks launch.

Rails migrations supply foreign keys, unique indexes, checks and lookup indexes. Request and model tests verify the actual database. Before shipping new schema migrations, test both fresh setup and upgrade from the previous version against PostgreSQL.
