import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ReaderRepository } from '../../../apps/mobile/src/repositories/reader.ts';
import { userMigrations } from '../src/index.ts';
import { buildContent } from '../../../content/scripts/build.mjs';

// Adapt real SQLite to Expo's async query surface; no network or query-result mocks.
const adapter = (db) => ({
  getAllAsync: async (sql, ...params) => db.prepare(sql).all(...params),
  getFirstAsync: async (sql, ...params) =>
    db.prepare(sql).get(...params) ?? null,
  runAsync: async (sql, ...params) => db.prepare(sql).run(...params),
});

test('reader loads both languages offline, rejects invalid refs and resumes after restart', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'gita-reader-'));
  try {
    buildContent(
      JSON.parse(
        readFileSync(
          new URL('../../../content/source/sample.json', import.meta.url),
        ),
      ),
      join(directory, 'content.db'),
    );
    const content = new DatabaseSync(join(directory, 'content.db'), {
      readOnly: true,
    });
    let user = new DatabaseSync(join(directory, 'user.db'));
    try {
      for (const migration of userMigrations) user.exec(migration.sql);
      let repository = new ReaderRepository(adapter(content), adapter(user));
      assert.equal((await repository.validateContent()).sample, true);
      assert.equal(await repository.getProgress(), null);
      assert.equal(await repository.getLanguage(), 'en');
      const english = await repository.getVerses('en');
      const hindi = await repository.getVerses('hi');
      assert.deepEqual(
        english.map((v) => v.ref),
        hindi.map((v) => v.ref),
      );
      assert.notEqual(english[0].translation, hindi[0].translation);
      assert.equal(
        (await repository.getVerse('1.1', 'hi')).translation,
        hindi[0].translation,
      );
      assert.equal(await repository.getVerse('19.1', 'en'), null);
      await assert.rejects(
        () => repository.saveProgress('19.1'),
        /unknown verse/,
      );
      await repository.saveProgress('2.47');
      await repository.setLanguage('hi');
      user.close();
      user = new DatabaseSync(join(directory, 'user.db'));
      repository = new ReaderRepository(adapter(content), adapter(user));
      assert.equal(await repository.getProgress(), '2.47');
      assert.equal(await repository.getLanguage(), 'hi');
    } finally {
      content.close();
      user.close();
    }
  } finally {
    rmSync(directory, { recursive: true });
  }
});
