import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Trophy, Calendar, MapPin, Activity, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import io from 'socket.io-client';

const MatchDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    fetchMatchData();
    
    // Setup Socket.io connection
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    // Join match room
    newSocket.emit('join-match', id);

    // Listen for score updates
    newSocket.on('score-updated', (updatedScore) => {
      setMatchData(prev => ({
        ...prev,
        scores: prev.scores.map(score => 
          score._id === updatedScore._id ? updatedScore : score
        )
      }));
    });

    return () => {
      newSocket.disconnect();
    };
  }, [id]);

  const fetchMatchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/matches/${id}`);
      setMatchData(response.data);
    } catch (error) {
      console.error('Error fetching match data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
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

  const calculateRunRate = (runs, overs, balls) => {
    const totalOvers = overs + (balls / 6);
    return totalOvers > 0 ? (runs / totalOvers).toFixed(2) : '0.00';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!matchData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Trophy className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Match not found</h3>
        </div>
      </div>
    );
  }

  const { match, scores } = matchData;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Match Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(match.status)}`}>
                {match.status === 'live' && (
                  <div className="flex items-center">
                    <div className="h-2 w-2 bg-green-600 rounded-full mr-2 animate-pulse"></div>
                    LIVE
                  </div>
                )}
                {match.status !== 'live' && match.status.charAt(0).toUpperCase() + match.status.slice(1)}
              </span>
              <h1 className="text-2xl font-bold text-gray-900">
                {match.tournament?.name || 'Cricket Match'}
              </h1>
            </div>
            {user && (
              <Link
                to={`/live-scoring/${match._id}`}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                Live Scoring Panel
              </Link>
            )}
          </div>

          {/* Teams Display */}
          <div className="flex items-center justify-center space-x-8 py-6">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                {match.teamA.logo ? (
                  <img src={match.teamA.logo} alt={match.teamA.name} className="h-16 w-16 rounded-full" />
                ) : (
                  <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <Trophy className="h-8 w-8 text-blue-600" />
                  </div>
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{match.teamA.name}</h3>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-gray-400 mb-2">VS</div>
              <div className="text-sm text-gray-600">
                <div className="flex items-center justify-center mb-1">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>{formatDateTime(match.dateTime)}</span>
                </div>
                <div className="flex items-center justify-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{match.venue}</span>
                </div>
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                {match.teamB.logo ? (
                  <img src={match.teamB.logo} alt={match.teamB.name} className="h-16 w-16 rounded-full" />
                ) : (
                  <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
                    <Trophy className="h-8 w-8 text-red-600" />
                  </div>
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{match.teamB.name}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Scoreboard */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {scores.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Activity className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No scores available</h3>
            <p className="text-gray-600">Scores will appear here once the match begins.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {scores.map((score, index) => (
              <div key={score._id} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="bg-green-600 text-white px-6 py-3">
                  <h3 className="text-lg font-semibold">
                    {score.battingTeam.name} - Innings {score.innings}
                  </h3>
                </div>
                
                <div className="p-6">
                  {/* Score Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-3xl font-bold text-gray-900">
                        {score.runs}/{score.wickets}
                      </div>
                      <div className="text-sm text-gray-600">Score</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">
                        {score.overs}.{score.balls}
                      </div>
                      <div className="text-sm text-gray-600">Overs</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">
                        {calculateRunRate(score.runs, score.overs, score.balls)}
                      </div>
                      <div className="text-sm text-gray-600">Run Rate</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">
                        {score.extras.wides + score.extras.noBalls + score.extras.byes + score.extras.legByes}
                      </div>
                      <div className="text-sm text-gray-600">Extras</div>
                    </div>
                  </div>

                  {/* Current Batsmen */}
                  {score.currentBatsmen.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Current Batsmen</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {score.currentBatsmen.map((batsman, batsmanIndex) => (
                          <div key={batsmanIndex} className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <User className="h-5 w-5 text-gray-400 mr-2" />
                                <span className="font-medium">{batsman.player?.name}</span>
                                {batsman.isOnStrike && (
                                  <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                    On Strike
                                  </span>
                                )}
                              </div>
                              <div className="text-right text-sm">
                                <div className="font-semibold">{batsman.runs}* ({batsman.balls})</div>
                                <div className="text-gray-600">4s: {batsman.fours} | 6s: {batsman.sixes}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Current Bowler */}
                  {score.currentBowler.player && (
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Current Bowler</h4>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <User className="h-5 w-5 text-gray-400 mr-2" />
                            <span className="font-medium">{score.currentBowler.player.name}</span>
                          </div>
                          <div className="text-right text-sm">
                            <div className="font-semibold">
                              {score.currentBowler.overs} overs - {score.currentBowler.runs} runs - {score.currentBowler.wickets} wickets
                            </div>
                            <div className="text-gray-600">
                              Economy: {score.currentBowler.overs > 0 ? (score.currentBowler.runs / score.currentBowler.overs).toFixed(2) : '0.00'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Ball by Ball (Recent balls) */}
                  {score.ballByBall.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Recent Balls</h4>
                      <div className="flex flex-wrap gap-2">
                        {score.ballByBall.slice(-12).map((ball, ballIndex) => (
                          <div
                            key={ballIndex}
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                              ball.wicket ? 'bg-red-100 text-red-800' :
                              ball.runs >= 4 ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {ball.wicket ? 'W' : ball.runs}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Match Result */}
        {match.result?.winner && (
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="text-center">
              <Trophy className="mx-auto h-8 w-8 text-yellow-600 mb-2" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Match Result</h3>
              <p className="text-lg text-gray-800">
                <strong>{match.result.winner.name}</strong> won {match.result.margin && `by ${match.result.margin}`}
              </p>
              {match.result.manOfTheMatch && (
                <p className="text-gray-600 mt-2">
                  Man of the Match: <strong>{match.result.manOfTheMatch.name}</strong>
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchDetail;