from network import *
from directions import *
from utils import *
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
                 surface_samples=50):
        
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
        xAxis, yAxis, loss_surface, loss_surface_log = compute_loss_surface(model, data.X, data.y,
                                                        dir1, dir2,
                                                        landscape_params.loss, 
                                                        landscape_params.surface_samples,
                                                        landscape_params.scale,
                                                        verbose=verbose)

    return {"surface": loss_surface.tolist(),
            "surface_log": loss_surface_log.tolist(),
            "x_axis": xAxis.tolist(), 
            "y_axis": yAxis.tolist(),
            "x_direction": flatten_params(dir1).tolist(),
            "y_direction": flatten_params(dir2).tolist(),
            "theta_0": flatten_params(model.parameters()).tolist()}

def compute_loss_surface(model, X, y, dir1, dir2, loss, samples=200, scale=10, verbose=False):

    if verbose:
        start = time.time()
        print_progress_bar(0, samples, prefix = 'Progress:', suffix = 'Complete', length = 50)

    # save state (clone tensors so we won't share memory)
    saved = {k: v.clone() for k, v in model.state_dict().items()}

    params_list, _, param_slices = prepare_param_structure(model)
    base_params = flatten_params(params_list)

    dir1 = flatten_params(dir1)
    dir2 = flatten_params(dir2)

    alphas = torch.linspace(-scale, scale, samples)
    betas = torch.linspace(-scale, scale, samples)

    loss_surface = torch.zeros(samples, samples)

    model_jit = torch.jit.trace(model, X)
    new_params = torch.empty_like(base_params)

    if isinstance(loss, (nn.BCELoss, nn.BCEWithLogitsLoss)):
        if y.ndim == 1:
            y = y.view(-1, 1).float()
    
    for i, a in enumerate(alphas):
        if verbose:
            print_progress_bar(i, samples, prefix = 'Progress:', suffix = 'Complete', length = 50)
        for j, b in enumerate(betas):

            # set new params with faster tensor ops
            new_params.copy_(base_params)
            new_params.add_(dir1, alpha=a)
            new_params.add_(dir2, alpha=b)

            # faster way to load flattened params back into model
            for p, (s0, s1) in zip(params_list, param_slices):
                p.copy_(new_params[s0:s1].view_as(p))

            loss_surface[i, j] = loss(model_jit(X), y).item()

    if verbose:
        print()
        print(f"Loss landscape computed in {time.time() - start:.2f} seconds.")

    loss_surface_log = torch.log1p(loss_surface)

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