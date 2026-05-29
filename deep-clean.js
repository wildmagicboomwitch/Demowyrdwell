// ⚠️  DEAD-01: This is the JSX source for deep-clean.compiled.js.
// This file is NOT loaded by any HTML page — deep-clean.html loads deep-clean.compiled.js.
// Do not reference this file in script tags. Move to a src/ directory outside the web root.
// The SW registration at the bottom of this file is unreachable dead code.
//
const {useState,useRef,useEffect,useCallback}=React;
const LS=HQKeys.DEEPCLEAN;
const LS_STATS=HQKeys.DEEPCLEAN_STATS;

// ── Tooltip wrapper ──────────────────────────────────────────────────────────
function Tip({label,children}){
  return(
    <span className="tt-wrap">
      {children}
      <span className="tt">{label}</span>
    </span>
  );
}

const RT={
  kitchen: {bg:'#EDF7EE',ac:'#4A8C58',hc:'#1D4100',bd:'#B8D8B8',name:'Kitchenette',ico:'🍳'},
  dining:  {bg:'#EAF6ED',ac:'#3E8060',hc:'#1A4A20',bd:'#A8D4B8',name:'Dining Nook',ico:'🌿'},
  living:  {bg:'#EAF6F4',ac:'#3A8878',hc:'#164840',bd:'#A4D4CC',name:'Living Room',ico:'🛋️'},
  hallway: {bg:'#EBF5EF',ac:'#508860',hc:'#1A4428',bd:'#B0D4BC',name:'Hallway',ico:'🚪'},
  bedroom: {bg:'#F0EBFF',ac:'#6A58BC',hc:'#302080',bd:'#C0B0EC',name:'Bedroom',ico:'🛏️'},
  bathroom:{bg:'#E8EFF9',ac:'#4870B4',hc:'#163070',bd:'#A4BCDC',name:'Bathroom',ico:'🚿'},
  closets: {bg:'#F8EDEA',ac:'#9A6050',hc:'#602018',bd:'#DCC0B8',name:'Closets ×2',ico:'👗'},
  fridge:  {bg:'#E8F8F8',ac:'#388080',hc:'#104848',bd:'#A0D0D0',name:'Fridge',ico:'🧊'},
  final:   {bg:'#FEFBDE',ac:'#9A8000',hc:'#604800',bd:'#E4D870',name:'Final Tasks',ico:'🏆'},
};
const PH={
  gather:  {l:'Gather & Remove',       i:'🗑️',c:'#A04040'},
  tidy:    {l:'Clear & Tidy',          i:'📦',c:'#6050A0'},
  surfaces:{l:'Wipe & Scrub Surfaces', i:'✨',c:'#387858'},
  dishes:  {l:'Sort & Wash Dishes',    i:'🍽️',c:'#5A7840'},
  special: {l:'Special Tasks',         i:'⭐',c:'#C07030'},
  floors:  {l:'Floors',                i:'🧹',c:'#785030'},
  bedroom: {l:'Bedroom',               i:'🛏️',c:'#6A58BC'},
  organize:{l:'Organize & Put Away',   i:'🗂️',c:'#585098'},
  final:   {l:'Final Tasks',           i:'🏆',c:'#907000'},
};
const PH_ORDER=['gather','tidy','surfaces','dishes','special','floors','bedroom','organize','final'];
const DI={
  cake: {i:'🍰',l:'Easy',         c:'#387858',bg:'#E8F5EE'},
  usual:{i:'🧹',l:'Usual',        c:'#5A7840',bg:'#EFF5E8'},
  rough:{i:'🫠',l:'Rough',        c:'#9A5828',bg:'#FFF0E4'},
  wall: {i:'🧱',l:'Wall of Awful',c:'#A83828',bg:'#FFE8E8'},
};
const PI=[null,
  {l:'P1',c:'#B02828',bg:'#FFE8E8'},{l:'P2',c:'#B05818',bg:'#FFF0E0'},
  {l:'P3',c:'#787818',bg:'#FAFAE8'},{l:'P4',c:'#387840',bg:'#E8F5E8'},
  {l:'P5',c:'#808088',bg:'#F4F4F8'},
];
const EMOJIS=['🌟','💫','⚠️','🔥','❄️','💜','🌿','🍄','🌸','✨','🐱','🌙','🦋','🌺','🍃','⭐','🎯','💎','🧹','🌈','📌','💤','🎵','🔑','🏷️'];
const mk=(id,t,ph,o={})=>({id,t,phase:ph,done:false,priority:3,difficulty:'usual',emojis:[],custom:false,skipped:false,...o});
const TIMER_OPTS=[5,10,15,30,45,60];

const INIT_TASKS={
  k1:mk('k1','Remove trash & recycling','gather',{priority:1,difficulty:'cake'}),
  k2:mk('k2','Move dishes & cups to sink','gather',{priority:1,difficulty:'cake'}),
  k3:mk('k3','Return items to their rooms','gather',{priority:1,difficulty:'cake'}),
  k4:mk('k4','Clear countertops','tidy',{priority:2,difficulty:'usual'}),
  k5:mk('k5','Clear floor','tidy',{priority:2,difficulty:'cake'}),
  k6:mk('k6','Wipe countertops & backsplash','surfaces',{priority:2,difficulty:'usual'}),
  k7:mk('k7','Wipe cabinet faces & drawer fronts','surfaces',{priority:3,difficulty:'usual'}),
  k8:mk('k8','Wipe appliance outsides','surfaces',{priority:3,difficulty:'usual'}),
  k9:mk('k9','Wipe fridge exterior & top','surfaces',{priority:3,difficulty:'cake'}),
  k10:mk('k10','Sort dishes by size & type','dishes',{priority:2,difficulty:'cake'}),
  k11:mk('k11','🍽️ Dish Session 1 — 15 min','dishes',{priority:2,difficulty:'usual',tmr:true}),
  k12:mk('k12','🍽️ Dish Session 2 — 15 min','dishes',{priority:2,difficulty:'usual',tmr:true}),
  k13:mk('k13','🍽️ Dish Session 3 — 15 min','dishes',{priority:2,difficulty:'usual',tmr:true}),
  k14:mk('k14','🍽️ Dish Session 4 — 15 min','dishes',{priority:3,difficulty:'usual',tmr:true}),
  k15:mk('k15','🍽️ Dish Session 5 — 15 min','dishes',{priority:3,difficulty:'usual',tmr:true}),
  k16:mk('k16','🍽️ Dish Session 6 — 15 min','dishes',{priority:3,difficulty:'usual',tmr:true}),
  k17:mk('k17','Scrub kitchen sink & faucet','special',{priority:2,difficulty:'usual'}),
  k18:mk('k18','Sweep floor','floors',{priority:2,difficulty:'cake'}),
  k19:mk('k19','Mop floor','floors',{priority:2,difficulty:'usual'}),
  k20:mk('k20','Final tidy & organize kitchen','organize',{priority:4,difficulty:'usual'}),
  d1:mk('d1','Remove trash & recycling','gather',{priority:1,difficulty:'cake'}),
  d2:mk('d2','Move dishes to kitchen','gather',{priority:1,difficulty:'cake'}),
  d3:mk('d3','Return items to their rooms','gather',{priority:1,difficulty:'cake'}),
  d4:mk('d4','Clear table & all surfaces','tidy',{priority:2,difficulty:'usual'}),
  d5:mk('d5','Clear floor','tidy',{priority:2,difficulty:'cake'}),
  d6:mk('d6','Wipe table top & edges','surfaces',{priority:2,difficulty:'cake'}),
  d7:mk('d7','Wipe chair backs, legs & undersides','surfaces',{priority:3,difficulty:'usual'}),
  d8:mk('d8','🐱 Scoop & refresh cat box','special',{priority:1,difficulty:'usual',hl:true}),
  d9:mk('d9','🐱 Wipe cat box exterior & area','special',{priority:2,difficulty:'cake'}),
  d10:mk('d10','Sweep','floors',{priority:2,difficulty:'cake'}),
  d11:mk('d11','Vacuum nook area rug','floors',{priority:3,difficulty:'cake'}),
  d12:mk('d12','Mop','floors',{priority:2,difficulty:'usual'}),
  d13:mk('d13','Tidy & organize nook','organize',{priority:4,difficulty:'cake'}),
  l1:mk('l1','Remove trash & recycling','gather',{priority:1,difficulty:'cake'}),
  l2:mk('l2','Return dishes to kitchen','gather',{priority:1,difficulty:'cake'}),
  l3:mk('l3','Return items to their rooms','gather',{priority:1,difficulty:'cake'}),
  l4:mk('l4','Clear all surfaces & tables','tidy',{priority:2,difficulty:'usual'}),
  l5:mk('l5','Clear floor completely','tidy',{priority:2,difficulty:'usual'}),
  l6:mk('l6','Wipe shelves, TV stand & remotes','surfaces',{priority:3,difficulty:'cake'}),
  l7:mk('l7','Wipe windowsills & ledges','surfaces',{priority:3,difficulty:'cake'}),
  l8:mk('l8','Vacuum area rug','floors',{priority:2,difficulty:'usual'}),
  l9:mk('l9','Organize & declutter','organize',{priority:2,difficulty:'rough'}),
  h1:mk('h1','Remove trash & stray items','gather',{priority:1,difficulty:'cake'}),
  h2:mk('h2','Clear floor & put away','tidy',{priority:1,difficulty:'usual'}),
  h3:mk('h3','Wipe light switches & door handles','surfaces',{priority:3,difficulty:'cake'}),
  h4:mk('h4','Wipe walls & scuffs','surfaces',{priority:3,difficulty:'usual'}),
  h5:mk('h5','Wipe baseboards','surfaces',{priority:4,difficulty:'rough'}),
  h6:mk('h6','Sweep','floors',{priority:2,difficulty:'cake'}),
  h7:mk('h7','Mop','floors',{priority:2,difficulty:'usual'}),
  c1:mk('c1','Gather ALL laundry brought here','gather',{priority:1,difficulty:'cake'}),
  c2:mk('c2','Clear & tidy shelves and floor','tidy',{priority:2,difficulty:'usual'}),
  c3:mk('c3','Wipe shelves & surfaces','surfaces',{priority:3,difficulty:'cake'}),
  c4:mk('c4','Bag dirty laundry','bedroom',{priority:1,difficulty:'cake'}),
  c5:mk('c5','Put away clean laundry — Closet 1','bedroom',{priority:1,difficulty:'rough',hl:true}),
  c6:mk('c6','Put away clean laundry — Closet 2','bedroom',{priority:1,difficulty:'rough'}),
  c7:mk('c7','Sweep both closet floors','floors',{priority:3,difficulty:'cake'}),
  c8:mk('c8','Mop both closet floors','floors',{priority:4,difficulty:'cake'}),
  c9:mk('c9','Declutter — pull out donate/toss','organize',{priority:3,difficulty:'wall'}),
  c10:mk('c10','Organize shelves, bins & hanging','organize',{priority:3,difficulty:'usual'}),
  br1:mk('br1','Remove trash & recycling','gather',{priority:1,difficulty:'cake'}),
  br2:mk('br2','Return dishes to kitchen','gather',{priority:1,difficulty:'cake'}),
  br3:mk('br3','Return items to their rooms','gather',{priority:1,difficulty:'cake'}),
  br4:mk('br4','Clear floor & put away','tidy',{priority:2,difficulty:'usual'}),
  br5:mk('br5','Clear & tidy nightstand(s)','tidy',{priority:3,difficulty:'cake'}),
  br6:mk('br6','Clear desk surface','tidy',{priority:3,difficulty:'usual'}),
  br7:mk('br7','Wipe dresser top','surfaces',{priority:3,difficulty:'cake'}),
  br8:mk('br8','Wipe nightstand & all surfaces','surfaces',{priority:3,difficulty:'cake'}),
  br9:mk('br9','Wipe walls/baseboards if needed','surfaces',{priority:4,difficulty:'rough'}),
  br10:mk('br10','Change bedding','bedroom',{priority:1,difficulty:'usual',hl:true}),
  br11:mk('br11','Bag dirty laundry','bedroom',{priority:1,difficulty:'cake'}),
  br12:mk('br12','Put away clean laundry','bedroom',{priority:2,difficulty:'rough'}),
  br13:mk('br13','Vacuum floor & area rug','floors',{priority:2,difficulty:'usual'}),
  br14:mk('br14','Organize & declutter bedroom','organize',{priority:3,difficulty:'rough'}),
  ba1:mk('ba1','Remove trash & recycling','gather',{priority:1,difficulty:'cake'}),
  ba2:mk('ba2','Gather all laundry','gather',{priority:1,difficulty:'cake'}),
  ba3:mk('ba3','Clear counter & put away','tidy',{priority:1,difficulty:'usual'}),
  ba4:mk('ba4','Clear floor completely','tidy',{priority:1,difficulty:'cake'}),
  ba5:mk('ba5','Wipe walls & tiles above sink/shower','surfaces',{priority:3,difficulty:'rough'}),
  ba6:mk('ba6','🪞 Wipe mirror & vanity light','surfaces',{priority:2,difficulty:'cake'}),
  ba7:mk('ba7','Wipe shelves & remaining surfaces','surfaces',{priority:3,difficulty:'cake'}),
  ba8:mk('ba8','🚿 Scrub shower / tub','special',{priority:2,difficulty:'rough',hl:true}),
  ba9:mk('ba9','🚽 Wipe toilet exterior & base','special',{priority:1,difficulty:'usual'}),
  ba10:mk('ba10','🚽 Scrub toilet bowl inside','special',{priority:1,difficulty:'usual'}),
  ba11:mk('ba11','🪥 Scrub bathroom sink & faucet','special',{priority:2,difficulty:'usual'}),
  ba12:mk('ba12','Sweep','floors',{priority:2,difficulty:'cake'}),
  ba13:mk('ba13','Mop','floors',{priority:2,difficulty:'usual'}),
  fr1:mk('fr1','Clear out old food & nonsense','special',{priority:1,difficulty:'usual',hl:true}),
  fr2:mk('fr2','Wipe each shelf','special',{priority:2,difficulty:'rough'}),
  fr3:mk('fr3','Wipe inside walls','special',{priority:2,difficulty:'rough'}),
  fr4:mk('fr4','Reorganize contents','special',{priority:3,difficulty:'usual'}),
  f1:mk('f1','🗑️ Take ALL trash bags downstairs','final',{priority:1,difficulty:'usual',hl:true}),
  f2:mk('f2','♻️ Take recycling downstairs','final',{priority:1,difficulty:'cake',hl:true}),
  f3:mk('f3','Final declutter pass — all rooms','final',{priority:3,difficulty:'rough'}),
  f4:mk('f4','✨ Victory walkthrough!','final',{priority:1,difficulty:'cake',hl:true}),
};
const INIT_ROOMS={
  kitchen: {id:'kitchen', taskIds:['k1','k2','k3','k4','k5','k6','k7','k8','k9','k10','k11','k12','k13','k14','k15','k16','k17','k18','k19','k20']},
  dining:  {id:'dining',  taskIds:['d1','d2','d3','d4','d5','d6','d7','d8','d9','d10','d11','d12','d13']},
  living:  {id:'living',  taskIds:['l1','l2','l3','l4','l5','l6','l7','l8','l9']},
  hallway: {id:'hallway', taskIds:['h1','h2','h3','h4','h5','h6','h7']},
  closets: {id:'closets', taskIds:['c1','c2','c3','c4','c5','c6','c7','c8','c9','c10']},
  bedroom: {id:'bedroom', taskIds:['br1','br2','br3','br4','br5','br6','br7','br8','br9','br10','br11','br12','br13','br14']},
  bathroom:{id:'bathroom',taskIds:['ba1','ba2','ba3','ba4','ba5','ba6','ba7','ba8','ba9','ba10','ba11','ba12','ba13']},
  fridge:  {id:'fridge',  taskIds:['fr1','fr2','fr3','fr4']},
  final:   {id:'final',   taskIds:['f1','f2','f3','f4']},
};
const INIT_COLS=[['kitchen','dining','fridge'],['living','hallway','closets'],['bedroom','bathroom','final']];

/* ── Tier 4: ROOMS_CONFIG bridge + CUSTOM_ROOM_TASKS store ──────
   Reads customize.html's room config (enabled/order) and per-room
   custom task pools, merging them into the INIT state so that
   users' room setup is respected on every new clean session.
──────────────────────────────────────────────────────────────── */
function _loadCustomRoomTasks(){
  try{ return HQSafe.store.get(HQKeys.CUSTOM_ROOM_TASKS,{})||{}; }catch(e){ return {}; }
}

/**
 * Builds an effective rooms map and col layout by merging ROOMS_CONFIG
 * (enabled/disabled, order) from customize.js over INIT_ROOMS defaults.
 * Custom rooms not in INIT_ROOMS get taskIds from CUSTOM_ROOM_TASKS.
 * Returns { rooms, cols }.
 */
function _buildRoomsFromConfig(){
  var cfg;
  try{ cfg = HQSafe.store.get(HQKeys.ROOMS_CONFIG, null); }catch(e){ cfg = null; }
  if(!cfg || !Array.isArray(cfg.rooms) || !cfg.rooms.length){
    return { rooms: INIT_ROOMS, cols: INIT_COLS };
  }

  var customTasks = _loadCustomRoomTasks();
  var rooms = {};
  var enabledIds = [];

  cfg.rooms.forEach(function(r){
    if(!r.enabled) return; // honour disabled toggle from customize
    var rid = r.id;
    if(INIT_ROOMS[rid]){
      // Built-in room: use its existing taskIds, no overwrite needed
      rooms[rid] = Object.assign({}, INIT_ROOMS[rid]);
    } else {
      // Custom room: pull from CUSTOM_ROOM_TASKS or start empty
      var taskArr = Array.isArray(customTasks[rid]) ? customTasks[rid] : [];
      // Convert task objects to task map entries and register them
      var taskIds = taskArr.map(function(t){ return t.id; });
      taskArr.forEach(function(t){ /* tasks will be registered below */ });
      rooms[rid] = { id: rid, taskIds: taskIds, _custom: true, _label: r.name, _emoji: r.emoji };
    }
    enabledIds.push(rid);
  });

  // Register any custom tasks into a temp extended task map (shallow merge with INIT_TASKS)
  // We return rooms/cols here; tasks are handled in App() via _mergeCustomTasks()
  var CHUNK = 3;
  var cols = [];
  for(var i=0; i<enabledIds.length; i+=CHUNK){
    cols.push(enabledIds.slice(i,i+CHUNK));
  }
  if(!cols.length) cols = INIT_COLS;
  return { rooms: rooms, cols: cols };
}

/**
 * Builds an extended task map by merging INIT_TASKS with tasks from
 * CUSTOM_ROOM_TASKS. Custom tasks follow the same mk() schema.
 */
function _mergeCustomTasks(baseTaskMap){
  var customTasks = _loadCustomRoomTasks();
  var merged = Object.assign({}, baseTaskMap);
  Object.values(customTasks).forEach(function(taskArr){
    if(!Array.isArray(taskArr)) return;
    taskArr.forEach(function(t){
      if(!t || !t.id) return;
      merged[t.id] = t;
    });
  });
  return merged;
}

const OOO_WAVES=[
  {id:'w1',step:1,icon:'🗑️',label:'Gather & Remove',color:'#A04040',bg:'#FFF8F6',bd:'#F0C8C0',
   desc:'Every room — trash/recycling out, dishes to kitchen, stray items returned.',
   groups:[{rid:'kitchen',tids:['k1','k2','k3']},{rid:'dining',tids:['d1','d2','d3']},{rid:'living',tids:['l1','l2','l3']},{rid:'hallway',tids:['h1']},{rid:'bedroom',tids:['br1','br2','br3']},{rid:'bathroom',tids:['ba1','ba2']},{rid:'closets',tids:['c1']}]},
  {id:'w2',step:2,icon:'📦',label:'Clear & Tidy All Surfaces',color:'#6050A0',bg:'#F8F6FF',bd:'#C8C0E8',
   desc:'Countertops, tables, desks, nightstands, dressers, shelves — clear and put away.',
   groups:[{rid:'kitchen',tids:['k4','k5']},{rid:'dining',tids:['d4','d5']},{rid:'living',tids:['l4','l5']},{rid:'hallway',tids:['h2']},{rid:'bedroom',tids:['br4','br5','br6']},{rid:'bathroom',tids:['ba3','ba4']},{rid:'closets',tids:['c2']}]},
  {id:'w3',step:3,icon:'✨',label:'Wipe & Scrub All Surfaces',color:'#387858',bg:'#EEF8F2',bd:'#A8D8B8',
   desc:'All surfaces from step 2 plus cabinets, appliances, fridge exterior.',
   groups:[{rid:'kitchen',tids:['k6','k7','k8','k9']},{rid:'dining',tids:['d6','d7']},{rid:'living',tids:['l6','l7']},{rid:'hallway',tids:['h3','h4','h5']},{rid:'bedroom',tids:['br7','br8','br9']},{rid:'bathroom',tids:['ba5','ba6','ba7']},{rid:'closets',tids:['c3']}]},
  {id:'w4',step:4,icon:'🍽️',label:'Sort & Wash Dishes',color:'#5A7840',bg:'#EFF5E8',bd:'#B0D090',
   desc:'Sort by size & type, then 15-min sessions with real breaks.',
   groups:[{rid:'kitchen',tids:['k10','k11','k12','k13','k14','k15','k16']}]},
  {id:'w5',step:5,icon:'🐱',label:'Cat Box',color:'#387858',bg:'#EEF8F2',bd:'#A8D8B8',
   desc:'Scoop & refresh, wipe exterior & area.',
   groups:[{rid:'dining',tids:['d8','d9']}]},
  {id:'w6',step:6,icon:'🚰',label:'Kitchen Sink',color:'#4A7840',bg:'#EEF5EE',bd:'#A8C8A8',
   desc:'Scrub sink & faucet — after all dishes are done.',
   groups:[{rid:'kitchen',tids:['k17']}]},
  {id:'w7',step:7,icon:'🧹',label:'Floors — Sweep → Vacuum → Mop',color:'#785030',bg:'#FAF4EC',bd:'#D0B898',
   desc:'Sweep all → vacuum all rugs → mop all hard floors. In that order.',
   groups:[{rid:'kitchen',tids:['k18','k19']},{rid:'dining',tids:['d10','d11','d12']},{rid:'living',tids:['l8']},{rid:'hallway',tids:['h6','h7']},{rid:'bedroom',tids:['br13']},{rid:'bathroom',tids:['ba12','ba13']},{rid:'closets',tids:['c7','c8']}]},
  {id:'w8',step:8,icon:'🚿',label:'Bathroom Deep Clean',color:'#3060A0',bg:'#EEF2FA',bd:'#A0B8DC',
   desc:'Shower/tub → toilet exterior & bowl → sink & faucet.',
   groups:[{rid:'bathroom',tids:['ba8','ba9','ba10','ba11']}]},
  {id:'w9',step:9,icon:'🛏️',label:'Bedroom',color:'#6A58BC',bg:'#F2EEFF',bd:'#C0B0EC',
   desc:'Change bedding, bag dirty laundry, put away clean laundry.',
   groups:[{rid:'bedroom',tids:['br10','br11','br12']},{rid:'closets',tids:['c4','c5','c6']}]},
  {id:'w10',step:10,icon:'🧊',label:'Fridge Deep Clean',color:'#388080',bg:'#E8F8F8',bd:'#A0D0D0',
   desc:'Clear old food → wipe shelves → wipe walls → reorganize.',
   groups:[{rid:'fridge',tids:['fr1','fr2','fr3','fr4']}]},
  {id:'w11',step:11,icon:'🗂️',label:'Organize, Tidy & Put Away',color:'#585098',bg:'#F4F2FA',bd:'#B8B0E0',
   desc:'Return misplaced items, fix organization, declutter as you go.',
   groups:[{rid:'kitchen',tids:['k20']},{rid:'living',tids:['l9']},{rid:'dining',tids:['d13']},{rid:'closets',tids:['c9','c10']},{rid:'bedroom',tids:['br14']}]},
  {id:'w12',step:12,icon:'🏆',label:'Final Tasks & Victory Lap',color:'#907000',bg:'#FEFBE8',bd:'#E0D060',
   desc:'Trash & recycling downstairs, final declutter pass, victory walkthrough.',
   groups:[{rid:'final',tids:['f1','f2','f3','f4']}]},
];
const CAT_PHASES=[
  {ph:'gather',  label:'Gather & Remove',           icon:'🗑️',color:'#A04040',bg:'#FFF8F6',bd:'#F0C8C0',desc:'Trash/recycling out, dishes to kitchen, stray items returned'},
  {ph:'tidy',    label:'Clear & Tidy Surfaces',     icon:'📦',color:'#6050A0',bg:'#F8F6FF',bd:'#C8C0E8',desc:'Clear counters, tables, desks, nightstands, dressers, shelves'},
  {ph:'surfaces',label:'Wipe & Scrub Surfaces',     icon:'✨',color:'#387858',bg:'#EEF8F2',bd:'#A8D8B8',desc:'Wipe everything + cabinets, appliances, fridge exterior'},
  {ph:'dishes',  label:'Sort & Wash Dishes',        icon:'🍽️',color:'#5A7840',bg:'#EFF5E8',bd:'#B0D090',desc:'Sort by type, then 15-min sessions with real breaks'},
  {ph:'special', label:'Special Tasks',             icon:'⭐',color:'#C07030',bg:'#FFF8EE',bd:'#E8C898',desc:'Cat box, kitchen sink, bathroom fixtures, fridge interior'},
  {ph:'floors',  label:'Floors',                    icon:'🧹',color:'#785030',bg:'#FAF4EC',bd:'#D0B898',desc:'Sweep all → vacuum rugs → mop all hard floors'},
  {ph:'bedroom', label:'Bedroom',                   icon:'🛏️',color:'#6A58BC',bg:'#F2EEFF',bd:'#C0B0EC',desc:'Bedding, laundry bagged, clean laundry put away'},
  {ph:'organize',label:'Organize, Tidy & Put Away', icon:'🗂️',color:'#585098',bg:'#F4F2FA',bd:'#B8B0E0',desc:'Return misplaced items, organize all rooms, declutter as you go'},
  {ph:'final',   label:'Final Tasks',               icon:'🏆',color:'#907000',bg:'#FEFBE8',bd:'#E0D060',desc:'Trash out, final pass, victory walkthrough'},
];
const HMSGS=[[0,0,'Ready to enchant your space? ✨'],[1,24,"You've started — the forest spirits approve 🌱"],[25,49,'Quarter done! Momentum blooming 🌸'],[50,50,'Halfway! You are absolutely radiant 🌟'],[51,74,'Over halfway — your cottage is transforming 🦋'],[75,99,'Almost there!! Nearly fully enchanted 🌙'],[100,100,'YOUR COTTAGE IS SPARKLING! You did it!! ✨🏡']];

function loadSaved(){return HQSafe.store.get(LS,null);}
function loadStats(){return HQSafe.store.get(LS_STATS,[]);}
function saveStats(s){try{HQSafe.store.set(LS_STATS, s);}catch(e){}}
function fmtSec(s){const m=Math.floor(s/60);const sc=s%60;return`${String(m).padStart(2,'0')}:${String(sc).padStart(2,'0')}`;}
function fmtHMS(s){const h=Math.floor(s/3600);const m=Math.floor((s%3600)/60);const sc=s%60;
  return h>0?`${h}h ${String(m).padStart(2,'0')}m`:`${m}m ${String(sc).padStart(2,'0')}s`;}

// ── Self-contained TimerPanel (no App re-render on tick) ─────────────────
function TimerPanel({isBreak,onToast}){
  const accent=isBreak?'#9A50B0':'#C07030';
  const [sec,setSec]=useState(isBreak?300:900);
  const [run,setRun]=useState(false);
  const [dur,setDur]=useState(isBreak?5:15);
  const ivRef=useRef(null);
  const circ=163.4;

  useEffect(()=>{
    if(run){
      ivRef.current=setInterval(()=>{
        setSec(s=>{
          if(s<=1){clearInterval(ivRef.current);setRun(false);
            onToast(isBreak?'🌈 Break over — back to it!':'💪 Timer done! Take a break!',isBreak?'#9A6050':'#4A8C58');
            return 0;}
          return s-1;
        });
      },1000);
    }else clearInterval(ivRef.current);
    return()=>clearInterval(ivRef.current);
  },[run]);

  function setTimer(min){setRun(false);setSec(min*60);setDur(min);}
  const ringPct=1-sec/(dur*60);

  return(
    <div style={{background:isBreak?'rgba(255,248,255,0.97)':'rgba(248,255,248,0.97)',border:`2px solid ${run?accent:'#C0D8A8'}`,borderRadius:15,padding:'9px 11px',boxShadow:run?`0 4px 20px ${accent}55`:'0 3px 12px rgba(45,70,20,0.1)',transition:'border-color 0.3s,box-shadow 0.3s',minWidth:126,textAlign:'center'}}>
      <div style={{fontSize:'0.55rem',fontWeight:900,color:isBreak?'transparent':'#6A7A5A',background:isBreak?'linear-gradient(90deg,#ff9ec4,#ffcc66,#a8ff88,#66ddff,#cc99ff)':'none',WebkitBackgroundClip:isBreak?'text':'unset',WebkitTextFillColor:isBreak?'transparent':'unset',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:3,backgroundSize:'200%',animation:isBreak?'sp 3s ease infinite':'none'}}>
        {isBreak?'🌈 BREAK TIME ✨':'💪 WORK MODE'}
      </div>
      <div style={{position:'relative',width:54,height:54,margin:'0 auto 5px'}}>
        <svg viewBox="0 0 60 60" width="54" height="54" style={{transform:'rotate(-90deg)'}}>
          <circle cx="30" cy="30" r="26" fill="none" stroke={isBreak?'#f8e8ff':'#EDF7EE'} strokeWidth="5"/>
          <circle cx="30" cy="30" r="26" fill="none" stroke={run?accent:accent+'88'} strokeWidth="5" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ*(1-ringPct)} style={{transition:'stroke-dashoffset 0.5s ease,stroke 0.3s'}}/>
        </svg>
        <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:sec===0?'0.62rem':'0.9rem',color:sec===0?accent:'#1D4100'}}>
          {sec===0?'Done!':fmtSec(sec)}
        </div>
      </div>
      <div style={{display:'flex',gap:2,justifyContent:'center',flexWrap:'wrap',marginBottom:4}}>
        {TIMER_OPTS.map(m=>(<Tip key={m} label={`Set ${isBreak?'break':'work'} timer to ${m} minutes`}><button onClick={()=>setTimer(m)} style={{fontSize:'0.52rem',fontWeight:800,padding:'1px 5px',borderRadius:8,border:`1.5px solid ${accent}`,background:dur===m?accent:'transparent',color:dur===m?'white':accent,transition:'all 0.1s'}}>{m}m</button></Tip>))}
      </div>
      <div style={{display:'flex',gap:3,justifyContent:'center'}}>
        <Tip label={run?'Pause timer':'Start timer'}>
          <button onClick={()=>setRun(r=>!r)} style={{background:run?(isBreak?'#9A5890':'#9A5828'):accent,color:'white',border:'none',borderRadius:7,padding:'3px 9px',fontWeight:800,fontSize:'0.65rem'}}>{run?'⏸ Pause':'▶ Start'}</button>
        </Tip>
        <Tip label="Reset to selected duration">
          <button onClick={()=>setTimer(dur)} style={{background:'#F4EFE0',color:'#5A7248',border:'1.5px solid #C0D8A8',borderRadius:7,padding:'3px 7px',fontWeight:800,fontSize:'0.65rem'}}>↺</button>
        </Tip>
      </div>
    </div>
  );
}

// ── Self-contained StopwatchPanel (no App re-render on tick) ─────────────
function StopwatchPanel({dataRef,onToast}){
  const [workSec,setWorkSec]=useState(0);
  const [breakSec,setBreakSec]=useState(0);
  const [mode,setMode]=useState('stopped'); // 'work'|'break'|'stopped'
  const [sessions,setSessions]=useState([]);
  const ivRef=useRef(null);

  useEffect(()=>{
    if(mode==='stopped'){clearInterval(ivRef.current);return;}
    ivRef.current=setInterval(()=>{
      if(mode==='work')setWorkSec(s=>{const n=s+1;dataRef.current.swWorkSec=n;return n;});
      else setBreakSec(s=>{const n=s+1;dataRef.current.swBreakSec=n;return n;});
    },1000);
    return()=>clearInterval(ivRef.current);
  },[mode]);

  function startWork(){
    if(mode==='break'){
      const prev=sessions.filter(x=>x.type==='break').reduce((a,s)=>a+s.dur,0);
      const seg={type:'break',dur:Math.max(0,breakSec-prev)};
      const next=[...sessions,seg];setSessions(next);dataRef.current.swSessions=next;
    }
    setMode('work');
  }
  function startBreak(){
    const prev=sessions.filter(x=>x.type==='work').reduce((a,s)=>a+s.dur,0);
    const seg={type:'work',dur:Math.max(0,workSec-prev)};
    const next=[...sessions,seg];setSessions(next);dataRef.current.swSessions=next;
    setMode('break');
  }
  function stop(){
    const prevW=sessions.filter(x=>x.type==='work').reduce((a,s)=>a+s.dur,0);
    const prevB=sessions.filter(x=>x.type==='break').reduce((a,s)=>a+s.dur,0);
    const extras=[
      ...(mode==='work'&&workSec>prevW?[{type:'work',dur:workSec-prevW}]:[]),
      ...(mode==='break'&&breakSec>prevB?[{type:'break',dur:breakSec-prevB}]:[]),
    ];
    const next=[...sessions,...extras];setSessions(next);dataRef.current.swSessions=next;
    setMode('stopped');
  }
  function reset(){
    setMode('stopped');setWorkSec(0);setBreakSec(0);setSessions([]);
    dataRef.current.swWorkSec=0;dataRef.current.swBreakSec=0;dataRef.current.swSessions=[];
  }

  return(
    <div style={{background:'rgba(248,248,255,0.97)',border:`2px solid ${mode!=='stopped'?'#8080C8':'#A0A8D8'}`,borderRadius:15,padding:'9px 11px',minWidth:160,textAlign:'center',boxShadow:mode!=='stopped'?'0 4px 20px #6060c055':'0 3px 12px rgba(45,70,20,0.1)',transition:'border-color 0.3s,box-shadow 0.3s'}}>
      <div style={{fontSize:'0.55rem',fontWeight:900,color:'#5858A0',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:3}}>⏱ STOPWATCH</div>
      <div style={{display:'flex',gap:8,justifyContent:'center',marginBottom:5}}>
        <div style={{textAlign:'center'}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:'1.05rem',color:'#C07030'}}>{fmtHMS(workSec)}</div>
          <div style={{fontSize:'0.52rem',fontWeight:800,color:'#C07030',textTransform:'uppercase'}}>Work</div>
        </div>
        <div style={{color:'#ccc',alignSelf:'center',fontSize:'0.8rem'}}>|</div>
        <div style={{textAlign:'center'}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:'1.05rem',color:'#9A50B0'}}>{fmtHMS(breakSec)}</div>
          <div style={{fontSize:'0.52rem',fontWeight:800,color:'#9A50B0',textTransform:'uppercase'}}>Break</div>
        </div>
      </div>
      <div style={{fontSize:'0.58rem',fontWeight:700,color:'#7878A0',marginBottom:5}}>Total: {fmtHMS(workSec+breakSec)}</div>
      <div style={{display:'flex',gap:3,justifyContent:'center',flexWrap:'wrap'}}>
        {mode!=='work'&&<Tip label="Log work time"><button onClick={startWork} style={{background:'#C07030',color:'white',border:'none',borderRadius:7,padding:'3px 8px',fontWeight:800,fontSize:'0.6rem'}}>▶ Work</button></Tip>}
        {mode==='work'&&<Tip label="Switch to break time"><button onClick={startBreak} style={{background:'#9A50B0',color:'white',border:'none',borderRadius:7,padding:'3px 8px',fontWeight:800,fontSize:'0.6rem'}}>☕ Break</button></Tip>}
        {mode!=='stopped'&&<Tip label="Stop stopwatch"><button onClick={stop} style={{background:'#888',color:'white',border:'none',borderRadius:7,padding:'3px 8px',fontWeight:800,fontSize:'0.6rem'}}>⏹ Stop</button></Tip>}
        <Tip label="Reset stopwatch"><button onClick={reset} style={{background:'#F4EFE0',color:'#5A7248',border:'1.5px solid #C0D8A8',borderRadius:7,padding:'3px 7px',fontWeight:800,fontSize:'0.6rem'}}>↺</button></Tip>
      </div>
      {sessions.length>0&&(
        <div style={{marginTop:6,fontSize:'0.58rem',color:'#7070A0',borderTop:'1px solid #D0D0E8',paddingTop:4,textAlign:'left'}}>
          {sessions.slice(-4).map((s,i)=>(<div key={i} style={{color:s.type==='work'?'#C07030':'#9A50B0'}}>{s.type==='work'?'💪':'☕'} {fmtHMS(s.dur)}</div>))}
        </div>
      )}
    </div>
  );
}

function App(){
  const saved=loadSaved();
  // Tier 4: build effective rooms/cols/tasks from ROOMS_CONFIG + CUSTOM_ROOM_TASKS
  // only when starting a fresh session (saved session takes precedence)
  const _initRC = !saved ? _buildRoomsFromConfig() : null;
  const [screen,setScreen]=useState('landing'); // 'landing' | 'main' | 'stats'
  const [tasks,setTasks]=useState(()=>saved?.tasks||(saved?INIT_TASKS:_mergeCustomTasks(INIT_TASKS)));
  const [rooms,setRooms]=useState(()=>saved?.rooms||(_initRC?_initRC.rooms:INIT_ROOMS));
  const [cols,setCols]=useState(()=>saved?.cols||(_initRC?_initRC.cols:INIT_COLS));
  const [open,setOpen]=useState(()=>saved?.open||{kitchen:true,dining:true,w1:true});
  const [viewMode,setViewMode]=useState(()=>saved?.viewMode||'room');
  const [catOpen,setCatOpen]=useState(()=>saved?.catOpen||{});
  const [editId,setEditId]=useState(null);
  const [addingTo,setAddingTo]=useState(null);
  const [newT,setNewT]=useState({t:'',priority:3,difficulty:'usual',emojis:[]});
  const [dragTask,setDragTask]=useState(null);
  const [dragRoom,setDragRoom]=useState(null);
  const [overTask,setOverTask]=useState(null);
  const [overRoom,setOverRoom]=useState(null);
  const [toasts,setToasts]=useState([]);
  const toastN=useRef(0);
  const [floatVisible,setFloatVisible]=useState(true);

  // Refs for reading timer values without causing re-renders
  const timerDataRef=useRef({workSec:0,breakSec:0,swWorkSec:0,swBreakSec:0,swSessions:[]});

  // Stats
  const [stats,setStats]=useState(()=>loadStats());
  const [completeNote,setCompleteNote]=useState('');
  const [showCompleteModal,setShowCompleteModal]=useState(false);

  // Persist main state
  useEffect(()=>{
    try{HQSafe.store.set(LS, {tasks,rooms,cols,open,viewMode,catOpen});}
    catch(e){}
  },[tasks,rooms,cols,open,viewMode,catOpen]);

  const allT=Object.values(tasks);
  const activeT=allT.filter(t=>!t.skipped);
  const doneCount=activeT.filter(t=>t.done).length;
  const total=activeT.length;
  const pct=total?Math.round(doneCount/total*100):0;
  let heroMsg=HMSGS[0][2];
  for(const[lo,hi,m]of HMSGS)if(pct>=lo&&pct<=hi){heroMsg=m;break;}

  function addToast(msg,color='#4A8C58'){
    const id=++toastN.current;
    setToasts(p=>[...p,{id,msg,color}]);
    setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==id)),4200);
  }

  function toggle(id){
    if(tasks[id]?.skipped)return;
    const wasDone=tasks[id]?.done;
    const newTasks={...tasks,[id]:{...tasks[id],done:!tasks[id].done}};
    setTasks(newTasks);
    if(!wasDone){
      setTimeout(()=>{
        for(const r of Object.values(rooms)){
          if(!r.taskIds.includes(id))continue;
          const rActive=r.taskIds.filter(tid=>!newTasks[tid]?.skipped);
          if(rActive.length&&rActive.every(tid=>tid===id?true:newTasks[tid]?.done)){
            addToast(`${RT[r.id]?.ico} ${RT[r.id]?.name} — DONE! 🎉`,RT[r.id]?.ac);
          }
        }
      },80);
    }
  }
  function upT(id,k,v){setTasks(p=>({...p,[id]:{...p[id],[k]:v}}));}
  function addTask(rid){
    if(!newT.t.trim()||!rid)return;
    const id='ct_'+Date.now();
    setTasks(p=>({...p,[id]:{...newT,id,done:false,phase:'tidy',custom:true,skipped:false}}));
    setRooms(p=>({...p,[rid]:{...p[rid],taskIds:[...p[rid].taskIds,id]}}));
    setNewT({t:'',priority:3,difficulty:'usual',emojis:[]});setAddingTo(null);
  }
  function delTask(id,rid){
    setTasks(p=>{const n={...p};delete n[id];return n;});
    setRooms(p=>({...p,[rid]:{...p[rid],taskIds:p[rid].taskIds.filter(x=>x!==id)}}));
    if(editId===id)setEditId(null);
  }
  function tdStart(e,tid,rid){setDragTask({id:tid,fromRoom:rid});e.dataTransfer.effectAllowed='move';}
  function tdOver(e,tid,rid){if(!dragTask||dragTask.fromRoom!==rid)return;e.preventDefault();setOverTask(tid);}
  function tdDrop(e,tid,rid){
    e.preventDefault();e.stopPropagation();
    if(!dragTask||dragTask.fromRoom!==rid||dragTask.id===tid){setDragTask(null);setOverTask(null);return;}
    setRooms(p=>{const ids=[...p[rid].taskIds];const fi=ids.indexOf(dragTask.id),ti=ids.indexOf(tid);ids.splice(fi,1);ids.splice(ti,0,dragTask.id);return{...p,[rid]:{...p[rid],taskIds:ids}};});
    setDragTask(null);setOverTask(null);
  }
  function rdStart(e,rid,ci){setDragRoom({id:rid,fromCol:ci});e.dataTransfer.effectAllowed='move';e.stopPropagation();}
  function rdOver(e,rid){if(!dragRoom)return;e.preventDefault();setOverRoom(rid);}
  function rdDrop(e,toRid,toCi){
    e.preventDefault();
    if(!dragRoom||dragRoom.id===toRid){setDragRoom(null);setOverRoom(null);return;}
    setCols(p=>{const n=p.map(c=>[...c]);n[dragRoom.fromCol]=n[dragRoom.fromCol].filter(r=>r!==dragRoom.id);const ti=n[toCi].indexOf(toRid);n[toCi].splice(ti>=0?ti:n[toCi].length,0,dragRoom.id);return n;});
    setDragRoom(null);setOverRoom(null);
  }
  async function doReset(){
    if(!(await HQConfirm.ask('Reset all progress? This cannot be undone.', {danger:true})))return;
    // Tier 4: re-apply ROOMS_CONFIG on reset so room config persists
    const _rrc=_buildRoomsFromConfig();
    setTasks(_mergeCustomTasks(INIT_TASKS));setRooms(_rrc.rooms);setCols(_rrc.cols);
    setOpen({kitchen:true,dining:true,w1:true});setCatOpen({});setEditId(null);setAddingTo(null);
    timerDataRef.current={workSec:0,breakSec:0,swWorkSec:0,swBreakSec:0,swSessions:[]};
    setScreen('landing');
    try{HQSafe.store.remove(LS);}catch(e){}
  }
  function doExport(){
    const td=timerDataRef.current;
    const data=JSON.stringify({tasks,rooms,cols,open,viewMode,catOpen,stats,swWorkSec:td.swWorkSec,swBreakSec:td.swBreakSec,swSessions:td.swSessions},null,2);
    const a=document.createElement('a');a.href='data:application/json,'+encodeURIComponent(data);
    a.download=`deep-clean-${new Date().toISOString().slice(0,10)}.json`;a.click();
  }
  function doImport(){
    const inp=document.createElement('input');inp.type='file';inp.accept='.json';
    inp.onchange=e=>{
      const f=e.target.files[0];if(!f)return;
      const r=new FileReader();
      r.onload=ev=>{
        try{
          const d=JSON.parse(ev.target.result);
          if(d.tasks)setTasks(d.tasks);if(d.rooms)setRooms(d.rooms);if(d.cols)setCols(d.cols);
          if(d.open)setOpen(d.open);if(d.viewMode)setViewMode(d.viewMode);if(d.catOpen)setCatOpen(d.catOpen);
          if(d.stats){setStats(d.stats);saveStats(d.stats);}
          if(d.swWorkSec!==undefined)timerDataRef.current.swWorkSec=d.swWorkSec;
          if(d.swBreakSec!==undefined)timerDataRef.current.swBreakSec=d.swBreakSec;
          if(d.swSessions)timerDataRef.current.swSessions=d.swSessions;
          addToast('✅ Import successful!','#4A8C58');setScreen('main');
        }catch(err){HQToast.error('❌ Invalid file — could not import.');}
      };r.readAsText(f);
    };inp.click();
  }
  function doCompleteClean(){
    const td=timerDataRef.current;
    const entry={
      date:new Date().toISOString(),
      pct,done:doneCount,total,
      workSec:td.swWorkSec,
      breakSec:td.swBreakSec,
      totalSec:td.swWorkSec+td.swBreakSec,
      sessions:td.swSessions,
      note:completeNote,
      skipped:allT.filter(t=>t.skipped).length,
    };
    const newStats=[entry,...stats];
    setStats(newStats);saveStats(newStats);
    setShowCompleteModal(false);setCompleteNote('');
    addToast('🏆 Clean recorded! Amazing work! ✨','#907000');
  }

  // TarotModal is defined outside App to prevent re-mount on every keystroke
  // TimerPanel is defined outside App to prevent flicker from timer ticks

  // ── Sub-components ────────────────────────────────────────────────────────
  function Chip({onClick,active,bg,activeBg,c,children,tip}){
    const btn=<button onClick={onClick} style={{fontSize:'0.65rem',fontWeight:800,padding:'2px 7px',borderRadius:18,border:`1.5px solid ${c}`,background:active?activeBg:bg,color:active?'white':c,transition:'all 0.12s'}}>{children}</button>;
    return tip?<Tip label={tip}>{btn}</Tip>:btn;
  }
  function RowLabel({label,children}){return(<div style={{marginBottom:4}}><div style={{fontSize:'0.6rem',fontWeight:900,color:'#4A6A30',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:2}}>{label}</div><div style={{display:'flex',gap:3,flexWrap:'wrap'}}>{children}</div></div>);}

  function EditPanel({task,rid}){
    const th=RT[rid];
    return(
      <div className="ep" style={{background:'rgba(255,255,255,0.92)',border:`1px solid ${th.bd}`,borderRadius:8,padding:7,margin:'2px 0 2px 20px'}}>
        <RowLabel label="Priority">
          {[1,2,3,4,5].map(p=>(<Chip key={p} onClick={()=>upT(task.id,'priority',p)} active={task.priority===p} bg={PI[p].bg} activeBg={PI[p].c} c={PI[p].c} tip={`Set priority ${PI[p].l}`}>{PI[p].l}</Chip>))}
        </RowLabel>
        <RowLabel label="Difficulty">
          {Object.entries(DI).map(([k,d])=>(<Chip key={k} onClick={()=>upT(task.id,'difficulty',k)} active={task.difficulty===k} bg={d.bg} activeBg={d.c} c={d.c} tip={`Mark as ${d.l}`}>{d.i} {d.l}</Chip>))}
        </RowLabel>
        <RowLabel label="Flags">
          <div style={{display:'flex',gap:2,flexWrap:'wrap'}}>
            {EMOJIS.map(em=>{const sel=(task.emojis||[]).includes(em);return(
              <Tip key={em} label={`Flag with ${em}`}><button onClick={()=>{const cur=task.emojis||[];upT(task.id,'emojis',sel?cur.filter(e=>e!==em):[...cur,em]);}} style={{fontSize:'0.85rem',padding:'1px 2px',border:`1.5px solid ${sel?th.ac:th.bd}`,borderRadius:5,background:sel?th.ac+'22':'white',cursor:'pointer',lineHeight:'1.35'}}>{em}</button></Tip>
            );})}
          </div>
        </RowLabel>
        {task.custom&&<Tip label="Permanently delete this custom task"><button onClick={()=>delTask(task.id,rid)} style={{background:'#FFE8E8',color:'#A83828',border:'1px solid #F0B0B0',borderRadius:6,padding:'2px 9px',fontSize:'0.65rem',fontWeight:800,marginTop:3}}>🗑️ Delete</button></Tip>}
      </div>
    );
  }

  function AddPanel({rid}){
    const th=RT[rid];
    if(addingTo!==rid)return(
      <Tip label="Add a one-off custom task to this room">
        <button onClick={e=>{e.stopPropagation();setAddingTo(rid);setEditId(null);}}
          style={{width:'100%',background:'transparent',border:`1.5px dashed ${th.bd}`,borderRadius:8,padding:'4px',color:th.ac,fontWeight:800,fontSize:'0.72rem',marginTop:3,transition:'background 0.15s'}}
          onMouseOver={e=>e.currentTarget.style.background=th.ac+'14'} onMouseOut={e=>e.currentTarget.style.background='transparent'}>
          + Add Custom Task
        </button>
      </Tip>
    );
    return(
      <div className="af" style={{background:'rgba(255,255,255,0.85)',borderRadius:8,padding:8,border:`1.5px solid ${th.bd}`,marginTop:4}}>
        <input value={newT.t} onChange={e=>setNewT(p=>({...p,t:e.target.value}))}
          onKeyDown={e=>{if(e.key==='Enter')addTask(rid);if(e.key==='Escape')setAddingTo(null);}}
          placeholder="Task description…" autoFocus
          style={{width:'100%',border:`1.5px solid ${th.bd}`,borderRadius:6,padding:'4px 7px',fontSize:'0.82rem',fontWeight:600,background:'white',color:'#2B3A1A',marginBottom:5}}/>
        <RowLabel label="Priority">{[1,2,3,4,5].map(p=>(<Chip key={p} onClick={()=>setNewT(prev=>({...prev,priority:p}))} active={newT.priority===p} bg={PI[p].bg} activeBg={PI[p].c} c={PI[p].c}>{PI[p].l}</Chip>))}</RowLabel>
        <RowLabel label="Difficulty">{Object.entries(DI).map(([k,d])=>(<Chip key={k} onClick={()=>setNewT(prev=>({...prev,difficulty:k}))} active={newT.difficulty===k} bg={d.bg} activeBg={d.c} c={d.c}>{d.i} {d.l}</Chip>))}</RowLabel>
        <div style={{display:'flex',gap:5,marginTop:5}}>
          <button onClick={()=>addTask(rid)} style={{flex:1,background:th.ac,color:'white',border:'none',borderRadius:7,padding:'5px',fontWeight:800,fontSize:'0.75rem'}}>+ Add</button>
          <button onClick={()=>setAddingTo(null)} style={{background:'white',color:th.hc,border:`1px solid ${th.bd}`,borderRadius:7,padding:'5px 10px',fontWeight:700,fontSize:'0.75rem'}}>✕</button>
        </div>
      </div>
    );
  }

  function TaskRow({task,rid}){
    if(!task)return null;
    const th=RT[rid];
    const isEd=editId===task.id;
    const diff=DI[task.difficulty]||DI.usual;
    const pri=PI[task.priority]||PI[3];
    const isOv=overTask===task.id&&dragTask?.fromRoom===rid;
    const isSkipped=!!task.skipped;
    return(
      <div draggable={!isSkipped} onDragStart={e=>!isSkipped&&tdStart(e,task.id,rid)}
        onDragOver={e=>tdOver(e,task.id,rid)} onDrop={e=>tdDrop(e,task.id,rid)}
        onDragLeave={()=>setOverTask(null)} style={{marginBottom:1}}>
        <div className={`trow${isOv?' dot':''}`}
          style={{display:'flex',alignItems:'center',gap:5,padding:'3px 5px',borderRadius:7,
            background:isSkipped?'rgba(0,0,0,0.03)':task.hl?th.ac+'18':'transparent',
            border:isSkipped?'1px solid rgba(0,0,0,0.06)':task.hl?`1px solid ${th.ac}44`:'1px solid transparent',
            opacity:isSkipped?0.45:1}}>
          <span style={{color:th.ac,opacity:0.3,fontSize:'0.65rem',flexShrink:0,cursor:isSkipped?'default':'grab',lineHeight:1}}>⠿</span>
          <Tip label={isSkipped?'Skipped for this clean (click edit to restore)':task.done?'Mark as not done':'Mark as done'}>
            <div className={`cbx${task.done&&!isSkipped?' pop':''}`} onClick={()=>toggle(task.id)}
              style={{width:17,height:17,borderRadius:4,border:`2px solid ${isSkipped?'#ccc':task.done?th.ac:th.ac+'88'}`,
                background:isSkipped?'#eee':task.done?th.ac:'white',display:'flex',alignItems:'center',justifyContent:'center',
                color:isSkipped?'#aaa':'white',fontSize:'0.6rem',fontWeight:900,flexShrink:0,
                boxShadow:task.done&&!isSkipped?`0 0 6px ${th.ac}88`:'none',cursor:isSkipped?'not-allowed':'pointer'}}>
              {isSkipped?'—':task.done?'✓':''}
            </div>
          </Tip>
          <span style={{flex:1,fontSize:'0.82rem',fontWeight:task.hl&&!isSkipped?800:600,lineHeight:1.25,
            color:isSkipped?'#999':task.done?th.ac+'66':'#2B3A1A',
            textDecoration:isSkipped||task.done?'line-through':'none'}}>
            {(task.emojis||[]).length>0&&<span style={{marginRight:3}}>{task.emojis.join('')}</span>}
            {task.t}
            {isSkipped&&<span style={{fontSize:'0.58rem',color:'#aaa',marginLeft:5,fontStyle:'italic'}}>skipped</span>}
          </span>
          <div style={{display:'flex',gap:2,alignItems:'center',flexShrink:0}}>
            {!isSkipped&&<Tip label={`Priority: ${pri.l} — urgency level`}><span style={{fontSize:'0.6rem',fontWeight:900,padding:'1px 4px',borderRadius:16,background:pri.bg,color:pri.c,border:`1px solid ${pri.c}44`,lineHeight:'1.55'}}>{pri.l}</span></Tip>}
            {!isSkipped&&<Tip label={`Difficulty: ${diff.l}`}><span style={{fontSize:'0.8rem'}}>{diff.i}</span></Tip>}
            {task.tmr&&!task.done&&!isSkipped&&(
              <Tip label="Start 15-min work timer for this dish session">
                <button onClick={e=>{e.stopPropagation();setWorkRun(false);setWorkSec(900);setWorkDur(15);setTimeout(()=>setWorkRun(true),50);}} style={{background:'#C07030',color:'white',border:'none',borderRadius:5,padding:'1px 5px',fontSize:'0.58rem',fontWeight:800}}>⏱</button>
              </Tip>
            )}
            <Tip label={isEd?'Close editor':'Edit priority, difficulty & flags'}>
              <button onClick={e=>{e.stopPropagation();setEditId(isEd?null:task.id);setAddingTo(null);}}
                style={{background:'none',border:'none',fontSize:'0.72rem',color:th.ac+'80',padding:'0 1px',lineHeight:1}}
                onMouseOver={e=>e.currentTarget.style.color=th.ac} onMouseOut={e=>e.currentTarget.style.color=th.ac+'80'}>✏️</button>
            </Tip>
          </div>
        </div>
        {isEd&&<EditPanel task={task} rid={rid}/>}
      </div>
    );
  }

  function RoomCard({rid,ci}){
    const room=rooms[rid];if(!room)return null;
    const th=RT[rid];
    const rTasks=room.taskIds.map(id=>tasks[id]).filter(Boolean);
    const activeTasks=rTasks.filter(t=>!t.skipped);
    const rdone=activeTasks.filter(t=>t.done).length;
    const rpct=activeTasks.length?Math.round(rdone/activeTasks.length*100):0;
    const isOpen=!!open[rid];
    const isComplete=rdone===activeTasks.length&&activeTasks.length>0;
    const isDrg=dragRoom?.id===rid;
    const isOvR=overRoom===rid;
    const byPhase={};
    rTasks.forEach(t=>{if(!byPhase[t.phase])byPhase[t.phase]=[];byPhase[t.phase].push(t);});
    return(
      <div className={`card${isDrg?' dragging':''}`}
        style={{background:th.bg,border:`1.5px solid ${isComplete?th.ac:isOvR?th.ac:th.bd}`,borderRadius:13,overflow:'hidden',marginBottom:11,boxShadow:isComplete?`0 0 0 3px ${th.ac}40,0 3px 14px rgba(40,60,20,0.09)`:'0 2px 8px rgba(40,60,20,0.06)'}}
        onDragOver={e=>rdOver(e,rid)} onDrop={e=>rdDrop(e,rid,ci)}>
        <div style={{background:isComplete?th.ac+'28':th.ac+'18',borderBottom:`1px solid ${th.bd}`,padding:'7px 10px',display:'flex',alignItems:'center',gap:6,cursor:'pointer',userSelect:'none'}}
          onClick={()=>setOpen(o=>({...o,[rid]:!o[rid]}))}>
          <Tip label="Drag to reorder rooms between columns">
            <span draggable onDragStart={e=>rdStart(e,rid,ci)} onClick={e=>e.stopPropagation()}
              style={{cursor:'grab',fontSize:'0.8rem',color:th.ac,opacity:0.38,flexShrink:0}}>⠿</span>
          </Tip>
          <span style={{fontSize:'1.05rem'}}>{th.ico}</span>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:'0.95rem',color:th.hc,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{th.name}</div>
            <div style={{fontSize:'0.62rem',fontWeight:700,color:th.ac}}>{rdone}/{activeTasks.length} · {rpct}%{rTasks.length>activeTasks.length?` (${rTasks.length-activeTasks.length} skipped)`:''}</div>
          </div>
          {isComplete&&<span style={{fontSize:'0.6rem',fontWeight:900,color:th.ac,background:th.ac+'22',border:`1px solid ${th.ac}55`,borderRadius:16,padding:'2px 6px',whiteSpace:'nowrap'}}>✓ DONE!</span>}
          <span style={{color:th.ac,transform:isOpen?'rotate(180deg)':'none',transition:'transform 0.25s',flexShrink:0,fontSize:'0.8rem'}}>▾</span>
        </div>
        <div style={{height:4,background:'rgba(255,255,255,0.5)'}}><div className="sparkle-bar" style={{height:'100%',width:rpct+'%',transition:'width 0.5s ease'}}/></div>
        {isOpen&&(
          <div style={{padding:'7px 8px 5px'}}>
            {PH_ORDER.filter(ph=>byPhase[ph]).map(ph=>{
              const p=PH[ph];
              return(
                <div key={ph} style={{marginBottom:5}}>
                  <div style={{display:'flex',alignItems:'center',gap:3,padding:'1px 0 2px',borderBottom:`1px solid ${th.bd}77`,marginBottom:2}}>
                    <span style={{fontSize:'0.72rem'}}>{p.i}</span>
                    <span style={{fontSize:'0.62rem',fontWeight:900,textTransform:'uppercase',letterSpacing:'0.07em',color:p.c}}>{p.l}</span>
                  </div>
                  {byPhase[ph].map(t=><TaskRow key={t.id} task={t} rid={rid}/>)}
                </div>
              );
            })}
            <AddPanel rid={rid}/>
          </div>
        )}
      </div>
    );
  }

  function CategoryView(){
    return(
      <div style={{padding:'12px 13px'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:11}}>
          {CAT_PHASES.map(cp=>{
            const allPh=Object.values(tasks).filter(t=>t.phase===cp.ph&&!t.skipped);
            const donePh=allPh.filter(t=>t.done).length;
            const phPct=allPh.length?Math.round(donePh/allPh.length*100):0;
            const isOpen=!!catOpen[cp.ph];const isComplete=donePh===allPh.length&&allPh.length>0;
            const byRoom={};
            Object.values(tasks).filter(t=>t.phase===cp.ph).forEach(t=>{
              const rid=Object.keys(rooms).find(r=>rooms[r].taskIds.includes(t.id));
              if(rid){if(!byRoom[rid])byRoom[rid]=[];byRoom[rid].push(t);}
            });
            return(
              <div key={cp.ph} className="card"
                style={{background:cp.bg,border:`1.5px solid ${isComplete?cp.color:cp.bd}`,borderRadius:13,overflow:'hidden',boxShadow:isComplete?`0 0 0 3px ${cp.color}33,0 3px 14px rgba(40,60,20,0.09)`:'0 2px 8px rgba(40,60,20,0.06)'}}>
                <div style={{background:isComplete?cp.color+'28':cp.color+'14',borderBottom:`1px solid ${cp.bd}`,padding:'7px 10px',cursor:'pointer',userSelect:'none'}} onClick={()=>setCatOpen(o=>({...o,[cp.ph]:!o[cp.ph]}))}>
                  <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:4}}>
                    <span style={{fontSize:'1rem'}}>{cp.icon}</span>
                    <div style={{flex:1}}><div style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:'0.95rem',color:cp.color,lineHeight:1.15}}>{cp.label}</div></div>
                    <span style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:'1rem',color:isComplete?cp.color:'#2B3A1A',whiteSpace:'nowrap'}}>{donePh}/{allPh.length}</span>
                    <span style={{color:cp.color,transform:isOpen?'rotate(180deg)':'none',transition:'transform 0.25s',fontSize:'0.8rem'}}>▾</span>
                  </div>
                  <div style={{height:4,background:'rgba(255,255,255,0.6)',borderRadius:10,overflow:'hidden',border:`1px solid ${cp.bd}`}}>
                    <div className="sparkle-bar" style={{height:'100%',width:phPct+'%',borderRadius:10,transition:'width 0.5s ease'}}/>
                  </div>
                  <div style={{fontSize:'0.65rem',color:cp.color,marginTop:3,fontStyle:'italic'}}>{cp.desc}</div>
                </div>
                {isOpen&&(
                  <div style={{padding:'7px 8px 5px'}}>
                    {Object.entries(byRoom).map(([rid,rTasks])=>{
                      const th=RT[rid];if(!th)return null;
                      return(<div key={rid} style={{marginBottom:5}}>
                        <div style={{display:'flex',alignItems:'center',gap:3,marginBottom:2,padding:'1px 5px',borderRadius:5,background:th.ac+'14'}}>
                          <span style={{fontSize:'0.78rem'}}>{th.ico}</span>
                          <span style={{fontSize:'0.65rem',fontWeight:800,color:th.hc}}>{th.name}</span>
                          <span style={{fontSize:'0.6rem',color:th.ac,marginLeft:'auto'}}>{rTasks.filter(t=>t.done&&!t.skipped).length}/{rTasks.filter(t=>!t.skipped).length}</span>
                        </div>
                        {rTasks.map(t=><TaskRow key={t.id} task={t} rid={rid}/>)}
                      </div>);
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function OOOView(){
    const firstIncomplete=OOO_WAVES.findIndex(w=>w.groups.flatMap(g=>g.tids).some(tid=>tasks[tid]&&!tasks[tid].done&&!tasks[tid].skipped));
    const col1=OOO_WAVES.filter((_,i)=>i%3===0);
    const col2=OOO_WAVES.filter((_,i)=>i%3===1);
    const col3=OOO_WAVES.filter((_,i)=>i%3===2);
    return(
      <div style={{padding:'12px 13px',maxWidth:1400,margin:'0 auto'}}>
        <div style={{marginBottom:10,background:'rgba(255,255,255,0.6)',borderRadius:10,padding:'7px 12px',border:'1px solid #C8DDB8'}}>
          <span style={{fontSize:'0.72rem',fontWeight:800,color:'#4A6A30',fontStyle:'italic'}}>🔮 Complete each step across every room before moving to the next</span>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:11,alignItems:'start'}}>
          {[col1,col2,col3].map((waveCol,hi)=>(
            <div key={hi}>
              {waveCol.map((wave,wi)=>{
                const displayStep=wi*3+hi+1;
                const gIdx=OOO_WAVES.indexOf(wave);
                const wTids=wave.groups.flatMap(g=>g.tids);
                const wTasks=wTids.map(id=>tasks[id]).filter(t=>t&&!t.skipped);
                const wDone=wTasks.filter(t=>t.done).length;
                const wTotal=wTasks.length;
                const wPct=wTotal?Math.round(wDone/wTotal*100):0;
                const isComplete=wDone===wTotal&&wTotal>0;
                const isActive=!isComplete&&gIdx===firstIncomplete;
                const isExpanded=!!open[wave.id];
                return(
                  <div key={wave.id} className={`card ooo-step${isActive?' active-wave':''}`}
                    style={{background:wave.bg,border:`1.5px solid ${isComplete?wave.color:isActive?wave.color:wave.bd}`,borderRadius:13,overflow:'hidden',marginBottom:10,
                      boxShadow:isComplete?`0 0 0 3px ${wave.color}33,0 3px 12px rgba(40,60,20,0.09)`:isActive?`0 0 0 2px ${wave.color},0 4px 16px ${wave.color}22`:'0 2px 7px rgba(40,60,20,0.06)'}}>
                    <div style={{background:isComplete?wave.color+'2A':isActive?wave.color+'1C':wave.color+'0F',borderBottom:`1px solid ${wave.bd}`,padding:'7px 10px',cursor:'pointer',userSelect:'none',display:'flex',alignItems:'center',gap:7}}
                      onClick={()=>setOpen(o=>({...o,[wave.id]:!o[wave.id]}))}>
                      <Tip label={isComplete?'Step complete!':isActive?'This is your next step':'Step not yet reached'}>
                        <div style={{width:24,height:24,borderRadius:'50%',background:isComplete?wave.color:wave.color+'22',border:`2px solid ${wave.color}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:'0.65rem',fontWeight:900,color:isComplete?'white':wave.color}}>
                          {isComplete?'✓':displayStep}
                        </div>
                      </Tip>
                      <span style={{fontSize:'1rem',flexShrink:0}}>{wave.icon}</span>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:'0.88rem',color:wave.color,lineHeight:1.15}}>{wave.label}</div>
                        <div style={{fontSize:'0.62rem',fontWeight:700,color:wave.color+'99'}}>{wDone}/{wTotal} tasks {isActive&&!isComplete?'← next!':''}</div>
                      </div>
                      {isActive&&!isComplete&&<span style={{fontSize:'0.62rem',fontWeight:900,background:wave.color,color:'white',borderRadius:8,padding:'2px 6px',whiteSpace:'nowrap',flexShrink:0}}>▶ NOW</span>}
                      {isComplete&&<span style={{fontSize:'0.62rem',fontWeight:900,color:wave.color,background:wave.color+'22',border:`1px solid ${wave.color}55`,borderRadius:8,padding:'2px 6px',whiteSpace:'nowrap',flexShrink:0}}>✓ DONE</span>}
                      <span style={{color:wave.color,transform:isExpanded?'rotate(180deg)':'none',transition:'transform 0.25s',fontSize:'0.78rem',flexShrink:0}}>▾</span>
                    </div>
                    <div style={{height:4,background:'rgba(255,255,255,0.55)'}}><div className="sparkle-bar" style={{height:'100%',width:wPct+'%',transition:'width 0.5s ease'}}/></div>
                    <div style={{padding:'4px 10px',fontSize:'0.65rem',fontWeight:600,color:wave.color+'BB',borderBottom:`1px solid ${wave.bd}55`,fontStyle:'italic',lineHeight:1.35}}>{wave.desc}</div>
                    {isExpanded&&(
                      <div className="wave-in" style={{padding:'7px 8px 5px'}}>
                        {wave.groups.map(grp=>{
                          const th=RT[grp.rid];if(!th)return null;
                          const grpTasks=grp.tids.map(id=>tasks[id]).filter(Boolean);
                          if(!grpTasks.length)return null;
                          return(<div key={grp.rid} style={{marginBottom:5}}>
                            <div style={{display:'flex',alignItems:'center',gap:3,marginBottom:2,padding:'1px 5px',borderRadius:5,background:th.ac+'16',border:`1px solid ${th.ac}33`}}>
                              <span style={{fontSize:'0.78rem'}}>{th.ico}</span>
                              <span style={{fontSize:'0.65rem',fontWeight:800,color:th.hc}}>{th.name}</span>
                              <span style={{fontSize:'0.6rem',color:th.ac,marginLeft:'auto'}}>{grpTasks.filter(t=>t.done&&!t.skipped).length}/{grpTasks.filter(t=>!t.skipped).length}</span>
                            </div>
                            {grpTasks.map(t=><TaskRow key={t.id} task={t} rid={grp.rid}/>)}
                          </div>);
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── LANDING PAGE ──────────────────────────────────────────────────────────
  function LandingPage(){
    const [landAddingTo,setLandAddingTo]=useState(null);
    const [landNewT,setLandNewT]=useState({t:'',priority:3,difficulty:'usual',rid:'kitchen'});
    const [expandedRoom,setExpandedRoom]=useState(null);

    function landAddTask(){
      if(!landNewT.t.trim())return;
      const rid=landNewT.rid;
      const id='ct_'+Date.now();
      setTasks(p=>({...p,[id]:{...mk(id,landNewT.t,'tidy',{priority:landNewT.priority,difficulty:landNewT.difficulty}),custom:true,skipped:false}}));
      setRooms(p=>({...p,[rid]:{...p[rid],taskIds:[...p[rid].taskIds,id]}}));
      setLandNewT({t:'',priority:3,difficulty:'usual',rid});setLandAddingTo(null);
    }
    function toggleSkip(id){setTasks(p=>({...p,[id]:{...p[id],skipped:!p[id].skipped,done:false}}));}

    const roomOrder=['kitchen','dining','living','hallway','closets','bedroom','bathroom','fridge','final'];
    const skippedCount=Object.values(tasks).filter(t=>t.skipped).length;
    const customCount=Object.values(tasks).filter(t=>t.custom&&!t.skipped).length;

    return(
      <div style={{background:'#F4EFE0',minHeight:'100vh',fontFamily:"'Nunito',sans-serif"}}>
        {/* Header */}
        <div style={{background:'linear-gradient(120deg,#EDF7EE,#EEF0FF,#FFF8E8)',borderBottom:'2px solid #C0D8A8',padding:'20px 20px 16px',textAlign:'center',boxShadow:'0 2px 10px rgba(45,70,20,0.08)'}}>
          <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:'2rem',background:'linear-gradient(120deg,#1D4100,#6A58BC,#9A6050)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text',marginBottom:4}}>✨ Weekend Deep Clean</h1>
          <p style={{fontSize:'0.85rem',color:'#6A7A5A',fontStyle:'italic',marginBottom:12}}>Review your task list before you begin. Skip tasks that don't apply today, or add custom ones.</p>
          <div style={{display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap'}}>
            <div style={{background:'rgba(255,255,255,0.8)',borderRadius:10,padding:'6px 14px',border:'1px solid #C0D8A8'}}>
              <span style={{fontSize:'0.75rem',fontWeight:800,color:'#4A8C58'}}>{Object.values(tasks).filter(t=>!t.skipped).length} tasks active</span>
            </div>
            {skippedCount>0&&<div style={{background:'rgba(255,255,255,0.8)',borderRadius:10,padding:'6px 14px',border:'1px solid #D0C0A8'}}>
              <span style={{fontSize:'0.75rem',fontWeight:800,color:'#9A6050'}}>{skippedCount} skipped</span>
            </div>}
            {customCount>0&&<div style={{background:'rgba(255,255,255,0.8)',borderRadius:10,padding:'6px 14px',border:'1px solid #B0C0D8'}}>
              <span style={{fontSize:'0.75rem',fontWeight:800,color:'#506090'}}>{customCount} custom added</span>
            </div>}
            {/* Tier 4: Setup link → customize.html deep clean task pool tab */}
            <a href="customize.html#dc-setup" style={{background:'rgba(255,255,255,0.8)',borderRadius:10,padding:'6px 14px',border:'1px solid #C8C0D8',textDecoration:'none',display:'inline-flex',alignItems:'center',gap:4}}>
              <span style={{fontSize:'0.75rem',fontWeight:800,color:'#6A58BC'}}>⚙️ Setup rooms &amp; tasks</span>
            </a>
          </div>
        </div>

        <div style={{maxWidth:900,margin:'0 auto',padding:'16px 14px 100px'}}>
          {/* Room sections */}
          {roomOrder.map(rid=>{
            const th=RT[rid];if(!th)return null;
            const rTasks=rooms[rid]?.taskIds.map(id=>tasks[id]).filter(Boolean)||[];
            const isExp=expandedRoom===rid;
            const skipped=rTasks.filter(t=>t.skipped).length;
            return(
              <div key={rid} className="card" style={{background:th.bg,border:`1.5px solid ${th.bd}`,borderRadius:13,marginBottom:10,overflow:'hidden',boxShadow:'0 2px 8px rgba(40,60,20,0.06)'}}>
                <div style={{background:th.ac+'18',padding:'8px 12px',display:'flex',alignItems:'center',gap:8,cursor:'pointer',userSelect:'none',borderBottom:`1px solid ${th.bd}`}} onClick={()=>setExpandedRoom(isExp?null:rid)}>
                  <span style={{fontSize:'1.1rem'}}>{th.ico}</span>
                  <div style={{flex:1}}>
                    <span style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:'1rem',color:th.hc}}>{th.name}</span>
                    <span style={{fontSize:'0.65rem',color:th.ac,marginLeft:8,fontWeight:700}}>{rTasks.length} tasks{skipped>0?`, ${skipped} skipped`:''}</span>
                  </div>
                  <span style={{color:th.ac,transform:isExp?'rotate(180deg)':'none',transition:'transform 0.25s',fontSize:'0.85rem'}}>▾</span>
                </div>
                {isExp&&(
                  <div style={{padding:'8px 10px 10px'}}>
                    {rTasks.map(task=>(
                      <div key={task.id} style={{display:'flex',alignItems:'center',gap:8,padding:'5px 6px',borderRadius:8,marginBottom:2,background:task.skipped?'rgba(0,0,0,0.03)':'rgba(255,255,255,0.5)',border:`1px solid ${task.skipped?'rgba(0,0,0,0.08)':th.bd+'80'}`,opacity:task.skipped?0.5:1}}>
                        <span style={{fontSize:'0.82rem',flex:1,color:task.skipped?'#999':'#2B3A1A',textDecoration:task.skipped?'line-through':'none',fontWeight:task.hl?700:500}}>{task.t}</span>
                        <span style={{fontSize:'0.6rem',fontWeight:800,padding:'1px 5px',borderRadius:14,background:(PI[task.priority]||PI[3]).bg,color:(PI[task.priority]||PI[3]).c}}>{(PI[task.priority]||PI[3]).l}</span>
                        <span style={{fontSize:'0.78rem'}}>{(DI[task.difficulty]||DI.usual).i}</span>
                        <Tip label={task.skipped?'Un-skip this task (include in clean)':'Skip this task for today only — it will still show but won\'t count'}>
                          <button onClick={()=>toggleSkip(task.id)}
                            style={{fontSize:'0.6rem',fontWeight:800,padding:'2px 8px',borderRadius:14,border:`1.5px solid ${task.skipped?'#4A8C58':'#C07030'}`,background:task.skipped?'#E8F5EE':'#FFF0E0',color:task.skipped?'#4A8C58':'#C07030',whiteSpace:'nowrap'}}>
                            {task.skipped?'+ Include':'Skip'}
                          </button>
                        </Tip>
                        {task.custom&&<Tip label="Remove this custom task permanently"><button onClick={()=>delTask(task.id,rid)} style={{background:'none',border:'none',fontSize:'0.8rem',color:'#C08080',cursor:'pointer'}}>🗑️</button></Tip>}
                      </div>
                    ))}
                    {/* Add task inline on landing */}
                    {landAddingTo===rid?(
                      <div style={{background:'rgba(255,255,255,0.85)',borderRadius:8,padding:8,border:`1.5px solid ${th.bd}`,marginTop:6}}>
                        <input value={landNewT.t} onChange={e=>setLandNewT(p=>({...p,t:e.target.value}))}
                          onKeyDown={e=>{if(e.key==='Enter')landAddTask();if(e.key==='Escape')setLandAddingTo(null);}}
                          placeholder="Task description…" autoFocus
                          style={{width:'100%',border:`1.5px solid ${th.bd}`,borderRadius:6,padding:'4px 7px',fontSize:'0.82rem',background:'white',color:'#2B3A1A',marginBottom:5}}/>
                        <div style={{display:'flex',gap:4,marginBottom:4,flexWrap:'wrap'}}>
                          {[1,2,3,4,5].map(p=>(<button key={p} onClick={()=>setLandNewT(v=>({...v,priority:p}))} style={{fontSize:'0.6rem',fontWeight:800,padding:'2px 7px',borderRadius:14,border:`1.5px solid ${(PI[p]||PI[3]).c}`,background:landNewT.priority===p?(PI[p]||PI[3]).c:(PI[p]||PI[3]).bg,color:landNewT.priority===p?'white':(PI[p]||PI[3]).c}}>{(PI[p]||PI[3]).l}</button>))}
                          {Object.entries(DI).map(([k,d])=>(<button key={k} onClick={()=>setLandNewT(v=>({...v,difficulty:k}))} style={{fontSize:'0.6rem',fontWeight:800,padding:'2px 7px',borderRadius:14,border:`1.5px solid ${d.c}`,background:landNewT.difficulty===k?d.c:d.bg,color:landNewT.difficulty===k?'white':d.c}}>{d.i} {d.l}</button>))}
                        </div>
                        <div style={{display:'flex',gap:5}}>
                          <button onClick={landAddTask} style={{flex:1,background:th.ac,color:'white',border:'none',borderRadius:7,padding:'5px',fontWeight:800,fontSize:'0.75rem'}}>+ Add</button>
                          <button onClick={()=>setLandAddingTo(null)} style={{background:'white',color:th.hc,border:`1px solid ${th.bd}`,borderRadius:7,padding:'5px 10px',fontWeight:700,fontSize:'0.75rem'}}>✕</button>
                        </div>
                      </div>
                    ):(
                      <button onClick={()=>{setLandAddingTo(rid);setLandNewT(p=>({...p,rid}));}}
                        style={{width:'100%',background:'transparent',border:`1.5px dashed ${th.bd}`,borderRadius:7,padding:'4px',color:th.ac,fontWeight:800,fontSize:'0.7rem',marginTop:5,cursor:'pointer'}}
                        onMouseOver={e=>e.currentTarget.style.background=th.ac+'14'} onMouseOut={e=>e.currentTarget.style.background='transparent'}>
                        + Add Custom Task
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Sticky bottom CTA */}
        <div style={{position:'fixed',bottom:0,left:0,right:0,background:'linear-gradient(to top,#F4EFE0,#F4EFE0ee,transparent)',padding:'14px 20px',display:'flex',gap:10,justifyContent:'center',alignItems:'center'}}>
          <Tip label="View past deep clean history and stats">
            <button onClick={()=>setScreen('stats')}
              style={{background:'rgba(255,255,255,0.9)',border:'1.5px solid #C0D8A8',borderRadius:11,padding:'9px 18px',fontWeight:800,fontSize:'0.78rem',color:'#5A7248'}}>
              📊 Stats
            </button>
          </Tip>
          <Tip label="Import a previously exported session file">
            <button onClick={doImport}
              style={{background:'rgba(255,255,255,0.9)',border:'1.5px solid #C0D8A8',borderRadius:11,padding:'9px 18px',fontWeight:800,fontSize:'0.78rem',color:'#5A7248'}}>
              📥 Import
            </button>
          </Tip>
          <button onClick={()=>setScreen('main')}
            style={{background:'linear-gradient(120deg,#4A8C58,#6A58BC)',color:'white',border:'none',borderRadius:13,padding:'11px 36px',fontWeight:900,fontSize:'0.95rem',boxShadow:'0 4px 16px rgba(74,140,88,0.4)',cursor:'pointer'}}>
            ✨ Begin Clean →
          </button>
        </div>
      </div>
    );
  }

  // ── STATS PAGE ────────────────────────────────────────────────────────────
  function StatsPage(){
    async function deleteEntry(i){
      if(!(await HQConfirm.ask('Delete this record?', {danger:true})))return;
      const n=[...stats];n.splice(i,1);setStats(n);saveStats(n);
    }
    const avgPct=stats.length?Math.round(stats.reduce((a,s)=>a+s.pct,0)/stats.length):0;
    const avgWork=stats.length?Math.round(stats.reduce((a,s)=>a+(s.workSec||0),0)/stats.length):0;
    const best=stats.reduce((a,s)=>s.pct>a?s.pct:a,0);
    return(
      <div style={{background:'#F4EFE0',minHeight:'100vh',fontFamily:"'Nunito',sans-serif",paddingBottom:60}}>
        <div style={{background:'linear-gradient(120deg,#EDF7EE,#EEF0FF,#FFF8E8)',borderBottom:'2px solid #C0D8A8',padding:'14px 18px 12px',position:'sticky',top:0,zIndex:200,boxShadow:'0 2px 10px rgba(45,70,20,0.08)'}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:'1.3rem',background:'linear-gradient(120deg,#1D4100,#6A58BC)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>📊 Clean History</h1>
            <div style={{flex:1}}/>
            <button onClick={()=>setScreen('landing')} style={{background:'rgba(255,255,255,0.8)',border:'1.5px solid #C0D8A8',borderRadius:9,padding:'5px 12px',fontWeight:800,fontSize:'0.72rem',color:'#5A7248'}}>← Back</button>
            <Tip label="Export all data to JSON file">
              <button onClick={doExport} style={{background:'rgba(255,255,255,0.8)',border:'1.5px solid #C0D8A8',borderRadius:9,padding:'5px 12px',fontWeight:800,fontSize:'0.72rem',color:'#5A7248'}}>📤 Export</button>
            </Tip>
          </div>
        </div>
        <div style={{maxWidth:800,margin:'0 auto',padding:'14px 14px'}}>
          {stats.length===0?(
            <div style={{textAlign:'center',padding:'60px 20px',color:'#8A9870'}}>
              <div style={{fontSize:'3rem',marginBottom:12}}>🏆</div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:'1.2rem',marginBottom:6}}>No completed cleans yet</div>
              <div style={{fontSize:'0.8rem'}}>When you finish a clean and hit "Complete this clean", it'll show up here.</div>
            </div>
          ):(
            <>
              {/* Summary row */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:10,marginBottom:16}}>
                {[['Cleans Done',stats.length,'#4A8C58'],['Avg Completion',avgPct+'%','#6A58BC'],['Best Session',best+'%','#9A8000'],['Avg Work Time',fmtHMS(avgWork),'#C07030']].map(([l,v,c])=>(
                  <div key={l} style={{background:'white',borderRadius:11,padding:'10px 12px',textAlign:'center',border:`1.5px solid ${c}22`,boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
                    <div style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:'1.3rem',color:c}}>{v}</div>
                    <div style={{fontSize:'0.62rem',fontWeight:800,color:'#8A9870',textTransform:'uppercase',letterSpacing:'0.05em'}}>{l}</div>
                  </div>
                ))}
              </div>
              {/* Entries */}
              {stats.map((s,i)=>{
                const d=new Date(s.date);
                const dateStr=d.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric',year:'numeric'});
                const timeStr=d.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});
                return(
                  <div key={i} style={{background:'white',borderRadius:13,padding:'12px 14px',marginBottom:10,boxShadow:'0 2px 10px rgba(0,0,0,0.06)',border:'1.5px solid #E0E8D8'}}>
                    <div style={{display:'flex',alignItems:'flex-start',gap:10,marginBottom:8}}>
                      <div style={{flex:1}}>
                        <div style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:'0.95rem',color:'#2B3A1A'}}>{dateStr} <span style={{fontWeight:400,color:'#8A9870',fontSize:'0.8rem'}}>at {timeStr}</span></div>
                        {s.note&&<div style={{fontSize:'0.72rem',color:'#6A7A5A',marginTop:2,fontStyle:'italic'}}>"{s.note}"</div>}
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <div style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:'1.4rem',color:s.pct>=80?'#4A8C58':s.pct>=50?'#9A8000':'#9A5828'}}>{s.pct}%</div>
                        <button onClick={()=>deleteEntry(i)} style={{background:'none',border:'none',fontSize:'0.8rem',color:'#C08080',cursor:'pointer',opacity:0.6}} onMouseOver={e=>e.currentTarget.style.opacity='1'} onMouseOut={e=>e.currentTarget.style.opacity='0.6'}>🗑️</button>
                      </div>
                    </div>
                    <div style={{height:6,background:'#F0F4E8',borderRadius:10,overflow:'hidden',marginBottom:8}}>
                      <div style={{height:'100%',width:s.pct+'%',background:s.pct>=80?'#4A8C58':s.pct>=50?'#9A8000':'#C07030',borderRadius:10,transition:'width 0.5s ease'}}/>
                    </div>
                    <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
                      <span style={{fontSize:'0.65rem',fontWeight:700,color:'#5A7248'}}>✅ {s.done}/{s.total} tasks</span>
                      {s.skipped>0&&<span style={{fontSize:'0.65rem',fontWeight:700,color:'#9A6050'}}>⏭ {s.skipped} skipped</span>}
                      {s.workSec>0&&<span style={{fontSize:'0.65rem',fontWeight:700,color:'#C07030'}}>💪 {fmtHMS(s.workSec)} work</span>}
                      {s.breakSec>0&&<span style={{fontSize:'0.65rem',fontWeight:700,color:'#9A50B0'}}>☕ {fmtHMS(s.breakSec)} break</span>}
                      {s.totalSec>0&&<span style={{fontSize:'0.65rem',fontWeight:700,color:'#607090'}}>⏱ {fmtHMS(s.totalSec)} total</span>}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    );
  }

  // ── COMPLETE MODAL ────────────────────────────────────────────────────────
  function CompleteModal(){
    return(
      <div style={{position:'fixed',inset:0,zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(10,20,10,0.7)',backdropFilter:'blur(4px)'}}>
        <div style={{background:'linear-gradient(145deg,#FEFBDE,#EDF7EE)',border:'2px solid #C0D8A8',borderRadius:20,padding:'28px 28px',maxWidth:420,width:'95%',boxShadow:'0 8px 40px rgba(0,0,0,0.25)',textAlign:'center'}}>
          <div style={{fontSize:'2.5rem',marginBottom:8}}>🏆</div>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:'1.3rem',color:'#1D4100',marginBottom:4}}>Complete this Clean</h2>
          <p style={{fontSize:'0.78rem',color:'#6A7A5A',marginBottom:14,lineHeight:1.5}}>This will save your session to history with time, completion rate, and stopwatch data.</p>
          <div style={{background:'rgba(255,255,255,0.7)',borderRadius:11,padding:'10px 12px',marginBottom:14,textAlign:'left',border:'1px solid #C0D8A8'}}>
            <div style={{fontSize:'0.65rem',fontWeight:800,color:'#4A8C58',marginBottom:2}}>SESSION SUMMARY</div>
            <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
              <span style={{fontSize:'0.72rem',fontWeight:700,color:'#2B3A1A'}}>✅ {pct}% complete ({doneCount}/{total})</span>
              {timerDataRef.current.swWorkSec>0&&<span style={{fontSize:'0.72rem',color:'#C07030',fontWeight:700}}>💪 {fmtHMS(timerDataRef.current.swWorkSec)}</span>}
              {timerDataRef.current.swBreakSec>0&&<span style={{fontSize:'0.72rem',color:'#9A50B0',fontWeight:700}}>☕ {fmtHMS(timerDataRef.current.swBreakSec)}</span>}
            </div>
          </div>
          <textarea value={completeNote} onChange={e=>setCompleteNote(e.target.value)}
            placeholder="Any notes? (optional — how it went, what you skipped, etc.)"
            rows={2} style={{width:'100%',border:'1.5px solid #C0D8A8',borderRadius:9,padding:'8px 10px',fontSize:'0.78rem',resize:'vertical',marginBottom:14,background:'white',color:'#2B3A1A',lineHeight:1.5,outline:'none'}}/>
          <div style={{display:'flex',gap:10}}>
            <button onClick={()=>setShowCompleteModal(false)} style={{flex:1,background:'white',color:'#5A7248',border:'1.5px solid #C0D8A8',borderRadius:11,padding:'9px',fontWeight:800,fontSize:'0.78rem'}}>Cancel</button>
            <button onClick={doCompleteClean} style={{flex:2,background:'linear-gradient(120deg,#4A8C58,#6A58BC)',color:'white',border:'none',borderRadius:11,padding:'9px',fontWeight:900,fontSize:'0.85rem',boxShadow:'0 4px 14px rgba(74,140,88,0.35)'}}>✨ Save & Record</button>
          </div>
        </div>
      </div>
    );
  }

  // ── MAIN APP ──────────────────────────────────────────────────────────────
  if(screen==='landing')return <LandingPage/>;
  if(screen==='stats')return <StatsPage/>;

  const catDone=CAT_PHASES.map(cp=>Object.values(tasks).filter(t=>t.phase===cp.ph&&t.done&&!t.skipped).length);
  const catTotal=CAT_PHASES.map(cp=>Object.values(tasks).filter(t=>t.phase===cp.ph&&!t.skipped).length);
  const nextWaveIdx=OOO_WAVES.findIndex(w=>w.groups.flatMap(g=>g.tids).some(id=>tasks[id]&&!tasks[id].done&&!tasks[id].skipped));
  const stepsDone=OOO_WAVES.filter(w=>w.groups.flatMap(g=>g.tids).every(id=>!tasks[id]||tasks[id].done||tasks[id].skipped)).length;

  return(
    <div style={{background:'#F4EFE0',minHeight:'100vh',fontFamily:"'Nunito',sans-serif",paddingBottom:80}}>
      {showCompleteModal&&<CompleteModal/>}

      {/* Toasts */}
      <div style={{position:'fixed',top:10,right:12,zIndex:900,display:'flex',flexDirection:'column',gap:5,pointerEvents:'none'}}>
        {toasts.map(t=>(<div key={t.id} className="wave-in" style={{background:'white',border:`2px solid ${t.color}`,borderRadius:10,padding:'6px 11px',boxShadow:'0 4px 14px rgba(0,0,0,0.12)',maxWidth:230,pointerEvents:'none'}}><span style={{fontSize:'0.84rem',fontWeight:800,color:'#2B3A1A'}}>{t.msg}</span></div>))}
      </div>

      {/* HEADER */}
      <div style={{background:'linear-gradient(120deg,#EDF7EE,#EEF0FF,#FFF8E8,#F8EDEA)',borderBottom:'2px solid #C0D8A8',padding:'10px 14px 8px',position:'sticky',top:0,zIndex:200,boxShadow:'0 2px 10px rgba(45,70,20,0.08)'}}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:7,flexWrap:'wrap'}}>
          <div>
            <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:'1.25rem',lineHeight:1,background:'linear-gradient(120deg,#1D4100,#6A58BC,#9A6050)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>✨ Weekend Deep Clean</h1>
            <div style={{fontSize:'0.7rem',fontWeight:700,color:'#6A7A5A',marginTop:1,fontStyle:'italic'}}>{heroMsg}</div>
          </div>
          <div style={{flex:1,minWidth:20}}/>
          <div style={{display:'flex',background:'rgba(255,255,255,0.7)',borderRadius:9,padding:3,gap:2,border:'1px solid #C0D8A8'}}>
            {[{id:'room',icon:'🏠',label:'By Room',tip:'View tasks organized by room'},{id:'category',icon:'📊',label:'By Category',tip:'View tasks organized by cleaning phase'},{id:'ooo',icon:'🔮',label:'OOO',tip:'Order of Operations — step-by-step whole-apartment sequence'}].map(v=>(
              <Tip key={v.id} label={v.tip}>
                <button onClick={()=>setViewMode(v.id)} style={{padding:'5px 10px',borderRadius:7,border:'none',fontWeight:800,fontSize:'0.72rem',transition:'all 0.15s',whiteSpace:'nowrap',background:viewMode===v.id?'white':'transparent',color:viewMode===v.id?'#2B3A1A':'#7A8A68',boxShadow:viewMode===v.id?'0 1px 5px rgba(45,70,20,0.13)':'none'}}>
                  {v.icon} {v.label}
                </button>
              </Tip>
            ))}
          </div>
          {[[pct+'%','Complete','#4A8C58','Overall completion percentage'],[doneCount,'Done','#6A58BC','Tasks completed this session'],[total-doneCount,'Left','#9A6050','Remaining active tasks']].map(([v,l,c,tip])=>(
            <Tip key={l} label={tip}>
              <div style={{background:'rgba(255,255,255,0.8)',border:`1.5px solid ${c}33`,borderRadius:9,padding:'3px 9px',textAlign:'center',minWidth:50,cursor:'default'}}>
                <div style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:'1rem',color:c,lineHeight:1}}>{v}</div>
                <div style={{fontSize:'0.58rem',fontWeight:800,color:'#8A9870',textTransform:'uppercase',letterSpacing:'0.05em'}}>{l}</div>
              </div>
            </Tip>
          ))}
          <Tip label="Record this clean session to your history">
            <button onClick={()=>setShowCompleteModal(true)} style={{background:'linear-gradient(120deg,#4A8C58,#6A58BC)',color:'white',border:'none',borderRadius:8,padding:'5px 10px',fontWeight:800,fontSize:'0.68rem',boxShadow:'0 2px 8px rgba(74,140,88,0.3)'}}>🏆 Complete</button>
          </Tip>
          <Tip label="Export current session as JSON file">
            <button onClick={doExport} style={{background:'rgba(255,255,255,0.7)',border:'1.5px solid #C0D8A8',borderRadius:8,padding:'5px 8px',fontWeight:800,fontSize:'0.68rem',color:'#5A7248'}}>📤</button>
          </Tip>
          <Tip label="View past clean history and stats">
            <button onClick={()=>setScreen('stats')} style={{background:'rgba(255,255,255,0.7)',border:'1.5px solid #C0D8A8',borderRadius:8,padding:'5px 8px',fontWeight:800,fontSize:'0.68rem',color:'#5A7248'}}>📊</button>
          </Tip>
          <Tip label="Configure rooms and task pools in Customize">
            <a href="customize.html#dc-setup" style={{background:'rgba(255,255,255,0.7)',border:'1.5px solid #C8C0D8',borderRadius:8,padding:'5px 8px',fontWeight:800,fontSize:'0.68rem',color:'#6A58BC',textDecoration:'none',display:'inline-flex',alignItems:'center'}}>⚙️</a>
          </Tip>
          <Tip label="Go back to task review / landing page">
            <button onClick={()=>setScreen('landing')} style={{background:'rgba(255,255,255,0.7)',border:'1.5px solid #C0D8A8',borderRadius:8,padding:'5px 8px',fontWeight:800,fontSize:'0.68rem',color:'#5A7248'}}>⬅</button>
          </Tip>
          <Tip label="Reset ALL progress and return to start — cannot be undone">
            <button onClick={doReset} style={{background:'rgba(255,255,255,0.7)',border:'1.5px solid #F0B0A0',borderRadius:8,padding:'5px 10px',fontWeight:800,fontSize:'0.7rem',color:'#9A5040'}} onMouseOver={e=>e.currentTarget.style.background='#FFF0EE'} onMouseOut={e=>e.currentTarget.style.background='rgba(255,255,255,0.7)'}>↺ Reset</button>
          </Tip>
        </div>
        <div style={{height:8,background:'rgba(255,255,255,0.55)',borderRadius:16,overflow:'hidden',border:'1px solid #C0D8A8',marginBottom:6}}>
          <div className="sparkle-bar" style={{height:'100%',width:pct+'%',borderRadius:16,transition:'width 0.6s cubic-bezier(0.34,1.56,0.64,1)'}}/>
        </div>
        {viewMode==='category'&&(
          <div style={{display:'flex',gap:7,alignItems:'center',flexWrap:'wrap'}}>
            {CAT_PHASES.map((cp,i)=>(
              <Tip key={cp.ph} label={`${cp.label}: ${catDone[i]}/${catTotal[i]} done`}>
                <div style={{display:'flex',alignItems:'center',gap:3,cursor:'default'}}>
                  <span style={{fontSize:'0.72rem'}}>{cp.icon}</span>
                  <div style={{height:5,width:34,background:'rgba(255,255,255,0.5)',borderRadius:5,overflow:'hidden',border:`1px solid ${cp.bd}`}}>
                    <div className="sparkle-bar" style={{height:'100%',width:catTotal[i]?catDone[i]/catTotal[i]*100+'%':'0%',borderRadius:5}}/>
                  </div>
                  <span style={{fontSize:'0.62rem',fontWeight:800,color:cp.color}}>{catDone[i]}/{catTotal[i]}</span>
                </div>
              </Tip>
            ))}
          </div>
        )}
        {viewMode==='ooo'&&(
          <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
            <span style={{fontSize:'0.7rem',fontWeight:800,color:'#6A7A5A'}}>🔮 {nextWaveIdx>=0?`Step ${OOO_WAVES[nextWaveIdx].step} next: ${OOO_WAVES[nextWaveIdx].label}`:'All steps complete! ✨'}</span>
            <span style={{marginLeft:'auto',fontSize:'0.62rem',color:'#8A9870',fontWeight:700}}>{stepsDone}/{OOO_WAVES.length} done</span>
          </div>
        )}
      </div>

      {viewMode==='room'&&(<div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,padding:'12px 13px',alignItems:'start'}}>{cols.map((colRooms,ci)=>(<div key={ci}>{colRooms.map(rid=><RoomCard key={rid} rid={rid} ci={ci}/>)}</div>))}</div>)}
      {viewMode==='category'&&<CategoryView/>}
      {viewMode==='ooo'&&<OOOView/>}

      {/* FLOATING PANELS */}
      <div style={{position:'fixed',bottom:12,right:12,zIndex:400,display:'flex',flexDirection:'column',gap:7,alignItems:'flex-end'}}>
        {floatVisible&&(
          <div style={{display:'flex',gap:7,alignItems:'flex-end',flexWrap:'wrap',justifyContent:'flex-end'}}>
            <StopwatchPanel dataRef={timerDataRef} onToast={addToast}/>
            <TimerPanel isBreak={false} onToast={addToast}/>
            <TimerPanel isBreak={true} onToast={addToast}/>
          </div>
        )}
        <Tip label={floatVisible?'Hide timers and stopwatch':'Show timers and stopwatch'}>
          <button onClick={()=>setFloatVisible(v=>!v)} style={{background:'rgba(255,255,255,0.85)',border:'1.5px solid #C0D8A8',borderRadius:16,padding:'3px 10px',fontSize:'0.62rem',fontWeight:800,color:'#5A7248',boxShadow:'0 2px 7px rgba(45,70,20,0.1)'}}>
            {floatVisible?'▾ hide':'▴ timers'}
          </button>
        </Tip>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));

/* ── localStorage migration: old keys → audhd-hq-* ── */
(function migrateLS(){
  [['deepclean_v7',HQKeys.DEEPCLEAN],
   ['deepclean_v6',HQKeys.DEEPCLEAN],
   ['deepclean_stats_v1',HQKeys.DEEPCLEAN_STATS]].forEach(([o,n])=>{
    try{
      const old=HQSafe.store.get(o);
      if(old&&!HQSafe.store.get(n)) HQSafe.store.set(n,old);
      HQSafe.store.remove(o);
    }catch(e){}
  });
})();

// Theme, nav, clock: delegated to hq-core.js

// DEAD CODE REMOVED: SW registration was unreachable here (file not loaded by HTML).
// SW registration is handled by core/hq-deploy-gate.js on every page.