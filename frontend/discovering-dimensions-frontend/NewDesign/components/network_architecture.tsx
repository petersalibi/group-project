import React, { useState } from 'react';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';
import Svg, { Line, Circle, G } from 'react-native-svg';
import { useTheme } from './theme-provider';
import { Text } from './text';

export function NetworkArchitecture({ depth, width, activation }: { depth: number; width: number, activation?: string }) {
  const { theme } = useTheme();
  const [containerDims, setContainerDims] = useState({ w: 0, h: 0 });
  
  const safeActivation = activation || 'TANH';

  // Logic: Truncate independently if dimension > 5
  const isDepthTruncated = depth > 5;
  const isWidthTruncated = width > 5;

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

  const renderContent = () => {
    if (containerDims.w === 0) return null;

    // Determine actual nodes to draw
    const displayDepth = isDepthTruncated ? 3 : depth; // [In, HiddenStart, ..., HiddenEnd, Out]
    const displayWidth = isWidthTruncated ? 3 : width;

    // Column Mapping: [Input, ...Hidden, Output]
    // If truncated, we draw Layer 1, then "...", then Layer N
    const layers = [1, ...(isDepthTruncated ? [displayWidth, -1, displayWidth] : Array(depth).fill(displayWidth)), 1];
    
    const colSpacing = (containerDims.w - PADDING_H * 2) / (layers.length - 1);

    const getPos = (colIdx: number, rowIdx: number, colNodes: number) => {
      const x = PADDING_H + colIdx * colSpacing;
      const vSpacing = Math.min(25, (containerDims.h - PADDING_V * 2) / Math.max(displayWidth, 1));
      const startY = (containerDims.h / 2) - ((colNodes - 1) * vSpacing) / 2;
      return { x, y: startY + rowIdx * vSpacing };
    };

    return (
      <Svg height="100%" width="100%">
        {/* Draw Connections (Weights) */}
        {layers.map((numNodes, colIdx) => {
          if (colIdx === layers.length - 1 || numNodes === -1 || layers[colIdx+1] === -1) return null;
          const nextNodes = layers[colIdx + 1];

          return Array.from({ length: numNodes }).map((_, i) => {
            const start = getPos(colIdx, i, numNodes);
            return Array.from({ length: nextNodes }).map((_, j) => {
              const end = getPos(colIdx + 1, j, nextNodes);
              return (
                <Line 
                  key={`l-${colIdx}-${i}-${j}`}
                  x1={start.x} y1={start.y} x2={end.x} y2={end.y}
                  stroke={ (i+j) % 2 === 0 ? theme.colors.frenchBlue : "#EF4444" }
                  strokeWidth="0.5" opacity="0.2"
                />
              );
            });
          });
        })}

        {/* Draw Neurons */}
        {layers.map((numNodes, colIdx) => {
          if (numNodes === -1) {
             // Render the "..." for depth truncation
             return (
               <G key={`dots-d-${colIdx}`}>
                 <Circle cx={PADDING_H + colIdx * colSpacing} cy={containerDims.h/2} r="1.5" fill={theme.colors.mutedForeground} />
                 <Circle cx={PADDING_H + colIdx * colSpacing - 6} cy={containerDims.h/2} r="1.5" fill={theme.colors.mutedForeground} />
                 <Circle cx={PADDING_H + colIdx * colSpacing + 6} cy={containerDims.h/2} r="1.5" fill={theme.colors.mutedForeground} />
               </G>
             );
          }

          return Array.from({ length: numNodes }).map((_, rowIdx) => {
            const { x, y } = getPos(colIdx, rowIdx, numNodes);
            
            // Render "..." for width truncation in the middle of a column
            if (isWidthTruncated && rowIdx === 1) {
               return <Circle key={`dots-w-${colIdx}`} cx={x} cy={y} r="1.5" fill={theme.colors.mutedForeground} />;
            }

            const isInput = colIdx === 0;
            const isOutput = colIdx === layers.length - 1;
            const nodeColor = isInput ? theme.colors.frenchBlue : isOutput ? "#bef264" : theme.colors.muted;

            return (
              <Circle 
                key={`n-${colIdx}-${rowIdx}`}
                cx={x} cy={y} r={NODE_RADIUS}
                fill={nodeColor}
                stroke={theme.colors.background}
                strokeWidth="2"
              />
            );
          });
        })}
      </Svg>
    );
  };

  return (
    <View style={styles.container} onLayout={onLayout}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>NETWORK ARCHITECTURE DETAIL</Text>
      </View>
      
      <View style={styles.diagramArea}>
        {renderContent()}
      </View>

      <Text style={styles.footerLabel}>
        {safeActivation.toUpperCase()} • {depth * width} HIDDEN { (isDepthTruncated || isWidthTruncated) && '(TRUNCATED)' }
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  header: { marginBottom: 5 },
  headerTitle: { fontSize: 9, fontWeight: '800', color: '#64748b', letterSpacing: 1 },
  diagramArea: { flex: 1, overflow: 'hidden' },
  footerLabel: { position: 'absolute', bottom: 10, right: 16, fontSize: 8, color: '#475569', fontWeight: '800' }
});