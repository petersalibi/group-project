from __future__ import annotations
import numpy as np
from matplotlib import cm
from matplotlib.animation import FuncAnimation
from losslandscape import *
from minimisers import *

import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D  # for 3D plotting
from collections import OrderedDict

def animate_landscape(landscape, minimiser_path=None):
    surface = np.array(landscape["surface"])
    xAxis = np.array(landscape["x_axis"])
    yAxis = np.array(landscape["y_axis"])
    
    X, Y = np.meshgrid(xAxis, yAxis)
    Z = surface

    fig = plt.figure()
    ax = fig.add_subplot(111, projection='3d')
    ax.set_xlabel('Direction 1')
    ax.set_ylabel('Direction 2')
    ax.set_zlabel('Loss')

    surf = [ax.plot_surface(X, Y, Z, cmap=cm.viridis, alpha=0.9)]

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

network = NetworkParams()
method = VisualisationMethod.RANDOMDIRS
data = TrainingDataType.SINREGRESSION
params = LandscapeParams(network, method, data)

landscape = generate_loss_landscape(params)
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
    lock_to_plane=True
)

minimiser_path = animate_optimiser(minimiser_params)
animate_landscape(landscape, minimiser_path)