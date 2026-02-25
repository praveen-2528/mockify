import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ExamProvider } from './context/ExamContext';
import { RoomProvider } from './context/RoomContext';
import Setup from './pages/Setup';
import Test from './pages/Test';
import Results from './pages/Results';
import Lobby from './pages/Lobby';
import SavedExams from './pages/SavedExams';
import Leaderboard from './pages/Leaderboard';
import './App.css';

function App() {
  return (
    <ExamProvider>
      <RoomProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Setup />} />
            <Route path="/test" element={<Test />} />
            <Route path="/results" element={<Results />} />
            <Route path="/lobby" element={<Lobby />} />
            <Route path="/saved" element={<SavedExams />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
          </Routes>
        </Router>
      </RoomProvider>
    </ExamProvider>
  );
}

export default App;
