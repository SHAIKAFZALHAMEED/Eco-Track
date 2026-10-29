import React from 'react';
import {
  Database,
  Layers,
  Calculator,
  ShieldCheck,
  Server,
  Code2,
  CheckCircle2,
  ExternalLink,
  Table,
  Cpu,
  Key
} from 'lucide-react';

export default function ProjectInfoPage({ healthData }) {
  const isConnected = healthData?.database?.connected;

  return (
    <div className="space-y-8 max-w-5xl">
      {/* System Overview Card */}
      <div className="p-8 bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 text-white rounded-3xl border border-emerald-900/60 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Academic Engineering Project
              </span>
              <span className="text-xs text-slate-400">Version 1.0.0</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              EcoTrack Campus
            </h2>
            <p className="text-sm text-emerald-200/80 max-w-2xl leading-relaxed">
              Campus Carbon Emission Monitoring & Analytics System. Built with React, Vite, Node.js, Express, and a verified MySQL 8 relational schema with strict referential integrity and audit snapshot protection.
            </p>
          </div>

          {/* Database Live Connectivity Box */}
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-xs space-y-2 shrink-0">
            <div className="flex items-center justify-between gap-4 font-bold">
              <span>MySQL 8 Connection:</span>
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] ${
                isConnected ? 'bg-emerald-500/30 text-emerald-300' : 'bg-rose-500/30 text-rose-300'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                {isConnected ? 'Active & Healthy' : 'Disconnected'}
              </span>
            </div>
            <div className="text-[11px] text-slate-300 space-y-1 font-mono">
              <p>Host: {healthData?.database?.host || 'localhost'}:{healthData?.database?.port || 3306}</p>
              <p>Database: {healthData?.database?.database || 'ecotrack_campus'}</p>
              <p>Server Latency: {healthData?.database?.latencyMs ?? '—'} ms</p>
            </div>
          </div>
        </div>
      </div>

      {/* Architecture & Tech Stack */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
          <div className="p-2 rounded-xl bg-sky-50 text-sky-700">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">System Architecture</h3>
            <p className="text-xs text-slate-500">Tiered separation of concerns and data flow</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="font-bold text-sky-800 uppercase tracking-wider block">1. Presentation Tier</span>
            <p className="text-slate-600 leading-relaxed">
              <strong>React 18 + Vite:</strong> Component-based SPA architecture styled with Tailwind CSS, Lucide icons, and Recharts analytics visualizations. All calculations display live validation previews before API transmission.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="font-bold text-emerald-800 uppercase tracking-wider block">2. Application Tier</span>
            <p className="text-slate-600 leading-relaxed">
              <strong>Node.js + Express:</strong> RESTful API layer with centralized error handling, parameterized SQL execution, backend calculation enforcement, and CORS protection. No credentials exposed to client.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="font-bold text-purple-800 uppercase tracking-wider block">3. Relational Persistence</span>
            <p className="text-slate-600 leading-relaxed">
              <strong>MySQL 8.0:</strong> InnoDB engine with foreign key constraints, CHECK validations, BIGINT primary keys, and DECIMAL(12,6) numeric precision. Historical snapshot preservation guarantees audit safety.
            </p>
          </div>
        </div>
      </div>

      {/* Relational Schema Viewer */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800">
            <Table className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Relational Schema & Foreign Keys</h3>
            <p className="text-xs text-slate-500">Verified tables in database <code className="font-mono text-emerald-700">ecotrack_campus</code></p>
          </div>
        </div>

        {/* EER Diagram Representation */}
        <div className="p-5 rounded-xl bg-slate-900 text-slate-200 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800">
          <pre>{`
  +-------------------------------------------------------+
  |                      BUILDINGS                        |
  +-------------------------------------------------------+
  | PK  building_id   : BIGINT UNSIGNED AUTO_INCREMENT    |
  | UK  building_name : VARCHAR(120)                      |
  |     location      : VARCHAR(160) DEFAULT 'Campus'     |
  |     created_at    : TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  +-------------------------------------------------------+
                            | 1
                            |
                            | M (fk_record_building)
                            v
  +-------------------------------------------------------+          +--------------------------------------------------+
  |                   EMISSION_RECORDS                    |          |                    CATEGORIES                    |
  +-------------------------------------------------------+          +--------------------------------------------------+
  | PK  record_id              : BIGINT UNSIGNED AUTO_INC |          | PK  category_id   : BIGINT UNSIGNED AUTO_INC     |
  | FK  building_id            : BIGINT UNSIGNED          |          | UK  category_code : VARCHAR(30)                  |
  | FK  category_id            : BIGINT UNSIGNED <--------+----+ 1   | UK  category_name : VARCHAR(80)                  |
  | FK  factor_id              : BIGINT UNSIGNED          |    |     |     description   : VARCHAR(255)                 |
  |     activity_name          : VARCHAR(180)             |    |     +--------------------------------------------------+
  |     activity_quantity      : DECIMAL(14,3) CHECK > 0  |    |                              | 1
  |     activity_unit          : VARCHAR(30)              |    |                              |
  |     factor_value_snapshot  : DECIMAL(12,6)            |    | M                            | M (fk_factor_category)
  |     emissions_kg_co2e      : DECIMAL(16,4)            |    | (fk_record_category)         v
  |     record_date            : DATE                     |    |     +--------------------------------------------------+
  |     notes                  : TEXT                     |    |     |                 EMISSION_FACTORS                 |
  |     created_at             : TIMESTAMP                |    |     +--------------------------------------------------+
  |     updated_at             : TIMESTAMP ON UPDATE      |    |     | PK  factor_id     : BIGINT UNSIGNED AUTO_INC     |
  +-------------------------------------------------------+    |     | FK  category_id   : BIGINT UNSIGNED              |
                            ^                                  |     |     factor_name   : VARCHAR(120)                 |
                            | M (fk_record_factor)             |     |     activity_unit : VARCHAR(30)                  |
                            +----------------------------------+     |     factor_value  : DECIMAL(12,6)                |
                                                                     |     emission_unit : VARCHAR(30) DEFAULT 'kg CO2e'|
                                                                     |     source_name   : VARCHAR(255)                 |
                                                                     |     is_active     : BOOLEAN DEFAULT 1            |
                                                                     |     created_at    : TIMESTAMP                    |
                                                                     +--------------------------------------------------+
`}</pre>
        </div>
      </div>

      {/* Carbon Emission Mathematics & Scopes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Formulas Card */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center space-x-2.5 pb-2 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Carbon Accounting Formula</h3>
              <p className="text-xs text-slate-500">Authoritative calculation engine</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800 space-y-2">
            <p className="font-bold text-emerald-800 text-sm">
              Emissions (kg CO2e) = Activity Quantity × Factor Snapshot
            </p>
            <p className="text-slate-600">
              Metric Tonnes CO2e = Emissions (kg CO2e) / 1,000
            </p>
          </div>

          <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
            <p>
              <strong>The Snapshot Pattern:</strong> Rather than performing runtime joins against variable factor values, EcoTrack copies the active factor value into <code className="text-slate-800 bg-slate-100 px-1 py-0.5 rounded font-mono">factor_value_snapshot</code> upon creation.
            </p>
            <p>
              This ensures that future updates to grid emission factors do not retroactively distort prior years' audited environmental reports.
            </p>
          </div>
        </div>

        {/* GHG Protocol Scopes */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center space-x-2.5 pb-2 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">GHG Protocol Scope Mapping</h3>
              <p className="text-xs text-slate-500">Corporate and academic standard alignment</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/70 text-slate-800">
              <span className="font-bold text-amber-900 block">Scope 1 — Direct Combustion (Fuel & Fleet)</span>
              <p className="text-slate-600 mt-0.5">
                On-campus mobile fleet fuels (petrol, diesel) and stationary emergency backup generators.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-sky-50 border border-sky-200/70 text-slate-800">
              <span className="font-bold text-sky-900 block">Scope 2 — Indirect Generation (Electricity)</span>
              <p className="text-slate-600 mt-0.5">
                Purchased grid electricity utilized for facility illumination, HVAC, server rooms, and laboratories.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-purple-50 border border-purple-200/70 text-slate-800">
              <span className="font-bold text-purple-900 block">Scope 3 — Value Chain (Waste Treatment)</span>
              <p className="text-slate-600 mt-0.5">
                End-of-life treatment of campus solid waste (diverted organic composting vs landfill disposal).
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Validation Rules and System Boundaries */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          System Validation Rules & Integrity Controls
        </h4>
        <ul className="text-xs text-slate-600 space-y-2 list-disc pl-5 leading-relaxed">
          <li>
            <strong>Check Constraints:</strong> MySQL schema enforces <code className="font-mono">CHECK (activity_quantity &gt; 0)</code> to prevent zero or negative consumption entries.
          </li>
          <li>
            <strong>Referential Restraints:</strong> Campus buildings and emission factors referenced by active records cannot be deleted. Deletion returns HTTP 409 Conflict with an explanatory diagnostic message.
          </li>
          <li>
            <strong>Server Authoritative Calculations:</strong> The Node.js Express backend validates factor ownership and recalculates emissions server-side, preventing client-side total tampering.
          </li>
          <li>
            <strong>Timezone Consistency:</strong> MySQL timestamps and dates are handled in UTC with string-based serializations to prevent calendar date off-by-one shifts.
          </li>
        </ul>
      </div>
    </div>
  );
}

