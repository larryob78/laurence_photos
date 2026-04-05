import Database from 'better-sqlite3';
import path from 'path';

const dbPath = process.env.DATABASE_URL?.replace('file:', '') || './napkin-a2a.db';
const sqlite = new Database(path.resolve(process.cwd(), dbPath));
sqlite.pragma('journal_mode = WAL');

console.log('Creating tables...');

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS brands (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    competitors TEXT,
    personality TEXT,
    website_url TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS brand_data_cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    brand_id INTEGER REFERENCES brands(id),
    card_json TEXT NOT NULL,
    version INTEGER DEFAULT 1,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS audit_queries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    brand_id INTEGER REFERENCES brands(id),
    query_text TEXT NOT NULL,
    category TEXT,
    is_active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS audit_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    brand_id INTEGER REFERENCES brands(id),
    run_date TEXT,
    status TEXT,
    summary_json TEXT
  );

  CREATE TABLE IF NOT EXISTS audit_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    audit_run_id INTEGER REFERENCES audit_runs(id),
    query_text TEXT,
    platform TEXT DEFAULT 'claude',
    response_text TEXT,
    brand_mentioned INTEGER,
    brand_recommended INTEGER,
    mention_position INTEGER,
    sentiment TEXT,
    accuracy_score REAL,
    competitors_mentioned TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS offer_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    brand_id INTEGER REFERENCES brands(id),
    trigger_when TEXT,
    trigger_keywords TEXT,
    offer_text TEXT,
    offer_type TEXT,
    discount_percent REAL,
    conditions TEXT,
    is_active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS negotiations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    brand_id INTEGER REFERENCES brands(id),
    offer_rule_id INTEGER,
    consumer_agent TEXT,
    inbound_query TEXT,
    matched_intent TEXT,
    offer_served TEXT,
    agent_response TEXT,
    accepted INTEGER,
    revenue_attributed REAL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS claims (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    brand_id INTEGER REFERENCES brands(id),
    category TEXT,
    statement TEXT,
    field_path TEXT,
    claimed_value TEXT,
    evidence_type TEXT,
    evidence_source TEXT,
    evidence_data TEXT,
    evidence_hash TEXT,
    verification_status TEXT DEFAULT 'pending',
    trust_weight REAL DEFAULT 1.0,
    last_verified TEXT
  );

  CREATE TABLE IF NOT EXISTS attestations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    brand_id INTEGER REFERENCES brands(id),
    card_hash TEXT,
    trust_score REAL,
    claims_total INTEGER,
    claims_verified INTEGER,
    signature TEXT,
    signed_by TEXT DEFAULT 'did:web:napkin.ie',
    valid_until TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS brand_policies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    brand_id INTEGER REFERENCES brands(id),
    policy_type TEXT,
    rule TEXT,
    enforcement TEXT DEFAULT 'warn',
    is_active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS asov_daily (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    brand_id INTEGER REFERENCES brands(id),
    date TEXT,
    asov_score REAL,
    mention_rate REAL,
    recommend_rate REAL,
    avg_position REAL,
    layer1_score REAL,
    layer2_score REAL,
    layer3_score REAL,
    arb_score REAL,
    competitor_scores TEXT
  );
`);

console.log('All tables created successfully.');
sqlite.close();
