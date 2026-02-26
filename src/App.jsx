import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ExamProvider } from './context/ExamContext';
import { RoomProvider } from './context/RoomContext';
import Setup from './pages/Setup';
import Test from './pages/Test';
import Results from './pages/Results';
import Lobby from './pages/Lobby';
import SavedExams from './pages/SavedExams';
import Leaderboard from './pages/Leaderboard';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Settings from './pages/Settings';
import GlobalLeaderboard from './pages/GlobalLeaderboard';
import QuestionBank from './pages/QuestionBank';
import './App.css';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="loading-spinner" /></div>;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Setup /></ProtectedRoute>} />
      <Route path="/test" element={<ProtectedRoute><Test /></ProtectedRoute>} />
      <Route path="/results" element={<ProtectedRoute><Results /></ProtectedRoute>} />
      <Route path="/lobby" element={<ProtectedRoute><Lobby /></ProtectedRoute>} />
      <Route path="/saved" element={<ProtectedRoute><SavedExams /></ProtectedRoute>} />
      <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/global-leaderboard" element={<ProtectedRoute><GlobalLeaderboard /></ProtectedRoute>} />
      <Route path="/question-bank" element={<ProtectedRoute><QuestionBank /></ProtectedRoute>} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <ExamProvider>
        <RoomProvider>
          <Router>
            <AppRoutes />
          </Router>
        </RoomProvider>
      </ExamProvider>
    </AuthProvider>
  );
}

export default App;
