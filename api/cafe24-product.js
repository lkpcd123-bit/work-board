export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const { token, productNo, payload } = req.body || {};
  const accessToken = req.headers.authorization?.replace('Bearer ', '') || token;
  const MALL_ID = 'slowrocket';
  const baseUrl = `https://${MALL_ID}.cafe24api.com/api/v2/admin/products`;

  try {
    if (req.method === 'GET') {
      const { query } = req;
      const qs = new URLSearchParams(query).toString();
      const r = await fetch(`${baseUrl}?${qs}`, {
        headers: { 'Authorization': `Bearer ${accessToken}`, 'X-Cafe24-Api-Version': '2024-03-01' }
      });
      const data = await r.json();
      res.status(r.status).json(data);
    } else if (req.method === 'PUT') {
      const r = await fetch(`${baseUrl}/${productNo}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json', 'X-Cafe24-Api-Version': '2024-03-01' },
        body: JSON.stringify({ shop_no: 1, product: payload }),
      });
      const data = await r.json();
      res.status(r.status).json(data);
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
