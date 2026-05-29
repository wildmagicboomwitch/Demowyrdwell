(function () {
  'use strict';
  /* ── Phase C3: IIFE + strict mode wrap — customize ── */

// ════════════════════════════════════════════════════════════
//  TAG ENGINE — audhd-hq-tags
// ════════════════════════════════════════════════════════════

const STORE = HQKeys.TAGS;

// ── DEFAULT_CATS — full subcategory spec ──
const DEFAULT_CATS = [
  {id:'work',      name:'Work',          emoji:'💼', color:'#645EB7', builtIn:true, subcategories:[
    {id:'work-dayjob',  name:'Day Job',       emoji:'🏢'},
    {id:'work-organize',name:'Organizing',    emoji:'📁'},
    {id:'work-tools',   name:'Tool Building', emoji:'🔧'},
  ], appliesTo:['all']},
  {id:'home',      name:'Home',          emoji:'🏠', color:'#8BB698', builtIn:true, subcategories:[
    {id:'home-decor',   name:'Decor',         emoji:'🎨'},
    {id:'home-repair',  name:'Repair',        emoji:'🔨'},
    {id:'home-organize',name:'Organize',      emoji:'📦'},
  ], appliesTo:['all']},
  {id:'creative',  name:'Creative',      emoji:'🎨', color:'#FF6BA8', builtIn:true, subcategories:[
    {id:'cre-visual',   name:'Visual',        emoji:'🖼️'},
    {id:'cre-writing',  name:'Writing',       emoji:'✍️'},
    {id:'cre-prod',     name:'Productivity',  emoji:'⚡'},
  ], appliesTo:['all']},
  {id:'friends',   name:'For Friends',   emoji:'💌', color:'#4ECDC4', builtIn:true, subcategories:[
    {id:'fr-tools',     name:'Tool Building', emoji:'🔧'},
    {id:'fr-gifts',     name:'Gifts',         emoji:'🎁'},
    {id:'fr-other',     name:'Other',         emoji:'💬'},
  ], appliesTo:['all']},
  {id:'fun',       name:'Fun',           emoji:'🎉', color:'#F4CA00', builtIn:true, subcategories:[
    {id:'fun-general',  name:'General',       emoji:'🎲'},
    {id:'fun-creative', name:'Creative',      emoji:'🎭'},
  ], appliesTo:['all']},
  {id:'life-plan', name:'Life Plan',     emoji:'🌱', color:'#06D6A0', builtIn:true, subcategories:[
    {id:'lp-career',    name:'Career',        emoji:'💼'},
    {id:'lp-money',     name:'Money',         emoji:'💰'},
    {id:'lp-kids',      name:'Kids',          emoji:'👶'},
  ], appliesTo:['all']},
  {id:'health',    name:'Health',        emoji:'🏥', color:'#EF5886', builtIn:true, subcategories:[
    {id:'h-providers',  name:'Providers & Appointments', emoji:'👩‍⚕️', pushToCheckin:false},
    {id:'h-rx',         name:'Medications & Rx',         emoji:'💊',  pushToCheckin:true},
    {id:'h-symptoms',   name:'Symptoms & Conditions',    emoji:'🩺',  pushToCheckin:true},
    {id:'h-mental',     name:'Mental Health',            emoji:'💜',  pushToCheckin:true},
    {id:'h-tracking',   name:'Daily Health Tracking',    emoji:'📊',  pushToCheckin:true},
    {id:'h-wellness',   name:'Wellness & Self-Care',     emoji:'🌿',  pushToCheckin:false},
    {id:'h-bodyparts',  name:'Body Parts & Pain',        emoji:'🦴',  pushToCheckin:true},
    {id:'h-vitals',     name:'Vitals & Measurements',    emoji:'📈',  pushToCheckin:true},
  ], appliesTo:['all']},
  {id:'finance',   name:'Finance',       emoji:'💰', color:'#C49A00', builtIn:true, subcategories:[
    {id:'fin-accounts',  name:'Accounts & Assets',    emoji:'🏦'},
    {id:'fin-income',    name:'Income & Pay',          emoji:'💵'},
    {id:'fin-bills',     name:'Bills & Fixed',         emoji:'📋'},
    {id:'fin-food',      name:'Food & Groceries',      emoji:'🛒'},
    {id:'fin-transport', name:'Transportation',         emoji:'🚌'},
    {id:'fin-household', name:'Household',              emoji:'🧹'},
    {id:'fin-personal',  name:'Personal Care',          emoji:'🪥'},
    {id:'fin-health',    name:'Health Expenses',        emoji:'💊'},
    {id:'fin-fun',       name:'Fun & Entertainment',    emoji:'🎉'},
    {id:'fin-debt',      name:'Debt & Credit',          emoji:'💳'},
  ], appliesTo:['all']},
  {id:'admin',     name:'Admin',         emoji:'📋', color:'#A8AAA9', builtIn:true, subcategories:[
    {id:'adm-phone',     name:'Phone Calls',        emoji:'📞'},
    {id:'adm-paperwork', name:'Paperwork & Forms',  emoji:'📄'},
    {id:'adm-email',     name:'Emails',             emoji:'📧'},
    {id:'adm-gov',       name:'Government',         emoji:'🏛'},
    {id:'adm-insurance', name:'Insurance',          emoji:'🛡'},
    {id:'adm-taxes',     name:'Taxes',              emoji:'🧾'},
    {id:'adm-legal',     name:'Legal & Court',      emoji:'⚖️'},
    {id:'adm-home',      name:'Home Admin',         emoji:'🏠'},
    {id:'adm-work',      name:'Work Admin',         emoji:'💼'},
    {id:'adm-medical',   name:'Medical Admin',      emoji:'🏥'},
  ], appliesTo:['all']},
  {id:'self',      name:'Self & Growth', emoji:'🧠', color:'#C8BAFF', builtIn:true, subcategories:[
    {id:'self-mental',   name:'Mental Health',         emoji:'💜'},
    {id:'self-therapy',  name:'Therapy & Goals',       emoji:'🛋'},
    {id:'self-habit',    name:'Habits & Routines',     emoji:'🔁'},
    {id:'self-adhd',     name:'AuDHD Management',      emoji:'⚡'},
    {id:'self-learning', name:'Learning & Skills',     emoji:'📚'},
    {id:'self-reflect',  name:'Reflection & Journal',  emoji:'✍️'},
  ], appliesTo:['all']},
  {id:'personal',  name:'Personal',      emoji:'🌿', color:'#ABD7BF', builtIn:true, subcategories:[
    {id:'per-appt',      name:'Appointments & Errands', emoji:'📅'},
    {id:'per-selfcare',  name:'Self-Care',              emoji:'🛁'},
    {id:'per-hobbies',   name:'Hobbies & Interests',   emoji:'🎯'},
    {id:'per-relations', name:'Relationships',          emoji:'💬'},
  ], appliesTo:['all']},
  {id:'social',    name:'Social',        emoji:'👥', color:'#FF876C', builtIn:true, subcategories:[
    {id:'soc-friend',    name:'Friends',               emoji:'💛'},
    {id:'soc-family',    name:'Family',                emoji:'🏡'},
    {id:'soc-fam-adj',   name:'Family Adjacent',       emoji:'💫'},
    {id:'soc-work',      name:'Work Contacts',         emoji:'💼'},
    {id:'soc-medical',   name:'Medical Team',          emoji:'🩺'},
    {id:'soc-prof',      name:'Professional',          emoji:'🤝'},
    {id:'soc-other',     name:'Other',                 emoji:'💬'},
  ], appliesTo:['all']},
];

const DEFAULT_FLAGS = {
  priority:[
    {id:'critical', name:'Critical',   emoji:'🔴', color:'#B53030', desc:'Must happen — failure has real consequences', builtIn:true},
    {id:'high',     name:'High',       emoji:'🟠', color:'#C96020', desc:'Important, should happen today or this week',  builtIn:true},
    {id:'medium',   name:'Medium',     emoji:'🟡', color:'#C49A00', desc:'Matters but timing is flexible',               builtIn:true},
    {id:'low',      name:'Low',        emoji:'🟢', color:'#2A7A4E', desc:'Nice to do, no urgency',                      builtIn:true},
    {id:'none',     name:'No Priority',emoji:'⚪', color:'#789A88', desc:'Default — priority unset',                    builtIn:true},
  ],
  energy:[
    {id:'high-energy',   name:'High Energy',   emoji:'🔴', color:'#B53030', desc:'High focus needed',   builtIn:true},
    {id:'medium-energy', name:'Medium Energy', emoji:'🟡', color:'#C49A00', desc:'Manageable effort',   builtIn:true},
    {id:'low-energy',    name:'Low Energy',    emoji:'🟢', color:'#2A7A4E', desc:'Doable anytime',      builtIn:true},
  ],
  time:[
    {id:'time-locked', name:'Time-Locked', emoji:'⏰', color:'#B53030', desc:'Must happen at a specific time',       builtIn:true},
    {id:'date-locked', name:'Date-Locked', emoji:'📅', color:'#C96020', desc:'Specific date, flexible time',         builtIn:true},
    {id:'week-locked', name:'Week-Locked', emoji:'📆', color:'#C49A00', desc:'Must happen this week',                builtIn:true},
    {id:'flexible',    name:'Flexible',    emoji:'🌊', color:'#2A8A85', desc:'No hard deadline',                     builtIn:true},
  ],
  context:[
    {id:'home-only',      name:'Home Only',          emoji:'🏠', color:'#8BB698', desc:'Can only be done at home',            builtIn:true},
    {id:'remote-ok',      name:'Remote OK',           emoji:'💻', color:'#3A70B0', desc:'Can be done anywhere',                builtIn:true},
    {id:'requires-call',  name:'Requires Call',       emoji:'📞', color:'#C96020', desc:'Involves a phone call',               builtIn:true},
    {id:'requires-travel',name:'Requires Travel',     emoji:'🚗', color:'#645EB7', desc:'Requires leaving home',               builtIn:true},
    {id:'needs-appt',     name:'Appointment Required',emoji:'📅', color:'#EF5886', desc:'Needs an appointment scheduled first', builtIn:true},
    {id:'in-person',      name:'In-Person Only',      emoji:'🏢', color:'#8BB698', desc:'Must be done in person',              builtIn:true},
    {id:'online-only',    name:'Online Only',          emoji:'🌐', color:'#3A70B0', desc:'Done entirely online or by app',      builtIn:true},
  ],
  status:[
    {id:'waiting-on',       name:'Waiting On',          emoji:'⏳', color:'#2A8A85', desc:'Ball is in someone else\'s court',        builtIn:true},
    {id:'blocked',          name:'Blocked',              emoji:'🚫', color:'#B53030', desc:'Can\'t proceed — needs something first',   builtIn:true},
    {id:'delegated',        name:'Delegated',            emoji:'🤝', color:'#645EB7', desc:'Someone else is handling this',            builtIn:true},
    {id:'on-hold',          name:'On Hold',              emoji:'⏸',  color:'#789A88', desc:'Paused — return to it later',              builtIn:true},
    {id:'follow-up',        name:'Follow-Up Needed',     emoji:'🔔', color:'#C96020', desc:'Needs a follow-up action or check-in',     builtIn:true},
    {id:'decision-needed',  name:'Decision Required',    emoji:'🤔', color:'#C49A00', desc:'Needs a decision before it can progress',  builtIn:true},
    {id:'waiting-results',  name:'Awaiting Results',     emoji:'🧪', color:'#4ECDC4', desc:'Waiting on test results or referral',      builtIn:true},
    {id:'referral-pending', name:'Referral Pending',     emoji:'📋', color:'#3A70B0', desc:'Referral submitted — awaiting response',   builtIn:true},
  ],
  wellbeing:[
    {id:'low-spoon',       name:'Low Spoon Friendly',        emoji:'🟢', color:'#2A7A4E', desc:'Safe to do on low-energy crash days',          builtIn:true},
    {id:'spoon-heavy',     name:'High Spoon Cost',           emoji:'🔋', color:'#B53030', desc:'Requires good energy — don\'t force it',        builtIn:true},
    {id:'high-exec',       name:'High Executive Function',   emoji:'🧠', color:'#645EB7', desc:'Needs focus, planning, and working memory',     builtIn:true},
    {id:'body-double',     name:'Better with Body Double',   emoji:'👥', color:'#4ECDC4', desc:'Easier with someone else present or on video',  builtIn:true},
    {id:'social-required', name:'Social Interaction Needed', emoji:'😬', color:'#FF876C', desc:'Involves talking to people — plan spoons',      builtIn:true},
    {id:'hyperfocus',      name:'Hyperfocus-Friendly',       emoji:'⚡', color:'#F4CA00', desc:'Good for rabbit-holing when in the zone',       builtIn:true},
    {id:'phone-anxiety',   name:'Phone Anxiety Risk',        emoji:'📞', color:'#C96020', desc:'Involves a call — may need a script or prep',   builtIn:true},
    {id:'sensory-risk',    name:'Sensory Considerations',    emoji:'🌊', color:'#3A70B0', desc:'May involve sensory challenges or overwhelm',    builtIn:true},
    {id:'admin-heavy',     name:'Admin Heavy',               emoji:'📋', color:'#A8AAA9', desc:'Many steps, paperwork, or logistics involved',   builtIn:true},
  ],
  system:[
    {id:'deferred',  name:'Deferred',  emoji:'🔄', color:'#789A88', desc:'Kicked to unassigned',           builtIn:true, readOnly:true},
    {id:'prep-task', name:'Prep Task', emoji:'📎', color:'#4ECDC4', desc:'Linked to an appointment',       builtIn:true, readOnly:true},
    {id:'cascaded',  name:'Cascaded',  emoji:'⬆️', color:'#C8BAFF', desc:'Came from monthly or weekly',   builtIn:true, readOnly:true},
    {id:'new',       name:'New',       emoji:'🆕', color:'#06D6A0', desc:'Entered today',                  builtIn:true, readOnly:true},
    {id:'recurring', name:'Recurring', emoji:'🔁', color:'#F4CA00', desc:'Repeats on a pattern',           builtIn:true, readOnly:true},
  ],
  custom:[],
};

// ── 10-behavior vocabulary (matches hq-core.js BEHAVIOR_HANDLERS) ──
const BEHAVIORS = [
  {id:'surface-index',   emoji:'🏠', name:'Surface on Index',       desc:'Appears in hero alert panel'},
  {id:'surface-checkin', emoji:'✅', name:'Surface in Check-In',     desc:'Prompts during relevant check-in stage'},
  {id:'energy-gate',     emoji:'🔋', name:'Energy Gate',             desc:'Hidden on survival-mode days'},
  {id:'block-cascade',   emoji:'🛑', name:'Block Cascade',           desc:'Marks as blocking in Project Brain, surfaces as urgent'},
  {id:'auto-defer',      emoji:'🔄', name:'Auto-Defer',              desc:'Pushed to tomorrow in DayBuilder if unresolved'},
  {id:'notify-save',     emoji:'🔔', name:'Notify on Save',          desc:'Toast shown when this flag is applied'},
  {id:'cascade-signal',  emoji:'📡', name:'Cascade Signal',          desc:'Notifies weekly planner + brain dump of change'},
  {id:'pin-daybuilder',  emoji:'📌', name:'Pin in DayBuilder',       desc:'Pinned to top of today\'s schedule, can\'t be displaced'},
  {id:'weekly-review',   emoji:'📆', name:'Add to Weekly Review',    desc:'Appears in end-of-week review even if unscheduled'},
  {id:'survival-safe',   emoji:'🛡', name:'Survival Safe',           desc:'Always shown, even on crash days — opposite of Energy Gate'},
];

const MODULES = [
  {id:'all',          name:'All Modules',     emoji:'🌐'},
  {id:'planning',     name:'Planning',        emoji:'📅'},
  {id:'health',       name:'Health Tracker',  emoji:'🏥'},
  {id:'finance',      name:'Finance',         emoji:'💰'},
  {id:'thought-jar',  name:'Thought Jar',     emoji:'🫙'},
  {id:'projects',     name:'Project Brain',   emoji:'🗂'},
  {id:'survival',     name:'Survival Mode',   emoji:'🛡️'},
  {id:'taskboard',    name:'Taskboards',      emoji:'📋'},
  {id:'life-admin',   name:'Life Admin',      emoji:'📁'},
  {id:'social',       name:'Social Brain',    emoji:'👥'},
  {id:'checkin',      name:'Check-In',        emoji:'✅'},
];

const PALETTE = [
  '#645EB7','#3A70B0','#4ECDC4','#2A7A4E','#8BB698',
  '#EF5886','#C96020','#B53030','#C49A00','#F4CA00',
  '#C8BAFF','#A8AAA9','#ABD7BF','#06D6A0','#FF6BA8',
];

// ── DB ──
let DB = {categories:[],flags:{priority:[],energy:[],time:[],context:[],status:[],wellbeing:[],system:[],custom:[]}};

function load(){
  try{
    const p=HQSafe.store.get(STORE,null);
    if(p && typeof p==='object'){
      DB={...DB,...p};
      // ── Safety: if categories got wiped (bad import, storage clear, etc.),
      //    clear sentinels so migrations re-run and restore all defaults ──
      if(!DB.categories||DB.categories.length===0){
        localStorage.removeItem(HQKeys.TAGS_MIGRATED_V2);
        localStorage.removeItem(HQKeys.TAGS_MIGRATED_V3);
        DB.categories=JSON.parse(JSON.stringify(DEFAULT_CATS));
      }
      // ── Safety: restore any completely empty built-in flag groups ──
      ['priority','energy','time','context','status','wellbeing','system'].forEach(g=>{
        if(!(DB.flags[g]||[]).length){
          DB.flags[g]=JSON.parse(JSON.stringify(DEFAULT_FLAGS[g]||[]));
        }
      });
      normalizeFlagBehaviors();
      migrateTagsV2();migrateTagsV3();migrateLayoutV1();return;
    }
  }catch(e){}
  DB={categories:JSON.parse(JSON.stringify(DEFAULT_CATS)),flags:JSON.parse(JSON.stringify(DEFAULT_FLAGS))};
  persist();
  migrateLayoutV1();
}

// ── MIGRATION v2: additive — merges new built-in subcats, Social, and new flag groups
// into existing user data without wiping customizations ──
// ── MIGRATION v3 (Phase 3): adds pushToCheckin field to health subcategories,
// adds new h-bodyparts and h-vitals subcategories, renames brain-dump → thought-jar
// in appliesTo arrays ──
function migrateTagsV2(){
  // Accept old sentinel key as already-done signal, then clean it up
  if(localStorage.getItem('hq-tags-migrated-v2')){ localStorage.removeItem('hq-tags-migrated-v2'); localStorage.setItem(HQKeys.TAGS_MIGRATED_V2,'1'); }
  if(localStorage.getItem(HQKeys.TAGS_MIGRATED_V2)) return;
  let changed=false;

  // 1. Merge subcategories into existing built-in categories
  DEFAULT_CATS.forEach(defCat=>{
    const existing=DB.categories.find(c=>c.id===defCat.id);
    if(existing && defCat.subcategories && defCat.subcategories.length){
      if(!existing.subcategories) existing.subcategories=[];
      defCat.subcategories.forEach(defSub=>{
        if(!existing.subcategories.find(s=>s.id===defSub.id)){
          existing.subcategories.push({...defSub});
          changed=true;
        }
      });
    }
    // Add missing built-in categories (e.g. Social)
    if(!existing){
      DB.categories.push(JSON.parse(JSON.stringify(defCat)));
      changed=true;
    }
  });

  // 2. Merge new flag groups
  ['status','wellbeing'].forEach(g=>{
    if(!DB.flags[g]) DB.flags[g]=[];
    (DEFAULT_FLAGS[g]||[]).forEach(defF=>{
      if(!DB.flags[g].find(f=>f.id===defF.id)){
        DB.flags[g].push({...defF});
        changed=true;
      }
    });
  });

  // 3. Merge new context flags
  if(!DB.flags.context) DB.flags.context=[];
  (DEFAULT_FLAGS.context||[]).forEach(defF=>{
    if(!DB.flags.context.find(f=>f.id===defF.id)){
      DB.flags.context.push({...defF});
      changed=true;
    }
  });

  if(changed) persist();
  localStorage.setItem(HQKeys.TAGS_MIGRATED_V2,'1');
}

// Phase 3 migration — runs independently, own sentinel
function migrateTagsV3(){
  // Accept old sentinel key as already-done signal, then clean it up
  if(localStorage.getItem('hq-tags-migrated-v3')){ localStorage.removeItem('hq-tags-migrated-v3'); localStorage.setItem(HQKeys.TAGS_MIGRATED_V3,'1'); }
  if(localStorage.getItem(HQKeys.TAGS_MIGRATED_V3)) return;
  let changed=false;

  // 1. Add pushToCheckin field to all health subcategories
  const healthCat=DB.categories.find(c=>c.id==='health');
  if(healthCat){
    const defaults=DEFAULT_CATS.find(c=>c.id==='health');
    (healthCat.subcategories||[]).forEach(sub=>{
      if(sub.pushToCheckin===undefined){
        const defSub=(defaults&&defaults.subcategories||[]).find(s=>s.id===sub.id);
        sub.pushToCheckin=defSub?!!defSub.pushToCheckin:false;
        changed=true;
      }
    });
    // Add missing new health subcategories (h-bodyparts, h-vitals)
    if(defaults){
      defaults.subcategories.forEach(defSub=>{
        if(!healthCat.subcategories.find(s=>s.id===defSub.id)){
          healthCat.subcategories.push({...defSub});
          changed=true;
        }
      });
    }
  }

  // 2. Rename brain-dump → thought-jar in all appliesTo arrays
  DB.categories.forEach(cat=>{
    if(cat.appliesTo&&cat.appliesTo.includes('brain-dump')){
      cat.appliesTo=cat.appliesTo.map(a=>a==='brain-dump'?'thought-jar':a);
      changed=true;
    }
  });
  Object.keys(DB.flags).forEach(g=>{
    (DB.flags[g]||[]).forEach(f=>{
      if(f.appliesTo&&f.appliesTo.includes('brain-dump')){
        f.appliesTo=f.appliesTo.map(a=>a==='brain-dump'?'thought-jar':a);
        changed=true;
      }
    });
  });

  if(changed) persist();
  localStorage.setItem(HQKeys.TAGS_MIGRATED_V3,'1');
}

// FIX-03: Register tag migrations with central HQMigrate hub so any page can trigger them
if (window.HQMigrate) {
  HQMigrate.register('tags-v2', migrateTagsV2);
  HQMigrate.register('tags-v3', migrateTagsV3);
}

// ── NORMALIZE: old custom flags used 'behavior' (string) before 'behaviors' (array) was adopted.
//    Convert silently so renderFlagItem never crashes on missing .behaviors.length.
function normalizeFlagBehaviors(){
  let changed=false;
  (DB.flags.custom||[]).forEach(f=>{
    if(f.behavior&&!f.behaviors){
      // Old singular form — wrap it. 'route-finance' was never a real behavior, skip it.
      const VALID_BEHAVIORS=['surface-index','surface-checkin','energy-gate','block-cascade',
        'auto-defer','notify-save','cascade-signal','pin-daybuilder','weekly-review','survival-safe'];
      f.behaviors=VALID_BEHAVIORS.includes(f.behavior)?[f.behavior]:[];
      delete f.behavior;
      changed=true;
    } else if(!f.behaviors){
      f.behaviors=[];
      changed=true;
    }
  });
  if(changed)persist();
}

// ── LAYOUT MIGRATION v1: 'brain-dump' was renamed 'thought-jar' in Phase 3.
//    Fix any stale saved layout that still has the old ID.
function migrateLayoutV1(){
  if(localStorage.getItem(HQKeys.LAYOUT_MIGRATED_V1))return;
  try{
    const raw=HQSafe.store.get(LAYOUT_KEY);
    if(raw){
      const layout=JSON.parse(raw);
      let changed=false;
      ['heroTools','hero2Tiles'].forEach(zone=>{
        if((layout[zone]||[]).includes('brain-dump')){
          layout[zone]=layout[zone].map(id=>id==='brain-dump'?'thought-jar':id);
          changed=true;
        }
      });
      if(changed)HQSafe.store.set(LAYOUT_KEY, layout);
    }
  }catch(e){}
  localStorage.setItem(HQKeys.LAYOUT_MIGRATED_V1,'1');
}

function persist(){
  HQSafe.store.set(STORE, DB);
  exposeAPI();
}

function exposeAPI(){
  // P2: window.TagEngine is DEPRECATED — HQStore is now the source of truth for all tag/category data.
  // This assignment is kept for backward compat during the P2 transition overlap.
  // Remove after P2 is fully verified and all consumers (taskboard, brain-dump, etc.) confirmed clean.
  window.TagEngine={
    getCategories:()=>DB.categories,
    getFlags:()=>DB.flags,
    getCatById:(id)=>DB.categories.find(c=>c.id===id),
    getSubcatById:(catId,subId)=>{
      const cat=DB.categories.find(c=>c.id===catId);
      return cat?(cat.subcategories||[]).find(s=>s.id===subId):null;
    },
    getFlagById:(id)=>{
      const groups=['priority','energy','time','context','status','wellbeing','system','custom'];
      for(const g of groups){const f=(DB.flags[g]||[]).find(f=>f.id===id);if(f)return f;}
      return null;
    },
    getAllFlags:()=>{
      const groups=['priority','energy','time','context','status','wellbeing','system','custom'];
      return groups.flatMap(g=>DB.flags[g]||[]);
    },
    getCheckinSubcategories:()=>{
      const result=[];
      DB.categories.forEach(cat=>{
        (cat.subcategories||[]).forEach(sub=>{
          if(sub.pushToCheckin){
            result.push({catId:cat.id,catName:cat.name,catEmoji:cat.emoji,catColor:cat.color,...sub});
          }
        });
      });
      return result;
    },
    getCategoriesForModule:(moduleId)=>DB.categories.filter(c=>{
      const at=c.appliesTo||['all'];
      return at.includes('all')||at.includes(moduleId);
    }),
  };
}

// ── TAB SWITCHER — render-callback dispatcher (NOT dead code) ──
// This function is intentionally NOT a delegate to HQTabs.sw().
// hq-components.js _patchSw() inspects window.sw.toString() at runtime:
//   • If the source contains "HQTabs.sw" → Pattern B: replaces this function
//     entirely with a bare HQTabs.sw delegate, STRIPPING all render callbacks.
//   • If the source does NOT contain "HQTabs.sw" → Pattern C/D: wraps it,
//     calling HQTabs.sw(id,btn) first (DOM work), then this function (renders).
// DO NOT add HQTabs.sw() to this body — it would break every tab's render.
function sw(id, btn) {
  if (id === 'ref')       { renderRef(); }
  if (id === 'reminders') { renderReminderWindows(); loadReminderConfig(); }
  if (id === 'layout')    { renderLayoutTab(); }
  if (id === 'profile')   { loadProfile(); renderPresetsList(); renderCheckinVisEditor(); }
  if (id === 'theme')     { loadThemePicker(); loadDensity(); loadDisplayPrefs(); renderBottomNavEditor(); renderShortcutsEditor(); }
  if (id === 'modules')   { renderModulesTab(); }
  if (id === 'storage')   { renderStorageTab(); }
  if (id === 'spaces')    { renderSpacesTab(); }
}

function openModal(id){document.getElementById(id)?.classList.add('show');}
function closeModal(id){document.getElementById(id)?.classList.remove('show');}

// ── STATS ──
function renderStats(){
  const cats=DB.categories.length;
  const subs=DB.categories.reduce((a,c)=>a+(c.subcategories||[]).length,0);
  const cust=DB.categories.filter(c=>!c.builtIn).length;
  const flags=(DB.flags.custom||[]).length;
  document.getElementById('st-cats').textContent=cats;
  document.getElementById('st-subs').textContent=subs;
  document.getElementById('st-cust').textContent=cust;
  document.getElementById('st-flags').textContent=flags;
  document.getElementById('custom-cat-count').textContent=cust+' custom';
}

// ── CATEGORIES ──
function renderCats(){
  const builtin=DB.categories.filter(c=>c.builtIn);
  const custom=DB.categories.filter(c=>!c.builtIn);
  document.getElementById('cat-list-builtin').innerHTML=builtin.map(renderCatItem).join('');
  document.getElementById('cat-list-custom').innerHTML=custom.length
    ?custom.map(renderCatItem).join('')
    :'<div class="empty"><div class="empty-ic">🏷️</div>No custom categories yet. Add yours below.</div>';
  // Auto-open any category that has subcategories so they're visible without needing a click
  DB.categories.forEach(c=>{
    if((c.subcategories||[]).length>0){
      document.getElementById('ci-'+c.id)?.classList.add('open');
    }
  });
  renderStats();
}

function renderCatItem(c){
  const subs=c.subcategories||[];
  const colorStyle=`background:${c.color}`;
  return `<div class="cat-item" id="ci-${c.id}">
    <div class="cat-item-hd" onclick="togCatItem('${c.id}')">
      <div class="cat-dot" style="${colorStyle}"></div>
      <div class="cat-em">${renderEmoji(c.emoji)}</div>
      <div class="cat-name">${esc(c.name)}</div>
      ${c.builtIn?`<div class="cat-badge">built-in</div>`:''}
      <div class="cat-badge">${subs.length} sub</div>
      <div class="cat-ar">▼</div>
    </div>
    <div class="cat-body">
      <div class="sub-list">${subs.length?subs.map(s=>`
        <div class="sub-item">
          <div class="sub-em">${renderEmoji(s.emoji)}</div>
          <div style="flex:1;font-size:11px;font-weight:700;color:var(--text)">${esc(s.name)}</div>
          ${s.pushToCheckin?'<span style="font-size:9px;font-weight:800;color:var(--purple);background:rgba(100,94,183,.12);border-radius:6px;padding:2px 5px">→ Check-In</span>':''}
          ${s.pushToIndex?'<span style="font-size:9px;font-weight:800;color:var(--cyan,#3dd6cd);background:rgba(61,214,205,.1);border-radius:6px;padding:2px 5px">→ Index</span>':''}
          ${s.pushToWeeklyReview?'<span style="font-size:9px;font-weight:800;color:var(--green,#3dd68c);background:rgba(61,214,140,.1);border-radius:6px;padding:2px 5px">→ Weekly</span>':''}
          ${(s.itemTypes&&!s.itemTypes.includes('all'))?`<span style="font-size:9px;color:var(--muted);background:rgba(255,255,255,.05);border-radius:6px;padding:2px 5px">${s.itemTypes.join(', ')}</span>`:''}
          <button class="btn-s" style="padding:2px 7px;font-size:10px" onclick="toggleSubPushToCheckin('${c.id}','${s.id}',${!s.pushToCheckin})" title="${s.pushToCheckin?'Remove from check-in':'Push to check-in'}">${s.pushToCheckin?'✅':'⬜'}</button>
          <button class="btn-d" onclick="delSub('${c.id}','${s.id}')">✕</button>
        </div>`).join(''):'<div style="font-size:11px;color:var(--muted);padding:4px 0">No subcategories yet.</div>'}
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <button class="btn-s" onclick="openAddSub('${c.id}')">+ Add Subcategory</button>
        ${!c.builtIn?`<button class="btn-s" onclick="openEditCat('${c.id}')">✏️ Edit</button><button class="btn-d" onclick="delCat('${c.id}')">🗑️ Delete</button>`:''}
      </div>
    </div>
  </div>`;
}

function togCatItem(id){document.getElementById('ci-'+id)?.classList.toggle('open');}

function openAddCat(){
  document.getElementById('cm-edit-id').value='';
  document.getElementById('cm-name').value='';
  document.getElementById('cm-emoji').value='';
  document.querySelector('#cat-modal .modal-title').textContent='➕ Add Category';
  buildColorRow('cm-colors',PALETTE,'#645EB7');
  buildModChips('cm-modules',['all']);
  openModal('cat-modal');
}

function openEditCat(id){
  const c=DB.categories.find(x=>x.id===id);if(!c)return;
  document.getElementById('cm-edit-id').value=id;
  document.getElementById('cm-name').value=c.name;
  document.getElementById('cm-emoji').value=c.emoji;updateEmojiPreview('cm-emoji','cm-emoji-preview');
  document.querySelector('#cat-modal .modal-title').textContent='✏️ Edit Category';
  buildColorRow('cm-colors',PALETTE,c.color);
  buildModChips('cm-modules',c.appliesTo||['all']);
  openModal('cat-modal');
}


// ── Emoji input preview (supports bi- Bootstrap icon names) ──────────────────
function updateEmojiPreview(inputId, previewId) {
    const val = (document.getElementById(inputId) || {}).value || '';
    const el = document.getElementById(previewId);
    if (!el) return;
    if (val.startsWith('bi-')) {
        el.innerHTML = '<i class="bi ' + val + '" style="font-size:20px;"></i>';
    } else {
        el.textContent = val;
    }
}

function saveCat(){
  const name=document.getElementById('cm-name').value.trim();
  const emoji=document.getElementById('cm-emoji').value.trim()||'🏷️';
  if(!name)return;
  const color=getSelColor('cm-colors')||PALETTE[0];
  const appliesTo=getSelMods('cm-modules');
  const editId=document.getElementById('cm-edit-id').value;
  if(editId){
    const c=DB.categories.find(x=>x.id===editId);
    if(c){c.name=name;c.emoji=emoji;c.color=color;c.appliesTo=appliesTo;}
  } else {
    DB.categories.push({id:uid(),name,emoji,color,builtIn:false,subcategories:[],appliesTo});
  }
  persist();closeModal('cat-modal');renderCats();HQToast.show('🏷️ Category saved!');
  // P2: keep HQConfig in sync after every save
  if(window.HQConfig&&typeof window.HQConfig.refresh==='function')window.HQConfig.refresh();
}

async function delCat(id){
  if(!(await HQConfirm.ask('Delete this category?', {danger:true})))return;
  DB.categories=DB.categories.filter(c=>c.id!==id);
  persist();renderCats();HQToast.show('🗑️ Category deleted');
  if(window.HQConfig&&typeof window.HQConfig.refresh==='function')window.HQConfig.refresh();
}

function openAddSub(catId){
  document.getElementById('sm-cat-id').value=catId;
  document.getElementById('sm-name').value='';
  document.getElementById('sm-emoji').value='';
  const checkinRow=document.getElementById('sm-checkin-row');
  const checkinChk=document.getElementById('sm-push-checkin');
  if(checkinRow){checkinRow.style.display=catId==='health'?'':'none';}
  if(checkinChk){checkinChk.checked=false;}
  openModal('sub-modal');
}

function saveSub(){
  const catId=document.getElementById('sm-cat-id').value;
  const name=document.getElementById('sm-name').value.trim();
  const emoji=document.getElementById('sm-emoji').value.trim()||'🔹';
  const pushToCheckin=document.getElementById('sm-push-checkin')?.checked||false;
  // P2 schema extensions
  const pushToIndex=document.getElementById('sm-push-index')?.checked||false;
  const pushToWeeklyReview=document.getElementById('sm-push-weekly')?.checked||false;
  const itemTypesSel=document.getElementById('sm-item-types');
  const itemTypes=itemTypesSel?Array.from(itemTypesSel.selectedOptions).map(o=>o.value):['all'];
  if(!name)return;
  const c=DB.categories.find(x=>x.id===catId);
  if(!c)return;
  if(!c.subcategories)c.subcategories=[];
  c.subcategories.push({id:uid(),name,emoji,pushToCheckin,pushToIndex,pushToWeeklyReview,itemTypes:itemTypes.length?itemTypes:['all']});
  persist();closeModal('sub-modal');renderCats();HQToast.show('✅ Subcategory added!');
  // P2: keep HQConfig in sync after every save
  if(window.HQConfig&&typeof window.HQConfig.refresh==='function')window.HQConfig.refresh();
}

function delSub(catId,subId){
  const c=DB.categories.find(x=>x.id===catId);if(!c)return;
  c.subcategories=(c.subcategories||[]).filter(s=>s.id!==subId);
  persist();renderCats();HQToast.show('🗑️ Subcategory removed');
  if(window.HQConfig&&typeof window.HQConfig.refresh==='function')window.HQConfig.refresh();
}

function toggleSubPushToCheckin(catId,subId,val){
  const c=DB.categories.find(x=>x.id===catId);if(!c)return;
  const s=(c.subcategories||[]).find(x=>x.id===subId);if(!s)return;
  s.pushToCheckin=!!val;
  persist();renderCats();
  HQToast.show(val?'✅ Will surface in Check-In':'⬜ Removed from Check-In');
  if(window.HQConfig&&typeof window.HQConfig.refresh==='function')window.HQConfig.refresh();
}

// ── FLAGS ──
function renderFlags(){
  const groups=['priority','energy','time','context','status','wellbeing','system','custom'];
  groups.forEach(g=>{
    const flags=DB.flags[g]||[];
    const el=document.getElementById('fl-'+g);
    if(!el)return;
    if(!flags.length&&g==='custom'){
      el.innerHTML='<div class="empty"><div class="empty-ic">🚩</div>No custom flags yet. Add yours below.</div>';
    } else {
      el.innerHTML=flags.map(f=>renderFlagItem(f,g)).join('');
    }
    const countEl=document.getElementById('fgc-'+g);
    if(countEl)countEl.textContent=flags.length+' flag'+(flags.length!==1?'s':'');
  });
  renderStats();
}

function renderFlagItem(f,group){
  const behs=(f.behaviors||[]);
  const behPills=behs.map(b=>{
    const def=BEHAVIORS.find(x=>x.id===b);
    return def?`<span class="fi-beh-pill">${renderEmoji(def.emoji)} ${def.name}</span>`:'';
  }).join('');
  const acts=f.readOnly?'':`
    <div class="fi-acts">
      <button class="btn-s" style="padding:4px 9px;font-size:10px" onclick="openEditFlag('${f.id}','${group}')">✏️</button>
      ${!f.builtIn?`<button class="btn-d" style="padding:4px 9px;font-size:10px" onclick="delFlag('${f.id}','${group}')">🗑️</button>`:''}
    </div>`;
  return `<div class="flag-item">
    <div class="fi-em">${renderEmoji(f.emoji)}</div>
    <div class="fi-info">
      <div class="fi-name">
        <div class="fi-dot" style="background:${f.color}"></div>
        ${esc(f.name)}
        ${f.builtIn?'<span style="font-size:9px;color:var(--muted);font-weight:400">(built-in)</span>':''}
      </div>
      <div class="fi-desc">${esc(f.desc||'')}</div>
      ${behPills?`<div class="fi-behaviors">${behPills}</div>`:''}
    </div>
    ${acts}
  </div>`;
}

function openAddFlag(){
  document.getElementById('fm-edit-id').value='';
  document.getElementById('fm-name').value='';
  document.getElementById('fm-emoji').value='';
  document.getElementById('fm-desc').value='';
  document.querySelector('#flag-modal .modal-title').textContent='➕ Add Custom Flag';
  buildColorRow('fm-colors',PALETTE,PALETTE[0]);
  buildColorSelects('fm-color-sel',PALETTE,PALETTE[0]);
  buildModChips('fm-modules',['all']);
  buildBehaviors('fm-behaviors',[]);
  openModal('flag-modal');
}

function openEditFlag(id,group){
  const f=(DB.flags[group]||[]).find(x=>x.id===id);if(!f)return;
  document.getElementById('fm-edit-id').value=id;
  document.getElementById('fm-edit-group').value=group;
  document.getElementById('fm-name').value=f.name;
  document.getElementById('fm-emoji').value=f.emoji;updateEmojiPreview('fm-emoji','fm-emoji-preview');
  document.getElementById('fm-desc').value=f.desc||'';
  document.querySelector('#flag-modal .modal-title').textContent='✏️ Edit Flag';
  buildColorRow('fm-colors',PALETTE,f.color);
  buildColorSelects('fm-color-sel',PALETTE,f.color);
  buildModChips('fm-modules',f.appliesTo||['all']);
  buildBehaviors('fm-behaviors',f.behaviors||[]);
  openModal('flag-modal');
}

function saveFlag(){
  const name=document.getElementById('fm-name').value.trim();
  const emoji=document.getElementById('fm-emoji').value.trim()||'🚩';
  if(!name)return;
  const desc=document.getElementById('fm-desc').value.trim();
  const colorSel=document.getElementById('fm-color-sel');
  const color=colorSel.value||PALETTE[0];
  const appliesTo=getSelMods('fm-modules');
  const behaviors=getSelBehaviors('fm-behaviors');
  const editId=document.getElementById('fm-edit-id').value;
  const editGroup=document.getElementById('fm-edit-group')?.value||'custom';
  if(!DB.flags.custom)DB.flags.custom=[];
  if(editId){
    // Search the stored group first, then fall back to all groups
    let f=(DB.flags[editGroup]||[]).find(x=>x.id===editId);
    if(!f){
      const groups=['priority','energy','time','context','status','wellbeing','system','custom'];
      for(const g of groups){const found=(DB.flags[g]||[]).find(x=>x.id===editId);if(found){f=found;break;}}
    }
    if(f){f.name=name;f.emoji=emoji;f.desc=desc;f.color=color;f.appliesTo=appliesTo;f.behaviors=behaviors;}
  } else {
    DB.flags.custom.push({id:uid(),name,emoji,desc,color,appliesTo,behaviors,builtIn:false});
  }
  persist();closeModal('flag-modal');renderFlags();renderStats();HQToast.show('🚩 Flag saved!');
  if(window.HQConfig&&typeof window.HQConfig.refresh==='function')window.HQConfig.refresh();
}

async function delFlag(id,group){
  if(!(await HQConfirm.ask('Delete this flag?', {danger:true})))return;
  DB.flags[group]=(DB.flags[group]||[]).filter(f=>f.id!==id);
  persist();renderFlags();renderStats();HQToast.show('🗑️ Flag deleted');
  if(window.HQConfig&&typeof window.HQConfig.refresh==='function')window.HQConfig.refresh();
}

function togFG(id){document.getElementById(id)?.classList.toggle('open');}

// ── QUICK REF ──
function renderRef(){
  const catEl=document.getElementById('qr-cats');
  catEl.innerHTML=DB.categories.map(c=>
    `<div class="qr-cat"><div class="qr-cat-dot" style="background:${c.color}"></div><span>${renderEmoji(c.emoji)}</span><span>${esc(c.name)}</span></div>`
  ).join('');
  const groups=['priority','energy','time','context','status','wellbeing','custom'];
  groups.forEach(g=>{
    const el=document.getElementById('qr-'+g);if(!el)return;
    el.innerHTML=(DB.flags[g]||[]).map(f=>
      `<div class="qr-flag"><div class="fi-dot" style="background:${f.color}"></div><span>${renderEmoji(f.emoji)}</span><span>${esc(f.name)}</span></div>`
    ).join('');
  });
  document.getElementById('qr-custom-section').style.display=(DB.flags.custom||[]).length?'':'none';
}

// ── REMINDER WINDOWS (existing, expanded) ──
const RW_KEY = HQKeys.REMINDER_CONFIG;
const RW_DEFAULTS = [
  {id:'morning', emoji:'🌅', label:'Morning Check-In',  sub:'6:00 – 9:00 AM',  start:6,  end:9,  on:true},
  {id:'midday',  emoji:'☀️', label:'Midday Check-In',   sub:'12:00 – 3:00 PM', start:12, end:15, on:true},
  {id:'evening', emoji:'🌆', label:'Evening Check-In',  sub:'6:00 – 9:00 PM',  start:18, end:21, on:true},
  {id:'eod',     emoji:'🌙', label:'End of Day Log',    sub:'10:00 PM – 12:00 AM',start:22,end:24,on:false},
];

function loadRC(){
  try{
    const s=HQSafe.store.get(RW_KEY);
    return s?JSON.parse(s):{};
  }catch(e){return {};}
}

function loadRW(){
  const saved=loadRC().checkinWindows||null;
  if(!saved)return RW_DEFAULTS.map(w=>({...w}));
  return RW_DEFAULTS.map(def=>{
    const m=saved.find(s=>s.id===def.id);
    return m?{...def,on:m.on}:{...def};
  });
}

function saveRW(windows){
  const rc=loadRC();
  rc.checkinWindows=windows.map(w=>({id:w.id,label:w.label,start:w.start,end:w.end,on:w.on}));
  HQSafe.store.set(RW_KEY, rc);
}

function renderReminderWindows(){
  const el=document.getElementById('reminder-windows-list');if(!el)return;
  const windows=loadRW();
  el.innerHTML=windows.map(w=>`
    <div class="rw-row${w.on?' on':''}" onclick="toggleRW('${w.id}')" id="rw-row-${w.id}">
      <span class="rw-ico">${renderEmoji(w.emoji)}</span>
      <div class="rw-info"><div class="rw-label">${w.label}</div><div class="rw-sub">${w.sub}</div></div>
      <span class="rw-badge">${w.on?'ON':'OFF'}</span>
    </div>`).join('');
}

function toggleRW(id){
  const windows=loadRW();
  const w=windows.find(x=>x.id===id);if(!w)return;
  w.on=!w.on;saveRW(windows);renderReminderWindows();
  HQToast.show(w.on?`🔔 ${w.label} enabled`:`🔕 ${w.label} disabled`);
}

function loadReminderConfig(){
  const rc=loadRC();
  const setChk=(id,val)=>{const el=document.getElementById(id);if(el)el.checked=!!val;};
  const setVal=(id,val)=>{const el=document.getElementById(id);if(el)el.value=val||'';};
  setChk('rem-walk-on',  rc.walkReminder?.on);
  setVal('rem-walk-time',rc.walkReminder?.time||'20:00');
  setChk('rem-dream-on',  rc.dreamReminder?.on);
  setVal('rem-dream-time',rc.dreamReminder?.time||'08:00');
  setChk('rem-db-on',  rc.daybuilderReminder?.on);
  setVal('rem-db-time',rc.daybuilderReminder?.time||'19:00');
  setChk('rem-monthly-on',rc.monthlyReview?.on);
  // New batch2 reminders
  setChk('rem-jar-on',      rc.jarNudge?.on);
  setVal('rem-jar-time',    rc.jarNudge?.time||'21:00');
  setChk('rem-health-on',   rc.healthLog?.on);
  setVal('rem-health-time', rc.healthLog?.time||'21:30');
  setChk('rem-firebird-on', rc.firebirdCooldown?.on);
  setVal('rem-firebird-hours', rc.firebirdCooldown?.hours||2);
}

function saveReminderConfig(){
  const rc=loadRC();
  rc.walkReminder={on:document.getElementById('rem-walk-on')?.checked,time:document.getElementById('rem-walk-time')?.value};
  rc.dreamReminder={on:document.getElementById('rem-dream-on')?.checked,time:document.getElementById('rem-dream-time')?.value};
  rc.daybuilderReminder={on:document.getElementById('rem-db-on')?.checked,time:document.getElementById('rem-db-time')?.value};
  rc.monthlyReview={on:document.getElementById('rem-monthly-on')?.checked};
  // New batch2 reminders
  rc.jarNudge={on:document.getElementById('rem-jar-on')?.checked, time:document.getElementById('rem-jar-time')?.value};
  rc.healthLog={on:document.getElementById('rem-health-on')?.checked, time:document.getElementById('rem-health-time')?.value};
  rc.firebirdCooldown={on:document.getElementById('rem-firebird-on')?.checked, hours:parseInt(document.getElementById('rem-firebird-hours')?.value)||2};
  HQSafe.store.set(RW_KEY, rc);
  if(window.HQConfig&&typeof window.HQConfig.refresh==='function')window.HQConfig.refresh();
  HQToast.show('✅ Reminder settings saved');
}

// ── INDEX LAYOUT ──
const LAYOUT_KEY=HQKeys.INDEX_LAYOUT;
const ALL_MODULES=[
  {id:'timeline',      emoji:'📅', name:'Timeline'},
  {id:'day-builder',   emoji:'🗓', name:'DayBuilder'},
  {id:'money-brain',   emoji:'💰', name:'Money Brain'},
  {id:'kitchen-brain', emoji:'🍳', name:'Kitchen Brain'},
  {id:'global-tracker',emoji:'🌍', name:'Global Data'},
  {id:'thought-jar',   emoji:'🫙', name:'Thought Jar'},
  {id:'checkin',       emoji:'✅', name:'Check-In'},
  {id:'project-brain', emoji:'🗂', name:'Project Brain'},
  {id:'taskboard',     emoji:'📋', name:'Taskboards'},
  {id:'health-tracker',emoji:'🩺', name:'Health Tracker'},
  {id:'walking-tracker',emoji:'👟',name:'Walking Tracker'},
  {id:'dream-journal', emoji:'💭', name:'Dream Journal'},
  {id:'monthly-planner',emoji:'🗓️',name:'Monthly Planner'},
  {id:'weekly-planner',emoji:'📆', name:'Weekly Planner'},
  {id:'deep-clean',    emoji:'🧹', name:'Deep Clean'},
  {id:'firebird-protocol',emoji:'🔥',name:'Firebird Protocol'},
  {id:'survival-mode', emoji:'🛟', name:'Survival Mode'},
  {id:'routines-prepwork',emoji:'🔁',name:'Prepwork + Routines'},
];

const LAYOUT_DEFAULTS={
  heroTools:['timeline','day-builder','money-brain','kitchen-brain','health-tracker'],
  hero2Tiles:['global-tracker','thought-jar','checkin'],
};

let _layout=null;
let _dragId=null;

function loadLayoutData(){
  try{
    const s=HQSafe.store.get(LAYOUT_KEY);
    if(s)return JSON.parse(s);
  }catch(e){}
  return JSON.parse(JSON.stringify(LAYOUT_DEFAULTS));
}

function renderLayoutTab(){
  _layout=loadLayoutData();
  renderZone('hero','zone-hero-chips',5);
  renderZone('h2','zone-h2-chips',3);
  renderPool();
}

function renderZone(zone,chipsId,max){
  const ids=_layout[zone==='hero'?'heroTools':'hero2Tiles']||[];
  const el=document.getElementById(chipsId);if(!el)return;
  el.innerHTML=ids.map(id=>{
    const m=ALL_MODULES.find(x=>x.id===id)||{emoji:'📌',name:id};
    return `<div class="layout-chip" draggable="true" data-id="${id}" data-zone="${zone}"
      ondragstart="chipDragStart(event)">${renderEmoji(m.emoji)} ${m.name}
      <span class="rm" onclick="removeFromZone('${zone}','${id}')">×</span>
    </div>`;
  }).join('');
  const label=el.previousElementSibling;
  if(label)label.textContent=zone==='hero'?`HERO TOOLS (${ids.length}/${max})`:`QUICK TILES (${ids.length}/${max})`;
}

function renderPool(){
  const el=document.getElementById('layout-pool');if(!el)return;
  const assigned=[...(_layout.heroTools||[]),...(_layout.hero2Tiles||[])];
  const available=ALL_MODULES.filter(m=>!assigned.includes(m.id));
  el.innerHTML=available.map(m=>`
    <div class="pool-chip" onclick="addToZone(event,'${m.id}')">${renderEmoji(m.emoji)} ${m.name}</div>`
  ).join('');
}

function addToZone(ev,id){
  // Ask which zone if both available
  const heroFull=(_layout.heroTools||[]).length>=5;
  const h2Full=(_layout.hero2Tiles||[]).length>=3;
  if(!heroFull){
    _layout.heroTools=(_layout.heroTools||[]).concat(id);
  } else if(!h2Full){
    _layout.hero2Tiles=(_layout.hero2Tiles||[]).concat(id);
  } else {
    HQToast.show('Both zones are full — remove an item first');return;
  }
  renderZone('hero','zone-hero-chips',5);
  renderZone('h2','zone-h2-chips',3);
  renderPool();
}

function removeFromZone(zone,id){
  if(zone==='hero') _layout.heroTools=(_layout.heroTools||[]).filter(x=>x!==id);
  else              _layout.hero2Tiles=(_layout.hero2Tiles||[]).filter(x=>x!==id);
  renderZone('hero','zone-hero-chips',5);
  renderZone('h2','zone-h2-chips',3);
  renderPool();
}

function chipDragStart(ev){_dragId=ev.target.dataset.id;}
function zoneDragOver(ev){ev.preventDefault();ev.currentTarget.classList.add('drag-over');}
function zoneDragLeave(ev){ev.currentTarget.classList.remove('drag-over');}
function zoneDrop(ev,zone){
  ev.preventDefault();ev.currentTarget.classList.remove('drag-over');
  if(!_dragId)return;
  const fromZone=ev.dataTransfer?null:null; // just move between zones
  removeFromZone('hero',_dragId);removeFromZone('h2',_dragId);
  if(zone==='hero'&&(_layout.heroTools||[]).length<5)_layout.heroTools=(_layout.heroTools||[]).concat(_dragId);
  else if(zone==='h2'&&(_layout.hero2Tiles||[]).length<3)_layout.hero2Tiles=(_layout.hero2Tiles||[]).concat(_dragId);
  _dragId=null;
  renderZone('hero','zone-hero-chips',5);renderZone('h2','zone-h2-chips',3);renderPool();
}

function saveLayout(){
  HQSafe.store.set(LAYOUT_KEY, _layout);
  if(window.HQConfig&&typeof window.HQConfig.refresh==='function')window.HQConfig.refresh();
  HQToast.show('🏠 Index layout saved — refresh index to apply');
}

function resetLayout(){
  _layout=JSON.parse(JSON.stringify(LAYOUT_DEFAULTS));
  renderZone('hero','zone-hero-chips',5);renderZone('h2','zone-h2-chips',3);renderPool();
  HQToast.show('↺ Reset to defaults');
}

// ── PROFILE ──
const PF_KEY=HQKeys.PROFILE;

function loadPF(){try{return HQSafe.store.get(PF_KEY, {});}catch(e){return {};}}

function loadProfile(){
  const pf=loadPF();
  const setVal=(id,v)=>{const el=document.getElementById(id);if(el)el.value=v||'';};
  const setChk=(id,v)=>{const el=document.getElementById(id);if(el)el.checked=v!==false;};
  setVal('pf-name',pf.name);
  setVal('pf-walking-goal',pf.walkingGoal||3100);
  setVal('pf-shift-start',pf.shiftStart||'09:00');
  setVal('pf-shift-end',pf.shiftEnd||'17:00');

  // Timezone
  const tzEl = document.getElementById('pf-timezone');
  if(tzEl){
    if(!pf.timezone){
      // Auto-detect on first load
      try{ tzEl.value = Intl.DateTimeFormat().resolvedOptions().timeZone; }catch(e){}
    } else {
      tzEl.value = pf.timezone;
    }
  }

  // Units
  const unit=pf.walkingUnit||'mi';
  document.querySelectorAll('#pf-unit-seg .seg-btn').forEach(btn=>{
    btn.classList.toggle('on',btn.dataset.unit===unit);
  });

  // Schedule type
  const stype=pf.scheduleType||'standard';
  document.querySelectorAll('#pf-sched-type-seg .seg-btn').forEach(btn=>{
    btn.classList.toggle('on',btn.dataset.stype===stype);
  });
  _applySchedTypeUI(stype);

  // Workdays
  const workdays=pf.workdays!=null?pf.workdays:[1,2,3,4,5];
  document.querySelectorAll('.pf-day').forEach(el=>{
    const d=parseInt(el.dataset.day);
    el.classList.toggle('on',workdays.includes(d));
  });

  // Capture route
  const route=pf.defaultCaptureRoute||'jar-only';
  document.querySelectorAll('#pf-capture-seg .seg-btn').forEach(btn=>{
    btn.classList.toggle('on',btn.dataset.route===route);
  });

  // Flag panel
  const fp=pf.indexFlagTypes||{pastdue:true,expiring:true,missed:true,urgent:true};
  setChk('ft-pastdue',fp.pastdue!==false);
  setChk('ft-expiring',fp.expiring!==false);
  setChk('ft-missed',fp.missed!==false);
  setChk('ft-urgent',fp.urgent!==false);
}

function _applySchedTypeUI(stype){
  const hintsMap={
    standard:'Mon–Fri or custom days with defined start/end times.',
    overnight:'Night shift — set the start/end times for your overnight hours.',
    flexible:'Flexible or no fixed schedule. Work days and shift times are not used.'
  };
  const hintEl=document.getElementById('pf-sched-type-hint');
  if(hintEl) hintEl.textContent=hintsMap[stype]||'';
  const showRows=stype!=='flexible';
  const wdRow=document.getElementById('pf-workdays-row');
  const shRow=document.getElementById('pf-shift-row');
  if(wdRow) wdRow.style.display=showRows?'':'none';
  if(shRow) shRow.style.display=showRows?'':'none';
}

function toggleDay(el){el.classList.toggle('on');saveProfile();}

function setUnit(btn){
  document.querySelectorAll('#pf-unit-seg .seg-btn').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on');
  saveProfile();
}

function setSchedType(btn){
  document.querySelectorAll('#pf-sched-type-seg .seg-btn').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on');
  _applySchedTypeUI(btn.dataset.stype);
  saveProfile();
}

function setCaptureRoute(btn){
  document.querySelectorAll('#pf-capture-seg .seg-btn').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on');
  saveProfile();
}

function saveProfile(){
  const pf=loadPF();
  pf.name=document.getElementById('pf-name')?.value.trim()||pf.name;
  pf.walkingGoal=parseFloat(document.getElementById('pf-walking-goal')?.value)||pf.walkingGoal;
  pf.shiftStart=document.getElementById('pf-shift-start')?.value||pf.shiftStart;
  pf.shiftEnd=document.getElementById('pf-shift-end')?.value||pf.shiftEnd;
  // Timezone
  const tzVal=document.getElementById('pf-timezone')?.value;
  if(tzVal) pf.timezone=tzVal;
  // Units
  const unitBtn=document.querySelector('#pf-unit-seg .seg-btn.on');
  if(unitBtn) pf.walkingUnit=unitBtn.dataset.unit;
  // Schedule type
  const stypeBtn=document.querySelector('#pf-sched-type-seg .seg-btn.on');
  if(stypeBtn) pf.scheduleType=stypeBtn.dataset.stype;
  // Workdays (only relevant when not flexible)
  if(pf.scheduleType!=='flexible'){
    pf.workdays=[...document.querySelectorAll('.pf-day.on')].map(el=>parseInt(el.dataset.day));
  }
  // Capture route
  const routeBtn=document.querySelector('#pf-capture-seg .seg-btn.on');
  if(routeBtn) pf.defaultCaptureRoute=routeBtn.dataset.route;

  pf.indexFlagTypes={
    pastdue:document.getElementById('ft-pastdue')?.checked!==false,
    expiring:document.getElementById('ft-expiring')?.checked!==false,
    missed:document.getElementById('ft-missed')?.checked!==false,
    urgent:document.getElementById('ft-urgent')?.checked!==false,
  };
  HQSafe.store.set(PF_KEY, pf);
  // P3: full refresh so all config keys stay in sync (not just profile)
  if(window.HQConfig&&typeof window.HQConfig.refresh==='function'){window.HQConfig.refresh();}
  else if(window.HQConfig){window.HQConfig.profile=pf;}
  HQToast.show('👤 Profile saved');
}

// ── THEME PICKER ──
const THEME_DEFS = {
  // ── Classic palettes ──
  lilac:        { label:'🌸 Lilac',         desc:'Violet-plum. Deep purple darks, warm lavender lights.',        swatches:['#8030c8','#50e078','#f0d8ff'] },
  harbor:       { label:'🌅 Harbor',        desc:'Ocean teal. Deep aquatic darks, warm sandy lights.',           swatches:['#1878a0','#40f890','#90d0e8'] },
  ember:        { label:'🍂 Ember',         desc:'Rust-wine. Smoldering darks, warm ivory lights.',              swatches:['#8a2830','#50e870','#f5c8b0'] },
  volt:         { label:'⚡ Volt',          desc:'Electric blue. Cold indigo darks, crisp blue-white lights.',   swatches:['#5878ff','#20f870','#a0b8ff'] },
  // ── Norse / Wyrdwell palettes ──
  seidr:        { label:'🔮 Seidr',         desc:'Deep void-purple. Mystical cosmic darks, violet light.',       swatches:['#C070F0','#80D020','#EAD0FF'] },
  muspell:      { label:'🔥 Múspell',       desc:'Ember tide. Cold abyss darks, volcanic orange accent.',        swatches:['#FF8020','#30D040','#FFCF90'] },
  'blod-rune':  { label:'🩸 Blód-Rune',    desc:'Blood magic. Deep crimson darks, sanguine reds.',              swatches:['#FF1020','#40C870','#FFB0B8'] },
  yggdrasil:    { label:'🌳 Yggdrasil',     desc:'World tree. Forest-dark blacks, electric lime accent.',        swatches:['#90C800','#60D860','#D0F080'] },
  holt:         { label:'🌿 Holt',          desc:'Deep grove. Dark forest blacks, emerald-teal accent.',         swatches:['#30C870','#60D8A0','#A0F0C0'] },
  freyja:       { label:'💗 Freyja',        desc:'Love & war. Dark onyx blacks, hot fuchsia-pink accent.',       swatches:['#F060C8','#60D898','#FFB8F0'] },
  bifrost:      { label:'🌈 Bifrost',       desc:'Rainbow bridge. Void blacks, cyan-ice blue accent.',           swatches:['#00E8FF','#50E8A8','#B0F8FF'] },
  urdarbr:      { label:'🌊 Urðarbrunnr',  desc:'Fate\'s well. Obsidian darks, aged amber-brown accent.',        swatches:['#A3662B','#348192','#D8A870'] },
  ginnungagap:  { label:'🌌 Ginnungagap',  desc:'Primordial void. Deep blue-black, cosmic electric-blue.',      swatches:['#1468C8','#60D830','#70B0FF'] },
  var:          { label:'🌟 Vár',           desc:'Spring oath. Twilight indigo darks, periwinkle-blue accent.',  swatches:['#7888F8','#30C848','#B0C0FF'] },
  njordr:       { label:'⚓ Njörðr',        desc:'Sea-god tide. Deep ocean darks, blazing coral accent.',        swatches:['#FF7030','#20E898','#FFB890'] },
};

function _getStoredThemeState() {
  try { return HQSafe.store.get(HQKeys.THEME) || {}; } catch(e) { return {}; }
}

// ════════════════════════════════════════════════════════════
//  THEME & MODE CONTROLLER
// ════════════════════════════════════════════════════════════

/**
 * Loads the current theme/mode state into the UI
 * This should be called inside your renderTheme tab logic
 */
function loadThemePicker() {
  const stored = _getStoredThemeState();
  const currentTheme = stored.theme || 'lilac';
  const currentMode  = stored.mode  || 'dark';
  renderThemeCards(currentTheme, currentMode);
  renderModePills(currentMode);
}

/**
 * Applies and saves the color palette (lilac, harbor, etc.)
 */
window.applyThemeStyle = function(themeId) {
  const state = _getStoredThemeState();
  const mode  = state.mode || 'dark';
  if (typeof hqSetTheme === 'function') hqSetTheme(themeId, true, mode);
  else {
    try { HQSafe.store.set(HQKeys.THEME, {theme:themeId, mode, manual:true}); } catch(e) {}
    document.documentElement.setAttribute('data-theme', themeId);
  }
  loadThemePicker();
};

/**
 * Applies and saves the appearance mode (light, dark)
 */
window.applyAppearanceMode = function(modeId) {
  selectMode(modeId);
};
function renderThemeCards(activeTheme, activeMode) {
  const wrap = document.getElementById('th-palette-grid');
  if (!wrap) return;
  wrap.innerHTML = Object.entries(THEME_DEFS).map(([key, def]) => {
    const isActive = key === activeTheme;
    return `<div class="th-palette-card ${isActive?'active':''}" onclick="selectTheme('${key}')">
      <div class="th-palette-swatches">${def.swatches.map(c=>`<span class="th-swatch" style="background:${c}"></span>`).join('')}</div>
      <div class="th-palette-label">${def.label}</div>
      <div class="th-palette-desc">${def.desc}</div>
    </div>`;
  }).join('');
}

function renderModePills(activeMode) {
  const wrap = document.getElementById('th-mode-pills');
  if (!wrap) return;
  const modes = [
    { id: 'dark',  label: '🌙 Dark'  },
    { id: 'light', label: '☀️ Light' },
  ];
  wrap.innerHTML = modes.map(m => {
    const isActive = m.id === activeMode;
    return `<button class="tbs-btn ${isActive ? 'active' : ''}" data-mode="${m.id}" onclick="selectMode('${m.id}')">${m.label}</button>`;
  }).join('');
}

function selectTheme(t) {
  const state = _getStoredThemeState();
  const mode = state.mode || 'dark';
  if (typeof hqSetTheme === 'function') hqSetTheme(t, true, mode);
  else {
    try { HQSafe.store.set(HQKeys.THEME, {theme:t, mode:mode, manual:true}); } catch(e) {}
    document.documentElement.setAttribute('data-theme', t);
  }
  renderThemeCards(t, mode);
  HQToast.show('🎨 Theme set to ' + (THEME_DEFS[t]?.label || t));
}

function selectMode(m) {
  const state = _getStoredThemeState();
  const theme = state.theme || 'lilac';
  if (typeof hqSetTheme === 'function') hqSetTheme(theme, true, m);
  else {
    try { HQSafe.store.set(HQKeys.THEME, {theme:theme, mode:m, manual:true}); } catch(e) {}
    document.documentElement.setAttribute('data-mode', m);
  }
  renderModePills(m);
  HQToast.show(m === 'dark' ? '🌙 Dark mode' : '☀️ Light mode');
}

// Legacy stubs — kept so old HTML theme tab elements don't throw if present
function loadThemeSchedule() { loadThemePicker(); }
function updateThemeSliders() {}
function saveThemeSchedule() {}
function toggleThemeAuto() {}
function lockTheme(t) { selectTheme(t); }


function loadDensity(){
  const pf=loadPF();
  const d=pf.density||'comfortable';
  ['compact','comfortable','accessible'].forEach(k=>{
    document.getElementById('dn-'+k)?.classList.toggle('on',k===d);
  });
  applyDensity(d);
}

function setDensity(d){
  ['compact','comfortable','accessible'].forEach(k=>{
    document.getElementById('dn-'+k)?.classList.toggle('on',k===d);
  });
  const pf=loadPF();pf.density=d;HQSafe.store.set(PF_KEY, pf);
  applyDensity(d);
  HQToast.show('📐 Density set to '+d);
}

function applyDensity(d){
  document.documentElement.classList.remove('density-compact','density-comfortable','density-accessible');
  document.documentElement.classList.add('density-'+d);
}

// ── STORAGE ──
function renderStorageTab(){
  const el=document.getElementById('storage-list');if(!el)return;
  const keys=[];
  let totalBytes=0;
  for(let i=0;i<localStorage.length;i++){
    const k=localStorage.key(i);
    if(!k)continue;
    const v=HQSafe.store.get(k)||'';
    const bytes=(k.length+v.length)*2;
    totalBytes+=bytes;
    if(k.startsWith('audhd-hq-'))keys.push({k,bytes});
  }
  keys.sort((a,b)=>b.bytes-a.bytes);
  document.getElementById('storage-total-size').textContent=
    `${keys.length} app keys · ${(totalBytes/1024).toFixed(1)} KB total in localStorage`;

  if(!keys.length){el.innerHTML='<div class="storage-empty">No audhd-hq-* keys found</div>';return;}
  el.innerHTML=keys.map(({k,bytes})=>`
    <div class="storage-row">
      <div class="storage-key">${k.replace('audhd-hq-','')}</div>
      <div class="storage-size">${bytes>1024?(bytes/1024).toFixed(1)+'KB':bytes+'B'}</div>
      <button class="btn-d" style="padding:3px 8px;font-size:10px" onclick="clearKey('${k}')">Clear</button>
    </div>`).join('');
}

async function clearKey(k){
  if(!(await HQConfirm.ask(`Clear "${k}"? This cannot be undone.`, {danger:true})))return;
  HQSafe.store.remove(k);
  renderStorageTab();
  HQToast.show('🗑️ Cleared: '+k);
}

function scanLegacyKeys(){
  const legacy=['hq-theme','hq_theme','bt-theme','ci-theme','ht-theme','ft-theme',
                'taskboard_theme','hq-taskboard','KHQ_V7','hq-fridge-items',
                'hq-kitchen-data','hq-recurring','hq-monthly','hq-weekly',
                'hq-tags','hq-life-scores','walking-tracker-db','wt-fb-unit',
                'hq_route_to_projects','hq-fb-stars','hq-fb-mission',
                'taskboard_hq_v2','taskboard_hq_v3','hq-money-migrated-v2',
                'hq-migrated-checkin-v2','hq-migrated-checkin-v3'];
  const found=legacy.filter(k=>HQSafe.store.get(k)!==null);
  const el=document.getElementById('legacy-list');if(!el)return;
  if(!found.length){el.innerHTML='<div class="storage-empty">✅ No legacy keys found — all clean!</div>';return;}
  el.innerHTML=found.map(k=>
    `<div class="legacy-row">
      <div class="legacy-key">${k}</div>
      <button class="btn-d" style="padding:3px 9px;font-size:10px" onclick="removeLegacy('${k}')">Remove</button>
    </div>`).join('');
}

function removeLegacy(k){
  HQSafe.store.remove(k);
  scanLegacyKeys();
  renderStorageTab();
  HQToast.show('🧹 Removed: '+k);
}

// ── EXPORT / IMPORT ──
function exportData(){
  const data={tagEngine:DB,profile:loadPF(),indexLayout:loadLayoutData(),reminderConfig:loadRC()};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='audhd-hq-customize-'+new Date().toISOString().slice(0,10)+'.json';
  a.click();
  HQToast.show('📥 Exported');
}

function importData(input,mode){
  const file=input.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=e=>{
    try{
      const data=JSON.parse(e.target.result);

      // ── Detect full data-sync backup format vs customize export format ──
      // Full backup: keys like HQKeys.TAGS, HQKeys.INDEX_LAYOUT
      // Customize export: keys like 'tagEngine', 'indexLayout'
      const isFullBackup=!data.tagEngine&&(data[HQKeys.TAGS]||data[HQKeys.INDEX_LAYOUT]);
      if(isFullBackup){
        // Remap full-backup keys into expected customize format
        if(data[HQKeys.TAGS])    data.tagEngine    = data[HQKeys.TAGS];
        if(data[HQKeys.INDEX_LAYOUT]) data.indexLayout = data[HQKeys.INDEX_LAYOUT];
        if(data[HQKeys.PROFILE]) data.profile      = data[HQKeys.PROFILE];
        if(data[HQKeys.REMINDER_CONFIG])data.reminderConfig= data[HQKeys.REMINDER_CONFIG];
      }

      if(data.tagEngine){
        if(mode==='replace'){
          DB=data.tagEngine;
        } else {
          // Merge — add any category or flag not already present by id
          const inCats=data.tagEngine.categories||[];
          inCats.forEach(c=>{if(!DB.categories.find(x=>x.id===c.id))DB.categories.push(c);});
          const inFlags=data.tagEngine.flags||{};
          Object.keys(inFlags).forEach(g=>{
            if(!DB.flags[g])DB.flags[g]=[];
            (inFlags[g]||[]).forEach(f=>{if(!DB.flags[g].find(x=>x.id===f.id))DB.flags[g].push(f);});
          });
        }

        // ── Post-import safety ──
        // 1. Restore any empty built-in flag groups (e.g. status, wellbeing added after backup was made)
        ['priority','energy','time','context','status','wellbeing','system'].forEach(g=>{
          if(!(DB.flags[g]||[]).length){
            DB.flags[g]=JSON.parse(JSON.stringify(DEFAULT_FLAGS[g]||[]));
          }
        });
        // 2. Normalize old 'behavior' (string) → 'behaviors' (array) on custom flags
        normalizeFlagBehaviors();
        // 3. Clear v3 sentinel so pushToCheckin fields are added to health subcategories
        localStorage.removeItem(HQKeys.TAGS_MIGRATED_V3);
        // 4. Clear layout migration sentinel so brain-dump → thought-jar rename re-runs
        localStorage.removeItem(HQKeys.LAYOUT_MIGRATED_V1);

        persist();
        migrateTagsV3();
        renderAll();
      }
      if(data.profile)HQSafe.store.set(PF_KEY, data.profile);
      // Fix layout before saving: rename stale brain-dump → thought-jar
      if(data.indexLayout){
        const lay=data.indexLayout;
        ['heroTools','hero2Tiles'].forEach(zone=>{
          if((lay[zone]||[]).includes('brain-dump'))
            lay[zone]=lay[zone].map(id=>id==='brain-dump'?'thought-jar':id);
        });
        HQSafe.store.set(LAYOUT_KEY, lay);
        localStorage.setItem(HQKeys.LAYOUT_MIGRATED_V1,'1');
      }
      if(data.reminderConfig)HQSafe.store.set(RW_KEY, data.reminderConfig);
      closeModal('ie-modal');HQToast.show('✅ Import successful');
    }catch(err){HQToast.show('❌ Import failed — invalid file');}
    input.value='';
  };
  reader.readAsText(file);
}

// ── UI HELPERS ──
function buildColorRow(containerId,colors,selected){
  const el=document.getElementById(containerId);if(!el)return;
  el.innerHTML=colors.map(c=>`
    <div class="color-swatch${c===selected?' sel':''}" style="background:${c}" onclick="selColor(this,'${containerId}')"></div>`).join('');
}
function selColor(el,containerId){
  document.querySelectorAll('#'+containerId+' .color-swatch').forEach(s=>s.classList.remove('sel'));
  el.classList.add('sel');
}
function getSelColor(containerId){
  const sel=document.querySelector('#'+containerId+' .color-swatch.sel');
  return sel?sel.style.background:'';
}
function buildColorSelects(selectId,colors,selected){
  const el=document.getElementById(selectId);if(!el)return;
  el.innerHTML=colors.map(c=>`<option value="${c}"${c===selected?' selected':''}>${c}</option>`).join('');
}
function buildModChips(containerId,selected){
  const el=document.getElementById(containerId);if(!el)return;
  el.innerHTML=MODULES.map(m=>`
    <div class="mod-chip${(selected||[]).includes(m.id)?' on':''}" onclick="togMod(this)" data-id="${m.id}">
      ${renderEmoji(m.emoji)} ${m.name}
    </div>`).join('');
}
function togMod(el){
  if(el.dataset.id==='all'){
    document.querySelectorAll(el.parentElement.id?`#${el.parentElement.id} .mod-chip`:'.mod-chip').forEach(c=>c.classList.remove('on'));
    el.classList.add('on');
  } else {
    const allChip=el.parentElement.querySelector('[data-id="all"]');
    if(allChip)allChip.classList.remove('on');
    el.classList.toggle('on');
    if(!el.parentElement.querySelector('.mod-chip.on'))allChip?.classList.add('on');
  }
}
function getSelMods(containerId){
  return [...document.querySelectorAll('#'+containerId+' .mod-chip.on')].map(c=>c.dataset.id);
}

// ── BEHAVIOR GRID (new multi-select) ──
function buildBehaviors(containerId, selected){
  const el=document.getElementById(containerId);if(!el)return;
  el.innerHTML=BEHAVIORS.map(b=>`
    <button type="button" class="beh-btn${(selected||[]).includes(b.id)?' on':''}" data-id="${b.id}" onclick="this.classList.toggle('on')">
      <span class="beh-btn-ico">${renderEmoji(b.emoji)}</span>
      <div class="beh-btn-info">
        <div class="beh-btn-name">${b.name}</div>
        <div class="beh-btn-desc">${b.desc}</div>
      </div>
    </button>`).join('');
}
function getSelBehaviors(containerId){
  return [...document.querySelectorAll('#'+containerId+' .beh-btn.on')].map(b=>b.dataset.id);
}

// ── UTILS ──
const uid = () => (window.HQUtils ? HQUtils.uid() : Date.now().toString(36)+Math.random().toString(36).slice(2,6)); // aliased → HQUtils.uid
const esc = s => (window.HQUtils ? HQUtils.esc(s) : (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')); // aliased → HQUtils.esc

// ── RESET TAXONOMY — escape hatch for stuck migrations ──
// Clears the migration sentinel and re-runs migrateTagsV2.
// Safe to call multiple times — migration is fully additive.
async function resetTaxonomy(){
  if(!(await HQConfirm.ask('Re-apply the default taxonomy? This ADDS missing subcategories and flag groups without deleting any of your customizations.', {danger:true})))return;
  localStorage.removeItem(HQKeys.TAGS_MIGRATED_V2);
  localStorage.removeItem(HQKeys.TAGS_MIGRATED_V3);
  migrateTagsV2();
  migrateTagsV3();
  renderAll();
  HQToast.show('✅ Taxonomy refreshed — missing subcategories and flags restored.');
}

function renderAll(){
  renderCats();
  renderFlags();
  renderStats();
}

document.addEventListener('DOMContentLoaded',()=>{
  load();
  renderAll();
});

// Fallback hqSetTheme / hqSetMode if hq-core hasn't loaded yet
if(typeof hqSetTheme!=='function'){
  window.hqSetTheme=function(t, manual, mode){
    var m = mode || 'dark';
    document.documentElement.setAttribute('data-theme',t);
    document.documentElement.setAttribute('data-mode',m);
    try{HQSafe.store.set(HQKeys.THEME, {theme:t,mode:m,manual:true});}catch(e){}
  };
}
if(typeof hqSetMode!=='function'){
  window.hqSetMode=function(m){
    var stored = {};
    try{stored=HQSafe.store.get(HQKeys.THEME)||{};}catch(e){}
    var t = stored.theme || 'lilac';
    window.hqSetTheme(t, true, m);
  };
}

// ══════════════════════════════════════════════════════════════════
//  🧩 MODULES TAB
// ══════════════════════════════════════════════════════════════════

// ── Helpers ──────────────────────────────────────────────────────

function _getModuleSettings() {
  try {
    var raw = window.HQStore ? HQStore.get(HQStore.KEYS.MODULE_SETTINGS) : null; // FIX-09: guarded
    if (raw && typeof raw === 'object') {
      return { enabled: raw.enabled || {}, order: raw.order || {} };
    }
  } catch(e) {}
  return { enabled: {}, order: {} };
}

function _saveModuleSettings(settings) {
  try {
    if (window.HQStore) HQStore.set(HQStore.KEYS.MODULE_SETTINGS, settings); // FIX-09: guarded
    HQSafe.bus.emit('modules-updated', {});
  } catch(e) {}
}

// Returns the ordered list of module IDs for a section (applying custom order if set)
function _getSectionOrder(section, settings) {
  var customOrder = (settings.order || {})[section.id];
  var mods = section.modules.filter(function(m) { return !m.type; }); // skip subsection dividers
  if (!customOrder || !customOrder.length) return mods.map(function(m) { return m.id; });
  var orderedIds = customOrder.slice();
  // Add any modules not yet in the saved order (new additions)
  mods.forEach(function(m) { if (orderedIds.indexOf(m.id) === -1) orderedIds.push(m.id); });
  // Remove any IDs that no longer exist in the manifest
  var validIds = mods.map(function(m) { return m.id; });
  return orderedIds.filter(function(id) { return validIds.indexOf(id) !== -1; });
}

// Get a module definition by id from AUDHD_NAV_SECTIONS
function _getModuleDef(id) {
  var sections = window.AUDHD_NAV_SECTIONS || [];
  for (var si = 0; si < sections.length; si++) {
    var mods = sections[si].modules;
    for (var mi = 0; mi < mods.length; mi++) {
      if (mods[mi].id === id) return mods[mi];
    }
  }
  return null;
}

// ── Render ────────────────────────────────────────────────────────

function renderModulesTab() {
  var sections = window.AUDHD_NAV_SECTIONS;
  if (!sections) {
    document.getElementById('modules-tab-body').innerHTML =
      '<div class="hint" style="color:var(--red)">⚠️ Module manifest not loaded. Make sure hq-core.js is loaded before customize.js.</div>';
    return;
  }

  var settings = _getModuleSettings();
  var html = '';

  html += '<div class="card" style="margin-bottom:12px;padding:10px 14px;background:rgba(100,94,183,.08);border:1px solid rgba(100,94,183,.2)">' +
    '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">' +
    '<span style="font-size:13px;font-weight:700;color:var(--purple)">Legend:</span>' +
    '<span style="display:flex;align-items:center;gap:5px;font-size:12px"><span style="background:rgba(100,94,183,.2);border-radius:6px;padding:2px 7px;font-weight:700;color:var(--purple)">CORE</span> Always visible, can\'t be hidden</span>' +
    '<span style="display:flex;align-items:center;gap:5px;font-size:12px">⬆️⬇️ Reorder within section</span>' +
    '<span style="display:flex;align-items:center;gap:5px;font-size:12px">🔘 Toggle on/off</span>' +
    '</div></div>';

  sections.forEach(function(section) {
    var orderedIds = _getSectionOrder(section, settings);
    var enabled    = settings.enabled || {};

    html += '<div class="card" data-mod-section="' + section.id + '">';
    html += '<div class="card-hd"><div class="card-title">' + section.label + '</div></div>';
    html += '<div class="mod-section-list" id="mod-section-' + section.id + '">';

    orderedIds.forEach(function(modId, idx) {
      var mod = _getModuleDef(modId);
      if (!mod) return;
      var isEnabled = mod.core || enabled[modId] !== false;
      var isFirst   = idx === 0;
      var isLast    = idx === orderedIds.length - 1;

      html += '<div class="mod-row" data-mod-id="' + modId + '" data-section-id="' + section.id + '"' +
        (isEnabled ? '' : ' style="opacity:.45"') + '>';

      // Reorder buttons (hidden for core items in single-item sections)
      html += '<div class="mod-order-btns">';
      html += '<button class="mod-ord-btn" title="Move up" ' +
        (isFirst ? 'disabled' : 'onclick="modMoveUp(\'' + section.id + '\',\'' + modId + '\')"') + '>▲</button>';
      html += '<button class="mod-ord-btn" title="Move down" ' +
        (isLast ? 'disabled' : 'onclick="modMoveDown(\'' + section.id + '\',\'' + modId + '\')"') + '>▼</button>';
      html += '</div>';

      // Emoji + label
      html += '<span class="mod-em">' + mod.emoji + '</span>';
      html += '<span class="mod-label">' + esc(mod.label) + '</span>';

      // Core badge or toggle
      if (mod.core) {
        html += '<span class="mod-core-badge">CORE</span>';
      } else {
        html += '<label class="tog" title="' + (isEnabled ? 'Disable' : 'Enable') + ' ' + esc(mod.label) + '">' +
          '<input type="checkbox"' + (isEnabled ? ' checked' : '') +
          ' onchange="modToggle(\'' + section.id + '\',\'' + modId + '\',this.checked)">' +
          '<span class="tog-sl"></span></label>';
      }

      html += '</div>'; // .mod-row
    });

    html += '</div>'; // .mod-section-list
    html += '</div>'; // .card
  });

  html += '<div style="display:flex;gap:8px;margin-top:4px;flex-wrap:wrap">' +
    '<button class="btn-s" onclick="modResetAll()">↺ Reset to defaults</button>' +
    '<div style="font-size:11px;color:var(--muted);margin:auto 0">Changes apply immediately across all pages</div>' +
    '</div>';

  document.getElementById('modules-tab-body').innerHTML = html;

  // Inject module-tab-specific styles if not already present
  if (!document.getElementById('mod-tab-styles')) {
    var style = document.createElement('style');
    style.id = 'mod-tab-styles';
    style.textContent = [
      '.mod-section-list { display:flex; flex-direction:column; gap:4px; }',
      '.mod-row { display:flex; align-items:center; gap:10px; padding:7px 10px; border-radius:8px;',
      '  background:var(--shell-accent-glow); border:1px solid var(--shell-panel-border); transition:opacity .2s; }',
      '.mod-order-btns { display:flex; flex-direction:column; gap:2px; }',
      '.mod-ord-btn { background:none; border:1px solid var(--purple);border-radius:4px;',
      '  color:var(--purple); font-size:10px; padding:1px 5px; cursor:pointer; line-height:1.4;',
      '  transition:background .15s; }',
      '.mod-ord-btn:disabled { opacity:.25; cursor:default; }',
      '.mod-ord-btn:not(:disabled):hover { background:var(--shell-accent-glow-hover); }',
      '.mod-em { font-size:18px; width:24px; text-align:center; flex-shrink:0; }',
      '.mod-label { flex:1; font-size:13px; font-weight:600; color:var(--text); }',
      '.mod-core-badge { font-size:10px; font-weight:800; letter-spacing:.04em;',
      '  background:rgba(100,94,183,.18); color:var(--purple); border-radius:6px;',
      '  padding:2px 8px; white-space:nowrap; }',
    ].join('\n');
    document.head.appendChild(style);
  }
}

// ── Actions ───────────────────────────────────────────────────────

function modToggle(sectionId, modId, isEnabled) {
  var settings = _getModuleSettings();
  if (!settings.enabled) settings.enabled = {};
  settings.enabled[modId] = isEnabled;
  _saveModuleSettings(settings);
  renderModulesTab(); // re-render to reflect opacity change
}

function modMoveUp(sectionId, modId) {
  var section  = (window.AUDHD_NAV_SECTIONS || []).find(function(s) { return s.id === sectionId; });
  if (!section) return;
  var settings = _getModuleSettings();
  var order    = _getSectionOrder(section, settings);
  var idx      = order.indexOf(modId);
  if (idx <= 0) return;
  order.splice(idx - 1, 0, order.splice(idx, 1)[0]);
  if (!settings.order) settings.order = {};
  settings.order[sectionId] = order;
  _saveModuleSettings(settings);
  renderModulesTab();
}

function modMoveDown(sectionId, modId) {
  var section  = (window.AUDHD_NAV_SECTIONS || []).find(function(s) { return s.id === sectionId; });
  if (!section) return;
  var settings = _getModuleSettings();
  var order    = _getSectionOrder(section, settings);
  var idx      = order.indexOf(modId);
  if (idx === -1 || idx >= order.length - 1) return;
  order.splice(idx + 1, 0, order.splice(idx, 1)[0]);
  if (!settings.order) settings.order = {};
  settings.order[sectionId] = order;
  _saveModuleSettings(settings);
  renderModulesTab();
}

async function modResetAll() {
  if(!(await HQConfirm.ask('Reset all module visibility and order to defaults?', {danger:true})))return;
  try {
    if (window.HQStore) HQStore.remove(HQStore.KEYS.MODULE_SETTINGS); // FIX-09: guarded
    HQSafe.bus.emit('modules-updated', {});
  } catch(e) {}
  renderModulesTab();
  if (typeof hqShowToast === 'function') hqShowToast('🧩 Modules reset to defaults');
}

// ══════════════════════════════════════════════════════════════════
//  ⚡ CHECK-IN QUICK PRESETS EDITOR
// ══════════════════════════════════════════════════════════════════

const PRESETS_KEY = HQKeys.CHECKIN_PRESETS;
const MAX_PRESETS = 7;

const DEFAULT_PRESETS = [
  { id:'depressed', label:'Depressed',  emoji:'🌑', mood:1, energy:1, core:true },
  { id:'anxious',   label:'Anxious',    emoji:'😰', mood:2, energy:2, core:true },
  { id:'okay',      label:'Just Okay',  emoji:'😐', mood:3, energy:3, core:false },
  { id:'good',      label:'Good Day',   emoji:'✨', mood:4, energy:4, core:false },
];

function _loadPresets(){
  try{
    const raw=HQSafe.store.get(PRESETS_KEY);
    if(raw){
      const arr=JSON.parse(raw);
      if(Array.isArray(arr)&&arr.length) return arr;
    }
  }catch(e){}
  return DEFAULT_PRESETS.map(p=>Object.assign({},p));
}

function _savePresets(arr){
  HQSafe.store.set(PRESETS_KEY, arr);
  HQToast.show('⚡ Presets saved');
}

const PRESET_EMOJIS=['🌑','😰','😐','✨','😊','😤','🤒','😴','🔥','💪','🧠','😌','🥺','😶','🌻','⚡','💫','🌈','🫶','🎯'];

function renderPresetsList(){
  const container=document.getElementById('presets-list');
  if(!container) return;
  const presets=_loadPresets();
  const addBtn=document.getElementById('add-preset-btn');
  if(addBtn) addBtn.style.opacity=presets.length>=MAX_PRESETS?'.4':'1';

  let html='';
  presets.forEach(function(p,idx){
    html+='<div class="preset-row" data-preset-idx="'+idx+'">';
    // Emoji picker button
    html+='<button class="preset-emoji-btn" onclick="openEmojiPicker('+idx+',this)" title="Change emoji">'+esc(p.emoji||'😐')+'</button>';
    // Name input
    html+='<input class="preset-name-input" type="text" value="'+esc(p.label||'')+'" maxlength="20" placeholder="Preset name" onchange="updatePresetField('+idx+',\'label\',this.value)">';
    // Mood select
    html+='<div class="preset-val-group"><label class="preset-val-label">Mood</label>';
    html+='<select class="preset-val-select" onchange="updatePresetField('+idx+',\'mood\',+this.value)">';
    [1,2,3,4,5].forEach(function(v){
      html+='<option value="'+v+'"'+(p.mood===v?' selected':'')+'>'+v+'</option>';
    });
    html+='</select></div>';
    // Energy select
    html+='<div class="preset-val-group"><label class="preset-val-label">Energy</label>';
    html+='<select class="preset-val-select" onchange="updatePresetField('+idx+',\'energy\',+this.value)">';
    [1,2,3,4,5].forEach(function(v){
      html+='<option value="'+v+'"'+(p.energy===v?' selected':'')+'>'+v+'</option>';
    });
    html+='</select></div>';
    // Delete or core badge
    if(p.core){
      html+='<span class="preset-core-badge">CORE</span>';
    } else {
      html+='<button class="preset-del-btn" onclick="deletePreset('+idx+')" title="Remove preset">✕</button>';
    }
    html+='</div>';
  });
  container.innerHTML=html;
}

function updatePresetField(idx,field,value){
  const presets=_loadPresets();
  if(!presets[idx]) return;
  presets[idx][field]=value;
  _savePresets(presets);
}

function addPreset(){
  const presets=_loadPresets();
  if(presets.length>=MAX_PRESETS){HQToast.show('Maximum '+MAX_PRESETS+' presets reached');return;}
  presets.push({id:'custom-'+Date.now(),label:'New Preset',emoji:'✨',mood:3,energy:3,core:false});
  _savePresets(presets);
  renderPresetsList();
}

function deletePreset(idx){
  const presets=_loadPresets();
  if(!presets[idx]||presets[idx].core) return;
  presets.splice(idx,1);
  _savePresets(presets);
  renderPresetsList();
}

async function resetPresets(){
  if(!(await HQConfirm.ask('Reset presets to the 4 defaults?', {danger:true})))return;
  HQSafe.store.remove(PRESETS_KEY);
  renderPresetsList();
  HQToast.show('⚡ Presets reset to defaults');
}

// Inline emoji picker
var _emojiPickerIdx=-1;
var _emojiPickerEl=null;

function openEmojiPicker(idx,triggerBtn){
  // Close any existing picker
  closeEmojiPicker();
  _emojiPickerIdx=idx;
  const picker=document.createElement('div');
  picker.className='preset-emoji-picker';
  picker.id='emoji-picker-popup';
  PRESET_EMOJIS.forEach(function(em){
    const btn=document.createElement('button');
    btn.className='preset-emoji-opt';
    btn.textContent=em;
    btn.onclick=function(e){e.stopPropagation();pickEmoji(em);};
    picker.appendChild(btn);
  });
  document.body.appendChild(picker);
  _emojiPickerEl=picker;
  // Position near trigger
  const rect=triggerBtn.getBoundingClientRect();
  picker.style.top=(rect.bottom+4)+'px';
  picker.style.left=Math.min(rect.left,window.innerWidth-250)+'px';
  // Close on outside click
  setTimeout(function(){
    document.addEventListener('click',_emojiPickerOutside,{once:true});
  },0);
}

function _emojiPickerOutside(){closeEmojiPicker();}

function closeEmojiPicker(){
  const existing=document.getElementById('emoji-picker-popup');
  if(existing) existing.remove();
  _emojiPickerEl=null;
  document.removeEventListener('click',_emojiPickerOutside);
}

function pickEmoji(em){
  closeEmojiPicker();
  const presets=_loadPresets();
  if(!presets[_emojiPickerIdx]) return;
  presets[_emojiPickerIdx].emoji=em;
  _savePresets(presets);
  renderPresetsList();
}


// ══════════════════════════════════════════════════════════════════
//  🎞 DISPLAY PREFS — Reduce Motion + High Contrast
// ══════════════════════════════════════════════════════════════════

const DISPLAY_PREFS_KEY=HQKeys.DISPLAY_PREFS;

function _loadDisplayPrefsData(){
  try{ return HQSafe.store.get(DISPLAY_PREFS_KEY, {}); }
  catch(e){ return {}; }
}

function loadDisplayPrefs(){
  const dp=_loadDisplayPrefsData();
  const rmEl=document.getElementById('th-reduce-motion');
  const hcEl=document.getElementById('th-high-contrast');
  if(rmEl) rmEl.checked=!!dp.reduceMotion;
  if(hcEl) hcEl.checked=!!dp.highContrast;
  _applyDisplayPrefs(dp);
}

function _applyDisplayPrefs(dp){
  if(!dp) dp=_loadDisplayPrefsData();
  document.documentElement.setAttribute('data-reduce-motion',dp.reduceMotion?'1':'0');
  document.documentElement.setAttribute('data-high-contrast',dp.highContrast?'1':'0');
}

function saveDisplayPrefs(){
  const dp=_loadDisplayPrefsData();
  dp.reduceMotion=!!document.getElementById('th-reduce-motion')?.checked;
  dp.highContrast=!!document.getElementById('th-high-contrast')?.checked;
  HQSafe.store.set(DISPLAY_PREFS_KEY, dp);
  _applyDisplayPrefs(dp);
  if(window.HQConfig&&typeof window.HQConfig.refresh==='function')window.HQConfig.refresh();
  HQToast.show('🎨 Display preferences saved');
}


// ══════════════════════════════════════════════════════════════════
//  📱 BOTTOM NAV SLOT EDITOR
// ══════════════════════════════════════════════════════════════════

const BOTTOM_NAV_SLOTS_KEY=HQKeys.BOTTOM_NAV_SLOTS;

// Default 3 editable slots (slot 1 = Home, always locked)
const DEFAULT_BOTTOM_NAV_SLOTS=[
  {id:'checkin',   label:'Check-In',  emoji:'✅', href:'checkin.html'},
  {id:'taskboard', label:'Tasks',     emoji:'📋', href:'taskboard.html'},
  {id:'daybuilder',label:'DayBuilder',emoji:'🗓', href:'day-view.html#plan'},
];

function _loadBottomNavSlots(){
  try{
    const raw=HQSafe.store.get(BOTTOM_NAV_SLOTS_KEY);
    if(raw){
      const arr=JSON.parse(raw);
      if(Array.isArray(arr)&&arr.length===3) return arr;
    }
  }catch(e){}
  return DEFAULT_BOTTOM_NAV_SLOTS.map(s=>Object.assign({},s));
}

function _saveBottomNavSlots(slots){
  HQSafe.store.set(BOTTOM_NAV_SLOTS_KEY, slots);
  // Tell hq-core to re-render bottom nav if possible
  HQSafe.bus.emit('bottom-nav-updated',{});
  HQToast.show('📱 Bottom nav saved');
}

// Build flat pool from AUDHD_NAV_SECTIONS (excluding Home, subsections, settings)
function _buildNavPool(){
  const sections=window.AUDHD_NAV_SECTIONS||[];
  const pool=[];
  sections.forEach(function(sec){
    sec.modules.forEach(function(mod){
      if(mod.type==='subsection') return;
      if(mod.id==='customize'||mod.id==='sync') return; // settings-only
      pool.push({id:mod.id,label:mod.label,emoji:mod.emoji,href:mod.href,section:sec.label});
    });
  });
  return pool;
}

var _bnav_selected_slot=-1; // which slot (0=slot2, 1=slot3, 2=slot4) is awaiting pick

function renderBottomNavEditor(){
  const container=document.getElementById('bottomnav-editor');
  if(!container) return;
  const slots=_loadBottomNavSlots();
  const pool=_buildNavPool();
  const usedIds=slots.map(s=>s.id);

  let html='';
  // Slot row
  html+='<div class="bnav-slots">';
  // Locked home slot
  html+='<div class="bnav-slot locked"><div class="bnav-slot-num">Slot 1</div><div class="bnav-slot-ico">🏠</div><div class="bnav-slot-lbl">Home</div></div>';
  // 3 editable slots
  slots.forEach(function(s,i){
    const active=_bnav_selected_slot===i;
    html+='<div class="bnav-slot filled'+(active?' bnav-slot-selecting':'')+'" onclick="bnavSelectSlot('+i+')" title="Click to change">';
    html+='<div class="bnav-slot-num">Slot '+(i+2)+'</div>';
    html+='<div class="bnav-slot-ico">'+esc(s.emoji)+'</div>';
    html+='<div class="bnav-slot-lbl">'+esc(s.label)+'</div>';
    html+='<div class="bnav-slot-clear">tap to change</div>';
    html+='</div>';
  });
  html+='</div>';

  if(_bnav_selected_slot>=0){
    html+='<div style="font-size:11px;font-weight:700;color:var(--purple);margin-bottom:6px">📍 Picking page for Slot '+(_bnav_selected_slot+2)+' — click a page below:</div>';
  }

  // Pool grouped by section
  html+='<div class="bnav-pool">';
  let lastSection='';
  pool.forEach(function(item){
    if(item.section!==lastSection){
      html+='<div class="bnav-pool-section">'+esc(item.section)+'</div>';
      lastSection=item.section;
    }
    const isUsed=usedIds.includes(item.id);
    const isSelected=(_bnav_selected_slot>=0)&&slots[_bnav_selected_slot]&&slots[_bnav_selected_slot].id===item.id;
    html+='<div class="bnav-pool-item'+(isSelected?' selected':'')+'" onclick="bnavPickItem(\''+item.id+'\')">'+
      esc(item.emoji)+' '+esc(item.label)+
      (isUsed&&!isSelected?' <span style="opacity:.4;font-size:9px">✓</span>':'')+
    '</div>';
  });
  html+='</div>';

  container.innerHTML=html;
}

function bnavSelectSlot(slotIdx){
  _bnav_selected_slot=(_bnav_selected_slot===slotIdx)?-1:slotIdx;
  renderBottomNavEditor();
}

function bnavPickItem(modId){
  if(_bnav_selected_slot<0) return;
  const pool=_buildNavPool();
  const item=pool.find(function(p){return p.id===modId;});
  if(!item) return;
  const slots=_loadBottomNavSlots();
  slots[_bnav_selected_slot]={id:item.id,label:item.label,emoji:item.emoji,href:item.href};
  _saveBottomNavSlots(slots);
  _bnav_selected_slot=-1;
  renderBottomNavEditor();
}

async function resetBottomNav(){
  if(!(await HQConfirm.ask('Reset bottom nav to defaults?', {danger:true})))return;
  HQSafe.store.remove(BOTTOM_NAV_SLOTS_KEY);
  _bnav_selected_slot=-1;
  _saveBottomNavSlots(DEFAULT_BOTTOM_NAV_SLOTS.map(s=>Object.assign({},s)));
  renderBottomNavEditor();
  HQToast.show('📱 Bottom nav reset to defaults');
}

// ════════════════════════════════════════════════════════════
//  SHORTCUTS DRAWER EDITOR (Group A)
//  Key: audhd-hq-shortcuts   Format: [{id,label,emoji,href}, ...]
// ════════════════════════════════════════════════════════════
const SHORTCUTS_KEY = HQKeys.SHORTCUTS;
const DEFAULT_SHORTCUTS = [
  {id:'braindump', label:'Thought Jar',     emoji:'🫙', href:'brain-dump.html'},
  {id:'checkin',   label:'Check-In',        emoji:'✅', href:'checkin.html'},
  {id:'firebird',  label:'Firebird',         emoji:'🔥', href:'firebird-protocol.html'},
  {id:'global',    label:'Global Data',      emoji:'🌍', href:'global-tracker.html'},
];
const MAX_SHORTCUTS = 8;

function _loadShortcuts(){
  try{
    const raw=HQSafe.store.get(SHORTCUTS_KEY);
    if(raw){const arr=JSON.parse(raw);if(Array.isArray(arr)&&arr.length)return arr;}
  }catch(e){}
  return DEFAULT_SHORTCUTS.map(s=>Object.assign({},s));
}

function _saveShortcuts(items){
  HQSafe.store.set(SHORTCUTS_KEY, items);
  HQSafe.bus.emit('shortcuts-updated',{});
  HQToast.show('⚡ Shortcuts saved');
}

function renderShortcutsEditor(){
  const container=document.getElementById('shortcuts-editor');
  if(!container)return;
  const items=_loadShortcuts();
  const pool=_buildNavPool(); // reuse the same pool builder from bottom nav
  const usedIds=items.map(i=>i.id);

  let html='';

  // Current slots list (ordered, removable)
  html+='<div class="bnav-slots" style="flex-wrap:wrap;gap:6px">';
  items.forEach(function(item,idx){
    html+=`<div class="bnav-slot filled" style="position:relative">
      <div class="bnav-slot-num">⚡${idx+1}</div>
      <div class="bnav-slot-ico">${esc(item.emoji)}</div>
      <div class="bnav-slot-lbl" style="font-size:9px">${esc(item.label)}</div>
      <button onclick="scRemove(${idx})" style="position:absolute;top:2px;right:2px;background:rgba(180,60,60,.5);border:none;border-radius:4px;color:#fff;font-size:9px;cursor:pointer;padding:1px 4px;line-height:1">✕</button>
      ${idx>0?`<button onclick="scMoveUp(${idx})" style="position:absolute;bottom:2px;left:2px;background:var(--shell-accent-glow-hover);border:none;border-radius:4px;color:var(--text);font-size:9px;cursor:pointer;padding:1px 4px;line-height:1">↑</button>`:''}
    </div>`;
  });
  if(items.length<MAX_SHORTCUTS){
    html+=`<div class="bnav-slot" style="opacity:.45;pointer-events:none"><div class="bnav-slot-num">empty</div><div class="bnav-slot-ico">＋</div></div>`;
  }
  html+='</div>';

  // Hint
  html+=`<div style="font-size:10px;color:var(--text2);margin:6px 0">${items.length}/${MAX_SHORTCUTS} shortcuts set — tap a page below to add it</div>`;

  // Pool grouped by section
  html+='<div class="bnav-pool">';
  let lastSec='';
  pool.forEach(function(item){
    if(item.section!==lastSec){
      html+=`<div class="bnav-pool-section">${esc(item.section)}</div>`;
      lastSec=item.section;
    }
    const isUsed=usedIds.includes(item.id);
    const isFull=items.length>=MAX_SHORTCUTS;
    html+=`<div class="bnav-pool-item${isUsed?' selected':''}" onclick="scAdd('${item.id}')" style="${isFull&&!isUsed?'opacity:.4;pointer-events:none':''}">
      ${esc(item.emoji)} ${esc(item.label)}
      ${isUsed?'<span style="opacity:.4;font-size:9px">✓ added</span>':''}
    </div>`;
  });
  html+='</div>';

  container.innerHTML=html;
}

function scAdd(modId){
  const items=_loadShortcuts();
  if(items.length>=MAX_SHORTCUTS){HQToast.show('⚠️ Max '+MAX_SHORTCUTS+' shortcuts');return;}
  if(items.find(i=>i.id===modId)){HQToast.show('Already added');return;}
  const pool=_buildNavPool();
  const found=pool.find(p=>p.id===modId);
  if(!found)return;
  items.push({id:found.id,label:found.label,emoji:found.emoji,href:found.href});
  _saveShortcuts(items);
  renderShortcutsEditor();
}

function scRemove(idx){
  const items=_loadShortcuts();
  items.splice(idx,1);
  _saveShortcuts(items);
  renderShortcutsEditor();
}

function scMoveUp(idx){
  if(idx===0)return;
  const items=_loadShortcuts();
  const tmp=items[idx-1];items[idx-1]=items[idx];items[idx]=tmp;
  _saveShortcuts(items);
  renderShortcutsEditor();
}

async function resetShortcuts(){
  if(!(await HQConfirm.ask('Reset shortcuts to defaults?', {danger:true})))return;
  HQSafe.store.remove(SHORTCUTS_KEY);
  renderShortcutsEditor();
  HQToast.show('⚡ Shortcuts reset');
}

// ════════════════════════════════════════════════════════════
//  CHECK-IN SECTION VISIBILITY EDITOR (Group A)
//  Key: audhd-hq-checkin-visibility
// ════════════════════════════════════════════════════════════
const CHECKIN_VIS_KEY=HQKeys.CHECKIN_VISIBILITY;

const CHECKIN_VIS_ITEMS=[
  {key:'moodIntensity', label:'🌡️ Mood Intensity (1–5)',       sub:'The 1–5 numeric mood scale below the mood emojis'},
  {key:'bodyScan',      label:'🩺 Body Scan',                  sub:'Physical symptoms, sensory, and anxiety sections'},
  {key:'weeklyPattern', label:'📊 Weekly Pattern Summary',     sub:'7-day emotional trend shown after saving a check-in'},
  {key:'eowButtons',   label:'📅 EOW / EOM Buttons',          sub:'End-of-Week and End-of-Month extended check-in prompts'},
];

function _loadCheckinVis(){
  try{return HQSafe.store.get(CHECKIN_VIS_KEY, {});}catch(e){return {};}
}

function renderCheckinVisEditor(){
  const container=document.getElementById('checkin-vis-list');
  if(!container)return;
  const vis=_loadCheckinVis();
  container.innerHTML=CHECKIN_VIS_ITEMS.map(function(item){
    const isOn=vis[item.key]!==false; // default on
    return`<div class="pf-check-row">
      <div class="pf-check-info">
        <div class="pf-check-label">${item.label}</div>
        <div class="pf-check-sub">${item.sub}</div>
      </div>
      <label class="tog">
        <input type="checkbox" ${isOn?'checked':''} onchange="saveCheckinVis('${item.key}',this.checked)">
        <span class="tog-sl"></span>
      </label>
    </div>`;
  }).join('');
}

function saveCheckinVis(key,val){
  const vis=_loadCheckinVis();
  vis[key]=val;
  HQSafe.store.set(CHECKIN_VIS_KEY, vis);
  HQToast.show('✅ Check-in visibility saved');
}


// ════════════════════════════════════════════════════════════════
//  🏠 SPACES & TASKS TAB  (Deep Clean — Rooms + Op Flow only)
// ════════════════════════════════════════════════════════════════
//
//  ⚠️  SCOPE NOTE: Task pool editing (Routines / Prepwork) lives
//  inside routines-prepwork.html → ⚙️ Setup tab, not here.
//  This tab is Deep Clean–only: Rooms Pool + Phase Op Flow.
//
//  🔮  FUTURE — GLOBAL ROOMS REGISTRY
//  "Rooms" is currently scoped to Deep Clean only. A decision is
//  open on whether to globalize the concept. Candidate modules:
//    · Box Tracker    — physical storage locations
//    · Kitchen Brain  — pantry zones (Fridge / Freezer / Pantry)
//    · Life Admin     — location-tagged to-dos
//    · Project Brain  — physical workspace contexts
//  If globalized: HQKeys.GLOBAL_ROOMS key in hq-store.js KEYS;
//  this tab becomes the canonical rooms editor; consuming modules
//  declare which fields they use via hq-module-registry.js.
//  Decision deferred — current scope is Deep Clean only.

// ── Storage Keys ────────────────────────────────────────────────
const ROOMS_CONFIG_KEY = HQKeys.ROOMS_CONFIG;
const FLOW_CONFIG_KEY  = HQKeys.FLOW_CONFIG;

// ── Default room definitions (mirrors RT in deep-clean.compiled.js) ──
const DC_ROOMS_DEFAULT = [
  {id:'kitchen',  name:'Kitchenette',  emoji:'🍳', color:'#4A8C58', builtIn:true, enabled:true},
  {id:'dining',   name:'Dining Nook',  emoji:'🌿', color:'#3E8060', builtIn:true, enabled:true},
  {id:'living',   name:'Living Room',  emoji:'🛋️', color:'#3A8878', builtIn:true, enabled:true},
  {id:'hallway',  name:'Hallway',      emoji:'🚪', color:'#508860', builtIn:true, enabled:true},
  {id:'closets',  name:'Closets ×2',   emoji:'👗', color:'#9A6050', builtIn:true, enabled:true},
  {id:'bedroom',  name:'Bedroom',      emoji:'🛏️', color:'#6A58BC', builtIn:true, enabled:true},
  {id:'bathroom', name:'Bathroom',     emoji:'🚿', color:'#4870B4', builtIn:true, enabled:true},
  {id:'fridge',   name:'Fridge',       emoji:'🧊', color:'#388080', builtIn:true, enabled:true},
  {id:'final',    name:'Final Tasks',  emoji:'🏆', color:'#9A8000', builtIn:true, enabled:true},
];

// ── Default phase order (mirrors PH_ORDER in deep-clean.compiled.js) ──
const DC_PHASES_DEFAULT = [
  {id:'gather',   label:'Gather & Remove',           emoji:'🗑️', color:'#A04040'},
  {id:'tidy',     label:'Clear & Tidy Surfaces',     emoji:'📦', color:'#6050A0'},
  {id:'surfaces', label:'Wipe & Scrub Surfaces',     emoji:'✨', color:'#387858'},
  {id:'dishes',   label:'Sort & Wash Dishes',        emoji:'🍽️', color:'#5A7840'},
  {id:'special',  label:'Special Tasks',             emoji:'⭐', color:'#C07030'},
  {id:'floors',   label:'Floors',                    emoji:'🧹', color:'#785030'},
  {id:'bedroom',  label:'Bedroom',                   emoji:'🛏️', color:'#6A58BC'},
  {id:'organize', label:'Organize, Tidy & Put Away', emoji:'🗂️', color:'#585098'},
  {id:'final',    label:'Final Tasks',               emoji:'🏆', color:'#907000'},
];

// ── Load / Save helpers ─────────────────────────────────────────
function _loadRoomsConfig(){
  try{
    const raw = HQSafe.store.get(ROOMS_CONFIG_KEY);
    if(raw && raw.rooms && raw.rooms.length) return raw;
  }catch(e){}
  return {rooms: JSON.parse(JSON.stringify(DC_ROOMS_DEFAULT))};
}
function _saveRoomsConfig(cfg){
  try{ HQSafe.store.set(ROOMS_CONFIG_KEY, cfg); }catch(e){}
}
function _loadFlowConfig(){
  try{
    const raw = HQSafe.store.get(FLOW_CONFIG_KEY);
    if(raw && raw.phaseOrder && raw.phaseOrder.length) return raw;
  }catch(e){}
  return {phaseOrder: DC_PHASES_DEFAULT.map(p => p.id)};
}
function _saveFlowConfig(cfg){
  try{ HQSafe.store.set(FLOW_CONFIG_KEY, cfg); }catch(e){}
}

// ── ROOMS POOL ─────────────────────────────────────────────────
function renderRoomsPool(){
  const el = document.getElementById('dc-rooms-list');
  if(!el) return;
  const cfg   = _loadRoomsConfig();
  const rooms = cfg.rooms;
  if(!rooms.length){
    el.innerHTML = '<div style="color:var(--muted);font-size:12px;padding:8px 0">No rooms defined.</div>';
    return;
  }
  el.innerHTML = rooms.map((r, idx) => {
    const isFirst = idx === 0, isLast = idx === rooms.length - 1;
    return `<div class="mod-row" style="${r.enabled ? '' : 'opacity:.4'}">
      <div class="mod-order-btns">
        <button class="mod-ord-btn" ${isFirst ? 'disabled' : ''} onclick="dcRoomMove(${idx},-1)">▲</button>
        <button class="mod-ord-btn" ${isLast  ? 'disabled' : ''} onclick="dcRoomMove(${idx},1)">▼</button>
      </div>
      <span style="font-size:20px;width:26px;text-align:center">${r.emoji}</span>
      <span class="mod-label">${esc(r.name)}</span>
      <span style="display:inline-block;width:14px;height:14px;border-radius:50%;background:${r.color||'#888'};flex-shrink:0"></span>
      ${r.builtIn ? '<span class="mod-core-badge">BUILT-IN</span>' : ''}
      <div style="display:flex;gap:5px;margin-left:auto;align-items:center">
        <label class="tog" title="${r.enabled ? 'Disable' : 'Enable'} room">
          <input type="checkbox" ${r.enabled ? 'checked' : ''} onchange="dcRoomToggle(${idx},this.checked)">
          <span class="tog-sl"></span>
        </label>
        <button class="btn-s" style="padding:2px 8px;font-size:11px" onclick="openEditRoom(${idx})">✏️</button>
        ${!r.builtIn ? `<button class="btn-s" style="padding:2px 8px;font-size:11px;color:var(--red);border-color:rgba(208,48,32,.3)" onclick="dcRoomDelete(${idx})">🗑️</button>` : ''}
      </div>
    </div>`;
  }).join('');
}

function dcRoomToggle(idx, val){
  const cfg = _loadRoomsConfig();
  cfg.rooms[idx].enabled = val;
  _saveRoomsConfig(cfg);
  renderRoomsPool();
  HQToast.show(val ? '✅ Room enabled' : '🔕 Room disabled — reload Deep Clean to apply');
}

function dcRoomMove(idx, dir){
  const cfg = _loadRoomsConfig();
  const arr = cfg.rooms;
  const target = idx + dir;
  if(target < 0 || target >= arr.length) return;
  [arr[idx], arr[target]] = [arr[target], arr[idx]];
  _saveRoomsConfig(cfg);
  renderRoomsPool();
}

function openAddRoom(){
  document.getElementById('rm-edit-id').value  = '';
  document.getElementById('rm-name').value      = '';
  document.getElementById('rm-emoji').value     = '';
  document.getElementById('rm-color').value     = '#645EB7';
  document.getElementById('room-modal-title').textContent = '➕ Add Room';
  openModal('room-modal');
}

function openEditRoom(idx){
  const r = _loadRoomsConfig().rooms[idx];
  document.getElementById('rm-edit-id').value  = idx;
  document.getElementById('rm-name').value      = r.name;
  document.getElementById('rm-emoji').value     = r.emoji;
  document.getElementById('rm-color').value     = r.color || '#645EB7';
  document.getElementById('room-modal-title').textContent = '✏️ Edit Room';
  openModal('room-modal');
}

function saveRoom(){
  const idxStr = document.getElementById('rm-edit-id').value;
  const name   = document.getElementById('rm-name').value.trim();
  const emoji  = document.getElementById('rm-emoji').value.trim() || '🏠';
  const color  = document.getElementById('rm-color').value;
  if(!name){ HQToast.show('⚠️ Name is required'); return; }
  const cfg = _loadRoomsConfig();
  if(idxStr !== ''){
    const idx = parseInt(idxStr);
    cfg.rooms[idx] = Object.assign({}, cfg.rooms[idx], {name, emoji, color});
  } else {
    cfg.rooms.push({id:'custom-'+Date.now(), name, emoji, color, builtIn:false, enabled:true});
  }
  _saveRoomsConfig(cfg);
  closeModal('room-modal');
  renderRoomsPool();
  HQToast.show('💾 Room saved — reload Deep Clean to apply');
}

async function dcRoomDelete(idx){
  if(!(await HQConfirm.ask('Remove this custom room?', {danger:true}))) return;
  const cfg = _loadRoomsConfig();
  cfg.rooms.splice(idx, 1);
  _saveRoomsConfig(cfg);
  renderRoomsPool();
  HQToast.show('🗑️ Room removed');
}

async function dcRoomsReset(){
  if(!(await HQConfirm.ask('Reset all rooms to defaults?', {danger:true}))) return;
  try{ HQSafe.store.remove(ROOMS_CONFIG_KEY); }catch(e){}
  renderRoomsPool();
  HQToast.show('↺ Rooms reset to defaults');
}

// ── CUSTOM ROOM TASKS  (stub — v2) ─────────────────────────────
// Custom rooms above have no task list in deep-clean.compiled.js
// because task IDs are baked into the React component. v2 will add
// a task store for user-defined rooms so they appear in the OOO flow.
//
// Storage key reserved : HQKeys.CUSTOM_ROOM_TASKS
// Schema               : { [roomId]: [ {id, title, phase, difficulty, priority} ] }
//
// function _loadCustomRoomTasks(){ return HQSafe.store.get(HQKeys.CUSTOM_ROOM_TASKS, {}); }
// function _saveCustomRoomTasks(d){ HQSafe.store.set(HQKeys.CUSTOM_ROOM_TASKS, d); }

// ── OP FLOW ─────────────────────────────────────────────────────
function renderFlowOrder(){
  const el = document.getElementById('dc-flow-list');
  if(!el) return;
  const cfg   = _loadFlowConfig();
  const order = cfg.phaseOrder;
  const phMap = {};
  DC_PHASES_DEFAULT.forEach(p => phMap[p.id] = p);
  el.innerHTML = order.map((pid, idx) => {
    const ph = phMap[pid] || {id:pid, label:pid, emoji:'❓', color:'#888'};
    const isFirst = idx === 0, isLast = idx === order.length - 1;
    return `<div class="mod-row">
      <div class="mod-order-btns">
        <button class="mod-ord-btn" ${isFirst ? 'disabled' : ''} onclick="flowMove(${idx},-1)">▲</button>
        <button class="mod-ord-btn" ${isLast  ? 'disabled' : ''} onclick="flowMove(${idx},1)">▼</button>
      </div>
      <span style="font-size:20px;width:26px;text-align:center">${ph.emoji}</span>
      <span class="mod-label">${esc(ph.label)}</span>
      <span style="font-size:10px;background:${ph.color}22;color:${ph.color};border:1px solid ${ph.color}44;border-radius:5px;padding:2px 7px;font-weight:700">Phase ${idx+1}</span>
    </div>`;
  }).join('');
}

function flowMove(idx, dir){
  const cfg   = _loadFlowConfig();
  const order = cfg.phaseOrder;
  const target = idx + dir;
  if(target < 0 || target >= order.length) return;
  [order[idx], order[target]] = [order[target], order[idx]];
  cfg.phaseOrder = order;
  _saveFlowConfig(cfg);
  renderFlowOrder();
  HQToast.show('🌊 Flow updated — reload Deep Clean to apply');
}

async function dcFlowReset(){
  if(!(await HQConfirm.ask('Reset phase order to defaults?', {danger:true}))) return;
  try{ HQSafe.store.remove(FLOW_CONFIG_KEY); }catch(e){}
  renderFlowOrder();
  HQToast.show('↺ Phase order reset');
}

// ── Spaces Tab Entry Point ──────────────────────────────────────
// ── ROOM TASK POOLS ──────────────────────────────────────────────
const TASK_POOL_PRESETS = {
  light:  [ {id:'t-sweep',title:'Quick sweep',     phase:'floors',   difficulty:'cake'},
             {id:'t-wipe', title:'Wipe surfaces',  phase:'surfaces', difficulty:'cake'} ],
  normal: [ {id:'t-sweep',title:'Sweep/vacuum',    phase:'floors',   difficulty:'usual'},
             {id:'t-wipe', title:'Wipe surfaces',  phase:'surfaces', difficulty:'usual'},
             {id:'t-tidy', title:'Tidy & clear',   phase:'tidy',     difficulty:'usual'} ],
  deep:   [ {id:'t-sweep',title:'Vacuum + mop',    phase:'floors',   difficulty:'rough'},
             {id:'t-scrub',title:'Scrub surfaces',  phase:'surfaces', difficulty:'rough'},
             {id:'t-tidy', title:'Full tidy',       phase:'tidy',     difficulty:'rough'},
             {id:'t-org',  title:'Organize & sort', phase:'organize', difficulty:'rough'} ],
};

function _loadTaskPools(){
  try{ const r=HQSafe.store.get(HQKeys.CUSTOM_ROOM_TASKS); return (r&&typeof r==='object')?r:{}; }catch(e){ return {}; }
}
function _saveTaskPools(d){
  try{ HQSafe.store.set(HQKeys.CUSTOM_ROOM_TASKS,d); }catch(e){}
}

function renderTaskPoolsList(){
  const el=document.getElementById('dc-task-pools-list');
  if(!el) return;
  const cfg=_loadRoomsConfig();
  const pools=_loadTaskPools();
  if(!cfg.rooms||!cfg.rooms.length){ el.innerHTML='<div style="color:var(--muted);font-size:12px">No rooms defined yet.</div>'; return; }
  el.innerHTML=cfg.rooms.filter(r=>r.enabled!==false).map(r=>{
    const tasks=pools[r.id]||[];
    const preview=tasks.length?tasks.length+' task'+(tasks.length!==1?'s':'')+': '+tasks.slice(0,3).map(t=>esc(t.title)).join(', ')+(tasks.length>3?'...':''):'Using defaults';
    return '<div class="mod-row" style="align-items:flex-start;flex-direction:column;gap:4px;padding:10px 0;border-bottom:1px solid var(--border)">'
      +'<div style="display:flex;align-items:center;justify-content:space-between;width:100%">'
      +'<span style="font-size:14px;font-weight:800">'+r.emoji+' '+esc(r.name)+'</span>'
      +'<button class="btn-s" style="padding:2px 10px;font-size:11px" onclick="openTaskPoolEditor(\''+r.id+'\',\''+esc(r.name)+'\')">&#9999;&#65039; Edit Tasks</button>'
      +'</div>'
      +'<div style="font-size:11px;color:var(--muted)">'+preview+'</div>'
      +'</div>';
  }).join('');
}

let _tpmRoomId='', _tpmRoomName='', _tpmTasks=[];

function openTaskPoolEditor(roomId, roomName){
  _tpmRoomId=roomId;
  _tpmRoomName=roomName;
  const pools=_loadTaskPools();
  _tpmTasks=JSON.parse(JSON.stringify(pools[roomId]||[]));
  const titleEl=document.getElementById('tpm-title');
  const labelEl=document.getElementById('tpm-room-label');
  if(titleEl) titleEl.textContent='Task Pool: '+roomName;
  if(labelEl) labelEl.textContent='Editing default tasks for: '+roomName;
  _renderTpmPresets();
  _renderTpmTaskList();
  openModal('task-pool-modal');
}

function _renderTpmPresets(){
  const el=document.getElementById('tpm-presets');
  if(!el) return;
  el.innerHTML=['light','normal','deep'].map(key=>{
    const label=key==='light'?'Light':key==='normal'?'Normal':'Deep';
    return '<button class="btn-s" style="font-size:11px" onclick="tpmApplyPreset(\''+key+'\')">' + label + '</button>';
  }).join('');
}

function tpmAddTask(){
  const nameEl=document.getElementById('tpm-new-task');
  const phaseEl=document.getElementById('tpm-new-phase');
  const diffEl=document.getElementById('tpm-new-diff');
  const title=nameEl?nameEl.value.trim():'';
  if(!title){ HQToast.show('Enter a task name first'); return; }
  _tpmTasks.push({id:'custom-'+Date.now(),title:title,phase:phaseEl?phaseEl.value:'tidy',difficulty:diffEl?diffEl.value:'usual'});
  if(nameEl) nameEl.value='';
  _renderTpmTaskList();
}

function tpmSave(){
  const pools=_loadTaskPools();
  if(_tpmTasks.length===0){ delete pools[_tpmRoomId]; }
  else{ pools[_tpmRoomId]=JSON.parse(JSON.stringify(_tpmTasks)); }
  _saveTaskPools(pools);
  closeModal('task-pool-modal');
  renderTaskPoolsList();
  HQToast.show('Task pool saved for '+_tpmRoomName);
}

async function dcTaskPoolsReset(){
  if(!(await HQConfirm.ask('Reset all room task pools to defaults?',{danger:true}))) return;
  try{ HQSafe.store.remove(HQKeys.CUSTOM_ROOM_TASKS); }catch(e){}
  renderTaskPoolsList();
  HQToast.show('Task pools reset to defaults');
}

function _renderTpmTaskList(){
  const el=document.getElementById('tpm-task-list');
  if(!el) return;
  if(!_tpmTasks.length){ el.innerHTML='<div style="color:var(--muted);font-size:12px;padding:8px 0">No tasks — pick a preset or add below.</div>'; return; }
  el.innerHTML=_tpmTasks.map(function(t,i){
    return '<div style="display:flex;align-items:center;gap:6px;padding:5px 0;border-bottom:1px solid var(--border)">'
      +'<span style="flex:1;font-size:12px">'+esc(t.title)+'</span>'
      +'<span style="font-size:10px;color:var(--muted)">'+(t.phase||'')+'</span>'
      +'<button style="background:none;border:none;cursor:pointer;color:var(--red);font-size:13px;padding:0 4px" onclick="tpmRemoveTask('+i+')">&#x2715;</button>'
      +'</div>';
  }).join('');
}

// ── Spaces Tab Entry Point ──────────────────────────────────────
function renderSpacesTab(){
  renderRoomsPool();
  renderFlowOrder();
  renderTaskPoolsList();
}

// ── EXPOSE TO GLOBAL SCOPE (HTML onclick handlers) ──────────────────────────
// All functions defined inside this IIFE must be explicitly exported to window
// so that inline onclick/oninput/onchange attributes in customize.html can call them.
window.sw                = sw;
window.openModal         = openModal;
window.closeModal        = closeModal;
window.addPreset         = addPreset;
window.dcFlowReset       = dcFlowReset;
window.dcRoomsReset      = dcRoomsReset;
window.exportData        = exportData;
window.importData        = importData;
window.openAddCat        = openAddCat;
window.openAddFlag       = openAddFlag;
window.openAddRoom       = openAddRoom;
window.renderStorageTab  = renderStorageTab;
window.resetBottomNav    = resetBottomNav;
window.resetLayout       = resetLayout;
window.resetPresets      = resetPresets;
window.resetShortcuts    = resetShortcuts;
window.resetTaxonomy     = resetTaxonomy;
window.saveCat           = saveCat;
window.saveDisplayPrefs  = saveDisplayPrefs;
window.saveFlag          = saveFlag;
window.saveLayout        = saveLayout;
window.saveProfile       = saveProfile;
window.saveReminderConfig= saveReminderConfig;
window.saveRoom          = saveRoom;
window.saveSub           = saveSub;
window.scanLegacyKeys    = scanLegacyKeys;
window.setCaptureRoute   = setCaptureRoute;
window.setDensity        = setDensity;
window.setSchedType      = setSchedType;
window.setUnit           = setUnit;
window.togFG             = togFG;
window.toggleDay         = toggleDay;
window.updateEmojiPreview= updateEmojiPreview;
window.zoneDragLeave     = zoneDragLeave;
window.zoneDragOver      = zoneDragOver;
window.zoneDrop          = zoneDrop;
// ── Spaces / Rooms / Task Pool dynamic-HTML handlers ──────────
window.dcRoomMove        = dcRoomMove;
window.dcRoomToggle      = dcRoomToggle;
window.openEditRoom      = openEditRoom;
window.dcRoomDelete      = dcRoomDelete;
window.flowMove          = flowMove;
window.openTaskPoolEditor= openTaskPoolEditor;
window.tpmApplyPreset    = function(key){
  _tpmTasks = JSON.parse(JSON.stringify(TASK_POOL_PRESETS[key]||[]));
  _renderTpmTaskList();
};
window.tpmRemoveTask     = function(i){
  _tpmTasks.splice(i,1);
  _renderTpmTaskList();
};
window.dcTaskPoolsReset  = dcTaskPoolsReset;
window.tpmAddTask        = tpmAddTask;
window.tpmSave           = tpmSave;

})(); // end customize IIFE
