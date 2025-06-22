import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Calendar, Users, Activity } from 'lucide-react';
import axios from 'axios';

const Home = () => {
  const [stats, setStats] = useState({
    tournaments: 0,
    liveMatches: 0,
    totalMatches: 0
  });
  const [recentTournaments, setRecentTournaments] = useState([]);

  useEffect(() => {
    fetchStats();
    fetchRecentTournaments();
  }, []);

  const fetchStats = async () => {
    try {
      const [tournamentsRes] = await Promise.all([
        axios.get('/tournaments')
      ]);
      
      setStats({
        tournaments: tournamentsRes.data.length,
        liveMatches: tournamentsRes.data.filter(t => t.status === 'active').length,
        totalMatches: 0 // This would need match data
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchRecentTournaments = async () => {
    try {
      const response = await axios.get('/tournaments?limit=3');
      setRecentTournaments(response.data.slice(0, 3));
    } catch (error) {
      console.error('Error fetching tournaments:', error);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-800 via-green-700 to-green-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-6">
              Cricket Tournament Management Platform
            </h1>
            <p className="text-xl mb-8 text-green-100">
              Organize tournaments, manage teams, and track live scores in real-time
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Link 
                to="/tournaments" 
                className="bg-yellow-600 hover:bg-yellow-700 px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                View Tournaments
              </Link>
              <Link 
                to="/register" 
                className="bg-transparent border-2 border-white hover:bg-white hover:text-green-800 px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-green-50 rounded-lg">
              <Trophy className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-3xl font-bold text-gray-900">{stats.tournaments}</h3>
              <p className="text-gray-600">Active Tournaments</p>
            </div>
            <div className="text-center p-8 bg-yellow-50 rounded-lg">
              <Activity className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
              <h3 className="text-3xl font-bold text-gray-900">{stats.liveMatches}</h3>
              <p className="text-gray-600">Live Matches</p>
            </div>
            <div className="text-center p-8 bg-blue-50 rounded-lg">
              <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-3xl font-bold text-gray-900">500+</h3>
              <p className="text-gray-600">Players</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Tournaments */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Recent Tournaments</h2>
            <p className="text-gray-600">Join exciting cricket tournaments happening now</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {recentTournaments.map((tournament) => (
              <div key={tournament._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{tournament.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      tournament.status === 'active' ? 'bg-green-100 text-green-800' :
                      tournament.status === 'upcoming' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>{new Date(tournament.startDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center">
                      <Trophy className="h-4 w-4 mr-2" />
                      <span>{tournament.format}</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Link 
                      to={`/tournament/${tournament._id}`}
                      className="block w-full text-center bg-green-600 hover:bg-green-700 text-white py-2 rounded-md transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Platform Features</h2>
            <p className="text-gray-600">Everything you need to manage cricket tournaments</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6">
              <div className="bg-green-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Trophy className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Tournament Management</h3>
              <p className="text-gray-600 text-sm">Create and manage tournaments with multiple formats</p>
            </div>
            
            <div className="text-center p-6">
              <div className="bg-blue-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Team & Player Management</h3>
              <p className="text-gray-600 text-sm">Organize teams and track player statistics</p>
            </div>
            
            <div className="text-center p-6">
              <div className="bg-yellow-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Activity className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Live Scoring</h3>
              <p className="text-gray-600 text-sm">Real-time score updates with ball-by-ball commentary</p>
            </div>
            
            <div className="text-center p-6">
              <div className="bg-purple-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Calendar className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Match Scheduling</h3>
              <p className="text-gray-600 text-sm">Schedule matches and manage fixtures efficiently</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;