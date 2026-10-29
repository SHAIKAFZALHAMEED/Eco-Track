const { pool } = require('../db');

function getDateBounds(period, startDate, endDate) {
  const now = new Date();
  let start = null;
  let end = null;
  let priorStart = null;
  let priorEnd = null;

  if (startDate && endDate) {
    start = startDate;
    end = endDate;
  } else if (period === 'weekly') {
    const dStart = new Date(now);
    dStart.setDate(dStart.getDate() - 7);
    start = dStart.toISOString().split('T')[0];
    end = now.toISOString().split('T')[0];

    const pStart = new Date(dStart);
    pStart.setDate(pStart.getDate() - 7);
    priorStart = pStart.toISOString().split('T')[0];
    priorEnd = start;
  } else if (period === 'yearly') {
    const dStart = new Date(now);
    dStart.setDate(dStart.getDate() - 365);
    start = dStart.toISOString().split('T')[0];
    end = now.toISOString().split('T')[0];

    const pStart = new Date(dStart);
    pStart.setDate(pStart.getDate() - 365);
    priorStart = pStart.toISOString().split('T')[0];
    priorEnd = start;
  } else if (period === 'all') {
    start = null;
    end = null;
  } else {
    // default monthly (30 days)
    const dStart = new Date(now);
    dStart.setDate(dStart.getDate() - 30);
    start = dStart.toISOString().split('T')[0];
    end = now.toISOString().split('T')[0];

    const pStart = new Date(dStart);
    pStart.setDate(pStart.getDate() - 30);
    priorStart = pStart.toISOString().split('T')[0];
    priorEnd = start;
  }

  return { start, end, priorStart, priorEnd };
}

async function getDashboardData({ period = 'monthly', startDate, endDate } = {}) {
  const { start, end, priorStart, priorEnd } = getDateBounds(period, startDate, endDate);

  // 1. Base filter conditions
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
  const whereClause = conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : '';

  // 2. Fetch overall category aggregations
  const categorySummaryQuery = `
    SELECT 
      c.category_id,
      c.category_code,
      c.category_name,
      COUNT(r.record_id) AS records_count,
      COALESCE(SUM(r.emissions_kg_co2e), 0) AS emissions_kg
    FROM categories c
    LEFT JOIN emission_records r ON c.category_id = r.category_id ${whereClause ? 'AND ' + conditions.join(' AND ') : ''}
    GROUP BY c.category_id, c.category_code, c.category_name
    ORDER BY c.category_id ASC
  `;
  const [categoryRows] = await pool.query(categorySummaryQuery, params);

  let totalEmissions = 0;
  let totalRecords = 0;
  let electricityEmissions = 0;
  let fuelEmissions = 0;
  let wasteEmissions = 0;

  categoryRows.forEach(row => {
    const emissions = parseFloat(row.emissions_kg);
    const count = Number(row.records_count);
    totalEmissions += emissions;
    totalRecords += count;

    if (row.category_code === 'ELECTRICITY') electricityEmissions = emissions;
    if (row.category_code === 'FUEL') fuelEmissions = emissions;
    if (row.category_code === 'WASTE') wasteEmissions = emissions;
  });

  totalEmissions = Math.round(totalEmissions * 10000) / 10000;

  // Category breakdown formatted
  const categoryBreakdown = categoryRows.map(row => {
    const emissions = parseFloat(row.emissions_kg);
    const percentage = totalEmissions > 0 ? Math.round((emissions / totalEmissions) * 1000) / 10 : 0;
    return {
      category_id: row.category_id,
      category_code: row.category_code,
      category_name: row.category_name,
      emissions_kg: emissions,
      records_count: Number(row.records_count),
      percentage
    };
  });

  // Highest emitting category
  let highestCategory = null;
  if (totalEmissions > 0) {
    const sortedCats = [...categoryBreakdown].sort((a, b) => b.emissions_kg - a.emissions_kg);
    if (sortedCats[0] && sortedCats[0].emissions_kg > 0) {
      highestCategory = sortedCats[0];
    }
  }

  // 3. Building-wise comparison
  const buildingQuery = `
    SELECT 
      b.building_id,
      b.building_name,
      b.location,
      COUNT(r.record_id) AS records_count,
      COALESCE(SUM(r.emissions_kg_co2e), 0) AS emissions_kg
    FROM buildings b
    LEFT JOIN emission_records r ON b.building_id = r.building_id ${whereClause ? 'AND ' + conditions.join(' AND ') : ''}
    GROUP BY b.building_id, b.building_name, b.location
    ORDER BY emissions_kg DESC, b.building_name ASC
  `;
  const [buildingRows] = await pool.query(buildingQuery, params);

  const buildingComparison = buildingRows.map(row => {
    const emissions = parseFloat(row.emissions_kg);
    const percentage = totalEmissions > 0 ? Math.round((emissions / totalEmissions) * 1000) / 10 : 0;
    return {
      building_id: row.building_id,
      building_name: row.building_name,
      location: row.location,
      emissions_kg: emissions,
      records_count: Number(row.records_count),
      percentage
    };
  });

  // Highest emitting building
  let highestBuilding = null;
  if (totalEmissions > 0 && buildingComparison.length > 0 && buildingComparison[0].emissions_kg > 0) {
    highestBuilding = buildingComparison[0];
  }

  // 4. Trend timeline
  const trendQuery = `
    SELECT 
      r.record_date,
      SUM(CASE WHEN c.category_code = 'ELECTRICITY' THEN r.emissions_kg_co2e ELSE 0 END) AS electricity_kg,
      SUM(CASE WHEN c.category_code = 'FUEL' THEN r.emissions_kg_co2e ELSE 0 END) AS fuel_kg,
      SUM(CASE WHEN c.category_code = 'WASTE' THEN r.emissions_kg_co2e ELSE 0 END) AS waste_kg,
      SUM(r.emissions_kg_co2e) AS total_kg
    FROM emission_records r
    JOIN categories c ON r.category_id = c.category_id
    ${whereClause}
    GROUP BY r.record_date
    ORDER BY r.record_date ASC
  `;
  const [trendRows] = await pool.query(trendQuery, params);

  const trends = trendRows.map(t => ({
    record_date: t.record_date,
    electricity_kg: parseFloat(t.electricity_kg) || 0,
    fuel_kg: parseFloat(t.fuel_kg) || 0,
    waste_kg: parseFloat(t.waste_kg) || 0,
    total_kg: parseFloat(t.total_kg) || 0
  }));

  // 5. Prior period comparison (if available)
  let previousPeriodComparison = null;
  if (priorStart && priorEnd) {
    const priorQuery = `
      SELECT 
        COALESCE(SUM(r.emissions_kg_co2e), 0) AS prior_total_emissions,
        COUNT(r.record_id) AS prior_records_count
      FROM emission_records r
      WHERE r.record_date >= ? AND r.record_date < ?
    `;
    const [priorRows] = await pool.query(priorQuery, [priorStart, priorEnd]);
    const priorTotal = parseFloat(priorRows[0].prior_total_emissions) || 0;
    const priorCount = Number(priorRows[0].prior_records_count) || 0;

    let deltaPercentage = null;
    if (priorTotal > 0) {
      deltaPercentage = Math.round(((totalEmissions - priorTotal) / priorTotal) * 1000) / 10;
    }

    previousPeriodComparison = {
      priorStart,
      priorEnd,
      prior_total_emissions: priorTotal,
      prior_records_count: priorCount,
      delta_percentage: deltaPercentage
    };
  }

  // 6. Recent records (latest 6)
  const recentRecordsQuery = `
    SELECT 
      r.record_id,
      r.building_id,
      b.building_name,
      r.category_id,
      c.category_code,
      c.category_name,
      r.factor_id,
      ef.factor_name,
      r.activity_name,
      r.activity_quantity,
      r.activity_unit,
      r.factor_value_snapshot,
      r.emissions_kg_co2e,
      r.record_date,
      r.notes,
      r.created_at
    FROM emission_records r
    JOIN buildings b ON r.building_id = b.building_id
    JOIN categories c ON r.category_id = c.category_id
    JOIN emission_factors ef ON r.factor_id = ef.factor_id
    ORDER BY r.record_date DESC, r.record_id DESC
    LIMIT 6
  `;
  const [recentRows] = await pool.query(recentRecordsQuery);

  const recentRecords = recentRows.map(r => ({
    ...r,
    activity_quantity: parseFloat(r.activity_quantity),
    factor_value_snapshot: parseFloat(r.factor_value_snapshot),
    emissions_kg_co2e: parseFloat(r.emissions_kg_co2e)
  }));

  // 7. Reduction Recommendations
  const recommendations = [];
  if (totalEmissions === 0) {
    recommendations.push({
      type: 'info',
      title: 'Establish Your Campus Baseline',
      description: 'No emission records are currently logged in the selected period. Start by logging monthly electricity bills, campus fleet fuel logs, or cafeteria waste disposal to establish your campus carbon baseline.'
    });
  } else {
    if (highestCategory) {
      if (highestCategory.category_code === 'ELECTRICITY') {
        recommendations.push({
          type: 'energy',
          title: 'Grid Electricity Optimization',
          description: `Electricity accounts for ${highestCategory.percentage}% of campus emissions (${highestCategory.emissions_kg.toLocaleString()} kg CO2e). Prioritize LED retrofits, HVAC occupancy sensors, and feasibility studies for rooftop solar PV installations on high-demand buildings.`
        });
      } else if (highestCategory.category_code === 'FUEL') {
        recommendations.push({
          type: 'transport',
          title: 'Fleet & Fuel Transition',
          description: `Fuel consumption is your primary emission source (${highestCategory.percentage}%, ${highestCategory.emissions_kg.toLocaleString()} kg CO2e). Implement campus shuttle route optimization, anti-idling policies for maintenance vehicles, and evaluate transitioning campus vans to electric vehicles.`
        });
      } else if (highestCategory.category_code === 'WASTE') {
        recommendations.push({
          type: 'waste',
          title: 'Organic Waste Diversion',
          description: `Waste represents ${highestCategory.percentage}% of recorded emissions. Expand on-campus decentralized composting for cafeteria food scraps and leaf litter to divert organic mass from high-emission landfill disposal (saving ~0.97 kg CO2e per kg diverted).`
        });
      }
    }

    if (highestBuilding) {
      recommendations.push({
        type: 'facility',
        title: `Targeted Audits for ${highestBuilding.building_name}`,
        description: `${highestBuilding.building_name} generated ${highestBuilding.emissions_kg.toLocaleString()} kg CO2e (${highestBuilding.percentage}% of total campus emissions). Conduct an energy and thermal comfort audit in this facility to detect sub-meter leaks or excessive night-time loads.`
      });
    }

    recommendations.push({
      type: 'reporting',
      title: 'Emissions Factor Verification',
      description: 'Current calculations utilize prototype reference emission factors. Before submitting formal institutional GHG disclosures, replace prototype factors with region-specific grid emissions data and verified fuel specifications.'
    });
  }

  return {
    period,
    startDate: start,
    endDate: end,
    summary: {
      total_emissions_kg: totalEmissions,
      total_records: totalRecords,
      electricity_emissions_kg: electricityEmissions,
      fuel_emissions_kg: fuelEmissions,
      waste_emissions_kg: wasteEmissions,
      highest_building: highestBuilding,
      highest_category: highestCategory
    },
    previous_period_comparison: previousPeriodComparison,
    category_breakdown: categoryBreakdown,
    building_comparison: buildingComparison,
    trends,
    recent_records: recentRecords,
    recommendations
  };
}

module.exports = {
  getDashboardData
};

