import React from 'react';
import { Platform, StyleSheet, View, Button, Switch } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import {
  dataSets,
  depths,
  widths,
  activations,
  methods,
  regLosses,
  ceLoss,
  bceLoss,
} from '@/constants/landscapeParams';
import Slider from '@react-native-community/slider';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

// --- Component Props ---
interface LandscapeControlsProps {
  // State values
  data: string;
  depth: number;
  width: number;
  activation: string;
  method: string;
  loss: string;
  zValue: number;
  isLogPlot: boolean;
  isLandscapeLoading: boolean;
  isLandscapeLoaded: boolean;
  isPathLoaded: boolean;

  // Setters
  setData: (value: string) => void;
  setDepth: (value: number) => void;
  setWidth: (value: number) => void;
  setActivation: (value: string) => void;
  setMethod: (value: string) => void;
  setLoss: (value: string) => void;

  // Handlers
  onLoadLandscape: () => void;
  onZChange: (value: number) => void;
  onLogPlotChange: (value: boolean) => void;
}

export function LandscapeControls(props: LandscapeControlsProps) {
  const {
    data,
    depth,
    width,
    activation,
    method,
    loss,
    zValue,
    isLogPlot,
    isLandscapeLoading,
    isLandscapeLoaded,
    isPathLoaded,
    setData,
    setDepth,
    setWidth,
    setActivation,
    setMethod,
    setLoss,
    onLoadLandscape,
    onZChange,
    onLogPlotChange,
  } = props;

  const handleDataChange = (itemValue: string) => {
    if (itemValue === data) return;
    setData(itemValue);

    switch (itemValue) {
      case 'SINREGRESSION':
        setLosses(regLosses);
        setLoss(regLosses[0].value);
        break;
      case 'PENGUINS':
        setLosses(ceLoss);
        setLoss(ceLoss[0].value);
        break;
      case 'PURPLECOLOURS':
        setLosses(bceLoss);
        setLoss(bceLoss[0].value);
        break;
    }
  };

  const [losses, setLosses] = React.useState(regLosses);

  // Z-slider is disabled if landscape isn't loaded OR is loading OR a path is loaded
  const zSliderDisabled =
    isLandscapeLoading || !isLandscapeLoaded || isPathLoaded;

  return (
    <ThemedView
      style={{
        flexDirection: Platform.OS === 'web' ? 'row' : 'column',
        alignItems: 'center',
        padding: 10,
        gap: 10,
        flexWrap: 'wrap',
      }}
      lightColor='#ecececff'
      darkColor='#2a2828ff'
    >
      <ThemedView style={styles.param}>
        <ThemedText type='default'>Data Set:</ThemedText>
        <Picker
          id='dataSelect'
          selectedValue={data}
          enabled={!isPathLoaded}
          style={{ height: 30 }}
          onValueChange={(itemValue) => handleDataChange(String(itemValue))}
        >
          {dataSets.map((d) => (
            <Picker.Item key={d.id} label={d.label} value={d.value} />
          ))}
        </Picker>
      </ThemedView>

      <ThemedView style={styles.param}>
        <ThemedText type='default'>Depth:</ThemedText>
        <Picker
          id='depthSelect'
          selectedValue={depth}
          enabled={!isPathLoaded}
          style={{ height: 30 }}
          onValueChange={(itemValue) => setDepth(Number(itemValue))}
        >
          {depths.map((d) => (
            <Picker.Item key={d.id} label={d.label} value={d.value} />
          ))}
        </Picker>
      </ThemedView>

      {depth > 1 && (
        <ThemedView style={styles.param}>
          <ThemedText type='default'>Width:</ThemedText>
          <Picker
            id='widthSelect'
            selectedValue={width}
            enabled={!isPathLoaded}
            style={{ height: 30 }}
            onValueChange={(itemValue) => setWidth(Number(itemValue))}
          >
            {widths.map((w) => (
              <Picker.Item key={w.id} label={w.label} value={w.value} />
            ))}
          </Picker>
        </ThemedView>
      )}

      <ThemedView style={styles.param}>
        <ThemedText type='default'>Activation:</ThemedText>
        <Picker
          id='activationSelect'
          selectedValue={activation}
          enabled={!isPathLoaded}
          style={{ height: 30 }}
          onValueChange={(itemValue) => setActivation(String(itemValue))}
        >
          {activations.map((a) => (
            <Picker.Item key={a.id} label={a.label} value={a.value} />
          ))}
        </Picker>
      </ThemedView>

      <ThemedView style={styles.param}>
        <ThemedText type='default'>Loss:</ThemedText>
        <Picker
          id='lossSelect'
          selectedValue={loss}
          enabled={!isPathLoaded}
          style={{ height: 30 }}
          onValueChange={(itemValue) => setLoss(String(itemValue))}
        >
          {losses.map((l) => (
            <Picker.Item key={l.id} label={l.label} value={l.value} />
          ))}
        </Picker>
      </ThemedView>

      <ThemedView style={styles.param}>
        <ThemedText type='default'>Method:</ThemedText>
        <Picker
          id='methodSelect'
          selectedValue={method}
          style={{ height: 30 }}
          enabled={!isPathLoaded}
          onValueChange={(itemValue) => setMethod(String(itemValue))}
        >
          {methods.map((m) => (
            <Picker.Item key={m.id} label={m.label} value={m.value} />
          ))}
        </Picker>
      </ThemedView>

      {/* View prevents shrinking */}
      <View style={{ width: 180 }}>
        <Button
          title={isLandscapeLoading ? 'Loading...' : 'Generate Landscape'}
          onPress={onLoadLandscape}
          disabled={isLandscapeLoading || isPathLoaded}
          color='#00aaff'
        />
      </View>

      <ThemedView style={styles.param}>
        <ThemedText type='default'>Log Plot:</ThemedText>
        <Switch
          value={isLogPlot}
          onValueChange={onLogPlotChange}
          disabled={zSliderDisabled}
        />
      </ThemedView>

      <View
        style={{
          maxWidth: 160,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 5,
        }}
      >
        <ThemedText type='default'>Z Scale:</ThemedText>
        <Slider
          style={{ width: 70, height: 40 }}
          minimumValue={0.001}
          step={0.1}
          maximumValue={5}
          value={zValue}
          onValueChange={onZChange}
          minimumTrackTintColor={zSliderDisabled ? '#888888' : '#00aaffff'}
          maximumTrackTintColor={zSliderDisabled ? '#444444' : '#0052c4ff'}
          thumbTintColor={zSliderDisabled ? '#666666' : '#00b9e2ff'}
          disabled={zSliderDisabled}
        />
        <ThemedText type='default'>{zValue.toFixed(1)}</ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  param: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    padding: 5,
    borderRadius: 5,
  },
});
