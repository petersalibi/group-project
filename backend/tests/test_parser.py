import unittest
import json
import urllib.parse
import torch
import torch.nn as nn

from utils import parse_landscape_params, parse_minimiser_params, parse_loss, parse_optimiser
from losslandscape import LandscapeParams
from network import NetworkParams, TrainingDataType
from minimisers import MinimiserParams
from directions import VisualisationMethod

class TestParser(unittest.TestCase):
    def test_parse_loss(self):
        loss = parse_loss("MSELoss")
        self.assertIsInstance(loss, nn.MSELoss)

        loss = parse_loss("L1Loss")
        self.assertIsInstance(loss, nn.L1Loss)
    
    def test_parse_optimiser(self):
        optimiser = parse_optimiser("Adam")
        self.assertEqual(optimiser, torch.optim.Adam)

        optimiser = parse_optimiser("SGD")
        self.assertEqual(optimiser, torch.optim.SGD)

    
    def test_parse_string_landscape_params(self):
        params = """
        {
            "network": {
                "depth": 2,
                "width": 8,
                "inputs": 1,
                "outputs": 1
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

        self.assertIsInstance(lp, LandscapeParams)
        self.assertIsInstance(lp.network, NetworkParams)
        self.assertEqual(lp.method, VisualisationMethod.FILTERNORM)
        self.assertEqual(lp.data, TrainingDataType.SINREGRESSION)
        self.assertIsInstance(lp.loss, nn.MSELoss)
        self.assertEqual(lp.training_samples, 32)
        self.assertEqual(lp.surface_samples, 10)

    def test_parse_string_minimiser_params(self):
        params = """
        {
            "network": {
                "depth": 2,
                "width": 8,
                "inputs": 1,
                "outputs": 1
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

        self.assertIsInstance(mp, MinimiserParams)
        self.assertIsInstance(mp.network, NetworkParams)
        self.assertEqual(mp.data, TrainingDataType.SINREGRESSION)
        self.assertIsInstance(mp.directions[0], torch.Tensor)
        self.assertIsInstance(mp.directions[1], torch.Tensor)
        self.assertIsInstance(mp.theta_0, torch.Tensor)
        self.assertEqual(mp.init_xy, (0.0, 0.0))
        self.assertEqual(mp.learning_rate, 0.01)

    def test_parse_landscape_params_from_url_encoded_json(self):
        # build a sample params dict similar to what the frontend would send
        params = {
            "network": {
                "depth": 2,
                "width": 8,
                "inputs": 1,
                "outputs": 1
            },
            "method": "FILTERNORM",
            "data": "SINREGRESSION",
            "args": [],
            "loss": "MSELoss",
            "training_samples": 32,
            "surface_samples": 10
        }

        # simulate URL-encoding as used by the API path
        encoded = urllib.parse.quote(json.dumps(params))

        # in the API, the server will decode the path segment and json.loads it
        decoded = urllib.parse.unquote(encoded)
        parsed_dict = json.loads(decoded)

        # pass the parsed dict into the parser
        lp = parse_landscape_params(parsed_dict)

        # verify the returned object has the expected properties
        self.assertIsInstance(lp, LandscapeParams)
        self.assertIsInstance(lp.network, NetworkParams)
        self.assertEqual(lp.method, VisualisationMethod.FILTERNORM)
        self.assertEqual(lp.data, TrainingDataType.SINREGRESSION)
        self.assertIsInstance(lp.loss, nn.MSELoss)
        self.assertEqual(lp.training_samples, 32)
        self.assertEqual(lp.surface_samples, 10)

    def test_parse_landscape_params_defaults(self):
        # empty dict should use defaults
        lp = parse_landscape_params({})
        self.assertIsInstance(lp, LandscapeParams)
        self.assertEqual(lp.training_samples, 128)
        self.assertEqual(lp.surface_samples, 100)
    
    def test_parse_minimiser_params_from_url_encoded_json(self):
        # build a sample params dict similar to what the frontend would send
        params = {
            "network": {
                "depth": 2,
                "width": 8,
                "inputs": 1,
                "outputs": 1
            },
            "data": "SINREGRESSION",
            "x_direction": [[0.1, 0.2], [0.3, 0.4]],
            "y_direction": [[0.12, 0.2], [0.3, 0.4]],
            "theta_0": [[0.5, 0.6], [0.7, 0.8]],
            "init_xy": [0.0, 0.0],
            "optimiser": "Adam",
            "learning_rate": 0.01,
            "loss": "MSELoss",
            "epochs": 100,
            "lock_to_plane": True

        }

        # simulate URL-encoding as used by the API path
        encoded = urllib.parse.quote(json.dumps(params))

        # in the API, the server will decode the path segment and json.loads it
        decoded = urllib.parse.unquote(encoded)
        parsed_dict = json.loads(decoded)

        # pass the parsed dict into the parser
        mp = parse_minimiser_params(parsed_dict)

        # verify the returned object has the expected properties
        self.assertIsInstance(mp, MinimiserParams)
        self.assertIsInstance(mp.network, NetworkParams)
        self.assertEqual(mp.data, TrainingDataType.SINREGRESSION)
        self.assertIsInstance(mp.directions[0], torch.Tensor)
        self.assertIsInstance(mp.directions[1], torch.Tensor)
        self.assertIsInstance(mp.theta_0, torch.Tensor)
        self.assertEqual(mp.init_xy, (0.0, 0.0))
        self.assertEqual(mp.learning_rate, 0.01)
        self.assertIsInstance(mp.loss, nn.MSELoss)
        self.assertEqual(mp.epochs, 100)
        self.assertTrue(mp.lock_to_plane)

if __name__ == '__main__':
    unittest.main()
