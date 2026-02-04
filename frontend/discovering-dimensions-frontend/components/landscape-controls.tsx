import React, { useRef, useState, useEffect } from 'react';
import { Platform, StyleSheet, View, Button, Switch, useWindowDimensions, DimensionValue } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import {
  dataSets,
  depths,
  widths,
  activations,
  methods,
  allLosses,
  regLosses,
  ceLoss,
  bceLoss,
} from '@/constants/landscapeParams';
import Slider from '@react-native-community/slider';
import { NumericStepper } from '@/components/numeric-stepper';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

// --- Component Props ---
interface LandscapeControlsProps {
  // State values
  data: string;
  inputs: number;
  outputs: number;
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
  isPathLoading: boolean;

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
  onUploadCsv?: (file: any) => void;
}

export function LandscapeControls(props: LandscapeControlsProps) {
  const {
    data,
    inputs,
    outputs,
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
    isPathLoading,
    setData,
    setDepth,
    setWidth,
    setActivation,
    setMethod,
    setLoss,
    onLoadLandscape,
    onZChange,
    onLogPlotChange,
    onUploadCsv,
  } = props;

  // Detect if we are on a narrow screen (Mobile Web)
  const { width: windowWidth } = useWindowDimensions();
  const isCompact = windowWidth < 768;

  const hiddenFileInput = useRef<HTMLInputElement>(null);
  const [datasetButtonText, setDatasetButtonText] = useState('Select CSV');

  const handleUploadPress = () => {
    if (Platform.OS === 'web') {
      hiddenFileInput.current?.click();
    } else {
      if (onUploadCsv) onUploadCsv(null); 
    }
  };

  const handleWebFileChange = (event: any) => {
    const file = event.target.files[0];
    if (file && onUploadCsv) {
      onUploadCsv(file);
      setDatasetButtonText('Change CSV');
    }
  };

  const handleDataChange = (itemValue: string) => {
    if (itemValue === data) return;
    setData(itemValue);
  };

  useEffect(() => {
    let newLosses = regLosses; // Default fallback

    switch (data) {
      case 'SINREGRESSION':
        newLosses = regLosses;
        break;
      case 'PENGUINS':
        newLosses = ceLoss;
        break;
      case 'PURPLECOLOURS':
        newLosses = bceLoss;
        break;
      case 'CUSTOM':
        // Now this logic runs automatically if 'outputs' changes!
        if (outputs > 1) {
          newLosses = ceLoss;
        } else {
          newLosses = regLosses; // Default for outputs === 1
        }
        break;
    }

    setLosses(newLosses);
    
    // Optional: Reset the selected loss to the first option if the current selection 
    // is no longer valid for the new list.
    const isCurrentLossValid = newLosses.some(l => l.value === loss);
    if (!isCurrentLossValid) {
        setLoss(newLosses[0].value);
    }

  }, [data, outputs]); // <--- The critical part: Run whenever these change

  const [losses, setLosses] = React.useState(regLosses);

  // Helper to Render Pickers Consistently on Mobile/Desktop
  const renderPicker = (
    selectedValue: string,
    onValueChange: (val: string) => void,
    items: { id: number; label: string; value: string }[],
    width: DimensionValue = 140
  ) => (
    <ThemedView style={[styles.pickerContainer, { width: isCompact ? '100%' : width }]}>
      <Picker
        selectedValue={selectedValue}
        onValueChange={(itemValue) => onValueChange(String(itemValue))}
        style={Platform.OS === 'web' ? styles.webPicker : styles.nativePicker}
        enabled={!isPathLoaded && !isPathLoading}
        dropdownIconColor="white"
        mode="dropdown" // Android: use dropdown instead of dialog
        itemStyle={{ color: 'white', fontSize: 14, height: 50 }}
      >
        {items.map((item) => (
          <Picker.Item 
            key={item.id} 
            label={item.label} 
            value={item.value} 
            color={Platform.OS === 'android' ? 'black' : undefined}
            style={{ fontSize: 14 }}
          />
        ))}
      </Picker>
    </ThemedView>
  );

  // Z-slider is disabled if landscape isn't loaded OR is loading OR a path is loaded
  const zSliderDisabled =
    isLandscapeLoading || !isLandscapeLoaded || isPathLoaded || isPathLoading;

  return (
    <ThemedView
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap', 
        alignItems: 'center',
        justifyContent: isCompact ? 'center' : 'flex-start',
        padding: 10,
        gap: 10,
      }}
      lightColor='#ecececff'
      darkColor='#2a2828ff'
    >
      {Platform.OS === 'web' && (
        <input
          type="file"
          accept=".csv"
          ref={hiddenFileInput}
          onChange={handleWebFileChange}
          style={{ display: 'none' }}
        />
      )}
      <View style={[styles.controlGroup, isCompact && styles.fullWidth]}>
        <ThemedText type='default' style={styles.label}>Data Set:</ThemedText>
        {renderPicker(data, handleDataChange, dataSets)}
      </View>

      {data === 'CUSTOM' && (
        <View>
          <Button 
            title={datasetButtonText}
            disabled={isPathLoaded || isPathLoading}
            onPress={handleUploadPress} 
            color="#841584"
          />
        </View>
      )}

      <View style={[styles.controlGroup, isCompact && styles.halfWidth]}>
        <ThemedText type='default' style={styles.label}>Depth:</ThemedText>
        <View style={styles.stepperWrapper}>
          <NumericStepper
            value={depth}
            onChange={setDepth}
            minValue={1}
            maxValue={100}
            enabled={!isPathLoaded && !isPathLoading}
          />
        </View>
      </View>

      {depth > 1 && (
        <View style={[styles.controlGroup, isCompact && styles.halfWidth]}>
          <ThemedText type='default' style={styles.label}>Width:</ThemedText>
          <View style={styles.stepperWrapper}>
            <NumericStepper
              value={width}
              onChange={setWidth}
              minValue={1}
              maxValue={100}
              enabled={!isPathLoaded && !isPathLoading}
            />
          </View>
        </View>
      )}

      <View style={[styles.controlGroup, isCompact && styles.fullWidth]}>
        <ThemedText type='default' style={styles.label}>Activation:</ThemedText>
        {renderPicker(activation, setActivation, activations, 110)}
      </View>

      <View style={[styles.controlGroup, isCompact && styles.fullWidth]}>
        <ThemedText type='default' style={styles.label}>Loss:</ThemedText>
        {renderPicker(loss, setLoss, losses, 120)}
      </View>

      <View style={[styles.controlGroup, isCompact && styles.fullWidth]}>
        <ThemedText type='default' style={styles.label}>Method:</ThemedText>
        {renderPicker(method, setMethod, methods, 140)}
      </View>

      {/* View prevents shrinking */}
      <View style={[styles.controlGroup, isCompact && styles.fullWidth, { paddingTop: 18 }]}>
        <Button
          title={isLandscapeLoading ? 'Loading...' : 'Generate Landscape'}
          onPress={() => {
            try {
              onLoadLandscape();
            } catch (e) {
              alert("Error launching load: " + e);
            }
          }}
          disabled={isLandscapeLoading || isPathLoaded || isPathLoading}
          color='#00aaff'
        />
      </View>

      <View style={[styles.controlGroup, { flexDirection: 'column', alignItems: 'center' }]}>
        <ThemedText type='default' style={styles.label}>Log Plot:</ThemedText>
        <Switch
          value={isLogPlot}
          onValueChange={onLogPlotChange}
          disabled={zSliderDisabled}
          thumbColor={isLogPlot ? "#f5dd4b" : "#f4f3f4"}
        />
      </View>

      <View style={[styles.controlGroup, isCompact && styles.fullWidth, { alignItems: 'flex-start' }]}>
        <ThemedText type='default' style={styles.label}>Z Scale: {zValue.toFixed(1)}</ThemedText>
        <Slider
          style={{ width: isCompact ? '100%' : 100, height: 40 }}
          minimumValue={0.001}
          step={0.1}
          maximumValue={5}
          value={zValue}
          onValueChange={onZChange}
          minimumTrackTintColor={zSliderDisabled ? '#888888' : '#00aaff'}
          maximumTrackTintColor="#444"
          thumbTintColor={zSliderDisabled ? '#666' : '#00b9e2'}
          disabled={zSliderDisabled}
        />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    padding: 10,
    gap: 12,
  },
  controlGroup: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 4,
  },
  label: {
    fontSize: 12,
    marginBottom: 2,
    fontWeight: '600',
  },
  fullWidth: {
    width: '100%',
    marginBottom: 8,
  },
  halfWidth: {
    width: '48%',
  },
  stepperWrapper: {
    height: 40,
    justifyContent: 'center',
    alignSelf: 'flex-start', 
  },
  pickerContainer: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#444',
    overflow: 'hidden', 
    height: 40,
    justifyContent: 'center',
    backgroundColor: '#2a2a2a',
  },
  // Style specifically for Web
  webPicker: {
    width: '100%',
    height: '100%',
    color: 'white',
    backgroundColor: '#2a2a2a',
    borderWidth: 0,
    outlineStyle: 'none',
  } as any,
  // Style for Native (iOS/Android)
  nativePicker: {
    width: '100%',
    height: '100%',
    color: 'white',
  },
});
