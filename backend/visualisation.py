import json
import torch
import torch.nn as nn
import torch.optim as optim
import matplotlib.pyplot as plt
import matplotlib.figure as figure
from mpl_toolkits.mplot3d import Axes3D  # for 3D plotting
from collections import OrderedDict


def printProgressBar(progress, total, prefix="", suffix="", length=100):
    percent = ("{0:.1f}").format(100 * (progress / float(total)))
    filledLength = int(length * progress // total)
    bar = "█" * filledLength + "-" * (length - filledLength)
    print(f"\r{prefix} |{bar}| {percent}% {suffix}", end="\r")


# Keep reproducable fixed random seed
torch.manual_seed(0)
n_samples = 1000
X = torch.unsqueeze(torch.linspace(-2, 2, n_samples), 1)
y = 2 * X
# y = torch.sin(3*X) + 0.5*torch.sin(7*X) + 0.2*torch.sin(11*X) + 0.8*torch.randn_like(X)


# basic 1 layer model
class Model(nn.Module):
    def __init__(self, depth):
        super(Model, self).__init__()

        layers = nn.Sequential(nn.Linear(1, 10), nn.ReLU(), nn.Linear(10, 1))

        for _ in range(depth - 1):
            layers.insert(1, nn.Linear(10, 10))
            layers.insert(1, nn.Tanh())

        self.net = layers

    def forward(self, x):
        return self.net(x)


# We want to initially train the model so that the loss landscape is less chaotic
def train_model(model, X, y, epochs=300, lr=0.01):
    optimizer = optim.Adam(model.parameters(), lr=lr)
    loss = nn.MSELoss()

    for _ in range(epochs):
        optimizer.zero_grad()
        output = loss(model(X), y)
        output.backward()
        optimizer.step()

    return output.item()


def get_random_directions(model):
    dirs = []
    for _ in range(2):
        direction = [torch.randn_like(p) for p in model.parameters()]
        dirs.append(direction)

    return dirs[0], dirs[1]


def get_filterwise_directions(model, rand_dir1, rand_dir2):
    dirs = []
    for direction in [rand_dir1, rand_dir2]:
        norm_direction = []
        for d, p in zip(direction, model.parameters()):
            d = d.clone()  # avoid modifying the original
            if d.ndim > 1:
                # normalize each filter (each output channel / neuron)
                for i in range(d.shape[0]):
                    d[i] = (
                        d[i] * (torch.norm(p[i]) + 1e-10) / (torch.norm(d[i]) + 1e-10)
                    )
            else:
                # for biases or 1D parameters, match total norm
                d = d * (torch.norm(p) + 1e-10) / (torch.norm(d) + 1e-10)

            norm_direction.append(d)

        # CRITICAL STEP - normalise the direction against the random direction to keep scale consistent
        scaled_direction = []
        norm_normalised = sum([torch.norm(d) for d in norm_direction]) / float(
            len(direction)
        )
        norm_random = sum([torch.norm(d) for d in direction]) / float(len(direction))
        for d in norm_direction:
            scaled_direction.append(d * norm_random / norm_normalised)

        dirs.append(scaled_direction)

    return dirs[0], dirs[1]


# Flattening required so torch can add the tensors
def flatten_params(param_list):
    return torch.cat([p.flatten() for p in param_list])


def compute_loss_function(model, X, y, paramsB, samples=100):
    # save state (clone tensors so we won't share memory)
    saved = {k: v.clone() for k, v in model.state_dict().items()}

    loss = nn.MSELoss()
    paramsA = flatten_params(list(model.parameters()))
    alphas = torch.linspace(-1, 1, samples)

    loss_line = torch.zeros(samples)

    with torch.no_grad():
        for i, a in enumerate(alphas):
            new_params = (1 - a) * paramsA + a * paramsB

            # update parameters by copying in new_params manually
            index = 0
            for p in model.parameters():
                numel = p.numel()
                p.copy_(new_params[index : index + numel].view_as(p))
                index += numel

            # Record the loss surface
            loss_line[i] = loss(model(X), y)

    model.load_state_dict(saved)
    return alphas, loss_line


def compute_loss_surface(model, X, y, dir1, dir2, samples=100, scale=1, max_loss=300):
    printProgressBar(0, samples, prefix="Progress:", suffix="Complete", length=50)

    # save state (clone tensors so we won't share memory)
    saved = {k: v.clone() for k, v in model.state_dict().items()}

    loss = nn.MSELoss()

    params = flatten_params(list(model.parameters()))
    dir1 = flatten_params(dir1)
    dir2 = flatten_params(dir2)

    alphas = torch.linspace(-scale, scale, samples)
    betas = torch.linspace(-scale, scale, samples)
    loss_surface = torch.zeros(samples, samples)

    # Torch.no_grad makes the nn not waste computation by calculating gradients
    with torch.no_grad():
        for i, a in enumerate(alphas):
            printProgressBar(
                i, samples, prefix="Progress:", suffix="Complete", length=50
            )
            for j, b in enumerate(betas):
                new_params = params + a * dir1 + b * dir2

                # update parameters by copying in new_params manually
                index = 0
                for p in model.parameters():
                    numel = p.numel()
                    p.copy_(new_params[index : index + numel].view_as(p))
                    index += numel

                loss_surface[i, j] = min(loss(model(X), y), max_loss)
    print()
    model.load_state_dict(saved)
    return alphas, betas, loss_surface


# Train the NN
model = Model(depth=5)
pretrained_params = flatten_params(list(model.parameters()))

print("Training model...")
train_model(model, X, y)

# Get the directions - random and filterwise random
print("Choosing random directions...")
rand_d1, rand_d2 = get_random_directions(model)
filt_d1, filt_d2 = get_filterwise_directions(model, rand_d1, rand_d2)

# computer loss surfaces
criterion = nn.MSELoss()
print("Computing loss surface -- Linear Interpolation...")
A_1D, loss_line = compute_loss_function(model, X, y, pretrained_params)
print("Computing loss surface -- Random Directions...")
A, B, loss_rand = compute_loss_surface(model, X, y, rand_d1, rand_d2)
print("Computing loss surface -- Filterwise Normalised Directions...")
_, _, loss_filt = compute_loss_surface(model, X, y, filt_d1, filt_d2)

# plot 1D line method
plt.plot(A_1D.numpy(), loss_line)
plt.title("1D Line Method")
plt.xlabel("alpha")
plt.ylabel("loss")
plt.show()

# plot contour graphs
fig, axes = plt.subplots(1, 2)

contour_plots = [
    (loss_rand, "Random Directions", axes[0]),
    (loss_filt, "Filter-wise Normalised", axes[1]),
]

for loss_surface, title, ax in contour_plots:
    ax.set_aspect("equal", adjustable="box")

    cp = ax.contourf(A.numpy(), B.numpy(), loss_surface.numpy(), levels=200)
    ax.set_title(title)
    ax.set_xlabel("Alpha")
    ax.set_ylabel("Beta")
    # fig.colorbar(cp, ax=ax)

plt.tight_layout()
plt.show()

# 3d landscape graphs - Figure.subplots does not support 3d projection
fig = plt.figure(figsize=figure.figaspect(0.5))
axes1 = fig.add_subplot(1, 2, 1, projection="3d")
axes2 = fig.add_subplot(1, 2, 2, projection="3d")

landscape_plots = [
    (loss_rand, "Random Directions 3d", axes1),
    (loss_filt, "Filter-wise Normalised 3d", axes2),
]

for loss_surface, title, ax in landscape_plots:
    ax.set_aspect("equal", adjustable="box")

    alphas, betas = torch.meshgrid(A, B, indexing="ij")

    # Convert to numpy for plotting
    X = alphas.numpy()
    Y = betas.numpy()
    Z = loss_surface.numpy()

    # Create 3D surface
    surf = ax.plot_surface(
        X, Y, Z, cmap=plt.get_cmap("viridis"), linewidth=0, antialiased=True
    )

    ax.set_title(title)
    ax.set_xlabel("Alpha")
    ax.set_ylabel("Beta")
    ax.set_zlabel("Loss")
    # fig.colorbar(surf, shrink=0.5, aspect=10)

plt.tight_layout()
plt.show()


def save_loss_surface_to_json(filename, A, B, loss_surface):
    # Create meshgrid of coordinates
    alphas, betas = torch.meshgrid(A, B, indexing="ij")

    X = alphas.numpy().flatten().tolist()
    Y = betas.numpy().flatten().tolist()
    Z = loss_surface.numpy().flatten().tolist()

    # Prepare list of {x, y, z} dicts
    points = [{"x": x, "y": y, "z": z} for x, y, z in zip(X, Y, Z)]

    # Save to JSON
    with open(filename, "w") as f:
        json.dump(points, f, indent=2)

    print(f"Saved {filename} with {len(points)} points.")


# Save both random and filter-normalized loss landscapes
save_loss_surface_to_json("data/loss_rand.json", A, B, loss_rand)
save_loss_surface_to_json("data/loss_filt.json", A, B, loss_filt)
