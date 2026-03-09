import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { LayoutManager } from "../../components/docking-provider";
import { DockPanel } from "../../components/dock-panel";
import { Text } from "../../components/text";
import { Button } from "../../components/button";
import { Slider } from "../../components/slider"; 
import { useLossLandscape } from "../../hooks/loss-landscape";

export function ComplexityLesson({ onTaskUpdate }: any) {
  const [depth, setDepth] = useState(2);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const { isLandscapeLoading, onGenerateLandscape, containerRef } = useLossLandscape({
    activation: 'Tanh', 
    depth: depth, 
    width: 10, 
    method: 'RANDOMDIRS', 
    data: 'SINREGRESSION', 
    loss: 'MSELoss',
    pathConfigs: [], 
    onPathConfigChange: () => {}, 
    setLog: () => {}, 
  });

  const handleGenerate = () => {
    onGenerateLandscape();
    if (depth >= 4) {
      onTaskUpdate(true, null);
    } else {
      onTaskUpdate(false, "Try increasing the depth to 4 or 5 to see high complexity.");
    }
  };

  return (
    <View style={{ flex: 1 }} onLayout={(e) => setDimensions(e.nativeEvent.layout)}>
      {dimensions.width > 0 && (
        <LayoutManager width={dimensions.width} height={dimensions.height} initialRegistry={{ 'CONTROLS': 'LEFT', 'VIS': 'TOP_MAIN' }}>
          {/* FIX: Added isMaximized={false} to stop the TS2741 error */}
          <DockPanel id="CONTROLS" title="MODEL COMPLEXITY" isMaximized={false}>
            <ScrollView contentContainerStyle={{ padding: 16 }}>
               <Text style={styles.label}>NETWORK DEPTH (Layers)</Text>
               <Slider value={depth} min={1} max={5} step={1} onValueChange={setDepth} />
               <Text style={styles.valueDisplay}>{depth} Layers</Text>

               <Button 
                 style={{ marginTop: 24 }} 
                 variant="secondary" 
                 onPress={handleGenerate}
                 disabled={isLandscapeLoading}
               >
                  {isLandscapeLoading ? <ActivityIndicator size="small" color="white" /> : <Text>Update Landscape</Text>}
               </Button>
            </ScrollView>
          </DockPanel>

          <DockPanel id="VIS" title="COMPLEX SURFACE" isMaximized={false}>
            <View ref={containerRef} style={{ flex: 1, backgroundColor: '#000' }} />
          </DockPanel>
        </LayoutManager>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 10, fontWeight: 'bold', color: '#888', marginBottom: 8 },
  valueDisplay: { color: 'white', fontSize: 18, fontWeight: 'bold', marginTop: 10 }
});