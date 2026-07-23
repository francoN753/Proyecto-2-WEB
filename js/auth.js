// js/auth.js

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const submitBtn = document.getElementById('submit-btn');
    const themeToggle = document.getElementById('theme-toggle');

    // Theme Management
    const initTheme = () => {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);
    };

    const updateThemeIcon = (theme) => {
        const iconSvg = theme === 'dark' 
            ? '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>' // Sun icon
            : '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>'; // Moon icon
        
        themeToggle.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${iconSvg}</svg>`;
    };

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });

    // Check if already authenticated
    if (localStorage.getItem('authToken')) {
        window.location.href = 'dashboard.html';
        return;
    }

    // Login Form Submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // 1. Get values
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();

        if (!username || !password) return;

        // 2. Add loading state (spinner feedback)
        submitBtn.classList.add('btn-loading');
        submitBtn.disabled = true;

        // 3. Simulate async API call to personal server
        try {
            await simulateAuthAPI(username, password);
            
            // 4. On success, store token and redirect
            localStorage.setItem('authToken', 'token_simulado_' + Date.now());
            localStorage.setItem('loggedUser', username);
            window.location.href = 'dashboard.html';
            
        } catch (error) {
            // Remove loading state on error
            submitBtn.classList.remove('btn-loading');
            submitBtn.disabled = false;
            alert(error.message);
        }
    });

    function simulateAuthAPI(username, password) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Dummy validation
                if (username.length >= 3 && password.length >= 4) {
                    resolve({ success: true });
                } else {
                    reject(new Error("Credenciales inválidas. Intente nuevamente."));
                }
            }, 1500); // 1.5 second delay to show spinner
        });
    }

    // Initialize
    initTheme();
});
