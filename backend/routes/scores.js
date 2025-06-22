import express from 'express';
import Score from '../models/Score.js';
import Match from '../models/Match.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Get score for a match
router.get('/match/:matchId', async (req, res) => {
  try {
    const scores = await Score.find({ match: req.params.matchId })
      .populate('battingTeam', 'name')
      .populate('bowlingTeam', 'name')
      .populate('currentBatsmen.player', 'name jerseyNumber')
      .populate('currentBowler.player', 'name jerseyNumber')
      .sort({ innings: 1 });
    
    res.json(scores);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create or update score
router.post('/', protect, async (req, res) => {
  try {
    const io = req.app.get('io');
    const { matchId, innings, ...scoreData } = req.body;

    let score = await Score.findOne({ match: matchId, innings });
    
    if (score) {
      // Update existing score
      Object.assign(score, scoreData);
      await score.save();
    } else {
      // Create new score
      score = new Score({
        match: matchId,
        innings,
        ...scoreData
      });
      await score.save();
    }

    await score.populate([
      { path: 'battingTeam', select: 'name' },
      { path: 'bowlingTeam', select: 'name' },
      { path: 'currentBatsmen.player', select: 'name jerseyNumber' },
      { path: 'currentBowler.player', select: 'name jerseyNumber' }
    ]);

    // Emit real-time update
    io.to(`match-${matchId}`).emit('score-updated', score);
    
    res.json(score);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Add ball to score
router.post('/ball', protect, async (req, res) => {
  try {
    const io = req.app.get('io');
    const { matchId, innings, ballData } = req.body;

    const score = await Score.findOne({ match: matchId, innings });
    
    if (!score) {
      return res.status(404).json({ message: 'Score not found' });
    }

    // Add ball to ball-by-ball record
    score.ballByBall.push(ballData);
    
    // Update totals based on ball data
    score.runs += ballData.runs || 0;
    if (ballData.wicket) {
      score.wickets += 1;
    }
    
    // Update balls and overs
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
      { path: 'currentBowler.player', select: 'name jerseyNumber' }
    ]);

    // Emit real-time update
    io.to(`match-${matchId}`).emit('score-updated', score);
    
    res.json(score);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;