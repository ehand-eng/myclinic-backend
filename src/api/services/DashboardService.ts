import api from '@/lib/axios';

export type DashboardRange = 'today' | 'last_week' | 'last_month';

export interface DashboardStatsParams {
  range?: DashboardRange;
  page?: number;
  limit?: number;
}

export interface DashboardStats {
  totalDispensaries: number;
  totalDoctors: number;
  todayBookings: number;
  periodScheduled: number;
  periodCompleted: number;
  periodBookings: number;
  bookingsByStatus: Record<string, number>;
  dailyStats: { date: string; scheduled: number; completed: number; checked_in?: number }[];
  recentBookings: {
    _id: string;
    transactionId: string;
    patientName: string;
    patientPhone: string;
    bookingDate: string;
    status: string;
    doctorName?: string;
    dispensaryName?: string;
  }[];
  recentBookingsTotal?: number;
  recentBookingsPage?: number;
  recentBookingsLimit?: number;
  bookingsByDispensary: { name: string; count: number }[];
  range?: string;
  dateFrom?: string | null;
  dateTo?: string | null;
}

export const DashboardService = {
  getStats: async (params?: DashboardStatsParams): Promise<DashboardStats> => {
    const search = new URLSearchParams();
    if (params?.range) search.set('range', params.range);
    if (params?.page != null) search.set('page', String(params.page));
    if (params?.limit != null) search.set('limit', String(params.limit));
    
    // Add cache buster to completely avoid stale GET requests
    search.set('_t', Date.now().toString());
    
    const query = search.toString();
    const response = await api.get<DashboardStats>(`/dashboard/stats?${query}`);
    return response.data;
  },
};
