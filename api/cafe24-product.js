export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  const { action, token, productNo, payload } = req.body || {};
  const MALL_ID = 'slowrocket';
  const baseUrl = `https://${MALL_ID}.cafe24api.com/api/v2/admin/products`;
  const headers = {
    'Authorization': `Bearer ${token}`,
    'X-Cafe24-Api-Version': '2026-03-01',
    'Content-Type': 'application/json',
  };

  try {
    if (action === 'search') {
      const r = await fetch(`${baseUrl}/${productNo}`, { headers });
      const data = await r.json();
      res.status(r.status).json(data);
    } else if (action === 'update') {
      const r = await fetch(`${baseUrl}/${productNo}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ shop_no: 1, product: payload }),
      });
      const data = await r.json();
      res.status(r.status).json(data);
    } else {
      res.status(400).json({ error: 'Invalid action' });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
