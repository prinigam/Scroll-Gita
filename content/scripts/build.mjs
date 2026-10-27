import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import {
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { fileURLToPath } from 'node:url';
import { contentSchema } from '../../packages/storage/src/index.ts';
import { validateContent } from './validate.mjs';

export function buildContent(data, destination, options = {}) {
  const summary = validateContent(data, options);
  const temporary = `${destination}.tmp`;
  rmSync(temporary, { force: true });
  const db = new DatabaseSync(temporary);
  try {
    db.exec(contentSchema);
    db.exec('BEGIN');
    const chapter = db.prepare('INSERT INTO chapters VALUES (?, ?, ?)');
    for (const row of data.chapters)
      chapter.run(row.number, row.title, row.verse_count);
    const verse = db.prepare('INSERT INTO verses VALUES (?, ?, ?, ?, ?, ?, ?)');
    const translation = db.prepare(
      'INSERT INTO translations VALUES (?, ?, ?, ?)',
    );
    data.verses.forEach((row, index) => {
      verse.run(
        row.ref,
        row.chapter,
        row.verse,
        index,
        row.sanskrit,
        row.transliteration ?? null,
        row.source_id,
      );
      for (const [language, item] of Object.entries(row.translations)) {
        translation.run(row.ref, language, item.text, item.source_id);
      }
    });
    const metadata = db.prepare('INSERT INTO content_metadata VALUES (?, ?)');
    for (const [key, value] of Object.entries({
      ...summary,
      sources: data.sources,
      schema_version: data.schema_version,
    })) {
      metadata.run(key, JSON.stringify(value));
    }
    db.exec('COMMIT');
    if (db.prepare('PRAGMA integrity_check').get().integrity_check !== 'ok')
      throw new Error('SQLite integrity check failed');
    if (db.prepare('PRAGMA foreign_key_check').all().length)
      throw new Error('SQLite foreign key check failed');
  } finally {
    db.close();
  }
  renameSync(temporary, destination);
  const buffer = readFileSync(destination);
  return {
    ...summary,
    schema_version: 1,
    sha256: createHash('sha256').update(buffer).digest('hex'),
    size_bytes: buffer.length,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const input = process.argv.find((arg) => arg.endsWith('.json'));
  const data = JSON.parse(
    readFileSync(
      input ?? new URL('../source/sample.json', import.meta.url),
      'utf8',
    ),
  );
  const directory = new URL(
    '../../apps/mobile/assets/content/',
    import.meta.url,
  );
  mkdirSync(directory, { recursive: true });
  const manifest = buildContent(
    data,
    fileURLToPath(new URL('gita_content.db', directory)),
    { production: process.argv.includes('--production') },
  );
  writeFileSync(
    new URL('manifest.json', directory),
    JSON.stringify(manifest, null, 2) + '\n',
  );
  console.log(manifest);
}
