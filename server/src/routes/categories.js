const express = require('express');
const router = express.Router();
const categoryService = require('../services/categoryService');

router.get('/', async (req, res, next) => {
  try {
    const categories = await categoryService.getAllCategories();
    res.json({ data: categories });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

