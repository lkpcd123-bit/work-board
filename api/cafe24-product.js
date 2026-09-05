export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  const { action, token, productCode, productNo, payload } = req.body || {};
  const MALL_ID = 'slowrocket';
  const BASE = `https://${MALL_ID}.cafe24api.com/api/v2/admin`;
  const headers = {
    'Authorization': `Bearer ${token}`,
    'X-Cafe24-Api-Version': '2026-03-01',
    'Content-Type': 'application/json',
  };

  try {
    // ── 상품 검색 ──────────────────────────────────────────
    if (action === 'search') {
      const r = await fetch(`${BASE}/products?product_code=${encodeURIComponent(productCode)}&limit=1`, { headers });
      const d = await r.json();
      res.status(200).json({ product: d.products?.[0] || null });

    // ── 상품 상세 조회 (description 포함) ──────────────────
    } else if (action === 'get') {
      const no = parseInt(productNo, 10);
      const r = await fetch(`${BASE}/products/${no}`, { headers });
      const d = await r.json();
      res.status(r.status).json(d);

    // ── 상품 수정 (판매상태/이름/가격/상세 등) ─────────────
    } else if (action === 'update') {
      const no = parseInt(productNo, 10);
      if (!no || isNaN(no)) return res.status(400).json({ error: `Invalid productNo: ${productNo}` });
      const body = { shop_no: 1, request: payload };
      console.log('PUT', no, JSON.stringify(body).slice(0, 200));
      const r = await fetch(`${BASE}/products/${no}`, {
        method: 'PUT', headers,
        body: JSON.stringify(body),
      });
      const text = await r.text();
      console.log('Response:', r.status, text.slice(0, 300));
      let d; try { d = JSON.parse(text); } catch(e) { d = { raw: text }; }
      res.status(r.status).json(d);

    // ── 이미지 업로드 (Base64 → 카페24 CDN URL) ────────────
    } else if (action === 'uploadImage') {
      const { imageBase64, imageName } = req.body;
      if (!imageBase64) return res.status(400).json({ error: 'imageBase64 required' });

      // 1단계: 이미지 업로드
      const uploadBody = {
        images: [{
          image: imageBase64,
          image_name: imageName || `event_${Date.now()}.jpg`,
        }]
      };
      const r = await fetch(`${BASE}/products/images`, {
        method: 'POST', headers,
        body: JSON.stringify(uploadBody),
      });
      const d = await r.json();
      console.log('Upload response:', r.status, JSON.stringify(d).slice(0, 300));
      res.status(r.status).json(d);

    // ── 상세 HTML 최상단에 이미지/유튜브 삽입 ─────────────
    } else if (action === 'insertTop') {
      const no = parseInt(productNo, 10);
      if (!no || isNaN(no)) return res.status(400).json({ error: `Invalid productNo: ${productNo}` });

      // 현재 상세 가져오기
      const getR = await fetch(`${BASE}/products/${no}`, { headers });
      const getData = await getR.json();
      const product = getData.product;
      if (!product) return res.status(404).json({ error: '상품을 찾을 수 없습니다' });

      const originalDesc = product.description || '';
      const { insertHtml, backupKey } = payload;

      // 최상단에 삽입
      const newDesc = insertHtml + '\n' + originalDesc;

      const putR = await fetch(`${BASE}/products/${no}`, {
        method: 'PUT', headers,
        body: JSON.stringify({ shop_no: 1, request: { description: newDesc } }),
      });
      const putD = await putR.json();
      // 원본 반환 (원복용)
      res.status(putR.status).json({ ...putD, originalDesc, backupKey });

    // ── 원복 ───────────────────────────────────────────────
    } else if (action === 'restore') {
      const no = parseInt(productNo, 10);
      if (!no || isNaN(no)) return res.status(400).json({ error: `Invalid productNo: ${productNo}` });
      const { originalDesc } = payload;
      const r = await fetch(`${BASE}/products/${no}`, {
        method: 'PUT', headers,
        body: JSON.stringify({ shop_no: 1, request: { description: originalDesc } }),
      });
      const d = await r.json();
      res.status(r.status).json(d);

    } else {
      res.status(400).json({ error: `Invalid action: ${action}` });
    }
  } catch (e) {
    console.error('Error:', e.message);
    res.status(500).json({ error: e.message });
  }
}
