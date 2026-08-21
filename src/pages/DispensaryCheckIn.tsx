import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminHeader from '@/components/AdminHeader';
import AdminFooter from '@/components/AdminFooter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { BookingService } from '@/api/services/BookingService';
import { DoctorService } from '@/api/services/DoctorService';
import { DispensaryService } from '@/api/services/DispensaryService';
import { TimeSlotService } from '@/api/services/TimeSlotService';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Booking, BookingStatus } from '@/api/models';
import { Search, Loader2, CheckCircle2, Calendar, LogOut, TimerReset, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface BookingWithDetails extends Booking {
  doctor?: {
    id: string;
    name: string;
    specialization: string;
  };
  dispensary?: {
    id: string;
    name: string;
    address: string;
  };
  transactionId?: string;
}

const DispensaryCheckIn = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // User context
  const [userDispensaryIds, setUserDispensaryIds] = useState<string[]>([]);
  const [selectedDispensaryId, setSelectedDispensaryId] = useState<string>('');
  
  // Data
  const [doctors, setDoctors] = useState<Array<{ id: string; name: string; specialization: string }>>([]);
  const [dispensaries, setDispensaries] = useState<Array<{ id: string; name: string }>>([]);
  const [sessions, setSessions] = useState<Array<{ timeSlot: string; startTime: string; endTime: string; timeSlotConfigId: string | null; isAbsent?: boolean }>>([]);
  
  // Form state - Search mode
  const [searchMode, setSearchMode] = useState<'search' | 'bulk' | 'multiple'>('search');
  const [bookingReference, setBookingReference] = useState('');
  const [appointmentNumber, setAppointmentNumber] = useState('');
  const [patientName, setPatientName] = useState('');
  
  // Form state - Bulk mode
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  
  // Form state - Multiple mode
  const [multipleStartDate, setMultipleStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [multipleEndDate, setMultipleEndDate] = useState<string>(
    new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  
  const [isMultipleAddMode, setIsMultipleAddMode] = useState(false);
  const [editingMultipleSlotId, setEditingMultipleSlotId] = useState<string | null>(null);
  const [absentDateRanges, setAbsentDateRanges] = useState<any[]>([]);
  const [multipleConflictCount, setMultipleConflictCount] = useState(0);
  
  // Results
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState<string | null>(null);
  const [now, setNow] = useState<Date>(new Date());
  
  // Broadcast state
  const [isCancelSessionOpen, setIsCancelSessionOpen] = useState(false);
  const [isPostponeSessionOpen, setIsPostponeSessionOpen] = useState(false);
  const [isCancelMultipleOpen, setIsCancelMultipleOpen] = useState(false);
  const [postponeDate, setPostponeDate] = useState('');
  const [postponeTime, setPostponeTime] = useState('');
  const [postponeTimeError, setPostponeTimeError] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Global timer tick (updates every second for countdowns)
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Load user context and initial data
  useEffect(() => {
    const loadUserContext = async () => {
      try {
        const userStr = localStorage.getItem('current_user');
        const user = userStr ? JSON.parse(userStr) : null;
        
        if (user?.dispensaryIds && user.dispensaryIds.length > 0) {
          const dispensaryIds = user.dispensaryIds.map((id: any) => id.toString ? id.toString() : id);
          setUserDispensaryIds(dispensaryIds);
          
          // Auto-select first dispensary if only one
          if (dispensaryIds.length === 1) {
            setSelectedDispensaryId(dispensaryIds[0]);
          }
          
          // Load dispensaries
          const dispensariesData = await DispensaryService.getDispensariesByIds(dispensaryIds);
          setDispensaries(dispensariesData.map(d => ({ id: d.id, name: d.name })));
        }
      } catch (error) {
        console.error('Error loading user context:', error);
        toast({
          title: 'Error',
          description: 'Failed to load user context',
          variant: 'destructive'
        });
      }
    };
    
    loadUserContext();
  }, [toast]);

  // Set today's date as default
  useEffect(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    setSelectedDate(`${year}-${month}-${day}`);
  }, []);

  // Load doctors when dispensary changes
  useEffect(() => {
    const loadDoctors = async () => {
      if (!selectedDispensaryId) return;
      
      try {
        setIsLoading(true);
        const doctorsData = await DoctorService.getDoctorsByDispensaryIds([selectedDispensaryId]);
        setDoctors(doctorsData.map(d => ({ 
          id: d.id, 
          name: d.name, 
          specialization: d.specialization 
        })));
        
        // Auto-select doctor if only one
        if (doctorsData.length === 1) {
          setSelectedDoctorId(doctorsData[0].id);
        }
      } catch (error) {
        console.error('Error loading doctors:', error);
        toast({
          title: 'Error',
          description: 'Failed to load doctors',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDoctors();
  }, [selectedDispensaryId, toast]);

  // Load sessions when doctor and date change
  useEffect(() => {
    const loadSessions = async () => {
      if (!selectedDispensaryId || !selectedDoctorId || !selectedDate) {
        setSessions([]);
        setSelectedSessionId('');
        return;
      }
      
      try {
        const dateObj = new Date(selectedDate);
        // Fetch sessions from TimeSlotConfig for this doctor + dispensary + dayOfWeek
        const sessionsData = await TimeSlotService.getSessionsForDate(
          selectedDoctorId,
          selectedDispensaryId,
          dateObj
        );
        
        if (sessionsData && sessionsData.length > 0) {
          // Map to the format we need, using timeSlotConfigId as the value
          const formattedSessions = sessionsData.map(session => ({
            timeSlot: session.timeSlot,
            startTime: session.startTime,
            endTime: session.endTime,
            timeSlotConfigId: session.timeSlotConfigId || null
          }));
          
          setSessions(formattedSessions);
          
          // Auto-select session if only one (use timeSlotConfigId as value)
          if (formattedSessions.length === 1 && formattedSessions[0].timeSlotConfigId) {
            setSelectedSessionId(formattedSessions[0].timeSlotConfigId);
          } else {
            setSelectedSessionId('');
          }
        } else {
          setSessions([]);
          setSelectedSessionId('');
        }
      } catch (error) {
        console.error('Error loading sessions:', error);
        setSessions([]);
        setSelectedSessionId('');
      }
    };
    
    loadSessions();
  }, [selectedDispensaryId, selectedDoctorId, selectedDate]);

  // Handle search
  const handleSearch = async () => {
    if (!selectedDispensaryId) {
      toast({
        title: 'Error',
        description: 'Please select a dispensary',
        variant: 'destructive'
      });
      return;
    }

    // At least one search parameter required
    if (!bookingReference && !appointmentNumber && !patientName) {
      toast({
        title: 'Error',
        description: 'Please enter at least one search parameter',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsLoading(true);
      const results = await BookingService.searchBookingsForCheckIn({
        bookingReference: bookingReference || undefined,
        appointmentNumber: appointmentNumber || undefined,
        patientName: patientName || undefined,
        dispensaryId: selectedDispensaryId,
        doctorId: selectedDoctorId || undefined,
        date: selectedDate || undefined
      });
      
      setBookings(results);
      
      if (results.length === 0) {
        toast({
          title: 'No results',
          description: 'No bookings found matching your search criteria'
        });
      }
    } catch (error: any) {
      console.error('Error searching bookings:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to search bookings',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle bulk load
  const handleLoadBookings = async () => {
    if (!selectedDispensaryId || !selectedDoctorId || !selectedDate) {
      toast({
        title: 'Error',
        description: 'Please select dispensary, doctor, and date',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsLoading(true);
      const results = await BookingService.loadSessionBookings({
        dispensaryId: selectedDispensaryId,
        doctorId: selectedDoctorId,
        date: selectedDate,
        sessionId: selectedSessionId && selectedSessionId !== "all" ? selectedSessionId : undefined
      });
      
      setBookings(results);
      
      if (results.length === 0) {
        toast({
          title: 'No bookings',
          description: 'No bookings found for the selected session'
        });
      }
    } catch (error: any) {
      console.error('Error loading bookings:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load bookings',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const activeBookingsCount = bookings.filter(b => b.status === BookingStatus.SCHEDULED).length;

  const handleCancelSession = async () => {
    if (!selectedDispensaryId || !selectedDoctorId || !selectedDate) return;
    try {
      setIsBroadcasting(true);
      const res = await BookingService.cancelSession({
        doctorId: selectedDoctorId,
        dispensaryId: selectedDispensaryId,
        bookingDate: selectedDate,
        timeSlotConfigId: selectedSessionId && selectedSessionId !== 'all' ? selectedSessionId : undefined
      });
      setIsCancelSessionOpen(false);
      toast({
        title: 'Success',
        description: res.message
      });
      handleLoadBookings();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to cancel session',
        variant: 'destructive'
      });
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handlePostponeSession = async () => {
    if (!selectedDispensaryId || !selectedDoctorId || !selectedDate || !postponeDate) return;
    
    setPostponeTimeError('');
    if (postponeTime.trim()) {
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)\s*-\s*([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(postponeTime.trim())) {
        setPostponeTimeError("Invalid time range. Use format HH:mm - HH:mm (e.g. 09:00 - 14:00)");
        return;
      }
    }
    try {
      setIsBroadcasting(true);
      const res = await BookingService.postponeSession({
        doctorId: selectedDoctorId,
        dispensaryId: selectedDispensaryId,
        bookingDate: selectedDate,
        timeSlotConfigId: selectedSessionId && selectedSessionId !== 'all' ? selectedSessionId : undefined,
        newDate: postponeDate,
        newTimeSlot: postponeTime
      });
      setIsPostponeSessionOpen(false);
      toast({
        title: 'Success',
        description: res.message
      });
      handleLoadBookings();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to postpone session',
        variant: 'destructive'
      });
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleMarkMultipleAbsentInit = async () => {
    if (!selectedDoctorId || !selectedDispensaryId) return;
    setIsBroadcasting(true);
    try {
      const res = await TimeSlotService.checkDateRangeConflicts(
        selectedDoctorId,
        selectedDispensaryId,
        multipleStartDate,
        multipleEndDate,
        editingMultipleSlotId || undefined
      );
      if (res.hasOverlap) {
        toast({
          title: 'Existing Overlap',
          description: res.message || 'There is an existing absence block in this range.',
          variant: 'destructive'
        });
        return;
      }
      if (res.bookingCount && res.bookingCount > 0) {
        setMultipleConflictCount(res.bookingCount);
        setIsCancelMultipleOpen(true);
      } else {
        await executeMultipleAbsent(false);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Error occurred checking conflicts',
        variant: 'destructive'
      });
    } finally {
      setIsBroadcasting(false);
    }
  };

  const executeMultipleAbsent = async (force: boolean = false) => {
    setIsBroadcasting(true);
    try {
      let res;
      if (editingMultipleSlotId) {
        res = await TimeSlotService.updateDateRangeAbsence(editingMultipleSlotId, {
          doctorId: selectedDoctorId,
          dispensaryId: selectedDispensaryId,
          startDate: multipleStartDate,
          endDate: multipleEndDate,
          force
        });
      } else {
        res = await TimeSlotService.createDateRangeAbsence({
          doctorId: selectedDoctorId,
          dispensaryId: selectedDispensaryId,
          startDate: multipleStartDate,
          endDate: multipleEndDate,
          force
        });
      }
      toast({
        title: 'Success',
        description: res.message || 'Sessions blocked successfully.'
      });
      setIsCancelMultipleOpen(false);
      setIsMultipleAddMode(false);
      setEditingMultipleSlotId(null);
      loadAbsentDateRanges();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to absent date range.',
        variant: 'destructive'
      });
    } finally {
      setIsBroadcasting(false);
    }
  };

  const loadAbsentDateRanges = async () => {
    if (!selectedDoctorId || !selectedDispensaryId) return;
    try {
      const now = new Date();
      const startDate = new Date(now);
      startDate.setDate(now.getDate() - 30);
      const endDate = new Date(now);
      endDate.setDate(now.getDate() + 365);
      const slots = await TimeSlotService.getAbsentTimeSlots(selectedDoctorId, selectedDispensaryId, startDate, endDate);
      setAbsentDateRanges(slots.filter(s => s.isDateRange));
    } catch (error) {
      console.error('Failed to load absent date ranges', error);
    }
  };

  const handleDeleteMultipleAbsent = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this absent date range?')) return;
    try {
      await TimeSlotService.deleteAbsentTimeSlot(id);
      toast({ title: 'Success', description: 'Absent date range removed.' });
      loadAbsentDateRanges();
    } catch (error) {
       toast({ title: 'Error', description: 'Failed to remove date range.', variant: 'destructive' });
    }
  };

  // Handle check-in
  const handleCheckIn = async (bookingId: string) => {
    try {
      setIsCheckingIn(bookingId);
      const updatedBooking = await BookingService.checkInBooking(bookingId);
      
      // Update the booking in the list
      setBookings(prev => prev.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: BookingStatus.CHECKED_IN, checkedInTime: updatedBooking.checkedInTime }
          : booking
      ));
      
      toast({
        title: 'Success',
        description: 'Patient checked in successfully'
      });
    } catch (error: any) {
      console.error('Error checking in:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to check in patient',
        variant: 'destructive'
      });
    } finally {
      setIsCheckingIn(null);
    }
  };

  // Handle check-out (complete visit)
  const handleCheckOut = async (bookingId: string) => {
    try {
      setIsCheckingOut(bookingId);
      const updatedBooking = await BookingService.checkOutBooking(bookingId);

      setBookings(prev =>
        prev.map(booking =>
          booking.id === bookingId
            ? {
                ...booking,
                status: updatedBooking.status,
                checkedInTime: updatedBooking.checkedInTime,
                completedTime: (updatedBooking as any).completedTime,
                isPatientVisited: (updatedBooking as any).isPatientVisited,
              }
            : booking
        )
      );

      toast({
        title: updatedBooking.status === BookingStatus.SCHEDULED ? 'Check-in reverted' : 'Checked out',
        description:
          updatedBooking.status === BookingStatus.SCHEDULED
            ? 'Patient check-in has been reverted.'
            : 'Patient checked out successfully.',
      });
    } catch (error: any) {
      console.error('Error checking out:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to check out patient',
        variant: 'destructive',
      });
    } finally {
      setIsCheckingOut(null);
    }
  };

  // Returns remaining seconds within 5 minutes from checked-in time, or 0 if expired / not available
  const getCheckoutRemainingSeconds = (booking: BookingWithDetails): number => {
    if (!booking.checkedInTime) return 0;
    const checkedInAt = new Date(booking.checkedInTime);
    const expiresAt = new Date(checkedInAt.getTime() + 5 * 60 * 1000);
    const diffMs = expiresAt.getTime() - now.getTime();
    if (diffMs <= 0) return 0;
    return Math.floor(diffMs / 1000);
  };

  // Date restriction helpers — check-in/out only allowed for today's bookings
  const isBookingToday = (booking: BookingWithDetails): boolean => {
    if (!booking.bookingDate) return false;
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const bookingStr = format(new Date(booking.bookingDate), 'yyyy-MM-dd');
    return todayStr === bookingStr;
  };

  const isBookingFuture = (booking: BookingWithDetails): boolean => {
    if (!booking.bookingDate) return false;
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const bookingStr = format(new Date(booking.bookingDate), 'yyyy-MM-dd');
    return bookingStr > todayStr;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'checked_in':
        return <Badge className="bg-green-100 text-green-800">Checked In</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-800">Booked</Badge>;
      case 'completed':
        return <Badge className="bg-gray-100 text-gray-800">Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <AdminHeader />
      
      <main className="flex-grow bg-gradient-to-br from-medicalBlue-50 via-white to-medicalTeal-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold medical-text-gradient">Patient Check-In</h1>
            <p className="text-medicalGray-600 mt-2">
              Search and check-in patients for booked sessions
            </p>
          </div>

          {/* Mode Toggle */}
          <div className="mb-6 flex gap-4">
            <Button
              variant={searchMode === 'search' ? 'default' : 'outline'}
              onClick={() => setSearchMode('search')}
            >
              <Search className="h-4 w-4 mr-2" />
              Search by Patient
            </Button>
            <Button
              variant={searchMode === 'bulk' ? 'default' : 'outline'}
              onClick={() => setSearchMode('bulk')}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Walk-In / Bulk Check-In
            </Button>
            <Button
              variant={searchMode === 'multiple' ? 'default' : 'outline'}
              onClick={() => setSearchMode('multiple')}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Multiple Sessions
            </Button>
          </div>

          {/* Search Mode */}
          {searchMode === 'search' && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Search Bookings</CardTitle>
                <CardDescription>
                  Search by booking reference, appointment number, or patient name
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dispensary">Dispensary *</Label>
                    <Select 
                      value={selectedDispensaryId} 
                      onValueChange={setSelectedDispensaryId}
                      disabled={userDispensaryIds.length === 1}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select dispensary" />
                      </SelectTrigger>
                      <SelectContent>
                        {dispensaries.length === 0 ? (
                          <div className="px-2 py-1.5 text-sm text-gray-500">No dispensaries available</div>
                        ) : (
                          dispensaries.map(dispensary => (
                            <SelectItem key={dispensary.id} value={dispensary.id}>
                              {dispensary.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="bookingReference">Booking Reference</Label>
                    <Input
                      id="bookingReference"
                      placeholder="TRX-..."
                      value={bookingReference}
                      onChange={(e) => setBookingReference(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="appointmentNumber">Appointment Number</Label>
                    <Input
                      id="appointmentNumber"
                      type="number"
                      min="1"
                      placeholder="e.g. 1, 2, 3"
                      value={appointmentNumber}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '' || (parseInt(value) > 0)) {
                          setAppointmentNumber(value);
                        }
                      }}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="patientName">Patient Name</Label>
                    <Input
                      id="patientName"
                      placeholder="Patient full name"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      maxLength={50}
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleSearch} 
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Search
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Bulk Mode */}
          {searchMode === 'bulk' && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Load Session Bookings</CardTitle>
                <CardDescription>
                  Load all bookings for a specific doctor session
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bulkDispensary">Dispensary *</Label>
                    <Select 
                      value={selectedDispensaryId} 
                      onValueChange={setSelectedDispensaryId}
                      disabled={userDispensaryIds.length === 1}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select dispensary" />
                      </SelectTrigger>
                      <SelectContent>
                        {dispensaries.length === 0 ? (
                          <div className="px-2 py-1.5 text-sm text-gray-500">No dispensaries available</div>
                        ) : (
                          dispensaries.map(dispensary => (
                            <SelectItem key={dispensary.id} value={dispensary.id}>
                              {dispensary.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="bulkDate">Date *</Label>
                    <Input
                      id="bulkDate"
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="bulkDoctor">Doctor *</Label>
                    <Select 
                      value={selectedDoctorId} 
                      onValueChange={setSelectedDoctorId}
                      disabled={doctors.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={doctors.length === 0 ? "No doctors available" : "Select doctor"} />
                      </SelectTrigger>
                      <SelectContent>
                        {doctors.length === 0 ? (
                          <div className="px-2 py-1.5 text-sm text-gray-500">No doctors available</div>
                        ) : (
                          doctors.map(doctor => (
                            <SelectItem key={doctor.id} value={doctor.id}>
                              {doctor.name} - {doctor.specialization}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="bulkSession">Session (Optional)</Label>
                    <Select 
                      value={selectedSessionId || "all"} 
                      onValueChange={(value) => setSelectedSessionId(value === "all" ? "" : value)}
                      disabled={!selectedDoctorId || !selectedDate}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={!selectedDoctorId || !selectedDate ? "Select doctor and date first" : "All sessions"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sessions</SelectItem>
                        {sessions.length === 0 ? (
                          <div className="px-2 py-1.5 text-sm text-gray-500">No sessions available</div>
                        ) : (
                          sessions
                            .filter(session => session.timeSlotConfigId) // Only show sessions with timeSlotConfigId
                            .map(session => (
                              <SelectItem 
                                key={session.timeSlotConfigId!} 
                                value={session.timeSlotConfigId!}
                              >
                                {session.isAbsent ? `${session.startTime} (Cancelled)` : session.startTime}
                              </SelectItem>
                            ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Cancelled message warning */}
                {selectedSessionId && selectedSessionId !== 'all' && sessions.find(s => s.timeSlotConfigId === selectedSessionId)?.isAbsent ? (
                  <div className="text-red-500 font-bold mb-2 text-sm mt-1">
                    This session has been cancelled by the hospital.
                  </div>
                ) : (!selectedSessionId || selectedSessionId === 'all') && sessions.length > 0 && sessions.every(s => s.isAbsent) ? (
                  <div className="text-red-500 font-bold mb-2 text-sm mt-1">
                    All sessions on this date have been cancelled.
                  </div>
                ) : null}

                <Button 
                  onClick={handleLoadBookings} 
                  disabled={isLoading || !selectedDispensaryId || !selectedDoctorId || !selectedDate}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Calendar className="h-4 w-4 mr-2" />
                      Load Bookings
                    </>
                  )}
                </Button>
                
                {selectedDoctorId && selectedDate && (
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <Button 
                      variant="destructive" 
                      onClick={() => setIsCancelSessionOpen(true)}
                    >
                      Cancel Session
                    </Button>
                    <Button 
                      variant="outline" 
                      className="border-amber-500 text-amber-500 hover:bg-amber-50" 
                      onClick={() => {
                        setPostponeDate(selectedDate);
                        let defaultTime = '';
                        if (selectedSessionId && selectedSessionId !== 'all') {
                          const session = sessions.find(s => s.timeSlotConfigId === selectedSessionId);
                          if (session) {
                            defaultTime = `${session.startTime}-${session.endTime}`;
                          }
                        }
                        setPostponeTime(defaultTime);
                        setPostponeTimeError('');
                        setIsPostponeSessionOpen(true);
                      }}
                    >
                      Postpone Session
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Multiple Sessions Mode */}
          {searchMode === 'multiple' && (
            <Card className="mb-6">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{isMultipleAddMode ? (editingMultipleSlotId ? 'Edit Absent Range' : 'New Absent Range') : 'Multiple Sessions Cancellation'}</CardTitle>
                  <CardDescription>
                    {isMultipleAddMode 
                      ? 'Mark a doctor as absent over a specified date range and cancel existing bookings.'
                      : 'Manage existing date ranges where the doctor is marked as absent.'}
                  </CardDescription>
                </div>
                {isMultipleAddMode && (
                  <Button variant="outline" onClick={() => {
                    setIsMultipleAddMode(false);
                    setEditingMultipleSlotId(null);
                  }}>Back to List</Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Always show doctor and dispensary selection at the top */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <Label htmlFor="multipleDispensary">Dispensary *</Label>
                    <Select 
                      value={selectedDispensaryId} 
                      onValueChange={setSelectedDispensaryId}
                      disabled={userDispensaryIds.length === 1}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Dispensary" />
                      </SelectTrigger>
                      <SelectContent>
                        {dispensaries.map(d => (
                          <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="multipleDoctor">Doctor *</Label>
                    <Select 
                      value={selectedDoctorId} 
                      onValueChange={(val) => {
                        setSelectedDoctorId(val);
                        // Using a timeout because selectedDoctorId state might not update immediately for the load call
                        setTimeout(() => {
                           loadAbsentDateRanges();
                        }, 100);
                      }}
                      disabled={!selectedDispensaryId || isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={isLoading ? "Loading..." : "Select Doctor"} />
                      </SelectTrigger>
                      <SelectContent>
                        {doctors.length === 0 ? (
                          <div className="px-2 py-1.5 text-sm text-gray-500">No doctors available</div>
                        ) : (
                          doctors.map(doctor => (
                            <SelectItem key={doctor.id} value={doctor.id}>
                              {doctor.name} - {doctor.specialization}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {!isMultipleAddMode ? (
                  // List Mode
                  <>
                    {selectedDoctorId && (
                      <div className="space-y-4">
                        {absentDateRanges.length === 0 ? (
                          <div className="text-center py-6 text-gray-500 border rounded-md bg-gray-50">
                            No absent date ranges found for this doctor.
                          </div>
                        ) : (
                          <div className="border rounded-md">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Start Date</TableHead>
                                  <TableHead>End Date</TableHead>
                                  <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {absentDateRanges.map(range => (
                                  <TableRow key={range.id}>
                                    <TableCell>{range.startDate ? format(new Date(range.startDate.substring(0, 10) + 'T00:00:00'), 'MMM dd, yyyy') : 'N/A'}</TableCell>
                                    <TableCell>{range.endDate ? format(new Date(range.endDate.substring(0, 10) + 'T00:00:00'), 'MMM dd, yyyy') : 'N/A'}</TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex justify-end space-x-2">
                                        <Button variant="outline" size="sm" onClick={() => {
                                          setMultipleStartDate(range.startDate ? range.startDate.substring(0, 10) : '');
                                          setMultipleEndDate(range.endDate ? range.endDate.substring(0, 10) : '');
                                          setEditingMultipleSlotId(range.id);
                                          setIsMultipleAddMode(true);
                                        }}>
                                          Edit
                                        </Button>
                                        <Button variant="destructive" size="sm" onClick={() => handleDeleteMultipleAbsent(range.id)}>
                                          Remove
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                        <Button 
                          className="w-full"
                          onClick={() => {
                            setMultipleStartDate(new Date().toISOString().split('T')[0]);
                            setMultipleEndDate(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
                            setEditingMultipleSlotId(null);
                            setIsMultipleAddMode(true);
                          }}
                        >
                          <Calendar className="mr-2 h-4 w-4" /> Add New Absent Range
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  // Add/Edit Mode
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                      <div>
                        <Label htmlFor="multipleStartDate">From Date *</Label>
                        <Input 
                          type="date"
                          value={multipleStartDate}
                          onChange={(e) => {
                            setMultipleStartDate(e.target.value);
                            if (new Date(e.target.value) > new Date(multipleEndDate)) {
                              setMultipleEndDate(e.target.value);
                            }
                          }}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="multipleEndDate">To Date *</Label>
                        <Input 
                          type="date"
                          min={multipleStartDate}
                          value={multipleEndDate}
                          onChange={(e) => setMultipleEndDate(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button 
                        variant="destructive"
                        onClick={handleMarkMultipleAbsentInit} 
                        disabled={isBroadcasting || !selectedDispensaryId || !selectedDoctorId || !multipleStartDate || !multipleEndDate}
                      >
                        {isBroadcasting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-4 w-4 mr-2" />
                            {editingMultipleSlotId ? 'Update Absent Range' : 'Mark Absent (Date Range)'}
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Bookings Table */}
          {bookings.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Bookings ({bookings.length})</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Appt #</TableHead>
                        <TableHead>Patient Name</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Doctor</TableHead>
                        <TableHead>Session</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bookings.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell className="font-medium">
                            {booking.appointmentNumber}
                          </TableCell>
                          <TableCell>{booking.patientName}</TableCell>
                          <TableCell className="font-mono text-sm">
                            {booking.transactionId}
                          </TableCell>
                          <TableCell>
                            {booking.doctor?.name || 'Unknown'}
                          </TableCell>
                          <TableCell>{booking.timeSlot}</TableCell>
                          <TableCell>
                            {getStatusBadge(booking.status)}
                          </TableCell>
                          <TableCell className="text-right">
                            {booking.status === 'checked_in' ? (
                              (() => {
                                const bookingIsToday = isBookingToday(booking);
                                const bookingIsFuture = isBookingFuture(booking);
                                const remaining = getCheckoutRemainingSeconds(booking);
                                const minutes = Math.floor(remaining / 60);
                                const seconds = remaining % 60;
                                const disabled = !bookingIsToday || remaining <= 0 || isCheckingOut === booking.id;
                                return (
                                  <div className="flex items-center justify-end gap-3">
                                    {bookingIsToday ? (
                                      <div className="flex items-center gap-1 text-xs text-red-600">
                                        <TimerReset className="h-3 w-3" />
                                        {remaining > 0 ? (
                                          <span>
                                            {minutes}:{seconds.toString().padStart(2, '0')} left
                                          </span>
                                        ) : (
                                          <span>Checkout window expired</span>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-xs text-amber-600 flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        Cannot check out {bookingIsFuture ? 'future' : 'past'} bookings
                                      </span>
                                    )}
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleCheckOut(booking.id)}
                                      disabled={disabled}
                                    >
                                      {isCheckingOut === booking.id ? (
                                        <>
                                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                          Checking out...
                                        </>
                                      ) : (
                                        <>
                                          <LogOut className="h-3 w-3 mr-1" />
                                          Check-Out
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                );
                              })()
                            ) : booking.status === 'scheduled' ? (
                              (() => {
                                const bookingIsToday = isBookingToday(booking);
                                const bookingIsFuture = isBookingFuture(booking);
                                return (
                                  <div className="flex items-center justify-end gap-2">
                                    {!bookingIsToday && (
                                      <span className="text-xs text-amber-600 flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        Cannot check in {bookingIsFuture ? 'future' : 'past'} bookings
                                      </span>
                                    )}
                                    <Button
                                      size="sm"
                                      onClick={() => handleCheckIn(booking.id)}
                                      disabled={!bookingIsToday || isCheckingIn === booking.id}
                                    >
                                      {isCheckingIn === booking.id ? (
                                        <>
                                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                          Checking In...
                                        </>
                                      ) : (
                                        'Check-In'
                                      )}
                                    </Button>
                                  </div>
                                );
                              })()
                            ) : null}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      
      {/* Modals */}
      <Dialog open={isCancelSessionOpen} onOpenChange={setIsCancelSessionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Session</DialogTitle>
            <DialogDescription>
              You are about to cancel this session. This will notify <strong className="text-foreground">{activeBookingsCount}</strong> patient(s) via SMS. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCancelSessionOpen(false)}>Go Back</Button>
            <Button variant="destructive" onClick={handleCancelSession} disabled={isBroadcasting}>
              {isBroadcasting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Yes, Cancel Session & Notify Patients
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPostponeSessionOpen} onOpenChange={setIsPostponeSessionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Postpone Session</DialogTitle>
            <DialogDescription>
              You are about to postpone this session. This will notify <strong className="text-foreground">{activeBookingsCount}</strong> patient(s) via SMS.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>New Date</Label>
              <Input type="date" value={postponeDate} readOnly className="bg-gray-100 text-gray-500 cursor-not-allowed" />
            </div>
            <div>
              <Label>New Time Slot (Optional)</Label>
              <Input type="text" placeholder="e.g. 17:00-19:00" value={postponeTime} onChange={e => {
                setPostponeTime(e.target.value);
                if (postponeTimeError) setPostponeTimeError('');
              }} />
              {postponeTimeError && <p className="text-sm text-red-500 mt-1">{postponeTimeError}</p>}
            </div>
          </div>
        <DialogFooter>
            <Button variant="outline" onClick={() => setIsPostponeSessionOpen(false)}>
              Cancel
            </Button>
            <Button variant="default" className="bg-amber-500 hover:bg-amber-600" onClick={handlePostponeSession} disabled={isBroadcasting}>
              {isBroadcasting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Postponement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Cancel Multiple Dialog */}
      <Dialog open={isCancelMultipleOpen} onOpenChange={setIsCancelMultipleOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-red-600">Warning: Bookings Exist</DialogTitle>
            <DialogDescription>
              There are {multipleConflictCount} existing bookings for this doctor during the selected date range. Do you still want to mark the sessions as absent and cancel these bookings? Patients will be notified via SMS automatically.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCancelMultipleOpen(false)}>
              No, Go Back
            </Button>
            <Button variant="destructive" onClick={() => executeMultipleAbsent(true)} disabled={isBroadcasting}>
              {isBroadcasting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Yes, Cancel Bookings'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AdminFooter />
    </div>
  );
};

export default DispensaryCheckIn;
