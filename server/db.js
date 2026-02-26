import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'mockify.db'));

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// ─── Create Tables ──────────────────────────────────────────────────
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS test_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        exam_type TEXT,
        test_format TEXT,
        score INTEGER DEFAULT 0,
        total INTEGER DEFAULT 0,
        correct INTEGER DEFAULT 0,
        incorrect INTEGER DEFAULT 0,
        unattempted INTEGER DEFAULT 0,
        total_marks REAL DEFAULT 0,
        max_marks REAL DEFAULT 0,
        percentage REAL DEFAULT 0,
        total_time INTEGER DEFAULT 0,
        marking_scheme TEXT,
        topic_breakdown TEXT,
        is_multiplayer INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_history_user ON test_history(user_id);
    CREATE INDEX IF NOT EXISTS idx_history_date ON test_history(created_at);
`);

export default db;
