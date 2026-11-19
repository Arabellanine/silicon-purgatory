/* ============================================================================
 * endless_spire.js — Silicon Purgatory :: Endless Abyssal Spire Mode
 * Zero-dependency, self-contained ES6 module. Exposes window.EndlessSpire.
 * Implements infinite floor descent (Floors 11+), adaptive enemy scaling,
 * extraction beacon risk/reward multiplier mechanics, and local leaderboard telemetry.
 * ============================================================================ */
(function(root) {
  'use strict';

  var STORAGE_KEY = 'silicon_purgatory_spire_records';

  var SPIRE_MODIFIERS = [
    {
      name: 'FLUX CONDENSATION',
      badge: 'CONDENSATION',
      desc: 'Abyssal gravity doubles SP costs but increases critical strike rate.',
      color: '#49e2ff',
      bg: '#04121a'
    },
    {
      name: 'CORROSIVE STATIC',
      badge: 'STATIC',
      desc: 'Ambient voltage chips 2% integrity every 5 turns; Void attacks +20% damage.',
      color: '#ffc14d',
      bg: '#141005'
    },
    {
      name: 'THERMAL INVERSION',
      badge: 'INVERSION',
      desc: 'Thermal elements deal frost damage; kinetic resistance reduced across all units.',
      color: '#ff2b4e',
      bg: '#18040a'
    },
    {
      name: 'SINGULARITY ECHO',
      badge: 'SINGULARITY',
      desc: 'Actions generate Press Turn resonance; enemies gain 1 additional action cycle.',
      color: '#a35aff',
      bg: '#12051a'
    },
    {
      name: 'APOCALYPSE PURGE',
      badge: 'APOCALYPSE',
      desc: 'Maximum depth entropy. Archon residual radiation surges across all hostiles.',
      color: '#ff0055',
      bg: '#20020d'
    }
  ];

  function getDepth(floor) {
    return Math.max(0, (floor || 1) - 10);
  }

  function isSpireFloor(floor) {
    return (floor || 1) >= 11;
  }

  function getScaling(floor) {
    var depth = getDepth(floor);
    if (depth <= 0) {
      return {
        depth: 0,
        hpMultiplier: 1.0,
        atkMultiplier: 1.0,
        defMultiplier: 1.0,
        spdMultiplier: 1.0,
        relicMultiplier: 1.0,
        fragmentRewardBase: 30,
        dangerTier: 'STANDARD SANCTUM'
      };
    }

    var hpMult = parseFloat((Math.pow(1.14, depth) * (1 + depth * 0.03)).toFixed(2));
    var atkMult = parseFloat((Math.pow(1.09, depth) + (depth * 0.04)).toFixed(2));
    var defMult = parseFloat((Math.pow(1.07, depth) + (depth * 0.02)).toFixed(2));
    var spdMult = parseFloat(Math.min(2.2, 1.0 + (depth * 0.03)).toFixed(2));
    var relicMult = parseFloat((1.0 + (depth * 0.25)).toFixed(2));
    var fragments = Math.floor(45 * Math.pow(1.15, depth));

    var dangerTier = 'ABYSSAL TIER I';
    if (depth >= 15) dangerTier = 'VOID CATACLYSM [MAX]';
    else if (depth >= 10) dangerTier = 'ARCHON EXTINCTION TIER';
    else if (depth >= 6) dangerTier = 'ABYSSAL TIER III';
    else if (depth >= 3) dangerTier = 'ABYSSAL TIER II';

    return {
      depth: depth,
      hpMultiplier: hpMult,
      atkMultiplier: atkMult,
      defMultiplier: defMult,
      spdMultiplier: spdMult,
      relicMultiplier: relicMult,
      fragmentRewardBase: fragments,
      dangerTier: dangerTier
    };
  }

  function getSpireModifier(seed, floor) {
    var depth = getDepth(floor);
    if (depth <= 0) return null;
    var idx = (depth - 1) % SPIRE_MODIFIERS.length;
    var mod = SPIRE_MODIFIERS[idx];
    return {
      name: mod.name + ' [D+' + depth + ']',
      badge: mod.badge + '+' + depth,
      desc: mod.desc,
      color: mod.color,
      bg: mod.bg,
      depth: depth
    };
  }

  function loadRecords() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed.maxDepth === 'number') return parsed;
      }
    } catch (e) {}

    return {
      maxDepth: 0,
      highestFloor: 10,
      totalRuns: 0,
      totalExtractions: 0,
      highestFragmentsExtracted: 0,
      highestMultiplier: 1.0,
      history: []
    };
  }

  function saveRecords(records) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch (e) {}
  }

  function recordRun(floor, fragmentsExtracted, multiplier, status) {
    var records = loadRecords();
    var depth = getDepth(floor);

    records.totalRuns += 1;
    if (status === 'EXTRACTED') {
      records.totalExtractions += 1;
      if (fragmentsExtracted > records.highestFragmentsExtracted) {
        records.highestFragmentsExtracted = fragmentsExtracted;
      }
    }
    if (depth > records.maxDepth) {
      records.maxDepth = depth;
      records.highestFloor = floor;
    }
    if (multiplier > records.highestMultiplier) {
      records.highestMultiplier = multiplier;
    }

    var entry = {
      timestamp: new Date().toISOString(),
      floor: floor,
      depth: depth,
      fragments: fragmentsExtracted,
      multiplier: multiplier,
      status: status || 'EXTRACTED'
    };

    records.history.unshift(entry);
    if (records.history.length > 10) records.history.pop();

    saveRecords(records);
    return records;
  }

  function renderRecordsModal(onClose) {
    var records = loadRecords();
    var overlay = document.createElement('div');
    overlay.id = 'spire-records-modal';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(5,6,10,0.85);z-index:9999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);font-family:JetBrains Mono,monospace;';

    var card = document.createElement('div');
    card.style.cssText = 'background:#0c0f17;border:2px solid #49e2ff;padding:20px;max-width:540px;width:92%;box-shadow:0 0 35px rgba(73,226,255,0.25);color:#c7d0e0;';

    var rows = '';
    if (records.history.length === 0) {
      rows = '<div style="font-size:11px;color:#5a6478;padding:12px 0;">No Endless Spire dives recorded yet. Breach Floor 11+ to record descent telemetry.</div>';
    } else {
      records.history.forEach(function(h) {
        var isExt = h.status === 'EXTRACTED';
        var col = isExt ? '#49e2ff' : '#ff2b4e';
        rows += '<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #1c2438;font-size:10px;">' +
          '<span>DEPTH +' + h.depth + ' (FL ' + h.floor + ')</span>' +
          '<span style="color:' + col + ';font-weight:700;">' + h.status + '</span>' +
          '<span style="color:#ffc14d;">' + h.fragments + ' FRAGS (' + h.multiplier + 'x)</span>' +
          '</div>';
      });
    }

    card.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #1c2438;padding-bottom:8px;margin-bottom:12px;">' +
        '<div style="font-size:13px;font-weight:800;color:#49e2ff;letter-spacing:0.15em;">ENDLESS ABYSSAL SPIRE // HIGH-WATERMARK</div>' +
        '<button id="close-spire-rec" style="background:#161d2d;border:1px solid #27344d;color:#fff;font-family:inherit;font-size:11px;padding:2px 8px;cursor:pointer;">✕</button>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:16px;">' +
        '<div style="background:#06080d;border:1px solid #1c2438;padding:8px;text-align:center;">' +
          '<div style="font-size:9px;color:#5a6478;">MAX DEPTH</div>' +
          '<div style="font-size:16px;font-weight:800;color:#ff2b4e;">+' + records.maxDepth + '</div>' +
          '<div style="font-size:8px;color:#5a6478;">FLOOR ' + records.highestFloor + '</div>' +
        '</div>' +
        '<div style="background:#06080d;border:1px solid #1c2438;padding:8px;text-align:center;">' +
          '<div style="font-size:9px;color:#5a6478;">EXTRACTIONS</div>' +
          '<div style="font-size:16px;font-weight:800;color:#49e2ff;">' + records.totalExtractions + ' / ' + records.totalRuns + '</div>' +
          '<div style="font-size:8px;color:#5a6478;">SUCCESS ' + (records.totalRuns ? Math.round((records.totalExtractions / records.totalRuns)*100) : 0) + '%</div>' +
        '</div>' +
        '<div style="background:#06080d;border:1px solid #1c2438;padding:8px;text-align:center;">' +
          '<div style="font-size:9px;color:#5a6478;">TOP FRAGMENTS</div>' +
          '<div style="font-size:16px;font-weight:800;color:#ffc14d;">' + records.highestFragmentsExtracted + '</div>' +
          '<div style="font-size:8px;color:#5a6478;">PEAK ' + records.highestMultiplier + 'x</div>' +
        '</div>' +
      '</div>' +
      '<div style="font-size:10px;font-weight:700;color:#5a6478;margin-bottom:6px;letter-spacing:0.1em;">RECENT DESCENT LOGS:</div>' +
      '<div style="max-height:160px;overflow-y:auto;margin-bottom:16px;">' + rows + '</div>' +
      '<div style="text-align:right;">' +
        '<button id="close-spire-rec-btn" style="background:#135d6e;border:1px solid #49e2ff;color:#fff;font-family:inherit;font-size:10px;font-weight:700;padding:6px 14px;cursor:pointer;">RETURN TO COCKPIT</button>' +
      '</div>';

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    function cleanup() {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      if (typeof onClose === 'function') onClose();
    }

    document.getElementById('close-spire-rec').onclick = cleanup;
    document.getElementById('close-spire-rec-btn').onclick = cleanup;
  }

  root.EndlessSpire = {
    getDepth: getDepth,
    isSpireFloor: isSpireFloor,
    getScaling: getScaling,
    getSpireModifier: getSpireModifier,
    loadRecords: loadRecords,
    saveRecords: saveRecords,
    recordRun: recordRun,
    renderRecordsModal: renderRecordsModal
  };

})(typeof window !== 'undefined' ? window : this);
