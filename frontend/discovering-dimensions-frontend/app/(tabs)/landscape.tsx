'use client';
import React, { useState, useEffect } from 'react';
import { Platform, StyleSheet, Text, View, Button, Pressable, ScrollView, Dimensions, LayoutChangeEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { useLandscapeScene } from '@/hooks/use-landscape-scene';
import { LandscapeControls } from '@/components/landscape-controls';
import { AnimationControls } from '@/components/animation-controls';
import { PathConfigControls, PathConfig } from '@/components/path-config-controls';
import NetworkVis from '@/components/network-vis';
import { PATH_COLORS, datasetFeatures, datasetOutputs } from '@/constants/landscapeParams';

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
  const [inputs, setInputs] = useState<number>(1);
  const [depth, setDepth] = useState<number>(2);
  const [width, setWidth] = useState<number>(10);
  const [outputs, setOutputs] = useState<number>(1);
  const [method, setMethod] = useState<string>('RANDOMDIRS');
  const [data, setData] = useState<string>('SINREGRESSION');
  const [loss, setLoss] = useState<string>('MSELoss');
  const [pathControlsVisible, setPathControlsVisible] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  useEffect(() => {
    if (Platform.OS === 'web') {
      window.dispatchEvent(new Event('resize'));
    }
  }, [headerHeight, viewportHeight, pathControlsVisible]);

  useEffect(() => {
    setInputs(datasetFeatures[data] || 1);
    setOutputs(datasetOutputs[data] || 1);
  }, [data]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 50);
    }
  }, [pathControlsVisible]);

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
      const newConfigs: PathConfig[] = [];
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
    <SafeAreaView 
      style={{ flex: 1, backgroundColor: '#1a1a1a' }}
      onLayout={(event: LayoutChangeEvent) => setViewportHeight(event.nativeEvent.layout.height)}
    >
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        stickyHeaderIndices={[1]}
        bounces={false} // Prevents overscrolling on iOS
      >

        {/* === Network Visualisation === */}
        <View style={{ height: 400, width: '100%' }}>
          <NetworkVis inputCount={inputs} depth={depth} width={width} activation={activation} outputCount={outputs} />
        </View>
        
        {/* TOP BAR: Landscape Controls */}
        <View 
          style={styles.topBar}
          onLayout={(event: LayoutChangeEvent) => setHeaderHeight(event.nativeEvent.layout.height)}
        >
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
        </View>

        {/* MAIN LAYOUT: Canvas + Sidebar */}
        <View style={{ 
            flexDirection: 'row', 
            overflow: 'hidden', 
            height: viewportHeight > 0 ? viewportHeight - headerHeight : Dimensions.get('window').height - 100 
        }}>
          
          {/* Canvas Container */}
          <View id={containerId} style={{ flex: 1, minWidth: 0 }} />

          {/* Right Sidebar Container */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', zIndex: 20, height: '100%' }}>
            
            {/* Toggle Button */}
            <Pressable
              onPress={() => setPathControlsVisible((prev) => !prev)}
              style={styles.sidebarToggle}
            >
              <Text style={[
                styles.toggleArrow,
                { transform: [{ rotate: pathControlsVisible ? '0deg' : '180deg' }] }
              ]}>
                {'>'} 
              </Text>
            </Pressable>

            {/* Scrollable Sidebar Content */}
            {pathControlsVisible && (
              <ScrollView style={styles.sidebar} contentContainerStyle={{ gap: 10, paddingBottom: 20 }}>
                
                {/* Path Count & Actions */}
                <View style={styles.sidebarSection}>
                  <Text style={styles.headerText}>Configuration</Text>
                  
                  <View style={styles.row}>
                    <Text style={{ color: '#eee', fontSize: 12 }}>Number of Paths:</Text>
                    <Picker
                      selectedValue={numPaths}
                      style={{ height: 28, width: 60, backgroundColor: '#eee' }}
                      onValueChange={(itemValue) => handleNumPathsChange(Number(itemValue))}
                    >
                      <Picker.Item label="1" value={1} />
                      <Picker.Item label="2" value={2} />
                      <Picker.Item label="3" value={3} />
                    </Picker>
                  </View>

                  <View style={{ gap: 5 }}>
                    <Button
                      title={isPathLoading ? 'Loading...' : 'Generate Paths'}
                      onPress={handleLoadAllPathsButtonClick}
                      disabled={isLoading || !isLandscapeLoaded}
                    />
                    {isPathLoaded && (
                      <Button
                        title={'Clear Paths'}
                        onPress={handleRemoveAllPaths}
                        color="#ff4444"
                      />
                    )}
                  </View>
                </View>
                {/* Animation */}
                {isPathLoaded && (
                <View style={styles.sidebarSection}>
                    <Text style={styles.headerText}>Animation</Text>
                    <AnimationControls
                      isPathLoaded={isPathLoaded}
                      isPlaying={isPlaying}
                      onTogglePlayPause={togglePlayPause}
                    />
                </View>
                )}

                {/* Individual Path Settings */}
                <View style={{ gap: 8 }}>
                  <Text style={styles.headerText}>Path Details</Text>
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

              </ScrollView>
            )}
          </View>
        </View>
      </ScrollView>
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
  topBar: {
    backgroundColor: '#1c1c1c',
    zIndex: 30,
    flexGrow: 0,
  },
  sidebar: {
    width: 280,
    backgroundColor: '#1c1c1cf0',
    borderLeftWidth: 1,
    borderLeftColor: '#333',
    height: '100%',
    padding: 10,
  },
  sidebarToggle: {
    width: 24,
    height: 50,
    backgroundColor: '#333',
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10, 
  },
  toggleArrow: {
    color: '#00aaff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  sidebarSection: {
    backgroundColor: '#2a2a2a',
    padding: 10,
    borderRadius: 6,
    gap: 8,
  },
  headerText: {
    color: '#888',
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});