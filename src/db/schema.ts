import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const brands = sqliteTable("brands", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  category: text("category").notNull(),
  description: text("description"),
  competitors: text("competitors"), // JSON string
  personality: text("personality"),
  websiteUrl: text("website_url"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const brandDataCards = sqliteTable("brand_data_cards", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  brandId: integer("brand_id").references(() => brands.id),
  cardJson: text("card_json").notNull(),
  version: integer("version").default(1),
  isActive: integer("is_active").default(1),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const auditQueries = sqliteTable("audit_queries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  brandId: integer("brand_id").references(() => brands.id),
  queryText: text("query_text").notNull(),
  category: text("category"),
  isActive: integer("is_active").default(1),
});

export const auditRuns = sqliteTable("audit_runs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  brandId: integer("brand_id").references(() => brands.id),
  runDate: text("run_date"),
  status: text("status"),
  summaryJson: text("summary_json"),
});

export const auditResults = sqliteTable("audit_results", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  auditRunId: integer("audit_run_id").references(() => auditRuns.id),
  queryText: text("query_text"),
  platform: text("platform").default("claude"),
  responseText: text("response_text"),
  brandMentioned: integer("brand_mentioned"),
  brandRecommended: integer("brand_recommended"),
  mentionPosition: integer("mention_position"),
  sentiment: text("sentiment"),
  accuracyScore: real("accuracy_score"),
  competitorsMentioned: text("competitors_mentioned"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const offerRules = sqliteTable("offer_rules", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  brandId: integer("brand_id").references(() => brands.id),
  triggerWhen: text("trigger_when"),
  triggerKeywords: text("trigger_keywords"), // JSON
  offerText: text("offer_text"),
  offerType: text("offer_type"),
  discountPercent: real("discount_percent"),
  conditions: text("conditions"),
  isActive: integer("is_active").default(1),
});

export const negotiations = sqliteTable("negotiations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  brandId: integer("brand_id").references(() => brands.id),
  offerRuleId: integer("offer_rule_id"),
  consumerAgent: text("consumer_agent"),
  inboundQuery: text("inbound_query"),
  matchedIntent: text("matched_intent"),
  offerServed: text("offer_served"),
  agentResponse: text("agent_response"),
  accepted: integer("accepted"),
  revenueAttributed: real("revenue_attributed"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const claims = sqliteTable("claims", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  brandId: integer("brand_id").references(() => brands.id),
  category: text("category"),
  statement: text("statement"),
  fieldPath: text("field_path"),
  claimedValue: text("claimed_value"),
  evidenceType: text("evidence_type"),
  evidenceSource: text("evidence_source"),
  evidenceData: text("evidence_data"),
  evidenceHash: text("evidence_hash"),
  verificationStatus: text("verification_status").default("pending"),
  trustWeight: real("trust_weight").default(1.0),
  lastVerified: text("last_verified"),
});

export const attestations = sqliteTable("attestations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  brandId: integer("brand_id").references(() => brands.id),
  cardHash: text("card_hash"),
  trustScore: real("trust_score"),
  claimsTotal: integer("claims_total"),
  claimsVerified: integer("claims_verified"),
  signature: text("signature"),
  signedBy: text("signed_by").default("did:web:napkin.ie"),
  validUntil: text("valid_until"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const brandPolicies = sqliteTable("brand_policies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  brandId: integer("brand_id").references(() => brands.id),
  policyType: text("policy_type"),
  rule: text("rule"),
  enforcement: text("enforcement").default("warn"),
  isActive: integer("is_active").default(1),
});

export const asovDaily = sqliteTable("asov_daily", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  brandId: integer("brand_id").references(() => brands.id),
  date: text("date"),
  asovScore: real("asov_score"),
  mentionRate: real("mention_rate"),
  recommendRate: real("recommend_rate"),
  avgPosition: real("avg_position"),
  layer1Score: real("layer1_score"),
  layer2Score: real("layer2_score"),
  layer3Score: real("layer3_score"),
  arbScore: real("arb_score"),
  competitorScores: text("competitor_scores"), // JSON
});
