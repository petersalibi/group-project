import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../components/theme-provider';
import { Text } from '../components/text';
import LossLandscape2D from '../components/LossLandscape2D';

export function GDPage() {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>

      {/* Grid Area */}
      <ScrollView style={{ flex: 1 }}>
        <View style={styles.grid}>
          <View style={styles.col}>
            <LossLandscape2D />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    zIndex: 50,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 16,
  },
  col: {
    flex: 1,
    minWidth: 450, // Ensures they stack vertically if the screen is too narrow
  }
});