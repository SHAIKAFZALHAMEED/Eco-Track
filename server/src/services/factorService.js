const { pool } = require('../db');

async function getAllFactors({ category_id, is_active } = {}) {
  let query = `
    SELECT 
      ef.factor_id,
      ef.category_id,
      c.category_code,
      c.category_name,
      ef.factor_name,
      ef.activity_unit,
      ef.factor_value,
      ef.emission_unit,
      ef.source_name,
      ef.is_active,
      ef.created_at,
      COUNT(er.record_id) AS linked_records_count
    FROM emission_factors ef
    JOIN categories c ON ef.category_id = c.category_id
    LEFT JOIN emission_records er ON ef.factor_id = er.factor_id
  `;
  const conditions = [];
  const params = [];

  if (category_id) {
    conditions.push('ef.category_id = ?');
    params.push(category_id);
  }

  if (is_active !== undefined && is_active !== null && is_active !== '') {
    conditions.push('ef.is_active = ?');
    params.push(is_active === 'true' || is_active === true || is_active === 1 || is_active === '1' ? 1 : 0);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += `
    GROUP BY ef.factor_id, ef.category_id, c.category_code, c.category_name, 
             ef.factor_name, ef.activity_unit, ef.factor_value, ef.emission_unit, 
             ef.source_name, ef.is_active, ef.created_at
    ORDER BY c.category_id ASC, ef.factor_name ASC
  `;

  const [rows] = await pool.query(query, params);
  return rows.map(r => ({
    ...r,
    factor_value: parseFloat(r.factor_value),
    is_active: Boolean(r.is_active),
    linked_records_count: Number(r.linked_records_count)
  }));
}

async function getFactorById(id) {
  const query = `
    SELECT 
      ef.factor_id,
      ef.category_id,
      c.category_code,
      c.category_name,
      ef.factor_name,
      ef.activity_unit,
      ef.factor_value,
      ef.emission_unit,
      ef.source_name,
      ef.is_active,
      ef.created_at,
      COUNT(er.record_id) AS linked_records_count
    FROM emission_factors ef
    JOIN categories c ON ef.category_id = c.category_id
    LEFT JOIN emission_records er ON ef.factor_id = er.factor_id
    WHERE ef.factor_id = ?
    GROUP BY ef.factor_id, ef.category_id, c.category_code, c.category_name, 
             ef.factor_name, ef.activity_unit, ef.factor_value, ef.emission_unit, 
             ef.source_name, ef.is_active, ef.created_at
  `;
  const [rows] = await pool.query(query, [id]);
  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    ...r,
    factor_value: parseFloat(r.factor_value),
    is_active: Boolean(r.is_active),
    linked_records_count: Number(r.linked_records_count)
  };
}

async function createFactor({ category_id, factor_name, activity_unit, factor_value, emission_unit, source_name, is_active = 1 }) {
  if (!category_id) {
    const error = new Error('Category ID is required.');
    error.status = 400;
    throw error;
  }
  if (!factor_name || !factor_name.trim()) {
    const error = new Error('Factor name is required.');
    error.status = 400;
    throw error;
  }
  if (!activity_unit || !activity_unit.trim()) {
    const error = new Error('Activity unit is required.');
    error.status = 400;
    throw error;
  }

  const numVal = parseFloat(factor_value);
  if (isNaN(numVal) || numVal <= 0) {
    const error = new Error('Factor value must be a positive number greater than 0.');
    error.status = 400;
    throw error;
  }

  // Verify category exists
  const [cats] = await pool.query('SELECT category_id FROM categories WHERE category_id = ?', [category_id]);
  if (cats.length === 0) {
    const error = new Error(`Category with ID ${category_id} does not exist.`);
    error.status = 400;
    throw error;
  }

  const cleanEmissionUnit = emission_unit && emission_unit.trim() ? emission_unit.trim() : 'kg CO2e';
  const cleanSourceName = source_name && source_name.trim() 
    ? source_name.trim() 
    : 'Prototype factor supplied for this project; verify source and scope before formal reporting';

  try {
    const [result] = await pool.query(
      `INSERT INTO emission_factors 
       (category_id, factor_name, activity_unit, factor_value, emission_unit, source_name, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        category_id,
        factor_name.trim(),
        activity_unit.trim(),
        numVal,
        cleanEmissionUnit,
        cleanSourceName,
        is_active ? 1 : 0
      ]
    );
    return await getFactorById(result.insertId);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      const error = new Error(`A factor named "${factor_name.trim()}" already exists in this category.`);
      error.status = 409;
      throw error;
    }
    throw err;
  }
}

async function updateFactor(id, { factor_name, activity_unit, factor_value, emission_unit, source_name, is_active }) {
  const existing = await getFactorById(id);
  if (!existing) {
    const error = new Error(`Emission factor with ID ${id} not found.`);
    error.status = 404;
    throw error;
  }

  let newFactorValue = existing.factor_value;
  if (factor_value !== undefined && factor_value !== null) {
    const numVal = parseFloat(factor_value);
    if (isNaN(numVal) || numVal <= 0) {
      const error = new Error('Factor value must be a positive number greater than 0.');
      error.status = 400;
      throw error;
    }
    newFactorValue = numVal;
  }

  const newFactorName = factor_name !== undefined ? factor_name.trim() : existing.factor_name;
  const newActivityUnit = activity_unit !== undefined ? activity_unit.trim() : existing.activity_unit;
  const newEmissionUnit = emission_unit !== undefined ? emission_unit.trim() : existing.emission_unit;
  const newSourceName = source_name !== undefined ? source_name.trim() : existing.source_name;
  const newIsActive = is_active !== undefined ? (is_active ? 1 : 0) : (existing.is_active ? 1 : 0);

  try {
    await pool.query(
      `UPDATE emission_factors 
       SET factor_name = ?, activity_unit = ?, factor_value = ?, emission_unit = ?, source_name = ?, is_active = ?
       WHERE factor_id = ?`,
      [newFactorName, newActivityUnit, newFactorValue, newEmissionUnit, newSourceName, newIsActive, id]
    );
    return await getFactorById(id);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      const error = new Error(`A factor named "${newFactorName}" already exists in this category.`);
      error.status = 409;
      throw error;
    }
    throw err;
  }
}

async function toggleFactorStatus(id, isActive) {
  const existing = await getFactorById(id);
  if (!existing) {
    const error = new Error(`Emission factor with ID ${id} not found.`);
    error.status = 404;
    throw error;
  }

  const val = isActive ? 1 : 0;
  await pool.query('UPDATE emission_factors SET is_active = ? WHERE factor_id = ?', [val, id]);
  return await getFactorById(id);
}

async function deleteFactor(id) {
  const existing = await getFactorById(id);
  if (!existing) {
    const error = new Error(`Emission factor with ID ${id} not found.`);
    error.status = 404;
    throw error;
  }

  // Check if referenced in emission_records
  const [records] = await pool.query(
    'SELECT COUNT(*) AS count FROM emission_records WHERE factor_id = ?',
    [id]
  );
  const count = Number(records[0].count);

  if (count > 0) {
    const error = new Error(
      `Cannot delete factor "${existing.factor_name}": It is referenced by ${count} historical emission record(s). Deactivate this factor instead so it cannot be used for new entries while preserving audit records.`
    );
    error.status = 409;
    error.linkedCount = count;
    throw error;
  }

  await pool.query('DELETE FROM emission_factors WHERE factor_id = ?', [id]);
  return { success: true, message: `Factor "${existing.factor_name}" deleted successfully.` };
}

module.exports = {
  getAllFactors,
  getFactorById,
  createFactor,
  updateFactor,
  toggleFactorStatus,
  deleteFactor
};

