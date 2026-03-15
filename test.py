import torch
import numpy as np

X = torch.tensor([1, 2, 3])
Y = torch.tensor([4, 5, 6])

# Your current logic:
for obj in [X, Y]:
    if isinstance(obj, torch.Tensor):
        obj = obj.cpu().numpy()  # This only changes the local label 'obj'

print(f"X type: {type(X)}")  # Still <class 'torch.Tensor'>
print(f"Y type: {type(Y)}")  # Still <class 'torch.Tensor'>