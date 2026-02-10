import { useEffect, useRef, useState, useCallback } from 'react';
import { View } from 'react-native';
import { useVisualisation } from './visualisation';
import { useLandscapeControls } from './landscape-controls';

export interface UseLossLandscapeProps {
  activation: string;
  depth: number;
  width: number;
  method: string;
  data: string;
  loss: string;
}

export function useLossLandscape(props: UseLossLandscapeProps) {
    const {
        activation,
        depth,
        width,
        method,
        data,
        loss,
    } = props;

    const {
        handleUploadCsv,
        loadingCsv,
        csvLoaded,
        csv,
        datasetInputs,
        setDatasetInputs,
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
    } = useVisualisation({
        activation,
        depth,
        width,
        method,
        data,
        csv,
        loss,
    });

    return {
        isLandscapeLoading,
        isLandscapeLoaded,
        onGenerateLandscape: handleGenerateLandscapeButtonClick,
        logPlot,
        handleLogPlotToggle,
        zValue,
        handleZChange,
        onUploadCsv: handleUploadCsv,
        loadingCsv,
        csvLoaded,
        datasetInputs,
        setDatasetInputs,
        datasetOutputs,
        setDatasetOutputs,
        containerRef,
    }
}