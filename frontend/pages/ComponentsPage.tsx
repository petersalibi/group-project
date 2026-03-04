import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../components/theme-provider';
import { Text } from '../components/text';
import {
  Play,
  SkipBack,
  SkipForward,
  Maximize2,
  RotateCcw,
  RefreshCw,
  Eye,
  Network,
  Palette,
  Database,
  Zap,
  TrendingUp,
  Layers,
  CheckCircle2,
  Lock,
} from 'lucide-react-native';

// Import your library components
import { Button } from '../components/button';
import { NumberInput } from '../components/number-input';
import { Slider } from '../components/slider';
import { Progress } from '../components/progress';
import { LessonCard } from '../components/lesson-card';
import { NeuralNode } from '../components/neural-node';
import { NeuralConnections } from '../components/neural-connections';

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../components/dropdown-menu';

export function ComponentsPage() {
  const { theme, isDark } = useTheme();
  const brandAccent = isDark ? '#C6F382' : '#353F91';
  const [val, setVal] = useState(50);

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>
      <View style={styles.headerSection}>
        <Text style={styles.title}>Design Lab</Text>
        <Text style={styles.subtitle}>Component Library & System Specs</Text>
      </View>

      {/* 01. NEURAL ARCHITECTURE COMPONENTS */}
      <View style={styles.section}>
        <Text style={[styles.sectionHeading, { color: brandAccent }]}>
          01. Neural Architecture
        </Text>
        <View style={styles.row}>
          <View style={styles.neuralNodeGroup}>
            <View style={[styles.neuralNode, { backgroundColor: '#353F91' }]}>
              <CheckCircle2 color='white' size={20} />
            </View>
            <Text style={styles.nodeLabel}>COMPLETED</Text>
          </View>
          <View style={styles.neuralNodeGroup}>
            <View
              style={[
                styles.neuralNode,
                {
                  backgroundColor: '#C6F382',
                  borderWidth: 2,
                  borderColor: '#353F91',
                },
              ]}
            >
              <Play color='#353F91' size={20} />
            </View>
            <Text style={styles.nodeLabel}>ACTIVE</Text>
          </View>
          <View style={styles.neuralNodeGroup}>
            <View
              style={[
                styles.neuralNode,
                { backgroundColor: theme.colors.muted },
              ]}
            >
              <Lock color={theme.colors.mutedForeground} size={18} />
            </View>
            <Text style={styles.nodeLabel}>LOCKED</Text>
          </View>
        </View>
      </View>

      {/* 02. NEW INPUT SYSTEM (Stacked & Radix) */}
      <View style={styles.section}>
        <Text style={[styles.sectionHeading, { color: brandAccent }]}>
          02. Input Controls
        </Text>
        <View style={styles.grid}>
          <View style={styles.componentPreview}>
            <Text style={styles.previewLabel}>Stacked Number Input</Text>
            <NumberInput defaultValue={0.01} step={0.001} />
          </View>

          <View style={styles.componentPreview}>
            <Text style={styles.previewLabel}>Radix Dropdown</Text>
            <DropdownMenu>
              <DropdownMenuTrigger>
                <View
                  style={[styles.trigger, { borderColor: theme.colors.border }]}
                >
                  <Text style={{ fontSize: 12 }}>ReLU</Text>
                </View>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>
                  <Text>ReLU</Text>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Text>Sigmoid</Text>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </View>

          <View style={styles.componentPreview}>
            <Text style={styles.previewLabel}>Interactive Slider</Text>
            <Slider value={val} onValueChange={setVal} />
          </View>
        </View>
      </View>

      {/* 03. ENGINE HUD COMPONENTS */}
      <View style={styles.section}>
        <Text style={[styles.sectionHeading, { color: brandAccent }]}>
          03. Engine Overlay HUD
        </Text>
        <View style={[styles.engineMock, { backgroundColor: '#5B62B3' }]}>
          <View style={styles.playbackBar}>
            <View style={styles.playbackActions}>
              <SkipBack size={18} color='white' />
              <View style={styles.playBtn}>
                <Play size={14} color='white' fill='white' />
              </View>
              <SkipForward size={18} color='white' />
            </View>
            <View style={{ flex: 1 }}>
              <Progress value={65} color={brandAccent} />
            </View>
            <Text style={styles.frameCounter}>82/120</Text>
          </View>
        </View>
      </View>

      {/* 04. BUTTON PRIMITIVES */}
      <View style={styles.section}>
        <Text style={[styles.sectionHeading, { color: brandAccent }]}>
          04. Button Variants
        </Text>
        <View style={styles.row}>
          <Button variant='default' size='sm'>
            Primary Action
          </Button>
          <Button variant='secondary' size='sm'>
            Secondary
          </Button>
          <Button variant='outline' size='sm'>
            Outline
          </Button>
          <Button variant='outline' size='sm'>
            <Palette size={16} color={theme.colors.foreground} />
          </Button>
        </View>
      </View>

      {/* 05. NEURAL CURRICULUM SYSTEM */}
      <View style={styles.section}>
        <Text style={[styles.sectionHeading, { color: brandAccent }]}>
          05. Neural Curriculum Architecture
        </Text>

        <View style={styles.neuralShowcase}>
          {/* Background SVG Connections (Just as defined in your code) */}
          <NeuralConnections />

          {/* Actual Node Placements */}
          <View style={styles.nodesOverlay}>
            <View style={styles.nodeWrapper}>
              <Text style={styles.previewLabel}>Status: Completed</Text>
              <NeuralNode status='completed' label='Basics' />
            </View>

            <View style={styles.nodeWrapper}>
              <Text style={styles.previewLabel}>Status: Available</Text>
              <NeuralNode status='available' label='Optimization' />
            </View>

            <View style={styles.nodeWrapper}>
              <Text style={styles.previewLabel}>Status: Locked</Text>
              <NeuralNode status='locked' label='Advanced' />
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 40, paddingBottom: 100 },
  headerSection: { gap: 4 },
  title: { fontSize: 32, fontWeight: '900' },
  subtitle: { fontSize: 14, opacity: 0.5 },
  section: { gap: 16 },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  grid: { gap: 20 },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'center',
  },
  neuralNodeGroup: { alignItems: 'center', gap: 8 },
  neuralNode: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nodeLabel: { fontSize: 9, fontWeight: '800', opacity: 0.6 },
  componentPreview: { gap: 8 },
  trigger: {
    height: 36,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
    paddingHorizontal: 12,
    width: 120,
  },
  engineMock: {
    height: 120,
    borderRadius: 12,
    padding: 20,
    justifyContent: 'flex-end',
  },
  playbackBar: {
    height: 44,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 12,
  },
  playbackActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  playBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  frameCounter: { color: 'white', fontSize: 9, fontWeight: 'bold' },

  neuralShowcase: {
    height: 180, // Matches your SVG height + label space
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  nodesOverlay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: '10%', // Aligns with your 20%, 50%, 80% SVG lines
    zIndex: 10,
  },
  nodeWrapper: {
    alignItems: 'center',
    gap: 12,
  },
  previewLabel: {
    fontSize: 9,
    fontWeight: '800',
    opacity: 0.4,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
});
