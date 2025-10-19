// Authentication utilities
const API_BASE_URL = window.location.origin + '/api';

// Show alert message
function showAlert(message, type = 'danger') {
    const alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) return;
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    alertContainer.innerHTML = '';
    alertContainer.appendChild(alert);
    
    // Auto dismiss after 5 seconds
    setTimeout(() => {
        alert.remove();
    }, 5000);
}

// Get stored token
function getToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
}

// Store token
function setToken(token, remember = false) {
    if (remember) {
        localStorage.setItem('token', token);
    } else {
        sessionStorage.setItem('token', token);
    }
}

// Remove token
function removeToken() {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    localStorage.removeItem('user');
}

// Get stored user
function getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

// Store user
function setUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
}

// Check if user is authenticated
function isAuthenticated() {
    return !!getToken();
}

// Check if user is admin
function isAdmin() {
    const user = getUser();
    return user && user.role === 'ADMIN';
}

// Logout
function logout() {
    removeToken();
    window.location.href = '/login.html';
}

// Make authenticated API request
async function apiRequest(endpoint, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            if (response.status === 401) {
                removeToken();
                window.location.href = '/login.html';
            }
            throw new Error(data.message || 'Request failed');
        }
        
        return data;
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
}

// Login form handler
if (document.getElementById('loginForm')) {
    const loginForm = document.getElementById('loginForm');
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    
    // Toggle password visibility
    if (togglePassword) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            togglePassword.querySelector('i').classList.toggle('fa-eye');
            togglePassword.querySelector('i').classList.toggle('fa-eye-slash');
        });
    }
    
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const mesId = document.getElementById('mesId').value;
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('rememberMe').checked;
        
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Logging in...';
        
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ mesId, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
                setToken(data.data.token, rememberMe);
                setUser(data.data.user);
                showAlert('Login successful! Redirecting...', 'success');
                
                setTimeout(() => {
                    if (data.data.user.role === 'ADMIN') {
                        window.location.href = '/admin.html';
                    } else {
                        window.location.href = '/index.html';
                    }
                }, 1000);
            } else {
                showAlert(data.message || 'Login failed', 'danger');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        } catch (error) {
            showAlert('An error occurred. Please try again.', 'danger');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    });
}

// Register form handler
if (document.getElementById('registerForm')) {
    const registerForm = document.getElementById('registerForm');
    
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Get all form values
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const department = document.getElementById('department').value;
        const phone = document.getElementById('phone').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // MSA specific fields
        const rollNo = document.getElementById('rollNo').value;
        const year = document.getElementById('year').value;
        const division = document.getElementById('division').value;
        const msaTeam = document.getElementById('msaTeam').value;
        const gender = document.getElementById('gender').value;
        const dateOfBirth = document.getElementById('dateOfBirth').value;
        const admissionNumber = document.getElementById('admissionNumber').value;
        const mesId = document.getElementById('mesId').value;
        
        // Validate passwords match
        if (password !== confirmPassword) {
            showAlert('Passwords do not match', 'danger');
            return;
        }
        
        const submitBtn = registerForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Registering...';
        
        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name,
                    email,
                    department,
                    phone,
                    password,
                    // MSA specific fields
                    rollNo,
                    year,
                    division,
                    msaTeam: msaTeam || undefined,
                    gender,
                    dateOfBirth,
                    admissionNumber,
                    mesId
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                setToken(data.data.token, false);
                setUser(data.data.user);
                showAlert('Registration successful! Redirecting...', 'success');
                
                setTimeout(() => {
                    window.location.href = '/index.html';
                }, 1000);
            } else {
                showAlert(data.message || 'Registration failed', 'danger');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        } catch (error) {
            showAlert('An error occurred. Please try again.', 'danger');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    });
}

// Check authentication on protected pages
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

// Check admin access
function requireAdmin() {
    if (!isAuthenticated()) {
        window.location.href = '/login.html';
        return false;
    }
    if (!isAdmin()) {
        showAlert('Admin access required', 'danger');
        window.location.href = '/index.html';
        return false;
    }
    return true;
}

// Update UI based on auth status
function updateAuthUI() {
    const user = getUser();
    if (!user) return;
    
    // Update user name displays
    document.querySelectorAll('.user-name').forEach(el => {
        el.textContent = user.name;
    });
    
    // Update user email displays
    document.querySelectorAll('.user-email').forEach(el => {
        el.textContent = user.email;
    });
    
    // Show/hide admin elements
    if (user.role !== 'ADMIN') {
        document.querySelectorAll('.admin-only').forEach(el => {
            el.style.display = 'none';
        });
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
});
