// ═══════════════════════════════════════════════════════════════
//  AUDHD HQ — Condition Pool View  (Phase B2)
//  Renders a condition's full symptom pool grouped by category,
//  with expand/collapse and quick include/exclude per symptom.
//
//  Usage:
//    window.HQConditionPoolView.render({
//      containerId: 'my-pool-view',
//      conditionId: 'fibromyalgia',
//      onToggle:    fn(symptomId, included)  // optional
//    });
// ═══════════════════════════════════════════════════════════════

(function () {
  'use strict';

  var CSS_ID = 'hq-pool-view-css';

  function injectCSS() {
    if (document.getElementById(CSS_ID)) return;
    var style = document.createElement('style');
    style.id  = CSS_ID;
    style.textContent = [
      '.hq-pool-view { display:flex; flex-direction:column; gap:10px; }',

      /* Condition header */
      '.hq-pv-header { display:flex; align-items:center; gap:10px;',
        'padding:10px 14px; border-radius:12px;',
        'background:var(--card,#1a1630); border:1px solid var(--border,#2a2440); }',
      '.hq-pv-cond-dot { width:10px; height:10px; border-radius:50%; flex-shrink:0; }',
      '.hq-pv-cond-name { font-size:15px; font-weight:800; color:var(--text,#e8e0ff); flex:1; }',
      '.hq-pv-cond-count { font-size:11px; color:var(--text2,#8a82b0); }',

      /* Group */
      '.hq-pv-group { border-radius:10px; border:1px solid var(--border,#2a2440);',
        'overflow:hidden; }',
      '.hq-pv-group-head { display:flex; align-items:center; gap:8px;',
        'padding:8px 12px; background:var(--card,#1a1630); cursor:pointer;',
        'user-select:none; }',
      '.hq-pv-group-head:hover { background:var(--card-hover,#20193a); }',
      '.hq-pv-group-emoji { font-size:14px; }',
      '.hq-pv-group-label { font-size:11px; font-weight:800; letter-spacing:.08em;',
        'text-transform:uppercase; color:var(--text2,#8a82b0); flex:1; }',
      '.hq-pv-group-count { font-size:11px; color:var(--text2,#8a82b0); }',
      '.hq-pv-group-arrow { font-size:10px; color:var(--text2,#8a82b0); transition:.2s; }',
      '.hq-pv-group.collapsed .hq-pv-group-arrow { transform:rotate(-90deg); }',

      /* Group body */
      '.hq-pv-group-body { padding:8px 10px 10px; display:flex; flex-direction:column; gap:6px;',
        'background:var(--bg,#120f24); }',
      '.hq-pv-group.collapsed .hq-pv-group-body { display:none; }',

      /* Symptom row */
      '.hq-pv-row { display:flex; align-items:center; gap:8px; padding:6px 8px;',
        'border-radius:8px; transition:.15s; }',
      '.hq-pv-row:hover { background:var(--card,#1a1630); }',
      '.hq-pv-row-emoji { font-size:16px; }',
      '.hq-pv-row-label { flex:1; font-size:13px; color:var(--text,#e8e0ff); font-weight:600; }',
      '.hq-pv-row-note { font-size:10px; color:var(--text2,#8a82b0); }',
      '.hq-pv-toggle { width:32px; height:20px; border-radius:10px; border:none;',
        'background:var(--border,#2a2440); cursor:pointer; position:relative;',
        'transition:.2s; flex-shrink:0; }',
      '.hq-pv-toggle::after { content:""; position:absolute; width:14px; height:14px;',
        'border-radius:50%; background:#fff; top:3px; left:3px; transition:.2s; }',
      '.hq-pv-toggle.on { background:var(--purple-d,#6d28d9); }',
      '.hq-pv-toggle.on::after { left:15px; }'
    ].join('\n');
    document.head.appendChild(style);
  }

  function render(opts) {
    injectCSS();

    var container = document.getElementById(opts.containerId);
    if (!container) return;

    var condId  = opts.conditionId;
    var pool    = window.HQConditionPools && window.HQConditionPools[condId];
    if (!pool) {
      container.innerHTML = '<div style="color:var(--text2,#8a82b0);font-size:13px;padding:12px">Condition not found.</div>';
      return;
    }

    var utils   = window.HQSymptomUtils;
    var catReg  = window.HQCategoryRegistry || {};
    var symptoms = utils ? utils.symptomsForCondition(condId) : [];
    var grouped  = utils ? utils.groupedWithMeta(symptoms) : [{ category: { id:'all', label:'All', emoji:'•' }, symptoms: symptoms }];

    // Track included state (all on by default)
    var included = {};
    symptoms.forEach(function(s) { included[s.id] = true; });

    var root = document.createElement('div');
    root.className = 'hq-pool-view';

    // Header
    var hdr   = document.createElement('div');
    hdr.className = 'hq-pv-header';
    var dot   = document.createElement('div');
    dot.className = 'hq-pv-cond-dot';
    dot.style.background = pool.color || '#a78bfa';
    var name  = document.createElement('div');
    name.className = 'hq-pv-cond-name';
    name.textContent = (pool.emoji || '') + ' ' + pool.name;
    var cnt   = document.createElement('div');
    cnt.className = 'hq-pv-cond-count';
    cnt.textContent = symptoms.length + ' symptoms';

    hdr.appendChild(dot);
    hdr.appendChild(name);
    hdr.appendChild(cnt);
    root.appendChild(hdr);

    // Groups
    grouped.forEach(function(g) {
      var group = document.createElement('div');
      group.className = 'hq-pv-group';

      var head = document.createElement('div');
      head.className = 'hq-pv-group-head';
      head.innerHTML =
        '<span class="hq-pv-group-emoji">' + g.category.emoji + '</span>' +
        '<span class="hq-pv-group-label">' + g.category.label + '</span>' +
        '<span class="hq-pv-group-count">' + g.symptoms.length + '</span>' +
        '<span class="hq-pv-group-arrow">▼</span>';

      head.onclick = function() {
        group.classList.toggle('collapsed');
      };

      var body = document.createElement('div');
      body.className = 'hq-pv-group-body';

      g.symptoms.forEach(function(s) {
        var row     = document.createElement('div');
        row.className = 'hq-pv-row';

        var toggle  = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'hq-pv-toggle on';
        toggle.setAttribute('aria-label', 'Toggle ' + s.label);

        toggle.onclick = function() {
          included[s.id] = !included[s.id];
          toggle.classList.toggle('on', included[s.id]);
          if (typeof opts.onToggle === 'function') {
            opts.onToggle(s.id, included[s.id]);
          }
        };

        row.innerHTML =
          '<span class="hq-pv-row-emoji">' + (s.emoji || '•') + '</span>' +
          '<div style="flex:1">' +
            '<div class="hq-pv-row-label">' + s.label + '</div>' +
            (s.notes ? '<div class="hq-pv-row-note">' + s.notes + '</div>' : '') +
          '</div>';
        row.appendChild(toggle);
        body.appendChild(row);
      });

      group.appendChild(head);
      group.appendChild(body);
      root.appendChild(group);
    });

    container.innerHTML = '';
    container.appendChild(root);

    // Return API for reading included state
    return {
      getIncluded: function() {
        return Object.keys(included).filter(function(id) { return included[id]; });
      },
      getExcluded: function() {
        return Object.keys(included).filter(function(id) { return !included[id]; });
      }
    };
  }

  window.HQConditionPoolView = { render: render };

}());
