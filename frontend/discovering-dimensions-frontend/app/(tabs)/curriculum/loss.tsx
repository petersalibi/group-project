import React, { useState, useMemo } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedBackground } from '@/components/themed-background';
import Svg, { Line, Circle, Path, Rect, G } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import Slider from '@react-native-community/slider';
import LossHeatmap from '@/components/lossheatmap';

// --- Constants ---
const SIZE = 280;
const GRID = 20;

/**
 * 2. Landscape Slice
 * Taking a 1D slice of the 2D landscape.
 */
function LandscapeSlice() {
  const [sliceY, setSliceY] = useState(0.5);

  const points = useMemo(() => {
    return [...Array(50)].map((_, i) => {
      const u = i / 50 - 0.5; 
      const v = sliceY - 0.5; // Fixed Y based on slider
      
      const loss = u * u + v * v + 0.3 * Math.sin(3 * u) * Math.cos(3 * v);
      
      return {
        x: i * (SIZE / 50),
        y: SIZE * 0.6 - loss * 150, // Scale for visibility
      };
    });
  }, [sliceY]);

  const pathD = `M ${points[0].x} ${points[0].y} ` + points.map(p => `L ${p.x} ${p.y}`).join(' ');

  return (
    <View style={styles.section}>
      <ThemedText style={styles.header}>Slicing the Landscape</ThemedText>

      <Svg width={SIZE} height={200}>
        {/* Grid lines for context */}
        <Line x1={0} y1={180} x2={SIZE} y2={180} stroke="#444" strokeWidth={2} />
        <Line x1={SIZE/2} y1={0} x2={SIZE/2} y2={200} stroke="#444" strokeDasharray="4,4" />
        
        <Path
          d={pathD}
          stroke="#22f3ff"
          strokeWidth={3}
          fill="none"
        />
      </Svg>

      <Slider
        style={{ width: SIZE, height: 40 }}
        minimumValue={0}
        maximumValue={1}
        value={sliceY}
        onValueChange={setSliceY}
        minimumTrackTintColor="#22f3ff"
        maximumTrackTintColor="#555"
        thumbTintColor="#fff"
      />

      <ThemedText style={styles.caption}>
        Slice Position (Y-axis): {sliceY.toFixed(2)}
      </ThemedText>
    </View>
  );
}

/**
 * 3. Surface Build Up
 * Visualizing depth using stacked lines.
 */
function SurfaceBuildUp() {
  // We manipulate the "curve" of the landscape
  const [distortion, setDistortion] = useState(0.5);

  return (
    <View style={styles.section}>
      <ThemedText style={styles.header}>Stack slices → 3D Surface</ThemedText>

      <Svg width={SIZE} height={220}>
        {[...Array(10)].map((_, i) => {
          // Parallax effect logic
          const yBase = 40 + i * 16;
          const curveDepth = 20 + distortion * 40; 
          
          return (
            <Path
              key={i}
              d={`M 0 ${yBase} Q ${SIZE / 2} ${yBase + curveDepth} ${SIZE} ${yBase}`}
              stroke="#22f3ff"
              opacity={0.1 + i * 0.09}
              strokeWidth={2}
              fill="none"
            />
          );
        })}
      </Svg>

      <Slider
        style={{ width: SIZE, height: 40 }}
        minimumValue={0}
        maximumValue={1}
        value={distortion}
        onValueChange={setDistortion}
        minimumTrackTintColor="#22f3ff"
        thumbTintColor="#fff"
      />
      
      <ThemedText style={styles.caption}>
        Adjust curvature intensity
      </ThemedText>
    </View>
  );
}

/**
 * 4. Quiz
 * Fixed the nesting issue.
 */
function LossLandscapeQuiz() {
  const [correct, setCorrect] = useState(false);
  const scale = useSharedValue(1);

  const handlePress = (isCorrect: boolean) => {
    if (isCorrect) {
      setCorrect(true);
      scale.value = withSpring(1.2, { damping: 5 });
    } else {
      // Shake effect or feedback for wrong answer could go here
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.section}>
      <ThemedText style={styles.header}>Quick Check</ThemedText>
      <ThemedText style={{ opacity: 0.7, marginBottom: 20 }}>
        Tap the <ThemedText style={{color: '#22f3ff', fontWeight: 'bold'}}>BLUE</ThemedText> minimum valley.
      </ThemedText>

      <View style={{ width: SIZE, height: SIZE, position: 'relative' }}>
        <Svg width={SIZE} height={SIZE}>
          {/* Background */}
          <Rect width="100%" height="100%" fill="#1a1a1a" rx={10} />
          
          {/* Visual representations of hills (red) and valleys (blue) */}
          <Circle cx={60} cy={60} r={40} fill="#ff4d4d" opacity={0.3} />
          <Circle cx={220} cy={200} r={50} fill="#ff4d4d" opacity={0.4} />
          
          {/* The Target Valley */}
          <Circle cx={140} cy={140} r={45} fill="#22f3ff" opacity={0.3} />
          <Circle cx={140} cy={140} r={20} fill="#22f3ff" opacity={0.6} />
        </Svg>

        {/* FIX: Pressables are absolutely positioned ON TOP of the SVG.
           They are not children of Svg.
        */}
        
        {/* Wrong answer area 1 */}
        <Pressable 
          onPress={() => handlePress(false)} 
          style={{ position: 'absolute', top: 20, left: 20, width: 80, height: 80 }} 
        />

        {/* Correct answer area */}
        <Pressable
          onPress={() => handlePress(true)}
          style={{
            position: 'absolute',
            left: 140 - 40,
            top: 140 - 40,
            width: 80,
            height: 80,
            // backgroundColor: 'rgba(255,255,255,0.1)', // Uncomment to debug hit box
            borderRadius: 40,
          }}
        />
      </View>

      {correct ? (
        <Animated.View style={[{ marginTop: 20, padding: 10, backgroundColor: 'rgba(34, 243, 255, 0.1)', borderRadius: 8 }, animatedStyle]}>
          <ThemedText style={{ color: '#22f3ff', fontWeight: 'bold', textAlign: 'center' }}>
            ✔ Correct! Gradient descent naturally slides down to this point.
          </ThemedText>
        </Animated.View>
      ) : (
        <View style={{ height: 60 }} /> // Spacer to prevent layout jump
      )}
    </View>
  );
}

export default function LossCurriculum() {
  return (
    <ThemedBackground style={{ flex: 1 }}>
      <View style={{ padding: 20, paddingBottom: 100 }}>
        <ThemedText style={{ fontSize: 32, fontWeight: '700', marginBottom: 10 }}>
          Understanding Loss
        </ThemedText>
        <ThemedText style={{ fontSize: 16, opacity: 0.7, marginBottom: 20 }}>
          How machines measure error in multiple dimensions.
        </ThemedText>

        <LossHeatmap />
        <View style={styles.divider} />
        <LandscapeSlice />
        <View style={styles.divider} />
        <SurfaceBuildUp />
        <View style={styles.divider} />
        <LossLandscapeQuiz />
      </View>
    </ThemedBackground>
  );
}

const styles = StyleSheet.create({
  section: {
    marginVertical: 20,
    alignItems: 'center',
  },
  header: {
    fontSize: 22,
    marginBottom: 15,
    fontWeight: '600',
    alignSelf: 'flex-start',
  },
  caption: {
    opacity: 0.7,
    marginTop: 15,
    fontSize: 16,
  },
  subCaption: {
    opacity: 0.5,
    fontSize: 14,
    marginTop: 5,
  },
  divider: {
    height: 1,
    backgroundColor: '#333',
    width: '100%',
    marginVertical: 30,
  }
});