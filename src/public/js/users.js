// User Management - Admin Panel
let allUsers = [];
let currentUserId = null;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication and admin role
    if (!isAuthenticated()) {
        window.location.href = '/login.html';
        return;
    }

    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (userStr) {
        const user = JSON.parse(userStr);
        if (user.role !== 'ADMIN') {
            alert('Admin access required');
            window.location.href = '/index.html';
            return;
        }
    }

    await loadUsers();
    setupEventHandlers();
});

// Setup event handlers
function setupEventHandlers() {
    // Search input
    document.getElementById('searchInput').addEventListener('input', debounce(filterUsers, 300));
    
    // Filter selects
    document.getElementById('roleFilter').addEventListener('change', filterUsers);
    document.getElementById('yearFilter').addEventListener('change', filterUsers);
    document.getElementById('departmentFilter').addEventListener('change', filterUsers);
    
    // Clear filters button
    document.getElementById('clearFiltersBtn').addEventListener('click', () => {
        document.getElementById('searchInput').value = '';
        document.getElementById('roleFilter').value = '';
        document.getElementById('yearFilter').value = '';
        document.getElementById('departmentFilter').value = '';
        filterUsers();
    });
    
    // Reset password modal buttons
    document.getElementById('generateTempPasswordBtn').addEventListener('click', generateTempPassword);
    document.getElementById('customPasswordBtn').addEventListener('click', showCustomPasswordForm);
    document.getElementById('cancelCustomPasswordBtn').addEventListener('click', hideCustomPasswordForm);
    document.getElementById('setCustomPasswordBtn').addEventListener('click', setCustomPassword);
    document.getElementById('copyPasswordBtn').addEventListener('click', copyTempPassword);
}

// Load all users
async function loadUsers() {
    try {
        const token = getToken();
        const response = await fetch(`${API_BASE_URL}/auth/users`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            allUsers = result.data;
            displayUsers(allUsers);
        } else {
            showError('Failed to load users: ' + result.message);
        }
    } catch (error) {
        console.error('Error loading users:', error);
        showError('Error loading users');
    }
}

// Display users
function displayUsers(users) {
    const container = document.getElementById('usersContainer');
    document.getElementById('userCount').textContent = users.length;
    
    if (users.length === 0) {
        container.innerHTML = `
            <div class="alert alert-info text-center">
                <i class="fas fa-users-slash fa-3x mb-3"></i>
                <p class="mb-0">No users found matching the criteria</p>
            </div>
        `;
        return;
    }
    
    const html = users.map(user => {
        const roleBadge = user.role === 'ADMIN' 
            ? '<span class="badge bg-danger badge-role">ADMIN</span>'
            : '<span class="badge bg-primary badge-role">USER</span>';
        
        const attendanceCount = user._count?.attendance || 0;
        
        return `
            <div class="card user-card mb-3">
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col-md-6">
                            <h5 class="card-title mb-2">
                                <i class="fas fa-user me-2 text-primary"></i>${user.name}
                                ${roleBadge}
                            </h5>
                            <p class="card-text mb-1">
                                <small class="text-muted">
                                    <i class="fas fa-envelope me-1"></i>${user.email}
                                </small>
                            </p>
                            ${user.mesId ? `
                                <p class="card-text mb-1">
                                    <small class="text-muted">
                                        <i class="fas fa-id-card me-1"></i>MES ID: ${user.mesId}
                                    </small>
                                </p>
                            ` : ''}
                            ${user.phone ? `
                                <p class="card-text mb-0">
                                    <small class="text-muted">
                                        <i class="fas fa-phone me-1"></i>${user.phone}
                                    </small>
                                </p>
                            ` : ''}
                        </div>
                        <div class="col-md-3">
                            ${user.rollNo ? `<p class="mb-1"><strong>Roll No:</strong> ${user.rollNo}</p>` : ''}
                            ${user.year ? `<p class="mb-1"><strong>Year:</strong> ${user.year}</p>` : ''}
                            ${user.division ? `<p class="mb-1"><strong>Division:</strong> ${user.division}</p>` : ''}
                            ${user.department ? `<p class="mb-0"><strong>Dept:</strong> ${user.department}</p>` : ''}
                        </div>
                        <div class="col-md-3 text-end">
                            <div class="mb-2">
                                <span class="badge bg-success fs-6">
                                    <i class="fas fa-check-circle me-1"></i>
                                    ${attendanceCount} Events Attended
                                </span>
                            </div>
                            <button class="btn btn-warning btn-sm" onclick="openResetPasswordModal(${user.id}, '${user.name.replace(/'/g, "\\'")}', '${user.email}')">
                                <i class="fas fa-key me-1"></i>Reset Password
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

// Filter users
function filterUsers() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const role = document.getElementById('roleFilter').value;
    const year = document.getElementById('yearFilter').value;
    const department = document.getElementById('departmentFilter').value;
    
    let filtered = allUsers;
    
    // Apply search filter
    if (search) {
        filtered = filtered.filter(user => 
            user.name.toLowerCase().includes(search) ||
            user.email.toLowerCase().includes(search) ||
            (user.rollNo && user.rollNo.toLowerCase().includes(search)) ||
            (user.mesId && user.mesId.toLowerCase().includes(search))
        );
    }
    
    // Apply role filter
    if (role) {
        filtered = filtered.filter(user => user.role === role);
    }
    
    // Apply year filter
    if (year) {
        filtered = filtered.filter(user => user.year === year);
    }
    
    // Apply department filter
    if (department) {
        filtered = filtered.filter(user => user.department === department);
    }
    
    displayUsers(filtered);
}

// Open reset password modal
function openResetPasswordModal(userId, userName, userEmail) {
    currentUserId = userId;
    
    const modal = new bootstrap.Modal(document.getElementById('resetPasswordModal'));
    
    // Reset modal state - show buttons again
    document.getElementById('customPasswordForm').style.display = 'none';
    document.getElementById('tempPasswordResult').style.display = 'none';
    document.getElementById('newPassword').value = '';
    
    // Show the main buttons
    document.getElementById('generateTempPasswordBtn').style.display = 'block';
    document.getElementById('customPasswordBtn').style.display = 'block';
    
    // Show user info
    document.getElementById('resetUserInfo').innerHTML = `
        <div class="card bg-light">
            <div class="card-body">
                <h6 class="card-title mb-2"><i class="fas fa-user me-2"></i>${userName}</h6>
                <p class="card-text mb-0"><small class="text-muted">${userEmail}</small></p>
            </div>
        </div>
    `;
    
    modal.show();
}

// Generate temporary password
async function generateTempPassword() {
    if (!currentUserId) return;
    
    const btn = document.getElementById('generateTempPasswordBtn');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Generating...';
    
    try {
        const token = getToken();
        const response = await fetch(`${API_BASE_URL}/auth/users/${currentUserId}/generate-temp-password`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Show temporary password
            document.getElementById('tempPasswordDisplay').value = result.data.tempPassword;
            document.getElementById('tempPasswordResult').style.display = 'block';
            
            // Hide buttons
            document.getElementById('generateTempPasswordBtn').style.display = 'none';
            document.getElementById('customPasswordBtn').style.display = 'none';
            
            alert(`Temporary password generated successfully!\n\nPassword: ${result.data.tempPassword}\n\nPlease share this with the user.`);
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error('Error generating temp password:', error);
        alert('Error generating temporary password');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

// Show custom password form
function showCustomPasswordForm() {
    document.getElementById('customPasswordForm').style.display = 'block';
    document.getElementById('generateTempPasswordBtn').style.display = 'none';
    document.getElementById('customPasswordBtn').style.display = 'none';
}

// Hide custom password form
function hideCustomPasswordForm() {
    document.getElementById('customPasswordForm').style.display = 'none';
    document.getElementById('generateTempPasswordBtn').style.display = 'block';
    document.getElementById('customPasswordBtn').style.display = 'block';
    document.getElementById('newPassword').value = '';
}

// Set custom password
async function setCustomPassword() {
    if (!currentUserId) return;
    
    const newPassword = document.getElementById('newPassword').value;
    
    if (!newPassword || newPassword.length < 6) {
        alert('Password must be at least 6 characters');
        return;
    }
    
    const btn = document.getElementById('setCustomPasswordBtn');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Setting...';
    
    try {
        const token = getToken();
        const response = await fetch(`${API_BASE_URL}/auth/users/${currentUserId}/reset-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ newPassword })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Password reset successfully!');
            bootstrap.Modal.getInstance(document.getElementById('resetPasswordModal')).hide();
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error('Error setting password:', error);
        alert('Error setting password');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

// Copy temporary password to clipboard
function copyTempPassword() {
    const tempPassword = document.getElementById('tempPasswordDisplay');
    tempPassword.select();
    document.execCommand('copy');
    
    const btn = document.getElementById('copyPasswordBtn');
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-check"></i>';
    
    setTimeout(() => {
        btn.innerHTML = originalHTML;
    }, 2000);
    
    alert('Password copied to clipboard!');
}

// Utility: Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Show error message
function showError(message) {
    document.getElementById('usersContainer').innerHTML = `
        <div class="alert alert-danger">
            <i class="fas fa-exclamation-triangle me-2"></i>
            ${message}
        </div>
    `;
}

// Make functions globally available
window.openResetPasswordModal = openResetPasswordModal;
