const { pool } = require('../db');

function calculateEmissions(quantity, factorValue) {
  const qty = parseFloat(quantity);
  const factor = parseFloat(factorValue);
  if (isNaN(qty) || isNaN(factor)) return 0;
  // Round to 4 decimal places matching decimal(16,4)
  return Math.round(qty * factor * 10000) / 10000;
}

async function getRecords({
  category_id,
  category_code,
  building_id,
  startDate,
  endDate,
  search,
  page = 1,
  limit = 20,
  all = false
} = {}) {
  let baseQuery = `
    FROM emission_records r
    JOIN buildings b ON r.building_id = b.building_id
    JOIN categories c ON r.category_id = c.category_id
    JOIN emission_factors ef ON r.factor_id = ef.factor_id
  `;
  const conditions = [];
  const params = [];

  if (category_id) {
    conditions.push('r.category_id = ?');
    params.push(category_id);
  }

  if (category_code) {
    conditions.push('c.category_code = ?');
    params.push(category_code.toUpperCase());
  }

  if (building_id) {
    conditions.push('r.building_id = ?');
    params.push(building_id);
  }

  if (startDate) {
    conditions.push('r.record_date >= ?');
    params.push(startDate);
  }

  if (endDate) {
    conditions.push('r.record_date <= ?');
    params.push(endDate);
  }

  if (search && search.trim()) {
    conditions.push('(r.activity_name LIKE ? OR r.notes LIKE ? OR b.building_name LIKE ?)');
    const searchTerm = `%${search.trim()}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  const whereClause = conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : '';

  // Get total count
  const countQuery = `SELECT COUNT(*) AS total ${baseQuery} ${whereClause}`;
  const [countResult] = await pool.query(countQuery, params);
  const total = Number(countResult[0].total);

  // Select fields
  let selectQuery = `
    SELECT 
      r.record_id,
      r.building_id,
      b.building_name,
      b.location AS building_location,
      r.category_id,
      c.category_code,
      c.category_name,
      r.factor_id,
      ef.factor_name,
      ef.is_active AS factor_currently_active,
      r.activity_name,
      r.activity_quantity,
      r.activity_unit,
      r.factor_value_snapshot,
      r.emissions_kg_co2e,
      r.record_date,
      r.notes,
      r.created_at,
      r.updated_at
    ${baseQuery}
    ${whereClause}
    ORDER BY r.record_date DESC, r.record_id DESC
  `;

  let rows;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(500, parseInt(limit, 10) || 20));

  if (all) {
    [rows] = await pool.query(selectQuery, params);
  } else {
    const offset = (pageNum - 1) * limitNum;
    selectQuery += ' LIMIT ? OFFSET ?';
    [rows] = await pool.query(selectQuery, [...params, limitNum, offset]);
  }

  const formattedRows = rows.map(r => ({
    ...r,
    activity_quantity: parseFloat(r.activity_quantity),
    factor_value_snapshot: parseFloat(r.factor_value_snapshot),
    emissions_kg_co2e: parseFloat(r.emissions_kg_co2e),
    factor_currently_active: Boolean(r.factor_currently_active)
  }));

  return {
    records: formattedRows,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1
    }
  };
}

async function getRecordById(id) {
  const query = `
    SELECT 
      r.record_id,
      r.building_id,
      b.building_name,
      b.location AS building_location,
      r.category_id,
      c.category_code,
      c.category_name,
      r.factor_id,
      ef.factor_name,
      ef.factor_value AS current_factor_value,
      ef.is_active AS factor_currently_active,
      r.activity_name,
      r.activity_quantity,
      r.activity_unit,
      r.factor_value_snapshot,
      r.emissions_kg_co2e,
      r.record_date,
      r.notes,
      r.created_at,
      r.updated_at
    FROM emission_records r
    JOIN buildings b ON r.building_id = b.building_id
    JOIN categories c ON r.category_id = c.category_id
    JOIN emission_factors ef ON r.factor_id = ef.factor_id
    WHERE r.record_id = ?
  `;
  const [rows] = await pool.query(query, [id]);
  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    ...r,
    activity_quantity: parseFloat(r.activity_quantity),
    factor_value_snapshot: parseFloat(r.factor_value_snapshot),
    emissions_kg_co2e: parseFloat(r.emissions_kg_co2e),
    current_factor_value: parseFloat(r.current_factor_value),
    factor_currently_active: Boolean(r.factor_currently_active)
  };
}

async function createRecord({
  building_id,
  category_id,
  factor_id,
  activity_name,
  activity_quantity,
  record_date,
  notes
}) {
  // 1. Input validations
  if (!building_id) {
    const error = new Error('Building ID is required.');
    error.status = 400;
    throw error;
  }
  if (!category_id) {
    const error = new Error('Category ID is required.');
    error.status = 400;
    throw error;
  }
  if (!factor_id) {
    const error = new Error('Factor ID is required.');
    error.status = 400;
    throw error;
  }
  if (!activity_name || !activity_name.trim()) {
    const error = new Error('Activity name is required.');
    error.status = 400;
    throw error;
  }

  const qty = parseFloat(activity_quantity);
  if (isNaN(qty) || qty <= 0) {
    const error = new Error('Activity quantity must be a positive number greater than 0.');
    error.status = 400;
    throw error;
  }

  if (!record_date || isNaN(Date.parse(record_date))) {
    const error = new Error('A valid record date (YYYY-MM-DD) is required.');
    error.status = 400;
    throw error;
  }

  // 2. Validate building exists
  const [buildings] = await pool.query('SELECT building_id FROM buildings WHERE building_id = ?', [building_id]);
  if (buildings.length === 0) {
    const error = new Error(`Building with ID ${building_id} does not exist.`);
    error.status = 404;
    throw error;
  }

  // 3. Validate category exists
  const [categories] = await pool.query('SELECT category_id FROM categories WHERE category_id = ?', [category_id]);
  if (categories.length === 0) {
    const error = new Error(`Category with ID ${category_id} does not exist.`);
    error.status = 404;
    throw error;
  }

  // 4. Validate factor exists, belongs to category, and is active
  const [factors] = await pool.query(
    'SELECT factor_id, category_id, factor_name, activity_unit, factor_value, is_active FROM emission_factors WHERE factor_id = ?',
    [factor_id]
  );
  if (factors.length === 0) {
    const error = new Error(`Emission factor with ID ${factor_id} does not exist.`);
    error.status = 404;
    throw error;
  }

  const factor = factors[0];
  if (Number(factor.category_id) !== Number(category_id)) {
    const error = new Error(`Emission factor "${factor.factor_name}" does not belong to the selected category.`);
    error.status = 400;
    throw error;
  }

  if (!factor.is_active) {
    const error = new Error(`Emission factor "${factor.factor_name}" is currently deactivated and cannot be used for new entries.`);
    error.status = 400;
    throw error;
  }

  // 5. Calculate emissions authoritatively on backend
  const factorSnapshot = parseFloat(factor.factor_value);
  const emissionsTotal = calculateEmissions(qty, factorSnapshot);
  const cleanActivityName = activity_name.trim();
  const cleanNotes = notes && notes.trim() ? notes.trim() : null;

  // 6. Insert record into MySQL
  const [result] = await pool.query(
    `INSERT INTO emission_records 
     (building_id, category_id, factor_id, activity_name, activity_quantity, activity_unit, factor_value_snapshot, emissions_kg_co2e, record_date, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      building_id,
      category_id,
      factor_id,
      cleanActivityName,
      qty,
      factor.activity_unit,
      factorSnapshot,
      emissionsTotal,
      record_date,
      cleanNotes
    ]
  );

  return await getRecordById(result.insertId);
}

async function updateRecord(id, {
  building_id,
  activity_name,
  activity_quantity,
  record_date,
  notes,
  recalculate_factor = false,
  factor_id
}) {
  const existing = await getRecordById(id);
  if (!existing) {
    const error = new Error(`Emission record with ID ${id} not found.`);
    error.status = 404;
    throw error;
  }

  let newBuildingId = existing.building_id;
  if (building_id) {
    const [b] = await pool.query('SELECT building_id FROM buildings WHERE building_id = ?', [building_id]);
    if (b.length === 0) {
      const error = new Error(`Building with ID ${building_id} not found.`);
      error.status = 404;
      throw error;
    }
    newBuildingId = building_id;
  }

  let newQty = existing.activity_quantity;
  if (activity_quantity !== undefined && activity_quantity !== null) {
    const qty = parseFloat(activity_quantity);
    if (isNaN(qty) || qty <= 0) {
      const error = new Error('Activity quantity must be a positive number greater than 0.');
      error.status = 400;
      throw error;
    }
    newQty = qty;
  }

  const newActivityName = activity_name && activity_name.trim() ? activity_name.trim() : existing.activity_name;
  const newRecordDate = record_date || existing.record_date;
  const newNotes = notes !== undefined ? (notes && notes.trim() ? notes.trim() : null) : existing.notes;

  let newFactorId = existing.factor_id;
  let newFactorSnapshot = existing.factor_value_snapshot;
  let newActivityUnit = existing.activity_unit;

  if (factor_id && Number(factor_id) !== Number(existing.factor_id)) {
    // If factor changed, load factor details
    const [factors] = await pool.query(
      'SELECT factor_id, category_id, factor_name, activity_unit, factor_value, is_active FROM emission_factors WHERE factor_id = ?',
      [factor_id]
    );
    if (factors.length === 0) {
      const error = new Error(`Emission factor with ID ${factor_id} not found.`);
      error.status = 404;
      throw error;
    }
    const factor = factors[0];
    if (Number(factor.category_id) !== Number(existing.category_id)) {
      const error = new Error(`Selected factor does not belong to category ${existing.category_name}.`);
      error.status = 400;
      throw error;
    }
    newFactorId = factor.factor_id;
    newFactorSnapshot = parseFloat(factor.factor_value);
    newActivityUnit = factor.activity_unit;
  } else if (recalculate_factor) {
    // Explicitly requested to refresh the factor value snapshot from current factor
    const [factors] = await pool.query(
      'SELECT factor_value FROM emission_factors WHERE factor_id = ?',
      [existing.factor_id]
    );
    if (factors.length > 0) {
      newFactorSnapshot = parseFloat(factors[0].factor_value);
    }
  }

  const newEmissions = calculateEmissions(newQty, newFactorSnapshot);

  await pool.query(
    `UPDATE emission_records 
     SET building_id = ?, factor_id = ?, activity_name = ?, activity_quantity = ?, 
         activity_unit = ?, factor_value_snapshot = ?, emissions_kg_co2e = ?, 
         record_date = ?, notes = ?
     WHERE record_id = ?`,
    [
      newBuildingId,
      newFactorId,
      newActivityName,
      newQty,
      newActivityUnit,
      newFactorSnapshot,
      newEmissions,
      newRecordDate,
      newNotes,
      id
    ]
  );

  return await getRecordById(id);
}

async function deleteRecord(id) {
  const existing = await getRecordById(id);
  if (!existing) {
    const error = new Error(`Emission record with ID ${id} not found.`);
    error.status = 404;
    throw error;
  }

  await pool.query('DELETE FROM emission_records WHERE record_id = ?', [id]);
  return { success: true, message: `Record #${id} deleted successfully.` };
}

module.exports = {
  calculateEmissions,
  getRecords,
  getRecordById,
  createRecord,
  updateRecord,
  deleteRecord
};

