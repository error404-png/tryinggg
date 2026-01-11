import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, ArrowLeft, Loader2 } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';

const AgentInterface = () => {
    const { agentId } = useParams();
    const navigate = useNavigate();
    const [agent, setAgent] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        fetchAgent();
    }, [agentId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchAgent = async () => {
        try {
            const response = await api.get(`/agents/${agentId}`);
            setAgent(response.data);
        } catch (error) {
            console.error("Failed to fetch agent", error);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await api.post(`/agents/${agentId}/chat`, { query: userMessage.content });
            const aiMessage = { role: 'assistant', content: response.data.response };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error("Failed to send message", error);
            setMessages(prev => [...prev, { role: 'assistant', content: "Error: Failed to get response from agent." }]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!agent) return <div className="p-10 text-center">Loading Agent...</div>;

    return (
        <div className="flex-1 flex flex-col h-full bg-[var(--bg-primary)] overflow-hidden">
            {/* Header */}
            <div className="border-b border-[var(--border-color)] p-4 flex items-center gap-4 bg-[var(--bg-secondary)]">
                <button
                    onClick={() => navigate('/agent-store')}
                    className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-[var(--text-secondary)]" />
                </button>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] flex items-center justify-center">
                        <Bot className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="font-bold text-[var(--text-primary)]">{agent.name}</h2>
                        <p className="text-xs text-[var(--text-secondary)]">{agent.type} Agent</p>
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {messages.length === 0 && (
                    <div className="text-center text-[var(--text-secondary)] mt-10 opacity-70">
                        <p>Start a conversation with {agent.name}.</p>
                    </div>
                )}

                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                        <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 
                            ${msg.role === 'user'
                                    ? 'bg-[var(--accent-primary)] text-white'
                                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border-color)]'
                                }`}
                        >
                            {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                        </div>
                        <div
                            className={`rounded-2xl px-5 py-3 max-w-[80%] 
                            ${msg.role === 'user'
                                    ? 'bg-[var(--accent-primary)] text-white rounded-br-none'
                                    : 'bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-bl-none'
                                }`}
                        >
                            <div className="whitespace-pre-wrap">{msg.content}</div>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] flex items-center justify-center flex-shrink-0">
                            <Bot className="w-5 h-5 text-[var(--text-secondary)]" />
                        </div>
                        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl px-5 py-3 rounded-bl-none flex items-center">
                            <Loader2 className="w-4 h-4 animate-spin text-[var(--text-secondary)]" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]">
                <form onSubmit={handleSend} className="max-w-4xl mx-auto relative flex items-center gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={`Message ${agent.name}...`}
                        className="flex-1 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none transition-colors"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-white p-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AgentInterface;
