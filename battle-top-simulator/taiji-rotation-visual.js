/* Taiji rotation visual enhancer: real spinning symbol and live Yin/Yang proportions */
(() => {
  const PriorTop = Top;

  function taijiShares(top) {
    const chi = clamp(top.taijiChi || 0, 0, 100);
    const dominant = clamp(0.66 + chi * 0.003, 0.66, 0.84);
    const white = top.taijiMode === 'yang' ? dominant : 1 - dominant;
    return { white, black: 1 - white };
  }

  function drawSpinningTaiji(top) {
    const { white, black } = taijiShares(top);
    const yang = top.taijiMode === 'yang';
    const R = top.r * 0.59;
    const sign = Math.sign(top.omega) || 1;
    const rotation = top.angle + time * 0.32 * sign;
    const offset = (white - 0.5) * R * 1.32;
    const amplitude = R * 0.43;
    const pulse = 0.5 + 0.5 * Math.sin((top.taijiPulse || 0) * 1.18);

    ctx.save();
    ctx.translate(top.x, top.y);
    ctx.rotate(rotation);

    // Opaque base covers the old static centre artwork.
    ctx.fillStyle = '#070a0f';
    ctx.beginPath();
    ctx.arc(0, 0, R * 1.06, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, Math.PI * 2);
    ctx.clip();

    // Black base, then a sampled S-curve fills the live white proportion.
    ctx.fillStyle = '#080b11';
    ctx.fillRect(-R, -R, R * 2, R * 2);
    ctx.fillStyle = '#f8fbff';
    ctx.beginPath();
    const steps = 36;
    for (let i = 0; i <= steps; i++) {
      const y = -R + (2 * R * i) / steps;
      const x = offset + amplitude * Math.sin(Math.PI * y / R);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.arc(0, 0, R, Math.PI / 2, Math.PI * 1.5, false);
    ctx.closePath();
    ctx.fill();

    // Opposite-colour eyes follow the two lobes.
    const upperX = offset - amplitude * 0.46;
    const lowerX = offset + amplitude * 0.46;
    ctx.fillStyle = '#f8fbff';
    ctx.beginPath();
    ctx.arc(upperX, -R * 0.50, R * 0.105, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#080b11';
    ctx.beginPath();
    ctx.arc(lowerX, R * 0.50, R * 0.105, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.globalCompositeOperation = 'screen';
    ctx.shadowBlur = 12 + (top.taijiChi || 0) * 0.09;
    ctx.shadowColor = yang ? '#ffd978' : '#65e6c2';
    ctx.strokeStyle = alpha(yang ? '#fff2b8' : '#dffff6', 0.48 + pulse * 0.18);
    ctx.lineWidth = Math.max(1.4, top.r * 0.045);
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, Math.PI * 2);
    ctx.stroke();

    // Alternating arcs make the angular motion readable even at high speed.
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2 + time * (yang ? 1.9 : 1.15) * sign;
      ctx.strokeStyle = alpha(i % 2 ? '#ffffff' : (yang ? '#ffd978' : '#65e6c2'), 0.11 + pulse * 0.09);
      ctx.lineWidth = 1.1 + i * 0.22;
      ctx.beginPath();
      ctx.arc(0, 0, top.r * (1.08 + i * 0.105), a, a + Math.PI * (0.42 + white * 0.18));
      ctx.stroke();
    }
    ctx.restore();

    // Replace the old status caption with the actual visual ratio.
    const yinPct = Math.round(black * 100);
    const yangPct = 100 - yinPct;
    const label = `${yang ? '陽・發勁' : '陰・化勁'}　陰 ${yinPct}%｜陽 ${yangPct}%`;
    const fontSize = Math.max(8, top.r * 0.265);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `800 ${fontSize}px system-ui`;
    const width = ctx.measureText(label).width + 12;
    const y = top.y - top.r * 1.68;
    ctx.fillStyle = 'rgba(4,7,13,.78)';
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') ctx.roundRect(top.x - width / 2, y - fontSize * 0.72, width, fontSize * 1.45, fontSize * 0.55);
    else ctx.rect(top.x - width / 2, y - fontSize * 0.72, width, fontSize * 1.45);
    ctx.fill();
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = alpha('#ffffff', 0.84 + pulse * 0.12);
    ctx.shadowBlur = 9;
    ctx.shadowColor = yang ? '#ffd978' : '#65e6c2';
    ctx.fillText(label, top.x, y);
    ctx.restore();
  }

  Top = class Top extends PriorTop {
    draw() {
      if (!this.c?.taijiV2) {
        super.draw();
        return;
      }

      // Suppress only the old Taiji status caption; all other labels remain intact.
      const originalFillText = ctx.fillText;
      ctx.fillText = function(text, ...args) {
        if (typeof text === 'string' && (text.startsWith('陰・化勁') || text.startsWith('陽・發勁'))) return;
        return originalFillText.call(this, text, ...args);
      };
      try {
        super.draw();
      } finally {
        ctx.fillText = originalFillText;
      }

      if (this.out || this.burst) return;
      drawSpinningTaiji(this);
    }
  };

  document.documentElement.dataset.taijiRotation = 'active';
})();