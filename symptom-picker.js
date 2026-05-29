// ═══════════════════════════════════════════════════════════════
//  AUDHD HQ — Symptom Picker Component  (Phase B2)
//  Depends on: symptom-registry.js, condition-pools.js,
//              category-registry.js, symptom-utils.js,
//              symptom-search.js, symptom-filters.js
//
//  Usage:
//    window.HQSymptomPicker.init({
//      containerId: 'my-picker',   // mounts into this element
//      mode:        'watchlist'    // 'watchlist' | 'quicklog' | 'condition'
//      conditionId: 'fibromyalgia',// required when mode = 'condition'
//      onSelect:    fn(symptom),   // called on each tap
//      onSave:      fn(selection), // called on Save
//      multi:       true           // true = multi-select (default), false = single
//    });
// ═══════════════════════════════════════════════════════════════

(function () {
  'use strict';

  // ── Internal state per picker instance ────────────────────────
  var instances = {};

  // ── CSS (injected once) ───────────────────────────────────────
  var CSS_ID = 'hq-symptom-picker-css';
  function injectCSS() {
    if (document.getElementById(CSS_ID)) return;
    var style = document.createElement('style');
    style.id = CSS_ID;
    style.textContent = [
      /* Container */
      '.hq-picker { display:flex; flex-direction:column; gap:12px; }',

      /* Search bar */
      '.hq-picker-search-wrap { position:relative; }',
      '.hq-picker-search { width:100%; padding:10px 14px 10px 36px;',
        'background:var(--card,#1a1630); border:1px solid var(--border,#2a2440);',
        'border-radius:10px; color:var(--text,#e8e0ff);',
        'font-size:14px; font-family:inherit; outline:none; }',
      '.hq-picker-search::placeholder { color:var(--text2,#8a82b0); }',
      '.hq-picker-search-icon { position:absolute; left:11px; top:50%;',
        'transform:translateY(-50%); font-size:14px; pointer-events:none; }',
      '.hq-picker-search:focus { border-color:var(--purple,#a78bfa); }',

      /* Category filter bar */
      '.hq-picker-cats { display:flex; gap:6px; flex-wrap:wrap; }',
      '.hq-picker-cat-btn { padding:4px 10px; border-radius:20px; border:1px solid var(--border,#2a2440);',
        'background:var(--card,#1a1630); color:var(--text2,#8a82b0);',
        'font-size:11px; font-weight:700; cursor:pointer; transition:.15s; white-space:nowrap; }',
      '.hq-picker-cat-btn.active { background:var(--purple-d,#6d28d9); color:#fff;',
        'border-color:var(--purple,#a78bfa); }',

      /* Group header */
      '.hq-picker-group { display:flex; flex-direction:column; gap:6px; }',
      '.hq-picker-group-label { font-size:10px; font-weight:800; letter-spacing:.1em;',
        'text-transform:uppercase; color:var(--text2,#8a82b0); padding:4px 0 2px; }',
      '.hq-picker-chips-wrap { display:flex; flex-wrap:wrap; gap:6px; }',

      /* Symptom chips */
      '.hq-sym-chip { display:inline-flex; align-items:center; gap:5px;',
        'padding:6px 11px; border-radius:20px; border:1.5px solid var(--border,#2a2440);',
        'background:var(--card,#1a1630); color:var(--text,#e8e0ff);',
        'font-size:12px; font-weight:600; cursor:pointer; transition:.15s;',
        'user-select:none; -webkit-user-select:none; }',
      '.hq-sym-chip:hover { border-color:var(--purple,#a78bfa); background:var(--card-hover,#20193a); }',
      '.hq-sym-chip.selected { background:var(--purple-d,#6d28d9); border-color:var(--purple,#a78bfa); color:#fff; }',
      '.hq-sym-chip.fav { border-color:#f59e0b; }',
      '.hq-sym-chip-emoji { font-size:14px; }',
      '.hq-sym-chip-label { line-height:1.2; }',

      /* Severity slider (inline) */
      '.hq-sev-row { display:flex; align-items:center; gap:8px;',
        'padding:6px 10px; background:var(--card,#1a1630);',
        'border-radius:8px; border:1px solid var(--border,#2a2440); }',
      '.hq-sev-label { font-size:11px; color:var(--text2,#8a82b0); flex:1; }',
      '.hq-sev-slider { flex:2; accent-color:var(--purple,#a78bfa); cursor:pointer; }',
      '.hq-sev-val { font-size:12px; font-weight:700; color:var(--purple,#a78bfa);',
        'min-width:18px; text-align:right; }',

      /* Empty / no-results state */
      '.hq-picker-empty { padding:24px 0; text-align:center; color:var(--text2,#8a82b0);',
        'font-size:13px; }',

      /* Save bar */
      '.hq-picker-save-bar { display:flex; align-items:center; justify-content:space-between;',
        'padding:10px 0 2px; border-top:1px solid var(--border,#2a2440); }',
      '.hq-picker-count { font-size:12px; color:var(--text2,#8a82b0); }',
      '.hq-picker-save-btn { padding:8px 18px; border-radius:10px;',
        'background:var(--purple-d,#6d28d9); border:none; color:#fff;',
        'font-size:13px; font-weight:700; cursor:pointer; transition:.15s; }',
      '.hq-picker-save-btn:hover { background:var(--purple,#a78bfa); }',

      /* Favorites shortcut strip */
      '.hq-picker-favs { display:flex; flex-wrap:wrap; gap:5px;',
        'padding:4px 0; border-bottom:1px solid var(--border,#2a2440); }',
      '.hq-picker-fav-label { font-size:10px; font-weight:800; letter-spacing:.08em;',
        'text-transform:uppercase; color:var(--text2,#8a82b0); width:100%; margin-bottom:2px; }',

      /* Night mode safety */
      '@media (prefers-color-scheme:dark) {',
        '.hq-picker-search { color-scheme:dark; }',
      '}'
    ].join('\n');
    document.head.appendChild(style);
  }

  // ── Helpers ───────────────────────────────────────────────────

  function h(tag, attrs, children) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'className') { el.className = attrs[k]; }
      else if (k.startsWith('on')) { el[k] = attrs[k]; }
      else el.setAttribute(k, attrs[k]);
    });
    if (children) {
      (Array.isArray(children) ? children : [children]).forEach(function (c) {
        if (c == null) return;
        el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
      });
    }
    return el;
  }

  // ── Core init ─────────────────────────────────────────────────

  function init(opts) {
    injectCSS();

    var container = document.getElementById(opts.containerId);
    if (!container) {
      console.warn('[HQSymptomPicker] Container not found:', opts.containerId);
      return;
    }

    var id = opts.containerId;
    var mode = opts.mode || 'watchlist';

    // Build state
    instances[id] = {
      opts:         opts,
      selected:     {}, // symptomId -> { symptom, severity }
      activeFilter: null,
      searchQuery:  ''
    };
    var state = instances[id];

    // Source symptoms
    function getSourceSymptoms() {
      var utils = window.HQSymptomUtils;
      if (mode === 'condition' && opts.conditionId) {
        return utils ? utils.symptomsForCondition(opts.conditionId) : [];
      }
      if (mode === 'watchlist') {
        var wl = utils ? utils.loadWatchlist() : [];
        return wl.length ? wl : (utils ? utils.allSymptoms().filter(function(s){ return s.quickLog; }) : []);
      }
      // 'quicklog' or default — all quickLog symptoms
      return utils ? utils.allSymptoms().filter(function(s){ return s.quickLog; }) : [];
    }

    function getFilteredSymptoms() {
      var symptoms = getSourceSymptoms();

      // Search
      var q = state.searchQuery.trim().toLowerCase();
      if (q) {
        // Phase B4: prefer cache (memoized) → search → fallback scan
        var searchFn = (window.HQSymptomCache && window.HQSymptomCache.search)
          ? window.HQSymptomCache.search
          : (window.HQSymptomSearch && window.HQSymptomSearch.searchSymptoms)
            ? window.HQSymptomSearch.searchSymptoms
            : null;

        if (searchFn) {
          var sourceIds = new Set(getSourceSymptoms().map(function(x){ return x.id; }));
          symptoms = searchFn(q).filter(function(s) { return sourceIds.has(s.id); });
        } else {
          symptoms = symptoms.filter(function(s) { return s.label.toLowerCase().includes(q); });
        }
      }

      // Category filter
      if (state.activeFilter) {
        symptoms = symptoms.filter(function(s) {
          return (s.categories || []).includes(state.activeFilter);
        });
      }

      return symptoms;
    }

    // ── Render ─────────────────────────────────────────────────

    function render() {
      container.innerHTML = '';
      var root = h('div', { className: 'hq-picker' });

      // Favorites strip (if any)
      var favs = (window.HQSymptomUtils && window.HQSymptomUtils.loadFavorites()) || [];
      if (favs.length) {
        var registry = window.HQSymptomRegistry || {};
        var favSyms  = favs.map(function(id){ return registry[id]; }).filter(Boolean);
        if (favSyms.length) {
          var favStrip = h('div', { className: 'hq-picker-favs' });
          favStrip.appendChild(h('div', { className: 'hq-picker-fav-label' }, '⭐ Favorites'));
          favSyms.forEach(function(s) { favStrip.appendChild(buildChip(s)); });
          root.appendChild(favStrip);
        }
      }

      // Search bar
      var searchWrap = h('div', { className: 'hq-picker-search-wrap' });
      var searchIcon = h('span', { className: 'hq-picker-search-icon' }, '🔍');
      var searchInput = h('input', {
        type:        'text',
        className:   'hq-picker-search',
        placeholder: 'Search symptoms…',
        value:       state.searchQuery
      });
      searchInput.value = state.searchQuery;
      searchInput.oninput = function() {
        state.searchQuery = searchInput.value;
        renderBody();
      };
      searchWrap.appendChild(searchIcon);
      searchWrap.appendChild(searchInput);
      root.appendChild(searchWrap);

      // Category filter bar
      var catBar = buildCategoryBar();
      if (catBar.children.length > 1) root.appendChild(catBar); // > 1 = "All" + at least one cat

      // Body (groups)
      var body = h('div', { className: 'hq-picker-body' });
      root.appendChild(body);

      // Save bar
      if (opts.multi !== false) {
        root.appendChild(buildSaveBar());
      }

      container.appendChild(root);
      renderBody();

      // Focus search
      searchInput.focus();
    }

    function renderBody() {
      var body = container.querySelector('.hq-picker-body');
      if (!body) return;
      body.innerHTML = '';

      var symptoms = getFilteredSymptoms();

      if (!symptoms.length) {
        body.appendChild(h('div', { className: 'hq-picker-empty' }, 'No symptoms match your search.'));
        return;
      }

      // Group display: flat if category filter active, grouped otherwise
      if (state.activeFilter || state.searchQuery) {
        var wrap = h('div', { className: 'hq-picker-chips-wrap' });
        symptoms.forEach(function(s) { wrap.appendChild(buildChip(s)); });
        body.appendChild(wrap);
      } else {
        var utils = window.HQSymptomUtils;
        var grouped = utils ? utils.groupedWithMeta(symptoms) : [{ category: { id:'all', label:'All', emoji:'•' }, symptoms: symptoms }];
        grouped.forEach(function(g) {
          var group = h('div', { className: 'hq-picker-group' });
          var lbl   = h('div', { className: 'hq-picker-group-label' },
                        g.category.emoji + ' ' + g.category.label);
          var chips = h('div', { className: 'hq-picker-chips-wrap' });
          g.symptoms.forEach(function(s) { chips.appendChild(buildChip(s)); });
          group.appendChild(lbl);
          group.appendChild(chips);
          body.appendChild(group);
        });
      }

      // Refresh save bar count
      var countEl = container.querySelector('.hq-picker-count');
      if (countEl) {
        var n = Object.keys(state.selected).length;
        countEl.textContent = n + ' selected';
      }
    }

    function buildChip(s) {
      var favs   = (window.HQSymptomUtils && window.HQSymptomUtils.loadFavorites()) || [];
      var isSel  = !!state.selected[s.id];
      var isFav  = favs.includes(s.id);
      var cls    = 'hq-sym-chip' + (isSel ? ' selected' : '') + (isFav ? ' fav' : '');

      var chip = h('div', { className: cls });
      chip.appendChild(h('span', { className: 'hq-sym-chip-emoji' }, s.emoji || '•'));
      chip.appendChild(h('span', { className: 'hq-sym-chip-label' }, s.label));

      chip.onclick = function(e) {
        e.stopPropagation();
        if (opts.multi === false) {
          // Single select — clear all others
          state.selected = {};
          container.querySelectorAll('.hq-sym-chip').forEach(function(c) {
            c.classList.remove('selected');
          });
        }

        if (state.selected[s.id]) {
          delete state.selected[s.id];
          chip.classList.remove('selected');
          // Remove severity row if present
          var sevRow = container.querySelector('[data-sev-id="' + s.id + '"]');
          if (sevRow) sevRow.remove();
        } else {
          state.selected[s.id] = { symptom: s, severity: null };
          chip.classList.add('selected');
          // Inject severity row if supported
          if (s.severitySupported) {
            insertSeverityRow(s, chip);
          }
        }

        if (typeof opts.onSelect === 'function') opts.onSelect(s, state.selected);
        renderBody();
      };

      // Long-press / right-click to toggle favorite
      chip.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        if (window.HQSymptomUtils) window.HQSymptomUtils.toggleFavorite(s.id);
        render();
      });

      return chip;
    }

    function insertSeverityRow(s, afterEl) {
      var row = h('div', { className: 'hq-sev-row' });
      row.setAttribute('data-sev-id', s.id);

      var lbl    = h('span', { className: 'hq-sev-label' }, s.label + ' severity');
      var slider = h('input', { type: 'range', className: 'hq-sev-slider', min: '1', max: '10', value: '5' });
      var val    = h('span', { className: 'hq-sev-val' }, '5');

      slider.oninput = function() {
        val.textContent = slider.value;
        if (state.selected[s.id]) {
          state.selected[s.id].severity = parseInt(slider.value, 10);
        }
      };

      row.appendChild(lbl);
      row.appendChild(slider);
      row.appendChild(val);

      if (afterEl && afterEl.parentNode) {
        afterEl.parentNode.insertBefore(row, afterEl.nextSibling);
      }

      // Set initial value
      if (state.selected[s.id]) state.selected[s.id].severity = 5;
    }

    function buildCategoryBar() {
      var catReg  = window.HQCategoryRegistry || {};
      var source  = getSourceSymptoms();
      var usedCats = {};
      source.forEach(function(s) {
        (s.categories || []).forEach(function(c) { usedCats[c] = true; });
      });

      var bar = h('div', { className: 'hq-picker-cats' });

      // "All" pill
      var allBtn = h('button', {
        type: 'button',
        className: 'hq-picker-cat-btn' + (!state.activeFilter ? ' active' : '')
      }, '🔍 All');
      allBtn.onclick = function() {
        state.activeFilter = null;
        renderBody();
        bar.querySelectorAll('.hq-picker-cat-btn').forEach(function(b){ b.classList.remove('active'); });
        allBtn.classList.add('active');
      };
      bar.appendChild(allBtn);

      Object.keys(usedCats).sort().forEach(function(catId) {
        var cat = catReg[catId] || { emoji: '•', label: catId };
        var btn = h('button', {
          type: 'button',
          className: 'hq-picker-cat-btn' + (state.activeFilter === catId ? ' active' : '')
        }, cat.emoji + ' ' + cat.label);
        btn.onclick = function() {
          state.activeFilter = catId;
          renderBody();
          bar.querySelectorAll('.hq-picker-cat-btn').forEach(function(b){ b.classList.remove('active'); });
          btn.classList.add('active');
        };
        bar.appendChild(btn);
      });

      return bar;
    }

    function buildSaveBar() {
      var n   = Object.keys(state.selected).length;
      var bar = h('div', { className: 'hq-picker-save-bar' });
      var cnt = h('span', { className: 'hq-picker-count' }, n + ' selected');
      var btn = h('button', { type: 'button', className: 'hq-picker-save-btn' }, '💾 Save');

      btn.onclick = function() {
        if (typeof opts.onSave === 'function') opts.onSave(state.selected);
      };

      bar.appendChild(cnt);
      bar.appendChild(btn);
      return bar;
    }

    render();
  }

  // ── Utility: destroy a picker ─────────────────────────────────
  function destroy(containerId) {
    var container = document.getElementById(containerId);
    if (container) container.innerHTML = '';
    delete instances[containerId];
  }

  // ── Utility: get current selection ────────────────────────────
  function getSelection(containerId) {
    return instances[containerId] ? instances[containerId].selected : {};
  }

  // ── Public API ────────────────────────────────────────────────
  window.HQSymptomPicker = {
    init:         init,
    destroy:      destroy,
    getSelection: getSelection
  };

}());
