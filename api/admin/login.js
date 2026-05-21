import {
  createAdminSessionToken,
  requireConfiguredAdminAuth,
  setAdminSessionCookie,
  verifyAdminCredentials,
} from '../_auth.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method not allowed.' });
  }

  const config = requireConfiguredAdminAuth(res);
  if (!config) {
    return;
  }

  const body = req.body || {};
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
