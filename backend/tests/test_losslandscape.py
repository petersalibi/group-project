import pytest
import torch
import torch.nn as nn
from losslandscape import LandscapeParams, generate_loss_landscape, compute_loss_surface
from network import NetworkParams, Model, TrainingDataType
from directions import VisualisationMethod


@pytest.fixture
def landscape_params():
    network_params = NetworkParams()
    return LandscapeParams(
        network=network_params,
        method=VisualisationMethod.FILTERNORM,
        data=TrainingDataType.SINREGRESSION,
        loss=nn.MSELoss(),
        training_samples=32,  # Smaller sample size for testing
        surface_samples=10,  # Smaller surface samples for testing
    )


def test_landscape_params_creation(landscape_params):
    params = landscape_params
    assert isinstance(params.network, NetworkParams)
    assert params.method == VisualisationMethod.FILTERNORM
    assert params.data == TrainingDataType.SINREGRESSION
    assert isinstance(params.loss, nn.MSELoss)
    assert params.training_samples == 32
    assert params.surface_samples == 10


def test_generate_loss_landscape(landscape_params):
    params = landscape_params
    result = generate_loss_landscape(params)

    # Check if result contains required keys
    assert "surface" in result
    assert "x_axis" in result
    assert "y_axis" in result

    # Check dimensions
    assert len(result["x_axis"]) == params.surface_samples
    assert len(result["y_axis"]) == params.surface_samples
    assert len(result["surface"]) == params.surface_samples
    assert len(result["surface"][0]) == params.surface_samples


@pytest.mark.parametrize("in_size, out_size", [(1, 1), (4, 3), (3, 1)])
def test_compute_loss_surface(landscape_params, in_size, out_size):
    model = Model(landscape_params.network, in_size, out_size)
    data = torch.randn(32, in_size)  # Random input data
    target = torch.randn(32, out_size)  # Random target data
    loss_fn = nn.MSELoss()

    # Create dummy directions (same shape as model parameters)
    dir1 = [torch.randn_like(p) for p in model.parameters()]
    dir2 = [torch.randn_like(p) for p in model.parameters()]

    samples = 5  # Small number for testing
    alphas, betas, loss_surface, loss_surface_log = compute_loss_surface(
        model, data, target, dir1, dir2, loss_fn, samples=samples
    )

    # Check shapes
    assert alphas.shape == (samples,)
    assert betas.shape == (samples,)
    assert loss_surface.shape == (samples, samples)

    # Check value ranges
    assert torch.all(loss_surface >= 0)  # Loss should be non-negative
    assert torch.isfinite(loss_surface).all()  # Loss should be finite
    assert torch.all(loss_surface_log >= 0)  # Log loss should be non-negative
    assert torch.isfinite(loss_surface_log).all()  # Log loss should be finite


def test_model_state_preservation(landscape_params):
    # Test that compute_loss_surface doesn't permanently modify the model
    model = Model(landscape_params.network, 1, 1)
    original_state = {k: v.clone() for k, v in model.state_dict().items()}

    data = torch.randn(32, 1)
    target = torch.randn(32, 1)
    loss_fn = nn.MSELoss()

    dir1 = [torch.randn_like(p) for p in model.parameters()]
    dir2 = [torch.randn_like(p) for p in model.parameters()]

    compute_loss_surface(model, data, target, dir1, dir2, loss_fn, samples=5)

    # Check if model parameters are restored
    for (k1, v1), (k2, v2) in zip(model.state_dict().items(), original_state.items()):
        assert torch.allclose(v1, v2)
