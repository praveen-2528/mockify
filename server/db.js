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

    CREATE TABLE IF NOT EXISTS mock_tests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        exam_template_id TEXT NOT NULL,
        name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        mock_test_id INTEGER,
        question_text TEXT NOT NULL,
        options TEXT NOT NULL,
        correct_answer INTEGER NOT NULL,
        explanation TEXT DEFAULT '',
        subject TEXT DEFAULT 'General',
        subtopic TEXT DEFAULT '',
        difficulty TEXT DEFAULT 'medium',
        exam_type TEXT DEFAULT 'ssc',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (mock_test_id) REFERENCES mock_tests(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_questions_mock ON questions(mock_test_id);

    CREATE INDEX IF NOT EXISTS idx_questions_user ON questions(user_id);
    CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions(subject);
`);

// ─── Migrations ─────────────────────────────────────────────────────
try {
    // Attempt to add mock_test_id to questions if it doesn't exist
    // This is for users who already have the older questions table
    db.exec(`ALTER TABLE questions ADD COLUMN mock_test_id INTEGER;`);
    console.log("Migration: Added mock_test_id to questions table");
} catch (e) {
    // If it throws, the column already exists, which is fine
}

export default db;
