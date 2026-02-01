import Database from 'better-sqlite3';
import path from 'path';
import { Result, Goalscorer, Shootout, FormerName, DatabaseSnapshot } from './types';

export class FootballDatabase {
  private db: Database.Database;

  constructor(dbPath?: string) {
    // Use in-memory database if no path provided, otherwise use file-based
    this.db = dbPath ? new Database(dbPath) : new Database(':memory:');
    this.db.pragma('journal_mode = WAL');
  }

  /**
   * Initialize database schema and create tables
   */
  initialize(): void {
    // Results table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS results (
        date TEXT NOT NULL,
        homeTeam TEXT NOT NULL,
        awayTeam TEXT NOT NULL,
        homeGoals INTEGER NOT NULL,
        awayGoals INTEGER NOT NULL,
        tournament TEXT NOT NULL,
        city TEXT,
        country TEXT,
        neutral INTEGER DEFAULT 0,
        PRIMARY KEY (date, homeTeam, awayTeam)
      )
    `);

    // Goalscorers table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS goalscorers (
        date TEXT NOT NULL,
        homeTeam TEXT NOT NULL,
        awayTeam TEXT NOT NULL,
        scorer TEXT NOT NULL,
        minute INTEGER NOT NULL,
        ownGoal INTEGER DEFAULT 0,
        penalty INTEGER DEFAULT 0,
        FOREIGN KEY (date, homeTeam, awayTeam) REFERENCES results(date, homeTeam, awayTeam)
      )
    `);

    // Shootouts table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS shootouts (
        date TEXT NOT NULL,
        homeTeam TEXT NOT NULL,
        awayTeam TEXT NOT NULL,
        winner TEXT NOT NULL,
        PRIMARY KEY (date, homeTeam, awayTeam),
        FOREIGN KEY (date, homeTeam, awayTeam) REFERENCES results(date, homeTeam, awayTeam)
      )
    `);

    // Former names table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS formerNames (
        name TEXT PRIMARY KEY,
        formerName TEXT NOT NULL
      )
    `);
  }

  /**
   * Get database snapshot with row counts for verification
   */
  getSnapshot(): DatabaseSnapshot {
    const resultsCount = this.db
      .prepare('SELECT COUNT(*) as count FROM results')
      .get() as { count: number };
    const goalscorersCount = this.db
      .prepare('SELECT COUNT(*) as count FROM goalscorers')
      .get() as { count: number };
    const shootoutsCount = this.db
      .prepare('SELECT COUNT(*) as count FROM shootouts')
      .get() as { count: number };
    const formerNamesCount = this.db
      .prepare('SELECT COUNT(*) as count FROM formerNames')
      .get() as { count: number };

    return {
      resultsCount: resultsCount.count,
      goalscorersCount: goalscorersCount.count,
      shootoutsCount: shootoutsCount.count,
      formerNamesCount: formerNamesCount.count,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Clear all tables
   */
  clear(): void {
    this.db.exec('DELETE FROM goalscorers');
    this.db.exec('DELETE FROM shootouts');
    this.db.exec('DELETE FROM results');
    this.db.exec('DELETE FROM formerNames');
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
  }

  /**
   * Get underlying database instance for direct queries
   */
  getDatabase(): Database.Database {
    return this.db;
  }
}

// Export singleton instance
let instance: FootballDatabase | null = null;

export function initializeDatabase(dbPath?: string): FootballDatabase {
  instance = new FootballDatabase(dbPath);
  instance.initialize();
  return instance;
}

export function getDatabase(): FootballDatabase {
  if (!instance) {
    throw new Error('Database not initialized. Call initializeDatabase first.');
  }
  return instance;
}
