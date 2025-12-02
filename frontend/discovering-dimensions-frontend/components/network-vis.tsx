import React, { useMemo, useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Line, G, Text as SvgText, Path } from 'react-native-svg';
import { ThemedView } from './themed-view';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/components/theme-provider';

interface NetworkVisProps {
  inputCount: number;
  depth: number;
  width: number;
  activation: string;
  outputCount: number;
  weights?: number[];
}

interface NodeData {
  id: string;
  x: number;
  y: number;
  type: 'input' | 'hidden' | 'output';
  label: string;
  opacity: number;
}

// Easing function for smooth animation
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const lerp = (start: number, end: number, t: number) =>
  start + (end - start) * t;

// Helper to get the SVG path data for the activation symbol
const getActivationPath = (type: string) => {
  switch (type) {
    case 'ReLU':
      return 'M -5 1.5 L 0 1.5 L 5 -3.5';

    case 'LeakyReLU':
      return 'M -5 3 L 0 0 L 5 -5';

    case 'Sigmoid':
      return 'M -5 3 C 0 3 0 -3 5 -3';

    case 'Tanh':
      return 'M -5 4 C -1 4 1 -4 5 -4';

    default:
      return '';
  }
};

const getEdgeStyle = (weight: number | undefined) => {
  if (weight === undefined) return { stroke: '#fff', width: 1, opacity: 0.8 };
  
  // Normalize weight (-1 to 1)
  const val = Math.tanh(weight / 2);
  const magnitude = Math.abs(val);
  
  // Color: Red if > 0, Blue if < 0
  const color = val > 0 ? `rgba(255, 0, 0, 0.8)` : `rgba(0, 100, 255, 0.8)`;
  const width = 1 + magnitude * 10;

  return { stroke: color, width, opacity: 0.8 };
};

const Tooltip = ({ x, y, value, label }: { x: number, y: number, value: number, label: string }) => (
  <View style={{
    position: 'absolute',
    left: x-40,
    top: y-30,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#555',
    zIndex: 100,
  }}>
    <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>
      {label}: {value.toFixed(4)}
    </Text>
  </View>
);

export default function NetworkVis({
  inputCount,
  depth,
  width,
  activation,
  outputCount,
  weights,
}: NetworkVisProps) {
  const { theme } = useTheme();

  // Current dimensions of the SVG container
  const [dimensions, setDimensions] = useState({ w: 0, h: 0 });

  // The nodes currently being rendered
  const [displayNodes, setDisplayNodes] = useState<NodeData[]>([]);

  // Refs to store state between frames without triggering re-renders
  const animationRef = useRef<number | null>(null);
  const prevNodesRef = useRef<Map<string, NodeData>>(new Map());

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setDimensions({ w: width, h: height });
  };

  const targetLayout = useMemo(() => {
    if (dimensions.w === 0 || dimensions.h === 0) return [];

    const { w, h } = dimensions;
    const numHiddenLayers = depth === 1 ? 0 : depth;
    const totalCols = 2 + numHiddenLayers;

    const paddingX = 40;
    const availableW = w - paddingX * 2;
    const getX = (colIndex: number) =>
      paddingX + (availableW / (totalCols - 1)) * colIndex;

    const getY = (nodeIndex: number, totalInLayer: number) => {
      const step = h / (totalInLayer + 1);
      return step * (nodeIndex + 1);
    };

    const nodes: NodeData[] = [];

    // Input Layer
    for (let i = 0; i < inputCount; i++) {
      nodes.push({
        id: `in-${i}`,
        x: getX(0),
        y: getY(i, inputCount),
        type: 'input',
        label: '',
        opacity: 1,
      });
    }

    // Hidden Layers
    for (let l = 1; l <= numHiddenLayers; l++) {
      for (let i = 0; i < width; i++) {
        nodes.push({
          id: `h-${l}-${i}`,
          x: getX(l),
          y: getY(i, width),
          type: 'hidden',
          label: '',
          opacity: 1,
        });
      }
    }

    // Output Layer
    const outputColIndex = totalCols - 1;
    for (let i = 0; i < outputCount; i++) {
      nodes.push({
        id: `out-${i}`,
        x: getX(outputColIndex),
        y: getY(i, outputCount),
        type: 'output',
        label: '',
        opacity: 1,
      });
    }

    return nodes;
  }, [depth, width, inputCount, outputCount, dimensions]);

  // Animation Loop: Interpolate from Prev Layout to Target Layout
  useEffect(() => {
    if (targetLayout.length === 0) return;

    // Snapshot the starting state (where nodes currently are)
    const startMap = new Map(prevNodesRef.current);

    const startTime = performance.now();
    const duration = 600; // Animation duration in ms

    const animate = () => {
      const now = performance.now();
      const elapsed = now - startTime;
      const rawProgress = Math.min(1, elapsed / duration);
      const t = easeOutCubic(rawProgress); // Apply easing

      const currentFrameNodes: NodeData[] = [];

      targetLayout.forEach((targetNode) => {
        const startNode = startMap.get(targetNode.id);

        if (startNode) {
          // Node existed before: Move it
          currentFrameNodes.push({
            ...targetNode,
            x: lerp(startNode.x, targetNode.x, t),
            y: lerp(startNode.y, targetNode.y, t),
            opacity: 1,
          });
        } else {
          // New Node: Fade In (stay at target position)
          currentFrameNodes.push({
            ...targetNode,
            opacity: lerp(0, 1, t),
          });
        }
      });

      // Update Render State
      setDisplayNodes(currentFrameNodes);

      // Update Ref for next interpolation
      const newMap = new Map();
      currentFrameNodes.forEach((n) => newMap.set(n.id, n));
      prevNodesRef.current = newMap;

      if (rawProgress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    // Cancel previous animation if running
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [targetLayout]);

  const [hoveredInfo, setHoveredInfo] = useState<{
    type: 'edge' | 'node';
    indexOrId: string | number; // Index for edges, ID for nodes
    x: number;
    y: number;
  } | null>(null);

  // Calculate edges and biases dynamically based on the current animating positions of nodes
  const { edges, nodeBiases } = useMemo(() => {
    const calculatedEdges: { x1: number; y1: number; x2: number; y2: number, w?: number, weightIndex?: number }[] = [];
    const calculatedBiases: Record<string, number> = {}; // Map node ID to bias value

    // Group nodes
    const inputNodes = displayNodes.filter((n) => n.type === 'input');
    const outputNodes = displayNodes.filter((n) => n.type === 'output');
    
    // Group hidden layers
    const hiddenLayers: NodeData[][] = [];
    displayNodes.filter((n) => n.type === 'hidden').forEach((n) => {
        const parts = n.id.split('-');
        const layerIdx = parseInt(parts[1]) - 1;
        if (!hiddenLayers[layerIdx]) hiddenLayers[layerIdx] = [];
        hiddenLayers[layerIdx].push(n);
    });

    let paramIndex = 0;

    // Helper to process a layer connection
    const processLayer = (sources: NodeData[], targets: NodeData[]) => {
      // Process Weights
       targets.forEach(tgt => {
         sources.forEach(src => {
            const currentWeightIndex = paramIndex;
            const w = weights ? weights[currentWeightIndex] : undefined;
            
            if (w) paramIndex++;
            
            calculatedEdges.push({ 
                x1: src.x, y1: src.y, 
                x2: tgt.x, y2: tgt.y, 
                w,
                weightIndex: w !== undefined ? currentWeightIndex : undefined
            });
         });
       });

       // Process Biases
       targets.forEach(tgt => {
          const b = weights ? weights[paramIndex] : undefined;
          if (weights && b !== undefined) {
              calculatedBiases[tgt.id] = b;
              paramIndex++;
          }
       });
    };
    
    // Input -> First Hidden (or Output if depth=1)
    if (hiddenLayers.length > 0) {
      processLayer(inputNodes, hiddenLayers[0]);
    } else {
      processLayer(inputNodes, outputNodes);
    }

    // Hidden -> Hidden
    for (let i = 0; i < hiddenLayers.length - 1; i++) {
      processLayer(hiddenLayers[i], hiddenLayers[i+1]);
    }

    // Last Hidden -> Output
    if (hiddenLayers.length > 0) {
      processLayer(hiddenLayers[hiddenLayers.length - 1], outputNodes);
    }

    return { edges: calculatedEdges, nodeBiases: calculatedBiases };
  }, [displayNodes, weights]);

  // Helper to get the current live value for the tooltip
  const getTooltipData = () => {
    if (!hoveredInfo) return null;

    let value = 0;
    let label = '';

    if (hoveredInfo.type === 'edge') {
      const idx = hoveredInfo.indexOrId as number;
      // Look up the live weight using the stored index
      value = weights && weights[idx] !== undefined ? weights[idx] : 0;
      label = 'Weight';
    } else {
      // Look up the live bias using the stored Node ID
      const id = hoveredInfo.indexOrId as string;
      value = nodeBiases[id] || 0;
      label = 'Bias';
    }

    return { value, label, x: hoveredInfo.x, y: hoveredInfo.y };
  };

  const tooltipData = getTooltipData();

  return (
    <ThemedView
      style={styles.container}
      onLayout={onLayout}
      lightColor='#cbcbcbff'
    >
      <Svg width='100%' height='100%'>
        <G>
          {edges.map((e, i) => {
            const style = getEdgeStyle(e.w);

            const handleHover = (ev: any) => {
              // Get coordinates relative to the SVG view
              const x = ev.nativeEvent.locationX ?? ev.nativeEvent.offsetX;
              const y = ev.nativeEvent.locationY ?? ev.nativeEvent.offsetY;
              if (e.weightIndex !== undefined) {
                setHoveredInfo({
                  type: 'edge',
                  indexOrId: e.weightIndex,
                  x: x,  // Use dynamic mouse X
                  y: y  // Use dynamic mouse Y
                });
              }
            };

            return (
              <G
                key={`e-${i}`}
                // Update position continuously while moving over the line
                onPointerEnter={(ev: any) => handleHover(ev)}
                onPointerMove={(ev: any) => handleHover(ev)}
                onPointerLeave={() => setHoveredInfo(null)}
              >
                <Line
                  x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
                  stroke={style.stroke}
                  strokeWidth={style.width}
                  opacity={style.opacity}
                />
              </G>
            );
          })}
        </G>
        {displayNodes.map((n) => {
          let fill = '#00aaff';
          if (n.type === 'input') fill = '#ff00aa';
          if (n.type === 'output') fill = '#00c482ff';

          const showIcon = n.type === 'hidden' || n.type === 'output';
          const iconPath = showIcon ? getActivationPath(activation) : '';

          const handleHover = () => {
            // Check if this node actually has a bias
            if (nodeBiases[n.id] !== undefined) {
                setHoveredInfo({ 
                    type: 'node', 
                    indexOrId: n.id, 
                    x: n.x, 
                    y: n.y 
                });
            }
          };

          return (
            <G 
              key={n.id} 
              opacity={n.opacity}
              onMouseEnter={handleHover}
              onMouseLeave={() => setHoveredInfo(null)}
            >
              <Circle
                cx={n.x}
                cy={n.y}
                r={showIcon ? 11 : 8}
                fill={fill}
                stroke='#fff'
                strokeWidth='1.5'
              />

              {/* Activation Symbol */}
              {showIcon && iconPath ? (
                <G x={n.x} y={n.y}>
                  <Path
                    d={iconPath}
                    stroke='#fff'
                    strokeWidth='2'
                    fill='none'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />
                </G>
              ) : null}

              {/* Label (for Input nodes) */}
              {n.label !== undefined ? (
                <SvgText
                  x={n.x}
                  y={n.y + 24}
                  fill='#fff'
                  fontSize='10'
                  fontWeight='bold'
                  textAnchor='middle'
                >
                  {n.label}
                </SvgText>
              ) : null}
            </G>
          );
        })}
      </Svg>

      {tooltipData && (
          <Tooltip 
              x={tooltipData.x} 
              y={tooltipData.y} 
              value={tooltipData.value} 
              label={tooltipData.label}
          />
      )}

      <View style={styles.labelContainer}>
        <Text style={styles.infoText}>
          {activation} • {depth} Hidden • {width} Width
        </Text>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    position: 'relative',
  },
  labelContainer: {
    position: 'absolute',
    bottom: 5,
    right: 10,
    pointerEvents: 'none',
  },
  infoText: {
    color: '#666',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
});
