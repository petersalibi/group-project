import torch
import numpy as np
import pandas as pd
from pathlib import Path

def parse_loss(loss: str):
    import torch.nn as nn

    loss_mapping = {
        "MSELoss": nn.MSELoss(),
        "CrossEntropyLoss": nn.CrossEntropyLoss(),
        "BCELoss": nn.BCEWithLogitsLoss(), # WITH LOGITS - to apply sigmoid internally for prob. distributions
        "L1Loss": nn.L1Loss()
    }

    if loss in loss_mapping:
        return loss_mapping[loss]
    else:
        raise ValueError(f"Unsupported loss function: {loss}")

def parse_optimiser(optimiser: str):
    import torch.optim as optim

    optimiser_mapping = {
        "SGD": optim.SGD,
        "Adam": optim.Adam,
        "RMSprop": optim.RMSprop
    }

    if optimiser in optimiser_mapping:
        return optimiser_mapping[optimiser]
    else:
        raise ValueError(f"Unsupported optimiser: {optimiser}")

def parse_activation(activation: str):
    import torch.nn as nn

    activation_mapping = {
        "ReLU": nn.ReLU(),
        "Tanh": nn.Tanh(),
        "Sigmoid": nn.Sigmoid(),
        "LeakyReLU": nn.LeakyReLU()
    }

    if activation in activation_mapping:
        return activation_mapping[activation]
    else:
        raise ValueError(f"Unsupported activation function: {activation}")

def parse_network_params(params: dict):
    from network import NetworkParams

    try:
        activation = parse_activation(params.get("activation", "Tanh"))
        depth = params.get("depth", 2)
        width = params.get("width", 10)

        network_params = NetworkParams(
            activation=activation,
            depth=depth,
            width=width
        )
        return network_params
    except Exception as e:
        raise ValueError(f"Error parsing network parameters: {e}")

def parse_landscape_params(params: dict):
    from losslandscape import LandscapeParams, NetworkParams, VisualisationMethod, TrainingDataType

    try:
        network_params = parse_network_params(params.get("network", {}))
        method = VisualisationMethod[params.get("method", "FILTERNORM")]
        data_type = TrainingDataType[params.get("data", "SINREGRESSION")]
        args = params.get("args", [])
        loss = parse_loss(params.get("loss", "MSELoss"))
        scale = params.get("scale", 1)
        training_samples = params.get("training_samples", 128)
        surface_samples = params.get("surface_samples", 100)
        rawdata = params.get("rawdata", None)
        landscape_params = LandscapeParams(
            network=network_params,
            method=method,
            data=data_type,
            args=args,
            loss=loss,
            scale=scale,
            training_samples=training_samples,
            surface_samples=surface_samples,
            rawdata=rawdata
        )
        return landscape_params
    except Exception as e:
        raise ValueError(f"Error parsing landscape parameters: {e}")

def parse_minimiser_params(params: dict):
    from minimisers import MinimiserParams, NetworkParams, TrainingDataType
    import torch

    try:
        network_params = parse_network_params(params.get("network", {}))
        data_type = TrainingDataType[params.get("data", "SINREGRESSION")]

        x_direction = torch.tensor(params.get("x_direction", torch.randn(100).tolist()))
        y_direction = torch.tensor(params.get("y_direction", torch.randn(100).tolist()))

        theta_0 = torch.tensor(params.get("theta_0", torch.randn(100).tolist()))
        init_xy = tuple(params.get("init_xy", (0.0, 0.0)))
        optimiser = parse_optimiser(params.get("optimiser", "Adam"))
        learning_rate = params.get("learning_rate", 0.01)
        loss = parse_loss(params.get("loss", "MSELoss"))
        epochs = params.get("epochs", 300)
        lock_to_plane = params.get("lock_to_plane", False)
        rawdata = params.get("rawdata", None)

        minimiser_params = MinimiserParams(
            network=network_params,
            data=data_type,
            x_direction=x_direction,
            y_direction=y_direction,
            theta_0=theta_0,
            init_xy=init_xy,
            optimiser=optimiser,
            loss=loss,
            learning_rate=learning_rate,
            epochs=epochs,
            lock_to_plane=lock_to_plane,
            rawdata=rawdata
        )
        return minimiser_params
    except Exception as e:
        raise ValueError(f"Error parsing minimiser parameters: {e}")

# Convert csv data to torch tensors and data parameters
# Assume last column are the training labels
# Numeric data is treated as float32, categorical data as long
# String data converted to categorical codes first
# Returns X, y tensors and input/output dimensions
def rawdata_to_training_data(rawdata: str):
    # convert raw CSV string to pandas DataFrame
    from io import StringIO
    df = pd.read_csv(StringIO(rawdata)).dropna()
    
    # Convert numeric string columns to float
    for col in df.columns[:-1]:
        if df[col].dtype == 'object':
            try:
                pd.to_numeric(df[col], errors='raise')
                df[col] = df[col].astype(float)
            except ValueError:
                pass  # leave as object for categorical
    
    # Build X column by column
    X_list = []
    for col in df.columns[:-1]:
        if df[col].dtype == 'object':
            # Categorical: one-hot encode
            col_data = pd.Categorical(df[col])
            one_hot = pd.get_dummies(col_data).values
            for i in range(one_hot.shape[1]):
                X_list.append(one_hot[:, i])
        else:
            # Numeric: keep as is
            X_list.append(df[col].values)
    
    X = np.column_stack(X_list)
    
    y = df.iloc[:, -1]
    
    # Now create the tensor (X is fully numeric)
    X_tensor = torch.tensor(X, dtype=torch.float32)
    
    # Handle y (labels)
    if y.dtype == 'object' or pd.api.types.is_categorical_dtype(y):
        y_cat = y.astype('category')
        codes = y_cat.cat.codes.values
        y_tensor = torch.tensor(codes, dtype=torch.long)
    else:
        y_tensor = torch.tensor(y.values, dtype=torch.float32)
    
    inputs = X_tensor.shape[1]
    outputs = len(pd.unique(y)) if y.dtype == 'object' or pd.api.types.is_categorical_dtype(y) else 1
    
    return X_tensor, y_tensor, inputs, outputs