import apiClient from './client';
import { API_ENDPOINTS } from './config';
import {
    AuthResponse,
    User,
    Dispensary,
    Doctor,
    TimeSlotConfig,
    Session,
    AbsentTimeSlot,
    DoctorDispensaryFee,
    Booking,
    FormattedBooking,
    DailyBookingsReport,
    MonthlyReport,
    DoctorPerformance,
    BookingFees,
} from '../types';

// ============ Auth Services ============
export const authService = {
    login: async (email: string, password: string): Promise<AuthResponse> => {
        const response = await apiClient.post<AuthResponse>(API_ENDPOINTS.LOGIN, {
            email,
            password,
        });
        return response.data;
    },

    getMe: async (): Promise<User> => {
        const response = await apiClient.get<User>(API_ENDPOINTS.ME);
        return response.data;
    },
};

// ============ Dispensary Services ============
export const dispensaryService = {
    getById: async (id: string): Promise<Dispensary> => {
        const response = await apiClient.get<Dispensary>(`${API_ENDPOINTS.DISPENSARIES}/${id}`);
        return response.data;
    },

    getByIds: async (ids: string[]): Promise<Dispensary[]> => {
        const response = await apiClient.post<Dispensary[]>(API_ENDPOINTS.DISPENSARIES_BY_IDS, { ids });
        return response.data;
    },

    getAll: async (): Promise<Dispensary[]> => {
        const response = await apiClient.get<Dispensary[]>(API_ENDPOINTS.DISPENSARIES);
        return response.data;
    },
};

// ============ Doctor Services ============
export const doctorService = {
    getByDispensary: async (dispensaryId: string): Promise<Doctor[]> => {
        const response = await apiClient.get<Doctor[]>(
            `${API_ENDPOINTS.DOCTORS_BY_DISPENSARY}/${dispensaryId}`
        );
        return response.data;
    },

    getById: async (id: string): Promise<Doctor> => {
        const response = await apiClient.get<Doctor>(`${API_ENDPOINTS.DOCTORS}/${id}`);
        return response.data;
    },

    create: async (doctorData: Partial<Doctor>): Promise<Doctor> => {
        const response = await apiClient.post<Doctor>(API_ENDPOINTS.DOCTORS, doctorData);
        return response.data;
    },

    update: async (id: string, doctorData: Partial<Doctor>): Promise<Doctor> => {
        const response = await apiClient.put<Doctor>(`${API_ENDPOINTS.DOCTORS}/${id}`, doctorData);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`${API_ENDPOINTS.DOCTORS}/${id}`);
    },
};

// ============ Time Slot Services ============
export const timeSlotService = {
    getByDoctorAndDispensary: async (
        doctorId: string,
        dispensaryId: string
    ): Promise<TimeSlotConfig[]> => {
        const response = await apiClient.get<TimeSlotConfig[]>(
            `${API_ENDPOINTS.TIMESLOTS_CONFIG}/doctor/${doctorId}/dispensary/${dispensaryId}`
        );
        return response.data;
    },

    getByDispensary: async (dispensaryId: string): Promise<TimeSlotConfig[]> => {
        const response = await apiClient.get<TimeSlotConfig[]>(
            `${API_ENDPOINTS.TIMESLOTS_CONFIG}/dispensary/${dispensaryId}`
        );
        return response.data;
    },

    create: async (data: Partial<TimeSlotConfig>): Promise<TimeSlotConfig> => {
        const response = await apiClient.post<TimeSlotConfig>(API_ENDPOINTS.TIMESLOTS_CONFIG, data);
        return response.data;
    },

    update: async (id: string, data: Partial<TimeSlotConfig>): Promise<TimeSlotConfig> => {
        const response = await apiClient.put<TimeSlotConfig>(
            `${API_ENDPOINTS.TIMESLOTS_CONFIG}/${id}`,
            data
        );
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`${API_ENDPOINTS.TIMESLOTS_CONFIG}/${id}`);
    },

    getSessions: async (
        doctorId: string,
        dispensaryId: string,
        date: string
    ): Promise<{ sessions: Session[]; date: string; dayOfWeek: number }> => {
        const response = await apiClient.get(
            `${API_ENDPOINTS.TIMESLOTS_SESSIONS}/${doctorId}/${dispensaryId}/${date}`
        );
        return response.data;
    },

    getAbsentSlots: async (
        doctorId: string,
        dispensaryId: string,
        startDate: string,
        endDate: string
    ): Promise<AbsentTimeSlot[]> => {
        const response = await apiClient.get<AbsentTimeSlot[]>(
            `${API_ENDPOINTS.TIMESLOTS_ABSENT}/doctor/${doctorId}/dispensary/${dispensaryId}`,
            { params: { startDate, endDate } }
        );
        return response.data;
    },

    createAbsent: async (data: Partial<AbsentTimeSlot>): Promise<AbsentTimeSlot> => {
        const response = await apiClient.post<AbsentTimeSlot>(API_ENDPOINTS.TIMESLOTS_ABSENT, data);
        return response.data;
    },

    deleteAbsent: async (id: string): Promise<void> => {
        await apiClient.delete(`${API_ENDPOINTS.TIMESLOTS_ABSENT}/${id}`);
    },
};

// ============ Fee Services ============
export const feeService = {
    getByDispensary: async (dispensaryId: string): Promise<DoctorDispensaryFee[]> => {
        const response = await apiClient.get<DoctorDispensaryFee[]>(
            `${API_ENDPOINTS.DOCTOR_DISPENSARY_FEES}/${dispensaryId}`
        );
        return response.data;
    },

    getByDoctorAndDispensary: async (
        doctorId: string,
        dispensaryId: string
    ): Promise<DoctorDispensaryFee> => {
        const response = await apiClient.get<DoctorDispensaryFee>(
            `${API_ENDPOINTS.DOCTOR_DISPENSARY_FEES}/${doctorId}/${dispensaryId}`
        );
        return response.data;
    },

    assignFees: async (data: {
        doctorId: string;
        dispensaryId: string;
        doctorFee: number;
        dispensaryFee: number;
        bookingCommission: number;
        channelPartnerFee?: number;
    }): Promise<DoctorDispensaryFee> => {
        const response = await apiClient.post<DoctorDispensaryFee>(API_ENDPOINTS.ASSIGN_FEES, data);
        return response.data;
    },

    updateFees: async (
        doctorId: string,
        dispensaryId: string,
        data: {
            doctorFee: number;
            dispensaryFee: number;
            bookingCommission: number;
            channelPartnerFee?: number;
        }
    ): Promise<DoctorDispensaryFee> => {
        const response = await apiClient.put<DoctorDispensaryFee>(
            `${API_ENDPOINTS.DOCTOR_DISPENSARY_FEES}/${doctorId}/${dispensaryId}`,
            data
        );
        return response.data;
    },
};

// ============ Booking Services ============
export const bookingService = {
    getByDateAndDoctorDispensary: async (
        doctorId: string,
        dispensaryId: string,
        date: string
    ): Promise<Booking[]> => {
        const response = await apiClient.get<Booking[]>(
            `${API_ENDPOINTS.BOOKINGS}/doctor/${doctorId}/dispensary/${dispensaryId}/date/${date}`
        );
        return response.data;
    },

    search: async (params: {
        bookingReference?: string;
        appointmentNumber?: string;
        patientName?: string;
        doctorId?: string;
        date?: string;
        dispensaryId?: string;
        sessionId?: string;
    }): Promise<{ message: string; count: number; bookings: FormattedBooking[] }> => {
        const response = await apiClient.get(API_ENDPOINTS.BOOKING_SEARCH, { params });
        return response.data;
    },

    getSessionBookings: async (params: {
        dispensaryId: string;
        doctorId: string;
        date: string;
        sessionId?: string;
    }): Promise<{ message: string; count: number; bookings: FormattedBooking[] }> => {
        const response = await apiClient.get(API_ENDPOINTS.BOOKING_SESSION, { params });
        return response.data;
    },

    create: async (bookingData: {
        doctorId: string;
        dispensaryId: string;
        bookingDate: string;
        patientName: string;
        patientPhone: string;
        patientEmail?: string;
        symptoms?: string;
        timeSlotConfigId?: string;
        userRole?: string;
        bookedUser?: string;
        fees: BookingFees;
    }): Promise<Booking> => {
        const response = await apiClient.post<Booking>(API_ENDPOINTS.BOOKINGS, bookingData);
        return response.data;
    },

    updateStatus: async (
        bookingId: string,
        data: {
            status?: string;
            checkedInTime?: string;
            completedTime?: string;
            notes?: string;
            isPaid?: boolean;
            isPatientVisited?: boolean;
        }
    ): Promise<Booking> => {
        const response = await apiClient.patch<Booking>(
            `${API_ENDPOINTS.BOOKINGS}/${bookingId}/status`,
            data
        );
        return response.data;
    },

    cancel: async (bookingId: string, reason?: string): Promise<Booking> => {
        const response = await apiClient.patch<Booking>(`${API_ENDPOINTS.BOOKINGS}/${bookingId}/cancel`, {
            reason,
        });
        return response.data;
    },

    checkIn: async (bookingId: string): Promise<{ message: string; booking: FormattedBooking }> => {
        const response = await apiClient.patch(
            `${API_ENDPOINTS.BOOKING_CHECKIN}/${bookingId}/check-in`
        );
        return response.data;
    },
};

// ============ Report Services ============
export const reportService = {
    getDailyBookings: async (params: {
        date: string;
        dispensaryId?: string;
        doctorId?: string;
        timeSlot?: string;
    }): Promise<DailyBookingsReport> => {
        const response = await apiClient.get<DailyBookingsReport>(API_ENDPOINTS.REPORTS_DAILY, {
            params,
        });
        return response.data;
    },

    getMonthlySummary: async (params: {
        month: number;
        year: number;
        dispensaryId?: string;
    }): Promise<MonthlyReport> => {
        const response = await apiClient.get<MonthlyReport>(API_ENDPOINTS.REPORTS_MONTHLY, { params });
        return response.data;
    },

    getAdvanceBookings: async (params: {
        startDate: string;
        endDate: string;
        dispensaryId?: string;
        doctorId?: string;
        timeSlot?: string;
    }): Promise<DailyBookingsReport> => {
        const response = await apiClient.get<DailyBookingsReport>(API_ENDPOINTS.REPORTS_ADVANCE, {
            params,
        });
        return response.data;
    },

    getSessionReport: async (
        doctorId: string,
        dispensaryId: string,
        date: string
    ): Promise<Booking[]> => {
        const response = await apiClient.get<Booking[]>(
            `${API_ENDPOINTS.REPORTS_SESSION}/${doctorId}/${dispensaryId}/${date}`
        );
        return response.data;
    },

    getDoctorPerformance: async (params: {
        doctorId: string;
        startDate: string;
        endDate: string;
        dispensaryId?: string;
    }): Promise<DoctorPerformance> => {
        const response = await apiClient.get<DoctorPerformance>(API_ENDPOINTS.REPORTS_DOCTOR_PERFORMANCE, {
            params,
        });
        return response.data;
    },
};

export default {
    auth: authService,
    dispensary: dispensaryService,
    doctor: doctorService,
    timeSlot: timeSlotService,
    fee: feeService,
    booking: bookingService,
    report: reportService,
};
