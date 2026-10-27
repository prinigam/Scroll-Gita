import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ReaderRepository } from '../../../apps/mobile/src/repositories/reader.ts';
import {
  DEFAULT_READER_PREFERENCES,
  resolveTheme,
  userMigrations,
} from '../src/index.ts';

const adapter = (db) => ({
  getAllAsync: async (sql, ...params) => db.prepare(sql).all(...params),
  getFirstAsync: async (sql, ...params) =>
    db.prepare(sql).get(...params) ?? null,
  runAsync: async (sql, ...params) => db.prepare(sql).run(...params),
});
function setup(t) {
  const directory = mkdtempSync(join(tmpdir(), 'gita-preferences-'));
  const content = new DatabaseSync(':memory:');
  let user = new DatabaseSync(join(directory, 'user.db'));
  for (const migration of userMigrations) user.exec(migration.sql);
  t.after(() => {
    user.close();
    content.close();
    rmSync(directory, { recursive: true });
  });
  return {
    get user() {
      return user;
    },
    content,
    repository: new ReaderRepository(adapter(content), adapter(user)),
    reopen() {
      user.close();
      user = new DatabaseSync(join(directory, 'user.db'));
      return new ReaderRepository(adapter(content), adapter(user));
    },
  };
}

test('new and legacy installations receive safe preferences without resetting stored values', async (t) => {
  const { user, repository } = setup(t);
  assert.deepEqual(
    await repository.getPreferences(),
    DEFAULT_READER_PREFERENCES,
  );
  const insert = user.prepare('INSERT INTO settings VALUES (?, ?)');
  insert.run('language', 'hi');
  insert.run('theme', 'unknown-mode');
  insert.run('text_size', '999');
  insert.run('show_transliteration', 'yes');
  insert.run('future_setting', 'keep-me');
  assert.deepEqual(await repository.getPreferences(), {
    ...DEFAULT_READER_PREFERENCES,
    language: 'hi',
  });
  await repository.setPreference('theme', 'dark');
  assert.equal(
    user
      .prepare("SELECT value FROM settings WHERE key = 'future_setting'")
      .get().value,
    'keep-me',
  );
  assert.equal(
    user.prepare("SELECT value FROM settings WHERE key = 'text_size'").get()
      .value,
    '999',
  );
});

test('all preferences survive restart while bookmarks and progress are preserved', async (t) => {
  const fixture = setup(t);
  fixture.user
    .prepare('INSERT INTO bookmarks(verse_ref) VALUES (?)')
    .run('2.47');
  fixture.user
    .prepare('INSERT INTO reading_progress(id, verse_ref) VALUES (1, ?)')
    .run('1.2');
  await fixture.repository.setPreference('theme', 'dark');
  await fixture.repository.setPreference('textSize', 'extraLarge');
  await fixture.repository.setPreference('showTransliteration', true);
  await fixture.repository.setLanguage('hi');
  const reopened = fixture.reopen();
  assert.deepEqual(await reopened.getPreferences(), {
    language: 'hi',
    theme: 'dark',
    textSize: 'extraLarge',
    showTransliteration: true,
  });
  assert.deepEqual(await reopened.getBookmarkRefs(), ['2.47']);
  assert.equal(await reopened.getProgress(), '1.2');
  await reopened.setLanguage('en');
  await reopened.setPreference('showTransliteration', false);
  assert.deepEqual(await fixture.reopen().getPreferences(), {
    language: 'en',
    theme: 'dark',
    textSize: 'extraLarge',
    showTransliteration: false,
  });
});

test('invalid preference values are rejected before writing, and later valid saves work', async (t) => {
  const { repository, user } = setup(t);
  for (const [key, value] of [
    ['theme', 'midnight'],
    ['textSize', 2],
    ['showTransliteration', 'true'],
    ['language', 'fr'],
    ['unexpected', true],
  ]) {
    await assert.rejects(
      repository.setPreference(key, value),
      /Invalid reader preference/,
    );
  }
  assert.equal(
    user.prepare('SELECT count(*) AS count FROM settings').get().count,
    0,
  );
  await repository.setPreference('showTransliteration', true);
  assert.equal((await repository.getPreferences()).showTransliteration, true);
});

test('a slow older preference write cannot overwrite the latest choice', async (t) => {
  const { content, user } = setup(t);
  const userAdapter = adapter(user);
  const run = userAdapter.runAsync;
  userAdapter.runAsync = async (sql, ...params) => {
    if (params[1] === 'dark')
      await new Promise((resolve) => setTimeout(resolve, 25));
    return run(sql, ...params);
  };
  const repository = new ReaderRepository(adapter(content), userAdapter);
  const first = repository.setPreference('theme', 'dark');
  const last = repository.setPreference('theme', 'light');
  assert.equal((await repository.getPreferences()).theme, 'light');
  await Promise.all([first, last]);
});

test('failed database writes retain the old preference and do not poison the save queue', async (t) => {
  const { content, user } = setup(t);
  const userAdapter = adapter(user);
  const run = userAdapter.runAsync;
  let fail = true;
  userAdapter.runAsync = async (sql, ...params) => {
    if (fail) {
      fail = false;
      throw new Error('disk unavailable');
    }
    return run(sql, ...params);
  };
  const repository = new ReaderRepository(adapter(content), userAdapter);
  await assert.rejects(
    repository.setPreference('theme', 'dark'),
    /disk unavailable/,
  );
  assert.equal((await repository.getPreferences()).theme, 'system');
  await repository.setPreference('theme', 'light');
  assert.equal((await repository.getPreferences()).theme, 'light');
});

test('appearance follows the OS only in System mode, including a missing OS preference', () => {
  assert.equal(resolveTheme('system', 'dark'), 'dark');
  assert.equal(resolveTheme('system', 'light'), 'light');
  assert.equal(resolveTheme('system', null), 'light');
  assert.equal(resolveTheme('light', 'dark'), 'light');
  assert.equal(resolveTheme('dark', 'light'), 'dark');
});
