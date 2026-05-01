import axios from 'axios';
import { Platform } from 'react-native';

const MY_COMPUTER_IP = '172.25.98.60'; // replace this string with your computer's IP

let BASE_URL = `http://${MY_COMPUTER_IP}:8000`;

if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  BASE_URL = 'http://localhost:8000';
}

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 0,
});

export default api;
