/* ============================================================================
 * boss.js — Silicon Purgatory :: Boss Floor & Tactical Cycle Module
 * Zero-dependency, self-contained ES6 module. Exposes window.BossModule.
 * ============================================================================ */
(function (root) {
  'use strict';

  var WALL = 0;
  var FLOOR = 1;
  var DOOR = 2;
  var TILE = 16;

  function mulberry32(a) {
    return function () {
      a |= 0;
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hashSeed(s) {
    if (typeof s === 'number') return s >>> 0;
    var str = String(s || 'silicon-boss');
    var h = 1779033703 ^ str.length;
    for (var i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    return (h ^ (h >>> 16)) >>> 0;
  }

  var BOSS_ARCHETYPE = {
    id: 'apostlezero',
    name: 'APOSTLE OF ZERO',
    title: 'ARCH-DAEMON MALPHAS // PRIME COGNITION',
    hp: 420,
    maxHp: 420,
    sp: 140,
    maxSp: 140,
    atk: 24,
    def: 14,
    actionsPerTurn: 2,
    col: '#ff0033',
    col2: '#4a000e',
    glow: '#ff4d6d',
    horns: true,
    isBoss: true,
    resistances: {
      kinetic: 'resist',
      thermal: 'resist',
      cryo: 'weak',
      volt: 'weak',
      void: 'null'
    },
    skills: [
      { id: 'null_slash', name: 'NULL SLASH', cost: 0, power: 22, element: 'kinetic' },
      { id: 'zero_charge', name: 'CHARGE ZERO', cost: 15, power: 0, element: 'void', telegraph: true },
      { id: 'calamity_purge', name: 'CALAMITY PURGE', cost: 35, power: 55, element: 'thermal', aoe: true }
    ],
    state: {
      charging: false,
      turnCount: 0
    }
  };

  function decideBossAction(boss) {
    boss.state = boss.state || { charging: false, turnCount: 0 };
    boss.state.turnCount++;
    if (boss.state.charging) {
      boss.state.charging = false;
      return { skill: boss.skills[2], note: 'UNLEASHING CALAMITY PURGE' };
    }
    if (boss.hp < boss.maxHp * 0.7 && boss.state.turnCount % 3 === 0) {
      boss.state.charging = true;
      return { skill: boss.skills[1], note: 'GATHERING CATASTROPHIC THERMAL FLUX...' };
    }
    return { skill: boss.skills[0], note: 'EXECUTING NULL SLASH' };
  }

  function generateBossFloor(seed, mapW, mapH) {
    mapW = mapW || 48;
    mapH = mapH || 36;

    var grid = [];
    for (var y = 0; y < mapH; y++) {
      grid[y] = new Array(mapW).fill(WALL);
    }

    var bossRoom = {
      x: 14,
      y: 6,
      w: 20,
      h: 16,
      cx: 24,
      cy: 14,
      isBossChamber: true,
      discovered: true
    };

    for (var ry = bossRoom.y; ry < bossRoom.y + bossRoom.h; ry++) {
      for (var rx = bossRoom.x; rx < bossRoom.x + bossRoom.w; rx++) {
        grid[ry][rx] = FLOOR;
      }
    }

    var pillars = [
      [bossRoom.x + 3, bossRoom.y + 3],
      [bossRoom.x + bossRoom.w - 4, bossRoom.y + 3],
      [bossRoom.x + 3, bossRoom.y + bossRoom.h - 4],
      [bossRoom.x + bossRoom.w - 4, bossRoom.y + bossRoom.h - 4]
    ];
    pillars.forEach(function (p) {
      grid[p[1]][p[0]] = WALL;
    });

    var hallW = 4;
    var hallX = 22;
    var hallY = bossRoom.y + bossRoom.h;
    var hallH = 8;
    for (var hy = hallY; hy < hallY + hallH; hy++) {
      for (var hx = hallX; hx < hallX + hallW; hx++) {
        grid[hy][hx] = FLOOR;
      }
    }

    grid[bossRoom.y + bossRoom.h][23] = DOOR;
    grid[bossRoom.y + bossRoom.h][24] = DOOR;

    var spawnRoom = {
      x: 20,
      y: hallY + hallH,
      w: 8,
      h: 4,
      cx: 24,
      cy: hallY + hallH + 2,
      discovered: true
    };
    for (var sy = spawnRoom.y; sy < spawnRoom.y + spawnRoom.h; sy++) {
      for (var sx = spawnRoom.x; sx < spawnRoom.x + spawnRoom.w; sx++) {
        if (sy < mapH - 1 && sx < mapW - 1) grid[sy][sx] = FLOOR;
      }
    }

    var bossEntity = {
      type: BOSS_ARCHETYPE,
      room: bossRoom,
      gx: bossRoom.cx,
      gy: bossRoom.cy,
      rx: bossRoom.cx * (TILE * 3),
      ry: bossRoom.cy * (TILE * 3),
      moving: false,
      mvt: 0,
      mvx: 0,
      mvy: 0,
      cd: 1.2,
      timer: 0,
      isBoss: true,
      rng: mulberry32(hashSeed(seed) ^ 0x666)
    };

    var minions = [
      {
        type: { id: 'sentinel_a', name: 'SANCTUM WARDEN α', col: '#ff2b44', col2: '#7a0f1c', glow: '#ff6b7e', horns: true },
        room: bossRoom,
        gx: bossRoom.cx - 4,
        gy: bossRoom.cy + 2,
        rx: (bossRoom.cx - 4) * (TILE * 3),
        ry: (bossRoom.cy + 2) * (TILE * 3),
        moving: false,
        mvt: 0,
        mvx: 0,
        mvy: 0,
        cd: 0.8,
        timer: 0,
        rng: mulberry32(hashSeed(seed) ^ 0x111)
      },
      {
        type: { id: 'sentinel_b', name: 'SANCTUM WARDEN β', col: '#ff2b44', col2: '#7a0f1c', glow: '#ff6b7e', horns: true },
        room: bossRoom,
        gx: bossRoom.cx + 4,
        gy: bossRoom.cy + 2,
        rx: (bossRoom.cx + 4) * (TILE * 3),
        ry: (bossRoom.cy + 2) * (TILE * 3),
        moving: false,
        mvt: 0,
        mvx: 0,
        mvy: 0,
        cd: 0.8,
        timer: 0,
        rng: mulberry32(hashSeed(seed) ^ 0x222)
      }
    ];

    return {
      grid: grid,
      rooms: [bossRoom, spawnRoom],
      bossRoom: bossRoom,
      playerSpawn: { x: spawnRoom.cx, y: spawnRoom.cy },
      bossEntity: bossEntity,
      minions: minions
    };
  }

  function renderBossTile(boss) {
    var c = document.createElement('canvas');
    c.width = TILE;
    c.height = TILE;
    var g = c.getContext('2d');
    var B = boss.col || '#ff0033';
    var D = boss.col2 || '#4a000e';
    var G = boss.glow || '#ff4d6d';

    g.fillStyle = 'rgba(0,0,0,0.6)';
    g.fillRect(2, 14, 12, 2);

    g.fillStyle = D;
    g.fillRect(3, 3, 2, 4);
    g.fillRect(11, 3, 2, 4);
    g.fillRect(2, 2, 2, 2);
    g.fillRect(12, 2, 2, 2);

    g.fillStyle = B;
    g.fillRect(4, 5, 8, 9);
    g.fillStyle = D;
    g.fillRect(5, 7, 6, 7);

    g.fillStyle = G;
    g.fillRect(5, 6, 2, 2);
    g.fillRect(9, 6, 2, 2);
    g.fillStyle = '#ffffff';
    g.fillRect(6, 6, 1, 1);
    g.fillRect(10, 6, 1, 1);

    g.fillStyle = G;
    g.fillRect(7, 10, 2, 2);

    return c;
  }

  var BossModule = {
    generateBossFloor: generateBossFloor,
    renderBossTile: renderBossTile,
    decideBossAction: decideBossAction,
    BOSS_ARCHETYPE: BOSS_ARCHETYPE
  };

  root.BossModule = BossModule;
})(typeof window !== 'undefined' ? window : globalThis);
