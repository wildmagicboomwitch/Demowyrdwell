(function () {
  'use strict';
  /* ── Phase C3: IIFE + strict mode wrap — life-admin ── */

// ════════════════════════════════════════════════════════════
//  LIFE ADMIN BRAIN — AuDHD HQ
//  Storage key: audhd-hq-life-admin
//  Schema: { docs:[], contacts:[], deadlines:[], waiting:[],
//            calls:[], appts:[], resources:[], tools:[] }
// ════════════════════════════════════════════════════════════

const STORE = HQKeys.LIFE_ADMIN;
let DB = {
  docs:[],
  contacts:[],
  deadlines:[],
  waiting:[],
  calls:[],
  appts:[],
  resources:[],
  // tools[] removed — migrated to Tool Vault (Admin Portals) in Phase 11
  adminSetup:{
    documentLocations:[],
    vaults:[],
    digitalProviders:[]
  }
};
let _callAnxiety = 'low';
let _docFilter = 'all';
let _contactFilter = 'all';
let _resFilter = 'all';

// ── PERSISTENCE ──────────────────────────────────────────────
function load() {
  { const s = HQSafe.store.get(STORE, null); if(s && typeof s === 'object') DB = {...DB, ...s}; }
}
function persist() {
  HQSafe.store.set(STORE, DB);
}
const uid = () => HQUtils.uid(); // → HQUtils.uid
const todayStr = () => (window.HQDate ? HQDate.today() : new Date().toISOString().split('T')[0]); // aliased → HQDate.today
const esc = s => HQUtils.esc(s); // → HQUtils.esc

// ── TABS ─────────────────────────────────────────────────────
function renderTab(id) {
  if (id === 'docs')      renderDocs();
  if (id === 'contacts')  renderContacts();
  if (id === 'deadlines') renderDeadlines();
  if (id === 'waiting')   renderWaiting();
  if (id === 'calls')     renderCalls();
  if (id === 'appts')     renderAppts();
  if (id === 'resources') renderResources();
}

// ── MODALS ───────────────────────────────────────────────────
function openModal(id) {
  document.getElementById(id).classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  document.body.style.overflow = '';
}

// ── UTILS ────────────────────────────────────────────────────
function daysUntil(dateStr) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr+'T12:00:00') - Date.now()) / 86400000);
}
function fmtDate(s) {
  if (!s) return '';
  return new Date(s+'T12:00:00').toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'});
}
function daysLabel(days) {
  if (days === null) return '';
  if (days < 0)  return Math.abs(days) + 'd overdue';
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days < 30) return days + ' days';
  if (days < 365) return Math.round(days/30) + ' months';
  return Math.round(days/365) + ' yr' + (days > 550 ? 's' : '');
}
function expiryClass(days) {
  if (days === null) return '';
  if (days < 0)   return 'past';
  if (days <= 60)  return 'soon';
  return 'ok';
}

const DOC_CATS = { id:'🪪 ID & Identity', health:'🏥 Health', finance:'💰 Finance', home:'🏠 Home', work:'💼 Work', legal:'⚖️ Legal', other:'📁 Other' };
const CT_ROLES = { doctor:'🩺 Doctor', specialist:'🏥 Specialist', therapist:'🧠 Therapist', dentist:'🦷 Dentist', pharmacy:'💊 Pharmacy', landlord:'🏠 Landlord', insurance:'🛡 Insurance', government:'🏛 Gov', legal:'⚖️ Legal', utility:'💡 Utility', other:'📞 Other' };
const DL_CATS  = { id:'🪪', vehicle:'🚗', insurance:'🛡', health:'💊', finance:'💰', home:'🏠', work:'💼', other:'📋' };
const RES_CATS = { health:'🏥 Health', finance:'💰 Finance', housing:'🏠 Housing', benefits:'🏛 Benefits', work:'💼 Work', legal:'⚖️ Legal', other:'📋 Other' };
const RES_COLORS = { health:'#ef5886', finance:'#f4ca00', housing:'#8bb698', benefits:'#4ecdc4', work:'#645eb7', legal:'#ff876c', other:'#706090' };

// Maps deadline category keys → admin subcategory ids from global hq-tags
const DL_CAT_TO_SUBCAT = {
  id:'adm-paperwork', vehicle:'adm-paperwork', insurance:'adm-insurance',
  health:'adm-medical', finance:'adm-paperwork', home:'adm-home',
  work:'adm-work', other:'adm-paperwork',
};
const DL_CAT_TO_SUBCAT_NAME = {
  id:'Paperwork & Forms', vehicle:'Paperwork & Forms', insurance:'Insurance',
  health:'Medical Admin', finance:'Paperwork & Forms', home:'Home Admin',
  work:'Work Admin', other:'Paperwork & Forms',
};

// ── ISO week string helper (same format as weekly-planner) ──
const getWeekStr = d => (window.HQDate ? HQDate.weekKey(d) : (() => { const dt=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())); const dn=dt.getUTCDay()||7; dt.setUTCDate(dt.getUTCDate()+4-dn); const ys=new Date(Date.UTC(dt.getUTCFullYear(),0,1)); return `${dt.getUTCFullYear()}-W${String(Math.ceil((((dt-ys)/86400000)+1)/7)).padStart(2,'0')}`; })()); // aliased → HQDate.weekKey

// ── SEND TO PLANNER ─────────────────────────────────────────
// Pushes a deadline or appointment into the weekly or monthly planner inbox.
// target: 'weekly' | 'monthly'
// type:   'deadline' | 'appt'
// id:     item id in DB
function sendToPlanner(type, id, target) {
  target = target || 'weekly';
  let item = null;
  let title = '', dateStr = '', subcat = '', subcatName = '', flags = [];

  if (type === 'deadline') {
    item = DB.deadlines.find(d => d.id === id);
    if (!item) { showToast('⚠️ Item not found'); return; }
    title = item.name + (item.notes ? ' — ' + item.notes.slice(0,40) : '');
    dateStr = item.date || '';
    subcat = DL_CAT_TO_SUBCAT[item.cat] || 'adm-paperwork';
    subcatName = DL_CAT_TO_SUBCAT_NAME[item.cat] || 'Paperwork & Forms';
    if (dateStr) flags = ['date-locked'];

  } else if (type === 'appt') {
    item = DB.appts.find(a => a.id === id);
    if (!item) { showToast('⚠️ Item not found'); return; }
    title = item.who + (item.reason ? ' — ' + item.reason : '');
    dateStr = item.date || '';
    subcat = 'adm-medical';
    subcatName = 'Medical Admin';
    if (dateStr) flags = ['date-locked'];
  }

  if (!item) return;

  const plannerItem = {
    id: uid(),
    type: 'task',
    title,
    category: 'admin',
    categoryName: 'Admin',
    categoryEmoji: '📋',
    subcategory: subcat,
    subcategoryName: subcatName,
    flags,
    notes: item.notes || '',
    status: target === 'weekly' ? 'weekly' : 'inbox',
    deferCount: 0,
    routedFrom: 'life-admin',
    lifeAdminId: id,
    lifeAdminType: type,
    saved: new Date().toISOString(),
  };

  try {
    if (target === 'weekly') {
      const wk = getWeekStr(new Date());
      const store = HQKeys.WEEKLY;
      let db = {};
      db = HQSafe.store.get(store, {});
      if (!db[wk]) db[wk] = {inbox:[], days:{}, goals:[], notes:''};
      if (!db[wk].inbox) db[wk].inbox = [];
      plannerItem.weekTarget = wk;
      db[wk].inbox.push(plannerItem);
      HQSafe.store.set(store, db);
      // [P6-M4] emitCascadeSignal handles the storage write — no direct setItem here
      HQSafe.bus.emitCascadeSignal('life-admin');
      HQSafe.bus.emit('hq-life-admin-saved', { source: 'life-admin' });
      showToast('📆 Sent to Weekly Inbox!');

    } else {
      const mk = todayStr().slice(0,7);
      const store = HQKeys.MONTHLY;
      let db = {};
      db = HQSafe.store.get(store, {});
      if (!db[mk]) db[mk] = {items:[], goals:[], notes:''};
      if (!db[mk].items) db[mk].items = [];
      plannerItem.monthTarget = mk;
      db[mk].items.push(plannerItem);
      HQSafe.store.set(store, db);
      showToast('🗓️ Sent to Monthly Inbox!');
    }
  } catch(e) {
    showToast('❌ Could not send to planner');
    console.warn('[life-admin] sendToPlanner failed', e);
  }
}

// ════════════════════════════════════════════════════════════
// DOCUMENTS
// ════════════════════════════════════════════════════════════
function renderDocs() {
  const cats = [...new Set(DB.docs.map(d => d.cat))];
  const expiringSoon = DB.docs.filter(d => { const n = daysUntil(d.expiry); return n !== null && n >= 0 && n <= 60; }).length;
  const expired = DB.docs.filter(d => { const n = daysUntil(d.expiry); return n !== null && n < 0; }).length;
  document.getElementById('d-total').textContent = DB.docs.length;
  document.getElementById('d-expiring').textContent = expiringSoon;
  document.getElementById('d-expired').textContent = expired;
  document.getElementById('d-cats').textContent = cats.length;

  // Filter chips
  const filterEl = document.getElementById('doc-filter-row');
  filterEl.innerHTML = ['all',...Object.keys(DOC_CATS)].map(k =>
    `<button class="fchip${_docFilter===k?' on':''}" onclick="setDocFilter('${k}',this)">${k==='all'?'All':DOC_CATS[k]}</button>`
  ).join('');

  const items = _docFilter === 'all' ? DB.docs : DB.docs.filter(d => d.cat === _docFilter);
  const el = document.getElementById('doc-list');
  if (!items.length) { el.innerHTML = HQComponents.emptyState('📂', 'No documents yet. Add where to find your important documents.'); return; }

  // Sort: expired first, then expiring soon, then by name
  const sorted = [...items].sort((a, b) => {
    const da = daysUntil(a.expiry), db = daysUntil(b.expiry);
    if (da !== null && da < 0 && (db === null || db >= 0)) return -1;
    if (db !== null && db < 0 && (da === null || da >= 0)) return 1;
    if (da !== null && db !== null) return da - db;
    return (a.name||'').localeCompare(b.name||'');
  });

  el.innerHTML = sorted.map(d => {
    const days = daysUntil(d.expiry);
    const ec   = expiryClass(days);
    const borderClass = ec === 'past' ? ' expired' : ec === 'soon' ? ' expiring-soon' : '';
    return `<div class="doc-item${borderClass}" id="doccard-${d.id}">
      <div class="doc-hd" onclick="document.getElementById('doccard-${d.id}').classList.toggle('open')">
        <div class="doc-ico">${DOC_CATS[d.cat]?.split(' ')[0]||'📁'}</div>
        <div class="doc-info">
          <div class="doc-name">${esc(d.name)}</div>
          <div class="doc-meta">
            <span>${DOC_CATS[d.cat]||d.cat}</span>
            ${d.location ? '<span>📍 ' + esc(d.location) + '</span>' : ''}
          </div>
        </div>
        ${days !== null ? `<span class="doc-expiry ${ec}">${ec==='past'?'Expired':'Exp '+(daysLabel(days)||fmtDate(d.expiry))}</span>` : ''}
      </div>
      <div class="doc-body">
        ${d.location ? `<div class="doc-field"><span class="doc-field-lbl">Location</span>${esc(d.location)}</div>` : ''}
        ${d.expiry   ? `<div class="doc-field"><span class="doc-field-lbl">Expires</span>${fmtDate(d.expiry)} ${days!==null&&days<0?'<strong style="color:var(--red)">(EXPIRED)</strong>':days!==null&&days<=60?`<strong style="color:var(--orange)">(in ${daysLabel(days)})</strong>`:''}</div>` : ''}
        ${d.notes    ? `<div class="doc-field"><span class="doc-field-lbl">Notes</span>${esc(d.notes)}</div>` : ''}
        <div class="doc-actions">
          <button class="doc-edit-btn" onclick="openEditDoc('${d.id}')">✏️ Edit</button>
          <button class="doc-del-btn" onclick="deleteDoc('${d.id}')">🗑 Delete</button>
        </div>
      </div>
    </div>`;
  }).join('');
}
function setDocFilter(cat, btn) {
  _docFilter = cat;
  renderDocs();
}
function openEditDoc(id) {
  const d = DB.docs.find(x => x.id === id); if (!d) return;
  document.getElementById('doc-modal-title').textContent = 'Edit Document';
  document.getElementById('doc-id').value       = id;
  document.getElementById('doc-name').value     = d.name||'';
  document.getElementById('doc-cat').value      = d.cat||'id';
  document.getElementById('doc-expiry').value   = d.expiry||'';
  document.getElementById('doc-location').value = d.location||'';
  document.getElementById('doc-notes').value    = d.notes||'';
  openModal('doc-modal');
}
function saveDoc() {
  const name = document.getElementById('doc-name').value.trim();
  if (!name) { showToast('⚠️ Name required'); return; }
  const id = document.getElementById('doc-id').value || uid();
  const entry = {
    id, name,
    cat:      document.getElementById('doc-cat').value,
    expiry:   document.getElementById('doc-expiry').value,
    location: document.getElementById('doc-location').value.trim(),
    notes:    document.getElementById('doc-notes').value.trim(),
  };
  const idx = DB.docs.findIndex(d => d.id === id);
  if (idx >= 0) DB.docs[idx] = entry; else DB.docs.push(entry);
  persist(); closeModal('doc-modal'); renderDocs();
  // Reset
  ['doc-id','doc-name','doc-expiry','doc-location','doc-notes'].forEach(i => { const el=document.getElementById(i); if(el)el.value=''; });
  document.getElementById('doc-modal-title').textContent = 'Add Document';
  showToast('📂 Saved!');
}
async function deleteDoc(id) {
  if(!(await HQConfirm.ask('Delete this document?', {danger:true})))return;
  DB.docs = DB.docs.filter(d => d.id !== id);
  persist(); renderDocs();
}

// ════════════════════════════════════════════════════════════
// CONTACTS
// ════════════════════════════════════════════════════════════
function renderContacts() {
  const filterEl = document.getElementById('contact-filter-row');
  const roles = [...new Set(DB.contacts.map(c => c.role))];
  filterEl.innerHTML = ['all',...roles].map(r =>
    `<button class="fchip${_contactFilter===r?' on':''}" onclick="setContactFilter('${r}',this)">${r==='all'?'All':CT_ROLES[r]||r}</button>`
  ).join('');

  const items = _contactFilter === 'all' ? DB.contacts : DB.contacts.filter(c => c.role === _contactFilter);
  const el = document.getElementById('contact-list');
  if (!items.length) { el.innerHTML = HQComponents.emptyState('📞', 'No contacts yet. Add your key people — doctor, therapist, landlord.'); return; }

  el.innerHTML = items.map(ct => `<div class="contact-item">
    <div class="contact-ico">${CT_ROLES[ct.role]?.split(' ')[0]||'📞'}</div>
    <div class="contact-info">
      <div class="contact-name">${esc(ct.name)}</div>
      <div class="contact-role">${CT_ROLES[ct.role]||ct.role}</div>
      ${ct.address ? `<div style="font-size:10px;color:var(--muted);margin-top:2px">📍 ${esc(ct.address)}</div>` : ''}
      ${ct.notes ? `<div style="font-size:10px;color:var(--text2);margin-top:4px;font-style:italic">${esc(ct.notes)}</div>` : ''}
      <div class="contact-details">
        ${ct.phone ? `<a href="tel:${esc(ct.phone)}" class="contact-link">📱 ${esc(ct.phone)}</a>` : ''}
        ${ct.email ? `<a href="mailto:${esc(ct.email)}" class="contact-link">✉️ ${esc(ct.email)}</a>` : ''}
      </div>
    </div>
    <div class="contact-actions">
      <button class="doc-edit-btn" onclick="openEditContact('${ct.id}')">✏️</button>
      <button class="doc-del-btn" onclick="deleteContact('${ct.id}')">🗑</button>
    </div>
  </div>`).join('');
}
function setContactFilter(role, btn) { _contactFilter = role; renderContacts(); }
function openEditContact(id) {
  const ct = DB.contacts.find(x => x.id === id); if (!ct) return;
  document.getElementById('contact-modal-title').textContent = 'Edit Contact';
  document.getElementById('ct-id').value      = id;
  document.getElementById('ct-name').value    = ct.name||'';
  document.getElementById('ct-role').value    = ct.role||'other';
  document.getElementById('ct-phone').value   = ct.phone||'';
  document.getElementById('ct-email').value   = ct.email||'';
  document.getElementById('ct-address').value = ct.address||'';
  document.getElementById('ct-notes').value   = ct.notes||'';
  openModal('contact-modal');
}
function saveContact() {
  const name = document.getElementById('ct-name').value.trim();
  if (!name) { showToast('⚠️ Name required'); return; }
  const id = document.getElementById('ct-id').value || uid();
  const entry = { id, name, role:document.getElementById('ct-role').value, phone:document.getElementById('ct-phone').value.trim(), email:document.getElementById('ct-email').value.trim(), address:document.getElementById('ct-address').value.trim(), notes:document.getElementById('ct-notes').value.trim() };
  const idx = DB.contacts.findIndex(c => c.id === id);
  if (idx >= 0) DB.contacts[idx] = entry; else DB.contacts.push(entry);
  persist(); closeModal('contact-modal'); renderContacts();
  ['ct-id','ct-name','ct-phone','ct-email','ct-address','ct-notes'].forEach(i => { const el=document.getElementById(i); if(el)el.value=''; });
  document.getElementById('contact-modal-title').textContent = 'Add Contact';
  showToast('📞 Saved!');
}
async function deleteContact(id) {
  if(!(await HQConfirm.ask('Delete this contact?', {danger:true})))return;
  DB.contacts = DB.contacts.filter(c => c.id !== id);
  persist(); renderContacts();
}

// ════════════════════════════════════════════════════════════
// DEADLINES
// ════════════════════════════════════════════════════════════
function renderDeadlines() {
  const el = document.getElementById('deadline-list');
  if (!DB.deadlines.length) { el.innerHTML = HQComponents.emptyState('📅', 'No deadlines tracked. Add renewals, registrations, expiry dates.'); return; }
  const sorted = [...DB.deadlines].sort((a,b) => new Date(a.date||'9999') - new Date(b.date||'9999'));
  el.innerHTML = '<div class="card"><div style="display:flex;flex-direction:column">' +
    sorted.map(d => {
      const days = daysUntil(d.date);
      const cls  = days === null ? 'ok' : days < 0 ? 'past' : days <= 14 ? 'urgent' : days <= 60 ? 'soon' : 'ok';
      return `<div class="deadline-item">
        <div style="font-size:18px;flex-shrink:0">${DL_CATS[d.cat]||'📋'}</div>
        <div class="deadline-info">
          <div class="deadline-name">${esc(d.name)}</div>
          <div class="deadline-meta">${fmtDate(d.date)}${d.notes?' · '+esc(d.notes.slice(0,50)):''}</div>
          <div class="la-planner-row">
            <button class="la-plan-btn" onclick="sendToPlanner('deadline','${d.id}','weekly')" title="Send to this week's planner">📆 This Week</button>
            <button class="la-plan-btn" onclick="sendToPlanner('deadline','${d.id}','monthly')" title="Send to monthly planner">🗓️ Monthly</button>
          </div>
        </div>
        <div class="deadline-days ${cls}">${daysLabel(days)||'—'}</div>
        <button onclick="deleteDeadline('${d.id}')" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:12px;flex-shrink:0">✕</button>
      </div>`;
    }).join('') + '</div></div>';
}
function saveDeadline() {
  const name = document.getElementById('dl-name').value.trim();
  const date = document.getElementById('dl-date').value;
  if (!name) { showToast('⚠️ Name required'); return; }
  const id = document.getElementById('dl-id').value || uid();
  const entry = { id, name, date, cat:document.getElementById('dl-cat').value, notes:document.getElementById('dl-notes').value.trim() };
  const idx = DB.deadlines.findIndex(d => d.id === id);
  if (idx >= 0) DB.deadlines[idx] = entry; else DB.deadlines.push(entry);
  persist(); closeModal('deadline-modal'); renderDeadlines();
  ['dl-id','dl-name','dl-date','dl-notes'].forEach(i => { const el=document.getElementById(i); if(el)el.value=''; });
  showToast('📅 Saved!');
}
function deleteDeadline(id) {
  DB.deadlines = DB.deadlines.filter(d => d.id !== id);
  persist(); renderDeadlines();
}

// ════════════════════════════════════════════════════════════
// WAITING ON
// ════════════════════════════════════════════════════════════
function renderWaiting() {
  const el = document.getElementById('waiting-list');
  const open = DB.waiting.filter(w => !w.resolved);
  const done = DB.waiting.filter(w => w.resolved);
  if (!DB.waiting.length) { el.innerHTML = HQComponents.emptyState('⏳', "No open loops. When you're waiting on someone, log it here and let your brain rest."); return; }
  const sorted = [...open].sort((a,b) => new Date(a.due||'9999') - new Date(b.due||'9999'));
  el.innerHTML = sorted.map(w => {
    const days = daysUntil(w.due);
    const overdue = days !== null && days < 0;
    return `<div class="wait-item${overdue?' overdue-wait':''}">
      <div class="wait-title">${esc(w.what)}</div>
      <div class="wait-meta">
        ${w.who ? `<span>👤 ${esc(w.who)}</span>` : ''}
        ${w.sent ? `<span>📤 Sent ${fmtDate(w.sent)}</span>` : ''}
        ${w.due  ? `<span style="color:${overdue?'var(--red)':'var(--muted)'}">${overdue?'⚠️ Expected':'📅 Expected'} ${fmtDate(w.due)}</span>` : ''}
      </div>
      ${w.notes ? `<div class="wait-note">${esc(w.notes)}</div>` : ''}
      <div style="display:flex;gap:6px;margin-top:8px">
        <button class="wait-status-btn" onclick="resolveWaiting('${w.id}')">✅ Resolved</button>
        <button class="doc-del-btn" onclick="deleteWaiting('${w.id}')">🗑</button>
      </div>
    </div>`;
  }).join('') +
  (done.length ? `<div style="font-size:10px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin:12px 0 7px">✅ Resolved (${done.length})</div>` +
    done.slice(0,5).map(w => `<div style="opacity:.55;font-size:11px;padding:5px 0;border-bottom:1px solid var(--border);color:var(--muted)">✅ ${esc(w.what)}</div>`).join('') : '');
}
function saveWaiting() {
  const what = document.getElementById('w-what').value.trim();
  if (!what) { showToast('⚠️ What are you waiting for?'); return; }
  const id = document.getElementById('w-id').value || uid();
  const entry = { id, what, who:document.getElementById('w-who').value.trim(), sent:document.getElementById('w-sent').value, due:document.getElementById('w-due').value, notes:document.getElementById('w-notes').value.trim(), resolved:false };
  const idx = DB.waiting.findIndex(w => w.id === id);
  if (idx >= 0) DB.waiting[idx] = entry; else DB.waiting.unshift(entry);
  persist(); closeModal('wait-modal'); renderWaiting();
  ['w-id','w-what','w-who','w-sent','w-due','w-notes'].forEach(i => { const el=document.getElementById(i); if(el)el.value=''; });
  showToast('⏳ Logged!');
}
function resolveWaiting(id) {
  const w = DB.waiting.find(x => x.id === id); if (w) w.resolved = true;
  persist(); renderWaiting(); showToast('✅ Resolved!');
}
function deleteWaiting(id) {
  DB.waiting = DB.waiting.filter(w => w.id !== id);
  persist(); renderWaiting();
}

// ════════════════════════════════════════════════════════════
// CALL PREP
// ════════════════════════════════════════════════════════════
function setCallAnxiety(level, btn) {
  _callAnxiety = level;
  document.querySelectorAll('#call-modal .fchip[data-anx]').forEach(b => b.classList.toggle('on', b.dataset.anx === level));
}
function renderCalls() {
  const el = document.getElementById('calls-list');
  if (!DB.calls.length) { el.innerHTML = HQComponents.emptyState('📵', 'No call prep cards yet. Add one before your next hard phone call.'); return; }
  el.innerHTML = DB.calls.map(c => {
    const acls = c.anxiety === 'high' ? 'high' : c.anxiety === 'medium' ? 'medium' : 'low';
    return `<div class="prep-card" id="call-${c.id}">
      <div class="prep-hd" onclick="document.getElementById('call-${c.id}').classList.toggle('open')">
        <span style="font-size:18px">📵</span>
        <div class="prep-title">${esc(c.who)}</div>
        ${c.number ? `<a href="tel:${esc(c.number)}" onclick="event.stopPropagation()" class="contact-link" style="font-size:10px">📱 Call</a>` : ''}
        <span class="prep-anxiety ${acls}">${c.anxiety==='high'?'😰 High':c.anxiety==='medium'?'😟 Medium':'😌 Low'}</span>
      </div>
      <div class="prep-body">
        ${c.opener ? `<div class="prep-field"><div class="prep-field-lbl">Opening line</div><div class="prep-field-val" style="font-weight:700;color:var(--text)">"${esc(c.opener)}"</div></div>` : ''}
        ${c.need   ? `<div class="prep-field"><div class="prep-field-lbl">I need</div><div class="prep-field-val">${esc(c.need)}</div></div>` : ''}
        ${c.anxiety_notes ? `<div class="prep-field"><div class="prep-field-lbl">Anxious about</div><div class="prep-field-val">${esc(c.anxiety_notes)}</div></div>` : ''}
        ${c.hold   ? `<div class="prep-field"><div class="prep-field-lbl">If on hold</div><div class="prep-field-val">${esc(c.hold)}</div></div>` : ''}
        <div style="display:flex;gap:6px;margin-top:9px">
          <button class="doc-edit-btn" onclick="openEditCall('${c.id}')">✏️ Edit</button>
          <button class="doc-del-btn" onclick="deleteCall('${c.id}')">🗑 Delete</button>
        </div>
      </div>
    </div>`;
  }).join('');
}
function openEditCall(id) {
  const c = DB.calls.find(x => x.id === id); if (!c) return;
  document.getElementById('call-modal-title').textContent = 'Edit Call Prep';
  document.getElementById('call-id').value      = id;
  document.getElementById('call-who').value     = c.who||'';
  document.getElementById('call-number').value  = c.number||'';
  document.getElementById('call-need').value    = c.need||'';
  document.getElementById('call-anxiety').value = c.anxiety_notes||'';
  document.getElementById('call-hold').value    = c.hold||'';
  document.getElementById('call-opener').value  = c.opener||'';
  _callAnxiety = c.anxiety || 'low';
  document.querySelectorAll('#call-modal .fchip[data-anx]').forEach(b => b.classList.toggle('on', b.dataset.anx === _callAnxiety));
  openModal('call-modal');
}
function saveCall() {
  const who = document.getElementById('call-who').value.trim();
  if (!who) { showToast('⚠️ Who are you calling?'); return; }
  const id = document.getElementById('call-id').value || uid();
  const entry = { id, who, number:document.getElementById('call-number').value.trim(), need:document.getElementById('call-need').value.trim(), anxiety_notes:document.getElementById('call-anxiety').value.trim(), hold:document.getElementById('call-hold').value.trim(), opener:document.getElementById('call-opener').value.trim(), anxiety:_callAnxiety };
  const idx = DB.calls.findIndex(c => c.id === id);
  if (idx >= 0) DB.calls[idx] = entry; else DB.calls.unshift(entry);
  persist(); closeModal('call-modal'); renderCalls();
  ['call-id','call-who','call-number','call-need','call-anxiety','call-hold','call-opener'].forEach(i => { const el=document.getElementById(i); if(el)el.value=''; });
  document.getElementById('call-modal-title').textContent = 'Call Prep Card';
  _callAnxiety = 'low';
  showToast('📵 Saved!');
}
function deleteCall(id) {
  DB.calls = DB.calls.filter(c => c.id !== id);
  persist(); renderCalls();
}

// ════════════════════════════════════════════════════════════
// APPOINTMENT HISTORY
// ════════════════════════════════════════════════════════════
function renderAppts() {
  const el = document.getElementById('appts-list');
  if (!DB.appts.length) { el.innerHTML = HQComponents.emptyState('🗒', 'No appointments logged. Add them after visits to keep a record of what was said.'); return; }
  const sorted = [...DB.appts].sort((a,b) => new Date(b.date||'0') - new Date(a.date||'0'));
  el.innerHTML = sorted.map(a => `<div class="appt-item appt-card" id="appt-${a.id}">
    <div class="appt-hd" onclick="document.getElementById('appt-${a.id}').classList.toggle('open')">
      <div class="appt-date">${fmtDate(a.date)}</div>
      <div class="appt-who">${esc(a.who)}${a.reason?' · <span style="font-weight:400;color:var(--muted)">'+esc(a.reason)+'</span>':''}</div>
      <button onclick="event.stopPropagation();deleteAppt('${a.id}')" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:12px">✕</button>
    </div>
    <div class="appt-body">
      ${a.notes    ? `<div class="prep-field"><div class="prep-field-lbl">Notes</div><div class="prep-field-val">${esc(a.notes)}</div></div>` : ''}
      ${a.followup ? `<div class="prep-field"><div class="prep-field-lbl">Follow-up</div><div class="prep-field-val" style="color:var(--orange);font-weight:700">${esc(a.followup)}</div></div>` : ''}
      <div class="la-planner-row" style="margin-top:8px">
        <button class="la-plan-btn" onclick="sendToPlanner('appt','${a.id}','weekly')">📆 Send to This Week</button>
        <button class="la-plan-btn" onclick="sendToPlanner('appt','${a.id}','monthly')">🗓️ Send to Monthly</button>
      </div>
    </div>
  </div>`).join('');
}
function saveAppt() {
  const who = document.getElementById('appt-who').value.trim();
  if (!who) { showToast('⚠️ Who is the appointment with?'); return; }
  const id = document.getElementById('appt-id').value || uid();
  const entry = { id, who, date:document.getElementById('appt-date').value, reason:document.getElementById('appt-reason').value.trim(), notes:document.getElementById('appt-notes').value.trim(), followup:document.getElementById('appt-followup').value.trim() };
  const idx = DB.appts.findIndex(a => a.id === id);
  if (idx >= 0) DB.appts[idx] = entry; else DB.appts.unshift(entry);
  persist(); closeModal('appt-modal'); renderAppts();
  ['appt-id','appt-who','appt-date','appt-reason','appt-notes','appt-followup'].forEach(i => { const el=document.getElementById(i); if(el)el.value=''; });
  showToast('🗒 Logged!');
}
function deleteAppt(id) {
  DB.appts = DB.appts.filter(a => a.id !== id);
  persist(); renderAppts();
}

// ════════════════════════════════════════════════════════════
// RESOURCES
// ════════════════════════════════════════════════════════════
function renderResources() {
  const filterEl = document.getElementById('res-filter-row');
  const cats = [...new Set(DB.resources.map(r => r.cat))];
  filterEl.innerHTML = ['all',...cats].map(k =>
    `<button class="fchip${_resFilter===k?' on':''}" onclick="setResFilter('${k}',this)">${k==='all'?'All':RES_CATS[k]||k}</button>`
  ).join('');
  const items = _resFilter === 'all' ? DB.resources : DB.resources.filter(r => r.cat === _resFilter);
  const el = document.getElementById('res-list');
  if (!items.length) { el.innerHTML = HQComponents.emptyState('📚', 'No resources yet. Add info you need frequently but always have to look up.'); return; }
  el.innerHTML = items.map(r => `<div class="res-item">
    <div class="res-cat-dot" style="background:${RES_COLORS[r.cat]||'#706090'}"></div>
    <div class="res-info">
      <div class="res-title">${esc(r.title)}</div>
      <div class="res-cat-badge">${RES_CATS[r.cat]||r.cat}</div>
      ${r.notes ? `<div class="res-note">${esc(r.notes)}</div>` : ''}
      ${r.url ? `<a href="${esc(r.url)}" target="_blank" rel="noopener" class="res-link">🔗 ${esc(r.url.replace(/^https?:\/\//,'').slice(0,50))}</a>` : ''}
    </div>
    <div style="display:flex;flex-direction:column;gap:5px;flex-shrink:0">
      <button class="doc-edit-btn" onclick="openEditRes('${r.id}')">✏️</button>
      <button class="doc-del-btn" onclick="deleteRes('${r.id}')">🗑</button>
    </div>
  </div>`).join('');
}
function setResFilter(cat) { _resFilter = cat; renderResources(); }
function openEditRes(id) {
  const r = DB.resources.find(x => x.id === id); if (!r) return;
  document.getElementById('res-modal-title').textContent = 'Edit Resource';
  document.getElementById('res-id').value    = id;
  document.getElementById('res-title').value = r.title||'';
  document.getElementById('res-cat').value   = r.cat||'other';
  document.getElementById('res-url').value   = r.url||'';
  document.getElementById('res-notes').value = r.notes||'';
  openModal('res-modal');
}
function saveResource() {
  const title = document.getElementById('res-title').value.trim();
  if (!title) { showToast('⚠️ Title required'); return; }
  const id = document.getElementById('res-id').value || uid();
  const entry = { id, title, cat:document.getElementById('res-cat').value, url:document.getElementById('res-url').value.trim(), notes:document.getElementById('res-notes').value.trim() };
  const idx = DB.resources.findIndex(r => r.id === id);
  if (idx >= 0) DB.resources[idx] = entry; else DB.resources.unshift(entry);
  persist(); closeModal('res-modal'); renderResources();
  ['res-id','res-title','res-url','res-notes'].forEach(i => { const el=document.getElementById(i); if(el)el.value=''; });
  document.getElementById('res-modal-title').textContent = 'Add Resource';
  showToast('📚 Saved!');
}
function deleteRes(id) {
  DB.resources = DB.resources.filter(r => r.id !== id);
  persist(); renderResources();
}

// ── INIT ─────────────────────────────────────────────────────
// NOTE: Tools tab removed in Phase 11 — migrated to Tool Vault (Admin Portals).
load();
renderDocs();

function openDeadlineModal() {
  document.getElementById('dl-id').value = '';
  document.getElementById('dl-name').value = '';
  document.getElementById('dl-date').value = todayStr();
  document.getElementById('dl-notes').value = '';
  openModal('deadline-modal');
}

// ── PHASE 6B ADMIN SETUP ────────────────────────────────────
function seedPhase6BAdmin(){
  if(!DB.adminSetup.documentLocations.length){
    DB.adminSetup.documentLocations = [
      { id: uid(), type:'physical', label:'Fire Safe' },
      { id: uid(), type:'digital', label:'Google Drive' }
    ];
  }
}
seedPhase6BAdmin();
persist();

// ════════════════════════════════════════════════════════════
//  PHASE 7B — LIFE ADMIN SETUP
//  Storage key: audhd-hq-life-admin-setup
//  Schema: { vaultLocations:[{id,type,label}], deadlineTemplates:[{id,name,cat,freq}] }
// ════════════════════════════════════════════════════════════

const LA_SETUP_KEY = HQKeys.LIFE_ADMIN_SETUP;

let _laSetup = {
  vaultLocations: [],      // [{id, type:'physical'|'digital', label}]
  deadlineTemplates: []    // [{id, name, cat, freq}]
};

function laSetupLoad() {
  try {
    const parsed = HQSafe.store.get(LA_SETUP_KEY, null);
    if (parsed && typeof parsed === 'object') {
      _laSetup = Object.assign({ vaultLocations: [], deadlineTemplates: [] }, parsed);
    }
  } catch(e) {}
}

function laSetupSave() {
  try { HQSafe.store.set(LA_SETUP_KEY, _laSetup); } catch(e) {}
}

// ── VAULT LOCATIONS ───────────────────────────────────────────
function laRenderVaults() {
  const el = document.getElementById('la-vault-list');
  if (!el) return;
  if (!_laSetup.vaultLocations.length) {
    el.innerHTML = '<div style="color:var(--muted);font-size:11px;padding:6px 0">No vault locations yet — add physical or digital storage spots above.</div>';
    return;
  }
  const typeIcon = t => t === 'physical' ? '📦' : '☁️';
  const typeName = t => t === 'physical' ? 'Physical' : 'Digital';
  el.innerHTML = _laSetup.vaultLocations.map(v => `
    <div class="la-setup-item">
      <span class="la-setup-item-badge">${typeIcon(v.type)} ${typeName(v.type)}</span>
      <span>${esc(v.label)}</span>
      <button class="la-setup-item-del" onclick="laRemoveVault('${v.id}')">✕</button>
    </div>`).join('');
}

function laAddVault() {
  const typeEl = document.getElementById('la-vault-type');
  const labelEl = document.getElementById('la-vault-label');
  if (!typeEl || !labelEl) return;
  const label = labelEl.value.trim();
  if (!label) { showToast('⚠️ Enter a location name'); return; }
  const type = typeEl.value;
  // dupe check
  if (_laSetup.vaultLocations.some(v => v.type === type && v.label.toLowerCase() === label.toLowerCase())) {
    showToast('Already exists'); return;
  }
  _laSetup.vaultLocations.push({ id: uid(), type, label });
  labelEl.value = '';
  laSetupSave();
  laRenderVaults();
  showToast('📍 Vault location added ✓');
}

function laRemoveVault(id) {
  _laSetup.vaultLocations = _laSetup.vaultLocations.filter(v => v.id !== id);
  laSetupSave();
  laRenderVaults();
}

// ── DEADLINE TEMPLATES ────────────────────────────────────────
const LA_FREQ_LABELS = {
  monthly: 'Monthly', quarterly: 'Quarterly',
  '6mo': 'Every 6 months', yearly: 'Yearly', '2yr': 'Every 2 years'
};
const LA_CAT_ICONS = {
  id:'🪪', vehicle:'🚗', insurance:'🛡', health:'💊',
  finance:'💰', home:'🏠', work:'💼', other:'📋'
};

function laRenderTemplates() {
  const el = document.getElementById('la-tmpl-list');
  if (!el) return;
  if (!_laSetup.deadlineTemplates.length) {
    el.innerHTML = '<div style="color:var(--muted);font-size:11px;padding:6px 0">No templates yet — add recurring deadline patterns above.</div>';
    return;
  }
  el.innerHTML = _laSetup.deadlineTemplates.map(t => `
    <div class="la-setup-item">
      <span class="la-setup-item-badge">${LA_CAT_ICONS[t.cat]||'📋'} ${LA_FREQ_LABELS[t.freq]||t.freq}</span>
      <span>${esc(t.name)}</span>
      <button class="la-setup-tmpl-spawn" onclick="laSpawnDeadline('${t.id}')">+ Spawn</button>
      <button class="la-setup-item-del" onclick="laRemoveTemplate('${t.id}')">✕</button>
    </div>`).join('');
}

function laAddTemplate() {
  const nameEl = document.getElementById('la-tmpl-name');
  const catEl  = document.getElementById('la-tmpl-cat');
  const freqEl = document.getElementById('la-tmpl-freq');
  if (!nameEl || !catEl || !freqEl) return;
  const name = nameEl.value.trim();
  if (!name) { showToast('⚠️ Template name required'); return; }
  _laSetup.deadlineTemplates.push({ id: uid(), name, cat: catEl.value, freq: freqEl.value });
  nameEl.value = '';
  laSetupSave();
  laRenderTemplates();
  showToast('📅 Template added ✓');
}

function laRemoveTemplate(id) {
  _laSetup.deadlineTemplates = _laSetup.deadlineTemplates.filter(t => t.id !== id);
  laSetupSave();
  laRenderTemplates();
}

// Spawn a real deadline from a template — pre-fills modal
function laSpawnDeadline(templateId) {
  const tmpl = _laSetup.deadlineTemplates.find(t => t.id === templateId);
  if (!tmpl) return;
  // calculate default due date based on freq
  const today = new Date();
  const freqDays = { monthly:30, quarterly:90, '6mo':182, yearly:365, '2yr':730 };
  const daysAhead = freqDays[tmpl.freq] || 365;
  const due = new Date(today.getTime() + daysAhead * 86400000).toISOString().split('T')[0];

  document.getElementById('dl-id').value = '';
  document.getElementById('dl-name').value = tmpl.name;
  document.getElementById('dl-cat').value = tmpl.cat;
  document.getElementById('dl-date').value = due;
  document.getElementById('dl-notes').value = `Template: ${LA_FREQ_LABELS[tmpl.freq]||tmpl.freq}`;
  openModal('deadline-modal');

  // switch to deadlines tab so modal makes sense in context
  const dlBtn = document.querySelector('.ntab[onclick*="deadlines"]');
  if (dlBtn) sw('deadlines', dlBtn);
}

// ── RENDER SETUP TAB ──────────────────────────────────────────
function laRenderSetup() {
  laRenderVaults();
  laRenderTemplates();
}

// ── EXPORT / RESTORE ──────────────────────────────────────────
function laExportSetup() {
  const blob = new Blob([JSON.stringify(_laSetup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `life-admin-setup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function laImportSetup(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const parsed = JSON.parse(e.target.result);
      _laSetup = Object.assign({ vaultLocations: [], deadlineTemplates: [] }, parsed);
      laSetupSave();
      laRenderSetup();
      showToast('✓ Life Admin setup restored');
    } catch(err) {
      showToast('❌ Could not parse file');
    }
  };
  reader.readAsText(file);
  input.value = '';
}

// Init
laSetupLoad();

// ── HQEnvironment (Tier 6 adoption) ───────────────────────────────────────
// In survival mode, hide resource/waiting tabs; keep docs, deadlines, calls, appts.
var _laSurvivalHidden = ['tab-waiting', 'doc-filter-row', 'contact-filter-row'];
function _laApplySurvival() {
  var inSurvival = window.HQEnvironment && HQEnvironment.isSurvival();
  _laSurvivalHidden.forEach(function(id) {
    var el = document.getElementById(id);
    if (!el) return;
    if (inSurvival) el.setAttribute('data-survival-hidden', '1');
    else            el.removeAttribute('data-survival-hidden');
  });
}
window.addEventListener('hq-environment-changed', _laApplySurvival);
_laApplySurvival();


// ── EXPOSE TO GLOBAL SCOPE (HTML onclick/oninput/onchange handlers) ──────────
// Functions inside this IIFE must be window-exported to be callable from HTML.
window.sw                = sw;
window.closeModal        = closeModal;
window.laAddTemplate     = laAddTemplate;
window.laAddVault        = laAddVault;
window.laExportSetup     = laExportSetup;
window.laImportSetup     = laImportSetup;
window.laRenderSetup     = laRenderSetup;
window.laSetupLoad       = laSetupLoad;
window.openDeadlineModal = openDeadlineModal;
window.openModal         = openModal;
window.saveAppt          = saveAppt;
window.saveCall          = saveCall;
window.saveContact       = saveContact;
window.saveDeadline      = saveDeadline;
window.saveDoc           = saveDoc;
window.saveResource      = saveResource;
window.saveWaiting       = saveWaiting;
window.setCallAnxiety    = setCallAnxiety;

})(); // end life-admin IIFE
