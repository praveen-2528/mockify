import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ExamProvider } from './context/ExamContext';
import Setup from './pages/Setup';
import Test from './pages/Test';
import Results from './pages/Results';
import './App.css';

function App() {
  return (
    <ExamProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Setup />} />
          <Route path="/test" element={<Test />} />
          <Route path="/results" element={<Results />} />
        </Routes>
      </Router>
    </ExamProvider>
  );
}

export default App;
