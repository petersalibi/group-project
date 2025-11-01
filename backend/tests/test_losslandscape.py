import unittest
import torch
import torch.nn as nn
from losslandscape import LandscapeParams, generate_loss_landscape, compute_loss_surface
from network import NetworkParams, Model, TrainingDataType
from directions import VisualisationMethod

class TestLossLandscape(unittest.TestCase):
    def setUp(self):
        self.network_params = NetworkParams()
        self.landscape_params = LandscapeParams(
            network=self.network_params,
            method=VisualisationMethod.FILTERNORM,
            data=TrainingDataType.SINREGRESSION,
            loss=nn.MSELoss(),
            training_samples=32,  # Smaller sample size for testing
            surface_samples=10    # Smaller surface samples for testing
        )
        
    def test_landscape_params_creation(self):
        params = self.landscape_params
        self.assertIsInstance(params.network, NetworkParams)
        self.assertEqual(params.method, VisualisationMethod.FILTERNORM)
        self.assertEqual(params.data, TrainingDataType.SINREGRESSION)
        self.assertIsInstance(params.loss, nn.MSELoss)
        self.assertEqual(params.training_samples, 32)
        self.assertEqual(params.surface_samples, 10)
        
    def test_generate_loss_landscape(self):
        result = generate_loss_landscape(self.landscape_params)
        
        # Check if result contains required keys
        self.assertIn('surface', result)
        self.assertIn('xAxis', result)
        self.assertIn('yAxis', result)
        
        # Check dimensions
        self.assertEqual(len(result['xAxis']), self.landscape_params.surface_samples)
        self.assertEqual(len(result['yAxis']), self.landscape_params.surface_samples)
        self.assertEqual(len(result['surface']), self.landscape_params.surface_samples)
        self.assertEqual(len(result['surface'][0]), self.landscape_params.surface_samples)
        
    def test_compute_loss_surface(self):
        model = Model(self.network_params)
        data = torch.randn(32, 1)  # Random input data
        target = torch.randn(32, 1)  # Random target data
        loss_fn = nn.MSELoss()
        
        # Create dummy directions (same shape as model parameters)
        dir1 = [torch.randn_like(p) for p in model.parameters()]
        dir2 = [torch.randn_like(p) for p in model.parameters()]
        
        samples = 5  # Small number for testing
        alphas, betas, loss_surface = compute_loss_surface(
            model, data, target, dir1, dir2, loss_fn, samples=samples
        )
        
        # Check shapes
        self.assertEqual(alphas.shape, (samples,))
        self.assertEqual(betas.shape, (samples,))
        self.assertEqual(loss_surface.shape, (samples, samples))
        
        # Check value ranges
        self.assertTrue(torch.all(loss_surface >= 0))  # Loss should be non-negative
        self.assertTrue(torch.all(loss_surface <= 300))  # Max loss parameter
        
    def test_model_state_preservation(self):
        # Test that compute_loss_surface doesn't permanently modify the model
        model = Model(self.network_params)
        original_state = {k: v.clone() for k, v in model.state_dict().items()}
        
        data = torch.randn(32, 1)
        target = torch.randn(32, 1)
        loss_fn = nn.MSELoss()
        
        dir1 = [torch.randn_like(p) for p in model.parameters()]
        dir2 = [torch.randn_like(p) for p in model.parameters()]
        
        _ = compute_loss_surface(model, data, target, dir1, dir2, loss_fn, samples=5)
        
        # Check if model parameters are restored
        for (k1, v1), (k2, v2) in zip(model.state_dict().items(), original_state.items()):
            self.assertTrue(torch.allclose(v1, v2))

if __name__ == '__main__':
    unittest.main()