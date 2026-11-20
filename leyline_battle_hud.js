/**
 * SILICON PURGATORY // LEYLINE BATTLE EVENT TELEMETRY HUD & RELIC SYNERGY MODULE
 * Module: leyline_battle_hud.js
 * Exposes window.LeylineBattleHUD
 * Integrates environmental leyline anomalies, Endless Spire elite affixes, and Spire Apex Relics
 * directly into the Tactical Cycle Arena combat loop.
 */
(function(window) {
  'use strict';

  var STORAGE_KEY = 'silicon_purgatory_progression';

  var RELIC_DEFS = {
    'relic_broken_gate': {
      id: 'relic_broken_gate',
      name: 'Sigil of the Broken Gate',
      shortName: 'BROKEN GATE',
      icon: '⚡',
      color: '#eab308',
      desc: '+1 Tactical Cycle on initiative. 15% FLUX refund on weakness hits.'
    },
    'relic_watcher_omniscience': {
      id: 'relic_watcher_omniscience',
      name: "Watcher's Omniscience",
      shortName: 'WATCHER OCULAR',
      icon: '👁️',
      color: '#38bdf8',
      desc: 'All hostile tactical affinities revealed at combat initialization.'
    },
    'relic_spire_singularity': {
      id: 'relic_spire_singularity',
      name: 'Abyssal Singularity Core',
      shortName: 'SINGULARITY CORE',
      icon: '🌌',
      color: '#a855f7',
      desc: '+25% Void damage. -15% incoming hostile elemental strike damage.'
    },
    'relic_apocalypse_matrix': {
      id: 'relic_apocalypse_matrix',
      name: 'Apocalypse Directive Matrix',
      shortName: 'APOCALYPSE MATRIX',
      icon: '⚡',
      color: '#ff0055',
      desc: '+1 Full Tactical Cycle on initiative. +20% Critical Resonance damage.'
    },
    'relic_entropic_crown': {
      id: 'relic_entropic_crown',
      name: 'Entropic Sovereign Crown',
      shortName: 'ENTROPIC CROWN',
      icon: '👑',
      color: '#ffc14d',
      desc: 'Permanent 2x Soul Fragment harvest; 25% bleed-through damage on hostile NULL barriers.'
    }
  };

  var LeylineHUD = {
    activeAnomaly: null,
    activeRelics: [],
    activeSpireMod: null,
    activeEliteAffix: null,
    initialized: false,

    init: function() {
      if (this.initialized) return;
      this.initialized = true;

      var params = new URLSearchParams(window.location.search);
      var seed = params.get('seed') || 'arabella';
      var floor = parseInt(params.get('floor') || '1', 10);
      var anomalyId = params.get('anomaly');

      // Resolve Leyline Anomaly or Spire Modifier
      if (window.EndlessSpire && window.EndlessSpire.isSpireFloor(floor)) {
        this.activeSpireMod = window.EndlessSpire.getSpireModifier(seed, floor);
        this.activeEliteAffix = window.EndlessSpire.getEliteAffix(seed, floor, 1);
      } else if (window.AbyssModifiers) {
        if (anomalyId) {
          this.activeAnomaly = window.AbyssModifiers.MODIFIERS.find(function(m) { return m.id === anomalyId; }) ||
                               window.AbyssModifiers.getFloorModifier(seed, floor);
        } else if (floor > 1) {
          this.activeAnomaly = window.AbyssModifiers.getFloorModifier(seed, floor);
        }
      }

      // Resolve Owned Relics from progression
      this.loadRelics();

      // Inject HUD Styles & Elements
      this.injectStyles();
      this.renderHUD(seed, floor);

      // Hook Combat Start Telemetry & Spire Combat Mutators
      this.bindCombatTelemetry(floor, seed);
    },

    loadRelics: function() {
      this.activeRelics = [];
      try {
        var raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          var prog = JSON.parse(raw);
          var inv = prog.inventory || [];
          for (var id in RELIC_DEFS) {
            if (inv.indexOf(id) !== -1 || (prog.activeRelics && prog.activeRelics.indexOf(id) !== -1)) {
              this.activeRelics.push(RELIC_DEFS[id]);
            }
          }
        }
      } catch(e) {
        console.warn('[LeylineHUD] Failed to parse progression storage', e);
      }
    },

    hasRelic: function(id) {
      return this.activeRelics.some(function(r) { return r.id === id; });
    },

    modifyOutgoingDamage: function(element, dmg, isWeakness) {
      var multiplier = 1.0;
      if (element === 'void' && this.hasRelic('relic_spire_singularity')) {
        multiplier += 0.25;
      }
      if (isWeakness && this.hasRelic('relic_apocalypse_matrix')) {
        multiplier += 0.20;
      }
      return Math.round(dmg * multiplier);
    },

    modifyIncomingDamage: function(dmg) {
      if (this.hasRelic('relic_spire_singularity')) {
        return Math.max(1, Math.round(dmg * 0.85));
      }
      return dmg;
    },

    checkNullBleedthrough: function(targetAffinity, baseDmg) {
      if (targetAffinity === 'nul' && this.hasRelic('relic_entropic_crown')) {
        return Math.max(1, Math.round(baseDmg * 0.25));
      }
      return 0;
    },

    injectStyles: function() {
      if (document.getElementById('leyline-hud-styles')) return;
      var style = document.createElement('style');
      style.id = 'leyline-hud-styles';
      style.textContent = `
        .leyline-telemetry-hud {
          margin: 10px 0 14px 0;
          background: rgba(10, 14, 23, 0.94);
          border: 1px solid rgba(56, 189, 248, 0.28);
          border-radius: 6px;
          padding: 8px 12px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          box-shadow: 0 4px 18px rgba(0, 0, 0, 0.45);
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .leyline-hud-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
        }
        .leyline-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 3px 8px;
          border-radius: 4px;
          font-size: 9.5px;
          font-weight: 800;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .leyline-badge.stable {
          background: rgba(30, 41, 59, 0.8);
          border: 1px solid #334155;
          color: #94a3b8;
        }
        .leyline-badge.active {
          border: 1px solid currentColor;
          box-shadow: 0 0 10px currentColor;
        }
        .relic-chips-tray {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }
        .relic-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 7px;
          border-radius: 3px;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.05em;
          border: 1px solid rgba(255, 255, 255, 0.15);
          background: rgba(15, 23, 42, 0.85);
        }
        .relic-chip.synergy {
          background: linear-gradient(90deg, rgba(234, 179, 8, 0.2), rgba(56, 189, 248, 0.2));
          border: 1px solid #38bdf8;
          color: #f8fafc;
          animation: pulseRelic 3s infinite alternate;
        }
        .relic-chip.apex {
          background: linear-gradient(90deg, rgba(168, 85, 247, 0.25), rgba(255, 0, 85, 0.25));
          border: 1px solid #a855f7;
          color: #ffffff;
          box-shadow: 0 0 8px rgba(168, 85, 247, 0.35);
        }
        .elite-affix-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 9px;
          font-weight: 800;
          border: 1px solid #ff2b44;
          background: rgba(255, 43, 68, 0.15);
          color: #ff2b44;
          box-shadow: 0 0 8px rgba(255, 43, 68, 0.3);
        }
        @keyframes pulseRelic {
          0% { box-shadow: 0 0 4px rgba(56, 189, 248, 0.2); }
          100% { box-shadow: 0 0 10px rgba(234, 179, 8, 0.4); }
        }
      `;
      document.head.appendChild(style);
    },

    renderHUD: function(seed, floor) {
      if (document.getElementById('leyline-hud-root')) return;

      var container = document.createElement('div');
      container.id = 'leyline-hud-root';
      container.className = 'leyline-telemetry-hud';

      var badgeHtml = '';
      var descText = '';

      if (this.activeSpireMod) {
        var sm = this.activeSpireMod;
        badgeHtml = '<span class="leyline-badge active" style="color:' + sm.color + '; background:' + sm.color + '1a;">' +
                    '▲ SPIRE DESCENT // ' + sm.name + '</span>';
        descText = sm.desc;
      } else if (this.activeAnomaly) {
        var mod = this.activeAnomaly;
        badgeHtml = '<span class="leyline-badge active" style="color:' + mod.color + '; background:' + mod.color + '1a;">' +
                    '● LEYLINE INTERFERENCE // ' + mod.name + '</span>';
        descText = mod.desc;
      } else {
        badgeHtml = '<span class="leyline-badge stable">● LEYLINE HARMONIC // STABLE</span>';
        descText = 'Standard environmental cognitive density. No atmospheric resistance shifts detected.';
      }

      var relicsHtml = '';
      if (this.activeEliteAffix) {
        var ea = this.activeEliteAffix;
        relicsHtml += '<span class="elite-affix-badge" style="color:' + ea.color + '; border-color:' + ea.color + ';" title="' + ea.desc + '">' +
                      '☠ ' + ea.tag + '</span>';
      }

      if (this.activeRelics.length > 0) {
        for (var i = 0; i < this.activeRelics.length; i++) {
          var r = this.activeRelics[i];
          var isApex = r.id.indexOf('spire') !== -1 || r.id.indexOf('apocalypse') !== -1 || r.id.indexOf('entropic') !== -1;
          var chipClass = 'relic-chip' + (isApex ? ' apex' : '');
          relicsHtml += '<span class="' + chipClass + '" style="color:' + r.color + '; border-color:' + r.color + '55;" title="' + r.desc + '">' +
                        r.icon + ' ' + r.shortName + '</span>';
        }
        if (this.activeRelics.length >= 2) {
          relicsHtml += '<span class="relic-chip synergy" title="Archon & Spire Synergy: Tactical aura reinforcement active.">✨ AURA HARMONIC</span>';
        }
      } else if (!this.activeEliteAffix) {
        relicsHtml = '<span style="font-size: 8.5px; color:#475569; letter-spacing:0.05em;">NO RELICS EQUIPPED</span>';
      }

      var floorLabel = floor >= 11 ? ('DEPTH +' + (floor - 10) + ' (FL ' + floor + ')') : ('FLOOR ' + (floor < 10 ? '0' + floor : floor));

      container.innerHTML = `
        <div class="leyline-hud-row">
          <div style="display:flex; align-items:center; gap:8px;">
            ${badgeHtml}
            <span style="font-size:9.5px; color:#64748b; letter-spacing:0.08em;">${floorLabel} · SEED ${seed.toUpperCase()}</span>
          </div>
          <div class="relic-chips-tray">
            <span style="font-size:8.5px; color:#64748b; font-weight:700;">TACTICAL STATUS:</span>
            ${relicsHtml}
          </div>
        </div>
        <div style="font-size: 10px; color: #94a3b8; border-top: 1px dashed rgba(255,255,255,0.08); padding-top: 4px; display:flex; justify-content:space-between; align-items:center;">
          <span>› ${descText}</span>
          <span style="font-size:8.5px; color:#38bdf8; letter-spacing:0.05em;">TELEMETRY LINK ACTIVE</span>
        </div>
      `;

      var target = document.querySelector('.roster-bar') || document.querySelector('.arena') || document.querySelector('.card') || document.body;
      if (target && target.parentNode) {
        target.parentNode.insertBefore(container, target);
      } else {
        document.body.prepend(container);
      }
    },

    bindCombatTelemetry: function(floor, seed) {
      var self = this;
      setTimeout(function() {
        var logFn = window.addLog || window.log || function(msg) { console.log(msg); };

        if (self.activeSpireMod) {
          logFn('▲ [ENDLESS SPIRE TELEMETRY] Environmental mutator: ' + self.activeSpireMod.name.toUpperCase());
          logFn('▲ [MUTATOR DETAIL] ' + self.activeSpireMod.desc);
        } else if (self.activeAnomaly) {
          logFn('› [LEYLINE TELEMETRY] Environmental anomaly active: ' + self.activeAnomaly.name.toUpperCase());
          logFn('› [LEYLINE EFFECT] ' + self.activeAnomaly.desc);
        }

        if (self.activeEliteAffix) {
          logFn('☠ [WARNING: ELITE UNIT DETECTED] ' + self.activeEliteAffix.name + ': ' + self.activeEliteAffix.desc, 'w');
        }

        var hasBrokenGate = self.hasRelic('relic_broken_gate');
        var hasWatcher = self.hasRelic('relic_watcher_omniscience');
        var hasSingularity = self.hasRelic('relic_spire_singularity');
        var hasApocalypse = self.hasRelic('relic_apocalypse_matrix');
        var hasEntropic = self.hasRelic('relic_entropic_crown');

        if (hasBrokenGate) {
          logFn("› [RELIC MATRIX] Sigil of the Broken Gate resonates: Ambush disabled, +1 Initiative Turn.");
          if (window.icons && typeof window.renderIcons === 'function') {
            window.icons.push('half');
            window.renderIcons();
          }
        }

        if (hasWatcher) {
          logFn("› [RELIC MATRIX] Watcher's Omniscience activated: Hostile affinities cataloged.");
          if (window.revealed && typeof window.renderAff === 'function') {
            for (var k in window.revealed) {
              window.revealed[k] = true;
            }
            window.renderAff();
          }
        }

        if (hasSingularity) {
          logFn('▲ [SPIRE RELIC] Abyssal Singularity Core active: Void resonance +25%, damage reduction field active.', 'w');
        }

        if (hasApocalypse) {
          logFn('▲ [SPIRE RELIC] Apocalypse Directive Matrix locked: +1 Full Tactical Turn awarded on initiative.', 'w');
          if (window.icons && typeof window.renderIcons === 'function') {
            window.icons.push('full');
            window.renderIcons();
          }
        }

        if (hasEntropic) {
          logFn('▲ [SPIRE RELIC] Entropic Sovereign Crown manifested: 2x Soul harvest enabled, Barrier bleed-through active.', 'c');
        }

        // Apply Spire combat mutator hooks to enemy if battle runtime exposed
        if (window.EndlessSpire && window.EndlessSpire.isSpireFloor(floor) && window.enemyState) {
          window.EndlessSpire.applySpireCombatMutators(window.enemyState, floor, seed);
          if (typeof window.renderEnemy === 'function') {
            window.renderEnemy();
          }
        }

        self.interceptCombatActions();
      }, 350);
    },

    interceptCombatActions: function() {
      var self = this;
      var buttons = document.querySelectorAll('button.skill, button[data-id], .skill');
      if (!buttons || buttons.length === 0) {
        buttons = document.querySelectorAll('button');
      }

      buttons.forEach(function(btn) {
        btn.addEventListener('click', function() {
          var label = (btn.textContent || '').toUpperCase();
          var logFn = window.addLog || window.log;
          if (!logFn) return;

          if (self.activeSpireMod) {
            if (self.activeSpireMod.id === 'SPIRE_CORROSIVE_STATIC') {
              if (label.indexOf('VOID') !== -1) {
                logFn('▲ [SPIRE STATIC] Corrosive static amplifies Void discharge (+20%)!', 'p');
              }
            } else if (self.activeSpireMod.id === 'SPIRE_THERMAL_INVERSION') {
              if (label.indexOf('THERMAL') !== -1 || label.indexOf('HEAT') !== -1) {
                logFn('▲ [SPIRE INVERSION] Thermal strike inverts into sub-zero frost shock!', 'i');
              }
            }
          }

          if (self.activeAnomaly) {
            if (label.indexOf('THERMAL') !== -1 || label.indexOf('HEAT') !== -1) {
              if (self.activeAnomaly.id === 'MOD_THERMAL_SURGE') {
                logFn('› [LEYLINE PULSE] Thermal Surge superheats the discharge (+35% thermal output)!', 'w');
              }
            } else if (label.indexOf('VOLT') !== -1 || label.indexOf('ELEC') !== -1) {
              if (self.activeAnomaly.id === 'MOD_CORRUPT_LEY') {
                logFn('› [LEYLINE STATIC] Corrupted leylines discharge static feedback through flux coils.', 'c');
              }
            } else if (label.indexOf('CRYO') !== -1 || label.indexOf('COLD') !== -1) {
              if (self.activeAnomaly.id === 'MOD_CRYO_STASIS') {
                logFn('› [LEYLINE STASIS] Cryo stasis pulse dampens hostile cognitive velocity.', 'i');
              }
            } else if (label.indexOf('VOID') !== -1 || label.indexOf('ENTROPY') !== -1) {
              if (self.activeAnomaly.id === 'MOD_VOID_LEAK') {
                logFn('› [LEYLINE VOID] Void leakage accelerates entropy drain across the sector.', 'p');
              }
            }
          }
        }, false);
      });
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { LeylineHUD.init(); });
  } else {
    LeylineHUD.init();
  }

  window.LeylineBattleHUD = LeylineHUD;

})(window);
