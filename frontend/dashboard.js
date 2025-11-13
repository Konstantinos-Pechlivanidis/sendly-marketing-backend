// Dashboard functionality
document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    requireAuth();
    
    const loading = document.getElementById('loading');
    const errorMessage = document.getElementById('error-message');
    const dashboardContent = document.getElementById('dashboard-content');
    const logoutBtn = document.getElementById('logout-btn');
    
    // Logout handler
    logoutBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to logout?')) {
            clearToken();
            window.location.href = 'index.html';
        }
    });
    
    // Load dashboard data
    try {
        loading.style.display = 'block';
        dashboardContent.style.display = 'none';
        
        // Load store info
        const storeInfo = JSON.parse(localStorage.getItem(CONFIG.STORE_KEY) || '{}');
        if (storeInfo.shopDomain) {
            document.getElementById('store-info').innerHTML = `
                <p>Store: <strong>${storeInfo.shopDomain}</strong></p>
            `;
        }
        
        // Load balance
        const balanceResponse = await api.get('/billing/balance');
        if (balanceResponse.success) {
            document.getElementById('credits-amount').textContent = balanceResponse.data.credits || 0;
        }
        
        // Load campaigns count
        try {
            const campaignsResponse = await api.get('/campaigns?page=1&pageSize=1');
            if (campaignsResponse.success) {
                document.getElementById('campaigns-count').textContent = campaignsResponse.data.total || 0;
            }
        } catch (error) {
            document.getElementById('campaigns-count').textContent = '0';
        }
        
        // Load contacts count
        try {
            const contactsResponse = await api.get('/contacts?page=1&pageSize=1');
            if (contactsResponse.success) {
                document.getElementById('contacts-count').textContent = contactsResponse.data.total || 0;
            }
        } catch (error) {
            document.getElementById('contacts-count').textContent = '0';
        }
        
        loading.style.display = 'none';
        dashboardContent.style.display = 'block';
        
    } catch (error) {
        console.error('Dashboard load error:', error);
        loading.style.display = 'none';
        errorMessage.textContent = `Error loading dashboard: ${error.message}`;
        errorMessage.style.display = 'block';
    }
});

