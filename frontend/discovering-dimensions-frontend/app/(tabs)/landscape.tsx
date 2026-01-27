'use client';
import React, { useRef, useState, useEffect } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View,
  Button,
  Pressable,
  ScrollView,
  PanResponder,
  useWindowDimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { useLandscapeScene } from '@/hooks/use-landscape-scene';
import { LandscapeControls } from '@/components/landscape-controls';
import { AnimationControls } from '@/components/animation-controls';
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

  const { width: windowWidth } = useWindowDimensions();

  // State for the left panel width
  const [leftPanelWidth, setLeftPanelWidth] = useState(windowWidth * 0.5);

  // Ref to track the width during the drag gesture
  const leftPanelWidthRef = useRef(windowWidth * 0.5);

  // Adjust panel width if window resizes
  useEffect(() => {
    const minWidth = 350;
    const maxWidth = windowWidth - 350;

    // If the window shrinks and cuts off the panel, clamp it to the new max
    if (leftPanelWidth > maxWidth) {
      setLeftPanelWidth(Math.max(minWidth, maxWidth));
    }
    // If the window grows/shrinks and the panel is too small, clamp to min
    else if (leftPanelWidth < minWidth) {
      setLeftPanelWidth(minWidth);
    }
  }, [windowWidth]); // Re-run this check whenever the window width changes

  // PanResponder to handle the drag
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // Sync the ref with the current state when drag starts
        leftPanelWidthRef.current = leftPanelWidth;
      },
      onPanResponderMove: (_, gestureState) => {
        // Calculate new width
        const newWidth = leftPanelWidthRef.current + gestureState.dx;
        
        const minWidth = 0.3*windowWidth;
        const maxWidth = 0.7*windowWidth;

        if (newWidth >= minWidth && newWidth <= maxWidth) {
          setLeftPanelWidth(newWidth);
        }
      },
      onPanResponderRelease: () => {},
    })
  ).current;

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
            Platform.OS === 'web' &&
              ({
                backgroundImage:
                  'linear-gradient(to bottom, hsl(0, 80%, 50%), hsl(60, 80%, 50%), hsl(120, 80%, 50%), hsl(180, 80%, 50%), hsl(252, 80%, 50%))',
              } as any),
          ]}
        />
        <Text style={styles.lossKeyText}>Low Loss</Text>
      </View>
    );
  }

  const isLoading = isLandscapeLoading || isPathLoading;

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: Colors[theme].landscapeBackground }}
    >
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
      <View style={{ flex: 1, flexDirection: 'row', overflow: 'hidden' }}>
        {/* LEFT: Network Visualisation */}
        <View style={{ width: leftPanelWidth, borderRightWidth: 1, borderColor: '#333' }}>
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

        {/* RIGHT: Landscape Canvas + Sidebar */}
        <View style={{ flex: 1 }}>
          <ThemedView
            style={{
              flex: 1,
              flexDirection: 'row',
              overflow: 'hidden',
            }}
            lightColor={Colors['light'].background}
          >
            {/* Canvas Container */}
            <View id={containerId} style={{ flex: 1, minWidth: 0 }} />

            {isLandscapeLoaded && <LossKey />}

            {/* Right Sidebar Container */}
            <View
              style={{
                position: 'absolute', 
                right: 0,
                top: 0,
                bottom: 0,
                flexDirection: 'row',
                alignItems: 'flex-start',
                zIndex: 20,
                height: '100%',
                pointerEvents: 'box-none'
              }}
            >
              {/* Toggle Button */}
              <Pressable
                onPress={() => setPathControlsVisible((prev) => !prev)}
                style={styles.sidebarToggle}
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
                <ScrollView
                  style={styles.sidebar}
                  contentContainerStyle={{ gap: 10, paddingBottom: 20 }}
                >
                  {/* Path Count & Actions */}
                  <View style={styles.sidebarSection}>
                    <Text style={styles.headerText}>Configuration</Text>

                    <View style={styles.row}>
                      <Text style={{ color: '#eee', fontSize: 12 }}>
                        Number of Paths:
                      </Text>
                      <Picker
                        selectedValue={numPaths}
                        style={{
                          height: 28,
                          width: 60,
                          backgroundColor: '#eee',
                        }}
                        onValueChange={(itemValue) =>
                          handleNumPathsChange(Number(itemValue))
                        }
                      >
                        <Picker.Item label='1' value={1} />
                        <Picker.Item label='2' value={2} />
                        <Picker.Item label='3' value={3} />
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
                        onViewNetwork={() => onViewNetwork(config.id)}
                        isPlacing={isPlacingMode && placingPathId === config.id}
                        isSceneLoading={isLoading}
                        isLandscapeLoaded={isLandscapeLoaded}
                        isWatching={networkViewId === config.id}
                      />
                    ))}
                  </View>
                </ScrollView>
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
