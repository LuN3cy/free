import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let dbPath = path.resolve(__dirname, '../../lottery.db');
try {
  // Check if we can write to the directory
  const dir = path.dirname(dbPath);
  fs.accessSync(dir, fs.constants.W_OK);
} catch (e) {
  // Fallback to /tmp for serverless environments like Vercel
  dbPath = '/tmp/lottery.db';
}

const db = new Database(dbPath, { verbose: console.log });

// Initialize database
export const initDB = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS lottery_records (
      period VARCHAR(20) PRIMARY KEY,
      front_zone VARCHAR(50) NOT NULL,
      back_zone VARCHAR(20) NOT NULL,
      draw_date VARCHAR(20) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_draw_date ON lottery_records(draw_date DESC);
  `);
  console.log('Database initialized successfully.');
};

export default db;
