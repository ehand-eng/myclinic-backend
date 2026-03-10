import api from '@/lib/axios';

export type DashboardRange = 'last_week' | 'last_month' | 'all_time';

export interface DashboardStatsParams {
  range?: DashboardRange;
  page?: number;
  limit?: number;
}

export interface DashboardStats {
  totalDispensaries: number;
  totalDoctors: number;
  todayBookings: number;
  weekBookings: number;
  monthBookings: number;
  completedThisMonth: number;
  scheduledToday: number;
  periodBookings?: number;
  bookingsByStatus: Record<string, number>;
  bookingsLast7Days: { date: string; count: number }[];
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
    const query = search.toString();
    const response = await api.get<DashboardStats>(`/dashboard/stats${query ? `?${query}` : ''}`);
    return response.data;
  },
};
