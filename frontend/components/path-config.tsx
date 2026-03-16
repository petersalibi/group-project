import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Eye, Lock, Unlock, Trash2 } from 'lucide-react-native';
import { useTheme } from '../components/theme-provider';
import { Text } from '../components/text';
import { Button } from '../components/button';

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../components/dropdown-menu';

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
  onConfigChange: (
    id: number,
    field: keyof PathConfigInterface,
    value: any,
  ) => void;
  onPathRemoval: (id: number) => void;
  onPlaceStartPoint: (id: number) => void;
  networkViewable: boolean;
  onViewPath: (id: number) => void;
  isPlacing: boolean;
  isSceneLoading: boolean;
  isLandscapeLoaded: boolean;
  isWatching: boolean;
  onRegenPathPress: (id: number, method: 'pca' | 'autoencoder') => void;
}

export function PathConfig(props: PathConfigProps) {
  const {
    config,
    onConfigChange,
    onPlaceStartPoint,
    onPathRemoval,
    onViewPath,
    isPlacing,
    isSceneLoading,
    isLandscapeLoaded,
    isWatching,
    onRegenPathPress,
  } = props;

  const { theme } = useTheme();

  const { id, colorValue, optim, lr, locked, startPoint, isPathLoaded, regen } =
    config;

  return (
    <View
      style={[
        styles.pathCard,
        {
          borderLeftColor: colorValue,
          backgroundColor: theme.colors.background,
          borderColor: theme.colors.border,
        },
      ]}
    >
      {/* 1. HEADER ROW */}
      <View style={styles.headerRow}>
        <Text style={[styles.pathTitle, { color: colorValue }]}>
          PATH {id + 1}
        </Text>
        <View style={styles.actionGroup}>
          <Button
            variant='ghost'
            disabled={regen || isSceneLoading}
            onPress={() => onConfigChange(id, 'locked', !locked)}
            size='icon'
            style={styles.iconBtn}
          >
            {locked ? (
              <Lock size={14} color={theme.colors.foreground} />
            ) : (
              <Unlock size={14} color={theme.colors.mutedForeground} />
            )}
          </Button>
          <Button
            variant='ghost'
            onPress={() => onPathRemoval(id)}
            size='icon'
            style={[styles.iconBtn]}
            disabled={isSceneLoading}
            customBg='rgba(239, 68, 68, 0.1)'
          >
            <Trash2 size={14} color='#ef4444' />
          </Button>
        </View>
      </View>

      <View
        style={[styles.divider, { backgroundColor: theme.colors.border }]}
      />

      {/* 2. PARAMETERS ROW */}
      <View style={styles.paramsRow}>
        <View style={styles.paramItem}>
          <Text style={styles.subLabel}>Optimiser</Text>
          <DropdownMenu>
            <DropdownMenuTrigger>
              <View
                style={[
                  styles.dropdownTrigger,
                  {
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.background,
                  },
                ]}
              >
                <Text style={{ fontSize: 11, color: theme.colors.foreground }}>
                  {optimisers.find((item) => item.value === config.optim)
                    ?.label || config.optim}
                </Text>
              </View>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {optimisers.map((item) => (
                <DropdownMenuItem
                  key={item.id}
                  disabled={regen || isSceneLoading}
                  onSelect={() =>
                    onConfigChange(id, 'optim', String(item.value))
                  }
                >
                  <Text>{item.label}</Text>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </View>

        <View style={styles.paramItem}>
          <Text style={styles.subLabel}>Learning Rate</Text>
          <DropdownMenu>
            <DropdownMenuTrigger>
              <View
                style={[
                  styles.dropdownTrigger,
                  {
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.background,
                  },
                ]}
              >
                <Text style={{ fontSize: 11, color: theme.colors.foreground }}>
                  {lrs.find((item) => item.value === config.lr)?.label ||
                    config.lr}
                </Text>
              </View>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {lrs.map((item) => (
                <DropdownMenuItem
                  key={item.id}
                  disabled={regen || isSceneLoading}
                  onSelect={() => onConfigChange(id, 'lr', Number(item.value))}
                >
                  <Text>{item.label}</Text>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </View>
      </View>

      {/* 3. START POINT ROW */}
      <View style={styles.startPointRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.subLabel}>Start Point</Text>
          {startPoint != null && !isPlacing ? (
            <Text
              style={[styles.valueText, { color: theme.colors.foreground }]}
            >
              [{startPoint[0].toFixed(2)}, {startPoint[1].toFixed(2)}]
            </Text>
          ) : (
            <Text
              style={[
                styles.valueText,
                { color: theme.colors.mutedForeground },
              ]}
            >
              Not set
            </Text>
          )}
        </View>
        <View style={{ justifyContent: 'center' }}>
          <Button
            variant={isPlacing ? 'destructive' : 'secondary'}
            size='sm'
            onPress={() => onPlaceStartPoint(id)}
            disabled={isSceneLoading || !isLandscapeLoaded}
          >
            {isPlacing ? 'Cancel' : startPoint ? 'Replace' : 'Place Point'}
          </Button>
        </View>
      </View>

      {/* 4. ACTIONS ROW (Only visible if placed/loaded) */}
      {(startPoint != null || isPathLoaded) && (
        <>
          <View
            style={[styles.divider, { backgroundColor: theme.colors.border }]}
          />

          <View style={styles.actionsRow}>
            {/* View Path Button */}
            <View style={{ flex: 1 }}>
              <Button
                variant='outline'
                onPress={() => onViewPath(id)}
                disabled={isSceneLoading || !isLandscapeLoaded || isWatching}
                size='sm'
                style={styles.fullWidthBtn}
              >
                <Eye
                  size={12}
                  color={theme.colors.foreground}
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.btnText} color={theme.colors.foreground}>
                  Watch
                </Text>
              </Button>
            </View>

            {/* Regeneration Buttons */}
            {isPathLoaded && (
              <>
                <View style={{ flex: 1 }}>
                  <Button
                    variant='outline'
                    disabled={regen}
                    onPress={() => onRegenPathPress(id, 'pca')}
                    size='sm'
                    style={styles.fullWidthBtn}
                  >
                    <Text
                      style={styles.btnText}
                      color={theme.colors.foreground}
                    >
                      PCA
                    </Text>
                  </Button>
                </View>
                <View style={{ flex: 1 }}>
                  <Button
                    variant='outline'
                    disabled={regen}
                    onPress={() => onRegenPathPress(id, 'autoencoder')}
                    size='sm'
                    style={styles.fullWidthBtn}
                  >
                    <Text
                      style={styles.btnText}
                      color={theme.colors.foreground}
                    >
                      AutoEnc
                    </Text>
                  </Button>
                </View>
              </>
            )}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pathCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 4,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pathTitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBtn: {
    height: 28,
    width: 28,
    borderRadius: 6,
    padding: 0,
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: 10,
    opacity: 0.5,
  },
  paramsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  paramItem: {
    flex: 1,
  },
  startPointRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  subLabel: {
    fontSize: 10,
    fontWeight: '700',
    opacity: 0.6,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  valueText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  dropdownTrigger: {
    height: 25,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  fullWidthBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
});
