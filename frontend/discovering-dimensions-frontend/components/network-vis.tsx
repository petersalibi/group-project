import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Text, LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Line, G, Text as SvgText, Rect } from 'react-native-svg';

interface NetworkVisProps {
  inputCount: number;
  depth: number;
  width: number;
  activation: string;
}

export default function NetworkVis({ inputCount, depth, width, activation }: NetworkVisProps) {
  const [dimensions, setDimensions] = useState({ w: 0, h: 0 });

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setDimensions({ w: width, h: height });
  };

  // Calculate nodes and edges based on dimensions and network params
  const graphData = useMemo(() => {
    if (dimensions.w === 0 || dimensions.h === 0) return { nodes: [], edges: [] };

    const { w, h } = dimensions;
    const outputCount = 1;
    
    // Layers: 0 = Input, 1..depth = Hidden, depth+1 = Output
    const totalLayers = 1 + depth + 1; 
    
    // Helper to get X position for a layer index
    // We add padding so nodes aren't on the very edge
    const paddingX = 40;
    const availableW = w - (paddingX * 2);
    const getX = (layerIndex: number) => paddingX + (availableW / (totalLayers - 1)) * layerIndex;

    // Helper to get Y position for a node in a layer
    const getY = (nodeIndex: number, totalInLayer: number) => {
      const step = h / (totalInLayer + 1);
      return step * (nodeIndex + 1);
    };

    const nodes: any[] = [];
    const edges: any[] = [];

    // --- 1. GENERATE NODES ---

    // Layer 0: Inputs
    const layerNodes: { [key: number]: { x: number, y: number }[] } = {};
    layerNodes[0] = [];
    for (let i = 0; i < inputCount; i++) {
      const pos = { x: getX(0), y: getY(i, inputCount) };
      nodes.push({ 
        id: `in-${i}`, 
        x: pos.x, 
        y: pos.y, 
        type: 'input',  
        label: '' 
      });
      layerNodes[0].push(pos);
    }

    // Hidden Layers
    for (let l = 1; l <= depth; l++) {
      layerNodes[l] = [];
      for (let i = 0; i < width; i++) {
        const pos = { x: getX(l), y: getY(i, width) };
        nodes.push({ 
          id: `h-${l}-${i}`, 
          x: pos.x, 
          y: pos.y, 
          type: 'hidden', 
          label: '' 
        });
        layerNodes[l].push(pos);
      }
    }

    // Output Layer
    layerNodes[depth + 1] = [];
    const outPos = { x: getX(depth + 1), y: getY(0, outputCount) };
    nodes.push({ 
      id: `out`, 
      x: outPos.x, 
      y: outPos.y, 
      type: 'output', 
      label: '' 
    });
    layerNodes[depth + 1].push(outPos);

    // --- 2. GENERATE EDGES ---
    // Fully connect adjacent layers
    for (let l = 0; l < totalLayers - 1; l++) {
      const sourceLayer = layerNodes[l];
      const targetLayer = layerNodes[l+1];
      
      sourceLayer.forEach((src) => {
        targetLayer.forEach((tgt) => {
          edges.push({
            x1: src.x,
            y1: src.y,
            x2: tgt.x,
            y2: tgt.y
          });
        });
      });
    }

    return { nodes, edges };
  }, [inputCount, depth, width, dimensions]);

  return (
    <View style={styles.container} onLayout={onLayout}>
      <Svg width="100%" height="100%">
        {/* Draw Edges First (so they are behind nodes) */}
        <G>
            {graphData.edges.map((e, i) => (
                <Line
                    key={`e-${i}`}
                    x1={e.x1}
                    y1={e.y1}
                    x2={e.x2}
                    y2={e.y2}
                    stroke="#555"
                    strokeWidth="1"
                    opacity="0.4"
                />
            ))}
        </G>

        {/* Draw Nodes */}
        {graphData.nodes.map((n) => {
            let fill = '#00aaff'; // Hidden (Blue)
            if (n.type === 'input') fill = '#ff00aa'; // Pink
            if (n.type === 'output') fill = '#00ffaa'; // Green

            return (
                <G key={n.id}>
                    {/* Outer Glow/Stroke */}
                    <Circle cx={n.x} cy={n.y} r="8" fill={fill} stroke="#fff" strokeWidth="1.5" />
                    
                    {/* Label (if exists) */}
                    {n.label ? (
                        <SvgText
                            x={n.x}
                            y={n.y + 20} // Position label below node
                            fill="#fff"
                            fontSize="10"
                            fontWeight="bold"
                            textAnchor="middle"
                        >
                            {n.label}
                        </SvgText>
                    ) : null}
                </G>
            );
        })}
      </Svg>
      
      <View style={styles.labelContainer}>
         <Text style={styles.infoText}>{activation} • {depth} Hidden Layers • {width} Width</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
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
      textTransform: 'uppercase'
  }
});