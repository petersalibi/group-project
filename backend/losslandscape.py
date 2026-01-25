from network import *
from directions import *
from utils import *
import numpy as np
import time


class LandscapeParams:
    def __init__(
        self,
        network: NetworkParams,
        method: VisualisationMethod,
        data: TrainingDataType,
        args=[],
        loss=nn.MSELoss(),
        scale=1,
        training_samples=128,
        surface_samples=50,
    ):
        self.network = network
        self.method = method
        self.loss = loss
        self.args = args
        self.data = data
        self.scale = scale
        self.training_samples = training_samples
        self.surface_samples = surface_samples


def generate_loss_landscape(landscape_params: LandscapeParams, verbose=False):
    data = TrainingData(landscape_params.data, landscape_params.surface_samples)

    model = Model(landscape_params.network, data.inputs, data.outputs)
    dir1, dir2 = get_directions(model, landscape_params.method, landscape_params.args)

    # Torch.inference_mode makes the nn not waste computation by calculating gradients
    with torch.inference_mode():
        xAxis, yAxis, loss_surface, loss_surface_log = compute_loss_surface(
            model,
            data.X,
            data.y,
            dir1,
            dir2,
            landscape_params.loss,
            landscape_params.surface_samples,
            landscape_params.scale,
            verbose=verbose,
        )

    return {
        "surface": loss_surface.tolist(),
        "surface_log": loss_surface_log.tolist(),
        "x_axis": xAxis.tolist(),
        "y_axis": yAxis.tolist(),
        "x_direction": flatten_params(dir1).tolist(),
        "y_direction": flatten_params(dir2).tolist(),
        "theta_0": flatten_params(model.parameters()).tolist(),
    }


def compute_loss_surface(
    model, X, y, dir1, dir2, loss, samples=200, scale=10, verbose=False
):
    if verbose:
        start = time.time()

    # backup original state
    saved = {k: v.clone() for k, v in model.state_dict().items()}

    # set all parameters to zero
    for p in model.parameters():
        p.data.zero_()

    alphas = torch.linspace(-scale, scale, samples)
    betas = torch.linspace(-scale, scale, samples)
    loss_surface = torch.zeros(samples, samples)

    if y.ndim == 1 and isinstance(loss, (torch.nn.BCELoss, torch.nn.BCEWithLogitsLoss)):
        y = y.view(-1, 1).float()

    params_list = list(model.parameters())

    for i, a in enumerate(alphas):
        if verbose:
            print_progress_bar(
                i, samples, prefix="Progress:", suffix="Complete", length=50
            )

        for j, b in enumerate(betas):
            for p, d1, d2 in zip(params_list, dir1, dir2):
                p.data.copy_(a * d1 + b * d2)

            loss_surface[i, j] = loss(model(X), y).item()

    if verbose:
        print_progress_bar(
            samples, samples, prefix="Progress:", suffix="Complete", length=50
        )
        print(f"\nLoss landscape computed in {time.time() - start:.2f} s.")

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
