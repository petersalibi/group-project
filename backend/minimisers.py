import torch
import torch.optim as optim
import torch.nn as nn
from utils import print_progress_bar, flatten_params, jump_count, generate_random_points, get_model_parameters, trainability_score_exp
from network import NetworkParams, TrainingDataType, TrainingData, Model
from sklearn.pipeline import Pipeline
from sklearn.decomposition import PCA
from sklearn.preprocessing import FunctionTransformer


from typing import Callable as callable_type

class MinimiserParams:
    def __init__(self,
                 network: NetworkParams,
                 data: TrainingDataType,
                 x_direction: torch.Tensor,
                 y_direction: torch.Tensor,
                 theta_0: torch.Tensor,
                 init_xy=(0.0, 0.0),
                 optimiser=optim.Adam,
                 learning_rate=0.01,
                 loss=nn.MSELoss(), 
                 epochs=300,
                 lock_to_plane=False):
        
        self.network = network
        self.data = data
        self.directions = (x_direction, y_direction)
        self.theta_0 = theta_0
        self.init_xy = init_xy
        self.optimiser = optimiser
        self.learning_rate = learning_rate
        self.loss = loss
        self.epochs = epochs
        self.lock_to_plane = lock_to_plane

def project_to_plane(theta_i, theta_0, dir1, dir2):
    v = theta_i - theta_0
    D = torch.stack([dir1, dir2], dim=1)

    # solve least squares problem: (D^D)[a b] = d^(v)
    lhs = D.T @ D
    rhs = D.T @ v
    sol = torch.linalg.solve(lhs, rhs)

    return sol[0].item(), sol[1].item()

def convert_plane_coordinates(source_theta_0, source_dir1, source_dir2, ab, target_theta_0, target_dir1, target_dir2):
    a, b = ab
    # Compute the parameter vector for the point
    theta = source_theta_0 + a * source_dir1 + b * source_dir2
    
    # Project onto the target plane
    a_proj, b_proj = project_to_plane(theta, target_theta_0, target_dir1, target_dir2)
    
    return a_proj, b_proj

def contains_nan(tensor):
    return torch.isnan(tensor).any().item()

def animate_optimiser(params: MinimiserParams):
    torch.manual_seed(1066)

    data, model = _prepare_data_and_model(params)
    saved_state = _clone_state_dict(model)

    minimiser_path = []
    parameters_path = []

    print_progress_bar(0, params.epochs, prefix="Progress:", suffix="Complete", length=50)

    if params.lock_to_plane:
        _train_locked_to_plane(
            params, model, data, minimiser_path, parameters_path
        )
        fidelity = 1.0
    else:
        fidelity, loss_path = _train_free(
            params, model, data, minimiser_path, parameters_path
        )

    print()
    model.load_state_dict(saved_state)

    return {
        "minimiser_path": minimiser_path,
        "parameters_path": parameters_path,
        "fidelity": fidelity,
        "loss_path" : loss_path
    }

def _prepare_data_and_model(params):
    data = TrainingData(params.data)

    if isinstance(params.loss, (nn.BCELoss, nn.BCEWithLogitsLoss)) and data.y.ndim == 1:
        data.y = data.y.view(-1, 1).float()

    model = Model(params.network, data.inputs, data.outputs)
    return data, model

def _clone_state_dict(model):
    return {k: v.clone() for k, v in model.state_dict().items()}

def _train_locked_to_plane(params, model, data, minimiser_path, parameters_path):
    device = next(model.parameters()).device
    model.to(device)
    data.X = data.X.to(device)
    data.y = data.y.to(device)

    a = torch.tensor(params.init_xy[0], device=device, requires_grad=True)
    b = torch.tensor(params.init_xy[1], device=device, requires_grad=True)

    optimiser = params.optimiser([a, b], lr=params.learning_rate)

    theta0 = params.theta_0.to(device)
    dir1, dir2 = (d.to(device) for d in params.directions)

    for i in range(params.epochs):
        print_progress_bar(i, params.epochs, prefix="Progress:", suffix="Complete", length=50)

        optimiser.zero_grad()
        params_dict = _params_from_plane(model, theta0, dir1, dir2, a, b)
        preds = torch.func.functional_call(model, params_dict, (data.X,))
        loss = params.loss(preds, data.y)

        loss.backward()
        torch.nn.utils.clip_grad_norm_([a, b], 1.0)
        optimiser.step()

        minimiser_path.append((_clamp(a.item()), _clamp(b.item())))
        parameters_path.append(flatten_params(model.parameters()).tolist())

def _train_free(params, model, data, minimiser_path, parameters_path):
    x, y = params.init_xy
    dir1, dir2 = params.directions

    new_params = flatten_params(model.parameters()) + x * dir1 + y * dir2
    _load_flat_params(model, new_params)

    optimiser = params.optimiser(model.parameters(), lr=params.learning_rate)

    # How we track fidelity --
    # calculate the full path length in parameter space
    # and the path length projected onto the plane
    # then fidelity = plane_path_length / full_path_length (measure of orthogonality)
    prev_theta = None
    prev_ab = None

    # full_path_length should always be >= plane_path_length
    full_path_length = 0.0
    plane_path_length = 0.0
    
    loss_path = []

    for i in range(params.epochs):
        print_progress_bar(i, params.epochs, prefix="Progress:", suffix="Complete", length=50)

        optimiser.zero_grad()
        loss = params.loss(model(data.X), data.y)
        loss.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
        optimiser.step()

        theta = flatten_params(model.parameters())
        a, b = project_to_plane(theta, params.theta_0, dir1, dir2)

        # accumulate path lengths
        if prev_theta is not None:
            full_path_length += torch.norm(theta - prev_theta).item()
            plane_path_length += torch.norm((a - prev_ab[0]) * dir1 + (b - prev_ab[1]) * dir2).item()

        prev_theta = theta.clone()
        prev_ab = (a, b)

        minimiser_path.append((a, b))
        parameters_path.append(theta.tolist())
        loss_path.append(loss.item())

    fidelity = plane_path_length / (full_path_length + 1e-12) # avoid div by zero
    return fidelity, loss_path

import numpy as np
from sklearn.model_selection import train_test_split

def create_instability_vectors(params, model : callable_type, Xtrain : np.ndarray, Ytrain : np.ndarray, Xtest : np.ndarray = None,
                               change_func : callable_type = jump_count, n_iterations : int = 10, 
                               condense : bool = False) -> np.ndarray :
  
    # If no argument for testing points assume entire dataset is training and we train on random points within the range
    if Xtest is None :
        Xtest = torch.Tensor( generate_random_points(Xtrain, n = len(Xtrain)) ).to(next(model.parameters()).device)
                                                                            # Need on same device to prevent hardware bugs

  
    # Stores expected instability across all iterations
    expected_instability_table = np.zeros((n_iterations, len(Xtest)))
    
    for global_iter in range(n_iterations) : 
        
        optimiser = params.optimiser(model.parameters(), lr=params.learning_rate) 
        
        # Reset the model weights without needing a new variable
        model.apply(lambda m: m.reset_parameters() if hasattr(m, 'reset_parameters') else None)
        
        # Storing all the function valuations to calculate jumps
        instability_table = np.zeros(( params.epochs + 1, len(Xtest) ))
        
        for training_iter in range(params.epochs + 1) :
            
            # Evaluation mode to avoid accidentally training here
            model.eval()
            with torch.no_grad() :
                raw_predictions = model(Xtest).cpu().numpy()
                
                predictions = np.argmax(raw_predictions, axis = 1)
                
                instability_table[training_iter] = predictions.ravel()
                
            model.train()
            if training_iter != params.epochs : # Avoid wasting time
                optimiser.zero_grad()
                

                
                loss = params.loss(model(Xtrain), Ytrain)
                loss.backward()
                torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
                optimiser.step()
                
        # Apply the function to determine how volatile each point is
        instabilities = change_func(instability_table, axis = 0)
        
        expected_instability_table[global_iter] = instabilities
    
    # Determine if we just want the expected instability across points 
    if condense : 
        # Expected instability across all the iterations
        expected_instability_table = np.mean(expected_instability_table, axis = (0,1))

    return expected_instability_table

from sklearn.neighbors import KNeighborsRegressor
from sklearn.preprocessing import StandardScaler

def instability_knn(params, model : callable_type, X : np.ndarray, Y : np.ndarray, change_func : callable_type = jump_count,
                    k : int = 5, test_size : float = 0.5, type_leniency : bool = True,
                    uses_pca : bool = False, pca_k : int = 2) -> None :
    
    Xtrain, Xtest, Ytrain, _ = train_test_split(X, Y, test_size = test_size)
    
    instabilities = create_instability_vectors(params, model, Xtrain, Ytrain, Xtest, change_func, 10, False).mean(axis=0)
    
    # Define the transformer: PCA if requested, otherwise pass through (Identity)
    preprocessor = PCA(n_components=pca_k) if uses_pca else FunctionTransformer(lambda x: x)
    

    pipeline = Pipeline([
        ("zscaler", StandardScaler()),
        ("pca_preprocessing", preprocessor),
        ("knn", KNeighborsRegressor(n_neighbors=k))
    ])
    pipeline.fit(Xtest, instabilities)
    return pipeline
            

def trainability_knn(params, model : callable_type, Xtrain : np.ndarray, Ytrain : np.ndarray,
                         trainability_score : callable_type = trainability_score_exp,
                         tol : float = 1e-6, n_iters : int = 10, uses_pca : bool = True, k : int = 5,
                         pca_k : int = 2 ) :
    
    P, Q = trainability_vectors(params, model, Xtrain, Ytrain, trainability_score, tol, n_iters)
    
    # Define the transformer: PCA if requested, otherwise pass through (Identity)
    preprocessor = PCA(n_components=pca_k) if uses_pca else FunctionTransformer(lambda x: x)
    pipeline = Pipeline([
        ("zscaler", StandardScaler()),
        ("pca_preprocessing", preprocessor),
        ("knn", KNeighborsRegressor(n_neighbors=k))
    ])
    pipeline.fit(P, Q)
    return pipeline

    


def trainability_vectors(params, model : callable_type, Xtrain : np.ndarray, Ytrain : np.ndarray,
                         trainability_score : callable_type = trainability_score_exp,
                         tol : float = 1e-6, n_iters : int = 10) -> tuple[np.ndarray, np.ndarray] :
    
      
    total_data_X = []
    total_data_Y = []
        
    for _ in range(n_iters) : 
        
        # Reset the model weights without needing a new variable
        model.apply(lambda m: m.reset_parameters() if hasattr(m, 'reset_parameters') else None)

        optimiser = params.optimiser(model.parameters(), lr=params.learning_rate) 
    
    
        data_X = []
        data_Y : list = []
        converged : bool = False

        loss = torch.Tensor(0)
        for training_iter in range(params.epochs + 1) :
            
            model.train()
            
            optimiser.zero_grad()

            loss = params.loss(model(Xtrain), Ytrain)
            loss.backward()
            
            param_vector = get_model_parameters(model).detach().cpu().numpy()
            
            grad_norm = torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            grad_mag = grad_norm.item()
            
            optimiser.step()           

            data_X.append( param_vector)
            
            # Check for convergence
            if grad_mag < tol :
                converged = True
                # Subtract i in each case because it's dynamic programming
                # According to configuration number i, the previous i-1 configurations weren't needed to hit the minimum
                data_Y = [[training_iter + 1 - i, loss.item()] for i in range(len(data_X))]
                break
        
        if not converged :
            data_Y = [[params.epochs + 1 - i, loss.item()] for i in range(len(data_X))]
        
        total_data_X.extend(data_X)
        total_data_Y.extend(data_Y)
    
    total_data_X = np.array(total_data_X)
    total_data_Y = np.array(total_data_Y)
    
    trainability_Y = trainability_score(total_data_Y)
    
    return total_data_X, trainability_Y
    
    
        

def _params_from_plane(model, theta0, dir1, dir2, a, b):
    pos = theta0 + a * dir1 + b * dir2
    params_dict = {}

    idx = 0
    for name, param in model.named_parameters():
        n = param.numel()
        params_dict[name] = pos[idx:idx + n].view_as(param)
        idx += n

    return params_dict

def _load_flat_params(model, flat_params):
    idx = 0
    with torch.no_grad():
        for p in model.parameters():
            n = p.numel()
            p.copy_(flat_params[idx:idx + n].view_as(p))
            idx += n

def _clamp(x, lo=-1.0, hi=1.0):
    return max(lo, min(hi, float(x)))


