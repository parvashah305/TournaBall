import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Trophy, Calendar, MapPin, Users, Activity, Plus, UserPlus, Gamepad2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const TournamentDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [tournament, setTournament] = useState(null);
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Modal states
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [showCreateMatchModal, setShowCreateMatchModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  
  // Form states
  const [teamForm, setTeamForm] = useState({
    name: '',
    captain: '',
    coach: ''
  });
  
  const [playerForm, setPlayerForm] = useState({
    name: '',
    role: 'batsman',
    jerseyNumber: '',
    age: '',
    battingStyle: 'right-handed',
    bowlingStyle: 'none'
  });
  
  const [matchForm, setMatchForm] = useState({
    teamA: '',
    teamB: '',
    dateTime: '',
    venue: '',
    overs: 20
  });

  useEffect(() => {
    fetchTournamentData();
  }, [id]);

  const fetchTournamentData = async () => {
    try {
      setLoading(true);
      const [tournamentRes, teamsRes, matchesRes] = await Promise.all([
        axios.get(`/api/tournaments/${id}`),
        axios.get(`/api/teams/tournament/${id}`),
        axios.get(`/api/matches/tournament/${id}`)
      ]);

      setTournament(tournamentRes.data);
      setTeams(teamsRes.data);
      setMatches(matchesRes.data);
    } catch (error) {
      console.error('Error fetching tournament data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add Team functionality
  const handleAddTeam = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/teams', {
        name: teamForm.name,
        captain: teamForm.captain,
        coach: teamForm.coach,
        tournament: id
      });
      setShowAddTeamModal(false);
      setTeamForm({ name: '', captain: '', coach: '' });
      fetchTournamentData();
    } catch (error) {
      console.error('Error adding team:', error);
    }
  };

  // Add Player functionality
  const handleAddPlayer = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/players', {
        name: playerForm.name,
        team: selectedTeam._id,
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
      setSelectedTeam(null);
      fetchTournamentData();
    } catch (error) {
      console.error('Error adding player:', error);
    }
  };

  // Create Match functionality
  const handleCreateMatch = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/matches', {
        tournament: id,
        teamA: matchForm.teamA,
        teamB: matchForm.teamB,
        dateTime: matchForm.dateTime,
        venue: matchForm.venue,
        overs: matchForm.overs
      });
      setShowCreateMatchModal(false);
      setMatchForm({ teamA: '', teamB: '', dateTime: '', venue: '', overs: 20 });
      fetchTournamentData();
    } catch (error) {
      console.error('Error creating match:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
      case 'live':
        return 'bg-green-100 text-green-800';
      case 'upcoming':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Trophy className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Tournament not found</h3>
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
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{tournament.name}</h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{tournament.location}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>{formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}</span>
                </div>
                <div className="flex items-center">
                  <Trophy className="h-4 w-4 mr-1" />
                  <span>{tournament.format}</span>
                </div>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(tournament.status)}`}>
              {tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {['overview', 'teams', 'fixtures'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tournament Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Format</p>
                    <p className="text-lg text-gray-900">{tournament.format}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <p className="text-lg text-gray-900">{tournament.status}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Start Date</p>
                    <p className="text-lg text-gray-900">{formatDate(tournament.startDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">End Date</p>
                    <p className="text-lg text-gray-900">{formatDate(tournament.endDate)}</p>
                  </div>
                </div>
                {tournament.description && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-500 mb-2">Description</p>
                    <p className="text-gray-900">{tournament.description}</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tournament Stats</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Users className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">Teams</span>
                    </div>
                    <span className="text-lg font-semibold text-gray-900">{teams.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Activity className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">Matches</span>
                    </div>
                    <span className="text-lg font-semibold text-gray-900">{matches.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Trophy className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">Live Matches</span>
                    </div>
                    <span className="text-lg font-semibold text-gray-900">
                      {matches.filter(m => m.status === 'live').length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'teams' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Participating Teams</h3>
              <button
                onClick={() => setShowAddTeamModal(true)}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Team
              </button>
            </div>
            
            {teams.length === 0 ? (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No teams registered</h3>
                <p className="text-gray-600 mb-4">Add teams to get started with the tournament.</p>
                <button
                  onClick={() => setShowAddTeamModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Team
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teams.map((team) => (
                  <div key={team._id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="flex-shrink-0">
                        {team.logo ? (
                          <img src={team.logo} alt={team.name} className="h-12 w-12 rounded-full" />
                        ) : (
                          <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                            <Trophy className="h-6 w-6 text-green-600" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900">{team.name}</h4>
                        {team.captain && (
                          <p className="text-sm text-gray-600">Captain: {team.captain}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedTeam(team);
                          setShowAddPlayerModal(true);
                        }}
                        className="flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                      >
                        <UserPlus className="h-3 w-3 mr-1" />
                        Add Player
                      </button>
                      <Link
                        to={`/team/${team._id}`}
                        className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'fixtures' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Match Fixtures</h3>
              {teams.length >= 2 && (
                <button
                  onClick={() => setShowCreateMatchModal(true)}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  <Gamepad2 className="h-4 w-4 mr-2" />
                  Schedule Match
                </button>
              )}
            </div>
            
            {matches.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No matches scheduled</h3>
                <p className="text-gray-600 mb-4">
                  {teams.length < 2 
                    ? 'Add at least 2 teams to schedule matches.' 
                    : 'Schedule matches to get the tournament started.'
                  }
                </p>
                {teams.length >= 2 && (
                  <button
                    onClick={() => setShowCreateMatchModal(true)}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    <Gamepad2 className="h-4 w-4 mr-2" />
                    Schedule First Match
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {matches.map((match) => (
                  <div key={match._id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-2">
                            {match.teamA.logo ? (
                              <img src={match.teamA.logo} alt={match.teamA.name} className="h-8 w-8 rounded-full" />
                            ) : (
                              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <Trophy className="h-4 w-4 text-blue-600" />
                              </div>
                            )}
                            <span className="font-medium">{match.teamA.name}</span>
                          </div>
                          <span className="text-gray-400">vs</span>
                          <div className="flex items-center space-x-2">
                            {match.teamB.logo ? (
                              <img src={match.teamB.logo} alt={match.teamB.name} className="h-8 w-8 rounded-full" />
                            ) : (
                              <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                                <Trophy className="h-4 w-4 text-red-600" />
                              </div>
                            )}
                            <span className="font-medium">{match.teamB.name}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm text-gray-600">{formatDateTime(match.dateTime)}</p>
                          <p className="text-xs text-gray-500">{match.venue}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(match.status)}`}>
                          {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
                        </span>
                        <div className="flex space-x-2">
                          <Link
                            to={`/live-scorecard/${match._id}`}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                          >
                            Scorecard
                          </Link>
                          {match.status === 'live' && (
                            <Link
                              to={`/live-scoring/${match._id}`}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                            >
                              Live Scoring
                            </Link>
                          )}
                          {match.status !== 'live' && (
                            <Link
                              to={`/match/${match._id}`}
                              className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                            >
                              View Match
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Team Modal */}
      {showAddTeamModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Team</h3>
            <form onSubmit={handleAddTeam} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team Name</label>
                <input
                  type="text"
                  required
                  value={teamForm.name}
                  onChange={(e) => setTeamForm({...teamForm, name: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Captain</label>
                <input
                  type="text"
                  value={teamForm.captain}
                  onChange={(e) => setTeamForm({...teamForm, captain: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Coach</label>
                <input
                  type="text"
                  value={teamForm.coach}
                  onChange={(e) => setTeamForm({...teamForm, coach: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
                >
                  Add Team
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddTeamModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Player Modal */}
      {showAddPlayerModal && selectedTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Player to {selectedTeam.name}</h3>
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

      {/* Create Match Modal */}
      {showCreateMatchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Schedule New Match</h3>
            <form onSubmit={handleCreateMatch} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team A</label>
                <select
                  required
                  value={matchForm.teamA}
                  onChange={(e) => setMatchForm({...matchForm, teamA: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Select Team A</option>
                  {teams.map(team => (
                    <option key={team._id} value={team._id}>{team.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team B</label>
                <select
                  required
                  value={matchForm.teamB}
                  onChange={(e) => setMatchForm({...matchForm, teamB: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Select Team B</option>
                  {teams.map(team => (
                    <option key={team._id} value={team._id}>{team.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={matchForm.dateTime}
                  onChange={(e) => setMatchForm({...matchForm, dateTime: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
                <input
                  type="text"
                  required
                  value={matchForm.venue}
                  onChange={(e) => setMatchForm({...matchForm, venue: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Overs</label>
                <input
                  type="number"
                  min={1}
                  value={matchForm.overs}
                  onChange={e => setMatchForm({ ...matchForm, overs: Number(e.target.value) })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>
              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
                >
                  Schedule Match
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateMatchModal(false)}
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

export default TournamentDetail;