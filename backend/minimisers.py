import torch
import torch.optim as optim
import torch.nn as nn
from utils import print_progress_bar, flatten_params
from network import NetworkParams, TrainingDataType, TrainingData, Model

class MinimiserParams:
    def __init__(self,
                 network: NetworkParams,
                 data: TrainingDataType,
                 x_direction: torch.Tensor,
                 y_direction: torch.Tensor,
                 theta_0: torch.Tensor,
                 init_xy=(0.0, 0.0),
                 optimiser=optim.Adam,
                 learning_rate=0.01,
                 loss=nn.MSELoss(), 
                 epochs=300,
                 lock_to_plane=False):
        
        self.network = network
        self.data = data
        self.directions = (x_direction, y_direction)
        self.theta_0 = theta_0
        self.init_xy = init_xy
        self.optimiser = optimiser
        self.learning_rate = learning_rate
        self.loss = loss
        self.epochs = epochs
        self.lock_to_plane = lock_to_plane

def project_to_plane(theta_i, theta_0, dir1, dir2):
    v = theta_i - theta_0
    D = torch.stack([dir1, dir2], dim=1)

    # solve least squares problem: (D^D)[a b] = d^(v)
    lhs = D.T @ D
    rhs = D.T @ v
    sol = torch.linalg.solve(lhs, rhs)

    return sol[0].item(), sol[1].item()

def contains_nan(tensor):
    return torch.isnan(tensor).any().item()

def animate_optimiser(params: MinimiserParams):
    torch.manual_seed(1066)

    data, model = _prepare_data_and_model(params)
    saved_state = _clone_state_dict(model)

    minimiser_path = []
    parameters_path = []

    print_progress_bar(0, params.epochs, prefix="Progress:", suffix="Complete", length=50)

    if params.lock_to_plane:
        _train_locked_to_plane(
            params, model, data, minimiser_path, parameters_path
        )
        fidelity = 1.0
    else:
        fidelity = _train_free(
            params, model, data, minimiser_path, parameters_path
        )

    print()
    model.load_state_dict(saved_state)

    return {
        "minimiser_path": minimiser_path,
        "parameters_path": parameters_path,
        "fidelity": fidelity,
    }

def _prepare_data_and_model(params):
    data = TrainingData(params.data)

    if isinstance(params.loss, (nn.BCELoss, nn.BCEWithLogitsLoss)) and data.y.ndim == 1:
        data.y = data.y.view(-1, 1).float()

    model = Model(params.network, data.inputs, data.outputs)
    return data, model

def _clone_state_dict(model):
    return {k: v.clone() for k, v in model.state_dict().items()}

def _train_locked_to_plane(params, model, data, minimiser_path, parameters_path):
    device = next(model.parameters()).device
    model.to(device)
    data.X = data.X.to(device)
    data.y = data.y.to(device)

    a = torch.tensor(params.init_xy[0], device=device, requires_grad=True)
    b = torch.tensor(params.init_xy[1], device=device, requires_grad=True)

    optimiser = params.optimiser([a, b], lr=params.learning_rate)

    theta0 = params.theta_0.to(device)
    dir1, dir2 = (d.to(device) for d in params.directions)

    for i in range(params.epochs):
        print_progress_bar(i, params.epochs, prefix="Progress:", suffix="Complete", length=50)

        optimiser.zero_grad()
        params_dict = _params_from_plane(model, theta0, dir1, dir2, a, b)
        preds = torch.func.functional_call(model, params_dict, (data.X,))
        loss = params.loss(preds, data.y)

        loss.backward()
        torch.nn.utils.clip_grad_norm_([a, b], 1.0)
        optimiser.step()

        minimiser_path.append((_clamp(a.item()), _clamp(b.item())))
        parameters_path.append(flatten_params(model.parameters()).tolist())

def _train_free(params, model, data, minimiser_path, parameters_path):
    x, y = params.init_xy
    dir1, dir2 = params.directions

    new_params = flatten_params(model.parameters()) + x * dir1 + y * dir2
    _load_flat_params(model, new_params)

    optimiser = params.optimiser(model.parameters(), lr=params.learning_rate)

    # How we track fidelity --
    # calculate the full path length in parameter space
    # and the path length projected onto the plane
    # then fidelity = plane_path_length / full_path_length (measure of orthogonality)
    prev_theta = None
    prev_ab = None

    # full_path_length should always be >= plane_path_length
    full_path_length = 0.0
    plane_path_length = 0.0

    for i in range(params.epochs):
        print_progress_bar(i, params.epochs, prefix="Progress:", suffix="Complete", length=50)

        optimiser.zero_grad()
        loss = params.loss(model(data.X), data.y)
        loss.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
        optimiser.step()

        theta = flatten_params(model.parameters())
        a, b = project_to_plane(theta, params.theta_0, dir1, dir2)

        # accumulate path lengths
        if prev_theta is not None:
            full_path_length += torch.norm(theta - prev_theta).item()
            plane_path_length += ((a - prev_ab[0])**2 + (b - prev_ab[1])**2) ** 0.5

        prev_theta = theta.clone()
        prev_ab = (a, b)

        minimiser_path.append((a, b))
        parameters_path.append(theta.tolist())

    fidelity = plane_path_length / (full_path_length + 1e-12) # avoid div by zero
    return fidelity



def _params_from_plane(model, theta0, dir1, dir2, a, b):
    pos = theta0 + a * dir1 + b * dir2
    params_dict = {}

    idx = 0
    for name, param in model.named_parameters():
        n = param.numel()
        params_dict[name] = pos[idx:idx + n].view_as(param)
        idx += n

    return params_dict

def _load_flat_params(model, flat_params):
    idx = 0
    with torch.no_grad():
        for p in model.parameters():
            n = p.numel()
            p.copy_(flat_params[idx:idx + n].view_as(p))
            idx += n

def _clamp(x, lo=-1.0, hi=1.0):
    return max(lo, min(hi, float(x)))
