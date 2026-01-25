import pytest
import json
import urllib.parse
import torch
import torch.nn as nn
import torch.optim as optim

from utils import (
    parse_landscape_params,
    parse_minimiser_params,
    parse_loss,
    parse_optimiser,
)
from losslandscape import LandscapeParams
from network import NetworkParams, TrainingDataType
from minimisers import MinimiserParams
from directions import VisualisationMethod


@pytest.mark.parametrize(
    "loss_name, expected_class",
    [
        ("MSELoss", nn.MSELoss),
        ("CrossEntropyLoss", nn.CrossEntropyLoss),
        ("BCELoss", nn.BCEWithLogitsLoss),
        ("L1Loss", nn.L1Loss),
    ],
)
def test_parse_loss(loss_name, expected_class):
    loss = parse_loss(loss_name)
    assert isinstance(loss, expected_class)


@pytest.mark.parametrize(
    "optimiser_name, expected_class",
    [
        ("Adam", optim.Adam),
        ("SGD", optim.SGD),
        ("RMSprop", optim.RMSprop),
    ],
)
def test_parse_optimiser(optimiser_name, expected_class):
    optimiser = parse_optimiser(optimiser_name)
    assert optimiser == expected_class


def test_parse_string_landscape_params():
    params = """
    {
        "network": {
            "depth": 2,
            "width": 8
        },
        "method": "FILTERNORM",
        "data": "SINREGRESSION",
        "args": [],
        "loss": "MSELoss",
        "training_samples": 32,
        "surface_samples": 10
    }
    """
    params_dict = json.loads(params)
    lp = parse_landscape_params(params_dict)

    assert isinstance(lp, LandscapeParams)
    assert isinstance(lp.network, NetworkParams)
    assert lp.method == VisualisationMethod.FILTERNORM
    assert lp.data == TrainingDataType.SINREGRESSION
    assert isinstance(lp.loss, nn.MSELoss)
    assert lp.training_samples == 32
    assert lp.surface_samples == 10


def test_parse_string_minimiser_params():
    params = """
    {
        "network": {
            "depth": 2,
            "width": 8
        },
        "data": "SINREGRESSION",
        "directions": [[0.1, 0.2], [0.3, 0.4]],
        "theta_0": [[0.5, 0.6], [0.7, 0.8]],
        "init_xy": [0.0, 0.0],
        "optimiser": "Adam",
        "learning_rate": 0.01,
        "loss": "MSELoss",
        "epochs": 100
    }
    """
    params_dict = json.loads(params)
    mp = parse_minimiser_params(params_dict)

    assert isinstance(mp, MinimiserParams)
    assert isinstance(mp.network, NetworkParams)
    assert mp.data == TrainingDataType.SINREGRESSION
    assert isinstance(mp.directions[0], torch.Tensor)
    assert isinstance(mp.directions[1], torch.Tensor)
    assert isinstance(mp.theta_0, torch.Tensor)
    assert mp.init_xy == (0.0, 0.0)
    assert mp.learning_rate == 0.01


def test_parse_landscape_params_from_url_encoded_json():
    # build a sample params dict similar to what the frontend would send
    params = {
        "network": {"depth": 2, "width": 8},
        "method": "FILTERNORM",
        "data": "SINREGRESSION",
        "args": [],
        "loss": "MSELoss",
        "training_samples": 32,
        "surface_samples": 10,
    }

    # simulate URL-encoding as used by the API path
    encoded = urllib.parse.quote(json.dumps(params))

    # in the API, the server will decode the path segment and json.loads it
    decoded = urllib.parse.unquote(encoded)
    parsed_dict = json.loads(decoded)

    # pass the parsed dict into the parser
    lp = parse_landscape_params(parsed_dict)

    # verify the returned object has the expected properties
    assert isinstance(lp, LandscapeParams)
    assert isinstance(lp.network, NetworkParams)
    assert lp.method == VisualisationMethod.FILTERNORM
    assert lp.data == TrainingDataType.SINREGRESSION
    assert isinstance(lp.loss, nn.MSELoss)
    assert lp.training_samples == 32
    assert lp.surface_samples == 10


def test_parse_landscape_params_defaults():
    # empty dict should use defaults
    lp = parse_landscape_params({})
    assert isinstance(lp, LandscapeParams)
    assert lp.training_samples == 128
    assert lp.surface_samples == 100


def test_parse_minimiser_params_from_url_encoded_json():
    # build a sample params dict similar to what the frontend would send
    params = {
        "network": {"depth": 2, "width": 8},
        "data": "SINREGRESSION",
        "x_direction": [[0.1, 0.2], [0.3, 0.4]],
        "y_direction": [[0.12, 0.2], [0.3, 0.4]],
        "theta_0": [[0.5, 0.6], [0.7, 0.8]],
        "init_xy": [0.0, 0.0],
        "optimiser": "Adam",
        "learning_rate": 0.01,
        "loss": "MSELoss",
        "epochs": 100,
        "lock_to_plane": True,
    }

    # simulate URL-encoding as used by the API path
    encoded = urllib.parse.quote(json.dumps(params))

    # in the API, the server will decode the path segment and json.loads it
    decoded = urllib.parse.unquote(encoded)
    parsed_dict = json.loads(decoded)

    # pass the parsed dict into the parser
    mp = parse_minimiser_params(parsed_dict)

    # verify the returned object has the expected properties
    assert isinstance(mp, MinimiserParams)
    assert isinstance(mp.network, NetworkParams)
    assert mp.data == TrainingDataType.SINREGRESSION
    assert isinstance(mp.directions[0], torch.Tensor)
    assert isinstance(mp.directions[1], torch.Tensor)
    assert isinstance(mp.theta_0, torch.Tensor)
    assert mp.init_xy == (0.0, 0.0)
    assert mp.learning_rate == 0.01
    assert isinstance(mp.loss, nn.MSELoss)
    assert mp.epochs == 100
    assert mp.lock_to_plane is True
