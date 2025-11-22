from __future__ import annotations
import numpy as np
from matplotlib import cm
from matplotlib.animation import FuncAnimation
from losslandscape import *
from minimisers import *

import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D  # for 3D plotting
from collections import OrderedDict

def animate_landscape(landscapes, x_axis, y_axis, minimiser_path=None, copies=1):

    # Horizontal Layout
    fig, axs = plt.subplots(copies, len(landscapes), subplot_kw={'projection': '3d'}, figsize=(10, 6))

    xAxis = np.array(x_axis)
    yAxis = np.array(y_axis)

    for c in range(copies):
        for landscape in landscapes:
            surface = np.array(landscape)
            
            X, Y = np.meshgrid(xAxis, yAxis, indexing='ij')
            Z = surface

            ax = axs[c, landscapes.index(landscape)] if copies > 1 else axs[landscapes.index(landscape)]
            ax.set_xlabel('Direction 1')
            ax.set_ylabel('Direction 2')
            ax.set_zlabel('Loss')

            surf = [ax.plot_surface(X, Y, Z, cmap=cm.viridis)]

            if minimiser_path is not None:
                path = np.array(minimiser_path)
                line, = ax.plot([], [], [], color='r', marker='o')

                def update(num):
                    line.set_data(np.array([path[num, 0]]), np.array([path[num, 1]]))
                    zx = surface.shape[0] * (path[num, 0] - xAxis[0]) / (xAxis[-1] - xAxis[0])
                    zy = surface.shape[1] * (path[num, 1] - yAxis[0]) / (yAxis[-1] - yAxis[0])
                    zx = int(np.clip(zx, 0, surface.shape[0]-1))
                    zy = int(np.clip(zy, 0, surface.shape[1]-1))
                    z_value = surface[zx, zy]
                    line.set_3d_properties(np.array([z_value]))  # Dummy z-values
                    return line,

                ani = FuncAnimation(fig, update, frames=len(path), interval=30, blit=True)
            else:
                ani = None

    plt.show()
    return ani

loss = nn.BCEWithLogitsLoss()
network = NetworkParams(depth=1, activation=nn.Sigmoid(), width=1)
method = VisualisationMethod.TWOPARAMETERS
args = [1, 2]
data = TrainingDataType.PURPLECOLOURS
params = LandscapeParams(network, method, data, args=args, loss=loss, scale=1)

landscape = generate_loss_landscape(params, verbose=True)
# print(print_landscape(landscape["surface"]))
lst_directions = (landscape["x_direction"], landscape["y_direction"])
directions = (torch.tensor(lst_directions[0]), torch.tensor(lst_directions[1]))
theta_0 = torch.tensor(landscape["theta_0"])

minimiser_params = MinimiserParams(
    network=network,
    data=data,
    x_direction=directions[0],
    y_direction=directions[1],
    theta_0=theta_0,
    init_xy=(0.8, 0.8),
    loss=loss,
    lock_to_plane=True
)

minimiser_path = animate_optimiser(minimiser_params)
animate_landscape([landscape["surface"], landscape["surface_log"]], landscape["x_axis"], landscape["y_axis"], minimiser_path)