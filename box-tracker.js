// Theme/nav/clock: delegated to hq-core.js

// ══════════════════════════════════════════════════
// MIGRATE OLD KEY → NEW STANDARD KEY
// ══════════════════════════════════════════════════
(function migrateLS(){
  // bt-theme → removed (now uses audhd-hq-theme via hq-core)
  // life scores: hq-life-scores → audhd-hq-life-areas
  const oldLife = HQSafe.store.get(HQKeys.LIFE_AREAS);
  if(oldLife && !HQSafe.store.get(HQKeys.LIFE_AREAS)){
    HQSafe.store.set(HQKeys.LIFE_AREAS, oldLife);
    HQSafe.store.remove(HQKeys.LIFE_AREAS);
  }
})();

// ══════════════════════════════════════════════════
// STICKER DEFINITIONS
// ══════════════════════════════════════════════════
const STICKERS=[
  {id:'fragile',    label:'Fragile',         em:'🔴'},
  {id:'liquids',    label:'Liquids',          em:'💧'},
  {id:'heavy',      label:'Heavy',            em:'⚠️'},
  {id:'thisside',   label:'This Side Up',     em:'↑'},
  {id:'cold',       label:'Keep Cold',        em:'❄️'},
  {id:'dry',        label:'Keep Dry',         em:'🌂'},
  {id:'priority',   label:'Priority',         em:'⚡'},
  {id:'handle',     label:'Handle w/ Care',   em:'🤲'},
  {id:'electronics',label:'Electronics',      em:'💻'},
  {id:'valuable',   label:'Valuable',         em:'💎'},
  {id:'nostack',    label:'Do Not Stack',     em:'🚫'},
  {id:'openlast',   label:'Open Last',        em:'🎁'},
  {id:'unpackfirst',label:'Unpack First',     em:'🏠'},
];
const STK_MAP=Object.fromEntries(STICKERS.map(s=>[s.id,s]));

// ══════════════════════════════════════════════════
// LIFE AREAS
// ══════════════════════════════════════════════════
const LIFE_AREAS=[
  {id:'health',   icon:'🩺',title:'Health',   color:'#FF6BA8',bg:'rgba(255,107,168,.18)'},
  {id:'money',    icon:'💰',title:'Money',    color:'#F4CA00',bg:'rgba(244,202,0,.18)'},
  {id:'social',   icon:'💬',title:'Social',   color:'#4ECDC4',bg:'rgba(78,205,196,.18)'},
  {id:'work',     icon:'💼',title:'Work',     color:'#C8BAFF',bg:'rgba(200,186,255,.18)'},
  {id:'home',     icon:'🏠',title:'Home',     color:'#06D6A0',bg:'rgba(6,214,160,.18)'},
  {id:'creative', icon:'🎨',title:'Creative', color:'#FF876C',bg:'rgba(255,135,108,.18)'},
  {id:'learning', icon:'📚',title:'Learning', color:'#9b6dff',bg:'rgba(155,109,255,.18)'},
  {id:'rest',     icon:'🛋️',title:'Rest',     color:'#B0A0D8',bg:'rgba(176,160,216,.18)'},
  {id:'purpose',  icon:'🌟',title:'Purpose',  color:'#FFA060',bg:'rgba(255,160,96,.18)'},
];

function renderLifeShelf(){
  let saved = {};
  try{ saved = HQSafe.store.get(HQKeys.LIFE_AREAS, {}); }catch(e){}
  const html = LIFE_AREAS.map(a=>{
    const score = saved[a.id] || 5;
    const pct = (score/10)*100;
    return `<div class="life-box" style="background:${a.bg};border-color:${a.color}40;" onclick="openLifeBox('${a.id}')">
      <div class="lb-icon">${a.icon}</div>
      <div class="lb-title">${a.title}</div>
      <div class="lb-score" style="color:${a.color}">${score}<span style="font-size:11px;font-weight:600;opacity:.6">/10</span></div>
      <div class="lb-bar"><div class="lb-fill" style="width:${pct}%;background:${a.color};"></div></div>
    </div>`;
  }).join('');
  document.getElementById('life-shelf').innerHTML = html;
}

function openLifeBox(id){
  const area = LIFE_AREAS.find(a=>a.id===id);
  let saved = {};
  try{ saved = HQSafe.store.get(HQKeys.LIFE_AREAS, {}); }catch(e){}
  const current = saved[id] || 5;
  const score = prompt(`${area.icon} ${area.title} — Score (1–10):\n\nCurrent: ${current}/10`, current);
  if(score !== null && !isNaN(+score)){
    saved[id] = Math.min(10, Math.max(1, parseInt(score)));
    HQSafe.store.set(HQKeys.LIFE_AREAS, saved);
    renderLifeShelf();
  }
}

// ══════════════════════════════════════════════════
// DATA
// ══════════════════════════════════════════════════
const STORE = HQKeys.BOXES;
let DB = {locations:[]};
function load(){ DB = HQSafe.store.get(STORE, {locations:[]}); }
function persist(){ HQSafe.store.set(STORE, DB); }
const uid = () => HQUtils.uid(); // → HQUtils.uid

function migrateDB(){
  if(!DB.locations) DB.locations=[];
  if(!DB.locations.find(l=>l.id==='_unassigned')){
    DB.locations.unshift({id:'_unassigned',name:'Unassigned',emoji:'📦',containers:[]});
  }
  DB.locations.forEach(loc=>{
    if(!loc.containers) loc.containers=[];
    loc.containers.forEach(cont=>{
      if(!cont.size) cont.size='MD';
      if(!cont.type) cont.type='';
      if(cont.packed===undefined) cont.packed=false;
      if(!cont.stickers) cont.stickers=[];
      if(cont.notes===undefined) cont.notes='';
      if(!cont.items) cont.items=[];
    });
  });
}

// ══════════════════════════════════════════════════
// TABS
// ══════════════════════════════════════════════════

// ══════════════════════════════════════════════════
// MODALS
// ══════════════════════════════════════════════════
function openModal(id){ document.getElementById(id).classList.add('show'); }
function closeModal(id){ document.getElementById(id).classList.remove('show'); }

// ══════════════════════════════════════════════════
// EMOJI PICKERS
// ══════════════════════════════════════════════════
function bindEmojiPicker(groupId){
  document.querySelectorAll('#'+groupId+' .epick').forEach(btn=>{
    btn.onclick=()=>{
      document.querySelectorAll('#'+groupId+' .epick').forEach(b=>b.classList.remove('sel'));
      btn.classList.add('sel');
    };
  });
}
function getSelEmoji(groupId){
  const sel=document.querySelector('#'+groupId+' .epick.sel');
  return sel?sel.dataset.e:'📦';
}

// ══════════════════════════════════════════════════
// FLAG CHECKS
// ══════════════════════════════════════════════════
function togFchk(btn){ btn.classList.toggle('on'); }
function getFlags(){ return[...document.querySelectorAll('#item-modal .fchk.on')].map(b=>b.dataset.f); }
function clearFchks(){ document.querySelectorAll('#item-modal .fchk.on').forEach(b=>b.classList.remove('on')); }

// ══════════════════════════════════════════════════
// ROOM DROPDOWNS
// ══════════════════════════════════════════════════
function populateRoomDropdowns(){
  const rooms = DB.locations;
  const fRoom = document.getElementById('f-room');
  const prev = fRoom.value;
  fRoom.innerHTML='<option value="">📍 All Rooms</option>'+
    rooms.filter(l=>l.id!=='_unassigned'||l.containers.length).map(l=>`<option value="${l.id}">${l.emoji} ${esc(l.name)}</option>`).join('');
  fRoom.value=prev;
  const bmRoom = document.getElementById('bm-room');
  bmRoom.innerHTML='<option value="">📦 Unassigned</option>'+
    rooms.filter(l=>l.id!=='_unassigned').map(l=>`<option value="${l.id}">${l.emoji} ${esc(l.name)}</option>`).join('');
}

// ══════════════════════════════════════════════════
// ROOMS
// ══════════════════════════════════════════════════
function openAddRoom(){
  document.getElementById('room-modal-title').textContent='📍 Add Room';
  document.getElementById('room-name').value='';
  document.getElementById('room-edit-id').value='';
  document.querySelectorAll('#room-emojis .epick').forEach((b,i)=>b.classList.toggle('sel',i===0));
  bindEmojiPicker('room-emojis');
  openModal('room-modal');
  setTimeout(()=>document.getElementById('room-name').focus(),150);
}
function openEditRoom(id){
  const loc=DB.locations.find(l=>l.id===id);if(!loc)return;
  document.getElementById('room-modal-title').textContent='✏️ Edit Room';
  document.getElementById('room-name').value=loc.name;
  document.getElementById('room-edit-id').value=id;
  document.querySelectorAll('#room-emojis .epick').forEach(b=>b.classList.toggle('sel',b.dataset.e===loc.emoji));
  bindEmojiPicker('room-emojis');
  openModal('room-modal');
  setTimeout(()=>document.getElementById('room-name').focus(),150);
}
function saveRoom(){
  const name=document.getElementById('room-name').value.trim();if(!name)return;
  const emoji=getSelEmoji('room-emojis');
  const editId=document.getElementById('room-edit-id').value;
  if(editId){ const loc=DB.locations.find(l=>l.id===editId); if(loc){loc.name=name;loc.emoji=emoji;} }
  else DB.locations.push({id:uid(),name,emoji,containers:[]});
  persist();populateRoomDropdowns();closeModal('room-modal');renderInventory();
  if(document.getElementById('tab-org').classList.contains('on'))renderOrganize();
  showToast('📍 Room saved!');
}
async function delRoom(id){
  const loc=DB.locations.find(l=>l.id===id);if(!loc)return;
  if(loc.containers.length&&!(await HQConfirm.ask(`Delete "${loc.name}" and all its boxes?`, {danger:true})))return;
  DB.locations=DB.locations.filter(l=>l.id!==id);
  persist();populateRoomDropdowns();renderInventory();
  if(document.getElementById('tab-org').classList.contains('on'))renderOrganize();
  showToast('🗑️ Room deleted');
}

// ══════════════════════════════════════════════════
// BOXES
// ══════════════════════════════════════════════════
function openAddBox(locId){
  document.getElementById('box-modal-title').textContent='📦 New Box';
  document.getElementById('bm-name').value='';
  document.getElementById('bm-size').value='MD';
  document.getElementById('bm-type').value='';
  document.getElementById('bm-edit-id').value='';
  document.getElementById('bm-loc-id').value=locId||'';
  document.querySelectorAll('#bm-stickers .fchk').forEach(b=>b.classList.remove('on'));
  populateRoomDropdowns();
  if(locId) document.getElementById('bm-room').value=locId;
  else document.getElementById('bm-room').value='';
  openModal('box-modal');
  setTimeout(()=>document.getElementById('bm-name').focus(),150);
}
function saveBox(){
  const name=document.getElementById('bm-name').value.trim();if(!name)return;
  const roomId=document.getElementById('bm-room').value||'_unassigned';
  const size=document.getElementById('bm-size').value||'MD';
  const type=document.getElementById('bm-type').value||'';
  const editId=document.getElementById('bm-edit-id').value;
  const stickers=[...document.querySelectorAll('#bm-stickers .fchk.on')].map(b=>b.dataset.s);
  let loc=DB.locations.find(l=>l.id===roomId);
  if(!loc){loc=DB.locations.find(l=>l.id==='_unassigned');if(!loc){DB.locations.unshift({id:'_unassigned',name:'Unassigned',emoji:'📦',containers:[]});loc=DB.locations[0];}}
  if(editId){
    DB.locations.forEach(l=>{
      const ci=l.containers.findIndex(c=>c.id===editId);
      if(ci!==-1){
        const existing=l.containers[ci];
        existing.name=name;existing.size=size;existing.type=type;existing.stickers=stickers;
        if(l.id!==roomId){
          let tgt=DB.locations.find(ll=>ll.id===roomId)||DB.locations.find(ll=>ll.id==='_unassigned');
          l.containers.splice(ci,1);
          tgt.containers.push(existing);
        }
      }
    });
  } else {
    loc.containers.push({id:uid(),name,size,type,packed:false,stickers,notes:'',items:[]});
  }
  persist();closeModal('box-modal');renderInventory();showToast('📦 Box saved!');
}
async function delCont(locId,contId){
  if(!(await HQConfirm.ask('Delete this box and all its items?', {danger:true})))return;
  const loc=DB.locations.find(l=>l.id===locId);if(!loc)return;
  loc.containers=loc.containers.filter(c=>c.id!==contId);
  persist();renderInventory();
  if(document.getElementById('tab-org').classList.contains('on'))renderOrganize();
  showToast('🗑️ Box deleted');
}

// ══════════════════════════════════════════════════
// BOX INLINE ACTIONS
// ══════════════════════════════════════════════════
function renameBox(locId,contId,val){
  const cont=findCont(locId,contId);if(!cont)return;
  cont.name=val.trim()||cont.name; persist();
}
function setSize(locId,contId,sz){
  const cont=findCont(locId,contId);if(!cont)return;
  cont.size=sz;persist();
  const card=document.getElementById('box-'+contId);
  if(card) card.querySelectorAll('.sz-btn').forEach(b=>b.classList.toggle('on',b.dataset.sz===sz));
}
function setType(locId,contId,val){
  const cont=findCont(locId,contId);if(!cont)return;
  cont.type=val;persist();
}
function moveToRoom(contId,newLocId){
  let srcLoc=null,cont=null;
  DB.locations.forEach(l=>{const c=l.containers.find(x=>x.id===contId);if(c){srcLoc=l;cont=c;}});
  if(!cont||!srcLoc)return;
  const tgt=DB.locations.find(l=>l.id===(newLocId||'_unassigned'));if(!tgt)return;
  srcLoc.containers=srcLoc.containers.filter(c=>c.id!==contId);
  tgt.containers.push(cont);
  persist();renderInventory();showToast('📍 Moved to '+tgt.name);
}
function togglePacked(locId,contId){
  const cont=findCont(locId,contId);if(!cont)return;
  cont.packed=!cont.packed;persist();
  const card=document.getElementById('box-'+contId);
  if(card){
    card.classList.toggle('packed',cont.packed);
    const pb=card.querySelector('.pack-btn');
    if(pb){pb.textContent=cont.packed?'✅ Packed':'Mark Packed';pb.classList.toggle('packed',cont.packed);}
    const stamp=card.querySelector('.packed-stamp');
    if(stamp) stamp.style.display=cont.packed?'':'none';
  }
  updateStats();showToast(cont.packed?'✅ Marked packed!':'📦 Unpacked');
}
function saveNotes(locId,contId,val){
  const cont=findCont(locId,contId);if(!cont)return;
  cont.notes=val;persist();
}
function toggleSticker(locId,contId,stkId){
  const cont=findCont(locId,contId);if(!cont)return;
  const i=cont.stickers.indexOf(stkId);
  if(i===-1) cont.stickers.push(stkId);
  else cont.stickers.splice(i,1);
  persist();
  const card=document.getElementById('box-'+contId);
  if(card){ const zone=card.querySelector('.stickers-zone'); if(zone) zone.innerHTML=buildStickersHTML(cont,locId); }
  updateStats();
}
function findCont(locId,contId){
  const loc=DB.locations.find(l=>l.id===locId);
  return loc?.containers.find(c=>c.id===contId)||null;
}

// ══════════════════════════════════════════════════
// STICKER PICKER
// ══════════════════════════════════════════════════
let activePicker=null;
function openStickerPicker(locId,contId,btn){
  document.querySelectorAll('.stk-picker.show').forEach(p=>p.classList.remove('show'));
  if(activePicker===contId){activePicker=null;return;}
  activePicker=contId;
  const card=document.getElementById('box-'+contId);if(!card)return;
  let picker=card.querySelector('.stk-picker');
  if(!picker){
    picker=document.createElement('div');
    picker.className='stk-picker';
    const cont=findCont(locId,contId);
    picker.innerHTML=`<div class="stk-picker-hd">Add / Remove Stickers</div>
      <div class="stk-picker-grid">
        ${STICKERS.map(s=>`
          <button class="stk-pick-opt${(cont?.stickers||[]).includes(s.id)?' on':''}"
            data-sid="${s.id}"
            onclick="toggleSticker('${locId}','${contId}','${s.id}');this.classList.toggle('on')">
            ${s.em} ${s.label}
          </button>`).join('')}
      </div>`;
    btn.closest('.stickers-zone').appendChild(picker);
  } else {
    const cont=findCont(locId,contId);
    picker.querySelectorAll('.stk-pick-opt').forEach(b=>{
      b.classList.toggle('on',(cont?.stickers||[]).includes(b.dataset.sid));
    });
  }
  picker.classList.add('show');
}
document.addEventListener('click',e=>{
  if(!e.target.closest('.stickers-zone')){
    document.querySelectorAll('.stk-picker.show').forEach(p=>p.classList.remove('show'));
    activePicker=null;
  }
});

function buildStickersHTML(cont,locId){
  const active=cont.stickers||[];
  let html=active.map(sid=>{
    const s=STK_MAP[sid];if(!s)return'';
    return`<span class="box-sticker stk-${sid}" title="Tap to remove" onclick="toggleSticker('${locId}','${cont.id}','${sid}')">${s.em} ${s.label}</span>`;
  }).join('');
  html+=`<button class="add-stk-btn" onclick="event.stopPropagation();openStickerPicker('${locId}','${cont.id}',this)">+ 🏷️ Sticker</button>`;
  return html;
}

// ══════════════════════════════════════════════════
// ITEMS
// ══════════════════════════════════════════════════
function openAddItem(locId,contId){
  document.getElementById('item-modal-title').textContent='➕ Add Item';
  document.getElementById('item-name').value='';
  document.getElementById('item-cat').value='';
  document.getElementById('item-qty').value='1';
  document.getElementById('item-notes').value='';
  document.getElementById('item-loc-id').value=locId;
  document.getElementById('item-cont-id').value=contId;
  document.getElementById('item-edit-id').value='';
  clearFchks();
  openModal('item-modal');
  setTimeout(()=>document.getElementById('item-name').focus(),150);
}
function openEditItem(locId,contId,itemId){
  const cont=findCont(locId,contId);
  const item=cont?.items.find(i=>i.id===itemId);if(!item)return;
  document.getElementById('item-modal-title').textContent='✏️ Edit Item';
  document.getElementById('item-name').value=item.name;
  document.getElementById('item-cat').value=item.category||'';
  document.getElementById('item-qty').value=item.quantity||1;
  document.getElementById('item-notes').value=item.notes||'';
  document.getElementById('item-loc-id').value=locId;
  document.getElementById('item-cont-id').value=contId;
  document.getElementById('item-edit-id').value=itemId;
  clearFchks();
  (item.flags||[]).forEach(f=>{const b=document.querySelector(`#item-modal .fchk[data-f="${f}"]`);if(b)b.classList.add('on');});
  openModal('item-modal');
  setTimeout(()=>document.getElementById('item-name').focus(),150);
}
function saveItem(){
  const name=document.getElementById('item-name').value.trim();if(!name)return;
  const locId=document.getElementById('item-loc-id').value;
  const contId=document.getElementById('item-cont-id').value;
  const editId=document.getElementById('item-edit-id').value;
  const cont=findCont(locId,contId);if(!cont)return;
  const item={id:editId||uid(),name,
    category:document.getElementById('item-cat').value,
    quantity:+document.getElementById('item-qty').value||1,
    flags:getFlags(),
    notes:document.getElementById('item-notes').value.trim()};
  if(editId){const i=cont.items.findIndex(x=>x.id===editId);if(i!==-1)cont.items[i]=item;}
  else cont.items.push(item);
  persist();closeModal('item-modal');renderInventory();
  if(document.getElementById('tab-org').classList.contains('on'))renderOrganize();
  showToast('✅ Item saved!');
  // Sync action flags to index
  btHqFlagCheck();
}
function addItemQuick(locId,contId,inputEl){
  const name=inputEl.value.trim();if(!name)return;
  const cont=findCont(locId,contId);if(!cont)return;
  cont.items.push({id:uid(),name,category:'',quantity:1,flags:[],notes:''});
  persist();inputEl.value='';
  renderBoxItems(locId,contId);
  updateStats();
  if(document.getElementById('tab-org').classList.contains('on'))renderOrganize();
}
function delItem(locId,contId,itemId){
  const cont=findCont(locId,contId);if(!cont)return;
  cont.items=cont.items.filter(i=>i.id!==itemId);
  persist();renderBoxItems(locId,contId);updateStats();
  if(document.getElementById('tab-org').classList.contains('on'))renderOrganize();
  showToast('🗑️ Item removed');
  btHqFlagCheck();
}
function renderBoxItems(locId,contId){
  const card=document.getElementById('box-'+contId);if(!card)return;
  const list=card.querySelector('.items-list');
  const toggle=card.querySelector('.items-toggle');
  const cont=findCont(locId,contId);if(!cont)return;
  if(list) list.innerHTML=cont.items.map(i=>renderItemRow(i,locId,contId)).join('');
  if(toggle){ const cnt=toggle.querySelector('.item-count'); if(cnt) cnt.textContent=`${cont.items.length} item${cont.items.length!==1?'s':''}`; }
}
function renderItemRow(item,locId,contId){
  const FL={donate:'🎁',duplicate:'♊',move:'📍',seasonal:'❄️',fragile:'⚠️'};
  const flagHTML=(item.flags||[]).map(f=>`<span class="item-flag flag-${f}">${FL[f]||f}</span>`).join('');
  return`<div class="item-row" draggable="true"
    ondragstart="dragStart(event,'${locId}','${contId}','${item.id}')"
    ondragend="this.classList.remove('dragging')"
    id="item-${item.id}">
    <div class="item-drag">⠿</div>
    <div class="item-info">
      <div class="item-name">${esc(item.name)}${item.quantity>1?` <span style="color:var(--text-muted);font-weight:400">×${item.quantity}</span>`:''}</div>
      ${item.category?`<div class="item-cat">${item.category}</div>`:`<div class="item-cat" style="color:var(--pink);font-style:italic">Uncategorized</div>`}
      ${flagHTML?`<div class="item-flags">${flagHTML}</div>`:''}
    </div>
    <span class="item-edit" onclick="openEditItem('${locId}','${contId}','${item.id}')" title="Edit">✏️</span>
    <button class="item-del" onclick="delItem('${locId}','${contId}','${item.id}')" title="Remove">✕</button>
  </div>`;
}
function togItems(id){
  const card=document.getElementById('box-'+id);
  if(card) card.classList.toggle('items-open');
}

// ══════════════════════════════════════════════════
// DRAG & DROP
// ══════════════════════════════════════════════════
let dragData=null;
function dragStart(ev,locId,contId,itemId){
  dragData={locId,contId,itemId};
  ev.dataTransfer.effectAllowed='move';
  setTimeout(()=>{const el=document.getElementById('item-'+itemId);if(el)el.classList.add('dragging');},0);
}
function dropItem(ev,targetLocId,targetContId){
  ev.preventDefault();
  document.querySelectorAll('.box-card').forEach(c=>c.style.outline='');
  if(!dragData)return;
  const{locId,contId,itemId}=dragData;
  if(locId===targetLocId&&contId===targetContId)return;
  const srcCont=findCont(locId,contId);
  const item=srcCont?.items.find(i=>i.id===itemId);if(!item)return;
  const tgtCont=findCont(targetLocId,targetContId);if(!tgtCont)return;
  srcCont.items=srcCont.items.filter(i=>i.id!==itemId);
  tgtCont.items.push(item);
  dragData=null;
  persist();renderInventory();
  if(document.getElementById('tab-org').classList.contains('on'))renderOrganize();
  showToast(`📦 Moved to ${tgtCont.name}`);
}

// ══════════════════════════════════════════════════
// BUILD BOX CARD
// ══════════════════════════════════════════════════
function buildBoxCard(cont,loc,num){
  const TYPE_EM={bin:'🪣',bag:'👜',suitcase:'🧳',crate:'📋',bag2:'🎒'};
  const typeEm=TYPE_EM[cont.type]||'📦';
  const itemCount=cont.items.length;

  return`<div class="box-card${cont.packed?' packed':''} items-open" id="box-${cont.id}"
    ondragover="event.preventDefault();this.style.outline='2px solid var(--accent-gold)'"
    ondragleave="this.style.outline=''"
    ondrop="dropItem(event,'${loc.id}','${cont.id}');this.style.outline=''">

    <div class="box-flap"><div class="box-tape"></div></div>

    <div class="box-body">
      <div class="box-top">
        <div class="box-num">${typeEm} #${num}</div>
        ${cont.packed?`<div class="packed-stamp">✅ PACKED</div>`:''}
        <div class="size-row">
          ${['SM','MD','LG','XLG'].map(s=>`<button class="sz-btn${cont.size===s?' on':''}" data-sz="${s}" onclick="setSize('${loc.id}','${cont.id}','${s}')">${s}</button>`).join('')}
        </div>
        <button class="box-act-btn del" onclick="delCont('${loc.id}','${cont.id}')" title="Delete box">🗑️</button>
      </div>

      <input class="box-name-in" value="${esc(cont.name)}"
        onblur="renameBox('${loc.id}','${cont.id}',this.value)"
        onkeydown="if(event.key==='Enter')this.blur()"
        placeholder="Box name…">

      <div class="box-meta">
        <select class="box-sel" onchange="moveToRoom('${cont.id}',this.value)">
          <option value="">📦 Unassigned</option>
          ${DB.locations.filter(l=>l.id!=='_unassigned').map(l=>`<option value="${l.id}"${l.id===loc.id?' selected':''}>${l.emoji} ${esc(l.name)}</option>`).join('')}
        </select>
        <select class="box-sel" onchange="setType('${loc.id}','${cont.id}',this.value)">
          <option value=""${!cont.type?' selected':''}>📦 Cardboard</option>
          <option value="bin"${cont.type==='bin'?' selected':''}>🪣 Plastic Bin</option>
          <option value="bag"${cont.type==='bag'?' selected':''}>👜 Bag / Tote</option>
          <option value="suitcase"${cont.type==='suitcase'?' selected':''}>🧳 Suitcase</option>
          <option value="crate"${cont.type==='crate'?' selected':''}>📋 Crate</option>
          <option value="bag2"${cont.type==='bag2'?' selected':''}>🎒 Backpack</option>
        </select>
      </div>

      <div class="stickers-zone">${buildStickersHTML(cont,loc.id)}</div>

      <div class="items-toggle" onclick="togItems('${cont.id}')">
        <span class="item-count">${itemCount} item${itemCount!==1?'s':''}</span>
        <span class="arr">▼</span>
        <span style="font-size:10px;color:var(--text-muted);font-weight:500;margin-left:auto" onclick="event.stopPropagation();openAddItem('${loc.id}','${cont.id}')">+ Add detailed</span>
      </div>
      <div class="items-list">
        ${cont.items.map(i=>renderItemRow(i,loc.id,cont.id)).join('')}
      </div>

      <div class="box-add-row">
        <input class="box-add-in" placeholder="Quick add item…" id="qi-${cont.id}"
          onkeydown="if(event.key==='Enter')addItemQuick('${loc.id}','${cont.id}',this)">
        <button class="box-add-btn" onclick="addItemQuick('${loc.id}','${cont.id}',document.getElementById('qi-${cont.id}'))">+</button>
      </div>

      <textarea class="box-notes" placeholder="Notes, fragile details, loading order…"
        onblur="saveNotes('${loc.id}','${cont.id}',this.value)">${esc(cont.notes||'')}</textarea>

      <div class="box-bottom">
        <button class="pack-btn${cont.packed?' packed':''}" onclick="togglePacked('${loc.id}','${cont.id}')">
          ${cont.packed?'✅ Packed':'Mark Packed'}
        </button>
        <button class="box-del-btn" onclick="delCont('${loc.id}','${cont.id}')" title="Delete">🗑️</button>
      </div>
    </div>
  </div>`;
}

// ══════════════════════════════════════════════════
// RENDER INVENTORY
// ══════════════════════════════════════════════════
function renderInventory(){
  updateStats();
  populateRoomDropdowns();

  const q=(document.getElementById('inv-search').value||'').toLowerCase();
  const roomF=document.getElementById('f-room').value;
  const stickerF=document.getElementById('f-sticker').value;
  const sizeF=document.getElementById('f-size').value;

  const grid=document.getElementById('boxes-grid');
  let html=''; let boxNum=0; let totalVisible=0;

  DB.locations.forEach(loc=>{
    if(roomF&&loc.id!==roomF) return;
    const visConts=loc.containers.filter(cont=>{
      if(stickerF&&!cont.stickers.includes(stickerF)) return false;
      if(sizeF&&cont.size!==sizeF) return false;
      if(q){
        const nameMatch=cont.name.toLowerCase().includes(q);
        const itemMatch=cont.items.some(i=>i.name.toLowerCase().includes(q));
        if(!nameMatch&&!itemMatch) return false;
      }
      return true;
    });
    if(!visConts.length) return;
    totalVisible+=visConts.length;

    if(!roomF){
      html+=`<div class="grid-section-hd">${loc.emoji} ${esc(loc.name)} <span style="font-size:10px;font-weight:600;letter-spacing:0;text-transform:none;font-family:'Plus Jakarta Sans',sans-serif">${visConts.length} box${visConts.length!==1?'es':''}</span></div>`;
    }
    visConts.forEach(cont=>{ boxNum++; html+=buildBoxCard(cont,loc,boxNum); });

    if(!roomF||roomF===loc.id){
      html+=`<div class="add-box-placeholder" onclick="openAddBox('${loc.id}')">
        <div class="plus-ic">📦</div>+ Add Box${loc.id!=='_unassigned'?' to '+esc(loc.name):''}
      </div>`;
    }
  });

  if(!totalVisible){
    html=`<div class="empty-state">
      <span class="empty-ic">${roomF||stickerF||sizeF||q?'🔍':'📦'}</span>
      <div class="empty-msg">${roomF||stickerF||sizeF||q?'No boxes match your filters.':'No boxes yet.'}</div>
      <div class="empty-sub">${roomF||stickerF||sizeF||q?'Try clearing a filter.':'Click \"+ New Box\" to get started.'}</div>
    </div>`;
  }

  html+=`<button class="add-room-btn" onclick="openAddRoom()">+ Add Room</button>`;
  grid.innerHTML=html;
}

// ══════════════════════════════════════════════════
// STATS
// ══════════════════════════════════════════════════
function updateStats(){
  const allConts=DB.locations.flatMap(l=>l.containers.map(c=>({...c,loc:l})));
  const total=allConts.length;
  const packed=allConts.filter(c=>c.packed).length;
  const fragile=allConts.filter(c=>c.stickers.includes('fragile')).length;
  const liquids=allConts.filter(c=>c.stickers.includes('liquids')).length;
  const heavy=allConts.filter(c=>c.stickers.includes('heavy')).length;
  const totalItems=allConts.reduce((a,c)=>a+c.items.length,0);

  document.getElementById('s-total').textContent=total;
  document.getElementById('s-packed').textContent=packed+'/'+total;
  document.getElementById('s-fragile').textContent=fragile;
  document.getElementById('s-liquids').textContent=liquids;
  document.getElementById('s-heavy').textContent=heavy;
  document.getElementById('s-items').textContent=totalItems;

  const rb=document.getElementById('room-stat-body');
  const rooms=DB.locations.filter(l=>l.containers.length);
  if(!rooms.length){rb.innerHTML='<div style="font-size:11px;color:var(--text-muted)">No boxes yet</div>';return;}
  rb.innerHTML=rooms.map(l=>{
    const cnt=l.containers.length;
    const pct=total?Math.round(cnt/total*100):0;
    return`<div class="room-row">
      <div class="room-row-name">${l.emoji} ${esc(l.name)}</div>
      <div class="rb-track"><div class="rb-fill" style="width:${pct}%"></div></div>
      <div class="room-ct">${cnt}</div>
    </div>`;
  }).join('');
}

// ══════════════════════════════════════════════════
// ORGANIZE
// ══════════════════════════════════════════════════
function renderOrganize(){
  renderSortHelper(); renderCatOverview(); renderFlagsSection(); renderOrgDragView(); renderRoomManager();
}

function renderSortHelper(){
  const unsorted=[];
  DB.locations.forEach(loc=>{loc.containers.forEach(cont=>{cont.items.forEach(item=>{if(!item.category&&!item._skipSort)unsorted.push({item,loc,cont});});});});
  const n=unsorted.length;
  document.getElementById('sort-progress').textContent=n+' unsorted item'+(n!==1?'s':'');
  const sc=document.getElementById('sort-content');
  if(!n){sc.innerHTML='<div style="text-align:center;color:var(--text-muted);font-size:13px;padding:10px 0"><div style="font-size:28px;margin-bottom:6px">✨</div>All items categorized!</div>';return;}
  const{item,loc,cont}=unsorted[0];
  const cats=[
    {e:'💼',n:'Work'},{e:'🏠',n:'Home'},{e:'👗',n:'Clothing'},{e:'👟',n:'Shoes'},
    {e:'🧴',n:'Toiletries'},{e:'📚',n:'Books'},{e:'🔧',n:'Tools'},{e:'🎨',n:'Hobbies'},
    {e:'❄️',n:'Seasonal'},{e:'💻',n:'Electronics'},{e:'🍳',n:'Kitchen'},{e:'🌱',n:'Personal'},
  ];
  sc.innerHTML=`
    <div style="font-size:11px;color:var(--text-muted);text-align:center;margin-bottom:4px">What category does this item belong in?</div>
    <div class="sort-item-name">${esc(item.name)}</div>
    <div class="sort-item-from">from ${loc.emoji} ${esc(loc.name)} › ${cont.name}</div>
    <div class="sort-cats">
      ${cats.map(c=>`<div class="scat" onclick="assignCat('${item.id}','${loc.id}','${cont.id}','${c.e} ${c.n}',this)">
        <div class="scat-em">${c.e}</div><div class="scat-lbl">${c.n}</div>
      </div>`).join('')}
    </div>
    <div class="sort-actions">
      <button class="btn-g" style="flex:1" onclick="skipSort('${item.id}','${loc.id}','${cont.id}')">Skip</button>
      <button class="btn-p" style="flex:1" id="assign-btn" disabled onclick="confirmAssign()">Assign Category</button>
    </div>`;
}

let pendingCat=null;
function assignCat(itemId,locId,contId,cat,el){
  document.querySelectorAll('.scat.sel').forEach(s=>s.classList.remove('sel'));
  el.classList.add('sel');
  pendingCat={itemId,locId,contId,cat};
  const btn=document.getElementById('assign-btn');
  if(btn){btn.disabled=false;btn.textContent='Assign: '+cat;}
}
function confirmAssign(){
  if(!pendingCat)return;
  const{itemId,locId,contId,cat}=pendingCat;
  const cont=findCont(locId,contId);
  const item=cont?.items.find(i=>i.id===itemId);
  if(item)item.category=cat;
  pendingCat=null;persist();renderOrganize();showToast('✅ Category assigned!');
}
function skipSort(itemId,locId,contId){
  const cont=findCont(locId,contId);
  const item=cont?.items.find(i=>i.id===itemId);
  if(item)item._skipSort=true;renderSortHelper();
}

function renderCatOverview(){
  const catMap={};
  DB.locations.forEach(loc=>{loc.containers.forEach(cont=>{cont.items.forEach(item=>{
    const cat=item.category||'⬜ Uncategorized';
    if(!catMap[cat])catMap[cat]=[];
    catMap[cat].push({item,loc,cont});
  });});});
  const el=document.getElementById('cat-overview');
  const sorted=Object.entries(catMap).sort((a,b)=>b[1].length-a[1].length);
  if(!sorted.length){el.innerHTML='<div style="color:var(--text-muted);font-size:12px;padding:8px 0">Add items to see the category overview.</div>';return;}
  el.innerHTML=sorted.map(([cat,entries])=>{
    const parts=cat.split(' ');const em=parts[0];const name=parts.slice(1).join(' ');
    return`<div class="cat-section">
      <div class="cat-sec-hd" onclick="this.closest('.cat-section').classList.toggle('open')">
        <div class="cat-sec-em">${em}</div>
        <div class="cat-sec-name">${name||cat}</div>
        <div class="cat-sec-count">${entries.length} item${entries.length!==1?'s':''}</div>
        <div class="cat-sec-ar">▼</div>
      </div>
      <div class="cat-sec-body">
        ${entries.map(({item,loc,cont})=>`<div class="cat-item-row">
          <div class="cat-item-loc">${loc.emoji} ${esc(loc.name)} › ${esc(cont.name)}</div>
          <div class="cat-item-name">${esc(item.name)}${item.quantity>1?` ×${item.quantity}`:''}</div>
        </div>`).join('')}
      </div>
    </div>`;
  }).join('');
}

let activeFlagFilter='';
function setFlagFilter(f,btn){
  activeFlagFilter=f;
  document.querySelectorAll('#flags-card .fchk').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on');renderFlagsSection();
}
function renderFlagsSection(){
  const all=[];
  DB.locations.forEach(loc=>{loc.containers.forEach(cont=>{cont.items.forEach(item=>{
    if(item.flags&&item.flags.length){
      if(!activeFlagFilter||item.flags.includes(activeFlagFilter)) all.push({item,loc,cont});
    }
  });});});
  const el=document.getElementById('flags-list');
  if(!all.length){el.innerHTML=`<div style="color:var(--text-muted);font-size:12px;padding:10px 0;text-align:center">No flagged items${activeFlagFilter?' with this filter':''}.</div>`;return;}
  const FL={donate:'🎁 Donate',duplicate:'♊ Duplicate',move:'📍 Move',seasonal:'❄️ Seasonal',fragile:'⚠️ Fragile'};
  el.innerHTML=all.map(({item,loc,cont})=>`
    <div class="flag-row">
      <div class="flag-item-name">${esc(item.name)}</div>
      <div class="flag-item-loc">${loc.emoji} ${esc(loc.name)} › ${esc(cont.name)}</div>
      <div style="display:flex;gap:3px;flex-wrap:wrap">${item.flags.map(f=>`<span class="item-flag flag-${f}">${FL[f]||f}</span>`).join('')}</div>
    </div>`).join('');
}

function renderOrgDragView(){
  const el=document.getElementById('org-drag-view');
  const allConts=DB.locations.flatMap(l=>l.containers.map(c=>({...c,loc:l})));
  if(!allConts.length){el.innerHTML='<div style="color:var(--text-muted);font-size:12px;padding:8px 0">Add boxes to use the drag reorganizer.</div>';return;}
  el.innerHTML='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px">'+
    allConts.map(cont=>`
      <div style="background:var(--surface2);border:1.5px solid var(--border);border-radius:10px;overflow:hidden;transition:border-color .2s"
        ondragover="event.preventDefault();this.style.borderColor='var(--accent-gold)'"
        ondragleave="this.style.borderColor='var(--border)'"
        ondrop="dropItem(event,'${cont.loc.id}','${cont.id}');this.style.borderColor='var(--border)'">
        <div style="padding:7px 10px;border-bottom:1px solid var(--border);background:var(--card);font-size:11px;font-weight:700;display:flex;align-items:center;gap:6px;font-family:'Syne',sans-serif">
          <span>📦</span>
          <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(cont.name)}</span>
          <span style="color:var(--text-muted)">${cont.items.length}</span>
        </div>
        <div style="padding:5px;min-height:36px">
          ${cont.items.map(item=>`<div class="item-row" style="margin-bottom:3px"
            draggable="true"
            ondragstart="dragStart(event,'${cont.loc.id}','${cont.id}','${item.id}')"
            ondragend="this.classList.remove('dragging')">
            <div class="item-drag">⠿</div>
            <div class="item-info"><div class="item-name" style="font-size:10px">${esc(item.name)}</div></div>
          </div>`).join('')}
          ${!cont.items.length?'<div style="font-size:10px;color:var(--text-muted);text-align:center;padding:5px">Drop here</div>':''}
        </div>
      </div>`).join('')+
  '</div>';
}

function renderRoomManager(){
  const el=document.getElementById('room-manager');if(!el)return;
  const rooms=DB.locations.filter(l=>l.id!=='_unassigned');
  if(!rooms.length){
    el.innerHTML=`<div style="color:var(--text-muted);font-size:12px;padding:8px 0">No rooms yet. <button onclick="openAddRoom()" style="background:none;border:none;color:var(--accent);cursor:pointer;font-weight:700;font-size:12px">+ Add Room</button></div>`;
    return;
  }
  el.innerHTML=`<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px;margin-bottom:10px">
    ${rooms.map(l=>`<div style="background:var(--surface);border:1.5px solid var(--border);border-radius:10px;padding:12px 14px;display:flex;align-items:center;gap:10px;transition:background var(--transition-dur),border-color var(--transition-dur)">
      <span style="font-size:22px">${l.emoji}</span>
      <div style="flex:1;min-width:0">
        <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(l.name)}</div>
        <div style="font-size:10px;color:var(--text-muted)">${l.containers.length} box${l.containers.length!==1?'es':''}</div>
      </div>
      <button onclick="openEditRoom('${l.id}')" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:13px;padding:3px">✏️</button>
      <button onclick="delRoom('${l.id}')" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:13px;padding:3px">🗑️</button>
    </div>`).join('')}
  </div>
  <button onclick="openAddRoom()" class="add-room-btn" style="grid-column:unset;width:auto;padding:10px 20px">+ Add Room</button>`;
}

// ══════════════════════════════════════════════════
// IMPORT / EXPORT
// ══════════════════════════════════════════════════
function exportData(){
  const blob=new Blob([JSON.stringify({_meta:{source:'Box Tracker',exportedAt:new Date().toISOString()},locations:DB.locations},null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);
  a.download=`box-tracker-backup-${todayStr()}.json`;a.click();
  showToast('✅ Exported!');
}
async function importData(input,mode){
  const file=input.files[0];if(!file)return;
  const r=new FileReader();
  r.onload=async e=>{
    try{
      const parsed=JSON.parse(e.target.result);
      const incoming=parsed.locations||[];
      if(!Array.isArray(incoming))throw new Error('bad format');
      if(mode==='replace'){
        if(!(await HQConfirm.ask(`Replace all ${DB.locations.length} rooms with ${incoming.length} from file?`, {danger:true})))return;
        DB.locations=incoming;
      } else {
        const existIds=new Set(DB.locations.map(l=>l.id));
        incoming.filter(l=>!existIds.has(l.id)).forEach(l=>DB.locations.push(l));
      }
      migrateDB();persist();populateRoomDropdowns();renderInventory();
      closeModal('ie-modal');showToast('✅ Import complete!');
    }catch{HQToast.error('❌ Invalid file format.');}
  };
  r.readAsText(file);input.value='';
}

// ══════════════════════════════════════════════════
// UTILS
// ══════════════════════════════════════════════════
const esc = s => HQUtils.esc(s); // → HQUtils.esc
const todayStr = () => (window.HQDate ? HQDate.today() : new Date().toISOString().split('T')[0]); // aliased → HQDate.today

// ── FLAG-TO-INDEX: push action-flagged items to index hero ─────────────────
/**
 * Scans all items across all boxes for action flags (donate, move, duplicate).
 * Pushes a summary hqFlag to the index page if any exist.
 * Clears the flag if none remain.
 */
function btHqFlagCheck() {
  if (typeof hqFlag !== 'function') return;
  const actionFlags = ['donate', 'move', 'duplicate'];
  let flaggedItems = [];
  DB.locations.forEach(loc => {
    loc.containers.forEach(cont => {
      cont.items.forEach(item => {
        const hasAction = (item.flags || []).some(f => actionFlags.includes(f));
        if (hasAction) {
          const labels = { donate: '🎁', move: '📍', duplicate: '♊' };
          const tags = (item.flags || []).filter(f => actionFlags.includes(f)).map(f => labels[f] || f).join(' ');
          flaggedItems.push(tags + ' ' + item.name + ' (' + (loc.name || 'Box') + ')');
        }
      });
    });
  });

  if (flaggedItems.length) {
    hqFlag({
      id: 'bt-action-items',
      source: 'box-tracker',
      type: 'reminder',
      text: '📦 ' + flaggedItems.length + ' box item' + (flaggedItems.length > 1 ? 's' : '') + ' need action: ' + flaggedItems.slice(0, 2).join(', ') + (flaggedItems.length > 2 ? ' +' + (flaggedItems.length - 2) + ' more' : ''),
      href: 'box-tracker.html',
      ts: Date.now()
    });
  } else {
    if (typeof hqUnflag === 'function') hqUnflag('bt-action-items');
  }
}

// ══════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════
hqInitTheme();
load();
migrateDB();
bindEmojiPicker('room-emojis');
populateRoomDropdowns();
renderInventory();
// Push any action-flagged items to index on load
setTimeout(btHqFlagCheck, 400);

// ── GLOBAL EXPORTS (inline onclick handlers need window scope) ──────────────
window.sw = sw;
