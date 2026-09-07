export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  const { action, token, productCode, productNo, payload, imageBase64, imageName, imageUrl } = req.body || {};
  const MALL_ID = 'slowrocket';
  const BASE = `https://${MALL_ID}.cafe24api.com/api/v2/admin`;
  const H = {
    'Authorization': `Bearer ${token}`,
    'X-Cafe24-Api-Version': '2026-03-01',
    'Content-Type': 'application/json',
  };

  const j = async (r) => { const t = await r.text(); try { return JSON.parse(t); } catch(e) { return { raw: t }; } };

  try {
    if (action === 'search') {
      const r = await fetch(`${BASE}/products?product_code=${encodeURIComponent(productCode)}&limit=1`, { headers: H });
      const d = await r.json();
      return res.json({ product: d.products?.[0] || null });

    } else if (action === 'get') {
      const no = parseInt(productNo, 10);
      const r = await fetch(`${BASE}/products/${no}`, { headers: H });
      return res.status(r.status).json(await j(r));

    } else if (action === 'getOptions') {
      const no = parseInt(productNo, 10);
      const r = await fetch(`${BASE}/products/${no}/options`, { headers: H });
      return res.status(r.status).json(await j(r));

    } else if (action === 'getShipping') {
      const no = parseInt(productNo, 10);
      const r = await fetch(`${BASE}/products/${no}/shipping`, { headers: H });
      return res.status(r.status).json(await j(r));

    } else if (action === 'update') {
      const no = parseInt(productNo, 10);
      const r = await fetch(`${BASE}/products/${no}`, {
        method: 'PUT', headers: H,
        body: JSON.stringify({ shop_no: 1, request: payload }),
      });
      return res.status(r.status).json(await j(r));

    } else if (action === 'create') {
      const r = await fetch(`${BASE}/products`, {
        method: 'POST', headers: H,
        body: JSON.stringify({ shop_no: 1, request: payload }),
      });
      const d = await j(r);
      console.log('CREATE', r.status, JSON.stringify(d).slice(0,200));
      return res.json(d);

    } else if (action === 'setCategory') {
      const no = parseInt(productNo, 10);
      const r = await fetch(`${BASE}/products/${no}/categories`, {
        method: 'POST', headers: H,
        body: JSON.stringify({ shop_no: 1, request: payload }),
      });
      const d = await j(r);
      console.log('setCategory', r.status, JSON.stringify(d).slice(0,200));
      return res.status(r.status).json(d);

    } else if (action === 'createOptions') {
      const no = parseInt(productNo, 10);
      const r = await fetch(`${BASE}/products/${no}/options`, {
        method: 'POST', headers: H,
        body: JSON.stringify({ shop_no: 1, request: payload }),
      });
      const d = await j(r);
      console.log('createOptions', r.status, JSON.stringify(d).slice(0,200));
      return res.status(r.status).json(d);

    } else if (action === 'uploadImageFromUrl') {
      if (!imageUrl) return res.json({ error: 'imageUrl required' });
      // Vercel → 이미지 fetch → base64 → 카페24
      const imgRes = await fetch(imageUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': `https://${MALL_ID}.cafe24.com/` }
      });
      if (!imgRes.ok) return res.json({ error: `fetch failed: ${imgRes.status}` });
      const ct = imgRes.headers.get('content-type') || 'image/jpeg';
      const b64 = Buffer.from(await imgRes.arrayBuffer()).toString('base64');
      const fname = imageUrl.split('/').pop().split('?')[0] || 'img.jpg';
      const r = await fetch(`${BASE}/products/images`, {
        method: 'POST', headers: H,
        body: JSON.stringify({ requests: [{ image: b64, image_type: ct, image_name: fname }] }),
      });
      const d = await j(r);
      console.log('uploadFromUrl', r.status, JSON.stringify(d).slice(0,200));
      return res.status(r.status).json(d);

    } else if (action === 'uploadImage') {
      if (!imageBase64) return res.json({ error: 'imageBase64 required' });
      const ext = (imageName||'img.jpg').split('.').pop().toLowerCase();
      const mime = {jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',gif:'image/gif',webp:'image/webp'}[ext]||'image/jpeg';
      const r = await fetch(`${BASE}/products/images`, {
        method: 'POST', headers: H,
        body: JSON.stringify({ requests: [{ image: imageBase64, image_type: mime, image_name: imageName||`img_${Date.now()}.jpg` }] }),
      });
      return res.status(r.status).json(await j(r));

    } else if (action === 'copyProduct') {
      // 카페24 관리자 세션으로 상품 복사
      const { cookieStr, productNo: pNo } = req.body;
      if (!cookieStr) return res.json({ error: 'cookieStr required' });
      const formData = new URLSearchParams();
      formData.append('product_no[]', pNo || '743');
      const r = await fetch(`https://slowrocket.cafe24.com/exec/admin/shop1/product/ProductManageCopy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'Cookie': cookieStr,
          'Origin': 'https://slowrocket.cafe24.com',
          'Referer': 'https://slowrocket.cafe24.com/disp/admin/shop1/product/productmanage',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36',
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': '*/*',
          'Accept-Language': 'ko-KR,ko;q=0.9',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-origin',
        },
        body: formData.toString(),
      });
      const text = await r.text();
      console.log('copyProduct status:', r.status, text.slice(0, 500));
      // 응답에서 product_no 추출 시도
      let d;
      try { d = JSON.parse(text); } catch(e) {
        // HTML 응답에서 product_no 추출
        const m = text.match(/product_no['":\s]+(\d+)/);
        if(m) d = { product_no: parseInt(m[1]) };
        else d = { raw: text.slice(0, 500) };
      }
      return res.status(r.status).json(d);

    } else {
      return res.status(400).json({ error: `Invalid action: ${action}` });
    }
  } catch (e) {
    console.error('ERROR:', e.message);
    return res.status(500).json({ error: e.message });
  }
}

// 추가: 관리자 세션으로 상품 복사
