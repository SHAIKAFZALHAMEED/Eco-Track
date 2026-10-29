const express = require('express');
const router = express.Router();
const factorService = require('../services/factorService');

router.get('/', async (req, res, next) => {
  try {
    const { category_id, is_active } = req.query;
    const factors = await factorService.getAllFactors({ category_id, is_active });
    res.json({ data: factors });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const factor = await factorService.getFactorById(req.params.id);
    if (!factor) {
      return res.status(404).json({ error: { message: `Emission factor with ID ${req.params.id} not found.` } });
    }
    res.json({ data: factor });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const created = await factorService.createFactor(req.body);
    res.status(201).json({
      message: 'Emission factor created successfully.',
      data: created
    });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const updated = await factorService.updateFactor(req.params.id, req.body);
    res.json({
      message: 'Emission factor updated successfully.',
      data: updated
    });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/status', async (req, res, next) => {
  try {
    const { is_active } = req.body;
    const updated = await factorService.toggleFactorStatus(req.params.id, is_active);
    res.json({
      message: `Factor status updated to ${updated.is_active ? 'active' : 'inactive'}.`,
      data: updated
    });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const result = await factorService.deleteFactor(req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

