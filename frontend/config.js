// Configuration
const CONFIG = {
    // Production API URL - change to http://localhost:8080 for local development
    API_URL: 'https://sendly-marketing-backend.onrender.com',
    TOKEN_KEY: 'sendly_app_token',
    STORE_KEY: 'sendly_store_info'
};

// Helper to get token from localStorage
function getToken() {
    return localStorage.getItem(CONFIG.TOKEN_KEY);
}

// Helper to save token
function saveToken(token) {
    localStorage.setItem(CONFIG.TOKEN_KEY, token);
}

// Helper to clear token (logout)
function clearToken() {
    localStorage.removeItem(CONFIG.TOKEN_KEY);
    localStorage.removeItem(CONFIG.STORE_KEY);
}

// Check if user is authenticated
function isAuthenticated() {
    return !!getToken();
}

// Redirect to login if not authenticated
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = 'index.html';
    }
}

