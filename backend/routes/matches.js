import express from 'express';
import Match from '../models/Match.js';
import Score from '../models/Score.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/tournament/:tournamentId', async (req, res) => {
  try {
    const matches = await Match.find({ tournament: req.params.tournamentId })
      .populate('teamA', 'name logo')
      .populate('teamB', 'name logo')
      .populate('tournament', 'name')
      .sort({ dateTime: 1 });
    res.json(matches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate('teamA', 'name logo')
      .populate('teamB', 'name logo')
      .populate('tournament', 'name')
      .populate('toss.winner', 'name')
      .populate('result.winner', 'name')
      .populate('result.manOfTheMatch', 'name');
    
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    const scores = await Score.find({ match: req.params.id })
      .populate('battingTeam', 'name')
      .populate('bowlingTeam', 'name')
      .populate('currentBatsmen.player', 'name jerseyNumber')
      .populate('currentBowler.player', 'name jerseyNumber');
    
    res.json({ match, scores });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const match = new Match(req.body);
    const savedMatch = await match.save();
    await savedMatch.populate([
      { path: 'teamA', select: 'name logo' },
      { path: 'teamB', select: 'name logo' },
      { path: 'tournament', select: 'name' }
    ]);
    
    res.status(201).json(savedMatch);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const updatedMatch = await Match.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate([
      { path: 'teamA', select: 'name logo' },
      { path: 'teamB', select: 'name logo' },
      { path: 'tournament', select: 'name' },
      { path: 'toss.winner', select: 'name' },
      { path: 'result.winner', select: 'name' },
      { path: 'result.manOfTheMatch', select: 'name' }
    ]);
    
    if (!updatedMatch) {
      return res.status(404).json({ message: 'Match not found' });
    }
    
    res.json(updatedMatch);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.patch('/:id', protect, async (req, res) => {
  try {
    const updateData = {};
    
    
    if (req.body.status) {
      updateData.status = req.body.status;
    }
 
    if (req.body.score) {
      updateData.score = req.body.score;
    }

    if (req.body.extras) {
      updateData.extras = req.body.extras;
    }
   
    if (req.body.ballHistory) {
      updateData.ballHistory = req.body.ballHistory;
    }
    
    if (req.body.target) {
      updateData.target = req.body.target;
    }
    
    const updatedMatch = await Match.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate([
      { path: 'teamA', select: 'name logo' },
      { path: 'teamB', select: 'name logo' },
      { path: 'tournament', select: 'name' }
    ]);
    
    if (!updatedMatch) {
      return res.status(404).json({ message: 'Match not found' });
    }
    
    res.json(updatedMatch);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const match = await Match.findByIdAndDelete(req.params.id);
    
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }
   
    await Score.deleteMany({ match: req.params.id });
    
    res.json({ message: 'Match deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;