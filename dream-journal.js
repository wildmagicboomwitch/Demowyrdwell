// Sidenav: hqOpenSidenav/hqCloseSidenav from hq-core.js
// ══════════════════════════════════════════════════════
//  DATA — localStorage key: audhd-hq-dreams
// ══════════════════════════════════════════════════════
let dreams = [];
let filter = 'all';
let editId = null;
let charts = {};

let fs = { sleep:0, vivid:0, lucid:0, emotions:new Set(), symbols:new Set(), types:new Set(), custSyms:[] };

function load() {
  try {
    dreams = HQSafe.store.get(HQKeys.DREAMS, []);
  } catch(e) { dreams = []; }
}

function save() {
  HQSafe.store.set(HQKeys.DREAMS, dreams);
  updateHeader();
  flagMissedEntries();
}

function updateHeader() {
  const totalEl = document.getElementById('h-total');
  const streakEl = document.getElementById('h-streak');
  if (totalEl) totalEl.textContent = dreams.length;
  if (!streakEl) return;
  if (!dreams.length) { streakEl.textContent = 0; return; }
  const dates = [...new Set(dreams.map(d => safeDate(d)).filter(Boolean))].sort().reverse();
  let streak = 0;
  const check = new Date();
  for (let i = 0; i < 90; i++) {
    const ds = check.toISOString().split('T')[0];
    if (dates.includes(ds)) { streak++; check.setDate(check.getDate()-1); }
    else if (i === 0) { check.setDate(check.getDate()-1); }
    else break;
  }
  streakEl.textContent = streak;
}

// ══════════════════════════════════════════════════════
//  HQFLAG — missed entry reminders to index Hero2
// ══════════════════════════════════════════════════════
function flagMissedEntries() {
  const today = todayStr();
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate()-1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  const loggedToday     = dreams.some(d => safeDate(d) === today);
  const loggedYesterday = dreams.some(d => safeDate(d) === yesterdayStr);
  const h = new Date().getHours();
  const flagId2day  = 'dream-missed-2day';
  const flagIdToday = 'dream-nudge-today';

  function doFlag(id, text) {
    const item = { id, source:'dream-journal', type:'reminder', text, href:'dream-journal.html', ts:Date.now() };
    if (typeof window.hqFlag === 'function') {
      window.hqFlag(item);
    } else {
      try {
        let flags = HQSafe.store.get(HQKeys.FLAGS, []);
        flags = flags.filter(f => f.id !== id);
        flags.push(item);
        HQSafe.store.set(HQKeys.FLAGS, flags);
        window.dispatchEvent(new CustomEvent('hq-flags-updated'));
      } catch(e) {}
    }
  }

  function doUnflag(id) {
    if (typeof window.hqUnflag === 'function') {
      window.hqUnflag(id);
    } else {
      try {
        let flags = HQSafe.store.get(HQKeys.FLAGS, []);
        flags = flags.filter(f => f.id !== id);
        HQSafe.store.set(HQKeys.FLAGS, flags);
        window.dispatchEvent(new CustomEvent('hq-flags-updated'));
      } catch(e) {}
    }
  }

  if (h < 8 || h > 23) return;

  if (!loggedToday && !loggedYesterday) {
    doFlag(flagId2day, '💭 No dream logged in 2+ days — tap to open journal');
    doUnflag(flagIdToday);
  } else if (!loggedToday && h >= 10) {
    doFlag(flagIdToday, '💭 Dream journal — log today\'s dream');
    doUnflag(flagId2day);
  } else {
    doUnflag(flagId2day);
    doUnflag(flagIdToday);
  }
}

// ══════════════════════════════════════════════════════
//  TAB SWITCH
// ══════════════════════════════════════════════════════
function switchTab(tab, btn) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-'+tab).classList.add('active');
  btn.classList.add('active');
  if (tab === 'archive')  renderArchive();
  if (tab === 'symbols')  renderSymbols();
  if (tab === 'patterns') renderPatterns();
}

// ══════════════════════════════════════════════════════
//  FORM
// ══════════════════════════════════════════════════════
function setR(type, val) {
  fs[type] = val;
  const g = type === 'sleep' ? 'g-sleep' : type === 'vivid' ? 'g-vivid' : 'g-lucid';
  document.querySelectorAll('#'+g+' .rbtn').forEach(b => {
    b.classList.remove('on');
    if (+b.dataset.v === val) b.classList.add('on');
  });
}

function tog(el, cat) {
  el.classList.toggle('on');
  const txt = el.textContent.trim();
  if (el.classList.contains('on')) fs[cat].add(txt);
  else fs[cat].delete(txt);
  if (cat === 'symbols') {
    const n = fs.symbols.size;
    const b = document.getElementById('sym-badge');
    if (b) { b.style.display = n > 0 ? 'inline-flex' : 'none'; b.textContent = n; }
  }
}

function addCustomSym() {
  const inp = document.getElementById('cust-input');
  const v = inp.value.trim();
  if (!v || fs.custSyms.includes(v)) { inp.value = ''; return; }
  fs.custSyms.push(v);
  fs.symbols.add('⭐ '+v);
  renderCustChips();
  inp.value = '';
  const n = fs.symbols.size;
  const b = document.getElementById('sym-badge');
  if (b) { b.style.display = 'inline-flex'; b.textContent = n; }
}

function renderCustChips() {
  const c = document.getElementById('cust-chips');
  if (!c) return;
  c.innerHTML = '';
  fs.custSyms.forEach(s => {
    const chip = document.createElement('button');
    chip.className = 'tchip c-sym on';
    chip.textContent = '⭐ '+s;
    chip.onclick = () => {
      fs.custSyms = fs.custSyms.filter(x => x !== s);
      fs.symbols.delete('⭐ '+s);
      renderCustChips();
      const n = fs.symbols.size;
      const b = document.getElementById('sym-badge');
      if (b) { b.style.display = n > 0 ? 'inline-flex' : 'none'; b.textContent = n; }
    };
    c.appendChild(chip);
  });
}

function saveDream() {
  const titleEl = document.getElementById('f-title');
  const dateEl  = document.getElementById('f-date');
  const title   = titleEl.value.trim();
  const date    = dateEl.value;

  if (!title) {
    titleEl.style.borderColor = 'var(--red)';
    titleEl.focus();
    setTimeout(() => { titleEl.style.borderColor = ''; }, 2000);
    return;
  }
  if (!date) { dateEl.focus(); return; }

  const d = {
    id:       editId || Date.now().toString(),
    title, date,
    time:     document.getElementById('f-time').value,
    desc:     document.getElementById('f-desc').value.trim(),
    sleep:    fs.sleep, vivid: fs.vivid, lucid: fs.lucid,
    emotions: [...fs.emotions],
    symbols:  [...fs.symbols],
    types:    [...fs.types],
    saved:    new Date().toISOString()
  };

  if (editId) {
    const idx = dreams.findIndex(x => x.id === editId);
    if (idx !== -1) dreams[idx] = d;
    else dreams.unshift(d);
  } else {
    dreams.unshift(d);
  }

  save();
  clearForm();
  toast('🌙 Dream saved!');
}

function clearForm() {
  try { document.getElementById('f-title').value = ''; } catch(e) {}
  try { document.getElementById('f-date').value  = todayStr(); } catch(e) {}
  try { document.getElementById('f-time').value  = ''; } catch(e) {}
  try { document.getElementById('f-desc').value  = ''; } catch(e) {}

  // Reset state object
  fs = { sleep:0, vivid:0, lucid:0, emotions:new Set(), symbols:new Set(), types:new Set(), custSyms:[] };

  // Clear all chip selections
  document.querySelectorAll('.tchip.on').forEach(c => c.classList.remove('on'));
  document.querySelectorAll('.rbtn.on').forEach(b => b.classList.remove('on'));

  // Clear custom chips
  try { document.getElementById('cust-chips').innerHTML = ''; } catch(e) {}

  // Hide symbol badge
  try {
    const b = document.getElementById('sym-badge');
    if (b) { b.style.display = 'none'; b.textContent = '0'; }
  } catch(e) {}

  // Reset form mode label
  try {
    const lbl = document.getElementById('form-mode-label');
    if (lbl) lbl.textContent = '🌙 New Dream Entry';
  } catch(e) {}

  editId = null;
}

// ══════════════════════════════════════════════════════
//  ARCHIVE
// ══════════════════════════════════════════════════════
function setFilter(f, btn) {
  filter = f;
  document.querySelectorAll('.fchip').forEach(c => c.classList.remove('on'));
  btn.classList.add('on');
  renderArchive();
}

function renderArchive() {
  const q = (document.getElementById('arc-search').value || '').toLowerCase();
  const filtered = dreams.filter(d => {
    const ms = !q || d.title.toLowerCase().includes(q) || (d.desc||'').toLowerCase().includes(q);
    const mf = filter === 'all' || d.types.some(t => t.includes(filter));
    return ms && mf;
  });

  document.getElementById('arc-count').textContent = filtered.length+' entr'+(filtered.length===1?'y':'ies');
  const list = document.getElementById('arc-list');

  if (!filtered.length) {
    list.innerHTML = HQComponents.emptyState('🌙', dreams.length?'No dreams match this filter.':'No dreams logged yet. Head to ✍️ Log Dream!');
    return;
  }

  list.innerHTML = filtered.map(d => {
    const icon = getDreamIcon(d);
    const previewTags = [...d.emotions.slice(0,2), ...d.types.slice(0,2)];
    const symTags = d.symbols.slice(0,3);
    const dots = (n, max, col) => Array.from({length:max},(_,i)=>
      `<span class="dot${i<n?' f':''}" style="${i<n?'background:'+col:''}"></span>`).join('');
    return `
<div class="dcard" id="dc-${d.id}">
  <div class="dcard-hd" onclick="toggleCard('${d.id}')">
    <div class="dcard-icon">${icon}</div>
    <div class="dcard-info">
      <div class="dcard-title">${esc(d.title)}</div>
      <div class="dcard-meta">
        <span>📅 ${fmtDate(safeDate(d))}</span>
        ${d.time?`<span>⏰ ${d.time}</span>`:''}
        ${d.sleep?`<span>😴 <span class="dots">${dots(d.sleep,5,'#9b6dff')}</span></span>`:''}
        ${d.vivid?`<span>✨ <span class="dots">${dots(d.vivid,5,'#4ecdc4')}</span></span>`:''}
        ${d.lucid>0?`<span style="color:var(--teal)">🔮 Lucid ${d.lucid}/3</span>`:''}
      </div>
      <div class="dcard-tags">
        ${previewTags.map(t=>`<span class="mtag">${t}</span>`).join('')}
        ${symTags.map(t=>`<span class="mtag sym">${t}</span>`).join('')}
      </div>
    </div>
    <span class="expand-icon">▼</span>
  </div>
  <div class="dcard-body">
    ${d.desc?`<div class="dcard-desc">${esc(d.desc)}</div>`:'<div style="color:var(--muted);font-size:13px;margin:12px 0;font-style:italic">No description written.</div>'}
    ${d.symbols.length?`<div style="margin:8px 0 4px"><span style="font-size:11px;color:var(--muted);text-transform:uppercase;font-weight:700;letter-spacing:.5px">Symbols: </span>${d.symbols.map(s=>`<span class="mtag sym">${s}</span>`).join(' ')}</div>`:''}
    ${d.emotions.length?`<div style="margin:4px 0"><span style="font-size:11px;color:var(--muted);text-transform:uppercase;font-weight:700;letter-spacing:.5px">Emotions: </span>${d.emotions.map(e=>`<span class="mtag">${e}</span>`).join(' ')}</div>`:''}
    <div class="dcard-actions">
      <button class="btn-sm" onclick="editDream('${d.id}')">✏️ Edit</button>
      <button class="btn-sm del" id="del-${d.id}" onclick="delDream('${d.id}')">🗑️ Delete</button>
    </div>
  </div>
</div>`;
  }).join('');
}

function getDreamIcon(d) {
  if (d.types.some(t=>t.includes('Nightmare'))) return '😱';
  if (d.types.some(t=>t.includes('Lucid')||t.includes('✨'))) return '✨';
  if (d.types.some(t=>t.includes('Recurring'))) return '🔄';
  if (d.types.some(t=>t.includes('Surreal'))) return '🌀';
  if (d.types.some(t=>t.includes('Prophetic'))) return '🔮';
  return '🌙';
}

function toggleCard(id) { document.getElementById('dc-'+id).classList.toggle('open'); }

function editDream(id) {
  const d = dreams.find(x => x.id === id);
  if (!d) return;
  editId = id; clearForm(); editId = id;
  document.getElementById('f-title').value = d.title;
  document.getElementById('f-date').value  = safeDate(d) || '';
  document.getElementById('f-time').value  = d.time || '';
  document.getElementById('f-desc').value  = d.desc || '';
  document.getElementById('form-mode-label').textContent = '✏️ Editing Dream';
  if (d.sleep) setR('sleep', d.sleep);
  if (d.vivid) setR('vivid', d.vivid);
  setR('lucid', d.lucid || 0);
  d.types.forEach(t    => { findChip('g-types',    t, el => { el.classList.add('on'); fs.types.add(t); }); });
  d.emotions.forEach(t => { findChip('g-emotions', t, el => { el.classList.add('on'); fs.emotions.add(t); }); });
  d.symbols.forEach(t  => {
    const el = findChipEl('g-symbols', t);
    if (el) { el.classList.add('on'); fs.symbols.add(t); }
    else if (t.startsWith('⭐')) { const s = t.replace('⭐ ',''); fs.custSyms.push(s); fs.symbols.add(t); }
  });
  renderCustChips();
  const n = fs.symbols.size;
  const b = document.getElementById('sym-badge');
  if (b) { b.style.display = n > 0 ? 'inline-flex' : 'none'; b.textContent = n; }
  switchTab('log', document.querySelector('.nav-tab'));
  window.scrollTo({ top:0, behavior:'smooth' });
}

function findChip(gid, text, cb) { const el = findChipEl(gid, text); if (el) cb(el); }
function findChipEl(gid, text) {
  return [...document.querySelectorAll('#'+gid+' .tchip')].find(b => b.textContent.trim() === text) || null;
}

// ── Two-tap delete (no native confirm() — unreliable in PWA) ──────────────────
function delDream(id) {
  const btn = document.getElementById('del-' + id);
  if (!btn) return;

  if (btn.dataset.pending !== 'true') {
    // First tap — enter pending state
    btn.dataset.pending = 'true';
    btn.textContent = '⚠️ Confirm?';
    btn.classList.add('pending');
    // Auto-cancel after 3s
    setTimeout(() => {
      if (btn.dataset.pending === 'true') {
        btn.dataset.pending = 'false';
        btn.textContent = '🗑️ Delete';
        btn.classList.remove('pending');
      }
    }, 3000);
    return;
  }

  // Second tap — actually delete
  btn.dataset.pending = 'false';
  dreams = dreams.filter(d => d.id !== id);
  save();
  renderArchive();
  toast('🗑️ Dream deleted');
}

// ══════════════════════════════════════════════════════
//  SYMBOLS TAB
// ══════════════════════════════════════════════════════
function renderSymbols() {
  const symMap = {}, emoMap = {};
  let nightmares = 0;
  dreams.forEach(d => {
    d.symbols.forEach(s => { symMap[s] = (symMap[s]||0)+1; });
    d.emotions.forEach(e => { emoMap[e] = (emoMap[e]||0)+1; });
    if (d.types.some(t => t.includes('Nightmare'))) nightmares++;
  });

  const symSort = Object.entries(symMap).sort((a,b) => b[1]-a[1]);
  const max = symSort[0]?.[1] || 1;

  document.getElementById('ss-total').textContent    = dreams.length;
  document.getElementById('ss-unique').textContent   = symSort.length;
  document.getElementById('ss-top').textContent      = symSort[0] ? symSort[0][0].split(' ')[0] : '—';
  document.getElementById('ss-nights').textContent   = nightmares;
  document.getElementById('ss-all-count').textContent = symSort.length+' symbols';

  const topEl = document.getElementById('top-sym-list');
  if (!symSort.length) {
    topEl.innerHTML = HQComponents.emptyState('🔮', 'No symbols tracked yet.');
  } else {
    topEl.innerHTML = symSort.slice(0,10).map(([s,n],i) => {
      const pct   = Math.round(n/max*100);
      const parts = s.split(' '); const emoji = parts[0]; const name = parts.slice(1).join(' ') || s;
      const medals = ['🥇','🥈','🥉'];
      return `<div class="top-row">
        <div class="top-rank">${medals[i]||i+1}</div>
        <div class="top-emoji">${emoji}</div>
        <div class="top-name">${name}</div>
        <div class="top-bar-w"><div class="top-bar"><div class="top-fill" style="width:${pct}%"></div></div></div>
        <div class="top-n">${n}</div>
      </div>`;
    }).join('');
  }

  const grid = document.getElementById('sym-grid');
  if (!symSort.length) {
    grid.innerHTML = `<div style="grid-column:1/-1">${HQComponents.emptyState('✨', 'Symbol patterns will emerge as you log more dreams.')}</div>`;
  } else {
    grid.innerHTML = symSort.map(([s,n]) => {
      const pct  = Math.round(n/max*100);
      const lvl  = n>=max*.6?'hi':n>=max*.3?'mid':'';
      const parts= s.split(' '); const emoji = parts[0]; const name = parts.slice(1).join(' ') || s;
      return `<div class="sym-item ${lvl}">
        <div class="sym-emoji">${emoji}</div>
        <div class="sym-name">${name}</div>
        <div class="sym-count">${n}</div>
        <div class="sym-bar"><div class="sym-fill" style="width:${pct}%"></div></div>
      </div>`;
    }).join('');
  }

  const ECOLS = {
    'Joyful':'#ffd166','Fearful':'#a78bfa','Sad':'#60a5fa','Angry':'#ef476f',
    'Peaceful':'#06d6a0','Confused':'#fd7e14','Excited':'#ff6b9d','Anxious':'#fb923c',
    'Loved':'#f472b6','Curious':'#4ecdc4','Numb':'#888ab8','Hopeful':'#86efac'
  };
  const emoSort = Object.entries(emoMap).sort((a,b) => b[1]-a[1]);
  const emoMax  = emoSort[0]?.[1] || 1;
  const eland   = document.getElementById('emo-landscape');
  if (!emoSort.length) {
    eland.innerHTML = `<div style="width:100%">${HQComponents.emptyState('💚', 'Emotion breakdown will appear after logging dreams.')}</div>`;
  } else {
    eland.innerHTML = emoSort.map(([e,n]) => {
      const icon = e.split(' ')[0]; const name = e.replace(/^\S+\s*/,'');
      const col  = ECOLS[name] || '#9b6dff';
      const pct  = Math.round(n/emoMax*100);
      return `<div class="emo-card" style="border-top:3px solid ${col}">
        <div class="emo-card-icon">${icon}</div>
        <div class="emo-card-count" style="color:${col}">${n}</div>
        <div class="emo-card-name">${name}</div>
        <div class="emo-card-bar"><div class="emo-card-fill" style="width:${pct}%;background:${col}"></div></div>
      </div>`;
    }).join('');
  }
}

// ══════════════════════════════════════════════════════
//  PATTERNS TAB — Chart.js
// ══════════════════════════════════════════════════════
function renderPatterns() {
  const n = dreams.length;
  const avgSleep = n ? +(dreams.reduce((a,d)=>a+(d.sleep||0),0)/n).toFixed(1) : 0;
  const avgVivid = n ? +(dreams.reduce((a,d)=>a+(d.vivid||0),0)/n).toFixed(1) : 0;
  const lucidN   = dreams.filter(d=>d.lucid>0).length;
  document.getElementById('pp-total').textContent = n;
  document.getElementById('pp-sleep').textContent = avgSleep || '—';
  document.getElementById('pp-vivid').textContent = avgVivid || '—';
  document.getElementById('pp-lucid').textContent = lucidN;

  if (!n) { Object.values(charts).forEach(c=>c&&c.destroy()); charts={}; return; }

  const sorted = [...dreams].filter(d=>safeDate(d)).sort((a,b)=>new Date(safeDate(a))-new Date(safeDate(b)));
  const labels  = sorted.map(d=>fmtShort(safeDate(d)));

  const _isLight = document.documentElement.getAttribute('data-mode') === 'light';
  const GCOL  = _isLight?'rgba(100,80,160,.15)':'rgba(50,50,90,.5)';
  const ACOL  = _isLight?'#7060b0':'#666699';

  const axCfg = () => ({
    x: { ticks:{color:ACOL,font:{size:10},maxTicksLimit:8}, grid:{color:GCOL}, border:{display:false} },
    y: { ticks:{color:ACOL,font:{size:10}},                 grid:{color:GCOL}, border:{display:false} }
  });
  const legCfg = { labels:{color:ACOL,font:{size:11},boxWidth:12} };
  const base   = { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}} };

  dc('ch-sleep', new Chart(document.getElementById('ch-sleep'), {
    type: 'line',
    data: { labels, datasets:[{ label:'Sleep Quality', data:sorted.map(d=>d.sleep||null),
      borderColor:'#9b6dff', backgroundColor:'rgba(155,109,255,.12)',
      fill:true, tension:.4, pointBackgroundColor:'#9b6dff', pointRadius:4, spanGaps:true }] },
    options: { ...base, scales:{ ...axCfg(), y:{...axCfg().y, min:0, max:5} } }
  }));

  dc('ch-vivid', new Chart(document.getElementById('ch-vivid'), {
    type: 'line',
    data: { labels, datasets:[{ label:'Vividness', data:sorted.map(d=>d.vivid||null),
      borderColor:'#4ecdc4', backgroundColor:'rgba(78,205,196,.12)',
      fill:true, tension:.4, pointBackgroundColor:'#4ecdc4', pointRadius:4, spanGaps:true }] },
    options: { ...base, scales:{ ...axCfg(), y:{...axCfg().y, min:0, max:5} } }
  }));

  const emoMap2 = {};
  dreams.forEach(d=>d.emotions.forEach(e=>{ emoMap2[e]=(emoMap2[e]||0)+1; }));
  const emoE  = Object.entries(emoMap2).sort((a,b)=>b[1]-a[1]).slice(0,8);
  const EPAL  = ['#ffd166','#a78bfa','#60a5fa','#ef476f','#06d6a0','#fd7e14','#ff6b9d','#4ecdc4'];
  dc('ch-emo', new Chart(document.getElementById('ch-emo'), {
    type: 'doughnut',
    data: { labels:emoE.map(([e])=>e), datasets:[{ data:emoE.map(([,n])=>n), backgroundColor:EPAL, borderColor:_isLight?'#fff':'#1a1a35', borderWidth:2 }] },
    options: { ...base, cutout:'58%', plugins:{ legend:{ display:true, ...legCfg } } }
  }));

  const symMap2 = {};
  dreams.forEach(d=>d.symbols.forEach(s=>{ symMap2[s]=(symMap2[s]||0)+1; }));
  const symE = Object.entries(symMap2).sort((a,b)=>b[1]-a[1]).slice(0,8);
  dc('ch-sym', new Chart(document.getElementById('ch-sym'), {
    type: 'bar',
    data: { labels:symE.map(([s])=>s.split(' ').slice(0,2).join(' ')), datasets:[{ data:symE.map(([,n])=>n), backgroundColor:'rgba(155,109,255,.7)', borderColor:'#9b6dff', borderWidth:1 }] },
    options: { ...base, indexAxis:'y', scales:axCfg() }
  }));

  const d30=[],c30=[];
  for (let i=29;i>=0;i--) {
    const dt=new Date(); dt.setDate(dt.getDate()-i);
    const ds=dt.toISOString().split('T')[0];
    d30.push(fmtShort(ds));
    c30.push(dreams.filter(dr=>safeDate(dr)===ds).length);
  }
  dc('ch-freq', new Chart(document.getElementById('ch-freq'), {
    type: 'bar',
    data: { labels:d30, datasets:[{ label:'Dreams', data:c30, backgroundColor:'rgba(78,205,196,.6)', borderColor:'#4ecdc4', borderWidth:1, borderRadius:4 }] },
    options: { ...base, scales:{ ...axCfg(), y:{ ...axCfg().y, min:0, ticks:{stepSize:1,color:ACOL,font:{size:10}} } } }
  }));

  const typeMap = {};
  dreams.forEach(d => {
    if (!d.types.length) typeMap['🌙 Normal'] = (typeMap['🌙 Normal']||0)+1;
    d.types.forEach(t=>{ typeMap[t]=(typeMap[t]||0)+1; });
  });
  const typeE = Object.entries(typeMap).sort((a,b)=>b[1]-a[1]);
  const TPAL  = ['#9b6dff','#4ecdc4','#ef476f','#ffd166','#ff6b9d','#d8b4fe','#06d6a0','#118ab2','#fd7e14'];
  dc('ch-types', new Chart(document.getElementById('ch-types'), {
    type: 'bar',
    data: { labels:typeE.map(([t])=>t), datasets:[{ data:typeE.map(([,n])=>n), backgroundColor:TPAL, borderRadius:4 }] },
    options: { ...base, scales:axCfg() }
  }));
}

function dc(id, inst) {
  if (charts[id]) charts[id].destroy();
  charts[id] = inst;
}

// ══════════════════════════════════════════════════════
//  IMPORT / EXPORT
// ══════════════════════════════════════════════════════
function openIE() {
  refreshIEStats();
  document.getElementById('ie-modal').classList.add('show');
}
function closeIE() {
  document.getElementById('ie-modal').classList.remove('show');
  document.getElementById('ie-file-merge').value   = '';
  document.getElementById('ie-file-replace').value = '';
}
function refreshIEStats() {
  document.getElementById('ie-stats').innerHTML =
    `<span class="ie-stat">🌙 <strong>${dreams.length}</strong> dreams</span>`;
}
function exportData() {
  const payload = {
    _meta: { source:'AuDHD HQ — Dream Journal', version:1, exportedAt:new Date().toISOString(), count:dreams.length },
    dreams
  };
  const blob = new Blob([JSON.stringify(payload,null,2)], {type:'application/json'});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `dream-journal-backup-${todayStr()}.json`; a.click();
  URL.revokeObjectURL(url);
  toast('✅ Exported successfully!');
}
async function importData(input, mode) {
  const file = input.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = async e => {
    try {
      const parsed   = JSON.parse(e.target.result);
      const incoming = Array.isArray(parsed) ? parsed : (parsed.dreams || []);
      if (!Array.isArray(incoming)) throw new Error('Invalid format');
      if (mode === 'replace') {
        if(!(await HQConfirm.ask(`⚠️ This will DELETE your ${dreams.length} existing dream(s) and replace with ${incoming.length} imported dream(s). Are you sure?`, {danger:true})))return;
        dreams = incoming;
      } else {
        const existingIds = new Set(dreams.map(d=>d.id));
        const newOnes     = incoming.filter(d=>d.id&&!existingIds.has(d.id));
        dreams = [...dreams, ...newOnes];
        toast(`🔀 Merged! Added ${newOnes.length} new dream(s).`);
      }
      save(); refreshIEStats(); renderArchive();
      if (mode === 'replace') toast(`✅ Replaced with ${incoming.length} dream(s)!`);
    } catch(err) {
      HQToast.error('❌ Could not read file. Make sure it\'s a valid Dream Journal export.');
    }
  };
  reader.readAsText(file);
  input.value = '';
}

// ══════════════════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════════════════
function todayStr() { return new Date().toISOString().split('T')[0]; }

function safeDate(entry) {
  if (entry.date)  return entry.date;
  if (entry.saved) return entry.saved.split('T')[0];
  return null;
}

function fmtDate(s) {
  if (!s) return '';
  return new Date(s+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
}

function fmtShort(s) {
  if (!s) return '';
  return new Date(s+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'});
}

const esc = s => HQUtils.esc(s); // → HQUtils.esc

function toast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg; t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 2400);
}

// ══════════════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════════════
load();
updateHeader();
flagMissedEntries();
document.getElementById('f-date').value = todayStr();

// P3: Re-render when config changes (flags, profile updated from Customize)
window.addEventListener('hq-config-updated', function() {
  updateHeader();
});

