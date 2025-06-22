import express from 'express';
import Tournament from '../models/Tournament.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// Get all tournaments
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};
    
    if (status) {
      query.status = status;
    }

    const tournaments = await Tournament.find(query)
      .populate('organizer', 'name email')
      .sort({ startDate: -1 });
    
    res.json(tournaments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single tournament
router.get('/:id', async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id)
      .populate('organizer', '_id name email');
    
    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }
    
    res.json(tournament);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create tournament
router.post('/', protect, async (req, res) => {
  try {
    const tournament = new Tournament({
      ...req.body,
      organizer: req.user._id
    });
    
    const savedTournament = await tournament.save();
    await savedTournament.populate('organizer', 'name email');
    
    res.status(201).json(savedTournament);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update tournament
router.put('/:id', protect, async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    
    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }
    
    // Check if user is organizer or admin
    if (tournament.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this tournament' });
    }
    
    const updatedTournament = await Tournament.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('organizer', 'name email');
    
    res.json(updatedTournament);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete tournament
router.delete('/:id', protect, async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    
    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }
    
    // Check if user is organizer or admin
    if (tournament.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this tournament' });
    }
    
    await Tournament.findByIdAndDelete(req.params.id);
    res.json({ message: 'Tournament deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;