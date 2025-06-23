import mongoose from 'mongoose';

const matchSchema = new mongoose.Schema({
  teamA: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  teamB: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  tournament: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament',
    required: true
  },
  dateTime: {
    type: Date,
    required: true
  },
  venue: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'live', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  toss: {
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team'
    },
    decision: {
      type: String,
      enum: ['bat', 'bowl']
    }
  },
  result: {
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team'
    },
    method: { type: String },
    margin: String,
    manOfTheMatch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player'
    }
  },
  currentInnings: {
    type: Number,
    default: 1
  },
  overs: {
    type: Number,
    default: 20
  },
 
  score: {
    runs: { type: Number, default: 0 },
    wickets: { type: Number, default: 0 },
    overs: { type: Number, default: 0 },
    balls: { type: Number, default: 0 }
  },
  extras: {
    wides: { type: Number, default: 0 },
    noBalls: { type: Number, default: 0 },
    byes: { type: Number, default: 0 },
    legByes: { type: Number, default: 0 }
  },
  ballHistory: [{
    runs: { type: Number, default: 0 },
    extras: {
      type: { type: String },
      runs: { type: Number }
    },
    wicket: {
      type: { type: String },
      player: { type: String }
    },
    striker: { type: String },
    bowler: { type: String },
    over: { type: Number },
    ball: { type: Number },
    timestamp: { type: Date, default: Date.now }
  }],
  target: { type: Number },
  battingTeam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  bowlingTeam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  }
}, {
  timestamps: true
});

export default mongoose.model('Match', matchSchema);