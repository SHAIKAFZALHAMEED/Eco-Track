const express = require('express');
const router = express.Router();
const buildingService = require('../services/buildingService');

router.get('/', async (req, res, next) => {
  try {
    const buildings = await buildingService.getAllBuildings();
    res.json({ data: buildings });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const building = await buildingService.getBuildingById(req.params.id);
    if (!building) {
      return res.status(404).json({ error: { message: `Building with ID ${req.params.id} not found.` } });
    }
    res.json({ data: building });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const newBuilding = await buildingService.createBuilding(req.body);
    res.status(201).json({
      message: 'Building created successfully.',
      data: newBuilding
    });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const updated = await buildingService.updateBuilding(req.params.id, req.body);
    res.json({
      message: 'Building updated successfully.',
      data: updated
    });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const result = await buildingService.deleteBuilding(req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

