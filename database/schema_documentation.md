# EcoTrack Campus — Database Schema Documentation

## Database Overview
- **Database Engine:** MySQL 8.0
- **Database Name:** `ecotrack_campus`
- **Character Set:** `utf8mb4`
- **Collation:** `utf8mb4_unicode_ci`
- **Application Context:** Local Academic Carbon Emission Monitoring & Analytics Prototype

---

## 1. Table: `buildings`
Stores campus facilities, residential blocks, and academic units where activities occur.

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `building_id` | `BIGINT UNSIGNED` | `PRIMARY KEY`, `AUTO_INCREMENT` | Unique system identifier for each building |
| `building_name` | `VARCHAR(120)` | `NOT NULL`, `UNIQUE` | Official name of the building |
| `location` | `VARCHAR(160)` | `NOT NULL`, `DEFAULT 'Campus'` | Sector, zone, or campus area |
| `created_at` | `TIMESTAMP` | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP` | Row creation timestamp |

### Initial Reference Records:
1. `Central Academic Block` (`location: 'Campus'`)
2. `Science and Laboratory Block` (`location: 'Campus'`)
3. `Central Library` (`location: 'Campus'`)
4. `Administrative Block` (`location: 'Campus'`)
5. `Student Hostel` (`location: 'Campus'`)

---

## 2. Table: `categories`
Stores major GHG Scope activity categories tracked across the campus.

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `category_id` | `BIGINT UNSIGNED` | `PRIMARY KEY`, `AUTO_INCREMENT` | Unique category identifier |
| `category_code` | `VARCHAR(30)` | `NOT NULL`, `UNIQUE` | Short machine code (`ELECTRICITY`, `FUEL`, `WASTE`) |
| `category_name` | `VARCHAR(80)` | `NOT NULL`, `UNIQUE` | User-facing display name |
| `description` | `VARCHAR(255)` | `NULL` | Detailed category scope description |

### Initial Reference Records:
1. `ELECTRICITY` — Electricity (Grid electricity consumption — GHG Scope 2)
2. `FUEL` — Fuel & Transport (Vehicle and generator fuel combustion — GHG Scope 1)
3. `WASTE` — Waste (Waste treatment and landfill disposal — GHG Scope 3)

---

## 3. Table: `emission_factors`
Stores carbon emission conversion factors per activity category.

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `factor_id` | `BIGINT UNSIGNED` | `PRIMARY KEY`, `AUTO_INCREMENT` | Unique factor identifier |
| `category_id` | `BIGINT UNSIGNED` | `NOT NULL`, `FK -> categories.category_id` | Linked activity category |
| `factor_name` | `VARCHAR(120)` | `NOT NULL` | Name of energy/fuel/waste factor |
| `activity_unit` | `VARCHAR(30)` | `NOT NULL` | Activity measurement unit (`kWh`, `litre`, `kg`) |
| `factor_value` | `DECIMAL(12,6)` | `NOT NULL` | Conversion factor in kg CO2e per activity unit |
| `emission_unit` | `VARCHAR(30)` | `NOT NULL`, `DEFAULT 'kg CO2e'` | Output emission unit |
| `source_name` | `VARCHAR(255)` | `NOT NULL` | Origin/citation of factor |
| `is_active` | `BOOLEAN` (`TINYINT(1)`) | `NOT NULL`, `DEFAULT 1` | Active flag; deactivated factors are kept for audit |
| `created_at` | `TIMESTAMP` | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP` | Row creation timestamp |

### Composite Constraints:
- `UNIQUE KEY uq_factor_name_category (category_id, factor_name)`

### Prototype Reference Factors:
| Factor Name | Category | Activity Unit | Factor Value (kg CO2e / unit) | Scope |
| :--- | :--- | :--- | :--- | :--- |
| Grid electricity | ELECTRICITY | `kWh` | `0.710000` | Scope 2 |
| Petrol | FUEL | `litre` | `2.313000` | Scope 1 |
| Diesel | FUEL | `litre` | `2.661000` | Scope 1 |
| Composting | WASTE | `kg` | `0.320000` | Scope 3 |
| Landfill | WASTE | `kg` | `1.290000` | Scope 3 |

> [!WARNING]
> These factor values are project prototypes. Local institutional GHG reporting requires verification against official national grid benchmarks and IPCC guidelines.

---

## 4. Table: `emission_records`
Stores transactional activity logs and calculated greenhouse gas emissions.

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `record_id` | `BIGINT UNSIGNED` | `PRIMARY KEY`, `AUTO_INCREMENT` | Unique record identifier |
| `building_id` | `BIGINT UNSIGNED` | `NOT NULL`, `FK -> buildings.building_id` | Facility where emission occurred |
| `category_id` | `BIGINT UNSIGNED` | `NOT NULL`, `FK -> categories.category_id` | Category code reference |
| `factor_id` | `BIGINT UNSIGNED` | `NOT NULL`, `FK -> emission_factors.factor_id` | Factor used for calculation |
| `activity_name` | `VARCHAR(180)` | `NOT NULL` | Human-readable activity or meter label |
| `activity_quantity` | `DECIMAL(14,3)` | `NOT NULL`, `CHECK (activity_quantity > 0)` | Consumed amount in activity units |
| `activity_unit` | `VARCHAR(30)` | `NOT NULL` | Unit snapshot copied at entry time |
| `factor_value_snapshot` | `DECIMAL(12,6)` | `NOT NULL` | Factor value snapshot at the time of entry |
| `emissions_kg_co2e` | `DECIMAL(16,4)` | `NOT NULL` | Computed emissions: `activity_quantity * snapshot` |
| `record_date` | `DATE` | `NOT NULL` | Activity date (YYYY-MM-DD) |
| `notes` | `TEXT` | `NULL` | Optional audit notes or meter IDs |
| `created_at` | `TIMESTAMP` | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP` | Audit creation timestamp |
| `updated_at` | `TIMESTAMP` | `NOT NULL`, `ON UPDATE CURRENT_TIMESTAMP` | Audit update timestamp |

### Indexes:
- `idx_record_date (record_date)`
- `idx_record_category (category_id)`
- `idx_record_building (building_id)`

