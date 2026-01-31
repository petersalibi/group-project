'use client';
import React, { useRef, useState, useEffect } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  Button,
  Pressable,
  ScrollView,
  PanResponder,
  useWindowDimensions,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { useLandscapeScene } from '@/hooks/use-landscape-scene';
import { LandscapeControls } from '@/components/landscape-controls';
import { AnimationControls } from '@/components/animation-controls';
import { NumericStepper } from '@/components/numeric-stepper';
import {
  PathConfigControls,
  PathConfig,
} from '@/components/path-config-controls';
import NetworkVis from '@/components/network-vis';
import {
  PATH_COLORS,
  datasetFeatures,
  datasetOutputs,
} from '@/constants/landscapeParams';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/components/theme-provider';

// Helper to create a default config for a new path
const createDefaultPathConfig = (id: number): PathConfig => {
  const color = PATH_COLORS[id % PATH_COLORS.length];
  return {
    id: id,
    colorName: color.name,
    colorValue: color.value,
    optim: 'Adam',
    lr: 0.01,
    locked: true,
    startPoint: [0, 0],
  };
};

export default function LandscapeWithPath() {
  const { theme } = useTheme();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isLandscape = windowWidth > windowHeight;
  const isMobile = windowWidth < 768 || (isLandscape && windowHeight < 500);
  const isMobileLandscape = isMobile && isLandscape;
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
    customDatasetInputs,
    customDatasetOutputs,
    containerRef,
    zValue,
    isLogPlot,
    isLandscapeLoading,
    isLandscapeLoaded,
    isPathLoading,
    isPathLoaded,
    isPlaying,
    isPlacingMode,
    placingPathId,
    currentParams,
    networkViewId,
    handleLoadLandscapeButtonClick,
    handleLoadAllPathsButtonClick,
    handleClearPaths,
    togglePlayPause,
    handleZChange,
    handleLogPlotToggle,
    togglePlacingMode,
    onViewNetwork,
    handleUploadCsv,
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

  useEffect(() => {
    if (data === 'CUSTOM' && customDatasetInputs !== null && customDatasetOutputs !== null) {
      setInputs(customDatasetInputs);
      setOutputs(customDatasetOutputs);
    } else {
      setInputs(datasetFeatures[data] || 1);
      setOutputs(datasetOutputs[data] || 1);
    }
  }, [data, customDatasetInputs, customDatasetOutputs]);

  // State for the left panel width
  const [leftPanelWidth, setLeftPanelWidth] = useState(windowWidth * 0.5);

  const latestWidthStateRef = useRef(leftPanelWidth);
  const latestWindowWidthRef = useRef(windowWidth);

  useEffect(() => {
    latestWidthStateRef.current = leftPanelWidth;
    latestWindowWidthRef.current = windowWidth;
  }, [leftPanelWidth, windowWidth]);

  const dragStartWidthRef = useRef(windowWidth * 0.5);

  // PanResponder to handle the drag
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => !isMobile, // Disable on mobile
      onPanResponderGrant: () => {
        // Sync the ref with the current state when drag starts
        dragStartWidthRef.current = latestWidthStateRef.current;
      },
      onPanResponderMove: (_, gestureState) => {
        if (isMobile) return;

        const currentWindowWidth = latestWindowWidthRef.current;
        const newWidth = dragStartWidthRef.current + gestureState.dx;
        
        // Constrain to 20% - 80% of window width
        const minWidth = currentWindowWidth * 0.20; 
        const maxWidth = currentWindowWidth * 0.80;

        // Clamp the value
        if (newWidth >= minWidth && newWidth <= maxWidth) {
          setLeftPanelWidth(newWidth);
        }
      },
      onPanResponderRelease: () => {},
    })
  ).current;

  // Adjust panel width if window resizes
  useEffect(() => {
    if (isMobile) return;
    
    const minWidth = windowWidth * 0.20;
    const maxWidth = windowWidth * 0.80;

    // If the window shrinks and cuts off the panel, clamp it to the new max
    if (leftPanelWidth > maxWidth) {
      setLeftPanelWidth(maxWidth);
    }
    // If the window grows/shrinks and the panel is too small, clamp to min
    else if (leftPanelWidth < minWidth) {
      setLeftPanelWidth(minWidth);
    }
  }, [windowWidth, isMobile]);

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

  function LossKey() {
    return (
      <View style={styles.lossKeyContainer}>
        <Text style={styles.lossKeyText}>High Loss</Text>
        {/* Gradient Bar */}
        <View
          style={[
            styles.gradientBar,
            Platform.OS === 'web'
              ? {
                  backgroundImage:
                    'linear-gradient(to bottom, hsl(0, 80%, 50%), hsl(60, 80%, 50%), hsl(120, 80%, 50%), hsl(180, 80%, 50%), hsl(252, 80%, 50%))',
                }
              : { backgroundColor: '#888' }, // Fallback for native if no gradient lib
          ]}
        />
        <Text style={styles.lossKeyText}>Low Loss</Text>
      </View>
    );
  }

  const isLoading = isLandscapeLoading || isPathLoading;

  // Adjusted Sidebar Style for Overlay behavior on Mobile Landscape
  const sidebarContainerStyle: ViewStyle = isMobileLandscape
    ? {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        zIndex: 50,
        flexDirection: 'row',
        alignItems: 'flex-start',
      }
    : {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        zIndex: 20,
        height: '100%',
        flexDirection: 'row',
        alignItems: 'flex-start',
    };

  return (
    <SafeAreaView
      edges={isMobileLandscape ? ['left', 'right'] : ['top', 'left', 'right']} // Remove top padding in landscape to save space
      style={{ flex: 1, backgroundColor: Colors[theme].landscapeBackground }}
    >
      <StatusBar hidden={isMobileLandscape} />
      {/* TOP BAR: Landscape Controls */}
      <View style={styles.topBar}>
        <LandscapeControls
          data={data}
          depth={depth}
          width={width}
          activation={activation}
          method={method}
          loss={loss}
          zValue={zValue}
          isLogPlot={isLogPlot}
          isLandscapeLoading={isLandscapeLoading}
          isLandscapeLoaded={isLandscapeLoaded}
          isPathLoading={isPathLoading}
          isPathLoaded={isPathLoaded}
          setData={setData}
          setDepth={setDepth}
          setWidth={setWidth}
          setActivation={setActivation}
          setMethod={setMethod}
          setLoss={setLoss}
          onLogPlotChange={handleLogPlotToggle}
          onLoadLandscape={handleLoadLandscapeButtonClick}
          onZChange={handleZChange}
          onUploadCsv={handleUploadCsv}
        />
      </View>

      {/* MAIN CONTENT */}
      <View style={{ flex: 1, flexDirection: isMobile ? 'column' : 'row', overflow: 'hidden' }}>
        {/* LEFT: Network Visualisation */}
        <View 
          style={
            isMobile
              ? { height: '40%', width: '100%', borderBottomWidth: 1, borderColor: '#333' }
              : { width: leftPanelWidth, height: '100%', borderRightWidth: 1, borderColor: '#333' }
          }
        >
          <NetworkVis
            inputCount={inputs}
            depth={depth}
            width={width}
            activation={activation}
            outputCount={outputs}
            weights={currentParams || []}
          />
        </View>

        {/* --- DRAGGABLE HANDLE --- */}
        {!isMobile && (
          <View
            {...panResponder.panHandlers}
            style={[
              {
                width: 12,
                backgroundColor: '#2a2a2a',
                alignItems: 'center',
                justifyContent: 'center',
              },
              // Only apply the cursor style on Web
              Platform.select({
                web: { cursor: 'col-resize' } as any,
                default: {},
              }),
            ]}
          >
            <View style={{ width: 4, height: 30, borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#555' }} />
          </View>
        )}

        {/* RIGHT: Landscape Canvas + Sidebar */}
        <View style={{ flex: 1, position: 'relative' }}>
          <ThemedView
            style={{
              flex: 1,
              flexDirection: 'row',
              overflow: 'hidden',
            }}
            lightColor={Colors['light'].background}
          >
            {/* Canvas Container */}
            <View ref={containerRef} style={{ flex: 1, minWidth: 0, backgroundColor: '#000' }} />

            {isLandscapeLoaded && <LossKey />}

            {/* Right Sidebar Container */}
            <View style={sidebarContainerStyle}>
              {/* Toggle Button */}
              <Pressable
                onPress={() => setPathControlsVisible((prev) => !prev)}
                style={styles.sidebarToggle}
                hitSlop={10}
              >
                <View
                  style={[
                    {
                      transform: [
                        { rotate: pathControlsVisible ? '0deg' : '180deg' },
                      ],
                    },
                  ]}
                >
                  <IconSymbol name='chevron.right' size={30} color='white' />
                </View>
              </Pressable>

              {/* Scrollable Sidebar Content */}
              {pathControlsVisible && (
                <View style={{ 
                    height: '100%', 
                    backgroundColor: '#1c1c1cf0',
                    width: isMobile ? (isMobileLandscape ? 300 : windowWidth * 0.8) : 280,
                }}>
                <ScrollView
                  style={[
                      styles.sidebarScrollView,
                      // On mobile, max out at a smaller width if needed, or take mostly full screen
                      isMobile && { width: windowWidth * 0.8 }, 
                  ]}
                  contentContainerStyle={{ gap: 10, paddingBottom: 20 }}
                >
                  {/* Path Count & Actions */}
                  <View style={styles.sidebarSection}>
                    <Text style={styles.headerText}>Configuration</Text>

                    <View style={styles.row}>
                      <Text style={{ color: '#eee', fontSize: 12 }}>
                        Number of Paths:
                      </Text>
                      <NumericStepper
                        value={numPaths}
                        onChange={handleNumPathsChange}
                        minValue={1}
                        maxValue={5}
                      />
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
                          onPress={handleClearPaths}
                          color='#ff4444'
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
                        networkViewable={depth <= 10 && width <= 10}
                        onViewNetwork={() => onViewNetwork(config.id)}
                        isPlacing={isPlacingMode && placingPathId === config.id}
                        isSceneLoading={isLoading}
                        isLandscapeLoaded={isLandscapeLoaded}
                        isWatching={networkViewId === config.id}
                      />
                    ))}
                  </View>
                </ScrollView>
                </View>
              )}
            </View>
          </ThemedView>
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
  topBar: {
    zIndex: 30,
    flexGrow: 0,
    borderBottomWidth: 1,
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
    width: 30,
    height: 50,
    backgroundColor: '#333',
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  sidebarScrollView: {
     flex: 1,
     padding: 10,
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
  lossKeyContainer: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
    zIndex: 10, // Ensure it sits above the canvas
    pointerEvents: 'none', // Let clicks pass through to the canvas if needed
  },
  lossKeyText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  gradientBar: {
    width: 12,
    height: 80,
    marginVertical: 4,
  },

});
