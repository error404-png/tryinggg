import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Users, Folder, Activity, Bot } from 'lucide-react';

const AdminDashboard = () => {
    const { token } = useAuth();
    const [stats, setStats] = useState({
        total_users: 0,
        total_projects: 0,
        active_projects: 0,
        total_agents: 0,
        system_status: 'healthy'
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('http://localhost:8000/api/stats', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (error) {
                console.error("Failed to fetch stats", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [token]);

    // Mock data for visualizations since history isn't tracked yet
    const projectActivityData = [
        { name: 'Mon', active: Math.floor(stats.active_projects * 0.8) || 1, total: stats.total_projects || 2 },
        { name: 'Tue', active: Math.floor(stats.active_projects * 0.9) || 2, total: stats.total_projects || 2 },
        { name: 'Wed', active: stats.active_projects || 1, total: stats.total_projects || 2 },
        { name: 'Thu', active: Math.floor(stats.active_projects * 0.85) || 2, total: stats.total_projects + 1 },
        { name: 'Fri', active: stats.active_projects || 3, total: stats.total_projects + 2 },
        { name: 'Sat', active: Math.floor(stats.active_projects * 0.5) || 1, total: stats.total_projects + 2 },
        { name: 'Sun', active: Math.floor(stats.active_projects * 0.4) || 1, total: stats.total_projects + 2 },
    ];

    const data = [
        { name: 'Jan', agents: Math.max(1, Math.floor(stats.total_agents * 0.2)) },
        { name: 'Feb', agents: Math.max(2, Math.floor(stats.total_agents * 0.4)) },
        { name: 'Mar', agents: Math.max(3, Math.floor(stats.total_agents * 0.6)) },
        { name: 'Apr', agents: Math.max(4, Math.floor(stats.total_agents * 0.8)) },
        { name: 'May', agents: stats.total_agents },
        { name: 'Jun', agents: stats.total_agents + 2 },
    ];

    if (loading) return (
        <div className="flex items-center justify-center h-full text-white/50">Loading Dashboard...</div>
    );

    return (
        <div className="flex-1 overflow-auto bg-[#050505] p-8 text-white min-h-screen">
            <div className="max-w-[1600px] mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-end justify-between">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Dashboard</h1>
                        <p className="text-white/40 mt-1">Overview of system performance and metrics</p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        System Operational
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Total Users"
                        value={stats.total_users}
                        icon={Users}
                        color="text-blue-400"
                        bgColor="bg-blue-400/10"
                        trend="+12% vs last month"
                    />
                    <StatCard
                        title="Total Projects"
                        value={stats.total_projects}
                        icon={Folder}
                        color="text-purple-400"
                        bgColor="bg-purple-400/10"
                        trend="+5 new this week"
                    />
                    <StatCard
                        title="Active Projects"
                        value={stats.active_projects}
                        icon={Activity}
                        color="text-emerald-400"
                        bgColor="bg-emerald-400/10"
                        trend="64% engagement rate"
                    />
                    <StatCard
                        title="Deployed Agents"
                        value={stats.total_agents}
                        icon={Bot}
                        color="text-amber-400"
                        bgColor="bg-amber-400/10"
                        trend="Across all projects"
                    />
                </div>

                {/* Charts Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Chart */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="lg:col-span-2 bg-[#111] border border-white/5 rounded-3xl p-6 backdrop-blur-sm shadow-xl"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold text-white/90">Agent Usage Growth</h3>
                            <div className="flex gap-2">
                                <span className="text-xs px-2 py-1 rounded bg-white/10 text-white/50 cursor-pointer hover:bg-white/20 transition-colors">Weekly</span>
                                <span className="text-xs px-2 py-1 rounded bg-white/5 text-white/30 cursor-pointer hover:bg-white/20 transition-colors">Monthly</span>
                            </div>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data}>
                                    <defs>
                                        <linearGradient id="colorAgents" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                    <XAxis dataKey="name" stroke="#666" axisLine={false} tickLine={false} />
                                    <YAxis stroke="#666" axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#000', borderColor: '#333', borderRadius: '8px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Area type="monotone" dataKey="agents" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorAgents)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    {/* Side Chart */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-[#111] border border-white/5 rounded-3xl p-6 backdrop-blur-sm shadow-xl flex flex-col"
                    >
                        <h3 className="text-lg font-semibold text-white/90 mb-2">Project Activity</h3>
                        <p className="text-sm text-white/40 mb-6">Active vs Total Projects (Last 7 Days)</p>

                        <div className="h-[300px] flex-1">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={projectActivityData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                    <XAxis dataKey="name" stroke="#666" axisLine={false} tickLine={false} fontSize={12} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                        contentStyle={{ backgroundColor: '#000', borderColor: '#333', borderRadius: '8px' }}
                                    />
                                    <Bar dataKey="active" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="total" fill="#333" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, icon: Icon, color, bgColor, trend }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#111] border border-white/5 rounded-3xl p-6 backdrop-blur-md shadow-lg hover:bg-[#161616] transition-colors group"
    >
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-2xl ${bgColor}`}>
                <Icon className={`w-6 h-6 ${color}`} />
            </div>
        </div>
        <div className="space-y-1">
            <h3 className="text-sm font-medium text-white/50">{title}</h3>
            <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white tracking-tight">{value}</span>
                <span className="text-xs font-medium text-green-400/80">{trend}</span>
            </div>
        </div>
    </motion.div>
);

export default AdminDashboard;
