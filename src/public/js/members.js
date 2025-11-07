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
            tbody.innerHTML = '<tr><td colspan="11" class="text-center text-danger">Initialization error: ' + error.message + '</td></tr>';
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
        tbody.innerHTML = '<tr><td colspan="11" class="text-center text-danger">Error loading members: ' + error.message + '</td></tr>';
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
        tbody.innerHTML = '<tr><td colspan="11" class="text-center text-muted py-4">No members found</td></tr>';
        return;
    }
    
    console.log('Members.js: Rendering', members.length, 'members...');
    
    tbody.innerHTML = members.map((member, index) => {
        const initials = member.name ? member.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'NA';
        const roleClass = member.role === 'ADMIN' ? 'bg-success' : 'bg-info';
        const yearDeptDiv = [member.year, member.department, member.division].filter(Boolean).join(' / ') || 'N/A';
        const joinedDate = new Date(member.createdAt).toLocaleDateString('en-IN');
        
        return `
            <tr>
                <td>${index + 1}</td>
                <td onclick="viewMemberDetails(${member.id})" style="cursor: pointer;">
                    <div class="d-flex align-items-center">
                        <div class="member-avatar me-2">${initials}</div>
                        <div>
                            <strong>${member.name || 'N/A'}</strong>
                        </div>
                    </div>
                </td>
                <td onclick="viewMemberDetails(${member.id})" style="cursor: pointer;">${member.mesId || 'N/A'}</td>
                <td onclick="viewMemberDetails(${member.id})" style="cursor: pointer;">${member.rollNo || 'N/A'}</td>
                <td onclick="viewMemberDetails(${member.id})" style="cursor: pointer;"><small>${yearDeptDiv}</small></td>
                <td onclick="viewMemberDetails(${member.id})" style="cursor: pointer;"><span class="badge bg-secondary">${member.msaTeam || 'N/A'}</span></td>
                <td onclick="viewMemberDetails(${member.id})" style="cursor: pointer;">${member.gender || 'N/A'}</td>
                <td onclick="viewMemberDetails(${member.id})" style="cursor: pointer;">${member.phone || 'N/A'}</td>
                <td onclick="viewMemberDetails(${member.id})" style="cursor: pointer;"><span class="badge ${roleClass} badge-role">${member.role}</span></td>
                <td onclick="viewMemberDetails(${member.id})" style="cursor: pointer;"><small>${joinedDate}</small></td>
                <td>
                    <div class="btn-group btn-group-sm" role="group">
                        <button class="btn btn-outline-warning" onclick="editMember(${member.id})" title="Edit Member">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="deleteMember(${member.id})" title="Delete Member">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
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
            (member.mesId && member.mesId.toLowerCase().includes(searchTerm)) ||
            (member.rollNo && member.rollNo.toLowerCase().includes(searchTerm)) ||
            (member.phone && member.phone.includes(searchTerm)) ||
            (member.msaTeam && member.msaTeam.toLowerCase().includes(searchTerm)) ||
            (member.department && member.department.toLowerCase().includes(searchTerm))
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

// Edit member
function editMember(memberId) {
    console.log('Members.js: Editing member:', memberId);
    const member = allMembers.find(m => m.id === memberId);
    
    if (!member) {
        alert('Member not found');
        return;
    }
    
    // Populate form fields
    document.getElementById('editMemberId').value = member.id;
    document.getElementById('editName').value = member.name || '';
    document.getElementById('editEmail').value = member.email || '';
    document.getElementById('editRole').value = member.role || 'USER';
    document.getElementById('editPhone').value = member.phone || '';
    document.getElementById('editRollNo').value = member.rollNo || '';
    document.getElementById('editMesId').value = member.mesId || '';
    document.getElementById('editAdmissionNumber').value = member.admissionNumber || '';
    document.getElementById('editYear').value = member.year || '';
    document.getElementById('editDivision').value = member.division || '';
    document.getElementById('editDepartment').value = member.department || '';
    document.getElementById('editMsaTeam').value = member.msaTeam || '';
    document.getElementById('editGender').value = member.gender || '';
    
    // Format date for input field
    if (member.dateOfBirth) {
        const dob = new Date(member.dateOfBirth);
        const formattedDate = dob.toISOString().split('T')[0];
        document.getElementById('editDateOfBirth').value = formattedDate;
    } else {
        document.getElementById('editDateOfBirth').value = '';
    }
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('editMemberModal'));
    modal.show();
}

// Save edited member
async function saveEditMember() {
    const memberId = document.getElementById('editMemberId').value;
    const name = document.getElementById('editName').value.trim();
    
    if (!name) {
        alert('Name is required');
        return;
    }
    
    const updateData = {
        name: name,
        role: document.getElementById('editRole').value,
        phone: document.getElementById('editPhone').value.trim() || null,
        rollNo: document.getElementById('editRollNo').value.trim() || null,
        mesId: document.getElementById('editMesId').value.trim() || null,
        admissionNumber: document.getElementById('editAdmissionNumber').value.trim() || null,
        stream: 'BSc', // Default stream for Mathematics and Statistics
        year: document.getElementById('editYear').value.trim() || null,
        division: document.getElementById('editDivision').value.trim() || null,
        department: document.getElementById('editDepartment').value.trim() || null,
        msaTeam: document.getElementById('editMsaTeam').value.trim() || null,
        gender: document.getElementById('editGender').value.trim() || null,
        dateOfBirth: document.getElementById('editDateOfBirth').value || null
    };
    
    console.log('Updating member:', memberId, 'with data:', updateData);
    
    try {
        const token = safeGetToken();
        console.log('Sending PUT request to:', `${API_BASE_URL}/users/${memberId}`);
        
        const response = await fetch(`${API_BASE_URL}/users/${memberId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });
        
        console.log('Response status:', response.status);
        const result = await response.json();
        console.log('Response data:', result);
        
        if (!response.ok) {
            throw new Error(result.message || 'Failed to update member');
        }
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('editMemberModal'));
        modal.hide();
        
        // Reload members
        await loadMembers();
        
        alert('Member updated successfully!');
    } catch (error) {
        console.error('Error updating member:', error);
        alert('Error updating member: ' + error.message);
    }
}

// Delete member
function deleteMember(memberId) {
    console.log('Members.js: Deleting member:', memberId);
    const member = allMembers.find(m => m.id === memberId);
    
    if (!member) {
        alert('Member not found');
        return;
    }
    
    // Populate delete confirmation modal
    document.getElementById('deleteMemberId').value = member.id;
    document.getElementById('deleteMemberName').textContent = member.name || 'N/A';
    document.getElementById('deleteMemberEmail').textContent = member.email;
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('deleteMemberModal'));
    modal.show();
}

// Confirm delete member
async function confirmDeleteMember() {
    const memberId = document.getElementById('deleteMemberId').value;
    
    try {
        const token = safeGetToken();
        const response = await fetch(`${API_BASE_URL}/users/${memberId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || 'Failed to delete member');
        }
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('deleteMemberModal'));
        modal.hide();
        
        // Reload members
        await loadMembers();
        
        alert('Member deleted successfully!');
    } catch (error) {
        console.error('Error deleting member:', error);
        alert('Error deleting member: ' + error.message);
    }
}

// Make functions globally available
window.viewMemberDetails = viewMemberDetails;
window.editMember = editMember;
window.saveEditMember = saveEditMember;
window.deleteMember = deleteMember;
window.confirmDeleteMember = confirmDeleteMember;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initializeMembers);
