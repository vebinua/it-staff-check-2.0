const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { testConnection } = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const itcheckRoutes = require('./routes/itcheck');
const usersRoutes = require('./routes/users');
const activityRoutes = require('./routes/activity');
const migrateRoutes = require('./routes/migrate');
const chapmancgRoutes = require('./routes/chapmancg');
const internallogRoutes = require('./routes/internallog');
const creditsRoutes = require('./routes/credits');
const licensesRoutes = require('./routes/licenses');
const passwordsRoutes = require('./routes/passwords');
const ticketsRoutes = require('./routes/tickets');
const feedbackRoutes = require('./routes/feedback');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/itcheck', itcheckRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/migrate', migrateRoutes);
app.use('/api/chapmancg', chapmancgRoutes);
app.use('/api/internallog', internallogRoutes);
app.use('/api/credits', creditsRoutes);
app.use('/api/licenses', licensesRoutes);
app.use('/api/passwords', passwordsRoutes);
app.use('/api/tickets', ticketsRoutes);
app.use('/api/feedback', feedbackRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await testConnection();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 API available at http://localhost:${PORT}/api`);
      if (process.env.NODE_ENV === 'production') {
        console.log(`🌐 Frontend served at http://localhost:${PORT}`);
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;