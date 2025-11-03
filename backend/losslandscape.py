from network import *
from directions import *
from utils import *

class LandscapeParams:
    def __init__(self, 
                 network: NetworkParams, 
                 method: VisualisationMethod, 
                 data: TrainingDataType, 
                 args=[], 
                 loss=nn.MSELoss(), 
                 training_samples=128,
                 surface_samples=100):
        
        self.network = network
        self.method = method
        self.loss = loss
        self.args = args
        self.data = data
        self.training_samples = training_samples
        self.surface_samples = surface_samples

def generate_loss_landscape(landscape_params: LandscapeParams):
    data = TrainingData(landscape_params.data, landscape_params.surface_samples)

    # Automatically infer input/output dimensions if not provided
    if landscape_params.network.inputs is None or landscape_params.network.outputs is None:
        landscape_params.network.inputs = data.X.shape[1]
        landscape_params.network.outputs = data.y.shape[1]

    model = Model(landscape_params.network)
    dir1, dir2 = get_directions(model, landscape_params.method, landscape_params.args)

    xAxis, yAxis, loss_surface = compute_loss_surface(model, data.X, data.y,
                                                       dir1, dir2,
                                                       landscape_params.loss, 
                                                       landscape_params.surface_samples)

    return {"surface": loss_surface.tolist(), 
            "xAxis": xAxis.tolist(), 
            "yAxis": yAxis.tolist()}

def compute_loss_surface(model, X, y, dir1, dir2, loss, samples=100, scale=1, max_loss=300):
    print_progress_bar(0, samples, prefix = 'Progress:', suffix = 'Complete', length = 50)

    # save state (clone tensors so we won't share memory)
    saved = {k: v.clone() for k, v in model.state_dict().items()}

    params = flatten_params(list(model.parameters()))
    dir1 = flatten_params(dir1)
    dir2 = flatten_params(dir2)

    alphas = torch.linspace(-scale, scale, samples)
    betas = torch.linspace(-scale, scale, samples)
    loss_surface = torch.zeros(samples, samples)

    # Torch.no_grad makes the nn not waste computation by calculating gradients
    with torch.no_grad():
        for i, a in enumerate(alphas):
            print_progress_bar(i, samples, prefix = 'Progress:', suffix = 'Complete', length = 50)
            for j, b in enumerate(betas):
                new_params = params + a * dir1 + b * dir2

                # update parameters by copying in new_params manually
                index = 0
                for p in model.parameters():
                    numel = p.numel()
                    p.copy_(new_params[index:index + numel].view_as(p))
                    index += numel

                loss_surface[i, j] = min(loss(model(X), y), max_loss)
    print()
    model.load_state_dict(saved)
    return alphas, betas, loss_surface