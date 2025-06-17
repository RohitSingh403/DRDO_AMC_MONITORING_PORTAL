require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Initialize database connection and models
require('./models/db');

// Import routes and middleware
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const taskRoutes = require('./routes/tasks');
const equipmentRoutes = require('./routes/equipment');
const logsRoutes = require('./routes/logs');
const { authorizeRoute } = require('./middleware/auth');

// Import seed function
const seedDatabase = require('./models/seed');

// Import reminders system
const { initReminders } = require('./utils/reminders');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply authentication middleware to all routes
app.use(authorizeRoute);

// Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/tasks', taskRoutes);
app.use('/equipment', equipmentRoutes);
app.use('/logs', logsRoutes);

// Serve static files from uploads directory
app.use('/uploads', express.static(uploadsDir));

// Basic route for health check
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'AMC Monitoring API Server is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Function to start server on the next available port
const startServer = async (port) => {
  const server = app.listen(port, async () => {
    console.log(`Server is running on http://localhost:${port}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    
    // Seed database with initial data
    try {
      if (process.env.NODE_ENV !== 'production') {
        console.log('Seeding database with initial data...');
        await seedDatabase();
        console.log('Database seeding completed');
      }
    } catch (error) {
      console.error('Error seeding database:', error);
    }
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} is in use, trying port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });

  return server;
};

// Initialize reminders system
initReminders();

// Start the server
startServer(PORT);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  // Close server & exit process
  // server.close(() => process.exit(1));
});

module.exports = app;