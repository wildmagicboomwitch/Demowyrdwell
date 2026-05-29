// ============================================================
//  CHECK-IN — AuDHD HQ (rebuilt)
//  FIXES: button clicks, saveCheckin wrapper removed,
//         done-banner guard, new mood/feeling system,
//         body chips expanded, workday grayout (not hide)
//
//  PHASE 8 STEP 1 — complete-record log entries
//    Every saved entry now embeds:
//      healthSnapshot  — mood/energy/sensory/anxiety/bodyTags/sleep/headache/migraine
//      walkingSnapshot — walked/miles/totalToday/annualGoal/dailyPace/goalHit
//      medLog          — taken[]/total snapshot from audhd-hq-med-log at save time
//      isWorkday       — boolean resolved at save time
//      weekKey         — ISO YYYY-Www
//      monthKey        — YYYY-MM
// ============================================================

// ── STORAGE KEY MIGRATION SHIM ───────────────────────────────────────────
(function migrateCheckinKey(){
  if(HQSafe.store.get(HQKeys.CHECKIN_MIG_V3)) return;
  ['hq-checkin-log'].forEach(function(oldKey){
    const old = HQSafe.store.get(oldKey);
    if(old && !HQSafe.store.get(HQKeys.CHECKIN_LOG)){
      HQSafe.store.set(HQKeys.CHECKIN_LOG, old);
    }
    HQSafe.store.remove(oldKey);
  });
  try {
    const arr_ck = HQSafe.store.get(HQKeys.CHECKIN_LOG, null);
    if(arr_ck){
      const arr = Array.isArray(arr_ck) ? arr_ck : [];
      let changed = false;
      arr.forEach(function(e){
        if(e.timeSlot === 'workeve'){
          e.timeSlot = 'end-of-day';
          e.timeSlotLabel = 'End of Day';
          e.timeSlotEmoji = '🌆';
          changed = true;
        }
      });
      if(changed) HQSafe.store.set(HQKeys.CHECKIN_LOG, arr);
    }
  } catch(e){}
  HQSafe.store.set(HQKeys.CHECKIN_MIG_V3, '1');
})();
// FIX-03: ensure tag migrations have run before consuming tag data
if (window.HQMigrate) HQMigrate.run('tags');

// ── STORAGE KEYS ─────────────────────────────────────────────────────────
const STORE   = HQKeys.CHECKIN_LOG;
const H_STORE = HQKeys.HEALTH;
const W_STORE = HQKeys.WINS;
const MISSED_KEY = HQKeys.MISSED_CHECKINS;

let checkins = [];
let mood = 0, energy = 0, sleepQ = 0, workDay = 0;
let activeSlot = '';
// New feeling system
let feelingTone = ''; // 'bad' | 'blah' | 'fine' | 'good' | 'great'
let feelingTags = []; // sub-tags
let captureType  = 'note';     // 'note' | 'win' | 'worry' | 'reminder'
let captureRoute = 'jar-only'; // 'jar-only' | 'weekly' | 'monthly' | 'health'

// Local date helper — avoids UTC rollover bug (10pm EST = next UTC day)
function localDateStr(d) {
  var _d = d || new Date();
  return _d.getFullYear() + '-' +
    String(_d.getMonth() + 1).padStart(2, '0') + '-' +
    String(_d.getDate()).padStart(2, '0');
}
const today = localDateStr();

// ── SLOT CONFIG ───────────────────────────────────────────────────────────
const SLOTS_WORKDAY = [
  {id:'morning',          label:'Early Morning', emoji:'🌅', color:'morning'},
  {id:'start-of-workday', label:'Start of Shift',emoji:'💼', color:'morning'},
  {id:'afternoon',        label:'Afternoon',     emoji:'🌤️', color:'afternoon'},
  {id:'end-of-day',       label:'End of Day',    emoji:'🌆', color:'afternoon'},
  {id:'evening',          label:'Evening',       emoji:'🌙', color:'evening'},
  {id:'midnight',         label:'Midnight',      emoji:'🌑', color:'evening'},
];
const SLOTS_NONWORKDAY = [
  {id:'morning',          label:'Early Morning', emoji:'🌅', color:'morning'},
  {id:'midday',           label:'Mid-Morning',   emoji:'☀️',  color:'morning'},
  {id:'afternoon',        label:'Afternoon',     emoji:'🌤️', color:'afternoon'},
  {id:'end-of-day',       label:'End of Day',    emoji:'🌆', color:'afternoon'},
  {id:'evening',          label:'Evening',       emoji:'🌙', color:'evening'},
  {id:'midnight',         label:'Midnight',      emoji:'🌑', color:'evening'},
];
// Overnight / night-shift slot labels (workday on overnight schedule)
const SLOTS_OVERNIGHT = [
  {id:'evening',          label:'Pre-Shift',     emoji:'🌆', color:'afternoon'},
  {id:'start-of-workday', label:'Start of Shift',emoji:'🌙', color:'evening'},
  {id:'midnight',         label:'Midnight',      emoji:'🌑', color:'evening'},
  {id:'morning',          label:'Early Hours',   emoji:'🌅', color:'morning'},
  {id:'end-of-day',       label:'End of Shift',  emoji:'☀️',  color:'morning'},
  {id:'aftershift',       label:'After Shift',   emoji:'😴', color:'afternoon'},
];
const SLOTS = {
  'morning':          {label:'Early Morning', emoji:'🌅', color:'morning'},
  'midday':           {label:'Mid-Morning',   emoji:'☀️',  color:'morning'},
  'start-of-workday': {label:'Start of Shift',emoji:'💼', color:'morning'},
  'afternoon':        {label:'Afternoon',     emoji:'🌤️', color:'afternoon'},
  'end-of-day':       {label:'End of Day',    emoji:'🌆', color:'afternoon'},
  'evening':          {label:'Evening',       emoji:'🌙', color:'evening'},
  'midnight':         {label:'Midnight',      emoji:'🌑', color:'evening'},
  'aftershift':       {label:'After Shift',   emoji:'😴', color:'afternoon'},
};

// ── WORKDAY RESOLUTION ────────────────────────────────────────────────────
let _isWorkday = null;
function resolveWorkday(){
  if(_isWorkday !== null) return _isWorkday;
  const todayDate = new Date(today + 'T12:00:00');
  if(window.HQWorkday && typeof window.HQWorkday.isWorkday === 'function'){
    _isWorkday = window.HQWorkday.isWorkday(todayDate);
    return _isWorkday;
  }
  try{
    const pf = HQSafe.store.get(HQKeys.PROFILE, {});
    if(Array.isArray(pf.workdays) && pf.workdays.length){
      _isWorkday = pf.workdays.includes(todayDate.getDay());
      return _isWorkday;
    }
  }catch(e){}
  const dow = todayDate.getDay();
  _isWorkday = dow >= 1 && dow <= 5;
  return _isWorkday;
}

// ── SECTION VISIBILITY ────────────────────────────────────────────────────
// ── SURVIVAL MODE ADAPTATION ────────────────────────────────────────────────
// In survival mode, hide optional sections to reduce cognitive load.
// Floor sections kept: presets, feeling, mood, energy, body.
// Hidden: sleep, work-time, stressor, walk, notes.
var _survivalHiddenSections = ['sec-sleep', 'sec-work-time', 'sec-stressor', 'sec-walk', 'sec-notes'];

function applySurvivalVisibility() {
  var inSurvival = window.HQEnvironment && HQEnvironment.isSurvival();
  _survivalHiddenSections.forEach(function(id) {
    var el = document.getElementById(id);
    if (!el) return;
    if (inSurvival) {
      el.setAttribute('data-survival-hidden', '1');
      el.style.display = 'none';
    } else if (el.getAttribute('data-survival-hidden') === '1') {
      el.removeAttribute('data-survival-hidden');
      el.style.display = '';
    }
  });
}

function updateSectionVisibility(){
  var sleepSec = document.getElementById('sec-sleep');
  var workSec  = document.getElementById('sec-work-time');

  // If a mode is active, conditionally-visible sections (sleep/work) are
  // controlled by the mode; only apply slot logic when mode allows them.
  var modeShowsSleep = !_activeMode || (_activeMode.sections && _activeMode.sections.includes('sleep'));
  var modeShowsWork  = !_activeMode || (_activeMode.sections && _activeMode.sections.includes('work'));

  if(!activeSlot){
    if(sleepSec && modeShowsSleep) sleepSec.style.display = '';
    if(workSec  && modeShowsWork)  workSec.style.display  = '';
    return;
  }

  // Sleep section: only on morning slot (and only if mode allows it)
  if(sleepSec){
    if(!modeShowsSleep){
      sleepSec.style.display = 'none'; // mode already hiding it via .mode-hidden
    } else {
      sleepSec.style.display = (activeSlot === 'morning') ? '' : 'none';
    }
  }

  // Workday section
  if(workSec){
    if(!modeShowsWork){
      workSec.style.display = 'none';
    } else {
      var isWD = resolveWorkday();
      var isWorkSlot = (activeSlot === 'start-of-workday') || (activeSlot === 'morning' && isWD);
      if(isWorkSlot){
        workSec.style.display = '';
        if(isWD){
          workSec.style.opacity = '1';
          workSec.style.pointerEvents = 'auto';
          workSec.title = '';
        } else {
          workSec.style.opacity = '0.35';
          workSec.style.pointerEvents = 'none';
          workSec.title = 'Not a workday';
        }
      } else {
        workSec.style.display = 'none';
      }
    }
  }
  updateAMChecks();
}

// ── LOAD / PERSIST ────────────────────────────────────────────────────────
function load(){
  try{const _loaded=HQSafe.store.get(STORE);if(Array.isArray(_loaded))checkins=_loaded;}catch(e){checkins=[];}
}
function persist(){
  HQSafe.store.set(STORE, checkins);
  const todayEntries = checkins.filter(c => safeDate(c) === today);
  HQSafe.store.set('audhd-hq-checkin-' + today, todayEntries);
}
const uid = () => HQUtils.uid(); // → HQUtils.uid

function safeDate(entry){
  if(entry.date) return entry.date;
  if(entry.at)   return entry.at.split('T')[0];
  return null;
}
function entryKey(entry){
  const d = safeDate(entry)||'';
  const s = entry.timeSlot||'';
  return s ? `${d}__${s}` : d;
}
function todaySlotKey(slot){ return `${today}__${slot}`; }

// ── SELECTORS / LABELS ────────────────────────────────────────────────────
const MOOD_LABELS  = ['','Very Low','Low','Okay','Good','Great'];
const MOOD_EMOJIS  = ['','😭','😔','😐','🙂','🤩'];
const ENERGY_LABELS= ['','Empty','Low','Okay','Good','High'];
const ENERGY_EMOJIS= ['','🪫','😴','😐','😊','🚀'];

// ── NEW FEELING TONE SYSTEM ───────────────────────────────────────────────
const FEELING_CONFIG = {
  bad:  { label:'Bad',   emoji:'😣', color:'#EF5886' },
  blah: { label:'Blah',  emoji:'😶', color:'#C96020' },
  fine: { label:'Fine',  emoji:'😐', color:'#C49A00' },
  good: { label:'Good',  emoji:'🙂', color:'#2A8A85' },
  great:{ label:'Great', emoji:'🤩', color:'#2A7A4E' },
};

const FEELING_SUBTAGS = {
  bad:  { label:'If Bad / Blah', multi:true, tags:['😤 Angry','😞 Depressed','😰 Anxious','🤒 Sick','😶 Shutdown-y','🔥 Burnout','🧠 Brain Fog'] },
  blah: { label:'If Bad / Blah', multi:true, tags:['😤 Angry','😞 Depressed','😰 Anxious','🤒 Sick','😶 Shutdown-y','🔥 Burnout','🧠 Brain Fog'] },
  good: { label:'If Good / Great', multi:true, tags:['⚡ Energized','🎉 Excited','✅ Accomplished','😌 Chillin\''] },
  great:{ label:'If Good / Great', multi:true, tags:['⚡ Energized','🎉 Excited','✅ Accomplished','😌 Chillin\''] },
};

function selFeelingTone(tone){
  feelingTone = tone;
  feelingTags = [];

  // Highlight selected tone button
  document.querySelectorAll('.feeling-tone-btn').forEach(function(b){
    const isMe = b.dataset.tone === tone;
    b.classList.toggle('sel', isMe);
  });

  // Update sub-tags section
  const subSection = document.getElementById('feeling-sub-section');
  const subLabel   = document.getElementById('feeling-sub-label');
  const subChips   = document.getElementById('feeling-sub-chips');
  if(!subSection) return;

  const cfg = FEELING_SUBTAGS[tone];
  if(cfg){
    subLabel.textContent = cfg.label;
    subChips.innerHTML = cfg.tags.map(function(tag){
      return '<button class="feeling-sub-chip" data-tag="' + tag + '" onclick="togFeelingTag(this)">' + tag + '</button>';
    }).join('');
    subSection.style.display = '';
  } else {
    subSection.style.display = 'none';
    subChips.innerHTML = '';
  }

  document.getElementById('sec-feeling').classList.add('active');
}

function togFeelingTag(btn){
  const tag = btn.dataset.tag;
  btn.classList.toggle('sel');
  if(btn.classList.contains('sel')){
    if(!feelingTags.includes(tag)) feelingTags.push(tag);
  } else {
    feelingTags = feelingTags.filter(function(t){ return t !== tag; });
  }
}

// ── PHASE 8 STEP 3: CHECKIN MODE PRESETS ─────────────────────────────────

// Map checkin-section key → DOM element id
const SECTION_IDS = {
  feeling:  'sec-feeling',
  mood:     'sec-mood',
  energy:   'sec-energy',
  body:     'sec-body',
  walk:     'sec-walk',
  sleep:    'sec-sleep',
  work:     'sec-work-time',
  notes:    'sec-notes',
  meds:     'sec-meds-confirm',
  stressor: 'sec-stressor',
};
// Sections that have their own conditional visibility logic (updateSectionVisibility handles these)
// When a mode hides them we still defer to mode; when mode shows them the existing logic takes over
const CONDITIONALLY_VISIBLE = new Set(['sleep','work','meds']);

// Active mode state
let _activeMode = null; // null = "All" / no filter

// Built-in fallback presets (match BUILTIN_PRESET_DEFS in health-tracker.js)
const BUILTIN_MODES = [
  {id:'full',      label:'Full Check-In',     emoji:'📋', quickEntry:false, sections:['feeling','mood','energy','body','walk','sleep','work','notes','meds','stressor'], defaults:{}},
  {id:'morning',   label:'Morning Quick',     emoji:'🌅', quickEntry:true,  sections:['feeling','energy','sleep','meds'],                                              defaults:{}},
  {id:'evening',   label:'Evening Wind-Down', emoji:'🌙', quickEntry:false, sections:['mood','feeling','body','notes','stressor'],                                     defaults:{energy:2}},
  {id:'symptom',   label:'Symptom Day',       emoji:'🩺', quickEntry:false, sections:['feeling','body','stressor','notes'],                                           defaults:{feelingTone:'bad'}},
];

function _getCheckinModes(){
  // Read user-defined presets from health setup
  var userModes = [];
  try{
    var parsed=HQSafe.store.get(HQKeys.HEALTH_SETUP, null);
    if(parsed){
      if(parsed && typeof parsed === 'object'){
      // only accept array of objects (Phase 8 schema); ignore legacy string arrays
      if(Array.isArray(parsed.checkinPresets) && parsed.checkinPresets.length > 0
         && typeof parsed.checkinPresets[0] === 'object'){
        userModes = parsed.checkinPresets;
      }
      }
    }
  }catch(e){}
  return {builtin: BUILTIN_MODES, user: userModes, all: BUILTIN_MODES.concat(userModes)};
}

function renderCheckinModePicker(){
  var bar = document.getElementById('checkin-mode-bar');
  if(!bar) return;
  var modes = _getCheckinModes();
  // Always show "All" option first (no mode filter)
  var allBtn = `<button class="ci-mode-btn${!_activeMode?' active':''}" onclick="applyCheckinMode(null)" title="Show all sections">
    <span class="mico">✅</span><span class="mlbl">All Sections</span>
  </button>`;
  var builtinBtns = modes.builtin.map(function(m){
    var active = _activeMode && _activeMode.id === m.id;
    return `<button class="ci-mode-btn builtin${active?' active':''}" onclick="applyCheckinMode('${m.id}','builtin')" title="${m.label}">
      <span class="mico">${m.emoji}</span>
      <span class="mlbl">${m.label}</span>
      ${m.quickEntry?'<span class="mqk">⚡ quick</span>':''}
    </button>`;
  }).join('');
  var userBtns = modes.user.map(function(m){
    var active = _activeMode && _activeMode.id === m.id;
    return `<button class="ci-mode-btn custom${active?' active':''}" onclick="applyCheckinMode('${m.id}','custom')" title="${m.label}">
      <span class="mico">${m.emoji}</span>
      <span class="mlbl">${m.label}</span>
      ${m.quickEntry?'<span class="mqk">⚡ quick</span>':''}
    </button>`;
  }).join('');
  var editLink = `<a href="health-tracker.html#setup" style="display:flex;flex-direction:column;align-items:center;gap:3px;padding:8px 11px;border-radius:11px;border:1px dashed var(--border);background:none;color:var(--muted);font-size:10px;font-weight:800;cursor:pointer;white-space:nowrap;flex-shrink:0;text-decoration:none;min-width:60px;text-align:center">
    <span style="font-size:18px">⚙️</span><span style="font-size:9px">Manage</span>
  </a>`;
  // Active mode banner
  var banner = '';
  if(_activeMode){
    banner = `<div class="ci-mode-banner">
      <span><span class="cmb-name">${_activeMode.emoji} ${_activeMode.label}</span> mode active — sections filtered</span>
      <button class="cmb-clear" onclick="applyCheckinMode(null)">✕ Clear</button>
    </div>`;
  }
  bar.innerHTML = `<div class="ci-mode-bar-label">📋 Check-in Mode</div>
    <div class="ci-mode-row">${allBtn}${builtinBtns}${userBtns}${editLink}</div>
    ${banner}`;
}

function applyCheckinMode(id, source){
  if(id === null){
    // Reset: show all sections
    _activeMode = null;
    Object.values(SECTION_IDS).forEach(function(elId){
      var el = document.getElementById(elId);
      if(el) el.classList.remove('mode-hidden');
    });
    renderCheckinModePicker();
    updateSectionVisibility(); // re-apply slot-based rules
    return;
  }
  var modes = _getCheckinModes();
  var preset = (source==='custom' ? modes.user : modes.builtin).find(function(m){return m.id===id;});
  if(!preset) preset = modes.all.find(function(m){return m.id===id;});
  if(!preset) return;

  _activeMode = preset;

  // Apply section visibility
  Object.keys(SECTION_IDS).forEach(function(key){
    var el = document.getElementById(SECTION_IDS[key]);
    if(!el) return;
    var shown = preset.sections.includes(key);
    if(shown){
      el.classList.remove('mode-hidden');
    } else {
      el.classList.add('mode-hidden');
    }
  });

  // Apply default values if set
  if(preset.defaults){
    var d = preset.defaults;
    if(d.mood && typeof selMood==='function') selMood(d.mood);
    if(d.energy && typeof selEnergy==='function') selEnergy(d.energy);
    if(d.feelingTone && typeof selFeelingTone==='function') selFeelingTone(d.feelingTone);
    if(d.walked){
      var walkToggle=document.querySelector('.walk-toggle');
      if(walkToggle && typeof togWalk==='function') togWalk(walkToggle.closest('[id]')||walkToggle);
    }
  }

  // Re-apply slot-based conditional rules for sections the mode shows
  updateSectionVisibility();

  renderCheckinModePicker();

  // Quick entry: auto-scroll to first visible section after a short delay
  if(preset.quickEntry){
    setTimeout(function(){
      var firstKey = preset.sections[0];
      var firstEl = document.getElementById(SECTION_IDS[firstKey]||'');
      if(firstEl) firstEl.scrollIntoView({behavior:'smooth', block:'start'});
    }, 200);
  }

  showToast(preset.emoji+' '+preset.label+' mode applied');
}

// ── QUICK PRESETS ─────────────────────────────────────────────────────────

// Default preset data (mood/energy + feeling-tone mapping for built-ins)
const PRESET_FEEL_MAP = {
  depressed: { feelingTone:'bad',  feelingTags:['😞 Depressed','🧠 Brain Fog','😶 Shutdown-y'], chips:['😴 Fatigue','🧠 Brain Fog','😶 Shutdown-y'], sensory:2, anxiety:2 },
  anxious:   { feelingTone:'bad',  feelingTags:['😰 Anxious','🧠 Brain Fog'], chips:['😰 Anxiety high','🧠 Brain Fog'], sensory:4, anxiety:4 },
  okay:      { feelingTone:'fine', feelingTags:[], chips:[], sensory:3, anxiety:2 },
  good:      { feelingTone:'good', feelingTags:['✅ Accomplished','😌 Chillin\''], chips:['✨ Feeling good','😌 Calm'], sensory:2, anxiety:1 },
};

function _getStoredPresets(){
  try{
    const arr=HQSafe.store.get(HQKeys.CHECKIN_PRESETS, null); if(Array.isArray(arr)&&arr.length) return arr;
  }catch(e){}
  return [
    {id:'depressed',label:'Depressed',emoji:'🌑',mood:1,energy:1,core:true},
    {id:'anxious',  label:'Anxious',  emoji:'😰',mood:2,energy:2,core:true},
    {id:'okay',     label:'Just Okay',emoji:'😐',mood:3,energy:3,core:false},
    {id:'good',     label:'Good Day', emoji:'✨',mood:4,energy:4,core:false},
  ];
}

function renderQuickPresets(){
  const container = document.getElementById('quick-presets-row');
  if(!container) return;
  const presets = _getStoredPresets();
  container.innerHTML = presets.map(function(p){
    return '<button class="preset-btn" onclick="applyPreset(\''+p.id+'\')" title="'+p.label+'">'+
      '<span class="preset-ico">'+p.emoji+'</span>'+
      '<span class="preset-lbl">'+p.label+'</span>'+
    '</button>';
  }).join('');
}

function applyPreset(idOrLegacyName){
  const presets = _getStoredPresets();
  const p = presets.find(function(pr){ return pr.id===idOrLegacyName; });
  if(!p) return;
  selMood(p.mood);
  selEnergy(p.energy);
  // Apply feeling tone from built-in map if available, else pick by mood level
  const feel = PRESET_FEEL_MAP[p.id] || _inferFeel(p.mood);
  selFeelingTone(feel.feelingTone);
  setTimeout(function(){
    document.querySelectorAll('.feeling-sub-chip').forEach(function(btn){
      if(feel.feelingTags.includes(btn.dataset.tag)){
        btn.classList.add('sel');
        if(!feelingTags.includes(btn.dataset.tag)) feelingTags.push(btn.dataset.tag);
      }
    });
  }, 50);
  if(feel.sensory) selSensory(feel.sensory);
  if(feel.anxiety) selAnxiety(feel.anxiety);
  document.querySelectorAll('.chip').forEach(function(c){ c.classList.remove('on'); });
  (feel.chips||[]).forEach(function(label){
    document.querySelectorAll('.chip').forEach(function(c){
      if(c.textContent.trim()===label) c.classList.add('on');
    });
  });
  showToast(p.emoji+' '+p.label+' preset applied');
  const secFeeling = document.getElementById('sec-feeling');
  if(secFeeling) secFeeling.scrollIntoView({behavior:'smooth'});
}

function _inferFeel(mood){
  if(mood<=2) return {feelingTone:'bad',  feelingTags:[], chips:[], sensory:3, anxiety:3};
  if(mood===3) return {feelingTone:'fine', feelingTags:[], chips:[], sensory:3, anxiety:2};
  return            {feelingTone:'good', feelingTags:[], chips:[], sensory:2, anxiety:1};
}

// ── MOOD / ENERGY / SLEEP SELECTORS ──────────────────────────────────────
function selMood(n){
  mood = n;
  document.querySelectorAll('.mood-btn').forEach(function(b){
    b.classList.toggle('sel', +b.dataset.m === n);
  });
  const sec = document.getElementById('sec-mood');
  if(sec) sec.classList.add('active');
}

function selEnergy(n){
  energy = n;
  document.querySelectorAll('.energy-btn[data-e]').forEach(function(b){
    b.classList.toggle('sel', +b.dataset.e === n);
  });
  const lbl = document.getElementById('energy-label');
  if(lbl) lbl.textContent = ENERGY_LABELS[n] || '';
  const sec = document.getElementById('sec-energy');
  if(sec) sec.classList.add('active');
}

function selSleepQ(n){
  sleepQ = n;
  document.querySelectorAll('[data-q]').forEach(function(b){
    b.classList.toggle('sel', +b.dataset.q === n);
  });
}

function tog(btn){ btn.classList.toggle('on'); }

function selWorkDay(n){
  workDay = n;
  document.querySelectorAll('.wd-btn[data-w]').forEach(function(b){
    b.classList.toggle('sel', +b.dataset.w === n);
  });
}

function togLate(btn){ btn.classList.toggle('late-on'); }

function togCB(id, row){
  const cb = document.getElementById(id);
  if(!cb) return;
  cb.checked = !cb.checked;
  row.classList.toggle('checked', cb.checked);
}

// ── WALK TOGGLE ───────────────────────────────────────────────────────────
function togWalk(row){
  const cb = document.getElementById('did-walk');
  cb.checked = !cb.checked;
  row.classList.toggle('checked', cb.checked);
  const wrap = document.getElementById('walk-miles-wrap');
  wrap.style.display = cb.checked ? '' : 'none';
  if(!cb.checked) document.getElementById('walk-miles').value = '';
}

// ── CUSTOM BODY CHIP ──────────────────────────────────────────────────────
function addCustomBodyChip(){
  const input = document.getElementById('custom-body-input');
  if(!input) return;
  const val = input.value.trim();
  if(!val){ showToast('⚠️ Enter a symptom first'); return; }
  const chips = document.getElementById('body-chips');
  const btn = document.createElement('button');
  btn.className = 'chip c-pink';
  btn.textContent = '✏️ ' + val;
  btn.onclick = function(){ tog(btn); };
  btn.classList.add('on'); // auto-select on add
  chips.appendChild(btn);
  input.value = '';
  showToast('✅ Added: ' + val);
}

// ── SLOT SELECTOR ─────────────────────────────────────────────────────────
function selSlot(slot){
  activeSlot = slot;
  document.querySelectorAll('.slot-btn').forEach(function(b){
    b.classList.toggle('sel', b.dataset.slot === slot);
  });
  updateSectionVisibility();
  checkSlotDone(slot);
}

function autoDetectSlot(){
  // minutes since midnight — local time only, matches system-wide time bands
  // morning   4:00am–11:29am (240–689)
  // afternoon 11:30am–4:29pm (690–989)
  // evening   4:30pm–9:29pm  (990–1169)
  // night     9:30pm–3:59am  (everything else)
  const _n = new Date();
  const _m = _n.getHours() * 60 + _n.getMinutes();
  const isWD = resolveWorkday();
  if (_m >= 240 && _m < 540)  return 'morning';                          // 4:00–9:00am
  if (_m >= 540 && _m < 690)  return isWD ? 'start-of-workday' : 'midday'; // 9:00–11:30am
  if (_m >= 690 && _m < 930)  return 'afternoon';                        // 11:30am–3:30pm
  if (_m >= 930 && _m < 990)  return 'end-of-day';                       // 3:30–4:30pm
  if (_m >= 990 && _m < 1170) return 'evening';                          // 4:30–9:30pm
  return 'midnight';                                                       // 9:30pm–4:00am
}

function applyWeekdayVisibility(){
  _isWorkday = null;
  if(resolveWorkday()) document.body.classList.add('is-workday','is-weekday');
  else document.body.classList.remove('is-workday','is-weekday');
  renderSlotGrid();
}
function applyWorkdayVisibility(){ applyWeekdayVisibility(); }

function renderSlotGrid(){
  const grid  = document.getElementById('slot-grid');
  const title = document.getElementById('slot-title');
  if(!grid) return;
  const isWD = resolveWorkday();
  // Respect overnight schedule type from profile
  let slots;
  try {
    const pf = HQSafe.store.get(HQKeys.PROFILE, {});
    if(pf.scheduleType === 'overnight' && isWD){
      slots = SLOTS_OVERNIGHT;
    } else {
      slots = isWD ? SLOTS_WORKDAY : SLOTS_NONWORKDAY;
    }
  } catch(e) {
    slots = isWD ? SLOTS_WORKDAY : SLOTS_NONWORKDAY;
  }
  if(title) title.textContent = isWD ? '🕐 When is it? (Work Day)' : '🕐 When is it?';
  grid.innerHTML = slots.map(function(s){
    return '<button class="slot-btn" data-slot="' + s.id + '" onclick="selSlot(\'' + s.id + '\')">'
      + '<div class="slot-done-dot"></div>'
      + '<div class="slot-em">' + s.emoji + '</div>'
      + '<div class="slot-lbl">' + s.label + '</div>'
      + '</button>';
  }).join('');
  if(checkins.length) renderTodaySlotBar();
  if(!activeSlot){ const auto = autoDetectSlot(); selSlot(auto); }
}

function getBodyTags(){
  var standard = [...document.querySelectorAll('#body-chips .chip.on')].map(function(b){ return b.textContent.trim(); });
  var fromWatchlist = [...document.querySelectorAll('#body-chips-watchlist .chip.on')].map(function(b){ return b.textContent.trim(); });
  return [...new Set([...standard, ...fromWatchlist])]; // Phase B: include watchlist selections, deduplicated
}

// ── RENDER HEADER DATE ────────────────────────────────────────────────────
function renderHeader(){
  const d = new Date();
  const DOW = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const el = document.getElementById('hdr-date');
  if(el) el.textContent = DOW[d.getDay()] + ', ' + MON[d.getMonth()] + ' ' + d.getDate();
}

// ── STREAK ────────────────────────────────────────────────────────────────
function renderStreak(){
  let streak = 0;
  const check = new Date();
  for(let i = 0; i < 90; i++){
    const ds = localDateStr(check);
    if(checkins.find(function(c){ return safeDate(c) === ds; })){
      streak++;
      check.setDate(check.getDate()-1);
    } else if(i === 0){
      check.setDate(check.getDate()-1);
    } else break;
  }
  const numEl = document.getElementById('streak-num');
  if(numEl) numEl.textContent = streak;
  const dots = document.getElementById('streak-dots');
  if(!dots) return;
  const dotsHtml = [];
  for(let i = 13; i >= 0; i--){
    const d = new Date(); d.setDate(d.getDate()-i);
    const ds = localDateStr(d);
    const dayEntries = checkins.filter(function(c){ return safeDate(c) === ds; });
    const done = dayEntries.length > 0;
    const multi = dayEntries.length > 1;
    const isToday = ds === today;
    dotsHtml.push('<div class="s-dot' + (done&&isToday?' today-done':done?' done':'') + (multi?' multi':'') + '" title="' + ds + (multi?' ('+dayEntries.length+'x)':'') + '"></div>');
  }
  dots.innerHTML = dotsHtml.join('');
}

// ── TODAY SLOT SUMMARY BAR ────────────────────────────────────────────────
function renderTodaySlotBar(){
  const bar   = document.getElementById('today-slots-bar');
  const items = document.getElementById('tsb-items');
  if(!bar || !items) return;
  const todayEntries = checkins.filter(function(c){ return safeDate(c) === today; });
  if(!todayEntries.length){ bar.classList.remove('has-data'); return; }
  bar.classList.add('has-data');
  const order = Object.keys(SLOTS);
  const sorted = todayEntries.slice().sort(function(a,b){
    return order.indexOf(a.timeSlot||'') - order.indexOf(b.timeSlot||'');
  });
  items.innerHTML = sorted.map(function(c){
    const s = SLOTS[c.timeSlot] || {label:'Check-in',emoji:'⚡',color:''};
    const mStr = c.mood ? MOOD_EMOJIS[c.mood] : '';
    const eStr = c.energy ? ENERGY_EMOJIS[c.energy] : '';
    const walkStr = c.walked ? (' 🚶' + (c.walkMiles ? c.walkMiles+'mi' : '')) : '';
    return '<span class="slot-badge ' + s.color + '">' + s.emoji + ' ' + s.label + (mStr||eStr?' · '+mStr+eStr:'') + walkStr + '</span>';
  }).join('');
  document.querySelectorAll('.slot-btn').forEach(function(b){
    const has = !!checkins.find(function(c){ return safeDate(c) === today && c.timeSlot === b.dataset.slot; });
    b.classList.toggle('has-entry', has);
  });
}

// ── DONE BANNER ───────────────────────────────────────────────────────────
function checkSlotDone(slot){
  const banner = document.getElementById('done-banner');
  if(!banner) return;
  if(!slot){ banner.style.display = 'none'; return; }
  const key = todaySlotKey(slot);
  const existing = checkins.find(function(c){ return entryKey(c) === key; });
  if(existing){
    banner.style.display = 'block';
    const slotCfg = SLOTS[slot] || {label:slot, emoji:'', color:''};
    const slotLbl = document.getElementById('done-slot-label');
    if(slotLbl) slotLbl.textContent = slotCfg.emoji + ' ' + slotCfg.label;
    const parts = [];
    if(existing.mood)    parts.push('<span class="slot-badge ' + slotCfg.color + '">' + MOOD_EMOJIS[existing.mood] + ' ' + MOOD_LABELS[existing.mood] + '</span>');
    if(existing.energy)  parts.push('<span class="slot-badge ' + slotCfg.color + '">' + ENERGY_EMOJIS[existing.energy] + ' ' + ENERGY_LABELS[existing.energy] + '</span>');
    if(existing.sleepHrs)parts.push('<span class="slot-badge ' + slotCfg.color + '">😴 ' + existing.sleepHrs + 'h</span>');
    if(existing.walked)  parts.push('<span class="slot-badge ' + slotCfg.color + '">🚶' + (existing.walkMiles ? existing.walkMiles+'mi' : '') + '</span>');
    const summEl = document.getElementById('done-summary');
    if(summEl) summEl.innerHTML = parts.join('');
    resetForm();
    selMood(existing.mood||0);
    selEnergy(existing.energy||0);
    selSleepQ(existing.sleepQ||0);
    const slpHrs = document.getElementById('sleep-hrs');
    if(slpHrs) slpHrs.value = existing.sleepHrs || '';
    const noteEl = document.getElementById('checkin-note');
    if(noteEl) noteEl.value = existing.note || '';
    const wokeEl = document.getElementById('woke-ontime');
    const workEl = document.getElementById('work-ontime');
    if(wokeEl){ wokeEl.checked = !!existing.wokeOnTime; document.getElementById('cb-woke-row')?.classList.toggle('checked', !!existing.wokeOnTime); }
    if(workEl){ workEl.checked = !!existing.workOnTime; document.getElementById('cb-work-row')?.classList.toggle('checked', !!existing.workOnTime); }
    const lateBtn = document.getElementById('late-btn');
    if(lateBtn) lateBtn.classList.toggle('late-on', !!existing.lateToWork);
    workDay = existing.workDay || 0;
    document.querySelectorAll('.wd-btn[data-w]').forEach(function(b){ b.classList.toggle('sel', +b.dataset.w === workDay); });
    (existing.bodyTags||[]).forEach(function(tag){
      const btn = [...document.querySelectorAll('#body-chips .chip')].find(function(b){ return b.textContent.trim() === tag; });
      if(btn) btn.classList.add('on');
      // Also restore into watchlist chips if the tag matches there
      const wBtn = [...document.querySelectorAll('#body-chips-watchlist .chip')].find(function(b){ return b.textContent.trim() === tag; });
      if(wBtn) wBtn.classList.add('on');
    });
    // Restore feeling tone
    if(existing.feelingTone) selFeelingTone(existing.feelingTone);
    // Restore feeling sub-tags after DOM update
    if(existing.feelingTags && existing.feelingTags.length){
      setTimeout(function(){
        existing.feelingTags.forEach(function(tag){
          document.querySelectorAll('.feeling-sub-chip').forEach(function(b){
            if(b.dataset.tag === tag){ b.classList.add('sel'); if(!feelingTags.includes(tag)) feelingTags.push(tag); }
          });
        });
      }, 50);
    }
    // Restore walk data
    const didWalkCB = document.getElementById('did-walk');
    const walkWrap  = document.getElementById('walk-miles-wrap');
    const walkRow   = document.getElementById('cb-walk-row');
    if(existing.walked && didWalkCB){
      didWalkCB.checked = true;
      if(walkRow) walkRow.classList.add('checked');
      if(walkWrap) walkWrap.style.display = '';
      const walkMilesEl = document.getElementById('walk-miles');
      if(walkMilesEl) walkMilesEl.value = existing.walkMiles || '';
    }
    // Restore sensory / anxiety
    if(existing.sensory) selSensory(existing.sensory);
    if(existing.anxiety) selAnxiety(existing.anxiety);
    // Restore emotional body chips
    if(existing.bodyTags) {
      existing.bodyTags.forEach(function(tag) {
        const btn = [...document.querySelectorAll('#body-chips-emotional .chip')].find(function(b){ return b.textContent.trim() === tag; });
        if(btn) btn.classList.add('on');
      });
    }
    // Restore AM checks
    if(existing.amChecks) {
      var ac = existing.amChecks;
      ['am-meds','am-teeth','am-cat','am-water'].forEach(function(id) {
        var keyMap = {'am-meds':'tookMeds','am-teeth':'brushedTeeth','am-cat':'fedCats','am-water':'hadWater'};
        var cb = document.getElementById(id);
        if(cb && ac[keyMap[id]]){
          cb.checked = true;
          cb.closest('.cb-row')?.classList.add('checked');
        }
      });
    }
    // Restore capture type/route
    if(existing.captureType)  selCaptureType(existing.captureType);
    if(existing.captureRoute) selCaptureRoute(existing.captureRoute);
  } else {
    banner.style.display = 'none';
    resetForm();
  }
}

function editSlot(){
  const banner = document.getElementById('done-banner');
  if(banner) banner.style.display = 'none';
  const secMood = document.getElementById('sec-mood');
  if(secMood) secMood.scrollIntoView({behavior:'smooth'});
}

function resetForm(){
  mood = 0; energy = 0; sleepQ = 0; workDay = 0;
  feelingTone = ''; feelingTags = [];
  document.querySelectorAll('.mood-btn').forEach(function(b){ b.classList.remove('sel'); });
  document.querySelectorAll('.energy-btn[data-e]').forEach(function(b){ b.classList.remove('sel'); });
  document.querySelectorAll('[data-q]').forEach(function(b){ b.classList.remove('sel'); });
  document.querySelectorAll('.wd-btn[data-w]').forEach(function(b){ b.classList.remove('sel'); });
  document.querySelectorAll('#body-chips .chip').forEach(function(b){ b.classList.remove('on'); });
  document.querySelectorAll('#body-chips-watchlist .chip').forEach(function(b){ b.classList.remove('on'); });
  document.querySelectorAll('.feeling-tone-btn').forEach(function(b){ b.classList.remove('sel'); });
  document.querySelectorAll('.feeling-sub-chip').forEach(function(b){ b.classList.remove('sel'); });
  const subSection = document.getElementById('feeling-sub-section');
  if(subSection) subSection.style.display = 'none';
  const energyLbl = document.getElementById('energy-label');
  if(energyLbl) energyLbl.textContent = 'Tap to set';
  const slpHrs = document.getElementById('sleep-hrs');
  if(slpHrs) slpHrs.value = '';
  const noteEl = document.getElementById('checkin-note');
  if(noteEl) noteEl.value = '';
  const walkMilesEl = document.getElementById('walk-miles');
  if(walkMilesEl) walkMilesEl.value = '';
  const didWalk = document.getElementById('did-walk');
  if(didWalk) didWalk.checked = false;
  const walkRow = document.getElementById('cb-walk-row');
  if(walkRow) walkRow.classList.remove('checked');
  const walkWrap = document.getElementById('walk-miles-wrap');
  if(walkWrap) walkWrap.style.display = 'none';
  const wokeEl = document.getElementById('woke-ontime');
  const workEl = document.getElementById('work-ontime');
  if(wokeEl){ wokeEl.checked = false; document.getElementById('cb-woke-row')?.classList.remove('checked'); }
  if(workEl){ workEl.checked = false; document.getElementById('cb-work-row')?.classList.remove('checked'); }
  const lateBtn = document.getElementById('late-btn');
  if(lateBtn) lateBtn.classList.remove('late-on');
  const secMood = document.getElementById('sec-mood');
  if(secMood) secMood.classList.remove('active');
  const secEnergy = document.getElementById('sec-energy');
  if(secEnergy) secEnergy.classList.remove('active');
  // Reset sensory / anxiety labels
  const sensLbl = document.getElementById('sensory-label');
  if(sensLbl) sensLbl.textContent = 'Tap to set';
  const anxLbl = document.getElementById('anxiety-label');
  if(anxLbl) anxLbl.textContent = 'Tap to set';
  document.querySelectorAll('#sensory-btns .energy-btn').forEach(function(b){ b.classList.remove('sel'); });
  document.querySelectorAll('#anxiety-btns .energy-btn').forEach(function(b){ b.classList.remove('sel'); });
  // Reset emotional body chips
  document.querySelectorAll('#body-chips-emotional .chip').forEach(function(b){ b.classList.remove('on'); });
  // Reset AM checks
  ['am-meds','am-teeth','am-cat','am-water'].forEach(function(id){
    const cb = document.getElementById(id);
    if(cb){ cb.checked = false; cb.closest('.cb-row')?.classList.remove('checked'); }
  });
  // Reset capture panel
  resetCapturePanel();
}

// ── SENSORY SENSITIVITY ────────────────────────────────────────────────────
let sensoryLevel = 0;
function selSensory(n){
  sensoryLevel = n;
  const labels = {0:'— N/A',1:'😌 Very low',2:'🙂 Low',3:'😐 Moderate',4:'😣 High',5:'🤯 Very high'};
  const lbl = document.getElementById('sensory-label');
  if(lbl) lbl.textContent = n === 0 ? '— N/A (skipped)' : (labels[n] || 'Tap to set');
  document.querySelectorAll('#sensory-btns .energy-btn').forEach(function(b){
    b.classList.toggle('sel', +b.dataset.s === n);
  });
}

// ── ANXIETY INTENSITY ────────────────────────────────────────────────────
let anxietyLevel = 0;
function selAnxiety(n){
  anxietyLevel = n;
  const labels = {0:'— N/A',1:'😌 Minimal',2:'🙂 Mild',3:'😐 Moderate',4:'😰 High',5:'😱 Severe'};
  const lbl = document.getElementById('anxiety-label');
  if(lbl) lbl.textContent = n === 0 ? '— N/A (skipped)' : (labels[n] || 'Tap to set');
  document.querySelectorAll('#anxiety-btns .energy-btn').forEach(function(b){
    b.classList.toggle('sel', +b.dataset.a === n);
  });
}

// ── CAPTURE PANEL ────────────────────────────────────────────────────────
const CAPTURE_PLACEHOLDERS = {
  note:     "What's on your mind…",
  win:      'What went well? What are you proud of?',
  worry:    "What's worrying you? (Getting it out helps.)",
  reminder: 'What do you need to remember?',
};
const CAPTURE_ROUTE_HINTS = {
  'jar-only': 'Saved to Thought Jar. Viewable and reroutable from there.',
  'weekly':   'Saved to Thought Jar + sent to Weekly Planner inbox.',
  'monthly':  'Saved to Thought Jar + sent to Monthly Planner inbox.',
  'health':   'Saved to Thought Jar + logged in Health Tracker.',
};

function selCaptureType(type) {
  captureType = type;
  document.querySelectorAll('.capture-type-btn').forEach(function(b) {
    b.classList.toggle('active', b.dataset.ctype === type);
  });
  const ta = document.getElementById('checkin-note');
  if (ta) ta.placeholder = CAPTURE_PLACEHOLDERS[type] || "What's on your mind…";
  // Auto-suggest route for wins → jar-only, worries → jar-only
  if (type === 'win' || type === 'note') selCaptureRoute('jar-only');
  if (type === 'reminder') selCaptureRoute('weekly');
}

function selCaptureRoute(route) {
  captureRoute = route;
  document.querySelectorAll('.capture-route-btn').forEach(function(b) {
    b.classList.toggle('active', b.dataset.route === route);
  });
  const hint = document.getElementById('capture-route-hint');
  if (hint) hint.textContent = CAPTURE_ROUTE_HINTS[route] || '';
}

// ── AM CHECKS VISIBILITY ──────────────────────────────────────────────────
function updateAMChecks() {
  const sec = document.getElementById('sec-am-checks');
  if (!sec) return;
  sec.style.display = (activeSlot === 'morning') ? '' : 'none';
}

// ── EMOTIONAL BODY CHIPS ──────────────────────────────────────────────────
function getBodyTagsAll() {
  const tags = [];
  document.querySelectorAll('#body-chips .chip.on, #body-chips-emotional .chip.on, #body-chips-watchlist .chip.on').forEach(function(b) {
    tags.push(b.textContent.trim());
  });
  return [...new Set(tags)]; // deduplicate (watchlist may overlap with physical chips)
}

// ── AM CHECKS READ ────────────────────────────────────────────────────────
function getAMChecks() {
  return {
    tookMeds:  document.getElementById('am-meds')?.checked  || false,
    brushedTeeth: document.getElementById('am-teeth')?.checked || false,
    fedCats:   document.getElementById('am-cat')?.checked   || false,
    hadWater:  document.getElementById('am-water')?.checked || false,
  };
}

// ── ROUTE NOTE THROUGH THOUGHT JAR ───────────────────────────────────────
function routeNoteViaThoughtJar(text, type, route) {
  if (!text) return;
  const DUMP_STORE = HQKeys.BRAINDUMP;
  // Map checkin capture types to Thought Jar entry types
  const typeMap = { note:'thought', win:'win', worry:'worry', reminder:'task' };
  const jarType = typeMap[type] || 'thought';
  const emoji   = { note:'💭', win:'🏆', worry:'😰', reminder:'🔔' }[type] || '💭';

  let entries = [];
  try { entries = HQSafe.store.get(DUMP_STORE, []); } catch(e) {}

  const entry = {
    id: uid(), text: emoji + ' ' + text, type: jarType,
    route: route, date: today, at: new Date().toISOString(), source: 'checkin',
  };
  entries.unshift(entry);
  if (entries.length > 500) entries = entries.slice(0, 500);
  HQSafe.store.set(DUMP_STORE, entries);

  // Secondary routing
  if (route === 'weekly') {
    try {
      const wk = HQSafe.store.get(HQKeys.WEEKLY, {});
      if (!wk.inbox) wk.inbox = [];
      wk.inbox.unshift({
        id: uid(), text: text, type: type === 'reminder' ? 'task' : type,
        date: today, source: 'checkin', at: new Date().toISOString(),
      });
      HQSafe.store.set(HQKeys.WEEKLY, wk);
    } catch(e) {}
  } else if (route === 'monthly') {
    try {
      const month = new Date().toISOString().slice(0, 7);
      const mk = HQSafe.store.get(HQKeys.MONTHLY, {});
      if (!mk[month]) mk[month] = {};
      if (!mk[month].inbox) mk[month].inbox = [];
      mk[month].inbox.unshift({
        id: uid(), text: text, type: type, date: today,
        source: 'checkin', at: new Date().toISOString(),
      });
      HQSafe.store.set(HQKeys.MONTHLY, mk);
    } catch(e) {}
  } else if (route === 'health') {
    try {
      let hdb = HQSafe.store.get(HQKeys.HEALTH, {});
      if (!hdb.notes) hdb.notes = [];
      hdb.notes.unshift({
        id: uid(), text: text, type: type, date: today,
        source: 'checkin', at: new Date().toISOString(),
      });
      HQSafe.store.set(HQKeys.HEALTH, hdb);
    } catch(e) {}
  }

  // Wins go to wins log too
  if (type === 'win') {
    try {
      let wins = HQSafe.store.get(W_STORE, []);
      wins.unshift({ id: uid(), text: text, date: today, at: new Date().toISOString(), source: 'checkin' });
      if (wins.length > 200) wins = wins.slice(0, 200);
      HQSafe.store.set(W_STORE, wins);
    } catch(e) {}
  }
}

// ── CAPTURE RESET ─────────────────────────────────────────────────────────
function resetCapturePanel() {
  captureType  = 'note';
  captureRoute = 'jar-only';
  selCaptureType('note');
  selCaptureRoute('jar-only');
}

// ── SAVE ──────────────────────────────────────────────────────────────────
function saveCheckin(){
  if(!activeSlot){ showToast('⚠️ Pick a time slot first'); return; }
  if(!mood && !energy){ showToast('⚠️ Set at least mood or energy'); return; }

  const note       = (document.getElementById('checkin-note')?.value || '').trim();
  const sleepHrs   = parseFloat(document.getElementById('sleep-hrs')?.value) || 0;
  const bodyTags   = getBodyTagsAll(); // includes both physical + emotional chips
  const wokeOnTime = document.getElementById('woke-ontime')?.checked || false;
  const workOnTime = document.getElementById('work-ontime')?.checked || false;
  const lateToWork = document.getElementById('late-btn')?.classList.contains('late-on') || false;
  const walked     = document.getElementById('did-walk')?.checked || false;
  const walkMiles  = walked ? (parseFloat(document.getElementById('walk-miles')?.value) || 0) : 0;
  const slotCfg    = SLOTS[activeSlot] || {label:activeSlot, emoji:''};

  const amChecks = (activeSlot === 'morning') ? getAMChecks() : null;

  // ── PHASE 8 · COMPLETE RECORD SNAPSHOTS ──────────────────────────────────
  // healthSnapshot — all health-relevant data embedded directly in the entry
  const _headache = bodyTags.some(function(t){ return /headache/i.test(t); });
  const _migraine = bodyTags.some(function(t){ return /migraine/i.test(t); });
  const healthSnapshot = {
    mood:       mood,
    energy:     energy,
    sensory:    sensoryLevel,
    anxiety:    anxietyLevel,
    bodyTags:   bodyTags,
    feelingTone: feelingTone,
    feelingTags: [...feelingTags],
    sleepHrs:   sleepHrs,
    sleepQ:     sleepQ,
    headache:   _headache,
    migraine:   _migraine,
  };

  // walkingSnapshot — walk data + annual goal context captured at save time
  const _walkGoal = (function(){
    try{
      var pf = HQSafe.store.get(HQKeys.PROFILE, {});
      return parseFloat(pf.walkingGoal) || 3100;
    }catch(e){ return 3100; }
  })();
  const _todayWalkTotal = (function(){
    try{
      var wdb = HQSafe.store.get(HQKeys.WALKING, {});
      var prev = (wdb.entries||[])
        .filter(function(e){ return e.date === today; })
        .reduce(function(sum,e){ return sum + (parseFloat(e.miles)||0); }, 0);
      return Math.round((prev + (walked ? walkMiles : 0)) * 100) / 100;
    }catch(e){ return walked ? walkMiles : 0; }
  })();
  const _dailyPace = Math.round((_walkGoal / 365) * 100) / 100;
  const walkingSnapshot = {
    walked:          walked,
    miles:           walkMiles,
    totalTodayMiles: _todayWalkTotal,
    annualGoalMiles: _walkGoal,
    dailyPaceMiles:  _dailyPace,
    goalHit:         walked && _todayWalkTotal >= _dailyPace,
  };

  // medLog — snapshot of which meds are marked taken at time of this check-in
  const medLogSnapshot = (function(){
    try{
      var meds    = HQSafe.store.get(HQKeys.MEDS, []);
      var fullLog = HQSafe.store.get(HQKeys.MED_LOG, {});
      var dayLog  = fullLog[today] || {};
      var taken   = meds
        .filter(function(m){ return !!dayLog[m.id]; })
        .map(function(m){ return { id:m.id, name:m.name, dose:m.dose||null, scheduledTime:m.time||null }; });
      return { taken: taken, total: meds.length };
    }catch(e){ return { taken:[], total:0 }; }
  })();

  // week / month context keys (use hq-core helpers when available)
  const _weekKey  = (typeof hqWeekKey  === 'function') ? hqWeekKey()  : today.slice(0,7);
  const _monthKey = (typeof hqMonthKey === 'function') ? hqMonthKey() : today.slice(0,7);
  // ─────────────────────────────────────────────────────────────────────────

  const entry = {
    id:uid(),
    date:today,
    timeSlot:activeSlot,
    timeSlotLabel:slotCfg.label,
    timeSlotEmoji:slotCfg.emoji,
    mood, energy, sleepQ, sleepHrs,
    bodyTags, note,
    wokeOnTime, workOnTime, lateToWork, workDay,
    walked, walkMiles,
    feelingTone, feelingTags:[...feelingTags],
    sensory: sensoryLevel,
    anxiety: anxietyLevel,
    amChecks: amChecks,
    captureType: captureType,
    captureRoute: captureRoute,
    at: new Date().toISOString(),
    // ── Phase 8: complete-record fields ──
    healthSnapshot:  healthSnapshot,
    walkingSnapshot: walkingSnapshot,
    medLog:          medLogSnapshot,
    isWorkday:       !!resolveWorkday(),
    weekKey:         _weekKey,
    monthKey:        _monthKey,
  };

  const key = todaySlotKey(activeSlot);
  const idx = checkins.findIndex(function(c){ return entryKey(c) === key; });
  if(idx !== -1) checkins[idx] = entry;
  else checkins.unshift(entry);
  persist();

  // Flag-to-index: clear missed flag for this slot
  ciUnflagSlot(activeSlot);
  if(typeof hqUnflag === 'function') hqUnflag('missed-checkin-' + activeSlot);

  // Route walk miles
  if(walked && walkMiles > 0) routeToWalking(entry);

  routeToHealth(entry);
  if(note) routeNoteViaThoughtJar(note, captureType, captureRoute);

  // Write energy state
  if(energy){
    const eLvl = energy <= 2 ? 'low' : energy === 3 ? 'medium' : 'high';
    if(typeof hqWriteEnergyState === 'function'){
      hqWriteEnergyState(eLvl);
    } else {
      try{
        const st = {level:eLvl, ts:Date.now()};
        HQSafe.store.set(HQKeys.ENERGY_STATE, st);
        const hdb = HQSafe.store.get(HQKeys.HEALTH, {});
        if(!hdb.energyLog) hdb.energyLog = [];
        hdb.energyLog.push({level:eLvl, ts:st.ts, source:'checkin'});
        if(hdb.energyLog.length > 180) hdb.energyLog = hdb.energyLog.slice(-180);
        HQSafe.store.set(HQKeys.HEALTH, hdb);
      }catch(eErr){}
    }

    const sug = document.getElementById('survival-suggestion');
    if(sug) sug.style.display = energy <= 2 ? 'block' : 'none';
  }

  // Save sensory to health log
  if(sensoryLevel && sensoryLevel > 0){
    try{
      let hdb = HQSafe.store.get(HQKeys.HEALTH, {});
      if(!hdb.sensory) hdb.sensory = [];
      hdb.sensory = hdb.sensory.filter(function(s){ return s.date !== today; });
      hdb.sensory.unshift({
        date:today, level:sensoryLevel, ts:Date.now(), source:'checkin',
        subcategory:'h-symptoms', subcategoryName:'Symptoms & Conditions',
      });
      if(hdb.sensory.length > 90) hdb.sensory = hdb.sensory.slice(0,90);
      HQSafe.store.set(HQKeys.HEALTH, hdb);
    }catch(e){}
  }

  // Save anxiety to health log
  if(anxietyLevel && anxietyLevel > 0){
    try{
      let hdb = HQSafe.store.get(HQKeys.HEALTH, {});
      if(!hdb.anxietyLog) hdb.anxietyLog = [];
      hdb.anxietyLog = hdb.anxietyLog.filter(function(s){ return s.date !== today; });
      hdb.anxietyLog.unshift({
        date:today, level:anxietyLevel, ts:Date.now(), source:'checkin',
        subcategory:'h-mental', subcategoryName:'Mental Health',
      });
      if(hdb.anxietyLog.length > 90) hdb.anxietyLog = hdb.anxietyLog.slice(0,90);
      HQSafe.store.set(HQKeys.HEALTH, hdb);
    }catch(e){}
  }

  // ── PHASE 8 · NOTIFY RECEIVING MODULES ───────────────────────────────────
  // Compact payload — receiving modules re-read their own stores for full data.
  var _ciPayload = {
    date:      entry.date,
    timeSlot:  entry.timeSlot,
    weekKey:   entry.weekKey,
    monthKey:  entry.monthKey,
    walked:    entry.walkingSnapshot.walked,
    hasHealth: true,
    hasMeds:   entry.medLog.total > 0,
    isWorkday: entry.isWorkday,
  };
  // Cross-tab via HQBus BroadcastChannel (same-tab also delivered)
  HQSafe.bus.emit('checkin-saved', _ciPayload);
  // Local CustomEvent fallback for same-page use / pre-HQBus scenarios
  window.dispatchEvent(new CustomEvent('hq-checkin-saved', { detail: _ciPayload }));
  // ─────────────────────────────────────────────────────────────────────────

  workDay = 0;
  resetCapturePanel();
  renderStreak();
  renderTodaySlotBar();
  checkSlotDone(activeSlot);
  renderHistory();
  showToast('✅ ' + slotCfg.emoji + ' ' + slotCfg.label + ' check-in saved!');
  ciShowWhatNext(energy, mood);
  setTimeout(function(){ window.scrollTo({top:0,behavior:'smooth'}); }, 300);
}

// ── ROUTE TO HEALTH TRACKER ───────────────────────────────────────────────
// ── BODY TAG → HEALTH SUBCATEGORY MAP ────────────────────────────────────
// Maps each body chip label to the correct Health subcategory in hq-tags.
// Physical symptoms → h-symptoms | Mental/state → h-mental | Meds → h-rx
var BODY_TAG_SUBCAT = {
  '🧠 Headache':        {cat:'h-symptoms', name:'Symptoms & Conditions',    emoji:'🩺',  severity:4},
  '😴 Fatigue':         {cat:'h-symptoms', name:'Symptoms & Conditions',    emoji:'🩺',  severity:3},
  '🤢 Nausea':          {cat:'h-symptoms', name:'Symptoms & Conditions',    emoji:'🩺',  severity:3},
  '💢 Pain':            {cat:'h-symptoms', name:'Symptoms & Conditions',    emoji:'🩺',  severity:5},
  '🤒 Stomach Ache':    {cat:'h-symptoms', name:'Symptoms & Conditions',    emoji:'🩺',  severity:3},
  '🫄 Bloating':        {cat:'h-symptoms', name:'Symptoms & Conditions',    emoji:'🩺',  severity:2},
  '😰 Anxiety high':    {cat:'h-mental',   name:'Mental Health',            emoji:'💜',  severity:4},
  '🧠 Brain fog':       {cat:'h-mental',   name:'Mental Health',            emoji:'💜',  severity:3},
  '😶 Shutdown-y':      {cat:'h-mental',   name:'Mental Health',            emoji:'💜',  severity:4},
  '💊 Meds affecting me':{cat:'h-rx',      name:'Medications & Rx',         emoji:'💊',  severity:2},
};
// Positive tags — never written as symptoms
var BODY_TAG_POSITIVE = ['✨ Feeling good','💪 Strong','😌 Calm'];

function routeToHealth(entry){
  try{
    let hdb = {};
    try{ hdb = HQSafe.store.get(H_STORE, {}); if(!hdb||typeof hdb!=='object') hdb={}; }catch(e){}
    const now = new Date().toTimeString().slice(0,5);

    // 1. Write check-in summary (unchanged schema — health tracker reads this)
    if(!hdb.checkIns) hdb.checkIns = [];
    hdb.checkIns = hdb.checkIns.filter(function(c){
      return !(c.date === entry.date && c.timeSlot === entry.timeSlot);
    });
    hdb.checkIns.unshift({
      id:entry.id, date:entry.date, at:entry.at,
      timeSlot:entry.timeSlot, timeSlotLabel:entry.timeSlotLabel, timeSlotEmoji:entry.timeSlotEmoji,
      mood:entry.mood, moodLabel:MOOD_LABELS[entry.mood]||'',
      energy:entry.energy, energyLabel:ENERGY_LABELS[entry.energy]||'',
      sensory:entry.sensory||null, anxiety:entry.anxiety||null,
      bodyTags:entry.bodyTags||[], feelingTone:entry.feelingTone||'',
      note:entry.note||'',
    });
    if(hdb.checkIns.length > 180) hdb.checkIns = hdb.checkIns.slice(0,180);

    // 2. Sleep data (morning slot only) → h-tracking subcat
    if(entry.timeSlot === 'morning' && (entry.sleepHrs || entry.sleepQ)){
      if(!hdb.sleep) hdb.sleep = [];
      const existingSleep = hdb.sleep.findIndex(function(s){ return safeDate(s) === today; });
      var sleepEntry = {
        id:entry.id+'_sl', date:today,
        hours:entry.sleepHrs||null, quality:entry.sleepQ||null,
        subcategory:'h-tracking', subcategoryName:'Daily Health Tracking',
        factors:[], notes:'From Check-In (Morning)', saved:entry.at,
      };
      if(existingSleep !== -1) hdb.sleep[existingSleep] = sleepEntry;
      else hdb.sleep.unshift(sleepEntry);
    }

    // 3. Body tags → symptoms with correct subcategory
    var negBodyTags = (entry.bodyTags||[]).filter(function(t){
      return !BODY_TAG_POSITIVE.includes(t);
    });
    if(negBodyTags.length){
      if(!hdb.symptoms) hdb.symptoms = [];
      negBodyTags.forEach(function(tag){
        var meta = BODY_TAG_SUBCAT[tag] || {cat:'h-symptoms', name:'Symptoms & Conditions', emoji:'🩺', severity:2};
        hdb.symptoms.unshift({
          id:uid(), name:tag,
          category:meta.cat,
          categoryName:meta.name,
          categoryEmoji:meta.emoji,
          parentCategory:'health',
          date:today, time:now,
          severity:meta.severity,
          notes:'From Check-In', source:'checkin', saved:entry.at,
        });
      });
      // Trim to 500 most recent symptoms
      if(hdb.symptoms.length > 500) hdb.symptoms = hdb.symptoms.slice(0,500);
    }

    // 4. High sensory level → write as symptom (h-symptoms)
    if(entry.sensory && entry.sensory >= 6){
      if(!hdb.symptoms) hdb.symptoms = [];
      hdb.symptoms.unshift({
        id:uid(), name:'🌊 High sensory load ('+entry.sensory+'/10)',
        category:'h-symptoms', categoryName:'Symptoms & Conditions', categoryEmoji:'🩺',
        parentCategory:'health',
        date:today, time:now, severity:entry.sensory,
        notes:'Sensory level from Check-In', source:'checkin', saved:entry.at,
      });
    }

    // 5. High anxiety level → write as symptom (h-mental)
    if(entry.anxiety && entry.anxiety >= 6){
      if(!hdb.symptoms) hdb.symptoms = [];
      hdb.symptoms.unshift({
        id:uid(), name:'😰 High anxiety ('+entry.anxiety+'/10)',
        category:'h-mental', categoryName:'Mental Health', categoryEmoji:'💜',
        parentCategory:'health',
        date:today, time:now, severity:entry.anxiety,
        notes:'Anxiety level from Check-In', source:'checkin', saved:entry.at,
      });
    }

    HQSafe.store.set(H_STORE, hdb);
  }catch(e){ console.warn('Health route failed', e); }
}

// ── ROUTE WALK MILES ──────────────────────────────────────────────────────
function routeToWalking(entry){
  try{
    const WALK_KEY = HQKeys.WALKING;
    let wdb = {};
    try{ wdb = HQSafe.store.get(WALK_KEY, {}); if(!wdb||typeof wdb!=='object') wdb={}; }catch(e){}
    if(!wdb.entries) wdb.entries = [];
    wdb.entries = wdb.entries.filter(function(s){ return !(s.date === today && s.slot === entry.timeSlot); });
    wdb.entries.unshift({
      id:entry.id+'_wk', date:today, slot:entry.timeSlot,
      miles:entry.walkMiles, source:'checkin', at:entry.at,
    });
    HQSafe.store.set(WALK_KEY, wdb);
  }catch(e){ console.warn('Walk route failed', e); }
}

// ── ROUTE WINS ────────────────────────────────────────────────────────────
function routeToWins(note){
  try{
    let wins = [];
    try{ const _w=HQSafe.store.get(W_STORE); if(Array.isArray(_w)) wins=_w; }catch(e){}
    wins.unshift({id:uid(), text:note, date:today, at:new Date().toISOString(), source:'checkin'});
    if(wins.length > 200) wins = wins.slice(0,200);
    HQSafe.store.set(W_STORE, wins);
  }catch(e){}
}

// ── HISTORY ───────────────────────────────────────────────────────────────
function renderHistory(){
  const el = document.getElementById('checkin-history');
  if(!el) return;
  const recent = checkins.slice(0,20);
  if(!recent.length){
    el.innerHTML = '<div style="font-size:12px;color:var(--muted);text-align:center;padding:16px">No check-ins yet. Start your first one!</div>';
    return;
  }
  el.innerHTML = recent.map(function(c){
    const isToday = safeDate(c) === today;
    const dateStr = isToday ? 'Today' : new Date(c.date+'T12:00:00').toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});
    const moodStr = c.mood ? MOOD_EMOJIS[c.mood] : '';
    const energyStr = c.energy ? ENERGY_EMOJIS[c.energy] : '';
    const slotCfg = SLOTS[c.timeSlot] || null;
    const slotBadge = slotCfg ? '<span class="slot-badge ' + slotCfg.color + '">' + slotCfg.emoji + ' ' + slotCfg.label + '</span>' : '';
    const slotClass = slotCfg ? 'slot-' + c.timeSlot : '';
    const feelStr = c.feelingTone ? (FEELING_CONFIG[c.feelingTone]?.emoji || '') + ' ' + (FEELING_CONFIG[c.feelingTone]?.label || '') : '';
    return '<div class="hist-item ' + slotClass + '">'
      + '<div class="hist-moods">' + moodStr + (energyStr||'⚡') + '</div>'
      + '<div class="hist-info">'
      + '<div class="hist-date">' + dateStr
      + (isToday ? ' <span style="font-size:9px;background:rgba(100,94,183,.1);color:var(--purple);border-radius:5px;padding:1px 5px;font-weight:700;border:1px solid rgba(100,94,183,.2)">Today</span>' : '')
      + slotBadge + '</div>'
      + '<div class="hist-meta">'
      + (feelStr ? '<span>' + feelStr + '</span>' : '')
      + (c.mood ? '<span>' + MOOD_LABELS[c.mood] + '</span>' : '')
      + (c.energy ? '<span>⚡ ' + ENERGY_LABELS[c.energy] + '</span>' : '')
      + (c.sleepHrs ? '<span>😴 ' + c.sleepHrs + 'hrs' + (c.sleepQ ? ' Q'+c.sleepQ : '') + '</span>' : '')
      + (c.workDay ? '<span>💼 ' + '⭐'.repeat(c.workDay) + '</span>' : '')
      + (c.lateToWork ? '<span style="color:var(--red)">🚨 Late</span>' : '')
      + (c.walked ? '<span>🚶 ' + (c.walkMiles ? c.walkMiles+'mi' : 'walked') + '</span>' : '')
      + ((c.bodyTags||[]).length ? '<span>🩺 ' + c.bodyTags.slice(0,2).join(', ') + (c.bodyTags.length>2?'…':'') + '</span>' : '')
      + '</div>'
      + (c.note ? '<div class="hist-note">' + esc(c.note.slice(0,90)) + (c.note.length>90?'…':'') + '</div>' : '')
      + '</div></div>';
  }).join('');
}

// ── FLAG-TO-INDEX: MISSED CHECK-IN WINDOWS ────────────────────────────────
function ciCheckMissed(){
  const _n2 = new Date();
  const h = _n2.getHours();
  // Windows use hours only for missed-check boundary checks (minutes precision not needed here)
  // Aligned to: morning 4–11:30, afternoon 11:30–16:30, evening 16:30–21:30, night 21:30+
  const windows = [
    {slot:'morning',    label:'Morning',    start:4,  end:12},
    {slot:'midday',     label:'Midday',     start:9,  end:12},
    {slot:'afternoon',  label:'Afternoon',  start:12, end:17},
    {slot:'evening',    label:'Evening',    start:17, end:22},
    {slot:'end-of-day', label:'End of Day', start:15, end:20},
  ];
  const todayCheckins = checkins.filter(function(c){ return safeDate(c) === today; });
  let missed = [];
  try{ missed = HQSafe.store.get(MISSED_KEY, []); }catch(e){ missed = []; }

  windows.forEach(function(w){
    if(h < w.end) return;
    const covered = todayCheckins.some(function(c){ return c.timeSlot === w.slot; });
    const flagId = 'missed-checkin-' + w.slot;
    if(!covered){
      if(!missed.find(function(m){ return m.id === flagId; })){
        missed.push({id:flagId, slot:w.slot, label:w.label, date:today, ts:Date.now()});
      }
      if(typeof hqFlag === 'function') hqFlag({id:flagId, source:'checkin', type:'missed', text:'🔍 '+w.label+' thread may need reconnecting', href:'checkin.html', ts:Date.now()});
    } else {
      missed = missed.filter(function(m){ return m.id !== flagId; });
      if(typeof hqUnflag === 'function') hqUnflag(flagId);
    }
  });
  HQSafe.store.set(MISSED_KEY, missed);
}

function ciUnflagSlot(slot){
  try{
    let missed = HQSafe.store.get(MISSED_KEY, []);
    missed = missed.filter(function(m){ return m.slot !== slot; });
    HQSafe.store.set(MISSED_KEY, missed);
  }catch(e){}
}

// ── UTILS ─────────────────────────────────────────────────────────────────
const esc = s => HQUtils.esc(s); // → HQUtils.esc



window.addEventListener('hq-core-ready', function(){
  _isWorkday = null;
  applyWorkdayVisibility();
  applySurvivalVisibility();
  // Re-call selSlot (not just updateSectionVisibility) so the .sel highlight,
  // section visibility, and checkSlotDone banner are all re-applied after
  // renderSlotGrid() has wiped and recreated the slot buttons.
  if(activeSlot) selSlot(activeSlot);
});

// Subscribe to environment mode changes — re-apply survival visibility live
window.addEventListener('hq-environment-changed', function() {
  applySurvivalVisibility();
  if(activeSlot) selSlot(activeSlot);
});

// ── WEEKLY MOOD/ENERGY SUMMARY ────────────────────────────────────────────
function renderWeeklyPattern(){
  const wrap = document.getElementById('weekly-pattern');
  const el   = document.getElementById('weekly-pattern-text');
  if(!wrap || !el) return;

  const cutoff = new Date(); cutoff.setDate(cutoff.getDate()-7);
  const cutoffStr = localDateStr(cutoff);
  const week = checkins.filter(function(c){ return (c.date||'') >= cutoffStr && (c.mood || c.energy); });
  if(week.length < 3){ wrap.style.display = 'none'; return; }

  const DOW = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const byDay = {};
  week.forEach(function(c){
    const dow = new Date(c.date+'T12:00:00').getDay();
    if(!byDay[dow]) byDay[dow] = {mood:[],energy:[]};
    if(c.mood)   byDay[dow].mood.push(c.mood);
    if(c.energy) byDay[dow].energy.push(c.energy);
  });

  const moods    = week.filter(function(c){ return c.mood; }).map(function(c){ return c.mood; });
  const energies = week.filter(function(c){ return c.energy; }).map(function(c){ return c.energy; });
  const avgMood   = moods.length    ? moods.reduce(function(a,b){return a+b;},0)/moods.length    : null;
  const avgEnergy = energies.length ? energies.reduce(function(a,b){return a+b;},0)/energies.length : null;

  const dayAvgs = Object.entries(byDay).map(function(e){
    const d = e[0]; const v = e[1];
    const all = [...v.mood,...v.energy];
    const avg = all.length ? all.reduce(function(a,b){return a+b;},0)/all.length : 0;
    return {day:DOW[+d], avg};
  }).sort(function(a,b){ return a.avg - b.avg; });

  const worst = dayAvgs[0];
  const best  = dayAvgs[dayAvgs.length-1];

  const anxieties = week.filter(function(c){ return c.anxiety; }).map(function(c){ return c.anxiety; });
  const avgAnxiety = anxieties.length ? anxieties.reduce(function(a,b){return a+b;},0)/anxieties.length : null;

  const lines = [];
  if(avgMood)    lines.push('🎭 Avg mood this week: <strong>' + avgMood.toFixed(1) + '/5</strong> — ' + (avgMood>=4?'Good week':avgMood>=3?'Okay week':'Tough week'));
  if(avgEnergy)  lines.push('⚡ Avg energy: <strong>' + avgEnergy.toFixed(1) + '/5</strong>');
  if(worst && best && worst.day !== best.day){
    if(worst.avg < 2.5) lines.push('📉 Toughest: <strong>' + worst.day + 's</strong> tend to be lower');
    if(best.avg  > 3.5) lines.push('📈 Strongest: <strong>' + best.day + 's</strong> tend to be higher');
  }
  if(avgAnxiety && avgAnxiety >= 3.5) lines.push('😰 Anxiety has been running high — avg ' + avgAnxiety.toFixed(1) + '/5');
  else if(avgAnxiety && avgAnxiety <= 2) lines.push('😌 Anxiety has been relatively low this week');

  if(!lines.length){ wrap.style.display = 'none'; return; }
  el.innerHTML = lines.join('<br>');
  wrap.style.display = 'block';
}

// ── MEDICATION CONFIRMATION ────────────────────────────────────────────────
function renderMedConfirm(){
  const MED_STORE     = HQKeys.MEDS;
  const MED_LOG_STORE = HQKeys.MED_LOG;
  const today_d = localDateStr();
  let meds = [];
  try{ meds = HQSafe.store.get(MED_STORE, []); }catch(e){}
  const section = document.getElementById('sec-meds-confirm');
  const listEl  = document.getElementById('med-confirm-list');
  if(!section || !listEl) return;
  if(!meds.length){ section.style.display = 'none'; return; }
  section.style.display = '';
  let todayLog = {};
  try{
    const allLog = HQSafe.store.get(MED_LOG_STORE, {});
    todayLog = allLog[today_d] || {};
  }catch(e){}
  listEl.innerHTML = meds.map(function(m){
    const taken = !!todayLog[m.id];
    const doseStr = m.dose ? ' ' + m.dose : '';
    return '<div class="med-confirm-row">'
      + '<div>'
      + '<div class="med-confirm-name">💊 ' + m.name + doseStr + '</div>'
      + (m.time ? '<div class="med-confirm-meta">⏰ · ' + m.time + '</div>' : '')
      + '</div>'
      + '<label class="med-taken-toggle">'
      + '<input type="checkbox" class="med-taken-cb" data-med-id="' + m.id + '"'
      + (taken ? ' checked' : '')
      + ' onchange="saveMedTaken(\'' + m.id + '\', this.checked)">'
      + '<span class="med-taken-lbl">' + (taken ? '✅ Taken' : 'Mark taken') + '</span>'
      + '</label></div>';
  }).join('');
}

function saveMedTaken(medId, taken){
  const MED_LOG_STORE = HQKeys.MED_LOG;
  const today_d = localDateStr();
  try{
    let allLog = HQSafe.store.get(MED_LOG_STORE, {});
    if(!allLog[today_d]) allLog[today_d] = {};
    allLog[today_d][medId] = taken;
    const keys = Object.keys(allLog).sort().slice(-90);
    const trimmed = {};
    keys.forEach(function(k){ trimmed[k] = allLog[k]; });
    HQSafe.store.set(MED_LOG_STORE, trimmed);
    const lbl = document.querySelector('[data-med-id="' + medId + '"]')?.parentElement?.querySelector('.med-taken-lbl');
    if(lbl) lbl.textContent = taken ? '✅ Taken' : 'Mark taken';
    showToast(taken ? '💊 Marked as taken' : '○ Unmarked');
  }catch(e){}
}

window.addEventListener('storage', function(e){
  if(e.key === HQKeys.MEDS || e.key === HQKeys.MED_LOG) renderMedConfirm();
});

// ── STRESSOR ROUTING ───────────────────────────────────────────────────────
function routeStressor(dest){
  const note = (document.getElementById('stressor-note')?.value||'').trim();
  if(!note){ showToast('⚠️ Add a stressor note first'); return; }
  if(dest === 'dump'){
    try{
      const store = HQKeys.BRAINDUMP;
      let entries = HQSafe.store.get(store, []);
      entries.unshift({
        id:uid(), text:'😰 '+note, type:'worry', route:'save',
        date:today, at:new Date().toISOString(), source:'checkin',
      });
      HQSafe.store.set(store, entries);
      showToast('🫙 Stressor sent to Thought Jar');
    }catch(e){ showToast('❌ Could not route'); }
  } else if(dest === 'firebird'){
    HQSafe.store.set(HQKeys.FB_STRESSOR, note);
    showToast('🔥 Opening Firebird…');
    setTimeout(function(){ window.location.href = 'firebird-protocol.html'; }, 600);
    return;
  } else {
    showToast('💭 Stressor noted — no routing');
  }
  const field = document.getElementById('stressor-note');
  if(field) field.value = '';
}

// ── END-OF-WEEK / END-OF-MONTH CHECK-IN ──────────────────────────────────
var _eowType = 'week';
var _eowMood = 0, _eowEnergy = 0, _eowTone = '', _eowBudget = '', _eowFocus = [];
var CONF_AREAS = ['work','health','home','social','finance','self','creativity'];
var CONF_AREA_LABELS = {work:'💼 Work',health:'🏥 Health',home:'🏠 Home',social:'👥 Social',finance:'💰 Finance',self:'✨ Self-care',creativity:'🎨 Creativity'};
// Note: MOOD_LABELS and ENERGY_LABELS are already declared above as const arrays.
// EOW uses object versions:
var EOW_MOOD_LABELS   = {1:'Very low',2:'Low',3:'Okay',4:'Good',5:'Great'};
var EOW_ENERGY_LABELS = {1:'Empty',2:'Low',3:'Okay',4:'Good',5:'High'};

function checkEOWAvailability(){
  // Weekly/monthly check-ins are always available (date lock removed per Phase 1)
  var isSunday   = typeof hqCheckSundayWindow   === 'function' ? hqCheckSundayWindow()   : false;
  var isMonthEnd = typeof hqCheckMonthEndWindow === 'function' ? hqCheckMonthEndWindow() : false;
  var weekBtn    = document.getElementById('eow-week-btn');
  var monthBtn   = document.getElementById('eow-month-btn');
  if(weekBtn){
    weekBtn.disabled = false;
    weekBtn.title    = isSunday ? 'End of week check-in' : 'End of week check-in (available any time)';
    if(!isSunday) weekBtn.classList.add('btn-manual-override');
  }
  if(monthBtn){
    monthBtn.disabled = false;
    monthBtn.title    = isMonthEnd ? 'End of month check-in' : 'End of month check-in (available any time)';
    if(!isMonthEnd) monthBtn.classList.add('btn-manual-override');
  }
}

function buildConfidenceRows(){
  var el = document.getElementById('eow-confidence-rows');
  if(!el) return;
  el.innerHTML = CONF_AREAS.map(function(a){
    return '<div class="eow-area-row">'
      + '<span class="eow-area-label">' + (CONF_AREA_LABELS[a]||a) + '</span>'
      + '<select class="eow-area-select" id="eow-conf-' + a + '">'
      + '<option value="na">— N/A —</option>'
      + '<option value="1">1 · Very low</option>'
      + '<option value="2">2 · Low</option>'
      + '<option value="3">3 · Moderate</option>'
      + '<option value="4">4 · Good</option>'
      + '<option value="5">5 · Strong</option>'
      + '</select></div>';
  }).join('');
}

function openEOW(type){
  _eowType = type || 'week';
  _eowMood = 0; _eowEnergy = 0; _eowTone = ''; _eowBudget = ''; _eowFocus = [];
  var now = new Date();
  document.getElementById('eow-overlay-title').textContent =
    type === 'month' ? '📅 End-of-Month Check-In' : '📅 End-of-Week Check-In';
  document.getElementById('eow-overlay-range').textContent =
    type === 'month'
      ? now.toLocaleDateString('en-US',{month:'long',year:'numeric'})
      : 'Week of ' + (typeof hqWeekStart === 'function' ? hqWeekStart((typeof hqWeekKey === 'function' ? hqWeekKey() : now.toISOString().split('T')[0])) : now.toISOString().split('T')[0]);

  ['eow-mood-row','eow-energy-row'].forEach(function(id){
    document.querySelectorAll('#'+id+' .energy-btn').forEach(function(b){ b.classList.remove('sel'); });
  });
  document.getElementById('eow-mood-label').textContent   = 'Tap to set';
  document.getElementById('eow-energy-label').textContent = 'Tap to set';
  document.querySelectorAll('#eow-tone-grid .eow-tone-btn').forEach(function(b){ b.classList.remove('sel'); });
  document.querySelectorAll('#eow-focus-chips .eow-focus-chip').forEach(function(b){ b.classList.remove('sel'); });
  document.querySelectorAll('#eow-budget-row .eow-budget-btn').forEach(function(b){ b.classList.remove('sel'); });
  ['eow-went-well','eow-hard','eow-carry','eow-one-thing','eow-notes'].forEach(function(id){
    var el = document.getElementById(id); if(el) el.value = '';
  });
  buildConfidenceRows();

  try{
    var metrics = hqGetMetrics();
    var key = type === 'month' ? (typeof hqMonthKey === 'function' ? hqMonthKey() : new Date().toISOString().slice(0,7)) : (typeof hqWeekKey === 'function' ? hqWeekKey() : new Date().toISOString().slice(0,10));
    var store = type === 'month' ? metrics.monthlySnapshots : metrics.snapshots;
    var snap = store && store[key];
    if(snap && snap.reflection){
      var r = snap.reflection;
      if(r.wentWell)  document.getElementById('eow-went-well').value = r.wentWell;
      if(r.hard)      document.getElementById('eow-hard').value = r.hard;
      if(r.carryFwd)  document.getElementById('eow-carry').value = r.carryFwd;
      if(snap.notes)  document.getElementById('eow-notes').value = snap.notes;
      if(r.tone)   selEOWTone(r.tone, document.querySelector('[data-tone="'+r.tone+'"]'));
      if(r.mood)   selEOWMood(r.mood, document.querySelector('[data-em="'+r.mood+'"]'));
      if(r.energy) selEOWEnergy(r.energy, document.querySelector('[data-ee="'+r.energy+'"]'));
      if(snap.intention){
        if(snap.intention.oneThng) document.getElementById('eow-one-thing').value = snap.intention.oneThng;
        if(snap.intention.budget)  selEOWBudget(snap.intention.budget, document.querySelector('[data-b="'+snap.intention.budget+'"]'));
        (snap.intention.focus||[]).forEach(function(f){
          var btn = document.querySelector('[data-f="'+f+'"]');
          if(btn){ btn.classList.add('sel'); _eowFocus.push(f); }
        });
      }
      if(snap.confidence){
        CONF_AREAS.forEach(function(a){
          var el = document.getElementById('eow-conf-'+a);
          if(el && snap.confidence[a]) el.value = snap.confidence[a];
        });
      }
    }
  }catch(e){}

  HQModal.open('eow-overlay');
}

function closeEOW(){
  HQModal.close('eow-overlay');
}

function selEOWMood(n, btn){
  _eowMood = n;
  document.querySelectorAll('#eow-mood-row .energy-btn').forEach(function(b){ b.classList.toggle('sel', +b.dataset.em === n); });
  var lbl = document.getElementById('eow-mood-label');
  if(lbl) lbl.textContent = EOW_MOOD_LABELS[n] || n;
}
function selEOWEnergy(n, btn){
  _eowEnergy = n;
  document.querySelectorAll('#eow-energy-row .energy-btn').forEach(function(b){ b.classList.toggle('sel', +b.dataset.ee === n); });
  var lbl = document.getElementById('eow-energy-label');
  if(lbl) lbl.textContent = EOW_ENERGY_LABELS[n] || n;
}
function selEOWTone(tone, btn){
  _eowTone = tone;
  document.querySelectorAll('#eow-tone-grid .eow-tone-btn').forEach(function(b){ b.classList.toggle('sel', b.dataset.tone === tone); });
}
function selEOWBudget(budget, btn){
  _eowBudget = budget;
  document.querySelectorAll('#eow-budget-row .eow-budget-btn').forEach(function(b){ b.classList.toggle('sel', b.dataset.b === budget); });
}
function togEOWFocus(f, btn){
  btn.classList.toggle('sel');
  if(btn.classList.contains('sel')){
    if(!_eowFocus.includes(f)) _eowFocus.push(f);
  } else {
    _eowFocus = _eowFocus.filter(function(x){ return x !== f; });
  }
}

function renderEOWSummary(){
  var el = document.getElementById('eow-summary');
  if(!el) return;
  var metrics = hqGetMetrics();
  var weekSnap  = (metrics.snapshots  || {})[(typeof hqWeekKey  === 'function' ? hqWeekKey()  : new Date().toISOString().slice(0,10))] || {};
  var monthSnap = (metrics.monthlySnapshots || {})[(typeof hqMonthKey === 'function' ? hqMonthKey() : new Date().toISOString().slice(0,7))] || {};
  var parts = [];
  function buildCard(snap, label, editType){
    if(!snap.savedAt && !snap.reflection && !snap.notes) return '';
    var r = snap.reflection || {};
    var toneBadge = r.tone ? '<span style="font-size:10px;background:rgba(100,94,183,.12);color:var(--purple);border-radius:5px;padding:1px 6px;font-weight:700;border:1px solid rgba(100,94,183,.2)">' + r.tone + '</span>' : '';
    var moodStr   = r.mood   ? (EOW_MOOD_LABELS[r.mood]   || '') : '';
    var energyStr = r.energy ? (EOW_ENERGY_LABELS[r.energy] || '') : '';
    var saved = snap.savedAt ? new Date(snap.savedAt).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}) : '';
    var meta = [moodStr ? '😌 ' + moodStr : '', energyStr ? '⚡ ' + energyStr : ''].filter(Boolean).join(' · ');
    return '<div style="background:rgba(100,94,183,.06);border:1.5px solid rgba(100,94,183,.18);border-radius:12px;padding:11px 13px;margin-top:8px;font-size:12px">'
      + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:5px">'
      + '<span style="font-weight:800;color:var(--text)">✅ ' + label + ' saved</span>'
      + '<button onclick="openEOW(\'' + editType + '\')" style="background:none;border:none;color:var(--purple);font-size:11px;font-weight:700;cursor:pointer;padding:2px 6px;border-radius:6px;border:1px solid rgba(100,94,183,.3)">✏️ Edit</button>'
      + '</div>'
      + (toneBadge ? '<div style="margin-bottom:4px">' + toneBadge + '</div>' : '')
      + (meta ? '<div style="color:var(--muted);margin-bottom:3px">' + meta + '</div>' : '')
      + (r.wentWell ? '<div style="color:var(--text);margin-top:4px"><span style="color:var(--muted)">Wins:</span> ' + r.wentWell.slice(0,80) + (r.wentWell.length>80?'…':'') + '</div>' : '')
      + (saved ? '<div style="color:var(--muted);font-size:10px;margin-top:5px">' + saved + '</div>' : '')
      + '</div>';
  }
  parts.push(buildCard(weekSnap, 'Week check-in', 'week'));
  parts.push(buildCard(monthSnap, 'Month check-in', 'month'));
  el.innerHTML = parts.filter(Boolean).join('');
}

function saveEOW(){
  var wentWell = (document.getElementById('eow-went-well').value||'').trim();
  var hard     = (document.getElementById('eow-hard').value||'').trim();
  var carryFwd = (document.getElementById('eow-carry').value||'').trim();
  var oneThing = (document.getElementById('eow-one-thing').value||'').trim();
  var notes    = (document.getElementById('eow-notes').value||'').trim();
  var confidence = {};
  CONF_AREAS.forEach(function(a){
    var el = document.getElementById('eow-conf-'+a);
    confidence[a] = el && el.value !== 'na' ? +el.value : 'na';
  });
  var key     = _eowType === 'month' ? (typeof hqMonthKey === 'function' ? hqMonthKey() : new Date().toISOString().slice(0,7)) : (typeof hqWeekKey === 'function' ? hqWeekKey() : new Date().toISOString().slice(0,10));
  var metrics = hqGetMetrics();
  var store   = _eowType === 'month' ? 'monthlySnapshots' : 'snapshots';
  if(!metrics[store]) metrics[store] = {};
  if(!metrics[store][key]) metrics[store][key] = {};
  var snap = metrics[store][key];
  snap.reflection = {tone:_eowTone, mood:_eowMood, energy:_eowEnergy, wentWell:wentWell, hard:hard, carryFwd:carryFwd};
  snap.intention  = {focus:_eowFocus, oneThng:oneThing, budget:_eowBudget};
  snap.confidence = confidence;
  snap.notes      = notes;
  snap.savedAt    = new Date().toISOString();
  HQSafe.store.set(HQKeys.METRICS, metrics);
  if(typeof hqComputeWeekSnapshot  === 'function' && _eowType === 'week')  hqComputeWeekSnapshot(key);
  if(typeof hqComputeMonthSnapshot === 'function' && _eowType === 'month') hqComputeMonthSnapshot(key);
  closeEOW();
  renderEOWSummary();
  showToast(_eowType === 'month' ? '📅 Month check-in saved!' : '📅 Week check-in saved!');
}

// ── P5: SURFACE-CHECKIN ITEMS ──────────────────────────────────────────────
// Renders items that were flagged with the surface-checkin behavior,
// showing them in a panel at the top of the check-in form.
function renderCheckinSurfacePanel() {
  var panel = document.getElementById('ci-surface-panel');
  var list  = document.getElementById('ci-surface-list');
  var countEl = document.getElementById('ci-surface-count');
  if (!panel || !list) return;

  var items = typeof hqGetCheckinSurface === 'function' ? hqGetCheckinSurface() : [];
  if (!items.length) { panel.style.display = 'none'; return; }

  panel.style.display = '';
  if (countEl) countEl.textContent = items.length + ' item' + (items.length !== 1 ? 's' : '');

  list.innerHTML = items.map(function(item) {
    return '<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid rgba(61,214,205,.12)">' +
      '<a href="' + (item.href || '#') + '" style="flex:1;text-decoration:none;color:var(--teal,#3dd6cd);font-size:12px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' +
        '✅ ' + (item.text || 'Flagged item') +
        (item.source ? ' <span style="font-size:9px;color:var(--muted);font-weight:400">· ' + item.source + '</span>' : '') +
      '</a>' +
      '<button onclick="dismissCheckinSurfaceItem(\'' + item.id + '\')" ' +
        'style="background:none;border:none;cursor:pointer;padding:4px 6px;color:var(--muted);font-size:12px;line-height:1;border-radius:5px;flex-shrink:0;transition:color .15s" ' +
        'onmouseover="this.style.color=\'var(--red,#e24b4a)\'" onmouseout="this.style.color=\'var(--muted)\'" ' +
        'aria-label="Dismiss">✕</button>' +
    '</div>';
  }).join('');
}

function dismissCheckinSurfaceItem(id) {
  if (typeof hqDismissCheckinSurface === 'function') hqDismissCheckinSurface(id);
  renderCheckinSurfacePanel();
}

function dismissAllCheckinSurface() {
  var items = typeof hqGetCheckinSurface === 'function' ? hqGetCheckinSurface() : [];
  items.forEach(function(item) {
    if (typeof hqDismissCheckinSurface === 'function') hqDismissCheckinSurface(item.id);
  });
  renderCheckinSurfacePanel();
}

// ── SECTION VISIBILITY (from customize) ───────────────────────────────────
function applyCheckinVisibility(){
  try{
    const vis = HQSafe.store.get(HQKeys.CHECKIN_VISIBILITY, {});
    // moodIntensity → sec-mood
    const mood = document.getElementById('sec-mood');
    if(mood) mood.style.display = vis.moodIntensity === false ? 'none' : '';
    // bodyScan → sec-body
    const body = document.getElementById('sec-body');
    if(body) body.style.display = vis.bodyScan === false ? 'none' : '';
    // weeklyPattern → weekly-pattern wrapper
    const wp = document.getElementById('weekly-pattern');
    if(wp) wp.dataset.visHidden = vis.weeklyPattern === false ? '1' : '';
    // eowButtons → eow-buttons div
    const eowBtns = document.getElementById('eow-buttons');
    if(eowBtns) eowBtns.style.display = vis.eowButtons === false ? 'none' : '';
  }catch(e){}
}


// ── M-06: First-run hint — show if no check-ins exist ─────────────────────
function ciShowFirstRunHint() {
  var hint = document.getElementById('ci-first-run-hint');
  if (!hint) return;
  // Show only if user has never saved a check-in
  if (!checkins || checkins.length === 0) {
    hint.style.display = 'block';
  }
}


// ── M-07: Post-save "what next?" panel for positive check-ins ─────────────
function ciShowWhatNext(energyLevel, moodLevel) {
  var panel = document.getElementById('ci-what-next');
  if (!panel) return;
  // Only show for energy 3+ (medium/good/high)
  if (energyLevel < 3) { panel.style.display = 'none'; return; }

  var suggestions = [];
  if (energyLevel >= 4) {
    suggestions = [
      { emoji: '🗓', label: 'Day Plan',   href: 'day-view.html#plan' },
      { emoji: '✅', label: 'Task Board', href: 'taskboard.html' },
      { emoji: '📆', label: 'This Week',  href: 'weekly-planner.html' },
    ];
  } else {
    suggestions = [
      { emoji: '📅', label: "Today's Timeline", href: 'day-view.html' },
      { emoji: '✅', label: 'Task Board',        href: 'taskboard.html' },
      { emoji: '🫙', label: 'Brain Dump',        href: 'brain-dump.html' },
    ];
  }

  var btns = suggestions.map(function(s) {
    return '<a href="' + s.href + '" class="what-next-btn">' + s.emoji + ' ' + s.label + '</a>';
  }).join('');

  var msg = energyLevel >= 4 ? '⚡ Good energy — ready to go?' : '👍 Decent energy — pick your next move:';
  panel.innerHTML = '<div class="what-next-label">' + msg + '</div><div class="what-next-row">' + btns + '</div>';
  panel.style.display = 'block';
}

// ── INIT ──────────────────────────────────────────────────────────────────
load();
ciShowFirstRunHint();
renderHeader();
initWatchlistChips(); // Phase B — symptom watchlist chips
applyWorkdayVisibility();
applyCheckinVisibility();
renderCheckinSurfacePanel();
setTimeout(ciCheckMissed, 500);
renderStreak();
renderTodaySlotBar();
renderWeeklyPattern();
renderHistory();
renderMedConfirm();
renderQuickPresets();
renderCheckinModePicker(); // Phase 8 Step 3
const autoSlot = autoDetectSlot();
selSlot(autoSlot);
updateSectionVisibility();
checkEOWAvailability();
renderEOWSummary();
if(!window._ciEOWInterval){window._ciEOWInterval=setInterval(checkEOWAvailability, 600000);}
// FIX-04/FIX-08: Clear intervals and abort listeners on page unload
window.addEventListener('pagehide', function() {
  if (window._ciEOWInterval) { clearInterval(window._ciEOWInterval); window._ciEOWInterval = null; }
}, {once: true});
// FIX-08
if (window.HQLifecycle) HQLifecycle.register(function() {
  if (window._ciEOWInterval) { clearInterval(window._ciEOWInterval); window._ciEOWInterval = null; }
});


// ── PHASE B — WATCHLIST CHIP INTEGRATION ─────────────────────────────────
// Loads symptom watchlist from localStorage and renders chips into
// #body-chips-watchlist. Chips behave like body chips — tap to toggle.
// Toggled watchlist symptoms are collected alongside body chips on save.

function _makeWatchlistChip(symptom) {
  var btn = document.createElement('button');
  btn.className = 'chip c-pink';
  btn.setAttribute('data-symptom-id', symptom.id || '');
  btn.setAttribute('data-source', 'watchlist');
  btn.textContent = (symptom.emoji || '🩺') + ' ' + symptom.label;
  btn.onclick = function() { tog(btn); };
  return btn;
}

function initWatchlistChips() {
  var wrap = document.getElementById('body-watchlist-wrap');
  var container = document.getElementById('body-chips-watchlist');
  if (!wrap || !container) return;

  var watchlist = [];
  try {
    watchlist = HQSafe.store.get(HQKeys.SYMPTOM_WATCHLIST, []);
    if (!Array.isArray(watchlist)) watchlist = [];
  } catch(e) { watchlist = []; }

  if (!watchlist.length) {
    wrap.style.display = 'none';
    return;
  }

  wrap.style.display = '';
  container.innerHTML = '';

  // Group by category if utils available; flat fallback otherwise
  var grouped = null;
  try {
    if (window.HQSymptomUtils && typeof window.HQSymptomUtils.groupedWithMeta === 'function') {
      grouped = window.HQSymptomUtils.groupedWithMeta(watchlist);
    }
  } catch(e) { grouped = null; }

  if (grouped && grouped.length) {
    grouped.forEach(function(group) {
      var lbl = document.createElement('div');
      lbl.className = 'body-subsec-label';
      lbl.style.cssText = 'margin-top:8px;margin-bottom:4px;font-size:10px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.5px';
      lbl.textContent = (group.category.emoji || '•') + ' ' + group.category.label;
      container.appendChild(lbl);
      group.symptoms.forEach(function(symptom) {
        container.appendChild(_makeWatchlistChip(symptom));
      });
    });
  } else {
    watchlist.forEach(function(symptom) {
      container.appendChild(_makeWatchlistChip(symptom));
    });
  }
}

// Collect watchlist chip selections alongside standard body chips at save time
function getWatchlistSelections() {
  return [...document.querySelectorAll('#body-chips-watchlist .chip.on')]
    .map(function(b) { return b.textContent.trim(); });
}

// ── PHASE B — HEALTH-TRACKER CONDITION POOL INIT ─────────────────────────
// Wires condition pool picker in health-tracker's settings tab.
function initConditionPoolView() {
  var setup = window.HQSymptomSetup;
  if (!setup || !setup.initPicker) return;
  var grid = document.getElementById('condition-pool-grid');
  if (!grid) return;
  setup.initPicker(
    'condition-pool-grid',
    'condition-pool-watchlist-chips',
    function(watchlist) {
      if (typeof showToast === 'function') {
        showToast('\u2705 Watchlist saved — ' + watchlist.length + ' symptoms tracked');
      }
      // Refresh checkin watchlist chips if on the same page
      initWatchlistChips();
    }
  );
}
