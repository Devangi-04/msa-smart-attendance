const moment = require('moment');

/**
 * Get current time in Indian Standard Time (IST)
 * @returns {Date} Current date/time in IST
 */
const getCurrentIST = () => {
  return moment().utcOffset('+05:30').toDate();
};

/**
 * Format date/time for Excel export in IST
 * @param {Date|string} dateTime - Date to format
 * @returns {string} Formatted date string in IST
 */
const formatForExcel = (dateTime) => {
  if (!dateTime) return 'N/A';
  return moment(dateTime).utcOffset('+05:30').format('YYYY-MM-DD HH:mm:ss');
};

/**
 * Format date/time for display in IST
 * @param {Date|string} dateTime - Date to format
 * @returns {string} Formatted date string in IST
 */
const formatForDisplay = (dateTime) => {
  if (!dateTime) return 'N/A';
  return moment(dateTime).utcOffset('+05:30').format('DD/MM/YYYY HH:mm:ss');
};

/**
 * Convert UTC date to IST
 * @param {Date|string} utcDate - UTC date to convert
 * @returns {Date} Date in IST
 */
const convertToIST = (utcDate) => {
  return moment(utcDate).utcOffset('+05:30').toDate();
};

/**
 * Check if a given time is within business hours (9 AM to 6 PM IST)
 * @param {Date|string} dateTime - Date to check
 * @returns {boolean} True if within business hours
 */
const isWithinBusinessHours = (dateTime) => {
  const hour = moment(dateTime).utcOffset('+05:30').hour();
  return hour >= 9 && hour < 18;
};

module.exports = {
  getCurrentIST,
  formatForExcel,
  formatForDisplay,
  convertToIST,
  isWithinBusinessHours
};
