/* ============================================================================
 * abyss_modifiers.js — Silicon Purgatory :: Abyssal Leyline Modifiers Module
 * Zero-dependency, self-contained ES6 module. Exposes window.AbyssModifiers.
 * Implements environmental leyline hazards, seed hashing, and combat hooks.
 * ============================================================================ */
(function (root) {
  'use strict';

  function hashSeed(s) {
    if (typeof s === 'number') return s >>> 0;
    var str = String(s || 'silicon-abyss');
    var h = 1779033703 ^ str.length;
    for (var i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    return (h ^ (h >>> 16)) >>> 0;
  }

  var MODIFIERS = [
    {
      id: 'MOD_CORRUPT_LEY',
      name: 'CORRUPTED LEYLINES',
      badge: 'LEYLINE HAZARD',
      color: '#ff2a5f',
      bg: 'rgba(255, 42, 95, 0.12)',
      desc: 'Tech & Plasma skills cost +50% FLUX. Non-weakness skill hits inflict 15% shock backfire.',
      fluxCostMultiplier: function (element) {
        return (element === 'volt' || element === 'plasma' || element === 'tech') ? 1.5 : 1.0;
      },
      onHit: function (target, element, isWeakness, damage) {
        if (!isWeakness && (element === 'volt' || element === 'plasma' || element === 'tech')) {
          return { backfireDmg: Math.max(1, Math.round(damage * 0.15)), note: 'LEYLINE BACKFIRE SHOCK' };
        }
        return null;
      }
    },
    {
      id: 'MOD_SENSORY_DAMP',
      name: 'SENSORY DAMPENING',
      badge: 'RADAR OBSCURED',
      color: '#00e5ff',
      bg: 'rgba(0, 229, 255, 0.10)',
      desc: 'Critical strike rate halved (-50%). Enemy ambush chance on floor encounter increased to 40%.',
      critMultiplier: 0.5,
      ambushChance: 0.40
    },
    {
      id: 'MOD_THERMAL_SURGE',
      name: 'THERMAL SURGE',
      badge: 'SURGE VOLATILITY',
      color: '#ff7700',
      bg: 'rgba(255, 119, 0, 0.12)',
      desc: 'Thermal/Fire damage boosted +35% for all units. Turn ending without dealing damage burns 8% max HP.',
      dmgMultiplier: function (element) {
        return (element === 'thermal' || element === 'fire') ? 1.35 : 1.0;
      },
      idleTurnBurn: 0.08
    },
    {
      id: 'MOD_CRYO_STASIS',
      name: 'CRYO STASIS FIELD',
      badge: 'STASIS MATRIX',
      color: '#39ff14',
      bg: 'rgba(57, 255, 20, 0.10)',
      desc: 'Turn order scrambled dynamically. Frost & Cryo ailments inflict 2-turn freeze locks.',
      scrambleOrder: true,
      freezeDuration: 2
    },
    {
      id: 'MOD_VOID_LEAK',
      name: 'ASTRAL VOID LEAK',
      badge: 'ENTROPY GRAVITY',
      color: '#bd00ff',
      bg: 'rgba(189, 0, 255, 0.12)',
      desc: 'Passing a turn consumes 1 full Press Turn icon instead of converting to a flashing half-turn.',
      passTurnFullConsume: true
    }
  ];

  function getFloorModifier(runSeed, floorNumber) {
    if (floorNumber < 5) return null;
    var seedNum = hashSeed(String(runSeed) + ':' + floorNumber);
    var index = seedNum % MODIFIERS.length;
    var primary = MODIFIERS[index];

    if (floorNumber >= 10) {
      var secIndex = (seedNum >>> 8) % MODIFIERS.length;
      if (secIndex === index) secIndex = (index + 1) % MODIFIERS.length;
      return {
        isDual: true,
        primary: primary,
        secondary: MODIFIERS[secIndex],
        id: primary.id + '+' + MODIFIERS[secIndex].id,
        name: primary.name + ' // ' + MODIFIERS[secIndex].name,
        color: primary.color,
        badge: primary.badge + ' + ' + MODIFIERS[secIndex].badge,
        desc: primary.desc + ' | ' + MODIFIERS[secIndex].desc
      };
    }

    return primary;
  }

  var AbyssModifiers = {
    MODIFIERS: MODIFIERS,
    getFloorModifier: getFloorModifier,
    hashSeed: hashSeed
  };

  root.AbyssModifiers = AbyssModifiers;
})(typeof window !== 'undefined' ? window : globalThis);
