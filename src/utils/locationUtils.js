// Calculate distance between two points using the Haversine formula
const calculateDistance = (point1, point2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = point1.latitude * Math.PI / 180;
  const φ2 = point2.latitude * Math.PI / 180;
  const Δφ = (point2.latitude - point1.latitude) * Math.PI / 180;
  const Δλ = (point2.longitude - point1.longitude) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return distance; // Returns distance in meters
};

// Validate if a location is within allowed radius
const validateLocation = (userLocation, eventLocation, allowedRadius) => {
  const distance = calculateDistance(userLocation, eventLocation);
  return distance <= allowedRadius;
};

module.exports = {
  calculateDistance,
  validateLocation
};
