// ════════════════════════════════════════════════════════════
//  IDEA STUDIO — AuDHD HQ
//  Storage: audhd-hq-idea-studio
//  Schema: { sparks:[], hyperfocus:[], ideas:[], holes:[], quotes:[] }
// ════════════════════════════════════════════════════════════

const STORE = HQKeys.IDEA_STUDIO;
let DB = { sparks:[], hyperfocus:[], ideas:[], holes:[], quotes:[] };
let _ideasFilter = 'all';
let _holesFilter = 'all';
let _hfTimers = {};  // id → intervalId

function load() {
  { const s = HQSafe.store.get(STORE, null); if(s && typeof s === 'object') DB = {...DB, ...s}; }
}
function persist() { HQSafe.store.set(STORE, DB); }
const uid = () => HQUtils.uid(); // → HQUtils.uid
const todayStr = () => (window.HQDate ? HQDate.today() : new Date().toISOString().split('T')[0]); // aliased → HQDate.today
const esc = s => HQUtils.esc(s); // → HQUtils.esc
function fmtDate(s) {
  if (!s) return '';
  return new Date(s+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
}
function fmtDuration(ms) {
  if (!ms || ms < 0) return '0m';
  const h = Math.floor(ms/3600000), m = Math.floor((ms%3600000)/60000);
  return h ? h+'h '+(m?m+'m':'') : m+'m';
}

// ── TABS ─────────────────────────────────────────────────────
function openModal(id)  { document.getElementById(id).classList.add('open'); document.body.style.overflow='hidden'; }
function closeModal(id) { document.getElementById(id).classList.remove('open'); document.body.style.overflow=''; }

const HEAT_LABELS = { hot:'🔥 Active', warm:'🌡 Simmering', cool:'❄️ Background' };
const CAT_LABELS  = { creative:'🎨 Creative', science:'🔬 Science', humanities:'📚 Humanities', practical:'🔧 Practical', social:'👥 Social', health:'🏥 Health', other:'✨ Other' };
const STAGE_LABELS= { spark:'⚡ Spark', incubating:'🌱 Incubating', active:'🚀 Active', shelved:'📦 Shelved' };
const IDEA_CATS   = { project:'🗂 Project', creative:'🎨 Creative', business:'💼 Business', life:'🌿 Life', research:'🔍 Research', other:'✨ Other' };
const HOLE_CATS   = { science:'🔬 Science', history:'📜 History', culture:'🌍 Culture', health:'🏥 Health', creative:'🎨 Creative', practical:'🔧 Practical', other:'✨ Other' };

// ════════════════════════════════════════════════════════════
// INTERESTS / SPARKS
// ════════════════════════════════════════════════════════════
function renderSparks() {
  const hot  = DB.sparks.filter(s=>s.heat==='hot').length;
  const warm = DB.sparks.filter(s=>s.heat==='warm').length;
  const cool = DB.sparks.filter(s=>s.heat==='cool').length;
  document.getElementById('sp-total').textContent = DB.sparks.length;
  document.getElementById('sp-hot').textContent   = hot;
  document.getElementById('sp-warm').textContent  = warm;
  document.getElementById('sp-cool').textContent  = cool;

  const el = document.getElementById('sparks-list');
  if (!DB.sparks.length) { el.innerHTML = HQComponents.emptyState('⚡', 'No interests logged yet. Add what your brain keeps returning to.'); return; }

  const sorted = [...DB.sparks].sort((a,b) => {
    const heatOrder = { hot:0, warm:1, cool:2 };
    return (heatOrder[a.heat]||2) - (heatOrder[b.heat]||2);
  });

  el.innerHTML = sorted.map(s => `<div class="spark-card${s.heat==='hot'?' active-hf':''}" id="spc-${s.id}">
    <div class="spark-hd" onclick="document.getElementById('spc-${s.id}').classList.toggle('open')">
      <div class="spark-ico">${esc(s.emoji)||'⚡'}</div>
      <div class="spark-info">
        <div class="spark-name">${esc(s.name)}</div>
        <div class="spark-meta">
          <span>${CAT_LABELS[s.cat]||s.cat}</span>
          ${s.resources ? '<span>📚 '+esc(s.resources.slice(0,30))+'</span>' : ''}
        </div>
      </div>
      <span class="spark-heat ${s.heat||'cool'}">${HEAT_LABELS[s.heat]||s.heat}</span>
    </div>
    <div class="spark-body">
      ${s.notes ? `<div style="font-size:12px;color:var(--text2);line-height:1.6;margin-top:6px">${esc(s.notes)}</div>` : ''}
      ${s.resources ? `<div style="font-size:11px;color:var(--teal);margin-top:6px">📚 ${esc(s.resources)}</div>` : ''}
      <div style="display:flex;gap:7px;margin-top:9px">
        <button style="background:var(--surface);border:1.5px solid var(--border);color:var(--text2);border-radius:7px;padding:4px 11px;font-size:10px;font-weight:700;cursor:pointer;font-family:inherit" onclick="openEditSpark('${s.id}')">✏️ Edit</button>
        <button style="background:none;border:1.5px solid rgba(255,107,107,.3);color:var(--red);border-radius:7px;padding:4px 11px;font-size:10px;font-weight:700;cursor:pointer;font-family:inherit" onclick="deleteSpark('${s.id}')">🗑</button>
      </div>
    </div>
  </div>`).join('');
}

function openEditSpark(id) {
  const s = DB.sparks.find(x=>x.id===id); if(!s) return;
  document.getElementById('spark-modal-title').textContent = 'Edit Interest';
  document.getElementById('spm-id').value        = id;
  document.getElementById('spm-name').value      = s.name||'';
  document.getElementById('spm-emoji').value     = s.emoji||'';
  document.getElementById('spm-cat').value       = s.cat||'other';
  document.getElementById('spm-heat').value      = s.heat||'warm';
  document.getElementById('spm-notes').value     = s.notes||'';
  document.getElementById('spm-resources').value = s.resources||'';
  openModal('spark-modal');
}
function saveSpark() {
  const name = document.getElementById('spm-name').value.trim();
  if (!name) { showToast('⚠️ Name required'); return; }
  const id = document.getElementById('spm-id').value || uid();
  const entry = { id, name, emoji:document.getElementById('spm-emoji').value.trim()||'⚡', cat:document.getElementById('spm-cat').value, heat:document.getElementById('spm-heat').value, notes:document.getElementById('spm-notes').value.trim(), resources:document.getElementById('spm-resources').value.trim() };
  const idx = DB.sparks.findIndex(s=>s.id===id);
  if (idx>=0) DB.sparks[idx]=entry; else DB.sparks.unshift(entry);
  persist(); closeModal('spark-modal');
  ['spm-id','spm-name','spm-emoji','spm-notes','spm-resources'].forEach(i=>{const el=document.getElementById(i);if(el)el.value='';});
  document.getElementById('spark-modal-title').textContent = 'Add Interest';
  renderSparks(); showToast('⚡ Saved!');
}
async function deleteSpark(id) {
  if(!(await HQConfirm.ask('Remove this interest?', {danger:true})))return;
  DB.sparks = DB.sparks.filter(s=>s.id!==id);
  persist(); renderSparks();
}

// ════════════════════════════════════════════════════════════
// HYPERFOCUS LOG + LIVE TIMER
// ════════════════════════════════════════════════════════════
function startHyperfocus() {
  const topic = document.getElementById('hfm-topic').value.trim();
  if (!topic) { showToast('⚠️ Topic required'); return; }
  const now = Date.now();
  const startInput = document.getElementById('hfm-start').value;
  let startTs = now;
  if (startInput) {
    const [h,m] = startInput.split(':').map(Number);
    const d = new Date(); d.setHours(h,m,0,0);
    startTs = d.getTime();
  }
  const entry = {
    id: uid(), topic, cat: document.getElementById('hfm-cat').value,
    intention: document.getElementById('hfm-intention').value.trim(),
    startTs, elapsedMs: 0, status: 'active', date: todayStr(),
  };
  DB.hyperfocus.unshift(entry);
  persist(); closeModal('hf-modal');
  ['hfm-topic','hfm-intention'].forEach(i=>{const el=document.getElementById(i);if(el)el.value='';});
  document.getElementById('hfm-start').value='';
  sw('hyperfocus', document.querySelectorAll('.ntab')[1]);
  showToast('🔥 Hyperfocus session started!');
}

function pauseHF(id) {
  const hf = DB.hyperfocus.find(x=>x.id===id); if(!hf) return;
  if (hf.status==='active') {
    hf.elapsedMs += (Date.now() - (hf.lastResumedTs||hf.startTs));
    hf.status = 'paused';
    clearInterval(_hfTimers[id]);
    delete _hfTimers[id];
  } else if (hf.status==='paused') {
    hf.lastResumedTs = Date.now();
    hf.status = 'active';
    startHFTimer(id);
  }
  persist(); renderHyperfocus();
}

function stopHF(id) {
  const hf = DB.hyperfocus.find(x=>x.id===id); if(!hf) return;
  if (hf.status==='active') {
    hf.elapsedMs += (Date.now() - (hf.lastResumedTs||hf.startTs));
  }
  hf.status = 'done'; hf.endTs = Date.now();
  clearInterval(_hfTimers[id]); delete _hfTimers[id];
  persist(); renderHyperfocus();
  showToast('✅ Session logged — ' + fmtDuration(hf.elapsedMs));
}

function deleteHF(id) {
  clearInterval(_hfTimers[id]); delete _hfTimers[id];
  DB.hyperfocus = DB.hyperfocus.filter(h=>h.id!==id);
  persist(); renderHyperfocus();
}

function startHFTimer(id) {
  clearInterval(_hfTimers[id]);
  _hfTimers[id] = setInterval(() => {
    const el = document.getElementById('hftimer-'+id);
    if (!el) { clearInterval(_hfTimers[id]); return; }
    const hf = DB.hyperfocus.find(x=>x.id===id);
    if (!hf || hf.status!=='active') { clearInterval(_hfTimers[id]); return; }
    const total = hf.elapsedMs + (Date.now() - (hf.lastResumedTs||hf.startTs));
    el.textContent = fmtDuration(total);
  }, 10000);
}

function renderHyperfocus() {
  const active = DB.hyperfocus.filter(h=>h.status==='active').length;
  const done   = DB.hyperfocus.filter(h=>h.status==='done');
  const avgMs  = done.length ? done.reduce((a,h)=>a+(h.elapsedMs||0),0)/done.length : 0;
  const topicMap={};
  DB.hyperfocus.forEach(h=>{if(h.topic)topicMap[h.topic]=(topicMap[h.topic]||0)+1;});
  const topTopic = Object.entries(topicMap).sort((a,b)=>b[1]-a[1])[0];

  document.getElementById('hf-total').textContent = DB.hyperfocus.length;
  document.getElementById('hf-active').textContent= active;
  document.getElementById('hf-avg').textContent   = done.length ? fmtDuration(avgMs) : '—';
  document.getElementById('hf-top').textContent   = topTopic ? topTopic[0].slice(0,14) : '—';

  const el = document.getElementById('hf-list');
  if (!DB.hyperfocus.length) { el.innerHTML=HQComponents.emptyState('🔥', "No sessions yet. Start one when you notice you're hyperfocusing."); return; }

  el.innerHTML = DB.hyperfocus.slice(0,20).map(hf => {
    const isActive = hf.status==='active';
    const isPaused = hf.status==='paused';
    const isDone   = hf.status==='done';
    const current  = isActive ? hf.elapsedMs + (Date.now()-(hf.lastResumedTs||hf.startTs)) : hf.elapsedMs;

    if (isActive && !_hfTimers[hf.id]) startHFTimer(hf.id);

    return `<div class="hf-log-item${isActive?' active':''}">
      <div style="display:flex;align-items:flex-start;gap:9px;margin-bottom:7px">
        <div style="flex:1">
          <div class="hf-name">${esc(hf.topic)}</div>
          <div class="hf-meta">
            <span>${fmtDate(hf.date)}</span>
            ${hf.cat ? '<span>'+CAT_LABELS[hf.cat]||hf.cat+'</span>' : ''}
          </div>
        </div>
        <div style="text-align:right">
          <div class="hf-timer" id="hftimer-${hf.id}">${fmtDuration(current)}</div>
          <span class="hf-status ${hf.status}">${isActive?'🟢 Active':isPaused?'⏸ Paused':'✅ Done'}</span>
        </div>
      </div>
      ${hf.intention ? `<div style="font-size:11px;color:var(--muted);font-style:italic;margin-bottom:8px">🎯 ${esc(hf.intention)}</div>` : ''}
      <div class="hf-controls">
        ${!isDone ? `<button class="hf-ctrl-btn ${isActive?'pause':'start'}" onclick="pauseHF('${hf.id}')">${isActive?'⏸ Pause':'▶ Resume'}</button>` : ''}
        ${!isDone ? `<button class="hf-ctrl-btn stop" onclick="stopHF('${hf.id}')">⏹ Done</button>` : ''}
        <button class="hf-ctrl-btn del" onclick="deleteHF('${hf.id}')">🗑</button>
      </div>
    </div>`;
  }).join('');
}

// ════════════════════════════════════════════════════════════
// IDEAS
// ════════════════════════════════════════════════════════════
function renderIdeas() {
  const stages = [...new Set(DB.ideas.map(i=>i.stage))];
  const filterEl = document.getElementById('ideas-filter-row');
  filterEl.innerHTML = ['all',...Object.keys(STAGE_LABELS)].filter(k=>k==='all'||stages.includes(k)).map(k=>
    `<button class="fchip${_ideasFilter===k?' on':''}" onclick="setIdeasFilter('${k}',this)">${k==='all'?'All':STAGE_LABELS[k]||k}</button>`
  ).join('');

  const items = _ideasFilter==='all' ? DB.ideas : DB.ideas.filter(i=>i.stage===_ideasFilter);
  const el = document.getElementById('ideas-list');
  if (!items.length) { el.innerHTML=HQComponents.emptyState('💡', 'No ideas yet. Capture everything — even the half-formed ones. Especially those.'); return; }

  const sorted = [...items].sort((a,b)=>{const o={active:0,incubating:1,spark:2,shelved:3};return(o[a.stage]||2)-(o[b.stage]||2);});
  el.innerHTML = sorted.map(i=>`<div class="idea-card" onclick="openEditIdea('${i.id}')">
    <div class="idea-name">${esc(i.title)}</div>
    ${i.detail ? `<div class="idea-excerpt">${esc(i.detail)}</div>` : (i.excite ? `<div class="idea-excerpt">${esc(i.excite)}</div>` : '')}
    <div class="idea-meta">
      <span class="idea-cat">${IDEA_CATS[i.cat]||i.cat}</span>
      <span class="idea-stage ${i.stage||'spark'}">${STAGE_LABELS[i.stage]||i.stage}</span>
      ${i.nextAction ? `<span style="font-size:9px;color:var(--teal);font-weight:700">→ ${esc(i.nextAction.slice(0,30))}</span>` : ''}
      <button onclick="event.stopPropagation();deleteIdea('${i.id}')" style="margin-left:auto;background:none;border:none;color:var(--muted);cursor:pointer;font-size:11px">✕</button>
    </div>
  </div>`).join('');
}

function setIdeasFilter(stage) { _ideasFilter=stage; renderIdeas(); }

function openEditIdea(id) {
  const i = DB.ideas.find(x=>x.id===id); if(!i) return;
  document.getElementById('idea-modal-title').textContent = 'Edit Idea';
  document.getElementById('idm-id').value     = id;
  document.getElementById('idm-title').value  = i.title||'';
  document.getElementById('idm-cat').value    = i.cat||'other';
  document.getElementById('idm-stage').value  = i.stage||'spark';
  document.getElementById('idm-detail').value = i.detail||'';
  document.getElementById('idm-excite').value = i.excite||'';
  document.getElementById('idm-next').value   = i.nextAction||'';
  openModal('idea-modal');
}

function saveIdea() {
  const title = document.getElementById('idm-title').value.trim();
  if (!title) { showToast('⚠️ Title required'); return; }
  const id = document.getElementById('idm-id').value || uid();
  const entry = { id, title, cat:document.getElementById('idm-cat').value, stage:document.getElementById('idm-stage').value, detail:document.getElementById('idm-detail').value.trim(), excite:document.getElementById('idm-excite').value.trim(), nextAction:document.getElementById('idm-next').value.trim(), createdAt:id===document.getElementById('idm-id').value?undefined:new Date().toISOString() };
  const idx = DB.ideas.findIndex(i=>i.id===id);
  if (idx>=0) DB.ideas[idx]=entry; else DB.ideas.unshift(entry);
  persist(); closeModal('idea-modal');
  ['idm-id','idm-title','idm-detail','idm-excite','idm-next'].forEach(i=>{const el=document.getElementById(i);if(el)el.value='';});
  document.getElementById('idea-modal-title').textContent='Capture Idea';
  renderIdeas(); showToast('💡 Saved!');
}

function deleteIdea(id) {
  DB.ideas = DB.ideas.filter(i=>i.id!==id);
  persist(); renderIdeas();
}

// ════════════════════════════════════════════════════════════
// RABBIT HOLES
// ════════════════════════════════════════════════════════════
function renderHoles() {
  const cats = [...new Set(DB.holes.map(h=>h.cat))];
  const filterEl = document.getElementById('holes-filter-row');
  filterEl.innerHTML = ['all',...cats].map(k=>
    `<button class="fchip${_holesFilter===k?' on':''}" onclick="setHolesFilter('${k}',this)">${k==='all'?'All':HOLE_CATS[k]||k}</button>`
  ).join('');

  const items = _holesFilter==='all' ? DB.holes : DB.holes.filter(h=>h.cat===_holesFilter);
  const el = document.getElementById('holes-list');
  if (!items.length) { el.innerHTML=HQComponents.emptyState('🐇', 'No rabbit holes logged. Next time you fall down one, bookmark it here instead of 12 tabs.'); return; }

  el.innerHTML = items.map(h=>`<div class="hole-item">
    <div class="hole-ico">${HOLE_CATS[h.cat]?.split(' ')[0]||'🐇'}</div>
    <div class="hole-info">
      <div class="hole-title">${esc(h.title)}</div>
      ${h.note ? `<div class="hole-note">${esc(h.note)}</div>` : ''}
      ${h.url  ? `<a href="${esc(h.url)}" target="_blank" rel="noopener" class="hole-url">🔗 ${esc(h.url.replace(/^https?:\/\//,'').slice(0,60))}</a>` : ''}
      <span class="hole-cat">${HOLE_CATS[h.cat]||h.cat}</span>
    </div>
    <button onclick="deleteHole('${h.id}')" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:12px;flex-shrink:0;align-self:flex-start">✕</button>
  </div>`).join('');
}

function setHolesFilter(cat) { _holesFilter=cat; renderHoles(); }

function saveHole() {
  const title = document.getElementById('rhm-title').value.trim();
  if (!title) { showToast('⚠️ Title required'); return; }
  DB.holes.unshift({ id:uid(), title, cat:document.getElementById('rhm-cat').value, url:document.getElementById('rhm-url').value.trim(), note:document.getElementById('rhm-note').value.trim(), at:new Date().toISOString() });
  if (DB.holes.length>200) DB.holes=DB.holes.slice(0,200);
  persist(); closeModal('hole-modal');
  ['rhm-title','rhm-url','rhm-note'].forEach(i=>{const el=document.getElementById(i);if(el)el.value='';});
  renderHoles(); showToast('🐇 Logged!');
}

function deleteHole(id) { DB.holes=DB.holes.filter(h=>h.id!==id); persist(); renderHoles(); }

// ════════════════════════════════════════════════════════════
// QUOTES
// ════════════════════════════════════════════════════════════
function renderQuotes() {
  const el = document.getElementById('quotes-list');
  if (!DB.quotes.length) { el.innerHTML=HQComponents.emptyState('✨', 'No quotes yet. Add things that shifted your thinking or belong in your permanent memory.'); return; }
  el.innerHTML = DB.quotes.map(q=>`<div class="quote-card">
    <div class="quote-text">"${esc(q.text)}"</div>
    ${q.attr ? `<div class="quote-attr">— ${esc(q.attr)}</div>` : ''}
    <button onclick="deleteQuote('${q.id}')" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:10px;margin-top:6px">✕ Remove</button>
  </div>`).join('');
}

function saveQuote() {
  const text = document.getElementById('qm-text').value.trim();
  if (!text) { showToast('⚠️ Quote required'); return; }
  DB.quotes.unshift({ id:uid(), text, attr:document.getElementById('qm-attr').value.trim(), at:new Date().toISOString() });
  persist(); closeModal('quote-modal');
  ['qm-text','qm-attr'].forEach(i=>{const el=document.getElementById(i);if(el)el.value='';});
  renderQuotes(); showToast('✨ Saved!');
}

function deleteQuote(id) { DB.quotes=DB.quotes.filter(q=>q.id!==id); persist(); renderQuotes(); }

// ── INIT ──────────────────────────────────────────────────────
load();
renderSparks();
// Resume any active HF sessions
DB.hyperfocus.filter(h=>h.status==='active').forEach(h=>startHFTimer(h.id));

// ── HQEnvironment (Tier 6 adoption) ───────────────────────────────────────
// In survival mode, hide complex idea/holes/quotes tabs; keep sparks + hyperfocus.
var _isSurvivalHidden = ['tab-ideas', 'tab-holes', 'tab-quotes'];
function _isApplySurvival() {
  var inSurvival = window.HQEnvironment && HQEnvironment.isSurvival();
  _isSurvivalHidden.forEach(function(id) {
    var el = document.getElementById(id);
    if (!el) return;
    if (inSurvival) el.setAttribute('data-survival-hidden', '1');
    else            el.removeAttribute('data-survival-hidden');
  });
}
window.addEventListener('hq-environment-changed', _isApplySurvival);
_isApplySurvival();

// ── GLOBAL EXPORTS (inline onclick handlers need window scope) ──────────────
window.sw = sw;
