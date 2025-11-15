
// Export all services
export { AuthService } from './AuthService';
export { BookingService } from './BookingService';
export { DoctorService } from './DoctorService';
export { DispensaryService } from './DispensaryService';
export { PatientService } from './PatientService';
export { ReportService } from './ReportService';
export { TimeSlotService } from './TimeSlotService';
export { UserDispensaryService } from './UserDispensaryService';
export { DoctorDispensaryService } from './DoctorDispensaryService';

// Re-export types to avoid conflicts
export type { 
  TimeSlotConfig, 
  AbsentTimeSlot 
} from './TimeSlotService';

export type { 
  DoctorDispensaryFee 
} from './DoctorDispensaryService';
