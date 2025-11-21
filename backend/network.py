import torch
import torch.nn as nn
import torch.optim as optim
from enum import Enum

class TrainingDataType(Enum):
    SINREGRESSION = 0
    PENGUINS = 1

class TrainingData:

    def __init__(self, X, y):
        self.X = X
        self.y = y
    
    def __init__(self, type: TrainingDataType, n_samples=128):
        match type:
            case TrainingDataType.SINREGRESSION:
                self.X = torch.unsqueeze(torch.linspace(-2, 2, n_samples), 1)
                self.y = torch.sin(3*self.X) + 0.3*torch.randn_like(self.X)
            case TrainingDataType.PENGUINS:

                import pandas as pd
                from pathlib import Path
                url = str(Path(__file__).resolve().parent.joinpath("data", "training", "penguins.csv"))
                df = pd.read_csv(url).dropna()
            
                X = df[['bill_length_mm', 'bill_depth_mm', 'flipper_length_mm', 'body_mass_g']].values
                y = df['species'].astype('category').cat.codes.values
                self.X = torch.tensor(X, dtype=torch.float32)
                self.y = torch.tensor(y, dtype=torch.long).unsqueeze(1)

            case _:
                raise ValueError("Training Data Type Not Found!")

class NetworkParams:

    def __init__(self, activation=nn.Tanh(), depth=2, width=10, inputs=1, outputs=1):
        self.activation = activation
        self.depth = depth
        self.width = width
        self.inputs = inputs
        self.outputs = outputs

class Model(nn.Module):
    def __init__(self, params: NetworkParams):
        super(Model, self).__init__()

        layers = nn.Sequential(
            nn.Linear(params.inputs, params.width),
            params.activation,
            nn.Linear(params.width, params.outputs)
        )

        for _ in range(params.depth-1):
            layers.insert(1, nn.Linear(params.width, params.width))
            layers.insert(1, params.activation)
        
        self.net = layers

    def forward(self, x):
        return self.net(x)