import express from 'express';
import Score from '../models/Score.js';
import Match from '../models/Match.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/match/:matchId', async (req, res) => {
  try {
    console.log('GET /api/scores/match/:matchId - Fetching scores for match:', req.params.matchId);
    
    const scores = await Score.find({ match: req.params.matchId })
      .populate('battingTeam', 'name')
      .populate('bowlingTeam', 'name')
      .populate('currentBatsmen.player', 'name jerseyNumber')
      .populate('allBatsmen.player', 'name jerseyNumber role')
      .populate('currentBowler.player', 'name jerseyNumber')
      .populate('allBowlers.player', 'name jerseyNumber role')
      .sort({ innings: 1 });
    
    console.log('Found scores:', scores.length);
    scores.forEach((score, index) => {
      console.log(`Score ${index + 1} (Innings ${score.innings}):`, {
        allBatsmen: score.allBatsmen?.length || 0,
        allBowlers: score.allBowlers?.length || 0,
        runs: score.runs,
        wickets: score.wickets
      });
    });
    
    res.json(scores);
  } catch (error) {
    console.error('Error in GET /api/scores/match/:matchId:', error);
    res.status(500).json({ message: error.message });
  }
});


router.post('/', protect, async (req, res) => {
  try {
    const io = req.app.get('io');
    const { matchId, innings, ...scoreData } = req.body;

    console.log('POST /api/scores - Received data:', {
      matchId,
      innings,
      currentBatsmen: scoreData.currentBatsmen,
      currentBowler: scoreData.currentBowler,
      runs: scoreData.runs,
      wickets: scoreData.wickets
    });

    let score = await Score.findOne({ match: matchId, innings });
    
    if (score) {
      console.log('Updating existing score for innings:', innings);
      
      Object.assign(score, scoreData);
      
      
      if (scoreData.currentBatsmen) {
        console.log('Updating allBatsmen with:', scoreData.currentBatsmen);
        scoreData.currentBatsmen.forEach(currentBatsman => {
          const existingIndex = score.allBatsmen.findIndex(
            batsman => batsman.player.toString() === currentBatsman.player
          );
          
          if (existingIndex >= 0) {
            
            const existing = score.allBatsmen[existingIndex];
            score.allBatsmen[existingIndex] = {
              ...existing,
              ...currentBatsman,
              runs: (existing.runs || 0) + (currentBatsman.runs || 0),
              balls: (existing.balls || 0) + (currentBatsman.balls || 0),
              fours: (existing.fours || 0) + (currentBatsman.fours || 0),
              sixes: (existing.sixes || 0) + (currentBatsman.sixes || 0),
              isOut: existing.isOut || false
            };
            console.log('Updated existing batsman:', currentBatsman.player);
          } else {
            
            score.allBatsmen.push({
              ...currentBatsman,
              isOut: false
            });
            console.log('Added new batsman:', currentBatsman.player);
          }
        });
      }
      
      if (scoreData.currentBowler) {
        console.log('Updating allBowlers with:', scoreData.currentBowler);
        const existingIndex = score.allBowlers.findIndex(
          bowler => bowler.player.toString() === scoreData.currentBowler.player
        );
        
        if (existingIndex >= 0) {
          
          const existing = score.allBowlers[existingIndex];
          score.allBowlers[existingIndex] = {
            ...existing,
            ...scoreData.currentBowler,
            overs: Math.floor(((existing.balls || 0) + (scoreData.currentBowler.balls || 0)) / 6),
            balls: (existing.balls || 0) + (scoreData.currentBowler.balls || 0),
            runs: (existing.runs || 0) + (scoreData.currentBowler.runs || 0),
            wickets: (existing.wickets || 0) + (scoreData.currentBowler.wickets || 0)
          };
          console.log('Updated existing bowler:', scoreData.currentBowler.player);
        } else {
        
          score.allBowlers.push(scoreData.currentBowler);
          console.log('Added new bowler:', scoreData.currentBowler.player);
        }
      }
      
      await score.save();
      console.log('Score saved successfully. allBatsmen count:', score.allBatsmen.length);
    } else {
      console.log('Creating new score for innings:', innings);
      
      score = new Score({
        match: matchId,
        innings,
        ...scoreData
      });
      
   
      if (scoreData.currentBatsmen) {
        score.allBatsmen = scoreData.currentBatsmen.map(batsman => ({
          ...batsman,
          isOut: false
        }));
        console.log('Initialized allBatsmen with:', score.allBatsmen.length, 'players');
      }
      
      if (scoreData.currentBowler) {
        score.allBowlers = [scoreData.currentBowler];
        console.log('Initialized allBowlers with:', score.allBowlers.length, 'players');
      }
      
      await score.save();
    }

    await score.populate([
      { path: 'battingTeam', select: 'name' },
      { path: 'bowlingTeam', select: 'name' },
      { path: 'currentBatsmen.player', select: 'name jerseyNumber' },
      { path: 'allBatsmen.player', select: 'name jerseyNumber role' },
      { path: 'currentBowler.player', select: 'name jerseyNumber' },
      { path: 'allBowlers.player', select: 'name jerseyNumber role' }
    ]);

    console.log('Final score data:', {
      allBatsmen: score.allBatsmen.map(b => ({ name: b.player?.name, runs: b.runs, balls: b.balls })),
      allBowlers: score.allBowlers.map(b => ({ name: b.player?.name, wickets: b.wickets, runs: b.runs }))
    });

    
    io.to(`match-${matchId}`).emit('score-updated', score);
    
    res.json(score);
  } catch (error) {
    console.error('Error in POST /api/scores:', error);
    res.status(400).json({ message: error.message });
  }
});


router.post('/ball', protect, async (req, res) => {
  try {
    const io = req.app.get('io');
    const { matchId, innings, ballData } = req.body;

    const score = await Score.findOne({ match: matchId, innings });
    
    if (!score) {
      return res.status(404).json({ message: 'Score not found' });
    }

   
    score.ballByBall.push(ballData);
    

    score.runs += ballData.runs || 0;
    if (ballData.wicket) {
      score.wickets += 1;
    }
    
  
    score.balls += 1;
    if (score.balls % 6 === 0) {
      score.overs += 1;
      score.balls = 0;
    }

    await score.save();
    await score.populate([
      { path: 'battingTeam', select: 'name' },
      { path: 'bowlingTeam', select: 'name' },
      { path: 'currentBatsmen.player', select: 'name jerseyNumber' },
      { path: 'allBatsmen.player', select: 'name jerseyNumber role' },
      { path: 'currentBowler.player', select: 'name jerseyNumber' },
      { path: 'allBowlers.player', select: 'name jerseyNumber role' }
    ]);

  
    io.to(`match-${matchId}`).emit('score-updated', score);
    
    res.json(score);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/wicket', protect, async (req, res) => {
  try {
    const io = req.app.get('io');
    const { matchId, innings, batsmanId, howOut } = req.body;

    const score = await Score.findOne({ match: matchId, innings });
    
    if (!score) {
      return res.status(404).json({ message: 'Score not found' });
    }

    
    const batsmanIndex = score.allBatsmen.findIndex(
      batsman => batsman.player.toString() === batsmanId
    );
    
    if (batsmanIndex >= 0) {
      score.allBatsmen[batsmanIndex].isOut = true;
      score.allBatsmen[batsmanIndex].howOut = howOut;
    }

    await score.save();
    await score.populate([
      { path: 'battingTeam', select: 'name' },
      { path: 'bowlingTeam', select: 'name' },
      { path: 'currentBatsmen.player', select: 'name jerseyNumber' },
      { path: 'allBatsmen.player', select: 'name jerseyNumber role' },
      { path: 'currentBowler.player', select: 'name jerseyNumber' },
      { path: 'allBowlers.player', select: 'name jerseyNumber role' }
    ]);

   
    io.to(`match-${matchId}`).emit('score-updated', score);
    
    res.json(score);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;