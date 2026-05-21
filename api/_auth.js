import { createHmac, timingSafeEqual } from 'node:crypto';

export const ADMIN_SESSION_COOKIE = 'jf_admin_session';
const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12h

function base64UrlEncode(input) {
  return Buffer.from(input, 'utf8').toString('base64url');
}

function base64UrlDecode(input) {
  return Buffer.from(input, 'base64url').toString('utf8');
}

function safeCompare(a, b) {
  const left = Buffer.from(String(a || ''), 'utf8');
  const right = Buffer.from(String(b || ''), 'utf8');

  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}

function parseCookieHeader(cookieHeader = '') {
  return Object.fromEntries(
    cookieHeader
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf('=');
        if (index === -1) {
          return [part, ''];
        }
        const key = part.slice(0, index).trim();
        const value = part.slice(index + 1).trim();
        return [key, value];
      })
  );
}

function getAuthConfig() {
  const username = String(process.env.ADMIN_USERNAME || 'admin').trim();
  const password = String(process.env.ADMIN_PASSWORD || '');
  const secret = String(process.env.ADMIN_AUTH_SECRET || '');

  return {
    username,
    password,
    secret,
    isConfigured: Boolean(username && password && secret),
  };
}

function signPayload(payload, secret) {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

export function createAdminSessionToken(username) {
  const { secret } = getAuthConfig();
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + SESSION_TTL_SECONDS;
  const payload = base64UrlEncode(
    JSON.stringify({
      role: 'admin',
      username,
      iat: issuedAt,
      exp: expiresAt,
    })
  );

  const signature = signPayload(payload, secret);
  return `${payload}.${signature}`;
}

export function verifyAdminSessionToken(token) {
  const { secret } = getAuthConfig();
  if (!token || !secret || !String(token).includes('.')) {
    return null;
  }

  const [payload, signature] = String(token).split('.');
  const expectedSignature = signPayload(payload, secret);

  if (!safeCompare(signature, expectedSignature)) {
    return null;
  }

  try {
    const decoded = JSON.parse(base64UrlDecode(payload));
    const now = Math.floor(Date.now() / 1000);
    if (!decoded || decoded.role !== 'admin' || !decoded.exp || decoded.exp <= now) {
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
}

export function setAdminSessionCookie(res, token) {
  const secureFlag = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader(
    'Set-Cookie',
    `${ADMIN_SESSION_COOKIE}=${token}; Max-Age=${SESSION_TTL_SECONDS}; Path=/; HttpOnly; SameSite=Strict${secureFlag}`
  );
}

export function clearAdminSessionCookie(res) {
  const secureFlag = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader(
    'Set-Cookie',
    `${ADMIN_SESSION_COOKIE}=; Max-Age=0; Path=/; HttpOnly; SameSite=Strict${secureFlag}`
  );
}

export function verifyAdminCredentials(username, password) {
  const config = getAuthConfig();
  if (!config.isConfigured) {
    return false;
  }

  return safeCompare(username, config.username) && safeCompare(password, config.password);
}

export function requireConfiguredAdminAuth(res) {
  const config = getAuthConfig();
  if (config.isConfigured) {
    return config;
  }

  res.status(503).json({
    message:
      'Admin auth not configured. Set ADMIN_USERNAME, ADMIN_PASSWORD and ADMIN_AUTH_SECRET.',
  });
  return null;
}

export function requireAdminSession(req, res) {
  const config = requireConfiguredAdminAuth(res);
  if (!config) {
    return null;
  }

  const cookies = parseCookieHeader(req.headers.cookie || '');
  const sessionToken = cookies[ADMIN_SESSION_COOKIE];
  const session = verifyAdminSessionToken(sessionToken);

  if (!session) {
    res.status(401).json({ message: 'Not authenticated as admin.' });
    return null;
  }

  return session;
}
