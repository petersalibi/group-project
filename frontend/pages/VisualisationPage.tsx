import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, FadeIn, FadeOut } from 'react-native-reanimated';
import { useTheme } from '../components/theme-provider'; 
import { Visualisation } from '../components/visualisation';
import { Text } from '../components/text';
import { Button } from '../components/button'; 
import { CurriculumMenu } from '../components/curriculum-menu';
import { LossLesson } from './curriculum/LossLesson';
import { LandscapeGenerationPage } from './LandscapeGenerationPage';
import { GDPage } from './OptimisersLesson';
import { LearningPage } from './LearningPage';
import { Plus, X, ChevronRight, ChevronDown, GraduationCap } from 'lucide-react-native'; 

// A distinct set of colors to map to the workspaces
const WORKSPACE_COLORS = [
  '#10b981', // Green
  '#f59e0b', // Orange
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
];

export function VisualisationPage() {
  const { theme } = useTheme();
  
  const [views, setViews] = useState<string[]>(['vis-1']);
  const [nextId, setNextId] = useState(2);
  const [maximizedId, setMaximizedId] = useState<string | null>(null);
  const [minimizedIds, setMinimizedIds] = useState<string[]>([]);
  const [viewColors, setViewColors] = useState<Record<string, string>>({
    'vis-1': WORKSPACE_COLORS[0]
  });
  const [currentPage, setCurrentPage] = useState('visualisations');
  const [isHoveringTop, setIsHoveringTop] = useState(false);
  const [isCurriculumOpen, setIsCurriculumOpen] = useState(false);

  const isMaximized = maximizedId !== null;
  const shouldHideTab = Platform.OS === 'web' && isMaximized && !isHoveringTop && !isCurriculumOpen;

  const tabMarginTop = useSharedValue(0);

  useEffect(() => {
    tabMarginTop.value = withTiming(shouldHideTab ? -42 : 0, { duration: 300 });
  }, [shouldHideTab]);

  const animatedTabStyle = useAnimatedStyle(() => ({
    marginTop: tabMarginTop.value,
  }));

  const visOpacity = useSharedValue(1);

  useEffect(() => {
    visOpacity.value = withTiming(currentPage === 'visualisations' ? 1 : 0, { duration: 300 });
  }, [currentPage]);

  const visAnimatedStyle = useAnimatedStyle(() => ({
    opacity: visOpacity.value,
    zIndex: currentPage === 'visualisations' ? 1 : -10,
  }));

  const handlePointerMove = (e: any) => {
    if (Platform.OS !== 'web' || !isMaximized) return;
    if (e.nativeEvent.y < 90) {
      setIsHoveringTop(true);
    } else {
      setIsHoveringTop(false);
    }
  };

  // Helper to reliably get the same color for a specific workspace ID
  const getColorForId = (id: string) => {
    return viewColors[id] || WORKSPACE_COLORS[0];
  };

  const handleAddView = () => {
    if (views.length >= 4) return; 

    // Find which colors are currently in use by active tabs
    const usedColors = views.map(id => viewColors[id]);
    
    // Find the first color in our array that isn't being used
    const availableColor = WORKSPACE_COLORS.find(color => !usedColors.includes(color)) || WORKSPACE_COLORS[0];

    const newId = `vis-${nextId}`;
    
    setViews([...views, newId]);
    setViewColors({ ...viewColors, [newId]: availableColor }); // Assign the free color
    setNextId(nextId + 1);
  };

  const handleRemoveView = (idToRemove: string) => {
    setViews(views.filter(id => id !== idToRemove));
    setMinimizedIds(minimizedIds.filter(id => id !== idToRemove));
    if (maximizedId === idToRemove) {
      setMaximizedId(null);
    }
  };

  const handleMinimize = (id: string) => {
    if (maximizedId === id) setMaximizedId(null);
    if (!minimizedIds.includes(id)) {
      setMinimizedIds([...minimizedIds, id]);
    }
  };

  const handleRestore = (id: string) => {
    setMinimizedIds(minimizedIds.filter(minId => minId !== id));
  };

  const toggleMaximize = (id: string) => {
    if (minimizedIds.includes(id)) handleRestore(id); // Auto-restore if minimized

    if (maximizedId === id) {
      setMaximizedId(null); 
    } else {
      setMaximizedId(id); 
    }
  };

  const getCellStyles = (id: string) => {

    const hiddenStyle = { 
      position: 'absolute' as const, 
      opacity: 0, 
      pointerEvents: 'none' as const, 
      zIndex: -10,
      width: '100%', 
      height: '100%' 
    };

    // Hidden if minimized
    if (minimizedIds.includes(id)) return hiddenStyle;

    // Full screen if maximized
    if (maximizedId) {
      if (maximizedId === id) return { width: '100%', height: '100%', display: 'flex' as const };
      return hiddenStyle; 
    }

    // Standard grid logic calculated ONLY for active (un-minimized) views
    const activeViews = views.filter(v => !minimizedIds.includes(v));
    const count = activeViews.length;
    const index = activeViews.indexOf(id);

    if (count === 1) return { width: '100%', height: '100%' };
    if (count === 2) return { width: '50%', height: '100%' };
    if (count === 3) {
      if (index === 0 || index === 1) return { width: '50%', height: '50%' };
      if (index === 2) return { width: '100%', height: '50%' };
    }
    if (count === 4) return { width: '50%', height: '50%' };
    
    return hiddenStyle;
  };

  return (
    <View style={styles.container} onPointerMove={handlePointerMove}>
      
      {/* --- GLOBAL BROWSER TAB BAR --- */}
      <Animated.View 
        style={[
          styles.tabBar, 
          { backgroundColor: theme.colors.muted, borderBottomColor: theme.colors.border },
          animatedTabStyle,
        ]}
      >
        <TouchableOpacity 
          onPress={() => setIsCurriculumOpen(!isCurriculumOpen)}
          style={[styles.globalCurriculumBtn, { borderRightColor: theme.colors.border }]}
        >
          <ChevronDown size={18} color={theme.colors.foreground} />
        </TouchableOpacity>

        {currentPage === 'visualisations' && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={{ flex: 1 }}
            contentContainerStyle={{ alignItems: 'flex-end', paddingLeft: 8 }}
          >
            {views.map((id) => {
              const color = getColorForId(id);
              const isMinimized = minimizedIds.includes(id);
              const isActive = !isMinimized && (maximizedId === null || maximizedId === id);

              return (
                <TouchableOpacity 
                  key={id}
                  activeOpacity={0.8}
                  onPress={() => isMinimized ? handleRestore(id) : toggleMaximize(id)}
                  style={[
                    styles.tab, 
                    { 
                      backgroundColor: isActive ? theme.colors.background : 'transparent',
                      borderTopColor: color,
                      borderLeftColor: isActive ? theme.colors.border : 'transparent',
                      borderRightColor: isActive ? theme.colors.border : 'transparent',
                    }
                  ]}
                >
                  <Text style={[styles.tabTitle, { opacity: isMinimized ? 0.4 : 1 }]}>
                    WORKSPACE {id.split('-')[1]}
                  </Text>
                  
                  {/* Mac-style Buttons */}
                  <View style={[styles.windowControls, { opacity: isMinimized ? 0.6 : 1 }]}>
                    {/* Green Dot (Maximize/Restore) */}
                    <TouchableOpacity onPress={() => toggleMaximize(id)} style={[styles.macDot, { backgroundColor: '#22c55e' }]} />
                    
                    {/* Orange Dot (Minimize) */}
                    <TouchableOpacity onPress={() => handleMinimize(id)} style={[styles.macDot, { backgroundColor: '#f59e0b' }]} />
                    
                    {/* Red Dot with Cross (Close) */}
                    <TouchableOpacity onPress={() => handleRemoveView(id)} style={[styles.macDot, { backgroundColor: '#ef4444' }]}>
                      <X size={8} color="white" strokeWidth={3} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Plus Button next to the tabs */}
            <TouchableOpacity 
              onPress={handleAddView} 
              disabled={views.length >= 4} 
              style={styles.addTabBtn}
            >
              <Plus size={18} color={views.length >= 4 ? theme.colors.mutedForeground : theme.colors.foreground} />
            </TouchableOpacity>
          </ScrollView>
        )}

        <Button 
          variant='ghost'
          onPress={() => setCurrentPage(currentPage === 'learning' ? 'visualisations' : 'learning')}
          style={[
            styles.learningModeBtn, 
            { 
              marginLeft: currentPage !== 'visualisations' ? 'auto' : 0 
            }
          ]}
        >
          <GraduationCap 
            size={18} 
            color={currentPage === 'learning' ? theme.colors.primary : theme.colors.foreground} 
          />
        </Button>

      </Animated.View>

      {isCurriculumOpen && (
        <CurriculumMenu 
          activePage={currentPage} 
          onNavigate={(pageId) => {
            setCurrentPage(pageId);
            setIsCurriculumOpen(false); 
          }}
        />
      )}

      <View style={{ flex: 1, position: 'relative' }}>

        {/* 1. VISUALISATIONS */}
        <Animated.View 
          style={[
            StyleSheet.absoluteFill, 
            visAnimatedStyle
          ]}
          pointerEvents={currentPage === 'visualisations' ? 'auto' : 'none'}
        >
          <View style={styles.gridContainer}>
            {views.map((id) => {
              const workspaceColor = getColorForId(id);
              return (
                <View key={id} style={[styles.gridCell, getCellStyles(id), { borderTopColor: workspaceColor }]}>
                  <View style={{ flex: 1, overflow: 'hidden', backgroundColor: theme.colors.background }}>
                    <Visualisation id={id} />
                  </View>
                </View>
              );
            })}
          </View>
        </Animated.View>

        {/* 2. LEARNING PAGE */}
        {currentPage === 'learning' && (
          <Animated.View 
            entering={FadeIn.duration(300)} 
            exiting={FadeOut.duration(300)}
            style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.background }]}
          >
             <LearningPage />
          </Animated.View>
        )}

        {/* 2. LOSS PAGE */}
        {currentPage === 'loss' && (
          <Animated.View 
            entering={FadeIn.duration(300)} 
            exiting={FadeOut.duration(300)}
            style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.background }]}
          >
             <LossLesson />
          </Animated.View>
        )}

        {/* 3. GRADIENT DESCENT PAGE */}
        {currentPage === 'gd' && (
          <Animated.View 
            entering={FadeIn.duration(300)} 
            exiting={FadeOut.duration(300)}
            style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.background }]}
          >
             <GDPage />
          </Animated.View>
        )}

        {/* 4. LANDSCAPE GENERATION PAGE */}
        {currentPage === 'landscape' && (
          <Animated.View 
            entering={FadeIn.duration(300)} 
            exiting={FadeOut.duration(300)}
            style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.background }]}
          >
             <LandscapeGenerationPage />
          </Animated.View>
        )}

        {/* 5. LOCKED/FALLBACK PAGE */}
        {currentPage !== 'visualisations' && currentPage !== 'learning' && currentPage !== 'loss' && currentPage !== 'gd' && currentPage !== 'landscape' && (
          <Animated.View 
            entering={FadeIn.duration(300)} 
            exiting={FadeOut.duration(300)}
            style={[StyleSheet.absoluteFill, styles.emptyState, { backgroundColor: theme.colors.background }]}
          >
             <Text style={{ color: theme.colors.mutedForeground }}>This module is currently locked or under construction.</Text>
          </Animated.View>
        )}
        
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  emptyState: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  tabBar: {
    height: 38,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 5
  },
  tab: {
    height: 34, 
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderTopWidth: 3,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    gap: 16,
    marginRight: 2,
  },
  tabTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  windowControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  macDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addTabBtn: {
    height: 34,
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  gridContainer: {
    flex: 1,
    flexDirection: 'row', 
    flexWrap: 'wrap',
  },
  gridCell: {
    borderTopWidth: 4,
    borderRadius: 8,
    position: 'relative',
    overflow: 'hidden',
    flexDirection: 'column',
  },
  globalCurriculumBtn: {
    height: 34,
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  learningModeBtn: {
    height: 34,
    width: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});