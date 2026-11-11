/**
 * SILICON PURGATORY // BOSS REWARD & PROGRESSION LOOP
 * Module: rewards.js
 * Handles loot drops, soul-fragment tally, and extraction/return gate to Cycle Arena / Fusion Chamber.
 */
(function(window) {
  'use strict';

  var STORAGE_KEY = 'silicon_purgatory_progression';

  var DEFAULT_PROGRESSION = {
    soulFragments: 0,
    bossesDefeated: 0,
    inventory: [],
    unlockedGates: ['arena', 'fusion']
  };

  function loadProgression() {
    try {
      var data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : JSON.parse(JSON.stringify(DEFAULT_PROGRESSION));
    } catch(e) {
      return JSON.parse(JSON.stringify(DEFAULT_PROGRESSION));
    }
  }

  function saveProgression(prog) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prog));
    } catch(e) {
      console.warn('Storage failed', e);
    }
  }

  var LOOT_TABLE = [
    { id: 'null_core', name: 'NULL-CORE DRIVE', rarity: 'RARE', desc: 'Overclocked processor shard extracted from Null Colossus. Grants +15 Max Flux.' },
    { id: 'entropy_blade', name: 'ENTROPY RAZOR', rarity: 'UNCOMMON', desc: 'Hardened kinetic shard emitting null radiation. Boosts physical strike power.' },
    { id: 'cryo_insulator', name: 'CRYO SHIELD CHIP', rarity: 'UNCOMMON', desc: 'Thermal dispersion wafer. Converts cold attacks into minor flux recovery.' },
    { id: 'archon_cipher', name: 'ARCHON CIPHER KEY', rarity: 'LEGENDARY', desc: 'Cryptographic relic used to awaken forbidden fusions in the Fusion Chamber.' }
  ];

  function rollLoot(bossDef) {
    var drops = [];
    // Guaranteed Soul Fragment drop
    var soulDrop = Math.floor(Math.random() * 25) + 50; // 50 - 75 fragments
    // 1-2 Equipment/Chip drops
    var dropCount = (Math.random() < 0.4) ? 2 : 1;
    var shuffled = LOOT_TABLE.slice().sort(function() { return 0.5 - Math.random(); });
    for (var i = 0; i < dropCount; i++) {
      drops.push(shuffled[i]);
    }
    return {
      souls: soulDrop,
      items: drops
    };
  }

  function createRewardOverlay(lootData, onReturnArena, onReturnFusion) {
    var existing = document.getElementById('rewardOverlay');
    if (existing) existing.remove();

    var overlay = document.createElement('div');
    overlay.id = 'rewardOverlay';
    overlay.style.cssText = [
      'position: fixed',
      'top: 0',
      'left: 0',
      'width: 100vw',
      'height: 100vh',
      'background: rgba(5, 6, 8, 0.92)',
      'backdrop-filter: blur(4px)',
      'z-index: 9999',
      'display: flex',
      'flex-direction: column',
      'align-items: center',
      'justify-content: center',
      'padding: 16px',
      'box-sizing: border-box',
      'font-family: "JetBrains Mono", monospace'
    ].join(';');

    var modal = document.createElement('div');
    modal.style.cssText = [
      'width: 100%',
      'max-width: 520px',
      'background: #0a0c10',
      'border: 2px solid #ff2a4b',
      'box-shadow: 0 0 30px rgba(255, 42, 75, 0.25)',
      'padding: 24px',
      'color: #e5e7eb',
      'box-sizing: border-box'
    ].join(';');

    var prog = loadProgression();
    prog.soulFragments = (prog.soulFragments || 0) + lootData.souls;
    prog.bossesDefeated = (prog.bossesDefeated || 0) + 1;
    for (var i = 0; i < lootData.items.length; i++) {
      prog.inventory.push(lootData.items[i].id);
    }
    saveProgression(prog);

    var itemHtml = lootData.items.map(function(item) {
      var badgeColor = item.rarity === 'LEGENDARY' ? '#f59e0b' : (item.rarity === 'RARE' ? '#ff2a4b' : '#06b6d4');
      return '<div style="background:#10141c;border:1px solid #1f2937;padding:10px;margin-bottom:8px;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">' +
          '<span style="font-weight:700;font-size:12px;color:#fff;">' + item.name + '</span>' +
          '<span style="font-size:10px;font-weight:700;color:' + badgeColor + ';border:1px solid ' + badgeColor + ';padding:2px 6px;">' + item.rarity + '</span>' +
        '</div>' +
        '<div style="font-size:11px;color:#9ca3af;line-height:1.4;">' + item.desc + '</div>' +
      '</div>';
    }).join('');

    modal.innerHTML = [
      '<div style="font-size:11px;font-weight:800;letter-spacing:0.2em;color:#ff2a4b;margin-bottom:4px;">NULL_COLOSSUS PURGED // VICTORY CONFIRMED</div>',
      '<h2 style="font-size:18px;font-weight:800;letter-spacing:0.05em;margin-bottom:16px;color:#fff;">SECTOR PURGE COMPLETE</h2>',
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">',
        '<div style="background:#10141c;border:1px solid #1f2937;padding:12px;text-align:center;">',
          '<div style="font-size:9px;color:#6b7280;font-weight:700;letter-spacing:0.1em;">SOUL FRAGMENTS EXTRACTED</div>',
          '<div style="font-size:24px;font-weight:800;color:#06b6d4;margin-top:4px;">+' + lootData.souls + '</div>',
          '<div style="font-size:10px;color:#9ca3af;margin-top:2px;">TOTAL: ' + prog.soulFragments + '</div>',
        '</div>',
        '<div style="background:#10141c;border:1px solid #1f2937;padding:12px;text-align:center;">',
          '<div style="font-size:9px;color:#6b7280;font-weight:700;letter-spacing:0.1em;">SECTOR PURGES CONFIRMED</div>',
          '<div style="font-size:24px;font-weight:800;color:#f59e0b;margin-top:4px;">' + prog.bossesDefeated + '</div>',
          '<div style="font-size:10px;color:#9ca3af;margin-top:2px;">RANK: ARCHON SLAYER</div>',
        '</div>',
      '</div>',
      '<div style="font-size:10px;font-weight:700;letter-spacing:0.1em;color:#9ca3af;margin-bottom:8px;">RECOVERED ARTIFACTS & CHIPS</div>',
      '<div style="margin-bottom:20px;">' + itemHtml + '</div>',
      '<div style="font-size:10px;font-weight:700;letter-spacing:0.1em;color:#9ca3af;margin-bottom:8px;">TACTICAL RETURN GATEWAYS</div>',
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">',
        '<button id="gateArenaBtn" style="background:#10141c;border:1px solid #06b6d4;color:#06b6d4;padding:10px;font-family:inherit;font-size:11px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;">⚔️ RETURN TO ARENA</button>',
        '<button id="gateFusionBtn" style="background:#10141c;border:1px solid #f59e0b;color:#f59e0b;padding:10px;font-family:inherit;font-size:11px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;">⚡ DEMON FUSION</button>',
      '</div>',
      '<button id="gateStayBtn" style="width:100%;margin-top:8px;background:none;border:none;color:#6b7280;font-family:inherit;font-size:10px;text-decoration:underline;cursor:pointer;">[STAY IN SANCTUM TO EXAMINE TELEMETRY]</button>'
    ].join('');

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    document.getElementById('gateArenaBtn').onclick = function() {
      if (typeof onReturnArena === 'function') {
        onReturnArena();
      } else {
        window.location.href = 'index.html';
      }
    };

    document.getElementById('gateFusionBtn').onclick = function() {
      if (typeof onReturnFusion === 'function') {
        onReturnFusion();
      } else {
        window.location.href = 'index.html?mode=fusion';
      }
    };

    document.getElementById('gateStayBtn').onclick = function() {
      overlay.style.display = 'none';
    };

    return overlay;
  }

  function triggerBossReward(bossDef, onReturnArena, onReturnFusion) {
    var loot = rollLoot(bossDef);
    return createRewardOverlay(loot, onReturnArena, onReturnFusion);
  }

  window.SiliconRewards = {
    rollLoot: rollLoot,
    trigger: triggerBossReward,
    getProgression: loadProgression,
    saveProgression: saveProgression
  };

})(typeof window !== 'undefined' ? window : this);
