import { useEffect, useRef, useState, useCallback } from 'react';
import { View } from 'react-native';
import { useVisualisation } from './visualisation';

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
        isLandscapeLoading,
        containerRef,
        handleGenerateLandscapeButtonClick,
    } = useVisualisation({
        activation,
        depth,
        width,
        method,
        data,
        loss,
    });

    return {
        isLandscapeLoading,
        onGenerateLandscape: handleGenerateLandscapeButtonClick,
        containerRef,
    }
}