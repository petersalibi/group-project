import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  LayoutChangeEvent,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { LayoutManager } from '../../components/docking-provider';
import { DockPanel } from '../../components/dock-panel';
import { Text } from '../../components/text';
import { Button } from '../../components/button';
import { NumberInput } from '../../components/number-input';
import { useLossLandscape } from '../../hooks/loss-landscape';
import { dataSets } from '../../constants/constants';
import { AlertTriangle } from 'lucide-react-native';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../../components/dropdown-menu';

export function InitialSurfaceLesson({ onTaskUpdate }: any) {
  const [depth, setDepth] = useState(2);
  const [data, setData] = useState('SINREGRESSION');
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [showErrorOverlay, setShowErrorOverlay] = useState(false);

  const {
    isLandscapeLoading,
    isLandscapeLoaded,
    onGenerateLandscape,
    containerRef,
  } = useLossLandscape({
    activation: 'Tanh',
    depth: depth,
    width: 10,
    method: 'RANDOMDIRS',
    dir1: 0,
    dir2: 1,
    data: data,
    loss: 'MSELoss',
    pathConfigs: [],
    onPathConfigChange: () => {},
    setLog: () => {},
  });

  useEffect(() => {
    if (isLandscapeLoaded && !isLandscapeLoading && data === 'SINREGRESSION') {
      onTaskUpdate(true, null);
      setShowErrorOverlay(false);
    }
  }, [isLandscapeLoaded, isLandscapeLoading]);

  const handleAttemptGenerate = () => {
    if (data === 'SINREGRESSION') {
      setShowErrorOverlay(false);
      onTaskUpdate(false, null);
      onGenerateLandscape();
    } else {
      setShowErrorOverlay(true);
      onTaskUpdate(
        false,
        "Invalid Configuration: 'BASICS' requires the Sine Regression dataset.",
      );
    }
  };

  return (
    <View
      style={{ flex: 1 }}
      onLayout={(e) => setDimensions(e.nativeEvent.layout)}
    >
      {dimensions.width > 0 && (
        <LayoutManager
          width={dimensions.width}
          height={dimensions.height}
          initialRegistry={{ CONFIG: 'LEFT', ENGINE: 'TOP_MAIN' }}
        >
          <DockPanel id='CONFIG' title='LESSON CONTROLS' isMaximized={false}>
            <ScrollView contentContainerStyle={{ padding: 16 }}>
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: 'bold',
                  marginBottom: 8,
                  color: '#888',
                }}
              >
                SET DATASET
              </Text>

              <DropdownMenu>
                <DropdownMenuTrigger>
                  <View
                    style={{
                      height: 40,
                      borderWidth: 1,
                      borderColor: showErrorOverlay ? '#ff4d4d' : '#333',
                      borderRadius: 8,
                      justifyContent: 'center',
                      paddingHorizontal: 12,
                      backgroundColor: 'rgba(255,255,255,0.03)',
                    }}
                  >
                    <Text style={{ fontSize: 13 }}>
                      {dataSets.find((d) => d.value === data)?.label ||
                        'Select Dataset'}
                    </Text>
                  </View>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {dataSets.map((item) => (
                    <DropdownMenuItem
                      key={item.id}
                      onSelect={() => {
                        setData(item.value);
                        setShowErrorOverlay(false);
                      }}
                    >
                      <Text>{item.label}</Text>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <View style={{ marginTop: 24 }}>
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: 'bold',
                    color: '#888',
                    marginBottom: 8,
                  }}
                >
                  DEPTH
                </Text>
                <NumberInput
                  value={depth}
                  min={1}
                  max={5}
                  onChange={setDepth}
                />
              </View>

              <Button
                style={{ marginTop: 32 }}
                variant='secondary'
                onPress={handleAttemptGenerate}
                disabled={isLandscapeLoading}
              >
                {isLandscapeLoading ? (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <ActivityIndicator size='small' color='white' />
                    <Text style={{ color: 'white' }}>Generating...</Text>
                  </View>
                ) : (
                  <Text style={{ color: 'white' }}>Generate Landscape</Text>
                )}
              </Button>
            </ScrollView>
          </DockPanel>

          <DockPanel id='ENGINE' title='VISUALIZATION' isMaximized={false}>
            <View
              style={{ flex: 1, backgroundColor: '#000', position: 'relative' }}
            >
              <View ref={containerRef} style={{ flex: 1 }} />

              {showErrorOverlay && (
                <View
                  style={{
                    ...StyleSheet.absoluteFillObject,
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: 40,
                  }}
                >
                  <AlertTriangle
                    size={48}
                    color='#ff4d4d'
                    style={{ marginBottom: 16 }}
                  />
                  <Text
                    style={{
                      color: 'white',
                      fontWeight: 'bold',
                      textAlign: 'center',
                    }}
                  >
                    Configuration Error
                  </Text>
                  <Text
                    style={{ color: '#888', textAlign: 'center', marginTop: 8 }}
                  >
                    The selected dataset is incompatible with this lesson&apos;s
                    requirements.
                  </Text>
                </View>
              )}
            </View>
          </DockPanel>
        </LayoutManager>
      )}
    </View>
  );
}

const styles = StyleSheet.create({});
