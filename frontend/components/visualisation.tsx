import React, { useState, useRef, useEffect } from 'react';
import {
  Platform,
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  LayoutChangeEvent,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeIn,
  FadeOutDown,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useNavigate } from 'react-router-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Maximize2,
  Minimize2,
  RotateCcw,
  RefreshCw,
  Palette,
  Plus,
  Upload,
  Info,
  Activity,
  Target,
  Layers,
  Network,
  Route,
  MapPin,
  Eye,
  Lock,
  Gauge,
  TrendingDown,
  ArrowUpDown,
} from 'lucide-react-native';
import { TrainingMetrics } from '../components/training_metrics';
import { NetworkArchitecture } from './network-architecture';

import { useTheme } from '../components/theme-provider';
import { useLoading } from '../components/loading-provider';
import { LayoutManager } from '../components/docking-provider';
import { DockPanel } from '../components/dock-panel';
import { StatsGroupPanel } from '../components/stats-group-panel';
import { Text } from '../components/text';
import { VerticalSlider } from '../components/vertical-slider';
import { Switch } from '../components/switch';
import { NumberInput } from '../components/number-input';
import { Button } from '../components/button';
import { Progress } from '../components/progress';
import { InfoModal } from './info-modal';
import {
  LandscapeLoadingIcon,
  PathLoadingIcon,
} from '../components/icons/icons';

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../components/dropdown-menu';

import { PathConfigInterface, PathConfig } from '../components/path-config';

import {
  dataSets,
  activations,
  methods,
  regLosses,
  ceLoss,
  bceLoss,
  gradientPresets,
  PATH_COLORS,
} from '../constants/constants';

import { useLossLandscape } from '../hooks/loss-landscape';

// Helper to create a default config for a new path
const createDefaultPathConfig = (id: number): PathConfigInterface => {
  const color = PATH_COLORS[id % PATH_COLORS.length];
  return {
    id: id,
    colorName: color.name,
    colorValue: color.value,
    optim: 'Adam',
    lr: 0.01,
    locked: true,
    startPoint: null,
    isPathLoaded: false,
    regen: false,
  };
};

interface VisualisationProps {
  id: string; // Used to isolate state
}

export function Visualisation({ id }: VisualisationProps) {
  const { theme, isDark } = useTheme();
  const { setIsLoading } = useLoading();
  const brandAccent = isDark ? '#C6F382' : '#353F91';

  const [activation, setActivation] = useState<string>('Tanh');
  const [depth, setDepth] = useState<number>(2);
  const [width, setWidth] = useState<number>(10);
  const [method, setMethod] = useState<string>('RANDOMDIRS');
  const [dir1, setDir1] = useState<number | null>(null);
  const [dir2, setDir2] = useState<number | null>(null);
  const [data, setData] = useState<string>('SINREGRESSION');
  const [inputs, setInputs] = useState(['x']);
  const [outputs, setOutputs] = useState(1);
  const [loss, setLoss] = useState<string>('MSELoss');
  const [losses, setLosses] = useState(regLosses);
  const [numPaths, setNumPaths] = useState<number>(1);
  const [pathConfigs, setPathConfigs] = useState<PathConfigInterface[]>([
    createDefaultPathConfig(0),
  ]);
  const [showPalette, setShowPalette] = useState(false);
  const [log, setLog] = useState([]);
  const [isMaximized, setIsMaximized] = useState(false);
  const [showNetworkInfo, setShowNetworkInfo] = useState(false);
  const [showPathInfo, setShowPathInfo] = useState(false);
  const [showVisualisationInfo, setShowVisualisationInfo] = useState(false);
  const navigate = useNavigate();

  const {
    isLandscapeLoading,
    isLandscapeLoaded,
    onGenerateLandscape,
    onRegenerate,
    logPlot,
    handleLogPlotToggle,
    zValue,
    handleZChange,
    isRotating,
    handleRotate,
    handleRefresh,
    handleColorSelect,
    onUploadCsv,
    loadingCsv,
    csvLoaded,
    datasetParameters,
    datasetOutputs,
    containerRef,
    isPathLoading,
    isPathLoaded,
    isPlaying,
    progress,
    currentFrame,
    totalFrames,
    isPlacingMode,
    placingPathId,
    currentParams,
    viewId,
    currentLoss,
    lossChange,
    fidelity,
    instability,
    trainability,
    handleLoadAllPathsButtonClick,
    handleRemovePath,
    handleClearPaths,
    togglePlayPause,
    handleSkipBack,
    handleSkipForward,
    togglePlacingMode,
    onViewPath,
  } = useLossLandscape({
    activation,
    depth,
    width,
    method,
    dir1,
    dir2,
    data,
    loss,
    pathConfigs,
    onPathConfigChange: (
      id: number,
      field: keyof PathConfigInterface,
      value: number | [number, number] | string | boolean | null,
    ) => {
      // Callback for the hook to update the state
      setPathConfigs((currentConfigs) =>
        currentConfigs.map((config) =>
          config.id === id ? { ...config, [field]: value } : config,
        ),
      );
    },
    setLog,
  });

  useEffect(() => {
    setIsLoading(isLandscapeLoading || isPathLoading);
    return () => setIsLoading(false);
  }, [isLandscapeLoading, isPathLoading, setIsLoading]);

  const handlePathAddition = () => {
    if (numPaths > 4) return;
    const currentConfigs = pathConfigs;
    currentConfigs.push(createDefaultPathConfig(numPaths));
    setPathConfigs(currentConfigs);
    setNumPaths(numPaths + 1);
  };

  const handlePathRemoval = (id: number) => {
    if (numPaths < 1) return;

    // Remove path from visualisation
    handleRemovePath(id);

    const updatedConfigs = pathConfigs
      .filter((config) => config.id !== id)
      .map((config, index) => {
        return {
          ...config,
          id: index,
          colorName: PATH_COLORS[index % PATH_COLORS.length].name,
          colorValue: PATH_COLORS[index % PATH_COLORS.length].value,
        };
      });
    setPathConfigs(updatedConfigs);
    setNumPaths(numPaths - 1);
  };

  // Update a specific path's config
  const handleConfigChange = (
    id: number,
    field: keyof PathConfigInterface,
    value: number | [number, number] | string | boolean | null,
  ) => {
    setPathConfigs((currentConfigs) =>
      currentConfigs.map((config) =>
        config.id === id
          ? { ...config, [field]: value, isPathLoaded: false }
          : config,
      ),
    );
  };

  const hasUnsetStartPoints = pathConfigs.some((config) => !config.startPoint);

  const hiddenFileInput = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

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
      setFileName(file.name);
    }
  };

  // Adjust inputs/outputs/parameters when dataset changes
  useEffect(() => {
    let nextInputs: string[] = [];

    switch (data) {
      case 'SINREGRESSION':
        nextInputs = ['x'];
        setInputs(nextInputs);
        setOutputs(1);
        break;
      case 'PENGUINS':
        nextInputs = [
          'bill_length_mm',
          'bill_depth_mm',
          'flipper_length_mm',
          'body_mass_g',
        ];
        setInputs(nextInputs);
        setOutputs(3);
        break;
      case 'PURPLECOLOURS':
        nextInputs = ['R', 'G', 'B'];
        setInputs(nextInputs);
        setOutputs(1);
        break;
      case 'CUSTOM':
        if (csvLoaded) {
          nextInputs = datasetParameters;
          setInputs(nextInputs);
          setOutputs(datasetOutputs);
        } else {
          nextInputs = [];
          setInputs([]);
          setOutputs(null);
        }
        break;
    }

    if (nextInputs.length < 2) {
      setMethod(methods[0].value);
    }
  }, [data, datasetParameters, datasetOutputs, csvLoaded]);

  // Adjust losses when dataset changes
  useEffect(() => {
    let newLosses = regLosses;

    switch (data) {
      case 'SINREGRESSION':
        newLosses = regLosses;
        setMethod('RANDOMDIRS');
        break;
      case 'PENGUINS':
        newLosses = ceLoss;
        break;
      case 'PURPLECOLOURS':
        newLosses = bceLoss;
        break;
      case 'CUSTOM':
        newLosses = datasetOutputs > 1 ? ceLoss : regLosses;
        break;
    }

    setLosses(newLosses);
    setLoss(newLosses[0].value);
  }, [data, datasetOutputs]);

  // Animation Values for Icons
  const rotateAnim = useSharedValue(0);
  const refreshAnim = useSharedValue(0);

  // Continuous Spin for Rotate
  useEffect(() => {
    if (isRotating) {
      rotateAnim.value = 0;
      rotateAnim.value = withRepeat(
        withTiming(-360, { duration: 2000, easing: Easing.linear }),
        -1, // -1 means infinite loop
        false,
      );
    } else {
      rotateAnim.value = 0;
    }
  }, [isRotating, rotateAnim]);

  const rotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotateAnim.value}deg` }],
  }));

  // Single Spin for Refresh
  const onRefreshPress = () => {
    if (!isLandscapeLoaded) return;
    handleRefresh();
    refreshAnim.value = withTiming(refreshAnim.value + 360, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
  };

  const refreshStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${refreshAnim.value}deg` }],
  }));

  const [localDims, setLocalDims] = useState({ width: 0, height: 0 });

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setLocalDims({ width, height });
  };

  const onRegenButtonPress = async (
    id: number,
    method: 'pca' | 'autoencoder',
  ) => {
    if (method === 'pca') setMethod('PCA Directions');
    if (method === 'autoencoder') setMethod('Autoencoder Directions');
    await onRegenerate(id, method);

    // Find the config of the path that was used
    const keptConfig = pathConfigs.find((config) => config.id === id);

    if (keptConfig) {
      const updatedConfig = {
        ...keptConfig,
        id: 0,
        colorName: PATH_COLORS[0].name,
        colorValue: PATH_COLORS[0].value,
        regen: true,
      };

      // Remove all other paths from the UI
      setPathConfigs([updatedConfig]);
      setNumPaths(1);
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={handleLayout}>
      {localDims.width > 0 && localDims.height > 0 && (
        <LayoutManager width={localDims.width} height={localDims.height}>
          <DockPanel
            id='CONFIG'
            title='MODEL CONFIGURATION'
            isMaximized={false}
          >
            <ScrollView contentContainerStyle={styles.sidebarContent}>
              {Platform.OS === 'web' && (
                <input
                  type='file'
                  accept='.csv'
                  ref={hiddenFileInput}
                  onChange={handleWebFileChange}
                  style={{ display: 'none' }}
                />
              )}

              {/* DATASET DROPDOWN */}
              <View style={styles.controlGroup}>
                <Text style={styles.label}>DATASET</Text>
                {data === 'CUSTOM' && (
                  <Text style={styles.subLabel}>
                    {csvLoaded && !loadingCsv ? fileName : ''}
                  </Text>
                )}
                <View
                  style={[
                    { flexDirection: 'row', alignItems: 'center', gap: 12 },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <View
                          style={[
                            styles.dropdownTrigger,
                            { borderColor: theme.colors.border },
                          ]}
                        >
                          <Text style={styles.dropdownValue}>
                            {dataSets.find((item) => item.value === data)
                              ?.label || data}
                          </Text>
                        </View>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {dataSets.map((item) => (
                          <DropdownMenuItem
                            key={item.id}
                            disabled={
                              isLandscapeLoading ||
                              isPathLoading ||
                              isPathLoaded
                            }
                            onSelect={() => {
                              setData(item.value);
                            }}
                          >
                            <Text>{item.label}</Text>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </View>
                  {data === 'CUSTOM' && (
                    <Button
                      variant='outline'
                      disabled={
                        loadingCsv ||
                        isLandscapeLoading ||
                        isPathLoading ||
                        isPathLoaded
                      }
                      onPress={handleUploadPress}
                      size='sm'
                    >
                      <Upload size={14} color={theme.colors.foreground} />
                    </Button>
                  )}
                </View>
              </View>

              {/* ACTIVATION & LOSS DROPDOWNS */}
              <View style={styles.controlGroup}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: 4,
                  }}
                >
                  <Text style={styles.label}>NETWORK CONFIGURATION</Text>
                  <TouchableOpacity onPress={() => setShowNetworkInfo(true)}>
                    <Info size={14} color={theme.colors.mutedForeground} />
                  </TouchableOpacity>
                </View>

                <View style={styles.rowGap}>
                  {/* Left Column: Activation Function */}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.subLabel}>Activation Function</Text>
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <View
                          style={[
                            styles.dropdownTrigger,
                            { borderColor: theme.colors.border },
                          ]}
                        >
                          <Text style={styles.dropdownValue}>
                            {activations.find(
                              (item) => item.value === activation,
                            )?.label || activation}
                          </Text>
                        </View>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {activations.map((item) => (
                          <DropdownMenuItem
                            key={item.id}
                            disabled={
                              isLandscapeLoading ||
                              isPathLoading ||
                              isPathLoaded
                            }
                            onSelect={() => {
                              setActivation(item.value);
                            }}
                          >
                            <Text>{item.label}</Text>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </View>

                  {/* Right Column: Loss Function */}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.subLabel}>Loss Function</Text>
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <View
                          style={[
                            styles.dropdownTrigger,
                            { borderColor: theme.colors.border },
                          ]}
                        >
                          <Text style={styles.dropdownValue}>
                            {losses.find((item) => item.value === loss)
                              ?.label || loss}
                          </Text>
                        </View>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {losses.map((item) => (
                          <DropdownMenuItem
                            key={item.id}
                            disabled={
                              isLandscapeLoading ||
                              isPathLoading ||
                              isPathLoaded
                            }
                            onSelect={() => {
                              setLoss(item.value);
                            }}
                          >
                            <Text>{item.label}</Text>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </View>
                </View>
                <Text style={styles.subLabel}>Visualisation Method</Text>
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <View
                      style={[
                        styles.dropdownTrigger,
                        { borderColor: theme.colors.border },
                      ]}
                    >
                      <Text style={styles.dropdownValue}>
                        {methods.find((item) => item.value === method)?.label ||
                          method}
                      </Text>
                    </View>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {methods
                      .filter(
                        (item) =>
                          item.value !== 'TWOPARAMETERS' ||
                          (inputs && inputs.length > 1),
                      )
                      .map((item) => (
                        <DropdownMenuItem
                          key={item.id}
                          disabled={
                            isLandscapeLoading || isPathLoading || isPathLoaded
                          }
                          onSelect={() => {
                            setMethod(item.value);
                            if (
                              item.value === 'TWOPARAMETERS' &&
                              inputs &&
                              inputs.length > 1
                            ) {
                              setDir1(0);
                              setDir2(1);
                            }
                          }}
                        >
                          <Text>{item.label}</Text>
                        </DropdownMenuItem>
                      ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                {method === 'TWOPARAMETERS' && inputs && inputs.length > 1 && (
                  <View>
                    <Text style={styles.subLabel}>Direction 1</Text>
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <View
                          style={[
                            styles.dropdownTrigger,
                            { borderColor: theme.colors.border },
                          ]}
                        >
                          <Text style={styles.dropdownValue}>{inputs[0]}</Text>
                        </View>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {inputs.map((item, index) => (
                          <DropdownMenuItem
                            key={index}
                            disabled={
                              isLandscapeLoading ||
                              isPathLoading ||
                              isPathLoaded
                            }
                            onSelect={() => setDir1(index)}
                          >
                            <Text>{item}</Text>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Text style={styles.subLabel}>Direction 2</Text>
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <View
                          style={[
                            styles.dropdownTrigger,
                            { borderColor: theme.colors.border },
                          ]}
                        >
                          <Text style={styles.dropdownValue}>{inputs[1]}</Text>
                        </View>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {inputs.map((item, index) => (
                          <DropdownMenuItem
                            key={index}
                            disabled={
                              isLandscapeLoading ||
                              isPathLoading ||
                              isPathLoaded
                            }
                            onSelect={() => setDir2(index)}
                          >
                            <Text>{item}</Text>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </View>
                )}
              </View>

              {/* ARCHITECTURE WITH STACKED NUMBER INPUTS */}
              <View style={styles.controlGroup}>
                <Text style={styles.label}>ARCHITECTURE</Text>
                <View style={styles.rowGap}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.subLabel}>Depth</Text>
                    <NumberInput
                      defaultValue={3}
                      disabled={
                        isLandscapeLoading || isPathLoading || isPathLoaded
                      }
                      value={depth}
                      step={1}
                      min={1}
                      max={100}
                      onChange={setDepth}
                    />
                  </View>
                  {depth > 1 && (
                    <View style={{ flex: 1 }}>
                      <Text style={styles.subLabel}>Width</Text>
                      <NumberInput
                        defaultValue={10}
                        disabled={
                          isLandscapeLoading || isPathLoading || isPathLoaded
                        }
                        value={width}
                        min={1}
                        max={100}
                        onChange={setWidth}
                      />
                    </View>
                  )}
                </View>
              </View>

              {isPathLoading || isPathLoaded ? (
                <Button
                  variant='secondary'
                  disabled={true} // Always disabled if paths are active
                  onPress={() => {
                    onGenerateLandscape();
                  }}
                >
                  {isLandscapeLoading ? 'LOADING...' : 'GENERATE LANDSCAPE'}
                </Button>
              ) : (
                <Button
                  variant='secondary'
                  disabled={
                    isLandscapeLoading ||
                    (data === 'CUSTOM' && !csvLoaded) ||
                    method === 'PCA Directions' ||
                    method === 'Autoencoder Directions'
                  }
                  onPress={() => {
                    onGenerateLandscape();
                  }}
                >
                  {isLandscapeLoading ? 'LOADING...' : 'GENERATE LANDSCAPE'}
                </Button>
              )}

              {/* PATH DETAILS CARD */}
              <View style={styles.controlGroup}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: 4,
                  }}
                >
                  <Text style={styles.label}>PATH CONFIGURATIONS</Text>
                  <TouchableOpacity onPress={() => setShowPathInfo(true)}>
                    <Info size={14} color={theme.colors.mutedForeground} />
                  </TouchableOpacity>
                </View>
                {pathConfigs.map((config) => (
                  <PathConfig
                    key={config.id}
                    config={config}
                    onConfigChange={handleConfigChange}
                    onPathRemoval={handlePathRemoval}
                    onPlaceStartPoint={() => togglePlacingMode(config.id)}
                    networkViewable={depth <= 10 && width <= 10}
                    onViewPath={() => onViewPath(config.id)}
                    isPlacing={isPlacingMode && placingPathId === config.id}
                    isSceneLoading={isLandscapeLoading || isPathLoading}
                    isLandscapeLoaded={isLandscapeLoaded}
                    isWatching={viewId === config.id}
                    onRegenPathPress={onRegenButtonPress}
                  />
                ))}
              </View>

              {numPaths <= 4 && (
                <Button
                  variant='outline'
                  onPress={handlePathAddition}
                  size='sm'
                  style={{ flex: 1 }}
                >
                  <Plus size={18} color={theme.colors.foreground} />
                </Button>
              )}

              <View style={styles.rowGap}>
                {numPaths > 0 && (
                  <Button
                    variant='secondary'
                    disabled={
                      isLandscapeLoading ||
                      isPathLoading ||
                      !isLandscapeLoaded ||
                      hasUnsetStartPoints
                    }
                    onPress={handleLoadAllPathsButtonClick}
                    style={[styles.exportBtn, { flex: 1.5 }]}
                  >
                    {isPathLoading ? 'LOADING...' : 'GENERATE PATHS'}
                  </Button>
                )}

                {isPathLoaded && (
                  <Button
                    onPress={() => {
                      handleClearPaths();
                      setPathConfigs([]);
                      setNumPaths(0);
                    }}
                    variant='destructive'
                    style={styles.exportBtn}
                  >
                    CLEAR PATHS
                  </Button>
                )}
              </View>

              {/*
            <Button variant="secondary" style={styles.exportBtn}>Export Data</Button>
            */}
            </ScrollView>
          </DockPanel>

          {/* ENGINE AREA */}
          <DockPanel
            id='ENGINE'
            title='LOSS LANDSCAPE VISUALISATION'
            isMaximized={isMaximized}
            headerRight={
              <TouchableOpacity onPress={() => setShowVisualisationInfo(true)}>
                <Info size={14} color={theme.colors.mutedForeground} />
              </TouchableOpacity>
            }
          >
            <View style={styles.engineContainer}>
              <View style={styles.engineHeader}>
                {isLandscapeLoaded &&
                  !isLandscapeLoading &&
                  !isPathLoading &&
                  !isPathLoaded && <Text style={styles.label}>LOG PLOT</Text>}
                {isLandscapeLoaded &&
                  !isLandscapeLoading &&
                  !isPathLoaded &&
                  !isPathLoading && (
                    <Switch
                      checked={logPlot}
                      onCheckedChange={handleLogPlotToggle}
                    />
                  )}
                <TouchableOpacity
                  disabled={!isLandscapeLoaded}
                  onPress={() => setIsMaximized(!isMaximized)}
                  style={{ zIndex: 10, opacity: isLandscapeLoaded ? 1 : 0.4 }}
                >
                  {isMaximized ? (
                    <Minimize2 size={18} color={theme.colors.foreground} />
                  ) : (
                    <Maximize2 size={18} color={theme.colors.foreground} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  disabled={!isLandscapeLoaded}
                  onPress={handleRotate}
                  style={{ opacity: isLandscapeLoaded ? 1 : 0.4 }}
                >
                  <Animated.View style={rotateStyle}>
                    <RotateCcw
                      size={18}
                      color={isRotating ? brandAccent : theme.colors.foreground}
                    />
                  </Animated.View>
                </TouchableOpacity>

                <TouchableOpacity
                  disabled={!isLandscapeLoaded}
                  onPress={onRefreshPress}
                  style={{ opacity: isLandscapeLoaded ? 1 : 0.4 }}
                >
                  <Animated.View style={refreshStyle}>
                    <RefreshCw size={18} color={theme.colors.foreground} />
                  </Animated.View>
                </TouchableOpacity>
              </View>

              {isLandscapeLoaded &&
                !isLandscapeLoading &&
                !isPathLoaded &&
                !isPathLoading && (
                  <View style={styles.rightSidebar}>
                    <Text style={styles.label}>Z SCALE</Text>
                    <View style={{ marginTop: 16, height: '25%' }}>
                      <VerticalSlider
                        value={zValue}
                        onValueChange={handleZChange}
                        min={0.01}
                        max={5}
                        step={0.01}
                        height={parent.innerHeight * 0.25}
                      />
                    </View>
                  </View>
                )}

              {isLandscapeLoaded && !isLandscapeLoading && (
                <View style={styles.bottomLeftPalette}>
                  <TouchableOpacity
                    onPress={() => setShowPalette(!showPalette)}
                    style={{
                      zIndex: 20,
                      width: 40,
                      height: 40,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Palette size={18} color={theme.colors.foreground} />
                  </TouchableOpacity>
                  {showPalette && (
                    <Animated.View
                      entering={FadeInDown.duration(300).springify()}
                      exiting={FadeOutDown.duration(200)}
                      style={styles.paletteRow}
                    >
                      {gradientPresets.map((preset) => (
                        <TouchableOpacity
                          key={preset.id}
                          onPress={() => handleColorSelect(preset.id)}
                          style={styles.gradientSwatchContainer}
                        >
                          <LinearGradient
                            colors={
                              preset.colors as [string, string, ...string[]]
                            }
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.gradientSwatch}
                          />
                        </TouchableOpacity>
                      ))}
                    </Animated.View>
                  )}
                </View>
              )}

              {isLandscapeLoading && (
                <View style={styles.hudOverlay}>
                  <LandscapeLoadingIcon
                    isLandscapeLoading={isLandscapeLoading}
                  />
                </View>
              )}

              {isPathLoading && (
                <View style={styles.hudOverlay}>
                  <PathLoadingIcon isLoading={isPathLoading} numPathsLoading={numPaths} />
                </View>
              )}

              {/* Canvas Container */}
              <View
                ref={containerRef}
                style={{ flex: 1, minWidth: 0, backgroundColor: 'transparent' }}
              />

              {isPathLoading && (
                <Animated.View
                  entering={FadeIn.duration(400)}
                  exiting={FadeOut.duration(400)}
                  style={[StyleSheet.absoluteFill, styles.darkOverlay]}
                />
              )}

              {isPathLoaded && (
                <View style={styles.playbackBar}>
                  <View style={styles.playbackActions}>
                    <TouchableOpacity onPress={handleSkipBack}>
                      <SkipBack size={20} color='white' />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.playBtn}
                      onPress={togglePlayPause}
                    >
                      {isPlaying ? (
                        <Pause size={16} color='white' fill='white' />
                      ) : (
                        <Play size={16} color='white' fill='white' />
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleSkipForward}>
                      <SkipForward size={20} color='white' />
                    </TouchableOpacity>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Progress value={progress} />
                  </View>
                  <Text style={styles.frameCounter}>
                    {currentFrame}/{totalFrames}
                  </Text>
                </View>
              )}
            </View>
          </DockPanel>

          <StatsGroupPanel
            archContent={
              <NetworkArchitecture
                inputs={inputs.length || 0}
                depth={depth}
                width={width}
                activation={activation}
                outputs={outputs}
                weights={currentParams || []}
              />
            }
            metricsContent={
              <TrainingMetrics
                currentLoss={currentLoss}
                lossChange={lossChange}
                fidelity={fidelity}
                instability={instability}
                trainability={trainability}
                log={log}
                isPathLoaded={isPathLoaded}
              />
            }
          />
        </LayoutManager>
      )}
      {/* --- NETWORK CONFIGURATION MODAL --- */}
      <InfoModal
        visible={showNetworkInfo}
        onClose={() => setShowNetworkInfo(false)}
        title='Network Configuration'
      >
        <Text
          style={{
            color: theme.colors.foreground,
            fontSize: 13,
            lineHeight: 20,
            marginBottom: 8,
          }}
        >
          Design the architecture of your neural network and determine how its
          high-dimensional loss surface is projected into 3D space.
        </Text>

        <View
          style={[styles.modalSection, { borderColor: theme.colors.border }]}
        >
          <View style={styles.modalRow}>
            <Activity size={16} color={theme.colors.primary} />
            <Text
              style={[styles.modalTitle, { color: theme.colors.foreground }]}
            >
              Activation Function
            </Text>
          </View>
          <Text
            style={[styles.modalDesc, { color: theme.colors.mutedForeground }]}
          >
            The non-linear function applied to neurons. Tanh creates smooth,
            rolling hills, while ReLU creates sharp, angular ridges.
            {'\n\n'}
            To find out more about how activation functions affect loss
            landscapes,{' '}
            <Text
              onPress={() => navigate('/curriculum/activations')}
              style={{
                color: theme.colors.accent,
                textDecorationLine: 'underline',
                fontWeight: 'bold',
              }}
            >
              click here
            </Text>
            .
          </Text>
        </View>

        <View
          style={[styles.modalSection, { borderColor: theme.colors.border }]}
        >
          <View style={styles.modalRow}>
            <TrendingDown size={16} color={theme.colors.primary} />
            <Text
              style={[styles.modalTitle, { color: theme.colors.foreground }]}
            >
              Loss Function
            </Text>
          </View>
          <Text
            style={[styles.modalDesc, { color: theme.colors.mutedForeground }]}
          >
            The mathematical metric used to calculate the network&apos;s error
            (e.g. MSE). This forms the actual &quot;height&quot; (Z-axis) of the
            landscape.
            {'\n\n'}
            To find out more about how a landscape is formed,{' '}
            <Text
              onPress={() => navigate('/curriculum/landscapes')}
              style={{
                color: theme.colors.accent,
                textDecorationLine: 'underline',
                fontWeight: 'bold',
              }}
            >
              click here
            </Text>
            .
          </Text>
        </View>

        <View
          style={[styles.modalSection, { borderColor: theme.colors.border }]}
        >
          <View style={styles.modalRow}>
            <Layers size={16} color={theme.colors.primary} />
            <Text
              style={[styles.modalTitle, { color: theme.colors.foreground }]}
            >
              Visualisation Method
            </Text>
          </View>
          <Text
            style={[styles.modalDesc, { color: theme.colors.mutedForeground }]}
          >
            Because networks have hundreds to millions of weights, we must
            project them into a 2D plane to visualise them.
            {'\n\n'}
            <Text
              style={{ fontWeight: 'bold', color: theme.colors.foreground }}
            >
              Random Directions{' '}
            </Text>
            slices a purely random 2D plane through the high-dimensional space.
            {'\n\n'}
            <Text
              style={{ fontWeight: 'bold', color: theme.colors.foreground }}
            >
              Filter-wise Normalised{' '}
            </Text>
            also takes a random slice, but intelligently scales the directions
            based on the network&apos;s actual weights to prevent visual scale
            distortions.
            {'\n\n'}
            <Text
              style={{ fontWeight: 'bold', color: theme.colors.foreground }}
            >
              PCA & Autoencoders{' '}
            </Text>
            find a plane that perfectly frames a specific optimiser&apos;s
            journey. To use these, you must first generate a path, then use the
            regeneration buttons (click the <Info size={10}></Info> icon on PATH
            CONFIGURATIONS for more details).
          {"\n\n"}
          To find out more about how projections work,{' '}
          <Text
            onPress={() => navigate('/curriculum/projections')}
            style={{
              color: theme.colors.accent,
              textDecorationLine: 'underline',
              fontWeight: 'bold',
            }}
          >
            click here
          </Text>
          .
          </Text>
        </View>

        <View
          style={[styles.modalSection, { borderColor: theme.colors.border }]}
        >
          <View style={styles.modalRow}>
            <Network size={16} color={theme.colors.primary} />
            <Text
              style={[styles.modalTitle, { color: theme.colors.foreground }]}
            >
              Architecture (Depth & Width)
            </Text>
          </View>
          <Text
            style={[styles.modalDesc, { color: theme.colors.mutedForeground }]}
          >
            Depth adds more layers, Width adds more neurons. Larger networks
            create exponentially more complex and difficult-to-navigate
            landscapes.
            {'\n'}
            You can view the network configuration in the NETWORK ARCHITECTURE
            panel below.
            {'\n\n'}
            To find out more about how network configurations affect a loss
            landscape,{' '}
            <Text
              onPress={() => navigate('/curriculum/complexity')}
              style={{
                color: theme.colors.accent,
                textDecorationLine: 'underline',
                fontWeight: 'bold',
              }}
            >
              click here
            </Text>
            .
          </Text>
        </View>

        <View style={{ marginBottom: 8 }}>
          <Text
            style={{
              color: theme.colors.foreground,
              fontSize: 13,
              lineHeight: 22,
            }}
          >
            <Text
              style={{
                fontWeight: '500',
                fontSize: 10,
                backgroundColor: theme.colors.secondary,
                color: theme.colors.primaryForeground,
                letterSpacing: 0.5,
                padding: 2,
                borderRadius: 2,
              }}
            >
              {' GENERATE LANDSCAPE '}
            </Text>
            {'  '}locks in your configuration and computes the 3D surface.
            {'\n\n'}
            <Text
              style={{
                fontStyle: 'italic',
                color: theme.colors.mutedForeground,
              }}
            >
              NOTE: Please ensure that after changing the settings, you generate
              the landscape again, otherwise the landscape you are viewing will
              not match your configuration.
            </Text>
          </Text>
        </View>
      </InfoModal>

      {/* --- PATH CONFIGURATIONS MODAL --- */}
      <InfoModal
        visible={showPathInfo}
        onClose={() => setShowPathInfo(false)}
        title='Path Configurations'
      >
        <Text
          style={{
            color: theme.colors.foreground,
            fontSize: 13,
            lineHeight: 20,
            marginBottom: 8,
          }}
        >
          Observe up to 5 different optimisers to see how they navigate the
          terrain.
        </Text>

        <View
          style={[styles.modalSection, { borderColor: theme.colors.border }]}
        >
          <View style={styles.modalRow}>
            <Lock size={16} color={theme.colors.primary} />
            <Text
              style={[styles.modalTitle, { color: theme.colors.foreground }]}
            >
              Lock to Plane
            </Text>
          </View>
          <Text
            style={[styles.modalDesc, { color: theme.colors.mutedForeground }]}
          >
            When locked, the optimiser is forced to only update weights within
            the visible 2D plane. Unlocking lets it optimise all weights in the
            true high-dimensional space.
            {'\n'}
            <Text
              style={{
                fontStyle: 'italic',
                color: theme.colors.mutedForeground,
              }}
            >
              WARNING: Unlocking may cause very short trajectories due to
              orthogonality. Re-generate the path to get a better visualisation
              (details below).
            </Text>
          </Text>
        </View>

        <View
          style={[styles.modalSection, { borderColor: theme.colors.border }]}
        >
          <View style={styles.modalRow}>
            <Route size={16} color={theme.colors.primary} />
            <Text
              style={[styles.modalTitle, { color: theme.colors.foreground }]}
            >
              Optimiser & Learning Rate
            </Text>
          </View>
          <Text
            style={[styles.modalDesc, { color: theme.colors.mutedForeground }]}
          >
            Choose the optimisation algorithm and its step size. A high learning
            rate might jump out of valleys, while a low one might get stuck.
            {'\n\n'}
            To find out more about how optimisers move across a loss landscape,{' '}
            <Text
              onPress={() => navigate('/curriculum/optimisers')}
              style={{
                color: theme.colors.accent,
                textDecorationLine: 'underline',
                fontWeight: 'bold',
              }}
            >
              click here
            </Text>
            .
          </Text>
        </View>

        <View
          style={[styles.modalSection, { borderColor: theme.colors.border }]}
        >
          <View style={styles.modalRow}>
            <MapPin size={16} color={theme.colors.primary} />
            <Text
              style={[styles.modalTitle, { color: theme.colors.foreground }]}
            >
              Start Point
            </Text>
          </View>
          <Text
            style={[styles.modalDesc, { color: theme.colors.mutedForeground }]}
          >
            After pressing {'  '}
            <Text
              style={{
                fontWeight: '500',
                fontSize: 10,
                backgroundColor: theme.colors.secondary,
                color: theme.colors.primaryForeground,
                letterSpacing: 0.5,
                padding: 2,
                borderRadius: 2,
              }}
            >
              {' PLACE POINT '}
            </Text>
            {'  '} you can click on the landscape to drop a starting pin. This
            is where the optimiser will begin its journey.
          </Text>
        </View>

        <View
          style={[styles.modalSection, { borderColor: theme.colors.border }]}
        >
          <View
            style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}
          >
            <Eye
              size={14}
              color={theme.colors.primary}
              style={{ marginTop: 2 }}
            />
            <View style={{ flex: 1 }}>
              <View style={styles.modalRow}>
                <Text
                  style={[
                    styles.modalTitle,
                    { color: theme.colors.foreground },
                  ]}
                >
                  Watch
                </Text>
              </View>
              <Text
                style={[
                  styles.modalDesc,
                  { color: theme.colors.mutedForeground, marginBottom: 8 },
                ]}
              >
                If pressed, you can view multiple metrics on this optimiser in
                the TRAINING METRICS panel:
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    backgroundColor: theme.colors.muted,
                    paddingVertical: 4,
                    paddingHorizontal: 8,
                    borderRadius: 6,
                  }}
                >
                  <TrendingDown size={12} color={theme.colors.foreground} />
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '700',
                      color: theme.colors.foreground,
                    }}
                  >
                    Loss
                  </Text>
                </View>

                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    backgroundColor: theme.colors.muted,
                    paddingVertical: 4,
                    paddingHorizontal: 8,
                    borderRadius: 6,
                  }}
                >
                  <Target size={12} color={theme.colors.foreground} />
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '700',
                      color: theme.colors.foreground,
                    }}
                  >
                    Fidelity
                  </Text>
                </View>

                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    backgroundColor: theme.colors.muted,
                    paddingVertical: 4,
                    paddingHorizontal: 8,
                    borderRadius: 6,
                  }}
                >
                  <Activity size={12} color={theme.colors.foreground} />
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '700',
                      color: theme.colors.foreground,
                    }}
                  >
                    Instability
                  </Text>
                </View>

                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    backgroundColor: theme.colors.muted,
                    paddingVertical: 4,
                    paddingHorizontal: 8,
                    borderRadius: 6,
                  }}
                >
                  <Gauge size={12} color={theme.colors.foreground} />
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '700',
                      color: theme.colors.foreground,
                    }}
                  >
                    Trainability
                  </Text>
                </View>
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  gap: 8,
                  padding: 10,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                }}
              >
                <Network
                  size={14}
                  color={theme.colors.mutedForeground}
                  style={{ marginTop: 2 }}
                />
                <Text
                  style={[
                    styles.modalDesc,
                    {
                      flex: 1,
                      color: theme.colors.mutedForeground,
                      fontSize: 11,
                      lineHeight: 16,
                    },
                  ]}
                >
                  If the network is small enough (depth × width ≤ 25), you can
                  also see the{' '}
                  <Text
                    style={{
                      color: theme.colors.foreground,
                      fontWeight: 'bold',
                    }}
                  >
                    weights
                  </Text>{' '}
                  of the network at the current position of the optimiser.
                </Text>
              </View>
            </View>
          </View>
        </View>

        <Text
          style={{
            color: theme.colors.foreground,
            fontSize: 13,
            lineHeight: 22,
          }}
        >
          <Text
            style={{
              fontWeight: '500',
              fontSize: 10,
              backgroundColor: theme.colors.secondary,
              color: theme.colors.primaryForeground,
              letterSpacing: 0.5,
              padding: 2,
              borderRadius: 2,
            }}
          >
            {' GENERATE PATHS '}
          </Text>
          {'  '}generates every path from the configurations.
          {'\n'}
          <Text
            style={{ fontStyle: 'italic', color: theme.colors.mutedForeground }}
          >
            NOTE: Please ensure you have generated a landscape and set the start
            point of each optimiser before generating.
          </Text>
        </Text>

        <Text
          style={{
            color: theme.colors.foreground,
            fontSize: 13,
            lineHeight: 20,
          }}
        >
          Once an optimiser&apos;s path is calculated, you can regenerate the
          entire landscape around it to get a much more accurate visualisation
          of its high-dimensional trajectory. Choose one of the following
          projection methods:
        </Text>

        <View
          style={[
            styles.modalSection,
            {
              flexDirection: 'column',
              gap: 12,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View
            style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}
          >
            <Text
              style={[
                styles.modalDesc,
                { flex: 1, color: theme.colors.mutedForeground },
              ]}
            >
              <Text
                style={{ fontWeight: 'bold', color: theme.colors.foreground }}
              >
                PCA (Principal Component Analysis):{' '}
              </Text>
              Rebuilds the landscape using a linear projection. It calculates
              the flat 2D plane that best captures the path&apos;s overall
              variance.
            </Text>
          </View>

          <View
            style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}
          >
            <Text
              style={[
                styles.modalDesc,
                { flex: 1, color: theme.colors.mutedForeground },
              ]}
            >
              <Text
                style={{ fontWeight: 'bold', color: theme.colors.foreground }}
              >
                AutoEnc (Autoencoder):{' '}
              </Text>
              Rebuilds the landscape using a secondary neural network. This
              non-linear projection can capture complex, curved manifolds that
              PCA might miss.
            </Text>
          </View>
        </View>
      </InfoModal>

      {/* --- VISUALISATION MODAL --- */}
      <InfoModal
        visible={showVisualisationInfo}
        onClose={() => setShowVisualisationInfo(false)}
        title='Loss Landscape Visualisation'
      >
        <Text
          style={{
            color: theme.colors.foreground,
            fontSize: 13,
            lineHeight: 20,
            marginBottom: 8,
          }}
        >
          Interact with the generated 3D loss landscape. Use these controls to
          adjust your view, scale the terrain, and analyse the surface geometry.
        </Text>

        <View
          style={[styles.modalSection, { borderColor: theme.colors.border }]}
        >
          <View style={styles.modalRow}>
            <Activity size={16} color={theme.colors.primary} />
            <Text
              style={[styles.modalTitle, { color: theme.colors.foreground }]}
            >
              Log Plot
            </Text>
          </View>
          <Text
            style={[styles.modalDesc, { color: theme.colors.mutedForeground }]}
          >
            Applies a logarithmic scale to the vertical (loss) axis. This
            flattens out massive error spikes, making it much easier to see the
            subtle valleys and minimums where optimisers actually converge.
          </Text>
        </View>

        <View
          style={[styles.modalSection, { borderColor: theme.colors.border }]}
        >
          <View style={styles.modalRow}>
            <Maximize2 size={16} color={theme.colors.primary} />
            <Text
              style={[styles.modalTitle, { color: theme.colors.foreground }]}
            >
              Maximise / Minimise
            </Text>
          </View>
          <Text
            style={[styles.modalDesc, { color: theme.colors.mutedForeground }]}
          >
            Expands the 3D viewport to fill your entire workspace, removing the
            configuration sidebars so you can focus purely on navigating the
            terrain.
          </Text>
        </View>

        <View
          style={[styles.modalSection, { borderColor: theme.colors.border }]}
        >
          <View style={styles.modalRow}>
            <RotateCcw size={16} color={theme.colors.primary} />
            <Text
              style={[styles.modalTitle, { color: theme.colors.foreground }]}
            >
              Auto-Rotate
            </Text>
          </View>
          <Text
            style={[styles.modalDesc, { color: theme.colors.mutedForeground }]}
          >
            Toggles a slow, continuous rotation of the 3D model, giving you a
            smooth 360-degree overview of the landscape without having to drag
            it manually.
          </Text>
        </View>

        <View
          style={[styles.modalSection, { borderColor: theme.colors.border }]}
        >
          <View style={styles.modalRow}>
            <RefreshCw size={16} color={theme.colors.primary} />
            <Text
              style={[styles.modalTitle, { color: theme.colors.foreground }]}
            >
              Reset Camera
            </Text>
          </View>
          <Text
            style={[styles.modalDesc, { color: theme.colors.mutedForeground }]}
          >
            Snaps the camera back to its default starting position and angle.
            Perfect for when you&apos;ve zoomed or panned too far and lost the
            terrain!
          </Text>
        </View>

        <View
          style={[styles.modalSection, { borderColor: theme.colors.border }]}
        >
          <View style={styles.modalRow}>
            <ArrowUpDown size={16} color={theme.colors.primary} />
            <Text
              style={[styles.modalTitle, { color: theme.colors.foreground }]}
            >
              Z Scale Slider
            </Text>
          </View>
          <Text
            style={[styles.modalDesc, { color: theme.colors.mutedForeground }]}
          >
            Stretches or flattens the vertical height of the landscape. Use this
            slider to exaggerate shallow dips or compress impossibly steep
            cliffs.
          </Text>
        </View>

        <View
          style={[styles.modalSection, { borderColor: theme.colors.border }]}
        >
          <View style={styles.modalRow}>
            <Palette size={16} color={theme.colors.primary} />
            <Text
              style={[styles.modalTitle, { color: theme.colors.foreground }]}
            >
              Colour Palette
            </Text>
          </View>
          <Text
            style={[styles.modalDesc, { color: theme.colors.mutedForeground }]}
          >
            Changes the gradient map of the surface. Different colour schemes
            can highlight varying elevations and make terrain contours easier to
            read.
          </Text>
        </View>
      </InfoModal>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  sidebarContent: { padding: 16, gap: 24 },
  controlGroup: { gap: 8 },
  label: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5, opacity: 0.8 },
  subLabel: { fontSize: 9, fontWeight: '600', opacity: 0.5, marginBottom: 2 },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowGap: { flexDirection: 'row', gap: 10 },
  dropdownTrigger: {
    height: 36,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  statsRow: {
    flexDirection: 'row',
    height: 180, // Matches the height of your DockPanel footer
    padding: 12,
    paddingTop: 6,
    gap: 0,
  },
  dropdownValue: { fontSize: 12 },
  pathCard: {
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 8,
    borderLeftWidth: 4,
    gap: 12,
  },
  pathTitle: { fontSize: 10, fontWeight: '900' },
  exportBtn: { marginTop: 10, padding: 5, flex: 1 },
  engineContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    overflow: 'hidden',
    position: 'relative',
  },
  darkOverlay: { backgroundColor: 'rgba(0, 0, 0, 0.6)', zIndex: 5 },
  engineHeader: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    gap: 16,
    zIndex: 10,
  },
  rightSidebar: {
    position: 'absolute',
    right: 0,
    top: '20%',
    bottom: '20%',
    zIndex: 10,
    alignItems: 'center',
    paddingRight: 16,
    gap: 10,
  },
  verticalSliderWrapper: {
    transform: [{ rotate: '-90deg' }],
    width: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomLeftPalette: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    zIndex: 10,
    flexDirection: 'column-reverse',
    alignItems: 'center',
    minHeight: 42,
    gap: 12,
  },
  paletteRow: {
    flexDirection: 'column',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  gradientSwatchContainer: {
    width: 20,
    height: 20,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  gradientSwatch: { flex: 1, width: '100%', height: '100%' },
  hudOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  hudTitle: { color: 'white', fontSize: 18, fontWeight: '800' },
  hudSubtitle: { color: 'white', opacity: 0.7, fontSize: 12, marginTop: 4 },
  playbackBar: {
    position: 'absolute',
    bottom: 20,
    left: 75,
    right: 75,
    height: 54,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 16,
  },
  playbackActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  playBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  frameCounter: { color: 'white', fontSize: 10, fontWeight: 'bold', width: 45 },
  modalSection: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
});
