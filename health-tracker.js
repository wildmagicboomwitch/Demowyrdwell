(function () {
  'use strict';
  /* ── Phase C7: IIFE + strict mode + HQRenderer.list() migration — health-tracker ── */
  /* ── Window exports at bottom for all HTML event handlers ─────────────────────── */

// ═════════════════════════════════════════════
// THEME SYSTEM — morning / afternoon / night
// Migrates ht-theme → audhd-hq-theme
// ═════════════════════════════════════════════
(function migrateHtTheme() {
  try {
    const old = null;
    if (old) {
      const mapped = old === 'dark' ? 'night' : 'morning';
      // Always write JSON object format so hq-core.js can parse it correctly
      if (!HQSafe.store.get(HQKeys.THEME)) {
        HQSafe.store.set(HQKeys.THEME, {theme: mapped, manual: false});
      }
      }
  } catch(e) {}
})();

// Theme: delegated entirely to hq-core.js (hqSetTheme, hqGetAutoTheme, hqCycleTheme, hqInitTheme)

// FIX-03: ensure tag migrations have run before reading tag data
if (window.HQMigrate) HQMigrate.run('tags');

// Clock: delegated to hq-core.js (hqTickClock, setInterval)

// Sidenav: hqToggleSidenav + hqCloseSidenav delegated to hq-core.js


// ═════════════════════════════════════════════
// hqFlag — local adapter: converts (type, msg, data) → hq-core item object
// hq-core.js provides window.hqFlag(item) globally after DOMContentLoaded
// ═════════════════════════════════════════════
function hqFlag(type, msg, data) {
  const item = {
    id: 'health-' + type + '-' + Date.now(),
    source: 'health-tracker',
    type: type === 'period' ? 'reminder' : 'urgent',
    text: msg,
    href: 'health-tracker.html',
    ts: Date.now(),
    _data: data
  };
  if (typeof window.hqFlag === 'function' && window.hqFlag !== hqFlag) {
    window.hqFlag(item);
  } else {
    // hq-core not yet loaded — write directly
    try {
      let flags = HQSafe.store.get(HQKeys.FLAGS, []);
      flags = flags.filter(f => f.id !== item.id);
      flags.push(item);
      HQSafe.store.set(HQKeys.FLAGS, flags);
      window.dispatchEvent(new CustomEvent('hq-flags-updated'));
    } catch(e) {}
  }
}

// ═════════════════════════════════════════════
// DATA STORE
// ═════════════════════════════════════════════
const STORE = HQKeys.HEALTH;
let HD = {periods:[],headaches:[],sleep:[],symptoms:[],customCats:[],customSyms:[]};
let charts={};
let calYear, calMonth;
let pFlow=0, haAura=false, slQ=0, syEditId=null, haEditId=null, slEditId=null, pEditId=null;
let selCat = '';
let syFilter = 'all';

function load(){
  try{HD=HQSafe.store.get(STORE,{periods:[],headaches:[],sleep:[],symptoms:[],customCats:[],customSyms:[]});if(!HD||typeof HD!=='object')HD={periods:[],headaches:[],sleep:[],symptoms:[],customCats:[],customSyms:[]};} catch(e){}
}
function save(){
  HQSafe.store.set(STORE, HD);
  updateHeader();
  // Flag health alerts to HQ
  checkHealthAlerts();
}

function checkHealthAlerts() {
  // Flag if headache in last 24hrs
  const recent24 = HD.headaches.find(h => {
    if (!h.date) return false;
    return (Date.now() - new Date(h.date + 'T' + (h.startTime||'00:00')).getTime()) < 86400000;
  });
  if (recent24) hqFlag('health-alert', '🧠 Recent headache logged', { intensity: recent24.intensity });
  // Flag if sleep < 5hrs average this week
  const week = HD.sleep.filter(s => {
    const d = new Date(s.date + 'T12:00:00');
    return (Date.now() - d.getTime()) < 7 * 86400000;
  });
  if (week.length > 0) {
    const avg = week.reduce((a,s) => a + (s.hours||0), 0) / week.length;
    if (avg < 5) hqFlag('health-alert', '😴 Sleep average dipped this week', { avgHrs: avg.toFixed(1) });
  }
}

// ═════════════════════════════════════════════
// IMPORT / EXPORT
// ═════════════════════════════════════════════
function openIE(){
  refreshIEStats();
  document.getElementById('ie-modal').classList.add('show');
}
function closeIE(){
  document.getElementById('ie-modal').classList.remove('show');
  document.getElementById('ie-file-merge').value='';
  document.getElementById('ie-file-replace').value='';
}
function refreshIEStats(){
  const cols={periods:'var(--rose)',headaches:'var(--red)',sleep:'var(--sleep)',symptoms:'var(--teal)'};
  const icons={periods:'🩸',headaches:'🧠',sleep:'😴',symptoms:'🩺'};
  const labels={periods:'Periods',headaches:'Headaches',sleep:'Sleep',symptoms:'Symptoms'};
  document.getElementById('ie-stats').innerHTML=
    ['periods','headaches','sleep','symptoms'].map(k=>
      `<span class="ie-stat">${icons[k]} <strong style="color:${cols[k]}">${HD[k].length}</strong> ${labels[k]}</span>`
    ).join('')+
    (HD.customCats.length?`<span class="ie-stat">🔷 <strong style="color:var(--purple)">${HD.customCats.length}</strong> Custom cats</span>`:'');
}
function exportData(){
  const payload={_meta:{source:'AuDHD HQ — Health Tracker',version:1,exportedAt:new Date().toISOString(),counts:{periods:HD.periods.length,headaches:HD.headaches.length,sleep:HD.sleep.length,symptoms:HD.symptoms.length}},periods:HD.periods,headaches:HD.headaches,sleep:HD.sleep,symptoms:HD.symptoms,customCats:HD.customCats,customSyms:HD.customSyms};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download=`health-tracker-backup-${todayStr()}.json`;a.click();URL.revokeObjectURL(url);
  toast('✅ Exported successfully!');
}
async function importData(input,mode){
  const file=input.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=async e=>{
    try{
      const parsed=JSON.parse(e.target.result);
      const src=parsed._meta?parsed:parsed;
      const incoming={periods:Array.isArray(src.periods)?src.periods:[],headaches:Array.isArray(src.headaches)?src.headaches:[],sleep:Array.isArray(src.sleep)?src.sleep:[],symptoms:Array.isArray(src.symptoms)?src.symptoms:[],customCats:Array.isArray(src.customCats)?src.customCats:[],customSyms:Array.isArray(src.customSyms)?src.customSyms:[]};
      const totalIn=incoming.periods.length+incoming.headaches.length+incoming.sleep.length+incoming.symptoms.length;
      if(totalIn===0)throw new Error('No data found');
      if(mode==='replace'){
        const totalCur=HD.periods.length+HD.headaches.length+HD.sleep.length+HD.symptoms.length;
        if(!(await HQConfirm.ask(`⚠️ This will DELETE your ${totalCur} existing entries and replace with ${totalIn} imported entries. Continue?`, {danger:true})))return;
        HD=incoming;toast(`✅ Replaced with ${totalIn} entries!`);
      }else{
        let added=0;
        ['periods','headaches','sleep','symptoms'].forEach(k=>{const existing=new Set(HD[k].map(x=>x.id));const newOnes=incoming[k].filter(x=>x.id&&!existing.has(x.id));HD[k]=[...HD[k],...newOnes];added+=newOnes.length;});
        const existCatIds=new Set(HD.customCats.map(c=>c.id));
        incoming.customCats.filter(c=>!existCatIds.has(c.id)).forEach(c=>HD.customCats.push(c));
        incoming.customSyms.forEach(s=>HD.customSyms.push(s));
        toast(`🔀 Merged! Added ${added} new entries.`);
      }
      save();refreshIEStats();renderOverview();
    }catch(err){HQToast.error('❌ Could not read file. Make sure it\'s a valid Health Tracker export.');}
  };
  reader.readAsText(file);input.value='';
}

// ═════════════════════════════════════════════
// BODY LOCATIONS
// ═════════════════════════════════════════════
const BODY_REGIONS=[{label:'🧠 Head & Face',locs:['Forehead','Left Temple','Right Temple','Behind Eyes','Back of Head','Jaw','Neck']},{label:'💪 Chest & Shoulders',locs:['Left Shoulder','Right Shoulder','Upper Back','Chest','Sternum','Left Arm','Right Arm']},{label:'🫀 Abdomen & Core',locs:['Upper Abdomen','Lower Abdomen','Left Side','Right Side','Lower Back','Pelvis']},{label:'🦵 Hips & Legs',locs:['Left Hip','Right Hip','Left Thigh','Right Thigh','Left Knee','Right Knee','Left Leg','Right Leg','Left Foot','Right Foot']},{label:'🌐 General',locs:['Full Body','Left Side (whole)','Right Side (whole)','Widespread/Diffuse']}];
function buildLocPicker(wrapId,prefix){const wrap=document.getElementById(wrapId);if(!wrap)return;wrap.innerHTML=BODY_REGIONS.map(r=>`<div class="loc-region"><div class="loc-region-hd">${r.label}</div><div class="chips">${r.locs.map(l=>`<button class="chip" id="${prefix}-loc-${l.replace(/\s+/g,'-')}" onclick="tog(this)">${l}</button>`).join('')}</div></div>`).join('');}
function getSelectedLocs(prefix){return[...document.querySelectorAll(`[id^="${prefix}-loc-"].on`)].map(b=>b.textContent.trim());}
function clearLocs(prefix){document.querySelectorAll(`[id^="${prefix}-loc-"].on`).forEach(b=>b.classList.remove('on'));}

// ═════════════════════════════════════════════
// BUILTIN SYMPTOM CATEGORIES
// ═════════════════════════════════════════════
const BUILTIN_CATS=[{id:'digestive',emoji:'🤢',name:'Digestive',syms:['Nausea','Bloating','Cramping','Diarrhea','Constipation','Acid reflux','Heartburn','Vomiting','Gas']},{id:'respiratory',emoji:'😮‍💨',name:'Respiratory',syms:['Cough','Shortness of breath','Congestion','Sneezing','Wheezing','Sore throat','Post-nasal drip']},{id:'musclo',emoji:'🦴',name:'Musculoskeletal',syms:['Joint pain','Muscle ache','Stiffness','Weakness','Cramping','Spasm','Tenderness']},{id:'neuro',emoji:'🧠',name:'Neurological',syms:['Brain fog','Dizziness','Numbness','Tingling','Memory issues','Fatigue','Tremor','Coordination issues']},{id:'cardio',emoji:'💓',name:'Cardiovascular',syms:['Palpitations','Chest tightness','Racing heart','Slow heart rate','Swelling','Shortness of breath']},{id:'systemic',emoji:'🌡️',name:'Systemic',syms:['Fever','Chills','Night sweats','Fatigue','Inflammation','Swollen glands','Weight change']},{id:'skin',emoji:'🌸',name:'Skin',syms:['Rash','Itching','Hives','Dryness','Acne','Eczema flare','Bruising','Swelling']},{id:'mood',emoji:'😰',name:'Mood / Mental',syms:['Anxiety','Low mood','Irritability','Overwhelm','Sensory sensitivity','Dissociation','Panic']},{id:'hormonal',emoji:'🩸',name:'Hormonal',syms:['Cramps','Hot flashes','Night sweats','Mood shifts','Breast tenderness','Bloating','Cycle changes']},{id:'sleep2',emoji:'😴',name:'Sleep',syms:['Insomnia','Hypersomnia','Night waking','Sleep paralysis','Restless sleep','Vivid dreams']}];

// ═════════════════════════════════════════════
// TAB SWITCH
// ═════════════════════════════════════════════
function sw(tab,el){
  document.querySelectorAll('[id^="tab-"]').forEach(p=>p.style.display='none');
  const panel=document.getElementById('tab-'+tab);
  if(panel)panel.style.display='';
  document.querySelectorAll('.nav-tab').forEach(b=>b.classList.remove('active'));
  if(el)el.classList.add('active');
  if(tab==='headache'){renderHAHist();updateHAStats();}
  if(tab==='sleep'){renderSleepHist();updateSleepStats();}
  if(tab==='symptoms'){renderSymCats();renderSymHist();}
  if(tab==='trends'){renderTrends();if(typeof renderCrashChart==='function')renderCrashChart();if(typeof renderCorrelation==='function')renderCorrelation();}
  if(tab==='dreams'){renderDreamsTab();const df=document.getElementById('dr-date');if(df&&!df.value)df.value=todayStr();}
  if(tab==='checkins')renderCheckInsTab();
  if(tab==='energy'&&typeof renderEnergyTab==='function')renderEnergyTab();
  if(tab==='meds'&&typeof renderMedsTab==='function')renderMedsTab();
  if(tab==='doctor'&&typeof renderDoctorTab==='function')renderDoctorTab();
}

// ═════════════════════════════════════════════
// HEADER STATS
// ═════════════════════════════════════════════
function updateHeader(){
  const pred=calcPredictions();
  if(pred.nextPeriod){const diff=daysBetween(todayStr(),pred.nextPeriod);document.getElementById('hp-next').textContent=diff===0?'Today':diff>0?`${diff}d`:'Overdue';}
  if(HD.headaches.length){const last=HD.headaches.sort((a,b)=>new Date(b.date)-new Date(a.date))[0];const diff=daysBetween(last.date,todayStr());document.getElementById('hp-ha').textContent=diff===0?'Today':`${diff}d ago`;}
  if(HD.sleep.length){const recent=HD.sleep.slice(-14);const avg=(recent.reduce((a,s)=>a+(s.quality||0),0)/recent.length).toFixed(1);document.getElementById('hp-sleep').textContent=avg+'/5';}
}

// ═════════════════════════════════════════════
// CHIP TOGGLE
// ═════════════════════════════════════════════
function tog(el){el.classList.toggle('on');}
function togC(el){el.classList.toggle('on');}
function getChips(groupId){return[...document.querySelectorAll('#'+groupId+' .on')].map(b=>b.textContent.trim());}
function clearChips(groupId){document.querySelectorAll('#'+groupId+' .on').forEach(b=>b.classList.remove('on'));}

// RATING BUTTONS
function setR(prefix,val){
  const gid=prefix==='sl'?'sl-quality-g':prefix;
  document.querySelectorAll('#'+gid+' .rb').forEach((b,i)=>{b.classList.toggle('on',i+1===val);});
  if(prefix==='sl')slQ=val;
}

// INTENSITY SLIDERS
function updInt(v){
  const c=['','#06d6a0','#06d6a0','#4ecdc4','#ffd166','#ffd166','#fd7e14','#fd7e14','#ef476f','#ef476f','#c2000b'];
  document.getElementById('ha-int-val').textContent=v;
  document.getElementById('ha-int-val').style.color=c[v]||'var(--purple)';
  document.getElementById('ha-int').style.background=`linear-gradient(to right,${c[v]||'#9b6dff'} 0%,${c[v]||'#9b6dff'} ${(v-1)/9*100}%,var(--border) ${(v-1)/9*100}%,var(--border) 100%)`;
}
function updSev(v){
  document.getElementById('sy-sev-val').textContent=v;
  document.getElementById('sy-sev-val').style.color=v<=3?'var(--green)':v<=6?'var(--yellow)':'var(--red)';
}

// AURA
function setAura(val){
  haAura=val;
  document.getElementById('aura-yes').classList.toggle('on',val);
  document.getElementById('aura-no').classList.toggle('on',!val);
  document.getElementById('aura-syms-wrap').style.display=val?'block':'none';
}

// FLOW
function setFlow(v){pFlow=v;document.querySelectorAll('.flow-btn[data-f]').forEach(b=>b.classList.toggle('on',+b.dataset.f===v));}

// CALC HOURS
function calcHrs(){const bed=document.getElementById('sl-bed').value;const wake=document.getElementById('sl-wake').value;if(!bed||!wake)return;let bm=toMin(bed),wm=toMin(wake);if(wm<bm)wm+=1440;document.getElementById('sl-hrs').value=((wm-bm)/60).toFixed(1);}
function calcHADur(){const st=document.getElementById('ha-start').value;const en=document.getElementById('ha-end').value;if(st&&en){let sm=toMin(st),em=toMin(en);if(em<sm)em+=1440;document.getElementById('ha-dur').value=((em-sm)/60).toFixed(1);}}
function toMin(t){const p=t.split(':');return+p[0]*60+ +p[1];}

// CUSTOM CHIPS
function addCustomChip(inpId,targetId,cls){
  const inp=document.getElementById(inpId);const v=inp.value.trim();if(!v)return;
  const chip=document.createElement('button');chip.className=`chip ${cls} on`;chip.textContent=v;
  chip.onclick=()=>chip.classList.toggle('on');chip.setAttribute('data-custom','1');
  document.getElementById(targetId).appendChild(chip);inp.value='';
}
function getCustomChips(targetId){return[...document.querySelectorAll('#'+targetId+' [data-custom].on')].map(b=>b.textContent.trim());}

// ═════════════════════════════════════════════
// PERIOD
// ═════════════════════════════════════════════
function updatePeriodStats(){
  const pred=calcPredictions();
  document.getElementById('p-avgcycle').textContent=pred.avgCycle||'—';
  document.getElementById('p-next').textContent=pred.nextPeriod?fmtShort(pred.nextPeriod):'—';
  document.getElementById('p-ovul').textContent=pred.ovulation?fmtShort(pred.ovulation):'—';
  document.getElementById('p-fertile').textContent=pred.fertileStart?fmtShort(pred.fertileStart)+' – '+fmtShort(pred.fertileEnd):'—';
  document.getElementById('p-hist-count').textContent=HD.periods.length+' entr'+(HD.periods.length===1?'y':'ies');
}
function calcPredictions(){
  const starts=HD.periods.map(p=>p.startDate).filter(Boolean).sort();
  if(!starts.length)return{};
  let avgCycle=28;
  if(starts.length>=2){const lens=[];for(let i=1;i<starts.length;i++){const d=daysBetween(starts[i-1],starts[i]);if(d>14&&d<60)lens.push(d);}if(lens.length)avgCycle=Math.round(lens.reduce((a,b)=>a+b)/lens.length);}
  const last=starts[starts.length-1];
  const nextPeriod=addDays(last,avgCycle);
  const ovulation=addDays(nextPeriod,-14);
  const fertileStart=addDays(ovulation,-5);
  const fertileEnd=addDays(ovulation,1);
  return{avgCycle,nextPeriod,ovulation,fertileStart,fertileEnd,daysUntil:daysBetween(todayStr(),nextPeriod)};
}
function savePeriod(){
  const sd=document.getElementById('p-start').value;
  if(!sd){HQToast.warn('Please enter a start date.');return;}
  const ed=document.getElementById('p-end').value;
  const entry={id:pEditId||Date.now().toString(),startDate:sd,endDate:ed||null,flow:pFlow,flowLog:sd&&pFlow?{[sd]:pFlow}:{},pms:getChips('p-pms'),notes:document.getElementById('p-notes').value.trim(),saved:new Date().toISOString()};
  if(pEditId){const i=HD.periods.findIndex(x=>x.id===pEditId);if(i!==-1)HD.periods[i]=entry;}else HD.periods.unshift(entry);
  save();clearForm('p');renderCal();renderPeriodHist();updatePeriodStats();
  toast('🩸 Period logged!');
  hqFlag('period','🩸 Period logged',{startDate:sd});
}
// ── C5 VM: Period History ─────────────────────────────────────────────────
// Pure function — derives display fields from raw period data, no DOM access.
function _buildPeriodHistVM(periods) {
  const flowLabels = ['','Spotting','Light','Moderate','Heavy','Very Heavy'];
  return [...periods]
    .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
    .map(p => ({
      id:           p.id,
      icon:         '🩸',
      dateLabel:    fmtDate(p.startDate) + (p.endDate ? ' – ' + fmtDate(p.endDate) : ' (ongoing)'),
      daysStr:      p.endDate ? `⏱️ ${daysBetween(p.startDate, p.endDate) + 1} days` : '',
      flowStr:      p.flow ? `Flow: ${flowLabels[p.flow] || ''}` : '',
      pmsSlice:     (p.pms || []).slice(0, 4),
      pmsOverflow:  Math.max(0, (p.pms || []).length - 4),
      notes:        p.notes || '',
      pmsAll:       p.pms || [],
    }));
}

// ── C7 Populator: Period ──────────────────────────────────────────────────
function _applyPeriodEl(el, p) {
  el.dataset.id = p.id;
  HQRenderer.setText(el, '.hitem-title', p.dateLabel);
  // Meta spans — safe textContent writes
  const daysSpan = el.querySelector('.p-meta-days');
  if (daysSpan) { daysSpan.textContent = p.daysStr; daysSpan.style.display = p.daysStr ? '' : 'none'; }
  const flowSpan = el.querySelector('.p-meta-flow');
  if (flowSpan) { flowSpan.textContent = p.flowStr; flowSpan.style.display = p.flowStr ? '' : 'none'; }
  // PMS tag chips (header preview) — DOM only, no innerHTML
  const tagsEl = el.querySelector('.p-pms-preview');
  if (tagsEl) {
    tagsEl.replaceChildren();
    p.pmsSlice.forEach(tag => {
      const s = document.createElement('span'); s.className = 'mtag rose'; s.textContent = tag;
      tagsEl.appendChild(s);
    });
    if (p.pmsOverflow > 0) {
      const s = document.createElement('span'); s.className = 'mtag'; s.textContent = `+${p.pmsOverflow}`;
      tagsEl.appendChild(s);
    }
  }
  // PMS body full list
  const pmsBodyEl = el.querySelector('.p-pms-body');
  if (pmsBodyEl) {
    pmsBodyEl.replaceChildren();
    if (p.pmsAll.length) {
      pmsBodyEl.style.display = '';
      const lbl = document.createElement('span'); lbl.className = 'flabel'; lbl.textContent = 'PMS: ';
      pmsBodyEl.appendChild(lbl);
      p.pmsAll.forEach(tag => {
        const s = document.createElement('span'); s.className = 'mtag rose'; s.textContent = tag;
        pmsBodyEl.appendChild(s);
        pmsBodyEl.appendChild(document.createTextNode(' '));
      });
    } else {
      pmsBodyEl.style.display = 'none';
    }
  }
  // Notes
  const notesEl = el.querySelector('.p-notes');
  if (notesEl) { notesEl.textContent = p.notes; notesEl.style.display = p.notes ? '' : 'none'; }
}

function renderPeriodHist() {
  const container = document.getElementById('p-hist');
  HQRenderer.list(container, _buildPeriodHistVM(HD.periods), {
    key:   p => p.id,
    build(p) {
      const el = HQRenderer.fromTemplate('ht-period-item-template');
      _applyPeriodEl(el, p);
      return el;
    },
    update(el, p) { _applyPeriodEl(el, p); },
    empty: '<div class="empty"><div class="empty-ic">🩸</div>No periods logged yet.</div>',
  });
}
// Event delegation for period list — handles toggle, edit, delete
// FIX-05: pHist click — delegated, registered in consolidated DOMContentLoaded below
function _initPHistListener(sig) {
  const pHist = document.getElementById('p-hist');
  if (pHist) {
    pHist.addEventListener('click', function (e) {
      const btn = e.target.closest('[data-action]');
      const item = e.target.closest('.hitem[data-id]');
      if (!item) return;
      const id = item.dataset.id;
      if (!btn) { item.classList.toggle('open'); return; }
      e.stopPropagation();
      if (btn.dataset.action === 'toggle') item.classList.toggle('open');
      if (btn.dataset.action === 'edit')   editPeriod(id);
      if (btn.dataset.action === 'delete')
        delEntry('periods', id, function () { renderPeriodHist(); renderCal(); updatePeriodStats(); });
    }, sig);
  }
}
function editPeriod(id){const p=HD.periods.find(x=>x.id===id);if(!p)return;pEditId=id;clearForm('p');pEditId=id;document.getElementById('p-start').value=p.startDate||'';document.getElementById('p-end').value=p.endDate||'';if(p.flow)setFlow(p.flow);p.pms.forEach(t=>{const el=findChipByText('p-pms',t);if(el)el.classList.add('on');});document.getElementById('p-notes').value=p.notes||'';document.getElementById('p-form-lbl').textContent='✏️ Editing Period';scrollTop();}

// CALENDAR
function initCal(){const now=new Date();calYear=now.getFullYear();calMonth=now.getMonth();}
function moveCal(dir){calMonth+=dir;if(calMonth>11){calMonth=0;calYear++;}else if(calMonth<0){calMonth=11;calYear--;}renderCal();}
function renderCal(){
  const months=['January','February','March','April','May','June','July','August','September','October','November','December'];
  document.getElementById('cal-month-label').textContent=months[calMonth]+' '+calYear;
  const firstDay=new Date(calYear,calMonth,1).getDay();
  const daysInMonth=new Date(calYear,calMonth+1,0).getDate();
  const today=todayStr();
  const pred=calcPredictions();
  const pDays={};
  HD.periods.forEach(p=>{
    const s=new Date(p.startDate+'T12:00:00');
    const e=p.endDate?new Date(p.endDate+'T12:00:00'):new Date(p.startDate+'T12:00:00');
    for(let d=new Date(s);d<=e;d.setDate(d.getDate()+1)){const ds=d.toISOString().split('T')[0];pDays[ds]={flow:p.flow};}
    if(p.pms&&p.pms.length){for(let i=1;i<=7;i++){const pd=new Date(s);pd.setDate(pd.getDate()-i);const pds=pd.toISOString().split('T')[0];if(!pDays[pds])pDays[pds]={pms:true};else pDays[pds].pms=true;}}
  });
  const grid=document.getElementById('cal-grid');
  const days=['Su','Mo','Tu','We','Th','Fr','Sa'];
  let html=days.map(d=>`<div class="cal-day-hd">${d}</div>`).join('');
  for(let i=0;i<firstDay;i++)html+=`<div class="cal-day empty"></div>`;
  for(let d=1;d<=daysInMonth;d++){
    const ds=`${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    let cls='cal-day';
    if(ds===today)cls+=' today';
    if(pDays[ds]?.flow)cls+=' period';
    else if(pDays[ds]?.pms)cls+=' pms-day';
    if(pred.ovulation&&ds===pred.ovulation)cls+=' ovulation';
    else if(pred.fertileStart&&ds>=pred.fertileStart&&ds<=pred.fertileEnd)cls+=' fertile';
    if(pred.nextPeriod&&!pDays[ds]?.flow){const np=pred.nextPeriod;const npEnd=addDays(np,5);if(ds>=np&&ds<=npEnd)cls+=' predicted';}
    html+=`<div class="${cls}" onclick="calClick('${ds}')">${d}</div>`;
  }
  grid.innerHTML=html;
}
function calClick(ds){document.getElementById('p-start').value=ds;sw('period',document.querySelector('.nav-tab.a-rose'));scrollTop();}

// ═════════════════════════════════════════════
// HEADACHE
// ═════════════════════════════════════════════
function updateHAStats(){
  const mn=thisMonthStr();
  const thisMonth=HD.headaches.filter(h=>h.date&&h.date.startsWith(mn));
  const durs=HD.headaches.filter(h=>h.duration).map(h=>h.duration);
  const avgDur=durs.length?(durs.reduce((a,b)=>a+b)/durs.length).toFixed(1):'—';
  const typeMap={};HD.headaches.forEach(h=>{if(h.type)typeMap[h.type]=(typeMap[h.type]||0)+1;});
  const topType=Object.entries(typeMap).sort((a,b)=>b[1]-a[1])[0];
  document.getElementById('ha-total').textContent=HD.headaches.length;
  document.getElementById('ha-month').textContent=thisMonth.length;
  document.getElementById('ha-avgdur').textContent=avgDur+(avgDur!=='—'?' hrs':'');
  document.getElementById('ha-top').textContent=topType?topType[0].replace(/^\S+\s*/,''):'—';
  document.getElementById('ha-hist-count').textContent=HD.headaches.length+' entr'+(HD.headaches.length===1?'y':'ies');
}
function saveHA(){
  const date=document.getElementById('ha-date').value;
  const type=document.getElementById('ha-type').value;
  if(!date){HQToast.warn('Please enter a date.');return;}
  let dur=+document.getElementById('ha-dur').value||0;
  if(!dur){const st=document.getElementById('ha-start').value;const en=document.getElementById('ha-end').value;if(st&&en){let sm=toMin(st),em=toMin(en);if(em<sm)em+=1440;dur=+((em-sm)/60).toFixed(1);}}
  const auraChips=haAura?getChips('aura-syms'):[];
  const entry={id:haEditId||Date.now().toString(),type,date,startTime:document.getElementById('ha-start').value,endTime:document.getElementById('ha-end').value,intensity:+document.getElementById('ha-int').value,duration:dur,aura:haAura,auraSymptoms:auraChips,triggers:[...getChips('ha-triggers'),...getCustomChips('ha-trig-extra')],meds:[...getChips('ha-meds'),...getCustomChips('ha-med-extra')],relief:getChips('ha-relief'),locations:getSelectedLocs('ha'),notes:document.getElementById('ha-notes').value.trim(),saved:new Date().toISOString()};
  if(haEditId){const i=HD.headaches.findIndex(x=>x.id===haEditId);if(i!==-1)HD.headaches[i]=entry;}else HD.headaches.unshift(entry);
  save();clearForm('ha');renderHAHist();updateHAStats();
  toast('🧠 Headache logged!');
  if(entry.intensity>=7)hqFlag('health-alert','🧠 High-intensity headache',{intensity:entry.intensity,type:entry.type});
}
// ── C5 VM: Headache History ───────────────────────────────────────────────
// Pure function — derives display fields from raw headache data, no DOM access.
function _buildHAHistVM(headaches) {
  return [...headaches]
    .sort((a, b) => new Date(b.date + ' ' + (b.startTime||'00:00')) - new Date(a.date + ' ' + (a.startTime||'00:00')))
    .map(h => ({
      id:         h.id,
      icon:       h.type?.includes('Migraine') ? '🧠' : h.type?.includes('Tension') ? '😤' : '⚡',
      type:       h.type || 'Headache',
      dateLabel:  fmtDate(h.date),
      timeStr:    h.startTime ? `⏰ ${h.startTime}${h.endTime ? ' – ' + h.endTime : ''}` : '',
      durStr:     h.duration  ? `⏱️ ${h.duration} hrs` : '',
      intensity:  h.intensity || 0,
      intColor:   h.intensity <= 3 ? 'var(--green)' : h.intensity <= 6 ? 'var(--yellow)' : 'var(--red)',
      intPct:     (h.intensity || 0) * 10,
      hasAura:    !!h.aura,
      triggers:   h.triggers  || [],
      locations:  h.locations || [],
      meds:       h.meds      || [],
      relief:     h.relief    || [],
      notes:      h.notes     || '',
    }));
}

// ── C7 Populator: Headache ────────────────────────────────────────────────
function _applyTagGroup(el, selector, tags, cls) {
  const wrap = el.querySelector(selector);
  if (!wrap) return;
  wrap.replaceChildren();
  if (!tags.length) { wrap.style.display = 'none'; return; }
  wrap.style.display = '';
  const lbl = document.createElement('span'); lbl.className = 'flabel';
  lbl.textContent = wrap.dataset.label || '';
  wrap.appendChild(lbl);
  tags.forEach(tag => {
    const s = document.createElement('span'); s.className = 'mtag ' + (cls || '');
    s.textContent = tag;
    wrap.appendChild(s);
    wrap.appendChild(document.createTextNode(' '));
  });
}
function _applyHAEl(el, h) {
  el.dataset.id = h.id;
  HQRenderer.setText(el, '.hitem-icon', h.icon);
  HQRenderer.setText(el, '.hitem-title', h.type + ' — ' + h.dateLabel);
  const timeSpan = el.querySelector('.ha-time'); if (timeSpan) { timeSpan.textContent = h.timeStr; timeSpan.style.display = h.timeStr ? '' : 'none'; }
  const durSpan  = el.querySelector('.ha-dur');  if (durSpan)  { durSpan.textContent  = h.durStr;  durSpan.style.display  = h.durStr  ? '' : 'none'; }
  const intSpan  = el.querySelector('.ha-int-val');
  if (intSpan) { intSpan.textContent = `⚡ ${h.intensity}/10`; intSpan.style.color = h.intColor; }
  const auraSpan = el.querySelector('.ha-aura'); if (auraSpan) auraSpan.style.display = h.hasAura ? '' : 'none';
  // Intensity bar
  const fill = el.querySelector('.int-fill');
  if (fill) { fill.style.width = h.intPct + '%'; fill.style.background = h.intColor; }
  // Tag chips preview
  const preview = el.querySelector('.ha-tags-preview');
  if (preview) {
    preview.replaceChildren();
    h.triggers.slice(0, 3).forEach(t => { const s = document.createElement('span'); s.className = 'mtag red'; s.textContent = t; preview.appendChild(s); });
    h.locations.slice(0, 2).forEach(l => { const s = document.createElement('span'); s.className = 'mtag teal'; s.textContent = l; preview.appendChild(s); });
  }
  // Body tag groups
  el.querySelector('.ha-trigger-wrap')?.setAttribute('data-label', 'Triggers: ');
  el.querySelector('.ha-meds-wrap')?.setAttribute('data-label', 'Meds: ');
  el.querySelector('.ha-relief-wrap')?.setAttribute('data-label', 'Relief: ');
  el.querySelector('.ha-loc-wrap')?.setAttribute('data-label', 'Location: ');
  _applyTagGroup(el, '.ha-trigger-wrap', h.triggers, 'red');
  _applyTagGroup(el, '.ha-meds-wrap',    h.meds,     '');
  _applyTagGroup(el, '.ha-relief-wrap',  h.relief,   '');
  _applyTagGroup(el, '.ha-loc-wrap',     h.locations,'teal');
  const notesEl = el.querySelector('.ha-notes'); if (notesEl) { notesEl.textContent = h.notes; notesEl.style.display = h.notes ? '' : 'none'; }
}

function renderHAHist() {
  const container = document.getElementById('ha-hist');
  HQRenderer.list(container, _buildHAHistVM(HD.headaches), {
    key:   h => h.id,
    build(h) {
      const el = HQRenderer.fromTemplate('ht-headache-item-template');
      _applyHAEl(el, h);
      return el;
    },
    update(el, h) { _applyHAEl(el, h); },
    empty: '<div class="empty"><div class="empty-ic">🧠</div>No headaches logged yet.</div>',
  });
}
// Event delegation for headache list
// FIX-05: haHist click — registered in consolidated DOMContentLoaded below
function _initHAHistListener(sig) {
  const haHist = document.getElementById('ha-hist');
  if (haHist) {
    haHist.addEventListener('click', function (e) {
      const btn = e.target.closest('[data-action]');
      const item = e.target.closest('.hitem[data-id]');
      if (!item) return;
      const id = item.dataset.id;
      if (!btn) { item.classList.toggle('open'); return; }
      e.stopPropagation();
      if (btn.dataset.action === 'edit')   editHA(id);
      if (btn.dataset.action === 'delete')
        delEntry('headaches', id, function () { renderHAHist(); updateHAStats(); });
    }, sig);
  }
}
function editHA(id){const h=HD.headaches.find(x=>x.id===id);if(!h)return;haEditId=id;clearForm('ha');haEditId=id;document.getElementById('ha-type').value=h.type||'';document.getElementById('ha-date').value=h.date||'';document.getElementById('ha-start').value=h.startTime||'';document.getElementById('ha-end').value=h.endTime||'';document.getElementById('ha-dur').value=h.duration||'';document.getElementById('ha-int').value=h.intensity||5;updInt(h.intensity||5);setAura(h.aura||false);if(h.aura&&h.auraSymptoms)h.auraSymptoms.forEach(t=>{const el=findChipByText('aura-syms',t);if(el)el.classList.add('on');});h.triggers.forEach(t=>{const el=findChipByText('ha-triggers',t);if(el)el.classList.add('on');});h.meds.forEach(t=>{const el=findChipByText('ha-meds',t);if(el)el.classList.add('on');});h.relief.forEach(t=>{const el=findChipByText('ha-relief',t);if(el)el.classList.add('on');});if(h.locations)h.locations.forEach(l=>{const el=document.getElementById(`ha-loc-${l.replace(/\s+/g,'-')}`);if(el)el.classList.add('on');});document.getElementById('ha-notes').value=h.notes||'';document.getElementById('ha-form-lbl').textContent='✏️ Editing Headache';scrollTop();}

// ═════════════════════════════════════════════
// SLEEP
// ═════════════════════════════════════════════
function updateSleepStats(){
  const hrs=HD.sleep.filter(s=>s.hours).map(s=>s.hours);
  const qs=HD.sleep.filter(s=>s.quality).map(s=>s.quality);
  const avgHrs=hrs.length?(hrs.reduce((a,b)=>a+b)/hrs.length).toFixed(1):'—';
  const avgQ=qs.length?(qs.reduce((a,b)=>a+b)/qs.length).toFixed(1):'—';
  const bestQ=qs.length?Math.max(...qs):'—';
  document.getElementById('sl-total').textContent=HD.sleep.length;
  document.getElementById('sl-avghrs').textContent=avgHrs+(avgHrs!=='—'?' hrs':'');
  document.getElementById('sl-avgq').textContent=avgQ+(avgQ!=='—'?'/5':'');
  document.getElementById('sl-best').textContent=bestQ+(bestQ!=='—'?'/5':'');
  document.getElementById('sl-hist-count').textContent=HD.sleep.length+' entr'+(HD.sleep.length===1?'y':'ies');
}
function saveSleep(){
  const date=document.getElementById('sl-date').value;
  if(!date){HQToast.warn('Please enter a date.');return;}
  const hrs=+document.getElementById('sl-hrs').value||0;
  const entry={id:slEditId||Date.now().toString(),date,bedtime:document.getElementById('sl-bed').value,wakeTime:document.getElementById('sl-wake').value,hours:hrs,quality:slQ,factors:[...document.querySelectorAll('#tab-sleep .chip.on')].map(b=>b.textContent.trim()),notes:document.getElementById('sl-notes').value.trim(),saved:new Date().toISOString()};
  if(slEditId){const i=HD.sleep.findIndex(x=>x.id===slEditId);if(i!==-1)HD.sleep[i]=entry;}else HD.sleep.unshift(entry);
  save();clearForm('sl');renderSleepHist();updateSleepStats();
  toast('😴 Sleep logged!');
  if(hrs>0&&hrs<5)hqFlag('health-alert','😴 Short sleep noted',{hours:hrs});
}
// ── C5 VM: Sleep History ──────────────────────────────────────────────────
// Pure function — derives display fields from raw sleep data, no DOM access.
function _buildSleepHistVM(sleep) {
  return [...sleep]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .map(s => {
      const qcol = !s.quality ? 'var(--muted)'
        : s.quality <= 2 ? 'var(--red)'
        : s.quality <= 3 ? 'var(--yellow)'
        : 'var(--green)';
      return {
        id:       s.id,
        dateLabel: fmtDate(s.date),
        bedtime:  s.bedtime  || '',
        wakeTime: s.wakeTime || '',
        hours:    s.hours    || 0,
        quality:  s.quality  || 0,
        qColor:   qcol,
        factors:  s.factors  || [],
        notes:    s.notes    || '',
      };
    });
}

// ── C7 Populator: Sleep ───────────────────────────────────────────────────
function _applySleepEl(el, s) {
  el.dataset.id = s.id;
  HQRenderer.setText(el, '.hitem-title', s.dateLabel);
  const bedSpan  = el.querySelector('.sl-bed');  if (bedSpan)  { bedSpan.textContent  = s.bedtime  ? `🌙 ${s.bedtime}`  : ''; bedSpan.style.display  = s.bedtime  ? '' : 'none'; }
  const wakeSpan = el.querySelector('.sl-wake'); if (wakeSpan) { wakeSpan.textContent = s.wakeTime ? `☀️ ${s.wakeTime}` : ''; wakeSpan.style.display = s.wakeTime ? '' : 'none'; }
  const hrsSpan  = el.querySelector('.sl-hrs');  if (hrsSpan)  { hrsSpan.textContent  = s.hours    ? `⏱️ ${s.hours}hrs`  : ''; hrsSpan.style.display  = s.hours    ? '' : 'none'; }
  // Quality dot row — 5 dots built via DOM
  const dots5 = el.querySelector('.dots5');
  if (dots5) {
    dots5.replaceChildren();
    for (let i = 0; i < 5; i++) {
      const dot = document.createElement('span');
      dot.className = 'dot5' + (i < s.quality ? ' f' : '');
      if (i < s.quality) dot.style.background = s.qColor;
      dots5.appendChild(dot);
    }
  }
  // Body: factors
  const factorsWrap = el.querySelector('.sl-factors');
  if (factorsWrap) {
    factorsWrap.replaceChildren();
    if (s.factors.length) {
      factorsWrap.style.display = '';
      const lbl = document.createElement('span'); lbl.className = 'flabel'; lbl.textContent = 'Factors: ';
      factorsWrap.appendChild(lbl);
      s.factors.forEach(f => {
        const span = document.createElement('span'); span.className = 'mtag'; span.textContent = f;
        factorsWrap.appendChild(span);
        factorsWrap.appendChild(document.createTextNode(' '));
      });
    } else {
      factorsWrap.style.display = 'none';
    }
  }
  const notesEl = el.querySelector('.sl-notes'); if (notesEl) { notesEl.textContent = s.notes; notesEl.style.display = s.notes ? '' : 'none'; }
}

function renderSleepHist() {
  const container = document.getElementById('sl-hist');
  HQRenderer.list(container, _buildSleepHistVM(HD.sleep), {
    key:   s => s.id,
    build(s) {
      const el = HQRenderer.fromTemplate('ht-sleep-item-template');
      _applySleepEl(el, s);
      return el;
    },
    update(el, s) { _applySleepEl(el, s); },
    empty: '<div class="empty"><div class="empty-ic">😴</div>No sleep entries yet.</div>',
  });
}
// Event delegation for sleep list
// FIX-05: slHist click — registered in consolidated DOMContentLoaded below
function _initSLHistListener(sig) {
  const slHist = document.getElementById('sl-hist');
  if (slHist) {
    slHist.addEventListener('click', function (e) {
      const btn = e.target.closest('[data-action]');
      const item = e.target.closest('.hitem[data-id]');
      if (!item) return;
      const id = item.dataset.id;
      if (!btn) { item.classList.toggle('open'); return; }
      e.stopPropagation();
      if (btn.dataset.action === 'delete')
        delEntry('sleep', id, function () { renderSleepHist(); updateSleepStats(); });
    }, sig);
  }
}

// ═════════════════════════════════════════════
// SYMPTOMS
// ═════════════════════════════════════════════
function renderSymCats(){
  const allCats=[...BUILTIN_CATS,...HD.customCats];
  const counts={};HD.symptoms.forEach(s=>{counts[s.category]=(counts[s.category]||0)+1;});
  const tabsEl=document.getElementById('sy-cat-tabs');
  const gridEl=document.getElementById('sy-cat-grid');
  const usedCats=Object.keys(counts);
  document.getElementById('sy-total').textContent=HD.symptoms.length;
  document.getElementById('sy-month').textContent=HD.symptoms.filter(s=>s.date&&s.date.startsWith(thisMonthStr())).length;
  document.getElementById('sy-cats-count').textContent=usedCats.length;
  tabsEl.innerHTML=`<button class="itab ${selCat===''?'on':''}" onclick="sySetCat('')">All</button>`+allCats.map(c=>`<button class="itab ${selCat===c.id?'on':''}" onclick="sySetCat('${esc(c.id)}')">${renderEmoji(c.emoji)} ${esc(c.name)}${counts[c.id]?` (${counts[c.id]})`:''}</button>`).join('');
  gridEl.innerHTML=allCats.map(c=>`<div class="ccat-card ${selCat===c.id?'sel':''}" onclick="sySelectCat('${esc(c.id)}')"><div class="cc-icon">${renderEmoji(c.emoji)}</div><div class="cc-name">${esc(c.name)}</div></div>`).join('');
}
function sySetCat(id){selCat=id;renderSymCats();renderSymHist();}
function sySelectCat(id){
  selCat=id;renderSymCats();
  const cat=[...BUILTIN_CATS,...HD.customCats].find(c=>c.id===id);
  if(cat){document.getElementById('sy-form-lbl').textContent='🩺 Log '+cat.name+' Symptom';document.getElementById('sy-name').value='';}
  document.getElementById('sy-form-card').style.display='block';scrollTop();
}
function saveSymptom(){
  const date=document.getElementById('sy-date').value;
  const name=document.getElementById('sy-name').value.trim();
  if(!date||!name){HQToast.warn('Please enter a date and symptom name.');return;}
  if(!selCat){HQToast.warn('Please select a category first.');return;}
  const cat=[...BUILTIN_CATS,...HD.customCats].find(c=>c.id===selCat);
  const entry={id:syEditId||Date.now().toString(),date,time:document.getElementById('sy-time').value,name,category:selCat,categoryName:cat?.name||'',categoryEmoji:cat?.emoji||'🩺',severity:+document.getElementById('sy-sev').value,locations:getSelectedLocs('sy'),notes:document.getElementById('sy-notes').value.trim(),saved:new Date().toISOString()};
  if(syEditId){const i=HD.symptoms.findIndex(x=>x.id===syEditId);if(i!==-1)HD.symptoms[i]=entry;}else HD.symptoms.unshift(entry);
  save();clearForm('sy');renderSymHist();renderSymCats();
  document.getElementById('sy-hist-count').textContent=HD.symptoms.length+' entr'+(HD.symptoms.length===1?'y':'ies');
  toast('🩺 Symptom logged!');
  if(entry.severity>=7)hqFlag('health-alert','🩺 High-severity symptom',{name:entry.name,severity:entry.severity});
}
// C10-01: renderSymHist — migrated from innerHTML to HQRenderer.list()
function renderSymHist(){
  const el=document.getElementById('sy-hist');
  const filtered=selCat==='all'||!selCat?HD.symptoms:HD.symptoms.filter(s=>s.category===selCat);
  document.getElementById('sy-hist-count').textContent=HD.symptoms.length+' total';
  if(!filtered.length){
    el.innerHTML='<div class="empty"><div class="empty-ic">🩺</div>'+(HD.symptoms.length?'No symptoms in this category.':'No symptoms logged yet.')+'</div>';
    return;
  }
  const sorted=[...filtered].sort((a,b)=>new Date(b.date+' '+(b.time||'00:00'))-new Date(a.date+' '+(a.time||'00:00')));

  HQRenderer.list(el, sorted, {
    key: function(s){ return s.id; },
    template: 'ht-symptom-item-template',
    render: function(node, s){
      const scol = s.severity<=3?'var(--green)':s.severity<=6?'var(--yellow)':'var(--red)';
      node.id = 'syi-' + s.id;

      node.querySelector('.hitem-hd').onclick = function(){ togH('syi-'+s.id); };

      HQRenderer.setText(node, '.si-cat-emoji', s.categoryEmoji || '🩺');
      HQRenderer.setText(node, '.si-name', s.name);
      HQRenderer.setText(node, '.si-cat-name', s.categoryName || '');
      HQRenderer.setText(node, '.si-date', '📅 ' + fmtDate(s.date) + (s.time ? ' '+s.time : ''));

      const sevVal = node.querySelector('.si-severity-val');
      sevVal.textContent = s.severity + '/10';
      sevVal.style.color = scol;

      const bar = node.querySelector('.si-severity-bar');
      bar.style.width = (s.severity * 10) + '%';
      bar.style.background = scol;

      // Location preview chips (max 3)
      const tagEl = node.querySelector('.si-location-tags');
      tagEl.innerHTML = '';
      (s.locations || []).slice(0, 3).forEach(function(l){
        const chip = document.createElement('span');
        chip.className = 'mtag teal';
        chip.textContent = l;
        tagEl.appendChild(chip);
      });

      // Full locations in body
      const locsEl = node.querySelector('.si-locations-full');
      locsEl.innerHTML = '';
      if(s.locations && s.locations.length){
        const label = document.createElement('span');
        label.className = 'flabel';
        label.textContent = 'Location: ';
        locsEl.appendChild(label);
        s.locations.forEach(function(l){
          const chip = document.createElement('span');
          chip.className = 'mtag teal';
          chip.textContent = l;
          locsEl.appendChild(chip);
        });
        locsEl.style.margin = '10px 0 4px';
      }

      const notesEl = node.querySelector('.si-notes');
      if(s.notes){ HQRenderer.setText(notesEl, null, s.notes); notesEl.style.display=''; }
      else { notesEl.style.display = 'none'; }

      node.querySelector('[data-action="delete"]').onclick = function(){
        delEntry('symptoms', s.id, function(){ renderSymHist(); renderSymCats(); });
      };
    }
  });
}

// ═════════════════════════════════════════════
// OVERVIEW
// ═════════════════════════════════════════════
function renderOverview(){
  document.getElementById('ov-periods').textContent=HD.periods.length;
  document.getElementById('ov-headaches').textContent=HD.headaches.length;
  document.getElementById('ov-sleep').textContent=HD.sleep.length;
  document.getElementById('ov-symptoms').textContent=HD.symptoms.length;
  const last14=[];for(let i=13;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);last14.push(d.toISOString().split('T')[0]);}
  const sleepByDay=last14.map(ds=>{const s=HD.sleep.find(x=>x.date===ds);return s?.quality||null;});
  dc('ov-ch-sleep',new Chart(document.getElementById('ov-ch-sleep'),{type:'line',data:{labels:last14.map(d=>fmtShort(d)),datasets:[{data:sleepByDay,borderColor:'#a78bfa',backgroundColor:'rgba(167,139,250,.1)',fill:true,tension:.4,pointBackgroundColor:'#a78bfa',pointRadius:4,spanGaps:true}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:axT(),y:{...axT(),min:0,max:5}}}}));
  const haRecent=[...HD.headaches].sort((a,b)=>new Date(a.date)-new Date(b.date)).slice(-14);
  dc('ov-ch-ha',new Chart(document.getElementById('ov-ch-ha'),{type:'bar',data:{labels:haRecent.map(h=>fmtShort(h.date)),datasets:[{data:haRecent.map(h=>h.intensity),backgroundColor:haRecent.map(h=>h.intensity<=3?'rgba(6,214,160,.6)':h.intensity<=6?'rgba(255,209,102,.6)':'rgba(239,71,111,.6)'),borderRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:axT(),y:{...axT(),min:0,max:10}}}}));
 const all=[...HD.periods.map(p=>({type:'period',icon:'🩸',date:p.startDate,title:'Period started',sub:p.pms.length?p.pms.slice(0,3).join(', '):''})),...HD.headaches.map(h=>({type:'ha',icon:'🧠',date:h.date,title:(h.type||'Headache')+' — '+h.intensity+'/10',sub:h.triggers.slice(0,2).join(', ')})),...HD.sleep.map(s=>({type:'sl',icon:'😴',date:s.date,title:'Sleep — '+(s.hours||'?')+'hrs, quality '+(s.quality||'?')+'/5',sub:''})),...HD.symptoms.map(s=>({type:'sy',icon:s.categoryEmoji||'🩺',date:s.date,title:s.name+' ('+s.categoryName+')',sub:'Severity '+s.severity+'/10'}))].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,12);
  const re=document.getElementById('ov-recent');
  re.innerHTML=all.length?all.map(e=>`<div style="display:flex;gap:11px;padding:9px 0;border-bottom:1px solid var(--border);align-items:center"><span style="font-size:20px">${e.icon}</span><div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:600">${esc(e.title)}</div>${e.sub?`<div style="font-size:11px;color:var(--muted)">${esc(e.sub)}</div>`:''}</div><div style="font-size:11px;color:var(--muted);flex-shrink:0">${fmtShort(e.date)}</div></div>`).join(''):'<div class="empty"><div class="empty-ic">📋</div>No entries yet. Start logging!</div>';
}

// ═════════════════════════════════════════════
// TRENDS
// ═════════════════════════════════════════════
function renderTrends(){
  const allDates=[...HD.sleep.map(s=>s.date),...HD.headaches.map(h=>h.date),...HD.symptoms.map(s=>s.date),...HD.periods.map(p=>p.startDate)].filter(Boolean);
  const mn=thisMonthStr();
  const haMonth=HD.headaches.filter(h=>h.date&&h.date.startsWith(mn)).length;
  const avgHrs=HD.sleep.length?(HD.sleep.reduce((a,s)=>a+(s.hours||0),0)/HD.sleep.length).toFixed(1):'—';
  const trigMap={};HD.headaches.forEach(h=>h.triggers.forEach(t=>{trigMap[t]=(trigMap[t]||0)+1;}));
  const topTrig=Object.entries(trigMap).sort((a,b)=>b[1]-a[1])[0];
  document.getElementById('tr-days').textContent=[...new Set(allDates)].length;
  document.getElementById('tr-ha-month').textContent=haMonth;
  document.getElementById('tr-sleep-avg').textContent=avgHrs+(avgHrs!=='—'?' hrs':'');
  document.getElementById('tr-top-trig').textContent=topTrig?topTrig[0].replace(/^\S+\s*/,'').slice(0,10):'—';
  const d30=[],hrs30=[],q30=[];
  for(let i=29;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const ds=d.toISOString().split('T')[0];d30.push(fmtShort(ds));const s=HD.sleep.find(x=>x.date===ds);hrs30.push(s?.hours||null);q30.push(s?.quality||null);}
  dc('tr-sleep-hrs',new Chart(document.getElementById('tr-sleep-hrs'),{type:'bar',data:{labels:d30,datasets:[{data:hrs30,backgroundColor:'rgba(167,139,250,.5)',borderColor:'#a78bfa',borderWidth:1,borderRadius:3}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:axT2(),y:{...axT(),min:0}}}}));
  dc('tr-sleep-q',new Chart(document.getElementById('tr-sleep-q'),{type:'line',data:{labels:d30,datasets:[{data:q30,borderColor:'#a78bfa',backgroundColor:'rgba(167,139,250,.1)',fill:true,tension:.4,pointRadius:3,spanGaps:true}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:axT2(),y:{...axT(),min:0,max:5}}}}));
  const weeks=[],haCounts=[];
  for(let i=11;i>=0;i--){const wEnd=new Date();wEnd.setDate(wEnd.getDate()-i*7);const wStart=new Date(wEnd);wStart.setDate(wStart.getDate()-6);const wS=wStart.toISOString().split('T')[0],wE=wEnd.toISOString().split('T')[0];weeks.push('Wk '+(12-i));haCounts.push(HD.headaches.filter(h=>h.date>=wS&&h.date<=wE).length);}
  dc('tr-ha-freq',new Chart(document.getElementById('tr-ha-freq'),{type:'bar',data:{labels:weeks,datasets:[{data:haCounts,backgroundColor:'rgba(239,71,111,.5)',borderColor:'#ef476f',borderWidth:1,borderRadius:3}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:axT(),y:{...axT(),min:0,ticks:{stepSize:1}}}}}));
  const haSort=[...HD.headaches].sort((a,b)=>new Date(a.date)-new Date(b.date));
  dc('tr-ha-int',new Chart(document.getElementById('tr-ha-int'),{type:'line',data:{labels:haSort.map(h=>fmtShort(h.date)),datasets:[{data:haSort.map(h=>h.intensity),borderColor:'#ef476f',backgroundColor:'rgba(239,71,111,.08)',fill:true,tension:.3,pointBackgroundColor:haSort.map(h=>h.intensity<=3?'#06d6a0':h.intensity<=6?'#ffd166':'#ef476f'),pointRadius:5}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:axT(),y:{...axT(),min:0,max:10}}}}));
  const trigE=Object.entries(trigMap).sort((a,b)=>b[1]-a[1]).slice(0,8);
  dc('tr-triggers',new Chart(document.getElementById('tr-triggers'),{type:'bar',data:{labels:trigE.map(([t])=>t.replace(/^\S+\s*/,'')),datasets:[{data:trigE.map(([,n])=>n),backgroundColor:'rgba(253,126,20,.6)',borderColor:'#fd7e14',borderWidth:1,borderRadius:3}]},options:{responsive:true,maintainAspectRatio:false,indexAxis:'y',plugins:{legend:{display:false}},scales:{x:axT(),y:axT()}}}));
  const typeMap={};HD.headaches.forEach(h=>{if(h.type)typeMap[h.type]=(typeMap[h.type]||0)+1;});
  const typeE=Object.entries(typeMap);
  dc('tr-ha-types',new Chart(document.getElementById('tr-ha-types'),{type:'doughnut',data:{labels:typeE.map(([t])=>t.replace(/^\S+\s*/,'')),datasets:[{data:typeE.map(([,n])=>n),backgroundColor:['#ef476f','#fd7e14','#a78bfa','#4ecdc4','#ffd166'],borderColor:'#1a1a35',borderWidth:2}]},options:{responsive:true,maintainAspectRatio:false,cutout:'55%',plugins:{legend:{labels:{color:'#a0a0cc',font:{size:11},boxWidth:12}}}}}));
  const catMap={};HD.symptoms.forEach(s=>{const k=(s.categoryEmoji||'')+(s.categoryName||'?');catMap[k]=(catMap[k]||0)+1;});
  const catE=Object.entries(catMap).sort((a,b)=>b[1]-a[1]);
  dc('tr-sym-cats',new Chart(document.getElementById('tr-sym-cats'),{type:'bar',data:{labels:catE.map(([k])=>k),datasets:[{data:catE.map(([,n])=>n),backgroundColor:'rgba(78,205,196,.6)',borderColor:'#4ecdc4',borderWidth:1,borderRadius:3}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:axT(),y:{...axT(),min:0,ticks:{stepSize:1}}}}}));
  const pSort=[...HD.periods].sort((a,b)=>new Date(a.startDate)-new Date(b.startDate));
  const cycleLens=[],cycleLabels=[];
  for(let i=1;i<pSort.length;i++){const d=daysBetween(pSort[i-1].startDate,pSort[i].startDate);if(d>14&&d<60){cycleLens.push(d);cycleLabels.push(fmtShort(pSort[i].startDate));}}
  dc('tr-cycle',new Chart(document.getElementById('tr-cycle'),{type:'line',data:{labels:cycleLabels,datasets:[{label:'Cycle Length (days)',data:cycleLens,borderColor:'#ff6b9d',backgroundColor:'rgba(255,107,157,.1)',fill:true,tension:.3,pointRadius:5,pointBackgroundColor:'#ff6b9d'},{label:'28-day avg',data:cycleLens.map(()=>28),borderColor:'rgba(255,107,157,.3)',borderDash:[4,4],pointRadius:0}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:'#a0a0cc',font:{size:11},boxWidth:12}}},scales:{x:axT(),y:{...axT(),min:20,max:40}}}}));
}

// CHART HELPERS
function axT(){return{ticks:{color:'#666699',font:{size:10},maxTicksLimit:8},grid:{color:'rgba(50,50,90,.5)'},border:{display:false}};}
function axT2(){return{ticks:{color:'#666699',font:{size:10},maxTicksLimit:8,maxRotation:0},grid:{color:'rgba(50,50,90,.5)'},border:{display:false}};}
function dc(id,inst){if(charts[id])charts[id].destroy();charts[id]=inst;}

// ═════════════════════════════════════════════
// CLEAR FORMS
// ═════════════════════════════════════════════
function clearForm(prefix){
  if(prefix==='p'){document.getElementById('p-start').value='';document.getElementById('p-end').value='';clearChips('p-pms');document.getElementById('p-notes').value='';pFlow=0;document.querySelectorAll('.flow-btn[data-f]').forEach(b=>b.classList.remove('on'));pEditId=null;document.getElementById('p-form-lbl').textContent='🩸 Log Period';}
  else if(prefix==='ha'){document.getElementById('ha-type').value='';document.getElementById('ha-date').value=todayStr();document.getElementById('ha-start').value='';document.getElementById('ha-end').value='';document.getElementById('ha-dur').value='';document.getElementById('ha-int').value='5';updInt(5);setAura(false);clearChips('ha-triggers');clearChips('ha-meds');clearChips('ha-relief');clearChips('aura-syms');document.getElementById('ha-trig-extra').innerHTML='';document.getElementById('ha-med-extra').innerHTML='';clearLocs('ha');document.getElementById('ha-notes').value='';haEditId=null;document.getElementById('ha-form-lbl').textContent='🧠 Log Headache';}
  else if(prefix==='sl'){document.getElementById('sl-date').value=todayStr();document.getElementById('sl-bed').value='';document.getElementById('sl-wake').value='';document.getElementById('sl-hrs').value='';slQ=0;document.querySelectorAll('#tab-sleep .chip.on').forEach(b=>b.classList.remove('on'));document.querySelectorAll('#sl-quality-g .rb.on').forEach(b=>b.classList.remove('on'));document.getElementById('sl-notes').value='';slEditId=null;document.getElementById('sl-form-lbl').textContent='😴 Log Sleep';}
  else if(prefix==='sy'){document.getElementById('sy-date').value=todayStr();document.getElementById('sy-time').value='';document.getElementById('sy-name').value='';document.getElementById('sy-sev').value='5';updSev(5);clearLocs('sy');document.getElementById('sy-notes').value='';syEditId=null;selCat='';renderSymCats();document.getElementById('sy-form-lbl').textContent='🩺 Log Symptom';document.getElementById('sy-form-card').style.display='none';}
}

// ═════════════════════════════════════════════
// DREAMS TAB
// ═════════════════════════════════════════════
let drQ=0, drEditId=null;
function setDQ(n){drQ=n;document.querySelectorAll('#dr-quality-g .btn-sm-r').forEach((b,i)=>b.classList.toggle('on',i+1===n));}
function clearDreamForm(){document.getElementById('dr-date').value=todayStr();document.getElementById('dr-note').value='';drQ=0;drEditId=null;document.querySelectorAll('#dr-quality-g .btn-sm-r').forEach(b=>b.classList.remove('on'));document.querySelectorAll('#dr-emotions .chip.on').forEach(b=>b.classList.remove('on'));document.getElementById('dr-form-lbl').textContent='🌙 Log Dream / Sleep Note';}
function saveDream(){
  const date=document.getElementById('dr-date').value;
  if(!date){HQToast.warn('Please enter a date.');return;}
  const emotions=[...document.querySelectorAll('#dr-emotions .chip.on')].map(b=>b.textContent.trim());
  const entry={id:drEditId||uid(),date,quality:drQ||null,note:document.getElementById('dr-note').value.trim(),emotions,saved:new Date().toISOString()};
  if(!HD.dreams)HD.dreams=[];
  if(drEditId){const i=HD.dreams.findIndex(d=>d.id===drEditId);if(i!==-1)HD.dreams[i]=entry;else HD.dreams.push(entry);}else HD.dreams.unshift(entry);
  save();clearDreamForm();renderDreamsTab();toast('🌙 Dream logged!');
}
function renderDreamsTab(){
  if(!HD.dreams)HD.dreams=[];
  const dreams=HD.dreams;
  document.getElementById('dr-total').textContent=dreams.length;
  document.getElementById('dr-hist-count').textContent=dreams.length+' entr'+(dreams.length===1?'y':'ies');
  const qs=dreams.filter(d=>d.quality).map(d=>d.quality);
  document.getElementById('dr-avgq').textContent=qs.length?(qs.reduce((a,b)=>a+b)/qs.length).toFixed(1):'—';
  let streak=0;
  for(let i=0;i<60;i++){const d=new Date();d.setDate(d.getDate()-i);const ds=d.toISOString().split('T')[0];if(dreams.find(x=>x.date===ds)){streak++;}else if(i>0)break;}
  document.getElementById('dr-streak').textContent=streak;
  const el=document.getElementById('dr-list');
  if(!dreams.length){el.innerHTML='<div class="empty"><div class="empty-ic">🌙</div>No dreams logged yet.</div>';return;}
  const MOOD_ICONS={Joyful:'😊',Fearful:'😨',Sad:'😔',Peaceful:'😌',Anxious:'😰',Angry:'😤',Excited:'🤩',Confused:'😕',Numb:'😶',Loved:'💜'};
  el.innerHTML=[...dreams].sort((a,b)=>b.date.localeCompare(a.date)).map(d=>{
    const emoHtml=(d.emotions||[]).map(e=>`<span title="${e}">${MOOD_ICONS[e.replace(/^[^ ]+ /,'')]||e.split(' ')[0]}</span>`).join('');
    const qStars=d.quality?'⭐'.repeat(d.quality):'';
    return`<div class="dream-entry" id="de-${d.id}" onclick="this.classList.toggle('open-de')"><div class="de-hd"><div class="de-icon">🌙</div><div class="de-info"><div class="de-title">${fmtDate(d.date)} ${qStars}</div><div class="de-meta">${d.quality?`<span>Quality: ${d.quality}/5</span>`:''}${emoHtml?`<span>${emoHtml}</span>`:''} ${d.note?'<span style="color:var(--muted)">Has note ▼</span>':'<span style="color:var(--muted)">No note</span>'}</div></div><div style="display:flex;gap:5px"><button style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:12px;padding:2px 4px" onclick="event.stopPropagation();deleteDream('${d.id}')">🗑️</button></div></div>${d.note?`<div class="de-body"><div class="de-note">${esc(d.note)}</div></div>`:''}</div>`;
  }).join('');
}
async function deleteDream(id){if(!(await HQConfirm.ask('Delete this dream entry?', {danger:true})))return;HD.dreams=(HD.dreams||[]).filter(d=>d.id!==id);save();renderDreamsTab();toast('🗑️ Deleted');}

// ═════════════════════════════════════════════
// CHECK-INS TAB
// ═════════════════════════════════════════════
function renderCheckInsTab(){
  let cis=[];
  try{
    // Prefer the migrated key; fall back to legacy key for users who haven't opened checkin.html yet
    const _ciRaw=HQSafe.store.get(HQKeys.CHECKIN_LOG)||HQSafe.store.get(HQKeys.CHECKIN);
    if(Array.isArray(_ciRaw))cis=_ciRaw;
  }catch(e){}
  cis=[...cis].sort((a,b)=>b.date.localeCompare(a.date));
  const MOOD_EM=['','😭','😔','😐','🙂','🤩'];
  const MOOD_LBL=['','Very Low','Low','Okay','Good','Great'];
  const ENRG_EM=['','🪫','😴','😐','😊','🚀'];
  const ENRG_LBL=['','Empty','Low','Okay','Good','High'];
  const today=new Date().toISOString().split('T')[0];
  document.getElementById('ci-total').textContent=cis.length;
  const moods=cis.filter(c=>c.mood).map(c=>c.mood);
  const enrgs=cis.filter(c=>c.energy).map(c=>c.energy);
  document.getElementById('ci-avgmood').textContent=moods.length?(moods.reduce((a,b)=>a+b)/moods.length).toFixed(1):'—';
  document.getElementById('ci-avgenergy').textContent=enrgs.length?(enrgs.reduce((a,b)=>a+b)/enrgs.length).toFixed(1):'—';
  let streak=0;for(let i=0;i<90;i++){const d=new Date();d.setDate(d.getDate()-i);const ds=d.toISOString().split('T')[0];if(cis.find(c=>c.date===ds)){streak++;}else if(i>0)break;}
  document.getElementById('ci-streak').textContent=streak;
  const moodDots=document.getElementById('ci-mood-dots');
  const energyDots=document.getElementById('ci-energy-dots');
  let mHtml='',eHtml='';
  for(let i=13;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const ds=d.toISOString().split('T')[0];const ci=cis.find(c=>c.date===ds);const isToday=ds===today;const dayLbl=new Date(ds+'T12:00:00').toLocaleDateString('en-US',{weekday:'short',day:'numeric'});mHtml+=`<div class="tdot" style="${isToday?'border-color:var(--purple)':''}" title="${dayLbl}">${ci&&ci.mood?MOOD_EM[ci.mood]:'·'}</div>`;eHtml+=`<div class="tdot" style="${isToday?'border-color:var(--purple)':''}" title="${dayLbl}">${ci&&ci.energy?ENRG_EM[ci.energy]:'·'}</div>`;}
  moodDots.innerHTML=mHtml;energyDots.innerHTML=eHtml;
  const el=document.getElementById('ci-list');
  if(!cis.length){el.innerHTML='<div class="empty"><div class="empty-ic">⚡</div>No check-ins yet. Use <a href="checkin.html" style="color:var(--teal);font-weight:700">Check-In</a> to start.</div>';return;}
  el.innerHTML=cis.slice(0,20).map(c=>{
    const isToday=c.date===today;const dateStr=isToday?'Today':fmtDate(c.date);
    return`<div class="ci-entry"><div class="ci-moods">${c.mood?MOOD_EM[c.mood]:'—'}${c.energy?ENRG_EM[c.energy]:''}</div><div class="ci-info"><div class="ci-date">${dateStr}${isToday?` <span style="font-size:9px;background:rgba(155,109,255,.15);color:var(--purple);border-radius:4px;padding:1px 5px;font-weight:700">Today</span>`:''}</div><div class="ci-meta">${c.mood?`<span>Mood: ${MOOD_LBL[c.mood]}</span>`:''} ${c.energy?`<span>⚡ Energy: ${ENRG_LBL[c.energy]}</span>`:''} ${c.sleepHrs?`<span>😴 ${c.sleepHrs}hrs${c.sleepQ?' Q'+c.sleepQ:''}</span>`:''} ${(c.bodyTags||[]).length?`<span>🩺 ${c.bodyTags.slice(0,3).join(', ')}</span>`:''}</div>${c.note?`<div class="ci-note">${esc(c.note.slice(0,100))}${c.note.length>100?'…':''}</div>`:''}</div></div>`;
  }).join('');
}

// ═════════════════════════════════════════════
// UTILS
// ═════════════════════════════════════════════
function togH(id){document.getElementById(id).classList.toggle('open');}
const todayStr = () => (window.HQDate ? HQDate.today() : new Date().toISOString().split('T')[0]); // aliased → HQDate.today
function thisMonthStr(){const n=new Date();return`${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}`;}
function fmtDate(s){if(!s)return'';return new Date(s+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});}
function fmtShort(s){if(!s)return'';return new Date(s+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'});}
function daysBetween(a,b){return Math.round((new Date(b+'T12:00:00')-new Date(a+'T12:00:00'))/(1000*60*60*24));}
function addDays(ds,n){const d=new Date(ds+'T12:00:00');d.setDate(d.getDate()+n);return d.toISOString().split('T')[0];}
const esc = s => HQUtils.esc(s); // → HQUtils.esc
function findChipByText(gid,text){return[...document.querySelectorAll('#'+gid+' .chip')].find(b=>b.textContent.trim()===text)||null;}
function scrollTop(){window.scrollTo({top:0,behavior:'smooth'});}
const uid = () => HQUtils.uid(); // → HQUtils.uid
function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2300);}
async function delEntry(store,id,cb){if(!(await HQConfirm.ask('Delete this entry?', {danger:true})))return;HD[store]=HD[store].filter(x=>x.id!==id);save();if(cb)cb();toast('🗑️ Deleted');}

// ═════════════════════════════════════════════
// INIT
// ═════════════════════════════════════════════
load();
initCal();
buildLocPicker('ha-locs-wrap','ha');
buildLocPicker('sy-locs-wrap','sy');
updInt(5);updSev(5);
document.getElementById('ha-date').value=todayStr();
document.getElementById('sl-date').value=todayStr();
document.getElementById('sy-date').value=todayStr();
document.getElementById('dr-date').value=todayStr();
renderOverview();
renderSymCats();

// FIX-05: AbortController for module-scope window listeners
const _htAC = new AbortController();
const _htSig = { signal: _htAC.signal };

// P3: Re-render when config changes (profile, tags, reminder config updated from Customize)
window.addEventListener('hq-config-updated', function() {
  renderOverview();
}, _htSig);

// Phase 8: Re-render when a check-in is saved (cross-tab via HQBus BroadcastChannel)
// routeToHealth() in checkin.js has already written the new data to audhd-hq-health
// by the time this fires, so we only need to reload HD and refresh visible views.
function _onCheckinSaved() {
  try {
    load(); // re-read audhd-hq-health from localStorage
    // Refresh whichever tab is currently visible
    var activeEl = document.querySelector('.tab.active');
    var activeId = activeEl ? activeEl.id.replace('tab-', '') : 'overview';
    if(activeId === 'overview')  { renderOverview(); return; }
    if(activeId === 'checkins')  { renderCheckInsTab(); return; }
    if(activeId === 'meds')      { if(typeof renderMedsTab === 'function') renderMedsTab(); return; }
    if(activeId === 'sleep')     { renderSleepHist(); updateSleepStats(); return; }
    if(activeId === 'symptoms')  { renderSymCats(); renderSymHist(); return; }
  } catch(e) { console.warn('health-tracker checkin-saved refresh failed', e); }
}
HQSafe.bus.on('checkin-saved', _onCheckinSaved);
window.addEventListener('hq-checkin-saved', _onCheckinSaved, _htSig);
updateHeader();
setAura(false);
// FIX-04/FIX-08: Clear intervals and abort listeners on page unload
window.addEventListener('pagehide', function() {
  if (_htAC) { _htAC.abort(); }
}, {once: true});
// FIX-08
if (window.HQLifecycle) HQLifecycle.register(function() { if (_htAC) _htAC.abort(); });



// ── ENERGY TAB ──────────────────────────────────────────
function renderEnergyTab(){
  try{
    var es=HQSafe.store.get(HQKeys.ENERGY_STATE, null);
    var nowEl=document.getElementById('ht-energy-now');
    var tsEl=document.getElementById('ht-energy-ts');
    var lvl=es&&es.level?es.level:null;
    var lvlStyles={
      low:'background:rgba(255,107,107,.1);color:var(--red,#ff6b6b);border:1px solid rgba(255,107,107,.3)',
      medium:'background:rgba(244,202,0,.1);color:var(--gold,#f4ca00);border:1px solid rgba(244,202,0,.3)',
      high:'background:rgba(6,214,160,.1);color:var(--green);border:1px solid rgba(6,214,160,.3)',
    };
    var emo={low:'🔴',medium:'🟡',high:'🟢'};
    if(nowEl){
      if(lvl){nowEl.innerHTML='<span style="display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:8px;font-weight:800;'+lvlStyles[lvl]+'">'+emo[lvl]+' '+lvl+' energy</span>';}
      else{nowEl.textContent='No energy state recorded — log from Check-In.';}
    }
    if(tsEl&&es&&es.ts)tsEl.textContent='Last updated '+new Date(es.ts).toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
  }catch(e){}
  try{
    var db=HQSafe.store.get(HQKeys.HEALTH, {});
    var log=db.energyLog||[];
    var now=Date.now();
    var recent=log.filter(function(e){return now-e.ts<30*24*60*60*1000;});
    var counts={low:0,medium:0,high:0};
    recent.forEach(function(e){if(counts[e.level]!=null)counts[e.level]++;});
    var total=recent.length||1;
    var distEl=document.getElementById('ht-energy-dist');
    if(distEl){
      var styles={
        low:'background:rgba(255,107,107,.1);color:var(--red,#ff6b6b);border:1px solid rgba(255,107,107,.3)',
        medium:'background:rgba(244,202,0,.1);color:var(--gold,#f4ca00);border:1px solid rgba(244,202,0,.3)',
        high:'background:rgba(6,214,160,.1);color:var(--green);border:1px solid rgba(6,214,160,.3)',
      };
      distEl.innerHTML=Object.entries(counts).map(function(kv){
        return '<div style="display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 14px;border-radius:10px;'+styles[kv[0]]+'">'
          +'<div style="font-size:20px;font-weight:900">'+kv[1]+'</div>'
          +'<div style="font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.06em">'+kv[0]+'</div>'
          +'<div style="font-size:10px;opacity:.8">'+Math.round(kv[1]/total*100)+'%</div>'
          +'</div>';
      }).join('');
    }
    var ovE=document.getElementById('ov-energy');
    if(ovE)ovE.textContent=recent.length;
    var listEl=document.getElementById('ht-energy-log-list');
    var countEl=document.getElementById('ht-energy-log-count');
    if(countEl)countEl.textContent=log.length+' entries';
    if(listEl){
      if(!log.length){
        listEl.innerHTML='<div style="text-align:center;padding:20px;color:var(--muted);font-size:12px">No energy logs yet.</div>';
      }else{
        var clr={low:'var(--red,#ff6b6b)',medium:'var(--gold,#f4ca00)',high:'var(--green)'};
        listEl.innerHTML=log.slice(0,40).map(function(e){
          return '<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border);font-size:11.5px">'
            +'<span style="font-size:14px">'+(e.level==='low'?'🔴':e.level==='medium'?'🟡':'🟢')+'</span>'
            +'<span style="font-weight:700;color:'+(clr[e.level]||'var(--text2)')+'">'+e.level+'</span>'
            +'<span style="color:var(--muted);font-size:10px;margin-left:auto">'+(e.source||'checkin')+'</span>'
            +'<span style="color:var(--muted);font-size:10px">'+new Date(e.ts).toLocaleDateString('en-US',{month:'short',day:'numeric'})+'</span>'
            +'</div>';
        }).join('');
      }
    }
  }catch(e){}
}

// ════ MEDICATION TRACKER ════
var MED_STORE = HQKeys.MEDS;
var MED_LOG_STORE = HQKeys.MED_LOG;
function loadMeds(){try{return HQSafe.store.get(MED_STORE, []);}catch(e){return[];}}
function saveMeds(m){HQSafe.store.set(MED_STORE, m);}
function getTodayLog(){var td=new Date().toISOString().split('T')[0];try{var a=HQSafe.store.get(MED_LOG_STORE, {});return a[td]||{};}catch(e){return{};}}
function setTodayLog(log){var td=new Date().toISOString().split('T')[0];try{var a=HQSafe.store.get(MED_LOG_STORE, {});a[td]=log;var keys=Object.keys(a).sort().slice(-90);var t={};keys.forEach(function(k){t[k]=a[k];});HQSafe.store.set(MED_LOG_STORE, t);}catch(e){}}
// C10-01: htEsc aliased → esc (HQUtils.esc chain already defined above)
const htEsc = esc;

// C10-01: renderMedsTab — migrated from innerHTML to HQRenderer.list()
function renderMedsTab(){
  var meds=loadMeds(),log=getTodayLog();
  var takenCount=meds.filter(function(m){return log[m.id];}).length;
  var refillSoon=meds.filter(function(m){
    if(!m.refill)return false;
    var days=Math.ceil((new Date(m.refill+'T12:00:00')-Date.now())/86400000);
    return days>=0&&days<=14;
  }).length;
  var el=document.getElementById('med-total');if(el)el.textContent=meds.length;
  var ta=document.getElementById('med-taken');if(ta)ta.textContent=takenCount;
  var rs=document.getElementById('med-refill-soon');if(rs)rs.textContent=refillSoon;
  var listEl=document.getElementById('med-list');if(!listEl)return;

  if(!meds.length){
    listEl.innerHTML='<div class="empty"><div class="empty-ic">💊</div>No medications yet. Add one below.</div>';
    return;
  }

  HQRenderer.list(listEl, meds, {
    key: function(m){ return m.id; },
    template: 'ht-med-item-template',
    render: function(el, m){
      var takenNow = !!log[m.id];
      var dtr = m.refill ? Math.ceil((new Date(m.refill+'T12:00:00')-Date.now())/86400000) : null;
      var warn = dtr !== null && dtr <= 14;

      el.id = 'medcard-' + m.id;

      // Toggle expand on header click
      el.querySelector('.med-hd').onclick = function(){
        el.classList.toggle('open');
      };

      HQRenderer.setText(el, '.mi-name', m.name);
      HQRenderer.setText(el, '.mi-dose', m.dose ? m.dose : '');
      el.querySelector('.mi-dose').style.display = m.dose ? '' : 'none';

      var metaTime = el.querySelector('.mi-time');
      HQRenderer.setText(metaTime, null, m.time ? '⏰ ' + m.time + ' · ' : '');
      var metaDoc = el.querySelector('.mi-doctor');
      HQRenderer.setText(metaDoc, null, m.doctor ? 'Dr. ' + m.doctor : '');
      var warnEl = el.querySelector('.mi-refill-warn');
      if(warn){ HQRenderer.setText(warnEl, null, 'Refill in '+dtr+'d'); warnEl.style.display=''; }
      else { warnEl.style.display='none'; }

      var takenBtn = el.querySelector('[data-action="taken"]');
      takenBtn.className = 'med-taken-btn ' + (takenNow ? 'taken' : 'not-taken');
      takenBtn.textContent = takenNow ? '✅ Taken' : '○ Mark taken';
      takenBtn.onclick = function(e){ e.stopPropagation(); toggleMedTaken(m.id); };

      var notesEl = el.querySelector('.mi-notes');
      if(m.notes){ HQRenderer.setText(notesEl, null, m.notes); notesEl.style.display=''; }
      else{ notesEl.style.display='none'; }

      var refillEl = el.querySelector('.mi-refill-date');
      if(m.refill){ HQRenderer.setText(refillEl, null, '📅 Refill: '+m.refill); refillEl.style.display=''; }
      else{ refillEl.style.display='none'; }

      el.querySelector('[data-action="edit"]').onclick = function(){ openEditMed(m.id); };
      el.querySelector('[data-action="delete"]').onclick = function(){ deleteMed(m.id); };
    }
  });
}

function toggleMedTaken(id){var log=getTodayLog();log[id]=!log[id];setTodayLog(log);renderMedsTab();showToast(log[id]?'✅ Taken!':'○ Unmarked');}

function openAddMed(){
  document.getElementById('med-edit-id').value='';
  document.getElementById('med-modal-title').textContent='💊 Add Medication';
  ['med-name','med-dose','med-time','med-doctor','med-refill','med-notes'].forEach(function(id){var el=document.getElementById(id);if(el)el.value='';});
  HQModal.open('med-modal'); // H-06
}
function openEditMed(id){
  var meds=loadMeds(),m=meds.find(function(x){return x.id===id;});if(!m)return;
  document.getElementById('med-edit-id').value=id;
  document.getElementById('med-modal-title').textContent='✏️ Edit Medication';
  document.getElementById('med-name').value=m.name||'';
  document.getElementById('med-dose').value=m.dose||'';
  document.getElementById('med-time').value=m.time||'';
  document.getElementById('med-doctor').value=m.doctor||'';
  document.getElementById('med-refill').value=m.refill||'';
  document.getElementById('med-notes').value=m.notes||'';
  HQModal.open('med-modal'); // H-06
}
function closeMedModal(){HQModal.close('med-modal');} // H-06
function saveMed(){
  var name=document.getElementById('med-name').value.trim();
  if(!name){showToast('⚠️ Name required');return;}
  var id=document.getElementById('med-edit-id').value||('med-'+Date.now());
  var meds=loadMeds();
  var entry={id:id,name:name,dose:document.getElementById('med-dose').value.trim(),time:document.getElementById('med-time').value,doctor:document.getElementById('med-doctor').value.trim(),refill:document.getElementById('med-refill').value,notes:document.getElementById('med-notes').value.trim()};
  var idx=meds.findIndex(function(m){return m.id===id;});
  if(idx>=0)meds[idx]=entry;else meds.push(entry);
  saveMeds(meds);closeMedModal();renderMedsTab();showToast('💊 Saved!');
}
async function deleteMed(id){if(!(await HQConfirm.ask('Delete this medication?', {danger:true})))return;var meds=loadMeds().filter(function(m){return m.id!==id;});saveMeds(meds);renderMedsTab();showToast('🗑 Deleted');}

// ════ DOCTOR PREP ════
var DR_STORE=HQKeys.DOCTOR_PREP;
function loadDoctorPrep(){
  try{
    var all=HQSafe.store.get(DR_STORE, []);
    if(!all.length){showToast('No saved notes yet');return;}
    var p=all[0];
    document.getElementById('dr-doctor').value=p.doctor||'';
    document.getElementById('appt-date').value=p.date||'';
    document.getElementById('dr-reason').value=p.reason||'';
    document.getElementById('dr-symptoms').value=p.symptoms||'';
    document.getElementById('dr-questions').value=p.questions||'';
    document.getElementById('dr-meds-extra').value=p.medsExtra||'';
    document.getElementById('dr-worry').value=p.worry||'';
    showToast('📋 Last notes loaded');
  }catch(e){showToast('❌ Could not load');}
}
function saveDoctorPrep(){
  var entry={doctor:document.getElementById('dr-doctor').value.trim(),date:document.getElementById('appt-date').value,reason:document.getElementById('dr-reason').value.trim(),symptoms:document.getElementById('dr-symptoms').value.trim(),questions:document.getElementById('dr-questions').value.trim(),medsExtra:document.getElementById('dr-meds-extra').value.trim(),worry:document.getElementById('dr-worry').value.trim(),savedAt:new Date().toISOString()};
  try{var all=HQSafe.store.get(DR_STORE, []);all.unshift(entry);if(all.length>20)all=all.slice(0,20);HQSafe.store.set(DR_STORE, all);renderDrPastList();showToast('💾 Saved!');}catch(e){showToast('❌ Save failed');}
}
function renderDrPastList(){
  var el=document.getElementById('dr-past-list');if(!el)return;
  try{
    var all=HQSafe.store.get(DR_STORE, []);
    if(!all.length){el.innerHTML='<div style="font-size:11px;color:var(--muted);font-style:italic">No past notes yet.</div>';return;}
    el.innerHTML=all.map(function(p){
      return '<div style="background:var(--card2);border:1.5px solid var(--border);border-radius:10px;padding:11px 13px;margin-bottom:8px;">'
        +'<div style="font-size:12px;font-weight:800;color:var(--text);margin-bottom:5px">'+htEsc(p.doctor||'Unknown')+(p.date?' · '+p.date:'')+'</div>'
        +(p.reason?'<div style="font-size:10px;color:var(--muted)">'+htEsc(p.reason)+'</div>':'')
        +'</div>';
    }).join('');
  }catch(e){}
}
function renderDoctorTab(){
  var meds=loadMeds(),el=document.getElementById('dr-meds-list');
  if(el){
    if(!meds.length){el.textContent='No medications logged yet.';}
    else{el.innerHTML=meds.map(function(m){return '<span style="display:inline-flex;align-items:center;gap:4px;padding:2px 9px;background:var(--surface);border:1px solid var(--border);border-radius:6px;font-size:11px;font-weight:700;color:var(--text2);margin:2px;">💊 '+htEsc(m.name)+(m.dose?' '+htEsc(m.dose):'')+'</span>';}).join('');}
  }
  renderDrPastList();
}

// ════ CRASH CHART ════
function renderCrashChart(){
  var canvas=document.getElementById('tr-crash');if(!canvas)return;
  var insightEl=document.getElementById('tr-crash-insight');
  var checkins=[];try{checkins=HQSafe.store.get(HQKeys.CHECKIN_LOG, []);}catch(e){}
  var labels=[],shutdownData=[],activityData=[];
  for(var i=29;i>=0;i--){
    var d=new Date();d.setDate(d.getDate()-i);
    var ds=d.toISOString().split('T')[0];
    labels.push(ds.slice(5));
    var dayCI=checkins.filter(function(c){return(c.date||((c.at||'').split('T')[0]))===ds;});
    var hasShutdown=dayCI.some(function(c){return(c.bodyTags||[]).some(function(t){return t.toLowerCase().indexOf('shutdown')>=0;})||(c.energy||0)<=1;});
    shutdownData.push(hasShutdown?1:0);
    var isHigh=dayCI.some(function(c){return(c.energy||0)>=4||(c.walkMiles||0)>5;});
    activityData.push(isHigh?1:0);
  }
  if(charts['tr-crash']){try{charts['tr-crash'].destroy();}catch(e){}}
  charts['tr-crash']=new Chart(canvas,{type:'bar',data:{labels:labels,datasets:[{label:'Shutdown',data:shutdownData,backgroundColor:'rgba(248,113,113,.7)',borderRadius:3},{label:'High activity',data:activityData.map(function(v,i){return shutdownData[i]?0:v;}),backgroundColor:'rgba(251,191,36,.5)',borderRadius:3}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{display:false},ticks:{color:'var(--muted)',font:{size:9},maxTicksLimit:10}},y:{display:false,min:0,max:1}}}});
  var boomBust=0;
  for(var j=1;j<30;j++){if(activityData[j-1]&&shutdownData[j])boomBust++;}
  if(insightEl){
    if(boomBust>=2){insightEl.style.display='block';insightEl.textContent='📊 Boom-bust pattern detected '+boomBust+' time'+(boomBust!==1?'s':'')+' in 30 days. Rest is part of your output, not failure.';}
    else if(checkins.length>=5){insightEl.style.display='block';insightEl.textContent='✅ No significant boom-bust pattern detected in the last 30 days.';}
    else{insightEl.style.display='none';}
  }
}


// ════ CORRELATION EXPLORER ════
function getCorrData(varName, byDate) {
  // byDate = {dateStr: value} — returns a map of date → value
  var result = {};
  var today = new Date().toISOString().split('T')[0];

  if (varName === 'sleep_hrs') {
    HD.sleep.forEach(function(s) { if(s.date && s.hours) result[s.date] = +s.hours; });
  } else if (varName === 'sleep_q') {
    HD.sleep.forEach(function(s) { if(s.date && s.quality) result[s.date] = +s.quality; });
  } else if (varName === 'ha_intensity') {
    HD.headaches.forEach(function(h) { if(h.date && h.intensity) result[h.date] = +h.intensity; });
  } else if (varName === 'mood' || varName === 'energy' || varName === 'anxiety' || varName === 'sensory') {
    // From check-in log
    var ciLog = [];
    try { ciLog = HQSafe.store.get(HQKeys.CHECKIN_LOG, []); } catch(e) {}
    ciLog.forEach(function(ci) {
      var d = ci.date || (ci.at||'').split('T')[0];
      if (!d) return;
      var val = ci[varName];
      if (val) result[d] = +val;
    });
    // Also check health log for sensory and anxiety
    if (varName === 'sensory' && HD.sensory) {
      HD.sensory.forEach(function(s) { if(s.date && s.level) result[s.date] = +s.level; });
    }
    if (varName === 'anxiety' && HD.anxietyLog) {
      HD.anxietyLog.forEach(function(a) { if(a.date && a.level) result[a.date] = +a.level; });
    }
  }
  return result;
}

function corrLabel(v) {
  return {sleep_hrs:'Sleep hrs',sleep_q:'Sleep quality',mood:'Mood',energy:'Energy',
          anxiety:'Anxiety',ha_intensity:'Headache intensity',sensory:'Sensory sensitivity'}[v] || v;
}

function renderCorrelation() {
  var xVar = document.getElementById('corr-x')?.value;
  var yVar = document.getElementById('corr-y')?.value;
  var chartEl = document.getElementById('corr-chart');
  var insightEl = document.getElementById('corr-insight');
  var emptyEl = document.getElementById('corr-empty');
  if (!chartEl) return;

  var xData = getCorrData(xVar);
  var yData = getCorrData(yVar);

  // Find dates that have both values
  var points = [];
  Object.keys(xData).forEach(function(d) {
    if (yData[d] !== undefined) {
      points.push({x: xData[d], y: yData[d], d: d});
    }
  });

  if (points.length < 4) {
    if (emptyEl) emptyEl.style.display = 'block';
    if (insightEl) insightEl.style.display = 'none';
    chartEl.style.display = 'none';
    return;
  }
  chartEl.style.display = '';
  if (emptyEl) emptyEl.style.display = 'none';

  // Destroy previous
  if (charts['corr']) { try { charts['corr'].destroy(); } catch(e) {} }

  charts['corr'] = new Chart(chartEl, {
    type: 'scatter',
    data: {
      datasets: [{
        label: corrLabel(xVar) + ' vs ' + corrLabel(yVar),
        data: points,
        backgroundColor: 'rgba(155,109,255,.55)',
        borderColor: 'rgba(155,109,255,.85)',
        pointRadius: 5,
        pointHoverRadius: 7,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(ctx) {
              return ctx.raw.d + ': ' + corrLabel(xVar) + '=' + ctx.raw.x + ', ' + corrLabel(yVar) + '=' + ctx.raw.y;
            }
          }
        }
      },
      scales: {
        x: { title: { display: true, text: corrLabel(xVar), color: '#888', font: { size: 10 } }, grid: { color: 'rgba(100,94,183,.15)' }, ticks: { color: '#888', font: { size: 10 } } },
        y: { title: { display: true, text: corrLabel(yVar), color: '#888', font: { size: 10 } }, grid: { color: 'rgba(100,94,183,.15)' }, ticks: { color: '#888', font: { size: 10 } } },
      }
    }
  });

  // Simple Pearson correlation for insight
  var n = points.length;
  var sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
  points.forEach(function(p) { sumX+=p.x; sumY+=p.y; sumXY+=p.x*p.y; sumX2+=p.x*p.x; sumY2+=p.y*p.y; });
  var denom = Math.sqrt((n*sumX2-sumX*sumX)*(n*sumY2-sumY*sumY));
  var r = denom ? (n*sumXY - sumX*sumY) / denom : 0;
  r = Math.round(r * 100) / 100;

  if (insightEl) {
    var strength = Math.abs(r) >= 0.6 ? 'strong' : Math.abs(r) >= 0.3 ? 'moderate' : 'weak';
    var direction = r > 0 ? 'positive' : 'negative';
    var emoji = Math.abs(r) >= 0.6 ? '📊' : Math.abs(r) >= 0.3 ? '🔍' : '➖';
    insightEl.style.display = 'block';
    insightEl.textContent = emoji + ' ' + strength.charAt(0).toUpperCase() + strength.slice(1) + ' ' + direction + ' correlation (r=' + r + ', ' + n + ' data points). ' +
      (Math.abs(r) < 0.3 ? 'No clear pattern detected.' :
       r > 0 ? 'When ' + corrLabel(xVar) + ' is higher, ' + corrLabel(yVar) + ' tends to be higher too.' :
               'When ' + corrLabel(xVar) + ' is higher, ' + corrLabel(yVar) + ' tends to be lower.');
  }
}

// ════ PROVIDER REPORT ════
var _prDays = 14;

function setPRRange(days, btn) {
  _prDays = days;
  document.querySelectorAll('#pr-range-btns .pr-range-btn').forEach(function(b){b.classList.toggle('on', b.dataset.days==days);});
}

function checked(id) { var el = document.getElementById(id); return el && el.checked; }

function generateProviderReport(mode) {
  var today    = new Date().toISOString().split('T')[0];
  var cutoff   = new Date(); cutoff.setDate(cutoff.getDate() - _prDays);
  var cutoffStr = cutoff.toISOString().split('T')[0];
  var rangeLabel = _prDays===14?'Last 2 weeks':_prDays===30?'Last month':'Last 3 months';
  var notes    = (document.getElementById('pr-notes').value||'').trim();

  function inRange(d) { return d >= cutoffStr && d <= today; }
  function num(v,dp)  { return v!=null?(+v).toFixed(dp||1):'—'; }
  function pct(v)     { return v!=null?Math.round(v*100)+'%':'—'; }

  var lines = [
    '═══════════════════════════════════════════════════════',
    '  PATIENT-REPORTED DATA SUMMARY',
    '  AuDHD HQ — Self-monitoring application',
    '  Period: ' + rangeLabel + ' (' + cutoffStr + ' → ' + today + ')',
    '  Generated: ' + new Date().toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'}),
    '═══════════════════════════════════════════════════════',
    '',
    '  This report was generated from self-logged data across',
    '  mood, energy, sleep, symptoms, and daily functioning.',
    '  Data reflects patient self-report; values are averages',
    '  or counts over the selected date range.',
    '',
  ];

  // ── Mental / Emotional ──────────────────────────────────
  if (checked('pr-mood')||checked('pr-energy-data')||checked('pr-anxiety')||checked('pr-crashes')) {
    lines.push('🧠 MENTAL / EMOTIONAL');
    lines.push('──────────────────────────────────────────────────────');
    var cis = [];
    try { cis = HQSafe.store.get(HQKeys.CHECKIN_LOG, []); } catch(e) {}
    var rangeCIs = cis.filter(function(c){ return inRange(c.date||(c.at||'').split('T')[0]); });

    if (checked('pr-mood') && rangeCIs.length) {
      var moods = rangeCIs.filter(function(c){return c.mood;}).map(function(c){return c.mood;});
      var avgMood = moods.length ? (moods.reduce(function(a,b){return a+b;},0)/moods.length).toFixed(1) : null;
      lines.push('  Mood (1–5 scale):');
      lines.push('    Average: ' + (avgMood||'—') + '/5');
      lines.push('    Low days (≤2): ' + moods.filter(function(m){return m<=2;}).length);
      lines.push('    Good days (≥4): ' + moods.filter(function(m){return m>=4;}).length);
      lines.push('    Sample size: ' + moods.length + ' check-ins');
      lines.push('');
    }
    if (checked('pr-energy-data') && rangeCIs.length) {
      var engs = rangeCIs.filter(function(c){return c.energy;}).map(function(c){return c.energy;});
      var avgEng = engs.length ? (engs.reduce(function(a,b){return a+b;},0)/engs.length).toFixed(1) : null;
      var variance = 0;
      if (engs.length > 1) {
        var mean = parseFloat(avgEng);
        variance = (engs.reduce(function(a,b){return a+Math.pow(b-mean,2);},0)/engs.length).toFixed(2);
      }
      lines.push('  Energy (1–5 scale):');
      lines.push('    Average: ' + (avgEng||'—') + '/5  (variance: ' + variance + ')');
      lines.push('    Low energy days (≤2): ' + engs.filter(function(e){return e<=2;}).length);
      lines.push('    High energy days (≥4): ' + engs.filter(function(e){return e>=4;}).length);
      lines.push('');
    }
    if (checked('pr-anxiety')) {
      var hdb = {};
      try { hdb = HQSafe.store.get(HQKeys.HEALTH, {}); } catch(e) {}
      var anxLog = (hdb.anxietyLog||[]).filter(function(a){return inRange(a.date||'');});
      var ciAnx  = rangeCIs.filter(function(c){return c.anxiety;}).map(function(c){return c.anxiety;});
      var allAnx = ciAnx.concat(anxLog.map(function(a){return a.level;}));
      if (allAnx.length) {
        var avgAnx = (allAnx.reduce(function(a,b){return a+b;},0)/allAnx.length).toFixed(1);
        lines.push('  Anxiety (1–5 scale):');
        lines.push('    Average: ' + avgAnx + '/5  ('+allAnx.length+' data points)');
        lines.push('    High anxiety days (≥4): ' + allAnx.filter(function(v){return v>=4;}).length);
        lines.push('');
      }
    }
    if (checked('pr-crashes')) {
      var shutdowns = rangeCIs.filter(function(c){
        return (c.bodyTags||[]).some(function(t){return t.toLowerCase().includes('shutdown');}) || (c.energy||0)<=1;
      }).length;
      lines.push('  Crash / Shutdown days: ' + shutdowns);
      lines.push('');
    }
    if (checked('pr-confidence')) {
      var metrics = {};
      try { metrics = HQSafe.store.get(HQKeys.METRICS, {}); } catch(e) {}
      var wKeys = Object.keys(metrics.snapshots||{}).sort().slice(-(_prDays<=14?2:_prDays<=30?4:12));
      var areas = ['work','health','home','social','finance','self','creativity'];
      var areaLabels = {work:'Work',health:'Health',home:'Home',social:'Social',finance:'Finance',self:'Self-care',creativity:'Creativity'};
      var areaData = {};
      wKeys.forEach(function(k) {
        var conf = (metrics.snapshots[k]||{}).confidence || {};
        areas.forEach(function(a) { if(conf[a]&&conf[a]!=='na'){if(!areaData[a])areaData[a]=[];areaData[a].push(+conf[a]);} });
      });
      if (Object.keys(areaData).length) {
        lines.push('  Self-reported confidence by life area (1–5, patient-rated):');
        areas.forEach(function(a) {
          if (areaData[a] && areaData[a].length) {
            var avg = (areaData[a].reduce(function(x,y){return x+y;},0)/areaData[a].length).toFixed(1);
            lines.push('    ' + (areaLabels[a]||a).padEnd(12) + avg + '/5');
          }
        });
        lines.push('');
      }
    }
  }

  // ── Physical ────────────────────────────────────────────
  var hd = {};
  try { hd = HQSafe.store.get(HQKeys.HEALTH, {}); } catch(e) {}

  if (checked('pr-sleep')||checked('pr-headache')||checked('pr-symptoms')||checked('pr-walking')||checked('pr-sensory')) {
    lines.push('🏥 PHYSICAL');
    lines.push('──────────────────────────────────────────────────────');

    if (checked('pr-sleep')) {
      var sleepLog = (hd.sleep||[]).filter(function(s){return inRange(s.date||'');});
      if (sleepLog.length) {
        var avgHrs  = (sleepLog.reduce(function(a,s){return a+(s.hours||0);},0)/sleepLog.length).toFixed(1);
        var avgQual = (sleepLog.reduce(function(a,s){return a+(s.quality||0);},0)/sleepLog.length).toFixed(1);
        lines.push('  Sleep (' + sleepLog.length + ' nights logged):');
        lines.push('    Average duration: ' + avgHrs + ' hours');
        lines.push('    Average quality:  ' + avgQual + '/5');
        lines.push('    Nights < 6 hrs:   ' + sleepLog.filter(function(s){return (s.hours||0)<6;}).length);
        lines.push('    Nights ≥ 7 hrs:   ' + sleepLog.filter(function(s){return (s.hours||0)>=7;}).length);
        lines.push('');
      }
    }
    if (checked('pr-headache')) {
      var haLog = (hd.headaches||[]).filter(function(h){return inRange(h.date||'');});
      if (haLog.length) {
        var avgInt = (haLog.reduce(function(a,h){return a+(h.intensity||0);},0)/haLog.length).toFixed(1);
        var types  = {};
        haLog.forEach(function(h){if(h.type)types[h.type]=(types[h.type]||0)+1;});
        var trigMap = {};
        haLog.forEach(function(h){(h.triggers||[]).forEach(function(t){trigMap[t]=(trigMap[t]||0)+1;});});
        var topTrigs = Object.entries(trigMap).sort(function(a,b){return b[1]-a[1];}).slice(0,5);
        lines.push('  Headaches (' + haLog.length + ' episodes):');
        lines.push('    Average intensity: ' + avgInt + '/10');
        if (Object.keys(types).length) lines.push('    Types: ' + Object.entries(types).map(function(e){return e[0]+' ('+e[1]+')';}).join(', '));
        if (topTrigs.length) lines.push('    Top triggers: ' + topTrigs.map(function(e){return e[0].replace(/^\S+\s*/,'');}).join(', '));
        lines.push('');
      } else {
        lines.push('  Headaches: None logged in this period.');
        lines.push('');
      }
    }
    if (checked('pr-symptoms')) {
      var symLog = (hd.symptoms||[]).filter(function(s){return inRange(s.date||'');});
      if (symLog.length) {
        var symCats = {};
        symLog.forEach(function(s){var k=(s.categoryName||'Other');symCats[k]=(symCats[k]||0)+1;});
        lines.push('  Symptoms logged (' + symLog.length + ' entries):');
        Object.entries(symCats).sort(function(a,b){return b[1]-a[1];}).forEach(function(e){
          lines.push('    ' + e[0].padEnd(20) + e[1] + ' occurrence' + (e[1]!==1?'s':''));
        });
        lines.push('');
      }
    }
    if (checked('pr-walking')) {
      var walkD = {};
      try { walkD = HQSafe.store.get(HQKeys.WALKING, {}); } catch(e) {}
      var wEntries = (walkD.entries||walkD.logs||[]).filter(function(e){return inRange((e.date||(e.at||'').split('T')[0]));});
      if (wEntries.length) {
        var totalMi = wEntries.reduce(function(a,e){return a+parseFloat(e.miles||e.distance||0);},0);
        lines.push('  Walking / Activity:');
        lines.push('    Total: ' + totalMi.toFixed(1) + ' miles over ' + wEntries.length + ' logged sessions');
        lines.push('    Average per session: ' + (totalMi/wEntries.length).toFixed(1) + ' miles');
        lines.push('');
      }
    }
    if (checked('pr-sensory')) {
      var senLog = (hd.sensory||[]).filter(function(s){return inRange(s.date||'');});
      if (senLog.length) {
        var avgSen = (senLog.reduce(function(a,s){return a+(s.level||0);},0)/senLog.length).toFixed(1);
        lines.push('  Sensory sensitivity (1–5, ' + senLog.length + ' ratings):');
        lines.push('    Average: ' + avgSen + '/5');
        lines.push('    High sensitivity days (≥4): ' + senLog.filter(function(s){return (s.level||0)>=4;}).length);
        lines.push('');
      }
    }
  }

  // ── Clinical ────────────────────────────────────────────
  if (checked('pr-meds')||checked('pr-doctor-hist')||checked('pr-period')) {
    lines.push('💊 CLINICAL');
    lines.push('──────────────────────────────────────────────────────');

    if (checked('pr-meds')) {
      var meds = [];
      try { meds = HQSafe.store.get(HQKeys.MEDS, []); } catch(e) {}
      if (meds.length) {
        lines.push('  Current medications:');
        meds.forEach(function(m) {
          lines.push('    • ' + m.name + (m.dose?' ('+m.dose+')':'') + (m.time?' — '+m.time:'') + (m.doctor?' — Dr. '+m.doctor:''));
        });
        // Taken log summary
        var medLog = {};
        try { medLog = HQSafe.store.get(HQKeys.MED_LOG, {}); } catch(e) {}
        var daysInRange = Object.keys(medLog).filter(function(d){return inRange(d);});
        if (daysInRange.length) {
          var totalExpected = meds.length * daysInRange.length;
          var totalTaken = daysInRange.reduce(function(a,d){
            return a + meds.filter(function(m){return medLog[d]&&medLog[d][m.id];}).length;
          },0);
          lines.push('    Adherence over period: ' + Math.round(totalTaken/Math.max(1,totalExpected)*100) + '% (' + totalTaken + '/' + totalExpected + ' doses)');
        }
        lines.push('');
      }
    }
    if (checked('pr-doctor-hist')) {
      var appts = [];
      try { appts = HQSafe.store.get(HQKeys.LIFE_ADMIN, {}).appts||[]; } catch(e) {}
      var rangeAppts = appts.filter(function(a){return inRange(a.date||'');});
      if (rangeAppts.length) {
        lines.push('  Appointments in period:');
        rangeAppts.sort(function(a,b){return (b.date||'').localeCompare(a.date||'');}).forEach(function(a){
          lines.push('    ' + (a.date||'') + ' — ' + (a.who||'') + (a.reason?' ('+a.reason+')':''));
          if (a.followup) lines.push('      Follow-up: ' + a.followup);
        });
        lines.push('');
      }
    }
    if (checked('pr-period')) {
      var periods = (hd.periods||[]).filter(function(p){return inRange(p.startDate||'');});
      if (periods.length) {
        lines.push('  Menstrual cycles (' + periods.length + ' logged in period):');
        periods.forEach(function(p){
          lines.push('    Start: ' + (p.startDate||'') + (p.endDate?' · End: '+p.endDate:'') + (p.flow?' · Flow: '+p.flow:''));
        });
        lines.push('');
      }
    }
  }

  // ── Function + Success ──────────────────────────────────
  if (checked('pr-score')||checked('pr-tasks')||checked('pr-habits')||checked('pr-wins')) {
    lines.push('📊 FUNCTIONING + SUCCESS METRICS');
    lines.push('──────────────────────────────────────────────────────');
    var metr = {};
    try { metr = HQSafe.store.get(HQKeys.METRICS, {}); } catch(e) {}
    var mKeys = Object.keys(metr.snapshots||{}).sort().slice(-(_prDays<=14?2:_prDays<=30?4:12));
    var mSnaps = mKeys.map(function(k){return (metr.snapshots[k]||{}).calc||{};});

    function mAvg(field) {
      var v = mSnaps.map(function(s){return s[field];}).filter(function(v){return v!=null;});
      return v.length ? v.reduce(function(a,b){return a+b;},0)/v.length : null;
    }
    function mSum(field) { return mSnaps.reduce(function(a,s){return a+(s[field]||0);},0); }

    if (checked('pr-score')) {
      var avgScore = mAvg('score');
      lines.push('  Weekly composite score (0–100):');
      lines.push('    Average: ' + (avgScore!=null?avgScore.toFixed(0):'—'));
      mKeys.forEach(function(k,i){
        var sc = (mSnaps[i]||{}).score;
        if(sc!=null) lines.push('    ' + k.replace('-W',' Wk ') + ': ' + sc);
      });
      lines.push('');
    }
    if (checked('pr-tasks')) {
      var avgTask = mAvg('taskCompletion');
      lines.push('  Task completion:  ' + (avgTask!=null?Math.round(avgTask*100)+'%':'—') + ' average over period');
      lines.push('');
    }
    if (checked('pr-habits')) {
      var avgHab = mAvg('habitRate');
      lines.push('  Habit consistency: ' + (avgHab!=null?Math.round(avgHab*100)+'%':'—') + ' average over period');
      lines.push('');
    }
    if (checked('pr-wins')) {
      lines.push('  Wins self-logged: ' + mSum('winsCount') + ' in period');
      lines.push('');
    }
  }

  // ── Notes ───────────────────────────────────────────────
  if (notes) {
    lines.push('📝 PATIENT NOTES');
    lines.push('──────────────────────────────────────────────────────');
    lines.push('  ' + notes.replace(/\n/g,'\n  '));
    lines.push('');
  }

  lines.push('──────────────────────────────────────────────────────');
  lines.push('  Data generated by AuDHD HQ self-monitoring PWA.');
  lines.push('  Firebase-hosted, offline-capable, no cloud storage.');
  lines.push('  All data is stored locally on patient device only.');
  lines.push('═══════════════════════════════════════════════════════');

  var text = lines.join('\n');

  if (mode === 'copy') {
    navigator.clipboard.writeText(text)
      .then(function(){ showToast('📋 Copied to clipboard!'); })
      .catch(function(){ showToast('Select text manually'); });
  } else {
    if (typeof hqOpenPrintView === 'function') {
      hqOpenPrintView('Provider Report · ' + rangeLabel, text);
    } else {
      var w = window.open('','_blank');
      if (w) {
        w.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Provider Report</title></head><body><pre>'+text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</pre></body></html>');
        w.document.close();
        setTimeout(function(){w.print();},400);
      }
    }
  }
}

// ═════════════════════════════════════════════════════════════════
// PHASE 7a — HEALTH SETUP (full: import/export + manual + presets)
// ═════════════════════════════════════════════════════════════════
const HEALTH_SETUP_KEY=HQKeys.HEALTH_SETUP;
let HEALTH_SETUP={conditions:[],providers:[],medications:[],symptoms:[],checkinPresets:[]};

function loadHealthSetup(){
  try{
    const raw=HQSafe.store.get(HEALTH_SETUP_KEY);
    if(raw){
      const parsed=JSON.parse(raw);
      HEALTH_SETUP=Object.assign({conditions:[],providers:[],medications:[],symptoms:[],checkinPresets:[]},parsed);
    }
    // Migration guard: ensure all expected arrays are actually arrays
    // (protects against old schema where these may have been stored as objects or missing)
    ['conditions','providers','medications','symptoms','checkinPresets'].forEach(function(k){
      if(!Array.isArray(HEALTH_SETUP[k])) HEALTH_SETUP[k]=[];
    });
    // Migration guard: if conditions & symptoms are empty, bridge from condition-pool wizard data
    _migrateHealthSetupFromConditionPool();
  }catch(e){}
}

/* ── Tier 3: HEALTH_SETUP migration guard ────────────────────────
   Runs once when HEALTH_SETUP.conditions is empty.
   Pulls in:
     • SELECTED_CONDITIONS → HEALTH_SETUP.conditions (by pool name)
     • SYMPTOM_WATCHLIST   → HEALTH_SETUP.symptoms (by symptom label)
   Writes a migration-done sentinel so it never double-runs.
─────────────────────────────────────────────────────────────────*/
function _migrateHealthSetupFromConditionPool(){
  const MKEY='audhd-hq-hs-pool-migrated';
  try{
    // Only run if not already migrated and conditions list is empty
    if(HQSafe.store.get(MKEY,null)==='1') return;
    if(HEALTH_SETUP.conditions.length > 0){ HQSafe.store.set(MKEY,'1'); return; }

    var pools = window.HQConditionPools || {};
    var didMigrate = false;

    // 1. Import selected conditions by name
    try{
      var selRaw = HQSafe.store.get(HQKeys.SELECTED_CONDITIONS, null) ||
                   JSON.parse(localStorage.getItem(HQKeys.SELECTED_CONDITIONS||'audhd-hq-selected-conditions')||'null');
      if(Array.isArray(selRaw) && selRaw.length){
        selRaw.forEach(function(condId){
          var pool = pools[condId];
          if(!pool) return;
          var exists = HEALTH_SETUP.conditions.some(function(c){ return c.name.toLowerCase()===pool.name.toLowerCase(); });
          if(!exists){
            HEALTH_SETUP.conditions.push({id:Date.now().toString(36)+Math.random().toString(36).slice(2,5),name:pool.name,created:new Date().toISOString(),source:'wizard-pool'});
          }
        });
        didMigrate = true;
      }
    }catch(e2){}

    // 2. Import watchlist symptoms as manual symptom entries
    try{
      var wlRaw = HQSafe.store.get(HQKeys.SYMPTOM_WATCHLIST, null) ||
                  JSON.parse(localStorage.getItem(HQKeys.SYMPTOM_WATCHLIST||'audhd-hq-symptom-watchlist')||'null');
      if(Array.isArray(wlRaw) && wlRaw.length){
        wlRaw.forEach(function(s){
          if(!s || !s.label) return;
          var exists = HEALTH_SETUP.symptoms.some(function(x){ return x.name.toLowerCase()===s.label.toLowerCase(); });
          if(!exists){
            HEALTH_SETUP.symptoms.push({id:Date.now().toString(36)+Math.random().toString(36).slice(2,5),name:s.label,created:new Date().toISOString(),source:'wizard-pool'});
          }
        });
        didMigrate = true;
      }
    }catch(e3){}

    if(didMigrate){
      HQSafe.store.set(HEALTH_SETUP_KEY, HEALTH_SETUP);
      console.info('[AUDHD HQ] HEALTH_SETUP migration from condition-pool wizard complete:',
        HEALTH_SETUP.conditions.length,'conditions,',HEALTH_SETUP.symptoms.length,'symptoms');
    }
    HQSafe.store.set(MKEY,'1');
  }catch(e){}
}

function saveHealthSetup(){
  HQSafe.store.set(HEALTH_SETUP_KEY, HEALTH_SETUP);
  renderHealthSetup();
}

// ── Manual add ────────────────────────────────────────────────────────────
function addHealthSetupItem(type){
  const inputIds={conditions:'setup-condition-input',providers:'setup-provider-input',medications:'setup-medication-input',symptoms:'setup-symptom-input'};
  const input=document.getElementById(inputIds[type]);
  if(!input)return;
  const val=input.value.trim();
  if(!val)return;
  if(!Array.isArray(HEALTH_SETUP[type]))HEALTH_SETUP[type]=[];
  HEALTH_SETUP[type].push({id:Date.now().toString(36)+Math.random().toString(36).slice(2,5),name:val,created:new Date().toISOString()});
  input.value='';
  saveHealthSetup();
  showToast('Added \u2713');
}

function removeHealthSetupItem(type,id){
  if(!Array.isArray(HEALTH_SETUP[type]))return;
  HEALTH_SETUP[type]=HEALTH_SETUP[type].filter(x=>x.id!==id);
  saveHealthSetup();
}

// ── Render ─────────────────────────────────────────────────────────────────
function renderHealthSetup(){
  const FIELD_CONFIG={
    conditions: {target:'setup-conditions-list',   empty:'No conditions added yet.'},
    providers:  {target:'setup-providers-list',    empty:'No providers added yet.'},
    medications:{target:'setup-medications-list',  empty:'No medications added yet.'},
    symptoms:   {target:'setup-symptoms-list',     empty:'No symptoms on watchlist yet.'}
  };
  Object.entries(FIELD_CONFIG).forEach(([type,cfg])=>{
    const el=document.getElementById(cfg.target);
    if(!el)return;
    const arr=HEALTH_SETUP[type]||[];
    if(!arr.length){el.innerHTML=`<div class="empty" style="font-size:11px;color:var(--muted);padding:8px 0">${cfg.empty}</div>`;return;}
    el.innerHTML=arr.map(item=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);gap:8px">
      <span style="font-size:12px;color:var(--text)">${hsEsc(item.name)}</span>
      <button style="background:none;border:1px solid var(--border);color:var(--muted);border-radius:6px;padding:2px 8px;font-size:10px;cursor:pointer;font-family:inherit;white-space:nowrap" onclick="removeHealthSetupItem('${type}','${item.id}')">\u2715 Remove</button>
    </div>`).join('');
  });
  renderCheckinPresets();
}

// ═══════════════════════════════════════════════════════════════════
// PHASE 8 STEP 3 — CHECK-IN MODE PRESET CRUD
// Schema: {id, label, emoji, quickEntry, sections:string[], defaults:{mood,energy,feelingTone,walked}}
// Stored in HEALTH_SETUP.checkinPresets (array of preset objects)
// Migrates any legacy string-array data silently
// ═══════════════════════════════════════════════════════════════════

// Migrate legacy data: if checkinPresets contains strings (old format), reset to []
(function migrateCheckinPresets(){
  if(Array.isArray(HEALTH_SETUP.checkinPresets) && HEALTH_SETUP.checkinPresets.length > 0){
    if(typeof HEALTH_SETUP.checkinPresets[0] === 'string'){
      HEALTH_SETUP.checkinPresets = [];
    }
  }
})();

// Section definitions used in the preset modal
const PRESET_SECTIONS = [
  {id:'feeling',  label:'🎭 How I\'m Feeling'},
  {id:'mood',     label:'🌡️ Mood Intensity'},
  {id:'energy',   label:'🔋 Energy'},
  {id:'body',     label:'🩺 Body Scan'},
  {id:'walk',     label:'🚶 Movement'},
  {id:'sleep',    label:'😴 Sleep'},
  {id:'work',     label:'💼 Work Day'},
  {id:'notes',    label:'📝 Capture Notes'},
  {id:'meds',     label:'💊 Medications'},
  {id:'stressor', label:'😰 Stressor'},
];

// Built-in fallback presets (always available in check-in, never stored)
const BUILTIN_PRESET_DEFS = [
  {id:'full',      label:'Full Check-In',     emoji:'📋', quickEntry:false, sections:['feeling','mood','energy','body','walk','sleep','work','notes','meds','stressor'], defaults:{}},
  {id:'morning',   label:'Morning Quick',     emoji:'🌅', quickEntry:true,  sections:['feeling','energy','sleep','meds'],                                              defaults:{}},
  {id:'evening',   label:'Evening Wind-Down', emoji:'🌙', quickEntry:false, sections:['mood','feeling','body','notes','stressor'],                                     defaults:{energy:2}},
  {id:'symptom',   label:'Symptom Day',       emoji:'🩺', quickEntry:false, sections:['feeling','body','stressor','notes'],                                           defaults:{feelingTone:'bad'}},
];

// ── Modal state ────────────────────────────────────────────────────
let _pmEditId = null; // null = new, string = editing existing id

function openPresetModal(id){
  _pmEditId = id;
  const existing = id ? (HEALTH_SETUP.checkinPresets||[]).find(p=>p.id===id) : null;
  const p = existing || {emoji:'⚡',label:'',quickEntry:false,sections:['feeling','energy'],defaults:{}};

  document.getElementById('preset-modal-title').textContent = id ? 'Edit Preset' : 'New Preset';
  document.getElementById('pm-emoji').value  = p.emoji||'⚡';
  document.getElementById('pm-label').value  = p.label||'';
  document.getElementById('pm-quick-entry').checked = !!p.quickEntry;
  document.getElementById('pm-def-mood').value     = p.defaults&&p.defaults.mood   ? String(p.defaults.mood)   : '';
  document.getElementById('pm-def-energy').value   = p.defaults&&p.defaults.energy ? String(p.defaults.energy) : '';
  document.getElementById('pm-def-tone').value     = (p.defaults&&p.defaults.feelingTone)||'';
  document.getElementById('pm-def-walked').checked = !!(p.defaults&&p.defaults.walked);
  document.getElementById('pm-delete-btn').style.display = id ? '' : 'none';

  // Render section checkboxes
  const secs = p.sections||[];
  document.getElementById('pm-sections').innerHTML = PRESET_SECTIONS.map(s=>{
    const on = secs.includes(s.id);
    return `<label class="pm-sec-toggle${on?' on':''}" onclick="pmToggleSec(this,'${s.id}')">
      <input type="checkbox" ${on?'checked':''} style="pointer-events:none;accent-color:var(--teal);width:14px;height:14px">
      <span>${s.label}</span>
    </label>`;
  }).join('');

  HQModal.open('preset-modal'); // H-06
}

function pmToggleSec(label, id){
  const cb = label.querySelector('input[type=checkbox]');
  cb.checked = !cb.checked;
  label.classList.toggle('on', cb.checked);
}

function closePresetModal(){
  HQModal.close('preset-modal'); // H-06
  _pmEditId = null;
}

function savePresetFromModal(){
  const label = (document.getElementById('pm-label').value||'').trim();
  if(!label){ showToast('⚠️ Give the preset a name'); return; }
  const sections = Array.from(document.querySelectorAll('#pm-sections input[type=checkbox]'))
    .map((cb,i)=>({checked:cb.checked, id:PRESET_SECTIONS[i].id}))
    .filter(x=>x.checked).map(x=>x.id);
  if(!sections.length){ showToast('⚠️ Select at least one section'); return; }

  const defaults = {};
  const dm = document.getElementById('pm-def-mood').value;
  const de = document.getElementById('pm-def-energy').value;
  const dt = document.getElementById('pm-def-tone').value;
  const dw = document.getElementById('pm-def-walked').checked;
  if(dm) defaults.mood = parseInt(dm,10);
  if(de) defaults.energy = parseInt(de,10);
  if(dt) defaults.feelingTone = dt;
  if(dw) defaults.walked = true;

  const preset = {
    id:         _pmEditId || (Date.now().toString(36)+Math.random().toString(36).slice(2,5)),
    label:      label,
    emoji:      (document.getElementById('pm-emoji').value||'⚡').trim().slice(0,4),
    quickEntry: document.getElementById('pm-quick-entry').checked,
    sections:   sections,
    defaults:   defaults,
  };

  if(!Array.isArray(HEALTH_SETUP.checkinPresets)) HEALTH_SETUP.checkinPresets=[];
  if(_pmEditId){
    const idx=HEALTH_SETUP.checkinPresets.findIndex(p=>p.id===_pmEditId);
    if(idx>-1) HEALTH_SETUP.checkinPresets[idx]=preset;
    else HEALTH_SETUP.checkinPresets.push(preset);
  } else {
    HEALTH_SETUP.checkinPresets.push(preset);
  }
  saveHealthSetup();
  closePresetModal();
  showToast('✅ Preset saved');
}

async function deletePresetFromModal(){
  if(!_pmEditId) return;
  if(!(await HQConfirm.ask('Delete this preset?', {danger:true})))return;
  HEALTH_SETUP.checkinPresets=(HEALTH_SETUP.checkinPresets||[]).filter(p=>p.id!==_pmEditId);
  saveHealthSetup();
  closePresetModal();
  showToast('🗑 Preset deleted');
}

// ── Render preset lists in setup tab ───────────────────────────────
function renderCheckinPresets(){
  // Built-in read-only row
  const builtinWrap=document.getElementById('setup-builtin-presets');
  if(builtinWrap){
    builtinWrap.innerHTML=BUILTIN_PRESET_DEFS.map(p=>
      `<div class="preset-card-ro"><span class="pre">${p.emoji}</span>${hsEsc(p.label)}${p.quickEntry?' ⚡':''}</div>`
    ).join('');
  }

  // User custom presets
  const userWrap=document.getElementById('setup-presets-list');
  if(!userWrap) return;
  const arr=HEALTH_SETUP.checkinPresets||[];
  if(!arr.length){
    userWrap.innerHTML='<div style="font-size:11px;color:var(--muted);padding:8px 0">No custom presets yet. Hit <strong>+ New Preset</strong> to create one.</div>';
    return;
  }
  userWrap.innerHTML=arr.map(p=>{
    const secLabels=p.sections.map(sid=>{const s=PRESET_SECTIONS.find(x=>x.id===sid);return s?s.label.replace(/^[^\s]+\s/,''):sid;}).join(', ');
    return `<div class="preset-custom-row">
      <span class="pci">${hsEsc(p.emoji)}</span>
      <div style="flex:1;min-width:0">
        <div class="pcl">${hsEsc(p.label)}${p.quickEntry?' <span style="font-size:9px;color:var(--teal);font-weight:700">⚡ QUICK</span>':''}</div>
        <div class="pcs">${hsEsc(secLabels)}</div>
      </div>
      <button class="pc-edit" onclick="openPresetModal('${p.id}')">✏️ Edit</button>
    </div>`;
  }).join('');
}

// ── Import modal state ─────────────────────────────────────────────────────
let _hsImportType=null;
let _hsImportFileLines=null;

function openHsImport(type){
  _hsImportType=type;
  _hsImportFileLines=null;
  const LABELS={conditions:'Conditions',providers:'Providers',medications:'Medications',symptoms:'Symptoms'};
  const HINTS={
    conditions:'One condition per line. CSV: first column used.',
    providers: 'One provider per line. CSV: first column used.',
    medications:'One medication per line. Include dosage inline if you like (e.g. "Vyvanse 30mg").',
    symptoms:  'One symptom per line. Be as specific as you like.'
  };
  document.getElementById('hs-import-title').textContent='\ud83d\udce5 Import '+(LABELS[type]||type);
  document.getElementById('hs-import-hint').textContent=HINTS[type]||'One item per line.';
  document.getElementById('hs-import-textarea').value='';
  document.getElementById('hs-import-file-preview').textContent='';
  document.getElementById('hs-import-preview-wrap').style.display='none';
  hsImportTab('text');
  HQModal.open('hs-import-modal'); // H-06
}

function closeHsImport(){
  HQModal.close('hs-import-modal'); // H-06
  _hsImportType=null;
  _hsImportFileLines=null;
}

function hsImportTab(tab){
  document.getElementById('hs-import-text-panel').style.display=tab==='text'?'':'none';
  document.getElementById('hs-import-file-panel').style.display=tab==='file'?'':'none';
  document.getElementById('hs-itab-text').classList.toggle('active',tab==='text');
  document.getElementById('hs-itab-file').classList.toggle('active',tab==='file');
}

function hsHandleFileImport(input){
  const file=input.files[0];
  if(!file)return;
  const ext=file.name.split('.').pop().toLowerCase();
  const prevEl=document.getElementById('hs-import-file-preview');
  prevEl.textContent='Reading\u2026';
  if(ext==='csv'||ext==='txt'){
    const reader=new FileReader();
    reader.onload=e=>{
      _hsImportFileLines=hsParseImportText(e.target.result,ext==='csv');
      prevEl.textContent=`\u2713 ${file.name} \u2014 ${_hsImportFileLines.length} items detected`;
    };
    reader.readAsText(file);
  }else{
    prevEl.innerHTML='<span style="color:var(--orange)">\u26a0\ufe0f XLS/XLSX: save as .csv and re-upload, or paste text directly.</span>';
    _hsImportFileLines=null;
  }
  input.value='';
}

function hsParseImportText(raw,isCsv){
  return raw.split(/\r?\n/).map(line=>{
    if(isCsv){const col=(line.split(',')[0]||'');return col.replace(/^"|"$/g,'').trim();}
    return line.trim();
  }).filter(Boolean);
}

function hsPreviewImport(){
  const lines=_hsImportFileLines||hsParseImportText(document.getElementById('hs-import-textarea').value,false);
  const wrap=document.getElementById('hs-import-preview-wrap');
  const prev=document.getElementById('hs-import-preview');
  if(!lines.length){showToast('Nothing to preview \u2014 paste or upload items first.');return;}
  document.getElementById('hs-import-count').textContent=lines.length;
  prev.innerHTML=lines.map(l=>`<div>${hsEsc(l)}</div>`).join('');
  wrap.style.display='';
}

function hsConfirmImport(){
  const lines=_hsImportFileLines||hsParseImportText(document.getElementById('hs-import-textarea').value,false);
  if(!lines.length){showToast('Nothing to import.');return;}
  if(!_hsImportType)return;
  if(!Array.isArray(HEALTH_SETUP[_hsImportType]))HEALTH_SETUP[_hsImportType]=[];
  const existing=new Set(HEALTH_SETUP[_hsImportType].map(x=>x.name.toLowerCase()));
  let added=0;
  lines.forEach(name=>{
    if(!existing.has(name.toLowerCase())){
      HEALTH_SETUP[_hsImportType].push({id:Date.now().toString(36)+Math.random().toString(36).slice(2,5),name,created:new Date().toISOString(),importedAt:new Date().toISOString()});
      existing.add(name.toLowerCase());
      added++;
    }
  });
  saveHealthSetup();
  closeHsImport();
  showToast(`\u2713 Imported ${added} item${added!==1?'s':''} (${lines.length-added} skipped as duplicates)`);
}

function exportHealthSetup(){
  const blob=new Blob([JSON.stringify(HEALTH_SETUP,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;
  a.download=`health-setup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importHealthSetupFile(input){
  const file=input.files[0];
  if(!file)return;
  const reader=new FileReader();
  reader.onload=e=>{
    try{
      const parsed=JSON.parse(e.target.result);
      if(typeof parsed!=='object'||Array.isArray(parsed))throw new Error('Invalid format');
      HEALTH_SETUP=Object.assign({conditions:[],providers:[],medications:[],symptoms:[],checkinPresets:[]},parsed);
      saveHealthSetup();
      showToast('\u2713 Health setup restored');
    }catch(err){
      showToast('\u274c Could not parse file \u2014 check it is a health-setup JSON export');
    }
  };
  reader.readAsText(file);
  input.value='';
}

function hsEsc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

document.addEventListener('DOMContentLoaded',()=>{
  // FIX-05: init all delegated history listeners in one block
  _initPHistListener(_htSig);
  _initHAHistListener(_htSig);
  _initSLHistListener(_htSig);

  loadHealthSetup();
  setTimeout(renderHealthSetup,250);
  // Phase B: init condition pool picker in settings tab
  setTimeout(function() {
    var setup = window.HQSymptomSetup;
    if (setup && setup.initPicker && document.getElementById('condition-pool-grid')) {
      setup.initPicker(
        'condition-pool-grid',
        'condition-pool-watchlist-chips',
        function(watchlist) {
          showToast('✅ Watchlist saved — ' + watchlist.length + ' symptoms tracked');
        }
      );
    }
  }, 400);
}, {once: true});

// ── Window Exports (Phase C7) ─────────────────────────────────────────────
// Required for static HTML onclick= attributes and dynamically-generated
// onclick strings in innerHTML (e.g. renderCal, renderSymCats, renderMedsTab).
// TODO Phase C10: Convert these render functions to HQRenderer.list() +
//                 event delegation and remove these window exports.
window.addCustomChip      = addCustomChip;
window.addHealthSetupItem = addHealthSetupItem;
window.calcHADur          = calcHADur;
window.calcHrs            = calcHrs;
window.calClick           = calClick;
window.clearDreamForm     = clearDreamForm;
window.clearForm          = clearForm;
window.closeHsImport      = closeHsImport;
window.closeIE            = closeIE;
window.closeMedModal      = closeMedModal;
window.closePresetModal   = closePresetModal;
window.deleteDream        = deleteDream;
window.deleteMed          = deleteMed;
window.deletePresetFromModal = deletePresetFromModal;
window.editHA             = editHA;
window.editPeriod         = editPeriod;
window.exportData         = exportData;
window.exportHealthSetup  = exportHealthSetup;
window.generateProviderReport = generateProviderReport;
window.hsConfirmImport    = hsConfirmImport;
window.hsHandleFileImport = hsHandleFileImport;
window.hsImportTab        = hsImportTab;
window.hsPreviewImport    = hsPreviewImport;
window.importData         = importData;
window.importHealthSetupFile = importHealthSetupFile;
window.loadDoctorPrep     = loadDoctorPrep;
window.moveCal            = moveCal;
window.openAddMed         = openAddMed;
window.openEditMed        = openEditMed;
window.openHsImport       = openHsImport;
window.openIE             = openIE;
window.openPresetModal    = openPresetModal;
window.pmToggleSec        = pmToggleSec;
window.removeHealthSetupItem = removeHealthSetupItem;
window.renderCorrelation  = renderCorrelation;
window.saveDoctorPrep     = saveDoctorPrep;
window.saveDream          = saveDream;
window.saveHA             = saveHA;
window.saveMed            = saveMed;
window.savePeriod         = savePeriod;
window.savePresetFromModal = savePresetFromModal;
window.saveSleep          = saveSleep;
window.saveSymptom        = saveSymptom;
window.setAura            = setAura;
window.setDQ              = setDQ;
window.setFlow            = setFlow;
window.setPRRange         = setPRRange;
window.setR               = setR;
window.sw                 = sw;
window.sySelectCat        = sySelectCat;
window.sySetCat           = sySetCat;
window.tog                = tog;
window.togC               = togC;
window.togH               = togH;
window.toggleMedTaken     = toggleMedTaken;
window.updInt             = updInt;
window.updSev             = updSev;

})(); // End Phase C7 IIFE — health-tracker
