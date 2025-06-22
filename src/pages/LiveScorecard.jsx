import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Trophy, 
  Users, 
  Target, 
  Clock, 
  TrendingUp, 
  BarChart3,
  Crown,
  Zap,
  Calendar,
  MapPin
} from 'lucide-react';
import axios from 'axios';
import io from 'socket.io-client';

const LiveScorecard = () => {
  const { matchId } = useParams();
  const [match, setMatch] = useState(null);
  const [teams, setTeams] = useState({ team1: null, team2: null });
  const [players, setPlayers] = useState({ team1: [], team2: [] });
  const [score, setScore] = useState({ runs: 0, wickets: 0, overs: 0, balls: 0 });
  const [extras, setExtras] = useState({ wides: 0, noBalls: 0, byes: 0, legByes: 0 });
  const [ballHistory, setBallHistory] = useState([]);
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('live'); // live, scorecard, commentary
  const [matchStatus, setMatchStatus] = useState('not_started');

  useEffect(() => {
    fetchMatchData();
    setupSocket();
    return () => {
      if (socket) socket.disconnect();
    };
  }, [matchId]);

  const setupSocket = () => {
    const newSocket = io();
    setSocket(newSocket);

    newSocket.emit('join-match', matchId);

    newSocket.on('score-update', (data) => {
      setScore(data.score);
      setBallHistory(data.ballHistory);
    });

    newSocket.on('match-status', (status) => {
      setMatchStatus(status);
    });
  };

  const fetchMatchData = async () => {
    try {
      setLoading(true);
      const matchRes = await axios.get(`matches/${matchId}`);
      const { match: matchData, scores } = matchRes.data;
      setMatch(matchData);
      setBallHistory(matchData.ballHistory || []);

      // Fetch team data
      const [team1Res, team2Res] = await Promise.all([
        axios.get(`teams/${matchData.teamA}`),
        axios.get(`teams/${matchData.teamB}`)
      ]);

      setTeams({ team1: team1Res.data, team2: team2Res.data });

      // Fetch players for both teams
      const [team1Players, team2Players] = await Promise.all([
        axios.get(`players/team/${matchData.teamA}`),
        axios.get(`players/team/${matchData.teamB}`)
      ]);

      setPlayers({ team1: team1Players.data, team2: team2Players.data });

      // Set score if match is live
      if (matchData.status === 'live') {
        setScore(matchData.score || { runs: 0, wickets: 0, overs: 0, balls: 0 });
        setExtras(matchData.extras || { wides: 0, noBalls: 0, byes: 0, legByes: 0 });
        setMatchStatus('live');
      }
    } catch (error) {
      console.error('Error fetching match data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPlayerRoleIcon = (role) => {
    switch (role) {
      case 'batsman': return '🏏';
      case 'bowler': return '🎯';
      case 'all-rounder': return '⚡';
      case 'wicketkeeper': return '🧤';
      default: return '👤';
    }
  };

  const formatOvers = (overs, balls) => {
    return `${overs}.${balls}`;
  };

  const getRunRate = () => {
    const totalBalls = score.overs * 6 + score.balls;
    return totalBalls > 0 ? (score.runs / totalBalls * 6).toFixed(2) : '0.00';
  };

  const getRequiredRunRate = () => {
    if (!match || matchStatus !== 'live') return '0.00';
    const target = match.target || 0;
    const remainingOvers = 20 - (score.overs + score.balls / 6);
    return remainingOvers > 0 ? ((target - score.runs) / remainingOvers).toFixed(2) : '0.00';
  };

  const getBattingStats = () => {
    // This would be calculated from ball history in a real implementation
    return players.team1.map(player => ({
      ...player,
      runs: Math.floor(Math.random() * 50),
      balls: Math.floor(Math.random() * 30) + 10,
      fours: Math.floor(Math.random() * 5),
      sixes: Math.floor(Math.random() * 2),
      strikeRate: Math.floor(Math.random() * 100) + 50,
      status: Math.random() > 0.7 ? 'not out' : 'out'
    }));
  };

  const getBowlingStats = () => {
    // This would be calculated from ball history in a real implementation
    return players.team2.map(player => ({
      ...player,
      overs: Math.floor(Math.random() * 4) + 1,
      maidens: Math.floor(Math.random() * 2),
      runs: Math.floor(Math.random() * 30) + 10,
      wickets: Math.floor(Math.random() * 3),
      economy: (Math.random() * 8 + 4).toFixed(2)
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Trophy className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Match not found</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {teams.team1?.name} vs {teams.team2?.name}
            </h1>
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                <span>{match.venue}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                <span>{new Date(match.date).toLocaleDateString()}</span>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                matchStatus === 'live' ? 'bg-green-100 text-green-800' :
                matchStatus === 'completed' ? 'bg-gray-100 text-gray-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {matchStatus === 'live' ? 'LIVE' : 
                 matchStatus === 'completed' ? 'COMPLETED' : 'NOT STARTED'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Score Display */}
      {matchStatus === 'live' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {teams.team1?.name}
                </h3>
                <div className="text-4xl font-bold text-green-600">
                  {score.runs}/{score.wickets}
                </div>
                <div className="text-sm text-gray-600">
                  {formatOvers(score.overs, score.balls)} overs
                </div>
              </div>

              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Run Rate</h3>
                <div className="text-3xl font-bold text-blue-600">
                  {getRunRate()}
                </div>
                <div className="text-sm text-gray-600">runs per over</div>
              </div>

              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Required RR</h3>
                <div className="text-3xl font-bold text-purple-600">
                  {getRequiredRunRate()}
                </div>
                <div className="text-sm text-gray-600">to win</div>
              </div>

              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Extras</h3>
                <div className="text-3xl font-bold text-orange-600">
                  {Object.values(extras).reduce((a, b) => a + b, 0)}
                </div>
                <div className="text-sm text-gray-600">
                  W: {extras.wides} NB: {extras.noBalls}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('live')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'live'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <Zap className="h-4 w-4 mr-2" />
                  Live
                </div>
              </button>
              <button
                onClick={() => setActiveTab('scorecard')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'scorecard'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Scorecard
                </div>
              </button>
              <button
                onClick={() => setActiveTab('commentary')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'commentary'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <Target className="h-4 w-4 mr-2" />
                  Commentary
                </div>
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Live Tab */}
            {activeTab === 'live' && (
              <div className="space-y-6">
                {/* Current Batsmen */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Batsmen</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {getBattingStats().slice(0, 2).map((player, index) => (
                      <div key={player._id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{getPlayerRoleIcon(player.role)}</span>
                            <span className="font-semibold">{player.name}</span>
                            {teams.team1?.captain === player.name && (
                              <Crown className="h-4 w-4 text-yellow-500" />
                            )}
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            player.status === 'not out' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {player.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-sm">
                          <div>
                            <span className="text-gray-600">Runs:</span>
                            <span className="font-semibold ml-1">{player.runs}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Balls:</span>
                            <span className="font-semibold ml-1">{player.balls}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">4s:</span>
                            <span className="font-semibold ml-1">{player.fours}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">6s:</span>
                            <span className="font-semibold ml-1">{player.sixes}</span>
                          </div>
                        </div>
                        <div className="mt-2 text-sm">
                          <span className="text-gray-600">Strike Rate:</span>
                          <span className="font-semibold ml-1">{player.strikeRate}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Current Bowler */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Bowler</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    {getBowlingStats().slice(0, 1).map((player) => (
                      <div key={player._id}>
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-lg">{getPlayerRoleIcon(player.role)}</span>
                          <span className="font-semibold">{player.name}</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-sm">
                          <div>
                            <span className="text-gray-600">Overs:</span>
                            <span className="font-semibold ml-1">{player.overs}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Wickets:</span>
                            <span className="font-semibold ml-1">{player.wickets}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Runs:</span>
                            <span className="font-semibold ml-1">{player.runs}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Economy:</span>
                            <span className="font-semibold ml-1">{player.economy}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Balls */}
                {ballHistory.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Balls</h3>
                    <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
                      {ballHistory.slice(-12).map((ball, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded text-center text-sm font-medium ${
                            ball.wicket ? 'bg-red-100 text-red-800' :
                            ball.extras ? 'bg-yellow-100 text-yellow-800' :
                            ball.runs === 0 ? 'bg-gray-100 text-gray-800' :
                            ball.runs === 4 ? 'bg-blue-100 text-blue-800' :
                            ball.runs === 6 ? 'bg-purple-100 text-purple-800' :
                            'bg-green-100 text-green-800'
                          }`}
                        >
                          {ball.wicket ? 'W' : ball.extras ? 'E' : ball.runs}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Scorecard Tab */}
            {activeTab === 'scorecard' && (
              <div className="space-y-6">
                {/* Batting Scorecard */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {teams.team1?.name} - Batting
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Batsman
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            R
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            B
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            4s
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            6s
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            SR
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {getBattingStats().map((player) => (
                          <tr key={player._id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <span className="text-lg mr-2">{getPlayerRoleIcon(player.role)}</span>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {player.name}
                                    {teams.team1?.captain === player.name && (
                                      <Crown className="inline h-4 w-4 text-yellow-500 ml-1" />
                                    )}
                                  </div>
                                  <div className="text-sm text-gray-500">{player.role}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {player.runs}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {player.balls}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {player.fours}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {player.sixes}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {player.strikeRate}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Bowling Scorecard */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {teams.team2?.name} - Bowling
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Bowler
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            O
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            M
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            R
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            W
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Econ
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {getBowlingStats().map((player) => (
                          <tr key={player._id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <span className="text-lg mr-2">{getPlayerRoleIcon(player.role)}</span>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{player.name}</div>
                                  <div className="text-sm text-gray-500">{player.role}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {player.overs}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {player.maidens}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {player.runs}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {player.wickets}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {player.economy}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Commentary Tab */}
            {activeTab === 'commentary' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Ball by Ball Commentary</h3>
                <div className="space-y-4">
                  {ballHistory.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No commentary available yet. Match hasn't started.
                    </div>
                  ) : (
                    ballHistory.map((ball, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">
                            Over {ball.over}.{ball.ball}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            ball.wicket ? 'bg-red-100 text-red-800' :
                            ball.extras ? 'bg-yellow-100 text-yellow-800' :
                            ball.runs === 0 ? 'bg-gray-100 text-gray-800' :
                            ball.runs === 4 ? 'bg-blue-100 text-blue-800' :
                            ball.runs === 6 ? 'bg-purple-100 text-purple-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {ball.wicket ? 'WICKET!' : ball.extras ? 'EXTRA' : `${ball.runs} run${ball.runs !== 1 ? 's' : ''}`}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">
                          {ball.bowler} to {ball.striker}, {
                            ball.wicket ? `${ball.wicket.type} wicket!` :
                            ball.extras ? `${ball.extras.type} - ${ball.extras.runs} run${ball.extras.runs !== 1 ? 's' : ''}` :
                            ball.runs === 0 ? 'no run' :
                            ball.runs === 1 ? 'single' :
                            ball.runs === 2 ? 'couple of runs' :
                            ball.runs === 3 ? 'three runs' :
                            ball.runs === 4 ? 'FOUR!' :
                            ball.runs === 6 ? 'SIX!' :
                            `${ball.runs} runs`
                          }
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveScorecard; 