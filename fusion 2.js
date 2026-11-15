/*
 * fusion.js — Silicon Purgatory demon fusion engine
 * Zero-dependency ES5/ES6 module. Exposes window.DemonFusion (+ CommonJS).
 *
 * Fusing two distinct demons yields a higher-tier entity. Fusing a demon
 * with itself overclocks it. Unknown pairings fall back to a stat-averaged
 * hybrid so the engine never returns null for two valid parents.
 * Gated by SiliconProgression: Tier 3 demons require the Archon Cipher Key.
 */
(function (root) {
  'use strict';

  var ELEMENTS = ['kinetic', 'thermal', 'cryo', 'volt', 'void'];

  // Higher-tier catalog (results of fusion)
  var FUSION_CATALOG = {
    // Tier 2 demons (unlocked by default)
    hellhound: {
      id: 'hellhound',
      name: 'HELLHOUND V2',
      tier: 2,
      hp: 170,
      sp: 85,
      atk: 22,
      aff: { kinetic: 'res', thermal: 'drain', cryo: 'weak', void: 'res' },
      skills: ['thermal', 'kinetic', 'void'],
      col: '#ef4444',
      col2: '#7f1d1d',
      glow: '#f87171',
      horns: true,
      lore: 'Cerberus derivative. Dual thermal exhaust chambers with hardened bone plating.'
    },
    frostseraph: {
      id: 'frostseraph',
      name: 'FROST SERAPH',
      tier: 2,
      hp: 160,
      sp: 110,
      atk: 21,
      aff: { kinetic: 'weak', cryo: 'drain', thermal: 'weak', volt: 'res', void: 'res' },
      skills: ['cryo', 'void', 'patch'],
      col: '#06b6d4',
      col2: '#164e63',
      glow: '#67e8f9',
      horns: false,
      lore: 'Sub-zero daemon compiled from high-order mathematical matrices.'
    },
    plasmalord: {
      id: 'plasmalord',
      name: 'PLASMA LORD',
      tier: 2,
      hp: 155,
      sp: 120,
      atk: 24,
      aff: { volt: 'drain', kinetic: 'res', void: 'weak' },
      skills: ['volt', 'thermal', 'void'],
      col: '#eab308',
      col2: '#713f12',
      glow: '#fde047',
      horns: true,
      lore: 'Discharge arc manifestation trapped in a heavy ceramic insulator cage.'
    },
    voidwalker: {
      id: 'voidwalker',
      name: 'VOID WALKER',
      tier: 2,
      hp: 190,
      sp: 95,
      atk: 23,
      aff: { void: 'drain', volt: 'weak', kinetic: 'res', thermal: 'res', cryo: 'res' },
      skills: ['void', 'kinetic', 'void'],
      col: '#8b5cf6',
      col2: '#4c1d95',
      glow: '#c084fc',
      horns: true,
      lore: 'Autonomous null-space predator. Feeds on corrupted process registers.'
    },
    archonsentinel: {
      id: 'archonsentinel',
      name: 'ARCHON SENTINEL',
      tier: 2,
      hp: 180,
      sp: 90,
      atk: 25,
      aff: { kinetic: 'drain', thermal: 'res', cryo: 'res', void: 'weak' },
      skills: ['kinetic', 'void', 'kinetic'],
      col: '#f43f5e',
      col2: '#881337',
      glow: '#fb7185',
      horns: true,
      lore: 'Heavily fortified perimeter daemon reforged with reinforced chassis.'
    },

    // Tier 3 Secret Demon: Requires Archon Cipher Key
    colossusprime: {
      id: 'colossusprime',
      name: 'ARCHON COLOSSUS PRIME',
      tier: 3,
      requiresKey: 'archon_cipher_key',
      hp: 280,
      sp: 160,
      atk: 34,
      aff: { void: 'drain', kinetic: 'drain', thermal: 'res', cryo: 'res', volt: 'res' },
      skills: ['void', 'kinetic', 'patch'],
      col: '#f59e0b',
      col2: '#78350f',
      glow: '#fde68a',
      horns: true,
      lore: 'Sanctum Archon merged with combat frame. Gated by Archon Cipher Key.'
    }
  };

  // Canonical fusion table: pairs map to a specific result id
  var FUSION_RECIPES = {
    'pyroclocker+sentinel': 'hellhound',
    'sentinel+pyroclocker': 'hellhound',

    'cryodrifter+sentinel': 'frostseraph',
    'sentinel+cryodrifter': 'frostseraph',

    'sparkharvester+sentinel': 'plasmalord',
    'sentinel+sparkharvester': 'plasmalord',

    'coreinquisitor+sentinel': 'voidwalker',
    'sentinel+coreinquisitor': 'voidwalker',

    'pyroclocker+cryodrifter': 'plasmalord',
    'cryodrifter+pyroclocker': 'plasmalord',

    'sparkharvester+pyroclocker': 'hellhound',
    'pyroclocker+sparkharvester': 'hellhound',

    'coreinquisitor+pyroclocker': 'voidwalker',
    'pyroclocker+coreinquisitor': 'voidwalker',

    'sparkharvester+cryodrifter': 'frostseraph',
    'cryodrifter+sparkharvester': 'frostseraph',

    'coreinquisitor+cryodrifter': 'voidwalker',
    'cryodrifter+coreinquisitor': 'voidwalker',

    'coreinquisitor+sparkharvester': 'archonsentinel',
    'sparkharvester+coreinquisitor': 'archonsentinel',

    // Archon Cipher Tier 3 Fusion pairings
    'voidwalker+archonsentinel': 'colossusprime',
    'archonsentinel+voidwalker': 'colossusprime',
    'hellhound+voidwalker': 'colossusprime',
    'voidwalker+hellhound': 'colossusprime'
  };

  function pairKey(a, b) {
    return (a.id || a) + '+' + (b.id || b);
  }

  function inheritResistances(aAff, bAff) {
    var out = {};
    ELEMENTS.forEach(function (el) {
      var rA = aAff[el];
      var rB = bAff[el];
      if (rA === 'drain' || rB === 'drain') out[el] = 'drain';
      else if (rA === 'nul' || rB === 'nul') out[el] = 'nul';
      else if (rA === 'res' || rB === 'res') out[el] = 'res';
      else if (rA === 'weak' && rB === 'weak') out[el] = 'weak';
    });
    return out;
  }

  function inheritSkills(aSkills, bSkills, max) {
    max = max || 3;
    var seen = {};
    var pool = [];
    (aSkills || []).concat(bSkills || []).forEach(function (s) {
      if (!seen[s]) {
        seen[s] = true;
        pool.push(s);
      }
    });
    return pool.slice(0, max);
  }

  function overclockDemon(d) {
    var copy = JSON.parse(JSON.stringify(d));
    copy.tier = (copy.tier || 1) + 1;
    copy.name = 'OVERCLOCKED ' + copy.name;
    copy.hp = Math.round(copy.hp * 1.3);
    copy.sp = Math.round(copy.sp * 1.3);
    copy.atk = Math.round(copy.atk * 1.25);
    copy.overclocked = true;
    return copy;
  }

  function fallbackHybrid(a, b) {
    var combinedAff = inheritResistances(a.aff || {}, b.aff || {});
    var combinedSkills = inheritSkills(a.skills || [], b.skills || [], 3);
    var avgHp = Math.round(((a.hp || 100) + (b.hp || 100)) / 2 * 1.15);
    var avgSp = Math.round(((a.sp || 50) + (b.sp || 50)) / 2 * 1.15);
    var avgAtk = Math.round(((a.atk || 14) + (b.atk || 14)) / 2 * 1.15);

    return {
      id: (a.id || 'alpha') + '_' + (b.id || 'beta'),
      name: 'HYBRID ' + (a.name || 'VESSEL').split(' ')[0] + '-' + (b.name || 'VESSEL').split(' ')[0],
      tier: Math.max(a.tier || 1, b.tier || 1) + 1,
      hp: avgHp,
      sp: avgSp,
      atk: avgAtk,
      aff: combinedAff,
      skills: combinedSkills.length ? combinedSkills : ['kinetic', 'void'],
      col: a.col || '#a855f7',
      col2: b.col2 || '#3b0764',
      glow: '#e9d5ff',
      horns: !!(a.horns || b.horns),
      lore: 'Synthesized amalgam of ' + a.name + ' and ' + b.name + '.'
    };
  }

  var DemonFusion = {
    catalog: FUSION_CATALOG,
    recipes: FUSION_RECIPES,

    canFuseTier: function(targetTier) {
      if (targetTier <= 2) return true;
      if (root.SiliconProgression && root.SiliconProgression.hasCipherKey) {
        return root.SiliconProgression.hasCipherKey();
      }
      return false;
    },

    preview: function (a, b) {
      if (!a || !b) return null;
      if (a.id === b.id) {
        return overclockDemon(a);
      }
      var key = pairKey(a, b);
      var resultId = FUSION_RECIPES[key];
      if (resultId && FUSION_CATALOG[resultId]) {
        var base = FUSION_CATALOG[resultId];
        var out = JSON.parse(JSON.stringify(base));
        out.aff = inheritResistances(a.aff || {}, b.aff || {});
        Object.keys(base.aff || {}).forEach(function (k) {
          out.aff[k] = base.aff[k];
        });
        out.skills = inheritSkills(base.skills, (a.skills || []).concat(b.skills || []), 3);
        
        // Cipher Key Gating Check
        if (out.tier >= 3 && !this.canFuseTier(out.tier)) {
          out.locked = true;
          out.lockReason = 'LOCKED: Requires Archon Cipher Key (Defeat Null Colossus in Boss Sanctum)';
        }
        return out;
      }
      return fallbackHybrid(a, b);
    },

    fuse: function (a, b) {
      var outcome = this.preview(a, b);
      if (!outcome) return null;
      if (outcome.locked) {
        console.warn('[DemonFusion] Synthesis blocked: cipher key missing.');
        return null;
      }
      return outcome;
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = DemonFusion;
  }
  if (root) {
    root.DemonFusion = DemonFusion;
  }
})(typeof window !== 'undefined' ? window : this);
