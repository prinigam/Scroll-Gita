import type { SQLiteDatabase } from 'expo-sqlite';
import type { Language } from '@/store/reader';

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

export class ReaderRepository {
  private content: SQLiteDatabase;
  private user: SQLiteDatabase;

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

  async getProgress() {
    const row = await this.user.getFirstAsync<{ verse_ref: string }>(
      'SELECT verse_ref FROM reading_progress WHERE id = 1',
    );
    return row?.verse_ref ?? null;
  }

  async saveProgress(ref: string) {
    if (
      !(await this.content.getFirstAsync(
        'SELECT ref FROM verses WHERE ref = ?',
        ref,
      ))
    )
      throw new Error('Cannot save an unknown verse');
    await this.user.runAsync(
      `INSERT INTO reading_progress(id, verse_ref) VALUES (1, ?)
       ON CONFLICT(id) DO UPDATE SET verse_ref = excluded.verse_ref,
       updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`,
      ref,
    );
  }

  async getLanguage(): Promise<Language> {
    const row = await this.user.getFirstAsync<{ value: string }>(
      "SELECT value FROM settings WHERE key = 'language'",
    );
    return row?.value === 'hi' ? 'hi' : 'en';
  }

  async setLanguage(language: Language) {
    await this.user.runAsync(
      "INSERT INTO settings(key, value) VALUES ('language', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
      language,
    );
  }
}
