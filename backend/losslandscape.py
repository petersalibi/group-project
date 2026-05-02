from network import *
from directions import *
from utils import *
from manifolds import *
import numpy as np
import time

class LandscapeParams:
    def __init__(self,
                 network: NetworkParams,
                 method: VisualisationMethod,
                 data: TrainingDataType,
                 args=[],
                 loss=nn.MSELoss(),
                 scale=1,
                 training_samples=128,
                 surface_samples=50,
                 rawdata=None):

        self.network = network
        self.method = method
        self.loss = loss
        self.args = args
        self.data = data
        self.scale = scale
        self.training_samples = training_samples
        self.surface_samples = surface_samples
        self.rawdata = rawdata

def generate_loss_landscape(landscape_params: LandscapeParams, verbose=False):
    # Run the autoencoder method if specified.
    if landscape_params.method == VisualisationMethod.AUTOENCODER:
        return generate_loss_manifold(landscape_params, verbose=verbose)

    data = TrainingData(landscape_params.data, landscape_params.surface_samples, landscape_params.rawdata)

    model = Model(landscape_params.network, data.inputs, data.outputs)

    dir1, dir2, projections = get_directions(model, landscape_params.method, landscape_params.args)
    
    if projections is not None:
        (pca_trajectories, fidelity) = projections
    else:
        pca_trajectories = None
        fidelity = None

    k=1.5
    pca_mean = None
    if landscape_params.method == VisualisationMethod.PCAMINIMISER:

        landscape_params.scale = [k*pca_trajectories[:, 0].min(), k*pca_trajectories[:, 0].max(),
                                  k*pca_trajectories[: , 1].min(), k*pca_trajectories[:, 1].max()]

        # args contains list of 300 weight vectors
        traj_tensors = [torch.tensor(p) for p in landscape_params.args]
        pca_mean = torch.mean(torch.stack(traj_tensors), dim=0)

    # Torch.inference_mode makes the nn not waste computation by calculating gradients
    with torch.inference_mode():
        xAxis, yAxis, loss_surface, loss_surface_log = compute_loss_surface(model, data.X, data.y,
                                                        dir1, dir2,
                                                        landscape_params.loss,
                                                        landscape_params.surface_samples,
                                                        landscape_params.scale,
                                                        verbose=verbose,
                                                        pca_mean = pca_mean)

    return {"surface": loss_surface.tolist(),
            "surface_log": loss_surface_log.tolist(),
            "x_axis": xAxis.tolist(),
            "y_axis": yAxis.tolist(),
            "x_direction": flatten_params(dir1).tolist(),
            "y_direction": flatten_params(dir2).tolist(),
            "theta_0": flatten_params(model.parameters()).tolist(),
            "proj_trajectories": pca_trajectories,
            "pca_mean" : pca_mean,
            "column_labels": data.column_labels,
            "fidelity": fidelity}

def compute_loss_surface(model, X, y, dir1, dir2, loss, samples=200, scale=10, verbose=False, pca_mean = None):

    if not ( isinstance(scale, list) or isinstance(scale, tuple) ) :
        scale = [-scale, scale, -scale, scale]

    alpha_min, alpha_max, beta_min, beta_max = scale

    if verbose:
        start = time.time()

    if pca_mean is not None:
            # This aligns the Map (0,0) with the Ball (0,0)
            set_params_from_vector(model, pca_mean)

    # backup original state
    saved = {k: v.clone() for k,v in model.state_dict().items()}

    alphas = torch.linspace(alpha_min, alpha_max, samples)
    betas  = torch.linspace(beta_min, beta_max, samples)
    loss_surface = torch.zeros(samples, samples)

    if y.ndim==1 and isinstance(loss, (torch.nn.BCELoss, torch.nn.BCEWithLogitsLoss)):
        y = y.view(-1,1).float()

    params_list = list(model.parameters())

    for i, a in enumerate(alphas):
        if verbose:
            print_progress_bar(i, samples, prefix='Progress:', suffix='Complete', length=50)

        for j, b in enumerate(betas):

            # To this:
            for (name, p), d1, d2 in zip(model.named_parameters(), dir1, dir2):
                # We take the original weight (saved[name]) and ADD the PCA offsets
                p.data.copy_(saved[name] + a*d1 + b*d2)

            loss_surface[i,j] = loss(model(X), y).item()

    if verbose:
        print_progress_bar(samples, samples, prefix='Progress:', suffix='Complete', length=50)
        print(f"\nLoss landscape computed in {time.time()-start:.2f} s.")

    loss_surface_log = torch.log1p(loss_surface - loss_surface.min() + 1e-8)
    model.load_state_dict(saved)

    return alphas, betas, loss_surface, loss_surface_log

def prepare_param_structure(model):
    params = list(model.parameters())
    shapes = [p.shape for p in params]

    # Compute flat slices
    sizes = [p.numel() for p in params]
    slices = []
    start = 0
    for sz in sizes:
        slices.append((start, start + sz))
        start += sz

    return params, shapes, slices


def compute_loss_surface_from_autoencoder(model, X, y, decoder, projected_trajectory, samples=50, latent_limits=None, loss=nn.MSELoss(), verbose=False):
    latent_limits = None
    # Latent limits is the same as our scale here
    if latent_limits is None:
        points = np.vstack(projected_trajectory) 
        x_min, y_min = points.min(axis=0)
        x_max, y_max = points.max(axis=0)
        
        # Calculate current width and height
        width = x_max - x_min
        height = y_max - y_min
        
        # Find the center point
        x_center = (x_max + x_min) / 2
        y_center = (y_max + y_min) / 2

        # Add 20%
        max_span = max(width, height) * 1.2
        half_span = max_span / 2
        
        # Set limits centered around the original data
        
        alpha_min = float(x_center - half_span)
        alpha_max = float(x_center + half_span)
        beta_min = float(y_center - half_span)
        beta_max = float(y_center + half_span)
        print(alpha_min)
        print(type(alpha_min))

    if verbose:
        start = time.time()

    # backup original state
    saved = {k: v.clone() for k,v in model.state_dict().items()}

    alphas = torch.linspace(alpha_min, alpha_max, samples)
    betas  = torch.linspace(beta_min, beta_max, samples)
    loss_surface = torch.zeros(samples, samples)

    if y.ndim==1 and isinstance(loss, (torch.nn.BCELoss, torch.nn.BCEWithLogitsLoss)):
        y = y.view(-1,1).float()

    # iterate grid
    for i, a in enumerate(alphas):
        if verbose:
            print_progress_bar(i, samples, prefix='Progress:', suffix='Complete', length=50)

        for j, b in enumerate(betas):
            # build latent point and get decoded parameter vector
            latent = torch.tensor([a.item(), b.item()], dtype=torch.float32)

            decoded = decoder(latent)
            if not isinstance(decoded, torch.Tensor):
                decoded = torch.tensor(decoded, dtype=torch.float32)

            # If decoder returned batch, take first
            if decoded.ndim > 1 and decoded.shape[0] > 1:
                decoded = decoded[0]

            # set parameters from flattened decoded vector
            set_params_from_vector(model, decoded)

            # compute loss
            with torch.no_grad():
                loss_surface[i,j] = loss(model(X), y).item()

    if verbose:
        print_progress_bar(samples, samples, prefix='Progress:', suffix='Complete', length=50)
        print(f"\nLoss landscape computed in {time.time()-start:.2f} s.")

    loss_surface_log = torch.log1p(loss_surface - loss_surface.min() + 1e-8)
    model.load_state_dict(saved)

    return alphas, betas, loss_surface, loss_surface_log


def generate_loss_manifold(landscape_params: LandscapeParams, verbose=False):
    data = TrainingData(landscape_params.data, landscape_params.surface_samples, landscape_params.rawdata)

    model = Model(landscape_params.network, data.inputs, data.outputs)

    # TODO fidelity returned as the third value
    decoder, projected_trajectories, fidelity = find_optimal_ae_manifold(model, landscape_params.args)

    # Compute surface over the provided decoder-manifold
    with torch.inference_mode():
        xAxis, yAxis, loss_surface, loss_surface_log = compute_loss_surface_from_autoencoder(
            model,
            data.X,
            data.y,
            decoder,
            projected_trajectory=projected_trajectories,
            samples=landscape_params.surface_samples,
            latent_limits=landscape_params.scale,
            loss=landscape_params.loss,
            verbose=verbose
        )

    return {"surface": loss_surface.tolist(),
            "surface_log": loss_surface_log.tolist(),
            "x_axis": xAxis.tolist(),
            "y_axis": yAxis.tolist(),
            "x_direction": None,
            "y_direction": None,
            "theta_0": flatten_params(model.parameters()).tolist(),
            "proj_trajectories": projected_trajectories,
            "column_labels": data.column_labels,
            "fidelity": fidelity}
