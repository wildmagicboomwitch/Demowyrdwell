
// ── PHASE 6B KITCHEN STORAGE ────────────────────────────────
const KITCHEN_SETUP_KEY = HQKeys.KITCHEN_SETUP;

function loadKitchenSetup(){
  try{
    const existing = HQSafe.store.get(KITCHEN_SETUP_KEY, {});
    const merged = {
      receiptVault: existing.receiptVault || [],
      pantryZones: existing.pantryZones || ['Fridge','Freezer','Pantry'],
      grocerySources: existing.grocerySources || []
    };
    HQSafe.store.set(KITCHEN_SETUP_KEY, merged);
    return merged;
  }catch(e){
    return {
      receiptVault:[],
      pantryZones:['Fridge','Freezer','Pantry'],
      grocerySources:[]
    };
  }
}
window.KITCHEN_SETUP = loadKitchenSetup();

'use strict';
// ── THEME — delegated to hq-core.js ───────────────────────────────────────────
// hq-core handles: data-theme attr, hero opacity, themeLabel, themeBadge,
//                  greetingWord, greetingEmoji, [data-t] active states.
// Kitchen-specific: dayLabel suffix + [data-theme] pill sync.
const KBQ_DAY_LABELS = {
  morning:   'Kitchen',
  afternoon: 'Afternoon',
  evening:   'Evening',
  night:     'Night Kitchen'
};
function kitchen_applyTheme(theme) {
  // Update dayLabel with real day-of-week + kitchen suffix
  const dayEl = document.getElementById('dayLabel');
  if (dayEl) {
    const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    dayEl.textContent = dayName + ' ' + (KBQ_DAY_LABELS[theme] || 'Kitchen');
  }
  // Sync [data-theme] pills (kitchen uses data-theme AND data-t on same buttons)
  document.querySelectorAll('[data-theme]').forEach(p => {
    p.classList.toggle('active', p.dataset.theme === theme);
  });
}
// Listen for hq-core theme changes
// FIX-05: AbortController for module-scope window listeners
const _kbAC = new AbortController();
const _kbSig = { signal: _kbAC.signal };
window.addEventListener('hq-theme-change', e => kitchen_applyTheme(e.detail.theme), _kbSig);
// openSidenav/closeSidenav: use hqOpenSidenav/hqCloseSidenav from hq-core.js
// updateClock: delegated to hq-core.js
// ── LAYOUT ENGINE ─────────────────────────────────────────────────────────────
const PANEL_IDS=['cook','vibe','plan','shop','nutri','inv','subs','conv','waste','fridge','setup'];
let activePanel='cook';

function isTV(){return window.innerWidth>=900;}

function mountPanel(){
  const panel=document.getElementById('panel-'+activePanel);
  if(!panel)return;
  PANEL_IDS.forEach(id=>{const p=document.getElementById('panel-'+id);if(p)p.classList.remove('visible');});
  panel.classList.add('visible');
  if(isTV()){
    const col=document.getElementById('tvPanelCol');
    col.innerHTML='';col.appendChild(panel);
  }else{
    const wrap=document.getElementById('mobileWrap');
    wrap.innerHTML='';wrap.appendChild(panel);
  }
  // trigger renders for active panel
  if(activePanel==='shop')updateShop();
  if(activePanel==='nutri'){renderNutriChart();renderNutriLog();}
  if(activePanel==='waste')renderWasteChart();
  if(activePanel==='plan')renderPlan();
  if(activePanel==='fridge')fr_render();
  if(activePanel==='setup'){kbSetupLoad();kbRenderSetup();}
}

function showPanel(id,btn){
  document.querySelectorAll('.tool-btn').forEach(b=>b.classList.remove('active'));
  if(btn)btn.classList.add('active');
  activePanel=id;
  mountPanel();
}
function tvNav(el,id){
  document.querySelectorAll('.tv-nav-item').forEach(b=>b.classList.remove('active'));
  el.classList.add('active');
  document.querySelectorAll('.tool-btn').forEach(b=>{
    b.classList.remove('active');
    if((b.getAttribute('onclick')||'').includes("'"+id+"',"))b.classList.add('active');
  });
  activePanel=id;mountPanel();
}
function activateNav(navEl,id){
  document.querySelectorAll('.navbtn').forEach(b=>b.classList.remove('active'));
  navEl.classList.add('active');
  document.querySelectorAll('.tool-btn').forEach(b=>{
    b.classList.remove('active');
    if((b.getAttribute('onclick')||'').includes("'"+id+"',"))b.classList.add('active');
  });
  activePanel=id;mountPanel();
}

// ── MORE TRAY (mobile overflow nav) ──────────────────────────────────────────
function toggleMoreTray(btn) {
  const tray = document.getElementById('moreTray');
  if (!tray) return;
  const isOpen = tray.classList.toggle('open');
  document.querySelectorAll('.navbtn').forEach(b => b.classList.remove('active'));
  if (isOpen) btn.classList.add('active');
}

function activateNavMore(id) {
  const tray = document.getElementById('moreTray');
  if (tray) tray.classList.remove('open');
  // deactivate all nav buttons
  document.querySelectorAll('.navbtn').forEach(b => b.classList.remove('active'));
  // activate the matching tool-btn in the grid
  document.querySelectorAll('.tool-btn').forEach(b => {
    b.classList.remove('active');
    if ((b.getAttribute('onclick') || '').includes("'"+id+"'")) b.classList.add('active');
  });
  activePanel = id;
  mountPanel();
}

// ── DATA ──────────────────────────────────────────────────────────────────────
const KEY=HQKeys.KITCHEN;
// migrate old keys once (FIXED: never removeItem the canonical key)
(function(){
  if(localStorage.getItem(HQKeys.KITCHEN_MIGRATED_V1)) return;
  const old=HQSafe.store.get('hq-kitchen-data');
  if(old&&!HQSafe.store.get(HQKeys.KITCHEN)){HQSafe.store.set(HQKeys.KITCHEN,old);}
  HQSafe.store.remove('hq-kitchen-data');
  HQSafe.store.set(HQKeys.KITCHEN_MIGRATED_V1,'1');
})();
let editingId=null,editingPlanDay=null;
const defaultState={
  inv:[
    // 🥩 Proteins & Dairy
    {id:1,n:'Chicken Thighs',q:'5.5 lbs',cat:'p',loc:'freezer',p:26,c:250,fav:false},
    {id:2,n:'Ground Beef',q:'3 x 1 lb',cat:'p',loc:'freezer',p:24,c:250,fav:false},
    {id:4,n:'Bacon — Fully Cooked Sliced',q:'In Stock',cat:'p',loc:'fridge',p:10,c:150,fav:false},
    {id:6,n:'Tuna',q:'1 can',cat:'p',loc:'pantry',p:20,c:100,fav:false},
    {id:7,n:'Eggs',q:'2 cartons',cat:'p',loc:'fridge',p:6,c:70,fav:false},
    {id:8,n:'Fresh Mozzarella',q:'In Stock',cat:'p',loc:'fridge',p:7,c:90,fav:false},
    {id:9,n:'Shredded Mozzarella',q:'In Stock',cat:'p',loc:'fridge',p:7,c:80,fav:false},
    {id:10,n:'Shredded Sharp Cheddar',q:'In Stock',cat:'p',loc:'fridge',p:7,c:110,fav:false},
    {id:11,n:'Philadelphia Cream Cheese',q:'In Stock',cat:'p',loc:'fridge',p:2,c:100,fav:false},
    {id:12,n:'Ghee (4th & Heart)',q:'In Stock',cat:'p',loc:'pantry',p:0,c:130,fav:false},
    {id:13,n:'Roasted Garlic Herb Butter (Epicurean)',q:'In Stock',cat:'p',loc:'fridge',p:0,c:100,fav:false},
    // 🌾 Dry Goods, Grains & Pantry
    {id:20,n:'Long Grain White Rice',q:'Bulk',cat:'d',loc:'pantry',p:4,c:200,fav:false},
    {id:21,n:'Rice Noodles (Bánh Phở)',q:'In Stock',cat:'d',loc:'pantry',p:3,c:190,fav:false},
    {id:22,n:'Tri-Color Quinoa',q:'In Stock',cat:'d',loc:'pantry',p:8,c:220,fav:false},
    {id:23,n:'Chia Seeds',q:'In Stock',cat:'d',loc:'pantry',p:5,c:140,fav:false},
    {id:24,n:'Dry Lentils',q:'In Stock',cat:'d',loc:'pantry',p:9,c:180,fav:false},
    {id:25,n:'GF Panko Crumbs (4C)',q:'In Stock',cat:'d',loc:'pantry',p:2,c:110,fav:false},
    {id:26,n:'Idahoan Roasted Garlic Mashed Potatoes',q:'In Stock',cat:'d',loc:'pantry',p:3,c:150,fav:false},
    {id:27,n:'Mediterranean Herb Tomato Cheddar Cheesy Potatoes',q:'In Stock',cat:'d',loc:'pantry',p:3,c:160,fav:false},
    {id:28,n:'Lipton Noodle Soup',q:'In Stock',cat:'d',loc:'pantry',p:3,c:60,fav:false},
    {id:29,n:'Onion Recipe Soup & Dip Mix (Great Value)',q:'In Stock',cat:'d',loc:'pantry',p:1,c:25,fav:false},
    {id:30,n:'Lipton Cup-a-Soup',q:'In Stock',cat:'d',loc:'pantry',p:2,c:45,fav:false},
    {id:31,n:'Crackers (round)',q:'In Stock',cat:'d',loc:'pantry',p:2,c:130,fav:false},
    // 🥫 Canned & Jarred Goods
    {id:40,n:'Artichoke Hearts',q:'In Stock',cat:'c',loc:'pantry',p:2,c:25,fav:false},
    {id:41,n:'Bean Sprouts (La Choy)',q:'In Stock',cat:'c',loc:'pantry',p:1,c:10,fav:false},
    {id:42,n:'Bruschetta — Artichoke',q:'In Stock',cat:'c',loc:'pantry',p:1,c:40,fav:false},
    {id:43,n:'Bruschetta — Red Pepper',q:'In Stock',cat:'c',loc:'pantry',p:1,c:40,fav:false},
    {id:44,n:'Bruschetta — Tomato (DeLallo)',q:'In Stock',cat:'c',loc:'pantry',p:1,c:40,fav:false},
    {id:45,n:'Cream of Chicken Soup (GF)',q:'In Stock',cat:'c',loc:'pantry',p:3,c:100,fav:false},
    {id:46,n:'Crushed Tomatoes',q:'In Stock',cat:'c',loc:'pantry',p:2,c:30,fav:false},
    {id:47,n:'Diced Fire Roasted Tomatoes',q:'In Stock',cat:'c',loc:'pantry',p:2,c:30,fav:false},
    {id:48,n:'Tomato Paste (Cento, tube)',q:'In Stock',cat:'c',loc:'fridge',p:2,c:30,fav:false},
    {id:49,n:'Prego Chunky Garden Combo',q:'In Stock',cat:'c',loc:'pantry',p:3,c:80,fav:false},
    {id:50,n:'Salsa Verde (Herdez)',q:'In Stock',cat:'c',loc:'pantry',p:1,c:10,fav:false},
    {id:51,n:'Canned Sliced White Potatoes',q:'In Stock',cat:'c',loc:'pantry',p:2,c:60,fav:false},
    {id:52,n:'Whole Kernel Corn',q:'In Stock',cat:'c',loc:'pantry',p:3,c:70,fav:false},
    {id:53,n:'Sweet Peas',q:'In Stock',cat:'c',loc:'pantry',p:4,c:60,fav:false},
    {id:54,n:'Green Beans (Cut)',q:'In Stock',cat:'c',loc:'pantry',p:2,c:25,fav:false},
    {id:55,n:'Pinto Beans (Goya)',q:'In Stock',cat:'c',loc:'pantry',p:8,c:120,fav:false},
    {id:56,n:'Pumpkin — Pure (Libby\'s)',q:'In Stock',cat:'c',loc:'pantry',p:1,c:50,fav:false},
    {id:57,n:'Sweetened Condensed Milk (Eagle Brand)',q:'In Stock',cat:'c',loc:'pantry',p:8,c:330,fav:false},
    {id:58,n:'Jellied Cranberry Sauce (Ocean Spray)',q:'In Stock',cat:'c',loc:'pantry',p:0,c:105,fav:false},
    {id:59,n:'Minced Garlic in Water (jarred)',q:'In Stock',cat:'c',loc:'fridge',p:1,c:10,fav:false},
    {id:60,n:'Hamburger Dill Chips (pickles)',q:'In Stock',cat:'c',loc:'fridge',p:0,c:5,fav:false},
    // 🫙 Condiments, Sauces & Oils
    {id:70,n:'Spicy Chili Crisp',q:'In Stock',cat:'co',loc:'pantry',p:0,c:80,fav:false},
    {id:71,n:'Honey (pure clover)',q:'In Stock',cat:'co',loc:'pantry',p:0,c:60,fav:false},
    {id:72,n:'Kinder\'s Gold BBQ Sauce',q:'In Stock',cat:'co',loc:'fridge',p:0,c:50,fav:false},
    {id:73,n:'Kraft Zesty Italian Dressing',q:'In Stock',cat:'co',loc:'fridge',p:0,c:60,fav:false},
    {id:74,n:'Hellmann\'s Mayonnaise',q:'In Stock',cat:'co',loc:'fridge',p:0,c:90,fav:false},
    {id:75,n:'Tomato Ketchup',q:'In Stock',cat:'co',loc:'fridge',p:0,c:15,fav:false},
    {id:76,n:'Worcestershire Sauce',q:'In Stock',cat:'co',loc:'pantry',p:0,c:15,fav:false},
    {id:77,n:'Soy Sauce',q:'In Stock',cat:'co',loc:'pantry',p:1,c:10,fav:false},
    {id:78,n:'Thai Green Curry Paste',q:'In Stock',cat:'co',loc:'fridge',p:1,c:30,fav:false},
    {id:79,n:'Thai Red Curry Paste',q:'In Stock',cat:'co',loc:'fridge',p:1,c:30,fav:false},
    {id:80,n:'Thai Stir Fry Sauce',q:'In Stock',cat:'co',loc:'fridge',p:1,c:35,fav:false},
    {id:81,n:'Toasted Sesame Oil (Oi!)',q:'In Stock',cat:'co',loc:'pantry',p:0,c:120,fav:false},
    {id:82,n:'Extra Virgin Sesame Oil (Oi!)',q:'In Stock',cat:'co',loc:'pantry',p:0,c:120,fav:false},
    {id:83,n:'Rice Vinegar (Nakano)',q:'In Stock',cat:'co',loc:'pantry',p:0,c:5,fav:false},
    {id:84,n:'White Wine Vinegar (Colavita)',q:'In Stock',cat:'co',loc:'pantry',p:0,c:5,fav:false},
    {id:85,n:'Canola Oil',q:'In Stock',cat:'co',loc:'pantry',p:0,c:120,fav:false},
    {id:86,n:'Dijon Mustard',q:'In Stock',cat:'co',loc:'fridge',p:0,c:10,fav:false},
    // 🌶 Spices & Seasonings
    {id:90,n:'Sea Salt (fine)',q:'In Stock',cat:'sp',loc:'pantry',p:0,c:0,fav:false},
    {id:91,n:'Ground Black Pepper',q:'In Stock',cat:'sp',loc:'pantry',p:0,c:0,fav:false},
    {id:92,n:'Paprika',q:'In Stock',cat:'sp',loc:'pantry',p:0,c:6,fav:false},
    {id:93,n:'Ground Cumin',q:'In Stock',cat:'sp',loc:'pantry',p:0,c:8,fav:false},
    {id:94,n:'Ground Cinnamon',q:'In Stock',cat:'sp',loc:'pantry',p:0,c:6,fav:false},
    {id:95,n:'Ground Nutmeg',q:'In Stock',cat:'sp',loc:'pantry',p:0,c:6,fav:false},
    {id:96,n:'Pumpkin Pie Spice',q:'In Stock',cat:'sp',loc:'pantry',p:0,c:6,fav:false},
    {id:97,n:'Everything Bagel Seasoning',q:'In Stock',cat:'sp',loc:'pantry',p:0,c:5,fav:false},
    {id:98,n:'Thai Hot Chili Flakes',q:'In Stock',cat:'sp',loc:'pantry',p:0,c:5,fav:false},
    // 🧂 Pastes, Broths & Bases
    {id:100,n:'Better Than Bouillon — Chicken',q:'In Stock',cat:'br',loc:'fridge',p:1,c:15,fav:false},
    {id:102,n:'Better Than Bouillon — Beef',q:'In Stock',cat:'br',loc:'fridge',p:1,c:15,fav:false},
    {id:103,n:'Chicken Broth (Thrive Market, organic)',q:'In Stock',cat:'br',loc:'pantry',p:1,c:10,fav:false},
    {id:104,n:'Ginger Paste',q:'In Stock',cat:'br',loc:'fridge',p:0,c:5,fav:false},
    {id:105,n:'Garlic — Fresh',q:'In Stock',cat:'br',loc:'pantry',p:0,c:5,fav:false},
    // 🍰 Baking & Sweets
    {id:110,n:'Bisquick (GF)',q:'In Stock',cat:'bk',loc:'pantry',p:3,c:150,fav:false},
    {id:111,n:'Coconut Flour',q:'In Stock',cat:'bk',loc:'pantry',p:4,c:120,fav:false},
    {id:112,n:'Unsweetened Coconut Flakes',q:'In Stock',cat:'bk',loc:'pantry',p:2,c:90,fav:false},
    {id:113,n:'Sweetened Shredded Coconut',q:'In Stock',cat:'bk',loc:'pantry',p:1,c:100,fav:false},
    {id:114,n:'Light Brown Sugar',q:'In Stock',cat:'bk',loc:'pantry',p:0,c:45,fav:false},
    {id:115,n:'Cocoa Powder',q:'In Stock',cat:'bk',loc:'pantry',p:2,c:20,fav:false},
    {id:116,n:'Jello Pudding Mix',q:'In Stock',cat:'bk',loc:'pantry',p:1,c:90,fav:false},
    {id:117,n:'Vanilla Extract',q:'In Stock',cat:'bk',loc:'pantry',p:0,c:12,fav:false},
    {id:118,n:'Caramel Sauce',q:'In Stock',cat:'bk',loc:'pantry',p:1,c:110,fav:false},
    {id:119,n:'Sprinkles',q:'In Stock',cat:'bk',loc:'pantry',p:0,c:20,fav:false},
    // 🥦 Produce
    {id:120,n:'Red Bell Peppers',q:'In Stock',cat:'pr',loc:'fridge',p:1,c:25,fav:false},
    {id:121,n:'Classic Coleslaw Mix',q:'In Stock',cat:'pr',loc:'fridge',p:1,c:20,fav:false},
    {id:122,n:'Lemon',q:'In Stock',cat:'pr',loc:'fridge',p:0,c:15,fav:false},
    {id:123,n:'Zucchini',q:'In Stock',cat:'pr',loc:'fridge',p:1,c:17,fav:false},
  ],
  recipes:[{id:101,n:'Beef Bowls',p:24,c:250,serv:2,tag:'🥩 Protein',fav:false,i:['1 lb Ground Beef','1 cup Rice'],st:['Cook beef until browned, season to taste.','Serve over steamed rice.']}],
  nutri:[],waste:[],meal:Date.now(),plan:Array(7).fill(''),customShop:[]
};
let state=JSON.parse(JSON.stringify(defaultState));
function save(){
  HQSafe.store.set(KEY, state);
  // notify sync system
  if(typeof _khqSyncDirty === 'function') _khqSyncDirty();
}
async function confirmReset(){
  if(!(await HQConfirm.ask('Reset ALL Kitchen HQ data? This cannot be undone.', {danger:true})))return;
  HQSafe.store.remove(KEY);state=JSON.parse(JSON.stringify(defaultState));
  save();render();HQToast.success('Data reset.');
}

// ── INIT ──────────────────────────────────────────────────────────────────────
function init(){
  state = HQSafe.store.get(KEY, {});
  if(!Array.isArray(state.plan)||state.plan.length!==7)state.plan=Array(7).fill('');
  if(!state.customShop)state.customShop=[];
  // Theme is handled by hq-core.js (DOMContentLoaded → hqInitTheme).
  // Seed dayLabel immediately with whatever data-theme is already on <html>.
  const _initTheme = document.documentElement.getAttribute('data-theme') || 'lilac';
  kitchen_applyTheme(_initTheme);
  if(!window._kbTickInterval){window._kbTickInterval=setInterval(tick,1000);}
  updateClock();if(!window._kbClockInterval){window._kbClockInterval=setInterval(updateClock,10000);}
  window.addEventListener('resize',mountPanel,_kbSig);
  // Close more tray on resize to desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 900) {
      const tray = document.getElementById('moreTray');
      if (tray) tray.classList.remove('open');
    }
  }, _kbSig);
  mountPanel();render();
  fr_init();
}

function tick(){
  const hrs=(Date.now()-state.meal)/3600000,pct=Math.max(0,100-hrs*12.5);
  const fill=document.getElementById('fuel-fill');
  fill.style.width=pct+'%';
  fill.style.background=`linear-gradient(90deg,${pct>60?'var(--accent-green)':pct>30?'var(--accent-gold)':'var(--accent-pink)'},var(--accent-teal))`;
  document.getElementById('fuel-txt').innerText=hrs.toFixed(1)+'h since fuel';
}

// ── FILTERS ───────────────────────────────────────────────────────────────────
let cookFilter='all',invFilter='all';
function setCookFilter(v,el){cookFilter=v;document.querySelectorAll('.fav-filter-btn[id^="cook-"]').forEach(b=>b.classList.remove('active'));el.classList.add('active');render();}
function setInvFilter(v,el){invFilter=v;document.querySelectorAll('.fav-filter-btn[id^="inv-"]').forEach(b=>b.classList.remove('active'));el.classList.add('active');render();}

// ── FAVORITES ─────────────────────────────────────────────────────────────────
function toggleFavRecipe(id){const r=state.recipes.find(x=>x.id===id);if(r){r.fav=!r.fav;save();render();}}
function toggleFavInv(id){const i=state.inv.find(x=>x.id===id);if(i){i.fav=!i.fav;save();render();}}

// ── WASTE ─────────────────────────────────────────────────────────────────────
function logWaste(){
  const v=parseFloat(document.getElementById('w-val').value);
  if(!v||isNaN(v)||v<=0){HQToast.warn('Enter a valid dollar amount.');return;}
  state.waste.push({v,note:document.getElementById('w-note').value.trim(),t:Date.now()});
  document.getElementById('w-val').value='';document.getElementById('w-note').value='';
  save();renderWasteChart();
}
function deleteWaste(idx){state.waste.splice(idx,1);save();renderWasteChart();}

// ── MACROS ────────────────────────────────────────────────────────────────────
function logMacro(p,c){
  state.nutri.push({p,c,t:Date.now(),src:'recipe'});state.meal=Date.now();
  save();renderNutriChart();renderNutriLog();
  document.getElementById('fuel-fill').style.width='100%';
}
function quickLogMacro(){
  const p=parseInt(document.getElementById('q-p').value)||0,c=parseInt(document.getElementById('q-c').value)||0;
  if(!p&&!c){HQToast.warn('Enter protein or calories.');return;}
  state.nutri.push({p,c,t:Date.now(),src:'manual'});state.meal=Date.now();
  document.getElementById('q-p').value='';document.getElementById('q-c').value='';
  save();renderNutriChart();renderNutriLog();
  document.getElementById('fuel-fill').style.width='100%';
}
function deleteMacro(idx){state.nutri.splice(idx,1);save();renderNutriChart();renderNutriLog();}

// ── CONVERSION ────────────────────────────────────────────────────────────────
const TB={lb:453.592,kg:1000,oz:28.3495,g:1,cup:236.588,ml:1,tsp:4.92892,tbsp:14.7868};
function doConv(){
  const v=parseFloat(document.getElementById('c-val').value),from=document.getElementById('c-from').value,to=document.getElementById('c-to').value;
  const el=document.getElementById('c-out');
  if(!v||isNaN(v)){el.innerText='---';return;}
  const r=(v*TB[from])/TB[to];el.innerText=`${v} ${from} = ${r%1===0?r:r.toFixed(3)} ${to}`;
}

// ── SUBS ──────────────────────────────────────────────────────────────────────
const SUBS={egg:['¼ cup Applesauce','¼ cup Mashed Banana','3 tbsp Aquafaba'],milk:['Water + 1 tbsp Butter','Almond Milk','Oat Milk'],butter:['Coconut Oil','Olive Oil (⅞ ratio)','Applesauce (baking)'],flour:['Almond Flour (1:1)','Oat Flour (1:1)','Cornstarch (½ ratio)'],sugar:['Honey (¾ ratio)','Maple Syrup (¾ ratio)','Stevia (per pkg)'],breadcrumbs:['Crushed crackers','Rolled oats','Panko'],cream:['Evaporated milk','Half & half','Coconut cream'],yogurt:['Sour cream','Buttermilk','Silken tofu blended'],vinegar:['Lemon juice','Lime juice','White wine'],soy:['Coconut aminos','Tamari','Worcestershire'],rice:['Quinoa','Cauliflower rice','Couscous'],beef:['Ground turkey','Ground chicken','Lentils'],oil:['Applesauce (baking)','Greek yogurt','Mashed avocado'],chocolate:['Carob powder','Cocoa + 1 tbsp oil','Cacao nibs']};
function doSub(){
  const v=document.getElementById('sub-in').value.toLowerCase().trim();
  const key=Object.keys(SUBS).find(k=>v.includes(k));
  const el=document.getElementById('sub-out');
  if(!key){
    el.innerHTML='';
    const sp=document.createElement('span');
    sp.style.color='var(--text-muted)';
    sp.textContent='No match — try: '+Object.keys(SUBS).join(', ');
    el.appendChild(sp);
    return;
  }
  // C10-ext: DOM construction — SUBS values are hardcoded but keep consistent
  el.innerHTML='';
  const hdr=document.createElement('b');
  hdr.style.color='var(--accent-teal)';
  hdr.textContent=key.toUpperCase()+' →';
  el.appendChild(hdr);
  SUBS[key].forEach((s,i)=>{
    el.appendChild(document.createElement('br'));
    const num=document.createElement('span');
    num.style.color='var(--accent-gold)';
    num.textContent=(i+1)+'. ';
    el.appendChild(num);
    el.appendChild(document.createTextNode(s));
  });
}

// ── RECIPE CRUD ───────────────────────────────────────────────────────────────
function openRecipeModal(){
  editingId=null;
  ['r-n','r-i','r-st','r-p','r-c','r-s'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('r-tag').value='';
  HQModal.open('r-modal'); // H-06
  setTimeout(()=>document.getElementById('r-n').focus(),50);
}
function editRecipe(id){
  const r=state.recipes.find(x=>x.id===id);if(!r)return;
  editingId=id;
  document.getElementById('r-n').value=r.n;document.getElementById('r-p').value=r.p;document.getElementById('r-c').value=r.c;
  document.getElementById('r-s').value=r.serv||1;document.getElementById('r-tag').value=r.tag||'';
  document.getElementById('r-i').value=r.i.join('\n');document.getElementById('r-st').value=(r.st||[]).join('\n');
  HQModal.open('r-modal'); // H-06
}
function saveRecipe(){
  const n=document.getElementById('r-n').value.trim();if(!n){HQToast.warn('Recipe needs a name.');return;}
  const r={id:editingId||Date.now(),n,p:parseInt(document.getElementById('r-p').value)||0,c:parseInt(document.getElementById('r-c').value)||0,serv:parseFloat(document.getElementById('r-s').value)||1,tag:document.getElementById('r-tag').value,i:document.getElementById('r-i').value.split('\n').filter(x=>x.trim()),st:document.getElementById('r-st').value.split('\n').filter(x=>x.trim()),fav:editingId?(state.recipes.find(x=>x.id===editingId)?.fav||false):false};
  if(editingId){const i=state.recipes.findIndex(x=>x.id===editingId);if(i!==-1)state.recipes[i]=r;}else state.recipes.push(r);
  save();closeRecipeModal();render();
}
async function deleteRecipe(id){if(!(await HQConfirm.ask('Delete this recipe?', {danger:true})))return;state.recipes=state.recipes.filter(x=>x.id!==id);save();render();}
function closeRecipeModal(){HQModal.close('r-modal');} // H-06
function scaleRecipe(el,id){
  const r=state.recipes.find(x=>x.id===id);if(!r)return;
  const ratio=(parseFloat(el.value)||1)/(r.serv||1);
  document.getElementById('ing-'+id).innerHTML=r.i.map(ing=>{
    const scaled=ing.replace(/(\d*\.?\d+)/g,m=>{const n=parseFloat(m)*ratio;return n%1===0?n:n.toFixed(1);});
    return '<div>• '+fr_escHtml(scaled)+'</div>';
  }).join('');
}

// ── INVENTORY CRUD ────────────────────────────────────────────────────────────
function openInvModal(){
  ['i-n','i-q','i-p','i-c'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('i-cat').value='p';document.getElementById('i-loc').value='pantry';HQModal.open('inv-modal'); // H-06
  setTimeout(()=>document.getElementById('i-n').focus(),50);
}
function saveInvItem(){
  const n=document.getElementById('i-n').value.trim();if(!n){HQToast.warn('Item needs a name.');return;}
  state.inv.push({id:Date.now(),n,q:document.getElementById('i-q').value.trim()||'—',cat:document.getElementById('i-cat').value,loc:document.getElementById('i-loc').value||'pantry',p:parseInt(document.getElementById('i-p').value)||0,c:parseInt(document.getElementById('i-c').value)||0});
  save();closeInvModal();render();
}
function cycleLocInv(id){const i=state.inv.find(x=>x.id===id);if(!i)return;const order=['pantry','fridge','freezer'];const cur=order.indexOf(i.loc||'pantry');i.loc=order[(cur+1)%3];save();render();}
function deleteInvItem(id){state.inv=state.inv.filter(x=>x.id!==id);save();render();}
function closeInvModal(){HQModal.close('inv-modal');} // H-06

// ── VIBE ──────────────────────────────────────────────────────────────────────
function generateVibe(){
  const favR=state.recipes.filter(r=>r.fav),allR=state.recipes;
  const allP=state.inv.filter(x=>x.cat==='p');
  // FIX: cat 's' never existed — use dry goods ('d') + produce ('pr') as the starch/veg pool
  const allS=state.inv.filter(x=>x.cat==='d'||x.cat==='pr'||x.cat==='c');
  const favP=allP.filter(x=>x.fav),favS=allS.filter(x=>x.fav);
  const out=document.getElementById('v-out');
  const rPool=(favR.length&&Math.random()<0.7)?favR:allR;
  const isFav=rPool===favR&&favR.length>0;
  if(rPool.length&&Math.random()>0.4){
    const r=rPool[Math.floor(Math.random()*rPool.length)];
    out.innerHTML=`<b style="color:${isFav?'var(--accent-gold)':'var(--accent-teal)'}">${isFav?'⭐ FAV SPIN:':'RECIPE SPIN:'}</b><br>${fr_escHtml(r.n)}<br><small style="color:var(--text-muted)">${r.p}g pro · ${r.c} cal${r.tag?' · '+fr_escHtml(r.tag):''}</small>`;
    }else{
    const pPool=favP.length?favP:allP,sPool=favS.length?favS:allS;
    if(pPool.length&&sPool.length){const p=pPool[Math.floor(Math.random()*pPool.length)],s=sPool[Math.floor(Math.random()*sPool.length)];out.innerHTML=`<b style="color:var(--accent-gold)">COMBO SPIN:</b><br>${fr_escHtml(p.n)} + ${fr_escHtml(s.n)}`;}
    else out.innerHTML=`<span style="color:var(--text-muted)">Add recipes or stock to get suggestions!</span>`;
  }
}

// ── MEAL PLAN ─────────────────────────────────────────────────────────────────
const DAY_NAMES=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
function renderPlan(){
  const g=document.getElementById('day-plan-grid');if(!g)return;
  // Map JS getDay() (0=Sun…6=Sat) → our Mon-first index (0=Mon…6=Sun)
  const jsDow = new Date().getDay(); // 0=Sun,1=Mon…6=Sat
  const todayIdx = jsDow === 0 ? 6 : jsDow - 1; // convert to Mon-first
  g.innerHTML=DAY_NAMES.map((d,i)=>`<div class="day-cell${i===todayIdx?' day-cell--today':''}" onclick="openPlanModal(${i})"><div class="day-cell-label">${d}${i===todayIdx?' <span style="font-size:9px;opacity:.7">today</span>':''}</div><div class="day-cell-val">${state.plan[i]?fr_escHtml(state.plan[i]):'<span style="color:var(--text-muted);font-size:9px">tap to add</span>'}</div></div>`).join('');
}
function openPlanModal(i){editingPlanDay=i;document.getElementById('plan-modal-title').textContent='📅 '+DAY_NAMES[i];document.getElementById('plan-input').value=state.plan[i]||'';HQModal.open('plan-modal'); // H-06
setTimeout(()=>document.getElementById('plan-input').focus(),50);}
function savePlanDay(){if(editingPlanDay===null)return;state.plan[editingPlanDay]=document.getElementById('plan-input').value.trim();save();closePlanModal();renderPlan();}
function closePlanModal(){HQModal.close('plan-modal'); // H-06
editingPlanDay=null;}
async function clearPlan(){if(!(await HQConfirm.ask('Clear the whole week?', {danger:true})))return;state.plan=Array(7).fill('');save();renderPlan();}
function copyPlan(){navigator.clipboard.writeText(DAY_NAMES.map((d,i)=>`${d}: ${state.plan[i]||'—'}`).join('\n')).then(()=>HQToast.success('Meal plan copied!')).catch(()=>{});}

// ── SHOPPING ──────────────────────────────────────────────────────────────────
function updateShop(){
  const el=document.getElementById('shop-list');if(!el)return;
  const all=state.recipes.flatMap(r=>r.i);
  el.innerHTML=all.length?all.map(ing=>`<div style="padding:5px 0;border-bottom:1px solid var(--border-col);display:flex;align-items:center;gap:8px"><span style="color:var(--accent-gold);cursor:pointer;font-size:16px;user-select:none" onclick="this.textContent=this.textContent==='☑'?'□':'☑'">□</span><span style="font-size:13px;color:var(--text-main)">${fr_escHtml(ing)}</span></div>`).join(''):`<div style="color:var(--text-muted);font-size:12px;padding:4px 0">No recipes saved yet.</div>`;
  renderCustomShop();
}
function renderCustomShop(){
  const el=document.getElementById('custom-shop-list');if(!el)return;
  el.innerHTML=state.customShop.length?state.customShop.map((item,i)=>`<div style="padding:5px 0;border-bottom:1px solid var(--border-col);display:flex;align-items:center;gap:8px"><span style="color:var(--accent-gold);cursor:pointer;font-size:16px;user-select:none" onclick="this.textContent=this.textContent==='☑'?'□':'☑'">□</span><span style="flex:1;font-size:13px;color:var(--text-main)">${fr_escHtml(item)}</span><button class="btn-red" onclick="removeCustomShop(${i})">✕</button></div>`).join(''):`<div style="color:var(--text-muted);font-size:12px;padding:4px 0">No custom items yet.</div>`;
}
function addCustomShop(){const inp=document.getElementById('custom-shop-input'),val=inp.value.trim();if(!val)return;state.customShop.push(val);inp.value='';save();renderCustomShop();}
function removeCustomShop(i){state.customShop.splice(i,1);save();renderCustomShop();}
function copyShop(){
  const all=[...state.recipes.flatMap(r=>r.i),...state.customShop].join('\n');
  if(!all){HQToast.warn('Nothing to copy.');return;}
  const btn=document.getElementById('copy-shop-btn');
  navigator.clipboard.writeText(all).then(()=>{if(btn){btn.innerText='✅ COPIED!';setTimeout(()=>{btn.innerText='📋 COPY ALL';},1500);}}).catch(()=>{});
}

// ── CHARTS ────────────────────────────────────────────────────────────────────
function renderNutriChart(){
  const nc=document.getElementById('n-chart'),ns=document.getElementById('nutri-stats');if(!nc)return;
  const data=state.nutri.slice(-10);
  if(!data.length){nc.innerHTML=`<div style="color:var(--text-muted);font-size:11px;align-self:center">Log meals to see chart</div>`;if(ns)ns.innerText='';return;}
  const maxC=Math.max(...data.map(n=>n.c),1);
  nc.innerHTML=data.map(n=>`<div class="bar cal-bar" style="height:${Math.max(4,(n.c/maxC)*100)}%" title="${n.c} cal / ${n.p}g pro"></div>`).join('');
  if(ns){const tC=data.reduce((a,b)=>a+b.c,0),tP=data.reduce((a,b)=>a+b.p,0);ns.innerHTML=`<span style="color:var(--accent-teal)">Avg Cal: ${(tC/data.length).toFixed(0)}</span>&nbsp;·&nbsp;<span style="color:var(--accent-pink)">Avg Pro: ${(tP/data.length).toFixed(0)}g</span>&nbsp;·&nbsp;<span style="color:var(--text-muted)">${data.length} logged</span>`;}
}
function renderNutriLog(){
  const el=document.getElementById('nutri-log');if(!el)return;
  const data=state.nutri.slice(-8).reverse();
  if(!data.length){el.innerHTML='';return;}
  el.innerHTML='<div class="section-label" style="margin-top:10px">Recent</div>'+data.map((n,i)=>{
    const d=new Date(n.t),ts=d.toLocaleDateString('en-US',{month:'short',day:'numeric'})+' '+d.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});
    const realIdx=state.nutri.length-1-i;
    return `<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid var(--border-col)"><div><span style="font-weight:700;font-size:13px;color:var(--text-main)">${n.p}g pro · ${n.c} cal</span> <span class="tag">${n.src||'?'}</span></div><div style="display:flex;align-items:center;gap:8px"><span style="color:var(--text-muted);font-size:10px">${ts}</span><button class="btn-red" onclick="deleteMacro(${realIdx})">✕</button></div></div>`;
  }).join('');
}
function renderWasteChart(){
  const wc=document.getElementById('w-chart'),wt=document.getElementById('w-total'),wl=document.getElementById('w-list');if(!wc)return;
  const data=state.waste.slice(-10);
  if(!data.length){wc.innerHTML=`<div style="color:var(--text-muted);font-size:11px;align-self:center">No waste logged yet</div>`;if(wt)wt.innerText='';if(wl)wl.innerHTML='';return;}
  const maxV=Math.max(...data.map(w=>w.v),1);
  wc.innerHTML=data.map(w=>`<div class="bar waste-bar" style="height:${Math.max(4,(w.v/maxV)*100)}%" title="$${w.v} — ${fr_escHtml(w.note||'')}"></div>`).join('');
  if(wt)wt.innerText=`Total: $${state.waste.reduce((a,b)=>a+b.v,0).toFixed(2)}`;
  if(wl)wl.innerHTML=state.waste.slice().reverse().map((w,i)=>{
    const realIdx=state.waste.length-1-i;
    const d=new Date(w.t),ts=d.toLocaleDateString('en-US',{month:'short',day:'numeric'});
    return `<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid var(--border-col)"><div><span style="color:var(--text-muted);font-size:10px">${ts}</span> <span style="color:var(--text-main);font-size:12px;margin-left:6px">${w.note||'No note'}</span></div><div style="display:flex;align-items:center;gap:8px"><span style="color:var(--accent-pink);font-weight:900">$${w.v.toFixed(2)}</span><button class="btn-red" onclick="deleteWaste(${realIdx})">✕</button></div></div>`;
  }).join('');
}

// ── MAIN RENDER ───────────────────────────────────────────────────────────────
function render(){
  const q=document.getElementById('search').value.toLowerCase();
  const scope=document.getElementById('s-toggle').value;

  // Cookbook
  const rList=document.getElementById('recipe-list');
  if(rList){
    rList.innerHTML='';
    if(scope==='all'||scope==='cook'){
      let matches=state.recipes.filter(r=>r.n.toLowerCase().includes(q)||(r.tag||'').toLowerCase().includes(q));
      if(cookFilter==='fav')matches=matches.filter(r=>r.fav);
      matches=[...matches.filter(r=>r.fav),...matches.filter(r=>!r.fav)];
      const fc=state.recipes.filter(r=>r.fav).length;
      const fb=document.getElementById('cook-filter-fav');
      if(fb)fb.innerHTML=`⭐ Favorites${fc?`<span class="fav-badge">${fc}</span>`:''}`;
      if(!matches.length){rList.innerHTML=`<div style="text-align:center;color:var(--text-muted);padding:20px;font-size:13px">${cookFilter==='fav'?'No favorited recipes yet.':'No recipes found.'}</div>`;return;}
      // FIX-06: collect to array, set innerHTML once (no quadratic DOM ops)
      rList.innerHTML = matches.map(r=>`<div class="recipe-card${r.fav?' fav':''}">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div><b style="font-size:15px;color:var(--text-main)">${r.fav?'⭐ ':''} ${fr_escHtml(r.n)}</b>${r.tag?` <span class="tag">${fr_escHtml(r.tag)}</span>`:''}</div>
            <div style="display:flex;gap:5px;flex-shrink:0;margin-left:8px">
              <button class="btn-fav${r.fav?' active':''}" onclick="toggleFavRecipe(${r.id})">★</button>
              <button class="btn-teal" onclick="editRecipe(${r.id})">✏️</button>
              <button class="btn-pink" onclick="logMacro(${r.p},${r.c})">COOK</button>
            </div>
          </div>
          <div style="font-size:9px;margin-top:5px"><span class="tag">${r.p}g PRO</span><span class="tag">${r.c} CAL</span><span class="tag">${r.serv||1} SERV</span></div>
          <details style="margin-top:8px;background:var(--bg);border:none;border-radius:8px">
            <summary style="padding:8px;font-size:9px;color:var(--accent-teal)">VIEW &amp; SCALE</summary>
            <div style="padding:10px;border-top:1px solid var(--border-col)">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
                <b style="color:var(--text-muted);font-size:10px">SERVINGS</b>
                <input type="number" value="${r.serv||1}" step="0.5" min="0.5" oninput="scaleRecipe(this,${r.id})" style="width:70px;padding:4px 8px">
              </div>
              <div style="color:var(--accent-gold);margin-bottom:8px">
                <div class="section-label" style="margin-top:0">Ingredients</div>
                <div id="ing-${r.id}" style="font-size:13px">${r.i.map(ing=>`<div>• ${ing}</div>`).join('')}</div>
              </div>
              <div>
                <div class="section-label" style="margin-top:0">Steps</div>
                <div style="font-size:13px;color:var(--text-main)">${r.st&&r.st.length?r.st.map((s,i)=>`<div style="margin-bottom:6px"><span style="color:var(--accent-teal);font-weight:900">${i+1}.</span> ${s}</div>`).join(''):'<i style="color:var(--text-muted)">No steps listed.</i>'}</div>
              </div>
              <div style="display:flex;gap:8px;margin-top:12px">
                <button class="btn-fav${r.fav?' active':''}" style="flex:1;padding:8px;font-size:13px" onclick="toggleFavRecipe(${r.id})">${r.fav?'★ UNFAV':'☆ FAV'}</button>
                <button class="btn-red" style="flex:1;padding:8px" onclick="deleteRecipe(${r.id})">🗑 DELETE</button>
              </div>
            </div>
          </details>
        </div>`).join('');
    }
  }

  // Inventory
  const ifc=state.inv.filter(i=>i.fav).length;
  const ifb=document.getElementById('inv-filter-fav');
  if(ifb)ifb.innerHTML=`⭐ Favorites${ifc?`<span class="fav-badge">${ifc}</span>`:''}`;
  ['p','d','c','co','sp','br','bk','pr'].forEach(cat=>{
    const div=document.getElementById('list-'+cat);if(!div)return;
    div.innerHTML='';
    if(scope!=='all'&&scope!=='inv')return;
    let items=state.inv.filter(i=>i.cat===cat&&i.n.toLowerCase().includes(q));
    if(invFilter==='fav')items=items.filter(i=>i.fav);
    items=[...items.filter(i=>i.fav),...items.filter(i=>!i.fav)];
    div.innerHTML=items.length?items.map(i=>{
      const locMeta={pantry:{icon:'🗄️',label:'Pantry',next:'fridge'},fridge:{icon:'❄️',label:'Fridge',next:'freezer'},freezer:{icon:'🧊',label:'Freezer',next:'pantry'}};
      const lm=locMeta[i.loc||'pantry'];
      return `<div class="item-card${i.fav?' fav':''}">
      <div><b style="color:var(--text-main)">${i.fav?'⭐ ':''}${fr_escHtml(i.n)}</b><br><small style="color:var(--text-muted)">${i.q}${i.p?' · '+i.p+'g pro':''}</small></div>
      <div style="display:flex;gap:5px;align-items:center">
        <button title="Move to ${locMeta[lm.next].label}" onclick="cycleLocInv(${i.id})" style="background:rgba(0,0,0,.06);border:1px solid var(--border-col);border-radius:6px;padding:4px 7px;font-size:11px;cursor:pointer;white-space:nowrap">${lm.icon} ${lm.label}</button>
        <button class="btn-fav${i.fav?' active':''}" onclick="toggleFavInv(${i.id})">★</button>
        <button class="btn-pink" onclick="logMacro(${i.p},${i.c})">LOG</button>
        <button class="btn-red" onclick="deleteInvItem(${i.id})">✕</button>
      </div>
    </div>`;}).join(''):`<div style="padding:10px;color:var(--text-muted);font-size:11px">No items.</div>`;
  });

  updateShop();renderNutriChart();renderNutriLog();renderWasteChart();renderPlan();
}

// ── JSON INVENTORY IMPORT ─────────────────────────────────────────────────────
const CAT_MAP={p:'p',d:'d',c:'c',co:'co',sp:'sp',br:'br',bk:'bk',pr:'pr'};
const CAT_LABELS={p:'🥩 Protein & Dairy',d:'🌾 Dry Goods',c:'🥫 Canned & Jarred',co:'🫙 Condiments & Oils',sp:'🌶 Spices',br:'🧂 Broths & Bases',bk:'🍰 Baking & Sweets',pr:'🥦 Produce'};
const LOC_LABELS={pantry:'🗄️ Pantry',fridge:'❄️ Fridge',freezer:'🧊 Freezer'};
let pendingImport=[];

function importInvJSON(input){
  const file=input.files[0];if(!file){return;}
  input.value=''; // reset so same file can be re-uploaded
  const reader=new FileReader();
  reader.onload=function(e){
    let raw;
    try{raw=JSON.parse(e.target.result);}
    catch(err){HQToast.error('❌ Invalid JSON file. Could not parse.');return;}
    if(!Array.isArray(raw)){HQToast.error('❌ JSON must be an array [ ] of items.');return;}
    
    const valid=[],errors=[];
    raw.forEach((item,idx)=>{
      if(typeof item!=='object'||!item){errors.push(`Item ${idx+1}: not an object`);return;}
      const n=(item.n||item.name||item.Name||'').toString().trim();
      if(!n){errors.push(`Item ${idx+1}: missing "n" (name) field`);return;}
      const cat=CAT_MAP[item.cat]||'d';
      const loc=['pantry','fridge','freezer'].includes(item.loc)?item.loc:'pantry';
      valid.push({
        id:Date.now()+Math.random(),
        n,
        q:(item.q||item.qty||item.quantity||'In Stock').toString().trim(),
        cat,loc,
        p:parseInt(item.p||item.protein||0)||0,
        c:parseInt(item.c||item.calories||item.cal||0)||0,
        fav:false
      });
    });

    if(!valid.length&&errors.length){
      HQToast.error('❌ No valid items found. Check file format.');return;
    }
    pendingImport=valid;
    showJsonImportModal(valid,errors);
  };
  reader.readAsText(file);
}

function showJsonImportModal(items,errors){
  const modal=document.getElementById('json-import-modal');
  const summary=document.getElementById('json-import-summary');
  const errBox=document.getElementById('json-import-errors');
  const list=document.getElementById('json-import-list');
  const confirmBtn=document.getElementById('json-import-confirm-btn');

  // Check for duplicates against existing inventory
  const existingNames=new Set(state.inv.map(i=>i.n.toLowerCase()));
  const dupes=items.filter(i=>existingNames.has(i.n.toLowerCase()));
  const fresh=items.filter(i=>!existingNames.has(i.n.toLowerCase()));

  const catCounts={};items.forEach(i=>{catCounts[i.cat]=(catCounts[i.cat]||0)+1;});
  const catSummary=Object.entries(catCounts).map(([k,v])=>`<span class="tag">${CAT_LABELS[k]||k}: ${v}</span>`).join('');

  summary.innerHTML=`
    <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin-bottom:8px">
      <span style="color:var(--accent-green);font-weight:900;font-size:15px">✅ ${fresh.length} new</span>
      ${dupes.length?`<span style="color:var(--accent-gold);font-weight:900;font-size:15px">⚠️ ${dupes.length} duplicate${dupes.length>1?'s':''}</span>`:''}
      ${errors.length?`<span style="color:#c04040;font-weight:900;font-size:15px">❌ ${errors.length} skipped</span>`:''}
    </div>
    <div style="margin-top:4px">${catSummary}</div>
    ${dupes.length?`<div style="font-size:11px;color:var(--text-muted);margin-top:8px">⚠️ Duplicates will still be added — they won't overwrite existing items.</div>`:''}`;

  if(errors.length){
    errBox.style.display='block';
    errBox.innerHTML='<b>Skipped rows:</b><br>'+errors.map(e=>`• ${fr_escHtml(String(e))}`).join('<br>');
  }else{errBox.style.display='none';}

  list.innerHTML=items.map((i,idx)=>`
    <div style="padding:9px 0;border-bottom:1px solid var(--border-col);display:flex;justify-content:space-between;align-items:center">
      <div>
        <span style="font-weight:700;font-size:13px;color:var(--text-main)">${fr_escHtml(i.n)}</span>
        ${existingNames.has(i.n.toLowerCase())?`<span class="tag" style="color:var(--accent-gold);border-color:var(--accent-gold)">dupe</span>`:''}
        <br>
        <span class="tag">${CAT_LABELS[i.cat]||i.cat}</span>
        <span class="tag">${LOC_LABELS[i.loc]||i.loc}</span>
        ${i.q&&i.q!=='In Stock'?`<span class="tag">${i.q}</span>`:''}
      </div>
      <div style="text-align:right;flex-shrink:0;margin-left:10px">
        ${i.p?`<div style="font-size:11px;color:var(--accent-teal);font-weight:700">${i.p}g pro</div>`:''}
        ${i.c?`<div style="font-size:11px;color:var(--text-muted)">${i.c} cal</div>`:''}
      </div>
    </div>`).join('');

  confirmBtn.textContent=`✅ ADD ${items.length} ITEM${items.length!==1?'S':''} TO INVENTORY`;
  HQModal.open('json-import-modal'); // H-06: was modal.style.display='block'
}

function confirmJsonImport(){
  if(!pendingImport.length){closeJsonImportModal();return;}
  // Assign clean integer IDs
  let maxId=Math.max(0,...state.inv.map(i=>typeof i.id==='number'?i.id:0));
  pendingImport.forEach(item=>{item.id=++maxId;state.inv.push(item);});
  save();render();
  const count=pendingImport.length;
  pendingImport=[];
  closeJsonImportModal();
  // Brief toast-style feedback
  const toastEl=document.createElement('div');
  toastEl.textContent=`✅ ${count} item${count!==1?'s':''} added to inventory`;
  Object.assign(toastEl.style,{position:'fixed',bottom:'80px',left:'50%',transform:'translateX(-50%)',background:'var(--accent-green)',color:'#fff',padding:'10px 20px',borderRadius:'20px',fontWeight:'800',fontSize:'13px',zIndex:'9999',boxShadow:'0 4px 16px rgba(0,0,0,.25)',transition:'opacity .4s',fontFamily:"'Plus Jakarta Sans',sans-serif"});
  document.body.appendChild(toastEl);
  setTimeout(()=>{toastEl.style.opacity='0';setTimeout(()=>toastEl.remove(),400);},2400);
}

function closeJsonImportModal(){
  HQModal.close('json-import-modal'); // H-06
  pendingImport=[];
}

// ══════════════════════════════════════════════════════════════════════════════
// FRIDGE & PANTRY — all functions prefixed fr_
// localStorage key: hq-fridge-items  (migrated from audhd-fridge)
// ══════════════════════════════════════════════════════════════════════════════
const FRIDGE_KEY = HQKeys.FRIDGE;
// migrate old keys once (FIXED: never removeItem the canonical key)
(function(){
  if(localStorage.getItem(HQKeys.FRIDGE_MIGRATED_V1)) return;
  ['hq-fridge-items','audhd-fridge'].forEach(function(k){
    var d=HQSafe.store.get(k);
    if(d&&!HQSafe.store.get(HQKeys.FRIDGE)){ HQSafe.store.set(HQKeys.FRIDGE,d); }
    HQSafe.store.remove(k);
  });
  HQSafe.store.set(HQKeys.FRIDGE_MIGRATED_V1,'1');
})();

let fr_items = [];
let fr_currentFilter = 'all';
let fr_currentSort = 'expiry';
let fr_editingId = null;

function fr_init() {
  fr_loadItems();
  fr_setDefaultDate();
  fr_render();
}

function fr_loadItems() {
  try {
    fr_items = HQSafe.store.get(FRIDGE_KEY, []);
  } catch { fr_items = []; }
}

function fr_saveItems() {
  HQSafe.store.set(FRIDGE_KEY, fr_items);
  if(window._khqSyncDirty) window._khqSyncDirty(); // piggyback on kitchen dirty indicator
  fridgeCheckExpiring(); // push expiring items to global flag system
}

/* Push expiring fridge items to index.html Hero2 alerts via hqFlag */
function fridgeCheckExpiring() {
  if(typeof hqFlag !== 'function') return;
  const now = Date.now();
  const soon = 24 * 60 * 60 * 1000; // 24 hours
  fr_items.forEach(item => {
    const d = fr_getDaysUntil(item.expiryDate);
    if(d !== null && d <= 1 && d >= 0) {
      hqFlag({
        id: 'fridge-' + item.id,
        source: 'kitchen-brain',
        type: 'expiring',
        text: item.name + (d === 0 ? ' expires TODAY' : ' expires tomorrow'),
        href: 'kitchen-brain.html',
        ts: now
      });
    } else if(d !== null && d < 0) {
      hqFlag({
        id: 'fridge-' + item.id,
        source: 'kitchen-brain',
        type: 'pastdue',
        text: item.name + ' expired ' + Math.abs(d) + 'd ago',
        href: 'kitchen-brain.html',
        ts: now
      });
    } else if(d === null || d > 1) {
      // resolved — remove flag if it existed
      if(typeof hqUnflag === 'function') hqUnflag('fridge-' + item.id);
    }
  });
}

function fr_setDefaultDate() {
  const el = document.getElementById('fr-inputDate'); if(!el) return;
  const d = new Date(); d.setDate(d.getDate() + 3);
  // local date — avoids UTC next-day bug at night
  el.value = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}

// ── URGENCY ──
function fr_getDaysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  // parse as local noon to avoid DST/UTC shifts
  const exp = new Date(dateStr + 'T12:00:00'); exp.setHours(0,0,0,0);
  return Math.round((exp - today) / 86400000);
}
function fr_getUrgency(item) {
  if (!item.expiryDate) return 'none';
  const d = fr_getDaysUntil(item.expiryDate);
  if (d === null) return 'none';
  if (d < 0) return 'skull';
  if (d <= 1) return 'red';
  if (d <= 3) return 'orange';
  if (d <= 6) return 'yellow';
  return 'green';
}
function fr_urgencyClass(item) { return 'urg-' + fr_getUrgency(item); }
function fr_urgencyBadge(item) {
  if (!item.expiryDate) return '<span class="fr-item-badge fr-badge-noexp">no date</span>';
  const d = fr_getDaysUntil(item.expiryDate);
  if (d === null) return '';
  if (d < 0)  return `<span class="fr-item-badge fr-badge-skull">💀 ${Math.abs(d)}d ago</span>`;
  if (d === 0) return '<span class="fr-item-badge fr-badge-red">🔴 TODAY</span>';
  if (d === 1) return '<span class="fr-item-badge fr-badge-red">🔴 tomorrow</span>';
  if (d <= 3)  return `<span class="fr-item-badge fr-badge-orange">🟠 ${d}d left</span>`;
  if (d <= 6)  return `<span class="fr-item-badge fr-badge-yellow">🟡 ${d}d left</span>`;
  return `<span class="fr-item-badge fr-badge-green">🟢 ${d}d left</span>`;
}

// ── FILTER + SORT ──
function fr_setFilter(f, btn) {
  fr_currentFilter = f;
  document.querySelectorAll('.fr-filter-chip').forEach(c => c.classList.remove('active'));
  if(btn) btn.classList.add('active');
  fr_renderItems();
}
function fr_setSort(v) { fr_currentSort = v; fr_renderItems(); }

function fr_filterItems() {
  let list = [...fr_items];
  if (fr_currentFilter !== 'all') list = list.filter(i => fr_urgencyClass(i) === fr_currentFilter);
  return list;
}
function fr_sortItems(arr) {
  return arr.slice().sort((a,b) => {
    if (fr_currentSort === 'expiry') {
      const da = a.expiryDate ? new Date(a.expiryDate) : new Date('9999-12-31');
      const db = b.expiryDate ? new Date(b.expiryDate) : new Date('9999-12-31');
      return da - db;
    }
    if (fr_currentSort === 'added') return b.addedAt - a.addedAt;
    if (fr_currentSort === 'name') return a.name.localeCompare(b.name);
    if (fr_currentSort === 'category') return a.category.localeCompare(b.category);
    return 0;
  });
}

// ── RENDER ──
function fr_render() {
  fr_updateStats();
  fr_updateUrgencyBanner();
  fr_renderItems();
  fridgeCheckExpiring(); // keep global flags in sync on every render
}
function fr_updateStats() {
  let good=0,soon=0,today=0,expired=0;
  fr_items.forEach(item => {
    const u = fr_getUrgency(item);
    if (u === 'green') good++;
    else if (u === 'yellow' || u === 'orange') soon++;
    else if (u === 'red') today++;
    else if (u === 'skull') expired++;
  });
  const sg=document.getElementById('fr-statGood'),ss=document.getElementById('fr-statSoon');
  const st=document.getElementById('fr-statToday'),se=document.getElementById('fr-statExpired');
  if(sg) sg.textContent = good;
  if(ss) ss.textContent = soon;
  if(st) st.textContent = today;
  if(se) se.textContent = expired;
}
function fr_updateUrgencyBanner() {
  const urgent = fr_items.filter(i => fr_getUrgency(i) === 'red');
  const banner = document.getElementById('fr-urgencyBanner');
  const chips = document.getElementById('fr-urgencyChips');
  if(!banner || !chips) return;
  if (urgent.length === 0) { banner.classList.remove('show'); }
  else {
    banner.classList.add('show');
    chips.innerHTML = urgent.map(i => `<span class="fr-urgency-chip">${fr_escHtml(i.name)}${i.qty ? ' · '+i.qty : ''}</span>`).join('');
  }
}
function fr_renderItems() {
  const wrap = document.getElementById('fr-itemsWrap');
  const empty = document.getElementById('fr-emptyState');
  if(!wrap || !empty) return;
  const filtered = fr_sortItems(fr_filterItems());
  wrap.querySelectorAll('.fr-item-card').forEach(el => el.remove());
  if (filtered.length === 0) { empty.style.display = 'block'; return; }
  empty.style.display = 'none';
  filtered.forEach(item => {
    const card = document.createElement('div');
    card.className = 'fr-item-card ' + fr_urgencyClass(item);
    card.dataset.id = item.id;
    const flag = item.priority === 'high' ? ' 🔥' : item.priority === 'low' ? ' 💤' : '';
    card.innerHTML = `
      <div class="fr-item-main">
        <div class="fr-item-name">${fr_escHtml(item.name)}${flag}</div>
        <div class="fr-item-meta">
          <span>${item.category}</span>
          <span>${item.location}</span>
          ${item.qty ? `<span>${fr_escHtml(item.qty)}</span>` : ''}
          ${fr_urgencyBadge(item)}
        </div>
      </div>
      <div class="fr-item-actions">
        <button class="fr-action-btn" onclick="fr_openEdit(${item.id})" title="Edit">✏️</button>
        <button class="fr-action-btn used" onclick="fr_markUsed(${item.id})" title="Used / eaten">✅</button>
        <button class="fr-action-btn del" onclick="fr_deleteItem(${item.id})" title="Delete">🗑️</button>
      </div>`;
    wrap.appendChild(card);
  });
}

// ── ADD ITEM ──
function fr_addItem() {
  const name = document.getElementById('fr-inputName').value.trim();
  if (!name) { fr_showToast('⚠️ Please enter a name'); return; }
  const item = {
    id: Date.now(),
    name,
    qty: document.getElementById('fr-inputQty').value.trim(),
    expiryDate: document.getElementById('fr-inputDate').value || null,
    category: document.getElementById('fr-inputCat').value,
    location: document.getElementById('fr-inputLoc').value,
    priority: document.getElementById('fr-inputPriority').value,
    addedAt: Date.now()
  };
  // Read optional cost before clearing form
  var cost = parseFloat(document.getElementById('fr-inputCost')?.value) || 0;
  fr_items.push(item);
  fr_saveItems();
  document.getElementById('fr-inputName').value = '';
  document.getElementById('fr-inputQty').value = '';
  if(document.getElementById('fr-inputCost')) document.getElementById('fr-inputCost').value = '';
  fr_setDefaultDate();
  fr_render();
  fr_showToast('✅ ' + item.name + ' added');
  // Optionally push grocery cost to money-brain
  if(cost > 0){
    try{
      var fin={};
      fin = HQSafe.store.get(HQKeys.FINANCE, {});
      if(!fin.transactions) fin.transactions=[];
      fin.transactions.unshift({
        id:'groc-'+Date.now(),
        title:'Groceries: '+item.name,
        amount:-cost,
        category:'Groceries',
        date:new Date().toISOString().split('T')[0],
        source:'kitchen-brain',
        note:item.qty||'',
        savedAt:new Date().toISOString(),
      });
      if(fin.transactions.length>500) fin.transactions=fin.transactions.slice(0,500);
      HQSafe.store.set(HQKeys.FINANCE, fin);
    }catch(e){}
  }
  document.getElementById('fr-inputName').focus();
}

// ── ACTIONS ──
function fr_markUsed(id) {
  const item = fr_items.find(i => i.id === id);
  fr_items = fr_items.filter(i => i.id !== id);
  fr_saveItems(); fr_render();
  fr_showToast('✅ Marked "' + (item ? item.name : 'item') + '" as used!');
}
async function fr_deleteItem(id) {
  const item = fr_items.find(i => i.id === id);
  if(!(await HQConfirm.ask(`Delete "${item ? item.name : 'this item'}"?`, {danger:true}))) return;
  fr_items = fr_items.filter(i => i.id !== id);
  fr_saveItems(); fr_render();
  fr_showToast('🗑️ Deleted');
}
async function fr_clearExpired() {
  const count = fr_items.filter(i => fr_getUrgency(i) === 'skull').length;
  if (count === 0) { fr_showToast('No expired items!'); return; }
  if(!(await HQConfirm.ask(`Remove all ${count} expired item(s)?`, {danger:true}))) return;
  fr_items = fr_items.filter(i => fr_getUrgency(i) !== 'skull');
  fr_saveItems(); fr_render();
  fr_showToast('💀 Cleared ' + count + ' expired item(s)');
}

// ── EDIT MODAL ──
function fr_openEdit(id) {
  fr_editingId = id;
  const item = fr_items.find(i => i.id === id);
  if (!item) return;
  document.getElementById('fr-editName').value = item.name;
  document.getElementById('fr-editQty').value = item.qty || '';
  document.getElementById('fr-editDate').value = item.expiryDate || '';
  document.getElementById('fr-editCat').value = item.category;
  document.getElementById('fr-editLoc').value = item.location;
  document.getElementById('fr-editModal').classList.add('show');
}
function fr_saveEdit() {
  const item = fr_items.find(i => i.id === fr_editingId);
  if (!item) return;
  item.name = document.getElementById('fr-editName').value.trim() || item.name;
  item.qty = document.getElementById('fr-editQty').value.trim();
  item.expiryDate = document.getElementById('fr-editDate').value || null;
  item.category = document.getElementById('fr-editCat').value;
  item.location = document.getElementById('fr-editLoc').value;
  fr_saveItems(); fr_closeEdit(); fr_render();
  fr_showToast('💾 Saved');
}
function fr_closeEdit() {
  fr_editingId = null;
  document.getElementById('fr-editModal').classList.remove('show');
}

// ── TOAST + UTILS ──
function fr_showToast(msg) { kbShowToast(msg); }
// C10-03: fr_escHtml aliased → HQUtils.esc (unified escaping standard)
const fr_escHtml = s => HQUtils.esc(s); // → HQUtils.esc

// ══════════════════════════════════════════════════════════════════════════════
// DATA SYNC — AuDHD HQ Integration
// Registers Kitchen HQ with the global AUDHD_SYNC registry so data-sync.html
// can export / import / backup this module alongside all others.
// ══════════════════════════════════════════════════════════════════════════════

(function(){
  // ── Registry ────────────────────────────────────────────────────────────────
  // data-sync.html reads window.AUDHD_MODULES to discover registered modules.
  // Each entry describes one localStorage key with export/import helpers.
  window.AUDHD_MODULES = window.AUDHD_MODULES || [];

  window.AUDHD_MODULES.push({
    id:    'kitchen',
    label: '🍳 Kitchen HQ',
    key:   KEY,                          // HQKeys.KITCHEN
    description: 'Recipes, inventory, macros, meal plan, shopping list, waste log',

    /** Export: returns the raw state object (or null if nothing saved yet) */
    exportData: function(){
      try{
        return HQSafe.store.get(KEY, null);
      }catch(e){ return null; }
    },

    /** Import: merge or replace depending on mode ('merge'|'replace') */
    importData: function(incoming, mode){
      if(!incoming || typeof incoming !== 'object') return false;
      try{
        if(mode === 'replace'){
          state = Object.assign({}, defaultState, incoming);
        } else {
          // merge — append new recipes / inv items, keep existing by id
          const existing = state;
          const mergedInv = mergeById(existing.inv, incoming.inv || []);
          const mergedRecipes = mergeById(existing.recipes, incoming.recipes || []);
          const mergedNutri = (existing.nutri||[]).concat(
            (incoming.nutri||[]).filter(n => !existing.nutri.some(e => e.t === n.t))
          );
          const mergedWaste = (existing.waste||[]).concat(
            (incoming.waste||[]).filter(w => !existing.waste.some(e => e.t === w.t))
          );
          state = Object.assign({}, existing, incoming, {
            inv: mergedInv,
            recipes: mergedRecipes,
            nutri: mergedNutri,
            waste: mergedWaste,
          });
        }
        save();
        render();
        return true;
      }catch(e){ console.error('Kitchen HQ import error:', e); return false; }
    },

    /** Summary shown in data-sync.html storage overview table */
    getStats: function(){
      try{
        const d_exp = HQSafe.store.get(KEY, null);
        if(!raw) return { records: 0, size: '0 KB' };
        const d = d_exp;
        const records = (d.inv||[]).length + (d.recipes||[]).length +
                        (d.nutri||[]).length + (d.waste||[]).length;
        const kb = (raw.length / 1024).toFixed(1);
        return { records, size: kb + ' KB' };
      }catch(e){ return { records: 0, size: '0 KB' }; }
    }
  });

  /** Helper: merge two arrays by id, preferring existing on conflict */
  function mergeById(existing, incoming){
    const map = new Map((existing||[]).map(x => [x.id, x]));
    (incoming||[]).forEach(x => { if(!map.has(x.id)) map.set(x.id, x); });
    return Array.from(map.values());
  }

  // ── Fridge & Pantry module registration ──────────────────────────────────────
  window.AUDHD_MODULES.push({
    id:    'fridge',
    label: '🧊 Fridge & Pantry',
    key:   FRIDGE_KEY,
    description: 'Fridge, freezer & counter items with expiry tracking',
    exportData: function(){
      return HQSafe.store.get(FRIDGE_KEY, null);
    },
    importData: function(incoming, mode){
      if(!Array.isArray(incoming)) return false;
      try{
        if(mode==='replace'){ fr_items=incoming; }
        else {
          const existingIds=new Set(fr_items.map(i=>i.id));
          incoming.forEach(item=>{ if(!existingIds.has(item.id)) fr_items.push(item); });
        }
        fr_saveItems(); fr_render(); return true;
      }catch(e){ return false; }
    },
    getStats: function(){
      try{
        const d_fr=HQSafe.store.get(FRIDGE_KEY, null);
        if(!raw) return {records:0,size:'0 KB'};
        const d=d_fr;
        return {records:(d||[]).length, size:(raw.length/1024).toFixed(1)+' KB'};
      }catch(e){return {records:0,size:'0 KB'};}
    }
  });

  // ── Dirty-state dot ─────────────────────────────────────────────────────────
  // Pulse the orange dot in the topbar when there are unsaved-to-sync changes.
  // We track the last "synced" snapshot via sessionStorage so the dot resets
  // after a visit to data-sync.html.

  const SYNC_SNAPSHOT_KEY = 'KHQ_SYNC_SNAP';

  function markDirty(){
    const dot = document.getElementById('syncDot');
    if(!dot) return;
    const current = HQSafe.store.get(KEY) || '';
    const snap = sessionStorage.getItem(SYNC_SNAPSHOT_KEY) || '';
    if(current !== snap){
      if(dot)dot.classList.add('dirty');
      if(dot)dot.title = 'Unsynced changes — click to open Data Sync';
    } else {
      if(dot)dot.classList.remove('dirty');
      if(dot)dot.title = 'All data synced';
    }
  }

  function takeSnapshot(){
    sessionStorage.setItem(SYNC_SNAPSHOT_KEY, localStorage.getItem(KEY) || '');
  }

  // Expose dirty callback so save() can call it
  window._khqSyncDirty = markDirty;

  // If returning from data-sync.html, take a fresh snapshot
  if(document.referrer && document.referrer.includes('data-sync')){
    takeSnapshot();
  }

  // Initial dirty check after DOM is ready
  window.addEventListener('load', () => {
// FIX-04/FIX-08: Clear intervals and abort listeners on page unload
window.addEventListener('pagehide', function() {
  if (window._kbTickInterval) { clearInterval(window._kbTickInterval); window._kbTickInterval = null; }
  if (window._kbClockInterval) { clearInterval(window._kbClockInterval); window._kbClockInterval = null; }
  if (_kbAC) { _kbAC.abort(); }
}, {once: true});
// FIX-08
if (window.HQLifecycle) HQLifecycle.register(function() {
  if (window._kbTickInterval) { clearInterval(window._kbTickInterval); window._kbTickInterval = null; }
  if (window._kbClockInterval) { clearInterval(window._kbClockInterval); window._kbClockInterval = null; }
  if (_kbAC) _kbAC.abort();
});

    if(!sessionStorage.getItem(SYNC_SNAPSHOT_KEY)) takeSnapshot();
    markDirty();
  });

})();

// ── QUICK-EXPORT helper callable from console or data-sync ─────────────────
// data-sync.html may also call window.khqExport() / window.khqImport() directly
// as a fallback for older integration patterns.
window.khqExport = function(){ return HQSafe.store.get(KEY); };
window.khqImport = function(json, mode){
  const mod = (window.AUDHD_MODULES||[]).find(m=>m.id==='kitchen');
  if(mod) return mod.importData(JSON.parse(json), mode||'merge');
};

// ── HQEnvironment (Tier 6 adoption) ───────────────────────────────────────
// Hides non-essential panels (vibe, nutrition stats) in survival mode.
var _kbSurvivalHidden = ['panel-vibe', 'nutri-stats', 'nutri-chart'];
function _kbApplySurvival() {
  var inSurvival = window.HQEnvironment && HQEnvironment.isSurvival();
  _kbSurvivalHidden.forEach(function(id) {
    var el = document.getElementById(id);
    if (!el) return;
    if (inSurvival) el.setAttribute('data-survival-hidden', '1');
    else            el.removeAttribute('data-survival-hidden');
  });
}
window.addEventListener('hq-environment-changed', _kbApplySurvival);

init();
_kbApplySurvival();

/* Hide universal bottom-nav on desktop (kitchen has its own TV sidebar) */
(function(){
  const bn=document.getElementById('hq-bottom-nav');
  if(bn&&window.innerWidth>=900)bn.style.display='none';
  window.addEventListener('resize',()=>{if(bn)bn.style.display=window.innerWidth>=900?'none':'';},_kbSig);
})();
/* Service Worker */
// ════════════════════════════════════════════════════════════
//  PHASE 7B — KITCHEN BRAIN SETUP
//  Storage key: audhd-hq-kitchen-setup
//  Schema: { householdSize:1, dietaryRestrictions:[], pantryStaples:[], importedAt:null }
// ════════════════════════════════════════════════════════════

const KB_SETUP_KEY = HQKeys.KITCHEN_SETUP;

let _kbSetup = {
  householdSize: 1,
  dietaryRestrictions: [],   // [string]
  pantryStaples: [],          // [string]
  importedAt: null,
  lastImportCount: 0
};
let _kbPendingInv = [];

function kbSetupLoad() {
  try {
_kbSetup = Object.assign({ householdSize:1, dietaryRestrictions:[], pantryStaples:[], importedAt:null, lastImportCount:0 }, HQSafe.store.get(KB_SETUP_KEY, {}));
  } catch(e) {}
}

function kbSetupSave() {
  try { HQSafe.store.set(KB_SETUP_KEY, _kbSetup); } catch(e) {}
}

// ── HOUSEHOLD SIZE ────────────────────────────────────────────
function kbAdjHousehold(delta) {
  const el = document.getElementById('kb-household-display');
  if (!el) return;
  let n = parseInt(el.textContent) || 1;
  n = Math.max(1, Math.min(12, n + delta));
  el.textContent = n;
}

function kbSaveHousehold() {
  const el = document.getElementById('kb-household-display');
  if (!el) return;
  _kbSetup.householdSize = parseInt(el.textContent) || 1;
  kbSetupSave();
  kbShowToast('🏠 Household size saved ✓');
}

// ── DIETARY RESTRICTIONS ──────────────────────────────────────
function kbRenderDietTags() {
  const el = document.getElementById('kb-diet-tags');
  if (!el) return;
  if (!_kbSetup.dietaryRestrictions.length) {
    el.innerHTML = '<span style="font-size:11px;color:rgba(180,190,220,.4);font-style:italic">None added yet</span>';
    return;
  }
  el.innerHTML = _kbSetup.dietaryRestrictions.map((d, i) => `
    <span class="kb-diet-tag">
      ${kbEsc(d)}
      <button class="kb-tag-del" onclick="kbRemoveDiet(${i})">×</button>
    </span>`).join('');
}

function kbAddDiet() {
  const inp = document.getElementById('kb-diet-input');
  if (!inp) return;
  const val = inp.value.trim();
  if (!val) return;
  if (!_kbSetup.dietaryRestrictions.includes(val)) {
    _kbSetup.dietaryRestrictions.push(val);
    kbSetupSave();
    kbRenderDietTags();
  }
  inp.value = '';
}

function kbRemoveDiet(i) {
  _kbSetup.dietaryRestrictions.splice(i, 1);
  kbSetupSave();
  kbRenderDietTags();
}

// ── PANTRY STAPLES ───────────────────────────────────────────
const KB_PRESETS = {
  basic: ['Olive oil','Salt','Black pepper','Garlic','Onions','Rice','Pasta','Canned tomatoes','Eggs','Bread'],
  baking: ['All-purpose flour','Baking powder','Baking soda','Sugar','Brown sugar','Butter','Vanilla extract','Cocoa powder','Rolled oats'],
  asian: ['Soy sauce','Sesame oil','Rice vinegar','Fish sauce','Mirin','Ginger','Cornstarch','Jasmine rice','Noodles','Sriracha']
};

function kbRenderStaples() {
  const el = document.getElementById('kb-staples-list');
  if (!el) return;
  if (!_kbSetup.pantryStaples.length) {
    el.innerHTML = '<span style="font-size:11px;color:rgba(180,190,220,.4);font-style:italic">No staples added yet</span>';
    return;
  }
  el.innerHTML = _kbSetup.pantryStaples.map((s, i) => `
    <span class="kb-staple-tag">
      ${kbEsc(s)}
      <button class="kb-tag-del" onclick="kbRemoveStaple(${i})">×</button>
    </span>`).join('');
}

function kbAddStaple() {
  const inp = document.getElementById('kb-staple-input');
  if (!inp) return;
  const val = inp.value.trim();
  if (!val) return;
  if (!_kbSetup.pantryStaples.map(s => s.toLowerCase()).includes(val.toLowerCase())) {
    _kbSetup.pantryStaples.push(val);
    kbSetupSave();
    kbRenderStaples();
  }
  inp.value = '';
}

function kbRemoveStaple(i) {
  _kbSetup.pantryStaples.splice(i, 1);
  kbSetupSave();
  kbRenderStaples();
}

function kbAddStaplesPreset(key) {
  const preset = KB_PRESETS[key] || [];
  let added = 0;
  preset.forEach(item => {
    if (!_kbSetup.pantryStaples.map(s => s.toLowerCase()).includes(item.toLowerCase())) {
      _kbSetup.pantryStaples.push(item);
      added++;
    }
  });
  kbSetupSave();
  kbRenderStaples();
  kbShowToast(`✓ ${added} staple${added !== 1 ? 's' : ''} added from preset`);
}

// ── INVENTORY IMPORT ─────────────────────────────────────────
const KB_CAT_MAP = {
  fridge:'fridge', freezer:'freezer', pantry:'pantry', dry:'pantry',
  spice:'spices', spices:'spices', baking:'baking', drink:'drinks',
  drinks:'drinks', beverage:'drinks', cleaning:'cleaning'
};

function kbParseInvText(raw) {
  return raw.split('\n').map(l => l.trim()).filter(l => l.length).map(l => {
    const parts = l.split(',').map(p => p.trim());
    const rawCat = (parts[1] || '').toLowerCase().replace(/[^a-z]/g,'');
    return {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2,5),
      name: parts[0] || '',
      cat: KB_CAT_MAP[rawCat] || 'pantry',
      qty: parts[2] || '1',
      loc: parts[3] || '',
      fav: false,
      low: false
    };
  }).filter(i => i.name.length);
}

function kbParseInvCSV(raw) {
  const rows = raw.trim().split('\n');
  const firstCell = (rows[0] || '').split(',')[0].replace(/"/g,'').trim().toLowerCase();
  const start = (firstCell === 'name' || firstCell === 'item') ? 1 : 0;
  return rows.slice(start).map(row => {
    const parts = row.split(',').map(p => p.replace(/^"|"$/g,'').trim());
    const rawCat = (parts[1] || '').toLowerCase().replace(/[^a-z]/g,'');
    return {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2,5),
      name: parts[0] || '',
      cat: KB_CAT_MAP[rawCat] || 'pantry',
      qty: parts[2] || '1',
      loc: parts[3] || '',
      fav: false, low: false
    };
  }).filter(i => i.name.length);
}

function kbShowInvPreview(items) {
  _kbPendingInv = items;
  const previewEl = document.getElementById('kb-inv-preview');
  const listEl    = document.getElementById('kb-inv-preview-list');
  const countEl   = document.getElementById('kb-inv-preview-count');
  if (countEl) countEl.textContent = items.length;
  const catIcon = { fridge:'🧊', freezer:'❄️', pantry:'📦', spices:'🌶', baking:'🥐', drinks:'🥤', cleaning:'🧴' };
  if (listEl) {
    // FIX-06: build in one pass — no innerHTML+=
    const _previewRows = items.slice(0, 50).map(item => `
      <div class="kb-inv-preview-row">
        <span class="kb-inv-badge">${catIcon[item.cat]||'📦'} ${item.cat}</span>
        <span style="font-weight:700;color:var(--text)">${kbEsc(item.name)}</span>
        ${item.qty ? `<span style="color:rgba(180,190,220,.5);font-size:10px">${kbEsc(item.qty)}</span>` : ''}
      </div>`);
    if (items.length > 50) _previewRows.push(`<div style="font-size:10px;color:rgba(180,190,220,.4);padding:4px 0">…and ${items.length - 50} more</div>`);
    listEl.innerHTML = _previewRows.join('');
  }
  if (previewEl) previewEl.style.display = '';
}

function kbPreviewInvImport() {
  const textEl = document.getElementById('kb-inv-import-text');
  if (!textEl || !textEl.value.trim()) { kbShowToast('⚠️ Paste some items first'); return; }
  const items = kbParseInvText(textEl.value);
  if (!items.length) { kbShowToast('⚠️ No items parsed — check format'); return; }
  kbShowInvPreview(items);
}

function kbPreviewInvFileImport(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const items = file.name.endsWith('.csv') ? kbParseInvCSV(e.target.result) : kbParseInvText(e.target.result);
    if (!items.length) { kbShowToast('⚠️ No items parsed'); return; }
    kbShowInvPreview(items);
  };
  reader.readAsText(file);
}

function kbConfirmInvImport() {
  // FIX: write into state.inv (the live array) rather than a stale kData read.
  // Map setup-import shape {id,name,qty,cat,loc,fav,low} → state.inv shape {id,n,q,cat,loc,p,c,fav}
  try {
    const mapped = _kbPendingInv.map(item => ({
      id:  item.id  || (Date.now().toString(36) + Math.random().toString(36).slice(2,5)),
      n:   item.name || item.n || '',
      q:   item.qty  || item.q  || '—',
      cat: item.cat  || 'd',
      loc: item.loc  || 'pantry',
      p:   item.p    || 0,
      c:   item.c    || 0,
      fav: false
    }));
    if (!Array.isArray(state.inv)) state.inv = [];
    state.inv.push(...mapped);
    save();
    if (typeof render === 'function') render();
  } catch(e) { console.error('[KB Import]', e); }

  _kbSetup.importedAt = new Date().toISOString();
  _kbSetup.lastImportCount = _kbPendingInv.length;
  kbSetupSave();

  const statsEl = document.getElementById('kb-inv-import-stats');
  if (statsEl) statsEl.textContent = `✅ ${_kbPendingInv.length} items imported.`;
  kbCancelInvImport();
  kbShowToast(`✅ ${_kbSetup.lastImportCount} inventory items imported`);
}

function kbCancelInvImport() {
  _kbPendingInv = [];
  const previewEl = document.getElementById('kb-inv-preview');
  if (previewEl) previewEl.style.display = 'none';
  const textEl = document.getElementById('kb-inv-import-text');
  if (textEl) textEl.value = '';
  const fileEl = document.getElementById('kb-inv-import-file');
  if (fileEl) fileEl.value = '';
}

// ── RENDER SETUP PANEL ────────────────────────────────────────
function kbRenderSetup() {
  // Household size
  const szEl = document.getElementById('kb-household-display');
  if (szEl) szEl.textContent = _kbSetup.householdSize || 1;
  // Tags
  kbRenderDietTags();
  kbRenderStaples();
  // Import stats
  const statsEl = document.getElementById('kb-inv-import-stats');
  if (statsEl && _kbSetup.importedAt) {
    const d = new Date(_kbSetup.importedAt).toLocaleDateString();
    statsEl.textContent = `Last import: ${d} — ${_kbSetup.lastImportCount} items added.`;
  }
}

// ── EXPORT / RESTORE ──────────────────────────────────────────
function kbExportSetup() {
  const blob = new Blob([JSON.stringify(_kbSetup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `kitchen-setup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function kbImportSetup(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      _kbSetup = Object.assign({ householdSize:1, dietaryRestrictions:[], pantryStaples:[], importedAt:null, lastImportCount:0 }, JSON.parse(e.target.result));
      kbSetupSave();
      kbRenderSetup();
      kbShowToast('✓ Kitchen setup restored');
    } catch(err) {
      kbShowToast('❌ Could not parse file');
    }
  };
  reader.readAsText(file);
  input.value = '';
}

function kbEsc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function kbShowToast(msg) {
  if (typeof showToast === 'function') { showToast(msg); return; }
  // Fallback: use the fridge toast element (unified single toast layer)
  const t = document.getElementById('fr-toast');
  if (t) { t.textContent = msg; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2500); return; }

}

// ── HOOK INTO PANEL SYSTEM ───────────────────────────────────
// 'setup' is already in PANEL_IDS at declaration; no push needed here.

// Init
kbSetupLoad();
