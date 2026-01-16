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
import { Booking, BookingStatus } from '@/api/models';
import { Search, Loader2, CheckCircle2, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
  const [sessions, setSessions] = useState<Array<{ timeSlot: string; startTime: string; endTime: string; timeSlotConfigId: string | null }>>([]);
  
  // Form state - Search mode
  const [searchMode, setSearchMode] = useState<'search' | 'bulk'>('search');
  const [bookingReference, setBookingReference] = useState('');
  const [appointmentNumber, setAppointmentNumber] = useState('');
  const [patientName, setPatientName] = useState('');
  
  // Form state - Bulk mode
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  
  // Results
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState<string | null>(null);

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
                                {session.startTime}
                              </SelectItem>
                            ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

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
              </CardContent>
            </Card>
          )}

          {/* Bookings Table */}
          {bookings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Bookings ({bookings.length})</CardTitle>
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
                              <div className="flex items-center justify-end gap-2 text-green-600">
                                <CheckCircle2 className="h-4 w-4" />
                                <span className="text-sm">Checked In</span>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => handleCheckIn(booking.id)}
                                disabled={isCheckingIn === booking.id}
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
                            )}
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
      
      <AdminFooter />
    </div>
  );
};

export default DispensaryCheckIn;

