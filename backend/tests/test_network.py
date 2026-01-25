import pytest
import torch
import torch.nn as nn
from network import TrainingData, NetworkParams, Model, TrainingDataType
from typing import cast


@pytest.fixture
def network_params():
    return NetworkParams(
        activation=nn.Tanh(),
        depth=2,
        width=10,
    )


def test_training_data_creation():
    # Test sin regression data generation
    n_samples = 128
    data = TrainingData(TrainingDataType.SINREGRESSION, n_samples)

    # Check shapes
    assert data.X.shape == (n_samples, 1)
    assert data.y.shape == (n_samples, 1)

    # Check value ranges
    assert torch.all(data.X >= -2)
    assert torch.all(data.X <= 2)


def test_network_params():
    # Test default parameters
    params = NetworkParams()
    assert params.depth == 2
    assert params.width == 10
    assert isinstance(params.activation, nn.Tanh)

    # Test custom parameters
    custom_params = NetworkParams(activation=nn.ReLU(), depth=3, width=20)
    assert custom_params.depth == 3
    assert custom_params.width == 20
    assert isinstance(custom_params.activation, nn.ReLU)


def test_model_creation(network_params):
    model = Model(network_params, 4, 3)

    # Test model structure
    assert isinstance(model, nn.Module)
    assert isinstance(model.net, nn.Sequential)
    # Test forward pass
    batch_size = 32
    x = torch.randn(batch_size, 4)
    output = model(x)
    assert output.shape == (batch_size, 3)


def test_model_layer_count(network_params):
    # For depth=2, we should have:
    # input layer -> activation -> hidden layer -> activation -> output layer
    model = Model(network_params, 4, 3)
    expected_layers = 5  # 3 linear layers + 2 activation layers
    assert len(model.net) == expected_layers


def test_invalid_training_data_type():
    with pytest.raises(ValueError):
        invalid_type = cast(TrainingDataType, 999)
        TrainingData(invalid_type)  # Invalid training data type
