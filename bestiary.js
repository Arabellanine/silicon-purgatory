/* ============================================================================
 * bestiary.js — Silicon Purgatory :: Bestiary Codex & Entity Telemetry Module
 * Zero-dependency, self-contained ES6/browser module. Exposes window.BestiaryCodex.
 * Tracks discovered daemon processes, Archons, affixes, encounters, and fusions.
 * Provides tactical telemetry inspection modal with affinity matrix and lore.
 * ============================================================================ */
(function(root) {
  'use strict';

  var STORAGE_KEY = 'silicon_purgatory_bestiary';

  // Master Entity Registry
  var ENTITY_REGISTRY = {
    // Tier 1 Standard Rogue Daemons
    sentinel: {
      id: 'sentinel',
      name: 'DAEMON SENTINEL',
      tier: 1,
      type: 'standard',
      classTitle: 'WARDEN SUBROUTINE // MEMORY SIEGE',
      hp: 120,
      sp: 40,
      atk: 16,
      col: '#ff2b44',
      col2: '#7a0f1c',
      glow: '#ff6b7e',
      aff: { kinetic: 'res', thermal: 'normal', cryo: 'weak', volt: 'normal', void: 'nul' },
      skills: ['Cleave (Kinetic)', 'Void Dart (Void)'],
      lore: 'A hardened warden process compiled during the early Purgatory sieges. Shields core memories from external tampering.'
    },
    pyroclocker: {
      id: 'pyroclocker',
      name: 'PYRO CLOCKER',
      tier: 1,
      type: 'standard',
      classTitle: 'THERMAL PURGE ENGINE',
      hp: 90,
      sp: 60,
      atk: 14,
      col: '#f59e0b',
      col2: '#7a3d00',
      glow: '#ffd27a',
      aff: { kinetic: 'normal', thermal: 'drain', cryo: 'weak', volt: 'res', void: 'normal' },
      skills: ['Flame Burst (Thermal)', 'Heat Wave (Thermal)'],
      lore: 'Overclocks internal computation cycles until friction superheats ambient silicon into spontaneous ignition.'
    },
    cryodrifter: {
      id: 'cryodrifter',
      name: 'CRYO DRIFTER',
      tier: 1,
      type: 'standard',
      classTitle: 'ENTROPIC HEAT-SINK DRIFTER',
      hp: 110,
      sp: 50,
      atk: 15,
      col: '#38bdf8',
      col2: '#0c4a6e',
      glow: '#bae6fd',
      aff: { kinetic: 'res', thermal: 'weak', cryo: 'drain', volt: 'normal', void: 'normal' },
      skills: ['Glacial Spike (Cryo)', 'Frost Shield (Cryo)'],
      lore: 'A phantom sub-process floating through cold storage partitions, condensing cryogenic vapor to dampen clock speeds.'
    },
    sparkharvester: {
      id: 'sparkharvester',
      name: 'SPARK HARVESTER',
      tier: 1,
      type: 'standard',
      classTitle: 'HIGH-FREQUENCY VOLTAIC LEECH',
      hp: 70,
      sp: 80,
      atk: 13,
      col: '#fde047',
      col2: '#854d0e',
      glow: '#fff7c2',
      aff: { kinetic: 'normal', thermal: 'normal', cryo: 'res', volt: 'drain', void: 'weak' },
      skills: ['Spark Arc (Volt)', 'Subnet Shock (Volt)'],
      lore: 'Reaps errant electrical discharge across broken logic gates to nourish its own accelerating pulse.'
    },
    coreinquisitor: {
      id: 'coreinquisitor',
      name: 'CORE INQUISITOR',
      tier: 2,
      type: 'elite',
      classTitle: 'SECURITY TRIBUNAL SOVEREIGN',
      hp: 140,
      sp: 70,
      atk: 18,
      col: '#a855f7',
      col2: '#3b0764',
      glow: '#e9d5ff',
      aff: { kinetic: 'res', thermal: 'res', cryo: 'res', volt: 'weak', void: 'nul' },
      skills: ['Void Judgement (Void)', 'Purge Sector (Kinetic)'],
      lore: 'An inquisitorial kernel auditor that inspects mortal cognitive signatures and uniformly declares them corrupt.'
    },

    // Tier 2 Fused Entities
    frostfire_golem: {
      id: 'frostfire_golem',
      name: 'FROSTFIRE GOLEM',
      tier: 2,
      type: 'fused',
      classTitle: 'DUAL-CORE THERMODYNAMIC CONSTRUCT',
      hp: 160,
      sp: 55,
      atk: 32,
      col: '#ec4899',
      col2: '#831843',
      glow: '#f472b6',
      aff: { kinetic: 'normal', thermal: 'drain', cryo: 'drain', volt: 'normal', void: 'normal' },
      skills: ['Inferno Ray (Thermal)', 'Permafrost (Cryo)'],
      lore: 'Synthesized from opposing thermal extremes. Absorbs both fire and ice while radiating blistering steam.'
    },
    plasma_archon: {
      id: 'plasma_archon',
      name: 'PLASMA ARCHON',
      tier: 2,
      type: 'fused',
      classTitle: 'IONIZED SUPERHEATED EMBODY',
      hp: 120,
      sp: 70,
      atk: 40,
      col: '#f97316',
      col2: '#7c2d12',
      glow: '#fb923c',
      aff: { kinetic: 'normal', thermal: 'drain', cryo: 'weak', volt: 'drain', void: 'normal' },
      skills: ['Plasma Flare (Thermal)', 'Chain Lightning (Volt)'],
      lore: 'The lethal conjunction of voltage and flame. Strikes with ionized sovereign blades.'
    },
    storm_sentinel: {
      id: 'storm_sentinel',
      name: 'STORM SENTINEL',
      tier: 2,
      type: 'fused',
      classTitle: 'ELECTROMAGNETIC BASTION',
      hp: 145,
      sp: 60,
      atk: 34,
      col: '#06b6d4',
      col2: '#164e63',
      glow: '#67e8f9',
      aff: { kinetic: 'res', thermal: 'normal', cryo: 'normal', volt: 'drain', void: 'res' },
      skills: ['Tesla Rampart (Volt)', 'Kinetic Pulse (Kinetic)'],
      lore: 'Reinforced ballistic bulwark wrapped in dense copper magnetic coils. Retaliates with instant lightning.'
    },
    dread_chariot: {
      id: 'dread_chariot',
      name: 'DREAD CHARIOT',
      tier: 2,
      type: 'fused',
      classTitle: 'PURGING WAR ENGINE',
      hp: 150,
      sp: 45,
      atk: 38,
      col: '#e11d48',
      col2: '#4c0519',
      glow: '#fb7185',
      aff: { kinetic: 'res', thermal: 'drain', cryo: 'weak', volt: 'normal', void: 'res' },
      skills: ['Crush Treads (Kinetic)', 'Hellfire Exhaust (Thermal)'],
      lore: 'A relentless juggernaut engine that crushes rogue subroutines beneath treads of liquid magma.'
    },
    glacier_sentinel: {
      id: 'glacier_sentinel',
      name: 'GLACIER SENTINEL',
      tier: 2,
      type: 'fused',
      classTitle: 'PERMAFROST MONOLITH',
      hp: 165,
      sp: 50,
      atk: 30,
      col: '#0284c7',
      col2: '#082f49',
      glow: '#38bdf8',
      aff: { kinetic: 'res', thermal: 'weak', cryo: 'drain', volt: 'normal', void: 'res' },
      skills: ['Absolute Zero (Cryo)', 'Frost Barrier (Cryo)'],
      lore: 'Carved from monolithic memory banks frozen during the deep shutdown. An immovable freezing bastion.'
    },

    // Tier 3 Sovereign Archons
    void_archon: {
      id: 'void_archon',
      name: 'VOID ARCHON',
      tier: 3,
      type: 'fused',
      classTitle: 'ENTROPIC SINGULARITY AVATAR',
      hp: 200,
      sp: 90,
      atk: 48,
      col: '#9333ea',
      col2: '#3b0764',
      glow: '#c084fc',
      aff: { kinetic: 'res', thermal: 'res', cryo: 'res', volt: 'res', void: 'drain' },
      skills: ['Singularity Collapse (Void)', 'Abyssal Cascade (Void)'],
      lore: 'A being composed entirely of unallocated memory space. Consumes all surrounding data.'
    },
    archon_prime: {
      id: 'archon_prime',
      name: 'ARCHON PRIME',
      tier: 3,
      type: 'fused',
      classTitle: 'TACTICAL CIPHER MONARCH',
      hp: 240,
      sp: 110,
      atk: 54,
      col: '#eab308',
      col2: '#713f12',
      glow: '#fef08a',
      aff: { kinetic: 'res', thermal: 'res', cryo: 'res', volt: 'res', void: 'nul' },
      skills: ['Overclock Surge (Volt)', 'Apocalypse Beam (Thermal)', 'Void Rift (Void)'],
      lore: 'The supreme overseer of tactical cycles, forged under the cipher keys of antiquity.'
    },

    // Tier 4 Boss & Transcendent Archons
    malphas_prime: {
      id: 'malphas_prime',
      name: 'MALPHAS PRIME',
      tier: 4,
      type: 'archon',
      classTitle: 'GATE SOVEREIGN // BROKEN CIRCUIT',
      hp: 8400,
      sp: 1200,
      atk: 48,
      col: '#ff0055',
      col2: '#3a0014',
      glow: '#ff3377',
      aff: { kinetic: 'res', thermal: 'weak', cryo: 'neutral', volt: 'nul', void: 'reflect' },
      skills: ['Circuit Cleave', 'Subnet Overcharge', 'Core Meltdown (Telegraph)', 'System Purge'],
      lore: 'Gatekeeper of the Sanctum threshold. Enters catastrophic Phase 2 Overclock when critically breached.'
    },
    decarabia_void: {
      id: 'decarabia_void',
      name: 'DECARABIA VOID-WATCHER',
      tier: 4,
      type: 'archon',
      classTitle: 'OCULAR ARCHON // ENTROPY STAR',
      hp: 9200,
      sp: 1800,
      atk: 42,
      col: '#9d00ff',
      col2: '#20003a',
      glow: '#d066ff',
      aff: { kinetic: 'weak', thermal: 'reflect', cryo: 'nul', volt: 'res', void: 'res' },
      skills: ['Petrifying Stare', 'Pentagram Flare', 'Entropy Drain', 'Singularity Collapse'],
      lore: 'The five-pointed all-seeing astral eye of the deep purgatory. Strips party FLUX and bends leylines.'
    },
    ouroboros_demiurge: {
      id: 'ouroboros_demiurge',
      name: 'OUROBOROS DEMIURGE',
      tier: 4,
      type: 'fused',
      classTitle: 'ENDLESS RECURSION SOVEREIGN',
      hp: 420,
      sp: 200,
      atk: 78,
      col: '#10b981',
      col2: '#064e3b',
      glow: '#34d399',
      aff: { kinetic: 'res', thermal: 'nul', cryo: 'nul', volt: 'nul', void: 'drain' },
      skills: ['Infinite Loop (Void)', 'Astral Flash (Volt)', 'Extinction Flare (Thermal)'],
      lore: 'The synthesis of Gate and Star. An eternal serpent looping through infinite computational cycles.'
    },

    // Tier 5 Apex Spire Demiurges
    chronos_devourer: {
      id: 'chronos_devourer',
      name: 'CHRONOS VOID-DEVOURER',
      tier: 5,
      type: 'apex',
      classTitle: 'TEMPORAL SINGULARITY GODHEAD',
      hp: 540,
      sp: 260,
      atk: 92,
      col: '#38bdf8',
      col2: '#0369a1',
      glow: '#7dd3fc',
      aff: { kinetic: 'res', thermal: 'drain', cryo: 'drain', volt: 'nul', void: 'drain' },
      skills: ['Chronos Purge (Void)', 'Absolute Zero (Cryo)', 'Time Dilation (Void)'],
      lore: 'Forged from Spire temporal distortions. Traps hostile targets in recursive frozen loops.'
    },
    apocalypse_architect: {
      id: 'apocalypse_architect',
      name: 'APOCALYPSE ARCHITECT',
      tier: 5,
      type: 'apex',
      classTitle: 'SUPREME ENTROPIC OVERSEER',
      hp: 640,
      sp: 320,
      atk: 108,
      col: '#f43f5e',
      col2: '#881337',
      glow: '#fb7185',
      aff: { kinetic: 'drain', thermal: 'drain', cryo: 'res', volt: 'drain', void: 'nul' },
      skills: ['Apocalypse Spike (Void)', 'Grand Cataclysm (Thermal)', 'Hyper-Charge (Volt)'],
      lore: 'The ultimate architect of silicon ruin. Channels raw unshielded entropy across all dimensions.'
    }
  };

  function loadBestiary() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed.discovered === 'object') return parsed;
      }
    } catch (e) {}

    // Initial default: baseline Tier 1 entities are recognized by the tactical scanner
    var initial = {
      discovered: {
        sentinel: { encounters: 1, defeated: 0, scannedAffinity: true, firstSeen: new Date().toISOString() },
        pyroclocker: { encounters: 1, defeated: 0, scannedAffinity: true, firstSeen: new Date().toISOString() },
        cryodrifter: { encounters: 1, defeated: 0, scannedAffinity: true, firstSeen: new Date().toISOString() },
        sparkharvester: { encounters: 1, defeated: 0, scannedAffinity: true, firstSeen: new Date().toISOString() }
      },
      scannedCount: 4,
      totalEntries: Object.keys(ENTITY_REGISTRY).length
    };
    saveBestiary(initial);
    return initial;
  }

  function saveBestiary(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {}
  }

  function recordEncounter(entityId, fullScan) {
    var bestiary = loadBestiary();
    var key = (entityId || '').toLowerCase().replace(/^(overclocked_|hybrid_)/, '');
    
    // Check if ID maps directly
    var regKey = null;
    for (var k in ENTITY_REGISTRY) {
      if (k === key || ENTITY_REGISTRY[k].name.toLowerCase() === key) {
        regKey = k;
        break;
      }
    }
    if (!regKey) regKey = 'sentinel';

    if (!bestiary.discovered[regKey]) {
      bestiary.discovered[regKey] = {
        encounters: 1,
        defeated: 0,
        scannedAffinity: !!fullScan,
        firstSeen: new Date().toISOString()
      };
      bestiary.scannedCount = Object.keys(bestiary.discovered).length;
    } else {
      bestiary.discovered[regKey].encounters += 1;
      if (fullScan) bestiary.discovered[regKey].scannedAffinity = true;
    }

    saveBestiary(bestiary);
    return bestiary;
  }

  function recordDefeat(entityId) {
    var bestiary = loadBestiary();
    var key = (entityId || '').toLowerCase();
    var regKey = null;
    for (var k in ENTITY_REGISTRY) {
      if (k === key || ENTITY_REGISTRY[k].name.toLowerCase() === key) {
        regKey = k;
        break;
      }
    }
    if (regKey && bestiary.discovered[regKey]) {
      bestiary.discovered[regKey].defeated += 1;
      saveBestiary(bestiary);
    }
  }

  function getAffinityBadge(val) {
    var v = (val || 'normal').toLowerCase();
    if (v === 'weak') return '<span style="color:#ff2b4e;font-weight:700;">WEAK</span>';
    if (v === 'res' || v === 'resist') return '<span style="color:#38bdf8;font-weight:700;">RES</span>';
    if (v === 'nul' || v === 'null') return '<span style="color:#94a3b8;font-weight:700;">NUL</span>';
    if (v === 'drain' || v === 'absorb') return '<span style="color:#34d399;font-weight:700;">DRAIN</span>';
    if (v === 'reflect') return '<span style="color:#facc15;font-weight:700;">REFL</span>';
    return '<span style="color:#64748b;">-</span>';
  }

  function renderBestiaryModal(onClose) {
    var bestiary = loadBestiary();
    var allKeys = Object.keys(ENTITY_REGISTRY);

    var overlay = document.createElement('div');
    overlay.id = 'bestiary-codex-modal';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(5,6,10,0.88);z-index:9999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(6px);font-family:JetBrains Mono,monospace;';

    var card = document.createElement('div');
    card.style.cssText = 'background:#0b0e17;border:2px solid #a855f7;padding:20px;max-width:760px;width:94%;max-height:88vh;display:flex;flex-direction:column;box-shadow:0 0 45px rgba(168,85,247,0.3);color:#c7d0e0;';

    var discCount = Object.keys(bestiary.discovered).length;
    var totalCount = allKeys.length;

    // Header
    var headerHtml = 
      '<div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #271a3d;padding-bottom:10px;margin-bottom:12px;">' +
        '<div>' +
          '<div style="font-size:14px;font-weight:800;color:#c084fc;letter-spacing:0.18em;">BESTIARY CODEX // ENTITY TELEMETRY MATRIX</div>' +
          '<div style="font-size:9px;color:#7e6b9e;">TACTICAL SCANNER ARCHIVE: ' + discCount + ' / ' + totalCount + ' DETECTED SIGNATURES</div>' +
        '</div>' +
        '<button id="close-bestiary" style="background:#201138;border:1px solid #4c297a;color:#c084fc;font-family:inherit;font-size:12px;padding:3px 10px;cursor:pointer;">✕</button>' +
      '</div>';

    // Left List (Entities) & Right Panel (Detail Telemetry)
    var bodyContainer = document.createElement('div');
    bodyContainer.style.cssText = 'display:grid;grid-template-columns:220px 1fr;gap:14px;flex:1;overflow:hidden;min-height:380px;';

    var listCol = document.createElement('div');
    listCol.style.cssText = 'overflow-y:auto;border-right:1px solid #1c182b;padding-right:8px;';

    var detailCol = document.createElement('div');
    detailCol.id = 'bestiary-detail-view';
    detailCol.style.cssText = 'overflow-y:auto;padding-left:6px;';

    var selectedKey = allKeys[0];
    for (var i = 0; i < allKeys.length; i++) {
      if (bestiary.discovered[allKeys[i]]) {
        selectedKey = allKeys[i];
        break;
      }
    }

    function renderDetail(key) {
      var entry = ENTITY_REGISTRY[key];
      var isDisc = !!bestiary.discovered[key];
      var discData = bestiary.discovered[key] || { encounters: 0, defeated: 0, scannedAffinity: false };

      if (!isDisc) {
        detailCol.innerHTML = 
          '<div style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#4c297a;text-align:center;">' +
            '<div style="font-size:32px;margin-bottom:10px;">[ ? ]</div>' +
            '<div style="font-size:11px;font-weight:700;letter-spacing:0.1em;color:#7e6b9e;">DATA CLASSIFIED // UNKNOWN PROCESS</div>' +
            '<div style="font-size:9px;color:#4c297a;max-width:280px;margin-top:6px;">Encounter this hostile daemon or synthesize it in the Fusion Chamber to unlock tactical telemetry.</div>' +
          '</div>';
        return;
      }

      var affTable = 
        '<div style="background:#06080f;border:1px solid #201736;padding:10px;margin-top:12px;margin-bottom:12px;">' +
          '<div style="font-size:9px;font-weight:700;color:#7e6b9e;margin-bottom:8px;letter-spacing:0.1em;">TACTICAL AFFINITY MATRIX:</div>' +
          '<div style="display:grid;grid-template-columns:repeat(5, 1fr);gap:6px;text-align:center;font-size:10px;">' +
            '<div style="background:#110e20;padding:4px;border:1px solid #271a3d;"><div style="font-size:8px;color:#94a3b8;">KIN</div>' + getAffinityBadge(entry.aff.kinetic) + '</div>' +
            '<div style="background:#110e20;padding:4px;border:1px solid #271a3d;"><div style="font-size:8px;color:#f97316;">THM</div>' + getAffinityBadge(entry.aff.thermal) + '</div>' +
            '<div style="background:#110e20;padding:4px;border:1px solid #271a3d;"><div style="font-size:8px;color:#38bdf8;">CRY</div>' + getAffinityBadge(entry.aff.cryo) + '</div>' +
            '<div style="background:#110e20;padding:4px;border:1px solid #271a3d;"><div style="font-size:8px;color:#facc15;">VOL</div>' + getAffinityBadge(entry.aff.volt) + '</div>' +
            '<div style="background:#110e20;padding:4px;border:1px solid #271a3d;"><div style="font-size:8px;color:#c084fc;">VOI</div>' + getAffinityBadge(entry.aff.void) + '</div>' +
          '</div>' +
        '</div>';

      var skillsHtml = (entry.skills || []).map(function(s) {
        return '<span style="display:inline-block;background:#18102b;border:1px solid #3c1e69;padding:2px 6px;margin:2px 4px 2px 0;font-size:9px;color:#d8b4fe;">' + s + '</span>';
      }).join('');

      var typeBadge = '<span style="background:#2c154a;color:#c084fc;padding:2px 6px;font-size:8px;font-weight:700;margin-left:6px;">TIER ' + entry.tier + ' ' + entry.type.toUpperCase() + '</span>';

      detailCol.innerHTML = 
        '<div style="display:flex;align-items:center;border-bottom:1px solid #201736;padding-bottom:8px;">' +
          '<div style="width:14px;height:14px;background:' + entry.col + ';box-shadow:0 0 10px ' + entry.glow + ';margin-right:8px;border-radius:2px;"></div>' +
          '<div>' +
            '<div style="font-size:13px;font-weight:800;color:' + entry.glow + ';letter-spacing:0.1em;">' + entry.name + typeBadge + '</div>' +
            '<div style="font-size:9px;color:#7e6b9e;">' + entry.classTitle + '</div>' +
          '</div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-top:10px;text-align:center;font-size:10px;">' +
          '<div style="background:#070a12;border:1px solid #1c182b;padding:6px;"><span style="color:#5a6478;font-size:8px;">EST. INTEGRITY</span><div style="font-weight:700;color:#ff2b4e;">' + entry.hp + ' HP</div></div>' +
          '<div style="background:#070a12;border:1px solid #1c182b;padding:6px;"><span style="color:#5a6478;font-size:8px;">SP CAPACITY</span><div style="font-weight:700;color:#38bdf8;">' + entry.sp + ' SP</div></div>' +
          '<div style="background:#070a12;border:1px solid #1c182b;padding:6px;"><span style="color:#5a6478;font-size:8px;">ATTACK COEFFICIENT</span><div style="font-weight:700;color:#facc15;">' + entry.atk + ' ATK</div></div>' +
        '</div>' +
        affTable +
        '<div style="margin-bottom:10px;">' +
          '<div style="font-size:9px;font-weight:700;color:#7e6b9e;margin-bottom:4px;letter-spacing:0.08em;">IDENTIFIED SUBROUTINES:</div>' +
          '<div>' + skillsHtml + '</div>' +
        '</div>' +
        '<div style="background:#070913;border-left:2px solid #a855f7;padding:8px 10px;margin-bottom:12px;">' +
          '<div style="font-size:8px;color:#7e6b9e;margin-bottom:2px;letter-spacing:0.1em;">TELEMETRY LOG ARCHIVE:</div>' +
          '<div style="font-size:10px;line-height:1.4;color:#a5b4fc;">' + entry.lore + '</div>' +
        '</div>' +
        '<div style="display:flex;justify-content:space-between;font-size:8px;color:#5a6478;border-top:1px solid #1c182b;padding-top:6px;">' +
          '<span>ENGAGEMENTS: ' + discData.encounters + '</span>' +
          '<span>NEUTRALIZATIONS: ' + discData.defeated + '</span>' +
          '<span>DISCOVERED: ' + (discData.firstSeen ? discData.firstSeen.substring(0, 10) : 'ARCHIVE') + '</span>' +
        '</div>';
    }

    // Populate Entity List
    allKeys.forEach(function(k) {
      var item = ENTITY_REGISTRY[k];
      var isDisc = !!bestiary.discovered[k];
      var btn = document.createElement('div');
      btn.style.cssText = 'padding:6px 8px;margin-bottom:4px;border:1px solid #1c182b;background:#080b13;cursor:pointer;display:flex;align-items:center;justify-content:space-between;transition:all 0.15s ease;font-size:10px;';
      
      var nameLabel = isDisc ? item.name : 'UNKNOWN [' + item.tier + ']';
      var tagColor = isDisc ? item.glow : '#3b2554';
      var dot = '<div style="width:6px;height:6px;border-radius:50%;background:' + (isDisc ? item.col : '#271a3d') + ';margin-right:6px;"></div>';

      btn.innerHTML = '<div style="display:flex;align-items:center;">' + dot + '<span style="color:' + tagColor + ';font-weight:600;">' + nameLabel + '</span></div><span style="font-size:8px;color:#4c297a;">T' + item.tier + '</span>';

      btn.onmouseenter = function() {
        if (selectedKey !== k) btn.style.borderColor = '#7e6b9e';
      };
      btn.onmouseleave = function() {
        if (selectedKey !== k) btn.style.borderColor = '#1c182b';
      };
      btn.onclick = function() {
        selectedKey = k;
        var children = listCol.children;
        for (var c = 0; c < children.length; c++) {
          children[c].style.borderColor = '#1c182b';
          children[c].style.background = '#080b13';
        }
        btn.style.borderColor = '#c084fc';
        btn.style.background = '#150f24';
        renderDetail(k);
      };

      if (k === selectedKey) {
        btn.style.borderColor = '#c084fc';
        btn.style.background = '#150f24';
      }

      listCol.appendChild(btn);
    });

    bodyContainer.appendChild(listCol);
    bodyContainer.appendChild(detailCol);

    card.innerHTML = headerHtml;
    card.appendChild(bodyContainer);

    var footerHtml = document.createElement('div');
    footerHtml.style.cssText = 'border-top:1px solid #201736;padding-top:10px;margin-top:12px;text-align:right;';
    footerHtml.innerHTML = '<button id="close-bestiary-btn" style="background:#201138;border:1px solid #a855f7;color:#fff;font-family:inherit;font-size:10px;font-weight:700;padding:6px 16px;cursor:pointer;">CLOSE SCANNER</button>';
    card.appendChild(footerHtml);

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    renderDetail(selectedKey);

    function cleanup() {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      if (typeof onClose === 'function') onClose();
    }

    document.getElementById('close-bestiary').onclick = cleanup;
    document.getElementById('close-bestiary-btn').onclick = cleanup;
  }

  root.BestiaryCodex = {
    ENTITY_REGISTRY: ENTITY_REGISTRY,
    loadBestiary: loadBestiary,
    saveBestiary: saveBestiary,
    recordEncounter: recordEncounter,
    recordDefeat: recordDefeat,
    renderBestiaryModal: renderBestiaryModal
  };

})(typeof window !== 'undefined' ? window : this);
