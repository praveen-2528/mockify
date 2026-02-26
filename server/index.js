import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { nanoid } from 'nanoid';

const app = express();
app.use(cors());
app.use(express.json());

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

// ─── REST Endpoints ──────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', rooms: rooms.size });
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
