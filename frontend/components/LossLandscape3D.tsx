import React, { useState, useRef, useEffect, useMemo } from "react";

/**
 * LossLandscape3D
 * - 3D-ish surface render of loss(w1, w2)
 * - drag to rotate view
 * - click to move the parameter point
 * - step gradient descent and see the path on the surface
 *
 * Notes:
 * - Pure canvas (no WebGL). Works in any modern browser.
 * - Intended as a learning toy, not a fast renderer.
 */
export default function LossLandscape3D() {
  const canvasRef = useRef(null);

  // Parameter bounds
  const W1 = useMemo(() => ({ min: -4, max: 4 }), []);
  const W2 = useMemo(() => ({ min: -3, max: 3 }), []);

  // Fixed learning step (kept constant to avoid “LR confusion”)
  const STEP_SIZE = 0.06;

  // Tiny dataset and model: yhat = tanh(w1*x) * w2
  const xs = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 41; i++) arr.push(-2 + 4 * (i / 40));
    return arr;
  }, []);

  function target(x) {
    return 0.8 * Math.sin(1.7 * x) + 0.15 * Math.cos(3.2 * x);
  }
  function yhat(w1, w2, x) {
    return Math.tanh(w1 * x) * w2;
  }
  function dataLoss(w1, w2) {
    let s = 0;
    for (const x of xs) {
      const e = yhat(w1, w2, x) - target(x);
      s += e * e;
    }
    return s / xs.length;
  }
  function loss(w1, w2) {
    // mild regularization to keep things stable
    const reg = 0.01 * (w1 * w1 + 0.6 * w2 * w2);
    return dataLoss(w1, w2) + reg;
  }
  function grad(w1, w2) {
    // numerical gradient
    const eps = 1e-3;
    const L = loss(w1, w2);
    const dw1 = (loss(w1 + eps, w2) - L) / eps;
    const dw2 = (loss(w1, w2 + eps) - L) / eps;
    return { dw1, dw2 };
  }

  // State: current parameters and path
  const [w1, setW1] = useState(-2.2);
  const [w2, setW2] = useState(1.4);
  const pathRef = useRef([{ w1: -2.2, w2: 1.4 }]);

  // View rotation (drag to rotate)
  const viewRef = useRef({
    rotY: -0.8, // left-right rotation
    rotX: 0.75, // tilt
  });

  // Precomputed surface grid
  const gridRef = useRef({
    nx: 90,
    ny: 70,
    z: null, // Float32Array
    zMin: 0,
    zMax: 1,
  });

  const [stats, setStats] = useState({
    L: loss(-2.2, 1.4),
    zMin: 0,
    zMax: 1,
    steps: 0,
  });

  // Helpers
  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  // Map w1/w2 to grid indices and back
  function wToGrid(w1v, w2v, nx, ny) {
    const tx = (w1v - W1.min) / (W1.max - W1.min);
    const ty = (w2v - W2.min) / (W2.max - W2.min);
    const i = clamp(Math.round(tx * (nx - 1)), 0, nx - 1);
    const j = clamp(Math.round(ty * (ny - 1)), 0, ny - 1);
    return { i, j };
  }

  // Simple 3D projection (rotate then perspective-ish scale)
  function project3D(x, y, z, cx, cy, scale, rotX, rotY) {
    // rotate around Y
    const cosy = Math.cos(rotY), siny = Math.sin(rotY);
    let x1 = x * cosy + z * siny;
    let z1 = -x * siny + z * cosy;

    // rotate around X
    const cosx = Math.cos(rotX), sinx = Math.sin(rotX);
    let y2 = y * cosx - z1 * sinx;
    let z2 = y * sinx + z1 * cosx;

    // mild perspective
    const persp = 1 / (1 + z2 * 0.9);
    const X = cx + x1 * scale * persp;
    const Y = cy + y2 * scale * persp;
    return { X, Y, persp };
  }

  // Draw
  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;
    if (canvas.width !== cssW * dpr || canvas.height !== cssH * dpr) {
      canvas.width = cssW * dpr;
      canvas.height = cssH * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const W = cssW, H = cssH;
    ctx.clearRect(0, 0, W, H);

    // background
    ctx.fillStyle = "#06080b";
    ctx.fillRect(0, 0, W, H);

    const { nx, ny, z, zMin, zMax } = gridRef.current;
    const { rotX, rotY } = viewRef.current;

    // World coordinates: x=w1, y=-w2 (so up is +w2), z = loss height
    // Normalize to a nice box
    const worldXSize = (W1.max - W1.min);
    const worldYSize = (W2.max - W2.min);
    const worldZSize = (zMax - zMin) || 1;

    const cx = W * 0.5;
    const cy = H * 0.52;
    const scale = Math.min(W, H) * 0.12;

    // Color mapping for height (low=dark, high=bright)
    function shade(t) {
      // t in [0,1]
      const v = Math.floor(30 + 210 * (1 - t));
      return `rgb(${(v * 0.55) | 0},${(v * 0.7) | 0},${v | 0})`;
    }

    // Draw surface as a set of small quads (painter’s algorithm)
    // Sort by approximate depth (j+i) for stable ordering
    const cells = [];
    for (let j = 0; j < ny - 1; j++) {
      for (let i = 0; i < nx - 1; i++) {
        cells.push({ i, j, key: i + j });
      }
    }
    // back-to-front (bigger key first often looks better here)
    cells.sort((a, b) => b.key - a.key);

    for (const c of cells) {
      const i = c.i, j = c.j;

      const idx00 = j * nx + i;
      const idx10 = j * nx + (i + 1);
      const idx01 = (j + 1) * nx + i;
      const idx11 = (j + 1) * nx + (i + 1);

      const w1a = lerp(W1.min, W1.max, i / (nx - 1));
      const w1b = lerp(W1.min, W1.max, (i + 1) / (nx - 1));
      const w2a = lerp(W2.min, W2.max, j / (ny - 1));
      const w2b = lerp(W2.min, W2.max, (j + 1) / (ny - 1));

      const z00 = z[idx00], z10 = z[idx10], z01 = z[idx01], z11 = z[idx11];

      // normalize world coords to roughly -1..1
      function toWorld(w1v, w2v, zv) {
        const x = ((w1v - (W1.min + W1.max) / 2) / worldXSize) * 2;
        const y = -(((w2v - (W2.min + W2.max) / 2) / worldYSize) * 2);
        const zz = ((zv - zMin) / worldZSize) * 1.6; // vertical exaggeration
        return { x, y, z: zz };
      }

      const p00w = toWorld(w1a, w2a, z00);
      const p10w = toWorld(w1b, w2a, z10);
      const p11w = toWorld(w1b, w2b, z11);
      const p01w = toWorld(w1a, w2b, z01);

      const p00 = project3D(p00w.x, p00w.y, p00w.z, cx, cy, scale, rotX, rotY);
      const p10 = project3D(p10w.x, p10w.y, p10w.z, cx, cy, scale, rotX, rotY);
      const p11 = project3D(p11w.x, p11w.y, p11w.z, cx, cy, scale, rotX, rotY);
      const p01 = project3D(p01w.x, p01w.y, p01w.z, cx, cy, scale, rotX, rotY);

      const zAvg = (z00 + z10 + z11 + z01) / 4;
      const t = clamp((zAvg - zMin) / (zMax - zMin + 1e-9), 0, 1);

      ctx.beginPath();
      ctx.moveTo(p00.X, p00.Y);
      ctx.lineTo(p10.X, p10.Y);
      ctx.lineTo(p11.X, p11.Y);
      ctx.lineTo(p01.X, p01.Y);
      ctx.closePath();

      ctx.fillStyle = shade(t);
      ctx.fill();

      // faint grid lines
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Draw path and current point
    function worldFromParams(w1v, w2v) {
      const zv = loss(w1v, w2v);
      const x = ((w1v - (W1.min + W1.max) / 2) / (W1.max - W1.min)) * 2;
      const y = -(((w2v - (W2.min + W2.max) / 2) / (W2.max - W2.min)) * 2);
      const zz = ((zv - zMin) / (zMax - zMin + 1e-9)) * 1.6;
      return { x, y, z: zz, L: zv };
    }

    const path = pathRef.current;

    // Path polyline
    ctx.strokeStyle = "rgba(125,211,252,0.95)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let k = 0; k < path.length; k++) {
      const pw = worldFromParams(path[k].w1, path[k].w2);
      const pp = project3D(pw.x, pw.y, pw.z, cx, cy, scale, rotX, rotY);
      if (k === 0) ctx.moveTo(pp.X, pp.Y);
      else ctx.lineTo(pp.X, pp.Y);
    }
    ctx.stroke();

    // Current point
    const curW = worldFromParams(w1, w2);
    const curP = project3D(curW.x, curW.y, curW.z, cx, cy, scale, rotX, rotY);
    ctx.fillStyle = "rgba(125,211,252,1)";
    ctx.beginPath();
    ctx.arc(curP.X, curP.Y, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.6)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Legend: low/high loss
    const legendX = 14, legendY = 14, legendW = 140, legendH = 12;
    const grad = ctx.createLinearGradient(legendX, 0, legendX + legendW, 0);
    // low loss = darker; high loss = brighter (matching shade())
    grad.addColorStop(0, "rgb(130,165,240)");
    grad.addColorStop(1, "rgb(20,26,38)");
    // The gradient above is just a hint; the actual surface uses shade(t).
    // Keep text explicit so it's unambiguous.
    ctx.fillStyle = "rgba(18,22,28,0.7)";
    ctx.fillRect(10, 10, 240, 56);
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.strokeRect(10, 10, 240, 56);

    ctx.font = "12px system-ui";
    ctx.fillStyle = "rgba(233,238,247,0.95)";
    ctx.fillText("Loss height: low → high", 14, 28);

    // Draw a simple bar using shade() endpoints for consistency
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(legendX, legendY + 26, legendW, legendH);
    for (let x = 0; x < legendW; x++) {
      const t = x / (legendW - 1);
      ctx.fillStyle = shade(t);
      ctx.fillRect(legendX + x, legendY + 26, 1, legendH);
    }
    ctx.fillStyle = "rgba(168,179,199,0.95)";
    ctx.fillText(`min ${zMin.toFixed(3)}`, legendX, legendY + 52);
    ctx.fillText(`max ${zMax.toFixed(3)}`, legendX + legendW - 62, legendY + 52);
  }

  // Build surface grid once (and when needed)
  function rebuildGrid() {
    const g = gridRef.current;
    const { nx, ny } = g;
    const z = new Float32Array(nx * ny);
    let mn = Infinity, mx = -Infinity;

    for (let j = 0; j < ny; j++) {
      const ww2 = lerp(W2.min, W2.max, j / (ny - 1));
      for (let i = 0; i < nx; i++) {
        const ww1 = lerp(W1.min, W1.max, i / (nx - 1));
        const v = loss(ww1, ww2);
        z[j * nx + i] = v;
        mn = Math.min(mn, v);
        mx = Math.max(mx, v);
      }
    }
    g.z = z;
    g.zMin = mn;
    g.zMax = mx;

    setStats((s) => ({ ...s, zMin: mn, zMax: mx, L: loss(w1, w2), steps: pathRef.current.length - 1 }));
  }

  // Step GD
  function stepGD() {
    const g = grad(w1, w2);
    const nw1 = clamp(w1 - STEP_SIZE * g.dw1, W1.min, W1.max);
    const nw2 = clamp(w2 - STEP_SIZE * g.dw2, W2.min, W2.max);

    setW1(nw1);
    setW2(nw2);
    pathRef.current = [...pathRef.current, { w1: nw1, w2: nw2 }].slice(-500);

    setStats((s) => ({ ...s, L: loss(nw1, nw2), steps: pathRef.current.length - 1 }));
  }

  function reset() {
    const nw1 = -2.2, nw2 = 1.4;
    setW1(nw1);
    setW2(nw2);
    pathRef.current = [{ w1: nw1, w2: nw2 }];
    setStats((s) => ({ ...s, L: loss(nw1, nw2), steps: 0 }));
  }

  // Canvas interaction: rotate + click-to-move parameters
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let dragging = false;
    let mode = "rotate"; // rotate by default
    let lastX = 0, lastY = 0;

    function getXY(e) {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left);
      const y = (e.clientY - rect.top);
      return { x, y, rect };
    }

    // Shift+drag to rotate; click to set params
    function onDown(e) {
      const { x, y } = getXY(e);
      dragging = true;
      lastX = x;
      lastY = y;
      mode = e.shiftKey ? "rotate" : "maybeClick";
      canvas.setPointerCapture(e.pointerId);
    }

    function onMove(e) {
      if (!dragging) return;
      const { x, y } = getXY(e);
      const dx = x - lastX;
      const dy = y - lastY;
      lastX = x;
      lastY = y;

      if (mode === "maybeClick") {
        // if they move more than a tiny threshold, interpret as rotate
        if (Math.abs(dx) + Math.abs(dy) > 6) mode = "rotate";
      }

      if (mode === "rotate") {
        viewRef.current.rotY += dx * 0.01;
        viewRef.current.rotX += dy * 0.01;
        viewRef.current.rotX = clamp(viewRef.current.rotX, 0.15, 1.4);
        draw();
      }
    }

    function onUp(e) {
      if (!dragging) return;
      dragging = false;

      // If it was a click (not rotate), map click to w1/w2 (simple: choose nearest grid point by screen-space search)
      // This is intentionally simple but effective for learning: click a visible point on surface.
      if (mode === "maybeClick") {
        const { x, y, rect } = getXY(e);
        // Brute-force: find nearest projected grid vertex to click
        const ctxW = rect.width;
        const ctxH = rect.height;
        const { nx, ny, z, zMin, zMax } = gridRef.current;
        const { rotX, rotY } = viewRef.current;

        const cx = ctxW * 0.5;
        const cy = ctxH * 0.52;
        const scale = Math.min(ctxW, ctxH) * 0.12;

        let best = { d2: Infinity, w1: w1, w2: w2 };

        for (let j = 0; j < ny; j++) {
          const ww2 = lerp(W2.min, W2.max, j / (ny - 1));
          for (let i = 0; i < nx; i++) {
            const ww1 = lerp(W1.min, W1.max, i / (nx - 1));
            const zv = z[j * nx + i];
            const worldXSize = (W1.max - W1.min);
            const worldYSize = (W2.max - W2.min);
            const worldZSize = (zMax - zMin) || 1;

            const Xw = ((ww1 - (W1.min + W1.max) / 2) / worldXSize) * 2;
            const Yw = -(((ww2 - (W2.min + W2.max) / 2) / worldYSize) * 2);
            const Zw = ((zv - zMin) / worldZSize) * 1.6;

            const p = project3D(Xw, Yw, Zw, cx, cy, scale, rotX, rotY);
            const ddx = p.X - x;
            const ddy = p.Y - y;
            const d2 = ddx * ddx + ddy * ddy;

            if (d2 < best.d2) best = { d2, w1: ww1, w2: ww2 };
          }
        }

        // Move params to that point and reset path
        setW1(best.w1);
        setW2(best.w2);
        pathRef.current = [{ w1: best.w1, w2: best.w2 }];
        setStats((s) => ({ ...s, L: loss(best.w1, best.w2), steps: 0 }));
      }

      draw();
    }

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);

    return () => {
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w1, w2]);

  // Init + redraw on state changes
  useEffect(() => {
    rebuildGrid();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Update stats and redraw when params change
    setStats((s) => ({ ...s, L: loss(w1, w2), steps: pathRef.current.length - 1 }));
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w1, w2]);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 16, color: "#e9eef7", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
        <div style={{
          background: "#12161c",
          border: "1px solid #1e2631",
          borderRadius: 16,
          padding: 14,
          boxShadow: "0 10px 30px rgba(0,0,0,.35)"
        }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <h2 style={{ margin: 0, fontSize: 18 }}>3D loss landscape (click to move, Shift+drag to rotate)</h2>
            <div style={{ fontVariantNumeric: "tabular-nums", color: "#a8b3c7", fontSize: 13 }}>
              w1 <b style={{ color: "#e9eef7" }}>{w1.toFixed(3)}</b> · w2{" "}
              <b style={{ color: "#e9eef7" }}>{w2.toFixed(3)}</b> · loss{" "}
              <b style={{ color: "#e9eef7" }}>{stats.L.toFixed(3)}</b> · steps{" "}
              <b style={{ color: "#e9eef7" }}>{stats.steps}</b>
            </div>
          </div>

          <div style={{ marginTop: 10 }}>
            <canvas
              ref={canvasRef}
              style={{
                width: "100%",
                height: 520,
                borderRadius: 12,
                border: "1px solid #1e2631",
                background: "#06080b",
                touchAction: "none",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
            <button onClick={stepGD} style={btnPrimary}>Step gradient descent</button>
            <button
              onClick={() => {
                // Run a short burst so it feels animated without needing a learning-rate UI
                for (let k = 0; k < 15; k++) stepGD();
              }}
              style={btn}
            >
              Run 15 steps
            </button>
            <button onClick={reset} style={btn}>Reset</button>
          </div>

          <div style={{ marginTop: 10, color: "#a8b3c7", fontSize: 13, lineHeight: 1.35 }}>
            The “height” of the surface is the loss: valleys = lower loss, peaks = higher loss.
            <br />
            Model: <b>ŷ = tanh(w1·x) · w2</b> fitted to a target curve (hidden). Your dot is the current (w1, w2).
          </div>
        </div>
      </div>
    </div>
  );
}

const btn = {
  background: "#1a2432",
  color: "#e9eef7",
  border: "1px solid #2a3a52",
  borderRadius: 12,
  padding: "10px 12px",
  cursor: "pointer",
};

const btnPrimary = {
  ...btn,
  background: "#153146",
  border: "1px solid #2a587e",
};
