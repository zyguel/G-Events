const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase env keys. Expected NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (preferred) or NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function parseArgs(argv) {
  const args = {
    eventIds: [],
    dryRun: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === '--dry-run') {
      args.dryRun = true;
      continue;
    }

    if (arg === '--event' && i + 1 < argv.length) {
      const n = Number(argv[i + 1]);
      if (Number.isInteger(n) && n > 0) {
        args.eventIds.push(n);
      }
      i += 1;
      continue;
    }

    if (arg.startsWith('--event=')) {
      const n = Number(arg.slice('--event='.length));
      if (Number.isInteger(n) && n > 0) {
        args.eventIds.push(n);
      }
      continue;
    }
  }

  args.eventIds = Array.from(new Set(args.eventIds));
  return args;
}

async function discoverLikelyAffectedEventIds() {
  const { data: addOns, error: addOnErr } = await supabase
    .from('AddOn')
    .select('event_id');

  if (addOnErr) throw new Error(`Failed to read AddOn rows: ${addOnErr.message}`);

  const addOnEventIds = Array.from(new Set((addOns || []).map((a) => Number(a.event_id)).filter((n) => Number.isInteger(n) && n > 0)));
  if (addOnEventIds.length === 0) return [];

  const { data: regs, error: regErr } = await supabase
    .from('Registration')
    .select('id, event_id, status')
    .in('event_id', addOnEventIds)
    .eq('status', 'confirmed');

  if (regErr) throw new Error(`Failed to read Registration rows: ${regErr.message}`);

  const regRows = regs || [];
  const regIds = regRows.map((r) => Number(r.id)).filter((n) => Number.isInteger(n) && n > 0);
  if (regIds.length === 0) return [];

  const { data: entRows, error: entErr } = await supabase
    .from('AttendeeEntitlement')
    .select('registration_id')
    .in('registration_id', regIds);

  if (entErr) throw new Error(`Failed to read AttendeeEntitlement rows: ${entErr.message}`);

  const regHasEntitlement = new Set((entRows || []).map((r) => Number(r.registration_id)).filter((n) => Number.isInteger(n) && n > 0));

  const byEvent = new Map();
  for (const r of regRows) {
    const eventId = Number(r.event_id);
    if (!Number.isInteger(eventId) || eventId <= 0) continue;

    const cur = byEvent.get(eventId) || { confirmed: 0, withEntitlements: 0 };
    cur.confirmed += 1;
    if (regHasEntitlement.has(Number(r.id))) {
      cur.withEntitlements += 1;
    }
    byEvent.set(eventId, cur);
  }

  return Array.from(byEvent.entries())
    .filter(([, stats]) => stats.confirmed > 0 && stats.withEntitlements === 0)
    .map(([eventId]) => eventId);
}

async function getEventAddOnVariantIds(eventId) {
  const { data: addOns, error: addOnErr } = await supabase
    .from('AddOn')
    .select('id')
    .eq('event_id', eventId);

  if (addOnErr) throw new Error(`Event ${eventId}: failed to read AddOn rows: ${addOnErr.message}`);

  const addOnIds = (addOns || []).map((r) => Number(r.id)).filter((n) => Number.isInteger(n) && n > 0);
  if (addOnIds.length === 0) return [];

  const { data: variants, error: variantErr } = await supabase
    .from('AddOnVariant')
    .select('id')
    .in('add_on_id', addOnIds);

  if (variantErr) throw new Error(`Event ${eventId}: failed to read AddOnVariant rows: ${variantErr.message}`);

  return (variants || []).map((r) => Number(r.id)).filter((n) => Number.isInteger(n) && n > 0);
}

async function getConfirmedRegistrationIds(eventId) {
  const { data: regs, error: regErr } = await supabase
    .from('Registration')
    .select('id')
    .eq('event_id', eventId)
    .eq('status', 'confirmed');

  if (regErr) throw new Error(`Event ${eventId}: failed to read registrations: ${regErr.message}`);

  return (regs || []).map((r) => Number(r.id)).filter((n) => Number.isInteger(n) && n > 0);
}

async function getExistingEntitlementPairs(registrationIds, variantIds) {
  if (registrationIds.length === 0 || variantIds.length === 0) return new Set();

  const { data: rows, error } = await supabase
    .from('AttendeeEntitlement')
    .select('registration_id, add_on_variant_id')
    .in('registration_id', registrationIds)
    .in('add_on_variant_id', variantIds);

  if (error) throw new Error(`Failed to read existing entitlements: ${error.message}`);

  const set = new Set();
  for (const row of rows || []) {
    const regId = Number(row.registration_id);
    const variantId = Number(row.add_on_variant_id);
    if (!Number.isInteger(regId) || !Number.isInteger(variantId)) continue;
    set.add(`${regId}:${variantId}`);
  }
  return set;
}

async function insertInChunks(rows, chunkSize = 500) {
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase.from('AttendeeEntitlement').insert(chunk);
    if (error) {
      throw new Error(`Insert failed at chunk ${i / chunkSize + 1}: ${error.message}`);
    }
  }
}

async function backfillEvent(eventId, dryRun) {
  const variantIds = await getEventAddOnVariantIds(eventId);
  const registrationIds = await getConfirmedRegistrationIds(eventId);

  if (variantIds.length === 0) {
    return {
      eventId,
      registrationCount: registrationIds.length,
      variantCount: 0,
      missingCount: 0,
      insertedCount: 0,
      skipped: 'No add-on variants configured',
    };
  }

  if (registrationIds.length === 0) {
    return {
      eventId,
      registrationCount: 0,
      variantCount: variantIds.length,
      missingCount: 0,
      insertedCount: 0,
      skipped: 'No confirmed registrations',
    };
  }

  const existingPairs = await getExistingEntitlementPairs(registrationIds, variantIds);

  const missingRows = [];
  for (const registrationId of registrationIds) {
    for (const variantId of variantIds) {
      const key = `${registrationId}:${variantId}`;
      if (existingPairs.has(key)) continue;

      missingRows.push({
        registration_id: registrationId,
        add_on_variant_id: variantId,
        qty_total: 1,
        qty_reserved: 1,
        qty_redeemed: 0,
      });
    }
  }

  if (!dryRun && missingRows.length > 0) {
    await insertInChunks(missingRows);
  }

  return {
    eventId,
    registrationCount: registrationIds.length,
    variantCount: variantIds.length,
    missingCount: missingRows.length,
    insertedCount: dryRun ? 0 : missingRows.length,
    skipped: null,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const eventIds = args.eventIds.length > 0
    ? args.eventIds
    : await discoverLikelyAffectedEventIds();

  if (eventIds.length === 0) {
    console.log('No likely affected events found. Nothing to backfill.');
    return;
  }

  console.log(`Target events: ${eventIds.join(', ')}`);
  if (args.dryRun) {
    console.log('Mode: DRY RUN (no writes)');
  }

  let totalMissing = 0;
  let totalInserted = 0;

  for (const eventId of eventIds) {
    const result = await backfillEvent(eventId, args.dryRun);
    totalMissing += result.missingCount;
    totalInserted += result.insertedCount;

    console.log(
      `Event ${result.eventId}: registrations=${result.registrationCount}, variants=${result.variantCount}, missing_pairs=${result.missingCount}, inserted=${result.insertedCount}${result.skipped ? `, skipped=${result.skipped}` : ''}`
    );
  }

  console.log(`Done. Missing pairs=${totalMissing}, inserted=${totalInserted}.`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
