import React, { useState, useMemo, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import Svg, { Line, Circle, Rect } from 'react-native-svg';
import Slider from '@react-native-community/slider';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

const MAP_SIZE = 220; 
const GRID = 20;      
const CELL_SIZE = MAP_SIZE / GRID;
const TARGET_INDEX = 10;

function LossHeatmap() {
  const [red, setRed] = useState(0); 
  const [blue, setBlue] = useState(0); 
  const [gameWon, setGameWon] = useState(false);
  
  const scale = useSharedValue(0);
  const [visited, setVisited] = useState(new Set(["0-0", "0-1", "1-0", "1-1"])); 

  // Map generation
  const landscape = useMemo(() => {
    return [...Array(GRID)].map((_, i) =>
      [...Array(GRID)].map((_, j) => {
        const r = i / GRID; 
        const b = j / GRID;
        const dist = Math.sqrt(Math.pow(r - 0.5, 2) + Math.pow(b - 0.5, 2));
        const loss = Math.min(1, dist * 1.5); 
        const hue = 280 - (loss * 280); 
        const lightness = 25 + (loss * 35);
        return { color: `hsl(${hue}, 80%, ${lightness}%)` };
      })
    );
  }, []);

  const cx = red * MAP_SIZE;
  const cy = MAP_SIZE - (blue * MAP_SIZE); 
  const currentGridX = Math.min(GRID - 1, Math.floor(red * GRID));
  const currentGridY = Math.min(GRID - 1, Math.floor(blue * GRID));
  const currentLoss = Math.sqrt(Math.pow(red - 0.5, 2) + Math.pow(blue - 0.5, 2));

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: scale.value, 
  }));

  useEffect(() => {
    if (!gameWon && currentGridX === TARGET_INDEX && currentGridY === TARGET_INDEX) {
        setGameWon(true);
        scale.value = withSpring(1, { damping: 20, stiffness: 500 });
        return;
    }

    if (!gameWon) {
        const newVisited = new Set(visited);
        let changed = false;
        for (let x = currentGridX - 1; x <= currentGridX + 1; x++) {
          for (let y = currentGridY - 1; y <= currentGridY + 1; y++) {
            if (x >= 0 && x < GRID && y >= 0 && y < GRID) {
              const key = `${x}-${y}`;
              if (!newVisited.has(key)) {
                newVisited.add(key);
                changed = true;
              }
            }
          }
        }
        if (changed) setVisited(newVisited);
    }
  }, [currentGridX, currentGridY, gameWon]);

  const handleReset = () => {
      setRed(0);
      setBlue(0);
      setGameWon(false);
      scale.value = 0;
      setVisited(new Set(["0-0", "0-1", "1-0", "1-1"]));
  };

  return (
    <View style={styles.container}>
      
      <View style={styles.headerBlock}>
        <ThemedText style={styles.header}>Find the Minimum</ThemedText>
        <ThemedText style={styles.subText}>
          Adjust the sliders to find the combination of red and blue that minimises the loss (a.k.a makes purple).
          {"\n"}
          The map is hidden until you explore it. (Hint: red = high loss, purple = low loss)
        </ThemedText>
      </View>

      <View style={styles.row}>
        <View style={styles.controls}>
          <View style={styles.sliderGroup}>
            <ThemedText style={styles.label}>Blue Parameter</ThemedText>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Slider
                style={{ width: 140, height: 40 }}
                minimumValue={0}
                maximumValue={1}
                value={blue}
                onValueChange={setBlue}
                minimumTrackTintColor="#1e00ff"
                thumbTintColor="#fff"
            />
            <ThemedText style={{ marginLeft: 10, minWidth: 35, fontSize: 12 }}>
                {(blue * 100).toFixed(0)}%
            </ThemedText>
            </View>
          </View>

          <View style={styles.sliderGroup}>
            <ThemedText style={styles.label}>Red Parameter</ThemedText>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Slider
                style={{ width: 140, height: 40 }}
                minimumValue={0}
                maximumValue={1}
                value={red}
                onValueChange={setRed}
                minimumTrackTintColor="#ff4d4d"
                thumbTintColor="#fff"
            />
            <ThemedText style={{ marginLeft: 10, minWidth: 35, fontSize: 12 }}>
                {(red * 100).toFixed(0)}%
            </ThemedText>
            </View>
          </View>

          <View style={styles.stats}>
             <ThemedText style={styles.statLabel}>Current Loss</ThemedText>
             <ThemedText style={[styles.statValue, { color: gameWon ? '#22f3ff' : '#fff'}]}>
               {currentLoss.toFixed(3)}
             </ThemedText>
          </View>
        </View>

        <View style={styles.mapWrapper}>
          <Svg width={MAP_SIZE} height={MAP_SIZE}>
            {landscape.map((row, i) => 
              row.map((cell, j) => {
                const isVisible = gameWon || visited.has(`${i}-${j}`);
                const x = i * CELL_SIZE;
                const y = MAP_SIZE - ((j + 1) * CELL_SIZE); 
                return (
                  <Rect
                    key={`${i}-${j}`}
                    x={x} y={y}
                    width={CELL_SIZE + 0.6} height={CELL_SIZE + 0.6}
                    fill={isVisible ? cell.color : '#0a0a0a'} 
                  />
                );
              })
            )}
            <Line x1={0} y1={cy} x2={MAP_SIZE} y2={cy} stroke="white" opacity={0.3} />
            <Line x1={cx} y1={0} x2={cx} y2={MAP_SIZE} stroke="white" opacity={0.3} />
            <Circle cx={cx} cy={cy} r={6} fill="white" stroke="#000" strokeWidth={2} />
          </Svg>
          
          <ThemedText style={styles.axisX}>Red →</ThemedText>
          <ThemedText style={styles.axisY}>Blue →</ThemedText>
        </View>
      </View>

      {gameWon ? (
        <Animated.View style={[styles.successBox, animatedStyle]}>
            <ThemedText style={styles.successText}>
                You found the minimum!
                {'\n'}
                Purple is made by using 50% blue and 50% red.
                {'\n'}
                Hence, the loss is minimised at this point, and becomes larger the further away you move.
            </ThemedText>
            
            <TouchableOpacity onPress={handleReset}>
                <ThemedText style={styles.resetLink}>Restart</ThemedText>
            </TouchableOpacity>
        </Animated.View>
      ) : (
        <View style={{ height: 70, marginTop: 20 }} />
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 30 },
  headerBlock: { marginBottom: 20 },
  header: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  subText: { opacity: 0.7, fontSize: 15 },
  row: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20 },
  controls: { minWidth: 150, paddingRight: 15, paddingTop: 10 },
  sliderGroup: { marginBottom: 25 },
  label: { fontSize: 12, fontWeight: 'bold', marginBottom: 5, opacity: 0.8 },
  mapWrapper: { position: 'relative', borderWidth: 2, borderColor: '#333', borderRadius: 8, backgroundColor: '#000' },
  axisX: { position: 'absolute', bottom: -20, right: 0, fontSize: 10, opacity: 0.8 },
  axisY: { position: 'absolute', top: 0, left: 0, width: 100, textAlign: 'right', fontSize: 10, opacity: 0.8, transform: [{ rotate: '-90deg' }, { translateX: -50 }, { translateY: -60 }] },
  stats: { backgroundColor: '#1a1a1a', padding: 10, borderRadius: 8, marginTop: 10 },
  statLabel: { fontSize: 10, opacity: 0.5, textTransform: 'uppercase' },
  statValue: { fontSize: 18, fontWeight: 'bold', fontFamily: 'monospace' },
  
  successBox: {
    padding: 5,
    backgroundColor: 'rgba(34, 243, 255, 0.1)', 
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'column',
    gap: 10,
    justifyContent: 'center'
  },
  successText: {
    color: '#22f3ff', 
    fontWeight: 'bold', 
    textAlign: 'center',
    fontSize: 16
  },
  resetLink: {
    fontSize: 12,
    opacity: 0.7,
    textDecorationLine: 'underline'
  }
});

export default LossHeatmap;