/* Taiji centre-gravity balance V2: keep normal bowl gravity without centre locking */
(() => {
  const PriorTop = Top;

  const teamOf = top => top?.teamIndex ?? (top?.index ? 1 : 0);
  const validEnemy = (source, target) =>
    !!target &&
    source !== target &&
    teamOf(source) !== teamOf(target) &&
    !target.out &&
    !target.burst &&
    target.energy > 0;

  Top = class Top extends PriorTop {
    update(dt, opponent) {
      const isTaijiYin = !!this.c?.taijiV2 && this.taijiMode === 'yin';

      // The inherited rigid-body update already applies the arena bowl force once.
      super.update(dt, opponent);

      if (!isTaijiYin || this.out || this.burst || this.phaseInvisible || this.skyJumpGhost) return;

      /*
       * The Taiji base module adds 7 units/s² of tangential steering around the
       * opponent after normal physics. Reduce that steering instead of adding a
       * second inward force. Radial velocity is left untouched, so collisions,
       * launches, X Dash and the arena's original centre gravity remain natural.
       */
      if (validEnemy(this, opponent)) {
        const dx = opponent.x - this.x;
        const dy = opponent.y - this.y;
        const d = mag(dx, dy) || 1;
        const sign = Math.sign(this.omega) || 1;
        const tx = (-dy / d) * sign;
        const ty = (dx / d) * sign;

        const cx = W / 2;
        const cy = H / 2;
        const centreDistance = mag(this.x - cx, this.y - cy);
        const radialFactor = clamp(centreDistance / Math.max(1, innerR), 0, 1);

        // Leave a light 1.8–3.4 steering force; remove only the excess.
        const desiredSteering = 1.8 + radialFactor * 1.6;
        const removeSteering = 7 - desiredSteering;
        this.vx -= tx * removeSteering * dt;
        this.vy -= ty * removeSteering * dt;
      }

      this.taijiGravityActive = true;
      this.taijiCentreLock = false;
    }
  };

  document.documentElement.dataset.taijiGravity = 'balanced-v2';
})();
