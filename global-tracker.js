(function () {
  'use strict';
// FIX-03: ensure tag migrations have run before reading tag data
if (window.HQMigrate) HQMigrate.run('tags');
  /* ── Phase C5: IIFE + strict mode + VM extraction — global-tracker ── */
  /* ── Phase C6: HQRenderer.list() migration for key list renders ──── */
  /* ── BUG FIX: ld() was JSON.parse()ing an already-parsed object ──── */

// ════════════════════════════════════════════════════════
//  GLOBAL TRACKER — AuDHD HQ
//  Read-only. Reads from all module localStorage keys.
//  No writes except potential hqFlag calls.
// ════════════════════════════════════════════════════════

// ── SAFE LOAD ────────────────────────────────────────────
// FIX (C5): HQStore.get() already parses JSON internally. The previous
// implementation did JSON.parse(parsedObject) which always threw a
// SyntaxError, causing ld() to always return the default — meaning
// the global tracker was showing no real data.
function ld(key, def) {
  return HQSafe.store.get(key, def !== undefined ? def : null);
}

// ── ALL DATA SOURCES ─────────────────────────────────────
function getData() {
  return {
    checkins  : ld(HQKeys.CHECKIN_LOG, []),
    health    : ld(HQKeys.HEALTH, {}),
    energyState: ld(HQKeys.ENERGY_STATE, null),
    walking   : ld(HQKeys.WALKING, {}),
    dreams    : ld(HQKeys.DREAMS, []),
    taskboard : ld(HQKeys.TASKBOARD, {}),
    finance   : ld(HQKeys.FINANCE, {}),
    kitchen   : ld(HQKeys.KITCHEN, {}),
    fridge    : ld(HQKeys.FRIDGE, []),
    flags     : ld(HQKeys.FLAGS, []),
    profile   : ld(HQKeys.PROFILE, {}),
    projects  : ld('hq_projects', []),
    concepts  : ld('hq_concepts', []),
    tags      : ld(HQKeys.TAGS, {}),
    // P10 additions
    routines  : ld(HQKeys.ROUTINES, null),
    prepwork  : ld(HQKeys.PREPWORK, null),
    ideaStudio: ld(HQKeys.IDEA_STUDIO, null),
    social    : ld(HQKeys.SOCIAL_BRAIN, null),
    monthly   : ld(HQKeys.MONTHLY, {}),
    weekly    : ld(HQKeys.WEEKLY, {}),
  };
}

// ── DATE HELPERS ─────────────────────────────────────────
const today    = new Date().toISOString().split('T')[0];
let   _rangeDays = 7;

function dateStr(d) { return (d instanceof Date ? d : new Date(d)).toISOString().split('T')[0]; }
function daysAgo(n) { const d = new Date(); d.setDate(d.getDate()-n); return dateStr(d); }
function inRange(dateS, days) { return dateS >= daysAgo(days) && dateS <= today; }
function fmtDate(s) { return new Date(s+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'}); }
const esc = s => HQUtils.esc(s); // → HQUtils.esc

// ── CHART.JS DEFAULTS ────────────────────────────────────
let _charts = {};
function getThemeColors() {
  const t = document.documentElement.getAttribute('data-theme') || 'lilac';
  const text  = t==='night' ? '#B0A0D8' : t==='morning' ? '#7a5030' : '#7a6020';
  const grid  = t==='night' ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.07)';
  return { text, grid };
}
function makeChart(id, cfg) {
  if (_charts[id]) { try { _charts[id].destroy(); } catch(e) {} }
  const canvas = document.getElementById(id);
  if (!canvas) return null;
  const { text, grid } = getThemeColors();
  // Inject default font + grid color
  if (cfg.options?.scales) {
    Object.values(cfg.options.scales).forEach(ax => {
      if (!ax.ticks) ax.ticks = {};
      ax.ticks.color = ax.ticks.color || text;
      ax.ticks.font  = { size: 10, family: "'Plus Jakarta Sans', sans-serif" };
      if (ax.grid) ax.grid.color = ax.grid.color || grid;
    });
  }
  if (cfg.options) {
    if (!cfg.options.plugins) cfg.options.plugins = {};
    if (!cfg.options.plugins.legend) cfg.options.plugins.legend = { display: false };
  }
  _charts[id] = new Chart(canvas, cfg);
  return _charts[id];
}

// ── TAB SWITCHER ─────────────────────────────────────────
let _activeTab = 'overview';

function buildTab(id) {
  const D = getData();
  if (id === 'overview')  buildOverview(D);
  if (id === 'activity')  buildActivity(D);
  if (id === 'health')    buildHealth(D);
  if (id === 'metrics')   buildMetrics();
  if (id === 'reports')   buildReports();
  if (id === 'projects')  buildProjects(D);
  if (id === 'finance')   buildFinance(D);
  // P10 new tabs
  if (id === 'routines')  buildRoutines(D);
  if (id === 'ideas')     buildIdeas(D);
  if (id === 'social')    buildSocial(D);
}

function rebuildAll() { buildTab(_activeTab); }

function setRange(days, btn) {
  _rangeDays = days;
  document.querySelectorAll('.range-btn').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  buildActivity(getData());
}

// ════════════════════════════════════════════════════════
//  OVERVIEW TAB
// ════════════════════════════════════════════════════════
// ── C5 VM: Flags ──────────────────────────────────────────────────────────
// Pure function — no DOM, no side effects.
const _FLAGS_EMOJI = {pastdue:'🔴',expiring:'🟠',missed:'🟡',urgent:'⚠️',reminder:'📌'};
function _buildFlagsVM(flags) {
  return (flags || []).slice(0, 8).map((f, i) => ({
    id:     f.id || String(f.ts || i),
    href:   f.href || '#',
    emoji:  _FLAGS_EMOJI[f.type] || '•',
    text:   f.text   || '',
    source: f.source || '',
  }));
}
function _applyFlagEl(el, f) {
  el.href = f.href;
  HQRenderer.setText(el, '.flag-emoji',  f.emoji);
  HQRenderer.setText(el, '.list-label',  f.text);
  HQRenderer.setText(el, '.list-meta',   f.source);
}

function buildOverview(D) {
  // Hero stats
  const streak = calcCheckinStreak(D.checkins);
  set('ov-checkin-streak', streak + 'd');

  const walkTotal = calcWalkTotal(D.walking);
  set('ov-walk-miles', walkTotal.toFixed(0));

  const activeProjects = D.projects.filter(p => !p.archived && p.status === 'active').length;
  set('ov-projects-active', activeProjects);

  const tasks = D.taskboard.tasks || [];
  const openTasks = tasks.filter(t => !t.done).length;
  set('ov-tasks-open', openTasks);

  // This week stats
  const weekCheckins = D.checkins.filter(c => inRange(c.date||c.at?.split('T')[0], 7));
  set('ov-week-checkins', weekCheckins.length);

  const weekSessions = (D.walking.entries||D.walking.sessions||[]).filter(s => inRange(s.date, 7));
  const weekMiles = weekSessions.reduce((a,s) => a + (parseFloat(s.miles)||0), 0);
  set('ov-week-walk', weekMiles.toFixed(1));

  const weekDreams = D.dreams.filter(d => inRange(d.date, 7));
  set('ov-week-dreams', weekDreams.length);

  const weekSymptoms = (D.health.symptoms||[]).filter(s => inRange(s.date, 7));
  set('ov-week-symptoms', weekSymptoms.length);

  const weekTasksDone = tasks.filter(t => t.done && t.completedAt && inRange(dateStr(t.completedAt), 7));
  set('ov-week-tasks-done', weekTasksDone.length);

  const sleepEntries = (D.health.sleep||[]).filter(s => inRange(s.date, 7));
  const avgSleep = sleepEntries.length
    ? (sleepEntries.reduce((a,s) => a+(parseFloat(s.hours)||0),0)/sleepEntries.length).toFixed(1)
    : '—';
  set('ov-week-sleep', avgSleep);

  // Energy now
  const es = D.energyState;
  const energyNow = document.getElementById('ov-energy-now');
  const energyTs  = document.getElementById('ov-energy-ts');
  if (es && es.level) {
    const map = {low:'🔴 Low energy',medium:'🟡 Medium energy',high:'🟢 High energy'};
    // C10-ext: DOM construction — es.level is an enum but avoid innerHTML with stored values
    const epill = document.createElement('span');
    epill.className = 'epill ' + (es.level || '');
    epill.textContent = map[es.level] || es.level;
    energyNow.innerHTML = '';
    energyNow.appendChild(epill);
    energyTs.textContent = es.ts ? 'Updated ' + new Date(es.ts).toLocaleString('en-US',{hour:'numeric',minute:'2-digit',month:'short',day:'numeric'}) : '';
  } else {
    energyNow.textContent = 'No energy state recorded yet — log from Check-In.';
    energyTs.textContent = '';
  }

  // Flags — C6: HQRenderer.list() replaces innerHTML
  const flags = D.flags || [];
  const flagsEl = document.getElementById('ov-flags-list');
  set('ov-flag-count', flags.length ? `(${flags.length})` : '');
  HQRenderer.list(flagsEl, _buildFlagsVM(flags), {
    key:   f => f.id,
    build(f) {
      const el = HQRenderer.fromTemplate('gt-flag-item-template');
      _applyFlagEl(el, f);
      return el;
    },
    update(el, f) { _applyFlagEl(el, f); },
    empty: '<div class="empty">✅ No active alerts</div>',
  });

  // 14-day heatmap
  buildHeatmap(D);
}

function buildHeatmap(D) {
  const el = document.getElementById('ov-heatmap');
  const days = 28;
  const checkinDates = new Set(D.checkins.map(c => c.date||c.at?.split('T')[0]));
  const walkDates    = new Set((D.walking.entries||D.walking.sessions||[]).map(s => s.date));
  const dreamDates   = new Set(D.dreams.map(d => d.date));

  const rows = [
    { label:'✅', key:'checkin', dates: checkinDates, color: '#C8BAFF' },
    { label:'🚶', key:'walk',    dates: walkDates,    color: '#06D6A0' },
    { label:'💭', key:'dream',   dates: dreamDates,   color: '#4ECDC4' },
  ];

  let html = '<div class="heatmap">';
  // Day labels row
  html += '<div class="hm-row"><div class="hm-lbl"></div><div class="hm-cells">';
  for (let i = days-1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate()-i);
    const ds = dateStr(d);
    const isToday = ds === today;
    html += `<div style="width:12px;height:12px;display:flex;align-items:flex-end;justify-content:center;">
      <span style="font-size:7px;color:var(--muted);${isToday?'color:var(--purple);font-weight:800':''}">
        ${d.getDate()===1||isToday?d.toLocaleDateString('en-US',{month:'short',day:'numeric'}).split(' ')[1]:''}
      </span></div>`;
  }
  html += '</div></div>';

  rows.forEach(row => {
    html += `<div class="hm-row"><div class="hm-lbl">${row.label}</div><div class="hm-cells">`;
    for (let i = days-1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate()-i);
      const ds = dateStr(d);
      const filled = row.dates.has(ds);
      const isToday = ds === today;
      const bg = filled ? row.color : 'var(--border)';
      const outline = isToday ? '1px solid var(--purple)' : 'none';
      html += `<div class="hm-cell" style="background:${bg};outline:${outline}" title="${ds}"></div>`;
    }
    html += '</div></div>';
  });

  html += '<div class="hm-legend">Less <div class="hm-legend-cells">';
  [0,0.3,0.6,1].forEach(a => {
    html += `<div class="hm-cell" style="background:rgba(200,186,255,${a})"></div>`;
  });
  html += '</div> More</div></div>';
  el.innerHTML = html;
}

// ════════════════════════════════════════════════════════
//  ACTIVITY TAB
// ════════════════════════════════════════════════════════
function buildActivity(D) {
  const days = _rangeDays;
  const checkins = D.checkins.filter(c => inRange(c.date||c.at?.split('T')[0], days));

  // Streak
  const streak = calcCheckinStreak(D.checkins);
  set('act-streak-num', streak);
  set('act-streak-lbl', `${streak} day streak`);
  set('act-total-checkins', D.checkins.length);

  const avgMood = checkins.length
    ? (checkins.filter(c=>c.mood).reduce((a,c)=>a+c.mood,0) / checkins.filter(c=>c.mood).length).toFixed(1)
    : '—';
  const avgEnergy = checkins.length
    ? (checkins.filter(c=>c.energy).reduce((a,c)=>a+c.energy,0) / checkins.filter(c=>c.energy).length).toFixed(1)
    : '—';
  set('act-avg-mood', avgMood);
  set('act-avg-energy', avgEnergy);

  // Streak dots (last 30 days)
  const dotsEl = document.getElementById('act-streak-dots');
  const checkinDateSet = new Set(D.checkins.map(c=>c.date||c.at?.split('T')[0]));
  let dotsHTML = '';
  for (let i=29; i>=0; i--) {
    const d = new Date(); d.setDate(d.getDate()-i);
    const ds = dateStr(d);
    const done = checkinDateSet.has(ds);
    const isToday = ds === today;
    dotsHTML += `<div class="s-dot ${done?(isToday?'today':'done'):''}" title="${ds}"></div>`;
  }
  dotsEl.innerHTML = dotsHTML;

  // Mood + energy line chart
  const labels = [];
  const moodData = [];
  const energyData = [];
  for (let i = days-1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate()-i);
    const ds = dateStr(d);
    labels.push(fmtDate(ds));
    const dayCheckins = D.checkins.filter(c=>(c.date||c.at?.split('T')[0])===ds);
    const avgM = dayCheckins.filter(c=>c.mood).length
      ? dayCheckins.filter(c=>c.mood).reduce((a,c)=>a+c.mood,0)/dayCheckins.filter(c=>c.mood).length
      : null;
    const avgE = dayCheckins.filter(c=>c.energy).length
      ? dayCheckins.filter(c=>c.energy).reduce((a,c)=>a+c.energy,0)/dayCheckins.filter(c=>c.energy).length
      : null;
    moodData.push(avgM);
    energyData.push(avgE);
  }
  makeChart('chartMoodEnergy', {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label:'Mood', data:moodData, borderColor:'#C8BAFF', backgroundColor:'rgba(200,186,255,.08)', tension:.3, spanGaps:true, pointRadius:3 },
        { label:'Energy', data:energyData, borderColor:'#06D6A0', backgroundColor:'rgba(6,214,160,.08)', tension:.3, spanGaps:true, pointRadius:3 },
      ]
    },
    options: {
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ display:true, labels:{ color: getThemeColors().text, font:{size:10} } } },
      scales: {
        y:{ min:1, max:5, grid:{}, ticks:{stepSize:1} },
        x:{ grid:{}, ticks:{ maxTicksLimit: days<=7?7:14 } }
      }
    }
  });

  // Energy distribution donut
  const energyLog = D.health.energyLog || [];
  const recent = energyLog.filter(e => inRange(dateStr(new Date(e.ts)), days));
  const eCounts = {low:0,medium:0,high:0};
  recent.forEach(e => { if (eCounts[e.level]!==undefined) eCounts[e.level]++; });
  const eTotal = eCounts.low+eCounts.medium+eCounts.high || 1;
  makeChart('chartEnergyDist', {
    type: 'doughnut',
    data: {
      labels:['Low','Medium','High'],
      datasets:[{ data:[eCounts.low,eCounts.medium,eCounts.high], backgroundColor:['#FF6B6B','#F4CA00','#06D6A0'], borderWidth:0 }]
    },
    options: { responsive:false, cutout:'65%', plugins:{ legend:{ display:false } } }
  });
  document.getElementById('energyDistLegend').innerHTML = [
    {label:'Low',color:'#FF6B6B',count:eCounts.low},
    {label:'Medium',color:'#F4CA00',count:eCounts.medium},
    {label:'High',color:'#06D6A0',count:eCounts.high},
  ].map(r=>`<div class="dl-row"><div class="dl-dot" style="background:${r.color}"></div><div class="dl-lbl">${r.label}</div><div class="dl-val">${r.count} (${Math.round(r.count/eTotal*100)}%)</div></div>`).join('');

  // Walking bar chart
  const walkLabels = [], walkVals = [];
  for (let i=days-1; i>=0; i--) {
    const d = new Date(); d.setDate(d.getDate()-i);
    const ds = dateStr(d);
    walkLabels.push(fmtDate(ds));
    const daySessions = (D.walking.entries||D.walking.sessions||[]).filter(s=>s.date===ds);
    walkVals.push(daySessions.reduce((a,s)=>a+(parseFloat(s.miles)||0),0));
  }
  makeChart('chartWalking', {
    type:'bar',
    data:{ labels:walkLabels, datasets:[{ data:walkVals, backgroundColor:'rgba(6,214,160,.6)', borderRadius:3 }] },
    options:{ responsive:true, maintainAspectRatio:false, scales:{ y:{grid:{},ticks:{}}, x:{grid:{display:false},ticks:{maxTicksLimit:days<=7?7:10}} } }
  });

  // Dream frequency bar
  const dreamLabels=[], dreamVals=[];
  for (let i=days-1; i>=0; i--) {
    const d = new Date(); d.setDate(d.getDate()-i);
    const ds = dateStr(d);
    dreamLabels.push(fmtDate(ds));
    dreamVals.push(D.dreams.filter(dr=>dr.date===ds).length);
  }
  makeChart('chartDreams', {
    type:'bar',
    data:{ labels:dreamLabels, datasets:[{ data:dreamVals, backgroundColor:'rgba(78,205,196,.6)', borderRadius:3 }] },
    options:{ responsive:true, maintainAspectRatio:false, scales:{ y:{grid:{},ticks:{stepSize:1}}, x:{grid:{display:false},ticks:{maxTicksLimit:days<=7?7:10}} } }
  });

  // Sleep line chart
  const sleepLabels=[], sleepVals=[], sleepQVals=[];
  for (let i=days-1; i>=0; i--) {
    const d = new Date(); d.setDate(d.getDate()-i);
    const ds = dateStr(d);
    sleepLabels.push(fmtDate(ds));
    const entry = (D.health.sleep||[]).find(s=>s.date===ds);
    sleepVals.push(entry ? parseFloat(entry.hours)||null : null);
    sleepQVals.push(entry ? parseFloat(entry.quality)||null : null);
  }
  makeChart('chartSleep', {
    type:'line',
    data:{ labels:sleepLabels, datasets:[
      { label:'Hours', data:sleepVals, borderColor:'#C8BAFF', backgroundColor:'rgba(200,186,255,.06)', tension:.3, spanGaps:true, pointRadius:3 },
      { label:'Quality', data:sleepQVals, borderColor:'#4ECDC4', backgroundColor:'rgba(78,205,196,.04)', tension:.3, spanGaps:true, pointRadius:3, yAxisID:'y2' },
    ]},
    options:{ responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ display:true, labels:{ color:getThemeColors().text, font:{size:10} } } },
      scales:{
        y:{ grid:{}, ticks:{}, position:'left' },
        y2:{ min:1, max:5, grid:{ display:false }, ticks:{ stepSize:1 }, position:'right' },
        x:{ grid:{display:false}, ticks:{ maxTicksLimit:days<=7?7:14 } }
      }
    }
  });
}

// ── C5 VMs: Health tab ────────────────────────────────────────────────────

// Energy log VM — returns the 14 most recent entries with display labels
function _buildEnergyLogVM(energyLog) {
  const lvlEmoji = {low:'🔴',medium:'🟡',high:'🟢'};
  return (energyLog || []).slice(0, 14).map((e, i) => ({
    id:    String(e.ts || i),
    level: e.level || '',
    emoji: lvlEmoji[e.level] || '•',
    date:  new Date(e.ts).toLocaleDateString('en-US', {month:'short', day:'numeric'}),
  }));
}

// Symptom frequency bar VM — top-N symptoms by count in a given range
function _buildSymptomsBarVM(symptoms, days) {
  const rangeSymptoms = (symptoms || []).filter(s => inRange(s.date, days));
  const counts = {};
  rangeSymptoms.forEach(s => { const k = s.name||s.category||'Other'; counts[k]=(counts[k]||0)+1; });
  const sorted = Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0, 8);
  const max = sorted[0]?.[1] || 1;
  return sorted.map(([name, count]) => ({ id: name, name, count, pct: Math.round(count/max*100) }));
}

// Body tags bar VM — top-N body tags from check-ins in range
function _buildBodyTagsVM(checkins, days) {
  const recent = (checkins || []).filter(c => inRange(c.date||c.at?.split('T')[0], days));
  const counts = {};
  recent.forEach(c => (c.bodyTags||[]).forEach(t => { counts[t]=(counts[t]||0)+1; }));
  const sorted = Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0, 8);
  const max = sorted[0]?.[1] || 1;
  return sorted.map(([name, count]) => ({ id: name, name, count, pct: Math.round(count/max*100) }));
}

// Dream symbols bar VM
function _buildDreamSymbolsVM(dreams) {
  const counts = {};
  (dreams || []).forEach(d => (d.symbols||[]).forEach(s => { counts[s]=(counts[s]||0)+1; }));
  const sorted = Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0, 10);
  const max = sorted[0]?.[1] || 1;
  return sorted.map(([name, count]) => ({ id: name, name, count, pct: Math.round(count/max*100) }));
}

// Fridge expiry VM — items expiring within 5 days
function _buildFridgeExpiryVM(fridge) {
  return (Array.isArray(fridge) ? fridge : [])
    .filter(item => item.expiry)
    .map(item => ({
      id:       item.id || (item.name + item.expiry),
      name:     item.name || 'Item',
      daysLeft: Math.ceil((new Date(item.expiry).getTime() - Date.now()) / 86400000),
    }))
    .filter(item => item.daysLeft <= 5)
    .sort((a, b) => a.daysLeft - b.daysLeft);
}

// Populators for HQRenderer templates
function _applyHBarRowEl(el, item, accentVar) {
  HQRenderer.setText(el, '.hbar-lbl', item.name);
  HQRenderer.setText(el, '.hbar-val', item.count);
  const fill = el.querySelector('.hbar-fill');
  if (fill) { fill.style.width = item.pct + '%'; fill.style.background = accentVar; }
}
function _applyFridgeEl(el, item) {
  HQRenderer.setText(el, '.list-label', '🥫 ' + item.name);
  const badge = el.querySelector('.list-badge');
  if (!badge) return;
  badge.textContent = item.daysLeft <= 0 ? 'Expired'
    : item.daysLeft === 1 ? 'Expires today'
    : `${item.daysLeft}d`;
  badge.style.color       = item.daysLeft <= 1 ? 'var(--red)' : item.daysLeft <= 3 ? 'var(--orange)' : '';
  badge.style.borderColor = item.daysLeft <= 1 ? 'var(--red)' : '';
}

function buildHealth(D) {
  // Energy log — C6: HQRenderer.list()
  const energyLog = D.health.energyLog || [];
  const energyLogEl = document.getElementById('health-energy-log');
  const energyLogVM = _buildEnergyLogVM(energyLog);
  if (!energyLogVM.length) {
    HQRenderer.emptyState(energyLogEl, '', 'No energy logs yet — log from Check-In.');
  } else {
    // Energy pills are tightly coupled to a flex-wrap row — use a single span wrapper
    // C10 can migrate to full template; for now render the pill row safely without innerHTML for user data
    const row = document.createElement('div');
    row.className = 'energy-row';
    energyLogVM.forEach(e => {
      const span = document.createElement('span');
      span.className = 'epill ' + e.level;
      span.textContent = `${e.emoji} ${e.level} · ${e.date}`;
      row.appendChild(span);
    });
    energyLogEl.replaceChildren(row);
  }

  // Symptoms bar — C6: HQRenderer.list() with hbar-row template
  const symBarsEl = document.getElementById('health-symptoms-bars');
  const symptomsVM = _buildSymptomsBarVM(D.health.symptoms, 30);
  HQRenderer.list(symBarsEl, symptomsVM, {
    key: item => item.id,
    build(item) {
      const el = HQRenderer.fromTemplate('gt-hbar-row-template');
      _applyHBarRowEl(el, item, 'var(--red,#ff6b6b)');
      return el;
    },
    update(el, item) { _applyHBarRowEl(el, item, 'var(--red,#ff6b6b)'); },
    empty: '<div class="empty">No symptoms logged in last 30 days</div>',
  });

  // Body tags — C6: HQRenderer.list()
  const bodyTagsEl = document.getElementById('health-body-tags');
  const bodyTagsVM = _buildBodyTagsVM(D.checkins, 30);
  HQRenderer.list(bodyTagsEl, bodyTagsVM, {
    key: item => item.id,
    build(item) {
      const el = HQRenderer.fromTemplate('gt-hbar-row-template');
      _applyHBarRowEl(el, item, 'var(--orange)');
      return el;
    },
    update(el, item) { _applyHBarRowEl(el, item, 'var(--orange)'); },
    empty: '<div class="empty">No body tags in last 30 days</div>',
  });

  // Sleep chart (30d)
  const sleepL=[], sleepH=[], sleepQ=[];
  for (let i=29; i>=0; i--) {
    const d = new Date(); d.setDate(d.getDate()-i);
    const ds = dateStr(d);
    const entry = (D.health.sleep||[]).find(s=>s.date===ds);
    sleepL.push(fmtDate(ds));
    sleepH.push(entry ? parseFloat(entry.hours)||null : null);
    sleepQ.push(entry ? parseFloat(entry.quality)||null : null);
  }
  makeChart('chartHealthSleep', {
    type:'bar',
    data:{ labels:sleepL, datasets:[
      { label:'Hours', data:sleepH, backgroundColor:'rgba(200,186,255,.5)', borderRadius:3, yAxisID:'y' },
      { label:'Quality', data:sleepQ, type:'line', borderColor:'#4ECDC4', tension:.3, spanGaps:true, pointRadius:2, yAxisID:'y2' },
    ]},
    options:{ responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ display:true, labels:{ color:getThemeColors().text, font:{size:10} } } },
      scales:{
        y:{ grid:{}, ticks:{}, position:'left' },
        y2:{ min:1, max:5, grid:{ display:false }, ticks:{stepSize:1}, position:'right' },
        x:{ grid:{display:false}, ticks:{ maxTicksLimit:12 } }
      }
    }
  });

  // Dream stats
  set('hlt-dream-total', D.dreams.length);
  set('hlt-dream-lucid', D.dreams.filter(d=>d.lucid).length);
  set('hlt-dream-30d', D.dreams.filter(d=>inRange(d.date,30)).length);
  const qualDreams = D.dreams.filter(d=>d.quality);
  set('hlt-dream-avg-qual', qualDreams.length ? (qualDreams.reduce((a,d)=>a+d.quality,0)/qualDreams.length).toFixed(1) : '—');

  // Dream symbols — C6: HQRenderer.list()
  const symEl = document.getElementById('health-dream-symbols');
  const dreamSymsVM = _buildDreamSymbolsVM(D.dreams);
  HQRenderer.list(symEl, dreamSymsVM, {
    key: item => item.id,
    build(item) {
      const el = HQRenderer.fromTemplate('gt-hbar-row-template');
      _applyHBarRowEl(el, item, 'var(--teal)');
      return el;
    },
    update(el, item) { _applyHBarRowEl(el, item, 'var(--teal)'); },
    empty: '<div class="empty">No symbols logged yet</div>',
  });

  // Fridge expiry — C6: HQRenderer.list()
  const fridgeEl = document.getElementById('health-fridge-expiry');
  const fridge = Array.isArray(D.fridge) ? D.fridge : (D.kitchen.inventory||[]);
  HQRenderer.list(fridgeEl, _buildFridgeExpiryVM(fridge), {
    key: item => item.id,
    build(item) {
      const el = HQRenderer.fromTemplate('gt-fridge-item-template');
      _applyFridgeEl(el, item);
      return el;
    },
    update(el, item) { _applyFridgeEl(el, item); },
    empty: '<div class="empty">Nothing expiring within 5 days 🎉</div>',
  });
}

// ── C5 VMs: Projects tab ──────────────────────────────────────────────────

// Project status legend VM
function _buildProjStatusLegendVM(live) {
  const statusMeta = {
    active:{label:'Active',color:'#06D6A0'},brainstorm:{label:'Brainstorm',color:'#C8BAFF'},
    finishing:{label:'Finishing',color:'#4ECDC4'},paused:{label:'Paused',color:'#FFA060'},
    stalled:{label:'Stalled',color:'#FF6B6B'},completed:{label:'Completed',color:'#06D6A0'},
    'hold-temp':{label:'Hold',color:'#A8AAA9'},'hold-indef':{label:'Hold ∞',color:'#A8AAA9'},
    deferred:{label:'Deferred',color:'#706090'},terminated:{label:'Terminated',color:'#FF6B6B'},
  };
  const total = live.length || 1;
  const counts = {};
  live.forEach(p => { counts[p.status]=(counts[p.status]||0)+1; });
  return Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([status, count]) => ({
    id:     status,
    label:  statusMeta[status]?.label || status,
    color:  statusMeta[status]?.color || '#706090',
    count,
    pct:    Math.round(count/total*100),
  }));
}

// Project recent log VM
function _buildProjRecentLogVM(projects) {
  const moods = {1:'😤',2:'😕',3:'😐',4:'🙂',5:'🚀'};
  const allLogs = [];
  projects.forEach(p => (p.howGoingLog||[]).forEach(e => allLogs.push({
    id:           String(e.ts || Math.random()),
    emoji:        moods[e.mood] || '📓',
    projectTitle: p.title || '',
    note:         e.note  || '',
    date:         e.ts ? new Date(e.ts).toLocaleDateString('en-US',{month:'short',day:'numeric'}) : '',
  })));
  allLogs.sort((a,b) => b.id - a.id);
  return allLogs.slice(0, 6);
}
function _applyProjLogEl(el, e) {
  HQRenderer.setText(el, '.log-emoji',   e.emoji);
  HQRenderer.setText(el, '.log-title',   e.projectTitle);
  HQRenderer.setText(el, '.log-note',    e.note);
  HQRenderer.setText(el, '.list-meta',   e.date);
}

// ════════════════════════════════════════════════════════
//  PROJECTS TAB
// ════════════════════════════════════════════════════════
function buildProjects(D) {
  const live = D.projects.filter(p=>!p.archived);

  // Status donut
  const statusMeta = {
    active:{label:'Active',color:'#06D6A0'},brainstorm:{label:'Brainstorm',color:'#C8BAFF'},
    finishing:{label:'Finishing',color:'#4ECDC4'},paused:{label:'Paused',color:'#FFA060'},
    stalled:{label:'Stalled',color:'#FF6B6B'},completed:{label:'Completed',color:'#06D6A0'},
    'hold-temp':{label:'Hold',color:'#A8AAA9'},'hold-indef':{label:'Hold ∞',color:'#A8AAA9'},
    deferred:{label:'Deferred',color:'#706090'},terminated:{label:'Terminated',color:'#FF6B6B'},
  };
  const statusCounts = {};
  live.forEach(p => { statusCounts[p.status]=(statusCounts[p.status]||0)+1; });
  const statusEntries = Object.entries(statusCounts).sort((a,b)=>b[1]-a[1]);
  makeChart('chartProjectStatus', {
    type:'doughnut',
    data:{
      labels: statusEntries.map(([k])=>statusMeta[k]?.label||k),
      datasets:[{ data:statusEntries.map(([,v])=>v), backgroundColor:statusEntries.map(([k])=>statusMeta[k]?.color||'#706090'), borderWidth:0 }]
    },
    options:{ responsive:false, cutout:'60%', plugins:{ legend:{display:false} } }
  });
  // Status legend — C6: HQRenderer.list()
  const statusLegend = document.getElementById('projectStatusLegend');
  HQRenderer.list(statusLegend, _buildProjStatusLegendVM(live), {
    key: item => item.id,
    build(item) {
      const el = HQRenderer.fromTemplate('gt-legend-row-template');
      _applyLegendRowEl(el, item);
      return el;
    },
    update(el, item) { _applyLegendRowEl(el, item); },
    empty: '',
  });

  // Category bars
  const catCounts = {};
  const catLabels = {home:'🏠 Home',creative:'🎨 Creative',work:'💼 Work',friends:'💌 Friends',fun:'🎉 Fun','life-plan':'🌱 Life Plan',health:'🏥 Health',finance:'💰 Finance',admin:'📋 Admin',self:'🧠 Self',personal:'🌿 Personal',other:'💭 Other'};
  live.forEach(p => { const k=p.cat||'other'; catCounts[k]=(catCounts[k]||0)+1; });
  const catSorted = Object.entries(catCounts).sort((a,b)=>b[1]-a[1]);
  const maxCat = catSorted[0]?.[1]||1;
  document.getElementById('proj-cat-bars').innerHTML = catSorted.map(([k,v])=>`
    <div class="hbar-row">
      <div class="hbar-lbl">${catLabels[k]||k}</div>
      <div class="hbar-track"><div class="hbar-fill" style="width:${v/maxCat*100}%;background:var(--purple)"></div></div>
      <div class="hbar-val">${v}</div>
    </div>`).join('') || '<div class="empty">No projects yet</div>';

  // Special flag counts
  set('proj-for-money',   live.filter(p=>p.forMoney).length);
  set('proj-for-friends', live.filter(p=>p.forFriends).length);
  set('proj-stalled',     live.filter(p=>p.status==='stalled').length);
  set('proj-concepts',    D.concepts.length);
  set('proj-completed',   live.filter(p=>p.status==='completed').length);
  set('proj-high-energy', live.filter(p=>p.energy==='e1').length);

  // Timeline length bars
  const tlenLabels = {short:'⚡ Short',medium:'📆 Medium',long:'🗓 Long',tbd:'❓ TBD'};
  const tlenCounts = {short:0,medium:0,long:0,tbd:0};
  live.forEach(p => { const k=p.timelineLen||'tbd'; if(tlenCounts[k]!=null) tlenCounts[k]++; });
  const maxTlen = Math.max(...Object.values(tlenCounts))||1;
  document.getElementById('proj-tlen-bars').innerHTML = Object.entries(tlenCounts).map(([k,v])=>`
    <div class="hbar-row">
      <div class="hbar-lbl">${tlenLabels[k]||k}</div>
      <div class="hbar-track"><div class="hbar-fill" style="width:${v/maxTlen*100}%;background:var(--teal)"></div></div>
      <div class="hbar-val">${v}</div>
    </div>`).join('');

  // Recent log entries — C6: HQRenderer.list()
  const logEl = document.getElementById('proj-recent-log');
  HQRenderer.list(logEl, _buildProjRecentLogVM(live), {
    key: e => e.id,
    build(e) {
      const el = HQRenderer.fromTemplate('gt-proj-log-item-template');
      _applyProjLogEl(el, e);
      return el;
    },
    update(el, e) { _applyProjLogEl(el, e); },
    empty: '<div class="empty">No log entries yet</div>',
  });

  // C10-02: Active projects list — migrated to HQRenderer.list()
  const activeList = document.getElementById('proj-active-list');
  const active = live.filter(p=>p.status==='active').slice(0,8);
  if (!active.length) { activeList.innerHTML='<div class="empty">No active projects</div>'; }
  else {
    HQRenderer.list(activeList, active, {
      key: function(p){ return p.id || p.title; },
      template: 'gt-proj-active-template',
      render: function(node, p){
        const {pct,done,total} = calcProjProgress(p);
        HQRenderer.setText(node, '.gpa-title', p.title);
        const moneyEl = node.querySelector('.gpa-money');
        const friendsEl = node.querySelector('.gpa-friends');
        moneyEl.style.display = p.forMoney ? '' : 'none';
        friendsEl.style.display = p.forFriends ? '' : 'none';
        node.querySelector('.gpa-bar').style.width = pct + '%';
        HQRenderer.setText(node, '.gpa-meta', done + '/' + total + ' steps · ' + pct + '%');
      }
    });
  }

  // C10-02: Stalled / needs attention — migrated to HQRenderer.list()
  const stalledList = document.getElementById('proj-stalled-list');
  const stalled = live.filter(p=>['stalled','hold-temp','hold-indef'].includes(p.status));
  if (!stalled.length) { stalledList.innerHTML='<div class="empty">Nothing stalled 🎉</div>'; }
  else {
    HQRenderer.list(stalledList, stalled, {
      key: function(p){ return p.id || p.title; },
      template: 'gt-proj-stalled-template',
      render: function(node, p){
        const badge = node.querySelector('.gps-badge');
        if(p.status==='stalled'){
          badge.textContent = '\ud83d\uded1 Stalled';
          badge.className = 'gps-badge sc sc-stalled';
        } else {
          badge.textContent = '\ud83e\udeb7 On Hold';
          badge.className = 'gps-badge sc sc-paused';
        }
        HQRenderer.setText(node, '.gps-title', p.title);
        const barriersEl = node.querySelector('.gps-barriers');
        if(p.statusComment && p.statusComment.barriers){
          HQRenderer.setText(barriersEl, null, '\ud83d\uded1 ' + p.statusComment.barriers);
          barriersEl.style.display = '';
        } else {
          barriersEl.style.display = 'none';
        }
      }
    });
  }
}

// ── C5 VMs: Finance + Tasks tab ───────────────────────────────────────────

// Task/finance legend VM (for task status donut legend)
function _buildTaskLegendVM(tasks) {
  const tDone = tasks.filter(t=>t.done).length;
  const tOpen = tasks.filter(t=>!t.done).length;
  return [
    {id:'open', label:'Open', color:'#FFA060', count: tOpen},
    {id:'done', label:'Done', color:'#06D6A0', count: tDone},
  ];
}

// Shared legend row populator (used by both project status and task status legends)
function _applyLegendRowEl(el, item) {
  const dot = el.querySelector('.dl-dot');
  if (dot) dot.style.background = item.color;
  HQRenderer.setText(el, '.dl-lbl', item.label);
  HQRenderer.setText(el, '.dl-val', item.count + (item.pct != null ? ` (${item.pct}%)` : ''));
}

// Overdue tasks VM
function _buildOverdueTasksVM(tasks) {
  const now = Date.now();
  return tasks
    .filter(t => !t.done && t.due && new Date(t.due).getTime() < now)
    .slice(0, 8)
    .map(t => ({
      id:   t.id || t.title,
      title: t.title || 'Task',
      date: t.due ? fmtDate(t.due.split('T')[0]) : '',
    }));
}
function _applyOverdueTaskEl(el, t) {
  HQRenderer.setText(el, '.list-label', t.title);
  HQRenderer.setText(el, '.list-meta',  t.date);
}

// Upcoming bills VM
function _buildUpcomingBillsVM(bills) {
  return (bills || [])
    .filter(b => b.dueDate || b.due)
    .map(b => ({
      id:       b.id || b.name,
      name:     b.name || 'Bill',
      amount:   b.amount ? '$' + parseFloat(b.amount).toFixed(0) : '',
      daysLeft: Math.ceil((new Date(b.dueDate||b.due).getTime() - Date.now()) / 86400000),
    }))
    .filter(b => b.daysLeft >= 0 && b.daysLeft <= 30)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 6);
}
function _applyBillEl(el, b) {
  HQRenderer.setText(el, '.list-label', '💳 ' + b.name);
  HQRenderer.setText(el, '.list-meta',  b.amount);
  const badge = el.querySelector('.list-badge');
  if (!badge) return;
  badge.textContent  = b.daysLeft === 0 ? 'Today' : b.daysLeft === 1 ? 'Tomorrow' : `in ${b.daysLeft}d`;
  badge.style.color  = b.daysLeft <= 3 ? 'var(--orange)' : '';
  badge.style.borderColor = b.daysLeft <= 3 ? 'var(--orange)' : '';
}

// ════════════════════════════════════════════════════════
//  FINANCE + TASKS TAB
// ════════════════════════════════════════════════════════
function buildFinance(D) {
  const fin = D.finance;
  set('fin-accounts',     (fin.accounts||[]).length);
  set('fin-transactions', (fin.transactions||[]).length);
  set('fin-bills',        (fin.bills||[]).length);
  set('fin-budgets',      (fin.budgets||[]).length);

  // Spending by category
  const transactions = fin.transactions||[];
  const spendCats = {};
  transactions.filter(t=>t.amount<0||t.type==='expense').forEach(t => {
    const cat = t.category||t.tag||'Other';
    spendCats[cat] = (spendCats[cat]||0) + Math.abs(parseFloat(t.amount)||0);
  });
  const spendSorted = Object.entries(spendCats).sort((a,b)=>b[1]-a[1]).slice(0,8);
  makeChart('chartSpending', {
    type:'bar',
    data:{
      labels: spendSorted.map(([k])=>k),
      datasets:[{ data:spendSorted.map(([,v])=>v.toFixed(2)), backgroundColor:'rgba(200,186,255,.6)', borderRadius:3 }]
    },
    options:{
      responsive:true, maintainAspectRatio:false, indexAxis:'y',
      scales:{ x:{grid:{},ticks:{}}, y:{grid:{display:false},ticks:{}} }
    }
  });
  if (!spendSorted.length) {
    const w = document.getElementById('chartSpending').parentElement;
    w.innerHTML = '<div class="empty">No transaction data yet</div>';
  }

  // Upcoming bills — C6: HQRenderer.list()
  const billsEl = document.getElementById('fin-upcoming-bills');
  HQRenderer.list(billsEl, _buildUpcomingBillsVM(fin.bills), {
    key: b => b.id,
    build(b) {
      const el = HQRenderer.fromTemplate('gt-bill-item-template');
      _applyBillEl(el, b);
      return el;
    },
    update(el, b) { _applyBillEl(el, b); },
    empty: '<div class="empty">No upcoming bills in next 30 days</div>',
  });

  // Tasks
  const tasks = D.taskboard.tasks||[];
  const now = Date.now();
  const overdue  = tasks.filter(t=>!t.done&&t.due&&new Date(t.due).getTime()<now);
  const dueSoon  = tasks.filter(t=>!t.done&&t.due&&new Date(t.due).getTime()-now<86400000*3&&new Date(t.due).getTime()>=now);
  set('task-total',    tasks.length);
  set('task-open',     tasks.filter(t=>!t.done).length);
  set('task-done',     tasks.filter(t=>t.done).length);
  set('task-overdue',  overdue.length);
  set('task-due-soon', dueSoon.length);
  set('task-p1',       tasks.filter(t=>!t.done&&t.priority==='critical').length);

  // Tasks status donut
  const tDone=tasks.filter(t=>t.done).length, tOpen=tasks.filter(t=>!t.done).length;
  makeChart('chartTaskStatus', {
    type:'doughnut',
    data:{ labels:['Open','Done'], datasets:[{ data:[tOpen,tDone], backgroundColor:['#FFA060','#06D6A0'], borderWidth:0 }] },
    options:{ responsive:false, cutout:'62%', plugins:{ legend:{display:false} } }
  });
  // Task legend — C6: HQRenderer.list()
  const taskLegendEl = document.getElementById('taskStatusLegend');
  HQRenderer.list(taskLegendEl, _buildTaskLegendVM(tasks), {
    key: item => item.id,
    build(item) {
      const el = HQRenderer.fromTemplate('gt-legend-row-template');
      _applyLegendRowEl(el, item);
      return el;
    },
    update(el, item) { _applyLegendRowEl(el, item); },
    empty: '',
  });

  // Overdue tasks list — C6: HQRenderer.list()
  const overdueEl = document.getElementById('fin-overdue-tasks');
  HQRenderer.list(overdueEl, _buildOverdueTasksVM(tasks), {
    key: t => t.id,
    build(t) {
      const el = HQRenderer.fromTemplate('gt-overdue-task-template');
      _applyOverdueTaskEl(el, t);
      return el;
    },
    update(el, t) { _applyOverdueTaskEl(el, t); },
    empty: '<div class="empty">No overdue tasks 🎉</div>',
  });

  // Walking
  const profile = D.profile;
  const walkTotal = calcWalkTotal(D.walking);
  const walkGoal  = parseFloat(profile.walkingGoal||3100);
  const walkPct   = Math.min(100, walkTotal/walkGoal*100).toFixed(1);
  const daysLeft  = Math.max(1, Math.ceil((new Date(`${new Date().getFullYear()}-12-31T23:59:59`)-new Date())/86400000));
  const needed    = walkTotal >= walkGoal ? '🎉 Goal reached!' : ((walkGoal-walkTotal)/daysLeft).toFixed(1)+' mi/day needed';
  set('fin-walk-miles', walkTotal.toFixed(1)+' mi');
  set('fin-walk-pct',   walkPct+'%');
  set('fin-walk-goal',  walkGoal.toLocaleString());
  set('fin-walk-needed', needed);
  document.getElementById('fin-walk-bar').style.width = walkPct+'%';
}

// ════════════════════════════════════════════════════════
//  HELPERS
// ════════════════════════════════════════════════════════
function set(id, val) { const el=document.getElementById(id); if(el) el.textContent=val; }

function calcCheckinStreak(checkins) {
  const dates = new Set(checkins.map(c=>c.date||c.at?.split('T')[0]));
  let streak=0, d=new Date();
  for (let i=0; i<90; i++) {
    const ds = dateStr(d);
    if (dates.has(ds)) { streak++; }
    else if (i===0) { /* today hasn't happened yet */ }
    else break;
    d.setDate(d.getDate()-1);
  }
  return streak;
}

function calcWalkTotal(walking) {
  if (!walking) return 0;
  const entries = walking.entries || walking.sessions || [];
  return entries.reduce((a,s)=>a+(parseFloat(s.miles)||0),0);
}

function calcProjProgress(p) {
  const items = [...(p.steps||[]).map(s=>({done:s.done})),...(p.tasks||[]).map(t=>({done:t.done}))];
  const total=items.length, done=items.filter(i=>i.done).length;
  return { pct: total ? Math.round(done/total*100) : 0, done, total };
}


// ════════════════════════════════════════════════════════
//  METRICS TAB
// ════════════════════════════════════════════════════════
function buildMetrics() {
  const metrics = typeof hqGetMetrics === 'function' ? hqGetMetrics() : ld(HQKeys.METRICS, {snapshots:{}, monthlySnapshots:{}});
  const snaps   = metrics.snapshots || {};
  const msnaps  = metrics.monthlySnapshots || {};

  // ── Get last 12 week keys sorted ──────────────────────
  const wKeys = Object.keys(snaps).sort().slice(-12);
  const wData = wKeys.map(k => snaps[k]);

  // ── Streaks ───────────────────────────────────────────
  const streakTypes = [
    {id:'goodDay',        label:'Good Days',    emoji:'😊', color:'var(--purple)'},
    {id:'wakeOnTime',     label:'Wake On Time', emoji:'⏰', color:'var(--green)'},
    {id:'workOnTime',     label:'Work On Time', emoji:'💼', color:'var(--teal)'},
    {id:'walkingPass',    label:'Walk 45mi+',   emoji:'🚶', color:'var(--orange)'},
    {id:'walkingSuccess', label:'Walk 60mi+',   emoji:'🏃', color:'var(--gold)'},
  ];
  const sg = document.getElementById('mtr-streaks-grid');
  if (sg) {
    // C10-02: Streak grid — migrated to HQRenderer.list()
    HQRenderer.list(sg, streakTypes, {
      key: function(st){ return st.id; },
      template: 'gt-streak-template',
      render: function(node, st){
        const n = typeof hqGetCurrentStreak === 'function' ? hqGetCurrentStreak(st.id) : 0;
        node.style.borderColor = st.color + '22';
        const nEl = node.querySelector('.gst-n');
        nEl.textContent = n;
        nEl.style.color = st.color;
        HQRenderer.setText(node, '.gst-lbl', st.emoji + ' ' + st.label);
      }
    });
  }

  // ── This week vs last week comparison table ───────────────────
  const thisW = wData[wData.length-1] || {calc:{}};
  const lastW = wData[wData.length-2] || {calc:{}};
  const tc = thisW.calc || {}, lc = lastW.calc || {};
  function pct(v) { return v != null ? Math.round(v*100)+'%' : '—'; }
  function num(v, dp) { return v != null ? (+v).toFixed(dp||1) : '—'; }
  function trend(a, b) {
    if (a == null || b == null) return '<span class="mtr-trend flat">→</span>';
    const diff = a - b;
    if (Math.abs(diff) < 0.02) return '<span class="mtr-trend flat">→</span>';
    return diff > 0
      ? '<span class="mtr-trend up">↑</span>'
      : '<span class="mtr-trend dn">↓</span>';
  }

  const rows = [
    ['Check-in rate',     pct(tc.checkinRate),     pct(lc.checkinRate),     trend(tc.checkinRate, lc.checkinRate)],
    ['Task completion',   pct(tc.taskCompletion),  pct(lc.taskCompletion),  trend(tc.taskCompletion, lc.taskCompletion)],
    ['Habit consistency', pct(tc.habitRate),       pct(lc.habitRate),       trend(tc.habitRate, lc.habitRate)],
    ['Good days',         (tc.goodDays||0)+'/7',   (lc.goodDays||0)+'/7',   trend(tc.goodDays, lc.goodDays)],
    ['Avg energy',        num(tc.energyAvg)+'/5',  num(lc.energyAvg)+'/5',  trend(tc.energyAvg, lc.energyAvg)],
    ['Avg sleep',         num(tc.sleepAvgHrs)+'h', num(lc.sleepAvgHrs)+'h', trend(tc.sleepAvgHrs, lc.sleepAvgHrs)],
    ['Headaches',         String(tc.headacheCount||0), String(lc.headacheCount||0), trend(-(tc.headacheCount||0), -(lc.headacheCount||0))],
    ['Crashes',           String(tc.crashCount||0),    String(lc.crashCount||0),    trend(-(tc.crashCount||0), -(lc.crashCount||0))],
    ['Wins logged',       String(tc.winsCount||0), String(lc.winsCount||0), trend(tc.winsCount, lc.winsCount)],
    ['Walking',           num(tc.walkingWeekMiles)+'mi', num(lc.walkingWeekMiles)+'mi', trend(tc.walkingWeekMiles, lc.walkingWeekMiles)],
  ];

  const tbl = document.getElementById('mtr-compare-table');
  if (tbl) {
    tbl.innerHTML = '<tr><th>Metric</th><th>This Week</th><th>Last Week</th><th></th></tr>'
      + rows.map(r => `<tr><td>${r[0]}</td><td style="font-weight:800;color:var(--text)">${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td></tr>`).join('');
  }

  // Score reveal
  const scoreEl = document.getElementById('mtr-score-reveal');
  if (scoreEl && tc.score != null) {
    const tier = tc.score >= 75 ? 'Strong' : tc.score >= 55 ? 'Steady' : tc.score >= 35 ? 'Challenging' : 'Survival';
    scoreEl.textContent = tc.score + ' · ' + tier + ' week';
  }

  // ── Week-by-week charts ───────────────────────────────
  const labels = wKeys.map(k => { const s = snaps[k]?.weekStart||k; return s.slice(5); });
  function wVals(field) { return wData.map(w => (w.calc||{})[field] != null ? (w.calc||{})[field] : null); }

  // Chart.js annotation for threshold lines via dataset
  const purple = 'rgba(155,109,255,1)', purpleA = 'rgba(155,109,255,.2)';
  const green  = 'rgba(6,214,160,1)',   greenA  = 'rgba(6,214,160,.2)';
  const orange = 'rgba(255,160,96,1)',  orangeA = 'rgba(255,160,96,.2)';
  const gold   = 'rgba(244,202,0,1)',   goldA   = 'rgba(244,202,0,.15)';
  const red    = 'rgba(255,107,107,1)';

  // Check-in rate
  makeChart('mtrChartCI', {type:'bar', data:{labels, datasets:[{
    data: wVals('checkinRate').map(v => v != null ? +(v*100).toFixed(0) : null),
    backgroundColor: wVals('checkinRate').map(v => v!=null && v>=0.7 ? greenA : orangeA),
    borderColor:     wVals('checkinRate').map(v => v!=null && v>=0.7 ? green  : orange),
    borderWidth:1, borderRadius:4,
  }]}, options:{responsive:true,maintainAspectRatio:false,
    scales:{x:{grid:{display:false}},y:{min:0,max:100,ticks:{callback:v=>v+'%'}}},
    plugins:{tooltip:{callbacks:{label:ctx=>ctx.raw+'%'}}}
  }});

  // Energy avg + variance
  makeChart('mtrChartEnergy', {type:'line', data:{labels, datasets:[
    {label:'Avg Energy', data:wVals('energyAvg'), borderColor:purple, backgroundColor:purpleA, tension:.3, fill:true, pointRadius:3},
    {label:'Variance',   data:wVals('energyVariance').map(v=>v!=null?+(v).toFixed(2):null), borderColor:orange, borderDash:[4,4], tension:.3, fill:false, pointRadius:2},
  ]}, options:{responsive:true,maintainAspectRatio:false,
    scales:{x:{grid:{display:false}},y:{min:0,max:5}},
    plugins:{legend:{display:true, labels:{font:{size:9},boxWidth:9}}}
  }});

  // Task completion with 70% dashed line
  const taskData = wVals('taskCompletion').map(v=>v!=null?+(v*100).toFixed(0):null);
  makeChart('mtrChartTasks', {type:'bar', data:{labels, datasets:[
    {data:taskData, backgroundColor:taskData.map(v=>v!=null&&v>=70?greenA:orangeA), borderColor:taskData.map(v=>v!=null&&v>=70?green:orange), borderWidth:1, borderRadius:4},
    {type:'line', data:Array(labels.length).fill(70), borderColor:'rgba(255,160,96,.6)', borderDash:[5,4], pointRadius:0, fill:false, label:'70% target'},
  ]}, options:{responsive:true,maintainAspectRatio:false,
    scales:{x:{grid:{display:false}},y:{min:0,max:100,ticks:{callback:v=>v+'%'}}},
    plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>ctx.datasetIndex===0?ctx.raw+'%':'Target: 70%'}}}
  }});

  // Sleep hours + quality
  makeChart('mtrChartSleep', {type:'line', data:{labels, datasets:[
    {label:'Hours', data:wVals('sleepAvgHrs').map(v=>v!=null?+v.toFixed(1):null), borderColor:purple, backgroundColor:purpleA, tension:.3, fill:true, pointRadius:3, yAxisID:'y'},
    {label:'Quality', data:wVals('sleepAvgQual').map(v=>v!=null?+v.toFixed(1):null), borderColor:green, tension:.3, fill:false, pointRadius:3, yAxisID:'y2'},
  ]}, options:{responsive:true,maintainAspectRatio:false,
    scales:{x:{grid:{display:false}},y:{min:0,max:12,title:{display:true,text:'hrs',font:{size:9}}},y2:{position:'right',min:0,max:5,title:{display:true,text:'qual',font:{size:9}},grid:{display:false}}},
    plugins:{legend:{display:true,labels:{font:{size:9},boxWidth:9}}}
  }});

  // Wins
  makeChart('mtrChartWins', {type:'bar', data:{labels, datasets:[{
    data:wVals('winsCount'), backgroundColor:goldA, borderColor:gold, borderWidth:1, borderRadius:4,
  }]}, options:{responsive:true,maintainAspectRatio:false,
    scales:{x:{grid:{display:false}},y:{min:0,ticks:{precision:0}}},
  }});

  // Headaches + crashes
  makeChart('mtrChartHealth', {type:'bar', data:{labels, datasets:[
    {label:'Headaches', data:wVals('headacheCount'), backgroundColor:'rgba(155,109,255,.25)', borderColor:purple, borderWidth:1, borderRadius:3},
    {label:'Crashes',   data:wVals('crashCount'),    backgroundColor:'rgba(255,107,107,.25)', borderColor:red,    borderWidth:1, borderRadius:3},
  ]}, options:{responsive:true,maintainAspectRatio:false,
    scales:{x:{grid:{display:false}},y:{min:0,ticks:{precision:0}}},
    plugins:{legend:{display:true,labels:{font:{size:9},boxWidth:9}}}
  }});

  // Walking with threshold lines
  const walkMiles = wVals('walkingWeekMiles').map(v=>v!=null?+v.toFixed(1):null);
  makeChart('mtrChartWalk', {type:'bar', data:{labels, datasets:[
    {data:walkMiles, backgroundColor:walkMiles.map(v=>v!=null&&v>=60?goldA:v!=null&&v>=45?greenA:orangeA), borderColor:walkMiles.map(v=>v!=null&&v>=60?gold:v!=null&&v>=45?green:orange), borderWidth:1, borderRadius:4},
    {type:'line', data:Array(labels.length).fill(45), borderColor:'rgba(6,214,160,.5)', borderDash:[4,3], pointRadius:0, fill:false, label:'45mi pass'},
    {type:'line', data:Array(labels.length).fill(60), borderColor:'rgba(244,202,0,.6)', borderDash:[4,3], pointRadius:0, fill:false, label:'60mi success'},
  ]}, options:{responsive:true,maintainAspectRatio:false,
    scales:{x:{grid:{display:false}},y:{min:0,ticks:{callback:v=>v+'mi'}}},
    plugins:{legend:{display:true,labels:{font:{size:9},boxWidth:9}}}
  }});

  // ── Month-by-month table ──────────────────────────────
  const mKeys = Object.keys(msnaps).sort().slice(-12);
  const mTbl  = document.getElementById('mtr-monthly-table');
  if (mTbl) {
    if (!mKeys.length) {
      mTbl.innerHTML = '<tr><td style="color:var(--muted);font-size:11px;padding:12px">No monthly snapshots yet. Data accumulates as weeks complete.</td></tr>';
    } else {
      mTbl.innerHTML = '<tr><th>Month</th><th>Score</th><th>Good days</th><th>Wins</th><th>Walk mi</th><th>Crashes</th></tr>'
        + mKeys.map(k => {
          const mc = (msnaps[k].calc || {});
          const sc = mc.score != null ? mc.score : '—';
          return `<tr>
            <td style="font-weight:700">${k}</td>
            <td>${sc}</td>
            <td>${mc.goodDays!=null?mc.goodDays:'—'}</td>
            <td>${mc.winsCount!=null?mc.winsCount:'—'}</td>
            <td>${mc.walkingMonthMiles!=null?mc.walkingMonthMiles.toFixed(0)+'mi':'—'}${mc.walkingMonthPass!=null?mc.walkingMonthPass?' ✅':' ○':''}</td>
            <td>${mc.crashCount!=null?mc.crashCount:'—'}</td>
          </tr>`;
        }).join('');
    }
  }

  // ── Streak dot grids (52 weeks) ───────────────────────
  const allWKeys = Object.keys(snaps).sort().slice(-52);
  const sgEl = document.getElementById('mtr-streak-grids');
  if (sgEl) {
    const streakDefs = [
      {field:'goodDays',       label:'Good Days (≥3/week)',  thresh:v=>v>=3, color:'var(--purple)'},
      {field:'wakeOnTimeRate', label:'Wake On Time (≥70%)',  thresh:v=>v>=0.7, color:'var(--green)'},
      {field:'walkingWeekPass',label:'Walk Pass (45mi+)',    thresh:v=>v===true, color:'var(--orange)'},
    ];
    sgEl.innerHTML = streakDefs.map(sd => {
      const dots = allWKeys.map(k => {
        const val = (snaps[k]?.calc||{})[sd.field];
        const ok  = val != null && sd.thresh(val);
        const isCurrentWeek = k === (typeof hqWeekKey === 'function' ? hqWeekKey() : '');
        return `<div class="s-dot ${ok?'done':''}" style="${ok?'background:'+sd.color:''}${isCurrentWeek?';outline:2px solid var(--border)':''}" title="${k}"></div>`;
      }).join('');
      return `<div style="margin-bottom:12px">
        <div style="font-size:10px;font-weight:800;color:var(--muted);margin-bottom:5px">${sd.label}</div>
        <div class="streak-row">${dots}</div>
      </div>`;
    }).join('');
  }
}

function toggleMtrScore(btn) {
  const el = document.getElementById('mtr-score-reveal');
  if (!el) return;
  const visible = el.style.display === 'block';
  el.style.display = visible ? 'none' : 'block';
  btn.textContent  = visible ? 'Show score' : 'Hide score';
}

// ════════════════════════════════════════════════════════
//  REPORTS TAB
// ════════════════════════════════════════════════════════
var _reportsSavedNotes = {};  // weekKey → notes typed in UI

function buildReports() {
  const metrics  = typeof hqGetMetrics === 'function' ? hqGetMetrics() : ld(HQKeys.METRICS, {snapshots:{}});
  const snaps    = metrics.snapshots || {};
  const el       = document.getElementById('reports-log-list');
  if (!el) return;

  const keys = Object.keys(snaps).sort().reverse().slice(0, 52);
  if (!keys.length) {
    el.innerHTML = '<div class="empty"><div class="empty-ic">📝</div>No reports yet. Generate one above or complete a Sunday end-of-week check-in.</div>';
    return;
  }

  el.innerHTML = keys.map(k => {
    const snap = snaps[k] || {};
    const calc = snap.calc || {};
    const score = calc.score != null ? calc.score : null;
    const tier  = score != null ? (score>=75?'Strong':score>=55?'Steady':score>=35?'Challenging':'Survival') : '';
    const hasSaved = snap.notes || snap.reflection;

    return `<div class="report-entry" id="rep-${k}">
      <div class="report-hd" onclick="document.getElementById('rep-${k}').classList.toggle('open')">
        <div class="report-date">${k.replace('-W',' · Wk ')}</div>
        <div class="report-title">${snap.weekStart||''} → ${snap.weekEnd||''}</div>
        ${score!=null?`<div class="report-score">${score} · ${tier}</div>`:''}
        ${hasSaved?'<span style="font-size:10px;color:var(--green);margin-left:4px">✅</span>':''}
      </div>
      <div class="report-body">
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:10px 0;font-size:11px">
          <div><span style="color:var(--muted)">Check-ins</span><br><strong>${calc.checkinRate!=null?Math.round(calc.checkinRate*100)+'%':'—'}</strong></div>
          <div><span style="color:var(--muted)">Tasks</span><br><strong>${calc.taskCompletion!=null?Math.round(calc.taskCompletion*100)+'%':'—'}</strong></div>
          <div><span style="color:var(--muted)">Good days</span><br><strong>${calc.goodDays!=null?calc.goodDays+'/7':'—'}</strong></div>
          <div><span style="color:var(--muted)">Walking</span><br><strong>${calc.walkingWeekMiles!=null?calc.walkingWeekMiles+'mi':'—'}</strong></div>
          <div><span style="color:var(--muted)">Wins</span><br><strong>${calc.winsCount||0}</strong></div>
          <div><span style="color:var(--muted)">Crashes</span><br><strong>${calc.crashCount||0}</strong></div>
        </div>
        ${snap.reflection?.tone ? `<div style="font-size:11px;color:var(--muted);margin-bottom:8px">Week tone: <strong style="color:var(--text)">${snap.reflection.tone}</strong></div>` : ''}
        <div style="font-size:10px;font-weight:800;color:var(--muted);text-transform:uppercase;margin-bottom:4px">Notes for export</div>
        <textarea class="report-notes-area" id="rep-notes-${k}" placeholder="Add any additional context before exporting…" onchange="saveRepNotes('${k}',this.value)">${snap.notes||''}</textarea>
        <div class="report-export-row">
          <button class="report-export-btn primary" onclick="exportReport('${k}')">📋 Copy text</button>
          <button class="report-export-btn" onclick="printReport('${k}')">🖨 Print / PDF</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function saveRepNotes(weekKey, notes) {
  const metrics = typeof hqGetMetrics === 'function' ? hqGetMetrics() : ld(HQKeys.METRICS, {snapshots:{}});
  if (!metrics.snapshots[weekKey]) metrics.snapshots[weekKey] = {};
  metrics.snapshots[weekKey].notes = notes;
  if (typeof HQSafe.store.set === 'function') HQSafe.store.set(HQKeys.METRICS, metrics);
  else HQSafe.store.set(HQKeys.METRICS, metrics);
}

function exportReport(weekKey) {
  const notesEl = document.getElementById('rep-notes-'+weekKey);
  const notes   = notesEl ? notesEl.value : '';
  if (typeof hqGenerateWeekReport === 'function') {
    const metrics = typeof hqGetMetrics === 'function' ? hqGetMetrics() : {};
    const snap    = (metrics.snapshots||{})[weekKey] || {};
    const text    = hqGenerateWeekReport(weekKey, notes, snap.confidence);
    navigator.clipboard.writeText(text)
      .then(() => { if(typeof hqShowToast==='function') hqShowToast('📋 Copied!'); })
      .catch(() => { if(typeof hqShowToast==='function') hqShowToast('Select text manually'); });
  }
}

function printReport(weekKey) {
  const notesEl = document.getElementById('rep-notes-'+weekKey);
  const notes   = notesEl ? notesEl.value : '';
  if (typeof hqGenerateWeekReport === 'function' && typeof hqOpenPrintView === 'function') {
    const metrics = typeof hqGetMetrics === 'function' ? hqGetMetrics() : {};
    const snap    = (metrics.snapshots||{})[weekKey] || {};
    const text    = hqGenerateWeekReport(weekKey, notes, snap.confidence);
    hqOpenPrintView('Weekly Report · ' + weekKey, text);
  }
}

function generateAndLogReport() {
  const wk = typeof hqWeekKey === 'function' ? hqWeekKey() : '';
  if (typeof hqComputeWeekSnapshot === 'function') hqComputeWeekSnapshot(wk);
  buildReports();
  if (typeof hqShowToast === 'function') hqShowToast('📝 Report generated for ' + wk.replace('-W', ' Week '));
  // Auto-open the first entry
  const firstEl = document.getElementById('rep-'+wk);
  if (firstEl) firstEl.classList.add('open');
}

// ── INIT ──────────────────────────────────────────────────
buildOverview(getData());

// Re-render on theme change
new MutationObserver(() => buildTab(_activeTab))
  .observe(document.documentElement, { attributes:true, attributeFilter:['data-theme'] });

// Re-render overview when config changes (profile, display prefs updated from Customize)
window.addEventListener('hq-config-updated', function() {
  try { buildOverview(getData()); } catch(e) {}
});

// ── Window Exports — functions called from HTML event handlers ────────────
// These are required while inline onclick attributes are still in use.
// TODO Phase C10: Convert these to event delegation and remove exports.
window.sw                  = sw;
window.buildTab            = buildTab;
window.rebuildAll          = rebuildAll;
window.setRange            = setRange;
window.toggleMtrScore      = toggleMtrScore;
window.generateAndLogReport = generateAndLogReport;
window.exportReport        = exportReport;
window.printReport         = printReport;
window.saveRepNotes        = saveRepNotes;

// ════════════════════════════════════════════════════════════════════════════
//  P10 · ROUTINES TAB  (inside IIFE — called by buildTab)
// ════════════════════════════════════════════════════════════════════════════
function buildRoutines(D) {
  const el = document.getElementById('tab-routines');
  if (!el) return;
  const r = D.routines;
  const p = D.prepwork;
  if (!r && !p) {
    el.innerHTML = '<div class="empty-state" style="text-align:center;padding:32px;color:var(--muted);font-size:12px">No routines data yet.<br>Open <a href="routines-prepwork.html" style="color:var(--purple)">Prepwork + Routines</a> to get started.</div>';
    return;
  }

  let html = '';

  // ── Routines completion overview ──────────────────────────────────────────
  if (r && r.items) {
    const allItems = Object.entries(r.items);
    const totalAll = allItems.reduce((a,[,its])=>a+its.length,0);
    const doneAll  = allItems.reduce((a,[,its])=>a+its.filter(it=>r.steps&&r.steps[it.id]).length,0);
    const pctAll   = totalAll ? Math.round(doneAll/totalAll*100) : 0;

    html += `<div class="card" style="margin-bottom:14px">
      <div class="card-hd">🔁 Routines — Today's Progress</div>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
        <div style="flex:1;height:8px;border-radius:4px;background:rgba(255,255,255,.08);overflow:hidden">
          <div style="height:100%;width:${pctAll}%;background:${pctAll===100?'var(--green,#6ee7b7)':'var(--purple)'};border-radius:4px;transition:width .4s"></div>
        </div>
        <span style="font-size:12px;font-weight:800;color:var(--purple)">${doneAll}/${totalAll} (${pctAll}%)</span>
      </div>`;

    allItems.forEach(([key, items]) => {
      if (!items.length) return;
      const done = items.filter(it => r.steps && r.steps[it.id]).length;
      const label = {morning:'🌅 Morning',evening:'🌙 Evening',anytime:'⚡ Anytime'}[key] || key;
      html += `<div style="margin-bottom:10px">
        <div style="font-size:10px;font-weight:800;color:var(--text2);letter-spacing:.04em;text-transform:uppercase;margin-bottom:4px">${label} — ${done}/${items.length}</div>
        <div style="display:flex;flex-direction:column;gap:3px">
          ${items.map(it => {
            const isDone = r.steps && r.steps[it.id];
            return `<div style="display:flex;align-items:center;gap:8px;padding:5px 8px;border-radius:7px;background:rgba(255,255,255,.04);font-size:11px">
              <span style="font-size:13px">${isDone?'✅':'⬜'}</span>
              <span style="flex:1;color:${isDone?'var(--muted)':'var(--text-main)'};${isDone?'text-decoration:line-through;opacity:.55':''}">${it.title||it.text||''}</span>
            </div>`;
          }).join('')}
        </div>
      </div>`;
    });
    html += '</div>';
  }

  // ── Prepwork overview ─────────────────────────────────────────────────────
  if (p && p.items) {
    const allPrep = Object.entries(p.items);
    const totalP = allPrep.reduce((a,[,its])=>a+its.length,0);
    const doneP  = allPrep.reduce((a,[,its])=>a+its.filter(i=>i.done).length,0);
    html += `<div class="card" style="margin-bottom:14px">
      <div class="card-hd">🌙 Prepwork — ${doneP}/${totalP}</div>
      ${allPrep.map(([key, items]) => {
        if (!items.length) return '';
        const label = {night:'Night Prep',morning:'Morning Prep',eod:'End of Day'}[key]||key;
        return `<div style="margin-bottom:8px">
          <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;color:var(--text2);margin-bottom:4px">${label}</div>
          <div style="display:flex;flex-direction:column;gap:3px">
          ${items.map(i=>`<div style="display:flex;align-items:center;gap:8px;padding:5px 8px;border-radius:7px;background:rgba(255,255,255,.04);font-size:11px">
            <span>${i.done?'✅':'⬜'}</span>
            <span style="flex:1;${i.done?'text-decoration:line-through;opacity:.55':''}">${i.title||i.text||''}</span>
          </div>`).join('')}
          </div>
        </div>`;
      }).join('')}
    </div>`;
  }

  // ── History log (last 7 days from routines-prepwork log) ─────────────────
  const rpLog = ld(HQKeys.RP_LOG, []);
  if (rpLog.length) {
    const recent = rpLog.slice(0,7);
    html += `<div class="card">
      <div class="card-hd">📅 Completion History (last 7 entries)</div>
      <table style="width:100%;border-collapse:collapse;font-size:11px">
        <tr style="color:var(--muted);font-size:10px;text-transform:uppercase;letter-spacing:.03em">
          <th style="text-align:left;padding:4px 6px">Date</th>
          <th style="text-align:center;padding:4px 6px">Routines</th>
          <th style="text-align:center;padding:4px 6px">Prepwork</th>
        </tr>
        ${recent.map(e=>`<tr style="border-top:1px solid rgba(255,255,255,.06)">
          <td style="padding:6px">${e.date||'—'}</td>
          <td style="text-align:center;padding:6px">${e.routines?`${e.routines.done}/${e.routines.total}`:'—'}</td>
          <td style="text-align:center;padding:6px">${e.prepwork?`${e.prepwork.done}/${e.prepwork.total}`:'—'}</td>
        </tr>`).join('')}
      </table>
    </div>`;
  }

  el.innerHTML = html || '<div style="padding:24px;text-align:center;color:var(--muted);font-size:12px">No routines data yet.</div>';
}

// ════════════════════════════════════════════════════════════════════════════
//  P10 · IDEAS TAB
// ════════════════════════════════════════════════════════════════════════════
function buildIdeas(D) {
  const el = document.getElementById('tab-ideas');
  if (!el) return;
  const studio = D.ideaStudio;
  if (!studio) {
    el.innerHTML = '<div class="empty-state" style="text-align:center;padding:32px;color:var(--muted);font-size:12px">No Idea Studio data yet.<br>Open <a href="idea-studio.html" style="color:var(--purple)">Idea Studio</a> to get started.</div>';
    return;
  }

  const sparks   = studio.sparks   || [];
  const hyperfocus = studio.hyperfocus || [];
  const ideas    = studio.ideas    || [];
  const holes    = studio.holes    || [];
  const quotes   = studio.quotes   || [];

  let html = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">
    <div class="card" style="text-align:center">
      <div style="font-size:24px;font-weight:900;color:var(--purple)">${sparks.length}</div>
      <div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;margin-top:2px">✨ Sparks</div>
    </div>
    <div class="card" style="text-align:center">
      <div style="font-size:24px;font-weight:900;color:var(--orange,#f59e0b)">${hyperfocus.length}</div>
      <div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;margin-top:2px">🔥 Hyperfocus</div>
    </div>
    <div class="card" style="text-align:center">
      <div style="font-size:24px;font-weight:900;color:var(--green,#6ee7b7)">${ideas.length}</div>
      <div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;margin-top:2px">💡 Ideas</div>
    </div>
    <div class="card" style="text-align:center">
      <div style="font-size:24px;font-weight:900;color:var(--blue,#60a5fa)">${holes.length}</div>
      <div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;margin-top:2px">🕳 Rabbit Holes</div>
    </div>
  </div>`;

  // Quotes panel
  if (quotes.length) {
    html += `<div class="card" style="margin-bottom:14px">
      <div class="card-hd">💬 Your Quotes (${quotes.length})</div>
      <div style="display:flex;flex-direction:column;gap:8px;max-height:280px;overflow-y:auto">
        ${quotes.slice(0,10).map(q=>`<div style="padding:8px 10px;background:rgba(100,94,183,.08);border-left:3px solid var(--purple);border-radius:0 7px 7px 0;font-size:11px">
          <div style="font-style:italic;line-height:1.5">"${esc(q.text)}"</div>
          ${q.attr?`<div style="font-size:10px;font-weight:700;color:var(--purple);margin-top:4px;opacity:.8">— ${esc(q.attr)}</div>`:''}
        </div>`).join('')}
        ${quotes.length>10?`<div style="font-size:10px;color:var(--muted);text-align:center;padding:4px">+${quotes.length-10} more — open Idea Studio</div>`:''}
      </div>
    </div>`;
  }

  // Recent sparks
  if (sparks.length) {
    const recent = sparks.slice(0,6);
    html += `<div class="card" style="margin-bottom:14px">
      <div class="card-hd">✨ Recent Sparks</div>
      <div style="display:flex;flex-direction:column;gap:5px">
        ${recent.map(s=>`<div style="padding:6px 8px;background:rgba(255,255,255,.04);border-radius:7px;font-size:11px">
          ${s.emoji?`<span style="margin-right:5px">${s.emoji}</span>`:''}${esc(s.text||s.title||'')}
          ${s.at?`<span style="font-size:9px;color:var(--muted);margin-left:6px">${new Date(s.at).toLocaleDateString('en',{month:'short',day:'numeric'})}</span>`:''}
        </div>`).join('')}
      </div>
    </div>`;
  }

  // Active hyperfocus
  const activeHF = hyperfocus.filter(h=>!h.archived);
  if (activeHF.length) {
    html += `<div class="card">
      <div class="card-hd">🔥 Active Hyperfocus Topics (${activeHF.length})</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:4px">
        ${activeHF.map(h=>`<span style="padding:4px 10px;background:rgba(245,158,11,.12);border:1px solid rgba(245,158,11,.3);border-radius:20px;font-size:10px;font-weight:700;color:var(--orange,#f59e0b)">${h.emoji||'🔥'} ${esc(h.title||h.text||'')}</span>`).join('')}
      </div>
    </div>`;
  }

  el.innerHTML = html;
}

// ════════════════════════════════════════════════════════════════════════════
//  P10 · SOCIAL BRAIN TAB
// ════════════════════════════════════════════════════════════════════════════
function buildSocial(D) {
  const el = document.getElementById('tab-social');
  if (!el) return;
  const s = D.social;
  if (!s) {
    el.innerHTML = '<div class="empty-state" style="text-align:center;padding:32px;color:var(--muted);font-size:12px">No Social Brain data yet.<br>Open <a href="social-brain.html" style="color:var(--purple)">Social Brain</a> to get started.</div>';
    return;
  }

  const contacts = s.contacts || [];
  const scripts  = s.scripts  || [];
  const energyLog= s.energyLog|| [];

  let html = `<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:14px">
    <div class="card" style="text-align:center">
      <div style="font-size:24px;font-weight:900;color:var(--purple)">${contacts.length}</div>
      <div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;margin-top:2px">👥 Contacts</div>
    </div>
    <div class="card" style="text-align:center">
      <div style="font-size:24px;font-weight:900;color:var(--green,#6ee7b7)">${scripts.length}</div>
      <div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;margin-top:2px">📝 Scripts</div>
    </div>
    <div class="card" style="text-align:center">
      <div style="font-size:24px;font-weight:900;color:var(--orange,#f59e0b)">${energyLog.length}</div>
      <div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;margin-top:2px">⚡ Energy Logs</div>
    </div>
  </div>`;

  // Energy cost breakdown
  if (contacts.length) {
    const byEnergy = {high:0,medium:0,low:0,unknown:0};
    contacts.forEach(c=>{const e=(c.energyCost||'unknown').toLowerCase();byEnergy[e in byEnergy?e:'unknown']++;});
    html += `<div class="card" style="margin-bottom:14px">
      <div class="card-hd">⚡ Social Energy Breakdown</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:6px">
        ${[['High drain','high','var(--red,#e24b4a)'],['Med drain','medium','var(--orange,#f59e0b)'],['Low drain','low','var(--green,#6ee7b7)'],['Unknown','unknown','var(--muted)']].map(([label,key,color])=>
          byEnergy[key]?`<div style="display:flex;align-items:center;gap:5px"><span style="width:10px;height:10px;border-radius:50%;background:${color};display:inline-block"></span><span style="font-size:11px;color:var(--text-main)">${byEnergy[key]} ${label}</span></div>`:''
        ).join('')}
      </div>
    </div>`;
  }

  // Recent energy log
  if (energyLog.length) {
    const recent = energyLog.slice(0,5);
    html += `<div class="card" style="margin-bottom:14px">
      <div class="card-hd">📊 Recent Interactions</div>
      <div style="display:flex;flex-direction:column;gap:5px">
        ${recent.map(e=>`<div style="display:flex;align-items:center;gap:8px;padding:6px 8px;background:rgba(255,255,255,.04);border-radius:7px;font-size:11px">
          <span style="flex:1">${esc(e.contactName||'Unknown')}</span>
          <span style="font-size:10px;color:var(--muted)">${e.date?new Date(e.date).toLocaleDateString('en',{month:'short',day:'numeric'}):''}</span>
          <span style="font-size:10px;padding:2px 7px;border-radius:10px;background:rgba(255,255,255,.06)">${e.type||e.mode||'interaction'}</span>
        </div>`).join('')}
      </div>
    </div>`;
  }

  // Quick scripts
  if (scripts.length) {
    html += `<div class="card">
      <div class="card-hd">📝 Scripts (${scripts.length})</div>
      <div style="display:flex;flex-direction:column;gap:5px;max-height:200px;overflow-y:auto;margin-top:4px">
        ${scripts.slice(0,8).map(sc=>`<div style="padding:6px 8px;background:rgba(255,255,255,.04);border-radius:7px;font-size:11px">
          <div style="font-weight:700">${esc(sc.title||sc.name||'Script')}</div>
          ${sc.situation?`<div style="font-size:10px;color:var(--muted);margin-top:1px">${esc(sc.situation)}</div>`:''}
        </div>`).join('')}
      </div>
    </div>`;
  }

  el.innerHTML = html;
}

})(); // End Phase C5 IIFE — global-tracker (includes P10 tabs)
