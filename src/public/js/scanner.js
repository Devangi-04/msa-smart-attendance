// Initialize QR Scanner
function initializeScanner() {
    const html5QrcodeScanner = new Html5QrcodeScanner(
        "reader", 
        { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            showTorchButtonIfSupported: true,
            showZoomSliderIfSupported: true,
            defaultZoomValueIfSupported: 2
        });

    function onScanSuccess(decodedText, decodedResult) {
        // Handle the scanned QR code
        processQRCode(decodedText);
        html5QrcodeScanner.clear();
    }

    function onScanError(errorMessage) {
        // Handle scan error
        console.error(errorMessage);
    }

    html5QrcodeScanner.render(onScanSuccess, onScanError);
}

// Helper function to get token
function getToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
}

// Helper function to get user
function getUser() {
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

// Process the scanned QR code
async function processQRCode(qrData) {
    try {
        // Check authentication
        const token = getToken();
        const user = getUser();
        
        if (!token || !user) {
            showError('Authentication required. Please login first.');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
            return;
        }
        
        // Get lectures missed value
        const lecturesMissed = parseInt(document.getElementById('lecturesMissed').value) || 0;
        
        // Get current position
        const position = await getCurrentPosition();
        
        // Parse QR data
        const qrInfo = JSON.parse(qrData);
        
        // Prepare attendance data
        const attendanceData = {
            eventId: qrInfo.eventId,
            qrToken: qrInfo.token,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            lecturesMissed: lecturesMissed
        };

        // Send attendance data to server
        const response = await fetch(`${API_BASE_URL || ''}/api/attendance/mark`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(attendanceData)
        });

        const result = await response.json();
        
        // Show result
        const resultDiv = document.getElementById('result');
        resultDiv.classList.remove('d-none', 'alert-success', 'alert-danger', 'alert-info');
        resultDiv.classList.add(result.success ? 'alert-success' : 'alert-danger');
        resultDiv.innerHTML = `
            <i class="fas fa-${result.success ? 'check-circle' : 'exclamation-circle'} me-2"></i>
            ${result.message}
        `;
        
        // If successful, redirect to dashboard after 2 seconds
        if (result.success) {
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);
        }

    } catch (error) {
        console.error('Error processing QR code:', error);
        showError('Error processing attendance. Please try again.');
    }
}

// Get current GPS position
function getCurrentPosition() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            console.error('Geolocation API not available');
            showError('Geolocation is not supported by your device. Please use a device with GPS capabilities.');
            reject(new Error('Geolocation not supported'));
            return;
        }

        console.log('Requesting location access for attendance...');
        
        // Show loading message
        const resultDiv = document.getElementById('result');
        resultDiv.classList.remove('d-none', 'alert-danger', 'alert-success');
        resultDiv.classList.add('alert-info');
        resultDiv.textContent = 'Getting your location...';

        navigator.geolocation.getCurrentPosition(
            (position) => {
                console.log('Location obtained for attendance:', position.coords);
                resultDiv.classList.add('d-none');
                resolve(position);
            },
            (error) => {
                console.error('Geolocation error:', error);
                let errorMessage;
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Please allow location access to mark attendance.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Location information is unavailable. Please check your GPS settings.';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'Location request timed out. Please try again.';
                        break;
                    default:
                        errorMessage = 'An unknown error occurred while getting location.';
                }
                showError(errorMessage);
                reject(error);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    });
}

// Show error message
function showError(message) {
    const resultDiv = document.getElementById('result');
    resultDiv.classList.remove('d-none', 'alert-success');
    resultDiv.classList.add('alert-danger');
    resultDiv.textContent = message;
}

// Check authentication and initialize scanner when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('Scanner: Checking authentication...');
    
    const token = getToken();
    const user = getUser();
    
    console.log('Scanner: Token exists:', !!token);
    console.log('Scanner: User exists:', !!user);
    
    if (!token || !user) {
        console.log('Scanner: No authentication found, redirecting to login...');
        const resultDiv = document.getElementById('result');
        resultDiv.classList.remove('d-none');
        resultDiv.classList.add('alert-warning');
        resultDiv.innerHTML = `
            <i class="fas fa-exclamation-triangle me-2"></i>
            Please login to mark attendance. Redirecting to login page...
        `;
        
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return;
    }
    
    console.log('Scanner: Authentication successful, initializing scanner...');
    console.log('Scanner: User:', user.name, '(', user.email, ')');
    
    // Show user info
    const resultDiv = document.getElementById('result');
    resultDiv.classList.remove('d-none');
    resultDiv.classList.add('alert-info');
    resultDiv.innerHTML = `
        <i class="fas fa-user me-2"></i>
        Logged in as: <strong>${user.name}</strong>
    `;
    
    // Hide the message after 3 seconds
    setTimeout(() => {
        resultDiv.classList.add('d-none');
    }, 3000);
    
    initializeScanner();
});
