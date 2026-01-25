

import pandas as pd

# Creates new csv file in backend using raw csv data from frontend
def parse_to_csv(raw_data: str, filename: str):
    from io import StringIO

    # Use StringIO to read the string data as if it were a file
    data = StringIO(raw_data)
    
    # Read the CSV data into a DataFrame
    df = pd.read_csv(data)
    
    # Save the DataFrame to a CSV file
    df.to_csv(filename, index=False)

# Convert csv file to torch tensors and data parameters
# Assume last column are the training labels
# Numeric data is treated as float32, categorical data as long
# String data converted to categorical codes first
# Returns X, y tensors and input/output dimensions
def csv_to_training_data(filename: str):
    url = str(Path(__file__).resolve().parent.joinpath("data", "training", filename))
    df = pd.read_csv(url).dropna()

    X = df.iloc[:, :-1].values
    y = df.iloc[:, -1]

    # Check if y is categorical (string or object type)
    if y.dtype == 'object' or pd.api.types.is_categorical_dtype(y):
        y_cat = y.astype('category')
        codes = y_cat.cat.codes.values
        y_tensor = torch.tensor(codes, dtype=torch.long)
    else:
        y_tensor = torch.tensor(y.values, dtype=torch.float32)

    X_tensor = torch.tensor(X, dtype=torch.float32)

    inputs = X_tensor.shape[1]
    # number of classes if categorical, else 1
    outputs = len(pd.unique(y)) if y.dtype == 'object' or pd.api.types.is_categorical_dtype(y) else 1

    return X_tensor, y_tensor, inputs, outputs