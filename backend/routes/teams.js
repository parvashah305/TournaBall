import express from 'express';
import Team from '../models/Team.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Get teams by tournament
router.get('/tournament/:tournamentId', async (req, res) => {
  try {
    const teams = await Team.find({ tournament: req.params.tournamentId })
      .populate('tournament', 'name');
    res.json(teams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single team
router.get('/:id', async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('tournament', 'name');
    
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }
    
    res.json(team);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create team
router.post('/', protect, async (req, res) => {
  try {
    const team = new Team(req.body);
    const savedTeam = await team.save();
    await savedTeam.populate('tournament', 'name');
    
    res.status(201).json(savedTeam);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update team
router.put('/:id', protect, async (req, res) => {
  try {
    const updatedTeam = await Team.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('tournament', 'name');
    
    if (!updatedTeam) {
      return res.status(404).json({ message: 'Team not found' });
    }
    
    res.json(updatedTeam);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete team
router.delete('/:id', protect, async (req, res) => {
  try {
    const team = await Team.findByIdAndDelete(req.params.id);
    
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }
    
    res.json({ message: 'Team deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;