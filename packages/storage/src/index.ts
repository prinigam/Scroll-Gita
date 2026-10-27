export * from './preferences.ts';

export const USER_DATABASE_VERSION = 1;

// These SQL statements are exercised with real SQLite by the Node integration tests.
export const userMigrations = [
  {
    version: 1,
    sql: `
      CREATE TABLE bookmarks (
        verse_ref TEXT PRIMARY KEY NOT NULL,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      );
      CREATE TABLE reading_progress (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        verse_ref TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      );
      CREATE TABLE settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
    `,
  },
] as const;

export const contentSchema = `
  PRAGMA foreign_keys = ON;
  CREATE TABLE chapters (
    number INTEGER PRIMARY KEY CHECK(number BETWEEN 1 AND 18),
    title TEXT NOT NULL,
    verse_count INTEGER NOT NULL CHECK(verse_count > 0)
  );
  CREATE TABLE verses (
    ref TEXT PRIMARY KEY NOT NULL,
    chapter_number INTEGER NOT NULL REFERENCES chapters(number),
    verse_number INTEGER NOT NULL CHECK(verse_number > 0),
    position INTEGER NOT NULL UNIQUE CHECK(position >= 0),
    sanskrit TEXT NOT NULL CHECK(length(sanskrit) > 0),
    transliteration TEXT,
    source_id TEXT NOT NULL,
    UNIQUE(chapter_number, verse_number),
    CHECK(ref = CAST(chapter_number AS TEXT) || '.' || CAST(verse_number AS TEXT))
  );
  CREATE INDEX verses_chapter_position ON verses(chapter_number, position);
  CREATE TABLE translations (
    verse_ref TEXT NOT NULL REFERENCES verses(ref),
    language TEXT NOT NULL CHECK(language IN ('en', 'hi')),
    text TEXT NOT NULL CHECK(length(text) > 0),
    source_id TEXT NOT NULL,
    PRIMARY KEY(verse_ref, language)
  );
  CREATE TABLE explanations (
    verse_ref TEXT NOT NULL REFERENCES verses(ref),
    language TEXT NOT NULL CHECK(language IN ('en', 'hi')),
    text TEXT NOT NULL,
    source_id TEXT NOT NULL,
    reviewed INTEGER NOT NULL CHECK(reviewed IN (0, 1)),
    PRIMARY KEY(verse_ref, language)
  );
  CREATE TABLE content_metadata (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
  PRAGMA user_version = 1;
`;
