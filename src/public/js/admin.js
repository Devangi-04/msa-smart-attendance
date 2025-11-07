// Admin Panel - Events & Meetings CRUD Management
// API_BASE_URL is already declared in auth.js

let currentEventId = null;
let currentQRCode = null;
let allEvents = [];

// Helper function to safely get token
function safeGetToken() {
    if (typeof getToken === 'function') {
        return getToken();
    }
    return localStorage.getItem('token') || sessionStorage.getItem('token');
}

// Initialize the admin panel
async function initializeAdmin() {
    console.log('Admin.js: Initializing admin panel...');
    
    try {
        // Check authentication
        const token = safeGetToken();
        console.log('Admin.js: Token found:', !!token);
        
        if (!token) {
            console.log('Admin.js: No token found, redirecting to login...');
            alert('Please login to access the admin panel.');
            window.location.href = 'login.html';
            return;
        }
        
        // Check if user is admin
        const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            console.log('Admin.js: User role:', user.role);
            if (user.role !== 'ADMIN') {
                alert('Admin access required. You will be redirected to the home page.');
                window.location.href = 'index.html';
                return;
            }
        }
        
        console.log('Admin.js: Authentication successful, loading events...');
        await loadEvents();
        console.log('Admin.js: Events loaded, setting up handlers...');
        setupEventHandlers();
        
        // Check if there's an eventId in the URL
        const urlParams = new URLSearchParams(window.location.search);
        const eventId = urlParams.get('eventId');
        if (eventId) {
            console.log('Admin.js: Found eventId in URL:', eventId);
            // Open the event details modal
            await viewEventDetails(parseInt(eventId));
        }
        
        console.log('Admin.js: Initialization complete');
    } catch (error) {
        console.error('Admin.js: Initialization error:', error);
        const eventList = document.getElementById('eventList');
        if (eventList) {
            eventList.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Initialization error: ' + error.message + '<br><small>Check console for details</small></td></tr>';
        }
    }
}

// Set up event handlers
function setupEventHandlers() {
    console.log('Admin.js: Setting up event handlers...');
    
    // Add New Event button
    const addNewEventBtn = document.getElementById('addNewEventBtn');
    if (addNewEventBtn) {
        addNewEventBtn.addEventListener('click', () => openEventModal());
        console.log('Admin.js: Add New Event button handler attached');
    } else {
        console.error('Admin.js: addNewEventBtn not found!');
    }
    
    // Save Event button
    const saveEventBtn = document.getElementById('saveEventBtn');
    if (saveEventBtn) {
        saveEventBtn.addEventListener('click', saveEvent);
        console.log('Admin.js: Save Event button handler attached');
    } else {
        console.error('Admin.js: saveEventBtn not found!');
    }
    
    // Get Current Location button
    const getCurrentLocationBtn = document.getElementById('getCurrentLocation');
    if (getCurrentLocationBtn) {
        getCurrentLocationBtn.addEventListener('click', getEventLocation);
        console.log('Admin.js: Get Current Location button handler attached');
    } else {
        console.error('Admin.js: getCurrentLocation button not found!');
    }
    
    // Download QR button
    const downloadQRBtn = document.getElementById('downloadQR');
    if (downloadQRBtn) {
        downloadQRBtn.addEventListener('click', downloadQRCode);
        console.log('Admin.js: Download QR button handler attached');
    } else {
        console.error('Admin.js: downloadQR button not found!');
    }
    
    // Export Attendance button
    const exportAttendanceBtn = document.getElementById('exportAttendanceBtn');
    if (exportAttendanceBtn) {
        exportAttendanceBtn.addEventListener('click', exportAttendance);
        console.log('Admin.js: Export Attendance button handler attached');
    } else {
        console.error('Admin.js: exportAttendanceBtn not found!');
    }
    
    // Monthly Report button
    const monthlyReportBtn = document.getElementById('monthlyReportBtn');
    if (monthlyReportBtn) {
        monthlyReportBtn.addEventListener('click', () => {
            // Set default to current month
            const now = new Date();
            const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            document.getElementById('reportMonth').value = currentMonth;
            
            const modal = new bootstrap.Modal(document.getElementById('monthlyReportModal'));
            modal.show();
        });
        console.log('Admin.js: Monthly Report button handler attached');
    } else {
        console.error('Admin.js: monthlyReportBtn not found!');
    }
    
    // Download Monthly Report button
    const downloadMonthlyReportBtn = document.getElementById('downloadMonthlyReportBtn');
    if (downloadMonthlyReportBtn) {
        downloadMonthlyReportBtn.addEventListener('click', downloadMonthlyReport);
        console.log('Admin.js: Download Monthly Report button handler attached');
    } else {
        console.error('Admin.js: downloadMonthlyReportBtn not found!');
    }
}

// ==================== CRUD OPERATIONS ====================

// Load and display all events
async function loadEvents() {
    console.log('Admin.js: loadEvents called');
    const eventList = document.getElementById('eventList');
    
    if (!eventList) {
        console.error('Admin.js: eventList element not found!');
        return;
    }
    
    try {
        console.log('Admin.js: Fetching events from:', `${API_BASE_URL}/events`);
        const response = await fetch(`${API_BASE_URL}/events`);
        console.log('Admin.js: Response status:', response.status);
        
        const result = await response.json();
        console.log('Admin.js: Response data:', result);
        
        if (result.success && result.data) {
            allEvents = result.data;
            console.log('Admin.js: Number of events:', result.data.length);
            displayEvents(result.data);
        } else {
            console.error('Admin.js: Failed to load events:', result.message);
            eventList.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error loading events: ' + (result.message || 'Unknown error') + '</td></tr>';
        }
    } catch (error) {
        console.error('Admin.js: Error loading events:', error);
        eventList.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error loading events: ' + error.message + '</td></tr>';
    }
}

// Display events in table
function displayEvents(events) {
    console.log('Admin.js: displayEvents called with', events ? events.length : 0, 'events');
    const eventList = document.getElementById('eventList');
    
    if (!eventList) {
        console.error('Admin.js: eventList not found in displayEvents!');
        return;
    }
    
    if (!events || events.length === 0) {
        console.log('Admin.js: No events to display, showing empty message');
        eventList.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No events found. Click "Add New Event" to create one.</td></tr>';
        return;
    }
    
    console.log('Admin.js: Rendering', events.length, 'events...');
    
    eventList.innerHTML = events.map(event => {
        const eventDate = new Date(event.date);
        const formattedDate = eventDate.toLocaleString('en-IN', { 
            dateStyle: 'medium', 
            timeStyle: 'short' 
        });
        
        const attendanceCount = event._count?.attendance || event.attendanceCount || 0;
        const capacity = event.capacity || 'N/A';
        const attendanceDisplay = event.capacity ? `${attendanceCount}/${capacity}` : attendanceCount;
        
        // Status badge
        let statusBadge = '';
        const status = event.status || 'UPCOMING';
        switch(status) {
            case 'UPCOMING':
                statusBadge = '<span class="badge bg-success">Upcoming</span>';
                break;
            case 'ACTIVE':
                statusBadge = '<span class="badge bg-primary">Active</span>';
                break;
            case 'COMPLETED':
                statusBadge = '<span class="badge bg-secondary">Completed</span>';
                break;
            case 'CANCELLED':
                statusBadge = '<span class="badge bg-danger">Cancelled</span>';
                break;
            default:
                statusBadge = `<span class="badge bg-info">${status}</span>`;
        }
        
        return `
            <tr>
                <td><strong>${event.name}</strong></td>
                <td>${formattedDate}</td>
                <td>${event.venue || event.location || 'N/A'}</td>
                <td>${statusBadge}</td>
                <td>${attendanceDisplay}</td>
                <td>
                    <div class="btn-group btn-group-sm" role="group">
                        <button class="btn btn-outline-primary" onclick="showEventQR(${event.id})" title="Show QR Code">
                            <i class="fas fa-qrcode"></i>
                        </button>
                        <button class="btn btn-outline-info" onclick="viewEventAttendance(${event.id})" title="View Attendance">
                            <i class="fas fa-users"></i>
                        </button>
                        <button class="btn btn-outline-warning" onclick="editEvent(${event.id})" title="Edit Event">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="deleteEvent(${event.id}, '${event.name.replace(/'/g, "\\'")}')" title="Delete Event">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Open event modal (for add or edit)
function openEventModal(event = null) {
    const modal = new bootstrap.Modal(document.getElementById('eventModal'));
    const title = document.getElementById('eventModalTitle');
    const form = document.getElementById('eventForm');
    
    form.reset();
    
    if (event) {
        // Edit mode
        title.textContent = 'Edit Event';
        document.getElementById('eventId').value = event.id;
        document.getElementById('isEditMode').value = 'true';
        document.getElementById('eventName').value = event.name;
        document.getElementById('eventDate').value = new Date(event.date).toISOString().slice(0, 16);
        document.getElementById('eventVenue').value = event.venue || event.location || '';
        document.getElementById('eventStatus').value = event.status || 'UPCOMING';
        document.getElementById('eventDescription').value = event.description || '';
        document.getElementById('eventCapacity').value = event.capacity || '';
        document.getElementById('eventRadius').value = event.radius || 100;
        document.getElementById('latitude').value = event.latitude || '';
        document.getElementById('longitude').value = event.longitude || '';
    } else {
        // Add mode
        title.textContent = 'Create New Event';
        document.getElementById('eventId').value = '';
        document.getElementById('isEditMode').value = 'false';
        document.getElementById('eventStatus').value = 'UPCOMING';
        document.getElementById('eventRadius').value = 100;
    }
    
    modal.show();
}

// Edit event - load event data and open modal
async function editEvent(eventId) {
    try {
        const response = await fetch(`${API_BASE_URL}/events/${eventId}`);
        const result = await response.json();
        
        if (result.success && result.data) {
            openEventModal(result.data);
        } else {
            alert('Error loading event details');
        }
    } catch (error) {
        console.error('Error loading event:', error);
        alert('Error loading event details');
    }
}

// Save event (create or update)
async function saveEvent() {
    console.log('Admin.js: saveEvent called');
    const eventId = document.getElementById('eventId').value;
    const isEditMode = document.getElementById('isEditMode').value === 'true';
    
    // Get form values
    const name = document.getElementById('eventName').value.trim();
    const date = document.getElementById('eventDate').value;
    const venue = document.getElementById('eventVenue').value.trim();
    const status = document.getElementById('eventStatus').value;
    const description = document.getElementById('eventDescription').value.trim();
    const capacity = document.getElementById('eventCapacity').value;
    const radius = document.getElementById('eventRadius').value;
    const latitude = document.getElementById('latitude').value;
    const longitude = document.getElementById('longitude').value;
    
    console.log('Admin.js: Form values:', { name, date, venue, status, radius, latitude, longitude });
    
    // Validate required fields
    if (!name || !date || !venue || !radius || !latitude || !longitude) {
        alert('Please fill in all required fields (marked with *)\n\nMissing:\n' + 
              (!name ? '- Event Name\n' : '') +
              (!date ? '- Date & Time\n' : '') +
              (!venue ? '- Venue\n' : '') +
              (!radius ? '- GPS Radius\n' : '') +
              (!latitude || !longitude ? '- GPS Coordinates (Click "Get Current Location")\n' : ''));
        return;
    }
    
    const eventData = {
        name,
        date: new Date(date).toISOString(),
        venue,
        status,
        description: description || undefined,
        capacity: capacity ? parseInt(capacity) : undefined,
        radius: parseInt(radius),
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
    };
    
    const token = safeGetToken();
    console.log('Admin.js: Token exists:', !!token);
    
    if (!token) {
        alert('Please login to manage events.\n\nYou will be redirected to the login page.');
        window.location.href = 'login.html';
        return;
    }
    
    try {
        const url = isEditMode && eventId 
            ? `${API_BASE_URL}/events/${eventId}` 
            : `${API_BASE_URL}/events/create`;
        
        const method = isEditMode && eventId ? 'PUT' : 'POST';
        
        console.log('Admin.js: Sending request to:', url);
        console.log('Admin.js: Method:', method);
        console.log('Admin.js: Event data:', eventData);
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(eventData)
        });
        
        console.log('Admin.js: Response status:', response.status);
        const result = await response.json();
        console.log('Admin.js: Response data:', result);
        
        if (result.success) {
            bootstrap.Modal.getInstance(document.getElementById('eventModal')).hide();
            await loadEvents();
            alert(isEditMode ? 'Event updated successfully!' : 'Event created successfully!');
        } else {
            alert('Error saving event:\n\n' + (result.message || 'Unknown error'));
            console.error('Admin.js: Server error:', result);
        }
    } catch (error) {
        console.error('Admin.js: Error saving event:', error);
        alert('Error saving event:\n\n' + error.message + '\n\nCheck console for details.');
    }
}

// Delete event
async function deleteEvent(eventId, eventName) {
    if (!confirm(`Are you sure you want to delete "${eventName}"?\n\nThis action cannot be undone.`)) {
        return;
    }
    
    const token = safeGetToken();
    if (!token) {
        alert('Please login to delete events');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            await loadEvents();
            alert('Event deleted successfully!');
        } else {
            alert(result.message || 'Error deleting event');
        }
    } catch (error) {
        console.error('Error deleting event:', error);
        alert('Error deleting event. Please try again.');
    }
}

// ==================== ADDITIONAL FEATURES ====================

// Get current location for event
function getEventLocation() {
    const btn = document.getElementById('getCurrentLocation');
    
    if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser');
        return;
    }
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Getting location...';
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            document.getElementById('latitude').value = position.coords.latitude.toFixed(6);
            document.getElementById('longitude').value = position.coords.longitude.toFixed(6);
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-map-marker-alt me-1"></i>Get Current Location';
            alert('Location set successfully!');
        },
        (error) => {
            alert('Error getting location: ' + error.message);
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-map-marker-alt me-1"></i>Get Current Location';
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

// Show QR code for an event
async function showEventQR(eventId) {
    const token = safeGetToken();
    if (!token) {
        alert('Please login to view QR codes');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/events/${eventId}/qr`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            currentQRCode = result.qrCode;
            currentEventId = eventId;
            document.getElementById('qrcode').innerHTML = `<img src="${result.qrCode}" class="img-fluid" style="max-width: 400px;">`;
            document.getElementById('qrEventName').textContent = result.eventName;
            document.getElementById('qrEventDate').textContent = new Date(result.eventDate).toLocaleString();
            
            const modal = new bootstrap.Modal(document.getElementById('qrModal'));
            modal.show();
        } else {
            alert('Error generating QR code: ' + result.message);
        }
    } catch (error) {
        console.error('Error generating QR code:', error);
        alert('Error generating QR code. Please try again.');
    }
}

// View attendance for an event
async function viewEventAttendance(eventId, showDetailsOnClose = false) {
    const modalElement = document.getElementById('attendanceModal');
    const modal = new bootstrap.Modal(modalElement);
    const content = document.getElementById('attendanceContent');
    
    currentEventId = eventId;
    content.innerHTML = '<div class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';
    
    // If showDetailsOnClose is true, add event listener to show details when modal closes
    if (showDetailsOnClose) {
        const handleModalHidden = () => {
            showEventDetailsModal(eventId);
            modalElement.removeEventListener('hidden.bs.modal', handleModalHidden);
        };
        modalElement.addEventListener('hidden.bs.modal', handleModalHidden);
    }
    
    modal.show();
    
    try {
        const response = await fetch(`${API_BASE_URL}/attendance/list/${eventId}`);
        const result = await response.json();
        
        if (result.success) {
            if (result.data.length === 0) {
                content.innerHTML = '<div class="alert alert-info"><i class="fas fa-info-circle me-2"></i>No attendance records found for this event.</div>';
                return;
            }
            
            // Create attendance table
            let html = `
                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>S.No</th>
                                <th>Name</th>
                                <th>Roll No</th>
                                <th>Email</th>
                                <th>Marked At</th>
                                <th>Lectures Missed</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            result.data.forEach((record, index) => {
                const user = record.user || {};
                const markedAt = new Date(record.markedAt || record.reportingTime).toLocaleString();
                html += `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${user.name || 'N/A'}</td>
                        <td>${user.rollNo || 'N/A'}</td>
                        <td>${user.email || 'N/A'}</td>
                        <td>${markedAt}</td>
                        <td>${record.lecturesMissed || 0}</td>
                    </tr>
                `;
            });
            
            html += `
                        </tbody>
                    </table>
                </div>
                <div class="alert alert-success mt-3">
                    <strong>Total Attendance:</strong> ${result.data.length}
                </div>
            `;
            
            content.innerHTML = html;
        } else {
            content.innerHTML = '<div class="alert alert-danger"><i class="fas fa-exclamation-triangle me-2"></i>Error loading attendance records</div>';
        }
    } catch (error) {
        console.error('Error fetching attendance:', error);
        content.innerHTML = '<div class="alert alert-danger"><i class="fas fa-exclamation-triangle me-2"></i>Error loading attendance records</div>';
    }
}

// Export attendance to Excel
async function exportAttendance() {
    console.log('Admin.js: exportAttendance called for event:', currentEventId);
    
    if (!currentEventId) {
        alert('No event selected');
        return;
    }
    
    const token = safeGetToken();
    console.log('Admin.js: Token exists for export:', !!token);
    
    if (!token) {
        alert('Please login to export attendance');
        return;
    }
    
    try {
        console.log('Admin.js: Fetching export from:', `${API_BASE_URL}/events/${currentEventId}/export`);
        
        const response = await fetch(`${API_BASE_URL}/events/${currentEventId}/export`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('Admin.js: Export response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to export attendance');
        }
        
        // Get the blob from response
        const blob = await response.blob();
        console.log('Admin.js: Blob received, size:', blob.size);
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `attendance-event-${currentEventId}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        console.log('Admin.js: Export successful');
        alert('Attendance exported successfully!');
    } catch (error) {
        console.error('Admin.js: Error exporting attendance:', error);
        alert('Error exporting attendance: ' + error.message);
    }
}

// Download QR code
function downloadQRCode() {
    if (!currentQRCode) {
        alert('No QR code available');
        return;
    }
    
    const link = document.createElement('a');
    link.download = `event-qr-${currentEventId}.png`;
    link.href = currentQRCode;
    link.click();
}

// Show event details modal
async function showEventDetailsModal(eventId) {
    console.log('Admin.js: showEventDetailsModal called for eventId:', eventId);
    
    try {
        // Fetch fresh event data
        const response = await fetch(`${API_BASE_URL}/events/${eventId}`);
        const result = await response.json();
        
        if (!result.success || !result.data) {
            alert('Error loading event details');
            return;
        }
        
        const event = result.data;
        const eventDate = new Date(event.date);
        const now = new Date();
        const attendanceCount = event._count?.attendance || 0;
        
        // Determine status
        let statusBadge = '';
        const status = event.status || 'UPCOMING';
        switch(status) {
            case 'UPCOMING':
                statusBadge = '<span class="badge bg-success">Upcoming</span>';
                break;
            case 'ACTIVE':
                statusBadge = '<span class="badge bg-primary">Active</span>';
                break;
            case 'COMPLETED':
                statusBadge = '<span class="badge bg-secondary">Completed</span>';
                break;
            case 'CANCELLED':
                statusBadge = '<span class="badge bg-danger">Cancelled</span>';
                break;
        }
        
        // Create modal content
        const modalContent = `
            <div class="modal fade" id="eventDetailsModal" tabindex="-1">
                <div class="modal-dialog modal-lg modal-dialog-scrollable">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title"><i class="fas fa-info-circle me-2"></i>Event Details</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body" style="background-color: #f8f9fa;">
                            <div class="event-details-content">
                                <h4 class="mb-3 d-flex flex-wrap align-items-center gap-2">
                                    <span class="event-name-text">${event.name}</span>
                                    ${statusBadge}
                                </h4>
                                
                                <div class="card mb-3 border-0 shadow-sm">
                                    <div class="card-body">
                                        <div class="row g-3">
                                            <div class="col-12 col-md-6">
                                                <div class="detail-item">
                                                    <p class="mb-1"><strong><i class="fas fa-calendar me-2 text-primary"></i>Date & Time:</strong></p>
                                                    <p class="mb-0 ms-4">${eventDate.toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' })}</p>
                                                </div>
                                            </div>
                                            <div class="col-12 col-md-6">
                                                <div class="detail-item">
                                                    <p class="mb-1"><strong><i class="fas fa-map-marker-alt me-2 text-danger"></i>Venue:</strong></p>
                                                    <p class="mb-0 ms-4">${event.venue || 'Not specified'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                ${event.description ? `
                                    <div class="card mb-3 border-0 shadow-sm">
                                        <div class="card-body">
                                            <p class="mb-1"><strong><i class="fas fa-align-left me-2 text-info"></i>Description:</strong></p>
                                            <p class="mb-0 ms-4">${event.description}</p>
                                        </div>
                                    </div>
                                ` : ''}
                                
                                <div class="card mb-3 border-0 shadow-sm">
                                    <div class="card-body">
                                        <div class="row g-3">
                                            <div class="col-12 col-md-6">
                                                <div class="detail-item">
                                                    <p class="mb-1"><strong><i class="fas fa-users me-2 text-success"></i>Attendance:</strong></p>
                                                    <p class="mb-0 ms-4">
                                                        <span class="badge bg-success fs-6">${attendanceCount}${event.capacity ? ` / ${event.capacity}` : ''}</span>
                                                        <span class="ms-2">attendees</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <div class="col-12 col-md-6">
                                                <div class="detail-item">
                                                    <p class="mb-1"><strong><i class="fas fa-map-pin me-2 text-warning"></i>GPS Radius:</strong></p>
                                                    <p class="mb-0 ms-4">${event.radius || 100} meters</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                ${event.latitude && event.longitude ? `
                                    <div class="card mb-3 border-0 shadow-sm">
                                        <div class="card-body">
                                            <p class="mb-1"><strong><i class="fas fa-location-arrow me-2 text-secondary"></i>GPS Coordinates:</strong></p>
                                            <p class="mb-0 ms-4"><small>Lat: ${event.latitude}, Long: ${event.longitude}</small></p>
                                        </div>
                                    </div>
                                ` : ''}
                                
                                <div class="card border-primary">
                                    <div class="card-header bg-primary text-white">
                                        <strong><i class="fas fa-bolt me-2"></i>Quick Actions</strong>
                                    </div>
                                    <div class="card-body">
                                        <div class="d-grid gap-2">
                                            <button class="btn btn-primary" onclick="closeEventDetailsAndShowQR(${event.id})">
                                                <i class="fas fa-qrcode me-2"></i>Show QR Code
                                            </button>
                                            <button class="btn btn-info" onclick="closeEventDetailsAndShowAttendance(${event.id})">
                                                <i class="fas fa-users me-2"></i>View Attendance
                                            </button>
                                            <button class="btn btn-warning" onclick="bootstrap.Modal.getInstance(document.getElementById('eventDetailsModal')).hide(); editEvent(${event.id})">
                                                <i class="fas fa-edit me-2"></i>Edit Event
                                            </button>
                                            ${attendanceCount > 0 ? `
                                                <button class="btn btn-success" onclick="currentEventId=${event.id}; exportAttendance()">
                                                    <i class="fas fa-file-excel me-2"></i>Export to Excel
                                                </button>
                                            ` : ''}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer bg-white">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="fas fa-times me-1"></i>Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal if present
        const existingModal = document.getElementById('eventDetailsModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalContent);
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('eventDetailsModal'));
        modal.show();
        
        // Clean up modal after it's hidden
        document.getElementById('eventDetailsModal').addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
        
    } catch (error) {
        console.error('Admin.js: Error showing event details:', error);
        alert('Error loading event details: ' + error.message);
    }
}

// Helper function to close event details and show QR
function closeEventDetailsAndShowQR(eventId) {
    const detailsModal = bootstrap.Modal.getInstance(document.getElementById('eventDetailsModal'));
    if (detailsModal) {
        detailsModal.hide();
        // Wait for modal to close before showing QR
        setTimeout(() => {
            showEventQR(eventId);
        }, 300);
    } else {
        showEventQR(eventId);
    }
}

// Helper function to close event details and show attendance
function closeEventDetailsAndShowAttendance(eventId) {
    const detailsModal = bootstrap.Modal.getInstance(document.getElementById('eventDetailsModal'));
    if (detailsModal) {
        detailsModal.hide();
        // Wait for modal to close before showing attendance
        setTimeout(() => {
            viewEventAttendance(eventId);
        }, 300);
    } else {
        viewEventAttendance(eventId);
    }
}

// View event details - shows attendance modal for specific event, then details on close
async function viewEventDetails(eventId) {
    console.log('Admin.js: viewEventDetails called for eventId:', eventId);
    
    // Find the event in the loaded events
    const event = allEvents.find(e => e.id === eventId);
    
    if (!event) {
        console.error('Admin.js: Event not found:', eventId);
        alert('Event not found. Please refresh the page and try again.');
        return;
    }
    
    // Open the attendance modal for this event, and show details when it closes
    await viewEventAttendance(eventId, true);
}

// Download monthly report
async function downloadMonthlyReport() {
    const reportMonth = document.getElementById('reportMonth').value;
    
    if (!reportMonth) {
        alert('Please select a month');
        return;
    }
    
    // Parse year and month from the input (format: YYYY-MM)
    const [year, month] = reportMonth.split('-');
    
    console.log('Admin.js: Downloading monthly report for:', year, month);
    
    try {
        const token = safeGetToken();
        const response = await fetch(`${API_BASE_URL}/events/reports/monthly?year=${year}&month=${month}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to download report');
        }
        
        // Get the filename from the response headers
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = `monthly-attendance-report-${year}-${month}.xlsx`;
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
            if (filenameMatch) {
                filename = filenameMatch[1];
            }
        }
        
        // Download the file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('monthlyReportModal'));
        modal.hide();
        
        alert('Monthly report downloaded successfully!');
    } catch (error) {
        console.error('Error downloading monthly report:', error);
        alert('Error downloading report: ' + error.message);
    }
}

// Make functions globally available
window.editEvent = editEvent;
window.deleteEvent = deleteEvent;
window.showEventQR = showEventQR;
window.viewEventAttendance = viewEventAttendance;
window.viewEventDetails = viewEventDetails;
window.showEventDetailsModal = showEventDetailsModal;
window.closeEventDetailsAndShowQR = closeEventDetailsAndShowQR;
window.closeEventDetailsAndShowAttendance = closeEventDetailsAndShowAttendance;
window.downloadMonthlyReport = downloadMonthlyReport;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initializeAdmin);
