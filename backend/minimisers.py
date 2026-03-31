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
                 lock_to_plane=False,
                 rawdata=None):
        
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
        self.rawdata = rawdata

def project_to_plane(theta_i, theta_0, dir1, dir2):
    v = theta_i - theta_0
    D = torch.stack([dir1, dir2], dim=1)

    # solve least squares problem: (D^D)[a b] = d^(v)
    lhs = D.T @ D
    rhs = D.T @ v
    sol = torch.linalg.solve(lhs, rhs)

    return sol[0].item(), sol[1].item()

def convert_plane_coordinates(source_theta_0, source_dir1, source_dir2, ab, target_theta_0, target_dir1, target_dir2):
    a, b = ab
    # Compute the parameter vector for the point
    theta = source_theta_0 + a * source_dir1 + b * source_dir2
    
    # Project onto the target plane
    a_proj, b_proj = project_to_plane(theta, target_theta_0, target_dir1, target_dir2)
    
    return a_proj, b_proj

def contains_nan(tensor):
    return torch.isnan(tensor).any().item()

def animate_optimiser(params: MinimiserParams):
    torch.manual_seed(1066)
    
    data = TrainingData(params.data, rawdata=params.rawdata)
    if isinstance(params.loss, (nn.BCELoss, nn.BCEWithLogitsLoss)):
        if data.y.ndim == 1:
            data.y = data.y.view(-1, 1).float()
    model = Model(params.network, data.inputs, data.outputs)

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
        fidelity, loss_path = _train_free(
            params, model, data, minimiser_path, parameters_path
        )

    print()
    model.load_state_dict(saved_state)
    print(loss_path)

    return {
        "minimiser_path": minimiser_path,
        "parameters_path": parameters_path,
        "fidelity": fidelity,
        "loss_path" : loss_path
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
    
    projected_path = []

    new_params = flatten_params(model.parameters()) + x * dir1 + y * dir2
    _load_flat_params(model, new_params)

    optimiser = params.optimiser(model.parameters(), lr=params.learning_rate)
    loss_path = []

    for i in range(params.epochs):
        print_progress_bar(i, params.epochs, prefix="Progress:", suffix="Complete", length=50)

        optimiser.zero_grad()
        loss = params.loss(model(data.X), data.y)
        loss.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
        optimiser.step()

        theta = flatten_params(model.parameters())
        a, b = project_to_plane(theta, params.theta_0, dir1, dir2)

        minimiser_path.append((a, b))
        projected_path.append(params.theta_0 + a * dir1 + b * dir2)
        parameters_path.append(theta.tolist())
        loss_path.append(loss.item())

    trajectory_tensors = [
        torch.tensor(p, dtype=torch.float32)
        for p in parameters_path
    ]

    fidelity = calculate_fidelity(trajectory_tensors, projected_path)
    print(f"Fidelity: {fidelity:.4f}")
    
    return fidelity, loss_path



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

# Calculate pairwise-cosine similarity between two parameter paths
# runtime: O((nm)^2), where n is the number of epochs and m is the size of the network
def calculate_fidelity(path, projected_path):
    n = len(path)
    
    total_similarity = 0
    sim = nn.CosineSimilarity(dim=0, eps=1e-6)
    
    for i in range(n):
        for j in range(i+1, n):
            total_similarity += max(sim(path[j] - path[i], projected_path[j]-projected_path[i]), 0)
    
    n_pairs = (n*(n-1))/2
    
    return (total_similarity.item()) / n_pairs
