<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Self Board — 습관 기록</title>
<script src="https://accounts.google.com/gsi/client" async defer></script>
<script src="https://apis.google.com/js/api.js" async defer></script>
<script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>
<style>
/* ============================================================
   BASE
============================================================ */
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%}
body{
  font-family:-apple-system,BlinkMacSystemFont,"Pretendard","Apple SD Gothic Neo","Malgun Gothic",sans-serif;
  background:#FFFFFF;color:#1B1F24;font-size:14px;-webkit-font-smoothing:antialiased;
}
button{font-family:inherit;cursor:pointer;border:none;background:none;color:inherit;font-size:inherit}
input,select,textarea{font-family:inherit;font-size:inherit;color:#1B1F24}
:focus-visible{outline:2px solid #0C66E4;outline-offset:2px}
.hide{display:none !important}
::-webkit-scrollbar{width:8px;height:8px}
::-webkit-scrollbar-thumb{background:#D8DCE2;border-radius:4px}
::-webkit-scrollbar-track{background:transparent}

/* ============================================================
   AUTH
============================================================ */
#authScreen{
  position:fixed;inset:0;z-index:200;background:#F4F5F7;
  display:flex;align-items:center;justify-content:center;padding:24px;
}
.auth-card{
  width:100%;max-width:380px;background:#FFFFFF;border-radius:16px;
  padding:36px 32px;box-shadow:0 8px 32px rgba(27,31,36,.10);
}
.auth-logo{width:44px;height:44px;border-radius:12px;background:#22C55E;color:#FFFFFF;
  display:flex;align-items:center;justify-content:center;font-size:22px;margin-bottom:18px}
.auth-card h1{font-size:21px;font-weight:700;letter-spacing:-.3px}
.auth-card p.sub{color:#8A929E;font-size:13px;margin-top:6px;margin-bottom:24px}
.field{margin-bottom:12px}
.field label{display:block;font-size:12px;color:#6B7280;margin-bottom:6px;font-weight:600}
.field input{
  width:100%;height:42px;border:1px solid #E4E6EA;border-radius:9px;padding:0 12px;
  background:#FFFFFF;transition:border-color .15s;
}
.field input:focus{border-color:#0C66E4;outline:none}
.btn-primary{
  width:100%;height:44px;border-radius:9px;background:#1B1F24;color:#FFFFFF;
  font-weight:600;margin-top:8px;transition:opacity .15s;
}
.btn-primary:hover{opacity:.86}
.btn-primary:disabled{opacity:.4;cursor:not-allowed}
.auth-switch{text-align:center;margin-top:18px;font-size:13px;color:#8A929E}
.auth-switch button{color:#0C66E4;font-weight:600}
.auth-msg{font-size:12.5px;margin-top:12px;padding:9px 11px;border-radius:8px;line-height:1.5}
.auth-msg.err{background:#FEF2F2;color:#B91C1C}
.auth-msg.ok{background:#F0FDF4;color:#15803D}
.mode-note{margin-top:20px;font-size:11.5px;color:#A3AAB5;text-align:center;line-height:1.6}

/* ============================================================
   LAYOUT
============================================================ */
#app{display:flex;height:100vh;overflow:hidden}

/* --- sidebar --- */
.sidebar{
  width:64px;flex:0 0 64px;min-width:64px;background:#F1F2F4;border-right:1px solid #E7E9EC;
  display:flex;flex-direction:column;align-items:center;padding:14px 0 12px;gap:4px;
}
.avatar{
  width:36px;height:36px;border-radius:10px;background:#5B67F5;color:#FFFFFF;
  display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;
  margin-bottom:14px;position:relative;cursor:pointer;
}
.avatar .dot{position:absolute;top:-2px;right:-2px;width:11px;height:11px;border-radius:50%;
  background:#F59E0B;border:2px solid #F1F2F4}
.nav-btn{
  width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;
  color:#8A929E;transition:background .12s,color .12s;position:relative;
}
.nav-btn:hover{background:#E4E6EA;color:#4B5563}
.nav-btn.active{background:#FFFFFF;color:#1B1F24;box-shadow:0 1px 3px rgba(27,31,36,.10)}
.nav-btn svg{width:19px;height:19px}
.nav-spacer{flex:1}
.nav-tabs{display:flex;flex-direction:column;align-items:center;gap:4px;width:100%}
/* 탭 폴더 */
.nav-folder{width:100%;display:flex;flex-direction:column;align-items:center;gap:3px}
.nav-folder + .nav-folder{margin-top:6px;padding-top:6px;border-top:1px solid #E1E3E7}
.nav-folder-head{position:relative;width:40px;height:26px;border:none;background:none;border-radius:7px;
  display:flex;align-items:center;justify-content:center;font-size:14px;cursor:pointer;
  opacity:.6;transition:opacity .12s,background .12s}
.nav-folder-head:hover{opacity:1;background:#E4E6EA}
.nav-folder-head.has-active{opacity:1}
.nav-folder.collapsed .nav-folder-head{opacity:.85}
.nav-folder-emoji{line-height:1;filter:grayscale(.3)}
.nav-folder-head.has-active .nav-folder-emoji{filter:none}
.nav-folder-dot{position:absolute;top:2px;right:3px;width:6px;height:6px;border-radius:50%;background:#0C66E4}
.nav-folder-body{display:flex;flex-direction:column;align-items:center;gap:3px;width:100%}
.nav-mode-btn{margin-top:8px;width:40px;height:32px;border:1px dashed #C4C9D0;background:none;border-radius:9px;
  font-size:14px;color:#9CA3AF;cursor:pointer;position:relative;transition:all .12s}
.nav-mode-btn:hover{border-color:#0C66E4;color:#0C66E4;background:#EFF6FF}
.nav-mode-btn:hover .tip{opacity:1}
body.dark .nav-folder + .nav-folder{border-top-color:#2A2E35}
body.dark .nav-folder-head:hover{background:#282C33}
body.dark .nav-mode-btn{border-color:#343941;color:#6B7280}
body.dark .nav-mode-btn:hover{border-color:#3B82F6;color:#7DB3FF;background:#1B2A44}
.nav-btn[draggable="true"]{cursor:pointer}
.nav-btn.nav-dragging{opacity:.35}
.nav-btn.nav-drop{box-shadow:inset 0 2px 0 #0C66E4}
.detail.panel-hidden{display:none}
.tip{
  position:absolute;left:46px;top:50%;transform:translateY(-50%);
  background:#1B1F24;color:#FFFFFF;font-size:11.5px;font-weight:600;padding:6px 10px;border-radius:7px;
  white-space:nowrap;opacity:0;pointer-events:none;transition:opacity .12s;z-index:9999;
  box-shadow:0 3px 10px rgba(27,31,36,.22);
}
.nav-btn:hover .tip{opacity:1}

/* --- main --- */
.main{flex:1;min-width:0;display:flex;flex-direction:column;overflow:hidden;background:#FFFFFF}
.topbar{
  height:64px;flex:0 0 64px;display:flex;align-items:center;gap:10px;
  padding:0 26px;border-bottom:1px solid #F0F1F3;
}
.topbar h2{font-size:22px;font-weight:700;letter-spacing:-.4px}
.topbar .chev{color:#8A929E;font-size:11px;margin-left:-2px}
.top-actions{margin-left:auto;display:flex;align-items:center;gap:2px}
.icon-btn{
  width:34px;height:34px;border-radius:8px;display:flex;align-items:center;justify-content:center;
  color:#6B7280;transition:background .12s;
}
.icon-btn:hover{background:#F1F2F4;color:#1B1F24}
.icon-btn svg{width:18px;height:18px}
.searchbox{
  display:flex;align-items:center;gap:7px;height:34px;padding:0 11px;border-radius:8px;
  background:#F4F5F7;width:190px;
}
.searchbox input{border:none;background:none;width:100%;font-size:13px}
.searchbox input:focus{outline:none}
.searchbox svg{width:15px;height:15px;color:#9CA3AF;flex:0 0 15px}

.scroll{flex:1;overflow-y:auto;padding:22px 26px 80px}
.scroll > *{max-width:none}
.scroll > button,.scroll > .add-grp{width:100%;box-sizing:border-box}

/* 운동 탭 좌우 분할 */
.td-split{display:flex;gap:18px;align-items:flex-start}
.td-left{flex:1;min-width:0}
.td-right{flex:0 0 380px;position:sticky;top:0;max-height:calc(100vh - 130px);overflow-y:auto;
  border:1px solid #EDEEF1;border-radius:14px;padding:16px;background:#FCFCFD}
.td-empty-panel{text-align:center;padding:40px 16px;color:#9CA3AF;font-size:13px;line-height:1.7}
.td-empty-panel .empty-icon{font-size:30px;margin-bottom:10px}
body.dark .td-right{background:#191C21;border-color:#2A2E35}

/* --- week strip --- */
.weekstrip{display:grid;grid-template-columns:repeat(7,1fr);margin-bottom:20px}
.wcol{text-align:center;cursor:pointer;padding:4px 0;border-radius:10px;transition:background .12s}
.wcol:hover{background:#FAFAFB}
.wcol .dow{font-size:12px;color:#6B7280;font-weight:600}
.wcol .dnum{font-size:17px;font-weight:700;margin:3px 0 8px;color:#1B1F24}
.wcol.past .dnum,.wcol.future .dnum{color:#B6BCC5}
.wcol.today .dnum{color:#0C66E4}
.wring{
  width:26px;height:26px;border-radius:50%;margin:0 auto;border:2px solid #E4E6EA;
  display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#FFFFFF;
}
.wring.disabled{border:none;background:repeating-linear-gradient(45deg,#EDEFF1,#EDEFF1 3px,#F6F7F8 3px,#F6F7F8 6px)}
.wring.full{background:#22C55E;border-color:#22C55E}
.wring.part{border-color:#22C55E}
.wring.wring-fail{background:#EF4444;border-color:#EF4444}

/* --- section --- */
.grp-title{
  display:flex;align-items:center;gap:8px;font-size:12.5px;font-weight:700;color:#6B7280;
  margin:22px 0 9px;text-transform:uppercase;letter-spacing:.4px;
}
.grp-title .count{background:#F1F2F4;color:#8A929E;border-radius:20px;padding:1px 7px;font-size:11px}
.grp-title:first-child{margin-top:0}

/* --- habit card --- */
.card{
  display:flex;align-items:center;gap:14px;background:#FFFFFF;border:1px solid #EDEEF1;
  border-radius:14px;padding:14px 18px;margin-bottom:9px;cursor:pointer;
  transition:box-shadow .14s,border-color .14s,transform .10s;
}
.card:hover{box-shadow:0 2px 10px rgba(27,31,36,.07);border-color:#E0E2E6}
.card.selected{border-color:#0C66E4;box-shadow:0 0 0 1px #0C66E4}
.card.overdue{border-color:#EF4444;box-shadow:0 0 0 1px rgba(239,68,68,.30)}
.card.done-all{background:#FBFCFD}
.card.dragging{opacity:.35}
.card.drop-target{border-top:2px solid #0C66E4}
.card.archived{opacity:.55}
.drag-handle{
  color:#D1D5DB;cursor:grab;flex:0 0 12px;margin-left:-6px;font-size:15px;line-height:1;
  user-select:none;
}
.card:hover .drag-handle{color:#9CA3AF}
.h-emoji{
  width:46px;height:46px;border-radius:50%;flex:0 0 46px;display:flex;align-items:center;
  justify-content:center;font-size:24px;background:#F1F2F4;
}
.h-body{flex:1;min-width:0}
.h-name{font-size:15px;font-weight:600;letter-spacing:-.2px;display:flex;align-items:center;gap:7px}
.h-name .badge{
  font-size:10.5px;font-weight:700;padding:2px 6px;border-radius:5px;background:#F1F2F4;color:#8A929E;
}
.h-name .badge.red{background:#FEF2F2;color:#DC2626}
.h-meta{display:flex;align-items:center;gap:12px;margin-top:5px;font-size:12.5px;color:#8A929E}
.h-meta span{display:flex;align-items:center;gap:3px}
.h-dots{display:flex;gap:11px;flex:0 0 auto;align-items:center}
.hdot{
  width:22px;height:22px;border-radius:50%;background:#EDEEF1;border:none;flex:0 0 22px;
  display:flex;align-items:center;justify-content:center;transition:transform .10s,background .12s;
}
.hdot:hover{transform:scale(1.16)}
.hdot.on{background:#22C55E}
.hdot.on::after{content:"";width:8px;height:5px;border-left:2px solid #FFFFFF;border-bottom:2px solid #FFFFFF;transform:rotate(-45deg) translate(1px,-1px)}
.hdot.fail{background:#EF4444}
.hdot.fail::before{content:"✕";color:#FFFFFF;font-size:11px;font-weight:700;line-height:22px}
.hdot.na{background:repeating-linear-gradient(45deg,#F3F4F6,#F3F4F6 3px,#FAFAFA 3px,#FAFAFA 6px);cursor:not-allowed}
.hdot.future{background:#F6F7F8;border:1px dashed #DFE2E6}
.card-menu{
  width:28px;height:28px;border-radius:7px;color:#B6BCC5;display:flex;align-items:center;
  justify-content:center;opacity:0;transition:opacity .12s,background .12s;flex:0 0 28px;
}
.card:hover .card-menu{opacity:1}
.card-menu:hover{background:#F1F2F4;color:#1B1F24}

/* --- empty --- */
.empty{text-align:center;padding:70px 20px;color:#A3AAB5}
.empty .big{font-size:42px;margin-bottom:14px}
.empty h3{font-size:15px;color:#4B5563;font-weight:600;margin-bottom:6px}
.empty p{font-size:13px;line-height:1.6}
.empty button{
  margin-top:16px;background:#1B1F24;color:#FFFFFF;padding:9px 18px;border-radius:8px;font-weight:600;font-size:13px;
}

/* ============================================================
   DETAIL PANEL
============================================================ */
.detail{
  width:520px;flex:0 0 520px;border-left:1px solid #EDEEF1;background:#FFFFFF;
  display:flex;flex-direction:column;overflow:hidden;
}
.detail.empty-state{background:#FCFCFD}
.dt-head{
  height:64px;flex:0 0 64px;display:flex;align-items:center;gap:12px;padding:0 20px;
  border-bottom:1px solid #F0F1F3;
}
.dt-head .h-emoji{width:38px;height:38px;flex:0 0 38px;font-size:20px}
.dt-head .t{font-size:16px;font-weight:700;flex:1;min-width:0;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dt-scroll{flex:1;overflow-y:auto;padding:18px 20px 40px}
.stat-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px}
.stat{border:1px solid #EDEEF1;border-radius:12px;padding:13px 15px}
.stat .lb{display:flex;align-items:center;gap:6px;font-size:12.5px;color:#6B7280;font-weight:500}
.stat .vl{font-size:24px;font-weight:700;margin-top:7px;letter-spacing:-.6px}
.stat .vl small{font-size:12px;font-weight:500;color:#9CA3AF;margin-left:3px}

/* calendar */
.calbox{border:1px solid #EDEEF1;border-radius:12px;padding:14px 12px 8px;margin-bottom:20px}
.cal-head{display:flex;align-items:center;justify-content:center;gap:14px;margin-bottom:12px}
.cal-head .m{font-size:14px;font-weight:700;min-width:110px;text-align:center}
.cal-nav{width:26px;height:26px;border-radius:6px;color:#9CA3AF;display:flex;align-items:center;justify-content:center}
.cal-nav:hover{background:#F1F2F4;color:#1B1F24}
.cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:2px}
.cal-dow{text-align:center;font-size:11.5px;color:#9CA3AF;padding-bottom:6px;font-weight:500}
.cal-cell{text-align:center;padding:4px 0 8px;border-radius:8px;cursor:pointer}
.cal-cell:hover{background:#FAFAFB}
.cal-cell .n{font-size:12px;color:#1B1F24;font-weight:500}
.cal-cell.out .n{color:#D1D5DB}
.cal-cell.today .n{color:#0C66E4;font-weight:700}
.cal-cell .c{width:22px;height:22px;border-radius:50%;background:#F1F2F4;margin:5px auto 0}
.cal-cell.on .c{background:#22C55E}
.cal-cell.cal-fail .c{background:#EF4444}
.cal-cell.miss .c{background:#FEE2E2}
.cal-cell.out .c{background:#F8F9FA}

/* memo */
.memobox{border:1px solid #EDEEF1;border-radius:12px;padding:14px 15px;margin-bottom:20px}
.memo-toprow{display:flex;align-items:center;gap:10px;margin-bottom:9px}
.memo-toprow input[type=date]{height:34px;border:1px solid #E4E6EA;border-radius:8px;padding:0 10px;font-size:12.5px;background:#FFFFFF}
.memo-check-tag{font-size:11.5px;color:#15803D;background:#F0FDF4;border-radius:20px;padding:3px 9px;font-weight:600;white-space:nowrap}
.memobox textarea{width:100%;min-height:92px;border:1px solid #E4E6EA;border-radius:9px;padding:10px 12px;
  line-height:1.65;resize:vertical;font-size:13.5px}
.memobox textarea:focus{border-color:#0C66E4;outline:none}
.memo-actions{display:flex;gap:8px;margin-top:10px}
.memo-actions .btn-ghost{padding:7px 14px;font-size:12.5px}

/* log */
.log-title{font-size:16px;font-weight:700;margin-bottom:12px}

/* ---- 할 일 목록 선택 ---- */
.trow.sel{border-color:#0C66E4;box-shadow:0 0 0 1px #0C66E4}
.trow{cursor:pointer}

/* ---- 할 일 상세 ---- */
.dt-title-input{flex:1;min-width:0;border:none;background:none;font-size:16px;font-weight:700;padding:6px 4px;border-radius:6px}
.dt-title-input:focus{outline:none;background:#F4F5F7}
.td-field{margin-bottom:14px}
.td-field>label{display:flex;align-items:center;gap:8px;font-size:12.5px;color:#6B7280;font-weight:600;margin-bottom:6px}
.td-field input[type=text],.td-field input[type=date],.td-field select,.td-field textarea{
  width:100%;border:1px solid #E4E6EA;border-radius:9px;padding:0 12px;height:42px;background:#FFFFFF}
.td-field textarea{height:auto;min-height:80px;padding:11px 12px;line-height:1.65;resize:vertical}
.td-field input:focus,.td-field select:focus,.td-field textarea:focus{border-color:#0C66E4;outline:none}
.td-field input[readonly]{background:#F7F8FA;color:#6B7280}
.td-field-row{display:flex;gap:12px}
.td-field-row .td-field{flex:1;min-width:0}
.link-btn{margin-left:auto;font-size:11.5px;color:#0C66E4;font-weight:600}
.link-btn:hover{text-decoration:underline}
.td-section-title{font-size:13px;font-weight:700;color:#374151;margin:20px 0 10px;display:flex;align-items:center;gap:8px}
.td-over-tag{font-size:11px;font-weight:700;color:#DC2626;background:#FEF2F2;border-radius:5px;padding:2px 6px}

/* 대분류 블록 */
.grp-block{border:1px solid #EDEEF1;border-radius:12px;padding:11px 12px;margin-bottom:9px;background:#FBFCFD}
.grp-block.dragging{opacity:.4}
.grp-block.drop-target{border-color:#0C66E4;border-style:dashed}
.grp-head{display:flex;align-items:center;gap:8px;margin-bottom:8px}
.grp-input{flex:1;min-width:0;border:none;background:none;font-size:14px;font-weight:700;padding:4px 6px;border-radius:6px}
.grp-input:focus{outline:none;background:#EEF1F4}
.grp-count{font-size:11px;color:#8A929E;background:#F1F2F4;border-radius:20px;padding:2px 8px;font-weight:600}
.sub-drag{color:#C4C9D0;cursor:grab;font-size:13px;user-select:none;flex:0 0 auto}
.sub-list{display:flex;flex-direction:column;gap:5px;min-height:6px}
.sub-item{display:flex;align-items:center;gap:8px;padding:4px 4px}
.sub-item.dragging{opacity:.4}
.sub-item.drop-target{box-shadow:0 -2px 0 #0C66E4}
.sub-check{width:19px;height:19px;flex:0 0 19px;border-radius:6px;border:2px solid #D5D9DF;display:flex;align-items:center;justify-content:center}
.sub-check:hover{border-color:#22C55E}
.sub-check.on{background:#22C55E;border-color:#22C55E}
.sub-check.on::after{content:"";width:7px;height:4px;border-left:2px solid #FFFFFF;border-bottom:2px solid #FFFFFF;transform:rotate(-45deg) translate(1px,-1px)}
.sub-input{flex:1;min-width:0;border:none;background:none;font-size:13.5px;padding:5px 6px;border-radius:6px}
.sub-input:focus{outline:none;background:#F1F2F4}
.sub-input.done{text-decoration:line-through;color:#B6BCC5}
.sub-x{width:22px;height:22px;flex:0 0 22px;border-radius:6px;color:#C4C9D0;font-size:12px;display:flex;align-items:center;justify-content:center}
.sub-x:hover{background:#FEF2F2;color:#DC2626}
.add-sub{margin-top:7px;font-size:12.5px;color:#0C66E4;font-weight:600;padding:4px 6px}
.add-sub:hover{text-decoration:underline}
.add-grp{width:100%;border:1px dashed #D5D9DF;border-radius:10px;padding:9px;font-size:13px;font-weight:600;color:#6B7280;margin-top:2px}
.add-grp:hover{background:#F7F8FA;border-color:#0C66E4;color:#0C66E4}
.td-empty-sub{font-size:12.5px;color:#A3AAB5;padding:8px 4px}

.td-save-bar{display:flex;align-items:center;gap:12px;margin:18px 0 4px}
.td-repeat-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.td-repeat-row select{flex:1;min-width:140px;height:38px;border:1px solid #E4E6EA;border-radius:8px;padding:0 11px}
.td-repeat-row select:focus{border-color:#0C66E4;outline:none}
.td-repeat-hint{font-size:12px;color:#0C66E4;background:#EFF6FF;border-radius:7px;padding:7px 11px;margin-top:8px}
body.dark .td-repeat-row select{background:#22262C;border-color:#343941;color:#E8EAED}
body.dark .td-repeat-hint{background:#1B2A44;color:#7DB3FF}
.td-save-hint{font-size:11.5px;color:#A3AAB5}

/* 히스토리 */
.td-hist-add{display:flex;gap:8px;margin-bottom:12px}
.td-hist-add input{flex:1;min-width:0;border:1px solid #E4E6EA;border-radius:9px;padding:0 12px;height:40px}
.td-hist-add input:focus{border-color:#0C66E4;outline:none}
.td-hist-item{display:flex;align-items:flex-start;gap:10px;padding:9px 0;border-bottom:1px solid #F4F5F7}
.td-hist-ts{flex:0 0 88px;font-size:11.5px;color:#9CA3AF;font-weight:600;padding-top:2px;font-variant-numeric:tabular-nums}
.td-hist-txt{flex:1;font-size:13.5px;line-height:1.6;color:#374151;white-space:pre-wrap;word-break:break-word}

/* 항목 관리 모달 */
.cat-add{display:flex;gap:8px;margin-bottom:14px}
.cat-add input{flex:1;border:1px solid #E4E6EA;border-radius:9px;padding:0 12px;height:40px}
.cat-add input:focus{border-color:#0C66E4;outline:none}
.cat-list{display:flex;flex-direction:column;gap:6px}
.cat-row{display:flex;align-items:center;gap:8px}
.cat-name{flex:1;border:1px solid #E4E6EA;border-radius:8px;padding:0 11px;height:38px}
.cat-name:focus{border-color:#0C66E4;outline:none}

/* ---- 몸무게 ---- */
:root{--wgrid:#EDEEF1;--wtick:#9CA3AF}
.w-input{border:1px solid #EDEEF1;border-radius:12px;padding:14px 15px;margin-top:6px}
.w-input-row{display:flex;gap:12px;align-items:flex-end}
.w-field{flex:1;min-width:0}
.w-field label{display:block;font-size:12.5px;color:#6B7280;font-weight:600;margin-bottom:6px}
.w-field input{width:100%;height:42px;border:1px solid #E4E6EA;border-radius:9px;padding:0 12px;background:#FFFFFF}
.w-field input:focus{border-color:#0C66E4;outline:none}
.w-goal-row{display:flex;align-items:center;gap:9px;margin-top:12px;padding-top:12px;border-top:1px solid #F0F1F3;font-size:13px;color:#6B7280}
.w-goal-row label{font-weight:600}
.w-goal-row input{width:90px;height:36px;border:1px solid #E4E6EA;border-radius:8px;padding:0 10px}
.w-goal-row input:focus{border-color:#0C66E4;outline:none}
.w-goal-row .btn-ghost{margin-left:auto;padding:7px 13px;font-size:12.5px}
.w-chart{border:1px solid #EDEEF1;border-radius:12px;padding:10px 8px 4px}
.w-list{display:flex;flex-direction:column}
.w-row{display:flex;align-items:center;gap:12px;padding:11px 4px;border-bottom:1px solid #F4F5F7}
.w-row:last-child{border-bottom:none}
.w-date{flex:1;font-size:13.5px;color:#374151;font-weight:500}
.w-dow{color:#9CA3AF;font-weight:400;font-size:12px}
.w-kg{flex:0 0 80px;text-align:right;font-size:14px;font-weight:700;font-variant-numeric:tabular-nums}
.w-delta{flex:0 0 62px;text-align:right;font-size:12px;color:#9CA3AF;font-variant-numeric:tabular-nums}
.w-delta.down{color:#16A34A}
.w-delta.up{color:#DC2626}

/* ---- 습관 날짜 보기 ---- */
.hdatebar{display:flex;align-items:center;gap:12px;margin-bottom:16px;flex-wrap:wrap}
.hview-tabs{display:flex;background:#F1F2F4;border-radius:9px;padding:3px}
.hvt{padding:6px 15px;border-radius:7px;font-size:13px;font-weight:600;color:#8A929E}
.hvt.on{background:#FFFFFF;color:#1B1F24;box-shadow:0 1px 3px rgba(27,31,36,.10)}
.hnav{display:flex;align-items:center;gap:4px}
.hnav-label{font-size:13.5px;font-weight:600;color:#4B5563;padding:6px 12px;border-radius:8px}
.hnav-label:hover{background:#F1F2F4}
.hrange{display:flex;align-items:center;gap:8px}
.hrange input{height:36px;border:1px solid #E4E6EA;border-radius:8px;padding:0 10px;font-size:13px}
.hrange input:focus{border-color:#0C66E4;outline:none}
.hrange span{color:#9CA3AF}
.hdatebar .icon-btn{margin-left:auto}

/* 기간 카드 도트 */
.rdot-wrap{display:flex;flex-wrap:wrap;gap:5px;margin-top:9px}
.rdot{width:16px;height:16px;border-radius:4px;background:#EDEEF1;border:none;flex:0 0 16px}
.rdot:hover{transform:scale(1.15)}
.rdot.on{background:#22C55E}
.rdot.rdot-fail{background:#EF4444}
.rdot.rdot-fail::before{content:"✕";color:#FFFFFF;font-size:9px;font-weight:700;display:flex;align-items:center;justify-content:center;width:100%;height:100%}
.rdot.na{background:repeating-linear-gradient(45deg,#F3F4F6,#F3F4F6 2px,#FAFAFA 2px,#FAFAFA 4px)}
.rdot.future{background:#F6F7F8;border:1px dashed #DFE2E6}

/* 미니 달력 팝오버 */
.minical{border:1px solid #EDEEF1;border-radius:12px;padding:14px 12px 10px;margin-bottom:18px;background:#FBFCFD}
.minical .cal-head{display:flex;align-items:center;justify-content:center;gap:14px;margin-bottom:12px}
.minical .m{font-size:14px;font-weight:700;min-width:110px;text-align:center}
.mc-cell{text-align:center;padding:4px 0 6px;border-radius:8px;cursor:pointer}
.mc-cell:hover{background:#EEF1F4}
.mc-cell.out{opacity:.4;cursor:default}
.mc-cell.out:hover{background:none}
.mc-n{font-size:12px;color:#1B1F24;font-weight:500}
.mc-cell.today .mc-n{color:#0C66E4;font-weight:700}
.mc-ring{width:20px;height:20px;border-radius:50%;margin:4px auto 0;border:2px solid #E4E6EA;
  display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#FFFFFF}
.mc-ring.full{background:#22C55E;border-color:#22C55E}
.mc-ring.part{border-color:#22C55E;color:#22C55E}
.mc-hint{font-size:11.5px;color:#A3AAB5;text-align:center;margin-top:8px}

/* ---- 대시보드 ---- */
:root{--dbtext:#1B1F24}
.db-hero{display:flex;gap:14px;margin-bottom:16px;flex-wrap:wrap}
.db-ring-card{display:flex;align-items:center;gap:16px;background:#FFFFFF;border:1px solid #EDEEF1;border-radius:16px;padding:18px 22px;flex:0 0 auto}
.db-ring-info .db-ring-title{font-size:13px;color:#6B7280;font-weight:600}
.db-ring-info .db-ring-sub{font-size:15px;font-weight:700;margin-top:3px}
.db-trend-card{flex:1;min-width:260px;background:#FFFFFF;border:1px solid #EDEEF1;border-radius:16px;padding:16px 20px;overflow:visible}
.db-card-title{font-size:13px;font-weight:700;color:#374151;margin-bottom:12px}
.db-bars{display:flex;align-items:flex-end;gap:3px;height:100px}
.db-bar-col{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:3px;flex:1;min-width:0}
.db-bar{display:flex;align-items:flex-end;justify-content:center;height:50px;width:100%}
.db-bar-fill{width:100%;max-width:16px;background:#22C55E;border-radius:4px 4px 0 0;transition:height .3s}
.db-bar-sel .db-bar-fill{background:#0C66E4;box-shadow:0 0 0 2px rgba(12,102,228,.25)}
.db-bar-date{font-size:9px;color:#9CA3AF;text-align:center;line-height:13px;white-space:nowrap;margin-top:2px;letter-spacing:-.3px}
.db-bar-date.sel{color:#0C66E4;font-weight:700}


.dash-datebar{display:flex;align-items:center;gap:10px;margin-bottom:16px;background:#FFFFFF;border:1px solid #EDEEF1;border-radius:12px;padding:10px 14px}
.dash-datebar input[type=date]{border:1px solid #E4E6EA;border-radius:8px;height:36px;padding:0 10px;font-size:13.5px}
.dash-datebar input[type=date]:focus{border-color:#0C66E4;outline:none}
.dash-dlabel{font-size:14px;font-weight:700;color:#1B1F24}
.db-li-done{text-decoration:line-through;color:#B6BCC5}
body.dark .dash-datebar{background:#1C1F24;border-color:#2A2E35}
body.dark .dash-datebar input[type=date]{background:#22262C;border-color:#343941;color:#E8EAED}
body.dark .dash-dlabel{color:#E8EAED}
.db-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(168px,1fr));gap:12px;margin-bottom:18px}
.db-tile{text-align:left;background:#FFFFFF;border:1px solid #EDEEF1;border-radius:14px;padding:15px 16px;transition:box-shadow .14s,transform .1s}
.db-tile:hover{box-shadow:0 4px 14px rgba(27,31,36,.08);transform:translateY(-1px)}
.db-tile.danger{border-color:#FCA5A5;background:#FEF6F6}
.db-tile-top{display:flex;align-items:center;gap:7px;margin-bottom:9px}
.db-tile-icon{font-size:16px}
.db-tile-label{font-size:12.5px;color:#6B7280;font-weight:600}
.db-tile-val{font-size:28px;font-weight:800;letter-spacing:-.8px}
.db-tile-val small{font-size:13px;font-weight:600;color:#9CA3AF;margin-left:3px}
.db-tile-sub{font-size:12px;color:#9CA3AF;margin-top:5px}
.db-two{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.db-panel{background:#FFFFFF;border:1px solid #EDEEF1;border-radius:16px;padding:16px 18px}
.db-li{display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid #F4F5F7;width:100%;text-align:left}
.db-li:last-child{border-bottom:none}
.db-li-btn{cursor:pointer;background:none}
.db-li-btn:hover{background:#FAFBFC;border-radius:8px;padding-left:6px}
.db-li-dot{width:8px;height:8px;border-radius:50%;background:#CBD5E1;flex:0 0 8px}
.db-li-dot.open{background:#22C55E}
.db-li.over .db-li-dot{background:#EF4444}
.db-li-txt{flex:1;font-size:13.5px;color:#374151;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.db-li-due{font-size:11.5px;color:#9CA3AF;flex:0 0 auto}

/* ---- 운동 ---- */
.note-sub-chips{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px}
.note-sub-chip{padding:5px 12px;border:1px solid #E4E6EA;border-radius:20px;font-size:12.5px;color:#6B7280;background:#FFFFFF;cursor:pointer;transition:all .12s}
.note-sub-chip.on{background:#1B1F24;color:#FFFFFF;border-color:#1B1F24}
.note-sub-chip:hover:not(.on){border-color:#0C66E4;color:#0C66E4}
.note-sub-badge{font-size:11px;font-weight:700;background:#EEF2FF;color:#4338CA;border-radius:6px;padding:2px 8px;flex:0 0 auto}
.note-group{margin-bottom:18px}
.note-group-head{font-size:13px;font-weight:700;color:#6B7280;margin-bottom:8px;padding-bottom:6px;border-bottom:2px solid #F0F1F3;display:flex;align-items:center;gap:8px}
.note-group-head .count{background:#F1F2F4;border-radius:10px;padding:1px 8px;font-size:11px}
body.dark .note-sub-chip{background:#1C1F24;border-color:#2A2E35;color:#8A929E}
body.dark .note-sub-chip.on{background:#E8EAED;color:#1B1F24;border-color:#E8EAED}
body.dark .note-sub-badge{background:#1E2749;color:#A5B4FC}
body.dark .note-group-head{color:#8A929E;border-bottom-color:#25282E}
.book-genre{font-size:11px;font-weight:600;background:#F4F5F7;color:#6B7280;border-radius:6px;padding:2px 8px}
.book-goal-card{background:#FFFDF5;border:1px solid #FDE9C8;border-radius:12px;padding:14px 16px;margin-bottom:14px}
.book-goal-head{display:flex;align-items:center;justify-content:space-between;font-size:13.5px;font-weight:700;color:#92400E}
.book-goal-sub{font-size:12px;color:#9C7A2E;margin-top:6px}
.book-toolbar{display:flex;gap:10px;margin-bottom:12px}
.book-date-info{font-size:11.5px;color:#9CA3AF;margin-top:6px}
.book-log-input{display:flex;gap:6px;margin-top:10px;flex-wrap:wrap}
.book-log-input input[type=date]{flex:0 0 130px;border:1px solid #E4E6EA;border-radius:7px;height:34px;padding:0 8px;font-size:12.5px}
.book-log-pages{flex:0 0 130px;border:1px solid #E4E6EA;border-radius:7px;height:34px;padding:0 8px;font-size:12.5px}
.book-log-note{flex:1;min-width:100px;border:1px solid #E4E6EA;border-radius:7px;height:34px;padding:0 8px;font-size:12.5px}
.book-log-list{margin-top:8px;display:flex;flex-direction:column;gap:3px}
.book-log-row{display:flex;align-items:center;gap:8px;font-size:12px;color:#6B7280;padding:3px 0}
.book-log-date{flex:0 0 auto;font-weight:600;color:#9CA3AF}
.book-log-txt{flex:1}
.book-quotes{margin-top:10px;border-top:1px dashed #EDEEF1;padding-top:10px}
.book-quotes-head{display:flex;align-items:center;justify-content:space-between;font-size:12px;font-weight:700;color:#6B7280;margin-bottom:6px}
.book-quotes-head .count{background:#F1F2F4;border-radius:10px;padding:0 6px;font-size:10.5px}
.book-quote-item{position:relative;background:#FAFBFC;border-left:3px solid #D1D5DB;border-radius:6px;padding:8px 28px 8px 12px;margin-bottom:6px}
.book-quote-text{font-size:13px;color:#374151;font-style:italic;line-height:1.6}
.book-quote-page{font-size:11px;color:#9CA3AF;margin-top:3px}
.book-quote-item .sub-x{position:absolute;top:6px;right:6px}
body.dark .book-genre{background:#2A2E35;color:#9CA3AF}
body.dark .book-goal-card{background:#241F17;border-color:#5C4A25}
body.dark .book-goal-head{color:#FBBF77}
body.dark .book-goal-sub{color:#C4A467}
body.dark .book-log-input input,.book-log-pages,.book-log-note{background:#22262C;border-color:#343941;color:#E8EAED}
body.dark .book-quote-item{background:#191C21;border-left-color:#4A5058}
body.dark .book-quote-text{color:#C4C9D0}
/* ---- 마인드맵 ---- */
.mm-list{display:flex;flex-direction:column;gap:8px}
.mm-list-card{display:flex;align-items:center;gap:12px;background:#FFFFFF;border:1px solid #EDEEF1;border-radius:12px;padding:13px 15px;cursor:pointer;transition:box-shadow .12s}
.mm-list-card:hover{box-shadow:0 3px 12px rgba(27,31,36,.07)}
.mm-list-icon{font-size:22px;flex:0 0 auto}
.mm-list-info{flex:1;min-width:0}
.mm-list-title{font-size:14.5px;font-weight:700;color:#1B1F24}
.mm-list-meta{font-size:12px;color:#9CA3AF;margin-top:2px}
.mm-topbar{display:flex;align-items:center;gap:10px;padding:8px 4px;margin-bottom:8px;flex-wrap:wrap}
.mm-title{font-size:15px;font-weight:700;color:#1B1F24;cursor:pointer;padding:4px 8px;border-radius:7px;flex:1;min-width:0}
.mm-title:hover{background:#F4F5F7}
.mm-zoom{display:flex;align-items:center;gap:6px;font-size:12.5px;color:#6B7280;background:#F4F5F7;border-radius:8px;padding:2px 6px}
.mm-zoom .icon-btn{width:26px;height:26px;opacity:1}
.mm-canvas-wrap{position:relative;width:100%;height:calc(100vh - 260px);min-height:420px;overflow:auto;border:1px solid #EDEEF1;border-radius:14px;background:
  radial-gradient(circle, #E4E6EA 1px, transparent 1px) 0 0/22px 22px, #FAFBFC;
  touch-action:pan-x pan-y;
}
.mm-canvas{position:relative}
.mm-svg{position:absolute;top:0;left:0;pointer-events:none}
.mm-node{position:absolute;transform:translate(0,-50%);padding:4px 6px;border-radius:6px;background:transparent;font-size:13px;font-weight:600;line-height:1.3;white-space:nowrap;cursor:pointer;user-select:none;transition:background .1s}
.mm-node:hover{background:#F4F5F7}
.mm-node.mm-root{font-size:15px;font-weight:800}
.mm-node.mm-selected{z-index:5;box-shadow:0 0 0 2px currentColor inset}
body.dark .mm-node:hover{background:#22262C}
.mm-bottombar{position:sticky;bottom:0;background:#FFFFFF;border:1px solid #EDEEF1;border-radius:14px;padding:12px 16px;margin-top:10px;box-shadow:0 -4px 16px rgba(27,31,36,.06)}
.mm-bb-label{font-size:13px;font-weight:700;color:#1B1F24;margin-bottom:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mm-bb-actions{display:flex;gap:8px;flex-wrap:wrap}
.mm-bb-actions button{border:1px solid #E4E6EA;background:#F8F9FB;border-radius:9px;padding:7px 13px;font-size:12.5px;font-weight:600;color:#374151;cursor:pointer}
.mm-bb-actions button:hover{background:#EFF1F4}
.mm-color-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;padding:6px 0}
.mm-color-dot{width:44px;height:44px;border-radius:50%;border:3px solid transparent;cursor:pointer}
.mm-color-dot.on{border-color:#1B1F24}
body.dark .mm-list-card{background:#1C1F24;border-color:#2A2E35}
body.dark .mm-list-title{color:#E8EAED}
body.dark .mm-title{color:#E8EAED}
body.dark .mm-title:hover{background:#22262C}
body.dark .mm-zoom{background:#22262C;color:#9CA3AF}
body.dark .mm-canvas-wrap{background:radial-gradient(circle, #2A2E35 1px, transparent 1px) 0 0/22px 22px, #17191D;border-color:#2A2E35}
body.dark .mm-bottombar{background:#1C1F24;border-color:#2A2E35}
body.dark .mm-bb-label{color:#E8EAED}
body.dark .mm-bb-actions button{background:#22262C;border-color:#343941;color:#C4C9D0}
/* ---- 독서 기록 ---- */
.book-card{background:#FFFFFF;border:1px solid #EDEEF1;border-radius:12px;padding:14px 16px;margin-bottom:10px;transition:box-shadow .12s}
.book-card:hover{box-shadow:0 3px 12px rgba(27,31,36,.07)}
.book-card-head{display:flex;align-items:flex-start;gap:8px}
.book-drag-handle{color:#C4C9D0;font-size:15px;cursor:grab;flex:0 0 auto;padding-top:2px;user-select:none}
.book-drag-handle:active{cursor:grabbing}
.book-info{flex:1;min-width:0}
.book-title{font-size:14.5px;font-weight:700;color:#1B1F24;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.book-author{font-size:12.5px;color:#9CA3AF;margin-top:3px}
.book-status{font-size:11px;font-weight:700;border-radius:6px;padding:2px 8px}
.book-status.reading{background:#EFF6FF;color:#0C66E4}
.book-status.done{background:#F0FDF4;color:#16A34A}
.book-status.wish{background:#FEF9EF;color:#D97706}
.book-actions{display:flex;gap:2px;flex:0 0 auto}
.book-actions .icon-btn{width:28px;height:28px;opacity:1}
.book-progress{display:flex;align-items:center;gap:10px;margin-top:10px}
.book-progress .bar-track{flex:1}
.book-pct{font-size:12px;color:#6B7280;font-weight:600;flex:0 0 auto}
.book-rating{margin-top:8px;color:#F59E0B;font-size:14px}
.book-review{font-size:13px;color:#374151;line-height:1.7;white-space:pre-wrap;word-break:break-word;background:#FAFBFC;border-radius:8px;padding:10px 12px;margin-top:8px}
.book-date{font-size:11.5px;color:#B6BCC5;margin-top:8px}
.book-dragging{opacity:.35}
.book-drop-over{border:2px dashed #0C66E4!important;background:#EFF6FF}
body.dark .book-card{background:#1C1F24;border-color:#2A2E35}
body.dark .book-title{color:#E8EAED}
body.dark .book-review{background:#191C21;color:#C4C9D0}
body.dark .book-drop-over{background:#1B2A44;border-color:#3B82F6!important}
/* ---- 개인 시간표 ---- */
.sched-tabs{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin-bottom:16px}
.sched-tab{position:relative;display:flex;flex-direction:column;align-items:center;gap:2px;padding:9px 2px;
  border:1.5px solid #EDEEF1;border-radius:10px;background:#FFFFFF;cursor:pointer;transition:all .12s}
.sched-tab:hover{border-color:#93C5FD}
.sched-tab.on{border-color:#0C66E4;background:#EFF6FF}
.sched-tab.today .sched-tab-date{color:#0C66E4}
.sched-tab-dow{font-size:11.5px;font-weight:600;color:#9CA3AF}
.sched-tab.on .sched-tab-dow{color:#0C66E4}
.sched-tab-date{font-size:16px;font-weight:800;color:#1B1F24}
.sched-tab.on .sched-tab-date{color:#0C66E4}
.sched-tab-dot{position:absolute;bottom:4px;width:5px;height:5px;border-radius:50%;background:#22C55E}
.sched-clock-wrap{display:flex;justify-content:center;padding:6px 0}
.sched-clock{width:100%;max-width:360px;height:auto}
.sched-list{display:flex;flex-direction:column;gap:5px}
.sched-item{display:flex;align-items:center;gap:10px;padding:10px 12px;background:#FFFFFF;
  border:1px solid #EDEEF1;border-radius:10px;cursor:pointer;transition:box-shadow .12s}
.sched-item:hover{box-shadow:0 2px 8px rgba(27,31,36,.07)}
.sched-item-bar{width:4px;height:26px;border-radius:3px;flex:0 0 4px}
.sched-item-time{font-size:12.5px;font-weight:700;color:#374151;font-variant-numeric:tabular-nums;flex:0 0 auto}
.sched-item-label{flex:1;font-size:13.5px;font-weight:600;color:#1B1F24;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sched-item-dur{font-size:12px;color:#9CA3AF;flex:0 0 auto}
.sched-preset-row{display:flex;flex-wrap:wrap;gap:6px}
.sched-preset{padding:6px 11px;border:1.5px solid #E4E6EA;border-radius:18px;background:#FFFFFF;
  font-size:12.5px;font-weight:600;color:#374151;cursor:pointer;transition:all .12s}
.sched-preset:hover{background:#F4F5F7}
.sched-color-row{display:flex;gap:7px;flex-wrap:wrap}
.sched-color{width:28px;height:28px;border-radius:50%;border:3px solid transparent;cursor:pointer}
.sched-color.on{border-color:#1B1F24}
.sched-repeat-preset{display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap}
.sched-repeat-preset button{padding:5px 12px;border:1px solid #E4E6EA;border-radius:16px;background:#F8F9FB;
  font-size:12px;font-weight:600;color:#6B7280;cursor:pointer;transition:all .12s}
.sched-repeat-preset button:hover{background:#EFF6FF;border-color:#0C66E4;color:#0C66E4}
.sched-day-pick{display:grid;grid-template-columns:repeat(7,1fr);gap:5px}
.sched-day-btn{padding:9px 0;border:1.5px solid #E4E6EA;border-radius:9px;background:#FFFFFF;
  font-size:13px;font-weight:700;color:#9CA3AF;cursor:pointer;transition:all .12s}
.sched-day-btn:hover{border-color:#93C5FD}
.sched-day-btn.on{background:#0C66E4;border-color:#0C66E4;color:#FFFFFF}
.sched-day-hint{font-size:11.5px;color:#9CA3AF;margin-top:7px;line-height:1.5}
.sched-repeat-badge{font-size:11px;font-weight:700;color:#0C66E4;background:#EFF6FF;
  border-radius:6px;padding:2px 7px;flex:0 0 auto}
body.dark .sched-repeat-preset button{background:#22262C;border-color:#343941;color:#9CA3AF}
body.dark .sched-day-btn{background:#1C1F24;border-color:#343941;color:#8A929E}
body.dark .sched-day-btn.on{background:#0C66E4;border-color:#0C66E4;color:#FFFFFF}
body.dark .sched-repeat-badge{background:#1B2A44;color:#7DB3FF}
body.dark .sched-tab{background:#1C1F24;border-color:#2A2E35}
body.dark .sched-tab.on{background:#1B2A44;border-color:#3B82F6}
body.dark .sched-tab-date{color:#E8EAED}
body.dark .sched-item{background:#1C1F24;border-color:#2A2E35}
body.dark .sched-item-label{color:#E8EAED}
body.dark .sched-item-time{color:#C4C9D0}
body.dark .sched-preset{background:#22262C;border-color:#343941;color:#C4C9D0}
body.dark .sched-clock circle:first-child{fill:#191C21}
/* ---- 노트 탭 ---- */
.note-cat-tabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px}
.note-cat-tab{padding:8px 14px;border:1.5px solid #EDEEF1;border-radius:10px;font-size:13px;font-weight:600;color:#6B7280;background:#FFFFFF;cursor:pointer;transition:border-color .12s,color .12s;display:flex;align-items:center;gap:6px}
.note-cat-tab.on{font-weight:700}
.note-cat-cnt{background:#F1F2F4;border-radius:10px;padding:1px 7px;font-size:11px;color:#6B7280}
.note-cat-manage{flex:0 0 auto;color:#9CA3AF}
.note-header{display:flex;align-items:center;justify-content:space-between;gap:12px;background:#FFFFFF;border:1px solid #EDEEF1;border-radius:12px;padding:14px 18px;margin-bottom:14px}
.note-header-title{font-size:15px;font-weight:700;color:#1B1F24}
.note-header-desc{font-size:12.5px;color:#9CA3AF;margin-top:3px}
.note-list{display:flex;flex-direction:column;gap:10px}
.note-card{background:#FFFFFF;border:1px solid #EDEEF1;border-radius:12px;padding:14px 16px;transition:box-shadow .12s}
.note-card:hover{box-shadow:0 3px 12px rgba(27,31,36,.07)}
.note-card.pinned{border-color:#FBBF77;background:#FFFDF8}
.note-card-head{display:flex;align-items:center;gap:8px;margin-bottom:8px}
.note-drag-handle{color:#C4C9D0;font-size:15px;cursor:grab;flex:0 0 auto;user-select:none;line-height:1}
.note-drag-handle:active{cursor:grabbing}
.note-dragging{opacity:.35}
.note-drop-over{border:2px dashed #0C66E4!important;background:#EFF6FF}
body.dark .note-drop-over{background:#1B2A44;border-color:#3B82F6!important}
.note-pin{font-size:13px}
.note-card-title{font-size:14.5px;font-weight:700;color:#1B1F24;flex:1;min-width:0}
.note-card-actions{display:flex;gap:2px;flex:0 0 auto}
.note-card-actions .icon-btn{width:28px;height:28px;opacity:1}
.note-card-body{font-size:13.5px;color:#374151;line-height:1.75;white-space:pre-wrap;word-break:break-word;margin-bottom:8px}
.note-card-date{font-size:11.5px;color:#B6BCC5}
body.dark .note-cat-tab{background:#1C1F24;border-color:#2A2E35;color:#8A929E}
body.dark .note-cat-cnt{background:#2A2E35;color:#9CA3AF}
body.dark .note-header,body.dark .note-card{background:#1C1F24;border-color:#2A2E35}
body.dark .note-header-title,body.dark .note-card-title{color:#E8EAED}
body.dark .note-card.pinned{background:#241F17;border-color:#5C4A25}
body.dark .note-card-body{color:#C4C9D0}
.wk-session-row.sel{background:#EFF6FF;border-color:#93C5FD}
body.dark .wk-session-row.sel{background:#1B2A44;border-color:#3B82F6}
/* 운동 상세 패널 */
.wkd-panel{padding:4px 2px;height:100%;overflow-y:auto}
.wkd-head{display:flex;align-items:center;gap:10px;margin-bottom:16px}
.wkd-title{display:flex;align-items:center;gap:8px;flex:1}
.wkd-date{border:none;font-size:15px;font-weight:700;color:#1B1F24;background:none;cursor:pointer;padding:0}
.wkd-row{display:flex;align-items:center;gap:12px;margin-bottom:10px}
.wkd-row label{flex:0 0 70px;font-size:12.5px;color:#6B7280;font-weight:600}
.wkd-input{flex:1;border:1px solid #E4E6EA;border-radius:8px;height:36px;padding:0 10px;font-size:13.5px}
.wkd-input:focus{border-color:#0C66E4;outline:none}
.wkd-section-title{font-size:12.5px;font-weight:700;color:#6B7280;margin:14px 0 8px}
.wkd-group{border:1px solid #EDEEF1;border-radius:11px;padding:12px 13px;margin-bottom:8px}
.wkd-group-head{display:flex;align-items:center;gap:8px;margin-bottom:10px}
.wkd-group-icon{font-size:16px}
.wkd-ex-name{flex:1;border:none;font-size:14px;font-weight:700;color:#1B1F24;background:none;padding:0;min-width:0}
.wkd-ex-name:focus{outline:none;border-bottom:1px solid #0C66E4}
.wkd-group-vol{font-size:12px;color:#9CA3AF;font-weight:600}
.wkd-items{display:flex;flex-direction:column;gap:6px}
.wkd-item{display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid #F4F5F7}
.wkd-item:last-child{border-bottom:none}
.wkd-item-check{width:16px;height:16px;border-radius:5px;border:2px solid #D5D9DF;flex:0 0 16px}
.wkd-item-text{flex:1;font-size:13.5px;color:#374151}
.wkd-kg,.wkd-reps{width:60px;border:1px solid #E4E6EA;border-radius:7px;height:32px;text-align:center;font-size:13.5px}
.wkd-kg:focus,.wkd-reps:focus{border-color:#0C66E4;outline:none}
.wkd-memo{width:100%;border:1px solid #E4E6EA;border-radius:9px;padding:10px 12px;resize:vertical;font-family:inherit;font-size:13.5px;line-height:1.6}
.wkd-memo:focus{border-color:#0C66E4;outline:none}
body.dark .wkd-group{background:#1C1F24;border-color:#2A2E35}
body.dark .wkd-ex-name,.wkd-date{color:#E8EAED}
body.dark .wkd-input,.wkd-kg,.wkd-reps,.wkd-memo{background:#22262C;border-color:#343941;color:#E8EAED}
body.dark .wkd-item{border-bottom-color:#25282E}
.wk-date-head{display:flex;align-items:center;gap:10px;padding:9px 12px;background:#F8F9FB;border-radius:10px;margin-bottom:6px}
.wk-date-head.today{background:#EFF6FF}
.wk-date-label{font-size:13.5px;font-weight:700;color:#374151}
.wk-date-head.today .wk-date-label{color:#0C66E4}
.wk-date-meta{font-size:12px;color:#9CA3AF}
.wk-session-row{background:#FFFFFF;border:1px solid #EDEEF1;border-radius:10px;padding:11px 14px;margin-bottom:6px;margin-left:12px}
.wk-session-head{display:flex;align-items:center;gap:8px}
.wk-session-tag{font-size:12.5px;font-weight:700;color:#374151;background:#F4F5F7;border-radius:6px;padding:2px 9px}
.wk-session-ex-cnt{font-size:12px;color:#9CA3AF}
.wk-sub-list{margin-top:10px;display:flex;flex-direction:column;gap:5px}
.wk-sub-item{display:flex;align-items:baseline;gap:8px;font-size:13px}
.wk-sub-dot{width:7px;height:7px;border-radius:50%;background:#D1D5DB;flex:0 0 7px;margin-top:5px}
.wk-sub-name{font-weight:600;color:#374151;min-width:80px}
.wk-sub-detail{color:#6B7280;flex:1}
.wk-sub-detail small{color:#9CA3AF;font-size:11.5px}
body.dark .wk-date-head{background:#22262C}
body.dark .wk-date-head.today{background:#1B2A44}
body.dark .wk-date-label{color:#C4C9D0}
body.dark .wk-session-row{background:#1C1F24;border-color:#2A2E35}
body.dark .wk-session-tag{background:#2A2E35;color:#C4C9D0}
body.dark .wk-sub-name{color:#C4C9D0}
body.dark .wk-sub-detail{color:#8A929E}
.wk-head{display:flex;align-items:center;gap:8px;margin-bottom:10px}
.wk-date{font-size:14px;font-weight:700}
.wk-tag{font-size:11px;font-weight:600;background:#F1F2F4;color:#6B7280;border-radius:6px;padding:2px 8px}
.wk-ex{display:flex;align-items:center;gap:10px;padding:6px 0;border-top:1px solid #F4F5F7}
.wk-ex:first-of-type{border-top:none}
.wk-ex-name{flex:0 0 120px;font-size:13.5px;font-weight:600}
.wk-ex-sets{flex:1;display:flex;flex-wrap:wrap;gap:5px}
.set-chip{font-size:12px;background:#EEF6FF;color:#1D4ED8;border-radius:6px;padding:2px 8px;font-variant-numeric:tabular-nums}
.wk-ex-vol{flex:0 0 auto;font-size:12px;color:#9CA3AF;font-weight:600}
.wk-memo{margin-top:9px;font-size:13px;color:#6B7280;line-height:1.6;background:#FAFBFC;border-radius:8px;padding:8px 11px}
.wm-ex{border:1px solid #EDEEF1;border-radius:10px;padding:11px 12px;margin-bottom:9px}
.wm-ex-top{display:flex;gap:8px;align-items:center;margin-bottom:9px}
.wm-name{flex:1;border:1px solid #E4E6EA;border-radius:8px;height:38px;padding:0 11px;font-weight:600}
.wm-name:focus{border-color:#0C66E4;outline:none}
.wm-set{display:flex;align-items:center;gap:6px;margin-bottom:6px}
.wm-set input{width:66px;border:1px solid #E4E6EA;border-radius:7px;height:34px;padding:0 9px;text-align:center}
.wm-set input:focus{border-color:#0C66E4;outline:none}
.wm-set span{color:#9CA3AF}
/* 유산소/웨이트 토글 */
.wm-type-toggle{display:flex;gap:4px;margin-bottom:10px}
.wm-type-btn{padding:4px 12px;border-radius:7px;font-size:12px;font-weight:700;color:#9CA3AF;background:#F1F2F4;transition:background .12s,color .12s}
.wm-type-btn.on{background:#0C66E4;color:#FFFFFF}
/* 유산소 세트 */
.wm-cardio-set{display:flex;align-items:flex-end;gap:10px;padding:10px 0;border-bottom:1px solid #F4F5F7;flex-wrap:wrap}
.wm-cardio-set:last-of-type{border-bottom:none}
.wm-cardio-field{display:flex;flex-direction:column;gap:4px}
.wm-cardio-field label{font-size:11px;color:#9CA3AF;font-weight:600}
.wm-cardio-input{display:flex;align-items:center;gap:5px}
.wm-cardio-input input{width:72px;border:1px solid #E4E6EA;border-radius:8px;height:36px;padding:0 9px;text-align:center}
.wm-cardio-input input:focus{border-color:#F97316;outline:none}
.wm-cardio-input span{font-size:12px;color:#9CA3AF;white-space:nowrap}
body.dark .wm-type-btn{background:#282C33;color:#9CA3AF}
body.dark .wm-type-btn.on{background:#0C66E4;color:#FFFFFF}
body.dark .wm-cardio-input input{background:#22262C;border-color:#343941;color:#E8EAED}
body.dark .wm-cardio-set{border-bottom-color:#25282E}

/* ---- 공부 ---- */
.study-card{background:#FFFFFF;border:1px solid #EDEEF1;border-radius:14px;padding:15px 17px;margin-bottom:10px}
.study-head{display:flex;align-items:center;gap:10px;margin-bottom:11px}
.study-title{font-size:15px;font-weight:700}
.study-cur{font-size:12px;color:#0C66E4;background:#EFF6FF;border-radius:6px;padding:2px 8px;font-weight:600}
.study-bar-row{display:flex;align-items:center;gap:11px;margin-bottom:10px}
.study-bar-row .bar-track{flex:1}
.study-pct{flex:0 0 42px;text-align:right;font-size:13px;font-weight:700;color:#22C55E}
.study-meta{display:flex;gap:16px;font-size:12.5px;color:#8A929E;margin-bottom:12px}
.study-loginput{display:flex;gap:8px;margin-bottom:10px;align-items:flex-start}
.study-log-in{flex:1;border:1px solid #E4E6EA;border-radius:8px;padding:9px 11px;resize:vertical;min-height:38px;line-height:1.5;font-size:13.5px}
.study-log-side{display:flex;flex-direction:column;gap:6px;flex:0 0 auto}
.study-min-in{border:1px solid #E4E6EA;border-radius:8px;height:38px;padding:0 10px;text-align:center;width:70px}
.study-log-in:focus,.study-min-in:focus{border-color:#0C66E4;outline:none}
/* 드래그 핸들 */
.study-drag-handle{flex:0 0 auto;color:#C4C9D0;font-size:16px;cursor:grab;padding:0 4px;line-height:1;user-select:none;touch-action:none}
.study-drag-handle:active{cursor:grabbing}
/* 드래그 상태 */
.study-card[draggable="true"]{transition:box-shadow .12s,opacity .12s}
.study-dragging{opacity:.35;box-shadow:none!important}
.study-drop-over{border:2px dashed #0C66E4!important;background:#EFF6FF}
.study-logs{border-top:1px solid #F4F5F7;padding-top:9px}
.study-log{display:flex;gap:10px;padding:4px 0;font-size:12.5px}
.study-log.log-pinned{background:#FFFBEB;border-radius:8px;padding:6px 8px;margin:0 -8px}
.log-clamped{display:-webkit-box!important;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.log-toggle{display:block;background:none;border:none;color:#0C66E4;font-size:11.5px;font-weight:600;cursor:pointer;padding:2px 0 0;margin:0}
.log-toggle:hover{text-decoration:underline}
body.dark .study-log.log-pinned{background:#241F17}
body.dark .log-toggle{color:#7DB3FF}
.study-log-date{flex:0 0 42px;color:#9CA3AF;font-weight:600}
.study-log-txt{flex:1;color:#4B5563}

/* ---- 노래 (보컬) ---- */
.song-card{background:#FFFFFF;border:1px solid #EDEEF1;border-radius:14px;padding:15px 17px;margin-bottom:10px}
.song-head{display:flex;align-items:center;gap:12px;margin-bottom:11px}
.song-cover{width:44px;height:44px;flex:0 0 44px;border-radius:11px;display:flex;align-items:center;justify-content:center;font-size:22px}
.song-main{flex:1;min-width:0}
.song-title{font-size:15px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.song-artist{font-size:12.5px;color:#8A929E;margin-top:2px}
.song-status{font-size:11px;font-weight:700;border-radius:6px;padding:3px 9px;flex:0 0 auto}
.song-meta{display:flex;flex-wrap:wrap;gap:14px;font-size:12.5px;color:#8A929E;margin-bottom:12px}
.song-rate{color:#F59E0B;letter-spacing:1px}
.song-loginput{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.song-min-in,.song-note-in{border:1px solid #E4E6EA;border-radius:8px;height:38px;padding:0 11px}
.song-note-in{flex:1;min-width:120px}
.song-min-in:focus,.song-note-in:focus{border-color:#0C66E4;outline:none}
.song-star-pick{display:flex;gap:1px}
.song-star-pick button{font-size:20px;color:#F59E0B;line-height:1;width:22px}
.song-logs{border-top:1px solid #F4F5F7;padding-top:9px;margin-top:11px}
.song-log{display:flex;gap:10px;padding:4px 0;font-size:12.5px;align-items:center}
.song-log-date{flex:0 0 42px;color:#9CA3AF;font-weight:600}
.song-log-star{color:#F59E0B;letter-spacing:1px;flex:0 0 auto;font-size:11px}
.song-log-txt{flex:1;color:#4B5563;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
body.dark .song-card{background:#1C1F24;border-color:#2A2E35}
body.dark .song-title{color:#E8EAED}
body.dark .song-min-in,body.dark .song-note-in{background:#22262C;border-color:#343941;color:#E8EAED}
body.dark .song-logs{border-top-color:#25282E}
body.dark .song-log-txt{color:#B9C0C9}

/* ---- 음정 트레이닝 ---- */
.pitch-input{border:1px solid #EDEEF1;border-radius:12px;padding:14px 15px;margin-bottom:6px}
.pitch-row{display:flex;gap:12px;align-items:flex-end}
.pitch-row .w-field{flex:1;min-width:0}
.pitch-row select,.pitch-row input{width:100%;height:42px;border:1px solid #E4E6EA;border-radius:9px;padding:0 12px;background:#FFFFFF}
.pitch-row select:focus,.pitch-row input:focus{border-color:#0C66E4;outline:none}
.pitch-hint{font-size:12px;color:#8A929E;margin-top:10px;line-height:1.6;background:#FAFBFC;border-radius:8px;padding:9px 11px}
.pitch-list{display:flex;flex-direction:column}
.pitch-log{display:flex;align-items:center;gap:12px;padding:10px 4px;border-bottom:1px solid #F4F5F7}
.pitch-log:last-child{border-bottom:none}
.pitch-log-date{flex:1;font-size:13px;color:#374151;font-weight:500}
.pitch-log-hz{flex:0 0 auto;font-size:14px;font-weight:700;font-variant-numeric:tabular-nums}
.pitch-note{font-size:11px;color:#8B5CF6;background:#F5F3FF;border-radius:5px;padding:1px 6px;margin-left:5px;font-weight:600}
.pitch-log-err{flex:0 0 66px;text-align:right;font-size:12.5px;font-weight:600;color:#9CA3AF;font-variant-numeric:tabular-nums}
.pitch-log-err.good{color:#16A34A}
.pitch-log-err.bad{color:#DC2626}
body.dark .pitch-input{background:#1C1F24;border-color:#2A2E35}
body.dark .pitch-row select,body.dark .pitch-row input{background:#22262C;border-color:#343941;color:#E8EAED}
body.dark .pitch-hint{background:#191C21;color:#98A0AC}
body.dark .pitch-log{border-bottom-color:#25282E}
body.dark .pitch-log-date,body.dark .pitch-log-hz{color:#E8EAED}
body.dark .pitch-note{background:#2A2440}

/* ---- 보컬 연습(호흡·발성·청음·노래) ---- */
.song-subtabs{flex-wrap:wrap;height:auto;gap:3px}
.vocal-list{display:flex;flex-direction:column}
.vocal-log{display:flex;align-items:center;gap:12px;padding:10px 4px;border-bottom:1px solid #F4F5F7}
.vocal-log:last-child{border-bottom:none}
.vocal-log-date{flex:0 0 128px;font-size:13px;color:#374151;font-weight:500}
.vocal-log-min{flex:0 0 52px;font-size:13px;font-weight:700;color:#1B1F24}
.vocal-log-star{flex:0 0 auto;color:#F59E0B;font-size:12px;letter-spacing:1px}
.vocal-log-note{flex:1;font-size:13px;color:#6B7280;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
body.dark .vocal-log{border-bottom-color:#25282E}
body.dark .vocal-log-date,body.dark .vocal-log-min{color:#E8EAED}
body.dark .vocal-log-note{color:#B9C0C9}
@media(max-width:640px){.vocal-log-date{flex:0 0 96px;font-size:12px}.vocal-log-note{flex-basis:100%;order:5}}

/* ---- 가계부 ---- */
.stat-neg{border-color:#FCA5A5!important;background:#FEF6F6}
body.dark .stat-neg{background:#241A1C;border-color:#5B2A2E!important}
/* ---- 자산 탭 ---- */
.fin-block{background:#FFFFFF;border:1px solid #EDEEF1;border-radius:16px;padding:20px 22px}
.asset-total-card{background:linear-gradient(135deg,#0C66E4,#3B82F6);border-radius:18px;padding:26px 24px;text-align:center;color:#fff;margin-bottom:16px}
.asset-total-label{font-size:13.5px;font-weight:600;opacity:.85}
.asset-total-val{font-size:34px;font-weight:800;letter-spacing:-1px;margin-top:6px}
.asset-total-val small{font-size:16px;font-weight:600;opacity:.85;margin-left:3px}
.asset-total-diff{font-size:12.5px;font-weight:600;margin-top:8px;background:rgba(255,255,255,.15);display:inline-block;padding:3px 12px;border-radius:20px}
.asset-total-card .btn-ghost{background:rgba(255,255,255,.15);color:#fff;border:none}
.asset-total-card .btn-ghost:hover{background:rgba(255,255,255,.25)}
.asset-cat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:8px}
.asset-goal-card{background:#F7FBFF;border:1.5px solid #BFDBFE;border-radius:16px;padding:18px 20px;margin-bottom:16px}
.asset-goal-head{display:flex;align-items:center;justify-content:space-between;font-size:14px;font-weight:700;color:#0C66E4}
.asset-goal-nums{display:flex;align-items:baseline;gap:6px;margin-top:10px;flex-wrap:wrap}
.asset-goal-cur{font-size:24px;font-weight:800;color:#1B1F24;letter-spacing:-.5px}
.asset-goal-sep{color:#C4C9D0}
.asset-goal-target{font-size:14px;color:#6B7280;font-weight:600}
.asset-goal-pct{margin-left:auto;font-size:18px;font-weight:800;color:#0C66E4}
.asset-goal-sub{font-size:12.5px;color:#6B7280;margin-top:9px;line-height:1.65}
.asset-goal-sub b{color:#0C66E4}
body.dark .asset-goal-card{background:#16233D;border-color:#2C4A7C}
body.dark .asset-goal-cur{color:#E8EAED}
body.dark .asset-goal-sub{color:#8A929E}
body.dark .asset-goal-sub b{color:#7DB3FF}
.asset-exp-card{background:#FFFFFF;border:1px solid #EDEEF1;border-radius:16px;padding:18px 20px;margin-bottom:16px}
.asset-exp-head{font-size:13.5px;font-weight:700;color:#1B1F24;margin-bottom:14px}
.asset-exp-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px}
.asset-exp-stat .lb{font-size:11.5px;color:#9CA3AF;font-weight:600}
.asset-exp-stat .vl{font-size:18px;font-weight:800;margin-top:3px}
.asset-exp-stat .vl small{font-size:11px;font-weight:500;color:#9CA3AF;margin-left:2px}
.asset-exp-bar-row{display:flex;align-items:center;gap:10px}
.asset-exp-bar-row .bar-track{flex:1}
.asset-exp-pct{font-size:12.5px;font-weight:700;color:#0C66E4;flex:0 0 auto}
.asset-exp-desc{font-size:11.5px;color:#9CA3AF;margin-top:10px;line-height:1.6}
body.dark .asset-exp-card{background:#1C1F24;border-color:#2A2E35}
body.dark .asset-exp-head{color:#E8EAED}
body.dark .asset-exp-desc{color:#6B7280}
.asset-cat-card{background:#FFFFFF;border:1px solid #EDEEF1;border-radius:12px;padding:12px 14px}
.asset-cat-label{font-size:12px;color:#6B7280;font-weight:600}
.asset-cat-amt{font-size:17px;font-weight:800;margin-top:4px}
.asset-cat-amt small{font-size:11px;font-weight:500;color:#9CA3AF;margin-left:2px}
.asset-cat-pct{font-size:11px;color:#B6BCC5;margin-top:2px}
body.dark .asset-cat-card{background:#1C1F24;border-color:#2A2E35}
body.dark .asset-cat-label{color:#8A929E}
.fin-block-label{font-size:13px;font-weight:700;color:#6B7280;margin-bottom:8px}
.fin-block-val{font-size:34px;font-weight:900;letter-spacing:-1px;color:#1B1F24}
.fin-block-val small{font-size:16px;color:#9CA3AF;margin-left:3px;font-weight:600}
.fin-block-sub{display:flex;flex-direction:column;gap:7px;margin-top:12px}
.fin-income-item{display:flex;justify-content:space-between;font-size:13.5px;padding:8px 0;border-bottom:1px solid #F4F5F7}
.fin-income-item:last-child{border-bottom:none}
.fin-income-item span{color:#6B7280}
.fin-income-item b{font-weight:700;color:#1B1F24}
.fin-savrate-row{display:flex;align-items:center;gap:12px;margin-top:12px}
.fin-savrate-bar-bg{flex:1;height:12px;background:#F1F2F4;border-radius:8px;overflow:hidden}
.fin-savrate-bar-fill{height:100%;background:#0EA5E9;border-radius:8px;transition:width .4s}
.fin-savrate-pct{font-size:13px;font-weight:700;color:#0EA5E9;flex:0 0 auto}
.fin-sav-card{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:12px 0;border-bottom:1px solid #F4F5F7}
.fin-sav-card:last-child{border-bottom:none}
.fin-sav-left{display:flex;align-items:center;gap:12px}
.fin-sav-label{font-size:13px;color:#6B7280;margin-bottom:4px}
.fin-sav-amt{font-size:18px;font-weight:800}
.fin-sav-amt small{font-size:11px;color:#9CA3AF;margin-left:2px;font-weight:500}
.fin-sav-bar-wrap{display:flex;align-items:center;gap:8px;width:140px}
.fin-sav-bar{height:8px;border-radius:5px;min-width:4px;transition:width .3s}
.fin-sav-pct{font-size:12px;font-weight:700;color:#6B7280;flex:0 0 32px;text-align:right}
.fin-block-desc{font-size:12.5px;color:#9CA3AF;margin-top:8px}
body.dark .fin-block{background:#1C1F24;border-color:#2A2E35}
body.dark .fin-block-val{color:#E8EAED}
body.dark .fin-income-item{border-bottom-color:#25282E}
body.dark .fin-income-item b{color:#E8EAED}
body.dark .fin-savrate-bar-bg{background:#2A2E35}
body.dark .fin-sav-card{border-bottom-color:#25282E}
.fin-toolbar{display:flex;align-items:center;gap:14px;margin-bottom:16px;flex-wrap:wrap}
.fin-hero{display:flex;align-items:center;gap:24px;background:#FFFFFF;border:1px solid #EDEEF1;border-radius:18px;padding:24px 26px;margin-bottom:14px}
.fin-hero-left{flex:1}
.fin-hero-sub{font-size:12.5px;color:#6B7280;font-weight:600;margin-bottom:6px}
.fin-hero-total{font-size:38px;font-weight:900;letter-spacing:-1.5px;color:#1B1F24;line-height:1.1}
.fin-hero-total small{font-size:16px;color:#9CA3AF;margin-left:4px;font-weight:600}
.fin-hero-breakdown{display:flex;gap:14px;flex-wrap:wrap;margin-top:10px;font-size:13px;font-weight:600;color:#374151}
.fin-hero-annual{font-size:12.5px;color:#9CA3AF;margin-top:8px}
.fin-hero-annual b{color:#0C66E4}
.fin-hero-right{display:flex;flex-direction:column;align-items:center;flex:0 0 auto}
.fin-kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:4px}
.fin-kpi{background:#FFFFFF;border:1px solid #EDEEF1;border-radius:14px;padding:15px 16px}
.fin-kpi-icon{font-size:20px;margin-bottom:7px}
.fin-kpi-label{font-size:12px;color:#6B7280;font-weight:600;margin-bottom:5px}
.fin-kpi-val{font-size:20px;font-weight:800;letter-spacing:-.5px;color:#1B1F24}
.fin-kpi-sub{font-size:11.5px;color:#9CA3AF;margin-top:4px}
.fin-card{background:#FFFFFF;border:1px solid #EDEEF1;border-radius:16px;padding:18px 20px}
.fin-card-head{font-size:14px;font-weight:700;color:#1B1F24}
.fin-leg{display:inline-block;width:20px;height:3px;border-radius:2px;vertical-align:middle;margin-right:4px}
.fin-bar-row{display:flex;align-items:center;gap:10px;margin-bottom:9px}
.fin-bar-label{flex:0 0 30px;font-size:12px;color:#6B7280;font-weight:600}
.fin-bar-track{flex:1;height:18px;background:#F4F5F7;border-radius:6px;overflow:hidden;display:flex}
.fin-bar-seg{height:100%;transition:width .3s}
.fin-bar-amt{flex:0 0 90px;text-align:right;font-size:12px;color:#374151;font-weight:600}
.fin-month-detail{margin-top:12px;display:flex;flex-direction:column}
.fin-md-row{display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #F4F5F7;font-size:14px}
.fin-md-row span{color:#6B7280}
.fin-md-row b{font-weight:700;color:#1B1F24}
@media(max-width:720px){.fin-kpi-grid{grid-template-columns:repeat(2,1fr)}.fin-hero{flex-wrap:wrap}}
body.dark .fin-hero,body.dark .fin-kpi,body.dark .fin-card{background:#1C1F24;border-color:#2A2E35}
body.dark .fin-hero-total,body.dark .fin-kpi-val,body.dark .fin-card-head{color:#E8EAED}
body.dark .fin-bar-track{background:#2A2E35}
body.dark .fin-md-row{border-bottom-color:#25282E}
body.dark .fin-md-row b{color:#E8EAED}
/* ---- 가계부 대시보드 ---- */
.bud-hero{display:flex;align-items:center;gap:20px;background:#FFFFFF;border:1px solid #EDEEF1;border-radius:16px;padding:20px 24px;margin-bottom:18px}
.bud-hero-main{flex:1}
.bud-hero-label{font-size:12.5px;color:#6B7280;font-weight:600;margin-bottom:4px}
.bud-hero-income{font-size:34px;font-weight:800;letter-spacing:-1px;color:#1B1F24}
.bud-hero-income small{font-size:15px;color:#9CA3AF;margin-left:3px}
.bud-hero-sub{display:flex;gap:14px;flex-wrap:wrap;margin-top:8px;font-size:13px;font-weight:600}
.bud-health{display:flex;flex-direction:column;align-items:center;gap:6px;flex:0 0 auto}
.bud-health-label{font-size:12px;color:#6B7280;text-align:center;line-height:1.5}
/* 저축 카드 그리드 */
.bud-sav-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:4px}
.bud-sav-card{border:1px solid #EDEEF1;border-radius:12px;padding:13px 14px;display:flex;align-items:center;gap:11px}
.bud-sav-icon{width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;flex:0 0 38px}
.bud-sav-label{font-size:12px;color:#6B7280;margin-bottom:4px}
.bud-sav-amt{font-size:16px;font-weight:800;color:#1B1F24}
.bud-sav-amt small{font-size:11px;color:#9CA3AF;margin-left:2px}
/* 추이 그래프 */
.bud-trend-card{background:#FFFFFF;border:1px solid #EDEEF1;border-radius:12px;padding:14px 16px}
.bud-trend-legend{display:flex;gap:16px;font-size:12px;color:#6B7280;margin-bottom:10px}
@media(max-width:720px){.bud-sav-grid{grid-template-columns:repeat(2,1fr)}.bud-hero{flex-wrap:wrap}}
body.dark .bud-hero,body.dark .bud-sav-card,body.dark .bud-trend-card{background:#1C1F24;border-color:#2A2E35}
body.dark .bud-hero-income,body.dark .bud-sav-amt{color:#E8EAED}
.bud-flow-seg{height:100%;transition:width .3s}
.bud-flow-legend{display:flex;flex-wrap:wrap;gap:14px;font-size:12.5px;color:#6B7280}
.bud-flow-legend span{display:flex;align-items:center;gap:5px}
.bud-cat-wrap{display:flex;gap:20px;align-items:center;flex-wrap:wrap}
.bud-donut{flex:0 0 auto}
.bud-cat-list{flex:1;min-width:220px}
.bud-cat-row{display:flex;align-items:center;gap:9px;padding:7px 0;border-bottom:1px solid #F4F5F7}
.bud-cat-row:last-child{border-bottom:none}
.bud-cat-name{flex:1;font-size:13.5px;color:#374151}
.bud-cat-amt{font-size:13.5px;font-weight:700;font-variant-numeric:tabular-nums}
.bud-cat-pct{flex:0 0 42px;text-align:right;font-size:12px;color:#9CA3AF}
.bud-summary{border:1px solid #EDEEF1;border-radius:14px;padding:16px 18px}
.bud-sum-row{display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid #F4F5F7;font-size:14px}
.bud-sum-row span{color:#6B7280}
.bud-sum-note{margin-top:12px}
.bud-sum-note label{font-size:12.5px;color:#6B7280;font-weight:600;display:block;margin-bottom:6px}
.bud-sum-note textarea{width:100%;min-height:64px;border:1px solid #E4E6EA;border-radius:9px;padding:10px 12px;line-height:1.6;resize:vertical}
.bud-sum-note textarea:focus{border-color:#0C66E4;outline:none}
/* 고정 내역 */
.fx-block{border:1px solid #EDEEF1;border-radius:12px;padding:12px 14px;margin-bottom:10px}
.fx-toolbar{display:flex;align-items:center;gap:12px;margin-bottom:14px;flex-wrap:wrap}
.btn-ghost.danger{color:#DC2626;border-color:#FCA5A5}
.btn-ghost.danger:hover{background:#FEF2F2}
.fx-head{display:flex;align-items:center;gap:8px;font-size:13.5px;font-weight:700;margin-bottom:8px}
.fx-sum{margin-left:auto;color:#6B7280;font-weight:700}
.fx-row{display:flex;align-items:center;gap:8px;margin-bottom:6px}
.fx-name{flex:1;border:1px solid #E4E6EA;border-radius:8px;height:38px;padding:0 11px;font-size:13.5px}
.fx-amt{width:120px;border:1px solid #E4E6EA;border-radius:8px;height:38px;padding:0 11px;text-align:right;font-variant-numeric:tabular-nums}
.fx-name:focus,.fx-amt:focus{border-color:#0C66E4;outline:none}
.fx-kind{border:1px solid #E4E6EA;border-radius:8px;height:38px;padding:0 8px;font-size:12.5px;color:#6B7280;background:#FAFBFC;max-width:120px}
.fx-allmonth{font-size:10.5px;font-weight:700;color:#0C66E4;background:#EFF6FF;border-radius:5px;padding:2px 6px;flex:0 0 auto}
body.dark .fx-allmonth{background:#1B2A44;color:#7DB3FF}
.fx-kind:focus{border-color:#0C66E4;outline:none}
.fx-won{color:#9CA3AF;font-size:13px}
/* 지출 입력 */
.exp-input-row{display:flex;gap:8px;flex-wrap:wrap}
.exp-input-row input,.exp-input-row select{height:42px;border:1px solid #E4E6EA;border-radius:9px;padding:0 11px;background:#FFFFFF}
.exp-input-row #expDate{flex:0 0 140px}
.exp-input-row #expCat{flex:0 0 130px}
.exp-input-row #expName{flex:1;min-width:120px}
.exp-input-row #expAmt{flex:0 0 110px;text-align:right}
.exp-input-row input:focus,.exp-input-row select:focus{border-color:#0C66E4;outline:none}
.exp-total{font-size:14px;color:#374151;margin-bottom:10px}
.exp-upload{display:flex;align-items:center;gap:12px;margin-top:10px;padding-top:12px;border-top:1px solid #F0F1F3;flex-wrap:wrap}
.exp-upload-hint{font-size:12px;color:#9CA3AF}
body.dark .exp-upload{border-top-color:#25282E}
.exp-total b{font-size:18px;color:#DC2626}
.exp-chips{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:6px}
.exp-chip{font-size:12.5px;background:#F4F5F7;border-radius:20px;padding:5px 11px;color:#4B5563}
.exp-chip b{color:#1B1F24}
.exp-row{display:flex;align-items:center;gap:11px;padding:10px 4px;border-bottom:1px solid #F4F5F7}
.exp-row:last-child{border-bottom:none}
.exp-date{flex:0 0 48px;font-size:12.5px;color:#9CA3AF;font-weight:600}
.exp-cat{flex:0 0 auto;font-size:11.5px;font-weight:700;border-radius:6px;padding:3px 8px}
.exp-name{flex:1;font-size:13.5px;color:#374151;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.exp-amt{flex:0 0 auto;font-size:14px;font-weight:700;font-variant-numeric:tabular-nums}
body.dark .bud-flow{background:#2A2E35}
body.dark .bud-summary,body.dark .fx-block{background:#1C1F24;border-color:#2A2E35}
body.dark .bud-cat-row,body.dark .bud-sum-row,body.dark .exp-row{border-bottom-color:#25282E}
body.dark .bud-cat-name,body.dark .bud-cat-amt,body.dark .exp-name{color:#E8EAED}
body.dark .fx-name,body.dark .fx-amt,body.dark .fx-kind,body.dark .exp-input-row input,body.dark .exp-input-row select,body.dark .bud-sum-note textarea{background:#22262C;border-color:#343941;color:#E8EAED}
body.dark .exp-chip{background:#282C33;color:#C4C9D0}
body.dark .exp-chip b{color:#E8EAED}
@media(max-width:640px){.bud-cat-wrap{justify-content:center}.exp-input-row #expName{flex-basis:100%}}

/* ---- 할 일 하위 미리보기 ---- */
.trow-wrap{margin-bottom:8px}
.collapse-btn{width:26px;height:26px;border-radius:7px;color:#9CA3AF;font-size:13px;transition:transform .15s,background .12s;flex:0 0 26px}
.collapse-btn.open{transform:rotate(0)}
.collapse-btn:not(.open){transform:rotate(-90deg)}
.collapse-btn:hover{background:#F1F2F4;color:#1B1F24}
.trow-subs{margin:2px 0 0 46px;padding:8px 14px;background:#FAFBFC;border:1px solid #F0F1F3;border-radius:0 0 12px 12px}
.trow-grp{margin-bottom:8px}
.trow-grp:last-child{margin-bottom:0}
.trow-grp-name{font-size:12px;font-weight:700;color:#6B7280;margin-bottom:5px}
.trow-grp-c{color:#A3AAB5;font-weight:600}
.trow-sub{display:flex;align-items:center;gap:8px;padding:3px 0;font-size:13px;color:#374151}
.mini-check{width:16px;height:16px;flex:0 0 16px;border-radius:5px;border:2px solid #D5D9DF;display:flex;align-items:center;justify-content:center}
.mini-check:hover{border-color:#22C55E}
.mini-check.on{background:#22C55E;border-color:#22C55E}
.mini-check.on::after{content:"";width:6px;height:3.5px;border-left:2px solid #FFFFFF;border-bottom:2px solid #FFFFFF;transform:rotate(-45deg) translate(1px,-1px)}
.mini-check.fail{background:#EF4444;border-color:#EF4444;font-size:9px;color:#FFFFFF;font-weight:800}
.mini-check.fail::before{content:"✕"}
.song-cat-summary{display:grid;gap:10px;margin-bottom:16px}
.song-cat-card{background:#FFFFFF;border:1px solid #EDEEF1;border-radius:13px;padding:14px 15px;cursor:pointer;transition:box-shadow .12s;min-width:0}
.song-cat-card:hover{box-shadow:0 3px 12px rgba(27,31,36,.08)}
.song-cat-card-head{display:flex;align-items:center;gap:7px;margin-bottom:7px}
.song-cat-emoji{font-size:20px}
.song-cat-label{font-size:13.5px;font-weight:700;color:#1B1F24}
.song-cat-stat{font-size:24px;font-weight:800;letter-spacing:-.5px;color:#1B1F24}
.song-cat-stat small{font-size:13px;color:#9CA3AF;margin-left:3px;font-weight:500}
.song-cat-sub{font-size:12px;color:#9CA3AF;margin-top:3px}
.song-cat-desc{font-size:12px;color:#B6BCC5;margin-top:5px;line-height:1.5}
.song-cat-add-btn{border:1.5px dashed #DDE1E6;background:none;border-radius:13px;padding:10px 14px;font-size:12.5px;color:#9CA3AF;cursor:pointer;transition:border-color .12s}
.song-cat-add-btn:hover{border-color:#0C66E4;color:#0C66E4}
.cat-row{display:flex;align-items:center;gap:6px}
body.dark .song-cat-card{background:#1C1F24;border-color:#2A2E35}
body.dark .song-cat-label,.song-cat-stat{color:#E8EAED}
body.dark .song-cat-add-btn{border-color:#343941;color:#6B7280}
.todo-date-filter input[type=date]{border:1px solid #E4E6EA;border-radius:7px;height:32px;padding:0 8px;font-size:13px;color:#374151}
.todo-date-filter input[type=date]:focus{border-color:#0C66E4;outline:none}
.iss-date{font-size:12px;color:#6B7280;margin-bottom:4px;font-weight:600}
body.dark .todo-date-filter{background:#1C1F24;border-color:#2A2E35}
body.dark .todo-date-filter input[type=date]{background:#22262C;border-color:#343941;color:#E8EAED}
.todo-drag-handle:active{cursor:grabbing}
.todo-dragging{opacity:.35}
.todo-drop-over{border:2px dashed #0C66E4!important;background:#EFF6FF;border-radius:10px}
.todo-cat-group{margin-bottom:18px}
.todo-cat-head{display:flex;align-items:center;gap:10px;padding:6px 4px;margin-bottom:6px;border-bottom:2px solid #F0F1F3}
.todo-cat-name{font-size:13px;font-weight:700;color:#374151}
.todo-cat-cnt{font-size:12px;color:#9CA3AF}
.todo-cat-body{display:flex;flex-direction:column;gap:0}
body.dark .todo-drop-over{background:#1B2A44;border-color:#3B82F6!important}
body.dark .todo-cat-head{border-bottom-color:#25282E}
body.dark .todo-cat-name{color:#C4C9D0}
/* ---- 이슈 뷰 ---- */
.issue-section{margin-bottom:20px}
.issue-section-head{font-size:13.5px;font-weight:700;margin-bottom:10px;display:flex;align-items:center;gap:8px}
.issue-card{background:#FFFFFF;border:1px solid #EDEEF1;border-radius:12px;padding:13px 15px;margin-bottom:8px;cursor:pointer;transition:box-shadow .12s}
.issue-card:hover{box-shadow:0 3px 12px rgba(27,31,36,.08)}
.issue-card.done{opacity:.6;background:#F8FAF8}
.issue-card.overdue{border-color:#FCA5A5;background:#FFF9F9}
.issue-card-head{display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap}
.issue-card-title{font-size:14px;font-weight:700;flex:1;min-width:0;color:#1B1F24}
.issue-due{font-size:12px;color:#6B7280;background:#F4F5F7;border-radius:5px;padding:2px 7px}
.issue-due.red{color:#EF4444;background:#FEF2F2}
.issue-note{font-size:13px;color:#374151;background:#FAFBFC;border-radius:8px;padding:9px 11px;line-height:1.7;white-space:pre-wrap;margin-top:4px}
.issue-note-empty{font-size:12.5px;color:#C4C9D0;font-style:italic;margin-top:4px}
.issue-resolved{font-size:12px;color:#22C55E;font-weight:600;margin-top:6px}
body.dark .issue-card{background:#1C1F24;border-color:#2A2E35}
body.dark .issue-card.done{background:#191C21}
body.dark .issue-card.overdue{background:#2A1515;border-color:#7F1D1D}
body.dark .issue-card-title{color:#E8EAED}
body.dark .issue-note{background:#191C21;color:#C4C9D0}
.trow-sub .sub-done{text-decoration:line-through;color:#B6BCC5}

/* ---- 운동 검색/필터 ---- */
.wk-filter{display:flex;align-items:center;gap:10px;margin-bottom:14px;flex-wrap:wrap}
.wk-search{display:flex;align-items:center;gap:7px;height:38px;padding:0 12px;border-radius:9px;background:#F4F5F7;flex:1;min-width:180px}
.wk-search svg{width:15px;height:15px;color:#9CA3AF;flex:0 0 15px}
.wk-search input{border:none;background:none;width:100%;font-size:13.5px}
.wk-search input:focus{outline:none}
.wk-daterange{display:flex;align-items:center;gap:7px}
.wk-daterange input{height:38px;border:1px solid #E4E6EA;border-radius:8px;padding:0 10px;font-size:13px}
.wk-daterange input:focus{border-color:#0C66E4;outline:none}
.wk-daterange span{color:#9CA3AF}

/* ---- 스트릭 보호 ---- */
.shield-bar{display:flex;align-items:center;gap:12px;background:#F7FAFF;border:1px solid #E3EEFE;border-radius:12px;padding:12px 14px;margin-bottom:18px}
.shield-info{display:flex;align-items:center;gap:11px;flex:1}
.shield-icon{font-size:22px}
.shield-title{font-size:13px;font-weight:700;color:#1E40AF}
.shield-sub{font-size:12px;color:#6B7280;margin-top:2px}

/* ---- 목표 v2 ---- */
.goal-summary{display:flex;align-items:center;gap:20px;background:#FFFFFF;border:1px solid #EDEEF1;border-radius:16px;padding:18px 22px;margin-bottom:16px}
.goal-ring-wrap{display:flex;flex-direction:column;align-items:center;gap:5px;flex:0 0 auto}
.goal-ring-label{font-size:11.5px;color:#9CA3AF;font-weight:600}
.goal-stat-list{display:flex;flex-direction:column;gap:8px}
.goal-stat-item{display:flex;justify-content:space-between;gap:24px;font-size:13.5px;color:#6B7280}
.goal-stat-item b{color:#1B1F24;font-weight:700}
.goal-card-v2{background:#FFFFFF;border:1px solid #EDEEF1;border-radius:16px;padding:18px 18px 14px;margin-bottom:12px;transition:box-shadow .14s,opacity .12s}
.goal-card-v2:hover{box-shadow:0 4px 16px rgba(27,31,36,.07)}
.goal-card-v2.goal-done{opacity:.6}
.goal-drag-handle{flex:0 0 auto;color:#C4C9D0;font-size:16px;cursor:grab;padding:0 4px 0 0;line-height:1;user-select:none;align-self:flex-start;padding-top:4px}
.goal-drag-handle:active{cursor:grabbing}
.goal-dragging{opacity:.35;box-shadow:none!important}
.goal-drop-over{border:2px dashed #0C66E4!important;background:#EFF6FF}
.goal-card-top{display:flex;gap:13px;align-items:flex-start}
.goal-icon-wrap{font-size:24px;flex:0 0 34px;padding-top:2px}
.goal-card-main{flex:1;min-width:0}
.goal-card-title-row{display:flex;align-items:center;gap:8px;margin-bottom:12px;flex-wrap:wrap}
.goal-title{font-size:15px;font-weight:700;flex:1;min-width:0}
.goal-card-v2.goal-done .goal-title{text-decoration:line-through;color:#9CA3AF}
.goal-dday.soon{color:#F59E0B;background:#FFFBEB;border-radius:6px;padding:2px 8px;font-size:11.5px;font-weight:700}
/* 진행 바 */
.goal-prog-wrap{display:flex;align-items:center;gap:12px;margin-bottom:10px}
.goal-bar-track{flex:1;height:10px;background:#F1F2F4;border-radius:6px;overflow:hidden}
.goal-bar-fill{height:100%;border-radius:6px;transition:width .4s}
.goal-pct-big{font-size:20px;font-weight:800;letter-spacing:-.5px;flex:0 0 auto}
.goal-pct-big small{font-size:12px;font-weight:600;color:#9CA3AF;margin-left:2px}
/* 마일스톤 */
.goal-milestones{display:flex;gap:0;margin-bottom:10px;position:relative}
.goal-milestones::before{content:"";position:absolute;top:7px;left:7px;right:7px;height:2px;background:#F1F2F4;z-index:0}
.goal-ms{display:flex;flex-direction:column;align-items:center;gap:4px;flex:1;position:relative;z-index:1}
.goal-ms-dot{width:14px;height:14px;border-radius:50%;background:#E4E6EA;border:2px solid #FFFFFF;transition:background .2s}
.goal-ms.on .goal-ms-dot{background:#22C55E}
.goal-ms-lb{font-size:10px;color:#9CA3AF;font-weight:600}
.goal-ms.on .goal-ms-lb{color:#16A34A;font-weight:700}
/* 메타 */
.goal-meta-row{display:flex;gap:14px;flex-wrap:wrap;font-size:12.5px;color:#8A929E;margin-bottom:10px}
.goal-ms-achieved{color:#16A34A;font-weight:700;background:#F0FDF4;border-radius:5px;padding:1px 7px}
/* 상세 패널 */
.goal-detail{background:#FAFBFC;border-radius:10px;padding:12px 14px;margin-bottom:10px;display:grid;grid-template-columns:1fr 1fr;gap:7px}
.goal-detail-row{display:flex;justify-content:space-between;align-items:center;font-size:13px}
.goal-detail-row span{color:#6B7280}
.goal-detail-row b{font-weight:700;color:#1B1F24}
.goal-recent-title{grid-column:span 2;font-size:11.5px;color:#9CA3AF;font-weight:600;margin-top:4px}
.goal-recent-list{grid-column:span 2;display:flex;flex-wrap:wrap;gap:7px}
.goal-recent-list span{font-size:12px;background:#F1F2F4;border-radius:6px;padding:3px 9px;color:#374151}
/* 슬라이더 */
.goal-manual{display:flex;align-items:center;gap:12px;margin-top:6px}
.goal-manual input[type=range]{flex:1;accent-color:#22C55E}
.goal-manual span.goal-slider-val{font-size:13px;font-weight:700;color:#22C55E;min-width:36px}
/* 다크 */
body.dark .goal-summary,body.dark .goal-card-v2{background:#1C1F24;border-color:#2A2E35}
body.dark .goal-drop-over{background:#1B2A44;border-color:#3B82F6!important}
body.dark .goal-stat-item b,body.dark .goal-title,body.dark .goal-detail-row b{color:#E8EAED}
body.dark .goal-detail{background:#191C21}
body.dark .goal-recent-list span{background:#282C33;color:#C4C9D0}
body.dark .goal-milestones::before{background:#2A2E35}
body.dark .goal-ms-dot{background:#2A2E35}

/* ---- 주간 리뷰 ---- */
.rv-nav{display:flex;align-items:center;gap:10px;margin-bottom:16px}
.rv-range{font-size:14px;font-weight:700}
.rv-hero{display:flex;align-items:center;gap:20px;background:#FFFFFF;border:1px solid #EDEEF1;border-radius:16px;padding:20px 24px;margin-bottom:16px;flex-wrap:wrap}
.rv-hero-main{flex:1;min-width:180px}
.rv-hero-label{font-size:13px;color:#6B7280;font-weight:600}
.rv-hero-val{font-size:36px;font-weight:800;letter-spacing:-1px;margin:4px 0}
.rv-hero-val small{font-size:16px;color:#9CA3AF;margin-left:2px}
.rv-hero-sub{font-size:12.5px;color:#9CA3AF}
.rv-delta{font-size:14px;font-weight:700;margin-left:8px}
.rv-delta.up{color:#16A34A}.rv-delta.down{color:#DC2626}
.rv-bars{display:flex;align-items:flex-end;gap:8px}
.rv-bar-col{display:flex;flex-direction:column;align-items:center;gap:6px}
.rv-bar{width:22px;display:flex;align-items:flex-end;justify-content:center}
.rv-bar-fill{width:100%;background:#22C55E;border-radius:5px 5px 0 0}
.rv-bar-lb{font-size:11px;color:#9CA3AF;font-weight:600}
.rv-ai{background:#FFFFFF;border:1px solid #EDEEF1;border-radius:16px;padding:18px 20px;margin-top:18px}
.rv-ai-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
.rv-ai-out{font-size:13.5px;line-height:1.8;color:#374151}
.rv-ai-out b{color:#1B1F24}
.rv-fb-section{margin-bottom:14px;padding-bottom:14px;border-bottom:1px solid #F0F1F3}
.rv-fb-section:last-child{border-bottom:none;margin-bottom:0}
.rv-fb-head{font-size:13.5px;font-weight:700;color:#1B1F24;margin-bottom:6px}
body.dark .rv-fb-section{border-bottom-color:#25282E}
body.dark .rv-fb-head{color:#E8EAED}

/* ---- D-Day ---- */
.dday-card{display:flex;align-items:center;gap:14px;background:#FFFFFF;border:1px solid #EDEEF1;border-radius:14px;padding:15px 17px;margin-bottom:9px}
.dday-card.today{border-color:#EF4444;box-shadow:0 0 0 1px rgba(239,68,68,.25)}
.dday-card.past{opacity:.6}
.dday-emoji{width:46px;height:46px;flex:0 0 46px;border-radius:50%;background:#F1F2F4;display:flex;align-items:center;justify-content:center;font-size:24px}
.dday-body{flex:1;min-width:0}
.dday-title{font-size:15px;font-weight:700;display:flex;align-items:center;gap:7px}
.dday-rep{font-size:10.5px;font-weight:700;background:#F1F2F4;color:#8A929E;border-radius:5px;padding:1px 6px}
.dday-date{font-size:12.5px;color:#8A929E;margin-top:3px}
.dday-prog{display:flex;align-items:center;gap:9px;margin-top:8px}
.dday-prog .bar-track{flex:1;height:6px}
.dday-prog span{font-size:11px;color:#9CA3AF;font-weight:600}
.dday-count{flex:0 0 auto;font-size:22px;font-weight:800;letter-spacing:-.5px;color:#0C66E4}
.dday-count.today{color:#EF4444}
.dday-count.past{color:#B6BCC5}
.dday-emoji-pick{display:flex;flex-wrap:wrap;gap:5px}
.dday-emoji-pick button{width:38px;height:38px;border-radius:9px;border:1px solid #E4E6EA;font-size:19px}
.dday-emoji-pick button.on{border-color:#0C66E4;background:#EFF6FF}

/* ---- 달력 ---- */
.cal2-top{display:flex;align-items:center;gap:12px;margin-bottom:12px}
.cal2-title{font-size:16px;font-weight:700;min-width:120px;text-align:center}
.cal2-legend{display:flex;flex-wrap:wrap;gap:12px;margin-bottom:12px}
.cal2-leg{display:flex;align-items:center;gap:5px;font-size:12px;color:#6B7280}
.cal2-dot{width:8px;height:8px;border-radius:50%;display:inline-block}
.cal2-grid-head{display:grid;grid-template-columns:repeat(7,1fr);margin-bottom:4px}
.cal2-dow{text-align:center;font-size:12px;color:#9CA3AF;font-weight:600;padding:4px 0}
.cal2-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:5px}
.cal2-cell{min-height:66px;border:1px solid #EDEEF1;border-radius:10px;padding:6px 6px 4px;cursor:pointer;transition:border-color .12s,background .12s;display:flex;flex-direction:column;gap:4px}
.cal2-cell:hover{background:#FAFBFC;border-color:#DDE1E6}
.cal2-cell.out{opacity:.4}
.cal2-cell.today{border-color:#0C66E4}
.cal2-cell.sel{background:#EFF6FF;border-color:#0C66E4;box-shadow:0 0 0 1px #0C66E4}
.cal2-n{font-size:13px;font-weight:600}
.cal2-cell.today .cal2-n{color:#0C66E4}
.cal2-dots{display:flex;flex-wrap:wrap;gap:3px}
.cal2-detail{margin-top:18px;border:1px solid #EDEEF1;border-radius:14px;padding:16px 18px}
.cal2-detail-head{font-size:14px;font-weight:700;margin-bottom:12px}
.cal2-ev{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #F4F5F7}
.cal2-ev:last-child{border-bottom:none}
.cal2-ev-dot{width:9px;height:9px;border-radius:50%;flex:0 0 9px}
.cal2-ev-txt{flex:1;font-size:13.5px;color:#374151;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cal2-ev-txt.cal2-done{text-decoration:line-through;color:#B6BCC5}
.cal2-ev-type{font-size:11px;color:#9CA3AF;background:#F4F5F7;border-radius:5px;padding:2px 7px;flex:0 0 auto}
@media(max-width:640px){.cal2-cell{min-height:52px}.cal2-legend{gap:8px}}

/* ---- 구글 캘린더 연동 바 ---- */
.gcal-bar{display:flex;align-items:center;gap:13px;background:#F7FAFF;border:1px solid #E3EEFE;border-radius:12px;padding:13px 16px;margin-bottom:16px}
.gcal-logo{font-size:22px}
.gcal-status{flex:1;min-width:0}
.gcal-title{font-size:13.5px;font-weight:700;display:flex;align-items:center;gap:8px}
.gcal-on{font-size:11px;font-weight:700;color:#15803D;background:#F0FDF4;border-radius:5px;padding:1px 7px}
.gcal-sub{font-size:12px;color:#6B7280;margin-top:2px}
.gcal-bar .btn-ghost,.gcal-bar .btn-save{flex:0 0 auto}
.cal2-detail-head{display:flex;align-items:center;gap:10px}
.cal2-ev-txt a{color:#0C66E4;text-decoration:none}
.cal2-ev-txt a:hover{text-decoration:underline}
body.dark .gcal-bar{background:#171E2B;border-color:#2A3A52}
body.dark .gcal-title{color:#E8EAED}
.log-empty{color:#A3AAB5;font-size:13px;padding:14px 0}
.log-item{display:flex;gap:12px;padding:11px 0;border-bottom:1px solid #F4F5F7}
.log-item:last-child{border-bottom:none}
.log-date{flex:0 0 62px;font-size:12px;color:#9CA3AF;font-weight:600;padding-top:1px}
.log-txt{flex:1;font-size:13.5px;line-height:1.6;color:#374151;white-space:pre-wrap;word-break:break-word}
.log-edit{color:#C4C9D0;font-size:12px}
.log-edit:hover{color:#0C66E4}

.dt-placeholder{
  flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;
  color:#C4C9D0;gap:12px;padding:40px;text-align:center;
}
.dt-placeholder svg{width:52px;height:52px;opacity:.45}
.dt-placeholder p{font-size:13px;line-height:1.7}

/* ============================================================
   TODO / JOURNAL / HISTORY
============================================================ */
.trow{
  display:flex;align-items:center;gap:13px;background:#FFFFFF;border:1px solid #EDEEF1;
  border-radius:12px;padding:13px 16px;margin-bottom:8px;transition:border-color .14s,box-shadow .14s;
}
.trow:hover{box-shadow:0 2px 10px rgba(27,31,36,.06)}
.trow.overdue{border-color:#EF4444;box-shadow:0 0 0 1px rgba(239,68,68,.28)}
.trow.dragging{opacity:.35}
.trow.drop-target{border-top:2px solid #0C66E4}
.tcheck{
  width:21px;height:21px;flex:0 0 21px;border-radius:6px;border:2px solid #D5D9DF;
  display:flex;align-items:center;justify-content:center;transition:.12s;
}
.tcheck:hover{border-color:#22C55E}
.tcheck.on{background:#22C55E;border-color:#22C55E}
.tcheck.on::after{content:"";width:8px;height:5px;border-left:2px solid #FFFFFF;border-bottom:2px solid #FFFFFF;transform:rotate(-45deg) translate(1px,-1px)}
.tcheck.fail{background:#EF4444;border-color:#EF4444;display:flex;align-items:center;justify-content:center}
.tcheck.fail::after{content:"✕";color:#FFFFFF;font-size:11px;font-weight:800;border:none;transform:none;width:auto;height:auto}
.trow.failed{opacity:.75;background:#FFF5F5}
.trow.failed .ttitle{text-decoration:line-through;color:#9CA3AF}
.sub-check.fail{background:#EF4444;border-color:#EF4444;display:flex;align-items:center;justify-content:center}
.sub-check.fail::after{content:"✕";color:#FFFFFF;font-size:9px;font-weight:800;border:none;transform:none;width:auto;height:auto}
.sub-input-fail{text-decoration:line-through;color:#9CA3AF}
.sub-failed{text-decoration:line-through;color:#EF4444;font-size:13px}
/* 이슈 패널 */
.td-issue-panel{background:#FFF5F5;border:1.5px solid #FCA5A5;border-radius:14px;padding:14px 16px;margin-bottom:14px}
.td-issue-head{display:flex;align-items:center;gap:8px;font-size:14px;font-weight:700;color:#DC2626;margin-bottom:10px}
.iss-row{border-bottom:1px solid #FEE2E2;padding:10px 0;display:flex;flex-direction:column}
.iss-row:last-child{border-bottom:none;padding-bottom:0}
.iss-row.linked{opacity:.85}
.iss-row-main{display:flex;align-items:flex-start;gap:10px}
.iss-status{font-size:16px;cursor:pointer;flex:0 0 auto;padding-top:1px;transition:opacity .15s}
.iss-status:hover{opacity:.7}
.iss-status.resolved{opacity:.5}
.iss-body{flex:1;min-width:0}
.iss-title{font-size:13.5px;font-weight:700;color:#1B1F24;margin-bottom:4px}
.iss-note{font-size:13px;color:#374151;line-height:1.7;white-space:pre-wrap;word-break:break-word;background:#FFF;border-radius:8px;padding:8px 10px;margin-top:4px;border:1px solid #FEE2E2}
.iss-note-empty{font-size:12px;color:#FCA5A5;font-style:italic;margin-top:2px}
.iss-actions{display:flex;gap:2px;flex:0 0 auto;margin-left:4px}
body.dark .td-issue-panel{background:#2A1515;border-color:#7F1D1D}
body.dark .iss-row{border-bottom-color:#3D1515}
body.dark .iss-title{color:#E8EAED}
body.dark .iss-note{background:#1C1F24;border-color:#3D1515;color:#C4C9D0}
/* 주간 기록 패널 */
.wl-panel{background:#F0F7FF;border:1.5px solid #BFDBFE;border-radius:14px;padding:14px 16px;margin-bottom:14px}
.wl-head{display:flex;align-items:center;gap:8px;font-size:13.5px;font-weight:700;color:#0C66E4;margin-bottom:10px}
.wl-range{font-size:12px;color:#6B93C9;font-weight:500}
.wl-input-row{display:flex;gap:8px;align-items:flex-end}
.wl-input-row textarea{flex:1;border:1px solid #BFDBFE;border-radius:9px;padding:9px 12px;resize:vertical;font-family:inherit;font-size:13.5px;line-height:1.6;background:#FFFFFF}
.wl-input-row textarea:focus{border-color:#0C66E4;outline:none}
.wl-input-row button{height:36px;flex:0 0 auto}
.wl-list{margin-top:10px;display:flex;flex-direction:column;gap:6px}
.wl-item{display:flex;align-items:flex-start;gap:10px;background:#FFFFFF;border-radius:9px;padding:9px 11px}
.wl-item-date{font-size:11px;font-weight:700;color:#93A9C7;flex:0 0 auto;padding-top:1px}
.wl-item-txt{flex:1;font-size:13px;color:#374151;line-height:1.6;white-space:pre-wrap;word-break:break-word}
body.dark .wl-panel{background:#16233D;border-color:#2C4A7C}
body.dark .wl-head{color:#7DB3FF}
body.dark .wl-range{color:#5C7FB0}
body.dark .wl-input-row textarea{background:#1C1F24;border-color:#2C4A7C;color:#E8EAED}
body.dark .wl-item{background:#1C1F24}
body.dark .wl-item-txt{color:#C4C9D0}
.wl-history{margin-top:12px;border-top:1px solid #DCE9FB;padding-top:10px}
.wl-history-head{font-size:11.5px;font-weight:700;color:#6B93C9;margin-bottom:6px}
.wl-history-row{display:flex;align-items:center;justify-content:space-between;padding:7px 10px;border-radius:8px;font-size:12.5px;color:#374151;cursor:pointer;background:#FFFFFF;margin-bottom:4px}
.wl-history-row:hover{background:#E0EDFE}
.wl-history-row .count{font-size:11px;color:#9CA3AF;background:#F1F2F4;border-radius:8px;padding:0 7px}
body.dark .wl-history{border-top-color:#2C4A7C}
body.dark .wl-history-head{color:#5C7FB0}
body.dark .wl-history-row{background:#1C1F24;color:#C4C9D0}
body.dark .wl-history-row:hover{background:#22335C}
.td-issue-head{font-size:13px;font-weight:700;color:#DC2626;margin-bottom:8px}
.td-issue-row{display:flex;align-items:center;gap:8px;padding:6px 0;cursor:pointer;border-bottom:1px solid #FEE2E2}
.td-issue-row:last-child{border-bottom:none}
.td-issue-dot{width:7px;height:7px;border-radius:50%;background:#EF4444;flex:0 0 auto}
.td-issue-title{flex:1;font-size:13.5px;font-weight:600;color:#1B1F24}
.td-issue-due{font-size:12px;color:#9CA3AF}
.td-issue-due.red{color:#EF4444;font-weight:700}
.td-issue-badge{font-size:11px;background:#FEF2F2;color:#EF4444;border-radius:4px;padding:1px 5px;margin-left:5px;font-weight:700}
/* 뷰 전환 탭 */
.td-view-tabs{display:flex;background:#F1F2F4;border-radius:9px;padding:3px;gap:2px;margin-bottom:12px;width:fit-content}
/* 주간 달력 */
.td-week-nav{display:flex;align-items:center;gap:10px;margin-bottom:12px}
.td-week-label{font-size:14px;font-weight:700;color:#374151}
.td-week-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}
.td-week-col{border:1px solid #EDEEF1;border-radius:10px;overflow:hidden;min-height:100px;cursor:pointer;transition:border-color .12s,background .12s}
.td-week-col:hover{border-color:#93C5FD;background:#F8FBFF}
.td-week-col.td-week-sel{border-color:#0C66E4;background:#EFF6FF}
.td-week-col.td-week-sel .td-week-date{color:#0C66E4;font-weight:800}
.todo-day-filter-badge{display:flex;align-items:center;font-size:13px;font-weight:600;color:#0C66E4;background:#EFF6FF;border-radius:8px;padding:8px 14px;margin-bottom:10px}
.td-week-col.today{border-color:#0C66E4;background:#F8FBFF}
.td-week-head{padding:6px 8px;border-bottom:1px solid #F4F5F7;display:flex;flex-direction:column;align-items:center;gap:1px}
.td-week-dow{font-size:11px;color:#9CA3AF;font-weight:600}
.td-week-date{font-size:15px;font-weight:800;color:#374151}
.td-week-col.today .td-week-date{color:#0C66E4}
.td-week-head.sun .td-week-dow,.td-week-head.sun .td-week-date{color:#EF4444}
.td-week-head.sat .td-week-dow,.td-week-head.sat .td-week-date{color:#0C66E4}
.td-week-cnt{font-size:11px;background:#EFF6FF;color:#0C66E4;border-radius:5px;padding:1px 6px;font-weight:700;margin-top:2px}
.td-week-body{padding:6px}
.td-week-item{display:flex;align-items:center;gap:5px;padding:3px 4px;border-radius:5px;cursor:pointer;margin-bottom:3px;font-size:11.5px}
.td-week-item:hover{background:#F4F5F7}
.td-week-item.done .td-week-ititle{text-decoration:line-through;color:#9CA3AF}
.td-week-item.failed .td-week-ititle{color:#EF4444;text-decoration:line-through}
.td-week-item.issue{background:#FFF5F5}
.td-week-dot{width:7px;height:7px;border-radius:50%;flex:0 0 auto}
.td-week-dot.green{background:#22C55E}
.td-week-dot.red{background:#EF4444}
.td-week-dot.gray{background:#D1D5DB}
.td-week-ititle{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1}
/* 히스토리 */
.td-hist-add{display:flex;flex-direction:column;gap:8px;margin-bottom:10px}
.td-hist-add textarea{border:1px solid #E4E6EA;border-radius:8px;padding:9px 11px;font-size:13.5px;line-height:1.5}
.td-hist-item{display:flex;align-items:flex-start;gap:8px;padding:8px 0;border-bottom:1px solid #F4F5F7}
.td-hist-item:last-child{border-bottom:none}
.td-hist-txt{flex:1;font-size:13px;color:#374151;white-space:pre-wrap;word-break:break-word}
.td-hist-btns{display:flex;gap:3px;flex-shrink:0}
body.dark .td-issue-panel{background:#2A1515;border-color:#7F1D1D}
body.dark .td-issue-title{color:#E8EAED}
body.dark .td-week-col{background:#1C1F24;border-color:#2A2E35}
body.dark .td-week-col:hover{border-color:#3B82F6;background:#1B2233}
body.dark .td-week-col.td-week-sel{background:#1B2A44;border-color:#3B82F6}
body.dark .todo-day-filter-badge{background:#1B2A44;color:#7DB3FF}
body.dark .td-week-col.today{background:#1B2A44;border-color:#3B82F6}
body.dark .trow.failed{background:#1C1515}
.tbody{flex:1;min-width:0}
.ttitle{font-size:14.5px;font-weight:500}
.trow.done .ttitle{text-decoration:line-through;color:#B6BCC5}
.tmeta{font-size:12px;color:#9CA3AF;margin-top:4px;display:flex;gap:10px;align-items:center}
.tmeta .due.red{color:#DC2626;font-weight:600}
.tmeta .tag{background:#F1F2F4;border-radius:5px;padding:1px 6px;font-size:11px}

.jcard{border:1px solid #EDEEF1;border-radius:14px;padding:16px 18px;margin-bottom:10px}
.jhead{display:flex;align-items:center;gap:10px;margin-bottom:9px}
.jdate{font-size:13px;font-weight:700}
.jmood{font-size:19px}
.jtext{font-size:13.5px;line-height:1.75;color:#374151;white-space:pre-wrap;word-break:break-word}

.hrow{display:flex;gap:14px;padding:11px 2px;border-bottom:1px solid #F4F5F7;font-size:13px;align-items:baseline}
.hts{flex:0 0 132px;color:#A3AAB5;font-size:12px;font-variant-numeric:tabular-nums}
.htype{flex:0 0 62px;font-size:11px;font-weight:700;border-radius:5px;padding:2px 6px;text-align:center}
.htype.create{background:#EFF6FF;color:#1D4ED8}
.htype.check{background:#F0FDF4;color:#15803D}
.htype.uncheck{background:#FFFBEB;color:#B45309}
.htype.edit{background:#F5F3FF;color:#6D28D9}
.htype.delete{background:#FEF2F2;color:#B91C1C}
.hmsg{flex:1;color:#374151;line-height:1.55}

/* stats */
.sgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:12px;margin-bottom:26px}

/* ---- 통계 탭 ---- */
.stats-range{display:flex;align-items:center;gap:12px;margin-bottom:16px;flex-wrap:wrap}
.stats-range-presets{display:flex;background:#F1F2F4;border-radius:9px;padding:3px;gap:2px}
/* 월별 막대 */
.stats-month-bars{display:flex;align-items:flex-end;gap:10px;padding:12px 0 4px;border:1px solid #EDEEF1;border-radius:12px;padding:12px 16px}
.stats-mbar{display:flex;flex-direction:column;align-items:center;gap:4px;flex:1}
.stats-mbar-fill{width:100%;max-width:40px;border-radius:4px 4px 0 0;min-height:4px;transition:height .3s}
.stats-mbar-pct{font-size:12px;font-weight:700;color:#374151}
.stats-mbar-lb{font-size:11.5px;color:#9CA3AF}
/* 요일별 */
.stats-dow{display:flex;gap:6px;padding:12px 0 4px;border:1px solid #EDEEF1;border-radius:12px;padding:14px 16px}
.stats-dow-col{display:flex;flex-direction:column;align-items:center;gap:3px;flex:1}
.stats-dow-bar-wrap{height:68px;display:flex;align-items:flex-end;width:100%;justify-content:center}
.stats-dow-bar{width:100%;max-width:32px;border-radius:4px 4px 0 0;min-height:4px;transition:height .3s}
.stats-dow-pct{font-size:11.5px;font-weight:700;color:#374151}
.stats-dow-lb{font-size:12px;color:#6B7280;font-weight:600}
.stats-dow-fail{font-size:10.5px;color:#EF4444;font-weight:700}
/* 습관별 */
.stats-habit-list{display:flex;flex-direction:column;gap:6px}
.stats-habit-row{border:1px solid #EDEEF1;border-radius:12px;padding:13px 15px;cursor:pointer;transition:border-color .12s}
.stats-habit-row:hover{border-color:#DDE1E6}
.stats-habit-row.sel{border-color:#0C66E4;background:#F8FBFF}
.stats-habit-left{display:flex;align-items:center;gap:9px;margin-bottom:9px}
.stats-habit-name{font-size:14px;font-weight:600;flex:1}
.stats-fail-badge{font-size:11px;font-weight:700;color:#EF4444;background:#FEF2F2;border-radius:5px;padding:2px 7px}
.stats-habit-right{display:flex;align-items:center;gap:10px}
.stats-habit-pct{flex:0 0 40px;text-align:right;font-size:13.5px;font-weight:700;color:#22C55E}
.stats-habit-detail{border-top:1px solid #F0F1F3;margin-top:12px;padding-top:12px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}
.stats-detail-row{display:flex;flex-direction:column;align-items:center;background:#FAFBFC;border-radius:8px;padding:8px}
.stats-detail-row span{font-size:11.5px;color:#8A929E;margin-bottom:4px}
.stats-detail-row b{font-size:15px;font-weight:700}
body.dark .stats-month-bars,body.dark .stats-dow{background:#1C1F24;border-color:#2A2E35}
body.dark .stats-mbar-pct,body.dark .stats-dow-pct,body.dark .stats-habit-name{color:#E8EAED}
body.dark .stats-habit-row{background:#1C1F24;border-color:#2A2E35}
body.dark .stats-habit-row.sel{background:#1B2A44;border-color:#3B82F6}
body.dark .stats-detail-row{background:#191C21}
body.dark .stats-habit-detail{border-top-color:#25282E}
.heat{display:flex;gap:3px;flex-wrap:wrap;margin-top:10px}
.hcell{width:13px;height:13px;border-radius:3px;background:#F1F2F4}
.hcell.l1{background:#DCFCE7}.hcell.l2{background:#86EFAC}
.hcell.l3{background:#4ADE80}.hcell.l4{background:#16A34A}
.bar-row{display:flex;align-items:center;gap:11px;margin-bottom:9px}
.bar-name{flex:0 0 130px;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bar-track{flex:1;height:9px;background:#F1F2F4;border-radius:5px;overflow:hidden}
.bar-fill{height:100%;background:#22C55E;border-radius:5px;transition:width .35s}
.bar-val{flex:0 0 46px;text-align:right;font-size:12.5px;color:#6B7280;font-variant-numeric:tabular-nums}

/* settings */
.set-row{display:flex;align-items:center;justify-content:space-between;padding:15px 0;border-bottom:1px solid #F0F1F3}
.set-row .lb{font-size:14px;font-weight:600}
.set-row .ds{font-size:12.5px;color:#9CA3AF;margin-top:3px;line-height:1.5}
.btn-ghost{border:1px solid #E4E6EA;border-radius:8px;padding:8px 14px;font-size:13px;font-weight:600}
.btn-ghost:hover{background:#F4F5F7}
.btn-ghost.danger{color:#DC2626;border-color:#FCA5A5}
.btn-ghost.danger:hover{background:#FEF2F2}
.switch{width:42px;height:24px;border-radius:14px;background:#DFE2E6;position:relative;transition:background .18s;flex:0 0 42px}
.switch.on{background:#22C55E}
.switch::after{content:"";position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#FFFFFF;transition:transform .18s}
.switch.on::after{transform:translateX(18px)}

/* ============================================================
   MODAL
============================================================ */
.overlay{position:fixed;inset:0;background:rgba(27,31,36,.34);z-index:120;
  display:flex;align-items:center;justify-content:center;padding:20px}
.modal{background:#FFFFFF;border-radius:16px;width:100%;max-width:520px;
  box-shadow:0 16px 48px rgba(27,31,36,.20);max-height:90vh;display:flex;flex-direction:column}
.modal-head{display:flex;align-items:center;padding:22px 26px 6px}
.modal-head h3{font-size:19px;font-weight:700;flex:1}
.modal-body{padding:16px 26px 4px;overflow-y:auto}
.modal-foot{display:flex;justify-content:flex-end;gap:9px;padding:18px 26px 22px}
.mrow{display:flex;align-items:center;gap:16px;margin-bottom:13px}
.mrow>label{flex:0 0 88px;font-size:13.5px;color:#4B5563;font-weight:600}
.mrow .ctl{flex:1;min-width:0}
.mrow input[type=text],.mrow input[type=date],.mrow input[type=number],.mrow select,.mrow textarea{
  width:100%;height:42px;border:1px solid #E4E6EA;border-radius:9px;padding:0 12px;background:#FFFFFF;
}
.mrow textarea{height:auto;padding:11px 12px;resize:vertical;min-height:96px;line-height:1.6}
.mrow input:focus,.mrow select:focus,.mrow textarea:focus{border-color:#0C66E4;outline:none}
.emoji-btn{width:52px;height:52px;border-radius:50%;background:#FFF9C4;font-size:26px;
  display:flex;align-items:center;justify-content:center;position:relative;flex:0 0 52px}
.emoji-btn .pen{position:absolute;bottom:-1px;right:-1px;width:17px;height:17px;border-radius:50%;
  background:#FFFFFF;border:1px solid #E4E6EA;font-size:9px;display:flex;align-items:center;justify-content:center}
.emoji-pop{display:grid;grid-template-columns:repeat(10,1fr);gap:3px;background:#FFFFFF;
  border:1px solid #E4E6EA;border-radius:11px;padding:9px;margin-top:9px;max-height:172px;overflow-y:auto}
.emoji-pop button{height:30px;border-radius:7px;font-size:19px}
.emoji-pop button:hover{background:#F1F2F4}
.wk-days{display:flex;gap:5px}
.wk-days button{flex:1;height:36px;border-radius:8px;border:1px solid #E4E6EA;font-size:12.5px;font-weight:600;color:#6B7280}
.wk-days button.on{background:#22C55E;border-color:#22C55E;color:#FFFFFF}
.mdivider{height:1px;background:#F0F1F3;margin:16px 0}
.mcheck{display:flex;align-items:center;gap:9px;font-size:13.5px;color:#374151;cursor:pointer;padding:4px 0}
.mcheck input{width:16px;height:16px;accent-color:#22C55E}
.btn-save{background:#1B1F24;color:#FFFFFF;border-radius:9px;padding:10px 22px;font-weight:600}
.btn-save:hover{opacity:.86}
.btn-cancel{border:1px solid #E4E6EA;border-radius:9px;padding:10px 20px;font-weight:600;color:#4B5563}
.btn-cancel:hover{background:#F4F5F7}
.mood-pick{display:flex;gap:7px}
.mood-pick button{width:42px;height:42px;border-radius:10px;font-size:22px;border:1px solid #E4E6EA}
.mood-pick button.on{border-color:#22C55E;background:#F0FDF4}

/* context menu */
.ctxmenu{position:fixed;z-index:150;background:#FFFFFF;border:1px solid #E4E6EA;border-radius:11px;
  box-shadow:0 8px 26px rgba(27,31,36,.16);padding:5px;min-width:172px}
.ctxmenu button{display:flex;align-items:center;gap:9px;width:100%;text-align:left;
  padding:9px 11px;border-radius:7px;font-size:13.5px;color:#374151}
.ctxmenu button:hover{background:#F4F5F7}
.ctxmenu button.danger{color:#DC2626}
.ctxmenu button.danger:hover{background:#FEF2F2}
.ctxmenu .sep{height:1px;background:#F0F1F3;margin:4px 0}

/* toast */
#toast{position:fixed;bottom:26px;left:50%;transform:translateX(-50%) translateY(80px);
  background:#1B1F24;color:#FFFFFF;padding:11px 20px;border-radius:10px;font-size:13.5px;
  z-index:300;opacity:0;transition:opacity .22s,transform .22s;pointer-events:none;max-width:80vw}
#toast.show{opacity:1;transform:translateX(-50%) translateY(0)}

/* sync pill */
.sync{position:fixed;left:76px;bottom:16px;font-size:11px;color:#A3AAB5;
  background:#F4F5F7;border-radius:20px;padding:4px 11px;z-index:60;display:flex;align-items:center;gap:6px}
.sync .led{width:6px;height:6px;border-radius:50%;background:#22C55E}
.sync.local .led{background:#F59E0B}

/* ============================================================
   DARK
============================================================ */
body.dark{background:#16181C;color:#E8EAED}
body.dark #app,body.dark .main,body.dark .detail{background:#16181C}
body.dark .sidebar{background:#1C1F24;border-right-color:#282C33}
body.dark .nav-btn:hover{background:#282C33;color:#C4C9D0}
body.dark .nav-btn.active{background:#2E333B;color:#FFFFFF}
body.dark .topbar{border-bottom-color:#25282E}
body.dark .icon-btn{color:#98A0AC}
body.dark .icon-btn:hover{background:#282C33;color:#FFFFFF}
body.dark .searchbox{background:#22262C}
body.dark .searchbox input{color:#E8EAED}
body.dark .card,body.dark .trow,body.dark .stat,body.dark .calbox,body.dark .jcard{
  background:#1C1F24;border-color:#2A2E35}
body.dark .card.done-all{background:#1A1D22}
body.dark .h-emoji{background:#282C33}
body.dark .h-name,body.dark .wcol .dnum,body.dark .ttitle,body.dark .stat .vl,
body.dark .cal-cell .n,body.dark .log-title,body.dark .topbar h2,body.dark .jdate{color:#E8EAED}
body.dark .hdot{background:#2E333B}
body.dark .hdot.fail{background:#DC2626}
body.dark .hdot.future{background:#22262C;border-color:#343941}
body.dark .cal-cell .c{background:#2A2E35}
body.dark .cal-cell:hover,body.dark .wcol:hover{background:#22262C}
body.dark .log-item,body.dark .hrow,body.dark .set-row{border-bottom-color:#25282E}
body.dark .log-txt,body.dark .hmsg,body.dark .jtext{color:#B9C0C9}
body.dark .detail{border-left-color:#25282E}
body.dark .dt-head{border-bottom-color:#25282E}
body.dark .detail.empty-state{background:#191C21}
body.dark .modal,body.dark .ctxmenu,body.dark .auth-card{background:#1C1F24}
body.dark .modal input,body.dark .modal select,body.dark .modal textarea,
body.dark .auth-card input{background:#22262C;border-color:#343941;color:#E8EAED}
body.dark .modal-head h3,body.dark .auth-card h1{color:#E8EAED}
body.dark .ctxmenu{border-color:#343941}
body.dark .ctxmenu button{color:#C4C9D0}
body.dark .ctxmenu button:hover{background:#282C33}
body.dark .btn-cancel,body.dark .btn-ghost{border-color:#343941;color:#C4C9D0}
body.dark .btn-cancel:hover,body.dark .btn-ghost:hover{background:#282C33}
body.dark .btn-save,body.dark .btn-primary{background:#3B82F6}
body.dark .emoji-pop{background:#22262C;border-color:#343941}
body.dark .emoji-pop button:hover{background:#2E333B}
body.dark #authScreen{background:#101215}
body.dark .bar-track,body.dark .hcell{background:#2A2E35}
body.dark .memobox{background:#1C1F24;border-color:#2A2E35}
body.dark .memobox textarea,body.dark .memo-toprow input{background:#22262C;border-color:#343941;color:#E8EAED}
body.dark .memo-check-tag{background:#14311F;color:#4ADE80}
body.dark .dt-title-input:focus,body.dark .grp-input:focus,body.dark .sub-input:focus{background:#282C33}
body.dark .td-field input,body.dark .td-field select,body.dark .td-field textarea,
body.dark .td-hist-add input,body.dark .cat-add input,body.dark .cat-name{background:#22262C;border-color:#343941;color:#E8EAED}
body.dark .td-field input[readonly]{background:#191C21;color:#98A0AC}
body.dark .grp-block{background:#191C21;border-color:#2A2E35}
body.dark .grp-count,body.dark .grp-input:focus{background:#282C33}
body.dark .sub-input:focus{background:#282C33}
body.dark .td-hist-item{border-bottom-color:#25282E}
body.dark .td-hist-txt,body.dark .dt-title-input{color:#E8EAED}
body.dark .add-grp{border-color:#343941}
body.dark .add-grp:hover{background:#22262C}
body.dark{--wgrid:#2A2E35;--wtick:#98A0AC}
body.dark .w-input,body.dark .w-chart{background:#1C1F24;border-color:#2A2E35}
body.dark .w-field input,body.dark .w-goal-row input{background:#22262C;border-color:#343941;color:#E8EAED}
body.dark .w-goal-row{border-top-color:#25282E}
body.dark .w-row{border-bottom-color:#25282E}
body.dark .w-date,body.dark .w-kg{color:#E8EAED}
body.dark .hview-tabs{background:#22262C}
body.dark .hvt.on{background:#2E333B;color:#FFFFFF}
body.dark .hnav-label{color:#C4C9D0}
body.dark .hnav-label:hover{background:#282C33}
body.dark .hrange input{background:#22262C;border-color:#343941;color:#E8EAED}
body.dark .rdot{background:#2E333B}
body.dark .rdot.future{background:#22262C;border-color:#343941}
body.dark .minical{background:#191C21;border-color:#2A2E35}
body.dark .mc-n{color:#E8EAED}
body.dark .mc-cell:hover{background:#22262C}
body.dark{--dbtext:#E8EAED}
body.dark .db-ring-card,body.dark .db-trend-card,body.dark .db-tile,body.dark .db-panel,
body.dark .wk-card,body.dark .study-card,body.dark .wm-ex{background:#1C1F24;border-color:#2A2E35}
body.dark .study-drop-over{background:#1B2A44;border-color:#3B82F6!important}
body.dark .db-tile.danger{background:#241A1C;border-color:#5B2A2E}
body.dark .db-tile-val,body.dark .wk-date,body.dark .study-title{color:#E8EAED}
body.dark .db-li,body.dark .wk-ex,body.dark .study-logs{border-color:#25282E}
body.dark .db-li-btn:hover{background:#22262C}
body.dark .db-li-txt,body.dark .study-log-txt{color:#B9C0C9}
body.dark .wk-tag,body.dark .study-cur,body.dark .set-chip{background:#22262C}
body.dark .set-chip{color:#7DB3FF}
body.dark .study-cur{color:#7DB3FF}
body.dark .wk-memo{background:#191C21;color:#B9C0C9}

/* ---- 체성분 분석 ---- */
.bc-upload-area{border:2px dashed #DDE1E6;border-radius:16px;padding:32px 20px;text-align:center;transition:border-color .15s,background .15s;cursor:pointer;margin-bottom:16px}
.bc-upload-area:hover,.bc-drag{border-color:#0C66E4;background:#F8FBFF}
.bc-upload-icon{font-size:40px;margin-bottom:10px}
.bc-upload-title{font-size:15px;font-weight:700;color:#374151;margin-bottom:6px}
.bc-upload-desc{font-size:13px;color:#9CA3AF;line-height:1.7}
.bc-analyzing{display:flex;align-items:center;gap:12px;background:#EFF6FF;border-radius:12px;padding:14px 18px;font-size:14px;color:#0C66E4;font-weight:600;margin-bottom:14px}
.bc-spin{font-size:20px;animation:spin 1.2s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.bc-latest{background:#FFFFFF;border:1px solid #EDEEF1;border-radius:16px;padding:18px 20px}
.bc-latest-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:8px}
.bc-latest-date{font-size:13.5px;font-weight:700;color:#374151}
.bc-body-type{font-size:13px;color:#EF4444;font-weight:700;margin-top:3px}
.bc-vs-badge{font-size:11.5px;background:#EFF6FF;color:#0C66E4;font-weight:700;border-radius:7px;padding:4px 10px}
.bc-fields{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.bc-field{background:#FAFBFC;border-radius:10px;padding:11px 13px}
.bc-field-label{font-size:11.5px;color:#9CA3AF;font-weight:600;margin-bottom:5px}
.bc-field-val{font-size:18px;font-weight:800;color:#1B1F24;display:flex;align-items:baseline;flex-wrap:wrap;gap:2px}
.bc-field-val small{font-size:11px;color:#9CA3AF;font-weight:500;margin-left:2px}
.bc-memo{font-size:13px;color:#6B7280;background:#F8F9FB;border-radius:9px;padding:10px 12px;margin-top:12px}
.bc-hist-list{display:flex;flex-direction:column;gap:0}
.bc-hist-row{display:flex;align-items:center;gap:12px;padding:11px 4px;border-bottom:1px solid #F4F5F7}
.bc-hist-row:last-child{border-bottom:none}
.bc-hist-date{flex:0 0 80px;font-size:12.5px;color:#9CA3AF;font-weight:600}
.bc-hist-vals{flex:1;display:flex;flex-wrap:wrap;gap:10px;font-size:12.5px;color:#374151}
.bc-type-chip{background:#FEF2F2;color:#EF4444;border-radius:5px;padding:1px 7px;font-weight:700;font-size:11px}
@media(max-width:640px){.bc-fields{grid-template-columns:repeat(2,1fr)}}
body.dark .bc-upload-area{border-color:#343941}
body.dark .bc-upload-area:hover{background:#1B2A44;border-color:#3B82F6}
body.dark .bc-latest{background:#1C1F24;border-color:#2A2E35}
body.dark .bc-field{background:#191C21}
body.dark .bc-field-val{color:#E8EAED}
body.dark .bc-hist-row{border-bottom-color:#25282E}
body.dark .bc-hist-vals{color:#C4C9D0}
body.dark .wm-name,body.dark .wm-set input,body.dark .study-log-in,body.dark .study-min-in{background:#22262C;border-color:#343941;color:#E8EAED}
body.dark .trow-subs{background:#191C21;border-color:#25282E}
body.dark .trow-sub{color:#C4C9D0}
body.dark .collapse-btn:hover{background:#282C33;color:#FFFFFF}
body.dark .wk-search{background:#22262C}
body.dark .wk-search input{color:#E8EAED}
body.dark .wk-daterange input{background:#22262C;border-color:#343941;color:#E8EAED}
body.dark .shield-bar{background:#171E2B;border-color:#2A3A52}
body.dark .shield-title{color:#7DB3FF}
body.dark .goal-card,body.dark .rv-hero,body.dark .rv-ai{background:#1C1F24;border-color:#2A2E35}
body.dark .goal-title,body.dark .rv-hero-val,body.dark .rv-ai-out b{color:#E8EAED}
body.dark .goal-type{background:#232842;color:#A5B4FC}
body.dark .goal-dday{background:#1B2A44;color:#7DB3FF}
body.dark .goal-note,body.dark .db-panel .goal-note{background:#191C21;color:#B9C0C9}
body.dark .rv-ai-out{color:#B9C0C9}
body.dark .dday-card{background:#1C1F24;border-color:#2A2E35}
body.dark .dday-card.today{border-color:#EF4444}
body.dark .dday-emoji{background:#282C33}
body.dark .dday-title{color:#E8EAED}
body.dark .dday-rep{background:#282C33}
body.dark .dday-emoji-pick button{background:#22262C;border-color:#343941}
body.dark .dday-emoji-pick button.on{border-color:#3B82F6;background:#1B2A44}
body.dark .cal2-title{color:#E8EAED}
body.dark .cal2-cell{background:#1C1F24;border-color:#2A2E35}
body.dark .cal2-cell:hover{background:#22262C}
body.dark .cal2-cell.sel{background:#1B2A44}
body.dark .cal2-n{color:#E8EAED}
body.dark .cal2-detail{background:#1C1F24;border-color:#2A2E35}
body.dark .cal2-detail-head{color:#E8EAED}
body.dark .cal2-ev{border-bottom-color:#25282E}
body.dark .cal2-ev-txt{color:#B9C0C9}
body.dark .cal2-ev-type{background:#282C33}
body.dark .sync{background:#22262C}
body.dark .grp-title .count,body.dark .tmeta .tag,body.dark .h-name .badge{background:#282C33}

/* responsive */
@media(max-width:1180px){.detail{width:400px;flex:0 0 400px}}
@media(max-width:900px){
  .detail{position:fixed;right:0;top:0;bottom:0;width:100%;max-width:440px;z-index:110;
    box-shadow:-8px 0 32px rgba(27,31,36,.18)}
  .scroll{padding:16px 14px 80px}
  .topbar{padding:0 14px}
  .searchbox{width:120px}
  .h-dots{gap:5px}
  .hdot{width:19px;height:19px;flex:0 0 19px}
  /* 좌우 분할 뷰는 세로로 쌓기 */
  .td-split{display:block}
  .td-left{width:100%}
  .td-right{width:100%;flex:none;position:static;max-height:none;margin-top:14px}
}
/* ============================================================
   화면 크기별 최적화
============================================================ */

/* 큰 모니터: 콘텐츠가 과하게 늘어나지 않도록 좌우 여백 확보 */
@media(min-width:1500px){
  .scroll{padding-left:max(26px, calc((100% - 1120px) / 2));padding-right:max(26px, calc((100% - 1120px) / 2))}
}
@media(min-width:1900px){
  .scroll{padding-left:max(26px, calc((100% - 1280px) / 2));padding-right:max(26px, calc((100% - 1280px) / 2))}
}

/* 태블릿 / 폴드 펼친 화면 */
@media(max-width:1100px){
  .stat-grid[style*="repeat(4"]{grid-template-columns:repeat(2,1fr)!important}
  .fin-kpi-grid,.bud-sav-grid{grid-template-columns:repeat(2,1fr)}
  .asset-cat-grid{grid-template-columns:repeat(3,1fr)}
}

/* 좁은 화면 (폰 / 폴드 커버 화면) */
@media(max-width:700px){
  /* 그리드는 전부 2열 이하로 */
  .stat-grid,
  .stat-grid[style*="repeat(3"],
  .stat-grid[style*="repeat(4"]{grid-template-columns:repeat(2,1fr)!important}
  .fin-kpi-grid,.bud-sav-grid,.asset-cat-grid,.bc-fields,.asset-exp-grid{grid-template-columns:repeat(2,1fr)!important}
  .song-cat-summary{grid-template-columns:repeat(2,1fr)!important}

  /* 여백 축소 */
  .scroll{padding:14px 12px 90px}
  .topbar{padding:0 12px;height:56px;flex:0 0 56px}
  .topbar h2{font-size:19px}
  .searchbox{width:100px}

  /* 카드 여백 축소 */
  .fin-block,.bud-hero,.td-issue-panel,.wl-panel,.note-header,.asset-total-card{padding:14px 15px}
  .stat{padding:12px 13px}
  .stat .vl{font-size:20px}

  /* 날짜 조회 바 세로 배치 */
  .todo-date-filter,.wk-filter,.book-toolbar{flex-wrap:wrap;gap:6px}
  .todo-date-filter input[type=date],.wk-daterange input[type=date]{flex:1;min-width:130px}
  .book-toolbar > *{flex:1 1 100%}

  /* 입력 행 세로 배치 */
  .exp-input-row{flex-wrap:wrap;gap:8px}
  .exp-input-row > *{flex:1 1 calc(50% - 4px)}
  .exp-input-row #expName,.exp-input-row button{flex-basis:100%}
  .fx-row{flex-wrap:wrap;gap:6px}
  .fx-name{flex:1 1 100%}
  .fx-amt{flex:1 1 auto}
  .fx-kind{flex:1 1 auto;max-width:none}

  /* 주간 스트립 / 할일 주간 그리드 */
  .td-week-grid{grid-template-columns:repeat(7,1fr);gap:3px}
  .td-week-col{min-height:72px;border-radius:8px}
  .td-week-head{padding:5px 2px}
  .td-week-date{font-size:14px}
  .td-week-item{font-size:10px;padding:1px 3px}
  .td-week-ititle{font-size:10px}

  /* 달력 셀 */
  .cal2-cell{min-height:46px;font-size:11px}
  .cal-cell{font-size:11px}

  /* 운동 상세 패널 */
  .wkd-row label{flex:0 0 56px;font-size:12px}
  .wkd-kg,.wkd-reps{width:52px}

  /* 노래/노트 탭 */
  .note-cat-tabs{gap:6px}
  .note-cat-tab{padding:7px 11px;font-size:12px}

  /* 마인드맵 */
  .mm-canvas-wrap{height:calc(100vh - 230px);min-height:340px}
  .mm-bb-actions button{padding:8px 12px;font-size:12px}

  /* 시간표 */
  .sched-tabs{gap:3px}
  .sched-tab{padding:7px 1px}
  .sched-tab-dow{font-size:10.5px}
  .sched-tab-date{font-size:14px}
}

/* 아주 좁은 화면 (폴드 커버 등) */
@media(max-width:420px){
  .stat-grid,.stat-grid[style*="repeat(3"],.stat-grid[style*="repeat(4"],
  .fin-kpi-grid,.bud-sav-grid,.asset-cat-grid,.bc-fields,.asset-exp-grid,
  .song-cat-summary{grid-template-columns:1fr!important}
  .scroll{padding:12px 10px 90px}
  .searchbox{width:80px}
  .topbar h2{font-size:17px}
  .td-view-tabs,.hview-tabs{overflow-x:auto;flex-wrap:nowrap;-webkit-overflow-scrolling:touch;scrollbar-width:none}
  .td-view-tabs::-webkit-scrollbar,.hview-tabs::-webkit-scrollbar{display:none}
  .hvt{flex:0 0 auto;white-space:nowrap}
  .td-week-col{min-height:60px}
  .td-week-item{display:none}
  .td-week-cnt{display:block}
  .bud-flow-legend{font-size:11px;gap:6px}
  .exp-row{flex-wrap:wrap;gap:4px}
  .exp-name{flex:1 1 100%;order:5;font-size:12px}
}

@media(prefers-reduced-motion:reduce){*{transition:none !important;animation:none !important}}
</style>
</head>
<body>

<!-- ==========================================================
     LOGIN
=========================================================== -->
<div id="authScreen">
  <div class="auth-card">
    <div class="auth-logo">✓</div>
    <h1 id="authTitle">다시 시작하기</h1>
    <p class="sub" id="authSub">계정으로 로그인하면 어느 기기에서든 기록이 이어집니다.</p>

    <div class="field" id="fName" style="display:none">
      <label for="inName">이름</label>
      <input id="inName" type="text" placeholder="현민" autocomplete="name" />
    </div>
    <div class="field">
      <label for="inEmail">이메일</label>
      <input id="inEmail" type="email" placeholder="you@example.com" autocomplete="email" />
    </div>
    <div class="field">
      <label for="inPw">비밀번호</label>
      <input id="inPw" type="password" placeholder="6자 이상" autocomplete="current-password" />
    </div>

    <button class="btn-primary" id="btnAuth">로그인</button>
    <div id="authMsg"></div>

    <div class="auth-switch">
      <span id="switchText">계정이 없나요?</span>
      <button id="btnSwitch">계정 만들기</button>
    </div>
    <div class="mode-note" id="modeNote"></div>
  </div>
</div>

<!-- ==========================================================
     APP
=========================================================== -->
<div id="app" class="hide">

  <!-- sidebar -->
  <nav class="sidebar">
    <div class="avatar" id="avatarBtn"><span id="avatarTxt">현민</span><span class="dot"></span></div>
    <div id="navTabs" class="nav-tabs"></div>
    <div class="nav-spacer"></div>
    <button class="nav-btn" id="btnTheme">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
      <span class="tip">테마 전환</span>
    </button>
    <button class="nav-btn" data-tab="settings" id="navSettings">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 008 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 8a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 3.6 1.65 1.65 0 0010 2.09V2a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 8v0a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
      <span class="tip">설정</span>
    </button>
  </nav>

  <!-- main -->
  <section class="main">
    <header class="topbar">
      <h2 id="pageTitle">습관</h2>
      <span class="chev">▾</span>
      <div class="top-actions">
        <div class="searchbox">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
          <input id="searchInput" type="text" placeholder="검색" />
        </div>
        <button class="icon-btn" id="btnSort" title="정렬">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M6 12h12M10 18h4"/></svg>
        </button>
        <button class="icon-btn" id="btnAdd" title="새로 만들기">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
        </button>
        <button class="icon-btn" id="btnMore" title="더 보기">
          <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/></svg>
        </button>
      </div>
    </header>
    <div class="scroll" id="pageBody"></div>
  </section>

  <!-- detail -->
  <aside class="detail empty-state" id="detailPanel">
    <div class="dt-placeholder">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M8 15h2M14 15h2"/></svg>
      <p>왼쪽에서 항목을 선택하면<br />기록과 통계가 여기에 표시됩니다.</p>
    </div>
  </aside>

  <div class="sync" id="syncPill"><span class="led"></span><span id="syncTxt">연결됨</span></div>
</div>

<div id="modalRoot"></div>
<div id="toast"></div>

<script>
/* 전역 오류를 화면에 표시 (콘솔을 못 볼 때 원인 파악용) */
window.addEventListener("error", (ev) => {
  const box = document.getElementById("authMsg");
  const text = "오류: " + (ev.message || ev.error?.message || "알 수 없음") +
    (ev.filename ? ` (${(ev.filename.split("/").pop())}:${ev.lineno})` : "");
  if (box) box.innerHTML = `<div class="auth-msg err">${text}</div>`;
  console.error("[전역 오류]", ev.error || ev.message);
});
window.addEventListener("unhandledrejection", (ev) => {
  const box = document.getElementById("authMsg");
  if (box) box.innerHTML = `<div class="auth-msg err">비동기 오류: ${ev.reason?.message || ev.reason}</div>`;
  console.error("[unhandledrejection]", ev.reason);
});

/* ============================================================
   0. 설정 — Firebase 값을 넣으면 클라우드 실시간 모드로 전환됩니다.
      비워두면 이 브라우저에만 저장되는 로컬 모드로 동작합니다.
============================================================ */

// AI 기능 프록시 (체성분 분석, 주간 리뷰 피드백)
// Vercel 배포 시 /api/anthropic 으로 자동 연결됩니다.
window.__ANTHROPIC_PROXY__ = "/api/anthropic";

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyADCIuDPm_bzmGJFtNwnErEkEcIrSNWDtA",
  authDomain: "habit-stamp.firebaseapp.com",
  projectId: "habit-stamp",
  storageBucket: "habit-stamp.firebasestorage.app",
  messagingSenderId: "393411706438",
  appId: "1:393411706438:web:34a64969a57f2beddf9447",
  measurementId: "G-X9QFB0H12X"
};

/* ============================================================
   Google Calendar 연동 설정
   ↓ 구글 클라우드 콘솔에서 발급받은 OAuth 클라이언트 ID를 넣으세요.
   (console.cloud.google.com → API 및 서비스 → 사용자 인증 정보)
   비워두면 연동 버튼이 안내만 표시합니다.
============================================================ */
const GOOGLE_CLIENT_ID = ""; // 예: "1234567890-abcxyz.apps.googleusercontent.com"
const GCAL_SCOPE = "https://www.googleapis.com/auth/calendar.events";

/* ============================================================
   1. 유틸
============================================================ */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const DOW = ["일", "월", "화", "수", "목", "금", "토"];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function fmt(d) {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), a = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${a}`;
}

// 모바일/PC 모두 호환되는 복사 함수
async function copyText(text) {
  // 1. 최신 브라우저 (PC/일부 모바일)
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try { await navigator.clipboard.writeText(text); return true; } catch {}
  }
  // 2. 모바일 폴백 — textarea 임시 생성 후 선택
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none";
    document.body.appendChild(ta);
    ta.focus(); ta.select();
    ta.setSelectionRange(0, text.length); // iOS
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    if (ok) return true;
  } catch {}
  // 3. 완전 폴백 — 모달로 텍스트 표시 (직접 복사)
  openModal(`<div class="modal" style="max-width:460px">
    <div class="modal-head"><h3>내용 복사</h3><button class="icon-btn" data-act="close">✕</button></div>
    <div class="modal-body"><div class="ctl">
      <p style="font-size:13px;color:#6B7280;margin-bottom:8px">아래 내용을 길게 눌러 복사하세요.</p>
      <textarea rows="10" style="resize:vertical;user-select:all" onclick="this.select()" readonly>${esc(text)}</textarea>
    </div></div>
    <div class="modal-foot"><button class="btn-save" data-act="close">닫기</button></div>
  </div>`);
  return false;
}
function parseD(s) { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function today() { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }
function todayStr() { return fmt(today()); }
function diffDays(a, b) { return Math.round((parseD(b) - parseD(a)) / 86400000); }
function weekOf(anchor) {
  // 월요일 시작 (getDay: 0=일, 1=월 ... 6=토)
  const day = anchor.getDay();
  const diff = day === 0 ? -6 : 1 - day; // 일요일이면 -6, 나머지는 월요일로
  const s = addDays(anchor, diff);
  return Array.from({ length: 7 }, (_, i) => addDays(s, i));
}
// 월요일 시작 기준 주 첫날 계산
function weekStartOf(d) {
  const day = d.getDay();
  return addDays(d, day === 0 ? -6 : 1 - day);
}
// 달력 헤더: 월~일 순서
const DOW_MON = ["월","화","수","목","금","토","일"];
function relTime(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "방금";
  if (s < 3600) return `${Math.floor(s / 60)}분 전`;
  if (s < 86400) return `${Math.floor(s / 3600)}시간 전`;
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(t._tm); t._tm = setTimeout(() => t.classList.remove("show"), 2200);
}

const EMOJIS = ["🙂","💪","📚","🏃","🧘","💧","🥗","😴","✍️","🎧","🎸","🧠","☀️","🌙","🔥","⭐","🎯","💊","🚭","💰","🧹","📵","🗣️","🇬🇧","🏋️","🚶","🥤","🍎","📖","🖊️","🧴","🦷","🛏️","☕","🚿","🧑‍💻","📊","🎤","🙏","🌱"];

/* ============================================================
   2. 데이터 계층 (Firestore ↔ localStorage 자동 전환)
   컬렉션: habits / checkins / todos / journal / history / meta
============================================================ */
const COLS = ["habits", "checkins", "todos", "journal", "history", "weights", "workouts", "study", "goals", "ddays", "songs", "pitches", "vocal", "vocalCats", "fixedItems", "expenses", "budgetMeta", "bodycomp", "issues", "notes", "noteCats", "books", "mdItems", "mindmaps", "weekLogs", "assets", "schedule", "meta"];

const DB = {
  mode: "local",     // 'cloud' | 'local'
  user: null,
  data: Object.fromEntries(COLS.map(c => [c, {}])),
  listeners: [],
  _fb: null,

  onChange(fn) { this.listeners.push(fn); },
  emit() { this.listeners.forEach(f => f()); },

  key() { return "selfboard_" + (this.user?.uid || "guest"); },

  loadLocal() {
    try {
      const raw = localStorage.getItem(this.key());
      if (raw) {
        const p = JSON.parse(raw);
        COLS.forEach(c => { this.data[c] = p[c] || {}; });
      }
    } catch (e) { console.warn("local load fail", e); }
  },
  saveLocal() {
    try { localStorage.setItem(this.key(), JSON.stringify(this.data)); }
    catch (e) { toast("저장 공간이 가득 찼습니다. 설정에서 데이터를 내보낸 뒤 정리하세요."); }
  },

  async set(col, id, obj) {
    obj = { ...obj, id, updatedAt: Date.now() };
    this.data[col][id] = obj;
    this.emit();                    // 즉시 화면 반영 (낙관적 업데이트)
    if (this.mode === "cloud") {
      try {
        const { doc, setDoc } = this._fb.fs;
        await setDoc(doc(this._fb.db, "users", this.user.uid, col, id), obj, { merge: true });
      } catch (e) {
        console.error("클라우드 저장 실패:", col, e);
        toast("저장 실패: " + (e?.code || e?.message || "권한/네트워크 확인"));
      }
    } else { this.saveLocal(); }
    return obj;
  },
  async del(col, id) {
    delete this.data[col][id];
    this.emit();                    // 즉시 반영
    if (this.mode === "cloud") {
      try {
        const { doc, deleteDoc } = this._fb.fs;
        await deleteDoc(doc(this._fb.db, "users", this.user.uid, col, id));
      } catch (e) {
        console.error("클라우드 삭제 실패:", col, e);
        toast("삭제 실패: " + (e?.code || e?.message || "권한/네트워크 확인"));
      }
    } else { this.saveLocal(); }
  },
  all(col) { return Object.values(this.data[col] || {}); },
  get(col, id) { return this.data[col]?.[id] || null; },

  async subscribeCloud() {
    const { collection, onSnapshot } = this._fb.fs;
    COLS.forEach(col => {
      onSnapshot(collection(this._fb.db, "users", this.user.uid, col), snap => {
        const next = {};
        snap.forEach(d => { next[d.id] = d.data(); });
        this.data[col] = next;
        this.emit();
      }, err => {
        console.warn("snapshot", col, err);
        if (err?.code === "permission-denied") {
          toast("읽기 권한 거부됨 — Firestore 규칙을 확인하세요.");
        }
      });
    });
  },

  async log(type, message) {
    const id = uid();
    await this.set("history", id, { type, message, ts: Date.now() });
    // 히스토리 500건 초과분 정리
    const rows = this.all("history").sort((a, b) => b.ts - a.ts);
    if (rows.length > 500) for (const r of rows.slice(500)) this.del("history", r.id);
  }
};

/* ============================================================
   3. 인증
============================================================ */
let AUTH_MODE = "login";
const authScreen = $("#authScreen");

function authMsg(text, kind = "err") {
  $("#authMsg").innerHTML = text ? `<div class="auth-msg ${kind}">${esc(text)}</div>` : "";
}

document.getElementById("btnSwitch").addEventListener("click", () => {
  AUTH_MODE = AUTH_MODE === "login" ? "signup" : "login";
  const signup = AUTH_MODE === "signup";
  $("#authTitle").textContent = signup ? "계정 만들기" : "다시 시작하기";
  $("#authSub").textContent = signup
    ? "이메일과 비밀번호만 있으면 바로 시작할 수 있습니다."
    : "계정으로 로그인하면 어느 기기에서든 기록이 이어집니다.";
  $("#fName").style.display = signup ? "" : "none";
  $("#btnAuth").textContent = signup ? "계정 만들기" : "로그인";
  $("#switchText").textContent = signup ? "이미 계정이 있나요?" : "계정이 없나요?";
  $("#btnSwitch").textContent = signup ? "로그인" : "계정 만들기";
  authMsg("");
});

document.getElementById("btnAuth").addEventListener("click", () => doAuth());
["inEmail", "inPw", "inName"].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener("keydown", e => { if (e.key === "Enter") doAuth(); });
});

async function doAuth() {
  const email = $("#inEmail").value.trim();
  const pw = $("#inPw").value;
  const name = $("#inName").value.trim();
  if (!email || !pw) return authMsg("이메일과 비밀번호를 모두 입력하세요.");
  if (pw.length < 6) return authMsg("비밀번호는 6자 이상이어야 합니다.");
  $("#btnAuth").disabled = true;

  try {
    if (DB.mode === "cloud") {
      const a = DB._fb.auth;
      if (AUTH_MODE === "signup") {
        const cred = await a.createUserWithEmailAndPassword(a.auth, email, pw);
        if (name) await a.updateProfile(cred.user, { displayName: name });
      } else {
        await a.signInWithEmailAndPassword(a.auth, email, pw);
      }
    } else {
      // 로컬 계정 (해시 저장, 이 브라우저 한정)
      const accs = JSON.parse(localStorage.getItem("selfboard_accounts") || "{}");
      const hash = await sha(pw);
      if (AUTH_MODE === "signup") {
        if (accs[email]) throw new Error("이미 등록된 이메일입니다. 로그인하세요.");
        accs[email] = { uid: uid(), name: name || email.split("@")[0], hash };
        localStorage.setItem("selfboard_accounts", JSON.stringify(accs));
      } else {
        if (!accs[email]) throw new Error("등록되지 않은 이메일입니다. 계정을 먼저 만드세요.");
        if (accs[email].hash !== hash) throw new Error("비밀번호가 맞지 않습니다.");
      }
      const acc = accs[email];
      localStorage.setItem("selfboard_session", JSON.stringify({ email, uid: acc.uid, name: acc.name }));
      await startApp({ uid: acc.uid, email, displayName: acc.name });
    }
  } catch (e) {
    console.error("로그인 실패:", e);
    authMsg(readableAuthError(e));
  } finally { $("#btnAuth").disabled = false; }
}

async function sha(str) {
  // https(보안 컨텍스트)에서는 표준 SHA-256 사용
  try {
    if (window.crypto && crypto.subtle && crypto.subtle.digest) {
      const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
    }
  } catch (e) { /* file:// 등에서 subtle 불가 → 폴백 */ }
  // 폴백 해시 (file://·비보안 환경용). 보안 강도는 낮지만 로컬 계정 구분에는 충분.
  let h1 = 0x811c9dc5, h2 = 0xdeadbeef;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 16777619);
    h2 = Math.imul(h2 ^ c, 2246822519);
  }
  return "fb_" + (h1 >>> 0).toString(16).padStart(8, "0") + (h2 >>> 0).toString(16).padStart(8, "0");
}
function readableAuthError(e) {
  const c = e?.code || "";
  if (c.includes("email-already-in-use")) return "이미 등록된 이메일입니다. 로그인하세요.";
  if (c.includes("invalid-email")) return "이메일 형식을 확인하세요.";
  if (c.includes("weak-password")) return "비밀번호는 6자 이상이어야 합니다.";
  if (c.includes("wrong-password") || c.includes("invalid-credential")) return "이메일 또는 비밀번호가 맞지 않습니다.";
  if (c.includes("user-not-found")) return "등록되지 않은 이메일입니다.";
  if (c.includes("too-many-requests")) return "시도가 너무 많습니다. 잠시 후 다시 하세요.";
  return e?.message || "로그인에 실패했습니다.";
}

/* --- 부팅 --- */
(async function boot() {
  if (FIREBASE_CONFIG.apiKey) {
    try {
      const appMod = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");
      const authMod = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
      const fsMod = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
      const app = appMod.initializeApp(FIREBASE_CONFIG);
      const auth = authMod.getAuth(app);
      const db = fsMod.getFirestore(app);
      DB._fb = { app, db, fs: fsMod, auth: { ...authMod, auth } };
      DB.mode = "cloud";
      $("#modeNote").textContent = "클라우드 모드 · 모든 기기에서 실시간 동기화";
      authMod.onAuthStateChanged(auth, u => { if (u) startApp(u); });
    } catch (e) {
      console.warn("Firebase 초기화 실패, 로컬 모드로 전환", e);
      DB.mode = "local";
    }
  }
  if (DB.mode === "local") {
    $("#modeNote").textContent = "로컬 모드 · 이 브라우저에만 저장됩니다.\n상단 FIREBASE_CONFIG를 채우면 실시간 동기화로 전환됩니다.";
    try {
      const s = localStorage.getItem("selfboard_session");
      if (s) { const v = JSON.parse(s); await startApp({ uid: v.uid, email: v.email, displayName: v.name }); }
    } catch (e) {
      console.warn("이전 세션 복원 실패 — 로그인 화면 유지", e);
      localStorage.removeItem("selfboard_session");
    }
  }
})();

async function startApp(user) {
  DB.user = { uid: user.uid, email: user.email, name: user.displayName || user.email.split("@")[0] };
  authScreen.classList.add("hide");
  $("#app").classList.remove("hide");
  $("#avatarTxt").textContent = DB.user.name.slice(0, 2);
  $("#syncTxt").textContent = DB.mode === "cloud" ? "실시간 동기화 중" : "로컬 저장";
  $("#syncPill").classList.toggle("local", DB.mode === "local");

  if (DB.mode === "cloud") await DB.subscribeCloud();
  else DB.loadLocal();

  DB.onChange(render);
  if (localStorage.getItem("selfboard_theme") === "dark") document.body.classList.add("dark");
  try { render(); } catch (e) { console.error("render 실패", e); }
}

async function signOut() {
  if (DB.mode === "cloud") await DB._fb.auth.signOut(DB._fb.auth.auth);
  else localStorage.removeItem("selfboard_session");
  location.reload();
}

/* ============================================================
   4. 도메인 로직
============================================================ */
const state = {
  tab: "dashboard",
  selected: null,       // 선택된 습관 id
  selTodo: null,        // 선택된 할 일 id
  calYM: null,          // 상세 달력 기준월
  anchor: today(),      // 주간 스트립 기준일
  sort: "date",         // date | name | streak | manual
  todoGroupBy: false,   // 카테고리별 그룹핑
  todoFrom: "",         // 할 일 날짜 필터 시작
  todoTo: "",           // 할 일 날짜 필터 종료
  todoDayFilter: "",    // 주간 날짜 클릭 필터 (특정 날만 보기)
  wlWeekStart: null,    // 주간 기록 조회 중인 주 시작일
  query: "",
  group: "all",
  hview: "week",        // 습관 보기: week(주간) | range(기간)
  rangeFrom: fmt(addDays(today(), -6)),
  rangeTo: todayStr(),
  showMiniCal: false,   // 습관 탭 월 달력 팝오버 표시
  fitSub: "workout",    // 운동 탭 서브: workout | weight
  selWorkout: null,     // 선택된 운동 세션 id
  noteCat: "promise",   // 노트 현재 카테고리
  schedDay: null,       // 시간표 선택 요일 (0=월 ... 6=일), null이면 오늘
  studySub: "learn",    // 공부 서브: learn | reading
  bookQuery: "",        // 독서 검색
  bookSort: "recent",   // 독서 정렬
  mdQuery: "",          // MD 자료 검색
  mdSort: "recent",     // MD 자료 정렬
  selMindmap: null,     // 열려있는 마인드맵 id
  mmSelectedNode: null, // 선택된 노드 id
  mmZoom: 1,            // 캔버스 확대율
  noteSubFilter: "",    // 노트 하위 분류 필터
  noteQuery: "",        // 노트 검색
  wkQuery: "", wkFrom: "", wkTo: "",   // 운동 검색/날짜 필터
  reviewOffset: 0, reviewAi: "",       // 주간 리뷰
  calYMonth: null,      // 달력 탭 기준월(YYYY-MM)
  calSelDay: null,      // 달력 탭 선택 날짜
  songQuery: "",        // 노래 검색
  songSub: "sing",      // 노래 서브: breath|voice|ear|sing|repertoire|pitch
  songFrom: "",         // 노래 날짜 필터 시작
  songTo: "",           // 노래 날짜 필터 종료
  budgetMonth: null,    // 가계부 기준월 YYYY-MM
  budgetSub: "finance",  // 가계부 서브: finance | overview | fixed | expense
  budFrom: "",           // 요약 탭 기간 조회 시작일
  budTo: "",             // 요약 탭 기간 조회 종료일
  todoView: "list",      // 할 일 뷰: list | week | issue
  issueWeekStart: null, // 이슈 탭 주간 기준
  todoWeekStart: null,   // 주간 달력 시작일
  financeMonths: 6,      // 자산 대시보드 조회 개월수
  dashDate: null,       // 대시보드 조회 날짜 (null=오늘)
  statsFrom: fmt(addDays(today(), -29)), // 통계 조회 시작일
  statsTo: todayStr(),                   // 통계 조회 종료일
  statsSel: null,        // 선택한 습관 id (상세 보기)
  collapsedTodos: {},   // 할 일 목록에서 하위 항목 접힘 상태 { todoId: true }
  expandedLogs: {}       // 긴 로그 항목 펼침 상태 { "subjectId_idx": true }
};

function activeDays(h) {
  if (h.freq === "weekly") return h.weekdays || [];
  return [0, 1, 2, 3, 4, 5, 6];
}
function isActiveOn(h, dateStr) {
  const d = parseD(dateStr);
  if (dateStr < h.startDate) return false;
  const end = endDate(h);
  if (end && dateStr > end) return false;
  return activeDays(h).includes(d.getDay());
}
function endDate(h) {
  if (!h.targetDays || h.targetDays === "forever") return null;
  return fmt(addDays(parseD(h.startDate), Number(h.targetDays) - 1));
}
function ckId(hid, date) { return hid + "_" + date; }
// 체크 여부(checked)와 메모(note)를 같은 문서에 두되 서로 독립적으로 유지한다.
// 그래야 체크를 취소해도 그날 남긴 메모가 사라지지 않는다.
// checked 값: "done"(완료) | "fail"(실패) | false/null(미기록)
// 기존 true/false 데이터 호환: true → "done", false → 미기록
function checkState(hid, date) {
  const c = DB.get("checkins", ckId(hid, date));
  if (!c) return null;
  if (c.checked === "done" || c.checked === true) return "done";
  if (c.checked === "fail") return "fail";
  return null;
}
function isChecked(hid, date) { return checkState(hid, date) === "done"; }

async function toggleCheck(hid, date) {
  const id = ckId(hid, date);
  const h = DB.get("habits", hid);
  const existing = DB.get("checkins", id);
  const cur = checkState(hid, date); // null → "done" → "fail" → null

  if (cur === null) {
    // 빈칸 → 완료
    await DB.set("checkins", id, { ...(existing || {}), habitId: hid, date, checked: "done", note: existing?.note || "", ts: Date.now() });
    await DB.log("check", `${h?.name || "습관"} · ${date} 완료`);
  } else if (cur === "done") {
    // 완료 → 실패
    await DB.set("checkins", id, { ...(existing || {}), habitId: hid, date, checked: "fail", note: existing?.note || "", ts: Date.now() });
    await DB.log("uncheck", `${h?.name || "습관"} · ${date} 실패 표시`);
  } else {
    // 실패 → 빈칸
    if (existing?.note) {
      await DB.set("checkins", id, { ...existing, checked: null, ts: Date.now() });
    } else {
      await DB.del("checkins", id);
    }
    await DB.log("uncheck", `${h?.name || "습관"} · ${date} 초기화`);
  }
}

// 체크 여부와 무관하게 그날의 메모만 저장/삭제
async function saveNote(hid, date, text) {
  const id = ckId(hid, date);
  const existing = DB.get("checkins", id);
  text = (text || "").trim();
  if (!text && !(existing && existing.checked)) {
    if (existing) await DB.del("checkins", id);
  } else {
    await DB.set("checkins", id, { ...(existing || {}), habitId: hid, date, checked: !!(existing && existing.checked), note: text });
  }
  await DB.log("edit", `${date} 메모를 저장했습니다.`);
}

// 카드/캘린더의 원을 누르면 즉시 토글(체크↔취소)한다 — 팝업 없음
async function handleToggle(hid, date) {
  if (date > todayStr()) { toast("미래 날짜는 체크할 수 없습니다."); return; }
  const h = DB.get("habits", hid);
  const wasOn = isChecked(hid, date);
  state.noteDate = date;
  await toggleCheck(hid, date);
  if (!wasOn && h?.autoLog) {
    state.selected = hid;
    state.calYM = date.slice(0, 7);
    render();
    setTimeout(() => $("#memoText")?.focus(), 60);
  }
}

function totalChecks(hid) { return DB.all("checkins").filter(c => c.habitId === hid && c.checked).length; }

/* ---- 할 일: 사용자 관리 항목(카테고리) 목록 ---- */
const DEFAULT_TODO_CATS = ["업무", "개인", "성장", "관계", "긴급"];
function todoCats() {
  const meta = DB.get("meta", "todoCats");
  return (meta && Array.isArray(meta.list) && meta.list.length) ? meta.list : DEFAULT_TODO_CATS;
}
async function saveTodoCats(list) {
  await DB.set("meta", "todoCats", { list });
}
async function addTodoCat(name) {
  name = (name || "").trim(); if (!name) return;
  const list = todoCats();
  if (list.includes(name)) { toast("이미 있는 항목입니다."); return; }
  await saveTodoCats([...list, name]);
  await DB.log("edit", `할 일 항목 "${name}"을(를) 추가했습니다.`);
}
async function renameTodoCat(oldName, newName) {
  newName = (newName || "").trim(); if (!newName) return;
  const list = todoCats().map(c => c === oldName ? newName : c);
  await saveTodoCats(list);
  // 기존 할 일의 항목명도 함께 갱신
  for (const t of DB.all("todos")) if (t.category === oldName) await DB.set("todos", t.id, { ...t, category: newName });
  await DB.log("edit", `할 일 항목 "${oldName}" → "${newName}"`);
}
async function removeTodoCat(name) {
  await saveTodoCats(todoCats().filter(c => c !== name));
  await DB.log("delete", `할 일 항목 "${name}"을(를) 삭제했습니다.`);
}

/* ---- 할 일 헬퍼 ---- */
function dowLabel(dateStr) { if (!dateStr) return ""; return DOW[parseD(dateStr).getDay()] + "요일"; }
async function patchTodo(id, patch) {
  const t = DB.get("todos", id); if (!t) return;
  // 완료로 바뀌고 반복이 설정된 경우 다음 할 일 자동 생성
  if (patch.done === true && t.repeat && !t.done) {
    await createRepeatTodo(t);
  }
  await DB.set("todos", id, { ...t, ...patch });
}

// 반복 주기에 따라 다음 날짜를 계산해서 새 할 일 생성
async function createRepeatTodo(td) {
  if (!td.repeat || !td.due) return;
  const base = parseD(td.due);
  let next;
  if (td.repeat === "daily") next = addDays(base, 1);
  else if (td.repeat === "weekly") next = addDays(base, 7);
  else if (td.repeat === "monthly") {
    next = new Date(base.getFullYear(), base.getMonth() + 1, base.getDate());
  }
  const nextStr = fmt(next);
  // 같은 제목+날짜가 이미 있으면 생성 안 함
  const exists = DB.all("todos").find(t => t.title === td.title && t.due === nextStr);
  if (exists) return;
  const nid = uid();
  await DB.set("todos", nid, {
    title: td.title, category: td.category || "",
    due: nextStr, content: td.content || "",
    time: "", result: "", feedback: "",
    done: false, repeat: td.repeat,
    subtasks: (td.subtasks || []).map(g => ({
      ...g, id: uid(),
      items: (g.items || []).map(it => ({ ...it, id: uid(), done: false }))
    })),
    history: [], createdAt: Date.now()
  });
  await DB.log("create", `반복 할 일 생성: ${td.title} → ${nextStr}`);
}
async function todoAddHistory(id, text) {
  text = (text || "").trim(); if (!text) return;
  const t = DB.get("todos", id);
  const history = [...(t.history || []), { id: uid(), ts: Date.now(), text }];
  await DB.set("todos", id, { ...t, history });
}
async function todoDelHistory(id, hid) {
  const t = DB.get("todos", id);
  await DB.set("todos", id, { ...t, history: (t.history || []).filter(h => h.id !== hid) });
}

function shieldsOf(h) { return (h.shields || []); }
function shieldMonthCount(h, ym) { return shieldsOf(h).filter(d => d.startsWith(ym)).length; }
const SHIELD_PER_MONTH = 2;

function currentStreak(h) {
  let cur = today(), streak = 0, guard = 0;
  if (!isChecked(h.id, fmt(cur))) cur = addDays(cur, -1);   // 오늘 미체크는 유예
  const shields = shieldsOf(h);
  while (guard++ < 3650) {
    const s = fmt(cur);
    if (s < h.startDate) break;
    if (!activeDays(h).includes(cur.getDay())) { cur = addDays(cur, -1); continue; }
    if (isChecked(h.id, s)) { streak++; cur = addDays(cur, -1); }
    else if (shields.includes(s)) { streak++; cur = addDays(cur, -1); }  // 보호권으로 연속 유지
    else break;
  }
  return streak;
}
function bestStreak(h) {
  const dates = DB.all("checkins").filter(c => c.habitId === h.id).map(c => c.date).sort();
  let best = 0, run = 0, prev = null;
  for (const d of dates) {
    if (prev) {
      let step = addDays(parseD(prev), 1), ok = true, g = 0;
      while (fmt(step) < d && g++ < 400) {
        if (activeDays(h).includes(step.getDay())) { ok = false; break; }
        step = addDays(step, 1);
      }
      run = ok ? run + 1 : 1;
    } else run = 1;
    best = Math.max(best, run); prev = d;
  }
  return best;
}
function monthRate(h, ym) {
  const [y, m] = ym.split("-").map(Number);
  const last = new Date(y, m, 0).getDate();
  let due = 0, done = 0;
  for (let i = 1; i <= last; i++) {
    const ds = `${y}-${String(m).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
    if (ds > todayStr()) break;
    if (!isActiveOn(h, ds)) continue;
    due++; if (isChecked(h.id, ds)) done++;
  }
  return { due, done, pct: due ? Math.round(done / due * 100) : 0 };
}
function isHabitOverdue(h) {
  const end = endDate(h);
  return !!end && end <= todayStr() && !h.archived;
}

function visibleHabits(archived = false) {
  let list = DB.all("habits").filter(h => !!h.archived === archived);
  if (state.query) {
    const q = state.query.toLowerCase();
    list = list.filter(h => (h.name || "").toLowerCase().includes(q) || (h.group || "").toLowerCase().includes(q));
  }
  if (state.group !== "all") list = list.filter(h => (h.group || "기타") === state.group);
  const s = state.sort;
  list.sort((a, b) => {
    if (s === "manual") return (a.order ?? 0) - (b.order ?? 0);
    if (s === "name") return (a.name || "").localeCompare(b.name || "", "ko");
    if (s === "streak") return currentStreak(b) - currentStreak(a);
    return (a.startDate || "").localeCompare(b.startDate || "") || (a.createdAt || 0) - (b.createdAt || 0);
  });
  return list;
}

/* ============================================================
   5. 렌더 — 라우터
============================================================ */
/* 탭 정의 (아이콘 SVG path, 제목). 순서는 사용자가 드래그로 바꿀 수 있다. */
const TAB_DEFS = {
  dashboard: { title: "대시보드", svg: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>' },
  habit:     { title: "습관", svg: '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>' },
  todo:      { title: "할 일", svg: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>' },
  goal:      { title: "목표", svg: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>' },
  review:    { title: "주간 리뷰", svg: '<path d="M3 3v18h18"/><path d="M7 14l3-4 3 2 4-6"/>' },
  dday:      { title: "D-Day", svg: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5"/><path d="M9 2h6M12 2v3"/>' },
  calendar:  { title: "달력", svg: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>' },
  journal:   { title: "회고", svg: '<path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>' },
  notes:     { title: "노트", svg: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/>' },
  schedule:  { title: "시간표", svg: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>' },
  mindmap:   { title: "마인드맵", svg: '<circle cx="12" cy="5" r="2.5"/><circle cx="5" cy="19" r="2.5"/><circle cx="19" cy="19" r="2.5"/><path d="M12 7.5v5M12 12.5L6.5 17M12 12.5L17.5 17"/>' },
  workout:   { title: "운동", svg: '<path d="M6.5 6.5l11 11M4 8l1-1M8 4l-1 1M20 16l-1 1M16 20l1-1M2 12l3 3M22 12l-3-3M9 15l-3 3M15 9l3-3"/>' },
  study:     { title: "공부", svg: '<path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12v5c0 1 2.5 3 6 3s6-2 6-3v-5"/>' },
  song:      { title: "노래", svg: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>' },
  budget:    { title: "가계부", svg: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/><circle cx="17" cy="14" r="1.5"/>' },
  stats:     { title: "통계", svg: '<path d="M18 20V10M12 20V4M6 20v-6"/>' },
  history:   { title: "히스토리", svg: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>' },
  archive:   { title: "보관함", svg: '<rect x="2" y="4" width="20" height="5" rx="1"/><path d="M4 9v10a2 2 0 002 2h12a2 2 0 002-2V9M10 13h4"/>' }
};
const DEFAULT_TAB_ORDER = ["dashboard", "calendar", "habit", "todo", "dday", "goal", "review", "journal", "notes", "schedule", "mindmap", "workout", "study", "song", "budget", "stats", "history", "archive"];
function tabOrder() {
  const m = DB.get("meta", "tabOrder");
  let order = (m && Array.isArray(m.list)) ? m.list.filter(k => TAB_DEFS[k]) : DEFAULT_TAB_ORDER.slice();
  for (const k of DEFAULT_TAB_ORDER) if (!order.includes(k)) order.push(k); // 새 탭 자동 편입
  return order;
}

/* ---- 탭 폴더(그룹) ---- */
const TAB_FOLDER_DEFAULTS = [
  { id: "daily",   label: "일상 관리", emoji: "📅", tabs: ["dashboard", "calendar", "habit", "todo", "dday", "schedule"] },
  { id: "growth",  label: "성장 기록", emoji: "🌱", tabs: ["goal", "study", "song", "workout"] },
  { id: "writing", label: "기록·정리", emoji: "✍️", tabs: ["review", "journal", "notes", "mindmap"] },
  { id: "money",   label: "자산",     emoji: "💰", tabs: ["budget"] },
  { id: "etc",     label: "기타",     emoji: "📦", tabs: ["stats", "history", "archive"] }
];
function tabFolders() {
  const m = DB.get("meta", "tabFolders");
  let folders = (m && Array.isArray(m.list)) ? m.list : TAB_FOLDER_DEFAULTS.map(f => ({...f}));
  // 새로 생긴 탭은 '기타' 폴더로 자동 편입
  const assigned = new Set(folders.flatMap(f => f.tabs));
  const orphans = tabOrder().filter(k => !assigned.has(k));
  if (orphans.length) {
    let etc = folders.find(f => f.id === "etc");
    if (!etc) { etc = { id: "etc", label: "기타", emoji: "📦", tabs: [] }; folders.push(etc); }
    etc.tabs = [...etc.tabs, ...orphans];
  }
  return folders;
}
function folderCollapsed(fid) {
  const m = DB.get("meta", "folderState") || {};
  return !!m[fid];
}
async function toggleFolder(fid) {
  const m = DB.get("meta", "folderState") || {};
  await DB.set("meta", "folderState", { ...m, [fid]: !m[fid] });
}
function useFolderMode() {
  const m = DB.get("meta", "navMode");
  return m ? m.mode === "folder" : false; // 기본은 평면(기존) 모드
}
const TITLES = Object.fromEntries(Object.entries(TAB_DEFS).map(([k, v]) => [k, v.title]).concat([["settings", "설정"]]));

// 상세패널을 쓰는 탭 (습관/할일만)
const DETAIL_TABS = new Set(["habit", "todo", "archive"]);

function renderSidebar() {
  const box = $("#navTabs");
  if (!box) return;

  const btnHtml = k => `
    <button class="nav-btn ${state.tab === k ? "active" : ""}" data-tab="${k}" draggable="true" data-navkey="${k}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${TAB_DEFS[k].svg}</svg>
      <span class="tip">${TAB_DEFS[k].title}</span>
    </button>`;

  if (!useFolderMode()) {
    box.innerHTML = tabOrder().map(btnHtml).join("")
      + `<button class="nav-mode-btn" data-act="nav-mode-toggle"><span class="tip">폴더로 보기</span>📁</button>`;
    wireNavDnD();
    return;
  }

  // 폴더 모드
  box.innerHTML = tabFolders().map(f => {
    const tabs = f.tabs.filter(k => TAB_DEFS[k]);
    if (!tabs.length) return "";
    const collapsed = folderCollapsed(f.id);
    const hasActive = tabs.includes(state.tab);
    return `<div class="nav-folder ${collapsed?"collapsed":""}">
      <button class="nav-folder-head ${hasActive?"has-active":""}" data-act="nav-folder-toggle" data-fid="${f.id}">
        <span class="nav-folder-emoji">${f.emoji}</span>
        <span class="tip">${esc(f.label)}${collapsed?` (${tabs.length})`:""}</span>
        ${collapsed && hasActive ? `<span class="nav-folder-dot"></span>` : ""}
      </button>
      ${!collapsed ? `<div class="nav-folder-body">${tabs.map(btnHtml).join("")}</div>` : ""}
    </div>`;
  }).join("")
  + `<button class="nav-mode-btn" data-act="nav-mode-toggle"><span class="tip">전체 목록으로 보기</span>☰</button>`;
  wireNavDnD();
}

function wireNavDnD() {
  const box = $("#navTabs");
  if (!box) return;
  // 폴더 모드에서는 순서 변경 대신 폴더 간 이동을 지원하지 않음 (설정에서 관리)
  if (useFolderMode()) return;
  let dragKey = null;
  box.querySelectorAll("[data-navkey]").forEach(btn => {
    btn.addEventListener("dragstart", e => { dragKey = btn.dataset.navkey; btn.classList.add("nav-dragging"); e.dataTransfer.effectAllowed = "move"; });
    btn.addEventListener("dragend", () => { btn.classList.remove("nav-dragging"); box.querySelectorAll(".nav-drop").forEach(x => x.classList.remove("nav-drop")); dragKey = null; });
    btn.addEventListener("dragover", e => { e.preventDefault(); box.querySelectorAll(".nav-drop").forEach(x => x.classList.remove("nav-drop")); if (dragKey && dragKey !== btn.dataset.navkey) btn.classList.add("nav-drop"); });
    btn.addEventListener("drop", async e => {
      e.preventDefault();
      const target = btn.dataset.navkey;
      if (!dragKey || dragKey === target) return;
      const order = tabOrder();
      const from = order.indexOf(dragKey), to = order.indexOf(target);
      order.splice(from, 1); order.splice(to, 0, dragKey);
      await DB.set("meta", "tabOrder", { list: order });
      renderSidebar();
      toast("탭 순서를 변경했습니다.");
    });
  });
}

function render() {
  $("#pageTitle").textContent = TITLES[state.tab] || "";
  renderSidebar();
  $("#navSettings")?.classList.toggle("active", state.tab === "settings");

  // 상세패널: 습관/할일에서만 노출, 나머지 탭은 전체 폭 사용
  const dp = $("#detailPanel");
  if (dp) dp.classList.toggle("panel-hidden", !DETAIL_TABS.has(state.tab));

  const body = $("#pageBody");
  if (state.tab === "dashboard") { body.innerHTML = viewDashboard(); wireDashboard(); }
  else if (state.tab === "habit") { body.innerHTML = viewHabits(false); wireHabitDateBar(); }
  else if (state.tab === "archive") body.innerHTML = viewHabits(true);
  else if (state.tab === "todo") { body.innerHTML = viewTodos(); wireTodoList(); wireTodos(); }
  else if (state.tab === "journal") body.innerHTML = viewJournal();
  else if (state.tab === "stats") { body.innerHTML = viewStats(); wireStats(); }
  else if (state.tab === "workout") { body.innerHTML = viewWorkout(); wireWorkout(); }
  else if (state.tab === "notes") { body.innerHTML = viewNotes(); wireNotes(); }
  else if (state.tab === "schedule") { body.innerHTML = viewSchedule(); wireSchedule(); }
  else if (state.tab === "mindmap") { body.innerHTML = viewMindmap(); wireMindmap(); }
  else if (state.tab === "study") { body.innerHTML = viewStudy(); wireStudy(); }
  else if (state.tab === "song") { body.innerHTML = viewSong(); wireSong(); }
  else if (state.tab === "budget") { body.innerHTML = viewBudget(); wireBudget(); }
  else if (state.tab === "goal") { body.innerHTML = viewGoals(); wireGoals(); }
  else if (state.tab === "review") { body.innerHTML = viewReview(); wireReview(); }
  else if (state.tab === "dday") { body.innerHTML = viewDday(); wireDday(); }
  else if (state.tab === "calendar") { body.innerHTML = viewCalendar(); wireCalendar(); }
  else if (state.tab === "history") body.innerHTML = viewHistory();
  else if (state.tab === "settings") body.innerHTML = viewSettings();
  renderDetail();
}

/* --- 습관 목록 --- */
function viewHabits(archived) {
  const list = visibleHabits(archived);
  const isRange = state.hview === "range" && !archived;
  const days = archived ? [] : (isRange ? rangeDays() : weekOf(state.anchor));

  let html = archived ? "" : habitDateBar() + (isRange ? "" : weekStripHtml(days));
  if (!archived && state.showMiniCal) html += miniCalHtml();

  if (!list.length) {
    html += `<div class="empty">
      <div class="big">${archived ? "📦" : "🌱"}</div>
      <h3>${archived ? "보관한 습관이 없습니다" : "아직 습관이 없습니다"}</h3>
      <p>${archived ? "목록에서 습관을 보관하면 여기에 모입니다." : "반복하고 싶은 행동 하나를 먼저 등록하세요.<br />작게 시작할수록 오래갑니다."}</p>
      ${archived ? "" : `<button data-act="new-habit">습관 만들기</button>`}
    </div>`;
    return html;
  }

  // 그룹별 묶기
  const groups = {};
  list.forEach(h => { const g = h.group || "기타"; (groups[g] ||= []).push(h); });
  const order = Object.keys(groups).sort((a, b) => a === "기타" ? 1 : b === "기타" ? -1 : a.localeCompare(b, "ko"));

  for (const g of order) {
    html += `<div class="grp-title">${esc(g)}<span class="count">${groups[g].length}</span></div>`;
    html += groups[g].map(h => isRange ? habitRangeCardHtml(h, days) : habitCardHtml(h, days)).join("");
  }
  return html;
}

function rangeDays() {
  let from = parseD(state.rangeFrom), to = parseD(state.rangeTo);
  if (from > to) { const t = from; from = to; to = t; }
  const out = []; let d = from, guard = 0;
  while (fmt(d) <= fmt(to) && guard++ < 92) { out.push(new Date(d)); d = addDays(d, 1); }
  return out; // 최대 92일
}

function habitDateBar() {
  const isRange = state.hview === "range";
  const wk = weekOf(state.anchor);
  const label = `${fmt(wk[0]).slice(5)} ~ ${fmt(wk[6]).slice(5)}`;
  return `<div class="hdatebar">
    <div class="hview-tabs">
      <button class="hvt ${!isRange ? "on" : ""}" data-act="hview" data-v="week">주간</button>
      <button class="hvt ${isRange ? "on" : ""}" data-act="hview" data-v="range">기간</button>
    </div>
    ${isRange ? `
      <div class="hrange">
        <input type="date" id="rFrom" value="${state.rangeFrom}" max="${todayStr()}" />
        <span>~</span>
        <input type="date" id="rTo" value="${state.rangeTo}" max="${todayStr()}" />
      </div>
    ` : `
      <div class="hnav">
        <button class="cal-nav" data-act="wk-prev" title="이전 주">‹</button>
        <button class="hnav-label" data-act="wk-today">${label}</button>
        <button class="cal-nav" data-act="wk-next" title="다음 주">›</button>
      </div>
    `}
    <button class="icon-btn" data-act="toggle-cal" title="달력에서 날짜 선택">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
    </button>
  </div>`;
}

function miniCalHtml() {
  const ym = state.calYM || todayStr().slice(0, 7);
  const [y, m] = ym.split("-").map(Number);
  const first = new Date(y, m - 1, 1);
  const start = weekStartOf(first);
  const t = todayStr();
  const list = visibleHabits(false);
  let cells = "";
  for (let i = 0; i < 42; i++) {
    const d = addDays(start, i), ds = fmt(d);
    const out = d.getMonth() !== m - 1;
    const due = list.filter(h => isActiveOn(h, ds));
    const done = due.filter(h => isChecked(h.id, ds)).length;
    let ring = "";
    if (!out && ds <= t && due.length) {
      const cls = done === due.length ? "full" : done > 0 ? "part" : "";
      ring = `<div class="mc-ring ${cls}">${done === due.length ? "✓" : (done > 0 ? done : "")}</div>`;
    }
    cells += `<div class="mc-cell ${out ? "out" : ""} ${ds === t ? "today" : ""}" data-act="mc-day" data-date="${ds}">
      <div class="mc-n">${d.getDate()}</div>${ring}</div>`;
  }
  return `<div class="minical">
    <div class="cal-head">
      <button class="cal-nav" data-act="mc-prev">‹</button>
      <div class="m">${y}년 ${m}월</div>
      <button class="cal-nav" data-act="mc-next">›</button>
    </div>
    <div class="cal-grid">${DOW_MON.map(d => `<div class="cal-dow">${d}</div>`).join("")}${cells}</div>
    <div class="mc-hint">날짜를 누르면 그 주로 이동합니다.</div>
  </div>`;
}

/* 기간 모드: 습관별로 구간 전체를 한 줄에 표시 */
function habitRangeCardHtml(h, days) {
  const t = todayStr();
  const dueDays = days.filter(d => isActiveOn(h, fmt(d)) && fmt(d) <= t);
  const doneDays = dueDays.filter(d => checkState(h.id, fmt(d)) === "done");
  const failDays = dueDays.filter(d => checkState(h.id, fmt(d)) === "fail");
  const rate = dueDays.length ? Math.round(doneDays.length / dueDays.length * 100) : 0;
  const overdue = isHabitOverdue(h);

  const dots = days.map(d => {
    const ds = fmt(d);
    if (!isActiveOn(h, ds)) return `<span class="rdot na" title="${ds} 비활성"></span>`;
    if (ds > t) return `<span class="rdot future" title="${ds}"></span>`;
    const st = checkState(h.id, ds);
    return `<button class="rdot ${st === "done" ? "on" : st === "fail" ? "rdot-fail" : ""}" data-act="dot" data-id="${h.id}" data-date="${ds}" title="${ds} (${DOW[d.getDay()]})"></button>`;
  }).join("");

  return `<div class="card ${state.selected === h.id ? "selected" : ""} ${overdue ? "overdue" : ""}" data-act="open" data-id="${h.id}">
    <div class="h-emoji">${esc(h.emoji || "🙂")}</div>
    <div class="h-body">
      <div class="h-name">${esc(h.name)}<span class="badge">${doneDays.length}/${dueDays.length} · ${rate}%${failDays.length ? ` · ✕${failDays.length}` : ""}</span></div>
      <div class="rdot-wrap">${dots}</div>
    </div>
    <button class="card-menu" data-act="menu" data-id="${h.id}">⋯</button>
  </div>`;
}

function wireHabitDateBar() {
  const f = $("#rFrom"), t2 = $("#rTo");
  if (f) f.onchange = e => { state.rangeFrom = e.target.value; render(); };
  if (t2) t2.onchange = e => { state.rangeTo = e.target.value; render(); };
}

function weekStripHtml(week) {
  const list = visibleHabits(false);
  const t = todayStr();
  return `<div class="weekstrip">` + week.map(d => {
    const ds = fmt(d);
    const due = list.filter(h => isActiveOn(h, ds));
    const done = due.filter(h => checkState(h.id, ds) === "done").length;
    const failed = due.filter(h => checkState(h.id, ds) === "fail").length;
    let cls = "wring", inner = "";
    if (ds > t || !due.length) cls += " disabled";
    else if (done === due.length && done > 0) { cls += " full"; inner = "✓"; }
    else if (failed > 0 && done === 0) { cls += " wring-fail"; inner = "✕"; }
    else if (done > 0) cls += " part";
    const col = ds === t ? "today" : ds < t ? "past" : "future";
    return `<div class="wcol ${col}" data-act="anchor" data-date="${ds}">
      <div class="dow">${DOW[d.getDay()]}</div>
      <div class="dnum">${d.getDate()}</div>
      <div class="${cls}">${inner}</div>
    </div>`;
  }).join("") + `</div>`;
}

function habitCardHtml(h, week) {
  const t = todayStr();
  const streak = currentStreak(h);
  const total = totalChecks(h);
  const overdue = isHabitOverdue(h);
  const end = endDate(h);
  const dueAll = week.filter(d => isActiveOn(h, fmt(d)) && fmt(d) <= t);
  const doneAll = dueAll.length > 0 && dueAll.every(d => isChecked(h.id, fmt(d)));

  const dots = week.map(d => {
    const ds = fmt(d);
    if (!isActiveOn(h, ds)) return `<span class="hdot na"></span>`;
    if (ds > t) return `<span class="hdot future"></span>`;
    const st = checkState(h.id, ds);
    return `<button class="hdot ${st === "done" ? "on" : st === "fail" ? "fail" : ""}" data-act="dot" data-id="${h.id}" data-date="${ds}" title="${ds}"></button>`;
  }).join("");

  let badge = "";
  if (overdue) badge = `<span class="badge red">기한 종료 ${end}</span>`;
  else if (end) badge = `<span class="badge">D-${diffDays(t, end)}</span>`;
  if (h.archived) badge = `<span class="badge">보관됨</span>`;

  return `<div class="card ${state.selected === h.id ? "selected" : ""} ${overdue ? "overdue" : ""} ${doneAll ? "done-all" : ""} ${h.archived ? "archived" : ""}"
      draggable="true" data-act="open" data-id="${h.id}">
    <span class="drag-handle" title="끌어서 순서 변경">⠿</span>
    <div class="h-emoji">${esc(h.emoji || "🙂")}</div>
    <div class="h-body">
      <div class="h-name">${esc(h.name)}${badge}</div>
      <div class="h-meta">
        <span>⚡ ${total}일</span>
        <span>🔥 ${streak}일</span>
        <span>${h.freq === "weekly" ? (h.weekdays || []).map(i => DOW[i]).join("·") : "매일"}</span>
      </div>
    </div>
    <div class="h-dots">${dots}</div>
    <button class="card-menu" data-act="menu" data-id="${h.id}">⋯</button>
  </div>`;
}

/* --- 상세 패널 --- */
function renderDetail() {
  const p = $("#detailPanel");

  // 할 일 상세 우선
  if (state.tab === "todo" && state.selTodo) {
    const td = DB.get("todos", state.selTodo);
    if (td) { p.classList.remove("empty-state"); p.innerHTML = todoDetailHtml(td); wireTodoDetail(td); return; }
    state.selTodo = null;
  }

  const h = state.selected ? DB.get("habits", state.selected) : null;
  if (!h) {
    p.classList.add("empty-state");
    p.innerHTML = `<div class="dt-placeholder">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M8 15h2M14 15h2"/></svg>
      <p>왼쪽에서 항목을 선택하면<br />기록과 통계가 여기에 표시됩니다.</p>
    </div>`;
    return;
  }
  p.classList.remove("empty-state");
  const ym = state.calYM || todayStr().slice(0, 7);
  const [y, m] = ym.split("-").map(Number);
  const r = monthRate(h, ym);
  const noteDate = (state.noteDate && state.noteDate <= todayStr() && state.noteDate >= h.startDate) ? state.noteDate : todayStr();
  const noteText = DB.get("checkins", ckId(h.id, noteDate))?.note || "";

  p.innerHTML = `
    <div class="dt-head">
      <div class="h-emoji">${esc(h.emoji || "🙂")}</div>
      <div class="t">${esc(h.name)}</div>
      <button class="icon-btn" data-act="menu" data-id="${h.id}">⋯</button>
      <button class="icon-btn" data-act="close-detail">✕</button>
    </div>
    <div class="dt-scroll">
      <div class="stat-grid">
        <div class="stat"><div class="lb">✅ 월간 출석체크</div><div class="vl">${r.done}<small>일</small></div></div>
        <div class="stat"><div class="lb">⚡ 총 체크인 수</div><div class="vl">${totalChecks(h.id)}<small>일</small></div></div>
        <div class="stat"><div class="lb">📊 월별 체크인 비율</div><div class="vl">${r.pct}<small>%</small></div></div>
        <div class="stat"><div class="lb">🔥 연속 · 최고 ${bestStreak(h)}일</div><div class="vl">${currentStreak(h)}<small>일</small></div></div>
      </div>
      ${shieldBar(h)}
      ${calendarHtml(h, y, m)}

      <div class="grp-title" style="margin-top:22px">메모</div>
      <div class="memobox">
        <div class="memo-toprow">
          <input type="date" id="memoDateInput" value="${noteDate}" min="${h.startDate}" max="${todayStr()}" />
          ${isChecked(h.id, noteDate) ? `<span class="memo-check-tag">✓ 완료한 날</span>` : ""}
        </div>
        <textarea id="memoText" placeholder="이 날은 어땠나요? 무엇이 잘 됐고 무엇이 힘들었는지 적어보세요.">${esc(noteText)}</textarea>
        <div class="memo-actions">
          <button class="btn-ghost" id="memoSaveBtn">저장</button>
          ${noteText ? `<button class="btn-ghost danger" id="memoDelBtn">메모 지우기</button>` : ""}
        </div>
      </div>

      <div class="log-title">${m}월의 습관 로그</div>
      ${logHtml(h, ym)}
    </div>`;

  $("#memoDateInput").onchange = (e) => { state.noteDate = e.target.value; renderDetail(); };
  $("#memoSaveBtn").onclick = async () => {
    await saveNote(h.id, noteDate, $("#memoText").value);
    toast("메모를 저장했습니다.");
  };
  const delBtn = $("#memoDelBtn");
  if (delBtn) delBtn.onclick = async () => {
    await saveNote(h.id, noteDate, "");
    toast("메모를 지웠습니다.");
  };
}

/* ============================================================
   할 일 상세 패널
============================================================ */
function todoDetailHtml(td) {
  const cats = todoCats();
  const groups = td.subtasks || [];   // 대분류 배열
  const history = (td.history || []).slice().sort((a, b) => b.ts - a.ts);
  const over = td.due && td.due <= todayStr() && !td.done;

  const catOpts = cats.map(c => `<option ${td.category === c ? "selected" : ""}>${esc(c)}</option>`).join("");

  const groupsHtml = groups.length ? groups.map(g => {
    const items = (g.items || []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const itemsHtml = items.map(it => {
      const stateCls = it.done ? "on" : it.failed ? "fail" : "";
      return `<div class="sub-item" draggable="true" data-sub-item="${it.id}" data-grp="${g.id}">
        <span class="sub-drag">⠿</span>
        <button class="sub-check ${stateCls}" data-act="td-item-toggle" data-gid="${g.id}" data-iid="${it.id}" title="${it.done?"완료→실패":it.failed?"실패→초기화":"체크"}"></button>
        <input class="sub-input ${it.done ? "done" : it.failed ? "sub-input-fail" : ""}" value="${esc(it.text)}" data-act="td-item-edit" data-gid="${g.id}" data-iid="${it.id}" placeholder="하위 항목" />
        <button class="sub-x" data-act="td-item-del" data-gid="${g.id}" data-iid="${it.id}">✕</button>
      </div>`;
    }).join("");
    return `<div class="grp-block" draggable="true" data-grp-block="${g.id}">
      <div class="grp-head">
        <span class="sub-drag">⠿</span>
        <input class="grp-input" value="${esc(g.title)}" data-act="td-grp-edit" data-gid="${g.id}" placeholder="대분류 이름" />
        <span class="grp-count">${items.filter(i => i.done).length}/${items.length}${items.filter(i=>i.failed).length?` ✕${items.filter(i=>i.failed).length}`:""}</span>
        <button class="sub-x" data-act="td-grp-del" data-gid="${g.id}">✕</button>
      </div>
      <div class="sub-list" data-grp-list="${g.id}">${itemsHtml}</div>
      <button class="add-sub" data-act="td-item-add" data-gid="${g.id}">+ 하위 항목 추가</button>
    </div>`;
  }).join("") : `<div class="td-empty-sub">아직 대분류가 없습니다. 아래 버튼으로 추가하세요.</div>`;

  const histHtml = history.length ? history.map(hh => `
    <div class="td-hist-item" data-hid="${hh.id}">
      <div class="td-hist-ts">${new Date(hh.ts).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</div>
      <div class="td-hist-txt" style="white-space:pre-wrap">${esc(hh.text)}</div>
      <div class="td-hist-btns">
        <button class="icon-btn" style="width:26px;height:26px;opacity:1" data-act="td-hist-edit" data-hid="${hh.id}" title="수정">✎</button>
        <button class="sub-x" data-act="td-hist-del" data-hid="${hh.id}">✕</button>
      </div>
    </div>`).join("") : `<div class="td-empty-sub">기록된 히스토리가 없습니다.</div>`;

  return `
  <div class="dt-head">
    <button class="tcheck ${td.done ? "on" : td.failed ? "fail" : ""}" data-act="todo-toggle" data-id="${td.id}" style="flex:0 0 22px"></button>
    <input class="dt-title-input" id="tdTitle" value="${esc(td.title)}" placeholder="할 일 제목" />
    <button class="icon-btn" data-act="td-detail-menu" data-id="${td.id}">⋯</button>
    <button class="icon-btn" data-act="close-detail">✕</button>
  </div>
  <div class="dt-scroll">

    <div class="td-field-row">
      <div class="td-field">
        <label>날짜</label>
        <input type="date" id="tdDate" value="${td.due || ""}" />
      </div>
      <div class="td-field">
        <label>요일</label>
        <input type="text" id="tdDow" value="${dowLabel(td.due)}" readonly placeholder="날짜 선택 시 자동" />
      </div>
    </div>

    <div class="td-field">
      <label>카테고리
        <button class="link-btn" data-act="td-cat-manage">관리</button>
      </label>
      <select id="tdCat">
        <option value="">— 선택 —</option>
        ${catOpts}
        <option value="__new">+ 새 카테고리 추가…</option>
      </select>
    </div>

    <div class="td-field">
      <label style="display:flex;align-items:center;gap:10px">
        이슈 여부
        <button class="hvt ${td.isIssue ? "on" : ""}" data-act="td-issue-toggle" data-id="${td.id}" style="padding:4px 12px;font-size:12px">
          ${td.isIssue ? "🚨 이슈" : "이슈 아님"}
        </button>
      </label>
      ${td.isIssue ? `<textarea id="tdIssueNote" placeholder="이슈 내용 — 원인, 막힌 부분, 해결책 등 (줄바꿈 가능)" rows="3" style="margin-top:8px;resize:vertical">${esc(td.issueNote || "")}</textarea>` : ""}
    </div>

    <div class="td-section-title">해야 할 일 ${over ? '<span class="td-over-tag">기한 지남</span>' : ""}</div>
    <div id="tdGroups">${groupsHtml}</div>
    <button class="add-grp" data-act="td-grp-add">+ 대분류 추가</button>

    <div class="td-field" style="margin-top:22px">
      <label>내용</label>
      <textarea id="tdContent" placeholder="세부 내용, 배경, 참고 사항을 적으세요.">${esc(td.content || "")}</textarea>
    </div>

    <div class="td-field-row">
      <div class="td-field">
        <label>시간</label>
        <input type="text" id="tdTime" value="${esc(td.time || "")}" placeholder="예: 14:00~15:30 / 2시간" />
      </div>
      <div class="td-field">
        <label>결과</label>
        <input type="text" id="tdResult" value="${esc(td.result || "")}" placeholder="예: 완료 / 보류 / 80%" />
      </div>
    </div>

    <div class="td-field">
      <label>피드백</label>
      <textarea id="tdFeedback" placeholder="무엇이 잘 됐고 다음에 무엇을 바꿀지 적으세요.">${esc(td.feedback || "")}</textarea>
    </div>

    <div class="td-save-bar">
      <button class="btn-save" id="tdSaveAll">전체 저장</button>
      <span class="td-save-hint">항목·하위 항목은 자동 저장됩니다</span>
      <button class="btn-ghost" id="tdCopyBtn" title="할 일 내용 복사">⧉ 복사</button>
    </div>

    <div class="td-field" style="margin-top:18px">
      <label>반복 설정</label>
      <div class="td-repeat-row">
        <select id="tdRepeat">
          <option value="" ${!td.repeat ? "selected" : ""}>반복 없음</option>
          <option value="daily" ${td.repeat === "daily" ? "selected" : ""}>매일</option>
          <option value="weekly" ${td.repeat === "weekly" ? "selected" : ""}>매주 (같은 요일)</option>
          <option value="monthly" ${td.repeat === "monthly" ? "selected" : ""}>매월 (같은 날짜)</option>
        </select>
        ${td.repeat ? `<button class="btn-ghost" id="tdRepeatNext">다음 반복 생성</button>` : ""}
      </div>
      ${td.repeat ? `<div class="td-repeat-hint">✅ 완료 시 다음 ${td.repeat === "daily" ? "날" : td.repeat === "weekly" ? "주" : "달"} 할 일이 자동 생성됩니다.</div>` : ""}
    </div>

    <div class="td-section-title" style="margin-top:26px">히스토리</div>
    <div class="td-hist-add">
      <textarea id="tdHistInput" placeholder="진행 상황, 막혔던 부분, 못한 이유… (줄바꿈 가능)" rows="3" style="resize:vertical"></textarea>
      <button class="btn-ghost" id="tdHistAdd" style="align-self:flex-end">추가</button>
    </div>
    <div class="td-hist-list">${histHtml}</div>

  </div>`;
}

function wireTodoDetail(td) {
  const id = td.id;
  const saveField = async (key, val) => { await patchTodo(id, { [key]: val }); };

  // 제목 (blur 시 저장)
  $("#tdTitle").onblur = e => saveField("title", e.target.value.trim() || "제목 없음");
  $("#tdTitle").onkeydown = e => { if (e.key === "Enter") e.target.blur(); };

  // 날짜 → 요일 자동
  $("#tdDate").onchange = async e => {
    await saveField("due", e.target.value);
    $("#tdDow").value = dowLabel(e.target.value);
  };

  // 항목 select
  $("#tdCat").onchange = async e => {
    if (e.target.value === "__new") {
      const name = prompt("새 항목 이름");
      if (name && name.trim()) { await addTodoCat(name.trim()); await saveField("category", name.trim()); renderDetail(); }
      else { e.target.value = td.category || ""; }
      return;
    }
    await saveField("category", e.target.value);
  };

  // 내용/시간/결과/피드백 (blur 저장)
  $("#tdContent").onblur = e => saveField("content", e.target.value);
  $("#tdTime").onblur = e => saveField("time", e.target.value);
  $("#tdResult").onblur = e => saveField("result", e.target.value);
  $("#tdFeedback").onblur = e => saveField("feedback", e.target.value);
  const issueNoteEl = $("#tdIssueNote");
  if (issueNoteEl) issueNoteEl.onblur = e => saveField("issueNote", e.target.value);

  // 전체 저장 버튼
  $("#tdSaveAll").onclick = async () => {
    await patchTodo(id, {
      title: $("#tdTitle").value.trim() || "제목 없음",
      content: $("#tdContent").value, time: $("#tdTime").value,
      result: $("#tdResult").value, feedback: $("#tdFeedback").value
    });
    toast("저장했습니다.");
  };

  // 복사 버튼
  $("#tdCopyBtn").onclick = async () => {
    const lines = [];
    lines.push(`📋 ${td.title}`);
    if (td.due) lines.push(`📅 ${td.due} (${DOW[parseD(td.due).getDay()]})`);
    if (td.category) lines.push(`🏷 ${td.category}`);
    if (td.time) lines.push(`⏰ ${td.time}`);
    if (td.content) lines.push(`\n📝 내용\n${td.content}`);
    if (td.subtasks?.length) {
      lines.push(`\n✅ 할 일`);
      td.subtasks.forEach(g => {
        lines.push(`  [${g.title}]`);
        (g.items || []).forEach(it => lines.push(`    ${it.done ? "☑" : "☐"} ${it.text}`));
      });
    }
    if (td.result) lines.push(`\n🎯 결과: ${td.result}`);
    if (td.feedback) lines.push(`💬 피드백: ${td.feedback}`);
    const ok = await copyText(lines.join("\n"));
    if (ok) toast("할 일 내용을 복사했습니다.");
  };

  // 반복 설정 변경
  $("#tdRepeat").onchange = async e => {
    await patchTodo(id, { repeat: e.target.value || null });
    renderDetail();
  };

  // 다음 반복 수동 생성
  const nextBtn = $("#tdRepeatNext");
  if (nextBtn) nextBtn.onclick = async () => {
    await createRepeatTodo(td);
    toast("다음 반복 할 일을 생성했습니다.");
  };

  // 하위 항목 텍스트 편집 (blur)
  $$('[data-act="td-item-edit"]').forEach(inp => {
    inp.onblur = async () => {
      const gid = inp.dataset.gid, iid = inp.dataset.iid;
      const t = DB.get("todos", id);
      const subtasks = (t.subtasks || []).map(g => g.id !== gid ? g :
        { ...g, items: g.items.map(it => it.id === iid ? { ...it, text: inp.value } : it) });
      await patchTodo(id, { subtasks });
    };
    inp.onkeydown = e => { if (e.key === "Enter") e.target.blur(); };
  });
  // 대분류 이름 편집
  $$('[data-act="td-grp-edit"]').forEach(inp => {
    inp.onblur = async () => {
      const gid = inp.dataset.gid;
      const t = DB.get("todos", id);
      const subtasks = (t.subtasks || []).map(g => g.id === gid ? { ...g, title: inp.value } : g);
      await patchTodo(id, { subtasks });
    };
    inp.onkeydown = e => { if (e.key === "Enter") e.target.blur(); };
  });

  // 히스토리 추가
  const addHist = async () => {
    const inp = $("#tdHistInput");
    const v = inp?.value?.trim();
    if (!v) return;
    await todoAddHistory(id, inp.value.trim()); // 줄바꿈 포함 저장
    inp.value = "";
    renderDetail();
  };
  $("#tdHistAdd").onclick = addHist;
  // Ctrl+Enter로 추가 (Enter는 줄바꿈)
  $("#tdHistInput").onkeydown = e => { if (e.key === "Enter" && e.ctrlKey) addHist(); };

  // 하위 항목 / 대분류 드래그드롭
  wireTodoDnD(id);
}

function wireTodoDnD(id) {
  const scope = $("#tdGroups"); if (!scope) return;
  let dGrp = null, dItem = null, dItemGrp = null;

  scope.addEventListener("dragstart", e => {
    const item = e.target.closest("[data-sub-item]");
    const block = e.target.closest("[data-grp-block]");
    if (item) { dItem = item.dataset.subItem; dItemGrp = item.dataset.grp; item.classList.add("dragging"); e.stopPropagation(); }
    else if (block) { dGrp = block.dataset.grpBlock; block.classList.add("dragging"); }
  });
  scope.addEventListener("dragend", e => {
    $$(".dragging", scope).forEach(x => x.classList.remove("dragging"));
    $$(".drop-target", scope).forEach(x => x.classList.remove("drop-target"));
    dGrp = dItem = dItemGrp = null;
  });
  scope.addEventListener("dragover", e => {
    e.preventDefault();
    const overItem = e.target.closest("[data-sub-item]");
    const overBlock = e.target.closest("[data-grp-block]");
    $$(".drop-target", scope).forEach(x => x.classList.remove("drop-target"));
    if (dItem && overItem) overItem.classList.add("drop-target");
    else if (dGrp && overBlock) overBlock.classList.add("drop-target");
  });
  scope.addEventListener("drop", async e => {
    e.preventDefault();
    const t = DB.get("todos", id);
    let subtasks = (t.subtasks || []).map(g => ({ ...g, items: [...(g.items || [])] }));

    if (dItem) {
      const overItem = e.target.closest("[data-sub-item]");
      const overGrpList = e.target.closest("[data-grp-list]");
      const fromG = subtasks.find(g => g.id === dItemGrp);
      const fi = fromG.items.findIndex(x => x.id === dItem);
      const [moved] = fromG.items.splice(fi, 1);
      if (overItem) {
        const toGid = overItem.dataset.grp, toG = subtasks.find(g => g.id === toGid);
        const ti = toG.items.findIndex(x => x.id === overItem.dataset.subItem);
        toG.items.splice(ti, 0, moved);
      } else if (overGrpList) {
        const toG = subtasks.find(g => g.id === overGrpList.dataset.grpList);
        toG.items.push(moved);
      } else { fromG.items.splice(fi, 0, moved); }
      subtasks.forEach(g => g.items.forEach((it, i) => it.order = i));
      await patchTodo(id, { subtasks });
      renderDetail();
    } else if (dGrp) {
      const overBlock = e.target.closest("[data-grp-block]");
      if (!overBlock) return;
      const fi = subtasks.findIndex(g => g.id === dGrp);
      const ti = subtasks.findIndex(g => g.id === overBlock.dataset.grpBlock);
      const [moved] = subtasks.splice(fi, 1);
      subtasks.splice(ti, 0, moved);
      await patchTodo(id, { subtasks });
      renderDetail();
    }
  });
}

/* 스트릭 보호: 어제(또는 최근 활성일)를 놓쳤을 때 보호권으로 연속 유지 */
function lastMissedActiveDay(h) {
  let cur = addDays(today(), -1), guard = 0;
  while (guard++ < 62) {
    const s = fmt(cur);
    if (s < h.startDate) return null;
    if (activeDays(h).includes(cur.getDay())) {
      if (isChecked(h.id, s) || shieldsOf(h).includes(s)) return null; // 안 놓침
      return s; // 놓친 가장 최근 활성일
    }
    cur = addDays(cur, -1);
  }
  return null;
}
function shieldBar(h) {
  const ym = todayStr().slice(0, 7);
  const used = shieldMonthCount(h, ym);
  const left = Math.max(0, SHIELD_PER_MONTH - used);
  const missed = lastMissedActiveDay(h);
  const canUse = missed && left > 0;
  return `<div class="shield-bar">
    <div class="shield-info">
      <span class="shield-icon">🛡️</span>
      <div>
        <div class="shield-title">스트릭 보호 · 이번 달 ${left}/${SHIELD_PER_MONTH} 남음</div>
        <div class="shield-sub">${missed ? `${missed} 놓침 — 보호권으로 연속을 지킬 수 있어요` : "최근 놓친 날이 없습니다"}</div>
      </div>
    </div>
    ${canUse ? `<button class="btn-ghost" data-act="use-shield" data-id="${h.id}" data-date="${missed}">보호권 쓰기</button>` : ""}
  </div>`;
}

function calendarHtml(h, y, m) {
  const first = new Date(y, m - 1, 1);
  const start = weekStartOf(first);
  const t = todayStr();
  let cells = "";
  for (let i = 0; i < 42; i++) {
    const d = addDays(start, i), ds = fmt(d);
    const out = d.getMonth() !== m - 1;
    const st = checkState(h.id, ds);
    const on = st === "done", fail = st === "fail";
    const miss = !on && !fail && !out && isActiveOn(h, ds) && ds < t;
    cells += `<div class="cal-cell ${out ? "out" : ""} ${on ? "on" : ""} ${fail ? "cal-fail" : ""} ${miss ? "miss" : ""} ${ds === t ? "today" : ""}"
       data-act="calday" data-id="${h.id}" data-date="${ds}">
       <div class="n">${d.getDate()}</div><div class="c"></div></div>`;
  }
  return `<div class="calbox">
    <div class="cal-head">
      <button class="cal-nav" data-act="cal-prev">‹</button>
      <div class="m">${y}년 ${m}월</div>
      <button class="cal-nav" data-act="cal-next">›</button>
    </div>
    <div class="cal-grid">${DOW_MON.map(d => `<div class="cal-dow">${d}</div>`).join("")}${cells}</div>
  </div>`;
}

function logHtml(h, ym) {
  const rows = DB.all("checkins")
    .filter(c => c.habitId === h.id && c.date.startsWith(ym) && c.note)
    .sort((a, b) => b.date.localeCompare(a.date));
  if (!rows.length) return `<div class="log-empty">이번 달에 남긴 기록이 아직 없습니다. 위 메모 칸에서 날짜를 고른 뒤 적어보세요.</div>`;
  return rows.map(c => `<div class="log-item">
    <div class="log-date">${c.date.slice(5).replace("-", "/")}</div>
    <div class="log-txt">${esc(c.note)}</div>
    <button class="log-edit" data-act="editnote" data-id="${h.id}" data-date="${c.date}">수정</button>
  </div>`).join("");
}

/* --- 할 일 --- */
function viewTodos() {
  const t = todayStr();
  let list = DB.all("todos");
  if (state.query) list = list.filter(x => (x.title || "").toLowerCase().includes(state.query.toLowerCase()));
  if (state.todoFrom) list = list.filter(x => !x.due || x.due >= state.todoFrom);
  if (state.todoTo)   list = list.filter(x => !x.due || x.due <= state.todoTo);
  if (state.todoDayFilter) list = list.filter(x => x.due === state.todoDayFilter);

  const dateFilterBar = `<div class="todo-date-filter">
    <span style="font-size:12.5px;color:#6B7280;font-weight:600">📅 날짜 조회</span>
    <input type="date" id="tdFrom" value="${state.todoFrom}" />
    <span style="color:#C4C9D0;font-size:13px">~</span>
    <input type="date" id="tdTo" value="${state.todoTo}" />
    ${state.todoFrom || state.todoTo ? `<button class="btn-ghost" data-act="todo-date-clear" style="padding:4px 10px;font-size:12px">✕ 초기화</button>` : ""}
    ${state.todoFrom || state.todoTo ? `<span style="font-size:12px;color:#9CA3AF;margin-left:auto">${list.length}개</span>` : ""}
  </div>`;

  // ── 이슈 최상단 고정 패널 ──
  const issueItems = DB.all("issues").sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const todoBadIssues = list.filter(x => x.isIssue && !x.done);
  const issuePanel = `<div class="td-issue-panel">
    <div class="td-issue-head">
      🚨 이슈
      <span class="count">${issueItems.length + todoBadIssues.length}</span>
      <button class="btn-ghost" data-act="issue-add" style="margin-left:auto;padding:4px 12px;font-size:12px">+ 이슈 추가</button>
    </div>
    ${issueItems.map(iss => `<div class="iss-row">
      <div class="iss-row-main">
        <span class="iss-status ${iss.resolved ? "resolved" : ""}" data-act="iss-resolve" data-id="${iss.id}" title="${iss.resolved ? "해결됨" : "미해결"}">
          ${iss.resolved ? "✅" : "🔴"}
        </span>
        <div class="iss-body">
          <div class="iss-title">${esc(iss.title || "")}</div>
          ${iss.from || iss.to ? `<div class="iss-date">${iss.from ? iss.from.slice(5) : "??"} ~ ${iss.to ? iss.to.slice(5) : "미정"}${iss.to && iss.to < t && !iss.resolved ? ` <span style="color:#EF4444">기한 초과</span>` : ""}</div>` : ""}
          ${iss.note ? `<div class="iss-note">${esc(iss.note).replace(/\n/g, "<br>")}</div>` : ""}
        </div>
        <div class="iss-actions">
          <button class="icon-btn" data-act="iss-edit" data-id="${iss.id}" title="수정">✎</button>
          <button class="icon-btn" data-act="iss-del" data-id="${iss.id}" title="삭제">✕</button>
        </div>
      </div>
    </div>`).join("")}
    ${todoBadIssues.map(x => `<div class="iss-row linked">
      <span class="iss-status">🚨</span>
      <div class="iss-body" data-act="td-open" data-id="${x.id}" style="cursor:pointer">
        <div class="iss-title">${esc(x.title)}</div>
        ${x.issueNote ? `<div class="iss-note">${esc(x.issueNote).replace(/\n/g,"<br>")}</div>` : `<div class="iss-note-empty">이슈 내용 없음</div>`}
        ${x.due ? `<div style="font-size:11.5px;color:${x.due<=t?"#EF4444":"#9CA3AF"};margin-top:3px">📅 ${x.due}</div>` : ""}
      </div>
    </div>`).join("")}
    ${issueItems.length === 0 && todoBadIssues.length === 0 ? `<div class="td-empty-sub" style="padding:8px 0">등록된 이슈가 없습니다. 오른쪽 "+" 버튼으로 추가하세요.</div>` : ""}
  </div>`;

  // ── 주간 기록 (이슈 패널 바로 아래) ──
  const wlWeekStart = state.wlWeekStart || fmt(weekStartOf(parseD(t)));
  const wlWeekEnd = fmt(addDays(parseD(wlWeekStart), 6));
  const isCurWeek = wlWeekStart === fmt(weekStartOf(parseD(t)));
  const weekLogs = DB.all("weekLogs").filter(w => w.weekStart === wlWeekStart)
    .sort((a,b) => (b.createdAt||0)-(a.createdAt||0));

  // 기록이 있는 모든 주 목록 (현재 보는 주 제외, 최신순)
  const allWeeks = [...new Set(DB.all("weekLogs").map(w => w.weekStart))]
    .filter(ws => ws !== wlWeekStart)
    .sort((a,b) => b.localeCompare(a));

  const weekLogPanel = `<div class="wl-panel">
    <div class="wl-head">
      📆 ${isCurWeek ? "이번 주 있었던 일" : "그 주 있었던 일"}
      <input type="date" id="wlDatePick" value="${wlWeekStart}" style="margin-left:auto;height:28px;font-size:12px;border:1px solid #BFDBFE;border-radius:6px;padding:0 6px" />
    </div>
    <div class="wl-range" style="margin:-4px 0 8px 2px">${wlWeekStart.slice(5)} ~ ${wlWeekEnd.slice(5)}${!isCurWeek ? ` <button class="link-btn" data-act="wl-goto-today" style="margin-left:6px">이번 주로</button>` : ""}</div>
    <div class="wl-input-row">
      <textarea id="wlInput" rows="2" placeholder="있었던 일, 느낀 점 (줄바꿈 가능)"></textarea>
      <button class="btn-ghost" data-act="wl-add" data-week="${wlWeekStart}">추가</button>
    </div>
    ${weekLogs.length ? `<div class="wl-list">${weekLogs.map(w => `<div class="wl-item">
      <div class="wl-item-date">${fmt(new Date(w.createdAt||Date.now())).slice(5)}</div>
      <div class="wl-item-txt">${esc(w.text).replace(/\n/g,"<br>")}</div>
      <button class="sub-x" data-act="wl-del" data-id="${w.id}">✕</button>
    </div>`).join("")}</div>` : `<div class="td-empty-sub" style="padding:6px 0 2px">아직 기록이 없습니다.</div>`}
    ${allWeeks.length ? `<div class="wl-history">
      <div class="wl-history-head">지난 기록</div>
      ${allWeeks.map(ws => {
        const cnt = DB.all("weekLogs").filter(w => w.weekStart === ws).length;
        const we = fmt(addDays(parseD(ws), 6));
        return `<div class="wl-history-row" data-act="wl-goto-week" data-week="${ws}">
          <span>${ws.slice(2)} ~ ${we.slice(5)}</span>
          <span class="count">${cnt}</span>
        </div>`;
      }).join("")}
    </div>` : ""}
  </div>`;

  // ── 주간 뷰 항상 상단 표시 ──
  const weekStrip = todoWeekView(list, t);

  list.sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    if (a.failed !== b.failed) return a.failed ? 1 : -1;
    if (state.sort === "manual") return (a.order ?? 0) - (b.order ?? 0);
    if (state.sort === "name") return (a.title || "").localeCompare(b.title || "", "ko");
    return (a.due || "9999-99-99").localeCompare(b.due || "9999-99-99");
  });

  if (!list.length) return `${issuePanel}${weekLogPanel}${dateFilterBar}${weekStrip}<div class="empty"><div class="big">🗂️</div>
    <h3>할 일이 없습니다</h3><p>마감일을 넣으면 기한이 되는 날 테두리가 빨간색으로 바뀝니다.</p>
    <button data-act="new-todo">할 일 추가</button></div>`;

  const makeCard = (x) => {
    const over = x.due && x.due <= t && !x.done && !x.failed;
    const subCount = (x.subtasks || []).reduce((a, g) => a + (g.items || []).length, 0);
    const subDone = (x.subtasks || []).reduce((a, g) => a + (g.items || []).filter(i => i.done).length, 0);
    const subFailed = (x.subtasks || []).reduce((a, g) => a + (g.items || []).filter(i => i.failed).length, 0);
    const collapsed = !!state.collapsedTodos[x.id];
    const stateBtn = x.done
      ? `<button class="tcheck on" data-act="todo-toggle" data-id="${x.id}" title="완료 → 실패로"></button>`
      : x.failed
        ? `<button class="tcheck fail" data-act="todo-toggle" data-id="${x.id}" title="실패 → 초기화"></button>`
        : `<button class="tcheck" data-act="todo-toggle" data-id="${x.id}" title="체크"></button>`;
    let subPreview = "";
    if (subCount && !collapsed) {
      subPreview = `<div class="trow-subs">` + (x.subtasks || []).map(g => {
        const items = (g.items || []);
        if (!items.length) return "";
        return `<div class="trow-grp">
          <div class="trow-grp-name">${esc(g.title || "대분류")} <span class="trow-grp-c">${items.filter(i => i.done).length}/${items.length}${items.filter(i=>i.failed).length?` ✕${items.filter(i=>i.failed).length}`:""}</span></div>
          ${items.map(it => `<div class="trow-sub">
            <button class="mini-check ${it.done ? "on" : it.failed ? "fail" : ""}" data-act="td-preview-toggle" data-id="${x.id}" data-gid="${g.id}" data-iid="${it.id}"></button>
            <span class="${it.done ? "sub-done" : it.failed ? "sub-failed" : ""}">${esc(it.text || "")}</span>
          </div>`).join("")}
        </div>`;
      }).join("") + `</div>`;
    }
    return `<div class="trow-wrap" draggable="true" data-todo-id="${x.id}">
      <div class="trow ${x.done ? "done" : x.failed ? "failed" : ""} ${over ? "overdue" : ""} ${state.selTodo === x.id ? "sel" : ""}" data-act="td-open" data-id="${x.id}">
        <span class="todo-drag-handle" title="드래그해서 순서 변경">⠿</span>
        ${stateBtn}
        <div class="tbody">
          <div class="ttitle">${esc(x.title)}${x.isIssue ? `<span class="td-issue-badge">🚨</span>` : ""}</div>
          <div class="tmeta">
            ${x.due ? `<span class="due ${over ? "red" : ""}">📅 ${x.due} (${DOW[parseD(x.due).getDay()]})${over ? " · 기한" : ""}</span>` : ""}
            ${x.category ? `<span class="tag">${esc(x.category)}</span>` : ""}
            ${subCount ? `<span>✅ ${subDone}/${subCount}${subFailed ? ` ✕${subFailed}` : ""}</span>` : ""}
            ${(x.history || []).length ? `<span>🕘 ${(x.history || []).length}</span>` : ""}
            ${x.content || x.feedback ? `<span>📝</span>` : ""}
          </div>
        </div>
        ${subCount ? `<button class="collapse-btn ${collapsed ? "" : "open"}" data-act="td-collapse" data-id="${x.id}">▾</button>` : ""}
        <button class="card-menu" style="opacity:1" data-act="todo-menu" data-id="${x.id}">⋯</button>
      </div>
      ${subPreview}
    </div>`;
  };

  // 카테고리별 그룹핑 렌더 (항상 적용)
  const groups = {};
  list.forEach(x => {
    const cat = x.category || "미분류";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(x);
  });

  const catOrder = [...new Set(list.map(x => x.category).filter(Boolean)), "미분류"];
  const sortedGroups = catOrder.filter(cat => groups[cat]);

  const cardsHtml = sortedGroups.map(cat => {
    const items = groups[cat] || [];
    const doneCnt = items.filter(x => x.done).length;
    const failCnt = items.filter(x => x.failed).length;
    const issueCnt = items.filter(x => x.isIssue && !x.done).length;
    const isMisc = cat === "미분류";
    return `<div class="todo-cat-group">
      <div class="todo-cat-head">
        <span class="todo-cat-name">${isMisc ? "📋 미분류" : "🏷 " + esc(cat)}</span>
        <span class="todo-cat-cnt">${doneCnt}/${items.length}완료${failCnt ? ` · ✕${failCnt}` : ""}${issueCnt ? ` · 🚨${issueCnt}` : ""}</span>
      </div>
      <div class="todo-cat-body">${items.map(x => makeCard(x)).join("")}</div>
    </div>`;
  }).join("");

  return `${issuePanel}${weekLogPanel}${dateFilterBar}${weekStrip}${cardsHtml}`;
}

/* 이슈 전용 뷰 — 주간별 그룹핑 */
function todoIssueView() {
  const t = todayStr();
  const allIssues = DB.all("todos").filter(x => x.isIssue);

  if (!allIssues.length) return `<div class="empty" style="padding:44px 20px">
    <div class="big">🚨</div>
    <h3>등록된 이슈가 없습니다</h3>
    <p>할 일 상세 → "이슈 여부" 버튼으로 이슈를 지정하세요.</p>
  </div>`;

  // 주간 네비게이터
  const weekStart = state.issueWeekStart || fmt(weekStartOf(parseD(t)));
  const weekEnd = fmt(addDays(parseD(weekStart), 6));
  const isThisWeek = weekStart === fmt(weekStartOf(parseD(t)));

  const nav = `<div class="td-week-nav" style="margin-bottom:16px">
    <button class="cal-nav" data-act="issue-week-prev">‹</button>
    <span class="td-week-label">${weekStart.slice(5)} ~ ${weekEnd.slice(5)}</span>
    <button class="cal-nav" data-act="issue-week-next" ${isThisWeek?"disabled":""}>›</button>
    <button class="btn-ghost" data-act="issue-week-today" style="margin-left:8px;padding:5px 12px;font-size:12px">이번 주</button>
    <span style="margin-left:auto;font-size:12px;color:#9CA3AF">이슈 총 ${allIssues.length}개 · 미해결 ${allIssues.filter(x=>!x.done).length}개</span>
  </div>`;

  // 이번 주 이슈
  const weekIssues = allIssues.filter(x => x.due >= weekStart && x.due <= weekEnd);
  // 이전 주 미해결
  const overdue = allIssues.filter(x => (!x.due || x.due < weekStart) && !x.done);
  // 완료된 이슈
  const done = allIssues.filter(x => x.done && x.due >= weekStart && x.due <= weekEnd);

  const issueCard = (x) => {
    const over = x.due && x.due < t && !x.done;
    return `<div class="issue-card ${x.done ? "done" : over ? "overdue" : ""}" data-act="td-open" data-id="${x.id}">
      <div class="issue-card-head">
        <button class="tcheck ${x.done ? "on" : x.failed ? "fail" : ""}" data-act="todo-toggle" data-id="${x.id}" style="flex:0 0 20px"></button>
        <div class="issue-card-title">${esc(x.title)}</div>
        ${x.category ? `<span class="tag">${esc(x.category)}</span>` : ""}
        ${x.due ? `<span class="issue-due ${over?"red":""}">${x.due.slice(5)}</span>` : ""}
      </div>
      ${x.issueNote ? `<div class="issue-note">${esc(x.issueNote).replace(/\n/g,"<br>")}</div>` : `<div class="issue-note-empty">이슈 내용 없음 — 클릭해서 추가</div>`}
      ${x.done ? `<div class="issue-resolved">✅ 해결됨</div>` : ""}
    </div>`;
  };

  const section = (title, items, color="#EF4444") => {
    if (!items.length) return "";
    return `<div class="issue-section">
      <div class="issue-section-head" style="color:${color}">${title} <span class="count">${items.length}</span></div>
      ${items.map(issueCard).join("")}
    </div>`;
  };

  return nav
    + section("🔴 기한 지난 미해결 이슈", overdue, "#EF4444")
    + section("🚨 이번 주 이슈", weekIssues.filter(x=>!x.done), "#F97316")
    + section("✅ 이번 주 해결된 이슈", done, "#22C55E")
    + (weekIssues.length === 0 && overdue.length === 0 ? `<div class="td-empty-sub" style="margin-top:20px">이번 주 이슈가 없습니다.</div>` : "");
}

/* 주간 달력 뷰 */
function todoWeekView(list, t) {
  const weekStart = state.todoWeekStart || fmt(weekStartOf(parseD(t)));
  const days = Array.from({length: 7}, (_, i) => fmt(addDays(parseD(weekStart), i)));
  const sel = state.todoDayFilter; // 선택된 날짜

  const cols = days.map(ds => {
    const dayTodos = list.filter(x => x.due === ds);
    const isToday = ds === t;
    const isSel = sel === ds;
    const dow = DOW[parseD(ds).getDay()];
    const isSun = parseD(ds).getDay() === 0;
    const isSat = parseD(ds).getDay() === 6;

    const items = dayTodos.map(x => `<div class="td-week-item ${x.done?"done":x.failed?"failed":""} ${x.isIssue?"issue":""}" data-act="td-open" data-id="${x.id}">
      <span class="td-week-dot ${x.done?"green":x.failed?"red":"gray"}"></span>
      <span class="td-week-ititle">${esc(x.title)}</span>
    </div>`).join("") || `<div class="td-week-empty"></div>`;

    return `<div class="td-week-col ${isToday?"today":""} ${isSel?"td-week-sel":""}" data-act="todo-day-filter" data-date="${ds}">
      <div class="td-week-head ${isSun?"sun":isSat?"sat":""}">
        <div class="td-week-dow">${dow}</div>
        <div class="td-week-date">${parseD(ds).getDate()}</div>
        ${dayTodos.length ? `<div class="td-week-cnt">${dayTodos.length}</div>` : ""}
      </div>
      <div class="td-week-body">${items}</div>
    </div>`;
  }).join("");

  const selLabel = sel ? `<div class="todo-day-filter-badge">
    📅 ${sel.slice(5)} (${DOW[parseD(sel).getDay()]}) 만 보는 중
    <button data-act="todo-day-filter-clear" style="margin-left:8px;font-size:12px;color:#6B7280;background:none;border:none;cursor:pointer">✕ 전체 보기</button>
  </div>` : "";

  return `<div class="td-week-grid">${cols}</div>${selLabel}`;
}

function wireTodos() {
  const f = $("#tdFrom"), t2 = $("#tdTo");
  if (f) f.onchange = e => { state.todoFrom = e.target.value; render(); };
  if (t2) t2.onchange = e => { state.todoTo = e.target.value; render(); };
  const wlDate = $("#wlDatePick");
  if (wlDate) wlDate.onchange = e => {
    if (!e.target.value) return;
    state.wlWeekStart = fmt(weekStartOf(parseD(e.target.value)));
    render();
  };
}

/* 할 일 목록 카드 DnD */
function wireTodoList() {
  let dragId = null;
  $$(".trow-wrap[data-todo-id]").forEach(card => {
    card.addEventListener("dragstart", e => {
      if (e.target.closest("[data-act]") && !e.target.closest(".todo-drag-handle")) { e.preventDefault(); return; }
      dragId = card.dataset.todoId;
      card.classList.add("todo-dragging");
      e.dataTransfer.effectAllowed = "move";
    });
    card.addEventListener("dragend", () => {
      card.classList.remove("todo-dragging");
      $$(".todo-drop-over").forEach(c => c.classList.remove("todo-drop-over"));
      dragId = null;
    });
    card.addEventListener("dragover", e => {
      e.preventDefault();
      $$(".todo-drop-over").forEach(c => c.classList.remove("todo-drop-over"));
      if (dragId && dragId !== card.dataset.todoId) card.classList.add("todo-drop-over");
    });
    card.addEventListener("dragleave", () => card.classList.remove("todo-drop-over"));
    card.addEventListener("drop", async e => {
      e.preventDefault();
      card.classList.remove("todo-drop-over");
      const toId = card.dataset.todoId;
      if (!dragId || dragId === toId) return;
      // 현재 순서에서 재배치
      const all = DB.all("todos");
      const sorted = all.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      const fromIdx = sorted.findIndex(x => x.id === dragId);
      const toIdx = sorted.findIndex(x => x.id === toId);
      if (fromIdx < 0 || toIdx < 0) return;
      const reordered = sorted.slice();
      const [moved] = reordered.splice(fromIdx, 1);
      reordered.splice(toIdx, 0, moved);
      for (let i = 0; i < reordered.length; i++) {
        if (reordered[i].order !== i) await DB.set("todos", reordered[i].id, { ...reordered[i], order: i });
      }
      state.sort = "manual";
      toast("순서를 변경했습니다."); render();
    });
  });
}

/* 회고 */
const MOODS = ["😀", "🙂", "😐", "😔", "😣"];
function viewJournal() {
  let rows = DB.all("journal").sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  if (state.query) rows = rows.filter(j => (j.content || "").toLowerCase().includes(state.query.toLowerCase()));
  if (!rows.length) return `<div class="empty"><div class="big">📓</div>
    <h3>회고 기록이 비어 있습니다</h3><p>하루를 한 문단으로 남기면 습관 데이터가 맥락을 얻습니다.</p>
    <button data-act="new-journal">오늘 기록 쓰기</button></div>`;
  return rows.map(j => `<div class="jcard">
    <div class="jhead">
      <span class="jmood">${esc(j.mood || "🙂")}</span>
      <span class="jdate">${j.date}</span>
      <button class="card-menu" style="opacity:1;margin-left:auto" data-act="journal-menu" data-id="${j.id}">⋯</button>
    </div>
    <div class="jtext">${esc(j.content)}</div>
  </div>`).join("");
}

/* --- 통계 --- */
function viewStats() {
  const habits = DB.all("habits").filter(h => !h.archived);
  if (!habits.length) return `<div class="empty"><div class="big">📊</div><h3>보여줄 데이터가 없습니다</h3><p>습관을 등록하면 달성률과 히트맵이 여기에 쌓입니다.</p></div>`;

  const t = todayStr();
  const from = state.statsFrom || fmt(addDays(today(), -29));
  const to = state.statsTo || t;
  const selId = state.statsSel;

  // 조회 기간 내 날짜 배열
  const days = [];
  let cur = parseD(from);
  while (fmt(cur) <= to) { days.push(fmt(cur)); cur = addDays(cur, 1); }

  // 전체 요약
  let totalDue = 0, totalDone = 0, totalFail = 0;
  days.forEach(ds => {
    if (ds > t) return;
    habits.forEach(h => {
      if (!isActiveOn(h, ds)) return;
      totalDue++;
      const st = checkState(h.id, ds);
      if (st === "done") totalDone++;
      else if (st === "fail") totalFail++;
    });
  });
  const totalPct = totalDue ? Math.round(totalDone / totalDue * 100) : 0;
  const bestH = habits.map(h => ({ h, s: currentStreak(h) })).sort((a, b) => b.s - a.s)[0];
  const totalMiss = totalDue - totalDone - totalFail;

  // 날짜 범위 선택 바
  const rangeBar = `<div class="stats-range">
    <div class="stats-range-presets">
      <button class="hvt ${days.length === 7 ? "on" : ""}" data-act="stats-preset" data-v="7">7일</button>
      <button class="hvt ${days.length === 30 ? "on" : ""}" data-act="stats-preset" data-v="30">30일</button>
      <button class="hvt ${days.length === 90 ? "on" : ""}" data-act="stats-preset" data-v="90">90일</button>
      <button class="hvt ${days.length >= 180 ? "on" : ""}" data-act="stats-preset" data-v="180">180일</button>
    </div>
    <div class="hrange" style="margin-left:auto">
      <input type="date" id="stFrom" value="${from}" max="${t}" />
      <span>~</span>
      <input type="date" id="stTo" value="${to}" max="${t}" />
    </div>
  </div>`;

  // 요약 카드
  const summary = `<div class="stat-grid" style="grid-template-columns:repeat(4,1fr)">
    <div class="stat"><div class="lb">✅ 달성률</div><div class="vl" style="color:#22C55E">${totalPct}<small>%</small></div></div>
    <div class="stat"><div class="lb">📅 완료</div><div class="vl">${totalDone}<small>/ ${totalDue}</small></div></div>
    <div class="stat"><div class="lb">❌ 실패</div><div class="vl" style="color:#EF4444">${totalFail}<small>일</small></div></div>
    <div class="stat"><div class="lb">⬜ 미기록</div><div class="vl" style="color:#9CA3AF">${totalMiss}<small>일</small></div></div>
  </div>`;

  // 히트맵 (실패도 구분)
  const heatCells = days.slice(-140).map(ds => {
    if (ds > t) return `<div class="hcell" style="opacity:.2"></div>`;
    const due = habits.filter(h => isActiveOn(h, ds)).length;
    const done = habits.filter(h => isActiveOn(h, ds) && checkState(h.id, ds) === "done").length;
    const fail = habits.filter(h => isActiveOn(h, ds) && checkState(h.id, ds) === "fail").length;
    if (!due) return `<div class="hcell" title="${ds}"></div>`;
    if (fail > 0 && done === 0) return `<div class="hcell" style="background:#EF4444;opacity:.7" title="${ds} · 실패 ${fail}/${due}"></div>`;
    const pct = done / due;
    const lv = pct === 0 ? 0 : pct < .34 ? 1 : pct < .67 ? 2 : pct < 1 ? 3 : 4;
    return `<div class="hcell l${lv}" title="${ds} · ${done}/${due} (${Math.round(pct*100)}%)"></div>`;
  });

  // 월별 달성률 추이 (최근 6개월 막대)
  const monthBars = (() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i);
      const ym = fmt(d).slice(0, 7);
      let mDue = 0, mDone = 0;
      habits.forEach(h => { const r = monthRate(h, ym); mDue += r.due; mDone += r.done; });
      const pct = mDue ? Math.round(mDone / mDue * 100) : 0;
      months.push({ ym: ym.slice(5) + "월", pct });
    }
    return months.map(m => `<div class="stats-mbar">
      <div class="stats-mbar-fill" style="height:${Math.max(4, m.pct * 0.9)}px;background:${m.pct >= 80 ? "#22C55E" : m.pct >= 50 ? "#F59E0B" : "#EF4444"}"></div>
      <div class="stats-mbar-pct">${m.pct}%</div>
      <div class="stats-mbar-lb">${m.ym}</div>
    </div>`).join("");
  })();

  // 요일별 달성 패턴
  const dowStats = Array.from({ length: 7 }, (_, dow) => {
    let d = 0, n = 0, f = 0;
    days.forEach(ds => {
      if (parseD(ds).getDay() !== dow || ds > t) return;
      habits.forEach(h => {
        if (!isActiveOn(h, ds)) return;
        const st = checkState(h.id, ds);
        if (st === "done") { d++; n++; } else if (st === "fail") { f++; n++; } else n++;
      });
    });
    const pct = n ? Math.round(d / n * 100) : 0;
    return { dow: DOW[dow], pct, done: d, fail: f, total: n };
  });
  const maxDowPct = Math.max(1, ...dowStats.map(x => x.pct));
  const dowChart = `<div class="stats-dow">` + dowStats.map(x => `
    <div class="stats-dow-col">
      <div class="stats-dow-bar-wrap">
        <div class="stats-dow-bar" style="height:${Math.round(x.pct / maxDowPct * 60)}px;background:${x.pct >= 80 ? "#22C55E" : x.pct >= 50 ? "#F59E0B" : x.pct > 0 ? "#EF4444" : "#F1F2F4"}"></div>
      </div>
      <div class="stats-dow-pct">${x.pct}%</div>
      <div class="stats-dow-lb">${x.dow}</div>
      ${x.fail > 0 ? `<div class="stats-dow-fail">✕${x.fail}</div>` : ""}
    </div>`).join("") + `</div>`;

  // 습관별 상세 목록
  const habitList = habits.map(h => {
    let hDue = 0, hDone = 0, hFail = 0;
    let maxMiss = 0, curMiss = 0, worstDow = Array(7).fill(0), bestDow = Array(7).fill(0);
    days.forEach(ds => {
      if (ds > t || !isActiveOn(h, ds)) return;
      hDue++;
      const st = checkState(h.id, ds);
      const dow = parseD(ds).getDay();
      if (st === "done") { hDone++; worstDow[dow]++; curMiss = 0; }
      else if (st === "fail") { hFail++; curMiss++; maxMiss = Math.max(maxMiss, curMiss); }
      else { curMiss++; maxMiss = Math.max(maxMiss, curMiss); }
    });
    const hPct = hDue ? Math.round(hDone / hDue * 100) : 0;
    const streak = currentStreak(h);
    const best = bestStreak(h);
    const isSelected = selId === h.id;

    const detail = isSelected ? `<div class="stats-habit-detail">
      <div class="stats-detail-row"><span>완료</span><b style="color:#22C55E">${hDone}일</b></div>
      <div class="stats-detail-row"><span>실패</span><b style="color:#EF4444">${hFail}일</b></div>
      <div class="stats-detail-row"><span>미기록</span><b style="color:#9CA3AF">${hDue - hDone - hFail}일</b></div>
      <div class="stats-detail-row"><span>현재 연속</span><b>🔥 ${streak}일</b></div>
      <div class="stats-detail-row"><span>최고 연속</span><b>⭐ ${best}일</b></div>
      <div class="stats-detail-row"><span>최대 연속 미달성</span><b style="color:#EF4444">${maxMiss}일</b></div>
    </div>` : "";

    return `<div class="stats-habit-row ${isSelected ? "sel" : ""}" data-act="stats-sel" data-id="${h.id}">
      <div class="stats-habit-left">
        <span style="font-size:18px">${esc(h.emoji || "🙂")}</span>
        <span class="stats-habit-name">${esc(h.name)}</span>
        ${hFail > 0 ? `<span class="stats-fail-badge">✕${hFail}</span>` : ""}
      </div>
      <div class="stats-habit-right">
        <div class="bar-track" style="flex:1"><div class="bar-fill" style="width:${hPct}%"></div></div>
        <div class="stats-habit-pct">${hPct}%</div>
        <span style="font-size:11px;color:#9CA3AF;min-width:52px;text-align:right">🔥${streak}일</span>
      </div>
      ${detail}
    </div>`;
  }).join("");

  return `
  ${rangeBar}
  ${summary}

  <div class="grp-title" style="margin-top:22px">월별 달성률 추이</div>
  <div class="stats-month-bars">${monthBars}</div>

  <div class="grp-title" style="margin-top:22px">요일별 달성 패턴 <span style="font-size:11px;color:#9CA3AF;font-weight:400">— 어떤 요일에 자주 못 하는지</span></div>
  ${dowChart}

  <div class="grp-title" style="margin-top:22px">기간 히트맵 <span style="font-size:11px;color:#9CA3AF;font-weight:400">🟩완료 🟥실패</span></div>
  <div class="heat">${heatCells.join("")}</div>

  <div class="grp-title" style="margin-top:24px">습관별 상세 <span style="font-size:11px;color:#9CA3AF;font-weight:400">— 클릭하면 상세 펼치기</span></div>
  <div class="stats-habit-list">${habitList}</div>`;
}

function wireStats() {
  const f = $("#stFrom"), t2 = $("#stTo");
  if (f) f.onchange = e => { state.statsFrom = e.target.value; render(); };
  if (t2) t2.onchange = e => { state.statsTo = e.target.value; render(); };
}

/* ============================================================
   몸무게
============================================================ */
const WEIGHT_GOAL_KEY = "weightGoal";
function weightGoal() {
  const m = DB.get("meta", WEIGHT_GOAL_KEY);
  return (m && m.value) ? Number(m.value) : 75;
}
function weightRows() {
  return DB.all("weights").filter(w => w.kg != null).sort((a, b) => a.date.localeCompare(b.date));
}
function weightStatCards(rows, goal) {
  const latest = rows.length ? rows[rows.length - 1] : null;
  const first = rows.length ? rows[0] : null;
  const kgs = rows.map(r => r.kg);
  const avg = kgs.length ? kgs.reduce((a, b) => a + b, 0) / kgs.length : null;
  const min = kgs.length ? Math.min(...kgs) : null;
  const max = kgs.length ? Math.max(...kgs) : null;
  const diffGoal = latest ? (latest.kg - goal) : null;
  const diffStart = (latest && first) ? (latest.kg - first.kg) : null;
  const c = (lb, v, unit = "kg") => `<div class="stat"><div class="lb">${lb}</div><div class="vl">${v}<small>${unit}</small></div></div>`;
  return `<div class="stat-grid" style="grid-template-columns:repeat(3,1fr)">
      ${c("⚖️ 현재", latest ? latest.kg : "—")}
      ${c("🎯 목표까지", diffGoal != null ? (diffGoal > 0 ? "+" : "") + diffGoal.toFixed(1) : "—")}
      ${c("📉 시작 대비", diffStart != null ? (diffStart > 0 ? "+" : "") + diffStart.toFixed(1) : "—")}
      ${c("📊 평균", avg != null ? avg.toFixed(1) : "—")}
      ${c("🔻 최저", min != null ? min : "—")}
      ${c("🔺 최고", max != null ? max : "—")}
    </div>`;
}

function weightSection() {
  const rows = weightRows();
  const goal = weightGoal();
  const today = todayStr();
  const draftKg = DB.get("weights", "w_" + today)?.kg ?? "";

  const input = `
    <div class="w-input">
      <div class="w-input-row">
        <div class="w-field"><label>날짜</label><input type="date" id="wDate" value="${today}" max="${today}" /></div>
        <div class="w-field"><label>몸무게 (kg)</label><input type="number" id="wKg" step="0.1" min="20" max="300" placeholder="예: 78.5" value="${draftKg}" /></div>
        <button class="btn-save" id="wSave" style="align-self:flex-end;height:42px">기록</button>
      </div>
      <div class="w-goal-row">
        <label>목표 몸무게</label>
        <input type="number" id="wGoal" step="0.1" value="${goal}" />
        <span>kg</span>
        <button class="btn-ghost" id="wGoalSave">목표 저장</button>
      </div>
    </div>`;

  const chart = rows.length >= 1 ? weightChart(rows, goal) :
    `<div class="empty" style="padding:44px 20px"><div class="big">⚖️</div><h3>기록이 없습니다</h3><p>위에서 오늘 몸무게를 입력하면<br>추이 그래프가 여기에 그려집니다.</p></div>`;

  const listRows = rows.slice().reverse().slice(0, 60).map((w, i, arr) => {
    const prev = arr[i + 1];
    const delta = prev ? (w.kg - prev.kg) : null;
    const dcls = delta == null ? "" : delta < 0 ? "down" : delta > 0 ? "up" : "";
    return `<div class="w-row">
      <div class="w-date">${w.date} <span class="w-dow">(${DOW[parseD(w.date).getDay()]})</span></div>
      <div class="w-kg">${w.kg} kg</div>
      <div class="w-delta ${dcls}">${delta == null ? "" : (delta > 0 ? "▲" : delta < 0 ? "▼" : "—") + " " + Math.abs(delta).toFixed(1)}</div>
      <button class="sub-x" data-act="w-del" data-date="${w.date}">✕</button>
    </div>`;
  }).join("");

  return `${weightStatCards(rows, goal)}${input}
    <div class="grp-title" style="margin-top:22px">추이 그래프</div>
    ${chart}
    <div class="grp-title" style="margin-top:24px">기록 <span class="count">${rows.length}</span></div>
    <div class="w-list">${listRows || `<div class="td-empty-sub">아직 기록이 없습니다.</div>`}</div>`;
}

function weightChart(rows, goal) {
  const W = 720, H = 240, padL = 44, padR = 16, padT = 16, padB = 28;
  const data = rows.slice(-60); // 최근 60개
  const kgs = data.map(r => r.kg);
  let min = Math.min(...kgs, goal), max = Math.max(...kgs, goal);
  const span = (max - min) || 1;
  min -= span * 0.15; max += span * 0.15;
  const n = data.length;
  const x = i => padL + (n <= 1 ? (W - padL - padR) / 2 : i * (W - padL - padR) / (n - 1));
  const y = kg => padT + (max - kg) / (max - min) * (H - padT - padB);

  // 격자 + y라벨
  let grid = "";
  const ticks = 4;
  for (let t = 0; t <= ticks; t++) {
    const kg = min + (max - min) * t / ticks;
    const yy = y(kg);
    grid += `<line x1="${padL}" y1="${yy}" x2="${W - padR}" y2="${yy}" stroke="var(--wgrid)" stroke-width="1"/>
      <text x="${padL - 8}" y="${yy + 4}" text-anchor="end" font-size="11" fill="var(--wtick)">${kg.toFixed(1)}</text>`;
  }
  // 목표선
  const gy = y(goal);
  const goalLine = `<line x1="${padL}" y1="${gy}" x2="${W - padR}" y2="${gy}" stroke="#F59E0B" stroke-width="1.5" stroke-dasharray="5 4"/>
    <text x="${W - padR}" y="${gy - 6}" text-anchor="end" font-size="11" fill="#F59E0B" font-weight="700">목표 ${goal}kg</text>`;
  // 선 + 영역
  const pts = data.map((r, i) => `${x(i)},${y(r.kg)}`).join(" ");
  const area = `${padL},${H - padB} ` + pts + ` ${x(n - 1)},${H - padB}`;
  const dots = data.map((r, i) => `<circle cx="${x(i)}" cy="${y(r.kg)}" r="3.2" fill="#22C55E"><title>${r.date} · ${r.kg}kg</title></circle>`).join("");
  // x라벨 (양끝 + 중간)
  const idxs = n <= 1 ? [0] : [0, Math.floor((n - 1) / 2), n - 1];
  const xlabels = idxs.map(i => `<text x="${x(i)}" y="${H - 8}" text-anchor="middle" font-size="10.5" fill="var(--wtick)">${data[i].date.slice(5)}</text>`).join("");

  return `<div class="w-chart">
    <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="width:100%;height:240px">
      ${grid}${goalLine}
      <polygon points="${area}" fill="url(#wgrad)" opacity="0.18"/>
      <polyline points="${pts}" fill="none" stroke="#22C55E" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
      ${dots}${xlabels}
      <defs><linearGradient id="wgrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#22C55E"/><stop offset="100%" stop-color="#22C55E" stop-opacity="0"/>
      </linearGradient></defs>
    </svg>
  </div>`;
}

function wireWeight() {
  const save = async () => {
    const date = $("#wDate").value;
    const kg = parseFloat($("#wKg").value);
    if (!date) return toast("날짜를 선택하세요.");
    if (!(kg > 0)) return toast("몸무게를 숫자로 입력하세요.");
    await DB.set("weights", "w_" + date, { date, kg: Math.round(kg * 10) / 10 });
    await DB.log("edit", `몸무게 ${kg}kg (${date}) 기록`);
    toast("기록했습니다.");
    render();
  };
  $("#wSave").onclick = save;
  $("#wKg").onkeydown = e => { if (e.key === "Enter") save(); };
  $("#wGoalSave").onclick = async () => {
    const g = parseFloat($("#wGoal").value);
    if (!(g > 0)) return toast("목표 몸무게를 확인하세요.");
    await DB.set("meta", WEIGHT_GOAL_KEY, { value: Math.round(g * 10) / 10 });
    toast("목표를 저장했습니다.");
    render();
  };
}

/* ============================================================
   운동 (몸무게 + 운동 세션 기록)
============================================================ */
function workoutRows() {
  return DB.all("workouts").sort((a, b) => (b.date || "").localeCompare(a.date || "") || (b.createdAt || 0) - (a.createdAt || 0));
}
/* ============================================================
   노트 탭 — 나와의 약속·실수 모음·자유 메모
============================================================ */
const NOTE_CAT_DEFAULTS = [
  { id: "promise", label: "나와의 약속", emoji: "🤝", color: "#0C66E4", desc: "지키기로 다짐한 것들" },
  { id: "mistake", label: "실수 모음집", emoji: "📌", color: "#EF4444", desc: "같은 실수를 반복하지 않기 위해" },
  { id: "memo",    label: "자유 메모", emoji: "📝", color: "#22C55E", desc: "떠오르는 생각, 아이디어" }
];
function getNoteCats() {
  const saved = DB.all("noteCats").sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return saved.length ? saved : NOTE_CAT_DEFAULTS;
}
function getNoteCat(id) {
  return getNoteCats().find(c => c.id === id) || { id, label: id, emoji: "📝", color: "#6B7280", desc: "" };
}

/* ============================================================
   개인 시간표 — 원형 24시간 시간표 (요일별)
============================================================ */
const SCHED_COLORS = ["#0C66E4","#22C55E","#F59E0B","#EF4444","#8B5CF6","#EC4899","#0EA5E9","#14B8A6","#F97316","#6B7280"];
const SCHED_PRESETS = [
  { label: "수면", emoji: "😴", color: "#6366F1" },
  { label: "업무", emoji: "💼", color: "#0C66E4" },
  { label: "공부", emoji: "📚", color: "#22C55E" },
  { label: "운동", emoji: "💪", color: "#EF4444" },
  { label: "식사", emoji: "🍽", color: "#F59E0B" },
  { label: "이동", emoji: "🚇", color: "#8B5CF6" },
  { label: "휴식", emoji: "☕", color: "#14B8A6" },
  { label: "노래", emoji: "🎤", color: "#EC4899" }
];

// 요일 인덱스: 0=월 ... 6=일
function schedCurDay() {
  if (state.schedDay !== null && state.schedDay !== undefined) return state.schedDay;
  const d = new Date().getDay(); // 0=일 ... 6=토
  return d === 0 ? 6 : d - 1;
}
function schedBlocks(dayIdx) {
  return DB.all("schedule").filter(b => Number(b.day) === dayIdx)
    .sort((a, b) => (a.start || 0) - (b.start || 0));
}
// "HH:MM" -> 분
function hmToMin(hm) { const [h, m] = (hm || "0:0").split(":").map(Number); return h * 60 + (m || 0); }
function minToHm(min) { const h = Math.floor(min / 60) % 24, m = min % 60; return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`; }

function viewSchedule() {
  const cur = schedCurDay();
  const blocks = schedBlocks(cur);

  // 이번 주 날짜 계산 (월요일 시작)
  const weekDays = weekOf(today());
  const todayIdx = (() => { const d = new Date().getDay(); return d === 0 ? 6 : d - 1; })();

  const tabs = `<div class="sched-tabs">
    ${DOW_MON.map((d, i) => {
      const dateObj = weekDays[i];
      const isToday = i === todayIdx;
      return `<button class="sched-tab ${cur===i?"on":""} ${isToday?"today":""}" data-act="sched-day" data-v="${i}">
        <span class="sched-tab-dow">${d}</span>
        <span class="sched-tab-date">${dateObj.getDate()}</span>
        ${schedBlocks(i).length ? `<span class="sched-tab-dot"></span>` : ""}
      </button>`;
    }).join("")}
  </div>`;

  // 원형 시간표 SVG (24시간 = 360도, 0시가 12시 방향)
  const R = 152, cx = 170, cy = 170, innerR = 52;
  const arcs = blocks.map(b => {
    const s = Number(b.start), e = Number(b.end);
    const dur = e > s ? e - s : (1440 - s + e); // 자정 넘김 처리
    const a0 = (s / 1440) * 2 * Math.PI - Math.PI / 2;
    const a1 = ((s + dur) / 1440) * 2 * Math.PI - Math.PI / 2;
    const large = dur > 720 ? 1 : 0;
    const x0 = cx + R * Math.cos(a0), y0 = cy + R * Math.sin(a0);
    const x1 = cx + R * Math.cos(a1), y1 = cy + R * Math.sin(a1);
    const ix0 = cx + innerR * Math.cos(a0), iy0 = cy + innerR * Math.sin(a0);
    const ix1 = cx + innerR * Math.cos(a1), iy1 = cy + innerR * Math.sin(a1);
    // 라벨 위치 (중간 각도)
    const am = (a0 + a1) / 2;
    const lr = (R + innerR) / 2;
    const lx = cx + lr * Math.cos(am), ly = cy + lr * Math.sin(am);
    const emoji = b.emoji || "";
    const label = b.label || "";

    // 블록 길이에 따라 라벨 표시 방식 결정
    let labelSvg = "";
    if (dur >= 150) {
      // 넉넉함: 이모지 + 전체 텍스트 가로 배치
      labelSvg = `<text x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="middle"
        font-size="11.5" font-weight="700" fill="#fff" pointer-events="none">${esc(emoji + " " + label)}</text>`;
    } else if (dur >= 40) {
      // 1시간 안팎: 반지름 방향으로 회전시켜 표시 (긴 이름도 들어감)
      let deg = am * 180 / Math.PI;
      let flip = false;
      if (deg > 90 || deg < -90) { deg += 180; flip = true; } // 글자 뒤집힘 방지
      const short = label.length > 7 ? label.slice(0, 7) + "…" : label;
      const txt = emoji ? `${emoji} ${short}` : short;
      labelSvg = `<text x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="middle"
        transform="rotate(${deg.toFixed(1)} ${lx.toFixed(1)} ${ly.toFixed(1)})"
        font-size="10" font-weight="700" fill="#fff" pointer-events="none">${esc(txt)}</text>`;
    } else if (dur >= 20 && emoji) {
      // 아주 짧음: 이모지만
      labelSvg = `<text x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="middle"
        font-size="11" pointer-events="none">${esc(emoji)}</text>`;
    }

    return `<g>
      <title>${esc(`${minToHm(s)}~${minToHm(e)} ${emoji} ${label}`)}</title>
      <path d="M${x0},${y0} A${R},${R} 0 ${large} 1 ${x1},${y1} L${ix1},${iy1} A${innerR},${innerR} 0 ${large} 0 ${ix0},${iy0} Z"
        fill="${b.color||"#0C66E4"}" opacity="0.88" stroke="#fff" stroke-width="1.5"
        style="cursor:pointer" data-act="sched-edit" data-id="${b.id}"/>
      ${labelSvg}
    </g>`;
  }).join("");

  // 시간 눈금 (3시간 간격)
  const ticks = Array.from({length:8}, (_, i) => {
    const hour = i * 3;
    const a = (hour / 24) * 2 * Math.PI - Math.PI / 2;
    const tr = R + 16;
    const tx = cx + tr * Math.cos(a), ty = cy + tr * Math.sin(a);
    const lx0 = cx + (R+2) * Math.cos(a), ly0 = cy + (R+2) * Math.sin(a);
    const lx1 = cx + (R+7) * Math.cos(a), ly1 = cy + (R+7) * Math.sin(a);
    return `<line x1="${lx0}" y1="${ly0}" x2="${lx1}" y2="${ly1}" stroke="#C4C9D0" stroke-width="1.5"/>
      <text x="${tx}" y="${ty}" text-anchor="middle" dominant-baseline="middle" font-size="11.5" font-weight="600" fill="#9CA3AF">${hour}</text>`;
  }).join("");

  // 총 시간 계산
  const totalMin = blocks.reduce((s, b) => {
    const st = Number(b.start), en = Number(b.end);
    return s + (en > st ? en - st : 1440 - st + en);
  }, 0);
  const freeMin = Math.max(0, 1440 - totalMin);

  const clock = `<div class="sched-clock-wrap">
    <svg viewBox="0 0 340 340" class="sched-clock">
      <circle cx="${cx}" cy="${cy}" r="${R}" fill="#FAFBFC" stroke="#EDEEF1" stroke-width="1"/>
      <circle cx="${cx}" cy="${cy}" r="${innerR}" fill="#FFFFFF" stroke="#EDEEF1" stroke-width="1"/>
      ${arcs}${ticks}
      <text x="${cx}" y="${cy-7}" text-anchor="middle" font-size="12.5" font-weight="700" fill="#374151">${DOW_MON[cur]}요일</text>
      <text x="${cx}" y="${cy+11}" text-anchor="middle" font-size="10.5" fill="#9CA3AF">${blocks.length}개 일정</text>
    </svg>
  </div>`;

  const stat = `<div class="stat-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:14px">
    <div class="stat"><div class="lb">📋 일정</div><div class="vl">${blocks.length}<small>개</small></div></div>
    <div class="stat"><div class="lb">⏱ 채워진 시간</div><div class="vl" style="color:#0C66E4">${(totalMin/60).toFixed(1)}<small>h</small></div></div>
    <div class="stat"><div class="lb">🕳 남은 시간</div><div class="vl" style="color:#9CA3AF">${(freeMin/60).toFixed(1)}<small>h</small></div></div>
  </div>`;

  const list = blocks.length ? blocks.map(b => {
    const st = Number(b.start), en = Number(b.end);
    const dur = en > st ? en - st : 1440 - st + en;
    const gid = b.groupId || b.id;
    const repeatCount = DB.all("schedule").filter(x => (x.groupId || x.id) === gid).length;
    return `<div class="sched-item" data-act="sched-edit" data-id="${b.id}">
      <span class="sched-item-bar" style="background:${b.color||"#0C66E4"}"></span>
      <span class="sched-item-time">${minToHm(st)} ~ ${minToHm(en)}</span>
      <span class="sched-item-label">${esc((b.emoji||"") + " " + (b.label||""))}</span>
      ${repeatCount > 1 ? `<span class="sched-repeat-badge" title="${repeatCount}개 요일 반복">🔁 ${repeatCount}</span>` : ""}
      <span class="sched-item-dur">${Math.floor(dur/60)}h${dur%60?` ${dur%60}m`:""}</span>
      <button class="icon-btn" style="width:26px;height:26px;opacity:1" data-act="sched-dup" data-id="${b.id}" title="복제">⧉</button>
      <button class="sub-x" data-act="sched-del" data-id="${b.id}">✕</button>
    </div>`;
  }).join("") : `<div class="td-empty-sub" style="padding:20px 4px;text-align:center">${DOW_MON[cur]}요일 일정이 없습니다. 아래에서 추가하세요.</div>`;

  const otherDays = DOW_MON.map((d,i) => i!==cur && schedBlocks(i).length ? `<option value="${i}">${d}요일 (${schedBlocks(i).length}개)</option>` : "").join("");

  return `${tabs}
    ${stat}
    ${clock}
    <div style="display:flex;gap:8px;margin:14px 0 10px;flex-wrap:wrap">
      <button class="add-grp" data-act="sched-add" data-day="${cur}" style="flex:1;margin:0">+ 일정 추가</button>
      ${otherDays ? `<button class="btn-ghost" data-act="sched-copy" data-day="${cur}" style="flex:0 0 auto">📋 다른 요일 복사</button>` : ""}
      ${blocks.length ? `<button class="btn-ghost" data-act="sched-copy-text" data-day="${cur}" style="flex:0 0 auto">⧉ 텍스트 복사</button>` : ""}
    </div>
    <div class="grp-title">${DOW_MON[cur]}요일 일정 <span class="count">${blocks.length}</span></div>
    <div class="sched-list">${list}</div>`;
}

function wireSchedule() { /* 이벤트는 전역 위임으로 처리 */ }

function schedEditModal(existing, dayIdx) {
  const b = existing || { label: "", emoji: "", color: SCHED_COLORS[0], start: 540, end: 600, day: dayIdx };
  const isNew = !existing;
  openModal(`<div class="modal" style="max-width:460px">
    <div class="modal-head"><h3>${isNew?"일정 추가":"일정 수정"}</h3><button class="icon-btn" data-act="close">✕</button></div>
    <div class="modal-body">
      <div class="mrow"><label>빠른 선택</label><div class="ctl">
        <div class="sched-preset-row">
          ${SCHED_PRESETS.map(p => `<button type="button" class="sched-preset" data-label="${esc(p.label)}" data-emoji="${p.emoji}" data-color="${p.color}" style="border-color:${p.color}44">
            ${p.emoji} ${p.label}
          </button>`).join("")}
        </div>
      </div></div>
      <div class="mrow"><label>이름</label><div class="ctl"><input type="text" id="scLabel" value="${esc(b.label||"")}" placeholder="예: 아침 운동" /></div></div>
      <div class="mrow"><label>이모지</label><div class="ctl"><input type="text" id="scEmoji" value="${esc(b.emoji||"")}" placeholder="선택" maxlength="4" style="width:80px" /></div></div>
      <div class="mrow"><label>시작</label><div class="ctl"><input type="time" id="scStart" value="${minToHm(Number(b.start))}" step="300" /></div></div>
      <div class="mrow"><label>종료</label><div class="ctl"><input type="time" id="scEnd" value="${minToHm(Number(b.end))}" step="300" /></div></div>
      <div class="mrow" style="align-items:flex-start"><label style="padding-top:6px">반복 요일</label><div class="ctl">
        <div class="sched-repeat-preset">
          <button type="button" data-days="0,1,2,3,4,5,6">매일</button>
          <button type="button" data-days="0,1,2,3,4">평일</button>
          <button type="button" data-days="5,6">주말</button>
          <button type="button" data-days="">해제</button>
        </div>
        <div class="sched-day-pick" id="scDayPick">
          ${DOW_MON.map((d,i)=>`<button type="button" class="sched-day-btn ${(isNew ? i===Number(b.day) : (b.repeatDays||[Number(b.day)]).includes(i)) ? "on":""}" data-day="${i}">${d}</button>`).join("")}
        </div>
        <div class="sched-day-hint" id="scDayHint"></div>
      </div></div>
      <div class="mrow"><label>색상</label><div class="ctl">
        <div class="sched-color-row" id="scColorRow" data-selected="${b.color}">
          ${SCHED_COLORS.map(c=>`<button type="button" class="sched-color ${b.color===c?"on":""}" data-color="${c}" style="background:${c}"></button>`).join("")}
        </div>
      </div></div>
    </div>
    <div class="modal-foot">
      <button class="btn-cancel" data-act="close">취소</button>
      <button class="btn-save" id="scSave">저장</button>
    </div>
  </div>`);

  // 요일 선택 상태 갱신
  const updateHint = () => {
    const sel = $$(".sched-day-btn.on").map(x => Number(x.dataset.day)).sort((a,c)=>a-c);
    const hint = $("#scDayHint");
    if (!hint) return;
    if (!sel.length) hint.textContent = "요일을 하나 이상 선택하세요.";
    else if (sel.length === 7) hint.textContent = "매일 반복됩니다.";
    else hint.textContent = `${sel.map(i=>DOW_MON[i]).join("·")}요일에 반복됩니다. (${sel.length}일)`;
  };
  const dayPick = $("#scDayPick");
  if (dayPick) dayPick.onclick = e => {
    const btn = e.target.closest(".sched-day-btn"); if (!btn) return;
    btn.classList.toggle("on"); updateHint();
  };
  $$(".sched-repeat-preset button").forEach(btn => btn.onclick = () => {
    const days = btn.dataset.days ? btn.dataset.days.split(",").map(Number) : [];
    $$(".sched-day-btn").forEach(d => d.classList.toggle("on", days.includes(Number(d.dataset.day))));
    updateHint();
  });
  updateHint();

  // 프리셋 클릭
  $$(".sched-preset").forEach(btn => btn.onclick = () => {
    $("#scLabel").value = btn.dataset.label;
    $("#scEmoji").value = btn.dataset.emoji;
    const row = $("#scColorRow");
    row.dataset.selected = btn.dataset.color;
    $$(".sched-color", row).forEach(c => c.classList.toggle("on", c.dataset.color === btn.dataset.color));
  });
  // 색상 선택
  const colorRow = $("#scColorRow");
  if (colorRow) colorRow.onclick = e => {
    const c = e.target.closest("[data-color]"); if (!c) return;
    colorRow.dataset.selected = c.dataset.color;
    $$(".sched-color", colorRow).forEach(x => x.classList.toggle("on", x === c));
  };
  setTimeout(() => $("#scLabel")?.focus(), 40);

  $("#scSave").onclick = async () => {
    const label = $("#scLabel").value.trim();
    if (!label) return toast("이름을 입력하세요.");
    const start = hmToMin($("#scStart").value);
    const end = hmToMin($("#scEnd").value);
    if (start === end) return toast("시작과 종료 시간이 같습니다.");
    const days = $$(".sched-day-btn.on").map(x => Number(x.dataset.day)).sort((a,c)=>a-c);
    if (!days.length) return toast("반복할 요일을 선택하세요.");

    const data = {
      label, emoji: $("#scEmoji").value.trim(),
      color: $("#scColorRow").dataset.selected || SCHED_COLORS[0],
      start, end, repeatDays: days
    };

    if (!isNew) {
      // 같은 그룹(반복 세트)에 속한 기존 블록 전부 제거 후 재생성
      const gid = existing.groupId || existing.id;
      const siblings = DB.all("schedule").filter(x => (x.groupId || x.id) === gid);
      for (const s of siblings) await DB.del("schedule", s.id);
      for (const d of days) {
        await DB.set("schedule", uid(), { ...data, day: d, groupId: gid, createdAt: existing.createdAt || Date.now() });
      }
      toast(days.length > 1 ? `${days.length}개 요일로 수정했습니다.` : "수정했습니다.");
    } else {
      const gid = uid();
      for (const d of days) {
        await DB.set("schedule", uid(), { ...data, day: d, groupId: gid, createdAt: Date.now() });
      }
      toast(days.length > 1 ? `${days.length}개 요일에 추가했습니다.` : "추가했습니다.");
    }
    closeModal(); render();
  };
}

function viewNotes() {
  const cats = getNoteCats();
  const curCat = state.noteCat || cats[0]?.id || "promise";
  const c = getNoteCat(curCat);
  const q = (state.noteQuery || "").toLowerCase().trim();

  const catTabs = `<div class="note-cat-tabs">
    ${cats.map(cat => {
      const cnt = DB.all("notes").filter(n => n.cat === cat.id).length;
      return `<button class="note-cat-tab ${curCat===cat.id?"on":""}" data-act="note-cat" data-v="${cat.id}" style="${curCat===cat.id?`border-color:${cat.color};color:${cat.color}`:""}">
        ${cat.emoji} ${esc(cat.label)} ${cnt?`<span class="note-cat-cnt">${cnt}</span>`:""}
      </button>`;
    }).join("")}
    <button class="note-cat-tab note-cat-manage" data-act="note-cat-manage">⚙</button>
  </div>`;

  const header = `<div class="note-header" style="border-left:3px solid ${c.color}">
    <div>
      <div class="note-header-title">${c.emoji} ${esc(c.label)}</div>
      ${c.desc ? `<div class="note-header-desc">${esc(c.desc)}</div>` : ""}
    </div>
    <button class="btn-save" data-act="note-add" data-cat="${curCat}" style="padding:8px 16px">+ 추가</button>
  </div>`;

  const searchBar = `<div class="wk-search" style="margin-bottom:12px">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
    <input type="text" id="noteQuery" placeholder="제목·내용 검색" value="${esc(state.noteQuery||"")}" />
  </div>`;

  let notes = DB.all("notes").filter(n => n.cat === curCat);
  if (q) notes = notes.filter(n => ((n.title||"")+" "+(n.body||"")+" "+(n.sub||"")).toLowerCase().includes(q));

  // 하위 분류 목록 + 필터 칩
  const allSubs = [...new Set(DB.all("notes").filter(n => n.cat === curCat && n.sub).map(n => n.sub))].sort();
  const subFilter = state.noteSubFilter || "";
  const subChips = allSubs.length ? `<div class="note-sub-chips">
    <button class="note-sub-chip ${!subFilter?"on":""}" data-act="note-sub-filter" data-v="">전체</button>
    ${allSubs.map(s => `<button class="note-sub-chip ${subFilter===s?"on":""}" data-act="note-sub-filter" data-v="${esc(s)}">${esc(s)}</button>`).join("")}
    ${notes.some(n=>!n.sub) ? `<button class="note-sub-chip ${subFilter==="__none"?"on":""}" data-act="note-sub-filter" data-v="__none">미분류</button>` : ""}
  </div>` : "";

  // 필터 적용
  if (subFilter === "__none") notes = notes.filter(n => !n.sub);
  else if (subFilter) notes = notes.filter(n => n.sub === subFilter);

  notes.sort((a, b) => (b.pinned?1:0)-(a.pinned?1:0) || (a.order ?? 0)-(b.order ?? 0) || (b.createdAt||0)-(a.createdAt||0));

  const noteCard = (n) => `<div class="note-card ${n.pinned?"pinned":""}" draggable="true" data-note-id="${n.id}">
    <div class="note-card-head">
      <span class="note-drag-handle" title="드래그해서 순서 변경">⠿</span>
      ${n.pinned ? `<span class="note-pin">📍</span>` : ""}
      <div class="note-card-title">${esc(n.title||"제목 없음")}</div>
      ${n.sub ? `<span class="note-sub-badge">${esc(n.sub)}</span>` : ""}
      <div class="note-card-actions">
        <button class="icon-btn" data-act="note-pin" data-id="${n.id}" title="고정">${n.pinned?"📍":"📌"}</button>
        <button class="icon-btn" data-act="note-copy" data-id="${n.id}" title="복사">⧉</button>
        <button class="icon-btn" data-act="note-edit" data-id="${n.id}" title="수정">✎</button>
        <button class="icon-btn" style="color:#EF4444" data-act="note-del" data-id="${n.id}" title="삭제">✕</button>
      </div>
    </div>
    ${n.body ? `<div class="note-card-body">${esc(n.body).replace(/\n/g,"<br>")}</div>` : ""}
    <div class="note-card-date">${n.date || fmt(new Date(n.createdAt||Date.now()))}</div>
  </div>`;

  // 하위 분류별 그룹핑 (전체 필터일 때만)
  let listHtml;
  if (!notes.length) {
    listHtml = `<div class="empty" style="padding:40px 20px"><div class="big">${c.emoji}</div><h3>${esc(c.label)}이 비어있습니다</h3><p>${esc(c.desc||"+ 추가 버튼으로 작성하세요")}</p></div>`;
  } else if (!subFilter && allSubs.length) {
    // 그룹핑: 고정 → 각 하위 분류 → 미분류
    const pinned = notes.filter(n => n.pinned);
    const grouped = {};
    notes.filter(n => !n.pinned).forEach(n => {
      const key = n.sub || "__none";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(n);
    });
    const groupOrder = [...allSubs, "__none"];
    listHtml = (pinned.length ? `<div class="note-list">${pinned.map(noteCard).join("")}</div>` : "")
      + groupOrder.filter(k => grouped[k]).map(k => `<div class="note-group">
        <div class="note-group-head">${k === "__none" ? "📄 미분류" : "🏷 " + esc(k)} <span class="count">${grouped[k].length}</span></div>
        <div class="note-list">${grouped[k].map(noteCard).join("")}</div>
      </div>`).join("");
  } else {
    listHtml = `<div class="note-list">${notes.map(noteCard).join("")}</div>`;
  }

  return `${catTabs}${header}${searchBar}${subChips}${listHtml}`;
}

function wireNotes() {
  const qEl = $("#noteQuery");
  if (qEl) { let tm; qEl.oninput = e => { clearTimeout(tm); tm = setTimeout(() => { state.noteQuery = e.target.value; render(); const el = $("#noteQuery"); if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); } }, 200); }; }

  // 드래그 앤 드롭 순서 변경
  let dragId = null;
  $$(".note-card[data-note-id]").forEach(card => {
    card.addEventListener("dragstart", e => {
      if (e.target.closest("[data-act]")) { e.preventDefault(); return; }
      dragId = card.dataset.noteId;
      card.classList.add("note-dragging");
      e.dataTransfer.effectAllowed = "move";
    });
    card.addEventListener("dragend", () => {
      card.classList.remove("note-dragging");
      $$(".note-drop-over").forEach(c => c.classList.remove("note-drop-over"));
      dragId = null;
    });
    card.addEventListener("dragover", e => {
      e.preventDefault();
      $$(".note-drop-over").forEach(c => c.classList.remove("note-drop-over"));
      if (dragId && dragId !== card.dataset.noteId) card.classList.add("note-drop-over");
    });
    card.addEventListener("dragleave", () => card.classList.remove("note-drop-over"));
    card.addEventListener("drop", async e => {
      e.preventDefault();
      card.classList.remove("note-drop-over");
      const toId = card.dataset.noteId;
      if (!dragId || dragId === toId) return;
      // 현재 카테고리 노트만 재정렬
      const curCat = state.noteCat;
      const catNotes = DB.all("notes").filter(n => n.cat === curCat)
        .sort((a, b) => (a.order ?? 0)-(b.order ?? 0) || (b.createdAt||0)-(a.createdAt||0));
      const fromIdx = catNotes.findIndex(n => n.id === dragId);
      const toIdx = catNotes.findIndex(n => n.id === toId);
      if (fromIdx < 0 || toIdx < 0) return;
      const reordered = catNotes.slice();
      const [moved] = reordered.splice(fromIdx, 1);
      reordered.splice(toIdx, 0, moved);
      for (let i = 0; i < reordered.length; i++) {
        if (reordered[i].order !== i) await DB.set("notes", reordered[i].id, { ...reordered[i], order: i });
      }
      toast("순서를 변경했습니다."); render();
    });
  });
}

function noteEditModal(existing, catId) {
  const n = existing || { title: "", body: "", cat: catId || state.noteCat || "promise", sub: "" };
  let isNew = !existing;
  // 현재 카테고리에서 이미 쓰인 하위 분류 수집 (자동완성)
  const curCat = n.cat;
  const existingSubs = [...new Set(DB.all("notes").filter(x => x.cat === curCat && x.sub).map(x => x.sub))];
  const datalist = existingSubs.length ? `<datalist id="ntSubList">${existingSubs.map(s => `<option value="${esc(s)}">`).join("")}</datalist>` : "";
  openModal(`<div class="modal" style="max-width:520px">
    <div class="modal-head"><h3>${isNew?"새 노트":"노트 수정"}</h3><button class="icon-btn" data-act="close">✕</button></div>
    <div class="modal-body">
      <div class="mrow"><label>제목</label><div class="ctl"><input type="text" id="ntTitle" value="${esc(n.title||"")}" placeholder="제목" /></div></div>
      <div class="mrow"><label>하위 분류</label><div class="ctl">
        <input type="text" id="ntSub" value="${esc(n.sub||"")}" placeholder="예: 업무 / 인간관계 / 건강 (선택)" list="ntSubList" />
        ${datalist}
      </div></div>
      <div class="mrow" style="align-items:flex-start"><label style="padding-top:11px">내용</label><div class="ctl">
        <textarea id="ntBody" rows="7" placeholder="내용 (줄바꿈 가능)" style="resize:vertical;line-height:1.7">${esc(n.body||"")}</textarea>
      </div></div>
    </div>
    <div class="modal-foot">
      <button class="btn-cancel" data-act="close">취소</button>
      <button class="btn-ghost" id="ntSaveKeep" style="margin-right:auto">저장 (계속 쓰기)</button>
      <button class="btn-save" id="ntSave">저장</button>
    </div>
  </div>`);
  setTimeout(() => $("#ntTitle")?.focus(), 40);
  const ntDoSave = async (closeAfter) => {
    const title = $("#ntTitle").value.trim();
    const body = $("#ntBody").value;
    const sub = $("#ntSub").value.trim();
    if (!title && !body) { toast("제목이나 내용을 입력하세요."); return null; }
    let savedId;
    if (isNew && !existing) {
      savedId = uid();
      await DB.set("notes", savedId, { cat: n.cat, sub, title, body, date: todayStr(), pinned: false, createdAt: Date.now() });
    } else {
      savedId = existing.id;
      const cur = DB.get("notes", savedId) || existing;
      await DB.set("notes", savedId, { ...cur, title, body, sub });
    }
    toast(closeAfter ? (isNew?"추가했습니다.":"수정했습니다.") : "저장했습니다. 계속 작성하세요.");
    if (closeAfter) { closeModal(); render(); }
    return savedId;
  };
  $("#ntSave").onclick = () => ntDoSave(true);
  $("#ntSaveKeep").onclick = async () => {
    const id = await ntDoSave(false);
    if (id && isNew) { existing = DB.get("notes", id); isNew = false; }
  };
}

/* ============================================================
   마인드맵 — 자유 브레인스토밍용 독립 탭
============================================================ */
const MM_COLORS = ["#DC2626","#EA580C","#16A34A","#7C3AED","#0EA5E9","#DB2777","#0D9488","#4B5563"];
const MM_LEVEL_GAP = 40;   // 부모 오른쪽 끝 ~ 자식 왼쪽 시작 간격
const MM_LEAF_H = 34;      // 리프 노드 세로 간격
const MM_PAD = 40;

function mindmapRows() { return DB.all("mindmaps").sort((a,b) => (b.updatedAt||b.createdAt||0)-(a.updatedAt||a.createdAt||0)); }

function viewMindmap() {
  if (state.selMindmap) {
    const mm = DB.get("mindmaps", state.selMindmap);
    if (mm) return mindmapEditorView(mm);
    state.selMindmap = null;
  }
  return mindmapListView();
}

function mindmapListView() {
  const maps = mindmapRows();
  const addBtn = `<button class="add-grp" data-act="mm-new" style="margin:6px 0 18px">+ 새 마인드맵</button>`;
  if (!maps.length) return `${addBtn}<div class="empty" style="padding:44px 20px"><div class="big">🧠</div><h3>마인드맵이 없습니다</h3><p>아이디어를 자유롭게 뻗어나가며 정리해보세요.</p></div>`;

  const cards = maps.map(mm => {
    const cnt = (mm.nodes||[]).length;
    const updated = mm.updatedAt || mm.createdAt || Date.now();
    return `<div class="mm-list-card" data-act="mm-open" data-id="${mm.id}">
      <div class="mm-list-icon">🧠</div>
      <div class="mm-list-info">
        <div class="mm-list-title">${esc(mm.title || "제목 없는 마인드맵")}</div>
        <div class="mm-list-meta">노드 ${cnt}개 · ${relTime(updated)}</div>
      </div>
      <button class="icon-btn" style="color:#EF4444;opacity:1" data-act="mm-del" data-id="${mm.id}">✕</button>
    </div>`;
  }).join("");

  return `${addBtn}<div class="mm-list">${cards}</div>`;
}

function mmBuildTree(nodes) {
  const byParent = {};
  nodes.forEach(n => { const p = n.parentId || "__root__"; if (!byParent[p]) byParent[p] = []; byParent[p].push(n); });
  return byParent;
}

// 텍스트 폭 추정 (한글은 넓게, 영문/숫자는 좁게)
function mmTextWidth(text) {
  const s = (text || "").split("\n")[0]; // 첫 줄 기준
  let w = 0;
  for (const ch of s) w += /[가-힣]/.test(ch) ? 15.5 : 8.5;
  return Math.min(240, Math.max(28, Math.round(w) + 4));
}

// 가로형 트리 자동 레이아웃 — root 좌측, 자식이 우측으로 뻗어나감
function mmLayout(nodes) {
  const root = nodes.find(n => !n.parentId);
  const tree = mmBuildTree(nodes);
  const pos = {}; // id -> {x,y,w}
  let yCursor = MM_PAD;

  function place(node, xLeft) {
    const kids = tree[node.id] || [];
    const w = mmTextWidth(node.text);
    let y;
    if (!kids.length) {
      y = yCursor;
      yCursor += MM_LEAF_H;
    } else {
      const childX = xLeft + w + MM_LEVEL_GAP;
      const childYs = kids.map(k => place(k, childX));
      y = (childYs[0] + childYs[childYs.length - 1]) / 2;
    }
    pos[node.id] = { x: xLeft, y, w };
    return y;
  }
  if (root) place(root, MM_PAD);

  const maxX = Math.max(MM_PAD, ...Object.values(pos).map(p => p.x + p.w)) + MM_PAD;
  const maxY = Math.max(MM_PAD, yCursor) + MM_PAD;
  return { pos, w: maxX, h: maxY };
}

function mindmapEditorView(mm) {
  const nodes = mm.nodes || [];
  const { pos, w: canvasW, h: canvasH } = mmLayout(nodes);

  // 꺾은선(브라켓) 연결 — 부모별로 자식들 y 범위에 세로 스파인 + 가로 스텁
  const svgParts = [];
  const tree = mmBuildTree(nodes);
  nodes.forEach(n => {
    const kids = tree[n.id];
    if (!kids || !kids.length) return;
    const p = pos[n.id];
    const spineX = p.x + p.w + MM_LEVEL_GAP / 2;
    const color = n.color || "#94A3B8";
    // 부모 → 스파인 가로 스텁
    svgParts.push(`<path d="M${p.x+p.w},${p.y} H${spineX}" stroke="${color}" stroke-width="1.8" fill="none" opacity="0.75"/>`);
    const ys = kids.map(k => pos[k.id].y);
    if (kids.length > 1) {
      svgParts.push(`<path d="M${spineX},${Math.min(...ys)} V${Math.max(...ys)}" stroke="${color}" stroke-width="1.8" fill="none" opacity="0.75"/>`);
    }
    kids.forEach(k => {
      const kp = pos[k.id];
      const kColor = k.color || color;
      svgParts.push(`<path d="M${spineX},${kp.y} H${kp.x}" stroke="${kColor}" stroke-width="1.8" fill="none" opacity="0.75"/>`);
    });
  });

  const nodeHtml = nodes.map(n => {
    const isRoot = !n.parentId;
    const isSel = state.mmSelectedNode === n.id;
    const p = pos[n.id];
    const isDark = document.body.classList.contains("dark");
    const color = isRoot ? (isDark ? "#E8EAED" : "#1B1F24") : (n.color || (isDark ? "#C4C9D0" : "#374151"));
    return `<div class="mm-node ${isRoot?"mm-root":""} ${isSel?"mm-selected":""}"
      data-act="mm-node-select" data-id="${n.id}"
      style="left:${p.x}px;top:${p.y}px;color:${color};${isSel?`background:${color}18`:""}">
      ${esc(n.text || "")}
    </div>`;
  }).join("");

  const selectedNode = state.mmSelectedNode ? nodes.find(n => n.id === state.mmSelectedNode) : null;
  const zoomPct = Math.round((state.mmZoom || 1) * 100);

  const topbar = `<div class="mm-topbar">
    <button class="icon-btn" data-act="mm-back" title="목록으로">←</button>
    <div class="mm-title" data-act="mm-rename-map" data-id="${mm.id}">${esc(mm.title || "제목 없는 마인드맵")}</div>
    <div class="mm-zoom">
      <button class="icon-btn" data-act="mm-zoom-out">−</button>
      <span>${zoomPct}%</span>
      <button class="icon-btn" data-act="mm-zoom-in">+</button>
    </div>
    <button class="icon-btn" data-act="mm-export" data-id="${mm.id}" title="개요로 복사">⧉</button>
    <button class="icon-btn" style="color:#EF4444" data-act="mm-del" data-id="${mm.id}" title="삭제">🗑</button>
  </div>`;

  const bottomBar = selectedNode ? `<div class="mm-bottombar">
    <div class="mm-bb-label">${esc(selectedNode.text || "")}</div>
    <div class="mm-bb-actions">
      <button data-act="mm-node-add" data-id="${selectedNode.id}">+ 가지</button>
      <button data-act="mm-node-rename" data-id="${selectedNode.id}">✎ 이름</button>
      ${selectedNode.parentId ? `<button data-act="mm-node-color" data-id="${selectedNode.id}">🎨 색상</button>` : ""}
      ${selectedNode.parentId ? `<button data-act="mm-node-del" data-id="${selectedNode.id}" style="color:#EF4444">✕ 삭제</button>` : ""}
      <button data-act="mm-deselect">닫기</button>
    </div>
  </div>` : "";

  return `${topbar}
    <div class="mm-canvas-wrap" id="mmCanvasWrap">
      <div class="mm-canvas" id="mmCanvas" style="width:${canvasW}px;height:${canvasH}px;transform:scale(${state.mmZoom||1});transform-origin:0 0">
        <svg class="mm-svg" width="${canvasW}" height="${canvasH}">${svgParts.join("")}</svg>
        ${nodeHtml}
      </div>
    </div>
    ${bottomBar}`;
}

function wireMindmap() {
  if (!state.selMindmap) return;
  const mm = DB.get("mindmaps", state.selMindmap);
  if (!mm) return;
  const wrap = $("#mmCanvasWrap");
  if (!wrap) return;

  // 최초 진입 시 좌측이 보이도록 스크롤 초기화
  if (!state.mmScrolled) {
    wrap.scrollLeft = 0;
    wrap.scrollTop = 0;
    state.mmScrolled = true;
  }

  const canvas = $("#mmCanvas");
  if (canvas) canvas.addEventListener("pointerdown", e => {
    if (e.target === canvas) { state.mmSelectedNode = null; render(); }
  });
}

function mmRenameMapModal(id) {
  const mm = DB.get("mindmaps", id); if (!mm) return;
  openModal(`<div class="modal" style="max-width:400px">
    <div class="modal-head"><h3>마인드맵 이름</h3><button class="icon-btn" data-act="close">✕</button></div>
    <div class="modal-body"><div class="mrow"><label>제목</label><div class="ctl"><input type="text" id="mmTitleInput" value="${esc(mm.title||"")}" placeholder="마인드맵 제목" /></div></div></div>
    <div class="modal-foot"><button class="btn-cancel" data-act="close">취소</button><button class="btn-save" id="mmTitleSave">저장</button></div>
  </div>`);
  setTimeout(() => { const el = $("#mmTitleInput"); el?.focus(); el?.select(); }, 40);
  $("#mmTitleSave").onclick = async () => {
    const title = $("#mmTitleInput").value.trim() || "제목 없는 마인드맵";
    await DB.set("mindmaps", id, { ...mm, title, updatedAt: Date.now() });
    closeModal(); render();
  };
}

function mmRenameNodeModal(nodeId) {
  const mm = DB.get("mindmaps", state.selMindmap); if (!mm) return;
  const node = (mm.nodes||[]).find(n => n.id === nodeId); if (!node) return;
  openModal(`<div class="modal" style="max-width:400px">
    <div class="modal-head"><h3>노드 이름</h3><button class="icon-btn" data-act="close">✕</button></div>
    <div class="modal-body"><div class="mrow" style="align-items:flex-start"><label style="padding-top:11px">내용</label><div class="ctl">
      <textarea id="mmNodeInput" rows="3" style="resize:vertical">${esc(node.text||"")}</textarea>
    </div></div></div>
    <div class="modal-foot"><button class="btn-cancel" data-act="close">취소</button><button class="btn-save" id="mmNodeSave">저장</button></div>
  </div>`);
  setTimeout(() => { const el = $("#mmNodeInput"); el?.focus(); el?.select(); }, 40);
  $("#mmNodeSave").onclick = async () => {
    const text = $("#mmNodeInput").value.trim() || "새 항목";
    const nodes = mm.nodes.map(n => n.id === nodeId ? { ...n, text } : n);
    await DB.set("mindmaps", mm.id, { ...mm, nodes, updatedAt: Date.now() });
    closeModal(); render();
  };
}

function mmColorModal(nodeId) {
  const mm = DB.get("mindmaps", state.selMindmap); if (!mm) return;
  const node = (mm.nodes||[]).find(n => n.id === nodeId); if (!node) return;
  openModal(`<div class="modal" style="max-width:340px">
    <div class="modal-head"><h3>노드 색상</h3><button class="icon-btn" data-act="close">✕</button></div>
    <div class="modal-body"><div class="mm-color-grid">
      ${MM_COLORS.map(c => `<button class="mm-color-dot ${node.color===c?"on":""}" style="background:${c}" data-act="mm-color-pick" data-id="${nodeId}" data-color="${c}"></button>`).join("")}
    </div></div>
  </div>`);
}

/* 마인드맵 개요 텍스트 생성 (내보내기용) */
function mmOutlineText(mm) {
  const nodes = mm.nodes || [];
  const tree = mmBuildTree(nodes);
  const lines = [];
  const walk = (node, depth) => {
    lines.push("  ".repeat(depth) + (depth>0?"- ":"") + (node.text||""));
    (tree[node.id]||[]).forEach(c => walk(c, depth+1));
  };
  const root = nodes.find(n => !n.parentId);
  if (root) walk(root, 0);
  return lines.join("\n");
}

function viewWorkout() {
  const sub = state.fitSub || "workout";
  const tabs = `<div class="hview-tabs" style="margin-bottom:16px">
    <button class="hvt ${sub === "workout" ? "on" : ""}" data-act="fitsub" data-v="workout">운동 기록</button>
    <button class="hvt ${sub === "weight" ? "on" : ""}" data-act="fitsub" data-v="weight">몸무게</button>
    <button class="hvt ${sub === "bodycomp" ? "on" : ""}" data-act="fitsub" data-v="bodycomp">체성분 분석</button>
  </div>`;
  if (sub === "weight") return tabs + weightSection();
  if (sub === "bodycomp") return tabs + bodycompSection();
  // 운동 기록: 좌우 분할
  const panel = state.selWorkout ? workoutDetailPanel(state.selWorkout) : `<div class="td-empty-panel"><div class="empty-icon">🗓️</div><p>왼쪽에서 세션을 선택하면<br>기록과 통계가 여기에 표시됩니다.</p></div>`;
  return `${tabs}<div class="td-split"><div class="td-left">${workoutSection()}</div><div class="td-right">${panel}</div></div>`;
}

function workoutSection() {
  const allRows = workoutRows();
  const tstr = todayStr();
  const q = (state.wkQuery || "").toLowerCase().trim();
  const fFrom = state.wkFrom || "", fTo = state.wkTo || "";

  let rows = allRows.filter(w => {
    if (fFrom && (w.date || "") < fFrom) return false;
    if (fTo && (w.date || "") > fTo) return false;
    if (q) {
      const hay = ((w.type || "") + " " + (w.memo || "") + " " + (w.date || "") + " " +
        (w.exercises || []).map(e => e.name).join(" ")).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  const filtered = q || fFrom || fTo;

  const weekAgo = fmt(addDays(today(), -6));
  const monthPrefix = tstr.slice(0, 7);
  const weekSessions = allRows.filter(r => r.date >= weekAgo && r.date <= tstr).length;
  const monthSessions = allRows.filter(r => (r.date || "").startsWith(monthPrefix)).length;
  const totalVolume = allRows.reduce((sum, r) => sum + (r.exercises || []).reduce((s, e) =>
    s + (e.sets || []).reduce((ss, st) => ss + (Number(st.kg)||0)*(Number(st.reps)||0), 0), 0), 0);

  const stat = `<div class="stat-grid" style="grid-template-columns:repeat(3,1fr)">
    <div class="stat"><div class="lb">🗓️ 이번 주 세션</div><div class="vl">${weekSessions}<small>회</small></div></div>
    <div class="stat"><div class="lb">📅 이번 달 세션</div><div class="vl">${monthSessions}<small>회</small></div></div>
    <div class="stat"><div class="lb">🏋️ 누적 볼륨</div><div class="vl">${Math.round(totalVolume).toLocaleString()}<small>kg</small></div></div>
  </div>`;

  const filterBar = `<div class="wk-filter">
    <div class="wk-search">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
      <input type="text" id="wkQuery" placeholder="종목·부위·메모 검색" value="${esc(state.wkQuery || "")}" />
    </div>
    <div class="wk-daterange">
      <input type="date" id="wkFrom" value="${fFrom}" max="${tstr}" />
      <span>~</span>
      <input type="date" id="wkTo" value="${fTo}" max="${tstr}" />
    </div>
    ${filtered ? `<button class="btn-ghost" data-act="wk-clear">초기화</button>` : ""}
  </div>`;

  const addBtn = `<button class="add-grp" data-act="wk-new" style="margin:6px 0 16px">+ 운동 세션 추가</button>`;

  if (!rows.length) {
    const empty = filtered
      ? `<div class="empty" style="padding:40px 20px"><div class="big">🔍</div><h3>검색 결과가 없습니다</h3></div>`
      : `<div class="empty" style="padding:44px 20px"><div class="big">💪</div><h3>운동 기록이 없습니다</h3><p>세션을 추가해 종목·세트·중량을 기록하세요.</p></div>`;
    return `${stat}${filterBar}${addBtn}${empty}`;
  }

  // 날짜별 그룹핑
  const byDate = {};
  rows.forEach(w => { if (!byDate[w.date]) byDate[w.date] = []; byDate[w.date].push(w); });
  const dates = Object.keys(byDate).sort((a,b) => b.localeCompare(a));

  const list = dates.map(date => {
    const sessions = byDate[date];
    const dow = DOW[parseD(date).getDay()];
    const isToday = date === tstr;
    const totalEx = sessions.reduce((s, w) => s + (w.exercises||[]).length, 0);
    const totalVol = sessions.reduce((s, w) => s +
      (w.exercises||[]).reduce((ss,e) =>
        ss + (e.sets||[]).reduce((sss,st) => sss+(Number(st.kg)||0)*(Number(st.reps)||0),0),0),0);

    const sessionCards = sessions.map(w => {
      const collapsed = state.collapsedTodos?.[`wk_${w.id}`];

      const exItems = (w.exercises||[]).map(e => {
        if (e.cardio) {
          const segs = (e.cardioSets||[]).map(cs => {
            const p = [];
            if (cs.dist) p.push(`${cs.dist}km`);
            if (cs.time) p.push(`${cs.time}분`);
            if (cs.speed) p.push(`${cs.speed}km/h`);
            return p.join("/");
          }).join(" · ");
          return `<div class="wk-sub-item">
            <span class="wk-sub-dot" style="background:#F97316"></span>
            <span class="wk-sub-name">🏃 ${esc(e.name||"유산소")}</span>
            <span class="wk-sub-detail" style="color:#C2410C">${segs||"-"}</span>
          </div>`;
        }
        const vol = (e.sets||[]).reduce((s,st)=>s+(Number(st.kg)||0)*(Number(st.reps)||0),0);
        const sets = (e.sets||[]).map(st=>`${st.kg||0}×${st.reps||0}`).join(" · ");
        return `<div class="wk-sub-item">
          <span class="wk-sub-dot"></span>
          <span class="wk-sub-name">${esc(e.name||"운동")}</span>
          <span class="wk-sub-detail">${sets||"-"}${vol?` <small>(${vol}kg)</small>`:""}</span>
        </div>`;
      }).join("");

      return `<div class="wk-session-row ${state.selWorkout === w.id ? "sel" : ""}">
        <div class="wk-session-head" data-act="wk-open" data-id="${w.id}" style="cursor:pointer">
          <span class="wk-session-tag">${w.type ? esc(w.type) : "웨이트"}${w.duration ? " · "+esc(w.duration) : ""}</span>
          <span class="wk-session-ex-cnt">${(w.exercises||[]).length}종목</span>
          <div style="margin-left:auto;display:flex;gap:3px">
            <button class="icon-btn" style="width:26px;height:26px;opacity:1" data-act="wk-copy" data-id="${w.id}">⧉</button>
            <button class="icon-btn" style="width:26px;height:26px;opacity:1" data-act="wk-edit" data-id="${w.id}">✎</button>
            <button class="icon-btn" style="width:26px;height:26px;opacity:1;color:#EF4444" data-act="wk-del" data-id="${w.id}">✕</button>
          </div>
          <button class="collapse-btn ${collapsed?"":"open"}" data-act="wk-collapse" data-id="${w.id}">▾</button>
        </div>
        ${!collapsed ? `<div class="wk-sub-list">${exItems}${w.memo?`<div class="wk-memo" style="margin-top:8px;white-space:pre-wrap">${esc(w.memo)}</div>`:""}</div>` : ""}
      </div>`;
    }).join("");

    return `<div class="wk-date-group">
      <div class="wk-date-head ${isToday?"today":""}">
        <span class="wk-date-label">${isToday?"오늘 · ":""}${date} <span class="w-dow">(${dow})</span></span>
        <span class="wk-date-meta">${sessions.length}세션 · ${totalEx}종목${totalVol?` · ${Math.round(totalVol).toLocaleString()}kg`:""}</span>
        <button class="btn-ghost" data-act="wk-new-date" data-date="${date}" style="padding:3px 10px;font-size:12px;margin-left:auto">+ 추가</button>
      </div>
      ${sessionCards}
    </div>`;
  }).join("");

  return `${stat}${filterBar}${addBtn}<div class="grp-title">세션 <span class="count">${rows.length}${filtered?` / ${allRows.length}`:""}</span></div>${list}`;
}

/* 운동 세션 상세 패널 */
function workoutDetailPanel(wid) {
  const w = DB.get("workouts", wid);
  if (!w) return `<div class="td-empty-panel"><p>세션을 찾을 수 없습니다.</p></div>`;
  const dow = DOW[parseD(w.date).getDay()];

  // 대분류(exercises)별 렌더
  const groups = (w.exercises || []).map((e, ei) => {
    const isCardio = e.cardio || false;
    const items = isCardio
      ? (e.cardioSets || []).map((cs, si) => {
          const parts = [];
          if (cs.dist) parts.push(`${cs.dist}km`);
          if (cs.time) parts.push(`${cs.time}분`);
          if (cs.speed) parts.push(`${cs.speed}km/h`);
          return `<div class="wkd-item">
            <div class="wkd-item-check" style="background:#FED7AA"></div>
            <span class="wkd-item-text">${parts.join(" / ") || "구간 " + (si+1)}</span>
            <button class="sub-x" data-act="wkd-seg-del" data-wid="${wid}" data-ei="${ei}" data-si="${si}">✕</button>
          </div>`;
        }).join("")
      : (e.sets || []).map((st, si) => `<div class="wkd-item">
          <div class="wkd-item-check"></div>
          <input class="wkd-kg" type="number" value="${st.kg||""}" placeholder="kg" data-act="wkd-set-kg" data-wid="${wid}" data-ei="${ei}" data-si="${si}" />
          <span style="color:#9CA3AF;font-size:13px">×</span>
          <input class="wkd-reps" type="number" value="${st.reps||""}" placeholder="회" data-act="wkd-set-reps" data-wid="${wid}" data-ei="${ei}" data-si="${si}" />
          <button class="sub-x" data-act="wkd-set-del" data-wid="${wid}" data-ei="${ei}" data-si="${si}">✕</button>
        </div>`).join("");

    const total = isCardio
      ? (e.cardioSets||[]).reduce((s,cs)=>s+(Number(cs.time)||0),0)
      : (e.sets||[]).reduce((s,st)=>s+(Number(st.kg)||0)*(Number(st.reps)||0),0);

    return `<div class="wkd-group">
      <div class="wkd-group-head">
        <span class="wkd-group-icon">${isCardio?"🏃":"🏋️"}</span>
        <input class="wkd-ex-name" value="${esc(e.name||"")}" placeholder="종목명" data-act="wkd-ex-name" data-wid="${wid}" data-ei="${ei}" />
        <span class="wkd-group-vol">${total ? (isCardio ? total+"분" : total+"kg") : ""}</span>
        <button class="sub-x" data-act="wkd-ex-del" data-wid="${wid}" data-ei="${ei}">✕</button>
      </div>
      <div class="wkd-items">${items}</div>
      <button class="add-grp" style="margin-top:4px;font-size:12px" data-act="wkd-set-add" data-wid="${wid}" data-ei="${ei}">+ ${isCardio?"구간":"세트"} 추가</button>
    </div>`;
  }).join("");

  return `<div class="wkd-panel">
    <div class="wkd-head">
      <div class="wkd-title">
        <input class="wkd-date" type="date" value="${w.date}" data-act="wkd-field" data-f="date" data-wid="${wid}" />
        <span class="w-dow">${dow}</span>
      </div>
      <button class="icon-btn" style="margin-left:auto;font-size:18px;width:32px;height:32px" data-act="wk-open" data-id="">✕</button>
    </div>

    <div class="wkd-row">
      <label>부위/타입</label>
      <input type="text" class="wkd-input" value="${esc(w.type||"")}" placeholder="예: 가슴·삼두" data-act="wkd-field" data-f="type" data-wid="${wid}" />
    </div>
    <div class="wkd-row">
      <label>시간</label>
      <input type="text" class="wkd-input" value="${esc(w.duration||"")}" placeholder="예: 90분" data-act="wkd-field" data-f="duration" data-wid="${wid}" />
    </div>

    <div class="wkd-section-title">해야 할 운동</div>
    <div id="wkdGroups">${groups}</div>

    <div style="display:flex;gap:8px;margin-top:8px">
      <button class="add-grp" style="flex:1" data-act="wkd-ex-add" data-wid="${wid}" data-cardio="0">+ 웨이트 추가</button>
      <button class="add-grp" style="flex:1" data-act="wkd-ex-add" data-wid="${wid}" data-cardio="1">+ 유산소 추가</button>
    </div>

    <div class="wkd-section-title" style="margin-top:18px">메모</div>
    <textarea class="wkd-memo" rows="3" placeholder="컨디션, 느낀 점…" data-act="wkd-field" data-f="memo" data-wid="${wid}">${esc(w.memo||"")}</textarea>
  </div>`;
}

/* 운동 상세 패널 자동저장 wire */
function wireWorkout() {
  const sub = state.fitSub || "workout";
  if (sub === "weight") { wireWeight(); return; }
  if (sub === "bodycomp") {
    const fileInput = $("#bcFileInput");
    if (fileInput) {
      fileInput.onchange = e => {
        const files = e.target.files;
        if (files && files.length) analyzeBodycomp(files);
      };
    }
    // 드래그 앤 드롭
    const area = $("#bcUploadArea");
    if (area) {
      area.addEventListener("dragover", e => { e.preventDefault(); area.classList.add("bc-drag"); });
      area.addEventListener("dragleave", () => area.classList.remove("bc-drag"));
      area.addEventListener("drop", e => {
        e.preventDefault(); area.classList.remove("bc-drag");
        const files = e.dataTransfer.files;
        if (files && files.length) analyzeBodycomp(files);
      });
    }
    return;
  }
  const qEl = $("#wkQuery");
  if (qEl) {
    let tm;
    qEl.oninput = e => { clearTimeout(tm); tm = setTimeout(() => { state.wkQuery = e.target.value; render(); const el = $("#wkQuery"); if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); } }, 200); };
  }
  const fromEl = $("#wkFrom"), toEl = $("#wkTo");
  if (fromEl) fromEl.onchange = e => { state.wkFrom = e.target.value; render(); };
  if (toEl) toEl.onchange = e => { state.wkTo = e.target.value; render(); };
}

/* ============================================================
   체성분 분석 탭
============================================================ */
function bodycompRows() {
  return DB.all("bodycomp").sort((a, b) => (a.date||"").localeCompare(b.date||"") || (a.createdAt||0)-(b.createdAt||0));
}

function bodycompSection() {
  const rows = bodycompRows().slice().reverse();
  const latest = rows[0];
  const prev = rows[1];

  // 비교 델타 계산
  function delta(field) {
    if (!latest || !prev || latest[field] == null || prev[field] == null) return null;
    return Number(latest[field]) - Number(prev[field]);
  }
  function deltaHtml(field, unit = "kg", goodDown = true) {
    const d = delta(field);
    if (d == null) return "";
    const good = goodDown ? d < 0 : d > 0;
    const c = d === 0 ? "#9CA3AF" : good ? "#22C55E" : "#EF4444";
    const arrow = d > 0 ? "▲" : d < 0 ? "▼" : "–";
    return `<span style="color:${c};font-size:12px;font-weight:700;margin-left:6px">${arrow}${Math.abs(d).toFixed(1)}${unit}</span>`;
  }

  // 필드 정의
  const fields = [
    { key: "weight",     label: "체중",         unit: "kg",     goodDown: true },
    { key: "muscle",     label: "골격근량",      unit: "kg",     goodDown: false },
    { key: "fat",        label: "체지방량",      unit: "kg",     goodDown: true },
    { key: "fatRate",    label: "체지방률",      unit: "%",      goodDown: true },
    { key: "bmi",        label: "BMI",          unit: "kg/m²",  goodDown: true },
    { key: "water",      label: "체수분",        unit: "L",      goodDown: false },
    { key: "waist",      label: "허리둘레",      unit: "cm",     goodDown: true },
    { key: "visceralFat",label: "내장지방량",    unit: "kg",     goodDown: true },
    { key: "bmi_score",  label: "비만도",        unit: "%",      goodDown: true },
    { key: "bodyAge",    label: "신체연령",      unit: "세",     goodDown: true },
    { key: "bmr",        label: "기초대사량",    unit: "kcal",   goodDown: false },
    { key: "totalScore", label: "종합평점",      unit: "점",     goodDown: false },
  ];

  const latestCard = latest ? `<div class="bc-latest">
    <div class="bc-latest-head">
      <div>
        <div class="bc-latest-date">${latest.date} 측정</div>
        ${latest.bodyType ? `<div class="bc-body-type">${esc(latest.bodyType)}</div>` : ""}
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        ${prev ? `<div class="bc-vs-badge">vs 이전 측정 비교 중</div>` : ""}
        <button class="sub-x" data-act="bc-del" data-id="${latest.id}" title="삭제" style="width:28px;height:28px;font-size:15px">✕</button>
      </div>
    </div>
    <div class="bc-fields">
      ${fields.filter(f => latest[f.key] != null).map(f => `
        <div class="bc-field">
          <div class="bc-field-label">${f.label}</div>
          <div class="bc-field-val">${latest[f.key]}<small>${f.unit}</small>${deltaHtml(f.key, f.unit, f.goodDown)}</div>
        </div>`).join("")}
    </div>
    ${latest.memo ? `<div class="bc-memo">${esc(latest.memo)}</div>` : ""}
  </div>` : "";

  // 히스토리
  const histList = rows.length ? rows.map((r, i) => {
    const nextR = rows[i+1];
    const wDelta = (nextR && r.weight != null && nextR.weight != null) ? (Number(r.weight) - Number(nextR.weight)) : null;
    return `<div class="bc-hist-row">
      <div class="bc-hist-date">${r.date}</div>
      <div class="bc-hist-vals">
        ${r.weight!=null ? `<span>⚖️ ${r.weight}kg${wDelta!=null?` <span style="color:${wDelta<0?"#EF4444":wDelta>0?"#22C55E":"#9CA3AF"};font-size:11px">(${wDelta>0?"+":""}${wDelta.toFixed(1)})</span>`:""}</span>` : ""}
        ${r.fat!=null ? `<span>🔴 지방 ${r.fat}kg</span>` : ""}
        ${r.muscle!=null ? `<span>💪 근육 ${r.muscle}kg</span>` : ""}
        ${r.fatRate!=null ? `<span>📊 체지방률 ${r.fatRate}%</span>` : ""}
        ${r.bodyType ? `<span class="bc-type-chip">${esc(r.bodyType)}</span>` : ""}
      </div>
      <button class="sub-x" data-act="bc-del" data-id="${r.id}">✕</button>
    </div>`;
  }).join("") : "";

  return `
  <!-- 업로드 영역 -->
  <div class="bc-upload-area" id="bcUploadArea">
    <div class="bc-upload-inner">
      <div class="bc-upload-icon">📷</div>
      <div class="bc-upload-title">체성분 측정 결과 사진 업로드</div>
      <div class="bc-upload-desc">사진을 올리면 AI가 수치를 자동으로 읽어 기록합니다<br>체성분계 앱 캡처, 병원 측정지 사진 모두 가능</div>
      <label class="btn-save" style="cursor:pointer;display:inline-block;margin-top:12px;padding:10px 22px">
        📤 사진 선택
        <input type="file" id="bcFileInput" accept="image/*" style="display:none" multiple />
      </label>
    </div>
  </div>
  <div id="bcAnalyzing" style="display:none" class="bc-analyzing">
    <div class="bc-spin">⏳</div> AI가 체성분 수치를 분석 중입니다…
  </div>

  <!-- 최신 측정 결과 -->
  ${latestCard || `<div class="empty" style="padding:36px 20px"><div class="big">📊</div><h3>측정 기록이 없습니다</h3><p>체성분계 결과 사진을 올리면 자동으로 분석해 기록합니다.</p></div>`}

  <!-- 히스토리 -->
  ${rows.length > 1 ? `<div class="grp-title" style="margin-top:22px">측정 히스토리 <span class="count">${rows.length}</span></div>
  <div class="bc-hist-list">${histList}</div>` : ""}`;
}

/* AI 체성분 사진 분석 */
async function analyzeBodycomp(files) {
  const statusEl = $("#bcAnalyzing");
  if (statusEl) statusEl.style.display = "flex";

  // 이미지를 canvas로 압축 후 base64로 변환
  const images = await Promise.all(Array.from(files).map(f => new Promise((res, rej) => {
    const img = new Image();
    const url = URL.createObjectURL(f);
    img.onload = () => {
      // 최대 1024px로 리사이즈
      const MAX = 1024;
      let w = img.width, h = img.height;
      if (w > MAX || h > MAX) {
        if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
        else { w = Math.round(w * MAX / h); h = MAX; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      const base64 = canvas.toDataURL("image/jpeg", 0.8).split(",")[1];
      URL.revokeObjectURL(url);
      res({ base64, type: "image/jpeg" });
    };
    img.onerror = () => rej(new Error("이미지 로드 실패"));
    img.src = url;
  })));

  const imageContent = images.map(img => ({
    type: "image",
    source: { type: "base64", media_type: img.type, data: img.base64 }
  }));

  const prompt = `이 체성분 측정 결과 사진에서 수치를 읽어서 JSON으로만 반환하세요. 다른 텍스트 없이 JSON만 반환하세요.

추출할 필드 (없으면 null):
{
  "date": "YYYY-MM-DD (측정일이 있으면, 없으면 null)",
  "weight": 체중(kg, 숫자),
  "muscle": 골격근량(kg, 숫자),
  "fat": 체지방량(kg, 숫자),
  "fatRate": 체지방률(%, 숫자),
  "bmi": BMI(숫자),
  "water": 체수분(L, 숫자),
  "waist": 허리둘레(cm, 숫자),
  "visceralFat": 내장지방량(kg, 숫자),
  "bmi_score": 비만도(%, 숫자, +는 양수로),
  "bodyAge": 신체연령(세, 숫자),
  "bmr": 기초대사량(kcal, 숫자),
  "totalScore": 종합평점(점, 숫자),
  "bodyType": "체형판정 텍스트(예: 비만, 표준 등)"
}`;

  try {
    const proxyUrl = window.__ANTHROPIC_PROXY__ || "https://api.anthropic.com/v1/messages";
    const headers = window.__ANTHROPIC_PROXY__
      ? { "Content-Type": "application/json" }
      : { "Content-Type": "application/json", "x-api-key": "", "anthropic-version": "2023-06-01" };

    const resp = await fetch(proxyUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        messages: [{ role: "user", content: [...imageContent, { type: "text", text: prompt }] }]
      })
    });

    const data = await resp.json();
    const text = (data.content || []).map(c => c.text || "").join("");
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    // 저장
    const id = uid();
    const saveDate = parsed.date || todayStr();
    const record = { id, date: saveDate, createdAt: Date.now(), ...parsed };
    delete record.date; record.date = saveDate;
    await DB.set("bodycomp", id, record);
    await DB.log("create", `체성분 분석 저장 (${saveDate})`);

    // 이전 기록과 비교 토스트
    const rows = bodycompRows();
    const prev = rows.length >= 2 ? rows[rows.length - 2] : null;
    if (prev && parsed.weight != null && prev.weight != null) {
      const diff = (Number(parsed.weight) - Number(prev.weight)).toFixed(1);
      toast(`분석 완료! 체중 ${parsed.weight}kg (이전 대비 ${diff > 0 ? "+" : ""}${diff}kg)`);
    } else {
      toast("체성분 분석이 완료됐습니다!");
    }
    state.fitSub = "bodycomp";
    render();
  } catch (e) {
    console.error(e);
    toast("분석에 실패했습니다. API 연결을 확인하세요.");
  } finally {
    if (statusEl) statusEl.style.display = "none";
  }
}
/* 유산소 종목 자동 감지 */
const CARDIO_KEYWORDS = ["달리기","런닝","러닝","뛰기","걷기","조깅","자전거","사이클","수영","줄넘기","계단","로잉","rowing","run","walk","bike","swim","km","cardio","유산소","인터벌","트레드밀","일립티컬","스텝퍼","클라이밍"];
function isCardio(name) {
  const n = (name || "").toLowerCase();
  return CARDIO_KEYWORDS.some(k => n.includes(k.toLowerCase()));
}

function workoutModal(existing) {
  // 기존 세션의 종목도 이름 기반으로 cardio 자동 보정
  const fixedExercises = (existing?.exercises || []).map(e => ({
    ...e,
    cardio: e.cardio ?? isCardio(e.name),
    cardioSets: e.cardioSets?.length ? e.cardioSets : (e.cardio || isCardio(e.name)) ? [{ dist: "", time: "", speed: "" }] : undefined,
    sets: e.sets?.length ? e.sets : (!e.cardio && !isCardio(e.name)) ? [{ kg: "", reps: "" }] : []
  }));
  const w = existing
    ? { ...existing, exercises: fixedExercises }
    : { date: todayStr(), type: "", duration: "", memo: "", exercises: [{ name: "", sets: [{ kg: "", reps: "" }] }] };

  // 유산소 세트 렌더
  const cardioSetHtml = (e, ei) => {
    const cardioSets = (e.cardioSets || [{ dist: "", time: "", speed: "" }]);
    return `<div class="wm-cardio-sets" data-ei="${ei}">
      ${cardioSets.map((cs, si) => `
        <div class="wm-cardio-set" data-ei="${ei}" data-si="${si}">
          <div class="wm-cardio-field">
            <label>거리</label>
            <div class="wm-cardio-input"><input type="number" class="wm-dist" value="${cs.dist??""}" placeholder="5.0" step="0.1" data-ei="${ei}" data-si="${si}" /><span>km</span></div>
          </div>
          <div class="wm-cardio-field">
            <label>시간</label>
            <div class="wm-cardio-input"><input type="number" class="wm-time" value="${cs.time??""}" placeholder="30" data-ei="${ei}" data-si="${si}" /><span>분</span></div>
          </div>
          <div class="wm-cardio-field">
            <label>속도</label>
            <div class="wm-cardio-input"><input type="number" class="wm-speed" value="${cs.speed??""}" placeholder="7.0" step="0.1" data-ei="${ei}" data-si="${si}" /><span>km/h</span></div>
          </div>
          <button class="sub-x" data-act="wm-cardio-del" data-ei="${ei}" data-si="${si}">✕</button>
        </div>`).join("")}
      <button class="add-sub" data-act="wm-cardio-add" data-ei="${ei}">+ 구간 추가</button>
    </div>`;
  };

  // 웨이트 세트 렌더
  const weightSetHtml = (e, ei) => {
    return `<div class="wm-sets" data-ei="${ei}">
      ${(e.sets || []).map((st, si) => `
        <div class="wm-set" data-ei="${ei}" data-si="${si}">
          <input type="number" class="wm-kg" value="${st.kg??""}" placeholder="kg" step="0.5" data-ei="${ei}" data-si="${si}" />
          <span>×</span>
          <input type="number" class="wm-reps" value="${st.reps??""}" placeholder="회" data-ei="${ei}" data-si="${si}" />
          <button class="sub-x" data-act="wm-set-del" data-ei="${ei}" data-si="${si}">✕</button>
        </div>`).join("")}
      <button class="add-sub" data-act="wm-set-add" data-ei="${ei}">+ 세트</button>
    </div>`;
  };

  const exHtml = (ex) => ex.map((e, ei) => {
    const cardio = e.cardio || isCardio(e.name);
    return `<div class="wm-ex" data-ei="${ei}" data-cardio="${cardio ? 1 : 0}">
      <div class="wm-ex-top">
        <input type="text" class="wm-name" value="${esc(e.name)}" placeholder="종목 (예: 벤치프레스, 5km 달리기)" data-ei="${ei}" />
        <button class="sub-x" data-act="wm-ex-del" data-ei="${ei}">✕</button>
      </div>
      <div class="wm-type-toggle">
        <button class="wm-type-btn ${!cardio?"on":""}" data-act="wm-toggle-weight" data-ei="${ei}">🏋️ 웨이트</button>
        <button class="wm-type-btn ${cardio?"on":""}" data-act="wm-toggle-cardio" data-ei="${ei}">🏃 유산소</button>
      </div>
      ${cardio ? cardioSetHtml(e, ei) : weightSetHtml(e, ei)}
    </div>`;
  }).join("");

  openModal(`<div class="modal" style="max-width:560px">
    <div class="modal-head"><h3>${existing ? "운동 세션 수정" : "운동 세션 추가"}</h3><button class="icon-btn" data-act="close">✕</button></div>
    <div class="modal-body">
      <div class="mrow"><label>날짜</label><div class="ctl"><input type="date" id="wmDate" value="${w.date}" /></div></div>
      <div class="mrow"><label>부위/종류</label><div class="ctl"><input type="text" id="wmType" value="${esc(w.type)}" placeholder="예: 등·이두 / 유산소" /></div></div>
      <div class="mrow"><label>총 시간</label><div class="ctl"><input type="text" id="wmDuration" value="${esc(w.duration)}" placeholder="예: 60분" /></div></div>
      <div class="mdivider"></div>
      <div id="wmExList">${exHtml(w.exercises || [])}</div>
      <button class="add-grp" data-act="wm-ex-add" style="margin-top:4px">+ 종목 추가</button>
      <div class="mrow" style="align-items:flex-start;margin-top:14px"><label style="padding-top:11px">메모</label><div class="ctl"><textarea id="wmMemo" placeholder="컨디션, 느낀 점">${esc(w.memo)}</textarea></div></div>
    </div>
    <div class="modal-foot"><button class="btn-cancel" data-act="close">취소</button><button class="btn-save" id="wmSave">저장</button></div>
  </div>`);

  // 현재 폼 수집
  const collect = () => {
    const exs = [];
    $$("#wmExList .wm-ex").forEach(exEl => {
      const ei = +exEl.dataset.ei;
      const name = exEl.querySelector(".wm-name").value;
      const cardio = exEl.dataset.cardio === "1";
      if (cardio) {
        const cardioSets = [];
        exEl.querySelectorAll(".wm-cardio-set").forEach(cs => {
          cardioSets.push({ dist: cs.querySelector(".wm-dist")?.value, time: cs.querySelector(".wm-time")?.value, speed: cs.querySelector(".wm-speed")?.value });
        });
        exs.push({ name, cardio: true, cardioSets, sets: [] });
      } else {
        const sets = [];
        exEl.querySelectorAll(".wm-set").forEach(setEl => {
          sets.push({ kg: setEl.querySelector(".wm-kg")?.value || "", reps: setEl.querySelector(".wm-reps")?.value || "" });
        });
        exs.push({ name, cardio: false, sets });
      }
    });
    return exs;
  };

  let draft = { exercises: JSON.parse(JSON.stringify(w.exercises || [])) };
  const rerender = () => { $("#wmExList").innerHTML = exHtml(draft.exercises); };

  $(".modal-body").addEventListener("click", ev => {
    const b = ev.target.closest("[data-act]"); if (!b) return;
    const a = b.dataset.act, ei = +b.dataset.ei, si = +b.dataset.si;
    if (a === "wm-ex-add") { draft.exercises = collect(); draft.exercises.push({ name: "", sets: [{ kg: "", reps: "" }] }); rerender(); }
    else if (a === "wm-ex-del") { draft.exercises = collect(); draft.exercises.splice(ei, 1); if (!draft.exercises.length) draft.exercises.push({ name: "", sets: [{ kg: "", reps: "" }] }); rerender(); }
    else if (a === "wm-set-add") { draft.exercises = collect(); (draft.exercises[ei].sets ||= []).push({ kg: "", reps: "" }); rerender(); }
    else if (a === "wm-set-del") { draft.exercises = collect(); draft.exercises[ei].sets.splice(si, 1); rerender(); }
    else if (a === "wm-cardio-add") { draft.exercises = collect(); (draft.exercises[ei].cardioSets ||= []).push({ dist: "", time: "", speed: "" }); rerender(); }
    else if (a === "wm-cardio-del") { draft.exercises = collect(); draft.exercises[ei].cardioSets.splice(si, 1); rerender(); }
    else if (a === "wm-toggle-weight") { draft.exercises = collect(); draft.exercises[ei].cardio = false; draft.exercises[ei].cardioSets = []; if (!draft.exercises[ei].sets?.length) draft.exercises[ei].sets = [{ kg: "", reps: "" }]; rerender(); }
    else if (a === "wm-toggle-cardio") { draft.exercises = collect(); draft.exercises[ei].cardio = true; if (!draft.exercises[ei].cardioSets?.length) draft.exercises[ei].cardioSets = [{ dist: "", time: "", speed: "" }]; rerender(); }
  });

  // 종목명 입력 시 유산소 자동 감지
  $(".modal-body").addEventListener("input", ev => {
    const inp = ev.target.closest(".wm-name"); if (!inp) return;
    const ei = +inp.dataset.ei;
    const exEl = $(`#wmExList .wm-ex[data-ei="${ei}"]`);
    if (!exEl) return;
    const nowCardio = isCardio(inp.value);
    const wasCardio = exEl.dataset.cardio === "1";
    if (nowCardio !== wasCardio) {
      draft.exercises = collect();
      draft.exercises[ei].cardio = nowCardio;
      if (nowCardio && !draft.exercises[ei].cardioSets?.length) draft.exercises[ei].cardioSets = [{ dist: "", time: "", speed: "" }];
      if (!nowCardio && !draft.exercises[ei].sets?.length) draft.exercises[ei].sets = [{ kg: "", reps: "" }];
      rerender();
    }
  });

  $("#wmSave").onclick = async () => {
    const date = $("#wmDate").value;
    if (!date) return toast("날짜를 선택하세요.");
    const exercises = collect().filter(e => e.name.trim() || e.sets?.length || e.cardioSets?.length);
    const id = existing?.id || uid();
    await DB.set("workouts", id, {
      date, type: $("#wmType").value.trim(), duration: $("#wmDuration").value.trim(),
      memo: $("#wmMemo").value, exercises, createdAt: existing?.createdAt || Date.now()
    });
    await DB.log(existing ? "edit" : "create", `운동 세션 (${date}) ${existing ? "수정" : "추가"}`);
    closeModal(); toast("저장했습니다."); render();
  };
}

/* ============================================================
   공부 (과목별 진도·성장 추적)
============================================================ */
function studyRows() {
  return DB.all("study").sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || (a.createdAt || 0) - (b.createdAt || 0));
}
function viewStudy() {
  const sub = state.studySub || "learn";
  const tabs = `<div class="hview-tabs" style="margin-bottom:16px">
    <button class="hvt ${sub === "learn" ? "on" : ""}" data-act="study-sub" data-v="learn">📚 학습</button>
    <button class="hvt ${sub === "reading" ? "on" : ""}" data-act="study-sub" data-v="reading">📖 독서</button>
    <button class="hvt ${sub === "md" ? "on" : ""}" data-act="study-sub" data-v="md">🎯 MD</button>
  </div>`;
  if (sub === "reading") return tabs + readingSection();
  if (sub === "md") return tabs + mdSection();

  const subjects = studyRows();
  const totalLogs = subjects.reduce((s, x) => s + (x.logs || []).length, 0);
  const totalMin = subjects.reduce((s, x) => s + (x.logs || []).reduce((m, l) => m + (Number(l.minutes) || 0), 0), 0);
  const avgProgress = subjects.length ? Math.round(subjects.reduce((s, x) => s + (Number(x.progress) || 0), 0) / subjects.length) : 0;

  const stat = `<div class="stat-grid" style="grid-template-columns:repeat(3,1fr)">
    <div class="stat"><div class="lb">📚 과목</div><div class="vl">${subjects.length}<small>개</small></div></div>
    <div class="stat"><div class="lb">📈 평균 진도</div><div class="vl">${avgProgress}<small>%</small></div></div>
    <div class="stat"><div class="lb">⏱ 누적 학습</div><div class="vl">${(totalMin / 60).toFixed(1)}<small>시간</small></div></div>
  </div>`;

  const addBtn = `<button class="add-grp" data-act="study-new" style="margin:6px 0 18px">+ 과목 추가</button>`;

  return tabs + viewStudyBody(subjects, stat, addBtn);
}

function viewStudyBody(subjects, stat, addBtn) {
  const list = subjects.length ? subjects.map(s => {
    const logs = (s.logs || []).slice()
      .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
      .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
    const logMin = logs.reduce((m, l) => m + (Number(l.minutes) || 0), 0);
    const recent = logs.slice(0, 4).map((l) => {
      const origIdx = (s.logs || []).indexOf(l);
      const key = `${s.id}_${origIdx}`;
      const isExpanded = !!state.expandedLogs[key];
      const isLong = (l.text || "").length > 80 || (l.text || "").split("\n").length > 2;
      return `<div class="study-log ${l.pinned ? "log-pinned" : ""}" style="align-items:flex-start">
        <div style="flex:1;min-width:0">
          <span class="study-log-date">${l.pinned ? "📌 " : ""}${l.date?.slice(5) || ""}</span>
          <span class="study-log-txt ${isLong && !isExpanded ? "log-clamped" : ""}" style="white-space:pre-wrap;word-break:break-word;display:inline-block;vertical-align:top">${esc(l.text || "").replace(/\n/g, "<br>")}${l.minutes ? ` · ${l.minutes}분` : ""}</span>
          ${isLong ? `<button class="log-toggle" data-act="study-log-toggle" data-id="${s.id}" data-idx="${origIdx}">${isExpanded ? "접기 ▴" : "더보기 ▾"}</button>` : ""}
        </div>
        <div style="display:flex;gap:3px;flex-shrink:0;margin-left:6px">
          <button class="icon-btn" style="opacity:1;width:26px;height:26px;color:${l.pinned?"#F59E0B":""}" data-act="study-log-pin" data-id="${s.id}" data-idx="${origIdx}" title="상단 고정">${l.pinned?"📌":"📍"}</button>
          <button class="icon-btn" style="opacity:1;width:26px;height:26px" data-act="study-log-copy" data-id="${s.id}" data-idx="${origIdx}" title="복사">⧉</button>
          <button class="icon-btn" style="opacity:1;width:26px;height:26px" data-act="study-log-edit" data-id="${s.id}" data-idx="${origIdx}" title="수정">✎</button>
          <button class="icon-btn" style="opacity:1;width:26px;height:26px;color:#DC2626" data-act="study-log-del" data-id="${s.id}" data-idx="${origIdx}" title="삭제">✕</button>
        </div>
      </div>`;
    }).join("");
    return `<div class="study-card" draggable="true" data-study-id="${s.id}">
      <div class="study-head">
        <span class="study-drag-handle" title="드래그해서 순서 변경">⠿</span>
        <div class="study-title">${esc(s.name)}</div>
        <span class="study-cur">${esc(s.current || "")}</span>
        <button class="card-menu" style="opacity:1;margin-left:auto" data-act="study-menu" data-id="${s.id}">⋯</button>
      </div>
      <div class="study-bar-row">
        <div class="bar-track"><div class="bar-fill" style="width:${Math.min(100, Number(s.progress) || 0)}%"></div></div>
        <div class="study-pct">${Number(s.progress) || 0}%</div>
      </div>
      <div class="study-meta">
        <span>🎯 ${esc(s.goal || "목표 미설정")}</span>
        <span>📝 ${logs.length}회 · ${(logMin / 60).toFixed(1)}h</span>
      </div>
      <div class="study-loginput">
        <textarea class="study-log-in" data-id="${s.id}" placeholder="오늘 진도/배운 것… (줄바꿈 가능)" rows="2"></textarea>
        <div class="study-log-side">
          <input type="number" class="study-min-in" data-id="${s.id}" placeholder="분" />
          <button class="btn-ghost" data-act="study-log-add" data-id="${s.id}">기록</button>
        </div>
      </div>
      ${recent ? `<div class="study-logs">${recent}</div>` : ""}
    </div>`;
  }).join("") : `<div class="empty" style="padding:44px 20px"><div class="big">📚</div><h3>과목이 없습니다</h3><p>공부 중인 과목을 추가하고 진도와 학습 시간을 기록하세요.</p></div>`;

  return `${stat}${addBtn}<div class="grp-title">과목 <span class="count">${subjects.length}</span></div>${list}`;
}

/* 독서 기록 섹션 */
function readingSection() {
  let books = DB.all("books");
  const q = (state.bookQuery || "").toLowerCase().trim();
  if (q) books = books.filter(b => ((b.title||"")+" "+(b.author||"")+" "+(b.genre||"")).toLowerCase().includes(q));

  const sortKey = state.bookSort || "recent";
  const sorters = {
    recent: (a,b) => (b.createdAt||0)-(a.createdAt||0),
    progress: (a,b) => (b.totalPages?(Number(b.curPage)||0)/Number(b.totalPages):0) - (a.totalPages?(Number(a.curPage)||0)/Number(a.totalPages):0),
    rating: (a,b) => (Number(b.rating)||0)-(Number(a.rating)||0),
    title: (a,b) => (a.title||"").localeCompare(b.title||"","ko")
  };
  books = books.slice().sort((a,b) => (a.order ?? 0)-(b.order ?? 0)).sort(sorters[sortKey] || sorters.recent);

  const allBooks = DB.all("books");
  const reading = books.filter(b => b.status === "reading");
  const doneBooks = books.filter(b => b.status === "done");
  const wishBooks = books.filter(b => b.status === "wish");
  const totalPages = allBooks.filter(b=>b.status==="done").reduce((s,b) => s+(Number(b.totalPages)||0), 0);

  // 연간 독서 목표
  const year = todayStr().slice(0,4);
  const goalMeta = DB.get("meta", "readingGoal") || {};
  const yearGoal = Number(goalMeta[year]) || 0;
  const doneThisYear = allBooks.filter(b => b.status === "done" && (b.finishDate||"").slice(0,4) === year).length;
  const goalPct = yearGoal ? Math.min(100, Math.round(doneThisYear/yearGoal*100)) : 0;

  const goalBar = `<div class="book-goal-card">
    <div class="book-goal-head">
      <span>🎯 ${year}년 독서 목표</span>
      <button class="link-btn" data-act="book-goal-set">${yearGoal?"목표 수정":"목표 설정"}</button>
    </div>
    ${yearGoal ? `<div class="bar-track" style="margin-top:8px"><div class="bar-fill" style="width:${goalPct}%"></div></div>
      <div class="book-goal-sub">${doneThisYear} / ${yearGoal}권 완독 · ${goalPct}%</div>`
      : `<div class="book-goal-sub">올해 몇 권을 읽을지 목표를 세워보세요.</div>`}
  </div>`;

  const stat = `<div class="stat-grid" style="grid-template-columns:repeat(3,1fr)">
    <div class="stat"><div class="lb">📖 읽는 중</div><div class="vl">${reading.length}<small>권</small></div></div>
    <div class="stat"><div class="lb">✅ 완독</div><div class="vl">${doneBooks.length}<small>권</small></div></div>
    <div class="stat"><div class="lb">📄 읽은 페이지</div><div class="vl">${totalPages.toLocaleString()}<small>p</small></div></div>
  </div>`;

  const toolbar = `<div class="book-toolbar">
    <div class="wk-search" style="flex:1">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
      <input type="text" id="bookQuery" placeholder="제목·저자·장르 검색" value="${esc(state.bookQuery||"")}" />
    </div>
    <select id="bookSort" style="height:38px;border:1px solid #E4E6EA;border-radius:8px;padding:0 10px;font-size:13px">
      <option value="recent" ${sortKey==="recent"?"selected":""}>최근 추가순</option>
      <option value="progress" ${sortKey==="progress"?"selected":""}>진행률순</option>
      <option value="rating" ${sortKey==="rating"?"selected":""}>별점순</option>
      <option value="title" ${sortKey==="title"?"selected":""}>제목순</option>
    </select>
  </div>`;

  const addBtn = `<button class="add-grp" data-act="book-add" style="margin:6px 0 18px">+ 책 추가</button>`;

  const bookCard = (b) => {
    const pct = b.totalPages ? Math.min(100, Math.round((Number(b.curPage)||0)/Number(b.totalPages)*100)) : 0;
    const statusBadge = {
      reading: `<span class="book-status reading">📖 읽는 중</span>`,
      done: `<span class="book-status done">✅ 완독</span>`,
      wish: `<span class="book-status wish">🔖 읽고 싶은</span>`
    }[b.status] || "";
    const logs = (b.logs||[]).slice().sort((a,b2)=>(b2.date||"").localeCompare(a.date||"")).slice(0,3);
    const quotes = b.quotes || [];
    const dateInfo = [
      b.startDate ? `시작 ${b.startDate}` : "",
      b.finishDate ? `완독 ${b.finishDate}` : ""
    ].filter(Boolean).join(" · ");

    return `<div class="book-card" draggable="true" data-book-id="${b.id}">
      <div class="book-card-head">
        <span class="book-drag-handle">⠿</span>
        <div class="book-info">
          <div class="book-title">${esc(b.title||"제목 없음")}${statusBadge}${b.genre?`<span class="book-genre">${esc(b.genre)}</span>`:""}</div>
          ${b.author ? `<div class="book-author">${esc(b.author)}</div>` : ""}
        </div>
        <div class="book-actions">
          <button class="icon-btn" data-act="book-edit" data-id="${b.id}" title="수정">✎</button>
          <button class="icon-btn" data-act="book-copy" data-id="${b.id}" title="복사">⧉</button>
          <button class="icon-btn" style="color:#EF4444" data-act="book-del" data-id="${b.id}" title="삭제">✕</button>
        </div>
      </div>
      ${b.status === "reading" && b.totalPages ? `<div class="book-progress">
        <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
        <span class="book-pct">${b.curPage||0}/${b.totalPages}p · ${pct}%</span>
      </div>` : ""}
      ${b.rating ? `<div class="book-rating">${"★".repeat(b.rating)}${"☆".repeat(5-b.rating)}</div>` : ""}
      ${b.review ? `<div class="book-review">${esc(b.review).replace(/\n/g,"<br>")}</div>` : ""}
      ${dateInfo ? `<div class="book-date-info">${dateInfo}</div>` : ""}

      ${b.status === "reading" ? `<div class="book-log-input">
        <input type="date" class="book-log-date" data-id="${b.id}" value="${todayStr()}" max="${todayStr()}" />
        <input type="number" class="book-log-pages" data-id="${b.id}" placeholder="오늘까지 읽은 쪽수" />
        <input type="text" class="book-log-note" data-id="${b.id}" placeholder="메모 (선택)" />
        <button class="btn-ghost" data-act="book-log-add" data-id="${b.id}">기록</button>
      </div>` : ""}
      ${logs.length ? `<div class="book-log-list">${logs.map((l,i)=>{
        const origIdx = (b.logs||[]).indexOf(l);
        return `<div class="book-log-row">
          <span class="book-log-date">${l.date?.slice(5)||""}</span>
          <span class="book-log-txt">${l.pages?`${l.pages}p까지`:""}${l.note?` · ${esc(l.note)}`:""}</span>
          <button class="sub-x" data-act="book-log-del" data-id="${b.id}" data-idx="${origIdx}">✕</button>
        </div>`;
      }).join("")}</div>` : ""}

      <div class="book-quotes">
        <div class="book-quotes-head">
          <span>✏️ 인상 깊은 구절 ${quotes.length?`<span class="count">${quotes.length}</span>`:""}</span>
          <button class="link-btn" data-act="book-quote-add" data-id="${b.id}">+ 구절 추가</button>
        </div>
        ${quotes.map((qt,qi) => `<div class="book-quote-item">
          <div class="book-quote-text">"${esc(qt.text)}"</div>
          ${qt.page ? `<div class="book-quote-page">p.${esc(qt.page)}</div>` : ""}
          <button class="sub-x" data-act="book-quote-del" data-id="${b.id}" data-idx="${qi}">✕</button>
        </div>`).join("")}
      </div>
      <div class="book-date">${b.date || fmt(new Date(b.createdAt||Date.now()))}</div>
    </div>`;
  };

  const section = (title, items) => items.length ? `<div class="grp-title" style="margin-top:16px">${title} <span class="count">${items.length}</span></div>${items.map(bookCard).join("")}` : "";

  const body = allBooks.length
    ? (books.length
        ? section("📖 읽는 중", reading) + section("🔖 읽고 싶은", wishBooks) + section("✅ 완독", doneBooks)
        : `<div class="empty" style="padding:36px 20px"><div class="big">🔍</div><h3>검색 결과가 없습니다</h3></div>`)
    : `<div class="empty" style="padding:44px 20px"><div class="big">📖</div><h3>독서 기록이 없습니다</h3><p>읽는 책, 완독한 책, 읽고 싶은 책을 기록하세요.</p></div>`;

  return `${stat}${goalBar}${toolbar}${addBtn}${body}`;
}

/* 독서 탭 wire */
/* MD 학습 자료 섹션 (이커머스/머천다이징 관련 학습) */
function mdSection() {
  let items = DB.all("mdItems");
  const q = (state.mdQuery || "").toLowerCase().trim();
  if (q) items = items.filter(x => ((x.title||"")+" "+(x.source||"")+" "+(x.category||"")).toLowerCase().includes(q));

  const sortKey = state.mdSort || "recent";
  const sorters = {
    recent: (a,b) => (b.createdAt||0)-(a.createdAt||0),
    progress: (a,b) => (Number(b.progressPct)||0)-(Number(a.progressPct)||0),
    rating: (a,b) => (Number(b.rating)||0)-(Number(a.rating)||0),
    title: (a,b) => (a.title||"").localeCompare(b.title||"","ko")
  };
  items = items.slice().sort((a,b) => (a.order ?? 0)-(b.order ?? 0)).sort(sorters[sortKey] || sorters.recent);

  const allItems = DB.all("mdItems");
  const studying = items.filter(x => x.status === "studying");
  const doneItems = items.filter(x => x.status === "done");
  const wishItems = items.filter(x => x.status === "wish");
  const totalMin = allItems.reduce((s,x) => s + (x.logs||[]).reduce((m,l)=>m+(Number(l.minutes)||0),0), 0);

  const year = todayStr().slice(0,4);
  const goalMeta = DB.get("meta", "mdGoal") || {};
  const yearGoal = Number(goalMeta[year]) || 0;
  const doneThisYear = allItems.filter(x => x.status === "done" && (x.finishDate||"").slice(0,4) === year).length;
  const goalPct = yearGoal ? Math.min(100, Math.round(doneThisYear/yearGoal*100)) : 0;

  const goalBar = `<div class="book-goal-card">
    <div class="book-goal-head">
      <span>🎯 ${year}년 MD 학습 목표</span>
      <button class="link-btn" data-act="md-goal-set">${yearGoal?"목표 수정":"목표 설정"}</button>
    </div>
    ${yearGoal ? `<div class="bar-track" style="margin-top:8px"><div class="bar-fill" style="width:${goalPct}%"></div></div>
      <div class="book-goal-sub">${doneThisYear} / ${yearGoal}개 완료 · ${goalPct}%</div>`
      : `<div class="book-goal-sub">올해 몇 개의 자료를 학습할지 목표를 세워보세요.</div>`}
  </div>`;

  const stat = `<div class="stat-grid" style="grid-template-columns:repeat(3,1fr)">
    <div class="stat"><div class="lb">🎯 학습 중</div><div class="vl">${studying.length}<small>개</small></div></div>
    <div class="stat"><div class="lb">✅ 완료</div><div class="vl">${doneItems.length}<small>개</small></div></div>
    <div class="stat"><div class="lb">⏱ 누적 시간</div><div class="vl">${(totalMin/60).toFixed(1)}<small>시간</small></div></div>
  </div>`;

  const toolbar = `<div class="book-toolbar">
    <div class="wk-search" style="flex:1">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
      <input type="text" id="mdQuery" placeholder="제목·출처·분류 검색" value="${esc(state.mdQuery||"")}" />
    </div>
    <select id="mdSort" style="height:38px;border:1px solid #E4E6EA;border-radius:8px;padding:0 10px;font-size:13px">
      <option value="recent" ${sortKey==="recent"?"selected":""}>최근 추가순</option>
      <option value="progress" ${sortKey==="progress"?"selected":""}>진행률순</option>
      <option value="rating" ${sortKey==="rating"?"selected":""}>유용도순</option>
      <option value="title" ${sortKey==="title"?"selected":""}>제목순</option>
    </select>
  </div>`;

  const addBtn = `<button class="add-grp" data-act="md-add" style="margin:6px 0 18px">+ 자료 추가</button>`;

  const mdCard = (x) => {
    const pct = Math.min(100, Number(x.progressPct)||0);
    const statusBadge = {
      studying: `<span class="book-status reading">🎯 학습 중</span>`,
      done: `<span class="book-status done">✅ 완료</span>`,
      wish: `<span class="book-status wish">🔖 예정</span>`
    }[x.status] || "";
    const logs = (x.logs||[]).slice().sort((a,b2)=>(b2.date||"").localeCompare(a.date||"")).slice(0,3);
    const insights = x.insights || [];
    const dateInfo = [
      x.startDate ? `시작 ${x.startDate}` : "",
      x.finishDate ? `완료 ${x.finishDate}` : ""
    ].filter(Boolean).join(" · ");

    return `<div class="book-card" draggable="true" data-md-id="${x.id}">
      <div class="book-card-head">
        <span class="book-drag-handle">⠿</span>
        <div class="book-info">
          <div class="book-title">${esc(x.title||"제목 없음")}${statusBadge}${x.category?`<span class="book-genre">${esc(x.category)}</span>`:""}</div>
          ${x.source ? `<div class="book-author">${esc(x.source)}</div>` : ""}
        </div>
        <div class="book-actions">
          <button class="icon-btn" data-act="md-edit" data-id="${x.id}" title="수정">✎</button>
          <button class="icon-btn" data-act="md-copy" data-id="${x.id}" title="복사">⧉</button>
          <button class="icon-btn" style="color:#EF4444" data-act="md-del" data-id="${x.id}" title="삭제">✕</button>
        </div>
      </div>
      ${x.status === "studying" ? `<div class="book-progress">
        <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
        <span class="book-pct">${pct}%</span>
      </div>` : ""}
      ${x.rating ? `<div class="book-rating">${"★".repeat(x.rating)}${"☆".repeat(5-x.rating)}</div>` : ""}
      ${x.review ? `<div class="book-review">${esc(x.review).replace(/\n/g,"<br>")}</div>` : ""}
      ${dateInfo ? `<div class="book-date-info">${dateInfo}</div>` : ""}

      ${x.status === "studying" ? `<div class="book-log-input">
        <input type="date" class="md-log-date" data-id="${x.id}" value="${todayStr()}" max="${todayStr()}" />
        <input type="number" class="md-log-progress" data-id="${x.id}" placeholder="진행률(%)" min="0" max="100" />
        <input type="text" class="md-log-note" data-id="${x.id}" placeholder="메모 (선택)" />
        <button class="btn-ghost" data-act="md-log-add" data-id="${x.id}">기록</button>
      </div>` : ""}
      ${logs.length ? `<div class="book-log-list">${logs.map((l)=>{
        const origIdx = (x.logs||[]).indexOf(l);
        return `<div class="book-log-row">
          <span class="book-log-date">${l.date?.slice(5)||""}</span>
          <span class="book-log-txt">${l.progress!=null?`${l.progress}%`:""}${l.note?` · ${esc(l.note)}`:""}</span>
          <button class="sub-x" data-act="md-log-del" data-id="${x.id}" data-idx="${origIdx}">✕</button>
        </div>`;
      }).join("")}</div>` : ""}

      <div class="book-quotes">
        <div class="book-quotes-head">
          <span>💡 핵심 인사이트 ${insights.length?`<span class="count">${insights.length}</span>`:""}</span>
          <button class="link-btn" data-act="md-insight-add" data-id="${x.id}">+ 인사이트 추가</button>
        </div>
        ${insights.map((it,ii) => `<div class="book-quote-item">
          <div class="book-quote-text">${esc(it.text)}</div>
          <button class="sub-x" data-act="md-insight-del" data-id="${x.id}" data-idx="${ii}">✕</button>
        </div>`).join("")}
      </div>
      <div class="book-date">${x.date || fmt(new Date(x.createdAt||Date.now()))}</div>
    </div>`;
  };

  const section = (title, arr) => arr.length ? `<div class="grp-title" style="margin-top:16px">${title} <span class="count">${arr.length}</span></div>${arr.map(mdCard).join("")}` : "";

  const body = allItems.length
    ? (items.length
        ? section("🎯 학습 중", studying) + section("🔖 예정", wishItems) + section("✅ 완료", doneItems)
        : `<div class="empty" style="padding:36px 20px"><div class="big">🔍</div><h3>검색 결과가 없습니다</h3></div>`)
    : `<div class="empty" style="padding:44px 20px"><div class="big">🎯</div><h3>MD 학습 자료가 없습니다</h3><p>아티클, 강의, 리포트 등 업무 관련 학습 자료를 기록하세요.</p></div>`;

  return `${stat}${goalBar}${toolbar}${addBtn}${body}`;
}

function mdEditModal(existing) {
  const x = existing || { title:"", source:"", category:"", status:"studying", progressPct:"", rating:0, review:"" };
  let isNew = !existing;
  openModal(`<div class="modal" style="max-width:520px">
    <div class="modal-head"><h3>${isNew?"MD 자료 추가":"MD 자료 수정"}</h3><button class="icon-btn" data-act="close">✕</button></div>
    <div class="modal-body">
      <div class="mrow"><label>제목</label><div class="ctl"><input type="text" id="mdTitle" value="${esc(x.title||"")}" placeholder="아티클/강의/리포트 제목" /></div></div>
      <div class="mrow"><label>출처</label><div class="ctl"><input type="text" id="mdSource" value="${esc(x.source||"")}" placeholder="예: 강의명, 사이트, 발행처 (선택)" /></div></div>
      <div class="mrow"><label>분류</label><div class="ctl"><input type="text" id="mdCategory" value="${esc(x.category||"")}" placeholder="예: 마케팅, 데이터분석, MD 실무 (선택)" /></div></div>
      <div class="mrow"><label>상태</label><div class="ctl">
        <select id="mdStatus" style="height:40px">
          <option value="studying" ${x.status==="studying"?"selected":""}>🎯 학습 중</option>
          <option value="done" ${x.status==="done"?"selected":""}>✅ 완료</option>
          <option value="wish" ${x.status==="wish"?"selected":""}>🔖 예정</option>
        </select>
      </div></div>
      <div class="mrow"><label>진행률(%)</label><div class="ctl"><input type="number" id="mdProgress" value="${x.progressPct||""}" placeholder="0~100" min="0" max="100" /></div></div>
      <div class="mrow"><label>유용도</label><div class="ctl">
        <div class="song-star-pick" id="mdStar" data-selected="${x.rating||0}">${[1,2,3,4,5].map(n=>`<button data-star="${n}" style="font-size:22px">${n<=(x.rating||0)?"★":"☆"}</button>`).join("")}</div>
      </div></div>
      <div class="mrow" style="align-items:flex-start"><label style="padding-top:11px">정리 메모</label><div class="ctl">
        <textarea id="mdReview" rows="5" placeholder="배운 점, 업무에 적용할 점 (줄바꿈 가능)" style="resize:vertical;line-height:1.7">${esc(x.review||"")}</textarea>
      </div></div>
    </div>
    <div class="modal-foot">
      <button class="btn-cancel" data-act="close">취소</button>
      <button class="btn-ghost" id="mdSaveKeep" style="margin-right:auto">저장 (계속 쓰기)</button>
      <button class="btn-save" id="mdSave">저장</button>
    </div>
  </div>`);
  const starPick = $("#mdStar");
  if (starPick) starPick.onclick = e => {
    const bt = e.target.closest("[data-star]"); if (!bt) return;
    const n = Number(bt.dataset.star);
    starPick.dataset.selected = n;
    $$("button", starPick).forEach((btn, i) => btn.textContent = i < n ? "★" : "☆");
  };
  setTimeout(() => $("#mdTitle")?.focus(), 40);

  const doSave = async (closeAfter) => {
    const title = $("#mdTitle").value.trim();
    if (!title) { toast("제목을 입력하세요."); return null; }
    const newStatus = $("#mdStatus").value;
    const cur = existing ? DB.get("mdItems", existing.id) || existing : null;
    const data = {
      title, source: $("#mdSource").value.trim(), category: $("#mdCategory").value.trim(),
      status: newStatus,
      progressPct: $("#mdProgress").value,
      rating: Number($("#mdStar")?.dataset.selected) || 0,
      review: $("#mdReview").value,
      date: (cur && cur.date) || todayStr()
    };
    if (newStatus === "studying" && !(cur && cur.startDate)) data.startDate = todayStr();
    if (newStatus === "done" && !(cur && cur.finishDate)) data.finishDate = todayStr();

    let savedId;
    if (isNew && !existing) {
      savedId = uid();
      await DB.set("mdItems", savedId, { ...data, order: DB.all("mdItems").length, logs: [], insights: [], createdAt: Date.now() });
    } else {
      savedId = existing.id;
      await DB.set("mdItems", savedId, { ...cur, ...data });
    }
    toast(closeAfter ? (isNew?"추가했습니다.":"수정했습니다.") : "저장했습니다. 계속 작성하세요.");
    if (closeAfter) { closeModal(); render(); }
    return savedId;
  };

  $("#mdSave").onclick = () => doSave(true);
  $("#mdSaveKeep").onclick = async () => {
    const savedId = await doSave(false);
    if (savedId && isNew) { existing = DB.get("mdItems", savedId); isNew = false; }
  };
}


function wireReading() {
  const qEl = $("#bookQuery");
  if (qEl) { let tm; qEl.oninput = e => { clearTimeout(tm); tm = setTimeout(() => { state.bookQuery = e.target.value; render(); const el = $("#bookQuery"); if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); } }, 200); }; }

  const sortEl = $("#bookSort");
  if (sortEl) sortEl.onchange = e => { state.bookSort = e.target.value; render(); };

  let dragId = null;
  $$(".book-card[data-book-id]").forEach(card => {
    card.addEventListener("dragstart", e => {
      if (e.target.closest("[data-act],input,textarea,button")) { e.preventDefault(); return; }
      dragId = card.dataset.bookId;
      card.classList.add("book-dragging");
      e.dataTransfer.effectAllowed = "move";
    });
    card.addEventListener("dragend", () => {
      card.classList.remove("book-dragging");
      $$(".book-drop-over").forEach(c => c.classList.remove("book-drop-over"));
      dragId = null;
    });
    card.addEventListener("dragover", e => {
      e.preventDefault();
      $$(".book-drop-over").forEach(c => c.classList.remove("book-drop-over"));
      if (dragId && dragId !== card.dataset.bookId) card.classList.add("book-drop-over");
    });
    card.addEventListener("dragleave", () => card.classList.remove("book-drop-over"));
    card.addEventListener("drop", async e => {
      e.preventDefault();
      card.classList.remove("book-drop-over");
      const toId = card.dataset.bookId;
      if (!dragId || dragId === toId) return;
      const all = DB.all("books").sort((a,b)=>(a.order??0)-(b.order??0));
      const fromIdx = all.findIndex(x=>x.id===dragId), toIdx = all.findIndex(x=>x.id===toId);
      if (fromIdx<0||toIdx<0) return;
      const reordered = all.slice();
      const [moved] = reordered.splice(fromIdx,1);
      reordered.splice(toIdx,0,moved);
      for (let i=0;i<reordered.length;i++) if (reordered[i].order!==i) await DB.set("books", reordered[i].id, { ...reordered[i], order:i });
      render();
    });
  });
}

/* MD 탭 wire */
function wireMd() {
  const qEl = $("#mdQuery");
  if (qEl) { let tm; qEl.oninput = e => { clearTimeout(tm); tm = setTimeout(() => { state.mdQuery = e.target.value; render(); const el = $("#mdQuery"); if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); } }, 200); }; }

  const sortEl = $("#mdSort");
  if (sortEl) sortEl.onchange = e => { state.mdSort = e.target.value; render(); };

  let dragId = null;
  $$(".book-card[data-md-id]").forEach(card => {
    card.addEventListener("dragstart", e => {
      if (e.target.closest("[data-act],input,textarea,button")) { e.preventDefault(); return; }
      dragId = card.dataset.mdId;
      card.classList.add("book-dragging");
      e.dataTransfer.effectAllowed = "move";
    });
    card.addEventListener("dragend", () => {
      card.classList.remove("book-dragging");
      $$(".book-drop-over").forEach(c => c.classList.remove("book-drop-over"));
      dragId = null;
    });
    card.addEventListener("dragover", e => {
      e.preventDefault();
      $$(".book-drop-over").forEach(c => c.classList.remove("book-drop-over"));
      if (dragId && dragId !== card.dataset.mdId) card.classList.add("book-drop-over");
    });
    card.addEventListener("dragleave", () => card.classList.remove("book-drop-over"));
    card.addEventListener("drop", async e => {
      e.preventDefault();
      card.classList.remove("book-drop-over");
      const toId = card.dataset.mdId;
      if (!dragId || dragId === toId) return;
      const all = DB.all("mdItems").sort((a,b)=>(a.order??0)-(b.order??0));
      const fromIdx = all.findIndex(x=>x.id===dragId), toIdx = all.findIndex(x=>x.id===toId);
      if (fromIdx<0||toIdx<0) return;
      const reordered = all.slice();
      const [moved] = reordered.splice(fromIdx,1);
      reordered.splice(toIdx,0,moved);
      for (let i=0;i<reordered.length;i++) if (reordered[i].order!==i) await DB.set("mdItems", reordered[i].id, { ...reordered[i], order:i });
      render();
    });
  });
}

function bookEditModal(existing) {
  const b = existing || { title:"", author:"", genre:"", status:"reading", totalPages:"", curPage:"", rating:0, review:"" };
  let isNew = !existing;
  openModal(`<div class="modal" style="max-width:520px">
    <div class="modal-head"><h3>${isNew?"책 추가":"책 수정"}</h3><button class="icon-btn" data-act="close">✕</button></div>
    <div class="modal-body">
      <div class="mrow"><label>제목</label><div class="ctl"><input type="text" id="bkTitle" value="${esc(b.title||"")}" placeholder="책 제목" /></div></div>
      <div class="mrow"><label>저자</label><div class="ctl"><input type="text" id="bkAuthor" value="${esc(b.author||"")}" placeholder="저자" /></div></div>
      <div class="mrow"><label>장르</label><div class="ctl"><input type="text" id="bkGenre" value="${esc(b.genre||"")}" placeholder="예: 자기계발, 소설 (선택)" /></div></div>
      <div class="mrow"><label>상태</label><div class="ctl">
        <select id="bkStatus" style="height:40px">
          <option value="reading" ${b.status==="reading"?"selected":""}>📖 읽는 중</option>
          <option value="done" ${b.status==="done"?"selected":""}>✅ 완독</option>
          <option value="wish" ${b.status==="wish"?"selected":""}>🔖 읽고 싶은</option>
        </select>
      </div></div>
      <div class="mrow"><label>페이지</label><div class="ctl" style="display:flex;gap:8px;align-items:center">
        <input type="number" id="bkCur" value="${b.curPage||""}" placeholder="현재" style="width:90px" />
        <span style="color:#9CA3AF">/</span>
        <input type="number" id="bkTotal" value="${b.totalPages||""}" placeholder="전체" style="width:90px" />
      </div></div>
      <div class="mrow"><label>별점</label><div class="ctl">
        <div class="song-star-pick" id="bkStar" data-selected="${b.rating||0}">${[1,2,3,4,5].map(n=>`<button data-star="${n}" style="font-size:22px">${n<=(b.rating||0)?"★":"☆"}</button>`).join("")}</div>
      </div></div>
      <div class="mrow" style="align-items:flex-start"><label style="padding-top:11px">독후감/메모</label><div class="ctl">
        <textarea id="bkReview" rows="5" placeholder="느낀 점, 인상 깊은 구절 (줄바꿈 가능)" style="resize:vertical;line-height:1.7">${esc(b.review||"")}</textarea>
      </div></div>
    </div>
    <div class="modal-foot">
      <button class="btn-cancel" data-act="close">취소</button>
      <button class="btn-ghost" id="bkSaveKeep" style="margin-right:auto">저장 (계속 쓰기)</button>
      <button class="btn-save" id="bkSave">저장</button>
    </div>
  </div>`);
  const starPick = $("#bkStar");
  if (starPick) starPick.onclick = e => {
    const bt = e.target.closest("[data-star]"); if (!bt) return;
    const n = Number(bt.dataset.star);
    starPick.dataset.selected = n;
    $$("button", starPick).forEach((btn, i) => btn.textContent = i < n ? "★" : "☆");
  };
  setTimeout(() => $("#bkTitle")?.focus(), 40);

  // 저장 로직 — closeAfter: true면 모달 닫고 렌더, false면 모달 유지한 채 저장만
  const doSave = async (closeAfter) => {
    const title = $("#bkTitle").value.trim();
    if (!title) { toast("제목을 입력하세요."); return null; }
    const newStatus = $("#bkStatus").value;
    const cur = existing ? DB.get("books", existing.id) || existing : null;
    const data = {
      title, author: $("#bkAuthor").value.trim(), genre: $("#bkGenre").value.trim(),
      status: newStatus,
      curPage: $("#bkCur").value, totalPages: $("#bkTotal").value,
      rating: Number($("#bkStar")?.dataset.selected) || 0,
      review: $("#bkReview").value,
      date: (cur && cur.date) || todayStr()
    };
    if (newStatus === "reading" && !(cur && cur.startDate)) data.startDate = todayStr();
    if (newStatus === "done" && !(cur && cur.finishDate)) data.finishDate = todayStr();

    let savedId;
    if (isNew && !existing) {
      savedId = uid();
      await DB.set("books", savedId, { ...data, order: DB.all("books").length, logs: [], quotes: [], createdAt: Date.now() });
    } else {
      savedId = existing.id;
      await DB.set("books", savedId, { ...cur, ...data });
    }
    toast(closeAfter ? (isNew?"추가했습니다.":"수정했습니다.") : "저장했습니다. 계속 작성하세요.");
    if (closeAfter) { closeModal(); render(); }
    return savedId;
  };

  $("#bkSave").onclick = () => doSave(true);
  $("#bkSaveKeep").onclick = async () => {
    const savedId = await doSave(false);
    if (savedId && isNew) {
      // 최초 저장 후에는 이후 클릭이 수정으로 이어지도록 existing을 갱신
      existing = DB.get("books", savedId);
      isNew = false;
    }
  };
}

function wireStudy() {
  if (state.studySub === "reading") { wireReading(); return; }
  if (state.studySub === "md") { wireMd(); return; }
  let dragId = null;

  $$(".study-card[data-study-id]").forEach(card => {
    card.addEventListener("dragstart", e => {
      // 버튼 클릭 시 드래그 방지
      if (e.target.closest("[data-act]")) { e.preventDefault(); return; }
      dragId = card.dataset.studyId;
      card.classList.add("study-dragging");
      e.dataTransfer.effectAllowed = "move";
    });
    card.addEventListener("dragend", () => {
      card.classList.remove("study-dragging");
      $$(".study-drop-over").forEach(c => c.classList.remove("study-drop-over"));
      dragId = null;
    });
    card.addEventListener("dragover", e => {
      e.preventDefault();
      $$(".study-drop-over").forEach(c => c.classList.remove("study-drop-over"));
      if (dragId && dragId !== card.dataset.studyId) card.classList.add("study-drop-over");
    });
    card.addEventListener("dragleave", () => {
      card.classList.remove("study-drop-over");
    });
    card.addEventListener("drop", async e => {
      e.preventDefault();
      card.classList.remove("study-drop-over");
      const targetId = card.dataset.studyId;
      if (!dragId || dragId === targetId) return;
      const rows = studyRows();
      const fromIdx = rows.findIndex(s => s.id === dragId);
      const toIdx = rows.findIndex(s => s.id === targetId);
      if (fromIdx < 0 || toIdx < 0) return;
      const reordered = rows.slice();
      const [moved] = reordered.splice(fromIdx, 1);
      reordered.splice(toIdx, 0, moved);
      for (let i = 0; i < reordered.length; i++) {
        if (reordered[i].order !== i) {
          await DB.set("study", reordered[i].id, { ...reordered[i], order: i });
        }
      }
      toast("순서를 변경했습니다."); render();
    });
  });

  // 기록 복사
  $$("[data-act='study-log-copy']").forEach(btn => {
    btn.onclick = async e => {
      e.stopPropagation();
      const subj = DB.get("study", btn.dataset.id);
      const log = subj?.logs?.[Number(btn.dataset.idx)];
      if (!log) return;
      const ok = await copyText(log.text || "");
      if (ok) toast("복사했습니다.");
    };
  });

  // 기록 수정
  $$("[data-act='study-log-edit']").forEach(btn => {
    btn.onclick = e => { e.stopPropagation(); studyLogEditModal(btn.dataset.id, Number(btn.dataset.idx)); };
  });

  // 기록 삭제
  $$("[data-act='study-log-del']").forEach(btn => {
    btn.onclick = async e => {
      e.stopPropagation();
      confirmModal("이 기록을 삭제할까요?", "되돌릴 수 없습니다.", async () => {
        const subj = DB.get("study", btn.dataset.id);
        if (!subj) return;
        subj.logs.splice(Number(btn.dataset.idx), 1);
        await DB.set("study", subj.id, subj);
        render();
      });
    };
  });

  // 기록 접기/펼치기
  $$("[data-act='study-log-toggle']").forEach(btn => {
    btn.onclick = e => {
      e.stopPropagation();
      const key = `${btn.dataset.id}_${btn.dataset.idx}`;
      state.expandedLogs[key] = !state.expandedLogs[key];
      render();
    };
  });

  // 기록 상단 고정
  $$("[data-act='study-log-pin']").forEach(btn => {
    btn.onclick = async e => {
      e.stopPropagation();
      const subj = DB.get("study", btn.dataset.id);
      const idx = Number(btn.dataset.idx);
      const log = subj?.logs?.[idx];
      if (!subj || !log) return;
      subj.logs[idx] = { ...log, pinned: !log.pinned };
      await DB.set("study", subj.id, subj);
      render();
    };
  });
}

/* 학습 기록 수정 모달 */
function studyLogEditModal(subjectId, idx) {
  const subj = DB.get("study", subjectId);
  if (!subj || !subj.logs?.[idx]) return;
  const log = subj.logs[idx];
  openModal(`<div class="modal" style="max-width:460px">
    <div class="modal-head"><h3>기록 수정</h3><button class="icon-btn" data-act="close">✕</button></div>
    <div class="modal-body">
      <div class="mrow"><label>날짜</label><div class="ctl"><input type="date" id="slDate" value="${esc(log.date || "")}" /></div></div>
      <div class="mrow" style="align-items:flex-start"><label style="padding-top:11px">내용</label><div class="ctl"><textarea id="slText" rows="5" style="resize:vertical">${esc(log.text || "")}</textarea></div></div>
      <div class="mrow"><label>시간(분)</label><div class="ctl"><input type="number" id="slMin" value="${Number(log.minutes) || 0}" /></div></div>
    </div>
    <div class="modal-foot">
      <button class="btn-cancel" data-act="close">취소</button>
      <button class="btn-ghost" id="slSaveKeep" style="margin-right:auto">저장 (계속 쓰기)</button>
      <button class="btn-save" id="slSave">저장</button>
    </div>
  </div>`);
  const slDoSave = async (closeAfter) => {
    log.date = $("#slDate").value || log.date;
    log.text = $("#slText").value;
    log.minutes = Number($("#slMin").value) || 0;
    await DB.set("study", subj.id, subj);
    await DB.log("edit", `"${subj.name}" 기록 수정`);
    if (closeAfter) { closeModal(); render(); }
    else toast("저장했습니다. 계속 작성하세요.");
  };
  $("#slSave").onclick = () => slDoSave(true);
  $("#slSaveKeep").onclick = () => slDoSave(false);
}

/* 과목 추가/수정 모달 */
function studyModal(existing) {
  const s = existing || { name: "", goal: "", current: "", progress: 0 };
  openModal(`<div class="modal" style="max-width:460px">
    <div class="modal-head"><h3>${existing ? "과목 수정" : "과목 추가"}</h3><button class="icon-btn" data-act="close">✕</button></div>
    <div class="modal-body">
      <div class="mrow"><label>과목명</label><div class="ctl"><input type="text" id="stName" value="${esc(s.name)}" placeholder="예: Python / 영어회화" /></div></div>
      <div class="mrow"><label>목표</label><div class="ctl"><input type="text" id="stGoal" value="${esc(s.goal)}" placeholder="예: 프로그래머스 Lv2 완료" /></div></div>
      <div class="mrow"><label>현재 진도</label><div class="ctl"><input type="text" id="stCurrent" value="${esc(s.current)}" placeholder="예: 3주차 / 문자열 파트" /></div></div>
      <div class="mrow"><label>진도율 %</label><div class="ctl"><input type="number" id="stProgress" value="${Number(s.progress) || 0}" min="0" max="100" /></div></div>
    </div>
    <div class="modal-foot"><button class="btn-cancel" data-act="close">취소</button><button class="btn-save" id="stSave">저장</button></div>
  </div>`);
  $("#stSave").onclick = async () => {
    const name = $("#stName").value.trim();
    if (!name) return toast("과목명을 입력하세요.");
    const id = existing?.id || uid();
    await DB.set("study", id, {
      name, goal: $("#stGoal").value.trim(), current: $("#stCurrent").value.trim(),
      progress: Math.max(0, Math.min(100, Number($("#stProgress").value) || 0)),
      logs: existing?.logs || [], order: existing?.order ?? DB.all("study").length, createdAt: existing?.createdAt || Date.now()
    });
    await DB.log(existing ? "edit" : "create", `과목 "${name}" ${existing ? "수정" : "추가"}`);
    closeModal(); render();
  };
}

/* ============================================================
   목표 (Goal) — 큰 목표에 습관/공부/운동/몸무게를 연결
============================================================ */
function goalRows() {
  return DB.all("goals").sort((a, b) => (a.done ? 1 : 0) - (b.done ? 1 : 0) || (a.order ?? 0) - (b.order ?? 0) || (a.createdAt || 0) - (b.createdAt || 0));
}
// 목표 진행률 계산: 타입별
function goalProgress(g) {
  if (g.type === "weight") {
    const rows = weightRows();
    if (!rows.length || g.startKg == null || g.targetKg == null) return { pct: 0, label: "기록 없음", detail: null };
    const cur = rows[rows.length - 1].kg;
    const total = g.startKg - g.targetKg;
    const doneAmt = g.startKg - cur;
    const pct = total === 0 ? 100 : Math.max(0, Math.min(100, Math.round(doneAmt / total * 100)));
    const remain = (cur - g.targetKg).toFixed(1);
    // 주간 변화 속도로 예상 달성일 계산
    const recent = rows.slice(-14);
    const weeklyRate = recent.length >= 2 ? (recent[0].kg - recent[recent.length-1].kg) / (recent.length / 7) : 0;
    let eta = null;
    if (weeklyRate > 0 && remain > 0) {
      const weeksLeft = Number(remain) / weeklyRate;
      eta = fmt(addDays(today(), Math.round(weeksLeft * 7)));
    }
    return { pct, label: `${cur}kg → 목표 ${g.targetKg}kg`, detail: {
      cur, target: g.targetKg, start: g.startKg,
      remain: `${remain}kg 남음`, done: `${doneAmt.toFixed(1)}kg 달성`,
      weeklyRate: weeklyRate > 0 ? `주 ${weeklyRate.toFixed(1)}kg 감량 중` : "최근 기록 분석 중",
      eta, records: rows.slice(-4).reverse()
    }};
  }
  if (g.type === "study" && g.linkId) {
    const s = DB.get("study", g.linkId);
    if (!s) return { pct: 0, label: "연결된 과목 없음", detail: null };
    const logs = (s.logs || []).slice().sort((a, b) => (b.date||"").localeCompare(a.date||""));
    const weekMin = logs.filter(l => l.date >= fmt(addDays(today(), -6))).reduce((m,l) => m+(Number(l.minutes)||0), 0);
    return { pct: Number(s.progress)||0, label: esc(s.name), detail: {
      progress: s.progress||0, goal: s.goal, current: s.current,
      weekHours: (weekMin/60).toFixed(1), totalLogs: logs.length,
      recentLogs: logs.slice(0,3)
    }};
  }
  if (g.type === "habit" && g.linkId) {
    const h = DB.get("habits", g.linkId);
    if (!h) return { pct: 0, label: "연결된 습관 없음", detail: null };
    const cur = currentStreak(h), tgt = Number(g.targetStreak)||30, best = bestStreak(h);
    const pct = Math.min(100, Math.round(cur/tgt*100));
    return { pct, label: `${cur}/${tgt}일 연속`, detail: {
      streak: cur, target: tgt, best,
      remain: Math.max(0, tgt-cur) + "일 남음",
      habitName: h.name, emoji: h.emoji||"🙂"
    }};
  }
  if (g.type === "workout") {
    const tgt = Number(g.targetCount)||12;
    const from = g.since||"";
    const sessions = DB.all("workouts").filter(w => !from||w.date>=from);
    const cnt = sessions.length;
    const pct = Math.min(100, Math.round(cnt/tgt*100));
    const weekSessions = sessions.filter(w => w.date >= fmt(addDays(today(),-6))).length;
    return { pct, label: `${cnt}/${tgt}회 세션`, detail: {
      cnt, tgt, remain: Math.max(0,tgt-cnt),
      weekSessions, since: from,
      recent: sessions.slice(-3).reverse()
    }};
  }
  return { pct: Math.max(0, Math.min(100, Number(g.progress)||0)), label: "직접 관리", detail: null };
}
const GOAL_TYPE_LABEL = { manual: "직접", weight: "몸무게", habit: "습관 연속", study: "공부 진도", workout: "운동 횟수" };
const GOAL_TYPE_ICON = { manual: "🎯", weight: "⚖️", habit: "🔥", study: "📚", workout: "💪" };

/* 마일스톤 배지 */
function milestoneBadges(pct) {
  return [25, 50, 75, 100].map(m => {
    const reached = pct >= m;
    return `<div class="goal-ms ${reached ? "on" : ""}"><div class="goal-ms-dot"></div><div class="goal-ms-lb">${m}%</div></div>`;
  }).join("");
}

/* 유형별 상세 패널 */
function goalDetailPanel(g, p) {
  if (!p.detail) return "";
  const d = p.detail;
  if (g.type === "weight") return `<div class="goal-detail">
    <div class="goal-detail-row"><span>📍 현재</span><b>${d.cur}kg</b></div>
    <div class="goal-detail-row"><span>🏁 목표</span><b>${d.target}kg</b></div>
    <div class="goal-detail-row"><span>✅ 달성</span><b style="color:#22C55E">${d.done}</b></div>
    <div class="goal-detail-row"><span>⏳ 남은</span><b style="color:#EF4444">${d.remain}</b></div>
    <div class="goal-detail-row"><span>📈 속도</span><b>${d.weeklyRate}</b></div>
    ${d.eta ? `<div class="goal-detail-row"><span>🗓️ 예상 달성일</span><b style="color:#0C66E4">${d.eta}</b></div>` : ""}
    ${d.records.length ? `<div class="goal-recent-title">최근 기록</div><div class="goal-recent-list">${d.records.map(r=>`<span>${r.date.slice(5)} · ${r.kg}kg</span>`).join("")}</div>` : ""}
  </div>`;
  if (g.type === "study") return `<div class="goal-detail">
    ${d.goal ? `<div class="goal-detail-row"><span>🎯 목표</span><b>${esc(d.goal)}</b></div>` : ""}
    ${d.current ? `<div class="goal-detail-row"><span>📍 현재 진도</span><b>${esc(d.current)}</b></div>` : ""}
    <div class="goal-detail-row"><span>⏱ 이번 주</span><b>${d.weekHours}시간</b></div>
    <div class="goal-detail-row"><span>📝 총 기록</span><b>${d.totalLogs}회</b></div>
    ${d.recentLogs.length ? `<div class="goal-recent-title">최근 학습</div><div class="goal-recent-list">${d.recentLogs.map(l=>`<span>${(l.date||"").slice(5)} · ${esc(l.text||"").slice(0,20)}</span>`).join("")}</div>` : ""}
  </div>`;
  if (g.type === "habit") return `<div class="goal-detail">
    <div class="goal-detail-row"><span>${d.emoji} 습관</span><b>${esc(d.habitName)}</b></div>
    <div class="goal-detail-row"><span>🔥 현재 연속</span><b style="color:#22C55E">${d.streak}일</b></div>
    <div class="goal-detail-row"><span>⭐ 최고 연속</span><b>${d.best}일</b></div>
    <div class="goal-detail-row"><span>⏳ 남은</span><b>${d.remain}</b></div>
  </div>`;
  if (g.type === "workout") return `<div class="goal-detail">
    <div class="goal-detail-row"><span>✅ 완료</span><b style="color:#22C55E">${d.cnt}회</b></div>
    <div class="goal-detail-row"><span>🏁 목표</span><b>${d.tgt}회</b></div>
    <div class="goal-detail-row"><span>⏳ 남은</span><b>${d.remain}회</b></div>
    <div class="goal-detail-row"><span>📅 이번 주</span><b>${d.weekSessions}회</b></div>
    ${d.since ? `<div class="goal-detail-row"><span>📌 시작일</span><b>${d.since}</b></div>` : ""}
  </div>`;
  return "";
}

function viewGoals() {
  const goals = goalRows();
  const active = goals.filter(g => !g.done);
  const doneCnt = goals.filter(g => g.done).length;
  const avgPct = active.length ? Math.round(active.reduce((s, g) => s + goalProgress(g).pct, 0) / active.length) : 0;

  // 전체 진행률 링
  const R = 28, C = 2 * Math.PI * R, off = C * (1 - avgPct / 100);
  const ring = `<svg viewBox="0 0 72 72" width="72" height="72">
    <circle cx="36" cy="36" r="${R}" fill="none" stroke="var(--wgrid)" stroke-width="7"/>
    <circle cx="36" cy="36" r="${R}" fill="none" stroke="#22C55E" stroke-width="7" stroke-linecap="round"
      stroke-dasharray="${C}" stroke-dashoffset="${off}" transform="rotate(-90 36 36)"/>
    <text x="36" y="41" text-anchor="middle" font-size="16" font-weight="800" fill="var(--dbtext)">${avgPct}%</text>
  </svg>`;

  const stat = `<div class="goal-summary">
    <div class="goal-ring-wrap">${ring}<div class="goal-ring-label">평균 진행률</div></div>
    <div class="goal-stat-list">
      <div class="goal-stat-item"><span>🎯 진행 중</span><b>${active.length}개</b></div>
      <div class="goal-stat-item"><span>🏆 달성</span><b>${doneCnt}개</b></div>
      <div class="goal-stat-item"><span>📋 전체</span><b>${goals.length}개</b></div>
    </div>
  </div>`;

  const addBtn = `<button class="add-grp" data-act="goal-new" style="margin:6px 0 18px">+ 목표 추가</button>`;

  const cards = goals.length ? goals.map(g => {
    const p = goalProgress(g);
    const dday = g.due ? diffDays(todayStr(), g.due) : null;
    const ddayCls = dday != null && dday < 0 ? "over" : dday != null && dday <= 7 ? "soon" : "";
    const ddayTxt = dday != null ? (dday === 0 ? "D-DAY" : dday > 0 ? "D-" + dday : "D+" + (-dday)) : "";
    // 마일스톤 달성 판단
    const milestones = [25, 50, 75, 100];
    const reached = milestones.filter(m => p.pct >= m).length;
    return `<div class="goal-card-v2 ${g.done ? "goal-done" : ""}" draggable="true" data-goal-id="${g.id}">
      <div class="goal-card-top">
        <div class="goal-drag-handle" title="드래그해서 순서 변경">⠿</div>
        <div class="goal-icon-wrap">${GOAL_TYPE_ICON[g.type]||"🎯"}</div>
        <div class="goal-card-main">
          <div class="goal-card-title-row">
            <button class="tcheck ${g.done ? "on" : ""}" data-act="goal-toggle" data-id="${g.id}" style="flex:0 0 20px"></button>
            <div class="goal-title">${esc(g.title)}</div>
            <span class="goal-type">${GOAL_TYPE_LABEL[g.type]||"직접"}</span>
            ${g.due ? `<span class="goal-dday ${ddayCls}">${ddayTxt}</span>` : ""}
            <button class="card-menu" style="opacity:1" data-act="goal-menu" data-id="${g.id}">⋯</button>
          </div>
          <!-- 메인 진행 바 -->
          <div class="goal-prog-wrap">
            <div class="goal-bar-track">
              <div class="goal-bar-fill" style="width:${p.pct}%;background:${p.pct>=100?"#22C55E":p.pct>=50?"#0C66E4":"#F59E0B"}"></div>
            </div>
            <div class="goal-pct-big">${p.pct}<small>%</small></div>
          </div>
          <!-- 마일스톤 -->
          <div class="goal-milestones">${milestoneBadges(p.pct)}</div>
          <div class="goal-meta-row">
            <span class="goal-meta-txt">${p.label}</span>
            ${g.due ? `<span class="goal-meta-txt">마감 ${g.due}</span>` : ""}
            ${reached >= 1 ? `<span class="goal-ms-achieved">🏅 ${reached}/4 마일스톤</span>` : ""}
          </div>
        </div>
      </div>
      <!-- 유형별 상세 -->
      ${goalDetailPanel(g, p)}
      <!-- 메모 -->
      ${g.note ? `<div class="goal-note">💬 ${esc(g.note)}</div>` : ""}
      <!-- manual 슬라이더 -->
      ${g.type === "manual" && !g.done ? `<div class="goal-manual">
        <span style="font-size:12px;color:#6B7280">진행률 직접 조정</span>
        <input type="range" min="0" max="100" value="${Number(g.progress)||0}" data-act="goal-slider" data-id="${g.id}" />
        <span class="goal-slider-val">${Number(g.progress)||0}%</span>
      </div>` : ""}
    </div>`;
  }).join("") : `<div class="empty" style="padding:44px 20px"><div class="big">🎯</div><h3>목표가 없습니다</h3><p>큰 목표를 세우고 습관·공부·운동·몸무게와 연결해 자동으로 추적하세요.</p></div>`;

  return `${stat}${addBtn}<div class="grp-title">목표 <span class="count">${goals.length}</span></div>${cards}`;
}

function wireGoals() {
  // 슬라이더
  $$('[data-act="goal-slider"]').forEach(sl => {
    sl.oninput = async e => {
      const g = DB.get("goals", sl.dataset.id);
      const val = Number(e.target.value);
      const valEl = sl.parentElement.querySelector(".goal-slider-val");
      if (valEl) valEl.textContent = val + "%";
      await DB.set("goals", g.id, { ...g, progress: val });
    };
  });

  // 드래그 앤 드롭
  let dragId = null;
  $$(".goal-card-v2[data-goal-id]").forEach(card => {
    card.addEventListener("dragstart", e => {
      if (e.target.closest("[data-act]")) { e.preventDefault(); return; }
      dragId = card.dataset.goalId;
      card.classList.add("goal-dragging");
      e.dataTransfer.effectAllowed = "move";
    });
    card.addEventListener("dragend", () => {
      card.classList.remove("goal-dragging");
      $$(".goal-drop-over").forEach(c => c.classList.remove("goal-drop-over"));
      dragId = null;
    });
    card.addEventListener("dragover", e => {
      e.preventDefault();
      $$(".goal-drop-over").forEach(c => c.classList.remove("goal-drop-over"));
      if (dragId && dragId !== card.dataset.goalId) card.classList.add("goal-drop-over");
    });
    card.addEventListener("dragleave", () => card.classList.remove("goal-drop-over"));
    card.addEventListener("drop", async e => {
      e.preventDefault();
      card.classList.remove("goal-drop-over");
      const targetId = card.dataset.goalId;
      if (!dragId || dragId === targetId) return;
      const rows = goalRows();
      const fromIdx = rows.findIndex(g => g.id === dragId);
      const toIdx = rows.findIndex(g => g.id === targetId);
      if (fromIdx < 0 || toIdx < 0) return;
      const reordered = rows.slice();
      const [moved] = reordered.splice(fromIdx, 1);
      reordered.splice(toIdx, 0, moved);
      for (let i = 0; i < reordered.length; i++) {
        if (reordered[i].order !== i) await DB.set("goals", reordered[i].id, { ...reordered[i], order: i });
      }
      toast("순서를 변경했습니다."); render();
    });
  });
}

function goalModal(existing) {
  const g = existing || { title: "", type: "manual", due: "", note: "", progress: 0, targetStreak: 30, targetCount: 12, since: todayStr(), startKg: "", targetKg: "" };
  const habits = DB.all("habits").filter(h => !h.archived);
  const studies = DB.all("study");
  openModal(`<div class="modal" style="max-width:480px">
    <div class="modal-head"><h3>${existing ? "목표 수정" : "목표 추가"}</h3><button class="icon-btn" data-act="close">✕</button></div>
    <div class="modal-body">
      <div class="mrow"><label>목표</label><div class="ctl"><input type="text" id="gTitle" value="${esc(g.title)}" placeholder="예: 75kg 달성 / Python Lv3" /></div></div>
      <div class="mrow"><label>유형</label><div class="ctl"><select id="gType">
        <option value="manual" ${g.type === "manual" ? "selected" : ""}>직접 관리 (수동 %)</option>
        <option value="weight" ${g.type === "weight" ? "selected" : ""}>몸무게 목표</option>
        <option value="habit" ${g.type === "habit" ? "selected" : ""}>습관 연속 달성</option>
        <option value="study" ${g.type === "study" ? "selected" : ""}>공부 진도 연결</option>
        <option value="workout" ${g.type === "workout" ? "selected" : ""}>운동 횟수</option>
      </select></div></div>
      <div id="gExtra"></div>
      <div class="mrow"><label>마감일</label><div class="ctl"><input type="date" id="gDue" value="${g.due || ""}" /></div></div>
      <div class="mrow" style="align-items:flex-start"><label style="padding-top:11px">메모</label><div class="ctl"><textarea id="gNote" placeholder="이 목표가 왜 중요한지">${esc(g.note || "")}</textarea></div></div>
    </div>
    <div class="modal-foot">
      <button class="btn-cancel" data-act="close">취소</button>
      <button class="btn-ghost" id="gSaveKeep" style="margin-right:auto">저장 (계속 쓰기)</button>
      <button class="btn-save" id="gSave">저장</button>
    </div>
  </div>`);

  const renderExtra = () => {
    const t = $("#gType").value;
    let html = "";
    if (t === "weight") html = `
      <div class="mrow"><label>시작 kg</label><div class="ctl"><input type="number" id="gStartKg" step="0.1" value="${g.startKg || (weightRows().slice(-1)[0]?.kg ?? "")}" /></div></div>
      <div class="mrow"><label>목표 kg</label><div class="ctl"><input type="number" id="gTargetKg" step="0.1" value="${g.targetKg || weightGoal()}" /></div></div>`;
    else if (t === "habit") html = `
      <div class="mrow"><label>연결 습관</label><div class="ctl"><select id="gLink">${habits.map(h => `<option value="${h.id}" ${g.linkId === h.id ? "selected" : ""}>${esc(h.emoji || "")} ${esc(h.name)}</option>`).join("") || '<option value="">습관 없음</option>'}</select></div></div>
      <div class="mrow"><label>목표 연속</label><div class="ctl"><input type="number" id="gTargetStreak" value="${g.targetStreak || 30}" /> 일</div></div>`;
    else if (t === "study") html = `
      <div class="mrow"><label>연결 과목</label><div class="ctl"><select id="gLink">${studies.map(s => `<option value="${s.id}" ${g.linkId === s.id ? "selected" : ""}>${esc(s.name)}</option>`).join("") || '<option value="">과목 없음</option>'}</select></div></div>`;
    else if (t === "workout") html = `
      <div class="mrow"><label>목표 횟수</label><div class="ctl"><input type="number" id="gTargetCount" value="${g.targetCount || 12}" /> 회</div></div>
      <div class="mrow"><label>집계 시작</label><div class="ctl"><input type="date" id="gSince" value="${g.since || todayStr()}" /></div></div>`;
    else html = `<div class="mrow"><label>진행률</label><div class="ctl"><input type="number" id="gProgress" min="0" max="100" value="${Number(g.progress) || 0}" /> %</div></div>`;
    $("#gExtra").innerHTML = html;
  };
  renderExtra();
  $("#gType").onchange = renderExtra;

  let gSavedId = existing?.id || null;
  const gDoSave = async (closeAfter) => {
    const title = $("#gTitle").value.trim();
    if (!title) { toast("목표를 입력하세요."); return; }
    const type = $("#gType").value;
    const wasNew = !gSavedId;
    if (!gSavedId) gSavedId = uid();
    const cur = DB.get("goals", gSavedId);
    const obj = {
      title, type, due: $("#gDue").value, note: $("#gNote").value,
      done: cur?.done || existing?.done || false,
      order: cur?.order ?? existing?.order ?? DB.all("goals").length,
      createdAt: cur?.createdAt || existing?.createdAt || Date.now()
    };
    if (type === "weight") { obj.startKg = Number($("#gStartKg")?.value) || null; obj.targetKg = Number($("#gTargetKg")?.value) || null; }
    else if (type === "habit") { obj.linkId = $("#gLink")?.value; obj.targetStreak = Number($("#gTargetStreak")?.value) || 30; }
    else if (type === "study") { obj.linkId = $("#gLink")?.value; }
    else if (type === "workout") { obj.targetCount = Number($("#gTargetCount")?.value) || 12; obj.since = $("#gSince")?.value; }
    else { obj.progress = Number($("#gProgress")?.value) || 0; }
    await DB.set("goals", gSavedId, obj);
    await DB.log(wasNew ? "create" : "edit", `목표 "${title}" ${wasNew ? "추가" : "수정"}`);
    if (closeAfter) { closeModal(); render(); }
    else toast("저장했습니다. 계속 작성하세요.");
  };
  $("#gSave").onclick = () => gDoSave(true);
  $("#gSaveKeep").onclick = () => gDoSave(false);
}

/* ============================================================
   주간 리뷰
============================================================ */
function reviewWeek() {
  // state.reviewOffset: 0=이번 주, -1=지난 주 ...
  const off = state.reviewOffset || 0;
  const base = addDays(today(), off * 7);
  const start = weekStartOf(base); // 월요일 시작
  const end = addDays(start, 6);
  return { start, end, days: Array.from({ length: 7 }, (_, i) => addDays(start, i)) };
}
function viewReview() {
  const { start, end, days } = reviewWeek();
  const sStr = fmt(start), eStr = fmt(end);
  const habits = DB.all("habits").filter(h => !h.archived);

  // 습관 달성
  let due = 0, done = 0;
  const perDay = days.map(d => {
    const ds = fmt(d);
    const dd = habits.filter(h => isActiveOn(h, ds) && ds <= todayStr());
    const dn = dd.filter(h => isChecked(h.id, ds));
    due += dd.length; done += dn.length;
    return { ds, dow: DOW[d.getDay()], pct: dd.length ? dn.length / dd.length : -1, due: dd.length, done: dn.length };
  });
  const habitPct = due ? Math.round(done / due * 100) : 0;

  // 지난 주 대비
  const prevOff = (state.reviewOffset || 0) - 1;
  const pBase = addDays(today(), prevOff * 7), pStart = addDays(pBase, -pBase.getDay());
  let pDue = 0, pDone = 0;
  for (let i = 0; i < 7; i++) { const ds = fmt(addDays(pStart, i)); habits.forEach(h => { if (isActiveOn(h, ds) && ds <= todayStr()) { pDue++; if (isChecked(h.id, ds)) pDone++; } }); }
  const pHabitPct = pDue ? Math.round(pDone / pDue * 100) : 0;
  const habitDelta = habitPct - pHabitPct;

  // 할 일 완료
  const todosDone = DB.all("todos").filter(t => t.done && t.doneAt && fmt(new Date(t.doneAt)) >= sStr && fmt(new Date(t.doneAt)) <= eStr).length;
  // 운동
  const workouts = DB.all("workouts").filter(w => w.date >= sStr && w.date <= eStr);
  const wkVol = workouts.reduce((s, w) => s + (w.exercises || []).reduce((a, e) => a + (e.sets || []).reduce((x, st) => x + (Number(st.kg) || 0) * (Number(st.reps) || 0), 0), 0), 0);
  // 공부
  const studyMin = DB.all("study").reduce((s, sub) => s + (sub.logs || []).filter(l => l.date >= sStr && l.date <= eStr).reduce((m, l) => m + (Number(l.minutes) || 0), 0), 0);
  // 몸무게 변화
  const wInRange = weightRows().filter(w => w.date >= sStr && w.date <= eStr);
  const wDelta = wInRange.length >= 2 ? (wInRange[wInRange.length - 1].kg - wInRange[0].kg) : null;

  const bars = perDay.map(d => {
    const h = d.pct < 0 ? 6 : Math.max(6, Math.round(d.pct * 60));
    const op = d.pct < 0 ? 0.2 : 1;
    return `<div class="rv-bar-col"><div class="rv-bar" style="height:60px"><div class="rv-bar-fill" style="height:${h}px;opacity:${op}"></div></div><div class="rv-bar-lb">${d.dow}</div></div>`;
  }).join("");

  const deltaTag = (v, unit = "%", goodDown = false) => {
    if (v == null) return "";
    const good = goodDown ? v < 0 : v > 0;
    const arrow = v > 0 ? "▲" : v < 0 ? "▼" : "—";
    return `<span class="rv-delta ${v === 0 ? "" : good ? "up" : "down"}">${arrow} ${Math.abs(v).toFixed(unit === "kg" ? 1 : 0)}${unit}</span>`;
  };

  return `
  <div class="rv-nav">
    <button class="cal-nav" data-act="rv-prev">‹</button>
    <div class="rv-range">${sStr} ~ ${eStr}${(state.reviewOffset || 0) === 0 ? " · 이번 주" : ""}</div>
    <button class="cal-nav" data-act="rv-next" ${(state.reviewOffset || 0) >= 0 ? "disabled" : ""}>›</button>
    <button class="btn-ghost" data-act="rv-today" style="margin-left:auto">이번 주</button>
  </div>

  <div class="rv-hero">
    <div class="rv-hero-main">
      <div class="rv-hero-label">이번 주 습관 달성률</div>
      <div class="rv-hero-val">${habitPct}<small>%</small> ${deltaTag(habitDelta)}</div>
      <div class="rv-hero-sub">${done} / ${due} 완료 · 지난주 ${pHabitPct}%</div>
    </div>
    <div class="rv-bars">${bars}</div>
  </div>

  <div class="db-grid">
    ${dbTile("✅", "할 일 완료", `${todosDone}`, "개", "이번 주 마친 할 일", "go-todo")}
    ${dbTile("💪", "운동 세션", `${workouts.length}`, "회", `볼륨 ${Math.round(wkVol).toLocaleString()}kg`, "go-workout")}
    ${dbTile("📚", "공부 시간", `${(studyMin / 60).toFixed(1)}`, "시간", `${studyMin}분 학습`, "go-study")}
    ${dbTile("⚖️", "몸무게 변화", wDelta != null ? `${wDelta > 0 ? "+" : ""}${wDelta.toFixed(1)}` : "—", "kg", wInRange.length ? "주간 증감" : "기록 없음", "go-workout")}
  </div>

  <div class="rv-ai">
    <div class="rv-ai-head">
      <div class="db-card-title" style="margin:0">🤖 AI 주간 피드백</div>
      <button class="btn-save" id="rvAiBtn" style="padding:8px 16px">피드백 생성</button>
    </div>
    <div id="rvAiOut" class="rv-ai-out">${state.reviewAi || '<span class="td-empty-sub">버튼을 누르면 이번 주 데이터를 바탕으로 코멘트를 만들어 드립니다. (Firebase/API 연결 시 실제 AI, 아니면 규칙 기반 요약)</span>'}</div>
  </div>`;
}
function wireReview() {
  const btn = $("#rvAiBtn");
  if (btn) btn.onclick = () => generateWeekFeedback();
}

/* AI(또는 규칙 기반) 주간 피드백 */
async function generateWeekFeedback() {
  const out = $("#rvAiOut");
  out.innerHTML = `<span class="td-empty-sub">분석 중…</span>`;

  const { start, end } = reviewWeek();
  const sStr = fmt(start), eStr = fmt(end);
  const t = todayStr();

  /* ── 1. 습관 ── */
  const habits = DB.all("habits").filter(h => !h.archived);
  let hDue = 0, hDone = 0, hFail = 0;
  const perHabit = habits.map(h => {
    let d = 0, n = 0, f = 0;
    for (let i = 0; i < 7; i++) {
      const ds = fmt(addDays(start, i));
      if (!isActiveOn(h, ds) || ds > t) continue;
      d++;
      const st = checkState(h.id, ds);
      if (st === "done") { n++; hDone++; } else if (st === "fail") { f++; hFail++; }
      hDue++;
    }
    return { name: h.name, emoji: h.emoji || "🙂", due: d, done: n, fail: f, pct: d ? Math.round(n / d * 100) : 0 };
  }).filter(h => h.due > 0).sort((a, b) => b.pct - a.pct);
  const habitPct = hDue ? Math.round(hDone / hDue * 100) : 0;
  const bestH = perHabit[0], worstH = perHabit[perHabit.length - 1];

  /* ── 2. 운동 ── */
  const wkSessions = DB.all("workouts").filter(w => w.date >= sStr && w.date <= eStr);
  const wkVol = wkSessions.reduce((s, w) => s + (w.exercises || []).reduce((a, e) =>
    a + (e.sets || []).reduce((x, st) => x + (Number(st.kg)||0)*(Number(st.reps)||0), 0), 0), 0);
  const wkTypes = [...new Set(wkSessions.map(w => w.type).filter(Boolean))];

  /* ── 3. 공부 ── */
  const studySubjects = DB.all("study");
  const studyLogs = studySubjects.flatMap(s =>
    (s.logs || []).filter(l => l.date >= sStr && l.date <= eStr).map(l => ({ ...l, subject: s.name })));
  const studyMin = studyLogs.reduce((m, l) => m + (Number(l.minutes)||0), 0);
  const studyBySubject = studySubjects.map(s => ({
    name: s.name, progress: s.progress || 0,
    logs: (s.logs || []).filter(l => l.date >= sStr && l.date <= eStr),
    weekMin: (s.logs || []).filter(l => l.date >= sStr && l.date <= eStr).reduce((m, l) => m + (Number(l.minutes)||0), 0)
  })).filter(s => s.logs.length > 0);

  /* ── 4. 노래 ── */
  const vocalLogs = DB.all("vocal").filter(v => v.date >= sStr && v.date <= eStr);
  const vocalMin = vocalLogs.reduce((m, v) => m + (Number(v.minutes)||0), 0);
  const vocalByCat = {};
  vocalLogs.forEach(v => { vocalByCat[v.cat] = (vocalByCat[v.cat] || 0) + (Number(v.minutes)||0); });
  const songSessions = DB.all("songs").flatMap(s =>
    (s.sessions || []).filter(se => se.date >= sStr && se.date <= eStr).map(se => ({ ...se, title: s.title })));

  /* ── 5. 회고 ── */
  const journals = DB.all("journal").filter(j => j.date >= sStr && j.date <= eStr);

  /* ── 6. 몸무게 ── */
  const wInRange = weightRows().filter(w => w.date >= sStr && w.date <= eStr);
  const wDelta = wInRange.length >= 2 ? wInRange[wInRange.length-1].kg - wInRange[0].kg : null;
  const latestW = weightRows().slice(-1)[0];

  /* ── 7. 할 일 ── */
  const todosDone = DB.all("todos").filter(td => td.done && td.doneAt && fmt(new Date(td.doneAt)) >= sStr && fmt(new Date(td.doneAt)) <= eStr).length;

  /* ── AI 호출 or 규칙 기반 ── */
  const fullData = {
    기간: `${sStr} ~ ${eStr}`,
    습관: { 달성률: habitPct + "%", 완료: hDone, 전체: hDue, 실패: hFail,
      습관별: perHabit.map(h => `${h.emoji}${h.name} ${h.pct}%(${h.done}/${h.due}${h.fail ? ` 실패${h.fail}` : ""})`) },
    운동: { 세션수: wkSessions.length, 볼륨: Math.round(wkVol) + "kg", 종류: wkTypes },
    공부: { 총시간: (studyMin/60).toFixed(1) + "h", 과목별: studyBySubject.map(s => `${s.name} ${(s.weekMin/60).toFixed(1)}h`) },
    노래: { 총시간: (vocalMin/60).toFixed(1) + "h",
      카테고리별: Object.entries(vocalByCat).map(([k,v]) => `${VOCAL_CATS[k]?.label||k} ${v}분`),
      레퍼토리: songSessions.map(s => s.title) },
    회고: { 작성수: journals.length },
    몸무게: { 최근: latestW ? latestW.kg + "kg" : "없음", 주간변화: wDelta != null ? (wDelta>0?"+":"")+wDelta.toFixed(1)+"kg" : "측정없음" },
    할일완료: todosDone
  };

  if (window.__ANTHROPIC_PROXY__) {
    try {
      const prompt = `당신은 자기계발 코치입니다. 아래는 사용자의 이번 주 전체 기록입니다.

데이터:
${JSON.stringify(fullData, null, 2)}

다음 형식으로 한국어 피드백을 작성하세요 (각 섹션 반드시 포함):

**📊 이번 주 종합**
(습관·운동·공부·노래·회고를 아우르는 한 줄 총평)

**✅ 잘한 것 (Top 2)**
(구체적 수치 근거)

**⚠️ 개선 필요 (Top 2)**
(문제 원인과 구체적 조언)

**💪 운동**
(세션 수, 볼륨, 종류 분석. 1-2문장)

**📚 공부**
(과목별 시간, 진도, 일관성. 1-2문장)

**🎤 노래**
(카테고리별 연습, 균형, 개선점. 1-2문장)

**📓 회고**
(작성 여부와 자기성찰 패턴. 1문장)

**🎯 다음 주 실행 과제 3가지**
1. (구체적 행동)
2. (구체적 행동)
3. (구체적 행동)

수치를 반드시 근거로 사용하고, 위로나 칭찬보다 솔직하고 직설적으로 작성하세요.`;

      const resp = await fetch(window.__ANTHROPIC_PROXY__, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000,
          messages: [{ role: "user", content: prompt }] })
      });
      const data = await resp.json();
      const text = (data.content || []).map(c => c.text || "").join("\n");
      state.reviewAi = text
        .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
        .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
        .replace(/\n/g, "<br>");
      out.innerHTML = state.reviewAi;
      return;
    } catch (e) { console.error("AI 피드백 오류:", e); }
  }

  /* ── 규칙 기반 상세 피드백 ── */
  const b = (t) => `<b>${t}</b>`;
  const lines = [];

  // 종합
  const score = Math.round((habitPct + (wkSessions.length>=2?80:wkSessions.length>=1?50:0) + (studyMin>=60?80:studyMin>0?50:0) + (vocalMin>=60?80:vocalMin>0?50:0)) / 4);
  lines.push(`<div class="rv-fb-section"><div class="rv-fb-head">📊 이번 주 종합</div>`);
  lines.push(`습관 ${habitPct}%, 운동 ${wkSessions.length}회, 공부 ${(studyMin/60).toFixed(1)}h, 노래 ${(vocalMin/60).toFixed(1)}h — 종합 컨디션 ${score >= 70 ? "양호" : score >= 40 ? "보통" : "점검 필요"}.`);
  lines.push(`</div>`);

  // 잘한 것
  const goods = [];
  if (bestH && bestH.pct >= 80) goods.push(`${bestH.emoji} ${b(bestH.name)} 습관 ${bestH.pct}% 달성`);
  if (wkSessions.length >= 3) goods.push(`운동 ${b(wkSessions.length + "회")} 세션 — 주 3회 이상 달성`);
  if (studyMin >= 120) goods.push(`공부 총 ${b((studyMin/60).toFixed(1)+"시간")} — 꾸준한 학습`);
  if (vocalMin >= 60) goods.push(`노래 연습 ${b((vocalMin/60).toFixed(1)+"시간")} — 보컬 루틴 유지`);
  if (journals.length >= 3) goods.push(`회고 ${b(journals.length + "회")} 작성 — 자기성찰 습관 유지`);
  if (wDelta != null && wDelta < 0) goods.push(`몸무게 ${b(wDelta.toFixed(1)+"kg")} 감량`);
  lines.push(`<div class="rv-fb-section"><div class="rv-fb-head">✅ 잘한 것</div>`);
  lines.push(goods.length ? goods.slice(0,3).map(g=>`• ${g}`).join("<br>") : "• 이번 주는 기록이 부족합니다. 작은 것 하나부터 시작하세요.");
  lines.push(`</div>`);

  // 개선 필요
  const bads = [];
  if (worstH && worstH.pct < 60) bads.push(`${worstH.emoji} ${b(worstH.name)} ${worstH.pct}% — 시간·장소를 하나로 고정하세요`);
  if (hFail > 0) bads.push(`실패 표시 ${b(hFail + "일")} — 못 한 이유를 회고에 기록하면 패턴이 보입니다`);
  if (wkSessions.length === 0) bads.push(`운동 기록 없음 — 주 1회라도 세션을 추가하세요`);
  if (studyMin === 0) bads.push(`공부 기록 없음 — 10분이라도 기록부터`);
  if (vocalMin === 0) bads.push(`노래 연습 기록 없음 — 레슨 받는 주에 연습 시간을 확보하세요`);
  if (journals.length === 0) bads.push(`회고 미작성 — 주 1회 5분 회고가 성장 속도를 2배 높입니다`);
  lines.push(`<div class="rv-fb-section"><div class="rv-fb-head">⚠️ 개선 필요</div>`);
  lines.push(bads.length ? bads.slice(0,3).map(b=>`• ${b}`).join("<br>") : "• 전반적으로 균형이 잡혀 있습니다. 강도를 높여볼 시점입니다.");
  lines.push(`</div>`);

  // 운동
  lines.push(`<div class="rv-fb-section"><div class="rv-fb-head">💪 운동</div>`);
  if (wkSessions.length === 0) lines.push("이번 주 운동 기록이 없습니다.");
  else {
    lines.push(`${wkSessions.length}회 세션, 총 볼륨 ${Math.round(wkVol).toLocaleString()}kg${wkTypes.length ? ` (${wkTypes.join("·")})` : ""}.`);
    lines.push(wkSessions.length >= 3 ? "주 3회 이상 유지 — 좋은 리듬입니다." : "주 3회를 목표로 하세요. 2회 이하는 근육 유지에 부족합니다.");
  }
  lines.push(`</div>`);

  // 공부
  lines.push(`<div class="rv-fb-section"><div class="rv-fb-head">📚 공부</div>`);
  if (studyBySubject.length === 0) lines.push("이번 주 공부 기록이 없습니다.");
  else {
    lines.push(studyBySubject.map(s => `${b(s.name)} ${(s.weekMin/60).toFixed(1)}h`).join(" · ") + ` — 총 ${(studyMin/60).toFixed(1)}시간.`);
    const inactive = studySubjects.filter(s => !(s.logs||[]).some(l => l.date>=sStr&&l.date<=eStr));
    if (inactive.length) lines.push(`${b(inactive.map(s=>s.name).join(", "))}은 이번 주 기록 없음.`);
  }
  lines.push(`</div>`);

  // 노래
  lines.push(`<div class="rv-fb-section"><div class="rv-fb-head">🎤 노래</div>`);
  if (vocalMin === 0 && songSessions.length === 0) lines.push("이번 주 노래 연습 기록이 없습니다.");
  else {
    if (vocalMin > 0) lines.push(Object.entries(vocalByCat).map(([k,v]) => `${VOCAL_CATS[k]?.label||k} ${v}분`).join(" · ") + ` — 총 ${vocalMin}분.`);
    if (songSessions.length > 0) lines.push(`레퍼토리 연습: ${[...new Set(songSessions.map(s=>s.title))].join(", ")}.`);
    const catKeys = Object.keys(VOCAL_CATS);
    const missing = catKeys.filter(k => !vocalByCat[k]);
    if (missing.length) lines.push(`${b(missing.map(k=>VOCAL_CATS[k].label).join("·"))}은 이번 주 미연습. 균형 있는 훈련을 추천합니다.`);
  }
  lines.push(`</div>`);

  // 회고
  lines.push(`<div class="rv-fb-section"><div class="rv-fb-head">📓 회고</div>`);
  lines.push(journals.length >= 5 ? `${b(journals.length + "회")} 작성 — 자기성찰이 루틴화됐습니다.`
    : journals.length >= 2 ? `${b(journals.length + "회")} 작성 — 꾸준히 쓰면 패턴이 보입니다.`
    : journals.length === 1 ? "1회 작성 — 최소 주 3회를 목표로 하세요."
    : "미작성 — 5분 일기로 이번 주를 마무리하세요.");
  lines.push(`</div>`);

  // 다음 주 과제
  const tasks = [];
  if (worstH && worstH.pct < 70) tasks.push(`${worstH.name} 습관: 매일 같은 시간·장소에서 실행`);
  if (wkSessions.length < 2) tasks.push("운동 세션 최소 2회 완료 후 앱에 기록");
  if (studyMin < 60) tasks.push("하루 20분씩 공부 — 과목 1개 집중");
  if (vocalMin < 60) tasks.push("노래 연습 주 3회 이상 (호흡·발성·노래 균형)");
  if (journals.length === 0) tasks.push("주 3회 회고 작성 — 못한 이유 1줄이면 충분");
  if (tasks.length === 0) tasks.push("현재 루틴 유지하면서 강도를 10% 올리기");
  lines.push(`<div class="rv-fb-section"><div class="rv-fb-head">🎯 다음 주 실행 과제</div>`);
  lines.push(tasks.slice(0,3).map((t,i) => `${i+1}. ${t}`).join("<br>"));
  lines.push(`</div>`);

  state.reviewAi = lines.join("\n");
  out.innerHTML = state.reviewAi;
}

/* ============================================================
   D-Day
============================================================ */
function ddayRows() { return DB.all("ddays"); }
// 다음 발생일 계산 (반복이면 올해/내년 중 가까운 미래, 아니면 지정일)
function ddayNext(dd) {
  const target = parseD(dd.date);
  if (!dd.repeat) return dd.date;
  const now = today();
  let y = now.getFullYear();
  const mk = (yy) => new Date(yy, target.getMonth(), target.getDate());
  let cand = mk(y);
  if (fmt(cand) < todayStr()) cand = mk(y + 1);
  return fmt(cand);
}
function ddayDiff(dd) { return diffDays(todayStr(), ddayNext(dd)); } // +면 미래(D-n), 0=오늘, -면 과거

function viewDday() {
  const rows = ddayRows().map(dd => ({ dd, next: ddayNext(dd), diff: ddayDiff(dd) }))
    .sort((a, b) => Math.abs(a.diff) - Math.abs(b.diff) || a.diff - b.diff);
  const upcoming = rows.filter(r => r.diff >= 0);

  const stat = `<div class="stat-grid" style="grid-template-columns:repeat(3,1fr)">
    <div class="stat"><div class="lb">📌 등록</div><div class="vl">${rows.length}<small>개</small></div></div>
    <div class="stat"><div class="lb">⏳ 다가오는</div><div class="vl">${upcoming.length}<small>개</small></div></div>
    <div class="stat"><div class="lb">🎯 가장 가까운</div><div class="vl">${upcoming[0] ? (upcoming[0].diff === 0 ? "D-DAY" : "D-" + upcoming[0].diff) : "—"}</div></div>
  </div>`;

  const addBtn = `<button class="add-grp" data-act="dday-new" style="margin:6px 0 18px">+ D-Day 추가</button>`;

  const cards = rows.length ? rows.map(({ dd, next, diff }) => {
    const label = diff === 0 ? "D-DAY" : diff > 0 ? `D-${diff}` : `D+${-diff}`;
    const cls = diff === 0 ? "today" : diff > 0 ? "" : "past";
    const emoji = dd.emoji || "📌";
    // 진행 바(시작일이 있으면 경과율)
    let prog = "";
    if (dd.startDate && diff > 0) {
      const total = diffDays(dd.startDate, next);
      const gone = diffDays(dd.startDate, todayStr());
      const pct = total > 0 ? Math.max(0, Math.min(100, Math.round(gone / total * 100))) : 0;
      prog = `<div class="dday-prog"><div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div><span>${pct}%</span></div>`;
    }
    return `<div class="dday-card ${cls}">
      <div class="dday-emoji">${esc(emoji)}</div>
      <div class="dday-body">
        <div class="dday-title">${esc(dd.title)}${dd.repeat ? ' <span class="dday-rep">매년</span>' : ""}</div>
        <div class="dday-date">${next} (${DOW[parseD(next).getDay()]})${diff < 0 ? " · 지남" : ""}</div>
        ${prog}
      </div>
      <div class="dday-count ${cls}">${label}</div>
      <button class="card-menu" style="opacity:1" data-act="dday-menu" data-id="${dd.id}">⋯</button>
    </div>`;
  }).join("") : `<div class="empty" style="padding:44px 20px"><div class="big">📌</div><h3>D-Day가 없습니다</h3><p>시험·발표·기념일 등 중요한 날을 등록해 카운트다운하세요.</p></div>`;

  return `${stat}${addBtn}<div class="grp-title">D-Day <span class="count">${rows.length}</span></div>${cards}`;
}
function wireDday() {}

function ddayModal(existing) {
  const dd = existing || { title: "", date: todayStr(), emoji: "📌", repeat: false, startDate: "" };
  const emojis = ["📌", "🎯", "🎂", "💍", "✈️", "📝", "🎓", "🏆", "💼", "❤️", "🎉", "🩺", "🎤", "🏋️"];
  openModal(`<div class="modal" style="max-width:460px">
    <div class="modal-head"><h3>${existing ? "D-Day 수정" : "D-Day 추가"}</h3><button class="icon-btn" data-act="close">✕</button></div>
    <div class="modal-body">
      <div class="mrow"><label>아이콘</label><div class="ctl"><div class="dday-emoji-pick">${emojis.map(e => `<button type="button" data-emj="${e}" class="${dd.emoji === e ? "on" : ""}">${e}</button>`).join("")}</div></div></div>
      <div class="mrow"><label>제목</label><div class="ctl"><input type="text" id="ddTitle" value="${esc(dd.title)}" placeholder="예: 정보처리기사 시험" /></div></div>
      <div class="mrow"><label>날짜</label><div class="ctl"><input type="date" id="ddDate" value="${dd.date}" /></div></div>
      <div class="mrow"><label>시작일</label><div class="ctl"><input type="date" id="ddStart" value="${dd.startDate || ""}" /><div style="font-size:11.5px;color:#9CA3AF;margin-top:4px">입력 시 목표일까지 경과율 바가 표시됩니다 (선택)</div></div></div>
      <label class="mcheck"><input type="checkbox" id="ddRepeat" ${dd.repeat ? "checked" : ""} /> 매년 반복 (생일·기념일 등)</label>
    </div>
    <div class="modal-foot"><button class="btn-cancel" data-act="close">취소</button><button class="btn-save" id="ddSave">저장</button></div>
  </div>`);
  let emoji = dd.emoji;
  $(".dday-emoji-pick").onclick = e => { const b = e.target.closest("[data-emj]"); if (!b) return; emoji = b.dataset.emj; $$(".dday-emoji-pick button").forEach(x => x.classList.remove("on")); b.classList.add("on"); };
  $("#ddSave").onclick = async () => {
    const title = $("#ddTitle").value.trim();
    if (!title) return toast("제목을 입력하세요.");
    if (!$("#ddDate").value) return toast("날짜를 선택하세요.");
    const id = existing?.id || uid();
    await DB.set("ddays", id, { title, date: $("#ddDate").value, emoji, repeat: $("#ddRepeat").checked, startDate: $("#ddStart").value || "", createdAt: existing?.createdAt || Date.now() });
    await DB.log(existing ? "edit" : "create", `D-Day "${title}" ${existing ? "수정" : "추가"}`);
    closeModal(); render();
  };
}

/* ============================================================
   Google Calendar 양방향 연동 (서버리스 · GIS 토큰 방식)
============================================================ */
const GCal = {
  token: null,
  tokenClient: null,
  gapiReady: false,
  events: [],
  connected: false,

  configured() { return !!GOOGLE_CLIENT_ID; },

  async initGapi() {
    if (this.gapiReady) return;
    await new Promise((res, rej) => {
      if (!window.gapi) return rej(new Error("gapi 미로딩 — 인터넷/스크립트 로딩 확인"));
      gapi.load("client", async () => {
        await gapi.client.init({ discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"] });
        this.gapiReady = true; res();
      });
    });
  },

  initTokenClient() {
    if (this.tokenClient) return;
    this.tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: GCAL_SCOPE,
      callback: (resp) => {
        if (resp.error) { toast("구글 인증 실패: " + resp.error); return; }
        this.token = { access_token: resp.access_token, expiresAt: Date.now() + (resp.expires_in || 3600) * 1000 };
        this.connected = true;
        sessionStorage.setItem("gcal_token", JSON.stringify(this.token));
        gapi.client.setToken({ access_token: resp.access_token });
        if (this._afterAuth) { const cb = this._afterAuth; this._afterAuth = null; cb(); }
      }
    });
  },

  tokenValid() { return this.token && this.token.expiresAt > Date.now() + 5000; },

  async ensureAuth(cb) {
    if (!this.configured()) { toast("먼저 코드 상단 GOOGLE_CLIENT_ID를 설정하세요."); return; }
    try { await this.initGapi(); } catch (e) { toast(e.message); return; }
    this.initTokenClient();
    if (!this.token) { try { const s = JSON.parse(sessionStorage.getItem("gcal_token")); if (s) this.token = s; } catch {} }
    if (this.tokenValid()) { gapi.client.setToken({ access_token: this.token.access_token }); this.connected = true; cb && cb(); return; }
    this._afterAuth = cb;
    this.tokenClient.requestAccessToken({ prompt: this.token ? "" : "consent" });
  },

  disconnect() {
    if (this.token?.access_token && window.google) {
      try { google.accounts.oauth2.revoke(this.token.access_token, () => {}); } catch {}
    }
    this.token = null; this.connected = false; this.events = [];
    sessionStorage.removeItem("gcal_token");
    toast("구글 캘린더 연결을 해제했습니다."); render();
  },

  async fetchEvents(ym) {
    return new Promise((resolve) => {
      this.ensureAuth(async () => {
        try {
          const [y, m] = (ym || todayStr().slice(0, 7)).split("-").map(Number);
          const timeMin = new Date(y, m - 2, 1).toISOString();
          const timeMax = new Date(y, m + 1, 0).toISOString();
          const resp = await gapi.client.calendar.events.list({
            calendarId: "primary", timeMin, timeMax, singleEvents: true, orderBy: "startTime", maxResults: 250
          });
          this.events = (resp.result.items || []).map(ev => {
            const start = ev.start?.date || (ev.start?.dateTime ? ev.start.dateTime.slice(0, 10) : null);
            return start ? { id: ev.id, title: ev.summary || "(제목 없음)", date: start, htmlLink: ev.htmlLink } : null;
          }).filter(Boolean);
          resolve(this.events);
        } catch (e) { console.error(e); toast("일정 불러오기 실패"); resolve([]); }
      });
    });
  },

  async pushEvent({ title, date, allDay = true, description = "" }) {
    return new Promise((resolve) => {
      this.ensureAuth(async () => {
        try {
          const body = { summary: title, description, start: { date }, end: { date } };
          const resp = await gapi.client.calendar.events.insert({ calendarId: "primary", resource: body });
          toast("구글 캘린더에 추가했습니다.");
          resolve(resp.result);
        } catch (e) { console.error(e); toast("추가 실패"); resolve(null); }
      });
    });
  }
};

/* ============================================================
   달력 — 습관·할일·운동·몸무게·목표·D-Day·구글 통합 월간 뷰
============================================================ */
function calendarEvents(ds) {
  const evs = [];
  const habits = DB.all("habits").filter(h => !h.archived);
  const due = habits.filter(h => isActiveOn(h, ds));
  const done = due.filter(h => isChecked(h.id, ds));
  if (due.length) evs.push({ type: "habit", label: `습관 ${done.length}/${due.length}`, done: done.length === due.length });
  DB.all("todos").filter(t => t.due === ds).forEach(t => evs.push({ type: "todo", label: t.title, done: t.done }));
  DB.all("workouts").filter(w => w.date === ds).forEach(w => evs.push({ type: "workout", label: "운동 " + (w.type || "세션") }));
  const wt = DB.get("weights", "w_" + ds); if (wt) evs.push({ type: "weight", label: wt.kg + "kg" });
  DB.all("goals").filter(g => g.due === ds).forEach(g => evs.push({ type: "goal", label: "목표: " + g.title }));
  DB.all("ddays").forEach(dd => { if (ddayNext(dd) === ds) evs.push({ type: "dday", label: (dd.emoji || "📌") + " " + dd.title }); });
  DB.all("journal").filter(j => j.date === ds).forEach(() => evs.push({ type: "journal", label: "회고" }));
  GCal.events.filter(g => g.date === ds).forEach(g => evs.push({ type: "gcal", label: g.title, link: g.htmlLink }));
  return evs;
}
const CAL_DOT_COLOR = { habit: "#22C55E", todo: "#0C66E4", workout: "#F59E0B", weight: "#8B5CF6", goal: "#EC4899", dday: "#EF4444", journal: "#14B8A6", gcal: "#4285F4" };


function viewCalendar() {
  const ym = state.calYMonth || todayStr().slice(0, 7);
  const [y, m] = ym.split("-").map(Number);
  const first = new Date(y, m - 1, 1);
  const start = weekStartOf(first);
  const t = todayStr();
  const sel = state.calSelDay || t;

  let cells = "";
  for (let i = 0; i < 42; i++) {
    const d = addDays(start, i), ds = fmt(d);
    const out = d.getMonth() !== m - 1;
    const evs = calendarEvents(ds);
    const types = [...new Set(evs.map(e => e.type))];
    const dots = types.slice(0, 5).map(tp => `<span class="cal2-dot" style="background:${CAL_DOT_COLOR[tp]}"></span>`).join("");
    cells += `<div class="cal2-cell ${out ? "out" : ""} ${ds === t ? "today" : ""} ${ds === sel ? "sel" : ""}" data-act="cal2-day" data-date="${ds}">
      <div class="cal2-n">${d.getDate()}</div>
      <div class="cal2-dots">${dots}</div>
    </div>`;
  }

  // 선택일 상세
  const selEvs = calendarEvents(sel);
  const typeName = { habit: "습관", todo: "할 일", workout: "운동", weight: "몸무게", goal: "목표", dday: "D-Day", journal: "회고", gcal: "구글" };
  const detail = `<div class="cal2-detail">
    <div class="cal2-detail-head">
      <span>${sel} (${DOW[parseD(sel).getDay()]})</span>
      <button class="btn-ghost" data-act="gcal-push-day" data-date="${sel}" style="margin-left:auto;padding:6px 12px;font-size:12px">이 날 항목 → 구글로</button>
    </div>
    ${selEvs.length ? selEvs.map(e => `<div class="cal2-ev">
        <span class="cal2-ev-dot" style="background:${CAL_DOT_COLOR[e.type]}"></span>
        <span class="cal2-ev-txt ${e.done ? "cal2-done" : ""}">${e.link ? `<a href="${esc(e.link)}" target="_blank" rel="noopener">${esc(e.label)}</a>` : esc(e.label)}</span>
        <span class="cal2-ev-type">${typeName[e.type]}</span>
      </div>`).join("") : `<div class="td-empty-sub">이 날은 기록이 없습니다.</div>`}
  </div>`;

  const legendItems = { habit: "습관", todo: "할 일", workout: "운동", weight: "몸무게", goal: "목표", dday: "D-Day", journal: "회고", gcal: "구글" };
  const legend = `<div class="cal2-legend">${Object.entries(legendItems).map(([k, v]) => `<span class="cal2-leg"><span class="cal2-dot" style="background:${CAL_DOT_COLOR[k]}"></span>${v}</span>`).join("")}</div>`;

  // 구글 연동 바
  const gbar = `<div class="gcal-bar">
    <span class="gcal-logo">📅</span>
    <div class="gcal-status">
      <div class="gcal-title">Google 캘린더 ${GCal.connected ? '<span class="gcal-on">연결됨</span>' : ""}</div>
      <div class="gcal-sub">${!GCal.configured() ? "코드 상단 GOOGLE_CLIENT_ID 설정 필요" : GCal.connected ? `${GCal.events.length}개 일정 표시 중` : "연결하면 구글 일정을 함께 볼 수 있어요"}</div>
    </div>
    ${GCal.configured() ? (GCal.connected
      ? `<button class="btn-ghost" data-act="gcal-refresh">새로고침</button><button class="btn-ghost danger" data-act="gcal-disconnect">해제</button>`
      : `<button class="btn-save" data-act="gcal-connect" style="padding:8px 16px">구글 연결</button>`) : ""}
  </div>`;

  return `
  ${gbar}
  <div class="cal2-top">
    <button class="cal-nav" data-act="cal2-prev">‹</button>
    <div class="cal2-title">${y}년 ${m}월</div>
    <button class="cal-nav" data-act="cal2-next">›</button>
    <button class="btn-ghost" data-act="cal2-today" style="margin-left:auto">오늘</button>
  </div>
  ${legend}
  <div class="cal2-grid-head">${DOW_MON.map(d => `<div class="cal2-dow">${d}</div>`).join("")}</div>
  <div class="cal2-grid">${cells}</div>
  ${detail}`;
}
function wireCalendar() {
  // 연결된 상태로 진입 시 자동으로 일정 로드 (아직 안 불러왔을 때)
  if (GCal.configured() && GCal.tokenValid() && !GCal._loadedFor) {
    GCal._loadedFor = state.calYMonth || todayStr().slice(0, 7);
    GCal.fetchEvents(GCal._loadedFor).then(() => render());
  }
}

/* ============================================================
   노래 (보컬 연습 관리)
============================================================ */
const SONG_STATUS = { learning: "배우는 중", practicing: "연습 중", done: "완성" };
const SONG_STATUS_COLOR = { learning: "#F59E0B", practicing: "#0C66E4", done: "#22C55E" };
const STAR = (n) => "★★★★★☆☆☆☆☆".slice(5 - Math.max(0, Math.min(5, n)), 10 - Math.max(0, Math.min(5, n)));

function songRows() {
  return DB.all("songs").sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || (b.createdAt || 0) - (a.createdAt || 0));
}
function songTotalMin(s) { return (s.sessions || []).reduce((m, x) => m + (Number(x.minutes) || 0), 0); }

/* 음이름 → 주파수(Hz). A4=440 기준 12평균율 */
const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
function noteToHz(note) {
  const m = String(note).trim().match(/^([A-Ga-g])(#|b)?(-?\d)$/);
  if (!m) return null;
  let idx = NOTE_NAMES.indexOf(m[1].toUpperCase());
  if (m[2] === "#") idx += 1; if (m[2] === "b") idx -= 1;
  const oct = Number(m[3]);
  const n = idx + (oct + 1) * 12; // MIDI 번호
  return +(440 * Math.pow(2, (n - 69) / 12)).toFixed(2);
}
function hzToNote(hz) {
  if (!hz || hz <= 0) return "";
  const n = Math.round(69 + 12 * Math.log2(hz / 440));
  const name = NOTE_NAMES[((n % 12) + 12) % 12], oct = Math.floor(n / 12) - 1;
  return name + oct;
}
function pitchRows() { return DB.all("pitches").sort((a, b) => (a.date || "").localeCompare(b.date || "") || (a.createdAt || 0) - (b.createdAt || 0)); }

/* 보컬 연습 카테고리 정의 */
const VOCAL_CAT_DEFAULTS = [
  { id: "breath", label: "호흡", emoji: "🫁", color: "#0EA5E9", desc: "복식호흡·롱톤·숨 배분 연습" },
  { id: "voice",  label: "발성", emoji: "🎤", color: "#8B5CF6", desc: "스케일·믹스보이스·공명 연습" },
  { id: "ear",    label: "청음", emoji: "🎧", color: "#F59E0B", desc: "음정 듣기·화음·음감 훈련" },
  { id: "sing",   label: "노래", emoji: "🎵", color: "#22C55E", desc: "곡 부르기·표현·무대 연습" }
];
// 구버전 VOCAL_CATS 호환
const VOCAL_CATS = {
  breath: { label: "호흡", emoji: "🫁", color: "#0EA5E9", hint: "복식호흡·롱톤·숨 배분 연습" },
  voice:  { label: "발성", emoji: "🎤", color: "#8B5CF6", hint: "스케일·믹스보이스·공명 연습" },
  ear:    { label: "청음", emoji: "🎧", color: "#F59E0B", hint: "음정 듣기·화음·음감 훈련" },
  sing:   { label: "노래", emoji: "🎵", color: "#22C55E", hint: "곡 부르기·표현·무대 연습" }
};

function getVocalCats() {
  const saved = DB.all("vocalCats").sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  if (saved.length) return saved;
  return VOCAL_CAT_DEFAULTS;
}
function getVocalCat(id) {
  const cats = getVocalCats();
  return cats.find(c => c.id === id) || { id, label: id, emoji: "🎤", color: "#6B7280", desc: "" };
}

function vocalRows(cat) { return DB.all("vocal").filter(v => v.cat === cat).sort((a, b) => (a.date || "").localeCompare(b.date || "") || (a.createdAt || 0) - (b.createdAt || 0)); }
function allVocalRows() { return DB.all("vocal").sort((a, b) => (b.date || "").localeCompare(a.date || "") || (b.createdAt || 0) - (a.createdAt || 0)); }

function viewSong() {
  const t = todayStr();
  const from = state.songFrom;
  const to   = state.songTo;
  const cats = getVocalCats();

  // 날짜 필터된 전체 기록
  let allRows = allVocalRows();
  if (from) allRows = allRows.filter(r => r.date >= from);
  if (to)   allRows = allRows.filter(r => r.date <= to);

  // 날짜 조회 바
  const dateBar = `<div class="todo-date-filter" style="margin-bottom:14px">
    <span style="font-size:12.5px;color:#6B7280;font-weight:600">📅 날짜 조회</span>
    <input type="date" id="songFrom" value="${from}" />
    <span style="color:#C4C9D0;font-size:13px">~</span>
    <input type="date" id="songTo" value="${to}" max="${t}" />
    ${from||to ? `<button class="btn-ghost" data-act="song-date-clear" style="padding:4px 10px;font-size:12px">✕ 초기화</button>` : ""}
  </div>`;

  // 카테고리별 요약 카드 — 항상 전체 너비 균등 분할
  const summary = `<div class="song-cat-summary" style="grid-template-columns:repeat(${cats.length + 1}, 1fr)">
    ${cats.map(c => {
      const rows = allRows.filter(r => r.cat === c.id);
      const min  = rows.reduce((s, r) => s+(Number(r.minutes)||0), 0);
      const avg  = rows.length ? (rows.reduce((s,r)=>s+(Number(r.rating)||0),0)/rows.length).toFixed(1) : "-";
      return `<div class="song-cat-card" style="border-left:3px solid ${c.color}">
        <div class="song-cat-card-head">
          <span class="song-cat-emoji">${c.emoji}</span>
          <span class="song-cat-label">${esc(c.label)}</span>
        </div>
        <div class="song-cat-stat" style="color:${c.color}">${(min/60).toFixed(1)}<small>h</small></div>
        <div class="song-cat-sub">${rows.length}회 · ⭐${avg}</div>
        ${c.desc ? `<div class="song-cat-desc">${esc(c.desc)}</div>` : ""}
      </div>`;
    }).join("")}
    <button class="song-cat-add-btn" data-act="vocal-cat-manage">⚙<br><span style="font-size:11px">카테고리</span></button>
  </div>`;

  // 기록 버튼 — 클릭 시 카테고리 선택 모달
  const input = `<div style="margin-bottom:18px">
    <button class="btn-save" data-act="vocal-record-modal" style="width:100%;height:48px;font-size:15px;border-radius:12px">
      + 연습 기록하기
    </button>
  </div>`;

  // 전체 기록 목록 (카테고리 뱃지 포함)
  const list = allRows.length ? allRows.map(r => {
    const rc = getVocalCat(r.cat);
    return `<div class="vocal-log" style="align-items:flex-start">
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;flex-wrap:wrap">
          <span class="vocal-log-date">${r.date} <span class="w-dow">(${DOW[parseD(r.date).getDay()]})</span></span>
          <span style="font-size:11.5px;font-weight:700;background:${rc.color}18;color:${rc.color};border-radius:5px;padding:1px 8px">${rc.emoji} ${esc(rc.label)}</span>
          ${r.minutes ? `<span class="vocal-log-min">${r.minutes}분</span>` : ""}
          <span class="vocal-log-star">${r.rating ? "★".repeat(r.rating)+"☆".repeat(5-r.rating) : ""}</span>
        </div>
        ${r.note ? `<div class="vocal-log-note" style="white-space:pre-wrap;word-break:break-word">${esc(r.note)}</div>` : ""}
      </div>
      <div style="display:flex;gap:3px;flex-shrink:0;margin-left:6px">
        <button class="icon-btn" style="opacity:1;width:26px;height:26px" data-act="vocal-copy" data-id="${r.id}" title="복사">⧉</button>
        <button class="icon-btn" style="opacity:1;width:26px;height:26px" data-act="vocal-edit" data-id="${r.id}" title="수정">✎</button>
        <button class="sub-x" data-act="vocal-del" data-id="${r.id}">✕</button>
      </div>
    </div>`;
  }).join("") : `<div class="empty" style="padding:36px 20px"><div class="big">🎤</div><h3>연습 기록이 없습니다</h3><p>위에서 카테고리를 선택하고 기록하세요.</p></div>`;

  return `${dateBar}${summary}${input}
    <div class="grp-title">전체 기록 <span class="count">${allRows.length}</span></div>
    <div class="vocal-list">${list}</div>`;
}

/* 날짜 필터 적용된 vocalSection */
function vocalSectionFiltered(cat, rows) {
  const c = VOCAL_CATS[cat] || VOCAL_CATS.sing;
  const allMin = rows.reduce((m, r) => m + (Number(r.minutes) || 0), 0);
  const weekAgo = fmt(addDays(today(), -6));
  const weekMin = rows.filter(r => r.date >= weekAgo).reduce((m, r) => m + (Number(r.minutes) || 0), 0);
  const avgRating = rows.length ? (rows.reduce((s, r) => s + (Number(r.rating) || 0), 0) / rows.length).toFixed(1) : "-";

  const stat = `<div class="song-stat">
    <div class="ss"><div class="ss-lb">⏱ 누적</div><div class="ss-val">${(allMin/60).toFixed(1)}<small>시간</small></div></div>
    <div class="ss"><div class="ss-lb">📅 이번 주</div><div class="ss-val">${weekMin}<small>분</small></div></div>
    <div class="ss"><div class="ss-lb">⭐ 평균 만족도</div><div class="ss-val">${avgRating}<small>/5</small></div></div>
  </div>`;

  // 14일 추이 막대
  const bars = Array.from({length:14}, (_,i) => {
    const ds = fmt(addDays(today(), i-13));
    const m = rows.filter(r=>r.date===ds).reduce((s,r)=>s+(Number(r.minutes)||0),0);
    const h = Math.max(2, Math.round(m/60*40));
    return `<div class="db-bar" title="${ds}: ${m}분"><div class="db-bar-fill" style="height:${m?h:2}px;background:${c.color};opacity:${m?1:0.15}"></div></div>`;
  }).join("");
  const trend = `<div class="pitch-card" style="margin-bottom:14px"><div class="grp-title" style="margin-bottom:6px">최근 14일 ${c.label} 연습</div><div class="db-bars" style="height:46px">${bars}</div></div>`;

  const input = `<div class="pitch-input" style="border-color:${c.color}33">
    <div class="pitch-row">
      <div class="w-field"><label>날짜</label><input type="date" id="vDate" value="${todayStr()}" max="${todayStr()}" /></div>
      <div class="w-field" style="flex:0 0 90px"><label>시간(분)</label><input type="number" id="vMin" min="0" placeholder="30" /></div>
      <div class="w-field" style="flex:0 0 auto"><label>만족도</label><div class="song-star-pick" id="vStar">${[1,2,3,4,5].map(n=>`<button data-star="${n}">☆</button>`).join("")}</div></div>
      <button class="btn-save" id="vSave" style="align-self:flex-end;height:42px">기록</button>
    </div>
    <textarea id="vNote" rows="3" placeholder="${c.hint} — 오늘 한 내용, 느낀 점 (줄바꿈 가능)" style="width:100%;border:1px solid #E4E6EA;border-radius:9px;padding:10px 12px;margin-top:10px;resize:vertical;line-height:1.6;font-family:inherit;font-size:14px"></textarea>
  </div>`;

  const list = rows.length ? rows.map(r => `<div class="vocal-log" style="align-items:flex-start">
    <div style="flex:1;min-width:0">
      <span class="vocal-log-date">${r.date} <span class="w-dow">(${DOW[parseD(r.date).getDay()]})</span></span>
      ${r.minutes ? `<span class="vocal-log-min">${r.minutes}분</span>` : ""}
      <span class="vocal-log-star">${r.rating ? "★".repeat(r.rating)+"☆".repeat(5-r.rating) : ""}</span>
      <div class="vocal-log-note" style="white-space:pre-wrap;word-break:break-word">${esc(r.note||"")}</div>
    </div>
    <div style="display:flex;gap:3px;flex-shrink:0;margin-left:6px">
      <button class="icon-btn" style="opacity:1;width:26px;height:26px" data-act="vocal-copy" data-id="${r.id}" title="복사">⧉</button>
      <button class="icon-btn" style="opacity:1;width:26px;height:26px" data-act="vocal-edit" data-id="${r.id}" title="수정">✎</button>
      <button class="sub-x" data-act="vocal-del" data-id="${r.id}">✕</button>
    </div>
  </div>`).join("") : `<div class="empty" style="padding:40px 20px"><div class="big">${c.emoji}</div><h3>${c.label} 연습 기록이 없습니다</h3><p>${c.hint}</p></div>`;

  return `${stat}${trend}${input}<div class="grp-title" style="margin-top:18px">${c.label} 기록 <span class="count">${rows.length}</span></div><div class="vocal-list">${list}</div>`;
}

/* 호흡·발성·청음·노래 공통 연습 섹션 */
function vocalSection(cat) {
  const c = VOCAL_CATS[cat] || VOCAL_CATS.sing;
  const rows = vocalRows(cat).slice().reverse();
  const allMin = rows.reduce((m, r) => m + (Number(r.minutes) || 0), 0);
  const weekAgo = fmt(addDays(today(), -6));
  const weekMin = rows.filter(r => r.date >= weekAgo).reduce((m, r) => m + (Number(r.minutes) || 0), 0);
  const ratings = rows.filter(r => r.rating).map(r => r.rating);
  const avgRating = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length) : null;

  // 최근 14일 연습 시간 미니 바
  const days14 = [];
  for (let i = 13; i >= 0; i--) {
    const ds = fmt(addDays(today(), -i));
    const min = rows.filter(r => r.date === ds).reduce((m, r) => m + (Number(r.minutes) || 0), 0);
    days14.push({ ds, min });
  }
  const maxMin = Math.max(1, ...days14.map(d => d.min));
  const bars = days14.map(d => {
    const h = d.min ? Math.max(6, Math.round(d.min / maxMin * 50)) : 3;
    return `<div class="db-bar" title="${d.ds} · ${d.min}분"><div class="db-bar-fill" style="height:${h}px;opacity:${d.min ? 1 : 0.25};background:${c.color}"></div></div>`;
  }).join("");

  const stat = `<div class="stat-grid" style="grid-template-columns:repeat(3,1fr)">
    <div class="stat"><div class="lb">⏱ 누적</div><div class="vl">${(allMin / 60).toFixed(1)}<small>시간</small></div></div>
    <div class="stat"><div class="lb">📅 이번 주</div><div class="vl">${weekMin}<small>분</small></div></div>
    <div class="stat"><div class="lb">⭐ 평균 만족도</div><div class="vl">${avgRating != null ? avgRating.toFixed(1) : "—"}<small>/5</small></div></div>
  </div>`;

  const trend = `<div class="db-trend-card" style="margin-bottom:16px">
    <div class="db-card-title">최근 14일 ${c.label} 연습</div>
    <div class="db-bars">${bars}</div>
  </div>`;

  const input = `<div class="pitch-input" style="border-color:${c.color}33">
    <div class="pitch-row">
      <div class="w-field"><label>날짜</label><input type="date" id="vDate" value="${todayStr()}" max="${todayStr()}" /></div>
      <div class="w-field" style="flex:0 0 90px"><label>시간(분)</label><input type="number" id="vMin" min="0" placeholder="30" /></div>
      <div class="w-field" style="flex:0 0 auto"><label>만족도</label><div class="song-star-pick" id="vStar">${[1,2,3,4,5].map(n => `<button data-star="${n}">☆</button>`).join("")}</div></div>
      <button class="btn-save" id="vSave" style="align-self:flex-end;height:42px">기록</button>
    </div>
    <textarea id="vNote" rows="3" placeholder="${c.hint} — 오늘 한 내용, 느낀 점 (줄바꿈 가능)" style="width:100%;border:1px solid #E4E6EA;border-radius:9px;padding:10px 12px;margin-top:10px;resize:vertical;line-height:1.6;font-family:inherit;font-size:14px"></textarea>
  </div>`;

  const list = rows.length ? rows.slice(0, 60).map(r => `<div class="vocal-log" style="align-items:flex-start">
      <div class="vocal-log-date" style="padding-top:2px">${r.date} <span class="w-dow">(${DOW[parseD(r.date).getDay()]})</span></div>
      <div class="vocal-log-min" style="padding-top:2px">${r.minutes ? r.minutes + "분" : ""}</div>
      <div class="vocal-log-star" style="padding-top:3px">${r.rating ? STAR(r.rating) : ""}</div>
      <div class="vocal-log-note" style="white-space:pre-wrap;word-break:break-word;overflow:visible">${esc(r.note || "")}</div>
      <div style="display:flex;gap:3px;flex-shrink:0;margin-left:4px">
        <button class="icon-btn" style="opacity:1;width:26px;height:26px" data-act="vocal-copy" data-id="${r.id}" title="복사">⧉</button>
        <button class="icon-btn" style="opacity:1;width:26px;height:26px" data-act="vocal-edit" data-id="${r.id}" title="수정">✎</button>
        <button class="sub-x" data-act="vocal-del" data-id="${r.id}" title="삭제">✕</button>
      </div>
    </div>`).join("") : `<div class="empty" style="padding:40px 20px"><div class="big">${c.emoji}</div><h3>${c.label} 연습 기록이 없습니다</h3><p>${c.hint}</p></div>`;

  return `${stat}${trend}${input}<div class="grp-title" style="margin-top:18px">${c.label} 기록 <span class="count">${rows.length}</span></div><div class="vocal-list">${list}</div>`;
}

function repertoireSection() {
  let songs = songRows();
  const q = (state.songQuery || "").toLowerCase().trim();
  if (q) songs = songs.filter(s => ((s.title || "") + " " + (s.artist || "")).toLowerCase().includes(q));

  const all = songRows();
  const totalMin = all.reduce((m, s) => m + songTotalMin(s), 0);
  const totalSessions = all.reduce((n, s) => n + (s.sessions || []).length, 0);
  const doneCount = all.filter(s => s.status === "done").length;

  const stat = `<div class="stat-grid" style="grid-template-columns:repeat(4,1fr)">
    <div class="stat"><div class="lb">🎵 곡</div><div class="vl">${all.length}<small>개</small></div></div>
    <div class="stat"><div class="lb">🎤 연습 세션</div><div class="vl">${totalSessions}<small>회</small></div></div>
    <div class="stat"><div class="lb">⏱ 누적 연습</div><div class="vl">${(totalMin / 60).toFixed(1)}<small>시간</small></div></div>
    <div class="stat"><div class="lb">✅ 완성곡</div><div class="vl">${doneCount}<small>곡</small></div></div>
  </div>`;

  const searchBar = `<div class="wk-filter">
    <div class="wk-search">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
      <input type="text" id="songQuery" placeholder="곡·아티스트 검색" value="${esc(state.songQuery || "")}" />
    </div>
    ${q ? `<button class="btn-ghost" data-act="song-clear">초기화</button>` : ""}
  </div>`;

  const addBtn = `<button class="add-grp" data-act="song-new" style="margin:6px 0 16px">+ 곡 추가</button>`;

  const list = songs.length ? songs.map(s => {
    const sessions = (s.sessions || []).slice().sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    const min = songTotalMin(s);
    const lastRating = sessions[0]?.rating || 0;
    const recent = sessions.slice(0, 3).map(se => `<div class="song-log">
        <span class="song-log-date">${se.date?.slice(5) || ""}</span>
        <span class="song-log-star">${STAR(se.rating || 0)}</span>
        <span class="song-log-txt">${se.minutes ? se.minutes + "분" : ""}${se.note ? " · " + esc(se.note) : ""}</span>
      </div>`).join("");
    return `<div class="song-card">
      <div class="song-head">
        <div class="song-cover" style="background:${SONG_STATUS_COLOR[s.status] || "#8A929E"}22;color:${SONG_STATUS_COLOR[s.status] || "#8A929E"}">🎵</div>
        <div class="song-main">
          <div class="song-title">${esc(s.title)}</div>
          <div class="song-artist">${esc(s.artist || "")}${s.key ? ` · Key ${esc(s.key)}` : ""}</div>
        </div>
        <span class="song-status" style="background:${SONG_STATUS_COLOR[s.status]}1a;color:${SONG_STATUS_COLOR[s.status]}">${SONG_STATUS[s.status] || "연습 중"}</span>
        <button class="card-menu" style="opacity:1" data-act="song-menu" data-id="${s.id}">⋯</button>
      </div>
      <div class="song-meta">
        <span>🎤 ${(s.sessions || []).length}회</span>
        <span>⏱ ${(min / 60).toFixed(1)}h</span>
        ${lastRating ? `<span class="song-rate">${STAR(lastRating)}</span>` : ""}
        ${s.range ? `<span>🎚 ${esc(s.range)}</span>` : ""}
      </div>
      <div class="song-loginput">
        <input type="number" class="song-min-in" data-id="${s.id}" placeholder="분" style="width:64px" />
        <div class="song-star-pick" data-id="${s.id}">${[1,2,3,4,5].map(n => `<button data-star="${n}" title="${n}점">☆</button>`).join("")}</div>
        <input type="text" class="song-note-in" data-id="${s.id}" placeholder="오늘 연습 메모…" />
        <button class="btn-ghost" data-act="song-log-add" data-id="${s.id}">기록</button>
      </div>
      ${recent ? `<div class="song-logs">${recent}</div>` : ""}
    </div>`;
  }).join("") : (q
    ? `<div class="empty" style="padding:40px 20px"><div class="big">🔍</div><h3>검색 결과가 없습니다</h3></div>`
    : `<div class="empty" style="padding:44px 20px"><div class="big">🎤</div><h3>등록된 곡이 없습니다</h3><p>연습 중인 노래를 추가하고 세션·음역대·셀프 평가를 기록하세요.</p></div>`);

  return `${stat}${searchBar}${addBtn}<div class="grp-title">곡 <span class="count">${songs.length}${q ? ` / ${all.length}` : ""}</span></div>${list}`;
}

/* 음정 트레이닝: 목표음 대비 실측 Hz 기록 + 추이 그래프 */
function pitchSection() {
  const rows = pitchRows();
  const targetNote = state.pitchTarget || "G3";
  const targetHz = noteToHz(targetNote) || 196;

  const forTarget = rows.filter(r => r.target === targetNote);
  const errs = forTarget.map(r => Math.abs(r.hz - (noteToHz(r.target) || targetHz)));
  const avgErr = errs.length ? (errs.reduce((a, b) => a + b, 0) / errs.length) : null;
  const bestErr = errs.length ? Math.min(...errs) : null;
  const last = forTarget[forTarget.length - 1];

  const stat = `<div class="stat-grid" style="grid-template-columns:repeat(4,1fr)">
    <div class="stat"><div class="lb">🎯 목표음</div><div class="vl" style="font-size:20px">${esc(targetNote)}<small>${targetHz}Hz</small></div></div>
    <div class="stat"><div class="lb">📊 평균 오차</div><div class="vl">${avgErr != null ? avgErr.toFixed(1) : "—"}<small>Hz</small></div></div>
    <div class="stat"><div class="lb">🏆 최소 오차</div><div class="vl">${bestErr != null ? bestErr.toFixed(1) : "—"}<small>Hz</small></div></div>
    <div class="stat"><div class="lb">🎤 최근</div><div class="vl">${last ? last.hz : "—"}<small>Hz</small></div></div>
  </div>`;

  const presets = ["C3", "E3", "G3", "A3", "C4", "E4", "G4", "A4"];
  const input = `<div class="pitch-input">
    <div class="pitch-row">
      <div class="w-field"><label>목표음</label>
        <select id="pTarget">${presets.map(n => `<option ${n === targetNote ? "selected" : ""}>${n} · ${noteToHz(n)}Hz</option>`).join("")}</select>
      </div>
      <div class="w-field"><label>실측 주파수 (Hz)</label><input type="number" id="pHz" step="0.1" placeholder="예: 185.0" /></div>
      <button class="btn-save" id="pSave" style="align-self:flex-end;height:42px">기록</button>
    </div>
    <div class="pitch-hint">💡 목표음을 소리 내고, 튜너 앱이나 녹음 분석으로 나온 실제 Hz를 입력하세요. 오차가 줄어드는 추이를 추적합니다.</div>
  </div>`;

  const chart = forTarget.length >= 1 ? pitchChart(forTarget, targetHz) :
    `<div class="empty" style="padding:40px 20px"><div class="big">🎼</div><h3>${targetNote} 기록이 없습니다</h3><p>목표음을 정하고 실측 Hz를 입력하면 추이가 그려집니다.</p></div>`;

  const listRows = forTarget.slice().reverse().slice(0, 40).map(r => {
    const err = r.hz - (noteToHz(r.target) || targetHz);
    const cls = Math.abs(err) <= 3 ? "good" : Math.abs(err) <= 10 ? "" : "bad";
    return `<div class="pitch-log">
      <div class="pitch-log-date">${r.date} <span class="w-dow">(${DOW[parseD(r.date).getDay()]})</span></div>
      <div class="pitch-log-hz">${r.hz}Hz <span class="pitch-note">${hzToNote(r.hz)}</span></div>
      <div class="pitch-log-err ${cls}">${err > 0 ? "+" : ""}${err.toFixed(1)}Hz</div>
      <button class="sub-x" data-act="pitch-del" data-id="${r.id}">✕</button>
    </div>`;
  }).join("");

  return `${stat}${input}
    <div class="grp-title" style="margin-top:20px">${targetNote} 정확도 추이</div>${chart}
    <div class="grp-title" style="margin-top:22px">기록 <span class="count">${forTarget.length}</span></div>
    <div class="pitch-list">${listRows || `<div class="td-empty-sub">아직 기록이 없습니다.</div>`}</div>`;
}

function pitchChart(rows, targetHz) {
  const W = 720, H = 220, padL = 46, padR = 14, padT = 14, padB = 26;
  const data = rows.slice(-40);
  const hzs = data.map(r => r.hz);
  let min = Math.min(...hzs, targetHz), max = Math.max(...hzs, targetHz);
  const span = (max - min) || 10; min -= span * 0.2; max += span * 0.2;
  const n = data.length;
  const x = i => padL + (n <= 1 ? (W - padL - padR) / 2 : i * (W - padL - padR) / (n - 1));
  const y = hz => padT + (max - hz) / (max - min) * (H - padT - padB);
  let grid = "";
  for (let t = 0; t <= 4; t++) { const hz = min + (max - min) * t / 4, yy = y(hz);
    grid += `<line x1="${padL}" y1="${yy}" x2="${W - padR}" y2="${yy}" stroke="var(--wgrid)" stroke-width="1"/><text x="${padL - 8}" y="${yy + 4}" text-anchor="end" font-size="11" fill="var(--wtick)">${hz.toFixed(0)}</text>`; }
  const ty = y(targetHz);
  const targetLine = `<line x1="${padL}" y1="${ty}" x2="${W - padR}" y2="${ty}" stroke="#F59E0B" stroke-width="1.5" stroke-dasharray="5 4"/><text x="${W - padR}" y="${ty - 6}" text-anchor="end" font-size="11" fill="#F59E0B" font-weight="700">목표 ${targetHz}Hz</text>`;
  const pts = data.map((r, i) => `${x(i)},${y(r.hz)}`).join(" ");
  const dots = data.map((r, i) => { const err = Math.abs(r.hz - targetHz); const c = err <= 3 ? "#22C55E" : err <= 10 ? "#F59E0B" : "#EF4444";
    return `<circle cx="${x(i)}" cy="${y(r.hz)}" r="3.4" fill="${c}"><title>${r.date} · ${r.hz}Hz (오차 ${(r.hz - targetHz).toFixed(1)})</title></circle>`; }).join("");
  const idxs = n <= 1 ? [0] : [0, Math.floor((n - 1) / 2), n - 1];
  const xlabels = idxs.map(i => `<text x="${x(i)}" y="${H - 7}" text-anchor="middle" font-size="10.5" fill="var(--wtick)">${data[i].date.slice(5)}</text>`).join("");
  return `<div class="w-chart"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="width:100%;height:220px">
    ${grid}${targetLine}<polyline points="${pts}" fill="none" stroke="#8B5CF6" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>${dots}${xlabels}
  </svg></div>`;
}

function wireSong() {
  // 날짜 필터
  const sf = $("#songFrom"), st2 = $("#songTo");
  if (sf) sf.onchange = e => { state.songFrom = e.target.value; render(); };
  if (st2) st2.onchange = e => { state.songTo = e.target.value; render(); };

  // 카테고리 선택 시 state 업데이트
  const catSel = $("#vCat");
  if (catSel) catSel.onchange = e => { state.songSub = e.target.value; render(); };

  // 별점 선택
  $$(".song-star-pick").forEach(pick => {
    pick.onclick = e => {
      const b = e.target.closest("[data-star]"); if (!b) return;
      const n = Number(b.dataset.star);
      pick.dataset.selected = n;
      $$("button", pick).forEach((btn, i) => btn.textContent = i < n ? "★" : "☆");
    };
  });

  // 기록 저장
  const vSave = $("#vSave");
  if (vSave) vSave.onclick = async () => {
    const cat   = $("#vCat")?.value || state.songSub || "sing";
    const date  = $("#vDate")?.value || todayStr();
    const minutes = Number($("#vMin")?.value) || 0;
    const rating  = Number($("#vStar")?.dataset.selected) || 0;
    const note    = $("#vNote")?.value.trim() || "";
    if (!minutes && !rating && !note) return toast("시간·만족도·메모 중 하나는 입력하세요.");
    const c = getVocalCat(cat);
    await DB.set("vocal", uid(), { cat, date, minutes, rating, note, createdAt: Date.now() });
    await DB.log("edit", `${c.label} 연습 ${minutes ? minutes+"분" : ""} 기록`);
    toast("기록했습니다."); render();
  };

  // 음정 탭
  const sub = state.songSub || "";
  if (sub === "pitch") {
    const sel = $("#pTarget");
    if (sel) sel.onchange = e => { state.pitchTarget = e.target.value.split(" ")[0]; render(); };
    const savePitch = async () => {
      const target = ($("#pTarget")?.value || "G3").split(" ")[0];
      const hz = parseFloat($("#pHz")?.value);
      if (!(hz > 0)) return toast("실측 Hz를 입력하세요.");
      await DB.set("pitches", uid(), { date: todayStr(), target, hz: Math.round(hz * 10) / 10, createdAt: Date.now() });
      await DB.log("edit", `음정 ${target} · ${hz}Hz 기록`);
      state.pitchTarget = target; toast("기록했습니다."); render();
    };
    const pBtn = $("#pSave"); if (pBtn) pBtn.onclick = savePitch;
    const hzEl = $("#pHz"); if (hzEl) hzEl.onkeydown = e => { if (e.key === "Enter") savePitch(); };
  }

  // 레퍼토리 탭
  const qEl = $("#songQuery");
  if (qEl) { let tm; qEl.oninput = e => { clearTimeout(tm); tm = setTimeout(() => { state.songQuery = e.target.value; render(); const el = $("#songQuery"); if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); } }, 200); }; }
}

function songModal(existing) {
  const s = existing || { title: "", artist: "", key: "", status: "practicing", range: "", note: "" };
  openModal(`<div class="modal" style="max-width:480px">
    <div class="modal-head"><h3>${existing ? "곡 수정" : "곡 추가"}</h3><button class="icon-btn" data-act="close">✕</button></div>
    <div class="modal-body">
      <div class="mrow"><label>제목</label><div class="ctl"><input type="text" id="soTitle" value="${esc(s.title)}" placeholder="곡 제목" /></div></div>
      <div class="mrow"><label>아티스트</label><div class="ctl"><input type="text" id="soArtist" value="${esc(s.artist)}" placeholder="가수" /></div></div>
      <div class="mrow"><label>키(Key)</label><div class="ctl"><input type="text" id="soKey" value="${esc(s.key)}" placeholder="예: G / 원키 -2" /></div></div>
      <div class="mrow"><label>음역대</label><div class="ctl"><input type="text" id="soRange" value="${esc(s.range)}" placeholder="예: G2 ~ A4 (최저~최고음)" /></div></div>
      <div class="mrow"><label>상태</label><div class="ctl"><select id="soStatus">
        <option value="learning" ${s.status === "learning" ? "selected" : ""}>배우는 중</option>
        <option value="practicing" ${s.status === "practicing" ? "selected" : ""}>연습 중</option>
        <option value="done" ${s.status === "done" ? "selected" : ""}>완성</option>
      </select></div></div>
      <div class="mrow" style="align-items:flex-start"><label style="padding-top:11px">메모</label><div class="ctl"><textarea id="soNote" placeholder="어려운 구간, 호흡 포인트 등">${esc(s.note || "")}</textarea></div></div>
    </div>
    <div class="modal-foot"><button class="btn-cancel" data-act="close">취소</button><button class="btn-save" id="soSave">저장</button></div>
  </div>`);
  $("#soSave").onclick = async () => {
    const title = $("#soTitle").value.trim();
    if (!title) return toast("곡 제목을 입력하세요.");
    const id = existing?.id || uid();
    await DB.set("songs", id, {
      title, artist: $("#soArtist").value.trim(), key: $("#soKey").value.trim(),
      range: $("#soRange").value.trim(), status: $("#soStatus").value, note: $("#soNote").value,
      sessions: existing?.sessions || [], order: existing?.order ?? DB.all("songs").length, createdAt: existing?.createdAt || Date.now()
    });
    await DB.log(existing ? "edit" : "create", `곡 "${title}" ${existing ? "수정" : "추가"}`);
    closeModal(); render();
  };
}

/* ============================================================
   가계부 (Budget)
   - fixedItems: 매달 반복되는 고정 내역 (수입/저금/고정비용 등) — 수정 가능
   - expenses: 날짜별 변동 지출 { month, date, category, name, amount }
   - budgetMeta: 월별 특이사항 등 { month, note }
============================================================ */
const BUDGET_KINDS = { income: "수입", saving_invest: "저축(주식/투자)", saving_deposit: "저축(적금/청약)", saving_emergency: "비상금", fixed: "고정비용", health: "건강관리비", event: "경조사비", subscribe: "구독비" };
const ASSET_KINDS = { cash: "현금/입출금", deposit: "예금/적금", invest: "투자(주식/펀드)", pension: "연금/보험", realestate: "부동산", other: "기타" };
const ASSET_COLOR = { cash: "#22C55E", deposit: "#6366F1", invest: "#0EA5E9", pension: "#F59E0B", realestate: "#EC4899", other: "#6B7280" };
const SAVING_KINDS = ["saving_invest", "saving_deposit", "saving_emergency"];
const KIND_COLOR = { income: "#22C55E", saving_invest: "#0EA5E9", saving_deposit: "#6366F1", saving_emergency: "#F59E0B", fixed: "#EF4444", health: "#EC4899", event: "#14B8A6", subscribe: "#8B5CF6" };

// 저축 전체 합계 (하위 3종 합산)
function sumSaving(ym) { return SAVING_KINDS.reduce((s, k) => s + sumFixed(k, ym), 0); }
function sumFixed(kind, ym) {
  // 구버전 "saving" 키도 호환 (자기 자신만 합산 — 신규 카테고리와 중복 합산하지 않음)
  if (kind === "saving") return fixedByKind("saving", ym).reduce((s,f)=>s+(Number(f.amount)||0),0);
  return fixedByKind(kind, ym).reduce((s, f) => s + (Number(f.amount) || 0), 0);
}
const EXPENSE_CATS = ["생활비", "식비(회사)", "자기계발비", "카드값", "화장품", "기타비용", "고정비", "건강관리비", "경조사비", "구독비", "저축", "주식 저축", "비상금 저축", "적금"];
const CAT_COLOR = ["#6366F1","#22C55E","#F59E0B","#EF4444","#EC4899","#0EA5E9","#8B5CF6","#14B8A6","#F97316","#84CC16","#0C66E4","#0EA5E9","#F59E0B","#6366F1"];
const SAVING_CATS = ["저축", "주식 저축", "비상금 저축", "적금"];
function isSavingCat(cat) { return SAVING_CATS.includes(cat); }

function assetItems() { return DB.all("assets").sort((a,b) => (a.order ?? 0)-(b.order ?? 0)); }
function assetsByKind(kind) { return assetItems().filter(a => a.kind === kind); }
function sumAssets(kind) {
  if (kind) return assetsByKind(kind).reduce((s,a) => s+(Number(a.amount)||0), 0);
  return assetItems().reduce((s,a) => s+(Number(a.amount)||0), 0);
}

function won(n) { return (Number(n) || 0).toLocaleString("ko-KR"); }
function curMonth() { return state.budgetMonth || todayStr().slice(0, 7); }

// 기본 고정 내역 시드 (최초 1회) — 사용자가 준 데이터
const FIXED_SEED = [
  ["월급", "income", 2240000], ["네이버 페이백", "income", 20000], ["K패스 환급", "income", 67000],
  ["주식", "saving", 1000000], ["청약", "saving", 100000],
  ["집 생활비", "fixed", 300000], ["노래 레슨", "fixed", 120000], ["연습실", "fixed", 135000],
  ["교통비", "fixed", 90000], ["핸드폰 요금", "fixed", 47000], ["엄마 핸드폰 요금", "fixed", 15000],
  ["정신과", "health", 40000], ["인공눈물", "health", 6000],
  ["경조사비", "event", 100000], ["클로드", "subscribe", 30000]
];
// 시드는 절대 자동 실행하지 않음 — 고정 내역 탭에서 버튼으로만 호출
async function seedFixedItems() {
  // 이미 데이터가 있으면 아무것도 하지 않음 (중복 방지 최우선)
  if (DB.all("fixedItems").length > 0) { toast("이미 고정 내역이 있습니다. 중복 방지를 위해 기본값을 넣지 않았습니다."); return; }
  for (let i = 0; i < FIXED_SEED.length; i++) {
    const [name, kind, amount] = FIXED_SEED[i];
    await DB.set("fixedItems", uid(), { name, kind, amount, ym: curMonth(), order: i, createdAt: Date.now() });
  }
  toast("기본 고정 내역을 추가했습니다.");
  render();
}

// 중복 제거: 이름+카테고리+금액이 같은 항목 중 최신 것만 남김
async function deduplicateFixedItems() {
  const all = DB.all("fixedItems");
  const seen = new Map();
  const toDelete = [];
  // order 순 정렬, 오래된 것(createdAt 낮은 것)을 삭제 대상으로
  const sorted = all.slice().sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  for (const f of sorted) {
    const key = `${f.name}__${f.kind}__${f.amount}`;
    if (seen.has(key)) toDelete.push(f.id);
    else seen.set(key, f.id);
  }
  if (!toDelete.length) { toast("중복 항목이 없습니다."); return; }
  for (const id of toDelete) await DB.del("fixedItems", id);
  // order 재정렬
  const remaining = DB.all("fixedItems").sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  for (let i = 0; i < remaining.length; i++) {
    if (remaining[i].order !== i) await DB.set("fixedItems", remaining[i].id, { ...remaining[i], order: i });
  }
  toast(`중복 항목 ${toDelete.length}개를 제거했습니다.`);
  render();
}

// 고정 내역 — 월별 관리 (ym 필드가 없는 구버전 항목은 모든 달에 표시)
function fixedItems(ym) {
  const all = DB.all("fixedItems").sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  if (!ym) return all;
  return all.filter(f => !f.ym || f.ym === ym);
}
function fixedByKind(kind, ym) { return fixedItems(ym).filter(f => f.kind === kind); }
function monthExpenses(ym) { return DB.all("expenses").filter(e => (e.date || "").startsWith(ym)); }
function sumExpenses(ym) { return monthExpenses(ym).reduce((s, e) => s + (Number(e.amount) || 0), 0); }

/* ============================================================
   전체 자산 대시보드 (finance)
============================================================ */
function viewFinance() {
  const kinds = Object.keys(ASSET_KINDS);
  const total = sumAssets();
  const items = assetItems();

  // 지난 스냅샷과 비교 (증감 표시)
  const lastSnap = DB.get("meta", "assetSnapshot");
  const diff = lastSnap ? total - Number(lastSnap.total || 0) : null;

  // 지출 내역 데이터 가져오기 — 이번 달 저축/지출 + 전체 누적 저축액
  const allExps = DB.all("expenses");
  const ym = todayStr().slice(0, 7);
  const thisMonthExps = allExps.filter(e => (e.date || "").startsWith(ym));
  const monthSaving = thisMonthExps.filter(e => isSavingCat(e.category)).reduce((s,e)=>s+(Number(e.amount)||0),0);
  const monthSpend  = thisMonthExps.filter(e => !isSavingCat(e.category)).reduce((s,e)=>s+(Number(e.amount)||0),0);
  const cumSaving   = allExps.filter(e => isSavingCat(e.category)).reduce((s,e)=>s+(Number(e.amount)||0),0);
  const unexplained = total - cumSaving; // 누적 저축으로 설명 안 되는 차액 (초기 보유금·투자수익 등)
  const savingRatioOfAsset = total ? Math.round(cumSaving/total*100) : 0;

  // 목표 저축액
  const goalMeta = DB.get("meta", "assetGoal") || {};
  const goalAmt = Number(goalMeta.amount) || 0;
  const goalLabel = goalMeta.label || "목표 자산";
  const goalPct = goalAmt ? Math.min(100, Math.round(total / goalAmt * 100)) : 0;
  const goalRemain = Math.max(0, goalAmt - total);
  // 최근 3개월 평균 저축액으로 도달 예상 시점 계산
  const last3 = [0,1,2].map(i => {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    const mym = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
    return allExps.filter(e => (e.date||"").startsWith(mym) && isSavingCat(e.category))
      .reduce((s,e)=>s+(Number(e.amount)||0),0);
  });
  const avgMonthly = Math.round(last3.reduce((a,b)=>a+b,0) / 3);
  const monthsLeft = (avgMonthly > 0 && goalRemain > 0) ? Math.ceil(goalRemain / avgMonthly) : null;
  const etaDate = monthsLeft ? (() => {
    const d = new Date(); d.setMonth(d.getMonth() + monthsLeft);
    return `${d.getFullYear()}년 ${d.getMonth()+1}월`;
  })() : null;

  const goalCard = `<div class="asset-goal-card">
    <div class="asset-goal-head">
      <span>🎯 ${esc(goalLabel)}</span>
      <button class="link-btn" data-act="asset-goal-set">${goalAmt?"목표 수정":"목표 설정"}</button>
    </div>
    ${goalAmt ? `
      <div class="asset-goal-nums">
        <span class="asset-goal-cur">${won(total)}</span>
        <span class="asset-goal-sep">/</span>
        <span class="asset-goal-target">${won(goalAmt)}원</span>
        <span class="asset-goal-pct">${goalPct}%</span>
      </div>
      <div class="bar-track" style="margin-top:8px;height:10px"><div class="bar-fill" style="width:${goalPct}%;background:linear-gradient(90deg,#0C66E4,#22C55E)"></div></div>
      <div class="asset-goal-sub">
        ${goalRemain > 0
          ? `앞으로 <b>${won(goalRemain)}원</b> 남았어요.${etaDate ? ` 최근 3개월 평균 ${won(avgMonthly)}원씩 모으면 <b>${etaDate}</b>쯤 도달해요.` : ""}`
          : `🎉 목표를 달성했어요! (초과 ${won(total - goalAmt)}원)`}
      </div>`
      : `<div class="asset-goal-sub">모으고 싶은 목표 금액을 설정하면 진행률과 도달 예상 시점을 알려드려요.</div>`}
  </div>`;

  const expCompare = `<div class="asset-exp-card">
    <div class="asset-exp-head">📒 지출 내역 연동</div>
    <div class="asset-exp-grid">
      <div class="asset-exp-stat">
        <div class="lb">이번 달 저축</div>
        <div class="vl" style="color:#0C66E4">${won(monthSaving)}<small>원</small></div>
      </div>
      <div class="asset-exp-stat">
        <div class="lb">이번 달 지출</div>
        <div class="vl" style="color:#EF4444">${won(monthSpend)}<small>원</small></div>
      </div>
      <div class="asset-exp-stat">
        <div class="lb">누적 저축액</div>
        <div class="vl" style="color:#16A34A">${won(cumSaving)}<small>원</small></div>
      </div>
    </div>
    <div class="asset-exp-bar-row">
      <div class="bar-track"><div class="bar-fill" style="width:${Math.min(100,savingRatioOfAsset)}%;background:#0C66E4"></div></div>
      <span class="asset-exp-pct">${savingRatioOfAsset}%</span>
    </div>
    <div class="asset-exp-desc">총 자산 중 지출 내역에서 저축으로 기록한 금액이 차지하는 비율입니다.
      ${unexplained !== 0 ? `나머지 ${won(Math.abs(unexplained))}원은 ${unexplained>=0?"초기 보유금·투자수익 등":"지출내역에 기록되지 않은 차감분"}으로 추정됩니다.` : ""}
    </div>
  </div>`;

  const catCards = kinds.map(k => {
    const sum = sumAssets(k);
    const pct = total ? Math.round(sum/total*100) : 0;
    return `<div class="asset-cat-card" style="border-left:3px solid ${ASSET_COLOR[k]}">
      <div class="asset-cat-label">${ASSET_KINDS[k]}</div>
      <div class="asset-cat-amt" style="color:${ASSET_COLOR[k]}">${won(sum)}<small>원</small></div>
      <div class="asset-cat-pct">${pct}%</div>
    </div>`;
  }).join("");

  const rows = kinds.map(k => {
    const list = assetsByKind(k);
    const kindRows = list.map(a => `<div class="fx-row" data-id="${a.id}">
      <input class="fx-name" value="${esc(a.name)}" data-id="${a.id}" data-field="name" placeholder="이름 (예: 국민은행, 삼성전자)" />
      <input class="fx-amt" type="number" value="${Number(a.amount) || 0}" data-id="${a.id}" data-field="amount" />
      <span class="fx-won">원</span>
      <select class="fx-kind" data-id="${a.id}" title="카테고리 변경">
        ${kinds.map(k2 => `<option value="${k2}" ${k2===k?"selected":""}>${ASSET_KINDS[k2]}</option>`).join("")}
      </select>
      <button class="sub-x" data-act="asset-del" data-id="${a.id}">✕</button>
    </div>`).join("");
    return `<div class="fx-block">
      <div class="fx-head"><span class="cal2-dot" style="background:${ASSET_COLOR[k]}"></span>${ASSET_KINDS[k]}<span class="fx-sum">${won(sumAssets(k))}원</span></div>
      ${kindRows || `<div class="td-empty-sub" style="padding:6px 4px">항목 없음</div>`}
      <button class="add-sub" data-act="asset-add" data-kind="${k}">+ ${ASSET_KINDS[k]} 항목 추가</button>
    </div>`;
  }).join("");

  return `
  <div class="asset-total-card">
    <div class="asset-total-label">💎 총 자산</div>
    <div class="asset-total-val">${won(total)}<small>원</small></div>
    ${diff !== null ? `<div class="asset-total-diff" style="color:${diff>=0?"#16A34A":"#DC2626"}">
      ${diff>=0?"▲":"▼"} ${won(Math.abs(diff))}원 (지난 기록 대비)
    </div>` : ""}
    <button class="btn-ghost" data-act="asset-snapshot" style="margin-top:10px">📌 현재 금액 기록해두기</button>
  </div>
  ${goalCard}
  <div class="asset-cat-grid">${catCards}</div>
  <div class="td-empty-sub" style="margin:14px 0 8px">계좌·자산별 금액을 직접 입력하면 자동으로 합산됩니다.</div>
  ${rows}`;
}


function viewBudget() {
  const sub = state.budgetSub || "overview";
  const ym = curMonth();
  const [y, m] = ym.split("-").map(Number);
  const isFinance = sub === "finance";
  const rangeActive = sub === "overview" && state.budFrom && state.budTo;
  const nav = `<div class="cal2-top" style="margin-bottom:14px">
    ${isFinance ? `<div class="cal2-title">💎 자산 현황</div>`
      : rangeActive ? `<div class="cal2-title">📅 ${state.budFrom} ~ ${state.budTo}</div>`
      : `<button class="cal-nav" data-act="bud-prev">‹</button>
    <div class="cal2-title">${y}년 ${m}월</div>
    <button class="cal-nav" data-act="bud-next">›</button>`}
    <div class="hview-tabs" style="margin-left:auto">
      <button class="hvt ${sub === "finance" ? "on" : ""}" data-act="budsub" data-v="finance">자산</button>
      <button class="hvt ${sub === "overview" ? "on" : ""}" data-act="budsub" data-v="overview">요약</button>
      <button class="hvt ${sub === "fixed" ? "on" : ""}" data-act="budsub" data-v="fixed">고정 내역</button>
      <button class="hvt ${sub === "expense" ? "on" : ""}" data-act="budsub" data-v="expense">지출 내역</button>
    </div>
  </div>`;
  let body;
  if (sub === "fixed") body = budgetFixedSection(ym);
  else if (sub === "expense") body = budgetExpenseSection(ym);
  else if (sub === "finance") body = viewFinance();
  else body = budgetOverview(ym);
  return nav + body;
}

/* ---- 가계부 대시보드 ---- */
function budgetOverview(ym) {
  const rangeFrom = state.budFrom, rangeTo = state.budTo;
  const rangeActive = !!(rangeFrom && rangeTo);

  // 기간 조회 바
  const rangeBar = `<div class="todo-date-filter" style="margin-bottom:14px">
    <span style="font-size:12.5px;color:#6B7280;font-weight:600">📅 기간 조회</span>
    <input type="date" id="budFrom" value="${rangeFrom||""}" />
    <span style="color:#C4C9D0;font-size:13px">~</span>
    <input type="date" id="budTo" value="${rangeTo||""}" max="${todayStr()}" />
    ${rangeActive ? `<button class="btn-ghost" data-act="bud-range-clear" style="padding:4px 10px;font-size:12px">✕ 초기화</button>` : ""}
  </div>`;

  let monthExps, income, monthsCount;
  if (rangeActive) {
    monthExps = DB.all("expenses").filter(e => (e.date||"") >= rangeFrom && (e.date||"") <= rangeTo);
    const monthSet = new Set();
    let cur = parseD(rangeFrom);
    const end = parseD(rangeTo);
    while (cur <= end) { monthSet.add(fmt(cur).slice(0,7)); cur = addDays(cur, 1); }
    monthsCount = monthSet.size || 1;
    income = Array.from(monthSet).reduce((sum,m)=>sum+sumFixed("income",m),0);
  } else {
    monthExps = monthExpenses(ym);
    income = sumFixed("income", ym);
    monthsCount = 1;
  }

  const savGeneral   = monthExps.filter(e => e.category === "저축").reduce((s,e)=>s+(Number(e.amount)||0),0);
  const savStock     = monthExps.filter(e => e.category === "주식 저축").reduce((s,e)=>s+(Number(e.amount)||0),0);
  const savEmerg     = monthExps.filter(e => e.category === "비상금 저축").reduce((s,e)=>s+(Number(e.amount)||0),0);
  const savDeposit   = monthExps.filter(e => e.category === "적금").reduce((s,e)=>s+(Number(e.amount)||0),0);
  const totalSaving = savGeneral + savStock + savEmerg + savDeposit;
  const variable  = monthExps.filter(e => !isSavingCat(e.category)).reduce((s,e)=>s+(Number(e.amount)||0),0);
  const totalSpent= variable; // 고정 내역은 요약에 자동 반영하지 않음 — 저축·지출 모두 지출 내역에서만 집계
  const remain    = income - totalSaving - totalSpent;
  const savingRate= income ? Math.round(totalSaving / income * 100) : 0;
  const remainPct = income ? Math.round(Math.max(0,remain) / income * 100) : 0;
  const spendPct  = income ? Math.round(totalSpent / income * 100) : 0;

  const [y, mm] = ym.split("-").map(Number);

  // 최근 6개월 수입/지출 데이터 (지출 내역 기준만) — 기간 조회 중에는 생략
  const months6 = [];
  if (!rangeActive) {
    for (let i = 5; i >= 0; i--) {
      const d = new Date(y, mm - 1 - i, 1);
      const mym = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
      const mExps = monthExpenses(mym);
      const mIncome = sumFixed("income", mym);
      const mSpend  = mExps.filter(e => !isSavingCat(e.category)).reduce((s,e)=>s+(Number(e.amount)||0),0);
      const mSaving = mExps.filter(e => isSavingCat(e.category)).reduce((s,e)=>s+(Number(e.amount)||0),0);
      months6.push({ ym: mym, label: `${d.getMonth()+1}월`, income: mIncome, spend: mSpend, saving: mSaving });
    }
  }

  // 누적 저축 추정 (몇 달치)
  const monthsSaving = months6.length;
  const cumSaving = totalSaving * monthsSaving;
  const annualSaving = totalSaving * 12;

  // 재정 건강도 계산
  const healthScore = Math.max(0, Math.min(100,
    (savingRate >= 20 ? 40 : savingRate >= 10 ? 25 : 10) +
    (remainPct >= 15 ? 35 : remainPct >= 5 ? 20 : 5) +
    (spendPct <= 50 ? 25 : spendPct <= 70 ? 15 : 5)
  ));
  const healthLabel = healthScore >= 80 ? "우수" : healthScore >= 60 ? "양호" : healthScore >= 40 ? "보통" : "주의";
  const healthColor = healthScore >= 80 ? "#22C55E" : healthScore >= 60 ? "#0C66E4" : healthScore >= 40 ? "#F59E0B" : "#EF4444";

  // 전달 대비 (순수 지출만 비교) — 기간 조회 중에는 생략
  let varDelta = 0, prevVar = 0;
  if (!rangeActive) {
    const prevYm = fmt(new Date(y, mm - 2, 1)).slice(0, 7);
    prevVar = monthExpenses(prevYm).filter(e => !isSavingCat(e.category)).reduce((s,e)=>s+(Number(e.amount)||0),0);
    varDelta = variable - prevVar;
  }

  // 히어로 섹션
  const heroLabel = rangeActive ? `${rangeFrom} ~ ${rangeTo} 수입 (추정)` : "이번 달 수입";
  const hero = `<div class="bud-hero">
    <div class="bud-hero-main">
      <div class="bud-hero-label">${heroLabel}</div>
      <div class="bud-hero-income">${won(income)}<small>원</small></div>
      ${rangeActive ? `<div style="font-size:11.5px;color:#9CA3AF;margin-top:4px">고정수입 × ${monthsCount}개월로 추정</div>` : ""}
    </div>
    <div class="bud-health">
      <svg viewBox="0 0 80 80" width="80" height="80">
        <circle cx="40" cy="40" r="32" fill="none" stroke="#F1F2F4" stroke-width="8"/>
        <circle cx="40" cy="40" r="32" fill="none" stroke="${healthColor}" stroke-width="8"
          stroke-linecap="round" stroke-dasharray="${2*Math.PI*32}"
          stroke-dashoffset="${2*Math.PI*32*(1-healthScore/100)}" transform="rotate(-90 40 40)"/>
        <text x="40" y="44" text-anchor="middle" font-size="17" font-weight="800" fill="${healthColor}">${healthScore}</text>
      </svg>
      <div class="bud-health-label">재정 건강도<br><b style="color:${healthColor}">${healthLabel}</b></div>
    </div>
  </div>`;

  // 핵심 3지표 — 저축 / 지출 / 남은 금액
  const coreStats = `<div class="stat-grid" style="grid-template-columns:repeat(3,1fr);margin:16px 0">
    <div class="stat"><div class="lb">🏦 저축</div><div class="vl" style="color:#0EA5E9">${won(totalSaving)}<small>원</small></div><div style="font-size:11px;color:#9CA3AF;margin-top:2px">${savingRate}%</div></div>
    <div class="stat"><div class="lb">💳 지출</div><div class="vl" style="color:#EF4444">${won(totalSpent)}<small>원</small></div><div style="font-size:11px;color:#9CA3AF;margin-top:2px">${spendPct}%</div></div>
    <div class="stat"><div class="lb">🪙 남은 금액</div><div class="vl" style="color:${remain<0?"#DC2626":"#374151"}">${won(remain)}<small>원</small></div><div style="font-size:11px;color:#9CA3AF;margin-top:2px">${remainPct}%</div></div>
  </div>`;

  // 저축 세분화 카드
  const savCards = `<div class="bud-sav-grid">
    <div class="bud-sav-card">
      <div class="bud-sav-icon" style="background:#EFF6FF">🏦</div>
      <div><div class="bud-sav-label">저축</div><div class="bud-sav-amt">${won(savGeneral)}<small>원</small></div></div>
    </div>
    <div class="bud-sav-card">
      <div class="bud-sav-icon" style="background:#F0F9FF">📈</div>
      <div><div class="bud-sav-label">주식 저축</div><div class="bud-sav-amt">${won(savStock)}<small>원</small></div></div>
    </div>
    <div class="bud-sav-card">
      <div class="bud-sav-icon" style="background:#FFFBEB">🛡️</div>
      <div><div class="bud-sav-label">비상금 저축</div><div class="bud-sav-amt">${won(savEmerg)}<small>원</small></div></div>
    </div>
    <div class="bud-sav-card">
      <div class="bud-sav-icon" style="background:#EEF2FF">💰</div>
      <div><div class="bud-sav-label">적금</div><div class="bud-sav-amt">${won(savDeposit)}<small>원</small></div></div>
    </div>
  </div>`;

  // 수입 흐름 바
  const segs = [
    { label: "저축", val: savGeneral, color: "#0C66E4" },
    { label: "주식 저축", val: savStock, color: "#0EA5E9" },
    { label: "비상금 저축", val: savEmerg, color: "#F59E0B" },
    { label: "적금", val: savDeposit, color: "#6366F1" },
    { label: "지출", val: variable, color: "#F97316" },
    { label: "잔액", val: Math.max(0, remain), color: "#22C55E" }
  ].filter(s => s.val > 0);
  const segTotal = segs.reduce((s,x)=>s+x.val,0)||1;
  const flow = `<div class="grp-title" style="margin-top:22px">💸 수입 ${won(income)}원 흐름</div>
    <div class="bud-flow">${segs.map(s=>`<div class="bud-flow-seg" style="width:${s.val/segTotal*100}%;background:${s.color}" title="${s.label} ${won(s.val)}원"></div>`).join("")}</div>
    <div class="bud-flow-legend">${segs.map(s=>`<span><span class="cal2-dot" style="background:${s.color}"></span>${s.label} ${won(s.val)}</span>`).join("")}</div>`;

  // 6개월 수입/지출 꺾은선 SVG (기간 조회 중에는 표시 안 함)
  const trendChart = months6.length === 0 ? "" : (() => {
    const W=560, H=130, PL=10, PR=10, PT=16, PB=28;
    const vals = months6.map(m=>m.spend);
    const maxV = Math.max(...months6.map(m=>Math.max(m.income,m.spend)),1);
    const xp = i => PL + i*(W-PL-PR)/(months6.length-1||1);
    const yp = v => PT + (1-v/maxV)*(H-PT-PB);
    const incLine = months6.map((m,i)=>`${xp(i)},${yp(m.income)}`).join(" ");
    const spLine = months6.map((m,i)=>`${xp(i)},${yp(m.spend)}`).join(" ");
    const savLine = months6.map((m,i)=>`${xp(i)},${yp(m.saving)}`).join(" ");
    const dots = months6.map((m,i)=>`
      <circle cx="${xp(i)}" cy="${yp(m.spend)}" r="3" fill="#EF4444"/>
      <circle cx="${xp(i)}" cy="${yp(m.saving)}" r="3" fill="#0EA5E9"/>
    `).join("");
    const labels = months6.map((m,i)=>`<text x="${xp(i)}" y="${H-5}" text-anchor="middle" font-size="10" fill="var(--wtick)">${m.label}</text>`).join("");
    return `<div class="bud-trend-card">
      <div class="bud-trend-legend">
        <span><span style="display:inline-block;width:16px;height:3px;background:#22C55E;vertical-align:middle;margin-right:4px"></span>수입</span>
        <span><span style="display:inline-block;width:16px;height:3px;background:#EF4444;vertical-align:middle;margin-right:4px"></span>지출</span>
        <span><span style="display:inline-block;width:16px;height:3px;background:#0EA5E9;vertical-align:middle;margin-right:4px"></span>저축</span>
      </div>
      <svg viewBox="0 0 ${W} ${H}" style="width:100%;height:130px">
        <polyline points="${incLine}" fill="none" stroke="#22C55E" stroke-width="2" stroke-linejoin="round"/>
        <polyline points="${spLine}" fill="none" stroke="#EF4444" stroke-width="2" stroke-linejoin="round"/>
        <polyline points="${savLine}" fill="none" stroke="#0EA5E9" stroke-width="2" stroke-linejoin="round" stroke-dasharray="4 3"/>
        ${dots}${labels}
      </svg>
    </div>`;
  })();

  // 카테고리별 도넛 (저축 카테고리는 제외 — 순수 지출만)
  const byCat = {};
  monthExps.filter(e => !isSavingCat(e.category)).forEach(e => { byCat[e.category] = (byCat[e.category]||0)+(Number(e.amount)||0); });
  const catEntries = Object.entries(byCat).sort((a,b)=>b[1]-a[1]);
  const catViz = catEntries.length ? `
    <div class="bud-cat-wrap">
      ${donutSvg(catEntries)}
      <div class="bud-cat-list">
        ${catEntries.map(([c,v],i)=>`<div class="bud-cat-row">
          <span class="cal2-dot" style="background:${CAT_COLOR[i%CAT_COLOR.length]}"></span>
          <span class="bud-cat-name">${esc(c)}</span>
          <span class="bud-cat-amt">${won(v)}원</span>
          <span class="bud-cat-pct">${Math.round(v/(variable||1)*100)}%</span>
        </div>`).join("")}
      </div>
    </div>` : `<div class="td-empty-sub" style="margin:12px 0">이번 달 변동 지출 기록이 없습니다.</div>`;

  // 요약
  const meta = DB.get("budgetMeta", "note_" + ym);
  const note = meta?.note || "";
  const deltaTxt = varDelta===0?"전달과 동일":varDelta>0?`전달보다 +${won(varDelta)}원 더 씀`:`전달보다 ${won(-varDelta)}원 절약`;
  const summary = `<div class="bud-summary">
    <div class="bud-sum-row"><span>💰 ${rangeActive?"기간 수입(추정)":"이번 달 수입"}</span><b style="color:#16A34A">${won(income)}원</b></div>
    <div class="bud-sum-row"><span>🏦 저축</span><b style="color:#0EA5E9">${won(totalSaving)}원 (${savingRate}%)</b></div>
    <div class="bud-sum-row"><span>💸 총 지출</span><b style="color:#DC2626">${won(totalSpent)}원 (${spendPct}%)</b></div>
    <div class="bud-sum-row"><span>🪙 잔액</span><b style="color:${remain<0?"#DC2626":"#16A34A"}">${won(remain)}원 (${remainPct}%)</b></div>
    ${rangeActive ? "" : `<div class="bud-sum-row"><span>📊 전달 대비</span><b style="color:${varDelta>0?"#DC2626":"#16A34A"}">${deltaTxt}</b></div>`}
    <div class="bud-sum-note">
      <label>이번 달 특이사항</label>
      <textarea id="budNote" placeholder="이번 달 메모…">${esc(note)}</textarea>
      <button class="btn-ghost" id="budNoteSave" style="margin-top:8px">메모 저장</button>
    </div>
  </div>`;

  return `${rangeBar}${hero}
  ${coreStats}
  <div class="grp-title" style="margin-top:18px">🏦 저축 세부 내역</div>${savCards}
  ${flow}
  ${rangeActive ? "" : `<div class="grp-title" style="margin-top:22px">📈 최근 6개월 수입/지출 추이</div>${trendChart}`}
  <div class="grp-title" style="margin-top:22px">🛒 카테고리별 ${rangeActive?"":""}지출</div>${catEntries.length ? catViz : `<div class="td-empty-sub" style="margin:12px 0">${rangeActive?"해당 기간":"이번 달"} 지출 기록이 없습니다.</div>`}
  <div class="grp-title" style="margin-top:22px">📋 요약</div>${summary}`;
}

function donutSvg(entries) {
  const total = entries.reduce((s, e) => s + e[1], 0) || 1;
  const R = 60, r = 38, cx = 75, cy = 75;
  let a0 = -Math.PI / 2, paths = "";
  entries.forEach(([c, v], i) => {
    const frac = v / total, a1 = a0 + frac * 2 * Math.PI;
    const large = frac > 0.5 ? 1 : 0;
    const x0 = cx + R * Math.cos(a0), y0 = cy + R * Math.sin(a0);
    const x1 = cx + R * Math.cos(a1), y1 = cy + R * Math.sin(a1);
    const xi1 = cx + r * Math.cos(a1), yi1 = cy + r * Math.sin(a1);
    const xi0 = cx + r * Math.cos(a0), yi0 = cy + r * Math.sin(a0);
    paths += `<path d="M${x0} ${y0} A${R} ${R} 0 ${large} 1 ${x1} ${y1} L${xi1} ${yi1} A${r} ${r} 0 ${large} 0 ${xi0} ${yi0} Z" fill="${CAT_COLOR[i % CAT_COLOR.length]}"/>`;
    a0 = a1;
  });
  return `<div class="bud-donut"><svg viewBox="0 0 150 150" width="150" height="150">${paths}
    <text x="75" y="72" text-anchor="middle" font-size="11" fill="var(--wtick)">총 지출</text>
    <text x="75" y="88" text-anchor="middle" font-size="14" font-weight="700" fill="var(--dbtext)">${won(total)}</text></svg></div>`;
}

/* ---- 고정 내역 (수정 가능) ---- */
// 구버전 "saving" 카테고리 항목을 화면에 보이는 "saving_invest"로 자동 이전
// (이전에는 BUDGET_KINDS 목록에 "saving"이 없어 화면에 안 보이고 수정/삭제가 불가능했음)
let _savingMigrated = false;
async function migrateLegacySavingKind() {
  if (_savingMigrated) return;
  _savingMigrated = true;
  const legacy = fixedByKind("saving");
  for (const item of legacy) {
    await DB.set("fixedItems", item.id, { ...item, kind: "saving_invest" });
  }
}

function budgetFixedSection(ym) {
  migrateLegacySavingKind();
  const kinds = Object.keys(BUDGET_KINDS);
  const blocks = kinds.map(kind => {
    const items = fixedByKind(kind, ym);
    const sum = sumFixed(kind, ym);
    const rows = items.map(f => `<div class="fx-row" data-id="${f.id}">
      <input class="fx-name" value="${esc(f.name)}" data-id="${f.id}" data-field="name" placeholder="이름" />
      <input class="fx-amt" type="number" value="${Number(f.amount) || 0}" data-id="${f.id}" data-field="amount" />
      <span class="fx-won">원</span>
      <select class="fx-kind" data-id="${f.id}" title="카테고리 변경">
        ${kinds.map(k => `<option value="${k}" ${k===kind?"selected":""}>${BUDGET_KINDS[k]}</option>`).join("")}
      </select>
      ${!f.ym ? `<span class="fx-allmonth" title="모든 달에 적용 중">전체</span>` : ""}
      <button class="sub-x" data-act="fx-del" data-id="${f.id}">✕</button>
    </div>`).join("");
    return `<div class="fx-block">
      <div class="fx-head"><span class="cal2-dot" style="background:${KIND_COLOR[kind]}"></span>${BUDGET_KINDS[kind]}<span class="fx-sum">${won(sum)}원</span></div>
      ${rows || `<div class="td-empty-sub" style="padding:6px 4px">항목 없음</div>`}
      <button class="add-sub" data-act="fx-add" data-kind="${kind}" data-ym="${ym}">+ ${BUDGET_KINDS[kind]} 항목 추가</button>
    </div>`;
  }).join("");
  const income = sumFixed("income", ym), out = sumFixed("fixed", ym) + sumFixed("health", ym) + sumFixed("event", ym) + sumFixed("subscribe", ym), save = sumSaving(ym);
  const remain = income - save - out;
  const monthItems = fixedItems(ym).length;
  const totalAll = DB.all("fixedItems").length;

  // 이전 달 계산
  const [yy, mmn] = ym.split("-").map(Number);
  const prevD = new Date(yy, mmn - 2, 1);
  const prevYm = `${prevD.getFullYear()}-${String(prevD.getMonth()+1).padStart(2,"0")}`;
  const prevCount = DB.all("fixedItems").filter(f => f.ym === prevYm).length;

  return `<div class="fx-toolbar">
    <span class="td-empty-sub">${ym.replace("-",".")} 고정 내역입니다. 값을 바로 수정하면 저장됩니다. <b>전체</b> 표시 항목은 모든 달에 공통 적용돼요.</span>
    <div style="display:flex;gap:8px;flex-shrink:0;flex-wrap:wrap">
      ${prevCount > 0 ? `<button class="btn-ghost" data-act="fx-copy-prev" data-ym="${ym}" data-prev="${prevYm}" style="padding:7px 14px;font-size:13px">📋 이전 달 복사</button>` : ""}
      ${totalAll === 0 ? `<button class="btn-save" data-act="fx-seed" style="padding:7px 14px;font-size:13px">기본값 넣기</button>` : ""}
      ${monthItems > 0 ? `<button class="btn-ghost danger" data-act="fx-dedup" style="padding:7px 14px;font-size:13px">🧹 중복 제거</button>` : ""}
    </div>
  </div>
    <div class="stat-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:16px">
      <div class="stat"><div class="lb">수입 합계</div><div class="vl" style="color:#16A34A">${won(income)}<small>원</small></div></div>
      <div class="stat"><div class="lb">저축 합계</div><div class="vl" style="color:#0EA5E9">${won(save)}<small>원</small></div></div>
      <div class="stat"><div class="lb">고정 지출 합계</div><div class="vl" style="color:#DC2626">${won(out)}<small>원</small></div></div>
      <div class="stat"><div class="lb">남은 금액</div><div class="vl" style="color:${remain<0?"#DC2626":"#374151"}">${won(remain)}<small>원</small></div></div>
    </div>${blocks}`;
}

/* ---- 변동 지출 내역 ---- */
function budgetExpenseSection(ym) {
  const exps = monthExpenses(ym).sort((a, b) => (b.date || "").localeCompare(a.date || "") || (b.createdAt || 0) - (a.createdAt || 0));
  const total = exps.filter(e => !isSavingCat(e.category)).reduce((s,e)=>s+(Number(e.amount)||0),0);
  const savTotal = exps.filter(e => isSavingCat(e.category)).reduce((s,e)=>s+(Number(e.amount)||0),0);

  const input = `<div class="pitch-input" style="margin-bottom:14px">
    <div class="exp-input-row">
      <input type="date" id="expDate" value="${todayStr()}" />
      <select id="expCat">
        <optgroup label="지출">${EXPENSE_CATS.filter(c=>!isSavingCat(c)).map(c => `<option>${c}</option>`).join("")}</optgroup>
        <optgroup label="저축">${EXPENSE_CATS.filter(c=>isSavingCat(c)).map(c => `<option>${c}</option>`).join("")}</optgroup>
      </select>
      <input type="text" id="expName" placeholder="내용 (예: 점심)" />
      <input type="number" id="expAmt" placeholder="금액" />
      <button class="btn-save" id="expSave" style="height:42px">추가</button>
    </div>
    <div class="exp-upload">
      <input type="file" id="expFile" accept=".xls,.xlsx,.csv" style="display:none" />
      <button class="btn-ghost" id="expUploadBtn">📤 엑셀 업로드 (똑똑가계부 양식)</button>
      <span class="exp-upload-hint">.xls / .xlsx 파일을 올리면 자동으로 내역을 불러옵니다</span>
    </div>
  </div>`;

  // 카테고리별 소계
  const byCat = {};
  exps.forEach(e => { byCat[e.category] = (byCat[e.category] || 0) + (Number(e.amount) || 0); });
  const chips = Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([c, v]) =>
    `<span class="exp-chip" style="${isSavingCat(c)?"border-color:#93C5FD;background:#EFF6FF":""}">${esc(c)} <b>${won(v)}</b></span>`).join("");

  const list = exps.length ? exps.map(e => `<div class="exp-row">
      <span class="exp-date">${e.date?.slice(5) || ""}</span>
      <span class="exp-cat" style="background:${CAT_COLOR[EXPENSE_CATS.indexOf(e.category) % CAT_COLOR.length]}1a;color:${CAT_COLOR[EXPENSE_CATS.indexOf(e.category) % CAT_COLOR.length]}">${isSavingCat(e.category)?"🏦 ":""}${esc(e.category)}</span>
      <span class="exp-name">${esc(e.name || "")}</span>
      <span class="exp-amt">${won(e.amount)}원</span>
      <button class="sub-x" data-act="exp-del" data-id="${e.id}">✕</button>
    </div>`).join("") : `<div class="empty" style="padding:40px 20px"><div class="big">🧾</div><h3>지출 기록이 없습니다</h3><p>위에서 날짜·카테고리·금액을 입력해 추가하세요.</p></div>`;

  return `${input}
    <div class="exp-total">이번 달 지출 <b>${won(total)}원</b> · 저축 <b style="color:#0C66E4">${won(savTotal)}원</b></div>
    ${chips ? `<div class="exp-chips">${chips}</div>` : ""}
    <div class="grp-title" style="margin-top:16px">내역 <span class="count">${exps.length}</span></div>
    <div class="exp-list">${list}</div>`;
}

function wireBudget() {
  const sub = state.budgetSub || "overview";
  if (sub === "overview") {
    const btn = $("#budNoteSave");
    if (btn) btn.onclick = async () => { await DB.set("budgetMeta", "note_" + curMonth(), { note: $("#budNote").value }); toast("메모를 저장했습니다."); };
    const bf = $("#budFrom"), bt = $("#budTo");
    if (bf) bf.onchange = e => { state.budFrom = e.target.value; render(); };
    if (bt) bt.onchange = e => { state.budTo = e.target.value; render(); };
  } else if (sub === "finance") {
    $$(".fx-name, .fx-amt").forEach(inp => {
      inp.onchange = async () => {
        const a = DB.get("assets", inp.dataset.id); if (!a) return;
        const field = inp.dataset.field;
        await DB.set("assets", a.id, { ...a, [field]: field === "amount" ? (Number(inp.value) || 0) : inp.value });
        if (field === "amount") render();
      };
    });
    $$(".fx-kind").forEach(sel => {
      sel.onchange = async () => {
        const a = DB.get("assets", sel.dataset.id); if (!a) return;
        await DB.set("assets", a.id, { ...a, kind: sel.value });
        toast("카테고리를 변경했습니다."); render();
      };
    });
  } else if (sub === "fixed") {
    $$(".fx-name, .fx-amt").forEach(inp => {
      inp.onchange = async () => {
        const f = DB.get("fixedItems", inp.dataset.id); if (!f) return;
        const field = inp.dataset.field;
        await DB.set("fixedItems", f.id, { ...f, [field]: field === "amount" ? (Number(inp.value) || 0) : inp.value });
        if (field === "amount") render();
      };
    });
    $$(".fx-kind").forEach(sel => {
      sel.onchange = async () => {
        const f = DB.get("fixedItems", sel.dataset.id); if (!f) return;
        await DB.set("fixedItems", f.id, { ...f, kind: sel.value });
        toast("카테고리를 변경했습니다."); render();
      };
    });
  } else if (sub === "expense") {
    const save = async () => {
      const date = $("#expDate").value, cat = $("#expCat").value, name = $("#expName").value.trim(), amt = Number($("#expAmt").value) || 0;
      if (!date) return toast("날짜를 선택하세요.");
      if (!amt) return toast("금액을 입력하세요.");
      await DB.set("expenses", uid(), { date, category: cat, name, amount: amt, createdAt: Date.now() });
      await DB.log("edit", `지출 ${cat} ${won(amt)}원 (${name})`);
      toast("추가했습니다."); render();
    };
    const btn = $("#expSave"); if (btn) btn.onclick = save;
    const amtEl = $("#expAmt"); if (amtEl) amtEl.onkeydown = e => { if (e.key === "Enter") save(); };
    // 엑셀 업로드
    const upBtn = $("#expUploadBtn"), fileEl = $("#expFile");
    if (upBtn && fileEl) {
      upBtn.onclick = () => fileEl.click();
      fileEl.onchange = () => { const f = fileEl.files[0]; if (f) importExpenseFile(f); };
    }
  }
}

/* 똑똑가계부 엑셀(.xls/.xlsx) 파싱 → 지출 내역으로 등록 */
async function importExpenseFile(file) {
  if (!window.XLSX) { toast("엑셀 라이브러리 로딩 중입니다. 잠시 후 다시 시도하세요."); return; }
  try {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

    // 헤더 행 찾기 ('지출일' 포함)
    let hi = rows.findIndex(r => r.some(c => String(c).includes("지출일")));
    if (hi < 0) hi = rows.findIndex(r => r.some(c => String(c).includes("날짜")));
    if (hi < 0) { toast("양식을 인식하지 못했습니다. '지출일' 헤더가 있는지 확인하세요."); return; }
    const header = rows[hi].map(c => String(c).trim());
    const col = (names) => header.findIndex(h => names.some(n => h.includes(n)));
    const ci = {
      date: col(["지출일", "날짜"]),
      name: col(["지출내역", "내역", "내용"]),
      amt: col(["지출금액", "금액"]),
      cat: col(["카테고리"]),
      subcat: col(["세부카테고리"]),
      memo: col(["메모"])
    };
    if (ci.date < 0 || ci.amt < 0) { toast("지출일·지출금액 열을 찾지 못했습니다."); return; }

    const parseDate = (v) => {
      if (v instanceof Date) return fmt(v);
      let s = String(v).trim();
      const m = s.match(/(\d{4})[.\-\/](\d{1,2})[.\-\/](\d{1,2})/);
      if (m) return `${m[1]}-${String(m[2]).padStart(2, "0")}-${String(m[3]).padStart(2, "0")}`;
      return null;
    };
    const norm = (c) => { c = String(c || "").trim(); return (!c || c === "없음") ? "" : c; };

    const parsed = [];
    for (let i = hi + 1; i < rows.length; i++) {
      const r = rows[i];
      const date = parseDate(r[ci.date]);
      const amt = Number(String(r[ci.amt]).replace(/[^\d.-]/g, "")) || 0;
      if (!date || !amt) continue;
      // 카테고리: 세부 > 카테고리 > 지출내역 순으로 매핑, 우리 카테고리에 맞추되 없으면 원본 유지
      let cat = norm(ci.cat >= 0 ? r[ci.cat] : "");
      const sub = norm(ci.subcat >= 0 ? r[ci.subcat] : "");
      const name = String(ci.name >= 0 ? r[ci.name] : "").trim();
      if (!cat) cat = "기타비용";
      parsed.push({ date, category: cat, name: name || sub || "지출", amount: amt, memo: norm(ci.memo >= 0 ? r[ci.memo] : "") });
    }
    if (!parsed.length) { toast("불러올 지출 내역이 없습니다."); return; }

    // 엑셀 파일 안에서 자기들끼리 중복된 행 제거 (날짜+금액+내용+카테고리 동일)
    const seenInFile = new Set();
    const dedupedParsed = [];
    let fileDup = 0;
    for (const p of parsed) {
      const key = `${p.date}__${p.amount}__${p.name}__${p.category}`;
      if (seenInFile.has(key)) { fileDup++; continue; }
      seenInFile.add(key);
      dedupedParsed.push(p);
    }

    // 미리보기 확인 모달
    const months = [...new Set(dedupedParsed.map(p => p.date.slice(0, 7)))].sort();
    const totalAmt = dedupedParsed.reduce((s, p) => s + p.amount, 0);
    openModal(`<div class="modal" style="max-width:460px">
      <div class="modal-head"><h3>지출 내역 가져오기</h3><button class="icon-btn" data-act="close">✕</button></div>
      <div class="modal-body">
        <p style="font-size:14px;line-height:1.7;color:#374151">
          <b>${dedupedParsed.length}건</b>의 지출을 불러옵니다.<br>
          기간: ${months.join(", ")}<br>
          합계: <b>${won(totalAmt)}원</b>
          ${fileDup ? `<br><span style="color:#F59E0B">파일 내 중복 ${fileDup}건은 자동으로 제외됐습니다.</span>` : ""}
        </p>
        <div style="max-height:180px;overflow-y:auto;margin-top:12px;border:1px solid #EDEEF1;border-radius:9px">
          ${dedupedParsed.slice(0, 30).map(p => `<div style="display:flex;gap:10px;padding:7px 11px;border-bottom:1px solid #F4F5F7;font-size:12.5px">
            <span style="flex:0 0 74px;color:#9CA3AF">${p.date.slice(5)}</span>
            <span style="flex:0 0 auto;color:#0C66E4">${esc(p.category)}</span>
            <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(p.name)}</span>
            <span style="font-weight:700">${won(p.amount)}</span>
          </div>`).join("")}
          ${dedupedParsed.length > 30 ? `<div style="padding:8px 11px;font-size:12px;color:#9CA3AF">…외 ${dedupedParsed.length - 30}건</div>` : ""}
        </div>
        <label class="mcheck" style="margin-top:12px"><input type="checkbox" id="impSkipDup" checked /> 기존 지출 내역과 중복(날짜·금액·내용·카테고리 동일)이면 건너뛰기</label>
      </div>
      <div class="modal-foot"><button class="btn-cancel" data-act="close">취소</button><button class="btn-save" id="impConfirm">${dedupedParsed.length}건 가져오기</button></div>
    </div>`);

    $("#impConfirm").onclick = async () => {
      const skipDup = $("#impSkipDup").checked;
      const existing = DB.all("expenses");
      let added = 0, skipped = 0;
      for (const p of dedupedParsed) {
        if (skipDup && existing.some(e => e.date === p.date && Number(e.amount) === p.amount && (e.name || "") === p.name && (e.category || "") === p.category)) { skipped++; continue; }
        await DB.set("expenses", uid(), { date: p.date, category: p.category, name: p.name, amount: p.amount, memo: p.memo, createdAt: Date.now() });
        added++;
      }
      await DB.log("edit", `엑셀에서 지출 ${added}건 가져오기`);
      closeModal();
      // 가장 최근 달로 이동
      state.budgetMonth = months[months.length - 1];
      toast(`${added}건 추가${skipped ? ` · ${skipped}건 중복 건너뜀` : ""}`);
      render();
    };
  } catch (e) {
    console.error(e);
    toast("파일을 읽지 못했습니다. .xls/.xlsx 형식인지 확인하세요.");
  }
}

/* ============================================================
   대시보드
============================================================ */
function viewDashboard() {
  const today0 = todayStr();
  const t = (state.dashDate && state.dashDate <= today0) ? state.dashDate : today0;
  const isToday = t === today0;
  const dLabel = isToday ? "오늘" : `${parseD(t).getMonth() + 1}월 ${parseD(t).getDate()}일 (${DOW[parseD(t).getDay()]})`;

  const habits = DB.all("habits").filter(h => !h.archived);
  const todayDue = habits.filter(h => isActiveOn(h, t));
  const todayDone = todayDue.filter(h => isChecked(h.id, t));
  const habitPct = todayDue.length ? Math.round(todayDone.length / todayDue.length * 100) : 0;

  const todos = DB.all("todos");
  const openTodos = todos.filter(x => !x.done);
  const overdue = openTodos.filter(x => x.due && x.due < t);
  const dueToday = openTodos.filter(x => x.due === t);

  const wRows = weightRows();
  const latestW = wRows.length ? wRows[wRows.length - 1] : null;
  const dayW = DB.get("weights", "w_" + t);   // 그날 몸무게
  const goal = weightGoal();

  const workouts = DB.all("workouts");
  const weekAgo = fmt(addDays(parseD(t), -6));
  const weekWorkouts = workouts.filter(w => w.date >= weekAgo && w.date <= t).length;
  const dayWorkouts = workouts.filter(w => w.date === t);

  const subjects = DB.all("study");
  const avgProg = subjects.length ? Math.round(subjects.reduce((s, x) => s + (Number(x.progress) || 0), 0) / subjects.length) : 0;

  const bestStreakH = habits.map(h => ({ h, s: currentStreak(h) })).sort((a, b) => b.s - a.s)[0];

  // 선택일 기준 최근 14일 습관 달성률 미니 바
  const days14 = [];
  for (let i = 13; i >= 0; i--) {
    const ds = fmt(addDays(parseD(t), -i));
    const due = habits.filter(h => isActiveOn(h, ds)).length;
    const done = habits.filter(h => isActiveOn(h, ds) && isChecked(h.id, ds)).length;
    days14.push({ ds, pct: due ? done / due : 0, due, done });
  }
  const trendBars = days14.map((d, i) => {
    const h = Math.max(4, Math.round(d.pct * 46));
    const isSel = d.ds === t;
    return `<div class="db-bar-col ${isSel ? "db-bar-sel" : ""}" title="${d.ds} · ${d.done}/${d.due} (${Math.round(d.pct*100)}%)">
      <div class="db-bar"><div class="db-bar-fill" style="height:${h}px;opacity:${d.due ? 1 : 0.25}"></div></div>
      <div class="db-bar-date ${isSel ? "sel" : ""}">${d.ds.slice(5)}</div>
    </div>`;
  }).join("");

  // 링(선택일 습관 달성률)
  const R = 34, C = 2 * Math.PI * R, off = C * (1 - habitPct / 100);

  // 날짜 조회 바
  const dateBar = `<div class="dash-datebar">
    <button class="cal-nav" data-act="dash-prev" title="이전 날">‹</button>
    <input type="date" id="dashDateInput" value="${t}" max="${today0}" />
    <button class="cal-nav" data-act="dash-next" title="다음 날" ${isToday ? "disabled" : ""}>›</button>
    <span class="dash-dlabel">${dLabel}</span>
    ${!isToday ? `<button class="btn-ghost" data-act="dash-today" style="margin-left:auto">오늘로</button>` : ""}
  </div>`;

  return `
  ${dateBar}
  <div class="db-hero">
    <div class="db-ring-card">
      <svg viewBox="0 0 90 90" width="90" height="90">
        <circle cx="45" cy="45" r="${R}" fill="none" stroke="var(--wgrid)" stroke-width="8"/>
        <circle cx="45" cy="45" r="${R}" fill="none" stroke="#22C55E" stroke-width="8" stroke-linecap="round"
          stroke-dasharray="${C}" stroke-dashoffset="${off}" transform="rotate(-90 45 45)"/>
        <text x="45" y="50" text-anchor="middle" font-size="20" font-weight="700" fill="var(--dbtext)">${habitPct}%</text>
      </svg>
      <div class="db-ring-info">
        <div class="db-ring-title">${dLabel} 습관</div>
        <div class="db-ring-sub">${todayDone.length} / ${todayDue.length} 완료</div>
        <button class="btn-ghost" data-act="go-habit" style="margin-top:8px;padding:6px 12px;font-size:12px">습관 보기</button>
      </div>
    </div>
    <div class="db-trend-card">
      <div class="db-card-title">${t}까지 최근 14일 습관 달성 추이</div>
      <div class="db-bars">${trendBars}</div>
    </div>
  </div>

  <div class="db-grid">
    ${dbTile("✅", "할 일", `${openTodos.length}`, "미완료", overdue.length ? `기한 지남 ${overdue.length} · ${isToday ? "오늘" : "이날"} ${dueToday.length}` : `${isToday ? "오늘" : "이날"} 마감 ${dueToday.length}`, "go-todo", overdue.length ? "danger" : "")}
    ${dbTile("⚖️", "몸무게", dayW ? `${dayW.kg}` : (latestW ? `${latestW.kg}` : "—"), "kg", dayW ? `${t.slice(5)} 기록` : (latestW ? `최근 · 목표 ${goal}kg` : "기록 없음"), "go-workout")}
    ${dbTile("💪", "이번 주 운동", `${weekWorkouts}`, "회", `${t} 기준 7일${dayWorkouts.length ? ` · 이날 ${dayWorkouts.length}` : ""}`, "go-workout")}
    ${dbTile("📚", "공부 진도", `${avgProg}`, "%", `${subjects.length}개 과목 평균`, "go-study")}
    ${(() => {
      const songs = DB.all("songs");
      const min = songs.reduce((m, s) => m + (s.sessions || []).reduce((a, x) => a + (Number(x.minutes) || 0), 0), 0);
      const doneN = songs.filter(s => s.status === "done").length;
      return dbTile("🎤", "노래 연습", `${(min / 60).toFixed(1)}`, "시간", songs.length ? `${songs.length}곡 · 완성 ${doneN}` : "곡 없음", "go-song");
    })()}
    ${dbTile("🔥", "최장 연속", `${bestStreakH ? bestStreakH.s : 0}`, "일", esc(bestStreakH?.h.name || "습관 없음"), "go-habit")}
    ${(() => {
      const up = DB.all("ddays").map(dd => ({ dd, diff: ddayDiff(dd) })).filter(r => r.diff >= 0).sort((a, b) => a.diff - b.diff)[0];
      return dbTile("📌", "다가오는 D-Day", up ? (up.diff === 0 ? "D-DAY" : "D-" + up.diff) : "—", "", up ? esc(up.dd.title) : "등록된 날 없음", "go-dday");
    })()}
    ${dbTile("📓", "회고", `${DB.all("journal").length}`, "개", "누적 기록", "go-journal")}
  </div>

  <div class="db-two">
    <div class="db-panel">
      <div class="db-card-title">${isToday ? "오늘" : dLabel} 할 일</div>
      ${todayList((isToday ? dueToday.concat(overdue) : dueToday).slice(0, 6), t)}
    </div>
    <div class="db-panel">
      <div class="db-card-title">${isToday ? "오늘" : dLabel} ${isToday ? "남은" : ""} 습관</div>
      ${isToday
        ? remainHabitList(todayDue.filter(h => !isChecked(h.id, t)).slice(0, 6))
        : dayHabitList(todayDue.slice(0, 8), t)}
    </div>
  </div>`;
}

function dbTile(icon, label, val, unit, sub, act, cls = "") {
  return `<button class="db-tile ${cls}" data-act="${act}">
    <div class="db-tile-top"><span class="db-tile-icon">${icon}</span><span class="db-tile-label">${label}</span></div>
    <div class="db-tile-val">${val}<small>${unit}</small></div>
    <div class="db-tile-sub">${sub}</div>
  </button>`;
}
function todayList(items, t) {
  if (!items.length) return `<div class="td-empty-sub">오늘 마감인 할 일이 없습니다.</div>`;
  return items.map(x => `<div class="db-li ${x.due < t ? "over" : ""}">
    <span class="db-li-dot"></span>
    <span class="db-li-txt">${esc(x.title)}</span>
    <span class="db-li-due">${x.due || ""}</span>
  </div>`).join("");
}
function remainHabitList(items) {
  if (!items.length) return `<div class="td-empty-sub">오늘 할 습관을 모두 마쳤습니다. 👏</div>`;
  return items.map(h => `<button class="db-li db-li-btn" data-act="db-check" data-id="${h.id}">
    <span class="db-li-dot open"></span>
    <span class="db-li-txt">${esc(h.emoji || "🙂")} ${esc(h.name)}</span>
    <span class="db-li-due">체크</span>
  </button>`).join("");
}
// 과거 날짜: 그 날 활성 습관을 완료/미완료 표시 + 클릭으로 그 날짜 토글
function dayHabitList(items, ds) {
  if (!items.length) return `<div class="td-empty-sub">이 날 예정된 습관이 없습니다.</div>`;
  return items.map(h => {
    const done = isChecked(h.id, ds);
    return `<button class="db-li db-li-btn" data-act="db-check-day" data-id="${h.id}" data-date="${ds}">
      <span class="db-li-dot ${done ? "" : "open"}" style="${done ? "background:#22C55E" : ""}"></span>
      <span class="db-li-txt ${done ? "db-li-done" : ""}">${esc(h.emoji || "🙂")} ${esc(h.name)}</span>
      <span class="db-li-due">${done ? "완료" : "미완료"}</span>
    </button>`;
  }).join("");
}
function wireDashboard() {
  const inp = $("#dashDateInput");
  if (inp) inp.onchange = e => { state.dashDate = e.target.value || null; render(); };
}

/* --- 히스토리 --- */
function viewHistory() {
  let rows = DB.all("history").sort((a, b) => b.ts - a.ts);
  if (state.query) rows = rows.filter(r => (r.message || "").toLowerCase().includes(state.query.toLowerCase()));
  if (!rows.length) return `<div class="empty"><div class="big">🕘</div><h3>기록된 활동이 없습니다</h3><p>습관을 만들고 체크하면 모든 변경 이력이 여기에 남습니다.</p></div>`;
  const label = { create: "생성", check: "완료", uncheck: "해제", edit: "수정", delete: "삭제" };
  return rows.slice(0, 300).map(r => `<div class="hrow">
    <div class="hts">${relTime(r.ts)}</div>
    <div class="htype ${r.type}">${label[r.type] || r.type}</div>
    <div class="hmsg">${esc(r.message)}</div>
  </div>`).join("");
}

/* --- 설정 --- */
function viewSettings() {
  const dark = document.body.classList.contains("dark");
  return `
  <div class="set-row"><div><div class="lb">계정</div><div class="ds">${esc(DB.user.email)} · ${DB.mode === "cloud" ? "클라우드 동기화" : "로컬 저장"}</div></div>
    <button class="btn-ghost" data-act="signout">로그아웃</button></div>
  <div class="set-row"><div><div class="lb">다크 모드</div><div class="ds">눈이 편한 어두운 테마로 전환합니다.</div></div>
    <div class="switch ${dark ? "on" : ""}" data-act="theme"></div></div>
  <div class="set-row"><div><div class="lb">알림 권한</div><div class="ds">습관에 설정한 시각에 브라우저 알림을 보냅니다.</div></div>
    <button class="btn-ghost" data-act="notify">권한 요청</button></div>
  <div class="set-row"><div><div class="lb">데이터 내보내기</div><div class="ds">전체 기록을 JSON 파일로 저장합니다.</div></div>
    <button class="btn-ghost" data-act="export">내보내기</button></div>
  <div class="set-row"><div><div class="lb">CSV 내보내기</div><div class="ds">운동·몸무게·공부 기록을 엑셀에서 열 수 있는 CSV로 저장합니다.</div></div>
    <button class="btn-ghost" data-act="export-csv">CSV 저장</button></div>
  <div class="set-row"><div><div class="lb">데이터 가져오기</div><div class="ds">내보낸 JSON을 불러와 현재 기록에 합칩니다.</div></div>
    <button class="btn-ghost" data-act="import">가져오기</button></div>
  <div class="set-row"><div><div class="lb">전체 초기화</div><div class="ds">습관·체크인·회고·히스토리를 모두 지웁니다. 되돌릴 수 없습니다.</div></div>
    <button class="btn-ghost danger" data-act="wipe">전체 삭제</button></div>`;
}

/* ============================================================
   6. 모달
============================================================ */
function closeModal() { $("#modalRoot").innerHTML = ""; }
function openModal(html) {
  $("#modalRoot").innerHTML = `<div class="overlay" data-overlay>${html}</div>`;
  const ov = $(".overlay");
  ov.addEventListener("mousedown", e => { if (e.target === ov) closeModal(); });
  // 모달은 #app 바깥에 그려지므로 취소/닫기 버튼을 여기서 직접 처리한다.
  ov.addEventListener("click", e => {
    const b = e.target.closest("[data-act]");
    if (b && (b.dataset.act === "close" || b.dataset.act === "cancel")) { closeModal(); }
  });
  const f = $(".modal input,.modal textarea"); if (f) setTimeout(() => f.focus(), 30);
}
document.addEventListener("keydown", e => { if (e.key === "Escape") { closeModal(); hideCtx(); } });

/* --- 습관 만들기 / 수정 --- */
function habitModal(existing) {
  const h = existing || {
    emoji: "🙂", name: "", freq: "daily", weekdays: [1, 2, 3, 4, 5],
    goal: "all", startDate: todayStr(), targetDays: "forever", group: "기타",
    reminder: "", autoLog: false
  };
  const groups = [...new Set(DB.all("habits").map(x => x.group || "기타").concat(["기타", "건강", "성장", "관계", "업무"]))];
  openModal(`<div class="modal">
    <div class="modal-head"><h3>${existing ? "습관 수정" : "습관 만들기"}</h3>
      <button class="icon-btn" data-act="close">✕</button></div>
    <div class="modal-body">
      <div class="mrow">
        <button class="emoji-btn" id="emojiBtn">${esc(h.emoji)}<span class="pen">✎</span></button>
        <div class="ctl"><input type="text" id="fname" placeholder="데일리 체크인" value="${esc(h.name)}" maxlength="40" /></div>
      </div>
      <div class="emoji-pop hide" id="emojiPop">${EMOJIS.map(e => `<button data-emoji="${e}">${e}</button>`).join("")}</div>

      <div class="mrow"><label>빈도</label><div class="ctl">
        <select id="ffreq"><option value="daily" ${h.freq === "daily" ? "selected" : ""}>매일</option>
          <option value="weekly" ${h.freq === "weekly" ? "selected" : ""}>요일 지정</option></select></div></div>

      <div class="mrow ${h.freq === "weekly" ? "" : "hide"}" id="rowWk"><label>요일</label>
        <div class="ctl wk-days">${DOW.map((d, i) =>
          `<button type="button" data-wk="${i}" class="${(h.weekdays || []).includes(i) ? "on" : ""}">${d}</button>`).join("")}</div></div>

      <div class="mrow"><label>목표</label><div class="ctl">
        <select id="fgoal"><option value="all" ${h.goal === "all" ? "selected" : ""}>모두 달성</option>
          <option value="most" ${h.goal === "most" ? "selected" : ""}>대부분 달성 (80%)</option></select></div></div>

      <div class="mrow"><label>시작 날짜</label><div class="ctl"><input type="date" id="fstart" value="${h.startDate}" /></div></div>

      <div class="mrow"><label>목표 일수</label><div class="ctl">
        <select id="ftarget">
          <option value="forever" ${h.targetDays === "forever" ? "selected" : ""}>영원히</option>
          <option value="7" ${h.targetDays == 7 ? "selected" : ""}>7일</option>
          <option value="21" ${h.targetDays == 21 ? "selected" : ""}>21일</option>
          <option value="30" ${h.targetDays == 30 ? "selected" : ""}>30일</option>
          <option value="66" ${h.targetDays == 66 ? "selected" : ""}>66일</option>
          <option value="100" ${h.targetDays == 100 ? "selected" : ""}>100일</option>
        </select></div></div>

      <div class="mrow"><label>소속 그룹</label><div class="ctl">
        <select id="fgroup">${groups.map(g => `<option ${((h.group || "기타") === g) ? "selected" : ""}>${esc(g)}</option>`).join("")}
        <option value="__new">+ 새 그룹…</option></select></div></div>

      <div class="mrow"><label>알림</label><div class="ctl"><input type="time" id="freminder" value="${h.reminder || ""}" style="height:42px;border:1px solid #E4E6EA;border-radius:9px;padding:0 12px;width:100%" /></div></div>

      <div class="mdivider"></div>
      <label class="mcheck"><input type="checkbox" id="fautolog" ${h.autoLog ? "checked" : ""} /> 체크할 때 메모 칸 자동으로 열기</label>
    </div>
    <div class="modal-foot">
      <button class="btn-cancel" data-act="close">취소</button>
      <button class="btn-save" id="btnSaveHabit">저장</button>
    </div>
  </div>`);

  let emoji = h.emoji, wk = [...(h.weekdays || [])];
  $("#emojiBtn").onclick = () => $("#emojiPop").classList.toggle("hide");
  $("#emojiPop").onclick = e => {
    const b = e.target.closest("[data-emoji]"); if (!b) return;
    emoji = b.dataset.emoji; $("#emojiBtn").innerHTML = emoji + `<span class="pen">✎</span>`;
    $("#emojiPop").classList.add("hide");
  };
  $("#ffreq").onchange = e => $("#rowWk").classList.toggle("hide", e.target.value !== "weekly");
  $("#rowWk").onclick = e => {
    const b = e.target.closest("[data-wk]"); if (!b) return;
    const i = Number(b.dataset.wk);
    if (wk.includes(i)) wk = wk.filter(x => x !== i); else wk.push(i);
    b.classList.toggle("on");
  };
  $("#fgroup").onchange = e => {
    if (e.target.value === "__new") {
      const g = prompt("새 그룹 이름"); 
      if (g) { const o = document.createElement("option"); o.textContent = g; o.selected = true; e.target.insertBefore(o, e.target.firstChild); }
      else e.target.selectedIndex = 0;
    }
  };
  $("#btnSaveHabit").onclick = async () => {
    const name = $("#fname").value.trim();
    if (!name) { $("#fname").focus(); return toast("습관 이름을 입력하세요."); }
    const freq = $("#ffreq").value;
    if (freq === "weekly" && !wk.length) return toast("최소 한 개 요일을 선택하세요.");
    const id = existing?.id || uid();
    const obj = {
      emoji, name, freq, weekdays: wk.sort(),
      goal: $("#fgoal").value, startDate: $("#fstart").value || todayStr(),
      targetDays: $("#ftarget").value, group: $("#fgroup").value,
      reminder: $("#freminder").value, autoLog: $("#fautolog").checked,
      archived: existing?.archived || false,
      order: existing?.order ?? DB.all("habits").length,
      createdAt: existing?.createdAt || Date.now()
    };
    await DB.set("habits", id, obj);
    await DB.log(existing ? "edit" : "create", `${name} 습관을 ${existing ? "수정" : "생성"}했습니다.`);
    closeModal(); toast(existing ? "수정했습니다." : "습관을 만들었습니다.");
  };
}

/* --- 할 일 모달 --- */
function todoModal(existing) {
  const t = existing || { title: "", due: todayStr(), category: "", done: false };
  const cats = todoCats();
  openModal(`<div class="modal" style="max-width:460px">
    <div class="modal-head"><h3>${existing ? "할 일 수정" : "할 일 추가"}</h3><button class="icon-btn" data-act="close">✕</button></div>
    <div class="modal-body">
      <div class="mrow"><label>제목</label><div class="ctl"><input type="text" id="ttitle" value="${esc(t.title)}" placeholder="무엇을 끝낼까요?" /></div></div>
      <div class="mrow"><label>날짜</label><div class="ctl"><input type="date" id="tdue" value="${t.due || ""}" /></div></div>
      <div class="mrow"><label>항목</label><div class="ctl">
        <select id="tcat"><option value="">— 선택 —</option>
          ${cats.map(c => `<option ${t.category === c ? "selected" : ""}>${esc(c)}</option>`).join("")}
          <option value="__new">+ 새 항목 추가…</option></select></div></div>
      <p style="font-size:12px;color:#9CA3AF;margin-top:4px;line-height:1.6">저장하면 상세 화면에서 대분류·하위 항목·내용·시간·결과·피드백·히스토리를 채울 수 있습니다.</p>
    </div>
    <div class="modal-foot"><button class="btn-cancel" data-act="close">취소</button><button class="btn-save" id="btnSaveTodo">저장</button></div>
  </div>`);
  $("#tcat").onchange = async e => {
    if (e.target.value === "__new") {
      const n = prompt("새 항목 이름");
      if (n && n.trim()) { await addTodoCat(n.trim()); const o = document.createElement("option"); o.textContent = n.trim(); o.selected = true; e.target.insertBefore(o, e.target.lastElementChild); }
      else e.target.value = t.category || "";
    }
  };
  $("#btnSaveTodo").onclick = async () => {
    const title = $("#ttitle").value.trim();
    if (!title) return toast("제목을 입력하세요.");
    const id = existing?.id || uid();
    await DB.set("todos", id, {
      title, due: $("#tdue").value, category: $("#tcat").value,
      content: existing?.content || "", time: existing?.time || "", result: existing?.result || "", feedback: existing?.feedback || "",
      subtasks: existing?.subtasks || [], history: existing?.history || [],
      done: existing?.done || false, order: existing?.order ?? DB.all("todos").length, createdAt: existing?.createdAt || Date.now()
    });
    await DB.log(existing ? "edit" : "create", `할 일 "${title}"을(를) ${existing ? "수정" : "추가"}했습니다.`);
    closeModal();
    if (!existing) { state.tab = "todo"; state.selTodo = id; state.selected = null; render(); }
  };
}

/* --- 할 일 항목(카테고리) 관리 모달 --- */
function catManageModal() {
  const render = () => {
    const list = todoCats();
    openModal(`<div class="modal" style="max-width:420px">
      <div class="modal-head"><h3>할 일 항목 관리</h3><button class="icon-btn" data-act="close">✕</button></div>
      <div class="modal-body">
        <div class="cat-add"><input type="text" id="catNew" placeholder="새 항목 이름" />
          <button class="btn-ghost" id="catAddBtn">추가</button></div>
        <div class="cat-list">
          ${list.map(c => `<div class="cat-row">
            <input class="cat-name" value="${esc(c)}" data-old="${esc(c)}" />
            <button class="sub-x" data-cat-del="${esc(c)}">✕</button>
          </div>`).join("") || `<div class="td-empty-sub">항목이 없습니다.</div>`}
        </div>
      </div>
      <div class="modal-foot"><button class="btn-save" data-act="close">완료</button></div>
    </div>`);
    const add = async () => { const v = $("#catNew").value; if (v.trim()) { await addTodoCat(v.trim()); render(); } };
    $("#catAddBtn").onclick = add;
    $("#catNew").onkeydown = e => { if (e.key === "Enter") add(); };
    $$(".cat-name").forEach(inp => {
      inp.onblur = async () => { const oldN = inp.dataset.old; if (inp.value.trim() && inp.value.trim() !== oldN) { await renameTodoCat(oldN, inp.value.trim()); render(); } };
      inp.onkeydown = e => { if (e.key === "Enter") e.target.blur(); };
    });
    $$("[data-cat-del]").forEach(b => b.onclick = async () => { await removeTodoCat(b.dataset.catDel); render(); if (state.selTodo) renderDetail(); });
  };
  render();
}

/* --- 회고 모달 --- */
function journalModal(existing) {
  const j = existing || { date: todayStr(), mood: "🙂", content: "" };
  openModal(`<div class="modal" style="max-width:520px">
    <div class="modal-head"><h3>${existing ? "회고 수정" : "오늘의 회고"}</h3><button class="icon-btn" data-act="close">✕</button></div>
    <div class="modal-body">
      <div class="mrow"><label>날짜</label><div class="ctl"><input type="date" id="jdate" value="${j.date}" /></div></div>
      <div class="mrow"><label>기분</label><div class="ctl mood-pick">${MOODS.map(m => `<button data-mood="${m}" class="${j.mood === m ? "on" : ""}">${m}</button>`).join("")}</div></div>
      <div class="mrow" style="align-items:flex-start"><label style="padding-top:11px">기록</label>
        <div class="ctl"><textarea id="jcontent" style="min-height:150px" placeholder="오늘 무엇이 잘 됐고, 무엇이 걸렸는지 한 문단으로.">${esc(j.content)}</textarea></div></div>
    </div>
    <div class="modal-foot">
      <button class="btn-cancel" data-act="close">취소</button>
      <button class="btn-ghost" id="btnSaveJKeep" style="margin-right:auto">저장 (계속 쓰기)</button>
      <button class="btn-save" id="btnSaveJ">저장</button>
    </div>
  </div>`);
  let mood = j.mood;
  $(".mood-pick").onclick = e => {
    const b = e.target.closest("[data-mood]"); if (!b) return;
    mood = b.dataset.mood; $$(".mood-pick button").forEach(x => x.classList.remove("on")); b.classList.add("on");
  };
  let jSavedId = existing?.id || null;
  const jDoSave = async (closeAfter) => {
    const content = $("#jcontent").value.trim();
    if (!content) { toast("내용을 입력하세요."); return; }
    const wasNew = !jSavedId;
    if (!jSavedId) jSavedId = uid();
    const cur = DB.get("journal", jSavedId);
    await DB.set("journal", jSavedId, { date: $("#jdate").value, mood, content, createdAt: cur?.createdAt || existing?.createdAt || Date.now() });
    await DB.log(wasNew ? "create" : "edit", `${$("#jdate").value} 회고를 ${wasNew ? "기록" : "수정"}했습니다.`);
    if (closeAfter) closeModal();
    else toast("저장했습니다. 계속 작성하세요.");
  };
  $("#btnSaveJ").onclick = () => jDoSave(true);
  $("#btnSaveJKeep").onclick = () => jDoSave(false);
}

/* --- 확인 --- */
function confirmModal(title, desc, onYes, yesLabel = "삭제") {
  openModal(`<div class="modal" style="max-width:400px">
    <div class="modal-head"><h3>${esc(title)}</h3></div>
    <div class="modal-body"><p style="font-size:13.5px;color:#6B7280;line-height:1.7">${esc(desc)}</p></div>
    <div class="modal-foot"><button class="btn-cancel" data-act="close">취소</button>
      <button class="btn-save" id="cfYes" style="background:#DC2626">${esc(yesLabel)}</button></div>
  </div>`);
  $("#cfYes").onclick = async () => { await onYes(); closeModal(); };
}

/* ============================================================
   7. 컨텍스트 메뉴
============================================================ */
function hideCtx() { $(".ctxmenu")?.remove(); }
document.addEventListener("click", e => { if (!e.target.closest(".ctxmenu")) hideCtx(); }, true);

function showCtx(x, y, items) {
  hideCtx();
  const el = document.createElement("div");
  el.className = "ctxmenu";
  el.innerHTML = items.map(i => i === "-" ? `<div class="sep"></div>`
    : `<button data-k="${i.k}" class="${i.danger ? "danger" : ""}">${i.icon} ${i.label}</button>`).join("");
  document.body.appendChild(el);
  const w = el.offsetWidth, h = el.offsetHeight;
  el.style.left = Math.min(x, innerWidth - w - 10) + "px";
  el.style.top = Math.min(y, innerHeight - h - 10) + "px";
  el.onclick = ev => {
    const b = ev.target.closest("[data-k]"); if (!b) return;
    hideCtx(); items.find(i => i.k === b.dataset.k)?.run();
  };
}

function habitCtx(x, y, h) {
  showCtx(x, y, [
    { k: "edit", icon: "✏️", label: "수정", run: () => habitModal(h) },
    { k: "dup", icon: "📋", label: "복제", run: async () => {
        const id = uid();
        await DB.set("habits", id, { ...h, id, name: h.name + " 복사본", order: DB.all("habits").length, createdAt: Date.now() });
        await DB.log("create", `${h.name}을(를) 복제했습니다.`); toast("복제했습니다.");
      } },
    { k: "today", icon: "✅", label: isChecked(h.id, todayStr()) ? "오늘 체크 취소" : "오늘 체크",
      run: () => handleToggle(h.id, todayStr()) },
    { k: "note", icon: "📝", label: "오늘 메모 남기기", run: () => {
        state.selected = h.id; state.calYM = todayStr().slice(0, 7); state.noteDate = todayStr();
        render();
        setTimeout(() => $("#memoText")?.focus(), 60);
      } },
    "-",
    { k: "arch", icon: h.archived ? "📤" : "📦", label: h.archived ? "보관 해제" : "보관하기",
      run: async () => { await DB.set("habits", h.id, { ...h, archived: !h.archived });
        await DB.log("edit", `${h.name}을(를) ${h.archived ? "보관 해제" : "보관"}했습니다.`);
        if (state.selected === h.id) state.selected = null; } },
    { k: "del", icon: "🗑️", label: "삭제", danger: true, run: () =>
        confirmModal("습관을 삭제할까요?", `"${h.name}"과 관련된 체크인 기록도 함께 사라집니다.`, async () => {
          DB.all("checkins").filter(c => c.habitId === h.id).forEach(c => DB.del("checkins", c.id));
          await DB.del("habits", h.id);
          await DB.log("delete", `${h.name}을(를) 삭제했습니다.`);
          if (state.selected === h.id) state.selected = null;
          toast("삭제했습니다.");
        }) }
  ]);
}

/* ============================================================
   8. 이벤트 위임
============================================================ */
$("#app").addEventListener("click", async (e) => {
  const nav = e.target.closest(".nav-btn[data-tab]");
  if (nav) { state.tab = nav.dataset.tab; state.query = ""; $("#searchInput").value = ""; render(); return; }

  const el = e.target.closest("[data-act]");
  if (!el) return;
  const act = el.dataset.act, id = el.dataset.id, date = el.dataset.date;

  switch (act) {
    case "nav-mode-toggle": {
      const m = DB.get("meta", "navMode");
      const nextMode = (m && m.mode === "folder") ? "flat" : "folder";
      await DB.set("meta", "navMode", { mode: nextMode });
      renderSidebar();
      toast(nextMode === "folder" ? "폴더 보기로 전환했습니다." : "전체 목록으로 전환했습니다.");
      break;
    }
    case "nav-folder-toggle": {
      await toggleFolder(el.dataset.fid);
      renderSidebar();
      break;
    }
    case "open": {
      if (e.target.closest("[data-act='dot']") || e.target.closest("[data-act='menu']")) return;
      state.selected = state.selected === id ? null : id;
      state.calYM = todayStr().slice(0, 7);
      state.noteDate = todayStr();
      render(); break;
    }
    case "dot": {
      e.stopPropagation();
      await handleToggle(id, date);
      break;
    }
    case "calday": {
      await handleToggle(id, date);
      break;
    }
    case "editnote": {
      state.noteDate = date;
      renderDetail();
      setTimeout(() => $("#memoText")?.focus(), 30);
      break;
    }
    case "menu": { e.stopPropagation(); const r = el.getBoundingClientRect(); habitCtx(r.left - 140, r.bottom + 6, DB.get("habits", id)); break; }
    case "anchor": state.anchor = parseD(date); render(); break;
    case "hview": state.hview = el.dataset.v; render(); break;
    case "wk-prev": state.anchor = addDays(state.anchor, -7); render(); break;
    case "wk-next": state.anchor = addDays(state.anchor, 7); render(); break;
    case "wk-today": state.anchor = today(); render(); break;
    case "toggle-cal":
      state.showMiniCal = !state.showMiniCal;
      if (state.showMiniCal) state.calYM = fmt(state.anchor).slice(0, 7);
      render(); break;
    case "mc-prev": case "mc-next": {
      const [y, m] = (state.calYM || todayStr().slice(0, 7)).split("-").map(Number);
      state.calYM = fmt(new Date(y, m - 1 + (act === "mc-next" ? 1 : -1), 1)).slice(0, 7);
      render(); break;
    }
    case "mc-day": {
      state.anchor = parseD(date);
      state.hview = "week";
      state.showMiniCal = false;
      render(); break;
    }
    case "w-del": {
      confirmModal("이 몸무게 기록을 삭제할까요?", `${date} 기록이 사라집니다.`, async () => {
        await DB.del("weights", "w_" + date); await DB.log("delete", `몸무게 ${date} 기록 삭제`); render();
      });
      break;
    }
    /* ---- 대시보드 ---- */
    case "go-habit": state.tab = "habit"; render(); break;
    case "go-todo": state.tab = "todo"; render(); break;
    case "go-workout": state.tab = "workout"; render(); break;
    case "go-study": state.tab = "study"; render(); break;
    case "go-song": state.tab = "song"; render(); break;
    case "go-journal": state.tab = "journal"; render(); break;
    case "go-dday": state.tab = "dday"; render(); break;
    /* ---- D-Day ---- */
    case "dday-new": ddayModal(); break;
    case "dday-menu": {
      const dd = DB.get("ddays", id); const r = el.getBoundingClientRect();
      showCtx(r.left - 140, r.bottom + 6, [
        { k: "e", icon: "✏️", label: "수정", run: () => ddayModal(dd) },
        { k: "g", icon: "📅", label: "구글 캘린더에 추가", run: () => GCal.pushEvent({ title: (dd.emoji || "📌") + " " + dd.title, date: ddayNext(dd) }) },
        "-",
        { k: "x", icon: "🗑️", label: "삭제", danger: true, run: () =>
            confirmModal("D-Day를 삭제할까요?", `"${dd.title}"이(가) 사라집니다.`, async () => {
              await DB.del("ddays", id); await DB.log("delete", `D-Day "${dd.title}" 삭제`); render(); }) }
      ]);
      break;
    }
    /* ---- 달력 ---- */
    case "cal2-day": state.calSelDay = date; render(); break;
    case "cal2-prev": case "cal2-next": {
      const [y, m] = (state.calYMonth || todayStr().slice(0, 7)).split("-").map(Number);
      state.calYMonth = fmt(new Date(y, m - 1 + (act === "cal2-next" ? 1 : -1), 1)).slice(0, 7);
      render(); break;
    }
    case "cal2-today": state.calYMonth = todayStr().slice(0, 7); state.calSelDay = todayStr(); render(); break;
    /* ---- 구글 캘린더 ---- */
    case "gcal-connect": {
      const ym = state.calYMonth || todayStr().slice(0, 7);
      GCal.fetchEvents(ym).then(() => { GCal._loadedFor = ym; render(); });
      break;
    }
    case "gcal-refresh": {
      const ym = state.calYMonth || todayStr().slice(0, 7);
      GCal.fetchEvents(ym).then(() => { GCal._loadedFor = ym; toast("구글 일정을 새로고침했습니다."); render(); });
      break;
    }
    case "gcal-disconnect": GCal.disconnect(); break;
    case "gcal-push-day": {
      // 그 날의 우리 앱 항목(할일·D-Day·목표)을 구글로 내보내기
      const items = [];
      DB.all("todos").filter(t => t.due === date && !t.done).forEach(t => items.push({ title: "할일: " + t.title, date }));
      DB.all("goals").filter(g => g.due === date).forEach(g => items.push({ title: "목표: " + g.title, date }));
      DB.all("ddays").forEach(dd => { if (ddayNext(dd) === date) items.push({ title: (dd.emoji || "📌") + " " + dd.title, date }); });
      if (!items.length) { toast("이 날 내보낼 항목이 없습니다."); break; }
      (async () => {
        for (const it of items) await GCal.pushEvent(it);
        const ym = state.calYMonth || todayStr().slice(0, 7);
        await GCal.fetchEvents(ym); render();
      })();
      break;
    }
    case "db-check": { await handleToggle(id, todayStr()); render(); break; }
    case "db-check-day": { await handleToggle(id, date); render(); break; }
    case "dash-prev": { const base = state.dashDate || todayStr(); state.dashDate = fmt(addDays(parseD(base), -1)); render(); break; }
    case "dash-next": { const base = state.dashDate || todayStr(); const nx = fmt(addDays(parseD(base), 1)); if (nx <= todayStr()) { state.dashDate = nx === todayStr() ? null : nx; render(); } break; }
    case "dash-today": state.dashDate = null; render(); break;
    /* ---- 운동 ---- */
    case "fitsub": state.fitSub = el.dataset.v; render(); break;
    case "bc-del": {
      confirmModal("이 체성분 기록을 삭제할까요?", "되돌릴 수 없습니다.", async () => {
        await DB.del("bodycomp", id); render();
      });
      break;
    }
    case "sched-day": state.schedDay = Number(el.dataset.v); render(); break;
    case "sched-add": schedEditModal(null, Number(el.dataset.day)); break;
    case "sched-edit": { const b = DB.get("schedule", id); if (b) schedEditModal(b, Number(b.day)); break; }
    case "sched-del": {
      const b = DB.get("schedule", id); if (!b) break;
      const gid = b.groupId || b.id;
      const siblings = DB.all("schedule").filter(x => (x.groupId || x.id) === gid);
      if (siblings.length > 1) {
        openModal(`<div class="modal" style="max-width:400px">
          <div class="modal-head"><h3>반복 일정 삭제</h3><button class="icon-btn" data-act="close">✕</button></div>
          <div class="modal-body"><p style="font-size:13.5px;color:#6B7280;line-height:1.7">
            "${esc(b.label)}"은(는) <b>${siblings.length}개 요일</b>에 반복 중입니다.<br>어떻게 삭제할까요?
          </p></div>
          <div class="modal-foot" style="flex-wrap:wrap">
            <button class="btn-cancel" data-act="close">취소</button>
            <button class="btn-ghost" id="scDelOne">이 요일만</button>
            <button class="btn-save" id="scDelAll" style="background:#DC2626">전체 삭제</button>
          </div>
        </div>`);
        $("#scDelOne").onclick = async () => { await DB.del("schedule", id); closeModal(); toast("삭제했습니다."); render(); };
        $("#scDelAll").onclick = async () => {
          for (const s of siblings) await DB.del("schedule", s.id);
          closeModal(); toast(`${siblings.length}개 삭제했습니다.`); render();
        };
      } else {
        confirmModal("이 일정을 삭제할까요?", "되돌릴 수 없습니다.", async () => {
          await DB.del("schedule", id); render();
        });
      }
      break;
    }
    case "sched-dup": {
      const b = DB.get("schedule", id); if (!b) break;
      const dur = Number(b.end) > Number(b.start) ? Number(b.end)-Number(b.start) : 1440-Number(b.start)+Number(b.end);
      // 원본 바로 뒤 시간대로 배치 (24시 넘으면 처음으로 순환)
      const ns = Number(b.end) % 1440;
      const ne = (ns + dur) % 1440;
      await DB.set("schedule", uid(), {
        label: b.label + " (복사)", emoji: b.emoji, color: b.color,
        start: ns, end: ne, day: b.day, createdAt: Date.now()
      });
      toast("복제했습니다."); render(); break;
    }
    case "sched-copy-text": {
      const day = Number(el.dataset.day);
      const blocks = schedBlocks(day);
      if (!blocks.length) { toast("복사할 일정이 없습니다."); break; }
      const lines = [`📅 ${DOW_MON[day]}요일 시간표`, ""];
      let totalMin = 0;
      blocks.forEach(b => {
        const st = Number(b.start), en = Number(b.end);
        const dur = en > st ? en - st : 1440 - st + en;
        totalMin += dur;
        lines.push(`${minToHm(st)} ~ ${minToHm(en)}  ${b.emoji||""} ${b.label}  (${Math.floor(dur/60)}h${dur%60?` ${dur%60}m`:""})`);
      });
      lines.push("", `총 ${(totalMin/60).toFixed(1)}시간 · 여유 ${((1440-totalMin)/60).toFixed(1)}시간`);
      const ok = await copyText(lines.join("\n"));
      if (ok) toast("시간표를 복사했습니다.");
      break;
    }
    case "sched-copy": {
      const target = Number(el.dataset.day);
      const opts = DOW_MON.map((d,i) => i!==target && schedBlocks(i).length
        ? `<option value="${i}">${d}요일 (${schedBlocks(i).length}개)</option>` : "").join("");
      openModal(`<div class="modal" style="max-width:380px">
        <div class="modal-head"><h3>다른 요일 복사</h3><button class="icon-btn" data-act="close">✕</button></div>
        <div class="modal-body">
          <div class="mrow"><label>가져올 요일</label><div class="ctl"><select id="scpFrom">${opts}</select></div></div>
          <p style="font-size:12px;color:#9CA3AF;margin-top:10px;line-height:1.6">선택한 요일의 일정을 <b>${DOW_MON[target]}요일</b>로 복사합니다. 기존 일정은 유지됩니다.</p>
        </div>
        <div class="modal-foot"><button class="btn-cancel" data-act="close">취소</button><button class="btn-save" id="scpGo">복사</button></div>
      </div>`);
      $("#scpGo").onclick = async () => {
        const from = Number($("#scpFrom").value);
        const src = schedBlocks(from);
        for (const b of src) {
          await DB.set("schedule", uid(), { label: b.label, emoji: b.emoji, color: b.color, start: b.start, end: b.end, day: target, createdAt: Date.now() });
        }
        closeModal(); toast(`${src.length}개 복사했습니다.`); render();
      };
      break;
    }
    case "note-cat": state.noteCat = el.dataset.v; state.noteQuery = ""; state.noteSubFilter = ""; render(); break;
    case "note-sub-filter": state.noteSubFilter = el.dataset.v; render(); break;
    case "note-add": noteEditModal(null, el.dataset.cat); break;
    case "note-edit": { const n = DB.get("notes", id); if (n) noteEditModal(n); break; }
    case "note-del": {
      confirmModal("이 노트를 삭제할까요?", "되돌릴 수 없습니다.", async () => {
        await DB.del("notes", id); toast("삭제했습니다."); render();
      });
      break;
    }
    case "note-pin": {
      const n = DB.get("notes", id); if (!n) break;
      await DB.set("notes", id, { ...n, pinned: !n.pinned }); render(); break;
    }
    case "note-copy": {
      const n = DB.get("notes", id); if (!n) break;
      const txt = [n.title, n.body].filter(Boolean).join("\n\n");
      const ok = await copyText(txt);
      if (ok) toast("복사했습니다.");
      break;
    }
    case "note-cat-manage": {
      const cats = getNoteCats();
      openModal(`<div class="modal" style="max-width:520px">
        <div class="modal-head"><h3>노트 카테고리 관리</h3><button class="icon-btn" data-act="close">✕</button></div>
        <div class="modal-body">
          <div id="ncList" style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px">
            ${cats.map(c => `<div class="cat-row" data-cat-id="${c.id}">
              <input class="nc-emoji" value="${esc(c.emoji||"📝")}" style="width:44px;border:1px solid #E4E6EA;border-radius:7px;height:36px;text-align:center;font-size:18px" />
              <input class="nc-label" value="${esc(c.label)}" placeholder="이름" style="flex:1;border:1px solid #E4E6EA;border-radius:7px;height:36px;padding:0 10px" />
              <input class="nc-desc" value="${esc(c.desc||"")}" placeholder="설명" style="flex:2;border:1px solid #E4E6EA;border-radius:7px;height:36px;padding:0 10px" />
              <input type="color" class="nc-color" value="${c.color||"#22C55E"}" style="width:36px;height:36px;border:none;border-radius:7px;cursor:pointer;padding:2px" />
              <button class="icon-btn" style="color:#EF4444;font-size:16px">✕</button>
            </div>`).join("")}
          </div>
          <button class="add-grp" id="ncAddBtn">+ 카테고리 추가</button>
        </div>
        <div class="modal-foot"><button class="btn-cancel" data-act="close">취소</button><button class="btn-save" id="ncSave">저장</button></div>
      </div>`);
      $$("#ncList .cat-row .icon-btn").forEach(b => b.onclick = () => b.closest(".cat-row").remove());
      $("#ncAddBtn").onclick = () => {
        const row = document.createElement("div");
        row.className = "cat-row"; row.style.cssText = "display:flex;align-items:center;gap:6px";
        row.dataset.catId = "nc_" + Date.now();
        row.innerHTML = `<input class="nc-emoji" value="📝" style="width:44px;border:1px solid #E4E6EA;border-radius:7px;height:36px;text-align:center;font-size:18px" />
          <input class="nc-label" placeholder="이름" style="flex:1;border:1px solid #E4E6EA;border-radius:7px;height:36px;padding:0 10px" />
          <input class="nc-desc" placeholder="설명" style="flex:2;border:1px solid #E4E6EA;border-radius:7px;height:36px;padding:0 10px" />
          <input type="color" class="nc-color" value="#22C55E" style="width:36px;height:36px;border:none;border-radius:7px;cursor:pointer;padding:2px" />
          <button class="icon-btn" style="color:#EF4444;font-size:16px">✕</button>`;
        row.querySelector(".icon-btn").onclick = () => row.remove();
        $("#ncList").appendChild(row);
      };
      $("#ncSave").onclick = async () => {
        const rows = $$("#ncList .cat-row");
        const existing = DB.all("noteCats");
        for (const e of existing) await DB.del("noteCats", e.id);
        for (let i = 0; i < rows.length; i++) {
          const r = rows[i];
          const label = r.querySelector(".nc-label").value.trim();
          if (!label) continue;
          await DB.set("noteCats", r.dataset.catId, {
            id: r.dataset.catId, label,
            emoji: r.querySelector(".nc-emoji").value || "📝",
            desc: r.querySelector(".nc-desc").value,
            color: r.querySelector(".nc-color").value,
            order: i, createdAt: Date.now()
          });
        }
        toast("저장했습니다."); closeModal(); render();
      };
      break;
    }
    case "mm-new": {
      const rootId = uid();
      const mmId = uid();
      const root = { id: rootId, text: "중심 주제", parentId: null };
      await DB.set("mindmaps", mmId, { title: "새 마인드맵", nodes: [root], createdAt: Date.now(), updatedAt: Date.now() });
      state.selMindmap = mmId; state.mmSelectedNode = rootId; state.mmZoom = 1; state.mmScrolled = false;
      render(); break;
    }
    case "mm-open": state.selMindmap = id; state.mmSelectedNode = null; state.mmZoom = 1; state.mmScrolled = false; render(); break;
    case "mm-back": state.selMindmap = null; state.mmSelectedNode = null; render(); break;
    case "mm-del": {
      confirmModal("이 마인드맵을 삭제할까요?", "되돌릴 수 없습니다.", async () => {
        await DB.del("mindmaps", id);
        if (state.selMindmap === id) state.selMindmap = null;
        toast("삭제했습니다."); render();
      });
      break;
    }
    case "mm-rename-map": mmRenameMapModal(el.dataset.id); break;
    case "mm-export": {
      const mm = DB.get("mindmaps", el.dataset.id); if (!mm) break;
      const ok = await copyText(`🧠 ${mm.title}\n\n${mmOutlineText(mm)}`);
      if (ok) toast("개요를 복사했습니다.");
      break;
    }
    case "mm-zoom-in": state.mmZoom = Math.min(2, Math.round(((state.mmZoom||1)+0.15)*100)/100); render(); break;
    case "mm-zoom-out": state.mmZoom = Math.max(0.4, Math.round(((state.mmZoom||1)-0.15)*100)/100); render(); break;
    case "mm-deselect": state.mmSelectedNode = null; render(); break;
    case "mm-node-select": state.mmSelectedNode = state.mmSelectedNode === id ? null : id; render(); break;
    case "mm-node-add": {
      const mm = DB.get("mindmaps", state.selMindmap); if (!mm) break;
      const parent = mm.nodes.find(n => n.id === id); if (!parent) break;
      const isParentRoot = !parent.parentId;
      let color;
      if (isParentRoot) {
        const topSiblings = mm.nodes.filter(n => n.parentId === id);
        color = MM_COLORS[topSiblings.length % MM_COLORS.length];
      } else {
        color = parent.color || MM_COLORS[0];
      }
      const newNode = { id: uid(), text: "새 항목", parentId: id, color };
      const nodes = [...mm.nodes, newNode];
      await DB.set("mindmaps", mm.id, { ...mm, nodes, updatedAt: Date.now() });
      state.mmSelectedNode = newNode.id;
      render();
      mmRenameNodeModal(newNode.id);
      break;
    }
    case "mm-node-rename": mmRenameNodeModal(id); break;
    case "mm-node-color": mmColorModal(id); break;
    case "mm-color-pick": {
      const mm = DB.get("mindmaps", state.selMindmap); if (!mm) break;
      const targetId = el.dataset.id, newColor = el.dataset.color;
      // 선택 노드 + 모든 하위 노드에 색상 전파(가지 색상 통일)
      const collectDesc = (pid) => {
        const kids = mm.nodes.filter(n => n.parentId === pid);
        return kids.reduce((acc,k) => [...acc, k.id, ...collectDesc(k.id)], []);
      };
      const affected = new Set([targetId, ...collectDesc(targetId)]);
      const nodes = mm.nodes.map(n => affected.has(n.id) ? { ...n, color: newColor } : n);
      await DB.set("mindmaps", mm.id, { ...mm, nodes, updatedAt: Date.now() });
      closeModal(); render(); break;
    }
    case "mm-node-del": {
      const mm = DB.get("mindmaps", state.selMindmap); if (!mm) break;
      // 하위 노드 전부 수집(재귀)
      const collectDesc = (pid) => {
        const kids = mm.nodes.filter(n => n.parentId === pid);
        return kids.reduce((acc,k) => [...acc, k.id, ...collectDesc(k.id)], []);
      };
      const toRemove = new Set([id, ...collectDesc(id)]);
      const doDel = async () => {
        const nodes = mm.nodes.filter(n => !toRemove.has(n.id));
        await DB.set("mindmaps", mm.id, { ...mm, nodes, updatedAt: Date.now() });
        state.mmSelectedNode = null; render();
      };
      if (toRemove.size > 1) confirmModal("하위 항목도 함께 삭제할까요?", `${toRemove.size - 1}개의 하위 항목이 함께 삭제됩니다.`, doDel);
      else doDel();
      break;
    }
    case "wk-open": state.selWorkout = id || null; render(); break;
    case "wkd-field": {
      const w = DB.get("workouts", el.dataset.wid); if (!w) break;
      w[el.dataset.f] = el.value;
      await DB.set("workouts", w.id, w); break;
    }
    case "wkd-ex-name": {
      const w = DB.get("workouts", el.dataset.wid); if (!w) break;
      w.exercises[Number(el.dataset.ei)].name = el.value;
      await DB.set("workouts", w.id, w); break;
    }
    case "wkd-set-kg":
    case "wkd-set-reps": {
      const w = DB.get("workouts", el.dataset.wid); if (!w) break;
      const ex = w.exercises[Number(el.dataset.ei)];
      const st = ex.sets[Number(el.dataset.si)];
      if (act === "wkd-set-kg") st.kg = el.value; else st.reps = el.value;
      await DB.set("workouts", w.id, w); break;
    }
    case "wkd-set-add": {
      const w = DB.get("workouts", el.dataset.wid); if (!w) break;
      const ex = w.exercises[Number(el.dataset.ei)];
      if (ex.cardio) ex.cardioSets = [...(ex.cardioSets||[]), { dist:"", time:"", speed:"" }];
      else ex.sets = [...(ex.sets||[]), { kg:"", reps:"" }];
      await DB.set("workouts", w.id, w); render(); break;
    }
    case "wkd-set-del": {
      const w = DB.get("workouts", el.dataset.wid); if (!w) break;
      const ex = w.exercises[Number(el.dataset.ei)];
      ex.sets.splice(Number(el.dataset.si), 1);
      await DB.set("workouts", w.id, w); render(); break;
    }
    case "wkd-seg-del": {
      const w = DB.get("workouts", el.dataset.wid); if (!w) break;
      const ex = w.exercises[Number(el.dataset.ei)];
      ex.cardioSets.splice(Number(el.dataset.si), 1);
      await DB.set("workouts", w.id, w); render(); break;
    }
    case "wkd-ex-add": {
      const w = DB.get("workouts", el.dataset.wid); if (!w) break;
      const isCardio = el.dataset.cardio === "1";
      w.exercises = [...(w.exercises||[]), isCardio
        ? { name:"", cardio:true, cardioSets:[{ dist:"", time:"", speed:"" }] }
        : { name:"", sets:[{ kg:"", reps:"" }] }];
      await DB.set("workouts", w.id, w); render(); break;
    }
    case "wkd-ex-del": {
      const w = DB.get("workouts", el.dataset.wid); if (!w) break;
      w.exercises.splice(Number(el.dataset.ei), 1);
      await DB.set("workouts", w.id, w); render(); break;
    }
    case "wk-new": workoutModal(); break;
    case "wk-new-date": workoutModal({ date: el.dataset.date }); break;
    case "wk-collapse": {
      const key = `wk_${id}`;
      if (!state.collapsedTodos) state.collapsedTodos = {};
      state.collapsedTodos[key] = !state.collapsedTodos[key];
      render(); break;
    }
    case "wk-del": {
      confirmModal("이 세션을 삭제할까요?", "되돌릴 수 없습니다.", async () => {
        await DB.del("workouts", id); render();
      });
      break;
    }
    case "wk-clear": state.wkQuery = ""; state.wkFrom = ""; state.wkTo = ""; render(); break;
    /* ---- 목표 ---- */
    case "goal-new": goalModal(); break;
    case "goal-toggle": {
      const g = DB.get("goals", id);
      await DB.set("goals", id, { ...g, done: !g.done, doneAt: !g.done ? Date.now() : null });
      await DB.log(!g.done ? "check" : "uncheck", `목표 "${g.title}" ${!g.done ? "달성" : "재개"}`);
      break;
    }
    case "goal-menu": {
      const g = DB.get("goals", id); const r = el.getBoundingClientRect();
      showCtx(r.left - 140, r.bottom + 6, [
        { k: "e", icon: "✏️", label: "수정", run: () => goalModal(g) },
        "-",
        { k: "x", icon: "🗑️", label: "삭제", danger: true, run: () =>
            confirmModal("목표를 삭제할까요?", `"${g.title}"이(가) 사라집니다.`, async () => {
              await DB.del("goals", id); await DB.log("delete", `목표 "${g.title}" 삭제`); render(); }) }
      ]);
      break;
    }
    /* ---- 주간 리뷰 ---- */
    case "rv-prev": state.reviewOffset = (state.reviewOffset || 0) - 1; state.reviewAi = ""; render(); break;
    case "rv-next": if ((state.reviewOffset || 0) < 0) { state.reviewOffset = (state.reviewOffset || 0) + 1; state.reviewAi = ""; render(); } break;
    case "rv-today": state.reviewOffset = 0; state.reviewAi = ""; render(); break;
    /* ---- 통계 ---- */
    case "stats-preset": {
      const days = Number(el.dataset.v);
      state.statsTo = todayStr();
      state.statsFrom = fmt(addDays(today(), -(days - 1)));
      render(); break;
    }
    case "stats-sel": {
      state.statsSel = state.statsSel === id ? null : id;
      render(); break;
    }
    /* ---- 스트릭 보호 ---- */
    case "use-shield": {
      const h = DB.get("habits", id);
      const shields = [...shieldsOf(h), date];
      await DB.set("habits", id, { ...h, shields });
      await DB.log("edit", `${h.name} · ${date} 스트릭 보호 사용`);
      toast("보호권으로 연속을 지켰습니다.");
      renderDetail(); render();
      break;
    }
    case "wk-copy": {
      const w = DB.get("workouts", id);
      if (!w) break;
      // 세션 내용을 텍스트로 정리해서 복사
      const lines = [`📅 ${w.date} ${w.type ? `[${w.type}]` : ""} ${w.duration ? `⏱${w.duration}` : ""}`.trim()];
      (w.exercises || []).forEach(e => {
        const sets = (e.sets || []).map(s => `${s.kg||0}kg×${s.reps||0}`).join(" / ");
        lines.push(`  ${e.name}${sets ? ` — ${sets}` : ""}`);
      });
      if (w.memo) lines.push(`  📝 ${w.memo}`);
      const ok = await copyText(lines.join("\n"));
      if (ok) toast("세션 내용을 복사했습니다.");
      break;
    }
    case "wk-edit": {
      const w = DB.get("workouts", id);
      if (w) workoutModal(w);
      break;
    }
    case "wk-menu": {
      const w = DB.get("workouts", id); const r = el.getBoundingClientRect();
      showCtx(r.left - 140, r.bottom + 6, [
        { k: "e", icon: "✏️", label: "수정", run: () => workoutModal(w) },
        { k: "d", icon: "📋", label: "복제", run: async () => {
            const nid = uid(); await DB.set("workouts", nid, { ...w, id: nid, date: todayStr(), createdAt: Date.now() }); toast("복제했습니다."); render(); } },
        "-",
        { k: "x", icon: "🗑️", label: "삭제", danger: true, run: () =>
            confirmModal("운동 세션을 삭제할까요?", `${w.date} 세션이 사라집니다.`, async () => {
              await DB.del("workouts", id); await DB.log("delete", `운동 세션 ${w.date} 삭제`); render(); }) }
      ]);
      break;
    }
    /* ---- 공부 ---- */
    case "study-sub": state.studySub = el.dataset.v; render(); break;
    case "book-add": bookEditModal(null); break;
    case "book-edit": { const b = DB.get("books", id); if (b) bookEditModal(b); break; }
    case "book-del": {
      confirmModal("이 책 기록을 삭제할까요?", "되돌릴 수 없습니다.", async () => {
        await DB.del("books", id); toast("삭제했습니다."); render();
      });
      break;
    }
    case "book-copy": {
      const b = DB.get("books", id); if (!b) break;
      const lines = [
        `📖 ${b.title}${b.author?` — ${b.author}`:""}`,
        b.rating?`⭐ ${b.rating}/5`:"",
        b.review?`\n${b.review}`:""
      ].filter(Boolean).join("\n");
      const ok = await copyText(lines);
      if (ok) toast("복사했습니다.");
      break;
    }
    case "book-log-add": {
      const b = DB.get("books", id); if (!b) break;
      const dateEl = document.querySelector(`.book-log-date[data-id="${id}"]`);
      const pagesEl = document.querySelector(`.book-log-pages[data-id="${id}"]`);
      const noteEl = document.querySelector(`.book-log-note[data-id="${id}"]`);
      const date = dateEl?.value || todayStr();
      const pages = pagesEl?.value ? Number(pagesEl.value) : null;
      const note = noteEl?.value.trim() || "";
      if (!pages && !note) return toast("페이지나 메모 중 하나는 입력하세요.");
      const logs = [...(b.logs||[]), { date, pages, note, createdAt: Date.now() }];
      const patch = { logs };
      if (pages && (!b.curPage || pages > Number(b.curPage))) patch.curPage = String(pages);
      await DB.set("books", id, { ...b, ...patch });
      toast("기록했습니다."); render(); break;
    }
    case "book-log-del": {
      const b = DB.get("books", id); if (!b) break;
      const logs = (b.logs||[]).slice();
      logs.splice(Number(el.dataset.idx), 1);
      await DB.set("books", id, { ...b, logs }); render(); break;
    }
    case "book-quote-add": {
      openModal(`<div class="modal" style="max-width:460px">
        <div class="modal-head"><h3>인상 깊은 구절</h3><button class="icon-btn" data-act="close">✕</button></div>
        <div class="modal-body">
          <div class="mrow" style="align-items:flex-start"><label style="padding-top:11px">구절</label><div class="ctl">
            <textarea id="qtText" rows="4" placeholder="인용할 문장 (줄바꿈 가능)" style="resize:vertical"></textarea>
          </div></div>
          <div class="mrow"><label>페이지</label><div class="ctl"><input type="text" id="qtPage" placeholder="예: 127 (선택)" /></div></div>
        </div>
        <div class="modal-foot"><button class="btn-cancel" data-act="close">취소</button><button class="btn-save" id="qtSave">추가</button></div>
      </div>`);
      setTimeout(() => $("#qtText")?.focus(), 40);
      $("#qtSave").onclick = async () => {
        const text = $("#qtText").value.trim();
        if (!text) return toast("구절을 입력하세요.");
        const b = DB.get("books", id); if (!b) return;
        const quotes = [...(b.quotes||[]), { text, page: $("#qtPage").value.trim(), createdAt: Date.now() }];
        await DB.set("books", id, { ...b, quotes });
        closeModal(); toast("추가했습니다."); render();
      };
      break;
    }
    case "book-quote-del": {
      const b = DB.get("books", id); if (!b) break;
      const quotes = (b.quotes||[]).slice();
      quotes.splice(Number(el.dataset.idx), 1);
      await DB.set("books", id, { ...b, quotes }); render(); break;
    }
    case "book-goal-set": {
      const year = todayStr().slice(0,4);
      const goalMeta = DB.get("meta", "readingGoal") || {};
      openModal(`<div class="modal" style="max-width:380px">
        <div class="modal-head"><h3>${year}년 독서 목표</h3><button class="icon-btn" data-act="close">✕</button></div>
        <div class="modal-body">
          <div class="mrow"><label>목표 권수</label><div class="ctl"><input type="number" id="rgVal" value="${goalMeta[year]||""}" placeholder="예: 24" min="0" /></div></div>
        </div>
        <div class="modal-foot"><button class="btn-cancel" data-act="close">취소</button><button class="btn-save" id="rgSave">저장</button></div>
      </div>`);
      $("#rgSave").onclick = async () => {
        const v = Number($("#rgVal").value) || 0;
        await DB.set("meta", "readingGoal", { ...goalMeta, [year]: v });
        closeModal(); toast("목표를 저장했습니다."); render();
      };
      break;
    }
    case "study-new": studyModal(); break;
    case "md-add": mdEditModal(null); break;
    case "md-edit": { const x = DB.get("mdItems", id); if (x) mdEditModal(x); break; }
    case "md-del": {
      confirmModal("이 자료를 삭제할까요?", "되돌릴 수 없습니다.", async () => {
        await DB.del("mdItems", id); toast("삭제했습니다."); render();
      });
      break;
    }
    case "md-copy": {
      const x = DB.get("mdItems", id); if (!x) break;
      const lines = [
        `🎯 ${x.title}${x.source?` — ${x.source}`:""}`,
        x.rating?`⭐ ${x.rating}/5`:"",
        x.review?`\n${x.review}`:""
      ].filter(Boolean).join("\n");
      const ok = await copyText(lines);
      if (ok) toast("복사했습니다.");
      break;
    }
    case "md-log-add": {
      const x = DB.get("mdItems", id); if (!x) break;
      const dateEl = document.querySelector(`.md-log-date[data-id="${id}"]`);
      const progEl = document.querySelector(`.md-log-progress[data-id="${id}"]`);
      const noteEl = document.querySelector(`.md-log-note[data-id="${id}"]`);
      const date = dateEl?.value || todayStr();
      const progress = progEl?.value !== "" ? Number(progEl.value) : null;
      const note = noteEl?.value.trim() || "";
      if (progress == null && !note) return toast("진행률이나 메모 중 하나는 입력하세요.");
      const logs = [...(x.logs||[]), { date, progress, note, createdAt: Date.now() }];
      const patch = { logs };
      if (progress != null && progress > (Number(x.progressPct)||0)) patch.progressPct = String(progress);
      await DB.set("mdItems", id, { ...x, ...patch });
      toast("기록했습니다."); render(); break;
    }
    case "md-log-del": {
      const x = DB.get("mdItems", id); if (!x) break;
      const logs = (x.logs||[]).slice();
      logs.splice(Number(el.dataset.idx), 1);
      await DB.set("mdItems", id, { ...x, logs }); render(); break;
    }
    case "md-insight-add": {
      openModal(`<div class="modal" style="max-width:460px">
        <div class="modal-head"><h3>핵심 인사이트</h3><button class="icon-btn" data-act="close">✕</button></div>
        <div class="modal-body">
          <div class="mrow" style="align-items:flex-start"><label style="padding-top:11px">내용</label><div class="ctl">
            <textarea id="inText" rows="4" placeholder="업무에 적용할 인사이트 (줄바꿈 가능)" style="resize:vertical"></textarea>
          </div></div>
        </div>
        <div class="modal-foot"><button class="btn-cancel" data-act="close">취소</button><button class="btn-save" id="inSave">추가</button></div>
      </div>`);
      setTimeout(() => $("#inText")?.focus(), 40);
      $("#inSave").onclick = async () => {
        const text = $("#inText").value.trim();
        if (!text) return toast("내용을 입력하세요.");
        const x = DB.get("mdItems", id); if (!x) return;
        const insights = [...(x.insights||[]), { text, createdAt: Date.now() }];
        await DB.set("mdItems", id, { ...x, insights });
        closeModal(); toast("추가했습니다."); render();
      };
      break;
    }
    case "md-insight-del": {
      const x = DB.get("mdItems", id); if (!x) break;
      const insights = (x.insights||[]).slice();
      insights.splice(Number(el.dataset.idx), 1);
      await DB.set("mdItems", id, { ...x, insights }); render(); break;
    }
    case "md-goal-set": {
      const year = todayStr().slice(0,4);
      const goalMeta = DB.get("meta", "mdGoal") || {};
      openModal(`<div class="modal" style="max-width:380px">
        <div class="modal-head"><h3>${year}년 MD 학습 목표</h3><button class="icon-btn" data-act="close">✕</button></div>
        <div class="modal-body">
          <div class="mrow"><label>목표 개수</label><div class="ctl"><input type="number" id="mgVal" value="${goalMeta[year]||""}" placeholder="예: 30" min="0" /></div></div>
        </div>
        <div class="modal-foot"><button class="btn-cancel" data-act="close">취소</button><button class="btn-save" id="mgSave">저장</button></div>
      </div>`);
      $("#mgSave").onclick = async () => {
        const v = Number($("#mgVal").value) || 0;
        await DB.set("meta", "mdGoal", { ...goalMeta, [year]: v });
        closeModal(); toast("목표를 저장했습니다."); render();
      };
      break;
    }
    case "study-menu": {
      const s = DB.get("study", id); const r = el.getBoundingClientRect();
      showCtx(r.left - 140, r.bottom + 6, [
        { k: "e", icon: "✏️", label: "수정", run: () => studyModal(s) },
        "-",
        { k: "x", icon: "🗑️", label: "삭제", danger: true, run: () =>
            confirmModal("과목을 삭제할까요?", `"${s.name}"과 학습 기록이 사라집니다.`, async () => {
              await DB.del("study", id); await DB.log("delete", `과목 "${s.name}" 삭제`); render(); }) }
      ]);
      break;
    }
    case "study-log-add": {
      const row = el.closest(".study-card") || el.closest(".study-loginput");
      const txtEl = $(`.study-log-in[data-id="${id}"]`);
      const minEl = $(`.study-min-in[data-id="${id}"]`);
      const text = txtEl?.value.trim();
      if (!text) { txtEl?.focus(); toast("진도 내용을 입력하세요."); break; }
      const s = DB.get("study", id);
      const logs = [...(s.logs || []), { id: uid(), date: todayStr(), text, minutes: Number(minEl?.value) || 0 }];
      await DB.set("study", id, { ...s, logs });
      await DB.log("edit", `"${s.name}" 학습 기록 추가`);
      render(); break;
    }
    /* ---- 노래 ---- */
    case "song-new": songModal(); break;
    case "song-clear": state.songQuery = ""; render(); break;
    case "vocal-record-modal": {
      const cats = getVocalCats();
      const catOpts = cats.map(c => `<option value="${esc(c.id)}">${c.emoji} ${esc(c.label)}</option>`).join("");
      const firstCat = cats[0] || { id: "sing", label: "노래", desc: "" };
      openModal(`<div class="modal" style="max-width:480px">
        <div class="modal-head"><h3>연습 기록</h3><button class="icon-btn" data-act="close">✕</button></div>
        <div class="modal-body">
          <div class="mrow">
            <label>카테고리</label>
            <div class="ctl">
              <select id="vCat" style="height:42px;font-size:14px">
                ${catOpts}
              </select>
            </div>
          </div>
          <div class="mrow"><label>날짜</label><div class="ctl"><input type="date" id="vDate" value="${todayStr()}" max="${todayStr()}" /></div></div>
          <div class="mrow"><label>시간(분)</label><div class="ctl"><input type="number" id="vMin" min="0" placeholder="30" /></div></div>
          <div class="mrow"><label>만족도</label><div class="ctl">
            <div class="song-star-pick" id="vStar">${[1,2,3,4,5].map(n=>`<button data-star="${n}" style="font-size:22px">☆</button>`).join("")}</div>
          </div></div>
          <div class="mrow" style="align-items:flex-start">
            <label style="padding-top:11px">내용</label>
            <div class="ctl">
              <textarea id="vNote" rows="4" placeholder="오늘 한 내용, 느낀 점 (줄바꿈 가능)" style="resize:vertical"></textarea>
            </div>
          </div>
        </div>
        <div class="modal-foot"><button class="btn-cancel" data-act="close">취소</button><button class="btn-save" id="vSave">기록</button></div>
      </div>`);
      // 별점
      const starPick = $("#vStar");
      if (starPick) starPick.onclick = e => {
        const b = e.target.closest("[data-star]"); if (!b) return;
        const n = Number(b.dataset.star);
        starPick.dataset.selected = n;
        $$("button", starPick).forEach((btn, i) => btn.textContent = i < n ? "★" : "☆");
      };
      // 저장
      $("#vSave").onclick = async () => {
        const cat = $("#vCat")?.value || firstCat.id;
        const date = $("#vDate")?.value || todayStr();
        const minutes = Number($("#vMin")?.value) || 0;
        const rating = Number($("#vStar")?.dataset.selected) || 0;
        const note = $("#vNote")?.value.trim() || "";
        if (!minutes && !rating && !note) return toast("시간·만족도·내용 중 하나는 입력하세요.");
        const c = getVocalCat(cat);
        await DB.set("vocal", uid(), { cat, date, minutes, rating, note, createdAt: Date.now() });
        await DB.log("edit", `${c.label} 연습 ${minutes ? minutes+"분" : ""} 기록`);
        closeModal(); toast("기록했습니다."); render();
      };
      break;
    }
    case "vocal-cat-manage": {
      const cats = getVocalCats();
      openModal(`<div class="modal" style="max-width:500px">
        <div class="modal-head"><h3>카테고리 관리</h3><button class="icon-btn" data-act="close">✕</button></div>
        <div class="modal-body">
          <div id="catList" style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px">
            ${cats.map((c, i) => `<div class="cat-row" data-cat-id="${c.id}">
              <input class="cat-emoji" value="${esc(c.emoji||"🎤")}" style="width:44px;border:1px solid #E4E6EA;border-radius:7px;height:36px;text-align:center;font-size:18px" />
              <input class="cat-label" value="${esc(c.label)}" placeholder="이름" style="flex:1;border:1px solid #E4E6EA;border-radius:7px;height:36px;padding:0 10px" />
              <input class="cat-desc" value="${esc(c.desc||"")}" placeholder="설명" style="flex:2;border:1px solid #E4E6EA;border-radius:7px;height:36px;padding:0 10px" />
              <input type="color" class="cat-color" value="${c.color||"#22C55E"}" style="width:36px;height:36px;border:none;border-radius:7px;cursor:pointer;padding:2px" />
              <button class="icon-btn" style="color:#EF4444;font-size:16px" data-del-cat="${c.id}">✕</button>
            </div>`).join("")}
          </div>
          <button class="add-grp" id="catAddBtn">+ 카테고리 추가</button>
        </div>
        <div class="modal-foot"><button class="btn-cancel" data-act="close">취소</button><button class="btn-save" id="catSave">저장</button></div>
      </div>`);
      // 삭제
      $$("[data-del-cat]").forEach(b => b.onclick = () => b.closest(".cat-row").remove());
      // 추가
      $("#catAddBtn").onclick = () => {
        const row = document.createElement("div");
        row.className = "cat-row"; row.style.cssText = "display:flex;align-items:center;gap:6px";
        const nid = "cat_" + Date.now();
        row.dataset.catId = nid;
        row.innerHTML = `<input class="cat-emoji" value="🎤" style="width:44px;border:1px solid #E4E6EA;border-radius:7px;height:36px;text-align:center;font-size:18px" />
          <input class="cat-label" placeholder="이름" style="flex:1;border:1px solid #E4E6EA;border-radius:7px;height:36px;padding:0 10px" />
          <input class="cat-desc" placeholder="설명" style="flex:2;border:1px solid #E4E6EA;border-radius:7px;height:36px;padding:0 10px" />
          <input type="color" class="cat-color" value="#22C55E" style="width:36px;height:36px;border:none;border-radius:7px;cursor:pointer;padding:2px" />
          <button class="icon-btn" style="color:#EF4444;font-size:16px">✕</button>`;
        row.querySelector(".icon-btn").onclick = () => row.remove();
        $("#catList").appendChild(row);
      };
      // 저장
      $("#catSave").onclick = async () => {
        const rows = $$(".cat-row");
        // 기존 카테고리 삭제 후 재저장
        const existing = DB.all("vocalCats");
        for (const e of existing) await DB.del("vocalCats", e.id);
        for (let i = 0; i < rows.length; i++) {
          const r = rows[i];
          const catId = r.dataset.catId;
          const label = r.querySelector(".cat-label").value.trim();
          if (!label) continue;
          await DB.set("vocalCats", catId, {
            id: catId, label,
            emoji: r.querySelector(".cat-emoji").value || "🎤",
            desc: r.querySelector(".cat-desc").value,
            color: r.querySelector(".cat-color").value,
            order: i, createdAt: Date.now()
          });
        }
        toast("카테고리를 저장했습니다."); closeModal(); render();
      };
      break;
    }
    case "vocal-del": {
      confirmModal("이 연습 기록을 삭제할까요?", "되돌릴 수 없습니다.", async () => {
        await DB.del("vocal", id); render();
      });
      break;
    }
    case "vocal-copy": {
      const r = DB.get("vocal", id);
      if (!r) break;
      const c = VOCAL_CATS[r.cat];
      const lines = [
        `🎤 ${c?.label||r.cat||"노래"} 연습 — ${r.date}`,
        r.minutes ? `⏱ ${r.minutes}분` : "",
        r.rating ? `⭐ ${r.rating}/5` : "",
        r.note ? `\n${r.note}` : ""
      ].filter(Boolean).join("\n");
      const ok = await copyText(lines);
      if (ok) toast("복사했습니다.");
      break;
    }
    case "vocal-edit": {
      const r = DB.get("vocal", id);
      if (!r) break;
      openModal(`<div class="modal" style="max-width:460px">
        <div class="modal-head"><h3>기록 수정</h3><button class="icon-btn" data-act="close">✕</button></div>
        <div class="modal-body">
          <div class="mrow"><label>날짜</label><div class="ctl"><input type="date" id="veDate" value="${r.date || ""}" /></div></div>
          <div class="mrow"><label>시간(분)</label><div class="ctl"><input type="number" id="veMin" value="${Number(r.minutes) || 0}" /></div></div>
          <div class="mrow"><label>만족도</label><div class="ctl">
            <div class="song-star-pick" id="veStar" data-selected="${r.rating || 0}">
              ${[1,2,3,4,5].map(n => `<button data-star="${n}">${n <= (r.rating || 0) ? "★" : "☆"}</button>`).join("")}
            </div>
          </div></div>
          <div class="mrow" style="align-items:flex-start"><label style="padding-top:11px">내용</label><div class="ctl">
            <textarea id="veNote" rows="5" style="resize:vertical">${esc(r.note || "")}</textarea>
          </div></div>
        </div>
        <div class="modal-foot">
          <button class="btn-cancel" data-act="close">취소</button>
          <button class="btn-ghost" id="veSaveKeep" style="margin-right:auto">저장 (계속 쓰기)</button>
          <button class="btn-save" id="veSave">저장</button>
        </div>
      </div>`);
      // 별점 선택
      const starPick = $("#veStar");
      if (starPick) starPick.onclick = ev => {
        const b = ev.target.closest("[data-star]"); if (!b) return;
        const n = Number(b.dataset.star);
        starPick.dataset.selected = n;
        $$("button", starPick).forEach((btn, i) => btn.textContent = i < n ? "★" : "☆");
      };
      const veDoSave = async (closeAfter) => {
        const cur = DB.get("vocal", id) || r;
        await DB.set("vocal", id, {
          ...cur,
          date: $("#veDate").value || r.date,
          minutes: Number($("#veMin").value) || 0,
          rating: Number($("#veStar").dataset.selected) || 0,
          note: $("#veNote").value
        });
        await DB.log("edit", `${r.cat || ""} 연습 기록 수정`);
        if (closeAfter) { closeModal(); toast("수정했습니다."); render(); }
        else toast("저장했습니다. 계속 작성하세요.");
      };
      $("#veSave").onclick = () => veDoSave(true);
      $("#veSaveKeep").onclick = () => veDoSave(false);
      break;
    }
    /* ---- 가계부 ---- */
    case "budsub": state.budgetSub = el.dataset.v; render(); break;
    case "bud-range-clear": state.budFrom = ""; state.budTo = ""; render(); break;
    case "fin-months": state.financeMonths = Number(el.dataset.v); render(); break;
    case "bud-prev": case "bud-next": {
      const [y, mm] = curMonth().split("-").map(Number);
      state.budgetMonth = fmt(new Date(y, mm - 1 + (act === "bud-next" ? 1 : -1), 1)).slice(0, 7);
      render(); break;
    }
    case "fx-add": {
      const kind = el.dataset.kind;
      const ymv = el.dataset.ym || curMonth();
      await DB.set("fixedItems", uid(), { name: "", kind, amount: 0, ym: ymv, order: DB.all("fixedItems").length, createdAt: Date.now() });
      render();
      setTimeout(() => { const rows = $$(".fx-name"); rows[rows.length - 1]?.focus(); }, 40);
      break;
    }
    case "fx-copy-prev": {
      const targetYm = el.dataset.ym, srcYm = el.dataset.prev;
      const srcItems = DB.all("fixedItems").filter(f => f.ym === srcYm);
      if (!srcItems.length) { toast("이전 달 내역이 없습니다."); break; }
      const existing = DB.all("fixedItems").filter(f => f.ym === targetYm);
      confirmModal(`${srcYm.replace("-",".")} 내역 ${srcItems.length}건을 가져올까요?`,
        existing.length ? `현재 달에 이미 ${existing.length}건이 있습니다. 중복된 이름은 건너뜁니다.` : "",
        async () => {
          let added = 0;
          const base = DB.all("fixedItems").length;
          for (const f of srcItems) {
            if (existing.some(e => e.name === f.name && e.kind === f.kind)) continue;
            await DB.set("fixedItems", uid(), { name: f.name, kind: f.kind, amount: f.amount, ym: targetYm, order: base + added, createdAt: Date.now() });
            added++;
          }
          toast(`${added}건 복사했습니다.`); render();
        }, "복사");
      break;
    }
    case "fx-del": {
      await DB.del("fixedItems", id); render(); break;
    }
    case "asset-add": {
      const kind = el.dataset.kind;
      await DB.set("assets", uid(), { name: "", kind, amount: 0, order: DB.all("assets").length, createdAt: Date.now() });
      render();
      setTimeout(() => { const rows = $$(".fx-name"); rows[rows.length - 1]?.focus(); }, 40);
      break;
    }
    case "asset-del": {
      confirmModal("이 자산 항목을 삭제할까요?", "되돌릴 수 없습니다.", async () => {
        await DB.del("assets", id); render();
      });
      break;
    }
    case "asset-goal-set": {
      const g = DB.get("meta", "assetGoal") || {};
      openModal(`<div class="modal" style="max-width:400px">
        <div class="modal-head"><h3>목표 자산 설정</h3><button class="icon-btn" data-act="close">✕</button></div>
        <div class="modal-body">
          <div class="mrow"><label>목표 이름</label><div class="ctl"><input type="text" id="agLabel" value="${esc(g.label||"")}" placeholder="예: 1억 모으기, 전세자금" /></div></div>
          <div class="mrow"><label>목표 금액</label><div class="ctl"><input type="number" id="agAmt" value="${g.amount||""}" placeholder="예: 100000000" min="0" /></div></div>
          <p style="font-size:12px;color:#9CA3AF;margin-top:10px;line-height:1.6">최근 3개월 평균 저축액을 기준으로 목표 도달 시점을 예상해 드려요.</p>
        </div>
        <div class="modal-foot">
          ${g.amount ? `<button class="btn-ghost danger" id="agDel" style="margin-right:auto">목표 삭제</button>` : ""}
          <button class="btn-cancel" data-act="close">취소</button><button class="btn-save" id="agSave">저장</button>
        </div>
      </div>`);
      setTimeout(() => $("#agLabel")?.focus(), 40);
      $("#agSave").onclick = async () => {
        const amount = Number($("#agAmt").value) || 0;
        if (!amount) return toast("목표 금액을 입력하세요.");
        await DB.set("meta", "assetGoal", { label: $("#agLabel").value.trim() || "목표 자산", amount });
        closeModal(); toast("목표를 저장했습니다."); render();
      };
      const delBtn = $("#agDel");
      if (delBtn) delBtn.onclick = async () => {
        await DB.del("meta", "assetGoal");
        closeModal(); toast("목표를 삭제했습니다."); render();
      };
      break;
    }
    case "asset-snapshot": {
      await DB.set("meta", "assetSnapshot", { total: sumAssets(), date: todayStr(), createdAt: Date.now() });
      toast("현재 자산을 기록했습니다."); render();
      break;
    }
    case "fx-seed": await seedFixedItems(); break;
    case "fx-dedup": await deduplicateFixedItems(); break;
    case "exp-del": {
      await DB.del("expenses", id); render(); break;
    }
    case "pitch-del": {
      confirmModal("이 음정 기록을 삭제할까요?", "되돌릴 수 없습니다.", async () => {
        await DB.del("pitches", id); render();
      });
      break;
    }
    case "song-menu": {
      const s = DB.get("songs", id); const r = el.getBoundingClientRect();
      showCtx(r.left - 140, r.bottom + 6, [
        { k: "e", icon: "✏️", label: "수정", run: () => songModal(s) },
        { k: "l", icon: "🎯", label: "상태: 배우는 중", run: () => DB.set("songs", id, { ...s, status: "learning" }) },
        { k: "p", icon: "🎤", label: "상태: 연습 중", run: () => DB.set("songs", id, { ...s, status: "practicing" }) },
        { k: "d", icon: "✅", label: "상태: 완성", run: () => DB.set("songs", id, { ...s, status: "done" }) },
        "-",
        { k: "x", icon: "🗑️", label: "삭제", danger: true, run: () =>
            confirmModal("곡을 삭제할까요?", `"${s.title}"과 연습 기록이 사라집니다.`, async () => {
              await DB.del("songs", id); await DB.log("delete", `곡 "${s.title}" 삭제`); render(); }) }
      ]);
      break;
    }
    case "song-log-add": {
      const s = DB.get("songs", id);
      const minEl = $(`.song-min-in[data-id="${id}"]`);
      const noteEl = $(`.song-note-in[data-id="${id}"]`);
      const pick = $(`.song-star-pick[data-id="${id}"]`);
      const rating = Number(pick?.dataset.selected) || 0;
      const minutes = Number(minEl?.value) || 0;
      const note = noteEl?.value.trim() || "";
      if (!minutes && !rating && !note) { toast("연습 시간·평가·메모 중 하나는 입력하세요."); break; }
      const sessions = [...(s.sessions || []), { id: uid(), date: todayStr(), minutes, rating, note }];
      await DB.set("songs", id, { ...s, sessions });
      await DB.log("edit", `곡 "${s.title}" 연습 기록`);
      render(); break;
    }
    /* ---- 할 일 하위 미리보기 ---- */
    case "td-collapse": {
      e.stopPropagation();
      state.collapsedTodos[id] = !state.collapsedTodos[id];
      render(); break;
    }
    case "td-preview-toggle": {
      e.stopPropagation();
      const gid = el.dataset.gid, iid = el.dataset.iid;
      const tt = DB.get("todos", id);
      const subtasks = (tt.subtasks || []).map(g => g.id !== gid ? g :
        { ...g, items: g.items.map(it => {
          if (it.id !== iid) return it;
          if (!it.done && !it.failed) return { ...it, done: true, failed: false };
          if (it.done) return { ...it, done: false, failed: true };
          return { ...it, done: false, failed: false };
        }) });
      await patchTodo(id, { subtasks });
      render();
      if (state.selTodo === id) renderDetail();
      break;
    }
    case "close-detail": state.selected = null; state.selTodo = null; render(); break;
    case "cal-prev": case "cal-next": {
      const [y, m] = (state.calYM || todayStr().slice(0, 7)).split("-").map(Number);
      const d = new Date(y, m - 1 + (act === "cal-next" ? 1 : -1), 1);
      state.calYM = fmt(d).slice(0, 7); renderDetail(); break;
    }
    case "new-habit": habitModal(); break;
    case "new-todo": todoModal(); break;
    case "new-journal": journalModal(); break;
    case "td-open": {
      if (e.target.closest('[data-act="todo-toggle"]') || e.target.closest('[data-act="todo-menu"]')) return;
      state.selTodo = state.selTodo === id ? null : id;
      state.selected = null;
      render(); break;
    }
    case "todo-toggle": {
      e.stopPropagation();
      const x = DB.get("todos", id);
      if (!x.done && !x.failed) {
        await patchTodo(id, { done: true, failed: false, doneAt: Date.now() });
        await DB.log("check", `할 일 "${x.title}" 완료`);
      } else if (x.done) {
        await patchTodo(id, { done: false, failed: true, doneAt: null });
        await DB.log("uncheck", `할 일 "${x.title}" 실패 표시`);
      } else {
        await patchTodo(id, { done: false, failed: false, doneAt: null });
        await DB.log("uncheck", `할 일 "${x.title}" 초기화`);
      }
      if (state.selTodo === id) renderDetail(); else render(); break;
    }
    case "td-issue-toggle": {
      const x = DB.get("todos", id);
      if (!x) break;
      await patchTodo(id, { isIssue: !x.isIssue });
      renderDetail(); break;
    }
    case "todo-view": state.todoView = el.dataset.v; render(); break;
    case "wl-add": {
      const el2 = $("#wlInput");
      const text = el2?.value.trim();
      if (!text) return toast("내용을 입력하세요.");
      await DB.set("weekLogs", uid(), { weekStart: el.dataset.week, text, createdAt: Date.now() });
      toast("기록했습니다."); render(); break;
    }
    case "wl-del": {
      confirmModal("이 기록을 삭제할까요?", "되돌릴 수 없습니다.", async () => {
        await DB.del("weekLogs", id); render();
      });
      break;
    }
    case "wl-goto-week": state.wlWeekStart = el.dataset.week; render(); break;
    case "wl-goto-today": state.wlWeekStart = null; render(); break;
    case "issue-add": {
      openModal(`<div class="modal" style="max-width:480px">
        <div class="modal-head"><h3>이슈 추가</h3><button class="icon-btn" data-act="close">✕</button></div>
        <div class="modal-body">
          <div class="mrow"><label>제목</label><div class="ctl"><input type="text" id="issTitle" placeholder="이슈 제목" /></div></div>
          <div class="mrow" style="align-items:flex-start"><label style="padding-top:11px">내용</label><div class="ctl">
            <textarea id="issNote" rows="4" placeholder="원인, 막힌 부분, 해결책 등 (줄바꿈 가능)" style="resize:vertical"></textarea>
          </div></div>
          <div class="mrow"><label>시작일</label><div class="ctl"><input type="date" id="issFrom" value="${todayStr()}" /></div></div>
          <div class="mrow"><label>종료 목표일</label><div class="ctl"><input type="date" id="issTo" /></div></div>
        </div>
        <div class="modal-foot">
          <button class="btn-cancel" data-act="close">취소</button>
          <button class="btn-ghost" id="issSaveKeep" style="margin-right:auto">저장 (계속 쓰기)</button>
          <button class="btn-save" id="issSave">추가</button>
        </div>
      </div>`);
      let issNewId = null;
      const issDoSave = async (closeAfter) => {
        const title = $("#issTitle").value.trim();
        if (!title) { $("#issTitle").focus(); return null; }
        const data = { title, note: $("#issNote").value, from: $("#issFrom").value, to: $("#issTo").value };
        if (issNewId) {
          const cur = DB.get("issues", issNewId);
          await DB.set("issues", issNewId, { ...cur, ...data });
        } else {
          issNewId = uid();
          await DB.set("issues", issNewId, { ...data, resolved: false, order: DB.all("issues").length, createdAt: Date.now() });
        }
        toast(closeAfter ? "이슈를 추가했습니다." : "저장했습니다. 계속 작성하세요.");
        if (closeAfter) { closeModal(); render(); }
        return issNewId;
      };
      $("#issSave").onclick = () => issDoSave(true);
      $("#issSaveKeep").onclick = () => issDoSave(false);
      break;
    }
    case "iss-edit": {
      const iss = DB.get("issues", id);
      if (!iss) break;
      openModal(`<div class="modal" style="max-width:480px">
        <div class="modal-head"><h3>이슈 수정</h3><button class="icon-btn" data-act="close">✕</button></div>
        <div class="modal-body">
          <div class="mrow"><label>제목</label><div class="ctl"><input type="text" id="issTitle" value="${esc(iss.title||"")}" /></div></div>
          <div class="mrow" style="align-items:flex-start"><label style="padding-top:11px">내용</label><div class="ctl">
            <textarea id="issNote" rows="4" style="resize:vertical">${esc(iss.note||"")}</textarea>
          </div></div>
          <div class="mrow"><label>시작일</label><div class="ctl"><input type="date" id="issFrom" value="${iss.from||""}" /></div></div>
          <div class="mrow"><label>종료 목표일</label><div class="ctl"><input type="date" id="issTo" value="${iss.to||""}" /></div></div>
        </div>
        <div class="modal-foot">
          <button class="btn-cancel" data-act="close">취소</button>
          <button class="btn-ghost" id="issSaveKeep" style="margin-right:auto">저장 (계속 쓰기)</button>
          <button class="btn-save" id="issSave">저장</button>
        </div>
      </div>`);
      const issEditSave = async (closeAfter) => {
        const cur = DB.get("issues", id) || iss;
        await DB.set("issues", id, { ...cur, title: $("#issTitle").value.trim(), note: $("#issNote").value, from: $("#issFrom").value, to: $("#issTo").value });
        toast(closeAfter ? "수정했습니다." : "저장했습니다. 계속 작성하세요.");
        if (closeAfter) { closeModal(); render(); }
      };
      $("#issSave").onclick = () => issEditSave(true);
      $("#issSaveKeep").onclick = () => issEditSave(false);
      break;
    }
    case "iss-resolve": {
      const iss = DB.get("issues", id);
      if (!iss) break;
      await DB.set("issues", id, { ...iss, resolved: !iss.resolved });
      toast(iss.resolved ? "미해결로 변경했습니다." : "해결됨으로 표시했습니다."); render();
      break;
    }
    case "iss-del": {
      confirmModal("이 이슈를 삭제할까요?", "", async () => {
        await DB.del("issues", id); toast("삭제했습니다."); render();
      });
      break;
    }
    case "todo-day-filter": {
      const d = el.dataset.date;
      state.todoDayFilter = state.todoDayFilter === d ? "" : d;
      render(); break;
    }
    case "todo-day-filter-clear": state.todoDayFilter = ""; render(); break;
    case "todo-date-clear": state.todoFrom = ""; state.todoTo = ""; render(); break;
    case "todo-week-prev": {
      const t0 = todayStr(); const base = state.todoWeekStart || fmt(addDays(parseD(t0), -parseD(t0).getDay()));
      state.todoWeekStart = fmt(addDays(parseD(base), -7)); render(); break;
    }
    case "todo-week-next": {
      const t0 = todayStr(); const base = state.todoWeekStart || fmt(addDays(parseD(t0), -parseD(t0).getDay()));
      state.todoWeekStart = fmt(addDays(parseD(base), 7)); render(); break;
    }
    case "todo-week-today": state.todoWeekStart = null; render(); break;
    case "issue-week-prev": {
      const base = state.issueWeekStart || fmt(weekStartOf(parseD(todayStr())));
      state.issueWeekStart = fmt(addDays(parseD(base), -7));
      render(); break;
    }
    case "issue-week-next": {
      const base = state.issueWeekStart || fmt(weekStartOf(parseD(todayStr())));
      const next = fmt(addDays(parseD(base), 7));
      const thisWeek = fmt(weekStartOf(parseD(todayStr())));
      if (next <= thisWeek) { state.issueWeekStart = next; render(); }
      break;
    }
    case "issue-week-today": state.issueWeekStart = null; render(); break;
    case "td-hist-edit": {
      const td2 = DB.get("todos", state.selTodo);
      const hh = (td2?.history || []).find(h => h.id === el.dataset.hid);
      if (!hh) break;
      openModal(`<div class="modal" style="max-width:460px">
        <div class="modal-head"><h3>히스토리 수정</h3><button class="icon-btn" data-act="close">✕</button></div>
        <div class="modal-body"><div class="ctl"><textarea id="heText" rows="5" style="resize:vertical">${esc(hh.text)}</textarea></div></div>
        <div class="modal-foot">
          <button class="btn-cancel" data-act="close">취소</button>
          <button class="btn-ghost" id="heSaveKeep" style="margin-right:auto">저장 (계속 쓰기)</button>
          <button class="btn-save" id="heSave">저장</button>
        </div>
      </div>`);
      const heDoSave = async (closeAfter) => {
        const td3 = DB.get("todos", state.selTodo);
        const history = (td3.history || []).map(h => h.id === hh.id ? { ...h, text: $("#heText").value } : h);
        await DB.set("todos", state.selTodo, { ...td3, history });
        if (closeAfter) { closeModal(); renderDetail(); }
        else toast("저장했습니다. 계속 작성하세요.");
      };
      $("#heSave").onclick = () => heDoSave(true);
      $("#heSaveKeep").onclick = () => heDoSave(false);
      break;
    }
    /* ---- 할 일 상세: 대분류/하위 항목/히스토리/항목관리 ---- */
    case "td-grp-add": {
      const t = DB.get("todos", state.selTodo);
      const subtasks = [...(t.subtasks || []), { id: uid(), title: "새 대분류", items: [], order: (t.subtasks || []).length }];
      await patchTodo(state.selTodo, { subtasks }); renderDetail(); break;
    }
    case "td-grp-del": {
      const gid = el.dataset.gid, t = DB.get("todos", state.selTodo);
      await patchTodo(state.selTodo, { subtasks: (t.subtasks || []).filter(g => g.id !== gid) });
      renderDetail(); break;
    }
    case "td-item-add": {
      const gid = el.dataset.gid, t = DB.get("todos", state.selTodo);
      const subtasks = (t.subtasks || []).map(g => g.id !== gid ? g :
        { ...g, items: [...(g.items || []), { id: uid(), text: "", done: false, order: (g.items || []).length }] });
      await patchTodo(state.selTodo, { subtasks });
      renderDetail();
      setTimeout(() => { const inps = $$('[data-act="td-item-edit"]'); inps[inps.length - 1]?.focus(); }, 40);
      break;
    }
    case "td-item-toggle": {
      const gid = el.dataset.gid, iid = el.dataset.iid, t = DB.get("todos", state.selTodo);
      const subtasks = (t.subtasks || []).map(g => g.id !== gid ? g :
        { ...g, items: g.items.map(it => {
          if (it.id !== iid) return it;
          if (!it.done && !it.failed) return { ...it, done: true, failed: false };
          if (it.done) return { ...it, done: false, failed: true };
          return { ...it, done: false, failed: false };
        }) });
      await patchTodo(state.selTodo, { subtasks }); renderDetail(); break;
    }
    case "td-item-del": {
      const gid = el.dataset.gid, iid = el.dataset.iid, t = DB.get("todos", state.selTodo);
      const subtasks = (t.subtasks || []).map(g => g.id !== gid ? g : { ...g, items: g.items.filter(it => it.id !== iid) });
      await patchTodo(state.selTodo, { subtasks }); renderDetail(); break;
    }
    case "td-hist-del": {
      await todoDelHistory(state.selTodo, el.dataset.hid); renderDetail(); break;
    }
    case "td-cat-manage": catManageModal(); break;
    case "td-detail-menu": {
      const t = DB.get("todos", id); const r = el.getBoundingClientRect();
      showCtx(r.left - 150, r.bottom + 6, [
        { k: "d", icon: "📋", label: "복제", run: async () => {
            const nid = uid();
            await DB.set("todos", nid, { ...t, id: nid, title: t.title + " 복사본", done: false,
              subtasks: (t.subtasks || []).map(g => ({ ...g, id: uid(), items: (g.items || []).map(it => ({ ...it, id: uid() })) })),
              history: [], createdAt: Date.now() });
            state.selTodo = nid; render(); toast("복제했습니다."); } },
        "-",
        { k: "x", icon: "🗑️", label: "삭제", danger: true, run: () =>
            confirmModal("할 일을 삭제할까요?", `"${t.title}"이(가) 사라집니다.`, async () => {
              await DB.del("todos", id); await DB.log("delete", `할 일 "${t.title}" 삭제`);
              if (state.selTodo === id) state.selTodo = null; render(); }) }
      ]);
      break;
    }
    case "todo-menu": {
      const t = DB.get("todos", id); const r = el.getBoundingClientRect();
      showCtx(r.left - 140, r.bottom + 6, [
        { k: "e", icon: "✏️", label: "수정", run: () => todoModal(t) },
        { k: "d", icon: "📋", label: "복제", run: async () => {
            const nid = uid(); await DB.set("todos", nid, { ...t, id: nid, title: t.title + " 복사본", done: false, createdAt: Date.now() }); toast("복제했습니다."); } },
        "-",
        { k: "x", icon: "🗑️", label: "삭제", danger: true, run: () =>
            confirmModal("할 일을 삭제할까요?", `"${t.title}"이(가) 사라집니다.`, async () => {
              await DB.del("todos", id); await DB.log("delete", `할 일 "${t.title}" 삭제`); }) }
      ]);
      break;
    }
    case "journal-menu": {
      const j = DB.get("journal", id); const r = el.getBoundingClientRect();
      showCtx(r.left - 140, r.bottom + 6, [
        { k: "e", icon: "✏️", label: "수정", run: () => journalModal(j) },
        { k: "x", icon: "🗑️", label: "삭제", danger: true, run: () =>
            confirmModal("회고를 삭제할까요?", `${j.date} 기록이 사라집니다.`, async () => {
              await DB.del("journal", id); await DB.log("delete", `${j.date} 회고 삭제`); }) }
      ]);
      break;
    }
    case "signout": confirmModal("로그아웃할까요?", "다시 로그인하면 기록은 그대로 남아 있습니다.", signOut, "로그아웃"); break;
    case "theme": toggleTheme(); render(); break;
    case "notify": {
      if (!("Notification" in window)) return toast("이 브라우저는 알림을 지원하지 않습니다.");
      const p = await Notification.requestPermission();
      toast(p === "granted" ? "알림을 켰습니다." : "알림 권한이 거부되었습니다.");
      break;
    }
    case "export": {
      const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), data: DB.data }, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = `selfboard-${todayStr()}.json`; a.click();
      toast("파일을 저장했습니다."); break;
    }
    case "export-csv": { exportCSV(); break; }
    case "import": {
      const inp = document.createElement("input"); inp.type = "file"; inp.accept = "application/json";
      inp.onchange = async () => {
        const f = inp.files[0]; if (!f) return;
        try {
          const p = JSON.parse(await f.text());
          const src = p.data || p;
          for (const col of COLS) for (const [k, v] of Object.entries(src[col] || {})) await DB.set(col, k, v);
          toast("가져오기를 마쳤습니다.");
        } catch { toast("파일을 읽을 수 없습니다. JSON 형식을 확인하세요."); }
      };
      inp.click(); break;
    }
    case "wipe": confirmModal("모든 기록을 지울까요?", "습관, 체크인, 할 일, 회고, 히스토리가 전부 삭제됩니다. 되돌릴 수 없습니다.", async () => {
        for (const col of COLS) {
          const items = DB.all(col);
          for (const item of items) await DB.del(col, item.id);
        }
        state.selected = null; toast("전체 삭제했습니다."); render();
      }); break;
    case "close": closeModal(); break;
  }
});

/* 상단 버튼 */
$("#btnAdd").onclick = () => {
  if (state.tab === "todo") todoModal();
  else if (state.tab === "journal") journalModal();
  else if (state.tab === "workout") workoutModal();
  else if (state.tab === "study") studyModal();
  else if (state.tab === "song") songModal();
  else if (state.tab === "goal") goalModal();
  else if (state.tab === "dday") ddayModal();
  else if (state.tab === "calendar") ddayModal();
  else if (state.tab === "budget") { state.budgetSub = "expense"; render(); }
  else if (state.tab === "dashboard") habitModal();
  else habitModal();
};
$("#btnMore").onclick = (e) => {
  const r = e.currentTarget.getBoundingClientRect();
  showCtx(r.left - 150, r.bottom + 6, [
    { k: "a", icon: "➕", label: "습관 만들기", run: () => habitModal() },
    { k: "b", icon: "🗂️", label: "할 일 추가", run: () => todoModal() },
    { k: "c", icon: "📓", label: "회고 쓰기", run: () => journalModal() },
    "-",
    { k: "d", icon: "📤", label: "데이터 내보내기", run: () => $("[data-act='export']")?.click() || exportNow() },
    { k: "e", icon: "🌓", label: "테마 전환", run: () => { toggleTheme(); render(); } }
  ]);
};
function exportNow() {
  const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), data: DB.data }, null, 2)], { type: "application/json" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `selfboard-${todayStr()}.json`; a.click();
}
function csvCell(v) { const s = String(v ?? ""); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
function downloadText(name, text, mime) {
  const blob = new Blob(["\uFEFF" + text], { type: mime }); // BOM으로 엑셀 한글 깨짐 방지
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; a.click();
}
function exportCSV() {
  const parts = [];
  // 운동
  parts.push("[운동]");
  parts.push(["날짜", "부위/종류", "시간", "종목", "세트(kg×회)", "볼륨kg", "메모"].map(csvCell).join(","));
  workoutRows().forEach(w => (w.exercises || []).forEach(e => {
    const sets = (e.sets || []).map(s => `${s.kg || 0}x${s.reps || 0}`).join(" ");
    const vol = (e.sets || []).reduce((a, s) => a + (Number(s.kg) || 0) * (Number(s.reps) || 0), 0);
    parts.push([w.date, w.type, w.duration, e.name, sets, vol, w.memo].map(csvCell).join(","));
  }));
  // 몸무게
  parts.push(""); parts.push("[몸무게]");
  parts.push(["날짜", "kg"].join(","));
  weightRows().forEach(w => parts.push([w.date, w.kg].map(csvCell).join(",")));
  // 공부
  parts.push(""); parts.push("[공부]");
  parts.push(["과목", "날짜", "내용", "분"].map(csvCell).join(","));
  DB.all("study").forEach(s => (s.logs || []).forEach(l => parts.push([s.name, l.date, l.text, l.minutes].map(csvCell).join(","))));

  downloadText(`selfboard-${todayStr()}.csv`, parts.join("\n"), "text/csv;charset=utf-8");
  toast("CSV를 저장했습니다.");
}
$("#btnSort").onclick = (e) => {
  const r = e.currentTarget.getBoundingClientRect();
  const mk = (k, label) => ({ k, icon: state.sort === k ? "●" : "○", label, run: () => { state.sort = k; render(); } });
  showCtx(r.left - 130, r.bottom + 6, [
    mk("date", "날짜순 (기본)"), mk("name", "이름순"), mk("streak", "연속 기록순"), mk("manual", "직접 정렬")
  ]);
};
$("#btnTheme").onclick = () => { toggleTheme(); if (state.tab === "settings") render(); };
function toggleTheme() {
  document.body.classList.toggle("dark");
  localStorage.setItem("selfboard_theme", document.body.classList.contains("dark") ? "dark" : "light");
}
$("#avatarBtn").onclick = () => { state.tab = "settings"; render(); };
let qTimer;
$("#searchInput").oninput = (e) => {
  clearTimeout(qTimer);
  qTimer = setTimeout(() => { state.query = e.target.value.trim(); render(); }, 180);
};

/* ============================================================
   9. 드래그 정렬
============================================================ */
let dragId = null, dragType = null;
$("#pageBody").addEventListener("dragstart", e => {
  const card = e.target.closest(".card, .trow"); if (!card) return;
  dragId = card.dataset.id || card.dataset.todo;
  dragType = card.classList.contains("card") ? "habits" : "todos";
  card.classList.add("dragging");
  e.dataTransfer.effectAllowed = "move";
});
$("#pageBody").addEventListener("dragend", e => {
  e.target.closest(".card, .trow")?.classList.remove("dragging");
  $$(".drop-target").forEach(x => x.classList.remove("drop-target"));
  dragId = null;
});
$("#pageBody").addEventListener("dragover", e => {
  if (!dragId) return;
  e.preventDefault();
  const over = e.target.closest(".card, .trow"); if (!over) return;
  $$(".drop-target").forEach(x => x.classList.remove("drop-target"));
  over.classList.add("drop-target");
});
$("#pageBody").addEventListener("drop", async e => {
  if (!dragId) return;
  e.preventDefault();
  const over = e.target.closest(".card, .trow"); if (!over) return;
  const targetId = over.dataset.id || over.dataset.todo;
  if (targetId === dragId) return;

  const col = dragType;
  const list = (col === "habits" ? visibleHabits(state.tab === "archive") : DB.all("todos"))
    .slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const from = list.findIndex(x => x.id === dragId);
  const to = list.findIndex(x => x.id === targetId);
  if (from < 0 || to < 0) return;
  const [moved] = list.splice(from, 1);
  list.splice(to, 0, moved);
  for (let i = 0; i < list.length; i++) await DB.set(col, list[i].id, { ...list[i], order: i });
  state.sort = "manual";
  toast("순서를 저장했습니다. (직접 정렬)");
});

/* ============================================================
   10. 알림 스케줄러 — 1분마다 reminder 시각 확인
============================================================ */
setInterval(() => {
  if (!DB.user || Notification?.permission !== "granted") return;
  const now = new Date();
  const hm = String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");
  const t = todayStr();
  const fired = JSON.parse(sessionStorage.getItem("sb_fired") || "[]");
  DB.all("habits").forEach(h => {
    if (h.archived || !h.reminder || h.reminder !== hm) return;
    if (!isActiveOn(h, t) || isChecked(h.id, t)) return;
    const key = h.id + "_" + t + "_" + hm;
    if (fired.includes(key)) return;
    new Notification(`${h.emoji} ${h.name}`, { body: "오늘 아직 체크하지 않았습니다." });
    fired.push(key); sessionStorage.setItem("sb_fired", JSON.stringify(fired));
  });
}, 60000);

/* 자정 넘어가면 화면 갱신 */
let lastDay = todayStr();
setInterval(() => { if (todayStr() !== lastDay) { lastDay = todayStr(); state.anchor = today(); render(); } }, 30000);
</script>
</body>
</html>
