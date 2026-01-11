import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Bot, User, Loader2, Plus, X, ArrowRight, FileText, Settings, ChevronRight } from 'lucide-react';
import { useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';
import { useAuth } from '../context/AuthContext';

// Logos (Keeping existing)
import LogoGeneral from '../assets/agent_logo_general.png';
import LogoDocument from '../assets/agent_logo_document.png';
import LogoCode from '../assets/agent_logo_code.png';

const getAgentLogo = (type) => {
    if ((type || "").toLowerCase().includes('document') || (type || "").toLowerCase().includes('rag')) return LogoDocument;
    if ((type || "").toLowerCase().includes('code')) return LogoCode;
    return LogoGeneral;
};

const ChatInterface = () => {
    const { projectId } = useParams();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { isAdmin } = useAuth();

    // Chain State
    const [chain, setChain] = useState([]);
    const [isAgentDrawerOpen, setIsAgentDrawerOpen] = useState(false);
    const [availableAgents, setAvailableAgents] = useState([]);
    const [activeAgentIndex, setActiveAgentIndex] = useState(null); // For editing context/files

    // Refs
    const messagesEndRef = useRef(null);
    const fileInputRefs = useRef({});

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const [searchParams] = useSearchParams();
    const activeAgentId = searchParams.get('agent');
    const [projectConfig, setProjectConfig] = useState(null);

    useEffect(() => {
        const fetchProjectAndHistory = async () => {
            if (!projectId) return;
            try {
                // 1. Fetch Project Config first to know what's possible
                const projectRes = await api.get(`/projects/${projectId}`);
                setProjectConfig(projectRes.data);
                const projectChain = projectRes.data.chain_config || [];

                // 2. Fetch History
                const historyRes = await api.get(`/projects/${projectId}/chat`);
                let historyChain = historyRes.data.chain || [];

                if (historyRes.data.messages) {
                    setMessages(historyRes.data.messages);
                } else if (Array.isArray(historyRes.data)) {
                    setMessages(historyRes.data);
                }

                // 3. Determine Chain based on URL and Project Defaults
                if (activeAgentId) {
                    // Logic: If URL tells us to use specific agent, we find it in the project config
                    // We prioritize project config over history for this "mode"
                    const foundInChain = projectChain.find(c => c.agent_id === activeAgentId);

                    if (foundInChain) {
                        setChain([foundInChain]);
                    } else {
                        // Fallback: maybe it's a legacy agent list?
                        if (projectRes.data.agents && projectRes.data.agents.includes(activeAgentId)) {
                            // Need to fetch agent details or stub it? 
                            // We update availableAgents later, let's wait or stub
                            // For now, let's just warn or default
                            console.warn("Agent found in legacy list but not chain config");
                            setChain([{ agent_id: activeAgentId, name: "Loading...", type: "general" }]);
                        }
                    }
                } else {
                    // No specific agent selected -> Use history or Project Default
                    if (historyChain.length > 0) {
                        setChain(historyChain);
                    } else {
                        setChain(projectChain);
                    }
                }

            } catch (error) {
                console.error("Failed to fetch project/chat data", error);
            }
        };
        fetchProjectAndHistory();
    }, [projectId, activeAgentId]); // Re-run if ID or URL param changes

    useEffect(() => {
        const fetchAgents = async () => {
            try {
                const response = await api.get('/agents');
                setAvailableAgents(response.data);
            } catch (error) {
                console.error("Failed to fetch agents", error);
            }
        };
        fetchAgents();
    }, []);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const chainConfig = chain.map(c => ({
                agent_id: c.agent_id,
                name: c.name,
                type: c.type,
                context: c.context,
                files: c.files
            }));

            const response = await api.post(`/projects/${projectId}/chat`, {
                query: userMessage.content,
                chain: chainConfig.length > 0 ? chainConfig : null
            });

            const botMessage = {
                role: 'assistant',
                content: response.data.answer,
                sources: response.data.source_documents,
                agent_type: response.data.agent_type // Assuming backend echoes this or implies last agent
            };

            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error("Chat error", error);
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const addToChain = (agent) => {
        setChain(prev => [...prev, {
            agent_id: agent._id,
            name: agent.name,
            type: agent.type,
            context: '',
            files: []
        }]);
        // Don't close drawer immediately to allow multi-add, or close for "flying" feel?
        // Let's keep it open for flow
    };

    const removeFromChain = (index) => {
        setChain(prev => prev.filter((_, i) => i !== index));
        if (activeAgentIndex === index) setActiveAgentIndex(null);
    };

    const updateChainItem = (index, field, value) => {
        setChain(prev => {
            const newChain = [...prev];
            newChain[index][field] = value;
            return newChain;
        });
    };

    const handleFileUpload = async (index, file) => {
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);

        try {
            await api.post(`/projects/${projectId}/ingest`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setChain(prev => {
                const newChain = [...prev];
                const currentFiles = newChain[index].files || [];
                newChain[index].files = [...currentFiles, file.name];
                return newChain;
            });
        } catch (error) {
            console.error("Upload failed", error);
            alert("Failed to upload file");
        }
    };

    if (!projectId) return null;

    return (
        <div className="flex-1 flex flex-col h-full bg-[#F3F4F6] relative overflow-hidden font-sans">

            {/* Top Bar: Chain Toolbar */}
            {(isAdmin || (projectConfig && projectConfig.allow_user_chaining)) && (
                <div className="h-24 flex items-center px-6 gap-4 overflow-x-auto relative z-10">
                    {/* Glass background for toolbar */}
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-md border-b border-white/20 shadow-sm"></div>

                    {/* Toolbar Content */}
                    <div className="relative z-10 flex items-center gap-4">
                        {/* User Start Node */}
                        <div className="flex flex-col items-center gap-2 min-w-[100px] opacity-60">
                            <div className="w-32 bg-white/80 rounded-full h-10 border border-indigo-100 flex items-center justify-center text-sm font-medium text-indigo-900/60 shadow-sm backdrop-blur-sm">
                                User Input
                            </div>
                        </div>

                        <ChevronRight className="w-5 h-5 text-indigo-300" />

                        {/* Chain Nodes */}
                        <AnimatePresence>
                            {chain.map((agent, idx) => (
                                <motion.div
                                    key={`${chain.length}-${idx}`}
                                    initial={{ opacity: 0, scale: 0.8, x: -20 }}
                                    animate={{ opacity: 1, scale: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    transition={{ type: "spring", bounce: 0.5 }}
                                    className="flex items-center gap-4"
                                >
                                    <div
                                        className={`relative group w-48 bg-white/90 backdrop-blur-sm rounded-full shadow-sm border transition-all cursor-pointer flex items-center p-1.5 gap-3 hover:shadow-md hover:-translate-y-0.5 ${activeAgentIndex === idx ? 'border-primary ring-2 ring-primary/10' : 'border-white/50 hover:border-indigo-100'}`}
                                        onClick={() => setActiveAgentIndex(activeAgentIndex === idx ? null : idx)}
                                    >
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full opacity-10"></div>
                                            <img src={getAgentLogo(agent.type)} alt="icon" className="w-8 h-8 rounded-full bg-transparent relative z-10" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-bold text-gray-800 truncate">{agent.name}</div>
                                        </div>

                                        {/* Hover Actions within pill - ADMIN ONLY */}
                                        {isAdmin && activeAgentIndex === idx && (
                                            <button onClick={(e) => { e.stopPropagation(); removeFromChain(idx); }} className="p-1 hover:bg-red-50 text-red-400 rounded-full transition-colors">
                                                <X className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>

                                    {idx < chain.length && <div className="h-px w-8 bg-indigo-200/50"></div>}
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {/* Add Agent Button - ADMIN ONLY */}
                        {isAdmin && (
                            <button
                                onClick={() => setIsAgentDrawerOpen(true)}
                                className="w-10 h-10 rounded-full bg-white/50 border border-dashed border-indigo-200 flex items-center justify-center text-indigo-400 hover:text-primary hover:border-primary hover:bg-white transition-all shadow-sm"
                                title="Add Agent"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        )}

                        {isAdmin && <div className="w-px h-8 bg-indigo-200/50 mx-2"></div>}

                        {/* Apply/Save Button - ADMIN ONLY */}
                        {isAdmin && (
                            <button
                                onClick={async () => {
                                    try {
                                        const agentIds = chain.map(c => c.agent_id);
                                        const chainConfig = chain.map(c => ({
                                            agent_id: c.agent_id,
                                            name: c.name,
                                            type: c.type,
                                            context: c.context || "",
                                            files: c.files || []
                                        }));

                                        await api.put(`/projects/${projectId}`, {
                                            agents: agentIds,
                                            chain_config: chainConfig
                                        });
                                        alert("Agents applied to project successfully! Standard users will now use this chain.");
                                    } catch (e) {
                                        console.error(e);
                                        alert("Failed to apply agents.");
                                    }
                                }}
                                className="px-5 py-2 rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-sm font-medium shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all flex items-center gap-2"
                            >
                                <span className="relative z-10">Apply</span>
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Context/Config Panel for Active Agent (Slide down or overlap) - Glassmorphism */}
            <AnimatePresence>
                {activeAgentIndex !== null && chain[activeAgentIndex] && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -20, height: 0 }}
                        className="bg-white/80 backdrop-blur-xl border-b border-indigo-100 px-6 py-6 shadow-lg shadow-indigo-500/5 z-0"
                    >
                        <div className="max-w-4xl mx-auto flex gap-8">
                            <div className="flex-1">
                                <label className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2 block">Instruction Context</label>
                                <textarea
                                    value={chain[activeAgentIndex].context}
                                    onChange={(e) => updateChainItem(activeAgentIndex, 'context', e.target.value)}
                                    className="w-full bg-white/50 border border-indigo-100 rounded-xl p-3 text-sm focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-gray-400"
                                    rows={2}
                                    placeholder="Tell this agent what to do..."
                                />
                            </div>
                            <div className="w-72">
                                <label className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2 block">Knowledge Base</label>
                                <div className="mt-1 flex flex-wrap gap-2">
                                    {chain[activeAgentIndex].files.map((f, i) => (
                                        <span key={i} className="text-xs bg-white border border-indigo-100 px-3 py-1.5 rounded-lg flex items-center gap-2 group/file shadow-sm text-gray-600">
                                            <FileText className="w-3 h-3 text-indigo-400" />
                                            <span className="max-w-[100px] truncate font-medium" title={f}>{f}</span>
                                            <button
                                                onClick={() => {
                                                    setChain(prev => {
                                                        const newChain = [...prev];
                                                        newChain[activeAgentIndex].files = newChain[activeAgentIndex].files.filter((_, idx) => idx !== i);
                                                        return newChain;
                                                    });
                                                }}
                                                className="ml-1 text-gray-400 hover:text-red-500 opacity-0 group-hover/file:opacity-100 transition-opacity"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                    <button
                                        onClick={() => fileInputRefs.current[activeAgentIndex]?.click()}
                                        className="text-xs flex items-center gap-1.5 text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors font-medium border border-transparent hover:border-indigo-100"
                                    >
                                        <Paperclip className="w-3 h-3" /> Add File
                                    </button>
                                    <input
                                        type="file"
                                        ref={el => fileInputRefs.current[activeAgentIndex] = el}
                                        onChange={(e) => handleFileUpload(activeAgentIndex, e.target.files[0])}
                                        className="hidden"
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Chat Canvas */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar pb-32">
                <div className="w-full max-w-4xl mx-auto min-h-full flex flex-col">
                    {messages.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                            <div className="relative mb-8 group cursor-default">
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-1000"></div>
                                <div className="relative w-32 h-32 bg-white rounded-[2rem] shadow-xl shadow-indigo-500/10 flex items-center justify-center border border-white/50">
                                    <img src="/illustration_welcome.svg" alt="" className="w-20 opacity-80" onError={(e) => e.target.style.display = 'none'} />
                                    <Bot className="w-12 h-12 text-indigo-500/80 absolute" style={{ opacity: 0.1 }} />
                                </div>
                            </div>
                            <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 mb-4 tracking-tight">
                                Hello, User
                            </h2>
                            <p className="text-gray-500 max-w-md mb-10 text-lg leading-relaxed">
                                Ready to build? Start by adding agents to your chain or simply type below to begin.
                            </p>
                            <button
                                onClick={() => setIsAgentDrawerOpen(true)}
                                className="group relative px-8 py-4 bg-gray-900 text-white rounded-2xl font-semibold shadow-2xl shadow-gray-900/20 hover:shadow-gray-900/30 hover:-translate-y-1 transition-all"
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    Start Project <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </span>
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-8 pb-32 pt-4">
                            {messages.map((msg, idx) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    key={idx}
                                    className={`flex gap-6 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                                >
                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${msg.role === 'user'
                                        ? 'bg-gradient-to-br from-indigo-600 to-blue-600 text-white'
                                        : 'bg-white text-indigo-600 border border-indigo-50'
                                        }`}>
                                        {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-6 h-6" />}
                                    </div>
                                    <div className={`max-w-[80%] ${msg.role === 'user' ? 'text-right' : ''}`}>
                                        <div className={`inline-block p-6 text-left shadow-sm ${msg.role === 'user'
                                            ? 'bg-gradient-to-br from-indigo-600 to-blue-600 text-white rounded-[2rem] rounded-tr-md shadow-indigo-500/20'
                                            : 'bg-white text-gray-800 rounded-[2rem] rounded-tl-md border border-gray-100 shadow-gray-200/50'
                                            }`}>
                                            <p className={`whitespace-pre-wrap leading-relaxed text-[15px] ${msg.role === 'user' ? 'text-white/95' : 'text-gray-700'}`}>
                                                {msg.content}
                                            </p>
                                        </div>
                                        {msg.sources && msg.sources.length > 0 && (
                                            <div className={`mt-3 flex gap-2 overflow-x-auto ${msg.role === 'user' ? 'justify-end' : ''}`}>
                                                {msg.sources.map((s, i) => (
                                                    <span key={i} className="text-[10px] uppercase tracking-wide font-semibold bg-white/50 border border-gray-200 px-3 py-1 rounded-full text-gray-500 hover:bg-white hover:border-indigo-200 transition-colors cursor-default">
                                                        {s}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        {/* Optional Timestamp or metadata could go here */}
                                    </div>
                                </motion.div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>
            </div>

            {/* Input Area (Floating) */}
            <div className="absolute bottom-0 left-0 right-0 p-6 pointer-events-none bg-gradient-to-t from-[#F3F4F6] via-[#F3F4F6]/80 to-transparent pt-20">
                <div className="w-full max-w-4xl mx-auto pointer-events-auto">
                    <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-2xl shadow-indigo-500/10 border border-white/50 p-2 pl-6 pr-2 flex items-center gap-4 transition-all focus-within:shadow-indigo-500/20 focus-within:border-indigo-200/50 ring-1 ring-black/5">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type your message..."
                            className="flex-1 py-4 outline-none text-gray-700 placeholder-gray-400 bg-transparent text-lg"
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={!input.trim() || isLoading}
                            className="p-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-[1.5rem] hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        </button>
                    </div>
                    <div className="text-center mt-3">
                        <p className="text-xs text-gray-400 font-medium tracking-wide">
                            AI Output can be inaccurate. verify important info.
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Drawer for Agents */}
            <AnimatePresence>
                {isAgentDrawerOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAgentDrawerOpen(false)}
                            className="fixed inset-0 bg-gray-900/10 z-40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed right-0 top-0 h-full w-96 bg-white/90 backdrop-blur-2xl shadow-2xl shadow-gray-900/20 z-50 flex flex-col border-l border-white/20"
                        >
                            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-white/50">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">Agent Library</h3>
                                    <p className="text-xs text-gray-500 mt-1">Enhance your workflow</p>
                                </div>
                                <button onClick={() => setIsAgentDrawerOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                                {availableAgents.map(agent => (
                                    <div
                                        key={agent._id}
                                        onClick={() => addToChain(agent)}
                                        className="group p-5 bg-white border border-gray-100 hover:border-indigo-200 rounded-2xl cursor-pointer transition-all shadow-sm hover:shadow-lg hover:shadow-indigo-500/5 flex items-center gap-4 relative overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                        <div className="w-12 h-12 rounded-xl bg-white border border-gray-100 flex items-center justify-center group-hover:scale-105 transition-transform relative z-10 shadow-sm">
                                            <img src={getAgentLogo(agent.type)} alt="" className="w-7 h-7" />
                                        </div>
                                        <div className="relative z-10">
                                            <h4 className="font-bold text-gray-800 group-hover:text-indigo-900 transition-colors">{agent.name}</h4>
                                            <p className="text-xs text-gray-500 font-medium">{agent.type}</p>
                                        </div>
                                        <div className="ml-auto w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-400 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0 relative z-10">
                                            <Plus className="w-5 h-5" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ChatInterface;
