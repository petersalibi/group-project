'use client';
import React, { useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLandscapeScene } from '@/hooks/use-landscape-scene';
import { LandscapeControls } from '@/components/landscape-controls';
import { AnimationControls } from '@/components/animation-controls';

export default function LandscapeWithPath() {
  // --- UI Form State ---
  const [activation, setActivation] = useState<string>('ReLU');
  const [depth, setDepth] = useState<number>(2);
  const [width, setWidth] = useState<number>(10);
  const [method, setMethod] = useState<string>('RANDOMDIRS');
  const [data, setData] = useState<string>('SINREGRESSION');
  const [optim, setOptim] = useState<string>('Adam');
  const [loss, setLoss] = useState<string>('MSELoss');
  const [lr, setLr] = useState<number>(0.01);

  // --- Custom Hook ---
  // The hook manages all Three.js logic and related state
  const {
    containerId,
    zValue,
    isLandscapeLoading,
    isLandscapeLoaded,
    isPathLoading,
    isPathLoaded,
    isPlaying,
    animationProgress,
    isPlacingMode,
    handleLoadLandscapeButtonClick,
    handleLoadPathButtonClick,
    handleRemovePathButtonClick,
    togglePlayPause,
    handleProgressChange,
    handleZChange,
    togglePlacingMode,
  } = useLandscapeScene({
    activation,
    depth,
    width,
    method,
    data,
    optim,
    loss,
    lr,
  });

  return (
    <SafeAreaView style={{ flex: 1, position: 'relative' }}>
      {/* The Three.js canvas will be injected into this View by the hook */}
      <View id={containerId} style={{ flex: 1 }} />

      {/* UI Controls Container */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          flexDirection: 'column',
        }}
      >
        {/* Main controls for landscape and path */}
        <LandscapeControls
          data={data}
          depth={depth}
          width={width}
          activation={activation}
          method={method}
          optim={optim}
          loss={loss}
          lr={lr}
          zValue={zValue}
          isLandscapeLoading={isLandscapeLoading}
          isLandscapeLoaded={isLandscapeLoaded}
          isPathLoading={isPathLoading}
          isPathLoaded={isPathLoaded}
          isPlacingMode={isPlacingMode}
          setData={setData}
          setDepth={setDepth}
          setWidth={setWidth}
          setActivation={setActivation}
          setMethod={setMethod}
          setOptim={setOptim}
          setLoss={setLoss}
          setLr={setLr}
          onLoadLandscape={handleLoadLandscapeButtonClick}
          onLoadPath={handleLoadPathButtonClick}
          onRemovePath={handleRemovePathButtonClick}
          onTogglePlacingMode={togglePlacingMode}
          onZChange={handleZChange}
        />

        {/* Animation controls (play/pause, slider) */}
        <AnimationControls
          isPathLoaded={isPathLoaded}
          isPlaying={isPlaying}
          animationProgress={animationProgress}
          onTogglePlayPause={togglePlayPause}
          onProgressChange={handleProgressChange}
        />
      </View>
    </SafeAreaView>
  );
}