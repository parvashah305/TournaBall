import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Trophy, Users, Crown, UserPlus, ArrowLeft } from 'lucide-react';
import axios from 'axios';

const TeamDetail = () => {
  const { id } = useParams();
  const [team, setTeam] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [playerForm, setPlayerForm] = useState({
    name: '',
    role: 'batsman',
    jerseyNumber: '',
    age: '',
    battingStyle: 'right-handed',
    bowlingStyle: 'none'
  });

  useEffect(() => {
    fetchTeamData();
  }, [id]);

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      const [teamRes, playersRes] = await Promise.all([
        axios.get(`teams/${id}`),
        axios.get(`players/team/${id}`)
      ]);

      setTeam(teamRes.data);
      setPlayers(playersRes.data);
    } catch (error) {
      console.error('Error fetching team data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlayer = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('players', {
        name: playerForm.name,
        team: id,
        role: playerForm.role,
        jerseyNumber: playerForm.jerseyNumber,
        age: playerForm.age,
        battingStyle: playerForm.battingStyle,
        bowlingStyle: playerForm.bowlingStyle
      });
      setShowAddPlayerModal(false);
      setPlayerForm({
        name: '',
        role: 'batsman',
        jerseyNumber: '',
        age: '',
        battingStyle: 'right-handed',
        bowlingStyle: 'none'
      });
      fetchTeamData();
    } catch (error) {
      console.error('Error adding player:', error);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'batsman':
        return 'bg-blue-100 text-blue-800';
      case 'bowler':
        return 'bg-green-100 text-green-800';
      case 'all-rounder':
        return 'bg-purple-100 text-purple-800';
      case 'wicketkeeper':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'batsman':
        return '🏏';
      case 'bowler':
        return '🎯';
      case 'all-rounder':
        return '⚡';
      case 'wicketkeeper':
        return '🧤';
      default:
        return '👤';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Trophy className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Team not found</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                to={`/tournament/${team.tournament._id}`}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Tournament
              </Link>
            </div>
            <button
              onClick={() => setShowAddPlayerModal(true)}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Player
            </button>
          </div>
          
          <div className="mt-6 flex items-center space-x-6">
            <div className="flex-shrink-0">
              {team.logo ? (
                <img src={team.logo} alt={team.name} className="h-20 w-20 rounded-full" />
              ) : (
                <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center">
                  <Trophy className="h-10 w-10 text-green-600" />
                </div>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{team.name}</h1>
              <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                {team.captain && (
                  <div className="flex items-center">
                    <Crown className="h-4 w-4 mr-1 text-yellow-500" />
                    <span>Captain: {team.captain}</span>
                  </div>
                )}
                {team.coach && (
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    <span>Coach: {team.coach}</span>
                  </div>
                )}
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  <span>{players.length} Players</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Players Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Squad</h2>
          </div>
          
          <div className="p-6">
            {players.length === 0 ? (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No players yet</h3>
                <p className="text-gray-600 mb-4">Add players to build your team squad.</p>
                <button
                  onClick={() => setShowAddPlayerModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add First Player
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {players.map((player) => (
                  <div key={player._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="text-lg">{getRoleIcon(player.role)}</span>
                          </div>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{player.name}</h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(player.role)}`}>
                              {player.role.charAt(0).toUpperCase() + player.role.slice(1)}
                            </span>
                            {team.captain === player.name && (
                              <span className="flex items-center text-yellow-600">
                                <Crown className="h-3 w-3 mr-1" />
                                <span className="text-xs font-medium">Captain</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">#{player.jerseyNumber}</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Age:</span> {player.age || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Batting:</span> {player.battingStyle}
                      </div>
                      {player.bowlingStyle !== 'none' && (
                        <div className="col-span-2">
                          <span className="font-medium">Bowling:</span> {player.bowlingStyle}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Player Modal */}
      {showAddPlayerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Player to {team.name}</h3>
            <form onSubmit={handleAddPlayer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Player Name</label>
                <input
                  type="text"
                  required
                  value={playerForm.name}
                  onChange={(e) => setPlayerForm({...playerForm, name: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  required
                  value={playerForm.role}
                  onChange={(e) => setPlayerForm({...playerForm, role: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                >
                  <option value="batsman">Batsman</option>
                  <option value="bowler">Bowler</option>
                  <option value="all-rounder">All-Rounder</option>
                  <option value="wicketkeeper">Wicketkeeper</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jersey Number</label>
                <input
                  type="number"
                  required
                  value={playerForm.jerseyNumber}
                  onChange={(e) => setPlayerForm({...playerForm, jerseyNumber: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                <input
                  type="number"
                  value={playerForm.age}
                  onChange={(e) => setPlayerForm({...playerForm, age: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Batting Style</label>
                <select
                  value={playerForm.battingStyle}
                  onChange={(e) => setPlayerForm({...playerForm, battingStyle: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                >
                  <option value="right-handed">Right-Handed</option>
                  <option value="left-handed">Left-Handed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bowling Style</label>
                <select
                  value={playerForm.bowlingStyle}
                  onChange={(e) => setPlayerForm({...playerForm, bowlingStyle: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                >
                  <option value="none">No Bowling</option>
                  <option value="right-arm-fast">Right-Arm Fast</option>
                  <option value="left-arm-fast">Left-Arm Fast</option>
                  <option value="right-arm-spin">Right-Arm Spin</option>
                  <option value="left-arm-spin">Left-Arm Spin</option>
                </select>
              </div>
              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
                >
                  Add Player
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddPlayerModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamDetail; 