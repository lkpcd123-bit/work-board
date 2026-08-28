export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  const { code, grant_type, refresh_token } = req.body;
  const CLIENT_ID = 'XUlWW7h7N9claZtHu37zhA';
  const CLIENT_SECRET = 'nlcR1GFrJpdiFVbUsmt2BD';
  const MALL_ID = 'slowrocket';
  const REDIRECT_URI = 'https://work-board-one.vercel.app';

  const creds = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  const body = new URLSearchParams(
    grant_type === 'refresh_token'
      ? { grant_type: 'refresh_token', refresh_token }
      : { grant_type: 'authorization_code', code, redirect_uri: REDIRECT_URI }
  );

  try {
    const response = await fetch(
      `https://${MALL_ID}.cafe24api.com/api/v2/oauth/token`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${creds}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      }
    );
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
