import mongoose from 'mongoose';

const scoreSchema = new mongoose.Schema({
  match: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: true
  },
  innings: {
    type: Number,
    required: true
  },
  battingTeam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  bowlingTeam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  runs: {
    type: Number,
    default: 0
  },
  wickets: {
    type: Number,
    default: 0
  },
  overs: {
    type: Number,
    default: 0
  },
  balls: {
    type: Number,
    default: 0
  },
  extras: {
    wides: { type: Number, default: 0 },
    noBalls: { type: Number, default: 0 },
    byes: { type: Number, default: 0 },
    legByes: { type: Number, default: 0 }
  },
  currentBatsmen: [{
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player'
    },
    runs: { type: Number, default: 0 },
    balls: { type: Number, default: 0 },
    fours: { type: Number, default: 0 },
    sixes: { type: Number, default: 0 },
    isOnStrike: { type: Boolean, default: false }
  }],
  currentBowler: {
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player'
    },
    overs: { type: Number, default: 0 },
    runs: { type: Number, default: 0 },
    wickets: { type: Number, default: 0 }
  },
  ballByBall: [{
    over: Number,
    ball: Number,
    runs: Number,
    extras: String,
    wicket: {
      type: String,
      player: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player'
      }
    }
  }]
}, {
  timestamps: true
});

export default mongoose.model('Score', scoreSchema);