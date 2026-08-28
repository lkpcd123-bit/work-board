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
      const no = parseInt(productNo, 10);
      if (!no || isNaN(no)) {
        return res.status(400).json({ error: `Invalid productNo: ${productNo}` });
      }

      // 카페24 공식 문서 형식 - product_no를 body에도 포함
      const body = {
        shop_no: 1,
        product_no: no,
        product: {}
      };

      if (payload.selling !== undefined) body.product.selling = payload.selling;
      if (payload.display !== undefined) body.product.display = payload.display;

      console.log('PUT URL:', `${baseUrl}/${no}`);
      console.log('PUT body:', JSON.stringify(body));

      const r = await fetch(`${baseUrl}/${no}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body),
      });
      const text = await r.text();
      console.log('Response:', r.status, text.slice(0, 200));

      let data;
      try { data = JSON.parse(text); } catch(e) { data = { raw: text }; }
      res.status(r.status).json(data);

    } else {
      res.status(400).json({ error: `Invalid action: ${action}` });
    }
  } catch (e) {
    console.error('Error:', e.message);
    res.status(500).json({ error: e.message });
  }
}
