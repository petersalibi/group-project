'use client';
import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Text, Button, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { useLandscapeScene } from '@/hooks/use-landscape-scene';
import { LandscapeControls } from '@/components/landscape-controls';
import { AnimationControls } from '@/components/animation-controls';
import {
  PathConfigControls,
  PathConfig,
} from '@/components/path-config-controls';
import { PATH_COLORS } from '@/constants/landscapeParams';
import path from 'path';

// Helper to create a default config for a new path
const createDefaultPathConfig = (id: number): PathConfig => {
  const color = PATH_COLORS[id % PATH_COLORS.length];
  return {
    id: id,
    colorName: color.name,
    colorValue: color.value,
    optim: 'Adam',
    loss: 'MSELoss',
    lr: 0.01,
    startPoint: [0, 0],
  };
};

export default function LandscapeWithPath() {
  // --- Shared Landscape State ---
  const [activation, setActivation] = useState<string>('ReLU');
  const [depth, setDepth] = useState<number>(2);
  const [width, setWidth] = useState<number>(10);
  const [method, setMethod] = useState<string>('RANDOMDIRS');
  const [data, setData] = useState<string>('SINREGRESSION');
  const [loss, setLoss] = useState<string>('MSELoss');
  const [pathControlsVisible, setPathControlsVisible] = useState(true);

  // --- Path State ---
  const [numPaths, setNumPaths] = useState<number>(1);
  const [pathConfigs, setPathConfigs] = useState<PathConfig[]>([
    createDefaultPathConfig(0),
  ]);

  // --- Landscape Scene Hook ---
  const {
    containerId,
    zValue,
    isLandscapeLoading,
    isLandscapeLoaded,
    isPathLoading,
    isPathLoaded,
    isPlaying,
    isPlacingMode,
    placingPathId,
    handleLoadLandscapeButtonClick,
    handleLoadAllPathsButtonClick,
    handleRemoveAllPaths,
    togglePlayPause,
    handleZChange,
    togglePlacingMode,
  } = useLandscapeScene({
    activation,
    depth,
    width,
    method,
    data,
    loss,
    pathConfigs,
    onPathConfigChange: (id, field, value) => {
      // Callback for the hook to update the state
      setPathConfigs((currentConfigs) =>
        currentConfigs.map((config) =>
          config.id === id ? { ...config, [field]: value } : config,
        ),
      );
    },
  });

  // --- UI Handlers ---

  // Update path config array when user changes number of paths
  const handleNumPathsChange = (num: number) => {
    setNumPaths(num);
    setPathConfigs((currentConfigs) => {
      const newConfigs = [];
      for (let i = 0; i < num; i++) {
        // Keep existing config if available, otherwise create new
        newConfigs.push(currentConfigs[i] || createDefaultPathConfig(i));
      }
      return newConfigs;
    });
  };

  // Update a specific path's config
  const handleConfigChange = (
    id: number,
    field: keyof PathConfig,
    value: any,
  ) => {
    setPathConfigs((currentConfigs) =>
      currentConfigs.map((config) =>
        config.id === id ? { ...config, [field]: value } : config,
      ),
    );
  };

  const isLoading = isLandscapeLoading || isPathLoading;

  return (
    <SafeAreaView style={{ flex: 1, position: 'relative' }}>
      <View id={containerId} style={{ flex: 1 }} />

      {/* UI Controls Container */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          flexDirection: 'column',
          gap: 5,
        }}
      >
        {/* === Landscape Controls === */}
        <LandscapeControls
          data={data}
          depth={depth}
          width={width}
          activation={activation}
          method={method}
          zValue={zValue}
          isLandscapeLoading={isLandscapeLoading}
          isLandscapeLoaded={isLandscapeLoaded}
          isPathLoaded={isPathLoaded}
          setData={setData}
          setDepth={setDepth}
          setWidth={setWidth}
          setActivation={setActivation}
          setMethod={setMethod}
          onLoadLandscape={handleLoadLandscapeButtonClick}
          onZChange={handleZChange}
        />

        {/* === Path Controls === */}
        <View style={{ paddingHorizontal: 10, gap: 5 }}>
          
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 10,
                backgroundColor: '#d8eeff4d',
                padding: 5,
                borderRadius: 5,
              }}
            >
              
              {/* Left Column: Global Path Controls */}
              <View
                style={{
                  flexDirection: 'column',
                  gap: 10,
                  paddingTop: 5,
                }}
              >
                {pathControlsVisible && (
                  <>
                    <View style={styles.param}>
                      <Text>Paths: </Text>
                      <Picker
                        selectedValue={numPaths}
                        style={{ height: 30 }}
                        onValueChange={(itemValue) =>
                          handleNumPathsChange(Number(itemValue))
                        }
                      >
                        <Picker.Item label="1" value={1} />
                        <Picker.Item label="2" value={2} />
                        <Picker.Item label="3" value={3} />
                      </Picker>
                    </View>

                    <Button
                      title={isPathLoading ? 'Loading...' : 'Generate All Paths'}
                      onPress={handleLoadAllPathsButtonClick}
                      disabled={isLoading || !isLandscapeLoaded}
                    />
                    {isPathLoaded && (
                      <Button
                        title={'Remove All Paths'}
                        onPress={handleRemoveAllPaths}
                      />
                    )}
                  </>
                )}
                {/* === Animation Controls === */}
                <AnimationControls
                  isPathLoaded={isPathLoaded}
                  isPlaying={isPlaying}
                  onTogglePlayPause={togglePlayPause}
                />
              </View>

              {/* Right Column: Stacked PathConfigControls */}
              {pathControlsVisible && (
              <View style={{ flexDirection: 'column', gap: 5, flex: 1 }}>
                {pathConfigs.map((config) => (
                  <PathConfigControls
                    key={config.id}
                    config={config}
                    onConfigChange={handleConfigChange}
                    onPlaceStartPoint={() => togglePlacingMode(config.id)}
                    isPlacing={isPlacingMode && placingPathId === config.id}
                    isSceneLoading={isLoading}
                    isLandscapeLoaded={isLandscapeLoaded}
                  />
                ))}
              </View>
              )}
            </View>
          {/* === Path Controls Toggle Button === */}
          <Pressable
            onPress={() => setPathControlsVisible((prev) => !prev)}
            style={styles.toggleButton}
          >
            <Text style={[
              styles.toggleArrow,
              { transform: [{ rotate: pathControlsVisible ? '0deg' : '180deg' }] }
            ]}>
              ^
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
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
  toggleButton: {
    padding: 2,
    alignSelf: 'center',
    backgroundColor: '#d8eeff4d',
    borderRadius: 20,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
  },
  toggleArrow: {
    color: 'white',
    fontSize: 14,
    lineHeight: 18,
    //transition: 'transform 0.2s ease-in-out'
  },
});