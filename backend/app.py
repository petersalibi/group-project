from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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
