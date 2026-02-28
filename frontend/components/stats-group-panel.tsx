import React from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useLayout } from './docking-provider';
import { DockPanel } from './dock-panel';
import { Text } from '../components/text';

export function StatsGroupPanel({ archContent, metricsContent }: any) {
  const { registry, getSlotDims, theme } = useLayout();
  const [isSwapped, setIsSwapped] = React.useState(false);

  // Get current dimensions to determine orientation
  const slot = getSlotDims(registry['STATS_GROUP']);
  // Automatic Orientation: If width is small, go vertical.
  const isVertical = slot.w < 400; 

  const internalSwap = Gesture.Pan().onEnd((e) => {
    if (Math.abs(e.translationX) > 80 || Math.abs(e.translationY) > 80) {
      React.startTransition(() => setIsSwapped(!isSwapped));
    }
  });

  const LeftSection = isSwapped ? metricsContent : archContent;
  const RightSection = isSwapped ? archContent : metricsContent;
  const leftTitle = isSwapped ? "TRAINING METRICS" : "NETWORK ARCHITECTURE";
  const rightTitle = isSwapped ? "NETWORK ARCHITECTURE" : "TRAINING METRICS";

  return (
    <DockPanel id="STATS_GROUP" title="Insights & Architecture">
      <View style={{ 
        flex: 1, 
        flexDirection: isVertical ? 'column' : 'row', 
        gap: 12, 
        padding: 10 
      }}>
        
        {/* Sub-Panel 1 */}
        <View style={{ flex: 1, backgroundColor: theme.colors.background, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.border }}>
          <GestureDetector gesture={internalSwap}>
            <View style={{ height: 28, paddingHorizontal: 10, justifyContent: 'center', backgroundColor: theme.colors.muted, borderBottomWidth: 1, borderColor: theme.colors.border }}>
               <Text style={{ fontSize: 8, fontWeight: '800', color: theme.colors.mutedForeground }}>{leftTitle}</Text>
            </View>
          </GestureDetector>
          <View style={{ flex: 1 }}>{LeftSection}</View>
        </View>

        {/* Sub-Panel 2 */}
        <View style={{ flex: 1, backgroundColor: theme.colors.background, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.border }}>
          <GestureDetector gesture={internalSwap}>
            <View style={{ height: 28, paddingHorizontal: 10, justifyContent: 'center', backgroundColor: theme.colors.muted, borderBottomWidth: 1, borderColor: theme.colors.border }}>
               <Text style={{ fontSize: 8, fontWeight: '800', color: theme.colors.mutedForeground }}>{rightTitle}</Text>
            </View>
          </GestureDetector>
          <View style={{ flex: 1 }}>{RightSection}</View>
        </View>

      </View>
    </DockPanel>
  );
}