import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useExam } from '../context/ExamContext';
import { useRoom } from '../context/RoomContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { CheckCircle, XCircle, ChevronLeft, ChevronRight, Award, Clock, Trophy, List, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Results.css';

const Results = () => {
    const { historyId } = useParams();
    const { questions, answers, resetExam, testStarted, timeSpent, isMultiplayer, roomCode, markingScheme, testName, updateExamState } = useExam();
    const room = useRoom();
    const { authFetch } = useAuth();
    const navigate = useNavigate();
    const historySavedRef = useRef(false);

    const [isReviewMode, setIsReviewMode] = useState(!!historyId);
    const [loadingReview, setLoadingReview] = useState(!!historyId);

    // New state for tabbed UI
    const [activeTab, setActiveTab] = useState('analytics'); // 'analytics' | 'solutions'
    const [reviewIndex, setReviewIndex] = useState(0);
    const [paletteCollapsed, setPaletteCollapsed] = useState(false);
    const [showPaletteMobile, setShowPaletteMobile] = useState(false);

    const ms = markingScheme || { correct: 2, incorrect: -0.5, unattempted: 0 };

    const formatTime = (seconds) => {
        if (!seconds) return '00:00';
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        if (historyId) {
            setLoadingReview(true);
            authFetch(`/api/history/${historyId}`)
                .then(r => r.json())
                .then(data => {
                    if (data.error) throw new Error(data.error);
                    updateExamState({
                        questions: data.questions || [],
                        answers: data.answers || {},
                        timeSpent: data.timeSpent || [],
                        testName: data.testName || 'Attempted Test',
                        examType: data.examType,
                        testStarted: true,
                        markingScheme: data.markingScheme || { correct: 2, incorrect: -0.5, unattempted: 0 },
                        _saveId: data.id
                    });
                    setIsReviewMode(true);
                    setLoadingReview(false);
                })
                .catch(err => {
                    console.error("Failed to load history", err);
                    navigate('/dashboard');
                });
        }
    }, [historyId, authFetch, navigate]);

    let correct = 0;
    let incorrect = 0;
    let attempted = answers ? Object.keys(answers).length : 0;

    if (answers && questions && questions.length > 0) {
        Object.keys(answers).forEach((qIndex) => {
            if (questions[qIndex] && answers[qIndex] === questions[qIndex].correctAnswer) {
                correct += 1;
            } else {
                incorrect += 1;
            }
        });
    }

    const unattempted = questions ? questions.length - attempted : 0;
    const rawScore = correct;
    const totalMarks = (correct * ms.correct) + (incorrect * ms.incorrect) + (unattempted * ms.unattempted);
    const maxMarks = questions ? questions.length * ms.correct : 0;
    const percentage = questions && questions.length > 0 ? ((correct / questions.length) * 100).toFixed(1) : 0;
    const hasNegative = ms.incorrect < 0;

    useEffect(() => {
        if (!historyId && (!testStarted || !questions || questions.length === 0)) {
            navigate('/');
        }
    }, [testStarted, questions, navigate, historyId]);

    // Save to history once
    useEffect(() => {
        if (isReviewMode || historySavedRef.current || !testStarted || !questions || questions.length === 0) return;
        historySavedRef.current = true;

        const topicBreakdown = {};
        questions.forEach((q, idx) => {
            const topic = q.subject || 'General';
            if (!topicBreakdown[topic]) topicBreakdown[topic] = { correct: 0, total: 0 };
            topicBreakdown[topic].total += 1;
            if (answers[idx] !== undefined && answers[idx] === q.correctAnswer) {
                topicBreakdown[topic].correct += 1;
            }
        });

        const totalTimeSec = timeSpent ? timeSpent.reduce((a, b) => a + (b || 0), 0) : 0;

        authFetch('/api/history', {
            method: 'POST',
            body: JSON.stringify({
                examType: questions[0]?.examType || 'ssc',
                testFormat: 'mock',
                testName: testName || 'Attempted Test',
                score: rawScore,
                total: questions.length,
                correct,
                incorrect,
                unattempted,
                totalMarks,
                maxMarks,
                percentage: parseFloat(percentage),
                totalTime: totalTimeSec,
                markingScheme: ms,
                topicBreakdown,
                isMultiplayer,
                questions,
                answers,
                timeSpent
            }),
        }).catch(() => { });
    }, [isReviewMode, testStarted, questions, answers, timeSpent, testName, rawScore, correct, incorrect, unattempted, totalMarks, maxMarks, percentage, ms, isMultiplayer, authFetch]);

    if (loadingReview) return <div className="loading-screen"><div className="loading-spinner" /></div>;

    // Handle legacy tests that don't have questions saved
    if (isReviewMode && (!questions || questions.length === 0)) {
        return (
            <div className="results-container animate-fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <Card className="glass" style={{ textAlign: 'center', padding: '3rem 2rem', maxWidth: '500px' }}>
                    <XCircle size={48} className="text-danger" style={{ margin: '0 auto 1rem' }} />
                    <h2 style={{ marginBottom: '1rem' }}>Review Not Available</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                        This test attempt was recorded before the full-history tracking feature was introduced. Only tests taken from now on can be fully reviewed.
                    </p>
                    <Button variant="primary" onClick={() => navigate('/dashboard')}>
                        Back to Dashboard
                    </Button>
                </Card>
            </div>
        );
    }

    if (!isReviewMode && (!testStarted || !questions || questions.length === 0)) return null;

    // Time heatmap data
    const allTimes = timeSpent.filter(t => t > 0);
    const avgTime = allTimes.length > 0 ? allTimes.reduce((a, b) => a + b, 0) / allTimes.length : 0;

    const getHeatColor = (time) => {
        if (!time || time === 0) return 'var(--card-bg)'; // skipped
        const ratio = time / avgTime;
        if (ratio < 0.5) return '#10b981';  // fast - green
        if (ratio < 1.0) return '#34d399';  // normal-fast
        if (ratio < 1.5) return '#fbbf24';  // average - yellow
        if (ratio < 2.5) return '#f97316';  // slow - orange
        return '#ef4444';                    // very slow - red
    };

    const getHeatLabel = (time) => {
        if (!time || time === 0) return 'Skipped';
        const ratio = time / avgTime;
        if (ratio < 0.5) return 'Fast';
        if (ratio < 1.0) return 'Normal';
        if (ratio < 1.5) return 'Average';
        if (ratio < 2.5) return 'Slow';
        return 'Very Slow';
    };

    const handleBackHome = () => {
        if (isMultiplayer) room.leaveRoom();
        resetExam();
        navigate('/');
    };

    const handleReattempt = () => {
        if (isMultiplayer) room.leaveRoom();
        resetExam();
        updateExamState({
            questions: questions,
            answers: {},
            timeSpent: [],
            testStarted: true,
            currentQuestionIndex: 0,
            markedForReview: [],
            timeLeft: null,
            _saveId: null,
            testName: testName || 'Reattempted Test',
            examType: questions[0]?.examType || 'ssc'
        });
        navigate('/test');
    };

    return (
        <div className="results-container animate-fade-in">
            <header className="results-header glass">
                <div className="header-content">
                    <Award size={28} className="text-primary" />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <h2>Test Results Summary</h2>
                        {testName && <span style={{ opacity: 0.8, fontSize: '0.9rem' }}>{testName}</span>}
                    </div>
                </div>
                <div className="results-header-actions">
                    {isMultiplayer && roomCode && (
                        <Button variant="primary" onClick={() => navigate('/leaderboard')}>
                            <Trophy size={16} /> Leaderboard
                        </Button>
                    )}
                    {isReviewMode && (
                        <Button variant="primary" onClick={handleReattempt}>
                            Reattempt Test
                        </Button>
                    )}
                    <Button variant="outline" onClick={handleBackHome}>
                        <ChevronLeft size={16} /> {isReviewMode ? 'Back to Dashboard' : 'New Test'}
                    </Button>
                </div>
            </header>

            <div className="results-tabs-wrapper">
                <div className="results-tabs list-glass">
                    <button 
                        className={`results-tab ${activeTab === 'analytics' ? 'active' : ''}`}
                        onClick={() => setActiveTab('analytics')}
                    >
                        📊 Analytics
                    </button>
                    <button 
                        className={`results-tab ${activeTab === 'solutions' ? 'active' : ''}`}
                        onClick={() => setActiveTab('solutions')}
                    >
                        📝 Solutions & Review
                    </button>
                </div>
            </div>

            <main className="results-content">
                {activeTab === 'analytics' && (
                    <div className="analytics-view animate-fade-in">
                        <Card className="score-card glass">
                    <div className="score-circle">
                        <div className="score-value">{totalMarks}<span>/{maxMarks}</span></div>
                        <div className="score-percentage">{percentage}%</div>
                        {hasNegative && (
                            <div className="marking-info-badge">
                                +{ms.correct} / {ms.incorrect}
                            </div>
                        )}
                    </div>

                    <div className="score-stats">
                        <div className="stat-box">
                            <span className="stat-label">Correct</span>
                            <span className="stat-value text-success">{correct}</span>
                            {hasNegative && <span className="stat-marks positive">+{(correct * ms.correct).toFixed(1)}</span>}
                        </div>
                        <div className="stat-box">
                            <span className="stat-label">Incorrect</span>
                            <span className="stat-value text-danger">{incorrect}</span>
                            {hasNegative && incorrect > 0 && <span className="stat-marks negative">{(incorrect * ms.incorrect).toFixed(1)}</span>}
                        </div>
                        <div className="stat-box">
                            <span className="stat-label">Skipped</span>
                            <span className="stat-value text-slate-400">{unattempted}</span>
                        </div>
                        <div className="stat-box">
                            <span className="stat-label">Attempted</span>
                            <span className="stat-value text-blue-400">{attempted}</span>
                        </div>
                    </div>
                </Card>

                {/* Difficulty Heatmap */}
                <Card className="heatmap-card glass">
                    <h3 className="heatmap-title">🌡️ Time Difficulty Heatmap</h3>
                    <p className="heatmap-subtitle">Color shows how long you spent relative to average ({formatTime(Math.round(avgTime))})</p>
                    <div className="heatmap-grid">
                        {questions.map((_, idx) => {
                            const time = timeSpent[idx] || 0;
                            const userAnswer = answers[idx];
                            const isCorrect = userAnswer !== undefined && userAnswer === questions[idx].correctAnswer;
                            return (
                                <div
                                    key={idx}
                                    className={`heatmap-cell ${userAnswer === undefined ? 'skipped' : ''}`}
                                    style={{ '--heat-color': getHeatColor(time), cursor: 'pointer' }}
                                    onClick={() => {
                                        setReviewIndex(idx);
                                        setActiveTab('solutions');
                                    }}
                                    title={`Q${idx + 1}: ${formatTime(time)} — ${getHeatLabel(time)}${userAnswer !== undefined ? (isCorrect ? ' ✅' : ' ❌') : ' (skipped)'} (Click to Review)`}
                                >
                                    <span className="heatmap-num">{idx + 1}</span>
                                    {userAnswer !== undefined && (
                                        <span className={`heatmap-dot ${isCorrect ? 'correct' : 'wrong'}`}></span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <div className="heatmap-legend">
                        <div className="legend-item"><span className="legend-color" style={{ background: '#10b981' }}></span> Fast</div>
                        <div className="legend-item"><span className="legend-color" style={{ background: '#34d399' }}></span> Normal</div>
                        <div className="legend-item"><span className="legend-color" style={{ background: '#fbbf24' }}></span> Average</div>
                        <div className="legend-item"><span className="legend-color" style={{ background: '#f97316' }}></span> Slow</div>
                        <div className="legend-item"><span className="legend-color" style={{ background: '#ef4444' }}></span> V. Slow</div>
                    </div>
                </Card>
                </div>
                )}

                {activeTab === 'solutions' && questions[reviewIndex] && (
                    <div className="solutions-view animate-fade-in" style={{ display: 'flex', gap: '1.5rem', width: '100%', alignItems: 'flex-start' }}>
                        
                        {/* Main Question Area */}
                        <div className="question-area" style={{ flex: 1, minWidth: 0 }}>
                            {/* Mobile palette toggle */}
                            <div className="mobile-palette-toggle-wrapper">
                                <Button variant="outline" className="full-width" onClick={() => setShowPaletteMobile(!showPaletteMobile)} style={{ marginBottom: '1rem' }}>
                                    <List size={16} style={{ marginRight: '0.5rem' }} /> 
                                    {showPaletteMobile ? 'Hide Questions' : 'Show All Questions'}
                                </Button>
                            </div>

                            <Card className={`review-card  ${answers[reviewIndex] !== undefined ? (answers[reviewIndex] === questions[reviewIndex].correctAnswer ? 'correct-border' : 'incorrect-border') : 'skipped-border'}`}>
                                <div className="review-q-header">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <span className="q-number">Question {reviewIndex + 1} of {questions.length}</span>
                                        <span className="q-time text-slate-400" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem' }}>
                                            <Clock size={14} /> {formatTime(timeSpent?.[reviewIndex] || 0)}
                                        </span>
                                        {answers[reviewIndex] !== undefined && (
                                            <span className={`marks-pill ${answers[reviewIndex] === questions[reviewIndex].correctAnswer ? 'positive' : 'negative'}`}>
                                                {answers[reviewIndex] === questions[reviewIndex].correctAnswer ? `+${ms.correct}` : ms.incorrect}
                                            </span>
                                        )}
                                    </div>
                                    <div className="q-status">
                                        {answers[reviewIndex] === undefined && <span className="status-badge skipped">Skipped</span>}
                                        {answers[reviewIndex] !== undefined && answers[reviewIndex] === questions[reviewIndex].correctAnswer && <span className="status-badge correct"><CheckCircle size={14} /> Correct</span>}
                                        {answers[reviewIndex] !== undefined && answers[reviewIndex] !== questions[reviewIndex].correctAnswer && <span className="status-badge incorrect"><XCircle size={14} /> Incorrect</span>}
                                    </div>
                                </div>
                                <h4 className="review-q-text">{questions[reviewIndex].text}</h4>

                                <div className="review-options">
                                    {questions[reviewIndex].options.map((opt, optIdx) => {
                                        let optClass = "review-opt ";
                                        if (optIdx === questions[reviewIndex].correctAnswer) optClass += "is-correct";
                                        else if (answers[reviewIndex] === optIdx) optClass += "is-wrong";

                                        return (
                                            <div key={optIdx} className={optClass}>
                                                <span className="opt-letter">{String.fromCharCode(65 + optIdx)}</span>
                                                <span className="opt-text">{opt}</span>
                                                {optIdx === questions[reviewIndex].correctAnswer && <CheckCircle className="opt-icon success" size={16} />}
                                                {answers[reviewIndex] === optIdx && answers[reviewIndex] !== questions[reviewIndex].correctAnswer && <XCircle className="opt-icon danger" size={16} />}
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="explanation-box" style={{ marginTop: '1.5rem' }}>
                                    <h5>Explanation</h5>
                                    <p>{questions[reviewIndex].explanation}</p>
                                </div>

                                <div className="solution-nav-actions" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                    <Button variant="ghost" onClick={() => setReviewIndex(Math.max(0, reviewIndex - 1))} disabled={reviewIndex === 0}>
                                        <ChevronLeft size={16} /> Previous
                                    </Button>
                                    <Button variant="ghost" onClick={() => setReviewIndex(Math.min(questions.length - 1, reviewIndex + 1))} disabled={reviewIndex === questions.length - 1}>
                                        Next <ChevronRight size={16} />
                                    </Button>
                                </div>
                            </Card>
                        </div>

                        {/* Sidebar Palette */}
                        <aside className={`palette-sidebar glass ${showPaletteMobile ? 'show' : ''}`} style={{ flex: '0 0 300px' }}>
                            <div className="palette-header">
                                <div className="palette-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3 style={{ margin: 0, fontSize: '1rem' }}>Questions</h3>
                                    <button className="palette-collapse-btn" style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }} onClick={() => setPaletteCollapsed(!paletteCollapsed)} title={paletteCollapsed ? 'Expand' : 'Collapse'}>
                                        {paletteCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                                    </button>
                                </div>
                            </div>

                            {!paletteCollapsed && (
                                <div className="palette-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(40px, 1fr))', gap: '8px', padding: '1rem', maxHeight: '400px', overflowY: 'auto' }}>
                                    {questions.map((_, idx) => {
                                        let btnClass = "palette-btn ";
                                        if (reviewIndex === idx) btnClass += "current ";
                                        if (answers[idx] !== undefined) {
                                            if (answers[idx] === questions[idx].correctAnswer) btnClass += "correct ";
                                            else btnClass += "incorrect ";
                                        } else {
                                            btnClass += "skipped ";
                                        }

                                        return (
                                            <button
                                                key={idx}
                                                className={btnClass}
                                                onClick={() => {
                                                    setReviewIndex(idx);
                                                    setShowPaletteMobile(false);
                                                }}
                                                style={{
                                                    width: '100%', aspectRatio: '1', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', cursor: 'pointer',
                                                    background: reviewIndex === idx ? '#a5b4fc' : (answers[idx] === undefined ? 'transparent' : (answers[idx] === questions[idx].correctAnswer ? 'rgba(16,185,129,0.2)' : 'rgba(239, 68, 68, 0.2)')),
                                                    color: reviewIndex === idx ? '#000' : 'white',
                                                    borderColor: answers[idx] !== undefined ? (answers[idx] === questions[idx].correctAnswer ? '#10b981' : '#ef4444') : 'rgba(255,255,255,0.2)'
                                                }}
                                            >
                                                {idx + 1}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </aside>

                    </div>
                )}
            </main>
        </div>
    );
};

export default Results;
