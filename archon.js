/* ============================================================================
 * archon.js — Silicon Purgatory :: Tier 4 Abyssal Archon Module
 * Zero-dependency, self-contained ES6 module. Exposes window.ArchonModule.
 * Implements Tier 4 endgame Archons: Malphas Prime & Decarabia Void-Watcher
 * with unique Press Turn AI, despair telegraphs, and relic drops.
 * ============================================================================ */
(function (root) {
  'use strict';

  var ARCHONS = {
    malphas_prime: {
      id: 'malphas_prime',
      name: 'MALPHAS PRIME',
      title: 'GATE SOVEREIGN // BROKEN CIRCUIT',
      tier: 4,
      hp: 8400,
      maxHp: 8400,
      sp: 1200,
      maxSp: 1200,
      atk: 48,
      def: 28,
      actionsPerTurn: 3,
      col: '#ff0055',
      col2: '#3a0014',
      glow: '#ff3377',
      horns: true,
      isBoss: true,
      isArchon: true,
      resistances: {
        kinetic: 'resist',
        volt: 'null',
        thermal: 'weak',
        cryo: 'neutral',
        void: 'reflect'
      },
      skills: [
        { id: 'circuit_cleave', name: 'CIRCUIT CLEAVE', cost: 0, power: 45, element: 'kinetic', fluxDrain: 0.15 },
        { id: 'subnet_overcharge', name: 'SUBNET OVERCHARGE', cost: 45, power: 65, element: 'volt', aoe: true, shockChance: 0.3 },
        { id: 'firmware_lockdown', name: 'FIRMWARE LOCKDOWN', cost: 30, power: 0, element: 'void', resetsBuffs: true },
        { id: 'core_meltdown_charge', name: 'CHARGE CORE MELTDOWN', cost: 60, power: 0, element: 'void', telegraph: true },
        { id: 'core_meltdown_fire', name: 'CORE MELTDOWN', cost: 100, power: 140, element: 'void', aoe: true }
      ],
      relicDrops: [
        { id: 'relic_broken_gate', name: 'Sigil of the Broken Gate', type: 'relic', desc: 'Nullifies ambush; +1 bonus Press Turn icon on advantage initiative.' },
        { id: 'mat_circuit_matrix', name: 'Circuit Matrix Core', type: 'material', desc: 'Unlocks Tier 4 Archon demon chassis synthesis in Fusion Chamber.' }
      ]
    },
    decarabia_void: {
      id: 'decarabia_void',
      name: 'DECARABIA VOID-WATCHER',
      title: 'OCULAR ARCHON // ENTROPY STAR',
      tier: 4,
      hp: 9200,
      maxHp: 9200,
      sp: 1800,
      maxSp: 1800,
      atk: 42,
      def: 32,
      actionsPerTurn: 3,
      col: '#9d00ff',
      col2: '#20003a',
      glow: '#d066ff',
      horns: false,
      isBoss: true,
      isArchon: true,
      resistances: {
        kinetic: 'weak',
        volt: 'resist',
        thermal: 'reflect',
        cryo: 'null',
        void: 'resist'
      },
      skills: [
        { id: 'petrifying_stare', name: 'PETRIFYING STARE', cost: 35, power: 30, element: 'void', petrifyChance: 0.45 },
        { id: 'pentagram_flare', name: 'PENTAGRAM FLARE', cost: 55, power: 75, element: 'thermal', aoe: true, eatsTurnIcon: true },
        { id: 'entropy_drain', name: 'ENTROPY DRAIN', cost: 20, power: 40, element: 'void', lifesteal: 0.5 }
      ],
      relicDrops: [
        { id: 'relic_watcher_omniscience', name: "Watcher's Omniscience", type: 'relic', desc: 'Reveals full enemy HP, elemental vulnerabilities, and action order.' },
        { id: 'mat_pentagram_fragment', name: 'Abyssal Pentagram Fragment', type: 'material', desc: 'Essential synthesis reagent for Demi-Fiend Transcendent Core.' }
      ]
    }
  };

  function decideArchonAction(archon, partyState) {
    archon.state = archon.state || { charging: false, turnCount: 0 };
    archon.state.turnCount++;

    if (archon.id === 'malphas_prime') {
      if (archon.state.charging) {
        archon.state.charging = false;
        return { skill: archon.skills[4], note: 'UNLEASHING CORE MELTDOWN CATASTROPHE' };
      }
      if (archon.hp < archon.maxHp * 0.30 && archon.state.turnCount % 4 === 0) {
        archon.state.charging = true;
        return { skill: archon.skills[3], note: 'CRITICAL OVERHEAT: CHARGING CORE MELTDOWN...' };
      }
      if (partyState && partyState.buffCount && partyState.buffCount >= 2 && Math.random() < 0.6) {
        return { skill: archon.skills[2], note: 'FIRMWARE LOCKDOWN — RESETTING ENEMY BUFFS' };
      }
      if (archon.state.turnCount % 2 === 0) {
        return { skill: archon.skills[1], note: 'DISCHARGING SUBNET OVERCHARGE' };
      }
      return { skill: archon.skills[0], note: 'SLICING THROUGH WITH CIRCUIT CLEAVE' };
    }

    if (archon.id === 'decarabia_void') {
      if (archon.hp < archon.maxHp * 0.5 && Math.random() < 0.4) {
        return { skill: archon.skills[2], note: 'SIPHONING ESSENCE WITH ENTROPY DRAIN' };
      }
      if (archon.state.turnCount % 3 === 0) {
        return { skill: archon.skills[1], note: 'INCINERATING FORMATIONS WITH PENTAGRAM FLARE' };
      }
      return { skill: archon.skills[0], note: 'FIXING GAZE: PETRIFYING STARE' };
    }

    return { skill: archon.skills[0], note: 'ATTACKING' };
  }

  var ArchonModule = {
    ARCHONS: ARCHONS,
    decideArchonAction: decideArchonAction
  };

  root.ArchonModule = ArchonModule;
})(typeof window !== 'undefined' ? window : globalThis);
