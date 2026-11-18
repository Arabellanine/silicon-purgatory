/* ============================================================================
 * archon.js — Silicon Purgatory :: Tier 4 Abyssal Archon Module
 * Zero-dependency, self-contained ES6 module. Exposes window.ArchonModule.
 * Implements Tier 4 endgame Archons: Malphas Prime & Decarabia Void-Watcher
 * with unique Press Turn AI, despair telegraphs, Phase 2 Overdrive Enrage,
 * and relic drops.
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
      baseActionsPerTurn: 3,
      overdriveActionsPerTurn: 4,
      col: '#ff0055',
      col2: '#3a0014',
      glow: '#ff3377',
      horns: true,
      isBoss: true,
      isArchon: true,
      baseResistances: {
        kinetic: 'resist',
        volt: 'null',
        thermal: 'weak',
        cryo: 'neutral',
        void: 'reflect'
      },
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
        { id: 'core_meltdown_fire', name: 'CORE MELTDOWN', cost: 100, power: 140, element: 'void', aoe: true },
        { id: 'overclock_purge', name: 'SYSTEM PURGE // APOCALYPSE SPIKE', cost: 75, power: 110, element: 'volt', aoe: true, stripsBuffs: true, overdriveOnly: true }
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
      baseActionsPerTurn: 3,
      overdriveActionsPerTurn: 4,
      col: '#9d00ff',
      col2: '#20003a',
      glow: '#d066ff',
      horns: false,
      isBoss: true,
      isArchon: true,
      baseResistances: {
        kinetic: 'weak',
        volt: 'resist',
        thermal: 'reflect',
        cryo: 'null',
        void: 'resist'
      },
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
        { id: 'entropy_drain', name: 'ENTROPY DRAIN', cost: 20, power: 40, element: 'void', lifesteal: 0.5 },
        { id: 'singularity_collapse', name: 'SINGULARITY COLLAPSE', cost: 80, power: 120, element: 'void', aoe: true, spDrainRate: 0.15, overdriveOnly: true }
      ],
      relicDrops: [
        { id: 'relic_watcher_omniscience', name: "Watcher's Omniscience", type: 'relic', desc: 'Reveals full enemy HP, elemental vulnerabilities, and action order.' },
        { id: 'mat_pentagram_fragment', name: 'Abyssal Pentagram Fragment', type: 'material', desc: 'Essential synthesis reagent for Demi-Fiend Transcendent Core.' }
      ]
    }
  };

  function checkEnrageState(archon) {
    if (!archon || !archon.isArchon) return false;
    archon.state = archon.state || { charging: false, turnCount: 0, enraged: false };

    var hpRatio = archon.hp / archon.maxHp;
    if (hpRatio <= 0.35 && !archon.state.enraged) {
      archon.state.enraged = true;
      archon.actionsPerTurn = archon.overdriveActionsPerTurn || 4;

      if (archon.id === 'malphas_prime') {
        archon.glow = '#ffffff';
        archon.col = '#ff0033';
        archon.resistances = {
          kinetic: 'reflect',
          volt: 'null',
          thermal: 'null', // vents seal under critical heat
          cryo: 'neutral',
          void: 'reflect'
        };
        return {
          enraged: true,
          archon: archon.name,
          title: 'OVERCLOCK MELTDOWN ACTIVATED',
          desc: 'Vents seal: Thermal weakness nullified! Kinetic attacks reflect! Actions increased to 4!'
        };
      }

      if (archon.id === 'decarabia_void') {
        archon.glow = '#ff00a0';
        archon.col = '#0a0014';
        archon.resistances = {
          kinetic: 'neutral',
          volt: 'resist',
          thermal: 'reflect',
          cryo: 'null',
          void: 'absorb' // consumes entropy void attacks
        };
        return {
          enraged: true,
          archon: archon.name,
          title: 'ABYSSAL SUPERNOVA COLLAPSE',
          desc: 'Kinetic weakness hardened! Void attacks absorbed! Actions increased to 4!'
        };
      }
    }
    return false;
  }

  function decideArchonAction(archon, partyState) {
    archon.state = archon.state || { charging: false, turnCount: 0, enraged: false };
    archon.state.turnCount++;

    // Check dynamic phase 2 transition
    var enrageEvent = checkEnrageState(archon);

    if (archon.id === 'malphas_prime') {
      if (archon.state.charging) {
        archon.state.charging = false;
        return { skill: archon.skills[4], note: 'UNLEASHING CORE MELTDOWN CATASTROPHE', enrageEvent: enrageEvent };
      }

      // Overdrive Phase 2 Enrage AI
      if (archon.state.enraged) {
        if (archon.state.turnCount % 3 === 0) {
          archon.state.charging = true;
          return { skill: archon.skills[3], note: 'OVERCLOCK MELTDOWN: RAPID-CHARGING CORE MELTDOWN...', enrageEvent: enrageEvent };
        }
        if (partyState && partyState.buffCount && partyState.buffCount >= 1 && Math.random() < 0.5) {
          return { skill: archon.skills[5] || archon.skills[2], note: 'OVERCLOCK PURGE — ANNIHILATING ENEMY DEFENSES', enrageEvent: enrageEvent };
        }
        if (Math.random() < 0.45) {
          return { skill: archon.skills[5] || archon.skills[1], note: 'SYSTEM PURGE // APOCALYPSE SPIKE CRUSH', enrageEvent: enrageEvent };
        }
        return { skill: archon.skills[1], note: 'HYPER-DISCHARGING SUBNET OVERCHARGE', enrageEvent: enrageEvent };
      }

      // Phase 1 Standard AI
      if (archon.hp < archon.maxHp * 0.50 && archon.state.turnCount % 4 === 0) {
        archon.state.charging = true;
        return { skill: archon.skills[3], note: 'CRITICAL OVERHEAT: CHARGING CORE MELTDOWN...', enrageEvent: enrageEvent };
      }
      if (partyState && partyState.buffCount && partyState.buffCount >= 2 && Math.random() < 0.6) {
        return { skill: archon.skills[2], note: 'FIRMWARE LOCKDOWN — RESETTING ENEMY BUFFS', enrageEvent: enrageEvent };
      }
      if (archon.state.turnCount % 2 === 0) {
        return { skill: archon.skills[1], note: 'DISCHARGING SUBNET OVERCHARGE', enrageEvent: enrageEvent };
      }
      return { skill: archon.skills[0], note: 'SLICING THROUGH WITH CIRCUIT CLEAVE', enrageEvent: enrageEvent };
    }

    if (archon.id === 'decarabia_void') {
      // Overdrive Phase 2 Enrage AI
      if (archon.state.enraged) {
        if (archon.state.turnCount % 2 === 0) {
          return { skill: archon.skills[3] || archon.skills[1], note: 'SUPERNOVA: SINGULARITY COLLAPSE CRUSHING THE VESSEL', enrageEvent: enrageEvent };
        }
        return { skill: archon.skills[2], note: 'VAMIPRIC SUPERNOVA: ENTROPY DRAIN SIPHON', enrageEvent: enrageEvent };
      }

      // Phase 1 Standard AI
      if (archon.hp < archon.maxHp * 0.5 && Math.random() < 0.4) {
        return { skill: archon.skills[2], note: 'SIPHONING ESSENCE WITH ENTROPY DRAIN', enrageEvent: enrageEvent };
      }
      if (archon.state.turnCount % 3 === 0) {
        return { skill: archon.skills[1], note: 'INCINERATING FORMATIONS WITH PENTAGRAM FLARE', enrageEvent: enrageEvent };
      }
      return { skill: archon.skills[0], note: 'FIXING GAZE: PETRIFYING STARE', enrageEvent: enrageEvent };
    }

    return { skill: archon.skills[0], note: 'ATTACKING', enrageEvent: enrageEvent };
  }

  var ArchonModule = {
    ARCHONS: ARCHONS,
    checkEnrageState: checkEnrageState,
    decideArchonAction: decideArchonAction
  };

  root.ArchonModule = ArchonModule;
})(typeof window !== 'undefined' ? window : globalThis);
