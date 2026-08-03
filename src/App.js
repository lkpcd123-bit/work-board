import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { getAI, getGenerativeModel, GoogleAIBackend, Schema } from "firebase/ai";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

const firebaseConfig = {
  apiKey: "AIzaSyDvdroHh6ppTDpwC1LdFadgSaKRcz6zudE",
  authDomain: "shakebaby-work-board.firebaseapp.com",
  projectId: "shakebaby-work-board",
  storageBucket: "shakebaby-work-board.firebasestorage.app",
  messagingSenderId: "96467267724",
  appId: "1:96467267724:web:1cb536992f27428ad84ba9"
};
const fbApp = initializeApp(firebaseConfig);
const db = getFirestore(fbApp);
// eslint-disable-next-line no-restricted-globals
self.FIREBASE_APPCHECK_DEBUG_TOKEN = "4D46EC1A-A812-4798-B8B1-15F2A3B6F3C1";
initializeAppCheck(fbApp, {
  provider: new ReCaptchaV3Provider("6LfQLWktAAAAAJA3lO4WTSiZIi536uDGIQjVHmHo"),
  isTokenAutoRefreshEnabled: true,
});

/* ?€?€ AI ë¹„ì„œ: Gemini ?¨ìˆ˜ ? ì–¸ (ì¡°íšŒ ?„ìš©) ?€?€ */
const aiTools = [{
  functionDeclarations: [
    {
      name: "searchTasks",
      description: "?…ë¬´ ë³´ë“œ???…ë¬´ ëª©ë¡??ì¡°ê±´?¼ë¡œ ê²€?‰í•©?ˆë‹¤. ë§ˆê°?? ?´ë‹¹?? ì±„ë„, ?íƒœë¡?ì°¾ì„ ???¬ìš©?©ë‹ˆ??",
      parameters: Schema.object({
        properties: {
          status: Schema.string({ description: "?íƒœ ?„í„°: todo, doing, review, issuecol, done ì¤??˜ë‚˜. ?ëµ?˜ë©´ ?„ì²´." }),
          owner: Schema.string({ description: "?´ë‹¹???´ë¦„. ?ëµ?˜ë©´ ?„ì²´ ?´ë‹¹??" }),
          channel: Schema.string({ description: "ì±„ë„ëª? ?ëµ?˜ë©´ ?„ì²´ ì±„ë„." }),
          board: Schema.string({ description: "ë³´ë“œ ?´ë¦„: ê³µìš©, ê¹€?„ë? ì¤??˜ë‚˜. ?ëµ?˜ë©´ ?„ì²´ ë³´ë“œ." }),
          onlyOverdue: Schema.boolean({ description: "trueë©?ë§ˆê°??ì§€???…ë¬´ë§?" }),
          onlyToday: Schema.boolean({ description: "trueë©??¤ëŠ˜ ë§ˆê°???…ë¬´ë§?" }),
        },
        optionalProperties: ["status", "owner", "channel", "board", "onlyOverdue", "onlyToday"],
      }),
    },
    {
      name: "searchRoutines",
      description: "ë°˜ë³µ ?…ë¬´ ëª©ë¡ê³??¤ëŠ˜ ì²´í¬ ?¬ë?, ?°ì† ê¸°ë¡??ì¡°íšŒ?©ë‹ˆ??",
      parameters: Schema.object({
        properties: {
          owner: Schema.string({ description: "?´ë‹¹???´ë¦„. ?ëµ?˜ë©´ ?„ì²´." }),
          onlyUnchecked: Schema.boolean({ description: "trueë©??¤ëŠ˜ ?„ì§ ì²´í¬ ????ë°˜ë³µ?…ë¬´ë§?" }),
        },
        optionalProperties: ["owner", "onlyUnchecked"],
      }),
    },
    {
      name: "searchCheckitems",
      description: "ì²´í¬ë¦¬ìŠ¤??ì²´í¬ë¦¬ìŠ¤???‰ì‚¬ ?ë³µ/?í’ˆ ?ë³µ) ??ª©??ì¡°íšŒ?©ë‹ˆ??",
      parameters: Schema.object({
        properties: {
          tab: Schema.string({ description: "checklist, event, product ì¤??˜ë‚˜. ?ëµ?˜ë©´ ?„ì²´ ??" }),
          onlyPending: Schema.boolean({ description: "trueë©??„ì§ ?„ë£Œ ??????ª©ë§?" }),
          onlyOverdue: Schema.boolean({ description: "trueë©?ë§ˆê°(ì¢…ë£Œ????ì§€??ë¯¸ì™„ë£???ª©ë§?" }),
        },
        optionalProperties: ["tab", "onlyPending", "onlyOverdue"],
      }),
    },
    {
      name: "searchIssues",
      description: "?…ë¬´Â·ë°˜ë³µ?…ë¬´???±ë¡???´ìŠˆë¥?ì¡°íšŒ?©ë‹ˆ??",
      parameters: Schema.object({
        properties: {
          onlyUnresolved: Schema.boolean({ description: "trueë©?ë¯¸í•´ê²??´ìŠˆë§?" }),
        },
        optionalProperties: ["onlyUnresolved"],
      }),
    },
    {
      name: "getTaskDetail",
      description: "?¹ì • ?…ë¬´ ?˜ë‚˜ë¥??œëª© ?¤ì›Œ?œë¡œ ì°¾ì•„ ë©”ëª¨, ?ˆìŠ¤? ë¦¬(ì§„í–‰ ê¸°ë¡ ?„ì²´), ?¸ë? ?¨ê³„(ì²´í¬ë¦¬ìŠ¤??, ?´ìŠˆê¹Œì? ?ì„¸ ?•ë³´ë¥??„ë? ì¡°íšŒ?©ë‹ˆ?? ?…ë¬´??ì§„í–‰ ?í™©Â·?´ìš©Â·?°ë½ ê²°ê³¼ ??êµ¬ì²´?ì¸ ì§ˆë¬¸?ëŠ” ???¨ìˆ˜ë¥??¬ìš©?˜ì„¸??",
      parameters: Schema.object({
        properties: {
          titleKeyword: Schema.string({ description: "ì°¾ì„ ?…ë¬´ ?œëª©???¬í•¨???¤ì›Œ?? ?? '?°ë‹ˆ?¤ì‹?? ?ëŠ” '?ë ˆ?´ì…˜ ??" }),
        },
        optionalProperties: [],
      }),
    },
  ],
}];
const BOARD_REF = () => doc(db, "board", "main");
const ME_KEY = "wb-me";
const LOG_CAP = 400;

const COLUMNS = [
  { id: "todo", label: "?€ê¸? },
  { id: "doing", label: "ì§„í–‰ì¤? },
  { id: "review", label: "ê²€? Â·ì»¨?? },
  { id: "issuecol", label: "?´ìŠˆ" },
  { id: "done", label: "?„ë£Œ" },
];
const BOARDS = ["ê³µìš©","ê¹€?„ë?"];
const CKTABS = [{id:"checklist",label:"ì²´í¬ë¦¬ìŠ¤??},{id:"event",label:"?‰ì‚¬ ?ë³µ"},{id:"product",label:"?í’ˆ ?ë³µ"}];
const DEFAULT_CHANNELS = [
  { id: "ê³µí†µ", color: "#7A8189" },
  { id: "?ì‚¬ëª?, color: "#3355C9" },
  { id: "ì¿ íŒ¡", color: "#D14A4A" },
  { id: "?¤ì´ë²„ì‡¼??, color: "#2E9E5B" },
  { id: "?¬ë¦¬ë¸Œì˜", color: "#87A82B" },
  { id: "ë§ˆì¼“ì»¬ë¦¬", color: "#6B3FA0" },
  { id: "11ë²ˆê?", color: "#DE7A1C" },
];
const TYPES = ["?í’ˆê¸°íš","ì±„ë„?´ì˜","ë§ˆì???,"?ì„¸?˜ì´ì§€","ê³µê¸‰??,"?¸í”Œë£¨ì–¸??,"?°ì´?°ë¶„??,"ê¸°í?"];
const PRIORITIES = [{ id:"high",label:"?’ìŒ",rank:0 },{ id:"mid",label:"ë³´í†µ",rank:1 },{ id:"low",label:"??Œ",rank:2 }];
const REPEATS = [{ id:"none",label:"ë°˜ë³µ ?†ìŒ" },{ id:"daily",label:"ë§¤ì¼" },{ id:"weekly",label:"ë§¤ì£¼" },{ id:"biweekly",label:"ê²©ì£¼" },{ id:"monthly",label:"ë§¤ì›”" }];
const ROLES = [{ id:"admin",label:"ê´€ë¦¬ì" },{ id:"member",label:"ë©¤ë²„" },{ id:"viewer",label:"ë·°ì–´" }];

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,7);
const todayStr = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
const dayDiff = (d) => !d ? null : Math.round((new Date(d+"T00:00:00") - new Date(todayStr()+"T00:00:00")) / 86400000);
const fmtTs = (ts) => { const d=new Date(ts),p=(n)=>String(n).padStart(2,"0"); return `${String(d.getFullYear()).slice(2)}.${p(d.getMonth()+1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`; };
const nextDue = (due, repeat) => { const b=due?new Date(due+"T00:00:00"):new Date(); if(repeat==="daily")b.setDate(b.getDate()+1); else if(repeat==="weekly")b.setDate(b.getDate()+7); else if(repeat==="biweekly")b.setDate(b.getDate()+14); else if(repeat==="monthly")b.setMonth(b.getMonth()+1); else return due; return b.toISOString().slice(0,10); };
const addDays=(ds,n)=>{const d=new Date(ds+"T00:00:00");d.setDate(d.getDate()+n);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;};
const streakOf=(ck,from)=>{let n=0,cur=from;while(ck&&ck[cur]){n++;cur=addDays(cur,-1);}return n;};
const emptyData = () => ({ tasks:[],routines:[],checkitems:[],members:[],channels:DEFAULT_CHANNELS,channelsUpdatedAt:0,types:TYPES,typesUpdatedAt:0,monthlies:[],routineCats:["?¤ì „","?¤í›„"],routineCatsUpdatedAt:0,rItems:[],colLabels:{},colLabelsUpdatedAt:0,memoItems:[],log:[],updatedAt:0 });
function mergeData(r,l) {
  r=r||emptyData(); l=l||emptyData();
  const map=new Map(); [...(r.tasks||[]),...(l.tasks||[])].forEach(t=>{const p=map.get(t.id);if(!p||(t.updatedAt||0)>(p.updatedAt||0))map.set(t.id,t);});
  const rm=new Map(); [...(r.routines||[]),...(l.routines||[])].forEach(t=>{const p=rm.get(t.id);if(!p||(t.updatedAt||0)>(p.updatedAt||0))rm.set(t.id,t);});
  const cm=new Map(); [...(r.checkitems||[]),...(l.checkitems||[])].forEach(t=>{const p=cm.get(t.id);if(!p||(t.updatedAt||0)>(p.updatedAt||0))cm.set(t.id,t);});
  const mm2=new Map(); [...(r.monthlies||[]),...(l.monthlies||[])].forEach(t=>{const p=mm2.get(t.id);if(!p||(t.updatedAt||0)>(p.updatedAt||0))mm2.set(t.id,t);});
  const ri=new Map(); [...(r.rItems||[]),...(l.rItems||[])].forEach(t=>{const p=ri.get(t.id);if(!p||(t.updatedAt||0)>(p.updatedAt||0))ri.set(t.id,t);});
  const mi=new Map(); [...(r.memoItems||[]),...(l.memoItems||[])].forEach(t=>{const p=mi.get(t.id);if(!p||(t.updatedAt||0)>(p.updatedAt||0))mi.set(t.id,t);});
  const lm=new Map(); [...(r.log||[]),...(l.log||[])].forEach(e=>lm.set(e.id,e));
  const mm=new Map(); [...(r.members||[]),...(l.members||[])].forEach(m=>{const p=mm.get(m.name);if(!p||(m.updatedAt||0)>=(p.updatedAt||0))mm.set(m.name,m);});
  const uc=(l.channelsUpdatedAt||0)>=(r.channelsUpdatedAt||0);
  return { tasks:[...map.values()],routines:[...rm.values()],checkitems:[...cm.values()],monthlies:[...mm2.values()],rItems:[...ri.values()],memoItems:[...mi.values()],members:[...mm.values()],channels:(uc?l.channels:r.channels)||DEFAULT_CHANNELS,channelsUpdatedAt:Math.max(l.channelsUpdatedAt||0,r.channelsUpdatedAt||0),types:((l.typesUpdatedAt||0)>=(r.typesUpdatedAt||0)?l.types:r.types)||TYPES,typesUpdatedAt:Math.max(l.typesUpdatedAt||0,r.typesUpdatedAt||0),
    routineCats:((l.routineCatsUpdatedAt||0)>=(r.routineCatsUpdatedAt||0)?l.routineCats:r.routineCats)||["?¤ì „","?¤í›„"],routineCatsUpdatedAt:Math.max(l.routineCatsUpdatedAt||0,r.routineCatsUpdatedAt||0),
    colLabels:((l.colLabelsUpdatedAt||0)>=(r.colLabelsUpdatedAt||0)?l.colLabels:r.colLabels)||{},colLabelsUpdatedAt:Math.max(l.colLabelsUpdatedAt||0,r.colLabelsUpdatedAt||0),
    log:[...lm.values()].sort((a,b)=>b.ts-a.ts).slice(0,LOG_CAP),updatedAt:Date.now() };
}

const CSS = `
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css');

.wb{
  --grad:#F4F5F7;
  --col:#EBECF0; --card:#FFFFFF;
  --ink:#172B4D; --ink2:#44546F; --ink3:#626F86;
  --line:#DFE1E6; --line2:#C1C7D0;
  --pri:#0C66E4; --pri-d:#0055CC;
  --ok:#1F845A; --danger:#C9372C; --warn:#B65C02;
  --sans:'Pretendard',-apple-system,BlinkMacSystemFont,system-ui,sans-serif;
  --mono:ui-monospace,SFMono-Regular,Menlo,monospace;
  --r:10px; --sh:0 1px 1px rgba(9,30,66,.25),0 0 1px rgba(9,30,66,.13);
  --sh2:0 8px 16px -4px rgba(9,30,66,.25),0 0 1px rgba(9,30,66,.31);
  background:var(--grad); background-attachment:fixed;
  color:var(--ink); font-family:var(--sans); font-size:15px;
  min-height:100vh; padding:0 0 60px; box-sizing:border-box;
}
.wb *,.wb *::before,.wb *::after{box-sizing:border-box;}
.wb button{font-family:inherit;cursor:pointer;border:none;background:none;}
.wb input,.wb select,.wb textarea{font-family:inherit;}
.wb p,.wb h1,.wb h2,.wb h3,.wb h4{margin:0;}
.spacer{flex:1;}
.wb ::selection{background:#B3D4FF;}

/* ?€?€ ?ë‹¨ ë°??€?€ */
.topbar{background:#fff;border-bottom:1px solid #DFE1E6;padding:12px 20px;display:flex;align-items:center;gap:14px;flex-wrap:wrap;}
.brand{font-size:19px;font-weight:800;color:var(--ink);letter-spacing:-.02em;display:flex;align-items:center;gap:8px;}
.brand .logo{width:26px;height:26px;border-radius:6px;background:#fff;color:#6E5AE6;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:900;}
.who{display:inline-flex;align-items:center;gap:8px;background:#EBECF0;color:var(--ink2);padding:6px 12px;border-radius:20px;font-size:13.5px;font-weight:600;}
.who:hover{background:#DFE1E6;}
.who .av{width:24px;height:24px;border-radius:50%;background:#fff;color:#6E5AE6;font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center;}
.who .role{font-size:11px;opacity:.85;font-weight:500;}
.save{font-size:12.5px;color:var(--ink3);display:inline-flex;align-items:center;gap:6px;}
.dot{width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,.5);}
.dot.on{background:#57D9A3;} .dot.err{background:#FF8F73;}
.ghostw{background:#EBECF0;color:var(--ink2);padding:6px 12px;border-radius:6px;font-size:13px;font-weight:600;}
.ghostw:hover{background:#DFE1E6;}

/* ?€?€ ???€?€ */
.tabs{display:flex;gap:4px;padding:12px 20px 0;flex-wrap:wrap;}
.tab{padding:8px 16px;border-radius:8px 8px 0 0;font-size:14px;font-weight:600;color:var(--ink3);}
.tab:hover{background:#DFE1E6;color:var(--ink);}
.tab.sel{background:#fff;color:var(--ink);}
.tab em{font-style:normal;font-size:12px;margin-left:6px;background:#DFE1E6;padding:1px 7px;border-radius:10px;}
.tab.sel em{background:#DFE1E6;color:var(--ink2);}

.page{background:#F7F8F9;border-radius:0 12px 12px 12px;margin:0 16px;padding:18px;min-height:60vh;}

/* ?€?€ ì§€???€?€ */
.metrics{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:14px;}
.metric{background:var(--card);border-radius:var(--r);box-shadow:var(--sh);padding:12px 14px;text-align:left;}
.metric.cl:hover{box-shadow:var(--sh2);transform:translateY(-1px);}
.metric .k{font-size:12px;font-weight:600;color:var(--ink3);display:block;margin-bottom:5px;}
.metric .v{font-size:26px;font-weight:800;line-height:1;letter-spacing:-.02em;}
.metric .v.al{color:var(--danger);} .metric .v.wa{color:var(--warn);}

.strip{display:flex;height:10px;border-radius:6px;overflow:hidden;background:#DFE1E6;margin-bottom:9px;}
.strip i{display:block;height:100%;}
.legend{display:flex;flex-wrap:wrap;gap:8px 14px;margin-bottom:16px;}
.leg{display:inline-flex;align-items:center;gap:6px;font-size:12.5px;color:var(--ink2);font-weight:500;}
.leg b{width:9px;height:9px;border-radius:3px;}

/* ?€?€ ?´ë°” ?€?€ */
.tools{display:flex;gap:8px;flex-wrap:wrap;align-items:center;padding-bottom:14px;margin-bottom:16px;border-bottom:2px solid var(--line);}
.inp,.sel{background:var(--card);border:1px solid var(--line2);color:var(--ink);padding:7px 11px;font-size:14px;border-radius:6px;}
.inp:focus,.sel:focus{outline:2px solid var(--pri);outline-offset:-1px;border-color:var(--pri);}
.inp::placeholder{color:var(--ink3);}
.chip{background:var(--card);border:1px solid var(--line2);color:var(--ink2);padding:6px 12px;font-size:13.5px;font-weight:600;border-radius:20px;display:inline-flex;align-items:center;gap:7px;}
.chip:hover{border-color:var(--ink3);}
.chip b{width:9px;height:9px;border-radius:3px;}
.chip.sel{background:var(--pri);color:#fff;border-color:var(--pri);}
.chip.tog.sel{background:var(--ok);border-color:var(--ok);}
.chip.back{background:var(--ink2);color:#fff;border-color:var(--ink2);}
.btn{background:#0C66E4;color:#fff;padding:8px 16px;font-size:14px;font-weight:700;border-radius:6px;}
.btn:hover{background:#0055CC;}
.btn:disabled{opacity:.4;cursor:default;}
.btn.ghost{background:#EBECF0;color:var(--ink2);font-weight:600;}
.btn.ghost:hover{background:#DFE1E6;}
.btn.warn{background:var(--danger);}

/* ?€?€ ë³´ë“œ ?€?€ */
.board{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;align-items:start;}
.colwrap{background:var(--col);border-radius:12px;padding:10px;}
.colhead{display:flex;align-items:center;justify-content:space-between;padding:2px 6px 10px;}
.colhead span{font-size:14.5px;font-weight:700;letter-spacing:-.01em;}
.colhead em{font-style:normal;font-size:12.5px;color:var(--ink3);background:#DFE1E6;padding:1px 8px;border-radius:10px;font-weight:600;}
.colbody{display:flex;flex-direction:column;gap:8px;min-height:60px;}
.colbody.over{background:#D0D4DB;border-radius:8px;outline:2px dashed var(--pri);}

/* ?€?€ ì¹´ë“œ ?€?€ */
.card{position:relative;background:var(--card);border-radius:8px;box-shadow:var(--sh);padding:9px 11px 10px;cursor:pointer;}
.card:hover{box-shadow:var(--sh2);}
.card.late{box-shadow:0 0 0 2px #FF8F73,var(--sh);}
.card.drag{opacity:.4;transform:rotate(2deg);}
.clabel{height:8px;border-radius:4px;margin-bottom:8px;}
.cmeta{display:flex;align-items:center;gap:6px;margin-bottom:6px;font-size:11.5px;color:var(--ink3);flex-wrap:wrap;font-weight:600;}
.cmeta .ch{color:var(--ch);font-weight:700;}
.ctitle{font-size:16px;font-weight:700;line-height:1.45;margin-bottom:9px;word-break:keep-all;color:var(--ink);}
.card.done .ctitle{color:var(--ink3);text-decoration:line-through;}
.ctags{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:8px;}
.tag{font-size:11.5px;font-weight:600;background:#E9F2FF;color:#0055CC;padding:2px 8px;border-radius:4px;display:inline-flex;align-items:center;}
.cbar{height:6px;background:#DFE1E6;border-radius:3px;margin-bottom:8px;overflow:hidden;}
.cbar i{display:block;height:100%;background:var(--ok);border-radius:3px;}
.cfoot{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:12px;color:var(--ink2);font-weight:500;}
.avm{display:none;}
.ownerchip{background:#E9F2FF;color:#0055CC;font-size:12px;font-weight:700;padding:3px 10px;border-radius:10px;white-space:nowrap;}
.ownerchip.me{background:#F1E9FF;color:#6B3FA0;}
.due{display:inline-flex;align-items:center;gap:4px;padding:2px 7px;border-radius:4px;background:#EBECF0;font-size:11.5px;font-weight:600;}
.due.late{background:#FFECEB;color:var(--danger);}
.due.soon{background:#FFF7D6;color:var(--warn);}
.pri{font-size:11px;font-weight:700;padding:2px 7px;border-radius:4px;background:#EBECF0;color:var(--ink2);}
.pri.high{background:#FFECEB;color:var(--danger);}
.icons{display:inline-flex;gap:8px;color:var(--ink3);font-size:11.5px;font-weight:600;}
.empty{border:2px dashed var(--line2);border-radius:8px;padding:16px 10px;text-align:center;font-size:13px;color:var(--ink3);font-weight:500;}
.addbtn{width:100%;background:transparent;color:var(--ink2);padding:8px;font-size:13.5px;font-weight:600;border-radius:6px;text-align:left;}
.addbtn:hover{background:#DFE1E6;}

/* ?€?€ ???€?€ */
.tbl{width:100%;border-collapse:separate;border-spacing:0;background:var(--card);border-radius:var(--r);box-shadow:var(--sh);font-size:14px;overflow:hidden;}
.tbl th{font-size:12px;font-weight:700;color:var(--ink3);text-align:left;padding:11px 14px;background:#F1F2F4;border-bottom:1px solid var(--line);white-space:nowrap;}
.tbl td{padding:11px 14px;border-bottom:1px solid var(--line);vertical-align:middle;}
.tbl tr:last-child td{border-bottom:none;}
.tbl tr.cl:hover{background:#F7F8F9;cursor:pointer;}
.m{font-size:13px;color:var(--ink2);white-space:nowrap;font-weight:500;}
.chdot{display:inline-flex;align-items:center;gap:7px;}
.chdot b{width:10px;height:10px;border-radius:3px;}

/* ?€?€ ?´ë ¥ ?€?€ */
.logrow{display:grid;grid-template-columns:130px 90px 1fr;gap:12px;padding:11px 14px;background:var(--card);border-bottom:1px solid var(--line);font-size:14px;align-items:baseline;}
.logrow:first-of-type{border-radius:var(--r) var(--r) 0 0;}
.logrow .t{font-size:12px;color:var(--ink3);font-weight:500;}
.logrow .w{font-size:12.5px;color:var(--ink2);font-weight:700;}

/* ?€?€ ?¨ë„ ?€?€ */
.panel{background:var(--card);border-radius:var(--r);box-shadow:var(--sh);padding:20px;margin-bottom:14px;}
.panel h3{font-size:16px;font-weight:800;margin-bottom:5px;letter-spacing:-.01em;}
.sub{font-size:13px;color:var(--ink3);line-height:1.65;margin-bottom:16px;}
.mrow{display:flex;align-items:center;gap:10px;padding:9px 0;border-top:1px solid var(--line);}

/* ?€?€ ëª¨ë‹¬ ?€?€ */
.mask{position:fixed;inset:0;background:rgba(9,30,66,.54);display:flex;align-items:center;justify-content:center;padding:40px 20px;overflow-y:auto;z-index:50;}
.modal{background:var(--card);border-radius:12px;box-shadow:var(--sh2);width:100%;max-width:580px;padding:0;display:flex;flex-direction:column;max-height:90vh;}
.modal h2{font-size:19px;font-weight:800;margin:0;padding:24px 28px 18px;border-bottom:1px solid var(--line);letter-spacing:-.02em;}
.modal-body{flex:1;overflow-y:auto;padding:24px 28px;}
.modal-foot{padding:18px 28px;border-top:1px solid var(--line);display:flex;gap:8px;align-items:center;}
.modal.sm{max-width:520px;}
.modal.sm h2{padding:36px 40px 16px;font-size:22px;text-align:center;border-bottom:none;}
.modal.sm .modal-body{padding:0 40px 8px;text-align:center;font-size:15px;color:var(--ink2);line-height:1.8;}
.modal.sm .modal-body .fld{text-align:left;}
.modal.sm .modal-foot{padding:24px 40px 36px;justify-content:center;gap:12px;}
.modal.sm .modal-foot .spacer{display:none;}
.modal.sm p{padding:0 40px;margin:0 0 4px;}
.modal.sm .mfoot{padding:20px 40px 32px;margin-top:8px;justify-content:center;gap:12px;border-top:1px solid var(--line);}
.modal.sm .mfoot .spacer{display:none;}
.fld{margin-bottom:14px;}
.fld label{display:block;font-size:12.5px;font-weight:700;color:var(--ink3);margin-bottom:6px;}
.fld input,.fld select,.fld textarea{width:100%;background:#F7F8F9;border:1px solid var(--line2);border-radius:6px;padding:9px 11px;font-size:14.5px;color:var(--ink);}
.fld input:focus,.fld select:focus,.fld textarea:focus{outline:2px solid var(--pri);outline-offset:-1px;background:#fff;}
.fld textarea{resize:vertical;min-height:72px;line-height:1.55;}
.r2{display:grid;grid-template-columns:1fr 1fr;gap:11px;}
.r3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:11px;}
.mfoot{display:flex;gap:8px;align-items:center;margin-top:20px;padding-top:16px;border-top:1px solid var(--line);}
.del{color:var(--danger);font-size:13.5px;font-weight:600;padding:8px 0;}

.sect{border-top:1px solid var(--line);margin-top:18px;padding-top:15px;}
.sect h4{font-size:12.5px;font-weight:700;color:var(--ink3);margin-bottom:10px;}
.item{display:flex;align-items:center;gap:10px;padding:6px 0;font-size:14px;}
.item .x{color:var(--ink3);font-size:16px;padding:0 4px;line-height:1;}
.item .x:hover{color:var(--danger);}
.item a{color:var(--pri);text-decoration:none;word-break:break-all;font-weight:500;}
.item a:hover{text-decoration:underline;}
.addrow{display:flex;gap:7px;margin-top:8px;}
.addrow input{flex:1;background:#F7F8F9;border:1px solid var(--line2);border-radius:6px;padding:8px 10px;font-size:14px;}
.hinput{flex:1;background:#F7F8F9;border:1px solid var(--line2);border-radius:6px;padding:8px 10px;font-size:14px;font-family:inherit;resize:vertical;min-height:38px;max-height:160px;line-height:1.5;}
.addrow button{background:var(--pri);color:#fff;padding:8px 14px;font-size:13.5px;font-weight:600;border-radius:6px;}
.cmt{border-left:3px solid var(--line2);padding:5px 0 5px 11px;margin-bottom:10px;}
.cmt .ch2{font-size:12px;color:var(--ink3);margin-bottom:4px;font-weight:500;}
.cmt .ch2 b{color:var(--ink2);font-weight:700;}
.cmt p{font-size:14px;line-height:1.55;white-space:pre-wrap;word-break:break-word;}
.hint{font-size:13px;color:var(--ink3);}

/* ?€?€ ì§„í–‰ë¥??€?€ */
.prow{display:flex;align-items:center;gap:8px;}
.ppct{font-size:18px;font-weight:800;color:var(--ok);min-width:44px;letter-spacing:-.02em;text-align:right;}
.prange{flex:1;-webkit-appearance:none;appearance:none;width:100%;height:6px;background:transparent;outline:none;padding:0;margin:0;box-sizing:border-box;display:block;}
.prange::-webkit-slider-runnable-track{-webkit-appearance:none;width:100%;height:6px;background:#DFE1E6;border-radius:4px;border:none;}
.prange::-moz-range-track{width:100%;height:6px;background:#DFE1E6;border-radius:4px;border:none;}
.prange::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:#fff;border:3px solid var(--ok);cursor:pointer;box-shadow:var(--sh);margin-top:-6px;}
.prange::-moz-range-thumb{width:18px;height:18px;border-radius:50%;background:#fff;border:3px solid var(--ok);cursor:pointer;box-sizing:border-box;}
.prange::-moz-range-progress{background:transparent;height:6px;border-radius:4px;}
.pticks{display:flex;justify-content:space-between;font-size:11px;color:var(--ink3);margin-top:4px;font-weight:600;}
.pbadge{font-size:12.5px;font-weight:700;border-radius:20px;padding:5px 12px;background:#EBECF0;color:var(--ink2);white-space:nowrap;}
.pticks{display:flex;justify-content:space-between;font-size:11.5px;color:var(--ink3);margin-top:5px;padding-left:58px;font-weight:600;}

/* ?€?€ ë°˜ë³µ ?…ë¬´ ?€?€ */
.rwrap{display:grid;grid-template-columns:minmax(0,1fr) 360px;gap:14px;align-items:start;}
.wkstrip{display:grid;grid-template-columns:repeat(7,1fr);gap:7px;}
.wkday{background:var(--card);border:2px solid var(--line);border-radius:10px;padding:9px 2px 11px;display:flex;flex-direction:column;align-items:center;gap:5px;}
.wkday:hover{border-color:var(--line2);}
.wkday.sel{border-color:var(--pri);background:#E9F2FF;}
.wkday .dw{font-size:12px;color:var(--ink3);font-weight:600;}
.wkday .dn{font-size:19px;font-weight:800;line-height:1;}
.wkday .dn.td{color:var(--pri);}
.ring{width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;}
.ring i{width:13px;height:13px;border-radius:50%;background:var(--card);display:block;}
.wkday.sel .ring i{background:#E9F2FF;}
.rrow{display:flex;align-items:center;gap:12px;background:var(--card);border-radius:8px;box-shadow:var(--sh);padding:12px 14px;margin-bottom:8px;cursor:pointer;}
.rrow:hover{box-shadow:var(--sh2);}
.rrow.sel{box-shadow:0 0 0 2px var(--pri),var(--sh);}
.rrow.on{background:#E3FCEF;}
.rtitle{font-size:14.5px;font-weight:600;margin-bottom:5px;word-break:keep-all;}
.rrow.on .rtitle{color:var(--ink2);}
.rmeta{display:flex;gap:10px;flex-wrap:wrap;font-size:12px;color:var(--ink3);font-weight:500;}
.rcheck{width:32px;height:32px;border-radius:50%;border:2px solid var(--line2);background:var(--card);color:transparent;font-size:16px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-weight:900;}
.rcheck:hover{border-color:var(--ok);}
.rcheck.on{background:var(--ok);border-color:var(--ok);color:#fff;}
.rcheck:disabled{opacity:.4;cursor:default;}
.rside{position:sticky;top:14px;}
.rstats{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-bottom:16px;}
.rstat{background:#F1F2F4;border-radius:8px;padding:11px 13px;}
.rstat .k{font-size:11.5px;font-weight:600;color:var(--ink3);display:block;margin-bottom:4px;}
.rstat .v{font-size:21px;font-weight:800;line-height:1;letter-spacing:-.02em;}
.calhead{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;}
.calhead span{font-size:14px;font-weight:700;}
.calhead button{background:#EBECF0;border-radius:6px;width:28px;height:28px;font-size:14px;color:var(--ink2);font-weight:700;}
.calhead button:hover{background:#DFE1E6;}
.cal{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;}
.cdw{font-size:11.5px;color:var(--ink3);text-align:center;padding-bottom:4px;font-weight:700;}
.ccell{aspect-ratio:1;border:1px solid var(--line);border-radius:6px;background:var(--card);font-size:12.5px;color:var(--ink2);padding:0;display:flex;align-items:center;justify-content:center;font-weight:600;}
.ccell:hover{border-color:var(--pri);}
.ccell.mute{border:none;background:transparent;}
.ccell.on{background:var(--ok);border-color:var(--ok);color:#fff;font-weight:800;}
.ccell.td{box-shadow:inset 0 0 0 2px var(--warn);}
.ccell.sel{border-color:var(--pri);border-width:2px;}
.iss,.issrow{display:flex;align-items:flex-start;gap:11px;padding:10px 0;border-bottom:1px solid var(--line);}
.issrow{background:var(--card);border-radius:8px;box-shadow:var(--sh);border:none;padding:13px 15px;margin-bottom:8px;align-items:center;}
.iss.done .isstext,.issrow.done .isstext{color:var(--ink3);text-decoration:line-through;}
.issck{width:22px;height:22px;border:2px solid var(--line2);border-radius:5px;background:var(--card);font-size:12px;color:var(--ok);flex-shrink:0;padding:0;display:flex;align-items:center;justify-content:center;font-weight:900;}
.issck:hover{border-color:var(--ok);}
.iss.done .issck,.issrow.done .issck{background:#E3FCEF;border-color:var(--ok);}
.isstext{font-size:14px;line-height:1.5;word-break:break-word;font-weight:500;}
.issmeta{font-size:12px;color:var(--ink3);margin-top:4px;font-weight:500;}
.note{margin-top:28px;font-size:12.5px;color:var(--ink3);line-height:1.75;border-top:1px solid var(--line);padding-top:14px;}

/* ?€?€ ì±„ë„ ?¸ë¦¬ ?€?€ */
.chnode{border-top:1px solid var(--line);padding-top:6px;margin-top:6px;}
.chsub{padding-left:26px;}
.chsub .mrow{border-top:none;padding:6px 0;}
.subhint{font-size:12px;color:var(--ink3);font-weight:600;}

@media(max-width:1100px){.board{grid-template-columns:repeat(3,minmax(0,1fr));}.metrics{grid-template-columns:repeat(3,1fr);}.rwrap{grid-template-columns:1fr;}.rside{position:static;}}
@media(max-width:680px){.board{grid-template-columns:1fr;}.metrics{grid-template-columns:repeat(2,1fr);}.r3{grid-template-columns:1fr;}.page{margin:0 8px;padding:12px;}}
/* ?â• Monday ?¤í????Œì´ë¸??â• */
.mdtoolbar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding-bottom:14px;margin-bottom:8px;border-bottom:1px solid var(--line);}
.mdsep{width:1px;height:22px;background:var(--line);margin:0 4px;}
.mdlbl{font-size:13px;color:var(--ink3);font-weight:600;}
.mdgroup{margin-bottom:26px;}
.mdghead{display:flex;align-items:center;gap:8px;padding:6px 2px 8px;background:none;}
.mdarrow{font-size:13px;line-height:1;}
.mdgtitle{font-size:16px;font-weight:800;letter-spacing:-.01em;}
.mdgcount{font-size:13px;color:var(--ink3);font-weight:600;}
.mdtblwrap{background:var(--card);border-radius:8px;box-shadow:var(--sh);overflow-x:auto;}
.mdtbl{width:100%;border-collapse:separate;border-spacing:0;font-size:14px;}
.mdtbl th{font-size:13px;font-weight:600;color:var(--ink3);text-align:center;padding:9px 10px;background:#F5F6F8;border-bottom:1px solid var(--line);border-right:1px solid var(--line);white-space:nowrap;}
.mdtbl th:last-child{border-right:none;}
.mdtbl td{padding:0;border-bottom:1px solid var(--line);border-right:1px solid var(--line);height:38px;text-align:center;vertical-align:middle;}
.mdtbl td:last-child{border-right:none;}
.mdtbl tr:last-child td{border-bottom:none;}
.mdspine{width:6px!important;min-width:6px;padding:0!important;background:var(--gc);border-right:none!important;}
.mdtbl thead th.mdspine{background:var(--gc);}
.mdname{position:relative;text-align:left!important;}
.mdname input{width:100%;border:none;background:transparent;padding:8px 30px 8px 12px;font-size:14px;font-weight:600;color:var(--ink);font-family:inherit;}
.mdname input:focus{outline:2px solid var(--pri);outline-offset:-2px;background:#fff;border-radius:4px;}
.mdopen{position:absolute;right:6px;top:50%;transform:translateY(-50%);color:var(--ink3);font-size:13px;opacity:0;padding:2px 4px;}
.mdname:hover .mdopen{opacity:1;}
.mdopen:hover{color:var(--pri);}
.mdplain{width:100%;border:none;background:transparent;padding:8px 9px;font-size:13.5px;color:var(--ink2);font-family:inherit;text-align:center;}
.mdplain:focus{outline:2px solid var(--pri);outline-offset:-2px;background:#fff;border-radius:4px;}
.mdcell{padding:0!important;}
.mdcolorsel{width:100%;height:38px;border:none;background:transparent;color:#fff;font-size:13.5px;font-weight:600;text-align:center;text-align-last:center;font-family:inherit;cursor:pointer;-webkit-appearance:none;appearance:none;}
.mdcolorsel option{color:var(--ink);background:#fff;}
.mdcolorsel:focus{outline:2px solid rgba(255,255,255,.7);outline-offset:-3px;}
.mddue{display:flex;align-items:center;justify-content:center;gap:3px;padding:0 4px;}
.mdwarn{width:16px;height:16px;border-radius:50%;background:#E2445C;color:#fff;font-size:11px;font-weight:900;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;}
.mdok{color:#00C875;font-size:14px;font-weight:900;flex-shrink:0;}
.mddue input{padding:6px 2px;font-size:12.5px;}
.mdpg{display:flex;align-items:center;gap:7px;padding:0 10px;}
.mdpgbar{flex:1;height:7px;background:#E6E9EF;border-radius:4px;overflow:hidden;}
.mdpgbar i{display:block;height:100%;background:#00C875;border-radius:4px;}
.mdpg span{font-size:12px;color:var(--ink2);font-weight:700;min-width:32px;}
.mdempty{color:var(--ink3);font-size:13px;padding:14px!important;}
.mdaddrow td{height:34px;text-align:left!important;background:#FCFCFD;}
.mdadd{color:var(--ink3);font-size:13.5px;font-weight:600;padding:8px 12px;width:100%;text-align:left;}
.mdadd:hover{color:var(--pri);}
.mdsum td{height:32px;background:#F5F6F8;border-bottom:none;padding:0 8px!important;}
.mdstack{display:flex;height:9px;border-radius:5px;overflow:hidden;background:#E6E9EF;}
.mdstack i{display:block;height:100%;}
.mdrange{font-size:12px;color:var(--ink2);font-weight:600;background:#E6E9EF;border-radius:12px;padding:3px 10px;display:inline-block;}

/* ?â• ? ê·œ ê¸°ëŠ¥ CSS ?â• */
.boardtabs{display:flex;gap:6px;margin-bottom:14px;}
.boardtab{background:var(--card);border:1px solid var(--line2);border-radius:8px;padding:8px 16px;font-size:14px;font-weight:700;color:var(--ink2);display:inline-flex;align-items:center;gap:7px;}
.boardtab:hover{border-color:var(--pri);}
.boardtab.sel{background:var(--pri);color:#fff;border-color:var(--pri);}
.boardtab em{font-style:normal;font-size:12px;background:rgba(0,0,0,.12);padding:1px 7px;border-radius:9px;}
.boardtab.sel em{background:rgba(255,255,255,.25);}
.datefilt{display:inline-flex;align-items:center;gap:6px;}
.datefilt input[type=date]{font-size:13px;padding:6px 8px;}
.rfilters{display:flex;gap:7px;margin-bottom:12px;flex-wrap:wrap;}
.issbtn{border:1px solid var(--line2);background:var(--card);color:var(--ink2);font-size:12.5px;font-weight:700;padding:6px 13px;border-radius:16px;white-space:nowrap;}
.issbtn.active{background:#FFECEB;color:#C9372C;border-color:#F2C0BC;}
.btn-save{background:#0C66E4!important;color:#fff!important;padding:8px 16px;font-size:14px;font-weight:700;border-radius:6px;}
.btn-save:hover{background:#0055CC!important;}
.issbtn:hover{border-color:var(--ink3);}
.fcitem{display:flex;align-items:center;gap:9px;padding:5px 0;}
.fcitem.dragging{opacity:.4;}
.fccheck{width:21px;height:21px;border:2px solid #A9B0A6;border-radius:5px;background:#fff;font-size:11px;color:var(--ok);flex-shrink:0;font-weight:900;display:flex;align-items:center;justify-content:center;}
.fccheck:hover{border-color:var(--ok);background:#F5FBF7;}
.fccheck.on{background:var(--ok);border-color:var(--ok);color:#fff;}
.fccheck:disabled{opacity:.4;}


/* ?â• ì²´í¬ë¦¬ìŠ¤?????â• */
.ckcols{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;align-items:start;}
.ckcol{background:#EBECF0;border-radius:12px;padding:12px;}
.ckcolhead{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 4px 12px;min-height:44px;}
.ckcoltitle{font-size:15px;font-weight:800;display:inline-flex;align-items:center;gap:8px;letter-spacing:-.01em;}
.ckcoltitle em{font-style:normal;font-size:12.5px;color:var(--ink3);background:#DFE1E6;padding:1px 8px;border-radius:10px;font-weight:700;}
.ckplus{width:30px;height:30px;border-radius:7px;background:#0C66E4!important;color:#fff!important;font-size:19px;font-weight:700;line-height:1;display:flex;align-items:center;justify-content:center;}
.ckplus:hover{background:#0055CC!important;}
.ckclear{font-size:11.5px;color:var(--danger);font-weight:700;padding:0 6px;background:none;}
.ckclear:hover{text-decoration:underline;}
.ckcolbody{display:flex;flex-direction:column;gap:8px;min-height:40px;}
.ckempty{text-align:center;font-size:12.5px;color:var(--ink3);padding:20px 8px;}
.ckrow{background:var(--card);border-radius:8px;box-shadow:var(--sh);padding:11px 13px;border:2px solid transparent;}
.ckrow:hover{box-shadow:var(--sh2);}
.ckrow.over{border-color:#E2445C;background:#FFF6F5;}
.ckrow.done{opacity:.6;}
.ckrow[draggable=true]{cursor:grab;}
.ckrow.dragging{opacity:.4;cursor:grabbing;box-shadow:0 0 0 2px var(--pri),var(--sh);}
.ckrowmain{display:flex;align-items:flex-start;gap:11px;}
.ckbox{width:22px;height:22px;border:2px solid #8F959C;border-radius:6px;background:#fff;font-size:12px;color:var(--ok);flex-shrink:0;font-weight:900;display:flex;align-items:center;justify-content:center;margin-top:1px;}
.ckbox:hover{border-color:var(--ok);background:#F5FBF7;}
.ckbox.on{background:var(--ok);border-color:var(--ok);color:#fff;}
.ckbox.sm{width:18px;height:18px;font-size:10px;}
.ckbox:disabled{opacity:.5;}
.cktitle{font-size:14px;font-weight:700;line-height:1.4;word-break:keep-all;margin-bottom:4px;}
.ckrow.done .cktitle{text-decoration:line-through;color:var(--ink3);}
.cktitle.red{color:#E2445C;}
.ckmeta{display:flex;gap:5px;flex-wrap:wrap;font-size:12.5px;color:var(--ink3);font-weight:600;}
.ckmeta.red{color:#E2445C;font-weight:800;}
.ckunderline{height:2px;background:linear-gradient(90deg,var(--line2),transparent);border-radius:2px;margin-top:8px;width:70%;}
.ckexp{background:none;color:var(--ink3);font-size:11px;padding:2px 5px;flex-shrink:0;}
.ckexp:hover{color:var(--pri);}
.cksubs{margin-top:10px;padding-top:10px;border-top:1px solid var(--line);display:flex;flex-direction:column;gap:7px;padding-left:33px;}
.cksub{display:flex;align-items:center;gap:8px;font-size:13px;}
@media(max-width:1100px){.ckcols{grid-template-columns:1fr;}}

/* ?â• AI ë¹„ì„œ ?â• */
.aiwrap{max-width:720px;margin:0 auto;}
.aichat{background:var(--card);border-radius:12px;box-shadow:var(--sh);padding:20px;min-height:360px;max-height:520px;overflow-y:auto;margin-bottom:12px;}
.aiempty{text-align:center;padding:30px 10px;color:var(--ink3);}
.aiempty p{font-size:13.5px;margin-bottom:14px;font-weight:600;}
.aisugg{display:flex;flex-direction:column;gap:8px;max-width:320px;margin:0 auto;}
.aisugg button{background:#F1F2F4;border-radius:8px;padding:9px 14px;font-size:13px;color:var(--ink2);text-align:left;}
.aisugg button:hover{background:#E4E6E9;}
.aimsg{display:flex;margin-bottom:12px;}
.aimsg.user{justify-content:flex-end;}
.aimsg.ai{justify-content:flex-start;}
.aibubble{max-width:78%;padding:10px 14px;border-radius:14px;font-size:14px;line-height:1.55;white-space:pre-wrap;word-break:break-word;}
.aimsg.user .aibubble{background:var(--pri);color:#fff;border-bottom-right-radius:4px;}
.aimsg.ai .aibubble{background:#F1F2F4;color:var(--ink);border-bottom-left-radius:4px;}
.aithink{color:var(--ink3);font-style:italic;}
.aiinput{display:flex;gap:8px;}
.aiinput input{flex:1;background:var(--card);border:1px solid var(--line2);border-radius:8px;padding:11px 14px;font-size:14.5px;}
.aiinput input:focus{outline:2px solid var(--pri);outline-offset:-1px;}

/* ?â• ë°˜ë³µ?…ë¬´ 3??êµ¬ì¡° ?â• */
.ritop{background:var(--card);border-radius:10px;box-shadow:var(--sh);margin-bottom:12px;overflow:hidden;}
.rihead{display:flex;align-items:center;gap:9px;padding:13px 16px;cursor:pointer;background:#F5F6F5;}
.rihead:hover{background:#EFF1EE;}
.ricatname{font-size:15px;font-weight:800;flex:1;}
.ricount{font-size:12px;color:var(--ink3);font-weight:700;font-family:monospace;}
.richev{font-size:11px;color:var(--ink3);width:14px;text-align:center;}
.richev.sm{font-size:10px;}
.risub{border-top:1px solid var(--line);}
.risubhead{display:flex;align-items:center;gap:8px;padding:10px 16px 10px 32px;cursor:pointer;}
.risubhead:hover{background:#FAFBFA;}
.risubname{font-size:13.5px;font-weight:700;flex:1;color:var(--ink2);}
.rirow{display:flex;align-items:center;gap:10px;padding:8px 16px 8px 52px;border-top:1px solid #F0F1EF;}
.rirow[draggable=true]{cursor:grab;}
.rirow.dragging{opacity:.4;cursor:grabbing;}
.iss[draggable=true]{cursor:grab;}
.iss.dragging{opacity:.4;cursor:grabbing;}
.rirow:hover{background:#FAFBFA;}
.riedit{background:#EBECF0;border:none;color:var(--ink2);font-size:11.5px;font-weight:700;cursor:pointer;padding:4px 10px;border-radius:6px;}
.riedit:hover{background:#DFE1E6;}

/* ?â• ë©”ëª¨ ?â• */
.memocard{background:var(--card);border-radius:10px;box-shadow:var(--sh);padding:13px 16px;}
.memocard[draggable=true]{cursor:grab;}
.memocard.dragging{opacity:.4;cursor:grabbing;}
.memohead{display:flex;align-items:flex-start;gap:10px;}
.memopath{font-size:11px;color:var(--ink3);font-weight:700;margin-bottom:3px;}
.memotitle{font-size:14.5px;font-weight:800;margin-bottom:4px;}
.memotext{font-size:13.5px;color:var(--ink2);line-height:1.55;white-space:pre-wrap;word-break:break-word;}
.memosubs{margin-top:10px;padding-top:10px;border-top:1px solid var(--line);display:flex;flex-direction:column;gap:10px;}

`;

export default function App() {
  return <Board />;
}

function Board() {
  const [data, setData] = useState(emptyData());
  const [me, setMe] = useState("");
  const [ready, setReady] = useState(false);
  const [saveState, setSaveState] = useState("idle");
  const [view, setView] = useState("board");
  const [q, setQ] = useState("");
  const [fCh, setFCh] = useState("?„ì²´");
  const [fOwner, setFOwner] = useState("?„ì²´");
  const [fTag, setFTag] = useState("?„ì²´");
  const [onlyMine, setOnlyMine] = useState(false);
  const [onlyLate, setOnlyLate] = useState(false);
  const [sortBy, setSortBy] = useState("due");
  const [draft, setDraft] = useState(null);
  const [dragId, setDragId] = useState(null);
  const [overCol, setOverCol] = useState(null);
  const [askName, setAskName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [loginPw, setLoginPw] = useState("");
  const [signupMode, setSignupMode] = useState(false);
  const [signupPw2, setSignupPw2] = useState("");
  const [pwChange, setPwChange] = useState(null);
  const [aiMessages, setAiMessages] = useState([]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const aiChatRef = useRef(null);
  const [newType, setNewType] = useState("");
  const [newRcat, setNewRcat] = useState("");
  const [riDate, setRiDate] = useState(todayStr());
  const [riCollapse, setRiCollapse] = useState({});
  const [riAdd, setRiAdd] = useState(null);
  const [riIssueOpen, setRiIssueOpen] = useState(true);
  const [riIssueFilter, setRiIssueFilter] = useState("open");
  const [riIssueQuery, setRiIssueQuery] = useState("");
  const [riIssueItem, setRiIssueItem] = useState("");
  const [riIssueText, setRiIssueText] = useState("");
  const [riItemDrag, setRiItemDrag] = useState(null);
  const [riIssueDrag, setRiIssueDrag] = useState(null);
  const [riIssueExpand, setRiIssueExpand] = useState({});
  const [riIssueEditId, setRiIssueEditId] = useState(null);
  const [riIssueSubText, setRiIssueSubText] = useState({});
  const [riIssueSubEditId, setRiIssueSubEditId] = useState(null);
  const [riQuickIssueId, setRiQuickIssueId] = useState(null);
  const [riQuickIssueText, setRiQuickIssueText] = useState("");
  const [memoQuery, setMemoQuery] = useState("");
  const [memoCatFilter, setMemoCatFilter] = useState("?„ì²´");
  const [memoDraft, setMemoDraft] = useState(null);
  const [memoExpand, setMemoExpand] = useState({});
  const [memoDrag, setMemoDrag] = useState(null);
  const [memoSubText, setMemoSubText] = useState({});
  const [memoSubEditId, setMemoSubEditId] = useState(null);
  const [notifOn, setNotifOn] = useState(typeof Notification !== "undefined" && Notification.permission === "granted");
  const prevTasksRef = useRef(null);
  const notifiedRef = useRef(new Set());
  const [mlyDraft, setMlyDraft] = useState(null);
  const [mlyHistEditId, setMlyHistEditId] = useState(null);
  const [mlySubHistOpen, setMlySubHistOpen] = useState({});
  const [mlySubHistText, setMlySubHistText] = useState({});
  const [mlySubHistEditId, setMlySubHistEditId] = useState(null);
  const [mlySubsubOpen, setMlySubsubOpen] = useState({});
  const [mlyDate, setMlyDate] = useState(()=>{const n=new Date();return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}`;});
  const [confirmBox, setConfirmBox] = useState(null);
  const [newChannel, setNewChannel] = useState("");
  const [newSub, setNewSub] = useState("");
  const [subTarget, setSubTarget] = useState(null);
  const [grpBy, setGrpBy] = useState("status");
  const [collapsed, setCollapsed] = useState({});
  const [curBoard, setCurBoard] = useState("ê³µìš©");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [issueDetail, setIssueDetail] = useState(null);
  const [ckDraft, setCkDraft] = useState(null);
  const [ckExpand, setCkExpand] = useState({});
  const [listDateFrom, setListDateFrom] = useState("");
  const [listDateTo, setListDateTo] = useState("");
  const [issueFilter, setIssueFilter] = useState("open");
  const dataRef = useRef(data); dataRef.current = data;
  const busyRef = useRef(false);
  const addingRef = useRef(false);
  const importRef = useRef(null);

  const myRole = useMemo(() => { const m=data.members.find((x)=>x.name===me); if(m)return m.role; return data.members.length===0?"admin":"member"; }, [data.members, me]);
  const canEdit = myRole==="admin"||myRole==="member";
  const isAdmin = myRole==="admin";
  const chColor = useCallback((name)=>(data.channels.find((c)=>c.id===name)||{color:"#7A8189"}).color, [data.channels]);

  const load = useCallback(async (silent) => {
    if (!silent) setSaveState("loading");
    try { const snap=await getDoc(BOARD_REF()); if(snap.exists()){const p=snap.data();if(p&&Array.isArray(p.tasks))setData({...emptyData(),...p});} } catch(e) {}
    if (!silent) setSaveState("idle");
  }, []);

  useEffect(() => {
    (async()=>{
      await load();
      try { const n=localStorage.getItem(ME_KEY)||""; if(n)setMe(n); } catch(e){}
      setReady(true);
    })();
  }, [load]);

  useEffect(() => {
    const unsub=onSnapshot(BOARD_REF(),(snap)=>{ if(busyRef.current)return; if(snap.exists()){const r=snap.data();if(r&&(r.updatedAt||0)>(dataRef.current.updatedAt||0))setData(mergeData(r,dataRef.current));}});
    return ()=>unsub();
  }, []);

  const commit = useCallback(async (mutator, logEntries) => {
    busyRef.current=true; setSaveState("saving");
    const optimistic=mutator(dataRef.current); setData(optimistic);
    try {
      let remote=null;
      try{const snap=await getDoc(BOARD_REF());if(snap.exists())remote=snap.data();}catch(e){}
      const base=remote&&Array.isArray(remote.tasks)?{...emptyData(),...remote,checkitems:Array.isArray(remote.checkitems)?remote.checkitems:[],monthlies:Array.isArray(remote.monthlies)?remote.monthlies:[],routineCats:Array.isArray(remote.routineCats)?remote.routineCats:["?¤ì „","?¤í›„"],rItems:Array.isArray(remote.rItems)?remote.rItems:[],colLabels:remote.colLabels||{},memoItems:Array.isArray(remote.memoItems)?remote.memoItems:[]}:emptyData();
      const merged=mergeData(base,optimistic);
      if(logEntries&&logEntries.length)merged.log=[...logEntries,...(merged.log||[])].slice(0,LOG_CAP);
      merged.updatedAt=Date.now();
      await setDoc(BOARD_REF(),merged); setData(merged); setSaveState("saved"); setTimeout(()=>setSaveState("idle"),1500);
    } catch(e){setSaveState("error");} finally{busyRef.current=false;}
  }, []);

  const mkLog=(action,task,detail)=>({id:uid(),ts:Date.now(),who:me||"?µëª…",taskId:task?.id||null,taskTitle:task?.title||"",action,detail:detail||""});

  const live=useMemo(()=>data.tasks.filter((t)=>!t.deleted&&!t.archived&&(t.boardId||"ê³µìš©")===curBoard),[data.tasks,curBoard]);
  const archived=useMemo(()=>data.tasks.filter((t)=>!t.deleted&&t.archived&&(t.boardId||"ê³µìš©")===curBoard),[data.tasks,curBoard]);
  const owners=useMemo(()=>[...new Set(data.tasks.filter((t)=>!t.deleted).map((t)=>t.owner).filter(Boolean))].sort(),[data.tasks]);
  const allTags=useMemo(()=>[...new Set(data.tasks.filter((t)=>!t.deleted).flatMap((t)=>t.tags||[]))].sort(),[data.tasks]);

  const topChannels=useMemo(()=>data.channels.filter((c)=>!c.parent),[data.channels]);
  const subsOf=useCallback((pid)=>data.channels.filter((c)=>c.parent===pid),[data.channels]);
  const parentOf=useCallback((id)=>(data.channels.find((c)=>c.id===id)||{}).parent||null,[data.channels]);
  const inChannel=useCallback((tc,fc)=>tc===fc||parentOf(tc)===fc,[parentOf]);

  const applyFilters=useCallback((list)=>{
    const kw=q.trim().toLowerCase();
    return list.filter((t)=>{
      if(fCh!=="?„ì²´"&&!inChannel(t.channel,fCh))return false;
      if(fOwner!=="?„ì²´"&&t.owner!==fOwner)return false;
      if(fTag!=="?„ì²´"&&!(t.tags||[]).includes(fTag))return false;
      if(onlyMine&&t.owner!==me)return false;
      if(onlyLate){const d=dayDiff(t.due);if(!(d!==null&&d<0&&t.status!=="done"))return false;}
      if(dateFrom&&(!t.due||t.due<dateFrom))return false;
      if(dateTo&&(!t.due||t.due>dateTo))return false;
      if(kw){const h=`${t.title} ${t.memo||""} ${t.type} ${t.owner||""} ${(t.tags||[]).join(" ")}`.toLowerCase();if(!h.includes(kw))return false;}
      return true;
    });
  },[q,fCh,fOwner,fTag,onlyMine,onlyLate,me,inChannel,dateFrom,dateTo]);

  const sortFn=useCallback((a,b)=>{ if(sortBy==="due"){if(!a.due&&!b.due)return 0;if(!a.due)return 1;if(!b.due)return -1;return a.due<b.due?-1:1;} if(sortBy==="pri"){const r=(t)=>PRIORITIES.find((p)=>p.id===t.priority)?.rank??1;return r(a)-r(b);} return(b.updatedAt||0)-(a.updatedAt||0); },[sortBy]);
  const visible=useMemo(()=>applyFilters(live).slice().sort(sortFn),[live,applyFilters,sortFn]);
  const stats=useMemo(()=>{const o=live.filter((t)=>t.status!=="done");return{total:live.length,doing:live.filter((t)=>t.status==="doing").length,tomorrow:o.filter((t)=>dayDiff(t.due)===1).length,late:o.filter((t)=>{const d=dayDiff(t.due);return d!==null&&d<0;}).length,open:o.length};},[live]);

  const saveMe=async(name)=>{const n=name.trim();if(!n)return;setMe(n);setAskName(false);try{localStorage.setItem(ME_KEY,n);}catch(e){}if(!dataRef.current.members.find((m)=>m.name===n)){const role=dataRef.current.members.length===0?"admin":"member";commit((d)=>({...d,members:[...d.members,{name:n,role,updatedAt:Date.now()}]}),[{id:uid(),ts:Date.now(),who:n,taskId:null,taskTitle:"",action:"?€ ?©ë¥˜",detail:ROLES.find((r)=>r.id===role).label}]);}};

  const doLogin=()=>{
    const n=nameInput.trim();if(!n){alert("?´ë¦„???…ë ¥?˜ì„¸??");return;}
    const mem=dataRef.current.members.find((m)=>m.name===n);
    if(!mem){alert("?±ë¡?˜ì? ?Šì? ?´ë¦„?…ë‹ˆ?? ? ê·œ ?±ë¡???ŒëŸ¬ ê³„ì •??ë§Œë“œ?¸ìš”.");return;}
    if(mem.pw&&mem.pw!==loginPw){alert("ë¹„ë?ë²ˆí˜¸ê°€ ?€?¸ìŠµ?ˆë‹¤.");setLoginPw("");return;}
    if(!mem.pw){alert("ë¹„ë?ë²ˆí˜¸ê°€ ?¤ì •?˜ì? ?Šì? ê³„ì •?…ë‹ˆ?? ? ê·œ ?±ë¡?ì„œ ë¹„ë?ë²ˆí˜¸ë¥?ë¨¼ì? ?¤ì •?˜ì„¸??");return;}
    setMe(n);try{localStorage.setItem(ME_KEY,n);}catch(e){}
    setLoginPw("");setNameInput("");
  };
  const doSignup=()=>{
    const n=nameInput.trim();if(!n){alert("?´ë¦„???…ë ¥?˜ì„¸??");return;}
    if(loginPw.length<4){alert("ë¹„ë?ë²ˆí˜¸??4???´ìƒ?¼ë¡œ ?¤ì •?˜ì„¸??");return;}
    if(loginPw!==signupPw2){alert("ë¹„ë?ë²ˆí˜¸ê°€ ?¼ì¹˜?˜ì? ?ŠìŠµ?ˆë‹¤.");return;}
    const exist=dataRef.current.members.find((m)=>m.name===n);
    if(exist&&exist.pw){alert("?´ë? ë¹„ë?ë²ˆí˜¸ê°€ ?¤ì •???´ë¦„?…ë‹ˆ?? ë¡œê·¸?¸ì„ ?¬ìš©?˜ì„¸??");return;}
    const role=dataRef.current.members.length===0?"admin":(exist?exist.role:"member");
    commit((d)=>{const list=d.members||[];const ex=list.find((m)=>m.name===n);
      return{...d,members:ex?list.map((m)=>m.name===n?{...m,pw:loginPw,updatedAt:Date.now()}:m):[...list,{name:n,role,pw:loginPw,updatedAt:Date.now()}]};},
      [{id:uid(),ts:Date.now(),who:n,taskId:null,taskTitle:"",action:exist?"ë¹„ë?ë²ˆí˜¸ ?¤ì •":"ê³„ì • ?ì„±",detail:ROLES.find((r)=>r.id===role).label}]);
    setMe(n);try{localStorage.setItem(ME_KEY,n);}catch(e){}
    setLoginPw("");setSignupPw2("");setNameInput("");setSignupMode(false);
  };
  const logout=()=>{setMe("");try{localStorage.removeItem(ME_KEY);}catch(e){}};
  const changePw=()=>{
    if(!pwChange)return;
    const {cur,next,next2}=pwChange;
    const mem=dataRef.current.members.find((m)=>m.name===me);
    if(!mem){setPwChange(null);return;}
    if(mem.pw&&mem.pw!==cur){alert("?„ì¬ ë¹„ë?ë²ˆí˜¸ê°€ ?€?¸ìŠµ?ˆë‹¤.");return;}
    if(next.length<4){alert("??ë¹„ë?ë²ˆí˜¸??4???´ìƒ?¼ë¡œ ?¤ì •?˜ì„¸??");return;}
    if(next!==next2){alert("??ë¹„ë?ë²ˆí˜¸ê°€ ?¼ì¹˜?˜ì? ?ŠìŠµ?ˆë‹¤.");return;}
    commit((d)=>({...d,members:d.members.map((m)=>m.name===me?{...m,pw:next,updatedAt:Date.now()}:m)}),[{id:uid(),ts:Date.now(),who:me,taskId:null,taskTitle:"",action:"ë¹„ë?ë²ˆí˜¸ ë³€ê²?,detail:""}]);
    setPwChange(null);alert("ë¹„ë?ë²ˆí˜¸ê°€ ë³€ê²½ë˜?ˆìŠµ?ˆë‹¤.");
  };
  const openNew=(status)=>setDraft({_new:true,id:uid(),boardId:curBoard,title:"",channel:data.channels[0]?.id||"ê³µí†µ",brand:"",type:"ì±„ë„?´ì˜",owner:me,start:"",due:"",priority:"mid",memo:"",progress:0,status:status||"todo",tags:[],checklist:[],links:[],comments:[],issues:[],repeat:"none",archived:false,deleted:false});
  const openTask=(t)=>setDraft({...t,boardId:t.boardId||"ê³µìš©",brand:t.brand||"",start:t.start||"",tags:[...(t.tags||[])],checklist:[...(t.checklist||[])],links:[...(t.links||[])],comments:[...(t.comments||[])],issues:[...(t.issues||[])]});

  const duplicateTask=(t)=>{
    const now=Date.now();
    const copy={...t,id:uid(),title:t.title+" (ë³µì‚¬)",status:"todo",progress:0,comments:[],
      checklist:(t.checklist||[]).map((c)=>({...c,id:uid(),done:false})),
      links:(t.links||[]).map((l)=>({...l,id:uid()})),
      createdAt:now,createdBy:me,updatedAt:now,doneAt:null,archived:false,deleted:false};
    delete copy._new;
    commit((d)=>({...d,tasks:[copy,...d.tasks]}),[mkLog("?…ë¬´ ë³µì‚¬",copy,`?ë³¸: ${t.title}`)]);
    setDraft(null);
  };

  const saveDraft=()=>{
    if(!draft.title.trim())return;
    const now=Date.now(),isNew=draft._new,clean={...draft};delete clean._new;
    const before=data.tasks.find((t)=>t.id===draft.id),logs=[];
    if(isNew)logs.push(mkLog("?…ë¬´ ?ì„±",clean,`${clean.channel} Â· ${clean.type}`));
    else{const diffs=[];if(before){if(before.title!==clean.title)diffs.push("?…ë¬´ëª?);if(before.status!==clean.status)diffs.push(`?íƒœ -> ${cols.find((c)=>c.id===clean.status)?.label}`);if(before.owner!==clean.owner)diffs.push(`?´ë‹¹??-> ${clean.owner||"ë¯¸ì???}`);if(before.due!==clean.due)diffs.push(`ë§ˆê° -> ${clean.due||"?†ìŒ"}`);if(before.priority!==clean.priority)diffs.push("?°ì„ ?œìœ„");if(before.channel!==clean.channel)diffs.push(`ì±„ë„ -> ${clean.channel}`);if((before.comments||[]).length!==(clean.comments||[]).length)diffs.push("?“ê?");}logs.push(mkLog("?…ë¬´ ?˜ì •",clean,diffs.join(", ")||"?´ìš© ë³€ê²?));}
    let spawn=null;
    if(clean.status==="done"&&before?.status!=="done"&&clean.repeat!=="none"){spawn={...clean,id:uid(),status:"todo",due:nextDue(clean.due,clean.repeat),checklist:(clean.checklist||[]).map((c)=>({...c,id:uid(),done:false})),comments:[],createdAt:now,createdBy:me,updatedAt:now,doneAt:null};logs.push(mkLog("ë°˜ë³µ ?ì„±",spawn,`?¤ìŒ ë§ˆê° ${spawn.due}`));}
    commit((d)=>{const ex=d.tasks.some((t)=>t.id===clean.id);const rec={...clean,createdAt:before?.createdAt||now,createdBy:before?.createdBy||me,updatedAt:now,updatedBy:me,doneAt:clean.status==="done"?(before?.doneAt||now):null};let tasks=ex?d.tasks.map((t)=>t.id===rec.id?rec:t):[rec,...d.tasks];if(spawn)tasks=[spawn,...tasks];return{...d,tasks};},logs);
    setDraft(null);
  };

  const moveTask=(task,statusId)=>{if(!canEdit||task.status===statusId)return;const now=Date.now();const logs=[mkLog("?íƒœ ë³€ê²?,task,`${cols.find((c)=>c.id===task.status)?.label} -> ${cols.find((c)=>c.id===statusId)?.label}`)];let spawn=null;if(statusId==="done"&&task.repeat&&task.repeat!=="none"){spawn={...task,id:uid(),status:"todo",due:nextDue(task.due,task.repeat),checklist:(task.checklist||[]).map((c)=>({...c,id:uid(),done:false})),comments:[],createdAt:now,createdBy:me,updatedAt:now,doneAt:null};logs.push(mkLog("ë°˜ë³µ ?ì„±",spawn,`?¤ìŒ ë§ˆê° ${spawn.due}`));}commit((d)=>{let tasks=d.tasks.map((t)=>t.id===task.id?{...t,status:statusId,updatedAt:now,updatedBy:me,doneAt:statusId==="done"?(t.doneAt||now):null}:t);if(spawn)tasks=[spawn,...tasks];return{...d,tasks};},logs);if(statusId==="done"&&task.status!=="done"){setConfirmBox({kind:"archiveOne",taskId:task.id,taskTitle:task.title});}};
  const removeTask=(task)=>{commit((d)=>({...d,tasks:d.tasks.map((t)=>t.id===task.id?{...t,deleted:true,updatedAt:Date.now(),updatedBy:me}:t)}),[mkLog("?…ë¬´ ?? œ",task)]);setDraft(null);};
  const setArchivedFlag=(task,flag)=>commit((d)=>({...d,tasks:d.tasks.map((t)=>t.id===task.id?{...t,archived:flag,updatedAt:Date.now(),updatedBy:me}:t)}),[mkLog(flag?"?„ì¹´?´ë¸Œ":"?„ì¹´?´ë¸Œ ?´ì œ",task)]);
  const archiveDone=()=>{const targets=live.filter((t)=>t.status==="done");if(!targets.length){setConfirmBox(null);return;}const ids=new Set(targets.map((t)=>t.id));commit((d)=>({...d,tasks:d.tasks.map((t)=>ids.has(t.id)?{...t,archived:true,updatedAt:Date.now(),updatedBy:me}:t)}),[mkLog("?„ë£Œ ?¼ê´„ ë³´ê?",null,`${targets.length}ê±?)]);setConfirmBox(null);};
  const purgeArchive=()=>{const ids=new Set(archived.map((t)=>t.id));commit((d)=>({...d,tasks:d.tasks.filter((t)=>!ids.has(t.id))}),[mkLog("ë³´ê????êµ¬ ?? œ",null,`${ids.size}ê±?)]);setConfirmBox(null);};
  const addChannel=(parent)=>{
    if(addingRef.current)return;
    const id=(parent?newSub:newChannel).trim();
    if(!id)return;
    if((dataRef.current.channels||[]).some((c)=>c.id===id)){alert("?´ë? ?ˆëŠ” ì±„ë„ëª…ì…?ˆë‹¤.");return;}
    addingRef.current=true;
    if(parent){setNewSub("");setSubTarget(null);}else{setNewChannel("");}
    const pc=parent?(dataRef.current.channels.find((c)=>c.id===parent)||{}).color:null;
    commit((d)=>{
      if((d.channels||[]).some((c)=>c.id===id))return d;
      return{...d,channels:[...d.channels,{id,color:pc||"#7A8189",parent:parent||null}],channelsUpdatedAt:Date.now()};
    },[mkLog(parent?"?˜ìœ„ ì±„ë„ ì¶”ê?":"ì±„ë„ ì¶”ê?",null,parent?`${parent} > ${id}`:id)]);
    setTimeout(()=>{addingRef.current=false;},600);
  };
  /* ?€?€ ë°˜ë³µ ?…ë¬´ (êµ¬ë²„???°ì´?? AIë¹„ì„œ ì¡°íšŒ?©ìœ¼ë¡œë§Œ ? ì?) ?€?€ */
  const cols = useMemo(()=>COLUMNS.map((c)=>({...c,label:(data.colLabels||{})[c.id]||c.label})),[data.colLabels]);
  const routines = useMemo(()=>(data.routines||[]).filter((r)=>!r.deleted),[data.routines]);

  const toggleIssue=(rid,iid)=>{
    commit((d)=>({...d,routines:(d.routines||[]).map((x)=>x.id!==rid?x:{...x,issues:(x.issues||[]).map((i)=>i.id===iid?{...i,resolved:!i.resolved,resolvedBy:me}:i),updatedAt:Date.now()})}),[]);
  };

  const allIssues=useMemo(()=>{
    const out=[];
    routines.forEach((r)=>(r.issues||[]).forEach((i)=>out.push({...i,routineId:r.id,routineTitle:r.title,owner:r.owner,src:"ë°˜ë³µ"})));
    data.tasks.filter((t)=>!t.deleted&&!t.archived).forEach((t)=>(t.issues||[]).forEach((i)=>out.push({...i,taskId:t.id,routineTitle:t.title,owner:t.owner,src:"?…ë¬´"})));
    return out.sort((a,b)=>b.ts-a.ts);
  },[routines,data.tasks]);

  /* ?€?€ ì²´í¬ë¦¬ìŠ¤???€?€ */
  const checkitems=useMemo(()=>(data.checkitems||[]).filter((c)=>!c.deleted),[data.checkitems]);
  const ckByTab=useCallback((tab)=>checkitems.filter((c)=>c.tab===tab).slice().sort((a,b)=>{
    if(a.done!==b.done)return a.done?1:-1;
    const ao=a.order,bo=b.order;
    if(ao!=null&&bo!=null)return ao-bo;
    if(ao!=null)return -1;
    if(bo!=null)return 1;
    const da=a.due||"9999",db=b.due||"9999";
    return da<db?-1:da>db?1:0;
  }),[checkitems]);

  const saveCk=()=>{
    if(!ckDraft.title.trim())return;
    const now=Date.now();const isNew=!!ckDraft._new;
    const rec={...ckDraft,updatedAt:now,updatedBy:me,createdAt:ckDraft.createdAt||now,subs:ckDraft.subs||[],history:ckDraft.history||[]};
    delete rec._new;
    commit((d)=>{const list=d.checkitems||[];const ex=list.some((c)=>c.id===rec.id);
      return{...d,checkitems:ex?list.map((c)=>c.id===rec.id?rec:c):[...list,rec]};},
      [{id:uid(),ts:now,who:me||"?µëª…",taskId:rec.id,taskTitle:rec.title,action:isNew?"ì²´í¬??ª© ?ì„±":"ì²´í¬??ª© ?˜ì •",detail:CKTABS.find((t)=>t.id===rec.tab)?.label||""}]);
    setCkDraft(null);
  };
  const [ckDrag, setCkDrag] = useState(null);
  const [ckSubDrag, setCkSubDrag] = useState(null);
  const toggleCk=(c)=>{if(!canEdit)return;const willDone=!c.done;commit((d)=>({...d,checkitems:(d.checkitems||[]).map((x)=>x.id===c.id?{...x,done:willDone,doneAt:willDone?Date.now():null,updatedAt:Date.now()}:x)}),[{id:uid(),ts:Date.now(),who:me||"?µëª…",taskId:c.id,taskTitle:c.title,action:c.done?"ì²´í¬ ?´ì œ":"ì²´í¬ ?„ë£Œ",detail:""}]);if(willDone)setConfirmBox({kind:"archiveCk",ckId:c.id,ckTitle:c.title});};
  const reorderCk=(tab,fromId,toId)=>{if(!canEdit||fromId===toId)return;const ordered=ckByTab(tab).filter((x)=>!x.done);const fi=ordered.findIndex((x)=>x.id===fromId);const ti=ordered.findIndex((x)=>x.id===toId);if(fi<0||ti<0)return;const arr=[...ordered];const[moved]=arr.splice(fi,1);arr.splice(ti,0,moved);const now=Date.now();commit((d)=>({...d,checkitems:(d.checkitems||[]).map((x)=>{const pos=arr.findIndex((a)=>a.id===x.id);return pos>=0?{...x,order:pos,updatedAt:now}:x;})}),[])};
  const removeCk=(c)=>{commit((d)=>({...d,checkitems:(d.checkitems||[]).map((x)=>x.id===c.id?{...x,deleted:true,updatedAt:Date.now()}:x)}),[{id:uid(),ts:Date.now(),who:me||"?µëª…",taskId:c.id,taskTitle:c.title,action:"ì²´í¬??ª© ?? œ",detail:""}]);setCkDraft(null);};
  const duplicateCk=(c)=>{
    const now=Date.now();
    const copy={...c,id:uid(),title:c.title+" (ë³µì‚¬)",done:false,doneAt:null,order:null,
      subs:(c.subs||[]).map((s)=>({...s,id:uid(),done:false})),
      history:[],createdAt:now,updatedAt:now};
    delete copy._new;
    commit((d)=>({...d,checkitems:[...(d.checkitems||[]),copy]}),[{id:uid(),ts:now,who:me||"?µëª…",taskId:copy.id,taskTitle:copy.title,action:"ì²´í¬??ª© ë³µì‚¬",detail:`?ë³¸: ${c.title}`}]);
    setCkDraft(null);
  };
  const clearCkItem=(c)=>{commit((d)=>({...d,checkitems:(d.checkitems||[]).map((x)=>x.id===c.id?{...x,subs:(x.subs||[]).map((s)=>({...s,done:false})),updatedAt:Date.now()}:x)}),[{id:uid(),ts:Date.now(),who:me||"?µëª…",taskId:c.id,taskTitle:c.title,action:"ì²´í¬ ?´ì œ",detail:""}]);};
  const toggleSub=(c,subId)=>{if(!canEdit)return;commit((d)=>({...d,checkitems:(d.checkitems||[]).map((x)=>x.id===c.id?{...x,subs:(x.subs||[]).map((s)=>s.id===subId?{...s,done:!s.done}:s),updatedAt:Date.now()}:x)}),[]);};

  /* ?€?€ AI ë¹„ì„œ ?€?€ */
  const runAiFunction = useCallback((name, args) => {
    const d = dataRef.current;
    if (name === "searchTasks") {
      let list = d.tasks.filter((t) => !t.deleted && !t.archived);
      if (args.board) list = list.filter((t) => (t.boardId || "ê³µìš©") === args.board);
      if (args.status) list = list.filter((t) => t.status === args.status);
      if (args.owner) list = list.filter((t) => t.owner === args.owner);
      if (args.channel) list = list.filter((t) => t.channel === args.channel);
      if (args.onlyOverdue) list = list.filter((t) => { const dd = dayDiff(t.due); return dd !== null && dd < 0 && t.status !== "done"; });
      if (args.onlyToday) list = list.filter((t) => t.due === todayStr());
      return list.slice(0, 40).map((t) => ({ title: t.title, channel: t.channel, owner: t.owner || "ë¯¸ì???, status: t.status, due: t.due || null, priority: t.priority, progress: t.progress || 0, board: t.boardId || "ê³µìš©" }));
    }
    if (name === "searchRoutines") {
      let list = routines;
      if (args.owner) list = list.filter((r) => r.owner === args.owner);
      const today = todayStr();
      if (args.onlyUnchecked) list = list.filter((r) => !(r.checkins || {})[today]);
      return list.slice(0, 40).map((r) => ({ title: r.title, when: r.when, owner: r.owner || "ë¯¸ì???, checkedToday: !!(r.checkins || {})[today], streak: streakOf(r.checkins || {}, today) }));
    }
    if (name === "searchCheckitems") {
      let list = checkitems;
      if (args.tab) list = list.filter((c) => c.tab === args.tab);
      if (args.onlyPending) list = list.filter((c) => !c.done);
      if (args.onlyOverdue) list = list.filter((c) => { const dd = dayDiff(c.due); return dd !== null && dd < 0 && !c.done; });
      return list.slice(0, 40).map((c) => ({ title: c.title, tab: c.tab, done: c.done, start: c.start || null, due: c.due || null }));
    }
    if (name === "searchIssues") {
      let list = allIssues;
      if (args.onlyUnresolved) list = list.filter((i) => !i.resolved);
      return list.slice(0, 40).map((i) => ({ text: i.text, source: i.src, related: i.routineTitle, owner: i.owner || "ë¯¸ì???, resolved: i.resolved }));
    }
    if (name === "getTaskDetail") {
      const kw = (args.titleKeyword || "").trim();
      if (!kw) return { error: "titleKeywordê°€ ?„ìš”?©ë‹ˆ??" };
      const t = d.tasks.find((x) => !x.deleted && x.title.includes(kw));
      if (!t) return { error: `"${kw}"ë¥??¬í•¨???…ë¬´ë¥?ì°¾ì? ëª»í–ˆ?µë‹ˆ??` };
      return {
        title: t.title,
        board: t.boardId || "ê³µìš©",
        channel: t.channel,
        brand: t.brand || null,
        type: t.type,
        owner: t.owner || "ë¯¸ì???,
        status: t.status,
        due: t.due || null,
        start: t.start || null,
        priority: t.priority,
        progress: t.progress || 0,
        memo: t.memo || "(ë©”ëª¨ ?†ìŒ)",
        checklist: (t.checklist || []).map((c) => ({ text: c.text, done: c.done, subs: (c.subs || []).map((s) => ({ text: s.text, done: s.done })) })),
        history: (t.history || []).map((h) => ({ author: h.author, text: h.text, when: fmtTs(h.ts) })),
        issues: (t.issues || []).map((i) => ({ text: i.text, resolved: i.resolved })),
      };
    }
    return { error: "?????†ëŠ” ?¨ìˆ˜" };
  }, [routines, checkitems, allIssues]);

  const sendAiMessage = async () => {
    const q = aiInput.trim();
    if (!q || aiLoading) return;
    setAiInput("");
    setAiMessages((m) => [...m, { role: "user", text: q }]);
    setAiLoading(true);
    try {
      if (!aiChatRef.current) {
        const ai = getAI(fbApp, { backend: new GoogleAIBackend() });
        const model = getGenerativeModel(ai, {
          model: "gemini-3.5-flash-lite",
          tools: aiTools,
          systemInstruction: "?¹ì‹ ?€ ShakeBaby ?€???…ë¬´ë³´ë“œ AI ë¹„ì„œ?…ë‹ˆ?? ?œê³µ???¨ìˆ˜ë¡??¤ì œ ?…ë¬´Â·ë°˜ë³µ?…ë¬´Â·ì²´í¬ë¦¬ìŠ¤?¸Â·ì´???°ì´?°ë? ì¡°íšŒ?´ì„œ, ?œêµ­?´ë¡œ ê°„ê²°?˜ê³  ?•í™•?˜ê²Œ ?µí•˜?¸ìš”. ?¹ì • ?…ë¬´ ?˜ë‚˜??ë©”ëª¨Â·ì§„í–‰ ?í™©Â·?ˆìŠ¤? ë¦¬Â·?¸ë? ?¨ê³„ì²˜ëŸ¼ êµ¬ì²´?ì¸ ?´ìš©??ë¬¼ì–´ë³´ë©´ getTaskDetail ?¨ìˆ˜ë¥??¬ìš©??ê·??…ë¬´???„ì²´ ?ì„¸ë¥??•ì¸?????µí•˜?¸ìš”. ?°ì´?°ë? ?˜ì •?˜ê±°??ë§Œë“¤ ?˜ëŠ” ?†ê³  ?¤ì§ ì¡°íšŒë§?ê°€?¥í•©?ˆë‹¤. ?«ì?€ ?´ë¦„?€ ?¨ìˆ˜ ê²°ê³¼???ˆëŠ” ê·¸ë?ë¡??¬ìš©?˜ê³  ì¶”ì¸¡?˜ì? ë§ˆì„¸??",
        });
        aiChatRef.current = model.startChat();
      }
      const chat = aiChatRef.current;
      let result = await chat.sendMessage(q);
      let calls = result.response.functionCalls();
      let guard = 0;
      while (calls && calls.length > 0 && guard < 5) {
        const parts = calls.map((c) => ({
          functionResponse: {
            name: c.name,
            response: { output: JSON.stringify(runAiFunction(c.name, c.args || {})) },
          },
        }));
        result = await chat.sendMessage(parts);
        calls = result.response.functionCalls();
        guard++;
      }
      setAiMessages((m) => [...m, { role: "ai", text: result.response.text() || "?µë???ë§Œë“¤ì§€ ëª»í–ˆ?µë‹ˆ??" }]);
    } catch (e) {
      setAiMessages((m) => [...m, { role: "ai", text: "?¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤: " + (e.message || "?????†ëŠ” ?¤ë¥˜") }]);
    }
    setAiLoading(false);
  };

  /* ?€?€ ?”ê°„ ì²´í¬ë¦¬ìŠ¤???€?€ */
  const monthlies=useMemo(()=>(data.monthlies||[]).filter((m)=>!m.deleted),[data.monthlies]);
  const mlyByMonth=(ym)=>monthlies.filter((m)=>m.month===ym).slice().sort((a,b)=>{if(a.done!==b.done)return a.done?1:-1;return(a.order??999)-(b.order??999);});
  const saveMly=()=>{
    if(!mlyDraft.title.trim())return;
    const now=Date.now();const isNew=!!mlyDraft._new;
    const rec={...mlyDraft,updatedAt:now,updatedBy:me,createdAt:mlyDraft.createdAt||now,subs:mlyDraft.subs||[],history:mlyDraft.history||[]};
    delete rec._new;
    commit((d)=>{const list=d.monthlies||[];const ex=list.some((x)=>x.id===rec.id);
      return{...d,monthlies:ex?list.map((x)=>x.id===rec.id?rec:x):[...list,rec]};},
      [{id:uid(),ts:now,who:me||"?µëª…",taskId:rec.id,taskTitle:rec.title,action:isNew?"?”ê°„??ª© ?ì„±":"?”ê°„??ª© ?˜ì •",detail:rec.month}]);
    setMlyDraft(null);
  };
  const toggleMly=(m)=>{if(!canEdit)return;const willDone=!m.done;commit((d)=>({...d,monthlies:(d.monthlies||[]).map((x)=>x.id===m.id?{...x,done:willDone,doneAt:willDone?Date.now():null,updatedAt:Date.now()}:x)}),[]);};
  const toggleMlySub=(m,sid)=>{if(!canEdit)return;commit((d)=>({...d,monthlies:(d.monthlies||[]).map((x)=>x.id===m.id?{...x,subs:(x.subs||[]).map((s)=>s.id===sid?{...s,done:!s.done}:s),updatedAt:Date.now()}:x)}),[]);};
  const removeMly=(m)=>{commit((d)=>({...d,monthlies:(d.monthlies||[]).map((x)=>x.id===m.id?{...x,deleted:true,updatedAt:Date.now()}:x)}),[]);setMlyDraft(null);};
  const duplicateMlyToNextMonth=(m)=>{
    const [y,mo]=m.month.split("-").map(Number);
    const nd=new Date(y,mo,1);
    const nextMonth=`${nd.getFullYear()}-${String(nd.getMonth()+1).padStart(2,"0")}`;
    const now=Date.now();
    const copy={id:uid(),month:nextMonth,title:m.title,desc:m.desc||"",done:false,doneAt:null,
      subs:(m.subs||[]).map((s)=>({id:uid(),text:s.text,done:false,history:[]})),
      history:[],createdAt:now,updatedAt:now,createdBy:me};
    commit((d)=>({...d,monthlies:[...(d.monthlies||[]),copy]}),[mkLog("?”ê°„??ª© ë³µì‚¬",null,`${copy.title} -> ${nextMonth}`)]);
    setMlyDraft(null);
    setMlyDate(nextMonth);
  };
  const editMlyHistory=(hid,text)=>{
    const t=text.trim();if(!t)return;
    setMlyDraft((d)=>({...d,history:(d.history||[]).map((h)=>h.id===hid?{...h,text:t,edited:true}:h)}));
  };
  const removeMlyHistory=(hid)=>{
    setMlyDraft((d)=>({...d,history:(d.history||[]).filter((h)=>h.id!==hid)}));
  };
  const addMlySubHistory=(subId,text)=>{
    const t=text.trim();if(!t)return;
    const entry={id:uid(),text:t,author:me||"?µëª…",ts:Date.now()};
    setMlyDraft((d)=>({...d,subs:d.subs.map((s)=>s.id===subId?{...s,history:[...(s.history||[]),entry]}:s)}));
  };
  const editMlySubHistory=(subId,hid,text)=>{
    const t=text.trim();if(!t)return;
    setMlyDraft((d)=>({...d,subs:d.subs.map((s)=>s.id===subId?{...s,history:(s.history||[]).map((h)=>h.id===hid?{...h,text:t,edited:true}:h)}:s)}));
  };
  const removeMlySubHistory=(subId,hid)=>{
    setMlyDraft((d)=>({...d,subs:d.subs.map((s)=>s.id===subId?{...s,history:(s.history||[]).filter((h)=>h.id!==hid)}:s)}));
  };
  const addMlySubHistoryDirect=(monthlyId,subId,text)=>{
    const t=text.trim();if(!t)return;
    const entry={id:uid(),text:t,author:me||"?µëª…",ts:Date.now()};
    commit((d)=>({...d,monthlies:(d.monthlies||[]).map((m)=>m.id===monthlyId?{...m,subs:(m.subs||[]).map((s)=>s.id===subId?{...s,history:[...(s.history||[]),entry]}:s),updatedAt:Date.now()}:m)}),[]);
  };
  const editMlySubHistoryDirect=(monthlyId,subId,hid,text)=>{
    const t=text.trim();if(!t)return;
    commit((d)=>({...d,monthlies:(d.monthlies||[]).map((m)=>m.id===monthlyId?{...m,subs:(m.subs||[]).map((s)=>s.id===subId?{...s,history:(s.history||[]).map((h)=>h.id===hid?{...h,text:t,edited:true}:h)}:s),updatedAt:Date.now()}:m)}),[]);
  };
  const removeMlySubHistoryDirect=(monthlyId,subId,hid)=>{
    commit((d)=>({...d,monthlies:(d.monthlies||[]).map((m)=>m.id===monthlyId?{...m,subs:(m.subs||[]).map((s)=>s.id===subId?{...s,history:(s.history||[]).filter((h)=>h.id!==hid)}:s),updatedAt:Date.now()}:m)}),[]);
  };
  const addMlySubDirect=(monthlyId,text)=>{
    const t=text.trim();if(!t)return;
    const sub={id:uid(),text:t,done:false,history:[],subsubs:[]};
    commit((d)=>({...d,monthlies:(d.monthlies||[]).map((m)=>m.id===monthlyId?{...m,subs:[...(m.subs||[]),sub],updatedAt:Date.now()}:m)}),[]);
  };
  const addMlySubsubDirect=(monthlyId,subId,text)=>{
    const t=text.trim();if(!t)return;
    const item={id:uid(),text:t,done:false};
    commit((d)=>({...d,monthlies:(d.monthlies||[]).map((m)=>m.id===monthlyId?{...m,subs:(m.subs||[]).map((s)=>s.id===subId?{...s,subsubs:[...(s.subsubs||[]),item]}:s),updatedAt:Date.now()}:m)}),[]);
  };
  const toggleMlySubsubDirect=(monthlyId,subId,subsubId)=>{
    commit((d)=>({...d,monthlies:(d.monthlies||[]).map((m)=>m.id===monthlyId?{...m,subs:(m.subs||[]).map((s)=>s.id===subId?{...s,subsubs:(s.subsubs||[]).map((x)=>x.id===subsubId?{...x,done:!x.done}:x)}:s),updatedAt:Date.now()}:m)}),[]);
  };
  const removeMlySubsubDirect=(monthlyId,subId,subsubId)=>{
    commit((d)=>({...d,monthlies:(d.monthlies||[]).map((m)=>m.id===monthlyId?{...m,subs:(m.subs||[]).map((s)=>s.id===subId?{...s,subsubs:(s.subsubs||[]).filter((x)=>x.id!==subsubId)}:s),updatedAt:Date.now()}:m)}),[]);
  };

  /* ?€?€ ë°˜ë³µ?…ë¬´ 3???€ë¶„ë¥˜>ì¤‘ë¶„ë¥??Œë¶„ë¥? ?€?€ */
  const rItems=useMemo(()=>(data.rItems||[]).filter((x)=>!x.deleted),[data.rItems]);
  const riTree=useMemo(()=>{
    const cats=[];
    rItems.forEach((it)=>{
      let cat=cats.find((c)=>c.name===it.cat);
      if(!cat){cat={name:it.cat,subs:[]};cats.push(cat);}
      let sub=cat.subs.find((s)=>s.name===it.sub);
      if(!sub){sub={name:it.sub,items:[]};cat.subs.push(sub);}
      sub.items.push(it);
    });
    cats.forEach((c)=>c.subs.forEach((s)=>s.items.sort((a,b)=>(a.order??999)-(b.order??999))));
    return cats;
  },[rItems]);
  const riCatNames=useMemo(()=>[...new Set(rItems.map((x)=>x.cat))].filter(Boolean).sort(),[rItems]);
  const riSubNames=useMemo(()=>(cat)=>[...new Set(rItems.filter((x)=>x.cat===cat).map((x)=>x.sub))].filter(Boolean).sort(),[rItems]);
  const saveRi=()=>{
    const {cat,sub,title}=riAdd;
    if(!cat?.trim()||!sub?.trim()||!title?.trim()){alert("?€ë¶„ë¥˜Â·ì¤‘ë¶„ë¥˜Â·ì†Œë¶„ë¥˜ë¥?ëª¨ë‘ ?…ë ¥?˜ì„¸??");return;}
    const now=Date.now();
    if(riAdd.id){
      commit((d)=>({...d,rItems:(d.rItems||[]).map((x)=>x.id===riAdd.id?{...x,cat:cat.trim(),sub:sub.trim(),title:title.trim(),updatedAt:now}:x)}),[mkLog("ë°˜ë³µ??ª© ?˜ì •",null,title)]);
    }else{
      const rec={id:uid(),cat:cat.trim(),sub:sub.trim(),title:title.trim(),checkins:{},createdAt:now,updatedAt:now,createdBy:me};
      commit((d)=>({...d,rItems:[...(d.rItems||[]),rec]}),[mkLog("ë°˜ë³µ??ª© ì¶”ê?",null,title)]);
    }
    setRiAdd(null);
  };
  const toggleRi=(it,date)=>{
    if(!canEdit)return;
    commit((d)=>({...d,rItems:(d.rItems||[]).map((x)=>{
      if(x.id!==it.id)return x;
      const ck={...(x.checkins||{})};
      if(ck[date])delete ck[date]; else ck[date]={by:me||"?µëª…",ts:Date.now()};
      return {...x,checkins:ck,updatedAt:Date.now()};
    })}),[]);
  };
  const removeRi=(it)=>{commit((d)=>({...d,rItems:(d.rItems||[]).map((x)=>x.id===it.id?{...x,deleted:true,updatedAt:Date.now()}:x)}),[mkLog("ë°˜ë³µ??ª© ?? œ",null,it.title)]);setRiAdd(null);};
  const duplicateRi=(it)=>{
    const now=Date.now();
    const copy={id:uid(),cat:it.cat,sub:it.sub,title:it.title+" (ë³µì‚¬)",checkins:{},issues:[],createdAt:now,updatedAt:now,createdBy:me};
    commit((d)=>({...d,rItems:[...(d.rItems||[]),copy]}),[mkLog("ë°˜ë³µ??ª© ë³µì‚¬",null,copy.title)]);
  };
  const reorderRi=(cat,sub,fromId,toId)=>{
    if(!canEdit||fromId===toId)return;
    const group=riTree.find((c)=>c.name===cat)?.subs.find((s)=>s.name===sub)?.items||[];
    const fi=group.findIndex((x)=>x.id===fromId);
    const ti=group.findIndex((x)=>x.id===toId);
    if(fi<0||ti<0)return;
    const arr=[...group];
    const [moved]=arr.splice(fi,1);
    arr.splice(ti,0,moved);
    const now=Date.now();
    commit((d)=>({...d,rItems:(d.rItems||[]).map((x)=>{
      const pos=arr.findIndex((a)=>a.id===x.id);
      return pos>=0?{...x,order:pos,updatedAt:now}:x;
    })}),[]);
  };

  const riIssues=useMemo(()=>{
    const out=[];
    rItems.forEach((it)=>(it.issues||[]).forEach((i)=>out.push({...i,itemId:it.id,path:`${it.cat} > ${it.sub} > ${it.title}`})));
    return out.sort((a,b)=>{
      if(!!a.resolved!==!!b.resolved)return a.resolved?1:-1;
      const ao=a.order,bo=b.order;
      if(ao!=null&&bo!=null)return ao-bo;
      if(ao!=null)return -1;
      if(bo!=null)return 1;
      return b.ts-a.ts;
    });
  },[rItems]);
  const addRiIssue=(itemId,text)=>{
    const t=text.trim();if(!t)return;
    const iss={id:uid(),text:t,author:me||"?µëª…",ts:Date.now(),resolved:false,subs:[]};
    commit((d)=>({...d,rItems:(d.rItems||[]).map((x)=>x.id===itemId?{...x,issues:[iss,...(x.issues||[])],updatedAt:Date.now()}:x)}),[mkLog("ë°˜ë³µ??ª© ?´ìŠˆ ?±ë¡",null,t.slice(0,30))]);
  };
  const toggleRiIssue=(itemId,issueId)=>{
    commit((d)=>({...d,rItems:(d.rItems||[]).map((x)=>x.id!==itemId?x:{...x,issues:(x.issues||[]).map((i)=>i.id===issueId?{...i,resolved:!i.resolved,resolvedBy:me}:i),updatedAt:Date.now()})}),[]);
  };
  const removeRiIssue=(itemId,issueId)=>{
    commit((d)=>({...d,rItems:(d.rItems||[]).map((x)=>x.id!==itemId?x:{...x,issues:(x.issues||[]).filter((i)=>i.id!==issueId),updatedAt:Date.now()})}),[]);
  };
  const duplicateRiIssue=(itemId,issue)=>{
    const copy={id:uid(),text:issue.text+" (ë³µì‚¬)",author:me||"?µëª…",ts:Date.now(),resolved:false,subs:[]};
    commit((d)=>({...d,rItems:(d.rItems||[]).map((x)=>x.id===itemId?{...x,issues:[copy,...(x.issues||[])],updatedAt:Date.now()}:x)}),[mkLog("ë°˜ë³µ??ª© ?´ìŠˆ ë³µì‚¬",null,copy.text.slice(0,30))]);
  };
  const editRiIssueText=(itemId,issueId,text)=>{
    const t=text.trim();if(!t)return;
    commit((d)=>({...d,rItems:(d.rItems||[]).map((x)=>x.id!==itemId?x:{...x,issues:(x.issues||[]).map((i)=>i.id===issueId?{...i,text:t,edited:true}:i),updatedAt:Date.now()})}),[]);
  };
  const addRiIssueSub=(itemId,issueId,text)=>{
    const t=text.trim();if(!t)return;
    const sub={id:uid(),text:t,author:me||"?µëª…",ts:Date.now()};
    commit((d)=>({...d,rItems:(d.rItems||[]).map((x)=>x.id!==itemId?x:{...x,issues:(x.issues||[]).map((i)=>i.id===issueId?{...i,subs:[...(i.subs||[]),sub]}:i),updatedAt:Date.now()})}),[]);
  };
  const removeRiIssueSub=(itemId,issueId,subId)=>{
    commit((d)=>({...d,rItems:(d.rItems||[]).map((x)=>x.id!==itemId?x:{...x,issues:(x.issues||[]).map((i)=>i.id===issueId?{...i,subs:(i.subs||[]).filter((s)=>s.id!==subId)}:i),updatedAt:Date.now()})}),[]);
  };
  const editRiIssueSub=(itemId,issueId,subId,text)=>{
    const t=text.trim();if(!t)return;
    commit((d)=>({...d,rItems:(d.rItems||[]).map((x)=>x.id!==itemId?x:{...x,issues:(x.issues||[]).map((i)=>i.id===issueId?{...i,subs:(i.subs||[]).map((s)=>s.id===subId?{...s,text:t,edited:true}:s)}:i),updatedAt:Date.now()})}),[]);
  };
  const reorderRiIssue=(fromId,toId)=>{
    if(!canEdit||fromId===toId)return;
    const ordered=riIssues.filter((i)=>!i.resolved);
    const fi=ordered.findIndex((i)=>i.id===fromId);
    const ti=ordered.findIndex((i)=>i.id===toId);
    if(fi<0||ti<0)return;
    const arr=[...ordered];
    const [moved]=arr.splice(fi,1);
    arr.splice(ti,0,moved);
    const now=Date.now();
    const orderMap=new Map(arr.map((i,idx)=>[i.id,idx]));
    commit((d)=>({...d,rItems:(d.rItems||[]).map((x)=>{
      if(!(x.issues||[]).length)return x;
      let changed=false;
      const issues=x.issues.map((i)=>{
        if(orderMap.has(i.id)){changed=true;return {...i,order:orderMap.get(i.id)};}
        return i;
      });
      return changed?{...x,issues,updatedAt:now}:x;
    })}),[]);
  };

  /* ?€?€ ë©”ëª¨ ?€?€ */
  const memoItems=useMemo(()=>(data.memoItems||[]).filter((x)=>!x.deleted),[data.memoItems]);
  const memoCatNames=useMemo(()=>[...new Set(memoItems.map((x)=>x.cat).filter(Boolean))].sort(),[memoItems]);
  const memoSubNames=useMemo(()=>(cat)=>[...new Set(memoItems.filter((x)=>x.cat===cat).map((x)=>x.sub).filter(Boolean))].sort(),[memoItems]);
  const memoFiltered=useMemo(()=>{
    let list=memoItems;
    if(memoCatFilter!=="?„ì²´")list=list.filter((x)=>(x.cat||"ë¯¸ë¶„ë¥?)===memoCatFilter);
    const q=memoQuery.trim().toLowerCase();
    if(q)list=list.filter((x)=>`${x.cat||""} ${x.sub||""} ${x.title||""} ${x.text||""} ${(x.subs||[]).map((s)=>s.text).join(" ")}`.toLowerCase().includes(q));
    return list.slice().sort((a,b)=>(a.order??999)-(b.order??999));
  },[memoItems,memoCatFilter,memoQuery]);
  const memoCatOptions=useMemo(()=>["?„ì²´",...new Set(memoItems.map((x)=>x.cat||"ë¯¸ë¶„ë¥?))],[memoItems]);
  const saveMemo=()=>{
    const text=(memoDraft.text||"").trim();
    if(!text){alert("ë©”ëª¨ ?´ìš©???…ë ¥?˜ì„¸??");return;}
    const now=Date.now();
    if(memoDraft.id){
      commit((d)=>({...d,memoItems:(d.memoItems||[]).map((x)=>x.id===memoDraft.id?{...x,cat:(memoDraft.cat||"").trim(),sub:(memoDraft.sub||"").trim(),title:(memoDraft.title||"").trim(),text,updatedAt:now}:x)}),[mkLog("ë©”ëª¨ ?˜ì •",null,text.slice(0,30))]);
    }else{
      const rec={id:uid(),cat:(memoDraft.cat||"").trim(),sub:(memoDraft.sub||"").trim(),title:(memoDraft.title||"").trim(),text,subs:[],createdAt:now,updatedAt:now,createdBy:me};
      commit((d)=>({...d,memoItems:[...(d.memoItems||[]),rec]}),[mkLog("ë©”ëª¨ ?ì„±",null,text.slice(0,30))]);
    }
    setMemoDraft(null);
  };
  const removeMemo=(m)=>{commit((d)=>({...d,memoItems:(d.memoItems||[]).map((x)=>x.id===m.id?{...x,deleted:true,updatedAt:Date.now()}:x)}),[mkLog("ë©”ëª¨ ?? œ",null,(m.text||"").slice(0,30))]);setMemoDraft(null);};
  const duplicateMemo=(m)=>{
    const now=Date.now();
    const copy={id:uid(),cat:m.cat,sub:m.sub,title:m.title?m.title+" (ë³µì‚¬)":"",text:m.text,subs:[],order:null,createdAt:now,updatedAt:now,createdBy:me};
    commit((d)=>({...d,memoItems:[...(d.memoItems||[]),copy]}),[mkLog("ë©”ëª¨ ë³µì‚¬",null,(copy.text||"").slice(0,30))]);
  };
  const reorderMemo=(fromId,toId)=>{
    if(!canEdit||fromId===toId)return;
    const arr=[...memoFiltered];
    const fi=arr.findIndex((x)=>x.id===fromId);
    const ti=arr.findIndex((x)=>x.id===toId);
    if(fi<0||ti<0)return;
    const [moved]=arr.splice(fi,1);
    arr.splice(ti,0,moved);
    const now=Date.now();
    commit((d)=>({...d,memoItems:(d.memoItems||[]).map((x)=>{
      const pos=arr.findIndex((a)=>a.id===x.id);
      return pos>=0?{...x,order:pos,updatedAt:now}:x;
    })}),[]);
  };
  const addMemoSub=(memoId,text)=>{
    const t=text.trim();if(!t)return;
    const sub={id:uid(),text:t,author:me||"?µëª…",ts:Date.now()};
    commit((d)=>({...d,memoItems:(d.memoItems||[]).map((x)=>x.id===memoId?{...x,subs:[...(x.subs||[]),sub],updatedAt:Date.now()}:x)}),[]);
  };
  const editMemoSub=(memoId,subId,text)=>{
    const t=text.trim();if(!t)return;
    commit((d)=>({...d,memoItems:(d.memoItems||[]).map((x)=>x.id===memoId?{...x,subs:(x.subs||[]).map((s)=>s.id===subId?{...s,text:t,edited:true}:s),updatedAt:Date.now()}:x)}),[]);
  };
  const removeMemoSub=(memoId,subId)=>{
    commit((d)=>({...d,memoItems:(d.memoItems||[]).map((x)=>x.id===memoId?{...x,subs:(x.subs||[]).filter((s)=>s.id!==subId),updatedAt:Date.now()}:x)}),[]);
  };

  const exportJson=()=>{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(dataRef.current,null,2)],{type:"application/json"}));a.download=`work-board-${todayStr()}.json`;a.click();};
  const importJson=async(file)=>{try{const p=JSON.parse(await file.text());if(!Array.isArray(p.tasks))throw new Error();commit((d)=>mergeData(d,{...emptyData(),...p}),[mkLog("ë°±ì—… ê°€?¸ì˜¤ê¸?,null,`${p.tasks.length}ê±?)]);} catch(e){alert("?½ì„ ???†ëŠ” ?Œì¼?…ë‹ˆ??");}};

  /* ?€?€ ?Œë¦¼ (ê³µìš© ë³´ë“œ ?„ìš©, ???´ë ¤?ˆì„ ?Œë§Œ) ?€?€ */
  const notify=useCallback((title,body)=>{
    if(!notifOn||typeof Notification==="undefined")return;
    try{const n=new Notification(title,{body,icon:"/favicon.ico"});n.onclick=()=>{window.focus();n.close();};}catch(e){}
  },[notifOn]);

  const enableNotif=()=>{
    if(typeof Notification==="undefined"){alert("??ë¸Œë¼?°ì????Œë¦¼??ì§€?í•˜ì§€ ?ŠìŠµ?ˆë‹¤.");return;}
    if(Notification.permission==="granted"){setNotifOn(true);return;}
    Notification.requestPermission().then((p)=>{setNotifOn(p==="granted");if(p!=="granted")alert("?Œë¦¼??ì°¨ë‹¨?ìŠµ?ˆë‹¤. ë¸Œë¼?°ì? ì£¼ì†Œì°??¼ìª½ ?ë¬¼???„ì´ì½˜ì—???Œë¦¼???ˆìš©?´ì£¼?¸ìš”.");});
  };

  useEffect(()=>{
    if(!notifOn){prevTasksRef.current=data.tasks;return;}
    const prev=prevTasksRef.current;
    if(prev){
      const prevMap=new Map(prev.map((t)=>[t.id,t]));
      data.tasks.forEach((t)=>{
        if((t.boardId||"ê³µìš©")!=="ê³µìš©"||t.deleted)return;
        const p=prevMap.get(t.id);
        if(!p){
          if(t.owner===me&&t.createdBy&&t.createdBy!==me)notify("???…ë¬´ê°€ ë°°ì •?ì–´??,`${t.createdBy}?˜ì´ "${t.title}" ?…ë¬´ë¥?ë°°ì •?ˆìŠµ?ˆë‹¤.`);
          return;
        }
        if(t.updatedBy===me)return;
        if(t.owner===me&&p.owner!==me)notify("???…ë¬´ê°€ ë°°ì •?ì–´??,`${t.updatedBy||"?€??}?˜ì´ "${t.title}" ?…ë¬´ë¥?ë°°ì •?ˆìŠµ?ˆë‹¤.`);
        if(t.status==="doing"&&p.status!=="doing"&&t.createdBy===me)notify("?…ë¬´ê°€ ?œì‘?ì–´??,`${t.owner||"?´ë‹¹??}?˜ì´ "${t.title}"ë¥?ì§„í–‰ì¤‘ìœ¼ë¡???²¼?µë‹ˆ??`);
        if((t.memo||"").trim()&&(t.memo||"")!==(p.memo||"")&&(t.owner===me||t.createdBy===me))notify("ë©”ëª¨ê°€ ?±ë¡?ì–´??,`"${t.title}": ${t.memo.slice(0,50)}`);
      });
    }
    prevTasksRef.current=data.tasks;
  },[data.tasks,notifOn,me,notify]);

  useEffect(()=>{
    if(!notifOn)return;
    const check=()=>{
      data.tasks.forEach((t)=>{
        if((t.boardId||"ê³µìš©")!=="ê³µìš©"||t.deleted||t.archived||t.status==="done"||t.owner!==me||!t.due)return;
        const dd=dayDiff(t.due);if(dd===null)return;
        let key=null,ttl=null,body=null;
        if(dd<0){key=`overdue:${t.id}`;ttl="ë§ˆê°??ì§€?¬ì–´??;body=`"${t.title}" ë§ˆê° ${Math.abs(dd)}??ì§€??;}
        else if(dd===0){key=`due0:${t.id}`;ttl="?¤ëŠ˜ ë§ˆê°?´ì—??;body=`"${t.title}"`;}
        else if(dd===1){key=`due1:${t.id}`;ttl="ë§ˆê°???„ë°•?ˆì–´??;body=`"${t.title}" ?´ì¼ ë§ˆê°`;}
        if(key&&!notifiedRef.current.has(key)){notify(ttl,body);notifiedRef.current.add(key);}
      });
    };
    check();
    const iv=setInterval(check,5*60*1000);
    return()=>clearInterval(iv);
  },[notifOn,data.tasks,me,notify]);
  useEffect(()=>{const h=(e)=>{if(e.key==="Escape"){setDraft(null);setConfirmBox(null);}};window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h);},[]);

  const renderCard=(t)=>{
    const d=dayDiff(t.due),late=d!==null&&d<0&&t.status!=="done",soon=d!==null&&d>=0&&d<=2&&t.status!=="done";
    const ck=t.checklist||[],ckDone=ck.filter((c)=>c.done).length;
    return(
      <div key={t.id} className={"card"+(late?" late":"")+(t.status==="done"?" done":"")+(dragId===t.id?" drag":"")} style={{"--ch":chColor(t.channel)}}
        draggable={canEdit} onDragStart={(e)=>{setDragId(t.id);e.dataTransfer.effectAllowed="move";}} onDragEnd={()=>{setDragId(null);setOverCol(null);}} onClick={()=>openTask(t)}>
        <div className="cmeta"><span className="ch">{t.channel}</span><span>Â·</span><span>{t.type}</span>{t.repeat&&t.repeat!=="none"&&<><span>Â·</span><span>??REPEATS.find((r)=>r.id===t.repeat)?.label}</span></>}</div>
        <p className="ctitle">{t.title}</p>
        {!!(t.tags||[]).length&&<div className="ctags">{t.tags.map((g)=><span key={g} className="tag">{g}</span>)}</div>}
        {(t.progress>0||ck.length>0)&&(()=>{
          const pct=t.progress!=null&&t.progress>0?t.progress:(ck.length?Math.round(ckDone/ck.length*100):0);
          return <div className="cbar" title={`ì§„í–‰ë¥?${pct}%`}><i style={{width:pct+"%"}} /></div>;
        })()}
        <div className="cfoot">
          <span style={{display:"inline-flex",alignItems:"center",gap:7}}>
            {t.owner?<span className={"ownerchip"+(t.owner===me?" me":"")}>{t.owner}</span>:<span style={{color:"var(--ink3)"}}>ë¯¸ì???/span>}
            {t.due&&<span className={"due"+(late?" late":soon?" soon":"")}>{t.start?t.start.slice(5)+"~":""}{t.due.slice(5)}{late?` +${Math.abs(d)}d`:""}</span>}
          </span>
          <span style={{display:"flex",gap:6,alignItems:"center"}}>
            <span className="icons">{ck.length>0&&<span>??ckDone}/{ck.length}</span>}{!!(t.comments||[]).length&&<span>?’¬{t.comments.length}</span>}{!!(t.links||[]).length&&<span>?”—{t.links.length}</span>}</span>
            <span className={"pri"+(t.priority==="high"?" high":"")}>{PRIORITIES.find((p)=>p.id===t.priority)?.label}</span>
          </span>
        </div>
      </div>
    );
  };

  if(!ready)return<div className="wb"><style>{CSS}</style><div className="eyebrow">Team Work Board</div><p style={{fontFamily:"monospace",fontSize:12,color:"#8F959C"}}>ë³´ë“œë¥?ë¶ˆëŸ¬?¤ëŠ” ì¤?/p></div>;

  if(!me){
    return (
      <div className="wb"><style>{CSS}</style>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:20}}>
          <div className="modal" style={{maxWidth:400,margin:0}}>
            <h2>{signupMode?"? ê·œ ê³„ì • ?±ë¡":"ë¡œê·¸??}</h2>
            <div className="modal-body">
              <div className="fld"><label>?´ë¦„</label>
                <input list="wb-memlist" autoFocus value={nameInput} onChange={(e)=>setNameInput(e.target.value)}
                  onKeyDown={(e)=>{if(e.nativeEvent.isComposing)return;if(e.key==="Enter"&&!signupMode)doLogin();}}
                  placeholder="?? ê¹€?„ë?" />
                <datalist id="wb-memlist">{data.members.map((m)=><option key={m.name} value={m.name} />)}</datalist>
              </div>
              <div className="fld"><label>ë¹„ë?ë²ˆí˜¸</label>
                <input type="password" value={loginPw} onChange={(e)=>setLoginPw(e.target.value)}
                  onKeyDown={(e)=>{if(e.key==="Enter"&&!signupMode)doLogin();}}
                  placeholder="ë¹„ë?ë²ˆí˜¸" />
              </div>
              {signupMode&&(
                <div className="fld"><label>ë¹„ë?ë²ˆí˜¸ ?•ì¸</label>
                  <input type="password" value={signupPw2} onChange={(e)=>setSignupPw2(e.target.value)}
                    onKeyDown={(e)=>{if(e.key==="Enter")doSignup();}}
                    placeholder="ë¹„ë?ë²ˆí˜¸ ?¤ì‹œ ?…ë ¥" />
                </div>
              )}
              {data.members.length===0&&!signupMode&&<p className="hint" style={{color:"var(--pri)"}}>ì²??¬ìš©?ì…?ˆë‹¤. ? ê·œ ?±ë¡?¼ë¡œ ê´€ë¦¬ì ê³„ì •??ë§Œë“œ?¸ìš”.</p>}
            </div>
            <div className="modal-foot">
              <button className="btn ghost" onClick={()=>{setSignupMode(!signupMode);setLoginPw("");setSignupPw2("");}}>{signupMode?"??ë¡œê·¸?¸ìœ¼ë¡?:"? ê·œ ?±ë¡"}</button>
              <span className="spacer" />
              {signupMode
                ? <button className="btn-save" onClick={doSignup}>ê³„ì • ë§Œë“¤ê¸?/button>
                : <button className="btn-save" onClick={doLogin}>ë¡œê·¸??/button>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return(
    <div className="wb">
      <style>{CSS}</style>
      <div className="topbar">
        <div className="brand"><span className="logo">W</span>?…ë¬´ ë³´ë“œ</div>
        <span className="spacer" />
        <button className="who" onClick={()=>setPwChange({cur:"",next:"",next2:""})} title="ë¹„ë?ë²ˆí˜¸ ë³€ê²?>
          <span className="av">{(me||"?").slice(0,1)}</span>
          {me||"?´ë¦„ ?¤ì •"}<span className="role">{ROLES.find((r)=>r.id===myRole)?.label}</span>
        </button>
        <span className="save"><i className={"dot "+(saveState==="error"?"err":saveState==="idle"?"":"on")} />{saveState==="saving"?"?€??ì¤?:saveState==="saved"?"?€?¥ë¨":saveState==="error"?"?€???¤íŒ¨":saveState==="loading"?"ë¶ˆëŸ¬?¤ëŠ” ì¤?:"?™ê¸°?”ë¨"}</span>
        <button className="ghostw" onClick={()=>load()}>?ˆë¡œê³ ì¹¨</button>
        {!notifOn&&<button className="ghostw" onClick={enableNotif}>?”” ?Œë¦¼ ì¼œê¸°</button>}
        {notifOn&&<span style={{fontSize:12,color:"var(--ok)",fontWeight:700,display:"inline-flex",alignItems:"center",gap:4}}>?”” ?Œë¦¼ ì¼œì§</span>}
        <button className="ghostw" onClick={logout}>ë¡œê·¸?„ì›ƒ</button>
      </div>
      <div className="tabs">
        {[{id:"board",label:"ë³´ë“œ",n:live.length},{id:"routine",label:"ë°˜ë³µ?…ë¬´",n:rItems.filter((it)=>!(it.checkins||{})[riDate]).length},{id:"monthly",label:"?”ê°„ ?…ë¬´",n:mlyByMonth(mlyDate).filter((m)=>!m.done).length},{id:"checklist",label:"ì²´í¬ë¦¬ìŠ¤??,n:checkitems.filter((c)=>!c.done).length},{id:"memo",label:"ë©”ëª¨",n:memoItems.length},{id:"issue",label:"?´ìŠˆ",n:allIssues.filter((i)=>!i.resolved).length},{id:"archive",label:"ë³´ê???,n:archived.length},{id:"log",label:"ë³€ê²??´ë ¥",n:null},{id:"ai",label:"AIë¹„ì„œ",n:null},{id:"team",label:"?€Â·?¤ì •",n:null}].map((t)=>(
          <button key={t.id} className={"tab"+(view===t.id?" sel":"")} onClick={()=>setView(t.id)}>{t.label}{t.n!==null&&<em>{t.n}</em>}</button>
        ))}
      </div>
      <div className="page">

      {view==="board"&&(<>
        <div className="boardtabs">
          {BOARDS.map((b)=>(
            <button key={b} className={"boardtab"+(curBoard===b?" sel":"")} onClick={()=>setCurBoard(b)}>
              {b==="ê³µìš©"?"ê³µìš© ë³´ë“œ":b+" ë³´ë“œ"}
              <em>{data.tasks.filter((t)=>!t.deleted&&!t.archived&&(t.boardId||"ê³µìš©")===b).length}</em>
            </button>
          ))}
        </div>
        <div className="metrics">
          <button className="metric cl" onClick={()=>{setOnlyLate(false);}}><span className="k">?„ì²´</span><span className="v">{stats.total}</span></button>
          <div className="metric"><span className="k">ì§„í–‰ì¤?/span><span className="v">{stats.doing}</span></div>
          <div className="metric"><span className="k">ë§ˆê° ?˜ë£¨ ??/span><span className={"v"+(stats.tomorrow?" wa":"")}>{stats.tomorrow}</span></div>
          <button className="metric cl" onClick={()=>{setOnlyLate(true);}}><span className="k">ì§€??/span><span className={"v"+(stats.late?" al":"")}>{stats.late}</span></button>
          <div className="metric"><span className="k">ë¯¸ì™„ë£?/span><span className="v">{stats.open}</span></div>
        </div>
        <div className="tools">
          <input className="inp" placeholder="ê²€?? value={q} onChange={(e)=>setQ(e.target.value)} style={{width:120}} />
          <select className="sel" value={fOwner} onChange={(e)=>setFOwner(e.target.value)}><option value="?„ì²´">?´ë‹¹???„ì²´</option>{owners.map((o)=><option key={o} value={o}>{o}</option>)}</select>
          <select className="sel" value={sortBy} onChange={(e)=>setSortBy(e.target.value)}><option value="due">ë§ˆê°?¼ìˆœ</option><option value="pri">?°ì„ ?œìœ„??/option><option value="upd">ìµœê·¼?˜ì •??/option></select>
          <span className="datefilt">
            <input type="date" className="sel" value={dateFrom} onChange={(e)=>setDateFrom(e.target.value)} title="?œì‘ ? ì§œ" />
            <span style={{color:"var(--ink3)"}}>~</span>
            <input type="date" className="sel" value={dateTo} onChange={(e)=>setDateTo(e.target.value)} title="ì¢…ë£Œ ? ì§œ" />
            {(dateFrom||dateTo)&&<button className="chip" onClick={()=>{setDateFrom("");setDateTo("");}}>? ì§œ ?´ì œ</button>}
          </span>
          <button className={"chip tog"+(onlyMine?" sel":"")} onClick={()=>setOnlyMine((v)=>!v)}>???…ë¬´</button>
          <button className={"chip tog"+(onlyLate?" sel":"")} onClick={()=>setOnlyLate((v)=>!v)}>ì§€?°ë§Œ</button>
          {allTags.length>0&&<select className="sel" value={fTag} onChange={(e)=>setFTag(e.target.value)}><option value="?„ì²´">?œê·¸ ?„ì²´</option>{allTags.map((g)=><option key={g} value={g}>{g}</option>)}</select>}
          <span className="mdsep" />
          {(()=>{
            const pid=parentOf(fCh);
            if(pid){
              const par=data.channels.find((c)=>c.id===pid);
              return <>
                <button className="chip back" onClick={()=>setFCh("?„ì²´")}>???„ì²´</button>
                <button className={"chip"+(fCh===pid?" sel":"")} onClick={()=>setFCh(pid)}><b style={{background:par?.color||"#888"}} />{pid} ?„ì²´</button>
                {subsOf(pid).map((k)=><button key={k.id} className={"chip"+(fCh===k.id?" sel":"")} onClick={()=>setFCh(k.id)}><b style={{background:k.color}} />{k.id}</button>)}
              </>;
            }
            const kids=fCh!=="?„ì²´"?subsOf(fCh):[];
            if(kids.length){
              const par=data.channels.find((c)=>c.id===fCh);
              return <>
                <button className="chip back" onClick={()=>setFCh("?„ì²´")}>???„ì²´</button>
                <button className="chip sel"><b style={{background:par?.color||"#888"}} />{fCh} ?„ì²´</button>
                {kids.map((k)=><button key={k.id} className="chip" onClick={()=>setFCh(k.id)}><b style={{background:k.color}} />{k.id}</button>)}
              </>;
            }
            return <>
              <button className={"chip"+(fCh==="?„ì²´"?" sel":"")} onClick={()=>setFCh("?„ì²´")}>?„ì²´</button>
              {topChannels.map((c)=>{
                const has=subsOf(c.id).length;
                return <button key={c.id} className={"chip"+(fCh===c.id?" sel":"")} onClick={()=>setFCh(c.id)}>
                  <b style={{background:c.color}} />{c.id}{has>0&&<span style={{fontSize:10,opacity:.65}}>??has}</span>}
                </button>;
              })}
            </>;
          })()}
          <span className="spacer" />{canEdit&&<button className="btn" onClick={()=>openNew()}>?…ë¬´ ì¶”ê?</button>}
        </div>
      </>)}

      {view==="board"&&(
        <div className="board">{cols.map((col)=>{const items=visible.filter((t)=>t.status===col.id);return(
          <div key={col.id} className="colwrap">
            <div className="colhead"><span>{col.label}</span><em>{items.length}</em></div>
            <div className={"colbody"+(overCol===col.id?" over":"")} onDragOver={(e)=>{if(dragId){e.preventDefault();setOverCol(col.id);}}} onDragLeave={()=>setOverCol((c)=>c===col.id?null:c)} onDrop={(e)=>{e.preventDefault();const t=data.tasks.find((x)=>x.id===dragId);if(t)moveTask(t,col.id);setDragId(null);setOverCol(null);}}>
              {items.length===0&&<div className="empty">{dragId?"?¬ê¸°ë¡??“ê¸°":col.id==="todo"?"?…ë¬´ë¥?ì¶”ê????œì‘?˜ì„¸??:"ë¹„ì–´ ?ˆìŒ"}</div>}
              {items.map(renderCard)}
              {canEdit&&<button className="addbtn" onClick={()=>openNew(col.id)}>+ ì¹´ë“œ ì¶”ê?</button>}
            </div>
          </div>
        );})}</div>
      )}

      {view==="routine"&&(()=>{
        const toggleCollapse=(key)=>setRiCollapse((p)=>({...p,[key]:!p[key]}));
        const totalToday=rItems.length;
        const doneToday=rItems.filter((it)=>(it.checkins||{})[riDate]).length;
        return (
        <div>
          <div className="panel" style={{padding:14,marginBottom:12}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
              <div>
                <div style={{fontSize:14,fontWeight:800}}>ë°˜ë³µ ?…ë¬´</div>
                <div style={{fontFamily:"monospace",fontSize:11,color:"#8F959C",marginTop:3}}>{riDate.replace(/-/g,".")} Â· {doneToday}/{totalToday}</div>
              </div>
              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                <input type="date" className="sel" value={riDate} onChange={(e)=>e.target.value&&setRiDate(e.target.value)} />
                <button className="btn ghost" onClick={()=>setRiDate(todayStr())}>?¤ëŠ˜</button>
                {canEdit&&<button className="btn-save" onClick={()=>setRiAdd({cat:"",sub:"",title:""})}>+ ??ª© ì¶”ê?</button>}
              </div>
            </div>
          </div>

          <div className="panel" style={{padding:14,marginBottom:12}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}} onClick={()=>setRiIssueOpen(!riIssueOpen)}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span className="richev">{riIssueOpen?"??:"??}</span>
                <span style={{fontSize:14,fontWeight:800}}>?´ìŠˆ</span>
                <span className="ricount">{riIssues.filter((i)=>!i.resolved).length}ê±?ë¯¸í•´ê²?/span>
              </div>
            </div>
            {riIssueOpen&&(
              <div style={{marginTop:12}} onClick={(e)=>e.stopPropagation()}>
                <div style={{display:"flex",gap:7,marginBottom:10,flexWrap:"wrap"}}>
                  {[{id:"open",label:`ë¯¸í•´ê²?${riIssues.filter((i)=>!i.resolved).length}`},{id:"done",label:`?´ê²° ${riIssues.filter((i)=>i.resolved).length}`},{id:"all",label:`?„ì²´ ${riIssues.length}`}].map((f)=>(
                    <button key={f.id} className={"chip"+(riIssueFilter===f.id?" sel":"")} onClick={()=>setRiIssueFilter(f.id)}>{f.label}</button>
                  ))}
                  <input className="inp" style={{flex:1,minWidth:140}} placeholder="?´ìŠˆ ê²€??(?´ìš©Â·??ª©ëª?" value={riIssueQuery} onChange={(e)=>setRiIssueQuery(e.target.value)} />
                </div>
                {riIssues.filter((i)=>(riIssueFilter==="all"?true:riIssueFilter==="open"?!i.resolved:i.resolved)&&(!riIssueQuery.trim()||`${i.text} ${i.path}`.toLowerCase().includes(riIssueQuery.trim().toLowerCase()))).length===0&&<div className="hint" style={{marginBottom:10}}>?´ë‹¹?˜ëŠ” ?´ìŠˆê°€ ?†ìŠµ?ˆë‹¤</div>}
                {riIssues.filter((i)=>(riIssueFilter==="all"?true:riIssueFilter==="open"?!i.resolved:i.resolved)&&(!riIssueQuery.trim()||`${i.text} ${i.path}`.toLowerCase().includes(riIssueQuery.trim().toLowerCase()))).map((i)=>{
                  const expanded=!!riIssueExpand[i.id];
                  const editing=riIssueEditId===i.id;
                  return (
                  <div key={i.id} draggable={canEdit&&!i.resolved}
                    onDragStart={(e)=>{setRiIssueDrag(i.id);e.dataTransfer.effectAllowed="move";try{e.dataTransfer.setData("text/plain",i.id);}catch(err){}}}
                    onDragOver={(e)=>{e.preventDefault();e.dataTransfer.dropEffect="move";}}
                    onDrop={()=>{if(riIssueDrag)reorderRiIssue(riIssueDrag,i.id);setRiIssueDrag(null);}}
                    onDragEnd={()=>setRiIssueDrag(null)}
                    className={"iss"+(i.resolved?" done":"")+(riIssueDrag===i.id?" dragging":"")} style={{marginBottom:6,flexDirection:"column",alignItems:"stretch"}}>
                    <div style={{display:"flex",alignItems:"flex-start",gap:9}}>
                      <button className="issck" onClick={()=>toggleRiIssue(i.itemId,i.id)}>{i.resolved?"??:""}</button>
                      <div style={{flex:1,minWidth:0}}>
                        {editing
                          ? <textarea className="hinput" defaultValue={i.text} autoFocus style={{width:"100%"}}
                              onKeyDown={(e)=>{if(e.nativeEvent.isComposing||e.key!=="Enter"||e.shiftKey)return;e.preventDefault();editRiIssueText(i.itemId,i.id,e.target.value);setRiIssueEditId(null);}}
                              onBlur={(e)=>{editRiIssueText(i.itemId,i.id,e.target.value);setRiIssueEditId(null);}} />
                          : <div className="isstext" style={{whiteSpace:"pre-wrap"}}>{i.text}{i.edited&&<span style={{fontSize:10,color:"var(--ink3)"}}> (?˜ì •??</span>}</div>}
                        <div className="issmeta">{i.path} Â· {i.author} Â· {fmtTs(i.ts)}</div>
                      </div>
                      <button className="riedit" onClick={()=>setRiIssueExpand({...riIssueExpand,[i.id]:!expanded})}>{(i.subs||[]).length>0?`?˜ìœ„ ${(i.subs||[]).length}`:"+?˜ìœ„"}</button>
                      {canEdit&&!editing&&<button className="riedit" onClick={()=>setRiIssueEditId(i.id)}>?˜ì •</button>}
                      {canEdit&&<button className="riedit" onClick={()=>duplicateRiIssue(i.itemId,i)}>ë³µì‚¬</button>}
                      {canEdit&&<button style={{background:"none",border:"none",color:"#8F959C",cursor:"pointer"}} onClick={()=>removeRiIssue(i.itemId,i.id)}>Ã—</button>}
                    </div>
                    {expanded&&(
                      <div style={{marginTop:8,paddingLeft:33,borderTop:"1px solid var(--line)",paddingTop:8}}>
                        {(i.subs||[]).length===0&&<span className="hint">?ˆìŠ¤? ë¦¬ê°€ ?†ìŠµ?ˆë‹¤</span>}
                        {(i.subs||[]).map((s)=>(
                          <div key={s.id} className="cmt">
                            <div className="ch2"><b>{s.author}</b> Â· {fmtTs(s.ts)}{s.edited&&<span style={{color:"var(--ink3)"}}> (?˜ì •??</span>}</div>
                            {riIssueSubEditId===s.id
                              ? <div style={{display:"flex",gap:6,marginTop:4}}>
                                  <textarea className="hinput" defaultValue={s.text} autoFocus style={{flex:1}}
                                    onKeyDown={(e)=>{if(e.nativeEvent.isComposing||e.key!=="Enter"||e.shiftKey)return;e.preventDefault();editRiIssueSub(i.itemId,i.id,s.id,e.target.value);setRiIssueSubEditId(null);}}
                                    onBlur={(e)=>{editRiIssueSub(i.itemId,i.id,s.id,e.target.value);setRiIssueSubEditId(null);}} />
                                </div>
                              : <p>{s.text}</p>}
                            {canEdit&&riIssueSubEditId!==s.id&&<div style={{display:"flex",gap:10}}>
                              <button style={{background:"none",border:"none",color:"var(--ink3)",fontSize:11,cursor:"pointer",padding:0}} onClick={()=>setRiIssueSubEditId(s.id)}>?˜ì •</button>
                              <button style={{background:"none",border:"none",color:"var(--danger)",fontSize:11,cursor:"pointer",padding:0}} onClick={()=>removeRiIssueSub(i.itemId,i.id,s.id)}>?? œ</button>
                            </div>}
                          </div>
                        ))}
                        {canEdit&&<div className="addrow">
                          <textarea className="hinput" placeholder="?ˆìŠ¤? ë¦¬ ?…ë ¥ (Enter ?„ì†¡, Shift+Enter ì¤„ë°”ê¿?"
                            value={riIssueSubText[i.id]||""} onChange={(e)=>setRiIssueSubText({...riIssueSubText,[i.id]:e.target.value})}
                            onKeyDown={(e)=>{if(e.nativeEvent.isComposing||e.key!=="Enter"||e.shiftKey)return;e.preventDefault();addRiIssueSub(i.itemId,i.id,riIssueSubText[i.id]||"");setRiIssueSubText({...riIssueSubText,[i.id]:""});}} />
                        </div>}
                      </div>
                    )}
                  </div>
                  );
                })}
                {canEdit&&rItems.length>0&&(
                  <div style={{display:"flex",gap:7,marginTop:10}}>
                    <select className="sel" value={riIssueItem} onChange={(e)=>setRiIssueItem(e.target.value)} style={{maxWidth:220}}>
                      <option value="">??ª© ? íƒ</option>
                      {rItems.map((it)=><option key={it.id} value={it.id}>{it.cat} &gt; {it.sub} &gt; {it.title}</option>)}
                    </select>
                    <textarea className="hinput" style={{flex:1}} placeholder="?´ìŠˆ ?…ë ¥ (Enter ì¶”ê?, Shift+Enter ì¤„ë°”ê¿?" value={riIssueText} onChange={(e)=>setRiIssueText(e.target.value)}
                      onKeyDown={(e)=>{if(e.nativeEvent.isComposing||e.key!=="Enter"||e.shiftKey)return;e.preventDefault();if(!riIssueItem){alert("??ª©??ë¨¼ì? ? íƒ?˜ì„¸??");return;}addRiIssue(riIssueItem,riIssueText);setRiIssueText("");}} />
                    <button className="btn-save" onClick={()=>{if(!riIssueItem){alert("??ª©??ë¨¼ì? ? íƒ?˜ì„¸??");return;}if(!riIssueText.trim()){alert("?´ìŠˆ ?´ìš©???…ë ¥?˜ì„¸??");return;}addRiIssue(riIssueItem,riIssueText);setRiIssueText("");}}>ì¶”ê?</button>
                  </div>
                )}
              </div>
            )}
          </div>

          {riTree.length===0&&<div className="empty">?±ë¡????ª©???†ìŠµ?ˆë‹¤. + ??ª© ì¶”ê?ë¡??œì‘?˜ì„¸??</div>}

          {riTree.map((cat)=>{
            const catKey=`c:${cat.name}`;
            const catItems=cat.subs.flatMap((s)=>s.items);
            const catDone=catItems.filter((it)=>(it.checkins||{})[riDate]).length;
            const catOpen=!riCollapse[catKey];
            return (
              <div key={cat.name} className="ritop">
                <div className="rihead" onClick={()=>toggleCollapse(catKey)}>
                  <span className="richev">{catOpen?"??:"??}</span>
                  <span className="ricatname">{cat.name}</span>
                  <span className="ricount">{catDone}/{catItems.length}</span>
                </div>
                {catOpen&&cat.subs.map((sub)=>{
                  const subKey=`s:${cat.name}:${sub.name}`;
                  const subOpen=!riCollapse[subKey];
                  const subDone=sub.items.filter((it)=>(it.checkins||{})[riDate]).length;
                  return (
                    <div key={sub.name} className="risub">
                      <div className="risubhead" onClick={()=>toggleCollapse(subKey)}>
                        <span className="richev sm">{subOpen?"??:"??}</span>
                        <span className="risubname">{sub.name}</span>
                        <span className="ricount">{subDone}/{sub.items.length}</span>
                      </div>
                      {subOpen&&sub.items.map((it)=>{
                        const checked=!!(it.checkins||{})[riDate];
                        return (
                          <div key={it.id}>
                          <div draggable={canEdit&&!checked}
                            onDragStart={(e)=>{setRiItemDrag(it.id);e.dataTransfer.effectAllowed="move";try{e.dataTransfer.setData("text/plain",it.id);}catch(err){}}}
                            onDragOver={(e)=>{e.preventDefault();e.dataTransfer.dropEffect="move";}}
                            onDrop={()=>{if(riItemDrag)reorderRi(cat.name,sub.name,riItemDrag,it.id);setRiItemDrag(null);}}
                            onDragEnd={()=>setRiItemDrag(null)}
                            className={"rirow"+(riItemDrag===it.id?" dragging":"")}>
                            <button className={"ckbox"+(checked?" on":"")} disabled={!canEdit} onClick={()=>toggleRi(it,riDate)}>{checked?"??:""}</button>
                            <span style={{flex:1,fontSize:13.5,textDecoration:checked?"line-through":"none",color:checked?"var(--ink3)":"inherit"}}>{it.title}</span>
                            {(it.issues||[]).filter((i)=>!i.resolved).length>0&&<span style={{fontSize:11,color:"#C9372C",fontWeight:700}}>??{(it.issues||[]).filter((i)=>!i.resolved).length}</span>}
                            {checked&&it.checkins[riDate].by&&<span style={{fontSize:11,color:"var(--ink3)"}}>{it.checkins[riDate].by}</span>}
                            {canEdit&&<button className="riedit" onClick={()=>{setRiQuickIssueId(riQuickIssueId===it.id?null:it.id);setRiQuickIssueText("");}}>?´ìŠˆ</button>}
                            {canEdit&&<button className="riedit" onClick={()=>duplicateRi(it)}>ë³µì‚¬</button>}
                            {canEdit&&<button className="riedit" onClick={()=>setRiAdd({id:it.id,cat:it.cat,sub:it.sub,title:it.title})}>?˜ì •</button>}
                          </div>
                          {riQuickIssueId===it.id&&(
                            <div style={{display:"flex",gap:7,padding:"6px 16px 10px 52px"}}>
                              <textarea className="hinput" autoFocus placeholder="?´ìŠˆ ?…ë ¥ (Enter ì¶”ê?, Shift+Enter ì¤„ë°”ê¿?" value={riQuickIssueText} onChange={(e)=>setRiQuickIssueText(e.target.value)}
                                onKeyDown={(e)=>{if(e.nativeEvent.isComposing||e.key!=="Enter"||e.shiftKey)return;e.preventDefault();if(!riQuickIssueText.trim())return;addRiIssue(it.id,riQuickIssueText);setRiQuickIssueId(null);setRiQuickIssueText("");}} />
                              <button className="btn-save" onClick={()=>{if(!riQuickIssueText.trim())return;addRiIssue(it.id,riQuickIssueText);setRiQuickIssueId(null);setRiQuickIssueText("");}}>ì¶”ê?</button>
                              <button className="btn ghost" onClick={()=>setRiQuickIssueId(null)}>ì·¨ì†Œ</button>
                            </div>
                          )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
        );
      })()}

      {view==="monthly"&&(
        <div>
          <div className="panel" style={{marginBottom:12}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
              <div>
                <h3 style={{margin:0}}>?”ê°„ ?…ë¬´</h3>
                <p className="sub" style={{margin:"4px 0 0"}}>?”ë³„ë¡??´ì•¼ ????ª©??ê´€ë¦¬í•©?ˆë‹¤. ?˜ìœ„ ??ª©???£ì„ ???ˆìŠµ?ˆë‹¤.</p>
              </div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <input type="month" className="sel" value={mlyDate} onChange={(e)=>setMlyDate(e.target.value)} />
                {canEdit&&<button className="btn-save" onClick={()=>setMlyDraft({_new:true,id:uid(),month:mlyDate,title:"",desc:"",done:false,subs:[],history:[]})}>+ ì¶”ê?</button>}
              </div>
            </div>
          </div>
          {mlyByMonth(mlyDate).length===0&&<div className="empty">{mlyDate} ??ª©???†ìŠµ?ˆë‹¤. + ì¶”ê?ë¡?ë§Œë“¤?´ë³´?¸ìš”.</div>}
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {mlyByMonth(mlyDate).map((m)=>{
              const subs=m.subs||[];const subDone=subs.filter((s)=>s.done).length;
              return (
                <div key={m.id} style={{background:"var(--card)",borderRadius:10,boxShadow:"var(--sh)",padding:"13px 16px",opacity:m.done?.65:1}}>
                  <div style={{display:"flex",alignItems:"flex-start",gap:11}}>
                    <button className={"ckbox"+(m.done?" on":"")} disabled={!canEdit} onClick={()=>toggleMly(m)}>{m.done?"??:""}</button>
                    <div style={{flex:1,minWidth:0,cursor:"pointer"}} onClick={()=>setMlyDraft({...m,subs:[...m.subs||[]],history:[...m.history||[]]})}>
                      <div style={{fontSize:15,fontWeight:700,textDecoration:m.done?"line-through":"none",color:m.done?"var(--ink3)":"inherit"}}>{m.title}</div>
                      {m.desc&&<div style={{fontSize:12.5,color:"var(--ink3)",marginTop:3}}>{m.desc}</div>}
                      {subs.length>0&&<div style={{fontSize:12,color:"var(--ink3)",marginTop:4,fontWeight:600}}>?˜ìœ„ {subDone}/{subs.length}</div>}
                    </div>
                  </div>
                  {(subs.length>0||canEdit)&&(
                    <div style={{marginTop:10,paddingTop:10,borderTop:"1px solid var(--line)",display:"flex",flexDirection:"column",gap:6,paddingLeft:35}}>
                      {subs.map((s)=>{
                        const subOpen=!!mlySubHistOpen[s.id];
                        const subsubOpen=!!mlySubsubOpen[s.id];
                        const subsubs=s.subsubs||[];
                        return (
                        <div key={s.id}>
                          <div style={{display:"flex",alignItems:"center",gap:8}}>
                            <button className={"ckbox sm"+(s.done?" on":"")} disabled={!canEdit} onClick={()=>toggleMlySub(m,s.id)}>{s.done?"??:""}</button>
                            <span style={{fontSize:13,textDecoration:s.done?"line-through":"none",color:s.done?"var(--ink3)":"inherit",flex:1}}>{s.text}</span>
                            <button className="riedit" onClick={()=>setMlySubsubOpen({...mlySubsubOpen,[s.id]:!subsubOpen})}>{subsubs.length>0?`?˜ìœ„ëª©ë¡ ${subsubs.filter((x)=>x.done).length}/${subsubs.length}`:"+?˜ìœ„ëª©ë¡"}</button>
                            <button className="riedit" onClick={()=>setMlySubHistOpen({...mlySubHistOpen,[s.id]:!subOpen})}>{(s.history||[]).length>0?`?ˆìŠ¤? ë¦¬ ${s.history.length}`:"+?ˆìŠ¤? ë¦¬"}</button>
                          </div>
                          {subsubOpen&&(
                            <div style={{paddingLeft:31,marginTop:6,marginBottom:8}}>
                              {subsubs.length===0&&<span className="hint">?˜ìœ„ ëª©ë¡???†ìŠµ?ˆë‹¤</span>}
                              {subsubs.map((x)=>(
                                <div key={x.id} style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                                  <button className={"ckbox sm"+(x.done?" on":"")} disabled={!canEdit} onClick={()=>toggleMlySubsubDirect(m.id,s.id,x.id)}>{x.done?"??:""}</button>
                                  <span style={{fontSize:12.5,textDecoration:x.done?"line-through":"none",color:x.done?"var(--ink3)":"inherit",flex:1}}>{x.text}</span>
                                  {canEdit&&<button style={{background:"none",border:"none",color:"var(--ink3)",cursor:"pointer",fontSize:14}} onClick={()=>removeMlySubsubDirect(m.id,s.id,x.id)}>Ã—</button>}
                                </div>
                              ))}
                              {canEdit&&<div className="addrow">
                                <input className="inp" placeholder="?˜ìœ„ëª©ë¡ ??ª© ?…ë ¥ ??Enter" onKeyDown={(e)=>{if(e.nativeEvent.isComposing||e.key!=="Enter")return;addMlySubsubDirect(m.id,s.id,e.target.value);e.target.value="";}} />
                              </div>}
                            </div>
                          )}
                          {subOpen&&(
                            <div style={{paddingLeft:31,marginTop:6,marginBottom:8}}>
                              {(s.history||[]).length===0&&<span className="hint">ê¸°ë¡???†ìŠµ?ˆë‹¤</span>}
                              {(s.history||[]).map((h)=>(
                                <div key={h.id} className="cmt">
                                  <div className="ch2"><b>{h.author}</b> Â· {fmtTs(h.ts)}{h.edited&&<span style={{color:"var(--ink3)"}}> (?˜ì •??</span>}</div>
                                  {mlySubHistEditId===h.id
                                    ? <textarea className="hinput" defaultValue={h.text} autoFocus style={{width:"100%",marginTop:4}}
                                        onKeyDown={(e)=>{if(e.nativeEvent.isComposing||e.key!=="Enter"||e.shiftKey)return;e.preventDefault();editMlySubHistoryDirect(m.id,s.id,h.id,e.target.value);setMlySubHistEditId(null);}}
                                        onBlur={(e)=>{editMlySubHistoryDirect(m.id,s.id,h.id,e.target.value);setMlySubHistEditId(null);}} />
                                    : <p>{h.text}</p>}
                                  {canEdit&&mlySubHistEditId!==h.id&&<div style={{display:"flex",gap:10}}>
                                    <button style={{background:"none",border:"none",color:"var(--ink3)",fontSize:11,cursor:"pointer",padding:0}} onClick={()=>setMlySubHistEditId(h.id)}>?˜ì •</button>
                                    <button style={{background:"none",border:"none",color:"var(--danger)",fontSize:11,cursor:"pointer",padding:0}} onClick={()=>removeMlySubHistoryDirect(m.id,s.id,h.id)}>?? œ</button>
                                  </div>}
                                </div>
                              ))}
                              {canEdit&&<div className="addrow">
                                <textarea className="hinput" placeholder="?ˆìŠ¤? ë¦¬ ?…ë ¥ (Enter ì¶”ê?, Shift+Enter ì¤„ë°”ê¿?"
                                  value={mlySubHistText[s.id]||""} onChange={(e)=>setMlySubHistText({...mlySubHistText,[s.id]:e.target.value})}
                                  onKeyDown={(e)=>{if(e.nativeEvent.isComposing||e.key!=="Enter"||e.shiftKey)return;e.preventDefault();addMlySubHistoryDirect(m.id,s.id,mlySubHistText[s.id]||"");setMlySubHistText({...mlySubHistText,[s.id]:""});}} />
                              </div>}
                            </div>
                          )}
                        </div>
                        );
                      })}
                      {canEdit&&<div className="addrow" style={{marginTop:4}}>
                        <input className="inp" placeholder="?˜ìœ„ ??ª© ?…ë ¥ ??Enter" onKeyDown={(e)=>{if(e.nativeEvent.isComposing||e.key!=="Enter")return;addMlySubDirect(m.id,e.target.value);e.target.value="";}} />
                      </div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view==="checklist"&&(
        <div className="ckcols">
          {CKTABS.map((tab)=>{
            const isCL=tab.id==="checklist";
            const items=ckByTab(tab.id);
            return (
              <div key={tab.id} className="ckcol">
                <div className="ckcolhead">
                  <div className="ckcoltitle">{tab.label}<em>{items.filter((c)=>!c.done).length}</em></div>
                  <div style={{display:"flex",gap:5}}>
                    {canEdit&&<button className="ckplus" style={{background:"#0C66E4",color:"#fff"}} onClick={()=>setCkDraft({_new:true,id:uid(),tab:tab.id,title:"",start:"",due:"",desc:"",done:false,subs:isCL?[]:undefined})}>+</button>}                  </div>
                </div>
                <div className="ckcolbody">
                  {items.length===0&&<div className="ckempty">??ª©???†ìŠµ?ˆë‹¤</div>}
                  {items.map((c)=>{
                    const dd=dayDiff(c.due);const over=dd!==null&&dd<0&&!c.done;
                    const subs=c.subs||[];const subDone=subs.filter((s)=>s.done).length;
                    const exp=ckExpand[c.id];
                    return (
                      <div key={c.id} draggable={canEdit&&!c.done}
                        onDragStart={(e)=>{setCkDrag(c.id);e.dataTransfer.effectAllowed="move";try{e.dataTransfer.setData("text/plain",c.id);}catch(err){}}}
                        onDragOver={(e)=>{e.preventDefault();e.dataTransfer.dropEffect="move";}}
                        onDrop={()=>{if(ckDrag)reorderCk(tab.id,ckDrag,c.id);setCkDrag(null);}} onDragEnd={()=>setCkDrag(null)}
                        className={"ckrow"+(c.done?" done":"")+(over?" over":"")+(ckDrag===c.id?" dragging":"")}>
                        <div className="ckrowmain">
                          <button className={"ckbox"+(c.done?" on":"")} disabled={!canEdit} onClick={()=>toggleCk(c)}>{c.done?"??:""}</button>
                          <div style={{flex:1,minWidth:0,cursor:"pointer"}} onClick={()=>setCkDraft({...c,subs:c.subs?[...c.subs]:(isCL?[]:undefined)})}>
                            <div className={"cktitle"+(over?" red":"")}>{c.title}</div>
                            <div className={"ckmeta"+(over?" red":"")}>
                              {c.start&&<span>{c.start.slice(5).replace("-","??")}??/span>}
                              {(c.start&&c.due)&&<span>~</span>}
                              {c.due&&<span>{c.due.slice(5).replace("-","??")}??over?` (${Math.abs(dd)}??ì§€??`:""}</span>}
                              {!c.start&&!c.due&&<span style={{color:"var(--ink3)"}}>ê¸°í•œ ?†ìŒ</span>}
                              {isCL&&subs.length>0&&<span>Â· {subDone}/{subs.length}</span>}
                            </div>
                            <div className="ckunderline" />
                          </div>
                          {isCL&&subs.length>0&&<button className="ckexp" onClick={(e)=>{e.stopPropagation();setCkExpand({...ckExpand,[c.id]:!exp});}}>{exp?"??:"??}</button>}
                          {isCL&&(c.subs||[]).some((s)=>s.done)&&<button className="riedit" onClick={(e)=>{e.stopPropagation();clearCkItem(c);}}>ì²´í¬ ?´ì œ</button>}
                          {canEdit&&<button className="riedit" onClick={(e)=>{e.stopPropagation();duplicateCk(c);}}>ë³µì‚¬</button>}
                        </div>
                        {isCL&&exp&&subs.length>0&&(
                          <div className="cksubs">
                            {subs.map((s)=>(
                              <div key={s.id} className="cksub">
                                <button className={"ckbox sm"+(s.done?" on":"")} disabled={!canEdit} onClick={()=>toggleSub(c,s.id)}>{s.done?"??:""}</button>
                                <span style={{textDecoration:s.done?"line-through":"none",color:s.done?"var(--ink3)":"inherit"}}>{s.text}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}


      {view==="ai"&&(
        <div className="aiwrap">
          <div className="panel" style={{marginBottom:12}}>
            <h3>AI ë¹„ì„œ</h3>
            <p className="sub">ë³´ë“œÂ·ë°˜ë³µ?…ë¬´Â·ì²´í¬ë¦¬ìŠ¤?¸Â·ì´???°ì´?°ë? ì¡°íšŒ?´ì„œ ?µí•©?ˆë‹¤. ?°ì´?°ë? ë°”ê¾¸ì§€??ëª»í•©?ˆë‹¤.</p>
          </div>
          <div className="aichat">
            {aiMessages.length===0&&(
              <div className="aiempty">
                <p>?ˆì‹œë¡??´ë ‡ê²?ë¬¼ì–´ë³´ì„¸??/p>
                <div className="aisugg">
                  {["?¤ëŠ˜ ë§ˆê°???…ë¬´ ë­??ˆì–´?","ê¹€?„ë? ?´ë‹¹ ?…ë¬´ ì§„í–‰ì¤‘ì¸ ê±??Œë ¤ì¤?,"ë°˜ë³µ?…ë¬´ ì¤‘ì— ?¤ëŠ˜ ì²´í¬ ????ê±??ˆì–´?","ë¯¸í•´ê²??´ìŠˆ ëª?ê°œì•¼?"].map((s)=>(
                    <button key={s} onClick={()=>setAiInput(s)}>{s}</button>
                  ))}
                </div>
              </div>
            )}
            {aiMessages.map((m,i)=>(
              <div key={i} className={"aimsg "+m.role}>
                <div className="aibubble">{m.text}</div>
              </div>
            ))}
            {aiLoading&&<div className="aimsg ai"><div className="aibubble aithink">?ê° ì¤‘â€?/div></div>}
          </div>
          <div className="aiinput">
            <input placeholder="ì§ˆë¬¸???…ë ¥?˜ì„¸?? value={aiInput} onChange={(e)=>setAiInput(e.target.value)}
              onKeyDown={(e)=>{if(e.nativeEvent.isComposing||e.key!=="Enter")return;sendAiMessage();}} disabled={aiLoading} />
            <button className="btn-save" onClick={sendAiMessage} disabled={aiLoading||!aiInput.trim()}>?„ì†¡</button>
          </div>
        </div>
      )}

      {view==="memo"&&(
        <div>
          <div className="panel" style={{padding:14,marginBottom:12}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
              <div style={{fontSize:14,fontWeight:800}}>ë©”ëª¨</div>
              {canEdit&&<button className="btn-save" onClick={()=>setMemoDraft({cat:"",sub:"",title:"",text:""})}>+ ë©”ëª¨ ì¶”ê?</button>}
            </div>
            <div style={{display:"flex",gap:7,marginTop:12,flexWrap:"wrap"}}>
              <input className="inp" style={{flex:1,minWidth:160}} placeholder="ê²€??(ë¶„ë¥˜Â·?œëª©Â·?´ìš©Â·?˜ìœ„??ª©)" value={memoQuery} onChange={(e)=>setMemoQuery(e.target.value)} />
              <select className="sel" value={memoCatFilter} onChange={(e)=>setMemoCatFilter(e.target.value)}>
                {memoCatOptions.map((c)=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {memoFiltered.length===0&&<div className="empty">{memoQuery||memoCatFilter!=="?„ì²´"?"ì¡°ê±´??ë§ëŠ” ë©”ëª¨ê°€ ?†ìŠµ?ˆë‹¤":"ë©”ëª¨ê°€ ?†ìŠµ?ˆë‹¤. + ë©”ëª¨ ì¶”ê?ë¡??œì‘?˜ì„¸??"}</div>}

          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {memoFiltered.map((m)=>{
              const expanded=!!memoExpand[m.id];
              return (
                <div key={m.id} draggable={canEdit}
                  onDragStart={(e)=>{setMemoDrag(m.id);e.dataTransfer.effectAllowed="move";try{e.dataTransfer.setData("text/plain",m.id);}catch(err){}}}
                  onDragOver={(e)=>{e.preventDefault();e.dataTransfer.dropEffect="move";}}
                  onDrop={()=>{if(memoDrag)reorderMemo(memoDrag,m.id);setMemoDrag(null);}}
                  onDragEnd={()=>setMemoDrag(null)}
                  className={"memocard"+(memoDrag===m.id?" dragging":"")}>
                  <div className="memohead">
                    <div style={{flex:1,minWidth:0,cursor:"pointer"}} onClick={()=>setMemoDraft({...m,subs:[...(m.subs||[])]})}>
                      {(m.cat||m.sub)&&<div className="memopath">{[m.cat,m.sub].filter(Boolean).join(" > ")}</div>}
                      {m.title&&<div className="memotitle">{m.title}</div>}
                      <div className="memotext">{m.text}</div>
                    </div>
                    <div style={{display:"flex",gap:6,flexShrink:0}}>
                      <button className="riedit" onClick={()=>setMemoExpand({...memoExpand,[m.id]:!expanded})}>{(m.subs||[]).length>0?`?˜ìœ„ ${(m.subs||[]).length}`:"+?˜ìœ„"}</button>
                      {canEdit&&<button className="riedit" onClick={()=>duplicateMemo(m)}>ë³µì‚¬</button>}
                      {canEdit&&<button className="riedit" onClick={()=>setMemoDraft({...m,subs:[...(m.subs||[])]})}>?˜ì •</button>}
                    </div>
                  </div>
                  {expanded&&(
                    <div className="memosubs">
                      {(m.subs||[]).length===0&&<span className="hint">?˜ìœ„ ??ª©???†ìŠµ?ˆë‹¤</span>}
                      {(m.subs||[]).map((s)=>(
                        <div key={s.id} className="cmt">
                          <div className="ch2"><b>{s.author}</b> Â· {fmtTs(s.ts)}{s.edited&&<span style={{color:"var(--ink3)"}}> (?˜ì •??</span>}</div>
                          {memoSubEditId===s.id
                            ? <textarea className="hinput" defaultValue={s.text} autoFocus style={{width:"100%",marginTop:4}}
                                onKeyDown={(e)=>{if(e.nativeEvent.isComposing||e.key!=="Enter"||e.shiftKey)return;e.preventDefault();editMemoSub(m.id,s.id,e.target.value);setMemoSubEditId(null);}}
                                onBlur={(e)=>{editMemoSub(m.id,s.id,e.target.value);setMemoSubEditId(null);}} />
                            : <p>{s.text}</p>}
                          {canEdit&&memoSubEditId!==s.id&&<div style={{display:"flex",gap:10}}>
                            <button style={{background:"none",border:"none",color:"var(--ink3)",fontSize:11,cursor:"pointer",padding:0}} onClick={()=>setMemoSubEditId(s.id)}>?˜ì •</button>
                            <button style={{background:"none",border:"none",color:"var(--danger)",fontSize:11,cursor:"pointer",padding:0}} onClick={()=>removeMemoSub(m.id,s.id)}>?? œ</button>
                          </div>}
                        </div>
                      ))}
                      {canEdit&&<div className="addrow">
                        <textarea className="hinput" placeholder="?˜ìœ„ ??ª© ?…ë ¥ (Enter ì¶”ê?, Shift+Enter ì¤„ë°”ê¿?"
                          value={memoSubText[m.id]||""} onChange={(e)=>setMemoSubText({...memoSubText,[m.id]:e.target.value})}
                          onKeyDown={(e)=>{if(e.nativeEvent.isComposing||e.key!=="Enter"||e.shiftKey)return;e.preventDefault();addMemoSub(m.id,memoSubText[m.id]||"");setMemoSubText({...memoSubText,[m.id]:""});}} />
                      </div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view==="issue"&&(
        <div>
          <div className="panel"><h3>?´ìŠˆ ëª¨ì•„ë³´ê¸°</h3>
            <p className="sub">ë°˜ë³µ ?…ë¬´?€ ?¼ë°˜ ?…ë¬´?ì„œ ?±ë¡???´ìŠˆê°€ ?„ë? ëª¨ì…?ˆë‹¤. ?´ìŠˆë¥??´ë¦­?˜ë©´ ?ˆìŠ¤? ë¦¬ë¥?ê¸°ë¡?????ˆìŠµ?ˆë‹¤.</p>
            <div style={{display:"flex",gap:7}}>
              {[{id:"all",label:`?„ì²´ ${allIssues.length}`},{id:"done",label:`?´ê²° ${allIssues.filter((i)=>i.resolved).length}`},{id:"open",label:`ë¯¸í•´ê²?${allIssues.filter((i)=>!i.resolved).length}`}].map((f)=>(
                <button key={f.id} className={"chip"+(issueFilter===f.id?" sel":"")} onClick={()=>setIssueFilter(f.id)}>{f.label}</button>
              ))}
            </div>
          </div>
          {(()=>{
            const list=allIssues.filter((i)=>issueFilter==="all"?true:issueFilter==="open"?!i.resolved:i.resolved);
            if(!list.length)return <div className="empty">?´ë‹¹?˜ëŠ” ?´ìŠˆê°€ ?†ìŠµ?ˆë‹¤</div>;
            const toggleAny=(i)=>{
              if(i.routineId)toggleIssue(i.routineId,i.id);
              else commit((d)=>({...d,tasks:d.tasks.map((t)=>t.id===i.taskId?{...t,issues:(t.issues||[]).map((x)=>x.id===i.id?{...x,resolved:!x.resolved,resolvedBy:me}:x),updatedAt:Date.now()}:t)}),[]);
            };
            return list.map((i)=>(
              <div key={i.id} className={"issrow"+(i.resolved?" done":"")}>
                <div style={{flex:1,minWidth:0,cursor:"pointer"}} onClick={()=>setIssueDetail(i)}>
                  <div className="isstext">{i.text}{(i.history||[]).length>0&&<span style={{fontSize:11,color:"var(--pri)",marginLeft:6,fontWeight:700}}>?’¬{(i.history||[]).length}</span>}</div>
                  <div className="issmeta"><b style={{color:i.src==="?…ë¬´"?"#0055CC":"#1F845A"}}>{i.src}</b> Â· {i.routineTitle} Â· {i.author} Â· {fmtTs(i.ts)}{i.owner&&` Â· ?´ë‹¹ ${i.owner}`}</div>
                </div>
                <button className={"issbtn"+(i.resolved?"":" active")} onClick={()=>toggleAny(i)}>{i.resolved?"?´ê²°????:"ë¯¸í•´ê²?}</button>
                {!i.routineId&&<button className="btn ghost" onClick={()=>{
                  const t=data.tasks.find((x)=>x.id===i.taskId);if(t){setView("board");openTask(t);}
                }}>?´ë™</button>}
              </div>
            ));
          })()}
        </div>
      )}

      {view==="list"&&(()=>{
        const STCOL={todo:"#579BFC",doing:"#FDAB3D",review:"#A25DDC",issuecol:"#E2445C",done:"#00C875"};
        const PRCOL={high:"#333E85",mid:"#5559DF",low:"#579BFC"};
        const mdVisible=visible.filter((t)=>{
          if(listDateFrom&&(!t.due||t.due<listDateFrom))return false;
          if(listDateTo&&(!t.due||t.due>listDateTo))return false;
          return true;
        });
        const patch=(t,k,v)=>{
          if(!canEdit)return;
          const now=Date.now();
          const upd={[k]:v};
          if(k==="status")upd.doneAt=v==="done"?(t.doneAt||now):null;
          commit((d)=>({...d,tasks:d.tasks.map((x)=>x.id===t.id?{...x,...upd,updatedAt:now,updatedBy:me}:x)}),
            [mkLog("?€ ?˜ì •",t,`${k} ??${v}`)]);
        };
        const groups=grpBy==="status"
          ? cols.map((c)=>({key:c.id,label:c.label,color:STCOL[c.id],items:mdVisible.filter((t)=>t.status===c.id)}))
          : data.channels.map((c)=>({key:c.id,label:c.id,color:c.color,items:mdVisible.filter((t)=>t.channel===c.id)})).filter((g)=>g.items.length>0);
        return (
        <div>
          <div className="mdtoolbar">
            <button className="btn" onClick={()=>openNew()}>+ ?ˆë¡œ???œìŠ¤??/button>
            <span style={{width:12}} />
            <input className="inp" placeholder="ê²€?? value={q} onChange={(e)=>setQ(e.target.value)} style={{width:140}} />
            <span className="mdsep" />
            <span className="mdlbl">ê·¸ë£¹</span>
            <select className="sel" value={grpBy} onChange={(e)=>setGrpBy(e.target.value)}>
              <option value="status">?íƒœë³?/option>
              <option value="channel">ì±„ë„ë³?/option>
            </select>
            <span className="mdsep" />
            <select className="sel" value={fOwner} onChange={(e)=>setFOwner(e.target.value)}>
              <option value="?„ì²´">?´ë‹¹???„ì²´</option>
              {owners.map((o)=><option key={o} value={o}>{o}</option>)}
            </select>
            <span className="mdsep" />
            <span className="mdlbl">ë§ˆê°</span>
            <input type="date" className="sel" value={listDateFrom} onChange={(e)=>setListDateFrom(e.target.value)} />
            <span style={{color:"var(--ink3)"}}>~</span>
            <input type="date" className="sel" value={listDateTo} onChange={(e)=>setListDateTo(e.target.value)} />
            {(listDateFrom||listDateTo)&&<button className="chip" onClick={()=>{setListDateFrom("");setListDateTo("");}}>?´ì œ</button>}
            <span className="spacer" />
            <span className="mdlbl">{mdVisible.length}ê±?/span>
          </div>

          {groups.map((g)=>{
            const open=!collapsed[g.key];
            const items=g.items;
            const stCount=cols.map((c)=>({...c,n:items.filter((t)=>t.status===c.id).length,color:STCOL[c.id]})).filter((c)=>c.n>0);
            const prCount=PRIORITIES.map((p)=>({...p,n:items.filter((t)=>t.priority===p.id).length,color:PRCOL[p.id]})).filter((p)=>p.n>0);
            const dues=items.map((t)=>t.due).filter(Boolean).sort();
            const avgPg=items.length?Math.round(items.reduce((s,t)=>s+(t.progress||0),0)/items.length):0;
            return (
            <div key={g.key} className="mdgroup">
              <button className="mdghead" onClick={()=>setCollapsed({...collapsed,[g.key]:open})}>
                <span className="mdarrow" style={{color:g.color}}>{open?"??:"??}</span>
                <span className="mdgtitle" style={{color:g.color}}>{g.label}</span>
                <span className="mdgcount">{items.length}</span>
              </button>
              {open&&(
                <div className="mdtblwrap" style={{"--gc":g.color}}>
                  <table className="mdtbl">
                    <thead>
                      <tr>
                        <th className="mdspine" />
                        <th style={{minWidth:220}}>?œìŠ¤??/th>
                        <th style={{width:110}}>?Œìœ ??/th>
                        <th style={{width:130}}>?íƒœ</th>
                        <th style={{width:130}}>ë§ˆê°??/th>
                        <th style={{width:120}}>?°ì„ ?œìœ„</th>
                        <th style={{width:120}}>ì§„í–‰ë¥?/th>
                        <th style={{minWidth:150}}>ë©”ëª¨</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.length===0&&<tr><td className="mdspine" /><td colSpan={7} className="mdempty">??ª©???†ìŠµ?ˆë‹¤</td></tr>}
                      {items.map((t)=>{
                        const d=dayDiff(t.due),late=d!==null&&d<0&&t.status!=="done";
                        return (
                        <tr key={t.id}>
                          <td className="mdspine" />
                          <td className="mdname">
                            <input defaultValue={t.title} disabled={!canEdit}
                              onBlur={(e)=>{const v=e.target.value.trim();if(v&&v!==t.title)patch(t,"title",v);}}
                              onKeyDown={(e)=>{if(e.nativeEvent.isComposing)return;if(e.key==="Enter")e.target.blur();}} />
                            <button className="mdopen" onClick={()=>openTask(t)} title="?ì„¸ ?´ê¸°">â¤?/button>
                          </td>
                          <td>
                            <select className="mdplain" value={t.owner||""} disabled={!canEdit}
                              onChange={(e)=>patch(t,"owner",e.target.value)}>
                              <option value="">??/option>
                              {[...new Set([...owners,...data.members.map((m)=>m.name)].filter(Boolean))].map((o)=><option key={o} value={o}>{o}</option>)}
                            </select>
                          </td>
                          <td className="mdcell" style={{background:STCOL[t.status]}}>
                            <select className="mdcolorsel" value={t.status} disabled={!canEdit}
                              onChange={(e)=>patch(t,"status",e.target.value)}>
                              {cols.map((c)=><option key={c.id} value={c.id}>{c.label}</option>)}
                            </select>
                          </td>
                          <td>
                            <div className="mddue">
                              {late&&<span className="mdwarn" title={`${Math.abs(d)}??ì§€??}>!</span>}
                              {t.status==="done"&&<span className="mdok">??/span>}
                              <input type="date" className="mdplain" value={t.due||""} disabled={!canEdit}
                                style={t.status==="done"?{textDecoration:"line-through",color:"var(--ink3)"}:late?{color:"#E2445C",fontWeight:700}:{}}
                                onChange={(e)=>patch(t,"due",e.target.value)} />
                            </div>
                          </td>
                          <td className="mdcell" style={{background:PRCOL[t.priority]}}>
                            <select className="mdcolorsel" value={t.priority} disabled={!canEdit}
                              onChange={(e)=>patch(t,"priority",e.target.value)}>
                              {PRIORITIES.map((p)=><option key={p.id} value={p.id}>{p.label}</option>)}
                            </select>
                          </td>
                          <td>
                            <div className="mdpg">
                              <div className="mdpgbar"><i style={{width:(t.progress||0)+"%"}} /></div>
                              <span>{t.progress||0}%</span>
                            </div>
                          </td>
                          <td>
                            <input className="mdplain" defaultValue={t.memo||""} placeholder="?? disabled={!canEdit}
                              onBlur={(e)=>{const v=e.target.value;if(v!==(t.memo||""))patch(t,"memo",v);}}
                              onKeyDown={(e)=>{if(e.nativeEvent.isComposing)return;if(e.key==="Enter")e.target.blur();}} />
                          </td>
                        </tr>
                      );})}
                      {canEdit&&(
                        <tr className="mdaddrow">
                          <td className="mdspine" />
                          <td colSpan={7}>
                            <button className="mdadd" onClick={()=>openNew(grpBy==="status"?g.key:"todo")}>+ ?œìŠ¤??ì¶”ê?</button>
                          </td>
                        </tr>
                      )}
                      <tr className="mdsum">
                        <td className="mdspine" />
                        <td />
                        <td />
                        <td>
                          {stCount.length>0&&<div className="mdstack">
                            {stCount.map((c)=><i key={c.id} title={`${c.label} ${c.n}`} style={{background:c.color,flex:c.n}} />)}
                          </div>}
                        </td>
                        <td>
                          {dues.length>0&&<span className="mdrange">{dues[0].slice(5).replace("-","??")}????{dues[dues.length-1].slice(5).replace("-","??")}??/span>}
                        </td>
                        <td>
                          {prCount.length>0&&<div className="mdstack">
                            {prCount.map((p)=><i key={p.id} title={`${p.label} ${p.n}`} style={{background:p.color,flex:p.n}} />)}
                          </div>}
                        </td>
                        <td><span className="mdrange">?‰ê·  {avgPg}%</span></td>
                        <td />
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );})}
        </div>
        );
      })()}

      {view==="archive"&&(<>
        <div className="panel"><h3>?„ë£Œ ?…ë¬´ ë³´ê???/h3><p className="sub">ë³´ë“œ?ì„œ ì¹˜ìš´ ?…ë¬´?…ë‹ˆ?? ?˜ëŒë¦¬ë©´ ?¤ì‹œ ë³´ë“œë¡??¬ë¼?µë‹ˆ??</p>
          <div style={{display:"flex",gap:7}}>{canEdit&&<button className="btn ghost" onClick={()=>setConfirmBox({kind:"archiveDone"})}>?„ë£Œ {live.filter((t)=>t.status==="done").length}ê±?ë³´ê??˜ê¸°</button>}{isAdmin&&archived.length>0&&<button className="btn warn" onClick={()=>setConfirmBox({kind:"purge"})}>ë³´ê????êµ¬ ?? œ</button>}</div>
        </div>
        <table className="tbl"><thead><tr><th>ì±„ë„</th><th>?…ë¬´ëª?/th><th>?´ë‹¹</th><th>?„ë£Œ</th><th></th></tr></thead>
          <tbody>
            {archived.length===0&&<tr><td colSpan={5} style={{textAlign:"center",color:"#8F959C",padding:20,fontSize:12}}>ë³´ê????…ë¬´ê°€ ?†ìŠµ?ˆë‹¤</td></tr>}
            {archived.slice().sort((a,b)=>(b.doneAt||0)-(a.doneAt||0)).map((t)=>(
              <tr key={t.id}><td><span className="chdot m"><b style={{background:chColor(t.channel)}} />{t.channel}</span></td><td style={{fontWeight:600,color:"#565C64"}}>{t.title}</td><td className="m">{t.owner||"??}</td><td className="m">{t.doneAt?fmtTs(t.doneAt):"??}</td><td style={{textAlign:"right"}}>{canEdit&&<button className="btn ghost" onClick={()=>setArchivedFlag(t,false)}>?˜ëŒë¦¬ê¸°</button>}</td></tr>
            ))}
          </tbody>
        </table>
      </>)}

      {view==="log"&&(
        <div><div className="panel"><h3>ë³€ê²??´ë ¥</h3><p className="sub">ìµœê·¼ {LOG_CAP}ê±´ê¹Œì§€ ?¨ìŠµ?ˆë‹¤.</p></div>
          {(data.log||[]).length===0&&<div className="empty">ê¸°ë¡???†ìŠµ?ˆë‹¤</div>}
          {(data.log||[]).map((e)=><div key={e.id} className="logrow"><span className="t">{fmtTs(e.ts)}</span><span className="w">{e.who}</span><span><b style={{fontWeight:600}}>{e.action}</b>{e.taskTitle&&<span style={{color:"#565C64"}}> Â· {e.taskTitle}</span>}{e.detail&&<span style={{fontSize:10.5,color:"#8F959C"}}> ??{e.detail}</span>}</span></div>)}
        </div>
      )}

      {view==="team"&&(<>
        <div className="panel"><h3>?€?ê³¼ ê¶Œí•œ</h3><p className="sub">ê´€ë¦¬ì/ë©¤ë²„/ë·°ì–´ 3?¨ê³„.</p>
          {data.members.length===0&&<div className="empty">?€?ì´ ?†ìŠµ?ˆë‹¤</div>}
          {data.members.map((m)=>(
            <div key={m.name} className="mrow" style={{borderTop:"1px solid var(--line)"}}>
              <span style={{fontWeight:600,fontSize:13,minWidth:90}}>{m.name}{m.name===me&&<span style={{fontSize:10,color:"#8F959C",fontFamily:"monospace"}}> (??</span>}</span>
              <span style={{fontSize:11,fontFamily:"monospace",color:m.pw?"var(--ok)":"var(--warn)"}}>{m.pw?"?”’ ?¤ì •??:"??ë¹„ë²ˆ?†ìŒ"}</span>
              <select className="sel" value={m.role} disabled={!isAdmin} onChange={(e)=>{const role=e.target.value;commit((d)=>({...d,members:d.members.map((x)=>x.name===m.name?{...x,role,updatedAt:Date.now()}:x)}),[mkLog("ê¶Œí•œ ë³€ê²?,null,`${m.name} -> ${ROLES.find((r)=>r.id===role).label}`)]);}}>
                {ROLES.map((r)=><option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
              <span className="spacer" />{isAdmin&&m.name!==me&&<button className="del" onClick={()=>{if(window.confirm(`"${m.name}" ?˜ì„ ?€?ì„œ ?´ë³´?¼ê¹Œ?? ë¡œê·¸?¸í•  ???†ê²Œ ?©ë‹ˆ??`))commit((d)=>({...d,members:d.members.filter((x)=>x.name!==m.name)}),[mkLog("?€???? œ",null,m.name)]);}}>?´ë³´?´ê¸°</button>}
            </div>
          ))}
        </div>
        
        <div className="panel"><h3>?ë§¤ ì±„ë„</h3><p className="sub">?ìœ„ ì±„ë„ ?„ë˜???˜ìœ„ ì±„ë„???£ì„ ???ˆìŠµ?ˆë‹¤. ?´ë¦„???´ë¦­?˜ë©´ ?˜ì •?©ë‹ˆ??</p>
          {topChannels.map((c)=>{
            const i=data.channels.findIndex((x)=>x.id===c.id);
            const kids=subsOf(c.id);
            const cnt=(id)=>data.tasks.filter((t)=>!t.deleted&&t.channel===id).length;
            return (
            <div key={c.id} style={{borderTop:"1px solid var(--line)",paddingTop:4,marginTop:4}}>
              <div className="mrow" style={{borderTop:"none"}}>
                <input type="color" value={c.color} disabled={!isAdmin} style={{width:34,height:26,padding:0,border:"1px solid #A9B0A6"}}
                  onChange={(e)=>{const color=e.target.value;commit((d)=>({...d,channels:d.channels.map((x,j)=>j===i?{...x,color}:x),channelsUpdatedAt:Date.now()}),[]);}} />
                <input defaultValue={c.id} disabled={!isAdmin}
                  onBlur={(e)=>{const newId=e.target.value.trim();if(!newId||newId===c.id)return;
                    commit((d)=>({...d,
                      channels:d.channels.map((x)=>x.id===c.id?{...x,id:newId}:(x.parent===c.id?{...x,parent:newId}:x)),
                      tasks:d.tasks.map((t)=>t.channel===c.id?{...t,channel:newId}:t),
                      channelsUpdatedAt:Date.now()}),[mkLog("ì±„ë„ ?´ë¦„ ë³€ê²?,null,`${c.id} ??${newId}`)]);}}
                  style={{fontSize:14,fontWeight:700,border:"none",background:"transparent",width:120,padding:"2px 4px",borderBottom:isAdmin?"1px dashed #A9B0A6":"none"}} />
                <span style={{fontSize:11,color:"var(--ink2)",fontFamily:"monospace"}}>{cnt(c.id)}ê±?/span>
                <span className="spacer" />
                {isAdmin&&<button className="btn ghost" style={{padding:"3px 9px",fontSize:11.5}} onClick={()=>setSubTarget(c.id)}>+ ?˜ìœ„</button>}
                {isAdmin&&topChannels.length>1&&<button className="del" onClick={()=>commit((d)=>({...d,channels:d.channels.filter((x)=>x.id!==c.id&&x.parent!==c.id),channelsUpdatedAt:Date.now()}),[mkLog("ì±„ë„ ?? œ",null,c.id)])}>?? œ</button>}
              </div>
              {kids.map((k)=>(
                <div key={k.id} className="mrow" style={{borderTop:"none",paddingLeft:22,paddingTop:3,paddingBottom:3}}>
                  <span style={{color:"var(--ink2)",fontSize:12}}>??/span>
                  <input type="color" value={k.color} disabled={!isAdmin} style={{width:26,height:20,padding:0,border:"1px solid #A9B0A6"}}
                    onChange={(e)=>{const color=e.target.value;commit((d)=>({...d,channels:d.channels.map((x)=>x.id===k.id?{...x,color}:x),channelsUpdatedAt:Date.now()}),[]);}} />
                  <input defaultValue={k.id} disabled={!isAdmin}
                    onBlur={(e)=>{const newId=e.target.value.trim();if(!newId||newId===k.id)return;
                      commit((d)=>({...d,
                        channels:d.channels.map((x)=>x.id===k.id?{...x,id:newId}:x),
                        tasks:d.tasks.map((t)=>t.channel===k.id?{...t,channel:newId}:t),
                        channelsUpdatedAt:Date.now()}),[mkLog("?˜ìœ„ ì±„ë„ ?´ë¦„ ë³€ê²?,null,`${k.id} ??${newId}`)]);}}
                    style={{fontSize:13,border:"none",background:"transparent",width:110,padding:"2px 4px",borderBottom:isAdmin?"1px dashed #CDD3CA":"none"}} />
                  <span style={{fontSize:11,color:"var(--ink2)",fontFamily:"monospace"}}>{cnt(k.id)}ê±?/span>
                  <span className="spacer" />
                  {isAdmin&&<button className="del" onClick={()=>commit((d)=>({...d,channels:d.channels.filter((x)=>x.id!==k.id),channelsUpdatedAt:Date.now()}),[mkLog("?˜ìœ„ ì±„ë„ ?? œ",null,k.id)])}>?? œ</button>}
                </div>
              ))}
              {subTarget===c.id&&isAdmin&&(
                <div className="addrow" style={{paddingLeft:22,marginTop:4}}>
                  <input autoFocus placeholder={`${c.id} ?˜ìœ„ ì±„ë„ëª?} value={newSub} onChange={(e)=>setNewSub(e.target.value)} />
                  <button onClick={()=>addChannel(c.id)}>ì¶”ê?</button>
                  <button style={{background:"transparent",border:"1px solid #A9B0A6",color:"var(--ink2)",padding:"6px 11px",fontSize:12}} onClick={()=>{setSubTarget(null);setNewSub("");}}>ì·¨ì†Œ</button>
                </div>
              )}
            </div>
          );})}
          {isAdmin&&(
            <div className="addrow" style={{marginTop:14,borderTop:"1px solid var(--line)",paddingTop:14}}>
              <input placeholder="?ìœ„ ì±„ë„ëª??…ë ¥ ??ì¶”ê? ë²„íŠ¼ ?´ë¦­" value={newChannel} onChange={(e)=>setNewChannel(e.target.value)} />
              <button onClick={()=>addChannel(null)}>ì¶”ê?</button>
            </div>
          )}
        </div>
        <div className="panel"><h3>ë³´ë“œ ì»¬ëŸ¼ ?´ë¦„</h3><p className="sub">ë³´ë“œ??5ê°?ì»¬ëŸ¼(?€ê¸°Â·ì§„?‰ì¤‘Â·ê²€? ì»¨?ŒÂ·ì´?ˆÂ·ì™„ë£? ?´ë¦„???í•˜???€ë¡?ë°”ê¿‰?ˆë‹¤.</p>
          {cols.map((c)=>(
            <div key={c.id} className="mrow" style={{borderTop:"1px solid var(--line)"}}>
              <span style={{fontSize:11,fontFamily:"monospace",color:"var(--ink3)",minWidth:70}}>{c.id}</span>
              <input disabled={!isAdmin} defaultValue={c.label} placeholder={c.label}
                onBlur={(e)=>{
                  const v=e.target.value.trim();
                  if(!v||v===c.label)return;
                  commit((d)=>({...d,colLabels:{...(d.colLabels||{}),[c.id]:v},colLabelsUpdatedAt:Date.now()}),[mkLog("ì»¬ëŸ¼ëª?ë³€ê²?,null,`${c.id} -> ${v}`)]);
                }}
                onKeyDown={(e)=>{if(e.key==="Enter")e.target.blur();}}
                style={{flex:1,maxWidth:220,background:"#FBFCFA",border:"1px solid #C4C9C1",padding:"6px 9px",fontSize:13}} />
              {(data.colLabels||{})[c.id]&&isAdmin&&<button className="del" onClick={()=>commit((d)=>{const cl={...(d.colLabels||{})};delete cl[c.id];return{...d,colLabels:cl,colLabelsUpdatedAt:Date.now()};},[mkLog("ì»¬ëŸ¼ëª?ì´ˆê¸°??,null,c.id)])}>ì´ˆê¸°??/button>}
            </div>
          ))}
        </div>

        <div className="panel"><h3>?…ë¬´ ? í˜•</h3><p className="sub">?…ë¬´ ?ì„¸?ì„œ ? íƒ?????ˆëŠ” ? í˜•??ì¶”ê?Â·?? œ?©ë‹ˆ??</p>
          <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
            {(data.types||TYPES).map((t)=>(
              <span key={t} style={{display:"inline-flex",alignItems:"center",gap:6,background:"#EBECF0",borderRadius:16,padding:"5px 12px",fontSize:13,fontWeight:600,color:"var(--ink2)"}}>
                {t}
                {isAdmin&&(data.types||TYPES).length>1&&<button style={{background:"none",border:"none",color:"var(--ink3)",cursor:"pointer",fontSize:15,lineHeight:1,padding:0}} onClick={()=>{commit((d)=>({...d,types:(d.types||TYPES).filter((x)=>x!==t),typesUpdatedAt:Date.now()}),[mkLog("?…ë¬´? í˜• ?? œ",null,t)]);}}>Ã—</button>}
              </span>
            ))}
          </div>
          {isAdmin&&(
            <div className="addrow" style={{marginTop:12}}>
              <input placeholder="???…ë¬´ ? í˜• ?…ë ¥ ??ì¶”ê?" value={newType} onChange={(e)=>setNewType(e.target.value)} />
              <button onClick={()=>{const t=newType.trim();if(!t)return;if((data.types||TYPES).includes(t)){alert("?´ë? ?ˆëŠ” ? í˜•?…ë‹ˆ??");return;}commit((d)=>({...d,types:[...(d.types||TYPES),t],typesUpdatedAt:Date.now()}),[mkLog("?…ë¬´? í˜• ì¶”ê?",null,t)]);setNewType("");}}>ì¶”ê?</button>
            </div>
          )}
        </div>

        <div className="panel"><h3>ë°˜ë³µ?…ë¬´ ë¶„ë¥˜</h3><p className="sub">ë°˜ë³µ?…ë¬´ë¥?ë¬¶ì–´??ë³´ì—¬ì¤?ë¶„ë¥˜ë¥??ìœ ë¡?²Œ ë§Œë“­?ˆë‹¤. (?? ?¤ì „/?¤í›„ ?€???€ë³? ì±„ë„ë³???</p>
          <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
            {(data.routineCats&&data.routineCats.length?data.routineCats:["?¤ì „","?¤í›„"]).map((c)=>(
              <span key={c} style={{display:"inline-flex",alignItems:"center",gap:6,background:"#EBECF0",borderRadius:16,padding:"5px 12px",fontSize:13,fontWeight:600,color:"var(--ink2)"}}>
                {c}
                {isAdmin&&(data.routineCats||["?¤ì „","?¤í›„"]).length>1&&<button style={{background:"none",border:"none",color:"var(--ink3)",cursor:"pointer",fontSize:15,lineHeight:1,padding:0}} onClick={()=>{commit((d)=>({...d,routineCats:(d.routineCats&&d.routineCats.length?d.routineCats:["?¤ì „","?¤í›„"]).filter((x)=>x!==c),routineCatsUpdatedAt:Date.now()}),[mkLog("ë°˜ë³µ?…ë¬´ë¶„ë¥˜ ?? œ",null,c)]);}}>Ã—</button>}
              </span>
            ))}
          </div>
          {isAdmin&&(
            <div className="addrow" style={{marginTop:12}}>
              <input placeholder="??ë¶„ë¥˜ ?…ë ¥ ??ì¶”ê?" value={newRcat} onChange={(e)=>setNewRcat(e.target.value)} />
              <button onClick={()=>{const c=newRcat.trim();if(!c)return;const cur=data.routineCats&&data.routineCats.length?data.routineCats:["?¤ì „","?¤í›„"];if(cur.includes(c)){alert("?´ë? ?ˆëŠ” ë¶„ë¥˜?…ë‹ˆ??");return;}commit((d)=>({...d,routineCats:[...cur,c],routineCatsUpdatedAt:Date.now()}),[mkLog("ë°˜ë³µ?…ë¬´ë¶„ë¥˜ ì¶”ê?",null,c)]);setNewRcat("");}}>ì¶”ê?</button>
            </div>
          )}
        </div>

        <div className="panel"><h3>ë°±ì—…</h3><p className="sub">ì£¼ê¸°?ìœ¼ë¡??´ë ¤ë°›ì•„ ?ì„¸??</p>
          <div style={{display:"flex",gap:7}}>
            <button className="btn ghost" onClick={exportJson}>JSON ?´ë ¤ë°›ê¸°</button>
            {isAdmin&&<button className="btn ghost" onClick={()=>importRef.current?.click()}>JSON ê°€?¸ì˜¤ê¸?/button>}
            <input ref={importRef} type="file" accept=".json" style={{display:"none"}} onChange={(e)=>{const f=e.target.files?.[0];if(f)importJson(f);e.target.value="";}} />
          </div>
        </div>
      </>)}

      </div>
      <div className="note" style={{margin:"18px 16px 0"}}>?°ì´?°ëŠ” Firebase(êµ¬ê?)???¤ì‹œê°??€?¥ë©?ˆë‹¤. ê³„ì•½ ì¡°ê±´?´ë‚˜ ê°œì¸?•ë³´???¬ë¦¬ì§€ ë§ˆì„¸??</div>

      {pwChange&&(
        <div className="mask" onClick={(e)=>e.target===e.currentTarget&&setPwChange(null)}><div className="modal sm">
          <h2>ë¹„ë?ë²ˆí˜¸ ë³€ê²?/h2>
          <div className="modal-body">
            <div className="fld"><label>?„ì¬ ë¹„ë?ë²ˆí˜¸</label><input type="password" value={pwChange.cur} onChange={(e)=>setPwChange({...pwChange,cur:e.target.value})} placeholder="?„ì¬ ë¹„ë?ë²ˆí˜¸" /></div>
            <div className="fld"><label>??ë¹„ë?ë²ˆí˜¸</label><input type="password" value={pwChange.next} onChange={(e)=>setPwChange({...pwChange,next:e.target.value})} placeholder="4???´ìƒ" /></div>
            <div className="fld"><label>??ë¹„ë?ë²ˆí˜¸ ?•ì¸</label><input type="password" value={pwChange.next2} onChange={(e)=>setPwChange({...pwChange,next2:e.target.value})} onKeyDown={(e)=>{if(e.key==="Enter")changePw();}} placeholder="??ë¹„ë?ë²ˆí˜¸ ?¤ì‹œ ?…ë ¥" /></div>
          </div>
          <div className="modal-foot"><span className="spacer" />
            <button className="btn ghost" onClick={()=>setPwChange(null)}>ì·¨ì†Œ</button>
            <button className="btn-save" onClick={changePw}>ë³€ê²?/button>
          </div>
        </div></div>
      )}

      {askName&&(
        <div className="mask"><div className="modal sm"><h2>?´ë¦„???Œë ¤ì£¼ì„¸??/h2><p className="hint" style={{lineHeight:1.6,marginBottom:14}}>?´ë‹¹?? ?“ê?, ë³€ê²??´ë ¥?????´ë¦„???¨ìŠµ?ˆë‹¤.</p>
          <div className="fld"><label>?´ë¦„</label><input autoFocus value={nameInput} onChange={(e)=>setNameInput(e.target.value)} onKeyDown={(e)=>{if(e.nativeEvent.isComposing||e.key!=="Enter")return;saveMe(nameInput);}} placeholder="?? ê¹€?„ë?" /></div>
          <div className="mfoot"><span className="spacer" />{me&&<button className="btn ghost" onClick={()=>setAskName(false)}>ì·¨ì†Œ</button>}<button className="btn" onClick={()=>saveMe(nameInput)}>?œì‘?˜ê¸°</button></div>
        </div></div>
      )}

      {riAdd&&(
        <div className="mask" onClick={(e)=>e.target===e.currentTarget&&setRiAdd(null)}><div className="modal sm">
          <h2>{riAdd.id?"??ª© ?˜ì •":"????ª© ì¶”ê?"}</h2>
          <div className="modal-body">
            <div className="fld"><label>?€ë¶„ë¥˜</label><input list="ri-cats" autoFocus value={riAdd.cat} onChange={(e)=>setRiAdd({...riAdd,cat:e.target.value})} placeholder="?? ?¸ë?ì±„ë„" />
              <datalist id="ri-cats">{riCatNames.map((c)=><option key={c} value={c} />)}</datalist>
            </div>
            <div className="fld"><label>ì¤‘ë¶„ë¥?/label><input list="ri-subs" value={riAdd.sub} onChange={(e)=>setRiAdd({...riAdd,sub:e.target.value})} placeholder="?? ì§€ê·¸ì¬ê·? />
              <datalist id="ri-subs">{riSubNames(riAdd.cat).map((s)=><option key={s} value={s} />)}</datalist>
            </div>
            <div className="fld"><label>?Œë¶„ë¥?(ì²´í¬ ??ª©)</label><input value={riAdd.title} onChange={(e)=>setRiAdd({...riAdd,title:e.target.value})} placeholder="?? CPC ?•ì¸" onKeyDown={(e)=>{if(e.nativeEvent.isComposing||e.key!=="Enter")return;saveRi();}} /></div>
          </div>
          <div className="mfoot">
            {riAdd.id&&<button className="del" onClick={()=>removeRi(riAdd)}>?? œ</button>}
            <span className="spacer" />
            <button className="btn ghost" onClick={()=>setRiAdd(null)}>ì·¨ì†Œ</button>
            <button className="btn-save" onClick={saveRi}>?€??/button>
          </div>
        </div></div>
      )}

      {issueDetail&&(()=>{
        const i=issueDetail;
        const addHistory=(text)=>{
          const t=text.trim();if(!t)return;
          const entry={id:uid(),text:t,author:me||"?µëª…",ts:Date.now()};
          if(i.routineId){
            commit((d)=>({...d,routines:(d.routines||[]).map((r)=>r.id===i.routineId?{...r,issues:(r.issues||[]).map((x)=>x.id===i.id?{...x,history:[...(x.history||[]),entry]}:x),updatedAt:Date.now()}:r)}),[]);
          }else{
            commit((d)=>({...d,tasks:d.tasks.map((tk)=>tk.id===i.taskId?{...tk,issues:(tk.issues||[]).map((x)=>x.id===i.id?{...x,history:[...(x.history||[]),entry]}:x),updatedAt:Date.now()}:tk)}),[]);
          }
          setIssueDetail({...i,history:[...(i.history||[]),entry]});
        };
        const applyHist=(newHist)=>{
          if(i.routineId)commit((d)=>({...d,routines:(d.routines||[]).map((r)=>r.id===i.routineId?{...r,issues:(r.issues||[]).map((x)=>x.id===i.id?{...x,history:newHist}:x),updatedAt:Date.now()}:r)}),[]);
          else commit((d)=>({...d,tasks:d.tasks.map((tk)=>tk.id===i.taskId?{...tk,issues:(tk.issues||[]).map((x)=>x.id===i.id?{...x,history:newHist}:x),updatedAt:Date.now()}:tk)}),[]);
          setIssueDetail({...i,history:newHist});
        };
        const editHistory=(hid,text)=>{const t=text.trim();if(!t)return;applyHist((i.history||[]).map((h)=>h.id===hid?{...h,text:t,edited:true}:h));};
        const delHistory=(hid)=>applyHist((i.history||[]).filter((h)=>h.id!==hid));
        const toggleR=()=>{
          if(i.routineId)toggleIssue(i.routineId,i.id);
          else commit((d)=>({...d,tasks:d.tasks.map((tk)=>tk.id===i.taskId?{...tk,issues:(tk.issues||[]).map((x)=>x.id===i.id?{...x,resolved:!x.resolved,resolvedBy:me}:x),updatedAt:Date.now()}:tk)}),[]);
          setIssueDetail({...i,resolved:!i.resolved});
        };
        return (
        <div className="mask" onClick={(e)=>e.target===e.currentTarget&&setIssueDetail(null)}><div className="modal">
          <h2>?´ìŠˆ ?ì„¸</h2>
          <div className="modal-body">
            <div style={{background:"#F5F6F8",borderRadius:8,padding:"12px 14px",marginBottom:16}}>
              <div style={{fontSize:15,fontWeight:700,marginBottom:6}}>{i.text}</div>
              <div className="issmeta"><b style={{color:i.src==="?…ë¬´"?"#0055CC":"#1F845A"}}>{i.src}</b> Â· {i.routineTitle} Â· ?±ë¡ {i.author} Â· {fmtTs(i.ts)}{i.owner&&` Â· ?´ë‹¹ ${i.owner}`}</div>
              <button className={"issbtn"+(i.resolved?"":" active")} style={{marginTop:10}} onClick={toggleR}>{i.resolved?"?´ê²°????(?„ë¥´ë©?ë¯¸í•´ê²?":"ë¯¸í•´ê²?(?„ë¥´ë©??´ê²°)"}</button>
            </div>
            <div className="sect" style={{marginTop:0,borderTop:"none"}}><h4>?ˆìŠ¤? ë¦¬ Â· ì§„í–‰ ê¸°ë¡</h4>
              {(i.history||[]).length===0&&<span className="hint">?„ì§ ê¸°ë¡???†ìŠµ?ˆë‹¤. ?„ë˜??ì§„í–‰ ?í™©???ì–´ë³´ì„¸??</span>}
              {(i.history||[]).map((h)=>(
                <div key={h.id} className="cmt">
                  <div className="ch2"><b>{h.author}</b> Â· {fmtTs(h.ts)}{h.edited&&<span style={{color:"var(--ink3)"}}> (?˜ì •??</span>}</div>
                  {h.editing
                    ? <div style={{display:"flex",gap:6,marginTop:4}}>
                        <input defaultValue={h.text} autoFocus style={{flex:1,border:"1px solid var(--line2)",borderRadius:6,padding:"6px 9px",fontSize:14}}
                          onKeyDown={(e)=>{
                            if(e.nativeEvent.isComposing)return;
                            if(e.key==="Enter"){editHistory(h.id,e.target.value);}
                            if(e.key==="Escape")setIssueDetail({...i,history:i.history.map((x)=>x.id===h.id?{...x,editing:false}:x)});
                          }} />
                        <button className="btn ghost" onClick={()=>setIssueDetail({...i,history:i.history.map((x)=>x.id===h.id?{...x,editing:false}:x)})}>ì·¨ì†Œ</button>
                      </div>
                    : <p>{h.text}</p>}
                  {canEdit&&!h.editing&&<div style={{display:"flex",gap:10,marginTop:3}}>
                    <button style={{background:"none",border:"none",color:"var(--ink3)",fontSize:12,cursor:"pointer",padding:0}} onClick={()=>setIssueDetail({...i,history:i.history.map((x)=>x.id===h.id?{...x,editing:true}:x)})}>?˜ì •</button>
                    <button style={{background:"none",border:"none",color:"var(--danger)",fontSize:12,cursor:"pointer",padding:0}} onClick={()=>delHistory(h.id)}>?? œ</button>
                  </div>}
                </div>
              ))}
              {canEdit&&<div className="addrow">
                <textarea className="hinput" placeholder="ì§„í–‰ ?í™©Â·ì¡°ì¹˜ ?´ìš© ?…ë ¥ (Enter ?„ì†¡, Shift+Enter ì¤„ë°”ê¿?" onKeyDown={(e)=>{
                  if(e.nativeEvent.isComposing||e.key!=="Enter"||e.shiftKey)return;
                  e.preventDefault();
                  const v=e.target.value.trim();if(!v)return;
                  addHistory(v);e.target.value="";
                }} />
              </div>}
            </div>
          </div>
          <div className="modal-foot">
            <span className="spacer" />
            <button className="btn ghost" onClick={()=>setIssueDetail(null)}>?«ê¸°</button>
          </div>
        </div></div>
        );
      })()}

      {memoDraft&&(
        <div className="mask" onClick={(e)=>e.target===e.currentTarget&&setMemoDraft(null)}><div className="modal">
          <h2>{memoDraft.id?"ë©”ëª¨ ?˜ì •":"??ë©”ëª¨"}</h2>
          <div className="modal-body">
            <div className="r3">
              <div className="fld"><label>?€ë¶„ë¥˜ (? íƒ)</label><input list="memo-cats" value={memoDraft.cat||""} onChange={(e)=>setMemoDraft({...memoDraft,cat:e.target.value})} placeholder="?? ë§ˆì??? />
                <datalist id="memo-cats">{memoCatNames.map((c)=><option key={c} value={c} />)}</datalist>
              </div>
              <div className="fld"><label>ì¤‘ë¶„ë¥?(? íƒ)</label><input list="memo-subs" value={memoDraft.sub||""} onChange={(e)=>setMemoDraft({...memoDraft,sub:e.target.value})} placeholder="?? ë¸Œëœ?œê??? />
                <datalist id="memo-subs">{memoSubNames(memoDraft.cat||"").map((s)=><option key={s} value={s} />)}</datalist>
              </div>
              <div className="fld"><label>?Œë¶„ë¥?(? íƒ)</label><input value={memoDraft.title||""} onChange={(e)=>setMemoDraft({...memoDraft,title:e.target.value})} placeholder="?? ?¤ì›Œ???„ì´?”ì–´" /></div>
            </div>
            <div className="fld"><label>?´ìš©</label><textarea autoFocus value={memoDraft.text||""} onChange={(e)=>setMemoDraft({...memoDraft,text:e.target.value})} placeholder="ë©”ëª¨ ?´ìš©???…ë ¥?˜ì„¸?? style={{minHeight:100}} /></div>
          </div>
          <div className="modal-foot">
            {memoDraft.id&&<button className="del" onClick={()=>removeMemo(memoDraft)}>?? œ</button>}
            {memoDraft.id&&<button className="btn ghost" onClick={()=>duplicateMemo(memoDraft)}>ë³µì‚¬</button>}
            <span className="spacer" />
            <button className="btn ghost" onClick={()=>setMemoDraft(null)}>?«ê¸°</button>
            <button className="btn-save" onClick={saveMemo}>?€??/button>
          </div>
        </div></div>
      )}

      {mlyDraft&&(
        <div className="mask" onClick={(e)=>e.target===e.currentTarget&&setMlyDraft(null)}><div className="modal">
          <h2>{mlyDraft._new?"???”ê°„ ??ª©":"?”ê°„ ??ª© ?ì„¸"} Â· {mlyDraft.month}</h2>
          <div className="modal-body">
            <div className="fld"><label>?œëª©</label><input autoFocus value={mlyDraft.title} onChange={(e)=>setMlyDraft({...mlyDraft,title:e.target.value})} placeholder="?? ??ë§ˆê° ?¬ê³  ?•ì¸" /></div>
            <div className="fld"><label>?¤ëª…</label><textarea value={mlyDraft.desc||""} onChange={(e)=>setMlyDraft({...mlyDraft,desc:e.target.value})} placeholder="?ˆì°¨, ê¸°ì?ê°? ì°¸ê³  ë§í¬" /></div>
            <div className="sect">
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                <h4 style={{margin:0}}>?˜ìœ„ ??ª©</h4>
                {(mlyDraft.subs||[]).some((s)=>s.done)&&<button className="ckclear" onClick={()=>setMlyDraft({...mlyDraft,subs:(mlyDraft.subs||[]).map((s)=>({...s,done:false}))})}>ì²´í¬ ?„ì²´ ?´ì œ</button>}
              </div>
              {(mlyDraft.subs||[]).length===0&&<span className="hint">?˜ìœ„ ??ª©???†ìŠµ?ˆë‹¤</span>}
              {(mlyDraft.subs||[]).map((s)=>{
                const subOpen=!!mlySubHistOpen[s.id];
                const subsubOpen=!!mlySubsubOpen[s.id];
                const subsubs=s.subsubs||[];
                return (
                <div key={s.id}>
                  <div className="fcitem">
                    <button className={"fccheck"+(s.done?" on":"")} onClick={()=>setMlyDraft({...mlyDraft,subs:mlyDraft.subs.map((x)=>x.id===s.id?{...x,done:!x.done}:x)})}>{s.done?"??:""}</button>
                    {s.editing
                      ? <input defaultValue={s.text} autoFocus style={{flex:1,fontSize:13,border:"1px solid var(--line2)",borderRadius:6,padding:"4px 7px"}}
                          onKeyDown={(e)=>{if(e.nativeEvent.isComposing)return;if(e.key==="Enter"){const v=e.target.value.trim();if(v)setMlyDraft({...mlyDraft,subs:mlyDraft.subs.map((x)=>x.id===s.id?{...x,text:v,editing:false}:x)});}if(e.key==="Escape")setMlyDraft({...mlyDraft,subs:mlyDraft.subs.map((x)=>x.id===s.id?{...x,editing:false}:x)});}}
                          onBlur={(e)=>{const v=e.target.value.trim();if(v)setMlyDraft({...mlyDraft,subs:mlyDraft.subs.map((x)=>x.id===s.id?{...x,text:v,editing:false}:x)});}} />
                      : <span style={{flex:1,fontSize:13,textDecoration:s.done?"line-through":"none",color:s.done?"var(--ink3)":"inherit",cursor:"pointer"}} onClick={()=>setMlyDraft({...mlyDraft,subs:mlyDraft.subs.map((x)=>x.id===s.id?{...x,editing:true}:x)})}>{s.text}</span>}
                    <button style={{background:"none",border:"none",color:"var(--ink3)",cursor:"pointer",fontSize:11}} onClick={()=>setMlySubsubOpen({...mlySubsubOpen,[s.id]:!subsubOpen})}>{subsubs.length>0?`?˜ìœ„ëª©ë¡ ${subsubs.filter((x)=>x.done).length}/${subsubs.length}`:"+?˜ìœ„ëª©ë¡"}</button>
                    <button style={{background:"none",border:"none",color:"var(--ink3)",cursor:"pointer",fontSize:11}} onClick={()=>setMlySubHistOpen({...mlySubHistOpen,[s.id]:!subOpen})}>{(s.history||[]).length>0?`?ˆìŠ¤? ë¦¬ ${s.history.length}`:"+?ˆìŠ¤? ë¦¬"}</button>
                    <button style={{background:"none",border:"none",color:"var(--ink3)",cursor:"pointer",fontSize:15}} onClick={()=>setMlyDraft({...mlyDraft,subs:mlyDraft.subs.filter((x)=>x.id!==s.id)})}>Ã—</button>
                  </div>
                  {subsubOpen&&(
                    <div style={{paddingLeft:31,marginBottom:8}}>
                      {subsubs.length===0&&<span className="hint">?˜ìœ„ ëª©ë¡???†ìŠµ?ˆë‹¤</span>}
                      {subsubs.map((x)=>(
                        <div key={x.id} style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                          <button className={"fccheck"+(x.done?" on":"")} onClick={()=>setMlyDraft({...mlyDraft,subs:mlyDraft.subs.map((y)=>y.id===s.id?{...y,subsubs:y.subsubs.map((z)=>z.id===x.id?{...z,done:!z.done}:z)}:y)})}>{x.done?"??:""}</button>
                          <span style={{flex:1,fontSize:12.5,textDecoration:x.done?"line-through":"none",color:x.done?"var(--ink3)":"inherit"}}>{x.text}</span>
                          <button style={{background:"none",border:"none",color:"var(--ink3)",cursor:"pointer",fontSize:14}} onClick={()=>setMlyDraft({...mlyDraft,subs:mlyDraft.subs.map((y)=>y.id===s.id?{...y,subsubs:y.subsubs.filter((z)=>z.id!==x.id)}:y)})}>Ã—</button>
                        </div>
                      ))}
                      <div className="addrow"><input placeholder="?˜ìœ„ëª©ë¡ ??ª© ?…ë ¥ ??Enter" onKeyDown={(e)=>{if(e.nativeEvent.isComposing||e.key!=="Enter")return;const v=e.target.value.trim();if(!v)return;setMlyDraft({...mlyDraft,subs:mlyDraft.subs.map((y)=>y.id===s.id?{...y,subsubs:[...(y.subsubs||[]),{id:uid(),text:v,done:false}]}:y)});e.target.value="";}} /></div>
                    </div>
                  )}
                  {subOpen&&(
                    <div style={{paddingLeft:31,marginBottom:8}}>
                      {(s.history||[]).length===0&&<span className="hint">ê¸°ë¡???†ìŠµ?ˆë‹¤</span>}

                      {(s.history||[]).map((h)=>(
                        <div key={h.id} className="cmt">
                          <div className="ch2"><b>{h.author}</b> Â· {fmtTs(h.ts)}{h.edited&&<span style={{color:"var(--ink3)"}}> (?˜ì •??</span>}</div>
                          {mlySubHistEditId===h.id
                            ? <textarea className="hinput" defaultValue={h.text} autoFocus style={{width:"100%",marginTop:4}}
                                onKeyDown={(e)=>{if(e.nativeEvent.isComposing||e.key!=="Enter"||e.shiftKey)return;e.preventDefault();editMlySubHistory(s.id,h.id,e.target.value);setMlySubHistEditId(null);}}
                                onBlur={(e)=>{editMlySubHistory(s.id,h.id,e.target.value);setMlySubHistEditId(null);}} />
                            : <p>{h.text}</p>}
                          {mlySubHistEditId!==h.id&&<div style={{display:"flex",gap:10}}>
                            <button style={{background:"none",border:"none",color:"var(--ink3)",fontSize:11,cursor:"pointer",padding:0}} onClick={()=>setMlySubHistEditId(h.id)}>?˜ì •</button>
                            <button style={{background:"none",border:"none",color:"var(--danger)",fontSize:11,cursor:"pointer",padding:0}} onClick={()=>removeMlySubHistory(s.id,h.id)}>?? œ</button>
                          </div>}
                        </div>
                      ))}
                      <div className="addrow">
                        <textarea className="hinput" placeholder="?ˆìŠ¤? ë¦¬ ?…ë ¥ (Enter ì¶”ê?, Shift+Enter ì¤„ë°”ê¿?"
                          value={mlySubHistText[s.id]||""} onChange={(e)=>setMlySubHistText({...mlySubHistText,[s.id]:e.target.value})}
                          onKeyDown={(e)=>{if(e.nativeEvent.isComposing||e.key!=="Enter"||e.shiftKey)return;e.preventDefault();addMlySubHistory(s.id,mlySubHistText[s.id]||"");setMlySubHistText({...mlySubHistText,[s.id]:""});}} />
                      </div>
                    </div>
                  )}
                </div>
                );
              })}
              <div className="addrow"><input placeholder="?˜ìœ„ ??ª© ?…ë ¥ ??Enter" onKeyDown={(e)=>{if(e.nativeEvent.isComposing||e.key!=="Enter")return;const v=e.target.value.trim();if(!v)return;setMlyDraft({...mlyDraft,subs:[...(mlyDraft.subs||[]),{id:uid(),text:v,done:false,history:[]}]});e.target.value="";}} /></div>
            </div>
            <div className="sect"><h4>?ˆìŠ¤? ë¦¬</h4>
              {(mlyDraft.history||[]).length===0&&<span className="hint">ì§„í–‰ ê¸°ë¡???†ìŠµ?ˆë‹¤</span>}
              {(mlyDraft.history||[]).map((h)=>(
                <div key={h.id} className="cmt">
                  <div className="ch2"><b>{h.author}</b> Â· {fmtTs(h.ts)}{h.edited&&<span style={{color:"var(--ink3)"}}> (?˜ì •??</span>}</div>
                  {mlyHistEditId===h.id
                    ? <textarea className="hinput" defaultValue={h.text} autoFocus style={{width:"100%",marginTop:4}}
                        onKeyDown={(e)=>{if(e.nativeEvent.isComposing||e.key!=="Enter"||e.shiftKey)return;e.preventDefault();editMlyHistory(h.id,e.target.value);setMlyHistEditId(null);}}
                        onBlur={(e)=>{editMlyHistory(h.id,e.target.value);setMlyHistEditId(null);}} />
                    : <p>{h.text}</p>}
                  {mlyHistEditId!==h.id&&<div style={{display:"flex",gap:10}}>
                    <button style={{background:"none",border:"none",color:"var(--ink3)",fontSize:11,cursor:"pointer",padding:0}} onClick={()=>setMlyHistEditId(h.id)}>?˜ì •</button>
                    <button style={{background:"none",border:"none",color:"var(--danger)",fontSize:11,cursor:"pointer",padding:0}} onClick={()=>removeMlyHistory(h.id)}>?? œ</button>
                  </div>}
                </div>
              ))}
              <div className="addrow"><textarea className="hinput" placeholder="ì§„í–‰ ?í™© ?…ë ¥ (Enter ?„ì†¡, Shift+Enter ì¤„ë°”ê¿?" onKeyDown={(e)=>{if(e.nativeEvent.isComposing||e.key!=="Enter"||e.shiftKey)return;e.preventDefault();const v=e.target.value.trim();if(!v)return;setMlyDraft({...mlyDraft,history:[...(mlyDraft.history||[]),{id:uid(),text:v,author:me||"?µëª…",ts:Date.now()}]});e.target.value="";}} /></div>
            </div>
          </div>
          <div className="modal-foot">
            {!mlyDraft._new&&<button className="del" onClick={()=>removeMly(mlyDraft)}>?? œ</button>}
            {!mlyDraft._new&&<button className="btn ghost" onClick={()=>duplicateMlyToNextMonth(mlyDraft)}>?¤ìŒ?¬ë¡œ ë³µì‚¬</button>}
            <span className="spacer" />
            <button className="btn ghost" onClick={()=>setMlyDraft(null)}>?«ê¸°</button>
            <button className="btn-save" onClick={saveMly}>?€??/button>
          </div>
        </div></div>
      )}

      {ckDraft&&(()=>{
        const isCL=ckDraft.tab==="checklist";
        return (
        <div className="mask" onClick={(e)=>e.target===e.currentTarget&&setCkDraft(null)}><div className="modal">
          <h2>{ckDraft._new?"????ª©":"??ª© ?ì„¸"} Â· {CKTABS.find((t)=>t.id===ckDraft.tab)?.label}</h2>
          <div className="modal-body">
            <div className="fld"><label>?œëª©</label><input autoFocus value={ckDraft.title} onChange={(e)=>setCkDraft({...ckDraft,title:e.target.value})} placeholder="?? ?¬ë¦„ ?¹ê???ë°°ë„ˆ ?ë³µ" /></div>
            <div className="r2">
              <div className="fld"><label>?œì‘??/label><input type="date" value={ckDraft.start||""} onChange={(e)=>setCkDraft({...ckDraft,start:e.target.value})} /></div>
              <div className="fld"><label>ì¢…ë£Œ??(ë§ˆê°)</label><input type="date" value={ckDraft.due||""} onChange={(e)=>setCkDraft({...ckDraft,due:e.target.value})} /></div>
            </div>
            <div className="fld"><label>?¤ëª…</label><textarea value={ckDraft.desc||""} onChange={(e)=>setCkDraft({...ckDraft,desc:e.target.value})} placeholder="?ë³µ ?€?? ?ˆì°¨, ì°¸ê³  ë§í¬" /></div>
            {isCL&&(
              <div className="sect">
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                  <h4 style={{margin:0}}>ì²´í¬ë¦¬ìŠ¤??/h4>
                  {(ckDraft.subs||[]).some((s)=>s.done)&&<button className="ckclear" onClick={()=>setCkDraft({...ckDraft,subs:(ckDraft.subs||[]).map((s)=>({...s,done:false}))})}>ì²´í¬ ?„ì²´ ?´ì œ</button>}
                </div>
                {(ckDraft.subs||[]).length===0&&<span className="hint">?˜ìœ„ ì²´í¬ ??ª©???†ìŠµ?ˆë‹¤</span>}
                {(ckDraft.subs||[]).map((s)=>(
                  <div key={s.id} draggable
                    onDragStart={()=>setCkSubDrag(s.id)}
                    onDragOver={(e)=>e.preventDefault()}
                    onDrop={()=>{
                      if(!ckSubDrag||ckSubDrag===s.id)return;
                      const arr=[...ckDraft.subs];
                      const fi=arr.findIndex((x)=>x.id===ckSubDrag);
                      const ti=arr.findIndex((x)=>x.id===s.id);
                      if(fi<0||ti<0)return;
                      const [moved]=arr.splice(fi,1);
                      arr.splice(ti,0,moved);
                      setCkDraft({...ckDraft,subs:arr});
                      setCkSubDrag(null);
                    }}
                    onDragEnd={()=>setCkSubDrag(null)}
                    className={"fcitem"+(ckSubDrag===s.id?" dragging":"")} style={{cursor:"grab"}}>
                    <button className={"fccheck"+(s.done?" on":"")} onClick={()=>setCkDraft({...ckDraft,subs:ckDraft.subs.map((x)=>x.id===s.id?{...x,done:!x.done}:x)})}>{s.done?"??:""}</button>
                    {s.editing
                      ? <input defaultValue={s.text} autoFocus style={{flex:1,fontSize:13,border:"1px solid var(--line2)",borderRadius:6,padding:"4px 7px"}}
                          onKeyDown={(e)=>{if(e.nativeEvent.isComposing)return;if(e.key==="Enter"){const v=e.target.value.trim();if(v)setCkDraft({...ckDraft,subs:ckDraft.subs.map((x)=>x.id===s.id?{...x,text:v,editing:false}:x)});}if(e.key==="Escape")setCkDraft({...ckDraft,subs:ckDraft.subs.map((x)=>x.id===s.id?{...x,editing:false}:x)});}}
                          onBlur={(e)=>{const v=e.target.value.trim();if(v)setCkDraft({...ckDraft,subs:ckDraft.subs.map((x)=>x.id===s.id?{...x,text:v,editing:false}:x)});}} />
                      : <span style={{flex:1,fontSize:13,textDecoration:s.done?"line-through":"none",color:s.done?"var(--ink3)":"inherit",cursor:"pointer"}} onClick={()=>setCkDraft({...ckDraft,subs:ckDraft.subs.map((x)=>x.id===s.id?{...x,editing:true}:x)})}>{s.text}</span>}
                    <button style={{background:"none",border:"none",color:"var(--ink3)",cursor:"pointer",fontSize:15}} onClick={()=>setCkDraft({...ckDraft,subs:ckDraft.subs.filter((x)=>x.id!==s.id)})}>Ã—</button>
                  </div>
                ))}
                <div className="addrow">
                  <input placeholder="ì²´í¬ ??ª© ?…ë ¥ ??Enter" onKeyDown={(e)=>{
                    if(e.nativeEvent.isComposing||e.key!=="Enter")return;
                    const v=e.target.value.trim();if(!v)return;
                    setCkDraft({...ckDraft,subs:[...(ckDraft.subs||[]),{id:uid(),text:v,done:false}]});e.target.value="";
                  }} />
                </div>
              </div>
            )}
            <div className="sect"><h4>?ˆìŠ¤? ë¦¬</h4>
              {(ckDraft.history||[]).length===0&&<span className="hint">ì§„í–‰ ê¸°ë¡???†ìŠµ?ˆë‹¤</span>}
              {(ckDraft.history||[]).map((h)=>(
                <div key={h.id} className="cmt">
                  <div className="ch2"><b>{h.author}</b> Â· {fmtTs(h.ts)}</div>
                  <p>{h.text}</p>
                </div>
              ))}
              <div className="addrow">
                <textarea className="hinput" placeholder="ì§„í–‰ ?í™©Â·ë©”ëª¨ ?…ë ¥ (Enter ?„ì†¡, Shift+Enter ì¤„ë°”ê¿?" onKeyDown={(e)=>{
                  if(e.nativeEvent.isComposing||e.key!=="Enter"||e.shiftKey)return;
                  e.preventDefault();
                  const v=e.target.value.trim();if(!v)return;
                  const entry={id:uid(),text:v,author:me||"?µëª…",ts:Date.now()};
                  setCkDraft({...ckDraft,history:[...(ckDraft.history||[]),entry]});
                  e.target.value="";
                }} />
              </div>
            </div>
          </div>
          <div className="modal-foot">
            {!ckDraft._new&&<button className="del" onClick={()=>removeCk(ckDraft)}>?? œ</button>}
            {!ckDraft._new&&<button className="btn ghost" onClick={()=>duplicateCk(ckDraft)}>ë³µì‚¬</button>}
            <span className="spacer" />
            <button className="btn ghost" onClick={()=>setCkDraft(null)}>?«ê¸°</button>
            <button className="btn-save" onClick={saveCk}>?€??/button>
          </div>
        </div></div>
        );
      })()}

      {confirmBox&&(
        <div className="mask" onClick={(e)=>e.target===e.currentTarget&&setConfirmBox(null)}><div className="modal sm">
          <h2>{confirmBox.kind==="purge"?"?êµ¬ ?? œ? ê¹Œ??":confirmBox.kind==="archiveOne"?"ë³´ê??¨ìœ¼ë¡???¸¸ê¹Œìš”?":confirmBox.kind==="archiveCk"?"ëª©ë¡?ì„œ ?•ë¦¬? ê¹Œ??":"?„ë£Œ ?…ë¬´ë¥?ë³´ê?? ê¹Œ??"}</h2>
          <p style={{fontSize:12.5,color:"#565C64",lineHeight:1.6}}>{confirmBox.kind==="purge"?`ë³´ê??¨ì˜ ${archived.length}ê±´ì´ ?„ì „???¬ë¼ì§‘ë‹ˆ??`:confirmBox.kind==="archiveOne"?`"${confirmBox.taskTitle}" ?…ë¬´ë¥?ë³´ê??¨ìœ¼ë¡???¸°?œê² ?´ìš”?`:confirmBox.kind==="archiveCk"?`"${confirmBox.ckTitle}" ??ª©???„ë£Œ?ˆìŠµ?ˆë‹¤. ëª©ë¡?ì„œ ?? œ? ê¹Œ?? ?¨ê²¨?ë©´ ?„ë£Œ ?íƒœë¡??œì‹œ?©ë‹ˆ??`:`?„ë£Œ ${live.filter((t)=>t.status==="done").length}ê±´ì´ ë³´ê??¨ìœ¼ë¡??´ë™?©ë‹ˆ??`}</p>
          <div className="mfoot"><span className="spacer" />
            <button className="btn ghost" onClick={()=>setConfirmBox(null)}>{confirmBox.kind==="archiveOne"?"ë³´ë“œ???ê¸°":confirmBox.kind==="archiveCk"?"?¨ê²¨?ê¸°":"ì·¨ì†Œ"}</button>
            <button className={confirmBox.kind==="purge"?"btn warn":"btn-save"} onClick={()=>{
              if(confirmBox.kind==="purge")purgeArchive();
              else if(confirmBox.kind==="archiveCk"){const cid=confirmBox.ckId;commit((d)=>({...d,checkitems:(d.checkitems||[]).map((x)=>x.id===cid?{...x,deleted:true,updatedAt:Date.now()}:x)}),[]);setConfirmBox(null);}
              else if(confirmBox.kind==="archiveOne"){const tid=confirmBox.taskId;commit((d)=>({...d,tasks:d.tasks.map((t)=>t.id===tid?{...t,archived:true,updatedAt:Date.now(),updatedBy:me}:t)}),[mkLog("?„ì¹´?´ë¸Œ",{id:tid,title:confirmBox.taskTitle})]);setConfirmBox(null);}
              else archiveDone();
            }}>{confirmBox.kind==="purge"?"?êµ¬ ?? œ":confirmBox.kind==="archiveCk"?"?? œ":"ë³´ê??˜ê¸°"}</button>
          </div>
        </div></div>
      )}

      {draft&&(
        <div className="mask" onClick={(e)=>e.target===e.currentTarget&&setDraft(null)}><div className="modal">
          <h2>{draft._new?"???…ë¬´":"?…ë¬´ ?ì„¸"}</h2>
          <div className="modal-body">
          <div className="fld"><label>?…ë¬´ëª?/label><input autoFocus disabled={!canEdit} value={draft.title} onChange={(e)=>setDraft({...draft,title:e.target.value})} placeholder="?? ì¿ íŒ¡ ?½í† ì»??ì„¸?˜ì´ì§€ ê°œí¸" /></div>
          <div className="r3">
            <div className="fld"><label>ë¸Œëœ??/label><select disabled={!canEdit} value={draft.brand||""} onChange={(e)=>setDraft({...draft,brand:e.target.value})}>
              <option value="">? íƒ ????/option>
              {subsOf("ë¸Œëœ??).map((k)=><option key={k.id} value={k.id}>{k.id}</option>)}
            </select></div>
            <div className="fld"><label>ì±„ë„</label><select disabled={!canEdit} value={draft.channel} onChange={(e)=>setDraft({...draft,channel:e.target.value})}>
              {topChannels.filter((c)=>c.id!=="ë¸Œëœ??).map((c)=>{
                const kids=subsOf(c.id);
                if(!kids.length)return <option key={c.id} value={c.id}>{c.id}</option>;
                return <optgroup key={c.id} label={c.id}>
                  <option value={c.id}>{c.id} (?„ì²´)</option>
                  {kids.map((k)=><option key={k.id} value={k.id}>?€??{k.id}</option>)}
                </optgroup>;
              })}
            </select></div>
            <div className="fld"><label>?…ë¬´ ? í˜•</label><select disabled={!canEdit} value={draft.type} onChange={(e)=>setDraft({...draft,type:e.target.value})}>{(data.types||TYPES).map((t)=><option key={t} value={t}>{t}</option>)}</select></div>
          </div>
          <div className="fld"><label>?´ë‹¹??/label>
            <input list="wb-owners" value={draft.owner} onChange={(e)=>setDraft({...draft,owner:e.target.value})} placeholder="?´ë¦„ ì§ì ‘ ?…ë ¥ ?ëŠ” ëª©ë¡ ? íƒ" style={{width:"100%",background:"#FBFCFA",border:"1px solid #C4C9C1",padding:"7px 9px",fontSize:13}} />
            <datalist id="wb-owners">
              {[...new Set([...owners,...data.members.map((m)=>m.name),me].filter(Boolean))].map((o)=><option key={o} value={o} />)}
            </datalist>
            {data.members.length>0&&(
              <div style={{display:"flex",flexWrap:"wrap",gap:5,marginTop:6}}>
                {[...new Set([...data.members.map((m)=>m.name),me].filter(Boolean))].map((n)=>(
                  <button key={n} type="button" onClick={()=>setDraft({...draft,owner:n})}
                    style={{background:draft.owner===n?"#1B4D3E":"#EFF2ED",color:draft.owner===n?"#fff":"#565C64",border:"1px solid #DBDFD9",padding:"4px 10px",fontSize:12,cursor:"pointer",fontFamily:"sans-serif"}}>
                    {n}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="r2">
            <div className="fld"><label>?œì‘??/label><input type="date" disabled={!canEdit} value={draft.start||""} onChange={(e)=>setDraft({...draft,start:e.target.value})} /></div>
            <div className="fld"><label>ë§ˆê°??/label><input type="date" disabled={!canEdit} value={draft.due} onChange={(e)=>setDraft({...draft,due:e.target.value})} /></div>
          </div>
          <div className="r3">
            <div className="fld"><label>?°ì„ ?œìœ„</label><select disabled={!canEdit} value={draft.priority} onChange={(e)=>setDraft({...draft,priority:e.target.value})}>{PRIORITIES.map((p)=><option key={p.id} value={p.id}>{p.label}</option>)}</select></div>
            <div className="fld"><label>?íƒœ</label><select disabled={!canEdit} value={draft.status} onChange={(e)=>setDraft({...draft,status:e.target.value})}>{cols.map((c)=><option key={c.id} value={c.id}>{c.label}</option>)}</select></div>
            <div className="fld"><label>ë°˜ë³µ</label><select disabled={!canEdit} value={draft.repeat} onChange={(e)=>setDraft({...draft,repeat:e.target.value})}>{REPEATS.map((r)=><option key={r.id} value={r.id}>{r.label}</option>)}</select></div>
          </div>
          <div className="fld">
            <label>ì§„í–‰ë¥?/label>
            <div className="prow">
              <span className="ppct">{draft.progress||0}%</span>
              <input type="range" min="0" max="100" step="5" disabled={!canEdit}
                value={draft.progress||0}
                onChange={(e)=>{const v=Number(e.target.value);setDraft({...draft,progress:v,status:v===100?"done":draft.status==="done"&&v<100?"doing":draft.status});}}
                className="prange" />
              <span className="pbadge">{cols.find((c)=>c.id===draft.status)?.label}</span>
            </div>
            <div className="pticks"><span>0</span><span>50</span><span>100</span></div>
          </div>
          <div className="fld"><label>ë©”ëª¨</label><textarea disabled={!canEdit} value={draft.memo} onChange={(e)=>setDraft({...draft,memo:e.target.value})} placeholder="ì§„í–‰ ?í™©, ê³µê¸‰???Œì‹ , ì°¸ê³  ?˜ì¹˜" /></div>
          <div className="sect"><h4>?ˆìŠ¤? ë¦¬</h4>
            {(draft.history||[]).length===0&&<span className="hint">ì§„í–‰ ê¸°ë¡???†ìŠµ?ˆë‹¤</span>}
            {(draft.history||[]).map((h)=>(
              <div key={h.id} className="cmt">
                <div className="ch2"><b>{h.author}</b> Â· {fmtTs(h.ts)}{h.edited&&<span style={{fontSize:10,color:"var(--ink3)"}}> (?˜ì •??</span>}</div>
                {h.editing
                  ? <div style={{display:"flex",gap:6,marginTop:4}}>
                      <input defaultValue={h.text} autoFocus style={{flex:1,border:"1px solid var(--line2)",borderRadius:6,padding:"6px 9px",fontSize:14}}
                        onKeyDown={(e)=>{
                          if(e.nativeEvent.isComposing)return;
                          if(e.key==="Enter"){const v=e.target.value.trim();if(v)setDraft({...draft,history:draft.history.map((x)=>x.id===h.id?{...x,text:v,edited:true,editing:false}:x)});}
                          if(e.key==="Escape")setDraft({...draft,history:draft.history.map((x)=>x.id===h.id?{...x,editing:false}:x)});
                        }} />
                      <button className="btn ghost" onClick={()=>setDraft({...draft,history:draft.history.map((x)=>x.id===h.id?{...x,editing:false}:x)})}>ì·¨ì†Œ</button>
                    </div>
                  : <p>{h.text}</p>}
                {canEdit&&!h.editing&&<div style={{display:"flex",gap:10,marginTop:3}}>
                  <button style={{background:"none",border:"none",color:"var(--ink3)",fontSize:12,cursor:"pointer",padding:0}} onClick={()=>setDraft({...draft,history:draft.history.map((x)=>x.id===h.id?{...x,editing:true}:x)})}>?˜ì •</button>
                  <button style={{background:"none",border:"none",color:"var(--danger)",fontSize:12,cursor:"pointer",padding:0}} onClick={()=>setDraft({...draft,history:draft.history.filter((x)=>x.id!==h.id)})}>?? œ</button>
                </div>}
              </div>
            ))}
            {canEdit&&<div className="addrow"><textarea className="hinput" placeholder="ì§„í–‰ ?í™©Â·ë©”ëª¨ ?…ë ¥ (Enter ?„ì†¡, Shift+Enter ì¤„ë°”ê¿?" onKeyDown={(e)=>{if(e.nativeEvent.isComposing||e.key!=="Enter"||e.shiftKey)return;e.preventDefault();const v=e.target.value.trim();if(!v)return;setDraft({...draft,history:[...(draft.history||[]),{id:uid(),author:me||"?µëª…",text:v,ts:Date.now()}]});e.target.value="";}} /></div>}
          </div>
          <div className="sect"><h4>?œê·¸</h4>
            <div className="ctags">{(draft.tags||[]).map((g)=><span key={g} className="tag">{g}{canEdit&&<button className="x" style={{fontSize:11,marginLeft:3,border:"none",cursor:"pointer",background:"none"}} onClick={()=>setDraft({...draft,tags:draft.tags.filter((x)=>x!==g)})}>x</button>}</span>)}{!(draft.tags||[]).length&&<span className="hint">?†ìŒ</span>}</div>
            {canEdit&&<div className="addrow"><input placeholder="?œê·¸ ?…ë ¥ ??Enter" onKeyDown={(e)=>{if(e.nativeEvent.isComposing)return;const v=e.target.value.trim();if(e.key==="Enter"&&v&&!(draft.tags||[]).includes(v)){setDraft({...draft,tags:[...(draft.tags||[]),v]});e.target.value="";}}} /></div>}
          </div>
          <div className="sect"><h4>?¸ë? ?¨ê³„{(draft.checklist||[]).length>0&&` (${draft.checklist.filter((c)=>c.done).length}/${draft.checklist.length})`}</h4>
            {(draft.checklist||[]).map((c)=>(
              <div key={c.id} style={{marginBottom:6}}>
                <div className="item">
                  <input type="checkbox" checked={c.done} disabled={!canEdit} style={{width:"auto"}} onChange={()=>setDraft({...draft,checklist:draft.checklist.map((x)=>x.id===c.id?{...x,done:!x.done}:x)})} />
                  {c.editing
                    ? <input defaultValue={c.text} autoFocus style={{flex:1,border:"1px solid var(--line2)",borderRadius:6,padding:"5px 8px",fontSize:13.5}}
                        onKeyDown={(e)=>{if(e.nativeEvent.isComposing)return;if(e.key==="Enter"){const v=e.target.value.trim();if(v)setDraft({...draft,checklist:draft.checklist.map((x)=>x.id===c.id?{...x,text:v,editing:false}:x)});}if(e.key==="Escape")setDraft({...draft,checklist:draft.checklist.map((x)=>x.id===c.id?{...x,editing:false}:x)});}}
                        onBlur={(e)=>{const v=e.target.value.trim();if(v)setDraft({...draft,checklist:draft.checklist.map((x)=>x.id===c.id?{...x,text:v,editing:false}:x)});}} />
                    : <span style={{flex:1,textDecoration:c.done?"line-through":"none",color:c.done?"#8F959C":"inherit",cursor:canEdit?"pointer":"default"}} onClick={()=>canEdit&&setDraft({...draft,checklist:draft.checklist.map((x)=>x.id===c.id?{...x,editing:true}:x)})}>{c.text}</span>}
                  {canEdit&&!c.editing&&<button style={{background:"none",border:"none",cursor:"pointer",color:"var(--ink3)",fontSize:11,padding:"0 4px"}} onClick={()=>setDraft({...draft,checklist:draft.checklist.map((x)=>x.id===c.id?{...x,expand:!x.expand}:x)})}>{(c.subs||[]).length>0?`?˜ìœ„ ${(c.subs||[]).filter((s)=>s.done).length}/${(c.subs||[]).length}`:"+?˜ìœ„"}</button>}
                  {canEdit&&<button style={{background:"none",border:"none",cursor:"pointer",color:"#8F959C"}} onClick={()=>setDraft({...draft,checklist:draft.checklist.filter((x)=>x.id!==c.id)})}>Ã—</button>}
                </div>
                {canEdit&&c.expand&&(
                  <div style={{paddingLeft:26,marginTop:4}}>
                    {(c.subs||[]).map((s)=>(
                      <div key={s.id} className="item" style={{padding:"3px 0"}}>
                        <input type="checkbox" checked={s.done} style={{width:"auto"}} onChange={()=>setDraft({...draft,checklist:draft.checklist.map((x)=>x.id===c.id?{...x,subs:x.subs.map((y)=>y.id===s.id?{...y,done:!y.done}:y)}:x)})} />
                        {s.editing
                          ? <input defaultValue={s.text} autoFocus style={{flex:1,fontSize:12.5,border:"1px solid var(--line2)",borderRadius:6,padding:"4px 7px"}}
                              onKeyDown={(e)=>{if(e.nativeEvent.isComposing)return;if(e.key==="Enter"){const v=e.target.value.trim();if(v)setDraft({...draft,checklist:draft.checklist.map((x)=>x.id===c.id?{...x,subs:x.subs.map((y)=>y.id===s.id?{...y,text:v,editing:false}:y)}:x)});}if(e.key==="Escape")setDraft({...draft,checklist:draft.checklist.map((x)=>x.id===c.id?{...x,subs:x.subs.map((y)=>y.id===s.id?{...y,editing:false}:y)}:x)});}}
                              onBlur={(e)=>{const v=e.target.value.trim();if(v)setDraft({...draft,checklist:draft.checklist.map((x)=>x.id===c.id?{...x,subs:x.subs.map((y)=>y.id===s.id?{...y,text:v,editing:false}:y)}:x)});}} />
                          : <span style={{flex:1,fontSize:12.5,textDecoration:s.done?"line-through":"none",color:s.done?"#8F959C":"inherit",cursor:canEdit?"pointer":"default"}} onClick={()=>canEdit&&setDraft({...draft,checklist:draft.checklist.map((x)=>x.id===c.id?{...x,subs:x.subs.map((y)=>y.id===s.id?{...y,editing:true}:y)}:x)})}>{s.text}</span>}
                        <button style={{background:"none",border:"none",cursor:"pointer",color:"#8F959C"}} onClick={()=>setDraft({...draft,checklist:draft.checklist.map((x)=>x.id===c.id?{...x,subs:x.subs.filter((y)=>y.id!==s.id)}:x)})}>Ã—</button>
                      </div>
                    ))}
                    <div className="addrow" style={{marginTop:3}}><input placeholder="?˜ìœ„ ??ª© ?…ë ¥ ??Enter" style={{fontSize:12.5}} onKeyDown={(e)=>{if(e.nativeEvent.isComposing)return;const v=e.target.value.trim();if(e.key==="Enter"&&v){setDraft({...draft,checklist:draft.checklist.map((x)=>x.id===c.id?{...x,subs:[...(x.subs||[]),{id:uid(),text:v,done:false}]}:x)});e.target.value="";}}} /></div>
                  </div>
                )}
              </div>
            ))}
            {!(draft.checklist||[]).length&&<span className="hint">?†ìŒ</span>}
            {canEdit&&<div className="addrow"><input placeholder="?¨ê³„ ?…ë ¥ ??Enter" onKeyDown={(e)=>{if(e.nativeEvent.isComposing)return;const v=e.target.value.trim();if(e.key==="Enter"&&v){setDraft({...draft,checklist:[...(draft.checklist||[]),{id:uid(),text:v,done:false,subs:[]}]});e.target.value="";}}} /></div>}
          </div>
          <div className="sect"><h4>?´ìŠˆ</h4>
            {(draft.issues||[]).length===0&&<span className="hint">?†ìŒ</span>}
            {(draft.issues||[]).map((iss)=>(
              <div key={iss.id} className={"iss"+(iss.resolved?" done":"")}>
                <button className="issck" onClick={()=>setDraft({...draft,issues:(draft.issues||[]).map((x)=>x.id===iss.id?{...x,resolved:!x.resolved}:x)})}>
                  {iss.resolved?"??:""}
                </button>
                <div style={{flex:1}}>
                  <div className="isstext">{iss.text}</div>
                  <div className="issmeta">{iss.author} Â· {fmtTs(iss.ts)}</div>
                </div>
                {canEdit&&<button style={{background:"none",border:"none",cursor:"pointer",color:"var(--ink3)",fontSize:16}} onClick={()=>setDraft({...draft,issues:(draft.issues||[]).filter((x)=>x.id!==iss.id)})}>Ã—</button>}
              </div>
            ))}
            <div className="addrow">
              <input placeholder="?´ìŠˆ ?…ë ¥ ??Enter" onKeyDown={(e)=>{
                if(e.nativeEvent.isComposing||e.key!=="Enter")return;
                const v=e.target.value.trim();if(!v)return;
                const iss={id:uid(),text:v,author:me||"?µëª…",ts:Date.now(),resolved:false};
                setDraft({...draft,issues:[iss,...(draft.issues||[])]});
                e.target.value="";
              }} />
            </div>
          </div>

          {!draft._new&&(
            <div className="sect"><h4>???…ë¬´???´ë ¥</h4>
              {(data.log||[]).filter((e)=>e.taskId===draft.id).slice(0,6).map((e)=><div key={e.id} className="item" style={{fontSize:11.5,color:"#565C64"}}><span style={{fontSize:10.5,color:"#8F959C",minWidth:96,fontFamily:"monospace"}}>{fmtTs(e.ts)}</span><span style={{fontSize:10.5,minWidth:54,fontFamily:"monospace"}}>{e.who}</span><span>{e.action}{e.detail&&` Â· ${e.detail}`}</span></div>)}
              {!(data.log||[]).some((e)=>e.taskId===draft.id)&&<span className="hint">ê¸°ë¡ ?†ìŒ</span>}
            </div>
          )}
          </div>
          <div className="modal-foot">
            {!draft._new&&isAdmin&&<button className="del" onClick={()=>removeTask(draft)}>?? œ</button>}
            {!draft._new&&canEdit&&<button className="btn ghost" onClick={()=>duplicateTask(draft)}>ë³µì‚¬</button>}
            {!draft._new&&canEdit&&!draft.archived&&<button className="btn ghost" onClick={()=>{setArchivedFlag(draft,true);setDraft(null);}}>ë³´ê?</button>}
            <span className="spacer" />
            <button className="btn ghost" onClick={()=>setDraft(null)}>?«ê¸°</button>
            <button className="btn" onClick={saveDraft} style={{background:"#0C66E4",color:"#fff"}}>?€??/button>         </div>
        </div></div>
      )}
    </div>
  );
}
