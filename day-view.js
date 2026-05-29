// ============================================================
//  DAY VIEW — AuDHD HQ
//  Tab Live: Today's Timeline  |  Tab Plan: Day Builder
//  day-view.js — combined module
// ============================================================

// ══════════════════════════════════════════════════════════
//  TAB CONTROLLER
// ══════════════════════════════════════════════════════════

var _dvTabReady = false;

function getDayViewTab() {
  return location.hash === '#plan' ? 'plan' : 'live';
}

function switchDayViewTab(tab) {
  var isLive = tab !== 'plan';
  var livePanel = document.getElementById('dv-live-panel');
  var planPanel = document.getElementById('dv-plan-panel');
  var liveBtn   = document.getElementById('dv-tab-live');
  var planBtn   = document.getElementById('dv-tab-plan');

  if (livePanel) livePanel.style.display = isLive ? '' : 'none';
  if (planPanel) planPanel.style.display = isLive ? 'none' : '';
  if (liveBtn)   liveBtn.classList.toggle('active', isLive);
  if (planBtn)   planBtn.classList.toggle('active', !isLive);

  // Update TBS active states
  document.querySelectorAll('[data-tbs="timeline"]').forEach(function(el) { el.classList.toggle('active', isLive); });
  document.querySelectorAll('[data-tbs="daybuilder"]').forEach(function(el) { el.classList.toggle('active', !isLive); });

  // Update hash (no scroll)
  var newHash = isLive ? '' : '#plan';
  if (location.hash !== newHash) {
    history.replaceState(null, '', location.pathname + newHash);
  }

  // Re-render the active module
  if (isLive) {
    tlLoad(); tlRender();
  } else {
    dbLoad(); initDate(); renderTemplateList();
  }
}

// Handle browser back/forward
window.addEventListener('hashchange', function() {
  switchDayViewTab(getDayViewTab());
});


// ══════════════════════════════════════════════════════════
//  LIVE MODULE — Today's Timeline
//  (renamed: DB→TL_DB, load→tlLoad, persist→tlPersist)
// ══════════════════════════════════════════════════════════

var DB_STORE    = HQKeys.DAYBUILDER;
var DB2_STORE   = HQKeys.DAYBUILDER_V2;
var NN_STORE    = HQKeys.NONNEG;
var W_STORE     = HQKeys.WEEKLY;
var H_STORE     = HQKeys.HEALTH;
var RECUR_STORE = HQKeys.RECURRING; // fixed: was 'hq-recurring' (pre-migration legacy key)
var RECURRING   = [];

var TL_DB = {}, TL_DB2 = {days:{},routineTasks:[],customTasks:[]}, NND = {items:[]}, HD = {};
var TODAY = new Date().toISOString().split('T')[0];
var nowLineInterval = null;
var frictionId = null, frictionAction = 'done', frictionIsAppt = false;

// Tag Engine bridge
function TE() {
  try {
    var db = HQSafe.store.get(HQKeys.TAGS, null);
    if (db && typeof db === 'object') { return { getCategories: function(){ return db.categories||[]; }, getFlags: function(g){ return (db.flags||{})[g]||[]; } }; }
  } catch(e) {}
  return {
    getCategories: function() { return [
      {id:'work',name:'Work',emoji:'💼',color:'#645EB7'},{id:'health',name:'Health',emoji:'🏥',color:'#EF5886'},
      {id:'fitness',name:'Fitness',emoji:'💪',color:'#06D6A0'},{id:'social',name:'Social',emoji:'💬',color:'#4ECDC4'},
      {id:'finance',name:'Finance',emoji:'💰',color:'#F4CA00'},{id:'home',name:'Home',emoji:'🏠',color:'#8BB698'},
      {id:'self',name:'Self & Growth',emoji:'🧠',color:'#C8BAFF'},{id:'admin',name:'Admin',emoji:'📋',color:'#A8AAA9'},
    ]; },
    getFlags: function() { return []; }
  };
}

function tlLoad() {
  TL_DB  = HQSafe.store.get(DB_STORE, {});
  TL_DB2 = HQSafe.store.get(DB2_STORE, {days:{},routineTasks:[],customTasks:[]});
  if (!TL_DB2.days) TL_DB2.days = {};
  NND = HQSafe.store.get(NN_STORE, {items:[]});
  HD  = HQSafe.store.get(H_STORE, {});
  RECURRING = HQSafe.store.get(RECUR_STORE, []);
  if (!NND.items) NND.items = [];
}

// Stage 4 item 4: reload recurring events when monthly-planner saves
// HQCascade.confirm() called so cascade governance can track delivery
(function() {
  function _reloadRecurring(payload) {
    try {
      RECURRING = HQSafe.store.get(RECUR_STORE, []);
      if (payload && payload._txId && window.HQCascade) {
        window.HQCascade.confirm(payload._txId, { ok: true });
      }
    } catch (e) {
      if (payload && payload._txId && window.HQCascade) {
        window.HQCascade.confirm(payload._txId, { ok: false, error: e.message });
      }
    }
  }
  HQSafe.bus.on('planner:recurring-updated', _reloadRecurring); // C4: HQSafe handles guard
})();

function getDayBuilderItems() {
  var dayData = (TL_DB2.days||{})[TODAY];
  if (!dayData || !dayData.slots) return [];
  var items = [];
  Object.entries(dayData.slots).forEach(function(kv) {
    var tk = kv[0], tasks = kv[1];
    (tasks||[]).forEach(function(t) {
      var existing = (tlGetDayData().items||[]).find(function(i){ return i.id===t.id; });
      items.push({
        id: t.id, title: t.name, time: tk, duration: t.dur||0,
        category: CAT_MAP[t.cat]||t.cat||'work',
        type: t.locked ? 'appointment' : 'task', tier: 2,
        status: existing ? existing.status : 'scheduled',
        doneAt: existing ? existing.doneAt : undefined,
        deferCount: existing ? (existing.deferCount||0) : 0,
        history: existing ? (existing.history||[]) : [],
        _fromDB2: true,
      });
    });
  });
  return items;
}

function tlPersist() { HQSafe.store.set(DB_STORE, TL_DB); }

function tlGetDayData() {
  if (!TL_DB[TODAY]) TL_DB[TODAY] = {items:[],notes:'',bdLog:[]};
  return TL_DB[TODAY];
}

function getMergedItems() {
  var dd = tlGetDayData();
  var db2Items = getDayBuilderItems();
  var db2Ids = new Set(db2Items.map(function(i){ return i.id; }));
  var nativeOnly = (dd.items||[]).filter(function(i){ return !db2Ids.has(i.id); });
  return db2Items.concat(nativeOnly);
}

function persistTaskStatus(id, patch) {
  var dd = tlGetDayData();
  if (!dd.items) dd.items = [];
  var entry = dd.items.find(function(i){ return i.id===id; });
  if (!entry) { entry = {id:id}; dd.items.push(entry); }
  Object.assign(entry, patch);
  tlPersist();
}

// Migration shim
(function migrateTimeline() {
  if (HQSafe.store.get(HQKeys.TL_MIGRATED)) return;
  [HQKeys.DAYBUILDER,HQKeys.NONNEG,HQKeys.WEEKLY,HQKeys.HEALTH].forEach(function(k) {
    var v = HQSafe.store.get(k);
    if (v && !HQSafe.store.get(k)) HQSafe.store.set(k, v);
  });
  HQSafe.store.set(HQKeys.TL_MIGRATED, '1');
})();

function tlRender() {
  renderHeader();
  renderProgress();
  renderTopBand();
  renderNonNegs();
  renderHealthStrip();
  renderAlldayBanner();
  renderTimeline();
  positionNowLine();
}

function renderHeader() {
  var d = new Date();
  var DOW_TL = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  var MON_TL = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var el = document.getElementById('hdr-tl-date');
  var sub = document.getElementById('hdr-tl-sub');
  if (el)  el.textContent  = DOW_TL[d.getDay()] + ', ' + MON_TL[d.getMonth()] + ' ' + d.getDate();
  if (sub) sub.textContent = d.getFullYear() + ' · ' + fmtTLTime(d);
}

function renderProgress() {
  var dd = tlGetDayData();
  var allItems = getMergedItems();
  var tasks = allItems.filter(function(i){ return i.type!=='appointment'; });
  var done  = tasks.filter(function(i){ return i.status==='done'; }).length;
  var total = tasks.length;
  var apptsDone  = allItems.filter(function(i){ return i.type==='appointment'&&i.status==='done'; }).length;
  var apptsTotal = allItems.filter(function(i){ return i.type==='appointment'; }).length;
  var nnDone  = (dd.nnDone||[]).length;
  var nnTotal = NND.items.length;
  var pc = document.getElementById('prog-count');
  var pb = document.getElementById('prog-bar');
  var pd = document.getElementById('prog-detail');
  if (pc) pc.textContent = done + ' / ' + total;
  if (pb) pb.style.width = total ? Math.round(done/total*100)+'%' : '0%';
  if (pd) pd.innerHTML = [
    total      ? '<span>✅ '+done+'/'+total+' tasks</span>'           : '',
    apptsTotal ? '<span>📅 '+apptsDone+'/'+apptsTotal+' appts</span>' : '',
    nnTotal    ? '<span>💎 '+nnDone+'/'+nnTotal+' done</span>'        : '',
  ].filter(Boolean).join('');
}

function renderTopBand() {
  var now = new Date(); var h = now.getHours();
  var timeOfDay = h<12 ? '🌅 Morning' : h<17 ? '☀️ Afternoon' : h<21 ? '🌆 Evening' : '🌙 Night';
  var upcoming = getMergedItems().filter(function(i){ return i.type==='appointment'&&i.status!=='done'&&i.status!=='cancelled'; })
    .sort(function(a,b){ return (a.time||'').localeCompare(b.time||''); });
  var nextAppt = upcoming[0];
  var tb = document.getElementById('top-band');
  if (!tb) return;
  tb.innerHTML =
    '<div class="top-card">' +
      '<div class="tc-label">Right Now</div>' +
      '<div class="tc-body">' +
        '<div style="font-size:18px;margin-bottom:3px">' + timeOfDay + '</div>' +
        '<div style="font-size:20px;font-weight:900;color:var(--purple)" id="live-time">' + fmtTLTime(now) + '</div>' +
      '</div>' +
    '</div>' +
    '<div class="top-card">' +
      '<div class="tc-label">Next Appointment</div>' +
      '<div class="tc-body">' + (nextAppt ?
        '<div style="font-size:12px;font-weight:700;color:var(--coral);margin-bottom:2px">📅 ' + esc(nextAppt.title.slice(0,28)) + (nextAppt.title.length>28?'…':'') + '</div>' +
        '<div style="font-size:11px;color:var(--muted)">' + (nextAppt.time?'⏰ '+nextAppt.time:'') + '</div>' :
        '<div style="color:var(--muted);font-style:italic;font-size:12px">No appointments today</div>') +
      '</div>' +
    '</div>';
}
// Live clock tick — runs once at module level (not inside renderTopBand)
if (!window._dvClockInterval) {
  window._dvClockInterval = setInterval(function() { var el=document.getElementById('live-time'); if(el) el.textContent=fmtTLTime(new Date()); }, 10000);
}

function renderNonNegs() {
  var dd = tlGetDayData();
  var done = new Set(dd.nnDone||[]);
  var strip = document.getElementById('nn-strip');
  if (!strip) return;
  if (!NND.items.length) { strip.style.display='none'; return; }
  strip.style.display = 'block';
  var doneN = NND.items.filter(function(n){ return done.has(n.id); }).length;
  var np = document.getElementById('nn-prog');
  var nr = document.getElementById('nn-row');
  if (np) np.textContent = doneN + '/' + NND.items.length;
  if (nr) nr.innerHTML = NND.items.map(function(n) {
    return '<div class="nn-pill' + (done.has(n.id)?' nn-done':'') + '" onclick="toggleNN(\'' + n.id + '\')">' +
      '<span class="nn-pill-em">' + n.emoji + '</span>' +
      '<span class="nn-pill-label">' + esc(n.label) + '</span>' +
      (done.has(n.id) ? '<span class="nn-check-ic">✓</span>' : '') +
    '</div>';
  }).join('');
}

function toggleNN(id) {
  var dd = tlGetDayData();
  if (!dd.nnDone) dd.nnDone = [];
  var idx = dd.nnDone.indexOf(id);
  if (idx===-1) dd.nnDone.push(id); else dd.nnDone.splice(idx,1);
  tlPersist(); renderNonNegs(); renderProgress();
  hqShowToast(dd.nnDone.includes(id) ? '💎 Done!' : '🔄 Unmarked');
}

function renderHealthStrip() {
  var strip = document.getElementById('health-strip');
  var dataEl = document.getElementById('health-data');
  if (!strip) return;
  var items = [];
  var sleepToday = (HD.sleep||[]).find(function(s){ return s.date===TODAY; });
  if (sleepToday) items.push({em:'😴',label:'Sleep',val:(sleepToday.hours||'?')+' hrs'});
  var haToday = (HD.headaches||[]).filter(function(h){ return h.date===TODAY; }).sort(function(a,b){ return (b.startTime||'').localeCompare(a.startTime||''); })[0];
  if (haToday) items.push({em:'🧠',label:(haToday.type||'Headache'),val:'Intensity '+(haToday.intensity||'?')+'/10'});
  var symsToday = (HD.symptoms||[]).filter(function(s){ return s.date===TODAY; });
  if (symsToday.length) items.push({em:'🩺',label:symsToday.length+' symptom'+(symsToday.length!==1?'s':''),val:symsToday.slice(0,2).map(function(s){ return s.name; }).join(', ')+(symsToday.length>2?'…':'')});
  if (!items.length) { strip.style.display='none'; return; }
  strip.style.display = 'block';
  if (dataEl) dataEl.innerHTML = items.map(function(i) {
    return '<div class="hs-item"><span class="hs-em">'+i.em+'</span><span class="hs-label">'+esc(i.label)+'</span><span class="hs-val">'+esc(i.val)+'</span></div>';
  }).join('');
}

function renderTimeline() {
  var dd = tlGetDayData();
  var allItems = getMergedItems();
  var te = TE();
  var timed   = allItems.filter(function(i){ return i.time&&!i.allDay; }).sort(function(a,b){ return a.time.localeCompare(b.time); });
  var untimed = allItems.filter(function(i){ return !i.time&&!i.allDay&&i.type!=='appointment'; });
  var untimedAppts = allItems.filter(function(i){ return !i.time&&!i.allDay&&i.type==='appointment'; });

  var hourMap = {};
  timed.forEach(function(item) {
    var h = parseInt(item.time.split(':')[0]);
    if (!hourMap[h]) hourMap[h] = [];
    hourMap[h].push(item);
  });

  var hours = Object.keys(hourMap).map(Number);
  var minH = hours.length ? Math.min(Math.min.apply(null,hours),7)  : 7;
  var maxH = hours.length ? Math.max(Math.max.apply(null,hours)+1,22) : 22;

  var tl = document.getElementById('timeline');
  if (!tl) return;
  var html = '<div class="tl-ruler"></div>';
  html += '<div id="tl-now-wrap" class="tl-now-wrap"><div class="tl-now-line" id="tl-now-line" style="display:none"><div class="tl-now-dot"></div></div></div>';

  for (var h=minH; h<=maxH; h++) {
    var isCurH = new Date().getHours()===h;
    var lbl = h===0?'12a':h<12?h+'a':h===12?'12p':(h-12)+'p';
    var items = hourMap[h] || [];
    html += '<div class="tl-hour"><div class="tl-hour-label">'+lbl+'</div>' +
      '<div class="tl-hour-body' + (isCurH?' current-hour':'') + '">' +
      items.map(function(i){ return renderTimelineBlock(i,te); }).join('') +
      '</div></div>';
  }
  tl.innerHTML = html;

  var unschedSection = document.getElementById('unsched-section');
  var unschedList    = document.getElementById('unsched-list');
  var allUntimed = untimedAppts.concat(untimed);
  if (unschedSection) unschedSection.style.display = allUntimed.length ? 'block' : 'none';
  if (unschedList && allUntimed.length) {
    unschedList.innerHTML = allUntimed.map(function(i){ return renderTimelineBlock(i,te,true); }).join('');
  }

  if (!allItems.length) {
    tl.innerHTML = '<div class="empty"><div class="empty-ic">📅</div>No tasks planned for today.<br>' +
      '<span style="font-size:11px;margin-top:5px;display:block">' +
      '<a href="day-view.html#plan" onclick="switchDayViewTab(\'plan\');return false;" style="color:var(--purple);font-weight:700">Build your day →</a>' +
      '</span></div>';
  }
}

function renderTimelineBlock(item, te, untimed) {
  var cat = te.getCategories().find(function(c){ return c.id===item.category; });
  var isAppt = item.type==='appointment';
  var isDone = item.status==='done';
  var tier   = item.tier||1;
  var blockClass = 'tl-block';
  if (isAppt) blockClass += ' appt-block';
  else        blockClass += ' tier-'+tier;
  if (isDone)   blockClass += ' done-block';
  if (untimed)  blockClass += ' untimed';

  var checkOrLock = isAppt
    ? '<div class="tb-lock" onclick="event.stopPropagation();openFriction(\''+item.id+'\',true)" title="Manage">🔒</div>'
    : '<div class="tb-check" onclick="event.stopPropagation();tlQuickDone(\''+item.id+'\')">'+(isDone?'✓':'')+'</div>';

  return '<div class="'+blockClass+'" id="tlb-'+item.id+'" onclick="openFriction(\''+item.id+'\','+isAppt+')">' +
    checkOrLock +
    '<div class="tb-body">' +
      '<div class="tb-title">'+esc(item.title)+(item.deferCount>0?'<span class="def-badge">🔄 ×'+item.deferCount+'</span>':'')+'</div>' +
      '<div class="tb-meta">' +
        (item.time ? '<span class="'+(isAppt?'tb-time':'')+'">'+item.time+'</span>' : '') +
        (item.duration ? '<span class="tb-dur">⏱️ '+item.duration+'min</span>' : '') +
        (cat ? '<span class="tb-cat"><span style="color:'+cat.color+'">'+cat.emoji+'</span> '+cat.name+'</span>' : '') +
        (!isAppt ? '<span style="font-size:9px;color:'+(tier===1?'var(--red)':tier===2?'var(--gold)':'var(--green)')+'">T'+tier+'</span>' : '') +
      '</div>' +
    '</div>' +
    '<button class="tb-friction-btn" onclick="event.stopPropagation();openFriction(\''+item.id+'\','+isAppt+')" title="Options">•••</button>' +
  '</div>';
}

function getAllDayItemsForToday() {
  var dd = tlGetDayData();
  var regular = (dd.items||[]).filter(function(i){ return i.allDay===true; });
  var recurItems = [];
  var pad = function(n){ return String(n).padStart(2,'0'); };
  var now = new Date(); var y=now.getFullYear(), m=now.getMonth(), d=now.getDate(), dow=now.getDay();
  // Phase C: delegate to unified recurrence engine if available
  if (window.HQRecurrence) {
    const dateStr = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const recurItems = window.HQRecurrence.occurrencesOnDate(RECURRING, dateStr, { allDayOnly: true });
    return regular.concat(recurItems);
  }
  // Fallback: original implementation
  (RECURRING||[]).forEach(function(r) {
    if (!r.allDay) return;
    var freq = r.freq||'yearly', matches = false;
    if (freq==='yearly')            matches = r.month===m+1 && r.day===d;
    else if (freq==='monthly')      matches = r.day===d;
    else if (freq==='weekly')       matches = r.dayOfWeek===dow;
    if (matches) recurItems.push({ id:'recur-allday-'+r.id, title:(r.emoji||'🗓️')+' '+r.title, allDay:true, status:'scheduled', _isRecurring:true, _recurId:r.id });
  });
  return regular.concat(recurItems);
}

function renderAlldayBanner() {
  var banner = document.getElementById('allday-banner');
  if (!banner) return;
  var items = getAllDayItemsForToday();
  if (!items.length) { banner.style.display='none'; return; }
  banner.style.display = 'block';
  banner.className = 'allday-banner';
  banner.innerHTML = '<div class="allday-banner-hd">🗓️ All Day</div><div>' +
    items.map(function(i) {
      return '<span class="allday-pill' + (i.status==='done'?' done-pill':'') + '" onclick="' +
        (i._isRecurring ? 'openRecurEditFromTimeline(\''+i._recurId+'\')' : 'tlQuickDoneAllDay(\''+i.id+'\')') + '">' +
        esc(i.title) +
        (i._isRecurring ? '<span class="allday-pill-edit" onclick="event.stopPropagation();openRecurEditFromTimeline(\''+i._recurId+'\')">✏️</span>' :
          '<span class="allday-pill-edit" onclick="event.stopPropagation();tlQuickDoneAllDay(\''+i.id+'\')">' + (i.status==='done'?'↩':'✓') + '</span>') +
      '</span>';
    }).join('') + '</div>';
}

function tlQuickDoneAllDay(id) {
  var dd = tlGetDayData();
  var item = (dd.items||[]).find(function(i){ return i.id===id; }); if (!item) return;
  var toStatus = item.status==='done' ? 'scheduled' : 'done';
  if (window.HQStatus) HQStatus.transition(item, toStatus, { action:'quickDoneToggle', source:'day-view' });
  else item.status = toStatus;
  tlPersist(); renderAlldayBanner(); renderProgress();
  hqShowToast(item.status==='done' ? '✅ Done!' : '🔄 Reopened');
}

function openRecurEditFromTimeline(recurId) {
  try { HQSafe.store.set(HQKeys.RECUR_PENDING, recurId); } catch(e) {}
  window.location.href = 'monthly-planner.html';
}

function positionNowLine() {
  var tl = document.getElementById('timeline'); if (!tl) return;
  var hourEls = tl.querySelectorAll('.tl-hour'); if (!hourEls.length) return;
  var now = new Date(), nowH = now.getHours(), nowM = now.getMinutes();
  var targetRow = null;
  hourEls.forEach(function(row) {
    var label = (row.querySelector('.tl-hour-label')||{}).textContent||'';
    var h = parseTLTimeLabel(label);
    if (h===nowH) targetRow = row;
  });
  var line = document.getElementById('tl-now-line');
  if (!targetRow || !line) { if(line) line.style.display='none'; return; }
  var rowTop = targetRow.offsetTop;
  var rowH   = targetRow.offsetHeight || 60;
  line.style.display = 'block';
  line.style.top = (rowTop + (nowM/60)*rowH) + 'px';
}

function parseTLTimeLabel(label) {
  var l = label.trim().toLowerCase();
  if (l.endsWith('a')) { var h=parseInt(l); return h===12?0:h; }
  if (l.endsWith('p')) { var h=parseInt(l); return h===12?12:h+12; }
  return -1;
}

function tlQuickDone(id) {
  var allItems = getMergedItems();
  var item = allItems.find(function(i){ return i.id===id; }); if (!item) return;
  var newStatus = item.status==='done' ? 'scheduled' : 'done';
  persistTaskStatus(id, {status:newStatus, doneAt:newStatus==='done'?new Date().toISOString():undefined});
  syncStatusToWeekly(id, newStatus);
  tlRender();
  hqShowToast(newStatus==='done' ? '✅ Done!' : '🔄 Reopened');
}

function openFriction(id, isAppt) {
  frictionId=id; frictionIsAppt=isAppt; frictionAction=isAppt?'appt-done':'done';
  var item = getMergedItems().find(function(i){ return i.id===id; }); if (!item) return;
  var fmTitle = document.getElementById('fm-title');
  var fmDetail = document.getElementById('fm-detail');
  if (fmTitle) fmTitle.textContent = esc(item.title.slice(0,40));
  var detail = '<strong>'+esc(item.title)+'</strong>';
  if (item.time) detail += '<br>⏰ '+item.time;
  if (item.notes) detail += '<br><span style="color:var(--muted)">'+esc(item.notes.slice(0,80))+(item.notes.length>80?'…':'')+'</span>';
  if (fmDetail) fmDetail.innerHTML = detail;
  ['fm-reason','fm-newdate'].forEach(function(id){ var el=document.getElementById(id); if(el) el.value=''; });
  ['fm-reason-wrap','fm-newdate-wrap'].forEach(function(id){ var el=document.getElementById(id); if(el) el.style.display='none'; });
  var taskOpts = document.getElementById('fm-task-opts');
  var apptOpts = document.getElementById('fm-appt-opts');
  if (taskOpts) taskOpts.style.display = isAppt ? 'none' : 'block';
  if (apptOpts) apptOpts.style.display = isAppt ? 'block' : 'none';
  if (!isAppt) {
    var foReopen = document.getElementById('fo-reopen');
    var foDone   = document.getElementById('fo-done');
    if (foReopen) foReopen.style.display = item.status==='done' ? 'flex' : 'none';
    if (foDone)   foDone.style.display   = item.status==='done' ? 'none' : 'flex';
    if (item.status==='done') frictionAction='reopen';
  }
  document.querySelectorAll('.friction-opt').forEach(function(o){ o.classList.remove('sel'); });
  if (isAppt) { var el=document.getElementById('fo-appt-done'); if(el) el.classList.add('sel'); }
  else if (item.status==='done') { var el=document.getElementById('fo-reopen'); if(el) el.classList.add('sel'); }
  else { var el=document.getElementById('fo-done'); if(el) el.classList.add('sel'); }
  var modal = document.getElementById('friction-modal');
  if (modal) modal.classList.add('show');
}

function selF(el, action) {
  frictionAction = action;
  document.querySelectorAll('.friction-opt').forEach(function(o){ o.classList.remove('sel'); });
  el.classList.add('sel');
  var needsReason = ['defer','appt-reschedule','appt-cancel'].includes(action);
  var needsDate   = action==='appt-reschedule';
  var rw = document.getElementById('fm-reason-wrap');
  var nw = document.getElementById('fm-newdate-wrap');
  if (rw) rw.style.display = needsReason ? 'block' : 'none';
  if (nw) nw.style.display = needsDate   ? 'block' : 'none';
}

function confirmFriction() {
  var dd = tlGetDayData();
  var allItems = getMergedItems();
  var item = allItems.find(function(i){ return i.id===frictionId; }); if (!item) return;
  var reasonEl = document.getElementById('fm-reason');
  var reason = reasonEl ? reasonEl.value.trim() : '';
  if (['defer','appt-reschedule','appt-cancel'].includes(frictionAction) && !reason) {
    if (reasonEl) { reasonEl.style.borderColor='var(--red)'; setTimeout(function(){ reasonEl.style.borderColor=''; },2000); }
    return;
  }
  if (!item.history) item.history = [];

  if (frictionAction==='done') {
    persistTaskStatus(frictionId, {status:'done',doneAt:new Date().toISOString(),history:item.history.concat([{action:'done',at:new Date().toISOString()}])});
    syncStatusToWeekly(frictionId,'done');
    hqShowToast('✅ Done!');
  } else if (frictionAction==='reopen') {
    persistTaskStatus(frictionId, {status:'scheduled',doneAt:undefined,history:item.history.concat([{action:'reopened',at:new Date().toISOString()}])});
    syncStatusToWeekly(frictionId,'scheduled');
    hqShowToast('🔄 Reopened');
  } else if (frictionAction==='defer') {
    if (item._fromDB2) {
      persistTaskStatus(frictionId, {status:'deferred',deferCount:(item.deferCount||0)+1,history:item.history.concat([{action:'deferred',at:new Date().toISOString(),reason:reason}])});
    } else {
      dd.items = (dd.items||[]).filter(function(i){ return i.id!==frictionId; });
      pushBackToWeekly(item); tlPersist();
    }
    hqShowToast('🔄 Back in Weekly inbox');
  } else if (frictionAction==='appt-done') {
    persistTaskStatus(frictionId, {status:'done',doneAt:new Date().toISOString(),history:item.history.concat([{action:'appointment-completed',at:new Date().toISOString()}])});
    hqShowToast('✅ Appointment complete!');
  } else if (frictionAction==='appt-cancel') {
    persistTaskStatus(frictionId, {status:'cancelled',history:item.history.concat([{action:'appointment-cancelled',at:new Date().toISOString(),reason:reason}])});
    hqShowToast('✕ Appointment cancelled');
  } else if (frictionAction==='appt-reschedule') {
    var newDateEl = document.getElementById('fm-newdate');
    var newDate = newDateEl ? newDateEl.value : '';
    if (!item._fromDB2) {
      dd.items = (dd.items||[]).filter(function(i){ return i.id!==frictionId; });
      if (newDate) {
        if (!TL_DB[newDate]) TL_DB[newDate] = {items:[],notes:'',bdLog:[]};
        item.dayTarget=newDate;
        HQStatus.transition(item, 'scheduled', { action:'rescheduled', dayTarget:newDate, source:'day-view' });
        TL_DB[newDate].items.push(item);
      }
      tlPersist();
    }
    hqShowToast('📅 Rescheduled');
  }
  closeFrictionModal(); tlRender();
}

function pushBackToWeekly(item) {
  try {
    var wk = getWeekStr(new Date(TODAY+'T12:00:00'));
    HQStatus.transition(item, 'weekly', {
      action: 'pushed-back-to-weekly', weekTarget: wk, source: 'day-view'
    });
    item.dayTarget=null; item.weekTarget=wk;
    var wdb = HQSafe.store.get(W_STORE, {});
    if (!wdb[wk]) wdb[wk] = {inbox:[],days:{},goals:[],notes:''};
    if (!wdb[wk].inbox) wdb[wk].inbox = [];
    if (!wdb[wk].inbox.find(function(x){ return x.id===item.id; })) wdb[wk].inbox.push(item);
    HQSafe.store.set(W_STORE, wdb);
  } catch(e) {}
}

function syncStatusToWeekly(itemId, status) {
  try {
    var wdb = HQSafe.store.get(W_STORE, {});
    Object.values(wdb).forEach(function(wd) {
      Object.values(wd.days||{}).forEach(function(items) {
        var it = items.find(function(i){ return i.id===itemId; });
        if (it) { it.status=status; if(status==='done') it.doneAt=new Date().toISOString(); }
      });
      var ii = (wd.inbox||[]).find(function(i){ return i.id===itemId; });
      if (ii) ii.status = status;
    });
    HQSafe.store.set(W_STORE, wdb);
  } catch(e) {}
}

function closeFrictionModal() {
  var el = document.getElementById('friction-modal');
  if (el) el.classList.remove('show');
}

const getWeekStr = d => (window.HQDate ? HQDate.weekKey(d) : (() => { const dt=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())); const dn=dt.getUTCDay()||7; dt.setUTCDate(dt.getUTCDate()+4-dn); const ys=new Date(Date.UTC(dt.getUTCFullYear(),0,1)); return `${dt.getUTCFullYear()}-W${String(Math.ceil((((dt-ys)/86400000)+1)/7)).padStart(2,'0')}`; })()); // aliased → HQDate.weekKey

function fmtTLTime(d) { return d.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',hour12:true}); }

if(!window._dvNowInterval){window._dvNowInterval=setInterval(function() { positionNowLine(); renderHeader(); }, 60000);}
// FIX-04/FIX-08: Clear intervals and abort listeners on page unload
window.addEventListener('pagehide', function() {
  if (window._dvClockInterval) { clearInterval(window._dvClockInterval); window._dvClockInterval = null; }
  if (window._dvNowInterval) { clearInterval(window._dvNowInterval); window._dvNowInterval = null; }
}, {once: true});
// FIX-08
if (window.HQLifecycle) HQLifecycle.register(function() {
  if (window._dvClockInterval) { clearInterval(window._dvClockInterval); window._dvClockInterval = null; }
  if (window._dvNowInterval) { clearInterval(window._dvNowInterval); window._dvNowInterval = null; }
});


window.addEventListener('storage', function(e) {
  if ([DB_STORE,DB2_STORE,NN_STORE,H_STORE,HQKeys.DB_SIGNAL].includes(e.key)) {
    if (getDayViewTab()==='live') { tlLoad(); tlRender(); }
  }
  if (e.key === HQKeys.DAYBUILDER_PINS) { renderPinnedItems(); }
});

// P5: Live update when pins change via CustomEvent (same-tab dismiss)
window.addEventListener('hq-daybuilder-pins-updated', function() { renderPinnedItems(); });


// ══════════════════════════════════════════════════════════
//  PLAN MODULE — Day Builder
//  (renamed: DB→DBP, load→dbLoad, persist→dbPersist)
// ══════════════════════════════════════════════════════════

(function cleanLegacyKeys(){ ['db_presets_v2','db_days_v2','db_devlog','db2-theme'].forEach(function(k){ try{HQSafe.store.remove(k);}catch(e){} }); })();

var STORE        = HQKeys.DAYBUILDER_V2;
var WEEKLY_STORE = HQKeys.WEEKLY;
var DBP = {days:{},routineTasks:[],customTasks:[]};
var currentDate = '';
var selectedPreset=null,devTargetSlot=null,dragPresetData=null,catFilter='all';
var _editPlacedKey=null,_editPlacedId=null,_placePreset=null;

var HOUR_HEIGHT   = 64;
var GRID_START_HOUR = 5;
var GRID_START_MIN  = GRID_START_HOUR*60;

var DEF=[
  {id:'p-walk',em:'👟',name:'Walk',dur:60,cat:'health'},
  {id:'p-grocery',em:'🛒',name:'Grocery Run',dur:60,cat:'adulting'},
  {id:'p-chore',em:'🧹',name:'Chore Block',dur:30,cat:'home'},
  {id:'p-mealprep',em:'🍳',name:'Meal Prep',dur:60,cat:'health'},
  {id:'p-finance',em:'💰',name:'Finance Check',dur:15,cat:'finance'},
  {id:'p-braindump',em:'💭',name:'Thought Jar',dur:10,cat:'self'},
  {id:'p-transit',em:'🚌',name:'Transit',dur:30,cat:'transit'},
  {id:'p-appt',em:'📅',name:'Appointment',dur:60,cat:'health'},
  {id:'p-shopping',em:'🛍️',name:'Shopping',dur:60,cat:'adulting'},
  {id:'p-social',em:'💬',name:'Social Time',dur:60,cat:'social'},
  {id:'p-paperwork',em:'📋',name:'Paperwork',dur:45,cat:'adulting'},
  {id:'p-reading',em:'📚',name:'Reading',dur:30,cat:'self'},
];
var CATS={
  work:{em:'💼',col:'var(--purple)',cls:'task-work'},
  home:{em:'🏠',col:'var(--green)',cls:'task-home'},
  self:{em:'🧠',col:'var(--teal)',cls:'task-self'},
  social:{em:'💬',col:'var(--teal)',cls:'task-social'},
  health:{em:'🏥',col:'var(--pink)',cls:'task-health'},
  finance:{em:'💰',col:'var(--gold)',cls:'task-finance'},
  transit:{em:'🚌',col:'var(--coral)',cls:'task-transit'},
  adulting:{em:'📋',col:'var(--muted)',cls:'task-adulting'},
};
var HOURS=Array.from({length:20},function(_,i){ return i+5; });
var DOW_DB=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
var MON_DB=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function localDateStr(d){var _d=d||new Date();return _d.getFullYear()+'-'+String(_d.getMonth()+1).padStart(2,'0')+'-'+String(_d.getDate()).padStart(2,'0');}
const todayStr = () => (window.HQDate ? HQDate.today() : (() => { const d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); })()); // aliased → HQDate.today
function makeTimeKey(h,m){return String(h).padStart(2,'0')+':'+String(m||0).padStart(2,'0');}
function timeKeyToMins(k){if(typeof k==='number')return k*60;var p=String(k).split(':');return parseInt(p[0])*60+parseInt(p[1]||0);}
function fmtTimeKey(k){if(!k&&k!==0)return'';var m=timeKeyToMins(k),h=Math.floor(m/60),min=m%60,ap=h<12?'am':'pm',h12=h%12||12;return h12+(min?':'+String(min).padStart(2,'0'):'')+ap;}

function dbLoad(){
  DBP = HQSafe.store.get(STORE, {});
  if(!DBP.days)DBP.days={};if(!DBP.routineTasks)DBP.routineTasks=[];if(!DBP.customTasks)DBP.customTasks=[];
  migrateIntegerSlots();
}
function dbPersist(){try{HQSafe.store.set(STORE, DBP);}catch(e){}}
const uid = () => HQUtils.uid(); // → HQUtils.uid
function getDD(d){if(!DBP.days[d])DBP.days[d]={slots:{},deviations:[]};return DBP.days[d];}
function migrateIntegerSlots(){
  Object.values(DBP.days).forEach(function(dd){
    if(!dd.slots)return;
    Object.keys(dd.slots).forEach(function(k){
      if(/^\d+$/.test(k)){var tk=makeTimeKey(parseInt(k),0);if(!dd.slots[tk])dd.slots[tk]=[];(dd.slots[k]||[]).forEach(function(t){if(!dd.slots[tk].find(function(x){return x.id===t.id;}))dd.slots[tk].push(t);});delete dd.slots[k];}
    });
  });
}

function initDate(){currentDate=todayStr();renderAll();}
function goToday(){currentDate=todayStr();renderAll();}
function moveDay(dir){var d=new Date(currentDate+'T12:00:00');d.setDate(d.getDate()+dir);currentDate=localDateStr(d);renderAll();}
function renderAll(){
  var d=new Date(currentDate+'T12:00:00');var isToday=currentDate===todayStr();
  var hdrLbl=document.getElementById('hdr-date-lbl');
  var hdrSub=document.getElementById('hdr-date-sub');
  if(hdrLbl)hdrLbl.textContent=(isToday?'Today — ':'')+DOW_DB[d.getDay()]+', '+MON_DB[d.getMonth()]+' '+d.getDate();
  if(hdrSub)hdrSub.textContent=d.getFullYear();
  var stitle=document.getElementById('sched-title');
  if(stitle)stitle.textContent='🗓 '+(isToday?'Today':DOW_DB[d.getDay()]+' '+MON_DB[d.getMonth()]+' '+d.getDate());
  renderSidebar();renderGrid();renderPinnedItems();renderDevLog();updateStats();renderWeekPull();
  setTimeout(scrollToNow,60);
}
function toggleSide(id){document.getElementById(id).classList.toggle('open');}

function renderSidebar(){
  var myR=DBP.routineTasks;
  var mrp=document.getElementById('my-routine-presets');
  var mre=document.getElementById('my-routine-empty');
  if(mrp)mrp.innerHTML=myR.map(function(t){return rPreset(t,'routine');}).join('');
  if(mre)mre.style.display=myR.length?'none':'block';
  var cf=document.getElementById('cat-filters');
  if(cf)cf.innerHTML=['all'].concat(Object.keys(CATS)).map(function(c){
    return'<button class="cf-btn'+(c===catFilter?' on':'')+'" onclick="setCatF(\''+c+'\')">'+(c==='all'?'All':CATS[c].em)+'</button>';
  }).join('');
  var all=DEF.concat(Array.isArray(DBP.customTasks)?DBP.customTasks:[]);
  var filtered=catFilter==='all'?all:all.filter(function(t){return t.cat===catFilter;});
  var tp=document.getElementById('task-presets');
  if(tp)tp.innerHTML=filtered.map(function(t){return rPreset(t,'task',true);}).join('');
  var ind=document.getElementById('sel-indicator');
  if(ind){if(selectedPreset){ind.classList.add('show');var sit=document.getElementById('sel-indicator-text');if(sit)sit.textContent=selectedPreset.em+' '+selectedPreset.name+' — click any time to place';}else ind.classList.remove('show');}
}
function setCatF(c){catFilter=c;renderSidebar();}
function clearSelection(){selectedPreset=null;renderSidebar();}
function rPreset(t,src){
  var cat=CATS[t.cat]||CATS.work;var isSel=selectedPreset&&selectedPreset.id===t.id;
  var isDel=src==='routine'||(src==='task'&&!DEF.find(function(p){return p.id===t.id;}));
  return'<div class="preset'+(isSel?' selected':'')+'" draggable="true" ondragstart="dragP(event,\''+t.id+'\',\''+src+'\')" onclick="selP(\''+t.id+'\',\''+src+'\')">' +
    '<div class="cat-dot" style="background:'+cat.col+'"></div><div class="preset-em">'+t.em+'</div>' +
    '<div class="preset-info"><div class="preset-name">'+esc(t.name)+'</div><div class="preset-dur">'+(t.dur?t.dur+' min':'')+'</div></div>' +
    (isDel?'<button class="preset-rm" onclick="event.stopPropagation();rmPreset(\''+t.id+'\',\''+src+'\')">✕</button>':'')+
  '</div>';
}
function selP(id,src){var t=findP(id,src);if(!t)return;selectedPreset=(selectedPreset&&selectedPreset.id===id)?null:Object.assign({},t,{src:src});if(selectedPreset)hqShowToast(t.em+' '+t.name+' selected — click any time to place');renderSidebar();}
function findP(id,src){
  if(src==='routine')return DBP.routineTasks.find(function(t){return t.id===id;});
  return DEF.concat(Array.isArray(DBP.customTasks)?DBP.customTasks:[]).find(function(t){return t.id===id;});
}
function dragP(ev,id,src){dragPresetData={id:id,src:src};selectedPreset=findP(id,src);ev.dataTransfer.effectAllowed='copy';}

function assignColumns(items){
  if(!items.length)return[];
  var n=items.length;
  var parent=Array.from({length:n},function(_,i){return i;});
  function find(i){if(parent[i]!==i)parent[i]=find(parent[i]);return parent[i];}
  function union(i,j){parent[find(i)]=find(j);}
  for(var i=0;i<n;i++)for(var j=i+1;j<n;j++)if(items[i].startMin<items[j].endMin&&items[j].startMin<items[i].endMin)union(i,j);
  var groups={};
  for(var i=0;i<n;i++){var r=find(i);if(!groups[r])groups[r]=[];groups[r].push(i);}
  var colIdx=new Array(n).fill(0),numCols=new Array(n).fill(1);
  Object.values(groups).forEach(function(grp){
    grp.sort(function(a,b){return items[a].startMin-items[b].startMin;});
    var colEnd=[];
    grp.forEach(function(idx){
      var item=items[idx];var col=colEnd.findIndex(function(e){return e<=item.startMin+1;});
      if(col===-1){col=colEnd.length;colEnd.push(item.endMin);}else colEnd[col]=item.endMin;
      colIdx[idx]=col;
    });
    var total=colEnd.length;grp.forEach(function(idx){numCols[idx]=total;});
  });
  return items.map(function(item,i){return Object.assign({},item,{colIndex:colIdx[i],numCols:numCols[i]});});
}

function renderGrid(){
  var dd=getDD(currentDate);var now=new Date();var isToday=currentDate===todayStr();
  var totalH=HOURS.length*HOUR_HEIGHT;
  var allItems=[];
  Object.entries(dd.slots||{}).forEach(function(kv){
    var tk=kv[0],arr=kv[1];
    var startMin=timeKeyToMins(tk);
    (arr||[]).forEach(function(t){allItems.push({t:t,tk:tk,startMin:startMin,endMin:startMin+(t.dur||30)});});
  });
  allItems.sort(function(a,b){return a.startMin-b.startMin;});
  var withCols=assignColumns(allItems);
  var nowMin=now.getHours()*60+now.getMinutes();
  var nowTop=((nowMin-GRID_START_MIN)/60)*HOUR_HEIGHT;
  var showNow=isToday&&nowTop>=0&&nowTop<=totalH;
  var html='<div id="sched-canvas" class="sched-canvas" style="height:'+totalH+'px" onclick="clickCanvas(event)" ondragover="canvasDragOver(event)" ondragleave="canvasDragLeave(event)" ondrop="dropCanvas(event)">';
  HOURS.forEach(function(h,i){
    var top=i*HOUR_HEIGHT,halfTop=top+HOUR_HEIGHT/2;
    var lbl=h===0?'12a':h<12?h+'a':h===12?'12p':(h-12)+'p';
    var isCur=isToday&&now.getHours()===h;
    html+='<div class="sched-hour-line'+(isCur?' cur-hour':'')+'" style="top:'+top+'px"><div class="sched-hour-lbl">'+lbl+'<div class="ts-sublabel">:00</div></div></div>' +
          '<div class="sched-half-line" style="top:'+halfTop+'px"><div class="sched-half-lbl">:30</div></div>';
  });
  if(showNow)html+='<div class="now-line-abs" style="top:'+nowTop.toFixed(1)+'px"></div>';
  html+='<div id="drag-snap-line" class="drag-snap-line"></div>';
  if(withCols.length){
    withCols.forEach(function(item){html+=rPlacedAbs(item.t,item.tk,
      Math.max(0,((item.startMin-GRID_START_MIN)/60)*HOUR_HEIGHT),
      Math.max(((item.t.dur||30)/60)*HOUR_HEIGHT,28),item.numCols,item.colIndex);});
  }else{
    html+='<div class="sched-empty">No tasks scheduled yet.<br>Select a preset from the sidebar then click any time — or drag directly.</div>';
  }
  html+='</div>';
  var sg=document.getElementById('schedule-grid');if(sg)sg.innerHTML=html;
}

// P5: Render daybuilder-pinned items above the schedule grid.
// Items get pinned when the pin-daybuilder behavior fires; shown on their
// scheduled date (or today if no date set). Dismissing removes from pin store.
function renderPinnedItems(){
  var panel=document.getElementById('db-pinned-panel');
  if(!panel) return;
  var pins=typeof hqGetDaybuilderPins==='function'?hqGetDaybuilderPins(currentDate):[];
  if(!pins.length){panel.style.display='none';return;}
  panel.style.display='';
  panel.innerHTML=
    '<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;font-size:10px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:var(--purple,#8b7fff)">'+
      '📌 Pinned for today'+
      '<span style="font-size:9px;color:var(--muted);font-weight:400;text-transform:none">('+pins.length+')</span>'+
    '</div>'+
    pins.map(function(p){
      return '<div style="display:flex;align-items:center;gap:8px;padding:7px 10px;background:rgba(139,127,255,.07);border:1px solid rgba(139,127,255,.2);border-radius:8px;margin-bottom:5px">'+
        '<a href="'+(p.href||'#')+'" style="flex:1;text-decoration:none;color:var(--purple,#8b7fff);font-size:12px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+
          '📌 '+(p.text||'Pinned item')+
          (p.source?'<span style="font-size:9px;color:var(--muted);font-weight:400"> · '+p.source+'</span>':'')+
        '</a>'+
        '<button onclick="dismissDaybuilderPin(\''+p.id+'\')" '+
          'style="background:none;border:none;cursor:pointer;padding:4px 6px;color:var(--muted);font-size:12px;border-radius:5px;flex-shrink:0;transition:color .15s" '+
          'onmouseover="this.style.color=\'var(--red,#e24b4a)\'" onmouseout="this.style.color=\'var(--muted)\'" '+
          'aria-label="Dismiss">✕</button>'+
      '</div>';
    }).join('');
}

function dismissDaybuilderPin(id){
  if(typeof hqDismissDaybuilderPin==='function')hqDismissDaybuilderPin(id);
  renderPinnedItems();
}

function rPlacedAbs(t,tk,top,height,numCols,colIndex){
  var cat=CATS[t.cat]||CATS.work;
  var cls=t.locked?'task-locked':(cat.cls||'task-work');
  var action=t.locked?'openDev(\''+tk+'\',\''+t.id+'\')':'openEditPlaced(\''+tk+'\',\''+t.id+'\')';
  var dur=t.dur||30;var endMin=timeKeyToMins(tk)+dur;var endTk=makeTimeKey(Math.floor(endMin/60),endMin%60);
  var LPAD=51,GAP=3;
  var leftStyle=numCols===1?'calc('+LPAD+'px)':'calc('+LPAD+'px + '+colIndex+' * ((100% - '+LPAD+'px) / '+numCols+'))';
  var widthStyle=numCols===1?'calc(100% - '+(LPAD+GAP)+'px)':'calc((100% - '+LPAD+'px) / '+numCols+' - '+GAP+'px)';
  var veryShort=height<32,short=height<52;
  var showEnd=height>=78&&numCols<=2,showDur=height>=100&&numCols<=2;
  var durLabel=dur>=60?(Math.floor(dur/60)+'h'+(dur%60?dur%60+'m':'')):(dur+'m');
  var inner;
  if(veryShort){inner='<div class="pa-row"><span class="pa-em" style="font-size:10px">'+t.em+'</span><span class="pa-name" style="font-size:9px">'+esc(t.name)+'</span><span class="placed-time" style="font-size:7px">'+fmtTimeKey(tk)+'</span></div>';}
  else if(short){inner='<div class="pa-row"><span class="pa-em">'+t.em+'</span><span class="pa-name">'+esc(t.name)+'</span><span class="placed-time">'+fmtTimeKey(tk)+'</span></div>';}
  else{inner='<div class="pa-row"><span class="pa-em">'+t.em+'</span><span class="pa-name">'+esc(t.name)+'</span><span class="placed-time">'+fmtTimeKey(tk)+'</span></div>'+(showEnd?'<div class="pa-endtime">→ '+fmtTimeKey(endTk)+'</div>':'')+(showDur?'<div class="pa-dur">'+durLabel+'</div>':'');}
  return'<div class="placed-abs '+cls+'" style="top:'+top.toFixed(1)+'px;height:'+(height-2).toFixed(1)+'px;left:'+leftStyle+';width:'+widthStyle+'" onclick="event.stopPropagation();'+action+'">'+inner+'</div>';
}

function clickCanvas(event){
  if(event.target.closest('.placed-abs'))return;
  var canvas=document.getElementById('sched-canvas');if(!canvas)return;
  var rect=canvas.getBoundingClientRect();var y=event.clientY-rect.top;
  var totalMin=(y/HOUR_HEIGHT)*60+GRID_START_MIN;var snapped=Math.round(totalMin/15)*15;
  openPlaceModal(Math.floor(snapped/60),snapped%60,selectedPreset);
}
function canvasDragOver(ev){
  ev.preventDefault();if(!dragPresetData)return;
  var canvas=document.getElementById('sched-canvas');if(!canvas)return;
  var rect=canvas.getBoundingClientRect();var y=ev.clientY-rect.top;
  var totalMin=(y/HOUR_HEIGHT)*60+GRID_START_MIN;var snapped=Math.round(totalMin/15)*15;
  var snapTop=((snapped-GRID_START_MIN)/60)*HOUR_HEIGHT;
  var line=document.getElementById('drag-snap-line');if(line){line.style.top=Math.max(0,snapTop).toFixed(1)+'px';line.classList.add('vis');}
}
function canvasDragLeave(){var line=document.getElementById('drag-snap-line');if(line)line.classList.remove('vis');}
function dropCanvas(ev){
  ev.preventDefault();canvasDragLeave();if(!dragPresetData)return;
  var t=findP(dragPresetData.id,dragPresetData.src);if(!t){dragPresetData=null;return;}
  var canvas=document.getElementById('sched-canvas');
  var rect=canvas.getBoundingClientRect();var y=ev.clientY-rect.top;
  var totalMin=(y/HOUR_HEIGHT)*60+GRID_START_MIN;var snapped=Math.round(totalMin/5)*5;
  placeT(makeTimeKey(Math.floor(snapped/60),snapped%60),t);dragPresetData=null;selectedPreset=null;renderSidebar();
}

function scrollToNow(){
  var grid=document.getElementById('schedule-grid');if(!grid)return;
  var isToday=currentDate===todayStr();var now=new Date();
  var targetMin=isToday?(now.getHours()*60+now.getMinutes()):(8*60);
  grid.scrollTop=Math.max(0,((targetMin-GRID_START_MIN)/60)*HOUR_HEIGHT-80);
}

function placeT(tk,t){
  var dd=getDD(currentDate);if(!dd.slots)dd.slots={};if(!dd.slots[tk])dd.slots[tk]=[];
  if(dd.slots[tk].find(function(x){return x.id===t.id;})){hqShowToast('⚠️ Already at this exact time');return;}
  var stored={id:t.id,em:t.em,name:t.name,dur:t.dur,cat:t.cat};
  if(t.locked)stored.locked=true;if(t.fromTemplate)stored.fromTemplate=t.fromTemplate;
  dd.slots[tk].push(stored);dbPersist();renderGrid();updateStats();hqShowToast('🗓 '+t.em+' '+t.name+' → '+fmtTimeKey(tk));
}
function rmPlaced(tk,id){
  var dd=getDD(currentDate);if(!dd.slots||!dd.slots[tk])return;
  dd.slots[tk]=dd.slots[tk].filter(function(t){return t.id!==id;});
  if(!dd.slots[tk].length)delete dd.slots[tk];
  dbPersist();renderGrid();updateStats();
}
function openPlaceModal(h,min,preset){
  _placePreset=preset;var tk=makeTimeKey(h,min);var dur=preset?(preset.dur||30):30;
  var pmTime=document.getElementById('pm-time');var pmDur=document.getElementById('pm-dur');
  if(pmTime)pmTime.value=tk;if(pmDur)pmDur.value=dur;
  _setEndTime('pm-time','pm-dur','pm-end');
  if(preset){
    var pmt=document.getElementById('pm-title');if(pmt)pmt.textContent='📌 Place: '+preset.em+' '+preset.name;
    var pmb=document.getElementById('pm-preset-banner');if(pmb)pmb.style.display='flex';
    var pmbl=document.getElementById('pm-preset-banner-label');if(pmbl)pmbl.textContent=preset.em+' '+preset.name+(preset.dur?' · '+preset.dur+'m':'');
    var pmcf=document.getElementById('pm-custom-fields');if(pmcf)pmcf.style.display='none';
  }else{
    var pmt=document.getElementById('pm-title');if(pmt)pmt.textContent='➕ Add to Schedule';
    var pmb=document.getElementById('pm-preset-banner');if(pmb)pmb.style.display='none';
    var pmcf=document.getElementById('pm-custom-fields');if(pmcf)pmcf.style.display='block';
    ['pm-name','pm-em','pm-cat'].forEach(function(id){var el=document.getElementById(id);if(el&&id==='pm-em')el.value='📌';else if(el&&id==='pm-name')el.value='';else if(el&&id==='pm-cat')el.value='work';});
  }
  openModal('place-modal');setTimeout(function(){var el=document.getElementById('pm-time');if(el)el.focus();},100);
}
function pmSyncEnd(){_setEndTime('pm-time','pm-dur','pm-end');}
function pmSyncDur(){_setDurFromEnd('pm-time','pm-end','pm-dur');}
function epSyncEnd(){_setEndTime('ep-time','ep-dur','ep-end');}
function epSyncDur(){_setDurFromEnd('ep-time','ep-end','ep-dur');}
function _setEndTime(startId,durId,endId){
  var s=document.getElementById(startId);var dEl=document.getElementById(durId);var eEl=document.getElementById(endId);
  if(!s||!dEl||!eEl||!s.value||!dEl.value)return;
  var endMin=timeKeyToMins(s.value)+parseInt(dEl.value);
  eEl.value=makeTimeKey(Math.floor(endMin/60)%24,endMin%60);
}
function _setDurFromEnd(startId,endId,durId){
  var s=document.getElementById(startId);var eEl=document.getElementById(endId);var dEl=document.getElementById(durId);
  if(!s||!eEl||!dEl||!s.value||!eEl.value)return;
  var dur=timeKeyToMins(eEl.value)-timeKeyToMins(s.value);
  if(dur<=0)dur+=24*60;dEl.value=dur;
}
function confirmPlace(){
  var timeEl=document.getElementById('pm-time');if(!timeEl||!timeEl.value){hqShowToast('⚠️ Pick a start time');return;}
  var tk=timeEl.value.slice(0,5);var durEl=document.getElementById('pm-dur');var dur=parseInt(durEl?durEl.value:30)||30;
  var task;
  if(_placePreset){task=Object.assign({},_placePreset,{dur:dur});}
  else{var nameEl=document.getElementById('pm-name');var name=nameEl?nameEl.value.trim():'';if(!name){hqShowToast('⚠️ Enter a task name');return;}var emEl=document.getElementById('pm-em');var catEl=document.getElementById('pm-cat');task={id:uid(),name:name,em:(emEl?emEl.value.trim():'')||'📌',cat:(catEl?catEl.value:'work'),dur:dur};}
  placeT(tk,task);closeModal('place-modal');selectedPreset=null;renderSidebar();
}
function openEditPlaced(tk,id){
  _editPlacedKey=tk;_editPlacedId=id;
  var slots=(getDD(currentDate).slots||{});var t=slots[tk]?slots[tk].find(function(x){return x.id===id;}):null;if(!t)return;
  var epmt=document.getElementById('ep-modal-title');if(epmt)epmt.textContent='✏️ '+t.em+' '+t.name;
  ['ep-time','ep-dur','ep-name','ep-em','ep-cat'].forEach(function(id){
    var el=document.getElementById(id);if(!el)return;
    if(id==='ep-time')el.value=tk;else if(id==='ep-dur')el.value=t.dur||30;
    else if(id==='ep-name')el.value=t.name||'';else if(id==='ep-em')el.value=t.em||'📌';
    else if(id==='ep-cat')el.value=t.cat||'work';
  });
  _setEndTime('ep-time','ep-dur','ep-end');openModal('edit-placed-modal');
}
function saveEditPlaced(){
  var newTkEl=document.getElementById('ep-time');if(!newTkEl||!newTkEl.value){hqShowToast('⚠️ Set a time');return;}
  var newTk=newTkEl.value.slice(0,5);var dd=getDD(currentDate);
  var t=dd.slots[_editPlacedKey]?dd.slots[_editPlacedKey].find(function(x){return x.id===_editPlacedId;}):null;
  if(!t){closeModal('edit-placed-modal');return;}
  dd.slots[_editPlacedKey]=(dd.slots[_editPlacedKey]||[]).filter(function(x){return x.id!==_editPlacedId;});
  if(!dd.slots[_editPlacedKey].length)delete dd.slots[_editPlacedKey];
  var nameEl=document.getElementById('ep-name');var emEl=document.getElementById('ep-em');var catEl=document.getElementById('ep-cat');var durEl=document.getElementById('ep-dur');
  var updated=Object.assign({},t,{name:(nameEl?nameEl.value.trim():'')||t.name,em:(emEl?emEl.value.trim():'')||t.em,cat:(catEl?catEl.value:t.cat),dur:parseInt(durEl?durEl.value:t.dur)||t.dur});
  if(!dd.slots[newTk])dd.slots[newTk]=[];dd.slots[newTk].push(updated);
  dbPersist();renderGrid();updateStats();closeModal('edit-placed-modal');hqShowToast('💾 Updated → '+fmtTimeKey(newTk));
}
async function deleteEditPlaced(){if(!(await HQConfirm.ask('Remove this item?', {danger:true})))return;rmPlaced(_editPlacedKey,_editPlacedId);closeModal('edit-placed-modal');}

function openDev(tk,id){
  devTargetSlot={tk:tk,id:id};var slots=(getDD(currentDate).slots||{});var t=slots[tk]?slots[tk].find(function(x){return x.id===id;}):null;
  var dmt=document.getElementById('dev-modal-title');if(dmt)dmt.textContent='⚠️ Removing: '+(t?t.em+' '+t.name:'Item');
  var dr=document.getElementById('dev-reason');if(dr)dr.value='';
  openModal('dev-modal');setTimeout(function(){var el=document.getElementById('dev-reason');if(el)el.focus();},150);
}
function confirmDeviation(){
  var drEl=document.getElementById('dev-reason');var reason=drEl?drEl.value.trim():'';
  if(!reason){if(drEl){drEl.style.borderColor='var(--red)';setTimeout(function(){drEl.style.borderColor='';},2000);}return;}
  var tk=devTargetSlot.tk,id=devTargetSlot.id;var dd=getDD(currentDate);
  var t=dd.slots&&dd.slots[tk]?dd.slots[tk].find(function(x){return x.id===id;}):null;
  if(dd.slots&&dd.slots[tk]){dd.slots[tk]=dd.slots[tk].filter(function(x){return x.id!==id;});if(!dd.slots[tk].length)delete dd.slots[tk];}
  if(!dd.deviations)dd.deviations=[];dd.deviations.push({item:t?t.name:'Unknown',tk:tk,reason:reason,at:new Date().toISOString()});
  dbPersist();closeModal('dev-modal');renderGrid();renderDevLog();updateStats();hqShowToast('⚠️ Deviation logged');
}
function renderDevLog(){
  var dd=getDD(currentDate);var devs=dd.deviations||[];var panel=document.getElementById('dev-log-panel');if(!panel)return;
  if(!devs.length){panel.style.display='none';return;}
  panel.style.display='block';
  var dll=document.getElementById('dev-log-list');
  if(dll)dll.innerHTML=devs.map(function(d){return'<div class="dl-entry"><div>⚠️</div><div style="flex:1"><div>'+esc(d.item)+'</div><div class="dl-reason">"'+esc(d.reason)+'"</div></div><div class="dl-time">'+fmtDbt(d.at)+'</div></div>';}).join('');
}

function updateStats(){
  var dd=getDD(currentDate);var allP=Object.values(dd.slots||{}).flat();
  var totalMin=allP.reduce(function(a,t){return a+(t.dur||0);},0);var hrs=Math.floor(totalMin/60),mins=totalMin%60;
  var pct=Math.min(100,Math.round(totalMin/(HOURS.length*60)*100));
  ['st-placed','st-hrs','st-free','st-pct'].forEach(function(id){var el=document.getElementById(id);if(!el)return;
    if(id==='st-placed')el.textContent=allP.length;
    else if(id==='st-hrs')el.textContent=hrs+(mins?'h'+mins+'m':'h');
    else if(id==='st-free')el.textContent=Math.max(0,Math.floor((HOURS.length*60-totalMin)/60))+'h';
    else if(id==='st-pct')el.textContent=pct+'%';
  });
  var sb=document.getElementById('st-bar');if(sb)sb.style.width=pct+'%';
}

function renderWeekPull(){
  var strip=document.getElementById('week-pull-strip');if(!strip)return;
  try{
    var wd=HQSafe.store.get(WEEKLY_STORE, null);if(!wd){strip.style.display='none';return;}var items=[];
    Object.values(wd).forEach(function(wk){
      if(wk&&wk.days&&wk.days[currentDate])items=items.concat((wk.days[currentDate]||[]).filter(function(it){return it.status!=='done';}));
      if(wk&&wk.inbox)items=items.concat((wk.inbox||[]).filter(function(it){return it.dayTarget===currentDate&&it.status!=='done';}));
    });
    var seen=new Set();items=items.filter(function(it){if(seen.has(it.id))return false;seen.add(it.id);return true;});
    if(!items.length){strip.style.display='none';return;}
    strip.style.display='block';
    strip.innerHTML='<div class="week-pull-strip"><div class="wps-title">📥 From Weekly Planner — '+items.length+' item'+(items.length>1?'s':'')+' today</div>'+
      items.map(function(it){return'<div class="wps-item" onclick="placeFromWeekly(\''+it.id+'\',\''+esc(it.title||it.name||'')+'\',\''+((it.category||it.cat)||'work')+'\',\''+((it.time)||'')+'\')">'+
        '<span>'+(CATS[it.category||it.cat]?CATS[it.category||it.cat].em:'✅')+'</span><span style="flex:1;font-weight:600">'+esc(it.title||it.name||'')+'</span>'+
        (it.time?'<span style="font-size:9px;color:var(--muted)">'+it.time+'</span>':'')+
        '<span class="wps-badge">+ Place</span></div>';}).join('')+'</div>';
  }catch(e){strip.style.display='none';}
}
function placeFromWeekly(id,name,cat,time){
  var now=new Date();var h=time?parseInt(time.split(':')[0]):now.getHours();var m=time?Math.round(parseInt((time.split(':')[1])||'0')/5)*5:0;
  openPlaceModal(h,m,{id:'wi-'+id,em:(CATS[cat]?CATS[cat].em:'✅'),name:name,dur:60,cat:cat in CATS?cat:'work'});
}

function quickAddTask(){
  var nameEl=document.getElementById('quick-task-name');var name=nameEl?nameEl.value.trim():'';if(!name){hqShowToast('⚠️ Enter a name');return;}
  var catEl=document.getElementById('quick-task-cat');var durEl=document.getElementById('quick-task-dur');
  var cat=catEl?catEl.value:'work';var dur=parseInt(durEl?durEl.value:30)||30;
  if(!Array.isArray(DBP.customTasks))DBP.customTasks=[];
  DBP.customTasks.push({id:uid(),em:(CATS[cat]?CATS[cat].em:'✅'),name:name,dur:dur,cat:cat});dbPersist();
  if(nameEl)nameEl.value='';if(durEl)durEl.value='';
  renderSidebar();hqShowToast('✅ "'+name+'" added');
}
function saveCustomTask(){
  var nameEl=document.getElementById('tm-name');var name=nameEl?nameEl.value.trim():'';if(!name)return;
  var catEl=document.getElementById('tm-cat');var durEl=document.getElementById('tm-dur');var emEl=document.getElementById('tm-em');var rtEl=document.getElementById('tm-routine');
  var cat=catEl?catEl.value:'work';var dur=parseInt(durEl?durEl.value:30)||30;var em=(emEl?emEl.value.trim():'')||(CATS[cat]?CATS[cat].em:'✅');var isR=rtEl?rtEl.checked:false;
  var t={id:uid(),em:em,name:name,dur:dur,cat:cat};
  if(isR)DBP.routineTasks.push(t);else{if(!Array.isArray(DBP.customTasks))DBP.customTasks=[];DBP.customTasks.push(t);}
  dbPersist();closeModal('task-modal');renderSidebar();hqShowToast('✅ "'+name+'" added'+(isR?' to My Routine':''));
}
function rmPreset(id,src){
  if(src==='routine')DBP.routineTasks=DBP.routineTasks.filter(function(t){return t.id!==id;});
  else if(Array.isArray(DBP.customTasks))DBP.customTasks=DBP.customTasks.filter(function(t){return t.id!==id;});
  dbPersist();renderSidebar();
}
async function clearCustomTasks(){
  if(!(await HQConfirm.ask('Remove all non-locked tasks from today?', {danger:true})))return;
  var dd=getDD(currentDate);
  Object.keys(dd.slots||{}).forEach(function(tk){dd.slots[tk]=(dd.slots[tk]||[]).filter(function(t){return t.locked;});if(!dd.slots[tk].length)delete dd.slots[tk];});
  dbPersist();renderGrid();updateStats();hqShowToast('↺ Custom tasks cleared');
}
async function clearAll(){if(!(await HQConfirm.ask('Clear ALL tasks from today?', {danger:true})))return;getDD(currentDate).slots={};dbPersist();renderGrid();updateStats();hqShowToast('↺ Day cleared');}

// Shared modal helpers
function openModal(id){var el=document.getElementById(id);if(el)el.classList.add('show');}
function closeModal(id){var el=document.getElementById(id||'friction-modal');if(el)el.classList.remove('show');}
const esc = s => HQUtils.esc(s); // → HQUtils.esc
function fmtDbt(s){return s?new Date(s).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'}):''}

// Day Templates
var DAY_TEMPLATES=[
  {id:'early-shift',emoji:'🌅',name:'Workday — Early Shift',desc:'8:00 AM – 4:30 PM · 75 min commute',color:'#645eb7',slots:[
    {time:'05:45',name:'Alarm / Wake Up',emoji:'⏰',dur:5,cat:'self'},{time:'05:50',name:'Medications',emoji:'💊',dur:5,cat:'health'},
    {time:'05:55',name:'Shower + Get Ready',emoji:'🚿',dur:30,cat:'self'},{time:'06:25',name:'Breakfast',emoji:'🍽️',dur:15,cat:'health'},
    {time:'06:40',name:'Bag Check / Prepwork',emoji:'🎒',dur:5,cat:'adulting'},{time:'06:45',name:'Commute Out',emoji:'🚌',dur:75,cat:'transit'},
    {time:'08:00',name:'Work',emoji:'💼',dur:510,cat:'work'},{time:'16:30',name:'Commute Home',emoji:'🚌',dur:75,cat:'transit'},
    {time:'17:45',name:'Feed Cat (PM)',emoji:'🐱',dur:10,cat:'home'},{time:'17:55',name:'Dinner',emoji:'🍽️',dur:30,cat:'health'},
    {time:'18:25',name:'Decompress',emoji:'🛋️',dur:30,cat:'self'},{time:'18:55',name:'Prepwork for Tomorrow',emoji:'🎒',dur:15,cat:'adulting'},
  ]},
  {id:'late-shift',emoji:'🌆',name:'Workday — Late Shift',desc:'9:45 AM – 6:15 PM · 75 min commute',color:'#4ecdc4',slots:[
    {time:'07:30',name:'Alarm / Wake Up',emoji:'⏰',dur:5,cat:'self'},{time:'07:35',name:'Medications',emoji:'💊',dur:5,cat:'health'},
    {time:'07:40',name:'Shower + Get Ready',emoji:'🚿',dur:30,cat:'self'},{time:'08:10',name:'Breakfast',emoji:'🍽️',dur:15,cat:'health'},
    {time:'08:25',name:'Bag Check / Prepwork',emoji:'🎒',dur:5,cat:'adulting'},{time:'08:30',name:'Commute Out',emoji:'🚌',dur:75,cat:'transit'},
    {time:'09:45',name:'Work',emoji:'💼',dur:510,cat:'work'},{time:'18:15',name:'Commute Home',emoji:'🚌',dur:75,cat:'transit'},
    {time:'19:30',name:'Feed Cat (PM)',emoji:'🐱',dur:10,cat:'home'},{time:'19:40',name:'Dinner',emoji:'🍽️',dur:30,cat:'health'},
    {time:'20:10',name:'Decompress',emoji:'🛋️',dur:30,cat:'self'},{time:'20:40',name:'Prepwork for Tomorrow',emoji:'🎒',dur:15,cat:'adulting'},
  ]},
  {id:'wfh-focus',emoji:'💼',name:'WFH Focus Day',desc:'Deep work blocks + breaks',color:'#9d88ff',slots:[
    {time:'07:00',name:'Wake up + meds',emoji:'⏰',dur:15,cat:'self'},{time:'07:15',name:'Shower + get ready',emoji:'🚿',dur:25,cat:'self'},
    {time:'07:40',name:'Breakfast',emoji:'🍽️',dur:15,cat:'health'},{time:'08:00',name:'Short walk',emoji:'👟',dur:20,cat:'health'},
    {time:'08:30',name:'Deep Work Block 1',emoji:'🧠',dur:90,cat:'work'},{time:'10:00',name:'Break + water',emoji:'💧',dur:15,cat:'self'},
    {time:'10:15',name:'Deep Work Block 2',emoji:'🧠',dur:90,cat:'work'},{time:'11:45',name:'Lunch + rest',emoji:'🍽️',dur:45,cat:'health'},
    {time:'12:30',name:'Admin + emails',emoji:'📧',dur:60,cat:'work'},{time:'13:30',name:'Deep Work Block 3',emoji:'🧠',dur:90,cat:'work'},
    {time:'15:00',name:'Movement break',emoji:'🚶',dur:20,cat:'health'},{time:'15:20',name:'Wrap up + review',emoji:'✅',dur:40,cat:'work'},
  ]},
  {id:'low-capacity',emoji:'🛡',name:'Low-Capacity Day',desc:'Floor tasks only. Rest is the work.',color:'#ff876c',slots:[
    {time:'09:00',name:'Meds',emoji:'💊',dur:5,cat:'health'},{time:'09:05',name:'Eat something',emoji:'🍽️',dur:20,cat:'health'},
    {time:'09:25',name:'Water + sit outside',emoji:'☀️',dur:15,cat:'self'},{time:'10:00',name:'One small task only',emoji:'✅',dur:30,cat:'adulting'},
    {time:'10:30',name:'Rest — no guilt',emoji:'🛋️',dur:90,cat:'self'},{time:'12:00',name:'Eat again',emoji:'🍽️',dur:20,cat:'health'},
    {time:'12:20',name:'Cat care',emoji:'🐱',dur:10,cat:'home'},{time:'15:00',name:'Gentle movement',emoji:'🚶',dur:20,cat:'health'},
    {time:'18:00',name:'Easy dinner',emoji:'🍜',dur:30,cat:'health'},
  ]},
  {id:'social-recovery',emoji:'🔋',name:'Social Recovery Day',desc:'After draining social events',color:'#ef5886',slots:[
    {time:'09:00',name:'Meds',emoji:'💊',dur:5,cat:'health'},{time:'09:05',name:'Quiet breakfast',emoji:'☕',dur:25,cat:'health'},
    {time:'09:30',name:'Solo time — no inputs',emoji:'🔇',dur:60,cat:'self'},{time:'10:30',name:'Short walk',emoji:'🚶',dur:20,cat:'health'},
    {time:'11:00',name:'Low-effort enjoyable task',emoji:'✨',dur:45,cat:'self'},{time:'11:45',name:'Lunch',emoji:'🍽️',dur:30,cat:'health'},
    {time:'12:15',name:'Nap or rest',emoji:'😴',dur:60,cat:'self'},{time:'18:00',name:'Easy dinner',emoji:'🍜',dur:30,cat:'health'},
  ]},
];

function renderTemplateList(){
  var el=document.getElementById('template-list');if(!el)return;
  el.innerHTML=DAY_TEMPLATES.map(function(t){
    return'<div class="tmpl-card" onclick="applyDayTemplate(\''+t.id+'\')" onmouseover="this.style.borderColor=\''+t.color+'\'" onmouseout="this.style.borderColor=\'var(--border)\'">'+
      '<span style="font-size:16px">'+t.emoji+'</span>'+
      '<div style="flex:1;min-width:0"><div class="tmpl-name">'+t.name+'</div><div class="tmpl-desc">'+t.desc+'</div></div>'+
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
  dbPersist();renderGrid();updateStats();hqShowToast('📋 '+tmpl.name+' applied!');setTimeout(scrollToNow,80);
}

// ── SURVIVAL MODE ADAPTATION ─────────────────────────────────────────────────
// In survival mode: show a gentle banner on both tabs and simplify the
// day-builder view by hiding the template panel and preset sidebar.
// CSS can also target [data-hq-env="survival"] for passive visual adaptation.
function renderDvSurvivalBanner() {
  var inSurvival = window.HQEnvironment && HQEnvironment.isSurvival();
  var existing = document.getElementById('dv-survival-banner');
  if (inSurvival && !existing) {
    var banner = document.createElement('div');
    banner.id = 'dv-survival-banner';
    banner.style.cssText = 'margin:0 0 10px;padding:10px 14px;background:var(--surface2,#1e2230);border:1px solid var(--amber,#f59e0b);border-radius:10px;display:flex;align-items:center;gap:10px;font-size:12px';
    banner.innerHTML = '<span style="font-size:16px">🛟</span><div style="flex:1"><strong style="color:var(--amber,#f59e0b)">Survival Mode</strong> — <span style="color:var(--muted)">Focus on today\'s essentials. Rest is the work.</span></div>';
    var anchor = document.querySelector('.page-content') || document.querySelector('.dv-wrap') || document.body;
    anchor.insertAdjacentElement('afterbegin', banner);
  } else if (!inSurvival && existing) {
    existing.remove();
  }
  // Hide template panel and preset sidebar in survival mode — reduce visual noise
  var planPanel      = document.getElementById('dv-plan-panel');
  var templateSection = document.getElementById('sc-templates');
  var taskPresets    = document.getElementById('task-presets');
  if (planPanel)       planPanel.style.display       = inSurvival ? 'none' : '';
  if (templateSection) templateSection.style.display = inSurvival ? 'none' : '';
  if (taskPresets)     taskPresets.style.display     = inSurvival ? 'none' : '';
  // Toggle root class so CSS selectors can respond
  document.documentElement.classList.toggle('hq-survival', !!inSurvival);
}

// ══════════════════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════════════════
(function dvInit() {
  var tab = getDayViewTab();
  switchDayViewTab(tab);
  renderTemplateList();
  renderDvSurvivalBanner();
})();

// Subscribe to environment mode changes — re-apply survival state live
window.addEventListener('hq-environment-changed', function() {
  renderDvSurvivalBanner();
});
