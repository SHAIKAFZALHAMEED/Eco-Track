const { pool } = require('../db');

async function getAllCategories() {
  const query = `
    SELECT 
      c.category_id,
      c.category_code,
      c.category_name,
      c.description,
      COUNT(r.record_id) AS records_count,
      COALESCE(SUM(r.emissions_kg_co2e), 0) AS total_emissions_kg
    FROM categories c
    LEFT JOIN emission_records r ON c.category_id = r.category_id
    GROUP BY c.category_id, c.category_code, c.category_name, c.description
    ORDER BY c.category_id ASC
  `;
  const [rows] = await pool.query(query);
  return rows.map(r => ({
    ...r,
    records_count: Number(r.records_count),
    total_emissions_kg: parseFloat(r.total_emissions_kg)
  }));
}

module.exports = {
  getAllCategories
};

