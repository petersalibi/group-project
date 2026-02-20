import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Line, G, Text as SvgText, Path } from 'react-native-svg';
import { useTheme } from './theme-provider';
import { Text } from './text';
import { Theme } from './theme';

interface NodeData {
  id: string;
  x: number;
  y: number;
  type: 'input' | 'hidden' | 'output' | 'ellipsis-h' | 'ellipsis-v';
  label: string;
  opacity: number;
  truncatedCount?: number;
}

const MAX_WIDTH = 5;
const MAX_DEPTH = 5;

// Easing function for smooth animation
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const lerp = (start: number, end: number, t: number) =>
  start + (end - start) * t;

// Helper to get the SVG path data for the activation symbol
const getActivationPath = (type: string) => {
  switch (type) {
    case 'ReLU':
      return 'M -3.5 1.5 L 0 1.5 L 3.5 -3.5';    
    case 'LeakyReLU':
      return 'M -3.5 3 L 0 0 L 3.5 -4';
    case 'Sigmoid':
      return 'M -3.5 3 C 0 3 0 -3 3.5 -3';
    case 'Tanh':
      return 'M -3.5 4 C -0.7 4 0.7 -4 3.5 -4';
    default:
      return '';
  }
};

const getEdgeStyle = (weight: number | undefined, theme: Theme) => {
  if (weight === undefined) return { stroke: theme.colors.foreground, width: 2, opacity: 0.8 };

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
  theme,
}: {
  x: number;
  y: number;
  value: number;
  label: string;
  theme;
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
    <Text style={{ fontSize: 9, fontWeight: "700", color: theme.colors.mutedForeground, }}>
      {label}: {value.toFixed(4)}
    </Text>
  </View>
);

const NetworkWeightKey = ({ theme }) => (
  <View style={styles.keyContainer}>
    {/* Positive */}
    <View style={styles.keyItem}>
      <Svg width='5' height='10'>
        <Line
          x1='0'
          y1='6'
          x2='25'
          y2='6'
          stroke='rgb(9,255,0)'
          strokeWidth='3'
        />
      </Svg>
      <Text style={{
        fontSize: 9, 
        fontWeight: "700", 
        color: theme.colors.mutedForeground,
      }}>
        Positive
      </Text>
    </View>
    {/* Negative */}
    <View style={styles.keyItem}>
      <Svg width='5' height='10'>
        <Line
          x1='0'
          y1='6'
          x2='25'
          y2='6'
          stroke='rgb(255,0,0)'
          strokeWidth='3'
        />
      </Svg>
      <Text style={{
        fontSize: 9, 
        fontWeight: "700", 
        color: theme.colors.mutedForeground,
      }}>
        Negative
      </Text>
    </View>
  </View>
);

export function NetworkArchitecture({ inputs, depth, width, activation, outputs, weights: incomingWeights }: { inputs: number; depth: number; width: number; activation: string; outputs: number; weights?: number[]; }) {
  const isTruncated = depth > MAX_DEPTH || width > MAX_WIDTH;
  const weights = isTruncated ? undefined : incomingWeights;
  const { theme } = useTheme();
  const [dimensions, setContainerDims] = useState({ w: 0, h: 0 });
  const [displayNodes, setDisplayNodes] = useState<NodeData[]>([]);
  const animationRef = useRef<number | null>(null);
  const prevNodesRef = useRef<Map<string, NodeData>>(new Map());

  const onLayout = (event: LayoutChangeEvent) => {
    setContainerDims({
      w: event.nativeEvent.layout.width,
      h: event.nativeEvent.layout.height,
    });
  };

  // Configuration for "Bigger" neurons
  const NODE_RADIUS = 6;
  const PADDING_H = 40;
  const PADDING_V = 30;

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
    nodes.push(...getColumnNodes(inputs, getX(colIndex), 'in', 'input'));
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
    nodes.push(...getColumnNodes(outputs, getX(colIndex), 'out', 'output'));

    return nodes;
  }, [depth, width, inputs, outputs, dimensions]);

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

  const nodeFontSize = Math.max(3, Math.min(4, dimensions.h / 50));
  const ellipsisDotSize = Math.max(10, Math.min(28, dimensions.h / 12));
  const ellipsisTextSize = Math.max(8, Math.min(16, dimensions.h / 30));

  return (
    <View style={styles.container} onLayout={onLayout}>
      <Svg width='100%' height='100%'>
        <G>
          {edges.map((e, i) => {
            const style = getEdgeStyle(e.w, theme);
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
            
            const stepY = dimensions.h / 4; 
            const yOffset = (stepY / 2) * 0.75;
            
            // Horizontal offset: exactly half the distance between columns
            const visibleHiddenCols = depth > MAX_DEPTH ? 3 : (depth === 1 ? 0 : depth);
            const totalCols = 2 + visibleHiddenCols; 
            const colSpacing = (dimensions.w - 80) / (totalCols - 1); // 80 is paddingX * 2
            const xOffset = colSpacing / 2;

            return (
              <G key={n.id} opacity={n.opacity}>
                <SvgText
                  x={isVertical ? n.x : n.x - xOffset}
                  y={isVertical ? n.y - yOffset : n.y - 3.5}
                  fill={theme.colors.foreground}
                  fontSize={ellipsisDotSize}
                  fontFamily="System"
                  fontWeight="bold"
                  textAnchor="middle"
                  alignmentBaseline="middle"
                >
                  {isVertical ? '⋮' : '…'}
                </SvgText>

                {/* Text Label */}
                {n.truncatedCount && (
                  <SvgText
                    x={n.x}
                    y={n.y}
                    fill={theme.colors.foreground}
                    fontSize={ellipsisTextSize}
                    fontFamily="System"
                    fontWeight="bold"
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    letterSpacing={0.1}
                  >
                    {dimensions.h < 300 && dimensions.w < 300
                      ? `${n.truncatedCount}`
                      : isVertical
                      ? `${n.truncatedCount} Nodes`
                      : `${n.truncatedCount} Layers`}
                  </SvgText>
                )}

                <SvgText
                  x={isVertical ? n.x : n.x + xOffset}
                  y={isVertical ? n.y + yOffset : n.y - 3.5}
                  fill={theme.colors.foreground}
                  fontSize={ellipsisDotSize}
                  fontFamily="System"
                  fontWeight="bold"
                  textAnchor="middle"
                  alignmentBaseline="middle"
                >
                  {isVertical ? '⋮' : '…'}
                </SvgText>
              </G>
            );
          }

          // --- Render Standard Nodes ---
          let fill = theme.colors.muted;
          if (n.type === 'input') fill = theme.colors.frenchBlue;
          if (n.type === 'output') fill = "#bef264";

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
                r={showIcon ? 8 : 5}
                fill={fill}
                stroke={theme.colors.foreground}
                strokeWidth='1.5'
              />
              {showIcon && iconPath ? (
                <G x={n.x} y={n.y}>
                  <Path
                    d={iconPath}
                    stroke={theme.colors.foreground}
                    strokeWidth='1.5'
                    fill='none'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />
                </G>
              ) : null}
              {n.label !== undefined && n.label !== '' ? (
                <SvgText
                  x={n.x}
                  y={n.y + (dimensions.h / 18)}
                  fill={theme.colors.foreground}
                  fontSize={nodeFontSize}
                  fontWeight='bold'
                  fontFamily='System'
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
          theme={theme}
        />
      )}

      {weights && weights.length > 0 && <NetworkWeightKey theme={theme} />}

      <View style={styles.labelContainer}>
        <Text style={styles.infoText}>
          {activation.toUpperCase()} • {depth * width} HIDDEN { isTruncated && '(TRUNCATED)' }
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  labelContainer: {
    position: 'absolute',
    bottom: 5,
    right: 10,
    pointerEvents: 'none',
  },
  infoText: {
    fontSize: 8, color: '#475569', fontWeight: '800'
  },
  keyContainer: {
    position: 'absolute',
    top: 2,
    left: 4,
    flexDirection: 'row',
    padding: 2,
    gap: 8,
  },
  keyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});