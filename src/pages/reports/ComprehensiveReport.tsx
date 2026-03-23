import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, Download, FileText, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminHeader from '@/components/AdminHeader';
import AdminFooter from '@/components/AdminFooter';
import ReportFilters, { FilterState, getDefaultDates } from '@/components/reports/ReportFilters';
import ReportSummaryCards from '@/components/reports/ReportSummaryCards';
import ReportCharts from '@/components/reports/ReportCharts';
import ReportBookingsTable from '@/components/reports/ReportBookingsTable';
import ReportRevenueTable from '@/components/reports/ReportRevenueTable';
import { ReportService, ComprehensiveReportResponse } from '@/api/services/ReportService';
import {
  exportComprehensiveReportToPDF,
  exportBookingsReportToPDF,
  exportRevenueReportToPDF,
  type ExportOptions,
} from '@/lib/reportPdfExport';

const ComprehensiveReport: React.FC = () => {
  const defaultDates = getDefaultDates('daily');
  const [filters, setFilters] = useState<FilterState>({
    period: 'daily',
    startDate: defaultDates.startDate,
    endDate: defaultDates.endDate,
    dispensaryId: 'all',
    doctorId: 'all',
    status: 'all',
  });
  const [data, setData] = useState<ComprehensiveReportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('bookings');

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: any = {
        period: filters.period,
        startDate: filters.startDate,
        endDate: filters.endDate,
      };
      if (filters.dispensaryId && filters.dispensaryId !== 'all') params.dispensaryId = filters.dispensaryId;
      if (filters.doctorId && filters.doctorId !== 'all') params.doctorId = filters.doctorId;
      if (filters.status && filters.status !== 'all') params.status = filters.status;

      const result = await ReportService.getComprehensiveReport(params);
      setData(result);
    } catch (err: any) {
      console.error('Report fetch error:', err);
      setError(err?.response?.data?.message || 'Failed to load report data');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const getExportOptions = (): ExportOptions => ({
    period: filters.period,
    dateRange: data?.dateRange || { startDate: filters.startDate, endDate: filters.endDate },
  });

  const hasData = data && data.summary.total > 0;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <AdminHeader />
      <main className="flex-1 container mx-auto px-4 py-6 space-y-6">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
            <p className="text-sm text-muted-foreground">Comprehensive booking and revenue analytics</p>
          </div>
          <Button
            onClick={() => data && exportComprehensiveReportToPDF(data, getExportOptions())}
            disabled={!hasData}
            variant="outline"
          >
            <Download className="h-4 w-4 mr-2" />
            Export All
          </Button>
        </div>

        {/* Filters */}
        <ReportFilters filters={filters} onFilterChange={setFilters} />

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-500">{error}</p>
            <Button variant="outline" className="mt-4" onClick={fetchReport}>Retry</Button>
          </div>
        ) : data ? (
          <div className="space-y-6">
            <ReportSummaryCards data={data} />
            <ReportCharts data={data} />

            {/* Tabbed section */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="flex items-center justify-between">
                <TabsList>
                  <TabsTrigger value="bookings">
                    <FileText className="h-4 w-4 mr-1.5" />
                    Booking Details
                  </TabsTrigger>
                  <TabsTrigger value="revenue">
                    <DollarSign className="h-4 w-4 mr-1.5" />
                    Revenue Summary
                  </TabsTrigger>
                </TabsList>

                {/* Per-tab export button */}
                {hasData && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (!data) return;
                      const opts = getExportOptions();
                      if (activeTab === 'bookings') {
                        exportBookingsReportToPDF(data, opts);
                      } else {
                        exportRevenueReportToPDF(data, opts);
                      }
                    }}
                  >
                    <Download className="h-4 w-4 mr-1.5" />
                    Export {activeTab === 'bookings' ? 'Bookings' : 'Revenue'} PDF
                  </Button>
                )}
              </div>

              <TabsContent value="bookings" className="mt-4">
                <ReportBookingsTable bookings={data.bookings} />
              </TabsContent>
              <TabsContent value="revenue" className="mt-4">
                <ReportRevenueTable topDoctors={data.topDoctors} revenue={data.revenue} />
              </TabsContent>
            </Tabs>
          </div>
        ) : null}
      </main>
      <AdminFooter />
    </div>
  );
};

export default ComprehensiveReport;
