export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  const { action, token, productCode, productNo, payload, imageBase64, imageName } = req.body || {};
  const MALL_ID = 'slowrocket';
  const BASE = `https://${MALL_ID}.cafe24api.com/api/v2/admin`;
  const headers = {
    'Authorization': `Bearer ${token}`,
    'X-Cafe24-Api-Version': '2026-03-01',
    'Content-Type': 'application/json',
  };

  try {
    if (action === 'search') {
      const r = await fetch(`${BASE}/products?product_code=${encodeURIComponent(productCode)}&limit=1`, { headers });
      const d = await r.json();
      res.status(200).json({ product: d.products?.[0] || null });

    } else if (action === 'get') {
      const no = parseInt(productNo, 10);
      const r = await fetch(`${BASE}/products/${no}`, { headers });
      const d = await r.json();
      res.status(r.status).json(d);

    } else if (action === 'update') {
      const no = parseInt(productNo, 10);
      if (!no || isNaN(no)) return res.status(400).json({ error: `Invalid productNo: ${productNo}` });
      const r = await fetch(`${BASE}/products/${no}`, {
        method: 'PUT', headers,
        body: JSON.stringify({ shop_no: 1, request: payload }),
      });
      const text = await r.text();
      let d; try { d = JSON.parse(text); } catch(e) { d = { raw: text }; }
      res.status(r.status).json(d);

    } else if (action === 'copy') {
      // 상품 복사: POST /products/{no}/copy
      const no = parseInt(productNo, 10);
      if (!no || isNaN(no)) return res.status(400).json({ error: `Invalid productNo: ${productNo}` });
      const r = await fetch(`${BASE}/products/${no}/copy`, {
        method: 'POST', headers,
        body: JSON.stringify({ shop_no: 1, request: { display: 'F', selling: 'F' } }),
      });
      const text = await r.text();
      let d; try { d = JSON.parse(text); } catch(e) { d = { raw: text }; }
      res.status(r.status).json(d);

    } else if (action === 'uploadImage') {
      if (!imageBase64) return res.status(400).json({ error: 'imageBase64 required' });
      const ext = (imageName || 'image.jpg').split('.').pop().toLowerCase();
      const mimeMap = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp' };
      const mime = mimeMap[ext] || 'image/jpeg';
      const r = await fetch(`${BASE}/products/images`, {
        method: 'POST', headers,
        body: JSON.stringify({ requests: [{ image: imageBase64, image_type: mime, image_name: imageName || `img_${Date.now()}.jpg` }] }),
      });
      const text = await r.text();
      let d; try { d = JSON.parse(text); } catch(e) { d = { raw: text }; }
      res.status(r.status).json(d);

    } else {
      res.status(400).json({ error: `Invalid action: ${action}` });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
