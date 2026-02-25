import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExam } from '../context/ExamContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { BookOpen, GraduationCap, Upload, FileJson, AlertCircle } from 'lucide-react';
import './Setup.css';

const Setup = () => {
    const { examType, testFormat, updateExamState } = useExam();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [jsonInput, setJsonInput] = useState('');
    const [error, setError] = useState('');

    const handleExamTypeSelect = (type) => {
        updateExamState({ examType: type });
        setStep(2);
    };

    const handleFormatSelect = (format) => {
        updateExamState({ testFormat: format });
        setStep(3);
    };

    const validateAndStart = () => {
        setError('');
        let parsedData;

        try {
            parsedData = JSON.parse(jsonInput);

            let questionsArray = Array.isArray(parsedData) ? parsedData : null;
            if (!questionsArray && typeof parsedData === 'object' && parsedData !== null) {
                if (Array.isArray(parsedData.questions)) {
                    questionsArray = parsedData.questions;
                } else if (Array.isArray(parsedData.data)) {
                    questionsArray = parsedData.data;
                } else {
                    // Find first value that's an array
                    questionsArray = Object.values(parsedData).find(val => Array.isArray(val));
                }
            }

            if (!questionsArray || !Array.isArray(questionsArray)) {
                throw new Error("Data must be an array of questions, or an object containing an array.");
            }
            if (questionsArray.length === 0) {
                throw new Error("No questions found in data.");
            }

            // Validate based on exam type
            const requiredOptions = examType === 'ssc' ? 4 : 5;

            const formattedData = questionsArray.map((q, i) => {
                if (!q.options || Object.keys(q.options).length !== requiredOptions) {
                    throw new Error(`Question ${i + 1} must have exactly ${requiredOptions} options for ${examType.toUpperCase()} exam.`);
                }

                // Convert options object to array A, B, C, D
                const optionKeys = Object.keys(q.options).sort();
                const optionsArray = optionKeys.map(key => q.options[key]);

                // Find correct answer index
                if (!q.correct_option || !optionKeys.includes(q.correct_option)) {
                    throw new Error(`Question ${i + 1} has an invalid or missing correct_option.`);
                }

                const correctIndex = optionKeys.indexOf(q.correct_option);

                return {
                    id: q.id || i,
                    text: q.question,
                    options: optionsArray,
                    correctAnswer: correctIndex,
                    subject: q.subtopic || q.difficulty,
                    explanation: q.explanation || "No explanation provided for this question."
                };
            });

            // Fisher-Yates Shuffle Algorithm to randomize questions
            for (let i = formattedData.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [formattedData[i], formattedData[j]] = [formattedData[j], formattedData[i]];
            }

            updateExamState({ questions: formattedData, testStarted: true });
            navigate('/test');

        } catch (err) {
            setError(err.message);
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setJsonInput(e.target.result);
            };
            reader.readAsText(file);
        }
    };

    return (
        <div className="setup-container animate-fade-in">
            <div className="setup-header">
                <h1>Mockify</h1>
                <p>Configure your practice session</p>
            </div>

            <Card className="setup-card">
                {/* Step Indicators */}
                <div className="steps-indicator">
                    <div className={`step ${step >= 1 ? 'active' : ''}`}>1. Exam</div>
                    <div className="step-line"></div>
                    <div className={`step ${step >= 2 ? 'active' : ''}`}>2. Format</div>
                    <div className="step-line"></div>
                    <div className={`step ${step >= 3 ? 'active' : ''}`}>3. Data</div>
                </div>

                {/* Step 1: Exam Type */}
                {step === 1 && (
                    <div className="step-content animate-fade-in">
                        <h2>Select Exam Type</h2>
                        <div className="options-grid">
                            <button
                                className={`option-btn ${examType === 'ssc' ? 'selected' : ''}`}
                                onClick={() => handleExamTypeSelect('ssc')}
                            >
                                <div className="option-icon"><BookOpen size={32} /></div>
                                <h3>SSC Exam</h3>
                                <p>4 Options per Question</p>
                            </button>

                            <button
                                className={`option-btn ${examType === 'ibps' ? 'selected' : ''}`}
                                onClick={() => handleExamTypeSelect('ibps')}
                            >
                                <div className="option-icon"><GraduationCap size={32} /></div>
                                <h3>IBPS Banking</h3>
                                <p>5 Options per Question</p>
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Test Format */}
                {step === 2 && (
                    <div className="step-content animate-fade-in">
                        <h2>Select Test Format</h2>
                        <div className="options-grid format-grid">
                            <button onClick={() => handleFormatSelect('full')} className="option-btn">
                                <h3>Full Mock</h3>
                            </button>
                            <button onClick={() => handleFormatSelect('subject')} className="option-btn">
                                <h3>Subject Wise</h3>
                            </button>
                            <button onClick={() => handleFormatSelect('topic')} className="option-btn">
                                <h3>Topic Wise</h3>
                            </button>
                        </div>
                        <div className="step-actions">
                            <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                        </div>
                    </div>
                )}

                {/* Step 3: Data Upload */}
                {step === 3 && (
                    <div className="step-content animate-fade-in">
                        <h2>Upload Questions Data</h2>
                        <p className="data-requirement">
                            Required: JSON format with {examType === 'ssc' ? '4' : '5'} options per question.
                        </p>

                        <div className="data-input-area">
                            <div className="upload-section">
                                <input
                                    type="file"
                                    id="json-upload"
                                    accept=".json"
                                    style={{ display: 'none' }}
                                    onChange={handleFileUpload}
                                />
                                <label htmlFor="json-upload" className="upload-label">
                                    <Upload size={24} />
                                    <span>Upload questions.json</span>
                                </label>
                            </div>

                            <div className="divider"><span>OR</span></div>

                            <div className="paste-section">
                                <div className="paste-header">
                                    <FileJson size={18} />
                                    <span>Paste JSON Data</span>
                                </div>
                                <textarea
                                    className="json-textarea"
                                    value={jsonInput}
                                    onChange={(e) => setJsonInput(e.target.value)}
                                    placeholder="[{&#34;text&#34;: &#34;Question?&#34;, &#34;options&#34;: [...], &#34;correctAnswer&#34;: 0}]"
                                ></textarea>
                            </div>
                        </div>

                        {error && (
                            <div className="error-message">
                                <AlertCircle size={16} />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="step-actions split">
                            <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
                            <Button
                                variant="primary"
                                onClick={validateAndStart}
                                disabled={!jsonInput.trim()}
                            >
                                Start Test
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default Setup;
