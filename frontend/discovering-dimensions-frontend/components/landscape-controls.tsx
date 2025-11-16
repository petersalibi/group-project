// frontend/components/LandscapeControls.tsx

import React from 'react';
import { Platform, StyleSheet, Text, View, Button } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import {
  dataSets,
  depths,
  widths,
  activations,
  methods,
  optimisers,
  losses,
  lrs,
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
  optim: string;
  loss: string;
  lr: number;
  zValue: number;
  isLandscapeLoading: boolean;
  isLandscapeLoaded: boolean;
  isPathLoading: boolean;
  isPathLoaded: boolean;
  isPlacingMode: boolean;

  // Setters
  setData: (value: string) => void;
  setDepth: (value: number) => void;
  setWidth: (value: number) => void;
  setActivation: (value: string) => void;
  setMethod: (value: string) => void;
  setOptim: (value: string) => void;
  setLoss: (value: string) => void;
  setLr: (value: number) => void;

  // Handlers
  onLoadLandscape: () => void;
  onLoadPath: () => void;
  onRemovePath: () => void;
  onTogglePlacingMode: () => void;
  onZChange: (value: number) => void;
}

export function LandscapeControls(props: LandscapeControlsProps) {
  const {
    data,
    depth,
    width,
    activation,
    method,
    optim,
    loss,
    lr,
    zValue,
    isLandscapeLoading,
    isLandscapeLoaded,
    isPathLoading,
    isPathLoaded,
    isPlacingMode,
    setData,
    setDepth,
    setWidth,
    setActivation,
    setMethod,
    setOptim,
    setLoss,
    setLr,
    onLoadLandscape,
    onLoadPath,
    onRemovePath,
    onTogglePlacingMode,
    onZChange,
  } = props;

  const zSliderDisabled =
    isLandscapeLoading ||
    !isLandscapeLoaded ||
    isPathLoading ||
    isPathLoaded;

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
        <Text>Select data set:</Text>
        <Picker
          id="dataSelect"
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
        <Text>Select depth of network:</Text>
        <Picker
          id="depthSelect"
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
        <Text>Select width of hidden layers:</Text>
        <Picker
          id="widthSelect"
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
        <Text>Select activation function:</Text>
        <Picker
          id="activationSelect"
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
        <Text>Select visualisation method:</Text>
        <Picker
          id="methodSelect"
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

      <View style={styles.param}>
        <Text>Select optimiser:</Text>
        <Picker
          id="optimiserSelect"
          selectedValue={optim}
          style={{ height: 30 }}
          onValueChange={(itemValue) => setOptim(String(itemValue))}
        >
          {optimisers.map((o) => (
            <Picker.Item key={o.id} label={o.label} value={o.value} />
          ))}
        </Picker>
      </View>

      <View style={styles.param}>
        <Text>Select loss:</Text>
        <Picker
          id="lossSelect"
          selectedValue={loss}
          style={{ height: 30 }}
          onValueChange={(itemValue) => {
            setLoss(String(itemValue));
          }}
        >
          {losses.map((loss) => (
            <Picker.Item key={loss.id} label={loss.label} value={loss.value} />
          ))}
        </Picker>
      </View>

      <View style={styles.param}>
        <Text>Select learning rate:</Text>
        <Picker
          id="lrSelect"
          selectedValue={lr}
          style={{ height: 30 }}
          onValueChange={(itemValue) => {
            setLr(Number(itemValue));
          }}
        >
          {lrs.map((lr) => (
            <Picker.Item key={lr.id} label={lr.label} value={lr.value} />
          ))}
        </Picker>
      </View>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button
          title={isPlacingMode ? 'Cancel Placing' : 'Place Start Point'}
          onPress={onTogglePlacingMode}
          disabled={isLandscapeLoading || isPathLoading || !isLandscapeLoaded}
        />

        <Button
          title={isPathLoading ? 'Loading...' : 'Generate Path'}
          onPress={onLoadPath}
          disabled={isLandscapeLoading || isPathLoading || !isLandscapeLoaded}
        />

        {isPathLoaded && (
          <Button title={'Remove Path'} onPress={onRemovePath} />
        )}
      </View>

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
          minimumTrackTintColor={
            zSliderDisabled ? '#888888' : '#00aaffff'
          }
          maximumTrackTintColor={
            zSliderDisabled ? '#444444' : '#0052c4ff'
          }
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