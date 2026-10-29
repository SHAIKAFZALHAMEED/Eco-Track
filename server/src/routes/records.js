const express = require('express');
const router = express.Router();
const recordService = require('../services/recordService');

router.get('/', async (req, res, next) => {
  try {
    const { category_id, category_code, building_id, startDate, endDate, search, page, limit, all } = req.query;
    const result = await recordService.getRecords({
      category_id,
      category_code,
      building_id,
      startDate,
      endDate,
      search,
      page,
      limit,
      all: all === 'true'
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const record = await recordService.getRecordById(req.params.id);
    if (!record) {
      return res.status(404).json({ error: { message: `Emission record with ID ${req.params.id} not found.` } });
    }
    res.json({ data: record });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const created = await recordService.createRecord(req.body);
    res.status(201).json({
      message: 'Emission record logged successfully.',
      data: created
    });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const updated = await recordService.updateRecord(req.params.id, req.body);
    res.json({
      message: 'Emission record updated successfully.',
      data: updated
    });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const result = await recordService.deleteRecord(req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

