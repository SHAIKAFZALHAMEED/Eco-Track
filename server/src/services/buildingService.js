const { pool } = require('../db');

async function getAllBuildings() {
  const query = `
    SELECT 
      b.building_id,
      b.building_name,
      b.location,
      b.created_at,
      COUNT(r.record_id) AS linked_records_count,
      COALESCE(SUM(r.emissions_kg_co2e), 0) AS total_emissions_kg
    FROM buildings b
    LEFT JOIN emission_records r ON b.building_id = r.building_id
    GROUP BY b.building_id, b.building_name, b.location, b.created_at
    ORDER BY b.building_name ASC
  `;
  const [rows] = await pool.query(query);
  return rows.map(row => ({
    ...row,
    linked_records_count: Number(row.linked_records_count),
    total_emissions_kg: parseFloat(row.total_emissions_kg)
  }));
}

async function getBuildingById(id) {
  const [rows] = await pool.query(
    'SELECT building_id, building_name, location, created_at FROM buildings WHERE building_id = ?',
    [id]
  );
  if (rows.length === 0) return null;
  return rows[0];
}

async function createBuilding({ building_name, location }) {
  if (!building_name || !building_name.trim()) {
    const error = new Error('Building name is required.');
    error.status = 400;
    throw error;
  }

  const cleanName = building_name.trim();
  const cleanLocation = location && location.trim() ? location.trim() : 'Campus';

  try {
    const [result] = await pool.query(
      'INSERT INTO buildings (building_name, location) VALUES (?, ?)',
      [cleanName, cleanLocation]
    );
    return await getBuildingById(result.insertId);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      const error = new Error(`A building named "${cleanName}" already exists.`);
      error.status = 409;
      throw error;
    }
    throw err;
  }
}

async function updateBuilding(id, { building_name, location }) {
  const existing = await getBuildingById(id);
  if (!existing) {
    const error = new Error(`Building with ID ${id} not found.`);
    error.status = 404;
    throw error;
  }

  if (!building_name || !building_name.trim()) {
    const error = new Error('Building name is required.');
    error.status = 400;
    throw error;
  }

  const cleanName = building_name.trim();
  const cleanLocation = location && location.trim() ? location.trim() : existing.location;

  try {
    await pool.query(
      'UPDATE buildings SET building_name = ?, location = ? WHERE building_id = ?',
      [cleanName, cleanLocation, id]
    );
    return await getBuildingById(id);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      const error = new Error(`A building named "${cleanName}" already exists.`);
      error.status = 409;
      throw error;
    }
    throw err;
  }
}

async function deleteBuilding(id) {
  const existing = await getBuildingById(id);
  if (!existing) {
    const error = new Error(`Building with ID ${id} not found.`);
    error.status = 404;
    throw error;
  }

  // Check if linked records exist in emission_records
  const [records] = await pool.query(
    'SELECT COUNT(*) AS count FROM emission_records WHERE building_id = ?',
    [id]
  );
  const count = Number(records[0].count);

  if (count > 0) {
    const error = new Error(
      `Cannot delete building "${existing.building_name}": It has ${count} linked emission record(s). Deletion is blocked to preserve historical audit data.`
    );
    error.status = 409;
    error.linkedCount = count;
    throw error;
  }

  await pool.query('DELETE FROM buildings WHERE building_id = ?', [id]);
  return { success: true, message: `Building "${existing.building_name}" deleted successfully.` };
}

module.exports = {
  getAllBuildings,
  getBuildingById,
  createBuilding,
  updateBuilding,
  deleteBuilding
};

