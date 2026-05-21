// Vercel KV / Upstash Redis REST API helper.
// Uses the pipeline endpoint so any-length JSON values are safe in the request body.
// Supported environment variable sets:
//   - KV_REST_API_URL + KV_REST_API_TOKEN
//   - REDIS_REST_URL + REDIS_REST_TOKEN
//   - UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
//   - REDIS_URL (Upstash redis:// / rediss://, auto-derived to REST credentials)

function parseRedisUrl(redisUrl) {
  if (!redisUrl) return null;

  try {
    const parsed = new URL(redisUrl);
    const protocol = parsed.protocol.toLowerCase();
    const isRedisProtocol = protocol === 'redis:' || protocol === 'rediss:';
    if (!isRedisProtocol || !parsed.hostname || !parsed.password) {
      return null;
    }

    return {
      url: `https://${parsed.hostname}`,
      token: decodeURIComponent(parsed.password),
    };
  } catch {
    return null;
  }
}

function resolveRestCredentials() {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    return {
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    };
  }

  if (process.env.REDIS_REST_URL && process.env.REDIS_REST_TOKEN) {
    return {
      url: process.env.REDIS_REST_URL,
      token: process.env.REDIS_REST_TOKEN,
    };
  }

  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    return {
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    };
  }

  return parseRedisUrl(process.env.REDIS_URL);
}

const STORAGE_REST = resolveRestCredentials();
const STORAGE_REST_API_URL = STORAGE_REST?.url;
const STORAGE_REST_API_TOKEN = STORAGE_REST?.token;

export const isKvAvailable = !!(STORAGE_REST_API_URL && STORAGE_REST_API_TOKEN);
export const STORAGE_CONFIG_MESSAGE =
  'Storage not configured. Configure KV_REST_API_URL/KV_REST_API_TOKEN, REDIS_REST_URL/REDIS_REST_TOKEN, UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN, or REDIS_URL in Vercel.';

async function pipeline(commands) {
  const res = await fetch(`${STORAGE_REST_API_URL}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${STORAGE_REST_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commands),
  });

  if (!res.ok) {
    throw new Error(`Storage pipeline error: ${res.status} ${res.statusText}`);
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
