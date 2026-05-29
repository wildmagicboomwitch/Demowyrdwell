// ⚠️  DEAD-02: This file is no longer loaded by any HTML page.
// day-builder.html redirects to day-view.html#plan.
// This standalone module was superseded by pages/day-view.js (Phase C3).
// Safe to delete. Keeping only to preserve git history of the logic.
//
// DAY BUILDER — AuDHD HQ  v4: spanning cards + overlap layout + workday presets
// Store: audhd-hq-daybuilder-v2  |  Reads: audhd-hq-weekly

(function cleanLegacyKeys(){['db_presets_v2','db_days_v2','db_devlog','db2-theme'].forEach(k=>{try{HQSafe.store.remove(k);}catch(e){}});})();

const STORE=HQKeys.DAYBUILDER_V2;
const WEEKLY_STORE=HQKeys.WEEKLY;
let DB={days:{},routineTasks:[],customTasks:[]};
let currentDate='';
let selectedPreset=null,devTargetSlot=null,dragPresetData=null,catFilter='all';
let _editPlacedKey=null,_editPlacedId=null,_placePreset=null;

const HOUR_HEIGHT=64; // px per hour — must match CSS .sched-hour-line height
const GRID_START_HOUR=5;
const GRID_START_MIN=GRID_START_HOUR*60;

const DEF=[
  {id:'p-walk',em:'👟',name:'Walk',dur:60,cat:'health'},
  {id:'p-kids',em:'📞',name:'Kids Call',dur:30,cat:'social'},
  {id:'p-laundry',em:'🧺',name:'Laundry Run',dur:90,cat:'home'},
  {id:'p-grocery',em:'🛒',name:'Grocery Run',dur:60,cat:'adulting'},
  {id:'p-chore',em:'🧹',name:'Chore Block',dur:30,cat:'home'},
  {id:'p-mealprep',em:'🍳',name:'Meal Prep',dur:60,cat:'health'},
  {id:'p-finance',em:'💰',name:'Finance Check',dur:15,cat:'finance'},
  {id:'p-braindump',em:'💭',name:'Thought Jar',dur:10,cat:'self'},
  {id:'p-transit',em:'🚌',name:'Transit',dur:30,cat:'transit'},
  {id:'p-appt',em:'📅',name:'Appointment',dur:60,cat:'health'},
  {id:'p-dispensary',em:'🌿',name:'Dispensary',dur:30,cat:'adulting'},
  {id:'p-shopping',em:'🛍️',name:'Shopping',dur:60,cat:'adulting'},
  {id:'p-social',em:'💬',name:'Social Time',dur:60,cat:'social'},
  {id:'p-paperwork',em:'📋',name:'Paperwork',dur:45,cat:'adulting'},
  {id:'p-reading',em:'📚',name:'Reading',dur:30,cat:'self'},
];
const CATS={
  work:{em:'💼',col:'var(--purple)',cls:'task-work'},
  home:{em:'🏠',col:'var(--green)',cls:'task-home'},
  self:{em:'🧠',col:'var(--teal)',cls:'task-self'},
  social:{em:'💬',col:'var(--teal)',cls:'task-social'},
  health:{em:'🏥',col:'var(--pink)',cls:'task-health'},
  finance:{em:'💰',col:'var(--gold)',cls:'task-finance'},
  transit:{em:'🚌',col:'var(--coral)',cls:'task-transit'},
  adulting:{em:'📋',col:'var(--muted)',cls:'task-adulting'},
};
const HOURS=Array.from({length:20},(_,i)=>i+5);
const DOW=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function localDateStr(d){const _d=d||new Date();return _d.getFullYear()+'-'+String(_d.getMonth()+1).padStart(2,'0')+'-'+String(_d.getDate()).padStart(2,'0');}
const todayStr = () => (window.HQDate ? HQDate.today() : (() => { const d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); })()); // aliased → HQDate.today
function makeTimeKey(h,m){return String(h).padStart(2,'0')+':'+String(m||0).padStart(2,'0');}
function timeKeyToMins(k){if(typeof k==='number')return k*60;const p=String(k).split(':');return parseInt(p[0])*60+parseInt(p[1]||0);}
function fmtTimeKey(k){if(!k&&k!==0)return'';const m=timeKeyToMins(k),h=Math.floor(m/60),min=m%60,ap=h<12?'am':'pm',h12=h%12||12;return h12+(min?':'+String(min).padStart(2,'0'):'')+ap;}

function load(){
  DB = Object.assign(DB, HQSafe.store.get(STORE, DB));
  if(!DB.days)DB.days={};if(!DB.routineTasks)DB.routineTasks=[];if(!DB.customTasks)DB.customTasks=[];
  migrateIntegerSlots();
}
function persist(){try{HQSafe.store.set(STORE, DB);}catch(e){}}
const uid = () => HQUtils.uid(); // → HQUtils.uid
function getDD(d){if(!DB.days[d])DB.days[d]={slots:{},deviations:[]};return DB.days[d];}
function migrateIntegerSlots(){
  Object.values(DB.days).forEach(dd=>{
    if(!dd.slots)return;
    Object.keys(dd.slots).forEach(k=>{
      if(/^\d+$/.test(k)){const tk=makeTimeKey(parseInt(k),0);if(!dd.slots[tk])dd.slots[tk]=[];(dd.slots[k]||[]).forEach(t=>{if(!dd.slots[tk].find(x=>x.id===t.id))dd.slots[tk].push(t);});delete dd.slots[k];}
    });
  });
}

function initDate(){currentDate=todayStr();renderAll();}
function goToday(){currentDate=todayStr();renderAll();}
function moveDay(dir){const d=new Date(currentDate+'T12:00:00');d.setDate(d.getDate()+dir);currentDate=localDateStr(d);renderAll();}
function renderAll(){
  const d=new Date(currentDate+'T12:00:00');const isToday=currentDate===todayStr();
  const hdrLbl=document.getElementById('hdr-date-lbl');
  const hdrSub=document.getElementById('hdr-sub');
  if(hdrLbl)hdrLbl.textContent=(isToday?'Today — ':'')+DOW[d.getDay()]+', '+MON[d.getMonth()]+' '+d.getDate();
  if(hdrSub)hdrSub.textContent=d.getFullYear();
  document.getElementById('sched-title').textContent='🗓 '+(isToday?'Today':DOW[d.getDay()]+' '+MON[d.getMonth()]+' '+d.getDate());
  renderSidebar();renderGrid();renderDevLog();updateStats();renderWeekPull();
  setTimeout(scrollToNow,60);
}
function toggleSide(id){document.getElementById(id).classList.toggle('open');}

function renderSidebar(){
  const myR=DB.routineTasks;
  document.getElementById('my-routine-presets').innerHTML=myR.map(t=>rPreset(t,'routine')).join('');
  document.getElementById('my-routine-empty').style.display=myR.length?'none':'block';
  document.getElementById('cat-filters').innerHTML=['all',...Object.keys(CATS)].map(c=>`<button class="cf-btn${c===catFilter?' on':''}" onclick="setCatF('${c}')">${c==='all'?'All':CATS[c].em}</button>`).join('');
  const all=[...DEF,...(Array.isArray(DB.customTasks)?DB.customTasks:[])];
  const filtered=catFilter==='all'?all:all.filter(t=>t.cat===catFilter);
  document.getElementById('task-presets').innerHTML=filtered.map(t=>rPreset(t,'task',true)).join('');
  const ind=document.getElementById('sel-indicator');
  if(selectedPreset){ind.classList.add('show');document.getElementById('sel-indicator-text').textContent=selectedPreset.em+' '+selectedPreset.name+' — click any time to place';}
  else ind.classList.remove('show');
}
function setCatF(c){catFilter=c;renderSidebar();}
function clearSelection(){selectedPreset=null;renderSidebar();}
function rPreset(t,src){
  const cat=CATS[t.cat]||CATS.work;const isSel=selectedPreset&&selectedPreset.id===t.id;
  const isDel=src==='routine'||(src==='task'&&!DEF.find(p=>p.id===t.id));
  return`<div class="preset${isSel?' selected':''}" draggable="true" ondragstart="dragP(event,'${t.id}','${src}')" onclick="selP('${t.id}','${src}')">
    <div class="cat-dot" style="background:${cat.col}"></div><div class="preset-em">${t.em}</div>
    <div class="preset-info"><div class="preset-name">${esc(t.name)}</div><div class="preset-dur">${t.dur?t.dur+' min':''}</div></div>
    ${isDel?`<button class="preset-rm" onclick="event.stopPropagation();rmPreset('${t.id}','${src}')">✕</button>`:''}
  </div>`;
}
function selP(id,src){const t=findP(id,src);if(!t)return;selectedPreset=(selectedPreset&&selectedPreset.id===id)?null:{...t,src};if(selectedPreset)hqShowToast(`${t.em} ${t.name} selected — click any time to place`);renderSidebar();}
function findP(id,src){
  if(src==='routine')return DB.routineTasks.find(t=>t.id===id);
  return[...DEF,...(Array.isArray(DB.customTasks)?DB.customTasks:[])].find(t=>t.id===id);
}
function dragP(ev,id,src){dragPresetData={id,src};selectedPreset=findP(id,src);ev.dataTransfer.effectAllowed='copy';}

// ── OVERLAP COLUMN LAYOUT ─────────────────────────────────────────────────────
function assignColumns(items){
  if(!items.length)return[];
  const n=items.length;
  const parent=Array.from({length:n},(_,i)=>i);
  function find(i){if(parent[i]!==i)parent[i]=find(parent[i]);return parent[i];}
  function union(i,j){parent[find(i)]=find(j);}
  for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)if(items[i].startMin<items[j].endMin&&items[j].startMin<items[i].endMin)union(i,j);
  const groups={};
  for(let i=0;i<n;i++){const r=find(i);if(!groups[r])groups[r]=[];groups[r].push(i);}
  const colIdx=new Array(n).fill(0),numCols=new Array(n).fill(1);
  Object.values(groups).forEach(grp=>{
    grp.sort((a,b)=>items[a].startMin-items[b].startMin);
    const colEnd=[];
    grp.forEach(idx=>{
      const item=items[idx];let col=colEnd.findIndex(e=>e<=item.startMin+1);
      if(col===-1){col=colEnd.length;colEnd.push(item.endMin);}else colEnd[col]=item.endMin;
      colIdx[idx]=col;
    });
    const total=colEnd.length;grp.forEach(idx=>numCols[idx]=total);
  });
  return items.map((item,i)=>({...item,colIndex:colIdx[i],numCols:numCols[i]}));
}

// ── GRID CANVAS ───────────────────────────────────────────────────────────────
function renderGrid(){
  const dd=getDD(currentDate);const now=new Date();const isToday=currentDate===todayStr();
  const totalH=HOURS.length*HOUR_HEIGHT;
  const allItems=[];
  Object.entries(dd.slots||{}).forEach(([tk,arr])=>{
    const startMin=timeKeyToMins(tk);
    (arr||[]).forEach(t=>allItems.push({t,tk,startMin,endMin:startMin+(t.dur||30)}));
  });
  allItems.sort((a,b)=>a.startMin-b.startMin);
  const withCols=assignColumns(allItems);
  const nowMin=now.getHours()*60+now.getMinutes();
  const nowTop=((nowMin-GRID_START_MIN)/60)*HOUR_HEIGHT;
  const showNow=isToday&&nowTop>=0&&nowTop<=totalH;
  let html=`<div id="sched-canvas" class="sched-canvas" style="height:${totalH}px"
    onclick="clickCanvas(event)"
    ondragover="canvasDragOver(event)"
    ondragleave="canvasDragLeave(event)"
    ondrop="dropCanvas(event)">`;
  HOURS.forEach((h,i)=>{
    const top=i*HOUR_HEIGHT,halfTop=top+HOUR_HEIGHT/2;
    const lbl=h===0?'12a':h<12?h+'a':h===12?'12p':(h-12)+'p';
    const isCur=isToday&&now.getHours()===h;
    html+=`<div class="sched-hour-line${isCur?' cur-hour':''}" style="top:${top}px">
      <div class="sched-hour-lbl">${lbl}<div class="ts-sublabel">:00</div></div>
    </div>
    <div class="sched-half-line" style="top:${halfTop}px"><div class="sched-half-lbl">:30</div></div>`;
  });
  if(showNow)html+=`<div class="now-line-abs" style="top:${nowTop.toFixed(1)}px"></div>`;
  html+=`<div id="drag-snap-line" class="drag-snap-line"></div>`;
  if(withCols.length){
    withCols.forEach(({t,tk,startMin,numCols,colIndex})=>{
      const relStart=startMin-GRID_START_MIN;
      const top=Math.max(0,(relStart/60)*HOUR_HEIGHT);
      const rawH=((t.dur||30)/60)*HOUR_HEIGHT;
      html+=rPlacedAbs(t,tk,top,Math.max(rawH,28),numCols,colIndex);
    });
  }else{
    html+=`<div class="sched-empty">No tasks scheduled yet.<br>Select a preset from the sidebar then click any time — or drag directly.</div>`;
  }
  html+='</div>';
  document.getElementById('schedule-grid').innerHTML=html;
}

function rPlacedAbs(t,tk,top,height,numCols,colIndex){
  const cat=CATS[t.cat]||CATS.work;
  const cls=t.locked?'task-locked':(cat.cls||'task-work');
  const action=t.locked?`openDev('${tk}','${t.id}')`:`openEditPlaced('${tk}','${t.id}')`;
  const dur=t.dur||30;
  const endMin=timeKeyToMins(tk)+dur;
  const endTk=makeTimeKey(Math.floor(endMin/60),endMin%60);
  const LPAD=51,GAP=3;
  const leftStyle=numCols===1?`calc(${LPAD}px)`:`calc(${LPAD}px + ${colIndex} * ((100% - ${LPAD}px) / ${numCols}))`;
  const widthStyle=numCols===1?`calc(100% - ${LPAD+GAP}px)`:`calc((100% - ${LPAD}px) / ${numCols} - ${GAP}px)`;
  const veryShort=height<32,short=height<52;
  const showEnd=height>=78&&numCols<=2,showDur=height>=100&&numCols<=2;
  const durLabel=dur>=60?(Math.floor(dur/60)+'h'+(dur%60?dur%60+'m':'')):(dur+'m');
  let inner;
  if(veryShort){
    inner=`<div class="pa-row"><span class="pa-em" style="font-size:10px">${t.em}</span><span class="pa-name" style="font-size:9px">${esc(t.name)}</span><span class="placed-time" style="font-size:7px">${fmtTimeKey(tk)}</span></div>`;
  }else if(short){
    inner=`<div class="pa-row"><span class="pa-em">${t.em}</span><span class="pa-name">${esc(t.name)}</span><span class="placed-time">${fmtTimeKey(tk)}</span></div>`;
  }else{
    inner=`<div class="pa-row"><span class="pa-em">${t.em}</span><span class="pa-name">${esc(t.name)}</span><span class="placed-time">${fmtTimeKey(tk)}</span></div>
    ${showEnd?`<div class="pa-endtime">→ ${fmtTimeKey(endTk)}</div>`:''}
    ${showDur?`<div class="pa-dur">${durLabel}</div>`:''}`;
  }
  return`<div class="placed-abs ${cls}" style="top:${top.toFixed(1)}px;height:${(height-2).toFixed(1)}px;left:${leftStyle};width:${widthStyle}" onclick="event.stopPropagation();${action}">${inner}</div>`;
}

// ── CANVAS INTERACTION ────────────────────────────────────────────────────────
function clickCanvas(event){
  if(event.target.closest('.placed-abs'))return;
  const canvas=document.getElementById('sched-canvas');if(!canvas)return;
  const rect=canvas.getBoundingClientRect();const y=event.clientY-rect.top;
  const totalMin=(y/HOUR_HEIGHT)*60+GRID_START_MIN;
  const snapped=Math.round(totalMin/15)*15;
  openPlaceModal(Math.floor(snapped/60),snapped%60,selectedPreset);
}
function canvasDragOver(ev){
  ev.preventDefault();if(!dragPresetData)return;
  const canvas=document.getElementById('sched-canvas');if(!canvas)return;
  const rect=canvas.getBoundingClientRect();const y=ev.clientY-rect.top;
  const totalMin=(y/HOUR_HEIGHT)*60+GRID_START_MIN;
  const snapped=Math.round(totalMin/15)*15;
  const snapTop=((snapped-GRID_START_MIN)/60)*HOUR_HEIGHT;
  const line=document.getElementById('drag-snap-line');
  if(line){line.style.top=Math.max(0,snapTop).toFixed(1)+'px';line.classList.add('vis');}
}
function canvasDragLeave(){const line=document.getElementById('drag-snap-line');if(line)line.classList.remove('vis');}
function dropCanvas(ev){
  ev.preventDefault();canvasDragLeave();if(!dragPresetData)return;
  const t=findP(dragPresetData.id,dragPresetData.src);if(!t){dragPresetData=null;return;}
  const canvas=document.getElementById('sched-canvas');
  const rect=canvas.getBoundingClientRect();const y=ev.clientY-rect.top;
  const totalMin=(y/HOUR_HEIGHT)*60+GRID_START_MIN;
  const snapped=Math.round(totalMin/5)*5;
  placeT(makeTimeKey(Math.floor(snapped/60),snapped%60),t);
  dragPresetData=null;selectedPreset=null;renderSidebar();
}

function scrollToNow(){
  const grid=document.getElementById('schedule-grid');if(!grid)return;
  const isToday=currentDate===todayStr();const now=new Date();
  const targetMin=isToday?(now.getHours()*60+now.getMinutes()):(8*60);
  grid.scrollTop=Math.max(0,((targetMin-GRID_START_MIN)/60)*HOUR_HEIGHT-80);
}

// ── PLACE / EDIT ──────────────────────────────────────────────────────────────
function placeT(tk,t){
  const dd=getDD(currentDate);if(!dd.slots)dd.slots={};if(!dd.slots[tk])dd.slots[tk]=[];
  if(dd.slots[tk].find(x=>x.id===t.id)){hqShowToast('⚠️ Already at this exact time');return;}
  const stored={id:t.id,em:t.em,name:t.name,dur:t.dur,cat:t.cat};
  if(t.locked)stored.locked=true;if(t.fromTemplate)stored.fromTemplate=t.fromTemplate;if(t.source)stored.source=t.source;
  dd.slots[tk].push(stored);persist();renderGrid();updateStats();hqShowToast(`🗓 ${t.em} ${t.name} → ${fmtTimeKey(tk)}`);
}
function rmPlaced(tk,id){
  const dd=getDD(currentDate);if(!dd.slots||!dd.slots[tk])return;
  dd.slots[tk]=dd.slots[tk].filter(t=>t.id!==id);
  if(!dd.slots[tk].length)delete dd.slots[tk];
  persist();renderGrid();updateStats();
}
function openPlaceModal(h,min,preset){
  _placePreset=preset;const tk=makeTimeKey(h,min);
  const dur=preset?(preset.dur||30):30;
  document.getElementById('pm-time').value=tk;
  document.getElementById('pm-dur').value=dur;
  _setEndTime('pm-time','pm-dur','pm-end');
  if(preset){
    document.getElementById('pm-title').textContent=`📌 Place: ${preset.em} ${preset.name}`;
    document.getElementById('pm-preset-banner').style.display='flex';
    document.getElementById('pm-preset-banner-label').textContent=`${preset.em} ${preset.name}${preset.dur?' · '+preset.dur+'m':''}`;
    document.getElementById('pm-custom-fields').style.display='none';
  }else{
    document.getElementById('pm-title').textContent='➕ Add to Schedule';
    document.getElementById('pm-preset-banner').style.display='none';
    document.getElementById('pm-custom-fields').style.display='block';
    document.getElementById('pm-name').value='';document.getElementById('pm-em').value='📌';document.getElementById('pm-cat').value='work';
  }
  openModal('place-modal');setTimeout(()=>document.getElementById('pm-time').focus(),100);
}
// Two-way sync helpers for Place modal
function pmSyncEnd(){_setEndTime('pm-time','pm-dur','pm-end');}
function pmSyncDur(){_setDurFromEnd('pm-time','pm-end','pm-dur');}
// Two-way sync helpers for Edit modal
function epSyncEnd(){_setEndTime('ep-time','ep-dur','ep-end');}
function epSyncDur(){_setDurFromEnd('ep-time','ep-end','ep-dur');}
// Shared: given start+dur → write end
function _setEndTime(startId,durId,endId){
  const s=document.getElementById(startId).value;
  const d=parseInt(document.getElementById(durId).value)||0;
  if(!s||!d)return;
  const endMin=timeKeyToMins(s)+d;
  document.getElementById(endId).value=makeTimeKey(Math.floor(endMin/60)%24,endMin%60);
}
// Shared: given start+end → write dur
function _setDurFromEnd(startId,endId,durId){
  const s=document.getElementById(startId).value;
  const e=document.getElementById(endId).value;
  if(!s||!e)return;
  let dur=timeKeyToMins(e)-timeKeyToMins(s);
  if(dur<=0)dur+=24*60; // handle crossing midnight
  document.getElementById(durId).value=dur;
}
function confirmPlace(){
  const timeVal=document.getElementById('pm-time').value;if(!timeVal){hqShowToast('⚠️ Pick a start time');return;}
  const tk=timeVal.slice(0,5),dur=parseInt(document.getElementById('pm-dur').value)||30;
  let task;
  if(_placePreset){task={..._placePreset,dur};}
  else{const name=document.getElementById('pm-name').value.trim();if(!name){hqShowToast('⚠️ Enter a task name');return;}task={id:uid(),name,em:document.getElementById('pm-em').value.trim()||'📌',cat:document.getElementById('pm-cat').value,dur};}
  placeT(tk,task);closeModal('place-modal');selectedPreset=null;renderSidebar();
}
function openEditPlaced(tk,id){
  _editPlacedKey=tk;_editPlacedId=id;
  const t=(getDD(currentDate).slots[tk]||[]).find(x=>x.id===id);if(!t)return;
  document.getElementById('ep-modal-title').textContent=`✏️ ${t.em} ${t.name}`;
  document.getElementById('ep-time').value=tk;document.getElementById('ep-dur').value=t.dur||30;
  document.getElementById('ep-name').value=t.name||'';document.getElementById('ep-em').value=t.em||'📌';document.getElementById('ep-cat').value=t.cat||'work';
  _setEndTime('ep-time','ep-dur','ep-end');
  openModal('edit-placed-modal');setTimeout(()=>document.getElementById('ep-time').focus(),100);
}
function saveEditPlaced(){
  const newTk=document.getElementById('ep-time').value.slice(0,5);if(!newTk){hqShowToast('⚠️ Set a time');return;}
  const dd=getDD(currentDate);const t=(dd.slots[_editPlacedKey]||[]).find(x=>x.id===_editPlacedId);
  if(!t){closeModal('edit-placed-modal');return;}
  dd.slots[_editPlacedKey]=(dd.slots[_editPlacedKey]||[]).filter(x=>x.id!==_editPlacedId);
  if(!dd.slots[_editPlacedKey].length)delete dd.slots[_editPlacedKey];
  const updated={...t,name:document.getElementById('ep-name').value.trim()||t.name,em:document.getElementById('ep-em').value.trim()||t.em,cat:document.getElementById('ep-cat').value,dur:parseInt(document.getElementById('ep-dur').value)||t.dur};
  if(!dd.slots[newTk])dd.slots[newTk]=[];dd.slots[newTk].push(updated);
  persist();renderGrid();updateStats();closeModal('edit-placed-modal');hqShowToast(`💾 Updated → ${fmtTimeKey(newTk)}`);
}
async function deleteEditPlaced(){if(!(await HQConfirm.ask('Remove this item?', {danger:true})))return;rmPlaced(_editPlacedKey,_editPlacedId);closeModal('edit-placed-modal');}

// ── DEVIATION MODAL (for any stored locked items from older data) ──────────────
function openDev(tk,id){
  devTargetSlot={tk,id};const t=(getDD(currentDate).slots||{})[tk]?.find(x=>x.id===id);
  document.getElementById('dev-modal-title').textContent=`⚠️ Removing: ${t?t.em+' '+t.name:'Item'}`;
  document.getElementById('dev-reason').value='';openModal('dev-modal');setTimeout(()=>document.getElementById('dev-reason').focus(),150);
}
function confirmDeviation(){
  const reason=document.getElementById('dev-reason').value.trim();
  if(!reason){document.getElementById('dev-reason').style.borderColor='var(--red)';setTimeout(()=>document.getElementById('dev-reason').style.borderColor='',2000);return;}
  const{tk,id}=devTargetSlot;const dd=getDD(currentDate);const t=(dd.slots||{})[tk]?.find(x=>x.id===id);
  if(dd.slots?.[tk]){dd.slots[tk]=dd.slots[tk].filter(x=>x.id!==id);if(!dd.slots[tk].length)delete dd.slots[tk];}
  if(!dd.deviations)dd.deviations=[];dd.deviations.push({item:t?t.name:'Unknown',tk,reason,at:new Date().toISOString()});
  persist();closeModal('dev-modal');renderGrid();renderDevLog();updateStats();hqShowToast('⚠️ Deviation logged');
}
function renderDevLog(){
  const dd=getDD(currentDate);const devs=dd.deviations||[];const panel=document.getElementById('dev-log-panel');
  if(!devs.length){panel.style.display='none';return;}
  panel.style.display='block';
  document.getElementById('dev-log-list').innerHTML=devs.map(d=>`<div class="dl-entry"><div>⚠️</div><div style="flex:1"><div>${esc(d.item)}</div><div class="dl-reason">"${esc(d.reason)}"</div></div><div class="dl-time">${fmtT(d.at)}</div></div>`).join('');
}

function updateStats(){
  const dd=getDD(currentDate);const allP=Object.values(dd.slots||{}).flat();
  const totalMin=allP.reduce((a,t)=>a+(t.dur||0),0);const hrs=Math.floor(totalMin/60),mins=totalMin%60;
  const pct=Math.min(100,Math.round(totalMin/(HOURS.length*60)*100));
  document.getElementById('st-placed').textContent=allP.length;
  document.getElementById('st-hrs').textContent=hrs+(mins?`h${mins}m`:'h');
  document.getElementById('st-free').textContent=Math.max(0,Math.floor((HOURS.length*60-totalMin)/60))+'h';
  document.getElementById('st-pct').textContent=pct+'%';
  document.getElementById('st-bar').style.width=pct+'%';
}

function renderWeekPull(){
  const strip=document.getElementById('week-pull-strip');
  try{
    const wd=HQSafe.store.get(WEEKLY_STORE,null);if(!wd||typeof wd!=='object'){strip.style.display='none';return;}let items=[];
    Object.values(wd).forEach(wk=>{
      if(wk&&wk.days&&wk.days[currentDate])items=items.concat((wk.days[currentDate]||[]).filter(it=>it.status!=='done'));
      if(wk&&wk.inbox)items=items.concat((wk.inbox||[]).filter(it=>it.dayTarget===currentDate&&it.status!=='done'));
    });
    const seen=new Set();items=items.filter(it=>{if(seen.has(it.id))return false;seen.add(it.id);return true;});
    if(!items.length){strip.style.display='none';return;}
    strip.style.display='block';
    strip.innerHTML=`<div class="week-pull-strip"><div class="wps-title">📥 From Weekly Planner — ${items.length} item${items.length>1?'s':''} today</div>${items.map(it=>`<div class="wps-item" onclick="placeFromWeekly('${it.id}','${esc(it.title||it.name||'')}','${it.category||it.cat||'work'}','${it.time||''}')"><span>${CATS[it.category||it.cat]?.em||'✅'}</span><span style="flex:1;font-weight:600">${esc(it.title||it.name||'')}</span>${it.time?`<span style="font-size:9px;color:var(--muted)">${it.time}</span>`:''}<span class="wps-badge">+ Place</span></div>`).join('')}</div>`;
  }catch(e){strip.style.display='none';}
}
function placeFromWeekly(id,name,cat,time){
  const now=new Date();const h=time?parseInt(time.split(':')[0]):now.getHours();const m=time?Math.round(parseInt((time.split(':')[1])||'0')/5)*5:0;
  openPlaceModal(h,m,{id:'wi-'+id,em:CATS[cat]?.em||'✅',name,dur:60,cat:cat in CATS?cat:'work'});
}

function quickAddTask(){
  const name=document.getElementById('quick-task-name').value.trim();if(!name){hqShowToast('⚠️ Enter a name');return;}
  const cat=document.getElementById('quick-task-cat').value,dur=parseInt(document.getElementById('quick-task-dur').value)||30;
  if(!Array.isArray(DB.customTasks))DB.customTasks=[];
  DB.customTasks.push({id:uid(),em:CATS[cat]?.em||'✅',name,dur,cat});persist();
  document.getElementById('quick-task-name').value='';document.getElementById('quick-task-dur').value='';
  renderSidebar();hqShowToast(`✅ "${name}" added`);
}
function saveCustomTask(){
  const name=document.getElementById('tm-name').value.trim();if(!name)return;
  const cat=document.getElementById('tm-cat').value,dur=parseInt(document.getElementById('tm-dur').value)||30;
  const em=document.getElementById('tm-em').value.trim()||CATS[cat]?.em||'✅';const isR=document.getElementById('tm-routine').checked;
  const t={id:uid(),em,name,dur,cat};
  if(isR)DB.routineTasks.push(t);else{if(!Array.isArray(DB.customTasks))DB.customTasks=[];DB.customTasks.push(t);}
  persist();closeModal('task-modal');renderSidebar();hqShowToast(`✅ "${name}" added${isR?' to My Routine':''}`);
}
function rmPreset(id,src){
  if(src==='routine')DB.routineTasks=DB.routineTasks.filter(t=>t.id!==id);
  else if(Array.isArray(DB.customTasks))DB.customTasks=DB.customTasks.filter(t=>t.id!==id);
  persist();renderSidebar();
}
async function clearCustomTasks(){
  if(!(await HQConfirm.ask('Remove all non-locked tasks from today?', {danger:true})))return;
  const dd=getDD(currentDate);
  Object.keys(dd.slots||{}).forEach(tk=>{dd.slots[tk]=(dd.slots[tk]||[]).filter(t=>t.locked);if(!dd.slots[tk].length)delete dd.slots[tk];});
  persist();renderGrid();updateStats();hqShowToast('↺ Custom tasks cleared');
}
async function clearAll(){if(!(await HQConfirm.ask('Clear ALL tasks from today?', {danger:true})))return;getDD(currentDate).slots={};persist();renderGrid();updateStats();hqShowToast('↺ Day cleared');}
function openModal(id){document.getElementById(id).classList.add('show');}
function closeModal(id){document.getElementById(id).classList.remove('show');}
const esc = s => HQUtils.esc(s); // → HQUtils.esc
function fmtT(s){return s?new Date(s).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'}):''}

load();initDate();
window.addEventListener('hq-core-ready',function(){renderAll();});

// Phase B: live-update week strip when weekly-planner saves
// Previously day-builder read audhd-hq-weekly once on load with no listener,
// causing stale week strip data whenever weekly-planner was open in another tab
// or had already saved earlier in the same session.
(function() {
  function _reloadWeekStrip() {
    // Re-render just the week strip without a full page reload
    if (typeof renderWeekStrip === 'function') {
      renderWeekStrip();
    } else if (typeof renderAll === 'function') {
      renderAll();
    }
  }

  // HQBus channel (same-tab, primary)
  function _wireHQBus() {
    HQSafe.bus.on('hq-weekly-updated', function(payload) { // FIX-09: guarded
        if (payload && payload._txId && window.HQCascade) {
          window.HQCascade.confirm(payload._txId, { ok: true });
        }
        _reloadWeekStrip();
      });
      HQSafe.bus.on('weekly-push-to-monthly', function() { // FIX-09: guarded
        // Weekly saved — week strip may have changed
        _reloadWeekStrip();
      });
  }

  // window storage event (cross-tab)
  window.addEventListener('storage', function(e) {
    if (e.key === HQKeys.WEEKLY) _reloadWeekStrip();
  });

  // C4: HQReady guarantees HQBus is loaded; call directly
  _wireHQBus();
})();

// ── DAY TEMPLATES ─────────────────────────────────────────────────────────────
var DAY_TEMPLATES=[
  {id:'early-shift',emoji:'🌅',name:'Workday — Early Shift',desc:'8:00 AM – 4:30 PM · 75 min commute',color:'#645eb7',slots:[
    {time:'05:45',name:'Alarm / Wake Up',emoji:'⏰',dur:5,cat:'self'},
    {time:'05:50',name:'Medications',emoji:'💊',dur:5,cat:'health'},
    {time:'05:55',name:'Shower + Get Ready',emoji:'🚿',dur:30,cat:'self'},
    {time:'06:25',name:'Breakfast',emoji:'🍽️',dur:15,cat:'health'},
    {time:'06:40',name:'Bag Check / Prepwork',emoji:'🎒',dur:5,cat:'adulting'},
    {time:'06:45',name:'Commute Out',emoji:'🚌',dur:75,cat:'transit'},
    {time:'08:00',name:'Work',emoji:'💼',dur:510,cat:'work'},
    {time:'16:30',name:'Commute Home',emoji:'🚌',dur:75,cat:'transit'},
    {time:'17:45',name:'Feed Cat (PM)',emoji:'🐱',dur:10,cat:'home'},
    {time:'17:55',name:'Dinner',emoji:'🍽️',dur:30,cat:'health'},
    {time:'18:25',name:'Decompress / Wind Down',emoji:'🛋️',dur:30,cat:'self'},
    {time:'18:55',name:'Prepwork for Tomorrow',emoji:'🎒',dur:15,cat:'adulting'},
    {time:'19:10',name:'Brush Teeth PM',emoji:'🪥',dur:5,cat:'self'},
  ]},
  {id:'late-shift',emoji:'🌆',name:'Workday — Late Shift',desc:'9:45 AM – 6:15 PM · 75 min commute',color:'#4ecdc4',slots:[
    {time:'07:30',name:'Alarm / Wake Up',emoji:'⏰',dur:5,cat:'self'},
    {time:'07:35',name:'Medications',emoji:'💊',dur:5,cat:'health'},
    {time:'07:40',name:'Shower + Get Ready',emoji:'🚿',dur:30,cat:'self'},
    {time:'08:10',name:'Breakfast',emoji:'🍽️',dur:15,cat:'health'},
    {time:'08:25',name:'Bag Check / Prepwork',emoji:'🎒',dur:5,cat:'adulting'},
    {time:'08:30',name:'Commute Out',emoji:'🚌',dur:75,cat:'transit'},
    {time:'09:45',name:'Work',emoji:'💼',dur:510,cat:'work'},
    {time:'18:15',name:'Commute Home',emoji:'🚌',dur:75,cat:'transit'},
    {time:'19:30',name:'Feed Cat (PM)',emoji:'🐱',dur:10,cat:'home'},
    {time:'19:40',name:'Dinner',emoji:'🍽️',dur:30,cat:'health'},
    {time:'20:10',name:'Decompress / Wind Down',emoji:'🛋️',dur:30,cat:'self'},
    {time:'20:40',name:'Prepwork for Tomorrow',emoji:'🎒',dur:15,cat:'adulting'},
    {time:'20:55',name:'Brush Teeth PM',emoji:'🪥',dur:5,cat:'self'},
  ]},
  {id:'wfh-focus',emoji:'💼',name:'WFH Focus Day',desc:'Deep work blocks + breaks',color:'#9d88ff',slots:[
    {time:'07:00',name:'Wake up + meds',emoji:'⏰',dur:15,cat:'self'},
    {time:'07:15',name:'Shower + get ready',emoji:'🚿',dur:25,cat:'self'},
    {time:'07:40',name:'Breakfast',emoji:'🍽️',dur:15,cat:'health'},
    {time:'08:00',name:'Short walk',emoji:'👟',dur:20,cat:'health'},
    {time:'08:30',name:'Deep Work Block 1',emoji:'🧠',dur:90,cat:'work'},
    {time:'10:00',name:'Break + water',emoji:'💧',dur:15,cat:'self'},
    {time:'10:15',name:'Deep Work Block 2',emoji:'🧠',dur:90,cat:'work'},
    {time:'11:45',name:'Lunch + rest',emoji:'🍽️',dur:45,cat:'health'},
    {time:'12:30',name:'Admin + emails',emoji:'📧',dur:60,cat:'work'},
    {time:'13:30',name:'Deep Work Block 3',emoji:'🧠',dur:90,cat:'work'},
    {time:'15:00',name:'Movement break',emoji:'🚶',dur:20,cat:'health'},
    {time:'15:20',name:'Wrap up + review',emoji:'✅',dur:40,cat:'work'},
  ]},
  {id:'low-capacity',emoji:'🛡',name:'Low-Capacity Day',desc:'Floor tasks only. Rest is the work.',color:'#ff876c',slots:[
    {time:'09:00',name:'Meds',emoji:'💊',dur:5,cat:'health'},
    {time:'09:05',name:'Eat something',emoji:'🍽️',dur:20,cat:'health'},
    {time:'09:25',name:'Water + sit outside',emoji:'☀️',dur:15,cat:'self'},
    {time:'10:00',name:'One small task only',emoji:'✅',dur:30,cat:'adulting'},
    {time:'10:30',name:'Rest — no guilt',emoji:'🛋️',dur:90,cat:'self'},
    {time:'12:00',name:'Eat again',emoji:'🍽️',dur:20,cat:'health'},
    {time:'12:20',name:'Cat care',emoji:'🐱',dur:10,cat:'home'},
    {time:'15:00',name:'Gentle movement',emoji:'🚶',dur:20,cat:'health'},
    {time:'18:00',name:'Easy dinner',emoji:'🍜',dur:30,cat:'health'},
  ]},
  {id:'medical-appt',emoji:'🩺',name:'Medical Appointment',desc:'Built around your appointment',color:'#4ecdc4',slots:[
    {time:'08:00',name:'Meds',emoji:'💊',dur:5,cat:'health'},
    {time:'08:05',name:'Breakfast',emoji:'🍽️',dur:20,cat:'health'},
    {time:'08:25',name:'Get ready',emoji:'🚿',dur:25,cat:'self'},
    {time:'08:50',name:'Review doctor prep notes',emoji:'📋',dur:15,cat:'health'},
    {time:'09:10',name:'Travel to appointment',emoji:'🚌',dur:30,cat:'transit'},
    {time:'09:40',name:'Appointment',emoji:'🩺',dur:60,cat:'health'},
    {time:'10:40',name:'Travel home',emoji:'🚌',dur:30,cat:'transit'},
    {time:'11:10',name:'Decompress + rest',emoji:'🛋️',dur:45,cat:'self'},
    {time:'12:00',name:'Lunch',emoji:'🍽️',dur:30,cat:'health'},
    {time:'12:30',name:'Log appointment notes',emoji:'📝',dur:20,cat:'health'},
    {time:'13:00',name:'Gentle afternoon',emoji:'🌿',dur:120,cat:'self'},
  ]},
  {id:'social-recovery',emoji:'🔋',name:'Social Recovery Day',desc:'After draining social events',color:'#ef5886',slots:[
    {time:'09:00',name:'Meds',emoji:'💊',dur:5,cat:'health'},
    {time:'09:05',name:'Quiet breakfast',emoji:'☕',dur:25,cat:'health'},
    {time:'09:30',name:'Solo time — no inputs',emoji:'🔇',dur:60,cat:'self'},
    {time:'10:30',name:'Short walk',emoji:'🚶',dur:20,cat:'health'},
    {time:'11:00',name:'Low-effort enjoyable task',emoji:'✨',dur:45,cat:'self'},
    {time:'11:45',name:'Lunch',emoji:'🍽️',dur:30,cat:'health'},
    {time:'12:15',name:'Nap or rest',emoji:'😴',dur:60,cat:'self'},
    {time:'13:15',name:'Quiet creative time',emoji:'🎨',dur:60,cat:'self'},
    {time:'14:15',name:'Cat + home tasks',emoji:'🐱',dur:20,cat:'home'},
    {time:'18:00',name:'Easy dinner',emoji:'🍜',dur:30,cat:'health'},
  ]},
];

function renderTemplateList(){
  var el=document.getElementById('template-list');if(!el)return;
  el.innerHTML=DAY_TEMPLATES.map(function(t){
    return'<div class="tmpl-card" onclick="applyDayTemplate(\''+t.id+'\')" onmouseover="this.style.borderColor=\''+t.color+'\'" onmouseout="this.style.borderColor=\'var(--border)\'">'+
      '<span style="font-size:16px">'+t.emoji+'</span>'+
      '<div style="flex:1;min-width:0">'+
        '<div class="tmpl-name">'+t.name+'</div>'+
        '<div class="tmpl-desc">'+t.desc+'</div>'+
      '</div>'+
      '<span class="tmpl-apply" style="border-color:'+t.color+';color:'+t.color+'">Apply</span>'+
    '</div>';
  }).join('');
}
async function applyDayTemplate(templateId){
  var tmpl=DAY_TEMPLATES.find(function(t){return t.id===templateId;});if(!tmpl)return;
  if(!(await HQConfirm.ask(`Apply "${tmpl.name}"? This replaces today's current schedule.`, {danger:true})))return;
  var dd=getDD(currentDate||todayStr());dd.slots={};
  tmpl.slots.forEach(function(slot){
    var tk=slot.time;if(!dd.slots[tk])dd.slots[tk]=[];
    dd.slots[tk].push({id:uid(),em:slot.emoji||'📌',name:slot.name,dur:slot.dur||30,cat:slot.cat||'self',fromTemplate:templateId});
  });
  persist();renderGrid();updateStats();hqShowToast('📋 '+tmpl.name+' applied!');setTimeout(scrollToNow,80);
}
renderTemplateList();
