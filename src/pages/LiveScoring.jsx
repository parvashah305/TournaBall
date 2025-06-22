import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Play, 
  Square, 
  RotateCcw, 
  Users, 
  Target, 
  Trophy,
  Crown,
  Zap,
  Clock,
  TrendingUp,
  BarChart3,
  Lock
} from 'lucide-react';
import axios from 'axios';
import io from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';

const LiveScoring = () => {
  const { matchId } = useParams();
  const { user } = useAuth();
  const [match, setMatch] = useState(null);
  const [tournament, setTournament] = useState(null);
  const [teams, setTeams] = useState({ team1: null, team2: null });
  const [players, setPlayers] = useState({ team1: [], team2: [] });
  const [currentInnings, setCurrentInnings] = useState(1);
  const [battingTeam, setBattingTeam] = useState(null);
  const [bowlingTeam, setBowlingTeam] = useState(null);
  const [striker, setStriker] = useState(null);
  const [nonStriker, setNonStriker] = useState(null);
  const [bowler, setBowler] = useState(null);
  const [score, setScore] = useState({ runs: 0, wickets: 0, overs: 0, balls: 0 });
  const [extras, setExtras] = useState({ wides: 0, noBalls: 0, byes: 0, legByes: 0 });
  const [ballHistory, setBallHistory] = useState([]);
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPlayerSelection, setShowPlayerSelection] = useState(false);
  const [showScoringPanel, setShowScoringPanel] = useState(false);
  const [matchStatus, setMatchStatus] = useState('scheduled'); // scheduled, live, completed
  const [showTossModal, setShowTossModal] = useState(false);
  const [tossWinner, setTossWinner] = useState('');
  const [tossDecision, setTossDecision] = useState('bat');
  const [showBowlerModal, setShowBowlerModal] = useState(false);
  const [showNewBatsmanModal, setShowNewBatsmanModal] = useState(false);
  const [extraType, setExtraType] = useState('wides');
  const [extraRuns, setExtraRuns] = useState(1);
  const [pendingWicket, setPendingWicket] = useState(null);

  // Check if current user is tournament owner
  const isTournamentOwner = useMemo(() => {
    if (!tournament || !user) return false;
    const organizerId = typeof tournament.organizer === 'object'
      ? tournament.organizer._id
      : tournament.organizer;
    const result = organizerId === user._id;
    return result;
  }, [tournament, user]);

  useEffect(() => {
    fetchMatchData();
    setupSocket();
    return () => {
      if (socket) socket.disconnect();
    };
  }, [matchId]);

  // Show player selection when match becomes live and no players are selected
  useEffect(() => {
    if (matchStatus === 'live' && !striker && !nonStriker && !bowler) {
      setShowPlayerSelection(true);
    }
  }, [matchStatus, striker, nonStriker, bowler]);

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

    newSocket.on('toss-update', ({ winner, decision }) => {
      setMatch((prev) => ({ ...prev, toss: { winner, decision } }));
      setShowTossModal(false);
    });
  };

  const fetchMatchData = async () => {
    try {
      setLoading(true);
      const matchRes = await axios.get(`/api/matches/${matchId}`);
      const { match: matchData, scores } = matchRes.data;
      setMatch(matchData);
      setMatchStatus(matchData.status);

      // Fetch tournament data to check ownership
      if (matchData.tournament) {
        const tournamentId = typeof matchData.tournament === 'object' 
          ? matchData.tournament._id 
          : matchData.tournament;
        
        try {
          const tournamentRes = await axios.get(`/api/tournaments/${tournamentId}`);
          setTournament(tournamentRes.data);
        } catch (error) {
          console.error('Error fetching tournament:', error);
        }
      }

      // Helper to get team ID whether it's a string or object
      const getTeamId = (team) => typeof team === 'string' ? team : team?._id;

      // Fetch team data
      const [team1Res, team2Res] = await Promise.all([
        axios.get(`/api/teams/${getTeamId(matchData.teamA)}`),
        axios.get(`/api/teams/${getTeamId(matchData.teamB)}`)
      ]);

      setTeams({ team1: team1Res.data, team2: team2Res.data });

      // Fetch players for both teams
      const [team1Players, team2Players] = await Promise.all([
        axios.get(`/api/players/team/${getTeamId(matchData.teamA)}`),
        axios.get(`/api/players/team/${getTeamId(matchData.teamB)}`)
      ]);

      setPlayers({ team1: team1Players.data, team2: team2Players.data });

      // Set batting/bowling teams based on toss
      if (matchData.toss?.winner) {
        updateTeamsFromToss(matchData.toss, { team1: team1Res.data, team2: team2Res.data });
      }

      // Initialize score if match is live
      if (matchData.status === 'live') {
        setScore(matchData.score || { runs: 0, wickets: 0, overs: 0, balls: 0 });
        setExtras(matchData.extras || { wides: 0, noBalls: 0, byes: 0, legByes: 0 });
        setBallHistory(matchData.ballHistory || []);
        setMatchStatus('live');
        
        // Show player selection if no players are selected yet
        if (!striker && !nonStriker && !bowler) {
          setShowPlayerSelection(true);
        }
      }
    } catch (error) {
      console.error('Error fetching match data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTeamsFromToss = (toss, currentTeams) => {
    const { winner, decision } = toss;
    const { team1, team2 } = currentTeams;
    
    const tossWinnerIsTeamA = winner === team1._id;

    if ((tossWinnerIsTeamA && decision === 'bat') || (!tossWinnerIsTeamA && decision === 'bowl')) {
      setBattingTeam(team1);
      setBowlingTeam(team2);
    } else {
      setBattingTeam(team2);
      setBowlingTeam(team1);
    }
  };

  const handleToss = async () => {
    if (!tossWinner) {
      alert('Please select the toss winner.');
      return;
    }
    
    try {
      const tossData = { winner: tossWinner, decision: tossDecision };
      await axios.patch(`/api/matches/${matchId}`, { toss: tossData });

      // Update local state immediately
      setMatch(prev => ({ ...prev, toss: tossData }));
      updateTeamsFromToss(tossData, teams);
      setShowTossModal(false);

      // Notify others via socket
      socket.emit('toss-update', { matchId, ...tossData });
    } catch (error) {
      console.error('Error updating toss:', error);
      alert('Failed to save toss information.');
    }
  };

  const startMatch = async () => {
    if (!match.toss?.winner) {
      alert('Please complete the toss before starting the match.');
      return;
    }
    try {
      await axios.patch(`/api/matches/${matchId}`, { status: 'live' });
      setMatchStatus('live');
      setShowPlayerSelection(true);
      socket.emit('match-started', matchId);
    } catch (error) {
      console.error('Error starting match:', error);
    }
  };

  const selectPlayers = () => {
    if (!striker || !nonStriker || !bowler) {
      alert('Please select all required players');
      return;
    }
    setShowPlayerSelection(false);
    setShowScoringPanel(true);
  };

  const recordBall = async (runs, extras = null, wicket = null) => {
    let legalDelivery = true;
    let rotateStrike = false;
    let newScore = { ...score };
    let newExtras = { ...extras };
    let newBallHistory = [...ballHistory];
    let newStriker = striker;
    let newNonStriker = nonStriker;
    let newBowler = bowler;

    // Handle extras
    if (extras) {
      legalDelivery = extras.type === 'byes' || extras.type === 'legByes'; // Byes/legbyes are legal, others not
      newExtras[extras.type] += extras.runs;
      newScore.runs += extras.runs;
      if (extras.type === 'wides' || extras.type === 'noBalls') {
        legalDelivery = false;
      }
    } else {
      newScore.runs += runs;
      if (striker.isOnStrike) {
        newStriker = {
          ...striker,
          runs: (striker.runs || 0) + runs,
          balls: (striker.balls || 0) + 1,
          fours: (striker.fours || 0) + (runs === 4 ? 1 : 0),
          sixes: (striker.sixes || 0) + (runs === 6 ? 1 : 0)
        };
      } else {
        newNonStriker = {
          ...nonStriker,
          runs: (nonStriker.runs || 0) + runs,
          balls: (nonStriker.balls || 0) + 1,
          fours: (nonStriker.fours || 0) + (runs === 4 ? 1 : 0),
          sixes: (nonStriker.sixes || 0) + (runs === 6 ? 1 : 0)
        };
      }
      if (runs % 2 === 1) rotateStrike = true;
    }

    // Update bowler stats
    if (!extras || extras.type === 'byes' || extras.type === 'legByes') {
      newBowler = {
        ...bowler,
        balls: (bowler.balls || 0) + 1,
        overs: Math.floor(((bowler.balls || 0) + 1) / 6),
        runs: (bowler.runs || 0) + (runs || 0),
        wickets: (bowler.wickets || 0) + (wicket ? 1 : 0)
      };
    } else {
      newBowler = {
        ...bowler,
        runs: (bowler.runs || 0) + (extras.runs || 0)
      };
    }

    // Update score/balls/overs
    if (legalDelivery) {
      newScore.balls += 1;
      if (newScore.balls % 6 === 0) {
        newScore.overs += 1;
        newScore.balls = 0;
      }
    }

    // Add to ball history
    newBallHistory.push({
      runs,
      extras,
      wicket,
      striker: striker.name,
      bowler: bowler.name,
      over: newScore.overs + (legalDelivery && newScore.balls === 0 ? 1 : 0),
      ball: legalDelivery ? (newScore.balls === 0 ? 6 : newScore.balls) : newScore.balls + 1,
      timestamp: new Date()
    });

    // Handle wicket
    if (wicket) {
      newScore.wickets += 1;
      
      // Mark batsman as out in backend
      try {
        await axios.post('/api/scores/wicket', {
          matchId,
          innings: currentInnings,
          batsmanId: striker._id,
          howOut: wicket.type
        });
      } catch (error) {
        console.error('Error updating wicket:', error);
      }
      
      const available = getAvailableBatsmen();
      if (available.length > 0) {
        setPendingWicket({ outPlayer: striker, reason: wicket.type });
        setShowNewBatsmanModal(true);
      } else {
        // Last pair, no selection, just continue
        setPendingWicket(null);
        setShowNewBatsmanModal(false);
      }
    }

    // Handle strike rotation
    if (rotateStrike) {
      [newStriker, newNonStriker] = [newNonStriker, newStriker];
    }
    // End of over: rotate strike and prompt for new bowler
    if (legalDelivery && newScore.balls === 0) {
      [newStriker, newNonStriker] = [newNonStriker, newStriker];
      setShowBowlerModal(true);
    }

    // Save state
    setScore(newScore);
    setExtras(newExtras);
    setBallHistory(newBallHistory);
    setStriker(newStriker);
    setNonStriker(newNonStriker);
    setBowler(newBowler);

    // Persist batsman and bowler stats to backend
    try {
      await axios.post('/api/scores', {
        matchId,
        innings: currentInnings,
        battingTeam: battingTeam?._id,
        bowlingTeam: bowlingTeam?._id,
        runs: newScore.runs,
        wickets: newScore.wickets,
        overs: newScore.overs,
        balls: newScore.balls,
        extras: newExtras,
        currentBatsmen: [
          {
            player: newStriker?._id,
            runs: newStriker?.runs || 0,
            balls: newStriker?.balls || 0,
            fours: newStriker?.fours || 0,
            sixes: newStriker?.sixes || 0,
            isOnStrike: true
          },
          {
            player: newNonStriker?._id,
            runs: newNonStriker?.runs || 0,
            balls: newNonStriker?.balls || 0,
            fours: newNonStriker?.fours || 0,
            sixes: newNonStriker?.sixes || 0,
            isOnStrike: false
          }
        ],
        currentBowler: {
          player: newBowler?._id,
          overs: Math.floor((newBowler?.balls || 0) / 6),
          balls: newBowler?.balls || 0,
          runs: newBowler?.runs || 0,
          wickets: newBowler?.wickets || 0
        },
        ballByBall: newBallHistory.map(b => ({
          over: b.over,
          ball: b.ball,
          runs: b.runs,
          extras: b.extras?.type,
          wicket: b.wicket,
          striker: b.striker,
          bowler: b.bowler
        }))
      });
    } catch (err) {
      console.error('Error updating player stats:', err);
    }

    // Emit to backend/socket
    try {
      await axios.patch(`/api/matches/${matchId}`, {
        score: newScore,
        extras: newExtras,
        ballHistory: newBallHistory
      });
      socket.emit('score-update', {
        matchId,
        score: newScore,
        ballHistory: newBallHistory
      });
    } catch (error) {
      console.error('Error recording ball:', error);
    }

    // Check for match/innings end
    const target = match?.target;
    const maxOvers = match?.overs || 20;
    
    if (
      (currentInnings === 2 && target && newScore.runs >= target) ||
      newScore.wickets >= battingTeamPlayers.length - 1 ||
      (newScore.overs >= maxOvers && newScore.balls === 0)
    ) {
      if (currentInnings === 2) {
        // End match
        let winner, margin, method;
        if (target && newScore.runs >= target) {
          winner = battingTeam._id;
          margin = `${battingTeam.name} won by ${battingTeamPlayers.length - 1 - newScore.wickets} wickets`;
          method = 'chased';
        } else if (newScore.wickets >= battingTeamPlayers.length - 1) {
          winner = bowlingTeam._id;
          margin = `${bowlingTeam.name} won by ${target - newScore.runs} runs`;
          method = 'all out';
        } else {
          winner = bowlingTeam._id;
          margin = `${bowlingTeam.name} won by ${target - newScore.runs} runs`;
          method = 'overs up';
        }
        
        await axios.patch(`/api/matches/${matchId}`, { status: 'completed', result: { winner, margin, method } });
        setMatchStatus('completed');
        socket.emit('match-completed', matchId);
        return;
      } else {
        // End of first innings, start second innings
        await endInnings();
        return;
      }
    }

    // Check if match should end
    if (currentInnings === 2 && currentBall === 6 && currentOver === 19) {
      const winner = scores.team1 > scores.team2 ? match.team1 : match.team2;
      const margin = Math.abs(scores.team1 - scores.team2);
      const method = 'Runs';
      
      // End the match
      await handleMatchEnd(winner, margin, method);
    }
  };

  const endInnings = async () => {
    if (currentInnings === 1) {
      // End of 1st innings, set target for 2nd
      try {
        const target = score.runs + 1;
        await axios.patch(`/api/matches/${matchId}`, { target });
        setMatch(prev => ({ ...prev, target }));
        console.log('Set target for 2nd innings:', target);
      } catch (error) {
        console.error('Error setting target:', error);
      }
      setCurrentInnings(2);
      setBattingTeam(teams.team2);
      setBowlingTeam(teams.team1);
      setScore({ runs: 0, wickets: 0, overs: 0, balls: 0 });
      setExtras({ wides: 0, noBalls: 0, byes: 0, legByes: 0 });
      setBallHistory([]);
      setShowPlayerSelection(true);
    } else {
      // End of match
      const result = {
        winner: score.runs > match.target ? battingTeam._id : bowlingTeam._id,
        method: 'by runs/wickets logic here',
        margin: 'TBD'
      };
      try {
        await axios.patch(`/api/matches/${matchId}`, { status: 'completed', result });
        setMatchStatus('completed');
        socket.emit('match-completed', matchId);
      } catch (error) {
        console.error('Error ending match:', error);
      }
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

  const battingTeamPlayers = useMemo(() => {
    if (!battingTeam || !teams.team1 || !teams.team2) return [];
    return battingTeam._id === teams.team1._id ? players.team1 : players.team2;
  }, [battingTeam, players, teams]);

  const bowlingTeamPlayers = useMemo(() => {
    if (!bowlingTeam || !teams.team1 || !teams.team2) return [];
    return bowlingTeam._id === teams.team1._id ? players.team1 : players.team2;
  }, [bowlingTeam, players, teams]);

  // Helper to get available batsmen (not out and not currently batting)
  const getAvailableBatsmen = () => {
    const all = battingTeamPlayers;
    const outIds = ballHistory.filter(b => b.wicket && b.striker).map(b => b.strikerId);
    const currentIds = [striker?._id, nonStriker?._id].filter(Boolean);
    return all.filter(p => !outIds.includes(p._id) && !currentIds.includes(p._id));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                to={`/tournament/${match.tournament}`}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Tournament
              </Link>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
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

      {/* Match Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {teams.team1?.name || 'Team A'} vs {teams.team2?.name || 'Team B'}
            </h1>
            <p className="text-gray-600">
              {match.venue} • {match.dateTime ? new Date(match.dateTime).toLocaleDateString() : 'Invalid Date'}
            </p>
          </div>

          {/* Total Score Display (for all users) */}
          {matchStatus === 'live' && (
            <div className="mb-6">
              <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">Live Score</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="text-center">
                    <h4 className="text-lg font-semibold text-blue-800 mb-2">{battingTeam?.name}</h4>
                    <div className="text-4xl font-bold text-blue-900 mb-2">
                      {score.runs}/{score.wickets}
                    </div>
                    <div className="text-sm text-blue-700">
                      {formatOvers(score.overs, score.balls)} overs • RR: {getRunRate()}
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      Extras: {Object.values(extras).reduce((a, b) => a + b, 0)} 
                      (W: {extras.wides} NB: {extras.noBalls} B: {extras.byes} LB: {extras.legByes})
                    </div>
                  </div>
                  <div className="text-center">
                    <h4 className="text-lg font-semibold text-green-800 mb-2">Current Innings</h4>
                    <div className="text-3xl font-bold text-green-900 mb-2">
                      {currentInnings}/2
                    </div>
                    <div className="text-sm text-green-700">
                      {currentInnings === 1 ? '1st Innings' : '2nd Innings'}
                    </div>
                    {currentInnings === 2 && match.target && (
                      <div className="text-sm text-yellow-700 mt-2">
                        Target: {match.target} • Need: {match.target - score.runs}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Target Display for 2nd Innings */}
          {matchStatus === 'live' && currentInnings === 2 && match.target && (
            <div className="mb-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">Target</h3>
                <div className="text-2xl font-bold text-yellow-900">
                  {match.target} runs in {match.overs} overs
                </div>
                <div className="text-sm text-yellow-700 mt-2">
                  {score.runs >= match.target ? 'Target Achieved!' : 
                   `Need ${match.target - score.runs} more runs from ${match.overs - score.overs - (score.balls / 6)} overs`}
                </div>
              </div>
            </div>
          )}

          {/* Match Result Display */}
          {matchStatus === 'completed' && match.result && (
            <div className="mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <Trophy className="mx-auto h-12 w-12 text-green-600 mb-4" />
                <h3 className="text-2xl font-bold text-green-800 mb-2">Match Result</h3>
                <div className="text-xl font-semibold text-green-900 mb-2">
                  {teams.team1 && teams.team2 && (
                    match.result.winner === teams.team1._id ? teams.team1.name : teams.team2.name
                  )} won!
                </div>
                <div className="text-lg text-green-700 mb-2">
                  {match.result.margin}
                </div>
                <div className="text-sm text-green-600">
                  Method: {match.result.method}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons - Owner Only */}
          <div className="flex justify-center space-x-4">
            {!isTournamentOwner && matchStatus !== 'completed' && (
              <div className="flex items-center px-6 py-3 bg-gray-100 text-gray-600 rounded-lg">
                <Lock className="h-5 w-5 mr-2" />
                Only tournament owner can control scoring
              </div>
            )}
            
            {isTournamentOwner && matchStatus === 'scheduled' && !match.toss?.winner && (
              <button
                onClick={() => setShowTossModal(true)}
                className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Trophy className="h-5 w-5 mr-2" />
                Conduct Toss
              </button>
            )}
            
            {isTournamentOwner && matchStatus === 'scheduled' && match.toss?.winner && (
              <button
                onClick={startMatch}
                className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Play className="h-5 w-5 mr-2" />
                Start Match
              </button>
            )}

            {isTournamentOwner && matchStatus === 'live' && (
              <>
                <button
                  onClick={() => setShowPlayerSelection(true)}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Change Players
                </button>
                <button
                  onClick={() => setShowScoringPanel(!showScoringPanel)}
                  className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                >
                  <Target className="h-4 w-4 mr-2" />
                  {showScoringPanel ? 'Hide' : 'Show'} Scoring
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Scoring Panel - Owner Only */}
      {isTournamentOwner && showScoringPanel && matchStatus === 'live' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Live Scoring</h2>
            
            {/* Current Players */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Striker</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getPlayerRoleIcon(striker?.role)}</span>
                  <span className="font-semibold">{striker?.name || 'Not selected'}</span>
                </div>
                <div className="text-sm text-gray-600 mt-2">
                  Runs: {striker?.runs || 0} | Balls: {striker?.balls || 0} | 4s: {striker?.fours || 0} | 6s: {striker?.sixes || 0}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Non-Striker</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getPlayerRoleIcon(nonStriker?.role)}</span>
                  <span className="font-semibold">{nonStriker?.name || 'Not selected'}</span>
                </div>
                <div className="text-sm text-gray-600 mt-2">
                  Runs: {nonStriker?.runs || 0} | Balls: {nonStriker?.balls || 0} | 4s: {nonStriker?.fours || 0} | 6s: {nonStriker?.sixes || 0}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Bowler</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getPlayerRoleIcon(bowler?.role)}</span>
                  <span className="font-semibold">{bowler?.name || 'Not selected'}</span>
                </div>
                <div className="text-sm text-gray-600 mt-2">
                  Overs: {bowler?.overs || 0} | Balls: {bowler?.balls || 0} | Runs: {bowler?.runs || 0} | Wickets: {bowler?.wickets || 0}
                </div>
              </div>
            </div>

            {/* Scoring Buttons */}
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Runs</h3>
                <div className="grid grid-cols-4 gap-2">
                  {[0, 1, 2, 3, 4, 5, 6].map((runs) => (
                    <button
                      key={runs}
                      onClick={() => recordBall(runs)}
                      className="px-4 py-2 bg-green-100 text-green-800 rounded-md hover:bg-green-200 transition-colors font-medium"
                    >
                      {runs}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-3">Extras</h3>
                <div className="flex flex-col md:flex-row md:items-center gap-2">
                  <select
                    value={extraType}
                    onChange={e => setExtraType(e.target.value)}
                    className="p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="wides">Wide</option>
                    <option value="noBalls">No Ball</option>
                    <option value="byes">Byes</option>
                    <option value="legByes">Leg Byes</option>
                  </select>
                  <input
                    type="number"
                    min={1}
                    value={extraRuns}
                    onChange={e => setExtraRuns(Number(e.target.value))}
                    className="w-24 p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    placeholder="Runs"
                  />
                  <button
                    onClick={() => recordBall(0, { type: extraType, runs: extraRuns })}
                    className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200 transition-colors font-medium"
                  >
                    Add Extra
                  </button>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-3">Wickets</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <button
                    onClick={() => recordBall(0, null, { type: 'bowled' })}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    Bowled
                  </button>
                  <button
                    onClick={() => recordBall(0, null, { type: 'caught' })}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    Caught
                  </button>
                  <button
                    onClick={() => recordBall(0, null, { type: 'lbw' })}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    LBW
                  </button>
                  <button
                    onClick={() => recordBall(0, null, { type: 'run out' })}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    Run Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Only Message for Non-Owners */}
      {!isTournamentOwner && matchStatus === 'live' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <Lock className="mx-auto h-12 w-12 text-blue-600 mb-4" />
            <h3 className="text-lg font-semibold text-blue-800 mb-2">View Only Mode</h3>
            <p className="text-blue-700">
              You can view the live score and match progress. Only the tournament owner can control scoring.
            </p>
          </div>
        </div>
      )}

      {/* Ball History */}
      {ballHistory.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Ball by Ball</h2>
            <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
              {ballHistory.map((ball, index) => (
                <div
                  key={index}
                  className={`p-2 rounded text-center text-sm font-medium ${
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
        </div>
      )}

      {/* Player Selection Modal */}
      {showPlayerSelection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Players</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Batting Team Players */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">{battingTeam?.name} - Batting</h4>
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Striker</label>
                    <select
                      value={striker?._id || ''}
                      onChange={(e) => {
                        const player = battingTeamPlayers.find(p => p._id === e.target.value);
                        setStriker(player);
                      }}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="">Select Striker</option>
                      {battingTeamPlayers.map((player) => (
                        <option key={player._id} value={player._id} disabled={player._id === nonStriker?._id}>
                          {player.name} ({player.role})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Non-Striker</label>
                    <select
                      value={nonStriker?._id || ''}
                      onChange={(e) => {
                        const player = battingTeamPlayers.find(p => p._id === e.target.value);
                        setNonStriker(player);
                      }}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="">Select Non-Striker</option>
                      {battingTeamPlayers.map((player) => (
                        <option key={player._id} value={player._id} disabled={player._id === striker?._id}>
                          {player.name} ({player.role})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Bowling Team Players */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">{bowlingTeam?.name} - Bowling</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bowler</label>
                  <select
                    value={bowler?._id || ''}
                    onChange={(e) => {
                      const player = bowlingTeamPlayers.find(p => p._id === e.target.value);
                      setBowler(player);
                    }}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">Select Bowler</option>
                    {bowlingTeamPlayers.map((player) => (
                      <option key={player._id} value={player._id}>
                        {player.name} ({player.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex space-x-4 pt-6">
              <button
                onClick={selectPlayers}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
              >
                Confirm Selection
              </button>
              <button
                onClick={() => setShowPlayerSelection(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toss Modal */}
      {showTossModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Conduct Toss</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Toss Winner</label>
                <select
                  value={tossWinner}
                  onChange={(e) => setTossWinner(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Select Team</option>
                  <option value={teams.team1?._id}>{teams.team1?.name}</option>
                  <option value={teams.team2?._id}>{teams.team2?.name}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Decision</label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setTossDecision('bat')}
                    className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                      tossDecision === 'bat' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    Bat
                  </button>
                  <button
                    onClick={() => setTossDecision('bowl')}
                    className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                      tossDecision === 'bowl' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    Bowl
                  </button>
                </div>
              </div>
            </div>

            <div className="flex space-x-4 pt-6">
              <button
                onClick={handleToss}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
              >
                Confirm Toss
              </button>
              <button
                onClick={() => setShowTossModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bowler Selection Modal */}
      {showBowlerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select New Bowler</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bowler</label>
                <select
                  value={bowler?._id || ''}
                  onChange={(e) => {
                    const player = bowlingTeamPlayers.find(p => p._id === e.target.value);
                    setBowler(player);
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Select Bowler</option>
                  {bowlingTeamPlayers.map((player) => (
                    <option key={player._id} value={player._id}>
                      {player.name} ({player.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex space-x-4 pt-6">
              <button
                onClick={() => setShowBowlerModal(false)}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
              >
                Confirm Selection
              </button>
              <button
                onClick={() => setShowBowlerModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Batsman Selection Modal */}
      {showNewBatsmanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select New Batsman</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Batsman</label>
                <select
                  value={striker?._id || ''}
                  onChange={(e) => {
                    const player = battingTeamPlayers.find(p => p._id === e.target.value);
                    setStriker(player);
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Select Batsman</option>
                  {battingTeamPlayers.map((player) => (
                    <option key={player._id} value={player._id}>
                      {player.name} ({player.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex space-x-4 pt-6">
              <button
                onClick={() => setShowNewBatsmanModal(false)}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
              >
                Confirm Selection
              </button>
              <button
                onClick={() => setShowNewBatsmanModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveScoring;