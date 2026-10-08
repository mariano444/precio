const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function hasSupabase() { return !!(url && key); }

async function request(path, options = {}) {
  const res = await fetch(`${url}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  if (!res.ok) throw new Error(`Supabase HTTP ${res.status}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export async function saveSearch(record) {
  if (!hasSupabase()) return { persisted: false };
  await request('searches', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(record) });
  return { persisted: true };
}

export async function listSearches() {
  if (!hasSupabase()) return { persisted: false, searches: [] };
  const rows = await request('searches?select=*&order=created_at.desc&limit=100');
  return { persisted: true, searches: rows };
}

export async function saveAlert(record) {
  if (!hasSupabase()) return { persisted: false, alert: record };
  await request('alerts', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify(record) });
  return { persisted: true, alert: record };
}
