// ─── MIGRATIONS ───────────────────────────────────────────────────────────────
(function migrateLS(){
  [['hq-theme',HQKeys.THEME],['hq_theme',HQKeys.THEME]].forEach(([o,n])=>{
    const d=HQSafe.store.get(o);
    if(d&&!HQSafe.store.get(n))HQSafe.store.set(n,d);
    HQSafe.store.remove(o);
  });
})();

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function ld(key,def){return HQSafe.store.get(key, def !== undefined ? def : null);}
function typeEmoji(t){return{pastdue:'🔴',expiring:'🟠',missed:'🟡',urgent:'⚠️',reminder:'📌',health:'💊','spending-spike':'💸'}[t]||'•';}

// ─── AFFIRMATIONS ─────────────────────────────────────────────────────────────
const AFFIRMATIONS = [
  "Today is hard. That's allowed. You just have to do enough — not everything.",
  "Your brain works differently. That's not a flaw. That's the whole deal.",
  "Showing up at the floor level is still showing up. It always counts.",
  "Rest isn't giving up. It's how you stay in the game long-term.",
  "You don't have to be okay today. You just have to get through today.",
  "One thing at a time is not a fallback. It's the actual strategy.",
  "Hard days still count. You're still moving, even when it doesn't feel like it.",
  "You've gotten through every hard day so far. That's a 100% track record.",
  "Your capacity isn't fixed. It changes. Today's number is today's number.",
  "The to-do list will still exist tomorrow. Right now, just this.",
  "Some days the win is surviving them. That is a legitimate, real win.",
  "Being difficult to understand doesn't mean you're difficult to love.",
  "You're not behind. You're on a different timeline, doing it your way.",
  "Unfinished doesn't mean failed. Most good things take longer than expected.",
  "Needing more time, more help, or more rest isn't weakness. It's information.",
  "You built something today. Even if it was just getting out of bed.",
  "Brains like yours see things others miss. That has real value.",
  "The goal isn't to fix your brain. It's to build systems that work with it.",
  "Inconsistency isn't failure. It's the texture of a life with AuDHD.",
  "You are not your worst day. Not even close.",
];


// ─── EMOTIONAL LOAD SCORE ─────────────────────────────────────────────────
function renderEmoLoad(){
  const el = document.getElementById('vibe-emo-load');
  if(!el) return;
  try {
    const data = ld(HQKeys.EMOTIONAL_LOAD, null);
    if(!data || data.count === undefined){ el.style.display='none'; return; }
    const lvl = data.level || (data.count >= 10 ? 'high' : data.count >= 5 ? 'medium' : 'low');
    const colors = { low:'energy-high', medium:'energy-medium', high:'energy-low' };
    el.className = 'vibe-pill ' + (colors[lvl] || 'energy-unknown');
    el.textContent = '🧠 ' + data.count + ' ' + (lvl === 'high' ? 'high' : lvl === 'medium' ? 'med' : 'low') + ' load';
    el.style.display = '';
  } catch(e){ el.style.display='none'; }
}

// ─── MONTHLY WIN COUNT ────────────────────────────────────────────────────
function renderWinCount(){
  const el = document.getElementById('vibe-wins');
  if(!el) return;
  try {
    const wins    = ld(HQKeys.WINS, []);
    const entries = ld(HQKeys.BRAINDUMP, []);
    const thisMonth = new Date().toISOString().slice(0,7);
    const mn = new Date().toLocaleDateString('en-US',{month:'short'});
    // Count wins from wins log + brain-dump entries routed to 'win'
    const winsThisMonth = wins.filter(w => (w.at||w.date||'').startsWith(thisMonth)).length;
    const dumpWins = entries.filter(e => e.route==='win' && (e.date||'').startsWith(thisMonth)).length;
    const total = winsThisMonth + dumpWins;
    if(!total){ el.style.display='none'; return; }
    el.className = 'vibe-pill energy-high';
    el.textContent = '🏆 ' + total + ' win' + (total !== 1 ? 's' : '') + ' in ' + mn;
    el.style.display = '';
  } catch(e){ el.style.display='none'; }
}


function renderMetricsStrip(){
  const el = document.getElementById('metrics-strip');
  if(!el) return;
  try {
    const m   = typeof hqGetMetrics==='function' ? hqGetMetrics() : ld(HQKeys.METRICS,{snapshots:{}});
    const keys= Object.keys(m.snapshots||{}).sort();
    if(!keys.length){ el.style.display='none'; return; }
    const snap = m.snapshots[keys[keys.length-1]] || {};
    const calc = snap.calc || {};
    el.style.display = 'flex';
    const wk = keys[keys.length-1].replace('-W','·W');
    document.getElementById('mts-week').textContent = '📊 ' + wk;
    const goodStreak = typeof hqGetCurrentStreak==='function' ? hqGetCurrentStreak('goodDay') : 0;
    if(goodStreak>0) document.getElementById('mts-streak').textContent = '😊 ' + goodStreak + '-week good day streak';
    if(calc.taskCompletion!=null) document.getElementById('mts-tasks').textContent = '✅ ' + Math.round(calc.taskCompletion*100) + '% tasks';
    if(calc.walkingWeekMiles!=null) document.getElementById('mts-walk').textContent = '🚶 ' + calc.walkingWeekMiles + 'mi';
  } catch(e){ el.style.display='none'; }
}

// ─── P10: IDEA STUDIO QUOTE → GREETING ───────────────────────────────────────
// Picks a quote from audhd-hq-idea-studio.quotes[] by time-of-day bucket.
// Falls back to the static AFFIRMATIONS array when no quotes are saved.
function renderAffirmation(){
  const el=document.getElementById('hero-affirmation');
  if(!el)return;
  try{
    const studio=ld(HQKeys.IDEA_STUDIO,null);
    const quotes=(studio&&studio.quotes)||[];
    if(quotes.length){
      const h=new Date().getHours();
      // Soft time-of-day buckets: morning 5–11, afternoon 12–17, evening 18–4
      let bucket;
      if(h>=5&&h<12)       bucket='morning';
      else if(h>=12&&h<18) bucket='afternoon';
      else                 bucket='evening';
      // Use day-seed so it's stable within a day but cycles through quotes
      const seed=Math.floor(Date.now()/86400000);
      // Prefer a quote whose `at` timestamp matches the bucket by hour, else any
      const bucketHours={morning:[5,6,7,8,9,10,11],afternoon:[12,13,14,15,16,17],evening:[18,19,20,21,22,23,0,1,2,3,4]};
      const bucketQ=quotes.filter(q=>{
        const qh=q.at?new Date(q.at).getHours():null;
        return qh!==null&&bucketHours[bucket].includes(qh);
      });
      const pool=bucketQ.length?bucketQ:quotes;
      const q=pool[seed%pool.length];
      el.innerHTML=`<span style="font-style:italic;opacity:.92">"${_esc(q.text)}"</span>${q.attr?`<span style="display:block;font-size:10px;font-weight:700;color:var(--purple);margin-top:4px;opacity:.8">— ${_esc(q.attr)}</span>`:''}`;
      el.dataset.source='idea-studio';
      el.style.display='block';
      return;
    }
  }catch(e){}
  // Fallback: static affirmation
  const idx=Math.floor(Date.now()/86400000)%AFFIRMATIONS.length;
  el.textContent=AFFIRMATIONS[idx];
  el.dataset.source='affirmation';
  el.style.display='block';
}

// ─── ROUTINES STRIP ───────────────────────────────────────────────────────────
// NOTE: routines-strip-wrap removed from HTML. Function preserved for data
// compatibility but will silently no-op if element is absent.
function renderRoutinesStrip(){
  const el=document.getElementById('routines-strip-inner');
  if(!el)return;
  try{
    const rData=ld(HQKeys.ROUTINES,null);
    const pData=ld(HQKeys.PREPWORK,null);
    if(!rData&&!pData){el.closest('.routines-strip-wrap').style.display='none';return;}

    const sections=[];

    if(rData&&rData.items){
      const keys=Object.keys(rData.items);
      keys.forEach(key=>{
        const items=rData.items[key]||[];
        if(!items.length)return;
        const done=items.filter(it=>rData.steps&&rData.steps[it.id]).length;
        const total=items.length;
        const pct=total?Math.round(done/total*100):0;
        const label={morning:'🌅 Morning',evening:'🌙 Evening',anytime:'⚡ Anytime'}[key]||(key.charAt(0).toUpperCase()+key.slice(1));
        sections.push({label,done,total,pct});
      });
    }

    if(pData&&pData.items){
      const allPrep=Object.values(pData.items).flat();
      if(allPrep.length){
        const done=allPrep.filter(i=>i.done).length;
        const total=allPrep.length;
        sections.push({label:'🌙 Prepwork',done,total,pct:total?Math.round(done/total*100):0});
      }
    }

    if(!sections.length){el.closest('.routines-strip-wrap').style.display='none';return;}

    const allDone=sections.every(s=>s.done===s.total&&s.total>0);
    el.closest('.routines-strip-wrap').style.display='';

    el.innerHTML=sections.map(s=>{
      const cls=s.pct===100?'rs-seg done':s.pct>0?'rs-seg partial':'rs-seg';
      return`<div class="${cls}">
        <div class="rs-label">${s.label}</div>
        <div class="rs-bar-track"><div class="rs-bar-fill" style="width:${s.pct}%"></div></div>
        <div class="rs-count">${s.done}/${s.total}</div>
      </div>`;
    }).join('')+(allDone?'<div class="rs-allclear">✅ All done!</div>':'');
  }catch(e){
    const wrap=document.getElementById('routines-strip-inner');
    if(wrap)wrap.closest('.routines-strip-wrap').style.display='none';
  }
}

// ─── VIBE STRIP: ENERGY STATE ─────────────────────────────────────────────────
function renderVibeStrip(){
  const strip=document.getElementById('vibe-strip');
  const energyEl=document.getElementById('vibe-energy');
  const loadEl=document.getElementById('vibe-load');
  if(!strip||!energyEl||!loadEl)return;

  // Energy state
  const es=ld(HQKeys.ENERGY_STATE,null);
  const stale=es&&es.ts&&(Date.now()-es.ts>12*60*60*1000);
  if(es&&es.level&&!stale){
    const map={
      low:{cls:'energy-low',ico:'🔴',txt:'Low energy'},
      medium:{cls:'energy-medium',ico:'🟡',txt:'Medium energy'},
      high:{cls:'energy-high',ico:'🟢',txt:'High energy'},
    };
    const cfg=map[es.level]||{cls:'energy-unknown',ico:'⚡',txt:es.level};
    energyEl.className='vibe-pill '+cfg.cls;
    energyEl.textContent=cfg.ico+' '+cfg.txt;
  }else{
    energyEl.className='vibe-pill energy-unknown';
    energyEl.textContent='⚡ No check-in yet';
  }

  // Cognitive load: avg of last 3 check-ins (mood + energy combined)
  const checkins=ld(HQKeys.CHECKIN_LOG,[]);
  const recent=checkins.slice(0,3).filter(c=>c.mood||c.energy);
  if(recent.length){
    const avg=recent.reduce((a,c)=>a+(((c.mood||0)+(c.energy||0))/2),0)/recent.length;
    let loadCls,loadTxt,dotBg;
    if(avg>=3.5){loadCls='load-low';loadTxt='Low load';dotBg='#6ee7b7';}
    else if(avg>=2.5){loadCls='load-med';loadTxt='Med load';dotBg='#fbbf24';}
    else{loadCls='load-high';loadTxt='High load';dotBg='#f87171';}
    loadEl.className='vibe-pill '+loadCls;
    loadEl.innerHTML=`<span class="load-dot" style="background:${dotBg}"></span>${loadTxt}`;
  }else{
    loadEl.style.display='none';
  }
  strip.style.display='flex';
}

// ─── DAILY CAPACITY BAR ───────────────────────────────────────────────────────
function renderCapacityBar(){
  // Capacity bar disabled per user preference (Phase 1)
  return;
  // Original code preserved below for re-enable:
  const wrap=document.getElementById('capacity-wrap');
  const fill=document.getElementById('capacity-fill');
  const lbl=document.getElementById('capacity-label-right');
  if(!wrap||!fill||!lbl)return;

  const checkins=ld(HQKeys.CHECKIN_LOG,[]);
  const today=new Date().toISOString().split('T')[0];
  const todayMorning=checkins.find(c=>(c.date||c.at?.split('T')[0])===today&&c.timeSlot==='morning');

  let score=null;
  // Sleep quality from morning check-in or health log
  let sleepQ=todayMorning?.sleepQ||0;
  if(!sleepQ){
    const health=ld(HQKeys.HEALTH,{});
    const lastSleep=(health.sleep||[]).find(s=>s.date===today);
    sleepQ=parseFloat(lastSleep?.quality)||0;
  }
  // Morning energy
  const morningE=todayMorning?.energy||0;

  if(sleepQ||morningE){
    const parts=[];
    if(sleepQ)parts.push(sleepQ/5);
    if(morningE)parts.push(morningE/5);
    const pct=Math.round((parts.reduce((a,b)=>a+b,0)/parts.length)*100);
    score=pct;
    fill.style.width=pct+'%';
    let cls,capTxt;
    if(pct>=65){cls='cap-green';capTxt='Full capacity';}
    else if(pct>=40){cls='cap-amber';capTxt='Reduced capacity';}
    else{cls='cap-red';capTxt='Floor day';}
    fill.className='capacity-fill '+cls;
    lbl.textContent=capTxt+' ('+pct+'%)';
    wrap.style.display='block';
  }
}

// ─── DUMP BADGE ───────────────────────────────────────────────────────────────
function renderDumpBadge(){
  const badge=document.getElementById('dump-badge');
  if(!badge)return;
  const entries=ld(HQKeys.BRAINDUMP,[]);
  const unsorted=entries.filter(e=>e.route==='save').length;
  if(unsorted>0){
    badge.textContent=unsorted>99?'99+':unsorted;
    badge.style.display='block';
  }else{
    badge.style.display='none';
  }
}

// ─── DISMISS HELPERS ──────────────────────────────────────────────────────────
const DISMISSED_KEY = HQKeys.DISMISSED_PRIORITY;
const DISMISS_TTL   = 24 * 60 * 60 * 1000; // auto-expire after 24h

function getDismissed() {
  try {
    const d = HQSafe.store.get(DISMISSED_KEY, null);
    if (!d) return {};
    // Prune expired entries
    const now = Date.now();
    let changed = false;
    Object.keys(d).forEach(k => { if (now - d[k].at > DISMISS_TTL) { delete d[k]; changed = true; } });
    if (changed) HQSafe.store.set(DISMISSED_KEY, d);
    return d;
  } catch(e) { return {}; }
}

function dismissPriority(key, e) {
  if (e) { e.preventDefault(); e.stopPropagation(); }
  try {
    const d = getDismissed();
    d[key] = { at: Date.now() };
    HQSafe.store.set(DISMISSED_KEY, d);
    renderAlerts();
  } catch(e) {}
}

function clearDismissedPriority() {
  HQSafe.store.remove(DISMISSED_KEY);
  renderAlerts();
}

function dismissFlag(id, e) {
  if (e) { e.preventDefault(); e.stopPropagation(); }
  if (typeof hqUnflag === 'function') hqUnflag(id);
  // hqUnflag dispatches hq-flags-updated which triggers re-render
}

async function dismissAllFlags(e) {
  if (e) { e.preventDefault(); e.stopPropagation(); }
  const flags = typeof hqGetFlags === 'function' ? hqGetFlags() : [];
  if (!flags.length) return;
  if(!(await HQConfirm.ask(`Dismiss all ${flags.length} alert${flags.length !== 1 ? 's' : ''}?`, {danger:true})))return;
  flags.forEach(f => { if (typeof hqUnflag === 'function') hqUnflag(f.id); });
}

// Shared dismiss button HTML — inline styled for tap target, no CSS dependency
function dismissBtn(onclickStr, label) {
  return `<button
    onclick="${onclickStr}"
    title="Dismiss ${label || ''}"
    style="background:none;border:none;cursor:pointer;padding:4px 6px;color:var(--muted);font-size:13px;line-height:1;border-radius:5px;flex-shrink:0;transition:color .15s"
    onmouseover="this.style.color='var(--red,#e24b4a)'"
    onmouseout="this.style.color='var(--muted)'"
    aria-label="Dismiss">✕</button>`;
}

// ─── ALERTS (unified urgency stream) ─────────────────────────────────────────
// Alerts = urgent. Contains: hq flags + priority stack (tasks, bills, appts).
// Upcoming = informational. See renderUpcomingEvents() below.
function renderAlerts(){
  const flags = typeof hqGetFlags === 'function' ? hqGetFlags() : [];
  const dismissed = getDismissed();
  const today = new Date().toISOString().split('T')[0];

  // Start with flags, mark source for dismiss routing
  const merged = flags.map(f => ({ ...f, _src: 'flag' }));

  // ── 1. Top urgent task from taskboard ──────────────────────────────────────
  try{
    const tb = ld(HQKeys.TASKBOARD_V3, null) || ld(HQKeys.TASKBOARD, null);
    if(tb){
      if(Array.isArray(tb.tasks)){
        tb.tasks.filter(t => !t.done).slice(0, 1).forEach(t => {
          const key = 'task-' + (t.id || t.title);
          if(!dismissed[key]) merged.push({
            id: key, type: 'urgent',
            text: t.title, href: 'taskboard.html',
            source: 'Task', _src: 'priority'
          });
        });
      }
      if(tb.notes){
        const urgentNote = (tb.notes.daily || []).find(n => n.category === 'urgent');
        if(urgentNote && urgentNote.items){
          urgentNote.items.filter(i => !i.checked && !i.deleted).slice(0, 1).forEach(i => {
            const key = 'urgent-' + (i.id || i.text);
            if(!dismissed[key]) merged.push({
              id: key, type: 'urgent',
              text: i.text, href: 'taskboard.html',
              source: 'Urgent', _src: 'priority'
            });
          });
        }
      }
    }
  }catch(e){}

  // ── 2. Next bill due in ≤7 days ────────────────────────────────────────────
  try{
    const fin = ld(HQKeys.FINANCE, {});
    const bills = (fin.bills || []).filter(b => {
      const due = b.dueDate || b.due;
      if(!due) return false;
      const ms = new Date(due).getTime() - Date.now();
      return ms >= -86400000 && ms <= 7 * 86400000;
    }).sort((a, b) => new Date(a.dueDate || a.due) - new Date(b.dueDate || b.due));
    if(bills.length){
      const b = bills[0];
      const key = 'bill-' + (b.id || b.name);
      if(!dismissed[key]){
        const daysLeft = Math.ceil((new Date(b.dueDate || b.due).getTime() - Date.now()) / 86400000);
        const when = daysLeft <= 0 ? 'Today' : daysLeft === 1 ? 'Tomorrow' : 'in ' + daysLeft + 'd';
        merged.push({
          id: key, type: 'expiring',
          text: (b.name || 'Bill') + ' — ' + when + (b.amount ? ' · $' + parseFloat(b.amount).toFixed(0) : ''),
          href: 'money-brain.html',
          source: 'Bill', _src: 'priority'
        });
      }
    }
  }catch(e){}

  // ── 3. First upcoming appointment today ────────────────────────────────────
  try{
    const mdb = ld('hq-monthly', null) || ld(HQKeys.MONTHLY, {});
    const mk = today.slice(0, 7);
    const monthData = mdb[mk];
    if(monthData){
      const todayAppt = (monthData.items || []).find(i =>
        i.type === 'appointment' && i.dayTarget === today && i.status !== 'done'
      );
      if(todayAppt){
        const key = 'appt-' + (todayAppt.id || todayAppt.title);
        if(!dismissed[key]) merged.push({
          id: key, type: 'reminder',
          text: todayAppt.title, href: 'monthly-planner.html',
          source: 'Appt', _src: 'priority'
        });
      }
    }
  }catch(e){}

  // ── Count type pills (flags only — they carry typed urgency) ───────────────
  const types = { pastdue: 0, expiring: 0, missed: 0, urgent: 0 };
  flags.forEach(f => { if(types[f.type] !== undefined) types[f.type]++; });
  const countsEl = document.getElementById('alerts-counts');
  if(countsEl){
    const pc = { pastdue:'acp-pastdue', expiring:'acp-expiring', missed:'acp-missed', urgent:'acp-urgent' };
    countsEl.innerHTML = Object.entries(types).filter(([,v]) => v > 0)
      .map(([k,v]) => `<span class="alert-count-pill ${pc[k]||''}">${typeEmoji(k)} ${v}</span>`).join('');
  }

  // ── Dismiss-all button in header (flags only) ──────────────────────────────
  const hdrEl = document.querySelector('.alerts-header');
  if(hdrEl){
    let dab = hdrEl.querySelector('.dismiss-all-btn');
    if(flags.length && !dab){
      dab = document.createElement('button');
      dab.className = 'dismiss-all-btn';
      dab.textContent = 'Dismiss all';
      dab.style.cssText = 'margin-left:auto;background:none;border:0.5px solid var(--border);cursor:pointer;font-size:10px;font-weight:700;color:var(--muted);padding:3px 8px;border-radius:5px;transition:all .15s';
      dab.onmouseover = () => { dab.style.color='var(--red,#e24b4a)'; dab.style.borderColor='var(--red,#e24b4a)'; };
      dab.onmouseout  = () => { dab.style.color='var(--muted)'; dab.style.borderColor='var(--border)'; };
      dab.onclick = (e) => dismissAllFlags(e);
      hdrEl.appendChild(dab);
    } else if(!flags.length && dab){
      dab.remove();
    }
  }

  // ── Render merged stream ───────────────────────────────────────────────────
  const scrollEl = document.getElementById('alerts-scroll');
  if(!scrollEl) return;

  if(!merged.length){
    scrollEl.innerHTML = '<div style="text-align:center;font-size:11px;color:var(--muted);padding:14px">✅ All clear!</div>';
    return;
  }

  // Show restore link if any priority items were dismissed
  const numDismissed = Object.keys(dismissed).length;
  const restoreLink = numDismissed
    ? `<div style="text-align:right;padding:4px 6px"><button onclick="clearDismissedPriority()" style="background:none;border:none;font-size:10px;color:var(--muted);cursor:pointer;padding:2px 4px">↩ Restore ${numDismissed} dismissed</button></div>`
    : '';

  scrollEl.innerHTML = merged.map(f => `
    <div class="alert-item ${f.type || ''}" style="display:flex;align-items:center;padding:0">
      <a href="${f.href || '#'}" style="display:flex;align-items:center;gap:7px;flex:1;text-decoration:none;color:inherit;padding:9px 6px 9px 10px;min-width:0;overflow:hidden">
        <span style="flex-shrink:0">${typeEmoji(f.type)}</span>
        <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${f.text}</span>
        <span class="alert-source" style="flex-shrink:0">${f.source || ''}</span>
      </a>
      ${f._src === 'flag'
        ? dismissBtn(`dismissFlag('${f.id}',event)`, '')
        : dismissBtn(`dismissPriority('${f.id}',event)`, '')}
    </div>`).join('') + restoreLink;
}

// ─── UPCOMING EVENTS (informational stream) ───────────────────────────────────
// Upcoming = informational. Contains: calendar events, appointments later
// today, tasks due later today. Targets #upcoming-scroll, reuses alert styles.
function renderUpcomingEvents(){
  const el = document.getElementById('upcoming-scroll');
  if(!el) return;

  const now   = Date.now();
  const soon  = 24 * 60 * 60 * 1000; // within the next 24h
  const today = new Date().toISOString().split('T')[0];
  const items = [];

  // ── Tasks due later today ──────────────────────────────────────────────────
  try{
    const tb = ld(HQKeys.TASKBOARD_V3, null) || ld(HQKeys.TASKBOARD, null) || {};
    (tb.tasks || []).filter(t => t.due && !t.done).forEach(t => {
      const ts = new Date(t.due).getTime();
      // Informational: in the future, within 24h
      if(ts > now && ts - now < soon){
        items.push({ label: '📋 ' + t.title, href: 'taskboard.html', ts });
      }
    });
  }catch(e){}

  // ── Health appointments coming up ──────────────────────────────────────────
  try{
    const h = ld(HQKeys.HEALTH, {});
    (h.appointments || []).filter(a => a.date && !a.done).forEach(a => {
      const ts = new Date(a.date).getTime();
      if(ts > now && ts - now < soon){
        items.push({ label: '🩺 ' + (a.title || 'Appointment'), href: 'health-tracker.html', ts });
      }
    });
  }catch(e){}

  // ── Monthly planner items (non-appointment, non-done) today ───────────────
  try{
    const mdb = ld('hq-monthly', null) || ld(HQKeys.MONTHLY, {});
    const mk  = today.slice(0, 7);
    const monthData = mdb[mk];
    if(monthData){
      (monthData.items || [])
        .filter(i => i.dayTarget === today && i.status !== 'done' && i.type !== 'appointment')
        .forEach(i => {
          const ts = i.time ? new Date(today + 'T' + i.time).getTime() : now + 1;
          items.push({ label: '📌 ' + i.title, href: 'monthly-planner.html', ts });
        });
    }
  }catch(e){}

  // ── Weekly planner events today ─────────────────────────────────────────────
  // BUG-02 FIX: was incorrectly reading HQKeys.WEEKLY_PLANNER (never written).
  // Now reads HQKeys.WEEKLY (the actual weekly planner store).
  // WDB schema: { [YYYY-Wnn]: { days: { [ISO]: [{id,title,status,time,...}] } } }
  try{
    const _wdb = ld(HQKeys.WEEKLY, null);
    if(_wdb){
      // Compute ISO week key matching weekly-planner.js logic
      const _d = new Date(); const _dn = _d.getDay() || 7;
      const _thu = new Date(_d); _thu.setDate(_d.getDate() + 4 - _dn);
      const _ys = new Date(_thu.getFullYear(), 0, 1);
      const _wn = String(Math.ceil(((_thu - _ys) / 86400000 + 1) / 7)).padStart(2,'0');
      const _wk = _thu.getFullYear() + '-W' + _wn;
      const _todayItems = (_wdb[_wk]?.days?.[today] || [])
        .filter(it => it.status !== 'done' && it.status !== 'deferred' && it.time);
      _todayItems.forEach(it => {
        const ts = new Date(today + 'T' + it.time).getTime();
        if(ts > now){
          items.push({ label: '📆 ' + it.title, href: 'weekly-planner.html', ts });
        }
      });
    }
  }catch(e){}

  items.sort((a, b) => a.ts - b.ts);

  if(!items.length){
    el.innerHTML = '<div class="empty-state">Nothing upcoming</div>';
    return;
  }

  el.innerHTML = items.slice(0, 5).map(it => `
    <div class="alert-item" style="display:flex;align-items:center;padding:0">
      <a href="${it.href}" style="display:flex;align-items:center;gap:7px;flex:1;text-decoration:none;color:inherit;padding:9px 6px 9px 10px;min-width:0;overflow:hidden">
        <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${it.label}</span>
        <span class="alert-source" style="flex-shrink:0">${it.ts > now
          ? new Date(it.ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
          : 'Soon'}</span>
      </a>
    </div>`).join('');
}

// ─── P5: SURFACE-CHECKIN items in unified alert zone ─────────────────────────
function renderCheckinSurfaced() {
  const wrap   = document.getElementById('alerts-checkin-wrap');
  const scroll = document.getElementById('alerts-checkin-scroll');
  const count  = document.getElementById('alerts-checkin-count');
  if (!wrap || !scroll) return;

  const items = typeof hqGetCheckinSurface === 'function' ? hqGetCheckinSurface() : [];
  if (!items.length) { wrap.style.display = 'none'; return; }

  wrap.style.display = '';
  if (count) count.textContent = `${items.length} item${items.length !== 1 ? 's' : ''}`;

  scroll.innerHTML = items.map(f => `
    <div class="alert-item checkin-surface" style="display:flex;align-items:center;padding:0">
      <a href="${f.href || 'checkin.html'}" style="display:flex;align-items:center;gap:7px;flex:1;text-decoration:none;color:inherit;padding:9px 6px 9px 10px;min-width:0;overflow:hidden">
        <span style="flex-shrink:0">✅</span>
        <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${f.text}</span>
        <span class="alert-source" style="flex-shrink:0">${f.source || ''}</span>
      </a>
      ${dismissBtn(`dismissCheckinSurface('${f.id}',event)`, '')}\n    </div>`).join('');
}

function dismissCheckinSurface(id, e) {
  if (e) { e.preventDefault(); e.stopPropagation(); }
  if (typeof hqDismissCheckinSurface === 'function') hqDismissCheckinSurface(id);
}

// ─── P5: AUTO-DEFER SWEEP ────────────────────────────────────────────────────
// Runs once per day on index load. Items in the auto-defer queue whose
// appliedAt date is before today get written into a pending list that source
// modules read on next open to bump their item dates forward.
function runAutoDeferSweep() {
  if (typeof HQSafe.store.get !== 'function' || typeof HQSafe.store.set !== 'function') return;
  const today = new Date().toISOString().slice(0, 10);
  if (HQSafe.store.get(HQKeys.AUTO_DEFER_LAST) === today) return;

  const queue = HQSafe.store.get(HQKeys.AUTO_DEFER_QUEUE, []);
  if (!queue.length) {
    HQSafe.store.set(HQKeys.AUTO_DEFER_LAST, today);
    return;
  }

  const pending = HQSafe.store.get(HQKeys.AUTO_DEFER_PENDING, []);
  let changed = false;

  queue.forEach(q => {
    const appliedDate = new Date(q.appliedAt).toISOString().slice(0, 10);
    if (appliedDate < today && !pending.find(p => p.id === q.id)) {
      pending.push({
        id: q.id,
        source: q.source,
        text: q.text,
        href: q.href,
        deferDays: q.deferDays || 1,
        queuedAt: Date.now()
      });
      changed = true;
    }
  });

  if (changed) {
    HQSafe.store.set(HQKeys.AUTO_DEFER_PENDING, pending);
    window.dispatchEvent(new CustomEvent('hq-auto-defer-pending'));
  }
  HQSafe.store.set(HQKeys.AUTO_DEFER_LAST, today);
}

// ─── REMINDER BANNER ──────────────────────────────────────────────────────────
function updateReminderBanner(){
  const banner=document.getElementById('reminder-banner');
  if(!banner)return;
  const h=new Date().getHours();
  const windows=[
    {start:6,end:9,label:'🔔 Morning Check-In Window',href:'checkin.html'},
    {start:12,end:15,label:'🔔 Midday Check-In Window',href:'checkin.html'},
    {start:18,end:21,label:'🔔 Evening Check-In Window',href:'checkin.html'},
    {start:19,end:23,label:'🚶 Log today\'s walk',href:'walking-tracker.html'},
  ];
  const win=windows.find(w=>h>=w.start&&h<w.end);
  if(!win){banner.classList.add('hidden');return;}
  banner.classList.remove('hidden');banner.href=win.href;banner.textContent=win.label+' — tap here';
}

// ─── WALKING STRIP ────────────────────────────────────────────────────────────
function renderWalkingStrip(){
  try{
    const data=ld(HQKeys.WALKING,null);if(!data)return;
    const sessions=data.entries||data.sessions||[];
    const yearStr=new Date().getFullYear().toString();
    const total=sessions.filter(s=>s.date&&s.date.startsWith(yearStr)).reduce((a,s)=>a+(parseFloat(s.miles)||0),0);
    const profile=ld(HQKeys.PROFILE,{});
    const goal=parseFloat(profile.walkingGoal||3100);
    const pct=Math.min(100,(total/goal*100)).toFixed(1);
    const daysLeft=Math.max(1,Math.ceil((new Date(`${new Date().getFullYear()}-12-31T23:59:59`)-new Date())/86400000));
    const needed=total>=goal?'🎉 Goal reached!':((goal-total)/daysLeft).toFixed(1)+' mi/day needed';
    document.getElementById('walk-miles').textContent=total.toFixed(1)+' mi';
    document.getElementById('walk-pct').textContent=pct+'%';
    document.getElementById('walk-goal').textContent=goal.toLocaleString();
    document.getElementById('walk-bar').style.width=pct+'%';
    document.getElementById('walk-needed').textContent=needed;
  }catch(e){}
}

// ─── SHOW ALL TOGGLE ──────────────────────────────────────────────────────────
let _showAll=false;
function toggleShowAll(){
  _showAll=!_showAll;
  document.body.classList.toggle('show-all-cards',_showAll);
  const btn=document.getElementById('show-all-btn');
  if(btn)btn.textContent=_showAll?'🔼 Hide linked tools':'🔽 Show all tools';
}

// ─── INDEX LAYOUT RENDERER ────────────────────────────────────────────────────
// Reads audhd-hq-index-layout and dynamically populates hero tools + quick tiles.
// Falls back to hardcoded defaults if nothing is saved.
const _MODULE_MAP = {
  'timeline':           {href:'day-view.html',            emoji:'📅', label:'Timeline',           sub:'Today\'s plan'},
  'day-builder':        {href:'day-view.html#plan',        emoji:'🗓', label:'DayBuilder',          sub:'Block planner'},
  'money-brain':        {href:'money-brain.html',          emoji:'💰', label:'Money Brain',         sub:'Budget & bills'},
  'kitchen-brain':      {href:'kitchen-brain.html',        emoji:'🍳', label:'Kitchen Brain',       sub:'Meals & fridge'},
  'global-tracker':     {href:'global-tracker.html',       emoji:'🌍', label:'Global Data',         sub:'All-module stats'},
  'thought-jar':        {href:'brain-dump.html',           emoji:'🫙', label:'Thought Jar',         sub:'Capture anything'},
  'checkin':            {href:'checkin.html',              emoji:'✅', label:'Check-In',             sub:'Mood & energy'},
  'project-brain':      {href:'project-brain.html',        emoji:'🗂', label:'Project Brain',       sub:'Projects & tasks'},
  'taskboard':          {href:'taskboard.html',            emoji:'📋', label:'Taskboards',          sub:'Daily & weekly lanes'},
  'health-tracker':     {href:'health-tracker.html',       emoji:'🩺', label:'Health Tracker',      sub:'Symptoms & logs'},
  'walking-tracker':    {href:'walking-tracker.html',      emoji:'👟', label:'Walking Tracker',     sub:'Miles & goals'},
  'dream-journal':      {href:'dream-journal.html',        emoji:'💭', label:'Dream Journal',       sub:'Log & patterns'},
  'monthly-planner':    {href:'monthly-planner.html',      emoji:'🗓️', label:'Monthly Planner',     sub:'Goals & calendar'},
  'weekly-planner':     {href:'weekly-planner.html',       emoji:'📆', label:'Weekly Planner',      sub:'Week view & review'},
  'deep-clean':         {href:'deep-clean.html',           emoji:'🧹', label:'Deep Clean',          sub:'Room-by-room'},
  'firebird-protocol':  {href:'firebird-protocol.html',    emoji:'🔥', label:'Firebird Protocol',   sub:'Can\'t start fix'},
  'survival-mode':      {href:'survival-mode.html',        emoji:'🛟', label:'Survival Mode',       sub:'For hard days'},
  'routines-prepwork':  {href:'routines-prepwork.html',    emoji:'🔁', label:'Prepwork + Routines', sub:'Morning & night'},
};

const _LAYOUT_DEFAULTS_INDEX = {
  heroTools:  ['timeline','day-builder','money-brain','kitchen-brain'],
  hero2Tiles: ['global-tracker','thought-jar','checkin'],
};

function renderHeroLayout(){
  try{
    const layout = HQSafe.store.get(HQKeys.INDEX_LAYOUT, _LAYOUT_DEFAULTS_INDEX);

    // ── Layout migration: brain-dump renamed thought-jar in Phase 3 ──────────
    ['heroTools','hero2Tiles'].forEach(zone => {
      if((layout[zone] || []).includes('brain-dump')){
        layout[zone] = layout[zone].map(id => id === 'brain-dump' ? 'thought-jar' : id);
        HQSafe.store.set(HQKeys.INDEX_LAYOUT, layout);
      }
    });

    const heroIds = (layout.heroTools  || _LAYOUT_DEFAULTS_INDEX.heroTools ).slice(0, 5);
    const tileIds = (layout.hero2Tiles || _LAYOUT_DEFAULTS_INDEX.hero2Tiles).slice(0, 3);

    // ── Hero tool buttons ──────────────────────────────────────────────────
    const heroEl = document.querySelector('.hero-tools');
    if(heroEl && heroIds.length){
      heroEl.innerHTML = heroIds.map(id => {
        const m = _MODULE_MAP[id] || { href:'#', emoji:'📌', label:id, sub:'' };
        return `<a href="${m.href}" class="hero-tool-btn">
          <span class="hero-tool-ico">${m.emoji}</span>
          <span class="hero-tool-lbl">${m.label}</span>
          <span class="hero-tool-sub">${m.sub}</span>
        </a>`;
      }).join('');
    }

    // ── Quick access tiles (was hero2Tiles, now #qa-tiles / .h2-quick-tiles) ─
    const tilesEl = document.querySelector('.h2-quick-tiles');
    if(tilesEl && tileIds.length){
      tilesEl.innerHTML = tileIds.map(id => {
        const m = _MODULE_MAP[id] || { href:'#', emoji:'📌', label:id };
        // Preserve dump-tile badge for thought-jar
        const extra = id === 'thought-jar' ? ` id="dump-tile"` : '';
        const badge = id === 'thought-jar' ? `<span class="tile-badge" id="dump-badge"></span>` : '';
        return `<a href="${m.href}" class="h2-tile"${extra}>
          <span class="h2-tile-ico">${m.emoji}</span>
          <span class="h2-tile-lbl">${m.label}</span>${badge}
        </a>`;
      }).join('');
    }
  }catch(e){}
}

// FIX-06: HTML escape for user-authored content in innerHTML
// FIX-04/FIX-08: Clear intervals and abort listeners on page unload
window.addEventListener('pagehide', function() {
  if (window._idxBannerInterval) { clearInterval(window._idxBannerInterval); window._idxBannerInterval = null; }
  if (_idxAC) { _idxAC.abort(); }
}, {once: true});
// FIX-08
if (window.HQLifecycle) HQLifecycle.register(function() {
  if (window._idxBannerInterval) { clearInterval(window._idxBannerInterval); window._idxBannerInterval = null; }
  if (_idxAC) _idxAC.abort();
});

function _esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

// ── SURVIVAL MODE ADAPTATION ──────────────────────────────────────────────────
// Surfaces a banner + Survival Mode link when HQEnvironment.isSurvival() is true.
// Banner sits at the top of page content, above hero tools.
function renderIdxSurvivalBanner() {
  var existing = document.getElementById('idx-survival-banner');
  var inSurvival = window.HQEnvironment && HQEnvironment.isSurvival();
  if (inSurvival && !existing) {
    var banner = document.createElement('div');
    banner.id = 'idx-survival-banner';
    banner.style.cssText = 'margin:0 0 12px;padding:12px 14px;background:var(--surface2,#1e2230);border:1px solid var(--amber,#f59e0b);border-radius:10px;display:flex;align-items:center;gap:10px;font-size:13px';
    banner.innerHTML = '<span style="font-size:18px">🛟</span>'
      + '<div style="flex:1">'
      +   '<strong style="color:var(--amber,#f59e0b)">Survival Mode</strong>'
      +   '<span style="color:var(--muted);font-size:12px"> — floor tasks and essentials only</span>'
      + '</div>'
      + '<a href="survival-mode.html" style="flex-shrink:0;font-size:11px;font-weight:700;color:var(--amber,#f59e0b);text-decoration:none;padding:4px 10px;border:1px solid var(--amber,#f59e0b);border-radius:6px">Open \u2192</a>';
    var wrap = document.querySelector('.page-content') || document.querySelector('.hq-page') || document.body;
    wrap.insertAdjacentElement('afterbegin', banner);
  } else if (!inSurvival && existing) {
    existing.remove();
  }
  document.documentElement.classList.toggle('hq-survival', !!inSurvival);
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
// FIX-05: AbortController so all window listeners can be torn down if init re-runs
const _idxAC = new AbortController();
const _idxSig = { signal: _idxAC.signal };

document.addEventListener('DOMContentLoaded', () => {
  renderHeroLayout();
  renderDumpBadge();   // re-run after layout injects dump-tile
  renderVibeStrip();
  renderEmoLoad();
  renderWinCount();
  renderMetricsStrip();
  renderCapacityBar();
  renderDumpBadge();
  renderAlerts();
  renderUpcomingEvents();
  renderCheckinSurfaced();
  runAutoDeferSweep();
  renderWalkingStrip();
  updateReminderBanner();
  renderIdxSurvivalBanner();

  // ── Live updates ─────────────────────────────────────────────────────────
  window.addEventListener('hq-flags-updated', () => {
    renderAlerts();
    renderUpcomingEvents();
  }, _idxSig);
  window.addEventListener('hq-checkin-surface-updated', () => renderCheckinSurfaced(), _idxSig);
  window.addEventListener('hq-energy-updated', () => { renderVibeStrip(); renderCapacityBar(); }, _idxSig);
  window.addEventListener('hq-metrics-ready', () => renderMetricsStrip(), _idxSig);

  // P3: Re-render when config changes (layout, profile, display prefs updated from Customize)
  window.addEventListener('hq-config-updated', () => {
    renderHeroLayout();
    renderDumpBadge();
    renderAlerts();
    renderUpcomingEvents();
    renderMetricsStrip();
    renderCapacityBar();
    renderWalkingStrip();
  }, _idxSig);

  window.addEventListener('storage', e => {
    if(e.key === HQKeys.INDEX_LAYOUT)    { renderHeroLayout(); renderDumpBadge(); }
    if(e.key === HQKeys.FLAGS)           { renderAlerts(); renderUpcomingEvents(); }
    if(e.key === HQKeys.CHECKIN_SURFACE)   renderCheckinSurfaced();
    if(e.key === HQKeys.WALKING)           renderWalkingStrip();
    if(e.key === HQKeys.ENERGY_STATE)    { renderVibeStrip(); renderCapacityBar(); }
    if(e.key === HQKeys.BRAINDUMP)       { renderDumpBadge(); renderWinCount(); }
    if(e.key === HQKeys.EMOTIONAL_LOAD)    renderEmoLoad();
    if(e.key === HQKeys.METRICS)           renderMetricsStrip();
    if(e.key === HQKeys.WINS)              renderWinCount();
    if(e.key === HQKeys.CHECKIN_LOG)     { renderVibeStrip(); renderCapacityBar(); }
    if(e.key === HQKeys.TASKBOARD
    || e.key === HQKeys.TASKBOARD_V3)    { renderAlerts(); renderUpcomingEvents(); }
    if(e.key === HQKeys.FINANCE)         { renderAlerts(); }
    if(e.key === 'hq-monthly'
    || e.key === HQKeys.MONTHLY)         { renderAlerts(); renderUpcomingEvents(); }
    if(e.key === HQKeys.HEALTH)            renderUpcomingEvents();
    if(e.key === HQKeys.WEEKLY)             renderUpcomingEvents(); // BUG-02: was WEEKLY_PLANNER (never written); changed to WEEKLY
  });

  if(!window._idxBannerInterval){window._idxBannerInterval=setInterval(updateReminderBanner, 300000);}
});

// Environment mode change — update survival banner live
window.addEventListener('hq-environment-changed', function() {
  renderIdxSurvivalBanner();
});
