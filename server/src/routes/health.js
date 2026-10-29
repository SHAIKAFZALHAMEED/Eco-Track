const express = require('express');
const router = express.Router();
const { pool, testConnection } = require('../db');

router.get('/health', async (req, res) => {
  const start = Date.now();
  try {
    const connTest = await testConnection();
    const latency = Date.now() - start;

    if (!connTest.ok) {
      return res.status(503).json({
        status: 'degraded',
        database: {
          connected: false,
          error: connTest.message
        },
        timestamp: new Date().toISOString()
      });
    }

    // Retrieve live table counts
    const [counts] = await pool.query(`
      SELECT 'buildings' AS table_name, COUNT(*) AS count FROM buildings
      UNION ALL
      SELECT 'categories', COUNT(*) FROM categories
      UNION ALL
      SELECT 'emission_factors', COUNT(*) FROM emission_factors
      UNION ALL
      SELECT 'emission_records', COUNT(*) FROM emission_records
    `);

    const tableCounts = {};
    counts.forEach(row => {
      tableCounts[row.table_name] = Number(row.count);
    });

    const [version] = await pool.query('SELECT VERSION() AS mysql_version');

    res.json({
      status: 'healthy',
      database: {
        connected: true,
        host: process.env.MYSQL_HOST || 'localhost',
        port: parseInt(process.env.MYSQL_PORT, 10) || 3306,
        database: process.env.MYSQL_DATABASE || 'ecotrack_campus',
        version: version[0]?.mysql_version || '8.0',
        latencyMs: latency,
        tables: tableCounts
      },
      server: {
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString()
      }
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      database: {
        connected: false,
        error: err.message
      },
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;

