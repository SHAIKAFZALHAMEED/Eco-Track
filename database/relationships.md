# EcoTrack Campus — Database Relationships & Integrity Constraints

## Foreign Key Relationships

The relational architecture ensures referential integrity across all transactional activity data:

```
[buildings] 1 ──────────< M [emission_records]
[categories] 1 ─────────< M [emission_factors]
[categories] 1 ─────────< M [emission_records]
[emission_factors] 1 ───< M [emission_records]
```

### 1. `buildings` 1-to-Many `emission_records`
- **Parent:** `buildings.building_id`
- **Child:** `emission_records.building_id`
- **Foreign Key:** `fk_record_building`
- **Integrity Rule:** `RESTRICT / NO ACTION` (default). Deletion of a building with linked records is prevented at the database and application levels to preserve institutional audit trails.

### 2. `categories` 1-to-Many `emission_factors`
- **Parent:** `categories.category_id`
- **Child:** `emission_factors.category_id`
- **Foreign Key:** `fk_factor_category`
- **Integrity Rule:** Factors cannot exist without a valid parent category.
- **Unique Constraint:** `uq_factor_name_category (category_id, factor_name)` ensures no duplicate factor names exist within the same category.

### 3. `categories` 1-to-Many `emission_records`
- **Parent:** `categories.category_id`
- **Child:** `emission_records.category_id`
- **Foreign Key:** `fk_record_category`
- **Integrity Rule:** Fast category partitioning and filtering.

### 4. `emission_factors` 1-to-Many `emission_records`
- **Parent:** `emission_factors.factor_id`
- **Child:** `emission_records.factor_id`
- **Foreign Key:** `fk_record_factor`
- **Integrity Rule:** Deletion of an emission factor that has linked records is rejected. Factors must be deactivated (`is_active = FALSE`) instead of deleted so future entries cannot use them while past records remain valid.

---

## The Factor Snapshot Design Pattern

In environmental and carbon accounting, conversion factors change over time (e.g. as the regional electricity grid gets greener each year). 

If an application directly multiplied historical activities by a dynamic factor table, historical reported emissions from 2024 would retroactively change whenever a 2026 factor was updated.

To prevent this critical reporting flaw, EcoTrack Campus implements the **Snapshot Pattern**:
1. At logging time, the current active factor's `factor_value` is copied into `emission_records.factor_value_snapshot`.
2. The emissions formula computes:
   $$\text{emissions\_kg\_co2e} = \text{activity\_quantity} \times \text{factor\_value\_snapshot}$$
3. When updating a record, the historical snapshot is preserved by default unless the auditor explicitly requests a factor recalculation.

