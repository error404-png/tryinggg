import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const AccessLog = () => {
    const { token } = useAuth();
    const [users, setUsers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    // New User Form State
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [newUserRole, setNewUserRole] = useState('user');
    const [newUserProjects, setNewUserProjects] = useState([]); // Array of IDs
    const [actionError, setActionError] = useState('');
    const [actionSuccess, setActionSuccess] = useState('');

    useEffect(() => {
        fetchData();
    }, [token]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersRes, projectsRes] = await Promise.all([
                fetch('http://localhost:8000/users', {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch('http://localhost:8000/projects', {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            if (usersRes.ok && projectsRes.ok) {
                const usersData = await usersRes.json();
                const projectsData = await projectsRes.json();
                setUsers(usersData);
                setProjects(projectsData);
            }
        } catch (error) {
            console.error("Error fetching admin data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setActionError('');
        setActionSuccess('');

        try {
            const res = await fetch('http://localhost:8000/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    email: newUserEmail,
                    password: newUserPassword,
                    role: newUserRole,
                    allowed_projects: newUserProjects
                })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || 'Failed to create user');
            }

            setActionSuccess(`User ${newUserEmail} created successfully`);
            setNewUserEmail('');
            setNewUserPassword('');
            setNewUserProjects([]);
            fetchData(); // Refresh list

        } catch (error) {
            setActionError(error.message);
        }
    };

    const toggleProjectSelection = (projectId) => {
        if (newUserProjects.includes(projectId)) {
            setNewUserProjects(newUserProjects.filter(id => id !== projectId));
        } else {
            setNewUserProjects([...newUserProjects, projectId]);
        }
    };

    if (loading) return <div className="p-8 text-white">Loading...</div>;

    return (
        <div className="flex-1 overflow-auto bg-[#050505] p-8">
            <div className="max-w-6xl mx-auto space-y-8">

                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-white">Access Log & User Management</h1>
                </div>

                {/* Create User Section */}
                <section className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                    <h2 className="text-xl font-semibold text-white mb-6">Create New User</h2>

                    {actionError && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{actionError}</div>
                    )}
                    {actionSuccess && (
                        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm">{actionSuccess}</div>
                    )}

                    <form onSubmit={handleCreateUser} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Email</label>
                                <input
                                    type="email"
                                    required
                                    value={newUserEmail}
                                    onChange={e => setNewUserEmail(e.target.value)}
                                    className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Password</label>
                                <input
                                    type="password"
                                    required
                                    value={newUserPassword}
                                    onChange={e => setNewUserPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg text-white"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Role</label>
                            <select
                                value={newUserRole}
                                onChange={e => setNewUserRole(e.target.value)}
                                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg text-white"
                            >
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>

                        {newUserRole === 'user' && (
                            <div>
                                <label className="block text-sm text-gray-400 mb-3">Allowed Projects</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {projects.map(project => (
                                        <div
                                            key={project._id}
                                            onClick={() => toggleProjectSelection(project._id)}
                                            className={`
                                        cursor-pointer p-3 rounded-lg border transition-all
                                        ${newUserProjects.includes(project._id)
                                                    ? 'bg-blue-600/20 border-blue-500 text-white'
                                                    : 'bg-black/20 border-white/5 text-gray-400 hover:border-white/20'}
                                    `}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center ${newUserProjects.includes(project._id) ? 'bg-blue-500 border-blue-500' : 'border-gray-500'}`}>
                                                    {newUserProjects.includes(project._id) && <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
                                                </div>
                                                <span className="truncate font-medium">{project.name}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {projects.length === 0 && <p className="text-gray-500 text-sm mt-2">No projects available to assign.</p>}
                            </div>
                        )}

                        <div className="flex justify-end">
                            <button type="submit" className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors">
                                Create User
                            </button>
                        </div>
                    </form>
                </section>

                {/* User List Section */}
                <section className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                    <h2 className="text-xl font-semibold text-white mb-6">Existing Users</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-white/10 text-gray-400">
                                    <th className="py-3 px-4">Email</th>
                                    <th className="py-3 px-4">Role</th>
                                    <th className="py-3 px-4">Allowed Projects</th>
                                    <th className="py-3 px-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-300">
                                {users.map(user => (
                                    <tr key={user._id} className="border-b border-white/5 hover:bg-white/5">
                                        <td className="py-3 px-4 font-medium text-white">{user.email}</td>
                                        <td className="py-3 px-4">
                                            <span className={`px-2 py-1 rounded text-xs ${user.role === 'admin' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-sm">
                                            {user.role === 'admin' ? (
                                                <span className="text-gray-500 italic">All Access</span>
                                            ) : (
                                                user.allowed_projects?.length
                                                    ? `${user.allowed_projects.length} Projects`
                                                    : 'None'
                                            )}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="text-green-400 text-sm">Active</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

            </div>
        </div>
    );
};

export default AccessLog;
