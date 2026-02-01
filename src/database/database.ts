import sqlite3 from 'sqlite3';
import { DatabaseSnapshot } from './types';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

export class FootballDatabase {
  private db: sqlite3.Database;
  private readyPromise: Promise<void>;

  constructor(dbPath?: string) {
    // Use in-memory database if no path provided, otherwise use file-based
    const dbLocation = dbPath ? dbPath : ':memory:';
    this.db = new sqlite3.Database(dbLocation, (err) => {
      if (err) {
        console.error('Error opening database:', err);
      }
    });

    // Initialize serialization and ready promise
    this.readyPromise = new Promise((resolve, reject) => {
      this.db.run('PRAGMA foreign_keys = ON', (err) => {
        if (err) reject(err);
        else {
          this.db.run('PRAGMA journal_mode = WAL', (err) => {
            if (err) reject(err);
            else resolve();
          });
        }
      });
    });

    this.db.configure('busyTimeout', 5000);
  }

  /**
   * Wait for database to be ready
   */
  ready(): Promise<void> {
    return this.readyPromise;
  }

  /**
   * Initialize database schema and create tables
   */
  initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        // Results table
        this.db.run(`
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
        this.db.run(`
          CREATE TABLE IF NOT EXISTS goalscorers (
            date TEXT NOT NULL,
            homeTeam TEXT NOT NULL,
            awayTeam TEXT NOT NULL,
            scorer TEXT NOT NULL,
            minute INTEGER,
            ownGoal INTEGER DEFAULT 0,
            penalty INTEGER DEFAULT 0,
            FOREIGN KEY (date, homeTeam, awayTeam) REFERENCES results(date, homeTeam, awayTeam)
          )
        `);

        // Shootouts table
        this.db.run(`
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
        this.db.run(
          `
          CREATE TABLE IF NOT EXISTS formerNames (
            name TEXT PRIMARY KEY,
            formerName TEXT
          )
        `,
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    });
  }

  /**
   * Get database snapshot with row counts for verification
   */
  getSnapshot(): Promise<DatabaseSnapshot> {
    return Promise.all([
      new Promise<number>((resolve, reject) => {
        this.db.get('SELECT COUNT(*) as count FROM results', (err, row: any) => {
          if (err) reject(err);
          else resolve(row.count);
        });
      }),
      new Promise<number>((resolve, reject) => {
        this.db.get('SELECT COUNT(*) as count FROM goalscorers', (err, row: any) => {
          if (err) reject(err);
          else resolve(row.count);
        });
      }),
      new Promise<number>((resolve, reject) => {
        this.db.get('SELECT COUNT(*) as count FROM shootouts', (err, row: any) => {
          if (err) reject(err);
          else resolve(row.count);
        });
      }),
      new Promise<number>((resolve, reject) => {
        this.db.get('SELECT COUNT(*) as count FROM formerNames', (err, row: any) => {
          if (err) reject(err);
          else resolve(row.count);
        });
      }),
    ]).then(([resultsCount, goalscorersCount, shootoutsCount, formerNamesCount]) => ({
      resultsCount,
      goalscorersCount,
      shootoutsCount,
      formerNamesCount,
      lastUpdated: new Date().toISOString(),
    }));
  }

  /**
   * Clear all tables
   */
  clear(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run('DELETE FROM goalscorers');
        this.db.run('DELETE FROM shootouts');
        this.db.run('DELETE FROM results');
        this.db.run('DELETE FROM formerNames', (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    });
  }

  /**
   * Close database connection
   */
  close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  /**
   * Get underlying database instance for direct queries
   */
  getDatabase(): sqlite3.Database {
    return this.db;
  }

  /**
   * Promisify a run operation
   */
  run(sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }

  /**
   * Promisify a get operation
   */
  get(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  /**
   * Promisify an all operation
   */
  all(sql: string, params: any[] = []): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  /**
   * Save database to a file (creates a backup of the in-memory database)
   */
  async save(filePath: string): Promise<void> {
    // Ensure directory exists
    const dir = dirname(filePath);
    mkdirSync(dir, { recursive: true });

    return new Promise((resolve, reject) => {
      // For in-memory databases, we need to create a backup using JSON
      // For file-based databases, we can use the built-in backup mechanism
      const dbFilename = (this.db as any).filename;
      if (!dbFilename || dbFilename === ':memory:') {
        // Export all data to JSON and save it
        this.exportToJSON(filePath)
          .then(() => resolve())
          .catch(reject);
      } else {
        // For file-based databases, just create a copy
        const fs = require('fs');
        try {
          const sourceFile = dbFilename;
          const data = fs.readFileSync(sourceFile);
          fs.writeFileSync(filePath, data);
          resolve();
        } catch (err) {
          reject(err);
        }
      }
    });
  }

  /**
   * Load database from a file
   */
  async load(filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const fs = require('fs');
        const data = fs.readFileSync(filePath, 'utf-8');

        // Check if it's JSON format
        if (data.trim().startsWith('{')) {
          this.importFromJSON(filePath)
            .then(() => resolve())
            .catch(reject);
        } else {
          // Otherwise assume it's a SQLite database file
          // Create a temporary database connection to read from the file
          const tempDb = new sqlite3.Database(filePath);
          tempDb.serialize(() => {
            // Copy all data from the loaded database
            tempDb.all('SELECT * FROM results', async (err, rows: any[]) => {
              if (!err && rows) {
                for (const row of rows) {
                  await this.run(
                    'INSERT OR REPLACE INTO results VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [row.date, row.homeTeam, row.awayTeam, row.homeGoals, row.awayGoals, row.tournament, row.city, row.country, row.neutral]
                  );
                }
              }

              tempDb.all('SELECT * FROM goalscorers', async (err, rows: any[]) => {
                if (!err && rows) {
                  for (const row of rows) {
                    await this.run(
                      'INSERT OR REPLACE INTO goalscorers VALUES (?, ?, ?, ?, ?, ?, ?)',
                      [row.date, row.homeTeam, row.awayTeam, row.scorer, row.minute, row.ownGoal, row.penalty]
                    );
                  }
                }

                tempDb.all('SELECT * FROM shootouts', async (err, rows: any[]) => {
                  if (!err && rows) {
                    for (const row of rows) {
                      await this.run(
                        'INSERT OR REPLACE INTO shootouts VALUES (?, ?, ?, ?)',
                        [row.date, row.homeTeam, row.awayTeam, row.winner]
                      );
                    }
                  }

                  tempDb.all('SELECT * FROM formerNames', async (err, rows: any[]) => {
                    if (!err && rows) {
                      for (const row of rows) {
                        await this.run('INSERT OR REPLACE INTO formerNames VALUES (?, ?)', [
                          row.name,
                          row.formerName,
                        ]);
                      }
                    }

                    tempDb.close(() => {
                      resolve();
                    });
                  });
                });
              });
            });
          });
        }
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Export database to JSON format
   */
  private async exportToJSON(filePath: string): Promise<void> {
    const results = await this.all('SELECT * FROM results');
    const goalscorers = await this.all('SELECT * FROM goalscorers');
    const shootouts = await this.all('SELECT * FROM shootouts');
    const formerNames = await this.all('SELECT * FROM formerNames');

    const data = {
      results,
      goalscorers,
      shootouts,
      formerNames,
    };

    writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  /**
   * Import database from JSON format
   */
  private async importFromJSON(filePath: string): Promise<void> {
    const fs = require('fs');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    if (data.results) {
      for (const row of data.results as any[]) {
        await this.run(
          'INSERT OR REPLACE INTO results VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [row.date, row.homeTeam, row.awayTeam, row.homeGoals, row.awayGoals, row.tournament, row.city, row.country, row.neutral]
        );
      }
    }

    if (data.goalscorers) {
      for (const row of data.goalscorers as any[]) {
        await this.run(
          'INSERT OR REPLACE INTO goalscorers VALUES (?, ?, ?, ?, ?, ?, ?)',
          [row.date, row.homeTeam, row.awayTeam, row.scorer, row.minute, row.ownGoal, row.penalty]
        );
      }
    }

    if (data.shootouts) {
      for (const row of data.shootouts as any[]) {
        await this.run('INSERT OR REPLACE INTO shootouts VALUES (?, ?, ?, ?)', [
          row.date,
          row.homeTeam,
          row.awayTeam,
          row.winner,
        ]);
      }
    }

    if (data.formerNames) {
      for (const row of data.formerNames as any[]) {
        await this.run('INSERT OR REPLACE INTO formerNames VALUES (?, ?)', [row.name, row.formerName]);
      }
    }
  }
}

// Export singleton instance
let instance: FootballDatabase | null = null;

export async function initializeDatabase(dbPath?: string): Promise<FootballDatabase> {
  instance = new FootballDatabase(dbPath);
  await instance.ready();
  await instance.initialize();
  return instance;
}

export function getDatabase(): FootballDatabase {
  if (!instance) {
    throw new Error('Database not initialized. Call initializeDatabase first.');
  }
  return instance;
}
