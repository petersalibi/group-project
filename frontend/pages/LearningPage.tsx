import React, { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet, TouchableOpacity, LayoutChangeEvent } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat, Easing } from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Maximize2, Minimize2, RotateCcw, RefreshCw } from "lucide-react-native";

import { useTheme } from "../components/theme-provider";
import { useLoading } from "../components/loading-provider";
import { LayoutManager } from "../components/docking-provider";
import { DockPanel } from "../components/dock-panel";
import { Text } from "../components/text";
import { VerticalSlider } from "../components/vertical-slider";
import { NumberInput } from "../components/number-input";
import { Button } from "../components/button";
import { Tooltip } from '../components/tooltip';
import { LandscapeLoadingIcon } from "../components/icons/icons";

import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem 
} from "../components/dropdown-menu";

import { dataSets, activations, methods, regLosses, ceLoss, bceLoss } from '../constants/constants';
import { useLossLandscape } from "../hooks/loss-landscape";

export function LearningPage() {
  const { theme, isDark } = useTheme();
  const { setIsLoading } = useLoading();
  const brandAccent = isDark ? '#C6F382' : '#353F91';
  
  // Basic Configuration State
  const [data, setData] = useState<string>('SINREGRESSION');
  const [activation, setActivation] = useState<string>('Tanh');
  const [loss, setLoss] = useState<string>('MSELoss');
  const [method, setMethod] = useState<string>('RANDOMDIRS');
  const [depth, setDepth] = useState<number>(2);
  const [width, setWidth] = useState<number>(10);
  
  const [dir1, setDir1] = useState<number | null>(null);
  const [dir2, setDir2] = useState<number | null>(null);
  const [inputs, setInputs] = useState(['x']);
  const [losses, setLosses] = useState(regLosses);
  const [isMaximized, setIsMaximized] = useState(false);
  const [localDims, setLocalDims] = useState({ width: 0, height: 0 });

  const { 
    isLandscapeLoading,
    isLandscapeLoaded,
    onGenerateLandscape,
    zValue,
    handleZChange,
    isRotating,
    handleRotate,
    handleRefresh,
    containerRef,
  } = useLossLandscape({
    activation,
    depth,
    width,
    method,
    dir1,
    dir2,
    data,
    loss,
    pathConfigs: [],
    onPathConfigChange: () => {},
    setLog: () => {}, 
  });

  // Handle global loading state
  useEffect(() => {
    setIsLoading(isLandscapeLoading);
    return () => setIsLoading(false);
  }, [isLandscapeLoading, setIsLoading]);

  // Adjust inputs when dataset changes
  useEffect(() => {
    switch (data) {
      case 'SINREGRESSION': setInputs(['x']); break;
      case 'PENGUINS': setInputs(['bill_length_mm', 'bill_depth_mm', 'flipper_length_mm', 'body_mass_g']); break;
      case 'PURPLECOLOURS': setInputs(['R', 'G', 'B']); break;
    }
    if (inputs && inputs.length < 2) {
      setMethod(methods[0].value);
    }
  }, [data]);

  // Adjust losses when dataset changes
  useEffect(() => {
    let newLosses = regLosses;
    switch (data) {
      case 'SINREGRESSION': newLosses = regLosses; setMethod('RANDOMDIRS'); break;
      case 'PENGUINS': newLosses = ceLoss; break;
      case 'PURPLECOLOURS': newLosses = bceLoss; break;
    }
    setLosses(newLosses);
    setLoss(newLosses[0].value);
  }, [data]);

  // Animations for Icons
  const rotateAnim = useSharedValue(0);
  const refreshAnim = useSharedValue(0);

  useEffect(() => {
    if (isRotating) {
      rotateAnim.value = 0; 
      rotateAnim.value = withRepeat(
        withTiming(-360, { duration: 2000, easing: Easing.linear }), -1, false
      );
    } else {
      rotateAnim.value = 0;
    }
  }, [isRotating, rotateAnim]);

  const rotateStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotateAnim.value}deg` }] }));
  const refreshStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${refreshAnim.value}deg` }] }));

  const onRefreshPress = () => {
    if (!isLandscapeLoaded) return;
    handleRefresh();
    refreshAnim.value = withTiming(refreshAnim.value + 360, { duration: 600, easing: Easing.out(Easing.cubic) });
  };

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setLocalDims({ width, height });
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={handleLayout}>
    {localDims.width > 0 && localDims.height > 0 && (
        <LayoutManager 
            width={localDims.width} 
            height={localDims.height}
            initialRegistry={{
            'CONFIG': 'LEFT', 
            'ENGINE': 'TOP_MAIN'
          }}
        >
        
        {/* CONFIGURATION SIDEBAR */}
        <DockPanel id="CONFIG" title="LANDSCAPE CONFIGURATION" isMaximized={false}>
          <ScrollView contentContainerStyle={styles.sidebarContent}>
            
            {/* DATASET DROPDOWN */}
            <View style={styles.controlGroup}>
              <Text style={styles.label}>DATASET</Text>
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <View style={[styles.dropdownTrigger, { borderColor: theme.colors.border }]}>
                    <Text style={styles.dropdownValue}>{dataSets.find(item => item.value === data)?.label || data}</Text>
                  </View>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {dataSets.filter(item => item.value !== 'CUSTOM').map((item) => (
                    <DropdownMenuItem key={item.id} disabled={isLandscapeLoading} onSelect={() => setData(item.value)}>
                      <Text>{item.label}</Text>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </View>

            {/* NETWORK CONFIGURATION */}
            <View style={styles.controlGroup}>
              <Text style={styles.label}>NETWORK SETTINGS</Text>
              
              <Text style={styles.subLabel}>Activation Function</Text>
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <View style={[styles.dropdownTrigger, { borderColor: theme.colors.border }]}>
                    <Text style={styles.dropdownValue}>{activations.find(item => item.value === activation)?.label || activation}</Text>
                  </View>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {activations.map((item) => (
                    <DropdownMenuItem key={item.id} disabled={isLandscapeLoading} onSelect={() => setActivation(item.value)}>
                      <Text>{item.label}</Text>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Text style={styles.subLabel}>Loss Function</Text>
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <View style={[styles.dropdownTrigger, { borderColor: theme.colors.border }]}>
                    <Text style={styles.dropdownValue}>{losses.find(item => item.value === loss)?.label || loss}</Text>
                  </View>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {losses.map((item) => (
                    <DropdownMenuItem key={item.id} disabled={isLandscapeLoading} onSelect={() => setLoss(item.value)}>
                      <Text>{item.label}</Text>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Text style={styles.subLabel}>Visualisation Method</Text>
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <View style={[styles.dropdownTrigger, { borderColor: theme.colors.border }]}>
                    <Text style={styles.dropdownValue}>{methods.find(item => item.value === method)?.label || method}</Text>
                  </View>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {methods.filter(item => item.value !== 'TWOPARAMETERS' || (inputs && inputs.length > 1)).map((item) => (
                    <DropdownMenuItem key={item.id} disabled={isLandscapeLoading} onSelect={() => setMethod(item.value)}>
                      <Text>{item.label}</Text>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </View>

            {/* ARCHITECTURE */}
            <View style={styles.controlGroup}>
              <Text style={styles.label}>ARCHITECTURE</Text>
              <View style={styles.rowGap}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.subLabel}>Depth</Text>
                  <NumberInput defaultValue={3} disabled={isLandscapeLoading} value={depth} step={1} min={1} max={10} onChange={setDepth} />
                </View>
                {depth > 1 && (
                  <View style={{ flex: 1 }}>
                    <Text style={styles.subLabel}>Width</Text>
                    <NumberInput defaultValue={10} disabled={isLandscapeLoading} value={width} min={1} max={100} onChange={setWidth} />
                  </View>
                )}
              </View>
            </View>

            <Button variant="secondary" disabled={isLandscapeLoading} onPress={() => onGenerateLandscape()}>
              {isLandscapeLoading ? "Loading..." : "Generate Landscape"}
            </Button>
          </ScrollView>
        </DockPanel>

        {/* 3D ENGINE AREA */}
        <DockPanel id="ENGINE" title="LOSS LANDSCAPE VISUALISATION" isMaximized={isMaximized}>
          <View style={styles.engineContainer}>
            <View style={styles.engineHeader}>
              <TouchableOpacity 
                disabled={!isLandscapeLoaded}
                onPress={() => setIsMaximized(!isMaximized)} 
                style={{ zIndex: 10, opacity: isLandscapeLoaded ? 1 : 0.4 }}
              >
                {isMaximized ? <Minimize2 size={18} color="white" /> : <Maximize2 size={18} color="white" />}
              </TouchableOpacity>

              <TouchableOpacity 
                disabled={!isLandscapeLoaded}
                onPress={handleRotate}
                style={{ opacity: isLandscapeLoaded ? 1 : 0.4 }}
              >
                <Animated.View style={rotateStyle}>
                  <RotateCcw size={18} color={isRotating ? brandAccent : "white"} />
                </Animated.View>
              </TouchableOpacity>

              <TouchableOpacity 
                disabled={!isLandscapeLoaded}
                onPress={onRefreshPress}
                style={{ opacity: isLandscapeLoaded ? 1 : 0.4 }}
              >
                <Animated.View style={refreshStyle}>
                  <RefreshCw size={18} color="white" />
                </Animated.View>
              </TouchableOpacity>
            </View>
            
            {isLandscapeLoaded && !isLandscapeLoading && (
              <View style={styles.rightSidebar}>
                <Tooltip tip="Adjusts the visual height of the 3D landscape.">
                  <Text style={styles.label}>Z SCALE</Text>
                </Tooltip>
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
            
            {isLandscapeLoading && (
              <View style={styles.hudOverlay}>
                <LandscapeLoadingIcon isLandscapeLoading={isLandscapeLoading} />
              </View>
            )}

            {/* 3D WebGL Canvas Container */}
            <View ref={containerRef} style={{ flex: 1, minWidth: 0, backgroundColor: 'transparent' }} />
          </View>
        </DockPanel>

      </LayoutManager>
    )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  sidebarContent: { padding: 16, gap: 24 },
  controlGroup: { gap: 8 },
  label: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5, opacity: 0.8 },
  subLabel: { fontSize: 9, fontWeight: '600', opacity: 0.5, marginBottom: 2 },
  rowGap: { flexDirection: 'row', gap: 10 },
  dropdownTrigger: { 
    height: 36, 
    borderWidth: 1, 
    borderRadius: 8, 
    justifyContent: 'center', 
    paddingHorizontal: 12 
  },
  dropdownValue: { fontSize: 12 },
  engineContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.1)', overflow: 'hidden', position: 'relative' },
  engineHeader: { position: 'absolute', top: 16, right: 16, flexDirection: 'row', gap: 16, zIndex: 10 },
  rightSidebar: { position: 'absolute', right: 0, top: '20%', bottom: '20%', zIndex: 10, alignItems: 'center', paddingRight: 16, gap: 10 },
  hudOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 20 },
});