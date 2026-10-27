import type { SQLiteDatabase } from 'expo-sqlite';
import type { Language } from '@/store/reader';
import {
  isPreferenceValue,
  parseReaderPreferences,
  preferenceKeys,
  type ReaderPreferences,
} from '@scroll-gita/storage';

export interface Verse {
  ref: string;
  chapter_number: number;
  verse_number: number;
  position: number;
  sanskrit: string;
  transliteration: string | null;
  translation: string;
  chapter_title: string;
}

export interface Chapter {
  number: number;
  title: string;
  verse_count: number;
  available_verses: number;
}

export interface Bookmark {
  verse_ref: string;
  created_at: string;
  verse: Verse | null;
}

export class ReaderRepository {
  private content: SQLiteDatabase;
  private user: SQLiteDatabase;
  private progressWrites: Promise<void> = Promise.resolve();
  private bookmarkWrites: Promise<void> = Promise.resolve();
  private preferenceWrites: Promise<void> = Promise.resolve();

  constructor(content: SQLiteDatabase, user: SQLiteDatabase) {
    this.content = content;
    this.user = user;
  }

  async validateContent() {
    const schema = await this.content.getFirstAsync<{ user_version: number }>(
      'PRAGMA user_version',
    );
    if (schema?.user_version !== 1)
      throw new Error('Unsupported content database. Please update the app.');
    const metadata = await this.content.getFirstAsync<{ value: string }>(
      "SELECT value FROM content_metadata WHERE key = 'sample'",
    );
    if (!metadata)
      throw new Error('The content database is missing its release metadata.');
    return { sample: JSON.parse(metadata.value) === true };
  }

  getVerses(language: Language) {
    return this.content.getAllAsync<Verse>(
      `SELECT v.*, t.text AS translation, c.title AS chapter_title
       FROM verses v JOIN translations t ON t.verse_ref = v.ref AND t.language = ?
       JOIN chapters c ON c.number = v.chapter_number ORDER BY v.position`,
      language,
    );
  }

  getVerse(ref: string, language: Language) {
    return this.content.getFirstAsync<Verse>(
      `SELECT v.*, t.text AS translation, c.title AS chapter_title
       FROM verses v JOIN translations t ON t.verse_ref = v.ref AND t.language = ?
       JOIN chapters c ON c.number = v.chapter_number WHERE v.ref = ?`,
      language,
      ref,
    );
  }

  getChapters() {
    return this.content.getAllAsync<Chapter>(
      `SELECT c.*, COUNT(v.ref) AS available_verses FROM chapters c
       LEFT JOIN verses v ON v.chapter_number = c.number
       GROUP BY c.number ORDER BY c.number`,
    );
  }

  getChapterVerses(chapter: number, language: Language) {
    return this.content.getAllAsync<Verse>(
      `SELECT v.*, t.text AS translation, c.title AS chapter_title
       FROM verses v JOIN translations t ON t.verse_ref = v.ref AND t.language = ?
       JOIN chapters c ON c.number = v.chapter_number
       WHERE v.chapter_number = ? ORDER BY v.position`,
      language,
      chapter,
    );
  }

  async getBookmarkRefs() {
    await this.bookmarkWrites;
    const rows = await this.user.getAllAsync<{ verse_ref: string }>(
      'SELECT verse_ref FROM bookmarks ORDER BY created_at DESC, verse_ref ASC',
    );
    return rows.map((row) => row.verse_ref);
  }

  async getBookmarks(language: Language): Promise<Bookmark[]> {
    await this.bookmarkWrites;
    const [rows, verses] = await Promise.all([
      this.user.getAllAsync<{ verse_ref: string; created_at: string }>(
        'SELECT verse_ref, created_at FROM bookmarks ORDER BY created_at DESC, verse_ref ASC',
      ),
      this.getVerses(language),
    ]);
    const byRef = new Map(verses.map((verse) => [verse.ref, verse]));
    // Retain bookmarks missing from a content release; users can still remove them.
    return rows.map((row) => ({
      ...row,
      verse: byRef.get(row.verse_ref) ?? null,
    }));
  }

  setBookmark(ref: string, saved: boolean) {
    const write = this.bookmarkWrites.then(async () => {
      if (saved) {
        if (
          !(await this.content.getFirstAsync(
            'SELECT ref FROM verses WHERE ref = ?',
            ref,
          ))
        ) {
          throw new Error('Cannot bookmark an unknown verse');
        }
        await this.user.runAsync(
          'INSERT INTO bookmarks(verse_ref) VALUES (?) ON CONFLICT(verse_ref) DO NOTHING',
          ref,
        );
      } else {
        await this.user.runAsync(
          'DELETE FROM bookmarks WHERE verse_ref = ?',
          ref,
        );
      }
    });
    this.bookmarkWrites = write.catch(() => undefined);
    return write;
  }

  async getProgress() {
    await this.progressWrites;
    const row = await this.user.getFirstAsync<{ verse_ref: string }>(
      'SELECT verse_ref FROM reading_progress WHERE id = 1',
    );
    return row?.verse_ref ?? null;
  }

  saveProgress(ref: string) {
    const write = this.progressWrites.then(async () => {
      if (
        !(await this.content.getFirstAsync(
          'SELECT ref FROM verses WHERE ref = ?',
          ref,
        ))
      ) {
        throw new Error('Cannot save an unknown verse');
      }
      await this.user.runAsync(
        `INSERT INTO reading_progress(id, verse_ref) VALUES (1, ?)
       ON CONFLICT(id) DO UPDATE SET verse_ref = excluded.verse_ref,
       updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`,
        ref,
      );
    });
    this.progressWrites = write.catch(() => undefined);
    return write;
  }

  async getLanguage(): Promise<Language> {
    return (await this.getPreferences()).language;
  }

  setLanguage(language: Language) {
    return this.setPreference('language', language);
  }

  async getPreferences(): Promise<ReaderPreferences> {
    await this.preferenceWrites;
    const rows = await this.user.getAllAsync<{ key: string; value: string }>(
      'SELECT key, value FROM settings',
    );
    return parseReaderPreferences(
      Object.fromEntries(rows.map((row) => [row.key, row.value])),
    );
  }

  setPreference<K extends keyof ReaderPreferences>(
    key: K,
    value: ReaderPreferences[K],
  ) {
    if (!isPreferenceValue(key, value))
      return Promise.reject(new Error(`Invalid reader preference: ${key}`));
    const write = this.preferenceWrites.then(async () => {
      await this.user.runAsync(
        'INSERT INTO settings(key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
        preferenceKeys[key],
        String(value),
      );
    });
    this.preferenceWrites = write.catch(() => undefined);
    return write;
  }
}
