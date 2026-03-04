import React, { useState, useRef, useEffect, useMemo } from "react";
import { useTheme } from '../components/theme-provider';

export function LandscapeGenerationPage() {
  const { theme } = useTheme();

  // --- STATE ---
  const [dataset, setDataset] = useState<'sine' | 'step' | 'linear' | 'cluster'>('sine');
  const [w1, setW1] = useState(-2.2);
  const [w2, setW2] = useState(1.4);
  const [lossVal, setLossVal] = useState(0);

  const canvas3DRef = useRef<HTMLCanvasElement>(null);
  const canvas2DRef = useRef<HTMLCanvasElement>(null);
  
  const viewRef = useRef({ rotY: -0.8, rotX: 0.75 });
  const gridRef = useRef({ nx: 60, ny: 50, z: new Float32Array(0), zMin: 0, zMax: 1 });

  // Parameter bounds
  const W1 = useMemo(() => ({ min: -4, max: 4 }), []);
  const W2 = useMemo(() => ({ min: -3, max: 3 }), []);

  // --- MODEL & DATA ---
  const xs = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 41; i++) arr.push(-2 + 4 * (i / 40));
    return arr;
  }, []);

  const targetFn = useMemo(() => {
    switch (dataset) {
      case 'sine': return (x: number) => 0.8 * Math.sin(1.7 * x) + 0.15 * Math.cos(3.2 * x);
      case 'step': return (x: number) => (x > 0 ? 0.7 : -0.7);
      case 'linear': return (x: number) => 0.4 * x;
      case 'cluster': return (x: number) => Math.exp(-x * x * 2) * 1.5 - 0.5;
      default: return (x: number) => 0;
    }
  }, [dataset]);

  function yhat(w1: number, w2: number, x: number) {
    return Math.tanh(w1 * x) * w2;
  }

  function calculateLoss(w1: number, w2: number) {
    let s = 0;
    for (const x of xs) {
      const e = yhat(w1, w2, x) - targetFn(x);
      s += e * e;
    }
    // Add mild regularization for stability
    const reg = 0.01 * (w1 * w1 + 0.6 * w2 * w2);
    return (s / xs.length) + reg;
  }

  // --- MATH HELPERS ---
  function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }
  function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
  
  function project3D(x: number, y: number, z: number, cx: number, cy: number, scale: number, rotX: number, rotY: number) {
    const cosy = Math.cos(rotY), siny = Math.sin(rotY);
    let x1 = x * cosy + z * siny;
    let z1 = -x * siny + z * cosy;

    const cosx = Math.cos(rotX), sinx = Math.sin(rotX);
    let y2 = y * cosx - z1 * sinx;
    let z2 = y * sinx + z1 * cosx;

    const persp = 1 / (1 + z2 * 0.9);
    return { X: cx + x1 * scale * persp, Y: cy + y2 * scale * persp };
  }

  // --- REBUILD 3D SURFACE GRID ---
  function rebuildGrid() {
    const g = gridRef.current;
    g.z = new Float32Array(g.nx * g.ny);
    let mn = Infinity, mx = -Infinity;

    for (let j = 0; j < g.ny; j++) {
      const ww2 = lerp(W2.min, W2.max, j / (g.ny - 1));
      for (let i = 0; i < g.nx; i++) {
        const ww1 = lerp(W1.min, W1.max, i / (g.nx - 1));
        const v = calculateLoss(ww1, ww2);
        g.z[j * g.nx + i] = v;
        mn = Math.min(mn, v); mx = Math.max(mx, v);
      }
    }
    g.zMin = mn; g.zMax = mx;
    setLossVal(calculateLoss(w1, w2));
  }

  // --- DRAW 3D LANDSCAPE ---
  function draw3D() {
    const canvas = canvas3DRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    const cssW = canvas.clientWidth, cssH = canvas.clientHeight;
    
    if (canvas.width !== cssW * dpr || canvas.height !== cssH * dpr) {
      canvas.width = cssW * dpr; canvas.height = cssH * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);
    ctx.fillStyle = "#06080b";
    ctx.fillRect(0, 0, cssW, cssH);

    const { nx, ny, z, zMin, zMax } = gridRef.current;
    const { rotX, rotY } = viewRef.current;
    const cx = cssW * 0.5, cy = cssH * 0.52;
    const scale = Math.min(cssW, cssH) * 0.12;

    function shade(t: number) {
      const v = Math.floor(30 + 210 * (1 - t));
      return `rgb(${(v * 0.55) | 0},${(v * 0.7) | 0},${v | 0})`;
    }

    // Painter's Algorithm sorting
    const cells = [];
    for (let j = 0; j < ny - 1; j++) {
      for (let i = 0; i < nx - 1; i++) cells.push({ i, j, key: i + j });
    }
    cells.sort((a, b) => b.key - a.key);

    const worldXSize = (W1.max - W1.min);
    const worldYSize = (W2.max - W2.min);
    const worldZSize = (zMax - zMin) || 1;

    for (const c of cells) {
      const i = c.i, j = c.j;
      const w1a = lerp(W1.min, W1.max, i / (nx - 1));
      const w1b = lerp(W1.min, W1.max, (i + 1) / (nx - 1));
      const w2a = lerp(W2.min, W2.max, j / (ny - 1));
      const w2b = lerp(W2.min, W2.max, (j + 1) / (ny - 1));

      const z00 = z[j * nx + i], z10 = z[j * nx + (i + 1)];
      const z01 = z[(j + 1) * nx + i], z11 = z[(j + 1) * nx + (i + 1)];

      function toWorld(w1v: number, w2v: number, zv: number) {
        return {
          x: ((w1v - (W1.min + W1.max) / 2) / worldXSize) * 2,
          y: -(((w2v - (W2.min + W2.max) / 2) / worldYSize) * 2),
          z: ((zv - zMin) / worldZSize) * 1.6
        };
      }

      const p00 = project3D(toWorld(w1a, w2a, z00).x, toWorld(w1a, w2a, z00).y, toWorld(w1a, w2a, z00).z, cx, cy, scale, rotX, rotY);
      const p10 = project3D(toWorld(w1b, w2a, z10).x, toWorld(w1b, w2a, z10).y, toWorld(w1b, w2a, z10).z, cx, cy, scale, rotX, rotY);
      const p11 = project3D(toWorld(w1b, w2b, z11).x, toWorld(w1b, w2b, z11).y, toWorld(w1b, w2b, z11).z, cx, cy, scale, rotX, rotY);
      const p01 = project3D(toWorld(w1a, w2b, z01).x, toWorld(w1a, w2b, z01).y, toWorld(w1a, w2b, z01).z, cx, cy, scale, rotX, rotY);

      const t = clamp(((z00 + z10 + z11 + z01) / 4 - zMin) / (zMax - zMin + 1e-9), 0, 1);

      ctx.beginPath();
      ctx.moveTo(p00.X, p00.Y); ctx.lineTo(p10.X, p10.Y);
      ctx.lineTo(p11.X, p11.Y); ctx.lineTo(p01.X, p01.Y);
      ctx.closePath();
      ctx.fillStyle = shade(t); ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.06)"; ctx.lineWidth = 1; ctx.stroke();
    }

    // Draw Current Point
    const curZ = calculateLoss(w1, w2);
    const Xw = ((w1 - (W1.min + W1.max) / 2) / worldXSize) * 2;
    const Yw = -(((w2 - (W2.min + W2.max) / 2) / worldYSize) * 2);
    const Zw = ((curZ - zMin) / worldZSize) * 1.6;
    
    const curP = project3D(Xw, Yw, Zw, cx, cy, scale, rotX, rotY);
    ctx.fillStyle = theme.colors.primary; 
    ctx.beginPath(); ctx.arc(curP.X, curP.Y, 8, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke();
  }

  // --- DRAW 2D ERRORS ---
  function draw2D() {
    const canvas = canvas2DRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    const cssW = canvas.clientWidth, cssH = canvas.clientHeight;
    
    if (canvas.width !== cssW * dpr || canvas.height !== cssH * dpr) {
      canvas.width = cssW * dpr; canvas.height = cssH * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    // Plot box
    ctx.strokeStyle = "rgba(255,255,255,0.12)"; ctx.lineWidth = 1;
    ctx.strokeRect(10, 10, cssW - 20, cssH - 20);

    let ymin = Infinity, ymax = -Infinity;
    for (const x of xs) {
      const yt = targetFn(x), yp = yhat(w1, w2, x);
      ymin = Math.min(ymin, yt, yp); ymax = Math.max(ymax, yt, yp);
    }
    ymin -= 0.3; ymax += 0.3;

    function mapX(x: number) { return 10 + ((x - -2) / 4) * (cssW - 20); }
    function mapY(y: number) { return cssH - 10 - ((y - ymin) / (ymax - ymin + 1e-9)) * (cssH - 20); }

    // 1. Draw Residuals (Error lines)
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(239, 68, 68, 0.7)"; // Red for errors
    xs.forEach((x) => {
      const ty = targetFn(x);
      const py = yhat(w1, w2, x);
      ctx.beginPath();
      ctx.moveTo(mapX(x), mapY(ty));
      ctx.lineTo(mapX(x), mapY(py));
      ctx.stroke();
    });

    // 2. Draw Target Curve
    ctx.lineWidth = 2.5; ctx.strokeStyle = "rgba(233,238,247,0.5)"; ctx.beginPath();
    xs.forEach((x, i) => {
      if (i === 0) ctx.moveTo(mapX(x), mapY(targetFn(x))); else ctx.lineTo(mapX(x), mapY(targetFn(x)));
    });
    ctx.stroke();

    // 3. Draw Prediction Curve
    ctx.lineWidth = 3; ctx.strokeStyle = theme.colors.primary; ctx.beginPath();
    xs.forEach((x, i) => {
      if (i === 0) ctx.moveTo(mapX(x), mapY(yhat(w1, w2, x))); else ctx.lineTo(mapX(x), mapY(yhat(w1, w2, x)));
    });
    ctx.stroke();

    // 4. Draw Data Points
    ctx.fillStyle = "#fff";
    for (const x of xs) {
      ctx.beginPath(); ctx.arc(mapX(x), mapY(targetFn(x)), 2.5, 0, Math.PI * 2); ctx.fill();
    }
  }

  // --- EFFECT HOOKS ---
  useEffect(() => {
    rebuildGrid();
  }, [dataset]);

  useEffect(() => {
    setLossVal(calculateLoss(w1, w2));
    draw3D();
    draw2D();
  }, [dataset, w1, w2]);

  // 3D Drag Rotation Logic
  useEffect(() => {
    const canvas = canvas3DRef.current;
    if (!canvas) return;
    let dragging = false, lastX = 0, lastY = 0;

    function onDown(e: any) {
      dragging = true; lastX = e.clientX; lastY = e.clientY;
      canvas?.setPointerCapture(e.pointerId);
    }
    function onMove(e: any) {
      if (!dragging) return;
      viewRef.current.rotY += (e.clientX - lastX) * 0.01;
      viewRef.current.rotX = clamp(viewRef.current.rotX + (e.clientY - lastY) * 0.01, 0.15, 1.4);
      lastX = e.clientX; lastY = e.clientY;
      draw3D();
    }
    function onUp() { dragging = false; }

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    return () => {
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
    };
  }, []);

  // --- STYLES ---
  const panelStyle = {
    backgroundColor: theme.colors.card, 
    border: `1px solid ${theme.colors.border}`, 
    borderRadius: 8, 
    overflow: 'hidden' as const, 
    display: 'flex', 
    flexDirection: 'column' as const
  };

  const headerStyle = {
    height: 32, 
    backgroundColor: theme.colors.muted, 
    borderBottom: `1px solid ${theme.colors.border}`, 
    display: 'flex', 
    alignItems: 'center', 
    padding: '0 12px'
  };

  const headerTextStyle = {
    fontSize: 10, 
    fontWeight: 'bold' as const, 
    color: theme.colors.mutedForeground, 
    letterSpacing: 0.5 
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', fontFamily: "system-ui, sans-serif", padding: 16 }}>
      
      {/* PAGE TITLE */}
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ color: theme.colors.foreground, fontSize: 20, margin: 0 }}>Understanding Loss Generation</h1>
        <p style={{ color: theme.colors.mutedForeground, fontSize: 12, margin: '4px 0 0 0' }}>
          See how the shape of the dataset mathematically creates the mountains and valleys of the 3D loss landscape.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'row', gap: 16, flex: 1 }}>
        
        {/* LEFT COLUMN: CONFIGURATION */}
        <div style={{ ...panelStyle, width: '25%', minWidth: 250 }}>
          <div style={headerStyle}>
            <span style={headerTextStyle}>DATASET & MODEL</span>
          </div>

          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 24 }}>
            
            {/* DATASET SELECTOR */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 10, fontWeight: '900', color: theme.colors.foreground, opacity: 0.8 }}>SELECT DATASET</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['sine', 'step', 'linear', 'cluster'].map((ds) => (
                  <button 
                    key={ds}
                    onClick={() => setDataset(ds as any)}
                    style={{
                      flex: 1, minWidth: '40%', padding: '6px 0', fontSize: 11, borderRadius: 6, fontWeight: 'bold', cursor: 'pointer',
                      backgroundColor: dataset === ds ? theme.colors.primary : 'transparent',
                      color: dataset === ds ? theme.colors.primaryForeground : theme.colors.foreground,
                      border: `1px solid ${dataset === ds ? theme.colors.primary : theme.colors.border}`
                    }}
                  >
                    {ds.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* PARAMETER SLIDERS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <span style={{ fontSize: 10, fontWeight: '900', color: theme.colors.foreground, opacity: 0.8 }}>ADJUST PARAMETERS</span>
              
              <label style={{ fontSize: 10, color: theme.colors.foreground, display: 'flex', flexDirection: 'column', gap: 6 }}>
                Weight 1 (w1): <span style={{ color: theme.colors.primary }}>{w1.toFixed(2)}</span>
                <input type="range" min="-4" max="4" step="0.05" value={w1} onChange={(e) => setW1(parseFloat(e.target.value))} style={{ width: '100%' }} />
              </label>

              <label style={{ fontSize: 10, color: theme.colors.foreground, display: 'flex', flexDirection: 'column', gap: 6 }}>
                Weight 2 (w2): <span style={{ color: theme.colors.primary }}>{w2.toFixed(2)}</span>
                <input type="range" min="-3" max="3" step="0.05" value={w2} onChange={(e) => setW2(parseFloat(e.target.value))} style={{ width: '100%' }} />
              </label>
            </div>

            {/* MATH EXPLANATION */}
            <div style={{ padding: 12, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 8, borderLeft: `4px solid ${theme.colors.border}` }}>
              <div style={{ fontSize: 11, color: theme.colors.mutedForeground, lineHeight: 1.6 }}>
                <b style={{ color: theme.colors.foreground }}>Model:</b> ŷ = tanh(w1·x) · w2<br/><br/>
                Every time you change the dataset, the <b>target (y)</b> changes. This completely reshapes the Mean Squared Error calculation, morphing the 3D landscape!
              </div>
            </div>

          </div>
        </div>

        {/* MIDDLE COLUMN: 3D LANDSCAPE */}
        <div style={{ ...panelStyle, flex: 2, minWidth: 400 }}>
          <div style={headerStyle}>
            <span style={headerTextStyle}>MORPHING 3D LANDSCAPE (DRAG TO ROTATE)</span>
          </div>
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
              <div style={{ flex: 1, position: 'relative', overflow: 'hidden', borderRadius: 8, border: `1px solid ${theme.colors.border}` }}>
                <canvas ref={canvas3DRef} style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000', touchAction: 'none' }} />
              </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ERROR VISUALIZATION */}
        <div style={{ ...panelStyle, flex: 1.5, minWidth: 300 }}>
          <div style={headerStyle}>
            <span style={headerTextStyle}>ERROR GENERATION (RESIDUALS)</span>
          </div>
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
              <div style={{ flex: 1, position: 'relative', overflow: 'hidden', borderRadius: 8, border: `1px solid ${theme.colors.border}` }}>
                <canvas ref={canvas2DRef} style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000', touchAction: 'none' }} />
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: 10, borderRadius: 6, border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                <span style={{ fontSize: 11, color: theme.colors.foreground, fontWeight: '600' }}>TOTAL LOSS (MSE):</span>
                <span style={{ fontSize: 14, color: '#ef4444', fontWeight: 'bold', fontFamily: 'monospace' }}>{lossVal.toFixed(4)}</span>
              </div>

              <div style={{ color: theme.colors.mutedForeground, fontSize: 11, lineHeight: 1.4 }}>
                The <span style={{color: '#ef4444'}}><b>red vertical lines</b></span> represent the errors (ŷ - y). The landscape height is calculated by squaring all of these red lines and adding them together!
              </div>
          </div>
        </div>

      </div>
    </div>
  );
}