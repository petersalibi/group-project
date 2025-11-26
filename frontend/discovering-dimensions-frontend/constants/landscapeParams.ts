export const depths = [
  { id: 1, label: '2 Layers', value: 2 },
  { id: 2, label: '3 Layers', value: 3 },
  { id: 3, label: '4 Layers', value: 4 },
];

export const widths = [
  { id: 1, label: '5 Nodes', value: 5 },
  { id: 2, label: '10 Nodes', value: 10 },
  { id: 3, label: '15 Nodes', value: 15 },
];

export const activations = [
  { id: 1, label: 'ReLU', value: 'ReLU' },
  { id: 2, label: 'Tanh', value: 'Tanh' },
  { id: 3, label: 'Sigmoid', value: 'Sigmoid' },
  { id: 4, label: 'LeakyReLU', value: 'LeakyReLU' },
];

export const methods = [
  { id: 1, label: 'Random Directions', value: 'RANDOMDIRS' },
  { id: 2, label: 'Filter-wise Normalised Directions', value: 'FILTERNORM' },
  { id: 3, label: 'PCA Directions', value: 'PCAMINIMISER' },
];

export const dataSets = [
  { id: 1, label: 'Sine Regression', value: 'SINREGRESSION' },
  { id: 2, label: 'Penguins', value: 'PENGUINS' },
];

export const datasetFeatures: Record<string, number> = {
  SINREGRESSION: 1,
  PENGUINS: 8,
};

export const datasetOutputs: Record<string, number> = {
  SINREGRESSION: 1,
  PENGUINS: 3,
};

export const optimisers = [
  { id: 1, label: 'SGD', value: 'SGD' },
  { id: 2, label: 'Adam', value: 'Adam' },
  { id: 3, label: 'RMSProp', value: 'RMSprop' },
];

export const losses = [
  { id: 1, label: 'MSE', value: 'MSELoss' },
  { id: 2, label: 'Cross-Entropy', value: 'CrossEntropyLoss' },
  { id: 3, label: 'L1', value: 'L1Loss' },
];

export const lrs = [
  { id: 1, label: '0.01', value: 0.01 },
  { id: 2, label: '0.02', value: 0.02 },
  { id: 3, label: '0.05', value: 0.05 },
];

export const PATH_COLORS = [
  { name: 'Red', value: '#ff0000' },
  { name: 'Green', value: '#00ff00' },
  { name: 'Yellow', value: '#ffff00' },
];
