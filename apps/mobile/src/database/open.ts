import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';
import { USER_DATABASE_VERSION, userMigrations } from '@scroll-gita/storage';

export async function openUserDatabase(): Promise<SQLiteDatabase> {
  const db = await openDatabaseAsync('gita_user.db');
  try {
    await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
    const row = await db.getFirstAsync<{ user_version: number }>(
      'PRAGMA user_version',
    );
    if (!row || row.user_version > USER_DATABASE_VERSION)
      throw new Error(
        'This app cannot open the newer user database. Please update the app.',
      );
    await db.withExclusiveTransactionAsync(async (transaction) => {
      for (const migration of userMigrations) {
        if (migration.version > row.user_version) {
          await transaction.execAsync(migration.sql);
          await transaction.execAsync(
            `PRAGMA user_version = ${migration.version}`,
          );
        }
      }
    });
    return db;
  } catch (error) {
    await db.closeAsync();
    throw error;
  }
}
