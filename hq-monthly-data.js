/**
 * hq-monthly-data.js — AuDHD HQ Monthly Planner Data Layer
 *
 * Phase C Item 4: Rendering Extraction — Monthly Planner
 *
 * Extracts the pure data operations from monthly-planner.js into a
 * reusable, testable data module. The render functions stay in
 * monthly-planner.js and read through HQMonthlyData instead of
 * accessing DB directly.
 *
 * What moves here:
 *   - DB state + STORE key
 *   - load() / persist() / getMonthData()
 *   - Item CRUD: addItem, updateItem, deleteItem, getItem
 *   - Goal CRUD: addGoal, updateGoal, deleteGoal, getGoal
 *   - Step CRUD: addStep, updateStep, deleteStep, toggleStep
 *   - Notes: getNotes, setNotes
 *   - Defer: deferItem
 *   - Cascade: cascadeItemToWeekly, markCascaded
 *
 * What stays in monthly-planner.js:
 *   - All render* functions
 *   - All open* / close* modal functions
 *   - All UI event handlers
 *   - initMonth(), navigation
 *   - Recurring event management (separate concern)
 *   - Week-sync import (ws* functions)
 *   - Review / metrics rendering
 *
 * Strategy:
 *   HQMonthlyData exposes the DB through its API.
 *   monthly-planner.js continues to work identically during transition —
 *   its local DB and persist() still function as before.
 *   Pages that call HQMonthlyData.getMonthData() get live data.
 *
 * Loading order: hq-store.js → runtime files → hq-monthly-data.js → monthly-planner.js
 */

(function () {
  'use strict';

  const STORE_KEY = HQKeys.MONTHLY;

  // ── Internal DB ──────────────────────────────────────────────────────────
  // Shared reference — monthly-planner.js can sync its own DB here after load
  let _db = {};

  // ── Persistence ───────────────────────────────────────────────────────────

  function load() {
    _db = (window.HQState ? window.HQState.get(STORE_KEY, {}) : {}) || {};
    return _db;
  }

  function persist() {
    if (window.HQState) {
      window.HQState.set(STORE_KEY, _db);
    }
    // Signal cascade
    try {
      if (window.HQBus) {
        window.HQBus.emitCascadeSignal && window.HQBus.emitCascadeSignal('monthly');
        window.HQBus.emit('hq-monthly-updated', { source: 'HQMonthlyData' });
      }
    } catch (_) {}
  }

  function _monthKey(y, m) {
    return `${y}-${String(m + 1).padStart(2, '0')}`;
  }

  function getMonthData(y, m) {
    const k = _monthKey(y, m);
    if (!_db[k]) _db[k] = { items: [], goals: [], notes: '' };
    if (!_db[k].items)  _db[k].items  = [];
    if (!_db[k].goals)  _db[k].goals  = [];
    if (!_db[k].notes)  _db[k].notes  = '';
    return _db[k];
  }

  function getAllMonthKeys() {
    return Object.keys(_db).sort();
  }

  // ── Item CRUD ─────────────────────────────────────────────────────────────

  function getItem(id) {
    for (const mk of Object.keys(_db)) {
      const item = (_db[mk].items || []).find(i => i.id === id);
      if (item) return { item, monthKey: mk };
    }
    return null;
  }

  function addItem(y, m, itemData) {
    const md = getMonthData(y, m);
    const item = Object.assign({
      id         : _uid(),
      type       : 'task',
      status     : 'inbox',
      priority   : 'none',
      deferCount : 0,
      history    : [],
      prepTasks  : [],
      customFlags: [],
      saved      : new Date().toISOString(),
    }, itemData);
    md.items.push(item);
    persist();
    return item;
  }

  function updateItem(id, changes) {
    const found = getItem(id);
    if (!found) return null;
    Object.assign(found.item, changes);
    persist();
    return found.item;
  }

  function deleteItem(id) {
    for (const mk of Object.keys(_db)) {
      const idx = (_db[mk].items || []).findIndex(i => i.id === id);
      if (idx > -1) {
        _db[mk].items.splice(idx, 1);
        persist();
        return true;
      }
    }
    return false;
  }

  // ── Goal CRUD ─────────────────────────────────────────────────────────────

  function getGoal(id) {
    for (const mk of Object.keys(_db)) {
      const goal = (_db[mk].goals || []).find(g => g.id === id);
      if (goal) return { goal, monthKey: mk };
    }
    return null;
  }

  function addGoal(y, m, goalData) {
    const md = getMonthData(y, m);
    const goal = Object.assign({
      id      : _uid(),
      status  : 'active',
      steps   : [],
      history : [],
      saved   : new Date().toISOString(),
    }, goalData);
    md.goals.push(goal);
    persist();
    return goal;
  }

  function updateGoal(id, changes) {
    const found = getGoal(id);
    if (!found) return null;
    Object.assign(found.goal, changes);
    persist();
    return found.goal;
  }

  function deleteGoal(id) {
    for (const mk of Object.keys(_db)) {
      const idx = (_db[mk].goals || []).findIndex(g => g.id === id);
      if (idx > -1) {
        _db[mk].goals.splice(idx, 1);
        persist();
        return true;
      }
    }
    return false;
  }

  // ── Step CRUD ─────────────────────────────────────────────────────────────

  function addStep(goalId, stepData) {
    const found = getGoal(goalId);
    if (!found) return null;
    const step = Object.assign({
      id     : _uid(),
      status : 'inbox',
      saved  : new Date().toISOString(),
    }, stepData);
    if (!found.goal.steps) found.goal.steps = [];
    found.goal.steps.push(step);
    persist();
    return step;
  }

  function updateStep(goalId, stepId, changes) {
    const found = getGoal(goalId);
    if (!found) return null;
    const step = (found.goal.steps || []).find(s => s.id === stepId);
    if (!step) return null;
    Object.assign(step, changes);
    persist();
    return step;
  }

  function deleteStep(goalId, stepId) {
    const found = getGoal(goalId);
    if (!found) return false;
    const idx = (found.goal.steps || []).findIndex(s => s.id === stepId);
    if (idx < 0) return false;
    found.goal.steps.splice(idx, 1);
    persist();
    return true;
  }

  function toggleStep(goalId, stepId) {
    const found = getGoal(goalId);
    if (!found) return;
    const step = (found.goal.steps || []).find(s => s.id === stepId);
    if (!step) return;
    if (window.HQStatus) {
      const to = step.status === 'done' ? 'inbox' : 'done';
      window.HQStatus.transition(step, to, { action: 'step-toggled', source: 'HQMonthlyData' });
    } else {
      step.status = step.status === 'done' ? 'inbox' : 'done';
      if (step.status === 'done') step.doneAt = new Date().toISOString();
    }
    persist();
  }

  // ── Notes ─────────────────────────────────────────────────────────────────

  function getNotes(y, m) {
    return getMonthData(y, m).notes || '';
  }

  function setNotes(y, m, text) {
    getMonthData(y, m).notes = text || '';
    persist();
  }

  // ── Status transitions ────────────────────────────────────────────────────

  function deferItem(id, toStatus, reason, weekTarget) {
    const found = getItem(id);
    if (!found) return null;
    const item = found.item;
    if (window.HQStatus) {
      window.HQStatus.transition(item, toStatus, {
        action     : 'deferred',
        reason,
        weekTarget,
        composite  : weekTarget ? `deferred-from:${weekTarget}` : toStatus,
        source     : 'HQMonthlyData',
      });
    } else {
      item.status     = weekTarget ? `deferred-from:${weekTarget}` : toStatus;
      item.deferCount = (item.deferCount || 0) + 1;
      if (weekTarget) item.weekTarget = weekTarget;
    }
    persist();
    return item;
  }

  function markItemDone(id) {
    const found = getItem(id);
    if (!found) return null;
    const item = found.item;
    if (window.HQStatus) {
      window.HQStatus.transition(item, 'done', { action: 'completed', source: 'HQMonthlyData' });
    } else {
      const prev = item.status;
      item.status = item.status === 'done' ? 'inbox' : 'done';
      if (item.status === 'done') item.doneAt = new Date().toISOString();
    }
    persist();
    return item;
  }

  function markItemCascaded(id, weekKey) {
    const found = getItem(id);
    if (!found) return null;
    const item = found.item;
    if (window.HQStatus) {
      window.HQStatus.transition(item, 'weekly', {
        action    : 'cascaded-to-weekly',
        weekTarget: weekKey,
        source    : 'HQMonthlyData',
      });
    } else {
      item.status     = 'weekly';
      item.weekTarget = weekKey;
    }
    persist();
    return item;
  }

  // ── Carry-forward ─────────────────────────────────────────────────────────

  /**
   * Copy all non-done, non-cancelled items from one month to the next.
   * Returns count of items carried.
   */
  function carryForward(fromY, fromM, toY, toM) {
    const src  = getMonthData(fromY, fromM);
    const dest = getMonthData(toY, toM);
    let count  = 0;

    (src.items || []).forEach(item => {
      const status = (window.HQStatus ? window.HQStatus.normalizeStatus(item.status) : item.status);
      if (['done', 'cancelled'].includes(status)) return;
      const already = (dest.items || []).some(d => d.id === item.id);
      if (!already) {
        const carried = Object.assign({}, item, {
          monthTarget : _monthKey(toY, toM),
          carriedFrom : _monthKey(fromY, fromM),
        });
        if (window.HQStatus) {
          window.HQStatus.addHistory(carried, 'carried-forward',
            item.status, item.status, `from ${_monthKey(fromY, fromM)}`);
        }
        dest.items.push(carried);
        count++;
      }
    });

    if (count > 0) persist();
    return count;
  }

  // ── Sync with page-level DB ───────────────────────────────────────────────
  /**
   * Called by monthly-planner.js after its own load() to sync the shared reference.
   * Allows HQMonthlyData to stay in sync with the page's in-memory DB.
   */
  function syncFromPage(pageDB) {
    _db = pageDB;
  }

  function getDB() { return _db; }

  // ── Utility ───────────────────────────────────────────────────────────────
  function _uid() {
    return window.HQUtils
      ? window.HQUtils.uid()
      : Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  // ── Public API ────────────────────────────────────────────────────────────
  window.HQMonthlyData = {
    STORE_KEY,
    load,
    persist,
    getDB,
    syncFromPage,
    getMonthData,
    getAllMonthKeys,
    getItem,
    addItem,
    updateItem,
    deleteItem,
    getGoal,
    addGoal,
    updateGoal,
    deleteGoal,
    addStep,
    updateStep,
    deleteStep,
    toggleStep,
    getNotes,
    setNotes,
    deferItem,
    markItemDone,
    markItemCascaded,
    carryForward,
  };

  window.dispatchEvent(new CustomEvent('hq-monthly-data-ready'));

})();
