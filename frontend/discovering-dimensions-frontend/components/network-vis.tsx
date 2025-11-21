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

export default function NetworkVis({
  inputCount,
  depth,
  width,
  activation,
  outputCount,
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
    const totalLayers = 1 + depth + 1; // Input + Hidden + Output

    const paddingX = 40;
    const availableW = w - paddingX * 2;
    const getX = (layerIndex: number) =>
      paddingX + (availableW / (totalLayers - 1)) * layerIndex;
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
    for (let l = 1; l <= depth; l++) {
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
    for (let i = 0; i < outputCount; i++) {
      nodes.push({
        id: `out-${i}`,
        x: getX(depth + 1),
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

  // Calculate Edges dynamically based on the current animating positions of nodes
  const displayEdges = useMemo(() => {
    const edges: { x1: number; y1: number; x2: number; y2: number }[] = [];

    // Group by layer to simplify connection logic
    const inputNodes = displayNodes.filter((n) => n.type === 'input');
    const outputNodes = displayNodes.filter((n) => n.type === 'output');
    const hiddenLayers: NodeData[][] = [];

    // Sort hidden nodes into layers
    displayNodes
      .filter((n) => n.type === 'hidden')
      .forEach((n) => {
        const parts = n.id.split('-'); // h-L-I
        const layerIdx = parseInt(parts[1]) - 1;
        if (!hiddenLayers[layerIdx]) hiddenLayers[layerIdx] = [];
        hiddenLayers[layerIdx].push(n);
      });

    // Connect Input -> First Hidden
    if (hiddenLayers.length > 0) {
      inputNodes.forEach((src) => {
        hiddenLayers[0].forEach((tgt) =>
          edges.push({ x1: src.x, y1: src.y, x2: tgt.x, y2: tgt.y }),
        );
      });
    } else {
      // Direct connection if no hidden layers
      inputNodes.forEach((src) => {
        outputNodes.forEach((tgt) =>
          edges.push({ x1: src.x, y1: src.y, x2: tgt.x, y2: tgt.y }),
        );
      });
    }

    // Connect Hidden -> Hidden
    for (let i = 0; i < hiddenLayers.length - 1; i++) {
      hiddenLayers[i].forEach((src) => {
        hiddenLayers[i + 1].forEach((tgt) =>
          edges.push({ x1: src.x, y1: src.y, x2: tgt.x, y2: tgt.y }),
        );
      });
    }

    // Connect Last Hidden -> Output
    if (hiddenLayers.length > 0) {
      const lastLayer = hiddenLayers[hiddenLayers.length - 1];
      lastLayer.forEach((src) => {
        outputNodes.forEach((tgt) =>
          edges.push({ x1: src.x, y1: src.y, x2: tgt.x, y2: tgt.y }),
        );
      });
    }

    return edges;
  }, [displayNodes]);

  return (
    <ThemedView
      style={styles.container}
      onLayout={onLayout}
      lightColor='#cbcbcbff'
    >
      <Svg width='100%' height='100%'>
        <G>
          {displayEdges.map((e, i) => (
            <Line
              key={`e-${i}`}
              x1={e.x1}
              y1={e.y1}
              x2={e.x2}
              y2={e.y2}
              stroke={Colors[theme].line}
              strokeWidth='1'
              opacity='0.3'
            />
          ))}
        </G>
        {displayNodes.map((n) => {
          let fill = '#00aaff';
          if (n.type === 'input') fill = '#ff00aa';
          if (n.type === 'output') fill = '#00c482ff';

          const showIcon = n.type === 'hidden' || n.type === 'output';
          const iconPath = showIcon ? getActivationPath(activation) : '';

          return (
            <G key={n.id} opacity={n.opacity}>
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
