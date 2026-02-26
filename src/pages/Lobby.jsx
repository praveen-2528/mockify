import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoom } from '../context/RoomContext';
import { useExam } from '../context/ExamContext';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Users, Plus, LogIn, Copy, Check, Wifi, WifiOff, Crown, User, Zap, BookOpen, ChevronLeft } from 'lucide-react';
import './Lobby.css';

const Lobby = () => {
    const navigate = useNavigate();
    const room = useRoom();
    const { updateExamState } = useExam();
    const { user } = useAuth();

    const [tab, setTab] = useState('create'); // 'create' or 'join'
    const [hostName, setHostName] = useState(user?.name || '');
    const [playerName, setPlayerName] = useState(user?.name || '');
    const [joinCode, setJoinCode] = useState('');
    const [examType, setExamType] = useState('ssc');
    const [testFormat, setTestFormat] = useState('full');
    const [roomMode, setRoomMode] = useState('friendly');
    const [jsonInput, setJsonInput] = useState('');
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleCreateRoom = async () => {
        setError('');
        if (!hostName.trim()) return setError('Enter your display name.');
        if (!jsonInput.trim()) return setError('Paste or upload your questions JSON.');

        let parsedQuestions;
        try {
            const parsedData = JSON.parse(jsonInput);
            let questionsArray = Array.isArray(parsedData) ? parsedData : null;
            if (!questionsArray && typeof parsedData === 'object' && parsedData !== null) {
                if (Array.isArray(parsedData.questions)) questionsArray = parsedData.questions;
                else if (Array.isArray(parsedData.data)) questionsArray = parsedData.data;
                else questionsArray = Object.values(parsedData).find(val => Array.isArray(val));
            }
            if (!questionsArray || questionsArray.length === 0) throw new Error('No questions found.');

            const requiredOptions = examType === 'ssc' ? 4 : 5;
            parsedQuestions = questionsArray.map((q, i) => {
                if (!q.options || Object.keys(q.options).length !== requiredOptions) {
                    throw new Error(`Question ${i + 1} must have ${requiredOptions} options.`);
                }
                const optionKeys = Object.keys(q.options).sort();
                const optionsArray = optionKeys.map(key => q.options[key]);
                if (!q.correct_option || !optionKeys.includes(q.correct_option)) {
                    throw new Error(`Question ${i + 1} has invalid correct_option.`);
                }
                return {
                    id: q.id || i,
                    text: q.question,
                    options: optionsArray,
                    correctAnswer: optionKeys.indexOf(q.correct_option),
                    subject: q.subtopic || q.difficulty,
                    explanation: q.explanation || 'No explanation provided.',
                };
            });
        } catch (err) {
            return setError(err.message);
        }

        setLoading(true);
        try {
            await room.createRoom({
                hostName: hostName.trim(),
                examType,
                testFormat,
                questions: parsedQuestions,
                roomMode,
            });
        } catch (err) {
            setError(err.message);
        }
        setLoading(false);
    };

    const handleJoinRoom = async () => {
        setError('');
        if (!playerName.trim()) return setError('Enter your display name.');
        if (!joinCode.trim() || joinCode.trim().length < 4) return setError('Enter a valid room code.');

        setLoading(true);
        try {
            await room.joinRoom({ code: joinCode.trim(), playerName: playerName.trim() });
        } catch (err) {
            setError(err.message);
        }
        setLoading(false);
    };

    const handleStartTest = async () => {
        setLoading(true);
        try {
            await room.startRoom();
        } catch (err) {
            setError(err.message);
        }
        setLoading(false);
    };

    const copyCode = () => {
        navigator.clipboard.writeText(room.roomCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => setJsonInput(ev.target.result);
            reader.readAsText(file);
        }
    };

    // Listen for test start
    React.useEffect(() => {
        if (!room.socket) return;
        const handler = ({ questions, examType: et, testFormat: tf, roomMode: rm }) => {
            updateExamState({
                examType: et,
                testFormat: tf,
                questions,
                testStarted: true,
                isMultiplayer: true,
                roomCode: room.roomCode,
                currentQuestionIndex: 0,
                answers: {},
                markedForReview: [],
                timeSpent: [],
                timeLeft: et === 'ssc' ? 60 * 60 : 120 * 60,
            });
            navigate('/test');
        };
        room.socket.on('testStarted', handler);
        return () => room.socket.off('testStarted', handler);
    }, [room.socket, room.roomCode, updateExamState, navigate]);

    // If in a room, show the waiting lobby
    if (room.roomCode && !room.started) {
        return (
            <div className="lobby-container animate-fade-in">
                <div className="lobby-header">
                    <h1>🏠 Room Lobby</h1>
                    <p>Waiting for host to start the test</p>
                </div>

                <Card className="lobby-card">
                    <div className="room-code-display">
                        <span className="room-code-label">Room Code</span>
                        <div className="room-code-value" onClick={copyCode}>
                            <span>{room.roomCode}</span>
                            {copied ? <Check size={20} className="text-success" /> : <Copy size={20} />}
                        </div>
                        <span className="room-code-hint">Share this code with your peers</span>
                    </div>

                    <div className="room-info-badges">
                        <span className="info-badge">{room.examType?.toUpperCase()}</span>
                        <span className="info-badge">{room.roomMode === 'friendly' ? '🎉 Friendly Test' : '📝 Real Exam'}</span>
                        <span className="info-badge">{room.testFormat}</span>
                    </div>

                    <div className="participants-section">
                        <h3><Users size={18} /> Participants ({room.participants.length})</h3>
                        <div className="participants-list">
                            {room.participants.map((p, idx) => (
                                <div key={idx} className="participant-item animate-fade-in">
                                    {p.isHost ? <Crown size={16} className="text-amber" /> : <User size={16} />}
                                    <span>{p.name}</span>
                                    {p.isHost && <span className="host-badge">HOST</span>}
                                </div>
                            ))}
                        </div>
                    </div>

                    {error && <div className="error-message"><span>{error}</span></div>}

                    <div className="lobby-actions">
                        <Button variant="ghost" onClick={() => { room.leaveRoom(); }}>
                            <ChevronLeft size={16} /> Leave Room
                        </Button>
                        {room.isHost && (
                            <Button variant="primary" onClick={handleStartTest} disabled={loading || room.participants.length < 1}>
                                <Zap size={18} /> Start Test for Everyone
                            </Button>
                        )}
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="lobby-container animate-fade-in">
            <div className="lobby-header">
                <h1>🏠 Multiplayer Room</h1>
                <p>Compete with friends in real-time</p>
                <div className={`connection-status ${room.connected ? 'online' : 'offline'}`}>
                    {room.connected ? <><Wifi size={14} /> Connected</> : <><WifiOff size={14} /> Connecting...</>}
                </div>
            </div>

            <Card className="lobby-card">
                <div className="lobby-tabs">
                    <button className={`lobby-tab ${tab === 'create' ? 'active' : ''}`} onClick={() => { setTab('create'); setError(''); }}>
                        <Plus size={18} /> Create Room
                    </button>
                    <button className={`lobby-tab ${tab === 'join' ? 'active' : ''}`} onClick={() => { setTab('join'); setError(''); }}>
                        <LogIn size={18} /> Join Room
                    </button>
                </div>

                {tab === 'create' && (
                    <div className="tab-content animate-fade-in">
                        <div className="form-group">
                            <label>Your Display Name</label>
                            <input className="lobby-input" value={hostName} onChange={e => setHostName(e.target.value)} placeholder="e.g. Praveen" />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Exam Type</label>
                                <div className="mini-options">
                                    <button className={examType === 'ssc' ? 'selected' : ''} onClick={() => setExamType('ssc')}>
                                        <BookOpen size={16} /> SSC
                                    </button>
                                    <button className={examType === 'ibps' ? 'selected' : ''} onClick={() => setExamType('ibps')}>
                                        <BookOpen size={16} /> IBPS
                                    </button>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Room Mode</label>
                                <div className="mini-options">
                                    <button className={roomMode === 'friendly' ? 'selected' : ''} onClick={() => setRoomMode('friendly')} title="Wait for all answers, reveal correct answer together">
                                        🎉 Friendly
                                    </button>
                                    <button className={roomMode === 'exam' ? 'selected' : ''} onClick={() => setRoomMode('exam')} title="Real exam — answers revealed only after submission">
                                        📝 Real Exam
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Questions Data (JSON)</label>
                            <div className="upload-row">
                                <input type="file" id="room-json-upload" accept=".json" style={{ display: 'none' }} onChange={handleFileUpload} />
                                <label htmlFor="room-json-upload" className="upload-btn-sm">📁 Upload .json</label>
                            </div>
                            <textarea className="json-textarea" value={jsonInput} onChange={e => setJsonInput(e.target.value)} placeholder='[{"question": "...", "options": {...}, "correct_option": "A"}]' rows={4}></textarea>
                        </div>

                        {error && <div className="error-message"><span>{error}</span></div>}

                        <Button variant="primary" className="full-width" onClick={handleCreateRoom} disabled={loading}>
                            {loading ? 'Creating...' : '🚀 Create Room'}
                        </Button>
                    </div>
                )}

                {tab === 'join' && (
                    <div className="tab-content animate-fade-in">
                        <div className="form-group">
                            <label>Your Display Name</label>
                            <input className="lobby-input" value={playerName} onChange={e => setPlayerName(e.target.value)} placeholder="e.g. Rahul" />
                        </div>
                        <div className="form-group">
                            <label>Room Code</label>
                            <input className="lobby-input room-code-input" value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} placeholder="e.g. A1B2C3" maxLength={6} />
                        </div>

                        {error && <div className="error-message"><span>{error}</span></div>}

                        <Button variant="primary" className="full-width" onClick={handleJoinRoom} disabled={loading}>
                            {loading ? 'Joining...' : '🎯 Join Room'}
                        </Button>
                    </div>
                )}
            </Card>

            <div className="lobby-back">
                <Button variant="ghost" onClick={() => navigate('/')}>
                    <ChevronLeft size={16} /> Back to Setup
                </Button>
            </div>
        </div>
    );
};

export default Lobby;
