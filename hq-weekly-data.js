/**
 * hq-weekly-data.js — AuDHD HQ Weekly Planner Data Layer
 *
 * Phase C Item 4: Rendering Extraction — Weekly Planner
 *
 * Extracts the pure data operations from weekly-planner.js into a
 * reusable, testable data module.
 *
 * What moves here:
 *   - WDB state + W_STORE key
 *   - loadStore() / saveStore() / ensureWeek() / getWeek()
 *   - Item CRUD: addItem, updateItem, deleteItem, getItem
 *   - Goal CRUD: addGoal, updateGoal, deleteGoal, toggleGoal
 *   - Day assignment: assignItemToDay, moveItemToInbox
 *   - Defer: deferItem
 *   - Review: getReview, saveReview
 *   - Cross-planner: receiveFromMonthly, pushToMonthly
 *
 * What stays in weekly-planner.js:
 *   - All render* functions
 *   - All open* / close* modal functions
 *   - All UI event handlers
 *   - initWeeklyPlanner(), navigation, tab bar
 *   - Select population (populateSelects, populateDaySelect)
 *   - Metrics display
 *
 * Loading order: hq-store.js → runtime files → hq-weekly-data.js → weekly-planner.js
 */

(function () {
  'use strict';

  const STORE_KEY = HQKeys.WEEKLY;

  // ── Internal store ────────────────────────────────────────────────────────
  let _wdb = {};

  // ── Persistence ───────────────────────────────────────────────────────────

  function load() {
    _wdb = (window.HQState ? window.HQState.get(STORE_KEY, {}) : {}) || {};
    return _wdb;
  }

  function save() {
    if (window.HQState) {
      window.HQState.set(STORE_KEY, _wdb);
    }
    try {
      if (window.HQBus) {
        window.HQBus.emitCascadeSignal && window.HQBus.emitCascadeSignal('weekly-planner');
        window.HQBus.emit('hq-weekly-updated', { source: 'HQWeeklyData' });
      }
    } catch (_) {}
  }

  // ── Week structure ────────────────────────────────────────────────────────

  function ensureWeek(wk) {
    if (!_wdb[wk]) _wdb[wk] = {};
    const w = _wdb[wk];
    if (!w.inbox)  w.inbox  = [];
    if (!w.days)   w.days   = {};
    if (!w.goals)  w.goals  = [];
    if (!w.notes)  w.notes  = '';
    if (!w.review) w.review = {};
    return w;
  }

  function getWeek(wk) {
    load();
    return ensureWeek(wk);
  }

  function getAllWeekKeys() {
    return Object.keys(_wdb).sort();
  }

  function getDB() { return _wdb; }

  function syncFromPage(pageWDB) {
    _wdb = pageWDB;
  }

  // ── Item lookup ───────────────────────────────────────────────────────────

  function getItem(id, dayKey) {
    for (const wk of Object.keys(_wdb)) {
      const week = _wdb[wk];
      // Search inbox
      const inboxItem = (week.inbox || []).find(i => i.id === id);
      if (inboxItem) return { item: inboxItem, weekKey: wk, location: 'inbox', dayKey: null };
      // Search days
      if (dayKey) {
        const dayItem = (week.days && week.days[dayKey] || []).find(i => i.id === id);
        if (dayItem) return { item: dayItem, weekKey: wk, location: 'day', dayKey };
      } else {
        for (const dk of Object.keys(week.days || {})) {
          const dayItem = (week.days[dk] || []).find(i => i.id === id);
          if (dayItem) return { item: dayItem, weekKey: wk, location: 'day', dayKey: dk };
        }
      }
    }
    return null;
  }

  // ── Item CRUD ─────────────────────────────────────────────────────────────

  function addToInbox(weekKey, itemData) {
    ensureWeek(weekKey);
    const item = Object.assign({
      id         : _uid(),
      type       : 'task',
      status     : 'inbox',
      priority   : 'none',
      deferCount : 0,
      history    : [],
      customFlags: [],
      saved      : new Date().toISOString(),
    }, itemData);
    _wdb[weekKey].inbox.push(item);
    save();
    return item;
  }

  function addToDay(weekKey, dayKey, itemData) {
    ensureWeek(weekKey);
    if (!_wdb[weekKey].days[dayKey]) _wdb[weekKey].days[dayKey] = [];
    const item = Object.assign({
      id         : _uid(),
      type       : 'task',
      status     : 'scheduled',
      priority   : 'none',
      deferCount : 0,
      history    : [],
      customFlags: [],
      saved      : new Date().toISOString(),
      _dayKey    : dayKey,
    }, itemData);
    _wdb[weekKey].days[dayKey].push(item);
    save();
    return item;
  }

  function updateItem(id, changes, dayKey) {
    const found = getItem(id, dayKey);
    if (!found) return null;
    Object.assign(found.item, changes);
    save();
    return found.item;
  }

  function deleteItem(id, dayKey) {
    // Check inbox
    for (const wk of Object.keys(_wdb)) {
      const inboxIdx = (_wdb[wk].inbox || []).findIndex(i => i.id === id);
      if (inboxIdx > -1) {
        _wdb[wk].inbox.splice(inboxIdx, 1);
        save();
        return true;
      }
      // Check days
      const days = _wdb[wk].days || {};
      const searchDays = dayKey ? [dayKey] : Object.keys(days);
      for (const dk of searchDays) {
        const idx = (days[dk] || []).findIndex(i => i.id === id);
        if (idx > -1) {
          days[dk].splice(idx, 1);
          save();
          return true;
        }
      }
    }
    return false;
  }

  // ── Day assignment ────────────────────────────────────────────────────────

  function assignToDay(id, weekKey, dayKey) {
    const found = getItem(id);
    if (!found) return null;
    const item = Object.assign({}, found.item);

    // Remove from current location
    deleteItem(id);

    // Add to day
    ensureWeek(weekKey);
    if (!_wdb[weekKey].days[dayKey]) _wdb[weekKey].days[dayKey] = [];
    item.status  = 'scheduled';
    item._dayKey = dayKey;
    if (window.HQStatus) {
      window.HQStatus.addHistory(item, 'assigned-to-day', found.item.status, 'scheduled');
    }
    _wdb[weekKey].days[dayKey].push(item);
    save();
    return item;
  }

  function moveToInbox(id, weekKey) {
    const found = getItem(id);
    if (!found) return null;
    const item = Object.assign({}, found.item);
    deleteItem(id);
    ensureWeek(weekKey);
    item.status = 'inbox';
    delete item._dayKey;
    if (window.HQStatus) {
      window.HQStatus.addHistory(item, 'returned-to-inbox', found.item.status, 'inbox');
    }
    _wdb[weekKey].inbox.push(item);
    save();
    return item;
  }

  // ── Toggle done ───────────────────────────────────────────────────────────

  function toggleDone(id, dayKey) {
    const found = getItem(id, dayKey);
    if (!found) return null;
    const item = found.item;
    if (window.HQStatus) {
      const to = window.HQStatus.isDone(item) ? 'inbox' : 'done';
      window.HQStatus.transition(item, to, { action: 'toggled-done', source: 'HQWeeklyData' });
    } else {
      item.status = item.status === 'done' ? 'inbox' : 'done';
      if (item.status === 'done') item.doneAt = new Date().toISOString();
    }
    save();
    return item;
  }

  // ── Defer ─────────────────────────────────────────────────────────────────

  function deferItem(id, dayKey, toWeekKey, reason) {
    const found = getItem(id, dayKey);
    if (!found) return null;
    const item = found.item;
    const fromWeekKey = found.weekKey;

    if (window.HQStatus) {
      window.HQStatus.transition(item, 'deferred', {
        action    : 'deferred',
        reason,
        composite : `deferred-from:${fromWeekKey}`,
        source    : 'HQWeeklyData',
      });
    } else {
      item.status     = `deferred-from:${fromWeekKey}`;
      item.deferCount = (item.deferCount || 0) + 1;
    }

    // Move to target week inbox if specified
    if (toWeekKey && toWeekKey !== fromWeekKey) {
      deleteItem(id, dayKey);
      ensureWeek(toWeekKey);
      _wdb[toWeekKey].inbox.push(item);
    }

    save();
    return item;
  }

  // ── Goals ─────────────────────────────────────────────────────────────────

  function getGoal(id) {
    for (const wk of Object.keys(_wdb)) {
      const goal = (_wdb[wk].goals || []).find(g => g.id === id);
      if (goal) return { goal, weekKey: wk };
    }
    return null;
  }

  function addGoal(weekKey, goalData) {
    ensureWeek(weekKey);
    const goal = Object.assign({
      id     : _uid(),
      status : 'active',
      saved  : new Date().toISOString(),
    }, goalData);
    _wdb[weekKey].goals.push(goal);
    save();
    return goal;
  }

  function updateGoal(id, changes) {
    const found = getGoal(id);
    if (!found) return null;
    Object.assign(found.goal, changes);
    save();
    return found.goal;
  }

  function deleteGoal(id) {
    for (const wk of Object.keys(_wdb)) {
      const idx = (_wdb[wk].goals || []).findIndex(g => g.id === id);
      if (idx > -1) {
        _wdb[wk].goals.splice(idx, 1);
        save();
        return true;
      }
    }
    return false;
  }

  function toggleGoal(id) {
    const found = getGoal(id);
    if (!found) return;
    const goal = found.goal;
    goal.status = goal.status === 'done' ? 'active' : 'done';
    if (goal.status === 'done') goal.doneAt = new Date().toISOString();
    save();
  }

  // ── Review ────────────────────────────────────────────────────────────────

  function getReview(weekKey) {
    return ((_wdb[weekKey] || {}).review) || {};
  }

  function saveReview(weekKey, reviewData) {
    ensureWeek(weekKey);
    _wdb[weekKey].review = Object.assign(_wdb[weekKey].review || {}, reviewData, {
      savedAt: new Date().toISOString(),
    });
    save();
    return _wdb[weekKey].review;
  }

  // ── Notes ─────────────────────────────────────────────────────────────────

  function getNotes(weekKey) {
    return ((_wdb[weekKey] || {}).notes) || '';
  }

  function setNotes(weekKey, text) {
    ensureWeek(weekKey);
    _wdb[weekKey].notes = text || '';
    save();
  }

  // ── Cross-planner ─────────────────────────────────────────────────────────

  /**
   * Receive an item pushed from monthly-planner.
   * Called by _onMonthlyPushToWeekly.
   */
  function receiveFromMonthly(weekKey, item, txId) {
    try {
      ensureWeek(weekKey);
      const already = (_wdb[weekKey].inbox || []).some(i => i.id === item.id);
      if (!already) {
        const received = Object.assign({}, item, { cascadedFrom: item.cascadedFrom || 'monthly' });
        if (window.HQStatus) {
          window.HQStatus.addHistory(received, 'received-from-monthly', item.status, 'weekly');
        }
        _wdb[weekKey].inbox.push(received);
        save();
      }
      if (txId && window.HQCascade) window.HQCascade.confirm(txId, { ok: true });
      return true;
    } catch (e) {
      if (txId && window.HQCascade) window.HQCascade.confirm(txId, { ok: false, error: e.message });
      return false;
    }
  }

  // ── Utility ───────────────────────────────────────────────────────────────

  function _uid() {
    return window.HQUtils
      ? window.HQUtils.uid('wp-')
      : 'wp-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  /**
   * Stats snapshot for a week — used by updateStats() / metrics display.
   */
  function weekStats(weekKey) {
    const week = _wdb[weekKey] || {};
    const allItems = [
      ...(week.inbox || []),
      ...Object.values(week.days || {}).flat(),
    ];
    const norm = s => window.HQStatus ? window.HQStatus.normalizeStatus(s) : s;
    return {
      total    : allItems.length,
      done     : allItems.filter(i => norm(i.status) === 'done').length,
      deferred : allItems.filter(i => norm(i.status) === 'deferred').length,
      inbox    : (week.inbox || []).length,
      scheduled: Object.values(week.days || {}).flat().length,
    };
  }

  // ── Public API ────────────────────────────────────────────────────────────
  window.HQWeeklyData = {
    STORE_KEY,
    load,
    save,
    getDB,
    syncFromPage,
    ensureWeek,
    getWeek,
    getAllWeekKeys,
    getItem,
    addToInbox,
    addToDay,
    updateItem,
    deleteItem,
    assignToDay,
    moveToInbox,
    toggleDone,
    deferItem,
    getGoal,
    addGoal,
    updateGoal,
    deleteGoal,
    toggleGoal,
    getReview,
    saveReview,
    getNotes,
    setNotes,
    receiveFromMonthly,
    weekStats,
  };

  window.dispatchEvent(new CustomEvent('hq-weekly-data-ready'));

})();
