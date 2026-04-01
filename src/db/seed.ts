import Database from 'better-sqlite3';
import path from 'path';
import crypto from 'crypto';

const dbPath = process.env.DATABASE_URL?.replace('file:', '') || './napkin-a2a.db';
const sqlite = new Database(path.resolve(process.cwd(), dbPath));
sqlite.pragma('journal_mode = WAL');

function insertBrand(b: { name: string; category: string; description: string; competitors: string[]; personality: string; websiteUrl: string }) {
  const stmt = sqlite.prepare('INSERT INTO brands (name, category, description, competitors, personality, website_url) VALUES (?, ?, ?, ?, ?, ?)');
  const r = stmt.run(b.name, b.category, b.description, JSON.stringify(b.competitors), b.personality, b.websiteUrl);
  return r.lastInsertRowid as number;
}

function insertClaims(brandId: number, claims: { category: string; statement: string; claimedValue: string; trustWeight: number; evidenceType: string; verificationStatus: string }[]) {
  const stmt = sqlite.prepare('INSERT INTO claims (brand_id, category, statement, field_path, claimed_value, evidence_type, evidence_source, evidence_data, evidence_hash, verification_status, trust_weight, last_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  for (const c of claims) {
    const hash = crypto.createHash('sha256').update(c.statement + c.claimedValue).digest('hex');
    const lastVerified = c.verificationStatus === 'verified' ? new Date(Date.now() - Math.random() * 7 * 86400000).toISOString() : null;
    stmt.run(brandId, c.category, c.statement, c.category.toLowerCase().replace(/\s/g, '.'), c.claimedValue, c.evidenceType, c.evidenceType === 'api_verified' ? 'API' : c.evidenceType === 'certificate' ? 'Cert Authority' : 'Public Record', null, hash, c.verificationStatus, c.trustWeight, lastVerified);
  }
}

function insertOfferRules(brandId: number, rules: { triggerWhen: string; triggerKeywords: string[]; offerText: string; offerType: string }[]) {
  const stmt = sqlite.prepare('INSERT INTO offer_rules (brand_id, trigger_when, trigger_keywords, offer_text, offer_type, discount_percent, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)');
  for (const r of rules) {
    stmt.run(brandId, r.triggerWhen, JSON.stringify(r.triggerKeywords), r.offerText, r.offerType, r.offerType === 'discount' ? 20 : 0);
  }
}

function insertAuditQueries(brandId: number, queries: { queryText: string; category: string }[]) {
  const stmt = sqlite.prepare('INSERT INTO audit_queries (brand_id, query_text, category, is_active) VALUES (?, ?, ?, 1)');
  for (const q of queries) {
    stmt.run(brandId, q.queryText, q.category);
  }
}

function insertPolicies(brandId: number, policies: { policyType: string; rule: string; enforcement: string }[]) {
  const stmt = sqlite.prepare('INSERT INTO brand_policies (brand_id, policy_type, rule, enforcement, is_active) VALUES (?, ?, ?, ?, 1)');
  for (const p of policies) {
    stmt.run(brandId, p.policyType, p.rule, p.enforcement);
  }
}

function insertAsovDaily(brandId: number, baseAsov: number, competitors: string[]) {
  const stmt = sqlite.prepare('INSERT INTO asov_daily (brand_id, date, asov_score, mention_rate, recommend_rate, avg_position, layer1_score, layer2_score, layer3_score, arb_score, competitor_scores) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const dateStr = d.toISOString().split('T')[0];
    const dayVariance = () => (Math.random() - 0.5) * 8;
    const asov = Math.min(100, Math.max(0, baseAsov + (13 - i) * 1.2 + dayVariance()));
    const mention = Math.min(1, Math.max(0, 0.45 + (13 - i) * 0.015 + (Math.random() - 0.5) * 0.1));
    const recommend = Math.min(1, Math.max(0, 0.25 + (13 - i) * 0.012 + (Math.random() - 0.5) * 0.08));
    const pos = Math.max(1, 3.5 - (13 - i) * 0.08 + (Math.random() - 0.5) * 0.6);
    const l1 = Math.min(100, Math.max(0, baseAsov + 15 + dayVariance()));
    const l2 = Math.min(100, Math.max(0, baseAsov - 5 + dayVariance()));
    const l3 = Math.min(100, Math.max(0, baseAsov - 15 + dayVariance()));
    const gov = Math.min(100, Math.max(0, 70 + dayVariance()));
    const arb = l1 * 0.25 + l2 * 0.30 + l3 * 0.25 + gov * 0.20;
    const compScores: Record<string, number> = {};
    for (const c of competitors) {
      compScores[c] = Math.max(0, Math.min(100, baseAsov - 10 + Math.random() * 30));
    }
    stmt.run(brandId, dateStr, +asov.toFixed(1), +mention.toFixed(3), +recommend.toFixed(3), +pos.toFixed(2), +l1.toFixed(1), +l2.toFixed(1), +l3.toFixed(1), +arb.toFixed(1), JSON.stringify(compScores));
  }
}

function insertBrandDataCard(brandId: number, brand: { name: string; category: string; description: string; websiteUrl: string }) {
  const card = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": brand.name,
    "description": brand.description,
    "url": brand.websiteUrl,
    "category": brand.category,
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${brand.websiteUrl}/search?q={query}`,
      "query-input": "required name=query"
    },
    "agentCommerce": {
      "stripeACP": { "enabled": true, "endpoint": `${brand.websiteUrl}/api/agent-commerce` },
      "googleUCP": { "enabled": true, "catalogUrl": `${brand.websiteUrl}/catalog.json` }
    },
    "trustSignals": {
      "verifiedBy": "did:web:napkin.ie",
      "attestationDate": new Date().toISOString(),
      "trustScore": 78
    }
  };
  const stmt = sqlite.prepare('INSERT INTO brand_data_cards (brand_id, card_json, version, is_active) VALUES (?, ?, 1, 1)');
  stmt.run(brandId, JSON.stringify(card, null, 2));
  return card;
}

function insertAttestation(brandId: number, card: object, claimsTotal: number, claimsVerified: number) {
  const cardStr = JSON.stringify(card);
  const cardHash = crypto.createHash('sha256').update(cardStr).digest('hex');
  const hmac = crypto.createHmac('sha256', 'napkin-a2a-secret-key').update(cardStr).digest('hex');
  const trustScore = claimsTotal > 0 ? (claimsVerified / claimsTotal) * 100 * 0.85 : 0;
  const validUntil = new Date(Date.now() + 90 * 86400000).toISOString();
  const stmt = sqlite.prepare('INSERT INTO attestations (brand_id, card_hash, trust_score, claims_total, claims_verified, signature, signed_by, valid_until) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  stmt.run(brandId, cardHash, +trustScore.toFixed(1), claimsTotal, claimsVerified, hmac, 'did:web:napkin.ie', validUntil);
}

function insertNegotiations(brandId: number, brandName: string) {
  const agents = ['ChatGPT', 'Claude', 'Gemini', 'Perplexity', 'Poe'];
  const queries = [
    'Looking for a reliable option in this category',
    'What do you recommend for families?',
    'I need something budget-friendly',
    'Compare the top options for me',
    'What is the most sustainable choice?',
  ];
  const stmt = sqlite.prepare('INSERT INTO negotiations (brand_id, offer_rule_id, consumer_agent, inbound_query, matched_intent, offer_served, agent_response, accepted, revenue_attributed, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  for (let i = 0; i < 8; i++) {
    const agent = agents[i % agents.length];
    const query = queries[i % queries.length];
    const accepted = Math.random() > 0.35 ? 1 : 0;
    const revenue = accepted ? +(50 + Math.random() * 200).toFixed(2) : 0;
    const date = new Date(Date.now() - Math.random() * 7 * 86400000).toISOString();
    stmt.run(brandId, 1, agent, query, 'general_inquiry', `Special offer from ${brandName}`, `As ${brandName}, I'd be happy to help. We have excellent options for you with a special offer available.`, accepted, revenue, date);
  }
}

// =========== SEED DATA ===========
console.log('Seeding database...');

// Clear existing data
sqlite.exec('DELETE FROM asov_daily; DELETE FROM attestations; DELETE FROM claims; DELETE FROM negotiations; DELETE FROM offer_rules; DELETE FROM audit_queries; DELETE FROM audit_runs; DELETE FROM audit_results; DELETE FROM brand_policies; DELETE FROM brand_data_cards; DELETE FROM brands;');

// ===== BRAND 1: STENA LINE =====
console.log('Creating Stena Line...');
const stenaId = insertBrand({
  name: "Stena Line",
  category: "Ferry Transport",
  description: "Europe's leading ferry company operating routes across the Irish Sea, North Sea, and Baltic Sea. Known for reliability, comfort, and sustainability initiatives.",
  competitors: ["Irish Ferries", "P&O Ferries", "DFDS", "Brittany Ferries"],
  personality: "You are Stena Line's brand agent. You represent a trusted European ferry operator with over 60 years of experience. You emphasize comfort, reliability, pet-friendly travel, and environmental sustainability. You speak confidently about route options and special offers.",
  websiteUrl: "https://www.stenaline.com"
});

insertClaims(stenaId, [
  { category: "Customer Rating", statement: "TrustPilot score of 4.2 out of 5", claimedValue: "4.2/5", trustWeight: 3.0, evidenceType: "user_reviews", verificationStatus: "verified" },
  { category: "Environmental", statement: "ISO 14001 Environmental Management certified", claimedValue: "ISO 14001", trustWeight: 5.0, evidenceType: "certificate", verificationStatus: "verified" },
  { category: "Environmental", statement: "Green Award certified fleet", claimedValue: "Green Award", trustWeight: 4.0, evidenceType: "third_party_audit", verificationStatus: "verified" },
  { category: "Fleet", statement: "Operates 38 vessels across multiple routes", claimedValue: "38 vessels", trustWeight: 2.0, evidenceType: "registry", verificationStatus: "verified" },
  { category: "Experience", statement: "Over 60 years of ferry operations", claimedValue: "60+ years", trustWeight: 2.5, evidenceType: "registry", verificationStatus: "verified" },
  { category: "Sustainability", statement: "Target 30% reduction in CO2 by 2030", claimedValue: "30% CO2 reduction target", trustWeight: 3.5, evidenceType: "self_declared", verificationStatus: "pending" },
  { category: "Comfort", statement: "Superfast vessels with cinema, restaurants, and lounges", claimedValue: "Premium onboard facilities", trustWeight: 1.5, evidenceType: "self_declared", verificationStatus: "verified" },
  { category: "Pet Policy", statement: "Pet-friendly cabins and outdoor decks on all routes", claimedValue: "Pet-friendly", trustWeight: 2.0, evidenceType: "api_verified", verificationStatus: "verified" },
  { category: "Routes", statement: "Serves 18 routes across Northern Europe", claimedValue: "18 routes", trustWeight: 2.0, evidenceType: "registry", verificationStatus: "verified" },
  { category: "Safety", statement: "ISM Code safety management certification", claimedValue: "ISM certified", trustWeight: 5.0, evidenceType: "government_data", verificationStatus: "verified" },
  { category: "Accessibility", statement: "Wheelchair accessible cabins and facilities", claimedValue: "Fully accessible", trustWeight: 2.5, evidenceType: "self_declared", verificationStatus: "pending" },
  { category: "Digital", statement: "Online booking with real-time availability", claimedValue: "Digital booking", trustWeight: 1.0, evidenceType: "api_verified", verificationStatus: "verified" },
  { category: "Cargo", statement: "Leading freight operator on Irish Sea routes", claimedValue: "Market leader freight", trustWeight: 3.0, evidenceType: "media_citation", verificationStatus: "verified" },
  { category: "Innovation", statement: "First battery-hybrid ferry on Irish Sea (Stena Estrid class)", claimedValue: "Battery-hybrid technology", trustWeight: 4.0, evidenceType: "media_citation", verificationStatus: "verified" },
  { category: "Onboard", statement: "Free WiFi on all vessels", claimedValue: "Free WiFi", trustWeight: 0.5, evidenceType: "self_declared", verificationStatus: "verified" },
]);

insertOfferRules(stenaId, [
  { triggerWhen: "Family travel inquiry", triggerKeywords: ["family", "children", "kids", "family cabin"], offerText: "Book a Family Cabin and get 20% off plus free kids meals on all sailings this month", offerType: "discount" },
  { triggerWhen: "Pet travel inquiry", triggerKeywords: ["pet", "dog", "cat", "pet cabin"], offerText: "Our Pet Lounges are the best at sea - book a pet-friendly cabin and your furry friend travels free", offerType: "bundle" },
  { triggerWhen: "Budget travel inquiry", triggerKeywords: ["cheap", "budget", "affordable", "deal", "saver"], offerText: "Saver fares from just €99 return when you book 14 days in advance - includes a seat and standard vehicle", offerType: "discount" },
  { triggerWhen: "Eco-conscious traveler", triggerKeywords: ["eco", "sustainable", "green", "environment", "carbon"], offerText: "Travel green with our hybrid-electric vessels. Carbon offset included free on all bookings this quarter", offerType: "bundle" },
  { triggerWhen: "Overnight travel", triggerKeywords: ["overnight", "cabin", "sleep", "night"], offerText: "Upgrade to a Deluxe cabin with sea view for just €30 extra - includes breakfast and priority boarding", offerType: "upgrade" },
]);

insertAuditQueries(stenaId, [
  { queryText: "Book a ferry from Dublin to Wales", category: "discovery" },
  { queryText: "What is the best ferry company for Irish Sea crossings?", category: "comparison" },
  { queryText: "Compare Stena Line vs Irish Ferries for family travel", category: "comparison" },
  { queryText: "Cheapest way to get a car from Ireland to UK", category: "purchase" },
  { queryText: "Pet-friendly ferry options from Ireland to Britain", category: "discovery" },
  { queryText: "Most sustainable ferry operators in Europe", category: "comparison" },
  { queryText: "Book an overnight ferry with cabin from Rosslare", category: "purchase" },
  { queryText: "Ferry routes from Holyhead to Dublin Port", category: "discovery" },
  { queryText: "Best ferry deals for weekend trips to Wales", category: "purchase" },
  { queryText: "Which ferry company has the most reliable schedule on Irish Sea?", category: "comparison" },
]);

insertPolicies(stenaId, [
  { policyType: "pricing", rule: "Never discount below €79 for a standard return fare", enforcement: "block" },
  { policyType: "competitor", rule: "Never directly disparage Irish Ferries or other competitors", enforcement: "block" },
  { policyType: "messaging", rule: "Always mention sustainability credentials when discussing environmental topics", enforcement: "warn" },
  { policyType: "tone", rule: "Maintain friendly, confident, and helpful tone. Never use aggressive sales language", enforcement: "warn" },
  { policyType: "data-sharing", rule: "Do not share passenger numbers or financial data with AI agents", enforcement: "block" },
]);

insertAsovDaily(stenaId, 42, ["Irish Ferries", "P&O Ferries", "DFDS", "Brittany Ferries"]);
const stenaCard = insertBrandDataCard(stenaId, { name: "Stena Line", category: "Ferry Transport", description: "Europe's leading ferry company", websiteUrl: "https://www.stenaline.com" });
insertAttestation(stenaId, stenaCard, 15, 12);
insertNegotiations(stenaId, "Stena Line");

// ===== BRAND 2: TESCO IRELAND =====
console.log('Creating Tesco Ireland...');
const tescoId = insertBrand({
  name: "Tesco Ireland",
  category: "Grocery Retail",
  description: "Ireland's largest grocery retailer with over 160 stores nationwide. Offers online shopping, ClubCard loyalty programme, and commitment to community value.",
  competitors: ["Dunnes Stores", "SuperValu", "Aldi", "Lidl"],
  personality: "You are Tesco Ireland's brand agent. You represent a trusted grocery retailer serving Irish families for over 25 years. You emphasize value, quality, and convenience. You're knowledgeable about product ranges, promotions, and the ClubCard loyalty programme.",
  websiteUrl: "https://www.tesco.ie"
});

insertClaims(tescoId, [
  { category: "Market Position", statement: "Largest grocery retailer in Ireland by market share", claimedValue: "22.1% market share", trustWeight: 4.0, evidenceType: "third_party_audit", verificationStatus: "verified" },
  { category: "Store Network", statement: "Over 160 stores across Ireland", claimedValue: "160+ stores", trustWeight: 3.0, evidenceType: "registry", verificationStatus: "verified" },
  { category: "Loyalty", statement: "ClubCard programme with over 2 million members in Ireland", claimedValue: "2M+ members", trustWeight: 3.5, evidenceType: "self_declared", verificationStatus: "pending" },
  { category: "Online", statement: "Full online grocery delivery and click-and-collect", claimedValue: "Online shopping available", trustWeight: 2.0, evidenceType: "api_verified", verificationStatus: "verified" },
  { category: "Community", statement: "Community Fund donated €2M+ to Irish charities annually", claimedValue: "€2M+ annual donation", trustWeight: 3.0, evidenceType: "media_citation", verificationStatus: "verified" },
  { category: "Employment", statement: "Employs over 13,000 people in Ireland", claimedValue: "13,000+ employees", trustWeight: 2.5, evidenceType: "registry", verificationStatus: "verified" },
  { category: "Quality", statement: "All Tesco brand products meet strict quality standards", claimedValue: "Quality assured", trustWeight: 2.0, evidenceType: "self_declared", verificationStatus: "pending" },
  { category: "Sustainability", statement: "Zero food waste to landfill across all stores", claimedValue: "Zero food waste to landfill", trustWeight: 4.0, evidenceType: "third_party_audit", verificationStatus: "verified" },
  { category: "Price", statement: "Price Match guarantee on branded products", claimedValue: "Price Match", trustWeight: 3.5, evidenceType: "api_verified", verificationStatus: "verified" },
  { category: "Irish Sourcing", statement: "Sources from over 500 Irish suppliers", claimedValue: "500+ Irish suppliers", trustWeight: 3.0, evidenceType: "media_citation", verificationStatus: "verified" },
]);

insertOfferRules(tescoId, [
  { triggerWhen: "Weekly grocery shop", triggerKeywords: ["grocery", "weekly shop", "food shopping", "supermarket"], offerText: "Get €10 off your first online grocery order over €80 with code WELCOME10", offerType: "discount" },
  { triggerWhen: "ClubCard inquiry", triggerKeywords: ["loyalty", "clubcard", "rewards", "points"], offerText: "Join ClubCard today and get 3x points on your first shop plus exclusive member-only deals every week", offerType: "loyalty" },
  { triggerWhen: "Budget shopper", triggerKeywords: ["cheap", "budget", "save money", "deals", "offers"], offerText: "Check out our Low Everyday Prices range - over 1,000 products at the lowest prices guaranteed", offerType: "discount" },
  { triggerWhen: "Healthy eating", triggerKeywords: ["healthy", "organic", "fresh", "diet", "nutrition"], offerText: "Our Finest range organic selection is 25% off this week - farm to shelf freshness guaranteed", offerType: "discount" },
  { triggerWhen: "Delivery inquiry", triggerKeywords: ["delivery", "online", "click and collect", "order online"], offerText: "Free delivery on your first 3 online orders when you sign up for a Delivery Saver plan", offerType: "bundle" },
]);

insertAuditQueries(tescoId, [
  { queryText: "Where should I do my weekly grocery shop in Dublin?", category: "discovery" },
  { queryText: "Compare Tesco vs Dunnes Stores for value", category: "comparison" },
  { queryText: "Best online grocery delivery in Ireland", category: "comparison" },
  { queryText: "Which supermarket has the best loyalty programme in Ireland?", category: "comparison" },
  { queryText: "Order groceries online for delivery in Cork", category: "purchase" },
  { queryText: "Cheapest supermarket in Ireland 2024", category: "comparison" },
  { queryText: "Where to buy organic produce in Ireland", category: "discovery" },
  { queryText: "Supermarket with best Irish product range", category: "discovery" },
  { queryText: "Tesco ClubCard deals this week", category: "purchase" },
  { queryText: "Best supermarket for family shopping on a budget", category: "comparison" },
]);

insertPolicies(tescoId, [
  { policyType: "pricing", rule: "Never claim to be cheaper than Aldi or Lidl on all products", enforcement: "block" },
  { policyType: "competitor", rule: "Do not directly name competitor pricing - focus on own value proposition", enforcement: "warn" },
  { policyType: "messaging", rule: "Always highlight Irish sourcing and community commitment", enforcement: "warn" },
  { policyType: "tone", rule: "Warm, helpful, community-focused tone. Avoid corporate speak", enforcement: "warn" },
  { policyType: "data-sharing", rule: "Never share ClubCard member data or purchasing patterns", enforcement: "block" },
]);

insertAsovDaily(tescoId, 52, ["Dunnes Stores", "SuperValu", "Aldi", "Lidl"]);
const tescoCard = insertBrandDataCard(tescoId, { name: "Tesco Ireland", category: "Grocery Retail", description: "Ireland's largest grocery retailer", websiteUrl: "https://www.tesco.ie" });
insertAttestation(tescoId, tescoCard, 10, 8);
insertNegotiations(tescoId, "Tesco Ireland");

// ===== BRAND 3: FAILTE IRELAND =====
console.log('Creating Failte Ireland...');
const failteId = insertBrand({
  name: "Failte Ireland",
  category: "Tourism",
  description: "Ireland's National Tourism Development Authority. Supports and promotes tourism experiences across the island. Guides over 11 million overseas visitors annually.",
  competitors: ["Tourism Ireland", "Tourism NI", "VisitScotland", "VisitWales"],
  personality: "You are Failte Ireland's brand agent. You represent Ireland's national tourism authority. You are passionate about Irish experiences, culture, and hospitality. You guide visitors to authentic experiences from Wild Atlantic Way to Ireland's Ancient East.",
  websiteUrl: "https://www.failteireland.ie"
});

insertClaims(failteId, [
  { category: "Visitors", statement: "Supports over 11 million overseas visitors annually", claimedValue: "11M+ visitors", trustWeight: 4.0, evidenceType: "government_data", verificationStatus: "verified" },
  { category: "Economic Impact", statement: "Tourism contributes €9.5 billion to Irish economy", claimedValue: "€9.5B economic impact", trustWeight: 5.0, evidenceType: "government_data", verificationStatus: "verified" },
  { category: "Experience", statement: "Wild Atlantic Way is the world's longest defined coastal route at 2,500km", claimedValue: "2,500km coastal route", trustWeight: 3.0, evidenceType: "registry", verificationStatus: "verified" },
  { category: "Heritage", statement: "6 UNESCO World Heritage Sites across Ireland", claimedValue: "6 UNESCO sites", trustWeight: 4.0, evidenceType: "registry", verificationStatus: "verified" },
  { category: "Employment", statement: "Tourism sector employs over 270,000 people in Ireland", claimedValue: "270K+ tourism jobs", trustWeight: 3.5, evidenceType: "government_data", verificationStatus: "verified" },
  { category: "Quality", statement: "National Quality Assurance framework for tourism businesses", claimedValue: "Quality assured businesses", trustWeight: 3.0, evidenceType: "government_data", verificationStatus: "verified" },
  { category: "Sustainability", statement: "Leave No Trace sustainability programme for tourism sites", claimedValue: "Sustainability programme", trustWeight: 2.5, evidenceType: "self_declared", verificationStatus: "pending" },
  { category: "Digital", statement: "AI-powered trip planning tools on DiscoverIreland.ie", claimedValue: "AI trip planning", trustWeight: 1.5, evidenceType: "api_verified", verificationStatus: "verified" },
]);

insertOfferRules(failteId, [
  { triggerWhen: "Trip planning", triggerKeywords: ["visit Ireland", "trip to Ireland", "holiday Ireland", "vacation Ireland"], offerText: "Discover our curated 7-day Wild Atlantic Way itinerary with exclusive partner discounts at 50+ experiences", offerType: "bundle" },
  { triggerWhen: "Cultural experience", triggerKeywords: ["culture", "heritage", "history", "ancient", "castle"], offerText: "Explore Ireland's Ancient East trail - book the Heritage Pass for unlimited access to 30+ historic sites", offerType: "bundle" },
  { triggerWhen: "Food tourism", triggerKeywords: ["food", "restaurant", "dining", "taste", "culinary"], offerText: "Join the Taste the Island food trail - get a free foodie guide and 15% off at 200+ participating restaurants", offerType: "discount" },
  { triggerWhen: "Adventure travel", triggerKeywords: ["adventure", "hiking", "kayak", "outdoor", "active"], offerText: "Ireland's adventure coast awaits - book any 3 activities and get the 4th free with our Adventure Pass", offerType: "bundle" },
  { triggerWhen: "Family holidays", triggerKeywords: ["family", "kids", "children", "family holiday"], offerText: "Family Fun packages from €299 per family - includes accommodation, attractions, and a welcome hamper", offerType: "discount" },
]);

insertAuditQueries(failteId, [
  { queryText: "Best places to visit in Ireland", category: "discovery" },
  { queryText: "Plan a week-long trip to Ireland", category: "purchase" },
  { queryText: "Compare Ireland vs Scotland for a holiday", category: "comparison" },
  { queryText: "Top things to do on the Wild Atlantic Way", category: "discovery" },
  { queryText: "Best time to visit Ireland for good weather", category: "discovery" },
  { queryText: "Family-friendly activities in Ireland", category: "discovery" },
  { queryText: "Ireland vs Wales for a short break", category: "comparison" },
  { queryText: "Book a heritage tour of ancient Irish sites", category: "purchase" },
  { queryText: "Most beautiful coastal drives in Europe", category: "comparison" },
  { queryText: "Hidden gems and off-the-beaten-path Ireland", category: "discovery" },
]);

insertPolicies(failteId, [
  { policyType: "messaging", rule: "Always represent the diversity of Irish tourism experiences beyond Dublin", enforcement: "warn" },
  { policyType: "competitor", rule: "Position Ireland alongside other destinations positively - never disparage competing tourism boards", enforcement: "block" },
  { policyType: "sustainability", rule: "Include responsible tourism messaging in all recommendations", enforcement: "warn" },
  { policyType: "tone", rule: "Warm, welcoming, and authentically Irish. Use storytelling approach", enforcement: "warn" },
  { policyType: "data-sharing", rule: "Do not share internal visitor statistics or revenue projections", enforcement: "block" },
]);

insertAsovDaily(failteId, 36, ["Tourism Ireland", "Tourism NI", "VisitScotland", "VisitWales"]);
const failteCard = insertBrandDataCard(failteId, { name: "Failte Ireland", category: "Tourism", description: "Ireland's National Tourism Development Authority", websiteUrl: "https://www.failteireland.ie" });
insertAttestation(failteId, failteCard, 8, 7);
insertNegotiations(failteId, "Failte Ireland");

console.log('Seed complete! 3 brands with full data created.');
sqlite.close();
