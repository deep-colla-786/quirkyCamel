// Turns Shiprocket's many status labels into the six steps a customer sees, and parses
// its dates and scan records.
export const STAGES = ['placed', 'ready', 'picked', 'transit', 'out', 'delivered'];

// First match wins: returns before delivered ("RTO DELIVERED"), problems before progress.
const RULES = [
  [/RTO|RETURN/, { state: 'returned' }],
  [/CANCEL/, { state: 'cancelled' }],
  [/UNDELIVERED|LOST|DAMAGED|DESTROYED|EXCEPTION|ERROR|MISROUTED|UNTRACEABLE|DISPOSED|ISSUE|QC FAILED/, { state: 'exception' }],
  [/^(?:PARTIAL[ _])?DELIVERED$/, { stage: 'delivered' }],
  [/OUT FOR DELIVERY/, { stage: 'out' }],
  [/PICKED UP/, { stage: 'picked' }],
  [/IN TRANSIT|REACHED|SHIPPED|IN FLIGHT|DELAYED|CONNECTION|HANDOVER|CUSTOM/, { stage: 'transit' }],
  [/AWB|MANIFEST|PICKUP|BOOKED|PACK|READY|NEW|FC |PROCESSED/, { stage: 'ready' }]
];

export function classify(label) {
  const text = String(label || '').toUpperCase().trim();
  const rule = RULES.find(([re]) => re.test(text));
  return rule ? rule[1] : {};
}

export const stageIndex = (stage) => STAGES.indexOf(stage);
export const laterStage = (a, b) => (stageIndex(b) > stageIndex(a) ? b : a);

// Shiprocket sends Indian times without a zone: "2023-05-19 11:59:16" or "23 05 2023 11:43:52".
export function parseIst(value) {
  if (!value) return null;
  const s = String(value).trim();
  let m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/.exec(s);
  if (m) return new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6] || '00'}+05:30`);
  m = /^(\d{2}) (\d{2}) (\d{4}) (\d{2}):(\d{2}):(\d{2})$/.exec(s);
  if (m) return new Date(`${m[3]}-${m[2]}-${m[1]}T${m[4]}:${m[5]}:${m[6]}+05:30`);
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

const clean = (v, max = 200) => String(v ?? '').trim().slice(0, max);
const usable = (label) => (label && label !== 'NA' ? label : '');

// One scan (tracking event) in our format.
export function normalizeScan(raw) {
  const label = usable(clean(raw['sr-status-label'], 60));
  return {
    at: parseIst(raw.date),
    status: clean(raw.status, 40),
    activity: clean(raw.activity),
    location: clean(raw.location, 120),
    srStatus: usable(clean(raw['sr-status'], 10)),
    srStatusLabel: label,
    stage: classify(label).stage || null
  };
}

// Merges new scans into the existing list (no duplicates), oldest first.
export function mergeScans(existing, incoming) {
  const key = (s) => `${new Date(s.at).getTime()}|${s.activity}|${s.location}`;
  const seen = new Set(existing.map(key));
  const added = incoming.filter((s) => s.at && !seen.has(key(s)));
  return [...existing, ...added].sort((a, b) => new Date(a.at) - new Date(b.at));
}

// Furthest step reached, from the current status and every scan; progress never goes back.
export function stageFrom(currentLabel, scans, previous = 'placed') {
  let stage = previous;
  for (const s of scans) if (s.stage) stage = laterStage(stage, s.stage);
  const current = classify(currentLabel);
  if (current.stage) stage = laterStage(stage, current.stage);
  return { stage, state: current.state || (stage === 'delivered' ? 'delivered' : 'active') };
}
