import axios from 'axios';
import { Platform } from 'react-native';

// DEV TIP: set this per environment
// - iOS Simulator -> http://localhost:8000
// - Android Emulator -> http://10.0.2.2:8000
// - Physical device -> http://<your-computer-LAN-IP>:8000
let BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000'; // Change this as needed
if (Platform.OS === 'android') {
  BASE_URL = 'http://10.0.2.2:8000';
}

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 0,
});

export default api;
