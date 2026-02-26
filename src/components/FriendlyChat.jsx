import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X, ChevronUp } from 'lucide-react';
import './FriendlyChat.css';

const FriendlyChat = ({ socket, roomCode, displayName }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [unread, setUnread] = useState(0);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (!socket) return;

        const onChatMessage = (msg) => {
            setMessages(prev => [...prev, msg]);
            if (!isOpen) setUnread(prev => prev + 1);
        };

        socket.on('chatMessage', onChatMessage);
        return () => socket.off('chatMessage', onChatMessage);
    }, [socket, isOpen]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = () => {
        const text = input.trim();
        if (!text || !socket) return;

        socket.emit('chatSend', { code: roomCode, text });
        setInput('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const toggleOpen = () => {
        setIsOpen(!isOpen);
        if (!isOpen) setUnread(0);
    };

    return (
        <div className={`friendly-chat ${isOpen ? 'open' : ''}`}>
            {/* Toggle Button */}
            <button className="chat-toggle" onClick={toggleOpen}>
                {isOpen ? <X size={18} /> : <MessageCircle size={18} />}
                {!isOpen && unread > 0 && <span className="unread-badge">{unread}</span>}
                {!isOpen && <span className="chat-toggle-label">Chat</span>}
            </button>

            {/* Chat Panel */}
            {isOpen && (
                <div className="chat-panel glass animate-fade-in">
                    <div className="chat-header">
                        <MessageCircle size={16} />
                        <span>Room Chat</span>
                    </div>

                    <div className="chat-messages">
                        {messages.length === 0 && (
                            <div className="chat-empty">No messages yet. Say hi! 👋</div>
                        )}
                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                className={`chat-msg ${msg.sender === displayName ? 'mine' : ''}`}
                            >
                                {msg.sender !== displayName && (
                                    <span className="msg-sender">{msg.sender}</span>
                                )}
                                <span className="msg-text">{msg.text}</span>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="chat-input-row">
                        <input
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type a message..."
                            maxLength={200}
                        />
                        <button className="send-btn" onClick={handleSend} disabled={!input.trim()}>
                            <Send size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FriendlyChat;
