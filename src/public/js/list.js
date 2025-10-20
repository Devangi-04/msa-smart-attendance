// Events and Meetings Management
// API_BASE_URL is already declared in auth.js

let currentUser = null;
let allEvents = [];
let currentFilter = 'all';

// Helper function to safely get token
function safeGetToken() {
    if (typeof getToken === 'function') {
        return getToken();
    }
    return localStorage.getItem('token') || sessionStorage.getItem('token');
}

// Helper function to safely get user
function safeGetUser() {
    if (typeof getUser === 'function') {
        return getUser();
    }
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    console.log('List.js: DOMContentLoaded fired');
    try {
        // Get current user safely
        currentUser = safeGetUser();
        console.log('List.js: Current user:', currentUser);
        
        // Check if container exists
        const container = document.getElementById('eventsContainer');
        console.log('List.js: Container found:', !!container);
        
        if (!container) {
            console.error('List.js: eventsContainer not found in DOM!');
            return;
        }
        
        // Load events
        console.log('List.js: Loading events...');
        await loadEvents();
        console.log('List.js: Events loaded successfully');
        
        // Setup event listeners
        setupEventListeners();
        console.log('List.js: Event listeners set up');
    } catch (error) {
        console.error('List.js: Initialization error:', error);
        const container = document.getElementById('eventsContainer');
        if (container) {
            container.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Error initializing page: ${error.message}
                    <br><small>Check console for details</small>
                </div>
            `;
        }
    }
});

// Setup event listeners
function setupEventListeners() {
    // Add Event button
    const addEventBtn = document.getElementById('addEventBtn');
    if (addEventBtn) {
        addEventBtn.addEventListener('click', () => openEventModal());
    }
    
    // Save Event button
    const saveEventBtn = document.getElementById('saveEventBtn');
    if (saveEventBtn) {
        saveEventBtn.addEventListener('click', saveEvent);
    }
    
    // Get Current Location button
    const getCurrentLocationBtn = document.getElementById('getCurrentLocation');
    if (getCurrentLocationBtn) {
        getCurrentLocationBtn.addEventListener('click', getCurrentLocation);
    }
}

// Filter events by status
function filterEventsByStatus(status) {
    currentFilter = status;
    
    // Update button states
    document.querySelectorAll('[data-filter]').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === status) {
            btn.classList.add('active');
        }
    });
    
    // Filter and display
    const filtered = filterEvents(allEvents, status);
    displayEvents(filtered);
    
    // Update title with count
    const titles = {
        'all': 'All Events and Meetings',
        'upcoming': 'Upcoming Events and Meetings',
        'scheduled': 'Scheduled Events and Meetings',
        'missed': 'Missed Events and Meetings',
        'done': 'Completed Events and Meetings',
        'cancelled': 'Cancelled Events and Meetings',
        'previous': 'Previous Events and Meetings'
    };
    const titleText = titles[status] || 'Events and Meetings';
    const countText = filtered.length > 0 ? ` (${filtered.length})` : '';
    document.getElementById('eventsTitle').textContent = titleText + countText;
    
    // Update filter button counts
    updateFilterCounts();
}

// Update filter button counts
function updateFilterCounts() {
    const filters = ['all', 'upcoming', 'scheduled', 'missed', 'done', 'cancelled', 'previous'];
    
    filters.forEach(filter => {
        const count = filterEvents(allEvents, filter).length;
        const btn = document.querySelector(`[data-filter="${filter}"]`);
        if (btn) {
            // Remove existing count badge if present
            const existingBadge = btn.querySelector('.badge');
            if (existingBadge) {
                existingBadge.remove();
            }
            
            // Add count badge if count > 0
            if (count > 0) {
                const badge = document.createElement('span');
                badge.className = 'badge bg-light text-dark ms-1';
                badge.textContent = count;
                btn.appendChild(badge);
            }
        }
    });
}

// Filter events based on status
function filterEvents(events, status) {
    if (status === 'all') return events;
    
    const now = new Date();
    
    return events.filter(event => {
        const eventDate = new Date(event.date);
        const eventStatus = (event.status || '').toUpperCase();
        const hasAttendance = (event._count?.attendance || 0) > 0;
        
        // Determine actual event state
        const isPast = eventDate < now;
        const isFuture = eventDate > now;
        const isCancelled = eventStatus === 'CANCELLED';
        const isCompleted = eventStatus === 'COMPLETED';
        const isActive = eventStatus === 'ACTIVE';
        const isUpcoming = eventStatus === 'UPCOMING';
        
        switch(status) {
            case 'upcoming':
                // All future events that are not cancelled or completed
                return isFuture && !isCancelled && !isCompleted;
                
            case 'scheduled':
                // Only events marked as UPCOMING or ACTIVE that haven't happened yet
                // Must be future events OR current events without attendance
                // Exclude: past events, completed events, events with attendance
                if (isCancelled || isCompleted) return false;
                if (isPast) return false;
                return (isUpcoming || isActive);
                
            case 'missed':
                // Past events with no attendance, not marked as completed or cancelled
                return isPast && !hasAttendance && !isCompleted && !isCancelled;
                
            case 'done':
                // Events marked as completed OR past events with attendance
                return isCompleted || (isPast && hasAttendance && !isCancelled);
                
            case 'cancelled':
                // Events marked as cancelled
                return isCancelled;
                
            case 'previous':
                // All past events (completed, missed, or with attendance)
                return isPast;
                
            default:
                return true;
        }
    });
}

// ==================== EVENTS CRUD ====================

// Load all events
async function loadEvents() {
    const container = document.getElementById('eventsContainer');
    
    if (!container) {
        console.error('List.js: Events container not found in loadEvents');
        return;
    }
    
    try {
        console.log('List.js: Fetching events from:', `${API_BASE_URL}/events`);
        const response = await fetch(`${API_BASE_URL}/events`);
        console.log('List.js: Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('List.js: Events data received:', data);
        console.log('List.js: Number of events:', data.data ? data.data.length : 0);
        
        if (data.success && data.data && data.data.length > 0) {
            allEvents = data.data;
            console.log('List.js: Filtering events with filter:', currentFilter);
            const filtered = filterEvents(allEvents, currentFilter);
            console.log('List.js: Filtered events count:', filtered.length);
            displayEvents(filtered);
            updateFilterCounts();
        } else if (data.success && data.data) {
            allEvents = [];
            console.log('List.js: No events found, showing empty state');
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-times"></i>
                    <h4>No Events or Meetings Found</h4>
                    <p>There are no events or meetings scheduled at the moment.</p>
                    <p class="text-muted"><small>Admins can add events using the "Add Event/Meeting" button above.</small></p>
                </div>
            `;
        } else {
            throw new Error(data.message || 'Failed to load events');
        }
    } catch (error) {
        console.error('List.js: Error loading events:', error);
        container.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle me-2"></i>
                <strong>Error loading events:</strong> ${error.message}
                <br><small>Please check the console for more details.</small>
            </div>
        `;
    }
}

// Display events
function displayEvents(events) {
    const container = document.getElementById('eventsContainer');
    
    if (!container) {
        console.error('Events container not found!');
        return;
    }
    
    console.log('Displaying events:', events.length);
    const isAdmin = currentUser && currentUser.role === 'ADMIN';
    
    if (!events || events.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-times"></i>
                <h4>No Events Found</h4>
                <p>No events match the selected filter.</p>
            </div>
        `;
        return;
    }
    
    // Sort events by date
    const sortedEvents = [...events].sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        const now = new Date();
        
        // For upcoming/future events, sort ascending (nearest first)
        if (dateA > now && dateB > now) {
            return dateA - dateB;
        }
        // For past events, sort descending (most recent first)
        if (dateA < now && dateB < now) {
            return dateB - dateA;
        }
        // Mix of past and future, future events come first
        return dateB - dateA;
    });
    
    try {
        container.innerHTML = sortedEvents.map(event => {
        const eventDate = new Date(event.date);
        const now = new Date();
        const eventStatus = (event.status || '').toUpperCase();
        
        // Determine status badge with improved logic
        const hasAttendance = (event._count?.attendance || 0) > 0;
        const isPast = eventDate < now;
        const isFuture = eventDate > now;
        let statusBadge = '';
        
        // Priority order for status determination
        if (eventStatus === 'CANCELLED') {
            statusBadge = '<span class="badge bg-danger badge-status">Cancelled</span>';
        } else if (eventStatus === 'COMPLETED') {
            statusBadge = '<span class="badge bg-secondary badge-status">Completed</span>';
        } else if (isPast && hasAttendance && eventStatus !== 'COMPLETED') {
            statusBadge = '<span class="badge bg-success badge-status">Done</span>';
        } else if (isPast && !hasAttendance) {
            statusBadge = '<span class="badge bg-warning badge-status">Missed</span>';
        } else if (eventStatus === 'ACTIVE') {
            statusBadge = '<span class="badge bg-primary badge-status">Active</span>';
        } else if (eventStatus === 'UPCOMING' || isFuture) {
            statusBadge = '<span class="badge bg-info badge-status">Upcoming</span>';
        } else {
            statusBadge = '<span class="badge bg-secondary badge-status">Scheduled</span>';
        }
        
        const attendanceCount = event._count?.attendance || 0;
        const capacityInfo = event.capacity 
            ? `${attendanceCount}/${event.capacity}` 
            : attendanceCount;
        
        return `
            <div class="event-card">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <h5 class="mb-2">
                            <i class="fas fa-calendar-alt text-primary me-2"></i>
                            ${event.name}
                            ${statusBadge}
                        </h5>
                        <p class="text-muted mb-2">
                            <i class="fas fa-clock me-2"></i>
                            ${eventDate.toLocaleString('en-IN', { 
                                dateStyle: 'medium', 
                                timeStyle: 'short' 
                            })}
                        </p>
                        <p class="text-muted mb-2">
                            <i class="fas fa-map-marker-alt me-2"></i>
                            ${event.venue || event.location || 'Location TBA'}
                        </p>
                        ${event.description ? `<p class="mb-2">${event.description}</p>` : ''}
                        <p class="mb-0">
                            <i class="fas fa-users me-2"></i>
                            <strong>Attendance:</strong> ${capacityInfo}
                        </p>
                    </div>
                    ${isAdmin ? `
                        <div class="action-buttons">
                            <button class="btn btn-sm btn-outline-primary" onclick="editEvent(${event.id})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteEvent(${event.id}, '${event.name}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
    } catch (error) {
        console.error('Error displaying events:', error);
        container.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle me-2"></i>
                Error displaying events: ${error.message}
            </div>
        `;
    }
}

// Get current GPS location
function getCurrentLocation() {
    const btn = document.getElementById('getCurrentLocation');
    const originalText = btn.innerHTML;
    
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Getting Location...';
    btn.disabled = true;
    
    if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser');
        btn.innerHTML = originalText;
        btn.disabled = false;
        return;
    }
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            document.getElementById('latitude').value = position.coords.latitude.toFixed(6);
            document.getElementById('longitude').value = position.coords.longitude.toFixed(6);
            btn.innerHTML = '<i class="fas fa-check me-1"></i>Location Set';
            btn.disabled = false;
            setTimeout(() => {
                btn.innerHTML = originalText;
            }, 2000);
        },
        (error) => {
            console.error('Error getting location:', error);
            alert('Error getting location: ' + error.message);
            btn.innerHTML = originalText;
            btn.disabled = false;
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

// Open event modal (add or edit)
function openEventModal(event = null) {
    const modal = new bootstrap.Modal(document.getElementById('eventModal'));
    const title = document.getElementById('eventModalTitle');
    const form = document.getElementById('eventForm');
    
    form.reset();
    
    if (event) {
        title.textContent = 'Edit Event';
        document.getElementById('eventId').value = event.id;
        document.getElementById('isEditMode').value = 'true';
        document.getElementById('eventName').value = event.name;
        document.getElementById('eventDate').value = new Date(event.date).toISOString().slice(0, 16);
        document.getElementById('eventLocation').value = event.venue || event.location || '';
        document.getElementById('eventStatus').value = event.status || 'UPCOMING';
        document.getElementById('eventDescription').value = event.description || '';
        document.getElementById('eventCapacity').value = event.capacity || '';
        document.getElementById('eventRadius').value = event.radius || 100;
        document.getElementById('latitude').value = event.latitude || '';
        document.getElementById('longitude').value = event.longitude || '';
    } else {
        title.textContent = 'Create New Event';
        document.getElementById('eventId').value = '';
        document.getElementById('isEditMode').value = '';
        document.getElementById('eventStatus').value = 'UPCOMING';
        document.getElementById('eventRadius').value = 100;
    }
    
    modal.show();
}

// Edit event
async function editEvent(eventId) {
    try {
        const response = await fetch(`${API_BASE_URL}/events/${eventId}`);
        const data = await response.json();
        
        if (data.success) {
            openEventModal(data.data);
        }
    } catch (error) {
        console.error('Error loading event:', error);
        alert('Error loading event details');
    }
}

// Save event (create or update)
async function saveEvent() {
    const eventId = document.getElementById('eventId').value;
    const latitude = document.getElementById('latitude').value;
    const longitude = document.getElementById('longitude').value;
    
    // Validate GPS coordinates
    if (!latitude || !longitude) {
        alert('Please set GPS coordinates by clicking "Get Current Location"');
        return;
    }
    
    const eventData = {
        name: document.getElementById('eventName').value,
        date: new Date(document.getElementById('eventDate').value).toISOString(),
        venue: document.getElementById('eventLocation').value,
        status: document.getElementById('eventStatus').value,
        description: document.getElementById('eventDescription').value || undefined,
        capacity: parseInt(document.getElementById('eventCapacity').value) || undefined,
        radius: parseInt(document.getElementById('eventRadius').value) || 100,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
    };
    
    const token = safeGetToken();
    if (!token) {
        alert('Please login to manage events');
        return;
    }
    
    try {
        const url = eventId 
            ? `${API_BASE_URL}/events/${eventId}` 
            : `${API_BASE_URL}/events/create`;
        
        const method = eventId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(eventData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            bootstrap.Modal.getInstance(document.getElementById('eventModal')).hide();
            await loadEvents();
            alert(eventId ? 'Event updated successfully!' : 'Event created successfully!');
        } else {
            alert(data.message || 'Error saving event');
        }
    } catch (error) {
        console.error('Error saving event:', error);
        alert('Error saving event. Please try again.');
    }
}

// Delete event
async function deleteEvent(eventId, eventName) {
    if (!confirm(`Are you sure you want to delete "${eventName}"?`)) {
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
        
        const data = await response.json();
        
        if (data.success) {
            await loadEvents();
            alert('Event deleted successfully!');
        } else {
            alert(data.message || 'Error deleting event');
        }
    } catch (error) {
        console.error('Error deleting event:', error);
        alert('Error deleting event. Please try again.');
    }
}

// Make functions globally available
window.editEvent = editEvent;
window.deleteEvent = deleteEvent;
window.filterEventsByStatus = filterEventsByStatus;
