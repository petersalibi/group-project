import React from 'react';
import { StyleSheet, Text, TextStyle, View, Button } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import {
  optimisers,
  losses,
  lrs,
} from '@/constants/landscapeParams';

// Define the shape of a single path's configuration
export interface PathConfig {
  id: number;
  colorName: string;
  colorValue: string;
  optim: string;
  loss: string;
  lr: number;
  startPoint: [number, number];
}

interface PathConfigControlsProps {
  config: PathConfig;
  onConfigChange: (id: number, field: keyof PathConfig, value: any) => void;
  onPlaceStartPoint: (id: number) => void;
  isPlacing: boolean;
  isSceneLoading: boolean;
  isLandscapeLoaded: boolean;
}

export function PathConfigControls(props: PathConfigControlsProps) {
  const {
    config,
    onConfigChange,
    onPlaceStartPoint,
    isPlacing,
    isSceneLoading,
    isLandscapeLoaded,
  } = props;

  const { id, colorName, colorValue, optim, loss, lr, startPoint } = config;
  const titleStyle: TextStyle = {
    color: colorValue,
    fontWeight: 'bold',
    fontSize: 14,
  };

  return (
    <View style={[styles.container, { borderColor: colorValue }]}>
      <Text style={titleStyle}>
        Path {id + 1} ({colorName})
      </Text>

        <View style={styles.param}>
          <Text>Optimiser:</Text>
          <Picker
            selectedValue={optim}
            style={{ height: 28, width: 110 }}
            onValueChange={(itemValue) =>
              onConfigChange(id, 'optim', String(itemValue))
            }
          >
            {optimisers.map((o) => (
              <Picker.Item key={o.id} label={o.label} value={o.value} />
            ))}
          </Picker>
        </View>

        <View style={styles.param}>
          <Text>Loss:</Text>
          <Picker
            selectedValue={loss}
            style={{ height: 28, width: 130 }}
            onValueChange={(itemValue) => {
              onConfigChange(id, 'loss', String(itemValue));
            }}
          >
            {losses.map((loss) => (
              <Picker.Item
                key={loss.id}
                label={loss.label}
                value={loss.value}
              />
            ))}
          </Picker>
        </View>

        <View style={styles.param}>
          <Text>Learning Rate:</Text>
          <Picker
            selectedValue={lr}
            style={{ height: 28, width: 80 }} // Reduced
            onValueChange={(itemValue) => {
              onConfigChange(id, 'lr', Number(itemValue));
            }}
          >
            {lrs.map((lr) => (
              <Picker.Item key={lr.id} label={lr.label} value={lr.value} />
            ))}
          </Picker>
        </View>

        <Button
          title={isPlacing ? 'Cancel' : 'Place Start Point'}
          onPress={() => onPlaceStartPoint(id)}
          disabled={isSceneLoading || !isLandscapeLoaded}
        />
        <Text style={styles.startPointText}>
          Start Point: [{startPoint[0].toFixed(2)}, {startPoint[1].toFixed(2)}]
        </Text>
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    backgroundColor: '#1c1c1c99',
    borderRadius: 5,
    borderWidth: 1,
    gap: 6,
    flex: 1,
    flexWrap: 'wrap',
  },
  param: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#90fbffd3',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 5,
  },
  startPointText: {
    color: '#ffffff',
    fontSize: 14,
  },
});