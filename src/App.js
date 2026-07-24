import { useState, useEffect, useMemo, useCallback, useRef } from "react";

/* ══════════════════════════════════════════════
   저장 키
   DATA_KEY : 팀 공용 (shared=true)
   wb-file: : 첨부파일 1건당 1키, 공용
   ME_KEY   : 내가 누구인지 (개인, shared=false)
══════════════════════════════════════════════ */
const DATA_KEY = "team-work-board-v2";
const fileKey = (id) => `wb-file:${id}`;
const ME_KEY = "wb-me";

const COLUMNS = [
  { id: "todo", label: "대기" },
  { id: "doing", label: "진행중" },
  { id: "review", label: "검토·컨펌" },
  { id: "done", label: "완료" },
];

const DEFAULT_CHANNELS = [
  { id: "공통", color: "#7A8189" },
  { id: "자사몰", color: "#3355C9" },
  { id: "쿠팡", color: "#D14A4A" },
  { id: "네이버쇼핑", color: "#2E9E5B" },
  { id: "올리브영", color: "#87A82B" },
  { id: "마켓컬리", color: "#6B3FA0" },
  { id: "11번가", color: "#DE7A1C" },
];

const TYPES = [
  "상품기획", "채널운영", "마케팅", "상세페이지",
  "공급사", "인플루언서", "데이터분석", "기타",
];

const PRIORITIES = [
  { id: "high", label: "높음", rank: 0 },
  { id: "mid", label: "보통", rank: 1 },
  { id: "low", label: "낮음", rank: 2 },
];

const REPEATS = [
  { id: "none", label: "반복 없음" },
  { id: "daily", label: "매일" },
  { id: "weekly", label: "매주" },
  { id: "biweekly", label: "격주" },
  { id: "monthly", label: "매월" },
];

const ROLES = [
  { id: "admin", label: "관리자" },
  { id: "member", label: "멤버" },
  { id: "viewer", label: "뷰어" },
];

const MAX_FILE = 500 * 1024;
const LOG_CAP = 400;
const POLL_MS = 25000;

/* ── 유틸 ── */
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const todayStr = () => new Date().toISOString().slice(0, 10);
const dayDiff = (d) =>
  !d ? null : Math.round((new Date(d + "T00:00:00") - new Date(todayStr() + "T00:00:00")) / 86400000);
const fmtTs = (ts) => {
  const d = new Date(ts);
  const p = (n) => String(n).padStart(2, "0");
  return `${String(d.getFullYear()).slice(2)}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};
const fmtSize = (b) =>
  b < 1024 ? b + "B" : b < 1048576 ? (b / 1024).toFixed(0) + "KB" : (b / 1048576).toFixed(1) + "MB";

const nextDue = (due, repeat) => {
  const base = due ? new Date(due + "T00:00:00") : new Date();
  if (repeat === "daily") base.setDate(base.getDate() + 1);
  else if (repeat === "weekly") base.setDate(base.getDate() + 7);
  else if (repeat === "biweekly") base.setDate(base.getDate() + 14);
  else if (repeat === "monthly") base.setMonth(base.getMonth() + 1);
  else return due;
  return base.toISOString().slice(0, 10);
};

const emptyData = () => ({
  tasks: [], members: [], channels: DEFAULT_CHANNELS,
  channelsUpdatedAt: 0, log: [], updatedAt: 0,
});

/* 업무 단위 병합 — updatedAt 큰 쪽이 이김 */
function mergeData(remote, local) {
  const r = remote || emptyData();
  const l = local || emptyData();

  const map = new Map();
  [...(r.tasks || []), ...(l.tasks || [])].forEach((t) => {
    const prev = map.get(t.id);
    if (!prev || (t.updatedAt || 0) > (prev.updatedAt || 0)) map.set(t.id, t);
  });

  const logMap = new Map();
  [...(r.log || []), ...(l.log || [])].forEach((e) => logMap.set(e.id, e));
  const log = [...logMap.values()].sort((a, b) => b.ts - a.ts).slice(0, LOG_CAP);

  const memberMap = new Map();
  [...(r.members || []), ...(l.members || [])].forEach((m) => {
    const prev = memberMap.get(m.name);
    if (!prev || (m.updatedAt || 0) >= (prev.updatedAt || 0)) memberMap.set(m.name, m);
  });

  const useLocalCh = (l.channelsUpdatedAt || 0) >= (r.channelsUpdatedAt || 0);
  return {
    tasks: [...map.values()],
    members: [...memberMap.values()],
    channels: (useLocalCh ? l.channels : r.channels) || DEFAULT_CHANNELS,
    channelsUpdatedAt: Math.max(l.channelsUpdatedAt || 0, r.channelsUpdatedAt || 0),
    log,
    updatedAt: Date.now(),
  };
}

/* ══════════════════════════════════════════════
   스타일
══════════════════════════════════════════════ */
const CSS = `
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css');
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&display=swap');

.wb{
  --bg:#EDEFEC; --surface:#fff; --ink:#15171B; --ink2:#565C64; --ink3:#8F959C;
  --line:#DBDFD9; --line2:#C4C9C1; --sig:#1B4D3E; --danger:#B4342F; --warn:#A8690E;
  --sans:'Pretendard',-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo',system-ui,sans-serif;
  --mono:'IBM Plex Mono',ui-monospace,SFMono-Regular,Menlo,monospace;
  background:var(--bg); color:var(--ink); font-family:var(--sans);
  min-height:100vh; padding:20px 18px 60px; box-sizing:border-box; -webkit-font-smoothing:antialiased;
}
.wb *,.wb *::before,.wb *::after{box-sizing:border-box;}
.wb button{font-family:inherit;cursor:pointer;}
.wb input,.wb select,.wb textarea{font-family:inherit;}
.wb :focus-visible{outline:2px solid var(--sig);outline-offset:2px;}
.wb p,.wb h1,.wb h2,.wb h3,.wb h4{margin:0;}
.mono{font-family:var(--mono);}
.spacer{flex:1;}

.top{display:flex;align-items:flex-end;justify-content:space-between;gap:14px;flex-wrap:wrap;margin-bottom:16px;}
.eyebrow{font-family:var(--mono);font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--ink3);margin-bottom:5px;}
.title{font-size:26px;font-weight:800;letter-spacing:-.035em;line-height:1;}
.topright{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
.save{font-family:var(--mono);font-size:11px;color:var(--ink3);display:inline-flex;align-items:center;gap:6px;}
.dot{width:6px;height:6px;border-radius:50%;background:var(--line2);}
.dot.on{background:var(--sig);} .dot.err{background:var(--danger);}
.who{display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--ink2);
  border:1px solid var(--line2);padding:5px 10px;background:var(--surface);}
.who b{font-weight:700;color:var(--ink);}
.who .role{font-family:var(--mono);font-size:9.5px;letter-spacing:.08em;color:var(--ink3);}

.tabs{display:flex;border-bottom:2px solid var(--ink);margin-bottom:16px;flex-wrap:wrap;}
.tab{background:transparent;border:none;padding:8px 14px;font-size:13px;font-weight:600;color:var(--ink3);letter-spacing:-.02em;}
.tab.sel{background:var(--ink);color:#fff;}
.tab em{font-family:var(--mono);font-style:normal;font-size:10.5px;opacity:.7;margin-left:5px;}

.metrics{display:grid;grid-template-columns:repeat(5,1fr);gap:1px;background:var(--line);border:1px solid var(--line);margin-bottom:12px;}
.metric{background:var(--surface);padding:11px 13px;text-align:left;border:none;}
.metric.click:hover{background:#F6F8F4;}
.metric .k{font-family:var(--mono);font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink3);display:block;margin-bottom:4px;}
.metric .v{font-family:var(--mono);font-size:23px;font-weight:600;letter-spacing:-.03em;line-height:1;}
.metric .v.alert{color:var(--danger);} .metric .v.warn{color:var(--warn);}

.strip{display:flex;height:8px;background:var(--surface);border:1px solid var(--line);overflow:hidden;}
.strip i{display:block;height:100%;}
.legend{display:flex;flex-wrap:wrap;gap:9px 15px;margin:8px 0 16px;}
.leg{display:inline-flex;align-items:center;gap:6px;font-family:var(--mono);font-size:11px;color:var(--ink2);}
.leg b{width:7px;height:7px;border-radius:1px;}

.tools{display:flex;gap:7px;flex-wrap:wrap;align-items:center;padding-bottom:12px;margin-bottom:14px;border-bottom:1px solid var(--line2);}
.inp,.sel{background:var(--surface);border:1px solid var(--line2);color:var(--ink);padding:6px 9px;font-size:12.5px;border-radius:0;}
.inp::placeholder{color:var(--ink3);}
.chip{background:transparent;border:1px solid var(--line2);color:var(--ink2);padding:5px 10px;font-size:12px;display:inline-flex;align-items:center;gap:6px;}
.chip b{width:7px;height:7px;border-radius:1px;}
.chip.sel{background:var(--ink);color:#fff;border-color:var(--ink);}
.chip.tog.sel{background:var(--sig);border-color:var(--sig);}
.btn{background:var(--sig);color:#fff;border:none;padding:7px 14px;font-size:12.5px;font-weight:600;}
.btn:disabled{opacity:.4;cursor:default;}
.btn.ghost{background:transparent;color:var(--ink2);border:1px solid var(--line2);font-weight:500;}
.btn.warn{background:var(--danger);}

.board{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;align-items:start;}
.colhead{display:flex;align-items:baseline;justify-content:space-between;padding-bottom:7px;margin-bottom:9px;border-bottom:2px solid var(--ink);}
.colhead span{font-size:13px;font-weight:700;letter-spacing:-.02em;}
.colhead em{font-family:var(--mono);font-style:normal;font-size:11.5px;color:var(--ink3);}
.colbody{display:flex;flex-direction:column;gap:7px;min-height:70px;padding:2px;}
.colbody.over{background:#E2E8DF;outline:1px dashed var(--sig);}

.card{position:relative;background:var(--surface);border:1px solid var(--line);padding:10px 11px 9px 14px;cursor:pointer;}
.card::before{content:'';position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--ch);}
.card.late{border-color:#E3B3B0;}
.card.drag{opacity:.35;}
.cmeta{display:flex;align-items:center;gap:6px;margin-bottom:5px;font-family:var(--mono);font-size:10px;letter-spacing:.04em;color:var(--ink3);flex-wrap:wrap;}
.cmeta .ch{color:var(--ch);font-weight:600;}
.ctitle{font-size:13.5px;font-weight:600;line-height:1.4;letter-spacing:-.015em;margin-bottom:7px;word-break:keep-all;}
.card.done .ctitle{color:var(--ink3);text-decoration:line-through;}
.ctags{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:7px;align-items:center;}
.tag{font-family:var(--mono);font-size:9.5px;background:#EFF2ED;border:1px solid var(--line);padding:1px 5px;color:var(--ink2);display:inline-flex;align-items:center;}
.cbar{height:3px;background:#E9ECE7;margin-bottom:7px;}
.cbar i{display:block;height:100%;background:var(--sig);}
.cfoot{display:flex;align-items:center;justify-content:space-between;gap:6px;font-family:var(--mono);font-size:10.5px;color:var(--ink2);}
.due.late{color:var(--danger);font-weight:600;} .due.soon{color:var(--warn);font-weight:600;}
.pri{font-family:var(--mono);font-size:9.5px;letter-spacing:.08em;border:1px solid var(--line2);padding:1px 5px;color:var(--ink2);}
.pri.high{border-color:var(--danger);color:var(--danger);}
.icons{display:inline-flex;gap:6px;color:var(--ink3);font-family:var(--mono);font-size:9.5px;}
.empty{border:1px dashed var(--line2);padding:13px 10px;text-align:center;font-size:11.5px;color:var(--ink3);}

.tbl{width:100%;border-collapse:collapse;background:var(--surface);border:1px solid var(--line);font-size:12.5px;}
.tbl th{font-family:var(--mono);font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink3);
  text-align:left;padding:9px 10px;border-bottom:1px solid var(--line2);font-weight:500;white-space:nowrap;}
.tbl td{padding:9px 10px;border-bottom:1px solid var(--line);vertical-align:middle;}
.tbl tr:last-child td{border-bottom:none;}
.tbl tr.click:hover{background:#F6F8F4;cursor:pointer;}
.tbl .m{font-family:var(--mono);font-size:11.5px;color:var(--ink2);white-space:nowrap;}
.chdot{display:inline-flex;align-items:center;gap:6px;}
.chdot b{width:8px;height:8px;border-radius:1px;}

.logrow{display:grid;grid-template-columns:118px 78px 1fr;gap:10px;padding:8px 10px;border-bottom:1px solid var(--line);
  background:var(--surface);font-size:12.5px;align-items:baseline;}
.logrow:first-of-type{border-top:1px solid var(--line);}
.logrow .t,.logrow .w{font-family:var(--mono);font-size:10.5px;color:var(--ink3);}
.logrow .w{color:var(--ink2);font-weight:500;}

.panel{background:var(--surface);border:1px solid var(--line);padding:18px;margin-bottom:14px;}
.panel h3{font-size:14px;font-weight:800;letter-spacing:-.025em;margin-bottom:4px;}
.panel .sub{font-size:11.5px;color:var(--ink3);line-height:1.65;margin-bottom:14px;}
.mrow{display:flex;align-items:center;gap:8px;padding:7px 0;border-top:1px solid var(--line);}
.mrow:first-of-type{border-top:none;}

.mask{position:fixed;inset:0;background:rgba(21,23,27,.45);display:flex;align-items:flex-start;justify-content:center;
  padding:34px 14px;overflow-y:auto;z-index:50;}
.modal{background:var(--surface);border:1px solid var(--line2);width:100%;max-width:560px;padding:20px;}
.modal.sm{max-width:400px;}
.modal h2{font-size:17px;font-weight:800;letter-spacing:-.03em;margin-bottom:14px;}
.fld{margin-bottom:11px;}
.fld label{display:block;font-family:var(--mono);font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink3);margin-bottom:5px;}
.fld input,.fld select,.fld textarea{width:100%;background:#FBFCFA;border:1px solid var(--line2);padding:7px 9px;font-size:13px;color:var(--ink);}
.fld textarea{resize:vertical;min-height:60px;line-height:1.5;}
.r2{display:grid;grid-template-columns:1fr 1fr;gap:9px;}
.r3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:9px;}
.mfoot{display:flex;gap:7px;align-items:center;margin-top:16px;padding-top:13px;border-top:1px solid var(--line);}
.del{background:transparent;border:none;color:var(--danger);font-size:12px;padding:6px 0;}

.sect{border-top:1px solid var(--line);margin-top:14px;padding-top:12px;}
.sect h4{font-family:var(--mono);font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink3);margin-bottom:8px;font-weight:500;}
.item{display:flex;align-items:center;gap:8px;padding:5px 0;font-size:12.5px;}
.item .x{background:transparent;border:none;color:var(--ink3);font-size:14px;padding:0 3px;line-height:1;}
.item .x:hover{color:var(--danger);}
.item a{color:var(--sig);text-decoration:none;word-break:break-all;}
.item a:hover{text-decoration:underline;}
.addrow{display:flex;gap:6px;margin-top:6px;}
.addrow input{flex:1;background:#FBFCFA;border:1px solid var(--line2);padding:6px 8px;font-size:12.5px;}
.addrow button{background:var(--ink);color:#fff;border:none;padding:6px 11px;font-size:12px;}
.cmt{border-left:2px solid var(--line2);padding:4px 0 4px 9px;margin-bottom:8px;}
.cmt .h{font-family:var(--mono);font-size:10px;color:var(--ink3);margin-bottom:3px;}
.cmt .h b{color:var(--ink2);font-weight:600;}
.cmt p{font-size:12.5px;line-height:1.55;white-space:pre-wrap;word-break:break-word;}
.hint{font-size:11.5px;color:var(--ink3);}

.note{margin-top:26px;font-family:var(--mono);font-size:10.5px;color:var(--ink3);line-height:1.75;
  border-top:1px solid var(--line);padding-top:12px;}
.note b{color:var(--ink2);}

@media (max-width:1000px){.board{grid-template-columns:repeat(2,minmax(0,1fr));}.metrics{grid-template-columns:repeat(3,1fr);}}
@media (max-width:620px){.board{grid-template-columns:1fr;}.metrics{grid-template-columns:repeat(2,1fr);}.r3{grid-template-columns:1fr;}}
@media (prefers-reduced-motion:reduce){.wb *{transition:none!important;animation:none!important;}}
`;

/* ══════════════════════════════════════════════ */
const PASSWORD = "shakebaby2024"; // 비밀번호 여기서 변경

export default function WorkBoard() {
  const [auth, setAuth] = useState(() => sessionStorage.getItem("wb-auth") === "1");
  const [pwInput, setPwInput] = useState("");

  if (!auth) {
    const tryLogin = (val) => {
      if (val === PASSWORD) {
        sessionStorage.setItem("wb-auth", "1");
        setAuth(true);
      } else {
        alert("비밀번호가 틀렸습니다.");
        setPwInput("");
      }
    };
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", minHeight: "100vh", background: "#EDEFEC",
        fontFamily: "sans-serif", gap: 12
      }}>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.03em" }}>업무 보드</div>
        <div style={{ fontSize: 13, color: "#8F959C", marginBottom: 8 }}>비밀번호를 입력하세요</div>
        <input
          type="password" autoFocus value={pwInput}
          onChange={(e) => setPwInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && tryLogin(e.target.value)}
          placeholder="비밀번호"
          style={{
            padding: "10px 14px", fontSize: 14,
            border: "1px solid #C4C9C1", width: 240, outline: "none"
          }}
        />
        <button
          onClick={() => tryLogin(pwInput)}
          style={{
            background: "#1B4D3E", color: "#fff", border: "none",
            padding: "10px 24px", fontSize: 13, fontWeight: 600,
            cursor: "pointer", width: 240
          }}
        >입장</button>
      </div>
    );
  }

  const [data, setData] = useState(emptyData());
  const [me, setMe] = useState("");
  const [ready, setReady] = useState(false);
  const [saveState, setSaveState] = useState("idle");
  const [view, setView] = useState("board");

  const [q, setQ] = useState("");
  const [fCh, setFCh] = useState("전체");
  const [fOwner, setFOwner] = useState("전체");
  const [fTag, setFTag] = useState("전체");
  const [onlyMine, setOnlyMine] = useState(false);
  const [onlyLate, setOnlyLate] = useState(false);
  const [sortBy, setSortBy] = useState("due");

  const [draft, setDraft] = useState(null);
  const [dragId, setDragId] = useState(null);
  const [overCol, setOverCol] = useState(null);
  const [askName, setAskName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [confirmBox, setConfirmBox] = useState(null);
  const [newChannel, setNewChannel] = useState("");

  const dataRef = useRef(data);
  dataRef.current = data;
  const busyRef = useRef(false);
  const importRef = useRef(null);

  /* 역할 */
  const myRole = useMemo(() => {
    const m = data.members.find((x) => x.name === me);
    if (m) return m.role;
    return data.members.length === 0 ? "admin" : "member";
  }, [data.members, me]);
  const canEdit = myRole === "admin" || myRole === "member";
  const isAdmin = myRole === "admin";

  const chColor = useCallback(
    (name) => (data.channels.find((c) => c.id === name) || { color: "#7A8189" }).color,
    [data.channels]
  );

  /* 로드 */
  const load = useCallback(async (silent) => {
    if (!silent) setSaveState("loading");
    try {
      const res = await window.storage.get(DATA_KEY, true);
      const raw = res && res.value;
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (parsed && Array.isArray(parsed.tasks)) setData({ ...emptyData(), ...parsed });
    } catch (e) { /* 최초 실행 */ }
    if (!silent) setSaveState("idle");
  }, []);

  useEffect(() => {
    (async () => {
      await load();
      try {
        const p = await window.storage.get(ME_KEY, false);
        const name = typeof p?.value === "string" ? p.value : "";
        if (name) setMe(name); else setAskName(true);
      } catch (e) { setAskName(true); }
      setReady(true);
    })();
  }, [load]);

  /* 자동 동기화 */
  useEffect(() => {
    const t = setInterval(() => {
      if (draft || confirmBox || busyRef.current) return;
      (async () => {
        try {
          const res = await window.storage.get(DATA_KEY, true);
          const raw = res && res.value;
          const remote = typeof raw === "string" ? JSON.parse(raw) : raw;
          if (remote && (remote.updatedAt || 0) > (dataRef.current.updatedAt || 0)) {
            setData(mergeData(remote, dataRef.current));
          }
        } catch (e) {}
      })();
    }, POLL_MS);
    return () => clearInterval(t);
  }, [draft, confirmBox]);

  /* 저장: 읽고 → 병합 → 쓰기 */
  const commit = useCallback(async (mutator, logEntries) => {
    busyRef.current = true;
    setSaveState("saving");
    setData(mutator(dataRef.current));
    try {
      let remote = null;
      try {
        const res = await window.storage.get(DATA_KEY, true);
        const raw = res && res.value;
        remote = typeof raw === "string" ? JSON.parse(raw) : raw;
      } catch (e) {}
      const base = remote && Array.isArray(remote.tasks) ? { ...emptyData(), ...remote } : emptyData();
      const next = mutator(mergeData(base, dataRef.current));
      if (logEntries && logEntries.length) {
        next.log = [...logEntries, ...(next.log || [])].slice(0, LOG_CAP);
      }
      next.updatedAt = Date.now();
      await window.storage.set(DATA_KEY, JSON.stringify(next), true);
      setData(next);
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 1500);
    } catch (e) {
      setSaveState("error");
    } finally {
      busyRef.current = false;
    }
  }, []);

  const mkLog = (action, task, detail) => ({
    id: uid(), ts: Date.now(), who: me || "익명",
    taskId: task?.id || null, taskTitle: task?.title || "", action, detail: detail || "",
  });

  /* 파생 */
  const live = useMemo(() => data.tasks.filter((t) => !t.deleted && !t.archived), [data.tasks]);
  const archived = useMemo(() => data.tasks.filter((t) => !t.deleted && t.archived), [data.tasks]);
  const owners = useMemo(
    () => [...new Set(data.tasks.filter((t) => !t.deleted).map((t) => t.owner).filter(Boolean))].sort(),
    [data.tasks]
  );
  const allTags = useMemo(
    () => [...new Set(data.tasks.filter((t) => !t.deleted).flatMap((t) => t.tags || []))].sort(),
    [data.tasks]
  );

  const applyFilters = useCallback((list) => {
    const kw = q.trim().toLowerCase();
    return list.filter((t) => {
      if (fCh !== "전체" && t.channel !== fCh) return false;
      if (fOwner !== "전체" && t.owner !== fOwner) return false;
      if (fTag !== "전체" && !(t.tags || []).includes(fTag)) return false;
      if (onlyMine && t.owner !== me) return false;
      if (onlyLate) {
        const d = dayDiff(t.due);
        if (!(d !== null && d < 0 && t.status !== "done")) return false;
      }
      if (kw) {
        const hay = `${t.title} ${t.memo || ""} ${t.type} ${t.owner || ""} ${(t.tags || []).join(" ")}`.toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      return true;
    });
  }, [q, fCh, fOwner, fTag, onlyMine, onlyLate, me]);

  const sortFn = useCallback((a, b) => {
    if (sortBy === "due") {
      if (!a.due && !b.due) return 0;
      if (!a.due) return 1;
      if (!b.due) return -1;
      return a.due < b.due ? -1 : 1;
    }
    if (sortBy === "pri") {
      const r = (t) => PRIORITIES.find((p) => p.id === t.priority)?.rank ?? 1;
      return r(a) - r(b);
    }
    return (b.updatedAt || 0) - (a.updatedAt || 0);
  }, [sortBy]);

  const visible = useMemo(() => applyFilters(live).slice().sort(sortFn), [live, applyFilters, sortFn]);

  const stats = useMemo(() => {
    const open = live.filter((t) => t.status !== "done");
    return {
      total: live.length,
      doing: live.filter((t) => t.status === "doing").length,
      week: open.filter((t) => { const d = dayDiff(t.due); return d !== null && d >= 0 && d <= 7; }).length,
      late: open.filter((t) => { const d = dayDiff(t.due); return d !== null && d < 0; }).length,
      mine: open.filter((t) => t.owner === me).length,
    };
  }, [live, me]);

  const dist = useMemo(() => {
    const open = live.filter((t) => t.status !== "done");
    return data.channels
      .map((c) => ({ ...c, n: open.filter((t) => t.channel === c.id).length }))
      .filter((c) => c.n > 0);
  }, [live, data.channels]);
  const distTotal = dist.reduce((s, c) => s + c.n, 0);

  /* 액션 */
  const saveMe = async (name) => {
    const n = name.trim();
    if (!n) return;
    setMe(n);
    setAskName(false);
    try { await window.storage.set(ME_KEY, n, false); } catch (e) {}
    if (!dataRef.current.members.find((m) => m.name === n)) {
      const role = dataRef.current.members.length === 0 ? "admin" : "member";
      commit(
        (d) => ({ ...d, members: [...d.members, { name: n, role, updatedAt: Date.now() }] }),
        [{ id: uid(), ts: Date.now(), who: n, taskId: null, taskTitle: "", action: "팀 합류", detail: ROLES.find((r) => r.id === role).label }]
      );
    }
  };

  const openNew = (status) =>
    setDraft({
      _new: true, id: uid(), title: "", channel: data.channels[0]?.id || "공통",
      type: "채널운영", owner: me, due: "", priority: "mid", memo: "",
      status: status || "todo", tags: [], checklist: [], links: [], files: [],
      comments: [], repeat: "none", archived: false, deleted: false,
    });

  const openTask = (t) =>
    setDraft({
      ...t,
      tags: [...(t.tags || [])], checklist: [...(t.checklist || [])],
      links: [...(t.links || [])], files: [...(t.files || [])],
      comments: [...(t.comments || [])],
    });

  const saveDraft = () => {
    if (!draft.title.trim()) return;
    const now = Date.now();
    const isNew = draft._new;
    const clean = { ...draft };
    delete clean._new;
    const before = data.tasks.find((t) => t.id === draft.id);
    const logs = [];

    if (isNew) logs.push(mkLog("업무 생성", clean, `${clean.channel} · ${clean.type}`));
    else {
      const diffs = [];
      if (before) {
        if (before.title !== clean.title) diffs.push("업무명");
        if (before.status !== clean.status) diffs.push(`상태 → ${COLUMNS.find((c) => c.id === clean.status)?.label}`);
        if (before.owner !== clean.owner) diffs.push(`담당자 → ${clean.owner || "미지정"}`);
        if (before.due !== clean.due) diffs.push(`마감 → ${clean.due || "없음"}`);
        if (before.priority !== clean.priority) diffs.push("우선순위");
        if (before.channel !== clean.channel) diffs.push(`채널 → ${clean.channel}`);
        if ((before.comments || []).length !== (clean.comments || []).length) diffs.push("댓글");
      }
      logs.push(mkLog("업무 수정", clean, diffs.join(", ") || "내용 변경"));
    }

    let spawn = null;
    if (clean.status === "done" && before?.status !== "done" && clean.repeat !== "none") {
      spawn = {
        ...clean, id: uid(), status: "todo", due: nextDue(clean.due, clean.repeat),
        checklist: (clean.checklist || []).map((c) => ({ ...c, id: uid(), done: false })),
        comments: [], createdAt: now, createdBy: me, updatedAt: now, doneAt: null,
      };
      logs.push(mkLog("반복 생성", spawn, `다음 마감 ${spawn.due}`));
    }

    commit((d) => {
      const exists = d.tasks.some((t) => t.id === clean.id);
      const rec = {
        ...clean,
        createdAt: before?.createdAt || now,
        createdBy: before?.createdBy || me,
        updatedAt: now, updatedBy: me,
        doneAt: clean.status === "done" ? (before?.doneAt || now) : null,
      };
      let tasks = exists ? d.tasks.map((t) => (t.id === rec.id ? rec : t)) : [rec, ...d.tasks];
      if (spawn) tasks = [spawn, ...tasks];
      return { ...d, tasks };
    }, logs);

    setDraft(null);
  };

  const moveTask = (task, statusId) => {
    if (!canEdit || task.status === statusId) return;
    const now = Date.now();
    const logs = [mkLog("상태 변경", task, `${COLUMNS.find((c) => c.id === task.status)?.label} → ${COLUMNS.find((c) => c.id === statusId)?.label}`)];
    let spawn = null;
    if (statusId === "done" && task.repeat && task.repeat !== "none") {
      spawn = {
        ...task, id: uid(), status: "todo", due: nextDue(task.due, task.repeat),
        checklist: (task.checklist || []).map((c) => ({ ...c, id: uid(), done: false })),
        comments: [], createdAt: now, createdBy: me, updatedAt: now, doneAt: null,
      };
      logs.push(mkLog("반복 생성", spawn, `다음 마감 ${spawn.due}`));
    }
    commit((d) => {
      let tasks = d.tasks.map((t) =>
        t.id === task.id
          ? { ...t, status: statusId, updatedAt: now, updatedBy: me, doneAt: statusId === "done" ? (t.doneAt || now) : null }
          : t
      );
      if (spawn) tasks = [spawn, ...tasks];
      return { ...d, tasks };
    }, logs);
  };

  const removeTask = (task) => {
    commit(
      (d) => ({ ...d, tasks: d.tasks.map((t) => (t.id === task.id ? { ...t, deleted: true, updatedAt: Date.now(), updatedBy: me } : t)) }),
      [mkLog("업무 삭제", task)]
    );
    setDraft(null);
  };

  const setArchivedFlag = (task, flag) => {
    commit(
      (d) => ({ ...d, tasks: d.tasks.map((t) => (t.id === task.id ? { ...t, archived: flag, updatedAt: Date.now(), updatedBy: me } : t)) }),
      [mkLog(flag ? "아카이브" : "아카이브 해제", task)]
    );
  };

  const archiveDone = () => {
    const targets = live.filter((t) => t.status === "done");
    if (!targets.length) { setConfirmBox(null); return; }
    const ids = new Set(targets.map((t) => t.id));
    commit(
      (d) => ({ ...d, tasks: d.tasks.map((t) => (ids.has(t.id) ? { ...t, archived: true, updatedAt: Date.now(), updatedBy: me } : t)) }),
      [mkLog("완료 일괄 보관", null, `${targets.length}건`)]
    );
    setConfirmBox(null);
  };

  const purgeArchive = () => {
    const ids = new Set(archived.map((t) => t.id));
    commit(
      (d) => ({ ...d, tasks: d.tasks.filter((t) => !ids.has(t.id)) }),
      [mkLog("보관함 영구 삭제", null, `${ids.size}건`)]
    );
    setConfirmBox(null);
  };

  /* 첨부 */
  const attachFile = async (file) => {
    if (file.size > MAX_FILE) {
      alert(`파일이 ${fmtSize(MAX_FILE)}를 넘습니다. 드라이브에 올리고 링크로 걸어주세요.`);
      return;
    }
    const b64 = await new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = rej;
      r.readAsDataURL(file);
    });
    const id = uid();
    try {
      await window.storage.set(fileKey(id), b64, true);
      setDraft((d) => ({ ...d, files: [...(d.files || []), { id, name: file.name, size: file.size }] }));
    } catch (e) {
      alert("파일 저장에 실패했습니다. 용량을 줄이거나 링크로 걸어주세요.");
    }
  };

  const downloadFile = async (f) => {
    try {
      const res = await window.storage.get(fileKey(f.id), true);
      const a = document.createElement("a");
      a.href = res.value;
      a.download = f.name;
      a.click();
    } catch (e) {
      alert("파일을 찾을 수 없습니다.");
    }
  };

  /* 백업 */
  const exportJson = () => {
    const blob = new Blob([JSON.stringify(dataRef.current, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `work-board-${todayStr()}.json`;
    a.click();
  };

  const exportCsv = () => {
    const head = ["업무명", "채널", "유형", "담당자", "마감일", "우선순위", "상태", "태그", "메모"];
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = data.tasks.filter((t) => !t.deleted).map((t) =>
      [t.title, t.channel, t.type, t.owner, t.due,
       PRIORITIES.find((p) => p.id === t.priority)?.label,
       (COLUMNS.find((c) => c.id === t.status)?.label || "") + (t.archived ? "(보관)" : ""),
       (t.tags || []).join(" "), t.memo].map(esc).join(",")
    );
    const blob = new Blob(["\uFEFF" + [head.map(esc).join(","), ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `work-board-${todayStr()}.csv`;
    a.click();
  };

  const importJson = async (file) => {
    try {
      const parsed = JSON.parse(await file.text());
      if (!Array.isArray(parsed.tasks)) throw new Error("bad");
      commit(
        (d) => mergeData(d, { ...emptyData(), ...parsed }),
        [mkLog("백업 가져오기", null, `${parsed.tasks.length}건 병합`)]
      );
    } catch (e) {
      alert("읽을 수 없는 파일입니다. 이 보드에서 내려받은 JSON만 가져올 수 있습니다.");
    }
  };

  const addChannel = () => {
    const id = newChannel.trim();
    if (!id || dataRef.current.channels.some((c) => c.id === id)) return;
    commit(
      (d) => ({ ...d, channels: [...d.channels, { id, color: "#7A8189" }], channelsUpdatedAt: Date.now() }),
      [mkLog("채널 추가", null, id)]
    );
    setNewChannel("");
  };

  /* Esc */
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") { setDraft(null); setConfirmBox(null); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  /* 카드 */
  const renderCard = (t) => {
    const d = dayDiff(t.due);
    const late = d !== null && d < 0 && t.status !== "done";
    const soon = d !== null && d >= 0 && d <= 2 && t.status !== "done";
    const ck = t.checklist || [];
    const ckDone = ck.filter((c) => c.done).length;
    return (
      <div
        key={t.id}
        className={"card" + (late ? " late" : "") + (t.status === "done" ? " done" : "") + (dragId === t.id ? " drag" : "")}
        style={{ "--ch": chColor(t.channel) }}
        draggable={canEdit}
        onDragStart={(e) => { setDragId(t.id); e.dataTransfer.effectAllowed = "move"; }}
        onDragEnd={() => { setDragId(null); setOverCol(null); }}
        onClick={() => openTask(t)}
      >
        <div className="cmeta">
          <span className="ch">{t.channel}</span><span>·</span><span>{t.type}</span>
          {t.repeat && t.repeat !== "none" && (
            <><span>·</span><span>↻{REPEATS.find((r) => r.id === t.repeat)?.label}</span></>
          )}
        </div>
        <p className="ctitle">{t.title}</p>
        {!!(t.tags || []).length && (
          <div className="ctags">{t.tags.map((g) => <span key={g} className="tag">{g}</span>)}</div>
        )}
        {ck.length > 0 && <div className="cbar"><i style={{ width: (ckDone / ck.length) * 100 + "%" }} /></div>}
        <div className="cfoot">
          <span>
            {t.owner || "미지정"}
            {t.due && (
              <>{"  "}<span className={"due" + (late ? " late" : soon ? " soon" : "")}>
                {t.due.slice(5)}{late ? ` +${Math.abs(d)}d` : ""}
              </span></>
            )}
          </span>
          <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span className="icons">
              {ck.length > 0 && <span>☑{ckDone}/{ck.length}</span>}
              {!!(t.comments || []).length && <span>💬{t.comments.length}</span>}
              {(!!(t.links || []).length || !!(t.files || []).length) && (
                <span>📎{(t.links || []).length + (t.files || []).length}</span>
              )}
            </span>
            <span className={"pri" + (t.priority === "high" ? " high" : "")}>
              {PRIORITIES.find((p) => p.id === t.priority)?.label}
            </span>
          </span>
        </div>
      </div>
    );
  };

  if (!ready) {
    return (
      <div className="wb">
        <style>{CSS}</style>
        <div className="eyebrow">Team Work Board</div>
        <p className="mono" style={{ fontSize: 12, color: "#8F959C" }}>보드를 불러오는 중</p>
      </div>
    );
  }

  return (
    <div className="wb">
      <style>{CSS}</style>

      <div className="top">
        <div>
          <div className="eyebrow">Team Work Board</div>
          <h1 className="title">업무 보드</h1>
        </div>
        <div className="topright">
          <button className="who" onClick={() => { setNameInput(me); setAskName(true); }}>
            <b>{me || "이름 설정"}</b>
            <span className="role">{ROLES.find((r) => r.id === myRole)?.label}</span>
          </button>
          <span className="save">
            <i className={"dot " + (saveState === "error" ? "err" : saveState === "idle" ? "" : "on")} />
            {saveState === "saving" ? "저장 중"
              : saveState === "saved" ? "저장됨"
              : saveState === "error" ? "저장 실패"
              : saveState === "loading" ? "불러오는 중" : "동기화됨"}
          </span>
          <button className="btn ghost" onClick={() => load()}>새로고침</button>
        </div>
      </div>

      <div className="tabs">
        {[
          { id: "board", label: "보드", n: live.length },
          { id: "list", label: "목록", n: null },
          { id: "archive", label: "보관함", n: archived.length },
          { id: "log", label: "변경 이력", n: null },
          { id: "team", label: "팀·설정", n: null },
        ].map((t) => (
          <button key={t.id} className={"tab" + (view === t.id ? " sel" : "")} onClick={() => setView(t.id)}>
            {t.label}{t.n !== null && <em>{t.n}</em>}
          </button>
        ))}
      </div>

      {(view === "board" || view === "list") && (
        <>
          <div className="metrics">
            <button className="metric click" onClick={() => { setOnlyMine(false); setOnlyLate(false); }}>
              <span className="k">전체</span><span className="v">{stats.total}</span>
            </button>
            <div className="metric"><span className="k">진행중</span><span className="v">{stats.doing}</span></div>
            <div className="metric"><span className="k">7일 내 마감</span><span className={"v" + (stats.week ? " warn" : "")}>{stats.week}</span></div>
            <button className="metric click" onClick={() => { setOnlyLate(true); setOnlyMine(false); }}>
              <span className="k">지연</span><span className={"v" + (stats.late ? " alert" : "")}>{stats.late}</span>
            </button>
            <button className="metric click" onClick={() => { setOnlyMine(true); setOnlyLate(false); }}>
              <span className="k">내 미완료</span><span className="v">{stats.mine}</span>
            </button>
          </div>

          <div className="strip">
            {distTotal === 0
              ? <i style={{ width: "100%", background: "#E4E7E2" }} />
              : dist.map((c) => (
                  <i key={c.id} style={{ width: (c.n / distTotal) * 100 + "%", background: c.color }} title={`${c.id} ${c.n}건`} />
                ))}
          </div>
          <div className="legend">
            {dist.length === 0
              ? <span className="leg" style={{ color: "#8F959C" }}>미완료 업무 없음</span>
              : dist.map((c) => <span key={c.id} className="leg"><b style={{ background: c.color }} />{c.id} {c.n}</span>)}
          </div>

          <div className="tools">
            <input className="inp" placeholder="검색" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 120 }} />
            <button className={"chip" + (fCh === "전체" ? " sel" : "")} onClick={() => setFCh("전체")}>전체</button>
            {data.channels.map((c) => (
              <button key={c.id} className={"chip" + (fCh === c.id ? " sel" : "")} onClick={() => setFCh(c.id)}>
                <b style={{ background: c.color }} />{c.id}
              </button>
            ))}
            <select className="sel" value={fOwner} onChange={(e) => setFOwner(e.target.value)}>
              <option value="전체">담당자 전체</option>
              {owners.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            {allTags.length > 0 && (
              <select className="sel" value={fTag} onChange={(e) => setFTag(e.target.value)}>
                <option value="전체">태그 전체</option>
                {allTags.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            )}
            <button className={"chip tog" + (onlyMine ? " sel" : "")} onClick={() => setOnlyMine((v) => !v)}>내 업무</button>
            <button className={"chip tog" + (onlyLate ? " sel" : "")} onClick={() => setOnlyLate((v) => !v)}>지연만</button>
            <select className="sel" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="due">마감일순</option>
              <option value="pri">우선순위순</option>
              <option value="upd">최근수정순</option>
            </select>
            <span className="spacer" />
            {canEdit && <button className="btn" onClick={() => openNew()}>업무 추가</button>}
          </div>
        </>
      )}

      {view === "board" && (
        <div className="board">
          {COLUMNS.map((col) => {
            const items = visible.filter((t) => t.status === col.id);
            return (
              <div key={col.id}>
                <div className="colhead"><span>{col.label}</span><em>{items.length}</em></div>
                <div
                  className={"colbody" + (overCol === col.id ? " over" : "")}
                  onDragOver={(e) => { if (dragId) { e.preventDefault(); setOverCol(col.id); } }}
                  onDragLeave={() => setOverCol((c) => (c === col.id ? null : c))}
                  onDrop={(e) => {
                    e.preventDefault();
                    const t = data.tasks.find((x) => x.id === dragId);
                    if (t) moveTask(t, col.id);
                    setDragId(null); setOverCol(null);
                  }}
                >
                  {items.length === 0 && (
                    <div className="empty">
                      {dragId ? "여기로 놓기" : col.id === "todo" ? "업무를 추가해 시작하세요" : "비어 있음"}
                    </div>
                  )}
                  {items.map(renderCard)}
                  {col.id === "todo" && canEdit && (
                    <button className="btn ghost" style={{ width: "100%" }} onClick={() => openNew("todo")}>+ 추가</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === "list" && (
        <table className="tbl">
          <thead>
            <tr><th>채널</th><th>업무명</th><th>유형</th><th>담당</th><th>마감</th><th>우선</th><th>상태</th></tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: "center", color: "#8F959C", padding: 20, fontSize: 12 }}>표시할 업무가 없습니다</td></tr>
            )}
            {visible.map((t) => {
              const d = dayDiff(t.due);
              const late = d !== null && d < 0 && t.status !== "done";
              return (
                <tr key={t.id} className="click" onClick={() => openTask(t)}>
                  <td><span className="chdot m"><b style={{ background: chColor(t.channel) }} />{t.channel}</span></td>
                  <td style={{ fontWeight: 600, letterSpacing: "-.015em" }}>{t.title}</td>
                  <td className="m">{t.type}</td>
                  <td className="m">{t.owner || "—"}</td>
                  <td className="m" style={late ? { color: "#B4342F", fontWeight: 600 } : {}}>{t.due || "—"}</td>
                  <td className="m">{PRIORITIES.find((p) => p.id === t.priority)?.label}</td>
                  <td className="m">{COLUMNS.find((c) => c.id === t.status)?.label}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {view === "archive" && (
        <>
          <div className="panel">
            <h3>완료 업무 보관함</h3>
            <p className="sub">
              보드에서 치운 업무입니다. 데이터는 그대로 남아 있고 되돌리면 다시 보드로 올라옵니다.
              영구 삭제는 관리자만 할 수 있고 복구되지 않습니다.
            </p>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
              {canEdit && (
                <button className="btn ghost" onClick={() => setConfirmBox({ kind: "archiveDone" })}>
                  완료 {live.filter((t) => t.status === "done").length}건 보관하기
                </button>
              )}
              {isAdmin && archived.length > 0 && (
                <button className="btn warn" onClick={() => setConfirmBox({ kind: "purge" })}>보관함 영구 삭제</button>
              )}
            </div>
          </div>
          <table className="tbl">
            <thead><tr><th>채널</th><th>업무명</th><th>담당</th><th>완료</th><th></th></tr></thead>
            <tbody>
              {archived.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: "center", color: "#8F959C", padding: 20, fontSize: 12 }}>보관된 업무가 없습니다</td></tr>
              )}
              {archived.slice().sort((a, b) => (b.doneAt || 0) - (a.doneAt || 0)).map((t) => (
                <tr key={t.id}>
                  <td><span className="chdot m"><b style={{ background: chColor(t.channel) }} />{t.channel}</span></td>
                  <td style={{ fontWeight: 600, color: "#565C64" }}>{t.title}</td>
                  <td className="m">{t.owner || "—"}</td>
                  <td className="m">{t.doneAt ? fmtTs(t.doneAt) : "—"}</td>
                  <td style={{ textAlign: "right" }}>
                    {canEdit && <button className="btn ghost" onClick={() => setArchivedFlag(t, false)}>되돌리기</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {view === "log" && (
        <div>
          <div className="panel">
            <h3>변경 이력</h3>
            <p className="sub">누가 언제 무엇을 바꿨는지 최근 {LOG_CAP}건까지 남습니다. 기록만 하고 되돌리지는 않습니다.</p>
          </div>
          {(data.log || []).length === 0 && <div className="empty">기록이 없습니다</div>}
          {(data.log || []).map((e) => (
            <div key={e.id} className="logrow">
              <span className="t">{fmtTs(e.ts)}</span>
              <span className="w">{e.who}</span>
              <span>
                <b style={{ fontWeight: 600 }}>{e.action}</b>
                {e.taskTitle && <span style={{ color: "#565C64" }}> · {e.taskTitle}</span>}
                {e.detail && <span className="mono" style={{ fontSize: 10.5, color: "#8F959C" }}> — {e.detail}</span>}
              </span>
            </div>
          ))}
        </div>
      )}

      {view === "team" && (
        <>
          <div className="panel">
            <h3>팀원과 권한</h3>
            <p className="sub">
              관리자는 삭제·영구삭제·채널관리·권한변경까지, 멤버는 업무 생성과 수정, 뷰어는 읽기와 댓글만 가능합니다.
              실수를 막기 위한 운영 규칙이지 보안 잠금이 아닙니다. 주소를 아는 사람은 데이터를 볼 수 있습니다.
            </p>
            {data.members.length === 0 && <div className="empty">아직 등록된 팀원이 없습니다</div>}
            {data.members.map((m) => (
              <div key={m.name} className="mrow">
                <span style={{ fontWeight: 600, fontSize: 13, minWidth: 90 }}>
                  {m.name}
                  {m.name === me && <span className="mono" style={{ fontSize: 10, color: "#8F959C" }}> (나)</span>}
                </span>
                <select
                  className="sel" value={m.role} disabled={!isAdmin}
                  onChange={(e) => {
                    const role = e.target.value;
                    commit(
                      (d) => ({ ...d, members: d.members.map((x) => (x.name === m.name ? { ...x, role, updatedAt: Date.now() } : x)) }),
                      [mkLog("권한 변경", null, `${m.name} → ${ROLES.find((r) => r.id === role).label}`)]
                    );
                  }}
                >
                  {ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                </select>
                <span className="spacer" />
                {isAdmin && m.name !== me && (
                  <button className="del" onClick={() =>
                    commit((d) => ({ ...d, members: d.members.filter((x) => x.name !== m.name) }), [mkLog("팀원 삭제", null, m.name)])
                  }>내보내기</button>
                )}
              </div>
            ))}
          </div>

          <div className="panel">
            <h3>판매 채널</h3>
            <p className="sub">채널이 늘면 여기서 추가하세요. 색은 카드 왼쪽 띠와 분포 그래프에 그대로 쓰입니다.</p>
            {data.channels.map((c, i) => (
              <div key={c.id} className="mrow">
                <input
                  type="color" value={c.color} disabled={!isAdmin}
                  style={{ width: 34, height: 26, padding: 0, border: "1px solid #C4C9C1", background: "none" }}
                  onChange={(e) => {
                    const color = e.target.value;
                    commit((d) => ({
                      ...d,
                      channels: d.channels.map((x, j) => (j === i ? { ...x, color } : x)),
                      channelsUpdatedAt: Date.now(),
                    }), []);
                  }}
                />
                <span style={{ fontSize: 13, fontWeight: 600 }}>{c.id}</span>
                <span className="mono" style={{ fontSize: 11, color: "#8F959C" }}>
                  {data.tasks.filter((t) => !t.deleted && t.channel === c.id).length}건
                </span>
                <span className="spacer" />
                {isAdmin && data.channels.length > 1 && (
                  <button className="del" onClick={() =>
                    commit(
                      (d) => ({ ...d, channels: d.channels.filter((x) => x.id !== c.id), channelsUpdatedAt: Date.now() }),
                      [mkLog("채널 삭제", null, c.id)]
                    )
                  }>삭제</button>
                )}
              </div>
            ))}
            {isAdmin && (
              <div className="addrow">
                <input
                  placeholder="채널명 (예: 무신사)" value={newChannel}
                  onChange={(e) => setNewChannel(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addChannel()}
                />
                <button onClick={addChannel}>추가</button>
              </div>
            )}
          </div>

          <div className="panel">
            <h3>백업</h3>
            <p className="sub">
              데이터는 서버에 계속 남지만, 실수로 지운 경우를 대비해 주기적으로 내려받아 두는 편이 안전합니다.
              JSON은 그대로 복구되고, CSV는 엑셀에서 바로 열립니다.
            </p>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
              <button className="btn ghost" onClick={exportJson}>JSON 내려받기</button>
              <button className="btn ghost" onClick={exportCsv}>CSV 내려받기</button>
              {isAdmin && <button className="btn ghost" onClick={() => importRef.current?.click()}>JSON 가져오기</button>}
              <input ref={importRef} type="file" accept=".json" style={{ display: "none" }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) importJson(f); e.target.value = ""; }} />
            </div>
          </div>
        </>
      )}

      <div className="note">
        이 보드는 주소를 가진 사람 누구나 열 수 있습니다. <b>계약 조건이나 개인정보는 올리지 마세요.</b><br />
        저장은 즉시 반영되고 {POLL_MS / 1000}초마다 팀원 변경분을 받아옵니다. 서로 다른 업무를 동시에 고쳐도 둘 다 남습니다.<br />
        첨부파일은 {fmtSize(MAX_FILE)} 이하만 올라갑니다. 시안·엑셀처럼 큰 파일은 드라이브 링크로 걸어주세요.
      </div>

      {askName && (
        <div className="mask">
          <div className="modal sm">
            <h2>이름을 알려주세요</h2>
            <p className="hint" style={{ lineHeight: 1.6, marginBottom: 14 }}>
              담당자, 댓글 작성자, 변경 이력에 이 이름이 남습니다. 이 브라우저에만 저장됩니다.
            </p>
            <div className="fld">
              <label>이름</label>
              <input autoFocus value={nameInput} onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveMe(nameInput)} placeholder="예) 김현민" />
            </div>
            <div className="mfoot">
              <span className="spacer" />
              {me && <button className="btn ghost" onClick={() => setAskName(false)}>취소</button>}
              <button className="btn" onClick={() => saveMe(nameInput)}>시작하기</button>
            </div>
          </div>
        </div>
      )}

      {confirmBox && (
        <div className="mask" onClick={(e) => e.target === e.currentTarget && setConfirmBox(null)}>
          <div className="modal sm">
            <h2>{confirmBox.kind === "purge" ? "영구 삭제할까요?" : "완료 업무를 보관할까요?"}</h2>
            <p style={{ fontSize: 12.5, color: "#565C64", lineHeight: 1.6 }}>
              {confirmBox.kind === "purge"
                ? `보관함의 ${archived.length}건이 완전히 사라집니다. 되돌릴 수 없습니다. 필요하면 먼저 백업을 내려받으세요.`
                : `완료 컬럼의 ${live.filter((t) => t.status === "done").length}건이 보관함으로 이동합니다. 언제든 되돌릴 수 있습니다.`}
            </p>
            <div className="mfoot">
              <span className="spacer" />
              <button className="btn ghost" onClick={() => setConfirmBox(null)}>취소</button>
              <button className={confirmBox.kind === "purge" ? "btn warn" : "btn"}
                onClick={() => (confirmBox.kind === "purge" ? purgeArchive() : archiveDone())}>
                {confirmBox.kind === "purge" ? "영구 삭제" : "보관하기"}
              </button>
            </div>
          </div>
        </div>
      )}

      {draft && (
        <div className="mask" onClick={(e) => e.target === e.currentTarget && setDraft(null)}>
          <div className="modal">
            <h2>{draft._new ? "새 업무" : "업무 상세"}</h2>

            <div className="fld">
              <label>업무명</label>
              <input autoFocus disabled={!canEdit} value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="예) 쿠팡 락토컷 상세페이지 개편" />
            </div>

            <div className="r2">
              <div className="fld">
                <label>채널</label>
                <select disabled={!canEdit} value={draft.channel} onChange={(e) => setDraft({ ...draft, channel: e.target.value })}>
                  {data.channels.map((c) => <option key={c.id} value={c.id}>{c.id}</option>)}
                </select>
              </div>
              <div className="fld">
                <label>업무 유형</label>
                <select disabled={!canEdit} value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value })}>
                  {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div className="r2">
              <div className="fld">
                <label>담당자</label>
                <input list="wb-owners" disabled={!canEdit} value={draft.owner}
                  onChange={(e) => setDraft({ ...draft, owner: e.target.value })} placeholder="이름" />
                <datalist id="wb-owners">
                  {[...new Set([...owners, ...data.members.map((m) => m.name)])].map((o) => <option key={o} value={o} />)}
                </datalist>
              </div>
              <div className="fld">
                <label>마감일</label>
                <input type="date" disabled={!canEdit} value={draft.due}
                  onChange={(e) => setDraft({ ...draft, due: e.target.value })} />
              </div>
            </div>

            <div className="r3">
              <div className="fld">
                <label>우선순위</label>
                <select disabled={!canEdit} value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value })}>
                  {PRIORITIES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
              </div>
              <div className="fld">
                <label>상태</label>
                <select disabled={!canEdit} value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })}>
                  {COLUMNS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
              <div className="fld">
                <label>반복</label>
                <select disabled={!canEdit} value={draft.repeat} onChange={(e) => setDraft({ ...draft, repeat: e.target.value })}>
                  {REPEATS.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                </select>
              </div>
            </div>

            <div className="fld">
              <label>메모</label>
              <textarea disabled={!canEdit} value={draft.memo}
                onChange={(e) => setDraft({ ...draft, memo: e.target.value })}
                placeholder="진행 상황, 공급사 회신, 참고 수치" />
            </div>

            <div className="sect">
              <h4>태그</h4>
              <div className="ctags">
                {(draft.tags || []).map((g) => (
                  <span key={g} className="tag">
                    {g}
                    {canEdit && (
                      <button className="x" style={{ fontSize: 11, marginLeft: 3 }}
                        onClick={() => setDraft({ ...draft, tags: draft.tags.filter((x) => x !== g) })}>×</button>
                    )}
                  </span>
                ))}
                {!(draft.tags || []).length && <span className="hint">없음</span>}
              </div>
              {canEdit && (
                <div className="addrow">
                  <input placeholder="태그 입력 후 Enter (예: 8월프로모션)" onKeyDown={(e) => {
                    const v = e.target.value.trim();
                    if (e.key === "Enter" && v && !(draft.tags || []).includes(v)) {
                      setDraft({ ...draft, tags: [...(draft.tags || []), v] });
                      e.target.value = "";
                    }
                  }} />
                </div>
              )}
            </div>

            <div className="sect">
              <h4>
                세부 단계
                {(draft.checklist || []).length > 0 && ` (${draft.checklist.filter((c) => c.done).length}/${draft.checklist.length})`}
              </h4>
              {(draft.checklist || []).map((c) => (
                <div key={c.id} className="item">
                  <input type="checkbox" checked={c.done} disabled={!canEdit} style={{ width: "auto" }}
                    onChange={() => setDraft({ ...draft, checklist: draft.checklist.map((x) => (x.id === c.id ? { ...x, done: !x.done } : x)) })} />
                  <span style={{ flex: 1, textDecoration: c.done ? "line-through" : "none", color: c.done ? "#8F959C" : "inherit" }}>{c.text}</span>
                  {canEdit && <button className="x" onClick={() => setDraft({ ...draft, checklist: draft.checklist.filter((x) => x.id !== c.id) })}>×</button>}
                </div>
              ))}
              {!(draft.checklist || []).length && <span className="hint">없음</span>}
              {canEdit && (
                <div className="addrow">
                  <input placeholder="단계 입력 후 Enter" onKeyDown={(e) => {
                    const v = e.target.value.trim();
                    if (e.key === "Enter" && v) {
                      setDraft({ ...draft, checklist: [...(draft.checklist || []), { id: uid(), text: v, done: false }] });
                      e.target.value = "";
                    }
                  }} />
                </div>
              )}
            </div>

            <div className="sect">
              <h4>첨부</h4>
              {(draft.links || []).map((l) => (
                <div key={l.id} className="item">
                  <span style={{ color: "#8F959C" }}>🔗</span>
                  <a href={l.url} target="_blank" rel="noreferrer" style={{ flex: 1 }}>{l.label || l.url}</a>
                  {canEdit && <button className="x" onClick={() => setDraft({ ...draft, links: draft.links.filter((x) => x.id !== l.id) })}>×</button>}
                </div>
              ))}
              {(draft.files || []).map((f) => (
                <div key={f.id} className="item">
                  <span style={{ color: "#8F959C" }}>📄</span>
                  <button className="btn ghost" style={{ padding: "3px 8px", fontSize: 11.5 }} onClick={() => downloadFile(f)}>{f.name}</button>
                  <span className="mono" style={{ fontSize: 10.5, color: "#8F959C" }}>{fmtSize(f.size)}</span>
                  <span className="spacer" />
                  {canEdit && <button className="x" onClick={() => setDraft({ ...draft, files: draft.files.filter((x) => x.id !== f.id) })}>×</button>}
                </div>
              ))}
              {!(draft.links || []).length && !(draft.files || []).length && <span className="hint">없음</span>}
              {canEdit && (
                <>
                  <div className="addrow">
                    <input placeholder="링크 붙여넣고 Enter (드라이브·시트 주소)" onKeyDown={(e) => {
                      const v = e.target.value.trim();
                      if (e.key === "Enter" && v) {
                        setDraft({ ...draft, links: [...(draft.links || []), { id: uid(), url: v, label: "" }] });
                        e.target.value = "";
                      }
                    }} />
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <label className="btn ghost" style={{ display: "inline-block", padding: "5px 11px", fontSize: 11.5 }}>
                      파일 올리기 ({fmtSize(MAX_FILE)} 이하)
                      <input type="file" style={{ display: "none" }}
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) attachFile(f); e.target.value = ""; }} />
                    </label>
                  </div>
                </>
              )}
            </div>

            <div className="sect">
              <h4>댓글{(draft.comments || []).length > 0 && ` (${draft.comments.length})`}</h4>
              {(draft.comments || []).map((c) => (
                <div key={c.id} className="cmt">
                  <div className="h"><b>{c.author}</b> · {fmtTs(c.ts)}</div>
                  <p>{c.text}</p>
                </div>
              ))}
              {!(draft.comments || []).length && <span className="hint">없음</span>}
              <div className="addrow">
                <input placeholder="댓글 입력 후 Enter" onKeyDown={(e) => {
                  const v = e.target.value.trim();
                  if (e.key === "Enter" && v) {
                    setDraft({ ...draft, comments: [...(draft.comments || []), { id: uid(), author: me || "익명", text: v, ts: Date.now() }] });
                    e.target.value = "";
                  }
                }} />
              </div>
            </div>

            {!draft._new && (
              <div className="sect">
                <h4>이 업무의 이력</h4>
                {(data.log || []).filter((e) => e.taskId === draft.id).slice(0, 6).map((e) => (
                  <div key={e.id} className="item" style={{ fontSize: 11.5, color: "#565C64" }}>
                    <span className="mono" style={{ fontSize: 10.5, color: "#8F959C", minWidth: 96 }}>{fmtTs(e.ts)}</span>
                    <span className="mono" style={{ fontSize: 10.5, minWidth: 54 }}>{e.who}</span>
                    <span>{e.action}{e.detail && ` · ${e.detail}`}</span>
                  </div>
                ))}
                {!(data.log || []).some((e) => e.taskId === draft.id) && <span className="hint">기록 없음</span>}
                <div className="mono" style={{ fontSize: 10.5, color: "#8F959C", marginTop: 8 }}>
                  등록 {draft.createdBy || "—"} · {draft.createdAt ? fmtTs(draft.createdAt) : "—"}
                  {draft.updatedBy && ` / 최근 수정 ${draft.updatedBy}`}
                </div>
              </div>
            )}

            <div className="mfoot">
              {!draft._new && isAdmin && <button className="del" onClick={() => removeTask(draft)}>삭제</button>}
              {!draft._new && canEdit && !draft.archived && (
                <button className="btn ghost" onClick={() => { setArchivedFlag(draft, true); setDraft(null); }}>보관</button>
              )}
              <span className="spacer" />
              <button className="btn ghost" onClick={() => setDraft(null)}>닫기</button>
              <button className="btn" onClick={saveDraft} disabled={!draft.title.trim()}>저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}