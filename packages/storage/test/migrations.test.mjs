import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { userMigrations, USER_DATABASE_VERSION } from '../src/index.ts';

test('user migrations preserve bookmarks and progress across connection restarts', () => {
  const directory = mkdtempSync(join(tmpdir(), 'gita-user-'));
  const path = join(directory, 'user.db');
  try {
    let db = new DatabaseSync(path);
    for (const migration of userMigrations) {
      db.exec('BEGIN');
      db.exec(migration.sql);
      db.exec(`PRAGMA user_version = ${migration.version}`);
      db.exec('COMMIT');
    }
    db.prepare('INSERT INTO bookmarks(verse_ref) VALUES (?)').run('2.47');
    assert.throws(
      () =>
        db.prepare('INSERT INTO bookmarks(verse_ref) VALUES (?)').run('2.47'),
      /UNIQUE/,
    );
    db.prepare('INSERT INTO reading_progress(id, verse_ref) VALUES (1, ?)').run(
      '2.47',
    );
    assert.throws(
      () =>
        db.exec(
          "INSERT INTO reading_progress(id, verse_ref) VALUES (2, '1.1')",
        ),
      /CHECK/,
    );
    db.close();
    db = new DatabaseSync(path);
    try {
      assert.equal(
        db.prepare('PRAGMA user_version').get().user_version,
        USER_DATABASE_VERSION,
      );
      assert.equal(
        db.prepare('SELECT verse_ref FROM bookmarks').get().verse_ref,
        '2.47',
      );
      assert.equal(
        db.prepare('SELECT verse_ref FROM reading_progress').get().verse_ref,
        '2.47',
      );
      // Reopening skips already-applied migrations rather than re-creating tables.
      const pending = userMigrations.filter(
        (m) => m.version > db.prepare('PRAGMA user_version').get().user_version,
      );
      assert.equal(pending.length, 0);
    } finally {
      db.close();
    }
  } finally {
    rmSync(directory, { recursive: true });
  }
});
