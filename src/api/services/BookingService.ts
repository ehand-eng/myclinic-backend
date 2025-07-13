import { Booking, BookingStatus } from '../models';
import axios from 'axios';
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
}

export interface BookingSummary {
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
      const token = localStorage.getItem('auth_token');
      const formattedDate = date.toISOString().split('T')[0];
      
      const response = await axios.get(
        `${API_URL}/bookings/doctor/${doctorId}/dispensary/${dispensaryId}/date/${formattedDate}`,
        { headers: { Authorization: `Bearer ${token}` } }
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
      const token = localStorage.getItem('auth_token');
      
      const response = await axios.get(
        `${API_URL}/bookings/doctor/${doctorId}/dispensary/${dispensaryId}/date/${formattedDate}`,
        { headers: { Authorization: `Bearer ${token}` } }
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
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(
        `${API_URL}/bookings/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
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
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(
        `${API_URL}/bookings/patient/${patientId}`,
        { headers: { Authorization: `Bearer ${token}` } }
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
  createBooking: async (booking: BookingCreateParams): Promise<{ booking: Booking; transactionId: string }> => {
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
            bookedBy = user.role ? user.role.toUpperCase() : 'ONLINE';
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
      
      const response = await axios.post(
        `${API_URL}/bookings`, 
        bookingToSend,
        { headers: { Authorization: `Bearer ${token}` } }
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
        transactionId: response.data.transactionId
      };
    } catch (error) {
      console.error('Error creating booking:', error);
      throw new Error('Failed to create booking');
    }
  },

  // Get booking summary
  getBookingSummary: async (transactionId: string): Promise<BookingSummary> => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(
        `${API_URL}/bookings/summary/${transactionId}`,
        { headers: { Authorization: `Bearer ${token}` } }
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
      const token = localStorage.getItem('auth_token');
      
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
      
      const response = await axios.patch(
        `${API_URL}/bookings/${id}/status`, 
        updateData,
        { headers: { Authorization: `Bearer ${token}` } }
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
      const token = localStorage.getItem('auth_token');
      const response = await axios.patch(
        `${API_URL}/bookings/${id}/cancel`, 
        { reason },
        { headers: { Authorization: `Bearer ${token}` } }
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
    const token = localStorage.getItem('auth_token');
    const response = await axios.get(
      `${API_URL}/doctor-dispensaries/fees/${doctorId}/${dispensaryId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  }
};
