
import torch

def parse_loss(loss: str):
    import torch.nn as nn

    loss_mapping = {
        "MSELoss": nn.MSELoss(),
        "CrossEntropyLoss": nn.CrossEntropyLoss(),
        "L1Loss": nn.L1Loss()
    }

    if loss in loss_mapping:
        return loss_mapping[loss]
    else:
        raise ValueError(f"Unsupported loss function: {loss}")

def parse_optimiser(optimiser: str):
    import torch.optim as optim

    optimiser_mapping = {
        "SGD": optim.SGD,
        "Adam": optim.Adam,
        "RMSprop": optim.RMSprop
    }

    if optimiser in optimiser_mapping:
        return optimiser_mapping[optimiser]
    else:
        raise ValueError(f"Unsupported optimiser: {optimiser}")

def parse_landscape_params(params: dict):
    from losslandscape import LandscapeParams, NetworkParams, VisualisationMethod, TrainingDataType

    try:
        network_params = NetworkParams(**params.get("network", {}))
        method = VisualisationMethod[params.get("method", "FILTERNORM")]
        data_type = TrainingDataType[params.get("data", "SINREGRESSION")]
        args = params.get("args", [])
        loss = parse_loss(params.get("loss", "MSELoss"))
        training_samples = params.get("training_samples", 128)
        surface_samples = params.get("surface_samples", 100)
        
        landscape_params = LandscapeParams(
            network=network_params,
            method=method,
            data=data_type,
            args=args,
            loss=loss,
            training_samples=training_samples,
            surface_samples=surface_samples
        )
        return landscape_params
    except Exception as e:
        raise ValueError(f"Error parsing landscape parameters: {e}")

def parse_minimiser_params(params: dict):
    from minimisers import MinimiserParams, NetworkParams, TrainingDataType
    import torch

    try:
        network_params = NetworkParams(**params.get("network", {}))
        data_type = TrainingDataType[params.get("data", "SINREGRESSION")]
        directions = params.get("directions", (torch.randn(100), torch.randn(100)))
        theta_0 = torch.tensor(params.get("theta_0", torch.randn(100).tolist()))
        optimiser = parse_optimiser(params.get("optimiser", "Adam"))
        loss = parse_loss(params.get("loss", "MSELoss"))
        epochs = params.get("epochs", 300)

        minimiser_params = MinimiserParams(
            network=network_params,
            data=data_type,
            directions=directions,
            theta_0=theta_0,
            optimiser=optimiser,
            loss=loss,
            epochs=epochs
        )
        return minimiser_params
    except Exception as e:
        raise ValueError(f"Error parsing minimiser parameters: {e}")

def print_progress_bar (progress, total, prefix = '', suffix = '', length = 100):
    percent = ("{0:.1f}").format(100 * (progress / float(total)))
    filledLength = int(length * progress // total)
    bar = '█' * filledLength + '-' * (length - filledLength)
    print(f'\r{prefix} |{bar}| {percent}% {suffix}', end = "\r")

def flatten_params(param_list):
    return torch.cat([p.flatten() for p in param_list])

def print_landscape(surface):
    gradient = " .-:=+*#%@"
    max_idx = len(gradient) - 1
    lines = []
    for row in surface:
        chars = []
        for val in row:
            try:
                idx = int(round(float(val)))
            except Exception:
                idx = 0
            idx = max(0, min(idx, max_idx))
            chars.append(gradient[idx])
        lines.append("".join(chars))
    return lines