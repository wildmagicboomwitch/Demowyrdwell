// ═══════════════════════════════════════════════════════════════
//  AUDHD HQ — Symptom Pool Setup  (Phase B3)
//  Depends on: symptom-registry.js, condition-pools.js,
//              category-registry.js, symptom-utils.js,
//              symptom-search.js, symptom-filters.js,
//              symptom-picker.js, condition-pool-view.js
//
//  Backward compatible: window.HQSymptomSetup API preserved.
//  Phase B additions surfaced via HQSymptomSetup.v2.
// ═══════════════════════════════════════════════════════════════

(function () {
  'use strict';

  // ── Storage keys (mirrored from symptom-utils.js for resilience) ──
  var KEYS = {
    selectedConditions: HQKeys.SELECTED_CONDITIONS,
    symptomWatchlist:   HQKeys.SYMPTOM_WATCHLIST,
    favoriteSymptoms:   HQKeys.FAVORITE_SYMPTOMS,
    symptomHistory:     HQKeys.SYMPTOM_HISTORY
  };

  // ── Load / save helpers ───────────────────────────────────────
  function loadJSON(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || 'null') || fallback; }
    catch (e) { return fallback; }
  }

  function loadSelectedConditions()    { return loadJSON(KEYS.selectedConditions, []); }
  function saveSelectedConditions(ids) { localStorage.setItem(KEYS.selectedConditions, JSON.stringify(ids)); }
  function loadWatchlist()             { return loadJSON(KEYS.symptomWatchlist, []); }

  // ── Build watchlist (delegates to utils if available) ─────────
  function buildWatchlist(selectedIds) {
    if (window.HQSymptomUtils && window.HQSymptomUtils.buildWatchlistFromConditions) {
      return window.HQSymptomUtils.buildWatchlistFromConditions(selectedIds);
    }
    // Fallback: direct registry access
    var registry = window.HQSymptomRegistry || {};
    var pools    = window.HQConditionPools   || {};
    var seen     = new Set();
    var watchlist = [];
    selectedIds.forEach(function (condId) {
      var pool = pools[condId];
      if (!pool) return;
      pool.symptoms.forEach(function (symptomId) {
        if (!seen.has(symptomId) && registry[symptomId]) {
          seen.add(symptomId);
          watchlist.push(registry[symptomId]);
        }
      });
    });
    return watchlist;
  }

  function saveWatchlist(selectedIds) {
    var watchlist = buildWatchlist(selectedIds);
    localStorage.setItem(KEYS.symptomWatchlist, JSON.stringify(watchlist));
    return watchlist;
  }

  // ── Toast ─────────────────────────────────────────────────────
  function toast(msg) {
    if (typeof window.showToast === 'function') { window.showToast(msg); return; }
    var el = document.getElementById('toast');
    if (el) {
      el.textContent = msg;
      el.classList.add('show');
      setTimeout(function () { el.classList.remove('show'); }, 2200);
    }
  }

  // ─────────────────────────────────────────────────────────────
  //  CONDITION PILL PICKER  (Phase A API preserved)
  // ─────────────────────────────────────────────────────────────

  function initPicker(gridId, watchlistId, onSave) {
    var grid = document.getElementById(gridId);
    if (!grid) return;

    var pools    = window.HQConditionPools || {};
    var selected = loadSelectedConditions();

    grid.innerHTML = '';

    // Inject minimal pill styles if not already present
    injectPillCSS();

    Object.values(pools).forEach(function (condition) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'condition-pill' + (selected.includes(condition.id) ? ' active' : '');
      btn.setAttribute('data-cid', condition.id);
      btn.innerHTML =
        '<span class="cp-emoji">' + condition.emoji + '</span>' +
        '<span class="cp-name">'  + condition.name  + '</span>';
      btn.style.setProperty('--pill-accent', condition.color || '#a78bfa');

      btn.onclick = function () {
        var idx = selected.indexOf(condition.id);
        if (idx === -1) { selected.push(condition.id); btn.classList.add('active'); }
        else { selected.splice(idx, 1); btn.classList.remove('active'); }
      };

      grid.appendChild(btn);
    });

    // Attach save button (Phase A discovery logic preserved)
    var saveBtn = document.getElementById(gridId.replace('grid', 'save-btn'));
    if (!saveBtn) {
      var card = grid.closest('.card, .symptom-setup-card');
      saveBtn = card ? card.querySelector('.pool-save-btn') : null;
    }

    if (saveBtn) {
      saveBtn.onclick = function () {
        saveSelectedConditions(selected);
        var watchlist = saveWatchlist(selected);
        toast('✅ Symptom pool saved — ' + watchlist.length + ' symptoms tracked');
        if (watchlistId) renderWatchlistChips(watchlistId, watchlist);
        if (typeof onSave === 'function') onSave(watchlist);
      };
    }
  }

  // ─────────────────────────────────────────────────────────────
  //  WATCHLIST CHIP RENDERERS  (Phase A API preserved)
  // ─────────────────────────────────────────────────────────────

  function renderWatchlistChips(containerId, watchlistOverride) {
    var el = document.getElementById(containerId);
    if (!el) return;
    var symptoms = watchlistOverride || loadWatchlist();
    if (!symptoms.length) {
      el.innerHTML =
        '<div class="pool-empty-state">No conditions selected yet. ' +
        'Choose conditions above to auto-build your watchlist.</div>';
      return;
    }
    el.innerHTML = symptoms.map(function (s) {
      return '<span class="symptom-chip">' +
               '<span class="sc-emoji">' + (s.emoji || '•') + '</span>' +
               '<span class="sc-label">' + s.label + '</span>' +
             '</span>';
    }).join('');
  }

  function getCategoryLabel(cat) {
    var catReg = window.HQCategoryRegistry || {};
    if (catReg[cat]) return catReg[cat].emoji + ' ' + catReg[cat].label;
    var fallback = {
      cognitive: '🧠 Cognitive', physical: '💪 Physical', pain: '🦴 Pain',
      sensory: '🔊 Sensory', neurological: '⚡ Neurological', sleep: '😴 Sleep',
      gi: '🫃 GI / Digestive', immune: '🦠 Immune', mood: '🌊 Mood',
      autonomic: '🫀 Autonomic', hormonal: '🔬 Hormonal', respiratory: '🌬️ Respiratory',
      musculoskeletal: '🦵 Musculoskeletal', flag: '🚩 Flags', trigger: '⚠️ Triggers'
    };
    return fallback[cat] || cat;
  }

  function renderWatchlistGrouped(containerId) {
    var el = document.getElementById(containerId);
    if (!el) return;
    var symptoms = loadWatchlist();
    if (!symptoms.length) {
      el.innerHTML =
        '<div class="pool-empty-state">No symptom pool configured. ' +
        'Go to ⚙️ Health Setup → Symptom Pool Builder to get started.</div>';
      return;
    }

    // Prefer utils groupedWithMeta for richer output
    var utils = window.HQSymptomUtils;
    if (utils && utils.groupedWithMeta) {
      var grouped = utils.groupedWithMeta(symptoms);
      var html = '';
      grouped.forEach(function (g) {
        html += '<div class="pool-group">';
        html += '<div class="pool-group-label">' + g.category.emoji + ' ' + g.category.label + '</div>';
        html += '<div class="pool-group-chips">';
        g.symptoms.forEach(function (s) {
          html += '<span class="symptom-chip">' +
                    '<span class="sc-emoji">' + (s.emoji || '•') + '</span>' +
                    '<span class="sc-label">' + s.label + '</span>' +
                  '</span>';
        });
        html += '</div></div>';
      });
      el.innerHTML = html;
      return;
    }

    // Fallback: simple group by first category
    var groups = {};
    symptoms.forEach(function (s) {
      var cat = (s.categories && s.categories[0]) || 'other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(s);
    });

    var html = '';
    Object.entries(groups).forEach(function (entry) {
      var cat   = entry[0];
      var items = entry[1];
      html += '<div class="pool-group">';
      html += '<div class="pool-group-label">' + getCategoryLabel(cat) + '</div>';
      html += '<div class="pool-group-chips">';
      items.forEach(function (s) {
        html += '<span class="symptom-chip">' +
                  '<span class="sc-emoji">' + (s.emoji || '•') + '</span>' +
                  '<span class="sc-label">' + s.label + '</span>' +
                '</span>';
      });
      html += '</div></div>';
    });
    el.innerHTML = html;
  }

  // ─────────────────────────────────────────────────────────────
  //  CONDITION SEARCH + PICKER (Phase B — enhanced)
  // ─────────────────────────────────────────────────────────────

  /**
   * Render an enhanced condition picker with search.
   * Works as a drop-in upgrade for initPicker grids.
   */
  function initEnhancedPicker(opts) {
    // opts: { gridId, watchlistId, onSave, searchable }
    if (!opts.searchable) {
      initPicker(opts.gridId, opts.watchlistId, opts.onSave);
      return;
    }

    var grid = document.getElementById(opts.gridId);
    if (!grid) return;

    var pools    = window.HQConditionPools || {};
    var selected = loadSelectedConditions();
    var query    = '';

    function renderGrid() {
      grid.innerHTML = '';
      var allPools = Object.values(pools);
      var filtered = query
        ? allPools.filter(function(c) {
            return c.name.toLowerCase().includes(query) ||
                   (c.id || '').toLowerCase().includes(query);
          })
        : allPools;

      if (!filtered.length) {
        grid.innerHTML = '<div style="color:var(--text2,#8a82b0);font-size:12px;padding:8px">No conditions found.</div>';
        return;
      }

      filtered.forEach(function (condition) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'condition-pill' + (selected.includes(condition.id) ? ' active' : '');
        btn.setAttribute('data-cid', condition.id);
        btn.innerHTML =
          '<span class="cp-emoji">' + condition.emoji + '</span>' +
          '<span class="cp-name">'  + condition.name  + '</span>';
        btn.style.setProperty('--pill-accent', condition.color || '#a78bfa');

        btn.onclick = function () {
          var idx = selected.indexOf(condition.id);
          if (idx === -1) { selected.push(condition.id); btn.classList.add('active'); }
          else { selected.splice(idx, 1); btn.classList.remove('active'); }
        };
        grid.appendChild(btn);
      });
    }

    // Insert search input above grid if not already present
    var searchId = opts.gridId + '-search';
    if (!document.getElementById(searchId)) {
      var wrap  = document.createElement('div');
      wrap.style.cssText = 'position:relative;margin-bottom:8px';
      var input = document.createElement('input');
      input.id          = searchId;
      input.type        = 'text';
      input.placeholder = 'Search conditions…';
      input.style.cssText =
        'width:100%;padding:8px 12px;background:var(--card,#1a1630);' +
        'border:1px solid var(--border,#2a2440);border-radius:10px;' +
        'color:var(--text,#e8e0ff);font-size:13px;font-family:inherit;outline:none';
      input.oninput = function() { query = input.value.toLowerCase().trim(); renderGrid(); };
      wrap.appendChild(input);
      grid.parentNode.insertBefore(wrap, grid);
    }

    // Save button
    var saveBtn = document.getElementById(opts.gridId.replace('grid', 'save-btn'));
    if (!saveBtn) {
      var card = grid.closest('.card, .symptom-setup-card');
      saveBtn = card ? card.querySelector('.pool-save-btn') : null;
    }
    if (saveBtn) {
      saveBtn.onclick = function () {
        saveSelectedConditions(selected);
        var watchlist = saveWatchlist(selected);
        toast('✅ Symptom pool saved — ' + watchlist.length + ' symptoms tracked');
        if (opts.watchlistId) renderWatchlistChips(opts.watchlistId, watchlist);
        if (typeof opts.onSave === 'function') opts.onSave(watchlist);
      };
    }

    renderGrid();
  }

  // ─────────────────────────────────────────────────────────────
  //  CSS INJECTION
  // ─────────────────────────────────────────────────────────────
  function injectPillCSS() {
    if (document.getElementById('hq-setup-symptoms-css')) return;
    var style = document.createElement('style');
    style.id = 'hq-setup-symptoms-css';
    style.textContent = [
      '.condition-pill { display:inline-flex; align-items:center; gap:6px;',
        'padding:8px 14px; border-radius:20px; border:2px solid var(--border,#2a2440);',
        'background:var(--card,#1a1630); color:var(--text,#e8e0ff);',
        'font-size:13px; font-weight:700; cursor:pointer; transition:.15s;',
        'margin:3px; }',
      '.condition-pill:hover { border-color:var(--pill-accent,#a78bfa); }',
      '.condition-pill.active { background:var(--pill-accent,#a78bfa);',
        'border-color:var(--pill-accent,#a78bfa); color:#fff; }',
      '.cp-emoji { font-size:16px; }',
      '.symptom-chip { display:inline-flex; align-items:center; gap:5px;',
        'padding:5px 10px; border-radius:16px;',
        'background:var(--card,#1a1630); border:1px solid var(--border,#2a2440);',
        'font-size:12px; font-weight:600; color:var(--text,#e8e0ff); margin:2px; }',
      '.sc-emoji { font-size:13px; }',
      '.pool-group { margin-bottom:14px; }',
      '.pool-group-label { font-size:10px; font-weight:800; letter-spacing:.1em;',
        'text-transform:uppercase; color:var(--text2,#8a82b0); margin-bottom:6px; }',
      '.pool-group-chips { display:flex; flex-wrap:wrap; gap:4px; }',
      '.pool-empty-state { font-size:13px; color:var(--text2,#8a82b0);',
        'padding:12px 0; text-align:center; }',
      '.pool-chips-wrap { display:flex; flex-wrap:wrap; gap:4px; }',
      '.condition-grid { display:flex; flex-wrap:wrap; gap:4px; }'
    ].join('\n');
    document.head.appendChild(style);
  }

  // ─────────────────────────────────────────────────────────────
  //  AUTO-INIT
  // ─────────────────────────────────────────────────────────────

  document.addEventListener('DOMContentLoaded', function () {
    injectPillCSS();

    // Phase B3: run validation on startup (logs to console)
    setTimeout(function () {
      if (window.HQSymptomUtils && typeof window.HQSymptomUtils.validate === 'function') {
        var v = window.HQSymptomUtils.validate();
        if (v.errors && v.errors.length)   console.warn('[HQ Symptom Registry] Errors:', v.errors);
        if (v.warnings && v.warnings.length) console.warn('[HQ Symptom Registry] Warnings:', v.warnings);
        if (!v.errors.length && !v.warnings.length) console.info('[HQ Symptom Registry] ✅ Valid');
      }
    }, 800);

    // Health Tracker — setup tab condition picker
    if (document.getElementById('condition-pool-grid')) {
      initPicker('condition-pool-grid', 'condition-pool-watchlist-chips');
      renderWatchlistChips('condition-pool-watchlist-chips');
    }

    // Health Tracker — symptoms tab watchlist display
    if (document.getElementById('symptom-pool-display')) {
      renderWatchlistGrouped('symptom-pool-display');
    }

    // Setup Wizard — health step
    if (document.getElementById('wiz-condition-pool-grid')) {
      initPicker('wiz-condition-pool-grid', 'wiz-pool-chips');
      renderWatchlistChips('wiz-pool-chips');
    }
  });

  // ── Wizard patch (Phase A compat) ─────────────────────────────
  function patchWizardUpdateUI() {
    if (typeof window.updateUI !== 'function') return;
    var _orig = window.updateUI;
    window.updateUI = function () {
      _orig.apply(this, arguments);
      setTimeout(function () {
        var healthStep = document.getElementById('step-mod-health');
        if (healthStep && healthStep.classList.contains('active')) {
          if (document.getElementById('wiz-condition-pool-grid')) {
            initPicker('wiz-condition-pool-grid', 'wiz-pool-chips');
            renderWatchlistChips('wiz-pool-chips');
          }
        }
      }, 0);
    };
  }

  window.addEventListener('load', patchWizardUpdateUI);

  // ─────────────────────────────────────────────────────────────
  //  PUBLIC API
  // ─────────────────────────────────────────────────────────────

  window.HQSymptomSetup = {
    // Phase A (preserved)
    initPicker:              initPicker,
    renderWatchlistChips:    renderWatchlistChips,
    renderWatchlistGrouped:  renderWatchlistGrouped,
    loadWatchlist:           loadWatchlist,
    loadSelectedConditions:  loadSelectedConditions,
    buildWatchlist:          buildWatchlist,

    // Phase B additions
    v2: {
      initEnhancedPicker: initEnhancedPicker,
      saveWatchlist:      saveWatchlist,
      toast:              toast
    }
  };

}());
