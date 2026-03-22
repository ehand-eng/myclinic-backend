
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ReportService } from '@/api/services/ReportService';
import { Report, ReportType } from '@/api/models';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { format, subDays, subMonths, startOfDay, isAfter, isBefore } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import ReportDetailGenerator from './ReportDetailGenerator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Download, Printer, Loader2, Eye, InboxIcon, BarChart3, ClipboardList, Trash2, Search, X, Filter, CalendarIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

const today = startOfDay(new Date());

/** Return smart default date range for each report type */
const getDefaultDatesForType = (type: ReportType): { start: Date; end: Date } => {
  switch (type) {
    case ReportType.DAILY_BOOKINGS:
      return { start: today, end: today };
    case ReportType.MONTHLY_SUMMARY:
      return { start: subMonths(today, 1), end: today };
    case ReportType.DOCTOR_PERFORMANCE:
      return { start: subDays(today, 30), end: today };
    case ReportType.DISPENSARY_REVENUE:
      return { start: subMonths(today, 1), end: today };
    default:
      return { start: subDays(today, 30), end: today };
  }
};

const REPORT_TYPE_LABELS: Record<string, string> = {
  [ReportType.DAILY_BOOKINGS]: 'Daily Bookings',
  [ReportType.MONTHLY_SUMMARY]: 'Monthly Summary',
  [ReportType.DOCTOR_PERFORMANCE]: 'Doctor Performance',
  [ReportType.DISPENSARY_REVENUE]: 'Dispensary Revenue',
};

const STORAGE_KEY = 'myclinic_report_history';

/** Read persisted reports from localStorage */
const loadPersistedReports = (): Report[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Report[];
  } catch {
    return [];
  }
};

/** Save reports to localStorage */
const persistReports = (reports: Report[]) => {
  try {
    // Keep only the last 50 to avoid bloating storage
    const trimmed = reports.slice(0, 50);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.error('Failed to persist reports:', e);
  }
};

/** Build CSV rows from a report's data and type */
const buildCsvRows = (type: ReportType | string, data: Record<string, any>, report?: { startDate: Date | string; endDate: Date | string }): string[] => {
  const label = REPORT_TYPE_LABELS[type] || type;
  const rows: string[] = [];

  if (report) {
    rows.push(`${label} Report`);
    rows.push(`Date Range,"${format(new Date(report.startDate), 'PPP')} - ${format(new Date(report.endDate), 'PPP')}"`);
    rows.push('');
  }

  switch (type) {
    case ReportType.DAILY_BOOKINGS:
      rows.push(`Total Bookings,${data.totalBookings ?? ''}`);
      rows.push(`Completed,${data.completedBookings ?? ''}`);
      rows.push(`Cancelled,${data.cancelledBookings ?? ''}`);
      rows.push(`No-Show,${data.noShowBookings ?? ''}`);
      if (data.bookingsByDoctor?.length) {
        rows.push('');
        rows.push('Doctor,Bookings');
        data.bookingsByDoctor.forEach((d: any) => rows.push(`"${d.doctorName}",${d.bookings}`));
      }
      break;

    case ReportType.MONTHLY_SUMMARY:
      rows.push(`Total Bookings,${data.totalBookings ?? ''}`);
      rows.push(`Completed,${data.completedBookings ?? ''}`);
      rows.push(`Cancelled,${data.cancelledBookings ?? ''}`);
      rows.push(`Revenue,"Rs ${data.revenue ?? 0}"`);
      if (data.popularDoctors?.length) {
        rows.push('');
        rows.push('Doctor,Bookings');
        data.popularDoctors.forEach((d: any) => rows.push(`"${d.doctorName}",${d.bookings}`));
      }
      break;

    case ReportType.DOCTOR_PERFORMANCE:
      rows.push('Doctor,Total Patients,Avg Rating,Completion Rate');
      data.doctors?.forEach((d: any) =>
        rows.push(`"${d.doctorName}",${d.totalPatients},${d.avgRating?.toFixed(1)},${d.completionRate}%`)
      );
      break;

    case ReportType.DISPENSARY_REVENUE:
      rows.push(`Total Revenue,"Rs ${data.totalRevenue ?? 0}"`);
      if (data.revenueByService?.length) {
        rows.push('');
        rows.push('Service,Revenue');
        data.revenueByService.forEach((s: any) => rows.push(`"${s.service}","Rs ${s.revenue}"`));
      }
      if (data.revenueByDoctor?.length) {
        rows.push('');
        rows.push('Doctor,Revenue');
        data.revenueByDoctor.forEach((d: any) => rows.push(`"${d.doctorName}","Rs ${d.revenue}"`));
      }
      break;

    default:
      rows.push(JSON.stringify(data, null, 2));
  }

  return rows;
};

/** Trigger CSV download from rows */
const downloadCsv = (rows: string[], filename: string) => {
  const csvContent = rows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const ReportGenerator = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('summary');
  const [reportType, setReportType] = useState<ReportType | ''>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [startDate, setStartDate] = useState<Date>(subDays(today, 30));
  const [endDate, setEndDate] = useState<Date>(today);
  const [reportData, setReportData] = useState<any>(null);

  // Report history state
  // localReports: persisted in localStorage (survives refresh)
  // serverReports: fetched from the API
  const [localReports, setLocalReports] = useState<Report[]>(() => loadPersistedReports());
  const [serverReports, setServerReports] = useState<Report[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const fetchReportHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const reports = await ReportService.getAllReports();
      setServerReports(reports);
    } catch (error) {
      console.error('Error fetching report history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchReportHistory();
  }, [fetchReportHistory]);

  // Merge local + server reports, deduplicate by id, sort newest first
  const reportHistory = (() => {
    const byId = new Map<string, Report>();
    // Server reports first, then local overrides (local are more up-to-date)
    for (const r of serverReports) byId.set(r.id, r);
    for (const r of localReports) byId.set(r.id, r);
    return Array.from(byId.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  })();

  // Callback for ReportDetailGenerator to add booking reports to history
  const addReportToHistory = useCallback((report: Report) => {
    setLocalReports(prev => {
      const updated = [report, ...prev];
      persistReports(updated);
      return updated;
    });
  }, []);

  // Clear all history
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const handleClearHistory = () => {
    setLocalReports([]);
    setServerReports([]);
    persistReports([]);
    setClearDialogOpen(false);
    toast({ title: 'Cleared', description: 'Report history has been cleared.' });
  };

  // View report dialog
  const [viewingReport, setViewingReport] = useState<Report | null>(null);

  // History filters
  const [historyCategory, setHistoryCategory] = useState<'all' | 'summary' | 'booking'>('all');
  const [historyTypeFilter, setHistoryTypeFilter] = useState<string>('all');
  const [historySearch, setHistorySearch] = useState('');
  const [historyDateFrom, setHistoryDateFrom] = useState<Date | undefined>(undefined);
  const [historyDateTo, setHistoryDateTo] = useState<Date | undefined>(undefined);

  const isBookingReport = (report: Report) => report.parameters?.reportCategory === 'booking';

  const hasActiveFilters = historyCategory !== 'all' || historyTypeFilter !== 'all' || historySearch.trim() !== '' || !!historyDateFrom || !!historyDateTo;

  const clearAllFilters = () => {
    setHistoryCategory('all');
    setHistoryTypeFilter('all');
    setHistorySearch('');
    setHistoryDateFrom(undefined);
    setHistoryDateTo(undefined);
  };

  // Filtered history
  const filteredHistory = reportHistory.filter(report => {
    // Category filter
    if (historyCategory === 'summary' && isBookingReport(report)) return false;
    if (historyCategory === 'booking' && !isBookingReport(report)) return false;

    // Type filter
    if (historyTypeFilter !== 'all') {
      if (historyTypeFilter === 'booking_daily') {
        if (!isBookingReport(report) || report.parameters?.reportMode !== 'daily') return false;
      } else if (historyTypeFilter === 'booking_monthly') {
        if (!isBookingReport(report) || report.parameters?.reportMode !== 'monthly') return false;
      } else {
        if (report.type !== historyTypeFilter || isBookingReport(report)) return false;
      }
    }

    // Search filter
    if (historySearch.trim()) {
      const q = historySearch.toLowerCase();
      const title = (report.title || '').toLowerCase();
      const doctorName = (report.parameters?.doctorName || '').toLowerCase();
      const dispensaryName = (report.parameters?.dispensaryName || '').toLowerCase();
      const typeLabel = (REPORT_TYPE_LABELS[report.type] || report.type).toLowerCase();
      if (!title.includes(q) && !doctorName.includes(q) && !dispensaryName.includes(q) && !typeLabel.includes(q)) return false;
    }

    // Date range filter (based on createdAt)
    if (historyDateFrom) {
      const created = startOfDay(new Date(report.createdAt));
      if (isBefore(created, startOfDay(historyDateFrom))) return false;
    }
    if (historyDateTo) {
      const created = startOfDay(new Date(report.createdAt));
      if (isAfter(created, startOfDay(historyDateTo))) return false;
    }

    return true;
  });

  const handleViewReport = (report: Report) => {
    setViewingReport(report);
  };

  const handleDownloadReport = (report: Report) => {
    try {
      const data = report.data;
      if (!data || Object.keys(data).length === 0) {
        toast({ title: 'No data', description: 'This report has no data to download.', variant: 'destructive' });
        return;
      }

      const dateStr = format(new Date(report.createdAt), 'yyyy-MM-dd');

      if (isBookingReport(report)) {
        // Build CSV for booking report
        const rows: string[] = [];
        rows.push(`${report.title}`);
        rows.push(`Date Range,"${format(new Date(report.startDate), 'PPP')} - ${format(new Date(report.endDate), 'PPP')}"`);
        rows.push('');
        rows.push(`Total Bookings,${data.total || 0}`);
        rows.push(`Completed,${data.completed || 0}`);
        rows.push(`Cancelled,${data.cancelled || 0}`);
        rows.push(`Total Amount,"Rs ${(data.totalAmount || 0).toLocaleString()}"`);
        rows.push(`Total Commission,"Rs ${(data.totalCommission || 0).toLocaleString()}"`);
        rows.push('');
        rows.push('Date,Time Slot,Reference,Patient Name,Phone,Status,Amount');
        data.bookings?.forEach((b: any) => {
          rows.push([
            format(new Date(b.bookingDate), 'yyyy-MM-dd'),
            b.timeSlot,
            b.bookingReference || b.transactionId || '-',
            `"${b.patientName}"`,
            b.patientPhone,
            b.status,
            b.fees?.totalFee ? `Rs ${b.fees.totalFee}` : '-',
          ].join(','));
        });
        downloadCsv(rows, `booking-report-${dateStr}.csv`);
        toast({ title: 'Downloaded', description: 'Booking report downloaded successfully.' });
      } else {
        const label = REPORT_TYPE_LABELS[report.type] || report.type;
        const rows = buildCsvRows(report.type, data, report);
        downloadCsv(rows, `${report.type}-${dateStr}.csv`);
        toast({ title: 'Downloaded', description: `${label} report downloaded successfully.` });
      }
    } catch (error) {
      console.error('Download error:', error);
      toast({ title: 'Error', description: 'Failed to download report.', variant: 'destructive' });
    }
  };

  const handleReportTypeChange = (type: ReportType) => {
    setReportType(type);
    setReportData(null);
    // Auto-set date range based on report type
    const { start, end } = getDefaultDatesForType(type);
    setStartDate(start);
    setEndDate(end);
  };

  const handleStartDateChange = (date: Date | undefined) => {
    if (!date) return;
    setStartDate(date);
    // If new start date is after end date, push end date to match
    if (isAfter(date, endDate)) {
      setEndDate(date);
    }
  };

  const handleEndDateChange = (date: Date | undefined) => {
    if (!date) return;
    setEndDate(date);
    // If new end date is before start date, pull start date to match
    if (isBefore(date, startDate)) {
      setStartDate(date);
    }
  };

  const handleGenerateReport = async () => {
    if (!reportType) {
      toast({
        title: "Error",
        description: "Please select a report type.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);

    try {
      const userJson = localStorage.getItem('current_user');
      if (!userJson) {
        throw new Error("User not found");
      }
      const currentUser = JSON.parse(userJson);

      const report = await ReportService.generateReport(
        reportType,
        `${reportType.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}`,
        {
          reportType,
          dateRange: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
          }
        },
        currentUser.id,
        undefined,
        startDate,
        endDate
      );

      toast({
        title: "Success",
        description: "Report generated successfully."
      });

      setReportData(report.data);

      // Add the full report to local history and persist to localStorage
      setLocalReports(prev => {
        const updated = [report, ...prev];
        persistReports(updated);
        return updated;
      });

      // Also try to sync with server (in case server persisted it)
      fetchReportHistory();

    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Error",
        description: "Failed to generate report.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const reportTypes = [
    { value: ReportType.DAILY_BOOKINGS, label: 'Daily Bookings' },
    { value: ReportType.MONTHLY_SUMMARY, label: 'Monthly Summary' },
    { value: ReportType.DOCTOR_PERFORMANCE, label: 'Doctor Performance' },
    { value: ReportType.DISPENSARY_REVENUE, label: 'Dispensary Revenue' },
  ];

  const handleExport = () => {
    if (!reportData || !reportType) {
      toast({ title: 'No data', description: 'Generate a report first before exporting.', variant: 'destructive' });
      return;
    }

    try {
      const label = REPORT_TYPE_LABELS[reportType] || reportType;
      const dateStr = format(new Date(), 'yyyy-MM-dd');
      const rows = buildCsvRows(reportType, reportData, { startDate, endDate });
      downloadCsv(rows, `${reportType}-${dateStr}.csv`);
      toast({ title: 'Exported', description: `${label} report exported successfully.` });
    } catch (error) {
      console.error('Export error:', error);
      toast({ title: 'Error', description: 'Failed to export report.', variant: 'destructive' });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const renderReportContent = () => {
    if (!reportData) return null;

    switch (reportType) {
      case ReportType.DAILY_BOOKINGS:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-medium">Daily Bookings Report</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrint}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Total Bookings</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{reportData.totalBookings}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Completed</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-600">{reportData.completedBookings}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Cancelled/No-show</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-red-600">{reportData.cancelledBookings + reportData.noShowBookings}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Bookings by Doctor</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Doctor</TableHead>
                      <TableHead className="text-right">Bookings</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.bookingsByDoctor?.map((item: any) => (
                      <TableRow key={item.doctorId}>
                        <TableCell>{item.doctorName}</TableCell>
                        <TableCell className="text-right">{item.bookings}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        );

      case ReportType.MONTHLY_SUMMARY:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-medium">Monthly Summary Report</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrint}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Total Bookings</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{reportData.totalBookings}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Completed</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-600">{reportData.completedBookings}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Cancelled</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-red-600">{reportData.cancelledBookings}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-blue-600">Rs {reportData.revenue?.toLocaleString()}</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Popular Doctors</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Doctor</TableHead>
                        <TableHead className="text-right">Bookings</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.popularDoctors?.map((item: any) => (
                        <TableRow key={item.doctorId}>
                          <TableCell>{item.doctorName}</TableCell>
                          <TableCell className="text-right">{item.bookings}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case ReportType.DOCTOR_PERFORMANCE:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-medium">Doctor Performance Report</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrint}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Doctor Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Doctor</TableHead>
                      <TableHead className="text-right">Total Patients</TableHead>
                      <TableHead className="text-right">Avg. Rating</TableHead>
                      <TableHead className="text-right">Completion Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.doctors?.map((doctor: any) => (
                      <TableRow key={doctor.doctorId}>
                        <TableCell>{doctor.doctorName}</TableCell>
                        <TableCell className="text-right">{doctor.totalPatients}</TableCell>
                        <TableCell className="text-right">{doctor.avgRating.toFixed(1)}/5.0</TableCell>
                        <TableCell className="text-right">{doctor.completionRate}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        );

      case ReportType.DISPENSARY_REVENUE:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-medium">Dispensary Revenue Report</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrint}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-green-600">Rs {reportData.totalRevenue?.toLocaleString()}</p>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue by Service</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Service</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.revenueByService?.map((item: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{item.service}</TableCell>
                          <TableCell className="text-right">Rs {item.revenue.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Revenue by Doctor</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Doctor</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.revenueByDoctor?.map((item: any) => (
                        <TableRow key={item.doctorId}>
                          <TableCell>{item.doctorName}</TableCell>
                          <TableCell className="text-right">Rs {item.revenue.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      default:
        return <p>Select a report type and generate a report to view data.</p>;
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="summary">Summary Reports</TabsTrigger>
          <TabsTrigger value="session">Booking Reports</TabsTrigger>
          <TabsTrigger value="history">Report History</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Generate Summary Report</CardTitle>
              <CardDescription>
                Select parameters to generate a customized report
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="reportType">Report Type</Label>
                <Select value={reportType} onValueChange={(value) => handleReportTypeChange(value as ReportType)}>
                  <SelectTrigger className="w-full" id="reportType">
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    {reportTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Date Range</Label>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Label htmlFor="startDate" className="text-xs mb-1 block">Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left"
                          id="startDate"
                        >
                          {format(startDate, "PPP")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={handleStartDateChange}
                          disabled={(date) => isAfter(date, today)}
                          initialFocus
                          className="rounded-xl border border-medicalGreen-200 shadow-lg medical-card"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="flex-1">
                    <Label htmlFor="endDate" className="text-xs mb-1 block">End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left"
                          id="endDate"
                        >
                          {format(endDate, "PPP")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={handleEndDateChange}
                          disabled={(date) => isAfter(date, today)}
                          initialFocus
                          className="rounded-xl border border-medicalGreen-200 shadow-lg medical-card"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleGenerateReport}
                disabled={!reportType || isGenerating}
                className="w-full"
              >
                {isGenerating ? 'Generating...' : 'Generate Report'}
              </Button>
            </CardFooter>
          </Card>

          {reportData && (
            <Card className="p-6">
              {renderReportContent()}
            </Card>
          )}
        </TabsContent>

        <TabsContent value="session" className="mt-4">
          <ReportDetailGenerator onReportGenerated={addReportToHistory} />
        </TabsContent>

        <TabsContent value="history" className="mt-4 space-y-4">
          {isLoadingHistory ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading report history...</span>
            </div>
          ) : reportHistory.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <InboxIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p className="text-muted-foreground font-medium">No reports generated yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Generate a report from the Summary Reports or Booking Reports tabs to see it here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Report History</h3>
                  <p className="text-sm text-muted-foreground">{reportHistory.length} report{reportHistory.length !== 1 ? 's' : ''} total</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setClearDialogOpen(true)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                  <Trash2 className="h-4 w-4 mr-1" /> Clear History
                </Button>
              </div>

              {/* Filters */}
              <Card className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search reports..."
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      className="pl-9 h-9"
                    />
                    {historySearch && (
                      <button onClick={() => setHistorySearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Category filter */}
                  <Select value={historyCategory} onValueChange={(v) => { setHistoryCategory(v as any); setHistoryTypeFilter('all'); }}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="summary">Summary Reports</SelectItem>
                      <SelectItem value="booking">Booking Reports</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Type filter */}
                  <Select value={historyTypeFilter} onValueChange={setHistoryTypeFilter}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {(historyCategory === 'all' || historyCategory === 'summary') && (
                        <>
                          <SelectItem value={ReportType.DAILY_BOOKINGS}>Daily Bookings</SelectItem>
                          <SelectItem value={ReportType.MONTHLY_SUMMARY}>Monthly Summary</SelectItem>
                          <SelectItem value={ReportType.DOCTOR_PERFORMANCE}>Doctor Performance</SelectItem>
                          <SelectItem value={ReportType.DISPENSARY_REVENUE}>Dispensary Revenue</SelectItem>
                        </>
                      )}
                      {(historyCategory === 'all' || historyCategory === 'booking') && (
                        <>
                          <SelectItem value="booking_daily">Booking — Daily</SelectItem>
                          <SelectItem value="booking_monthly">Booking — Monthly</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>

                  {/* Date generated range */}
                  <div className="flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="h-9 flex-1 justify-start text-left font-normal text-sm px-3">
                          <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                          {historyDateFrom ? format(historyDateFrom, "MMM dd") : "From"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={historyDateFrom}
                          onSelect={(d) => { setHistoryDateFrom(d || undefined); if (d && historyDateTo && isAfter(d, historyDateTo)) setHistoryDateTo(d); }}
                          disabled={(date) => isAfter(date, today)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="h-9 flex-1 justify-start text-left font-normal text-sm px-3">
                          <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                          {historyDateTo ? format(historyDateTo, "MMM dd") : "To"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={historyDateTo}
                          onSelect={(d) => { setHistoryDateTo(d || undefined); if (d && historyDateFrom && isBefore(d, historyDateFrom)) setHistoryDateFrom(d); }}
                          disabled={(date) => isAfter(date, today)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Active filters summary */}
                {hasActiveFilters && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                    <span className="text-xs text-muted-foreground">Showing {filteredHistory.length} of {reportHistory.length}</span>
                    <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-7 text-xs px-2 ml-auto">
                      <X className="h-3 w-3 mr-1" /> Clear filters
                    </Button>
                  </div>
                )}
              </Card>

              {/* Filtered results */}
              {filteredHistory.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-10">
                    <Search className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                    <p className="text-muted-foreground font-medium">No reports match your filters</p>
                    <Button variant="link" size="sm" onClick={clearAllFilters} className="mt-1">Clear all filters</Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Summary Reports Group */}
                  {(() => {
                    const summaryReports = filteredHistory.filter(r => !isBookingReport(r));
                    if (summaryReports.length === 0) return null;
                    return (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-blue-600" />
                            Summary Reports
                            <Badge variant="secondary" className="ml-1">{summaryReports.length}</Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Generated</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Date Range</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {summaryReports.map((report) => (
                                <TableRow key={report.id}>
                                  <TableCell className="whitespace-nowrap">{format(new Date(report.createdAt), "MMM dd, yyyy · h:mm a")}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                      {REPORT_TYPE_LABELS[report.type] || report.type}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-sm text-muted-foreground">
                                    {format(new Date(report.startDate), "MMM dd")} – {format(new Date(report.endDate), "MMM dd, yyyy")}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button size="sm" variant="ghost" onClick={() => handleViewReport(report)}>
                                      <Eye className="h-4 w-4 mr-1" /> View
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => handleDownloadReport(report)}>
                                      <Download className="h-4 w-4 mr-1" /> Download
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    );
                  })()}

                  {/* Booking Reports Group */}
                  {(() => {
                    const bookingReports = filteredHistory.filter(r => isBookingReport(r));
                    if (bookingReports.length === 0) return null;
                    return (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <ClipboardList className="h-5 w-5 text-green-600" />
                            Booking Reports
                            <Badge variant="secondary" className="ml-1">{bookingReports.length}</Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Generated</TableHead>
                                <TableHead>Details</TableHead>
                                <TableHead>Date Range</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {bookingReports.map((report) => (
                                <TableRow key={report.id}>
                                  <TableCell className="whitespace-nowrap">{format(new Date(report.createdAt), "MMM dd, yyyy · h:mm a")}</TableCell>
                                  <TableCell>
                                    <div>
                                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 mb-1">
                                        {report.parameters?.reportMode === 'daily' ? 'Daily' : 'Monthly'}
                                      </Badge>
                                      <p className="text-sm text-muted-foreground mt-1">
                                        {report.parameters?.doctorName || 'Doctor'} · {report.parameters?.dispensaryName || 'Dispensary'}
                                      </p>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-sm text-muted-foreground">
                                    {format(new Date(report.startDate), "MMM dd")} – {format(new Date(report.endDate), "MMM dd, yyyy")}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button size="sm" variant="ghost" onClick={() => handleViewReport(report)}>
                                      <Eye className="h-4 w-4 mr-1" /> View
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => handleDownloadReport(report)}>
                                      <Download className="h-4 w-4 mr-1" /> Download
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    );
                  })()}
                </>
              )}
            </>
          )}

          {/* Clear History Confirmation */}
          <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear Report History</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to clear all report history? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearHistory} className="bg-red-600 hover:bg-red-700">
                  Clear All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* View Report Dialog */}
          <Dialog open={!!viewingReport} onOpenChange={(open) => { if (!open) setViewingReport(null); }}>
            <DialogContent className="max-w-3xl max-h-[90vh] p-0">
              {viewingReport && (
                <>
                  <DialogHeader className="px-6 pt-6 pb-4">
                    <div className="flex items-center gap-3">
                      {isBookingReport(viewingReport)
                        ? <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center"><ClipboardList className="h-5 w-5 text-green-600" /></div>
                        : <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center"><BarChart3 className="h-5 w-5 text-blue-600" /></div>
                      }
                      <div>
                        <DialogTitle className="text-lg">
                          {isBookingReport(viewingReport)
                            ? viewingReport.title
                            : (REPORT_TYPE_LABELS[viewingReport.type] || viewingReport.type) + ' Report'
                          }
                        </DialogTitle>
                        <DialogDescription className="flex items-center gap-2 mt-1">
                          <span>{format(new Date(viewingReport.startDate), "MMM dd, yyyy")} – {format(new Date(viewingReport.endDate), "MMM dd, yyyy")}</span>
                          <span className="text-xs">·</span>
                          <span className="text-xs">Generated {format(new Date(viewingReport.createdAt), "MMM dd, yyyy 'at' h:mm a")}</span>
                        </DialogDescription>
                      </div>
                    </div>
                  </DialogHeader>
                  <Separator />
                  <ScrollArea className="px-6 py-4 max-h-[60vh]">
                    {isBookingReport(viewingReport) ? (
                      /* -------- Booking Report Content -------- */
                      <div className="space-y-5">
                        {/* Summary cards */}
                        <div className="grid grid-cols-3 gap-3">
                          <div className="rounded-lg border bg-blue-50 p-3">
                            <p className="text-xs font-medium text-blue-600">Total Bookings</p>
                            <p className="text-2xl font-bold text-blue-900 mt-1">{viewingReport.data.total || 0}</p>
                            <p className="text-xs text-blue-600 mt-0.5">{viewingReport.data.completed || 0} Completed · {viewingReport.data.cancelled || 0} Cancelled</p>
                          </div>
                          <div className="rounded-lg border bg-green-50 p-3">
                            <p className="text-xs font-medium text-green-600">Total Amount</p>
                            <p className="text-2xl font-bold text-green-900 mt-1">Rs {(viewingReport.data.totalAmount || 0).toLocaleString()}</p>
                          </div>
                          <div className="rounded-lg border bg-purple-50 p-3">
                            <p className="text-xs font-medium text-purple-600">Commission</p>
                            <p className="text-2xl font-bold text-purple-900 mt-1">Rs {(viewingReport.data.totalCommission || 0).toLocaleString()}</p>
                          </div>
                        </div>

                        {/* Info row */}
                        {viewingReport.parameters?.doctorName && (
                          <div className="flex gap-4 text-sm">
                            <div><span className="text-muted-foreground">Doctor:</span> <span className="font-medium">{viewingReport.parameters.doctorName}</span></div>
                            <div><span className="text-muted-foreground">Dispensary:</span> <span className="font-medium">{viewingReport.parameters.dispensaryName}</span></div>
                            <div><span className="text-muted-foreground">Mode:</span> <Badge variant="outline" className="ml-1 text-xs">{viewingReport.parameters.reportMode === 'daily' ? 'Daily' : 'Monthly'}</Badge></div>
                          </div>
                        )}

                        {/* Bookings table */}
                        {viewingReport.data.bookings?.length > 0 && (
                          <div className="border rounded-md">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Date</TableHead>
                                  <TableHead>Time</TableHead>
                                  <TableHead>Patient</TableHead>
                                  <TableHead>Phone</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {viewingReport.data.bookings.map((b: any, i: number) => (
                                  <TableRow key={b.id || i}>
                                    <TableCell className="whitespace-nowrap text-sm">{format(new Date(b.bookingDate), "MMM dd")}</TableCell>
                                    <TableCell className="text-sm">{b.timeSlot}</TableCell>
                                    <TableCell className="text-sm font-medium">{b.patientName}</TableCell>
                                    <TableCell className="text-sm">{b.patientPhone}</TableCell>
                                    <TableCell>
                                      <Badge variant="outline" className={
                                        b.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
                                        b.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                                        b.status === 'checked_in' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                        b.status === 'no_show' ? 'bg-gray-50 text-gray-700 border-gray-200' :
                                        'bg-blue-50 text-blue-700 border-blue-200'
                                      }>
                                        {b.status?.replace('_', ' ')}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-right text-sm font-medium">{b.fees?.totalFee ? `Rs ${b.fees.totalFee}` : '-'}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                        {(!viewingReport.data.bookings || viewingReport.data.bookings.length === 0) && (
                          <p className="text-center text-muted-foreground py-4">No bookings in this report.</p>
                        )}
                      </div>
                    ) : viewingReport.type === ReportType.DAILY_BOOKINGS ? (
                      /* -------- Daily Bookings Summary -------- */
                      <div className="space-y-5">
                        <div className="grid grid-cols-3 gap-3">
                          <div className="rounded-lg border p-3">
                            <p className="text-xs font-medium text-muted-foreground">Total Bookings</p>
                            <p className="text-2xl font-bold mt-1">{viewingReport.data.totalBookings ?? 0}</p>
                          </div>
                          <div className="rounded-lg border bg-green-50 p-3">
                            <p className="text-xs font-medium text-green-600">Completed</p>
                            <p className="text-2xl font-bold text-green-700 mt-1">{viewingReport.data.completedBookings ?? 0}</p>
                          </div>
                          <div className="rounded-lg border bg-red-50 p-3">
                            <p className="text-xs font-medium text-red-600">Cancelled / No-show</p>
                            <p className="text-2xl font-bold text-red-700 mt-1">{(viewingReport.data.cancelledBookings ?? 0) + (viewingReport.data.noShowBookings ?? 0)}</p>
                          </div>
                        </div>
                        {viewingReport.data.bookingsByDoctor?.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold mb-2">Bookings by Doctor</h4>
                            <div className="border rounded-md">
                              <Table>
                                <TableHeader><TableRow><TableHead>Doctor</TableHead><TableHead className="text-right">Bookings</TableHead></TableRow></TableHeader>
                                <TableBody>
                                  {viewingReport.data.bookingsByDoctor.map((d: any) => (
                                    <TableRow key={d.doctorId}><TableCell>{d.doctorName}</TableCell><TableCell className="text-right font-medium">{d.bookings}</TableCell></TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : viewingReport.type === ReportType.MONTHLY_SUMMARY ? (
                      /* -------- Monthly Summary -------- */
                      <div className="space-y-5">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="rounded-lg border p-3">
                            <p className="text-xs font-medium text-muted-foreground">Total Bookings</p>
                            <p className="text-2xl font-bold mt-1">{viewingReport.data.totalBookings ?? 0}</p>
                          </div>
                          <div className="rounded-lg border bg-green-50 p-3">
                            <p className="text-xs font-medium text-green-600">Completed</p>
                            <p className="text-2xl font-bold text-green-700 mt-1">{viewingReport.data.completedBookings ?? 0}</p>
                          </div>
                          <div className="rounded-lg border bg-red-50 p-3">
                            <p className="text-xs font-medium text-red-600">Cancelled</p>
                            <p className="text-2xl font-bold text-red-700 mt-1">{viewingReport.data.cancelledBookings ?? 0}</p>
                          </div>
                          <div className="rounded-lg border bg-blue-50 p-3">
                            <p className="text-xs font-medium text-blue-600">Revenue</p>
                            <p className="text-2xl font-bold text-blue-700 mt-1">Rs {(viewingReport.data.revenue ?? 0).toLocaleString()}</p>
                          </div>
                        </div>
                        {viewingReport.data.popularDoctors?.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold mb-2">Popular Doctors</h4>
                            <div className="border rounded-md">
                              <Table>
                                <TableHeader><TableRow><TableHead>Doctor</TableHead><TableHead className="text-right">Bookings</TableHead></TableRow></TableHeader>
                                <TableBody>
                                  {viewingReport.data.popularDoctors.map((d: any) => (
                                    <TableRow key={d.doctorId}><TableCell>{d.doctorName}</TableCell><TableCell className="text-right font-medium">{d.bookings}</TableCell></TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : viewingReport.type === ReportType.DOCTOR_PERFORMANCE ? (
                      /* -------- Doctor Performance -------- */
                      <div className="space-y-5">
                        {viewingReport.data.doctors?.length > 0 && (
                          <div className="border rounded-md">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Doctor</TableHead>
                                  <TableHead className="text-right">Total Patients</TableHead>
                                  <TableHead className="text-right">Avg. Rating</TableHead>
                                  <TableHead className="text-right">Completion Rate</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {viewingReport.data.doctors.map((d: any) => (
                                  <TableRow key={d.doctorId}>
                                    <TableCell className="font-medium">{d.doctorName}</TableCell>
                                    <TableCell className="text-right">{d.totalPatients}</TableCell>
                                    <TableCell className="text-right">{d.avgRating?.toFixed(1)}/5.0</TableCell>
                                    <TableCell className="text-right">{d.completionRate}%</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </div>
                    ) : viewingReport.type === ReportType.DISPENSARY_REVENUE ? (
                      /* -------- Dispensary Revenue -------- */
                      <div className="space-y-5">
                        <div className="rounded-lg border bg-green-50 p-4">
                          <p className="text-xs font-medium text-green-600">Total Revenue</p>
                          <p className="text-3xl font-bold text-green-800 mt-1">Rs {(viewingReport.data.totalRevenue ?? 0).toLocaleString()}</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {viewingReport.data.revenueByService?.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold mb-2">Revenue by Service</h4>
                              <div className="border rounded-md">
                                <Table>
                                  <TableHeader><TableRow><TableHead>Service</TableHead><TableHead className="text-right">Revenue</TableHead></TableRow></TableHeader>
                                  <TableBody>
                                    {viewingReport.data.revenueByService.map((s: any, i: number) => (
                                      <TableRow key={i}><TableCell>{s.service}</TableCell><TableCell className="text-right font-medium">Rs {s.revenue?.toLocaleString()}</TableCell></TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </div>
                          )}
                          {viewingReport.data.revenueByDoctor?.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold mb-2">Revenue by Doctor</h4>
                              <div className="border rounded-md">
                                <Table>
                                  <TableHeader><TableRow><TableHead>Doctor</TableHead><TableHead className="text-right">Revenue</TableHead></TableRow></TableHeader>
                                  <TableBody>
                                    {viewingReport.data.revenueByDoctor.map((d: any) => (
                                      <TableRow key={d.doctorId}><TableCell>{d.doctorName}</TableCell><TableCell className="text-right font-medium">Rs {d.revenue?.toLocaleString()}</TableCell></TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-6">No preview available for this report type.</p>
                    )}
                  </ScrollArea>
                  <Separator />
                  <DialogFooter className="px-6 py-4">
                    <Button variant="outline" size="sm" onClick={() => { if (viewingReport) handleDownloadReport(viewingReport); }}>
                      <Download className="h-4 w-4 mr-2" /> Download CSV
                    </Button>
                    <DialogClose asChild>
                      <Button variant="default" size="sm">Close</Button>
                    </DialogClose>
                  </DialogFooter>
                </>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportGenerator;
