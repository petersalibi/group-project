import React, { useState, useRef, useEffect } from "react";
import { Platform, View, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import Animated, { ZoomIn, ZoomOut } from 'react-native-reanimated';
import { 
  Play, SkipBack, SkipForward, Maximize2, 
  RotateCcw, RefreshCw, Eye, Network, Palette, Lock, Unlock, Trash2, 
  UnlockIcon
} from "lucide-react-native";
import { useTheme } from "../components/theme-provider";
import { Text } from "../components/text";
import { Switch } from "../components/switch";
import { Button } from "../components/button";
import { Tooltip } from "./tooltip";

import { 
    DropdownMenu, 
    DropdownMenuTrigger, 
    DropdownMenuContent, 
    DropdownMenuItem 
} from "../components/dropdown-menu";

import { optimisers, lrs } from '../constants/constants';

// Define the shape of a single path's configuration
export interface PathConfigInterface {
    id: number;
    colorName: string;
    colorValue: string;
    optim: string;
    lr: number;
    locked: boolean;
    startPoint: [number, number] | null;
    isPathLoaded: boolean;
    regen: boolean;
}

interface PathConfigProps {
    config: PathConfigInterface;
    onConfigChange: (id: number, field: keyof PathConfigInterface, value: any) => void;
    onPathRemoval: (id: number) => void;
    onPlaceStartPoint: (id: number) => void;
    networkViewable: boolean;
    onViewPath: (id: number) => void;
    isPlacing: boolean;
    isSceneLoading: boolean;
    isLandscapeLoaded: boolean;
    isWatching: boolean;
    onPCAButtonPress: (id: number) => void;
}

export function PathConfig(props: PathConfigProps) {
    const {
        config,
        onConfigChange,
        onPlaceStartPoint,
        onPathRemoval,
        networkViewable,
        onViewPath,
        isPlacing,
        isSceneLoading,
        isLandscapeLoaded,
        isWatching,
        onPCAButtonPress,
    } = props;

    const { theme, isDark } = useTheme();

    const { id, colorName, colorValue, optim, lr, locked, startPoint, isPathLoaded, regen } = config;

    return (
        <View style={[styles.pathCard, { borderLeftColor: colorValue }]}>
            <View style={styles.rowBetween}>
                <Text style={[styles.pathTitle, { color: colorValue }]}>PATH {id + 1}</Text>
                <View style={styles.actionGroup}>
                    <Tooltip 
                        tip={locked 
                            ? "Locking forces the optimiser to only update weights within the visible 2D plane." 
                            : "Unlocking allows the optimiser to move freely in the true high-dimensional space. WARNING: may lead to poor trajectories"
                        }
                    >
                        <Button variant="link" disabled={regen} onPress={() => onConfigChange(id, 'locked', !locked)} size="ssm">
                            {locked ? (
                                <Lock size={14} color={theme.colors.foreground} />
                            ) : (
                                <Unlock size={14} color={theme.colors.mutedForeground} />
                            )}
                        </Button>
                    </Tooltip>
                    <Button variant="ghost" onPress={() => onPathRemoval(id)} size="ssm">
                        <Trash2 size={14} color={theme.colors.foreground} />
                    </Button>
                </View>
            </View>
                
            <View style={styles.rowGap}>
                <View style={{ flex: 1.5 }}>
                    <Tooltip tip="The algorithm used to update the network's weights. 
                                Different optimisers navigate the landscape in unique ways.">
                        <Text style={styles.subLabel}>Optimiser</Text>
                    </Tooltip>
                    <DropdownMenu>
                        <DropdownMenuTrigger>
                            <View style={[styles.dropdownTrigger, { height: 32, borderColor: theme.colors.border }]}>
                                <Text style={{ fontSize: 11 }}>{optimisers.find(item => item.value === config.optim)?.label || config.optim}</Text>
                            </View>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            {optimisers.map((item) => (
                                <DropdownMenuItem key={item.id} disabled={regen} onSelect={() => {onConfigChange(id, 'optim', String(item.value))}}><Text>{item.label}</Text></DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </View>
                <View style={{ flex: 1 }}>
                    <Tooltip tip="The step size the optimiser takes at each iteration.">
                        <Text style={styles.subLabel}>Learning Rate</Text>
                    </Tooltip>
                    <DropdownMenu>
                        <DropdownMenuTrigger>
                            <View style={[styles.dropdownTrigger, { height: 32, borderColor: theme.colors.border }]}>
                                <Text style={{ fontSize: 11 }}>{lrs.find(item => item.value === config.lr)?.label || config.lr}</Text>
                            </View>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            {lrs.map((item) => (
                                <DropdownMenuItem key={item.id} disabled={regen} onSelect={() => {onConfigChange(id, 'lr', Number(item.value))}}><Text>{item.label}</Text></DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </View>
            </View>

            <View style={styles.rowGap}>
                {startPoint != null && !isPlacing ? (
                    <View style={{ flex: 4, flexDirection: 'column', justifyContent: 'center' }}>
                        <Text style={styles.label}>Start Point</Text>
                        <Text style={styles.label}>[{startPoint[0].toFixed(2)}, {startPoint[1].toFixed(2)}]</Text>
                    </View>
                ) : (
                    <Tooltip tip="Click anywhere on the loss landscape to manually set the starting position for this optimiser's journey.">
                        <Button 
                            variant="primary" 
                            size="sm"
                            onPress={() => onPlaceStartPoint(id)}
                            disabled={isSceneLoading || !isLandscapeLoaded}
                            style={{ flex: 4 }}
                        >
                            {isPlacing ? 'Cancel' : 'Place Start'}
                        </Button>
                    </Tooltip>
                )}
                <Tooltip tip="Watch the network weights, current loss, and fidelity metric evolve on this specific path as it animates.">
                    <Button variant="outline" onPress={() => onViewPath(id)} disabled={isSceneLoading || !isLandscapeLoaded || isWatching} size="sm" style={{ flex: 1 }}><Eye size={14} color={theme.colors.foreground} /></Button>
                </Tooltip>
                {isPathLoaded && (
                    <Tooltip tip="Regenerate the entire landscape using Principal Component Analysis on this path.">
                        <Button variant="outline" disabled={regen} onPress={() => onPCAButtonPress(id)} size="sm" style={{ flex: 1 }}><Text size={14} color={theme.colors.foreground}>PCA</Text></Button>
                    </Tooltip>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
  sidebarContent: { padding: 16, gap: 24 },
  controlGroup: { gap: 8 },
  label: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5, opacity: 0.8 },
  subLabel: { fontSize: 9, fontWeight: '600', opacity: 0.5, marginBottom: 2 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowGap: { flexDirection: 'row', gap: 10 },
  actionGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
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
  bottomLeftPalette: { position: 'absolute', bottom: 8, left: 16, flexDirection: 'row', alignItems: 'center', minHeight: 42, gap: 12, zIndex: 10 },
  paletteRow: { flexDirection: 'row', gap: 8, backgroundColor: 'rgba(0,0,0,0.6)', padding: 6, paddingLeft: 12, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  gradientSwatchContainer: { width: 28, height: 28, borderRadius: 6, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  gradientSwatch: { flex: 1, width: '100%', height: '100%' },
  hudOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 20 },
  hudTitle: { color: 'white', fontSize: 18, fontWeight: '800' },
  hudSubtitle: { color: 'white', opacity: 0.7, fontSize: 12, marginTop: 4 },
  playbackBar: { position: 'absolute', bottom: 20, left: 20, right: 20, height: 54, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 16 },
  playbackActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  playBtn: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: 'white', justifyContent: 'center', alignItems: 'center' },
  frameCounter: { color: 'white', fontSize: 10, fontWeight: 'bold', width: 45 }
});