import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Tournaments from './pages/Tournaments';
import TournamentDetail from './pages/TournamentDetail';
import TeamDetail from './pages/TeamDetail';
import MatchDetail from './pages/MatchDetail';
import LiveScoring from './pages/LiveScoring';
import LiveScorecard from './pages/LiveScorecard';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/tournaments" element={<Tournaments />} />
            <Route path="/tournament/:id" element={<TournamentDetail />} />
            <Route path="/team/:id" element={<TeamDetail />} />
            <Route path="/match/:id" element={<MatchDetail />} />
            <Route path="/live-scorecard/:matchId" element={<LiveScorecard />} />
            <Route 
              path="/live-scoring/:matchId" 
              element={
                <ProtectedRoute>
                  <LiveScoring />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;