# Discovering Dimensions

An educational tool for visualising the training of neural networks 
through loss landscape exploration.

---

## Getting Started

### Prerequisites

- Node.js (LTS)
- Python 3.8 or above
- Operating System: Windows, macOS, or Linux

### Configuration

Before running the application, open `frontend/src/api.ts` and set 
`MY_COMPUTER_IP` to the local IP address of the machine running the 
backend:

```typescript
const MY_COMPUTER_IP = "x.x.x.x";  // replace with your computer's IP
```

On macOS or Linux, find your local IP by running `ifconfig`. On Windows, 
run `ipconfig` and look for the IPv4 address under your active network 
adapter.

---

## Running the Application

Both the backend and frontend must be running simultaneously, each in a 
separate terminal window.

### Backend Setup

1. Navigate to the backend directory:

```text
   cd backend
```

2. Create and activate a Python virtual environment:

   macOS/Linux:
```text
   python3 -m venv .venv
   source .venv/bin/activate
```

   Windows:
```text
   python -m venv .venv
   .venv\Scripts\activate
```

3. Install required dependencies:

```text
   pip install -r requirements.txt
```

4. Start the FastAPI server:

```text
   uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

   The API will be available at `http://localhost:8000` once started.

### Frontend Setup

1. Open a new terminal and navigate to the frontend directory:

```text
   cd frontend/discovering-dimensions-frontend
```

2. Install dependencies:

```text
   npm install
```

3. Start the Expo development server:

```text
   npx expo start
```

   Once started, the application can be accessed in one of two ways:
   - **Desktop browser** --- press `w` in the terminal to open the 
   application in your default web browser, or navigate manually to 
   the URL shown in the terminal output
   - **Mobile browser** --- on a device connected to the same local 
   network, open a browser and navigate to the URL displayed in the 
   terminal, replacing the IP 
   with the value set in `MY_COMPUTER_IP`

---

## Troubleshooting

- **Backend fails to start** --- ensure the virtual environment is 
activated (terminal prompt should show `(.venv)`), and verify all 
dependencies installed correctly by re-running 
`pip install -r requirements.txt`
- **Port 8000 already in use** --- terminate the process occupying it 
or start the server on an alternative port with `--port <number>`
- **Frontend cannot connect to backend** --- verify `MY_COMPUTER_IP` 
is set to the correct local IP address, not `localhost` or `127.0.0.1`. 
Confirm both devices are on the same local network. Test the backend 
is reachable by navigating to `http://<MY_COMPUTER_IP>:8000/docs`
- **Landscape generation is slow** --- reduce network depth or width 
in the Model Configuration panel to reduce computation time