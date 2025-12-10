import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { optimisers, lrs } from '@/constants/landscapeParams';

// Define the shape of a single path's configuration
export interface PathConfig {
  id: number;
  colorName: string;
  colorValue: string;
  optim: string;
  lr: number;
  startPoint: [number, number];
}

interface PathConfigControlsProps {
  config: PathConfig;
  onConfigChange: (id: number, field: keyof PathConfig, value: any) => void;
  onPlaceStartPoint: (id: number) => void;
  onViewNetwork: (id: number) => void;
  isPlacing: boolean;
  isSceneLoading: boolean;
  isLandscapeLoaded: boolean;
  isWatching: boolean;
}

export function PathConfigControls(props: PathConfigControlsProps) {
  const {
    config,
    onConfigChange,
    onPlaceStartPoint,
    onViewNetwork,
    isPlacing,
    isSceneLoading,
    isLandscapeLoaded,
    isWatching,
  } = props;

  const { id, colorName, colorValue, optim, lr, startPoint } = config;

  return (
    <View style={[styles.pathCard, { borderLeftColor: colorValue }]}>
      {/* Header: Title */}
      <Text style={[styles.pathTitle, { color: colorValue }]}>
        Path {id + 1} ({colorName})
      </Text>

      {/* Parameters Row */}
      <View style={styles.paramsGrid}>
        <View style={styles.paramGroup}>
          <Text style={styles.paramLabel}>Optimiser:</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={optim}
              style={styles.pickerStyle}
              onValueChange={(val) => onConfigChange(id, 'optim', String(val))}
            >
              {optimisers.map((o) => (
                <Picker.Item key={o.id} label={o.label} value={o.value} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.paramGroup}>
          <Text style={styles.paramLabel}>Learning Rate:</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={lr}
              style={styles.pickerStyle}
              onValueChange={(val) => onConfigChange(id, 'lr', Number(val))}
            >
              {lrs.map((l) => (
                <Picker.Item key={l.id} label={l.label} value={l.value} />
              ))}
            </Picker>
          </View>
        </View>
        <View style={styles.paramGroup}>
          <Text style={styles.coordsText}>
            Start Point: [{startPoint[0].toFixed(2)}, {startPoint[1].toFixed(2)}
            ]
          </Text>
        </View>
      </View>

      {/* Footer: Action & Status */}
      <View style={styles.cardFooter}>
        <Pressable
          onPress={() => onPlaceStartPoint(id)}
          disabled={isSceneLoading || !isLandscapeLoaded}
          style={({ pressed }) => [
            styles.actionButton,
            {
              backgroundColor: isPlacing ? '#8B0000' : '#333',
              opacity: pressed || isSceneLoading ? 0.7 : 1,
            },
          ]}
        >
          <Text style={styles.buttonText}>
            {isPlacing ? 'Cancel' : 'Place Start Point'}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => onViewNetwork(id)}
          disabled={isSceneLoading || !isLandscapeLoaded || isWatching}
          style={[
            styles.actionButton,
            isWatching ? styles.buttonDisabled : null,
          ]}
        >
          <Text
            style={[
              styles.buttonText,
              isWatching ? styles.buttonTextDisabled : null,
            ]}
          >
            {isWatching ? 'Viewing on Network' : 'View on Network'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pathCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
    borderLeftWidth: 3,
    boxShadow: '0px 2px 2px rgba(0,0,0,0.3)',
  },
  pathTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  paramsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  paramGroup: {
    flexDirection: 'column',
    gap: 2,
    flexGrow: 1,
    minWidth: '30%',
  },
  paramLabel: {
    color: '#888',
    fontSize: 10,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  pickerContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 4,
    height: 26,
    justifyContent: 'center',
  },
  pickerStyle: {
    color: '#fff',
    backgroundColor: '#2a2a2a',
    height: 26,
    fontSize: 11,
    borderWidth: 0,
    paddingLeft: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    gap: 10,
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#444',
    alignItems: 'center',
    backgroundColor: '#333',
  },
  buttonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  coordsText: {
    color: '#fff',
    fontSize: 11,
  },
  buttonDisabled: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    paddingHorizontal: 0,
  },
  buttonTextDisabled: {
    color: '#666',
  },
});
