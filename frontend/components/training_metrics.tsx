import React, { useRef } from 'react';
import { View, ScrollView, StyleSheet, Platform } from 'react-native';
import { useTheme } from './theme-provider';
import { Text } from './text';
import { StatsCard } from './stats-card';
import { Tooltip } from './tooltip';

export function TrainingMetrics({ currentLoss, lossChange, fidelity, log, isPathLoaded }: any) {
  const { isDark, theme } = useTheme();
  const scrollViewRef = useRef(null);

  // Log colours
  const logBgColor = isDark ? '#0f172a' : '#f1f5f9';
  const logBorderColor = isDark ? '#1e293b' : '#e2e8f0'; 
  const logTextColor = isDark ? '#cbd5e1' : '#334155';

  return (
    <View style={{ flex: 1, padding: 12 }}>
      {/* Top Metrics Row */}
      {isPathLoaded && (currentLoss || fidelity) && (
        <View style={styles.metricsRow}>
          {currentLoss && (
            <View style={{ flex: 1 }}>
                <StatsCard 
                  label="Current Loss" 
                  value={currentLoss !== null ? currentLoss.toFixed(2) : "0.00"} 
                  subText={!lossChange || lossChange === 0 ? "" : lossChange > 0 ? `↑ ${lossChange} %` : `↓ ${Math.abs(lossChange)} %`}
                  subColor={lossChange > 0 ? "#e80c0c" : "#22c55e"}
                  valueTooltip='The loss of the neural network at the current position of the optimiser.'
                  subTextTooltip='The change in loss over the last 10 epochs.'
                />
            </View>
          )}
          {fidelity && (
            <View style={{ flex: 1 }}>
                <StatsCard 
                  label="Fidelity" 
                  value={fidelity !== null ? `${fidelity.toFixed(1)}%` : "00.0%"} 
                  subText={fidelity > 60.0 ? "High" : fidelity > 40.0 ? "Medium" : "Low"}
                  subColor="#64748b"
                  valueTooltip='A measure of how accurately the visualisation of the optimiser path represents the true high-dimensional optimisation path.
                            A low fidelity means the visible path is heavily distorted by the projection.'
                />
            </View>
          )}
        </View>
      )}
      
      {/* Live Log Section */}
      {log && (
        <View style={[styles.logContainer, { backgroundColor: logBgColor, borderColor: logBorderColor }]}>
          <Text style={styles.logLabel}>LIVE PARAMETER LOG</Text>
          <ScrollView 
            ref={scrollViewRef}
            style={{ flex: 1 }} 
            contentContainerStyle={{ gap: 2 }}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {log.map((entry, index) => (
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
  metricsRow: { flexDirection: 'row', gap: 10, height: 100, marginBottom: 12 },
  logContainer: { 
    flex: 1, 
    borderRadius: 8, 
    padding: 10, 
    borderWidth: 1, 
  },
  logLabel: { 
    fontSize: 10, 
    fontWeight: '800', 
    color: '#64748b',
    marginBottom: 8, 
    letterSpacing: 0.5 
  },
  logEntry: { 
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' 
  }
});