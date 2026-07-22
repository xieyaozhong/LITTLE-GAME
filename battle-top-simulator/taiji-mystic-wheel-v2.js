/* Taiji Mystic Wheel V2 — self-contained Yin/Yang combat module */
(() => {
  const KEY = 'taijiMysticWheel';
  const PRESET = {
    label: '[SPECIAL] 太極玄輪｜Taiji Mystic Wheel',
    name: '太極玄輪', englishName: 'Taiji Mystic Wheel',
    combo: '2-80 Infinity Balance',
    rank: '陰陽流轉・化勁反擊', tier: 'SPECIAL', type: 'balance',
    a: 78, d: 88, s: 88, w: 84, b: 93,
    spin: 'R', shape: 'taijiMysticWheel', taijiV2: true,
    primary: '#f7fafc', secondary: '#111722', accent: '#65e6c2', metal: '#d5dee8'
  };

  metaPresets[KEY] = PRESET;

  const priorRenderPanel = renderPanel;
  renderPanel = function(id) {
    priorRenderPanel(id);
    const host = document.querySelector('#' + id);
    const c = cfg[id];
    if (!host || !c?.taijiV2) return;
    const anchor = host.querySelector('.combo-box');
    const box = document.createElement('div');
    box.className = 'combo-box taiji-v2-ability';
    box.innerHTML = '<strong>陰陽流轉</strong>陰態化解碰撞並吸收衝擊形成「勁」；勁力充足後轉為陽態，以弧形突進把儲存力量返還。<div class="combo-tags"><span>陰・化勁</span><span>陽・發勁</span><span>借力打力</span></div>';
    if (anchor) anchor.insertAdjacentElement('afterend', box);
    else host.appendChild(box);
  };

  const teamOf = top => top?.teamIndex ?? (top?.index ? 1 : 0);
  const validEnemy = (source, target) => !!target && source !== target && teamOf(source) !== teamOf(target) && !target.out && !target.burst && !target.phaseInvisible && !target.skyJumpGhost && target.energy > 0;
  const nearestEnemy = (source, preferred) => {
    if (validEnemy(source, preferred)) return preferred;
    let best = null, bestD = Infinity;
    tops.forEach(target => {
      if (!validEnemy(source, target)) return;
      const d = mag(target.x - source.x, target.y - source.y);
      if (d < bestD) { best = target; bestD = d; }
    });
    return best;
  };
  const snapshot = top => ({
    vx: top.vx, vy: top.vy, omega: top.omega,
    tiltVel: top.tiltVel || 0, lift: top.lift || 0,
    impactBoost: top.impactBoost || 0, burstMeter: top.burstMeter || 0
  });
  const soften = (top, before, retain = 0.60) => {
    if (!top || top.out || top.burst) return;
    top.vx = before.vx + (top.vx - before.vx) * retain;
    top.vy = before.vy + (top.vy - before.vy) * retain;
    top.omega = before.omega + (top.omega - before.omega) * retain;
    top.spin = top.omega;
    top.tiltVel = before.tiltVel + ((top.tiltVel || 0) - before.tiltVel) * retain;
    top.lift = before.lift + ((top.lift || 0) - before.lift) * retain;
    top.impactBoost = before.impactBoost + ((top.impactBoost || 0) - before.impactBoost) * retain;
    top.burstMeter = before.burstMeter + ((top.burstMeter || 0) - before.burstMeter) * retain;
  };

  const PriorTop = Top;
  Top = class Top extends PriorTop {
    constructor(index, data) {
      super(index, data);
      this.taijiMode = data.taijiV2 ? 'yin' : null;
      this.taijiChi = 0;
      this.taijiModeTimer = 0;
      this.taijiDashTimer = 0.8;
      this.taijiStrikeWindow = 0;
      this.taijiPulse = 0;
      this.taijiFx = 0;
    }
    isTaijiV2() { return !!this.c.taijiV2; }
    switchTaiji(mode) {
      if (!this.isTaijiV2() || this.taijiMode === mode) return;
      this.taijiMode = mode;
      this.taijiFx = 1;
      this.taijiStrikeWindow = 0;
      if (mode === 'yang') {
        this.taijiModeTimer = rnd(2.8, 3.6);
        this.taijiDashTimer = rnd(0.25, 0.48);
        emit(this.x, this.y, '#ffffff', 28, 0.78, 'streak');
        emit(this.x, this.y, '#65e6c2', 20, 0.62, 'streak');
        wave(this.x, this.y, '#f5d67b', 66);
        addLog(`${this.c.name} 由陰轉陽，開始釋放累積勁力！`);
      } else {
        this.taijiDashTimer = 0.8;
        wave(this.x, this.y, '#65e6c2', 46);
        addLog(`${this.c.name} 由陽歸陰，重新進入化勁循環。`);
      }
      shake = Math.max(shake, 4);
      flash = Math.max(flash, 0.08);
    }
    absorb(amount) {
      if (!this.isTaijiV2() || this.taijiMode !== 'yin') return;
      this.taijiChi = clamp(this.taijiChi + clamp(amount, 2, 26), 0, 100);
      this.taijiFx = 1;
      if (this.taijiChi >= 50) this.switchTaiji('yang');
    }
    yangDash(target) {
      if (!validEnemy(this, target)) return;
      const dx = target.x - this.x, dy = target.y - this.y;
      const d = mag(dx, dy) || 1;
      const nx = dx / d, ny = dy / d;
      const sign = Math.sign(this.omega) || 1;
      const tx = -ny * sign, ty = nx * sign;
      const power = 46 + this.taijiChi * 0.50;
      const curve = 18 + this.taijiChi * 0.12;
      this.vx += nx * power + tx * curve;
      this.vy += ny * power + ty * curve;
      this.taijiStrikeWindow = 0.36;
      this.impactBoost = Math.max(this.impactBoost || 0, 34 + this.taijiChi * 0.42);
      this.taijiFx = 1;
      emit(this.x, this.y, '#fff4c2', 14, 0.48, 'streak');
    }
    update(dt, opponent) {
      super.update(dt, opponent);
      this.taijiPulse += dt * (this.taijiMode === 'yang' ? 5.2 : 2.6);
      this.taijiFx = Math.max(0, this.taijiFx - dt * 2.1);
      this.taijiStrikeWindow = Math.max(0, this.taijiStrikeWindow - dt);
      if (!this.isTaijiV2() || this.out || this.burst || this.phaseInvisible || this.skyJumpGhost || this.charmedBy) return;
      const target = nearestEnemy(this, opponent);
      if (this.taijiMode === 'yin') {
        this.taijiChi = Math.max(0, this.taijiChi - dt * 0.5);
        if (target) {
          const dx = target.x - this.x, dy = target.y - this.y, d = mag(dx, dy) || 1;
          const sign = Math.sign(this.omega) || 1;
          this.vx += (-dy / d) * sign * 7 * dt;
          this.vy += (dx / d) * sign * 7 * dt;
        }
      } else {
        this.taijiModeTimer -= dt;
        this.taijiDashTimer -= dt;
        this.taijiChi = Math.max(0, this.taijiChi - dt * 3.5);
        this.omega *= Math.exp(-0.009 * dt);
        this.spin = this.omega;
        if (target && this.taijiDashTimer <= 0) {
          this.yangDash(target);
          this.taijiDashTimer = rnd(0.82, 1.15);
        }
        if (this.taijiModeTimer <= 0 || this.taijiChi <= 6) this.switchTaiji('yin');
      }
    }
    bladeCount() { return this.c.shape === 'taijiMysticWheel' ? 2 : super.bladeCount(); }
    bladeRadius(i) { return this.c.shape === 'taijiMysticWheel' ? this.r * (i % 2 ? 1.02 : 1.18) : super.bladeRadius(i); }
    draw() {
      if (!this.c.taijiV2) { super.draw(); return; }
      const original = { primary: this.c.primary, secondary: this.c.secondary, accent: this.c.accent };
      if (this.taijiMode === 'yang') {
        this.c.primary = '#ffffff'; this.c.secondary = '#303844'; this.c.accent = '#f5d67b';
      }
      super.draw();
      Object.assign(this.c, original);
      if (this.out || this.burst) return;
      const yang = this.taijiMode === 'yang';
      const pulse = 0.5 + 0.5 * Math.sin(this.taijiPulse);
      const rr = this.r * 0.46;
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle * 0.55);
      ctx.globalCompositeOperation = 'screen';
      ctx.shadowBlur = 11 + this.taijiChi * 0.08;
      ctx.shadowColor = yang ? '#f5d67b' : '#65e6c2';
      ctx.fillStyle = 'rgba(248,251,255,.92)';
      ctx.beginPath(); ctx.arc(0, 0, rr, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(8,12,18,.94)';
      ctx.beginPath(); ctx.arc(0, 0, rr, -Math.PI / 2, Math.PI / 2); ctx.lineTo(0, -rr); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#080c12'; ctx.beginPath(); ctx.arc(0, -rr * 0.5, rr * 0.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f8fbff'; ctx.beginPath(); ctx.arc(0, rr * 0.5, rr * 0.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f8fbff'; ctx.beginPath(); ctx.arc(0, -rr * 0.5, rr * 0.11, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#080c12'; ctx.beginPath(); ctx.arc(0, rr * 0.5, rr * 0.11, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = alpha(yang ? '#f5d67b' : '#65e6c2', 0.18 + this.taijiChi * 0.004 + pulse * 0.12);
      ctx.lineWidth = 1.5 + this.taijiChi * 0.012;
      ctx.setLineDash([this.r * 0.14, this.r * 0.10]);
      ctx.beginPath(); ctx.arc(0, 0, this.r * (1.18 + pulse * 0.08), 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      if (this.taijiFx > 0) {
        ctx.strokeStyle = alpha('#ffffff', 0.5 * this.taijiFx);
        ctx.lineWidth = 2.2;
        ctx.beginPath(); ctx.arc(0, 0, this.r * (1.22 + (1 - this.taijiFx) * 0.7), 0, Math.PI * 2); ctx.stroke();
      }
      ctx.restore();
    }
  };

  const priorCollide = collide;
  collide = function(a, b) {
    const protectedState = a?.phaseInvisible || b?.phaseInvisible || a?.skyJumpGhost || b?.skyJumpGhost || a?.charmedBy === b || b?.charmedBy === a;
    const same = teamOf(a) === teamOf(b);
    const dx = b.x - a.x, dy = b.y - a.y, d = mag(dx, dy), min = (a.r || 0) + (b.r || 0);
    let contact = false, nx = 0, ny = 0, impact = 0;
    if (!protectedState && !same && d && d < min) {
      nx = dx / d; ny = dy / d;
      impact = Math.max(0, -((b.vx - a.vx) * nx + (b.vy - a.vy) * ny));
      contact = impact > 0;
    }
    const beforeA = snapshot(a), beforeB = snapshot(b);
    priorCollide(a, b);
    if (!contact) return;

    const apply = (top, other, before, dirX, dirY) => {
      if (!top?.c?.taijiV2 || top.out || top.burst || top.phaseInvisible || top.skyJumpGhost || top.charmedBy) return;
      if (top.taijiMode === 'yin') {
        soften(top, before, 0.60);
        const sign = Math.sign(top.omega) || 1;
        const tx = -dirY * sign, ty = dirX * sign;
        const redirect = clamp(7 + impact * 0.055, 7, 24);
        other.vx += tx * redirect; other.vy += ty * redirect;
        top.absorb(5 + impact * 0.10);
        emit(top.x, top.y, '#65e6c2', 8 + Math.round(impact * 0.03), 0.42, 'streak');
        wave(top.x, top.y, '#e4fff7', 30 + Math.min(24, impact * 0.08));
      } else if (top.taijiStrikeWindow > 0) {
        const chi = top.taijiChi;
        const force = 34 + chi * 0.76;
        other.vx += dirX * force; other.vy += dirY * force;
        other.omega *= 1 - (0.035 + chi * 0.00072); other.spin = other.omega;
        other.tiltVel += (0.07 + chi * 0.0015) / Math.max(0.76, other.tip?.stability || 1);
        other.lift = clamp((other.lift || 0) + 0.045 + chi * 0.00075, 0, 1);
        other.impactBoost = Math.max(other.impactBoost || 0, force * 0.72);
        other.burstMeter = (other.burstMeter || 0) + 2 + chi * 0.055;
        top.taijiChi = Math.max(0, chi - Math.max(24, chi * 0.58));
        top.taijiStrikeWindow = 0; top.taijiFx = 1;
        emit((top.x + other.x) / 2, (top.y + other.y) / 2, '#fff4c2', 24 + Math.round(chi * 0.15), 0.72, 'streak');
        wave((top.x + other.x) / 2, (top.y + other.y) / 2, '#ffffff', 52 + chi * 0.28);
        shake = Math.max(shake, 5 + chi * 0.045);
        addLog(`${top.c.name} 發動陽勁，把吸收的衝擊返還！`);
        if (top.taijiChi <= 6) top.switchTaiji('yin');
      }
    };
    apply(a, b, beforeA, nx, ny);
    apply(b, a, beforeB, -nx, -ny);
  };

  const style = document.createElement('style');
  style.textContent = '.taiji-v2-ability{border-color:#65e6c166;background:linear-gradient(135deg,#ffffff10,#10172228 52%,#65e6c118);box-shadow:inset 0 0 24px #65e6c10c}';
  document.head.appendChild(style);

  cfg.p2 = { ...PRESET, preset: KEY };
  renderPanel('p1'); renderPanel('p2');
  const n1 = document.querySelector('#n1'), n2 = document.querySelector('#n2');
  if (n1) n1.textContent = cfg.p1.name;
  if (n2) n2.textContent = cfg.p2.name;
  document.documentElement.dataset.taijiV2 = 'active';
})();
