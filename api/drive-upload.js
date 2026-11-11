// 이미지(dataURL) → 구글 드라이브 업로드 → 공개 링크 반환
// 필요한 Vercel 환경변수: GDRIVE_CLIENT_ID, GDRIVE_CLIENT_SECRET, GDRIVE_REFRESH_TOKEN
const FOLDER_NAME = 'work-board-images';
const MAX_BYTES = 3.5 * 1024 * 1024; // Vercel 요청 본문 4.5MB 한도 안쪽
let folderId = null; // 웜 인스턴스 캐시

const gfetch = async (url, token, opt = {}) => {
  const r = await fetch(url, { ...opt, headers: { Authorization: `Bearer ${token}`, ...(opt.headers || {}) } });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`${url.split('?')[0]} ${r.status} ${j.error?.message || JSON.stringify(j)}`);
  return j;
};

const getToken = async () => {
  const { GDRIVE_CLIENT_ID, GDRIVE_CLIENT_SECRET, GDRIVE_REFRESH_TOKEN } = process.env;
  if (!GDRIVE_CLIENT_ID || !GDRIVE_CLIENT_SECRET || !GDRIVE_REFRESH_TOKEN) throw new Error('GDRIVE_* env not set');
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: GDRIVE_CLIENT_ID, client_secret: GDRIVE_CLIENT_SECRET, refresh_token: GDRIVE_REFRESH_TOKEN, grant_type: 'refresh_token' }),
  });
  const j = await r.json();
  if (!r.ok || !j.access_token) throw new Error(`token ${r.status} ${j.error_description || j.error}`);
  return j.access_token;
};

const getFolder = async (token) => {
  if (folderId) return folderId;
  const q = encodeURIComponent(`name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`);
  const found = await gfetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id)&pageSize=1`, token);
  if (found.files?.[0]) return (folderId = found.files[0].id);
  const made = await gfetch('https://www.googleapis.com/drive/v3/files?fields=id', token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder' }),
  });
  return (folderId = made.id);
};

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }
  // 같은 사이트에서 온 요청만 허용 (CORS 헤더를 주지 않으므로 타 사이트 브라우저 호출은 차단됨)
  const origin = req.headers.origin;
  if (origin && new URL(origin).host !== req.headers.host) { res.status(403).json({ error: 'forbidden' }); return; }

  try {
    const m = /^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=]+)$/.exec((req.body || {}).dataUrl || '');
    if (!m) { res.status(400).json({ error: 'invalid image' }); return; }
    const buf = Buffer.from(m[2], 'base64');
    if (buf.length > MAX_BYTES) { res.status(413).json({ error: 'too large' }); return; }

    const token = await getToken();
    const parent = await getFolder(token);
    const boundary = 'wb' + Date.now();
    const meta = JSON.stringify({ name: `img-${Date.now()}.${m[1].split('/')[1]}`, parents: [parent] });
    const body = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n--${boundary}\r\nContent-Type: ${m[1]}\r\n\r\n`),
      buf,
      Buffer.from(`\r\n--${boundary}--`),
    ]);
    const file = await gfetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', token, {
      method: 'POST',
      headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
      body,
    });
    await gfetch(`https://www.googleapis.com/drive/v3/files/${file.id}/permissions`, token, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'reader', type: 'anyone' }),
    });
    res.status(200).json({ id: file.id, url: `https://lh3.googleusercontent.com/d/${file.id}` });
  } catch (e) {
    folderId = null;
    res.status(500).json({ error: String(e.message || e).slice(0, 300) });
  }
}
