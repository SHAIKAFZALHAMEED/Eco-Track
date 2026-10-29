const express = require('express');
const router = express.Router();
const reportService = require('../services/reportService');

router.get('/', async (req, res, next) => {
  try {
    const { period, startDate, endDate, building_id, category_id } = req.query;
    const report = await reportService.getReportData({
      period,
      startDate,
      endDate,
      building_id,
      category_id
    });
    res.json({ data: report });
  } catch (err) {
    next(err);
  }
});

router.get('/export', async (req, res, next) => {
  try {
    const { period, startDate, endDate, building_id, category_id } = req.query;
    const report = await reportService.getReportData({
      period,
      startDate,
      endDate,
      building_id,
      category_id
    });

    const csvContent = reportService.generateCSV(report);
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `ecotrack-campus-report-${period || 'custom'}-${dateStr}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvContent);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

