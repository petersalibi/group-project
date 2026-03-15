import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut } from 'react-native-reanimated';
import { X } from 'lucide-react-native';
import { useTheme } from './theme-provider';
import { Text } from './text';

export interface InfoModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function InfoModal({ visible, onClose, title, children }: InfoModalProps) {
  const { theme } = useTheme();

  if (!visible) return null;

  return (
    // The wrapper ensures it floats over everything else
    <View style={[StyleSheet.absoluteFill, styles.overlayContainer]}>
      
      {/* 1. Dark, clickable backdrop (clicking outside closes the modal) */}
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        style={styles.backdrop}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
      </Animated.View>

      {/* 2. The Main Content Box */}
      <Animated.View
        entering={ZoomIn.duration(250).springify().damping(15)}
        exiting={ZoomOut.duration(200)}
        style={[
          styles.modalBox,
          { 
            backgroundColor: theme.colors.card, 
            borderColor: theme.colors.border,
            shadowColor: '#000',
          }
        ]}
      >
        {/* Header with Title and Close Button */}
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.colors.muted }]}>
            <X size={16} color={theme.colors.foreground} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* Scrollable Children Area */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>

      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    zIndex: 99999,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalBox: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '85%',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flexShrink: 1,
  },
  contentContainer: {
    padding: 24,
    gap: 16,
  },
});