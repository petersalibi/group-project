export const activations = [
  { id: 1, label: 'ReLU', value: 'ReLU' },
  { id: 2, label: 'Tanh', value: 'Tanh' },
  { id: 3, label: 'Sigmoid', value: 'Sigmoid' },
  { id: 4, label: 'LeakyReLU', value: 'LeakyReLU' },
];

export const methods = [
  { id: 1, label: 'Random Directions', value: 'RANDOMDIRS' },
  { id: 2, label: 'Filter-wise Normalised Directions', value: 'FILTERNORM' },
  // { id: 3, label: 'Two Parameters', value: 'TWOPARAMETERS'},
  // { id: 4, label: 'PCA Directions', value: 'PCAMINIMISER' },
];

export const dataSets = [
  { id: 1, label: 'Sine Regression', value: 'SINREGRESSION' },
  { id: 2, label: 'Penguins', value: 'PENGUINS' },
  { id: 3, label: 'Purple Colours', value: 'PURPLECOLOURS' },
  { id: 4, label: 'Custom', value: 'CUSTOM'}
];

export const datasetFeatures: Record<string, number> = {
  SINREGRESSION: 1,
  PENGUINS: 4,
  PURPLECOLOURS: 3,
};

export const datasetOutputs: Record<string, number> = {
  SINREGRESSION: 1,
  PENGUINS: 3,
  PURPLECOLOURS: 1,
};

export const optimisers = [
  { id: 1, label: 'SGD', value: 'SGD' },
  { id: 2, label: 'Adam', value: 'Adam' },
  { id: 3, label: 'RMSProp', value: 'RMSprop' },
];

export const allLosses= [
  { id: 1, label: 'MSE', value: 'MSELoss' },
  { id: 2, label: 'L1', value: 'L1Loss' },
  { id: 3, label: 'Cross-Entropy', value: 'CrossEntropyLoss' },
  { id: 4, label: 'Binary Cross-Entropy', value: 'BCELoss' }
]
export const regLosses = [
  { id: 1, label: 'MSE', value: 'MSELoss' },
  { id: 2, label: 'L1', value: 'L1Loss' },
]
export const ceLoss = [{ id: 1, label: 'Cross-Entropy', value: 'CrossEntropyLoss' }]
export const bceLoss = [{ id: 1, label: 'Binary Cross-Entropy', value: 'BCELoss' }]

export const lrs = [
  { id: 1, label: '0.01', value: 0.01 },
  { id: 2, label: '0.02', value: 0.02 },
  { id: 3, label: '0.05', value: 0.05 },
];

export const gradientPresets = [
  { id: 'rainbow', colors: ['#9333ea', '#3b82f6', '#22d3ee', '#4ade80', '#eab308', '#ef4444'] },
  { id: 'brand',   colors: ['#4F57A9', '#7FA1C3', '#A1B5D8', '#C3E0C8', '#D4F0A6', '#C6F382'] },
  { id: 'heat',    colors: ['#ffffff', '#facc15', '#f97316', '#dc2626', '#450a0a', '#000000' ] },
  { id: 'plasma',  colors: ['#0d0887', '#6a00a8', '#b12a90', '#e16462', '#fca636', '#f0f921'] },
];

export const PATH_COLORS = [
  { name: 'Red', value: '#ff0000' },
  { name: 'Green', value: '#00ff00' },
  { name: 'Yellow', value: '#ffff00' },
  { name: 'Blue', value: '#0000ff' },
  { name: 'Purple', value: '#800080' },
];