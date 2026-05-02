import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useLayout } from './docking-provider';
import { DockPanel } from './dock-panel';
import { Text } from '../components/text';
import { InfoModal } from './info-modal';
import { Info, Network, Activity, TrendingDown, Target, Gauge, Terminal } from 'lucide-react-native';

export function StatsGroupPanel({ archContent, metricsContent }: any) {
  const { registry, getSlotDims, theme } = useLayout();
  const [isSwapped, setIsSwapped] = React.useState(false);
  const [showInsightsInfo, setShowInsightsInfo] = React.useState(false);

  const animatedInnerStyle = useAnimatedStyle(() => {
    const slot = getSlotDims(registry['STATS_GROUP'], registry);
    return {
      flexDirection: slot.w < 400 ? 'column' : 'row' as any,
    };
  });

  const internalSwap = Gesture.Pan().onEnd((e) => {
    if (Math.abs(e.translationX) > 80 || Math.abs(e.translationY) > 80) {
      React.startTransition(() => setIsSwapped(!isSwapped));
    }
  });

  const LeftSection = isSwapped ? metricsContent : archContent;
  const RightSection = isSwapped ? archContent : metricsContent;
  const leftTitle = isSwapped ? 'TRAINING METRICS' : 'NETWORK ARCHITECTURE';
  const rightTitle = isSwapped ? 'NETWORK ARCHITECTURE' : 'TRAINING METRICS';

  return (
    <>
      <DockPanel
        id='STATS_GROUP'
        title='Insights & Architecture'
        isMaximized={false}
        headerRight={
          <TouchableOpacity onPress={() => setShowInsightsInfo(true)}>
            <Info size={14} color={theme.colors.mutedForeground} />
          </TouchableOpacity>
        }
      >
        <Animated.View style={[{ flex: 1, gap: 12, padding: 10 }, animatedInnerStyle]}>
          <View
            style={{
              flex: 1,
              backgroundColor: theme.colors.background,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: theme.colors.border,
            }}
          >
            <GestureDetector gesture={internalSwap}>
              <View
                style={{
                  height: 28,
                  paddingHorizontal: 10,
                  justifyContent: 'center',
                  backgroundColor: theme.colors.muted,
                  borderBottomWidth: 1,
                  borderColor: theme.colors.border,
                }}
              >
                <Text
                  style={{
                    fontSize: 8,
                    fontWeight: '800',
                    color: theme.colors.mutedForeground,
                  }}
                >
                  {leftTitle}
                </Text>
              </View>
            </GestureDetector>
            <View style={{ flex: 1 }}>{LeftSection}</View>
          </View>

          <View
            style={{
              flex: 1,
              backgroundColor: theme.colors.background,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: theme.colors.border,
            }}
          >
            <GestureDetector gesture={internalSwap}>
              <View
                style={{
                  height: 28,
                  paddingHorizontal: 10,
                  justifyContent: 'center',
                  backgroundColor: theme.colors.muted,
                  borderBottomWidth: 1,
                  borderColor: theme.colors.border,
                }}
              >
                <Text
                  style={{
                    fontSize: 8,
                    fontWeight: '800',
                    color: theme.colors.mutedForeground,
                  }}
                >
                  {rightTitle}
                </Text>
              </View>
            </GestureDetector>
            <View style={{ flex: 1 }}>{RightSection}</View>
          </View>
        </Animated.View>
      </DockPanel>
      <InfoModal 
        visible={showInsightsInfo} 
        onClose={() => setShowInsightsInfo(false)}
        title="Insights & Architecture"
      >
        <Text style={{ color: theme.colors.foreground, fontSize: 13, lineHeight: 20, marginBottom: 8 }}>
          Monitor your network's architecture and real-time training metrics as the optimiser navigates the loss landscape.
        </Text>

        {/* Network Architecture Section */}
        <View style={[styles.modalSection, { borderColor: theme.colors.border }]}>
          <View style={styles.modalRow}>
            <Network size={16} color={theme.colors.primary} />
            <Text style={[styles.modalTitle, { color: theme.colors.foreground }]}>Network Architecture</Text>
          </View>
          <Text style={[styles.modalDesc, { color: theme.colors.mutedForeground }]}>
            A live diagram of your neural network's layers, nodes, and activation function.
            {"\n\n"}
            <Text style={{ fontWeight: 'bold', color: theme.colors.foreground }}>Truncation: </Text>
            To keep the diagram visually readable, wide networks or networks with many layers are truncated (represented by vertical dots).
            {"\n\n"}
            <Text style={{ fontWeight: 'bold', color: theme.colors.foreground }}>Viewing Weights: </Text>
            If your network is small enough (Depth × Width ≤ 25) and not truncated, you can click "Watch" on an optimiser to view the actual network weights updating in real-time along the connections.
          </Text>
        </View>

        {/* Training Metrics Section */}
        <View style={[styles.modalSection, { borderColor: theme.colors.border }]}>
          <View style={styles.modalRow}>
            <Activity size={16} color={theme.colors.primary} />
            <Text style={[styles.modalTitle, { color: theme.colors.foreground }]}>Training Metrics</Text>
          </View>
          <Text style={[styles.modalDesc, { color: theme.colors.mutedForeground, marginBottom: 12 }]}>
            When watching a specific optimiser, the following metrics are shown:
          </Text>
          
          <View style={{ flexDirection: 'column', gap: 10 }}>
            <Text style={[styles.modalDesc, { color: theme.colors.mutedForeground }]}>
              • <TrendingDown size={14} color={theme.colors.primary} /> <Text style={{ fontWeight: 'bold', color: theme.colors.foreground }}>Current Loss: </Text>
              The network's current error. The percentage (e.g., <Text style={{ fontWeight: 'bold', color: "#22c55e" }}>↓ 9%</Text>) shows the change in loss over the last 10 epochs.
            </Text>
            <Text style={[styles.modalDesc, { color: theme.colors.mutedForeground }]}>
              • <Target size={14} color={theme.colors.primary} /> <Text style={{ fontWeight: 'bold', color: theme.colors.foreground }}>Fidelity: </Text>
              Measures how accurately the visual projection of the optimiser path represents the true, high-dimensional trajectory.
            </Text>
            <Text style={[styles.modalDesc, { color: theme.colors.mutedForeground }]}>
              • <Activity size={14} color={theme.colors.primary} /> <Text style={{ fontWeight: 'bold', color: theme.colors.foreground }}>Instability: </Text>
              Measures the volatility and gradient variance during training. <Text style={{ fontStyle: 'italic', color: theme.colors.mutedForeground }}>(Note: Only available for Classification problems).</Text>
            </Text>
            <Text style={[styles.modalDesc, { color: theme.colors.mutedForeground }]}>
              • <Gauge size={14} color={theme.colors.primary} /> <Text style={{ fontWeight: 'bold', color: theme.colors.foreground }}>Trainability: </Text>
              An overall score indicating how easily the optimiser can navigate this specific terrain to converge on a minimum.
            </Text>
          </View>
        </View>

        {/* Live Log Section */}
        <View style={[styles.modalSection, { borderColor: theme.colors.border }]}>
          <View style={styles.modalRow}>
            <Terminal size={16} color={theme.colors.primary} />
            <Text style={[styles.modalTitle, { color: theme.colors.foreground }]}>Live Log</Text>
          </View>
          <Text style={[styles.modalDesc, { color: theme.colors.mutedForeground }]}>
            A chronological history of your session. It records your exact parameter configurations and timestamps whenever a new landscape or path is generated, making it easy to keep track of your experiments.
          </Text>
        </View>
      </InfoModal>
    </>
  );
}

const styles = StyleSheet.create({
  modalSection: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
});