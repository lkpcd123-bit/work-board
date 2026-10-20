export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  try {
    const body = req.body || {};
    const { code, grant_type, refresh_token, brand, action } = body;
    let CLIENT_ID = 'XUlWW7h7N9claZtHu37zhA';
    let CLIENT_SECRET = 'nlcR1GFrJpdiFVbUsmt2BD';
    let MALL_ID = 'slowrocket';
    let REDIRECT_URI = 'https://work-board-one.vercel.app';

    // 쿠알로: 별도 카페24 몰/앱이라 로그인·토큰이 따로 필요 → Vercel 환경변수(C24K_*)로 주입
    if (brand === 'kualo') {
      CLIENT_ID = process.env.C24K_CLIENT_ID;
      CLIENT_SECRET = process.env.C24K_CLIENT_SECRET;
      MALL_ID = process.env.C24K_MALL_ID;
      REDIRECT_URI = process.env.C24K_REDIRECT_URI || REDIRECT_URI;
      if (!CLIENT_ID || !CLIENT_SECRET || !MALL_ID) {
        res.status(500).json({ error: 'missing_env', message: 'Vercel 환경변수 C24K_MALL_ID / C24K_CLIENT_ID / C24K_CLIENT_SECRET 을 먼저 설정하세요.' });
        return;
      }
    }

    // 로그인 버튼용 공개 설정 (secret 제외)
    if (action === 'config') {
      res.status(200).json({ mall: MALL_ID, client_id: CLIENT_ID, redirect_uri: REDIRECT_URI });
      return;
    }

    if (grant_type !== 'refresh_token' && !code) {
      res.status(400).json({ error: 'missing_code', message: 'code 파라미터가 없습니다 (요청 본문 파싱 실패 가능성 포함)' });
      return;
    }
    if (grant_type === 'refresh_token' && !refresh_token) {
      res.status(400).json({ error: 'missing_refresh_token' });
      return;
    }

    const creds = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
    const formBody = new URLSearchParams(
      grant_type === 'refresh_token'
        ? { grant_type: 'refresh_token', refresh_token }
        : { grant_type: 'authorization_code', code, redirect_uri: REDIRECT_URI }
    );

    const response = await fetch(
      `https://${MALL_ID}.cafe24api.com/api/v2/oauth/token`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${creds}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formBody,
      }
    );

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (parseErr) {
      // 카페24가 JSON이 아닌 응답(HTML 오류 페이지 등)을 준 경우
      console.error('cafe24 oauth non-JSON response:', response.status, text.slice(0, 500));
      res.status(502).json({ error: 'cafe24_non_json_response', status: response.status, raw: text.slice(0, 300) });
      return;
    }
    res.status(response.status).json(data);
  } catch (e) {
    console.error('cafe24-token handler error:', e);
    res.status(500).json({ error: e.message || String(e) });
  }
}
