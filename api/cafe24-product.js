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
        res.status(200).json({ product: null, raw: data });
      }

    } else if (action === 'update') {
      const no = parseInt(productNo, 10);
      if (!no || isNaN(no)) {
        return res.status(400).json({ error: `Invalid productNo: ${productNo}` });
      }

      // 카페24 2026 API 공식 스펙: shop_no + product 객체
      const body = {
        shop_no: 1,
        product: {
          selling: payload.selling,
          display: payload.display,
        }
      };
      // undefined 키 제거
      Object.keys(body.product).forEach(k => body.product[k] === undefined && delete body.product[k]);

      const reqUrl = `${baseUrl}/${no}`;
      console.log('PUT URL:', reqUrl);
      console.log('PUT body:', JSON.stringify(body));

      const r = await fetch(reqUrl, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body),
      });
      const text = await r.text();
      console.log('Response status:', r.status);
      console.log('Response body:', text);

      let data;
      try { data = JSON.parse(text); } catch(e) { data = { raw: text }; }
      res.status(r.status).json(data);

    } else {
      res.status(400).json({ error: `Invalid action: ${action}` });
    }
  } catch (e) {
    console.error('Handler error:', e);
    res.status(500).json({ error: e.message });
  }
}
