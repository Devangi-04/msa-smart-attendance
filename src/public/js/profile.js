// Profile page functionality

// Show alert in specific container
function showProfileAlert(message, type = 'danger', containerId = 'profileAlertContainer') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    container.innerHTML = '';
    container.appendChild(alert);
    
    setTimeout(() => {
        alert.remove();
    }, 5000);
}

// Load profile data
async function loadProfile() {
    try {
        const data = await apiRequest('/auth/profile');
        
        if (data.success) {
            const user = data.data;
            
            // Update profile display
            document.getElementById('profileName').textContent = user.name;
            document.getElementById('profileEmail').textContent = user.email;
            document.getElementById('profileRole').textContent = user.role;
            document.getElementById('profileDepartment').textContent = user.department || 'Not specified';
            document.getElementById('profilePhone').textContent = user.phone || 'Not specified';
            
            // Format member since date
            const memberSince = new Date(user.createdAt);
            document.getElementById('profileMemberSince').textContent = memberSince.toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            // Update stats
            document.getElementById('totalAttendance').textContent = user._count?.attendance || 0;
            
            if (user.role === 'ADMIN') {
                document.getElementById('totalCreatedEvents').textContent = user._count?.createdEvents || 0;
                document.querySelectorAll('.admin-only').forEach(el => {
                    el.style.display = '';
                });
            }
            
            // Populate edit form
            document.getElementById('editName').value = user.name;
            document.getElementById('editDepartment').value = user.department || '';
            document.getElementById('editPhone').value = user.phone || '';
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        showProfileAlert('Failed to load profile data', 'danger');
    }
}

// Load attendance history
async function loadAttendanceHistory() {
    try {
        const data = await apiRequest('/auth/my-attendance');
        
        if (data.success) {
            const attendance = data.data;
            const container = document.getElementById('attendanceHistory');
            
            if (attendance.length === 0) {
                container.innerHTML = `
                    <div class="text-center text-muted py-4">
                        <i class="fas fa-calendar-times fa-3x mb-3"></i>
                        <p>No attendance records found</p>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = `
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Event</th>
                                <th>Date</th>
                                <th>Venue</th>
                                <th>Marked At</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${attendance.slice(0, 10).map(record => {
                                const eventDate = new Date(record.event.date);
                                const markedAt = new Date(record.markedAt);
                                return `
                                    <tr>
                                        <td><strong>${record.event.name}</strong></td>
                                        <td>${eventDate.toLocaleDateString('en-IN')}</td>
                                        <td>${record.event.venue || 'N/A'}</td>
                                        <td>${markedAt.toLocaleString('en-IN')}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
                ${attendance.length > 10 ? `<p class="text-muted text-center mb-0">Showing 10 of ${attendance.length} records</p>` : ''}
            `;
        }
    } catch (error) {
        console.error('Error loading attendance history:', error);
        document.getElementById('attendanceHistory').innerHTML = `
            <div class="alert alert-danger">
                Failed to load attendance history
            </div>
        `;
    }
}

// Update profile form handler
document.getElementById('updateProfileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('editName').value.trim();
    const department = document.getElementById('editDepartment').value.trim();
    const phone = document.getElementById('editPhone').value.trim();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Updating...';
    
    try {
        const data = await apiRequest('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify({ name, department, phone })
        });
        
        if (data.success) {
            // Update stored user data
            const user = getUser();
            user.name = data.data.name;
            user.department = data.data.department;
            user.phone = data.data.phone;
            setUser(user);
            
            showProfileAlert('Profile updated successfully!', 'success');
            await loadProfile();
        } else {
            showProfileAlert(data.message || 'Failed to update profile', 'danger');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        showProfileAlert('An error occurred while updating profile', 'danger');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
});

// Change password form handler
document.getElementById('changePasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;
    
    if (newPassword !== confirmNewPassword) {
        showProfileAlert('New passwords do not match', 'danger', 'passwordAlertContainer');
        return;
    }
    
    if (newPassword.length < 6) {
        showProfileAlert('New password must be at least 6 characters', 'danger', 'passwordAlertContainer');
        return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Changing...';
    
    try {
        const data = await apiRequest('/auth/change-password', {
            method: 'POST',
            body: JSON.stringify({ currentPassword, newPassword })
        });
        
        if (data.success) {
            showProfileAlert('Password changed successfully!', 'success', 'passwordAlertContainer');
            document.getElementById('changePasswordForm').reset();
        } else {
            showProfileAlert(data.message || 'Failed to change password', 'danger', 'passwordAlertContainer');
        }
    } catch (error) {
        console.error('Error changing password:', error);
        showProfileAlert('An error occurred while changing password', 'danger', 'passwordAlertContainer');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    if (!isAuthenticated()) {
        window.location.href = '/login.html';
        return;
    }
    
    await loadProfile();
    await loadAttendanceHistory();
});
