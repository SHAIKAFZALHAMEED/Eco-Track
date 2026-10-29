# EcoTrack Campus — Campus Carbon Emission Monitoring and Analytics System

A full-stack sustainability web application designed for campus facility managers and academic institutions to monitor, analyze, and report greenhouse gas (GHG) emissions across buildings and utility categories.

---

## 🌟 Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, Lucide React, Recharts
- **Backend:** Node.js, Express, RESTful API
- **Database:** MySQL 8.0, `mysql2/promise` connection pool
- **Architecture:** Tiered client-server with authoritative backend calculations and historical snapshot preservation.

---

## 🚀 Quick Start (Windows)

### 1. Configure MySQL Credentials
Ensure your local MySQL service is running. Database connection credentials are read from `server/.env`:
```ini
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=YOUR_LOCAL_MYSQL_PASSWORD
MYSQL_DATABASE=ecotrack_campus
PORT=5000
```

### 2. Run the Application
Open PowerShell or Command Prompt in the project directory (`d:\EcoTrack-Campus-MySQL`):

#### Option A: Start Both Frontend and Backend Simultaneously
```powershell
npm run dev
```

#### Option B: Run in Separate Windows Terminals

**Terminal 1 (Backend API):**
```powershell
npm run server
```
*Backend runs on: `http://localhost:5000`*

**Terminal 2 (Frontend Client):**
```powershell
npm run client
```
*Frontend runs on: `http://localhost:5173`*

---

## 🧪 Automated Testing

Run the automated backend test suite (emission calculation formulas and API validation rules):
```powershell
npm run test
```

---

## 📁 System Navigation & Modules

| Module | Route / Tab | Description |
| :--- | :--- | :--- |
| **Dashboard** | `Dashboard` | Real-time KPI summary, category distribution bar chart, facility comparison, chronological emission trends, and automated reduction recommendations. |
| **Electricity** | `Electricity` | Scope 2 grid electricity logging with live calculation preview (`kWh × 0.710 = kg CO2e`), consumption trend area chart, and ledger. |
| **Fuel & Transport** | `Fuel & Transport` | Scope 1 mobile & stationary fuel logging (Petrol: 2.313 kg/L, Diesel: 2.661 kg/L), fleet breakdown comparison, and ledger. |
| **Waste Management** | `Waste Management` | Scope 3 solid waste logging comparing composting (0.320 kg/kg) vs landfill (1.290 kg/kg) with avoided methane highlights (~75% reduction). |
| **Emission Records** | `Emission Records` | Master activity ledger with text search, category filters, facility filters, date bounds, pagination, and CSV export. |
| **Reports & Analytics** | `Reports & Analytics` | Weekly, monthly, and yearly executive carbon reports with CSV export and print-ready layout (`window.print()`). |
| **Buildings** | `Buildings` | Campus facility registry with linked record protection (prevents accidental deletion of facilities that have active emission records). |
| **Emission Factors** | `Emission Factors` | Prototype conversion factors table with active/inactive toggles, positive factor value validation, and referenced factor locking. |
| **Database & Project Info** | `Database & Project Info` | Full architectural overview, EER diagram, GHG protocol scopes, formula definitions, and live MySQL ping latency. |

---

## 🔒 Security & Data Integrity Highlights

1. **No Frontend Credentials:** Database credentials reside exclusively in `server/.env` and are never bundled into client JavaScript.
2. **Server-Authoritative Calculations:** Emissions are calculated on the backend (`activity_quantity × factor_value_snapshot`), preventing arbitrary totals from being posted by the client.
3. **The Snapshot Pattern:** When a record is logged, the active factor value is saved to `factor_value_snapshot`. Historical reports never distort when baseline grid factors are updated in subsequent years.
4. **Referential Restraints:** Foreign key checks remain strictly enabled in MySQL (`fk_record_building`, `fk_record_category`, `fk_record_factor`). Deleting referenced buildings or factors is rejected with a descriptive `HTTP 409 Conflict`.
5. **Non-Destructive Design:** No existing database tables or reference entries were altered or erased.

---

## 📊 Database Documentation

Detailed database architectural documentation is available in:
- `database/schema_documentation.md`
- `database/relationships.md`
- `docs/ER_DIAGRAM.mmd`

