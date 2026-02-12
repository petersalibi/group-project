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
    X = torch.stack(trajectory_tensors).cpu().numpy()

    Raise NotImplementedError("This function is a placeholder. You should implement it to find the optimal autoencoder manifold from the minimiser trajectories.")

    # TODO: Implement this function to find the optimal 2D autoencoder manifold that best captures the minimiser trajectories.
    # return the decoder of the trained autoencoder, and the projected trajectories in the latent space (for visualization).