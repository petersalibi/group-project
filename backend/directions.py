import torch
import torch.nn as nn

from enum import Enum

class VisualisationMethod(Enum):
    TWOPARAMETERS   = 0
    RANDOMDIRS      = 1
    FILTERNORM      = 2
    PCAMINIMISER    = 3

def get_directions(model, method: VisualisationMethod, args=None):
    match method:
        case VisualisationMethod.TWOPARAMETERS:
            return get_two_parameter_directions(model, args)
        case VisualisationMethod.RANDOMDIRS:
            return get_random_directions(model)
        case VisualisationMethod.FILTERNORM:
            return get_filterwise_directions(model)
        case VisualisationMethod.PCAMINIMISER:
            return get_pca_directions(model, args)
        case _:
            raise ValueError("Cannot Find Visualisation Method")

def get_two_parameter_directions(model, args):
    if args is None or len(args) < 2:
        raise ValueError("get_two_parameter_directions expects args with two indices")

    i1, i2 = args[0], args[1]
    first_linear = None
    for m in model.modules():
        if isinstance(m, nn.Linear):
            first_linear = m
            break

    dirs = []

    for target_idx in (i1, i2):
        direction = []
        for p in model.parameters():
            d = torch.zeros_like(p)

            if p is first_linear.weight:
                d[:, target_idx] = first_linear.weight[:, target_idx].clone()

            direction.append(d)

        dirs.append(direction)

    return dirs[0], dirs[1]

def get_random_directions(model):
    dirs = []
    for _ in range(2):
        direction = [torch.randn_like(p) for p in model.parameters()]
        dirs.append(direction)

    return dirs[0], dirs[1]

def get_filterwise_directions(model):
    dirs = []
    rand_dir1, rand_dir2 = get_random_directions(model)
    for direction in [rand_dir1, rand_dir2]:
        norm_direction = []
        for d, p in zip(direction, model.parameters()):
            d = d.clone()  # avoid modifying the original
            if d.ndim > 1:
                # normalize each filter (each output channel / neuron)
                for i in range(d.shape[0]):
                    d[i] = d[i] * (torch.norm(p[i]) + 1e-10) / (torch.norm(d[i]) + 1e-10)
            else:
                # for biases or 1D parameters, match total norm
                d = d * (torch.norm(p) + 1e-10) / (torch.norm(d) + 1e-10)
                
            norm_direction.append(d)
        
        # CRITICAL STEP - normalise the direction against the random direction to keep scale consistent
        scaled_direction = []
        norm_normalised = sum([torch.norm(d) for d in norm_direction]) / float(len(direction))
        norm_random     = sum([torch.norm(d) for d in direction]) / float(len(direction))
        for d in norm_direction:
            scaled_direction.append(d * norm_random / norm_normalised)

        dirs.append(scaled_direction)
    
    return dirs[0], dirs[1]

def get_pca_directions(model, minimiser_trajectories):
    return NotImplementedError("PCA directions not yet implemented")