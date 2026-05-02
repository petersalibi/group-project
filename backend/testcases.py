from losslandscape import LandscapeParams, VisualisationMethod, TrainingDataType
from minimisers import MinimiserParams
from network import NetworkParams
import torch.nn as nn

# Sine Regression, 4 Hidden Layers, 10 Width
regression_params_basic = LandscapeParams(
        NetworkParams(depth=4, activation=nn.Tanh(), width=10),
        VisualisationMethod.RANDOMDIRS,
        TrainingDataType.SINREGRESSION,
        loss=nn.MSELoss(), scale=1
    )

# Sine Regression, 1 Hidden Layer, 32 Width, Tanh Activation
regression_params_wide = LandscapeParams(
        NetworkParams(depth=2, activation=nn.Tanh(), width=32),
        VisualisationMethod.RANDOMDIRS, 
        TrainingDataType.SINREGRESSION, 
        loss=nn.MSELoss(), scale=1
    )

# Sine Regression, 10 Hidden Layers, 5 Width, Tanh Activation
regression_params_deep = LandscapeParams(
        NetworkParams(depth=10, activation=nn.Tanh(), width=5),
        VisualisationMethod.RANDOMDIRS,
        TrainingDataType.SINREGRESSION,
        loss=nn.MSELoss(), scale=1
    )

# Sine Regression, 6 Hidden Layers, 50 Width, ReLU Activation
regression_params_complex = LandscapeParams(
        NetworkParams(depth=6, activation=nn.ReLU(), width=50),
        VisualisationMethod.RANDOMDIRS,
        TrainingDataType.SINREGRESSION,
        loss=nn.MSELoss(), scale=1
    )

penguin_params_complex = LandscapeParams(
    NetworkParams(depth = 6, activation=nn.ReLU(), width=50),
                  VisualisationMethod.FILTERNORM,
                  TrainingDataType.PENGUINS,
                  loss = nn.CrossEntropyLoss(), scale = 1
    )

# Purple Colours Classification, 1 Layer, Sigmoid Activation
purple_classification_params = LandscapeParams(
        NetworkParams(depth=1, activation=nn.Sigmoid(), width=1),
        VisualisationMethod.TWOPARAMETERS,
        TrainingDataType.PURPLECOLOURS,
        args=[1, 2], # GREEN and BLUE channels
        loss=nn.BCEWithLogitsLoss(), scale=1
    )

def params_to_pca(params: LandscapeParams, minimiser_trajectories):
    return LandscapeParams(
        network=params.network,
        method=VisualisationMethod.PCAMINIMISER,
        data=params.data,
        args=minimiser_trajectories,
        loss=params.loss,
        scale=params.scale,
        training_samples=params.training_samples,
        surface_samples=params.surface_samples
    )

def params_to_ae(params: LandscapeParams, minimiser_trajectories):
    return LandscapeParams(
        network=params.network,
        method=VisualisationMethod.AUTOENCODER,
        data=params.data,
        args=minimiser_trajectories,
        loss=params.loss,
        scale=params.scale,
        training_samples=params.training_samples,
        surface_samples=params.surface_samples
    )