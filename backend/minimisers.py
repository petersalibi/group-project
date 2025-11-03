import torch
import torch.optim as optim
import torch.nn as nn
from utils import print_progress_bar, flatten_params

def project_to_plane(theta_i, theta_0, dir1, dir2):
    v = theta_i - theta_0
    D = torch.stack([dir1, dir2], dim=1)

    # solve least squares problem: (D^D)[a b]t = d^*v
    lhs = D.T @ D
    rhs = D.T @ v

    sol = torch.linalg.solve(lhs, rhs)
    return sol[0].item(), sol[1].item()

def animate_optimiser(model, theta_0, dir1, dir2, X, y, optimiser=None, epochs=300):
    path = []

    # save state (clone tensors so we won't share memory)
    saved = {k: v.clone() for k, v in model.state_dict().items()}

    if not optimiser:
        optimiser = optim.Adam(model.parameters(), lr=0.1)
    loss = nn.L1Loss()

    print_progress_bar(0, epochs, prefix = 'Progress:', suffix = 'Complete', length = 50)
    for i in range(epochs):
        print_progress_bar(i, epochs, prefix = 'Progress:', suffix = 'Complete', length = 50)

        optimiser.zero_grad()
        output = loss(model(X), y)
        output.backward()
        optimiser.step()

        theta_i = flatten_params(model.parameters())
        a, b = project_to_plane(theta_i, theta_0, dir1, dir2)
        path.append((a,b))

    print()

    model.load_state_dict(saved)
    return path