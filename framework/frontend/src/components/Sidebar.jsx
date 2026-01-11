import React, { useState, useEffect } from 'react';
import { Plus, MessageSquare, Box, FolderOpen, ShoppingBag, Settings, LogOut, Shield, FileText } from 'lucide-react';
import { useNavigate, useParams, NavLink } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ onOpenCreateModal }) => {
    const [projects, setProjects] = useState([]);
    const navigate = useNavigate();
    const { projectId } = useParams();
    const { user, logout, isAdmin } = useAuth();
    const [expandedProjects, setExpandedProjects] = useState({});

    const toggleProjectExpand = (e, projectId) => {
        e.stopPropagation();
        setExpandedProjects(prev => ({
            ...prev,
            [projectId]: !prev[projectId]
        }));
    };

    useEffect(() => {
        if (user) {
            fetchProjects();
        }
    }, [projectId, user]);

    const fetchProjects = async () => {
        try {
            const response = await api.get('/projects');
            setProjects(response.data);
        } catch (error) {
            console.error("Failed to fetch projects", error);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="w-64 bg-sidebar text-white shadow-xl flex flex-col h-full font-sans transition-all duration-300">
            {/* Header / Logo Area */}
            <div className="h-16 flex items-center px-6 bg-sidebar-active/30 border-b border-white/10 backdrop-blur-md">
                <Box className="w-6 h-6 text-white mr-3 opacity-90" />
                <h1 className="font-bold text-lg tracking-wide text-white/90">Xenova AI</h1>
            </div>

            {/* Main Navigation */}
            <div className="flex-1 overflow-y-auto py-6 space-y-8">

                {/* Section 1: Core Apps (Admin Only) */}
                {isAdmin && (
                    <div className="px-3">
                        <p className="px-3 mb-2 text-xs font-semibold text-white/40 uppercase tracking-widest">Admin</p>
                        <div className="space-y-1">
                            <NavLink
                                to="/admin"
                                className={({ isActive }) => `group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 border border-transparent ${isActive && !window.location.pathname.includes('access-log')
                                    ? 'bg-white/10 shadow-sm border-white/5 text-white'
                                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                                    }`}
                                end
                            >
                                <Shield className="w-5 h-5 stroke-[1.5]" />
                                <span className="font-medium text-sm">Dashboard</span>
                            </NavLink>
                            <NavLink
                                to="/admin/access-log"
                                className={({ isActive }) => `group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 border border-transparent ${isActive
                                    ? 'bg-white/10 shadow-sm border-white/5 text-white'
                                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <FileText className="w-5 h-5 stroke-[1.5]" />
                                <span className="font-medium text-sm">Access Log</span>
                            </NavLink>
                            <NavLink
                                to="/agent-store"
                                className={({ isActive }) => `group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 border border-transparent ${isActive
                                    ? 'bg-white/10 shadow-sm border-white/5 text-white'
                                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <ShoppingBag className="w-5 h-5 stroke-[1.5]" />
                                <span className="font-medium text-sm">Agent Store</span>
                            </NavLink>

                            <NavLink
                                to="/repositories"
                                className={({ isActive }) => `group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 border border-transparent ${isActive
                                    ? 'bg-white/10 shadow-sm border-white/5 text-white'
                                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <FolderOpen className="w-5 h-5 stroke-[1.5]" />
                                <span className="font-medium text-sm">Repositories</span>
                            </NavLink>
                        </div>
                    </div>
                )}

                {/* Section 2: Projects */}
                <div className="px-3">
                    <div className="flex items-center justify-between px-3 mb-2">
                        <h2 className="text-xs font-semibold text-white/40 uppercase tracking-widest">Projects</h2>
                        {isAdmin && (
                            <button onClick={onOpenCreateModal} className="text-white/40 hover:text-white transition-colors" data-testid="create-project-btn">
                                <Plus className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    <div className="space-y-1 mt-2">
                        {projects.map((project) => {
                            const hasAgents = (project.chain_config && project.chain_config.length > 0) || (project.agents && project.agents.length > 0);
                            const isExpanded = expandedProjects[project._id];

                            return (
                                <div key={project._id} className="group">
                                    <div
                                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-left border border-transparent cursor-pointer ${projectId === project._id && !window.location.search.includes('agent=')
                                            ? 'bg-white/10 shadow-sm border-white/5 text-white'
                                            : 'text-white/70 hover:bg-white/5 hover:text-white'
                                            }`}
                                        onClick={() => navigate(`/project/${project._id}`)}
                                    >
                                        <MessageSquare className="w-4 h-4 stroke-[1.5]" />
                                        <span className="truncate text-sm font-medium flex-1">{project.name}</span>

                                        {hasAgents && (
                                            <button
                                                onClick={(e) => toggleProjectExpand(e, project._id)}
                                                className={`p-1 rounded-md hover:bg-white/10 transition-colors ${isExpanded ? 'text-white' : 'text-white/40 hover:text-white'}`}
                                            >
                                                <Plus className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-45' : ''}`} />
                                            </button>
                                        )}
                                    </div>

                                    {/* Agent Sub-list */}
                                    {isExpanded && hasAgents && (
                                        <div className="ml-9 mt-1 space-y-1 mb-2 border-l border-white/10 pl-2">
                                            {(project.chain_config || []).map((agent, idx) => (
                                                <button
                                                    key={`${agent.agent_id}-${idx}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/project/${project._id}?agent=${agent.agent_id}`);
                                                    }}
                                                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-all ${window.location.search.includes(`agent=${agent.agent_id}`) && projectId === project._id
                                                        ? 'bg-primary/20 text-white font-medium'
                                                        : 'text-white/50 hover:text-white hover:bg-white/5'
                                                        }`}
                                                >
                                                    <div className="w-1.5 h-1.5 rounded-full bg-white/40"></div>
                                                    <span className="truncate">{agent.name || 'Unknown Agent'}</span>
                                                </button>
                                            ))}
                                            {/* Legacy agents fallback if needed, though chain_config is preferred */}
                                            {(!project.chain_config || project.chain_config.length === 0) && project.agents && project.agents.map((agentId, idx) => (
                                                <button
                                                    key={`${agentId}-${idx}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/project/${project._id}?agent=${agentId}`);
                                                    }}
                                                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-white/50 hover:text-white hover:bg-white/5 transition-all"
                                                >
                                                    <div className="w-1.5 h-1.5 rounded-full bg-white/40"></div>
                                                    <span className="truncate">Agent {idx + 1}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {projects.length === 0 && (
                            <div className="px-3 py-4 text-center">
                                <p className="text-xs text-white/30 italic">No projects</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer / User Settings */}
            <div className="p-4 bg-sidebar-active/20 border-t border-white/10 space-y-1">
                <div className="px-3 py-2 text-xs text-white/50 truncate">
                    Logged in as: <span className="text-white">{user?.email}</span>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-white/70 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                >
                    <LogOut className="w-5 h-5 stroke-[1.5]" />
                    <span className="font-medium text-sm">Sign Out</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
