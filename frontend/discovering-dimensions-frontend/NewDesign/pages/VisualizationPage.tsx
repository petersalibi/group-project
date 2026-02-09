import React, { useState } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
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
import { Slider } from "../components/slider";
import { NumberInput } from "../components/number-input";
import { Button } from "../components/button";
import { Progress } from "../components/progress";
// Import your new Dropdown components
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem 
} from "../components/dropdown-menu";

export function VisualizationPage() {
  const { theme, isDark } = useTheme();
  const brandAccent = isDark ? '#C6F382' : '#353F91';
  
  const [meshDepth, setMeshDepth] = useState(50);
  const [activation, setActivation] = useState("ReLU");
  const [optimizer, setOptimizer] = useState("SGD");

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LayoutManager>
        
        <DockPanel id="CONFIG" title="MODEL CONFIGURATION">
          <ScrollView contentContainerStyle={styles.sidebarContent}>
            
            {/* DATASET DROPDOWN */}
            <View style={styles.controlGroup}>
              <Text style={styles.label}>DATASET</Text>
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <View style={[styles.dropdownTrigger, { borderColor: theme.colors.border }]}>
                    <Text style={styles.dropdownValue}>MNIST</Text>
                  </View>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onSelect={() => {}}><Text>MNIST</Text></DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => {}}><Text>CIFAR-10</Text></DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </View>

            {/* ACTIVATION DROPDOWN */}
            <View style={styles.controlGroup}>
              <Text style={styles.label}>NETWORK CONFIGURATION</Text>
              <Text style={styles.subLabel}>Activation</Text>
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <View style={[styles.dropdownTrigger, { borderColor: theme.colors.border }]}>
                    <Text style={styles.dropdownValue}>{activation}</Text>
                  </View>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {['ReLU', 'Sigmoid', 'Tanh'].map((opt) => (
                    <DropdownMenuItem key={opt} onSelect={() => setActivation(opt)}>
                      <Text>{opt}</Text>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </View>

            {/* MESH DEPTH SLIDER */}
            <View style={styles.controlGroup}>
              <View style={styles.rowBetween}>
                <Text style={styles.label}>MESH DEPTH</Text>
                <Text style={[styles.label, { color: brandAccent }]}>{meshDepth}</Text>
              </View>
              <Slider 
                value={meshDepth} 
                onValueChange={setMeshDepth} 
                minimumValue={10} 
                maximumValue={100} 
              />
            </View>

            {/* ARCHITECTURE WITH STACKED NUMBER INPUTS */}
            <View style={styles.controlGroup}>
              <Text style={styles.label}>ARCHITECTURE</Text>
              <View style={styles.rowGap}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.subLabel}>Depth</Text>
                  <NumberInput defaultValue={3} min={1} max={10} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.subLabel}>Width</Text>
                  <NumberInput defaultValue={10} min={1} max={128} />
                </View>
              </View>
            </View>

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
        <DockPanel id="ENGINE" title="LOSS LANDSCAPE VISUALIZATION">
          <View style={styles.engineContainer}>
            <View style={styles.engineHeader}>
              <Maximize2 size={18} color="white" />
              <RotateCcw size={18} color="white" />
              <RefreshCw size={18} color="white" />
            </View>

            <View style={styles.hudOverlay}>
               <Text style={styles.hudTitle}>3D Loss Landscape Visualization</Text>
               <Text style={styles.hudSubtitle}>Interactive 3D surface rendering</Text>
            </View>

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
  engineContainer: { flex: 1, backgroundColor: '#5B62B3', overflow: 'hidden' },
  engineHeader: { position: 'absolute', top: 16, right: 16, flexDirection: 'row', gap: 16, zIndex: 10 },
  hudOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hudTitle: { color: 'white', fontSize: 18, fontWeight: '800' },
  hudSubtitle: { color: 'white', opacity: 0.7, fontSize: 12, marginTop: 4 },
  playbackBar: { position: 'absolute', bottom: 20, left: 20, right: 20, height: 54, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 16 },
  playbackActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  playBtn: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: 'white', justifyContent: 'center', alignItems: 'center' },
  frameCounter: { color: 'white', fontSize: 10, fontWeight: 'bold', width: 45 }
});