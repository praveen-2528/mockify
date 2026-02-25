import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoom } from '../context/RoomContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Trophy, Medal, Clock, ChevronLeft, Users, RefreshCw } from 'lucide-react';
import './Leaderboard.css';

const Leaderboard = () => {
    const navigate = useNavigate();
    const { results, totalParticipants, allSubmitted, roomCode, getLeaderboard, leaveRoom } = useRoom();

    useEffect(() => {
        if (roomCode) {
            getLeaderboard().catch(() => { });
        }
    }, [roomCode, getLeaderboard]);

    const formatTotalTime = (seconds) => {
        if (!seconds) return '00:00';
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleRefresh = () => {
        if (roomCode) getLeaderboard().catch(() => { });
    };

    const handleNewTest = () => {
        leaveRoom();
        navigate('/');
    };

    const podiumColors = ['#fbbf24', '#94a3b8', '#cd7f32']; // gold, silver, bronze
    const podiumLabels = ['🥇', '🥈', '🥉'];

    return (
        <div className="leaderboard-container animate-fade-in">
            <div className="leaderboard-header">
                <h1><Trophy size={32} /> Leaderboard</h1>
                <p>
                    {allSubmitted
                        ? `All ${totalParticipants} participants have submitted!`
                        : `${results.length} of ${totalParticipants} submitted — waiting for others...`
                    }
                </p>
                {roomCode && (
                    <span className="room-badge">Room: {roomCode}</span>
                )}
            </div>

            {/* Podium for top 3 */}
            {results.length >= 2 && (
                <div className="podium-section">
                    {results.slice(0, 3).map((r, idx) => (
                        <div key={idx} className={`podium-card podium-${idx + 1}`} style={{ '--podium-color': podiumColors[idx] }}>
                            <span className="podium-emoji">{podiumLabels[idx]}</span>
                            <h3 className="podium-name">{r.playerName}</h3>
                            <div className="podium-score">{r.score}<span>/{r.total}</span></div>
                            <div className="podium-time"><Clock size={12} /> {formatTotalTime(r.totalTime)}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Full Table */}
            <Card className="leaderboard-table-card">
                <table className="leaderboard-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Name</th>
                            <th>Score</th>
                            <th>Correct</th>
                            <th>Incorrect</th>
                            <th>Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        {results.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="empty-row">
                                    <Users size={24} />
                                    <span>Waiting for submissions...</span>
                                </td>
                            </tr>
                        ) : (
                            results.map((r, idx) => (
                                <tr key={idx} className={idx < 3 ? `top-${idx + 1}` : ''}>
                                    <td className="rank-cell">
                                        {idx < 3 ? podiumLabels[idx] : idx + 1}
                                    </td>
                                    <td className="name-cell">{r.playerName}</td>
                                    <td className="score-cell">
                                        <strong>{r.score}</strong>/{r.total}
                                        <span className="pct">({((r.score / r.total) * 100).toFixed(0)}%)</span>
                                    </td>
                                    <td className="correct-cell">{r.correct}</td>
                                    <td className="incorrect-cell">{r.incorrect}</td>
                                    <td className="time-cell">{formatTotalTime(r.totalTime)}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </Card>

            <div className="leaderboard-actions">
                <Button variant="ghost" onClick={() => navigate('/results')}>
                    <ChevronLeft size={16} /> My Results
                </Button>
                {!allSubmitted && (
                    <Button variant="outline" onClick={handleRefresh}>
                        <RefreshCw size={16} /> Refresh
                    </Button>
                )}
                <Button variant="primary" onClick={handleNewTest}>
                    New Test
                </Button>
            </div>
        </div>
    );
};

export default Leaderboard;
