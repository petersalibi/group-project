import { useVisualisation } from './visualisation';
import { useLandscapeControls } from './landscape-controls';
import { PathConfigInterface } from '../components/path-config';

export interface UseLossLandscapeProps {
  activation: string;
  depth: number;
  width: number;
  method: string;
  dir1: number | null;
  dir2: number | null;
  data: string;
  loss: string;
  pathConfigs: PathConfigInterface[];
  onPathConfigChange: (
    id: number,
    field: keyof PathConfigInterface,
    value: number | [number, number] | string | boolean | null,
  ) => void;
  setLog: any;
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
    onPathConfigChange,
    setLog,
  } = props;

  const {
    handleUploadCsv,
    loadingCsv,
    csvLoaded,
    csv,
    datasetParameters,
    setDatasetParameters,
    datasetOutputs,
    setDatasetOutputs,
  } = useLandscapeControls({
    activation,
    depth,
    width,
    method,
    data,
    loss,
    setLog,
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
    isRotating,
    handleRotate,
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
    fidelity,
    instability,
    trainability,
    handleLoadAllPathsButtonClick,
    handleRegeneratePress,
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
    setLog,
  });

  return {
    isLandscapeLoading,
    isLandscapeLoaded,
    onGenerateLandscape: handleGenerateLandscapeButtonClick,
    onRegenerate: handleRegeneratePress,
    logPlot,
    handleLogPlotToggle,
    zValue,
    handleZChange,
    isRotating,
    handleRotate,
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
    fidelity,
    instability,
    trainability,
    handleLoadAllPathsButtonClick,
    handleRemovePath,
    handleClearPaths,
    togglePlayPause,
    handleSkipBack,
    handleSkipForward,
    togglePlacingMode,
    onViewPath,
  };
}
