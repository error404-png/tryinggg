import React, { useState, useEffect } from 'react';
import { Bot, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const AgentList = () => {
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
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
        fetchAgents();
    }, []);

    return (
        <section className="py-10 px-8 max-w-[1600px] mx-auto">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-text-primary">Agent Store</h2>
                <p className="text-text-secondary text-sm">Select an agent to begin working or add to your project.</p>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-72 rounded-xl bg-gray-100 animate-pulse"></div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {agents.map((agent) => (
                        <div
                            key={agent._id}
                            className="group bg-canvas-white rounded-xl shadow-card hover:shadow-elevation hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden border border-transparent hover:border-gray-100"
                        >
                            {/* Top Half: Logo / Illustration */}
                            <div className="h-40 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center relative p-6">
                                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center p-3 transform transition-transform group-hover:scale-110 duration-300">
                                    {/* Using dynamic color for icon based on name hash not implemented, utilizing primary for now */}
                                    <Bot className="w-8 h-8 text-primary" />
                                </div>
                            </div>

                            {/* Bottom Half: Content */}
                            <div className="p-6 flex flex-col flex-1">
                                <h3 className="text-lg font-bold text-text-primary mb-2 line-clamp-1">{agent.name}</h3>
                                <p className="text-text-secondary text-sm leading-relaxed mb-6 line-clamp-2 flex-grow">
                                    {agent.description || "Powerful enterprise-grade AI agent ready for deployment."}
                                </p>

                                <button
                                    onClick={() => navigate(`/agent/${agent._id}`)}
                                    className="w-full py-2.5 px-4 rounded-lg border border-primary text-primary font-medium text-sm transition-all duration-300 group-hover:bg-primary group-hover:text-white flex items-center justify-center gap-2"
                                >
                                    <span>Install / Use</span>
                                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -ml-4 group-hover:ml-0 transition-all duration-300" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
};

export default AgentList;
