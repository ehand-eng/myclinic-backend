// API Models for Doctor Reservation System

// Base model for common fields
export interface BaseModel {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// Doctor model
export interface Doctor extends BaseModel {
  name: string;
  specialization: string;
  qualifications: string[];
  contactNumber: string;
  email: string;
  profilePicture?: string;
  dispensaries: string[]; // IDs of associated dispensaries
}

// Dispensary model
export interface Dispensary extends BaseModel {
  name: string;
  address: string;
  contactNumber: string;
  email: string;
  description?: string;
  doctors: string[]; // IDs of associated doctors
  location?: {
    latitude: number;
    longitude: number;
  };
}

// Time slot configuration for doctor at a specific dispensary
export interface TimeSlotConfig extends BaseModel {
  doctorId: string;
  dispensaryId: string;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // Format: "HH:MM" in 24-hour format
  endTime: string; // Format: "HH:MM" in 24-hour format
  maxPatients: number; // Maximum number of patients per slot
  minutesPerPatient: number; // Minutes allocated per patient
}

// Absent time slot (when doctor is unavailable)
export interface AbsentTimeSlot extends BaseModel {
  doctorId: string;
  dispensaryId: string;
  date: Date;
  startTime: string; // Format: "HH:MM" in 24-hour format
  endTime: string; // Format: "HH:MM" in 24-hour format
  reason?: string;
  isModifiedSession?: boolean; // Flag to indicate if this is a modified session rather than absence
  maxPatients?: number; // If modified session, can specify different max patients
  minutesPerPatient?: number; // Minutes allocated per patient for this specific session
}

// Patient model
export interface Patient extends BaseModel {
  name: string;
  contactNumber: string;
  email?: string;
  dateOfBirth?: Date;
  gender?: 'Male' | 'Female' | 'Other';
  medicalHistory?: string[];
}

// Booking status enum
export enum BookingStatus {
  SCHEDULED = 'scheduled',
  CHECKED_IN = 'checked_in',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show'
}

// Booking model
export interface Booking extends BaseModel {
  patientId: string;
  doctorId: string;
  dispensaryId: string;
  bookingDate: Date;
  timeSlot: string; // Format: "HH:MM-HH:MM"
  appointmentNumber: number; // Sequential appointment number for the session
  estimatedTime: string; // Format: "HH:MM" - Estimated time of appointment
  status: BookingStatus;
  notes?: string;
  symptoms?: string;
  isPaid: boolean;
  isPatientVisited: boolean;
  checkedInTime?: Date;
  completedTime?: Date;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  bookedUser?: string;
  bookedBy?: string;
}

// User role enum
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  HOSPITAL_ADMIN = 'hospital_admin',
  hospital_staff = 'hospital_staff'
}

// User model
export interface User extends BaseModel {
  name: string;
  email: string;
  passwordHash: string; // In a real implementation, never store plain passwords
  role: UserRole;
  dispensaryIds?: string[]; // For dispensary admins and staff, which dispensaries they are associated with
  isActive: boolean;
  lastLogin?: Date;
}

// Report types enum
export enum ReportType {
  DAILY_BOOKINGS = 'daily_bookings',
  MONTHLY_SUMMARY = 'monthly_summary', 
  DOCTOR_PERFORMANCE = 'doctor_performance',
  DISPENSARY_REVENUE = 'dispensary_revenue'
}

// Report model
export interface Report extends BaseModel {
  type: ReportType;
  title: string;
  parameters: Record<string, any>; // Parameters used to generate the report
  generatedBy: string; // User ID
  dispensaryId?: string; // Optional, if the report is for a specific dispensary
  startDate: Date;
  endDate: Date;
  data: Record<string, any>; // Structured report data
}

// Available time slot interface for booking form
export interface AvailableTimeSlot {
  date: Date;
  doctor: any; // Doctor object
  dispensary: any; // Dispensary object
  timeSlot: string;
  appointmentNumber: number;
  estimatedTime: string;
}

// Add the SessionInformation interface
export interface SessionInformation {
  startTime: string;
  endTime: string;
  minutesPerPatient: number;
  maxPatients: number;
  isModified?: boolean;
}

// Add the TimeSlotAvailability interface
export interface TimeSlotAvailability {
  available: boolean;
  message?: string;
  reason?: string;
  sessionInfo?: SessionInformation;
  availableTimeSlots?: string[];
  availableAppointmentNumbers?: number[];
  isModified?: boolean;
}
