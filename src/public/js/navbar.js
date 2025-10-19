// Navbar authentication UI handler
(function() {
    'use strict';

    // Initialize navbar on page load
    document.addEventListener('DOMContentLoaded', function() {
        updateNavbar();
    });

    // Update navbar based on authentication status
    function updateNavbar() {
        const authNav = document.getElementById('authNav');
        if (!authNav) return;

        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');

        if (token && userStr) {
            try {
                const user = JSON.parse(userStr);
                renderAuthenticatedNav(authNav, user);
                showAdminLinks(user.role);
            } catch (error) {
                console.error('Error parsing user data:', error);
                renderGuestNav(authNav);
            }
        } else {
            renderGuestNav(authNav);
        }
    }

    // Render navbar for authenticated users
    function renderAuthenticatedNav(container, user) {
        const dashboardLink = user.role === 'ADMIN' ? `
            <li>
                <a class="dropdown-item" href="dashboard.html">
                    <i class="fas fa-chart-line me-2"></i>Dashboard
                </a>
            </li>
        ` : '';

        container.innerHTML = `
            <li class="nav-item dropdown">
                <a class="nav-link dropdown-toggle" href="#" id="userDropdown" role="button" 
                   data-bs-toggle="dropdown" aria-expanded="false">
                    <i class="fas fa-user-circle me-1"></i>
                    <span class="user-name">${user.name || 'User'}</span>
                </a>
                <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
                    <li>
                        <a class="dropdown-item disabled" href="#">
                            <small class="text-muted">${user.email}</small>
                        </a>
                    </li>
                    <li><hr class="dropdown-divider"></li>
                    ${dashboardLink}
                    <li>
                        <a class="dropdown-item" href="#" onclick="changePassword()">
                            <i class="fas fa-key me-2"></i>Change Password
                        </a>
                    </li>
                    <li><hr class="dropdown-divider"></li>
                    <li>
                        <a class="dropdown-item text-danger" href="#" onclick="logout()">
                            <i class="fas fa-sign-out-alt me-2"></i>Logout
                        </a>
                    </li>
                </ul>
            </li>
        `;
    }

    // Render navbar for guest users
    function renderGuestNav(container) {
        container.innerHTML = `
            <li class="nav-item">
                <a class="nav-link" href="login.html">
                    <i class="fas fa-sign-in-alt me-1"></i>Login
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="register.html">
                    <i class="fas fa-user-plus me-1"></i>Register
                </a>
            </li>
        `;
        hideAdminLinks();
    }

    // Show/hide admin links based on user role
    function showAdminLinks(role) {
        const adminLinks = document.querySelectorAll('.admin-only');
        adminLinks.forEach(link => {
            if (role === 'ADMIN') {
                link.style.display = '';
            } else {
                link.style.display = 'none';
            }
        });

        // Also hide Dashboard link in main nav for non-admins
        const dashboardLinks = document.querySelectorAll('a[href="dashboard.html"]');
        dashboardLinks.forEach(link => {
            const parentLi = link.closest('li.nav-item');
            if (parentLi && !parentLi.classList.contains('dropdown')) {
                if (role === 'ADMIN') {
                    parentLi.style.display = '';
                } else {
                    parentLi.style.display = 'none';
                }
            }
        });
    }

    // Hide admin links for guests
    function hideAdminLinks() {
        const adminLinks = document.querySelectorAll('.admin-only');
        adminLinks.forEach(link => {
            link.style.display = 'none';
        });

        // Also hide Dashboard link for guests
        const dashboardLinks = document.querySelectorAll('a[href="dashboard.html"]');
        dashboardLinks.forEach(link => {
            const parentLi = link.closest('li.nav-item');
            if (parentLi && !parentLi.classList.contains('dropdown')) {
                parentLi.style.display = 'none';
            }
        });
    }

    // Make updateNavbar available globally
    window.updateNavbar = updateNavbar;

    // Logout function
    window.logout = function() {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('user');
            
            // Show success message
            alert('Logged out successfully!');
            
            // Redirect to login page
            window.location.href = 'login.html';
        }
    };

    // Change password function
    window.changePassword = function() {
        const oldPassword = prompt('Enter your current password:');
        if (!oldPassword) return;

        const newPassword = prompt('Enter your new password:');
        if (!newPassword) return;

        const confirmPassword = prompt('Confirm your new password:');
        if (newPassword !== confirmPassword) {
            alert('Passwords do not match!');
            return;
        }

        if (newPassword.length < 6) {
            alert('Password must be at least 6 characters long!');
            return;
        }

        // Call API to change password
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        
        fetch('/api/auth/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                currentPassword: oldPassword,
                newPassword: newPassword
            })
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                alert('Password changed successfully!');
            } else {
                alert('Error: ' + result.message);
            }
        })
        .catch(error => {
            console.error('Error changing password:', error);
            alert('Error changing password. Please try again.');
        });
    };
})();
