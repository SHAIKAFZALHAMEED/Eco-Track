const { pool } = require('../src/db');

// Factor references
const FACTORS = {
  ELECTRICITY: {
    factor_id: 1,
    category_id: 1,
    factor_name: 'Grid electricity',
    unit: 'kWh',
    value: 0.710000
  },
  PETROL: {
    factor_id: 2,
    category_id: 2,
    factor_name: 'Petrol',
    unit: 'litre',
    value: 2.313000
  },
  DIESEL: {
    factor_id: 3,
    category_id: 2,
    factor_name: 'Diesel',
    unit: 'litre',
    value: 2.661000
  },
  COMPOSTING: {
    factor_id: 4,
    category_id: 3,
    factor_name: 'Composting',
    unit: 'kg',
    value: 0.320000
  },
  LANDFILL: {
    factor_id: 5,
    category_id: 3,
    factor_name: 'Landfill',
    unit: 'kg',
    value: 1.290000
  }
};

const BUILDINGS = [
  { id: 1, name: 'Central Academic Block' },
  { id: 2, name: 'Science and Laboratory Block' },
  { id: 3, name: 'Central Library' },
  { id: 4, name: 'Administrative Block' },
  { id: 5, name: 'Student Hostel' }
];

const ELECTRICITY_ACTIVITIES = [
  'Main HVAC & central ventilation chillers',
  'Lecture halls smart lighting & AV projectors',
  'Computing center & server rack cooling',
  'Laboratory fume hoods and bench power',
  'Hostel residential wing evening lighting',
  'Library digital archives & reading room AC',
  'Administrative computing & printing hub',
  'Campus perimeter LED lighting & security feed',
  'Science block analytical equipment load',
  'Cafeteria refrigeration & dishwashing station'
];

const FUEL_ACTIVITIES = [
  { factor: FACTORS.PETROL, name: 'Campus security patrol motorbike & car' },
  { factor: FACTORS.PETROL, name: 'Campus mail & stationery courier van' },
  { factor: FACTORS.PETROL, name: 'Faculty inter-departmental pool vehicle' },
  { factor: FACTORS.DIESEL, name: 'Campus shuttle bus #1 morning & evening loop' },
  { factor: FACTORS.DIESEL, name: 'Campus shuttle bus #2 student transit service' },
  { factor: FACTORS.DIESEL, name: 'Emergency backup diesel generator load test' },
  { factor: FACTORS.DIESEL, name: 'Facilities & groundskeeping utility tractor' },
  { factor: FACTORS.DIESEL, name: 'Campus waste collection transport truck' }
];

const WASTE_ACTIVITIES = [
  { factor: FACTORS.COMPOSTING, name: 'Cafeteria vegetable scraps & prep trimmings' },
  { factor: FACTORS.COMPOSTING, name: 'Campus botanical garden clippings & dried leaves' },
  { factor: FACTORS.COMPOSTING, name: 'Hostel dining hall organic plate scrape' },
  { factor: FACTORS.COMPOSTING, name: 'Student center coffee grounds & biodegradable waste' },
  { factor: FACTORS.LANDFILL, name: 'Non-recyclable mixed hostel dorm refuse' },
  { factor: FACTORS.LANDFILL, name: 'Laboratory single-use consumables disposal' },
  { factor: FACTORS.LANDFILL, name: 'Administrative packaging plastics & dry trash' },
  { factor: FACTORS.LANDFILL, name: 'Campus event cleanup miscellaneous waste' }
];

function randomFloat(min, max, decimals = 2) {
  const rand = Math.random() * (max - min) + min;
  return parseFloat(rand.toFixed(decimals));
}

function randomPick(array) {
  return array[Math.floor(Math.random() * array.length)];
}

async function seedLast30Days() {
  console.log('🌱 Starting 30-day realistic sample data generation for EcoTrack Campus...');

  const recordsToInsert = [];
  const today = new Date('2026-10-29T12:00:00Z');

  // Loop back 30 days: Day 29 ago to Day 0 (today)
  for (let i = 29; i >= 0; i--) {
    const curDate = new Date(today);
    curDate.setDate(curDate.getDate() - i);
    const dateStr = curDate.toISOString().split('T')[0];

    // Day of week: 0 = Sunday, 6 = Saturday
    const isWeekend = curDate.getDay() === 0 || curDate.getDay() === 6;

    // 1. Electricity record 1 (Academic / Labs)
    const elecBldg1 = isWeekend ? BUILDINGS[4] : randomPick([BUILDINGS[0], BUILDINGS[1], BUILDINGS[2]]);
    const elecQty1 = isWeekend ? randomFloat(320, 680, 2) : randomFloat(650, 1650, 2);
    const elecFactor1 = FACTORS.ELECTRICITY;
    const elecEmissions1 = Math.round(elecQty1 * elecFactor1.value * 10000) / 10000;
    recordsToInsert.push([
      elecBldg1.id,
      elecFactor1.category_id,
      elecFactor1.factor_id,
      randomPick(ELECTRICITY_ACTIVITIES),
      elecQty1,
      elecFactor1.unit,
      elecFactor1.value,
      elecEmissions1,
      dateStr,
      `Smart sub-meter telemetry log (#EM-${Math.floor(Math.random() * 899 + 100)})`
    ]);

    // 2. Electricity record 2 (Administrative / Hostel)
    const elecBldg2 = isWeekend ? BUILDINGS[4] : randomPick([BUILDINGS[3], BUILDINGS[4]]);
    const elecQty2 = randomFloat(280, 950, 2);
    const elecEmissions2 = Math.round(elecQty2 * elecFactor1.value * 10000) / 10000;
    recordsToInsert.push([
      elecBldg2.id,
      elecFactor1.category_id,
      elecFactor1.factor_id,
      randomPick(ELECTRICITY_ACTIVITIES),
      elecQty2,
      elecFactor1.unit,
      elecFactor1.value,
      elecEmissions2,
      dateStr,
      `Utility panel log reading: ${dateStr}`
    ]);

    // 3. Fuel & Fleet record (Petrol or Diesel)
    const fuelItem = randomPick(FUEL_ACTIVITIES);
    const fuelBldg = randomPick(BUILDINGS);
    const fuelQty = fuelItem.factor.factor_name === 'Diesel'
      ? randomFloat(25, 85, 2)
      : randomFloat(12, 45, 2);
    const fuelEmissions = Math.round(fuelQty * fuelItem.factor.value * 10000) / 10000;
    recordsToInsert.push([
      fuelBldg.id,
      fuelItem.factor.category_id,
      fuelItem.factor.factor_id,
      fuelItem.name,
      fuelQty,
      fuelItem.factor.unit,
      fuelItem.factor.value,
      fuelEmissions,
      dateStr,
      `Fuel dispenser pump slip #${Math.floor(Math.random() * 8999 + 1000)}`
    ]);

    // 4. Waste record (Composting or Landfill)
    const wasteItem = randomPick(WASTE_ACTIVITIES);
    const wasteBldg = randomPick(BUILDINGS);
    const wasteQty = wasteItem.factor.factor_name === 'Composting'
      ? randomFloat(40, 220, 2)
      : randomFloat(30, 180, 2);
    const wasteEmissions = Math.round(wasteQty * wasteItem.factor.value * 10000) / 10000;
    recordsToInsert.push([
      wasteBldg.id,
      wasteItem.factor.category_id,
      wasteItem.factor.factor_id,
      wasteItem.name,
      wasteQty,
      wasteItem.factor.unit,
      wasteItem.factor.value,
      wasteEmissions,
      dateStr,
      `Weighbridge verified ticket #${Math.floor(Math.random() * 7999 + 2000)}`
    ]);

    // Optional 5th record on some days (either another compost or fuel)
    if (i % 2 === 0) {
      const extraWaste = randomPick(WASTE_ACTIVITIES);
      const extraBldg = randomPick(BUILDINGS);
      const extraQty = randomFloat(35, 140, 2);
      const extraEmissions = Math.round(extraQty * extraWaste.factor.value * 10000) / 10000;
      recordsToInsert.push([
        extraBldg.id,
        extraWaste.factor.category_id,
        extraWaste.factor.factor_id,
        extraWaste.name,
        extraQty,
        extraWaste.factor.unit,
        extraWaste.factor.value,
        extraEmissions,
        dateStr,
        `Secondary waste collection log`
      ]);
    }
  }

  console.log(`Generated ${recordsToInsert.length} distinct records across 30 days (from 2026-09-30 to 2026-10-29).`);

  // Insert in batch
  const insertQuery = `
    INSERT INTO emission_records 
    (building_id, category_id, factor_id, activity_name, activity_quantity, activity_unit, factor_value_snapshot, emissions_kg_co2e, record_date, notes)
    VALUES ?
  `;

  const [result] = await pool.query(insertQuery, [recordsToInsert]);
  console.log(`✅ Successfully inserted ${result.affectedRows} records into MySQL table "emission_records"!`);

  // Summary check
  const [counts] = await pool.query(`
    SELECT 
      c.category_name,
      COUNT(r.record_id) as total_entries,
      ROUND(SUM(r.emissions_kg_co2e), 2) as total_kg_co2e,
      ROUND(SUM(r.activity_quantity), 2) as total_quantity
    FROM emission_records r
    JOIN categories c ON r.category_id = c.category_id
    GROUP BY c.category_name
  `);
  console.table(counts);

  process.exit(0);
}

seedLast30Days().catch(err => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});

