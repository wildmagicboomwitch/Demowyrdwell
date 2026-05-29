"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i.return) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t.return || t.return(); } finally { if (u) throw o; } } }; }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t.return && (u = t.return(), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
// ⚠️  DEAD-01: This is the JSX source for deep-clean.compiled.js.
// This file is NOT loaded by any HTML page — deep-clean.html loads deep-clean.compiled.js.
// Do not reference this file in script tags. Move to a src/ directory outside the web root.
// The SW registration at the bottom of this file is unreachable dead code.
//
var _React = React,
  useState = _React.useState,
  useRef = _React.useRef,
  useEffect = _React.useEffect,
  useCallback = _React.useCallback;
var LS = HQKeys.DEEPCLEAN;
var LS_STATS = HQKeys.DEEPCLEAN_STATS;

// ── Tooltip wrapper ──────────────────────────────────────────────────────────
function Tip(_ref) {
  var label = _ref.label,
    children = _ref.children;
  return /*#__PURE__*/React.createElement("span", {
    className: "tt-wrap"
  }, children, /*#__PURE__*/React.createElement("span", {
    className: "tt"
  }, label));
}
var RT = {
  kitchen: {
    bg: '#EDF7EE',
    ac: '#4A8C58',
    hc: '#1D4100',
    bd: '#B8D8B8',
    name: 'Kitchenette',
    ico: '🍳'
  },
  dining: {
    bg: '#EAF6ED',
    ac: '#3E8060',
    hc: '#1A4A20',
    bd: '#A8D4B8',
    name: 'Dining Nook',
    ico: '🌿'
  },
  living: {
    bg: '#EAF6F4',
    ac: '#3A8878',
    hc: '#164840',
    bd: '#A4D4CC',
    name: 'Living Room',
    ico: '🛋️'
  },
  hallway: {
    bg: '#EBF5EF',
    ac: '#508860',
    hc: '#1A4428',
    bd: '#B0D4BC',
    name: 'Hallway',
    ico: '🚪'
  },
  bedroom: {
    bg: '#F0EBFF',
    ac: '#6A58BC',
    hc: '#302080',
    bd: '#C0B0EC',
    name: 'Bedroom',
    ico: '🛏️'
  },
  bathroom: {
    bg: '#E8EFF9',
    ac: '#4870B4',
    hc: '#163070',
    bd: '#A4BCDC',
    name: 'Bathroom',
    ico: '🚿'
  },
  closets: {
    bg: '#F8EDEA',
    ac: '#9A6050',
    hc: '#602018',
    bd: '#DCC0B8',
    name: 'Closets ×2',
    ico: '👗'
  },
  fridge: {
    bg: '#E8F8F8',
    ac: '#388080',
    hc: '#104848',
    bd: '#A0D0D0',
    name: 'Fridge',
    ico: '🧊'
  },
  final: {
    bg: '#FEFBDE',
    ac: '#9A8000',
    hc: '#604800',
    bd: '#E4D870',
    name: 'Final Tasks',
    ico: '🏆'
  }
};
var PH = {
  gather: {
    l: 'Gather & Remove',
    i: '🗑️',
    c: '#A04040'
  },
  tidy: {
    l: 'Clear & Tidy',
    i: '📦',
    c: '#6050A0'
  },
  surfaces: {
    l: 'Wipe & Scrub Surfaces',
    i: '✨',
    c: '#387858'
  },
  dishes: {
    l: 'Sort & Wash Dishes',
    i: '🍽️',
    c: '#5A7840'
  },
  special: {
    l: 'Special Tasks',
    i: '⭐',
    c: '#C07030'
  },
  floors: {
    l: 'Floors',
    i: '🧹',
    c: '#785030'
  },
  bedroom: {
    l: 'Bedroom',
    i: '🛏️',
    c: '#6A58BC'
  },
  organize: {
    l: 'Organize & Put Away',
    i: '🗂️',
    c: '#585098'
  },
  final: {
    l: 'Final Tasks',
    i: '🏆',
    c: '#907000'
  }
};
var PH_ORDER = ['gather', 'tidy', 'surfaces', 'dishes', 'special', 'floors', 'bedroom', 'organize', 'final'];
var DI = {
  cake: {
    i: '🍰',
    l: 'Easy',
    c: '#387858',
    bg: '#E8F5EE'
  },
  usual: {
    i: '🧹',
    l: 'Usual',
    c: '#5A7840',
    bg: '#EFF5E8'
  },
  rough: {
    i: '🫠',
    l: 'Rough',
    c: '#9A5828',
    bg: '#FFF0E4'
  },
  wall: {
    i: '🧱',
    l: 'Wall of Awful',
    c: '#A83828',
    bg: '#FFE8E8'
  }
};
var PI = [null, {
  l: 'P1',
  c: '#B02828',
  bg: '#FFE8E8'
}, {
  l: 'P2',
  c: '#B05818',
  bg: '#FFF0E0'
}, {
  l: 'P3',
  c: '#787818',
  bg: '#FAFAE8'
}, {
  l: 'P4',
  c: '#387840',
  bg: '#E8F5E8'
}, {
  l: 'P5',
  c: '#808088',
  bg: '#F4F4F8'
}];
var EMOJIS = ['🌟', '💫', '⚠️', '🔥', '❄️', '💜', '🌿', '🍄', '🌸', '✨', '🐱', '🌙', '🦋', '🌺', '🍃', '⭐', '🎯', '💎', '🧹', '🌈', '📌', '💤', '🎵', '🔑', '🏷️'];
var mk = function mk(id, t, ph) {
  var o = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
  return _objectSpread({
    id: id,
    t: t,
    phase: ph,
    done: false,
    priority: 3,
    difficulty: 'usual',
    emojis: [],
    custom: false,
    skipped: false
  }, o);
};
var TIMER_OPTS = [5, 10, 15, 30, 45, 60];
var INIT_TASKS = {
  k1: mk('k1', 'Remove trash & recycling', 'gather', {
    priority: 1,
    difficulty: 'cake'
  }),
  k2: mk('k2', 'Move dishes & cups to sink', 'gather', {
    priority: 1,
    difficulty: 'cake'
  }),
  k3: mk('k3', 'Return items to their rooms', 'gather', {
    priority: 1,
    difficulty: 'cake'
  }),
  k4: mk('k4', 'Clear countertops', 'tidy', {
    priority: 2,
    difficulty: 'usual'
  }),
  k5: mk('k5', 'Clear floor', 'tidy', {
    priority: 2,
    difficulty: 'cake'
  }),
  k6: mk('k6', 'Wipe countertops & backsplash', 'surfaces', {
    priority: 2,
    difficulty: 'usual'
  }),
  k7: mk('k7', 'Wipe cabinet faces & drawer fronts', 'surfaces', {
    priority: 3,
    difficulty: 'usual'
  }),
  k8: mk('k8', 'Wipe appliance outsides', 'surfaces', {
    priority: 3,
    difficulty: 'usual'
  }),
  k9: mk('k9', 'Wipe fridge exterior & top', 'surfaces', {
    priority: 3,
    difficulty: 'cake'
  }),
  k10: mk('k10', 'Sort dishes by size & type', 'dishes', {
    priority: 2,
    difficulty: 'cake'
  }),
  k11: mk('k11', '🍽️ Dish Session 1 — 15 min', 'dishes', {
    priority: 2,
    difficulty: 'usual',
    tmr: true
  }),
  k12: mk('k12', '🍽️ Dish Session 2 — 15 min', 'dishes', {
    priority: 2,
    difficulty: 'usual',
    tmr: true
  }),
  k13: mk('k13', '🍽️ Dish Session 3 — 15 min', 'dishes', {
    priority: 2,
    difficulty: 'usual',
    tmr: true
  }),
  k14: mk('k14', '🍽️ Dish Session 4 — 15 min', 'dishes', {
    priority: 3,
    difficulty: 'usual',
    tmr: true
  }),
  k15: mk('k15', '🍽️ Dish Session 5 — 15 min', 'dishes', {
    priority: 3,
    difficulty: 'usual',
    tmr: true
  }),
  k16: mk('k16', '🍽️ Dish Session 6 — 15 min', 'dishes', {
    priority: 3,
    difficulty: 'usual',
    tmr: true
  }),
  k17: mk('k17', 'Scrub kitchen sink & faucet', 'special', {
    priority: 2,
    difficulty: 'usual'
  }),
  k18: mk('k18', 'Sweep floor', 'floors', {
    priority: 2,
    difficulty: 'cake'
  }),
  k19: mk('k19', 'Mop floor', 'floors', {
    priority: 2,
    difficulty: 'usual'
  }),
  k20: mk('k20', 'Final tidy & organize kitchen', 'organize', {
    priority: 4,
    difficulty: 'usual'
  }),
  d1: mk('d1', 'Remove trash & recycling', 'gather', {
    priority: 1,
    difficulty: 'cake'
  }),
  d2: mk('d2', 'Move dishes to kitchen', 'gather', {
    priority: 1,
    difficulty: 'cake'
  }),
  d3: mk('d3', 'Return items to their rooms', 'gather', {
    priority: 1,
    difficulty: 'cake'
  }),
  d4: mk('d4', 'Clear table & all surfaces', 'tidy', {
    priority: 2,
    difficulty: 'usual'
  }),
  d5: mk('d5', 'Clear floor', 'tidy', {
    priority: 2,
    difficulty: 'cake'
  }),
  d6: mk('d6', 'Wipe table top & edges', 'surfaces', {
    priority: 2,
    difficulty: 'cake'
  }),
  d7: mk('d7', 'Wipe chair backs, legs & undersides', 'surfaces', {
    priority: 3,
    difficulty: 'usual'
  }),
  d8: mk('d8', '🐱 Scoop & refresh cat box', 'special', {
    priority: 1,
    difficulty: 'usual',
    hl: true
  }),
  d9: mk('d9', '🐱 Wipe cat box exterior & area', 'special', {
    priority: 2,
    difficulty: 'cake'
  }),
  d10: mk('d10', 'Sweep', 'floors', {
    priority: 2,
    difficulty: 'cake'
  }),
  d11: mk('d11', 'Vacuum nook area rug', 'floors', {
    priority: 3,
    difficulty: 'cake'
  }),
  d12: mk('d12', 'Mop', 'floors', {
    priority: 2,
    difficulty: 'usual'
  }),
  d13: mk('d13', 'Tidy & organize nook', 'organize', {
    priority: 4,
    difficulty: 'cake'
  }),
  l1: mk('l1', 'Remove trash & recycling', 'gather', {
    priority: 1,
    difficulty: 'cake'
  }),
  l2: mk('l2', 'Return dishes to kitchen', 'gather', {
    priority: 1,
    difficulty: 'cake'
  }),
  l3: mk('l3', 'Return items to their rooms', 'gather', {
    priority: 1,
    difficulty: 'cake'
  }),
  l4: mk('l4', 'Clear all surfaces & tables', 'tidy', {
    priority: 2,
    difficulty: 'usual'
  }),
  l5: mk('l5', 'Clear floor completely', 'tidy', {
    priority: 2,
    difficulty: 'usual'
  }),
  l6: mk('l6', 'Wipe shelves, TV stand & remotes', 'surfaces', {
    priority: 3,
    difficulty: 'cake'
  }),
  l7: mk('l7', 'Wipe windowsills & ledges', 'surfaces', {
    priority: 3,
    difficulty: 'cake'
  }),
  l8: mk('l8', 'Vacuum area rug', 'floors', {
    priority: 2,
    difficulty: 'usual'
  }),
  l9: mk('l9', 'Organize & declutter', 'organize', {
    priority: 2,
    difficulty: 'rough'
  }),
  h1: mk('h1', 'Remove trash & stray items', 'gather', {
    priority: 1,
    difficulty: 'cake'
  }),
  h2: mk('h2', 'Clear floor & put away', 'tidy', {
    priority: 1,
    difficulty: 'usual'
  }),
  h3: mk('h3', 'Wipe light switches & door handles', 'surfaces', {
    priority: 3,
    difficulty: 'cake'
  }),
  h4: mk('h4', 'Wipe walls & scuffs', 'surfaces', {
    priority: 3,
    difficulty: 'usual'
  }),
  h5: mk('h5', 'Wipe baseboards', 'surfaces', {
    priority: 4,
    difficulty: 'rough'
  }),
  h6: mk('h6', 'Sweep', 'floors', {
    priority: 2,
    difficulty: 'cake'
  }),
  h7: mk('h7', 'Mop', 'floors', {
    priority: 2,
    difficulty: 'usual'
  }),
  c1: mk('c1', 'Gather ALL laundry brought here', 'gather', {
    priority: 1,
    difficulty: 'cake'
  }),
  c2: mk('c2', 'Clear & tidy shelves and floor', 'tidy', {
    priority: 2,
    difficulty: 'usual'
  }),
  c3: mk('c3', 'Wipe shelves & surfaces', 'surfaces', {
    priority: 3,
    difficulty: 'cake'
  }),
  c4: mk('c4', 'Bag dirty laundry', 'bedroom', {
    priority: 1,
    difficulty: 'cake'
  }),
  c5: mk('c5', 'Put away clean laundry — Closet 1', 'bedroom', {
    priority: 1,
    difficulty: 'rough',
    hl: true
  }),
  c6: mk('c6', 'Put away clean laundry — Closet 2', 'bedroom', {
    priority: 1,
    difficulty: 'rough'
  }),
  c7: mk('c7', 'Sweep both closet floors', 'floors', {
    priority: 3,
    difficulty: 'cake'
  }),
  c8: mk('c8', 'Mop both closet floors', 'floors', {
    priority: 4,
    difficulty: 'cake'
  }),
  c9: mk('c9', 'Declutter — pull out donate/toss', 'organize', {
    priority: 3,
    difficulty: 'wall'
  }),
  c10: mk('c10', 'Organize shelves, bins & hanging', 'organize', {
    priority: 3,
    difficulty: 'usual'
  }),
  br1: mk('br1', 'Remove trash & recycling', 'gather', {
    priority: 1,
    difficulty: 'cake'
  }),
  br2: mk('br2', 'Return dishes to kitchen', 'gather', {
    priority: 1,
    difficulty: 'cake'
  }),
  br3: mk('br3', 'Return items to their rooms', 'gather', {
    priority: 1,
    difficulty: 'cake'
  }),
  br4: mk('br4', 'Clear floor & put away', 'tidy', {
    priority: 2,
    difficulty: 'usual'
  }),
  br5: mk('br5', 'Clear & tidy nightstand(s)', 'tidy', {
    priority: 3,
    difficulty: 'cake'
  }),
  br6: mk('br6', 'Clear desk surface', 'tidy', {
    priority: 3,
    difficulty: 'usual'
  }),
  br7: mk('br7', 'Wipe dresser top', 'surfaces', {
    priority: 3,
    difficulty: 'cake'
  }),
  br8: mk('br8', 'Wipe nightstand & all surfaces', 'surfaces', {
    priority: 3,
    difficulty: 'cake'
  }),
  br9: mk('br9', 'Wipe walls/baseboards if needed', 'surfaces', {
    priority: 4,
    difficulty: 'rough'
  }),
  br10: mk('br10', 'Change bedding', 'bedroom', {
    priority: 1,
    difficulty: 'usual',
    hl: true
  }),
  br11: mk('br11', 'Bag dirty laundry', 'bedroom', {
    priority: 1,
    difficulty: 'cake'
  }),
  br12: mk('br12', 'Put away clean laundry', 'bedroom', {
    priority: 2,
    difficulty: 'rough'
  }),
  br13: mk('br13', 'Vacuum floor & area rug', 'floors', {
    priority: 2,
    difficulty: 'usual'
  }),
  br14: mk('br14', 'Organize & declutter bedroom', 'organize', {
    priority: 3,
    difficulty: 'rough'
  }),
  ba1: mk('ba1', 'Remove trash & recycling', 'gather', {
    priority: 1,
    difficulty: 'cake'
  }),
  ba2: mk('ba2', 'Gather all laundry', 'gather', {
    priority: 1,
    difficulty: 'cake'
  }),
  ba3: mk('ba3', 'Clear counter & put away', 'tidy', {
    priority: 1,
    difficulty: 'usual'
  }),
  ba4: mk('ba4', 'Clear floor completely', 'tidy', {
    priority: 1,
    difficulty: 'cake'
  }),
  ba5: mk('ba5', 'Wipe walls & tiles above sink/shower', 'surfaces', {
    priority: 3,
    difficulty: 'rough'
  }),
  ba6: mk('ba6', '🪞 Wipe mirror & vanity light', 'surfaces', {
    priority: 2,
    difficulty: 'cake'
  }),
  ba7: mk('ba7', 'Wipe shelves & remaining surfaces', 'surfaces', {
    priority: 3,
    difficulty: 'cake'
  }),
  ba8: mk('ba8', '🚿 Scrub shower / tub', 'special', {
    priority: 2,
    difficulty: 'rough',
    hl: true
  }),
  ba9: mk('ba9', '🚽 Wipe toilet exterior & base', 'special', {
    priority: 1,
    difficulty: 'usual'
  }),
  ba10: mk('ba10', '🚽 Scrub toilet bowl inside', 'special', {
    priority: 1,
    difficulty: 'usual'
  }),
  ba11: mk('ba11', '🪥 Scrub bathroom sink & faucet', 'special', {
    priority: 2,
    difficulty: 'usual'
  }),
  ba12: mk('ba12', 'Sweep', 'floors', {
    priority: 2,
    difficulty: 'cake'
  }),
  ba13: mk('ba13', 'Mop', 'floors', {
    priority: 2,
    difficulty: 'usual'
  }),
  fr1: mk('fr1', 'Clear out old food & nonsense', 'special', {
    priority: 1,
    difficulty: 'usual',
    hl: true
  }),
  fr2: mk('fr2', 'Wipe each shelf', 'special', {
    priority: 2,
    difficulty: 'rough'
  }),
  fr3: mk('fr3', 'Wipe inside walls', 'special', {
    priority: 2,
    difficulty: 'rough'
  }),
  fr4: mk('fr4', 'Reorganize contents', 'special', {
    priority: 3,
    difficulty: 'usual'
  }),
  f1: mk('f1', '🗑️ Take ALL trash bags downstairs', 'final', {
    priority: 1,
    difficulty: 'usual',
    hl: true
  }),
  f2: mk('f2', '♻️ Take recycling downstairs', 'final', {
    priority: 1,
    difficulty: 'cake',
    hl: true
  }),
  f3: mk('f3', 'Final declutter pass — all rooms', 'final', {
    priority: 3,
    difficulty: 'rough'
  }),
  f4: mk('f4', '✨ Victory walkthrough!', 'final', {
    priority: 1,
    difficulty: 'cake',
    hl: true
  })
};
var INIT_ROOMS = {
  kitchen: {
    id: 'kitchen',
    taskIds: ['k1', 'k2', 'k3', 'k4', 'k5', 'k6', 'k7', 'k8', 'k9', 'k10', 'k11', 'k12', 'k13', 'k14', 'k15', 'k16', 'k17', 'k18', 'k19', 'k20']
  },
  dining: {
    id: 'dining',
    taskIds: ['d1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7', 'd8', 'd9', 'd10', 'd11', 'd12', 'd13']
  },
  living: {
    id: 'living',
    taskIds: ['l1', 'l2', 'l3', 'l4', 'l5', 'l6', 'l7', 'l8', 'l9']
  },
  hallway: {
    id: 'hallway',
    taskIds: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'h7']
  },
  closets: {
    id: 'closets',
    taskIds: ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9', 'c10']
  },
  bedroom: {
    id: 'bedroom',
    taskIds: ['br1', 'br2', 'br3', 'br4', 'br5', 'br6', 'br7', 'br8', 'br9', 'br10', 'br11', 'br12', 'br13', 'br14']
  },
  bathroom: {
    id: 'bathroom',
    taskIds: ['ba1', 'ba2', 'ba3', 'ba4', 'ba5', 'ba6', 'ba7', 'ba8', 'ba9', 'ba10', 'ba11', 'ba12', 'ba13']
  },
  fridge: {
    id: 'fridge',
    taskIds: ['fr1', 'fr2', 'fr3', 'fr4']
  },
  final: {
    id: 'final',
    taskIds: ['f1', 'f2', 'f3', 'f4']
  }
};
var INIT_COLS = [['kitchen', 'dining', 'fridge'], ['living', 'hallway', 'closets'], ['bedroom', 'bathroom', 'final']];

/* ── Tier 4: ROOMS_CONFIG bridge + CUSTOM_ROOM_TASKS store ──────
   Reads customize.html's room config (enabled/order) and per-room
   custom task pools, merging them into the INIT state so that
   users' room setup is respected on every new clean session.
──────────────────────────────────────────────────────────────── */
function _loadCustomRoomTasks() {
  try {
    return HQSafe.store.get(HQKeys.CUSTOM_ROOM_TASKS, {}) || {};
  } catch (e) {
    return {};
  }
}

/**
 * Builds an effective rooms map and col layout by merging ROOMS_CONFIG
 * (enabled/disabled, order) from customize.js over INIT_ROOMS defaults.
 * Custom rooms not in INIT_ROOMS get taskIds from CUSTOM_ROOM_TASKS.
 * Returns { rooms, cols }.
 */
function _buildRoomsFromConfig() {
  var cfg;
  try {
    cfg = HQSafe.store.get(HQKeys.ROOMS_CONFIG, null);
  } catch (e) {
    cfg = null;
  }
  if (!cfg || !Array.isArray(cfg.rooms) || !cfg.rooms.length) {
    return {
      rooms: INIT_ROOMS,
      cols: INIT_COLS
    };
  }
  var customTasks = _loadCustomRoomTasks();
  var rooms = {};
  var enabledIds = [];
  cfg.rooms.forEach(function (r) {
    if (!r.enabled) return; // honour disabled toggle from customize
    var rid = r.id;
    if (INIT_ROOMS[rid]) {
      // Built-in room: use its existing taskIds, no overwrite needed
      rooms[rid] = Object.assign({}, INIT_ROOMS[rid]);
    } else {
      // Custom room: pull from CUSTOM_ROOM_TASKS or start empty
      var taskArr = Array.isArray(customTasks[rid]) ? customTasks[rid] : [];
      // Convert task objects to task map entries and register them
      var taskIds = taskArr.map(function (t) {
        return t.id;
      });
      taskArr.forEach(function (t) {/* tasks will be registered below */});
      rooms[rid] = {
        id: rid,
        taskIds: taskIds,
        _custom: true,
        _label: r.name,
        _emoji: r.emoji
      };
    }
    enabledIds.push(rid);
  });

  // Register any custom tasks into a temp extended task map (shallow merge with INIT_TASKS)
  // We return rooms/cols here; tasks are handled in App() via _mergeCustomTasks()
  var CHUNK = 3;
  var cols = [];
  for (var i = 0; i < enabledIds.length; i += CHUNK) {
    cols.push(enabledIds.slice(i, i + CHUNK));
  }
  if (!cols.length) cols = INIT_COLS;
  return {
    rooms: rooms,
    cols: cols
  };
}

/**
 * Builds an extended task map by merging INIT_TASKS with tasks from
 * CUSTOM_ROOM_TASKS. Custom tasks follow the same mk() schema.
 */
function _mergeCustomTasks(baseTaskMap) {
  var customTasks = _loadCustomRoomTasks();
  var merged = Object.assign({}, baseTaskMap);
  Object.values(customTasks).forEach(function (taskArr) {
    if (!Array.isArray(taskArr)) return;
    taskArr.forEach(function (t) {
      if (!t || !t.id) return;
      merged[t.id] = t;
    });
  });
  return merged;
}
var OOO_WAVES = [{
  id: 'w1',
  step: 1,
  icon: '🗑️',
  label: 'Gather & Remove',
  color: '#A04040',
  bg: '#FFF8F6',
  bd: '#F0C8C0',
  desc: 'Every room — trash/recycling out, dishes to kitchen, stray items returned.',
  groups: [{
    rid: 'kitchen',
    tids: ['k1', 'k2', 'k3']
  }, {
    rid: 'dining',
    tids: ['d1', 'd2', 'd3']
  }, {
    rid: 'living',
    tids: ['l1', 'l2', 'l3']
  }, {
    rid: 'hallway',
    tids: ['h1']
  }, {
    rid: 'bedroom',
    tids: ['br1', 'br2', 'br3']
  }, {
    rid: 'bathroom',
    tids: ['ba1', 'ba2']
  }, {
    rid: 'closets',
    tids: ['c1']
  }]
}, {
  id: 'w2',
  step: 2,
  icon: '📦',
  label: 'Clear & Tidy All Surfaces',
  color: '#6050A0',
  bg: '#F8F6FF',
  bd: '#C8C0E8',
  desc: 'Countertops, tables, desks, nightstands, dressers, shelves — clear and put away.',
  groups: [{
    rid: 'kitchen',
    tids: ['k4', 'k5']
  }, {
    rid: 'dining',
    tids: ['d4', 'd5']
  }, {
    rid: 'living',
    tids: ['l4', 'l5']
  }, {
    rid: 'hallway',
    tids: ['h2']
  }, {
    rid: 'bedroom',
    tids: ['br4', 'br5', 'br6']
  }, {
    rid: 'bathroom',
    tids: ['ba3', 'ba4']
  }, {
    rid: 'closets',
    tids: ['c2']
  }]
}, {
  id: 'w3',
  step: 3,
  icon: '✨',
  label: 'Wipe & Scrub All Surfaces',
  color: '#387858',
  bg: '#EEF8F2',
  bd: '#A8D8B8',
  desc: 'All surfaces from step 2 plus cabinets, appliances, fridge exterior.',
  groups: [{
    rid: 'kitchen',
    tids: ['k6', 'k7', 'k8', 'k9']
  }, {
    rid: 'dining',
    tids: ['d6', 'd7']
  }, {
    rid: 'living',
    tids: ['l6', 'l7']
  }, {
    rid: 'hallway',
    tids: ['h3', 'h4', 'h5']
  }, {
    rid: 'bedroom',
    tids: ['br7', 'br8', 'br9']
  }, {
    rid: 'bathroom',
    tids: ['ba5', 'ba6', 'ba7']
  }, {
    rid: 'closets',
    tids: ['c3']
  }]
}, {
  id: 'w4',
  step: 4,
  icon: '🍽️',
  label: 'Sort & Wash Dishes',
  color: '#5A7840',
  bg: '#EFF5E8',
  bd: '#B0D090',
  desc: 'Sort by size & type, then 15-min sessions with real breaks.',
  groups: [{
    rid: 'kitchen',
    tids: ['k10', 'k11', 'k12', 'k13', 'k14', 'k15', 'k16']
  }]
}, {
  id: 'w5',
  step: 5,
  icon: '🐱',
  label: 'Cat Box',
  color: '#387858',
  bg: '#EEF8F2',
  bd: '#A8D8B8',
  desc: 'Scoop & refresh, wipe exterior & area.',
  groups: [{
    rid: 'dining',
    tids: ['d8', 'd9']
  }]
}, {
  id: 'w6',
  step: 6,
  icon: '🚰',
  label: 'Kitchen Sink',
  color: '#4A7840',
  bg: '#EEF5EE',
  bd: '#A8C8A8',
  desc: 'Scrub sink & faucet — after all dishes are done.',
  groups: [{
    rid: 'kitchen',
    tids: ['k17']
  }]
}, {
  id: 'w7',
  step: 7,
  icon: '🧹',
  label: 'Floors — Sweep → Vacuum → Mop',
  color: '#785030',
  bg: '#FAF4EC',
  bd: '#D0B898',
  desc: 'Sweep all → vacuum all rugs → mop all hard floors. In that order.',
  groups: [{
    rid: 'kitchen',
    tids: ['k18', 'k19']
  }, {
    rid: 'dining',
    tids: ['d10', 'd11', 'd12']
  }, {
    rid: 'living',
    tids: ['l8']
  }, {
    rid: 'hallway',
    tids: ['h6', 'h7']
  }, {
    rid: 'bedroom',
    tids: ['br13']
  }, {
    rid: 'bathroom',
    tids: ['ba12', 'ba13']
  }, {
    rid: 'closets',
    tids: ['c7', 'c8']
  }]
}, {
  id: 'w8',
  step: 8,
  icon: '🚿',
  label: 'Bathroom Deep Clean',
  color: '#3060A0',
  bg: '#EEF2FA',
  bd: '#A0B8DC',
  desc: 'Shower/tub → toilet exterior & bowl → sink & faucet.',
  groups: [{
    rid: 'bathroom',
    tids: ['ba8', 'ba9', 'ba10', 'ba11']
  }]
}, {
  id: 'w9',
  step: 9,
  icon: '🛏️',
  label: 'Bedroom',
  color: '#6A58BC',
  bg: '#F2EEFF',
  bd: '#C0B0EC',
  desc: 'Change bedding, bag dirty laundry, put away clean laundry.',
  groups: [{
    rid: 'bedroom',
    tids: ['br10', 'br11', 'br12']
  }, {
    rid: 'closets',
    tids: ['c4', 'c5', 'c6']
  }]
}, {
  id: 'w10',
  step: 10,
  icon: '🧊',
  label: 'Fridge Deep Clean',
  color: '#388080',
  bg: '#E8F8F8',
  bd: '#A0D0D0',
  desc: 'Clear old food → wipe shelves → wipe walls → reorganize.',
  groups: [{
    rid: 'fridge',
    tids: ['fr1', 'fr2', 'fr3', 'fr4']
  }]
}, {
  id: 'w11',
  step: 11,
  icon: '🗂️',
  label: 'Organize, Tidy & Put Away',
  color: '#585098',
  bg: '#F4F2FA',
  bd: '#B8B0E0',
  desc: 'Return misplaced items, fix organization, declutter as you go.',
  groups: [{
    rid: 'kitchen',
    tids: ['k20']
  }, {
    rid: 'living',
    tids: ['l9']
  }, {
    rid: 'dining',
    tids: ['d13']
  }, {
    rid: 'closets',
    tids: ['c9', 'c10']
  }, {
    rid: 'bedroom',
    tids: ['br14']
  }]
}, {
  id: 'w12',
  step: 12,
  icon: '🏆',
  label: 'Final Tasks & Victory Lap',
  color: '#907000',
  bg: '#FEFBE8',
  bd: '#E0D060',
  desc: 'Trash & recycling downstairs, final declutter pass, victory walkthrough.',
  groups: [{
    rid: 'final',
    tids: ['f1', 'f2', 'f3', 'f4']
  }]
}];
var CAT_PHASES = [{
  ph: 'gather',
  label: 'Gather & Remove',
  icon: '🗑️',
  color: '#A04040',
  bg: '#FFF8F6',
  bd: '#F0C8C0',
  desc: 'Trash/recycling out, dishes to kitchen, stray items returned'
}, {
  ph: 'tidy',
  label: 'Clear & Tidy Surfaces',
  icon: '📦',
  color: '#6050A0',
  bg: '#F8F6FF',
  bd: '#C8C0E8',
  desc: 'Clear counters, tables, desks, nightstands, dressers, shelves'
}, {
  ph: 'surfaces',
  label: 'Wipe & Scrub Surfaces',
  icon: '✨',
  color: '#387858',
  bg: '#EEF8F2',
  bd: '#A8D8B8',
  desc: 'Wipe everything + cabinets, appliances, fridge exterior'
}, {
  ph: 'dishes',
  label: 'Sort & Wash Dishes',
  icon: '🍽️',
  color: '#5A7840',
  bg: '#EFF5E8',
  bd: '#B0D090',
  desc: 'Sort by type, then 15-min sessions with real breaks'
}, {
  ph: 'special',
  label: 'Special Tasks',
  icon: '⭐',
  color: '#C07030',
  bg: '#FFF8EE',
  bd: '#E8C898',
  desc: 'Cat box, kitchen sink, bathroom fixtures, fridge interior'
}, {
  ph: 'floors',
  label: 'Floors',
  icon: '🧹',
  color: '#785030',
  bg: '#FAF4EC',
  bd: '#D0B898',
  desc: 'Sweep all → vacuum rugs → mop all hard floors'
}, {
  ph: 'bedroom',
  label: 'Bedroom',
  icon: '🛏️',
  color: '#6A58BC',
  bg: '#F2EEFF',
  bd: '#C0B0EC',
  desc: 'Bedding, laundry bagged, clean laundry put away'
}, {
  ph: 'organize',
  label: 'Organize, Tidy & Put Away',
  icon: '🗂️',
  color: '#585098',
  bg: '#F4F2FA',
  bd: '#B8B0E0',
  desc: 'Return misplaced items, organize all rooms, declutter as you go'
}, {
  ph: 'final',
  label: 'Final Tasks',
  icon: '🏆',
  color: '#907000',
  bg: '#FEFBE8',
  bd: '#E0D060',
  desc: 'Trash out, final pass, victory walkthrough'
}];
var HMSGS = [[0, 0, 'Ready to enchant your space? ✨'], [1, 24, "You've started — the forest spirits approve 🌱"], [25, 49, 'Quarter done! Momentum blooming 🌸'], [50, 50, 'Halfway! You are absolutely radiant 🌟'], [51, 74, 'Over halfway — your cottage is transforming 🦋'], [75, 99, 'Almost there!! Nearly fully enchanted 🌙'], [100, 100, 'YOUR COTTAGE IS SPARKLING! You did it!! ✨🏡']];
function loadSaved() { return HQSafe.store.get(LS, null); }
function loadStats() { return HQSafe.store.get(LS_STATS, []); }
function saveStats(s) {
  try {
    HQSafe.store.set(LS_STATS, s);
  } catch (e) {}
}
function fmtSec(s) {
  var m = Math.floor(s / 60);
  var sc = s % 60;
  return "".concat(String(m).padStart(2, '0'), ":").concat(String(sc).padStart(2, '0'));
}
function fmtHMS(s) {
  var h = Math.floor(s / 3600);
  var m = Math.floor(s % 3600 / 60);
  var sc = s % 60;
  return h > 0 ? "".concat(h, "h ").concat(String(m).padStart(2, '0'), "m") : "".concat(m, "m ").concat(String(sc).padStart(2, '0'), "s");
}

// ── Self-contained TimerPanel (no App re-render on tick) ─────────────────
function TimerPanel(_ref2) {
  var isBreak = _ref2.isBreak,
    onToast = _ref2.onToast;
  var accent = isBreak ? '#9A50B0' : '#C07030';
  var _useState = useState(isBreak ? 300 : 900),
    _useState2 = _slicedToArray(_useState, 2),
    sec = _useState2[0],
    setSec = _useState2[1];
  var _useState3 = useState(false),
    _useState4 = _slicedToArray(_useState3, 2),
    run = _useState4[0],
    setRun = _useState4[1];
  var _useState5 = useState(isBreak ? 5 : 15),
    _useState6 = _slicedToArray(_useState5, 2),
    dur = _useState6[0],
    setDur = _useState6[1];
  var ivRef = useRef(null);
  var circ = 163.4;
  useEffect(function () {
    if (run) {
      ivRef.current = setInterval(function () {
        setSec(function (s) {
          if (s <= 1) {
            clearInterval(ivRef.current);
            setRun(false);
            onToast(isBreak ? '🌈 Break over — back to it!' : '💪 Timer done! Take a break!', isBreak ? '#9A6050' : '#4A8C58');
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else clearInterval(ivRef.current);
    return function () {
      return clearInterval(ivRef.current);
    };
  }, [run]);
  function setTimer(min) {
    setRun(false);
    setSec(min * 60);
    setDur(min);
  }
  var ringPct = 1 - sec / (dur * 60);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: isBreak ? 'rgba(255,248,255,0.97)' : 'rgba(248,255,248,0.97)',
      border: "2px solid ".concat(run ? accent : '#C0D8A8'),
      borderRadius: 15,
      padding: '9px 11px',
      boxShadow: run ? "0 4px 20px ".concat(accent, "55") : '0 3px 12px rgba(45,70,20,0.1)',
      transition: 'border-color 0.3s,box-shadow 0.3s',
      minWidth: 126,
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.55rem',
      fontWeight: 900,
      color: isBreak ? 'transparent' : '#6A7A5A',
      background: isBreak ? 'linear-gradient(90deg,#ff9ec4,#ffcc66,#a8ff88,#66ddff,#cc99ff)' : 'none',
      WebkitBackgroundClip: isBreak ? 'text' : 'unset',
      WebkitTextFillColor: isBreak ? 'transparent' : 'unset',
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      marginBottom: 3,
      backgroundSize: '200%',
      animation: isBreak ? 'sp 3s ease infinite' : 'none'
    }
  }, isBreak ? '🌈 BREAK TIME ✨' : '💪 WORK MODE'), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      width: 54,
      height: 54,
      margin: '0 auto 5px'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 60 60",
    width: "54",
    height: "54",
    style: {
      transform: 'rotate(-90deg)'
    }
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "30",
    cy: "30",
    r: "26",
    fill: "none",
    stroke: isBreak ? '#f8e8ff' : '#EDF7EE',
    strokeWidth: "5"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "30",
    cy: "30",
    r: "26",
    fill: "none",
    stroke: run ? accent : accent + '88',
    strokeWidth: "5",
    strokeLinecap: "round",
    strokeDasharray: circ,
    strokeDashoffset: circ * (1 - ringPct),
    style: {
      transition: 'stroke-dashoffset 0.5s ease,stroke 0.3s'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Playfair Display',serif",
      fontWeight: 700,
      fontSize: sec === 0 ? '0.62rem' : '0.9rem',
      color: sec === 0 ? accent : '#1D4100'
    }
  }, sec === 0 ? 'Done!' : fmtSec(sec))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 2,
      justifyContent: 'center',
      flexWrap: 'wrap',
      marginBottom: 4
    }
  }, TIMER_OPTS.map(function (m) {
    return /*#__PURE__*/React.createElement(Tip, {
      key: m,
      label: "Set ".concat(isBreak ? 'break' : 'work', " timer to ").concat(m, " minutes")
    }, /*#__PURE__*/React.createElement("button", {
      onClick: function onClick() {
        return setTimer(m);
      },
      style: {
        fontSize: '0.52rem',
        fontWeight: 800,
        padding: '1px 5px',
        borderRadius: 8,
        border: "1.5px solid ".concat(accent),
        background: dur === m ? accent : 'transparent',
        color: dur === m ? 'white' : accent,
        transition: 'all 0.1s'
      }
    }, m, "m"));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 3,
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Tip, {
    label: run ? 'Pause timer' : 'Start timer'
  }, /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      return setRun(function (r) {
        return !r;
      });
    },
    style: {
      background: run ? isBreak ? '#9A5890' : '#9A5828' : accent,
      color: 'white',
      border: 'none',
      borderRadius: 7,
      padding: '3px 9px',
      fontWeight: 800,
      fontSize: '0.65rem'
    }
  }, run ? '⏸ Pause' : '▶ Start')), /*#__PURE__*/React.createElement(Tip, {
    label: "Reset to selected duration"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      return setTimer(dur);
    },
    style: {
      background: '#F4EFE0',
      color: '#5A7248',
      border: '1.5px solid #C0D8A8',
      borderRadius: 7,
      padding: '3px 7px',
      fontWeight: 800,
      fontSize: '0.65rem'
    }
  }, "\u21BA"))));
}

// ── Self-contained StopwatchPanel (no App re-render on tick) ─────────────
function StopwatchPanel(_ref3) {
  var dataRef = _ref3.dataRef,
    onToast = _ref3.onToast;
  var _useState7 = useState(0),
    _useState8 = _slicedToArray(_useState7, 2),
    workSec = _useState8[0],
    setWorkSec = _useState8[1];
  var _useState9 = useState(0),
    _useState0 = _slicedToArray(_useState9, 2),
    breakSec = _useState0[0],
    setBreakSec = _useState0[1];
  var _useState1 = useState('stopped'),
    _useState10 = _slicedToArray(_useState1, 2),
    mode = _useState10[0],
    setMode = _useState10[1]; // 'work'|'break'|'stopped'
  var _useState11 = useState([]),
    _useState12 = _slicedToArray(_useState11, 2),
    sessions = _useState12[0],
    setSessions = _useState12[1];
  var ivRef = useRef(null);
  useEffect(function () {
    if (mode === 'stopped') {
      clearInterval(ivRef.current);
      return;
    }
    ivRef.current = setInterval(function () {
      if (mode === 'work') setWorkSec(function (s) {
        var n = s + 1;
        dataRef.current.swWorkSec = n;
        return n;
      });else setBreakSec(function (s) {
        var n = s + 1;
        dataRef.current.swBreakSec = n;
        return n;
      });
    }, 1000);
    return function () {
      return clearInterval(ivRef.current);
    };
  }, [mode]);
  function startWork() {
    if (mode === 'break') {
      var prev = sessions.filter(function (x) {
        return x.type === 'break';
      }).reduce(function (a, s) {
        return a + s.dur;
      }, 0);
      var seg = {
        type: 'break',
        dur: Math.max(0, breakSec - prev)
      };
      var next = [].concat(_toConsumableArray(sessions), [seg]);
      setSessions(next);
      dataRef.current.swSessions = next;
    }
    setMode('work');
  }
  function startBreak() {
    var prev = sessions.filter(function (x) {
      return x.type === 'work';
    }).reduce(function (a, s) {
      return a + s.dur;
    }, 0);
    var seg = {
      type: 'work',
      dur: Math.max(0, workSec - prev)
    };
    var next = [].concat(_toConsumableArray(sessions), [seg]);
    setSessions(next);
    dataRef.current.swSessions = next;
    setMode('break');
  }
  function stop() {
    var prevW = sessions.filter(function (x) {
      return x.type === 'work';
    }).reduce(function (a, s) {
      return a + s.dur;
    }, 0);
    var prevB = sessions.filter(function (x) {
      return x.type === 'break';
    }).reduce(function (a, s) {
      return a + s.dur;
    }, 0);
    var extras = [].concat(_toConsumableArray(mode === 'work' && workSec > prevW ? [{
      type: 'work',
      dur: workSec - prevW
    }] : []), _toConsumableArray(mode === 'break' && breakSec > prevB ? [{
      type: 'break',
      dur: breakSec - prevB
    }] : []));
    var next = [].concat(_toConsumableArray(sessions), _toConsumableArray(extras));
    setSessions(next);
    dataRef.current.swSessions = next;
    setMode('stopped');
  }
  function reset() {
    setMode('stopped');
    setWorkSec(0);
    setBreakSec(0);
    setSessions([]);
    dataRef.current.swWorkSec = 0;
    dataRef.current.swBreakSec = 0;
    dataRef.current.swSessions = [];
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'rgba(248,248,255,0.97)',
      border: "2px solid ".concat(mode !== 'stopped' ? '#8080C8' : '#A0A8D8'),
      borderRadius: 15,
      padding: '9px 11px',
      minWidth: 160,
      textAlign: 'center',
      boxShadow: mode !== 'stopped' ? '0 4px 20px #6060c055' : '0 3px 12px rgba(45,70,20,0.1)',
      transition: 'border-color 0.3s,box-shadow 0.3s'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.55rem',
      fontWeight: 900,
      color: '#5858A0',
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      marginBottom: 3
    }
  }, "\u23F1 STOPWATCH"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      justifyContent: 'center',
      marginBottom: 5
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Playfair Display',serif",
      fontWeight: 700,
      fontSize: '1.05rem',
      color: '#C07030'
    }
  }, fmtHMS(workSec)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.52rem',
      fontWeight: 800,
      color: '#C07030',
      textTransform: 'uppercase'
    }
  }, "Work")), /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#ccc',
      alignSelf: 'center',
      fontSize: '0.8rem'
    }
  }, "|"), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Playfair Display',serif",
      fontWeight: 700,
      fontSize: '1.05rem',
      color: '#9A50B0'
    }
  }, fmtHMS(breakSec)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.52rem',
      fontWeight: 800,
      color: '#9A50B0',
      textTransform: 'uppercase'
    }
  }, "Break"))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.58rem',
      fontWeight: 700,
      color: '#7878A0',
      marginBottom: 5
    }
  }, "Total: ", fmtHMS(workSec + breakSec)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 3,
      justifyContent: 'center',
      flexWrap: 'wrap'
    }
  }, mode !== 'work' && /*#__PURE__*/React.createElement(Tip, {
    label: "Log work time"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: startWork,
    style: {
      background: '#C07030',
      color: 'white',
      border: 'none',
      borderRadius: 7,
      padding: '3px 8px',
      fontWeight: 800,
      fontSize: '0.6rem'
    }
  }, "\u25B6 Work")), mode === 'work' && /*#__PURE__*/React.createElement(Tip, {
    label: "Switch to break time"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: startBreak,
    style: {
      background: '#9A50B0',
      color: 'white',
      border: 'none',
      borderRadius: 7,
      padding: '3px 8px',
      fontWeight: 800,
      fontSize: '0.6rem'
    }
  }, "\u2615 Break")), mode !== 'stopped' && /*#__PURE__*/React.createElement(Tip, {
    label: "Stop stopwatch"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: stop,
    style: {
      background: '#888',
      color: 'white',
      border: 'none',
      borderRadius: 7,
      padding: '3px 8px',
      fontWeight: 800,
      fontSize: '0.6rem'
    }
  }, "\u23F9 Stop")), /*#__PURE__*/React.createElement(Tip, {
    label: "Reset stopwatch"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: reset,
    style: {
      background: '#F4EFE0',
      color: '#5A7248',
      border: '1.5px solid #C0D8A8',
      borderRadius: 7,
      padding: '3px 7px',
      fontWeight: 800,
      fontSize: '0.6rem'
    }
  }, "\u21BA"))), sessions.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6,
      fontSize: '0.58rem',
      color: '#7070A0',
      borderTop: '1px solid #D0D0E8',
      paddingTop: 4,
      textAlign: 'left'
    }
  }, sessions.slice(-4).map(function (s, i) {
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        color: s.type === 'work' ? '#C07030' : '#9A50B0'
      }
    }, s.type === 'work' ? '💪' : '☕', " ", fmtHMS(s.dur));
  })));
}
function App() {
  var saved = loadSaved();
  // Tier 4: build effective rooms/cols/tasks from ROOMS_CONFIG + CUSTOM_ROOM_TASKS
  // only when starting a fresh session (saved session takes precedence)
  var _initRC = !saved ? _buildRoomsFromConfig() : null;
  var _useState13 = useState('landing'),
    _useState14 = _slicedToArray(_useState13, 2),
    screen = _useState14[0],
    setScreen = _useState14[1]; // 'landing' | 'main' | 'stats'
  var _useState15 = useState(function () {
      return (saved === null || saved === void 0 ? void 0 : saved.tasks) || (saved ? INIT_TASKS : _mergeCustomTasks(INIT_TASKS));
    }),
    _useState16 = _slicedToArray(_useState15, 2),
    tasks = _useState16[0],
    setTasks = _useState16[1];
  var _useState17 = useState(function () {
      return (saved === null || saved === void 0 ? void 0 : saved.rooms) || (_initRC ? _initRC.rooms : INIT_ROOMS);
    }),
    _useState18 = _slicedToArray(_useState17, 2),
    rooms = _useState18[0],
    setRooms = _useState18[1];
  var _useState19 = useState(function () {
      return (saved === null || saved === void 0 ? void 0 : saved.cols) || (_initRC ? _initRC.cols : INIT_COLS);
    }),
    _useState20 = _slicedToArray(_useState19, 2),
    cols = _useState20[0],
    setCols = _useState20[1];
  var _useState21 = useState(function () {
      return (saved === null || saved === void 0 ? void 0 : saved.open) || {
        kitchen: true,
        dining: true,
        w1: true
      };
    }),
    _useState22 = _slicedToArray(_useState21, 2),
    open = _useState22[0],
    setOpen = _useState22[1];
  var _useState23 = useState(function () {
      return (saved === null || saved === void 0 ? void 0 : saved.viewMode) || 'room';
    }),
    _useState24 = _slicedToArray(_useState23, 2),
    viewMode = _useState24[0],
    setViewMode = _useState24[1];
  var _useState25 = useState(function () {
      return (saved === null || saved === void 0 ? void 0 : saved.catOpen) || {};
    }),
    _useState26 = _slicedToArray(_useState25, 2),
    catOpen = _useState26[0],
    setCatOpen = _useState26[1];
  var _useState27 = useState(null),
    _useState28 = _slicedToArray(_useState27, 2),
    editId = _useState28[0],
    setEditId = _useState28[1];
  var _useState29 = useState(null),
    _useState30 = _slicedToArray(_useState29, 2),
    addingTo = _useState30[0],
    setAddingTo = _useState30[1];
  var _useState31 = useState({
      t: '',
      priority: 3,
      difficulty: 'usual',
      emojis: []
    }),
    _useState32 = _slicedToArray(_useState31, 2),
    newT = _useState32[0],
    setNewT = _useState32[1];
  var _useState33 = useState(null),
    _useState34 = _slicedToArray(_useState33, 2),
    dragTask = _useState34[0],
    setDragTask = _useState34[1];
  var _useState35 = useState(null),
    _useState36 = _slicedToArray(_useState35, 2),
    dragRoom = _useState36[0],
    setDragRoom = _useState36[1];
  var _useState37 = useState(null),
    _useState38 = _slicedToArray(_useState37, 2),
    overTask = _useState38[0],
    setOverTask = _useState38[1];
  var _useState39 = useState(null),
    _useState40 = _slicedToArray(_useState39, 2),
    overRoom = _useState40[0],
    setOverRoom = _useState40[1];
  var _useState41 = useState([]),
    _useState42 = _slicedToArray(_useState41, 2),
    toasts = _useState42[0],
    setToasts = _useState42[1];
  var toastN = useRef(0);
  var _useState43 = useState(true),
    _useState44 = _slicedToArray(_useState43, 2),
    floatVisible = _useState44[0],
    setFloatVisible = _useState44[1];

  // Refs for reading timer values without causing re-renders
  var timerDataRef = useRef({
    workSec: 0,
    breakSec: 0,
    swWorkSec: 0,
    swBreakSec: 0,
    swSessions: []
  });

  // Stats
  var _useState45 = useState(function () {
      return loadStats();
    }),
    _useState46 = _slicedToArray(_useState45, 2),
    stats = _useState46[0],
    setStats = _useState46[1];
  var _useState47 = useState(''),
    _useState48 = _slicedToArray(_useState47, 2),
    completeNote = _useState48[0],
    setCompleteNote = _useState48[1];
  var _useState49 = useState(false),
    _useState50 = _slicedToArray(_useState49, 2),
    showCompleteModal = _useState50[0],
    setShowCompleteModal = _useState50[1];

  // Persist main state
  useEffect(function () {
    try {
      HQSafe.store.set(LS, {
        tasks: tasks,
        rooms: rooms,
        cols: cols,
        open: open,
        viewMode: viewMode,
        catOpen: catOpen
      });
    } catch (e) {}
  }, [tasks, rooms, cols, open, viewMode, catOpen]);
  var allT = Object.values(tasks);
  var activeT = allT.filter(function (t) {
    return !t.skipped;
  });
  var doneCount = activeT.filter(function (t) {
    return t.done;
  }).length;
  var total = activeT.length;
  var pct = total ? Math.round(doneCount / total * 100) : 0;
  var heroMsg = HMSGS[0][2];
  var _iterator = _createForOfIteratorHelper(HMSGS),
    _step;
  try {
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      var _step$value = _slicedToArray(_step.value, 3),
        lo = _step$value[0],
        hi = _step$value[1],
        m = _step$value[2];
      if (pct >= lo && pct <= hi) {
        heroMsg = m;
        break;
      }
    }
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }
  function addToast(msg) {
    var color = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '#4A8C58';
    var id = ++toastN.current;
    setToasts(function (p) {
      return [].concat(_toConsumableArray(p), [{
        id: id,
        msg: msg,
        color: color
      }]);
    });
    setTimeout(function () {
      return setToasts(function (p) {
        return p.filter(function (t) {
          return t.id !== id;
        });
      });
    }, 4200);
  }
  function toggle(id) {
    var _tasks$id, _tasks$id2;
    if ((_tasks$id = tasks[id]) !== null && _tasks$id !== void 0 && _tasks$id.skipped) return;
    var wasDone = (_tasks$id2 = tasks[id]) === null || _tasks$id2 === void 0 ? void 0 : _tasks$id2.done;
    var newTasks = _objectSpread(_objectSpread({}, tasks), {}, _defineProperty({}, id, _objectSpread(_objectSpread({}, tasks[id]), {}, {
      done: !tasks[id].done
    })));
    setTasks(newTasks);
    if (!wasDone) {
      setTimeout(function () {
        for (var _i = 0, _Object$values = Object.values(rooms); _i < _Object$values.length; _i++) {
          var r = _Object$values[_i];
          if (!r.taskIds.includes(id)) continue;
          var rActive = r.taskIds.filter(function (tid) {
            var _newTasks$tid;
            return !((_newTasks$tid = newTasks[tid]) !== null && _newTasks$tid !== void 0 && _newTasks$tid.skipped);
          });
          if (rActive.length && rActive.every(function (tid) {
            var _newTasks$tid2;
            return tid === id ? true : (_newTasks$tid2 = newTasks[tid]) === null || _newTasks$tid2 === void 0 ? void 0 : _newTasks$tid2.done;
          })) {
            var _RT$r$id, _RT$r$id2, _RT$r$id3;
            addToast("".concat((_RT$r$id = RT[r.id]) === null || _RT$r$id === void 0 ? void 0 : _RT$r$id.ico, " ").concat((_RT$r$id2 = RT[r.id]) === null || _RT$r$id2 === void 0 ? void 0 : _RT$r$id2.name, " \u2014 DONE! \uD83C\uDF89"), (_RT$r$id3 = RT[r.id]) === null || _RT$r$id3 === void 0 ? void 0 : _RT$r$id3.ac);
          }
        }
      }, 80);
    }
  }
  function upT(id, k, v) {
    setTasks(function (p) {
      return _objectSpread(_objectSpread({}, p), {}, _defineProperty({}, id, _objectSpread(_objectSpread({}, p[id]), {}, _defineProperty({}, k, v))));
    });
  }
  function addTask(rid) {
    if (!newT.t.trim() || !rid) return;
    var id = 'ct_' + Date.now();
    setTasks(function (p) {
      return _objectSpread(_objectSpread({}, p), {}, _defineProperty({}, id, _objectSpread(_objectSpread({}, newT), {}, {
        id: id,
        done: false,
        phase: 'tidy',
        custom: true,
        skipped: false
      })));
    });
    setRooms(function (p) {
      return _objectSpread(_objectSpread({}, p), {}, _defineProperty({}, rid, _objectSpread(_objectSpread({}, p[rid]), {}, {
        taskIds: [].concat(_toConsumableArray(p[rid].taskIds), [id])
      })));
    });
    setNewT({
      t: '',
      priority: 3,
      difficulty: 'usual',
      emojis: []
    });
    setAddingTo(null);
  }
  function delTask(id, rid) {
    setTasks(function (p) {
      var n = _objectSpread({}, p);
      delete n[id];
      return n;
    });
    setRooms(function (p) {
      return _objectSpread(_objectSpread({}, p), {}, _defineProperty({}, rid, _objectSpread(_objectSpread({}, p[rid]), {}, {
        taskIds: p[rid].taskIds.filter(function (x) {
          return x !== id;
        })
      })));
    });
    if (editId === id) setEditId(null);
  }
  function tdStart(e, tid, rid) {
    setDragTask({
      id: tid,
      fromRoom: rid
    });
    e.dataTransfer.effectAllowed = 'move';
  }
  function tdOver(e, tid, rid) {
    if (!dragTask || dragTask.fromRoom !== rid) return;
    e.preventDefault();
    setOverTask(tid);
  }
  function tdDrop(e, tid, rid) {
    e.preventDefault();
    e.stopPropagation();
    if (!dragTask || dragTask.fromRoom !== rid || dragTask.id === tid) {
      setDragTask(null);
      setOverTask(null);
      return;
    }
    setRooms(function (p) {
      var ids = _toConsumableArray(p[rid].taskIds);
      var fi = ids.indexOf(dragTask.id),
        ti = ids.indexOf(tid);
      ids.splice(fi, 1);
      ids.splice(ti, 0, dragTask.id);
      return _objectSpread(_objectSpread({}, p), {}, _defineProperty({}, rid, _objectSpread(_objectSpread({}, p[rid]), {}, {
        taskIds: ids
      })));
    });
    setDragTask(null);
    setOverTask(null);
  }
  function rdStart(e, rid, ci) {
    setDragRoom({
      id: rid,
      fromCol: ci
    });
    e.dataTransfer.effectAllowed = 'move';
    e.stopPropagation();
  }
  function rdOver(e, rid) {
    if (!dragRoom) return;
    e.preventDefault();
    setOverRoom(rid);
  }
  function rdDrop(e, toRid, toCi) {
    e.preventDefault();
    if (!dragRoom || dragRoom.id === toRid) {
      setDragRoom(null);
      setOverRoom(null);
      return;
    }
    setCols(function (p) {
      var n = p.map(function (c) {
        return _toConsumableArray(c);
      });
      n[dragRoom.fromCol] = n[dragRoom.fromCol].filter(function (r) {
        return r !== dragRoom.id;
      });
      var ti = n[toCi].indexOf(toRid);
      n[toCi].splice(ti >= 0 ? ti : n[toCi].length, 0, dragRoom.id);
      return n;
    });
    setDragRoom(null);
    setOverRoom(null);
  }
  function doReset() {
    return _doReset.apply(this, arguments);
  }
  function _doReset() {
    _doReset = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2() {
      var _rrc;
      return _regenerator().w(function (_context2) {
        while (1) switch (_context2.n) {
          case 0:
            _context2.n = 1;
            return HQConfirm.ask('Reset all progress? This cannot be undone.', {
              danger: true
            });
          case 1:
            if (_context2.v) {
              _context2.n = 2;
              break;
            }
            return _context2.a(2);
          case 2:
            // Tier 4: re-apply ROOMS_CONFIG on reset so room config persists
            _rrc = _buildRoomsFromConfig();
            setTasks(_mergeCustomTasks(INIT_TASKS));
            setRooms(_rrc.rooms);
            setCols(_rrc.cols);
            setOpen({
              kitchen: true,
              dining: true,
              w1: true
            });
            setCatOpen({});
            setEditId(null);
            setAddingTo(null);
            timerDataRef.current = {
              workSec: 0,
              breakSec: 0,
              swWorkSec: 0,
              swBreakSec: 0,
              swSessions: []
            };
            setScreen('landing');
            try {
              HQSafe.store.remove(LS);
            } catch (e) {}
          case 3:
            return _context2.a(2);
        }
      }, _callee2);
    }));
    return _doReset.apply(this, arguments);
  }
  function doExport() {
    var td = timerDataRef.current;
    var data = JSON.stringify({
      tasks: tasks,
      rooms: rooms,
      cols: cols,
      open: open,
      viewMode: viewMode,
      catOpen: catOpen,
      stats: stats,
      swWorkSec: td.swWorkSec,
      swBreakSec: td.swBreakSec,
      swSessions: td.swSessions
    }, null, 2);
    var a = document.createElement('a');
    a.href = 'data:application/json,' + encodeURIComponent(data);
    a.download = "deep-clean-".concat(new Date().toISOString().slice(0, 10), ".json");
    a.click();
  }
  function doImport() {
    var inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = '.json';
    inp.onchange = function (e) {
      var f = e.target.files[0];
      if (!f) return;
      var r = new FileReader();
      r.onload = function (ev) {
        try {
          var d = JSON.parse(ev.target.result);
          if (d.tasks) setTasks(d.tasks);
          if (d.rooms) setRooms(d.rooms);
          if (d.cols) setCols(d.cols);
          if (d.open) setOpen(d.open);
          if (d.viewMode) setViewMode(d.viewMode);
          if (d.catOpen) setCatOpen(d.catOpen);
          if (d.stats) {
            setStats(d.stats);
            saveStats(d.stats);
          }
          if (d.swWorkSec !== undefined) timerDataRef.current.swWorkSec = d.swWorkSec;
          if (d.swBreakSec !== undefined) timerDataRef.current.swBreakSec = d.swBreakSec;
          if (d.swSessions) timerDataRef.current.swSessions = d.swSessions;
          addToast('✅ Import successful!', '#4A8C58');
          setScreen('main');
        } catch (err) {
          HQToast.error('❌ Invalid file — could not import.');
        }
      };
      r.readAsText(f);
    };
    inp.click();
  }
  function doCompleteClean() {
    var td = timerDataRef.current;
    var entry = {
      date: new Date().toISOString(),
      pct: pct,
      done: doneCount,
      total: total,
      workSec: td.swWorkSec,
      breakSec: td.swBreakSec,
      totalSec: td.swWorkSec + td.swBreakSec,
      sessions: td.swSessions,
      note: completeNote,
      skipped: allT.filter(function (t) {
        return t.skipped;
      }).length
    };
    var newStats = [entry].concat(_toConsumableArray(stats));
    setStats(newStats);
    saveStats(newStats);
    setShowCompleteModal(false);
    setCompleteNote('');
    addToast('🏆 Clean recorded! Amazing work! ✨', '#907000');
  }

  // TarotModal is defined outside App to prevent re-mount on every keystroke
  // TimerPanel is defined outside App to prevent flicker from timer ticks

  // ── Sub-components ────────────────────────────────────────────────────────
  function Chip(_ref4) {
    var onClick = _ref4.onClick,
      active = _ref4.active,
      bg = _ref4.bg,
      activeBg = _ref4.activeBg,
      c = _ref4.c,
      children = _ref4.children,
      tip = _ref4.tip;
    var btn = /*#__PURE__*/React.createElement("button", {
      onClick: onClick,
      style: {
        fontSize: '0.65rem',
        fontWeight: 800,
        padding: '2px 7px',
        borderRadius: 18,
        border: "1.5px solid ".concat(c),
        background: active ? activeBg : bg,
        color: active ? 'white' : c,
        transition: 'all 0.12s'
      }
    }, children);
    return tip ? /*#__PURE__*/React.createElement(Tip, {
      label: tip
    }, btn) : btn;
  }
  function RowLabel(_ref5) {
    var label = _ref5.label,
      children = _ref5.children;
    return /*#__PURE__*/React.createElement("div", {
      style: {
        marginBottom: 4
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: '0.6rem',
        fontWeight: 900,
        color: '#4A6A30',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        marginBottom: 2
      }
    }, label), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 3,
        flexWrap: 'wrap'
      }
    }, children));
  }
  function EditPanel(_ref6) {
    var task = _ref6.task,
      rid = _ref6.rid;
    var th = RT[rid];
    return /*#__PURE__*/React.createElement("div", {
      className: "ep",
      style: {
        background: 'rgba(255,255,255,0.92)',
        border: "1px solid ".concat(th.bd),
        borderRadius: 8,
        padding: 7,
        margin: '2px 0 2px 20px'
      }
    }, /*#__PURE__*/React.createElement(RowLabel, {
      label: "Priority"
    }, [1, 2, 3, 4, 5].map(function (p) {
      return /*#__PURE__*/React.createElement(Chip, {
        key: p,
        onClick: function onClick() {
          return upT(task.id, 'priority', p);
        },
        active: task.priority === p,
        bg: PI[p].bg,
        activeBg: PI[p].c,
        c: PI[p].c,
        tip: "Set priority ".concat(PI[p].l)
      }, PI[p].l);
    })), /*#__PURE__*/React.createElement(RowLabel, {
      label: "Difficulty"
    }, Object.entries(DI).map(function (_ref7) {
      var _ref8 = _slicedToArray(_ref7, 2),
        k = _ref8[0],
        d = _ref8[1];
      return /*#__PURE__*/React.createElement(Chip, {
        key: k,
        onClick: function onClick() {
          return upT(task.id, 'difficulty', k);
        },
        active: task.difficulty === k,
        bg: d.bg,
        activeBg: d.c,
        c: d.c,
        tip: "Mark as ".concat(d.l)
      }, d.i, " ", d.l);
    })), /*#__PURE__*/React.createElement(RowLabel, {
      label: "Flags"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 2,
        flexWrap: 'wrap'
      }
    }, EMOJIS.map(function (em) {
      var sel = (task.emojis || []).includes(em);
      return /*#__PURE__*/React.createElement(Tip, {
        key: em,
        label: "Flag with ".concat(em)
      }, /*#__PURE__*/React.createElement("button", {
        onClick: function onClick() {
          var cur = task.emojis || [];
          upT(task.id, 'emojis', sel ? cur.filter(function (e) {
            return e !== em;
          }) : [].concat(_toConsumableArray(cur), [em]));
        },
        style: {
          fontSize: '0.85rem',
          padding: '1px 2px',
          border: "1.5px solid ".concat(sel ? th.ac : th.bd),
          borderRadius: 5,
          background: sel ? th.ac + '22' : 'white',
          cursor: 'pointer',
          lineHeight: '1.35'
        }
      }, em));
    }))), task.custom && /*#__PURE__*/React.createElement(Tip, {
      label: "Permanently delete this custom task"
    }, /*#__PURE__*/React.createElement("button", {
      onClick: function onClick() {
        return delTask(task.id, rid);
      },
      style: {
        background: '#FFE8E8',
        color: '#A83828',
        border: '1px solid #F0B0B0',
        borderRadius: 6,
        padding: '2px 9px',
        fontSize: '0.65rem',
        fontWeight: 800,
        marginTop: 3
      }
    }, "\uD83D\uDDD1\uFE0F Delete")));
  }
  function AddPanel(_ref9) {
    var rid = _ref9.rid;
    var th = RT[rid];
    if (addingTo !== rid) return /*#__PURE__*/React.createElement(Tip, {
      label: "Add a one-off custom task to this room"
    }, /*#__PURE__*/React.createElement("button", {
      onClick: function onClick(e) {
        e.stopPropagation();
        setAddingTo(rid);
        setEditId(null);
      },
      style: {
        width: '100%',
        background: 'transparent',
        border: "1.5px dashed ".concat(th.bd),
        borderRadius: 8,
        padding: '4px',
        color: th.ac,
        fontWeight: 800,
        fontSize: '0.72rem',
        marginTop: 3,
        transition: 'background 0.15s'
      },
      onMouseOver: function onMouseOver(e) {
        return e.currentTarget.style.background = th.ac + '14';
      },
      onMouseOut: function onMouseOut(e) {
        return e.currentTarget.style.background = 'transparent';
      }
    }, "+ Add Custom Task"));
    return /*#__PURE__*/React.createElement("div", {
      className: "af",
      style: {
        background: 'rgba(255,255,255,0.85)',
        borderRadius: 8,
        padding: 8,
        border: "1.5px solid ".concat(th.bd),
        marginTop: 4
      }
    }, /*#__PURE__*/React.createElement("input", {
      value: newT.t,
      onChange: function onChange(e) {
        return setNewT(function (p) {
          return _objectSpread(_objectSpread({}, p), {}, {
            t: e.target.value
          });
        });
      },
      onKeyDown: function onKeyDown(e) {
        if (e.key === 'Enter') addTask(rid);
        if (e.key === 'Escape') setAddingTo(null);
      },
      placeholder: "Task description\u2026",
      autoFocus: true,
      style: {
        width: '100%',
        border: "1.5px solid ".concat(th.bd),
        borderRadius: 6,
        padding: '4px 7px',
        fontSize: '0.82rem',
        fontWeight: 600,
        background: 'white',
        color: '#2B3A1A',
        marginBottom: 5
      }
    }), /*#__PURE__*/React.createElement(RowLabel, {
      label: "Priority"
    }, [1, 2, 3, 4, 5].map(function (p) {
      return /*#__PURE__*/React.createElement(Chip, {
        key: p,
        onClick: function onClick() {
          return setNewT(function (prev) {
            return _objectSpread(_objectSpread({}, prev), {}, {
              priority: p
            });
          });
        },
        active: newT.priority === p,
        bg: PI[p].bg,
        activeBg: PI[p].c,
        c: PI[p].c
      }, PI[p].l);
    })), /*#__PURE__*/React.createElement(RowLabel, {
      label: "Difficulty"
    }, Object.entries(DI).map(function (_ref0) {
      var _ref1 = _slicedToArray(_ref0, 2),
        k = _ref1[0],
        d = _ref1[1];
      return /*#__PURE__*/React.createElement(Chip, {
        key: k,
        onClick: function onClick() {
          return setNewT(function (prev) {
            return _objectSpread(_objectSpread({}, prev), {}, {
              difficulty: k
            });
          });
        },
        active: newT.difficulty === k,
        bg: d.bg,
        activeBg: d.c,
        c: d.c
      }, d.i, " ", d.l);
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 5,
        marginTop: 5
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: function onClick() {
        return addTask(rid);
      },
      style: {
        flex: 1,
        background: th.ac,
        color: 'white',
        border: 'none',
        borderRadius: 7,
        padding: '5px',
        fontWeight: 800,
        fontSize: '0.75rem'
      }
    }, "+ Add"), /*#__PURE__*/React.createElement("button", {
      onClick: function onClick() {
        return setAddingTo(null);
      },
      style: {
        background: 'white',
        color: th.hc,
        border: "1px solid ".concat(th.bd),
        borderRadius: 7,
        padding: '5px 10px',
        fontWeight: 700,
        fontSize: '0.75rem'
      }
    }, "\u2715")));
  }
  function TaskRow(_ref10) {
    var task = _ref10.task,
      rid = _ref10.rid;
    if (!task) return null;
    var th = RT[rid];
    var isEd = editId === task.id;
    var diff = DI[task.difficulty] || DI.usual;
    var pri = PI[task.priority] || PI[3];
    var isOv = overTask === task.id && (dragTask === null || dragTask === void 0 ? void 0 : dragTask.fromRoom) === rid;
    var isSkipped = !!task.skipped;
    return /*#__PURE__*/React.createElement("div", {
      draggable: !isSkipped,
      onDragStart: function onDragStart(e) {
        return !isSkipped && tdStart(e, task.id, rid);
      },
      onDragOver: function onDragOver(e) {
        return tdOver(e, task.id, rid);
      },
      onDrop: function onDrop(e) {
        return tdDrop(e, task.id, rid);
      },
      onDragLeave: function onDragLeave() {
        return setOverTask(null);
      },
      style: {
        marginBottom: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "trow".concat(isOv ? ' dot' : ''),
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        padding: '3px 5px',
        borderRadius: 7,
        background: isSkipped ? 'rgba(0,0,0,0.03)' : task.hl ? th.ac + '18' : 'transparent',
        border: isSkipped ? '1px solid rgba(0,0,0,0.06)' : task.hl ? "1px solid ".concat(th.ac, "44") : '1px solid transparent',
        opacity: isSkipped ? 0.45 : 1
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: th.ac,
        opacity: 0.3,
        fontSize: '0.65rem',
        flexShrink: 0,
        cursor: isSkipped ? 'default' : 'grab',
        lineHeight: 1
      }
    }, "\u283F"), /*#__PURE__*/React.createElement(Tip, {
      label: isSkipped ? 'Skipped for this clean (click edit to restore)' : task.done ? 'Mark as not done' : 'Mark as done'
    }, /*#__PURE__*/React.createElement("div", {
      className: "cbx".concat(task.done && !isSkipped ? ' pop' : ''),
      onClick: function onClick() {
        return toggle(task.id);
      },
      style: {
        width: 17,
        height: 17,
        borderRadius: 4,
        border: "2px solid ".concat(isSkipped ? '#ccc' : task.done ? th.ac : th.ac + '88'),
        background: isSkipped ? '#eee' : task.done ? th.ac : 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: isSkipped ? '#aaa' : 'white',
        fontSize: '0.6rem',
        fontWeight: 900,
        flexShrink: 0,
        boxShadow: task.done && !isSkipped ? "0 0 6px ".concat(th.ac, "88") : 'none',
        cursor: isSkipped ? 'not-allowed' : 'pointer'
      }
    }, isSkipped ? '—' : task.done ? '✓' : '')), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        fontSize: '0.82rem',
        fontWeight: task.hl && !isSkipped ? 800 : 600,
        lineHeight: 1.25,
        color: isSkipped ? '#999' : task.done ? th.ac + '66' : '#2B3A1A',
        textDecoration: isSkipped || task.done ? 'line-through' : 'none'
      }
    }, (task.emojis || []).length > 0 && /*#__PURE__*/React.createElement("span", {
      style: {
        marginRight: 3
      }
    }, task.emojis.join('')), task.t, isSkipped && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: '0.58rem',
        color: '#aaa',
        marginLeft: 5,
        fontStyle: 'italic'
      }
    }, "skipped")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 2,
        alignItems: 'center',
        flexShrink: 0
      }
    }, !isSkipped && /*#__PURE__*/React.createElement(Tip, {
      label: "Priority: ".concat(pri.l, " \u2014 urgency level")
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: '0.6rem',
        fontWeight: 900,
        padding: '1px 4px',
        borderRadius: 16,
        background: pri.bg,
        color: pri.c,
        border: "1px solid ".concat(pri.c, "44"),
        lineHeight: '1.55'
      }
    }, pri.l)), !isSkipped && /*#__PURE__*/React.createElement(Tip, {
      label: "Difficulty: ".concat(diff.l)
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: '0.8rem'
      }
    }, diff.i)), task.tmr && !task.done && !isSkipped && /*#__PURE__*/React.createElement(Tip, {
      label: "Start 15-min work timer for this dish session"
    }, /*#__PURE__*/React.createElement("button", {
      onClick: function onClick(e) {
        e.stopPropagation();
        setWorkRun(false);
        setWorkSec(900);
        setWorkDur(15);
        setTimeout(function () {
          return setWorkRun(true);
        }, 50);
      },
      style: {
        background: '#C07030',
        color: 'white',
        border: 'none',
        borderRadius: 5,
        padding: '1px 5px',
        fontSize: '0.58rem',
        fontWeight: 800
      }
    }, "\u23F1")), /*#__PURE__*/React.createElement(Tip, {
      label: isEd ? 'Close editor' : 'Edit priority, difficulty & flags'
    }, /*#__PURE__*/React.createElement("button", {
      onClick: function onClick(e) {
        e.stopPropagation();
        setEditId(isEd ? null : task.id);
        setAddingTo(null);
      },
      style: {
        background: 'none',
        border: 'none',
        fontSize: '0.72rem',
        color: th.ac + '80',
        padding: '0 1px',
        lineHeight: 1
      },
      onMouseOver: function onMouseOver(e) {
        return e.currentTarget.style.color = th.ac;
      },
      onMouseOut: function onMouseOut(e) {
        return e.currentTarget.style.color = th.ac + '80';
      }
    }, "\u270F\uFE0F")))), isEd && /*#__PURE__*/React.createElement(EditPanel, {
      task: task,
      rid: rid
    }));
  }
  function RoomCard(_ref11) {
    var rid = _ref11.rid,
      ci = _ref11.ci;
    var room = rooms[rid];
    if (!room) return null;
    var th = RT[rid];
    var rTasks = room.taskIds.map(function (id) {
      return tasks[id];
    }).filter(Boolean);
    var activeTasks = rTasks.filter(function (t) {
      return !t.skipped;
    });
    var rdone = activeTasks.filter(function (t) {
      return t.done;
    }).length;
    var rpct = activeTasks.length ? Math.round(rdone / activeTasks.length * 100) : 0;
    var isOpen = !!open[rid];
    var isComplete = rdone === activeTasks.length && activeTasks.length > 0;
    var isDrg = (dragRoom === null || dragRoom === void 0 ? void 0 : dragRoom.id) === rid;
    var isOvR = overRoom === rid;
    var byPhase = {};
    rTasks.forEach(function (t) {
      if (!byPhase[t.phase]) byPhase[t.phase] = [];
      byPhase[t.phase].push(t);
    });
    return /*#__PURE__*/React.createElement("div", {
      className: "card".concat(isDrg ? ' dragging' : ''),
      style: {
        background: th.bg,
        border: "1.5px solid ".concat(isComplete ? th.ac : isOvR ? th.ac : th.bd),
        borderRadius: 13,
        overflow: 'hidden',
        marginBottom: 11,
        boxShadow: isComplete ? "0 0 0 3px ".concat(th.ac, "40,0 3px 14px rgba(40,60,20,0.09)") : '0 2px 8px rgba(40,60,20,0.06)'
      },
      onDragOver: function onDragOver(e) {
        return rdOver(e, rid);
      },
      onDrop: function onDrop(e) {
        return rdDrop(e, rid, ci);
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        background: isComplete ? th.ac + '28' : th.ac + '18',
        borderBottom: "1px solid ".concat(th.bd),
        padding: '7px 10px',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        cursor: 'pointer',
        userSelect: 'none'
      },
      onClick: function onClick() {
        return setOpen(function (o) {
          return _objectSpread(_objectSpread({}, o), {}, _defineProperty({}, rid, !o[rid]));
        });
      }
    }, /*#__PURE__*/React.createElement(Tip, {
      label: "Drag to reorder rooms between columns"
    }, /*#__PURE__*/React.createElement("span", {
      draggable: true,
      onDragStart: function onDragStart(e) {
        return rdStart(e, rid, ci);
      },
      onClick: function onClick(e) {
        return e.stopPropagation();
      },
      style: {
        cursor: 'grab',
        fontSize: '0.8rem',
        color: th.ac,
        opacity: 0.38,
        flexShrink: 0
      }
    }, "\u283F")), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: '1.05rem'
      }
    }, th.ico), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'Playfair Display',serif",
        fontWeight: 700,
        fontSize: '0.95rem',
        color: th.hc,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }
    }, th.name), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: '0.62rem',
        fontWeight: 700,
        color: th.ac
      }
    }, rdone, "/", activeTasks.length, " \xB7 ", rpct, "%", rTasks.length > activeTasks.length ? " (".concat(rTasks.length - activeTasks.length, " skipped)") : '')), isComplete && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: '0.6rem',
        fontWeight: 900,
        color: th.ac,
        background: th.ac + '22',
        border: "1px solid ".concat(th.ac, "55"),
        borderRadius: 16,
        padding: '2px 6px',
        whiteSpace: 'nowrap'
      }
    }, "\u2713 DONE!"), /*#__PURE__*/React.createElement("span", {
      style: {
        color: th.ac,
        transform: isOpen ? 'rotate(180deg)' : 'none',
        transition: 'transform 0.25s',
        flexShrink: 0,
        fontSize: '0.8rem'
      }
    }, "\u25BE")), /*#__PURE__*/React.createElement("div", {
      style: {
        height: 4,
        background: 'rgba(255,255,255,0.5)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "sparkle-bar",
      style: {
        height: '100%',
        width: rpct + '%',
        transition: 'width 0.5s ease'
      }
    })), isOpen && /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '7px 8px 5px'
      }
    }, PH_ORDER.filter(function (ph) {
      return byPhase[ph];
    }).map(function (ph) {
      var p = PH[ph];
      return /*#__PURE__*/React.createElement("div", {
        key: ph,
        style: {
          marginBottom: 5
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 3,
          padding: '1px 0 2px',
          borderBottom: "1px solid ".concat(th.bd, "77"),
          marginBottom: 2
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: '0.72rem'
        }
      }, p.i), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: '0.62rem',
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
          color: p.c
        }
      }, p.l)), byPhase[ph].map(function (t) {
        return /*#__PURE__*/React.createElement(TaskRow, {
          key: t.id,
          task: t,
          rid: rid
        });
      }));
    }), /*#__PURE__*/React.createElement(AddPanel, {
      rid: rid
    })));
  }
  function CategoryView() {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '12px 13px'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: 11
      }
    }, CAT_PHASES.map(function (cp) {
      var allPh = Object.values(tasks).filter(function (t) {
        return t.phase === cp.ph && !t.skipped;
      });
      var donePh = allPh.filter(function (t) {
        return t.done;
      }).length;
      var phPct = allPh.length ? Math.round(donePh / allPh.length * 100) : 0;
      var isOpen = !!catOpen[cp.ph];
      var isComplete = donePh === allPh.length && allPh.length > 0;
      var byRoom = {};
      Object.values(tasks).filter(function (t) {
        return t.phase === cp.ph;
      }).forEach(function (t) {
        var rid = Object.keys(rooms).find(function (r) {
          return rooms[r].taskIds.includes(t.id);
        });
        if (rid) {
          if (!byRoom[rid]) byRoom[rid] = [];
          byRoom[rid].push(t);
        }
      });
      return /*#__PURE__*/React.createElement("div", {
        key: cp.ph,
        className: "card",
        style: {
          background: cp.bg,
          border: "1.5px solid ".concat(isComplete ? cp.color : cp.bd),
          borderRadius: 13,
          overflow: 'hidden',
          boxShadow: isComplete ? "0 0 0 3px ".concat(cp.color, "33,0 3px 14px rgba(40,60,20,0.09)") : '0 2px 8px rgba(40,60,20,0.06)'
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          background: isComplete ? cp.color + '28' : cp.color + '14',
          borderBottom: "1px solid ".concat(cp.bd),
          padding: '7px 10px',
          cursor: 'pointer',
          userSelect: 'none'
        },
        onClick: function onClick() {
          return setCatOpen(function (o) {
            return _objectSpread(_objectSpread({}, o), {}, _defineProperty({}, cp.ph, !o[cp.ph]));
          });
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          marginBottom: 4
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: '1rem'
        }
      }, cp.icon), /*#__PURE__*/React.createElement("div", {
        style: {
          flex: 1
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontFamily: "'Playfair Display',serif",
          fontWeight: 700,
          fontSize: '0.95rem',
          color: cp.color,
          lineHeight: 1.15
        }
      }, cp.label)), /*#__PURE__*/React.createElement("span", {
        style: {
          fontFamily: "'Playfair Display',serif",
          fontWeight: 700,
          fontSize: '1rem',
          color: isComplete ? cp.color : '#2B3A1A',
          whiteSpace: 'nowrap'
        }
      }, donePh, "/", allPh.length), /*#__PURE__*/React.createElement("span", {
        style: {
          color: cp.color,
          transform: isOpen ? 'rotate(180deg)' : 'none',
          transition: 'transform 0.25s',
          fontSize: '0.8rem'
        }
      }, "\u25BE")), /*#__PURE__*/React.createElement("div", {
        style: {
          height: 4,
          background: 'rgba(255,255,255,0.6)',
          borderRadius: 10,
          overflow: 'hidden',
          border: "1px solid ".concat(cp.bd)
        }
      }, /*#__PURE__*/React.createElement("div", {
        className: "sparkle-bar",
        style: {
          height: '100%',
          width: phPct + '%',
          borderRadius: 10,
          transition: 'width 0.5s ease'
        }
      })), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: '0.65rem',
          color: cp.color,
          marginTop: 3,
          fontStyle: 'italic'
        }
      }, cp.desc)), isOpen && /*#__PURE__*/React.createElement("div", {
        style: {
          padding: '7px 8px 5px'
        }
      }, Object.entries(byRoom).map(function (_ref12) {
        var _ref13 = _slicedToArray(_ref12, 2),
          rid = _ref13[0],
          rTasks = _ref13[1];
        var th = RT[rid];
        if (!th) return null;
        return /*#__PURE__*/React.createElement("div", {
          key: rid,
          style: {
            marginBottom: 5
          }
        }, /*#__PURE__*/React.createElement("div", {
          style: {
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            marginBottom: 2,
            padding: '1px 5px',
            borderRadius: 5,
            background: th.ac + '14'
          }
        }, /*#__PURE__*/React.createElement("span", {
          style: {
            fontSize: '0.78rem'
          }
        }, th.ico), /*#__PURE__*/React.createElement("span", {
          style: {
            fontSize: '0.65rem',
            fontWeight: 800,
            color: th.hc
          }
        }, th.name), /*#__PURE__*/React.createElement("span", {
          style: {
            fontSize: '0.6rem',
            color: th.ac,
            marginLeft: 'auto'
          }
        }, rTasks.filter(function (t) {
          return t.done && !t.skipped;
        }).length, "/", rTasks.filter(function (t) {
          return !t.skipped;
        }).length)), rTasks.map(function (t) {
          return /*#__PURE__*/React.createElement(TaskRow, {
            key: t.id,
            task: t,
            rid: rid
          });
        }));
      })));
    })));
  }
  function OOOView() {
    var firstIncomplete = OOO_WAVES.findIndex(function (w) {
      return w.groups.flatMap(function (g) {
        return g.tids;
      }).some(function (tid) {
        return tasks[tid] && !tasks[tid].done && !tasks[tid].skipped;
      });
    });
    var col1 = OOO_WAVES.filter(function (_, i) {
      return i % 3 === 0;
    });
    var col2 = OOO_WAVES.filter(function (_, i) {
      return i % 3 === 1;
    });
    var col3 = OOO_WAVES.filter(function (_, i) {
      return i % 3 === 2;
    });
    return /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '12px 13px',
        maxWidth: 1400,
        margin: '0 auto'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        marginBottom: 10,
        background: 'rgba(255,255,255,0.6)',
        borderRadius: 10,
        padding: '7px 12px',
        border: '1px solid #C8DDB8'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: '0.72rem',
        fontWeight: 800,
        color: '#4A6A30',
        fontStyle: 'italic'
      }
    }, "\uD83D\uDD2E Complete each step across every room before moving to the next")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: 11,
        alignItems: 'start'
      }
    }, [col1, col2, col3].map(function (waveCol, hi) {
      return /*#__PURE__*/React.createElement("div", {
        key: hi
      }, waveCol.map(function (wave, wi) {
        var displayStep = wi * 3 + hi + 1;
        var gIdx = OOO_WAVES.indexOf(wave);
        var wTids = wave.groups.flatMap(function (g) {
          return g.tids;
        });
        var wTasks = wTids.map(function (id) {
          return tasks[id];
        }).filter(function (t) {
          return t && !t.skipped;
        });
        var wDone = wTasks.filter(function (t) {
          return t.done;
        }).length;
        var wTotal = wTasks.length;
        var wPct = wTotal ? Math.round(wDone / wTotal * 100) : 0;
        var isComplete = wDone === wTotal && wTotal > 0;
        var isActive = !isComplete && gIdx === firstIncomplete;
        var isExpanded = !!open[wave.id];
        return /*#__PURE__*/React.createElement("div", {
          key: wave.id,
          className: "card ooo-step".concat(isActive ? ' active-wave' : ''),
          style: {
            background: wave.bg,
            border: "1.5px solid ".concat(isComplete ? wave.color : isActive ? wave.color : wave.bd),
            borderRadius: 13,
            overflow: 'hidden',
            marginBottom: 10,
            boxShadow: isComplete ? "0 0 0 3px ".concat(wave.color, "33,0 3px 12px rgba(40,60,20,0.09)") : isActive ? "0 0 0 2px ".concat(wave.color, ",0 4px 16px ").concat(wave.color, "22") : '0 2px 7px rgba(40,60,20,0.06)'
          }
        }, /*#__PURE__*/React.createElement("div", {
          style: {
            background: isComplete ? wave.color + '2A' : isActive ? wave.color + '1C' : wave.color + '0F',
            borderBottom: "1px solid ".concat(wave.bd),
            padding: '7px 10px',
            cursor: 'pointer',
            userSelect: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 7
          },
          onClick: function onClick() {
            return setOpen(function (o) {
              return _objectSpread(_objectSpread({}, o), {}, _defineProperty({}, wave.id, !o[wave.id]));
            });
          }
        }, /*#__PURE__*/React.createElement(Tip, {
          label: isComplete ? 'Step complete!' : isActive ? 'This is your next step' : 'Step not yet reached'
        }, /*#__PURE__*/React.createElement("div", {
          style: {
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: isComplete ? wave.color : wave.color + '22',
            border: "2px solid ".concat(wave.color),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            fontSize: '0.65rem',
            fontWeight: 900,
            color: isComplete ? 'white' : wave.color
          }
        }, isComplete ? '✓' : displayStep)), /*#__PURE__*/React.createElement("span", {
          style: {
            fontSize: '1rem',
            flexShrink: 0
          }
        }, wave.icon), /*#__PURE__*/React.createElement("div", {
          style: {
            flex: 1,
            minWidth: 0
          }
        }, /*#__PURE__*/React.createElement("div", {
          style: {
            fontFamily: "'Playfair Display',serif",
            fontWeight: 700,
            fontSize: '0.88rem',
            color: wave.color,
            lineHeight: 1.15
          }
        }, wave.label), /*#__PURE__*/React.createElement("div", {
          style: {
            fontSize: '0.62rem',
            fontWeight: 700,
            color: wave.color + '99'
          }
        }, wDone, "/", wTotal, " tasks ", isActive && !isComplete ? '← next!' : '')), isActive && !isComplete && /*#__PURE__*/React.createElement("span", {
          style: {
            fontSize: '0.62rem',
            fontWeight: 900,
            background: wave.color,
            color: 'white',
            borderRadius: 8,
            padding: '2px 6px',
            whiteSpace: 'nowrap',
            flexShrink: 0
          }
        }, "\u25B6 NOW"), isComplete && /*#__PURE__*/React.createElement("span", {
          style: {
            fontSize: '0.62rem',
            fontWeight: 900,
            color: wave.color,
            background: wave.color + '22',
            border: "1px solid ".concat(wave.color, "55"),
            borderRadius: 8,
            padding: '2px 6px',
            whiteSpace: 'nowrap',
            flexShrink: 0
          }
        }, "\u2713 DONE"), /*#__PURE__*/React.createElement("span", {
          style: {
            color: wave.color,
            transform: isExpanded ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.25s',
            fontSize: '0.78rem',
            flexShrink: 0
          }
        }, "\u25BE")), /*#__PURE__*/React.createElement("div", {
          style: {
            height: 4,
            background: 'rgba(255,255,255,0.55)'
          }
        }, /*#__PURE__*/React.createElement("div", {
          className: "sparkle-bar",
          style: {
            height: '100%',
            width: wPct + '%',
            transition: 'width 0.5s ease'
          }
        })), /*#__PURE__*/React.createElement("div", {
          style: {
            padding: '4px 10px',
            fontSize: '0.65rem',
            fontWeight: 600,
            color: wave.color + 'BB',
            borderBottom: "1px solid ".concat(wave.bd, "55"),
            fontStyle: 'italic',
            lineHeight: 1.35
          }
        }, wave.desc), isExpanded && /*#__PURE__*/React.createElement("div", {
          className: "wave-in",
          style: {
            padding: '7px 8px 5px'
          }
        }, wave.groups.map(function (grp) {
          var th = RT[grp.rid];
          if (!th) return null;
          var grpTasks = grp.tids.map(function (id) {
            return tasks[id];
          }).filter(Boolean);
          if (!grpTasks.length) return null;
          return /*#__PURE__*/React.createElement("div", {
            key: grp.rid,
            style: {
              marginBottom: 5
            }
          }, /*#__PURE__*/React.createElement("div", {
            style: {
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              marginBottom: 2,
              padding: '1px 5px',
              borderRadius: 5,
              background: th.ac + '16',
              border: "1px solid ".concat(th.ac, "33")
            }
          }, /*#__PURE__*/React.createElement("span", {
            style: {
              fontSize: '0.78rem'
            }
          }, th.ico), /*#__PURE__*/React.createElement("span", {
            style: {
              fontSize: '0.65rem',
              fontWeight: 800,
              color: th.hc
            }
          }, th.name), /*#__PURE__*/React.createElement("span", {
            style: {
              fontSize: '0.6rem',
              color: th.ac,
              marginLeft: 'auto'
            }
          }, grpTasks.filter(function (t) {
            return t.done && !t.skipped;
          }).length, "/", grpTasks.filter(function (t) {
            return !t.skipped;
          }).length)), grpTasks.map(function (t) {
            return /*#__PURE__*/React.createElement(TaskRow, {
              key: t.id,
              task: t,
              rid: grp.rid
            });
          }));
        })));
      }));
    })));
  }

  // ── LANDING PAGE ──────────────────────────────────────────────────────────
  function LandingPage() {
    var _useState51 = useState(null),
      _useState52 = _slicedToArray(_useState51, 2),
      landAddingTo = _useState52[0],
      setLandAddingTo = _useState52[1];
    var _useState53 = useState({
        t: '',
        priority: 3,
        difficulty: 'usual',
        rid: 'kitchen'
      }),
      _useState54 = _slicedToArray(_useState53, 2),
      landNewT = _useState54[0],
      setLandNewT = _useState54[1];
    var _useState55 = useState(null),
      _useState56 = _slicedToArray(_useState55, 2),
      expandedRoom = _useState56[0],
      setExpandedRoom = _useState56[1];
    function landAddTask() {
      if (!landNewT.t.trim()) return;
      var rid = landNewT.rid;
      var id = 'ct_' + Date.now();
      setTasks(function (p) {
        return _objectSpread(_objectSpread({}, p), {}, _defineProperty({}, id, _objectSpread(_objectSpread({}, mk(id, landNewT.t, 'tidy', {
          priority: landNewT.priority,
          difficulty: landNewT.difficulty
        })), {}, {
          custom: true,
          skipped: false
        })));
      });
      setRooms(function (p) {
        return _objectSpread(_objectSpread({}, p), {}, _defineProperty({}, rid, _objectSpread(_objectSpread({}, p[rid]), {}, {
          taskIds: [].concat(_toConsumableArray(p[rid].taskIds), [id])
        })));
      });
      setLandNewT({
        t: '',
        priority: 3,
        difficulty: 'usual',
        rid: rid
      });
      setLandAddingTo(null);
    }
    function toggleSkip(id) {
      setTasks(function (p) {
        return _objectSpread(_objectSpread({}, p), {}, _defineProperty({}, id, _objectSpread(_objectSpread({}, p[id]), {}, {
          skipped: !p[id].skipped,
          done: false
        })));
      });
    }
    var roomOrder = ['kitchen', 'dining', 'living', 'hallway', 'closets', 'bedroom', 'bathroom', 'fridge', 'final'];
    var skippedCount = Object.values(tasks).filter(function (t) {
      return t.skipped;
    }).length;
    var customCount = Object.values(tasks).filter(function (t) {
      return t.custom && !t.skipped;
    }).length;
    return /*#__PURE__*/React.createElement("div", {
      style: {
        background: '#F4EFE0',
        minHeight: '100vh',
        fontFamily: "'Nunito',sans-serif"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        background: 'linear-gradient(120deg,#EDF7EE,#EEF0FF,#FFF8E8)',
        borderBottom: '2px solid #C0D8A8',
        padding: '20px 20px 16px',
        textAlign: 'center',
        boxShadow: '0 2px 10px rgba(45,70,20,0.08)'
      }
    }, /*#__PURE__*/React.createElement("h1", {
      style: {
        fontFamily: "'Playfair Display',serif",
        fontSize: '2rem',
        background: 'linear-gradient(120deg,#1D4100,#6A58BC,#9A6050)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        marginBottom: 4
      }
    }, "\u2728 Weekend Deep Clean"), /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: '0.85rem',
        color: '#6A7A5A',
        fontStyle: 'italic',
        marginBottom: 12
      }
    }, "Review your task list before you begin. Skip tasks that don't apply today, or add custom ones."), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 10,
        justifyContent: 'center',
        flexWrap: 'wrap'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        background: 'rgba(255,255,255,0.8)',
        borderRadius: 10,
        padding: '6px 14px',
        border: '1px solid #C0D8A8'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: '0.75rem',
        fontWeight: 800,
        color: '#4A8C58'
      }
    }, Object.values(tasks).filter(function (t) {
      return !t.skipped;
    }).length, " tasks active")), skippedCount > 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        background: 'rgba(255,255,255,0.8)',
        borderRadius: 10,
        padding: '6px 14px',
        border: '1px solid #D0C0A8'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: '0.75rem',
        fontWeight: 800,
        color: '#9A6050'
      }
    }, skippedCount, " skipped")), customCount > 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        background: 'rgba(255,255,255,0.8)',
        borderRadius: 10,
        padding: '6px 14px',
        border: '1px solid #B0C0D8'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: '0.75rem',
        fontWeight: 800,
        color: '#506090'
      }
    }, customCount, " custom added")), /*#__PURE__*/React.createElement("a", {
      href: "customize.html#dc-setup",
      style: {
        background: 'rgba(255,255,255,0.8)',
        borderRadius: 10,
        padding: '6px 14px',
        border: '1px solid #C8C0D8',
        textDecoration: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: '0.75rem',
        fontWeight: 800,
        color: '#6A58BC'
      }
    }, "\u2699\uFE0F Setup rooms & tasks")))), /*#__PURE__*/React.createElement("div", {
      style: {
        maxWidth: 900,
        margin: '0 auto',
        padding: '16px 14px 100px'
      }
    }, roomOrder.map(function (rid) {
      var _rooms$rid;
      var th = RT[rid];
      if (!th) return null;
      var rTasks = ((_rooms$rid = rooms[rid]) === null || _rooms$rid === void 0 ? void 0 : _rooms$rid.taskIds.map(function (id) {
        return tasks[id];
      }).filter(Boolean)) || [];
      var isExp = expandedRoom === rid;
      var skipped = rTasks.filter(function (t) {
        return t.skipped;
      }).length;
      return /*#__PURE__*/React.createElement("div", {
        key: rid,
        className: "card",
        style: {
          background: th.bg,
          border: "1.5px solid ".concat(th.bd),
          borderRadius: 13,
          marginBottom: 10,
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(40,60,20,0.06)'
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          background: th.ac + '18',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          cursor: 'pointer',
          userSelect: 'none',
          borderBottom: "1px solid ".concat(th.bd)
        },
        onClick: function onClick() {
          return setExpandedRoom(isExp ? null : rid);
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: '1.1rem'
        }
      }, th.ico), /*#__PURE__*/React.createElement("div", {
        style: {
          flex: 1
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          fontFamily: "'Playfair Display',serif",
          fontWeight: 700,
          fontSize: '1rem',
          color: th.hc
        }
      }, th.name), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: '0.65rem',
          color: th.ac,
          marginLeft: 8,
          fontWeight: 700
        }
      }, rTasks.length, " tasks", skipped > 0 ? ", ".concat(skipped, " skipped") : '')), /*#__PURE__*/React.createElement("span", {
        style: {
          color: th.ac,
          transform: isExp ? 'rotate(180deg)' : 'none',
          transition: 'transform 0.25s',
          fontSize: '0.85rem'
        }
      }, "\u25BE")), isExp && /*#__PURE__*/React.createElement("div", {
        style: {
          padding: '8px 10px 10px'
        }
      }, rTasks.map(function (task) {
        return /*#__PURE__*/React.createElement("div", {
          key: task.id,
          style: {
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '5px 6px',
            borderRadius: 8,
            marginBottom: 2,
            background: task.skipped ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.5)',
            border: "1px solid ".concat(task.skipped ? 'rgba(0,0,0,0.08)' : th.bd + '80'),
            opacity: task.skipped ? 0.5 : 1
          }
        }, /*#__PURE__*/React.createElement("span", {
          style: {
            fontSize: '0.82rem',
            flex: 1,
            color: task.skipped ? '#999' : '#2B3A1A',
            textDecoration: task.skipped ? 'line-through' : 'none',
            fontWeight: task.hl ? 700 : 500
          }
        }, task.t), /*#__PURE__*/React.createElement("span", {
          style: {
            fontSize: '0.6rem',
            fontWeight: 800,
            padding: '1px 5px',
            borderRadius: 14,
            background: (PI[task.priority] || PI[3]).bg,
            color: (PI[task.priority] || PI[3]).c
          }
        }, (PI[task.priority] || PI[3]).l), /*#__PURE__*/React.createElement("span", {
          style: {
            fontSize: '0.78rem'
          }
        }, (DI[task.difficulty] || DI.usual).i), /*#__PURE__*/React.createElement(Tip, {
          label: task.skipped ? 'Un-skip this task (include in clean)' : 'Skip this task for today only — it will still show but won\'t count'
        }, /*#__PURE__*/React.createElement("button", {
          onClick: function onClick() {
            return toggleSkip(task.id);
          },
          style: {
            fontSize: '0.6rem',
            fontWeight: 800,
            padding: '2px 8px',
            borderRadius: 14,
            border: "1.5px solid ".concat(task.skipped ? '#4A8C58' : '#C07030'),
            background: task.skipped ? '#E8F5EE' : '#FFF0E0',
            color: task.skipped ? '#4A8C58' : '#C07030',
            whiteSpace: 'nowrap'
          }
        }, task.skipped ? '+ Include' : 'Skip')), task.custom && /*#__PURE__*/React.createElement(Tip, {
          label: "Remove this custom task permanently"
        }, /*#__PURE__*/React.createElement("button", {
          onClick: function onClick() {
            return delTask(task.id, rid);
          },
          style: {
            background: 'none',
            border: 'none',
            fontSize: '0.8rem',
            color: '#C08080',
            cursor: 'pointer'
          }
        }, "\uD83D\uDDD1\uFE0F")));
      }), landAddingTo === rid ? /*#__PURE__*/React.createElement("div", {
        style: {
          background: 'rgba(255,255,255,0.85)',
          borderRadius: 8,
          padding: 8,
          border: "1.5px solid ".concat(th.bd),
          marginTop: 6
        }
      }, /*#__PURE__*/React.createElement("input", {
        value: landNewT.t,
        onChange: function onChange(e) {
          return setLandNewT(function (p) {
            return _objectSpread(_objectSpread({}, p), {}, {
              t: e.target.value
            });
          });
        },
        onKeyDown: function onKeyDown(e) {
          if (e.key === 'Enter') landAddTask();
          if (e.key === 'Escape') setLandAddingTo(null);
        },
        placeholder: "Task description\u2026",
        autoFocus: true,
        style: {
          width: '100%',
          border: "1.5px solid ".concat(th.bd),
          borderRadius: 6,
          padding: '4px 7px',
          fontSize: '0.82rem',
          background: 'white',
          color: '#2B3A1A',
          marginBottom: 5
        }
      }), /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          gap: 4,
          marginBottom: 4,
          flexWrap: 'wrap'
        }
      }, [1, 2, 3, 4, 5].map(function (p) {
        return /*#__PURE__*/React.createElement("button", {
          key: p,
          onClick: function onClick() {
            return setLandNewT(function (v) {
              return _objectSpread(_objectSpread({}, v), {}, {
                priority: p
              });
            });
          },
          style: {
            fontSize: '0.6rem',
            fontWeight: 800,
            padding: '2px 7px',
            borderRadius: 14,
            border: "1.5px solid ".concat((PI[p] || PI[3]).c),
            background: landNewT.priority === p ? (PI[p] || PI[3]).c : (PI[p] || PI[3]).bg,
            color: landNewT.priority === p ? 'white' : (PI[p] || PI[3]).c
          }
        }, (PI[p] || PI[3]).l);
      }), Object.entries(DI).map(function (_ref14) {
        var _ref15 = _slicedToArray(_ref14, 2),
          k = _ref15[0],
          d = _ref15[1];
        return /*#__PURE__*/React.createElement("button", {
          key: k,
          onClick: function onClick() {
            return setLandNewT(function (v) {
              return _objectSpread(_objectSpread({}, v), {}, {
                difficulty: k
              });
            });
          },
          style: {
            fontSize: '0.6rem',
            fontWeight: 800,
            padding: '2px 7px',
            borderRadius: 14,
            border: "1.5px solid ".concat(d.c),
            background: landNewT.difficulty === k ? d.c : d.bg,
            color: landNewT.difficulty === k ? 'white' : d.c
          }
        }, d.i, " ", d.l);
      })), /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          gap: 5
        }
      }, /*#__PURE__*/React.createElement("button", {
        onClick: landAddTask,
        style: {
          flex: 1,
          background: th.ac,
          color: 'white',
          border: 'none',
          borderRadius: 7,
          padding: '5px',
          fontWeight: 800,
          fontSize: '0.75rem'
        }
      }, "+ Add"), /*#__PURE__*/React.createElement("button", {
        onClick: function onClick() {
          return setLandAddingTo(null);
        },
        style: {
          background: 'white',
          color: th.hc,
          border: "1px solid ".concat(th.bd),
          borderRadius: 7,
          padding: '5px 10px',
          fontWeight: 700,
          fontSize: '0.75rem'
        }
      }, "\u2715"))) : /*#__PURE__*/React.createElement("button", {
        onClick: function onClick() {
          setLandAddingTo(rid);
          setLandNewT(function (p) {
            return _objectSpread(_objectSpread({}, p), {}, {
              rid: rid
            });
          });
        },
        style: {
          width: '100%',
          background: 'transparent',
          border: "1.5px dashed ".concat(th.bd),
          borderRadius: 7,
          padding: '4px',
          color: th.ac,
          fontWeight: 800,
          fontSize: '0.7rem',
          marginTop: 5,
          cursor: 'pointer'
        },
        onMouseOver: function onMouseOver(e) {
          return e.currentTarget.style.background = th.ac + '14';
        },
        onMouseOut: function onMouseOut(e) {
          return e.currentTarget.style.background = 'transparent';
        }
      }, "+ Add Custom Task")));
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'linear-gradient(to top,#F4EFE0,#F4EFE0ee,transparent)',
        padding: '14px 20px',
        display: 'flex',
        gap: 10,
        justifyContent: 'center',
        alignItems: 'center'
      }
    }, /*#__PURE__*/React.createElement(Tip, {
      label: "View past deep clean history and stats"
    }, /*#__PURE__*/React.createElement("button", {
      onClick: function onClick() {
        return setScreen('stats');
      },
      style: {
        background: 'rgba(255,255,255,0.9)',
        border: '1.5px solid #C0D8A8',
        borderRadius: 11,
        padding: '9px 18px',
        fontWeight: 800,
        fontSize: '0.78rem',
        color: '#5A7248'
      }
    }, "\uD83D\uDCCA Stats")), /*#__PURE__*/React.createElement(Tip, {
      label: "Import a previously exported session file"
    }, /*#__PURE__*/React.createElement("button", {
      onClick: doImport,
      style: {
        background: 'rgba(255,255,255,0.9)',
        border: '1.5px solid #C0D8A8',
        borderRadius: 11,
        padding: '9px 18px',
        fontWeight: 800,
        fontSize: '0.78rem',
        color: '#5A7248'
      }
    }, "\uD83D\uDCE5 Import")), /*#__PURE__*/React.createElement("button", {
      onClick: function onClick() {
        return setScreen('main');
      },
      style: {
        background: 'linear-gradient(120deg,#4A8C58,#6A58BC)',
        color: 'white',
        border: 'none',
        borderRadius: 13,
        padding: '11px 36px',
        fontWeight: 900,
        fontSize: '0.95rem',
        boxShadow: '0 4px 16px rgba(74,140,88,0.4)',
        cursor: 'pointer'
      }
    }, "\u2728 Begin Clean \u2192")));
  }

  // ── STATS PAGE ────────────────────────────────────────────────────────────
  function StatsPage() {
    function deleteEntry(_x) {
      return _deleteEntry.apply(this, arguments);
    }
    function _deleteEntry() {
      _deleteEntry = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(i) {
        var n;
        return _regenerator().w(function (_context) {
          while (1) switch (_context.n) {
            case 0:
              _context.n = 1;
              return HQConfirm.ask('Delete this record?', {
                danger: true
              });
            case 1:
              if (_context.v) {
                _context.n = 2;
                break;
              }
              return _context.a(2);
            case 2:
              n = _toConsumableArray(stats);
              n.splice(i, 1);
              setStats(n);
              saveStats(n);
            case 3:
              return _context.a(2);
          }
        }, _callee);
      }));
      return _deleteEntry.apply(this, arguments);
    }
    var avgPct = stats.length ? Math.round(stats.reduce(function (a, s) {
      return a + s.pct;
    }, 0) / stats.length) : 0;
    var avgWork = stats.length ? Math.round(stats.reduce(function (a, s) {
      return a + (s.workSec || 0);
    }, 0) / stats.length) : 0;
    var best = stats.reduce(function (a, s) {
      return s.pct > a ? s.pct : a;
    }, 0);
    return /*#__PURE__*/React.createElement("div", {
      style: {
        background: '#F4EFE0',
        minHeight: '100vh',
        fontFamily: "'Nunito',sans-serif",
        paddingBottom: 60
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        background: 'linear-gradient(120deg,#EDF7EE,#EEF0FF,#FFF8E8)',
        borderBottom: '2px solid #C0D8A8',
        padding: '14px 18px 12px',
        position: 'sticky',
        top: 0,
        zIndex: 200,
        boxShadow: '0 2px 10px rgba(45,70,20,0.08)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12
      }
    }, /*#__PURE__*/React.createElement("h1", {
      style: {
        fontFamily: "'Playfair Display',serif",
        fontSize: '1.3rem',
        background: 'linear-gradient(120deg,#1D4100,#6A58BC)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      }
    }, "\uD83D\uDCCA Clean History"), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }), /*#__PURE__*/React.createElement("button", {
      onClick: function onClick() {
        return setScreen('landing');
      },
      style: {
        background: 'rgba(255,255,255,0.8)',
        border: '1.5px solid #C0D8A8',
        borderRadius: 9,
        padding: '5px 12px',
        fontWeight: 800,
        fontSize: '0.72rem',
        color: '#5A7248'
      }
    }, "\u2190 Back"), /*#__PURE__*/React.createElement(Tip, {
      label: "Export all data to JSON file"
    }, /*#__PURE__*/React.createElement("button", {
      onClick: doExport,
      style: {
        background: 'rgba(255,255,255,0.8)',
        border: '1.5px solid #C0D8A8',
        borderRadius: 9,
        padding: '5px 12px',
        fontWeight: 800,
        fontSize: '0.72rem',
        color: '#5A7248'
      }
    }, "\uD83D\uDCE4 Export")))), /*#__PURE__*/React.createElement("div", {
      style: {
        maxWidth: 800,
        margin: '0 auto',
        padding: '14px 14px'
      }
    }, stats.length === 0 ? /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: 'center',
        padding: '60px 20px',
        color: '#8A9870'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: '3rem',
        marginBottom: 12
      }
    }, "\uD83C\uDFC6"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'Playfair Display',serif",
        fontSize: '1.2rem',
        marginBottom: 6
      }
    }, "No completed cleans yet"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: '0.8rem'
      }
    }, "When you finish a clean and hit \"Complete this clean\", it'll show up here.")) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr 1fr',
        gap: 10,
        marginBottom: 16
      }
    }, [['Cleans Done', stats.length, '#4A8C58'], ['Avg Completion', avgPct + '%', '#6A58BC'], ['Best Session', best + '%', '#9A8000'], ['Avg Work Time', fmtHMS(avgWork), '#C07030']].map(function (_ref16) {
      var _ref17 = _slicedToArray(_ref16, 3),
        l = _ref17[0],
        v = _ref17[1],
        c = _ref17[2];
      return /*#__PURE__*/React.createElement("div", {
        key: l,
        style: {
          background: 'white',
          borderRadius: 11,
          padding: '10px 12px',
          textAlign: 'center',
          border: "1.5px solid ".concat(c, "22"),
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontFamily: "'Playfair Display',serif",
          fontWeight: 700,
          fontSize: '1.3rem',
          color: c
        }
      }, v), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: '0.62rem',
          fontWeight: 800,
          color: '#8A9870',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }
      }, l));
    })), stats.map(function (s, i) {
      var d = new Date(s.date);
      var dateStr = d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      var timeStr = d.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
      });
      return /*#__PURE__*/React.createElement("div", {
        key: i,
        style: {
          background: 'white',
          borderRadius: 13,
          padding: '12px 14px',
          marginBottom: 10,
          boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
          border: '1.5px solid #E0E8D8'
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          marginBottom: 8
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          flex: 1
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontFamily: "'Playfair Display',serif",
          fontWeight: 700,
          fontSize: '0.95rem',
          color: '#2B3A1A'
        }
      }, dateStr, " ", /*#__PURE__*/React.createElement("span", {
        style: {
          fontWeight: 400,
          color: '#8A9870',
          fontSize: '0.8rem'
        }
      }, "at ", timeStr)), s.note && /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: '0.72rem',
          color: '#6A7A5A',
          marginTop: 2,
          fontStyle: 'italic'
        }
      }, "\"", s.note, "\"")), /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontFamily: "'Playfair Display',serif",
          fontWeight: 700,
          fontSize: '1.4rem',
          color: s.pct >= 80 ? '#4A8C58' : s.pct >= 50 ? '#9A8000' : '#9A5828'
        }
      }, s.pct, "%"), /*#__PURE__*/React.createElement("button", {
        onClick: function onClick() {
          return deleteEntry(i);
        },
        style: {
          background: 'none',
          border: 'none',
          fontSize: '0.8rem',
          color: '#C08080',
          cursor: 'pointer',
          opacity: 0.6
        },
        onMouseOver: function onMouseOver(e) {
          return e.currentTarget.style.opacity = '1';
        },
        onMouseOut: function onMouseOut(e) {
          return e.currentTarget.style.opacity = '0.6';
        }
      }, "\uD83D\uDDD1\uFE0F"))), /*#__PURE__*/React.createElement("div", {
        style: {
          height: 6,
          background: '#F0F4E8',
          borderRadius: 10,
          overflow: 'hidden',
          marginBottom: 8
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          height: '100%',
          width: s.pct + '%',
          background: s.pct >= 80 ? '#4A8C58' : s.pct >= 50 ? '#9A8000' : '#C07030',
          borderRadius: 10,
          transition: 'width 0.5s ease'
        }
      })), /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap'
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: '0.65rem',
          fontWeight: 700,
          color: '#5A7248'
        }
      }, "\u2705 ", s.done, "/", s.total, " tasks"), s.skipped > 0 && /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: '0.65rem',
          fontWeight: 700,
          color: '#9A6050'
        }
      }, "\u23ED ", s.skipped, " skipped"), s.workSec > 0 && /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: '0.65rem',
          fontWeight: 700,
          color: '#C07030'
        }
      }, "\uD83D\uDCAA ", fmtHMS(s.workSec), " work"), s.breakSec > 0 && /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: '0.65rem',
          fontWeight: 700,
          color: '#9A50B0'
        }
      }, "\u2615 ", fmtHMS(s.breakSec), " break"), s.totalSec > 0 && /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: '0.65rem',
          fontWeight: 700,
          color: '#607090'
        }
      }, "\u23F1 ", fmtHMS(s.totalSec), " total")));
    }))));
  }

  // ── COMPLETE MODAL ────────────────────────────────────────────────────────
  function CompleteModal() {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(10,20,10,0.7)',
        backdropFilter: 'blur(4px)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        background: 'linear-gradient(145deg,#FEFBDE,#EDF7EE)',
        border: '2px solid #C0D8A8',
        borderRadius: 20,
        padding: '28px 28px',
        maxWidth: 420,
        width: '95%',
        boxShadow: '0 8px 40px rgba(0,0,0,0.25)',
        textAlign: 'center'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: '2.5rem',
        marginBottom: 8
      }
    }, "\uD83C\uDFC6"), /*#__PURE__*/React.createElement("h2", {
      style: {
        fontFamily: "'Playfair Display',serif",
        fontSize: '1.3rem',
        color: '#1D4100',
        marginBottom: 4
      }
    }, "Complete this Clean"), /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: '0.78rem',
        color: '#6A7A5A',
        marginBottom: 14,
        lineHeight: 1.5
      }
    }, "This will save your session to history with time, completion rate, and stopwatch data."), /*#__PURE__*/React.createElement("div", {
      style: {
        background: 'rgba(255,255,255,0.7)',
        borderRadius: 11,
        padding: '10px 12px',
        marginBottom: 14,
        textAlign: 'left',
        border: '1px solid #C0D8A8'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: '0.65rem',
        fontWeight: 800,
        color: '#4A8C58',
        marginBottom: 2
      }
    }, "SESSION SUMMARY"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 10,
        flexWrap: 'wrap'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: '0.72rem',
        fontWeight: 700,
        color: '#2B3A1A'
      }
    }, "\u2705 ", pct, "% complete (", doneCount, "/", total, ")"), timerDataRef.current.swWorkSec > 0 && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: '0.72rem',
        color: '#C07030',
        fontWeight: 700
      }
    }, "\uD83D\uDCAA ", fmtHMS(timerDataRef.current.swWorkSec)), timerDataRef.current.swBreakSec > 0 && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: '0.72rem',
        color: '#9A50B0',
        fontWeight: 700
      }
    }, "\u2615 ", fmtHMS(timerDataRef.current.swBreakSec)))), /*#__PURE__*/React.createElement("textarea", {
      value: completeNote,
      onChange: function onChange(e) {
        return setCompleteNote(e.target.value);
      },
      placeholder: "Any notes? (optional \u2014 how it went, what you skipped, etc.)",
      rows: 2,
      style: {
        width: '100%',
        border: '1.5px solid #C0D8A8',
        borderRadius: 9,
        padding: '8px 10px',
        fontSize: '0.78rem',
        resize: 'vertical',
        marginBottom: 14,
        background: 'white',
        color: '#2B3A1A',
        lineHeight: 1.5,
        outline: 'none'
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 10
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: function onClick() {
        return setShowCompleteModal(false);
      },
      style: {
        flex: 1,
        background: 'white',
        color: '#5A7248',
        border: '1.5px solid #C0D8A8',
        borderRadius: 11,
        padding: '9px',
        fontWeight: 800,
        fontSize: '0.78rem'
      }
    }, "Cancel"), /*#__PURE__*/React.createElement("button", {
      onClick: doCompleteClean,
      style: {
        flex: 2,
        background: 'linear-gradient(120deg,#4A8C58,#6A58BC)',
        color: 'white',
        border: 'none',
        borderRadius: 11,
        padding: '9px',
        fontWeight: 900,
        fontSize: '0.85rem',
        boxShadow: '0 4px 14px rgba(74,140,88,0.35)'
      }
    }, "\u2728 Save & Record"))));
  }

  // ── MAIN APP ──────────────────────────────────────────────────────────────
  if (screen === 'landing') return /*#__PURE__*/React.createElement(LandingPage, null);
  if (screen === 'stats') return /*#__PURE__*/React.createElement(StatsPage, null);
  var catDone = CAT_PHASES.map(function (cp) {
    return Object.values(tasks).filter(function (t) {
      return t.phase === cp.ph && t.done && !t.skipped;
    }).length;
  });
  var catTotal = CAT_PHASES.map(function (cp) {
    return Object.values(tasks).filter(function (t) {
      return t.phase === cp.ph && !t.skipped;
    }).length;
  });
  var nextWaveIdx = OOO_WAVES.findIndex(function (w) {
    return w.groups.flatMap(function (g) {
      return g.tids;
    }).some(function (id) {
      return tasks[id] && !tasks[id].done && !tasks[id].skipped;
    });
  });
  var stepsDone = OOO_WAVES.filter(function (w) {
    return w.groups.flatMap(function (g) {
      return g.tids;
    }).every(function (id) {
      return !tasks[id] || tasks[id].done || tasks[id].skipped;
    });
  }).length;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: '#F4EFE0',
      minHeight: '100vh',
      fontFamily: "'Nunito',sans-serif",
      paddingBottom: 80
    }
  }, showCompleteModal && /*#__PURE__*/React.createElement(CompleteModal, null), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      top: 10,
      right: 12,
      zIndex: 900,
      display: 'flex',
      flexDirection: 'column',
      gap: 5,
      pointerEvents: 'none'
    }
  }, toasts.map(function (t) {
    return /*#__PURE__*/React.createElement("div", {
      key: t.id,
      className: "wave-in",
      style: {
        background: 'white',
        border: "2px solid ".concat(t.color),
        borderRadius: 10,
        padding: '6px 11px',
        boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
        maxWidth: 230,
        pointerEvents: 'none'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: '0.84rem',
        fontWeight: 800,
        color: '#2B3A1A'
      }
    }, t.msg));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'linear-gradient(120deg,#EDF7EE,#EEF0FF,#FFF8E8,#F8EDEA)',
      borderBottom: '2px solid #C0D8A8',
      padding: '10px 14px 8px',
      position: 'sticky',
      top: 0,
      zIndex: 200,
      boxShadow: '0 2px 10px rgba(45,70,20,0.08)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginBottom: 7,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: "'Playfair Display',serif",
      fontSize: '1.25rem',
      lineHeight: 1,
      background: 'linear-gradient(120deg,#1D4100,#6A58BC,#9A6050)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text'
    }
  }, "\u2728 Weekend Deep Clean"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.7rem',
      fontWeight: 700,
      color: '#6A7A5A',
      marginTop: 1,
      fontStyle: 'italic'
    }
  }, heroMsg)), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 20
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      background: 'rgba(255,255,255,0.7)',
      borderRadius: 9,
      padding: 3,
      gap: 2,
      border: '1px solid #C0D8A8'
    }
  }, [{
    id: 'room',
    icon: '🏠',
    label: 'By Room',
    tip: 'View tasks organized by room'
  }, {
    id: 'category',
    icon: '📊',
    label: 'By Category',
    tip: 'View tasks organized by cleaning phase'
  }, {
    id: 'ooo',
    icon: '🔮',
    label: 'OOO',
    tip: 'Order of Operations — step-by-step whole-apartment sequence'
  }].map(function (v) {
    return /*#__PURE__*/React.createElement(Tip, {
      key: v.id,
      label: v.tip
    }, /*#__PURE__*/React.createElement("button", {
      onClick: function onClick() {
        return setViewMode(v.id);
      },
      style: {
        padding: '5px 10px',
        borderRadius: 7,
        border: 'none',
        fontWeight: 800,
        fontSize: '0.72rem',
        transition: 'all 0.15s',
        whiteSpace: 'nowrap',
        background: viewMode === v.id ? 'white' : 'transparent',
        color: viewMode === v.id ? '#2B3A1A' : '#7A8A68',
        boxShadow: viewMode === v.id ? '0 1px 5px rgba(45,70,20,0.13)' : 'none'
      }
    }, v.icon, " ", v.label));
  })), [[pct + '%', 'Complete', '#4A8C58', 'Overall completion percentage'], [doneCount, 'Done', '#6A58BC', 'Tasks completed this session'], [total - doneCount, 'Left', '#9A6050', 'Remaining active tasks']].map(function (_ref18) {
    var _ref19 = _slicedToArray(_ref18, 4),
      v = _ref19[0],
      l = _ref19[1],
      c = _ref19[2],
      tip = _ref19[3];
    return /*#__PURE__*/React.createElement(Tip, {
      key: l,
      label: tip
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        background: 'rgba(255,255,255,0.8)',
        border: "1.5px solid ".concat(c, "33"),
        borderRadius: 9,
        padding: '3px 9px',
        textAlign: 'center',
        minWidth: 50,
        cursor: 'default'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'Playfair Display',serif",
        fontWeight: 700,
        fontSize: '1rem',
        color: c,
        lineHeight: 1
      }
    }, v), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: '0.58rem',
        fontWeight: 800,
        color: '#8A9870',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }
    }, l)));
  }), /*#__PURE__*/React.createElement(Tip, {
    label: "Record this clean session to your history"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      return setShowCompleteModal(true);
    },
    style: {
      background: 'linear-gradient(120deg,#4A8C58,#6A58BC)',
      color: 'white',
      border: 'none',
      borderRadius: 8,
      padding: '5px 10px',
      fontWeight: 800,
      fontSize: '0.68rem',
      boxShadow: '0 2px 8px rgba(74,140,88,0.3)'
    }
  }, "\uD83C\uDFC6 Complete")), /*#__PURE__*/React.createElement(Tip, {
    label: "Export current session as JSON file"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: doExport,
    style: {
      background: 'rgba(255,255,255,0.7)',
      border: '1.5px solid #C0D8A8',
      borderRadius: 8,
      padding: '5px 8px',
      fontWeight: 800,
      fontSize: '0.68rem',
      color: '#5A7248'
    }
  }, "\uD83D\uDCE4")), /*#__PURE__*/React.createElement(Tip, {
    label: "View past clean history and stats"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      return setScreen('stats');
    },
    style: {
      background: 'rgba(255,255,255,0.7)',
      border: '1.5px solid #C0D8A8',
      borderRadius: 8,
      padding: '5px 8px',
      fontWeight: 800,
      fontSize: '0.68rem',
      color: '#5A7248'
    }
  }, "\uD83D\uDCCA")), /*#__PURE__*/React.createElement(Tip, {
    label: "Configure rooms and task pools in Customize"
  }, /*#__PURE__*/React.createElement("a", {
    href: "customize.html#dc-setup",
    style: {
      background: 'rgba(255,255,255,0.7)',
      border: '1.5px solid #C8C0D8',
      borderRadius: 8,
      padding: '5px 8px',
      fontWeight: 800,
      fontSize: '0.68rem',
      color: '#6A58BC',
      textDecoration: 'none',
      display: 'inline-flex',
      alignItems: 'center'
    }
  }, "\u2699\uFE0F")), /*#__PURE__*/React.createElement(Tip, {
    label: "Go back to task review / landing page"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      return setScreen('landing');
    },
    style: {
      background: 'rgba(255,255,255,0.7)',
      border: '1.5px solid #C0D8A8',
      borderRadius: 8,
      padding: '5px 8px',
      fontWeight: 800,
      fontSize: '0.68rem',
      color: '#5A7248'
    }
  }, "\u2B05")), /*#__PURE__*/React.createElement(Tip, {
    label: "Reset ALL progress and return to start \u2014 cannot be undone"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: doReset,
    style: {
      background: 'rgba(255,255,255,0.7)',
      border: '1.5px solid #F0B0A0',
      borderRadius: 8,
      padding: '5px 10px',
      fontWeight: 800,
      fontSize: '0.7rem',
      color: '#9A5040'
    },
    onMouseOver: function onMouseOver(e) {
      return e.currentTarget.style.background = '#FFF0EE';
    },
    onMouseOut: function onMouseOut(e) {
      return e.currentTarget.style.background = 'rgba(255,255,255,0.7)';
    }
  }, "\u21BA Reset"))), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 8,
      background: 'rgba(255,255,255,0.55)',
      borderRadius: 16,
      overflow: 'hidden',
      border: '1px solid #C0D8A8',
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "sparkle-bar",
    style: {
      height: '100%',
      width: pct + '%',
      borderRadius: 16,
      transition: 'width 0.6s cubic-bezier(0.34,1.56,0.64,1)'
    }
  })), viewMode === 'category' && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 7,
      alignItems: 'center',
      flexWrap: 'wrap'
    }
  }, CAT_PHASES.map(function (cp, i) {
    return /*#__PURE__*/React.createElement(Tip, {
      key: cp.ph,
      label: "".concat(cp.label, ": ").concat(catDone[i], "/").concat(catTotal[i], " done")
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 3,
        cursor: 'default'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: '0.72rem'
      }
    }, cp.icon), /*#__PURE__*/React.createElement("div", {
      style: {
        height: 5,
        width: 34,
        background: 'rgba(255,255,255,0.5)',
        borderRadius: 5,
        overflow: 'hidden',
        border: "1px solid ".concat(cp.bd)
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "sparkle-bar",
      style: {
        height: '100%',
        width: catTotal[i] ? catDone[i] / catTotal[i] * 100 + '%' : '0%',
        borderRadius: 5
      }
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: '0.62rem',
        fontWeight: 800,
        color: cp.color
      }
    }, catDone[i], "/", catTotal[i])));
  })), viewMode === 'ooo' && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      alignItems: 'center',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.7rem',
      fontWeight: 800,
      color: '#6A7A5A'
    }
  }, "\uD83D\uDD2E ", nextWaveIdx >= 0 ? "Step ".concat(OOO_WAVES[nextWaveIdx].step, " next: ").concat(OOO_WAVES[nextWaveIdx].label) : 'All steps complete! ✨'), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto',
      fontSize: '0.62rem',
      color: '#8A9870',
      fontWeight: 700
    }
  }, stepsDone, "/", OOO_WAVES.length, " done"))), viewMode === 'room' && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: 12,
      padding: '12px 13px',
      alignItems: 'start'
    }
  }, cols.map(function (colRooms, ci) {
    return /*#__PURE__*/React.createElement("div", {
      key: ci
    }, colRooms.map(function (rid) {
      return /*#__PURE__*/React.createElement(RoomCard, {
        key: rid,
        rid: rid,
        ci: ci
      });
    }));
  })), viewMode === 'category' && /*#__PURE__*/React.createElement(CategoryView, null), viewMode === 'ooo' && /*#__PURE__*/React.createElement(OOOView, null), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      bottom: 12,
      right: 12,
      zIndex: 400,
      display: 'flex',
      flexDirection: 'column',
      gap: 7,
      alignItems: 'flex-end'
    }
  }, floatVisible && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 7,
      alignItems: 'flex-end',
      flexWrap: 'wrap',
      justifyContent: 'flex-end'
    }
  }, /*#__PURE__*/React.createElement(StopwatchPanel, {
    dataRef: timerDataRef,
    onToast: addToast
  }), /*#__PURE__*/React.createElement(TimerPanel, {
    isBreak: false,
    onToast: addToast
  }), /*#__PURE__*/React.createElement(TimerPanel, {
    isBreak: true,
    onToast: addToast
  })), /*#__PURE__*/React.createElement(Tip, {
    label: floatVisible ? 'Hide timers and stopwatch' : 'Show timers and stopwatch'
  }, /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      return setFloatVisible(function (v) {
        return !v;
      });
    },
    style: {
      background: 'rgba(255,255,255,0.85)',
      border: '1.5px solid #C0D8A8',
      borderRadius: 16,
      padding: '3px 10px',
      fontSize: '0.62rem',
      fontWeight: 800,
      color: '#5A7248',
      boxShadow: '0 2px 7px rgba(45,70,20,0.1)'
    }
  }, floatVisible ? '▾ hide' : '▴ timers'))));
}
ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));

/* ── localStorage migration: old keys → audhd-hq-* ── */
(function migrateLS() {
  [['deepclean_v7', HQKeys.DEEPCLEAN], ['deepclean_v6', HQKeys.DEEPCLEAN], ['deepclean_stats_v1', HQKeys.DEEPCLEAN_STATS]].forEach(function (_ref20) {
    var _ref21 = _slicedToArray(_ref20, 2),
      o = _ref21[0],
      n = _ref21[1];
    try {
      var old = HQSafe.store.get(o);
      if (old && !HQSafe.store.get(n)) HQSafe.store.set(n, old);
      HQSafe.store.remove(o);
    } catch (e) {}
  });
})();

// Theme, nav, clock: delegated to hq-core.js

// DEAD CODE REMOVED: SW registration was unreachable here (file not loaded by HTML).
// SW registration is handled by core/hq-deploy-gate.js on every page.
