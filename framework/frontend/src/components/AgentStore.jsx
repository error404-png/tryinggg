import React, { useState, useEffect } from 'react';
import { Plus, Bot, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import CreateAgentModal from './CreateAgentModal';

const AgentStore = () => {
    const [agents, setAgents] = useState([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchAgents();
    }, []);

    const fetchAgents = async () => {
        try {
            const response = await api.get('/agents');
            setAgents(response.data);
        } catch (error) {
            console.error("Failed to fetch agents", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAgentCreated = (newAgent) => {
        setAgents([...agents, newAgent]);
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-[var(--bg-primary)] overflow-hidden">
            <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">Agent Store</h1>
                    <p className="text-[var(--text-secondary)]">Discover and manage your AI agents</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-white px-4 py-2 rounded-lg transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Create Agent
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                {loading ? (
                    <div className="text-center text-[var(--text-secondary)] mt-10">Loading agents...</div>
                ) : agents.length === 0 ? (
                    <div className="text-center text-[var(--text-secondary)] mt-10">
                        <Bot className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>No agents found. Create your first agent to get started.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {agents.map((agent) => (
                            <div
                                key={agent._id}
                                onClick={() => navigate(`/agent/${agent._id}`)}
                                className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-5 hover:border-[var(--accent-primary)] transition-all cursor-pointer group"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-10 h-10 rounded-lg bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] flex items-center justify-center">
                                        <Bot className="w-6 h-6" />
                                    </div>
                                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border-color)]">
                                        {agent.type}
                                    </span>
                                </div>
                                <h3 className="font-semibold text-lg text-[var(--text-primary)] mb-2 group-hover:text-[var(--accent-primary)] transition-colors">{agent.name}</h3>
                                <p className="text-[var(--text-secondary)] text-sm line-clamp-2">{agent.description || "No description provided."}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <CreateAgentModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onAgentCreated={handleAgentCreated}
            />
        </div>
    );
};

export default AgentStore;
