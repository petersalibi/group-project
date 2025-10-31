import torch

def print_progress_bar (progress, total, prefix = '', suffix = '', length = 100):
    percent = ("{0:.1f}").format(100 * (progress / float(total)))
    filledLength = int(length * progress // total)
    bar = '█' * filledLength + '-' * (length - filledLength)
    print(f'\r{prefix} |{bar}| {percent}% {suffix}', end = "\r")

def flatten_params(param_list):
    return torch.cat([p.flatten() for p in param_list])