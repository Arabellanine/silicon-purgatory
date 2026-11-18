/* ============================================================================
 * archon.js — Silicon Purgatory :: Tier 4 Abyssal Archon Module
 * Zero-dependency, self-contained ES6 module. Exposes window.ArchonModule.
 * Implements Tier 4 endgame Archons: Malphas Prime & Decarabia Void-Watcher
 * with unique Press Turn AI, despair telegraphs, Phase 2 Overdrive Enrage,
 * altered AI targeting matrix, and Leyline Surge battlefield anomalies.
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
      ],
      leylineSurge: {
        id: 'OVERCLOCK_VOLT_SURGE',
        name: 'LEYLINE SURGE // VOLTAGE CASCADE',
        color: '#ff0055',
        fluxMultiplier: 1.5,
        desc: 'Overdrive threshold breached! Leyline grid surges with unshielded voltage. Volt & Kinetic resonance escalated.'
      }
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
      ],
      leylineSurge: {
        id: 'ABYSSAL_ENTROPY_WELL',
        name: 'LEYLINE SURGE // ENTROPY STARFALL',
        color: '#9d00ff',
        fluxMultiplier: 2.0,
        desc: 'Overdrive threshold breached! Singularity opens in leyline bedrock. Void attacks siphoned; party FLUX hemorrhages.'
      }
    }
  };

  function triggerLeylineSurge(archon) {
    if (!archon || !archon.leylineSurge) return null;
    var surge = archon.leylineSurge;

    // Dispatch global event for HUD notification & canvas shaders
    if (typeof root.dispatchEvent === 'function' && typeof root.CustomEvent === 'function') {
      try {
        var evt = new root.CustomEvent('silicon:leyline_surge', {
          detail: {
            archonId: archon.id,
            archonName: archon.name,
            surge: surge
          }
        });
        root.dispatchEvent(evt);
      } catch (e) {
        // Fallback for non-browser runtimes
      }
    }

    // Integrate with LeylineBattleHUD if available
    if (root.LeylineBattleHUD && typeof root.LeylineBattleHUD.registerSurge === 'function') {
      root.LeylineBattleHUD.registerSurge(surge);
    }

    return surge;
  }

  function checkEnrageState(archon) {
    if (!archon || !archon.isArchon) return false;
    archon.state = archon.state || { charging: false, turnCount: 0, enraged: false, surgeActive: false };

    var hpRatio = archon.hp / archon.maxHp;
    if (hpRatio <= 0.35 && !archon.state.enraged) {
      archon.state.enraged = true;
      archon.state.overdriveActive = true;
      archon.actionsPerTurn = archon.overdriveActionsPerTurn || 4;

      var surge = triggerLeylineSurge(archon);
      archon.state.surgeActive = !!surge;

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
          title: 'OVERCLOCK MELTDOWN // PHASE 2 OVERDRIVE',
          desc: 'Thermal weakness sealed! Kinetic attacks reflect! Actions elevated to 4!',
          surge: surge,
          targetPriority: 'LOWEST_INTEGRITY_OR_BUFFED'
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
          title: 'ABYSSAL SUPERNOVA // PHASE 2 OVERDRIVE',
          desc: 'Kinetic weakness hardened! Void attacks absorbed! Actions elevated to 4!',
          surge: surge,
          targetPriority: 'HIGHEST_FLUX_AND_DESPAIR'
        };
      }
    }
    return false;
  }

  function decideArchonAction(archon, partyState) {
    archon.state = archon.state || { charging: false, turnCount: 0, enraged: false, surgeActive: false };
    archon.state.turnCount++;

    // Check dynamic phase 2 transition
    var enrageEvent = checkEnrageState(archon);

    if (archon.id === 'malphas_prime') {
      if (archon.state.charging) {
        archon.state.charging = false;
        return {
          skill: archon.skills[4],
          targetPreference: 'aoe',
          note: 'UNLEASHING CORE MELTDOWN CATASTROPHE',
          enrageEvent: enrageEvent
        };
      }

      // Overdrive Phase 2 Enrage AI — Altered Targeting: Surgical execution of vulnerable or buffed frames
      if (archon.state.enraged) {
        // Rapid charging every 2 turns in overdrive
        if (archon.state.turnCount % 2 === 0 && !archon.state.charging) {
          archon.state.charging = true;
          return {
            skill: archon.skills[3],
            targetPreference: 'self',
            note: 'OVERCLOCK MELTDOWN: RAPID-CHARGING CORE MELTDOWN [2-TURN ACCELERATION]...',
            enrageEvent: enrageEvent
          };
        }
        // Purge buffed targets immediately
        if (partyState && (partyState.buffCount >= 1 || partyState.hasShield)) {
          return {
            skill: archon.skills[5] || archon.skills[2],
            targetPreference: 'buffed',
            note: 'SYSTEM PURGE // APOCALYPSE SPIKE — SURGICALLY STRIPPING DEFENSES',
            enrageEvent: enrageEvent
          };
        }
        // Focus fire lowest integrity frame with Apocalypse Spike or Subnet Overcharge
        if (partyState && partyState.lowestHpPercent < 0.4) {
          return {
            skill: archon.skills[5] || archon.skills[1],
            targetPreference: 'lowest_hp',
            note: 'LETHAL TARGETING: APOCALYPSE SPIKE ZEROING ON WEAKENED VESSEL',
            enrageEvent: enrageEvent
          };
        }
        return {
          skill: archon.skills[1],
          targetPreference: 'aoe',
          note: 'LEYLINE OVERCLOCK: HYPER-DISCHARGING SUBNET OVERCHARGE',
          enrageEvent: enrageEvent
        };
      }

      // Phase 1 Standard AI
      if (archon.hp < archon.maxHp * 0.50 && archon.state.turnCount % 4 === 0) {
        archon.state.charging = true;
        return { skill: archon.skills[3], targetPreference: 'self', note: 'CRITICAL OVERHEAT: CHARGING CORE MELTDOWN...', enrageEvent: enrageEvent };
      }
      if (partyState && partyState.buffCount && partyState.buffCount >= 2 && Math.random() < 0.6) {
        return { skill: archon.skills[2], targetPreference: 'buffed', note: 'FIRMWARE LOCKDOWN — RESETTING ENEMY BUFFS', enrageEvent: enrageEvent };
      }
      if (archon.state.turnCount % 2 === 0) {
        return { skill: archon.skills[1], targetPreference: 'aoe', note: 'DISCHARGING SUBNET OVERCHARGE', enrageEvent: enrageEvent };
      }
      return { skill: archon.skills[0], targetPreference: 'front', note: 'SLICING THROUGH WITH CIRCUIT CLEAVE', enrageEvent: enrageEvent };
    }

    if (archon.id === 'decarabia_void') {
      // Overdrive Phase 2 Enrage AI — Altered Targeting: High-FLUX siphoning & entropy collapse
      if (archon.state.enraged) {
        // High FLUX party target drain
        if (partyState && partyState.highestSpTarget) {
          return {
            skill: archon.skills[3] || archon.skills[1],
            targetPreference: 'highest_sp',
            note: 'SUPERNOVA COLLAPSE: DETONATING MAXIMUM FLUX CONCENTRATION',
            enrageEvent: enrageEvent
          };
        }
        if (archon.state.turnCount % 2 === 0) {
          return {
            skill: archon.skills[3] || archon.skills[1],
            targetPreference: 'aoe',
            note: 'SUPERNOVA: SINGULARITY COLLAPSE CRUSHING THE VESSEL GRID',
            enrageEvent: enrageEvent
          };
        }
        return {
          skill: archon.skills[2],
          targetPreference: 'lowest_hp',
          note: 'VAMPIRIC SUPERNOVA: ENTROPY DRAIN SIPHONING RESIDUAL VITALITY',
          enrageEvent: enrageEvent
        };
      }

      // Phase 1 Standard AI
      if (archon.hp < archon.maxHp * 0.5 && Math.random() < 0.4) {
        return { skill: archon.skills[2], targetPreference: 'random', note: 'SIPHONING ESSENCE WITH ENTROPY DRAIN', enrageEvent: enrageEvent };
      }
      if (archon.state.turnCount % 3 === 0) {
        return { skill: archon.skills[1], targetPreference: 'aoe', note: 'INCINERATING FORMATIONS WITH PENTAGRAM FLARE', enrageEvent: enrageEvent };
      }
      return { skill: archon.skills[0], targetPreference: 'random', note: 'FIXING GAZE: PETRIFYING STARE', enrageEvent: enrageEvent };
    }

    return { skill: archon.skills[0], targetPreference: 'random', note: 'ATTACKING', enrageEvent: enrageEvent };
  }

  function isOverdrive(archon) {
    return !!(archon && archon.state && archon.state.enraged);
  }

  var ArchonModule = {
    ARCHONS: ARCHONS,
    checkEnrageState: checkEnrageState,
    decideArchonAction: decideArchonAction,
    triggerLeylineSurge: triggerLeylineSurge,
    isOverdrive: isOverdrive
  };

  root.ArchonModule = ArchonModule;
})(typeof window !== 'undefined' ? window : globalThis);
