import { getDb } from './client';
import { MIGRATION_1, MIGRATION_2, MIGRATION_3, MIGRATION_4, MIGRATION_5, MIGRATION_6, MIGRATION_7, MIGRATION_8, MIGRATION_9, MIGRATION_10, MIGRATION_11, MIGRATION_12, MIGRATION_13, MIGRATION_14 } from './schema';

const MIGRATIONS: string[][] = [MIGRATION_1, MIGRATION_2, MIGRATION_3, MIGRATION_4, MIGRATION_5, MIGRATION_6, MIGRATION_7, MIGRATION_8, MIGRATION_9, MIGRATION_10, MIGRATION_11, MIGRATION_12, MIGRATION_13, MIGRATION_14];

export function initDatabase(): void {
  const db = getDb();

  // Schema version table (always created first, outside migrations)
  db.execSync(
    `CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    )`
  );

  // Find current version
  const row = db.getFirstSync<{ version: number | null }>(
    'SELECT MAX(version) as version FROM schema_version'
  );
  const currentVersion = row?.version ?? 0;

  // Apply any pending migrations in order
  for (let i = currentVersion; i < MIGRATIONS.length; i++) {
    const statements = MIGRATIONS[i];
    db.withTransactionSync(() => {
      for (const sql of statements) {
        db.execSync(sql);
      }
      db.runSync(
        'INSERT INTO schema_version (version, applied_at) VALUES (?, ?)',
        [i + 1, new Date().toISOString()]
      );
    });
  }
}
