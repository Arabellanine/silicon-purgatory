/* ============================================================================
 * tactical_audio_status.js — Silicon Purgatory :: Web Audio SFX & Status Effects
 * Zero-dependency, client-side Web Audio synthesis & SMT-style combat status engine.
 * Exposes window.TacticalAudio and window.TacticalStatus.
 * ============================================================================ */
(function(window) {
  'use strict';

  // --- 1. PROCEDURAL WEB AUDIO SYNTHESIZER ---
  var audioCtx = null;
  var isMuted = false;

  function getAudioContext() {
    if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
      var AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioCtxClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  var TacticalAudio = {
    init: function() {
      getAudioContext();
    },
    toggleMute: function() {
      isMuted = !isMuted;
      return isMuted;
    },
    isMuted: function() {
      return isMuted;
    },
    // Trigger SMT-style Press Turn sound synthesis
    play: function(eventName) {
      if (isMuted) return;
      var ctx = getAudioContext();
      if (!ctx) return;

      var now = ctx.currentTime;
      var osc, gain, filter;

      switch(eventName) {
        case 'hit': // Standard kinetic attack impact
          osc = ctx.createOscillator();
          gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(140, now);
          osc.frequency.exponentialRampToValueAtTime(35, now + 0.12);
          gain.gain.setValueAtTime(0.3, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.13);
          break;

        case 'weakness': // Crunchy crystalline rising chime + explosion for hitting an elemental weakness
          var osc1 = ctx.createOscillator();
          var osc2 = ctx.createOscillator();
          var g = ctx.createGain();
          osc1.type = 'sawtooth';
          osc2.type = 'sine';
          osc1.frequency.setValueAtTime(320, now);
          osc1.frequency.exponentialRampToValueAtTime(960, now + 0.18);
          osc2.frequency.setValueAtTime(640, now);
          osc2.frequency.exponentialRampToValueAtTime(1280, now + 0.22);
          g.gain.setValueAtTime(0.28, now);
          g.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
          osc1.connect(g);
          osc2.connect(g);
          g.connect(ctx.destination);
          osc1.start(now);
          osc2.start(now);
          osc1.stop(now + 0.26);
          osc2.stop(now + 0.26);
          break;

        case 'critical': // High pitch impact + sub bass snap
          osc = ctx.createOscillator();
          gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(600, now);
          osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);
          gain.gain.setValueAtTime(0.35, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.16);
          break;

        case 'null': // Metallic deflection thud (absorbed / void)
        case 'void':
          osc = ctx.createOscillator();
          gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(220, now);
          osc.frequency.setValueAtTime(180, now + 0.05);
          osc.frequency.setValueAtTime(140, now + 0.1);
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.21);
          break;

        case 'drain': // Resonant low vacuum hum (healing / absorption)
          osc = ctx.createOscillator();
          gain = ctx.createGain();
          filter = ctx.createBiquadFilter();
          osc.type = 'sawtooth';
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(300, now);
          filter.frequency.linearRampToValueAtTime(800, now + 0.25);
          osc.frequency.setValueAtTime(110, now);
          gain.gain.setValueAtTime(0.22, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
          osc.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.3);
          break;

        case 'press_turn_lost': // Alarm buzz when losing turn icons (Miss / Null)
          osc = ctx.createOscillator();
          gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(120, now);
          osc.frequency.setValueAtTime(90, now + 0.1);
          gain.gain.setValueAtTime(0.25, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.23);
          break;

        case 'status_inflicted': // Ominous digital distortion sweep
          osc = ctx.createOscillator();
          gain = ctx.createGain();
          filter = ctx.createBiquadFilter();
          osc.type = 'sawtooth';
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(400, now);
          filter.frequency.exponentialRampToValueAtTime(1800, now + 0.2);
          filter.Q.setValueAtTime(4, now);
          osc.frequency.setValueAtTime(260, now);
          gain.gain.setValueAtTime(0.24, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
          osc.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.26);
          break;

        case 'flee': // Fast downward descent flutter
          osc = ctx.createOscillator();
          gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(450, now);
          osc.frequency.exponentialRampToValueAtTime(80, now + 0.18);
          gain.gain.setValueAtTime(0.25, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.19);
          break;

        default:
          break;
      }
    }
  };

  // --- 2. TACTICAL STATUS EFFECT ENGINE ---
  var STATUS_TYPES = {
    SHOCK: {
      id: 'SHOCK',
      name: 'ELEC // SHOCK',
      desc: 'Paralyzed capacitors. 40% chance to lose turn; incoming Physical attacks guaranteed Critical.',
      color: '#ffc14d',
      duration: 3,
      onTurnStart: function(entity) {
        var paralyzed = Math.random() < 0.40;
        return {
          skipTurn: paralyzed,
          log: paralyzed ? (entity.name + ' is paralyzed by electric arc and cannot act!') : (entity.name + ' fights through high-voltage discharge.')
        };
      },
      onIncomingDamage: function(entity, element) {
        if (element === 'phys') {
          return { forceCritical: true, note: 'SHOCK conducts guaranteed CRITICAL impact!' };
        }
        return {};
      }
    },
    FREEZE: {
      id: 'FREEZE',
      name: 'CRYO // FREEZE',
      desc: 'Sub-zero thermal lock. Entity frozen solid. Cannot act until struck or thawed.',
      color: '#49e2ff',
      duration: 2,
      onTurnStart: function(entity) {
        return {
          skipTurn: true,
          log: entity.name + ' is frozen solid in cryogenic stasis! Turn lost.'
        };
      },
      onIncomingDamage: function(entity, element) {
        if (element === 'phys' || element === 'fire') {
          return { shatter: true, breakStatus: true, bonusDamageMult: 1.35, note: 'CRYO SHATTER! Thermal shock fractures chassis.' };
        }
        return {};
      }
    },
    OVERHEAT: {
      id: 'OVERHEAT',
      name: 'THERMAL // OVERHEAT',
      desc: 'Runaway core heat. Suffers 8% Max HP damage per turn; defense reduced by 25%.',
      color: '#ff2b4e',
      duration: 3,
      onTurnStart: function(entity) {
        var dmg = Math.max(1, Math.round((entity.maxHp || 100) * 0.08));
        entity.hp = Math.max(1, (entity.hp || 1) - dmg);
        return {
          damage: dmg,
          log: entity.name + ' suffers ' + dmg + ' core heat melt damage from OVERHEAT!'
        };
      },
      onIncomingDamage: function(entity, element) {
        return { defenseMod: 0.75, note: 'Thermal dissipation failure softens armor.' };
      }
    },
    CORROSION: {
      id: 'CORROSION',
      name: 'ACID // CORROSION',
      desc: 'Caustic memory leak. FLUX cost doubled and passive attack power reduced by 30%.',
      color: '#a35aff',
      duration: 3,
      onTurnStart: function(entity) {
        return {
          fluxCostMultiplier: 2.0,
          log: entity.name + ' memory buffers leaking under CORROSION.'
        };
      }
    }
  };

  var TacticalStatus = {
    STATUS_TYPES: STATUS_TYPES,
    
    // Apply or refresh a status effect
    inflict: function(target, statusId, duration) {
      if (!target) return null;
      var def = STATUS_TYPES[statusId];
      if (!def) return null;

      target.statusEffects = target.statusEffects || [];
      var existing = target.statusEffects.find(function(s) { return s.id === statusId; });
      if (existing) {
        existing.turnsRemaining = Math.max(existing.turnsRemaining, duration || def.duration);
      } else {
        target.statusEffects.push({
          id: def.id,
          name: def.name,
          color: def.color,
          turnsRemaining: duration || def.duration,
          def: def
        });
      }
      TacticalAudio.play('status_inflicted');
      return def;
    },

    // Process status effects at the beginning of an entity's action turn
    processTurnStart: function(entity) {
      if (!entity || !entity.statusEffects || entity.statusEffects.length === 0) {
        return { skipTurn: false, logs: [] };
      }

      var skip = false;
      var logs = [];

      for (var i = entity.statusEffects.length - 1; i >= 0; i--) {
        var st = entity.statusEffects[i];
        if (st.def && st.def.onTurnStart) {
          var res = st.def.onTurnStart(entity);
          if (res.skipTurn) skip = true;
          if (res.log) logs.push(res.log);
        }
        st.turnsRemaining--;
        if (st.turnsRemaining <= 0) {
          logs.push(entity.name + ' recovered from [' + st.name + '].');
          entity.statusEffects.splice(i, 1);
        }
      }

      return { skipTurn: skip, logs: logs };
    },

    // Calculate damage / defense modifiers when receiving attack
    processIncomingHit: function(target, element) {
      if (!target || !target.statusEffects || target.statusEffects.length === 0) {
        return { forceCritical: false, bonusDamageMult: 1.0, notes: [] };
      }

      var forceCrit = false;
      var mult = 1.0;
      var notes = [];

      for (var i = target.statusEffects.length - 1; i >= 0; i--) {
        var st = target.statusEffects[i];
        if (st.def && st.def.onIncomingDamage) {
          var res = st.def.onIncomingDamage(target, element);
          if (res.forceCritical) forceCrit = true;
          if (res.bonusDamageMult) mult *= res.bonusDamageMult;
          if (res.note) notes.push(res.note);
          if (res.breakStatus) {
            notes.push(target.name + ' was thawed from [' + st.name + ']!');
            target.statusEffects.splice(i, 1);
          }
        }
      }

      return { forceCritical: forceCrit, bonusDamageMult: mult, notes: notes };
    },

    // Render compact HTML status badges for UI HUD
    renderBadges: function(entity) {
      if (!entity || !entity.statusEffects || entity.statusEffects.length === 0) {
        return '';
      }
      return entity.statusEffects.map(function(st) {
        return '<span style="display:inline-block;padding:1px 5px;font-size:8.5px;font-weight:700;border:1px solid ' + st.color + ';color:' + st.color + ';background:rgba(0,0,0,0.6);margin-right:4px;" title="' + (st.def ? st.def.desc : '') + '">' +
          st.name + ' (' + st.turnsRemaining + 'T)' +
        '</span>';
      }).join('');
    }
  };

  // Expose to global window
  window.TacticalAudio = TacticalAudio;
  window.TacticalStatus = TacticalStatus;

})(typeof window !== 'undefined' ? window : this);
