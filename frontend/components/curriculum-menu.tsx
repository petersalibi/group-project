import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { useTheme } from './theme-provider';
import { Text } from './text';
import { NeuralNode } from './neural-node';

export interface CurriculumMenuProps {
  activePage?: string; 
  onNavigate?: (pageId: string) => void; 
}

const COURSE_ORDER = ['data', 'geometry', 'math', 'landscapes', 'gd', 'visualisations'];

export function CurriculumMenu({ activePage = 'visualisations', onNavigate }: CurriculumMenuProps) {
  const { theme } = useTheme();
  
  const activeLine = theme.colors.frenchBlue || '#3b82f6';
  const inactiveLine = theme.colors.border || '#333';

  // Helper to determine node status
  const getStatus = (id: string) => {
    const currentIndex = COURSE_ORDER.indexOf(activePage);
    const itemIndex = COURSE_ORDER.indexOf(id);

    if (itemIndex === currentIndex) return 'available'; // Currently on this page
    return 'completed'
  };

  return (
    <View style={[styles.globalCurriculumOverlay, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <Text style={styles.curriculumHeader}>CURRICULUM</Text>
      
      <ScrollView contentContainerStyle={{ paddingVertical: 20 }}>
        <View style={styles.networkContainer}>
          
          {/* SVG Connecting Lines (Absolute positioned behind the nodes) */}
          <View style={StyleSheet.absoluteFill}>
            <Svg width="100%" height="100%">
              {/* Row 1 (Centers at 16.6%, 50%, 83.3%) to Row 2 (Centers at 25%, 75%) */}
              <Line x1="16.6%" y1="15%" x2="25%" y2="50%" stroke={activeLine} strokeWidth="2" opacity="0.5" />
              <Line x1="50%"   y1="15%" x2="25%" y2="50%" stroke={activeLine} strokeWidth="2" opacity="0.5" />
              <Line x1="50%"   y1="15%" x2="75%" y2="50%" stroke={activeLine} strokeWidth="2" opacity="0.5" />
              <Line x1="83.3%" y1="15%" x2="75%" y2="50%" stroke={activeLine} strokeWidth="2" opacity="0.5" />

              {/* Row 2 (Centers at 25%, 75%) to Row 3 (Center at 50%) */}
              <Line x1="25%" y1="50%" x2="50%" y2="85%" stroke={activeLine} strokeWidth="2" opacity="0.5" />
              <Line x1="75%" y1="50%" x2="50%" y2="85%" stroke={activeLine} strokeWidth="2" opacity="0.5" />
            </Svg>
          </View>

          {/* Row 1: 3 Nodes */}
          <View style={styles.row}>
            <TouchableOpacity style={styles.col3} onPress={() => onNavigate?.('data')}>
              <NeuralNode status={getStatus('data')} label="Data" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.col3} onPress={() => onNavigate?.('geometry')}>
              <NeuralNode status={getStatus('geometry')} label="Geometry" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.col3} onPress={() => onNavigate?.('math')}>
              <NeuralNode status={getStatus('math')} label="Math" />
            </TouchableOpacity>
          </View>

          {/* Row 2: 2 Nodes */}
          <View style={styles.row}>
            <TouchableOpacity style={styles.col2} onPress={() => onNavigate?.('landscapes')}>
              <NeuralNode status={getStatus('landscapes')} label="Landscapes" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.col2} onPress={() => onNavigate?.('gd')}>
              <NeuralNode status={getStatus('gd')} label="Gradient Descent" />
            </TouchableOpacity>
          </View>

          {/* Row 3: 1 Node */}
          <View style={styles.row}>
            <TouchableOpacity style={styles.col1} onPress={() => onNavigate?.('visualisations')}>
              {/* We hardcode this to 'available' if we are currently on the visualisations page */}
              <NeuralNode status={getStatus('visualisations')} label="Visualisation" />
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  globalCurriculumOverlay: {
    position: 'absolute',
    top: 42, 
    left: 0,
    width: 320, // Increased slightly to comfortably fit 3 nodes side-by-side
    maxHeight: '85%', 
    borderBottomRightRadius: 12,
    borderWidth: 1,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    zIndex: 9999, 
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  curriculumHeader: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  networkContainer: {
    width: '100%',
    height: 320, // Provides enough vertical height to stretch out the 3 rows
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  row: {
    flexDirection: 'row',
    width: '100%',
  },
  // Column fractions to guarantee math centers perfectly match the SVG % coordinates
  col3: {
    width: '33.33%',
    alignItems: 'center',
  },
  col2: {
    width: '50%',
    alignItems: 'center',
  },
  col1: {
    width: '100%',
    alignItems: 'center',
  },
});