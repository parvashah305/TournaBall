import mongoose from 'mongoose';

const playerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['batsman', 'bowler', 'all-rounder', 'wicketkeeper'],
    required: true
  },
  jerseyNumber: {
    type: Number,
    required: true
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  age: {
    type: Number,
    default: 0
  },
  battingStyle: {
    type: String,
    enum: ['right-handed', 'left-handed'],
    default: 'right-handed'
  },
  bowlingStyle: {
    type: String,
    enum: ['right-arm-fast', 'left-arm-fast', 'right-arm-spin', 'left-arm-spin', 'none'],
    default: 'none'
  }
}, {
  timestamps: true
});

export default mongoose.model('Player', playerSchema);