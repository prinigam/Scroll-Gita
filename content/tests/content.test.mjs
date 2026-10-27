import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { validateContent } from '../scripts/validate.mjs';
import { buildContent } from '../scripts/build.mjs';

const fixture = () =>
  JSON.parse(
    readFileSync(new URL('../source/sample.json', import.meta.url), 'utf8'),
  );

test('sample validates but cannot be released as production scripture', () => {
  assert.equal(validateContent(fixture()).verses, 3);
  assert.throws(
    () => validateContent(fixture(), { production: true }),
    /sample/,
  );
});
test('rejects duplicate references, incorrect ordering, missing translations and unknown sources', () => {
  const duplicate = fixture();
  duplicate.verses.push(duplicate.verses[0]);
  assert.throws(() => validateContent(duplicate), /Duplicate verse/);
  const unordered = fixture();
  unordered.verses.reverse();
  assert.throws(() => validateContent(unordered), /ordering/);
  const missing = fixture();
  delete missing.verses[0].translations.hi;
  assert.throws(() => validateContent(missing), /Schema validation/);
  const unknown = fixture();
  unknown.verses[0].translations.en.source_id = 'unlicensed';
  assert.throws(() => validateContent(unknown), /Unknown source/);
});
test('rejects invalid coordinates, whitespace-only text and incomplete non-sample datasets', () => {
  const range = fixture();
  range.verses[0].verse = 999;
  range.verses[0].ref = '1.999';
  assert.throws(() => validateContent(range), /range/);
  const whitespace = fixture();
  whitespace.verses[0].sanskrit = '   ';
  assert.throws(() => validateContent(whitespace), /Schema validation/);
  const incomplete = fixture();
  incomplete.sample = false;
  assert.throws(() => validateContent(incomplete), /700 verses/);
});
test('generated SQLite joins translations in canonical order and records provenance', () => {
  const directory = mkdtempSync(join(tmpdir(), 'gita-content-'));
  try {
    const path = join(directory, 'content.db');
    const manifest = buildContent(fixture(), path);
    assert.equal(manifest.production_approved, false);
    assert.equal(manifest.sha256.length, 64);
    const db = new DatabaseSync(path, { readOnly: true });
    try {
      assert.deepEqual(
        db
          .prepare('SELECT ref FROM verses ORDER BY position')
          .all()
          .map((r) => r.ref),
        ['1.1', '1.2', '2.47'],
      );
      assert.equal(
        db.prepare('SELECT count(*) AS count FROM translations').get().count,
        6,
      );
      assert.equal(
        JSON.parse(
          db
            .prepare("SELECT value FROM content_metadata WHERE key = 'sample'")
            .get().value,
        ),
        true,
      );
      assert.equal(db.prepare('PRAGMA foreign_key_check').all().length, 0);
    } finally {
      db.close();
    }
  } finally {
    rmSync(directory, { recursive: true });
  }
});
