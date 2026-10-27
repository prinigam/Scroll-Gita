import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ReaderRepository } from '../../../apps/mobile/src/repositories/reader.ts';
import { userMigrations } from '../src/index.ts';
import { buildContent } from '../../../content/scripts/build.mjs';

const adapter = (db) => ({
  getAllAsync: async (sql, ...params) => db.prepare(sql).all(...params),
  getFirstAsync: async (sql, ...params) =>
    db.prepare(sql).get(...params) ?? null,
  runAsync: async (sql, ...params) => db.prepare(sql).run(...params),
});

function library(t) {
  const directory = mkdtempSync(join(tmpdir(), 'gita-library-'));
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
  for (const migration of userMigrations) user.exec(migration.sql);
  t.after(() => {
    user.close();
    content.close();
    rmSync(directory, { recursive: true });
  });
  return {
    repository: new ReaderRepository(adapter(content), adapter(user)),
    content,
    user,
    reopen() {
      user.close();
      user = new DatabaseSync(join(directory, 'user.db'));
      return new ReaderRepository(adapter(content), adapter(user));
    },
  };
}

test('chapter navigation exposes actual sample coverage in canonical order without changing progress', async (t) => {
  const { repository } = library(t);
  await repository.saveProgress('1.2');
  const chapters = await repository.getChapters();
  assert.deepEqual(
    chapters.map((c) => [c.number, c.verse_count, c.available_verses]),
    [
      [1, 47, 2],
      [2, 72, 1],
    ],
  );
  assert.deepEqual(
    (await repository.getChapterVerses(1, 'en')).map((v) => v.ref),
    ['1.1', '1.2'],
  );
  assert.deepEqual(
    (await repository.getChapterVerses(2, 'hi')).map((v) => v.ref),
    ['2.47'],
  );
  assert.deepEqual(await repository.getChapterVerses(18, 'en'), []);
  assert.equal(await repository.getProgress(), '1.2');
});

test('bookmarks persist across restarts, are idempotent and use the selected translation', async (t) => {
  const fixture = library(t);
  let repository = fixture.repository;
  await repository.saveProgress('1.2');
  await repository.setBookmark('2.47', true);
  await repository.setBookmark('2.47', true);
  assert.deepEqual(await repository.getBookmarkRefs(), ['2.47']);
  const english = await repository.getBookmarks('en');
  const hindi = await repository.getBookmarks('hi');
  assert.notEqual(english[0].verse.translation, hindi[0].verse.translation);
  assert.equal(await repository.getProgress(), '1.2');
  repository = fixture.reopen();
  assert.deepEqual(await repository.getBookmarkRefs(), ['2.47']);
  await repository.setBookmark('2.47', false);
  await repository.setBookmark('2.47', false);
  assert.deepEqual(await repository.getBookmarks('en'), []);
  repository = fixture.reopen();
  assert.deepEqual(await repository.getBookmarkRefs(), []);
});

test('unknown bookmarks are rejected, and a failed operation does not poison subsequent writes', async (t) => {
  const { repository } = library(t);
  await assert.rejects(repository.setBookmark('1.999', true), /unknown verse/);
  await repository.setBookmark('1.1', true);
  await Promise.all([
    repository.setBookmark('1.2', true),
    repository.setBookmark('1.2', false),
  ]);
  assert.deepEqual(await repository.getBookmarkRefs(), ['1.1']);
});

test('bookmarks unavailable in a content release are retained and removable', async (t) => {
  const { repository, user } = library(t);
  user.prepare('INSERT INTO bookmarks(verse_ref) VALUES (?)').run('9.9');
  const bookmarks = await repository.getBookmarks('en');
  assert.equal(bookmarks[0].verse_ref, '9.9');
  assert.equal(bookmarks[0].verse, null);
  assert.deepEqual(await repository.getBookmarkRefs(), ['9.9']);
  await repository.setBookmark('9.9', false);
  assert.deepEqual(await repository.getBookmarks('en'), []);
});

test('saved verses are listed newest first with deterministic ties', async (t) => {
  const { repository, user } = library(t);
  user
    .prepare('INSERT INTO bookmarks VALUES (?, ?)')
    .run('1.1', '2026-10-01T00:00:00Z');
  user
    .prepare('INSERT INTO bookmarks VALUES (?, ?)')
    .run('2.47', '2026-10-02T00:00:00Z');
  assert.deepEqual(
    (await repository.getBookmarks('en')).map((b) => b.verse_ref),
    ['2.47', '1.1'],
  );
});

test('a chapter jump wins over an earlier slow reading-position write', async (t) => {
  const { content, user } = library(t);
  const userAdapter = adapter(user);
  const run = userAdapter.runAsync;
  userAdapter.runAsync = async (sql, ...params) => {
    if (params[0] === '1.1')
      await new Promise((resolve) => setTimeout(resolve, 25));
    return run(sql, ...params);
  };
  const repository = new ReaderRepository(adapter(content), userAdapter);
  const scrolling = repository.saveProgress('1.1');
  const jump = repository.saveProgress('2.47');
  // Reads also wait for pending writes; no caller needs to manage a second queue.
  assert.equal(await repository.getProgress(), '2.47');
  await Promise.all([scrolling, jump]);
  await assert.rejects(repository.saveProgress('invalid'), /unknown verse/);
  await repository.saveProgress('1.2');
  assert.equal(await repository.getProgress(), '1.2');
});
