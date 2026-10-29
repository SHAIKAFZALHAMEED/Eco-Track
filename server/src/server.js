const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { testConnection } = require('./db');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const healthRoutes = require('./routes/health');
const buildingRoutes = require('./routes/buildings');
const categoryRoutes = require('./routes/categories');
const factorRoutes = require('./routes/factors');
const recordRoutes = require('./routes/records');
const reportRoutes = require('./routes/reports');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 5000;

// Enable CORS for frontend Vite dev server (usually port 5173 or any origin in local dev)
app.use(cors({
  origin: true,
  credentials: true
}));

// Body parser
app.use(express.json());

// API Routes
app.use('/api', healthRoutes);
app.use('/api/buildings', buildingRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/factors', factorRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Root informational endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'EcoTrack Campus REST API',
    version: '1.0.0',
    description: 'Campus Carbon Emission Monitoring and Analytics System API',
    endpoints: {
      health: 'GET /api/health',
      dashboard: 'GET /api/dashboard?period=monthly',
      buildings: 'GET /api/buildings',
      categories: 'GET /api/categories',
      factors: 'GET /api/factors',
      records: 'GET /api/records',
      reports: 'GET /api/reports',
      reportsExport: 'GET /api/reports/export'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: `Route ${req.method} ${req.originalUrl} not found.`,
      status: 404
    }
  });
});

// Centralized error handler
app.use(errorHandler);

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, async () => {
    console.log(`====================================================`);
    console.log(`🌿 EcoTrack Campus Backend running on port ${PORT}`);
    console.log(`📡 URL: http://localhost:${PORT}`);
    console.log(`====================================================`);

    const dbStatus = await testConnection();
    if (dbStatus.ok) {
      console.log(`✅ MySQL connection established to "${process.env.MYSQL_DATABASE}"`);
    } else {
      console.error(`❌ MySQL connection failed: ${dbStatus.message}`);
    }
  });
}

module.exports = app;

