// OAuth Callback Handler
document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const error = urlParams.get('error');
    
    if (error) {
        // Handle error
        console.error('OAuth error:', error);
        setTimeout(() => {
            window.location.href = `index.html?error=${encodeURIComponent(error)}`;
        }, 2000);
        return;
    }
    
    if (token) {
        // Save token
        saveToken(token);
        
        // Verify token and get store info
        try {
            const response = await api.get('/auth/verify');
            
            if (response.success && response.data.store) {
                // Save store info
                localStorage.setItem(CONFIG.STORE_KEY, JSON.stringify(response.data.store));
                
                // Redirect to dashboard
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            } else {
                throw new Error('Invalid token response');
            }
        } catch (error) {
            console.error('Token verification error:', error);
            clearToken();
            setTimeout(() => {
                window.location.href = 'index.html?error=token_verification_failed';
            }, 2000);
        }
    } else {
        // No token received
        setTimeout(() => {
            window.location.href = 'index.html?error=no_token';
        }, 2000);
    }
});

