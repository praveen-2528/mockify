import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExam } from '../context/ExamContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { CheckCircle, XCircle, ChevronLeft, Award, Clock } from 'lucide-react';
import './Results.css';

const Results = () => {
    const { questions, answers, resetExam, testStarted, timeSpent } = useExam();
    const navigate = useNavigate();

    const formatTime = (seconds) => {
        if (!seconds) return '00:00';
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        if (!testStarted || questions.length === 0) {
            navigate('/');
        }
    }, [testStarted, questions, navigate]);

    if (!testStarted || questions.length === 0) return null;

    let score = 0;
    let attempted = Object.keys(answers).length;
    let correct = 0;
    let incorrect = 0;

    Object.keys(answers).forEach((qIndex) => {
        if (answers[qIndex] === questions[qIndex].correctAnswer) {
            score += 1;
            correct += 1;
        } else {
            incorrect += 1;
        }
    });

    const unattempted = questions.length - attempted;
    const percentage = ((score / questions.length) * 100).toFixed(1);

    const handleBackHome = () => {
        resetExam();
        navigate('/');
    };

    return (
        <div className="results-container animate-fade-in">
            <header className="results-header glass">
                <div className="header-content">
                    <Award size={28} className="text-primary" />
                    <h2>Test Results Summary</h2>
                </div>
                <Button variant="outline" onClick={handleBackHome}>
                    <ChevronLeft size={16} /> New Test
                </Button>
            </header>

            <main className="results-content">
                <Card className="score-card glass">
                    <div className="score-circle">
                        <div className="score-value">{score}<span>/{questions.length}</span></div>
                        <div className="score-percentage">{percentage}%</div>
                    </div>

                    <div className="score-stats">
                        <div className="stat-box">
                            <span className="stat-label">Attempted</span>
                            <span className="stat-value text-blue-400">{attempted}</span>
                        </div>
                        <div className="stat-box">
                            <span className="stat-label">Correct</span>
                            <span className="stat-value text-success">{correct}</span>
                        </div>
                        <div className="stat-box">
                            <span className="stat-label">Incorrect</span>
                            <span className="stat-value text-danger">{incorrect}</span>
                        </div>
                        <div className="stat-box">
                            <span className="stat-label">Skipped</span>
                            <span className="stat-value text-slate-400">{unattempted}</span>
                        </div>
                    </div>
                </Card>

                <div className="detailed-review">
                    <h3 className="review-title">Detailed Validations & Explanations</h3>

                    {questions.map((q, idx) => {
                        const userAnswer = answers[idx];
                        const isCorrect = userAnswer === q.correctAnswer;
                        const isAttempted = userAnswer !== undefined;

                        return (
                            <Card key={idx} className={`review-card ${isAttempted ? (isCorrect ? 'correct-border' : 'incorrect-border') : 'skipped-border'}`}>
                                <div className="review-q-header">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <span className="q-number">Question {idx + 1}</span>
                                        <span className="q-time text-slate-400" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem' }}>
                                            <Clock size={14} /> {formatTime(timeSpent?.[idx] || 0)}
                                        </span>
                                    </div>
                                    <div className="q-status">
                                        {!isAttempted && <span className="status-badge skipped">Skipped</span>}
                                        {isAttempted && isCorrect && <span className="status-badge correct"><CheckCircle size={14} /> Correct</span>}
                                        {isAttempted && !isCorrect && <span className="status-badge incorrect"><XCircle size={14} /> Incorrect</span>}
                                    </div>
                                </div>
                                <h4 className="review-q-text">{q.text}</h4>

                                <div className="review-options">
                                    {q.options.map((opt, optIdx) => {
                                        let optClass = "review-opt ";
                                        if (optIdx === q.correctAnswer) optClass += "is-correct";
                                        else if (userAnswer === optIdx) optClass += "is-wrong";

                                        return (
                                            <div key={optIdx} className={optClass}>
                                                <span className="opt-letter">{String.fromCharCode(65 + optIdx)}</span>
                                                <span className="opt-text">{opt}</span>
                                                {optIdx === q.correctAnswer && <CheckCircle className="opt-icon success" size={16} />}
                                                {userAnswer === optIdx && !isCorrect && <XCircle className="opt-icon danger" size={16} />}
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="explanation-box">
                                    <h5>Explanation</h5>
                                    <p>{q.explanation}</p>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </main>
        </div>
    );
};

export default Results;
