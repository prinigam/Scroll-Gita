import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import assert from 'node:assert/strict';
import { validateContent } from './validate.mjs';

const directory = new URL('../../apps/mobile/assets/content/', import.meta.url);
const data = JSON.parse(
  readFileSync(new URL('../source/sample.json', import.meta.url), 'utf8'),
);
const manifest = JSON.parse(
  readFileSync(new URL('manifest.json', directory), 'utf8'),
);
const bytes = readFileSync(new URL('gita_content.db', directory));
const summary = validateContent(data);
assert.equal(manifest.sha256, createHash('sha256').update(bytes).digest('hex'));
assert.equal(manifest.size_bytes, bytes.length);
assert.equal(manifest.version, data.content_version);
assert.equal(manifest.sample, data.sample);
let approved = false;
try {
  validateContent(data, { production: true });
  approved = true;
} catch {
  // The checked-in sample is intentionally ineligible for a production release.
}
assert.equal(manifest.production_approved, approved);
const db = new DatabaseSync(new URL('gita_content.db', directory), {
  readOnly: true,
});
try {
  assert.equal(
    db.prepare('PRAGMA integrity_check').get().integrity_check,
    'ok',
  );
  assert.equal(
    db.prepare('PRAGMA user_version').get().user_version,
    manifest.schema_version,
  );
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
  const actual = db
    .prepare(
      'SELECT ref, chapter_number, verse_number, position, sanskrit, transliteration, source_id FROM verses ORDER BY position',
    )
    .all()
    .map((row) => ({ ...row }));
  const expected = data.verses.map((row, position) => ({
    ref: row.ref,
    chapter_number: row.chapter,
    verse_number: row.verse,
    position,
    sanskrit: row.sanskrit,
    transliteration: row.transliteration ?? null,
    source_id: row.source_id,
  }));
  assert.deepEqual(actual, expected);
  assert.equal(
    db.prepare('SELECT count(*) AS count FROM translations').get().count,
    summary.verses * 2,
  );
  for (const verse of data.verses) {
    for (const [language, translation] of Object.entries(verse.translations)) {
      const row = db
        .prepare(
          'SELECT text, source_id FROM translations WHERE verse_ref = ? AND language = ?',
        )
        .get(verse.ref, language);
      assert.deepEqual({ ...row }, translation);
    }
  }
  assert.deepEqual(
    JSON.parse(
      db
        .prepare("SELECT value FROM content_metadata WHERE key = 'sources'")
        .get().value,
    ),
    data.sources,
  );
  console.log('Bundled content matches source and checksum manifest.');
} finally {
  db.close();
}
