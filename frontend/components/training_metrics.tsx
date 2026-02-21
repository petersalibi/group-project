import React, { useRef } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from './theme-provider';
import { Text } from './text';
import { StatsCard } from './stats-card';
import { Platform } from 'react-native';

export function TrainingMetrics({ currentLoss, lossChange, convergence, log }: any) {
  const { theme } = useTheme();
  const scrollViewRef = useRef(null);

  return (
    <View style={{ flex: 1, padding: 12 }}>
      {/* Top Metrics Row */}
      {(currentLoss || convergence) && (
        <View style={styles.metricsRow}>
          {currentLoss && (
            <StatsCard 
              label="Current Loss" 
              value={currentLoss !== null ? currentLoss.toFixed(2) : "0.00"} 
              subText={lossChange === 0 ? "" : lossChange > 0 ? `↑ ${lossChange} %` : `↓ ${Math.abs(lossChange)} %`}
              subColor={lossChange > 0 ? "#e80c0c" : "#22c55e"}
            />
          )}
        </View>
      )}
      
      {/* Live Log Section */}
      <View style={styles.logContainer}>
        <Text style={styles.logLabel}>LIVE PARAMETER LOG</Text>
        <ScrollView 
          ref={scrollViewRef}
          style={{ flex: 1 }} 
          contentContainerStyle={{ gap: 2 }}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {log.map((entry, index) => (
            <Text key={index} style={styles.logEntry}>
              {entry}
            </Text>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  metricsRow: { flexDirection: 'row', gap: 10, height: 100, marginBottom: 12 },
  logContainer: { 
    flex: 1, 
    backgroundColor: '#0f172a', 
    borderRadius: 8, 
    padding: 10, 
    borderWidth: 1, 
    borderColor: '#1e293b' 
  },
  logLabel: { fontSize: 10, fontWeight: '800', color: '#64748b', marginBottom: 8, letterSpacing: 0.5 },
  logEntry: { 
    fontSize: 11, 
    color: '#cbd5e1', 
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' 
  }
});