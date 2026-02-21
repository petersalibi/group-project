import React, { useState, useRef, useEffect } from "react";
import { Platform, View, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import Animated, { FadeInDown, FadeIn, FadeInUp, FadeOutDown, FadeOut, FadeOutUp } from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Pause, Play, SkipBack, SkipForward, Maximize2, Minimize2,
  RotateCcw, RefreshCw, Eye, Network, Palette, Plus, Upload 
} from "lucide-react-native";
import { TrainingMetrics } from "../components/training_metrics";
import { NetworkArchitecture } from "../components/network_architecture";

import { useTheme } from "../components/theme-provider";
import { useLoading } from "../components/loading-provider";
import { LayoutManager } from "../components/docking-provider";
import { DockPanel } from "../components/dock-panel";
import { StatsGroupPanel } from "../components/stats-group-panel";
import { Text } from "../components/text";
import { VerticalSlider } from "../components/vertical-slider";
import { Switch } from "../components/switch";
import { NumberInput } from "../components/number-input";
import { Button } from "../components/button";
import { Progress } from "../components/progress";
import { LandscapeLoadingIcon, PathLoadingIcon } from "../components/icons/icons";

import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem 
} from "../components/dropdown-menu";

import {
  PathConfigInterface,
  PathConfig,
} from '../components/path-config';

import { dataSets, activations, methods, regLosses, ceLoss, bceLoss, gradientPresets, PATH_COLORS } from '../constants/constants';

import { useLossLandscape } from "../hooks/loss-landscape";

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
  };
};

export function VisualisationPage() {
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

  const { 
    isLandscapeLoading,
    isLandscapeLoaded,
    onGenerateLandscape,
    logPlot,
    handleLogPlotToggle,
    zValue,
    handleZChange,
    handleRefresh,
    handleColorSelect,
    onUploadCsv,
    loadingCsv,
    csvLoaded,
    datasetParameters,
    setDatasetParameters,
    datasetOutputs,
    setDatasetOutputs,
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
    onPathConfigChange: (id, field, value) => {
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
  }

  const handlePathRemoval = (id: number) => {
    if (numPaths < 1) return;

    // Remove path from visualisation
    handleRemovePath(id);

    const updatedConfigs = pathConfigs
    .filter(config => config.id !== id)
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
  }

  // Update a specific path's config
  const handleConfigChange = (
    id: number,
    field: keyof PathConfigInterface,
    value: any,
  ) => {
    setPathConfigs((currentConfigs) =>
      currentConfigs.map((config) =>
        config.id === id ? { ...config, [field]: value } : config,
      ),
    );
  };

  const hasUnsetStartPoints = pathConfigs.some(config => !config.startPoint);

  const hiddenFileInput = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<String | null>(null)

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
    switch (data) {
      case 'SINREGRESSION':
        setInputs(['x']);
        setOutputs(1);
        break;
      case 'PENGUINS':
        setInputs(['bill_length_mm', 'bill_depth_mm', 'flipper_length_mm', 'body_mass_g']);
        setOutputs(3);
        break;
      case 'PURPLECOLOURS':
        setInputs(['R', 'G', 'B']);
        setOutputs(1);
        break;
      case 'CUSTOM':
        if (csvLoaded) {
          setInputs(datasetParameters);
          setOutputs(datasetOutputs);
        } else {
          setInputs([]);
          setOutputs(null);
        }
    }
    if (inputs && inputs.length < 2) {
      setMethod(methods[0].value);
    }
  }, [data, datasetParameters, datasetOutputs])

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

  const [logs, setLogs] = useState<string[]>([]);

useEffect(() => {
  if (isPlaying && currentFrame % 5 === 0) {
    const newLog = `[${new Date().toLocaleTimeString()}] Grad Norm: ${(Math.random() * 0.5 + 0.1).toFixed(2)}`;
    setLogs(prev => [newLog, ...prev].slice(0, 5)); // Keep last 5 logs
  }
}, [currentFrame, isPlaying]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LayoutManager>
        
        <DockPanel id="CONFIG" title="MODEL CONFIGURATION" isMaximized={false}>
          <ScrollView contentContainerStyle={styles.sidebarContent}>

            {Platform.OS === 'web' && (
              <input
                type="file"
                accept=".csv"
                ref={hiddenFileInput}
                onChange={handleWebFileChange}
                style={{ display: 'none' }}
              />
            )}
            
            {/* DATASET DROPDOWN */}
            <View style={styles.controlGroup}>
              <Text style={styles.label}>DATASET</Text>
              {data === 'CUSTOM' && (
                <Text style={styles.subLabel}>{csvLoaded && !loadingCsv ? fileName : ""}</Text>
              )}
              <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
                <View style={{ flex: 1 }}>
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <View style={[styles.dropdownTrigger, { borderColor: theme.colors.border }]}>
                        <Text style={styles.dropdownValue}>{dataSets.find(item => item.value === data)?.label || data}</Text>
                      </View>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {dataSets.map((item) => (
                        <DropdownMenuItem key={item.id} disabled={isLandscapeLoading || isPathLoading || isPathLoaded } onSelect={() => {setData(item.value)}}><Text>{item.label}</Text></DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </View>
                {data === 'CUSTOM' && (
                  <Button variant="outline" disabled={loadingCsv || isLandscapeLoading || isPathLoading || isPathLoaded }
                      onPress={handleUploadPress} size="sm" >
                      <Upload size={14} color={theme.colors.foreground} />
                  </Button>
                )}
              </View>
            </View>

            {/* ACTIVATION DROPDOWN */}
            <View style={styles.controlGroup}>
              <Text style={styles.label}>NETWORK CONFIGURATION</Text>
              <Text style={styles.subLabel}>Activation</Text>
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <View style={[styles.dropdownTrigger, { borderColor: theme.colors.border }]}>
                    <Text style={styles.dropdownValue}>{activations.find(item => item.value === activation)?.label || activation}</Text>
                  </View>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {activations.map((item) => (
                    <DropdownMenuItem key={item.id} disabled={isLandscapeLoading || isPathLoading || isPathLoaded } onSelect={() => {setActivation(item.value)}}><Text>{item.label}</Text></DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Text style={styles.subLabel}>Loss</Text>
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <View style={[styles.dropdownTrigger, { borderColor: theme.colors.border }]}>
                    <Text style={styles.dropdownValue}>{losses.find(item => item.value === loss)?.label || loss}</Text>
                  </View>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {losses.map((item) => (
                    <DropdownMenuItem key={item.id} disabled={isLandscapeLoading || isPathLoading || isPathLoaded } onSelect={() => {setLoss(item.value)}}><Text>{item.label}</Text></DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Text style={styles.subLabel}>Method</Text>
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <View style={[styles.dropdownTrigger, { borderColor: theme.colors.border }]}>
                    <Text style={styles.dropdownValue}>{methods.find(item => item.value === method)?.label || method}</Text>
                  </View>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {methods
                  .filter(item => item.value !== 'TWOPARAMETERS' || (inputs && inputs.length > 1))
                  .map((item) => (
                    <DropdownMenuItem 
                      key={item.id} 
                      disabled={isLandscapeLoading || isPathLoading || isPathLoaded }
                      onSelect={() => {
                        setMethod(item.value);
                        if (item.value === 'TWOPARAMETERS' && inputs && inputs.length > 1) {
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
              {method == 'TWOPARAMETERS' && inputs && inputs.length > 1 && (
              <View>
              <Text style={styles.subLabel}>Direction 1</Text>
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <View style={[styles.dropdownTrigger, { borderColor: theme.colors.border }]}>
                    <Text style={styles.dropdownValue}>{inputs[0]}</Text>
                  </View>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {inputs.map((item, index) => (
                    <DropdownMenuItem key={index} disabled={isLandscapeLoading || isPathLoading || isPathLoaded } onSelect={() => setDir1(index)}>
                      <Text>{item}</Text>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Text style={styles.subLabel}>Direction 2</Text>
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <View style={[styles.dropdownTrigger, { borderColor: theme.colors.border }]}>
                    <Text style={styles.dropdownValue}>{inputs[1]}</Text>
                  </View>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {inputs.map((item, index) => (
                    <DropdownMenuItem key={index} disabled={isLandscapeLoading || isPathLoading || isPathLoaded } onSelect={() => setDir2(index)}>
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
                  <NumberInput defaultValue={3} disabled={isLandscapeLoading || isPathLoading || isPathLoaded } value={depth} step={1} min={1} max={100} onChange={setDepth} />
                </View>
                {depth > 1 && (
                  <View style={{ flex: 1 }}>
                    <Text style={styles.subLabel}>Width</Text>
                    <NumberInput defaultValue={10} disabled={isLandscapeLoading || isPathLoading || isPathLoaded } value={width} min={1} max={100} onChange={setWidth} />
                  </View>
                )}
              </View>
            </View>

            <Button
              variant="secondary"
              disabled={isLandscapeLoading || isPathLoading || isPathLoaded || (data === "CUSTOM" && !csvLoaded)}
              onPress={() => {onGenerateLandscape()}}
            >
              Generate Landscape
            </Button>

            {/* PATH DETAILS CARD */}
            <View style={styles.controlGroup}>
              <Text style={styles.label}>PATH CONFIGURATIONS</Text>
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
                  isSceneLoading={isLandscapeLoading}
                  isLandscapeLoaded={isLandscapeLoaded}
                  isWatching={viewId === config.id}
                />
              ))}
            </View>
            
            {numPaths <= 4 && (
              <Button variant="outline" onPress={handlePathAddition} size="sm" style={{ flex: 1 }}>
                <Plus size={18} color={theme.colors.foreground} />
              </Button>
            )}

            <View style={styles.rowGap}>
              {numPaths > 0  && (
                <Button 
                  variant="secondary"
                  disabled={isLandscapeLoading || isPathLoading || !isLandscapeLoaded || hasUnsetStartPoints}
                  onPress={handleLoadAllPathsButtonClick}
                  style={styles.exportBtn}
                >
                  {isPathLoading ? 'Loading...' : 'Generate Paths'}
                </Button>
              )}

              {isPathLoaded && (
                <Button
                  onPress={() => {
                    handleClearPaths();
                    setPathConfigs([]);
                    setNumPaths(0);
                  }}
                  variant="destructive"
                  style={styles.exportBtn}
                >
                  Clear Paths
                </Button>
              )}
            </View>
            
            {/*
            <Button variant="secondary" style={styles.exportBtn}>Export Data</Button>
            */}
          </ScrollView>
        </DockPanel>

        {/* ENGINE AREA */}
        <DockPanel id="ENGINE" title="LOSS LANDSCAPE VISUALISATION" isMaximized={isMaximized}>
          <View style={styles.engineContainer}>
            <View style={styles.engineHeader}>
              {isLandscapeLoaded && !isLandscapeLoading && !isPathLoading && !isPathLoaded && (
                <Text style={styles.label}>LOG PLOT</Text>
              )}
              {isLandscapeLoaded && !isLandscapeLoading && !isPathLoaded && !isPathLoading && (
                <Switch checked={logPlot} onCheckedChange={handleLogPlotToggle}/>
              )}
              <TouchableOpacity onPress={() => setIsMaximized(!isMaximized)} style={{ zIndex: 10 }}>
                {isMaximized ? (
                  <Minimize2 size={18} color="white" />
                ) : (
                  <Maximize2 size={18} color="white" />
                )}
              </TouchableOpacity>
              <RotateCcw size={18} color="white" />
              <TouchableOpacity onPress={handleRefresh}>
                <RefreshCw size={18} color="white" />
              </TouchableOpacity>
            </View>
            
            {isLandscapeLoaded && !isLandscapeLoading && !isPathLoaded && !isPathLoading && (
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
                  style={{ zIndex: 20, width: 40, height: 40, justifyContent: 'center', alignItems: 'center' }} 
                >
                  <Palette size={18} color="white" />
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
                          colors={preset.colors}
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
                <LandscapeLoadingIcon isLandscapeLoading={isLandscapeLoading} />
              </View>
            )}

            {isPathLoading && (
              <View style={styles.hudOverlay}>
                <PathLoadingIcon numPathsLoading={numPaths} />
              </View>
            )}

            {/* Canvas Container */}
            <View ref={containerRef} style={{ flex: 1, minWidth: 0, backgroundColor: 'transparent' }} />

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
                    <SkipBack size={20} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.playBtn} onPress={togglePlayPause}>
                    {isPlaying ? (
                      <Pause size={16} color="white" fill="white" />
                    ) : (
                      <Play size={16} color="white" fill="white" />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleSkipForward}>
                    <SkipForward size={20} color="white" />
                  </TouchableOpacity>
                </View>
                <View style={{ flex: 1 }}>
                  <Progress value={progress} color={brandAccent} />
                </View>
                <Text style={styles.frameCounter}>{currentFrame}/{totalFrames}</Text>
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
            convergence={null}
            log={log}
          />
        }
      />


      </LayoutManager>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  sidebarContent: { padding: 16, gap: 24 },
  controlGroup: { gap: 8 },
  label: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5, opacity: 0.8 },
  subLabel: { fontSize: 9, fontWeight: '600', opacity: 0.5, marginBottom: 2 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowGap: { flexDirection: 'row', gap: 10 },
  dropdownTrigger: { 
    height: 36, 
    borderWidth: 1, 
    borderRadius: 8, 
    justifyContent: 'center', 
    paddingHorizontal: 12 
  },
  statsRow: {
    flexDirection: 'row',
    height: 180, // Matches the height of your DockPanel footer
    padding: 12,
    paddingTop: 6,
    gap: 0, 
  },
  dropdownValue: { fontSize: 12 },
  pathCard: { padding: 12, backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: 8, borderLeftWidth: 4, gap: 12 },
  pathTitle: { fontSize: 10, fontWeight: '900' },
  exportBtn: { marginTop: 10, padding: 5, flex: 1 },
  engineContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.1)', overflow: 'hidden', position: 'relative' },
  darkOverlay: { backgroundColor: 'rgba(0, 0, 0, 0.6)', zIndex: 5 },
  engineHeader: { position: 'absolute', top: 16, right: 16, flexDirection: 'row', gap: 16, zIndex: 10 },
  rightSidebar: { position: 'absolute', right: 0, top: '20%', bottom: '20%', zIndex: 10, alignItems: 'center', paddingRight: 16, gap: 10 },
  verticalSliderWrapper: { transform: [{ rotate: '-90deg' }], width: 100, justifyContent: 'center', alignItems: 'center' },
  bottomLeftPalette: { position: 'absolute', bottom: 16, left: 16, zIndex: 10, flexDirection: 'column-reverse', alignItems: 'center', minHeight: 42, gap: 12 },
  paletteRow: { flexDirection: 'column', gap: 8, backgroundColor: 'rgba(0,0,0,0.6)', padding: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  gradientSwatchContainer: { width: 20, height: 20, borderRadius: 6, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  gradientSwatch: { flex: 1, width: '100%', height: '100%' },
  hudOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 20 },
  hudTitle: { color: 'white', fontSize: 18, fontWeight: '800' },
  hudSubtitle: { color: 'white', opacity: 0.7, fontSize: 12, marginTop: 4 },
  playbackBar: { position: 'absolute', bottom: 20, left: 75, right: 75, height: 54, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 16 },
  playbackActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  playBtn: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: 'white', justifyContent: 'center', alignItems: 'center' },
  frameCounter: { color: 'white', fontSize: 10, fontWeight: 'bold', width: 45 }
});