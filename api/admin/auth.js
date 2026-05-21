import {
  clearAdminSessionCookie,
  createAdminSessionToken,
  requireAdminSession,
  requireConfiguredAdminAuth,
  setAdminSessionCookie,
  verifyAdminCredentials,
} from '../_auth.js';

/**
 * Consolidated admin auth endpoint — replaces /api/admin/login, /api/admin/logout,
 * and /api/admin/session in a single Serverless Function to stay within the
 * Vercel Hobby-plan limit of 12 Serverless Functions.
 *
 *   GET  /api/admin/auth            → validate current session
 *   POST /api/admin/auth  action=login   → authenticate and set session cookie
 *   POST /api/admin/auth  action=logout  → clear session cookie
 */
export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');

  // ── GET: session check ────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const session = requireAdminSession(req, res);
    if (!session) {
      return;
    }

    return res.status(200).json({
      authenticated: true,
      user: {
        role: session.role,
        username: session.username,
      },
    });
  }

  // ── POST: login or logout ─────────────────────────────────────────────────
  if (req.method === 'POST') {
    const body = req.body || {};
    const action = String(body.action || '').trim().toLowerCase();

    if (action === 'logout') {
      clearAdminSessionCookie(res);
      return res.status(200).json({ authenticated: false });
    }

    // Default POST action: login
    const config = requireConfiguredAdminAuth(res);
    if (!config) {
      return;
    }

    const username = String(body.username || '').trim();
    const password = String(body.password || '');

    if (!verifyAdminCredentials(username, password)) {
      return res.status(401).json({ message: 'Invalid admin credentials.' });
    }

    const token = createAdminSessionToken(config.username);
    setAdminSessionCookie(res, token);

    return res.status(200).json({
      authenticated: true,
      user: {
        role: 'admin',
        username: config.username,
      },
    });
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ message: 'Method not allowed.' });
}
