import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";

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
const BOARD_REF = () => doc(db, "board", "main");
const ME_KEY = "wb-me";
const PASSWORD = "shakebaby2024";
const LOG_CAP = 400;

const COLUMNS = [
  { id: "todo", label: "대기" },
  { id: "doing", label: "진행중" },
  { id: "review", label: "검토·컨펌" },
  { id: "issuecol", label: "이슈" },
  { id: "done", label: "완료" },
];
const BOARDS = ["공용","김현민","김찬"];
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
const PRIORITIES = [{ id:"high",label:"높음",rank:0 },{ id:"mid",label:"보통",rank:1 },{ id:"low",label:"낮음",rank:2 }];
const REPEATS = [{ id:"none",label:"반복 없음" },{ id:"daily",label:"매일" },{ id:"weekly",label:"매주" },{ id:"biweekly",label:"격주" },{ id:"monthly",label:"매월" }];
const ROLES = [{ id:"admin",label:"관리자" },{ id:"member",label:"멤버" },{ id:"viewer",label:"뷰어" }];

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,7);
const todayStr = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
const dayDiff = (d) => !d ? null : Math.round((new Date(d+"T00:00:00") - new Date(todayStr()+"T00:00:00")) / 86400000);
const fmtTs = (ts) => { const d=new Date(ts),p=(n)=>String(n).padStart(2,"0"); return `${String(d.getFullYear()).slice(2)}.${p(d.getMonth()+1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`; };
const nextDue = (due, repeat) => { const b=due?new Date(due+"T00:00:00"):new Date(); if(repeat==="daily")b.setDate(b.getDate()+1); else if(repeat==="weekly")b.setDate(b.getDate()+7); else if(repeat==="biweekly")b.setDate(b.getDate()+14); else if(repeat==="monthly")b.setMonth(b.getMonth()+1); else return due; return b.toISOString().slice(0,10); };
const addDays=(ds,n)=>{const d=new Date(ds+"T00:00:00");d.setDate(d.getDate()+n);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;};
const weekOf=(ds)=>{const d=new Date(ds+"T00:00:00");const dow=d.getDay();const mon=dow===0?-6:1-dow;const start=addDays(ds,mon);return Array.from({length:7},(_,i)=>addDays(start,i));};
const DOW=["월","화","수","목","금","토","일"];
const monthGrid=(y,m)=>{const first=new Date(y,m,1);const startPad=(first.getDay()+6)%7;const last=new Date(y,m+1,0).getDate();const cells=[];for(let i=0;i<startPad;i++)cells.push(null);for(let i=1;i<=last;i++){const mm=String(m+1).padStart(2,"0"),dd=String(i).padStart(2,"0");cells.push(`${y}-${mm}-${dd}`);}while(cells.length%7!==0)cells.push(null);return cells;};
const streakOf=(ck,from)=>{let n=0,cur=from;while(ck&&ck[cur]){n++;cur=addDays(cur,-1);}return n;};
const emptyData = () => ({ tasks:[],routines:[],checkitems:[],members:[],channels:DEFAULT_CHANNELS,channelsUpdatedAt:0,types:TYPES,typesUpdatedAt:0,log:[],updatedAt:0 });
function mergeData(r,l) {
  r=r||emptyData(); l=l||emptyData();
  const map=new Map(); [...(r.tasks||[]),...(l.tasks||[])].forEach(t=>{const p=map.get(t.id);if(!p||(t.updatedAt||0)>(p.updatedAt||0))map.set(t.id,t);});
  const rm=new Map(); [...(r.routines||[]),...(l.routines||[])].forEach(t=>{const p=rm.get(t.id);if(!p||(t.updatedAt||0)>(p.updatedAt||0))rm.set(t.id,t);});
  const cm=new Map(); [...(r.checkitems||[]),...(l.checkitems||[])].forEach(t=>{const p=cm.get(t.id);if(!p||(t.updatedAt||0)>(p.updatedAt||0))cm.set(t.id,t);});
  const lm=new Map(); [...(r.log||[]),...(l.log||[])].forEach(e=>lm.set(e.id,e));
  const mm=new Map(); [...(r.members||[]),...(l.members||[])].forEach(m=>{const p=mm.get(m.name);if(!p||(m.updatedAt||0)>=(p.updatedAt||0))mm.set(m.name,m);});
  const uc=(l.channelsUpdatedAt||0)>=(r.channelsUpdatedAt||0);
  return { tasks:[...map.values()],routines:[...rm.values()],checkitems:[...cm.values()],members:[...mm.values()],channels:(uc?l.channels:r.channels)||DEFAULT_CHANNELS,channelsUpdatedAt:Math.max(l.channelsUpdatedAt||0,r.channelsUpdatedAt||0),types:((l.typesUpdatedAt||0)>=(r.typesUpdatedAt||0)?l.types:r.types)||TYPES,typesUpdatedAt:Math.max(l.typesUpdatedAt||0,r.typesUpdatedAt||0),log:[...lm.values()].sort((a,b)=>b.ts-a.ts).slice(0,LOG_CAP),updatedAt:Date.now() };
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
.due{display:inline-flex;align-items:center;gap:4px;padding:2px 7px;border-radius:4px;background:#EBECF0;font-size:11.5px;font-weight:600;}
.due.late{background:#FFECEB;color:var(--danger);}
.due.soon{background:#FFF7D6;color:var(--warn);}
.pri{font-size:11px;font-weight:700;padding:2px 7px;border-radius:4px;background:#EBECF0;color:var(--ink2);}
.pri.high{background:#FFECEB;color:var(--danger);}
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
.mask{position:fixed;inset:0;background:rgba(9,30,66,.54);display:flex;align-items:flex-start;justify-content:center;padding:36px 14px;overflow-y:auto;z-index:50;}
.modal{background:var(--card);border-radius:12px;box-shadow:var(--sh2);width:100%;max-width:580px;padding:0;display:flex;flex-direction:column;max-height:90vh;}
.modal h2{font-size:19px;font-weight:800;margin:0;padding:20px 24px 16px;border-bottom:1px solid var(--line);letter-spacing:-.02em;}
.modal-body{flex:1;overflow-y:auto;padding:20px 24px;}
.modal-foot{padding:16px 24px;border-top:1px solid var(--line);display:flex;gap:8px;align-items:center;}
.modal.sm{max-width:520px;}
.modal.sm h2{padding:36px 40px 16px;font-size:22px;text-align:center;border-bottom:none;}
.modal.sm .modal-body{padding:0 40px 8px;text-align:center;font-size:15px;color:var(--ink2);line-height:1.8;}
.modal.sm .modal-foot{padding:24px 40px 36px;justify-content:center;gap:12px;}
.modal.sm .modal-foot .spacer{display:none;}
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
.addrow button{background:var(--pri);color:#fff;padding:8px 14px;font-size:13.5px;font-weight:600;border-radius:6px;}
.cmt{border-left:3px solid var(--line2);padding:5px 0 5px 11px;margin-bottom:10px;}
.cmt .ch2{font-size:12px;color:var(--ink3);margin-bottom:4px;font-weight:500;}
.cmt .ch2 b{color:var(--ink2);font-weight:700;}
.cmt p{font-size:14px;line-height:1.55;white-space:pre-wrap;word-break:break-word;}
.hint{font-size:13px;color:var(--ink3);}

/* ── 진행률 ── */
.prow{display:flex;align-items:center;gap:12px;}
.ppct{font-size:26px;font-weight:800;color:var(--ok);min-width:66px;letter-spacing:-.02em;}
.prange{flex:1;-webkit-appearance:none;appearance:none;height:7px;background:#DFE1E6;outline:none;border-radius:4px;}
.prange::-webkit-slider-thumb{-webkit-appearance:none;width:22px;height:22px;border-radius:50%;background:#fff;border:3px solid var(--ok);cursor:pointer;box-shadow:var(--sh);}
.prange::-moz-range-thumb{width:22px;height:22px;border-radius:50%;background:#fff;border:3px solid var(--ok);cursor:pointer;}
.pbadge{font-size:12.5px;font-weight:700;border-radius:20px;padding:5px 12px;background:#EBECF0;color:var(--ink2);white-space:nowrap;}
.pticks{display:flex;justify-content:space-between;font-size:11.5px;color:var(--ink3);margin-top:5px;padding-left:78px;font-weight:600;}

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
.fccheck{width:20px;height:20px;border:2px solid var(--line2);border-radius:5px;background:var(--card);font-size:11px;color:var(--ok);flex-shrink:0;font-weight:900;display:flex;align-items:center;justify-content:center;}
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
.ckrow{background:var(--card);border-radius:8px;box-shadow:var(--sh);padding:11px 13px;}
.ckrow:hover{box-shadow:var(--sh2);}
.ckrow.over{box-shadow:0 0 0 1.5px #E2445C,var(--sh);}
.ckrow.done{opacity:.6;}
.ckrow[draggable=true]{cursor:grab;}
.ckrow.dragging{opacity:.4;cursor:grabbing;box-shadow:0 0 0 2px var(--pri),var(--sh);}
.ckrowmain{display:flex;align-items:flex-start;gap:11px;}
.ckbox{width:24px;height:24px;border:2px solid #A9B0A6;border-radius:6px;background:#fff;font-size:13px;color:var(--ok);flex-shrink:0;font-weight:900;display:flex;align-items:center;justify-content:center;margin-top:1px;box-shadow:inset 0 0 0 1px rgba(0,0,0,.02);}
.ckbox:hover{border-color:var(--ok);background:#F5FBF7;}
.ckbox.on{background:var(--ok);border-color:var(--ok);color:#fff;}
.ckbox.sm{width:19px;height:19px;font-size:11px;}
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

`;

function LoginScreen() {
  const [pw, setPw] = useState("");
  const tryLogin = (val) => {
    if (val === PASSWORD) { sessionStorage.setItem("wb-auth","1"); window.location.reload(); }
    else { alert("비밀번호가 틀렸습니다."); setPw(""); }
  };
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",background:"#EDEFEC",gap:12}}>
      <div style={{fontSize:22,fontWeight:800}}>업무 보드</div>
      <div style={{fontSize:13,color:"#8F959C",marginBottom:8}}>비밀번호를 입력하세요</div>
      <input type="password" autoFocus value={pw} onChange={(e)=>setPw(e.target.value)} onKeyDown={(e)=>e.key==="Enter"&&tryLogin(e.target.value)} placeholder="비밀번호" style={{padding:"10px 14px",fontSize:14,border:"1px solid #C4C9C1",width:240,outline:"none"}} />
      <button onClick={()=>tryLogin(pw)} style={{background:"#1B4D3E",color:"#fff",border:"none",padding:"10px 24px",fontSize:13,fontWeight:600,cursor:"pointer",width:240}}>입장</button>
    </div>
  );
}

export default function App() {
  if (sessionStorage.getItem("wb-auth") !== "1") return <LoginScreen />;
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
  const [newType, setNewType] = useState("");
  const [ckDrag, setCkDrag] = useState(null);
  const [confirmBox, setConfirmBox] = useState(null);
  const [newChannel, setNewChannel] = useState("");
  const [newSub, setNewSub] = useState("");
  const [subTarget, setSubTarget] = useState(null);
  const [grpBy, setGrpBy] = useState("status");
  const [collapsed, setCollapsed] = useState({});
  const [curBoard, setCurBoard] = useState("공용");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [rOwner, setROwner] = useState("전체");
  const [rQuery, setRQuery] = useState("");
  const [issueDetail, setIssueDetail] = useState(null);
  const [ckDraft, setCkDraft] = useState(null);
  const [ckExpand, setCkExpand] = useState({});
  const [listDateFrom, setListDateFrom] = useState("");
  const [listDateTo, setListDateTo] = useState("");
  const [rDate, setRDate] = useState(todayStr());
  const [selR, setSelR] = useState(null);
  const [rDraft, setRDraft] = useState(null);
  const [issueText, setIssueText] = useState("");
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
      const base=remote&&Array.isArray(remote.tasks)?{...emptyData(),...remote,checkitems:Array.isArray(remote.checkitems)?remote.checkitems:[]}:emptyData();
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

  const sortFn=useCallback((a,b)=>{ if(sortBy==="due"){if(!a.due&&!b.due)return 0;if(!a.due)return 1;if(!b.due)return -1;return a.due<b.due?-1:1;} if(sortBy==="pri"){const r=(t)=>PRIORITIES.find((p)=>p.id===t.priority)?.rank??1;return r(a)-r(b);} return(b.updatedAt||0)-(a.updatedAt||0); },[sortBy]);
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
  const openNew=(status)=>setDraft({_new:true,id:uid(),boardId:curBoard,title:"",channel:data.channels[0]?.id||"공통",type:"채널운영",owner:me,start:"",due:"",priority:"mid",memo:"",progress:0,status:status||"todo",tags:[],checklist:[],links:[],comments:[],issues:[],repeat:"none",archived:false,deleted:false});
  const openTask=(t)=>setDraft({...t,boardId:t.boardId||"공용",start:t.start||"",tags:[...(t.tags||[])],checklist:[...(t.checklist||[])],links:[...(t.links||[])],comments:[...(t.comments||[])],issues:[...(t.issues||[])]});

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
    else{const diffs=[];if(before){if(before.title!==clean.title)diffs.push("업무명");if(before.status!==clean.status)diffs.push(`상태 -> ${COLUMNS.find((c)=>c.id===clean.status)?.label}`);if(before.owner!==clean.owner)diffs.push(`담당자 -> ${clean.owner||"미지정"}`);if(before.due!==clean.due)diffs.push(`마감 -> ${clean.due||"없음"}`);if(before.priority!==clean.priority)diffs.push("우선순위");if(before.channel!==clean.channel)diffs.push(`채널 -> ${clean.channel}`);if((before.comments||[]).length!==(clean.comments||[]).length)diffs.push("댓글");}logs.push(mkLog("업무 수정",clean,diffs.join(", ")||"내용 변경"));}
    let spawn=null;
    if(clean.status==="done"&&before?.status!=="done"&&clean.repeat!=="none"){spawn={...clean,id:uid(),status:"todo",due:nextDue(clean.due,clean.repeat),checklist:(clean.checklist||[]).map((c)=>({...c,id:uid(),done:false})),comments:[],createdAt:now,createdBy:me,updatedAt:now,doneAt:null};logs.push(mkLog("반복 생성",spawn,`다음 마감 ${spawn.due}`));}
    commit((d)=>{const ex=d.tasks.some((t)=>t.id===clean.id);const rec={...clean,createdAt:before?.createdAt||now,createdBy:before?.createdBy||me,updatedAt:now,updatedBy:me,doneAt:clean.status==="done"?(before?.doneAt||now):null};let tasks=ex?d.tasks.map((t)=>t.id===rec.id?rec:t):[rec,...d.tasks];if(spawn)tasks=[spawn,...tasks];return{...d,tasks};},logs);
    setDraft(null);
  };

  const moveTask=(task,statusId)=>{if(!canEdit||task.status===statusId)return;const now=Date.now();const logs=[mkLog("상태 변경",task,`${COLUMNS.find((c)=>c.id===task.status)?.label} -> ${COLUMNS.find((c)=>c.id===statusId)?.label}`)];let spawn=null;if(statusId==="done"&&task.repeat&&task.repeat!=="none"){spawn={...task,id:uid(),status:"todo",due:nextDue(task.due,task.repeat),checklist:(task.checklist||[]).map((c)=>({...c,id:uid(),done:false})),comments:[],createdAt:now,createdBy:me,updatedAt:now,doneAt:null};logs.push(mkLog("반복 생성",spawn,`다음 마감 ${spawn.due}`));}commit((d)=>{let tasks=d.tasks.map((t)=>t.id===task.id?{...t,status:statusId,updatedAt:now,updatedBy:me,doneAt:statusId==="done"?(t.doneAt||now):null}:t);if(spawn)tasks=[spawn,...tasks];return{...d,tasks};},logs);if(statusId==="done"&&task.status!=="done"){setConfirmBox({kind:"archiveOne",taskId:task.id,taskTitle:task.title});}};
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
  /* ── 반복 업무 ── */
  const routines = useMemo(()=>(data.routines||[]).filter((r)=>!r.deleted),[data.routines]);
  const routineById=(id)=>routines.find((r)=>r.id===id);

  const saveRoutine=()=>{
    if(!rDraft.title.trim())return;
    const now=Date.now(); const isNew=rDraft._new; const clean={...rDraft}; delete clean._new;
    commit((d)=>{const list=d.routines||[];const ex=list.some((r)=>r.id===clean.id);
      const rec={...clean,checkins:clean.checkins||{},issues:clean.issues||[],fixedChecks:clean.fixedChecks||[],fixedState:clean.fixedState||{},createdAt:clean.createdAt||now,updatedAt:now,updatedBy:me};
      return{...d,routines:ex?list.map((r)=>r.id===rec.id?rec:r):[...list,rec]};},
      [{id:uid(),ts:now,who:me||"익명",taskId:clean.id,taskTitle:clean.title,action:isNew?"반복업무 생성":"반복업무 수정",detail:clean.when}]);
    setRDraft(null);
  };

  const toggleCheck=(r,date)=>{
    if(!canEdit)return;
    const has=!!(r.checkins||{})[date];
    const now=Date.now();
    commit((d)=>({...d,routines:(d.routines||[]).map((x)=>{
      if(x.id!==r.id)return x;
      const c={...(x.checkins||{})};
      if(has)delete c[date]; else c[date]={by:me||"익명",ts:now};
      return{...x,checkins:c,updatedAt:now,updatedBy:me};
    })}),[{id:uid(),ts:now,who:me||"익명",taskId:r.id,taskTitle:r.title,action:has?"체크 해제":"체크 완료",detail:date}]);
  };

  const removeRoutine=(r)=>{
    commit((d)=>({...d,routines:(d.routines||[]).map((x)=>x.id===r.id?{...x,deleted:true,updatedAt:Date.now()}:x)}),
      [{id:uid(),ts:Date.now(),who:me||"익명",taskId:r.id,taskTitle:r.title,action:"반복업무 삭제",detail:""}]);
    setSelR(null); setRDraft(null);
  };

  const addIssue=(r,text)=>{
    const t=text.trim(); if(!t)return;
    const iss={id:uid(),text:t,author:me||"익명",ts:Date.now(),date:rDate,resolved:false};
    commit((d)=>({...d,routines:(d.routines||[]).map((x)=>x.id===r.id?{...x,issues:[iss,...(x.issues||[])],updatedAt:Date.now()}:x)}),
      [{id:uid(),ts:Date.now(),who:me||"익명",taskId:r.id,taskTitle:r.title,action:"이슈 등록",detail:t.slice(0,30)}]);
    setIssueText("");
  };

  const toggleIssue=(rid,iid)=>{
    commit((d)=>({...d,routines:(d.routines||[]).map((x)=>x.id!==rid?x:{...x,issues:(x.issues||[]).map((i)=>i.id===iid?{...i,resolved:!i.resolved,resolvedBy:me}:i),updatedAt:Date.now()})}),[]);
  };

  const delIssue=(rid,iid)=>{
    commit((d)=>({...d,routines:(d.routines||[]).map((x)=>x.id!==rid?x:{...x,issues:(x.issues||[]).filter((i)=>i.id!==iid),updatedAt:Date.now()})}),[]);
  };

  const allIssues=useMemo(()=>{
    const out=[];
    routines.forEach((r)=>(r.issues||[]).forEach((i)=>out.push({...i,routineId:r.id,routineTitle:r.title,owner:r.owner,src:"반복"})));
    data.tasks.filter((t)=>!t.deleted&&!t.archived).forEach((t)=>(t.issues||[]).forEach((i)=>out.push({...i,taskId:t.id,routineTitle:t.title,owner:t.owner,src:"업무"})));
    return out.sort((a,b)=>b.ts-a.ts);
  },[routines,data.tasks]);

  const week=useMemo(()=>weekOf(rDate),[rDate]);
  const dayRate=useCallback((date)=>{
    if(!routines.length)return 0;
    return routines.filter((r)=>(r.checkins||{})[date]).length/routines.length;
  },[routines]);

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
  const toggleCk=(c)=>{if(!canEdit)return;const willDone=!c.done;commit((d)=>({...d,checkitems:(d.checkitems||[]).map((x)=>x.id===c.id?{...x,done:willDone,doneAt:willDone?Date.now():null,updatedAt:Date.now()}:x)}),[{id:uid(),ts:Date.now(),who:me||"익명",taskId:c.id,taskTitle:c.title,action:c.done?"체크 해제":"체크 완료",detail:""}]);if(willDone)setConfirmBox({kind:"archiveCk",ckId:c.id,ckTitle:c.title});};
  const reorderCk=(tab,fromId,toId)=>{
    if(!canEdit||fromId===toId)return;
    const ordered=ckByTab(tab).filter((c)=>!c.done);
    const fromIdx=ordered.findIndex((c)=>c.id===fromId);
    const toIdx=ordered.findIndex((c)=>c.id===toId);
    if(fromIdx<0||toIdx<0)return;
    const arr=[...ordered];
    const [moved]=arr.splice(fromIdx,1);
    arr.splice(toIdx,0,moved);
    const now=Date.now();
    commit((d)=>({...d,checkitems:(d.checkitems||[]).map((x)=>{
      const pos=arr.findIndex((a)=>a.id===x.id);
      return pos>=0?{...x,order:pos,updatedAt:now}:x;
    })}),[]);
  };
  const removeCk=(c)=>{commit((d)=>({...d,checkitems:(d.checkitems||[]).map((x)=>x.id===c.id?{...x,deleted:true,updatedAt:Date.now()}:x)}),[{id:uid(),ts:Date.now(),who:me||"익명",taskId:c.id,taskTitle:c.title,action:"체크항목 삭제",detail:""}]);setCkDraft(null);};
  const clearCkTab=(tab)=>{commit((d)=>({...d,checkitems:(d.checkitems||[]).map((x)=>x.tab===tab&&!x.deleted?{...x,done:false,doneAt:null,subs:(x.subs||[]).map((s)=>({...s,done:false})),updatedAt:Date.now()}:x)}),[{id:uid(),ts:Date.now(),who:me||"익명",taskId:null,taskTitle:"",action:"체크 전체 해제",detail:CKTABS.find((t)=>t.id===tab)?.label||""}]);};
  const toggleSub=(c,subId)=>{if(!canEdit)return;commit((d)=>({...d,checkitems:(d.checkitems||[]).map((x)=>x.id===c.id?{...x,subs:(x.subs||[]).map((s)=>s.id===subId?{...s,done:!s.done}:s),updatedAt:Date.now()}:x)}),[]);};

  const exportJson=()=>{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(dataRef.current,null,2)],{type:"application/json"}));a.download=`work-board-${todayStr()}.json`;a.click();};
  const importJson=async(file)=>{try{const p=JSON.parse(await file.text());if(!Array.isArray(p.tasks))throw new Error();commit((d)=>mergeData(d,{...emptyData(),...p}),[mkLog("백업 가져오기",null,`${p.tasks.length}건`)]);} catch(e){alert("읽을 수 없는 파일입니다.");}};

  useEffect(()=>{const h=(e)=>{if(e.key==="Escape"){setDraft(null);setConfirmBox(null);}};window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h);},[]);

  const renderCard=(t)=>{
    const d=dayDiff(t.due),late=d!==null&&d<0&&t.status!=="done",soon=d!==null&&d>=0&&d<=2&&t.status!=="done";
    const ck=t.checklist||[],ckDone=ck.filter((c)=>c.done).length;
    return(
      <div key={t.id} className={"card"+(late?" late":"")+(t.status==="done"?" done":"")+(dragId===t.id?" drag":"")} style={{"--ch":chColor(t.channel)}}
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
            {t.owner?<span className="ownerchip">{t.owner}</span>:<span style={{color:"var(--ink3)"}}>미지정</span>}
            {t.due&&<span className={"due"+(late?" late":soon?" soon":"")}>{t.start?t.start.slice(5)+"~":""}{t.due.slice(5)}{late?` +${Math.abs(d)}d`:""}</span>}
          </span>
          <span style={{display:"flex",gap:6,alignItems:"center"}}>
            <span className="icons">{ck.length>0&&<span>☑{ckDone}/{ck.length}</span>}{!!(t.comments||[]).length&&<span>💬{t.comments.length}</span>}{!!(t.links||[]).length&&<span>🔗{t.links.length}</span>}</span>
            <span className={"pri"+(t.priority==="high"?" high":"")}>{PRIORITIES.find((p)=>p.id===t.priority)?.label}</span>
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
        <button className="ghostw" onClick={logout}>로그아웃</button>
      </div>
      <div className="tabs">
        {[{id:"board",label:"보드",n:live.length},{id:"routine",label:"반복업무",n:routines.length},{id:"checklist",label:"체크리스트",n:checkitems.filter((c)=>!c.done).length},{id:"issue",label:"이슈",n:allIssues.filter((i)=>!i.resolved).length},{id:"archive",label:"보관함",n:archived.length},{id:"log",label:"변경 이력",n:null},{id:"team",label:"팀·설정",n:null}].map((t)=>(
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
        <div className="board">{COLUMNS.map((col)=>{const items=visible.filter((t)=>t.status===col.id);return(
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
        const sel=selR?routineById(selR):null;
        const rFiltered=routines.filter((r)=>{
          if(rOwner!=="전체"&&r.owner!==rOwner)return false;
          if(rQuery.trim()){const kw=rQuery.trim().toLowerCase();if(!`${r.title} ${r.memo||""} ${r.owner||""}`.toLowerCase().includes(kw))return false;}
          return true;
        });
        const grouped={"오전":rFiltered.filter((r)=>r.when==="오전"),"오후":rFiltered.filter((r)=>r.when!=="오전")};
        const doneToday=rFiltered.filter((r)=>(r.checkins||{})[rDate]).length;
        const rOwners=[...new Set(routines.map((r)=>r.owner).filter(Boolean))].sort();
        return (
        <div className="rwrap">
          <div>
            <div className="panel" style={{padding:14,marginBottom:12}}>
              <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",marginBottom:10}}>
                <div>
                  <div style={{fontSize:14,fontWeight:800}}>반복 업무</div>
                  <div style={{fontFamily:"monospace",fontSize:11,color:"#8F959C",marginTop:3}}>
                    {rDate.replace(/-/g,".")} · 오늘 {doneToday}/{rFiltered.length}
                  </div>
                </div>
                <div style={{display:"flex",gap:6}}>
                  <button className="btn ghost" onClick={()=>setRDate(todayStr())}>오늘</button>
                  {canEdit&&<button className="btn-save" onClick={()=>setRDraft({_new:true,id:uid(),title:"",when:"오전",owner:me,memo:"",checkins:{},issues:[],fixedChecks:[]})}>+ 추가</button>}
                </div>
              </div>
              <div className="rfilters">
                <input className="inp" placeholder="반복업무 검색" value={rQuery} onChange={(e)=>setRQuery(e.target.value)} style={{flex:1,minWidth:120}} />
                <select className="sel" value={rOwner} onChange={(e)=>setROwner(e.target.value)}>
                  <option value="전체">담당자 전체</option>
                  {rOwners.map((o)=><option key={o} value={o}>{o}</option>)}
                </select>
                <input type="date" className="sel" value={rDate} onChange={(e)=>e.target.value&&setRDate(e.target.value)} />
              </div>
              <div className="wkstrip">
                {week.map((d)=>{
                  const rate=dayRate(d); const isSel=d===rDate; const isToday=d===todayStr();
                  const deg=Math.round(rate*360);
                  return (
                    <button key={d} className={"wkday"+(isSel?" sel":"")} onClick={()=>setRDate(d)}>
                      <span className="dw">{DOW[(new Date(d+"T00:00:00").getDay()+6)%7]}</span>
                      <span className={"dn"+(isToday?" td":"")}>{Number(d.slice(8))}</span>
                      <span className="ring" style={{background:`conic-gradient(#1B4D3E ${deg}deg, #E4E7E2 ${deg}deg)`}}><i /></span>
                    </button>
                  );
                })}
              </div>
            </div>

            {routines.length===0&&<div className="empty">반복 업무를 추가해 시작하세요</div>}
            {["오전","오후"].map((slot)=>grouped[slot].length>0&&(
              <div key={slot} style={{marginBottom:14}}>
                <div style={{fontFamily:"monospace",fontSize:10,letterSpacing:".1em",color:"#8F959C",marginBottom:7}}>
                  {slot} <span style={{color:"#C4C9C1"}}>{grouped[slot].length}</span>
                </div>
                {grouped[slot].map((r)=>{
                  const ck=r.checkins||{}; const on=!!ck[rDate];
                  const total=Object.keys(ck).length; const st=streakOf(ck,rDate);
                  const openIss=(r.issues||[]).filter((i)=>!i.resolved).length;
                  return (
                    <div key={r.id} className={"rrow"+(on?" on":"")+(selR===r.id?" sel":"")} onClick={()=>setSelR(r.id)}>
                      <div style={{flex:1,minWidth:0}}>
                        <div className="rtitle">{r.title}</div>
                        <div className="rmeta">
                          <span>총 {total}일</span><span>연속 {st}일</span>
                          {r.owner&&<span>· {r.owner}</span>}
                          {openIss>0&&<span style={{color:"#B4342F",fontWeight:600}}>⚠ 이슈 {openIss}</span>}
                          {on&&ck[rDate].by&&<span style={{color:"#1B4D3E"}}>✓ {ck[rDate].by}</span>}
                        </div>
                      </div>
                      <button className={"rcheck"+(on?" on":"")} disabled={!canEdit}
                        onClick={(e)=>{e.stopPropagation();toggleCheck(r,rDate);}}>{on?"✓":""}</button>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="rside">
            {!sel&&<div className="panel" style={{textAlign:"center",padding:"36px 18px"}}>
              <div style={{fontSize:20,marginBottom:8}}>↻</div>
              <div style={{fontSize:13,fontWeight:700,marginBottom:6}}>반복 업무를 선택하세요</div>
              <div className="hint" style={{lineHeight:1.6}}>월간 체크 수, 총 체크 수, 비율과 연속 기록,<br/>담당자·비고·이슈가 여기에 표시됩니다.</div>
            </div>}
            {sel&&(()=>{
              const ck=sel.checkins||{};
              const y=Number(rDate.slice(0,4)),m=Number(rDate.slice(5,7))-1;
              const cells=monthGrid(y,m);
              const monthKeys=Object.keys(ck).filter((k)=>k.startsWith(rDate.slice(0,7)));
              const daysInMonth=new Date(y,m+1,0).getDate();
              const total=Object.keys(ck).length;
              const st=streakOf(ck,rDate);
              const openIss=(sel.issues||[]).filter((i)=>!i.resolved);
              return (
              <div className="panel">
                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8,marginBottom:14}}>
                  <div>
                    <div style={{fontSize:15,fontWeight:800,letterSpacing:"-.02em"}}>{sel.title}</div>
                    <div style={{fontFamily:"monospace",fontSize:10.5,color:"#8F959C",marginTop:3}}>{sel.when} · 담당 {sel.owner||"미지정"}</div>
                  </div>
                  <button style={{background:"none",border:"none",fontSize:16,color:"#8F959C",cursor:"pointer"}} onClick={()=>setSelR(null)}>×</button>
                </div>

                <div className="rstats">
                  <div className="rstat"><span className="k">월간 체크</span><span className="v">{monthKeys.length}일</span></div>
                  <div className="rstat"><span className="k">총 체크</span><span className="v">{total}일</span></div>
                  <div className="rstat"><span className="k">월 달성률</span><span className="v">{Math.round(monthKeys.length/daysInMonth*100)}%</span></div>
                  <div className="rstat"><span className="k">연속</span><span className="v">{st}일</span></div>
                </div>

                <div className="calhead">
                  <button onClick={()=>setRDate(addDays(rDate.slice(0,8)+"01",-1))}>‹</button>
                  <span>{y}년 {m+1}월</span>
                  <button onClick={()=>{const nd=new Date(y,m+1,1);setRDate(nd.toISOString().slice(0,10));}}>›</button>
                </div>
                <div className="cal">
                  {DOW.map((d)=><span key={d} className="cdw">{d}</span>)}
                  {cells.map((c,i)=>{
                    if(!c)return <span key={i} className="ccell mute" />;
                    const on=!!ck[c]; const isToday=c===todayStr(); const isSel=c===rDate;
                    return <button key={i} className={"ccell"+(on?" on":"")+(isToday?" td":"")+(isSel?" sel":"")}
                      title={on?`${ck[c].by} 체크`:""} onClick={()=>{setRDate(c);}}
                      onDoubleClick={()=>toggleCheck(sel,c)}>{on?"✓":Number(c.slice(8))}</button>;
                  })}
                </div>
                <div className="hint" style={{marginTop:6,fontSize:10.5}}>날짜를 더블클릭하면 체크가 토글됩니다.</div>

                <div className="sect"><h4>담당자</h4>
                  <input list="wb-owners" disabled={!canEdit} defaultValue={sel.owner||""}
                    onBlur={(e)=>{const v=e.target.value.trim();if(v===(sel.owner||""))return;commit((d)=>({...d,routines:(d.routines||[]).map((x)=>x.id===sel.id?{...x,owner:v,updatedAt:Date.now(),updatedBy:me}:x)}),[mkLog("담당자 변경",sel,v)]);}}
                    placeholder="담당자 이름" style={{width:"100%",background:"#FBFCFA",border:"1px solid #C4C9C1",padding:"7px 9px",fontSize:13}} />
                </div>

                <div className="sect"><h4>비고 · 메모</h4>
                  <textarea disabled={!canEdit} defaultValue={sel.memo||""} placeholder="이 반복 업무에 대한 참고 사항, 절차, 확인 포인트"
                    onBlur={(e)=>{const v=e.target.value;if(v===(sel.memo||""))return;commit((d)=>({...d,routines:(d.routines||[]).map((x)=>x.id===sel.id?{...x,memo:v,updatedAt:Date.now(),updatedBy:me}:x)}),[mkLog("메모 수정",sel,"")]);}}
                    style={{width:"100%",background:"#FBFCFA",border:"1px solid #C4C9C1",padding:"7px 9px",fontSize:13,minHeight:70,lineHeight:1.5,resize:"vertical"}} />
                </div>

                <div className="sect"><h4>고정 체크리스트 <span style={{fontWeight:500,color:"var(--ink3)"}}>· {rDate.slice(5).replace("-","/")}</span></h4>
                  <p className="hint" style={{marginBottom:8}}>항목은 매일 고정으로 뜨고, 체크 여부는 날짜별로 따로 기록됩니다.</p>
                  {(sel.fixedChecks||[]).length===0&&<span className="hint">항목이 없습니다. 아래에서 추가하세요.</span>}
                  {(sel.fixedChecks||[]).map((fc)=>{
                    const dayKey=rDate;
                    const done=!!((sel.fixedState||{})[dayKey]||{})[fc.id];
                    return (
                      <div key={fc.id} className="fcitem">
                        <button className={"fccheck"+(done?" on":"")} disabled={!canEdit} onClick={()=>{
                          commit((d)=>({...d,routines:(d.routines||[]).map((x)=>{
                            if(x.id!==sel.id)return x;
                            const fs={...(x.fixedState||{})};
                            const day={...(fs[dayKey]||{})};
                            if(day[fc.id])delete day[fc.id]; else day[fc.id]={by:me||"익명",ts:Date.now()};
                            fs[dayKey]=day;
                            return {...x,fixedState:fs,updatedAt:Date.now()};
                          })}),[]);
                        }}>{done?"✓":""}</button>
                        <span style={{flex:1,fontSize:13,textDecoration:done?"line-through":"none",color:done?"var(--ink3)":"inherit"}}>{fc.text}</span>
                        {canEdit&&<button style={{background:"none",border:"none",color:"var(--ink3)",cursor:"pointer",fontSize:15}} onClick={()=>{
                          commit((d)=>({...d,routines:(d.routines||[]).map((x)=>x.id===sel.id?{...x,fixedChecks:(x.fixedChecks||[]).filter((y)=>y.id!==fc.id),updatedAt:Date.now()}:x)}),[]);
                        }}>×</button>}
                      </div>
                    );
                  })}
                  {canEdit&&<div className="addrow">
                    <input placeholder="체크 항목 입력 후 Enter" onKeyDown={(e)=>{
                      if(e.nativeEvent.isComposing||e.key!=="Enter")return;
                      const v=e.target.value.trim();if(!v)return;
                      const item={id:uid(),text:v};
                      commit((d)=>({...d,routines:(d.routines||[]).map((x)=>x.id===sel.id?{...x,fixedChecks:[...(x.fixedChecks||[]),item],updatedAt:Date.now()}:x)}),[]);
                      e.target.value="";
                    }} />
                  </div>}
                </div>

                <div className="sect">
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                    <h4 style={{margin:0}}>이슈{openIss.length>0&&` · 미해결 ${openIss.length}`}</h4>
                    <button className="btn ghost" style={{padding:"4px 10px",fontSize:12}} onClick={()=>{setView("issue");setIssueFilter("all");}}>이슈 목록 전체보기 →</button>
                  </div>
                  {(sel.issues||[]).length===0&&<span className="hint">등록된 이슈가 없습니다</span>}
                  {(sel.issues||[]).map((i)=>(
                    <div key={i.id} className={"iss"+(i.resolved?" done":"")}>
                      <button className="issck" onClick={()=>toggleIssue(sel.id,i.id)}>{i.resolved?"✓":""}</button>
                      <div style={{flex:1,minWidth:0,cursor:"pointer"}} onClick={()=>setIssueDetail({...i,routineId:sel.id,routineTitle:sel.title,owner:sel.owner,src:"반복"})}>
                        <div className="isstext">{i.text}{(i.history||[]).length>0&&<span style={{fontSize:11,color:"var(--pri)",marginLeft:6,fontWeight:700}}>💬{(i.history||[]).length}</span>}</div>
                        <div className="issmeta">{i.author} · {fmtTs(i.ts)}{i.date&&` · ${i.date.slice(5)}`} · 클릭해 히스토리</div>
                      </div>
                      {canEdit&&<button style={{background:"none",border:"none",color:"#8F959C",cursor:"pointer"}} onClick={()=>delIssue(sel.id,i.id)}>×</button>}
                    </div>
                  ))}
                  <div className="addrow"><input placeholder="이슈 입력 후 Enter" value={issueText}
                    onChange={(e)=>setIssueText(e.target.value)}
                    onKeyDown={(e)=>{if(e.nativeEvent.isComposing||e.key!=="Enter")return;addIssue(sel,issueText);}} /></div>
                </div>

                <div className="mfoot">
                  {isAdmin&&<button className="del" onClick={()=>removeRoutine(sel)}>삭제</button>}
                  <span className="spacer" />
                  {canEdit&&<button className="btn ghost" onClick={()=>setRDraft({...sel})}>수정</button>}
                </div>
              </div>
              );
            })()}
          </div>
        </div>
        );})()}

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
                    {isCL&&canEdit&&items.length>0&&<button className="ckclear" onClick={()=>setConfirmBox({kind:"clearCk",tab:tab.id})}>전체 체크 해제</button>}
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
                        onDragStart={()=>setCkDrag(c.id)}
                        onDragOver={(e)=>{e.preventDefault();}}
                        onDrop={()=>{if(ckDrag)reorderCk(tab.id,ckDrag,c.id);setCkDrag(null);}}
                        onDragEnd={()=>setCkDrag(null)}
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
                <button className="btn ghost" onClick={()=>{
                  if(i.routineId){setView("routine");setSelR(i.routineId);}
                  else{const t=data.tasks.find((x)=>x.id===i.taskId);if(t){setView("board");openTask(t);}}
                }}>이동</button>
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
          ? COLUMNS.map((c)=>({key:c.id,label:c.label,color:STCOL[c.id],items:mdVisible.filter((t)=>t.status===c.id)}))
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
            const stCount=COLUMNS.map((c)=>({...c,n:items.filter((t)=>t.status===c.id).length,color:STCOL[c.id]})).filter((c)=>c.n>0);
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
                              {COLUMNS.map((c)=><option key={c.id} value={c.id}>{c.label}</option>)}
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

      {rDraft&&(
        <div className="mask" onClick={(e)=>e.target===e.currentTarget&&setRDraft(null)}><div className="modal sm">
          <h2>{rDraft._new?"새 반복 업무":"반복 업무 수정"}</h2>
          <div className="modal-body">
            <div className="fld"><label>업무명</label><input autoFocus value={rDraft.title} onChange={(e)=>setRDraft({...rDraft,title:e.target.value})} placeholder="예) 쿠팡 전 상품 가격·아이템위너 확인" /></div>
            <div className="r2">
              <div className="fld"><label>시간대</label><select value={rDraft.when} onChange={(e)=>setRDraft({...rDraft,when:e.target.value})}><option value="오전">오전</option><option value="오후">오후</option></select></div>
              <div className="fld"><label>담당자</label><input list="wb-owners" value={rDraft.owner||""} onChange={(e)=>setRDraft({...rDraft,owner:e.target.value})} placeholder="이름" /></div>
            </div>
            <div className="fld"><label>비고 · 메모</label><textarea value={rDraft.memo||""} onChange={(e)=>setRDraft({...rDraft,memo:e.target.value})} placeholder="확인 절차, 기준값, 참고 링크" /></div>
          </div>
          <div className="modal-foot">
            {!rDraft._new&&isAdmin&&<button className="del" onClick={()=>removeRoutine(rDraft)}>삭제</button>}
            <span className="spacer" />
            <button className="btn ghost" onClick={()=>setRDraft(null)}>취소</button>
            <button className="btn-save" onClick={saveRoutine}>저장</button>
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
                <input placeholder="진행 상황·조치 내용 입력 후 Enter" onKeyDown={(e)=>{
                  if(e.nativeEvent.isComposing||e.key!=="Enter")return;
                  addHistory(e.target.value);e.target.value="";
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
                  <div key={s.id} className="fcitem">
                    <button className={"fccheck"+(s.done?" on":"")} onClick={()=>setCkDraft({...ckDraft,subs:ckDraft.subs.map((x)=>x.id===s.id?{...x,done:!x.done}:x)})}>{s.done?"✓":""}</button>
                    <span style={{flex:1,fontSize:13,textDecoration:s.done?"line-through":"none",color:s.done?"var(--ink3)":"inherit"}}>{s.text}</span>
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
                <input placeholder="진행 상황·메모 입력 후 Enter" onKeyDown={(e)=>{
                  if(e.nativeEvent.isComposing||e.key!=="Enter")return;
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
            <span className="spacer" />
            <button className="btn ghost" onClick={()=>setCkDraft(null)}>닫기</button>
            <button className="btn-save" onClick={saveCk}>저장</button>
          </div>
        </div></div>
        );
      })()}

      {confirmBox&&(
        <div className="mask" onClick={(e)=>e.target===e.currentTarget&&setConfirmBox(null)}><div className="modal sm">
          <h2>{confirmBox.kind==="purge"?"영구 삭제할까요?":confirmBox.kind==="archiveOne"?"보관함으로 옮길까요?":confirmBox.kind==="clearCk"?"전체 지울까요?":confirmBox.kind==="archiveCk"?"목록에서 정리할까요?":"완료 업무를 보관할까요?"}</h2>
          <p style={{fontSize:12.5,color:"#565C64",lineHeight:1.6}}>{confirmBox.kind==="purge"?`보관함의 ${archived.length}건이 완전히 사라집니다.`:confirmBox.kind==="archiveOne"?`"${confirmBox.taskTitle}" 업무를 보관함으로 옮기시겠어요? 보드에서 사라지고 보관함에서 볼 수 있습니다.`:confirmBox.kind==="clearCk"?`${CKTABS.find((t)=>t.id===confirmBox.tab)?.label} 탭의 모든 항목이 삭제됩니다.`:confirmBox.kind==="archiveCk"?`"${confirmBox.ckTitle}" 항목을 완료 처리했습니다. 목록에서 삭제할까요? (남겨두면 아래쪽에 완료 상태로 표시됩니다)`:`완료 ${live.filter((t)=>t.status==="done").length}건이 보관함으로 이동합니다.`}</p>
          <div className="mfoot"><span className="spacer" />
            <button className="btn ghost" onClick={()=>setConfirmBox(null)}>{confirmBox.kind==="archiveOne"?"보드에 두기":confirmBox.kind==="archiveCk"?"남겨두기":"취소"}</button>
            <button className={confirmBox.kind==="purge"||confirmBox.kind==="clearCk"?"btn warn":"btn-save"} onClick={()=>{
              if(confirmBox.kind==="purge")purgeArchive();
              else if(confirmBox.kind==="clearCk"){clearCkTab(confirmBox.tab);setConfirmBox(null);}
              else if(confirmBox.kind==="archiveCk"){const cid=confirmBox.ckId;commit((d)=>({...d,checkitems:(d.checkitems||[]).map((x)=>x.id===cid?{...x,deleted:true,updatedAt:Date.now()}:x)}),[{id:uid(),ts:Date.now(),who:me||"익명",taskId:cid,taskTitle:confirmBox.ckTitle,action:"체크항목 정리",detail:""}]);setConfirmBox(null);}
              else if(confirmBox.kind==="archiveOne"){const tid=confirmBox.taskId;commit((d)=>({...d,tasks:d.tasks.map((t)=>t.id===tid?{...t,archived:true,updatedAt:Date.now(),updatedBy:me}:t)}),[mkLog("아카이브",{id:tid,title:confirmBox.taskTitle})]);setConfirmBox(null);}
              else archiveDone();
            }}>{confirmBox.kind==="purge"?"영구 삭제":confirmBox.kind==="clearCk"?"전체 삭제":confirmBox.kind==="archiveCk"?"삭제":"보관하기"}</button>
          </div>
        </div></div>
      )}

      {draft&&(
        <div className="mask" onClick={(e)=>e.target===e.currentTarget&&setDraft(null)}><div className="modal">
          <h2>{draft._new?"새 업무":"업무 상세"}</h2>
          <div className="modal-body">
          <div className="fld"><label>업무명</label><input autoFocus disabled={!canEdit} value={draft.title} onChange={(e)=>setDraft({...draft,title:e.target.value})} placeholder="예) 쿠팡 락토컷 상세페이지 개편" /></div>
          <div className="r2">
            <div className="fld"><label>채널</label><select disabled={!canEdit} value={draft.channel} onChange={(e)=>setDraft({...draft,channel:e.target.value})}>
              {topChannels.map((c)=>{
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
            <div className="fld"><label>상태</label><select disabled={!canEdit} value={draft.status} onChange={(e)=>setDraft({...draft,status:e.target.value})}>{COLUMNS.map((c)=><option key={c.id} value={c.id}>{c.label}</option>)}</select></div>
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
              <span className="pbadge">{COLUMNS.find((c)=>c.id===draft.status)?.label}</span>
            </div>
            <div className="pticks"><span>0</span><span>50</span><span>100</span></div>
          </div>
          <div className="fld"><label>메모</label><textarea disabled={!canEdit} value={draft.memo} onChange={(e)=>setDraft({...draft,memo:e.target.value})} placeholder="진행 상황, 공급사 회신, 참고 수치" /></div>
          <div className="sect"><h4>태그</h4>
            <div className="ctags">{(draft.tags||[]).map((g)=><span key={g} className="tag">{g}{canEdit&&<button className="x" style={{fontSize:11,marginLeft:3,border:"none",cursor:"pointer",background:"none"}} onClick={()=>setDraft({...draft,tags:draft.tags.filter((x)=>x!==g)})}>x</button>}</span>)}{!(draft.tags||[]).length&&<span className="hint">없음</span>}</div>
            {canEdit&&<div className="addrow"><input placeholder="태그 입력 후 Enter" onKeyDown={(e)=>{if(e.nativeEvent.isComposing)return;const v=e.target.value.trim();if(e.key==="Enter"&&v&&!(draft.tags||[]).includes(v)){setDraft({...draft,tags:[...(draft.tags||[]),v]});e.target.value="";}}} /></div>}
          </div>
          <div className="sect"><h4>세부 단계{(draft.checklist||[]).length>0&&` (${draft.checklist.filter((c)=>c.done).length}/${draft.checklist.length})`}</h4>
            {(draft.checklist||[]).map((c)=><div key={c.id} className="item"><input type="checkbox" checked={c.done} disabled={!canEdit} style={{width:"auto"}} onChange={()=>setDraft({...draft,checklist:draft.checklist.map((x)=>x.id===c.id?{...x,done:!x.done}:x)})} /><span style={{flex:1,textDecoration:c.done?"line-through":"none",color:c.done?"#8F959C":"inherit"}}>{c.text}</span>{canEdit&&<button style={{background:"none",border:"none",cursor:"pointer",color:"#8F959C"}} onClick={()=>setDraft({...draft,checklist:draft.checklist.filter((x)=>x.id!==c.id)})}>x</button>}</div>)}
            {!(draft.checklist||[]).length&&<span className="hint">없음</span>}
            {canEdit&&<div className="addrow"><input placeholder="단계 입력 후 Enter" onKeyDown={(e)=>{if(e.nativeEvent.isComposing)return;const v=e.target.value.trim();if(e.key==="Enter"&&v){setDraft({...draft,checklist:[...(draft.checklist||[]),{id:uid(),text:v,done:false}]});e.target.value="";}}} /></div>}
          </div>
          <div className="sect"><h4>링크 첨부</h4>
            {(draft.links||[]).map((l)=><div key={l.id} className="item"><span>🔗</span><a href={l.url} target="_blank" rel="noreferrer" style={{flex:1}}>{l.label||l.url}</a>{canEdit&&<button style={{background:"none",border:"none",cursor:"pointer",color:"#8F959C"}} onClick={()=>setDraft({...draft,links:draft.links.filter((x)=>x.id!==l.id)})}>x</button>}</div>)}
            {!(draft.links||[]).length&&<span className="hint">없음</span>}
            {canEdit&&<div className="addrow"><input placeholder="링크 붙여넣고 Enter" onKeyDown={(e)=>{if(e.nativeEvent.isComposing)return;const v=e.target.value.trim();if(e.key==="Enter"&&v){setDraft({...draft,links:[...(draft.links||[]),{id:uid(),url:v,label:""}]});e.target.value="";}}} /></div>}
          </div>
          <div className="sect"><h4>댓글{(draft.comments||[]).length>0&&` (${draft.comments.length})`}</h4>
            {(draft.comments||[]).map((c)=>(
              <div key={c.id} className="cmt">
                <div className="ch2"><b>{c.author}</b> · {fmtTs(c.ts)}{c.edited&&<span style={{fontSize:10,color:"var(--ink3)"}}> (수정됨)</span>}</div>
                {c.editing
                  ? <div style={{display:"flex",gap:6,marginTop:4}}>
                      <input defaultValue={c.text} autoFocus style={{flex:1,border:"1px solid var(--line2)",borderRadius:6,padding:"6px 9px",fontSize:14}}
                        onKeyDown={(e)=>{
                          if(e.nativeEvent.isComposing)return;
                          if(e.key==="Enter"&&!e.shiftKey){
                            const v=e.target.value.trim();if(!v)return;
                            setDraft({...draft,comments:draft.comments.map((x)=>x.id===c.id?{...x,text:v,edited:true,editing:false}:x)});
                          }
                          if(e.key==="Escape")setDraft({...draft,comments:draft.comments.map((x)=>x.id===c.id?{...x,editing:false}:x)});
                        }} />
                      <button className="btn ghost" onClick={()=>setDraft({...draft,comments:draft.comments.map((x)=>x.id===c.id?{...x,editing:false}:x)})}>취소</button>
                    </div>
                  : <p>{c.text}</p>}
                <div style={{display:"flex",gap:10,marginTop:3}}>
                  {(c.author===me||isAdmin)&&!c.editing&&<button style={{background:"none",border:"none",color:"var(--ink3)",fontSize:12,cursor:"pointer",padding:0}} onClick={()=>setDraft({...draft,comments:draft.comments.map((x)=>x.id===c.id?{...x,editing:true}:x)})}>수정</button>}
                  {(c.author===me||isAdmin)&&<button style={{background:"none",border:"none",color:"var(--danger)",fontSize:12,cursor:"pointer",padding:0}} onClick={()=>setDraft({...draft,comments:draft.comments.filter((x)=>x.id!==c.id)})}>삭제</button>}
                </div>
              </div>
            ))}
            {!(draft.comments||[]).length&&<span className="hint">없음</span>}
            <div className="addrow"><input placeholder="댓글 입력 후 Enter" onKeyDown={(e)=>{if(e.nativeEvent.isComposing)return;const v=e.target.value.trim();if(e.key==="Enter"&&v){setDraft({...draft,comments:[...(draft.comments||[]),{id:uid(),author:me||"익명",text:v,ts:Date.now()}]});e.target.value="";}}} /></div>
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
            <span className="spacer" />
            <button className="btn ghost" onClick={()=>setDraft(null)}>닫기</button>
            <button className="btn" onClick={saveDraft} style={{background:"#0C66E4",color:"#fff"}}>저장</button>         </div>
        </div></div>
      )}
    </div>
  );
}