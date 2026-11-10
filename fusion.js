/*
 * fusion.js — Silicon Purgatory demon fusion engine
 * Zero-dependency ES5/ES6 module. Exposes window.DemonFusion (+ CommonJS).
 *
 * Fusing two distinct demons yields a higher-tier entity. Fusing a demon
 * with itself overclocks it. Unknown pairings fall back to a stat-averaged
 * hybrid so the engine never returns null for two valid parents.
 */
(function (root) {
  'use strict';

  /* ------------------------------------------------------------------ *
   * Affinity helpers
   * Levels, worst -> best. Combining takes the better of two parents,
   * which naturally cancels/resolves a weakness covered by the other.
   * ------------------------------------------------------------------ */
  var AFF_RANK = { weak: -1, normal: 0, res: 1, resist: 1, nul: 2, immune: 2, drain: 3, absorb: 3 };
  var AFF_NAME = ['weak', 'normal', 'res', 'nul', 'drain']; // index = rank+1
  var ELEMENTS = ['kinetic', 'thermal', 'cryo', 'volt', 'void'];

  function affName(rank) { return AFF_NAME[rank + 1] || 'normal'; }

  // Merge two affinity maps, keeping the stronger defense per element.
  function combineAff(a, b) {
    var out = {}, i, el, ra, rb;
    for (i = 0; i < ELEMENTS.length; i++) {
      el = ELEMENTS[i];
      ra = AFF_RANK[(a && a[el]) || 'normal'];
      rb = AFF_RANK[(b && b[el]) || 'normal'];
      out[el] = affName(Math.max(ra, rb));
    }
    return out;
  }

  function aff(kin, thm, cry, vol, voi) {
    return { kinetic: kin, thermal: thm, cryo: cry, volt: vol, void: voi };
  }

  function clone(obj) {
    var out = {}, k;
    for (k in obj) if (obj.hasOwnProperty(k)) {
      var v = obj[k];
      out[k] = (v && typeof v === 'object') ? clone(v) : v;
    }
    return out;
  }

  /* ------------------------------------------------------------------ *
   * Base roster (Tier 1-2). Also used to resolve string ids to objects.
   * ------------------------------------------------------------------ */
  var BASE_DB = {
    sentinel: {
      id: 'sentinel', name: 'DAEMON SENTINEL', tier: 1,
      hp: 120, sp: 40, atk: 16, col: '#ff2b44', col2: '#7a0f1c', glow: '#ff6b7e',
      horns: true, aff: aff('res', 'normal', 'weak', 'normal', 'nul'),
      skills: ['kinetic', 'kinetic', 'void'], inheritedSkill: 'void',
      lore: 'A warden process compiled to outlast the siege.'
    },
    pyroclocker: {
      id: 'pyroclocker', name: 'PYRO CLOCKER', tier: 1,
      hp: 90, sp: 60, atk: 14, col: '#f59e0b', col2: '#7a3d00', glow: '#ffd27a',
      horns: false, aff: aff('normal', 'drain', 'weak', 'res', 'normal'),
      skills: ['thermal', 'thermal', 'kinetic'], inheritedSkill: 'thermal',
      lore: 'Overclocks its own cores until the air itself ignites.'
    },
    cryodrifter: {
      id: 'cryodrifter', name: 'CRYO DRIFTER', tier: 1,
      hp: 110, sp: 50, atk: 15, col: '#38bdf8', col2: '#0c4a6e', glow: '#bae6fd',
      horns: true, aff: aff('res', 'weak', 'drain', 'normal', 'normal'),
      skills: ['cryo', 'cryo', 'kinetic'], inheritedSkill: 'cryo',
      lore: 'A heat-sink spirit that drifts through frozen memory.'
    },
    sparkharvester: {
      id: 'sparkharvester', name: 'SPARK HARVESTER', tier: 1,
      hp: 70, sp: 80, atk: 13, col: '#fde047', col2: '#854d0e', glow: '#fff7c2',
      horns: false, aff: aff('normal', 'normal', 'res', 'drain', 'weak'),
      skills: ['volt', 'volt', 'volt'], inheritedSkill: 'volt',
      lore: 'Reaps the voltage of dying machines to feed its charge.'
    },
    coreinquisitor: {
      id: 'coreinquisitor', name: 'CORE INQUISITOR', tier: 2,
      hp: 140, sp: 70, atk: 18, col: '#a855f7', col2: '#3b0764', glow: '#e9d5ff',
      horns: true, aff: aff('res', 'res', 'res', 'weak', 'nul'),
      skills: ['void', 'void', 'kinetic'], inheritedSkill: 'void',
      lore: 'It audits souls for corruption and finds all of them guilty.'
    }
  };

  /* ------------------------------------------------------------------ *
   * Fusion templates (Tier 2-3).
   * ------------------------------------------------------------------ */
  var FUSED_DB = {
    frostfire_golem: {
      id: 'frostfire_golem', name: 'FROSTFIRE GOLEM', tier: 2,
      hp: 160, sp: 55, atk: 32, col: '#ec4899', col2: '#831843', glow: '#f472b6',
      horns: true, aff: aff('normal', 'drain', 'drain', 'normal', 'normal'),
      skills: ['thermal', 'cryo', 'kinetic'], inheritedSkill: 'thermal',
      lore: 'Twin cores of fire and ice locked in eternal thermal war.'
    },
    plasma_archon: {
      id: 'plasma_archon', name: 'PLASMA ARCHON', tier: 2,
      hp: 120, sp: 70, atk: 40, col: '#f97316', col2: '#7c2d12', glow: '#fb923c',
      horns: true, aff: aff('normal', 'drain', 'weak', 'drain', 'normal'),
      skills: ['thermal', 'volt', 'kinetic'], inheritedSkill: 'volt',
      lore: 'Heat and charge annihilate into a sovereign blade of plasma.'
    },
    storm_sentinel: {
      id: 'storm_sentinel', name: 'STORM SENTINEL', tier: 2,
      hp: 145, sp: 60, atk: 34, col: '#06b6d4', col2: '#164e63', glow: '#67e8f9',
      horns: false, aff: aff('res', 'normal', 'normal', 'drain', 'res'),
      skills: ['kinetic', 'volt', 'kinetic'], inheritedSkill: 'volt',
      lore: 'A fortress that answers every blow with a crack of lightning.'
    },
    dread_chariot: {
      id: 'dread_chariot', name: 'DREAD CHARIOT', tier: 2,
      hp: 150, sp: 45, atk: 38, col: '#e11d48', col2: '#4c0519', glow: '#fb7185',
      horns: true, aff: aff('res', 'drain', 'weak', 'normal', 'res'),
      skills: ['kinetic', 'thermal', 'kinetic'], inheritedSkill: 'thermal',
      lore: 'An engine of war that rolls over the damned on burning treads.'
    },
    glacier_sentinel: {
      id: 'glacier_sentinel', name: 'GLACIER SENTINEL', tier: 2,
      hp: 165, sp: 50, atk: 30, col: '#0284c7', col2: '#082f49', glow: '#38bdf8',
      horns: false, aff: aff('res', 'weak', 'drain', 'normal', 'res'),
      skills: ['kinetic', 'cryo', 'kinetic'], inheritedSkill: 'cryo',
      lore: 'An immovable rampart carved from the heart of a dead glacier.'
    },
    void_archon: {
      id: 'void_archon', name: 'VOID ARCHON', tier: 3,
      hp: 200, sp: 90, atk: 48, col: '#9333ea', col2: '#3b0764', glow: '#c084fc',
      horns: true, aff: aff('res', 'res', 'res', 'res', 'drain'),
      skills: ['void', 'kinetic', 'volt'], inheritedSkill: 'void',
      lore: 'Where it walks, the code of the world quietly ceases to exist.'
    }
  };

  /* ------------------------------------------------------------------ *
   * Recipe table. Keys are the two parent ids joined sorted ("a+b").
   * ------------------------------------------------------------------ */
  function key(a, b) { return [a, b].sort().join('+'); }

  var RECIPES = {};
  RECIPES[key('pyroclocker', 'cryodrifter')]    = 'frostfire_golem';
  RECIPES[key('pyroclocker', 'sparkharvester')] = 'plasma_archon';
  RECIPES[key('sentinel', 'sparkharvester')]    = 'storm_sentinel';
  RECIPES[key('sentinel', 'pyroclocker')]       = 'dread_chariot';
  RECIPES[key('sentinel', 'cryodrifter')]       = 'glacier_sentinel';
  RECIPES[key('sparkharvester', 'cryodrifter')] = 'void_archon';

  /* ------------------------------------------------------------------ *
   * Internals
   * ------------------------------------------------------------------ */
  function resolve(d) {
    if (typeof d === 'string') return BASE_DB[d] || FUSED_DB[d] || null;
    return (d && typeof d === 'object' && d.id) ? d : null;
  }

  function isValid(d) {
    d = resolve(d);
    return !!(d && typeof d.hp === 'number' && typeof d.tier === 'number');
  }

  function strongerSkill(a, b) {
    return (b.atk > a.atk ? b : a).inheritedSkill || a.inheritedSkill || 'cleave';
  }

  function overclock(d) {
    var up = clone(d);
    up.id = 'overclocked_' + d.id;
    up.name = 'OVERCLOCKED ' + d.name;
    up.tier = (d.tier || 1) + 1;
    up.hp = Math.round(d.hp * 1.25);
    up.sp = Math.round(d.sp * 1.25);
    up.atk = Math.round(d.atk * 1.25);
    up.glow = '#ffffff';
    up.lore = 'Pushed past its thermal limits — ' + d.name + ' runs white-hot.';
    return up;
  }

  function fallback(a, b) {
    var skills = {}, i;
    var all = (a.skills || []).concat(b.skills || []);
    for (i = 0; i < all.length; i++) skills[all[i]] = true;
    return {
      id: 'hybrid_' + [a.id, b.id].sort().join('_'),
      name: 'HYBRID ' + a.name.split(' ')[0] + '-' + b.name.split(' ')[0],
      tier: Math.max(a.tier || 1, b.tier || 1) + 1,
      hp: Math.round((a.hp + b.hp) / 2 * 1.15),
      sp: Math.round((a.sp + b.sp) / 2 * 1.15),
      atk: Math.round((a.atk + b.atk) / 2 * 1.15),
      col: a.col || '#475569', col2: b.col2 || '#1e293b', glow: b.glow || '#94a3b8',
      horns: !!(a.horns || b.horns),
      aff: combineAff(a.aff, b.aff),
      skills: Object.keys(skills),
      inheritedSkill: strongerSkill(a, b),
      lore: 'An amalgam of ' + a.name + ' and ' + b.name + '.'
    };
  }

  function voidArchonMatch(a, b) {
    return (a.id === 'coreinquisitor' && (b.tier || 1) >= 2) ||
           (b.id === 'coreinquisitor' && (a.tier || 1) >= 2);
  }

  function resolveFusion(a, b) {
    if (a.id === b.id) return overclock(a);
    var template = RECIPES[key(a.id, b.id)];
    if (!template && voidArchonMatch(a, b)) template = 'void_archon';
    if (template && FUSED_DB[template]) {
      var out = clone(FUSED_DB[template]);
      out.inheritedSkill = strongerSkill(a, b);
      return out;
    }
    return fallback(a, b);
  }

  /* ------------------------------------------------------------------ *
   * Public API
   * ------------------------------------------------------------------ */
  function canFuse(a, b) {
    return isValid(a) && isValid(b);
  }

  function preview(a, b) {
    if (!canFuse(a, b)) return null;
    return resolveFusion(resolve(a), resolve(b));
  }

  function fuse(a, b) {
    if (!canFuse(a, b)) return null;
    return clone(resolveFusion(resolve(a), resolve(b)));
  }

  var DemonFusion = {
    BASE_DB: BASE_DB,
    FUSED_DB: FUSED_DB,
    RECIPES: RECIPES,
    ELEMENTS: ELEMENTS,
    canFuse: canFuse,
    preview: preview,
    fuse: fuse
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = DemonFusion;
  if (root) root.DemonFusion = DemonFusion;

})(typeof window !== 'undefined' ? window : this);
