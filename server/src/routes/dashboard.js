const express = require('express');
const router = express.Router();
const dashboardService = require('../services/dashboardService');

router.get('/', async (req, res, next) => {
  try {
    const { period, startDate, endDate } = req.query;
    const data = await dashboardService.getDashboardData({
      period: period || 'monthly',
      startDate,
      endDate
    });
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

