import { useEffect, useRef, useState, useCallback } from 'react';
import { View } from 'react-native';
import { useVisualisation } from './visualisation';
import { useLandscapeControls } from './landscape-controls';
import { PathConfigInterface } from '../components/path-config';

export interface UseLossLandscapeProps {
  activation: string;
  depth: number;
  width: number;
  method: string;
  dir1: number;
  dir2: number;
  data: string;
  loss: string;
  pathConfigs: PathConfigInterface[];
  onPathConfigChange;
}

export function useLossLandscape(props: UseLossLandscapeProps) {
    const {
        activation,
        depth,
        width,
        method,
        dir1,
        dir2,
        data,
        loss,
        pathConfigs,
        onPathConfigChange
    } = props;

    const {
        handleUploadCsv,
        loadingCsv,
        csvLoaded,
        csv,
        datasetParameters,
        setDatasetParameters,
        datasetOutputs,
        setDatasetOutputs
    } = useLandscapeControls({
        activation,
        depth,
        width,
        method,
        data,
        loss,
    });

    const {
        isLandscapeLoading,
        isLandscapeLoaded,
        containerRef,
        handleGenerateLandscapeButtonClick,
        logPlot,
        handleLogPlotToggle,
        zValue,
        handleZChange,
        handleRefresh,
        handleColorSelect,
        isPathLoading,
        isPathLoaded,
        isPlaying,
        progress,
        currentFrame,
        totalFrames,
        isPlacingMode,
        placingPathId,
        currentParams,
        viewId,
        currentLoss,
        lossChange,
        handleLoadAllPathsButtonClick,
        handleRemovePath,
        handleClearPaths,
        togglePlayPause,
        handleSkipBack,
        handleSkipForward,
        togglePlacingMode,
        onViewPath,
    } = useVisualisation({
        activation,
        depth,
        width,
        method,
        dir1,
        dir2,
        data,
        csv,
        loss,
        pathConfigs,
        onPathConfigChange,
    });

    return {
        isLandscapeLoading,
        isLandscapeLoaded,
        onGenerateLandscape: handleGenerateLandscapeButtonClick,
        logPlot,
        handleLogPlotToggle,
        zValue,
        handleZChange,
        handleRefresh,
        handleColorSelect,
        onUploadCsv: handleUploadCsv,
        loadingCsv,
        csvLoaded,
        datasetParameters,
        setDatasetParameters,
        datasetOutputs,
        setDatasetOutputs,
        containerRef,
        isPathLoading,
        isPathLoaded,
        isPlaying,
        progress,
        currentFrame,
        totalFrames,
        isPlacingMode,
        placingPathId,
        currentParams,
        viewId,
        currentLoss,
        lossChange,
        handleLoadAllPathsButtonClick,
        handleRemovePath,
        handleClearPaths,
        togglePlayPause,
        handleSkipBack,
        handleSkipForward,
        togglePlacingMode,
        onViewPath,
    }
}