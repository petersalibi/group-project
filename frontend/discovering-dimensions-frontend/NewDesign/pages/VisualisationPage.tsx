import React, { useState, useRef, useEffect } from "react";
import { Platform, View, ScrollView, StyleSheet } from "react-native";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { 
  Play, SkipBack, SkipForward, Maximize2, 
  RotateCcw, RefreshCw, Eye, Network, Palette 
} from "lucide-react-native";

import { useTheme } from "../components/theme-provider";
import { LayoutManager } from "../components/docking-provider";
import { DockPanel } from "../components/dock-panel";
import { StatsGroupPanel } from "../components/stats-group-panel";
import { Text } from "../components/text";
import { VerticalSlider } from "../components/vertical-slider";
import { Switch } from "../components/switch";
import { NumberInput } from "../components/number-input";
import { Button } from "../components/button";
import { Progress } from "../components/progress";
import { LandscapeLoadingIcon } from "../components/icons/icons";

import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem 
} from "../components/dropdown-menu";

import { dataSets, activations, methods, allLosses, regLosses, ceLoss, bceLoss } from '../constants/constants';

import { useLossLandscape } from "../hooks/loss-landscape";

export function VisualisationPage() {
  const { theme, isDark } = useTheme();
  const brandAccent = isDark ? '#C6F382' : '#353F91';
  
  const [activation, setActivation] = useState<string>('ReLU');
  const [depth, setDepth] = useState<number>(2);
  const [width, setWidth] = useState<number>(10);
  const [method, setMethod] = useState<string>('RANDOMDIRS');
  const [data, setData] = useState<string>('SINREGRESSION');
  const [loss, setLoss] = useState<string>('MSELoss');
  const [losses, setLosses] = useState(regLosses);
  const [logPlot, setLogPlot] = useState(true);
  const [zValue, setZValue] = useState(1);
  const [optimizer, setOptimizer] = useState("SGD");

  const { 
    isLandscapeLoading,
    isLandscapeLoaded,
    onGenerateLandscape,
    onUploadCsv,
    loadingCsv,
    csvLoaded,
    datasetInputs,
    setDatasetInputs,
    datasetOutputs,
    setDatasetOutputs,
    containerRef,
  } = useLossLandscape({
    activation,
    depth,
    width,
    method,
    data,
    loss,
  });

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

  // Adjust inputs/outputs when dataset changes
  useEffect(() => {
    switch (data) {
      case 'SINREGRESSION':
        setDatasetInputs(1);
        setDatasetOutputs(1);
        break;
      case 'PENGUINS':
        setDatasetInputs(4);
        setDatasetOutputs(3);
        break;
      case 'PURPLECOLOURS':
        setDatasetInputs(3);
        setDatasetOutputs(1);
        break;
    }
  }, [data])

  // Adjust losses when dataset changes
  useEffect(() => {
    let newLosses = regLosses;

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
        newLosses = datasetOutputs > 1 ? ceLoss : regLosses;
        break;
    }

    setLosses(newLosses);
    setLoss(newLosses[0].value);

  }, [data, datasetOutputs]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LayoutManager>
        
        <DockPanel id="CONFIG" title="MODEL CONFIGURATION">
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
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <View style={[styles.dropdownTrigger, { borderColor: theme.colors.border }]}>
                    <Text style={styles.dropdownValue}>{dataSets[0].label}</Text>
                  </View>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {dataSets.map((item) => (
                    <DropdownMenuItem key={item.id} onSelect={() => {setData(item.value)}}><Text>{item.label}</Text></DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </View>
            {data === 'CUSTOM' && (
              <View style={styles.controlGroup}>
                <Button 
                  disabled={loadingCsv}
                  onPress={handleUploadPress}
                >
                  {loadingCsv 
                    ? "Uploading..." 
                    : csvLoaded 
                      ? "Change File" 
                      : "Select File"
                  }
                </Button>
              </View>
            )}

            {/* ACTIVATION DROPDOWN */}
            <View style={styles.controlGroup}>
              <Text style={styles.label}>NETWORK CONFIGURATION</Text>
              <Text style={styles.subLabel}>Activation</Text>
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <View style={[styles.dropdownTrigger, { borderColor: theme.colors.border }]}>
                    <Text style={styles.dropdownValue}>{activations[0].label}</Text>
                  </View>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {activations.map((item) => (
                    <DropdownMenuItem key={item.id} onSelect={() => {setActivation(item.value)}}><Text>{item.label}</Text></DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Text style={styles.subLabel}>Loss</Text>
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <View style={[styles.dropdownTrigger, { borderColor: theme.colors.border }]}>
                    <Text style={styles.dropdownValue}>{losses[0].label}</Text>
                  </View>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {losses.map((item) => (
                    <DropdownMenuItem key={item.id} onSelect={() => {setLoss(item.value)}}><Text>{item.label}</Text></DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Text style={styles.subLabel}>Method</Text>
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <View style={[styles.dropdownTrigger, { borderColor: theme.colors.border }]}>
                    <Text style={styles.dropdownValue}>{methods[0].label}</Text>
                  </View>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {methods.map((item) => (
                    <DropdownMenuItem key={item.id} onSelect={() => {setMethod(item.value)}}><Text>{item.label}</Text></DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </View>

            {/*
            <View style={styles.controlGroup}>
              <View style={styles.rowBetween}>
                <Text style={styles.label}>MESH DEPTH</Text>
                <Text style={[styles.label, { color: brandAccent }]}>{depth}</Text>
              </View>
              <Slider 
                value={depth} 
                onValueChange={setDepth} 
                minimumValue={10} 
                maximumValue={100} 
              />
            </View>
            */}

            {/* ARCHITECTURE WITH STACKED NUMBER INPUTS */}
            <View style={styles.controlGroup}>
              <Text style={styles.label}>ARCHITECTURE</Text>
              <View style={styles.rowGap}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.subLabel}>Depth</Text>
                  <NumberInput defaultValue={3} value={depth} step={1} min={1} max={100} onChange={setDepth} />
                </View>
                {depth > 1 && (
                  <View style={{ flex: 1 }}>
                    <Text style={styles.subLabel}>Width</Text>
                    <NumberInput defaultValue={10} value={width} min={1} max={100} onChange={setWidth} />
                  </View>
                )}
              </View>
            </View>

            <Button
              variant="secondary"
              disabled={isLandscapeLoading}
              onPress={() => {onGenerateLandscape()}}
              style={styles.exportBtn}>
              Generate Landscape
            </Button>

            {/* PATH DETAILS CARD */}
            <View style={styles.controlGroup}>
              <Text style={styles.label}>PATH DETAILS</Text>
              <View style={[styles.pathCard, { borderLeftColor: '#E15A5A' }]}>
                <View style={styles.rowBetween}>
                  <Text style={[styles.pathTitle, { color: '#E15A5A' }]}>PATH 1</Text>
                  <Eye size={14} color={theme.colors.mutedForeground} />
                </View>
                
                <View style={styles.rowGap}>
                   <View style={{ flex: 1.5 }}>
                     <Text style={styles.subLabel}>Optimiser</Text>
                     <DropdownMenu>
                        <DropdownMenuTrigger>
                          <View style={[styles.dropdownTrigger, { height: 32, borderColor: theme.colors.border }]}>
                            <Text style={{ fontSize: 11 }}>{optimizer}</Text>
                          </View>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onSelect={() => setOptimizer("SGD")}><Text>SGD</Text></DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => setOptimizer("Adam")}><Text>Adam</Text></DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                   </View>
                   <View style={{ flex: 1 }}>
                     <Text style={styles.subLabel}>LR</Text>
                     <NumberInput defaultValue={0.01} step={0.001} />
                   </View>
                </View>

                <View style={styles.rowGap}>
                  <Button variant="primary" size="sm" style={{ flex: 4 }}>Place Start</Button>
                  <Button variant="outline" size="sm" style={{ flex: 1 }}><Network size={14} color={theme.colors.foreground} /></Button>
                  <Button variant="outline" size="sm" style={{ flex: 1 }}><Palette size={14} color={theme.colors.foreground}/></Button>
                </View>
              </View>
            </View>

            <Button variant="secondary" style={styles.exportBtn}>Export Data</Button>
          </ScrollView>
        </DockPanel>

        {/* ENGINE AREA */}
        <DockPanel id="ENGINE" title="LOSS LANDSCAPE VISUALISATION">
          <View style={styles.engineContainer}>
            <View style={styles.engineHeader}>
              {isLandscapeLoaded && !isLandscapeLoading && (
                <Text style={styles.label}>LOG PLOT</Text>
              ) && (
                <Switch checked={logPlot} onCheckedChange={setLogPlot}/>
              )}
              <Maximize2 size={18} color="white" />
              <RotateCcw size={18} color="white" />
              <RefreshCw size={18} color="white" />
            </View>
            
            {isLandscapeLoaded && !isLandscapeLoading && (
              <View style={styles.rightSidebar}>
                <Text style={styles.label}>Z SCALE</Text>
                <View style={{ marginTop: 16, height: '25%' }}> 
                  <VerticalSlider 
                    value={zValue} 
                    onValueChange={setZValue} 
                    min={0.001} 
                    max={5} 
                    step={0.01} 
                    height={parent.innerHeight * 0.25}
                  />
                </View>
              </View>
            )}
            
            {isLandscapeLoading && (
              <View style={styles.hudOverlay}>
                <LandscapeLoadingIcon isLoading={isLandscapeLoading} />
              </View>
            )}

            {/* Canvas Container */}
            <View ref={containerRef} style={{ flex: 1, minWidth: 0, backgroundColor: 'transparent' }} />
            
            {/*
            <View style={styles.playbackBar}>
              <View style={styles.playbackActions}>
                <SkipBack size={20} color="white" />
                <View style={styles.playBtn}><Play size={16} color="white" fill="white" /></View>
                <SkipForward size={20} color="white" />
              </View>
              <View style={{ flex: 1 }}>
                <Progress value={42} color={brandAccent} />
              </View>
              <Text style={styles.frameCounter}>51/120</Text>
            </View>
            */}
          </View>
        </DockPanel>

        <StatsGroupPanel />

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
  dropdownValue: { fontSize: 12 },
  pathCard: { padding: 12, backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: 8, borderLeftWidth: 4, gap: 12 },
  pathTitle: { fontSize: 10, fontWeight: '900' },
  exportBtn: { marginTop: 10 },
  engineContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.1)', overflow: 'hidden', position: 'relative' },
  engineHeader: { position: 'absolute', top: 16, right: 16, flexDirection: 'row', gap: 16, zIndex: 10 },
  rightSidebar: { position: 'absolute', right: 0, top: '20%', bottom: '20%', zIndex: 10, alignItems: 'center', paddingRight: 16, gap: 10 },
  verticalSliderWrapper: { transform: [{ rotate: '-90deg' }], width: 100, justifyContent: 'center', alignItems: 'center' },
  hudOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 20 },
  hudTitle: { color: 'white', fontSize: 18, fontWeight: '800' },
  hudSubtitle: { color: 'white', opacity: 0.7, fontSize: 12, marginTop: 4 },
  playbackBar: { position: 'absolute', bottom: 20, left: 20, right: 20, height: 54, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 16 },
  playbackActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  playBtn: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: 'white', justifyContent: 'center', alignItems: 'center' },
  frameCounter: { color: 'white', fontSize: 10, fontWeight: 'bold', width: 45 }
});