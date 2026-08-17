// Centralized API configuration (Environment-driven, fallback to local port 5000)
export const API_BASE_URL = import.meta.env.VITE_API_URL || '';
