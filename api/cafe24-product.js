export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  const { action, token, productCode, productNo, payload } = req.body || {};
  const MALL_ID = 'slowrocket';
  const baseUrl = `https://${MALL_ID}.cafe24api.com/api/v2/admin/products`;
  const headers = {
    'Authorization': `Bearer ${token}`,
    'X-Cafe24-Api-Version': '2026-03-01',
    'Content-Type': 'application/json',
  };

  try {
    if (action === 'search') {
      const r = await fetch(`${baseUrl}?product_code=${encodeURIComponent(productCode)}&limit=1`, { headers });
      const data = await r.json();
      if (data.products && data.products.length > 0) {
        res.status(200).json({ product: data.products[0] });
      } else {
        res.status(200).json({ product: null });
      }
    } else if (action === 'update') {
      // payload 정리 - soldout 제거하고 selling/display만 사용
      const cleanPayload = {};
      if (payload.selling !== undefined) cleanPayload.selling = payload.selling;
      if (payload.display !== undefined) cleanPayload.display = payload.display;

      const body = JSON.stringify({
        shop_no: 1,
        product: cleanPayload
      });

      console.log('Update payload:', body);

      const r = await fetch(`${baseUrl}/${productNo}`, {
        method: 'PUT',
        headers,
        body,
      });
      const data = await r.json();
      console.log('Update response:', JSON.stringify(data));
      res.status(r.status).json(data);
    } else {
      res.status(400).json({ error: 'Invalid action' });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
