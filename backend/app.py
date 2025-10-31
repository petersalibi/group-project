from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from losslandscape import *
from minimisers import *
from network import *

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

@app.get("/generatelandscape/{params}")
def generatelandscape(params: str):
    import json
    try:
        params_dict = json.loads(params)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON params: {e}")

    try:
        # construct LandscapeParams from parsed dict
        lp = LandscapeParams(**params_dict)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to construct LandscapeParams: {e}")
    
    return generate_loss_landscape(params)

@app.get("/generatelandscapesample")
def generatelandscape():
    try:
        network = NetworkParams()
        method = VisualisationMethod.FILTERNORM
        data = TrainingDataType.SINREGRESSION
        params = LandscapeParams(network, method, data)
    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"Failed to construct default LandscapeParams: {e}")
    
    try:
        # generate the landscape
        return generate_loss_landscape(params)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to generate loss landscape: {e} \n {traceback.format_exc()}")

@app.get("/ping")
def ping():
    print("pinged")
    return {"message": "penguins"}

@app.get("/greet/{name}")
def greet(name: str):
    print("greeted")
    return {"greeting": f"Hello, {name}!"}
