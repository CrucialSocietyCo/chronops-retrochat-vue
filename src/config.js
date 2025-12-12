// Centralized configuration for API URL
// Automatically detects production environment based on hostname
export const API_BASE = import.meta.env.VITE_API_BASE ||
    (typeof location !== 'undefined' && location.hostname !== 'localhost'
        ? 'https://api.southmain.app'
        : 'http://localhost:3000')
