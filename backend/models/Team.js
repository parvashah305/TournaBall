import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  logo: {
    type: String,
    default: ''
  },
  tournament: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament',
    required: true
  },
  captain: {
    type: String,
    default: ''
  },
  coach: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

export default mongoose.model('Team', teamSchema);