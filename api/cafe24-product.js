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
      // 상품코드(P0000BBC)로 조회
      const searchUrl = `${baseUrl}?product_code=${encodeURIComponent(productCode)}&limit=1`;
      const r = await fetch(searchUrl, { headers });
      const data = await r.json();
      // products 배열에서 첫 번째 항목 반환
      if (data.products && data.products.length > 0) {
        res.status(200).json({ product: data.products[0] });
      } else {
        res.status(200).json({ product: null, message: '상품을 찾을 수 없습니다' });
      }
    } else if (action === 'update') {
      // 수정은 상품번호(숫자)로 처리
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
