import { Booking, BookingStatus } from '../models';
import api from '../../lib/axios';
import { TimeSlotService, AvailableTimeSlot, TimeSlotAvailability } from './TimeSlotService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface BookingCreateParams {
  doctorId: string;
  dispensaryId: string;
  bookingDate: Date;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  symptoms?: string;
  fees?: {
    doctorFee: number;
    dispensaryFee: number;
    bookingCommission: number;
    totalFee: number;
  };
  bookedUser?: string;
  bookedBy?: string;
  // Additional fields required by backend
  timeSlot?: string;
  appointmentNumber?: number;
  estimatedTime?: string;
  minutesPerPatient?: number;
  // Payment fields
  paymentMethod?: 'cash' | 'online';
  paymentStatus?: 'pending' | 'processing' | 'paid' | 'failed' | 'not_required';
}

export interface BookingSummary {
  _id: string;
  transactionId: string;
  bookingDate: Date;
  timeSlot: string;
  appointmentNumber: number;
  estimatedTime: string;
  status: string;
  patient: {
    name: string;
    phone: string;
    email?: string;
  };
  doctor: {
    name: string;
    specialization: string;
  };
  dispensary: {
    name: string;
    address: string;
  };
  fees?: {
    doctorFee: number;
    dispensaryFee: number;
    bookingCommission: number;
    totalAmount: number;
  };
  symptoms?: string;
  bookedUser?: string;
  bookedBy?: string;
  createdAt: Date;
}

export const BookingService = {
  // Get all bookings for a specific date, doctor, and dispensary
  getBookings: async (
    doctorId: string,
    dispensaryId: string,
    date: Date
  ): Promise<Booking[]> => {
    try {
      const formattedDate = date.toISOString().split('T')[0];

      const response = await api.get(
        `/bookings/doctor/${doctorId}/dispensary/${dispensaryId}/date/${formattedDate}`
      );

      return response.data.map((booking: any) => ({
        ...booking,
        id: booking._id,
        bookingDate: new Date(booking.bookingDate),
        checkedInTime: booking.checkedInTime ? new Date(booking.checkedInTime) : undefined,
        completedTime: booking.completedTime ? new Date(booking.completedTime) : undefined,
        createdAt: new Date(booking.createdAt),
        updatedAt: new Date(booking.updatedAt)
      }));
    } catch (error) {
      console.error('Error fetching bookings:', error);
      throw new Error('Failed to fetch bookings');
    }
  },

  // Get bookings by doctor, dispensary, and date - alias for the above method
  getBookingsByDoctorDispensaryDate: async (
    doctorId: string,
    dispensaryId: string,
    formattedDate: string
  ): Promise<Booking[]> => {
    try {
      const response = await api.get(
        `/bookings/doctor/${doctorId}/dispensary/${dispensaryId}/date/${formattedDate}`
      );

      return response.data.map((booking: any) => ({
        ...booking,
        id: booking._id,
        bookingDate: new Date(booking.bookingDate),
        checkedInTime: booking.checkedInTime ? new Date(booking.checkedInTime) : undefined,
        completedTime: booking.completedTime ? new Date(booking.completedTime) : undefined,
        createdAt: new Date(booking.createdAt),
        updatedAt: new Date(booking.updatedAt)
      }));
    } catch (error) {
      console.error('Error fetching bookings:', error);
      throw new Error('Failed to fetch bookings');
    }
  },

  // Get a booking by ID
  getBookingById: async (id: string): Promise<Booking | null> => {
    try {
      const response = await api.get(
        `/bookings/${id}`
      );

      if (!response.data) return null;

      return {
        ...response.data,
        id: response.data._id,
        bookingDate: new Date(response.data.bookingDate),
        checkedInTime: response.data.checkedInTime ? new Date(response.data.checkedInTime) : undefined,
        completedTime: response.data.completedTime ? new Date(response.data.completedTime) : undefined,
        createdAt: new Date(response.data.createdAt),
        updatedAt: new Date(response.data.updatedAt)
      };
    } catch (error) {
      console.error('Error fetching booking by ID:', error);
      throw new Error('Failed to fetch booking details');
    }
  },

  // Get all bookings for a patient
  getBookingsByPatient: async (patientId: string): Promise<Booking[]> => {
    try {
      const response = await api.get(
        `/bookings/patient/${patientId}`
      );

      return response.data.map((booking: any) => ({
        ...booking,
        id: booking._id,
        bookingDate: new Date(booking.bookingDate),
        checkedInTime: booking.checkedInTime ? new Date(booking.checkedInTime) : undefined,
        completedTime: booking.completedTime ? new Date(booking.completedTime) : undefined,
        createdAt: new Date(booking.createdAt),
        updatedAt: new Date(booking.updatedAt)
      }));
    } catch (error) {
      console.error('Error fetching patient bookings:', error);
      throw new Error('Failed to fetch patient bookings');
    }
  },

  // Updated method to get the next available appointment
  getNextAvailableAppointment: async (
    doctorId: string,
    dispensaryId: string,
    date: Date
  ): Promise<TimeSlotAvailability> => {
    try {
      // Get all available slots for this date
      const availability = await TimeSlotService.getAvailableTimeSlots(doctorId, dispensaryId, date);

      // Return the availability data, which includes availability status, session info, and slots
      return availability;
    } catch (error) {
      console.error('Error fetching next available appointment:', error);
      return {
        available: false,
        message: 'Error fetching availability information'
      };
    }
  },

  // Create a new booking
  createBooking: async (booking: BookingCreateParams): Promise<{ booking: Booking; transactionId: string; bookingId: string }> => {
    try {
      const token = localStorage.getItem('auth_token');

      // Format booking date to YYYY-MM-DD format
      const year = booking.bookingDate.getFullYear();
      const month = String(booking.bookingDate.getMonth() + 1).padStart(2, '0');
      const day = String(booking.bookingDate.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;

      // Determine bookedUser and bookedBy
      let bookedUser = 'online';
      let bookedBy = 'ONLINE';

      // Check if user is logged in
      if (token) {
        try {
          const userStr = localStorage.getItem('current_user');
          if (userStr) {
            const user = JSON.parse(userStr);
            bookedUser = user.id || user._id || 'online';

            // Normalize role names for bookedBy field
            const userRole = user.role?.toLowerCase().replace(/[-_]/g, '-') || '';
            if (userRole === 'channel-partner') {
              bookedBy = 'CHANNEL-PARTNER';
            } else if (userRole === 'super-admin') {
              bookedBy = 'SUPER-ADMIN';
            } else if (userRole === 'dispensary-admin' || userRole === 'hospital-admin') {
              bookedBy = 'DISPENSARY-ADMIN';
            } else if (userRole === 'dispensary-staff' || userRole === 'hospital-staff') {
              bookedBy = 'DISPENSARY-STAFF';
            } else {
              bookedBy = user.role ? user.role.toUpperCase() : 'ONLINE';
            }
          }
        } catch (error) {
          console.warn('Error parsing user data, using default values:', error);
        }
      }

      const bookingToSend = {
        ...booking,
        bookingDate: formattedDate,
        bookedUser,
        bookedBy,
      };

      const response = await api.post(
        `/bookings`,
        bookingToSend
      );

      return {
        booking: {
          ...response.data,
          id: response.data._id,
          bookingDate: new Date(response.data.bookingDate),
          checkedInTime: response.data.checkedInTime ? new Date(response.data.checkedInTime) : undefined,
          completedTime: response.data.completedTime ? new Date(response.data.completedTime) : undefined,
          createdAt: new Date(response.data.createdAt),
          updatedAt: new Date(response.data.updatedAt)
        },
        transactionId: response.data.transactionId,
        bookingId: response.data._id
      };
    } catch (error) {
      console.error('Error creating booking:', error);
      throw new Error('Failed to create booking');
    }
  },

  // Get booking summary
  getBookingSummary: async (transactionId: string): Promise<BookingSummary> => {
    try {
      const response = await api.get(
        `/bookings/summary/${transactionId}`
      );

      return {
        ...response.data,
        bookingDate: new Date(response.data.bookingDate),
        createdAt: new Date(response.data.createdAt)
      };
    } catch (error) {
      console.error('Error fetching booking summary:', error);
      throw new Error('Failed to fetch booking summary');
    }
  },

  // Update booking status
  updateBookingStatus: async (
    id: string,
    status: BookingStatus,
    additionalInfo?: {
      checkedInTime?: Date;
      completedTime?: Date;
      notes?: string;
      isPaid?: boolean;
      isPatientVisited?: boolean;
    }
  ): Promise<Booking | null> => {
    try {
      // Prepare data to send
      const updateData = {
        status,
        ...additionalInfo,
        checkedInTime: additionalInfo?.checkedInTime instanceof Date
          ? additionalInfo.checkedInTime.toISOString()
          : additionalInfo?.checkedInTime,
        completedTime: additionalInfo?.completedTime instanceof Date
          ? additionalInfo.completedTime.toISOString()
          : additionalInfo?.completedTime
      };

      const response = await api.patch(
        `/bookings/${id}/status`,
        updateData
      );

      if (!response.data) return null;

      return {
        ...response.data,
        id: response.data._id,
        bookingDate: new Date(response.data.bookingDate),
        checkedInTime: response.data.checkedInTime ? new Date(response.data.checkedInTime) : undefined,
        completedTime: response.data.completedTime ? new Date(response.data.completedTime) : undefined,
        createdAt: new Date(response.data.createdAt),
        updatedAt: new Date(response.data.updatedAt)
      };
    } catch (error) {
      console.error('Error updating booking status:', error);
      throw new Error('Failed to update booking status');
    }
  },

  // Cancel a booking
  cancelBooking: async (id: string, reason?: string): Promise<Booking | null> => {
    try {
      const response = await api.patch(
        `/bookings/${id}/cancel`,
        { reason }
      );

      if (!response.data) return null;

      return {
        ...response.data,
        id: response.data._id,
        bookingDate: new Date(response.data.bookingDate),
        checkedInTime: response.data.checkedInTime ? new Date(response.data.checkedInTime) : undefined,
        completedTime: response.data.completedTime ? new Date(response.data.completedTime) : undefined,
        createdAt: new Date(response.data.createdAt),
        updatedAt: new Date(response.data.updatedAt)
      };
    } catch (error) {
      console.error('Error cancelling booking:', error);
      throw new Error('Failed to cancel booking');
    }
  },

  // Get available time slots for a doctor at a dispensary on a specific date
  getAvailableTimeSlots: async (
    doctorId: string,
    dispensaryId: string,
    date: Date
  ): Promise<TimeSlotAvailability> => {
    try {
      return TimeSlotService.getAvailableTimeSlots(doctorId, dispensaryId, date);
    } catch (error) {
      console.error('Error fetching available time slots:', error);
      throw new Error('Failed to fetch available time slots');
    }
  },

  fetchDoctorDispensaryFees: async (doctorId: string, dispensaryId: string) => {
    const response = await api.get(
      `/doctor-dispensaries/fees/${doctorId}/${dispensaryId}`
    );
    return response.data;
  },

  // Search bookings by multiple criteria
  searchBookings: async (query: string, searchType?: 'transactionId' | 'phone' | 'name'): Promise<any[]> => {
    try {
      const params = new URLSearchParams({ query });
      if (searchType) {
        params.append('searchType', searchType);
      }

      const response = await api.get(
        `/bookings/search?${params}`
      );

      return response.data.results.map((booking: any) => ({
        ...booking,
        bookingDate: new Date(booking.bookingDate),
        createdAt: new Date(booking.createdAt)
      }));
    } catch (error) {
      console.error('Error searching bookings:', error);
      throw new Error('Failed to search bookings');
    }
  },

  // Adjust booking to new date/time
  adjustBooking: async (id: string, newDate: Date, doctorId?: string, dispensaryId?: string): Promise<Booking | null> => {
    try {
      const response = await api.patch(`/bookings/${id}/adjust`, {
        newDate: newDate.toISOString(),
        doctorId,
        dispensaryId
      });

      return response.data.booking;
    } catch (error) {
      console.error('Error adjusting booking:', error);
      throw new Error('Failed to adjust booking');
    }
  },

  // Search bookings for check-in
  searchBookingsForCheckIn: async (params: {
    bookingReference?: string;
    appointmentNumber?: string;
    patientName?: string;
    doctorId?: string;
    sessionId?: string;
    date?: string;
    dispensaryId?: string;
  }): Promise<Booking[]> => {
    try {
      const queryParams = new URLSearchParams();

      if (params.bookingReference) queryParams.append('bookingReference', params.bookingReference);
      if (params.appointmentNumber) queryParams.append('appointmentNumber', params.appointmentNumber);
      if (params.patientName) queryParams.append('patientName', params.patientName);
      if (params.doctorId) queryParams.append('doctorId', params.doctorId);
      if (params.sessionId) queryParams.append('sessionId', params.sessionId);
      if (params.date) queryParams.append('date', params.date);
      if (params.dispensaryId) queryParams.append('dispensaryId', params.dispensaryId);

      const response = await api.get(`/dispensary/bookings/search?${queryParams.toString()}`);

      return response.data.bookings.map((booking: any) => ({
        ...booking,
        id: booking._id,
        bookingDate: new Date(booking.bookingDate),
        checkedInTime: booking.checkedInTime ? new Date(booking.checkedInTime) : undefined,
        createdAt: booking.createdAt ? new Date(booking.createdAt) : undefined,
        updatedAt: booking.updatedAt ? new Date(booking.updatedAt) : undefined
      }));
    } catch (error) {
      console.error('Error searching bookings for check-in:', error);
      throw new Error('Failed to search bookings');
    }
  },

  // Load bookings for a session (walk-in/bulk mode)
  loadSessionBookings: async (params: {
    dispensaryId: string;
    doctorId: string;
    date: string;
    sessionId?: string;
  }): Promise<Booking[]> => {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('dispensaryId', params.dispensaryId);
      queryParams.append('doctorId', params.doctorId);
      queryParams.append('date', params.date);
      if (params.sessionId) queryParams.append('sessionId', params.sessionId);

      const response = await api.get(`/dispensary/bookings/session?${queryParams.toString()}`);

      return response.data.bookings.map((booking: any) => ({
        ...booking,
        id: booking._id,
        bookingDate: new Date(booking.bookingDate),
        checkedInTime: booking.checkedInTime ? new Date(booking.checkedInTime) : undefined,
        createdAt: booking.createdAt ? new Date(booking.createdAt) : undefined,
        updatedAt: booking.updatedAt ? new Date(booking.updatedAt) : undefined
      }));
    } catch (error) {
      console.error('Error loading session bookings:', error);
      throw new Error('Failed to load session bookings');
    }
  },

  // Mark booking as checked-in
  checkInBooking: async (bookingId: string): Promise<Booking> => {
    try {
      const response = await api.patch(`/dispensary/bookings/${bookingId}/check-in`);

      const booking = response.data.booking;
      return {
        ...booking,
        id: booking._id,
        bookingDate: new Date(booking.bookingDate),
        checkedInTime: booking.checkedInTime ? new Date(booking.checkedInTime) : undefined,
        createdAt: booking.createdAt ? new Date(booking.createdAt) : undefined,
        updatedAt: booking.updatedAt ? new Date(booking.updatedAt) : undefined
      };
    } catch (error) {
      console.error('Error checking in booking:', error);
      throw new Error('Failed to check in booking');
    }
  }
};
