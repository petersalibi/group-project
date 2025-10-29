import axios from "axios";

// DEV TIP: set this per environment
// - iOS Simulator -> http://localhost:8000
// - Android Emulator -> http://10.0.2.2:8000
// - Physical device -> http://<your-computer-LAN-IP>:8000
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://172.25.71.159:8000";



export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 8000,
});
