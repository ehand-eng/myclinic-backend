
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, addMonths } from 'date-fns';
import { DoctorService, DispensaryService } from '@/api/services';
import { ReportService } from '@/api/services/ReportService';
import { Doctor, Dispensary } from '@/api/models';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Printer, Download, Calendar as CalendarIcon, Filter, DollarSign } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { isSuperAdmin, isDispensaryAdmin, isDispensaryStaff } from '@/lib/roleUtils';
import { cn } from '@/lib/utils';
import { ScrollArea } from "@/components/ui/scroll-area";

type ReportMode = 'daily' | 'monthly';

const ReportDetailGenerator = () => {
  const { toast } = useToast();

  // State for report configuration
  const [reportMode, setReportMode] = useState<ReportMode>('daily');
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());

  // Selection state
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [selectedDispensary, setSelectedDispensary] = useState<string>('');

  // Data state
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [dispensaries, setDispensaries] = useState<Dispensary[]>([]);
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // User role state
  const [userRole, setUserRole] = useState<string>('');
  const [isSuperUser, setIsSuperUser] = useState(false);
  const [isDispensaryUser, setIsDispensaryUser] = useState(false);
  const [userDispensaryIds, setUserDispensaryIds] = useState<string[]>([]);

  // Initialize user role and data
  useEffect(() => {
    const initializeUser = async () => {
      try {
        const userStr = localStorage.getItem('current_user');
        if (!userStr) return;

        const user = JSON.parse(userStr);
        setUserRole(user.role);

        const superAdmin = isSuperAdmin(user.role);
        const dispensaryAdmin = isDispensaryAdmin(user.role);
        const dispensaryStaff = isDispensaryStaff(user.role);

        setIsSuperUser(superAdmin);
        setIsDispensaryUser(dispensaryAdmin || dispensaryStaff);

        // Extract dispensary IDs for dispensary users
        if (user.dispensaryIds && user.dispensaryIds.length > 0) {
          // Handle both array of strings or array of objects
          const ids = user.dispensaryIds.map((d: any) => typeof d === 'string' ? d : d._id || d.id);
          setUserDispensaryIds(ids);

          // Pre-select dispensary for dispensary users
          if ((dispensaryAdmin || dispensaryStaff) && ids.length > 0) {
            // Fetch details for ALL assigned dispensaries
            const validDispensaries: Dispensary[] = [];

            await Promise.all(ids.map(async (id: string) => {
              try {
                const dispensary = await DispensaryService.getDispensaryById(id);
                if (dispensary) validDispensaries.push(dispensary);
              } catch (e) {
                console.error(`Failed to fetch dispensary ${id}`, e);
              }
            }));

            setDispensaries(validDispensaries);

            // If only one, select it automatically
            if (validDispensaries.length === 1) {
              setSelectedDispensary(validDispensaries[0].id);
              // Load doctors for this dispensary immediately
              loadDoctorsForDispensary(validDispensaries[0].id);
            }
          }
        }

        // For super admin, load all doctors initially
        if (superAdmin) {
          const allDoctors = await DoctorService.getAllDoctors();
          setDoctors(allDoctors);
        }

      } catch (error) {
        console.error('Error initializing user:', error);
      }
    };

    initializeUser();
  }, []);

  // Helpers to load data relationships
  const loadDoctorsForDispensary = async (dispensaryId: string) => {
    try {
      setLoading(true);
      const docs = await DoctorService.getDoctorsByDispensaryId(dispensaryId);
      setDoctors(docs);
    } catch (error) {
      console.error('Error loading doctors:', error);
      toast({
        title: 'Error',
        description: 'Failed to load doctors for the selected dispensary',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadDispensariesForDoctor = async (doctorId: string) => {
    if (!isSuperUser) return; // Dispensary users are locked to their own dispensary list

    try {
      setLoading(true);
      const disps = await DispensaryService.getDispensariesByDoctorId(doctorId);
      setDispensaries(disps);

      // If currently selected dispensary is not in the new list, reset it
      if (selectedDispensary && !disps.find(d => d.id === selectedDispensary)) {
        setSelectedDispensary('');
      }
    } catch (error) {
      console.error('Error loading dispensaries:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dispensaries for the selected doctor',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Effect to load doctors when dispensary selection changes
  // This covers both initial load (if set) and user changes
  useEffect(() => {
    if (selectedDispensary) {
      // If super user (selecting doctor first) -> don't reload doctors based on dispensary
      // But wait, if super user selects dispensary first?
      // Current logic: Super Admin -> Select Doctor -> Load Dispensaries. 
      // If they change dispensary, we keep the doctor.

      // However, for Dispensary Users (who select Dispensary first), we MUST load doctors.
      if (isDispensaryUser) {
        loadDoctorsForDispensary(selectedDispensary);
      }
    }
  }, [selectedDispensary, isDispensaryUser]);

  // Handlers for selection changes
  const handleDoctorChange = (doctorId: string) => {
    setSelectedDoctor(doctorId);
    setReportData(null); // Clear previous report

    if (isSuperUser) {
      loadDispensariesForDoctor(doctorId);
    }
  };

  const handleDispensaryChange = (dispensaryId: string) => {
    setSelectedDispensary(dispensaryId);
    setReportData(null);

    // For super admins, we might want to reload doctors if they selected dispensary first?
    // But requirement says: Super Admin -> Select Doctor -> Load Dispensaries.
    // So usually flow is Doctor -> Dispensary.
    // However, if they change dispensary, we keep the doctor.
  };

  const handleGenerateReport = async () => {
    if (!selectedDoctor) {
      toast({
        title: 'Missing Selection',
        description: 'Please select a doctor to generate the report',
        variant: 'default',
      });
      return;
    }

    if (!selectedDispensary) {
      toast({
        title: 'Missing Selection',
        description: 'Please select a dispensary to generate the report',
        variant: 'default',
      });
      return;
    }

    if (reportMode === 'daily' && !startDate) {
      toast({ title: 'Missing Date', description: 'Please select a date', variant: 'destructive' });
      return;
    }

    if (reportMode === 'monthly' && (!startDate || !endDate)) {
      toast({ title: 'Missing Dates', description: 'Please select start and end dates', variant: 'destructive' });
      return;
    }

    setLoading(true);
    setReportData(null);

    try {
      let data;
      if (reportMode === 'daily') {
        // Use daily endpoint
        const formattedDate = format(startDate!, 'yyyy-MM-dd');
        data = await ReportService.getDailyBookingsWithParams({
          date: formattedDate,
          dispensaryId: selectedDispensary,
          doctorId: selectedDoctor
        });
      } else {
        // Use advance/monthly endpoint
        const formattedStart = format(startDate!, 'yyyy-MM-dd');
        const formattedEnd = format(endDate!, 'yyyy-MM-dd');
        data = await ReportService.getAdvanceBookings({
          startDate: formattedStart,
          endDate: formattedEnd,
          dispensaryId: selectedDispensary,
          doctorId: selectedDoctor
        });
      }

      setReportData(data);
      if (data.bookings && data.bookings.length === 0) {
        toast({ title: 'No Data', description: 'No bookings found for the selected criteria.' });
      } else {
        toast({ title: 'Report Generated', description: `Found ${data.bookings.length} records.` });
      }
    } catch (error: any) {
      console.error('Error generating report:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to generate report',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    toast({ title: "Functionality Coming Soon", description: "Export to CSV/PDF will be available in future updates." });
  };

  // Find names for display
  const getDoctorName = () => doctors.find(d => d.id === selectedDoctor)?.name || 'Unknown Doctor';
  const getDispensaryName = () => dispensaries.find(d => d.id === selectedDispensary)?.name || 'Unknown Dispensary';

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Booking Reports</span>
          <div className="flex bg-muted p-1 rounded-lg text-sm">
            <button
              className={cn(
                "px-3 py-1 rounded-md transition-all",
                reportMode === 'daily' ? "bg-white shadow-sm text-primary font-medium" : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => {
                setReportMode('daily');
                setReportData(null);
                setEndDate(undefined); // Reset end date for daily
              }}
            >
              Daily
            </button>
            <button
              className={cn(
                "px-3 py-1 rounded-md transition-all",
                reportMode === 'monthly' ? "bg-white shadow-sm text-primary font-medium" : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => {
                setReportMode('monthly');
                setReportData(null);
                // Default end date to 1 month from start if not set? Or just keep current
                if (!endDate) setEndDate(addMonths(new Date(), 1));
              }}
            >
              Monthly
            </button>
          </div>
        </CardTitle>
        <CardDescription>
          Generate {reportMode} booking reports and financial summaries
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* Filters Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg border">

          {/* Doctor Selection */}
          <div className="space-y-2">
            <Label htmlFor="doctor-select">Doctor</Label>
            <Select
              value={selectedDoctor}
              onValueChange={handleDoctorChange}
              disabled={loading}
            >
              <SelectTrigger id="doctor-select" className="bg-white">
                <SelectValue placeholder="Select Doctor" />
              </SelectTrigger>
              <SelectContent>
                {doctors.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground center">No doctors available</div>
                ) : (
                  doctors.map((doc) => (
                    <SelectItem key={doc.id} value={doc.id}>{doc.name}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Dispensary Selection */}
          <div className="space-y-2">
            <Label htmlFor="dispensary-select">Dispensary</Label>
            {isDispensaryUser ? (
              // Logic for dispensary users: Dropdown if multiple, Read-only if single
              dispensaries.length > 1 ? (
                <Select
                  value={selectedDispensary}
                  onValueChange={handleDispensaryChange}
                  disabled={loading}
                >
                  <SelectTrigger id="dispensary-select" className="bg-white">
                    <SelectValue placeholder="Select Dispensary" />
                  </SelectTrigger>
                  <SelectContent>
                    {dispensaries.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">No assigned dispensaries</div>
                    ) : (
                      dispensaries.map((disp) => (
                        <SelectItem key={disp.id} value={disp.id}>{disp.name}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              ) : (
                <div className="h-10 px-3 py-2 border rounded-md bg-muted text-sm text-muted-foreground flex items-center">
                  {dispensaries[0]?.name || "Loading..."}
                </div>
              )
            ) : (
              // Dropdown for Super Admin
              <Select
                value={selectedDispensary}
                onValueChange={handleDispensaryChange}
                disabled={loading || !selectedDoctor} // Disable if no doctor selected yet
              >
                <SelectTrigger id="dispensary-select" className="bg-white">
                  <SelectValue placeholder={!selectedDoctor ? "Select doctor first" : "Select Dispensary"} />
                </SelectTrigger>
                <SelectContent>
                  {dispensaries.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">No dispensaries found</div>
                  ) : (
                    dispensaries.map((disp) => (
                      <SelectItem key={disp.id} value={disp.id}>{disp.name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Date Picker (Start) */}
          <div className="space-y-2">
            <Label>
              {reportMode === 'daily' ? 'Booking Date' : 'Start Date'}
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal bg-white",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                  className="rounded-md border shadow-md"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* End Date (Monthly only) */}
          {reportMode === 'monthly' && (
            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal bg-white",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    className="rounded-md border shadow-md"
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          <div className={cn("flex items-end", reportMode === 'monthly' ? "col-span-full md:col-start-4" : "")}>
            <Button
              className="w-full bg-medical-600 hover:bg-medical-700"
              onClick={handleGenerateReport}
              disabled={loading || !selectedDoctor || !selectedDispensary || !startDate || (reportMode === 'monthly' && !endDate)}
            >
              {loading ? "Generating..." : "Generate Report"}
            </Button>
          </div>
        </div>

        {/* Report Results */}
        {reportData && (
          <div className="space-y-6 animate-in fade-in-50">
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <h3 className="text-lg font-semibold text-medical-800">
                  {reportMode === 'daily' ? 'Daily Report' : 'Period Report'}
                </h3>
                <p className="text-sm text-gray-500">
                  {getDoctorName()} | {getDispensaryName()}
                </p>
                <p className="text-sm text-gray-500">
                  {reportMode === 'daily'
                    ? format(startDate!, "PPP")
                    : `${format(startDate!, "PPP")} - ${format(endDate!, "PPP")}`}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handlePrint}>
                  <Printer className="w-4 h-4 mr-2" /> Print
                </Button>
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="w-4 h-4 mr-2" /> Export
                </Button>
              </div>
            </div>

            {/* Financial Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-blue-50 border-blue-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-blue-800">Total Bookings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-900">{reportData.total || 0}</div>
                  <p className="text-xs text-blue-600 mt-1">
                    {reportData.completed || 0} Completed, {reportData.cancelled || 0} Cancelled
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-green-50 border-green-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-green-800">Total Amount</CardTitle>
                  <DollarSign className="w-4 h-4 text-green-600 absolute top-4 right-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-900">
                    Rs {(reportData.totalAmount || 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-green-600 mt-1">Total collected revenue</p>
                </CardContent>
              </Card>

              <Card className="bg-purple-50 border-purple-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-purple-800">Total Commission</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-900">
                    Rs {(reportData.totalCommission || 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-purple-600 mt-1">Platform earnings</p>
                </CardContent>
              </Card>
            </div>

            {/* Bookings Table */}
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Time Slot</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Patient Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.bookings && reportData.bookings.length > 0 ? (
                    reportData.bookings.map((booking: any) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-medium whitespace-nowrap">
                          {format(new Date(booking.bookingDate), "MMM d")}
                        </TableCell>
                        <TableCell>{booking.timeSlot}</TableCell>
                        <TableCell className="font-mono text-xs">{booking.bookingReference || booking.transactionId || '-'}</TableCell>
                        <TableCell>{booking.patientName}</TableCell>
                        <TableCell>{booking.patientPhone}</TableCell>
                        <TableCell>
                          <span className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium capitalize",
                            booking.status === 'completed' && "bg-green-100 text-green-800",
                            booking.status === 'cancelled' && "bg-red-100 text-red-800",
                            booking.status === 'scheduled' && "bg-blue-100 text-blue-800",
                            booking.status === 'no_show' && "bg-gray-100 text-gray-800",
                            booking.status === 'checked_in' && "bg-yellow-100 text-yellow-800"
                          )}>
                            {booking.status.replace('_', ' ')}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {booking.fees?.totalFee ? `Rs ${booking.fees.totalFee}` : '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        No bookings found for this period.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReportDetailGenerator;
