// Vercel KV (Upstash Redis) REST API helper.
// Uses the pipeline endpoint so any-length JSON values are safe in the request body.
// Required environment variables (set via Vercel dashboard → Storage → KV → Connect):
//   KV_REST_API_URL   – e.g. https://xxx.upstash.io
//   KV_REST_API_TOKEN – read-write token

const KV_REST_API_URL = process.env.KV_REST_API_URL;
const KV_REST_API_TOKEN = process.env.KV_REST_API_TOKEN;

export const isKvAvailable = !!(KV_REST_API_URL && KV_REST_API_TOKEN);

async function pipeline(commands) {
  const res = await fetch(`${KV_REST_API_URL}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${KV_REST_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commands),
  });

  if (!res.ok) {
    throw new Error(`KV pipeline error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export async function kvGet(key) {
  if (!isKvAvailable) return null;

  const results = await pipeline([['GET', key]]);
  if (!results || !results[0]) return null;

  const raw = results[0].result;
  if (raw === null || raw === undefined) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

export async function kvSet(key, value) {
  if (!isKvAvailable) return false;

  const serialized = JSON.stringify(value);
  const results = await pipeline([['SET', key, serialized]]);
  return !!(results && results[0] && results[0].result === 'OK');
}
