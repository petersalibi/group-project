import axios from 'axios';
import { Platform } from 'react-native';

// DEV TIP: set this per environment
// - iOS Simulator -> http://localhost:8000
// - Android Emulator -> http://10.0.2.2:8000
// - Physical device -> http://<your-computer-LAN-IP>:8000

// REPLACE this string with your actual computer IP.
const MY_COMPUTER_IP = '10.150.74.136';

let BASE_URL = `http://${MY_COMPUTER_IP}:8000`;

// Keep localhost for web development on your computer
if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  BASE_URL = 'http://localhost:8000';
}

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 0,
});

export default api;
