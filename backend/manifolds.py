import torch
import torch.nn as nn
from network import *
from utils import *

# This is where we'll put our autoencoder-based loss manifold code.
# It will be called by `generate_loss_landscape` if the method is set to AUTOENCODER.

# Finds the optimal autoencoder manifold from a minimising trajectory.
def find_optimal_ae_manifold(model, minimiser_trajectories):

    # Convert List[List[float]] to Tensor
    trajectory_tensors = [
        torch.tensor(p, dtype=torch.float32)
        for p in minimiser_trajectories
    ]

    # Stack into a single tensor of shape (num_points, param_size)
    X = torch.stack(trajectory_tensors).cpu()

    epochs = 5
    loss_function = nn.MSELoss()
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    auto_encoder = UniformAutoencoder(X.shape[1], 5, 2)
    auto_encoder.to(device)
    optimizer = optim.Adam(auto_encoder.parameters(), lr=1e-3, weight_decay=1e-8)
    print(auto_encoder)

    auto_encoder.train()
    for _ in range(epochs):
        # for point in trajectory_tensors:
        reconstructed, _ = auto_encoder(X)
        print(type(reconstructed), reconstructed)
        loss = loss_function(reconstructed, X)

        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

    auto_encoder.eval()
    # raise NotImplementedError("This function is a placeholder. You should implement it to find the optimal autoencoder manifold from the minimiser trajectories.")
    projected_trajectories = auto_encoder.encoder(X).detach().cpu().numpy().tolist()
    print(f"Projected trajectories in latent space: {projected_trajectories}")
    return auto_encoder.decoder, projected_trajectories

    # TODO: Implement this function to find the optimal 2D autoencoder manifold that best captures the minimiser trajectories.
    # return the decoder of the trained autoencoder, and the projected trajectories in the latent space (for visualization).
   # If you want to test this function, run plot.py and it will call this function with minimiser trajectories.


def get_hidden_layer_sizes(num_of_inputs, num_of_outputs, num_of_layers):
    if num_of_layers < 2:
        raise ValueError("The number of layers must be at least 2.")
    if num_of_layers < num_of_layers:
        raise ValueError("Input size must be greater than or equal to the output size.")

    layer_sizes = np.logspace(np.log10(num_of_inputs), np.log10(num_of_outputs), num_of_layers+2, dtype=int)

    return layer_sizes.tolist()

class Encoder(nn.Module):
    def __init__(self, input_dim, hidden_dims, latent_dim):
        super(Encoder, self).__init__()

        self.fcs = [nn.Linear(input_dim, hidden_dims[1]), nn.LayerNorm(hidden_dims[1]), nn.ReLU()]

        for i in range(1, len(hidden_dims)-2):
            self.fcs.append(nn.Linear(hidden_dims[i], hidden_dims[i+1]))
            self.fcs.append(nn.LayerNorm(hidden_dims[i+1]))
            self.fcs.append(nn.ReLU())
        self.fcs.append(nn.Linear(hidden_dims[-2], latent_dim))

        self.fcs = nn.Sequential(*self.fcs)

    def forward(self, x):
        x = self.fcs(x)
        z = torch.tanh(x)
        return z

class Decoder(nn.Module):
    def __init__(self, latent_dim, hidden_dims, output_dim):
        super(Decoder, self).__init__()

        self.fcs = [nn.Linear(latent_dim, hidden_dims[1]), nn.LayerNorm(hidden_dims[1]), nn.ReLU()]

        for i in range(1, len(hidden_dims)-2):
            self.fcs.append(nn.Linear(hidden_dims[i], hidden_dims[i+1]) )
            self.fcs.append(nn.LayerNorm(hidden_dims[i+1]))
            self.fcs.append(nn.ReLU())
        self.fcs.append(nn.Linear(hidden_dims[-2], output_dim))

        self.fcs = nn.Sequential(*self.fcs)

    def forward(self, x):
        x = self.fcs(x)
        z=x
        return z


class UniformAutoencoder(nn.Module):
    def __init__(self, input_dim, num_of_layers, latent_dim, h=None):
        super(UniformAutoencoder, self).__init__()
        if h is None:
            h = get_hidden_layer_sizes(input_dim, latent_dim, num_of_layers)
        self.encoder = Encoder(input_dim, h, latent_dim)
        self.decoder = Decoder(latent_dim, list(reversed(h)), input_dim)

    def forward(self, x):
        z = self.encoder(x)
        x_recon = self.decoder(z)
        return x_recon, z
