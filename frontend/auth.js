// Authentication handling
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const shopDomainInput = document.getElementById('shop-domain');
    const loginBtn = document.getElementById('login-btn');
    const btnText = document.getElementById('btn-text');
    const btnLoader = document.getElementById('btn-loader');
    const errorMessage = document.getElementById('error-message');
    
    // Check for error in URL
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    
    if (error) {
        showError(error);
    }
    
    // Check if already logged in
    if (isAuthenticated()) {
        window.location.href = 'dashboard.html';
        return;
    }
    
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const shopDomain = shopDomainInput.value.trim();
        
        if (!shopDomain) {
            showError('Please enter your shop domain');
            return;
        }
        
        // Normalize shop domain
        const normalizedDomain = shopDomain.includes('.myshopify.com') 
            ? shopDomain 
            : `${shopDomain}.myshopify.com`;
        
        // Show loading state
        loginBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoader.style.display = 'inline-block';
        hideError();
        
        // Redirect to backend OAuth endpoint
        window.location.href = `${CONFIG.API_URL}/auth/shopify?shop=${normalizedDomain}`;
    });
    
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
    }
    
    function hideError() {
        errorMessage.style.display = 'none';
    }
});

