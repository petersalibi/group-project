from fastapi import FastAPI, HTTPException, Request, Body
from fastapi.middleware.cors import CORSMiddleware
import json

from losslandscape import *
from minimisers import *
from network import *
from parse import *
from utils import *
import traceback

app = FastAPI()

# Allow your Expo app to call the API during dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten to your LAN IP in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/generatelandscape")
def generatelandscape(params: dict):
    try:
        # construct LandscapeParams from parsed dict
        lp = parse_landscape_params(params)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to construct LandscapeParams: {e}")
    
    try:
        # generate the landscape
        return generate_loss_landscape(lp)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to generate loss landscape: {e} \n {traceback.format_exc()}")


@app.get("/generatelandscapesample")
def generatelandscapesample():
    try:
        network = NetworkParams()
        method = VisualisationMethod.RANDOMDIRS
        data = TrainingDataType.CUSTOM
        params = LandscapeParams(network, method, data)
    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"Failed to construct default LandscapeParams: {e}"
        )

    try:
        # generate the landscape
        landscape = generate_loss_landscape(params)
        # return print_landscape(landscape["surface"])
        return landscape
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate loss landscape: {e} \n {traceback.format_exc()}",
        )


@app.post("/animateminimiser")
def animateminimiser(params: dict):
    try:
        # construct MinimiserParams from parsed dict
        mp = parse_minimiser_params(params)
    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"Failed to construct MinimiserParams: {e}"
        )

    try:
        paths = animate_optimiser(mp)
        return paths
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to animate optimiser: {e} \n {traceback.format_exc()}",
        )


@app.get("/animateminimisersample")
def animateminimisersample():
    try:
        network = NetworkParams()
        data = TrainingDataType.SINREGRESSION
        params = MinimiserParams(
            network, data, sample_dir1, sample_dir2, sample_theta0, lock_to_plane=True
        )
    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"Failed to construct default MinimiserParams: {e}"
        )

    try:
        paths = animate_optimiser(params)
        return paths
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to animate optimiser: {e} \n {traceback.format_exc()}",
        )


# Get the shape of the dataset from raw CSV data
@app.post("/getdatasetshape")
def getdatasetshape(rawcsv: str = Body(..., embed=True)):
    try:
        _, _, inputs, outputs = rawdata_to_training_data(rawcsv)
        return {"inputs": inputs, "outputs": outputs}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get dataset shape: {e} \n {traceback.format_exc()}")
    
# Fetch the given JSON data file
@app.get("/data/{filename}")
def get_data(filename: str):
    print(f"Fetching data for {filename}")
    file_path = f"data/{filename}"
    # Read and return the file content
    try:
        with open(file_path, "r") as f:
            data = json.load(f)
            return {"data": data}
    except FileNotFoundError:
        return {"error": "File not found"}, 404
