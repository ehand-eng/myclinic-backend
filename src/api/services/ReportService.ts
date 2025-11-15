
import axios from 'axios';
import api from '../../lib/axios';
import { Report, ReportType } from '../models';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface Booking {
  id: string;
  bookingDate: string;
  timeSlot: string;
  patientName: string;
  patientPhone: string;
  doctor: {
    name: string;
  };
  dispensary: {
    name: string;
  };
  status: string;
  checkedInTime?: string;
  completedTime?: string;
}

export interface DailyBookingSummary {
  total: number;
  completed: number;
  cancelled: number;
  noShow: number;
  bookings: Booking[];
}

export interface MonthlySummary {
  total: number;
  completed: number;
  cancelled: number;
  noShow: number;
  dailyStats: {
    date: string;
    total: number;
    completed: number;
    cancelled: number;
    noShow: number;
  }[];
}

export interface DoctorPerformance {
  totalBookings: number;
  completionRate: number;
  cancellationRate: number;
  averageConsultationTime: number;
  bookings: Booking[];
}

export const ReportService = {
  // Get all reports
  getAllReports: async (): Promise<Report[]> => {
    try {
      const response = await api.get('/reports');
      
      return response.data;
    } catch (error) {
      console.error('Error fetching reports:', error);
      return [];
    }
  },
  
  // Get reports by dispensary
  getReportsByDispensary: async (dispensaryId: string): Promise<Report[]> => {
    try {
      const response = await api.get(`/reports/dispensary/${dispensaryId}`);
      
      return response.data;
    } catch (error) {
      console.error('Error fetching dispensary reports:', error);
      return [];
    }
  },
  
  // Generate a new report
  generateReport: async (
    type: ReportType,
    title: string,
    parameters: Record<string, any>,
    generatedBy: string,
    dispensaryId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Report> => {
    try {
      let endpoint = '';
      
      switch(type) {
        case ReportType.DAILY_BOOKINGS:
          endpoint = '/reports/generate/daily-bookings';
          break;
        case ReportType.MONTHLY_SUMMARY:
          endpoint = '/reports/generate/monthly-summary';
          break;
        case ReportType.DOCTOR_PERFORMANCE:
          endpoint = '/reports/generate/doctor-performance';
          break;
        case ReportType.DISPENSARY_REVENUE:
          endpoint = '/reports/generate/dispensary-revenue';
          break;
        default:
          throw new Error('Invalid report type');
      }
      
      const response = await api.post(
        endpoint,
        {
          title,
          parameters,
          dispensaryId,
          startDate: startDate ? startDate.toISOString() : new Date().toISOString(),
          endDate: endDate ? endDate.toISOString() : new Date().toISOString()
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error generating report:', error);
      
      // Fallback to mock data for development purposes
      console.log('Falling back to mock data');
      
      // Generate mock report data based on type
      const now = new Date();
      const reportStartDate = startDate || now;
      const reportEndDate = endDate || now;
      
      // Generate mock report data (same as before for fallback)
      let reportData: Record<string, any> = {};
      
      switch (type) {
        case ReportType.DAILY_BOOKINGS:
          reportData = {
            totalBookings: Math.floor(Math.random() * 50) + 10,
            completedBookings: Math.floor(Math.random() * 40) + 5,
            cancelledBookings: Math.floor(Math.random() * 10),
            noShowBookings: Math.floor(Math.random() * 5),
            bookingsByDoctor: [
              { doctorId: '1', doctorName: 'Dr. Smith', bookings: Math.floor(Math.random() * 20) + 5 },
              { doctorId: '2', doctorName: 'Dr. Johnson', bookings: Math.floor(Math.random() * 15) + 5 },
            ]
          };
          break;
          
        case ReportType.MONTHLY_SUMMARY:
          reportData = {
            totalBookings: Math.floor(Math.random() * 500) + 100,
            completedBookings: Math.floor(Math.random() * 400) + 50,
            cancelledBookings: Math.floor(Math.random() * 50),
            noShowBookings: Math.floor(Math.random() * 30),
            revenue: Math.floor(Math.random() * 50000) + 10000,
            popularDoctors: [
              { doctorId: '1', doctorName: 'Dr. Smith', bookings: Math.floor(Math.random() * 150) + 50 },
              { doctorId: '3', doctorName: 'Dr. Williams', bookings: Math.floor(Math.random() * 100) + 50 }
            ]
          };
          break;
          
        case ReportType.DOCTOR_PERFORMANCE:
          reportData = {
            doctors: [
              {
                doctorId: '1',
                doctorName: 'Dr. Smith',
                totalPatients: Math.floor(Math.random() * 300) + 100,
                avgRating: (Math.random() * 2) + 3,
                completionRate: Math.floor(Math.random() * 30) + 70
              },
              {
                doctorId: '2',
                doctorName: 'Dr. Johnson',
                totalPatients: Math.floor(Math.random() * 300) + 100,
                avgRating: (Math.random() * 2) + 3,
                completionRate: Math.floor(Math.random() * 30) + 70
              }
            ]
          };
          break;
          
        case ReportType.DISPENSARY_REVENUE:
          reportData = {
            totalRevenue: Math.floor(Math.random() * 100000) + 50000,
            revenueByService: [
              { service: 'Consultation', revenue: Math.floor(Math.random() * 50000) + 20000 },
              { service: 'Treatment', revenue: Math.floor(Math.random() * 30000) + 15000 },
              { service: 'Medication', revenue: Math.floor(Math.random() * 20000) + 10000 }
            ],
            revenueByDoctor: [
              { doctorId: '1', doctorName: 'Dr. Smith', revenue: Math.floor(Math.random() * 25000) + 10000 },
              { doctorId: '2', doctorName: 'Dr. Johnson', revenue: Math.floor(Math.random() * 20000) + 8000 }
            ],
            revenueByMonth: [
              { month: 'January', revenue: Math.floor(Math.random() * 15000) + 8000 },
              { month: 'February', revenue: Math.floor(Math.random() * 15000) + 8000 }
            ]
          };
          break;
          
        default:
          reportData = { message: 'No data available for this report type' };
      }
      
      // Create mock report object
      const mockReport: Report = {
        id: Math.random().toString(36).substring(2, 11),
        type,
        title,
        parameters,
        generatedBy,
        dispensaryId,
        startDate: reportStartDate,
        endDate: reportEndDate,
        data: reportData,
        createdAt: now,
        updatedAt: now
      };
      
      return mockReport;
    }
  },

  // Get session report (bookings for a specific doctor, dispensary, and date)
  getSessionReport: async (doctorId: string, dispensaryId: string, date: string) => {
    try {
      const response = await api.get(
        `/reports/session/${doctorId}/${dispensaryId}/${date}`
      );
      
      return response.data;
    } catch (error) {
      console.error('Error fetching session report:', error);
      // Return empty array for now
      return [];
    }
  },

  // Get daily bookings report
  getDailyBookings: async (startDate: string, endDate: string): Promise<DailyBookingSummary> => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      const response = await api.get(
        `/reports/daily-bookings?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching daily bookings:', error);
      throw new Error('Failed to fetch daily bookings report');
    }
  },

  // Get monthly summary report
  getMonthlySummary: async (month: number, year: number): Promise<MonthlySummary> => {
    try {
      const response = await api.get(
        `/reports/monthly-summary?month=${month}&year=${year}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching monthly summary:', error);
      throw new Error('Failed to fetch monthly summary report');
    }
  },

  // Get doctor performance report
  getDoctorPerformance: async (
    doctorId: string,
    startDate: Date,
    endDate: Date
  ): Promise<DoctorPerformance> => {
    try {
      const formattedStartDate = startDate.toISOString().split('T')[0];
      const formattedEndDate = endDate.toISOString().split('T')[0];
      const response = await api.get(
        `/reports/doctor-performance?doctorId=${doctorId}&startDate=${formattedStartDate}&endDate=${formattedEndDate}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching doctor performance:', error);
      throw new Error('Failed to fetch doctor performance report');
    }
  },

  // For daily bookings with params
  getDailyBookingsWithParams: async (params: any) => {
    const search = new URLSearchParams(params).toString();
    const response = await api.get(`/reports/daily-bookings?${search}`);
    return response.data;
  },

  // For advance bookings
  getAdvanceBookings: async (params: any) => {
    const search = new URLSearchParams(params).toString();
    const response = await api.get(`/reports/advance-bookings?${search}`);
    return response.data;
  }
};
