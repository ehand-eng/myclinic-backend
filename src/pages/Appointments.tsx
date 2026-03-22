import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AdminHeader from '@/components/AdminHeader';
import AdminFooter from '@/components/AdminFooter';
import AdminBookingForm from '@/components/admin/AdminBookingForm';
import { BookingService } from '@/api/services';
import { BookingStatus } from '@/api/models';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { canCreateBookings } from '@/lib/roleUtils';
import { format, parseISO } from 'date-fns';
import {
  CalendarIcon,
  CheckCircle2,
  Loader2,
  LogOut,
  TimerReset,
  ClipboardList,
  Users,
  CalendarCheck,
  XCircle,
  Clock,
  Search,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

const getStatusBadge = (status: string) => {
  switch (status) {
    case BookingStatus.CHECKED_IN:
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Checked In</Badge>;
    case BookingStatus.SCHEDULED:
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Booked</Badge>;
    case BookingStatus.COMPLETED:
      return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Completed</Badge>;
    case BookingStatus.CANCELLED:
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Cancelled</Badge>;
    case BookingStatus.NO_SHOW:
      return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">No Show</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

const Appointments = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const userStr = typeof window !== 'undefined' ? localStorage.getItem('current_user') : null;
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const canCreate = canCreateBookings(currentUser?.role);

  // URL-based date persistence
  const selectedDate = useMemo(() => {
    const dateParam = searchParams.get('date');
    if (dateParam) {
      const parsed = parseISO(dateParam);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  }, [searchParams]);

  const setSelectedDate = (date: Date) => {
    setSearchParams({ date: format(date, 'yyyy-MM-dd') }, { replace: true });
  };

  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // Check-in / check-out state
  const [isCheckingIn, setIsCheckingIn] = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());

  // Tick every second for checkout timer
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const selectedStr = format(selectedDate, 'yyyy-MM-dd');
  const isToday = selectedStr === todayStr;
  const isFuture = selectedStr > todayStr;

  const dispensaryIds = currentUser?.dispensaryIds ?? [];
  const normalizedDispensaryIds = dispensaryIds.map((d: any) => typeof d === 'string' ? d : d._id || d.id).filter(Boolean);

  useEffect(() => {
    if (!canCreate) {
      const fetchBookings = async () => {
        try {
          setIsLoadingBookings(true);
          if (normalizedDispensaryIds.length === 0) {
            const list = await BookingService.getBookingsByDate(selectedDate);
            setBookings(list);
          } else {
            const results = await Promise.all(
              normalizedDispensaryIds.map((id: string) =>
                BookingService.getBookingsByDate(selectedDate, id)
              )
            );
            const merged = results.flat();
            const byId = new Map();
            merged.forEach((b) => byId.set(b.id || b._id, b));
            setBookings(Array.from(byId.values()));
          }
        } catch (error) {
          console.error('Error fetching bookings:', error);
          toast({
            title: 'Error',
            description: 'Failed to load bookings',
            variant: 'destructive'
          });
          setBookings([]);
        } finally {
          setIsLoadingBookings(false);
        }
      };
      fetchBookings();
    }
  }, [canCreate, selectedDate, normalizedDispensaryIds.join(','), toast]);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [doctorFilter, setDoctorFilter] = useState<string>('all');

  // Summary stats (from unfiltered bookings)
  const stats = useMemo(() => {
    const total = bookings.length;
    const scheduled = bookings.filter(b => b.status === BookingStatus.SCHEDULED).length;
    const checkedIn = bookings.filter(b => b.status === BookingStatus.CHECKED_IN).length;
    const completed = bookings.filter(b => b.status === BookingStatus.COMPLETED).length;
    const cancelled = bookings.filter(b => b.status === BookingStatus.CANCELLED).length;
    return { total, scheduled, checkedIn, completed, cancelled };
  }, [bookings]);

  // Unique doctors for filter dropdown
  const uniqueDoctors = useMemo(() => {
    const doctorMap = new Map<string, string>();
    bookings.forEach(b => {
      const name = b.doctorName || b.doctorId?.name;
      if (name) doctorMap.set(name, name);
    });
    return Array.from(doctorMap.values()).sort();
  }, [bookings]);

  // Filtered bookings
  const filteredBookings = useMemo(() => {
    let result = bookings;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(b =>
        (b.patientName && b.patientName.toLowerCase().includes(q)) ||
        (b.patientPhone && b.patientPhone.toLowerCase().includes(q)) ||
        (b.transactionId && b.transactionId.toLowerCase().includes(q))
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter(b => b.status === statusFilter);
    }

    if (doctorFilter !== 'all') {
      result = result.filter(b => {
        const name = b.doctorName || b.doctorId?.name;
        return name === doctorFilter;
      });
    }

    return result;
  }, [bookings, searchQuery, statusFilter, doctorFilter]);

  const hasActiveFilters = searchQuery.trim() !== '' || statusFilter !== 'all' || doctorFilter !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setDoctorFilter('all');
  };

  // Check-in handler
  const handleCheckIn = async (bookingId: string) => {
    try {
      setIsCheckingIn(bookingId);
      const updatedBooking = await BookingService.checkInBooking(bookingId);
      setBookings(prev =>
        prev.map(b => (b.id || b._id) === bookingId
          ? { ...b, status: updatedBooking.status, checkedInTime: updatedBooking.checkedInTime }
          : b
        )
      );
      toast({ title: 'Success', description: 'Patient checked in successfully.' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to check in patient',
        variant: 'destructive'
      });
    } finally {
      setIsCheckingIn(null);
    }
  };

  // Check-out handler
  const handleCheckOut = async (bookingId: string) => {
    try {
      setIsCheckingOut(bookingId);
      const updatedBooking = await BookingService.checkOutBooking(bookingId);
      setBookings(prev =>
        prev.map(b => (b.id || b._id) === bookingId
          ? { ...b, status: updatedBooking.status, checkedInTime: updatedBooking.checkedInTime, completedTime: updatedBooking.completedTime }
          : b
        )
      );
      toast({
        title: 'Success',
        description: updatedBooking.status === BookingStatus.SCHEDULED
          ? 'Patient check-in has been reverted.'
          : 'Patient checked out successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to check out patient',
        variant: 'destructive'
      });
    } finally {
      setIsCheckingOut(null);
    }
  };

  // 5-minute checkout window
  const getCheckoutRemainingSeconds = (booking: any): number => {
    if (!booking.checkedInTime) return 0;
    const checkedInAt = new Date(booking.checkedInTime);
    const expiresAt = new Date(checkedInAt.getTime() + 5 * 60 * 1000);
    const diffMs = expiresAt.getTime() - now.getTime();
    if (diffMs <= 0) return 0;
    return Math.floor(diffMs / 1000);
  };

  if (canCreate) {
    return (
      <div className="flex flex-col min-h-screen">
        <AdminHeader />
        <main className="flex-grow bg-gradient-to-br from-medicalBlue-50 via-white to-medicalTeal-50">
          <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold medical-text-gradient">Admin Bookings</h1>
              <p className="text-medicalGray-600 mt-2">Manage all appointments and bookings</p>
            </div>
            <AdminBookingForm />
          </div>
        </main>
        <AdminFooter />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <AdminHeader />
      <main className="flex-grow bg-gradient-to-br from-medicalBlue-50 via-white to-medicalTeal-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold medical-text-gradient">Bookings</h1>
              <p className="text-medicalGray-600 mt-1">View bookings for the selected date</p>
            </div>
            <div className="flex items-center gap-2">
              {format(selectedDate, 'yyyy-MM-dd') !== format(new Date(), 'yyyy-MM-dd') && (
                <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())}>
                  Today
                </Button>
              )}
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full sm:w-auto justify-start text-left font-normal',
                    !selectedDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, 'PPP') : 'Pick date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => {
                    if (d) setSelectedDate(d);
                    setDatePickerOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            </div>
          </div>

          {/* Summary Stats */}
          {!isLoadingBookings && bookings.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
              <Card className="border-l-4 border-l-indigo-500">
                <CardContent className="p-4 flex items-center gap-3">
                  <ClipboardList className="h-5 w-5 text-indigo-500" />
                  <div>
                    <p className="text-2xl font-bold">{stats.total}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-4 flex items-center gap-3">
                  <Clock className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">{stats.scheduled}</p>
                    <p className="text-xs text-muted-foreground">Scheduled</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-green-500">
                <CardContent className="p-4 flex items-center gap-3">
                  <Users className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">{stats.checkedIn}</p>
                    <p className="text-xs text-muted-foreground">Checked In</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-gray-400">
                <CardContent className="p-4 flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-2xl font-bold">{stats.completed}</p>
                    <p className="text-xs text-muted-foreground">Completed</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-red-500">
                <CardContent className="p-4 flex items-center gap-3">
                  <XCircle className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="text-2xl font-bold">{stats.cancelled}</p>
                    <p className="text-xs text-muted-foreground">Cancelled</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filters */}
          {!isLoadingBookings && bookings.length > 0 && (
            <Card className="mb-4">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search patient name, phone, or ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[160px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value={BookingStatus.SCHEDULED}>Booked</SelectItem>
                      <SelectItem value={BookingStatus.CHECKED_IN}>Checked In</SelectItem>
                      <SelectItem value={BookingStatus.COMPLETED}>Completed</SelectItem>
                      <SelectItem value={BookingStatus.CANCELLED}>Cancelled</SelectItem>
                      <SelectItem value={BookingStatus.NO_SHOW}>No Show</SelectItem>
                    </SelectContent>
                  </Select>
                  {uniqueDoctors.length > 1 && (
                    <Select value={doctorFilter} onValueChange={setDoctorFilter}>
                      <SelectTrigger className="w-full sm:w-[200px]">
                        <SelectValue placeholder="Doctor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Doctors</SelectItem>
                        {uniqueDoctors.map(name => (
                          <SelectItem key={name} value={name}>{name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground">
                      <X className="h-4 w-4" /> Clear
                    </Button>
                  )}
                </div>
                {hasActiveFilters && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Showing {filteredBookings.length} of {bookings.length} bookings
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Bookings for {format(selectedDate, 'EEEE, MMM d, yyyy')}</CardTitle>
              <CardDescription>
                Click a row to view booking details
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingBookings ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin mb-3" />
                  <p>Loading bookings...</p>
                </div>
              ) : bookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <CalendarCheck className="h-12 w-12 mb-3 opacity-40" />
                  <p className="text-lg font-medium">No bookings for this date</p>
                  <p className="text-sm mt-1">Select a different date to view bookings</p>
                </div>
              ) : filteredBookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Search className="h-12 w-12 mb-3 opacity-40" />
                  <p className="text-lg font-medium">No matching bookings</p>
                  <p className="text-sm mt-1">Try adjusting your filters</p>
                  {hasActiveFilters && (
                    <Button variant="outline" size="sm" onClick={clearFilters} className="mt-3">
                      Clear All Filters
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Appt #</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead>Doctor</TableHead>
                        <TableHead>Dispensary</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBookings.map((b) => (
                        <TableRow
                          key={b.id || b._id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/admin/bookings/${b.id || b._id}`)}
                        >
                          <TableCell className="font-mono text-sm font-medium">
                            {b.appointmentNumber != null ? `#${b.appointmentNumber}` : '—'}
                          </TableCell>
                          <TableCell>{b.estimatedTime || b.timeSlot || '—'}</TableCell>
                          <TableCell>
                            <span className="font-medium">{b.patientName || '—'}</span>
                            {b.patientPhone && (
                              <span className="block text-sm text-gray-500">{b.patientPhone}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {b.doctorName || b.doctorId?.name || '—'}
                            {b.doctorSpecialization != null && (
                              <span className="block text-sm text-gray-500">{b.doctorSpecialization}</span>
                            )}
                          </TableCell>
                          <TableCell>{b.dispensaryName || b.dispensaryId?.name || '—'}</TableCell>
                          <TableCell>{getStatusBadge(b.status)}</TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            {b.status === BookingStatus.CHECKED_IN ? (
                              (() => {
                                const remaining = getCheckoutRemainingSeconds(b);
                                const minutes = Math.floor(remaining / 60);
                                const seconds = remaining % 60;
                                const disabled = !isToday || remaining <= 0 || isCheckingOut === (b.id || b._id);
                                return (
                                  <div className="flex flex-col items-end gap-1">
                                    <div className="flex items-center gap-3">
                                      {isToday && (
                                        <div className="flex items-center gap-1 text-xs text-red-600">
                                          <TimerReset className="h-3 w-3" />
                                          {remaining > 0 ? (
                                            <span>{minutes}:{seconds.toString().padStart(2, '0')} left</span>
                                          ) : (
                                            <span>Expired</span>
                                          )}
                                        </div>
                                      )}
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleCheckOut(b.id || b._id)}
                                        disabled={disabled}
                                      >
                                        {isCheckingOut === (b.id || b._id) ? (
                                          <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Checking out...</>
                                        ) : (
                                          <><LogOut className="h-3 w-3 mr-1" />Check-Out</>
                                        )}
                                      </Button>
                                    </div>
                                    {!isToday && (
                                      <span className="text-xs text-muted-foreground">Cannot check out {isFuture ? 'future' : 'past'} bookings</span>
                                    )}
                                  </div>
                                );
                              })()
                            ) : b.status === BookingStatus.SCHEDULED ? (
                              <div className="flex flex-col items-end gap-1">
                                <Button
                                  size="sm"
                                  onClick={() => handleCheckIn(b.id || b._id)}
                                  disabled={!isToday || isCheckingIn === (b.id || b._id)}
                                >
                                  {isCheckingIn === (b.id || b._id) ? (
                                    <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Checking In...</>
                                  ) : (
                                    'Check-In'
                                  )}
                                </Button>
                                {!isToday && (
                                  <span className="text-xs text-muted-foreground">Cannot check in {isFuture ? 'future' : 'past'} bookings</span>
                                )}
                              </div>
                            ) : null}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <AdminFooter />
    </div>
  );
};

export default Appointments;
