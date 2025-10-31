import torch
import torch.nn as nn

from enum import Enum

class VisualisationMethod(Enum):
    TWOPARAMETERS = 0
    RANDOMDIRS = 1
    FILTERNORM = 2

def get_directions(model, method: VisualisationMethod):
    match method:
        case VisualisationMethod.TWOPARAMETERS:
            return None
        case VisualisationMethod.RANDOMDIRS:
            return get_random_directions(model)
        case VisualisationMethod.FILTERNORM:
            return get_filterwise_directions(model)
        case _:
            raise ValueError("Cannot Find Visualisation Method")

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