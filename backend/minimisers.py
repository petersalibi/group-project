import torch
import torch.optim as optim
import torch.nn as nn
from utils import print_progress_bar, flatten_params
from network import NetworkParams, TrainingDataType, TrainingData, Model

class MinimiserParams:
    def __init__(self,
                 network: NetworkParams,
                 data: TrainingDataType,
                 directions: tuple,
                 theta_0: torch.Tensor,
                 optimiser=optim.Adam,
                 loss=nn.MSELoss(), 
                 epochs=300):
        
        self.network = network
        self.data = data
        self.directions = directions
        self.theta_0 = theta_0
        self.optimiser = optimiser
        self.loss = loss
        self.epochs = epochs

def project_to_plane(theta_i, theta_0, dir1, dir2):
    v = theta_i - theta_0
    D = torch.stack([dir1, dir2], dim=1)

    # solve least squares problem: (D^D)[a b]t = d^*v
    lhs = D.T @ D
    rhs = D.T @ v

    sol = torch.linalg.solve(lhs, rhs)
    return sol[0].item(), sol[1].item()

def animate_optimiser(params: MinimiserParams):
    model = Model(params.network)
    data = TrainingData(params.data)
    dir1, dir2 = params.directions
    optimiser = params.optimiser(model.parameters(), lr=0.1)

    path = []

    # save state (clone tensors so we won't share memory)
    saved = {k: v.clone() for k, v in model.state_dict().items()}

    print_progress_bar(0, params.epochs, prefix = 'Progress:', suffix = 'Complete', length = 50)
    for i in range(params.epochs):
        print_progress_bar(i, params.epochs, prefix = 'Progress:', suffix = 'Complete', length = 50)

        optimiser.zero_grad()
        output = params.loss(model(data.X), data.y)
        output.backward()
        optimiser.step()

        theta_i = flatten_params(model.parameters())
        a, b = project_to_plane(theta_i, params.theta_0, dir1, dir2)
        path.append((a,b))

    print()

    model.load_state_dict(saved)
    return path