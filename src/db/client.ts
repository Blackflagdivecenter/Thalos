import * as SQLite from 'expo-sqlite';

let _db: SQLite.SQLiteDatabase | null = null;

export function getDb(): SQLite.SQLiteDatabase {
  if (!_db) {
    _db = SQLite.openDatabaseSync('thalos.db');
    _db.execSync('PRAGMA journal_mode = WAL');
    _db.execSync('PRAGMA foreign_keys = ON');
    _db.execSync('PRAGMA busy_timeout = 5000');
  }
  return _db;
}
