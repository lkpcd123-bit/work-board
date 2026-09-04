import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { getAI, getGenerativeModel, GoogleAIBackend } from "firebase/ai";
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

/* ── AI 비서: Gemini 함수 선언 (조회 전용) ── */
const BOARD_REF = () => doc(db, "board", "main");
const ME_KEY = "wb-me";
const LOG_CAP = 400;

const COLUMNS = [
  { id: "todo", label: "대기" },
  { id: "doing", label: "진행중" },
  { id: "review", label: "검토·컨펌" },
  { id: "issuecol", label: "이슈" },
  { id: "done", label: "완료" },
];
const BOARDS = ["공용","김현민"];
const CKTABS = [{id:"checklist",label:"체크리스트"},{id:"event",label:"행사 원복"},{id:"product",label:"상품 원복"}];
const DEFAULT_CHANNELS = [
  { id: "공통", color: "#7A8189" },
  { id: "자사몰", color: "#3355C9" },
  { id: "쿠팡", color: "#D14A4A" },
  { id: "네이버쇼핑", color: "#2E9E5B" },
  { id: "올리브영", color: "#87A82B" },
  { id: "마켓컬리", color: "#6B3FA0" },
  { id: "11번가", color: "#DE7A1C" },
];
const TYPES = ["상품기획","채널운영","마케팅","상세페이지","공급사","인플루언서","데이터분석","기타"];
const PRIORITIES = [{ id:"urgent",label:"가장 먼저",rank:0 },{ id:"high",label:"높음",rank:1 },{ id:"mid",label:"보통",rank:2 },{ id:"low",label:"낮음",rank:3 }];
const REPEATS = [{ id:"none",label:"반복 없음" },{ id:"daily",label:"매일" },{ id:"weekly",label:"매주" },{ id:"biweekly",label:"격주" },{ id:"monthly",label:"매월" }];
const ROLES = [{ id:"admin",label:"관리자" },{ id:"member",label:"멤버" },{ id:"viewer",label:"뷰어" }];

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,7);
const resizeImage=(file,maxW=800,maxH=800,quality=0.75)=>new Promise((resolve)=>{
  const reader=new FileReader();
  reader.onload=(e)=>{
    const img=new Image();
    img.onload=()=>{
      let {width:w,height:h}=img;
      if(w>maxW){h=Math.round(h*maxW/w);w=maxW;}
      if(h>maxH){w=Math.round(w*maxH/h);h=maxH;}
      const canvas=document.createElement("canvas");
      canvas.width=w;canvas.height=h;
      canvas.getContext("2d").drawImage(img,0,0,w,h);
      resolve(canvas.toDataURL(file.type.includes("png")?"image/png":"image/jpeg",quality));
    };
    img.src=e.target.result;
  };
  reader.readAsDataURL(file);
});
const todayStr = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
const dayDiff = (d) => !d ? null : Math.round((new Date(d+"T00:00:00") - new Date(todayStr()+"T00:00:00")) / 86400000);
const fmtTs = (ts) => { const d=new Date(ts),p=(n)=>String(n).padStart(2,"0"); return `${String(d.getFullYear()).slice(2)}.${p(d.getMonth()+1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`; };
const nextDue = (due, repeat) => { const b=due?new Date(due+"T00:00:00"):new Date(); if(repeat==="daily")b.setDate(b.getDate()+1); else if(repeat==="weekly")b.setDate(b.getDate()+7); else if(repeat==="biweekly")b.setDate(b.getDate()+14); else if(repeat==="monthly")b.setMonth(b.getMonth()+1); else return due; return b.toISOString().slice(0,10); };
const emptyData = () => ({ tasks:[],routines:[],checkitems:[],members:[],channels:DEFAULT_CHANNELS,channelsUpdatedAt:0,types:TYPES,typesUpdatedAt:0,monthlies:[],routineCats:["오전","오후"],routineCatsUpdatedAt:0,rItems:[],colLabels:{},colLabelsUpdatedAt:0,memoItems:[],notifications:[],mindmaps:[],refs:[],refCats:["디자인","마케팅","경쟁사","콘텐츠"],log:[],updatedAt:0 });
function mergeData(r,l) {
  r=r||emptyData(); l=l||emptyData();
  const map=new Map(); [...(r.tasks||[]),...(l.tasks||[])].forEach(t=>{const p=map.get(t.id);if(!p||(t.updatedAt||0)>(p.updatedAt||0))map.set(t.id,t);});
  const rm=new Map(); [...(r.routines||[]),...(l.routines||[])].forEach(t=>{const p=rm.get(t.id);if(!p||(t.updatedAt||0)>(p.updatedAt||0))rm.set(t.id,t);});
  const cm=new Map(); [...(r.checkitems||[]),...(l.checkitems||[])].forEach(t=>{const p=cm.get(t.id);if(!p||(t.updatedAt||0)>(p.updatedAt||0))cm.set(t.id,t);});
  const mm2=new Map(); [...(r.monthlies||[]),...(l.monthlies||[])].forEach(t=>{const p=mm2.get(t.id);if(!p||(t.updatedAt||0)>(p.updatedAt||0))mm2.set(t.id,t);});
  const ri=new Map(); [...(r.rItems||[]),...(l.rItems||[])].forEach(t=>{const p=ri.get(t.id);if(!p||(t.updatedAt||0)>(p.updatedAt||0))ri.set(t.id,t);});
  const mi=new Map(); [...(r.memoItems||[]),...(l.memoItems||[])].forEach(t=>{const p=mi.get(t.id);if(!p||(t.updatedAt||0)>(p.updatedAt||0))mi.set(t.id,t);});
  const mmi=new Map(); [...(r.mindmaps||[]),...(l.mindmaps||[])].forEach(t=>{const p=mmi.get(t.id);if(!p||(t.updatedAt||0)>(p.updatedAt||0))mmi.set(t.id,t);});
  const lm=new Map(); [...(r.log||[]),...(l.log||[])].forEach(e=>lm.set(e.id,e));
  const mm=new Map(); [...(r.members||[]),...(l.members||[])].forEach(m=>{const p=mm.get(m.name);if(!p||(m.updatedAt||0)>=(p.updatedAt||0))mm.set(m.name,m);});
  const uc=(l.channelsUpdatedAt||0)>=(r.channelsUpdatedAt||0);
  return { tasks:[...map.values()],routines:[...rm.values()],checkitems:[...cm.values()],monthlies:[...mm2.values()],rItems:[...ri.values()],memoItems:[...mi.values()],mindmaps:[...mmi.values()],members:[...mm.values()],channels:(uc?l.channels:r.channels)||DEFAULT_CHANNELS,channelsUpdatedAt:Math.max(l.channelsUpdatedAt||0,r.channelsUpdatedAt||0),types:((l.typesUpdatedAt||0)>=(r.typesUpdatedAt||0)?l.types:r.types)||TYPES,typesUpdatedAt:Math.max(l.typesUpdatedAt||0,r.typesUpdatedAt||0),
    routineCats:((l.routineCatsUpdatedAt||0)>=(r.routineCatsUpdatedAt||0)?l.routineCats:r.routineCats)||["오전","오후"],routineCatsUpdatedAt:Math.max(l.routineCatsUpdatedAt||0,r.routineCatsUpdatedAt||0),
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

/* ── 상단 바 ── */
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

/* ── 탭 ── */
.tabs{display:flex;gap:4px;padding:12px 20px 0;flex-wrap:wrap;}
.tab{padding:8px 16px;border-radius:8px 8px 0 0;font-size:14px;font-weight:600;color:var(--ink3);}
.tab:hover{background:#DFE1E6;color:var(--ink);}
.tab.sel{background:#fff;color:var(--ink);}
.tab em{font-style:normal;font-size:12px;margin-left:6px;background:#DFE1E6;padding:1px 7px;border-radius:10px;}
.tab.sel em{background:#DFE1E6;color:var(--ink2);}

.page{background:#F7F8F9;border-radius:0 12px 12px 12px;margin:0 16px;padding:18px;min-height:60vh;}

/* ── 지표 ── */
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

/* ── 툴바 ── */
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

/* ── 보드 ── */
.board{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;align-items:start;}
.colwrap{background:var(--col);border-radius:12px;padding:10px;}
.colhead{display:flex;align-items:center;justify-content:space-between;padding:2px 6px 10px;}
.colhead span{font-size:14.5px;font-weight:700;letter-spacing:-.01em;}
.colhead em{font-style:normal;font-size:12.5px;color:var(--ink3);background:#DFE1E6;padding:1px 8px;border-radius:10px;font-weight:600;}
.colbody{display:flex;flex-direction:column;gap:8px;min-height:60px;}
.colbody.over{background:#D0D4DB;border-radius:8px;outline:2px dashed var(--pri);}

/* ── 카드 ── */
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
.pri.urgent{background:#CA3521;color:#fff;animation:urgentPulse 1.8s ease-in-out infinite;}
@keyframes urgentPulse{0%,100%{opacity:1;}50%{opacity:.7;}}
.card.urgent{border:2px solid #CA3521;box-shadow:0 0 0 2px rgba(202,53,33,.18),var(--sh);}
.card.high{border-left:3px solid #CA3521;}
.card.low{opacity:.85;}
.icons{display:inline-flex;gap:8px;color:var(--ink3);font-size:11.5px;font-weight:600;}
.empty{border:2px dashed var(--line2);border-radius:8px;padding:16px 10px;text-align:center;font-size:13px;color:var(--ink3);font-weight:500;}
.addbtn{width:100%;background:transparent;color:var(--ink2);padding:8px;font-size:13.5px;font-weight:600;border-radius:6px;text-align:left;}
.addbtn:hover{background:#DFE1E6;}

/* ── 표 ── */
.tbl{width:100%;border-collapse:separate;border-spacing:0;background:var(--card);border-radius:var(--r);box-shadow:var(--sh);font-size:14px;overflow:hidden;}
.tbl th{font-size:12px;font-weight:700;color:var(--ink3);text-align:left;padding:11px 14px;background:#F1F2F4;border-bottom:1px solid var(--line);white-space:nowrap;}
.tbl td{padding:11px 14px;border-bottom:1px solid var(--line);vertical-align:middle;}
.tbl tr:last-child td{border-bottom:none;}
.tbl tr.cl:hover{background:#F7F8F9;cursor:pointer;}
.m{font-size:13px;color:var(--ink2);white-space:nowrap;font-weight:500;}
.chdot{display:inline-flex;align-items:center;gap:7px;}
.chdot b{width:10px;height:10px;border-radius:3px;}

/* ── 이력 ── */
.logrow{display:grid;grid-template-columns:130px 90px 1fr;gap:12px;padding:11px 14px;background:var(--card);border-bottom:1px solid var(--line);font-size:14px;align-items:baseline;}
.logrow:first-of-type{border-radius:var(--r) var(--r) 0 0;}
.logrow .t{font-size:12px;color:var(--ink3);font-weight:500;}
.logrow .w{font-size:12.5px;color:var(--ink2);font-weight:700;}

/* ── 패널 ── */
.panel{background:var(--card);border-radius:var(--r);box-shadow:var(--sh);padding:20px;margin-bottom:14px;}
.panel h3{font-size:16px;font-weight:800;margin-bottom:5px;letter-spacing:-.01em;}
.sub{font-size:13px;color:var(--ink3);line-height:1.65;margin-bottom:16px;}
.mrow{display:flex;align-items:center;gap:10px;padding:9px 0;border-top:1px solid var(--line);}

/* ── 모달 ── */
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

/* ── 진행률 ── */
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

/* ── 반복 업무 ── */
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

/* ── 채널 트리 ── */
.chnode{border-top:1px solid var(--line);padding-top:6px;margin-top:6px;}
.chsub{padding-left:26px;}
.chsub .mrow{border-top:none;padding:6px 0;}
.subhint{font-size:12px;color:var(--ink3);font-weight:600;}

@media(max-width:1100px){.board{grid-template-columns:repeat(3,minmax(0,1fr));}.metrics{grid-template-columns:repeat(3,1fr);}.rwrap{grid-template-columns:1fr;}.rside{position:static;}}
@media(max-width:680px){.board{grid-template-columns:1fr;}.metrics{grid-template-columns:repeat(2,1fr);}.r3{grid-template-columns:1fr;}.page{margin:0 8px;padding:12px;}}
/* ══ Monday 스타일 테이블 ══ */
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

/* ══ 신규 기능 CSS ══ */
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


/* ══ 체크리스트 탭 ══ */
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

/* ══ AI 비서 ══ */
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

/* ══ 반복업무 3단 구조 ══ */
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

/* ══ 래퍼런스 ══ */
.refgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px;}
.refcard{background:var(--card);border-radius:10px;box-shadow:var(--sh);overflow:hidden;cursor:pointer;transition:transform .15s,box-shadow .15s;position:relative;}
.refcard:hover{transform:translateY(-2px);box-shadow:0 4px 16px rgba(0,0,0,.13);}
.refcard.fav{box-shadow:0 0 0 2px #F7B731,0 2px 8px rgba(0,0,0,.1);}
.refcard img{width:100%;height:140px;object-fit:cover;display:block;}
.refcard .refbody{padding:10px 12px;}
.refcard .refcat{font-size:10px;font-weight:800;color:#0C66E4;margin-bottom:4px;text-transform:uppercase;}
.refcard .reftitle{font-size:13px;font-weight:700;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.refcard .refmemo{font-size:11.5px;color:var(--ink3);line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.refcard .reffoot{display:flex;align-items:center;justify-content:space-between;margin-top:8px;font-size:11px;color:var(--ink3);}
.refpaste{border:2.5px dashed var(--line2);border-radius:10px;padding:28px;text-align:center;color:var(--ink3);font-size:13px;cursor:pointer;transition:border-color .15s,background .15s;}
.refpaste:hover,.refpaste.active{border-color:#0C66E4;background:#E9F2FF;color:#0C66E4;}
/* ══ 메모 ══ */
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
  const [fCh, setFCh] = useState("전체");
  const [fOwner, setFOwner] = useState("전체");
  const [fTag, setFTag] = useState("전체");
  const [onlyMine, setOnlyMine] = useState(false);
  const [onlyLate, setOnlyLate] = useState(false);
  const [sortBy, setSortBy] = useState("pri");
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
  const [memoCatFilter, setMemoCatFilter] = useState("전체");
  const [memoDraft, setMemoDraft] = useState(null);
  const [memoExpand, setMemoExpand] = useState({});
  const [memoDrag, setMemoDrag] = useState(null);
  const [memoSubText, setMemoSubText] = useState({});
  const [memoSubEditId, setMemoSubEditId] = useState(null);
  const [notifOn, setNotifOn] = useState(typeof Notification !== "undefined" && Notification.permission === "granted");
  const [notifBoxOpen, setNotifBoxOpen] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [c24Token, setC24Token] = useState(()=>localStorage.getItem('c24_token')||'');
  const [c24Expiry, setC24Expiry] = useState(()=>parseInt(localStorage.getItem('c24_expiry')||'0'));
  const [c24RefreshToken, setC24RefreshToken] = useState(()=>localStorage.getItem('c24_refresh_token')||'');
  const [c24Schedules, setC24Schedules] = useState(()=>{try{return JSON.parse(localStorage.getItem('c24_schedules')||'[]');}catch(e){return[];}});
  const [c24SelProduct, setC24SelProduct] = useState(null);
  const [c24SearchResult, setC24SearchResult] = useState([]);
  const [c24SearchLoading, setC24SearchLoading] = useState(false);
  const [c24ProductCode, setC24ProductCode] = useState('');
  const [c24OpenAt, setC24OpenAt] = useState('');
  const [c24CloseAt, setC24CloseAt] = useState('');
  const [c24OpenSelling, setC24OpenSelling] = useState('T');
  const [c24OpenDisplay, setC24OpenDisplay] = useState('T');
  const [c24CloseAction, setC24CloseAction] = useState('soldout');
  const [c24Log, setC24Log] = useState(['⏱ 스케줄러 준비 중...']);
  const c24TimerRef = useRef(null);
  const c24TokenRef = useRef('');
  const [mmId, setMmId] = useState(null);
  const [mmTree, setMmTree] = useState(null);
  const [mmSel, setMmSel] = useState(null);
  const [mmEditId, setMmEditId] = useState(null);
  const [mmScroll, setMmScroll] = useState({x:0,y:0});
  const [mmPan, setMmPan] = useState(null);
  const prevTasksRef = useRef(null);
  const notifiedRef = useRef(null);
  const getNotified = useCallback(() => {
    if(notifiedRef.current) return notifiedRef.current;
    const key = `wb-notified-${todayStr()}`;
    try { const s=localStorage.getItem(key); notifiedRef.current=new Set(s?JSON.parse(s):[]); }
    catch(e) { notifiedRef.current=new Set(); }
    return notifiedRef.current;
  }, []);
  const markNotified = useCallback((id) => {
    const set = getNotified();
    set.add(id);
    try { localStorage.setItem(`wb-notified-${todayStr()}`,JSON.stringify([...set])); } catch(e) {}
  }, [getNotified]);
  const [mlyDraft, setMlyDraft] = useState(null);
  const [mlyHistEditId, setMlyHistEditId] = useState(null);
  const [mlySubHistOpen, setMlySubHistOpen] = useState({});
  const [mlySubHistText, setMlySubHistText] = useState({});
  const [mlySubHistEditId, setMlySubHistEditId] = useState(null);
  const [mlySubEditId, setMlySubEditId] = useState(null);
  const [mlySubEditText, setMlySubEditText] = useState("");
  const [mlySubsubOpen, setMlySubsubOpen] = useState({});
  const [mlyDate, setMlyDate] = useState(()=>{const n=new Date();return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}`;});
  const [confirmBox, setConfirmBox] = useState(null);
  const [newChannel, setNewChannel] = useState("");
  const [newSub, setNewSub] = useState("");
  const [subTarget, setSubTarget] = useState(null);
  const [grpBy, setGrpBy] = useState("status");
  const [collapsed, setCollapsed] = useState({});
  const [curBoard, setCurBoard] = useState("공용");
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
      const base=remote&&Array.isArray(remote.tasks)?{...emptyData(),...remote,checkitems:Array.isArray(remote.checkitems)?remote.checkitems:[],monthlies:Array.isArray(remote.monthlies)?remote.monthlies:[],routineCats:Array.isArray(remote.routineCats)?remote.routineCats:["오전","오후"],rItems:Array.isArray(remote.rItems)?remote.rItems:[],colLabels:remote.colLabels||{},memoItems:Array.isArray(remote.memoItems)?remote.memoItems:[],mindmaps:Array.isArray(remote.mindmaps)?remote.mindmaps:[],refs:Array.isArray(remote.refs)?remote.refs:[],refCats:Array.isArray(remote.refCats)?remote.refCats:["디자인","마케팅","경쟁사","콘텐츠"]}:emptyData();
      const merged=mergeData(base,optimistic);
      if(logEntries&&logEntries.length)merged.log=[...logEntries,...(merged.log||[])].slice(0,LOG_CAP);
      merged.updatedAt=Date.now();
      await setDoc(BOARD_REF(),merged); setData(merged); setSaveState("saved"); setTimeout(()=>setSaveState("idle"),1500);
    } catch(e){setSaveState("error");} finally{busyRef.current=false;}
  }, []);

  const mkLog=(action,task,detail)=>({id:uid(),ts:Date.now(),who:me||"익명",taskId:task?.id||null,taskTitle:task?.title||"",action,detail:detail||""});

  const live=useMemo(()=>data.tasks.filter((t)=>!t.deleted&&!t.archived&&(t.boardId||"공용")===curBoard),[data.tasks,curBoard]);
  const archived=useMemo(()=>data.tasks.filter((t)=>!t.deleted&&t.archived&&(t.boardId||"공용")===curBoard),[data.tasks,curBoard]);
  const owners=useMemo(()=>[...new Set(data.tasks.filter((t)=>!t.deleted).map((t)=>t.owner).filter(Boolean))].sort(),[data.tasks]);
  const allTags=useMemo(()=>[...new Set(data.tasks.filter((t)=>!t.deleted).flatMap((t)=>t.tags||[]))].sort(),[data.tasks]);

  const topChannels=useMemo(()=>data.channels.filter((c)=>!c.parent),[data.channels]);
  const subsOf=useCallback((pid)=>data.channels.filter((c)=>c.parent===pid),[data.channels]);
  const parentOf=useCallback((id)=>(data.channels.find((c)=>c.id===id)||{}).parent||null,[data.channels]);
  const inChannel=useCallback((tc,fc)=>tc===fc||parentOf(tc)===fc,[parentOf]);

  const applyFilters=useCallback((list)=>{
    const kw=q.trim().toLowerCase();
    return list.filter((t)=>{
      if(fCh!=="전체"&&!inChannel(t.channel,fCh))return false;
      if(fOwner!=="전체"&&t.owner!==fOwner)return false;
      if(fTag!=="전체"&&!(t.tags||[]).includes(fTag))return false;
      if(onlyMine&&t.owner!==me)return false;
      if(onlyLate){const d=dayDiff(t.due);if(!(d!==null&&d<0&&t.status!=="done"))return false;}
      if(dateFrom&&(!t.due||t.due<dateFrom))return false;
      if(dateTo&&(!t.due||t.due>dateTo))return false;
      if(kw){const h=`${t.title} ${t.memo||""} ${t.type} ${t.owner||""} ${(t.tags||[]).join(" ")}`.toLowerCase();if(!h.includes(kw))return false;}
      return true;
    });
  },[q,fCh,fOwner,fTag,onlyMine,onlyLate,me,inChannel,dateFrom,dateTo]);

  const sortFn=useCallback((a,b)=>{ if(sortBy==="due"){if(!a.due&&!b.due)return 0;if(!a.due)return 1;if(!b.due)return -1;return a.due<b.due?-1:1;} if(sortBy==="pri"){const r=(t)=>PRIORITIES.find((p)=>p.id===t.priority)?.rank??2;const rd=r(a)-r(b);if(rd!==0)return rd;if(!a.due&&!b.due)return 0;if(!a.due)return 1;if(!b.due)return -1;return a.due<b.due?-1:1;} return(b.updatedAt||0)-(a.updatedAt||0); },[sortBy]);
  const visible=useMemo(()=>applyFilters(live).slice().sort(sortFn),[live,applyFilters,sortFn]);
  const stats=useMemo(()=>{const o=live.filter((t)=>t.status!=="done");return{total:live.length,doing:live.filter((t)=>t.status==="doing").length,tomorrow:o.filter((t)=>dayDiff(t.due)===1).length,late:o.filter((t)=>{const d=dayDiff(t.due);return d!==null&&d<0;}).length,open:o.length};},[live]);

  const saveMe=async(name)=>{const n=name.trim();if(!n)return;setMe(n);setAskName(false);try{localStorage.setItem(ME_KEY,n);}catch(e){}if(!dataRef.current.members.find((m)=>m.name===n)){const role=dataRef.current.members.length===0?"admin":"member";commit((d)=>({...d,members:[...d.members,{name:n,role,updatedAt:Date.now()}]}),[{id:uid(),ts:Date.now(),who:n,taskId:null,taskTitle:"",action:"팀 합류",detail:ROLES.find((r)=>r.id===role).label}]);}};

  const doLogin=()=>{
    const n=nameInput.trim();if(!n){alert("이름을 입력하세요.");return;}
    const mem=dataRef.current.members.find((m)=>m.name===n);
    if(!mem){alert("등록되지 않은 이름입니다. 신규 등록을 눌러 계정을 만드세요.");return;}
    if(mem.pw&&mem.pw!==loginPw){alert("비밀번호가 틀렸습니다.");setLoginPw("");return;}
    if(!mem.pw){alert("비밀번호가 설정되지 않은 계정입니다. 신규 등록에서 비밀번호를 먼저 설정하세요.");return;}
    setMe(n);try{localStorage.setItem(ME_KEY,n);}catch(e){}
    setLoginPw("");setNameInput("");
  };
  const doSignup=()=>{
    const n=nameInput.trim();if(!n){alert("이름을 입력하세요.");return;}
    if(loginPw.length<4){alert("비밀번호는 4자 이상으로 설정하세요.");return;}
    if(loginPw!==signupPw2){alert("비밀번호가 일치하지 않습니다.");return;}
    const exist=dataRef.current.members.find((m)=>m.name===n);
    if(exist&&exist.pw){alert("이미 비밀번호가 설정된 이름입니다. 로그인을 사용하세요.");return;}
    const role=dataRef.current.members.length===0?"admin":(exist?exist.role:"member");
    commit((d)=>{const list=d.members||[];const ex=list.find((m)=>m.name===n);
      return{...d,members:ex?list.map((m)=>m.name===n?{...m,pw:loginPw,updatedAt:Date.now()}:m):[...list,{name:n,role,pw:loginPw,updatedAt:Date.now()}]};},
      [{id:uid(),ts:Date.now(),who:n,taskId:null,taskTitle:"",action:exist?"비밀번호 설정":"계정 생성",detail:ROLES.find((r)=>r.id===role).label}]);
    setMe(n);try{localStorage.setItem(ME_KEY,n);}catch(e){}
    setLoginPw("");setSignupPw2("");setNameInput("");setSignupMode(false);
  };
  const logout=()=>{setMe("");try{localStorage.removeItem(ME_KEY);}catch(e){}};
  const changePw=()=>{
    if(!pwChange)return;
    const {cur,next,next2}=pwChange;
    const mem=dataRef.current.members.find((m)=>m.name===me);
    if(!mem){setPwChange(null);return;}
    if(mem.pw&&mem.pw!==cur){alert("현재 비밀번호가 틀렸습니다.");return;}
    if(next.length<4){alert("새 비밀번호는 4자 이상으로 설정하세요.");return;}
    if(next!==next2){alert("새 비밀번호가 일치하지 않습니다.");return;}
    commit((d)=>({...d,members:d.members.map((m)=>m.name===me?{...m,pw:next,updatedAt:Date.now()}:m)}),[{id:uid(),ts:Date.now(),who:me,taskId:null,taskTitle:"",action:"비밀번호 변경",detail:""}]);
    setPwChange(null);alert("비밀번호가 변경되었습니다.");
  };
  const openNew=(status)=>setDraft({_new:true,id:uid(),boardId:curBoard,title:"",channel:data.channels[0]?.id||"공통",brand:"",type:"채널운영",owner:me,start:"",due:"",priority:"mid",memo:"",progress:0,status:status||"todo",tags:[],checklist:[],links:[],comments:[],issues:[],repeat:"none",archived:false,deleted:false});
  const openTask=(t)=>setDraft({...t,boardId:t.boardId||"공용",brand:t.brand||"",start:t.start||"",tags:[...(t.tags||[])],checklist:[...(t.checklist||[])],links:[...(t.links||[])],comments:[...(t.comments||[])],issues:[...(t.issues||[])]});

  const duplicateTask=(t)=>{
    const now=Date.now();
    const copy={...t,id:uid(),title:t.title+" (복사)",status:"todo",progress:0,comments:[],
      checklist:(t.checklist||[]).map((c)=>({...c,id:uid(),done:false})),
      links:(t.links||[]).map((l)=>({...l,id:uid()})),
      createdAt:now,createdBy:me,updatedAt:now,doneAt:null,archived:false,deleted:false};
    delete copy._new;
    commit((d)=>({...d,tasks:[copy,...d.tasks]}),[mkLog("업무 복사",copy,`원본: ${t.title}`)]);
    setDraft(null);
  };

  const saveDraft=()=>{
    if(!draft.title.trim())return;
    const now=Date.now(),isNew=draft._new,clean={...draft};delete clean._new;
    const before=data.tasks.find((t)=>t.id===draft.id),logs=[];
    if(isNew)logs.push(mkLog("업무 생성",clean,`${clean.channel} · ${clean.type}`));
    else{const diffs=[];if(before){if(before.title!==clean.title)diffs.push("업무명");if(before.status!==clean.status)diffs.push(`상태 -> ${cols.find((c)=>c.id===clean.status)?.label}`);if(before.owner!==clean.owner)diffs.push(`담당자 -> ${clean.owner||"미지정"}`);if(before.due!==clean.due)diffs.push(`마감 -> ${clean.due||"없음"}`);if(before.priority!==clean.priority)diffs.push("우선순위");if(before.channel!==clean.channel)diffs.push(`채널 -> ${clean.channel}`);if((before.comments||[]).length!==(clean.comments||[]).length)diffs.push("댓글");}logs.push(mkLog("업무 수정",clean,diffs.join(", ")||"내용 변경"));}
    let spawn=null;
    if(clean.status==="done"&&before?.status!=="done"&&clean.repeat!=="none"){spawn={...clean,id:uid(),status:"todo",due:nextDue(clean.due,clean.repeat),checklist:(clean.checklist||[]).map((c)=>({...c,id:uid(),done:false})),comments:[],createdAt:now,createdBy:me,updatedAt:now,doneAt:null};logs.push(mkLog("반복 생성",spawn,`다음 마감 ${spawn.due}`));}
    commit((d)=>{const ex=d.tasks.some((t)=>t.id===clean.id);const rec={...clean,createdAt:before?.createdAt||now,createdBy:before?.createdBy||me,updatedAt:now,updatedBy:me,doneAt:clean.status==="done"?(before?.doneAt||now):null};let tasks=ex?d.tasks.map((t)=>t.id===rec.id?rec:t):[rec,...d.tasks];if(spawn)tasks=[spawn,...tasks];return{...d,tasks};},logs);
    setDraft(null);
  };

  const moveTask=(task,statusId)=>{if(!canEdit||task.status===statusId)return;const now=Date.now();const logs=[mkLog("상태 변경",task,`${cols.find((c)=>c.id===task.status)?.label} -> ${cols.find((c)=>c.id===statusId)?.label}`)];let spawn=null;if(statusId==="done"&&task.repeat&&task.repeat!=="none"){spawn={...task,id:uid(),status:"todo",due:nextDue(task.due,task.repeat),checklist:(task.checklist||[]).map((c)=>({...c,id:uid(),done:false})),comments:[],createdAt:now,createdBy:me,updatedAt:now,doneAt:null};logs.push(mkLog("반복 생성",spawn,`다음 마감 ${spawn.due}`));}commit((d)=>{let tasks=d.tasks.map((t)=>t.id===task.id?{...t,status:statusId,updatedAt:now,updatedBy:me,doneAt:statusId==="done"?(t.doneAt||now):null}:t);if(spawn)tasks=[spawn,...tasks];return{...d,tasks};},logs);if(statusId==="done"&&task.status!=="done"){setConfirmBox({kind:"archiveOne",taskId:task.id,taskTitle:task.title});}};
  const removeTask=(task)=>{commit((d)=>({...d,tasks:d.tasks.map((t)=>t.id===task.id?{...t,deleted:true,updatedAt:Date.now(),updatedBy:me}:t)}),[mkLog("업무 삭제",task)]);setDraft(null);};
  const setArchivedFlag=(task,flag)=>commit((d)=>({...d,tasks:d.tasks.map((t)=>t.id===task.id?{...t,archived:flag,updatedAt:Date.now(),updatedBy:me}:t)}),[mkLog(flag?"아카이브":"아카이브 해제",task)]);
  const archiveDone=()=>{const targets=live.filter((t)=>t.status==="done");if(!targets.length){setConfirmBox(null);return;}const ids=new Set(targets.map((t)=>t.id));commit((d)=>({...d,tasks:d.tasks.map((t)=>ids.has(t.id)?{...t,archived:true,updatedAt:Date.now(),updatedBy:me}:t)}),[mkLog("완료 일괄 보관",null,`${targets.length}건`)]);setConfirmBox(null);};
  const purgeArchive=()=>{const ids=new Set(archived.map((t)=>t.id));commit((d)=>({...d,tasks:d.tasks.filter((t)=>!ids.has(t.id))}),[mkLog("보관함 영구 삭제",null,`${ids.size}건`)]);setConfirmBox(null);};
  const addChannel=(parent)=>{
    if(addingRef.current)return;
    const id=(parent?newSub:newChannel).trim();
    if(!id)return;
    if((dataRef.current.channels||[]).some((c)=>c.id===id)){alert("이미 있는 채널명입니다.");return;}
    addingRef.current=true;
    if(parent){setNewSub("");setSubTarget(null);}else{setNewChannel("");}
    const pc=parent?(dataRef.current.channels.find((c)=>c.id===parent)||{}).color:null;
    commit((d)=>{
      if((d.channels||[]).some((c)=>c.id===id))return d;
      return{...d,channels:[...d.channels,{id,color:pc||"#7A8189",parent:parent||null}],channelsUpdatedAt:Date.now()};
    },[mkLog(parent?"하위 채널 추가":"채널 추가",null,parent?`${parent} > ${id}`:id)]);
    setTimeout(()=>{addingRef.current=false;},600);
  };
  /* ── 반복 업무 (구버전 데이터, AI비서 조회용으로만 유지) ── */
  const cols = useMemo(()=>COLUMNS.map((c)=>({...c,label:(data.colLabels||{})[c.id]||c.label})),[data.colLabels]);
  const routines = useMemo(()=>(data.routines||[]).filter((r)=>!r.deleted),[data.routines]);

  const toggleIssue=(rid,iid)=>{
    commit((d)=>({...d,routines:(d.routines||[]).map((x)=>x.id!==rid?x:{...x,issues:(x.issues||[]).map((i)=>i.id===iid?{...i,resolved:!i.resolved,resolvedBy:me}:i),updatedAt:Date.now()})}),[]);
  };

  const allIssues=useMemo(()=>{
    const out=[];
    routines.forEach((r)=>(r.issues||[]).forEach((i)=>out.push({...i,routineId:r.id,routineTitle:r.title,owner:r.owner,src:"반복"})));
    data.tasks.filter((t)=>!t.deleted&&!t.archived).forEach((t)=>(t.issues||[]).forEach((i)=>out.push({...i,taskId:t.id,routineTitle:t.title,owner:t.owner,src:"업무"})));
    return out.sort((a,b)=>b.ts-a.ts);
  },[routines,data.tasks]);

  /* ── 체크리스트 ── */
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
      [{id:uid(),ts:now,who:me||"익명",taskId:rec.id,taskTitle:rec.title,action:isNew?"체크항목 생성":"체크항목 수정",detail:CKTABS.find((t)=>t.id===rec.tab)?.label||""}]);
    setCkDraft(null);
  };
  const [ckDrag, setCkDrag] = useState(null);
  const [ckSubDrag, setCkSubDrag] = useState(null);
  const toggleCk=(c)=>{if(!canEdit)return;const willDone=!c.done;commit((d)=>({...d,checkitems:(d.checkitems||[]).map((x)=>x.id===c.id?{...x,done:willDone,doneAt:willDone?Date.now():null,updatedAt:Date.now()}:x)}),[{id:uid(),ts:Date.now(),who:me||"익명",taskId:c.id,taskTitle:c.title,action:c.done?"체크 해제":"체크 완료",detail:""}]);if(willDone)setConfirmBox({kind:"archiveCk",ckId:c.id,ckTitle:c.title});};
  const reorderCk=(tab,fromId,toId)=>{if(!canEdit||fromId===toId)return;const ordered=ckByTab(tab).filter((x)=>!x.done);const fi=ordered.findIndex((x)=>x.id===fromId);const ti=ordered.findIndex((x)=>x.id===toId);if(fi<0||ti<0)return;const arr=[...ordered];const[moved]=arr.splice(fi,1);arr.splice(ti,0,moved);const now=Date.now();commit((d)=>({...d,checkitems:(d.checkitems||[]).map((x)=>{const pos=arr.findIndex((a)=>a.id===x.id);return pos>=0?{...x,order:pos,updatedAt:now}:x;})}),[])};
  const removeCk=(c)=>{commit((d)=>({...d,checkitems:(d.checkitems||[]).map((x)=>x.id===c.id?{...x,deleted:true,updatedAt:Date.now()}:x)}),[{id:uid(),ts:Date.now(),who:me||"익명",taskId:c.id,taskTitle:c.title,action:"체크항목 삭제",detail:""}]);setCkDraft(null);};
  const duplicateCk=(c)=>{
    const now=Date.now();
    const copy={...c,id:uid(),title:c.title+" (복사)",done:false,doneAt:null,order:null,
      subs:(c.subs||[]).map((s)=>({...s,id:uid(),done:false})),
      history:[],createdAt:now,updatedAt:now};
    delete copy._new;
    commit((d)=>({...d,checkitems:[...(d.checkitems||[]),copy]}),[{id:uid(),ts:now,who:me||"익명",taskId:copy.id,taskTitle:copy.title,action:"체크항목 복사",detail:`원본: ${c.title}`}]);
    setCkDraft(null);
  };
  const clearCkItem=(c)=>{commit((d)=>({...d,checkitems:(d.checkitems||[]).map((x)=>x.id===c.id?{...x,subs:(x.subs||[]).map((s)=>({...s,done:false})),updatedAt:Date.now()}:x)}),[{id:uid(),ts:Date.now(),who:me||"익명",taskId:c.id,taskTitle:c.title,action:"체크 해제",detail:""}]);};
  const toggleSub=(c,subId)=>{if(!canEdit)return;commit((d)=>({...d,checkitems:(d.checkitems||[]).map((x)=>x.id===c.id?{...x,subs:(x.subs||[]).map((s)=>s.id===subId?{...s,done:!s.done}:s),updatedAt:Date.now()}:x)}),[]);};

  /* ── AI 비서 ── */

  const sendAiMessage = async () => {
    const q = aiInput.trim();
    if (!q || aiLoading) return;
    setAiInput("");
    setAiMessages((m) => [...m, { role: "user", text: q }]);
    setAiLoading(true);
    try {
      const d = dataRef.current;
      const today = todayStr();
      const tasks = d.tasks.filter((t) => !t.deleted && !t.archived).slice(0, 60).map((t) => ({
        title: t.title, board: t.boardId || "공용", channel: t.channel, owner: t.owner || "미지정",
        status: t.status, due: t.due || null, priority: t.priority, progress: t.progress || 0,
        memo: t.memo || "", history: (t.history || []).slice(-3).map((h) => h.text),
        issues: (t.issues || []).filter((i) => !i.resolved).map((i) => i.text),
      }));
      const rItems = (d.rItems || []).filter((x) => !x.deleted).slice(0, 40).map((r) => ({
        cat: r.cat, sub: r.sub, title: r.title, checkedToday: !!(r.checkins || {})[today],
        issues: (r.issues || []).filter((i) => !i.resolved).map((i) => i.text),
      }));
      const checks = (d.checkitems || []).filter((c) => !c.deleted).slice(0, 30).map((c) => ({
        title: c.title, tab: c.tab, done: c.done, due: c.due || null,
      }));
      const dataCtx = `[오늘: ${today}]\n\n## 업무 목록\n${JSON.stringify(tasks, null, 1)}\n\n## 반복업무\n${JSON.stringify(rItems, null, 1)}\n\n## 체크리스트\n${JSON.stringify(checks, null, 1)}`;
      const systemPrompt = `당신은 ShakeBaby 팀의 업무보드 AI 비서입니다. 아래 실제 데이터를 바탕으로 한국어로 간결하고 정확하게 답하세요. 데이터에 없는 내용은 추측하지 마세요.\n\n${dataCtx}`;

      const ai = getAI(fbApp, { backend: new GoogleAIBackend() });
      const model = getGenerativeModel(ai, {
        model: "gemini-3.1-flash-lite",
        systemInstruction: systemPrompt,
      });
      const chat = model.startChat();
      const result = await chat.sendMessage(q);
      setAiMessages((m) => [...m, { role: "ai", text: result.response.text() || "답변을 만들지 못했습니다." }]);
    } catch (e) {
      setAiMessages((m) => [...m, { role: "ai", text: "오류가 발생했습니다: " + (e.message || "알 수 없는 오류") }]);
    }
    setAiLoading(false);
  };

  /* ── 월간 체크리스트 ── */
  const monthlies=useMemo(()=>(data.monthlies||[]).filter((m)=>!m.deleted),[data.monthlies]);
  const mlyByMonth=(ym)=>monthlies.filter((m)=>m.month===ym).slice().sort((a,b)=>{if(a.done!==b.done)return a.done?1:-1;return(a.order??999)-(b.order??999);});
  const saveMly=()=>{
    if(!mlyDraft.title.trim())return;
    const now=Date.now();const isNew=!!mlyDraft._new;
    const rec={...mlyDraft,updatedAt:now,updatedBy:me,createdAt:mlyDraft.createdAt||now,subs:mlyDraft.subs||[],history:mlyDraft.history||[]};
    delete rec._new;
    commit((d)=>{const list=d.monthlies||[];const ex=list.some((x)=>x.id===rec.id);
      return{...d,monthlies:ex?list.map((x)=>x.id===rec.id?rec:x):[...list,rec]};},
      [{id:uid(),ts:now,who:me||"익명",taskId:rec.id,taskTitle:rec.title,action:isNew?"월간항목 생성":"월간항목 수정",detail:rec.month}]);
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
    commit((d)=>({...d,monthlies:[...(d.monthlies||[]),copy]}),[mkLog("월간항목 복사",null,`${copy.title} -> ${nextMonth}`)]);
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
    const entry={id:uid(),text:t,author:me||"익명",ts:Date.now()};
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
    const entry={id:uid(),text:t,author:me||"익명",ts:Date.now()};
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
  const editMlySubDirect=(monthlyId,subId,text)=>{
    const t=text.trim();if(!t)return;
    commit((d)=>({...d,monthlies:(d.monthlies||[]).map((m)=>m.id===monthlyId?{...m,subs:(m.subs||[]).map((s)=>s.id===subId?{...s,text:t,updatedAt:Date.now()}:s),updatedAt:Date.now()}:m)}),[]);
  };
  const removeMlySubDirect=(monthlyId,subId)=>{
    commit((d)=>({...d,monthlies:(d.monthlies||[]).map((m)=>m.id===monthlyId?{...m,subs:(m.subs||[]).filter((s)=>s.id!==subId),updatedAt:Date.now()}:m)}),[]);
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

  /* ── 반복업무 3단(대분류>중분류>소분류) ── */
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
    if(!cat?.trim()||!sub?.trim()||!title?.trim()){alert("대분류·중분류·소분류를 모두 입력하세요.");return;}
    const now=Date.now();
    if(riAdd.id){
      commit((d)=>({...d,rItems:(d.rItems||[]).map((x)=>x.id===riAdd.id?{...x,cat:cat.trim(),sub:sub.trim(),title:title.trim(),updatedAt:now}:x)}),[mkLog("반복항목 수정",null,title)]);
    }else{
      const rec={id:uid(),cat:cat.trim(),sub:sub.trim(),title:title.trim(),checkins:{},createdAt:now,updatedAt:now,createdBy:me};
      commit((d)=>({...d,rItems:[...(d.rItems||[]),rec]}),[mkLog("반복항목 추가",null,title)]);
    }
    setRiAdd(null);
  };
  const toggleRi=(it,date)=>{
    if(!canEdit)return;
    commit((d)=>({...d,rItems:(d.rItems||[]).map((x)=>{
      if(x.id!==it.id)return x;
      const ck={...(x.checkins||{})};
      if(ck[date])delete ck[date]; else ck[date]={by:me||"익명",ts:Date.now()};
      return {...x,checkins:ck,updatedAt:Date.now()};
    })}),[]);
  };
  const removeRi=(it)=>{commit((d)=>({...d,rItems:(d.rItems||[]).map((x)=>x.id===it.id?{...x,deleted:true,updatedAt:Date.now()}:x)}),[mkLog("반복항목 삭제",null,it.title)]);setRiAdd(null);};
  const duplicateRi=(it)=>{
    const now=Date.now();
    const copy={id:uid(),cat:it.cat,sub:it.sub,title:it.title+" (복사)",checkins:{},issues:[],createdAt:now,updatedAt:now,createdBy:me};
    commit((d)=>({...d,rItems:[...(d.rItems||[]),copy]}),[mkLog("반복항목 복사",null,copy.title)]);
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
    const iss={id:uid(),text:t,author:me||"익명",ts:Date.now(),resolved:false,subs:[]};
    commit((d)=>({...d,rItems:(d.rItems||[]).map((x)=>x.id===itemId?{...x,issues:[iss,...(x.issues||[])],updatedAt:Date.now()}:x)}),[mkLog("반복항목 이슈 등록",null,t.slice(0,30))]);
  };
  const toggleRiIssue=(itemId,issueId)=>{
    commit((d)=>({...d,rItems:(d.rItems||[]).map((x)=>x.id!==itemId?x:{...x,issues:(x.issues||[]).map((i)=>i.id===issueId?{...i,resolved:!i.resolved,resolvedBy:me}:i),updatedAt:Date.now()})}),[]);
  };
  const removeRiIssue=(itemId,issueId)=>{
    commit((d)=>({...d,rItems:(d.rItems||[]).map((x)=>x.id!==itemId?x:{...x,issues:(x.issues||[]).filter((i)=>i.id!==issueId),updatedAt:Date.now()})}),[]);
  };
  const duplicateRiIssue=(itemId,issue)=>{
    const copy={id:uid(),text:issue.text+" (복사)",author:me||"익명",ts:Date.now(),resolved:false,subs:[]};
    commit((d)=>({...d,rItems:(d.rItems||[]).map((x)=>x.id===itemId?{...x,issues:[copy,...(x.issues||[])],updatedAt:Date.now()}:x)}),[mkLog("반복항목 이슈 복사",null,copy.text.slice(0,30))]);
  };
  const editRiIssueText=(itemId,issueId,text)=>{
    const t=text.trim();if(!t)return;
    commit((d)=>({...d,rItems:(d.rItems||[]).map((x)=>x.id!==itemId?x:{...x,issues:(x.issues||[]).map((i)=>i.id===issueId?{...i,text:t,edited:true}:i),updatedAt:Date.now()})}),[]);
  };
  const addRiIssueSub=(itemId,issueId,text)=>{
    const t=text.trim();if(!t)return;
    const sub={id:uid(),text:t,author:me||"익명",ts:Date.now()};
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

  /* ── 메모 ── */
  const memoItems=useMemo(()=>(data.memoItems||[]).filter((x)=>!x.deleted),[data.memoItems]);
  const memoCatNames=useMemo(()=>[...new Set(memoItems.map((x)=>x.cat).filter(Boolean))].sort(),[memoItems]);
  const memoSubNames=useMemo(()=>(cat)=>[...new Set(memoItems.filter((x)=>x.cat===cat).map((x)=>x.sub).filter(Boolean))].sort(),[memoItems]);
  const memoFiltered=useMemo(()=>{
    let list=memoItems;
    if(memoCatFilter!=="전체")list=list.filter((x)=>(x.cat||"미분류")===memoCatFilter);
    const q=memoQuery.trim().toLowerCase();
    if(q)list=list.filter((x)=>`${x.cat||""} ${x.sub||""} ${x.title||""} ${x.text||""} ${(x.subs||[]).map((s)=>s.text).join(" ")}`.toLowerCase().includes(q));
    return list.slice().sort((a,b)=>(a.order??999)-(b.order??999));
  },[memoItems,memoCatFilter,memoQuery]);
  const memoCatOptions=useMemo(()=>["전체",...new Set(memoItems.map((x)=>x.cat||"미분류"))],[memoItems]);
  const saveMemo=()=>{
    const text=(memoDraft.text||"").trim();
    if(!text){alert("메모 내용을 입력하세요.");return;}
    const now=Date.now();
    if(memoDraft.id){
      commit((d)=>({...d,memoItems:(d.memoItems||[]).map((x)=>x.id===memoDraft.id?{...x,cat:(memoDraft.cat||"").trim(),sub:(memoDraft.sub||"").trim(),title:(memoDraft.title||"").trim(),text,updatedAt:now}:x)}),[mkLog("메모 수정",null,text.slice(0,30))]);
    }else{
      const rec={id:uid(),cat:(memoDraft.cat||"").trim(),sub:(memoDraft.sub||"").trim(),title:(memoDraft.title||"").trim(),text,subs:[],createdAt:now,updatedAt:now,createdBy:me};
      commit((d)=>({...d,memoItems:[...(d.memoItems||[]),rec]}),[mkLog("메모 생성",null,text.slice(0,30))]);
    }
    setMemoDraft(null);
  };
  const removeMemo=(m)=>{commit((d)=>({...d,memoItems:(d.memoItems||[]).map((x)=>x.id===m.id?{...x,deleted:true,updatedAt:Date.now()}:x)}),[mkLog("메모 삭제",null,(m.text||"").slice(0,30))]);setMemoDraft(null);};
  const duplicateMemo=(m)=>{
    const now=Date.now();
    const copy={id:uid(),cat:m.cat,sub:m.sub,title:m.title?m.title+" (복사)":"",text:m.text,subs:[],order:null,createdAt:now,updatedAt:now,createdBy:me};
    commit((d)=>({...d,memoItems:[...(d.memoItems||[]),copy]}),[mkLog("메모 복사",null,(copy.text||"").slice(0,30))]);
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
    const sub={id:uid(),text:t,author:me||"익명",ts:Date.now()};
    commit((d)=>({...d,memoItems:(d.memoItems||[]).map((x)=>x.id===memoId?{...x,subs:[...(x.subs||[]),sub],updatedAt:Date.now()}:x)}),[]);
  };
  const editMemoSub=(memoId,subId,text)=>{
    const t=text.trim();if(!t)return;
    commit((d)=>({...d,memoItems:(d.memoItems||[]).map((x)=>x.id===memoId?{...x,subs:(x.subs||[]).map((s)=>s.id===subId?{...s,text:t,edited:true}:s),updatedAt:Date.now()}:x)}),[]);
  };
  const removeMemoSub=(memoId,subId)=>{
    commit((d)=>({...d,memoItems:(d.memoItems||[]).map((x)=>x.id===memoId?{...x,subs:(x.subs||[]).filter((s)=>s.id!==subId),updatedAt:Date.now()}:x)}),[]);
  };

  /* ── 마인드맵 (계층형) ── */
  const mindmaps=useMemo(()=>(data.mindmaps||[]).filter((m)=>!m.deleted),[data.mindmaps]);
  const mmMakeNode=(text,color)=>({id:uid(),text:text||"노드",color:color||null,children:[],collapsed:false});
  const mmSaveToDB=(id,tree,title)=>{
    const now=Date.now();
    const exists=(data.mindmaps||[]).find((m)=>m.id===id);
    if(exists){commit((d)=>({...d,mindmaps:(d.mindmaps||[]).map((m)=>m.id===id?{...m,tree,title:title||m.title,updatedAt:now}:m)}),[]);}
    else{commit((d)=>({...d,mindmaps:[...(d.mindmaps||[]),{id,title:title||"새 마인드맵",tree,createdAt:now,updatedAt:now,createdBy:me}]}),[]);}
  };
  const loadMm=(mm)=>{setMmId(mm.id);setMmTree(JSON.parse(JSON.stringify(mm.tree||mmMakeNode("중심"))));setMmSel(null);setMmEditId(null);};
  const deleteMm=(id)=>{
    commit((d)=>({...d,mindmaps:(d.mindmaps||[]).map((m)=>m.id===id?{...m,deleted:true,updatedAt:Date.now()}:m)}),[]);
    if(mmId===id){setMmId(null);setMmTree(null);}
  };
  const duplicateMm=(mm)=>{
    const id=uid();const now=Date.now();
    const deepCopy=(node)=>({...node,id:uid(),children:(node.children||[]).map(deepCopy)});
    commit((d)=>({...d,mindmaps:[...(d.mindmaps||[]),{id,title:(mm.title||"맵")+" (복사)",tree:deepCopy(mm.tree||{}),createdAt:now,updatedAt:now,createdBy:me}]}),[]);
  };
  // 트리 조작 헬퍼
  const mmUpdateNode=(tree,targetId,updater)=>{
    if(!tree)return tree;
    if(tree.id===targetId)return updater(tree);
    return {...tree,children:(tree.children||[]).map((c)=>mmUpdateNode(c,targetId,updater))};
  };
  const mmDeleteNode=(tree,targetId)=>{
    if(!tree)return tree;
    return {...tree,children:(tree.children||[]).filter((c)=>c.id!==targetId).map((c)=>mmDeleteNode(c,targetId))};
  };

  /* ── 카페24 상품 스케줄러 ── */
  const C24_MALL='slowrocket';
  const C24_CLIENT_ID='XUlWW7h7N9claZtHu37zhA';
  const C24_REDIRECT='https://work-board-one.vercel.app';
  const c24AddLog=(msg)=>setC24Log((l)=>{const t=new Date().toLocaleTimeString();const next=[...l,`[${t}] ${msg}`];return next.slice(-100);});
  const c24TokenValid=()=>c24TokenRef.current&&c24Expiry>Date.now();
  // 토큰 state가 바뀔 때 ref도 동기화
  useEffect(()=>{c24TokenRef.current=c24Token;},[c24Token]);
  const c24SaveSchedules=(list)=>{
    setC24Schedules(list);
    localStorage.setItem('c24_schedules',JSON.stringify(list));
    // Firebase에 동기화 (GitHub Actions에서 사용)
    commit((d)=>({...d,cafe24_schedules:list,updatedAt:Date.now()}),[]);
  };
  const c24StartOAuth=()=>{
    const url=`https://${C24_MALL}.cafe24api.com/api/v2/oauth/authorize?response_type=code&client_id=${C24_CLIENT_ID}&redirect_uri=${encodeURIComponent(C24_REDIRECT)}&scope=mall.read_product%2Cmall.write_product`;
    window.location.href=url;
  };
  const c24SaveToken=(access,expiry,refresh)=>{
    setC24Token(access);setC24Expiry(expiry);
    localStorage.setItem('c24_token',access);
    localStorage.setItem('c24_expiry',expiry);
    if(refresh){setC24RefreshToken(refresh);localStorage.setItem('c24_refresh_token',refresh);}
    // Firebase에 토큰 동기화 (GitHub Actions에서 사용)
    commit((d)=>({...d,cafe24_token_data:{access_token:access,expiry,refresh_token:refresh||localStorage.getItem('c24_refresh_token')||''},updatedAt:Date.now()}),[]);
  };
  const c24ExchangeCode=async(code)=>{
    c24AddLog('🔄 인증 코드 수신, 토큰 교환 중...');
    try{
      const res=await fetch('/api/cafe24-token',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code,grant_type:'authorization_code'})});
      const data=await res.json();
      if(data.access_token){
        const expiry=Date.now()+(data.expires_in||7200)*1000;
        c24SaveToken(data.access_token,expiry,data.refresh_token);
        c24AddLog('✅ 인증 성공! 토큰 발급 완료 (만료: '+Math.round((expiry-Date.now())/60000)+'분 후)');
      }else{c24AddLog('❌ 토큰 교환 실패: '+JSON.stringify(data));}
    }catch(e){c24AddLog('❌ 오류: '+e.message);}
  };
  const c24RefreshAccessToken=async()=>{
    const refresh=localStorage.getItem('c24_refresh_token');
    if(!refresh){c24AddLog('⚠ Refresh Token 없음 - 재로그인 필요');return false;}
    c24AddLog('🔄 토큰 자동 갱신 중...');
    try{
      const res=await fetch('/api/cafe24-token',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({grant_type:'refresh_token',refresh_token:refresh})});
      const data=await res.json();
      if(data.access_token){
        const expiry=Date.now()+(data.expires_in||7200)*1000;
        c24SaveToken(data.access_token,expiry,data.refresh_token||refresh);
        c24AddLog('✅ 토큰 자동 갱신 완료 (만료: '+Math.round((expiry-Date.now())/60000)+'분 후)');
        return true;
      }else{c24AddLog('❌ 토큰 갱신 실패 - 재로그인 필요: '+JSON.stringify(data));return false;}
    }catch(e){c24AddLog('❌ 갱신 오류: '+e.message);return false;}
  };
  const c24ManualToken=()=>{
    const t=prompt('Access Token 입력:');
    if(!t)return;
    const expiry=Date.now()+7200000;
    setC24Token(t.trim());setC24Expiry(expiry);
    localStorage.setItem('c24_token',t.trim());localStorage.setItem('c24_expiry',expiry);
    c24AddLog('✅ 토큰 수동 입력 완료');
  };
  const c24SearchProduct=async()=>{
    if(!c24TokenValid()){alert('먼저 카페24 인증을 완료해주세요.');return;}
    if(!c24ProductCode.trim()){alert('상품코드를 입력해주세요. (예: P0000BBC)');return;}
    setC24SearchLoading(true);setC24SearchResult([]);
    try{
      const res=await fetch('/api/cafe24-product',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'search',token:c24Token,productCode:c24ProductCode.trim().toUpperCase()})});
      const data=await res.json();
      const product=data.product;
      if(product){
        setC24SearchResult([product]);
        c24AddLog(`🔍 상품 조회 완료: #${product.product_no} ${product.product_name}`);
      }else{c24AddLog('❌ 상품을 찾을 수 없습니다: '+c24ProductCode);}
    }catch(e){c24AddLog('❌ 조회 오류: '+e.message);}
    setC24SearchLoading(false);
  };
  const c24UpdateProduct=async(productNo,payload)=>{
    try{
      const res=await fetch('/api/cafe24-product',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'update',token:c24TokenRef.current,productNo,payload})});
      const data=await res.json();
      if(data.product)return true;
      c24AddLog('❌ API 오류: '+JSON.stringify(data));return false;
    }catch(e){c24AddLog('❌ API 오류: '+e.message);return false;}
  };
  const c24AddSchedule=()=>{
    if(!c24SelProduct){alert('상품을 먼저 선택해주세요.');return;}
    if(!c24OpenAt&&!c24CloseAt){alert('오픈 또는 종료 일시를 입력해주세요.');return;}
    if(c24OpenAt&&c24CloseAt&&new Date(c24OpenAt)>=new Date(c24CloseAt)){alert('오픈 일시가 종료 일시보다 앞이어야 합니다.');return;}
    const s={id:Date.now().toString(36),productNo:c24SelProduct.no,productName:c24SelProduct.name,openAt:c24OpenAt||null,closeAt:c24CloseAt||null,openSelling:c24OpenSelling,openDisplay:c24OpenDisplay,closeAction:c24CloseAction,openDone:false,closeDone:false};
    const next=[...c24Schedules,s];
    c24SaveSchedules(next);
    c24AddLog(`✅ 스케줄 등록: #${s.productNo} ${s.productName} | 오픈:${s.openAt||'없음'} | 종료:${s.closeAt||'없음'}`);
  };
  const c24DeleteSchedule=(id)=>{c24SaveSchedules(c24Schedules.filter((s)=>s.id!==id));c24AddLog('🗑 스케줄 삭제');};
  const c24CheckSchedules=useCallback(async()=>{
    // 토큰 만료 10분 전이면 자동 갱신
    if(c24Expiry&&c24Expiry-Date.now()<600000&&c24Expiry>Date.now()){
      await c24RefreshAccessToken();
    }
    if(!c24TokenValid())return;
    const now=new Date();let changed=false;
    const next=await Promise.all(c24Schedules.map(async(s)=>{
      let updated={...s};
      if(s.openAt&&!s.openDone&&new Date(s.openAt)<=now){
        c24AddLog(`🟢 오픈 실행: #${s.productNo}`);
        const ok=await c24UpdateProduct(s.productNo,{display:s.openDisplay,selling:s.openSelling});
        if(ok){updated.openDone=true;c24AddLog(`✅ 오픈 완료: #${s.productNo}`);changed=true;}
        else{updated.error='오픈 실패';changed=true;}
      }
      if(s.closeAt&&!s.closeDone&&new Date(s.closeAt)<=now){
        c24AddLog(`🔴 종료 실행: #${s.productNo}`);
        const payload=s.closeAction==='soldout'?{selling:'F',soldout:'T'}:s.closeAction==='hide'?{display:'F',selling:'F'}:{selling:'F'};
        const ok=await c24UpdateProduct(s.productNo,payload);
        if(ok){updated.closeDone=true;c24AddLog(`✅ 종료 완료: #${s.productNo}`);changed=true;}
        else{updated.error='종료 실패';changed=true;}
      }
      return updated;
    }));
    if(changed)c24SaveSchedules(next);
  },[c24Schedules,c24Token,c24Expiry,c24RefreshToken]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);
    const code=params.get('code');
    const error=params.get('error');
    if(error){
      window.history.replaceState({},'',window.location.pathname);
      setView('cafe24');
      setC24Log((l)=>[...l,`❌ 인증 오류: ${error} - ${params.get('error_description')||''}`]);
      return;
    }
    if(code){
      setView('cafe24');
      window.history.replaceState({},'',window.location.pathname);
      c24ExchangeCode(code);
    }
  },[]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(()=>{
    if(c24TimerRef.current)clearInterval(c24TimerRef.current);
    c24TimerRef.current=setInterval(c24CheckSchedules,30000);
    return()=>clearInterval(c24TimerRef.current);
  },[c24CheckSchedules]);

  /* ── 래퍼런스 ── */
  const refs=useMemo(()=>(data.refs||[]).filter((r)=>!r.deleted),[data.refs]);
  const refCats=useMemo(()=>data.refCats||["디자인","마케팅","경쟁사","콘텐츠"],[data.refCats]);
  const [refCatFilter, setRefCatFilter] = useState("전체");
  const [refQuery, setRefQuery] = useState("");
  const [refAddOpen, setRefAddOpen] = useState(false);
  const [refDraft, setRefDraft] = useState(null);
  const [refPasteActive, setRefPasteActive] = useState(false);
  const [refCatEdit, setRefCatEdit] = useState(false);
  const [refNewCat, setRefNewCat] = useState("");
  const refFiltered=useMemo(()=>{
    let list=refs;
    if(refCatFilter==="즐겨찾기")list=list.filter((r)=>r.fav);
    else if(refCatFilter!=="전체")list=list.filter((r)=>r.cat===refCatFilter);
    const q=refQuery.trim().toLowerCase();
    if(q)list=list.filter((r)=>`${r.title||""} ${r.memo||""} ${r.cat||""}`.toLowerCase().includes(q));
    return list;
  },[refs,refCatFilter,refQuery]);
  const addRef=(item)=>{commit((d)=>({...d,refs:[{...item,id:uid(),createdAt:Date.now(),createdBy:me||"익명"},...(d.refs||[])],updatedAt:Date.now()}),[]);};
  const updateRef=(id,patch)=>{commit((d)=>({...d,refs:(d.refs||[]).map((r)=>r.id===id?{...r,...patch,updatedAt:Date.now()}:r),updatedAt:Date.now()}),[]);};
  const deleteRef=(id)=>{commit((d)=>({...d,refs:(d.refs||[]).map((r)=>r.id===id?{...r,deleted:true}:r),updatedAt:Date.now()}),[]);};
  const addRefCat=(name)=>{const t=name.trim();if(!t||refCats.includes(t))return;commit((d)=>({...d,refCats:[...(d.refCats||[]),t],updatedAt:Date.now()}),[]);};
  const deleteRefCat=(name)=>{commit((d)=>({...d,refCats:(d.refCats||[]).filter((c)=>c!==name),updatedAt:Date.now()}),[]);};
  const handleRefImages=async(files)=>{
    const imgs=await Promise.all(Array.from(files).map((f)=>resizeImage(f,1200,1200,0.85)));
    imgs.forEach((src)=>setRefDraft((d)=>({...d,images:[...(d?.images||[]),{id:uid(),src}]})));
  };

  const exportJson=()=>{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(dataRef.current,null,2)],{type:"application/json"}));a.download=`work-board-${todayStr()}.json`;a.click();};
  const importJson=async(file)=>{try{const p=JSON.parse(await file.text());if(!Array.isArray(p.tasks))throw new Error();commit((d)=>mergeData(d,{...emptyData(),...p}),[mkLog("백업 가져오기",null,`${p.tasks.length}건`)]);} catch(e){alert("읽을 수 없는 파일입니다.");}};

  /* ── 알림 (공용 보드 전용, 탭 열려있을 때만) ── */
  const notify=useCallback((title,body)=>{
    if(!notifOn||typeof Notification==="undefined")return;
    try{const n=new Notification(title,{body,icon:"/favicon.ico"});n.onclick=()=>{window.focus();n.close();};}catch(e){}
  },[notifOn]);

  const myNotifs=useMemo(()=>(data.notifications||[]).filter((n)=>n.to===me).slice().sort((a,b)=>b.ts-a.ts),[data.notifications,me]);
  const unreadNotifs=useMemo(()=>myNotifs.filter((n)=>!n.read),[myNotifs]);
  const markAllNotifsRead=()=>{
    if(!unreadNotifs.length)return;
    commit((d)=>({...d,notifications:(d.notifications||[]).map((n)=>n.to===me?{...n,read:true}:n),updatedAt:Date.now()}),[]);
  };
  const sendManualNotif=(task,targetOwner,msg)=>{
    if(!task||!targetOwner)return;
    const notif={id:uid(),from:me||"익명",to:targetOwner,taskId:task.id,taskTitle:task.title,msg:msg||(me||"팀원")+"님이 \""+task.title+"\" 업무를 업데이트했습니다.",ts:Date.now(),read:false};
    commit((d)=>({...d,notifications:[...(d.notifications||[]),notif],updatedAt:Date.now()}),[]);
  };

  const prevNotifsLen = useRef(null);
  useEffect(()=>{
    if(!notifOn||!me)return;
    const myNotifs=(data.notifications||[]).filter((n)=>n.to===me&&!n.read);
    if(prevNotifsLen.current===null){prevNotifsLen.current=myNotifs.length;return;}
    if(myNotifs.length>prevNotifsLen.current){
      const newOnes=myNotifs.slice(prevNotifsLen.current);
      newOnes.forEach((n)=>{
        const key=`manualnotif:${n.id}`;
        if(!getNotified().has(key)){notify("📬 "+n.taskTitle,n.msg);markNotified(key);}
      });
    }
    prevNotifsLen.current=myNotifs.length;
  },[data.notifications,notifOn,me,notify,getNotified,markNotified]);

  const enableNotif=()=>{
    if(typeof Notification==="undefined"){alert("이 브라우저는 알림을 지원하지 않습니다.");return;}
    if(Notification.permission==="granted"){setNotifOn(true);return;}
    Notification.requestPermission().then((p)=>{setNotifOn(p==="granted");if(p!=="granted")alert("알림이 차단됐습니다. 브라우저 주소창 왼쪽 자물쇠 아이콘에서 알림을 허용해주세요.");});
  };

  useEffect(()=>{
    if(!notifOn){prevTasksRef.current=data.tasks;return;}
    const prev=prevTasksRef.current;
    if(prev){
      const prevMap=new Map(prev.map((t)=>[t.id,t]));
      data.tasks.forEach((t)=>{
        if((t.boardId||"공용")!=="공용"||t.deleted)return;
        const p=prevMap.get(t.id);
        if(!p){
          if(t.owner===me&&t.createdBy&&t.createdBy!==me)notify("새 업무가 배정됐어요",`${t.createdBy}님이 "${t.title}" 업무를 배정했습니다.`);
          return;
        }
        if(t.updatedBy===me)return;
        if(t.owner===me&&p.owner!==me)notify("새 업무가 배정됐어요",`${t.updatedBy||"팀원"}님이 "${t.title}" 업무를 배정했습니다.`);
        if(t.status==="doing"&&p.status!=="doing"&&t.createdBy===me)notify("업무가 시작됐어요",`${t.owner||"담당자"}님이 "${t.title}"를 진행중으로 옮겼습니다.`);
        if((t.memo||"").trim()&&(t.memo||"")!==(p.memo||"")&&(t.owner===me||t.createdBy===me))notify("메모가 등록됐어요",`"${t.title}": ${t.memo.slice(0,50)}`);
      });
    }
    prevTasksRef.current=data.tasks;
  },[data.tasks,notifOn,me,notify]);

  useEffect(()=>{
    if(!notifOn)return;
    const check=()=>{
      data.tasks.forEach((t)=>{
        if((t.boardId||"공용")!=="공용"||t.deleted||t.archived||t.status==="done"||t.owner!==me||!t.due)return;
        const dd=dayDiff(t.due);if(dd===null)return;
        let key=null,ttl=null,body=null;
        if(dd<0){key=`overdue:${t.id}`;ttl="마감이 지났어요";body=`"${t.title}" 마감 ${Math.abs(dd)}일 지남`;}
        else if(dd===0){key=`due0:${t.id}`;ttl="오늘 마감이에요";body=`"${t.title}"`;}
        else if(dd===1){key=`due1:${t.id}`;ttl="마감이 임박했어요";body=`"${t.title}" 내일 마감`;}
        if(key&&!getNotified().has(key)){notify(ttl,body);markNotified(key);}
      });
    };
    check();
    const iv=setInterval(check,5*60*1000);
    return()=>clearInterval(iv);
  },[notifOn,data.tasks,me,notify,getNotified,markNotified]);
  useEffect(()=>{const h=(e)=>{if(e.key==="Escape"){setDraft(null);setConfirmBox(null);}};window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h);},[]);

  const renderCard=(t)=>{
    const d=dayDiff(t.due),late=d!==null&&d<0&&t.status!=="done",soon=d!==null&&d>=0&&d<=2&&t.status!=="done";
    const ck=t.checklist||[],ckDone=ck.filter((c)=>c.done).length;
    return(
      <div key={t.id} className={"card"+(late?" late":"")+(t.status==="done"?" done":"")+(dragId===t.id?" drag":"")+(t.priority==="urgent"?" urgent":t.priority==="high"?" high":t.priority==="low"?" low":"")} style={{"--ch":chColor(t.channel)}}
        draggable={canEdit} onDragStart={(e)=>{setDragId(t.id);e.dataTransfer.effectAllowed="move";}} onDragEnd={()=>{setDragId(null);setOverCol(null);}} onClick={()=>openTask(t)}>
        <div className="cmeta"><span className="ch">{t.channel}</span><span>·</span><span>{t.type}</span>{t.repeat&&t.repeat!=="none"&&<><span>·</span><span>↻{REPEATS.find((r)=>r.id===t.repeat)?.label}</span></>}</div>
        <p className="ctitle">{t.title}</p>
        {!!(t.tags||[]).length&&<div className="ctags">{t.tags.map((g)=><span key={g} className="tag">{g}</span>)}</div>}
        {(t.progress>0||ck.length>0)&&(()=>{
          const pct=t.progress!=null&&t.progress>0?t.progress:(ck.length?Math.round(ckDone/ck.length*100):0);
          return <div className="cbar" title={`진행률 ${pct}%`}><i style={{width:pct+"%"}} /></div>;
        })()}
        <div className="cfoot">
          <span style={{display:"inline-flex",alignItems:"center",gap:7}}>
            {t.owner?<span className={"ownerchip"+(t.owner===me?" me":"")}>{t.owner}</span>:<span style={{color:"var(--ink3)"}}>미지정</span>}
            {t.due&&<span className={"due"+(late?" late":soon?" soon":"")}>{t.start?t.start.slice(5)+"~":""}{t.due.slice(5)}{late?` +${Math.abs(d)}d`:""}</span>}
            {(t.images||[]).length>0&&<span style={{fontSize:11,color:"var(--ink3)"}}>🖼 {t.images.length}</span>}
          </span>
          <span style={{display:"flex",gap:6,alignItems:"center"}}>
            <span className="icons">{ck.length>0&&<span>☑{ckDone}/{ck.length}</span>}{!!(t.comments||[]).length&&<span>💬{t.comments.length}</span>}{!!(t.links||[]).length&&<span>🔗{t.links.length}</span>}</span>
            <span className={"pri"+(t.priority==="urgent"?" urgent":t.priority==="high"?" high":"")}>{PRIORITIES.find((p)=>p.id===t.priority)?.label}</span>
          </span>
        </div>
      </div>
    );
  };

  if(!ready)return<div className="wb"><style>{CSS}</style><div className="eyebrow">Team Work Board</div><p style={{fontFamily:"monospace",fontSize:12,color:"#8F959C"}}>보드를 불러오는 중</p></div>;

  if(!me){
    return (
      <div className="wb"><style>{CSS}</style>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:20}}>
          <div className="modal" style={{maxWidth:400,margin:0}}>
            <h2>{signupMode?"신규 계정 등록":"로그인"}</h2>
            <div className="modal-body">
              <div className="fld"><label>이름</label>
                <input list="wb-memlist" autoFocus value={nameInput} onChange={(e)=>setNameInput(e.target.value)}
                  onKeyDown={(e)=>{if(e.nativeEvent.isComposing)return;if(e.key==="Enter"&&!signupMode)doLogin();}}
                  placeholder="예) 김현민" />
                <datalist id="wb-memlist">{data.members.map((m)=><option key={m.name} value={m.name} />)}</datalist>
              </div>
              <div className="fld"><label>비밀번호</label>
                <input type="password" value={loginPw} onChange={(e)=>setLoginPw(e.target.value)}
                  onKeyDown={(e)=>{if(e.key==="Enter"&&!signupMode)doLogin();}}
                  placeholder="비밀번호" />
              </div>
              {signupMode&&(
                <div className="fld"><label>비밀번호 확인</label>
                  <input type="password" value={signupPw2} onChange={(e)=>setSignupPw2(e.target.value)}
                    onKeyDown={(e)=>{if(e.key==="Enter")doSignup();}}
                    placeholder="비밀번호 다시 입력" />
                </div>
              )}
              {data.members.length===0&&!signupMode&&<p className="hint" style={{color:"var(--pri)"}}>첫 사용자입니다. 신규 등록으로 관리자 계정을 만드세요.</p>}
            </div>
            <div className="modal-foot">
              <button className="btn ghost" onClick={()=>{setSignupMode(!signupMode);setLoginPw("");setSignupPw2("");}}>{signupMode?"← 로그인으로":"신규 등록"}</button>
              <span className="spacer" />
              {signupMode
                ? <button className="btn-save" onClick={doSignup}>계정 만들기</button>
                : <button className="btn-save" onClick={doLogin}>로그인</button>}
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
        <div className="brand"><span className="logo">W</span>업무 보드</div>
        <span className="spacer" />
        <button className="who" onClick={()=>setPwChange({cur:"",next:"",next2:""})} title="비밀번호 변경">
          <span className="av">{(me||"?").slice(0,1)}</span>
          {me||"이름 설정"}<span className="role">{ROLES.find((r)=>r.id===myRole)?.label}</span>
        </button>
        <span className="save"><i className={"dot "+(saveState==="error"?"err":saveState==="idle"?"":"on")} />{saveState==="saving"?"저장 중":saveState==="saved"?"저장됨":saveState==="error"?"저장 실패":saveState==="loading"?"불러오는 중":"동기화됨"}</span>
        <button className="ghostw" onClick={()=>load()}>새로고침</button>
        {!notifOn&&<button className="ghostw" onClick={enableNotif}>🔔 알림 켜기</button>}
        {notifOn&&<span style={{fontSize:12,color:"var(--ok)",fontWeight:700,display:"inline-flex",alignItems:"center",gap:4}}>🔔 알림 켜짐</span>}
        <div style={{position:"relative"}}>
          <button className="ghostw" style={{position:"relative"}} onClick={()=>{setNotifBoxOpen(!notifBoxOpen);if(!notifBoxOpen)markAllNotifsRead();}}>
            📬{unreadNotifs.length>0&&<span style={{position:"absolute",top:-4,right:-4,background:"#C9372C",color:"#fff",borderRadius:"50%",fontSize:10,width:16,height:16,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900}}>{unreadNotifs.length}</span>}
          </button>
          {notifBoxOpen&&(
            <div style={{position:"absolute",right:0,top:"calc(100% + 6px)",width:300,background:"var(--card)",boxShadow:"0 4px 20px rgba(0,0,0,.15)",borderRadius:10,zIndex:999,overflow:"hidden"}}>
              <div style={{padding:"10px 14px",borderBottom:"1px solid var(--line)",fontWeight:700,fontSize:13,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span>받은 알림</span>
                <button style={{background:"none",border:"none",fontSize:11,color:"var(--ink3)",cursor:"pointer"}} onClick={()=>setNotifBoxOpen(false)}>닫기</button>
              </div>
              {myNotifs.length===0&&<div style={{padding:16,fontSize:13,color:"var(--ink3)"}}>받은 알림이 없습니다</div>}
              {myNotifs.slice(0,20).map((n)=>(
                <div key={n.id} style={{padding:"10px 14px",borderBottom:"1px solid var(--line)",background:n.read?"var(--bg)":"#F0F7FF"}}>
                  <div style={{fontSize:13,fontWeight:n.read?400:700,color:"var(--ink1)"}}>{n.msg}</div>
                  <div style={{fontSize:11,color:"var(--ink3)",marginTop:3}}>{fmtTs(n.ts)} · {n.from}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <button className="ghostw" onClick={logout}>로그아웃</button>
      </div>
      <div className="tabs">
        {[{id:"board",label:"보드",n:live.length},{id:"routine",label:"반복업무",n:rItems.filter((it)=>!(it.checkins||{})[riDate]).length},{id:"monthly",label:"월간 업무",n:mlyByMonth(mlyDate).filter((m)=>!m.done).length},{id:"checklist",label:"체크리스트",n:checkitems.filter((c)=>!c.done).length},{id:"memo",label:"메모",n:memoItems.length},{id:"mindmap",label:"마인드맵",n:null},{id:"ref",label:"래퍼런스",n:null},{id:"issue",label:"이슈",n:allIssues.filter((i)=>!i.resolved).length},{id:"archive",label:"보관함",n:archived.length},{id:"log",label:"변경 이력",n:null},{id:"ai",label:"AI비서",n:null},{id:"cafe24",label:"상품스케줄",n:null},{id:"team",label:"팀·설정",n:null}].map((t)=>(
          <button key={t.id} className={"tab"+(view===t.id?" sel":"")} onClick={()=>setView(t.id)}>{t.label}{t.n!==null&&<em>{t.n}</em>}</button>
        ))}
      </div>
      <div className="page">

      {view==="board"&&(<>
        <div className="boardtabs">
          {BOARDS.map((b)=>(
            <button key={b} className={"boardtab"+(curBoard===b?" sel":"")} onClick={()=>setCurBoard(b)}>
              {b==="공용"?"공용 보드":b+" 보드"}
              <em>{data.tasks.filter((t)=>!t.deleted&&!t.archived&&(t.boardId||"공용")===b).length}</em>
            </button>
          ))}
        </div>
        <div className="metrics">
          <button className="metric cl" onClick={()=>{setOnlyLate(false);}}><span className="k">전체</span><span className="v">{stats.total}</span></button>
          <div className="metric"><span className="k">진행중</span><span className="v">{stats.doing}</span></div>
          <div className="metric"><span className="k">마감 하루 전</span><span className={"v"+(stats.tomorrow?" wa":"")}>{stats.tomorrow}</span></div>
          <button className="metric cl" onClick={()=>{setOnlyLate(true);}}><span className="k">지연</span><span className={"v"+(stats.late?" al":"")}>{stats.late}</span></button>
          <div className="metric"><span className="k">미완료</span><span className="v">{stats.open}</span></div>
        </div>
        <div className="tools">
          <input className="inp" placeholder="검색" value={q} onChange={(e)=>setQ(e.target.value)} style={{width:120}} />
          <select className="sel" value={fOwner} onChange={(e)=>setFOwner(e.target.value)}><option value="전체">담당자 전체</option>{owners.map((o)=><option key={o} value={o}>{o}</option>)}</select>
          <select className="sel" value={sortBy} onChange={(e)=>setSortBy(e.target.value)}><option value="due">마감일순</option><option value="pri">우선순위순</option><option value="upd">최근수정순</option></select>
          <span className="datefilt">
            <input type="date" className="sel" value={dateFrom} onChange={(e)=>setDateFrom(e.target.value)} title="시작 날짜" />
            <span style={{color:"var(--ink3)"}}>~</span>
            <input type="date" className="sel" value={dateTo} onChange={(e)=>setDateTo(e.target.value)} title="종료 날짜" />
            {(dateFrom||dateTo)&&<button className="chip" onClick={()=>{setDateFrom("");setDateTo("");}}>날짜 해제</button>}
          </span>
          <button className={"chip tog"+(onlyMine?" sel":"")} onClick={()=>setOnlyMine((v)=>!v)}>내 업무</button>
          <button className={"chip tog"+(onlyLate?" sel":"")} onClick={()=>setOnlyLate((v)=>!v)}>지연만</button>
          {allTags.length>0&&<select className="sel" value={fTag} onChange={(e)=>setFTag(e.target.value)}><option value="전체">태그 전체</option>{allTags.map((g)=><option key={g} value={g}>{g}</option>)}</select>}
          <span className="mdsep" />
          {(()=>{
            const pid=parentOf(fCh);
            if(pid){
              const par=data.channels.find((c)=>c.id===pid);
              return <>
                <button className="chip back" onClick={()=>setFCh("전체")}>← 전체</button>
                <button className={"chip"+(fCh===pid?" sel":"")} onClick={()=>setFCh(pid)}><b style={{background:par?.color||"#888"}} />{pid} 전체</button>
                {subsOf(pid).map((k)=><button key={k.id} className={"chip"+(fCh===k.id?" sel":"")} onClick={()=>setFCh(k.id)}><b style={{background:k.color}} />{k.id}</button>)}
              </>;
            }
            const kids=fCh!=="전체"?subsOf(fCh):[];
            if(kids.length){
              const par=data.channels.find((c)=>c.id===fCh);
              return <>
                <button className="chip back" onClick={()=>setFCh("전체")}>← 전체</button>
                <button className="chip sel"><b style={{background:par?.color||"#888"}} />{fCh} 전체</button>
                {kids.map((k)=><button key={k.id} className="chip" onClick={()=>setFCh(k.id)}><b style={{background:k.color}} />{k.id}</button>)}
              </>;
            }
            return <>
              <button className={"chip"+(fCh==="전체"?" sel":"")} onClick={()=>setFCh("전체")}>전체</button>
              {topChannels.map((c)=>{
                const has=subsOf(c.id).length;
                return <button key={c.id} className={"chip"+(fCh===c.id?" sel":"")} onClick={()=>setFCh(c.id)}>
                  <b style={{background:c.color}} />{c.id}{has>0&&<span style={{fontSize:10,opacity:.65}}>▸{has}</span>}
                </button>;
              })}
            </>;
          })()}
          <span className="spacer" />{canEdit&&<button className="btn" onClick={()=>openNew()}>업무 추가</button>}
        </div>
      </>)}

      {view==="board"&&(
        <div className="board">{cols.map((col)=>{const items=visible.filter((t)=>t.status===col.id);return(
          <div key={col.id} className="colwrap">
            <div className="colhead"><span>{col.label}</span><em>{items.length}</em></div>
            <div className={"colbody"+(overCol===col.id?" over":"")} onDragOver={(e)=>{if(dragId){e.preventDefault();setOverCol(col.id);}}} onDragLeave={()=>setOverCol((c)=>c===col.id?null:c)} onDrop={(e)=>{e.preventDefault();const t=data.tasks.find((x)=>x.id===dragId);if(t)moveTask(t,col.id);setDragId(null);setOverCol(null);}}>
              {items.length===0&&<div className="empty">{dragId?"여기로 놓기":col.id==="todo"?"업무를 추가해 시작하세요":"비어 있음"}</div>}
              {items.map(renderCard)}
              {canEdit&&<button className="addbtn" onClick={()=>openNew(col.id)}>+ 카드 추가</button>}
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
                <div style={{fontSize:14,fontWeight:800}}>반복 업무</div>
                <div style={{fontFamily:"monospace",fontSize:11,color:"#8F959C",marginTop:3}}>{riDate.replace(/-/g,".")} · {doneToday}/{totalToday}</div>
              </div>
              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                <input type="date" className="sel" value={riDate} onChange={(e)=>e.target.value&&setRiDate(e.target.value)} />
                <button className="btn ghost" onClick={()=>setRiDate(todayStr())}>오늘</button>
                {canEdit&&<button className="btn-save" onClick={()=>setRiAdd({cat:"",sub:"",title:""})}>+ 항목 추가</button>}
              </div>
            </div>
          </div>

          <div className="panel" style={{padding:14,marginBottom:12}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}} onClick={()=>setRiIssueOpen(!riIssueOpen)}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span className="richev">{riIssueOpen?"▾":"▸"}</span>
                <span style={{fontSize:14,fontWeight:800}}>이슈</span>
                <span className="ricount">{riIssues.filter((i)=>!i.resolved).length}건 미해결</span>
              </div>
            </div>
            {riIssueOpen&&(
              <div style={{marginTop:12}} onClick={(e)=>e.stopPropagation()}>
                <div style={{display:"flex",gap:7,marginBottom:10,flexWrap:"wrap"}}>
                  {[{id:"open",label:`미해결 ${riIssues.filter((i)=>!i.resolved).length}`},{id:"done",label:`해결 ${riIssues.filter((i)=>i.resolved).length}`},{id:"all",label:`전체 ${riIssues.length}`}].map((f)=>(
                    <button key={f.id} className={"chip"+(riIssueFilter===f.id?" sel":"")} onClick={()=>setRiIssueFilter(f.id)}>{f.label}</button>
                  ))}
                  <input className="inp" style={{flex:1,minWidth:140}} placeholder="이슈 검색 (내용·항목명)" value={riIssueQuery} onChange={(e)=>setRiIssueQuery(e.target.value)} />
                </div>
                {riIssues.filter((i)=>(riIssueFilter==="all"?true:riIssueFilter==="open"?!i.resolved:i.resolved)&&(!riIssueQuery.trim()||`${i.text} ${i.path}`.toLowerCase().includes(riIssueQuery.trim().toLowerCase()))).length===0&&<div className="hint" style={{marginBottom:10}}>해당하는 이슈가 없습니다</div>}
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
                      <button className="issck" onClick={()=>toggleRiIssue(i.itemId,i.id)}>{i.resolved?"✓":""}</button>
                      <div style={{flex:1,minWidth:0}}>
                        {editing
                          ? <textarea className="hinput" defaultValue={i.text} autoFocus style={{width:"100%"}}
                              onKeyDown={(e)=>{if(e.nativeEvent.isComposing||e.key!=="Enter"||e.shiftKey)return;e.preventDefault();editRiIssueText(i.itemId,i.id,e.target.value);setRiIssueEditId(null);}}
                              onBlur={(e)=>{editRiIssueText(i.itemId,i.id,e.target.value);setRiIssueEditId(null);}} />
                          : <div className="isstext" style={{whiteSpace:"pre-wrap"}}>{i.text}{i.edited&&<span style={{fontSize:10,color:"var(--ink3)"}}> (수정됨)</span>}</div>}
                        <div className="issmeta">{i.path} · {i.author} · {fmtTs(i.ts)}</div>
                      </div>
                      <button className="riedit" onClick={()=>setRiIssueExpand({...riIssueExpand,[i.id]:!expanded})}>{(i.subs||[]).length>0?`하위 ${(i.subs||[]).length}`:"+하위"}</button>
                      {canEdit&&!editing&&<button className="riedit" onClick={()=>setRiIssueEditId(i.id)}>수정</button>}
                      {canEdit&&<button className="riedit" onClick={()=>duplicateRiIssue(i.itemId,i)}>복사</button>}
                      {canEdit&&<button style={{background:"none",border:"none",color:"#8F959C",cursor:"pointer"}} onClick={()=>removeRiIssue(i.itemId,i.id)}>×</button>}
                    </div>
                    {expanded&&(
                      <div style={{marginTop:8,paddingLeft:33,borderTop:"1px solid var(--line)",paddingTop:8}}>
                        {(i.subs||[]).length===0&&<span className="hint">히스토리가 없습니다</span>}
                        {(i.subs||[]).map((s)=>(
                          <div key={s.id} className="cmt">
                            <div className="ch2"><b>{s.author}</b> · {fmtTs(s.ts)}{s.edited&&<span style={{color:"var(--ink3)"}}> (수정됨)</span>}</div>
                            {riIssueSubEditId===s.id
                              ? <div style={{display:"flex",gap:6,marginTop:4}}>
                                  <textarea className="hinput" defaultValue={s.text} autoFocus style={{flex:1}}
                                    onKeyDown={(e)=>{if(e.nativeEvent.isComposing||e.key!=="Enter"||e.shiftKey)return;e.preventDefault();editRiIssueSub(i.itemId,i.id,s.id,e.target.value);setRiIssueSubEditId(null);}}
                                    onBlur={(e)=>{editRiIssueSub(i.itemId,i.id,s.id,e.target.value);setRiIssueSubEditId(null);}} />
                                </div>
                              : <p>{s.text}</p>}
                            {canEdit&&riIssueSubEditId!==s.id&&<div style={{display:"flex",gap:10}}>
                              <button style={{background:"none",border:"none",color:"var(--ink3)",fontSize:11,cursor:"pointer",padding:0}} onClick={()=>setRiIssueSubEditId(s.id)}>수정</button>
                              <button style={{background:"none",border:"none",color:"var(--danger)",fontSize:11,cursor:"pointer",padding:0}} onClick={()=>removeRiIssueSub(i.itemId,i.id,s.id)}>삭제</button>
                            </div>}
                          </div>
                        ))}
                        {canEdit&&<div className="addrow">
                          <textarea className="hinput" placeholder="히스토리 입력 (Enter 전송, Shift+Enter 줄바꿈)"
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
                      <option value="">항목 선택</option>
                      {rItems.map((it)=><option key={it.id} value={it.id}>{it.cat} &gt; {it.sub} &gt; {it.title}</option>)}
                    </select>
                    <textarea className="hinput" style={{flex:1}} placeholder="이슈 입력 (Enter 추가, Shift+Enter 줄바꿈)" value={riIssueText} onChange={(e)=>setRiIssueText(e.target.value)}
                      onKeyDown={(e)=>{if(e.nativeEvent.isComposing||e.key!=="Enter"||e.shiftKey)return;e.preventDefault();if(!riIssueItem){alert("항목을 먼저 선택하세요.");return;}addRiIssue(riIssueItem,riIssueText);setRiIssueText("");}} />
                    <button className="btn-save" onClick={()=>{if(!riIssueItem){alert("항목을 먼저 선택하세요.");return;}if(!riIssueText.trim()){alert("이슈 내용을 입력하세요.");return;}addRiIssue(riIssueItem,riIssueText);setRiIssueText("");}}>추가</button>
                  </div>
                )}
              </div>
            )}
          </div>

          {riTree.length===0&&<div className="empty">등록된 항목이 없습니다. + 항목 추가로 시작하세요.</div>}

          {riTree.map((cat)=>{
            const catKey=`c:${cat.name}`;
            const catItems=cat.subs.flatMap((s)=>s.items);
            const catDone=catItems.filter((it)=>(it.checkins||{})[riDate]).length;
            const catOpen=!riCollapse[catKey];
            return (
              <div key={cat.name} className="ritop">
                <div className="rihead" onClick={()=>toggleCollapse(catKey)}>
                  <span className="richev">{catOpen?"▾":"▸"}</span>
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
                        <span className="richev sm">{subOpen?"▾":"▸"}</span>
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
                            <button className={"ckbox"+(checked?" on":"")} disabled={!canEdit} onClick={()=>toggleRi(it,riDate)}>{checked?"✓":""}</button>
                            <span style={{flex:1,fontSize:13.5,textDecoration:checked?"line-through":"none",color:checked?"var(--ink3)":"inherit"}}>{it.title}</span>
                            {(it.issues||[]).filter((i)=>!i.resolved).length>0&&<span style={{fontSize:11,color:"#C9372C",fontWeight:700}}>⚠ {(it.issues||[]).filter((i)=>!i.resolved).length}</span>}
                            {checked&&it.checkins[riDate].by&&<span style={{fontSize:11,color:"var(--ink3)"}}>{it.checkins[riDate].by}</span>}
                            {canEdit&&<button className="riedit" onClick={()=>{setRiQuickIssueId(riQuickIssueId===it.id?null:it.id);setRiQuickIssueText("");}}>이슈</button>}
                            {canEdit&&<button className="riedit" onClick={()=>duplicateRi(it)}>복사</button>}
                            {canEdit&&<button className="riedit" onClick={()=>setRiAdd({id:it.id,cat:it.cat,sub:it.sub,title:it.title})}>수정</button>}
                          </div>
                          {riQuickIssueId===it.id&&(
                            <div style={{display:"flex",gap:7,padding:"6px 16px 10px 52px"}}>
                              <textarea className="hinput" autoFocus placeholder="이슈 입력 (Enter 추가, Shift+Enter 줄바꿈)" value={riQuickIssueText} onChange={(e)=>setRiQuickIssueText(e.target.value)}
                                onKeyDown={(e)=>{if(e.nativeEvent.isComposing||e.key!=="Enter"||e.shiftKey)return;e.preventDefault();if(!riQuickIssueText.trim())return;addRiIssue(it.id,riQuickIssueText);setRiQuickIssueId(null);setRiQuickIssueText("");}} />
                              <button className="btn-save" onClick={()=>{if(!riQuickIssueText.trim())return;addRiIssue(it.id,riQuickIssueText);setRiQuickIssueId(null);setRiQuickIssueText("");}}>추가</button>
                              <button className="btn ghost" onClick={()=>setRiQuickIssueId(null)}>취소</button>
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
                <h3 style={{margin:0}}>월간 업무</h3>
                <p className="sub" style={{margin:"4px 0 0"}}>월별로 해야 할 항목을 관리합니다. 하위 항목을 넣을 수 있습니다.</p>
              </div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <input type="month" className="sel" value={mlyDate} onChange={(e)=>setMlyDate(e.target.value)} />
                {canEdit&&<button className="btn-save" onClick={()=>setMlyDraft({_new:true,id:uid(),month:mlyDate,title:"",desc:"",done:false,subs:[],history:[]})}>+ 추가</button>}
              </div>
            </div>
          </div>
          {mlyByMonth(mlyDate).length===0&&<div className="empty">{mlyDate} 항목이 없습니다. + 추가로 만들어보세요.</div>}
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {mlyByMonth(mlyDate).map((m)=>{
              const subs=m.subs||[];const subDone=subs.filter((s)=>s.done).length;
              return (
                <div key={m.id} style={{background:"var(--card)",borderRadius:10,boxShadow:"var(--sh)",padding:"13px 16px",opacity:m.done?.65:1}}>
                  <div style={{display:"flex",alignItems:"flex-start",gap:11}}>
                    <button className={"ckbox"+(m.done?" on":"")} disabled={!canEdit} onClick={()=>toggleMly(m)}>{m.done?"✓":""}</button>
                    <div style={{flex:1,minWidth:0,cursor:"pointer"}} onClick={()=>setMlyDraft({...m,subs:[...m.subs||[]],history:[...m.history||[]]})}>
                      <div style={{fontSize:15,fontWeight:700,textDecoration:m.done?"line-through":"none",color:m.done?"var(--ink3)":"inherit"}}>{m.title}</div>
                      {m.desc&&<div style={{fontSize:12.5,color:"var(--ink3)",marginTop:3}}>{m.desc}</div>}
                      {subs.length>0&&<div style={{fontSize:12,color:"var(--ink3)",marginTop:4,fontWeight:600}}>하위 {subDone}/{subs.length}</div>}
                    </div>
                    {canEdit&&<button className="riedit" onClick={()=>setMlyDraft({...m,subs:[...m.subs||[]],history:[...m.history||[]]})}>수정</button>}
                    {canEdit&&isAdmin&&<button className="riedit" style={{color:"var(--danger)"}} onClick={()=>{if(window.confirm(`"${m.title}" 항목을 삭제할까요?`))removeMly(m);}}>삭제</button>}
                  </div>
                  {(subs.length>0||canEdit)&&(
                    <div style={{marginTop:10,paddingTop:10,borderTop:"1px solid var(--line)",display:"flex",flexDirection:"column",gap:6,paddingLeft:35}}>
                      {subs.map((s)=>{
                        const subOpen=!!mlySubHistOpen[s.id];
                        const subsubOpen=!!mlySubsubOpen[s.id];
                        const subsubs=s.subsubs||[];
                        return (
                        <div key={s.id}>
                          <div style={{display:"flex",alignItems:"flex-start",gap:8}}>
                            <button className={"ckbox sm"+(s.done?" on":"")} disabled={!canEdit} style={{marginTop:2}} onClick={()=>toggleMlySub(m,s.id)}>{s.done?"✓":""}</button>
                            {mlySubEditId===s.id
                              ? <div style={{flex:1,display:"flex",gap:6}}>
                                  <textarea className="hinput" autoFocus style={{flex:1}} value={mlySubEditText} onChange={(e)=>setMlySubEditText(e.target.value)}
                                    onKeyDown={(e)=>{if(e.nativeEvent.isComposing||e.key!=="Enter"||e.shiftKey)return;e.preventDefault();editMlySubDirect(m.id,s.id,mlySubEditText);setMlySubEditId(null);}}
                                    onBlur={()=>{editMlySubDirect(m.id,s.id,mlySubEditText);setMlySubEditId(null);}} />
                                </div>
                              : <span style={{fontSize:13,textDecoration:s.done?"line-through":"none",color:s.done?"var(--ink3)":"inherit",flex:1,whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{s.text}</span>}
                            <button className="riedit" onClick={()=>setMlySubsubOpen({...mlySubsubOpen,[s.id]:!subsubOpen})}>{subsubs.length>0?`하위목록 ${subsubs.filter((x)=>x.done).length}/${subsubs.length}`:"+하위목록"}</button>
                            <button className="riedit" onClick={()=>setMlySubHistOpen({...mlySubHistOpen,[s.id]:!subOpen})}>{(s.history||[]).length>0?`히스토리 ${s.history.length}`:"+히스토리"}</button>
                            {canEdit&&mlySubEditId!==s.id&&<button className="riedit" onClick={()=>{setMlySubEditId(s.id);setMlySubEditText(s.text);}}>수정</button>}
                            {canEdit&&<button style={{background:"none",border:"none",color:"var(--ink3)",cursor:"pointer",fontSize:14,flexShrink:0}} onClick={()=>removeMlySubDirect(m.id,s.id)}>×</button>}
                          </div>
                          {subsubOpen&&(
                            <div style={{paddingLeft:31,marginTop:6,marginBottom:8}}>
                              {subsubs.length===0&&<span className="hint">하위 목록이 없습니다</span>}
                              {subsubs.map((x)=>(
                                <div key={x.id} style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                                  <button className={"ckbox sm"+(x.done?" on":"")} disabled={!canEdit} onClick={()=>toggleMlySubsubDirect(m.id,s.id,x.id)}>{x.done?"✓":""}</button>
                                  <span style={{fontSize:12.5,textDecoration:x.done?"line-through":"none",color:x.done?"var(--ink3)":"inherit",flex:1}}>{x.text}</span>
                                  {canEdit&&<button style={{background:"none",border:"none",color:"var(--ink3)",cursor:"pointer",fontSize:14}} onClick={()=>removeMlySubsubDirect(m.id,s.id,x.id)}>×</button>}
                                </div>
                              ))}
                              {canEdit&&<div className="addrow">
                                <input className="inp" placeholder="하위목록 항목 입력 후 Enter" onKeyDown={(e)=>{if(e.nativeEvent.isComposing||e.key!=="Enter")return;addMlySubsubDirect(m.id,s.id,e.target.value);e.target.value="";}} />
                              </div>}
                            </div>
                          )}
                          {subOpen&&(
                            <div style={{paddingLeft:31,marginTop:6,marginBottom:8}}>
                              {(s.history||[]).length===0&&<span className="hint">기록이 없습니다</span>}
                              {(s.history||[]).map((h)=>(
                                <div key={h.id} className="cmt">
                                  <div className="ch2"><b>{h.author}</b> · {fmtTs(h.ts)}{h.edited&&<span style={{color:"var(--ink3)"}}> (수정됨)</span>}</div>
                                  {mlySubHistEditId===h.id
                                    ? <textarea className="hinput" defaultValue={h.text} autoFocus style={{width:"100%",marginTop:4}}
                                        onKeyDown={(e)=>{if(e.nativeEvent.isComposing||e.key!=="Enter"||e.shiftKey)return;e.preventDefault();editMlySubHistoryDirect(m.id,s.id,h.id,e.target.value);setMlySubHistEditId(null);}}
                                        onBlur={(e)=>{editMlySubHistoryDirect(m.id,s.id,h.id,e.target.value);setMlySubHistEditId(null);}} />
                                    : <p>{h.text}</p>}
                                  {canEdit&&mlySubHistEditId!==h.id&&<div style={{display:"flex",gap:10}}>
                                    <button style={{background:"none",border:"none",color:"var(--ink3)",fontSize:11,cursor:"pointer",padding:0}} onClick={()=>setMlySubHistEditId(h.id)}>수정</button>
                                    <button style={{background:"none",border:"none",color:"var(--danger)",fontSize:11,cursor:"pointer",padding:0}} onClick={()=>removeMlySubHistoryDirect(m.id,s.id,h.id)}>삭제</button>
                                  </div>}
                                </div>
                              ))}
                              {canEdit&&<div className="addrow">
                                <textarea className="hinput" placeholder="히스토리 입력 (Enter 추가, Shift+Enter 줄바꿈)"
                                  value={mlySubHistText[s.id]||""} onChange={(e)=>setMlySubHistText({...mlySubHistText,[s.id]:e.target.value})}
                                  onKeyDown={(e)=>{if(e.nativeEvent.isComposing||e.key!=="Enter"||e.shiftKey)return;e.preventDefault();addMlySubHistoryDirect(m.id,s.id,mlySubHistText[s.id]||"");setMlySubHistText({...mlySubHistText,[s.id]:""});}} />
                              </div>}
                            </div>
                          )}
                        </div>
                        );
                      })}
                      {canEdit&&<div className="addrow" style={{marginTop:4}}>
                        <textarea className="hinput" placeholder="하위 항목 입력 (Enter 추가, Shift+Enter 줄바꿈)" onKeyDown={(e)=>{if(e.nativeEvent.isComposing||e.key!=="Enter"||e.shiftKey)return;e.preventDefault();addMlySubDirect(m.id,e.target.value);e.target.value="";}} />
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
                  {items.length===0&&<div className="ckempty">항목이 없습니다</div>}
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
                          <button className={"ckbox"+(c.done?" on":"")} disabled={!canEdit} onClick={()=>toggleCk(c)}>{c.done?"✓":""}</button>
                          <div style={{flex:1,minWidth:0,cursor:"pointer"}} onClick={()=>setCkDraft({...c,subs:c.subs?[...c.subs]:(isCL?[]:undefined)})}>
                            <div className={"cktitle"+(over?" red":"")}>{c.title}</div>
                            <div className={"ckmeta"+(over?" red":"")}>
                              {c.start&&<span>{c.start.slice(5).replace("-","월 ")}일</span>}
                              {(c.start&&c.due)&&<span>~</span>}
                              {c.due&&<span>{c.due.slice(5).replace("-","월 ")}일{over?` (${Math.abs(dd)}일 지남)`:""}</span>}
                              {!c.start&&!c.due&&<span style={{color:"var(--ink3)"}}>기한 없음</span>}
                              {isCL&&subs.length>0&&<span>· {subDone}/{subs.length}</span>}
                            </div>
                            <div className="ckunderline" />
                          </div>
                          {isCL&&subs.length>0&&<button className="ckexp" onClick={(e)=>{e.stopPropagation();setCkExpand({...ckExpand,[c.id]:!exp});}}>{exp?"▲":"▼"}</button>}
                          {isCL&&(c.subs||[]).some((s)=>s.done)&&<button className="riedit" onClick={(e)=>{e.stopPropagation();clearCkItem(c);}}>체크 해제</button>}
                          {canEdit&&<button className="riedit" onClick={(e)=>{e.stopPropagation();duplicateCk(c);}}>복사</button>}
                        </div>
                        {isCL&&exp&&subs.length>0&&(
                          <div className="cksubs">
                            {subs.map((s)=>(
                              <div key={s.id} className="cksub">
                                <button className={"ckbox sm"+(s.done?" on":"")} disabled={!canEdit} onClick={()=>toggleSub(c,s.id)}>{s.done?"✓":""}</button>
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
            <h3>AI 비서</h3>
            <p className="sub">보드·반복업무·체크리스트·이슈 데이터를 조회해서 답합니다. 데이터를 바꾸지는 못합니다.</p>
          </div>
          <div className="aichat">
            {aiMessages.length===0&&(
              <div className="aiempty">
                <p>예시로 이렇게 물어보세요</p>
                <div className="aisugg">
                  {["오늘 마감인 업무 뭐 있어?","김현민 담당 업무 진행중인 거 알려줘","반복업무 중에 오늘 체크 안 한 거 있어?","미해결 이슈 몇 개야?"].map((s)=>(
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
            {aiLoading&&<div className="aimsg ai"><div className="aibubble aithink">생각 중…</div></div>}
          </div>
          <div className="aiinput">
            <input placeholder="질문을 입력하세요" value={aiInput} onChange={(e)=>setAiInput(e.target.value)}
              onKeyDown={(e)=>{if(e.nativeEvent.isComposing||e.key!=="Enter")return;sendAiMessage();}} disabled={aiLoading} />
            <button className="btn-save" onClick={sendAiMessage} disabled={aiLoading||!aiInput.trim()}>전송</button>
          </div>
        </div>
      )}

      {view==="mindmap"&&(()=>{
        const BRANCH_COLORS=["#E8453C","#F7B731","#20BF55","#0C66E4","#8854D0","#FF6B6B","#2980B9","#E67E22"];
        const NODE_H=36,NODE_GAP=12,CHILD_INDENT=200;
        // 트리 레이아웃 계산
        const calcLayout=(node,depth,side,branchColor,parentX,parentY,colorIdx)=>{
          if(!node)return{items:[],height:0};
          const color=depth===0?"#1a1a2e":depth===1?(BRANCH_COLORS[colorIdx%BRANCH_COLORS.length]):branchColor;
          const items=[];
          if(node.collapsed||!(node.children||[]).length){
            items.push({node,depth,side,color,x:0,y:0,h:NODE_H,parentX,parentY});
            return{items,height:NODE_H};
          }
          const childResults=(node.children||[]).map((c,i)=>calcLayout(c,depth+1,side,color,0,0,colorIdx));
          const totalH=childResults.reduce((s,r)=>s+r.height,0)+NODE_GAP*(childResults.length-1);
          items.push({node,depth,side,color,x:0,y:0,h:NODE_H,parentX,parentY,totalChildH:totalH});
          let cy=0;
          childResults.forEach((r,i)=>{
            r.items.forEach((item)=>{items.push({...item,_dy:cy+(r.height/2),_cidx:i});});
            cy+=r.height+(i<childResults.length-1?NODE_GAP:0);
          });
          return{items,height:Math.max(NODE_H,totalH)};
        };

        const renderTree=()=>{
          if(!mmTree)return null;
          const svgPaths=[];const nodes=[];
          const rootW=120;
          // 좌우 분리
          const children=mmTree.children||[];
          const left=children.filter((_,i)=>i%2===1);
          const right=children.filter((_,i)=>i%2===0);
          const CX=600,CY=400;

          const renderSide=(sideNodes,side)=>{
            let cumY=0;
            const allItems=[];
            sideNodes.forEach((child,ci)=>{
              const colorIdx=children.indexOf(child);
              const res=calcLayout(child,1,side,null,0,0,colorIdx);
              res.items.forEach((item)=>{allItems.push({...item,_groupY:cumY,_groupH:res.height,_colorIdx:colorIdx});});
              cumY+=res.height+NODE_GAP*2;
            });
            const totalH=cumY;
            const startY=CY-totalH/2;
            allItems.forEach((item)=>{
              const gY=startY+item._groupY;
              const nodeY=gY+(item._dy!==undefined?item._dy:item.h/2);
              const nodeX=side==="right"?CX+rootW/2+CHILD_INDENT*(item.depth):CX-rootW/2-CHILD_INDENT*(item.depth);
              const branchColor=BRANCH_COLORS[item._colorIdx%BRANCH_COLORS.length];
              const w=item.depth===1?110:100;
              nodes.push({...item,x:nodeX,y:nodeY,w,branchColor});
              if(item.depth>0){
                const px=side==="right"?CX+rootW/2+CHILD_INDENT*(item.depth-1):CX-rootW/2-CHILD_INDENT*(item.depth-1);
                const py=item.depth===1?CY:item.parentY||nodeY;
                const mx=(nodeX+px)/2;
                const x1=side==="right"?px+w:px,x2=side==="right"?nodeX:nodeX+w;
                svgPaths.push(<path key={item.node.id+"l"} d={`M${x1},${py} C${mx},${py} ${mx},${nodeY} ${x2},${nodeY}`} stroke={branchColor} strokeWidth={item.depth===1?3:2} fill="none" opacity={0.85}/>);
              }
            });
          };
          renderSide(right,"right");
          renderSide(left,"left");

          return{svgPaths,nodes,rootW,CX,CY};
        };

        const layout=mmTree?renderTree():null;
        const svgW=1400,svgH=900;

        return(
        <div style={{display:"flex",gap:12,height:"calc(100vh - 130px)"}}>
          {/* 사이드바 */}
          <div style={{width:180,flexShrink:0,background:"var(--card)",borderRadius:10,boxShadow:"var(--sh)",padding:12,display:"flex",flexDirection:"column",gap:8,overflowY:"auto"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span style={{fontSize:13,fontWeight:800}}>마인드맵</span>
              {canEdit&&<button className="btn-save" style={{fontSize:11,padding:"3px 9px"}} onClick={()=>{
                const id=uid();const root=mmMakeNode("중심");
                setMmId(id);setMmTree(root);setMmSel(null);setMmEditId(null);
                mmSaveToDB(id,root,"새 마인드맵");
              }}>+ 새로</button>}
            </div>
            {mindmaps.length===0&&<span className="hint" style={{fontSize:12}}>맵이 없습니다</span>}
            {mindmaps.map((mm)=>(
              <div key={mm.id} onClick={()=>loadMm(mm)}
                style={{padding:"8px 10px",borderRadius:8,cursor:"pointer",background:mmId===mm.id?"#E9F2FF":"var(--bg)",border:mmId===mm.id?"1.5px solid #0C66E4":"1px solid var(--line)",fontSize:13}}>
                <div style={{fontWeight:mmId===mm.id?700:400,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{mm.title||"제목 없음"}</div>
                <div style={{fontSize:11,color:"var(--ink3)",marginTop:2}}>노드 {(()=>{const cnt=(t)=>1+((t&&t.children)||[]).reduce((s,c)=>s+cnt(c),0);return mm.tree?cnt(mm.tree):0;})()}개</div>
                {canEdit&&<div style={{display:"flex",gap:8,marginTop:4}}>
                  <button style={{background:"none",border:"none",color:"#0C66E4",fontSize:11,cursor:"pointer",padding:0}} onClick={(e)=>{e.stopPropagation();duplicateMm(mm);}}>복사</button>
                  <button style={{background:"none",border:"none",color:"var(--danger)",fontSize:11,cursor:"pointer",padding:0}} onClick={(e)=>{e.stopPropagation();if(window.confirm("삭제할까요?"))deleteMm(mm.id);}}>삭제</button>
                </div>}
              </div>
            ))}
          </div>
          {/* 캔버스 */}
          <div style={{flex:1,background:"#F8F9FC",borderRadius:10,boxShadow:"var(--sh)",position:"relative",overflow:"hidden"}}
            onMouseMove={(e)=>{if(mmPan){setMmScroll((s)=>({x:s.x+(e.clientX-mmPan.lx),y:s.y+(e.clientY-mmPan.ly)}));setMmPan({lx:e.clientX,ly:e.clientY});}}}
            onMouseUp={()=>setMmPan(null)}
            onMouseDown={(e)=>{if(e.target===e.currentTarget||e.target.tagName==="svg"||e.target.tagName==="path")setMmPan({lx:e.clientX,ly:e.clientY});}}
          >
            {!mmId&&<div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:"var(--ink3)",gap:8}}>
              <span style={{fontSize:40}}>🧠</span>
              <span style={{fontSize:14}}>왼쪽에서 마인드맵을 선택하거나 새로 만드세요</span>
            </div>}
            {/* 툴바 */}
            {mmId&&<div style={{position:"absolute",top:10,left:10,display:"flex",gap:6,zIndex:20}}>
              <button className="riedit" onClick={()=>{const t=prompt("맵 이름",mindmaps.find((m)=>m.id===mmId)?.title||"");if(t&&mmTree)mmSaveToDB(mmId,mmTree,t);}}>이름 변경</button>
              {mmSel&&mmSel!==mmTree?.id&&canEdit&&<>
                <button className="riedit" style={{color:"#0C66E4",borderColor:"#0C66E4"}} onClick={()=>{
                  const newNode=mmMakeNode("노드");
                  const next=mmUpdateNode(mmTree,mmSel,(n)=>({...n,children:[...(n.children||[]),newNode]}));
                  setMmTree(next);setMmEditId(newNode.id);mmSaveToDB(mmId,next);
                }}>+ 하위 노드</button>
                <button className="riedit" style={{color:"var(--danger)"}} onClick={()=>{
                  const next=mmDeleteNode(mmTree,mmSel);
                  setMmTree(next);setMmSel(null);mmSaveToDB(mmId,next);
                }}>노드 삭제</button>
              </>}
              {mmSel===mmTree?.id&&canEdit&&<button className="riedit" style={{color:"#0C66E4",borderColor:"#0C66E4"}} onClick={()=>{
                const newNode=mmMakeNode("노드");
                const next=mmUpdateNode(mmTree,mmSel,(n)=>({...n,children:[...(n.children||[]),newNode]}));
                setMmTree(next);setMmEditId(newNode.id);mmSaveToDB(mmId,next);
              }}>+ 노드 추가</button>}
              <button className="riedit" onClick={()=>setMmScroll({x:0,y:0})}>중앙으로</button>
            </div>}
            {/* SVG + 노드 */}
            {mmTree&&layout&&(
              <div style={{position:"absolute",left:mmScroll.x,top:mmScroll.y,width:svgW,height:svgH,transformOrigin:"0 0"}}>
                <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none"}}>{layout.svgPaths}</svg>
                {/* 루트 노드 */}
                <div style={{position:"absolute",left:layout.CX-60,top:layout.CY-20,width:120,height:40,background:"#1a1a2e",color:"#fff",borderRadius:20,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:900,cursor:"pointer",boxShadow:mmSel===mmTree.id?"0 0 0 3px #FFD700,0 4px 16px rgba(0,0,0,.3)":"0 4px 16px rgba(0,0,0,.2)",zIndex:5,userSelect:"none"}}
                  onClick={()=>setMmSel(mmTree.id)}
                  onDoubleClick={()=>setMmEditId(mmTree.id)}>
                  {mmEditId===mmTree.id
                    ?<input autoFocus defaultValue={mmTree.text} style={{background:"transparent",border:"none",outline:"none",color:"#fff",fontSize:14,fontWeight:900,width:"90%",textAlign:"center"}}
                        onBlur={(e)=>{const next=mmUpdateNode(mmTree,mmTree.id,(n)=>({...n,text:e.target.value.trim()||n.text}));setMmTree(next);setMmEditId(null);mmSaveToDB(mmId,next);}}
                        onKeyDown={(e)=>{if(e.key==="Enter"||e.key==="Escape")e.target.blur();}}/>
                    :<span>{mmTree.text}</span>}
                </div>
                {/* 하위 노드들 */}
                {layout.nodes.map(({node,x,y,w,depth,branchColor,side})=>(
                  <div key={node.id}
                    style={{position:"absolute",left:side==="right"?x:x-w,top:y-NODE_H/2,width:w,height:NODE_H,
                      background:depth===1?branchColor:"#fff",
                      color:depth===1?"#fff":"#1a1a2e",
                      borderRadius:depth===1?8:4,
                      borderBottom:depth>1?`3px solid ${branchColor}`:"none",
                      display:"flex",alignItems:"center",
                      justifyContent:depth===1?"center":"flex-start",
                      padding:depth===1?"0 10px":"0 6px",
                      fontSize:depth===1?13:12.5,fontWeight:depth===1?700:400,
                      cursor:"pointer",
                      boxShadow:mmSel===node.id?`0 0 0 2px #FFD700,0 2px 8px rgba(0,0,0,.15)`:depth===1?"0 2px 8px rgba(0,0,0,.15)":"none",
                      zIndex:mmSel===node.id?5:1,userSelect:"none",
                      overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}
                    onClick={(e)=>{e.stopPropagation();setMmSel(node.id);}}
                    onDoubleClick={(e)=>{e.stopPropagation();setMmEditId(node.id);}}
                  >
                    {/* 접기/펼치기 */}
                    {(node.children||[]).length>0&&(
                      <span style={{marginRight:4,fontSize:10,opacity:.7,cursor:"pointer",flexShrink:0}}
                        onClick={(e)=>{e.stopPropagation();const next=mmUpdateNode(mmTree,node.id,(n)=>({...n,collapsed:!n.collapsed}));setMmTree(next);mmSaveToDB(mmId,next);}}>
                        {node.collapsed?"▶":"▼"}
                      </span>
                    )}
                    {mmEditId===node.id
                      ?<input autoFocus defaultValue={node.text} style={{background:"transparent",border:"none",outline:"none",color:"inherit",fontSize:"inherit",fontWeight:"inherit",width:"100%"}}
                          onBlur={(e)=>{const next=mmUpdateNode(mmTree,node.id,(n)=>({...n,text:e.target.value.trim()||n.text}));setMmTree(next);setMmEditId(null);mmSaveToDB(mmId,next);}}
                          onKeyDown={(e)=>{if(e.key==="Enter"||e.key==="Escape")e.target.blur();}}/>
                      :<span style={{overflow:"hidden",textOverflow:"ellipsis"}}>{node.text}</span>}
                  </div>
                ))}
              </div>
            )}
            <div style={{position:"absolute",bottom:10,right:10,fontSize:11,color:"var(--ink3)"}}>드래그: 캔버스 이동 · 더블클릭: 텍스트 편집 · 노드 선택 후 툴바에서 하위 추가</div>
          </div>
        </div>
        );
      })()}

      {view==="ref"&&(
        <div>
          {/* 툴바 */}
          <div className="panel" style={{marginBottom:12,padding:"12px 16px"}}>
            <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
              <input className="inp" style={{flex:1,minWidth:160}} placeholder="검색..." value={refQuery} onChange={(e)=>setRefQuery(e.target.value)} />
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {["전체","즐겨찾기",...refCats].map((c)=>(
                  <button key={c} onClick={()=>setRefCatFilter(c)}
                    style={{padding:"5px 12px",borderRadius:20,border:"1.5px solid",fontSize:12,fontWeight:700,cursor:"pointer",
                      borderColor:refCatFilter===c?"#0C66E4":"var(--line)",
                      background:refCatFilter===c?"#0C66E4":"var(--bg)",
                      color:refCatFilter===c?"#fff":"var(--ink2)"}}>
                    {c==="즐겨찾기"?"⭐ "+c:c}
                  </button>
                ))}
                <button onClick={()=>setRefCatEdit(!refCatEdit)} style={{padding:"5px 10px",borderRadius:20,border:"1.5px solid var(--line)",fontSize:12,background:"var(--bg)",cursor:"pointer"}}>⚙ 분류</button>
              </div>
              {canEdit&&<button className="btn-save" onClick={()=>{setRefDraft({title:"",cat:refCats[0]||"",memo:"",images:[],fav:false});setRefAddOpen(true);}}>+ 추가</button>}
            </div>
            {/* 분류 관리 */}
            {refCatEdit&&(
              <div style={{marginTop:12,padding:12,background:"var(--bg)",borderRadius:8,display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
                {refCats.map((c)=>(
                  <span key={c} style={{display:"inline-flex",alignItems:"center",gap:4,background:"var(--card)",border:"1px solid var(--line)",borderRadius:16,padding:"3px 10px",fontSize:12}}>
                    {c}
                    {canEdit&&<button onClick={()=>deleteRefCat(c)} style={{background:"none",border:"none",color:"var(--danger)",cursor:"pointer",fontSize:13,padding:0,lineHeight:1}}>×</button>}
                  </span>
                ))}
                {canEdit&&<div style={{display:"flex",gap:6}}>
                  <input className="inp" style={{width:100,padding:"4px 8px",fontSize:12}} placeholder="새 분류" value={refNewCat} onChange={(e)=>setRefNewCat(e.target.value)}
                    onKeyDown={(e)=>{if(e.key==="Enter"&&refNewCat.trim()){addRefCat(refNewCat);setRefNewCat("");}}} />
                  <button className="btn ghost" style={{fontSize:12,padding:"4px 10px"}} onClick={()=>{addRefCat(refNewCat);setRefNewCat("");}}>추가</button>
                </div>}
              </div>
            )}
          </div>
          {/* 붙여넣기 존 */}
          {canEdit&&(
            <div className={"refpaste"+(refPasteActive?" active":"")} style={{marginBottom:14}}
              tabIndex={0}
              onPaste={async(e)=>{
                const items=Array.from(e.clipboardData.items||[]);
                const imgItem=items.find((i)=>i.type.startsWith("image/"));
                if(!imgItem)return;e.preventDefault();
                const src=await resizeImage(imgItem.getAsFile(),1200,1200,0.85);
                setRefDraft({title:"",cat:refCats[0]||"",memo:"",images:[{id:uid(),src}],fav:false});
                setRefAddOpen(true);
              }}
              onDragOver={(e)=>{e.preventDefault();setRefPasteActive(true);}}
              onDragLeave={()=>setRefPasteActive(false)}
              onDrop={async(e)=>{e.preventDefault();setRefPasteActive(false);const files=Array.from(e.dataTransfer.files).filter((f)=>f.type.startsWith("image/"));if(!files.length)return;const src=await resizeImage(files[0],1200,1200,0.85);setRefDraft({title:"",cat:refCats[0]||"",memo:"",images:[{id:uid(),src}],fav:false});setRefAddOpen(true);}}>
              📋 여기에 이미지를 <b>Ctrl+V</b> 붙여넣거나 <b>드래그</b>해서 바로 추가하세요
            </div>
          )}
          {/* 그리드 */}
          <div className="refgrid">
            {refFiltered.length===0&&<div style={{gridColumn:"1/-1",textAlign:"center",padding:40,color:"var(--ink3)"}}>래퍼런스가 없습니다</div>}
            {refFiltered.map((r)=>(
              <div key={r.id} className={"refcard"+(r.fav?" fav":"")} onClick={()=>r.images?.[0]&&setLightbox(r.images[0].src)}>
                {r.images?.[0]
                  ?<img src={r.images[0].src} alt={r.title} />
                  :<div style={{height:140,background:"var(--bg)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:32}}>🖼</div>}
                <div className="refbody">
                  {r.cat&&<div className="refcat">{r.cat}</div>}
                  <div className="reftitle">{r.title||"제목 없음"}</div>
                  {r.memo&&<div className="refmemo">{r.memo}</div>}
                  <div className="reffoot">
                    <span>{new Date(r.createdAt).toLocaleDateString("ko-KR",{month:"numeric",day:"numeric"})}</span>
                    <div style={{display:"flex",gap:8}} onClick={(e)=>e.stopPropagation()}>
                      <button style={{background:"none",border:"none",cursor:"pointer",fontSize:16}} onClick={()=>updateRef(r.id,{fav:!r.fav})} title="즐겨찾기">{r.fav?"⭐":"☆"}</button>
                      {canEdit&&<button style={{background:"none",border:"none",cursor:"pointer",fontSize:13,color:"#0C66E4"}} onClick={()=>{setRefDraft({...r,images:[...(r.images||[])]});setRefAddOpen(true);}}>수정</button>}
                      {canEdit&&<button style={{background:"none",border:"none",cursor:"pointer",fontSize:13,color:"var(--danger)"}} onClick={()=>{if(window.confirm("삭제할까요?"))deleteRef(r.id);}}>삭제</button>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 추가/수정 모달 */}
          {refAddOpen&&refDraft&&(
            <div className="modal-bg" onClick={()=>setRefAddOpen(false)}>
              <div className="modal" style={{maxWidth:520}} onClick={(e)=>e.stopPropagation()}>
                <div className="modal-head"><h3>{refDraft.id?"래퍼런스 수정":"래퍼런스 추가"}</h3><button className="x" onClick={()=>setRefAddOpen(false)}>×</button></div>
                <div className="modal-body">
                  {/* 이미지 업로드 */}
                  <div style={{marginBottom:14}}>
                    <label style={{fontSize:12,fontWeight:700,color:"var(--ink3)",display:"block",marginBottom:6}}>이미지</label>
                    <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:8}}>
                      {(refDraft.images||[]).map((img)=>(
                        <div key={img.id} style={{position:"relative"}}>
                          <img src={img.src} alt="" style={{width:90,height:70,objectFit:"cover",borderRadius:7,cursor:"pointer",border:"1px solid var(--line)"}} onClick={()=>setLightbox(img.src)} />
                          <button onClick={()=>setRefDraft({...refDraft,images:refDraft.images.filter((x)=>x.id!==img.id)})}
                            style={{position:"absolute",top:2,right:2,background:"rgba(0,0,0,.6)",color:"#fff",border:"none",borderRadius:"50%",width:18,height:18,cursor:"pointer",fontSize:11,padding:0}}>×</button>
                        </div>
                      ))}
                    </div>
                    <div style={{display:"flex",gap:8}}>
                      <label style={{cursor:"pointer",fontSize:12,color:"#0C66E4",fontWeight:700,border:"1px solid #0C66E4",borderRadius:6,padding:"5px 12px"}}>
                        📁 파일 업로드
                        <input type="file" accept="image/*" multiple style={{display:"none"}} onChange={(e)=>handleRefImages(e.target.files)} />
                      </label>
                      <div className="refpaste" style={{flex:1,padding:"8px 12px",fontSize:12}}
                        tabIndex={0}
                        onPaste={async(e)=>{const items=Array.from(e.clipboardData.items||[]);const imgItem=items.find((i)=>i.type.startsWith("image/"));if(!imgItem)return;e.preventDefault();const src=await resizeImage(imgItem.getAsFile(),1200,1200,0.85);setRefDraft((d)=>({...d,images:[...(d.images||[]),{id:uid(),src}]}));}}
                        >Ctrl+V 붙여넣기</div>
                    </div>
                  </div>
                  <div className="fld" style={{marginBottom:10}}><label>제목</label><input value={refDraft.title||""} onChange={(e)=>setRefDraft({...refDraft,title:e.target.value})} placeholder="래퍼런스 제목" /></div>
                  <div className="fld" style={{marginBottom:10}}><label>분류</label>
                    <select value={refDraft.cat||""} onChange={(e)=>setRefDraft({...refDraft,cat:e.target.value})}>
                      <option value="">분류 없음</option>
                      {refCats.map((c)=><option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="fld" style={{marginBottom:10}}><label>메모</label><textarea value={refDraft.memo||""} onChange={(e)=>setRefDraft({...refDraft,memo:e.target.value})} placeholder="출처, 참고사항, 활용 아이디어..." style={{height:80}} /></div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <input type="checkbox" id="refFav" checked={!!refDraft.fav} onChange={(e)=>setRefDraft({...refDraft,fav:e.target.checked})} style={{width:"auto"}} />
                    <label htmlFor="refFav" style={{fontSize:13,cursor:"pointer"}}>⭐ 즐겨찾기</label>
                  </div>
                </div>
                <div className="modal-foot">
                  <span className="spacer" />
                  <button className="btn ghost" onClick={()=>setRefAddOpen(false)}>취소</button>
                  <button className="btn-save" onClick={()=>{
                    if(refDraft.id){updateRef(refDraft.id,refDraft);}
                    else{addRef(refDraft);}
                    setRefAddOpen(false);setRefDraft(null);
                  }}>저장</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {view==="memo"&&(
        <div>
          <div className="panel" style={{padding:14,marginBottom:12}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
              <div style={{fontSize:14,fontWeight:800}}>메모</div>
              {canEdit&&<button className="btn-save" onClick={()=>setMemoDraft({cat:"",sub:"",title:"",text:""})}>+ 메모 추가</button>}
            </div>
            <div style={{display:"flex",gap:7,marginTop:12,flexWrap:"wrap"}}>
              <input className="inp" style={{flex:1,minWidth:160}} placeholder="검색 (분류·제목·내용·하위항목)" value={memoQuery} onChange={(e)=>setMemoQuery(e.target.value)} />
              <select className="sel" value={memoCatFilter} onChange={(e)=>setMemoCatFilter(e.target.value)}>
                {memoCatOptions.map((c)=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {memoFiltered.length===0&&<div className="empty">{memoQuery||memoCatFilter!=="전체"?"조건에 맞는 메모가 없습니다":"메모가 없습니다. + 메모 추가로 시작하세요."}</div>}

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
                      <button className="riedit" onClick={()=>setMemoExpand({...memoExpand,[m.id]:!expanded})}>{(m.subs||[]).length>0?`하위 ${(m.subs||[]).length}`:"+하위"}</button>
                      {canEdit&&<button className="riedit" onClick={()=>duplicateMemo(m)}>복사</button>}
                      {canEdit&&<button className="riedit" onClick={()=>setMemoDraft({...m,subs:[...(m.subs||[])]})}>수정</button>}
                    </div>
                  </div>
                  {expanded&&(
                    <div className="memosubs">
                      {(m.subs||[]).length===0&&<span className="hint">하위 항목이 없습니다</span>}
                      {(m.subs||[]).map((s)=>(
                        <div key={s.id} className="cmt">
                          <div className="ch2"><b>{s.author}</b> · {fmtTs(s.ts)}{s.edited&&<span style={{color:"var(--ink3)"}}> (수정됨)</span>}</div>
                          {memoSubEditId===s.id
                            ? <textarea className="hinput" defaultValue={s.text} autoFocus style={{width:"100%",marginTop:4}}
                                onKeyDown={(e)=>{if(e.nativeEvent.isComposing||e.key!=="Enter"||e.shiftKey)return;e.preventDefault();editMemoSub(m.id,s.id,e.target.value);setMemoSubEditId(null);}}
                                onBlur={(e)=>{editMemoSub(m.id,s.id,e.target.value);setMemoSubEditId(null);}} />
                            : <p>{s.text}</p>}
                          {canEdit&&memoSubEditId!==s.id&&<div style={{display:"flex",gap:10}}>
                            <button style={{background:"none",border:"none",color:"var(--ink3)",fontSize:11,cursor:"pointer",padding:0}} onClick={()=>setMemoSubEditId(s.id)}>수정</button>
                            <button style={{background:"none",border:"none",color:"var(--danger)",fontSize:11,cursor:"pointer",padding:0}} onClick={()=>removeMemoSub(m.id,s.id)}>삭제</button>
                          </div>}
                        </div>
                      ))}
                      {canEdit&&<div className="addrow">
                        <textarea className="hinput" placeholder="하위 항목 입력 (Enter 추가, Shift+Enter 줄바꿈)"
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
          <div className="panel"><h3>이슈 모아보기</h3>
            <p className="sub">반복 업무와 일반 업무에서 등록된 이슈가 전부 모입니다. 이슈를 클릭하면 히스토리를 기록할 수 있습니다.</p>
            <div style={{display:"flex",gap:7}}>
              {[{id:"all",label:`전체 ${allIssues.length}`},{id:"done",label:`해결 ${allIssues.filter((i)=>i.resolved).length}`},{id:"open",label:`미해결 ${allIssues.filter((i)=>!i.resolved).length}`}].map((f)=>(
                <button key={f.id} className={"chip"+(issueFilter===f.id?" sel":"")} onClick={()=>setIssueFilter(f.id)}>{f.label}</button>
              ))}
            </div>
          </div>
          {(()=>{
            const list=allIssues.filter((i)=>issueFilter==="all"?true:issueFilter==="open"?!i.resolved:i.resolved);
            if(!list.length)return <div className="empty">해당하는 이슈가 없습니다</div>;
            const toggleAny=(i)=>{
              if(i.routineId)toggleIssue(i.routineId,i.id);
              else commit((d)=>({...d,tasks:d.tasks.map((t)=>t.id===i.taskId?{...t,issues:(t.issues||[]).map((x)=>x.id===i.id?{...x,resolved:!x.resolved,resolvedBy:me}:x),updatedAt:Date.now()}:t)}),[]);
            };
            return list.map((i)=>(
              <div key={i.id} className={"issrow"+(i.resolved?" done":"")}>
                <div style={{flex:1,minWidth:0,cursor:"pointer"}} onClick={()=>setIssueDetail(i)}>
                  <div className="isstext">{i.text}{(i.history||[]).length>0&&<span style={{fontSize:11,color:"var(--pri)",marginLeft:6,fontWeight:700}}>💬{(i.history||[]).length}</span>}</div>
                  <div className="issmeta"><b style={{color:i.src==="업무"?"#0055CC":"#1F845A"}}>{i.src}</b> · {i.routineTitle} · {i.author} · {fmtTs(i.ts)}{i.owner&&` · 담당 ${i.owner}`}</div>
                </div>
                <button className={"issbtn"+(i.resolved?"":" active")} onClick={()=>toggleAny(i)}>{i.resolved?"해결됨 ✓":"미해결"}</button>
                {!i.routineId&&<button className="btn ghost" onClick={()=>{
                  const t=data.tasks.find((x)=>x.id===i.taskId);if(t){setView("board");openTask(t);}
                }}>이동</button>}
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
            [mkLog("셀 수정",t,`${k} → ${v}`)]);
        };
        const groups=grpBy==="status"
          ? cols.map((c)=>({key:c.id,label:c.label,color:STCOL[c.id],items:mdVisible.filter((t)=>t.status===c.id)}))
          : data.channels.map((c)=>({key:c.id,label:c.id,color:c.color,items:mdVisible.filter((t)=>t.channel===c.id)})).filter((g)=>g.items.length>0);
        return (
        <div>
          <div className="mdtoolbar">
            <button className="btn" onClick={()=>openNew()}>+ 새로운 태스크</button>
            <span style={{width:12}} />
            <input className="inp" placeholder="검색" value={q} onChange={(e)=>setQ(e.target.value)} style={{width:140}} />
            <span className="mdsep" />
            <span className="mdlbl">그룹</span>
            <select className="sel" value={grpBy} onChange={(e)=>setGrpBy(e.target.value)}>
              <option value="status">상태별</option>
              <option value="channel">채널별</option>
            </select>
            <span className="mdsep" />
            <select className="sel" value={fOwner} onChange={(e)=>setFOwner(e.target.value)}>
              <option value="전체">담당자 전체</option>
              {owners.map((o)=><option key={o} value={o}>{o}</option>)}
            </select>
            <span className="mdsep" />
            <span className="mdlbl">마감</span>
            <input type="date" className="sel" value={listDateFrom} onChange={(e)=>setListDateFrom(e.target.value)} />
            <span style={{color:"var(--ink3)"}}>~</span>
            <input type="date" className="sel" value={listDateTo} onChange={(e)=>setListDateTo(e.target.value)} />
            {(listDateFrom||listDateTo)&&<button className="chip" onClick={()=>{setListDateFrom("");setListDateTo("");}}>해제</button>}
            <span className="spacer" />
            <span className="mdlbl">{mdVisible.length}건</span>
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
                <span className="mdarrow" style={{color:g.color}}>{open?"▾":"▸"}</span>
                <span className="mdgtitle" style={{color:g.color}}>{g.label}</span>
                <span className="mdgcount">{items.length}</span>
              </button>
              {open&&(
                <div className="mdtblwrap" style={{"--gc":g.color}}>
                  <table className="mdtbl">
                    <thead>
                      <tr>
                        <th className="mdspine" />
                        <th style={{minWidth:220}}>태스크</th>
                        <th style={{width:110}}>소유자</th>
                        <th style={{width:130}}>상태</th>
                        <th style={{width:130}}>마감일</th>
                        <th style={{width:120}}>우선순위</th>
                        <th style={{width:120}}>진행률</th>
                        <th style={{minWidth:150}}>메모</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.length===0&&<tr><td className="mdspine" /><td colSpan={7} className="mdempty">항목이 없습니다</td></tr>}
                      {items.map((t)=>{
                        const d=dayDiff(t.due),late=d!==null&&d<0&&t.status!=="done";
                        return (
                        <tr key={t.id}>
                          <td className="mdspine" />
                          <td className="mdname">
                            <input defaultValue={t.title} disabled={!canEdit}
                              onBlur={(e)=>{const v=e.target.value.trim();if(v&&v!==t.title)patch(t,"title",v);}}
                              onKeyDown={(e)=>{if(e.nativeEvent.isComposing)return;if(e.key==="Enter")e.target.blur();}} />
                            <button className="mdopen" onClick={()=>openTask(t)} title="상세 열기">⤢</button>
                          </td>
                          <td>
                            <select className="mdplain" value={t.owner||""} disabled={!canEdit}
                              onChange={(e)=>patch(t,"owner",e.target.value)}>
                              <option value="">—</option>
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
                              {late&&<span className="mdwarn" title={`${Math.abs(d)}일 지연`}>!</span>}
                              {t.status==="done"&&<span className="mdok">✓</span>}
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
                            <input className="mdplain" defaultValue={t.memo||""} placeholder="—" disabled={!canEdit}
                              onBlur={(e)=>{const v=e.target.value;if(v!==(t.memo||""))patch(t,"memo",v);}}
                              onKeyDown={(e)=>{if(e.nativeEvent.isComposing)return;if(e.key==="Enter")e.target.blur();}} />
                          </td>
                        </tr>
                      );})}
                      {canEdit&&(
                        <tr className="mdaddrow">
                          <td className="mdspine" />
                          <td colSpan={7}>
                            <button className="mdadd" onClick={()=>openNew(grpBy==="status"?g.key:"todo")}>+ 태스크 추가</button>
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
                          {dues.length>0&&<span className="mdrange">{dues[0].slice(5).replace("-","월 ")}일 – {dues[dues.length-1].slice(5).replace("-","월 ")}일</span>}
                        </td>
                        <td>
                          {prCount.length>0&&<div className="mdstack">
                            {prCount.map((p)=><i key={p.id} title={`${p.label} ${p.n}`} style={{background:p.color,flex:p.n}} />)}
                          </div>}
                        </td>
                        <td><span className="mdrange">평균 {avgPg}%</span></td>
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
        <div className="panel"><h3>완료 업무 보관함</h3><p className="sub">보드에서 치운 업무입니다. 되돌리면 다시 보드로 올라옵니다.</p>
          <div style={{display:"flex",gap:7}}>{canEdit&&<button className="btn ghost" onClick={()=>setConfirmBox({kind:"archiveDone"})}>완료 {live.filter((t)=>t.status==="done").length}건 보관하기</button>}{isAdmin&&archived.length>0&&<button className="btn warn" onClick={()=>setConfirmBox({kind:"purge"})}>보관함 영구 삭제</button>}</div>
        </div>
        <table className="tbl"><thead><tr><th>채널</th><th>업무명</th><th>담당</th><th>완료</th><th></th></tr></thead>
          <tbody>
            {archived.length===0&&<tr><td colSpan={5} style={{textAlign:"center",color:"#8F959C",padding:20,fontSize:12}}>보관된 업무가 없습니다</td></tr>}
            {archived.slice().sort((a,b)=>(b.doneAt||0)-(a.doneAt||0)).map((t)=>(
              <tr key={t.id}><td><span className="chdot m"><b style={{background:chColor(t.channel)}} />{t.channel}</span></td><td style={{fontWeight:600,color:"#565C64"}}>{t.title}</td><td className="m">{t.owner||"—"}</td><td className="m">{t.doneAt?fmtTs(t.doneAt):"—"}</td><td style={{textAlign:"right"}}>{canEdit&&<button className="btn ghost" onClick={()=>setArchivedFlag(t,false)}>되돌리기</button>}</td></tr>
            ))}
          </tbody>
        </table>
      </>)}

      {view==="log"&&(
        <div><div className="panel"><h3>변경 이력</h3><p className="sub">최근 {LOG_CAP}건까지 남습니다.</p></div>
          {(data.log||[]).length===0&&<div className="empty">기록이 없습니다</div>}
          {(data.log||[]).map((e)=><div key={e.id} className="logrow"><span className="t">{fmtTs(e.ts)}</span><span className="w">{e.who}</span><span><b style={{fontWeight:600}}>{e.action}</b>{e.taskTitle&&<span style={{color:"#565C64"}}> · {e.taskTitle}</span>}{e.detail&&<span style={{fontSize:10.5,color:"#8F959C"}}> — {e.detail}</span>}</span></div>)}
        </div>
      )}

      {view==="cafe24"&&(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {/* 인증 */}
          <div className="panel">
            <h3 style={{marginBottom:12}}>🔐 카페24 인증</h3>
            {c24TokenValid()
              ?<div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                  <span style={{color:"var(--ok)",fontWeight:700,fontSize:13}}>✅ 인증됨 · {Math.round((c24Expiry-Date.now())/60000)}분 후 만료 (자동 갱신됨)</span>
                  <button className="btn ghost" onClick={()=>{setC24Token('');setC24Expiry(0);setC24RefreshToken('');localStorage.removeItem('c24_token');localStorage.removeItem('c24_expiry');localStorage.removeItem('c24_refresh_token');c24AddLog('🔓 로그아웃');}}>로그아웃</button>
                </div>
              :<div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  <button className="btn-save" onClick={c24StartOAuth}>카페24 로그인 &amp; 권한 허용</button>
                  <button className="btn ghost" onClick={c24ManualToken}>토큰 직접 입력</button>
                  <span style={{fontSize:12,color:"var(--ink3)",alignSelf:"center"}}>* slowrocket.cafe24.com 관리자 계정 필요</span>
                </div>}
          </div>
          {/* 상품 검색 */}
          <div className="panel">
            <h3 style={{marginBottom:12}}>🛍 상품 검색</h3>
            <div style={{display:"flex",gap:10,marginBottom:10}}>
              <div className="fld" style={{flex:1}}><label>상품코드</label><input value={c24ProductCode} onChange={(e)=>setC24ProductCode(e.target.value)} placeholder="예: P0000BBC" onKeyDown={(e)=>{if(e.key==="Enter")c24SearchProduct();}} /></div>
              <div className="fld" style={{justifyContent:"flex-end"}}><button className="btn-save" onClick={c24SearchProduct} disabled={c24SearchLoading}>{c24SearchLoading?"검색 중...":"🔍 검색"}</button></div>
            </div>
            {c24SearchResult.map((p)=>(
              <div key={p.product_no} onClick={()=>{setC24SelProduct({no:p.product_no,name:p.product_name,selling:p.selling,display:p.display});c24AddLog(`📦 선택: #${p.product_no} ${p.product_name}`);}}
                style={{border:`1.5px solid ${c24SelProduct?.no===p.product_no?"#0C66E4":"var(--line)"}`,borderRadius:8,padding:"10px 14px",marginBottom:8,cursor:"pointer",background:c24SelProduct?.no===p.product_no?"#E9F2FF":"var(--bg)",display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:13}}>
                <div>
                  <b>#{p.product_no}</b> · {p.product_name}
                  <span style={{marginLeft:8,fontSize:11,fontWeight:700,color:p.selling==="T"?"var(--ok)":"var(--danger)"}}>{p.selling==="T"?"판매중":"판매중지"}</span>
                  <span style={{marginLeft:6,fontSize:11,color:"var(--ink3)"}}>{p.display==="T"?"진열중":"미진열"}</span>
                </div>
                {c24SelProduct?.no===p.product_no&&<span style={{fontSize:12,color:"#0C66E4",fontWeight:700}}>✔ 선택됨</span>}
              </div>
            ))}
          </div>
          {/* 스케줄 등록 */}
          <div className="panel">
            <h3 style={{marginBottom:12}}>📅 스케줄 등록
              {c24SelProduct&&<span style={{fontSize:12,fontWeight:400,color:"#0C66E4",marginLeft:8}}>#{c24SelProduct.no} {c24SelProduct.name}</span>}
            </h3>
            <div className="r3" style={{marginBottom:10}}>
              <div className="fld"><label>오픈 일시</label><input type="datetime-local" value={c24OpenAt} onChange={(e)=>setC24OpenAt(e.target.value)} /></div>
              <div className="fld"><label>종료 일시</label><input type="datetime-local" value={c24CloseAt} onChange={(e)=>setC24CloseAt(e.target.value)} /></div>
              <div className="fld"><label>종료 시 처리</label>
                <select value={c24CloseAction} onChange={(e)=>setC24CloseAction(e.target.value)}>
                  <option value="soldout">품절처리 (판매중지)</option>
                  <option value="hide">진열+판매 중지</option>
                  <option value="selling_off">판매만 중지</option>
                </select>
              </div>
            </div>
            <div className="r3" style={{marginBottom:14}}>
              <div className="fld"><label>오픈 시 판매상태</label>
                <select value={c24OpenSelling} onChange={(e)=>setC24OpenSelling(e.target.value)}>
                  <option value="T">판매함</option>
                  <option value="F">판매안함</option>
                </select>
              </div>
              <div className="fld"><label>오픈 시 진열상태</label>
                <select value={c24OpenDisplay} onChange={(e)=>setC24OpenDisplay(e.target.value)}>
                  <option value="T">진열함</option>
                  <option value="F">진열안함</option>
                </select>
              </div>
              <div className="fld" style={{justifyContent:"flex-end"}}>
                <button className="btn-save" onClick={c24AddSchedule}>+ 스케줄 등록</button>
              </div>
            </div>
          </div>
          {/* 스케줄 대시보드 */}
          <div className="panel">
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
              <h3>📋 스케줄 현황 <span style={{fontSize:12,color:"var(--ink3)",fontWeight:400}}>({c24Schedules.length}건)</span></h3>
              <div style={{display:"flex",gap:8,fontSize:12}}>
                <span style={{background:"#F4F5F7",padding:"3px 10px",borderRadius:20,color:"var(--ink3)",fontWeight:700}}>⏳ 대기 {c24Schedules.filter((s)=>!s.openDone&&!s.error).length}</span>
                <span style={{background:"#E9F2FF",padding:"3px 10px",borderRadius:20,color:"#0C66E4",fontWeight:700}}>🟢 진행중 {c24Schedules.filter((s)=>s.openDone&&!s.closeDone&&!s.error).length}</span>
                <span style={{background:"#DCFFF1",padding:"3px 10px",borderRadius:20,color:"#1F845A",fontWeight:700}}>✅ 완료 {c24Schedules.filter((s)=>s.openDone&&s.closeDone).length}</span>
                {c24Schedules.filter((s)=>s.error).length>0&&<span style={{background:"#FFECEB",padding:"3px 10px",borderRadius:20,color:"#CA3521",fontWeight:700}}>❌ 오류 {c24Schedules.filter((s)=>s.error).length}</span>}
              </div>
            </div>
            {c24Schedules.length===0&&<div className="hint" style={{textAlign:"center",padding:32}}>등록된 스케줄이 없습니다</div>}
            {c24Schedules.length>0&&(()=>{
              const now=new Date();
              const actionLabel={soldout:"품절처리",hide:"진열+판매중지",selling_off:"판매중지"};
              const fmtDt=(dt)=>dt?new Date(dt).toLocaleString("ko-KR",{month:"numeric",day:"numeric",weekday:"short",hour:"2-digit",minute:"2-digit"}):"";
              const getPhase=(s)=>{
                if(s.error)return"error";
                if(s.openDone&&s.closeDone)return"done";
                if(s.openDone&&!s.closeDone)return"running";
                if(s.openAt&&new Date(s.openAt)>now)return"waiting";
                return"waiting";
              };
              const phaseStyle={
                waiting:{border:"1.5px solid #DFE1E6",bg:"var(--bg)",badge:"#F4F5F7",badgeColor:"#42526E",label:"대기중",icon:"⏳"},
                running:{border:"1.5px solid #0C66E4",bg:"#E9F2FF",badge:"#0C66E4",badgeColor:"#fff",label:"진행중",icon:"🟢"},
                done:{border:"1.5px solid #1F845A",bg:"#DCFFF1",badge:"#1F845A",badgeColor:"#fff",label:"완료",icon:"✅"},
                error:{border:"1.5px solid #CA3521",bg:"#FFECEB",badge:"#CA3521",badgeColor:"#fff",label:"오류",icon:"❌"},
              };
              return c24Schedules.map((s)=>{
                const phase=getPhase(s);
                const ps=phaseStyle[phase];
                // 타임라인 진행률 계산
                const openTs=s.openAt?new Date(s.openAt).getTime():null;
                const closeTs=s.closeAt?new Date(s.closeAt).getTime():null;
                const nowTs=now.getTime();
                let progress=0;
                if(openTs&&closeTs){
                  if(phase==="done")progress=100;
                  else if(phase==="running")progress=Math.min(99,Math.round((nowTs-openTs)/(closeTs-openTs)*100));
                  else progress=0;
                }
                const hasTimeline=openTs&&closeTs;
                return(
                <div key={s.id} style={{border:ps.border,borderRadius:12,padding:"16px 18px",marginBottom:12,background:ps.bg,transition:"all .2s"}}>
                  {/* 헤더 */}
                  <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:12}}>
                    <div>
                      <div style={{fontSize:14,fontWeight:800,marginBottom:4}}>
                        <span style={{color:"#0C66E4",marginRight:6}}>#{s.productNo}</span>
                        {s.productName}
                      </div>
                      <div style={{fontSize:11,color:"var(--ink3)"}}>
                        종료 시 처리: <b>{actionLabel[s.closeAction]||s.closeAction}</b>
                        {s.openSelling==="T"&&s.openDisplay==="T"&&<span style={{marginLeft:6}}>· 오픈 시 판매+진열</span>}
                      </div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                      <span style={{background:ps.badge,color:ps.badgeColor,borderRadius:20,padding:"4px 12px",fontSize:12,fontWeight:800}}>{ps.icon} {ps.label}</span>
                      <button className="riedit" style={{color:"var(--danger)"}} onClick={()=>c24DeleteSchedule(s.id)}>삭제</button>
                    </div>
                  </div>
                  {/* 타임라인 */}
                  <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",alignItems:"center",gap:8,marginBottom:hasTimeline?12:0}}>
                    {/* 오픈 */}
                    <div style={{background:s.openDone?"#0C66E4":"rgba(0,0,0,.05)",borderRadius:8,padding:"10px 14px"}}>
                      <div style={{fontSize:10,fontWeight:700,color:s.openDone?"#fff":"var(--ink3)",marginBottom:3}}>🟢 오픈</div>
                      <div style={{fontSize:13,fontWeight:700,color:s.openDone?"#fff":"var(--ink1)"}}>{s.openAt?fmtDt(s.openAt):"없음"}</div>
                      {s.openDone&&<div style={{fontSize:10,color:"rgba(255,255,255,.8)",marginTop:2}}>✔ 완료됨</div>}
                    </div>
                    {/* 화살표 + 진행률 */}
                    <div style={{textAlign:"center",color:"var(--ink3)",fontSize:18}}>→</div>
                    {/* 종료 */}
                    <div style={{background:s.closeDone?"#1F845A":s.closeAt?"rgba(0,0,0,.05)":"transparent",borderRadius:8,padding:"10px 14px"}}>
                      <div style={{fontSize:10,fontWeight:700,color:s.closeDone?"#fff":"var(--ink3)",marginBottom:3}}>🔴 종료</div>
                      <div style={{fontSize:13,fontWeight:700,color:s.closeDone?"#fff":"var(--ink1)"}}>{s.closeAt?fmtDt(s.closeAt):"없음"}</div>
                      {s.closeDone&&<div style={{fontSize:10,color:"rgba(255,255,255,.8)",marginTop:2}}>✔ 완료됨</div>}
                    </div>
                  </div>
                  {/* 진행 바 */}
                  {hasTimeline&&(
                    <div>
                      <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"var(--ink3)",marginBottom:4}}>
                        <span>{phase==="waiting"?"판매 시작 전":phase==="running"?"판매 진행 중":phase==="done"?"판매 종료됨":"오류 발생"}</span>
                        {phase==="running"&&<span>{progress}%</span>}
                      </div>
                      <div style={{height:6,background:"rgba(0,0,0,.08)",borderRadius:4,overflow:"hidden"}}>
                        <div style={{height:"100%",width:progress+"%",background:phase==="done"?"#1F845A":phase==="running"?"#0C66E4":"#DFE1E6",borderRadius:4,transition:"width .5s"}} />
                      </div>
                    </div>
                  )}
                  {/* 오류 메시지 */}
                  {s.error&&<div style={{marginTop:10,fontSize:12,color:"#CA3521",background:"rgba(202,53,33,.08)",borderRadius:6,padding:"6px 10px"}}>⚠ {s.error}</div>}
                </div>);
              });
            })()}
          </div>
          {/* 로그 */}
          <div className="panel">
            <h3 style={{marginBottom:10}}>📟 실행 로그</h3>
            <div style={{background:"#1a1a2e",color:"#a8ff78",borderRadius:8,padding:12,fontSize:12,fontFamily:"monospace",maxHeight:200,overflowY:"auto",lineHeight:1.7}}>
              {c24Log.map((l,i)=><div key={i}>{l}</div>)}
            </div>
            <button className="btn ghost" style={{marginTop:8,fontSize:12}} onClick={()=>setC24Log(['🗑 로그 초기화'])}>로그 지우기</button>
          </div>
        </div>
      )}

      {view==="team"&&(<>
        <div className="panel"><h3>팀원과 권한</h3><p className="sub">관리자/멤버/뷰어 3단계.</p>
          {data.members.length===0&&<div className="empty">팀원이 없습니다</div>}
          {data.members.map((m)=>(
            <div key={m.name} className="mrow" style={{borderTop:"1px solid var(--line)"}}>
              <span style={{fontWeight:600,fontSize:13,minWidth:90}}>{m.name}{m.name===me&&<span style={{fontSize:10,color:"#8F959C",fontFamily:"monospace"}}> (나)</span>}</span>
              <span style={{fontSize:11,fontFamily:"monospace",color:m.pw?"var(--ok)":"var(--warn)"}}>{m.pw?"🔒 설정됨":"⚠ 비번없음"}</span>
              <select className="sel" value={m.role} disabled={!isAdmin} onChange={(e)=>{const role=e.target.value;commit((d)=>({...d,members:d.members.map((x)=>x.name===m.name?{...x,role,updatedAt:Date.now()}:x)}),[mkLog("권한 변경",null,`${m.name} -> ${ROLES.find((r)=>r.id===role).label}`)]);}}>
                {ROLES.map((r)=><option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
              <span className="spacer" />{isAdmin&&m.name!==me&&<button className="del" onClick={()=>{if(window.confirm(`"${m.name}" 님을 팀에서 내보낼까요? 로그인할 수 없게 됩니다.`))commit((d)=>({...d,members:d.members.filter((x)=>x.name!==m.name)}),[mkLog("팀원 삭제",null,m.name)]);}}>내보내기</button>}
            </div>
          ))}
        </div>
        
        <div className="panel"><h3>판매 채널</h3><p className="sub">상위 채널 아래에 하위 채널을 넣을 수 있습니다. 이름을 클릭하면 수정됩니다.</p>
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
                      channelsUpdatedAt:Date.now()}),[mkLog("채널 이름 변경",null,`${c.id} → ${newId}`)]);}}
                  style={{fontSize:14,fontWeight:700,border:"none",background:"transparent",width:120,padding:"2px 4px",borderBottom:isAdmin?"1px dashed #A9B0A6":"none"}} />
                <span style={{fontSize:11,color:"var(--ink2)",fontFamily:"monospace"}}>{cnt(c.id)}건</span>
                <span className="spacer" />
                {isAdmin&&<button className="btn ghost" style={{padding:"3px 9px",fontSize:11.5}} onClick={()=>setSubTarget(c.id)}>+ 하위</button>}
                {isAdmin&&topChannels.length>1&&<button className="del" onClick={()=>commit((d)=>({...d,channels:d.channels.filter((x)=>x.id!==c.id&&x.parent!==c.id),channelsUpdatedAt:Date.now()}),[mkLog("채널 삭제",null,c.id)])}>삭제</button>}
              </div>
              {kids.map((k)=>(
                <div key={k.id} className="mrow" style={{borderTop:"none",paddingLeft:22,paddingTop:3,paddingBottom:3}}>
                  <span style={{color:"var(--ink2)",fontSize:12}}>└</span>
                  <input type="color" value={k.color} disabled={!isAdmin} style={{width:26,height:20,padding:0,border:"1px solid #A9B0A6"}}
                    onChange={(e)=>{const color=e.target.value;commit((d)=>({...d,channels:d.channels.map((x)=>x.id===k.id?{...x,color}:x),channelsUpdatedAt:Date.now()}),[]);}} />
                  <input defaultValue={k.id} disabled={!isAdmin}
                    onBlur={(e)=>{const newId=e.target.value.trim();if(!newId||newId===k.id)return;
                      commit((d)=>({...d,
                        channels:d.channels.map((x)=>x.id===k.id?{...x,id:newId}:x),
                        tasks:d.tasks.map((t)=>t.channel===k.id?{...t,channel:newId}:t),
                        channelsUpdatedAt:Date.now()}),[mkLog("하위 채널 이름 변경",null,`${k.id} → ${newId}`)]);}}
                    style={{fontSize:13,border:"none",background:"transparent",width:110,padding:"2px 4px",borderBottom:isAdmin?"1px dashed #CDD3CA":"none"}} />
                  <span style={{fontSize:11,color:"var(--ink2)",fontFamily:"monospace"}}>{cnt(k.id)}건</span>
                  <span className="spacer" />
                  {isAdmin&&<button className="del" onClick={()=>commit((d)=>({...d,channels:d.channels.filter((x)=>x.id!==k.id),channelsUpdatedAt:Date.now()}),[mkLog("하위 채널 삭제",null,k.id)])}>삭제</button>}
                </div>
              ))}
              {subTarget===c.id&&isAdmin&&(
                <div className="addrow" style={{paddingLeft:22,marginTop:4}}>
                  <input autoFocus placeholder={`${c.id} 하위 채널명`} value={newSub} onChange={(e)=>setNewSub(e.target.value)} />
                  <button onClick={()=>addChannel(c.id)}>추가</button>
                  <button style={{background:"transparent",border:"1px solid #A9B0A6",color:"var(--ink2)",padding:"6px 11px",fontSize:12}} onClick={()=>{setSubTarget(null);setNewSub("");}}>취소</button>
                </div>
              )}
            </div>
          );})}
          {isAdmin&&(
            <div className="addrow" style={{marginTop:14,borderTop:"1px solid var(--line)",paddingTop:14}}>
              <input placeholder="상위 채널명 입력 후 추가 버튼 클릭" value={newChannel} onChange={(e)=>setNewChannel(e.target.value)} />
              <button onClick={()=>addChannel(null)}>추가</button>
            </div>
          )}
        </div>
        <div className="panel"><h3>보드 컬럼 이름</h3><p className="sub">보드의 5개 컬럼(대기·진행중·검토컨펌·이슈·완료) 이름을 원하는 대로 바꿉니다.</p>
          {cols.map((c)=>(
            <div key={c.id} className="mrow" style={{borderTop:"1px solid var(--line)"}}>
              <span style={{fontSize:11,fontFamily:"monospace",color:"var(--ink3)",minWidth:70}}>{c.id}</span>
              <input disabled={!isAdmin} defaultValue={c.label} placeholder={c.label}
                onBlur={(e)=>{
                  const v=e.target.value.trim();
                  if(!v||v===c.label)return;
                  commit((d)=>({...d,colLabels:{...(d.colLabels||{}),[c.id]:v},colLabelsUpdatedAt:Date.now()}),[mkLog("컬럼명 변경",null,`${c.id} -> ${v}`)]);
                }}
                onKeyDown={(e)=>{if(e.key==="Enter")e.target.blur();}}
                style={{flex:1,maxWidth:220,background:"#FBFCFA",border:"1px solid #C4C9C1",padding:"6px 9px",fontSize:13}} />
              {(data.colLabels||{})[c.id]&&isAdmin&&<button className="del" onClick={()=>commit((d)=>{const cl={...(d.colLabels||{})};delete cl[c.id];return{...d,colLabels:cl,colLabelsUpdatedAt:Date.now()};},[mkLog("컬럼명 초기화",null,c.id)])}>초기화</button>}
            </div>
          ))}
        </div>

        <div className="panel"><h3>업무 유형</h3><p className="sub">업무 상세에서 선택할 수 있는 유형을 추가·삭제합니다.</p>
          <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
            {(data.types||TYPES).map((t)=>(
              <span key={t} style={{display:"inline-flex",alignItems:"center",gap:6,background:"#EBECF0",borderRadius:16,padding:"5px 12px",fontSize:13,fontWeight:600,color:"var(--ink2)"}}>
                {t}
                {isAdmin&&(data.types||TYPES).length>1&&<button style={{background:"none",border:"none",color:"var(--ink3)",cursor:"pointer",fontSize:15,lineHeight:1,padding:0}} onClick={()=>{commit((d)=>({...d,types:(d.types||TYPES).filter((x)=>x!==t),typesUpdatedAt:Date.now()}),[mkLog("업무유형 삭제",null,t)]);}}>×</button>}
              </span>
            ))}
          </div>
          {isAdmin&&(
            <div className="addrow" style={{marginTop:12}}>
              <input placeholder="새 업무 유형 입력 후 추가" value={newType} onChange={(e)=>setNewType(e.target.value)} />
              <button onClick={()=>{const t=newType.trim();if(!t)return;if((data.types||TYPES).includes(t)){alert("이미 있는 유형입니다.");return;}commit((d)=>({...d,types:[...(d.types||TYPES),t],typesUpdatedAt:Date.now()}),[mkLog("업무유형 추가",null,t)]);setNewType("");}}>추가</button>
            </div>
          )}
        </div>

        <div className="panel"><h3>반복업무 분류</h3><p className="sub">반복업무를 묶어서 보여줄 분류를 자유롭게 만듭니다. (예: 오전/오후 대신 팀별, 채널별 등)</p>
          <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
            {(data.routineCats&&data.routineCats.length?data.routineCats:["오전","오후"]).map((c)=>(
              <span key={c} style={{display:"inline-flex",alignItems:"center",gap:6,background:"#EBECF0",borderRadius:16,padding:"5px 12px",fontSize:13,fontWeight:600,color:"var(--ink2)"}}>
                {c}
                {isAdmin&&(data.routineCats||["오전","오후"]).length>1&&<button style={{background:"none",border:"none",color:"var(--ink3)",cursor:"pointer",fontSize:15,lineHeight:1,padding:0}} onClick={()=>{commit((d)=>({...d,routineCats:(d.routineCats&&d.routineCats.length?d.routineCats:["오전","오후"]).filter((x)=>x!==c),routineCatsUpdatedAt:Date.now()}),[mkLog("반복업무분류 삭제",null,c)]);}}>×</button>}
              </span>
            ))}
          </div>
          {isAdmin&&(
            <div className="addrow" style={{marginTop:12}}>
              <input placeholder="새 분류 입력 후 추가" value={newRcat} onChange={(e)=>setNewRcat(e.target.value)} />
              <button onClick={()=>{const c=newRcat.trim();if(!c)return;const cur=data.routineCats&&data.routineCats.length?data.routineCats:["오전","오후"];if(cur.includes(c)){alert("이미 있는 분류입니다.");return;}commit((d)=>({...d,routineCats:[...cur,c],routineCatsUpdatedAt:Date.now()}),[mkLog("반복업무분류 추가",null,c)]);setNewRcat("");}}>추가</button>
            </div>
          )}
        </div>

        <div className="panel"><h3>백업</h3><p className="sub">주기적으로 내려받아 두세요.</p>
          <div style={{display:"flex",gap:7}}>
            <button className="btn ghost" onClick={exportJson}>JSON 내려받기</button>
            {isAdmin&&<button className="btn ghost" onClick={()=>importRef.current?.click()}>JSON 가져오기</button>}
            <input ref={importRef} type="file" accept=".json" style={{display:"none"}} onChange={(e)=>{const f=e.target.files?.[0];if(f)importJson(f);e.target.value="";}} />
          </div>
        </div>
      </>)}

      </div>
      <div className="note" style={{margin:"18px 16px 0"}}>데이터는 Firebase(구글)에 실시간 저장됩니다. 계약 조건이나 개인정보는 올리지 마세요.</div>

      {pwChange&&(
        <div className="mask" onClick={(e)=>e.target===e.currentTarget&&setPwChange(null)}><div className="modal sm">
          <h2>비밀번호 변경</h2>
          <div className="modal-body">
            <div className="fld"><label>현재 비밀번호</label><input type="password" value={pwChange.cur} onChange={(e)=>setPwChange({...pwChange,cur:e.target.value})} placeholder="현재 비밀번호" /></div>
            <div className="fld"><label>새 비밀번호</label><input type="password" value={pwChange.next} onChange={(e)=>setPwChange({...pwChange,next:e.target.value})} placeholder="4자 이상" /></div>
            <div className="fld"><label>새 비밀번호 확인</label><input type="password" value={pwChange.next2} onChange={(e)=>setPwChange({...pwChange,next2:e.target.value})} onKeyDown={(e)=>{if(e.key==="Enter")changePw();}} placeholder="새 비밀번호 다시 입력" /></div>
          </div>
          <div className="modal-foot"><span className="spacer" />
            <button className="btn ghost" onClick={()=>setPwChange(null)}>취소</button>
            <button className="btn-save" onClick={changePw}>변경</button>
          </div>
        </div></div>
      )}

      {askName&&(
        <div className="mask"><div className="modal sm"><h2>이름을 알려주세요</h2><p className="hint" style={{lineHeight:1.6,marginBottom:14}}>담당자, 댓글, 변경 이력에 이 이름이 남습니다.</p>
          <div className="fld"><label>이름</label><input autoFocus value={nameInput} onChange={(e)=>setNameInput(e.target.value)} onKeyDown={(e)=>{if(e.nativeEvent.isComposing||e.key!=="Enter")return;saveMe(nameInput);}} placeholder="예) 김현민" /></div>
          <div className="mfoot"><span className="spacer" />{me&&<button className="btn ghost" onClick={()=>setAskName(false)}>취소</button>}<button className="btn" onClick={()=>saveMe(nameInput)}>시작하기</button></div>
        </div></div>
      )}

      {riAdd&&(
        <div className="mask" onClick={(e)=>e.target===e.currentTarget&&setRiAdd(null)}><div className="modal sm">
          <h2>{riAdd.id?"항목 수정":"새 항목 추가"}</h2>
          <div className="modal-body">
            <div className="fld"><label>대분류</label><input list="ri-cats" autoFocus value={riAdd.cat} onChange={(e)=>setRiAdd({...riAdd,cat:e.target.value})} placeholder="예) 외부채널" />
              <datalist id="ri-cats">{riCatNames.map((c)=><option key={c} value={c} />)}</datalist>
            </div>
            <div className="fld"><label>중분류</label><input list="ri-subs" value={riAdd.sub} onChange={(e)=>setRiAdd({...riAdd,sub:e.target.value})} placeholder="예) 지그재그" />
              <datalist id="ri-subs">{riSubNames(riAdd.cat).map((s)=><option key={s} value={s} />)}</datalist>
            </div>
            <div className="fld"><label>소분류 (체크 항목)</label><input value={riAdd.title} onChange={(e)=>setRiAdd({...riAdd,title:e.target.value})} placeholder="예) CPC 확인" onKeyDown={(e)=>{if(e.nativeEvent.isComposing||e.key!=="Enter")return;saveRi();}} /></div>
          </div>
          <div className="mfoot">
            {riAdd.id&&<button className="del" onClick={()=>removeRi(riAdd)}>삭제</button>}
            <span className="spacer" />
            <button className="btn ghost" onClick={()=>setRiAdd(null)}>취소</button>
            <button className="btn-save" onClick={saveRi}>저장</button>
          </div>
        </div></div>
      )}

      {issueDetail&&(()=>{
        const i=issueDetail;
        const addHistory=(text)=>{
          const t=text.trim();if(!t)return;
          const entry={id:uid(),text:t,author:me||"익명",ts:Date.now()};
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
          <h2>이슈 상세</h2>
          <div className="modal-body">
            <div style={{background:"#F5F6F8",borderRadius:8,padding:"12px 14px",marginBottom:16}}>
              <div style={{fontSize:15,fontWeight:700,marginBottom:6}}>{i.text}</div>
              <div className="issmeta"><b style={{color:i.src==="업무"?"#0055CC":"#1F845A"}}>{i.src}</b> · {i.routineTitle} · 등록 {i.author} · {fmtTs(i.ts)}{i.owner&&` · 담당 ${i.owner}`}</div>
              <button className={"issbtn"+(i.resolved?"":" active")} style={{marginTop:10}} onClick={toggleR}>{i.resolved?"해결됨 ✓ (누르면 미해결)":"미해결 (누르면 해결)"}</button>
            </div>
            <div className="sect" style={{marginTop:0,borderTop:"none"}}><h4>히스토리 · 진행 기록</h4>
              {(i.history||[]).length===0&&<span className="hint">아직 기록이 없습니다. 아래에 진행 상황을 적어보세요.</span>}
              {(i.history||[]).map((h)=>(
                <div key={h.id} className="cmt">
                  <div className="ch2"><b>{h.author}</b> · {fmtTs(h.ts)}{h.edited&&<span style={{color:"var(--ink3)"}}> (수정됨)</span>}</div>
                  {h.editing
                    ? <div style={{display:"flex",gap:6,marginTop:4}}>
                        <input defaultValue={h.text} autoFocus style={{flex:1,border:"1px solid var(--line2)",borderRadius:6,padding:"6px 9px",fontSize:14}}
                          onKeyDown={(e)=>{
                            if(e.nativeEvent.isComposing)return;
                            if(e.key==="Enter"){editHistory(h.id,e.target.value);}
                            if(e.key==="Escape")setIssueDetail({...i,history:i.history.map((x)=>x.id===h.id?{...x,editing:false}:x)});
                          }} />
                        <button className="btn ghost" onClick={()=>setIssueDetail({...i,history:i.history.map((x)=>x.id===h.id?{...x,editing:false}:x)})}>취소</button>
                      </div>
                    : <p>{h.text}</p>}
                  {canEdit&&!h.editing&&<div style={{display:"flex",gap:10,marginTop:3}}>
                    <button style={{background:"none",border:"none",color:"var(--ink3)",fontSize:12,cursor:"pointer",padding:0}} onClick={()=>setIssueDetail({...i,history:i.history.map((x)=>x.id===h.id?{...x,editing:true}:x)})}>수정</button>
                    <button style={{background:"none",border:"none",color:"var(--danger)",fontSize:12,cursor:"pointer",padding:0}} onClick={()=>delHistory(h.id)}>삭제</button>
                  </div>}
                </div>
              ))}
              {canEdit&&<div className="addrow">
                <textarea className="hinput" placeholder="진행 상황·조치 내용 입력 (Enter 전송, Shift+Enter 줄바꿈)" onKeyDown={(e)=>{
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
            <button className="btn ghost" onClick={()=>setIssueDetail(null)}>닫기</button>
          </div>
        </div></div>
        );
      })()}

      {lightbox&&(
        <div onClick={()=>setLightbox(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",cursor:"zoom-out"}}>
          <img src={lightbox} alt="" style={{maxWidth:"90vw",maxHeight:"90vh",borderRadius:10,boxShadow:"0 8px 40px rgba(0,0,0,.5)",objectFit:"contain"}} onClick={(e)=>e.stopPropagation()} />
          <button onClick={()=>setLightbox(null)} style={{position:"fixed",top:20,right:24,background:"none",border:"none",color:"#fff",fontSize:32,cursor:"pointer",lineHeight:1}}>×</button>
          <a href={lightbox} download="image" onClick={(e)=>e.stopPropagation()} style={{position:"fixed",bottom:24,right:24,background:"#0C66E4",color:"#fff",borderRadius:8,padding:"8px 18px",fontSize:13,fontWeight:700,textDecoration:"none"}}>⬇ 다운로드</a>
        </div>
      )}

      {memoDraft&&(
        <div className="mask" onClick={(e)=>e.target===e.currentTarget&&setMemoDraft(null)}><div className="modal">
          <h2>{memoDraft.id?"메모 수정":"새 메모"}</h2>
          <div className="modal-body">
            <div className="r3">
              <div className="fld"><label>대분류 (선택)</label><input list="memo-cats" value={memoDraft.cat||""} onChange={(e)=>setMemoDraft({...memoDraft,cat:e.target.value})} placeholder="예) 마케팅" />
                <datalist id="memo-cats">{memoCatNames.map((c)=><option key={c} value={c} />)}</datalist>
              </div>
              <div className="fld"><label>중분류 (선택)</label><input list="memo-subs" value={memoDraft.sub||""} onChange={(e)=>setMemoDraft({...memoDraft,sub:e.target.value})} placeholder="예) 브랜드검색" />
                <datalist id="memo-subs">{memoSubNames(memoDraft.cat||"").map((s)=><option key={s} value={s} />)}</datalist>
              </div>
              <div className="fld"><label>소분류 (선택)</label><input value={memoDraft.title||""} onChange={(e)=>setMemoDraft({...memoDraft,title:e.target.value})} placeholder="예) 키워드 아이디어" /></div>
            </div>
            <div className="fld"><label>내용</label><textarea autoFocus value={memoDraft.text||""} onChange={(e)=>setMemoDraft({...memoDraft,text:e.target.value})} placeholder="메모 내용을 입력하세요" style={{minHeight:100}} /></div>
          </div>
          <div className="modal-foot">
            {memoDraft.id&&<button className="del" onClick={()=>removeMemo(memoDraft)}>삭제</button>}
            {memoDraft.id&&<button className="btn ghost" onClick={()=>duplicateMemo(memoDraft)}>복사</button>}
            <span className="spacer" />
            <button className="btn ghost" onClick={()=>setMemoDraft(null)}>닫기</button>
            <button className="btn-save" onClick={saveMemo}>저장</button>
          </div>
        </div></div>
      )}

      {mlyDraft&&(
        <div className="mask" onClick={(e)=>e.target===e.currentTarget&&setMlyDraft(null)}><div className="modal">
          <h2>{mlyDraft._new?"새 월간 항목":"월간 항목 상세"} · {mlyDraft.month}</h2>
          <div className="modal-body">
            <div className="fld"><label>제목</label><input autoFocus value={mlyDraft.title} onChange={(e)=>setMlyDraft({...mlyDraft,title:e.target.value})} placeholder="예) 월 마감 재고 확인" /></div>
            <div className="fld"><label>설명</label><textarea value={mlyDraft.desc||""} onChange={(e)=>setMlyDraft({...mlyDraft,desc:e.target.value})} placeholder="절차, 기준값, 참고 링크" /></div>
            <div className="sect">
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                <h4 style={{margin:0}}>하위 항목</h4>
                {(mlyDraft.subs||[]).some((s)=>s.done)&&<button className="ckclear" onClick={()=>setMlyDraft({...mlyDraft,subs:(mlyDraft.subs||[]).map((s)=>({...s,done:false}))})}>체크 전체 해제</button>}
              </div>
              {(mlyDraft.subs||[]).length===0&&<span className="hint">하위 항목이 없습니다</span>}
              {(mlyDraft.subs||[]).map((s)=>{
                const subOpen=!!mlySubHistOpen[s.id];
                const subsubOpen=!!mlySubsubOpen[s.id];
                const subsubs=s.subsubs||[];
                return (
                <div key={s.id}>
                  <div className="fcitem">
                    <button className={"fccheck"+(s.done?" on":"")} onClick={()=>setMlyDraft({...mlyDraft,subs:mlyDraft.subs.map((x)=>x.id===s.id?{...x,done:!x.done}:x)})}>{s.done?"✓":""}</button>
                    {s.editing
                      ? <input defaultValue={s.text} autoFocus style={{flex:1,fontSize:13,border:"1px solid var(--line2)",borderRadius:6,padding:"4px 7px"}}
                          onKeyDown={(e)=>{if(e.nativeEvent.isComposing)return;if(e.key==="Enter"){const v=e.target.value.trim();if(v)setMlyDraft({...mlyDraft,subs:mlyDraft.subs.map((x)=>x.id===s.id?{...x,text:v,editing:false}:x)});}if(e.key==="Escape")setMlyDraft({...mlyDraft,subs:mlyDraft.subs.map((x)=>x.id===s.id?{...x,editing:false}:x)});}}
                          onBlur={(e)=>{const v=e.target.value.trim();if(v)setMlyDraft({...mlyDraft,subs:mlyDraft.subs.map((x)=>x.id===s.id?{...x,text:v,editing:false}:x)});}} />
                      : <span style={{flex:1,fontSize:13,textDecoration:s.done?"line-through":"none",color:s.done?"var(--ink3)":"inherit",cursor:"pointer"}} onClick={()=>setMlyDraft({...mlyDraft,subs:mlyDraft.subs.map((x)=>x.id===s.id?{...x,editing:true}:x)})}>{s.text}</span>}
                    <button style={{background:"none",border:"none",color:"var(--ink3)",cursor:"pointer",fontSize:11}} onClick={()=>setMlySubsubOpen({...mlySubsubOpen,[s.id]:!subsubOpen})}>{subsubs.length>0?`하위목록 ${subsubs.filter((x)=>x.done).length}/${subsubs.length}`:"+하위목록"}</button>
                    <button style={{background:"none",border:"none",color:"var(--ink3)",cursor:"pointer",fontSize:11}} onClick={()=>setMlySubHistOpen({...mlySubHistOpen,[s.id]:!subOpen})}>{(s.history||[]).length>0?`히스토리 ${s.history.length}`:"+히스토리"}</button>
                    <button style={{background:"none",border:"none",color:"var(--ink3)",cursor:"pointer",fontSize:15}} onClick={()=>setMlyDraft({...mlyDraft,subs:mlyDraft.subs.filter((x)=>x.id!==s.id)})}>×</button>
                  </div>
                  {subsubOpen&&(
                    <div style={{paddingLeft:31,marginBottom:8}}>
                      {subsubs.length===0&&<span className="hint">하위 목록이 없습니다</span>}
                      {subsubs.map((x)=>(
                        <div key={x.id} style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                          <button className={"fccheck"+(x.done?" on":"")} onClick={()=>setMlyDraft({...mlyDraft,subs:mlyDraft.subs.map((y)=>y.id===s.id?{...y,subsubs:y.subsubs.map((z)=>z.id===x.id?{...z,done:!z.done}:z)}:y)})}>{x.done?"✓":""}</button>
                          <span style={{flex:1,fontSize:12.5,textDecoration:x.done?"line-through":"none",color:x.done?"var(--ink3)":"inherit"}}>{x.text}</span>
                          <button style={{background:"none",border:"none",color:"var(--ink3)",cursor:"pointer",fontSize:14}} onClick={()=>setMlyDraft({...mlyDraft,subs:mlyDraft.subs.map((y)=>y.id===s.id?{...y,subsubs:y.subsubs.filter((z)=>z.id!==x.id)}:y)})}>×</button>
                        </div>
                      ))}
                      <div className="addrow"><input placeholder="하위목록 항목 입력 후 Enter" onKeyDown={(e)=>{if(e.nativeEvent.isComposing||e.key!=="Enter")return;const v=e.target.value.trim();if(!v)return;setMlyDraft({...mlyDraft,subs:mlyDraft.subs.map((y)=>y.id===s.id?{...y,subsubs:[...(y.subsubs||[]),{id:uid(),text:v,done:false}]}:y)});e.target.value="";}} /></div>
                    </div>
                  )}
                  {subOpen&&(
                    <div style={{paddingLeft:31,marginBottom:8}}>
                      {(s.history||[]).length===0&&<span className="hint">기록이 없습니다</span>}

                      {(s.history||[]).map((h)=>(
                        <div key={h.id} className="cmt">
                          <div className="ch2"><b>{h.author}</b> · {fmtTs(h.ts)}{h.edited&&<span style={{color:"var(--ink3)"}}> (수정됨)</span>}</div>
                          {mlySubHistEditId===h.id
                            ? <textarea className="hinput" defaultValue={h.text} autoFocus style={{width:"100%",marginTop:4}}
                                onKeyDown={(e)=>{if(e.nativeEvent.isComposing||e.key!=="Enter"||e.shiftKey)return;e.preventDefault();editMlySubHistory(s.id,h.id,e.target.value);setMlySubHistEditId(null);}}
                                onBlur={(e)=>{editMlySubHistory(s.id,h.id,e.target.value);setMlySubHistEditId(null);}} />
                            : <p>{h.text}</p>}
                          {mlySubHistEditId!==h.id&&<div style={{display:"flex",gap:10}}>
                            <button style={{background:"none",border:"none",color:"var(--ink3)",fontSize:11,cursor:"pointer",padding:0}} onClick={()=>setMlySubHistEditId(h.id)}>수정</button>
                            <button style={{background:"none",border:"none",color:"var(--danger)",fontSize:11,cursor:"pointer",padding:0}} onClick={()=>removeMlySubHistory(s.id,h.id)}>삭제</button>
                          </div>}
                        </div>
                      ))}
                      <div className="addrow">
                        <textarea className="hinput" placeholder="히스토리 입력 (Enter 추가, Shift+Enter 줄바꿈)"
                          value={mlySubHistText[s.id]||""} onChange={(e)=>setMlySubHistText({...mlySubHistText,[s.id]:e.target.value})}
                          onKeyDown={(e)=>{if(e.nativeEvent.isComposing||e.key!=="Enter"||e.shiftKey)return;e.preventDefault();addMlySubHistory(s.id,mlySubHistText[s.id]||"");setMlySubHistText({...mlySubHistText,[s.id]:""});}} />
                      </div>
                    </div>
                  )}
                </div>
                );
              })}
              <div className="addrow"><input placeholder="하위 항목 입력 후 Enter" onKeyDown={(e)=>{if(e.nativeEvent.isComposing||e.key!=="Enter")return;const v=e.target.value.trim();if(!v)return;setMlyDraft({...mlyDraft,subs:[...(mlyDraft.subs||[]),{id:uid(),text:v,done:false,history:[]}]});e.target.value="";}} /></div>
            </div>
            <div className="sect"><h4>히스토리</h4>
              {(mlyDraft.history||[]).length===0&&<span className="hint">진행 기록이 없습니다</span>}
              {(mlyDraft.history||[]).map((h)=>(
                <div key={h.id} className="cmt">
                  <div className="ch2"><b>{h.author}</b> · {fmtTs(h.ts)}{h.edited&&<span style={{color:"var(--ink3)"}}> (수정됨)</span>}</div>
                  {mlyHistEditId===h.id
                    ? <textarea className="hinput" defaultValue={h.text} autoFocus style={{width:"100%",marginTop:4}}
                        onKeyDown={(e)=>{if(e.nativeEvent.isComposing||e.key!=="Enter"||e.shiftKey)return;e.preventDefault();editMlyHistory(h.id,e.target.value);setMlyHistEditId(null);}}
                        onBlur={(e)=>{editMlyHistory(h.id,e.target.value);setMlyHistEditId(null);}} />
                    : <p>{h.text}</p>}
                  {mlyHistEditId!==h.id&&<div style={{display:"flex",gap:10}}>
                    <button style={{background:"none",border:"none",color:"var(--ink3)",fontSize:11,cursor:"pointer",padding:0}} onClick={()=>setMlyHistEditId(h.id)}>수정</button>
                    <button style={{background:"none",border:"none",color:"var(--danger)",fontSize:11,cursor:"pointer",padding:0}} onClick={()=>removeMlyHistory(h.id)}>삭제</button>
                  </div>}
                </div>
              ))}
              <div className="addrow"><textarea className="hinput" placeholder="진행 상황 입력 (Enter 전송, Shift+Enter 줄바꿈)" onKeyDown={(e)=>{if(e.nativeEvent.isComposing||e.key!=="Enter"||e.shiftKey)return;e.preventDefault();const v=e.target.value.trim();if(!v)return;setMlyDraft({...mlyDraft,history:[...(mlyDraft.history||[]),{id:uid(),text:v,author:me||"익명",ts:Date.now()}]});e.target.value="";}} /></div>
            </div>
          </div>
          <div className="modal-foot">
            {!mlyDraft._new&&<button className="del" onClick={()=>removeMly(mlyDraft)}>삭제</button>}
            {!mlyDraft._new&&<button className="btn ghost" onClick={()=>duplicateMlyToNextMonth(mlyDraft)}>다음달로 복사</button>}
            <span className="spacer" />
            <button className="btn ghost" onClick={()=>setMlyDraft(null)}>닫기</button>
            <button className="btn-save" onClick={saveMly}>저장</button>
          </div>
        </div></div>
      )}

      {ckDraft&&(()=>{
        const isCL=ckDraft.tab==="checklist";
        return (
        <div className="mask" onClick={(e)=>e.target===e.currentTarget&&setCkDraft(null)}><div className="modal">
          <h2>{ckDraft._new?"새 항목":"항목 상세"} · {CKTABS.find((t)=>t.id===ckDraft.tab)?.label}</h2>
          <div className="modal-body">
            <div className="fld"><label>제목</label><input autoFocus value={ckDraft.title} onChange={(e)=>setCkDraft({...ckDraft,title:e.target.value})} placeholder="예) 여름 특가전 배너 원복" /></div>
            <div className="r2">
              <div className="fld"><label>시작일</label><input type="date" value={ckDraft.start||""} onChange={(e)=>setCkDraft({...ckDraft,start:e.target.value})} /></div>
              <div className="fld"><label>종료일 (마감)</label><input type="date" value={ckDraft.due||""} onChange={(e)=>setCkDraft({...ckDraft,due:e.target.value})} /></div>
            </div>
            <div className="fld"><label>설명</label><textarea value={ckDraft.desc||""} onChange={(e)=>setCkDraft({...ckDraft,desc:e.target.value})} placeholder="원복 대상, 절차, 참고 링크" /></div>
            {isCL&&(
              <div className="sect">
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                  <h4 style={{margin:0}}>체크리스트</h4>
                  {(ckDraft.subs||[]).some((s)=>s.done)&&<button className="ckclear" onClick={()=>setCkDraft({...ckDraft,subs:(ckDraft.subs||[]).map((s)=>({...s,done:false}))})}>체크 전체 해제</button>}
                </div>
                {(ckDraft.subs||[]).length===0&&<span className="hint">하위 체크 항목이 없습니다</span>}
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
                    <button className={"fccheck"+(s.done?" on":"")} onClick={()=>setCkDraft({...ckDraft,subs:ckDraft.subs.map((x)=>x.id===s.id?{...x,done:!x.done}:x)})}>{s.done?"✓":""}</button>
                    {s.editing
                      ? <input defaultValue={s.text} autoFocus style={{flex:1,fontSize:13,border:"1px solid var(--line2)",borderRadius:6,padding:"4px 7px"}}
                          onKeyDown={(e)=>{if(e.nativeEvent.isComposing)return;if(e.key==="Enter"){const v=e.target.value.trim();if(v)setCkDraft({...ckDraft,subs:ckDraft.subs.map((x)=>x.id===s.id?{...x,text:v,editing:false}:x)});}if(e.key==="Escape")setCkDraft({...ckDraft,subs:ckDraft.subs.map((x)=>x.id===s.id?{...x,editing:false}:x)});}}
                          onBlur={(e)=>{const v=e.target.value.trim();if(v)setCkDraft({...ckDraft,subs:ckDraft.subs.map((x)=>x.id===s.id?{...x,text:v,editing:false}:x)});}} />
                      : <span style={{flex:1,fontSize:13,textDecoration:s.done?"line-through":"none",color:s.done?"var(--ink3)":"inherit",cursor:"pointer"}} onClick={()=>setCkDraft({...ckDraft,subs:ckDraft.subs.map((x)=>x.id===s.id?{...x,editing:true}:x)})}>{s.text}</span>}
                    <button style={{background:"none",border:"none",color:"var(--ink3)",cursor:"pointer",fontSize:15}} onClick={()=>setCkDraft({...ckDraft,subs:ckDraft.subs.filter((x)=>x.id!==s.id)})}>×</button>
                  </div>
                ))}
                <div className="addrow">
                  <input placeholder="체크 항목 입력 후 Enter" onKeyDown={(e)=>{
                    if(e.nativeEvent.isComposing||e.key!=="Enter")return;
                    const v=e.target.value.trim();if(!v)return;
                    setCkDraft({...ckDraft,subs:[...(ckDraft.subs||[]),{id:uid(),text:v,done:false}]});e.target.value="";
                  }} />
                </div>
              </div>
            )}
            <div className="sect"><h4>히스토리</h4>
              {(ckDraft.history||[]).length===0&&<span className="hint">진행 기록이 없습니다</span>}
              {(ckDraft.history||[]).map((h)=>(
                <div key={h.id} className="cmt">
                  <div className="ch2"><b>{h.author}</b> · {fmtTs(h.ts)}</div>
                  <p>{h.text}</p>
                </div>
              ))}
              <div className="addrow">
                <textarea className="hinput" placeholder="진행 상황·메모 입력 (Enter 전송, Shift+Enter 줄바꿈)" onKeyDown={(e)=>{
                  if(e.nativeEvent.isComposing||e.key!=="Enter"||e.shiftKey)return;
                  e.preventDefault();
                  const v=e.target.value.trim();if(!v)return;
                  const entry={id:uid(),text:v,author:me||"익명",ts:Date.now()};
                  setCkDraft({...ckDraft,history:[...(ckDraft.history||[]),entry]});
                  e.target.value="";
                }} />
              </div>
            </div>
          </div>
          <div className="modal-foot">
            {!ckDraft._new&&<button className="del" onClick={()=>removeCk(ckDraft)}>삭제</button>}
            {!ckDraft._new&&<button className="btn ghost" onClick={()=>duplicateCk(ckDraft)}>복사</button>}
            <span className="spacer" />
            <button className="btn ghost" onClick={()=>setCkDraft(null)}>닫기</button>
            <button className="btn-save" onClick={saveCk}>저장</button>
          </div>
        </div></div>
        );
      })()}

      {confirmBox&&(
        <div className="mask" onClick={(e)=>e.target===e.currentTarget&&setConfirmBox(null)}><div className="modal sm">
          <h2>{confirmBox.kind==="purge"?"영구 삭제할까요?":confirmBox.kind==="archiveOne"?"보관함으로 옮길까요?":confirmBox.kind==="archiveCk"?"목록에서 정리할까요?":"완료 업무를 보관할까요?"}</h2>
          <p style={{fontSize:12.5,color:"#565C64",lineHeight:1.6}}>{confirmBox.kind==="purge"?`보관함의 ${archived.length}건이 완전히 사라집니다.`:confirmBox.kind==="archiveOne"?`"${confirmBox.taskTitle}" 업무를 보관함으로 옮기시겠어요?`:confirmBox.kind==="archiveCk"?`"${confirmBox.ckTitle}" 항목을 완료했습니다. 목록에서 삭제할까요? 남겨두면 완료 상태로 표시됩니다.`:`완료 ${live.filter((t)=>t.status==="done").length}건이 보관함으로 이동합니다.`}</p>
          <div className="mfoot"><span className="spacer" />
            <button className="btn ghost" onClick={()=>setConfirmBox(null)}>{confirmBox.kind==="archiveOne"?"보드에 두기":confirmBox.kind==="archiveCk"?"남겨두기":"취소"}</button>
            <button className={confirmBox.kind==="purge"?"btn warn":"btn-save"} onClick={()=>{
              if(confirmBox.kind==="purge")purgeArchive();
              else if(confirmBox.kind==="archiveCk"){const cid=confirmBox.ckId;commit((d)=>({...d,checkitems:(d.checkitems||[]).map((x)=>x.id===cid?{...x,deleted:true,updatedAt:Date.now()}:x)}),[]);setConfirmBox(null);}
              else if(confirmBox.kind==="archiveOne"){const tid=confirmBox.taskId;commit((d)=>({...d,tasks:d.tasks.map((t)=>t.id===tid?{...t,archived:true,updatedAt:Date.now(),updatedBy:me}:t)}),[mkLog("아카이브",{id:tid,title:confirmBox.taskTitle})]);setConfirmBox(null);}
              else archiveDone();
            }}>{confirmBox.kind==="purge"?"영구 삭제":confirmBox.kind==="archiveCk"?"삭제":"보관하기"}</button>
          </div>
        </div></div>
      )}

      {draft&&(
        <div className="mask" onClick={(e)=>e.target===e.currentTarget&&setDraft(null)}><div className="modal">
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
            <h2 style={{margin:0}}>{draft._new?"새 업무":"업무 상세"}</h2>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              {canEdit&&!draft._new&&<button className="btn-save" style={{fontSize:12,padding:"5px 14px",background:"#1F845A"}} onClick={saveDraft}>💾 중간 저장</button>}
              <button style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:"var(--ink3)",lineHeight:1}} onClick={()=>setDraft(null)}>×</button>
            </div>
          </div>
          <div className="modal-body">
          <div className="fld"><label>업무명</label><input autoFocus disabled={!canEdit} value={draft.title} onChange={(e)=>setDraft({...draft,title:e.target.value})} placeholder="예) 쿠팡 락토컷 상세페이지 개편" /></div>
          <div className="r3">
            <div className="fld"><label>브랜드</label><select disabled={!canEdit} value={draft.brand||""} onChange={(e)=>setDraft({...draft,brand:e.target.value})}>
              <option value="">선택 안 함</option>
              {subsOf("브랜드").map((k)=><option key={k.id} value={k.id}>{k.id}</option>)}
            </select></div>
            <div className="fld"><label>채널</label><select disabled={!canEdit} value={draft.channel} onChange={(e)=>setDraft({...draft,channel:e.target.value})}>
              {topChannels.filter((c)=>c.id!=="브랜드").map((c)=>{
                const kids=subsOf(c.id);
                if(!kids.length)return <option key={c.id} value={c.id}>{c.id}</option>;
                return <optgroup key={c.id} label={c.id}>
                  <option value={c.id}>{c.id} (전체)</option>
                  {kids.map((k)=><option key={k.id} value={k.id}>　└ {k.id}</option>)}
                </optgroup>;
              })}
            </select></div>
            <div className="fld"><label>업무 유형</label><select disabled={!canEdit} value={draft.type} onChange={(e)=>setDraft({...draft,type:e.target.value})}>{(data.types||TYPES).map((t)=><option key={t} value={t}>{t}</option>)}</select></div>
          </div>
          <div className="fld"><label>담당자</label>
            <input list="wb-owners" value={draft.owner} onChange={(e)=>setDraft({...draft,owner:e.target.value})} placeholder="이름 직접 입력 또는 목록 선택" style={{width:"100%",background:"#FBFCFA",border:"1px solid #C4C9C1",padding:"7px 9px",fontSize:13}} />
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
            <div className="fld"><label>시작일</label><input type="date" disabled={!canEdit} value={draft.start||""} onChange={(e)=>setDraft({...draft,start:e.target.value})} /></div>
            <div className="fld"><label>마감일</label><input type="date" disabled={!canEdit} value={draft.due} onChange={(e)=>setDraft({...draft,due:e.target.value})} /></div>
          </div>
          <div className="r3">
            <div className="fld"><label>우선순위</label><select disabled={!canEdit} value={draft.priority} onChange={(e)=>setDraft({...draft,priority:e.target.value})}>{PRIORITIES.map((p)=><option key={p.id} value={p.id}>{p.label}</option>)}</select></div>
            <div className="fld"><label>상태</label><select disabled={!canEdit} value={draft.status} onChange={(e)=>setDraft({...draft,status:e.target.value})}>{cols.map((c)=><option key={c.id} value={c.id}>{c.label}</option>)}</select></div>
            <div className="fld"><label>반복</label><select disabled={!canEdit} value={draft.repeat} onChange={(e)=>setDraft({...draft,repeat:e.target.value})}>{REPEATS.map((r)=><option key={r.id} value={r.id}>{r.label}</option>)}</select></div>
          </div>
          <div className="fld">
            <label>진행률</label>
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
          <div className="sect" style={{paddingTop:10}}
            onPaste={async(e)=>{
              const items=Array.from(e.clipboardData.items||[]);
              const imgItem=items.find((i)=>i.type.startsWith("image/"));
              if(!imgItem||!canEdit)return;
              e.preventDefault();
              const file=imgItem.getAsFile();
              const b64=await resizeImage(file);
              const newImg={id:uid(),src:b64,ts:Date.now(),by:me||"익명"};
              setDraft({...draft,images:[...(draft.images||[]),newImg]});
            }}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
              <h4 style={{margin:0}}>이미지 <span style={{fontSize:11,color:"var(--ink3)",fontWeight:400}}>(Ctrl+V 붙여넣기 가능)</span></h4>
              {canEdit&&<label style={{cursor:"pointer",fontSize:12,color:"#0C66E4",fontWeight:700,border:"1px solid #0C66E4",borderRadius:6,padding:"4px 10px"}}>
                + 이미지 추가
                <input type="file" accept="image/*" multiple style={{display:"none"}} onChange={async(e)=>{
                  const files=Array.from(e.target.files);
                  const imgs=await Promise.all(files.map((f)=>resizeImage(f)));
                  const newImgs=(imgs).map((b64)=>({id:uid(),src:b64,ts:Date.now(),by:me||"익명"}));
                  setDraft({...draft,images:[...(draft.images||[]),...newImgs]});
                  e.target.value="";
                }} />
              </label>}
            </div>
            {(draft.images||[]).length===0&&<span className="hint">이미지가 없습니다</span>}
            <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
              {(draft.images||[]).map((img)=>(
                <div key={img.id} style={{position:"relative",display:"inline-block"}}>
                  <img src={img.src} alt="" style={{width:120,height:90,objectFit:"cover",borderRadius:8,border:"1px solid var(--line)",cursor:"pointer"}} onClick={()=>setLightbox(img.src)} />
                  {canEdit&&<button onClick={()=>setDraft({...draft,images:(draft.images||[]).filter((x)=>x.id!==img.id)})}
                    style={{position:"absolute",top:2,right:2,background:"rgba(0,0,0,.55)",color:"#fff",border:"none",borderRadius:"50%",width:20,height:20,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",padding:0}}>×</button>}
                  <div style={{fontSize:10,color:"var(--ink3)",marginTop:2,textAlign:"center"}}>{img.by}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="sect"><h4>히스토리</h4>
            {(draft.history||[]).length===0&&<span className="hint">진행 기록이 없습니다</span>}
            {(draft.history||[]).map((h)=>(
              <div key={h.id} className="cmt">
                <div className="ch2"><b>{h.author}</b> · {fmtTs(h.ts)}{h.edited&&<span style={{fontSize:10,color:"var(--ink3)"}}> (수정됨)</span>}</div>
                {h.image&&<img src={h.image} alt="" style={{maxWidth:"100%",maxHeight:240,borderRadius:8,cursor:"pointer",marginTop:6,border:"1px solid var(--line)"}} onClick={()=>setLightbox(h.image)} />}
                {h.editing
                  ? <div style={{display:"flex",gap:6,marginTop:4}}>
                      <input defaultValue={h.text} autoFocus style={{flex:1,border:"1px solid var(--line2)",borderRadius:6,padding:"6px 9px",fontSize:14}}
                        onKeyDown={(e)=>{
                          if(e.nativeEvent.isComposing)return;
                          if(e.key==="Enter"){const v=e.target.value.trim();if(v)setDraft({...draft,history:draft.history.map((x)=>x.id===h.id?{...x,text:v,edited:true,editing:false}:x)});}
                          if(e.key==="Escape")setDraft({...draft,history:draft.history.map((x)=>x.id===h.id?{...x,editing:false}:x)});
                        }} />
                      <button className="btn ghost" onClick={()=>setDraft({...draft,history:draft.history.map((x)=>x.id===h.id?{...x,editing:false}:x)})}>취소</button>
                    </div>
                  : h.text&&<p>{h.text}</p>}
                {canEdit&&!h.editing&&<div style={{display:"flex",gap:10,marginTop:3}}>
                  {!h.image&&<button style={{background:"none",border:"none",color:"var(--ink3)",fontSize:12,cursor:"pointer",padding:0}} onClick={()=>setDraft({...draft,history:draft.history.map((x)=>x.id===h.id?{...x,editing:true}:x)})}>수정</button>}
                  <button style={{background:"none",border:"none",color:"var(--danger)",fontSize:12,cursor:"pointer",padding:0}} onClick={()=>setDraft({...draft,history:draft.history.filter((x)=>x.id!==h.id)})}>삭제</button>
                </div>}
              </div>
            ))}
            {canEdit&&<div className="addrow"><textarea className="hinput" placeholder="진행 상황·메모 입력 (Enter 전송, Shift+Enter 줄바꿈 / 이미지 Ctrl+V 붙여넣기 가능)"
              onPaste={async(e)=>{
                const items=Array.from(e.clipboardData.items||[]);
                const imgItem=items.find((i)=>i.type.startsWith("image/"));
                if(!imgItem)return;
                e.preventDefault();
                const file=imgItem.getAsFile();
                const b64=await resizeImage(file);
                setDraft({...draft,history:[...(draft.history||[]),{id:uid(),author:me||"익명",text:"",image:b64,ts:Date.now()}]});
              }}
              onKeyDown={(e)=>{if(e.nativeEvent.isComposing||e.key!=="Enter"||e.shiftKey)return;e.preventDefault();const v=e.target.value.trim();if(!v)return;setDraft({...draft,history:[...(draft.history||[]),{id:uid(),author:me||"익명",text:v,ts:Date.now()}]});e.target.value="";}} /></div>}
          </div>
          <div className="sect"><h4>세부 단계{(draft.checklist||[]).length>0&&` (${draft.checklist.filter((c)=>c.done).length}/${draft.checklist.length})`}</h4>
            {(draft.checklist||[]).map((c)=>(
              <div key={c.id} style={{marginBottom:6}}>
                <div className="item">
                  <input type="checkbox" checked={c.done} disabled={!canEdit} style={{width:"auto"}} onChange={()=>setDraft({...draft,checklist:draft.checklist.map((x)=>x.id===c.id?{...x,done:!x.done}:x)})} />
                  {c.editing
                    ? <textarea defaultValue={c.text} autoFocus style={{flex:1,border:"1px solid var(--line2)",borderRadius:6,padding:"5px 8px",fontSize:13.5,resize:"vertical",minHeight:36,fontFamily:"inherit"}}
                        onKeyDown={(e)=>{if(e.nativeEvent.isComposing)return;if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();const v=e.target.value.trim();if(v)setDraft({...draft,checklist:draft.checklist.map((x)=>x.id===c.id?{...x,text:v,editing:false}:x)});}if(e.key==="Escape")setDraft({...draft,checklist:draft.checklist.map((x)=>x.id===c.id?{...x,editing:false}:x)});}}
                        onBlur={(e)=>{const v=e.target.value.trim();if(v)setDraft({...draft,checklist:draft.checklist.map((x)=>x.id===c.id?{...x,text:v,editing:false}:x)});}} />
                    : <span style={{flex:1,textDecoration:c.done?"line-through":"none",color:c.done?"#8F959C":"inherit",cursor:canEdit?"pointer":"default",whiteSpace:"pre-wrap",wordBreak:"break-word"}} onClick={()=>canEdit&&setDraft({...draft,checklist:draft.checklist.map((x)=>x.id===c.id?{...x,editing:true}:x)})}>{c.text}</span>}
                  {canEdit&&!c.editing&&<button style={{background:"none",border:"none",cursor:"pointer",color:"var(--ink3)",fontSize:11,padding:"0 4px"}} onClick={()=>setDraft({...draft,checklist:draft.checklist.map((x)=>x.id===c.id?{...x,expand:!x.expand}:x)})}>{(c.subs||[]).length>0?`하위 ${(c.subs||[]).filter((s)=>s.done).length}/${(c.subs||[]).length}`:"+하위"}</button>}
                  {canEdit&&<button style={{background:"none",border:"none",cursor:"pointer",color:"#8F959C"}} onClick={()=>setDraft({...draft,checklist:draft.checklist.filter((x)=>x.id!==c.id)})}>×</button>}
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
                        <button style={{background:"none",border:"none",cursor:"pointer",color:"#8F959C"}} onClick={()=>setDraft({...draft,checklist:draft.checklist.map((x)=>x.id===c.id?{...x,subs:x.subs.filter((y)=>y.id!==s.id)}:x)})}>×</button>
                      </div>
                    ))}
                    <div className="addrow" style={{marginTop:3}}><input placeholder="하위 항목 입력 후 Enter" style={{fontSize:12.5}} onKeyDown={(e)=>{if(e.nativeEvent.isComposing)return;const v=e.target.value.trim();if(e.key==="Enter"&&v){setDraft({...draft,checklist:draft.checklist.map((x)=>x.id===c.id?{...x,subs:[...(x.subs||[]),{id:uid(),text:v,done:false}]}:x)});e.target.value="";}}} /></div>
                  </div>
                )}
              </div>
            ))}
            {!(draft.checklist||[]).length&&<span className="hint">없음</span>}
            {canEdit&&<div className="addrow"><textarea className="hinput" placeholder="단계 입력 (Enter 추가, Shift+Enter 줄바꿈)" onKeyDown={(e)=>{if(e.nativeEvent.isComposing)return;if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();const v=e.target.value.trim();if(v){setDraft({...draft,checklist:[...(draft.checklist||[]),{id:uid(),text:v,done:false,subs:[]}]});e.target.value="";}}}}/></div>}
          </div>
          <div className="sect"><h4>이슈</h4>
            {(draft.issues||[]).length===0&&<span className="hint">없음</span>}
            {(draft.issues||[]).map((iss)=>(
              <div key={iss.id} className={"iss"+(iss.resolved?" done":"")}>
                <button className="issck" onClick={()=>setDraft({...draft,issues:(draft.issues||[]).map((x)=>x.id===iss.id?{...x,resolved:!x.resolved}:x)})}>
                  {iss.resolved?"✓":""}
                </button>
                <div style={{flex:1}}>
                  <div className="isstext">{iss.text}</div>
                  <div className="issmeta">{iss.author} · {fmtTs(iss.ts)}</div>
                </div>
                {canEdit&&<button style={{background:"none",border:"none",cursor:"pointer",color:"var(--ink3)",fontSize:16}} onClick={()=>setDraft({...draft,issues:(draft.issues||[]).filter((x)=>x.id!==iss.id)})}>×</button>}
              </div>
            ))}
            <div className="addrow">
              <input placeholder="이슈 입력 후 Enter" onKeyDown={(e)=>{
                if(e.nativeEvent.isComposing||e.key!=="Enter")return;
                const v=e.target.value.trim();if(!v)return;
                const iss={id:uid(),text:v,author:me||"익명",ts:Date.now(),resolved:false};
                setDraft({...draft,issues:[iss,...(draft.issues||[])]});
                e.target.value="";
              }} />
            </div>
          </div>

          {!draft._new&&(
            <div className="sect"><h4>이 업무의 이력</h4>
              {(data.log||[]).filter((e)=>e.taskId===draft.id).slice(0,6).map((e)=><div key={e.id} className="item" style={{fontSize:11.5,color:"#565C64"}}><span style={{fontSize:10.5,color:"#8F959C",minWidth:96,fontFamily:"monospace"}}>{fmtTs(e.ts)}</span><span style={{fontSize:10.5,minWidth:54,fontFamily:"monospace"}}>{e.who}</span><span>{e.action}{e.detail&&` · ${e.detail}`}</span></div>)}
              {!(data.log||[]).some((e)=>e.taskId===draft.id)&&<span className="hint">기록 없음</span>}
            </div>
          )}
          </div>
          <div className="modal-foot">
            {!draft._new&&isAdmin&&<button className="del" onClick={()=>removeTask(draft)}>삭제</button>}
            {!draft._new&&canEdit&&<button className="btn ghost" onClick={()=>duplicateTask(draft)}>복사</button>}
            {!draft._new&&canEdit&&!draft.archived&&<button className="btn ghost" onClick={()=>{setArchivedFlag(draft,true);setDraft(null);}}>보관</button>}
            {!draft._new&&canEdit&&draft.owner&&draft.owner!==me&&<button className="btn ghost" style={{color:"#0C66E4",borderColor:"#0C66E4"}} onClick={()=>{sendManualNotif(draft,draft.owner);alert(`${draft.owner}님에게 알림을 보냈습니다.`);}}>📬 알림 전송</button>}
            <span className="spacer" />
            <button className="btn ghost" onClick={()=>setDraft(null)}>닫기</button>
            <button className="btn" onClick={saveDraft} style={{background:"#0C66E4",color:"#fff"}}>저장</button>         </div>
        </div></div>
      )}
    </div>
  );
}
