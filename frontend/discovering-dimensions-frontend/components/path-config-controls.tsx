import React from 'react';
import { StyleSheet, Text, View, Pressable, Switch, useWindowDimensions, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { optimisers, lrs } from '@/constants/landscapeParams';

// Define the shape of a single path's configuration
export interface PathConfig {
  id: number;
  colorName: string;
  colorValue: string;
  optim: string;
  lr: number;
  locked: boolean;
  startPoint: [number, number];
}

interface PathConfigControlsProps {
  config: PathConfig;
  onConfigChange: (id: number, field: keyof PathConfig, value: any) => void;
  onPlaceStartPoint: (id: number) => void;
  networkViewable: boolean;
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
    networkViewable,
    onViewNetwork,
    isPlacing,
    isSceneLoading,
    isLandscapeLoaded,
    isWatching,
  } = props;

  const { id, colorName, colorValue, optim, lr, locked, startPoint } = config;
  const { width: windowWidth } = useWindowDimensions();
  const isCompact = windowWidth < 380;

  return (
    <View style={[styles.pathCard, { borderLeftColor: colorValue }]}>
      {/* Header: Title */}
      <Text style={[styles.pathTitle, { color: colorValue }]}>
        Path {id + 1} ({colorName})
      </Text>

      {/* Parameters Row */}
      <View style={styles.paramsGrid}>
        <View style={[styles.paramGroup, isCompact ? { width: '100%' } : { width: '48%' }]}>
          <Text style={styles.paramLabel}>Optimiser:</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={optim}
              style={styles.pickerStyle}
              dropdownIconColor="white"
              itemStyle={{ color: 'white', fontSize: 14, height: 40 }}
              onValueChange={(val) => onConfigChange(id, 'optim', String(val))}
            >
              {optimisers.map((o) => (
                <Picker.Item key={o.id} label={o.label} value={o.value} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={[styles.paramGroup, isCompact ? { width: '100%' } : { width: '48%' }]}>
          <Text style={styles.paramLabel}>Learning Rate:</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={lr}
              style={styles.pickerStyle}
              dropdownIconColor="white"
              itemStyle={{ color: 'white', fontSize: 14, height: 40 }}
              onValueChange={(val) => onConfigChange(id, 'lr', Number(val))}
            >
              {lrs.map((l) => (
                <Picker.Item key={l.id} label={l.label} value={l.value} />
              ))}
            </Picker>
          </View>
        </View>
        <View style={[styles.paramGroup, { width: '100%' }]}>
          <Text style={styles.coordsText}>
            Start Point: [{startPoint[0].toFixed(2)}, {startPoint[1].toFixed(2)}
            ]
          </Text>
        </View>
        <View style={[styles.paramGroup, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }]}>
          <Text style={styles.paramLabel}>Locked to Plane:</Text>
            <Switch
              value={locked}
              thumbColor={Platform.OS === 'android' ? '#f4f3f4' : ''}
              onValueChange={(val) => onConfigChange(id, 'locked', Boolean(val))}
            />
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
        
        {networkViewable && (
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
        )}
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
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
    height: 40,
    justifyContent: 'center',
  },
  pickerStyle: {
    color: '#fff',
    backgroundColor: '#2a2a2a',
    height: 40,
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
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#444',
    alignItems: 'center',
    backgroundColor: '#333',
    flex: 1,
  },
  buttonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  coordsText: {
    color: '#fff',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
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
