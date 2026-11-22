/* fusion_hud.js — Modular Fusion Chamber UI Controller for Silicon Purgatory
 * Self-contained, zero-dependency HUD bridge connecting window.DemonFusion,
 * window.DemonNegotiator roster, and index.html/dungeon.html.
 */
(function(root) {
  'use strict';

  var FusionHUD = {
    isOpen: false,
    parentA: null,
    parentB: null,
    previewResult: null,

    // Open the chamber with an optional list of recruit demons
    open: function(roster, onFusedCallback) {
      this.roster = roster || (root.DemonNegotiator && root.DemonNegotiator.recruits) || [];
      this.onFused = onFusedCallback || null;
      this.parentA = null;
      this.parentB = null;
      this.previewResult = null;
      this.ensureDOM();
      this.render();
      var modal = document.getElementById('fusion-modal-overlay');
      if (modal) {
        modal.style.display = 'flex';
        this.isOpen = true;
      }
      if (root.TacticalAudio && typeof root.TacticalAudio.play === 'function') {
        root.TacticalAudio.play('menu_select');
      }
    },

    close: function() {
      var modal = document.getElementById('fusion-modal-overlay');
      if (modal) {
        modal.style.display = 'none';
      }
      this.isOpen = false;
      if (root.TacticalAudio && typeof root.TacticalAudio.play === 'function') {
        root.TacticalAudio.play('menu_back');
      }
    },

    ensureDOM: function() {
      if (document.getElementById('fusion-modal-overlay')) return;

      var overlay = document.createElement('div');
      overlay.id = 'fusion-modal-overlay';
      overlay.style.position = 'fixed';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100vw';
      overlay.style.height = '100vh';
      overlay.style.background = 'rgba(5, 5, 8, 0.92)';
      overlay.style.backdropFilter = 'blur(6px)';
      overlay.style.display = 'none';
      overlay.style.alignItems = 'center';
      overlay.style.justifyContent = 'center';
      overlay.style.zIndex = '9999';
      overlay.style.fontFamily = "'JetBrains Mono', monospace";
      overlay.style.color = '#e2e8f0';

      var container = document.createElement('div');
      container.id = 'fusion-chamber-box';
      container.style.width = 'min(92vw, 760px)';
      container.style.background = '#0d1117';
      container.style.border = '2px solid #ef4444';
      container.style.boxShadow = '0 0 24px rgba(239, 68, 68, 0.35)';
      container.style.padding = '20px';
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
      container.style.gap = '16px';
      container.style.maxHeight = '90vh';
      container.style.overflowY = 'auto';

      overlay.appendChild(container);
      document.body.appendChild(overlay);
    },

    render: function() {
      var container = document.getElementById('fusion-chamber-box');
      if (!container) return;

      var html = '<div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #30363d; padding-bottom:10px;">';
      html += '  <div style="font-weight:800; font-size:16px; color:#f87171; letter-spacing:1px; display:flex; align-items:center; gap:8px;">';
      html += '    <span>⚡ DEMON FUSION CHAMBER // SYNTHESIS</span>';
      html += '  </div>';
      html += '  <button id="fusion-btn-close" style="background:transparent; border:1px solid #475569; color:#94a3b8; cursor:pointer; padding:4px 10px; font-family:inherit; font-weight:700;">[ ESC / CLOSE ]</button>';
      html += '</div>';

      // Roster overview / Slot selection
      html += '<div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">';

      // Parent A slot
      html += '  <div style="background:#161b22; border:1px solid ' + (this.parentA ? '#22c55e' : '#30363d') + '; padding:12px;">';
      html += '    <div style="font-size:11px; color:#64748b; font-weight:700; margin-bottom:6px;">PRIMARY VESSEL (PARENT A)</div>';
      if (this.parentA) {
        html += '    <div style="color:#22c55e; font-weight:700; font-size:14px;">' + this.escape(this.parentA.name || 'Demon A') + '</div>';
        html += '    <div style="font-size:11px; color:#94a3b8;">HP: ' + (this.parentA.hp || '--') + ' | ATK: ' + (this.parentA.atk || '--') + ' | DEF: ' + (this.parentA.def || '--') + '</div>';
        html += '    <button id="fusion-clear-a" style="margin-top:8px; font-size:10px; background:#ef444422; border:1px solid #ef4444; color:#ef4444; cursor:pointer; padding:2px 6px;">[ DESELECT ]</button>';
      } else {
        html += '    <div style="color:#64748b; font-style:italic; font-size:12px;">Select an entity below...</div>';
      }
      html += '  </div>';

      // Parent B slot
      html += '  <div style="background:#161b22; border:1px solid ' + (this.parentB ? '#3b82f6' : '#30363d') + '; padding:12px;">';
      html += '    <div style="font-size:11px; color:#64748b; font-weight:700; margin-bottom:6px;">SECONDARY VESSEL (PARENT B)</div>';
      if (this.parentB) {
        html += '    <div style="color:#3b82f6; font-weight:700; font-size:14px;">' + this.escape(this.parentB.name || 'Demon B') + '</div>';
        html += '    <div style="font-size:11px; color:#94a3b8;">HP: ' + (this.parentB.hp || '--') + ' | ATK: ' + (this.parentB.atk || '--') + ' | DEF: ' + (this.parentB.def || '--') + '</div>';
        html += '    <button id="fusion-clear-b" style="margin-top:8px; font-size:10px; background:#ef444422; border:1px solid #ef4444; color:#ef4444; cursor:pointer; padding:2px 6px;">[ DESELECT ]</button>';
      } else {
        html += '    <div style="color:#64748b; font-style:italic; font-size:12px;">Select an entity below...</div>';
      }
      html += '  </div>';

      html += '</div>';

      // Synthesis preview box
      var canFuse = (this.parentA && this.parentB);
      var preview = null;
      if (canFuse && root.DemonFusion && typeof root.DemonFusion.fuse === 'function') {
        try {
          preview = root.DemonFusion.fuse(this.parentA, this.parentB);
        } catch(e) {
          preview = { name: "Hybrid Abomination", error: e.message };
        }
      }
      this.previewResult = preview;

      html += '<div style="background:#090d13; border:1px dashed ' + (preview ? '#f59e0b' : '#30363d') + '; padding:14px;">';
      html += '  <div style="font-size:11px; color:#d97706; font-weight:700; margin-bottom:6px;">SYNTHESIS PREVIEW & INHERITANCE</div>';
      if (preview) {
        html += '  <div style="display:flex; justify-content:space-between; align-items:baseline;">';
        html += '    <div style="font-size:15px; font-weight:800; color:#fbbf24;">⚡ ' + this.escape(preview.name || 'Unknown Entity') + '</div>';
        html += '    <div style="font-size:11px; color:#10b981; font-weight:700;">' + (preview.isOverclock ? '[OVERCLOCK SUCCESS]' : '[NEW SPECIES PROTOCOL]') + '</div>';
        html += '  </div>';
        html += '  <div style="font-size:12px; color:#cbd5e1; margin-top:4px;">Stats: HP ' + (preview.hp || '--') + ' | SP ' + (preview.sp || '--') + ' | ATK ' + (preview.atk || '--') + ' | DEF ' + (preview.def || '--') + ' | SPD ' + (preview.spd || '--') + '</div>';
        if (preview.skills && preview.skills.length > 0) {
          html += '  <div style="font-size:11px; color:#94a3b8; margin-top:4px;">Inherited Skills: <span style="color:#e2e8f0;">' + preview.skills.join(', ') + '</span></div>';
        }
      } else {
        html += '  <div style="color:#475569; font-size:12px; font-style:italic;">Designate both parent vessels to calculate synthesis output.</div>';
      }
      html += '</div>';

      // Available recruits list
      html += '<div>';
      html += '  <div style="font-size:11px; color:#64748b; font-weight:700; margin-bottom:6px;">RECRUITED ROSTER / AVAILABLE VESSELS (' + (this.roster.length) + ')</div>';
      if (this.roster.length === 0) {
        html += '  <div style="padding:12px; background:#161b22; border:1px solid #30363d; color:#64748b; font-size:12px; text-align:center;">No recruited demons available. Negotiate with enemy vessels in combat first!</div>';
      } else {
        html += '  <div style="display:flex; gap:8px; flex-wrap:wrap; max-height:160px; overflow-y:auto; padding:4px;">';
        for (var i = 0; i < this.roster.length; i++) {
          var d = this.roster[i];
          var isA = (this.parentA === d);
          var isB = (this.parentB === d);
          var border = isA ? '#22c55e' : (isB ? '#3b82f6' : '#30363d');
          var bg = isA ? '#22c55e15' : (isB ? '#3b82f615' : '#161b22');
          html += '    <div style="border:1px solid ' + border + '; background:' + bg + '; padding:8px 10px; font-size:11px; display:flex; flex-direction:column; gap:4px; min-width:140px;">';
          html += '      <div style="font-weight:700; color:#e2e8f0;">' + this.escape(d.name || ('Demon #' + (i + 1))) + '</div>';
          html += '      <div style="color:#64748b; font-size:10px;">HP:' + (d.hp || '-') + ' ATK:' + (d.atk || '-') + '</div>';
          html += '      <div style="display:flex; gap:4px; margin-top:2px;">';
          html += '        <button class="fusion-assign-a" data-index="' + i + '" style="font-size:9px; background:#22c55e22; border:1px solid #22c55e; color:#22c55e; cursor:pointer; padding:1px 4px;">SLOT A</button>';
          html += '        <button class="fusion-assign-b" data-index="' + i + '" style="font-size:9px; background:#3b82f622; border:1px solid #3b82f6; color:#3b82f6; cursor:pointer; padding:1px 4px;">SLOT B</button>';
          html += '      </div>';
          html += '    </div>';
        }
        html += '  </div>';
      }
      html += '</div>';

      // Action trigger
      html += '<div style="display:flex; justify-content:flex-end; gap:10px; margin-top:8px;">';
      html += '  <button id="fusion-btn-execute" ' + (preview ? '' : 'disabled') + ' style="background:' + (preview ? '#dc2626' : '#334155') + '; color:' + (preview ? '#fff' : '#64748b') + '; border:1px solid ' + (preview ? '#ef4444' : '#475569') + '; font-weight:800; font-family:inherit; padding:10px 20px; cursor:' + (preview ? 'pointer' : 'not-allowed') + '; letter-spacing:1px; box-shadow:' + (preview ? '0 0 12px rgba(239, 68, 68, 0.4)' : 'none') + ';">';
      html += '    ⚡ EXECUTE FUSION RITUAL';
      html += '  </button>';
      html += '</div>';

      container.innerHTML = html;
      this.bindEvents();
    },

    bindEvents: function() {
      var self = this;
      var closeBtn = document.getElementById('fusion-btn-close');
      if (closeBtn) closeBtn.onclick = function() { self.close(); };

      var clearA = document.getElementById('fusion-clear-a');
      if (clearA) clearA.onclick = function() { self.parentA = null; self.render(); };

      var clearB = document.getElementById('fusion-clear-b');
      if (clearB) clearB.onclick = function() { self.parentB = null; self.render(); };

      var assignAs = document.querySelectorAll('.fusion-assign-a');
      assignAs.forEach(function(btn) {
        btn.onclick = function() {
          var idx = parseInt(btn.getAttribute('data-index'), 10);
          self.parentA = self.roster[idx];
          if (root.TacticalAudio && typeof root.TacticalAudio.play === 'function') {
            root.TacticalAudio.play('menu_select');
          }
          self.render();
        };
      });

      var assignBs = document.querySelectorAll('.fusion-assign-b');
      assignBs.forEach(function(btn) {
        btn.onclick = function() {
          var idx = parseInt(btn.getAttribute('data-index'), 10);
          self.parentB = self.roster[idx];
          if (root.TacticalAudio && typeof root.TacticalAudio.play === 'function') {
            root.TacticalAudio.play('menu_select');
          }
          self.render();
        };
      });

      var execBtn = document.getElementById('fusion-btn-execute');
      if (execBtn) {
        execBtn.onclick = function() {
          if (!self.previewResult) return;
          if (root.TacticalAudio && typeof root.TacticalAudio.play === 'function') {
            root.TacticalAudio.play('boss_phase');
          }
          var fusedDemon = self.previewResult;
          // Remove parent vessels from roster
          var idxA = self.roster.indexOf(self.parentA);
          if (idxA > -1) self.roster.splice(idxA, 1);
          var idxB = self.roster.indexOf(self.parentB);
          if (idxB > -1) self.roster.splice(idxB, 1);
          // Add fused entity
          self.roster.push(fusedDemon);

          if (typeof self.onFused === 'function') {
            self.onFused(fusedDemon);
          }

          alert("⚡ RITUAL COMPLETE: " + (fusedDemon.name || "Fused Demon") + " forged!");
          self.close();
        };
      }
    },

    escape: function(str) {
      if (!str) return '';
      return String(str).replace(/[&<>"']/g, function(m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
      });
    }
  };

  root.FusionHUD = FusionHUD;
})(window);
