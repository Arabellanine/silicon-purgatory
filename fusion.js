/*
 * fusion.js — Silicon Purgatory demon fusion engine
 * Zero-dependency ES5/ES6 module. Exposes window.DemonFusion (+ CommonJS).
 *
 * Fusing two distinct demons yields a higher-tier entity. Fusing a demon
 * with itself overclocks it. Unknown pairings fall back to a stat-averaged
 * hybrid so the engine never returns null for two valid parents.
 *
 * Tier 3 recipe synthesis, Tier 4 Transcendent Archons, & Tier 5 Apex Spire Demiurge recipes.
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
   * Fusion templates (Tier 2-5).
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
    },
    archon_prime: {
      id: 'archon_prime', name: 'ARCHON PRIME', tier: 3,
      hp: 240, sp: 110, atk: 54, col: '#eab308', col2: '#713f12', glow: '#fef08a',
      horns: true, aff: aff('res', 'res', 'res', 'res', 'nul'),
      skills: ['void', 'volt', 'thermal'], inheritedSkill: 'void',
      lore: 'Forged under the Archon Cipher Key. Master of all tactical cycles.'
    },

    /* Tier 4 Transcendent Archons (Requires Archon Relic Catalysts) */
    malphas_prime: {
      id: 'malphas_prime', name: 'MALPHAS PRIME', tier: 4,
      hp: 320, sp: 140, atk: 68, col: '#f59e0b', col2: '#78350f', glow: '#fbbf24',
      horns: true, aff: aff('res', 'weak', 'normal', 'nul', 'drain'),
      skills: ['kinetic', 'volt', 'void'], inheritedSkill: 'volt',
      catalyst: 'relic_broken_gate',
      catalystName: 'Sigil of the Broken Gate',
      lore: 'Gate Sovereign of the Broken Circuit. Wields shattered leyline frequencies.'
    },
    decarabia_watcher: {
      id: 'decarabia_watcher', name: 'DECARABIA WATCHER', tier: 4,
      hp: 340, sp: 160, atk: 64, col: '#8b5cf6', col2: '#4c1d95', glow: '#a78bfa',
      horns: false, aff: aff('weak', 'drain', 'nul', 'res', 'res'),
      skills: ['void', 'thermal', 'cryo'], inheritedSkill: 'void',
      catalyst: 'relic_watcher_omniscience',
      catalystName: "Watcher's Omniscience",
      lore: 'Ocular Archon of Entropy. Strips away all cognitive obscurity.'
    },
    ouroboros_demiurge: {
      id: 'ouroboros_demiurge', name: 'OUROBOROS DEMIURGE', tier: 4,
      hp: 420, sp: 200, atk: 78, col: '#10b981', col2: '#064e3b', glow: '#34d399',
      horns: true, aff: aff('res', 'nul', 'nul', 'nul', 'drain'),
      skills: ['void', 'volt', 'thermal', 'kinetic'], inheritedSkill: 'void',
      catalyst: 'relic_abyssal_unification',
      catalystName: 'Abyssal Unification (Both Archon Relics)',
      lore: 'The apex synthesis of Circuit Gate and Astral Eye. Sovereign of infinite cycles.'
    },

    /* Tier 5 Apex Spire Demiurges (Requires Abyssal Spire Core Relics) */
    chronos_devourer: {
      id: 'chronos_devourer', name: 'CHRONOS VOID-DEVOURER', tier: 5,
      hp: 540, sp: 260, atk: 92, col: '#38bdf8', col2: '#0369a1', glow: '#7dd3fc',
      horns: true, aff: aff('res', 'drain', 'drain', 'nul', 'drain'),
      skills: ['void', 'cryo', 'volt', 'kinetic'], inheritedSkill: 'void',
      catalyst: 'relic_spire_singularity',
      catalystName: 'Abyssal Singularity Core (Spire Depth +5)',
      lore: 'An eternal chronometric sovereign forged from Spire temporal distortions. Devours cognitive cycles.'
    },
    apocalypse_architect: {
      id: 'apocalypse_architect', name: 'APOCALYPSE ARCHITECT', tier: 5,
      hp: 640, sp: 320, atk: 108, col: '#f43f5e', col2: '#881337', glow: '#fb7185',
      horns: true, aff: aff('drain', 'drain', 'res', 'drain', 'nul'),
      skills: ['void', 'thermal', 'volt', 'kinetic'], inheritedSkill: 'void',
      catalyst: 'relic_apocalypse_matrix',
      catalystName: 'Apocalypse Overdrive Matrix (Spire Depth +10)',
      lore: 'The supreme architect of cognitive collapse. Weaves entropic cataclysms across infinite depths.'
    }
  };

  /* ------------------------------------------------------------------ *
   * Recipe table. Keys are the two parent ids joined sorted ("a+b").
   * ------------------------------------------------------------------ */
  function key(a, b) { return [a, b].sort().join('+'); }

  var RECIPES = {};
  RECIPES[key('pyroclocker', 'cryodrifter')]     = 'frostfire_golem';
  RECIPES[key('pyroclocker', 'sparkharvester')]  = 'plasma_archon';
  RECIPES[key('sentinel', 'sparkharvester')]     = 'storm_sentinel';
  RECIPES[key('sentinel', 'pyroclocker')]        = 'dread_chariot';
  RECIPES[key('sentinel', 'cryodrifter')]        = 'glacier_sentinel';
  RECIPES[key('sparkharvester', 'cryodrifter')]  = 'void_archon';
  RECIPES[key('coreinquisitor', 'plasma_archon')]   = 'archon_prime';
  RECIPES[key('coreinquisitor', 'frostfire_golem')]  = 'archon_prime';

  /* Tier 4 Transcendent Archon Recipes */
  RECIPES[key('archon_prime', 'storm_sentinel')]     = 'malphas_prime';
  RECIPES[key('archon_prime', 'dread_chariot')]      = 'malphas_prime';
  RECIPES[key('void_archon', 'frostfire_golem')]     = 'decarabia_watcher';
  RECIPES[key('void_archon', 'glacier_sentinel')]    = 'decarabia_watcher';
  RECIPES[key('archon_prime', 'void_archon')]        = 'ouroboros_demiurge';
  RECIPES[key('malphas_prime', 'decarabia_watcher')] = 'ouroboros_demiurge';

  /* Tier 5 Apex Spire Recipes */
  RECIPES[key('ouroboros_demiurge', 'void_archon')]      = 'chronos_devourer';
  RECIPES[key('ouroboros_demiurge', 'archon_prime')]     = 'chronos_devourer';
  RECIPES[key('ouroboros_demiurge', 'malphas_prime')]     = 'apocalypse_architect';
  RECIPES[key('ouroboros_demiurge', 'decarabia_watcher')]  = 'apocalypse_architect';
  RECIPES[key('chronos_devourer', 'ouroboros_demiurge')]   = 'apocalypse_architect';

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

  /* Audio-visual polish on chamber unlock / Archon synthesis */
  function playUnlockFX(tier) {
    try {
      if (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) {
        var AudioCtx = window.AudioContext || window.webkitAudioContext;
        var ctx = new AudioCtx();
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        var isTier5 = (tier || 3) >= 5;
        var isTier4 = (tier || 3) === 4;
        osc.type = isTier5 ? 'sawtooth' : (isTier4 ? 'sine' : 'triangle');
        var baseFreq = isTier5 ? 440.00 : (isTier4 ? 329.63 : 261.63); // A4, E4, or C4
        osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 2, ctx.currentTime + 0.2);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * (isTier5 ? 6 : 4), ctx.currentTime + 0.4);
        gain.gain.setValueAtTime(isTier5 ? 0.22 : 0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (isTier5 ? 0.7 : 0.5));
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + (isTier5 ? 0.75 : 0.55));
      }
    } catch (e) {}

    try {
      if (typeof document !== 'undefined') {
        var el = document.getElementById('fusion-modal') || document.querySelector('.fusion-panel') || document.body;
        if (el) {
          el.style.transition = 'box-shadow 0.4s ease, border-color 0.4s ease';
          var isT5 = (tier || 3) >= 5;
          var isT4 = (tier || 3) === 4;
          el.style.borderColor = isT5 ? '#f43f5e' : (isT4 ? '#10b981' : '#eab308');
          el.style.boxShadow = isT5 ? '0 0 55px rgba(244, 63, 94, 0.9)' : (isT4 ? '0 0 45px rgba(16, 185, 129, 0.8)' : '0 0 35px rgba(234, 179, 8, 0.6)');
          setTimeout(function () {
            el.style.boxShadow = '';
            el.style.borderColor = '';
          }, 1400);
        }
      }
    } catch (e) {}
  }

  function hasCipherKey() {
    try {
      if (typeof window !== 'undefined') {
        if (window.SiliconProgression && typeof window.SiliconProgression.hasCipherKey === 'function') {
          return !!window.SiliconProgression.hasCipherKey();
        }
        if (window.SiliconRewards && typeof window.SiliconRewards.hasCipherKey === 'function') {
          return !!window.SiliconRewards.hasCipherKey();
        }
        if (typeof localStorage !== 'undefined') {
          return localStorage.getItem('sp_archon_cipher_key') === 'true';
        }
      }
    } catch (e) {}
    return false;
  }

  function hasRelic(relicId) {
    try {
      if (typeof window !== 'undefined') {
        if (window.SiliconProgression && typeof window.SiliconProgression.hasRelic === 'function') {
          return !!window.SiliconProgression.hasRelic(relicId);
        }
        var raw = localStorage.getItem('silicon_purgatory_progression');
        if (raw) {
          var p = JSON.parse(raw);
          if (p.inventory && p.inventory.indexOf(relicId) !== -1) return true;
          if (p.activeRelics && p.activeRelics.indexOf(relicId) !== -1) return true;
          if (p.spireRelics && p.spireRelics.indexOf(relicId) !== -1) return true;
        }
        if (localStorage.getItem('sp_' + relicId) === 'true') return true;
      }
    } catch (e) {}
    return false;
  }

  /* ------------------------------------------------------------------ *
   * Public API
   * ------------------------------------------------------------------ */
  function canFuse(a, b) {
    return isValid(a) && isValid(b);
  }

  function preview(a, b) {
    if (!canFuse(a, b)) return null;
    var res = resolveFusion(resolve(a), resolve(b));
    if (!res) return null;
    
    var hasKey = hasCipherKey();
    var maxTier = 2;
    if (typeof window !== 'undefined') {
      if (window.SiliconProgression && typeof window.SiliconProgression.unlockedTier === 'function') {
        maxTier = window.SiliconProgression.unlockedTier();
      } else if (window.SiliconRewards && typeof window.SiliconRewards.unlockedTier === 'function') {
        maxTier = window.SiliconRewards.unlockedTier();
      }
    }
    
    if ((res.tier || 1) >= 5) {
      var cat5 = res.catalyst;
      var cat5Unlocked = cat5 ? hasRelic(cat5) : false;
      if (!cat5Unlocked) {
        res.isLocked = true;
        res.lockReason = 'REQUIRES SPIRE CORE CATALYST: ' + (res.catalystName || 'ABYSSAL SPIRE CORE (FLOOR 15+)').toUpperCase();
      } else {
        res.isLocked = false;
        res.tierUnlockedBadge = 'TIER 5 APEX DEMIURGE SYNTHESIS ACTIVE';
      }
    } else if ((res.tier || 1) >= 4) {
      var cat = res.catalyst;
      var catUnlocked = false;
      if (cat === 'relic_abyssal_unification') {
        catUnlocked = hasRelic('relic_broken_gate') && hasRelic('relic_watcher_omniscience');
      } else if (cat) {
        catUnlocked = hasRelic(cat);
      }
      
      if (!catUnlocked) {
        res.isLocked = true;
        res.lockReason = 'REQUIRES RELIC CATALYST: ' + (res.catalystName || 'ARCHON RELIC (FOUND ON FLOOR 10+)').toUpperCase();
      } else {
        res.isLocked = false;
        res.tierUnlockedBadge = 'TIER 4 TRANSCENDENT ARCHON SYNTHESIS ACTIVE';
      }
    } else if ((res.tier || 1) >= 3) {
      if (!hasKey && (res.tier || 1) > maxTier) {
        res.isLocked = true;
        res.lockReason = 'REQUIRES ARCHON CIPHER KEY (FOUND IN BOSS SANCTUM)';
      } else {
        res.isLocked = false;
        res.tierUnlockedBadge = 'TIER 3 ARCHON SYNTHESIS ACTIVE';
      }
    } else {
      res.isLocked = false;
    }
    return res;
  }

  function fuse(a, b) {
    if (!canFuse(a, b)) return null;
    var prev = preview(a, b);
    if (prev && prev.isLocked) {
      return null;
    }
    var result = clone(resolveFusion(resolve(a), resolve(b)));
    if ((result.tier || 1) >= 3) {
      playUnlockFX(result.tier);
    }
    return result;
  }

  var DemonFusion = {
    BASE_DB: BASE_DB,
    FUSED_DB: FUSED_DB,
    RECIPES: RECIPES,
    ELEMENTS: ELEMENTS,
    canFuse: canFuse,
    preview: preview,
    fuse: fuse,
    hasCipherKey: hasCipherKey,
    hasRelic: hasRelic,
    playUnlockFX: playUnlockFX
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = DemonFusion;
  if (root) root.DemonFusion = DemonFusion;

})(typeof window !== 'undefined' ? window : this);
