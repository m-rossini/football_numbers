import express, { Express } from 'express';
import os from 'os';
import { initializeDatabase, getDatabase } from './database/index';
import { loadAllData } from './database/csv-loader';

export const app: Express = express();
const port = 3000;
const startTime = Date.now();
const DATA_DIR = process.env.DATA_DIR || '/data';

app.get('/health', (_req, res) => {
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  res.json({
    status: 'ok',
    uptime
  });
});

app.get('/info', (_req, res) => {
  res.json({
    user: os.userInfo().username,
    hostname: os.hostname()
  });
});

app.get('/data/snapshot', async (_req, res) => {
  try {
    const db = getDatabase();
    const snapshot = await db.getSnapshot();
    res.json(snapshot);
  } catch (err) {
    res.status(500).json({
      error: 'Failed to get database snapshot',
      message: err instanceof Error ? err.message : 'Unknown error'
    });
  }
});

/**
 * Initialize database and load data
 */
async function initializeApp(): Promise<void> {
  try {
    // Initialize database
    const db = await initializeDatabase();
    console.log('Database initialized');

    // Try to load CSV data from /data mount
    try {
      await loadAllData(db, DATA_DIR);
      console.log('Data loaded successfully');
    } catch (err) {
      console.warn('Could not load data from /data mount:', err instanceof Error ? err.message : 'Unknown error');
      console.log('Continuing with empty database');
    }
  } catch (err) {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  initializeApp().then(() => {
    app.listen(port, '0.0.0.0', () => {
      console.log(`Server is running on port ${port}`);
    });
  });
}
