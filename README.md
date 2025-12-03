# Discovering Dimensions

An educational tool for visualising the training of
neural networks through loss landscape exploration.

---

## Getting started

1. Install [Node.js (LTS)](https://nodejs.org/en/download) and Python
2. Clone the repo locally

   `git clone https://github.com/petersalibi/group-project.git`

3. Setup backend

   1. Create a Python virtual environment

      ```text
      cd backend
      python3 -m venv .venv
      source .venv/bin/activate
      ```

   2. Install required packages

      `pip install -r requirements.txt`

   3. Start the FastAPI server

      `uvicorn app:app --reload --host 0.0.0.0 --port 8000`

4. Setup frontend

   1. Open a new terminal and install Expo React Native dependencies

      ```text
      cd frontend/discovering-dimensions-frontend
      npx expo install
      ```

   2. Start the app

      `npx expo start`
