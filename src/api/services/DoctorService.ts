
import axios from 'axios';
import api from '../../lib/axios';
import { Doctor } from '../models';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const DoctorService = {
  // Get doctors by dispensary ID
  getDoctorsByDispensaryId: async (dispensaryId: string): Promise<Doctor[]> => {
    try {
      const response = await api.get(`/doctors/dispensary/${dispensaryId}`);
      
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

  // Get all doctors
  getAllDoctors: async (): Promise<Doctor[]> => {
    try {
      const response = await api.get('/doctors');
      
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

  // Get doctors by dispensary ID
  getDoctorsByDispensaryId: async (dispensaryId: string): Promise<Doctor[]> => {
    try {
      const response = await api.get(`/doctors/dispensary/${dispensaryId}`);
      
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

  getDoctorsByDispensaryIds: async (dispensaryIds: string[]): Promise<Doctor[]> => {
    try {
      const response = await api.post(
        '/doctors/by-dispensaries',
        { dispensaryIds }
      );
      return response.data.map((doctor: any) => ({
        ...doctor,
        id: doctor._id,
      }));
    } catch (error) {
      console.error('Error fetching doctors for dispensary IDs:', error);
      throw new Error('Failed to fetch doctors for dispensary IDs');
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
