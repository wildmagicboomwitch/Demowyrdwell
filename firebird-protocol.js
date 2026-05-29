// Sidenav: hqOpenSidenav/hqCloseSidenav from hq-core.js
// ===== THEME — delegated to hq-core.js =====
// hq-core.js manages hq-theme key and hqToggleTheme()
document.addEventListener('hq-theme-change', function(e){
  var theme = e.detail && e.detail.theme ? e.detail.theme : e.detail;
  document.querySelectorAll('.tp-theme-pill').forEach(function(p){
    p.classList.toggle('active', p.dataset.t === theme);
  });
});

// ===== TABS =====

// ===== STATE CHECK-IN =====
let selRoute = null;
function selState(btn){
  document.querySelectorAll('.s-btn').forEach(b=>b.classList.remove('sel'));
  btn.classList.add('sel');
  selRoute = btn.dataset.route;
  document.getElementById('route-btn').classList.add('rdy');
}
function routeState(){
  if(!selRoute) return;
  const map = {start:0,cope:1,breathe:2,rising:3,simplify:4,ignite:5};
  sw(selRoute, document.querySelectorAll('.ntab')[map[selRoute]||1]);
}

// ===== COPE ACCORDIONS =====
function togCope(btn){
  const body = btn.nextElementSibling;
  const isOpen = body.classList.contains('show');
  document.querySelectorAll('.cope-body.show').forEach(b=>b.classList.remove('show'));
  document.querySelectorAll('.cope-btn.open').forEach(b=>b.classList.remove('open'));
  if(!isOpen){ body.classList.add('show'); btn.classList.add('open'); }
}

// ===== BREATHING ENGINE =====
const BREATHS = {
  box:    [{p:'Inhale',s:4,c:'inh'},{p:'Hold',s:4,c:'hld'},{p:'Exhale',s:4,c:'exh'},{p:'Hold',s:4,c:'hld'}],
  four78: [{p:'Inhale',s:4,c:'inh'},{p:'Hold',s:7,c:'hld'},{p:'Exhale',s:8,c:'exh'}],
  quick:  [{p:'Inhale',s:4,c:'inh'},{p:'Exhale',s:6,c:'exh'},{p:'Inhale',s:4,c:'inh'},{p:'Exhale',s:6,c:'exh'},{p:'Inhale',s:4,c:'inh'},{p:'Exhale',s:6,c:'exh'}],
};
const BT = {};

function startBreath(id){
  if(BT[id]) stopBreath(id);
  const steps=BREATHS[id];
  const ring=document.getElementById(id+'-ring');
  const ph=document.getElementById(id+'-ph');
  const sb=document.getElementById(id+'-sb');
  sb.textContent='■ Running'; sb.onclick=()=>stopBreath(id);
  let si=0,sc=0;
  const run=()=>{
    const s=steps[si];
    if(sc===0){ring.className='bc-ring '+s.c;ph.textContent=s.p+'...';}
    ring.textContent=s.s-sc;
    sc++;
    if(sc>=s.s){sc=0;si=(si+1)%steps.length;}
  };
  run(); BT[id]=setInterval(run,1000);
}
function stopBreath(id){
  clearInterval(BT[id]);delete BT[id];
  const ring=document.getElementById(id+'-ring');
  const ph=document.getElementById(id+'-ph');
  const sb=document.getElementById(id+'-sb');
  if(ring){ring.className='bc-ring';ring.textContent=BREATHS[id][0].s;}
  if(ph) ph.textContent='Ready — press start';
  if(sb){sb.textContent='▶ Start';sb.onclick=()=>startBreath(id);}
}

// ===== MINI TIMERS =====
const MTS={};
function startMT(id,secs,btn){
  if(MTS[id]) clearInterval(MTS[id]);
  let rem=secs;
  const disp=document.getElementById(id);
  btn.textContent='Stop'; btn.className='mt-btn';
  btn.onclick=()=>{clearInterval(MTS[id]);btn.textContent='Go';btn.className='mt-btn go';btn.onclick=()=>startMT(id,secs,btn);disp.textContent=fmt(secs);disp.className='mt-time';};
  disp.className='mt-time running';
  MTS[id]=setInterval(()=>{
    rem--;
    disp.textContent=fmt(rem);
    if(rem<=0){
      clearInterval(MTS[id]);
      disp.textContent='Done ✓';disp.className='mt-time done';
      btn.textContent='Done ✓';btn.disabled=true;
      showToast('⏱️ Timer done!');
    }
  },1000);
}
function fmt(s){const m=Math.floor(s/60),ss=s%60;return`${m}:${String(ss).padStart(2,'0')}`;}

// ===== MANTRAS =====
const MANTRAS={
  exec:[
    {t:"The inability to start is not laziness. It is a dysregulation of the dopamine system. You are not broken — you have a brain that needs a different key.",x:"on executive dysfunction"},
    {t:"You don't have to do the whole thing. You have to do the first 5 minutes. That's the only job right now.",x:"on getting started"},
    {t:"Changing one physical thing — chair, room, music, light — is a real and legitimate strategy. Your brain is looking for a context cue.",x:"on environment changes"},
    {t:"Every task you complete exists in your history permanently. Nothing that's done can be un-done. Build the record.",x:"on progress"},
    {t:"The wall doesn't argue. You don't have to win against it. You find the door beside it.",x:"on executive blocks"},
  ],
  rsd:[
    {t:"RSD is a neurological response, not a measurement of reality. The intensity of the feeling is not the same as the accuracy of the feeling.",x:"on RSD intensity"},
    {t:"You were not 'too sensitive.' You had a genuine reaction to a real signal. AuDHD brains are calibrated to detect threat. That calibration served a purpose.",x:"on being 'too much'"},
    {t:"You do not need to respond right now. The 20-minute rule exists because AuDHD plus RSD plus communication is a combination that needs cooling time.",x:"on not responding immediately"},
    {t:"The shame came fast and hard. That's the RSD signature — not the truth arriving quickly, but a flood response. Wait for it to drain.",x:"on shame floods"},
    {t:"What they said is information about them. Process it later. Right now, just get out of the spiral.",x:"on criticism"},
  ],
  tax:[
    {t:"The ADHD tax is real. The extra hours on admin that takes others 20 minutes. The late fees from time blindness. You have been doing more with less, consistently, for years.",x:"on the ADHD tax"},
    {t:"You are managing a system not built for your brain, with tools not designed for your brain, and you are largely still getting it done. That is extraordinary and should be named as such.",x:"on daily effort"},
    {t:"Masking is exhausting in ways that don't show up on the outside. Holding it together externally doesn't mean nothing was happening internally.",x:"on masking fatigue"},
    {t:"Late diagnosis means years of thinking the problem was a character flaw. It wasn't. The operating system was undocumented. You learned to run it anyway.",x:"on late diagnosis"},
    {t:"Your brain is doing something every moment that most brains don't have to do: override the default. That is constant work, even when no one sees it.",x:"on constant override"},
  ],
  hard:[
    {t:"A day where you survived a hard thing is a day where you demonstrated capacity. You have more evidence of your resilience than you currently credit yourself for.",x:"on hard days"},
    {t:"You don't have to be okay right now. You have to be here right now. That's the only requirement.",x:"on being present"},
    {t:"The cat gets fed on hard days. You drink water. You take your meds. That is the floor — and you hit it consistently. A lot of people don't have a floor.",x:"on the floor"},
    {t:"You are not falling apart. You are in the middle of something hard. Those look identical from the inside and completely different from the outside.",x:"on perspective"},
    {t:"Asking for less today is not lowering your standards. It is updating your inputs accurately. The work gets done over time, not in one day.",x:"on reducing load"},
  ],
  big:[
    {t:"Your brain works differently — not worse. The same architecture that creates the paralysis also creates the focus, the connections, the creativity. You don't get to keep one and eliminate the other.",x:"on the whole brain"},
    {t:"The version of you that functions well is not a different person. It's you with the right conditions. Your job is not to become someone else — it's to understand what your conditions are.",x:"on the right conditions"},
    {t:"You are building something real. Slowly, imperfectly, with more restarts than most people would tolerate. That is still building. The structure is still going up.",x:"on long-term building"},
    {t:"There is a version of your life where the systems work for you — where your energy goes to what matters instead of fighting the admin. You are building that version right now.",x:"on the bigger picture"},
  ],
};

let starred=new Set();
try{starred=new Set(HQSafe.store.get(HQKeys.FB_STARS, []));}catch(e){}

function buildMantras(){
  Object.entries(MANTRAS).forEach(([cat,items])=>{
    const el=document.getElementById('m-'+cat);
    if(!el)return;
    el.innerHTML=items.map((m,i)=>{
      const id=cat+'_'+i;
      return`<div class="mc" id="mc-${id}">
        <div class="mc-text">"${m.t}"</div>
        <div class="mc-ctx">${m.x}</div>
        <div class="mc-foot">
          <div class="mc-cat">${CLABELS[cat]||cat}</div>
          <button class="star ${starred.has(id)?'on':''}" onclick="togStar('${id}',this)">${starred.has(id)?'⭐':'☆'}</button>
        </div>
      </div>`;
    }).join('');
  });
  renderStarred();
}

const CLABELS={exec:'Executive Function',rsd:'RSD & Shame',tax:'ADHD Tax',hard:'Hard Days',big:'Bigger Picture'};

function togStar(id,btn){
  if(starred.has(id)){starred.delete(id);btn.textContent='☆';btn.classList.remove('on');}
  else{starred.add(id);btn.textContent='⭐';btn.classList.add('on');}
  try{HQSafe.store.set(HQKeys.FB_STARS, [...starred]);}catch(e){}
  renderStarred();
}

function renderStarred(){
  const el=document.getElementById('m-starred');
  if(!starred.size){el.innerHTML='<div style="color:var(--muted);font-size:12px;padding:14px;text-align:center;background:var(--card);border-radius:9px;border:1px solid var(--border)">Star mantras above to keep them here.</div>';return;}
  let h='';
  starred.forEach(id=>{
    const[cat,i]=id.split('_');
    const m=MANTRAS[cat]?.[+i];
    if(!m)return;
    h+=`<div class="mc" style="border-color:rgba(244,202,0,.3)">
      <div class="mc-text">"${m.t}"</div>
      <div class="mc-ctx">${m.x}</div>
      <div class="mc-foot">
        <div class="mc-cat" style="color:var(--gold)">${CLABELS[cat]||cat}</div>
        <button class="star on" onclick="togStar('${id}',this)">⭐</button>
      </div>
    </div>`;
  });
  el.innerHTML=h;
}

// ===== MISSION LOCK =====
function lockM(){
  const v=document.getElementById('m-in').value.trim();
  if(!v)return;
  document.getElementById('ml-txt').textContent=v;
  document.getElementById('ml').classList.add('show');
  document.getElementById('m-in').style.display='none';
  document.querySelector('.lock-btn').style.display='none';
  try{HQSafe.store.set(HQKeys.FB_MISSION,v);}catch(e){}
  showToast('🔒 Mission locked!');
}
function unlockM(){
  document.getElementById('ml').classList.remove('show');
  document.getElementById('m-in').style.display='block';
  document.querySelector('.lock-btn').style.display='flex';
}

// ===== LANDING CHECKLIST =====
const lndDone=new Set();
function togLnd(el,i){
  const done=el.classList.contains('dn');
  if(done){el.classList.remove('dn');el.textContent='';lndDone.delete(i);}
  else{el.classList.add('dn');el.textContent='✓';lndDone.add(i);}
  const n=lndDone.size;
  document.getElementById('lnd-ct').textContent=n+'/5';
  document.getElementById('lnd-bar').style.width=(n/5*100)+'%';
}

// ===== BODY CHECK =====
function togBC(row){
  row.classList.toggle('ck');
  const box=row.querySelector('.bc-box');
  if(row.classList.contains('ck')) box.textContent='✓';
  else box.textContent='';
}

// ===== TOAST =====


// ════ FIREBIRD ENHANCEMENTS ════════════════════════════════════════

// ── LS KEYS ──
var FB_WARNINGS  = HQKeys.FB_WARNINGS;
var FB_TRUSTED   = HQKeys.FB_TRUSTED;
var FB_CRISIS    = HQKeys.FB_CRISIS;
var FB_DEBRIEF   = HQKeys.FB_DEBRIEF;
var FB_CQ        = HQKeys.FB_CUSTOM_QUOTES;

function fbEsc(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// ═══════════════════════════════════════════════════════════
// FEATURE 1 — PRE-CRISIS WARNING SIGNS
// ═══════════════════════════════════════════════════════════
function renderWarnings() {
  var list = HQSafe.store.get(FB_WARNINGS, []);
  var el = document.getElementById('warning-list');
  if (!el) return;
  if (!list.length) {
    el.innerHTML = '<div style="font-size:11px;color:var(--muted);font-style:italic;padding:4px 0">No warning signs added yet. Add yours — knowing them catches dysregulation earlier.</div>';
    return;
  }
  el.innerHTML = list.map(function(w, i) {
    return '<div class="warning-item">⚡ ' + fbEsc(w)
      + '<button class="warning-del" onclick="deleteWarning(' + i + ')">✕</button></div>';
  }).join('');
}
function addWarningSign() {
  var inp = document.getElementById('warning-input');
  var val = (inp.value || '').trim();
  if (!val) return;
  var list = HQSafe.store.get(FB_WARNINGS, []);
  list.push(val);
  HQSafe.store.set(FB_WARNINGS, list);
  inp.value = '';
  renderWarnings();
}
function deleteWarning(idx) {
  var list = HQSafe.store.get(FB_WARNINGS, []);
  list.splice(idx, 1);
  HQSafe.store.set(FB_WARNINGS, list);
  renderWarnings();
}

// ═══════════════════════════════════════════════════════════
// FEATURE 2 — TRUSTED PEOPLE CARD
// ═══════════════════════════════════════════════════════════
function renderTrustedPeople() {
  var list = HQSafe.store.get(FB_TRUSTED, []);
  var card = document.getElementById('trusted-card');
  var el   = document.getElementById('trusted-list');
  if (!card || !el) return;
  card.style.display = list.length ? '' : 'none';
  el.innerHTML = list.map(function(p, i) {
    return '<div class="trust-card">'
      + '<div style="display:flex;align-items:flex-start;justify-content:space-between">'
      + '<div><div class="trust-name">' + fbEsc(p.name) + '</div>'
      + '<div class="trust-rel">' + fbEsc(p.rel) + '</div></div>'
      + '<button onclick="deleteTrusted(' + i + ')" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:11px">✕</button>'
      + '</div>'
      + (p.msg ? '<div class="trust-msg">"' + fbEsc(p.msg) + '"</div>' : '')
      + '</div>';
  }).join('');
}
function openAddTrusted() { HQModal.open('trusted-modal'); } // H-06: was .style.display='flex'
function saveTrustedPerson() {
  var name = (document.getElementById('tr-name').value || '').trim();
  if (!name) return;
  var list = HQSafe.store.get(FB_TRUSTED, []);
  list.push({ name: name, rel: document.getElementById('tr-rel').value.trim(), msg: document.getElementById('tr-msg').value.trim() });
  HQSafe.store.set(FB_TRUSTED, list);
  HQModal.close('trusted-modal'); // H-06: was .style.display='none'
  ['tr-name','tr-rel','tr-msg'].forEach(function(id) { document.getElementById(id).value = ''; });
  renderTrustedPeople();
  showToast('💜 Added!');
}
function deleteTrusted(idx) {
  var list = HQSafe.store.get(FB_TRUSTED, []);
  list.splice(idx, 1);
  HQSafe.store.set(FB_TRUSTED, list);
  renderTrustedPeople();
}

// ═══════════════════════════════════════════════════════════
// FEATURE 3 — QUICK-EXIT GROUNDING
// ═══════════════════════════════════════════════════════════
var QE_STEPS = [
  { word: 'BREATHE', instruction: 'In through the nose. Out through the mouth.\nOne breath. That is all.' },
  { word: 'GROUND', instruction: 'Feel your feet on the floor.\nFeel the chair or surface beneath you.\nYou are here.' },
  { word: 'SAFE', instruction: 'Right now, in this moment,\nyou are physically safe.\nThe feeling will pass.' },
  { word: 'HERE', instruction: 'Name one thing you can see.\nThat is enough for now.' },
];
var _qeIdx = 0;
function openQE() {
  _qeIdx = 0;
  setQEStep(0);
  document.getElementById('qe-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeQE() {
  document.getElementById('qe-overlay').classList.remove('open');
  document.body.style.overflow = '';
}
function setQEStep(idx) {
  var step = QE_STEPS[idx] || QE_STEPS[0];
  var wEl = document.getElementById('qe-word');
  var iEl = document.getElementById('qe-instruction');
  if (wEl) wEl.textContent = step.word;
  if (iEl) iEl.textContent = step.instruction;
}
function qeStep(type) {
  var map = { ground: 1, safe: 2, here: 3 };
  _qeIdx = map[type] || 0;
  setQEStep(_qeIdx);
}

// ═══════════════════════════════════════════════════════════
// FEATURE 4 — POST-IGNITE DEBRIEF
// ═══════════════════════════════════════════════════════════
function saveDebrief() {
  var entry = {
    date:     new Date().toISOString().split('T')[0],
    at:       new Date().toISOString(),
    done:     document.getElementById('deb-done').value.trim(),
    lost:     document.getElementById('deb-lost').value.trim(),
    tomorrow: document.getElementById('deb-tomorrow').value.trim(),
  };
  if (!entry.done && !entry.lost && !entry.tomorrow) { showToast('⚠️ Add at least one field'); return; }
  var list = HQSafe.store.get(FB_DEBRIEF, []);
  list.unshift(entry);
  if (list.length > 30) list = list.slice(0, 30);
  HQSafe.store.set(FB_DEBRIEF, list);
  ['deb-done','deb-lost','deb-tomorrow'].forEach(function(id) {
    var el = document.getElementById(id); if (el) el.value = '';
  });
  showToast('🔥 Debrief saved!');
}

// ═══════════════════════════════════════════════════════════
// FEATURE 5 — CRISIS HISTORY LOG
// ═══════════════════════════════════════════════════════════
function saveCrisisEntry() {
  var what   = document.getElementById('crisis-what').value.trim();
  var helped = document.getElementById('crisis-helped').value.trim();
  if (!what && !helped) { showToast('⚠️ Add at least one field'); return; }
  var list = HQSafe.store.get(FB_CRISIS, []);
  list.unshift({ date: new Date().toISOString().split('T')[0], at: new Date().toISOString(), what: what, helped: helped });
  if (list.length > 50) list = list.slice(0, 50);
  HQSafe.store.set(FB_CRISIS, list);
  document.getElementById('crisis-what').value = '';
  document.getElementById('crisis-helped').value = '';
  renderCrisisLog();
  showToast('📖 Logged!');
}
function renderCrisisLog() {
  var el = document.getElementById('crisis-log-list');
  if (!el) return;
  var list = HQSafe.store.get(FB_CRISIS, []);
  if (!list.length) {
    el.innerHTML = '<div style="font-size:11px;color:var(--muted);font-style:italic;text-align:center;padding:12px">No entries yet. Each one is proof you\'ve gotten through hard things.</div>';
    return;
  }
  el.innerHTML = list.map(function(e) {
    return '<div class="crisis-entry">'
      + '<div class="crisis-date">' + fbEsc(e.date)
      + '<button onclick="deleteCrisisEntry(\'' + e.at + '\')" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:10px">✕</button></div>'
      + (e.what   ? '<div class="crisis-what">🌀 ' + fbEsc(e.what) + '</div>' : '')
      + (e.helped ? '<div class="crisis-helped">✅ ' + fbEsc(e.helped) + '</div>' : '')
      + '</div>';
  }).join('');
}
function deleteCrisisEntry(at) {
  var list = HQSafe.store.get(FB_CRISIS, []).filter(function(e) { return e.at !== at; });
  HQSafe.store.set(FB_CRISIS, list);
  renderCrisisLog();
}

// ═══════════════════════════════════════════════════════════
// FEATURE 6 — ACHIEVEMENTS HIGHLIGHTS
// ═══════════════════════════════════════════════════════════
function renderAchievements() {
  // Wins
  var wins = [];
  try { wins = HQSafe.store.get(HQKeys.WINS, []); } catch(e) {}
  var dumpWins = [];
  try { var dump = HQSafe.store.get(HQKeys.BRAINDUMP, []);
    dumpWins = dump.filter(function(e) { return e.route === 'win'; }); } catch(e) {}
  var allWins = wins.concat(dumpWins).sort(function(a,b) {
    return new Date(b.at || b.date) - new Date(a.at || a.date);
  });

  // Check-ins
  var checkins = [];
  try { checkins = HQSafe.store.get(HQKeys.CHECKIN_LOG, []); } catch(e) {}
  var goodDays = checkins.filter(function(c) { return (c.mood >= 4 || c.energy >= 4); });
  var goodPct  = checkins.length ? Math.round(goodDays.length / checkins.length * 100) : 0;

  // Stats
  var achWins = document.getElementById('ach-wins');
  var achCI   = document.getElementById('ach-checkins');
  var achGD   = document.getElementById('ach-good-days');
  if (achWins) achWins.textContent = allWins.length;
  if (achCI)   achCI.textContent   = checkins.length;
  if (achGD)   achGD.textContent   = goodDays.length;

  var pctEl = document.getElementById('ach-good-pct');
  if (pctEl) pctEl.textContent = checkins.length ? goodPct + '% of check-ins' : '';

  // Recent wins list
  var wEl = document.getElementById('ach-wins-list');
  if (wEl) {
    if (!allWins.length) {
      wEl.innerHTML = '<div style="font-size:11px;color:var(--muted);font-style:italic;padding:8px 0">No wins logged yet. Log one from Thought Jar — showered, made food, sent that email. All count.</div>';
    } else {
      wEl.innerHTML = allWins.slice(0, 10).map(function(w) {
        var text = w.text || w.note || '';
        var dateStr = (w.at || w.date || '').slice(0, 10);
        return '<div class="ach-win-item"><span style="flex-shrink:0">🏆</span><div style="flex:1">'
          + '<div>' + fbEsc(text.slice(0, 120)) + (text.length > 120 ? '…' : '') + '</div>'
          + '<div style="font-size:9px;color:var(--muted);margin-top:2px">' + dateStr + '</div>'
          + '</div></div>';
      }).join('');
    }
  }

  // Good days list
  var gdEl = document.getElementById('ach-good-days-list');
  if (gdEl) {
    if (!goodDays.length) {
      gdEl.innerHTML = '<div style="font-size:11px;color:var(--muted);font-style:italic;padding:8px 0">No good days logged yet — they\'re coming.</div>';
    } else {
      var recent = goodDays.slice(0, 8);
      gdEl.innerHTML = '<div style="display:flex;flex-wrap:wrap;gap:6px">'
        + recent.map(function(c) {
          return '<span style="padding:4px 10px;background:rgba(6,214,160,.1);border:1px solid rgba(6,214,160,.25);border-radius:7px;font-size:11px;color:var(--green)">'
            + (c.mood >= 4 ? '😊' : '') + (c.energy >= 4 ? '⚡' : '') + ' ' + c.date
            + '</span>';
        }).join('') + '</div>';
    }
  }
}

// ═══════════════════════════════════════════════════════════
// FEATURE 7 — CUSTOM QUOTES
// ═══════════════════════════════════════════════════════════
function renderCustomQuotes() {
  var el   = document.getElementById('custom-quotes-list');
  if (!el) return;
  var list = HQSafe.store.get(FB_CQ, []);
  if (!list.length) {
    el.innerHTML = '<div style="font-size:11px;color:var(--muted);font-style:italic;padding:6px 0">No custom quotes yet. Add a truth, a reminder, or someone\'s words that ground you.</div>';
    return;
  }
  el.innerHTML = list.map(function(q, i) {
    return '<div class="cq-item">💬 ' + fbEsc(q)
      + '<button class="cq-del" onclick="deleteCQ(' + i + ')">✕</button></div>';
  }).join('');
}
function addCustomQuote() {
  var inp = document.getElementById('cq-input');
  var val = (inp.value || '').trim();
  if (!val) return;
  var list = HQSafe.store.get(FB_CQ, []);
  list.unshift(val);
  if (list.length > 50) list = list.slice(0, 50);
  HQSafe.store.set(FB_CQ, list);
  inp.value = '';
  renderCustomQuotes();
  showToast('💬 Added!');
}
function deleteCQ(idx) {
  var list = HQSafe.store.get(FB_CQ, []);
  list.splice(idx, 1);
  HQSafe.store.set(FB_CQ, list);
  renderCustomQuotes();
}

// ═══════════════════════════════════════════════════════════
// HOOK sw() FOR NEW TABS + INIT
// ═══════════════════════════════════════════════════════════
var _fbOrigSw = window.sw;
window.sw = function(id, btn) {
  if (typeof _fbOrigSw === 'function') _fbOrigSw(id, btn);
  if (id === 'playbook')  { renderCrisisLog(); renderCustomQuotes(); }
  if (id === 'rising-me') { renderAchievements(); }
};

// Init
renderWarnings();
renderTrustedPeople();
renderCustomQuotes();
renderCrisisLog();

// ===== INIT =====
buildMantras();
try{const m=HQSafe.store.get(HQKeys.FB_MISSION);if(m)document.getElementById('m-in').value=m;}catch(e){}