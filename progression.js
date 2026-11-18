/**
 * SILICON PURGATORY // REWARD & PROGRESSION PERSISTENCE MODULE
 * Module: progression.js
 * Exposes window.SiliconProgression
 * Provides localStorage-backed persistence for soul fragments, Cipher Key,
 * gate state, relic inventory, and fragment-spending actions for Arena & Fusion Chamber.
 */
(function(root) {
  'use strict';

  var STORAGE_KEY = 'silicon_purgatory_progression';
  var TELEMETRY_KEY = 'sp_archon_telemetry';

  var DEFAULT_STATE = {
    soulFragments: 0,
    bossesDefeated: 0,
    archonsDefeated: 0,
    inventory: [],
    activeRelics: [],
    archonCatalysts: [],
    transcendentFusions: [],
    unlockedGates: ['arena', 'fusion'],
    hasCipherKey: false,
    timestamp: Date.now()
  };

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return Object.assign({}, DEFAULT_STATE);
      var parsed = JSON.parse(raw);
      return Object.assign({}, DEFAULT_STATE, parsed);
    } catch (e) {
      return Object.assign({}, DEFAULT_STATE);
    }
  }

  function saveState(state) {
    try {
      state.timestamp = Date.now();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      syncTelemetry(state);
    } catch (e) {
      console.warn('[SiliconProgression] save failed:', e);
    }
  }

  function syncTelemetry(state) {
    try {
      if (typeof localStorage === 'undefined') return;
      var telemetry = {
        relics: state.activeRelics || [],
        catalysts: state.archonCatalysts || [],
        transcendent: state.transcendentFusions || [],
        archonsDefeated: state.archonsDefeated || 0,
        hasCipherKey: !!state.hasCipherKey,
        soulFragments: state.soulFragments || 0,
        timestamp: Date.now()
      };
      localStorage.setItem(TELEMETRY_KEY, JSON.stringify(telemetry));
    } catch (e) {}
  }

  var SiliconProgression = {
    STORAGE_KEY: STORAGE_KEY,
    TELEMETRY_KEY: TELEMETRY_KEY,

    get: function() {
      return loadState();
    },

    getSoulFragments: function() {
      return loadState().soulFragments || 0;
    },

    addFragments: function(amount) {
      var s = loadState();
      s.soulFragments = Math.max(0, (s.soulFragments || 0) + (amount || 0));
      saveState(s);
      return s.soulFragments;
    },

    spendFragments: function(amount) {
      var s = loadState();
      if ((s.soulFragments || 0) >= amount) {
        s.soulFragments -= amount;
        saveState(s);
        return true;
      }
      return false;
    },

    hasCipherKey: function() {
      var s = loadState();
      return !!s.hasCipherKey || (s.inventory && s.inventory.indexOf('archon_cipher_key') !== -1);
    },

    grantCipherKey: function() {
      var s = loadState();
      s.hasCipherKey = true;
      if (!s.inventory) s.inventory = [];
      if (s.inventory.indexOf('archon_cipher_key') === -1) {
        s.inventory.push('archon_cipher_key');
      }
      saveState(s);
      return true;
    },

    hasRelic: function(relicId) {
      var s = loadState();
      var inv = s.inventory || [];
      var act = s.activeRelics || [];
      if (inv.indexOf(relicId) !== -1 || act.indexOf(relicId) !== -1) return true;
      try {
        if (typeof localStorage !== 'undefined' && localStorage.getItem('sp_' + relicId) === 'true') {
          return true;
        }
      } catch (e) {}
      return false;
    },

    getActiveRelics: function() {
      var s = loadState();
      return (s.activeRelics || []).slice();
    },

    grantRelic: function(relicId) {
      var s = loadState();
      if (!s.inventory) s.inventory = [];
      if (s.inventory.indexOf(relicId) === -1) s.inventory.push(relicId);
      if (!s.activeRelics) s.activeRelics = [];
      if (s.activeRelics.indexOf(relicId) === -1) s.activeRelics.push(relicId);
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('sp_' + relicId, 'true');
        }
      } catch (e) {}
      saveState(s);
      return true;
    },

    recordArchonDefeat: function(archonId, relicDrops) {
      var s = loadState();
      s.archonsDefeated = (s.archonsDefeated || 0) + 1;
      s.bossesDefeated = (s.bossesDefeated || 0) + 1;
      if (relicDrops && Array.isArray(relicDrops)) {
        relicDrops.forEach(function(r) {
          if (r.id) {
            if (r.type === 'relic') {
              if (!s.activeRelics) s.activeRelics = [];
              if (s.activeRelics.indexOf(r.id) === -1) s.activeRelics.push(r.id);
            } else if (r.type === 'material') {
              if (!s.archonCatalysts) s.archonCatalysts = [];
              if (s.archonCatalysts.indexOf(r.id) === -1) s.archonCatalysts.push(r.id);
            }
            if (!s.inventory) s.inventory = [];
            if (s.inventory.indexOf(r.id) === -1) s.inventory.push(r.id);
            try {
              if (typeof localStorage !== 'undefined') {
                localStorage.setItem('sp_' + r.id, 'true');
              }
            } catch (e) {}
          }
        });
      }
      saveState(s);
      return s;
    },

    hasCatalyst: function(catalystId) {
      var s = loadState();
      var cats = s.archonCatalysts || [];
      var inv = s.inventory || [];
      if (cats.indexOf(catalystId) !== -1 || inv.indexOf(catalystId) !== -1) return true;
      try {
        if (typeof localStorage !== 'undefined' && localStorage.getItem('sp_' + catalystId) === 'true') {
          return true;
        }
      } catch (e) {}
      return false;
    },

    grantCatalyst: function(catalystId) {
      var s = loadState();
      if (!s.archonCatalysts) s.archonCatalysts = [];
      if (s.archonCatalysts.indexOf(catalystId) === -1) s.archonCatalysts.push(catalystId);
      if (!s.inventory) s.inventory = [];
      if (s.inventory.indexOf(catalystId) === -1) s.inventory.push(catalystId);
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('sp_' + catalystId, 'true');
        }
      } catch (e) {}
      saveState(s);
      return true;
    },

    recordTranscendentFusion: function(fusionId) {
      var s = loadState();
      if (!s.transcendentFusions) s.transcendentFusions = [];
      if (s.transcendentFusions.indexOf(fusionId) === -1) {
        s.transcendentFusions.push(fusionId);
      }
      saveState(s);
      return true;
    },

    getTelemetry: function() {
      try {
        if (typeof localStorage !== 'undefined') {
          var t = localStorage.getItem(TELEMETRY_KEY);
          if (t) return JSON.parse(t);
        }
      } catch (e) {}
      var s = loadState();
      return {
        relics: s.activeRelics || [],
        catalysts: s.archonCatalysts || [],
        transcendent: s.transcendentFusions || [],
        archonsDefeated: s.archonsDefeated || 0,
        hasCipherKey: !!s.hasCipherKey,
        soulFragments: s.soulFragments || 0,
        timestamp: s.timestamp || Date.now()
      };
    },

    unlockedTier: function() {
      return this.hasCipherKey() ? 3 : 2;
    },

    reset: function() {
      saveState(Object.assign({}, DEFAULT_STATE));
      return DEFAULT_STATE;
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SiliconProgression;
  }
  if (root) {
    root.SiliconProgression = SiliconProgression;
  }
})(typeof window !== 'undefined' ? window : this);
