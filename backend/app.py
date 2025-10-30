from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import json

app = FastAPI()

# Allow your Expo app to call the API during dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten to your LAN IP in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/ping")
def ping():
    print("pinged")
    return {"message": "pong"}


@app.get("/greet/{name}")
def greet(name: str):
    print("greeted")
    return {"greeting": f"Hello, {name}!"}


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
