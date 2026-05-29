(function(){
  // Migrate ft-theme → audhd-hq-theme (one-time, preserves user's saved preference)
  try{
    const old=null;
    if(old && !HQSafe.store.get(HQKeys.THEME)){
      const t=['morning','afternoon','night'].includes(old)?old:null;
      if(t) HQSafe.store.set(HQKeys.THEME, {theme:t,manual:true});
    }
  }catch(e){}
  // Apply theme immediately
  try{
    const s=HQSafe.store.get(HQKeys.THEME);
    if(s&&s.theme){document.documentElement.setAttribute('data-theme',s.theme);return;}
  }catch(e){}
  document.documentElement.setAttribute('data-theme','lilac');
})();

(function () {
  'use strict';
  /* ── Phase C3: IIFE + strict mode wrap — money-brain (body, after theme IIFE) ── */


// ============================================================
//  MONEY BRAIN — AuDHD HQ
//  Stores: hq-money
//  Reads brain dump notes from: hq-money
//  Tag Engine: hq-tags
// ============================================================

const STORE    = HQKeys.FINANCE;
const BD_STORE = HQKeys.BRAINDUMP; // brain dump stores under this key

let DB = {bills:[], expenses:[], income:[], savings:[], transactions:[], notes:[], accounts:[], recurring:[], envelopes:[], financialGoals:[], subscriptions:[], debts:[]};
let charts = {};
let txFilter = 'all';

// ====== TAG ENGINE BRIDGE ======
function TE(){
  try{
    const db=HQSafe.store.get(HQKeys.TAGS);
    if(db&&typeof db==='object'){return{getCategories:()=>db.categories||[],getFlags:(g)=>(db.flags||{})[g]||[]};}
  }catch(e){}
  return{
    getCategories:()=>[
      {id:'work',name:'Work',emoji:'💼',color:'#645EB7'},
      {id:'health',name:'Health',emoji:'🏥',color:'#EF5886'},
      {id:'home',name:'Home',emoji:'🏠',color:'#8BB698'},
      {id:'personal',name:'Personal',emoji:'🌱',color:'#ABD7BF'},
      {id:'social',name:'Social',emoji:'💬',color:'#4ECDC4'},
      {id:'admin',name:'Admin',emoji:'📋',color:'#A8AAA9'},
      {id:'self',name:'Self & Growth',emoji:'🧠',color:'#C8BAFF'},
    ],
    getFlags:()=>[],
  };
}

// ====== LOAD / PERSIST ======
function load(){try{const _d=HQSafe.store.get(STORE);if(_d&&typeof _d==='object')DB=_d;}catch(e){}
  if(!DB||typeof DB!=='object')DB={bills:[],expenses:[],income:[],savings:[],transactions:[],notes:[]};  if(!DB.bills)DB.bills=[];if(!DB.expenses)DB.expenses=[];if(!DB.income)DB.income=[];if(!DB.savings)DB.savings=[];if(!DB.transactions)DB.transactions=[];if(!DB.notes)DB.notes=[];if(!DB.accounts)DB.accounts=[];if(!DB.recurring)DB.recurring=[];if(!DB.envelopes)DB.envelopes=[];if(!DB.financialGoals)DB.financialGoals=[];if(!DB.subscriptions)DB.subscriptions=[];if(!DB.debts)DB.debts=[];
}
function persist(){HQSafe.store.set(STORE, DB);updateHeader();moneyFlagCheck();}
const uid = () => HQUtils.uid(); // → HQUtils.uid
const todayStr = () => (window.HQDate ? HQDate.today() : (() => { const d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); })()); // aliased → HQDate.today

// ====== LOCALSTORAGE MIGRATION SHIM ======
(function migrateFinance(){
  if(HQSafe.store.get(HQKeys.MONEY_MIGRATED_V2)) return;
  // Migrate old finance-tracker key variations to canonical key
  ['ft-data','finance-tracker-data','hq-finance'].forEach(function(old){
    var d=HQSafe.store.get(old);
    if(d && !HQSafe.store.get(HQKeys.FINANCE)){ HQSafe.store.set(HQKeys.FINANCE,d); }
    HQSafe.store.remove(old);
  });
  // Migrate old tags key variations
  ['hq-tags'].forEach(function(old){
    var d=HQSafe.store.get(old);
    if(d && !HQSafe.store.get(HQKeys.TAGS)){ HQSafe.store.set(HQKeys.TAGS,d); }
    HQSafe.store.remove(old);
  });
  // Migrate old theme key ft-theme → audhd-hq-theme (value preserved, then removed)
  // Note: early head script handles this too, but we still clean up here
  ['ft-theme'].forEach(function(k){ HQSafe.store.remove(k); });
  HQSafe.store.set(HQKeys.MONEY_MIGRATED_V2, '1');
})();

// Sidenav: hqOpenSidenav/hqCloseSidenav from hq-core.js
// ====== MONEY HELPERS ======
function toMonthly(amount, freq){
  const f={monthly:1,weekly:52/12,biweekly:26/12,annual:1/12,quarterly:4/12,'one-time':0};
  return amount*(f[freq]||1);
}
function fmt$(n){
  if(n===null||n===undefined||isNaN(n))return'$—';
  const abs=Math.abs(n);
  const s=abs.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
  return(n<0?'-':'')+'$'+s;
}
function calcTotals(){
  const income=DB.income.reduce((a,i)=>a+toMonthly(+i.amount||0,i.frequency),0);
  const bills=DB.bills.reduce((a,b)=>a+toMonthly(+b.amount||0,b.frequency),0);
  const expenses=DB.expenses.reduce((a,e)=>a+toMonthly(+e.amount||0,e.frequency),0);
  const out=bills+expenses;
  return{income,bills,expenses,out,balance:income-out};
}

// ====== HEADER ======
function updateHeader(){
  const{income,out,balance}=calcTotals();
  document.getElementById('hp-income').innerHTML=`💵 Income: <strong>${fmt$(income)}</strong>`;
  document.getElementById('hp-bills').innerHTML=`📋 Out: <strong>${fmt$(out)}</strong>`;
  const sv=document.getElementById('hp-surplus-val');
  sv.textContent=fmt$(balance);
  sv.style.color=balance>=0?'var(--green)':'var(--red)';
  const pill=document.getElementById('hp-surplus');
  pill.className='pill '+(balance>=0?'surplus':'deficit');
}

// ====== TABS ======

// ====== POPULATE FORM SELECTS ======
function populateFormSelects(){
  const te=TE();
  const catSel=document.getElementById('im-cat');
  catSel.innerHTML='<option value="">— Category —</option>'+
    te.getCategories().map(c=>`<option value="${c.id}">${c.emoji} ${esc(c.name)}</option>`).join('');
  const cFlags=te.getFlags('custom');
  const fw=document.getElementById('im-flags-wrap');
  const fl=document.getElementById('im-flags');
  fw.style.display=cFlags.length?'flex':'none';
  fl.innerHTML=cFlags.map(f=>`<button class="tchip" data-flag="${f.id}" onclick="this.classList.toggle('on')">${f.emoji} ${esc(f.name)}</button>`).join('');
}

// ====== ADD / EDIT ITEMS ======
function openAddItem(section){
  populateFormSelects();
  document.getElementById('im-title').textContent=`➕ Add ${section==='bill'?'Bill':section==='expense'?'Expense':section==='income'?'Income Source':'Transaction'}`;
  document.getElementById('im-name').value='';
  document.getElementById('im-amount').value='';
  document.getElementById('im-type').value=section==='tx'?'tx':section==='income'?'income':section==='bill'?'bill':'expense';
  document.getElementById('im-freq').value='monthly';
  document.getElementById('im-date').value='';
  document.getElementById('im-cat').value='';
  document.getElementById('im-emoji').value='';
  document.getElementById('im-notes').value='';
  document.getElementById('im-autopay').checked=false;
  document.getElementById('im-edit-id').value='';
  document.getElementById('im-section').value=section;
  document.querySelectorAll('#im-flags .tchip.on').forEach(b=>b.classList.remove('on'));
  openModal('item-modal');
  setTimeout(()=>document.getElementById('im-name').focus(),150);
}

function openEditItem(section,id){
  populateFormSelects();
  const list=DB[section==='tx'?'transactions':section+'s']||[];
  const item=list.find(x=>x.id===id);if(!item)return;
  document.getElementById('im-title').textContent='✏️ Edit Item';
  document.getElementById('im-name').value=item.name||'';
  document.getElementById('im-amount').value=item.amount||'';
  document.getElementById('im-type').value=item.type||section;
  document.getElementById('im-freq').value=item.frequency||'monthly';
  document.getElementById('im-date').value=item.dueDate||item.date||'';
  document.getElementById('im-cat').value=item.category||'';
  document.getElementById('im-emoji').value=item.emoji||'';
  document.getElementById('im-notes').value=item.notes||'';
  document.getElementById('im-autopay').checked=!!item.autopay;
  document.getElementById('im-edit-id').value=id;
  document.getElementById('im-section').value=section;
  (item.flags||[]).forEach(f=>{const el=document.querySelector(`#im-flags [data-flag="${f}"]`);if(el)el.classList.add('on');});
  openModal('item-modal');
}

function saveItem(){
  const name=document.getElementById('im-name').value.trim();
  if(!name)return;
  const section=document.getElementById('im-section').value;
  const editId=document.getElementById('im-edit-id').value;
  const flags=[...document.querySelectorAll('#im-flags .tchip.on')].map(b=>b.dataset.flag);
  const item={
    id:editId||uid(),name,
    amount:parseFloat(document.getElementById('im-amount').value)||0,
    type:document.getElementById('im-type').value,
    frequency:document.getElementById('im-freq').value,
    dueDate:document.getElementById('im-date').value||null,
    date:document.getElementById('im-date').value||null,
    category:document.getElementById('im-cat').value||null,
    emoji:document.getElementById('im-emoji').value.trim()||null,
    notes:document.getElementById('im-notes').value.trim()||null,
    autopay:document.getElementById('im-autopay').checked,
    flags,paid:false,
    saved:new Date().toISOString(),
  };
  const listKey=section==='tx'?'transactions':section+'s';
  if(!DB[listKey])DB[listKey]=[];
  if(editId){const i=DB[listKey].findIndex(x=>x.id===editId);if(i!==-1)DB[listKey][i]=item;else DB[listKey].push(item);}
  else DB[listKey].push(item);
  persist();closeModal('item-modal');
  if(section==='bill') renderSection('bills');
  else if(section==='expense') renderSection('expenses');
  else if(section==='income') renderSection('income');
  else renderTransactions();
  renderOverview();
  showToast('💰 Saved!');
}

async function delItem(section,id){
  if(!(await HQConfirm.ask('Delete this item?', {danger:true})))return;
  const listKey=section==='tx'?'transactions':section+'s';
  DB[listKey]=(DB[listKey]||[]).filter(x=>x.id!==id);
  persist();
  if(section==='bill') renderSection('bills');
  else if(section==='expense') renderSection('expenses');
  else if(section==='income') renderSection('income');
  else renderTransactions();
  renderOverview();
  showToast('🗑️ Deleted');
}

function togglePaid(section,id){
  const listKey=section+'s';
  const item=(DB[listKey]||[]).find(x=>x.id===id);if(!item)return;
  item.paid=!item.paid;
  item.paidDate=item.paid?todayStr():null;
  persist();renderSection(section);renderOverview();
  showToast(item.paid?'✅ Marked paid':'🔄 Unmarked');
}

// ====== RENDER SECTIONS ======
function renderSection(section){
  const listKey=section==='tx'?'transactions':section+'s';
  const items=DB[listKey]||[];
  const elId=`${section==='tx'?'transaction':section}s-list`;
  const el=document.getElementById(elId);
  if(!el)return;
  if(!items.length){el.innerHTML=`<div class="empty"><div class="empty-ic">💸</div>No ${section}s logged yet.</div>`;return;}
  const te=TE();
  const today=todayStr();
  el.innerHTML=[...items].sort((a,b)=>(safeDate(a)||'').localeCompare(safeDate(b)||'')).map(item=>{
    const cat=te.getCategories().find(c=>c.id===item.category);
    const monthlyAmt=toMonthly(item.amount,item.frequency);
    const isOut=section!=='income';
    const dueIn=item.dueDate?Math.ceil((new Date(item.dueDate+'T12:00:00')-new Date())/(1000*60*60*24)):null;
    const overdue=dueIn!==null&&dueIn<0&&!item.paid;
    const soon=dueIn!==null&&dueIn>=0&&dueIn<=7&&!item.paid;
    return`<div class="fin-item" id="fi-${item.id}">
      <div class="fi-hd" onclick="document.getElementById('fi-${item.id}').classList.toggle('open')">
        <div class="fi-em">${item.emoji||cat?.emoji||'💸'}</div>
        ${cat?`<div class="fi-cat-dot" style="background:${cat.color}"></div>`:''}
        <div class="fi-info">
          <div class="fi-name">${esc(item.name)}</div>
          <div class="fi-meta">
            <span>${item.frequency||'one-time'}</span>
            ${cat?`<span>${cat.emoji} ${cat.name}</span>`:''}
            ${item.dueDate?`<span>Due ${fmtDate(item.dueDate)}</span>`:''}
            ${overdue?`<span class="fi-badge badge-overdue">Overdue</span>`:''}
            ${soon?`<span class="fi-badge badge-soon">Due in ${dueIn}d</span>`:''}
            ${item.paid?`<span class="fi-badge badge-paid">✓ Paid</span>`:''}
            ${item.autopay?`<span class="fi-badge badge-auto">♻️ Auto</span>`:''}
          </div>
        </div>
        <div class="fi-amount ${isOut?'outgoing':'incoming'}">${fmt$(item.amount)}</div>
        <div class="fi-actions" onclick="event.stopPropagation()">
          ${section==='bill'||section==='expense'?`<button class="btn-sm pay" onclick="togglePaid('${section}','${item.id}')">${item.paid?'↩':'✓'}</button>`:''}
          <button class="btn-sm" onclick="openEditItem('${section}','${item.id}')">✏️</button>
          <button class="btn-sm del" onclick="delItem('${section}','${item.id}')">🗑️</button>
        </div>
        <div class="fi-ar">▼</div>
      </div>
      <div class="fi-body">
        <div style="display:flex;gap:12px;flex-wrap:wrap;font-size:11px;color:var(--muted);margin-top:8px">
          <span>Monthly equiv: <strong style="color:var(--text)">${fmt$(monthlyAmt)}</strong></span>
          ${item.notes?`<span>📝 ${esc(item.notes)}</span>`:''}
        </div>
        ${(item.flags||[]).length?`<div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:6px">${item.flags.map(f=>{const tf=TE().getFlags('custom').find(x=>x.id===f);return tf?`<span style="font-size:9px;font-weight:700;padding:2px 6px;border-radius:5px;background:${tf.color}15;color:${tf.color};border:1px solid ${tf.color}25">${tf.emoji} ${esc(tf.name)}</span>`:''}).join('')}</div>`:''}
      </div>
    </div>`;
  }).join('');
}

// ====== SAVINGS ======
function openAddGoal(){
  document.getElementById('gm-title').textContent='🎯 Add Savings Goal';
  document.getElementById('gm-name').value='';
  document.getElementById('gm-emoji').value='';
  document.getElementById('gm-target').value='';
  document.getElementById('gm-saved').value='';
  document.getElementById('gm-monthly').value='';
  document.getElementById('gm-notes').value='';
  document.getElementById('gm-edit-id').value='';
  openModal('goal-modal');
  setTimeout(()=>document.getElementById('gm-name').focus(),150);
}
function saveGoal(){
  const name=document.getElementById('gm-name').value.trim();if(!name)return;
  const editId=document.getElementById('gm-edit-id').value;
  const goal={
    id:editId||uid(),name,
    emoji:document.getElementById('gm-emoji').value.trim()||'🎯',
    target:parseFloat(document.getElementById('gm-target').value)||0,
    saved:parseFloat(document.getElementById('gm-saved').value)||0,
    monthly:parseFloat(document.getElementById('gm-monthly').value)||0,
    notes:document.getElementById('gm-notes').value.trim(),
    created:new Date().toISOString(),
  };
  if(editId){const i=DB.savings.findIndex(x=>x.id===editId);if(i!==-1)DB.savings[i]=goal;else DB.savings.push(goal);}
  else DB.savings.push(goal);
  persist();closeModal('goal-modal');renderSavings();renderOverview();
  showToast('🎯 Goal saved!');
}
async function delGoal(id){
  if(!(await HQConfirm.ask('Delete this savings goal?', {danger:true})))return;
  DB.savings=DB.savings.filter(x=>x.id!==id);persist();renderSavings();renderOverview();showToast('🗑️ Goal deleted');
}
function updateGoalSaved(id){
  const g=DB.savings.find(x=>x.id===id);if(!g)return;
  const inp=document.getElementById('saved-inp-'+id);
  const v=parseFloat(inp?.value);if(isNaN(v))return;
  g.saved=v;persist();renderSavings();showToast('💰 Saved amount updated!');
}
function renderSavings(){
  const el=document.getElementById('savings-list');
  document.getElementById('ov-goals-n').textContent=DB.savings.length;
  if(!DB.savings.length){el.innerHTML='<div class="empty"><div class="empty-ic">🎯</div>No savings goals yet.</div>';return;}
  el.innerHTML=DB.savings.map(g=>{
    const pct=g.target?Math.min(100,Math.round(g.saved/g.target*100)):0;
    const remaining=g.target-g.saved;
    const months=g.monthly>0?Math.ceil(remaining/g.monthly):null;
    return`<div class="goal-card">
      <div class="goal-hd">
        <div class="goal-em">${g.emoji}</div>
        <div class="goal-name">${esc(g.name)}</div>
        <div class="goal-pct">${pct}%</div>
        <div style="display:flex;gap:5px">
          <button class="btn-sm" onclick="openEditGoalForm('${g.id}')">✏️</button>
          <button class="btn-sm del" onclick="delGoal('${g.id}')">🗑️</button>
        </div>
      </div>
      <div class="rb-track"><div class="rb-fill" style="width:${pct}%"></div></div>
      <div class="goal-amounts">
        <span class="goal-saved">${fmt$(g.saved)} saved</span>
        <span class="goal-target">${fmt$(g.target)} target</span>
      </div>
      ${months?`<div class="goal-eta">⏱️ ~${months} month${months!==1?'s':''} at ${fmt$(g.monthly)}/mo · ${fmt$(remaining)} to go</div>`:''}
      ${g.notes?`<div style="font-size:10px;color:var(--muted);margin-top:5px;font-style:italic">${esc(g.notes)}</div>`:''}
      <div style="display:flex;gap:7px;align-items:center;margin-top:9px;flex-wrap:wrap">
        <span style="font-size:10px;color:var(--muted)">Update saved amount:</span>
        <input id="saved-inp-${g.id}" class="fin" style="width:100px;padding:5px 8px;font-size:12px" type="number" min="0" value="${g.saved}" placeholder="${g.saved}">
        <button class="btn-p" style="padding:5px 12px;font-size:11px" onclick="updateGoalSaved('${g.id}')">Save</button>
      </div>
    </div>`;
  }).join('');
}
function openEditGoalForm(id){
  const g=DB.savings.find(x=>x.id===id);if(!g)return;
  document.getElementById('gm-title').textContent='✏️ Edit Goal';
  document.getElementById('gm-name').value=g.name;
  document.getElementById('gm-emoji').value=g.emoji||'🎯';
  document.getElementById('gm-target').value=g.target||'';
  document.getElementById('gm-saved').value=g.saved||'';
  document.getElementById('gm-monthly').value=g.monthly||'';
  document.getElementById('gm-notes').value=g.notes||'';
  document.getElementById('gm-edit-id').value=id;
  openModal('goal-modal');
}

// ====== TRANSACTIONS ======
let txFilterState='all';
function setTxFilter(f,btn){
  txFilterState=f;
  document.querySelectorAll('#tab-transactions .fchip').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on');renderTransactions();
}
function renderTransactions(){
  document.getElementById('ov-tx-n').textContent=DB.transactions.length;
  let items=[...DB.transactions].sort((a,b)=>(safeDate(b)||'').localeCompare(safeDate(a)||''));
  if(txFilterState==='in') items=items.filter(i=>i.type==='income');
  else if(txFilterState==='out') items=items.filter(i=>i.type!=='income');
  const el=document.getElementById('tx-list');
  if(!items.length){el.innerHTML='<div class="empty"><div class="empty-ic">💳</div>No transactions logged.</div>';return;}
  const te=TE();
  el.innerHTML=items.map(tx=>{
    const cat=te.getCategories().find(c=>c.id===tx.category);
    const isIn=tx.type==='income';
    return`<div class="tx-item">
      <div class="tx-em">${tx.emoji||cat?.emoji||'💸'}</div>
      ${cat?`<div class="tx-cat-dot" style="background:${cat.color}"></div>`:''}
      <div class="tx-info">
        <div class="tx-name">${esc(tx.name)}</div>
        <div class="tx-meta">
          ${safeDate(tx)?`<span>${fmtDate(safeDate(tx))}</span>`:''}
          ${cat?`<span>${cat.emoji} ${cat.name}</span>`:''}
          ${tx.notes?`<span>${esc(tx.notes.slice(0,40))}</span>`:''}
        </div>
      </div>
      <div class="tx-amount ${isIn?'in':'out'}">${isIn?'+':'-'}${fmt$(tx.amount)}</div>
      <button class="btn-sm del" onclick="delItem('tx','${tx.id}')">🗑️</button>
    </div>`;
  }).join('');
}

// ====== FINANCE NOTES (from Brain Dump routing) ======
function renderBDNotes(){
  // Source 1: DB.notes — entries written by brain-dump finance route (new)
  const finNotes = (DB.notes||[]).map(n=>({...n, _src:'finance'}));

  // Source 2: legacy — BD log entries that were routed to finance (old schema)
  let bdAll=[];
  try{const _bd=HQSafe.store.get(BD_STORE);if(Array.isArray(_bd))bdAll=_bd;}catch(e){}
  const bdFinance = bdAll
    .filter(n=>n.route==='finance' && !finNotes.find(x=>x.bdEntryId===n.id))
    .map(n=>({id:n.id,text:n.text,date:n.date||n.at?.split('T')[0],at:n.at,_src:'bd'}));

  // Merge and sort newest first
  const notes=[...finNotes,...bdFinance].sort((a,b)=>(b.at||'').localeCompare(a.at||''));

  const panel=document.getElementById('bd-notes-panel');
  const list=document.getElementById('bd-notes-list');
  if(!notes.length){if(panel)panel.style.display='none';return;}
  if(panel)panel.style.display='block';
  list.innerHTML=notes.map(n=>`<div class="bdn-item">
    <div style="flex:1">
      <span>${esc(n.text)}</span>
      ${n.categoryName?`<span style="font-size:9px;color:var(--muted);margin-left:6px">${n.categoryName}</span>`:''}
    </div>
    <span class="bdn-time">${fmtDate(n.date||n.at?.split('T')[0])}</span>
    <button class="bdn-del" onclick="dismissNote('${n.id}','${n._src}')">✕</button>
  </div>`).join('');
}

function dismissNote(id, src){
  try{
    if(src==='finance'){
      DB.notes=DB.notes.filter(n=>n.id!==id);
      persist();
    } else {
      let bdAll=[];try{const _bd=HQSafe.store.get(BD_STORE);if(Array.isArray(_bd))bdAll=_bd;}catch(e){}
      bdAll=bdAll.filter(n=>n.id!==id);
      HQSafe.store.set(BD_STORE, bdAll);
    }
    renderBDNotes();
  }catch(e){}
}

// Keep old dismissBDNote as alias for any inline onclick in existing HTML
function dismissBDNote(id){dismissNote(id,'bd');}

// ====== OVERVIEW ======
function renderOverview(){
  const{income,bills,expenses,out,balance}=calcTotals();
  document.getElementById('ov-income').textContent=fmt$(income);
  document.getElementById('ov-out').textContent=fmt$(out);
  const balEl=document.getElementById('ov-balance');
  balEl.textContent=fmt$(balance);
  balEl.className='snap-val '+(balance>=0?'surplus':'deficit');
  const pct=income>0?Math.min(100,Math.round(out/income*100)):0;
  document.getElementById('ov-bar').style.width=pct+'%';
  document.getElementById('ov-bar-lbl-l').textContent=pct+'% spent';
  document.getElementById('ov-bar-lbl-r').textContent=`of ${fmt$(income)} income`;
  document.getElementById('ov-bills-n').textContent=DB.bills.length;
  document.getElementById('ov-exp-n').textContent=DB.expenses.length;
  document.getElementById('ov-goals-n').textContent=DB.savings.length;
  document.getElementById('ov-tx-n').textContent=DB.transactions.length;
  renderUpcoming();
  renderBDNotes();
  renderCharts(income,out,balance);
  renderSafeSpend();
  calcAdhdTax();
}

function renderUpcoming(){
  const today=new Date();
  const in7=new Date();in7.setDate(today.getDate()+7);
  const all=[...DB.bills,...DB.expenses].filter(item=>{
    if(!item.dueDate)return false;
    const d=new Date(item.dueDate+'T12:00:00');
    return d<=in7||(!item.paid&&d<today);
  }).sort((a,b)=>a.dueDate.localeCompare(b.dueDate));
  const el=document.getElementById('ov-upcoming');
  if(!all.length){el.innerHTML='<div style="color:var(--muted);font-size:12px;font-style:italic;padding:8px 0">No bills due in the next 7 days.</div>';return;}
  el.innerHTML=all.map(item=>{
    const d=new Date(item.dueDate+'T12:00:00');
    const daysUntil=Math.ceil((d-new Date())/(1000*60*60*24));
    const overdue=daysUntil<0;
    return`<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);font-size:12px">
      <span style="font-size:16px">${item.emoji||'💸'}</span>
      <div style="flex:1"><div style="font-weight:600">${esc(item.name)}</div><div style="font-size:10px;color:var(--muted)">${fmtDate(item.dueDate)}</div></div>
      <div style="font-weight:900;color:${overdue?'var(--red)':'var(--text)'};">${fmt$(item.amount)}</div>
      ${overdue?`<span class="fi-badge badge-overdue">Overdue ${Math.abs(daysUntil)}d</span>`:
        daysUntil<=3?`<span class="fi-badge badge-soon">${daysUntil}d</span>`:''}
      ${item.paid?`<span class="fi-badge badge-paid">✓</span>`:
        `<button class="btn-sm pay" onclick="togglePaid('${item.type||'bill'}','${item.id}')">✓ Pay</button>`}
    </div>`;
  }).join('');
}

function renderCharts(income,out,balance){
  const te=TE();
  // Category breakdown
  const catMap={};
  [...DB.bills,...DB.expenses].forEach(item=>{
    const cat=te.getCategories().find(c=>c.id===item.category);
    const label=cat?`${cat.emoji} ${cat.name}`:'Other';
    catMap[label]=(catMap[label]||0)+toMonthly(item.amount,item.frequency);
  });
  const catE=Object.entries(catMap).sort((a,b)=>b[1]-a[1]).slice(0,7);
  const CPAL=['#645EB7','#EF5886','#E86840','#C49A00','#2A8A85','#2A7A4E','#A8AAA9'];
  dc('ch-cats',new Chart(document.getElementById('ch-cats'),{
    type:'doughnut',
    data:{labels:catE.map(([k])=>k),datasets:[{data:catE.map(([,v])=>Math.round(v*100)/100),backgroundColor:CPAL,borderColor:getComputedStyle(document.documentElement).getPropertyValue('--card').trim()||'#1a1535',borderWidth:2}]},
    options:{responsive:true,maintainAspectRatio:false,cutout:'55%',plugins:{legend:{labels:{color:getComputedStyle(document.documentElement).getPropertyValue('--text2').trim()||'#a0a0cc',font:{size:10},boxWidth:10}}}}
  }));
  // Balance bar
  dc('ch-balance',new Chart(document.getElementById('ch-balance'),{
    type:'bar',
    data:{labels:['Income','Bills','Expenses','Balance'],datasets:[{data:[income,-DB.bills.reduce((a,b)=>a+toMonthly(b.amount,b.frequency),0),-DB.expenses.reduce((a,e)=>a+toMonthly(e.amount,e.frequency),0),balance],backgroundColor:[income>0?'rgba(42,122,78,.7)':'rgba(181,48,48,.7)','rgba(181,48,48,.6)','rgba(201,96,32,.6)',balance>=0?'rgba(42,138,133,.7)':'rgba(181,48,48,.7)'],borderRadius:5}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{color:'#789A88',font:{size:10}},grid:{color:'rgba(100,100,100,.15)'},border:{display:false}},y:{ticks:{color:'#789A88',font:{size:10}},grid:{color:'rgba(100,100,100,.15)'},border:{display:false}}}}
  }));
}

function dc(id,inst){if(charts[id])charts[id].destroy();charts[id]=inst;}

// ====== MODAL ======
function openModal(id){document.getElementById(id).classList.add('show');}
function closeModal(id){document.getElementById(id).classList.remove('show');}

// ====== IMPORT / EXPORT ======
function exportData(){
  const blob=new Blob([JSON.stringify({_meta:{source:'AuDHD HQ — Money Brain',exportedAt:new Date().toISOString()},...DB},null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);
  a.download=`money-brain-${todayStr()}.json`;a.click();
  showToast('✅ Exported!');
}
async function importData(input,mode){
  const file=input.files[0];if(!file)return;
  const r=new FileReader();
  r.onload=async e=>{
    try{
      const p=JSON.parse(e.target.result);
      if(mode==='replace'){if(!(await HQConfirm.ask('Replace all finance data?', {danger:true})))return;DB={bills:p.bills||[],expenses:p.expenses||[],income:p.income||[],savings:p.savings||[],transactions:p.transactions||[],notes:p.notes||[]};}
      else{['bills','expenses','income','savings','transactions','notes'].forEach(k=>{const eIds=new Set((DB[k]||[]).map(x=>x.id));(p[k]||[]).filter(x=>!eIds.has(x.id)).forEach(x=>(DB[k]=DB[k]||[]).push(x));});}
      persist();renderOverview();closeModal('ie-modal');showToast('✅ Import complete!');
    }catch(err){HQToast.error('❌ Invalid file. Could not read.');}
  };r.readAsText(file);input.value='';
}

// ====== UTILS ======
const esc = s => HQUtils.esc(s); // → HQUtils.esc
function fmtDate(s){if(!s)return'';return new Date(s+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'});}

// Safely resolve a stored entry's date — never falls back to today
function safeDate(entry){
  if(entry.date) return entry.date;
  if(entry.dueDate) return entry.dueDate;
  if(entry.saved) return entry.saved.split('T')[0];
  if(entry.at) return entry.at.split('T')[0];
  return null;
}

// ====== HQ FLAG INTEGRATION ======
// Flags budget overruns + savings milestones to index Hero2
function moneyFlagCheck(){
  if(typeof hqFlag !== 'function') return; // hq-core.js not loaded yet
  const{income,out,balance}=calcTotals();
  const now=Date.now();

  // Flag budget overrun (spending exceeds income)
  if(income>0 && balance<0){
    hqFlag({
      id:'money-overrun',
      source:'money-brain',
      type:'urgent',
      text:'Budget gap visible — spending over income by '+fmt$(Math.abs(balance))+'/mo',
      href:'money-brain.html',
      ts:now
    });
  } else {
    if(typeof hqUnflag==='function') hqUnflag('money-overrun');
  }

  // Flag overdue bills
  const today=todayStr();
  DB.bills.concat(DB.expenses).forEach(function(item){
    if(item.dueDate && item.dueDate<today && !item.paid){
      hqFlag({
        id:'money-overdue-'+item.id,
        source:'money-brain',
        type:'pastdue',
        text:item.name+' coming up ('+fmt$(item.amount)+')',
        href:'money-brain.html',
        ts:now
      });
    } else {
      if(typeof hqUnflag==='function') hqUnflag('money-overdue-'+item.id);
    }
  });

  // Flag savings goals that hit 100%
  DB.savings.forEach(function(g){
    if(g.target>0 && g.saved>=g.target){
      hqFlag({
        id:'money-goal-done-'+g.id,
        source:'money-brain',
        type:'reminder',
        text:'🎉 Savings goal reached: '+g.name+'!',
        href:'money-brain.html',
        ts:now
      });
    }
  });
}

load();
updateHeader();
renderOverview();

// ── SAFE-TO-SPEND VIEW ────────────────────────────────────────────
let _hideRawBalance = false;
function renderSafeSpend() {
  const el = document.getElementById('safe-spend-card');
  if(!el) return;
  const {income, out} = calcTotals();
  const in7 = new Date(); in7.setDate(in7.getDate()+7);
  const upcoming7 = [...DB.bills,...DB.expenses].filter(b => {
    if(!b.dueDate) return false;
    const d = new Date(b.dueDate+'T12:00:00');
    return d <= in7 && !b.paid;
  }).reduce((a,b) => a + (+b.amount||0), 0);
  const profile = HQSafe.store.get(HQKeys.PROFILE, {});
  const buffer = parseFloat(profile.chaosBuffer || 200);
  // safe = monthly balance - upcoming 7d bills - buffer
  const monthlyBalance = income - out;
  const safe = monthlyBalance - upcoming7 - buffer;
  document.getElementById('safe-spend-num').textContent = fmt$(Math.max(0, safe));
  document.getElementById('safe-spend-formula').textContent =
    `Monthly surplus ${fmt$(monthlyBalance)} − next 7d bills ${fmt$(upcoming7)} − buffer ${fmt$(buffer)}`;
}

function toggleSafeView() {
  _hideRawBalance = !_hideRawBalance;
  const pills = document.querySelectorAll('.hp-balance-raw');
  pills.forEach(p => p.style.filter = _hideRawBalance ? 'blur(6px)' : 'none');
  const btn = document.getElementById('safe-toggle-btn');
  if(btn) btn.textContent = _hideRawBalance ? '👁 Show balance' : '🙈 Hide balance';
}

// ── BILL PANIC MODE ───────────────────────────────────────────────
function openPanicMode() {
  const in7 = new Date(); in7.setDate(in7.getDate()+7);
  const urgent = [...DB.bills,...DB.expenses].filter(b => {
    if(!b.dueDate || b.paid) return false;
    const d = new Date(b.dueDate+'T12:00:00');
    return d <= in7;
  }).sort((a,b) => a.dueDate.localeCompare(b.dueDate));
  const total = urgent.reduce((a,b) => a+(+b.amount||0), 0);
  document.getElementById('panic-total').textContent = fmt$(total) + ' total due';
  const el = document.getElementById('panic-list');
  if(!el) return;
  if(!urgent.length) {
    el.innerHTML = '<div style="text-align:center;color:var(--green);font-weight:800;padding:12px">✅ Nothing urgent due this week!</div>';
  } else {
    el.innerHTML = urgent.map(b => {
      const daysLeft = Math.ceil((new Date(b.dueDate+'T12:00:00') - new Date()) / 86400000);
      return `<div class="panic-item">
        <span style="font-size:16px">${b.emoji||'💳'}</span>
        <div style="flex:1"><div style="font-weight:700">${b.name}</div>
          <div style="font-size:10px;color:var(--muted)">${daysLeft<=0?'Overdue!':daysLeft===1?'Due tomorrow':'Due in '+daysLeft+' days'}${b.autopay?' · 🔄 Autopay':''}</div>
        </div>
        <div style="font-weight:900;color:var(--red)">${fmt$(+b.amount||0)}</div>
      </div>`;
    }).join('');
  }
  document.getElementById('panic-modal').classList.add('open');
}
function closePanicMode() {
  document.getElementById('panic-modal')?.classList.remove('open');
}

// ── ADHD TAX TRACKER ─────────────────────────────────────────────
function calcAdhdTax() {
  const thisMonth = new Date().toISOString().slice(0,7);
  const taxItems = DB.transactions.filter(t =>
    (t.category||'').toLowerCase().includes('adhd') ||
    (t.tags||[]).some(g => g.toLowerCase().includes('adhd')) ||
    (t.notes||'').toLowerCase().includes('adhd tax') ||
    (t.name||'').toLowerCase().includes('adhd tax') ||
    (t.name||'').toLowerCase().includes('late fee') ||
    (t.name||'').toLowerCase().includes('impulse')
  );
  const thisMonthTax = taxItems
    .filter(t => (t.date||'').startsWith(thisMonth))
    .reduce((a,t) => a + Math.abs(+t.amount||0), 0);
  const totalTax = taxItems.reduce((a,t) => a + Math.abs(+t.amount||0), 0);
  const el = document.getElementById('adhd-tax-strip');
  if(el) {
    document.getElementById('adhd-tax-val').textContent = fmt$(thisMonthTax);
    document.getElementById('adhd-tax-total').textContent = fmt$(totalTax) + ' tracked total';
  }
}

// (renderSafeSpend and calcAdhdTax merged directly into renderOverview above)

// ════ SUBSCRIPTIONS AUDIT ════
function renderSubsTab() {
  // Subscriptions = expenses with category 'subscription' or notes/name containing 'subscription'
  var subs = DB.expenses.filter(function(e) {
    return (e.category||'').toLowerCase().indexOf('sub') >= 0
      || (e.name||'').toLowerCase().indexOf('subscription') >= 0
      || (e.name||'').toLowerCase().indexOf('netflix') >= 0
      || (e.name||'').toLowerCase().indexOf('spotify') >= 0
      || (e.name||'').toLowerCase().indexOf('hulu') >= 0
      || (e.name||'').toLowerCase().indexOf('disney') >= 0
      || (e.name||'').toLowerCase().indexOf('amazon prime') >= 0
      // NOTE: removed overly broad monthly+category clause (caught all monthly expenses)
      || (e.tags||[]).some(function(t){return(t||'').toLowerCase().indexOf('sub')>=0;});
  });
  // Also pull bills that look like subscriptions
  var subBills = DB.bills.filter(function(b) {
    return (b.name||'').toLowerCase().indexOf('subscription') >= 0
      || (b.tags||[]).some(function(t){return(t||'').toLowerCase().indexOf('sub')>=0;});
  });
  var all = subs.concat(subBills);

  // Load statuses from localStorage
  var statuses = {};
  try { statuses = HQSafe.store.get(HQKeys.SUB_STATUS, {}); } catch(e) {}

  var cancelTotal = 0, cancelCount = 0;
  all.forEach(function(s) {
    var status = statuses[s.id] || 'using';
    if(status === 'cancel') { cancelTotal += toMonthly(+s.amount||0, s.frequency); cancelCount++; }
  });

  var banner = document.getElementById('sub-savings-banner');
  var savingsEl = document.getElementById('sub-cancel-savings');
  var countEl = document.getElementById('sub-cancel-count');
  if(banner) banner.style.display = cancelCount ? 'flex' : 'none';
  if(savingsEl) savingsEl.textContent = fmt$(cancelTotal) + '/month';
  if(countEl) countEl.textContent = cancelCount + ' item' + (cancelCount!==1?'s':'') + ' marked for canceling';

  var el = document.getElementById('sub-list');
  if(!el) return;
  if(!all.length) {
    el.innerHTML = '<div class="empty"><div class="empty-ic">📺</div>No subscriptions detected. Add recurring expenses in the Expenses tab — subscriptions with monthly frequency appear here automatically.</div>';
    return;
  }

  el.innerHTML = all.map(function(s) {
    var status = statuses[s.id] || 'using';
    var monthly = toMonthly(+s.amount||0, s.frequency);
    return '<div class="sub-card">'
      + '<div style="font-size:18px">' + (s.emoji||'📺') + '</div>'
      + '<div style="flex:1;min-width:0"><div class="sub-name">' + htEsc2(s.name) + '</div>'
      + '<div style="font-size:10px;color:var(--muted)">' + fmt$(monthly) + '/mo' + (s.frequency && s.frequency!=='monthly'?' ('+s.frequency+')':'') + '</div></div>'
      + '<div style="display:flex;flex-direction:column;gap:4px;align-items:flex-end">'
      + '<button class="sub-status-btn using'+(status==='using'?' on':'')+'" onclick="setSubStatus(\''+s.id+'\',\'using\',this)">✅ Using</button>'
      + '<button class="sub-status-btn unsure'+(status==='unsure'?' on':'')+'" onclick="setSubStatus(\''+s.id+'\',\'unsure\',this)">🤔 Not sure</button>'
      + '<button class="sub-status-btn cancel'+(status==='cancel'?' on':'')+'" onclick="setSubStatus(\''+s.id+'\',\'cancel\',this)">❌ Cancel</button>'
      + '</div>'
      + '</div>';
  }).join('');

  renderSpikeAlerts();
}

function setSubStatus(id, status, btn) {
  var statuses = {};
  try { statuses = HQSafe.store.get(HQKeys.SUB_STATUS, {}); } catch(e) {}
  statuses[id] = status;
  HQSafe.store.set(HQKeys.SUB_STATUS, statuses);
  renderSubsTab();
}

// ════ SPENDING SPIKE ALERTS ════
function renderSpikeAlerts() {
  var el = document.getElementById('spike-alerts-list');
  if(!el) return;
  if(DB.transactions.length < 10) {
    el.innerHTML = '<div style="font-size:11px;color:var(--muted);font-style:italic">Log at least 10 transactions to detect spending spikes.</div>';
    return;
  }
  var today = new Date();
  var thisMonthStr = today.toISOString().slice(0,7);
  var lastMonthStr = new Date(today.getFullYear(), today.getMonth()-1, 1).toISOString().slice(0,7);

  // Group outgoing transactions by category
  var catMonths = {}; // catId -> {month: total}
  DB.transactions.filter(function(t){ return t.type !== 'income' && t.date; }).forEach(function(t) {
    var mk = (t.date||'').slice(0,7);
    var cat = t.category || 'uncategorized';
    if(!catMonths[cat]) catMonths[cat] = {};
    catMonths[cat][mk] = (catMonths[cat][mk]||0) + (+t.amount||0);
  });

  var te = TE();
  var spikes = [];
  Object.keys(catMonths).forEach(function(cat) {
    var months = catMonths[cat];
    var thisMonth = months[thisMonthStr] || 0;
    if(!thisMonth) return;
    // Average of all months except current
    var historicMonths = Object.keys(months).filter(function(m){return m!==thisMonthStr;});
    if(historicMonths.length < 2) return;
    var avg = historicMonths.reduce(function(a,m){return a+months[m];},0) / historicMonths.length;
    if(avg <= 0) return;
    var pctOver = ((thisMonth - avg) / avg) * 100;
    if(pctOver >= 20) {
      var catObj = te.getCategories().find(function(c){return c.id===cat;});
      spikes.push({cat: catObj ? catObj.emoji+' '+catObj.name : cat, thisMonth: thisMonth, avg: avg, pct: Math.round(pctOver)});
    }
  });

  if(!spikes.length) {
    el.innerHTML = '<div style="font-size:11px;color:var(--muted);font-style:italic">✅ No spending spikes detected this month.</div>';
    return;
  }
  spikes.sort(function(a,b){return b.pct-a.pct;});
  el.innerHTML = spikes.map(function(s) {
    return '<div class="spike-alert">'
      + '<span style="font-size:18px">⚠️</span>'
      + '<div style="flex:1"><div class="spike-alert-cat">'+htEsc2(s.cat)+'</div>'
      + '<div style="font-size:10px;color:var(--muted)">This month: '+fmt$(s.thisMonth)+' · avg: '+fmt$(s.avg)+'</div></div>'
      + '<span class="spike-alert-pct">+'+s.pct+'%</span>'
      + '</div>';
  }).join('');

  // Also write flags for spikes
  spikes.forEach(function(s) {
    if(typeof hqFlag === 'function' && s.pct >= 50) {
      try { hqFlag({id:'spending-spike-'+s.cat, source:'money-brain', type:'urgent', text:'💸 Spending spike: '+s.cat+' +'+s.pct+'%', href:'money-brain.html', ts:Date.now()}); } catch(e) {}
    }
  });
}

// ════ DEBT PAYOFF VISUALIZER ════
var DEBT_STORE = HQKeys.DEBTS;
function loadDebts(){try{return HQSafe.store.get(DEBT_STORE, []);}catch(e){return[];}}
function saveDebts(d){HQSafe.store.set(DEBT_STORE, d);}
function htEsc2(s){return(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

function calcDebtPayoff(balance, annualRate, minPayment, extraPayment) {
  if(balance <= 0 || minPayment <= 0) return null;
  var monthly = annualRate / 100 / 12;
  function monthsToPayoff(bal, pmt) {
    if(pmt <= bal * monthly) return null; // never pays off
    var m = 0, b = bal;
    while(b > 0 && m < 600) {
      b = b * (1 + monthly) - pmt;
      m++;
      if(b < 0) b = 0;
    }
    return m;
  }
  function totalInterest(bal, pmt, months) {
    return (pmt * months) - bal;
  }
  var minMonths = monthsToPayoff(balance, minPayment);
  var extraMonths = extraPayment > 0 ? monthsToPayoff(balance, minPayment + extraPayment) : null;
  return {
    minMonths: minMonths,
    minInterest: minMonths ? Math.max(0, totalInterest(balance, minPayment, minMonths)) : null,
    extraMonths: extraMonths,
    extraInterest: extraMonths ? Math.max(0, totalInterest(balance, minPayment + extraPayment, extraMonths)) : null,
    savedMonths: (minMonths && extraMonths) ? minMonths - extraMonths : null,
    savedInterest: (minMonths && extraMonths) ? Math.max(0, totalInterest(balance, minPayment, minMonths) - Math.max(0, totalInterest(balance, minPayment + extraPayment, extraMonths))) : null,
  };
}

function fmtMonths(m) {
  if(!m) return '—';
  var yr = Math.floor(m/12), mo = m%12;
  return (yr?yr+'y ':'') + (mo?mo+'m':'');
}

function renderDebtTab() {
  var debts = loadDebts();
  var el = document.getElementById('debt-list');
  if(!el) return;
  if(!debts.length) {
    el.innerHTML = '<div class="empty"><div class="empty-ic">💳</div>No debts tracked yet. Add one below.</div>';
    return;
  }
  el.innerHTML = debts.map(function(d) {
    var result = calcDebtPayoff(+d.balance||0, +d.rate||0, +d.min||0, +d.extra||0);
    var rows = '';
    if(result) {
      rows += '<div class="debt-payoff-row"><span class="debt-payoff-label">At minimum payment</span><span class="debt-payoff-val bad">' + fmtMonths(result.minMonths) + ' · ' + fmt$(result.minInterest||0) + ' interest</span></div>';
      if(result.extraMonths) {
        rows += '<div class="debt-payoff-row"><span class="debt-payoff-label">With extra $' + d.extra + '/mo</span><span class="debt-payoff-val good">' + fmtMonths(result.extraMonths) + ' · ' + fmt$(result.extraInterest||0) + ' interest</span></div>';
        if(result.savedMonths) {
          rows += '<div class="debt-payoff-row"><span class="debt-payoff-label">You save</span><span class="debt-payoff-val good">' + fmtMonths(result.savedMonths) + ' · ' + fmt$(result.savedInterest||0) + '</span></div>';
        }
      }
    }
    return '<div class="debt-card">'
      + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">'
      + '<div><div class="debt-name">' + htEsc2(d.name) + '</div>'
      + '<div class="debt-meta">' + fmt$(+d.balance||0) + ' balance · ' + (d.rate||0) + '% APR · $' + (d.min||0) + '/mo min' + (d.extra?' + $'+d.extra+' extra':'') + '</div></div>'
      + '<div style="display:flex;gap:6px">'
      + '<button onclick="openEditDebt(\'' + d.id + '\')" style="background:var(--surface);border:1.5px solid var(--border);color:var(--muted);border-radius:7px;padding:4px 9px;font-size:10px;cursor:pointer;font-family:inherit">✏️</button>'
      + '<button onclick="deleteDebt(\'' + d.id + '\')" style="background:none;border:1.5px solid rgba(249,65,68,.3);color:var(--red);border-radius:7px;padding:4px 9px;font-size:10px;cursor:pointer;font-family:inherit">🗑</button>'
      + '</div></div>'
      + (rows ? '<div class="debt-payoff-result">' + rows + '</div>' : '')
      + '</div>';
  }).join('');
}

function openAddDebt() {
  document.getElementById('debt-edit-id').value = '';
  document.getElementById('debt-modal-title').textContent = '💳 Add Debt';
  ['debt-name','debt-balance','debt-rate','debt-min','debt-extra'].forEach(function(id){var el=document.getElementById(id);if(el)el.value='';});
  HQModal.open('debt-modal'); // H-06
}
function openEditDebt(id) {
  var d = loadDebts().find(function(x){return x.id===id;});
  if(!d) return;
  document.getElementById('debt-edit-id').value = id;
  document.getElementById('debt-modal-title').textContent = '✏️ Edit Debt';
  document.getElementById('debt-name').value = d.name||'';
  document.getElementById('debt-balance').value = d.balance||'';
  document.getElementById('debt-rate').value = d.rate||'';
  document.getElementById('debt-min').value = d.min||'';
  document.getElementById('debt-extra').value = d.extra||'';
  HQModal.open('debt-modal'); // H-06
}
function closeDebtModal(){HQModal.close('debt-modal');} // H-06
function saveDebt() {
  var name = document.getElementById('debt-name').value.trim();
  if(!name){showToast('⚠️ Name required');return;}
  var id = document.getElementById('debt-edit-id').value || ('debt-'+Date.now());
  var debts = loadDebts();
  var entry = {id:id, name:name, balance:document.getElementById('debt-balance').value, rate:document.getElementById('debt-rate').value, min:document.getElementById('debt-min').value, extra:document.getElementById('debt-extra').value};
  var idx = debts.findIndex(function(d){return d.id===id;});
  if(idx>=0) debts[idx]=entry; else debts.push(entry);
  saveDebts(debts);
  closeDebtModal();
  renderDebtTab();
  showToast('💳 Debt saved!');
}
async function deleteDebt(id) {
  if(!(await HQConfirm.ask('Delete this debt?', {danger:true})))return;
  saveDebts(loadDebts().filter(function(d){return d.id!==id;}));
  renderDebtTab();
  showToast('🗑 Deleted');
}

// ════ INCOME SMOOTHING ════
function buildSmoothInputs() {
  var el = document.getElementById('smooth-inputs');
  if(!el) return;
  var saved = {};
  try { saved = HQSafe.store.get(HQKeys.INCOME_SMOOTH, {}); } catch(e) {}
  var rows = '';
  for(var i=5; i>=0; i--) {
    var d = new Date();
    d.setMonth(d.getMonth()-i);
    var mk = d.toISOString().slice(0,7);
    var label = d.toLocaleDateString('en-US',{month:'long',year:'numeric'});
    rows += '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">'
      + '<span style="font-size:11px;font-weight:700;color:var(--text2);min-width:110px">' + label + '</span>'
      + '<div style="position:relative;flex:1"><span style="position:absolute;left:9px;top:50%;transform:translateY(-50%);color:var(--muted);font-size:13px;font-weight:800">$</span><input id="smooth-'+mk+'" class="fin" type="number" min="0" step="1" placeholder="0" value="'+(saved[mk]||'')+'" style="padding-left:22px"></div>'
      + '</div>';
  }
  el.innerHTML = rows;
}

function calcSmoothing() {
  var vals = [], saved = {};
  for(var i=5; i>=0; i--) {
    var d = new Date(); d.setMonth(d.getMonth()-i);
    var mk = d.toISOString().slice(0,7);
    var el = document.getElementById('smooth-'+mk);
    var v = el ? parseFloat(el.value)||0 : 0;
    vals.push(v);
    saved[mk] = v;
  }
  HQSafe.store.set(HQKeys.INCOME_SMOOTH, saved);

  var nonZero = vals.filter(function(v){return v>0;});
  if(!nonZero.length) { showToast('⚠️ Enter at least one month'); return; }

  var avg = nonZero.reduce(function(a,b){return a+b;},0)/nonZero.length;
  var lowest = Math.min.apply(null, nonZero);
  var highest = Math.max.apply(null, nonZero);
  var variance = highest > 0 ? Math.round(((highest-lowest)/highest)*100) : 0;
  var safe = avg * 0.85; // 15% variance buffer

  document.getElementById('smooth-result').textContent = fmt$(safe);
  document.getElementById('smooth-result-sub').textContent = 'Budget to this every month (avg minus 15% buffer)';
  document.getElementById('smooth-avg').textContent = fmt$(avg);
  document.getElementById('smooth-low').textContent = fmt$(lowest);
  document.getElementById('smooth-variance').textContent = variance+'%';
  showToast('✅ Calculated!');
}

// ════ SW HOOK FOR NEW TABS ════
window.sw = function(id, btn) {
  if(window.HQTabs) HQTabs.sw(id, btn);
  if(id === 'subs')          { renderSubsTab(); }
  if(id === 'debt')          { renderDebtTab(); }
  if(id === 'income-smooth') { buildSmoothInputs(); calcSmoothing(); }
};



// ════════════════════════════════════════════════════════════════════
// 💳 BANK / SPENDING CSV IMPORT
// Handles: Chase, Amex, Capital One, Mint, YNAB, and generic CSV.
// All parsing is local — no data leaves the device.
// ════════════════════════════════════════════════════════════════════

var _csvPending = [];

function openCsvImport() {
  document.getElementById('csv-import-modal').classList.add('show');
}
function closeCsvImport() {
  document.getElementById('csv-import-modal').classList.remove('show');
  _csvPending = [];
  document.getElementById('csv-import-input').value = '';
  document.getElementById('csv-preview-wrap').style.display = 'none';
  document.getElementById('csv-confirm-btn').style.display = 'none';
  document.getElementById('csv-format-detect').textContent = '';
}

// Detect format from header row
function detectCsvFormat(header) {
  var h = header.toLowerCase();
  if (h.includes('transaction date') && h.includes('post date')) return 'chase';
  if (h.includes('date') && h.includes('description') && h.includes('original description')) return 'mint';
  if (h.includes('date') && h.includes('payee') && h.includes('memo') && h.includes('outflow')) return 'ynab';
  if (h.includes('date') && h.includes('description') && h.includes('amount') && h.includes('debit')) return 'amex';
  if (h.includes('transaction date') && h.includes('posted date') && h.includes('card no')) return 'capitalonecc';
  return 'generic';
}

function parseCsvLine(line) {
  // RFC 4180 CSV parser — handles quoted fields with commas inside
  var result = [], field = '', inQuote = false;
  for (var i = 0; i < line.length; i++) {
    var ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i+1] === '"') { field += '"'; i++; }
      else inQuote = !inQuote;
    } else if (ch === ',' && !inQuote) {
      result.push(field.trim()); field = '';
    } else field += ch;
  }
  result.push(field.trim());
  return result;
}

function parseCsvRows(text) {
  return text.split(/\r?\n/).filter(function(l){return l.trim();}).map(parseCsvLine);
}

// ── Per-format mappers → { name, amount (positive=expense), date, category, isIncome } ──
var CSV_FORMATS = {
  chase: function(row, hdr) {
    // Transaction Date, Post Date, Description, Category, Type, Amount, Memo
    var idx = function(k){return hdr.findIndex(function(h){return h.toLowerCase().includes(k);});};
    var name = (row[idx('description')]||'').replace(/^"/,'').replace(/"$/,'');
    var amt  = parseFloat((row[idx('amount')]||'0').replace(/[$,]/g,''));
    var date = row[idx('transaction date')]||row[idx('date')]||'';
    var cat  = row[idx('category')]||'';
    var type = (row[idx('type')]||'').toLowerCase();
    // Chase: negative = charge, positive = payment/credit
    var isIncome = amt > 0 || type === 'payment';
    return { name: name, amount: Math.abs(amt), date: normDate(date), category: cat, isIncome: isIncome };
  },
  mint: function(row, hdr) {
    // Date, Description, Original Description, Amount, Transaction Type, Category, Account Name...
    var idx = function(k){return hdr.findIndex(function(h){return h.toLowerCase().includes(k);});};
    var name = row[idx('description')]||row[idx('original')]||'';
    var amt  = parseFloat((row[idx('amount')]||'0').replace(/[$,]/g,''));
    var type = (row[idx('transaction type')]||'').toLowerCase();
    var date = row[idx('date')]||'';
    var cat  = row[idx('category')]||'';
    var isIncome = type === 'credit';
    return { name: name, amount: Math.abs(amt), date: normDate(date), category: cat, isIncome: isIncome };
  },
  ynab: function(row, hdr) {
    // Account, Flag, Date, Payee, Category Group/Category, Memo, Outflow, Inflow, Cleared
    var idx = function(k){return hdr.findIndex(function(h){return h.toLowerCase().includes(k);});};
    var name = row[idx('payee')]||'';
    var outflow = parseFloat((row[idx('outflow')]||'0').replace(/[$, ]/g,''))||0;
    var inflow  = parseFloat((row[idx('inflow')]||'0').replace(/[$, ]/g,''))||0;
    var date = row[idx('date')]||'';
    var cat  = row[idx('category')]||'';
    var isIncome = inflow > 0 && outflow === 0;
    return { name: name, amount: isIncome ? inflow : outflow, date: normDate(date), category: cat, isIncome: isIncome };
  },
  amex: function(row, hdr) {
    // Date, Description, Amount, Extended Details, ..., Debit, Credit
    var idx = function(k){return hdr.findIndex(function(h){return h.toLowerCase().includes(k);});};
    var name = row[idx('description')]||'';
    var debit  = parseFloat((row[idx('debit')]||'').replace(/[$, ]/g,''))||0;
    var credit = parseFloat((row[idx('credit')]||'').replace(/[$, ]/g,''))||0;
    var amount = debit > 0 ? debit : parseFloat((row[idx('amount')]||'0').replace(/[$, ]/g,''))||0;
    var date = row[idx('date')]||'';
    return { name: name, amount: Math.abs(amount), date: normDate(date), category: '', isIncome: credit > 0 };
  },
  capitalonecc: function(row, hdr) {
    // Transaction Date, Posted Date, Card No., Description, Category, Debit, Credit
    var idx = function(k){return hdr.findIndex(function(h){return h.toLowerCase().includes(k);});};
    var name   = row[idx('description')]||'';
    var debit  = parseFloat((row[idx('debit')]||'').replace(/[$, ]/g,''))||0;
    var credit = parseFloat((row[idx('credit')]||'').replace(/[$, ]/g,''))||0;
    var date   = row[idx('transaction date')]||row[idx('date')]||'';
    var cat    = row[idx('category')]||'';
    return { name: name, amount: debit>0?debit:credit, date: normDate(date), category: cat, isIncome: credit>0&&debit===0 };
  },
  generic: function(row, hdr) {
    // Best-effort: find date, description/name, amount columns
    var idx = function(k){return hdr.findIndex(function(h){return h.toLowerCase().includes(k);});};
    var nameIdx = [idx('description'),idx('name'),idx('payee'),idx('merchant'),idx('memo')].find(function(i){return i>=0;})||1;
    var amtIdx  = [idx('amount'),idx('transaction amount'),idx('value')].find(function(i){return i>=0;})||2;
    var dateIdx = [idx('date'),idx('transaction date'),idx('posted')].find(function(i){return i>=0;})||0;
    var amt = parseFloat((row[amtIdx]||'0').replace(/[$, ]/g,''));
    return { name: row[nameIdx]||'', amount: Math.abs(amt), date: normDate(row[dateIdx]||''), category: '', isIncome: amt>0 };
  }
};

function normDate(raw) {
  // Normalize M/D/YYYY, MM/DD/YYYY, YYYY-MM-DD, etc. → YYYY-MM-DD
  if (!raw) return '';
  raw = raw.replace(/"/g,'').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  var slashParts = raw.split('/');
  if (slashParts.length === 3) {
    var m = slashParts[0].padStart(2,'0'), d = slashParts[1].padStart(2,'0'), y = slashParts[2];
    if (y.length === 2) y = '20' + y;
    return y + '-' + m + '-' + d;
  }
  return raw;
}

function parseCsvImportFile(input) {
  var file = input.files[0]; if (!file) return;
  var ext = (file.name.split('.').pop()||'').toLowerCase();
  if (ext !== 'csv' && ext !== 'txt') {
    HQToast.warn('Please upload a .csv file from your bank or budgeting app.'); return;
  }
  var reader = new FileReader();
  reader.onload = function(e) {
    var text = e.target.result;
    var rows = parseCsvRows(text);
    if (rows.length < 2) { HQToast.warn('File appears empty or has only a header row.'); return; }
    var header = rows[0];
    var fmt = detectCsvFormat(header.join(','));
    var fmtLabels = {chase:'Chase',mint:'Mint',ynab:'YNAB',amex:'American Express',capitalonecc:'Capital One',generic:'Generic'};
    document.getElementById('csv-format-detect').textContent = '🔍 Detected format: ' + (fmtLabels[fmt]||fmt);
    var mapper = CSV_FORMATS[fmt] || CSV_FORMATS.generic;
    var parsed = [], errors = 0;
    rows.slice(1).forEach(function(row, i) {
      if (row.length < 2 || row.every(function(c){return !c;})) return; // skip blank
      try {
        var item = mapper(row, header);
        if (!item.name || !item.date) { errors++; return; }
        parsed.push({
          id: uid(),
          name: item.name,
          amount: item.amount || 0,
          type: item.isIncome ? 'income' : 'expense',
          category: mapCategory(item.category),
          date: item.date,
          frequency: 'one-time',
          notes: 'Imported from ' + (fmtLabels[fmt]||'CSV'),
          emoji: item.isIncome ? '💵' : '💳',
          saved: new Date().toISOString(),
        });
      } catch(err) { errors++; }
    });
    if (!parsed.length) { HQToast.error('No valid transactions found in file. (' + errors + ' rows skipped)'); return; }
    _csvPending = parsed;
    renderCsvPreview(parsed, errors, fmtLabels[fmt]||fmt);
  };
  reader.readAsText(file);
  input.value = '';
}

// Rough category mapper from bank category strings
function mapCategory(raw) {
  if (!raw) return '';
  var r = (raw||'').toLowerCase();
  if (r.includes('groceries')||r.includes('supermarket')||r.includes('food')) return 'home';
  if (r.includes('health')||r.includes('medical')||r.includes('pharmacy')) return 'health';
  if (r.includes('entertainment')||r.includes('streaming')||r.includes('movie')) return 'personal';
  if (r.includes('restaurant')||r.includes('dining')||r.includes('coffee')) return 'social';
  if (r.includes('travel')||r.includes('transport')||r.includes('uber')||r.includes('lyft')) return 'personal';
  if (r.includes('income')||r.includes('payroll')||r.includes('salary')||r.includes('direct dep')) return '';
  if (r.includes('fee')||r.includes('penalty')||r.includes('late')) return 'admin';
  return '';
}

function renderCsvPreview(parsed, errors, fmt) {
  var income = parsed.filter(function(t){return t.type==='income';});
  var expense = parsed.filter(function(t){return t.type!=='income';});
  var inTotal = income.reduce(function(a,t){return a+t.amount;},0);
  var expTotal = expense.reduce(function(a,t){return a+t.amount;},0);

  var wrap = document.getElementById('csv-preview-wrap');
  wrap.style.display = 'block';
  wrap.innerHTML = '<div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin-bottom:10px">'
    + '<span style="color:var(--green);font-weight:900;font-size:14px">✅ ' + parsed.length + ' transactions</span>'
    + '<span style="color:var(--text2);font-size:12px">💵 ' + income.length + ' income · 💳 ' + expense.length + ' expenses</span>'
    + (errors?' <span style="color:var(--red);font-size:11px">⚠️ '+errors+' skipped</span>':'')
    + '</div>'
    + '<div style="display:flex;gap:16px;margin-bottom:10px;font-size:12px">'
    + '<span>In: <strong style="color:var(--green)">' + fmt$(inTotal) + '</strong></span>'
    + '<span>Out: <strong style="color:var(--red)">' + fmt$(expTotal) + '</strong></span>'
    + '</div>'
    + '<div style="max-height:240px;overflow-y:auto;border:1px solid var(--border);border-radius:8px">'
    + parsed.slice(0,50).map(function(t,i) {
        return '<div style="display:flex;align-items:center;gap:8px;padding:7px 10px;border-bottom:1px solid var(--border);font-size:12px">'
          + '<span style="font-size:15px">' + t.emoji + '</span>'
          + '<div style="flex:1;min-width:0"><div style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(t.name) + '</div>'
          + '<div style="color:var(--muted);font-size:10px">' + t.date + (t.category?' · '+t.category:'') + '</div></div>'
          + '<div style="font-weight:900;color:' + (t.type==='income'?'var(--green)':'var(--red)') + ';white-space:nowrap">'
          + (t.type==='income'?'+':'-') + fmt$(t.amount) + '</div>'
          + '</div>';
      }).join('')
    + (parsed.length>50?'<div style="padding:8px;text-align:center;font-size:11px;color:var(--muted)">...and '+(parsed.length-50)+' more</div>':'')
    + '</div>';

  document.getElementById('csv-confirm-btn').style.display = 'block';
  document.getElementById('csv-confirm-btn').textContent = '✅ IMPORT ' + parsed.length + ' TRANSACTIONS';
}

function confirmCsvImport() {
  if (!_csvPending.length) return;
  // Deduplicate by date+name+amount
  var existing = new Set(DB.transactions.map(function(t){return t.date+'|'+t.name+'|'+t.amount;}));
  var added = 0, dupes = 0;
  _csvPending.forEach(function(t) {
    var key = t.date + '|' + t.name + '|' + t.amount;
    if (existing.has(key)) { dupes++; return; }
    DB.transactions.push(t);
    added++;
  });
  persist();
  renderTransactions();
  renderOverview();
  closeCsvImport();
  showToast('✅ Imported ' + added + ' transactions' + (dupes?' ('+dupes+' dupes skipped)':''));
}

// hq-core.js is now loaded — run flag check and set active nav
moneyFlagCheck();

// Mark active nav item

// ═══════════════════════════════════════════════════════════════
//  FINANCE SETUP — added block
// ═══════════════════════════════════════════════════════════════
try {

const ACCT_META = {
  checking:   { label:'Checking',              emoji:'🏦', sub:'liquid', color:'#2A7A4E' },
  savings:    { label:'Savings',               emoji:'💰', sub:'liquid', color:'#2A8A85' },
  retirement: { label:'Retirement/Investment', emoji:'📈', sub:'asset',  color:'#645EB7' },
  credit:     { label:'Credit Card',           emoji:'💳', sub:'debt',   color:'#EF5886' },
  loan:       { label:'Loan',                  emoji:'📑', sub:'debt',   color:'#E86840' },
  bill:       { label:'Biller/Utility',        emoji:'📋', sub:'bill',   color:'#A8AAA9' },
};

const REC_CATEGORIES = {
  personal:      { label:'Personal',          emoji:'🧍', subs:['health-otc','health-rx','health-copays','hygiene','bad habits'] },
  entertainment: { label:'Entertainment',     emoji:'🎭', subs:['going out','staying in','media'] },
  food:          { label:'Food',              emoji:'🍽️', subs:['grocery','eating out','takeout','delivery'] },
  household:     { label:'Household',         emoji:'🏠', subs:['cleaning','improvement','paper goods'] },
  tools:         { label:'Tools & Services',  emoji:'🔧', subs:['security','convenience','finance','media','food','rideshare'] },
  transportation:{ label:'Transportation',    emoji:'🚌', subs:['MBTA','Uber','Lyft','Amtrak'] },
  laundry:       { label:'Laundry',           emoji:'🧺', subs:[] },
  credit_payment:{ label:'Credit Card Pmts',  emoji:'💳', subs:[] },
};

function swSetup(id, btn) {
  document.querySelectorAll('.stab').forEach(b => b.classList.remove('on'));
  document.querySelectorAll('.setup-section').forEach(s => s.classList.remove('on'));
  btn.classList.add('on');
  var sec = document.getElementById('setup-sec-' + id);
  if (sec) sec.classList.add('on');
  if (id === 'accounts')  renderAccounts();
  if (id === 'recurring') renderEnhancedRecurring();
  if (id === 'envelopes') renderEnvelopes();
}

function onAccountCategoryChange(cat) {
  var fields = ['am-balance-wrap','am-interest-wrap','am-credit-wrap','am-fees-wrap',
    'am-minpmt-wrap','am-borrowed-wrap','am-contrib-wrap','am-autopay-wrap'];
  fields.forEach(function(id){ var el=document.getElementById(id); if(el) el.style.display='none'; });
  function show() { Array.prototype.forEach.call(arguments, function(id){ var el=document.getElementById(id); if(el) el.style.display='block'; }); }
  if (cat === 'checking')   show('am-balance-wrap');
  if (cat === 'savings')    show('am-balance-wrap','am-interest-wrap');
  if (cat === 'retirement') show('am-balance-wrap','am-interest-wrap','am-contrib-wrap');
  if (cat === 'credit')     show('am-balance-wrap','am-interest-wrap','am-credit-wrap','am-fees-wrap','am-minpmt-wrap','am-autopay-wrap');
  if (cat === 'loan')       show('am-balance-wrap','am-borrowed-wrap','am-interest-wrap','am-minpmt-wrap','am-autopay-wrap');
  if (cat === 'bill')       show('am-autopay-wrap');
  var meta = ACCT_META[cat] || {};
  var sub = { debt:'💳 Debt', liquid:'💧 Liquid', asset:'📈 Asset', bill:'📋 Biller' };
  var badge = document.getElementById('am-sub-badge');
  if (badge) { badge.textContent = sub[meta.sub]||''; badge.className='acct-sub-badge sub-'+(meta.sub||'liquid'); }
  var lbl = document.getElementById('am-balance-label');
  if (lbl) lbl.textContent = cat==='loan' ? 'Balance Remaining $' : cat==='credit' ? 'Balance Owed $' : 'Current Balance $';
}

function openAddAccount() {
  document.getElementById('am-title').textContent = '🏦 Add Account';
  document.getElementById('am-edit-id').value = '';
  ['am-name','am-acct-num','am-description','am-balance','am-credit-limit',
   'am-interest-rate','am-fees','am-min-payment','am-autopay-day','am-autopay-start',
   'am-total-borrowed','am-contrib-amount'].forEach(function(id){ var el=document.getElementById(id); if(el) el.value=''; });
  document.getElementById('am-category').value = 'checking';
  document.getElementById('am-autopay-freq').value = 'monthly';
  document.getElementById('am-contrib-freq').value = 'biweekly';
  onAccountCategoryChange('checking');
  openModal('account-modal');
  setTimeout(function(){ var el=document.getElementById('am-name'); if(el) el.focus(); }, 150);
}

function openEditAccount(id) {
  var a = (DB.accounts||[]).find(function(x){ return x.id===id; }); if(!a) return;
  document.getElementById('am-title').textContent = '✏️ Edit Account';
  document.getElementById('am-edit-id').value = id;
  document.getElementById('am-name').value = a.name||'';
  document.getElementById('am-acct-num').value = a.acctNumber||'';
  document.getElementById('am-description').value = a.description||'';
  document.getElementById('am-category').value = a.category||'checking';
  document.getElementById('am-balance').value = a.currentBalance||'';
  document.getElementById('am-credit-limit').value = a.creditLimit||'';
  document.getElementById('am-interest-rate').value = a.interestRate||'';
  document.getElementById('am-fees').value = a.fees||'';
  document.getElementById('am-min-payment').value = a.minPayment||'';
  document.getElementById('am-autopay-day').value = a.autopayDay||'';
  document.getElementById('am-autopay-freq').value = a.autopayFreq||'monthly';
  document.getElementById('am-autopay-start').value = a.autopayStart||'';
  document.getElementById('am-total-borrowed').value = a.totalBorrowed||'';
  document.getElementById('am-contrib-amount').value = a.contribAmount||'';
  document.getElementById('am-contrib-freq').value = a.contribFreq||'biweekly';
  onAccountCategoryChange(a.category);
  openModal('account-modal');
}

function saveAccount() {
  var name = document.getElementById('am-name').value.trim();
  if(!name){ showToast('⚠️ Account name is required'); document.getElementById('am-name').focus(); return; }
  var editId = document.getElementById('am-edit-id').value;
  var cat = document.getElementById('am-category').value;
  var meta = ACCT_META[cat]||{};
  var acct = {
    id: editId||uid(), name: name,
    acctNumber:   document.getElementById('am-acct-num').value.trim()||null,
    description:  document.getElementById('am-description').value.trim()||null,
    category: cat, subcategory: meta.sub||'liquid',
    currentBalance: parseFloat(document.getElementById('am-balance').value)||0,
    interestRate:  parseFloat(document.getElementById('am-interest-rate').value)||null,
    creditLimit:   parseFloat(document.getElementById('am-credit-limit').value)||null,
    fees:          document.getElementById('am-fees').value.trim()||null,
    minPayment:    parseFloat(document.getElementById('am-min-payment').value)||null,
    autopayDay:    parseInt(document.getElementById('am-autopay-day').value)||null,
    autopayFreq:   document.getElementById('am-autopay-freq').value||'monthly',
    autopayStart:  document.getElementById('am-autopay-start').value||null,
    totalBorrowed: parseFloat(document.getElementById('am-total-borrowed').value)||null,
    contribAmount: parseFloat(document.getElementById('am-contrib-amount').value)||null,
    contribFreq:   document.getElementById('am-contrib-freq').value||'biweekly',
    savedAt: new Date().toISOString(),
  };
  if(!DB.accounts) DB.accounts=[];
  if(editId){ var i=DB.accounts.findIndex(function(x){return x.id===editId;}); if(i!==-1) DB.accounts[i]=acct; else DB.accounts.push(acct); }
  else DB.accounts.push(acct);
  persist(); closeModal('account-modal');
  renderAccounts(); renderNetWorth(); populateAllAccountSelects();
  showToast('🏦 Account saved!');
}

async function deleteAccount(id) {
  if(!(await HQConfirm.ask('Delete this account?', {danger:true})))return;
  DB.accounts=(DB.accounts||[]).filter(function(x){ return x.id!==id; });
  (DB.enhancedRecurring||[]).forEach(function(r){ if(r.accountId===id) r.accountId=null; });
  persist(); renderAccounts(); renderNetWorth(); populateAllAccountSelects();
  showToast('🗑️ Account deleted');
}

function renderAccounts() {
  var el=document.getElementById('accounts-list'); if(!el) return;
  var accounts=DB.accounts||[];
  if(!accounts.length){ el.innerHTML='<div class="empty"><div class="empty-ic">🏦</div>No accounts yet. Add your first account to start building your financial picture.</div>'; return; }
  var groups={asset:[],liquid:[],debt:[],bill:[]};
  accounts.forEach(function(a){ (groups[a.subcategory||'liquid']||groups.liquid).push(a); });
  var groupLabels={asset:'📈 Assets',liquid:'💧 Liquid Accounts',debt:'💳 Debt',bill:'📋 Billers'};
  var groupColors={asset:'var(--purple)',liquid:'var(--teal)',debt:'var(--red)',bill:'var(--muted)'};
  var html='';
  ['liquid','asset','debt','bill'].forEach(function(sub){
    var items=groups[sub]; if(!items.length) return;
    var total=items.reduce(function(a,i){return a+(i.currentBalance||0);},0);
    html+='<div class="acct-group-hd"><span class="acct-group-label" style="color:'+groupColors[sub]+'">'+groupLabels[sub]+'</span><span class="acct-group-total">'+fmt$(total)+'</span></div>';
    html+=items.map(function(a){
      var meta=ACCT_META[a.category]||{};
      var isDebt=a.subcategory==='debt';
      var bal=a.currentBalance||0;
      var details='';
      if(a.category==='credit'){
        var avail=(a.creditLimit||0)-bal;
        var util=a.creditLimit?Math.round(bal/a.creditLimit*100):0;
        var uc=util>50?'var(--red)':util>30?'var(--orange)':'var(--green)';
        details='<div class="acct-detail-grid"><div class="acct-detail-item"><span class="acct-dl">Limit</span><span class="acct-dv">'+fmt$(a.creditLimit||0)+'</span></div><div class="acct-detail-item"><span class="acct-dl">Available</span><span class="acct-dv" style="color:var(--green)">'+fmt$(avail)+'</span></div><div class="acct-detail-item"><span class="acct-dl">Utilization</span><span class="acct-dv" style="color:'+uc+'">'+util+'%</span></div>'+(a.interestRate?'<div class="acct-detail-item"><span class="acct-dl">APR</span><span class="acct-dv">'+a.interestRate+'%</span></div>':'')+(a.minPayment?'<div class="acct-detail-item"><span class="acct-dl">Min Pmt</span><span class="acct-dv">'+fmt$(a.minPayment)+'</span></div>':'')+'</div><div class="util-bar-track"><div class="util-bar-fill" style="width:'+Math.min(100,util)+'%;background:'+uc+'"></div></div>';
      } else if(a.category==='loan'){
        var paid=(a.totalBorrowed||0)-bal;
        var pp=a.totalBorrowed?Math.round(paid/a.totalBorrowed*100):0;
        details='<div class="acct-detail-grid"><div class="acct-detail-item"><span class="acct-dl">Borrowed</span><span class="acct-dv">'+fmt$(a.totalBorrowed||0)+'</span></div><div class="acct-detail-item"><span class="acct-dl">Paid Off</span><span class="acct-dv" style="color:var(--green)">'+fmt$(paid)+' ('+pp+'%)</span></div>'+(a.interestRate?'<div class="acct-detail-item"><span class="acct-dl">Rate</span><span class="acct-dv">'+a.interestRate+'%</span></div>':'')+'</div><div class="util-bar-track"><div class="util-bar-fill" style="width:'+Math.min(100,pp)+'%;background:var(--green)"></div></div>';
      } else if(a.category==='retirement'){
        details='<div class="acct-detail-grid">'+(a.interestRate?'<div class="acct-detail-item"><span class="acct-dl">Return Rate</span><span class="acct-dv">'+a.interestRate+'%</span></div>':'')+(a.contribAmount?'<div class="acct-detail-item"><span class="acct-dl">Contribution</span><span class="acct-dv">'+fmt$(a.contribAmount)+' '+(a.contribFreq||'')+'</span></div>':'')+'</div>';
      } else if(a.category==='savings'&&a.interestRate){
        details='<div class="acct-detail-grid"><div class="acct-detail-item"><span class="acct-dl">APY</span><span class="acct-dv" style="color:var(--green)">'+a.interestRate+'%</span></div></div>';
      } else if(a.category==='bill'&&a.autopayDay){
        details='<div class="acct-detail-grid"><div class="acct-detail-item"><span class="acct-dl">Autopay</span><span class="acct-dv">♻️ '+(a.autopayFreq||'monthly')+', day '+a.autopayDay+'</span></div></div>';
      }
      return '<div class="acct-card" id="acct-'+a.id+'" data-sub="'+(a.subcategory||'liquid')+'">'
        +'<div class="acct-hd" onclick="document.getElementById(\'acct-'+a.id+'\').classList.toggle(\'open\')">'
        +'<div class="acct-em">'+(meta.emoji||'🏦')+'</div>'
        +'<div class="acct-info"><div class="acct-name">'+esc(a.name)+'</div>'
        +'<div class="acct-meta-row"><span class="acct-cat-badge" style="background:'+(meta.color||'#888')+'22;color:'+(meta.color||'#888')+';border:1px solid '+(meta.color||'#888')+'44">'+(meta.label||cat)+'</span>'
        +(a.acctNumber?'<span class="acct-acctnum">····'+a.acctNumber.slice(-4)+'</span>':'')
        +'</div></div>'
        +'<div class="acct-bal'+(isDebt?' debt-bal':'')+'">'+fmt$(bal)+'</div>'
        +'<div class="acct-btns" onclick="event.stopPropagation()">'
        +'<button class="btn-sm" onclick="openEditAccount(\''+a.id+'\')">✏️</button>'
        +'<button class="btn-sm del" onclick="deleteAccount(\''+a.id+'\')">🗑️</button>'
        +'</div><div class="fi-ar">▼</div></div>'
        +'<div class="fi-body">'+details+(a.description?'<div style="font-size:11px;color:var(--muted);margin-top:6px;font-style:italic">📝 '+esc(a.description)+'</div>':'')+'</div>'
        +'</div>';
    }).join('');
  });
  el.innerHTML=html;
}

function calcNetWorth() {
  var accounts=DB.accounts||[], assets=0, debts=0;
  accounts.forEach(function(a){ var b=a.currentBalance||0; if(a.subcategory==='debt') debts+=b; else assets+=b; });
  return {assets:assets,debts:debts,net:assets-debts};
}

function renderNetWorth() {
  var el=document.getElementById('nw-card'); if(!el) return;
  if(!(DB.accounts||[]).length){el.style.display='none';return;}
  el.style.display='block';
  var nw=calcNetWorth();
  document.getElementById('nw-assets').textContent=fmt$(nw.assets);
  document.getElementById('nw-debts').textContent=fmt$(nw.debts);
  var ne=document.getElementById('nw-net'); ne.textContent=fmt$(nw.net); ne.style.color=nw.net>=0?'var(--green)':'var(--red)';
  var pct=(nw.assets+nw.debts)>0?Math.min(100,Math.round(nw.assets/(nw.assets+nw.debts)*100)):0;
  var bar=document.getElementById('nw-bar'); if(bar){bar.style.width=pct+'%';bar.style.background=nw.net>=0?'var(--green)':'var(--red)';}
}

function populateAccountSelect(elId, selectedId) {
  var sel=document.getElementById(elId); if(!sel) return;
  sel.innerHTML='<option value="">— No account linked —</option>'
    +(DB.accounts||[]).map(function(a){ var m=ACCT_META[a.category]||{}; return '<option value="'+a.id+'"'+(a.id===selectedId?' selected':'')+'>'+(m.emoji||'')+' '+esc(a.name)+'</option>'; }).join('');
}

function populateAllAccountSelects() {
  populateAccountSelect('rm-account', null);
}

function onRecurringTypeChange(val) {
  var ef=document.getElementById('rec-expense-fields');
  var inf=document.getElementById('rec-income-fields');
  if(ef) ef.style.display=(val==='expense'||val==='subscription'||val==='bill')?'block':'none';
  if(inf) inf.style.display=(val==='income')?'block':'none';
  if(val==='income'){ var bh=document.getElementById('rm-bad-habit'); if(bh) bh.checked=false; }
}

function onRecurringCatChange(val) {
  var sub=document.getElementById('rm-subcategory');
  var subWrap=document.getElementById('rm-subcat-wrap');
  var delivWrap=document.getElementById('rm-delivery-wrap');
  var subs=(REC_CATEGORIES[val]||{}).subs||[];
  if(delivWrap) delivWrap.style.display=(val==='food')?'block':'none';
  if(!subs.length){if(subWrap)subWrap.style.display='none';return;}
  if(subWrap) subWrap.style.display='block';
  if(sub) sub.innerHTML='<option value="">— Subcategory —</option>'+subs.map(function(s){return '<option value="'+s+'">'+s+'</option>';}).join('')+'<option value="__custom__">✏️ Custom...</option>';
}

function onRecurringSubChange(val) {
  var cw=document.getElementById('rm-custom-wrap');
  if(cw) cw.style.display=(val==='__custom__')?'block':'none';
}

function onAmtTypeChange(val) {
  var fw=document.getElementById('rm-fixed-wrap'); if(fw) fw.style.display=val==='fixed'?'block':'none';
  var rw=document.getElementById('rm-range-wrap'); if(rw) rw.style.display=val==='range'?'block':'none';
}

function openAddRecurring(type) {
  document.getElementById('rm-title').textContent='🔁 Add Recurring';
  document.getElementById('rm-edit-id').value='';
  ['rm-name','rm-amount','rm-amt-min','rm-amt-max','rm-start','rm-end','rm-notes','rm-custom-subcat','rm-delivery-fee'].forEach(function(id){ var el=document.getElementById(id); if(el) el.value=''; });
  document.getElementById('rm-type').value=type||'expense';
  document.getElementById('rm-freq').value='monthly';
  document.getElementById('rm-amt-type').value='fixed';
  document.getElementById('rm-necessity').value='necessary';
  document.getElementById('rm-category').value='';
  document.getElementById('rm-bad-habit').checked=false;
  var _sub=document.getElementById('rm-subcategory'); if(_sub) _sub.value='';
  var _cw=document.getElementById('rm-custom-wrap'); if(_cw) _cw.style.display='none';
  var _sw=document.getElementById('rm-subcat-wrap'); if(_sw) _sw.style.display='none';
  populateAccountSelect('rm-account',null);
  onRecurringTypeChange(type||'expense');
  onAmtTypeChange('fixed');
  onRecurringCatChange('');
  openModal('recurring-modal');
  setTimeout(function(){ var el=document.getElementById('rm-name'); if(el) el.focus(); },150);
}

function openEditRecurring(id) {
  var r=(DB.enhancedRecurring||[]).find(function(x){return x.id===id;}); if(!r) return;
  document.getElementById('rm-title').textContent='✏️ Edit Recurring';
  document.getElementById('rm-edit-id').value=id;
  document.getElementById('rm-name').value=r.name||'';
  document.getElementById('rm-type').value=r.type||'expense';
  document.getElementById('rm-freq').value=r.frequency||'monthly';
  document.getElementById('rm-start').value=r.startDate||'';
  document.getElementById('rm-end').value=r.endDate||'';
  document.getElementById('rm-notes').value=r.notes||'';
  document.getElementById('rm-necessity').value=r.necessity||'necessary';
  document.getElementById('rm-category').value=r.category||'';
  document.getElementById('rm-bad-habit').checked=!!r.isBadHabit;
  document.getElementById('rm-delivery-fee').value=r.deliveryFee||'';
  var isRange=!!(r.amountMin!=null||r.amountMax!=null);
  document.getElementById('rm-amt-type').value=isRange?'range':'fixed';
  document.getElementById('rm-amount').value=r.amount!=null?r.amount:'';
  document.getElementById('rm-amt-min').value=r.amountMin!=null?r.amountMin:'';
  document.getElementById('rm-amt-max').value=r.amountMax!=null?r.amountMax:'';
  populateAccountSelect('rm-account',r.accountId);
  onRecurringTypeChange(r.type);
  onAmtTypeChange(isRange?'range':'fixed');
  onRecurringCatChange(r.category||'');
  openModal('recurring-modal');
}

function saveRecurring() {
  var name=document.getElementById('rm-name').value.trim();
  if(!name){showToast('⚠️ Name is required');document.getElementById('rm-name').focus();return;}
  var editId=document.getElementById('rm-edit-id').value;
  var amtType=document.getElementById('rm-amt-type').value;
  var subEl=document.getElementById('rm-subcategory');
  var sub=subEl?subEl.value:'';
  var rec={
    id:editId||uid(), name:name,
    type:document.getElementById('rm-type').value,
    accountId:document.getElementById('rm-account').value||null,
    frequency:document.getElementById('rm-freq').value,
    startDate:document.getElementById('rm-start').value||null,
    endDate:document.getElementById('rm-end').value||null,
    amount:amtType==='fixed'?(parseFloat(document.getElementById('rm-amount').value)||0):null,
    amountMin:amtType==='range'?(parseFloat(document.getElementById('rm-amt-min').value)||0):null,
    amountMax:amtType==='range'?(parseFloat(document.getElementById('rm-amt-max').value)||0):null,
    isFlexible:amtType==='range',
    necessity:document.getElementById('rm-necessity').value,
    category:document.getElementById('rm-category').value,
    subcategory:sub==='__custom__'?'__custom__':sub,
    customSubcategory:sub==='__custom__'?(document.getElementById('rm-custom-subcat').value.trim()||null):null,
    deliveryFee:parseFloat(document.getElementById('rm-delivery-fee').value)||null,
    isBadHabit:document.getElementById('rm-bad-habit').checked,
    notes:document.getElementById('rm-notes').value.trim()||null,
    savedAt:new Date().toISOString(),
  };
  if(!DB.enhancedRecurring) DB.enhancedRecurring=[];
  if(editId){ var i=DB.enhancedRecurring.findIndex(function(x){return x.id===editId;}); if(i!==-1) DB.enhancedRecurring[i]=rec; else DB.enhancedRecurring.push(rec); }
  else DB.enhancedRecurring.push(rec);
  // Cross-save to legacy arrays
  var legacy={id:rec.id,name:rec.name,amount:rec.amount!=null?rec.amount:((rec.amountMin||0)+(rec.amountMax||0))/2,
    type:rec.type==='subscription'?'expense':rec.type,frequency:rec.frequency,
    dueDate:rec.startDate||null,date:rec.startDate||null,category:rec.category||null,
    emoji:null,notes:rec.notes||null,autopay:false,flags:[],paid:false,saved:rec.savedAt,_fromSetup:true};
  if(rec.type==='income'){if(!DB.income)DB.income=[];DB.income=DB.income.filter(function(x){return x.id!==rec.id;});DB.income.push(legacy);}
  else if(rec.type==='bill'){if(!DB.bills)DB.bills=[];DB.bills=DB.bills.filter(function(x){return x.id!==rec.id;});DB.bills.push(legacy);}
  else{if(!DB.expenses)DB.expenses=[];DB.expenses=DB.expenses.filter(function(x){return x.id!==rec.id;});DB.expenses.push(legacy);}
  persist(); closeModal('recurring-modal');
  renderEnhancedRecurring();
  showToast('🔁 Recurring saved!');
}

async function deleteRecurring(id) {
  if(!(await HQConfirm.ask('Delete this recurring item?', {danger:true})))return;
  DB.enhancedRecurring=(DB.enhancedRecurring||[]).filter(function(x){return x.id!==id;});
  ['bills','expenses','income'].forEach(function(k){ DB[k]=(DB[k]||[]).filter(function(x){return x.id!==id;}); });
  persist(); renderEnhancedRecurring();
  showToast('🗑️ Deleted');
}

function renderEnhancedRecurring() {
  var el=document.getElementById('recurring-list'); if(!el) return;
  var items=DB.enhancedRecurring||[];
  if(!items.length){el.innerHTML='<div class="empty"><div class="empty-ic">🔁</div>No recurring items yet.</div>';return;}
  var groups={income:[],bill:[],expense:[],subscription:[]};
  items.forEach(function(r){(groups[r.type]||groups.expense).push(r);});
  var typeMeta={income:{label:'💵 Income',color:'var(--green)'},bill:{label:'📋 Bills',color:'var(--red)'},expense:{label:'🔁 Expenses',color:'var(--orange)'},subscription:{label:'📺 Subscriptions',color:'var(--purple)'}};
  var html='';
  ['income','bill','expense','subscription'].forEach(function(type){
    var recs=groups[type]; if(!recs.length) return;
    var tm=typeMeta[type]||{};
    var total=recs.reduce(function(a,r){var amt=r.isFlexible?((r.amountMin||0)+(r.amountMax||0))/2:(r.amount||0);return a+toMonthly(amt,r.frequency);},0);
    html+='<div class="acct-group-hd"><span class="acct-group-label" style="color:'+tm.color+'">'+tm.label+'</span><span class="acct-group-total">'+fmt$(total)+'/mo est.</span></div>';
    html+=recs.map(function(r){
      var acct=(DB.accounts||[]).find(function(a){return a.id===r.accountId;});
      var catMeta=REC_CATEGORIES[r.category]||{};
      var isIncome=r.type==='income';
      var amt=r.isFlexible?(fmt$(r.amountMin)+'–'+fmt$(r.amountMax)):(fmt$(r.amount||0));
      var displaySub=r.subcategory==='__custom__'?(r.customSubcategory||'Custom'):r.subcategory;
      return '<div class="rec-card'+(r.isBadHabit?' bad-habit':'')+'" id="rec-'+r.id+'" data-rtype="'+r.type+'">'
        +'<div class="rec-hd" onclick="document.getElementById(\'rec-'+r.id+'\').classList.toggle(\'open\')">'
        +'<div class="rec-em">'+(catMeta.emoji||(isIncome?'💵':'💸'))+'</div>'
        +'<div class="rec-info"><div class="rec-name">'+esc(r.name)+(r.isBadHabit?' <span class="bad-habit-flag">🚩 Bad Habit</span>':'')+'</div>'
        +'<div class="rec-meta">'
        +'<span>'+r.frequency+'</span>'
        +(r.category?'<span>'+(catMeta.emoji||'')+' '+(catMeta.label||r.category)+'</span>':'')
        +(displaySub?'<span>'+displaySub+'</span>':'')
        +(r.necessity&&r.type!=='income'?'<span class="need-badge '+r.necessity+'">'+(r.necessity==='necessary'?'✅ Needed':'🔶 Optional')+'</span>':'')
        +(acct?'<span>🏦 '+esc(acct.name)+'</span>':'')
        +'</div></div>'
        +'<div class="rec-amt '+(isIncome?'incoming':'outgoing')+'">'+amt+'</div>'
        +'<div class="acct-btns" onclick="event.stopPropagation()">'
        +'<button class="btn-sm" onclick="openEditRecurring(\''+r.id+'\')">✏️</button>'
        +'<button class="btn-sm del" onclick="deleteRecurring(\''+r.id+'\')">🗑️</button>'
        +'</div><div class="fi-ar">▼</div></div>'
        +'<div class="fi-body"><div style="font-size:11px;color:var(--muted);margin-top:6px;display:flex;gap:10px;flex-wrap:wrap">'
        +(r.startDate?'<span>📅 Starts: '+fmtDate(r.startDate)+'</span>':'')
        +(r.endDate?'<span>🔚 Ends: '+fmtDate(r.endDate)+'</span>':'')
        +(r.deliveryFee?'<span>🚚 Delivery fee: '+fmt$(r.deliveryFee)+'</span>':'')
        +(r.notes?'<span>📝 '+esc(r.notes)+'</span>':'')
        +'</div></div></div>';
    }).join('');
  });
  el.innerHTML=html;
}

var _cfMode='forward';
function swCashFlow(mode,btn){
  _cfMode=mode;
  document.querySelectorAll('.cf-tab').forEach(function(b){b.classList.remove('on');});
  btn.classList.add('on');
  renderCashFlowCalendar();
}

function doesRecurringFire(r,date){
  if(!r.startDate) return false;
  var start=new Date(r.startDate+'T12:00:00');
  if(date<start) return false;
  if(r.endDate&&date>new Date(r.endDate+'T12:00:00')) return false;
  var freq=r.frequency;
  var diffDays=Math.round((date-start)/86400000);
  if(freq==='weekly') return diffDays%7===0;
  if(freq==='biweekly') return diffDays%14===0;
  if(freq==='monthly') return date.getDate()===start.getDate();
  if(freq==='bimonthly'){var tm=(date.getFullYear()*12+date.getMonth())-(start.getFullYear()*12+start.getMonth());return date.getDate()===start.getDate()&&tm>=0&&tm%2===0;}
  if(freq==='yearly') return date.getDate()===start.getDate()&&date.getMonth()===start.getMonth();
  return false;
}

function renderCashFlowCalendar(){
  var canvas=document.getElementById('cf-chart'); if(!canvas) return;
  var recurring=DB.enhancedRecurring||[];
  var today=new Date();
  var labels=[],dataIn=[],dataOut=[];
  if(_cfMode==='forward'){
    for(var i=0;i<30;i++){
      var d=new Date(today); d.setDate(today.getDate()+i);
      var dayIn=0,dayOut=0;
      recurring.forEach(function(r){var amt=r.isFlexible?((r.amountMin||0)+(r.amountMax||0))/2:(r.amount||0);if(doesRecurringFire(r,d)){if(r.type==='income')dayIn+=amt;else dayOut+=amt;}});
      labels.push(d.toLocaleDateString('en-US',{month:'short',day:'numeric'}));
      dataIn.push(dayIn);dataOut.push(dayOut);
    }
  } else if(_cfMode==='current'){
    var yr=today.getFullYear(),mo=today.getMonth(),dim=new Date(yr,mo+1,0).getDate();
    for(var i=1;i<=dim;i++){
      var d=new Date(yr,mo,i),ds=d.toISOString().slice(0,10),dayIn=0,dayOut=0;
      DB.transactions.filter(function(t){return t.date===ds;}).forEach(function(t){if(t.type==='income')dayIn+=(+t.amount||0);else dayOut+=(+t.amount||0);});
      recurring.forEach(function(r){var amt=r.isFlexible?((r.amountMin||0)+(r.amountMax||0))/2:(r.amount||0);if(doesRecurringFire(r,d)){if(r.type==='income')dayIn+=amt;else dayOut+=amt;}});
      labels.push(String(i));dataIn.push(dayIn);dataOut.push(dayOut);
    }
  } else {
    for(var i=5;i>=0;i--){
      var d=new Date(today.getFullYear(),today.getMonth()-i,1),ms=d.toISOString().slice(0,7);
      var label=d.toLocaleDateString('en-US',{month:'short',year:'2-digit'});
      var txIn=DB.transactions.filter(function(t){return (t.date||'').startsWith(ms)&&t.type==='income';}).reduce(function(a,t){return a+(+t.amount||0);},0);
      var txOut=DB.transactions.filter(function(t){return (t.date||'').startsWith(ms)&&t.type!=='income';}).reduce(function(a,t){return a+(+t.amount||0);},0);
      labels.push(label);dataIn.push(txIn||0);dataOut.push(txOut||0);
    }
  }
  var cfEmpty=!recurring.length&&_cfMode!=='historical';
  var cfLbl=document.getElementById('cf-empty-msg'); if(cfLbl) cfLbl.style.display=cfEmpty?'block':'none';
  dc('cf-chart',new Chart(canvas,{
    type:'bar',
    data:{labels:labels,datasets:[
      {label:'💵 In',data:dataIn,backgroundColor:'rgba(42,122,78,.65)',borderRadius:3},
      {label:'💸 Out',data:dataOut,backgroundColor:'rgba(181,48,48,.55)',borderRadius:3},
    ]},
    options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{labels:{color:'#a0a0cc',font:{size:10},boxWidth:10}}},
      scales:{x:{ticks:{color:'#789A88',font:{size:9},maxRotation:45,maxTicksLimit:15},grid:{color:'rgba(100,100,100,.08)'},border:{display:false}},
        y:{ticks:{color:'#789A88',font:{size:9},callback:function(v){return '$'+Math.abs(v).toLocaleString();}},grid:{color:'rgba(100,100,100,.08)'},border:{display:false}}}}
  }));
}

function renderEnvelopes(){
  var el=document.getElementById('envelopes-list'); if(!el) return;
  var totals=calcTotals();
  var income=totals.income||0;
  var envelopes=DB.envelopes||[];
  var usedPct=envelopes.reduce(function(a,e){return a+(+e.pct||0);},0);
  var remaining=100-usedPct;
  var incEl=document.getElementById('env-income-display'); if(incEl) incEl.textContent=fmt$(income)+'/mo';
  var pctEl=document.getElementById('env-used-pct'); if(pctEl) pctEl.textContent=usedPct+'% allocated'+(remaining>0?' · '+remaining+'% unallocated':'');
  var barEl=document.getElementById('env-used-bar'); if(barEl){barEl.style.width=Math.min(100,usedPct)+'%';barEl.style.background=usedPct>100?'var(--red)':usedPct>90?'var(--orange)':'var(--purple)';}
  if(!envelopes.length){el.innerHTML='<div class="empty"><div class="empty-ic">📬</div>No envelopes yet.</div>';return;}
  el.innerHTML=envelopes.map(function(e){
    var dollarAmt=income*(+e.pct||0)/100;
    return '<div class="env-card"><div style="display:flex;align-items:center;gap:10px"><div style="font-size:22px">'+(e.emoji||'📬')+'</div><div style="flex:1"><div style="font-weight:700;font-size:13px">'+esc(e.name)+'</div><div style="font-size:10px;color:var(--muted)">'+e.pct+'% of income</div></div><div style="font-weight:900;font-size:14px;color:var(--purple)">'+fmt$(dollarAmt)+'/mo</div><button class="btn-sm del" onclick="deleteEnvelope(\''+e.id+'\')">🗑️</button></div><div class="rb-track" style="margin-top:7px;height:6px"><div class="rb-fill" style="width:'+e.pct+'%;background:var(--purple)"></div></div></div>';
  }).join('');
}

function openAddEnvelopePrompt(){
  var name=(prompt('📬 Envelope name:')||'').trim(); if(!name) return;
  var emoji=prompt('Emoji (optional):','📬')||'📬';
  var pctRaw=prompt('% of monthly income:','10'); if(!pctRaw) return;
  var pct=parseFloat(pctRaw);
  if(isNaN(pct)||pct<=0||pct>100){HQToast.warn('Enter a number between 1 and 100.');return;}
  if(!DB.envelopes) DB.envelopes=[];
  DB.envelopes.push({id:uid(),name:name,emoji:emoji,pct:pct});
  persist(); renderEnvelopes(); showToast('📬 Envelope added!');
}

function deleteEnvelope(id){
  DB.envelopes=(DB.envelopes||[]).filter(function(x){return x.id!==id;});
  persist(); renderEnvelopes(); showToast('🗑️ Deleted');
}

// Also extend load() to handle new DB keys
var _fsOrigLoad = load;
load = function() {
  _fsOrigLoad();
  if(!DB.accounts) DB.accounts=[];
  if(!DB.enhancedRecurring) DB.enhancedRecurring=[];
  if(!DB.envelopes) DB.envelopes=[];
};

// Extend sw for Finance Setup tab — chain from existing sw
var _fsSw = window.sw;
window.sw = function(id, btn) {
  if(typeof _fsSw === 'function') _fsSw(id, btn);
  if(id==='setup'){
    renderAccounts();
    renderEnhancedRecurring();
    populateAllAccountSelects();
    renderEnvelopes();
  }
};

// Also extend renderOverview to include new cards
var _fsRenderOv = renderOverview;
renderOverview = function() {
  _fsRenderOv();
  renderNetWorth();
  renderCashFlowCalendar();
};

} catch(e) { console.error('Finance Setup block error:', e); }


// ── HQEnvironment (Tier 6 adoption) ───────────────────────────────────────
// In survival mode, hide cash flow chart and setup tab; keep overview/bills.
var _mbSurvivalHidden = ['tab-cashflow', 'tab-setup', 'cf-chart'];
function _mbApplySurvival() {
  var inSurvival = window.HQEnvironment && HQEnvironment.isSurvival();
  _mbSurvivalHidden.forEach(function(id) {
    var el = document.getElementById(id);
    if (!el) return;
    if (inSurvival) el.setAttribute('data-survival-hidden', '1');
    else            el.removeAttribute('data-survival-hidden');
  });
}
window.addEventListener('hq-environment-changed', _mbApplySurvival);
_mbApplySurvival();

// ── EXPOSE TO GLOBAL SCOPE (HTML onclick/oninput/onchange handlers) ──────────
window.closeCsvImport          = closeCsvImport;
window.closeDebtModal          = closeDebtModal;
window.closeModal              = closeModal;
window.closePanicMode          = closePanicMode;
window.confirmCsvImport        = confirmCsvImport;
window.exportData              = exportData;
window.importData              = importData;
window.onAccountCategoryChange = onAccountCategoryChange;
window.onAmtTypeChange         = onAmtTypeChange;
window.onRecurringCatChange    = onRecurringCatChange;
window.onRecurringSubChange    = onRecurringSubChange;
window.onRecurringTypeChange   = onRecurringTypeChange;
window.openAddAccount          = openAddAccount;
window.openAddDebt             = openAddDebt;
window.openAddEnvelopePrompt   = openAddEnvelopePrompt;
window.openAddGoal             = openAddGoal;
window.openAddItem             = openAddItem;
window.openAddRecurring        = openAddRecurring;
window.openCsvImport           = openCsvImport;
window.openModal               = openModal;
window.parseCsvImportFile      = parseCsvImportFile;
window.saveAccount             = saveAccount;
window.saveDebt                = saveDebt;
window.saveGoal                = saveGoal;
window.saveItem                = saveItem;
window.saveRecurring           = saveRecurring;
window.setTxFilter             = setTxFilter;
window.swCashFlow              = swCashFlow;
window.swSetup                 = swSetup;
window.toggleSafeView          = toggleSafeView;

})(); // end money-brain IIFE
