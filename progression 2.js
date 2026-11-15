/*
 * progression.js — Silicon Purgatory persistent progression layer
 * Zero dependencies. Wraps localStorage key 'silicon_purgatory_progression'.
 * Exposes window.SiliconProgression (browser) and module.exports (Node).
 *
 * Stored shape (shared with rewards.js — fields are merged, never clobbered):
 *   { soulFragments:Number, inventory:[String], bossesDefeated:Number,
 *     arenaBuffs:{ flux:Number, damage:Number } }
 */
(function (root) {
  'use strict';

  var STORAGE_KEY = 'silicon_purgatory_progression';
  var CIPHER_ID = 'archon_cipher';
  var BUFF_TYPES = ['flux', 'damage'];

  function toInt(v, fallback) {
    var n = parseInt(v, 10);
    return isNaN(n) ? (fallback || 0) : n;
  }

  // Non-throwing localStorage probe (private browsing / Node / sandboxes).
  function storage() {
    try {
      if (typeof localStorage !== 'undefined' && localStorage) return localStorage;
    } catch (e) {}
    return null;
  }

  // In-memory fallback so the API still works without localStorage.
  var memoryRaw = null;

  function readRaw() {
    var ls = storage();
    if (ls) {
      try {
        var raw = ls.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) || {}) : {};
      } catch (e) { return {}; }
    }
    return memoryRaw || {};
  }

  function normalize(raw) {
    raw = raw || {};
    var buffs = raw.arenaBuffs || {};
    var inv = Array.isArray(raw.inventory) ? raw.inventory.slice() : [];
    // compatibility with rewards.js archon_cipher vs archon_cipher_key
    return {
      soulFragments: toInt(raw.soulFragments, 0),
      inventory: inv,
      bossesDefeated: toInt(raw.bossesDefeated, 0),
      arenaBuffs: { flux: toInt(buffs.flux, 0), damage: toInt(buffs.damage, 0) }
    };
  }

  function read() { return normalize(readRaw()); }

  // Merge known fields onto the existing raw object so unknown keys written by
  // rewards.js (or future modules) survive our writes.
  function persist(state) {
    var base = readRaw();
    base.soulFragments = state.soulFragments;
    base.inventory = state.inventory;
    base.bossesDefeated = state.bossesDefeated;
    base.arenaBuffs = state.arenaBuffs;
    var ls = storage();
    if (ls) {
      try { ls.setItem(STORAGE_KEY, JSON.stringify(base)); } catch (e) {}
    } else {
      memoryRaw = base;
    }
    return state;
  }

  // --- Public API ---------------------------------------------------------

  function getSoulFragments() { return read().soulFragments; }

  function addFragments(amt) {
    var s = read();
    s.soulFragments = Math.max(0, s.soulFragments + toInt(amt, 0));
    persist(s);
    return s.soulFragments;
  }

  function spendFragments(amt) {
    amt = toInt(amt, 0);
    if (amt < 0) return false;
    var s = read();
    if (s.soulFragments < amt) return false;
    s.soulFragments -= amt;
    persist(s);
    return true;
  }

  function getInventory() { return read().inventory; }

  function hasCipherKey() {
    var inv = read().inventory;
    return inv.indexOf(CIPHER_ID) !== -1 || inv.indexOf('archon_cipher_key') !== -1;
  }

  function getFusionTier() { return hasCipherKey() ? 2 : 1; }

  function getArenaBuffs() { return read().arenaBuffs; }

  function buyArenaBuff(type, cost) {
    if (BUFF_TYPES.indexOf(type) === -1) return false;
    if (!spendFragments(cost)) return false;
    var s = read();
    s.arenaBuffs[type] = (s.arenaBuffs[type] || 0) + 1;
    persist(s);
    return true;
  }

  // Convenience for the Fusion Chamber UI.
  function canForgeArchon() { return hasCipherKey(); }
  function getMaxFusionTier() { return getFusionTier() >= 2 ? 3 : 2; }

  // --- Optional DemonFusion augmentation -----------------------------------
  function augmentFusion() {
    var DF = root && root.DemonFusion;
    if (!DF || typeof DF !== 'object') return;
    if (typeof DF.isForbiddenUnlocked !== 'function') {
      DF.isForbiddenUnlocked = function () { return hasCipherKey(); };
    }
    if (typeof DF.maxTier !== 'function') {
      DF.maxTier = function () { return getMaxFusionTier(); };
    }
  }

  var API = {
    STORAGE_KEY: STORAGE_KEY,
    getSoulFragments: getSoulFragments,
    addFragments: addFragments,
    spendFragments: spendFragments,
    getInventory: getInventory,
    hasCipherKey: hasCipherKey,
    getFusionTier: getFusionTier,
    getArenaBuffs: getArenaBuffs,
    buyArenaBuff: buyArenaBuff,
    canForgeArchon: canForgeArchon,
    getMaxFusionTier: getMaxFusionTier,
    augmentFusion: augmentFusion
  };

  if (root) {
    root.SiliconProgression = API;
    augmentFusion();
    if (typeof root.addEventListener === 'function') {
      root.addEventListener('DOMContentLoaded', augmentFusion);
    }
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = API;

})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
