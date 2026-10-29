const { pool } = require('../db');

async function getReportData({ period = 'monthly', startDate, endDate, building_id, category_id } = {}) {
  const now = new Date();
  let start = startDate || null;
  let end = endDate || null;

  if (!start && !end) {
    if (period === 'weekly') {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      start = d.toISOString().split('T')[0];
      end = now.toISOString().split('T')[0];
    } else if (period === 'yearly') {
      const d = new Date(now);
      d.setDate(d.getDate() - 365);
      start = d.toISOString().split('T')[0];
      end = now.toISOString().split('T')[0];
    } else if (period === 'all') {
      start = null;
      end = null;
    } else {
      // Monthly default (30 days)
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      start = d.toISOString().split('T')[0];
      end = now.toISOString().split('T')[0];
    }
  }

  const conditions = [];
  const params = [];

  if (start) {
    conditions.push('r.record_date >= ?');
    params.push(start);
  }
  if (end) {
    conditions.push('r.record_date <= ?');
    params.push(end);
  }
  if (building_id) {
    conditions.push('r.building_id = ?');
    params.push(building_id);
  }
  if (category_id) {
    conditions.push('r.category_id = ?');
    params.push(category_id);
  }

  const whereClause = conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : '';

  // 1. Overall Summary
  const summaryQuery = `
    SELECT 
      COUNT(r.record_id) AS total_records,
      COALESCE(SUM(r.emissions_kg_co2e), 0) AS total_emissions_kg,
      COALESCE(SUM(CASE WHEN c.category_code = 'ELECTRICITY' THEN r.emissions_kg_co2e ELSE 0 END), 0) AS electricity_kg,
      COALESCE(SUM(CASE WHEN c.category_code = 'FUEL' THEN r.emissions_kg_co2e ELSE 0 END), 0) AS fuel_kg,
      COALESCE(SUM(CASE WHEN c.category_code = 'WASTE' THEN r.emissions_kg_co2e ELSE 0 END), 0) AS waste_kg,
      MIN(r.record_date) AS earliest_date,
      MAX(r.record_date) AS latest_date
    FROM emission_records r
    JOIN categories c ON r.category_id = c.category_id
    ${whereClause}
  `;
  const [summaryRows] = await pool.query(summaryQuery, params);
  const summary = {
    total_records: Number(summaryRows[0].total_records),
    total_emissions_kg: parseFloat(summaryRows[0].total_emissions_kg),
    total_emissions_tonnes: Math.round((parseFloat(summaryRows[0].total_emissions_kg) / 1000) * 1000) / 1000,
    electricity_kg: parseFloat(summaryRows[0].electricity_kg),
    fuel_kg: parseFloat(summaryRows[0].fuel_kg),
    waste_kg: parseFloat(summaryRows[0].waste_kg),
    earliest_date: summaryRows[0].earliest_date,
    latest_date: summaryRows[0].latest_date
  };

  // 2. Category totals
  const categoryQuery = `
    SELECT 
      c.category_id,
      c.category_code,
      c.category_name,
      COUNT(r.record_id) AS record_count,
      COALESCE(SUM(r.emissions_kg_co2e), 0) AS emissions_kg,
      COALESCE(SUM(r.activity_quantity), 0) AS total_quantity,
      MAX(r.activity_unit) AS activity_unit
    FROM categories c
    LEFT JOIN emission_records r ON c.category_id = r.category_id ${whereClause ? 'AND ' + conditions.join(' AND ') : ''}
    GROUP BY c.category_id, c.category_code, c.category_name
    ORDER BY emissions_kg DESC
  `;
  const [catRows] = await pool.query(categoryQuery, params);
  const categoryReport = catRows.map(r => {
    const emissions = parseFloat(r.emissions_kg);
    const pct = summary.total_emissions_kg > 0 ? Math.round((emissions / summary.total_emissions_kg) * 1000) / 10 : 0;
    return {
      category_id: r.category_id,
      category_code: r.category_code,
      category_name: r.category_name,
      record_count: Number(r.record_count),
      emissions_kg: emissions,
      total_quantity: parseFloat(r.total_quantity),
      activity_unit: r.activity_unit || 'N/A',
      percentage: pct
    };
  });

  // 3. Building totals
  const buildingQuery = `
    SELECT 
      b.building_id,
      b.building_name,
      b.location,
      COUNT(r.record_id) AS record_count,
      COALESCE(SUM(r.emissions_kg_co2e), 0) AS emissions_kg
    FROM buildings b
    LEFT JOIN emission_records r ON b.building_id = r.building_id ${whereClause ? 'AND ' + conditions.join(' AND ') : ''}
    GROUP BY b.building_id, b.building_name, b.location
    ORDER BY emissions_kg DESC, b.building_name ASC
  `;
  const [bldgRows] = await pool.query(buildingQuery, params);
  const buildingReport = bldgRows.map(r => {
    const emissions = parseFloat(r.emissions_kg);
    const pct = summary.total_emissions_kg > 0 ? Math.round((emissions / summary.total_emissions_kg) * 1000) / 10 : 0;
    return {
      building_id: r.building_id,
      building_name: r.building_name,
      location: r.location,
      record_count: Number(r.record_count),
      emissions_kg: emissions,
      percentage: pct
    };
  });

  // 4. Date-wise trend
  const trendQuery = `
    SELECT 
      r.record_date,
      COUNT(r.record_id) AS records_count,
      COALESCE(SUM(r.emissions_kg_co2e), 0) AS total_kg,
      COALESCE(SUM(CASE WHEN c.category_code = 'ELECTRICITY' THEN r.emissions_kg_co2e ELSE 0 END), 0) AS electricity_kg,
      COALESCE(SUM(CASE WHEN c.category_code = 'FUEL' THEN r.emissions_kg_co2e ELSE 0 END), 0) AS fuel_kg,
      COALESCE(SUM(CASE WHEN c.category_code = 'WASTE' THEN r.emissions_kg_co2e ELSE 0 END), 0) AS waste_kg
    FROM emission_records r
    JOIN categories c ON r.category_id = c.category_id
    ${whereClause}
    GROUP BY r.record_date
    ORDER BY r.record_date ASC
  `;
  const [trendRows] = await pool.query(trendQuery, params);
  const trends = trendRows.map(t => ({
    record_date: t.record_date,
    records_count: Number(t.records_count),
    total_kg: parseFloat(t.total_kg),
    electricity_kg: parseFloat(t.electricity_kg),
    fuel_kg: parseFloat(t.fuel_kg),
    waste_kg: parseFloat(t.waste_kg)
  }));

  // 5. Individual records
  const recordsQuery = `
    SELECT 
      r.record_id,
      r.record_date,
      b.building_name,
      b.location,
      c.category_name,
      ef.factor_name,
      r.activity_name,
      r.activity_quantity,
      r.activity_unit,
      r.factor_value_snapshot,
      r.emissions_kg_co2e,
      r.notes
    FROM emission_records r
    JOIN buildings b ON r.building_id = b.building_id
    JOIN categories c ON r.category_id = c.category_id
    JOIN emission_factors ef ON r.factor_id = ef.factor_id
    ${whereClause}
    ORDER BY r.record_date DESC, r.record_id DESC
  `;
  const [rawRecords] = await pool.query(recordsQuery, params);
  const records = rawRecords.map(r => ({
    ...r,
    activity_quantity: parseFloat(r.activity_quantity),
    factor_value_snapshot: parseFloat(r.factor_value_snapshot),
    emissions_kg_co2e: parseFloat(r.emissions_kg_co2e)
  }));

  return {
    period,
    startDate: start,
    endDate: end,
    generatedAt: new Date().toISOString(),
    summary,
    categories: categoryReport,
    buildings: buildingReport,
    trends,
    records
  };
}

function generateCSV(report) {
  const headers = [
    'Record ID',
    'Record Date',
    'Building Name',
    'Location',
    'Category',
    'Factor Applied',
    'Activity Description',
    'Activity Quantity',
    'Activity Unit',
    'Factor Snapshot (kg CO2e / unit)',
    'Emissions (kg CO2e)',
    'Emissions (Metric Tonnes CO2e)',
    'Notes'
  ];

  const escapeCSV = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = [headers.join(',')];

  report.records.forEach(r => {
    const tonnes = (r.emissions_kg_co2e / 1000).toFixed(4);
    rows.push([
      r.record_id,
      r.record_date,
      escapeCSV(r.building_name),
      escapeCSV(r.location),
      escapeCSV(r.category_name),
      escapeCSV(r.factor_name),
      escapeCSV(r.activity_name),
      r.activity_quantity,
      escapeCSV(r.activity_unit),
      r.factor_value_snapshot,
      r.emissions_kg_co2e,
      tonnes,
      escapeCSV(r.notes || '')
    ].join(','));
  });

  return rows.join('\r\n');
}

module.exports = {
  getReportData,
  generateCSV
};

