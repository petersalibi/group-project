import { View } from 'react-native';
import { runOnJS, useSharedValue } from 'react-native-reanimated'; 
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useTheme } from './theme-provider';


export function VerticalSlider({ value, onValueChange, min, max, step = 0.01, height = 200 }) {
  const { theme } = useTheme();
  const isDragging = useSharedValue(false);
  
  const progress = (value - min) / (max - min);
  
  const pan = Gesture.Pan()
    .onStart(() => { isDragging.value = true; })
    .onUpdate((e) => {
        let newProgress = 1 - (e.y / height); 
        newProgress = Math.min(1, Math.max(0, newProgress));
        let rawValue = min + newProgress * (max - min);
        const steppedValue = Math.round(rawValue / step) * step;

        runOnJS(onValueChange)(steppedValue);

    })
    .onEnd(() => { isDragging.value = false; });

  return (
    <GestureDetector gesture={pan}>
      <View style={{ width: 40, height: height, alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
        {/* Track Line */}
        <View style={{ 
          width: 4, 
          height: '100%', 
          backgroundColor: 'rgba(255,255,255,0.2)', 
          borderRadius: 2 
        }}>
          {/* Active Fill */}
          <View style={{ 
            width: '100%', 
            height: `${progress * 100}%`, 
            backgroundColor: theme.colors.primary || 'white',
            position: 'absolute',
            bottom: 0,
            borderRadius: 2
          }} />
        </View>

        {/* Thumb */}
        <View style={{
          position: 'absolute',
          bottom: `${progress * 100}%`, // Position based on value
          width: 20,
          height: 20,
          borderRadius: 10,
          backgroundColor: 'white',
          borderWidth: 2,
          borderColor: 'rgba(0,0,0,0.1)',
          transform: [{ translateY: 10 }] // Center thumb on the point
        }} />
      </View>
    </GestureDetector>
  );
}