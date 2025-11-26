import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DoctorService, DispensaryService, BookingService } from '@/api/services';
import api from '@/lib/axios';
import { Doctor, Dispensary } from '@/api/models';
import { TimeSlotAvailability } from '@/api/services/TimeSlotService';
import BookingStep1 from '../booking/BookingStep1';
import BookingStep2 from '../booking/BookingStep2';
import { format } from 'date-fns';
import { Search, Calendar, User, ClipboardList, AlertCircle, Clock } from 'lucide-react';

interface AdminBookingFormProps {
  initialDoctorId?: string;
  initialDispensaryId?: string;
  initialDate?: Date;
}

const AdminBookingForm = ({ initialDoctorId, initialDispensaryId, initialDate }: AdminBookingFormProps) => {
  const { toast } = useToast();

  // Form state
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [dispensaries, setDispensaries] = useState<Dispensary[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string>(initialDoctorId || '');
  const [selectedDispensary, setSelectedDispensary] = useState<string>(initialDispensaryId || '');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(initialDate);
  const [availability, setAvailability] = useState<TimeSlotAvailability | null>(null);
  
  // Patient info
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  // Fees state
  const [fees, setFees] = useState<any>(null);
  
  // Adjust booking state
  const [adjustBookingId, setAdjustBookingId] = useState('');
  const [currentBooking, setCurrentBooking] = useState<any>(null);
  const [adjustStep, setAdjustStep] = useState(0);
  const [searchType, setSearchType] = useState<'transactionId' | 'phone' | 'name'>('transactionId');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  // Check booking state
  const [searchTransactionId, setSearchTransactionId] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [searchName, setSearchName] = useState('');
  const [foundBooking, setFoundBooking] = useState<any>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // Load initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        const [doctorsData, dispensariesData] = await Promise.all([
          DoctorService.getAllDoctors(),
          DispensaryService.getAllDispensaries()
        ]);
        setDoctors(doctorsData);
        setDispensaries(dispensariesData);
      } catch (error) {
        console.error('Error fetching initial data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load doctors and dispensaries',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [toast]);

  // Fetch availability when doctor, dispensary, and date are selected
  useEffect(() => {
    const fetchAvailability = async () => {
      if (!selectedDoctor || !selectedDispensary || !selectedDate) {
        setAvailability(null);
        return;
      }

      try {
        setIsLoading(true);
        const formattedDate = format(selectedDate, 'yyyy-MM-dd');
        const response = await api.get(`/timeslots/available/${selectedDoctor}/${selectedDispensary}/${formattedDate}`);
        setAvailability(response.data);
      } catch (error) {
        console.error('Error fetching availability:', error);
        setAvailability(null);
        toast({
          title: 'Error',
          description: 'Failed to fetch available time slots',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailability();
  }, [selectedDoctor, selectedDispensary, selectedDate, toast]);

  const handleBooking = async (feesObj: any) => {
    if (!selectedDoctor || !selectedDispensary || !selectedDate || !availability?.slots?.[0]) {
      toast({
        title: 'Error',
        description: 'Please select all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      const bookingData = {
        doctorId: selectedDoctor,
        dispensaryId: selectedDispensary,
        bookingDate: selectedDate, // Pass the Date object, not formatted string
        timeSlot: availability.slots[0].timeSlot,
        appointmentNumber: availability.slots[0].appointmentNumber,
        estimatedTime: availability.slots[0].estimatedTime,
        minutesPerPatient: availability.slots[0].minutesPerPatient,
        patientName: name,
        patientPhone: phone,
        patientEmail: email || undefined,
        fees: feesObj
      };

      const response = await BookingService.createBooking(bookingData);
      console.log("confirm booking response", response);
      
      // Show success message
      toast({
        title: 'Success',
        description: `Booking created successfully! Transaction ID: ${response.transactionId}`,
        variant: 'default',
      });

      // Reset form completely
      setName('');
      setPhone('');
      setEmail('');
      setSelectedDoctor('');
      setSelectedDispensary('');
      setSelectedDate(undefined);
      setCurrentStep(0);
      setAvailability(null);
      
    } catch (error: any) {
      console.error('Error creating booking:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create booking',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdjustBooking = async (feesObj: any) => {
    if (!currentBooking || !selectedDoctor || !selectedDispensary || !selectedDate || !availability?.slots?.[0]) {
      toast({
        title: 'Error',
        description: 'Please select all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      const updateData = {
        doctorId: selectedDoctor,
        dispensaryId: selectedDispensary,
        bookingDate: selectedDate, // Pass the Date object, not formatted string
        timeSlot: availability.slots[0].timeSlot,
        appointmentNumber: availability.slots[0].appointmentNumber,
        estimatedTime: availability.slots[0].estimatedTime,
        minutesPerPatient: availability.slots[0].minutesPerPatient,
        patientName: currentBooking.patient.name,
        patientPhone: currentBooking.patient.phone,
        patientEmail: currentBooking.patient.email || undefined,
        fees: feesObj
      };

      await BookingService.adjustBooking(
        currentBooking.id, 
        selectedDate!, 
        selectedDoctor, 
        selectedDispensary
      );
      
      toast({
        title: 'Success',
        description: 'Booking updated successfully!',
        variant: 'default',
      });

      // Reset form completely
      setCurrentBooking(null);
      setAdjustBookingId('');
      setAdjustStep(0);
      setAvailability(null);
      setShowSearchResults(false);
      setSelectedDoctor('');
      setSelectedDispensary('');
      setSelectedDate(undefined);
      setName('');
      setPhone('');
      setEmail('');
      
    } catch (error: any) {
      console.error('Error updating booking:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update booking',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchBooking = async () => {
    if (!adjustBookingId.trim()) return;

    try {
      setIsLoading(true);
      setSearchResults([]);
      setShowSearchResults(false);

      const response = await api.get(`/bookings/search?${searchType}=${adjustBookingId.trim()}`);
      const results = response.data;

      if (results.length === 0) {
        toast({
          title: 'No Results',
          description: 'No bookings found with the provided information',
          variant: 'destructive',
        });
        return;
      }

      setSearchResults(results);
      setShowSearchResults(true);

    } catch (error: any) {
      console.error('Error searching bookings:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to search bookings',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectBooking = (booking: any) => {
    setCurrentBooking(booking);
    setSelectedDoctor(booking.doctor.id);
    setSelectedDispensary(booking.dispensary.id);
    setSelectedDate(new Date(booking.bookingDate));
    setName(booking.patient.name);
    setPhone(booking.patient.phone);
    setEmail(booking.patient.email || '');
    setAdjustStep(1);
    setShowSearchResults(false);
    setAdjustBookingId('');
  };

  const handleSearchBookingStatus = async () => {
    const searchValue = searchTransactionId.trim();
    if (!searchValue) return;

    try {
      setSearchLoading(true);
      const response = await api.get(`/bookings/search?transactionId=${searchValue}`);
      const results = response.data;

      if (results.length === 0) {
        toast({
          title: 'No Results',
          description: 'No booking found with this transaction ID',
          variant: 'destructive',
        });
        setFoundBooking(null);
        return;
      }

      setFoundBooking(results[0]);

    } catch (error: any) {
      console.error('Error searching booking status:', error);
      toast({
        title: 'Error',
        description: 'Failed to search booking status',
        variant: 'destructive',
      });
      setFoundBooking(null);
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Admin Booking Management
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Create, adjust, and check booking status as an administrator
          </p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="appointment" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="appointment">Create Booking</TabsTrigger>
              <TabsTrigger value="adjust">Adjust Booking</TabsTrigger>
              <TabsTrigger value="check">Check Status</TabsTrigger>
            </TabsList>
            
            <TabsContent value="appointment">
              <div className="space-y-6">
                {currentStep === 0 ? (
                  <BookingStep1
                    doctors={doctors}
                    dispensaries={dispensaries}
                    selectedDoctor={selectedDoctor}
                    selectedDispensary={selectedDispensary}
                    selectedDate={selectedDate}
                    setSelectedDoctor={setSelectedDoctor}
                    setSelectedDispensary={setSelectedDispensary}
                    setSelectedDate={setSelectedDate}
                    availability={availability}
                    isLoading={isLoading}
                    onContinue={() => setCurrentStep(1)}
                    showCalendar={true}
                  />
                ) : (
                  <BookingStep2
                    nextAppointment={availability?.slots?.[0] || null}
                    selectedDate={selectedDate}
                    name={name}
                    phone={phone}
                    email={email}
                    setName={setName}
                    setPhone={setPhone}
                    setEmail={setEmail}
                    isLoading={isLoading}
                    onBack={() => setCurrentStep(0)}
                    onConfirm={handleBooking}
                    doctorId={selectedDoctor}
                    dispensaryId={selectedDispensary}
                  />
                )}
              </div>
            </TabsContent>

            <TabsContent value="adjust">
              <div className="space-y-6">
                {adjustStep === 0 ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm text-yellow-800">
                          Search for an existing booking to adjust its details
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="search-type">Search By</Label>
                        <Select value={searchType} onValueChange={(value: any) => setSearchType(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="transactionId">Transaction ID</SelectItem>
                            <SelectItem value="phone">Phone Number</SelectItem>
                            <SelectItem value="name">Patient Name</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="search-value">
                          {searchType === 'transactionId' ? 'Transaction ID' : 
                           searchType === 'phone' ? 'Phone Number' : 'Patient Name'}
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            id="search-value"
                            value={adjustBookingId}
                            onChange={(e) => setAdjustBookingId(e.target.value)}
                            placeholder={`Enter ${searchType === 'transactionId' ? 'transaction ID' : searchType === 'phone' ? 'phone number' : 'patient name'}`}
                          />
                          <Button onClick={handleSearchBooking} disabled={isLoading || !adjustBookingId.trim()}>
                            <Search className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {showSearchResults && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Search Results</h3>
                        {searchResults.map((booking) => (
                          <Card key={booking.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleSelectBooking(booking)}>
                            <CardContent className="p-4">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <p className="font-medium">Transaction ID</p>
                                  <p>{booking.transactionId}</p>
                                </div>
                                <div>
                                  <p className="font-medium">Patient</p>
                                  <p>{booking.patient.name}</p>
                                </div>
                                <div>
                                  <p className="font-medium">Phone</p>
                                  <p>{booking.patient.phone}</p>
                                </div>
                                <div>
                                  <p className="font-medium">Date</p>
                                  <p>{format(new Date(booking.bookingDate), 'PPP')}</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-blue-800">
                          Adjusting booking for: <strong>{currentBooking?.patient.name}</strong> (Transaction: {currentBooking?.transactionId})
                        </span>
                      </div>
                    </div>

                    <BookingStep1
                      doctors={doctors}
                      dispensaries={dispensaries}
                      selectedDoctor={selectedDoctor}
                      selectedDispensary={selectedDispensary}
                      selectedDate={selectedDate}
                      setSelectedDoctor={setSelectedDoctor}
                      setSelectedDispensary={setSelectedDispensary}
                      setSelectedDate={setSelectedDate}
                      availability={availability}
                      isLoading={isLoading}
                      onContinue={() => setAdjustStep(2)}
                      showCalendar={true}
                    />

                    {adjustStep === 2 && (
                      <BookingStep2
                        nextAppointment={availability?.slots?.[0] || null}
                        selectedDate={selectedDate}
                        name={name}
                        phone={phone}
                        email={email}
                        setName={setName}
                        setPhone={setPhone}
                        setEmail={setEmail}
                        isLoading={isLoading}
                        onBack={() => setAdjustStep(1)}
                        onConfirm={handleAdjustBooking}
                        doctorId={selectedDoctor}
                        dispensaryId={selectedDispensary}
                      />
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="check">
              <div className="space-y-6">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-800">
                      Search for a booking by transaction ID to view its status
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={searchTransactionId}
                      onChange={(e) => setSearchTransactionId(e.target.value)}
                      placeholder="Enter transaction ID"
                      className="flex-1"
                    />
                    <Button onClick={handleSearchBookingStatus} disabled={searchLoading || !searchTransactionId.trim()}>
                      {searchLoading ? <Clock className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    </Button>
                  </div>

                  {foundBooking && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Booking Status</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="font-medium text-sm text-gray-600">Transaction ID</p>
                            <p className="font-semibold">{foundBooking.transactionId}</p>
                          </div>
                          <div>
                            <p className="font-medium text-sm text-gray-600">Status</p>
                            <p className="font-semibold capitalize">{foundBooking.status}</p>
                          </div>
                          <div>
                            <p className="font-medium text-sm text-gray-600">Date</p>
                            <p className="font-semibold">{format(new Date(foundBooking.bookingDate), 'PPP')}</p>
                          </div>
                          <div>
                            <p className="font-medium text-sm text-gray-600">Time</p>
                            <p className="font-semibold">{foundBooking.timeSlot}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-semibold mb-2">Patient Information</h4>
                            <div className="space-y-1 text-sm">
                              <p><strong>Name:</strong> {foundBooking.patient.name}</p>
                              <p><strong>Phone:</strong> {foundBooking.patient.phone}</p>
                              {foundBooking.patient.email && <p><strong>Email:</strong> {foundBooking.patient.email}</p>}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-2">Appointment Details</h4>
                            <div className="space-y-1 text-sm">
                              <p><strong>Doctor:</strong> {foundBooking.doctor.name}</p>
                              <p><strong>Specialization:</strong> {foundBooking.doctor.specialization}</p>
                              <p><strong>Dispensary:</strong> {foundBooking.dispensary.name}</p>
                              <p><strong>Appointment #:</strong> {foundBooking.appointmentNumber}</p>
                            </div>
                          </div>
                        </div>
                        
                        
                        <div className="text-xs text-gray-500 pt-4 border-t">
                          <p><strong>Created:</strong> {format(new Date(foundBooking.createdAt), 'PPpp')}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBookingForm;
