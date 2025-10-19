// Dashboard functionality
document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    if (!isAuthenticated()) {
        window.location.href = '/login.html';
        return;
    }

    // Check if user is admin
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (userStr) {
        const user = JSON.parse(userStr);
        if (user.role !== 'ADMIN') {
            alert('Access Denied: Dashboard is only available for administrators.');
            window.location.href = '/index.html';
            return;
        }
    }

    await loadDashboardStats();
});

async function loadDashboardStats() {
    try {
        const data = await apiRequest('/events/dashboard/stats');
        
        if (data.success) {
            const stats = data.data;
            
            // Update stat cards
            document.getElementById('totalEvents').textContent = stats.totalEvents || 0;
            document.getElementById('totalAttendance').textContent = stats.totalAttendance || 0;
            document.getElementById('upcomingEvents').textContent = stats.upcomingEvents || 0;
            document.getElementById('activeEvents').textContent = stats.activeEvents || 0;
            
            // Display recent events
            displayRecentEvents(stats.recentEvents || []);
        }
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
        document.getElementById('recentEventsContainer').innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-circle me-2"></i>
                Failed to load dashboard statistics
            </div>
        `;
    }
}

function displayRecentEvents(events) {
    const container = document.getElementById('recentEventsContainer');
    
    if (events.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="fas fa-calendar-times fa-3x mb-3"></i>
                <p>No events found</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = events.map(event => {
        const eventDate = new Date(event.date);
        const now = new Date();
        const isUpcoming = eventDate > now;
        const attendanceCount = event._count?.attendance || 0;
        
        // Determine actual status based on date and attendance
        const actualStatus = determineEventStatus(event, eventDate, now, attendanceCount);
        const statusBadge = getStatusBadge(actualStatus);
        
        return `
            <div class="event-card card mb-3">
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col-md-8">
                            <h5 class="card-title mb-2">
                                ${event.name}
                                ${statusBadge}
                            </h5>
                            <p class="card-text text-muted mb-2">
                                <i class="fas fa-calendar me-2"></i>
                                ${formatDate(event.date)}
                            </p>
                            ${event.venue ? `
                                <p class="card-text text-muted mb-0">
                                    <i class="fas fa-map-marker-alt me-2"></i>
                                    ${event.venue}
                                </p>
                            ` : ''}
                        </div>
                        <div class="col-md-4 text-end">
                            <div class="mb-2">
                                <span class="badge bg-primary fs-6">
                                    <i class="fas fa-users me-1"></i>
                                    ${attendanceCount} Attendees
                                </span>
                            </div>
                            ${event.capacity ? `
                                <div class="progress mb-2" style="height: 25px;">
                                    <div class="progress-bar" role="progressbar" 
                                         style="width: ${(attendanceCount / event.capacity * 100).toFixed(0)}%"
                                         aria-valuenow="${attendanceCount}" 
                                         aria-valuemin="0" 
                                         aria-valuemax="${event.capacity}">
                                        ${attendanceCount}/${event.capacity}
                                    </div>
                                </div>
                            ` : ''}
                            <div>
                                <a href="admin.html?eventId=${event.id}" class="btn btn-sm btn-outline-primary me-1">
                                    <i class="fas fa-eye me-1"></i>View Details
                                </a>
                                <button onclick="downloadAttendance(${event.id}, '${event.name.replace(/'/g, "\\'")}')"
                                        class="btn btn-sm btn-success"
                                        ${attendanceCount === 0 ? 'disabled' : ''}>
                                    <i class="fas fa-file-excel me-1"></i>Excel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function determineEventStatus(event, eventDate, now, attendanceCount) {
    const dbStatus = (event.status || '').toUpperCase();
    
    // If event is cancelled, always show cancelled
    if (dbStatus === 'CANCELLED') {
        return 'CANCELLED';
    }
    
    // If event is explicitly marked as completed
    if (dbStatus === 'COMPLETED') {
        return 'COMPLETED';
    }
    
    // Check if event date has passed
    if (eventDate < now) {
        // Past event with attendance = completed
        if (attendanceCount > 0) {
            return 'COMPLETED';
        }
        // Past event with no attendance = missed (show as completed with note)
        return 'COMPLETED';
    }
    
    // Future event
    if (eventDate > now) {
        // If marked as active, show active
        if (dbStatus === 'ACTIVE') {
            return 'ACTIVE';
        }
        // Otherwise show upcoming
        return 'UPCOMING';
    }
    
    // Default to database status
    return dbStatus || 'UPCOMING';
}

function getStatusBadge(status) {
    // Normalize status to uppercase
    const normalizedStatus = (status || '').toUpperCase();
    
    const badges = {
        'UPCOMING': '<span class="badge bg-success ms-2">Upcoming</span>',
        'ACTIVE': '<span class="badge bg-primary ms-2">Active</span>',
        'COMPLETED': '<span class="badge bg-secondary ms-2">Completed</span>',
        'CANCELLED': '<span class="badge bg-danger ms-2">Cancelled</span>'
    };
    
    return badges[normalizedStatus] || '<span class="badge bg-secondary ms-2">Unknown</span>';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('en-US', options);
}

// Download attendance as Excel
async function downloadAttendance(eventId, eventName) {
    try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        
        // Show loading state
        const button = event.target;
        const originalHTML = button.innerHTML;
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Downloading...';
        
        const response = await fetch(`/api/events/${eventId}/export`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to download attendance');
        }
        
        // Get the blob from response
        const blob = await response.blob();
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance_${eventName.replace(/\s+/g, '_')}_${Date.now()}.xlsx`;
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        // Restore button
        button.disabled = false;
        button.innerHTML = originalHTML;
        
        // Show success message
        showToast('Attendance downloaded successfully!', 'success');
    } catch (error) {
        console.error('Error downloading attendance:', error);
        alert('Error downloading attendance. Please try again.');
        
        // Restore button
        if (event.target) {
            event.target.disabled = false;
            event.target.innerHTML = '<i class="fas fa-file-excel me-1"></i>Excel';
        }
    }
}

// Show toast notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `alert alert-${type} position-fixed top-0 start-50 translate-middle-x mt-3`;
    toast.style.zIndex = '9999';
    toast.innerHTML = `
        <i class="fas fa-check-circle me-2"></i>${message}
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}
