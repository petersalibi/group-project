from __future__ import annotations
import numpy as np
from matplotlib import cm
from matplotlib.animation import FuncAnimation
from losslandscape import generate_loss_landscape, LandscapeParams, VisualisationMethod, TrainingDataType
from minimisers import animate_optimiser, MinimiserParams, convert_plane_coordinates
from directions import get_pca_directions
from network import NetworkParams

# pre-generated testcases
from testcases import *

import torch
import torch.nn as nn

import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D  # for 3D plotting
from collections import OrderedDict

def animate_landscape(landscapes, x_axis, y_axis, minimiser_path=None, fidelity=None, copies=1):

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

            # show the fidelity if provided
            ax.set_title(f'fidelity: {fidelity:.4f}' if fidelity is not None else 'Loss Landscape')

            surf = [ax.plot_surface(X, Y, Z, cmap=cm.viridis)]

            if minimiser_path is not None:
                path = np.array(minimiser_path)
                line, = ax.plot([], [], [], color='r', marker='o')

                xmin, xmax = xAxis.min(), xAxis.max()
                ymin,ymax = yAxis.min(), yAxis.max()

                def update(num):
                    line.set_data(np.array([path[num, 0]]), np.array([path[num, 1]]))
                    zx = surface.shape[0] * (path[num, 0] - xmin) / (xmax - xmin)
                    zy = surface.shape[1] * (path[num, 1] - ymin) / (ymax-ymin)
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

params = regression_params_complex

landscape = generate_loss_landscape(params, verbose=True)
# print(print_landscape(landscape["surface"]))
lst_directions = (landscape["x_direction"], landscape["y_direction"])
directions = (torch.tensor(lst_directions[0]), torch.tensor(lst_directions[1]))
theta_0 = torch.tensor(landscape["theta_0"])

init_xy = (0.8, 0.8)
print(f"direction_x: {directions[0]}")
print(f"direction_y: {directions[1]}")

minimiser_params = MinimiserParams(
    network=params.network,
    data=params.data,
    x_direction=directions[0],
    y_direction=directions[1],
    theta_0=theta_0,
    init_xy=init_xy,
    loss=params.loss,
    lock_to_plane=False
)

paths = animate_optimiser(minimiser_params)
minimiser_path = paths["minimiser_path"]
fidelity = paths["fidelity"]
loss_path = paths["loss_path"]
print(f"Fidelity of optimiser path to plane: {fidelity:.4f}")


################################################################

# Re-generate landscape with pca on minimiser path
pca_landscape = generate_loss_landscape(params_to_pca(params, paths["parameters_path"]), verbose=True)
lst_directions = (pca_landscape["x_direction"], pca_landscape["y_direction"])
pca_directions = (torch.tensor(lst_directions[0]), torch.tensor(lst_directions[1]))
pca_theta_0 = torch.tensor(pca_landscape["theta_0"])
pca_init_xy = convert_plane_coordinates(theta_0, directions[0], directions[1],
                                      init_xy, pca_theta_0, pca_directions[0], pca_directions[1])
print(f"pca_init_xy: {pca_init_xy}")
print(f"pca_direction_x: {pca_directions[0]}")
print(f"pca_direction_y: {pca_directions[1]}")


truepath = pca_landscape["proj_trajectories"]

animate_landscape([pca_landscape["surface"], 
                pca_landscape["surface_log"]], 
                pca_landscape["x_axis"], 
                pca_landscape["y_axis"], 
                truepath, fidelity)

# minimiser_params = MinimiserParams(
#     network=params.network,
#     data=params.data,
#     x_direction=pca_directions[0],
#     y_direction=pca_directions[1],
#     theta_0=pca_theta_0,
#     init_xy=pca_init_xy,
#     loss=params.loss,
#     lock_to_plane=False
# )

# paths = animate_optimiser(minimiser_params)
# minimiser_path = paths["minimiser_path"]
# print(minimiser_path)
# fidelity = paths["fidelity"]
# print(f"Fidelity of optimiser path to plane (after PCA): {fidelity:.4f}")

# animate_landscape([pca_landscape["surface"], 
#                 pca_landscape["surface_log"]], 
#                 pca_landscape["x_axis"], 
#                 pca_landscape["y_axis"], 
#                 minimiser_path, fidelity)