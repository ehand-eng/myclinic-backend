
import { Patient } from '../models';

// Mocked patients data
const mockPatients: Patient[] = [
  {
    id: 'p1',
    name: 'John Smith',
    contactNumber: '555-111-2222',
    email: 'john.smith@example.com',
    dateOfBirth: new Date('1985-06-15'),
    gender: 'Male',
    medicalHistory: ['Hypertension', 'Allergic to penicillin'],
    createdAt: new Date('2023-01-10'),
    updatedAt: new Date('2023-01-10')
  },
  {
    id: 'p2',
    name: 'Maria Garcia',
    contactNumber: '555-333-4444',
    email: 'maria.garcia@example.com',
    dateOfBirth: new Date('1990-11-22'),
    gender: 'Female',
    createdAt: new Date('2023-02-20'),
    updatedAt: new Date('2023-02-20')
  },
  {
    id: 'p3',
    name: 'Ahmed Khan',
    contactNumber: '555-555-6666',
    dateOfBirth: new Date('1978-03-08'),
    gender: 'Male',
    medicalHistory: ['Diabetes Type 2', 'Asthma'],
    createdAt: new Date('2023-03-15'),
    updatedAt: new Date('2023-03-15')
  }
];

export const PatientService = {
  // Get a patient by ID
  getPatientById: async (id: string): Promise<Patient | null> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockPatients.find(patient => patient.id === id) || null;
  },
  
  // Get a patient by phone number
  getPatientByPhoneNumber: async (phoneNumber: string): Promise<Patient | null> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockPatients.find(patient => patient.contactNumber === phoneNumber) || null;
  },
  
  // Register a new patient
  registerPatient: async (patient: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>): Promise<Patient> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newPatient: Patient = {
      ...patient,
      id: `p${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    return newPatient;
  },
  
  // Update patient information
  updatePatient: async (id: string, patientData: Partial<Patient>): Promise<Patient | null> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const existingPatientIndex = mockPatients.findIndex(p => p.id === id);
    
    if (existingPatientIndex === -1) {
      return null;
    }
    
    const updatedPatient = {
      ...mockPatients[existingPatientIndex],
      ...patientData,
      updatedAt: new Date()
    };
    
    return updatedPatient;
  },
  
  // Add medical history entry
  addMedicalHistoryEntry: async (id: string, entry: string): Promise<Patient | null> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const patient = mockPatients.find(p => p.id === id);
    
    if (!patient) {
      return null;
    }
    
    const updatedHistory = [...(patient.medicalHistory || []), entry];
    
    const updatedPatient: Patient = {
      ...patient,
      medicalHistory: updatedHistory,
      updatedAt: new Date()
    };
    
    return updatedPatient;
  }
};
