// Billing functionality
document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    requireAuth();
    
    const loading = document.getElementById('loading');
    const errorMessage = document.getElementById('error-message');
    const billingContent = document.getElementById('billing-content');
    const logoutBtn = document.getElementById('logout-btn');
    const packagesGrid = document.getElementById('packages-grid');
    
    // Logout handler
    logoutBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to logout?')) {
            clearToken();
            window.location.href = 'index.html';
        }
    });
    
    // Load billing data
    try {
        loading.style.display = 'block';
        billingContent.style.display = 'none';
        
        // Load balance
        const balanceResponse = await api.get('/billing/balance');
        if (balanceResponse.success) {
            const credits = balanceResponse.data.credits || 0;
            document.getElementById('balance-amount').textContent = `${credits} SMS Credits`;
        }
        
        // Load packages
        const packagesResponse = await api.get('/billing/packages');
        if (packagesResponse.success && packagesResponse.data.packages) {
            packagesGrid.innerHTML = packagesResponse.data.packages.map(pkg => `
                <div class="package-card">
                    <h3>${pkg.name}</h3>
                    <div class="package-price">
                        ${pkg.currency === 'USD' ? '$' : '€'}${pkg.price}
                    </div>
                    <p class="package-description">${pkg.description || ''}</p>
                    <button class="btn btn-primary" onclick="purchasePackage('${pkg.id}')">
                        Purchase
                    </button>
                </div>
            `).join('');
        } else {
            packagesGrid.innerHTML = '<p>No packages available</p>';
        }
        
        loading.style.display = 'none';
        billingContent.style.display = 'block';
        
    } catch (error) {
        console.error('Billing load error:', error);
        loading.style.display = 'none';
        errorMessage.textContent = `Error loading billing: ${error.message}`;
        errorMessage.style.display = 'block';
    }
});

// Purchase package function
async function purchasePackage(packageId) {
    try {
        const response = await api.post('/billing/purchase', {
            packageId: packageId,
            successUrl: window.location.origin + '/billing.html?success=true',
            cancelUrl: window.location.origin + '/billing.html?canceled=true',
        });
        
        if (response.success && response.data.sessionUrl) {
            // Open Stripe checkout in new window
            window.open(response.data.sessionUrl, '_blank');
        } else {
            alert('Failed to create purchase session');
        }
    } catch (error) {
        console.error('Purchase error:', error);
        alert(`Error: ${error.message}`);
    }
}

