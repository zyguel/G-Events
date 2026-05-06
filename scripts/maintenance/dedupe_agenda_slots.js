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
    apply: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === '--apply') {
      args.apply = true;
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

function toFingerprint(row) {
  return [
    row.event_id ?? '',
    row.title ?? '',
    row.description ?? '',
    row.speaker_name ?? '',
    row.start_time ?? '',
    row.end_time ?? '',
  ].join('|');
}

async function fetchAgendaRows(eventIds) {
  let query = supabase
    .from('AgendaSlot')
    .select('id, event_id, title, description, speaker_name, start_time, end_time')
    .order('event_id', { ascending: true })
    .order('id', { ascending: true });

  if (eventIds.length > 0) {
    query = query.in('event_id', eventIds);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to fetch AgendaSlot rows: ${error.message}`);
  }

  return data || [];
}

function buildDuplicatePlan(rows) {
  const byFingerprint = new Map();

  for (const row of rows) {
    const key = toFingerprint(row);
    const bucket = byFingerprint.get(key) || [];
    bucket.push(row);
    byFingerprint.set(key, bucket);
  }

  const groups = [];
  const idsToDelete = [];

  for (const groupRows of byFingerprint.values()) {
    if (groupRows.length < 2) continue;

    const sorted = [...groupRows].sort((a, b) => Number(a.id) - Number(b.id));
    const keep = sorted[0];
    const remove = sorted.slice(1);

    groups.push({
      eventId: keep.event_id,
      keepId: keep.id,
      removeIds: remove.map((r) => r.id),
      title: keep.title || '',
      startTime: keep.start_time,
      endTime: keep.end_time,
    });

    for (const row of remove) {
      idsToDelete.push(row.id);
    }
  }

  return { groups, idsToDelete };
}

async function deleteByIds(ids, chunkSize = 200) {
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    const { error } = await supabase
      .from('AgendaSlot')
      .delete()
      .in('id', chunk);

    if (error) {
      throw new Error(`Delete failed at chunk ${Math.floor(i / chunkSize) + 1}: ${error.message}`);
    }
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const rows = await fetchAgendaRows(args.eventIds);
  console.log(`Scanned ${rows.length} AgendaSlot rows${args.eventIds.length ? ` for events: ${args.eventIds.join(', ')}` : ''}.`);

  const { groups, idsToDelete } = buildDuplicatePlan(rows);

  if (groups.length === 0) {
    console.log('No exact duplicate agenda rows found.');
    return;
  }

  console.log(`Found ${groups.length} duplicate groups, ${idsToDelete.length} rows marked for removal.`);

  for (const g of groups.slice(0, 25)) {
    console.log(
      `Event ${g.eventId}: keep id=${g.keepId}, remove ids=[${g.removeIds.join(', ')}], slot="${g.title}" (${g.startTime || 'n/a'} -> ${g.endTime || 'n/a'})`
    );
  }

  if (groups.length > 25) {
    console.log(`...and ${groups.length - 25} more groups.`);
  }

  if (!args.apply) {
    console.log('Dry run only. Re-run with --apply to delete the duplicate rows above.');
    return;
  }

  await deleteByIds(idsToDelete);
  console.log(`Deleted ${idsToDelete.length} duplicate AgendaSlot rows.`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
