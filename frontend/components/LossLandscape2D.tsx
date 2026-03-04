import React, { useRef, useEffect } from 'react';
import { useTheme } from '../components/theme-provider';

export default function LossLandscape2D() {
  const { theme } = useTheme();

  const landRef = useRef(null);
  const curveRef = useRef(null);

  const lrRef = useRef(null);
  const noiseRef = useRef(null);
  const roughRef = useRef(null);

  const lrValRef = useRef(null);
  const noiseValRef = useRef(null);
  const roughValRef = useRef(null);

  const statsRef = useRef(null);
  const stepBtnRef = useRef(null);
  const runBtnRef = useRef(null);
  const resetBtnRef = useRef(null);

  useEffect(() => {
    // ---------- tiny "dataset" & model ----------
    const xs = [];
    for (let i = 0; i < 41; i++) xs.push(-2 + 4 * (i / 40)); // [-2,2]
    function target(x: number) {
      return 0.8 * Math.sin(1.7 * x) + 0.15 * Math.cos(3.2 * x);
      //  return 0.8 * Math.tanh(x) - 0.4 * Math.tanh(2 * x);
    }
    function yhat(w1: number, w2: number, x: number) {
      return Math.tanh(w1 * x) * w2;
      //   return w1 * Math.tanh(x) + w2 * Math.tanh(2 * x);
    }

    function dataLoss(w1: number, w2: number) {
      let s = 0;
      for (const x of xs) {
        const e = yhat(w1, w2, x) - target(x);
        s += e * e;
      }
      return s / xs.length;
    }

    function roughnessTerm(w1: number, w2: number, rough: number) {
      if (rough <= 0) return 0;
      const a = Math.sin(2.2 * w1) * Math.cos(2.0 * w2);
      const b = Math.sin(1.1 * w1 * w2);
      return rough * (0.05 * a + 0.03 * b * b);
    }

    function loss(w1: number, w2: number, rough: number) {
      const reg = 0.01 * (w1 * w1 + 0.6 * w2 * w2);
      return dataLoss(w1, w2) + reg + roughnessTerm(w1, w2, rough);
    }

    function grad(w1: number, w2: number, rough: number) {
      const eps = 1e-3;
      const L = loss(w1, w2, rough);
      const dw1 = (loss(w1 + eps, w2, rough) - L) / eps;
      const dw2 = (loss(w1, w2 + eps, rough) - L) / eps;
      return { dw1, dw2 };
    }

    // ---------- DOM / canvas ----------
    const land = landRef.current;
    const curve = curveRef.current;
    const lctx = land.getContext('2d');
    const cctx = curve.getContext('2d');

    const lrEl = lrRef.current;
    const noiseEl = noiseRef.current;
    const roughEl = roughRef.current;

    const lrVal = lrValRef.current;
    const noiseVal = noiseValRef.current;
    const roughVal = roughValRef.current;

    const stats = statsRef.current;
    const stepBtn = stepBtnRef.current;
    const runBtn = runBtnRef.current;
    const resetBtn = resetBtnRef.current;

    const W1 = { min: -8, max: 8 };
    const W2 = { min: -6, max: 6 };

    let w1 = -2.2,
      w2 = 1.4;
    let path = [{ w1, w2 }];
    let running = false;
    let raf = null;

    // ---------- helpers ----------
    function clamp(v: number, lo: number, hi: number) {
      return Math.max(lo, Math.min(hi, v));
    }

    function toCanvas(w1v: number, w2v: number) {
      const x = ((w1v - W1.min) / (W1.max - W1.min)) * land.width;
      const y = (1 - (w2v - W2.min) / (W2.max - W2.min)) * land.height;
      return { x, y };
    }
    function fromCanvas(x: number, y: number) {
      const ww1 = W1.min + (x / land.width) * (W1.max - W1.min);
      const ww2 = W2.min + (1 - y / land.height) * (W2.max - W2.min);
      return { w1: ww1, w2: ww2 };
    }

    function fmt(n: number) {
      return (Math.round(n * 1000) / 1000).toFixed(3);
    }

    function updateLabels() {
      lrVal.textContent = `(${fmt(parseFloat(lrEl.value))})`;
      noiseVal.textContent = `(${fmt(parseFloat(noiseEl.value))})`;
      roughVal.textContent = `(${fmt(parseFloat(roughEl.value))})`;
    }

    // ---------- NEW: heatmap shading (low=blue, high=red) ----------
    function shade(t: number) {
      t = Math.max(0, Math.min(1, t));
      let r = 0,
        g = 0,
        b = 0;

      if (t < 0.33) {
        const u = t / 0.33;
        r = 0;
        g = Math.round(255 * u);
        b = 255;
      } else if (t < 0.66) {
        const u = (t - 0.33) / 0.33;
        r = Math.round(255 * u);
        g = 255;
        b = Math.round(255 * (1 - u));
      } else {
        const u = (t - 0.66) / 0.34;
        r = 255;
        g = Math.round(255 * (1 - u));
        b = 0;
      }
      return { r, g, b };
    }

    // ---------- drawing: landscape ----------
    const grid = { w: 140, h: 100, vals: new Float32Array(), min: 0, max: 1, rough: null };

    function rebuildGrid() {
      const rough = parseFloat(roughEl.value);
      grid.rough = rough;
      grid.vals = new Float32Array(grid.w * grid.h);
      let mn = Infinity,
        mx = -Infinity;

      for (let j = 0; j < grid.h; j++) {
        const ww2 = W2.min + (j / (grid.h - 1)) * (W2.max - W2.min);
        for (let i = 0; i < grid.w; i++) {
          const ww1 = W1.min + (i / (grid.w - 1)) * (W1.max - W1.min);
          const v = loss(ww1, ww2, rough);
          const idx = j * grid.w + i;
          grid.vals[idx] = v;
          mn = Math.min(mn, v);
          mx = Math.max(mx, v);
        }
      }
      grid.min = mn;
      grid.max = mx;
    }

    function drawLandscape() {
      const img = lctx.createImageData(land.width, land.height);
      const rough = parseFloat(roughEl.value);

      for (let y = 0; y < land.height; y++) {
        const gy = Math.round((y / (land.height - 1)) * (grid.h - 1));
        for (let x = 0; x < land.width; x++) {
          const gx = Math.round((x / (land.width - 1)) * (grid.w - 1));
          const v = grid.vals[gy * grid.w + gx];
          const t = (v - grid.min) / (grid.max - grid.min + 1e-9);

          const { r, g, b } = shade(t);
          const idx = (y * land.width + x) * 4;
          img.data[idx + 0] = r;
          img.data[idx + 1] = g;
          img.data[idx + 2] = b;
          img.data[idx + 3] = 255;
        }
      }
      lctx.putImageData(img, 0, 0);

      lctx.globalAlpha = 0.18;
      lctx.lineWidth = 1;
      for (let k = 0; k < 12; k++) {
        const level = grid.min + (k / 11) * (grid.max - grid.min);
        lctx.beginPath();
        for (let j = 0; j < grid.h; j++) {
          for (let i = 0; i < grid.w; i++) {
            const v = grid.vals[j * grid.w + i];
            if (Math.abs(v - level) < (grid.max - grid.min) / 180) {
              const ww1 = W1.min + (i / (grid.w - 1)) * (W1.max - W1.min);
              const ww2 = W2.min + (j / (grid.h - 1)) * (W2.max - W2.min);
              const p = toCanvas(ww1, ww2);
              lctx.moveTo(p.x, p.y);
              lctx.arc(p.x, p.y, 0.8, 0, Math.PI * 2);
            }
          }
        }
        lctx.strokeStyle = 'rgba(0,0,0,0.55)';
        lctx.stroke();
      }
      lctx.globalAlpha = 1;

      lctx.fillStyle = 'rgba(233,238,247,0.92)';
      lctx.font = '12px system-ui';
      lctx.fillText('w1 →', 12, 18);
      lctx.save();
      lctx.translate(12, land.height - 12);
      lctx.rotate(-Math.PI / 2);
      lctx.fillText('w2 →', 0, 0);
      lctx.restore();

      lctx.lineWidth = 2.5;
      lctx.strokeStyle = 'rgba(125,211,252,0.95)';
      lctx.beginPath();
      for (let i = 0; i < path.length; i++) {
        const p = toCanvas(path[i].w1, path[i].w2);
        if (i === 0) lctx.moveTo(p.x, p.y);
        else lctx.lineTo(p.x, p.y);
      }
      lctx.stroke();

      const p = toCanvas(w1, w2);
      lctx.fillStyle = 'rgba(125,211,252,1)';
      lctx.beginPath();
      lctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
      lctx.fill();
      lctx.strokeStyle = 'rgba(0,0,0,0.55)';
      lctx.lineWidth = 2;
      lctx.stroke();

      const L = loss(w1, w2, rough);
      stats.innerHTML = `w1=<b>${fmt(w1)}</b> · w2=<b>${fmt(w2)}</b><br/>loss=<b>${fmt(L)}</b> · steps=<b>${path.length - 1}</b>`;
    }

    function drawCurve() {
      cctx.clearRect(0, 0, curve.width, curve.height);
      cctx.strokeStyle = 'rgba(255,255,255,0.12)';
      cctx.lineWidth = 1;
      cctx.strokeRect(10, 10, curve.width - 20, curve.height - 20);

      let ymin = Infinity,
        ymax = -Infinity;
      for (const x of xs) {
        const yt = target(x),
          yp = yhat(w1, w2, x);
        ymin = Math.min(ymin, yt, yp);
        ymax = Math.max(ymax, yt, yp);
      }
      ymin -= 0.2;
      ymax += 0.2;

      function mapX(x) {
        return 10 + ((x - -2) / 4) * (curve.width - 20);
      }
      function mapY(y) {
        return (
          curve.height -
          10 -
          ((y - ymin) / (ymax - ymin + 1e-9)) * (curve.height - 20)
        );
      }

      cctx.lineWidth = 2.5;
      cctx.strokeStyle = 'rgba(233,238,247,0.9)';
      cctx.beginPath();
      xs.forEach((x, i) => {
        const X = mapX(x),
          Y = mapY(target(x));
        if (i === 0) cctx.moveTo(X, Y);
        else cctx.lineTo(X, Y);
      });
      cctx.stroke();

      cctx.lineWidth = 3;
      cctx.strokeStyle = 'rgba(125,211,252,0.95)';
      cctx.beginPath();
      xs.forEach((x, i) => {
        const X = mapX(x),
          Y = mapY(yhat(w1, w2, x));
        if (i === 0) cctx.moveTo(X, Y);
        else cctx.lineTo(X, Y);
      });
      cctx.stroke();

      cctx.fillStyle = 'rgba(233,238,247,0.6)';
      for (const x of xs) {
        const X = mapX(x),
          Y = mapY(target(x));
        cctx.beginPath();
        cctx.arc(X, Y, 1.6, 0, Math.PI * 2);
        cctx.fill();
      }

      cctx.fillStyle = 'rgba(168,179,199,0.95)';
      cctx.font = '12px system-ui';
      cctx.fillText('Target', 18, 26);
      cctx.fillStyle = 'rgba(125,211,252,0.95)';
      cctx.fillText('Prediction', 75, 26);
    }

    function stepGD() {
      const lr = parseFloat(lrEl.value),
        noise = parseFloat(noiseEl.value),
        rough = parseFloat(roughEl.value);
      const { dw1, dw2 } = grad(w1, w2, rough);
      const n1 = (Math.random() * 2 - 1) * noise,
        n2 = (Math.random() * 2 - 1) * noise;
      w1 = clamp(w1 - lr * (dw1 + n1), W1.min, W1.max);
      w2 = clamp(w2 - lr * (dw2 + n2), W2.min, W2.max);
      path.push({ w1, w2 });
      if (path.length > 400) path.shift();
    }

    function tick() {
      stepGD();
      drawCurve();
      drawLandscape();
      if (running) raf = requestAnimationFrame(tick);
    }

    let dragging = false;
    function onPointerDown(e) {
      const rect = land.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (land.width / rect.width);
      const y = (e.clientY - rect.top) * (land.height / rect.height);
      const p = toCanvas(w1, w2);
      if (Math.pow(x - p.x, 2) + Math.pow(y - p.y, 2) < 324) {
        dragging = true;
        land.setPointerCapture(e.pointerId);
      } else {
        const ww = fromCanvas(x, y);
        w1 = clamp(ww.w1, W1.min, W1.max);
        w2 = clamp(ww.w2, W2.min, W2.max);
        path = [{ w1, w2 }];
        drawCurve();
        drawLandscape();
      }
    }

    function onPointerMove(e) {
      if (!dragging) return;
      const rect = land.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (land.width / rect.width);
      const y = (e.clientY - rect.top) * (land.height / rect.height);
      const ww = fromCanvas(x, y);
      w1 = clamp(ww.w1, W1.min, W1.max);
      w2 = clamp(ww.w2, W2.min, W2.max);
      path = [{ w1, w2 }];
      drawCurve();
      drawLandscape();
    }
    function onPointerUp() {
      dragging = false;
    }

    land.addEventListener('pointerdown', onPointerDown);
    land.addEventListener('pointermove', onPointerMove);
    land.addEventListener('pointerup', onPointerUp);
    land.addEventListener('pointercancel', onPointerUp);

    function onStep() {
      stepGD();
      drawCurve();
      drawLandscape();
    }
    function onRunToggle() {
      running = !running;
      runBtn.textContent = running ? 'Stop' : 'Run';
      if (running) {
        tick();
      } else {
        cancelAnimationFrame(raf);
      }
    }
    function onReset() {
      running = false;
      runBtn.textContent = 'Run';
      cancelAnimationFrame(raf);
      w1 = -2.2;
      w2 = 1.4;
      path = [{ w1, w2 }];
      drawCurve();
      drawLandscape();
    }

    stepBtn.addEventListener('click', onStep);
    runBtn.addEventListener('click', onRunToggle);
    resetBtn.addEventListener('click', onReset);

    function onSlider() {
      updateLabels();
      if (grid.rough !== parseFloat(roughEl.value)) rebuildGrid();
      drawCurve();
      drawLandscape();
    }
    function onLabelOnly() {
      updateLabels();
    }

    lrEl.addEventListener('input', onLabelOnly);
    noiseEl.addEventListener('input', onLabelOnly);
    roughEl.addEventListener('input', onSlider);

    updateLabels();
    rebuildGrid();
    drawCurve();
    drawLandscape();

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      land.removeEventListener('pointerdown', onPointerDown);
      land.removeEventListener('pointermove', onPointerMove);
      land.removeEventListener('pointerup', onPointerUp);
      land.removeEventListener('pointercancel', onPointerUp);
      stepBtn.removeEventListener('click', onStep);
      runBtn.removeEventListener('click', onRunToggle);
      resetBtn.removeEventListener('click', onReset);
      lrEl.removeEventListener('input', onLabelOnly);
      noiseEl.removeEventListener('input', onLabelOnly);
      roughEl.removeEventListener('input', onSlider);
    };
  }, []);

  // Shared generic styles
  const panelStyle = {
    backgroundColor: theme.colors.card,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: 8,
    overflow: 'hidden' as const,
    display: 'flex',
    flexDirection: 'column' as const,
  };

  const headerStyle = {
    height: 32,
    backgroundColor: theme.colors.muted,
    borderBottom: `1px solid ${theme.colors.border}`,
    display: 'flex',
    alignItems: 'center',
    padding: '0 12px',
  };

  const headerTextStyle = {
    fontSize: 10,
    fontWeight: 'bold' as const,
    color: theme.colors.mutedForeground,
    letterSpacing: 0.5,
  };

  const btnStyle = {
    backgroundColor: 'transparent',
    color: theme.colors.foreground,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.md || 6,
    padding: '8px 12px',
    fontSize: 12,
    fontWeight: '600' as const,
    cursor: 'pointer',
    flex: 1,
    textAlign: 'center' as const,
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        gap: 16,
        width: '100%',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {/* LEFT COLUMN: PATH CONFIGURATION */}
      <div style={{ ...panelStyle, width: '25%', minWidth: 250 }}>
        <div style={headerStyle}>
          <span style={headerTextStyle}>PATH CONFIGURATION</span>
        </div>

        <div
          style={{
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
            overflowY: 'auto',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <label
              style={{
                fontSize: 10,
                fontWeight: '900',
                color: theme.colors.foreground,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                opacity: 0.8,
              }}
            >
              LEARNING RATE{' '}
              <span
                ref={lrValRef}
                style={{
                  fontSize: 9,
                  fontWeight: '600',
                  color: theme.colors.mutedForeground,
                  opacity: 0.8,
                }}
              />
              <input
                ref={lrRef}
                type='range'
                min='0.001'
                max='0.2'
                defaultValue='0.04'
                step='0.001'
                style={{ width: '100%' }}
              />
            </label>

            <label
              style={{
                fontSize: 10,
                fontWeight: '900',
                color: theme.colors.foreground,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                opacity: 0.8,
              }}
            >
              GRADIENT NOISE{' '}
              <span
                ref={noiseValRef}
                style={{
                  fontSize: 9,
                  fontWeight: '600',
                  color: theme.colors.mutedForeground,
                  opacity: 0.8,
                }}
              />
              <input
                ref={noiseRef}
                type='range'
                min='0'
                max='0.35'
                defaultValue='0.03'
                step='0.005'
                style={{ width: '100%' }}
              />
            </label>

            <label
              style={{
                fontSize: 10,
                fontWeight: '900',
                color: theme.colors.foreground,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                opacity: 0.8,
              }}
            >
              LANDSCAPE ROUGHNESS{' '}
              <span
                ref={roughValRef}
                style={{
                  fontSize: 9,
                  fontWeight: '600',
                  color: theme.colors.mutedForeground,
                  opacity: 0.8,
                }}
              />
              <input
                ref={roughRef}
                type='range'
                min='0'
                max='1'
                defaultValue='0.35'
                step='0.01'
                style={{ width: '100%' }}
              />
            </label>
          </div>

          <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
            <button
              ref={stepBtnRef}
              style={{
                ...btnStyle,
                backgroundColor: theme.colors.primary,
                color: theme.colors.primaryForeground,
                borderColor: theme.colors.primary,
              }}
            >
              Step GD
            </button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button ref={runBtnRef} style={btnStyle}>
                Run
              </button>
              <button ref={resetBtnRef} style={btnStyle}>
                Reset
              </button>
            </div>
          </div>

          {/* Stats View */}
          <div
            style={{
              padding: 12,
              backgroundColor: 'rgba(0,0,0,0.2)',
              borderRadius: 8,
              borderLeft: `4px solid ${theme.colors.primary}`,
            }}
          >
            <div
              ref={statsRef}
              style={{
                fontSize: 11,
                color: theme.colors.foreground,
                fontFamily: 'monospace',
                lineHeight: 1.6,
              }}
            />
          </div>
        </div>
      </div>

      {/* MIDDLE COLUMN: 2D LOSS LANDSCAPE */}
      <div style={{ ...panelStyle, flex: 2, minWidth: 400 }}>
        <div style={headerStyle}>
          <span style={headerTextStyle}>LOSS LANDSCAPE VISUALISATION</span>
        </div>

        <div
          style={{
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            flex: 1,
          }}
        >
          <div
            style={{
              flex: 1,
              position: 'relative',
              overflow: 'hidden',
              borderRadius: 8,
              border: `1px solid ${theme.colors.border}`,
            }}
          >
            {/* Ensure canvas scales within flex container */}
            <canvas
              ref={landRef}
              width={720}
              height={520}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                background: '#000',
                touchAction: 'none',
              }}
            />
          </div>

          <div
            style={{
              color: theme.colors.mutedForeground,
              fontSize: 11,
              lineHeight: 1.4,
            }}
          >
            Drag the dot to set parameters (w1, w2). The path shows gradient
            descent updates on the loss surface. The “net” is:{' '}
            <b>ŷ = tanh(w1·x) · w2</b> trained to match a target curve. Low loss
            = blue, high loss = red.
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: MODEL PREDICTION */}
      <div style={{ ...panelStyle, flex: 1.5, minWidth: 300 }}>
        <div style={headerStyle}>
          <span style={headerTextStyle}>TARGET VS PREDICTION</span>
        </div>

        <div
          style={{
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            flex: 1,
          }}
        >
          <div
            style={{
              flex: 1,
              position: 'relative',
              overflow: 'hidden',
              borderRadius: 8,
              border: `1px solid ${theme.colors.border}`,
            }}
          >
            {/* Ensure canvas scales within flex container */}
            <canvas
              ref={curveRef}
              width={520}
              height={300}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                background: '#000',
                touchAction: 'none',
              }}
            />
          </div>

          <div
            style={{
              color: theme.colors.mutedForeground,
              fontSize: 11,
              lineHeight: 1.4,
            }}
          >
            Try: (1) turn noise up and watch the path “jiggle” out of shallow
            spots, (2) crank learning rate and see overshoot, (3) drag into a
            steep area and step a few times.
          </div>
        </div>
      </div>
    </div>
  );
}
