const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateEmissions } = require('../src/services/recordService');

test('Emission Calculation Test Suite', async (t) => {
  await t.test('calculates grid electricity emissions correctly', () => {
    // 1500.5 kWh * 0.710000 kg CO2e/kWh = 1065.3550 kg CO2e
    const result = calculateEmissions(1500.5, 0.710000);
    assert.equal(result, 1065.355);
  });

  await t.test('calculates petrol fuel emissions correctly', () => {
    // 45.25 litres * 2.313000 kg CO2e/litre = 104.6633 kg CO2e
    const result = calculateEmissions(45.25, 2.313000);
    assert.equal(result, 104.6633);
  });

  await t.test('calculates diesel fuel emissions correctly', () => {
    // 120 litres * 2.661000 kg CO2e/litre = 319.32 kg CO2e
    const result = calculateEmissions(120, 2.661000);
    assert.equal(result, 319.32);
  });

  await t.test('calculates composting waste emissions correctly', () => {
    // 350 kg * 0.320000 kg CO2e/kg = 112 kg CO2e
    const result = calculateEmissions(350, 0.320000);
    assert.equal(result, 112);
  });

  await t.test('calculates landfill waste emissions correctly', () => {
    // 350 kg * 1.290000 kg CO2e/kg = 451.5 kg CO2e
    const result = calculateEmissions(350, 1.290000);
    assert.equal(result, 451.5);
  });

  await t.test('correctly highlights composting avoided emissions compared to landfill', () => {
    const landfillEmissions = calculateEmissions(1000, 1.290000); // 1290
    const compostingEmissions = calculateEmissions(1000, 0.320000); // 320
    const avoided = landfillEmissions - compostingEmissions;
    assert.equal(avoided, 970);
    assert.ok(compostingEmissions < landfillEmissions * 0.25); // Composting produces > 75% less CO2e
  });

  await t.test('handles non-numeric and edge inputs safely', () => {
    assert.equal(calculateEmissions('abc', 0.71), 0);
    assert.equal(calculateEmissions(100, 'xyz'), 0);
    assert.equal(calculateEmissions(0, 0.71), 0);
  });
});

