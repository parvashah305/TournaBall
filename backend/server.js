import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import authRoutes from './routes/auth.js';
import tournamentRoutes from './routes/tournaments.js';
import teamRoutes from './routes/teams.js';
import playerRoutes from './routes/players.js';
import matchRoutes from './routes/matches.js';
import scoreRoutes from './routes/scores.js';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB connection with error handling
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/cricket-tournament';
    console.log('Environment variables loaded:');
    console.log('MONGO_URI:', process.env.MONGO_URI ? 'Found' : 'Not found');
    console.log('Using MongoDB URI:', mongoURI.includes('mongodb+srv') ? 'Atlas (Cloud)' : 'Local');
    
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.warn('MongoDB connection failed:', error.message);
    console.log('Running in development mode without database');
    
    // Set a flag to indicate we're running without DB
    app.set('dbConnected', false);
  }
};

// Connect to database
connectDB();

mongoose.connection.on('connected', () => {
  console.log('MongoDB connected successfully');
  app.set('dbConnected', true);
});

mongoose.connection.on('error', (err) => {
  console.warn('MongoDB connection error:', err.message);
  app.set('dbConnected', false);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
  app.set('dbConnected', false);
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-match', (matchId) => {
    socket.join(`match-${matchId}`);
    console.log(`User ${socket.id} joined match room: match-${matchId}`);
  });

  socket.on('score-update', (data) => {
    socket.to(`match-${data.matchId}`).emit('score-update', data);
  });

  socket.on('match-started', (matchId) => {
    socket.to(`match-${matchId}`).emit('match-status', 'live');
  });

  socket.on('match-completed', (matchId) => {
    socket.to(`match-${matchId}`).emit('match-status', 'completed');
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make io accessible to routes
app.set('io', io);

// Middleware to check database connection
app.use((req, res, next) => {
  req.dbConnected = app.get('dbConnected') !== false;
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/scores', scoreRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'Server is running!',
    database: req.dbConnected ? 'connected' : 'disconnected'
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});