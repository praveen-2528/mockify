import React, { useRef, useState, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Pencil, Eraser, Undo2, Redo2, Trash2, Palette, Minus, Plus, Maximize2, Minimize2, X, Eye, EyeOff } from 'lucide-react';
import './WritingPad.css';

const COLORS = ['#ffffff', '#a5b4fc', '#f87171', '#4ade80', '#facc15', '#fb923c', '#38bdf8', '#e879f9'];
const MIN_SIZE = 1;
const MAX_SIZE = 20;
const LS_KEY = 'testara_pad_strokes';

const WritingPad = forwardRef(({
    questionIndex = 0,
    isShared = false,
    socket = null,
    roomCode = null,
    playerColor = '#a5b4fc',
    playerName = '',
    onClose,
}, ref) => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [tool, setTool] = useState('pen'); // pen | eraser
    const [color, setColor] = useState('#ffffff');
    const [strokeWidth, setStrokeWidth] = useState(3);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Per-question stroke history: Map<questionIndex, { strokes: Stroke[], undone: Stroke[] }>
    const strokesRef = useRef(new Map());
    const currentPathRef = useRef([]);

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem(LS_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                const map = new Map();
                Object.entries(parsed).forEach(([k, v]) => {
                    map.set(Number(k), v);
                });
                strokesRef.current = map;
            }
        } catch { /* ignore */ }
    }, []);

    // Save to localStorage helper
    const saveToLS = useCallback(() => {
        try {
            const obj = {};
            strokesRef.current.forEach((val, key) => {
                obj[key] = val;
            });
            localStorage.setItem(LS_KEY, JSON.stringify(obj));
        } catch { /* ignore */ }
    }, []);

    // Get current question's stroke data
    const getStrokeData = useCallback(() => {
        if (!strokesRef.current.has(questionIndex)) {
            strokesRef.current.set(questionIndex, { strokes: [], undone: [] });
        }
        return strokesRef.current.get(questionIndex);
    }, [questionIndex]);

    // Redraw entire canvas from stroke history
    const redrawCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const data = getStrokeData();
        data.strokes.forEach(stroke => {
            if (stroke.points.length < 2) return;
            ctx.beginPath();
            ctx.strokeStyle = stroke.tool === 'eraser' ? '#0f172a' : stroke.color;
            ctx.lineWidth = stroke.tool === 'eraser' ? stroke.size * 3 : stroke.size;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.globalCompositeOperation = stroke.tool === 'eraser' ? 'destination-out' : 'source-over';
            ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
            for (let i = 1; i < stroke.points.length; i++) {
                ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
            }
            ctx.stroke();
        });
        ctx.globalCompositeOperation = 'source-over';
    }, [getStrokeData]);

    // Resize canvas to fit container
    const resizeCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const rect = container.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';

        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);

        redrawCanvas();
    }, [redrawCanvas]);

    // Resize on mount, fullscreen change, and question change
    useEffect(() => {
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        return () => window.removeEventListener('resize', resizeCanvas);
    }, [resizeCanvas, isFullscreen, questionIndex]);

    // Get pointer position relative to canvas
    const getPos = useCallback((e) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: clientX - rect.left,
            y: clientY - rect.top,
        };
    }, []);

    // Drawing handlers
    const startDrawing = useCallback((e) => {
        e.preventDefault();
        const pos = getPos(e);
        setIsDrawing(true);
        currentPathRef.current = [pos];

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        ctx.strokeStyle = tool === 'eraser' ? '#0f172a' : color;
        ctx.lineWidth = tool === 'eraser' ? strokeWidth * 3 : strokeWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    }, [getPos, tool, color, strokeWidth]);

    const draw = useCallback((e) => {
        if (!isDrawing) return;
        e.preventDefault();
        const pos = getPos(e);
        currentPathRef.current.push(pos);

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
    }, [isDrawing, getPos]);

    const stopDrawing = useCallback((e) => {
        if (!isDrawing) return;
        e?.preventDefault();
        setIsDrawing(false);

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.globalCompositeOperation = 'source-over';

        if (currentPathRef.current.length > 1) {
            const stroke = {
                points: [...currentPathRef.current],
                color: tool === 'eraser' ? '#0f172a' : color,
                size: strokeWidth,
                tool,
                playerId: playerName || 'local',
            };

            const data = getStrokeData();
            data.strokes.push(stroke);
            data.undone = []; // clear redo stack on new draw
            saveToLS();

            // Emit to socket if shared
            if (isShared && socket && roomCode) {
                socket.emit('padDraw', {
                    code: roomCode,
                    questionIndex,
                    stroke,
                });
            }
        }
        currentPathRef.current = [];
    }, [isDrawing, tool, color, strokeWidth, getStrokeData, saveToLS, isShared, socket, roomCode, questionIndex, playerName]);

    // Undo
    const handleUndo = useCallback(() => {
        const data = getStrokeData();
        if (data.strokes.length === 0) return;
        const last = data.strokes.pop();
        data.undone.push(last);
        saveToLS();
        redrawCanvas();

        if (isShared && socket && roomCode) {
            socket.emit('padUndo', { code: roomCode, questionIndex, playerId: playerName });
        }
    }, [getStrokeData, saveToLS, redrawCanvas, isShared, socket, roomCode, questionIndex, playerName]);

    // Redo
    const handleRedo = useCallback(() => {
        const data = getStrokeData();
        if (data.undone.length === 0) return;
        const stroke = data.undone.pop();
        data.strokes.push(stroke);
        saveToLS();
        redrawCanvas();
    }, [getStrokeData, saveToLS, redrawCanvas]);

    // Clear
    const handleClear = useCallback(() => {
        const data = getStrokeData();
        data.strokes = [];
        data.undone = [];
        saveToLS();
        redrawCanvas();

        if (isShared && socket && roomCode) {
            socket.emit('padClear', { code: roomCode, questionIndex, playerId: playerName });
        }
    }, [getStrokeData, saveToLS, redrawCanvas, isShared, socket, roomCode, questionIndex, playerName]);

    // Listen for remote strokes (shared mode)
    useEffect(() => {
        if (!isShared || !socket) return;

        const onRemoteDraw = ({ questionIndex: qi, stroke }) => {
            if (qi !== questionIndex) return;
            const data = getStrokeData();
            data.strokes.push(stroke);
            redrawCanvas();
        };

        const onRemoteClear = ({ questionIndex: qi }) => {
            if (qi !== questionIndex) return;
            const data = getStrokeData();
            data.strokes = [];
            data.undone = [];
            redrawCanvas();
        };

        const onRemoteUndo = ({ questionIndex: qi, playerId }) => {
            if (qi !== questionIndex) return;
            const data = getStrokeData();
            // Remove last stroke by this player
            for (let i = data.strokes.length - 1; i >= 0; i--) {
                if (data.strokes[i].playerId === playerId) {
                    data.strokes.splice(i, 1);
                    break;
                }
            }
            redrawCanvas();
        };

        socket.on('padDraw', onRemoteDraw);
        socket.on('padClear', onRemoteClear);
        socket.on('padUndo', onRemoteUndo);

        return () => {
            socket.off('padDraw', onRemoteDraw);
            socket.off('padClear', onRemoteClear);
            socket.off('padUndo', onRemoteUndo);
        };
    }, [isShared, socket, questionIndex, getStrokeData, redrawCanvas]);

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
        clear: handleClear,
        undo: handleUndo,
        redo: handleRedo,
    }));

    return (
        <div className={`writing-pad ${isFullscreen ? 'fullscreen' : ''}`}>
            {/* Toolbar */}
            <div className="wp-toolbar">
                <div className="wp-tools-left">
                    <button
                        className={`wp-tool-btn ${tool === 'pen' ? 'active' : ''}`}
                        onClick={() => setTool('pen')}
                        title="Pen"
                    >
                        <Pencil size={16} />
                    </button>
                    <button
                        className={`wp-tool-btn ${tool === 'eraser' ? 'active' : ''}`}
                        onClick={() => setTool('eraser')}
                        title="Eraser"
                    >
                        <Eraser size={16} />
                    </button>

                    <div className="wp-separator" />

                    <button className="wp-tool-btn" onClick={handleUndo} title="Undo">
                        <Undo2 size={16} />
                    </button>
                    <button className="wp-tool-btn" onClick={handleRedo} title="Redo">
                        <Redo2 size={16} />
                    </button>
                    <button className="wp-tool-btn danger" onClick={handleClear} title="Clear All">
                        <Trash2 size={16} />
                    </button>

                    <div className="wp-separator" />

                    {/* Color picker */}
                    <div className="wp-color-group">
                        <button
                            className="wp-tool-btn wp-color-btn"
                            onClick={() => setShowColorPicker(!showColorPicker)}
                            title="Color"
                        >
                            <div className="wp-color-swatch" style={{ backgroundColor: color }} />
                        </button>
                        {showColorPicker && (
                            <div className="wp-color-picker animate-fade-in">
                                {COLORS.map(c => (
                                    <button
                                        key={c}
                                        className={`wp-color-opt ${color === c ? 'active' : ''}`}
                                        style={{ backgroundColor: c }}
                                        onClick={() => { setColor(c); setShowColorPicker(false); }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Stroke size */}
                    <div className="wp-size-group">
                        <button
                            className="wp-tool-btn"
                            onClick={() => setStrokeWidth(Math.max(MIN_SIZE, strokeWidth - 1))}
                            title="Thinner"
                        >
                            <Minus size={14} />
                        </button>
                        <span className="wp-size-label">{strokeWidth}px</span>
                        <button
                            className="wp-tool-btn"
                            onClick={() => setStrokeWidth(Math.min(MAX_SIZE, strokeWidth + 1))}
                            title="Thicker"
                        >
                            <Plus size={14} />
                        </button>
                    </div>
                </div>

                <div className="wp-tools-right">
                    {isShared && (
                        <span className="wp-shared-badge">
                            <Eye size={12} /> Shared
                        </span>
                    )}
                    <button
                        className="wp-tool-btn"
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                    >
                        {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                    </button>
                    {onClose && (
                        <button className="wp-tool-btn danger" onClick={onClose} title="Close">
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* Canvas */}
            <div className="wp-canvas-container" ref={containerRef}>
                <canvas
                    ref={canvasRef}
                    className="wp-canvas"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                />
            </div>
        </div>
    );
});

WritingPad.displayName = 'WritingPad';
export default WritingPad;
