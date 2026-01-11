import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import CreateProjectModal from './components/CreateProjectModal';
import AgentStore from './components/AgentStore';
import AgentInterface from './components/AgentInterface';
import Home from './pages/Home';
import LandingPage from './pages/LandingPage';
import Repositories from './pages/Repositories';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import AccessLog from './pages/AccessLog';
import UserDashboard from './pages/UserDashboard';
import { useLocation } from 'react-router-dom';

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const location = useLocation();
  const isExcludedPage = location.pathname === '/' || location.pathname === '/login';

  // Key to force sidebar refresh if needed, or pass callback
  const [refreshSidebar, setRefreshSidebar] = useState(0);

  const handleProjectCreated = (newProject) => {
    setRefreshSidebar(prev => prev + 1);
  };

  if (isExcludedPage) {
    return (
      <AuthProvider>
        <div className="min-h-screen bg-white">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </div>
      </AuthProvider>
    );
  }

  return (
    <AuthProvider>
      <div className="flex h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans overflow-hidden">
        <Sidebar
          onOpenCreateModal={() => setIsModalOpen(true)}
          key={refreshSidebar}
        />

        <main className="flex-1 flex flex-col relative overflow-hidden">
          <Routes>
            <Route path="/admin" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/access-log" element={
              <ProtectedRoute requireAdmin={true}>
                <AccessLog />
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <UserDashboard />
              </ProtectedRoute>
            } />
            <Route path="/agent-store" element={
              <ProtectedRoute requireAdmin={true}>
                <AgentStore />
              </ProtectedRoute>
            } />
            <Route path="/repositories" element={
              <ProtectedRoute requireAdmin={true}>
                <Repositories />
              </ProtectedRoute>
            } />
            <Route path="/agent/:agentId" element={
              <ProtectedRoute requireAdmin={true}>
                <AgentInterface />
              </ProtectedRoute>
            } />
            <Route path="/project/:projectId" element={
              <ProtectedRoute>
                <ChatInterface />
              </ProtectedRoute>
            } />
            {/* Catch all or redirect to first project? For now just Home/Empty */}
          </Routes>
        </main>

        <CreateProjectModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onProjectCreated={handleProjectCreated}
        />
      </div>
    </AuthProvider>
  );
}

export default App;

