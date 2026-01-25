import torch
import torch.nn as nn
from pandas.api.types import is_numeric_dtype
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.decomposition import PCA
import pandas as pd
import math
import numpy as np

from enum import Enum

class VisualisationMethod(Enum):
    TWOPARAMETERS   = 0
    RANDOMDIRS      = 1
    FILTERNORM      = 2
    PCAMINIMISER    = 3

def get_directions(model, method: VisualisationMethod, args=None):
    # set seeds for reproducibility
    torch.manual_seed(1066)

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
    # pick the first linear layer
    first_linear = next(m for m in model.modules() if isinstance(m, nn.Linear))
    
    dirs = []
    for input_idx in [args[0], args[1]]:
        direction = []
        for p in model.parameters():
            d = torch.zeros_like(p)
            if p is first_linear.weight:
                d[:, input_idx] = 1
            direction.append(d)
        dirs.append(direction)
    
    print(dirs)
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

def get_pca_directions(model, minimiser_trajectories, 
                       add_random_noise : bool = True, 
                       n_points : int =1, sigma : float = 0.02) -> tuple[list[list[float]]]:
    # Convert List[List[float]] to Tensor
    trajectory_tensors = [
        torch.tensor(p, dtype=torch.float32)
        for p in minimiser_trajectories
    ]

    X = torch.stack(trajectory_tensors).cpu().numpy()

    if add_random_noise and (n_points - 1) > 0:
        
        perturbations = sample_random_points(X, n_points - 1, sigma, True, True)
        
        X = np.vstack([X, perturbations])

    # Center trajectory (critical)
    X = ( X - X.mean(axis=0, keepdims=True) ) / ( X.std(axis=0, keepdims=True) + 1e-10 )

    pca = PCA(n_components=2)
    
    pca.fit(X)

    # PCA unit directions
    pc1 = torch.tensor(pca.components_[0], dtype=torch.float32)
    pc2 = torch.tensor(pca.components_[1], dtype=torch.float32)

    # Scale by sqrt of explained variance
    scale1 = pca.explained_variance_[0] ** 0.5
    scale2 = pca.explained_variance_[1] ** 0.5

    pc1 = pc1 * scale1
    pc2 = pc2 * scale2

    # Unflatten into parameter-shaped tensors
    dir1, dir2 = [], []
    idx = 0

    for p in model.parameters():
        n = p.numel()
        dir1.append(pc1[idx:idx + n].view_as(p))
        dir2.append(pc2[idx:idx + n].view_as(p))
        idx += n

    return dir1, dir2

def get_pca_directions_david(model, minimiser_trajectories) -> tuple[np.ndarray, np.ndarray, None]:
    
    # We will not be using the loss values directly, we only need the PCA directions for this function
    all_samples, _ = minimiser_trajectories
    
    # Convert into one matrix so we can use PCA on it
    X = torch.stack(all_samples).numpy()
    
    pca = PCA(n_components=2)
    X_pca = pca.fit_transform(X)

    x, y = X_pca[:, 0], X_pca[:, 1]

    return x, y #, pca (we don't need to return pca object)


def ztransform(train : pd.DataFrame, test : pd.DataFrame, 
               keep_non_numeric : bool = True, 
               label_encode : bool = True ) -> tuple[pd.DataFrame, pd.DataFrame] :

    newtrain = pd.DataFrame([])
    newtest = pd.DataFrame([])

    for column in train.columns:
        if is_numeric_dtype(train[column]) :
            
            mean = train[column].mean()
            std = train[column].std() + 1e-10
            
            newtrain[column] = ( train[column] - mean ) / std
            newtest[column] = (test[column] - mean) / std
            
        elif keep_non_numeric: 
            
            if label_encode: 
                
                le = LabelEncoder()
                
                # Fit and transform ONLY on the combined unique values of train/test for robust encoding
                # This handles cases where test set has labels not seen in train
                full_data = pd.concat([train[column], test[column]], axis=0).astype(str)
                le.fit(full_data.unique())
                
                # Transform train and test
                newtrain[column] = le.transform(train[column].astype(str))
                newtest[column] = le.transform(test[column].astype(str))
            
            else:
            
                newtrain[column] = train[column]
                newtest[column] = test[column]
            
    return newtrain, newtest


def tensorisation(train : pd.DataFrame, test : pd.DataFrame,
                  dependent : str, 
                  independents : list[str],) -> tuple[torch.Tensor, torch.Tensor, torch.Tensor, torch.Tensor] :
    
    # Convert into compatible pytorch format
    X_train = torch.tensor(train[independents].values, dtype = torch.float32)
    Y_train = torch.tensor(train[dependent].values, dtype = torch.long).squeeze(-1) # Remove the redundant dimension during tensorisation

    X_test = torch.tensor(test[independents].values, dtype = torch.float32)
    Y_test = torch.tensor(test[dependent].values, dtype = torch.long).squeeze(-1) # Ditto


    return X_train, Y_train, X_test, Y_test


def set_params_from_vector(model, vector):
    
    # Use this to track progression along the vector for accurate data insertion
    pointer = 0
    for param in model.parameters():
        
        # Read off number of elements so we know which values to put for which param
        numel = param.numel()
        
        # Put in the same shape as the parameter for the network (view as)
        new_values = vector[pointer:pointer + numel].view_as(param)
        
        # This just copies all the data from vector to parameter in network
        param.data.copy_(new_values)
        
        # Increment the pointer so we don't copy the same data twice
        pointer += numel
        

def get_trajectories(df : pd.DataFrame, independents : list[str], dependent : str, model, epochs : int = 200,
                     record_interval : int = 1, n_random_samples : int = 500, sigma : float = 0.02) :
    
    all_vars = independents + [dependent]
    
    # Filter for only what we want
    ndf = df[all_vars]
    
    train, test = train_test_split(ndf, test_size = 0.2, random_state=42)
    
    train, test = ztransform(train, test, keep_non_numeric = True, label_encode = True)
    
    # Don't technically need test data but include for generalisability
    X_train, Y_train, X_test, Y_test = tensorisation(train, test, dependent, independents)

    # Initialising everything
    
    # Input-output shape of the network (REDUNDANT due to existing model)
    # n_inputs = len(independents)
    # n_outputs = train[dependent].nunique()
    
    original_model_state = model.state_dict()
    
    lf = nn.CrossEntropyLoss()
    optim = torch.optim.Adam(model.parameters(), lr = 0.01)
    
    # Storage params
    parameter_snapshots = []
    loss_vals = []
    
    # Training the model - add +1 so we can store the final loss too
    for step in range(epochs + 1) :
        
        optim.zero_grad()
        Yp = model(X_train)
        loss = lf(Yp, Y_train)
        loss.backward()
        optim.step()
        
        if step % record_interval == 0 :
            
            # Stores the loss, need to use item so it doesn't get stored as tensor
            loss_vals.append(loss.item())
            
            # Storing the parameters in vector format
            state = model.state_dict()
        
            step_weights = []
            
            # Remove from active processing, concatenate them all together, and append as a vector
            for _, param in state.items():
                
                step_weights.append(param.detach().cpu().flatten())
        
            # Concatenate the weights all into one vector, then add the vector 
            param_vector = torch.cat(step_weights)
            
            parameter_snapshots.append(param_vector)


    # Now we will fill the parameter snapshots with perturbations and their respective losses, to capture
    # the loss landscape
    samples_per_snapshot = math.ceil(n_random_samples / len(parameter_snapshots))
    
    
    for i in range(len(parameter_snapshots)) :
        
        
        # The actual snapshot for this value
        snapshot_i = parameter_snapshots[i]
        
        # We use the norm to scale the perturbations so we get meaningful noise variation
        norm = torch.norm(snapshot_i)
        
        for _ in range(samples_per_snapshot) :
            
            
            # Create a minor perturbation scaled up by weight norm
            perturbation = torch.randn_like(snapshot_i) * sigma * norm
            
            changed_input = snapshot_i + perturbation
            
            parameter_snapshots.append(changed_input.detach().cpu())
            
            # Set parameters into the network so we can sample the loss using it
            set_params_from_vector(model, changed_input)
            
            with torch.no_grad():
            
                loss = lf(model(X_train), Y_train )
                
                loss_vals.append(loss.item())

    # Return to the original model state
    model.load_state_dict(original_model_state)

    # Combine to get a tuple of the vectors and associated loss
    return parameter_snapshots, loss_vals



def sample_random_points(X : np.ndarray, n_points : int = 10, 
                         sigma : float = 0.03, use_norm : bool = True,
                         collapse : bool = True) -> np.ndarray :
    
    if not n_points : return np.array([])
    
    noise_shape = (n_points, *X.shape)
    random_noise = np.random.randn(*noise_shape)
    Xs = np.stack([X] * n_points)
    norms = np.linalg.norm(X, axis = 1).reshape(1, -1, 1) if use_norm else 1
    
    Xs = Xs + sigma * random_noise * norms
    
    if collapse:
        Xs = Xs.reshape(n_points * X.shape[0], *X.shape[1:])
    
    return Xs