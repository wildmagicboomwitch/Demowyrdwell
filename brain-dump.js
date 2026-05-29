//  BRAIN DUMP — AuDHD HQ
//  Stores own log: audhd-hq-braindump
//  Routes to:
//    audhd-hq-daybuilder  (tier 1/2/3)
//    audhd-hq-weekly      (weekly inbox)
//    audhd-hq-monthly     (monthly inbox)
//    audhd-hq-wins        (wins log)
//    audhd-hq-health      (symptoms)
//    audhd-hq-finance     (finance notes)
// ============================================================

const STORE = HQKeys.BRAINDUMP;

let entries = [];
let logFilter = 'all';
let routedFilter = 'all';
let rerouteId = null;
let selectedType = 'thought';

// ====== TAG ENGINE BRIDGE — P2: replaced with direct HQStore calls ======
// TE() shim retained for call-site compatibility; delegates straight to HQStore.
// Remove this shim entirely once all call sites are updated to call HQStore directly.
function TE(){
  return{
    getCategories:()=>window.HQStore?HQStore.getCategoriesForModule('brain-dump'):[], // FIX-09: guarded
    getCatById:(id)=>window.HQStore?HQStore.getCategoryById(id):null,
    getSubcats:(catId)=>{const c=window.HQStore?HQStore.getCategoryById(catId):null;return c?(c.subcategories||[]):[];},
    getAllFlags:()=>window.HQStore?HQStore.getAllFlags():[],
  };
}

// ====== LOAD / PERSIST ======
function load(){
  entries=HQSafe.store.get(STORE,[]);
}
function persist(){
  HQSafe.store.set(STORE, entries);
  document.getElementById('hdr-total').textContent=entries.length;
  if(typeof calcEmotionalLoad==='function') calcEmotionalLoad();
}

const uid = () => HQUtils.uid(); // → HQUtils.uid
const todayStr = () => (window.HQDate ? HQDate.today() : new Date().toISOString().split('T')[0]); // aliased → HQDate.today

// Safely resolve a stored entry's date — never falls back to today
function safeDate(entry){
  if(entry.date) return entry.date;
  if(entry.at)   return entry.at.split('T')[0];
  return null;
}

// ====== POPULATE CAT SELECTS ======
function populateCats(){
  const te=TE();
  const opts='<option value="">— Category —</option>'+
    te.getCategories().map(c=>`<option value="${c.id}">${renderEmoji(c.emoji)} ${c.name}</option>`).join('');
  document.getElementById('dump-cat').innerHTML=opts;
  document.getElementById('rr-cat').innerHTML=opts;
}

function onCatChange(selectEl){
  const te=TE();
  const catId=selectEl.value;
  const subWrap=document.getElementById('dump-sub-wrap');
  const subSel=document.getElementById('dump-sub');
  if(!subWrap||!subSel)return;
  const subs=te.getSubcats(catId);
  if(subs&&subs.length){
    subSel.innerHTML='<option value="">— Subcategory —</option>'+
      subs.map(s=>`<option value="${s.id}">${renderEmoji(s.emoji)} ${s.name}</option>`).join('');
    subWrap.style.display='';
  } else {
    subSel.innerHTML='<option value="">— Subcategory —</option>';
    subWrap.style.display='none';
    subSel.value='';
  }
}

// ====== TYPE SELECTOR ======
function selType(btn){
  document.querySelectorAll('#dump-type-chips .tchip').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on');
  selectedType=btn.dataset.t;
}

// ====== KEYBOARD SHORTCUT ======
function handleKey(e){
  if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){
    e.preventDefault();
    dump('tier1');
  }
}

// ====== DUMP ======
const ROUTE_META = {
  tier1:   {label:'🔴 Tier 1',    color:'#B53030', dot:'#B53030'},
  tier2:   {label:'🟡 Tier 2',    color:'#C49A00', dot:'#C49A00'},
  tier3:   {label:'🟢 Tier 3',    color:'#2A7A4E', dot:'#2A7A4E'},
  weekly:  {label:'📆 Weekly',    color:'#2A8A85', dot:'#4ECDC4'},
  monthly: {label:'🗓️ Monthly',   color:'#645EB7', dot:'#9b6dff'},
  win:     {label:'🏆 Win',       color:'#645EB7', dot:'#C8BAFF'},
  health:  {label:'🏥 Health',    color:'#EF5886', dot:'#FF6BA8'},
  finance: {label:'💰 Finance',   color:'#C49A00', dot:'#F4CA00'},
  admin:   {label:'📋 Admin',     color:'#A8AAA9', dot:'#A8AAA9'},
  social:  {label:'👥 Social',    color:'#FF876C', dot:'#FF876C'},
  save:    {label:'💭 Saved',     color:'#789A88', dot:'#789A88'},
};

// H-03: Reveal route grid only after user starts typing
function bdRevealRoute(ta) {
  var dz = ta.closest('.dump-zone') || document.querySelector('.dump-zone');
  if (!dz) return;
  if (ta.value.trim().length > 0) {
    dz.classList.add('has-text');
  } else {
    dz.classList.remove('has-text');
  }
}


function dump(route){
  const text=document.getElementById('dump-ta').value.trim();
  if(!text){
    document.getElementById('dump-ta').focus();
    document.getElementById('dump-ta').style.borderColor='var(--red)';
    setTimeout(()=>document.getElementById('dump-ta').style.borderColor='',2000);
    return;
  }
  const cat=document.getElementById('dump-cat').value;
  const sub=document.getElementById('dump-sub')?.value||'';
  const te=TE();
  const catObj=cat?te.getCatById(cat):null;
  const subObj=sub&&catObj?(catObj.subcategories||[]).find(s=>s.id===sub):null;
  const entry={
    id:uid(), text, type:selectedType,
    category:cat||null,
    subcategory:sub||null,
    subcategoryName:subObj?subObj.name:null,
    subcategoryEmoji:subObj?subObj.emoji:null,
    route,
    date:todayStr(), at:new Date().toISOString(),
  };
  entries.unshift(entry);
  persist();

  if (route === 'tier1') bdFlagUrgent(entry);
  doRoute(entry);

  document.getElementById('dump-ta').value='';
  // Reset subcategory selector
  const subSel=document.getElementById('dump-sub');
  const subWrap=document.getElementById('dump-sub-wrap');
  if(subSel)subSel.value='';
  if(subWrap)subWrap.style.display='none';

  const ta=document.getElementById('dump-ta');
  ta.classList.add('success');
  setTimeout(()=>ta.classList.remove('success'),600);

  const rm=ROUTE_META[route]||ROUTE_META.save;
  showToast(`${rm.label} — routed!`);
  renderStats();
}

function doRoute(entry){
  const{text,category,subcategory,subcategoryName,subcategoryEmoji,route,id,date,at}=entry;
  const today=todayStr();
  const te=TE();
  const catObj=category?te.getCatById(category):null;
  const catName=catObj?catObj.name:(category||'');
  const catEmoji=catObj?catObj.emoji:'📌';
  const catColor=catObj?catObj.color:'#789A88';

  if(route==='tier1'||route==='tier2'||route==='tier3'){
    const tier=route==='tier1'?1:route==='tier2'?2:3;
    try{
      const store=HQKeys.DAYBUILDER_V2;
      let db=HQSafe.store.get(store,{days:{},routineTasks:[],customTasks:[]});
      if(!db.days)db.days={};
      if(!db.days[today])db.days[today]={slots:{},deviations:[]};
      const dd=db.days[today];
      if(!dd.slots)dd.slots={};
      const now=new Date();
      const slotH=now.getHours()<2?9:now.getHours();
      const slotM=now.getMinutes()<30?0:30;
      const tk=String(slotH).padStart(2,'0')+':'+String(slotM).padStart(2,'0');
      if(!dd.slots[tk])dd.slots[tk]=[];
      dd.slots[tk].push({
        id:uid(), em:catEmoji, name:text, dur:30,
        cat:category||'self',
        catName,catColor,
        subcategory:subcategory||null,
        subcategoryName:subcategoryName||null,
        tier,
        routedFrom:'brain-dump',bdEntryId:id,saved:at,
      });
      HQSafe.store.set(store, db);
      HQSafe.store.set(HQKeys.DB_SIGNAL,Date.now().toString());
      HQSafe.bus.emitDBSignal();
    }catch(e){}

  } else if(route==='weekly'){
    try{
      const wk=getWeekStr(new Date());
      const store=HQKeys.WEEKLY;
      let db=HQSafe.store.get(store,{});
      if(!db[wk])db[wk]={inbox:[],days:{},goals:[],notes:''};
      if(!db[wk].inbox)db[wk].inbox=[];
      db[wk].inbox.push({
        id:uid(),type:'task',title:text,
        category:category||null,categoryName,categoryEmoji:catEmoji,
        subcategory:subcategory||null,subcategoryName:subcategoryName||null,
        status:'weekly',weekTarget:wk,deferCount:0,
        routedFrom:'brain-dump',bdEntryId:id,saved:at,
      });
      HQSafe.store.set(store, db);
      // [P6-M4] emitCascadeSignal handles the storage write — no direct setItem here
      HQSafe.bus.emitCascadeSignal('brain-dump');
      HQSafe.bus.emit('hq-braindump-saved',{source:'brain-dump'});
    }catch(e){}

  } else if(route==='monthly'){
    try{
      const mk=today.slice(0,7);
      const store=HQKeys.MONTHLY; // [P6-KEYFIX] was 'hq-monthly' — orphaned legacy key
      let db=HQSafe.store.get(store,{});
      if(!db[mk])db[mk]={items:[],goals:[],notes:''};
      if(!db[mk].items)db[mk].items=[];
      db[mk].items.push({
        id:uid(),type:'task',title:text,
        category:category||null,categoryName,categoryEmoji:catEmoji,
        subcategory:subcategory||null,subcategoryName:subcategoryName||null,
        status:'inbox',monthTarget:mk,deferCount:0,
        routedFrom:'brain-dump',bdEntryId:id,saved:at,
        history:[{action:'created-from-brain-dump',at}],
      });
      HQSafe.store.set(store, db);
    }catch(e){}

  } else if(route==='win'){
    try{
      const store=HQKeys.WINS;
      let db=HQSafe.store.get(store,[]);
      db.unshift({id:uid(),text,category:category||null,subcategory:subcategory||null,at,from:'brain-dump'});
      HQSafe.store.set(store, db);
    }catch(e){}

  } else if(route==='health'){
    // Health route: write to symptoms with correct category metadata
    try{
      const store=HQKeys.HEALTH;
      let db=HQSafe.store.get(store,{});
      if(!db.symptoms)db.symptoms=[];
      const subName = subcategoryName || (subcategory==='h-mental'?'Mental Health':
                       subcategory==='h-rx'?'Medications & Rx':
                       subcategory==='h-providers'?'Providers & Appointments':'General');
      const subEmoji = subcategoryEmoji || '🩺';
      db.symptoms.unshift({
        id:uid(), name:text,
        category: subcategory||'h-symptoms',
        categoryName: subName,
        categoryEmoji: subEmoji,
        parentCategory:'health',
        date:today, time:new Date().toTimeString().slice(0,5),
        severity:5, notes:'From Thought Jar',
        saved:at, from:'brain-dump',
      });
      HQSafe.store.set(store, db);
    }catch(e){}

  } else if(route==='finance'){
    // Finance route: write as a structured finance note with subcategory
    try{
      const store=HQKeys.FINANCE;
      let db=HQSafe.store.get(store,{});
      if(!db.notes)db.notes=[];
      db.notes.unshift({
        id:uid(), text,
        category:subcategory||'fin-bills',
        categoryName:subcategoryName||'Finance Note',
        date:today, at,
        from:'brain-dump', bdEntryId:id,
      });
      HQSafe.store.set(store, db);
    }catch(e){}

  } else if(route==='admin'){
    // Admin route: write to life-admin deadlines/notes
    try{
      const store=HQKeys.LIFE_ADMIN;
      let db=HQSafe.store.get(store,{});
      if(!db.deadlines)db.deadlines=[];
      db.deadlines.unshift({
        id:uid(), title:text,
        category:subcategory||'adm-paperwork',
        categoryName:subcategoryName||'Admin',
        date:today, dueDate:null,
        priority:'medium', done:false,
        notes:'From Thought Jar', at, from:'brain-dump',
      });
      HQSafe.store.set(store, db);
    }catch(e){}

  } else if(route==='social'){
    // Social route: write to social-brain as an interaction note
    try{
      const store=HQKeys.SOCIAL;
      let db=HQSafe.store.get(store,{});
      if(!db.notes)db.notes=[];
      db.notes.unshift({
        id:uid(), text,
        subcategory:subcategory||null,
        subcategoryName:subcategoryName||null,
        date:today, at, from:'brain-dump',
      });
      HQSafe.store.set(store, db);
    }catch(e){}

  } else if(route==='taskboard'){
    try{
      const store=HQKeys.TASKBOARD;
      let db=HQSafe.store.get(store,{});
      if(!db.tasks) db.tasks=[];
      db.tasks.unshift({
        id:uid(),title:text,status:'inbox',priority:'medium',
        done:false,
        tags:category?[category]:[],
        category:category||null,
        subcategory:subcategory||null,subcategoryName:subcategoryName||null,
        createdAt:at,routedFrom:'brain-dump',bdEntryId:id,
      });
      HQSafe.store.set(store, db);
    }catch(e){}

  } else if(route==='timeline'){
    try{
      const store=HQKeys.TIMELINE;
      let db={};db=HQSafe.store.get(store,db);
      if(!db.events) db.events=[];
      db.events.unshift({
        id:uid(),title:text,date:today,
        type:'task',done:false,
        category:category||null,categoryName,categoryEmoji:catEmoji,
        subcategory:subcategory||null,
        routedFrom:'brain-dump',bdEntryId:id,saved:at,
      });
      HQSafe.store.set(store, db);
    }catch(e){}

  } else if(route==='kitchen'){
    try{
      const store=HQKeys.KITCHEN;
      let db=HQSafe.store.get(store,{});
      if(!db.notes) db.notes=[];
      db.notes.unshift({
        id:uid(),text,date:today,
        source:'brain-dump',bdEntryId:id,saved:at,
      });
      HQSafe.store.set(store, db);
    }catch(e){}

  } else if(route==='projects'){
    try{
      HQSafe.store.set(HQKeys.ROUTE_TO_PROJECTS, {text,notes:'',from:'brain-dump',at});
      HQSafe.bus.emitRoute('projects',{text,notes:'',from:'brain-dump',at});
    }catch(e){}
  }
  // 'save' route: no external routing — stays in brain dump only
}

// ====== RENDER LOG ======// ====== RENDER LOG ======
function renderLog(){
  const te=TE();
  let filtered=[...entries];
  const today=todayStr();
  if(logFilter==='today') filtered=filtered.filter(e=>safeDate(e)===today);
  else if(logFilter!=='all') filtered=filtered.filter(e=>e.type===logFilter);

  renderStats();
  const el=document.getElementById('log-list');
  if(!filtered.length){
    el.innerHTML=HQComponents.emptyState('💭', entries.length?'No entries match this filter.':'Nothing dumped yet. Go dump something!');return;
  }
  el.innerHTML=filtered.map(e=>renderEntry(e,te,false)).join('');
}

function renderRouted(){
  const te=TE();
  let filtered=entries.filter(e=>e.route!=='save');
  if(routedFilter!=='all') filtered=filtered.filter(e=>e.route===routedFilter);

  const el=document.getElementById('routed-list');
  if(!filtered.length){
    el.innerHTML=HQComponents.emptyState('📤', entries.filter(e=>e.route!=='save').length?'No entries match this filter.':'Nothing routed yet.');return;
  }
  el.innerHTML=filtered.map(e=>renderEntry(e,te,true)).join('');
}

function renderEntry(e, te, showRoute){
  const rm=ROUTE_META[e.route]||ROUTE_META.save;
  const cat=te.getCategories().find(c=>c.id===e.category);
  const TYPE_ICONS={thought:'💭',task:'✅',worry:'😰',idea:'💡',feeling:'💚',vent:'🌋'};
  const timeStr=new Date(e.at).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});
  const entryDate=safeDate(e);
  const dateStr=entryDate?(entryDate===todayStr()?'Today':new Date(entryDate+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'})):'Unknown date';
  const subLabel=e.subcategoryName?`<span class="log-sub">${e.subcategoryEmoji?renderEmoji(e.subcategoryEmoji)+' ':''}${esc(e.subcategoryName)}</span>`:'';

  return`<div class="log-item" id="le-${e.id}">
    <div class="log-hd">
      <div class="log-route-dot" style="background:${rm.dot}"></div>
      <div class="log-text">${esc(e.text)}</div>
      <div class="log-actions">
        <button class="btn-sm" onclick="openReroute('${e.id}')" title="Re-route">↗</button>
        <button class="btn-sm del" onclick="delEntry('${e.id}')" title="Delete">✕</button>
      </div>
    </div>
    <div class="log-meta">
      <span>${TYPE_ICONS[e.type]||'💭'} ${e.type}</span>
      ${cat?`<span class="log-cat"><span style="color:${cat.color}">${renderEmoji(cat.emoji)}</span>${cat.name}</span>`:''}
      ${subLabel}
      ${showRoute?`<span class="log-route-badge" style="color:${rm.color};border-color:${rm.color}25;background:${rm.color}10">${rm.label}</span>`:''}
      <span class="log-time">${dateStr} · ${timeStr}</span>
    </div>
  </div>`;
}

// ====== STATS ======
function renderStats(){
  const today=todayStr();
  const total=entries.length;
  const todayN=entries.filter(e=>safeDate(e)===today).length;
  const routed=entries.filter(e=>e.route!=='save').length;
  const saved=entries.filter(e=>e.route==='save').length;
  document.getElementById('st-total').textContent=total;
  document.getElementById('st-today').textContent=todayN;
  document.getElementById('st-routed').textContent=routed;
  document.getElementById('st-saved').textContent=saved;
  document.getElementById('hdr-total').textContent=total;
}

// ====== RE-ROUTE ======
function openReroute(id){
  rerouteId=id;
  const e=entries.find(x=>x.id===id);if(!e)return;
  document.getElementById('rr-text').textContent=e.text.slice(0,120)+(e.text.length>120?'…':'');
  document.getElementById('rr-dest').value=e.route||'save';
  const catSel=document.getElementById('rr-cat');
  catSel.value=e.category||'';
  // Populate rr-sub if cat has subcats
  const te=TE();
  const rrSubWrap=document.getElementById('rr-sub-wrap');
  const rrSub=document.getElementById('rr-sub');
  if(rrSubWrap&&rrSub&&e.category){
    const subs=te.getSubcats(e.category);
    if(subs&&subs.length){
      rrSub.innerHTML='<option value="">— Subcategory —</option>'+
        subs.map(s=>`<option value="${s.id}">${renderEmoji(s.emoji)} ${s.name}</option>`).join('');
      rrSub.value=e.subcategory||'';
      rrSubWrap.style.display='';
    } else {
      rrSubWrap.style.display='none';
    }
  } else if(rrSubWrap){
    rrSubWrap.style.display='none';
  }
  document.getElementById('reroute-modal').classList.add('show');
}

function onRrCatChange(selectEl){
  const te=TE();
  const catId=selectEl.value;
  const rrSubWrap=document.getElementById('rr-sub-wrap');
  const rrSub=document.getElementById('rr-sub');
  if(!rrSubWrap||!rrSub)return;
  const subs=te.getSubcats(catId);
  if(subs&&subs.length){
    rrSub.innerHTML='<option value="">— Subcategory —</option>'+
      subs.map(s=>`<option value="${s.id}">${renderEmoji(s.emoji)} ${s.name}</option>`).join('');
    rrSubWrap.style.display='';
  } else {
    rrSubWrap.style.display='none';
    rrSub.value='';
  }
}

function confirmReroute(){
  const e=entries.find(x=>x.id===rerouteId);if(!e)return;
  const newRoute=document.getElementById('rr-dest').value;
  const newCat=document.getElementById('rr-cat').value;
  const newSub=document.getElementById('rr-sub')?.value||'';
  const te=TE();
  const catObj=newCat?te.getCatById(newCat):null;
  const subObj=newSub&&catObj?(catObj.subcategories||[]).find(s=>s.id===newSub):null;
  e.route=newRoute;
  e.category=newCat||null;
  e.subcategory=newSub||null;
  e.subcategoryName=subObj?subObj.name:null;
  e.subcategoryEmoji=subObj?subObj.emoji:null;
  doRoute({...e});
  persist();closeModal();renderLog();renderRouted();
  showToast(`${ROUTE_META[newRoute]?.label||newRoute} — re-routed!`);
}

async function delEntry(id){
  if(!(await HQConfirm.ask('Delete this entry?', {danger:true})))return;
  if (typeof hqUnflag === 'function') hqUnflag('bd-urgent-' + id);
  entries=entries.filter(e=>e.id!==id);
  persist();renderLog();renderRouted();renderStats();
  showToast('🗑️ Deleted');
}

// ====== FILTERS ======
function setFilter(f,btn){
  logFilter=f;
  document.querySelectorAll('#tab-log .fchip').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on');
  renderLog();
}
function setRoutedFilter(f,btn){
  routedFilter=f;
  document.querySelectorAll('#tab-routed .fchip').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on');
  renderRouted();
}

// ====== MODAL ======
function closeModal(){document.getElementById('reroute-modal').classList.remove('show');}

// ====== UTILS ======
const esc = s => HQUtils.esc(s); // → HQUtils.esc

const getWeekStr = d => (window.HQDate ? HQDate.weekKey(d) : (() => { const dt=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())); const dn=dt.getUTCDay()||7; dt.setUTCDate(dt.getUTCDate()+4-dn); const ys=new Date(Date.UTC(dt.getUTCFullYear(),0,1)); return `${dt.getUTCFullYear()}-W${String(Math.ceil((((dt-ys)/86400000)+1)/7)).padStart(2,'0')}`; })()); // aliased → HQDate.weekKey

// ====== TABS ======


// ── WORRY QUEUE ─────────────────────────────────────────────────────
function setWorryTime() {
  const t = document.getElementById('worry-time-input')?.value;
  if(!t) return;
  HQSafe.store.set(HQKeys.WORRY_TIME, t);
  const disp = document.getElementById('worry-time-display');
  if(disp) {
    const [h,m] = t.split(':');
    const d = new Date(); d.setHours(+h,+m,0,0);
    disp.textContent = 'Set for ' + d.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});
  }
}

function renderWorryQueue() {
  const el = document.getElementById('worry-list');
  if(!el) return;
  const worries = entries.filter(e => e.type === 'worry');
  const disp = document.getElementById('worry-time-display');
  const savedTime = HQSafe.store.get(HQKeys.WORRY_TIME);
  const inp = document.getElementById('worry-time-input');
  if(savedTime) {
    if(inp) inp.value = savedTime;
    if(disp) {
      const [h,m] = savedTime.split(':');
      const d = new Date(); d.setHours(+h,+m,0,0);
      disp.textContent = 'Set for ' + d.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});
    }
  }
  if(!worries.length) {
    el.innerHTML = HQComponents.emptyState('😌', 'No worries in your queue. Thought Jar anything on your mind and tag it as Worry.');
    return;
  }
  const te = TE();
  el.innerHTML = worries.map(e => renderEntry(e, te, false)).join('');
}

// ── WIN LOG GALLERY ──────────────────────────────────────────────────
function renderWinsGallery() {
  const el = document.getElementById('wins-list');
  const summEl = document.getElementById('wins-monthly-summary');
  if(!el) return;
  let wins = [];
  try { wins = HQSafe.store.get(HQKeys.WINS, []); } catch(e) {}
  // Also include brain-dump entries routed to 'win'
  const dumpWins = entries.filter(e => e.route === 'win');
  const allWins = [
    ...wins.map(w => ({...w, _src:'wins'})),
    ...dumpWins.map(w => ({...w, _src:'dump'})),
  ].sort((a,b) => new Date(b.at||b.date) - new Date(a.at||a.date));

  // Monthly summary
  if(summEl) {
    const thisMonth = new Date().toISOString().slice(0,7);
    const monthCount = allWins.filter(w => (w.at||w.date||'').startsWith(thisMonth)).length;
    const mn = new Date().toLocaleDateString('en-US',{month:'long'});
    summEl.innerHTML = `<div style="background:rgba(42,122,78,.08);border:1.5px solid rgba(42,122,78,.2);border-radius:10px;padding:11px 14px;display:flex;align-items:center;gap:10px;">
      <span style="font-size:24px">🏆</span>
      <div>
        <div style="font-size:16px;font-weight:900;color:var(--green)">${monthCount} win${monthCount!==1?'s':''} in ${mn}</div>
        <div style="font-size:10px;color:var(--muted);margin-top:2px;">Every entry counts. Micro-wins included.</div>
      </div>
    </div>`;
  }

  if(!allWins.length) {
    el.innerHTML = HQComponents.emptyState('🏆', 'No wins yet. Log one from Thought Jar — showered, made food, sent an email. All count.');
    return;
  }

  // Group by month
  const byMonth = {};
  allWins.forEach(w => {
    const mk = (w.at||w.date||'').slice(0,7);
    if(!byMonth[mk]) byMonth[mk] = [];
    byMonth[mk].push(w);
  });

  el.innerHTML = Object.entries(byMonth).sort(([a],[b]) => b.localeCompare(a)).map(([mk, wins]) => {
    const label = new Date(mk+'-15').toLocaleDateString('en-US',{month:'long',year:'numeric'});
    return `<div style="margin-bottom:14px;">
      <div style="font-size:9px;font-weight:900;color:var(--muted);text-transform:uppercase;letter-spacing:.1em;margin-bottom:7px;display:flex;align-items:center;gap:7px;">
        ${label} <span style="color:var(--green);font-size:10px;">· ${wins.length} win${wins.length!==1?'s':''}</span>
        <span style="flex:1;height:1px;background:var(--border);display:inline-block"></span>
      </div>
      ${wins.map(w => `<div style="display:flex;align-items:flex-start;gap:9px;padding:7px 0;border-bottom:1px solid var(--border);">
        <span style="font-size:16px;flex-shrink:0">🏆</span>
        <div style="flex:1;min-width:0;">
          <div style="font-size:12px;color:var(--text2);font-weight:600;">${esc(w.text||w.note||'Win')}</div>
          <div style="font-size:9px;color:var(--muted);margin-top:2px;">${new Date(w.at||w.date+'T12:00:00').toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})}</div>
        </div>
      </div>`).join('')}
    </div>`;
  }).join('');
}

// ── EMOTIONAL LOAD SCORE ──────────────────────────────────────────────
function calcEmotionalLoad() {
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate()-7);
  const cutoffStr = cutoff.toISOString().split('T')[0];
  const load = entries.filter(e => {
    const d = e.date || (e.at||'').split('T')[0];
    return d >= cutoffStr && (e.type === 'worry' || e.type === 'vent');
  }).length;
  const el = document.getElementById('st-load');
  if(el) {
    el.textContent = load;
    el.style.color = load >= 10 ? 'var(--red,#ff6b6b)' : load >= 5 ? 'var(--orange)' : 'var(--green)';
  }
  // Write to index signal for homepage head-fullness indicator
  try {
    HQSafe.store.set(HQKeys.EMOTIONAL_LOAD, {
      count: load, ts: Date.now(),
      level: load >= 10 ? 'high' : load >= 5 ? 'medium' : 'low',
    });
  } catch(e) {}
}

// ====== INIT ======
load();
populateCats();
renderStats();
calcEmotionalLoad();

// P3: Re-render category selectors when config changes (tags updated from Customize)
window.addEventListener('hq-config-updated', function() {
  try { populateCats(); renderStats(); } catch(e) {}
});

// ── Theme key fallback (if hq-core.js not loaded) ──
if (typeof hqSetTheme !== 'function') {
  window.hqSetTheme = function(t, persist) {
    document.documentElement.setAttribute('data-theme', t);
    document.querySelectorAll('[data-t]').forEach(b =>
      b.classList.toggle('active', b.dataset.t === t));
    if (persist) HQSafe.store.set(HQKeys.THEME, t);
  };
}
// Init theme from HQConfig first (P3), fall back to canonical key
(function initTheme() {
  const t = (window.HQConfig && window.HQConfig.theme && window.HQConfig.theme.theme)
    || HQSafe.store.get(HQKeys.THEME) ||
    (new Date().getHours() >= 5 && new Date().getHours() < 12 ? 'morning' :
     new Date().getHours() < 19 ? 'afternoon' : 'night');
  hqSetTheme(t, false);
})();
// ── Nav toggle ──────────────────────────

// ── Mark active nav item ─────────────────
// ── Flag urgent brain dump entries ───────
function bdFlagUrgent(entry) {
  if (typeof hqFlag === 'function') {
    hqFlag({
      id: 'bd-urgent-' + entry.id,
      source: 'brain-dump',
      type: 'urgent',
      text: entry.text.substring(0, 60) + (entry.text.length > 60 ? '…' : ''),
      href: 'brain-dump.html',
      ts: Date.now()
    });
  }
}
/* Call hqUnflag('bd-urgent-' + id) when entry is resolved/deleted */

// ── GLOBAL EXPORTS (inline onclick handlers need window scope) ──────────────
window.sw = sw;
