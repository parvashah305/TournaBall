import express from 'express';
import Player from '../models/Player.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/team/:teamId', async (req, res) => {
  try {
    const players = await Player.find({ team: req.params.teamId })
      .populate('team', 'name')
      .sort({ jerseyNumber: 1 });
    res.json(players);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const player = await Player.findById(req.params.id)
      .populate('team', 'name');
    
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }
    
    res.json(player);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const player = new Player(req.body);
    const savedPlayer = await player.save();
    await savedPlayer.populate('team', 'name');
    
    res.status(201).json(savedPlayer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const updatedPlayer = await Player.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('team', 'name');
    
    if (!updatedPlayer) {
      return res.status(404).json({ message: 'Player not found' });
    }
    
    res.json(updatedPlayer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const player = await Player.findByIdAndDelete(req.params.id);
    
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }
    
    res.json({ message: 'Player deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;