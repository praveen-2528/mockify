import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { nanoid } from 'nanoid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'mockify_secret_key_change_in_production';

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

// ─── In-Memory Room Store ────────────────────────────────────────────
const rooms = new Map();

const generateRoomCode = () => nanoid(6).toUpperCase();

const ROOM_TTL = 3 * 60 * 60 * 1000; // 3 hours

// Auto-cleanup stale rooms
setInterval(() => {
    const now = Date.now();
    for (const [code, room] of rooms) {
        if (now - room.lastActivity > ROOM_TTL) {
            io.to(code).emit('roomClosed', { reason: 'Room expired due to inactivity.' });
            rooms.delete(code);
            console.log(`[Cleanup] Room ${code} deleted (inactive)`);
        }
    }
}, 60 * 1000);

// ─── Auth Middleware ─────────────────────────────────────────────────
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }
    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        req.userName = decoded.name;
        next();
    } catch {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

// ─── REST Endpoints ──────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', rooms: rooms.size });
});

// ── Auth: Register ───────────────────────────────────────────────────
app.post('/api/auth/register', (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required.' });
    }
    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
    if (existing) {
        return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const hash = bcrypt.hashSync(password, 10);
    const result = db.prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)').run(name.trim(), email.toLowerCase().trim(), hash);

    const token = jwt.sign({ userId: result.lastInsertRowid, name: name.trim() }, JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({
        token,
        user: { id: result.lastInsertRowid, name: name.trim(), email: email.toLowerCase().trim() },
    });
});

// ── Auth: Login ──────────────────────────────────────────────────────
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (!user) {
        return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (!bcrypt.compareSync(password, user.password_hash)) {
        return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign({ userId: user.id, name: user.name }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
        token,
        user: { id: user.id, name: user.name, email: user.email },
    });
});

// ── Auth: Get Current User ──────────────────────────────────────────
app.get('/api/auth/me', verifyToken, (req, res) => {
    const user = db.prepare('SELECT id, name, email, created_at FROM users WHERE id = ?').get(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ user });
});

// ── History: Save Test Result ────────────────────────────────────────
app.post('/api/history', verifyToken, (req, res) => {
    const { examType, testFormat, score, total, correct, incorrect, unattempted, totalMarks, maxMarks, percentage, totalTime, markingScheme, topicBreakdown, isMultiplayer } = req.body;

    const stmt = db.prepare(`
        INSERT INTO test_history (user_id, exam_type, test_format, score, total, correct, incorrect, unattempted, total_marks, max_marks, percentage, total_time, marking_scheme, topic_breakdown, is_multiplayer)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
        req.userId, examType, testFormat,
        score || 0, total || 0, correct || 0, incorrect || 0, unattempted || 0,
        totalMarks || 0, maxMarks || 0, percentage || 0, totalTime || 0,
        markingScheme ? JSON.stringify(markingScheme) : null,
        topicBreakdown ? JSON.stringify(topicBreakdown) : null,
        isMultiplayer ? 1 : 0
    );

    res.status(201).json({ id: result.lastInsertRowid });
});

// ── History: Get User's History ──────────────────────────────────────
app.get('/api/history', verifyToken, (req, res) => {
    const rows = db.prepare('SELECT * FROM test_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 50').all(req.userId);

    const history = rows.map(r => ({
        id: r.id,
        examType: r.exam_type,
        testFormat: r.test_format,
        score: r.score,
        total: r.total,
        correct: r.correct,
        incorrect: r.incorrect,
        unattempted: r.unattempted,
        totalMarks: r.total_marks,
        maxMarks: r.max_marks,
        percentage: r.percentage,
        totalTime: r.total_time,
        markingScheme: r.marking_scheme ? JSON.parse(r.marking_scheme) : null,
        topicBreakdown: r.topic_breakdown ? JSON.parse(r.topic_breakdown) : null,
        isMultiplayer: !!r.is_multiplayer,
        date: r.created_at,
    }));

    res.json({ history });
});

// ── History: Clear ───────────────────────────────────────────────────
app.delete('/api/history', verifyToken, (req, res) => {
    db.prepare('DELETE FROM test_history WHERE user_id = ?').run(req.userId);
    res.json({ success: true });
});

// ── Auth: Change Password ───────────────────────────────────────────
app.put('/api/auth/password', verifyToken, (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both current and new password required.' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters.' });

    const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.userId);
    if (!user || !bcrypt.compareSync(currentPassword, user.password_hash)) {
        return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    const hash = bcrypt.hashSync(newPassword, 10);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, req.userId);
    res.json({ success: true });
});

// ── Global Leaderboard ──────────────────────────────────────────────
app.get('/api/leaderboard', (req, res) => {
    const rows = db.prepare(`
        SELECT u.id, u.name,
            COUNT(h.id) as tests_taken,
            ROUND(AVG(h.percentage), 1) as avg_score,
            ROUND(MAX(h.percentage), 1) as best_score,
            SUM(h.total_time) as total_time
        FROM users u
        JOIN test_history h ON h.user_id = u.id
        GROUP BY u.id
        HAVING tests_taken >= 1
        ORDER BY avg_score DESC
        LIMIT 20
    `).all();

    res.json({ leaderboard: rows });
});

// ── Questions: List (with filters) ──────────────────────────────────
app.get('/api/questions', verifyToken, (req, res) => {
    const { subject, search, page = 1 } = req.query;
    const limit = 50;
    const offset = (parseInt(page) - 1) * limit;

    let where = 'WHERE user_id = ?';
    const params = [req.userId];

    if (subject) { where += ' AND subject = ?'; params.push(subject); }
    if (search) { where += ' AND question_text LIKE ?'; params.push(`%${search}%`); }

    const total = db.prepare(`SELECT COUNT(*) as count FROM questions ${where}`).get(...params).count;
    const rows = db.prepare(`SELECT * FROM questions ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, limit, offset);

    const questions = rows.map(r => ({
        id: r.id,
        text: r.question_text,
        options: JSON.parse(r.options),
        correctAnswer: r.correct_answer,
        explanation: r.explanation,
        subject: r.subject,
        subtopic: r.subtopic,
        difficulty: r.difficulty,
        examType: r.exam_type,
    }));

    const subjects = db.prepare('SELECT DISTINCT subject FROM questions WHERE user_id = ? ORDER BY subject').all(req.userId).map(r => r.subject);

    res.json({ questions, total, subjects, page: parseInt(page), pages: Math.ceil(total / limit) });
});

// ── Questions: Add Single ───────────────────────────────────────────
app.post('/api/questions', verifyToken, (req, res) => {
    const { text, options, correctAnswer, explanation, subject, subtopic, difficulty, examType } = req.body;

    if (!text || !options || correctAnswer === undefined) {
        return res.status(400).json({ error: 'Question text, options, and correct answer are required.' });
    }

    const result = db.prepare(`
        INSERT INTO questions (user_id, question_text, options, correct_answer, explanation, subject, subtopic, difficulty, exam_type)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(req.userId, text, JSON.stringify(options), correctAnswer, explanation || '', subject || 'General', subtopic || '', difficulty || 'medium', examType || 'ssc');

    res.status(201).json({ id: result.lastInsertRowid });
});

// ── Questions: Bulk Import ──────────────────────────────────────────
app.post('/api/questions/bulk', verifyToken, (req, res) => {
    const { questions } = req.body;
    if (!Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ error: 'Provide an array of questions.' });
    }

    const stmt = db.prepare(`
        INSERT INTO questions (user_id, question_text, options, correct_answer, explanation, subject, subtopic, difficulty, exam_type)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((items) => {
        let count = 0;
        for (const q of items) {
            let text = q.text || q.question || '';
            let options = q.options;
            let correctAnswer = q.correctAnswer;
            let explanation = q.explanation || '';

            if (options && !Array.isArray(options)) {
                const keys = Object.keys(options).sort();
                const optArr = keys.map(k => options[k]);
                correctAnswer = keys.indexOf(q.correct_option);
                options = optArr;
            }

            if (!text || !options || correctAnswer === undefined) continue;

            stmt.run(
                req.userId, text, JSON.stringify(options), correctAnswer,
                explanation, q.subject || q.subtopic || 'General', q.subtopic || '', q.difficulty || 'medium', q.exam_type || 'ssc'
            );
            count++;
        }
        return count;
    });

    const imported = insertMany(questions);
    res.status(201).json({ imported });
});

// ── Questions: Update ───────────────────────────────────────────────
app.put('/api/questions/:id', verifyToken, (req, res) => {
    const { text, options, correctAnswer, explanation, subject, subtopic, difficulty } = req.body;
    const q = db.prepare('SELECT id FROM questions WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (!q) return res.status(404).json({ error: 'Question not found.' });

    db.prepare(`
        UPDATE questions SET question_text=?, options=?, correct_answer=?, explanation=?, subject=?, subtopic=?, difficulty=?
        WHERE id=? AND user_id=?
    `).run(text, JSON.stringify(options), correctAnswer, explanation || '', subject || 'General', subtopic || '', difficulty || 'medium', req.params.id, req.userId);

    res.json({ success: true });
});

// ── Questions: Delete ───────────────────────────────────────────────
app.delete('/api/questions/:id', verifyToken, (req, res) => {
    const result = db.prepare('DELETE FROM questions WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
    if (result.changes === 0) return res.status(404).json({ error: 'Question not found.' });
    res.json({ success: true });
});

// ── Questions: Generate Test ────────────────────────────────────────
app.post('/api/questions/generate', verifyToken, (req, res) => {
    const { subject, count = 25 } = req.body;
    let where = 'WHERE user_id = ?';
    const params = [req.userId];

    if (subject && subject !== 'all') { where += ' AND subject = ?'; params.push(subject); }

    const rows = db.prepare(`SELECT * FROM questions ${where} ORDER BY RANDOM() LIMIT ?`).all(...params, parseInt(count));

    if (rows.length === 0) {
        return res.status(404).json({ error: 'No questions found. Import some questions first.' });
    }

    const questions = rows.map(r => ({
        id: r.id,
        text: r.question_text,
        options: JSON.parse(r.options),
        correctAnswer: r.correct_answer,
        explanation: r.explanation,
        subject: r.subject,
        subtopic: r.subtopic,
    }));

    res.json({ questions });
});

// ── Mocks: Save Full Mock Test ──────────────────────────────────────────────
app.post('/api/mocks', verifyToken, (req, res) => {
    const { examTemplateId, name, questions } = req.body;
    if (!examTemplateId || !name || !Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ error: 'Missing required fields or valid questions.' });
    }

    try {
        const insertMock = db.prepare('INSERT INTO mock_tests (user_id, exam_template_id, name) VALUES (?, ?, ?)');
        const insertQuestion = db.prepare(`
            INSERT INTO questions (user_id, mock_test_id, question_text, options, correct_answer, explanation, subject, subtopic, difficulty, exam_type)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        db.transaction(() => {
            const mockRes = insertMock.run(req.userId, examTemplateId, name);
            const mockId = mockRes.lastInsertRowid;

            for (const q of questions) {
                insertQuestion.run(
                    req.userId, mockId, q.text, JSON.stringify(q.options), q.correctAnswer,
                    q.explanation || '', q.subject || 'General', q.subtopic || '',
                    q.difficulty || 'medium', examTemplateId
                );
            }
        })();

        res.json({ success: true, message: `Mock test saved with ${questions.length} questions.` });
    } catch (err) {
        console.error('Error saving mock test:', err);
        res.status(500).json({ error: 'Database error saving mock test.' });
    }
});

// ── Mocks: List Saved Mocks ─────────────────────────────────────────────────
app.get('/api/mocks', verifyToken, (req, res) => {
    const rows = db.prepare(`
        SELECT m.*, COUNT(q.id) as question_count 
        FROM mock_tests m 
        LEFT JOIN questions q ON m.id = q.mock_test_id 
        WHERE m.user_id = ? 
        GROUP BY m.id 
        ORDER BY m.created_at DESC
    `).all(req.userId);
    res.json({ mocks: rows });
});

// ── Mocks: Get Mock Test Questions for Starting ──────────────────────────────
app.get('/api/mocks/:id/start', verifyToken, (req, res) => {
    const mockId = req.params.id;
    // Verify ownership
    const mock = db.prepare('SELECT * FROM mock_tests WHERE id = ? AND user_id = ?').get(mockId, req.userId);
    if (!mock) return res.status(404).json({ error: 'Mock test not found.' });

    const rows = db.prepare('SELECT * FROM questions WHERE mock_test_id = ? AND user_id = ?').all(mockId, req.userId);

    const questions = rows.map(r => ({
        id: r.id,
        text: r.question_text,
        options: JSON.parse(r.options),
        correctAnswer: r.correct_answer,
        explanation: r.explanation,
        subject: r.subject,
        subtopic: r.subtopic,
        difficulty: r.difficulty,
        examType: r.exam_type,
    }));

    res.json({ mock, questions });
});

// ─── Socket.IO Events ───────────────────────────────────────────────
io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    // ── Create Room ──────────────────────────────────────────────────
    socket.on('createRoom', ({ hostName, examType, testFormat, questions, roomMode }, callback) => {
        const code = generateRoomCode();

        const room = {
            code,
            hostId: socket.id,
            hostName,
            examType,
            testFormat,
            questions,
            roomMode,  // 'friendly' or 'exam'
            participants: [{ id: socket.id, name: hostName, isHost: true }],
            started: false,
            results: [],
            currentQuestionIndex: 0,
            // Friendly mode: track who answered for current question
            currentAnswers: {}, // { socketId: optionIndex }
            lastActivity: Date.now(),
        };

        rooms.set(code, room);
        socket.join(code);
        socket.roomCode = code;

        console.log(`[Room] Created: ${code} by ${hostName} (${roomMode} mode)`);
        callback({ success: true, code, room: sanitizeRoom(room) });
    });

    // ── Join Room ────────────────────────────────────────────────────
    socket.on('joinRoom', ({ code, playerName }, callback) => {
        const room = rooms.get(code);

        if (!room) {
            return callback({ success: false, error: 'Room not found. Check the code and try again.' });
        }
        if (room.started) {
            return callback({ success: false, error: 'This test has already started.' });
        }
        if (room.participants.length >= 20) {
            return callback({ success: false, error: 'Room is full (max 20 participants).' });
        }

        const participant = { id: socket.id, name: playerName, isHost: false };
        room.participants.push(participant);
        room.lastActivity = Date.now();

        socket.join(code);
        socket.roomCode = code;

        io.to(code).emit('participantJoined', {
            participant,
            participants: room.participants.map(p => ({ name: p.name, isHost: p.isHost })),
        });

        console.log(`[Room] ${playerName} joined ${code}`);
        callback({
            success: true,
            room: sanitizeRoom(room),
        });
    });

    // ── Start Room (Host Only) ───────────────────────────────────────
    socket.on('startRoom', ({ code }, callback) => {
        const room = rooms.get(code);
        if (!room) return callback({ success: false, error: 'Room not found.' });
        if (room.hostId !== socket.id) return callback({ success: false, error: 'Only the host can start the test.' });
        if (room.participants.length < 1) return callback({ success: false, error: 'Need at least 1 participant.' });

        room.started = true;
        room.currentQuestionIndex = 0;
        room.currentAnswers = {};
        room.lastActivity = Date.now();

        // Shuffle questions (Fisher-Yates) once for all participants
        const shuffled = [...room.questions];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        room.questions = shuffled;

        io.to(code).emit('testStarted', {
            questions: shuffled,
            examType: room.examType,
            testFormat: room.testFormat,
            roomMode: room.roomMode,
        });

        console.log(`[Room] ${code} test started! (${room.roomMode} mode)`);
        callback({ success: true });
    });

    // ── Friendly Mode: Player answers current question ───────────────
    socket.on('friendlyAnswer', ({ code, questionIndex, optionIndex }, callback) => {
        const room = rooms.get(code);
        if (!room || room.roomMode !== 'friendly') return callback?.({ success: false });
        if (questionIndex !== room.currentQuestionIndex) return callback?.({ success: false });

        room.currentAnswers[socket.id] = optionIndex;
        room.lastActivity = Date.now();

        const playerName = room.participants.find(p => p.id === socket.id)?.name || 'Unknown';

        // Broadcast how many have answered (not WHAT they answered)
        const answeredCount = Object.keys(room.currentAnswers).length;
        const totalParticipants = room.participants.length;

        io.to(code).emit('friendlyAnswerStatus', {
            answeredCount,
            totalParticipants,
            answeredPlayers: Object.keys(room.currentAnswers).map(sid => {
                return room.participants.find(p => p.id === sid)?.name || 'Unknown';
            }),
        });

        console.log(`[Friendly] ${playerName} answered Q${questionIndex + 1} in ${code} (${answeredCount}/${totalParticipants})`);

        // If everyone answered, reveal the correct answer + what each player picked
        if (answeredCount >= totalParticipants) {
            const correctAnswer = room.questions[questionIndex].correctAnswer;
            const playerChoices = {};
            for (const [sid, choice] of Object.entries(room.currentAnswers)) {
                const name = room.participants.find(p => p.id === sid)?.name || 'Unknown';
                playerChoices[name] = {
                    choice,
                    isCorrect: choice === correctAnswer,
                };
            }

            io.to(code).emit('friendlyReveal', {
                questionIndex,
                correctAnswer,
                playerChoices,
            });

            console.log(`[Friendly] All answered Q${questionIndex + 1} in ${code} — revealing!`);
        }

        callback?.({ success: true });
    });

    // ── Friendly Mode: Host moves to next question ───────────────────
    socket.on('friendlyNext', ({ code }, callback) => {
        const room = rooms.get(code);
        if (!room || room.roomMode !== 'friendly') return callback?.({ success: false });
        if (room.hostId !== socket.id) return callback?.({ success: false, error: 'Only host can advance.' });

        room.currentQuestionIndex += 1;
        room.currentAnswers = {};
        room.lastActivity = Date.now();

        io.to(code).emit('friendlyNextQuestion', {
            questionIndex: room.currentQuestionIndex,
        });

        console.log(`[Friendly] Moving to Q${room.currentQuestionIndex + 1} in ${code}`);
        callback?.({ success: true });
    });

    // ── Chat (Friendly Mode) ──────────────────────────────────────────
    socket.on('chatSend', ({ code, text }) => {
        const room = rooms.get(code);
        if (!room) return;

        const sender = room.participants.find(p => p.id === socket.id)?.name || 'Unknown';
        const msg = { sender, text: text.slice(0, 200), timestamp: Date.now() };

        io.to(code).emit('chatMessage', msg);
    });

    // ── Submit Results ───────────────────────────────────────────────
    socket.on('submitResults', ({ code, playerName, answers, timeSpent, score, total, correct, incorrect }, callback) => {
        const room = rooms.get(code);
        if (!room) return callback?.({ success: false, error: 'Room not found.' });

        room.results = room.results.filter(r => r.playerId !== socket.id);

        const totalTime = timeSpent.reduce((sum, t) => sum + (t || 0), 0);

        room.results.push({
            playerId: socket.id,
            playerName,
            score,
            total,
            correct,
            incorrect,
            totalTime,
            submittedAt: Date.now(),
        });

        room.lastActivity = Date.now();

        room.results.sort((a, b) => b.score - a.score || a.totalTime - b.totalTime);

        io.to(code).emit('leaderboardUpdate', {
            results: room.results,
            totalParticipants: room.participants.length,
            allSubmitted: room.results.length === room.participants.length,
        });

        console.log(`[Room] ${playerName} submitted results in ${code} (${room.results.length}/${room.participants.length})`);
        callback?.({ success: true, rank: room.results.findIndex(r => r.playerId === socket.id) + 1 });
    });

    // ── Get Leaderboard ──────────────────────────────────────────────
    socket.on('getLeaderboard', ({ code }, callback) => {
        const room = rooms.get(code);
        if (!room) return callback({ success: false, error: 'Room not found.' });

        callback({
            success: true,
            results: room.results,
            totalParticipants: room.participants.length,
            allSubmitted: room.results.length === room.participants.length,
        });
    });

    // ── Disconnect ───────────────────────────────────────────────────
    socket.on('disconnect', () => {
        const code = socket.roomCode;
        if (!code) return;

        const room = rooms.get(code);
        if (!room) return;

        room.participants = room.participants.filter(p => p.id !== socket.id);
        room.lastActivity = Date.now();

        io.to(code).emit('participantLeft', {
            participants: room.participants.map(p => ({ name: p.name, isHost: p.isHost })),
        });

        // Re-check if all remaining participants answered in friendly mode
        if (room.roomMode === 'friendly' && room.started) {
            delete room.currentAnswers[socket.id];
            const answeredCount = Object.keys(room.currentAnswers).length;
            if (room.participants.length > 0 && answeredCount >= room.participants.length) {
                const qi = room.currentQuestionIndex;
                const correctAnswer = room.questions[qi].correctAnswer;
                const playerChoices = {};
                for (const [sid, choice] of Object.entries(room.currentAnswers)) {
                    const name = room.participants.find(p => p.id === sid)?.name || 'Unknown';
                    playerChoices[name] = { choice, isCorrect: choice === correctAnswer };
                }
                io.to(code).emit('friendlyReveal', { questionIndex: qi, correctAnswer, playerChoices });
            }
        }

        if (room.hostId === socket.id && !room.started) {
            io.to(code).emit('roomClosed', { reason: 'Host left the room.' });
            rooms.delete(code);
            console.log(`[Room] ${code} closed (host left)`);
        }

        console.log(`[Socket] Disconnected: ${socket.id}`);
    });
});

// ─── Helpers ─────────────────────────────────────────────────────────
function sanitizeRoom(room) {
    return {
        code: room.code,
        hostName: room.hostName,
        examType: room.examType,
        testFormat: room.testFormat,
        roomMode: room.roomMode,
        participants: room.participants.map(p => ({ name: p.name, isHost: p.isHost })),
        started: room.started,
    };
}

// ─── Start Server ────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
    console.log(`\n  🚀 Mockify server running on http://localhost:${PORT}\n`);
});
