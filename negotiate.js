/*
 * negotiate.js — Demon Negotiation State Machine for "Silicon Purgatory"
 * Zero dependencies. Core logic is DOM-free; a thin renderer hooks into index.html.
 *
 * Public API (window.DemonNegotiator):
 *   startNegotiation(enemy, onEnd)   -> opens panel, onEnd({outcome, reward?, message})
 *   start(demon, callbacks)          -> headless core (no DOM), returns controller
 *   choose(index)                    -> pick a dialogue option
 *   giveDemand(accept)               -> accept/refuse the demon's demand
 */
(function (root) {
  'use strict';

  // ---- Archetypes -----------------------------------------------------------
  // weight[choice] = attitude delta the demon feels for that approach.
  // choices: 0 Flatter, 1 Intimidate, 2 Logic, 3 Mock
  const ARCHETYPES = {
    SENTINEL: { // rigid / authoritarian — respects force & logic, loathes flattery
      name: 'SENTINEL', weights: [-1, 1, 2, -2], volatility: 0.15,
      lines: { greet: 'State your clearance. This exchange is logged.',
               wary: 'Your logic is noted. Proceed.',
               pleased: 'Acceptable. You reason like a machine.',
               hostile: 'Protocol violation detected.' } },
    PYROCLOCKER: { // hothead / impulsive — loves mockery & fire, hates cold logic
      name: 'PYROCLOCKER', weights: [1, -1, -2, 2], volatility: 0.45,
      lines: { greet: 'Hah! Another spark thinks it can bargain?',
               wary: 'Keep talking, I like the heat.',
               pleased: 'YES! You burn bright, little one!',
               hostile: 'Now you have made me ANGRY.' } },
    CRYO_DRIFTER: { // cold / skeptical — persuaded only by logic, immune to bluster
      name: 'CRYO DRIFTER', weights: [-1, -2, 2, -1], volatility: 0.1,
      lines: { greet: '...why should I waste cycles on you?',
               wary: 'Marginally less pointless. Continue.',
               pleased: 'Cold logic. I can respect that.',
               hostile: 'Conversation terminated.' } },
    SPARK_HARVESTER: { // greedy / erratic — flattery works, but it wants payment
      name: 'SPARK HARVESTER', weights: [2, -1, 0, 1], volatility: 0.6,
      lines: { greet: 'Ooh, shiny! What have you got for me?',
               wary: 'More. Give me moooore.',
               pleased: 'Friends! Yes! Give me flux and we are friends!',
               hostile: 'Then I TAKE what I want!' } }
  };

  const CHOICES = ['Flatter', 'Intimidate', 'Offer Logic', 'Mock'];
  const DEMAND_KINDS = [
    { kind: 'flux', label: 'flux (SP)', verb: 'Hand over' },
    { kind: 'integrity', label: 'integrity (HP)', verb: 'Sacrifice' },
    { kind: 'item', label: 'an item', verb: 'Surrender' }
  ];

  function moodFromAttitude(a) {
    if (a <= -2) return 'enraged';
    if (a === -1) return 'hostile';
    if (a === 0) return 'wary';
    if (a === 1) return 'curious';
    return 'pleased'; // a >= 2
  }

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  // ---- Core state machine ---------------------------------------------------
  function createNegotiation(demon, callbacks) {
    let key = (demon.archetype || demon.id || demon.name || 'SENTINEL').toUpperCase().replace(/[\s-]/g, '_');
    if (key.includes('SENTINEL')) key = 'SENTINEL';
    else if (key.includes('PYRO')) key = 'PYROCLOCKER';
    else if (key.includes('CRYO')) key = 'CRYO_DRIFTER';
    else if (key.includes('SPARK')) key = 'SPARK_HARVESTER';
    const arch = ARCHETYPES[key] || ARCHETYPES.SENTINEL;
    const cb = callbacks || {};

    const state = {
      arch,
      name: demon.name || arch.name,
      attitude: typeof demon.attitude === 'number' ? clamp(demon.attitude, -2, 2) : 0,
      phase: 'talk',          // 'talk' | 'demand' | 'done'
      turns: 0,
      maxTurns: demon.maxTurns || 4,
      demand: null,
      finished: false
    };

    function emit(payload) {
      state.mood = moodFromAttitude(state.attitude);
      if (cb.onUpdate) cb.onUpdate(payload, snapshot());
    }

    function snapshot() {
      return {
        name: state.name, archetype: arch.name, attitude: state.attitude,
        mood: moodFromAttitude(state.attitude), phase: state.phase,
        turns: state.turns, maxTurns: state.maxTurns
      };
    }

    function finish(outcome, message, reward) {
      if (state.finished) return;
      state.finished = true;
      state.phase = 'done';
      const result = { outcome, message, reward: reward || null, snapshot: snapshot() };
      if (cb.onEnd) cb.onEnd(result);
      return result;
    }

    // Open the negotiation with a greeting + first set of choices.
    function begin() {
      emit({ type: 'speak', text: arch.lines.greet, mood: moodFromAttitude(state.attitude) });
      return prompt();
    }

    function prompt() {
      state.phase = 'talk';
      emit({ type: 'prompt', choices: CHOICES.slice() });
      return snapshot();
    }

    // Player picks a dialogue approach.
    function choose(index) {
      if (state.finished || state.phase !== 'talk') return snapshot();
      const i = clamp(index | 0, 0, CHOICES.length - 1);

      // Apply archetype reaction + a touch of volatility-driven randomness.
      let delta = arch.weights[i];
      if (Math.random() < arch.volatility) delta += (Math.random() < 0.5 ? -1 : 1);
      state.attitude = clamp(state.attitude + delta, -2, 2);
      state.turns++;

      const mood = moodFromAttitude(state.attitude);
      emit({ type: 'reaction', choice: CHOICES[i], delta, mood,
             text: reactionLine(mood) });

      // Rage-out: a hard-negative mood ends things violently.
      if (state.attitude <= -2) {
        return finish('anger', arch.lines.hostile + ' ' + state.name + ' strikes!');
      }

      // Pleased enough, or ran out of patience -> move to demand/resolution.
      if (state.attitude >= 2 || state.turns >= state.maxTurns) {
        return beginDemand();
      }
      return prompt();
    }

    function reactionLine(mood) {
      if (mood === 'pleased') return arch.lines.pleased;
      if (mood === 'wary' || mood === 'curious') return arch.lines.wary;
      return arch.lines.hostile;
    }

    // Demon demands tribute before deciding.
    function beginDemand() {
      state.phase = 'demand';
      const kind = DEMAND_KINDS[Math.floor(Math.random() * DEMAND_KINDS.length)];
      const base = state.attitude >= 2 ? 10 : 25; // happier demons ask for less
      const amount = kind.kind === 'item' ? 1 : base + Math.floor(Math.random() * 20);
      state.demand = { kind: kind.kind, label: kind.label, amount };

      const text = `${kind.verb} ${kind.kind === 'item' ? kind.label : amount + ' ' + kind.label} `
                 + `and I shall consider your plea.`;
      emit({ type: 'demand', demand: state.demand, text });
      return snapshot();
    }

    // Player accepts (true) or refuses (false) the demand.
    function giveDemand(accept) {
      if (state.finished || state.phase !== 'demand') return snapshot();

      if (accept) {
        // Generosity nudges mood up; high mood => recruit, else peaceful flee + gift.
        state.attitude = clamp(state.attitude + 1, -2, 2);
        if (state.attitude >= 2 || Math.random() < 0.5 + state.attitude * 0.2) {
          return finish('recruit',
            `${state.name} bows. "Our cores are aligned. I will fight beside you."`,
            `${state.name} joined the party`);
        }
        return finish('flee',
          `${state.name} takes the tribute and phases out. "A fair trade. Farewell."`,
          'a parting gift');
      }

      // Refusal. Skeptical/cold types may respect the backbone; hotheads rage.
      const tolerant = arch === ARCHETYPES.CRYO_DRIFTER || arch === ARCHETYPES.SENTINEL;
      if (tolerant && state.attitude >= 1 && Math.random() < 0.5) {
        return finish('flee',
          `${state.name} tilts its head. "Bold. I will remember you." It withdraws.`);
      }
      state.attitude = clamp(state.attitude - 2, -2, 2);
      return finish('anger',
        `${arch.lines.hostile} ${state.name} lunges in fury!`);
    }

    return {
      begin, choose, giveDemand,
      get state() { return snapshot(); },
      snapshot
    };
  }

  // ---- DOM renderer ---------------------------------------------------------
  let active = null; // currently open UI-bound negotiation

  function ensureStyles() {
    if (document.getElementById('sp-neg-style')) return;
    const css = `
      #sp-neg{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;
        background:rgba(2,6,16,.75);font-family:'JetBrains Mono',ui-monospace,Menlo,monospace;z-index:9999}
      #sp-neg .box{width:min(520px,92vw);background:#0a0f1e;border:1px solid #38bdf8;
        border-radius:10px;box-shadow:0 0 24px rgba(56,189,248,.35);color:#d7f7ff;padding:18px}
      #sp-neg h2{margin:0 0 4px;font-size:15px;letter-spacing:2px;color:#38bdf8}
      #sp-neg .mood{font-size:11px;opacity:.7;margin-bottom:12px;text-transform:uppercase}
      #sp-neg .say{min-height:44px;background:#060a16;border-left:3px solid #ff2b44;
        padding:10px 12px;margin-bottom:14px;font-size:12px;line-height:1.5}
      #sp-neg button{display:block;width:100%;margin:6px 0;padding:9px 12px;text-align:left;
        background:#111a30;color:#d7f7ff;border:1px solid #30406a;border-radius:6px;
        font:inherit;font-size:12px;cursor:pointer;transition:.12s;letter-spacing:1px}
      #sp-neg button:hover{background:#1c2a4a;border-color:#38bdf8;box-shadow:0 0 10px rgba(56,189,248,.3)}`;
    const el = document.createElement('style');
    el.id = 'sp-neg-style'; el.textContent = css;
    document.head.appendChild(el);
  }

  function render(ctrl, info, snap) {
    ensureStyles();
    let modal = document.getElementById('sp-neg');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'sp-neg';
      modal.innerHTML = '<div class="box"><h2></h2><div class="mood"></div>'
        + '<div class="say"></div><div class="opts"></div></div>';
      document.body.appendChild(modal);
    }
    modal.querySelector('h2').textContent = snap.name + ' // ' + snap.archetype;
    modal.querySelector('.mood').textContent =
      'ATTITUDE ' + snap.attitude + '  ·  MOOD: ' + snap.mood;

    if (info && info.text) modal.querySelector('.say').textContent = info.text;

    const opts = modal.querySelector('.opts');
    opts.innerHTML = '';
    const mk = (label, fn) => {
      const b = document.createElement('button');
      b.className = 'neg-btn';
      b.textContent = label; b.onclick = fn; opts.appendChild(b);
    };

    if (info && info.type === 'prompt') {
      info.choices.forEach((c, i) => mk((i + 1) + '. ' + c, () => ctrl.choose(i)));
    } else if (info && info.type === 'demand') {
      mk('✔ Accept (' + info.demand.verb + ' ' + (info.demand.kind === 'item' ? info.demand.label : info.demand.amount + ' ' + info.demand.label) + ')', () => ctrl.giveDemand(true));
      mk('✘ Refuse', () => ctrl.giveDemand(false));
    }
  }

  function closePanel() {
    const modal = document.getElementById('sp-neg');
    if (modal) modal.remove();
    active = null;
  }

  // Full UI flow: open a modal over the battle screen.
  function startNegotiation(enemy, onEnd) {
    const ctrl = createNegotiation(enemy || {}, {
      onUpdate: (info, snap) => render(ctrl, info, snap),
      onEnd: (result) => {
        render(ctrl, { text: result.message, type: 'done' }, result.snapshot);
        setTimeout(() => { closePanel(); if (onEnd) onEnd(result); }, 1200);
      }
    });
    active = ctrl;
    ctrl.begin();
    return ctrl;
  }

  // ---- Public interface -----------------------------------------------------
  const DemonNegotiator = {
    ARCHETYPES,
    startNegotiation,
    start: (demon, callbacks) => {
      active = createNegotiation(demon, callbacks);
      active.begin();
      return active;
    },
    choose: (i) => active && active.choose(i),
    giveDemand: (ok) => active && active.giveDemand(ok),
    createNegotiation
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = DemonNegotiator;
  root.DemonNegotiator = DemonNegotiator;
})(typeof window !== 'undefined' ? window : this);
