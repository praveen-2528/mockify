import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExam } from '../context/ExamContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Clock, ChevronLeft, ChevronRight, CheckCircle, List, Play, Pause, SaveAll, Bookmark } from 'lucide-react';
import './Test.css';

const Test = () => {
    const { examType, testFormat, questions, testStarted, currentQuestionIndex, updateExamState, answers, markedForReview, timeSpent } = useExam();
    const navigate = useNavigate();
    const [timeLeft, setTimeLeft] = useState(examType === 'ssc' ? 60 * 60 : 120 * 60); // 1hr for SSC, 2hr for IBPS
    const [showPalette, setShowPalette] = useState(false);
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        if (!testStarted || questions.length === 0) {
            navigate('/');
        }
    }, [testStarted, questions, navigate]);

    useEffect(() => {
        let timer;
        if (!isPaused && testStarted && questions.length > 0) {
            timer = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        handleSubmit();
                        return 0;
                    }
                    return prev - 1;
                });

                // Update time spent on the current question
                updateExamState({
                    timeSpent: Object.assign([], timeSpent, {
                        [currentQuestionIndex]: (timeSpent[currentQuestionIndex] || 0) + 1
                    })
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [isPaused, testStarted, questions, currentQuestionIndex, timeSpent, updateExamState]);

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const currentQuestion = questions[currentQuestionIndex];

    const handleOptionSelect = (optionIndex) => {
        const newAnswers = { ...answers, [currentQuestionIndex]: optionIndex };
        updateExamState({ answers: newAnswers });
    };

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            updateExamState({ currentQuestionIndex: currentQuestionIndex + 1 });
        }
    };

    const handleReviewAndNext = () => {
        const newReview = new Set(markedForReview || []);
        if (newReview.has(currentQuestionIndex)) {
            newReview.delete(currentQuestionIndex);
        } else {
            newReview.add(currentQuestionIndex);
        }
        updateExamState({ markedForReview: Array.from(newReview) });
        handleNext();
    };

    const handlePrev = () => {
        if (currentQuestionIndex > 0) {
            updateExamState({ currentQuestionIndex: currentQuestionIndex - 1 });
        }
    };

    const jumpToQuestion = (index) => {
        updateExamState({ currentQuestionIndex: index });
        if (window.innerWidth < 768) {
            setShowPalette(false);
        }
    };

    const handlePartialSubmit = () => {
        let score = 0;
        let attempted = Object.keys(answers).length;
        Object.keys(answers).forEach((qIndex) => {
            if (answers[qIndex] === questions[qIndex].correctAnswer) {
                score += 1;
            }
        });
        alert(`Mid-way Progress check:\n\nYou have answered ${attempted} out of ${questions.length} questions.\nYour current score is ${score}/${questions.length}.\n\nYou can keep going!`);
    };

    const handleSubmit = () => {
        let score = 0;
        Object.keys(answers).forEach((qIndex) => {
            if (answers[qIndex] === questions[qIndex].correctAnswer) {
                score += 1;
            }
        });

        if (window.confirm("Are you sure you want to completely finish and submit the test?")) {
            navigate('/results');
        }
    };

    if (!testStarted || !currentQuestion) return null;

    return (
        <div className="test-layout">
            {/* Top Header */}
            <header className="test-header glass">
                <div className="exam-info">
                    <h2>{examType.toUpperCase()} Mock Test</h2>
                    <span className="format-badge">{testFormat.replace('-', ' ')}</span>
                </div>

                <div className="header-controls">
                    <button
                        className="btn btn-ghost btn-sm pause-btn"
                        onClick={() => setIsPaused(!isPaused)}
                        title={isPaused ? "Resume Test" : "Pause Test"}
                    >
                        {isPaused ? <Play size={20} /> : <Pause size={20} />}
                    </button>

                    <div className={`timer-container ${!isPaused && timeLeft < 300 ? 'animate-pulse text-danger' : ''}`}>
                        <Clock size={20} className="timer-icon" />
                        <span className="time-left">{formatTime(timeLeft)}</span>
                    </div>

                    <button
                        className="mobile-palette-toggle btn btn-ghost btn-sm"
                        onClick={() => setShowPalette(!showPalette)}
                    >
                        <List size={20} />
                    </button>
                </div>
            </header>

            <div className={`test-content ${isPaused ? 'paused' : ''}`}>
                {/* Blur Overlay when Paused */}
                {isPaused && (
                    <div className="pause-overlay">
                        <div className="pause-modal glass">
                            <Pause size={48} className="pause-icon" />
                            <h2>Test Paused</h2>
                            <p>Your timer is stopped and the screen is hidden.</p>
                            <Button variant="primary" onClick={() => setIsPaused(false)}>Resume Test</Button>
                        </div>
                    </div>
                )}

                {/* Main Question Area */}
                <main className="question-area">
                    <Card className="question-card animate-fade-in" key={currentQuestionIndex}>
                        <div className="question-meta">
                            <span className="q-number">Question {currentQuestionIndex + 1} of {questions.length}</span>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <span className="q-tag" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <Clock size={14} /> {formatTime(timeSpent[currentQuestionIndex] || 0)}
                                </span>
                                {currentQuestion.subject && <span className="q-tag">{currentQuestion.subject}</span>}
                            </div>
                        </div>

                        <h3 className="question-text">{currentQuestion.text}</h3>

                        <div className="options-list">
                            {currentQuestion.options.map((option, idx) => (
                                <button
                                    key={idx}
                                    className={`option-item ${answers[currentQuestionIndex] === idx ? 'selected' : ''}`}
                                    onClick={() => handleOptionSelect(idx)}
                                >
                                    <div className="option-marker">
                                        {String.fromCharCode(65 + idx)}
                                    </div>
                                    <div className="option-content">{option}</div>
                                    {answers[currentQuestionIndex] === idx && (
                                        <CheckCircle className="option-check" size={20} />
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="test-actions">
                            <Button
                                variant="outline"
                                onClick={handlePrev}
                                disabled={currentQuestionIndex === 0}
                            >
                                <ChevronLeft size={20} /> Previous
                            </Button>

                            <Button
                                variant={markedForReview?.includes(currentQuestionIndex) ? 'solid' : 'outline'}
                                onClick={handleReviewAndNext}
                                className={markedForReview?.includes(currentQuestionIndex) ? 'bg-amber-600 text-white border-amber-600 hover:bg-amber-700' : 'text-amber-500 border-amber-500 hover:bg-amber-500/10'}
                            >
                                <Bookmark size={20} /> {markedForReview?.includes(currentQuestionIndex) ? 'Unmark Review' : 'Mark for Review'}
                            </Button>

                            <div className="right-actions">
                                {currentQuestionIndex === questions.length - 1 ? (
                                    <Button variant="primary" onClick={handleSubmit}>
                                        Submit Test
                                    </Button>
                                ) : (
                                    <Button variant="primary" onClick={handleNext}>
                                        Next <ChevronRight size={20} />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </Card>
                </main>

                {/* Sidebar / Question Palette */}
                <aside className={`palette-sidebar glass ${showPalette ? 'show' : ''}`}>
                    <div className="palette-header">
                        <h3>Question Palette</h3>
                        <div className="palette-stats">
                            <div className="stat">
                                <span className="dot answered"></span> {Object.keys(answers).length} Answered
                            </div>
                            <div className="stat">
                                <span className="dot unattempted"></span> {questions.length - Object.keys(answers).length} Unattempted
                            </div>
                        </div>
                        <div className="palette-stats" style={{ marginTop: '0.5rem' }}>
                            <div className="stat">
                                <span className="dot" style={{ backgroundColor: '#f59e0b' }}></span> {markedForReview?.length || 0} Review
                            </div>
                        </div>
                    </div>

                    <div className="palette-grid">
                        {questions.map((_, idx) => (
                            <button
                                key={idx}
                                className={`palette-btn 
                  ${currentQuestionIndex === idx ? 'current' : ''} 
                  ${answers[idx] !== undefined ? 'answered' : ''}
                  ${markedForReview?.includes(idx) ? 'review' : ''}
                `}
                                onClick={() => jumpToQuestion(idx)}
                            >
                                {idx + 1}
                            </button>
                        ))}
                    </div>

                    <div className="palette-footer">
                        <Button variant="outline" className="w-full partial-submit-btn" onClick={handlePartialSubmit}>
                            <SaveAll size={16} style={{ marginRight: '0.5rem' }} /> Progress Check
                        </Button>
                        <Button variant="primary" className="w-full" onClick={handleSubmit} style={{ marginTop: '0.75rem' }}>
                            Submit Final Test
                        </Button>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default Test;
