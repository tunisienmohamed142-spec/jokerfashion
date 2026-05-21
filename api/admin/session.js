import { requireAdminSession } from '../_auth.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ message: 'Method not allowed.' });
  }

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
