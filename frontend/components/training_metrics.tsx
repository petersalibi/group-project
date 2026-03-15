import React, { useRef, useState } from 'react';
import { View, ScrollView, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { useTheme } from './theme-provider';
import { Text } from './text';
import { StatsCard } from './stats-card';
import { Tooltip } from './tooltip';
import { Target, Activity, Gauge, Terminal } from 'lucide-react-native';

export function TrainingMetrics({ currentLoss, lossChange, fidelity, instability, trainability, log, isPathLoaded }: any) {
  const { isDark, theme } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [showLog, setShowLog] = useState(false);

  const logBgColor = isDark ? '#0f172a' : '#f1f5f9';
  const logBorderColor = isDark ? '#1e293b' : '#e2e8f0'; 
  const logTextColor = isDark ? '#cbd5e1' : '#334155';

  const hasMetrics = isPathLoaded && (currentLoss != null || fidelity != null || instability != null || trainability != null);

  return (
    <View style={{ flex: 1, padding: 12 }}>

      {/* Top Metrics Row */}
      {!showLog && hasMetrics && (
        <View style={styles.metricsRow}>
          
          {/* Main Loss Card - Left Column */}
          {currentLoss != null && (
            <View style={{ flex: 1 }}>
                <StatsCard 
                  label="Current Loss" 
                  value={currentLoss !== null ? currentLoss.toFixed(2) : "0.00"} 
                  color={theme.colors.accent}
                  subText={!lossChange || lossChange === 0 ? "" : lossChange > 0 ? `↑ ${lossChange} %` : `↓ ${Math.abs(lossChange)} %`}
                  subColor={lossChange > 0 ? "#e80c0c" : "#22c55e"}
                  valueTooltip='The loss of the neural network at the current position of the optimiser.'
                  subTextTooltip='The change in loss over the last 10 epochs.'
                />
            </View>
          )}

          {/* Secondary Metrics - Right Column */}
          <View style={[styles.secondaryCard, { flex: 1.5, backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            
            <Tooltip tip="A measure of how accurately the visualisation represents the true high-dimensional optimisation path. A low fidelity means the path is heavily distorted by projection." position="bottom">
              <View style={styles.miniMetricRow}>
                <View style={styles.miniMetricLabelGroup}>
                  <Target size={14} color={theme.colors.mutedForeground} />
                  <Text style={[styles.miniMetricLabel, { color: theme.colors.mutedForeground }]}>Fidelity</Text>
                </View>
                <Text style={[styles.miniMetricValue, { color: theme.colors.accent }]}>
                  {fidelity != null ? `${fidelity.toFixed(1)}%` : '--'}
                </Text>
              </View>
            </Tooltip>

            <Tooltip tip="Measures the variance and spikes in the loss surface along the path. High instability indicates a rugged or difficult optimization route." position="bottom">
              <View style={styles.miniMetricRow}>
                <View style={styles.miniMetricLabelGroup}>
                  <Activity size={14} color={theme.colors.mutedForeground} />
                  <Text style={[styles.miniMetricLabel, { color: theme.colors.mutedForeground }]}>Instability</Text>
                </View>
                <Text style={[styles.miniMetricValue, { color: theme.colors.accent }]}>
                  {instability != null ? `${instability.toFixed(1)}%` : '--'}
                </Text>
              </View>
            </Tooltip>

            <Tooltip tip="A general score of how easily the model can converge on this loss landscape given its current configuration." position="bottom">
              <View style={styles.miniMetricRow}>
                <View style={styles.miniMetricLabelGroup}>
                  <Gauge size={14} color={theme.colors.mutedForeground} />
                  <Text style={[styles.miniMetricLabel, { color: theme.colors.mutedForeground }]}>Trainability</Text>
                </View>
                <Text style={[styles.miniMetricValue, { color: theme.colors.accent }]}>
                  {trainability != null ? `${trainability.toFixed(1)}%` : '--'}
                </Text>
              </View>
            </Tooltip>

          </View>
        </View>
      )}

      {!showLog && hasMetrics && (
        <View style={styles.headerControls}>
          <TouchableOpacity 
            onPress={() => setShowLog(true)} 
            style={[styles.logToggleBtn, { backgroundColor: theme.colors.muted }]}
          >
            <Terminal size={12} color={theme.colors.foreground} />
            <Text style={[styles.logToggleText, { color: theme.colors.foreground }]}>
              SHOW LOG
            </Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Live Log Section */}
      {(!hasMetrics || showLog) && log && (
        <View style={[styles.logContainer, { backgroundColor: logBgColor, borderColor: logBorderColor }]}>
          
          <View style={styles.logHeaderRow}>
            <Text style={styles.logLabel}>LIVE LOG</Text>
            {showLog && hasMetrics && (
              <TouchableOpacity 
                onPress={() => setShowLog(false)} 
                style={[styles.logToggleBtn, { backgroundColor: theme.colors.muted }]}
              >
                <Terminal size={12} color={theme.colors.foreground} />
                <Text style={[styles.logToggleText, { color: theme.colors.foreground }]}>
                  HIDE LOG
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView 
            ref={scrollViewRef}
            style={{ flex: 1 }} 
            contentContainerStyle={{ gap: 2 }}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {log.map((entry: string, index: number) => (
              <Text key={index} style={[styles.logEntry, { color: logTextColor }]}>              
                {entry}
              </Text>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerControls: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 6,
  },
  logToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  logToggleText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  metricsRow: { 
    flex: 1,
    flexDirection: 'row', 
    gap: 10, 
  },
  secondaryCard: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: 'space-between',
  },
  miniMetricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  miniMetricLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniMetricLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  miniMetricValue: {
    fontSize: 12,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  logContainer: { 
    flex: 1, 
    borderRadius: 8, 
    padding: 10, 
    borderWidth: 1, 
  },
  logHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  logLabel: { 
    fontSize: 10, 
    fontWeight: '800', 
    color: '#64748b',
    letterSpacing: 0.5,
  },
  logEntry: { 
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' 
  }
});