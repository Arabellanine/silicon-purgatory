/**
 * SILICON PURGATORY // BOSS ENCOUNTER MODULE
 * Standalone boss AI, boss-sanctum generator hooks, and Press-Turn escalation logic.
 * Boss: MALWARE ARCHON // NULL_COLOSSUS
 */
(function(window) {
  'use strict';

  var BOSS_DEF = {
    name: 'NULL COLOSSUS',
    title: 'MALWARE ARCHON // SECTOR PURGE ENGINE',
    integrity: 360,
    maxIntegrity: 360,
    flux: 150,
    maxFlux: 150,
    pressTurns: 2, // Multi-action Press-Turn boss
    resistances: {
      kinetic: 'resist',
      heat: 'weak',      // Exploitable vulnerability
      cold: 'absorb',
      elec: 'resist',
      voidNull: 'null'
    },
    phase: 1,
    telegraph: null, // Telegraphed catastrophic attack
    specialCooldown: 0
  };

  function createBossInstance(customSeed) {
    var boss = JSON.parse(JSON.stringify(BOSS_DEF));
    boss.seed = customSeed || 'archon';
    return boss;
  }

  // Boss AI Decision Engine: 2 actions per turn, telegraphed apocalyptic strike every 3 turns
  function decideBossAction(boss, playerState, currentTurnActionIndex) {
    // If telegraph was primed last turn, unleash CATASTROPHIC SPECIAL
    if (boss.telegraph) {
      var special = boss.telegraph;
      boss.telegraph = null;
      boss.specialCooldown = 3;
      return {
        type: 'apocalypse',
        name: special.name,
        affinity: 'voidNull',
        power: 45,
        desc: '⚠️ EXECUTING ' + special.name + '! Overwhelming null entropy surges!',
        screenShake: true
      };
    }

    // Phase transition check
    if (boss.integrity < boss.maxIntegrity * 0.45 && boss.phase === 1) {
      boss.phase = 2;
      boss.pressTurns = 3; // Escalates to 3 Press-Turn actions in desperate phase!
      return {
        type: 'escalation',
        name: 'CORE HYPER-THREAD',
        affinity: 'kinetic',
        power: 10,
        desc: '🔥 MALWARE ARCHON overclocks reactor core! Tactical actions escalated to 3 per cycle!',
        screenShake: true
      };
    }

    // Check if ready to telegraph catastrophic strike
    if (boss.specialCooldown <= 0 && currentTurnActionIndex === 0 && Math.random() < 0.6) {
      boss.telegraph = {
        name: 'TOTAL SYSTEM PURGE',
        countdown: 1
      };
      return {
        type: 'telegraph',
        name: 'PURGE CHARGE',
        affinity: 'voidNull',
        power: 0,
        desc: '⚠️ WARNING: ARCHON charging [TOTAL SYSTEM PURGE]! Brace or exploit HEAT weakness!',
        screenShake: false
      };
    }

    if (boss.specialCooldown > 0 && currentTurnActionIndex === 0) {
      boss.specialCooldown--;
    }

    // Standard tactical rotation
    var roll = Math.random();
    if (roll < 0.35) {
      return {
        type: 'attack',
        name: 'CRUSHING ARCHIVE',
        affinity: 'kinetic',
        power: 16,
        desc: 'Archon drops fragmented sector memory onto CAIRN-FRAME!'
      };
    } else if (roll < 0.7) {
      return {
        type: 'attack',
        name: 'ZERO-DAY FROST',
        affinity: 'cold',
        power: 20,
        desc: 'Archon discharges cryogenic buffer overflow!'
      };
    } else {
      return {
        type: 'attack',
        name: 'STATIC SEIZURE',
        affinity: 'elec',
        power: 18,
        desc: 'Archon floods bus lines with high-voltage lightning!'
      };
    }
  }

  // Boss Sanctum Floor Generator Modifier
  // Generates a dedicated symmetrical boss arena chamber at Sector 06 / Depth 5
  function buildBossSanctumFloor(gridWidth, gridHeight, seedStr) {
    var floor = {
      width: gridWidth || 28,
      height: gridHeight || 28,
      cells: [],
      bossRoom: { x: 4, y: 4, w: 20, h: 20 },
      bossSpawn: { x: 14, y: 10 },
      playerSpawn: { x: 14, y: 20 },
      isSanctum: true,
      name: 'SECTOR 06 // ARCHON SANCTUM'
    };

    for (var y = 0; y < floor.height; y++) {
      var row = [];
      for (var x = 0; x < floor.width; x++) {
        // Enclosing arena walls with four pillar barriers
        var isWall = (x < 3 || x >= floor.width - 3 || y < 3 || y >= floor.height - 3);
        // Tactical cover pillars
        if ((x === 8 || x === 19) && (y === 8 || y === 15)) {
          isWall = true;
        }
        row.push(isWall ? 1 : 0);
      }
      floor.cells.push(row);
    }
    return floor;
  }

  // Expose on window for dungeon.html & index.html
  window.SiliconBoss = {
    def: BOSS_DEF,
    create: createBossInstance,
    decideAction: decideBossAction,
    buildSanctum: buildBossSanctumFloor
  };

})(typeof window !== 'undefined' ? window : this);
