const test = require('node:test');
const assert = require('node:assert/strict');
const { createRecord } = require('../src/services/recordService');
const { createBuilding } = require('../src/services/buildingService');
const { createFactor } = require('../src/services/factorService');

test('Validation Test Suite', async (t) => {
  await t.test('rejects record creation with missing building_id', async () => {
    await assert.rejects(
      async () => {
        await createRecord({
          building_id: null,
          category_id: 1,
          factor_id: 1,
          activity_name: 'Test Activity',
          activity_quantity: 100,
          record_date: '2026-10-29'
        });
      },
      {
        message: 'Building ID is required.',
        status: 400
      }
    );
  });

  await t.test('rejects record creation with missing category_id', async () => {
    await assert.rejects(
      async () => {
        await createRecord({
          building_id: 1,
          category_id: null,
          factor_id: 1,
          activity_name: 'Test Activity',
          activity_quantity: 100,
          record_date: '2026-10-29'
        });
      },
      {
        message: 'Category ID is required.',
        status: 400
      }
    );
  });

  await t.test('rejects record creation with missing factor_id', async () => {
    await assert.rejects(
      async () => {
        await createRecord({
          building_id: 1,
          category_id: 1,
          factor_id: null,
          activity_name: 'Test Activity',
          activity_quantity: 100,
          record_date: '2026-10-29'
        });
      },
      {
        message: 'Factor ID is required.',
        status: 400
      }
    );
  });

  await t.test('rejects record creation with empty activity_name', async () => {
    await assert.rejects(
      async () => {
        await createRecord({
          building_id: 1,
          category_id: 1,
          factor_id: 1,
          activity_name: '   ',
          activity_quantity: 100,
          record_date: '2026-10-29'
        });
      },
      {
        message: 'Activity name is required.',
        status: 400
      }
    );
  });

  await t.test('rejects record creation with negative or zero activity_quantity', async () => {
    await assert.rejects(
      async () => {
        await createRecord({
          building_id: 1,
          category_id: 1,
          factor_id: 1,
          activity_name: 'Test',
          activity_quantity: 0,
          record_date: '2026-10-29'
        });
      },
      {
        message: 'Activity quantity must be a positive number greater than 0.',
        status: 400
      }
    );

    await assert.rejects(
      async () => {
        await createRecord({
          building_id: 1,
          category_id: 1,
          factor_id: 1,
          activity_name: 'Test',
          activity_quantity: -50,
          record_date: '2026-10-29'
        });
      },
      {
        message: 'Activity quantity must be a positive number greater than 0.',
        status: 400
      }
    );
  });

  await t.test('rejects building creation with empty building_name', async () => {
    await assert.rejects(
      async () => {
        await createBuilding({ building_name: '  ', location: 'Campus' });
      },
      {
        message: 'Building name is required.',
        status: 400
      }
    );
  });

  await t.test('rejects factor creation with zero or negative factor value', async () => {
    await assert.rejects(
      async () => {
        await createFactor({
          category_id: 1,
          factor_name: 'Invalid Factor',
          activity_unit: 'kWh',
          factor_value: -0.5
        });
      },
      {
        message: 'Factor value must be a positive number greater than 0.',
        status: 400
      }
    );
  });
});

