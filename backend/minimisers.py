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
    
    data = TrainingData(params.data)
    # Automatically infer input/output dimensions if not provided
    if params.network.inputs is None or params.network.outputs is None:
        params.network.inputs = data.X.shape[1]
        params.network.outputs = data.y.shape[1]
    model = Model(params.network)

    dir1, dir2 = params.directions
    x, y = params.init_xy
    path = []

    # Add initial position
    path.append((x, y))

    # save state (clone tensors so we won't share memory)
    saved = {k: v.clone() for k, v in model.state_dict().items()}
    print_progress_bar(0, params.epochs, prefix = 'Progress:', suffix = 'Complete', length = 50)

    if params.lock_to_plane:
        # ensure device consistency
        device = next(model.parameters()).device if any(True for _ in model.parameters()) else torch.device('cpu')
        model.to(device)
        data.X = data.X.to(device)
        data.y = data.y.to(device)

        # trainable scalars (must be tensors with grad)
        a = torch.tensor(x, dtype=torch.float32, device=device, requires_grad=True)
        b = torch.tensor(y, dtype=torch.float32, device=device, requires_grad=True)
        optimiser = params.optimiser([a, b], lr=params.learning_rate)

        theta0 = params.theta_0.to(device)
        dir1 = dir1.to(device)
        dir2 = dir2.to(device)

        for i in range(params.epochs):
            print_progress_bar(i, params.epochs, prefix = 'Progress:', suffix = 'Complete', length = 50)
            pos = theta0 + a * dir1 + b * dir2

            params_dict = {}
            idx = 0
            for name, param in model.named_parameters():
                n = param.numel()
                params_dict[name] = pos[idx:idx + n].view(param.size())
                idx += n

            optimiser.zero_grad()
            preds = torch.func.functional_call(model, params_dict, (data.X,))
            loss = params.loss(preds, data.y)
            loss.backward()
            optimiser.step()

            path.append((float(a.item()), float(b.item())))

        for p in path:
            if contains_nan(torch.tensor(p)):
                raise ValueError("NaN encountered in optimiser path.")

        print()
        model.load_state_dict(saved)
        return path

    else:
        new_params = flatten_params(model.parameters()) + x * dir1 + y * dir2

        # update parameters by copying in new_params manually
        index = 0
        with torch.no_grad(): # HOTFIX - prevent tracking in autograd
            for p in model.parameters():
                numel = p.numel()
                p.copy_(new_params[index:index + numel].view_as(p))
                index += numel

        optimiser = params.optimiser(model.parameters(), lr=params.learning_rate)

        # Add initial position
        path.append((x, y))

        for i in range(params.epochs):
            print_progress_bar(i, params.epochs, prefix = 'Progress:', suffix = 'Complete', length = 50)

            optimiser.zero_grad()
            loss = params.loss(model(data.X), data.y)
            loss.backward()
            optimiser.step()

            theta_i = flatten_params(model.parameters())
            a, b = project_to_plane(theta_i, params.theta_0, dir1, dir2)
            path.append((a,b))

        for p in path:
            if contains_nan(torch.tensor(p)):
                raise ValueError("NaN encountered in optimiser path.")

        print()
        model.load_state_dict(saved)
        return path