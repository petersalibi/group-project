import React, { useMemo, useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, LayoutChangeEvent, Platform } from 'react-native';
import Svg, { Circle, Line, G, Text as SvgText, Path } from 'react-native-svg';
import { ThemedView } from './themed-view';

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
  type: 'input' | 'hidden' | 'output' | 'ellipsis-h' | 'ellipsis-v';
  label: string;
  opacity: number;
  truncatedCount?: number;
}

const MAX_WIDTH = 10;
const MAX_DEPTH = 10;

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
  if (weight === undefined) return { stroke: '#fff', width: 2, opacity: 0.8 };

  // Normalize weight (-1 to 1)
  const val = Math.tanh(weight / 2);
  const magnitude = Math.abs(val);

  // Color: Green if > 0, Red if < 0
  const color = val > 0 ? `rgba(9, 255, 0, 0.8)` : `rgba(255, 0, 0, 0.8)`;
  const width = 2 + magnitude * 10;

  return { stroke: color, width, opacity: 0.8 };
};

const Tooltip = ({
  x,
  y,
  value,
  label,
}: {
  x: number;
  y: number;
  value: number;
  label: string;
}) => (
  <View
    style={{
      position: 'absolute',
      left: x - 40,
      top: y - 30,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: '#555',
      zIndex: 100,
    }}
  >
    <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>
      {label}: {value.toFixed(4)}
    </Text>
  </View>
);

const NetworkWeightKey = () => (
  <View style={styles.keyContainer}>
    <Text style={styles.keyTitle}>Weights</Text>
    {/* Positive */}
    <View style={styles.keyItem}>
      <Svg width='25' height='10'>
        <Line
          x1='0'
          y1='5'
          x2='25'
          y2='5'
          stroke='rgb(9,255,0)'
          strokeWidth='3'
        />
      </Svg>
      <Text style={styles.keyText}>Positive</Text>
    </View>
    {/* Negative */}
    <View style={styles.keyItem}>
      <Svg width='25' height='10'>
        <Line
          x1='0'
          y1='5'
          x2='25'
          y2='5'
          stroke='rgb(255,0,0)'
          strokeWidth='3'
        />
      </Svg>
      <Text style={styles.keyText}>Negative</Text>
    </View>
  </View>
);

const FONT_FAMILY = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'Arial',
});

export default function NetworkVis({
  inputCount,
  depth,
  width,
  activation,
  outputCount,
  weights,
}: NetworkVisProps) {
  const [dimensions, setDimensions] = useState({ w: 0, h: 0 });
  const [displayNodes, setDisplayNodes] = useState<NodeData[]>([]);
  const animationRef = useRef<number | null>(null);
  const prevNodesRef = useRef<Map<string, NodeData>>(new Map());

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setDimensions({ w: width, h: height });
  };

  const targetLayout = useMemo(() => {
    if (dimensions.w === 0 || dimensions.h === 0) return [];

    const { w, h } = dimensions;

    const isLayerTruncated = depth > MAX_DEPTH;
    
    // Calculate total columns being rendered
    const renderedHiddenCount = isLayerTruncated ? 3 : (depth === 1 ? 0 : depth); 
    let logicalHiddenLayers = depth; 
    if (depth === 1) logicalHiddenLayers = 0;

    const visibleHiddenCols = isLayerTruncated ? 3 : logicalHiddenLayers;
    const totalCols = 2 + visibleHiddenCols; 

    const paddingX = 40;
    const availableW = w - paddingX * 2;
    const getX = (colIndex: number) =>
      paddingX + (availableW / (totalCols - 1)) * colIndex;

    const nodes: NodeData[] = [];

    // Helper to determine Y position and indices for a column
    // If count > MAX_WIDTH, we show: Node 0, Ellipsis, Node Last
    const getColumnNodes = (
        count: number, 
        colX: number, 
        baseId: string, 
        type: 'input' | 'hidden' | 'output'
    ) => {
        const isNodeTruncated = count > MAX_WIDTH;
        const renderCount = isNodeTruncated ? 3 : count;
        
        const colNodes: NodeData[] = [];

        for(let i = 0; i < renderCount; i++) {
            let actualIndex = i;
            let nodeType = type;
            let label = '';
            
            // Determine logical index and visual position
            if (isNodeTruncated) {
                if (i === 0) actualIndex = 0;
                else if (i === 1) {
                    colNodes.push({
                        id: `${baseId}-ellipsis`,
                        x: colX,
                        y: h / 2, // Center vertically
                        type: 'ellipsis-v',
                        label: '',
                        opacity: 1,
                        truncatedCount: count - 2,
                    });
                    continue;
                }
                else if (i === 2) actualIndex = count - 1;
            }

            const step = h / (renderCount + 1);
            const y = step * (i + 1);

            colNodes.push({
                id: `${baseId}-${actualIndex}`,
                x: colX,
                y: y,
                type: nodeType as any,
                label: type === 'input' ? '' : label,
                opacity: 1,
            });
        }
        return colNodes;
    };

    let colIndex = 0;

    // 1. Input Layer
    nodes.push(...getColumnNodes(inputCount, getX(colIndex), 'in', 'input'));
    colIndex++;

    // 2. Hidden Layers
    if (logicalHiddenLayers > 0) {
        if (isLayerTruncated) {
            // Render First Hidden Layer
            nodes.push(...getColumnNodes(width, getX(colIndex), 'h-1', 'hidden'));
            colIndex++;

            // Render Horizontal Ellipsis
            nodes.push({
                id: 'h-ellipsis',
                x: getX(colIndex),
                y: h / 2,
                type: 'ellipsis-h',
                label: '',
                opacity: 1,
                truncatedCount: logicalHiddenLayers - 2,
            });
            colIndex++;

            // Render Last Hidden Layer
            nodes.push(...getColumnNodes(width, getX(colIndex), `h-${logicalHiddenLayers}`, 'hidden'));
            colIndex++;
        } else {
            // Standard Loop
            for (let l = 1; l <= logicalHiddenLayers; l++) {
                nodes.push(...getColumnNodes(width, getX(colIndex), `h-${l}`, 'hidden'));
                colIndex++;
            }
        }
    }

    // 3. Output Layer
    nodes.push(...getColumnNodes(outputCount, getX(colIndex), 'out', 'output'));

    return nodes;
  }, [depth, width, inputCount, outputCount, dimensions]);

  // Animation Loop
  useEffect(() => {
    if (targetLayout.length === 0) return;
    const startMap = new Map(prevNodesRef.current);
    const startTime = performance.now();
    const duration = 600;

    const animate = () => {
      const now = performance.now();
      const elapsed = now - startTime;
      const rawProgress = Math.min(1, elapsed / duration);
      const t = easeOutCubic(rawProgress);

      const currentFrameNodes: NodeData[] = [];

      targetLayout.forEach((targetNode) => {
        const startNode = startMap.get(targetNode.id);
        if (startNode) {
          currentFrameNodes.push({
            ...targetNode,
            x: lerp(startNode.x, targetNode.x, t),
            y: lerp(startNode.y, targetNode.y, t),
            opacity: 1,
          });
        } else {
          currentFrameNodes.push({
            ...targetNode,
            opacity: lerp(0, 1, t),
          });
        }
      });

      setDisplayNodes(currentFrameNodes);
      const newMap = new Map();
      currentFrameNodes.forEach((n) => newMap.set(n.id, n));
      prevNodesRef.current = newMap;

      if (rawProgress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [targetLayout]);

  const [hoveredInfo, setHoveredInfo] = useState<{
    type: 'edge' | 'node';
    indexOrId: string | number;
    x: number;
    y: number;
  } | null>(null);

  // Edges Calculation
  const { edges, nodeBiases } = useMemo(() => {
    const calculatedEdges: any[] = [];
    const calculatedBiases: Record<string, number> = {};

    // Helper: Filter out ellipsis nodes so we don't draw lines to dots
    const cleanNodes = (nodes: NodeData[]) => nodes.filter(n => !n.type.includes('ellipsis'));

    // Group nodes
    const inputNodes = cleanNodes(displayNodes.filter((n) => n.type === 'input'));
    const outputNodes = cleanNodes(displayNodes.filter((n) => n.type === 'output'));

    // Group hidden layers
    const hiddenLayersMap: Record<string, NodeData[]> = {};
    
    displayNodes
      .filter((n) => n.type === 'hidden')
      .forEach((n) => {
        const parts = n.id.split('-');
        const layerIdx = parts[1]; // Keep as string for map key
        if (!hiddenLayersMap[layerIdx]) hiddenLayersMap[layerIdx] = [];
        hiddenLayersMap[layerIdx].push(n);
      });

    // Sort layers by index to process sequentially
    const sortedLayerKeys = Object.keys(hiddenLayersMap).sort((a, b) => parseInt(a) - parseInt(b));
    const hiddenLayers = sortedLayerKeys.map(k => cleanNodes(hiddenLayersMap[k]));

    // Check for Horizontal Ellipsis to break connections
    const hasHorizontalEllipsis = displayNodes.some(n => n.type === 'ellipsis-h');

    let paramIndex = 0;

    const processLayer = (sources: NodeData[], targets: NodeData[]) => {
      targets.forEach((tgt) => {
        sources.forEach((src) => {
          const currentWeightIndex = paramIndex;
          const w = weights ? weights[currentWeightIndex] : undefined;
          if (w !== undefined) paramIndex++;

          calculatedEdges.push({
            x1: src.x,
            y1: src.y,
            x2: tgt.x,
            y2: tgt.y,
            w,
            weightIndex: w !== undefined ? currentWeightIndex : undefined,
          });
        });
      });

      // Biases
      targets.forEach((tgt) => {
        const b = weights ? weights[paramIndex] : undefined;
        if (weights && b !== undefined) {
          calculatedBiases[tgt.id] = b;
          paramIndex++;
        }
      });
    };

    if (hiddenLayers.length > 0) {
      // Input -> First Hidden
      processLayer(inputNodes, hiddenLayers[0]);
      
      // Hidden -> Hidden
      // If hasHorizontalEllipsis, we have [First Layer] ... [Last Layer]
      // In `hiddenLayers` array, index 0 is First, index 1 is Last.
      // We should NOT connect index 0 to index 1 if there is an ellipsis.
      if (!hasHorizontalEllipsis) {
          for (let i = 0; i < hiddenLayers.length - 1; i++) {
            processLayer(hiddenLayers[i], hiddenLayers[i + 1]);
          }
      }

      // Last Hidden -> Output
      processLayer(hiddenLayers[hiddenLayers.length - 1], outputNodes);
    } else {
      // Direct Input -> Output
      processLayer(inputNodes, outputNodes);
    }

    return { edges: calculatedEdges, nodeBiases: calculatedBiases };
  }, [displayNodes, weights]);

  const getTooltipData = () => {
    if (!hoveredInfo) return null;
    let value = 0;
    let label = '';

    if (hoveredInfo.type === 'edge') {
      const idx = hoveredInfo.indexOrId as number;
      value = weights && weights[idx] !== undefined ? weights[idx] : 0;
      label = 'Weight';
    } else {
      const id = hoveredInfo.indexOrId as string;
      value = nodeBiases[id] || 0;
      label = 'Bias';
    }

    return { value, label, x: hoveredInfo.x, y: hoveredInfo.y };
  };

  const tooltipData = getTooltipData();

  return (
    <ThemedView style={styles.container} onLayout={onLayout} lightColor='#cbcbcbff'>
      <Svg width='100%' height='100%'>
        <G>
          {edges.map((e, i) => {
            const style = getEdgeStyle(e.w);
            const handleHover = (ev: any) => {
              const x = ev.nativeEvent.locationX ?? ev.nativeEvent.offsetX;
              const y = ev.nativeEvent.locationY ?? ev.nativeEvent.offsetY;
              if (e.weightIndex !== undefined) {
                setHoveredInfo({
                  type: 'edge',
                  indexOrId: e.weightIndex,
                  x, y,
                });
              }
            };

            return (
              <G
                key={`e-${i}`}
                onPointerEnter={handleHover}
                onPointerMove={handleHover}
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
          // Render Ellipsis Nodes
          if (n.type === 'ellipsis-v' || n.type === 'ellipsis-h') {
            const isVertical = n.type === 'ellipsis-v';
            const offset = isVertical ? 25 : 60;
            
            return (
              <G key={n.id} opacity={n.opacity}>
                <SvgText
                  x={isVertical ? n.x : n.x - offset}
                  y={isVertical ? n.y - offset : n.y + 3}
                  fill="#ffffff"
                  fontSize="50"
                  fontWeight="bold"
                  textAnchor="middle"
                  fontFamily={FONT_FAMILY}
                >
                  {isVertical ? '⋮' : '…'}
                </SvgText>

                {n.truncatedCount && (
                  <SvgText
                    x={n.x}
                    y={n.y + 4}
                    fill="#fff"
                    fontSize="12"
                    fontWeight="bold"
                    textAnchor="middle"
                    fontFamily={FONT_FAMILY}
                    letterSpacing={0.1}
                  >
                    {isVertical 
                      ? `${n.truncatedCount} Nodes` 
                      : `${n.truncatedCount} Layers`}
                  </SvgText>
                )}

                <SvgText
                  x={isVertical ? n.x : n.x + offset}
                  y={isVertical ? n.y + offset + 30 : n.y + 3}
                  fill="#fff"
                  fontSize="50"
                  fontWeight="bold"
                  textAnchor="middle"
                  fontFamily={FONT_FAMILY}
                >
                  {isVertical ? '⋮' : '…'}
                </SvgText>
              </G>
            );
          }

          // --- Render Standard Nodes ---
          let fill = '#00aaff';
          if (n.type === 'input') fill = '#ff00aa';
          if (n.type === 'output') fill = '#00c482ff';

          const showIcon = n.type === 'hidden' || n.type === 'output';
          const iconPath = showIcon ? getActivationPath(activation) : '';

          const handleHover = () => {
            if (nodeBiases[n.id] !== undefined) {
              setHoveredInfo({
                type: 'node',
                indexOrId: n.id,
                x: n.x, y: n.y,
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
              {n.label !== undefined && n.label !== '' ? (
                <SvgText
                  x={n.x}
                  y={n.y + 24}
                  fill='#fff'
                  fontSize='10'
                  fontWeight='bold'
                  fontFamily={FONT_FAMILY}
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

      {weights && weights.length > 0 && <NetworkWeightKey />}

      <View style={styles.labelContainer}>
        <Text style={styles.infoText}>
          {activation} • {depth} Hidden {depth > MAX_DEPTH ? '(Truncated)' : ''}
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
  keyContainer: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 8,
    borderRadius: 6,
    borderColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    gap: 4,
  },
  keyTitle: {
    color: '#aaa',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  keyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  keyText: {
    color: '#eee',
    fontSize: 10,
    fontWeight: '500',
  },
});