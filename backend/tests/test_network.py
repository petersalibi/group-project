import unittest
import torch
import torch.nn as nn
from network import TrainingData, NetworkParams, Model, TrainingDataType

class TestNetwork(unittest.TestCase):
    def setUp(self):
        self.network_params = NetworkParams(
            activation=nn.Tanh(),
            depth=2,
            width=10,
            inputs=1,
            outputs=1
        )
        
    def test_training_data_creation(self):
        # Test sin regression data generation
        n_samples = 128
        data = TrainingData(TrainingDataType.SINREGRESSION, n_samples)
        
        # Check shapes
        self.assertEqual(data.X.shape, (n_samples, 1))
        self.assertEqual(data.y.shape, (n_samples, 1))
        
        # Check value ranges
        self.assertTrue(torch.all(data.X >= -2))
        self.assertTrue(torch.all(data.X <= 2))
        
    def test_network_params(self):
        # Test default parameters
        params = NetworkParams()
        self.assertEqual(params.depth, 2)
        self.assertEqual(params.width, 10)
        self.assertEqual(params.inputs, 1)
        self.assertEqual(params.outputs, 1)
        self.assertIsInstance(params.activation, nn.Tanh)
        
        # Test custom parameters
        custom_params = NetworkParams(
            activation=nn.ReLU(),
            depth=3,
            width=20,
            inputs=2,
            outputs=1
        )
        self.assertEqual(custom_params.depth, 3)
        self.assertEqual(custom_params.width, 20)
        self.assertEqual(custom_params.inputs, 2)
        self.assertEqual(custom_params.outputs, 1)
        self.assertIsInstance(custom_params.activation, nn.ReLU)
        
    def test_model_creation(self):
        model = Model(self.network_params)
        
        # Test model structure
        self.assertIsInstance(model, nn.Module)
        self.assertIsInstance(model.net, nn.Sequential)
        
        # Test forward pass
        batch_size = 32
        x = torch.randn(batch_size, self.network_params.inputs)
        output = model(x)
        self.assertEqual(output.shape, (batch_size, self.network_params.outputs))
        
    def test_model_layer_count(self):
        # For depth=2, we should have:
        # input layer -> activation -> hidden layer -> activation -> output layer
        model = Model(self.network_params)
        expected_layers = 5  # 3 linear layers + 2 activation layers
        self.assertEqual(len(model.net), expected_layers)
        
    def test_invalid_training_data_type(self):
        with self.assertRaises(ValueError):
            TrainingData(999)  # Invalid training data type

if __name__ == '__main__':
    unittest.main()