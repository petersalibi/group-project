import React from 'react';
import { Platform, StyleSheet, Text, View, Button } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import {
  dataSets,
  depths,
  widths,
  activations,
  methods,
} from '@/constants/landscapeParams';
import Slider from '@react-native-community/slider';

// --- Component Props ---
interface LandscapeControlsProps {
  // State values
  data: string;
  depth: number;
  width: number;
  activation: string;
  method: string;
  zValue: number;
  isLandscapeLoading: boolean;
  isLandscapeLoaded: boolean;
  isPathLoaded: boolean;

  // Setters
  setData: (value: string) => void;
  setDepth: (value: number) => void;
  setWidth: (value: number) => void;
  setActivation: (value: string) => void;
  setMethod: (value: string) => void;

  // Handlers
  onLoadLandscape: () => void;
  onZChange: (value: number) => void;
}

export function LandscapeControls(props: LandscapeControlsProps) {
  const {
    data,
    depth,
    width,
    activation,
    method,
    zValue,
    isLandscapeLoading,
    isLandscapeLoaded,
    isPathLoaded,
    setData,
    setDepth,
    setWidth,
    setActivation,
    setMethod,
    onLoadLandscape,
    onZChange,
  } = props;

  // Z-slider is disabled if landscape isn't loaded OR is loading OR a path is loaded
  const zSliderDisabled =
    isLandscapeLoading || !isLandscapeLoaded || isPathLoaded;

  return (
    <View
      style={{
        flexDirection: Platform.OS === 'web' ? 'row' : 'column',
        alignItems: 'center',
        padding: 10,
        gap: 10,
        backgroundColor: '#d8eeff4d',
        flexWrap: 'wrap',
      }}
    >
      <View style={styles.param}>
        <Text>Data Set:</Text>
        <Picker
          id='dataSelect'
          selectedValue={data}
          style={{ height: 30 }}
          onValueChange={(itemValue) => setData(String(itemValue))}
        >
          {dataSets.map((d) => (
            <Picker.Item key={d.id} label={d.label} value={d.value} />
          ))}
        </Picker>
      </View>

      <View style={styles.param}>
        <Text>Depth:</Text>
        <Picker
          id='depthSelect'
          selectedValue={depth}
          style={{ height: 30 }}
          onValueChange={(itemValue) => setDepth(Number(itemValue))}
        >
          {depths.map((d) => (
            <Picker.Item key={d.id} label={d.label} value={d.value} />
          ))}
        </Picker>
      </View>

      <View style={styles.param}>
        <Text>Width:</Text>
        <Picker
          id='widthSelect'
          selectedValue={width}
          style={{ height: 30 }}
          onValueChange={(itemValue) => setWidth(Number(itemValue))}
        >
          {widths.map((w) => (
            <Picker.Item key={w.id} label={w.label} value={w.value} />
          ))}
        </Picker>
      </View>

      <View style={styles.param}>
        <Text>Activation:</Text>
        <Picker
          id='activationSelect'
          selectedValue={activation}
          style={{ height: 30 }}
          onValueChange={(itemValue) => setActivation(String(itemValue))}
        >
          {activations.map((a) => (
            <Picker.Item key={a.id} label={a.label} value={a.value} />
          ))}
        </Picker>
      </View>

      <View style={styles.param}>
        <Text>Method:</Text>
        <Picker
          id='methodSelect'
          selectedValue={method}
          style={{ height: 30 }}
          onValueChange={(itemValue) => setMethod(String(itemValue))}
        >
          {methods.map((m) => (
            <Picker.Item key={m.id} label={m.label} value={m.value} />
          ))}
        </Picker>
      </View>

      <Button
        title={isLandscapeLoading ? 'Loading...' : 'Generate Landscape'}
        onPress={onLoadLandscape}
        disabled={isLandscapeLoading}
      />

      <View
        style={{
          width: 250,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 5,
          marginRight: 10,
        }}
      >
        <Text style={{ color: 'white' }}>Z scale:</Text>
        <Slider
          style={{ width: 150, height: 40 }}
          minimumValue={0.001}
          maximumValue={5}
          value={zValue}
          onValueChange={onZChange}
          minimumTrackTintColor={zSliderDisabled ? '#888888' : '#00aaffff'}
          maximumTrackTintColor={zSliderDisabled ? '#444444' : '#0052c4ff'}
          thumbTintColor={zSliderDisabled ? '#666666' : '#00b9e2ff'}
          disabled={zSliderDisabled}
        />
        <Text style={{ color: 'white' }}>{zValue.toFixed(3)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  param: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 5,
    backgroundColor: '#90fbffd3',
    padding: 5,
    borderRadius: 5,
  },
});
