import * as React from "react";
import { Animated, Easing, View, StyleSheet } from "react-native";
import Svg, { Circle, Path, Rect, Line, Polygon, Defs, LinearGradient, Stop } from "react-native-svg";
import { useTheme } from "../theme-provider"

type IconProps = {
  size?: number;
  color?: string;
  opacity?: number;
  isLoading?: boolean;
};

function useIconColor(propColor?: string) {
  const { theme } = useTheme();
  return propColor || theme.colors.primary;
}

export function DataIcon({ size = 24, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="8" width="6" height="12" rx="1" fill={useIconColor(color)} opacity="0.3" />
      <Rect x="9" y="4" width="6" height="16" rx="1" fill={useIconColor(color)} opacity="0.6" />
      <Rect x="15" y="10" width="6" height="10" rx="1" fill={useIconColor(color)} />
    </Svg>
  );
}

export function NetworkIcon({ size = 24, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="6" cy="12" r="2" fill={useIconColor(color)} />
      <Circle cx="12" cy="6" r="2" fill={useIconColor(color)} />
      <Circle cx="12" cy="18" r="2" fill={useIconColor(color)} />
      <Circle cx="18" cy="12" r="2" fill={useIconColor(color)} />
      <Path
        d="M8 12L10 6M8 12L10 18M14 6L16 12M14 18L16 12"
        stroke={useIconColor(color)}
        strokeWidth="1.5"
        opacity="0.3"
      />
    </Svg>
  );
}

export function OptimizationIcon({ size = 24, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 20C3 20 6 16 12 16C18 16 21 20 21 20" stroke={useIconColor(color)} strokeWidth="2" strokeLinecap="round" />
      <Path d="M12 16V4" stroke={useIconColor(color)} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="12" cy="4" r="2" fill={useIconColor(color)} />
    </Svg>
  );
}

export function VisualizationIcon({ size = 24, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="8" height="8" rx="1" fill={useIconColor(color)} opacity="0.2" />
      <Rect x="13" y="3" width="8" height="8" rx="1" fill={useIconColor(color)} opacity="0.4" />
      <Rect x="3" y="13" width="8" height="8" rx="1" fill={useIconColor(color)} opacity="0.6" />
      <Rect x="13" y="13" width="8" height="8" rx="1" fill={useIconColor(color)} />
    </Svg>
  );
}

export function LossIcon({ size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 18L8 13L12 17L21 8"
        stroke={useIconColor()}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="21" cy="8" r="2" fill="#C6F382" />
      <Circle cx="3" cy="18" r="2" fill={useIconColor()} />
    </Svg>
  );
}

export function ModelIcon({ size = 24, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3L20 7.5V16.5L12 21L4 16.5V7.5L12 3Z" fill={useIconColor(color)} opacity="0.2" />
      <Path
        d="M12 3L20 7.5M12 3L4 7.5M12 3V12M20 7.5V16.5L12 21M20 7.5L12 12M4 7.5V16.5L12 21M4 7.5L12 12M12 12L12 21"
        stroke={useIconColor(color)}
        strokeWidth="1.5"
      />
    </Svg>
  );
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedLine = Animated.createAnimatedComponent(Line);
const AnimatedPolygon = Animated.createAnimatedComponent(Polygon);

export function LandscapeLoadingIcon({ isLoading, size = 300, colour = "white" }) {
  // Animation Values
  const liftAnim = React.useRef(new Animated.Value(0)).current;
  const lineAnim = React.useRef(new Animated.Value(0)).current;
  const vanishAnim = React.useRef(new Animated.Value(1)).current;
  const fillAnim = React.useRef(new Animated.Value(0)).current;

  // Data Generation
  const { dots, lines, quads } = React.useMemo(() => {
    const dots = [], lines = [], quads = [], GRID = 15;
    const getIdx = (i, j) => i * GRID + j;

    // Generate Dots
    for (let i = 0; i < GRID; i++) {
      for (let j = 0; j < GRID; j++) {
        const u = i / (GRID - 1), v = j / (GRID - 1);
        
        // Lift Logic
        let lift = Math.pow(u - 0.45, 2) * 16;
        lift += Math.sin(u * Math.PI * 4) * 0.6 + Math.cos(v * Math.PI * 2) * 0.8;
        lift += (Math.random() * 2) - 0.5;

        // Perspective
        const scale = 1 - (v * 0.25);
        
        dots.push({
          x: 12 + (u - 0.5) * 24 * scale,
          y: 20 - v * 12,
          targetY: 20 - v * 12 - lift,
          lift, u, v
        });
      }
    }

    // Generate Lines & Quads
    for (let i = 0; i < GRID; i++) {
      for (let j = 0; j < GRID; j++) {
        const idx = getIdx(i, j);
        const dist = Math.sqrt(Math.pow(dots[idx].u - 0.5, 2) + Math.pow(dots[idx].v - 0.5, 2));

        // Lines
        if (i < GRID - 1) lines.push({ from: idx, to: getIdx(i + 1, j), dist });
        if (j < GRID - 1) lines.push({ from: idx, to: getIdx(i, j + 1), dist });

        // Quads (Surface Fill)
        if (i < GRID - 1 && j < GRID - 1) {
          const p1 = getIdx(i, j), p2 = getIdx(i + 1, j), p3 = getIdx(i + 1, j + 1), p4 = getIdx(i, j + 1);
          const avgLift = (dots[p1].lift + dots[p2].lift + dots[p3].lift + dots[p4].lift) / 4;
          
          // Brightness based on height
          const norm = Math.max(0, Math.min(1, (avgLift + 2) / 18));
          const opacity = Math.pow(norm, 1.5) * 1.5 + 0.5;

          quads.push({ points: [p1, p2, p3, p4], v: dots[p1].v, opacity });
        }
      }
    }
    return { dots, lines, quads };
  }, []);

  // Animation Loop
  React.useEffect(() => {
    if (!isLoading) {
      liftAnim.setValue(0);
      return;
    }

    const timing = (anim, to, dur, easing = Easing.linear) => 
      Animated.timing(anim, { toValue: to, duration: dur, easing, useNativeDriver: true });
    
    const seq = (delay, anim) => Animated.sequence([Animated.delay(delay), anim]);

    Animated.loop(Animated.sequence([
      // Reset
      Animated.parallel([
        timing(liftAnim, 0, 0), timing(lineAnim, 0, 0), 
        timing(vanishAnim, 1, 0), timing(fillAnim, 0, 0)
      ]),
      // Build Up
      Animated.parallel([
        timing(liftAnim, 1, 800, Easing.out(Easing.quad)),
        seq(200, timing(lineAnim, 1, 800)),
        seq(800, timing(vanishAnim, 0, 600, Easing.in(Easing.quad))),
        seq(1000, timing(fillAnim, 1, 800, Easing.out(Easing.quad)))
      ]),
      // Tear Down
      Animated.parallel([
        timing(fillAnim, 0, 600),
        timing(vanishAnim, 1, 600),
        seq(200, timing(liftAnim, 0, 800, Easing.inOut(Easing.cubic))),
        seq(400, timing(lineAnim, 0, 600))
      ]),
      Animated.delay(200)
    ])).start();
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={styles.loadingOverlay}>
        <Svg width={size} height={size} viewBox="-8 -8 40 40" fill="none">
          
          {/* Surface Fill */}
          {quads.map((q, i) => {
            const pts = q.points.map(idx => `${dots[idx].x},${dots[idx].targetY}`).join(' ');
            const opacity = fillAnim.interpolate({
              inputRange: [0, q.v * 0.4, q.v * 0.4 + 0.2, 1],
              outputRange: [0, 0, q.opacity, q.opacity],
              extrapolate: 'clamp'
            });
            return <AnimatedPolygon key={`q${i}`} points={pts} fill={colour} opacity={opacity} />;
          })}

          {/* Lines */}
          {lines.map((l, i) => {
            const start = dots[l.from], end = dots[l.to];
            const opacity = Animated.multiply(
              lineAnim.interpolate({
                inputRange: [0, Math.max(0, 1 - l.dist/0.7 - 0.2), Math.min(1, 1 - l.dist/0.7 + 0.1), 1],
                outputRange: [0, 0, 0.4, 0.4], extrapolate: 'clamp'
              }),
              vanishAnim
            );
            return (
              <AnimatedLine key={`l${i}`}
                x1={start.x} x2={end.x} stroke={colour} strokeWidth="0.3" opacity={opacity}
                y1={liftAnim.interpolate({ inputRange: [0, 1], outputRange: [start.y, start.targetY] })}
                y2={liftAnim.interpolate({ inputRange: [0, 1], outputRange: [end.y, end.targetY] })}
              />
            );
          })}

          {/* Dots */}
          {dots.map((d, i) => (
            <AnimatedCircle key={`d${i}`} cx={d.x} fill={colour} opacity={vanishAnim}
              cy={liftAnim.interpolate({ inputRange: [0, 1], outputRange: [d.y, d.targetY] })}
              r={vanishAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.4] })}
            />
          ))}
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
    zIndex: 20,
  },
});