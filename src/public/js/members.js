// Members Management
// API_BASE_URL is already declared in auth.js

let allMembers = [];
let filteredMembers = [];
let currentFilter = 'all';

// Helper function to safely get token
function safeGetToken() {
    if (typeof getToken === 'function') {
        return getToken();
    }
    return localStorage.getItem('token') || sessionStorage.getItem('token');
}

// Initialize the members page
async function initializeMembers() {
    console.log('Members.js: Initializing members page...');
    
    try {
        // Check authentication
        const token = safeGetToken();
        console.log('Members.js: Token found:', !!token);
        
        if (!token) {
            console.log('Members.js: No token found, redirecting to login...');
            alert('Please login to access the members page.');
            window.location.href = 'login.html';
            return;
        }
        
        // Check if user is admin
        const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            console.log('Members.js: User role:', user.role);
            if (user.role !== 'ADMIN') {
                alert('Admin access required. You will be redirected to the home page.');
                window.location.href = 'index.html';
                return;
            }
        }
        
        console.log('Members.js: Authentication successful, loading members...');
        await loadMembers();
        setupEventHandlers();
        console.log('Members.js: Initialization complete');
    } catch (error) {
        console.error('Members.js: Initialization error:', error);
        const tbody = document.getElementById('membersTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="10" class="text-center text-danger">Initialization error: ' + error.message + '</td></tr>';
        }
    }
}

// Setup event handlers
function setupEventHandlers() {
    console.log('Members.js: Setting up event handlers...');
    
    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
    
    // Filter buttons
    document.querySelectorAll('[data-filter]').forEach(btn => {
        btn.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            filterMembers(filter);
            
            // Update active state
            document.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Export button
    const exportBtn = document.getElementById('exportMembersBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportMembers);
    }
}

// Load all members
async function loadMembers() {
    console.log('Members.js: loadMembers called');
    const tbody = document.getElementById('membersTableBody');
    
    if (!tbody) {
        console.error('Members.js: membersTableBody element not found!');
        return;
    }
    
    try {
        const token = safeGetToken();
        console.log('Members.js: Fetching members from:', `${API_BASE_URL}/users`);
        
        const response = await fetch(`${API_BASE_URL}/users`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('Members.js: Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Members.js: Response data:', result);
        
        if (result.success && result.data) {
            allMembers = result.data;
            filteredMembers = result.data;
            console.log('Members.js: Number of members:', result.data.length);
            
            updateStatistics();
            displayMembers(filteredMembers);
        } else {
            throw new Error(result.message || 'Failed to load members');
        }
    } catch (error) {
        console.error('Members.js: Error loading members:', error);
        tbody.innerHTML = '<tr><td colspan="10" class="text-center text-danger">Error loading members: ' + error.message + '</td></tr>';
    }
}

// Update statistics
function updateStatistics() {
    const totalMembers = allMembers.length;
    const totalAdmins = allMembers.filter(m => m.role === 'ADMIN').length;
    const totalUsers = allMembers.filter(m => m.role === 'USER').length;
    const uniqueTeams = new Set(allMembers.filter(m => m.msaTeam).map(m => m.msaTeam)).size;
    
    document.getElementById('totalMembers').textContent = totalMembers;
    document.getElementById('totalAdmins').textContent = totalAdmins;
    document.getElementById('totalUsers').textContent = totalUsers;
    document.getElementById('totalTeams').textContent = uniqueTeams;
}

// Display members in table
function displayMembers(members) {
    console.log('Members.js: displayMembers called with', members ? members.length : 0, 'members');
    const tbody = document.getElementById('membersTableBody');
    
    if (!tbody) {
        console.error('Members.js: membersTableBody not found!');
        return;
    }
    
    if (!members || members.length === 0) {
        console.log('Members.js: No members to display');
        tbody.innerHTML = '<tr><td colspan="10" class="text-center text-muted py-4">No members found</td></tr>';
        return;
    }
    
    console.log('Members.js: Rendering', members.length, 'members...');
    
    tbody.innerHTML = members.map((member, index) => {
        const initials = member.name ? member.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'NA';
        const roleClass = member.role === 'ADMIN' ? 'bg-success' : 'bg-info';
        const streamYearDiv = [member.stream, member.year, member.division].filter(Boolean).join(' / ') || 'N/A';
        const joinedDate = new Date(member.createdAt).toLocaleDateString('en-IN');
        
        return `
            <tr onclick="viewMemberDetails(${member.id})" style="cursor: pointer;">
                <td>${index + 1}</td>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="member-avatar me-2">${initials}</div>
                        <div>
                            <strong>${member.name || 'N/A'}</strong>
                        </div>
                    </div>
                </td>
                <td>${member.email}</td>
                <td>${member.rollNo || 'N/A'}</td>
                <td><small>${streamYearDiv}</small></td>
                <td><span class="badge bg-secondary">${member.msaTeam || 'N/A'}</span></td>
                <td>${member.gender || 'N/A'}</td>
                <td>${member.phone || 'N/A'}</td>
                <td><span class="badge ${roleClass} badge-role">${member.role}</span></td>
                <td><small>${joinedDate}</small></td>
            </tr>
        `;
    }).join('');
}

// Filter members
function filterMembers(filter) {
    console.log('Members.js: Filtering by:', filter);
    currentFilter = filter;
    
    if (filter === 'all') {
        filteredMembers = allMembers;
    } else {
        filteredMembers = allMembers.filter(m => m.role === filter);
    }
    
    displayMembers(filteredMembers);
}

// Handle search
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase().trim();
    console.log('Members.js: Searching for:', searchTerm);
    
    if (!searchTerm) {
        filterMembers(currentFilter);
        return;
    }
    
    const baseMembers = currentFilter === 'all' ? allMembers : allMembers.filter(m => m.role === currentFilter);
    
    const results = baseMembers.filter(member => {
        return (
            (member.name && member.name.toLowerCase().includes(searchTerm)) ||
            (member.email && member.email.toLowerCase().includes(searchTerm)) ||
            (member.rollNo && member.rollNo.toLowerCase().includes(searchTerm)) ||
            (member.phone && member.phone.includes(searchTerm)) ||
            (member.msaTeam && member.msaTeam.toLowerCase().includes(searchTerm)) ||
            (member.stream && member.stream.toLowerCase().includes(searchTerm))
        );
    });
    
    displayMembers(results);
}

// View member details
function viewMemberDetails(memberId) {
    console.log('Members.js: Viewing details for member:', memberId);
    const member = allMembers.find(m => m.id === memberId);
    
    if (!member) {
        alert('Member not found');
        return;
    }
    
    const content = document.getElementById('memberDetailsContent');
    const joinedDate = new Date(member.createdAt).toLocaleString('en-IN');
    const dob = member.dateOfBirth ? new Date(member.dateOfBirth).toLocaleDateString('en-IN') : 'N/A';
    
    content.innerHTML = `
        <div class="row">
            <div class="col-md-6 mb-3">
                <label class="text-muted small">Full Name</label>
                <p class="fw-bold">${member.name || 'N/A'}</p>
            </div>
            <div class="col-md-6 mb-3">
                <label class="text-muted small">Email</label>
                <p class="fw-bold">${member.email}</p>
            </div>
            <div class="col-md-6 mb-3">
                <label class="text-muted small">Roll Number</label>
                <p class="fw-bold">${member.rollNo || 'N/A'}</p>
            </div>
            <div class="col-md-6 mb-3">
                <label class="text-muted small">Admission Number</label>
                <p class="fw-bold">${member.admissionNumber || 'N/A'}</p>
            </div>
            <div class="col-md-6 mb-3">
                <label class="text-muted small">MES ID</label>
                <p class="fw-bold">${member.mesId || 'N/A'}</p>
            </div>
            <div class="col-md-6 mb-3">
                <label class="text-muted small">Phone Number</label>
                <p class="fw-bold">${member.phone || 'N/A'}</p>
            </div>
            <div class="col-md-4 mb-3">
                <label class="text-muted small">Stream</label>
                <p class="fw-bold">${member.stream || 'N/A'}</p>
            </div>
            <div class="col-md-4 mb-3">
                <label class="text-muted small">Year</label>
                <p class="fw-bold">${member.year || 'N/A'}</p>
            </div>
            <div class="col-md-4 mb-3">
                <label class="text-muted small">Division</label>
                <p class="fw-bold">${member.division || 'N/A'}</p>
            </div>
            <div class="col-md-6 mb-3">
                <label class="text-muted small">Department</label>
                <p class="fw-bold">${member.department || 'N/A'}</p>
            </div>
            <div class="col-md-6 mb-3">
                <label class="text-muted small">MSA Team</label>
                <p class="fw-bold">${member.msaTeam || 'N/A'}</p>
            </div>
            <div class="col-md-6 mb-3">
                <label class="text-muted small">Gender</label>
                <p class="fw-bold">${member.gender || 'N/A'}</p>
            </div>
            <div class="col-md-6 mb-3">
                <label class="text-muted small">Date of Birth</label>
                <p class="fw-bold">${dob}</p>
            </div>
            <div class="col-md-6 mb-3">
                <label class="text-muted small">Role</label>
                <p><span class="badge ${member.role === 'ADMIN' ? 'bg-success' : 'bg-info'}">${member.role}</span></p>
            </div>
            <div class="col-md-6 mb-3">
                <label class="text-muted small">Joined On</label>
                <p class="fw-bold">${joinedDate}</p>
            </div>
        </div>
    `;
    
    const modal = new bootstrap.Modal(document.getElementById('memberDetailsModal'));
    modal.show();
}

// Export members to Excel
async function exportMembers() {
    console.log('Members.js: Exporting members...');
    
    const token = safeGetToken();
    if (!token) {
        alert('Please login to export members');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/users/export`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('Members.js: Export response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to export members');
        }
        
        const blob = await response.blob();
        console.log('Members.js: Blob received, size:', blob.size);
        
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `msa-members-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        console.log('Members.js: Export successful');
        alert('Members exported successfully!');
    } catch (error) {
        console.error('Members.js: Error exporting members:', error);
        alert('Error exporting members: ' + error.message);
    }
}

// Make functions globally available
window.viewMemberDetails = viewMemberDetails;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initializeMembers);
