// API Configuration
// Change this to your backend server URL
export const API_BASE_URL = 'http://192.168.8.193:5001'; // Update with your server IP

// For iOS simulator use: 'http://localhost:5000'
// For Android emulator use: 'http://10.0.2.2:5000'
// For real device, use your computer's local IP: 'http://192.168.x.x:5000'

export const API_ENDPOINTS = {
    // Auth
    LOGIN: '/api/custom-auth/login',
    ME: '/api/custom-auth/me',

    // Dispensaries
    DISPENSARIES: '/api/dispensaries',
    DISPENSARIES_BY_IDS: '/api/dispensaries/by-ids',

    // Doctors
    DOCTORS: '/api/doctors',
    DOCTORS_BY_DISPENSARY: '/api/doctors/dispensary',

    // Time Slots
    TIMESLOTS_CONFIG: '/api/timeslots/config',
    TIMESLOTS_SESSIONS: '/api/timeslots/sessions',
    TIMESLOTS_ABSENT: '/api/timeslots/absent',

    // Doctor-Dispensary Fees
    DOCTOR_DISPENSARY_FEES: '/api/doctor-dispensaries/fees',
    ASSIGN_FEES: '/api/doctor-dispensaries/assign-fees',

    // Bookings
    BOOKINGS: '/api/bookings',
    BOOKING_SEARCH: '/api/dispensary/bookings/search',
    BOOKING_SESSION: '/api/dispensary/bookings/session',
    BOOKING_CHECKIN: '/api/dispensary/bookings',

    // Reports
    REPORTS_DAILY: '/api/reports/daily-bookings',
    REPORTS_MONTHLY: '/api/reports/monthly-summary',
    REPORTS_ADVANCE: '/api/reports/advance-bookings',
    REPORTS_SESSION: '/api/reports/session',
    REPORTS_DOCTOR_PERFORMANCE: '/api/reports/doctor-performance',
};
