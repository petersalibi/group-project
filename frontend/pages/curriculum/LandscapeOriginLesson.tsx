import React, { useState, useMemo } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, PanResponder } from "react-native";
import { Text } from "../../components/text";
import { Slider } from "../../components/slider";
import { Target, RefreshCw, ZoomIn, ZoomOut, BarChart3, Layers, RotateCw, Move } from "lucide-react-native";
import Svg, { Circle, Line, G, Rect, Polygon } from "react-native-svg";

const DATA = Array.from({ length: 45 }, (_, i) => {
  const x = -0.98 + (i * 0.045); 
  return { x, y: (x * 0.45) + (Math.sin(i * 0.4) * 0.12) + (Math.cos(i * 0.9) * 0.08) };
});

const GRID_SIZE = 14; 
const RANGE = [-10, 10]; 

export function LandscapeOriginLesson({ onTaskUpdate }: any) {
  const [m, setM] = useState(0.5);
  const [b, setB] = useState(0);
  const [history, setHistory] = useState<any[]>([]);
  const [zoom, setZoom] = useState(140);
  const [fillMode, setFillMode] = useState(1);
  const [rotationY, setRotationY] = useState(0.6); 
  const [offset, setOffset] = useState({ x: 500, y: 800 }); 

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (evt, gesture) => {
      const touches = evt.nativeEvent.touches.length;
      if (touches === 1) {
        setRotationY(prev => prev + gesture.dx * 0.005);
      } else if (touches >= 2) {
        setOffset(prev => ({
          x: prev.x + gesture.dx * 0.1,
          y: prev.y + gesture.dy * 0.1
        }));
      }
    },
  }), []);

  const currentMSE = useMemo(() => 
    DATA.reduce((acc, p) => acc + Math.pow((m * p.x + b) - p.y, 2), 0) / DATA.length, 
  [m, b]);

  const project = (mVal: number, bVal: number, lossVal: number) => {
    const x0 = mVal * (zoom * 0.25);
    const z0 = bVal * (zoom * 0.25);
    const y0 = Math.atan(lossVal / 10) * (zoom * 4.5);
    const x1 = x0 * Math.cos(rotationY) + z0 * Math.sin(rotationY);
    const z1 = -x0 * Math.sin(rotationY) + z0 * Math.cos(rotationY);
    const pitch = 0.35; 
    const y2 = y0 * Math.cos(pitch) - z1 * Math.sin(pitch);
    return { x: x1, y: -y2 }; 
  };

  const getInterpolatedHeight = (gridM: number, gridB: number) => {
    if (history.length === 0) return 0;
    let totalWeight = 0, weightedHeight = 0;
    history.forEach(p => {
      const distSq = Math.pow(gridM - p.m, 2) + Math.pow(gridB - p.b, 2) + 0.2;
      const weight = 1 / Math.pow(distSq, 2.5); 
      weightedHeight += p.mse * weight;
      totalWeight += weight;
    });
    return weightedHeight / (totalWeight || 1);
  };

  const renderBlanket = () => {
    if (fillMode === 0) return null;
    const cells = [];
    const step = (RANGE[1] - RANGE[0]) / GRID_SIZE;
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        const m1 = RANGE[0] + i * step, m2 = RANGE[0] + (i + 1) * step;
        const b1 = RANGE[0] + j * step, b2 = RANGE[0] + (j + 1) * step;
        const p1 = project(m1, b1, getInterpolatedHeight(m1, b1));
        const p2 = project(m2, b1, getInterpolatedHeight(m2, b1));
        const p3 = project(m2, b2, getInterpolatedHeight(m2, b2));
        const p4 = project(m1, b2, getInterpolatedHeight(m1, b2));
        cells.push(
          <Polygon key={`c-${i}-${j}`} points={`${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`}
            fill="#C6F382" fillOpacity={history.length === 0 ? 0.05 : 0.15} stroke="#C6F382" strokeWidth="0.4" />
        );
      }
    }
    return cells;
  };

  return (
    <View style={styles.mainContainer}>
      <View style={styles.groupContainer}>
        
        {/* LEFT PANEL */}
        <View style={styles.subPanel}>
          <View style={styles.subHeader}>
            <BarChart3 size={10} color="#C6F382" />
            <Text style={styles.subTitle}>DATASET RESIDUAL ANALYSIS</Text>
          </View>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.wideGraphBox}>
              <Svg width="100%" height="100%" viewBox="0 0 600 240">
                <Rect width="600" height="240" fill="#080a0f" rx={4} />
                <Line x1="50" y1="120" x2="550" y2="120" stroke="#16191f" strokeWidth="2" />
                
                {/* GHOST LINES (History) */}
                {history.map((h, idx) => (
                  <Line 
                    key={`ghost-${idx}`}
                    x1={50} y1={120-(h.m*-1+h.b)*60} 
                    x2={550} y2={120-(h.m*1+h.b)*60} 
                    stroke="#C6F382" strokeWidth="1" opacity={0.2} 
                  />
                ))}

                {/* RESIDUALS & POINTS (Zoomed out scale: *60 instead of *95) */}
                {DATA.map((p, i) => (
                  <G key={i}>
                    <Line x1={300+p.x*250} y1={120-p.y*60} x2={300+p.x*250} y2={120-(m*p.x+b)*60} stroke="#ff4d4d" strokeWidth="1.8" strokeDasharray="3,3" opacity={0.6} />
                    <Circle cx={300+p.x*250} cy={120-p.y*60} r="3.5" fill="#fff" />
                  </G>
                ))}
                
                {/* CURRENT REGRESSION LINE */}
                <Line x1={50} y1={120-(m*-1+b)*60} x2={550} y2={120-(m*1+b)*60} stroke="#f59e0b" strokeWidth="5" />
              </Svg>
            </View>
            <View style={styles.metricStrip}>
              <View><Text style={styles.metricLabel}>MSE (L)</Text><Text style={styles.metricValue}>{currentMSE.toFixed(6)}</Text></View>
              <TouchableOpacity style={styles.toggleBtn} onPress={() => setFillMode(fillMode === 1 ? 0 : 1)}>
                <Layers size={12} color="#C6F382" />
                <Text style={styles.toggleText}>{fillMode === 1 ? 'FILL: ON' : 'FILL: OFF'}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.controlGroup}>
              <Text style={styles.controlLabel}>SLOPE (M): {m.toFixed(2)}</Text>
              <Slider value={m} min={-10} max={10} step={0.01} onValueChange={setM} />
              <Text style={styles.controlLabel}>INTERCEPT (B): {b.toFixed(2)}</Text>
              <Slider value={b} min={-10} max={10} step={0.01} onValueChange={setB} />
            </View>
            <TouchableOpacity style={styles.captureBtn} onPress={() => setHistory([...history, {m, b, mse: currentMSE, id: Date.now()}])}>
              <Target size={14} color="#000" />
              <Text style={styles.captureBtnText}>RECORD PARAMETER SET</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* RIGHT PANEL */}
        <View style={[styles.subPanel, { flex: 1.4, backgroundColor: '#040507' }]} {...panResponder.panHandlers}>
          <View style={styles.subHeader}>
            <RotateCw size={10} color="#C6F382" />
            <Text style={styles.subTitle}>3D ERROR TOPOGRAPHY</Text>
            <View style={styles.headerControls}>
              <TouchableOpacity onPress={() => setZoom(z => z + 20)}><ZoomIn size={14} color="#fff" /></TouchableOpacity>
              <TouchableOpacity onPress={() => setZoom(z => Math.max(20, z - 20))}><ZoomOut size={14} color="#fff" /></TouchableOpacity>
              <TouchableOpacity onPress={() => {setHistory([]); setRotationY(0.6); setZoom(140); setOffset({x: 500, y: 800});}}>
                <RefreshCw size={14} color="#f59e0b" />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.landscapeWrapper}>
            <Svg width="100%" height="100%" viewBox="0 0 1000 1000">
              <G transform={`translate(${offset.x}, ${offset.y})`}>
                <G opacity="0.15">
                   {[-10, 0, 10].map(v => (
                    <React.Fragment key={v}>
                      <Line {...project(v, -10, 0)} {...project(v, 10, 0)} stroke="white" strokeWidth="1" />
                      <Line {...project(-10, v, 0)} {...project(10, v, 0)} stroke="white" strokeWidth="1" />
                    </React.Fragment>
                  ))}
                </G>
                {renderBlanket()}
                {history.map((p) => {
                  const pos = project(p.m, p.b, p.mse);
                  return <Circle key={p.id} cx={pos.x} cy={pos.y} r="5" fill="#C6F382" opacity={0.6} />;
                })}
                {(() => {
                  const tip = project(m, b, currentMSE);
                  const floor = project(m, b, 0);
                  return (
                    <G>
                      <Line x1={floor.x} y1={floor.y} x2={tip.x} y2={tip.y} stroke="#f59e0b" strokeWidth="3.5" opacity={0.7} />
                      <Circle cx={tip.x} cy={tip.y} r="10" fill="#f59e0b" />
                    </G>
                  );
                })()}
              </G>
            </Svg>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#000' },
  groupContainer: { flex: 1, flexDirection: 'row', gap: 1, backgroundColor: '#1a1d23' },
  subPanel: { flex: 1, backgroundColor: '#06080a' },
  subHeader: { height: 32, backgroundColor: '#0f1117', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, borderBottomWidth: 1, borderColor: '#1e222b', gap: 6 },
  headerControls: { marginLeft: 'auto', flexDirection: 'row', gap: 14, alignItems: 'center' },
  subTitle: { fontSize: 7, fontWeight: '900', color: '#555', letterSpacing: 1 },
  scrollContent: { paddingHorizontal: 20, paddingVertical: 16 },
  wideGraphBox: { width: '100%', aspectRatio: 2.1, marginBottom: 16 },
  metricStrip: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, padding: 14, backgroundColor: '#0b0e14', borderRadius: 4 },
  metricLabel: { fontSize: 7, fontWeight: '900', color: '#444' },
  metricValue: { fontSize: 22, fontWeight: '700', color: '#f59e0b' },
  toggleBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 4, borderWidth: 1, borderColor: '#C6F382' },
  toggleText: { fontSize: 7, fontWeight: '900', color: '#C6F382' },
  controlGroup: { width: '100%', gap: 12 },
  controlLabel: { fontSize: 8, fontWeight: '900', color: '#666' },
  captureBtn: { backgroundColor: '#C6F382', height: 48, borderRadius: 4, marginTop: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  captureBtnText: { fontSize: 9, fontWeight: '900', color: '#000' },
  landscapeWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});