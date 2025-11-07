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

// Process the scanned QR code
async function processQRCode(qrData) {
    try {
        // Get current position
        const position = await getCurrentPosition();
        
        // Parse QR data
        const qrInfo = JSON.parse(qrData);
        
        // Prepare attendance data
        const attendanceData = {
            eventId: qrInfo.eventId,
            qrToken: qrInfo.token,
            location: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            },
            userId: 'USER_ID' // TODO: Replace with actual user ID
        };

        // Send attendance data to server
        const response = await fetch('/api/attendance/mark', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(attendanceData)
        });

        const result = await response.json();
        
        // Show result
        const resultDiv = document.getElementById('result');
        resultDiv.classList.remove('d-none', 'alert-success', 'alert-danger');
        resultDiv.classList.add(result.success ? 'alert-success' : 'alert-danger');
        resultDiv.textContent = result.message;

    } catch (error) {
        console.error('Error processing QR code:', error);
        showError('Error processing attendance. Please try again.');
    }
}

// Get current GPS position
function getCurrentPosition() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            showError('Geolocation is not supported by your device. Please use a device with GPS capabilities.');
            reject(new Error('Geolocation not supported'));
            return;
        }

        // Show loading message
        const resultDiv = document.getElementById('result');
        resultDiv.classList.remove('d-none', 'alert-danger', 'alert-success');
        resultDiv.classList.add('alert-info');
        resultDiv.textContent = 'Getting your location...';

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resultDiv.classList.add('d-none');
                resolve(position);
            },
            (error) => {
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

// Initialize scanner when page loads
document.addEventListener('DOMContentLoaded', initializeScanner);
