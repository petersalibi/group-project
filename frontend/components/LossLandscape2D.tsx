import * as React from "react";
from React import { useEffect, useRef } from "react";
import {
useEffect,
  TextStyle,
} from "react-native";


/**
 * LossLandscapePlayground (React version of your original HTML)
 * - Two canvases: loss landscape + curve
 * - Drag the dot / click-to-jump
 * - Step / Run / Reset
 * - Sliders: learning rate, gradient noise, roughness
 * - NEW: Heatmap colors (low loss = blue, high loss = red)
 *
 * Usage:
 *   - Put this in e.g. src/LossLandscapePlayground.jsx
 *   - Render <LossLandscapePlayground />
 */
export default function LossLandscape2D() {
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
    function target(x) {
      return 0.8 * Math.sin(1.7 * x) + 0.15 * Math.cos(3.2 * x);
    //  return 0.8 * Math.tanh(x) - 0.4 * Math.tanh(2 * x);
    }
    function yhat(w1, w2, x) {
      return Math.tanh(w1 * x) * w2;
    //   return w1 * Math.tanh(x) + w2 * Math.tanh(2 * x);

    }

    function dataLoss(w1, w2) {
      let s = 0;
      for (const x of xs) {
        const e = yhat(w1, w2, x) - target(x);
        s += e * e;
      }
      return s / xs.length;
    }

    function roughnessTerm(w1, w2, rough) {
      if (rough <= 0) return 0;
      const a = Math.sin(2.2 * w1) * Math.cos(2.0 * w2);
      const b = Math.sin(1.1 * w1 * w2);
      return rough * (0.05 * a + 0.03 * b * b);
    }

    function loss(w1, w2, rough) {
      const reg = 0.01 * (w1 * w1 + 0.6 * w2 * w2);
      return dataLoss(w1, w2) + reg + roughnessTerm(w1, w2, rough);
    }

    function grad(w1, w2, rough) {
      const eps = 1e-3;
      const L = loss(w1, w2, rough);
      const dw1 = (loss(w1 + eps, w2, rough) - L) / eps;
      const dw2 = (loss(w1, w2 + eps, rough) - L) / eps;
      return { dw1, dw2 };
    }

    // ---------- DOM / canvas ----------
    const land = landRef.current;
    const curve = curveRef.current;
    const lctx = land.getContext("2d");
    const cctx = curve.getContext("2d");

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

    // parameter bounds shown on the landscape
    // const W1 = { min: -4, max: 4 };
    // const W2 = { min: -3, max: 3 };

    const W1 = { min: -8, max: 8 };
    const W2 = { min: -6, max: 6 };


    let w1 = -2.2,
      w2 = 1.4;
    let path = [{ w1, w2 }];
    let running = false;
    let raf = null;

    // ---------- helpers ----------
    function clamp(v, lo, hi) {
      return Math.max(lo, Math.min(hi, v));
    }

    function toCanvas(w1v, w2v) {
      const x = ((w1v - W1.min) / (W1.max - W1.min)) * land.width;
      const y = (1 - (w2v - W2.min) / (W2.max - W2.min)) * land.height;
      return { x, y };
    }
    function fromCanvas(x, y) {
      const ww1 = W1.min + (x / land.width) * (W1.max - W1.min);
      const ww2 = W2.min + (1 - y / land.height) * (W2.max - W2.min);
      return { w1: ww1, w2: ww2 };
    }

    function fmt(n) {
      return (Math.round(n * 1000) / 1000).toFixed(3);
    }

    function updateLabels() {
      lrVal.textContent = `(${fmt(parseFloat(lrEl.value))})`;
      noiseVal.textContent = `(${fmt(parseFloat(noiseEl.value))})`;
      roughVal.textContent = `(${fmt(parseFloat(roughEl.value))})`;
    }

    // ---------- NEW: heatmap shading (low=blue, high=red) ----------
    function shade(t) {
      t = Math.max(0, Math.min(1, t));

      // blue -> cyan -> yellow -> red
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
    const grid = { w: 140, h: 100, vals: [], min: 0, max: 1, rough: null };

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

      // contour-ish lines
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
        // slightly darker lines work better on bright reds/yellows
        lctx.strokeStyle = "rgba(0,0,0,0.55)";
        lctx.stroke();
      }
      lctx.globalAlpha = 1;

      // axes labels
      lctx.fillStyle = "rgba(233,238,247,0.92)";
      lctx.font = "12px system-ui";
      lctx.fillText("w1 →", 12, 18);
      lctx.save();
      lctx.translate(12, land.height - 12);
      lctx.rotate(-Math.PI / 2);
      lctx.fillText("w2 →", 0, 0);
      lctx.restore();

      // draw path
      lctx.lineWidth = 2.5;
      lctx.strokeStyle = "rgba(125,211,252,0.95)";
      lctx.beginPath();
      for (let i = 0; i < path.length; i++) {
        const p = toCanvas(path[i].w1, path[i].w2);
        if (i === 0) lctx.moveTo(p.x, p.y);
        else lctx.lineTo(p.x, p.y);
      }
      lctx.stroke();

      // current point
      const p = toCanvas(w1, w2);
      lctx.fillStyle = "rgba(125,211,252,1)";
      lctx.beginPath();
      lctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
      lctx.fill();
      lctx.strokeStyle = "rgba(0,0,0,0.55)";
      lctx.lineWidth = 2;
      lctx.stroke();

      // stats
      const L = loss(w1, w2, rough);
      stats.innerHTML = `w1=<b>${fmt(w1)}</b> · w2=<b>${fmt(
        w2
      )}</b> · loss=<b>${fmt(L)}</b> · steps=<b>${path.length - 1}</b>`;
    }

    // ---------- drawing: curve ----------
    function drawCurve() {
      cctx.clearRect(0, 0, curve.width, curve.height);

      // plot box
      cctx.strokeStyle = "rgba(255,255,255,0.12)";
      cctx.lineWidth = 1;
      cctx.strokeRect(10, 10, curve.width - 20, curve.height - 20);

      // y-range
      let ymin = Infinity,
        ymax = -Infinity;
      for (const x of xs) {
        const yt = target(x);
        const yp = yhat(w1, w2, x);
        ymin = Math.min(ymin, yt, yp);
        ymax = Math.max(ymax, yt, yp);
      }
      ymin -= 0.2;
      ymax += 0.2;

      function mapX(x) {
        const t = (x - -2) / 4;
        return 10 + t * (curve.width - 20);
      }
      function mapY(y) {
        const t = (y - ymin) / (ymax - ymin + 1e-9);
        return curve.height - 10 - t * (curve.height - 20);
      }

      // target
      cctx.lineWidth = 2.5;
      cctx.strokeStyle = "rgba(233,238,247,0.9)";
      cctx.beginPath();
      xs.forEach((x, i) => {
        const X = mapX(x),
          Y = mapY(target(x));
        if (i === 0) cctx.moveTo(X, Y);
        else cctx.lineTo(X, Y);
      });
      cctx.stroke();

      // prediction
      cctx.lineWidth = 3;
      cctx.strokeStyle = "rgba(125,211,252,0.95)";
      cctx.beginPath();
      xs.forEach((x, i) => {
        const X = mapX(x),
          Y = mapY(yhat(w1, w2, x));
        if (i === 0) cctx.moveTo(X, Y);
        else cctx.lineTo(X, Y);
      });
      cctx.stroke();

      // points
      cctx.fillStyle = "rgba(233,238,247,0.6)";
      for (const x of xs) {
        const X = mapX(x),
          Y = mapY(target(x));
        cctx.beginPath();
        cctx.arc(X, Y, 1.6, 0, Math.PI * 2);
        cctx.fill();
      }

      cctx.fillStyle = "rgba(168,179,199,0.95)";
      cctx.font = "12px system-ui";
      cctx.fillText("Target", 18, 26);
      cctx.fillStyle = "rgba(125,211,252,0.95)";
      cctx.fillText("Prediction", 75, 26);
    }

    // ---------- optimization controls ----------
    function stepGD() {
      const lr = parseFloat(lrEl.value);
      const noise = parseFloat(noiseEl.value);
      const rough = parseFloat(roughEl.value);

      const { dw1, dw2 } = grad(w1, w2, rough);
      const n1 = (Math.random() * 2 - 1) * noise;
      const n2 = (Math.random() * 2 - 1) * noise;

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

    // ---------- interaction: drag the parameter point ----------
    let dragging = false;

    function onPointerDown(e) {
      const rect = land.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (land.width / rect.width);
      const y = (e.clientY - rect.top) * (land.height / rect.height);
      const p = toCanvas(w1, w2);
      const dx = x - p.x,
        dy = y - p.y;

      if (dx * dx + dy * dy < 18 * 18) {
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

    land.addEventListener("pointerdown", onPointerDown);
    land.addEventListener("pointermove", onPointerMove);
    land.addEventListener("pointerup", onPointerUp);
    land.addEventListener("pointercancel", onPointerUp);

    // ---------- buttons ----------
    function onStep() {
      stepGD();
      drawCurve();
      drawLandscape();
    }
    function onRunToggle() {
      running = !running;
      runBtn.textContent = running ? "Stop" : "Run";
      if (running) tick();
      else cancelAnimationFrame(raf);
    }
    function onReset() {
      running = false;
      runBtn.textContent = "Run";
      cancelAnimationFrame(raf);
      w1 = -2.2;
      w2 = 1.4;
      path = [{ w1, w2 }];
      drawCurve();
      drawLandscape();
    }

    stepBtn.addEventListener("click", onStep);
    runBtn.addEventListener("click", onRunToggle);
    resetBtn.addEventListener("click", onReset);

    // ---------- sliders ----------
    function onSlider() {
      updateLabels();
      if (grid.rough !== parseFloat(roughEl.value)) rebuildGrid();
      drawCurve();
      drawLandscape();
    }
    function onLabelOnly() {
      updateLabels();
    }

    lrEl.addEventListener("input", onLabelOnly);
    noiseEl.addEventListener("input", onLabelOnly);
    roughEl.addEventListener("input", onSlider);

    // ---------- init ----------
    updateLabels();
    rebuildGrid();
    drawCurve();
    drawLandscape();

    // cleanup
    return () => {
      running = false;
      cancelAnimationFrame(raf);

      land.removeEventListener("pointerdown", onPointerDown);
      land.removeEventListener("pointermove", onPointerMove);
      land.removeEventListener("pointerup", onPointerUp);
      land.removeEventListener("pointercancel", onPointerUp);

      stepBtn.removeEventListener("click", onStep);
      runBtn.removeEventListener("click", onRunToggle);
      resetBtn.removeEventListener("click", onReset);

      lrEl.removeEventListener("input", onLabelOnly);
      noiseEl.removeEventListener("input", onLabelOnly);
      roughEl.removeEventListener("input", onSlider);
    };
  }, []);

  return (
    <div style={styles.body}>
      <div style={styles.wrap}>
        <div style={styles.card}>
          <h1 style={styles.h1}>Loss landscape (2-parameter tiny neural net)</h1>
          <canvas ref={landRef} width={720} height={520} style={styles.canvas} />
          <div style={{ ...styles.row, marginTop: 10 }}>
            <button ref={stepBtnRef} style={styles.buttonPrimary}>
              Step GD
            </button>
            <button ref={runBtnRef} style={styles.button}>
              Run
            </button>
            <button ref={resetBtnRef} style={styles.button}>
              Reset
            </button>
            <div ref={statsRef} style={{ ...styles.kpi, marginLeft: "auto" }} />
          </div>
          <div style={styles.hint}>
            Drag the dot to set parameters (w1, w2). The path shows gradient descent updates on the loss surface.
            The “net” is: <b>ŷ = tanh(w1·x) · w2</b> trained to match a target curve. This creates valleys, ridges,
            and tricky regions.
            <br />
            <b>Heatmap:</b> low loss = blue, high loss = red.
          </div>
        </div>

        <div style={styles.card}>
          <h1 style={styles.h1}>What the model is doing</h1>
          <canvas ref={curveRef} width={520} height={300} style={styles.canvas} />

          <div style={{ ...styles.row, marginTop: 10 }}>
            <label style={styles.label}>
              Learning rate <span ref={lrValRef} />
              <input ref={lrRef} type="range" min="0.001" max="0.2" defaultValue="0.04" step="0.001" style={styles.range} />
            </label>
            <label style={styles.label}>
              Gradient noise <span ref={noiseValRef} />
              <input ref={noiseRef} type="range" min="0" max="0.35" defaultValue="0.03" step="0.005" style={styles.range} />
            </label>
            <label style={styles.label}>
              Landscape “roughness” <span ref={roughValRef} />
              <input ref={roughRef} type="range" min="0" max="1" defaultValue="0.35" step="0.01" style={styles.range} />
            </label>
          </div>

          <div style={styles.hint}>
            Try: (1) turn noise up and watch the path “jiggle” out of shallow spots, (2) crank learning rate and see
            overshoot, (3) drag into a steep area and step a few times.
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  body: {
    margin: 0,
    background: "#0b0d10",
    color: "#e9eef7",
    fontFamily: "system-ui,-apple-system,Segoe UI,Roboto,sans-serif",
    minHeight: "100vh",
  },
  wrap: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: 18,
    display: "grid",
    gap: 14,
    gridTemplateColumns: "1.25fr 1fr",
  },
  card: {
    background: "#12161c",
    border: "1px solid #1e2631",
    borderRadius: 16,
    padding: 14,
    boxShadow: "0 10px 30px rgba(0,0,0,.35)",
  },
  h1: { fontSize: 18, margin: "0 0 10px" },
  row: { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" },
  button: {
    background: "#1a2432",
    color: "#e9eef7",
    border: "1px solid #2a3a52",
    borderRadius: 12,
    padding: "10px 12px",
    cursor: "pointer",
  },
  buttonPrimary: {
    background: "#153146",
    color: "#e9eef7",
    border: "1px solid #2a587e",
    borderRadius: 12,
    padding: "10px 12px",
    cursor: "pointer",
  },
  label: {
    fontSize: 12,
    color: "#a8b3c7",
    display: "flex",
    flexDirection: "column",
    gap: 6,
    minWidth: 160,
  },
  range: { width: 220 },
  hint: { color: "#a8b3c7", fontSize: 12, lineHeight: 1.35, marginTop: 8 },
  canvas: {
    width: "100%",
    height: "auto",
    borderRadius: 12,
    border: "1px solid #1e2631",
    background: "#06080b",
    touchAction: "none",
    display: "block",
  },
  kpi: { fontVariantNumeric: "tabular-nums", fontSize: 12, color: "#a8b3c7" },
};
