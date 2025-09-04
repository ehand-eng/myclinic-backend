import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface AvailableTimeSlot {
  appointmentNumber: number;
  timeSlot: string;
  estimatedTime: string;
  minutesPerPatient: number;
}

export interface TimeSlotAvailability {
  available: boolean;
  isModified?: boolean;
  reason?: 'absent' | 'no_config';
  message?: string;
  sessionInfo?: {
    startTime: string;
    endTime: string;
    minutesPerPatient: number;
    maxPatients: number;
  };
  slots?: AvailableTimeSlot[];
}

export interface TimeSlotFees {
  doctorFee: number;
  dispensaryFee: number;
  bookingCommission: number;
}

export interface TimeSlotConfig {
  id: string;
  doctorId: string;
  doctorName: string;
  dispensaryId: string;
  dispensaryName: string;
  minutesPerPatient: number;
  doctorFee: number;
  dispensaryFee: number;
  bookingCommission: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Dispensary {
  _id: string;
  name: string;
  address: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AbsentTimeSlot {
  id: string;
  doctorId: string;
  dispensaryId: string;
  date: Date;
  isModifiedSession: boolean;
  maxPatients: number;
  minutesPerPatient: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DoctorDispensaryFee {
  _id: string;
  doctorId: string;
  doctorName: string;
  dispensaryId: string;
  dispensaryName: string;
  doctorFee: number;
  dispensaryFee: number;
  bookingCommission: number;
  createdAt: Date;
  updatedAt: Date;
}

export const TimeSlotService = {
  // Get time slots for a doctor at a specific dispensary
  getTimeSlotConfigsByDoctor: async (doctorId: string, dispensaryId: string): Promise<TimeSlotConfig[]> => {
    try {
      const response = await axios.get(
        `${API_URL}/timeslots/config/doctor/${doctorId}/dispensary/${dispensaryId}`
      );
      
      return response.data.map((slot: any) => ({
        ...slot,
        id: slot._id,
        doctorId: slot.doctorId,
        dispensaryId: slot.dispensaryId,
        minutesPerPatient: slot.minutesPerPatient || 15, // Default to 15 minutes if not specified
        createdAt: new Date(slot.createdAt),
        updatedAt: new Date(slot.updatedAt)
      }));
    } catch (error) {
      console.error('Error fetching time slot configs:', error);
      throw new Error('Failed to fetch time slot configurations');
    }
  },

  // Get all time slots for a dispensary
  getTimeSlotConfigsByDispensary: async (dispensaryId: string): Promise<TimeSlotConfig[]> => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(
        `${API_URL}/timeslots/config/dispensary/${dispensaryId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      return response.data.map((slot: any) => ({
        ...slot,
        id: slot._id,
        doctorId: typeof slot.doctorId === 'object' ? slot.doctorId._id : slot.doctorId,
        dispensaryId: slot.dispensaryId,
        minutesPerPatient: slot.minutesPerPatient || 15, // Default to 15 minutes if not specified
        createdAt: new Date(slot.createdAt),
        updatedAt: new Date(slot.updatedAt)
      }));
    } catch (error) {
      console.error('Error fetching dispensary time slots:', error);
      throw new Error('Failed to fetch dispensary time slot configurations');
    }
  },

  // Add a new time slot configuration
  addTimeSlotConfig: async (timeSlotConfig: Omit<TimeSlotConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<TimeSlotConfig> => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.post(
        `${API_URL}/timeslots/config`, 
        timeSlotConfig,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      return {
        ...response.data,
        id: response.data._id,
        createdAt: new Date(response.data.createdAt),
        updatedAt: new Date(response.data.updatedAt)
      };
    } catch (error) {
      console.error('Error adding time slot config:', error);
      throw new Error('Failed to add time slot configuration');
    }
  },

  // Update a time slot configuration
  updateTimeSlotConfig: async (id: string, config: Partial<TimeSlotConfig>): Promise<TimeSlotConfig | null> => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.put(
        `${API_URL}/timeslots/config/${id}`, 
        config,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (!response.data) return null;
      
      return {
        ...response.data,
        id: response.data._id,
        createdAt: new Date(response.data.createdAt),
        updatedAt: new Date(response.data.updatedAt)
      };
    } catch (error) {
      console.error('Error updating time slot config:', error);
      throw new Error('Failed to update time slot configuration');
    }
  },

  // Delete a time slot configuration
  deleteTimeSlotConfig: async (id: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem('auth_token');
      await axios.delete(`${API_URL}/timeslots/config/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return true;
    } catch (error) {
      console.error('Error deleting time slot config:', error);
      throw new Error('Failed to delete time slot configuration');
    }
  },

  // Get absent time slots for a doctor at a specific dispensary
  getAbsentTimeSlots: async (doctorId: string, dispensaryId: string, startDate: Date, endDate: Date): Promise<AbsentTimeSlot[]> => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(
        `${API_URL}/timeslots/absent/doctor/${doctorId}/dispensary/${dispensaryId}`, 
        {
          params: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
          },
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      return response.data.map((slot: any) => ({
        ...slot,
        id: slot._id,
        date: new Date(slot.date),
        isModifiedSession: slot.isModifiedSession || false,
        maxPatients: slot.maxPatients || 0,
        minutesPerPatient: slot.minutesPerPatient || null,
        createdAt: new Date(slot.createdAt),
        updatedAt: new Date(slot.updatedAt)
      }));
    } catch (error) {
      console.error('Error fetching absent time slots:', error);
      throw new Error('Failed to fetch absent time slots');
    }
  },

  // Add an absent time slot
  addAbsentTimeSlot: async (absentSlot: Omit<AbsentTimeSlot, 'id' | 'createdAt' | 'updatedAt'>): Promise<AbsentTimeSlot> => {
    try {
      const token = localStorage.getItem('auth_token');
      
      // Convert date to ISO string if it's a Date object
      let absentDate ;
      if(absentSlot.date instanceof Date){
        const year = absentSlot.date.getFullYear();
        const month = String(absentSlot.date.getMonth() + 1).padStart(2, '0');
        const day = String(absentSlot.date.getDate()).padStart(2, '0');
        absentDate = `${year}-${month}-${day}`;
      }else{
        absentDate = absentSlot.date;
      }
      
      

      const slotToSend = {
        ...absentSlot,
        date: absentDate,
      };
      
      const response = await axios.post(
        `${API_URL}/timeslots/absent`, 
        slotToSend,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      return {
        ...response.data,
        id: response.data._id,
        date: new Date(response.data.date),
        isModifiedSession: response.data.isModifiedSession || false,
        maxPatients: response.data.maxPatients || 0,
        minutesPerPatient: response.data.minutesPerPatient || null,
        createdAt: new Date(response.data.createdAt),
        updatedAt: new Date(response.data.updatedAt)
      };
    } catch (error) {
      console.error('Error adding absent time slot:', error);
      throw new Error('Failed to add absent time slot');
    }
  },

  // Delete an absent time slot
  deleteAbsentTimeSlot: async (id: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem('auth_token');
      await axios.delete(`${API_URL}/timeslots/absent/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return true;
    } catch (error) {
      console.error('Error deleting absent time slot:', error);
      throw new Error('Failed to delete absent time slot');
    }
  },
  
  // Get available time slots for a doctor at a dispensary on a specific date
  getAvailableTimeSlots: async (
    doctorId: string,
    dispensaryId: string,
    date: Date
  ): Promise<TimeSlotAvailability> => {
    try {
      console.log(date);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      
      console.log("Original date:", date);
      console.log("Formatted date:", formattedDate);
      // const formattedDate = date.toISOString().split('T')[0];
      const response = await axios.get(
        `${API_URL}/timeslots/available/${doctorId}/${dispensaryId}/${formattedDate}`
      );
      
      return response.data;
    } catch (error) {
      console.error('Error fetching available time slots:', error);
      throw new Error('Failed to fetch available time slots');
    }
  },

  // Get next 5 available days with time slots for a doctor-dispensary pair
  getNextAvailableDays: async (
    doctorId: string,
    dispensaryId: string
  ): Promise<{
    available: boolean;
    availableDays: Array<{
      date: string;
      dayName: string;
      startTime: string;
      endTime: string;
      bookingsDone: number;
      nextAppointmentNumber: number;
      maxPatients: number;
      maxPossibleAppointments: number;
      minutesPerPatient: number;
      sessionInfo: {
        startTime: string;
        endTime: string;
        minutesPerPatient: number;
        maxPatients: number;
      };
      isModified: boolean;
      isFullyBooked: boolean;
      remainingSlots: number;
    }>;
    totalAvailableDays: number;
  }> => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(
        `${API_URL}/timeslots/next-available/${doctorId}/${dispensaryId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error fetching next available days:', error);
      throw new Error('Failed to fetch next available days');
    }
  },

  // Get fees for a time slot
  getTimeSlotFees: async (timeSlotId: string): Promise<TimeSlotFees> => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(
        `${API_URL}/timeslots/fees/${timeSlotId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching time slot fees:', error);
      throw new Error('Failed to fetch time slot fees');
    }
  },

  // Update fees for a time slot
  updateTimeSlotFees: async (
    timeSlotId: string,
    fees: TimeSlotFees
  ): Promise<TimeSlotFees> => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.put(
        `${API_URL}/timeslots/fees/${timeSlotId}`,
        fees,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data.fees;
    } catch (error) {
      console.error('Error updating time slot fees:', error);
      throw new Error('Failed to update time slot fees');
    }
  },

  // Delete/reset fees for a time slot
  deleteTimeSlotFees: async (timeSlotId: string): Promise<void> => {
    try {
      const token = localStorage.getItem('auth_token');
      await axios.delete(
        `${API_URL}/timeslots/fees/${timeSlotId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error('Error deleting time slot fees:', error);
      throw new Error('Failed to delete time slot fees');
    }
  },

  // Get all dispensaries
  getAllDispensaries: async (): Promise<Dispensary[]> => {
    try {
      const response = await axios.get(`${API_URL}/dispensaries`);
      return response.data.map((dispensary: any) => ({
        ...dispensary,
        _id: dispensary._id,
        name: dispensary.name,
        address: dispensary.address,
        createdAt: new Date(dispensary.createdAt),
        updatedAt: new Date(dispensary.updatedAt)
      }));
    } catch (error) {
      console.error('Error fetching dispensaries:', error);
      throw new Error('Failed to fetch dispensaries');
    }
  },

  // Get all doctor-dispensary fees
  getDoctorDispensaryFees: async (dispensaryId: string): Promise<DoctorDispensaryFee[]> => {
    try {
      const response = await axios.get(
        `${API_URL}/doctor-dispensaries/fees/${dispensaryId}`
      );
      
      return response.data.map((fee: any) => ({
        ...fee,
        _id: fee._id,
        doctorId: fee.doctorId,
        doctorName: fee.doctorName,
        dispensaryId: fee.dispensaryId,
        dispensaryName: fee.dispensaryName,
        doctorFee: fee.doctorFee || 0,
        dispensaryFee: fee.dispensaryFee || 0,
        bookingCommission: fee.bookingCommission || 0,
        createdAt: new Date(fee.createdAt),
        updatedAt: new Date(fee.updatedAt)
      }));
    } catch (error) {
      console.error('Error fetching doctor-dispensary fees:', error);
      throw new Error('Failed to fetch doctor-dispensary fees');
    }
  },

  // Update doctor-dispensary fees
  updateDoctorDispensaryFees: async (
    doctorId: string,
    dispensaryId: string,
    fees: TimeSlotFees
  ): Promise<DoctorDispensaryFee> => {
    try {
      const response = await axios.put(
        `${API_URL}/doctor-dispensaries/fees/${doctorId}/${dispensaryId}`,
        fees
      );
      
      return {
        ...response.data,
        _id: response.data._id,
        doctorId: response.data.doctorId,
        doctorName: response.data.doctorName,
        dispensaryId: response.data.dispensaryId,
        dispensaryName: response.data.dispensaryName,
        doctorFee: response.data.doctorFee || 0,
        dispensaryFee: response.data.dispensaryFee || 0,
        bookingCommission: response.data.bookingCommission || 0,
        createdAt: new Date(response.data.createdAt),
        updatedAt: new Date(response.data.updatedAt)
      };
    } catch (error) {
      console.error('Error updating doctor-dispensary fees:', error);
      throw new Error('Failed to update doctor-dispensary fees');
    }
  },

  // Delete/reset doctor-dispensary fees
  deleteDoctorDispensaryFees: async (doctorId: string, dispensaryId: string): Promise<void> => {
    try {
      await axios.delete(
        `${API_URL}/doctor-dispensaries/fees/${doctorId}/${dispensaryId}`
      );
    } catch (error) {
      console.error('Error deleting doctor-dispensary fees:', error);
      throw new Error('Failed to delete doctor-dispensary fees');
    }
  },

  // Assign or update doctor-dispensary fees (POST)
  assignDoctorDispensaryFees: async (
    doctorId: string,
    dispensaryId: string,
    fees: TimeSlotFees
  ): Promise<DoctorDispensaryFee> => {
    try {
      const response = await axios.post(
        `${API_URL}/doctor-dispensaries/assign-fees`,
        {
          doctorId,
          dispensaryId,
          doctorFee: fees.doctorFee,
          dispensaryFee: fees.dispensaryFee,
          bookingCommission: fees.bookingCommission,
        }
      );
      return {
        ...response.data,
        _id: response.data._id,
        doctorId: response.data.doctorId,
        doctorName: response.data.doctorName,
        dispensaryId: response.data.dispensaryId,
        dispensaryName: response.data.dispensaryName,
        doctorFee: response.data.doctorFee || 0,
        dispensaryFee: response.data.dispensaryFee || 0,
        bookingCommission: response.data.bookingCommission || 0,
        createdAt: new Date(response.data.createdAt),
        updatedAt: new Date(response.data.updatedAt)
      };
    } catch (error) {
      console.error('Error assigning doctor-dispensary fees:', error);
      throw new Error('Failed to assign doctor-dispensary fees');
    }
  },
};
