
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