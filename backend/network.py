import torch
import torch.nn as nn
import torch.optim as optim
import parse
from enum import Enum

class TrainingDataType(Enum):
    SINREGRESSION = 0
    PENGUINS      = 1
    PURPLECOLOURS = 2
    CUSTOM        = 3

class TrainingData:

    def __init__(self, X, y):
        self.X = X
        self.y = y
    
    def __init__(self, type: TrainingDataType, n_samples=128):
        # set seeds for reproducibility
        torch.manual_seed(1066)

        match type:
            case TrainingDataType.SINREGRESSION:
                self.X = torch.unsqueeze(torch.linspace(-2, 2, n_samples), 1)
                self.y = torch.sin(3*self.X) + 0.3*torch.randn_like(self.X)

                self.inputs = 1
                self.outputs = 1
            case TrainingDataType.PENGUINS:

                import pandas as pd
                from pathlib import Path
                url = str(Path(__file__).resolve().parent.joinpath("data", "training", "penguins.csv"))
                df = pd.read_csv(url).dropna()
            
                X = df[['bill_length_mm', 'bill_depth_mm', 'flipper_length_mm', 'body_mass_g']].values
                # Convert species to categorical codes, then to one-hot vectors
                species_cat = df['species'].astype('category')
                codes = species_cat.cat.codes.values
                num_classes = len(species_cat.cat.categories)

                self.X = torch.tensor(X, dtype=torch.float32)
                self.y = torch.tensor(codes, dtype=torch.long)

                # set input/output dimensions for this dataset
                self.inputs = self.X.shape[1]
                self.outputs = num_classes
            
            case TrainingDataType.PURPLECOLOURS:

                import pandas as pd
                from pathlib import Path
                url = str(Path(__file__).resolve().parent.joinpath("data", "training", "purple_colours.csv"))
                df = pd.read_csv(url).dropna()

                X = df[['R', 'G', 'B']].values
                y = df['is_purple'].values

                self.X = torch.tensor(X, dtype=torch.float32)
                self.y = torch.tensor(y, dtype=torch.long)

                self.inputs = self.X.shape[1]
                self.outputs = 1
            
            case TrainingDataType.CUSTOM:
                self.X, self.y, self.inputs, self.outputs = csv_to_training_data("custom_dataset.csv")

            case _:
                raise ValueError("Training Data Type Not Found!")

class NetworkParams:

    def __init__(self, activation=nn.Tanh(), depth=2, width=10):
        self.activation = activation
        self.depth = depth
        self.width = width

class Model(nn.Module):
    def __init__(self, params: NetworkParams, inputs, outputs):
        # set seeds for reproducibility
        torch.manual_seed(1066)

        super(Model, self).__init__()

        if params.depth == 1:
            layers = nn.Sequential(
                nn.Linear(inputs, outputs)
            )
            self.net = layers
        else:
            layers = nn.Sequential(
                nn.Linear(inputs, params.width),
                params.activation,
                nn.Linear(params.width, outputs)
            )

            for _ in range(params.depth-1):
                layers.insert(1, nn.Linear(params.width, params.width))
                layers.insert(1, params.activation)
            
            self.net = layers

    def forward(self, x):
        return self.net(x)

def generate_purple_colours_data(n_samples=100, zero_centered=False):
    # Generate random RGB colours
    X_purple = torch.rand(n_samples // 2, 3) * torch.tensor([0.5, 0.5, 0.5]) + torch.tensor([0.5, 0.0, 0.5])
    X_non_purple = torch.rand(n_samples // 2, 3) * torch.tensor([0.5, 1, 0.5])
    X = torch.cat([X_purple, X_non_purple], dim=0)
    # Define purple as having high red and blue, low green
    if zero_centered:
        y = ((X[:, 0] > 0.5) & (X[:, 2] > 0.5) & (X[:, 1] < 0.5)).float() * 2 - 1
    else:
        y = ((X[:, 0] > 0.5) & (X[:, 2] > 0.5) & (X[:, 1] < 0.5)).long()
    return X, y

def generate_purples_csv(n_samples=100):
    import pandas as pd
    from pathlib import Path

    X, y = generate_purple_colours_data(n_samples, zero_centered=False)
    df = pd.DataFrame(X.numpy(), columns=['R', 'G', 'B'])
    df['is_purple'] = y.numpy()

    url = str(Path(__file__).resolve().parent.joinpath("data", "training", "purple_colours.csv"))
    df.to_csv(url, index=False)

# generate_purples_csv(100)