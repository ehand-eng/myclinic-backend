
import axios from 'axios';
import api from '../../lib/axios';
import { Doctor } from '../models';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const DoctorService = {
  // Get doctors by dispensary ID
  getDoctorsByDispensaryId: async (dispensaryId: string, activeOnly = false): Promise<Doctor[]> => {
    try {
      const url = activeOnly
        ? `/doctors/dispensary/${dispensaryId}?activeOnly=true`
        : `/doctors/dispensary/${dispensaryId}`;
      const response = await api.get(url);

      return response.data.map((doctor: any) => ({
        ...doctor,
        id: doctor._id,
        createdAt: new Date(doctor.createdAt),
        updatedAt: new Date(doctor.updatedAt)
      }));
    } catch (error) {
      console.error(`Error fetching doctors for dispensary ${dispensaryId}:`, error);
      throw new Error('Failed to fetch doctors for dispensary');
    }
  },

  // Get all doctors (activeOnly=true for public/booking to exclude disabled)
  getAllDoctors: async (activeOnly = false): Promise<Doctor[]> => {
    try {
      const url = activeOnly ? '/doctors?activeOnly=true' : '/doctors';
      const response = await api.get(url);

      return response.data.map((doctor: any) => ({
        ...doctor,
        id: doctor._id,
        createdAt: new Date(doctor.createdAt),
        updatedAt: new Date(doctor.updatedAt)
      }));
    } catch (error) {
      console.error('Error fetching doctors:', error);
      throw new Error('Failed to fetch doctors');
    }
  },

  // Get doctor by ID
  getDoctorById: async (id: string): Promise<Doctor | null> => {
    try {
      const response = await api.get(`/doctors/${id}`);
      
      if (!response.data) return null;
      
      return {
        ...response.data,
        id: response.data._id,
        createdAt: new Date(response.data.createdAt),
        updatedAt: new Date(response.data.updatedAt)
      };
    } catch (error) {
      console.error(`Error fetching doctor with ID ${id}:`, error);
      throw new Error('Failed to fetch doctor');
    }
  },

  getDoctorsByDispensaryIds: async (dispensaryIds: string[], activeOnly = false): Promise<Doctor[]> => {
    try {
      const response = await api.post('/doctors/by-dispensaries', {
        dispensaryIds,
        ...(activeOnly && { activeOnly: true })
      });
      return response.data.map((doctor: any) => ({
        ...doctor,
        id: doctor._id,
      }));
    } catch (error) {
      console.error('Error fetching doctors for dispensary IDs:', error);
      throw new Error('Failed to fetch doctors for dispensary IDs');
    }
  },

  setDoctorDisabled: async (id: string, disabled: boolean): Promise<Doctor | null> => {
    try {
      const endpoint = disabled ? `/doctors/${id}/disable` : `/doctors/${id}/enable`;
      const response = await api.patch(endpoint);
      if (!response.data) return null;
      return {
        ...response.data,
        id: response.data._id,
        createdAt: new Date(response.data.createdAt),
        updatedAt: new Date(response.data.updatedAt)
      };
    } catch (error) {
      console.error(`Error ${disabled ? 'disabling' : 'enabling'} doctor:`, error);
      throw new Error(disabled ? 'Failed to disable doctor' : 'Failed to enable doctor');
    }
  },

  // Add a new doctor
  addDoctor: async (doctor: Omit<Doctor, 'id' | 'createdAt' | 'updatedAt'>): Promise<Doctor> => {
    try {
      const response = await api.post('/doctors', doctor);
      
      return {
        ...response.data,
        id: response.data._id,
        createdAt: new Date(response.data.createdAt),
        updatedAt: new Date(response.data.updatedAt)
      };
    } catch (error) {
      console.error('Error adding doctor:', error);
      throw new Error('Failed to add doctor');
    }
  },

  // Update doctor
  updateDoctor: async (id: string, doctor: Partial<Doctor>): Promise<Doctor | null> => {
    try {
      const response = await api.put(`/doctors/${id}`, doctor);
      
      if (!response.data) return null;
      
      return {
        ...response.data,
        id: response.data._id,
        createdAt: new Date(response.data.createdAt),
        updatedAt: new Date(response.data.updatedAt)
      };
    } catch (error) {
      console.error(`Error updating doctor with ID ${id}:`, error);
      throw new Error('Failed to update doctor');
    }
  },

  // Delete doctor
  deleteDoctor: async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/doctors/${id}`);
      return true;
    } catch (error) {
      console.error(`Error deleting doctor with ID ${id}:`, error);
      throw new Error('Failed to delete doctor');
    }
  }
};
