
import axios from 'axios';
import api from '../../lib/axios';
import { Dispensary, Doctor } from '../models';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const DispensaryService = {
  // Get all dispensaries
  getAllDispensaries: async (): Promise<Dispensary[]> => {
    try {
      const response = await api.get('/dispensaries');
      
      return response.data.map((dispensary: any) => ({
        ...dispensary,
        id: dispensary._id,
        createdAt: new Date(dispensary.createdAt),
        updatedAt: new Date(dispensary.updatedAt)
      }));
    } catch (error) {
      console.error('Error fetching dispensaries:', error);
      throw new Error('Failed to fetch dispensaries');
    }
  },

  // Get dispensary by ID
  getDispensaryById: async (id: string): Promise<Dispensary | null> => {
    try {
      const response = await api.get(`/dispensaries/${id}`);
      
      if (!response.data) return null;
      
      return {
        ...response.data,
        id: response.data._id,
        createdAt: new Date(response.data.createdAt),
        updatedAt: new Date(response.data.updatedAt)
      };
    } catch (error) {
      console.error(`Error fetching dispensary with ID ${id}:`, error);
      throw new Error('Failed to fetch dispensary');
    }
  },

  getDispensariesByIds: async (ids: string[]):Promise<Dispensary[]> => {
    const response = await api.post(
      '/dispensaries/by-ids',
      { ids }
    );
    console.log(response.data);
    if (!response.data) return null;
      
    return response.data.map((dispensary: any) => ({
      ...dispensary,
      id: dispensary._id,
    }));
  },

  

  // Get dispensaries by doctor ID
  getDispensariesByDoctorId: async (doctorId: string): Promise<Dispensary[]> => {
    try {
      const response = await api.get(`/dispensaries/doctor/${doctorId}`);
      
      return response.data.map((dispensary: any) => ({
        ...dispensary,
        id: dispensary._id,
        createdAt: new Date(dispensary.createdAt),
        updatedAt: new Date(dispensary.updatedAt)
      }));
    } catch (error) {
      console.error(`Error fetching dispensaries for doctor ${doctorId}:`, error);
      throw new Error('Failed to fetch dispensaries for doctor');
    }
  },

  // Get dispensaries by location (within radius)
  getDispensariesByLocation: async (
    latitude: number, 
    longitude: number, 
    radiusKm: number = 10
  ): Promise<Dispensary[]> => {
    try {
      const response = await api.get('/dispensaries/location/nearby', {
        params: { latitude, longitude, radiusKm }
      });
      
      return response.data.map((dispensary: any) => ({
        ...dispensary,
        id: dispensary._id,
        createdAt: new Date(dispensary.createdAt),
        updatedAt: new Date(dispensary.updatedAt)
      }));
    } catch (error) {
      console.error('Error fetching nearby dispensaries:', error);
      throw new Error('Failed to fetch nearby dispensaries');
    }
  },

  // Add a new dispensary
  addDispensary: async (dispensary: Omit<Dispensary, 'id' | 'createdAt' | 'updatedAt'>): Promise<Dispensary> => {
    try {
      const response = await api.post('/dispensaries', dispensary);
      
      return {
        ...response.data,
        id: response.data._id,
        createdAt: new Date(response.data.createdAt),
        updatedAt: new Date(response.data.updatedAt)
      };
    } catch (error) {
      console.error('Error adding dispensary:', error);
      throw new Error('Failed to add dispensary');
    }
  },

  // Update dispensary
  updateDispensary: async (id: string, dispensary: Partial<Dispensary>): Promise<Dispensary | null> => {
    try {
      const response = await api.put(`/dispensaries/${id}`, dispensary);
      
      if (!response.data) return null;
      
      return {
        ...response.data,
        id: response.data._id,
        createdAt: new Date(response.data.createdAt),
        updatedAt: new Date(response.data.updatedAt)
      };
    } catch (error) {
      console.error(`Error updating dispensary with ID ${id}:`, error);
      throw new Error('Failed to update dispensary');
    }
  },

  // Delete dispensary
  deleteDispensary: async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/dispensaries/${id}`);
      return true;
    } catch (error) {
      console.error(`Error deleting dispensary with ID ${id}:`, error);
      throw new Error('Failed to delete dispensary');
    }
  }
};
