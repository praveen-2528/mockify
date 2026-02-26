import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useExam } from '../context/ExamContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { ChevronLeft, Plus, Upload, Search, Trash2, Edit3, Play, FileJson, CheckCircle, X, BookOpen } from 'lucide-react';
import './QuestionBank.css';

const QuestionBank = () => {
    const navigate = useNavigate();
    const { authFetch } = useAuth();
    const { updateExamState } = useExam();

    const [questions, setQuestions] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [total, setTotal] = useState(0);
    const [filterSubject, setFilterSubject] = useState('');
    const [searchText, setSearchText] = useState('');
    const [loading, setLoading] = useState(true);

    // Add/Edit modal
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState({ text: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '', subject: '', subtopic: '', difficulty: 'medium' });

    // Bulk import
    const [showImport, setShowImport] = useState(false);
    const [jsonInput, setJsonInput] = useState('');
    const [importMsg, setImportMsg] = useState('');

    // Generate test
    const [showGenerate, setShowGenerate] = useState(false);
    const [genSubject, setGenSubject] = useState('all');
    const [genCount, setGenCount] = useState(25);

    const fetchQuestions = useCallback(async () => {
        const params = new URLSearchParams();
        if (filterSubject) params.set('subject', filterSubject);
        if (searchText) params.set('search', searchText);

        const res = await authFetch(`/api/questions?${params}`);
        const data = await res.json();
        setQuestions(data.questions || []);
        setSubjects(data.subjects || []);
        setTotal(data.total || 0);
        setLoading(false);
    }, [authFetch, filterSubject, searchText]);

    useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

    // Add / Edit
    const handleSave = async () => {
        if (!form.text.trim() || form.options.some(o => !o.trim())) return;

        if (editId) {
            await authFetch(`/api/questions/${editId}`, { method: 'PUT', body: JSON.stringify(form) });
        } else {
            await authFetch('/api/questions', { method: 'POST', body: JSON.stringify(form) });
        }
        setShowForm(false);
        setEditId(null);
        setForm({ text: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '', subject: '', subtopic: '', difficulty: 'medium' });
        fetchQuestions();
    };

    const handleEdit = (q) => {
        setEditId(q.id);
        setForm({ text: q.text, options: [...q.options], correctAnswer: q.correctAnswer, explanation: q.explanation || '', subject: q.subject || '', subtopic: q.subtopic || '', difficulty: q.difficulty || 'medium' });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this question?')) return;
        await authFetch(`/api/questions/${id}`, { method: 'DELETE' });
        fetchQuestions();
    };

    // Bulk Import
    const handleBulkImport = async () => {
        setImportMsg('');
        try {
            const parsed = JSON.parse(jsonInput);
            const arr = Array.isArray(parsed) ? parsed : parsed.questions || [parsed];
            const res = await authFetch('/api/questions/bulk', { method: 'POST', body: JSON.stringify({ questions: arr }) });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setImportMsg(`✅ Imported ${data.imported} questions!`);
            setJsonInput('');
            fetchQuestions();
        } catch (err) {
            setImportMsg(`❌ ${err.message}`);
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => setJsonInput(ev.target.result);
            reader.readAsText(file);
        }
    };

    // Generate Test
    const handleGenerate = async () => {
        try {
            const res = await authFetch('/api/questions/generate', {
                method: 'POST',
                body: JSON.stringify({ subject: genSubject, count: genCount }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            updateExamState({
                questions: data.questions,
                testStarted: true,
                currentQuestionIndex: 0,
                answers: {},
                markedForReview: {},
                timeSpent: new Array(data.questions.length).fill(0),
                isMultiplayer: false,
            });
            navigate('/test');
        } catch (err) {
            alert(err.message);
        }
    };

    if (loading) {
        return <div className="qbank-container"><div className="loading-screen"><div className="loading-spinner" /></div></div>;
    }

    return (
        <div className="qbank-container animate-fade-in">
            <div className="qbank-header">
                <h1>📚 Question Bank</h1>
                <p>{total} questions in your bank</p>
            </div>

            {/* Action Bar */}
            <div className="qbank-actions">
                <Button variant="primary" onClick={() => { setEditId(null); setForm({ text: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '', subject: '', subtopic: '', difficulty: 'medium' }); setShowForm(true); }}>
                    <Plus size={16} /> Add Question
                </Button>
                <Button variant="outline" onClick={() => setShowImport(!showImport)}>
                    <Upload size={16} /> Import JSON
                </Button>
                <Button variant="outline" onClick={() => setShowGenerate(!showGenerate)} disabled={total === 0}>
                    <Play size={16} /> Generate Test
                </Button>
            </div>

            {/* Bulk Import Panel */}
            {showImport && (
                <Card className="import-panel glass animate-fade-in">
                    <h3><FileJson size={18} /> Bulk Import</h3>
                    <textarea
                        rows={6}
                        placeholder='Paste JSON array of questions...'
                        value={jsonInput}
                        onChange={e => setJsonInput(e.target.value)}
                    />
                    <div className="import-row">
                        <label className="file-upload-btn">
                            <Upload size={14} /> Upload File
                            <input type="file" accept=".json" onChange={handleFileUpload} hidden />
                        </label>
                        <Button variant="primary" onClick={handleBulkImport} disabled={!jsonInput.trim()}>Import</Button>
                    </div>
                    {importMsg && <div className="import-msg">{importMsg}</div>}
                </Card>
            )}

            {/* Generate Test Panel */}
            {showGenerate && (
                <Card className="generate-panel glass animate-fade-in">
                    <h3><Play size={18} /> Generate Test from Bank</h3>
                    <div className="gen-row">
                        <select value={genSubject} onChange={e => setGenSubject(e.target.value)}>
                            <option value="all">All Subjects</option>
                            {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <input type="number" min={1} max={100} value={genCount} onChange={e => setGenCount(parseInt(e.target.value) || 25)} />
                        <span className="gen-label">questions</span>
                        <Button variant="primary" onClick={handleGenerate}>Start Test</Button>
                    </div>
                </Card>
            )}

            {/* Filters */}
            <div className="qbank-filters">
                <div className="search-box">
                    <Search size={16} />
                    <input
                        type="text"
                        placeholder="Search questions..."
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                    />
                </div>
                <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)}>
                    <option value="">All Subjects</option>
                    {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>

            {/* Questions List */}
            {questions.length === 0 ? (
                <Card className="empty-state glass">
                    <BookOpen size={48} className="text-secondary" />
                    <h3>No Questions Yet</h3>
                    <p>Add questions manually or import a JSON file to build your bank.</p>
                </Card>
            ) : (
                <div className="questions-list">
                    {questions.map((q, i) => (
                        <Card key={q.id} className="q-card glass">
                            <div className="q-card-header">
                                <span className="q-num">#{i + 1}</span>
                                <div className="q-tags">
                                    {q.subject && <span className="q-tag subject">{q.subject}</span>}
                                    {q.difficulty && <span className={`q-tag diff-${q.difficulty}`}>{q.difficulty}</span>}
                                </div>
                                <div className="q-actions">
                                    <button className="q-action-btn" onClick={() => handleEdit(q)}><Edit3 size={14} /></button>
                                    <button className="q-action-btn danger" onClick={() => handleDelete(q.id)}><Trash2 size={14} /></button>
                                </div>
                            </div>
                            <p className="q-text">{q.text}</p>
                            <div className="q-options">
                                {q.options.map((opt, oi) => (
                                    <div key={oi} className={`q-opt ${oi === q.correctAnswer ? 'correct' : ''}`}>
                                        <span className="opt-letter">{String.fromCharCode(65 + oi)}</span>
                                        {opt}
                                        {oi === q.correctAnswer && <CheckCircle size={14} className="correct-icon" />}
                                    </div>
                                ))}
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Add/Edit Modal */}
            {showForm && (
                <div className="modal-overlay" onClick={() => setShowForm(false)}>
                    <Card className="modal-card glass" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editId ? 'Edit Question' : 'Add Question'}</h3>
                            <button className="q-action-btn" onClick={() => setShowForm(false)}><X size={18} /></button>
                        </div>
                        <div className="modal-body">
                            <textarea
                                placeholder="Question text..."
                                rows={3}
                                value={form.text}
                                onChange={e => setForm({ ...form, text: e.target.value })}
                            />
                            {form.options.map((opt, i) => (
                                <div key={i} className="opt-input-row">
                                    <input
                                        type="radio"
                                        name="correct"
                                        checked={form.correctAnswer === i}
                                        onChange={() => setForm({ ...form, correctAnswer: i })}
                                    />
                                    <span className="opt-letter">{String.fromCharCode(65 + i)}</span>
                                    <input
                                        type="text"
                                        placeholder={`Option ${String.fromCharCode(65 + i)}`}
                                        value={opt}
                                        onChange={e => {
                                            const opts = [...form.options];
                                            opts[i] = e.target.value;
                                            setForm({ ...form, options: opts });
                                        }}
                                    />
                                </div>
                            ))}
                            <input type="text" placeholder="Explanation (optional)" value={form.explanation} onChange={e => setForm({ ...form, explanation: e.target.value })} />
                            <div className="form-row">
                                <input type="text" placeholder="Subject" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
                                <input type="text" placeholder="Subtopic" value={form.subtopic} onChange={e => setForm({ ...form, subtopic: e.target.value })} />
                                <select value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })}>
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                </select>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
                            <Button variant="primary" onClick={handleSave}>
                                {editId ? 'Save Changes' : 'Add Question'}
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

            <div className="qbank-back">
                <Button variant="ghost" onClick={() => navigate('/')}><ChevronLeft size={16} /> Back</Button>
            </div>
        </div>
    );
};

export default QuestionBank;
