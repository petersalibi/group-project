import * as React from "react";
import { Animated, Easing, View, StyleSheet } from "react-native";
import Svg, { Circle, Path, Rect, Line, Polygon, Defs, LinearGradient, Stop } from "react-native-svg";
import { useTheme } from "../theme-provider"

type IconProps = {
  size?: number;
  color?: string;
  opacity?: number;
  isLandscapeLoading?: boolean;
  numPathsLoading?: number;
};

function useIconColor(propColor?: string) {
  const { theme, isDark } = useTheme();
  const brandAccent = isDark ? '#C6F382' : '#353F91';
  return propColor || brandAccent;
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

const makeAnimated = (Component) => {
  const Wrapped = React.forwardRef(({ collapsable, ...props }, ref) => (
    <Component ref={ref} {...props} />
  ));
  // Set a display name for debugging (optional)
  Wrapped.displayName = `Animated${Component.displayName || Component.name}`;
  return Animated.createAnimatedComponent(Wrapped);
};

// 2. Create your Animated components using the helper
const AnimatedCircle = makeAnimated(Circle);
const AnimatedLine = makeAnimated(Line);
const AnimatedPolygon = makeAnimated(Polygon);

export function LandscapeLoadingIcon({ isLandscapeLoading, size = 300 }) {
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
    if (!isLandscapeLoading) {
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
  }, [isLandscapeLoading]);

  if (!isLandscapeLoading) return null;

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
            return <AnimatedPolygon key={`q${i}`} points={pts} fill={useIconColor()} opacity={opacity} />;
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
                x1={start.x} x2={end.x} stroke={useIconColor()} strokeWidth="0.3" opacity={opacity}
                y1={liftAnim.interpolate({ inputRange: [0, 1], outputRange: [start.y, start.targetY] })}
                y2={liftAnim.interpolate({ inputRange: [0, 1], outputRange: [end.y, end.targetY] })}
              />
            );
          })}

          {/* Dots */}
          {dots.map((d, i) => (
            <AnimatedCircle key={`d${i}`} cx={d.x} fill={useIconColor()} opacity={vanishAnim}
              cy={liftAnim.interpolate({ inputRange: [0, 1], outputRange: [d.y, d.targetY] })}
              r={vanishAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.4] })}
            />
          ))}
        </Svg>
      </View>
    </View>
  );
}

const AnimatedPath = makeAnimated(Path);

export function PathLoadingIcon({ numPathsLoading = 0, size = 100, }) {
  const progressAnim = React.useRef(new Animated.Value(0)).current;

  const pathData = React.useMemo(() => {
    if (numPathsLoading === 0) return [];
    
    const count = Math.min(numPathsLoading, 5);
    const data = [];

    for (let i = 0; i < count; i++) {
      let start, end;
      
      // Center of the viewBox
      const centerX = 50;
      const centerY = 70;

      const endRadius = count === 1 ? 0 : 6; // 0 offset for 1 path, 6px offset for multiples
      const endAngle = (i * 2 * Math.PI) / count;
      end = { 
        x: centerX + endRadius * Math.cos(endAngle), 
        y: centerY + endRadius * Math.sin(endAngle) 
      };

      // Calculate Start Point based on count
      if (count === 1) {
        // 1 Path: Upper Right
        start = { x: -10, y: -10 };
      } else if (count === 2) {
        // 2 Paths: Upper Left, Upper Right
        const starts = [{ x: -10, y: -10 }, { x: 110, y: -10 }];
        start = starts[i];
      } else if (count === 3) {
        // 3 Paths: Upper Right, Upper Left, Top Middle
        const starts = [{ x: 110, y: -10 }, { x: -10, y: -10 }, { x: 50, y: -10 }];
        start = starts[i];
      } else if (count === 4) {
        // 4 Paths: Four corners of a square
        const starts = [
          { x: -10, y: -10 }, // Upper Left
          { x: 110, y: -10 }, // Upper Right
          { x: 110, y: 110 }, // Lower Right
          { x: -10, y: 110 }, // Lower Left
        ];
        start = starts[i];
      } else {
        // 5 Paths: Corners of a Pentagon
        const startRadius = 50;
        const startAngle = -Math.PI / 2 + (i * 2 * Math.PI) / count; 
        start = {
          x: centerX + startRadius * Math.cos(startAngle),
          y: centerY + startRadius * Math.sin(startAngle),
        };
      }

      // Calculate direction and perpendicular vector for the wave
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const length = Math.hypot(dx, dy);
      const nx = -dy / length; 
      const ny = dx / length;

      const numSteps = 40;
      const inputRange = [];
      const outputX = [];
      const outputY = [];
      let pathString = '';
      let pathLen = 0;
      let lastPt = start;

      for (let step = 0; step <= numSteps; step++) {
        const t = step / numSteps;
        inputRange.push(t);

        // Squiggly Wave Math: Sine wave that tapers off at the start and end
        const amplitude = 8 * Math.sin(t * Math.PI);
        const wave = Math.sin(t * Math.PI * 6) * amplitude; 
        
        const ptX = start.x + dx * t + nx * wave;
        const ptY = start.y + dy * t + ny * wave;

        outputX.push(ptX);
        outputY.push(ptY);

        if (step === 0) {
          pathString += `M ${ptX} ${ptY} `;
        } else {
          pathString += `L ${ptX} ${ptY} `;
          pathLen += Math.hypot(ptX - lastPt.x, ptY - lastPt.y);
        }
        lastPt = { x: ptX, y: ptY };
      }

      data.push({ inputRange, outputX, outputY, pathString, pathLen });
    }
    return data;
  }, [numPathsLoading]);

  // Start the animation loop
  React.useEffect(() => {
    if (numPathsLoading > 0) {
      progressAnim.setValue(0);
      Animated.loop(
        Animated.sequence([
          Animated.timing(progressAnim, {
            toValue: 1,
            duration: 1500, // 1.5 seconds per draw
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.delay(300), // Pause slightly before restarting
        ])
      ).start();
    } else {
      progressAnim.stopAnimation();
    }
  }, [numPathsLoading, progressAnim]);

  if (numPathsLoading === 0) return null;

  return (
    <View style={[styles.loadingOverlay, { width: size, height: size }]}>
      <Svg width="100%" height="100%" viewBox="0 0 120 120" fill="none">
        {pathData.map((path, index) => {
          
          // Animate the line drawing via dash offset
          const dashOffset = progressAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [path.pathLen, 0],
          });

          // Animate the dot's X and Y coordinates along the curve
          const dotX = progressAnim.interpolate({
            inputRange: path.inputRange,
            outputRange: path.outputX,
          });
          const dotY = progressAnim.interpolate({
            inputRange: path.inputRange,
            outputRange: path.outputY,
          });

          // Fade out the trail slightly at the end
          const opacity = progressAnim.interpolate({
            inputRange: [0, 0.8, 1],
            outputRange: [1, 1, 0.4],
          });

          return (
            <React.Fragment key={`pathGroup-${index}`}>
              <AnimatedPath
                d={path.pathString}
                stroke={useIconColor()}
                strokeWidth="2.5"
                strokeDasharray={path.pathLen}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                opacity={opacity}
              />
              <AnimatedCircle 
                cx={dotX} 
                cy={dotY} 
                r="3.5" 
                fill="#ffffff" 
              />
              <AnimatedCircle 
                cx={dotX} 
                cy={dotY} 
                r="6" 
                fill={useIconColor()} 
                opacity={0.4} 
              />
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
});