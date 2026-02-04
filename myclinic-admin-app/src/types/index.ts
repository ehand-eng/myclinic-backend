// User Types
export interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    dispensaryIds: string[];
    permissions?: string[];
}

export interface AuthResponse {
    message: string;
    token: string;
    user: User;
}

// Dispensary Types
export interface Dispensary {
    _id: string;
    name: string;
    address: string;
    phone?: string;
    location?: {
        latitude: number;
        longitude: number;
    };
    doctors?: Doctor[];
    isActive: boolean;
}

// Doctor Types
export interface Doctor {
    _id: string;
    name: string;
    specialization: string;
    email?: string;
    phone?: string;
    dispensaries: string[];
    qualifications?: string[];
    experience?: number;
    isActive: boolean;
}

// Time Slot Types
export interface TimeSlotConfig {
    _id: string;
    doctorId: string;
    dispensaryId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    maxPatients: number;
    minutesPerPatient: number;
    bookingCutoverTime?: number;
    isActive: boolean;
}

export interface Session {
    startTime: string;
    endTime: string;
    timeSlot: string;
    timeSlotConfigId: string;
    isModified: boolean;
}

export interface AbsentTimeSlot {
    _id: string;
    doctorId: string;
    dispensaryId: string;
    date: string;
    isModifiedSession: boolean;
    startTime?: string;
    endTime?: string;
    maxPatients?: number;
    minutesPerPatient?: number;
    reason?: string;
}

// Booking Types
export interface Booking {
    _id: string;
    transactionId: string;
    patientId?: string;
    patientName: string;
    patientPhone: string;
    patientEmail?: string;
    doctorId: string | Doctor;
    dispensaryId: string | Dispensary;
    appointmentNumber: number;
    bookingDate: string;
    timeSlot: string;
    timeSlotConfigId?: string;
    estimatedTime: string;
    status: BookingStatus;
    symptoms?: string;
    notes?: string;
    checkedInTime?: string;
    completedTime?: string;
    fees: BookingFees;
    isPaid: boolean;
    isPatientVisited: boolean;
    bookedBy: string;
    createdAt: string;
}

export type BookingStatus = 'scheduled' | 'checked_in' | 'completed' | 'cancelled' | 'no_show';

export interface BookingFees {
    doctorFee: number;
    dispensaryFee: number;
    bookingCommission: number;
    channelPartnerFee?: number;
    totalFee: number;
}

// Fee Types
export interface DoctorDispensaryFee {
    _id: string;
    doctorId: string;
    doctorName: string;
    dispensaryId: string;
    dispensaryName: string;
    doctorFee: number;
    dispensaryFee: number;
    bookingCommission: number;
    channelPartnerFee: number;
    totalFee?: number;
    createdAt: string;
    updatedAt: string;
}

// Report Types
export interface DailyBookingsReport {
    total: number;
    completed: number;
    checkedIn: number;
    cancelled: number;
    noShow: number;
    totalAmount: number;
    totalCommission: number;
    bookings: ReportBooking[];
}

export interface ReportBooking {
    id: string;
    bookingReference: string;
    timeSlot: string;
    patientName: string;
    patientPhone: string;
    status: BookingStatus;
    doctorName: string;
    dispensaryName: string;
    checkedInTime?: string;
    completedTime?: string;
    bookingDate: string;
    fees: BookingFees;
}

export interface MonthlyReport {
    totalBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    noShowBookings: number;
    dailyStats: DailyStats[];
}

export interface DailyStats {
    date: string;
    total: number;
    completed: number;
    cancelled: number;
    noShow: number;
}

export interface DoctorPerformance {
    totalBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    noShowBookings: number;
    completionRate: number;
    cancellationRate: number;
    noShowRate: number;
    averageConsultationTime: number;
}

// API Response Types
export interface ApiError {
    message: string;
    error?: string;
    hint?: string;
}

// Form Booking Response
export interface FormattedBooking {
    _id: string;
    transactionId: string;
    appointmentNumber: number;
    patientName: string;
    patientPhone: string;
    patientEmail?: string;
    doctor: {
        id: string;
        name: string;
        specialization: string;
    };
    dispensary: {
        id: string;
        name: string;
        address: string;
    };
    bookingDate: string;
    timeSlot: string;
    estimatedTime: string;
    status: BookingStatus;
    checkedInTime?: string;
    symptoms?: string;
    notes?: string;
    isPaid: boolean;
    isPatientVisited: boolean;
}

// Day of week mapping
export const DAYS_OF_WEEK = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
];
