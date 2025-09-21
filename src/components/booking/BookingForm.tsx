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
import BookingStep1 from './BookingStep1';
import BookingStep2 from './BookingStep2';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar, User } from 'lucide-react';

interface BookingFormProps {
  initialDoctorId?: string;
  initialDispensaryId?: string;
}

const BookingForm = ({ initialDoctorId, initialDispensaryId }: BookingFormProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Role-based access control
  const [userRole, setUserRole] = useState<string>('');
  const [canAccessAdvancedFeatures, setCanAccessAdvancedFeatures] = useState(false);
  
  // Form state
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [dispensaries, setDispensaries] = useState<Dispensary[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [selectedDispensary, setSelectedDispensary] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [availability, setAvailability] = useState<TimeSlotAvailability | null>(null);
  
  // Patient info
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [symptoms, setSymptoms] = useState('');
  
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
  const [foundBooking, setFoundBooking] = useState<any>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Check user role for access control
  useEffect(() => {
    const checkUserRole = () => {
      try {
        const userStr = localStorage.getItem('current_user');
        const user = userStr ? JSON.parse(userStr) : null;
        
        if (user && user.role) {
          const role = user.role.toLowerCase();
          setUserRole(role);
          
          // Allow access to advanced features for Super Admin, Dispensary Admin, and Channel Partner
          const allowedRoles = ['super admin', 'dispensary admin', 'channel partner'];
          const hasAccess = allowedRoles.includes(role);
          setCanAccessAdvancedFeatures(hasAccess);
          
          console.log(`User role: ${role}, Advanced features access: ${hasAccess}`);
        } else {
          setUserRole('');
          setCanAccessAdvancedFeatures(false);
          console.log('No user found or no role assigned');
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        setUserRole('');
        setCanAccessAdvancedFeatures(false);
      }
    };
    
    checkUserRole();
  }, []);

  // Load initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        const userStr = localStorage.getItem('current_user');
        const user = userStr ? JSON.parse(userStr) : null;
        console.log("NNNNN");
        console.log(user);
        
        if (user?.dispensaryIds && user.dispensaryIds.length > 0) {
          console.log(user.dispensaryIds);
          const [doctorsData, dispensariesData] = await Promise.all([
            DoctorService.getDoctorsByDispensaryIds(user.dispensaryIds),
            DispensaryService.getDispensariesByIds(user.dispensaryIds)
          ]);
          console.log("::::::::: "+JSON.stringify(doctorsData));
          setDoctors(doctorsData);
          setDispensaries(dispensariesData);
        } else {
          const [doctorsData, dispensariesData] = await Promise.all([
            DoctorService.getAllDoctors(),
            DispensaryService.getAllDispensaries()
          ]);
          setDoctors(doctorsData);
          setDispensaries(dispensariesData);
        }
        // Fetch all doctors
        // const allDoctors = await DoctorService.getAllDoctors();
        // setDoctors(allDoctors);
        
        // Fetch all dispensaries
        // const allDispensaries = await DispensaryService.getAllDispensaries();
        // setDispensaries(allDispensaries);
        
        // Set initial selections if provided
        if (initialDoctorId) {
          setSelectedDoctor(initialDoctorId);
        }
        
        if (initialDispensaryId) {
          setSelectedDispensary(initialDispensaryId);
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load doctors and dispensaries',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInitialData();
  }, [initialDoctorId, initialDispensaryId, toast]);
  
  // Filter dispensaries when doctor changes
  useEffect(() => {
    const fetchDoctorDispensaries = async () => {
      console.log("=================== find dispensaries by doctor =========== selectedDispensary  "+selectedDispensary);
      if (!selectedDoctor) return;
      if(selectedDispensary) return;
      try {
        console.log("calling dispensaries");
        setIsLoading(true);
        const doctorDispensaries = await DispensaryService.getDispensariesByDoctorId(selectedDoctor);
        setDispensaries(doctorDispensaries);
        
        // If the currently selected dispensary is not in the list, reset it
        if (selectedDispensary && !doctorDispensaries.some(d => d.id === selectedDispensary)) {
          setSelectedDispensary('');
        }
      } catch (error) {
        console.error('Error loading doctor dispensaries:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDoctorDispensaries();
  }, [selectedDoctor, selectedDispensary]);
  
  // Filter doctors when dispensary changes
  useEffect(() => {
    const fetchDispensaryDoctors = async () => {
      console.log("======= find doctors by dispensary== selectedDispensary : "+selectedDispensary);
      if (!selectedDispensary) return;
      if(selectedDoctor) return;
      try {
        setIsLoading(true);
        console.log("calling doctors......")
        const dispensaryDoctors = await DoctorService.getDoctorsByDispensaryId(selectedDispensary);
        setDoctors(dispensaryDoctors);
        
        // If the currently selected doctor is not in the list, reset it
        if (selectedDoctor && !dispensaryDoctors.some(d => d.id === selectedDoctor)) {
          setSelectedDoctor('');
        }
      } catch (error) {
        console.error('Error loading dispensary doctors:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDispensaryDoctors();
  }, [selectedDispensary, selectedDoctor]);
  
  // Load available appointments when doctor, dispensary, and date are selected
  useEffect(() => {
    const fetchAvailability = async () => {
      if (!selectedDoctor || !selectedDispensary || !selectedDate) return;
      
      try {
        setIsLoading(true);
        setAvailability(null);
        
        const availabilityData = await BookingService.getNextAvailableAppointment(
          selectedDoctor,
          selectedDispensary,
          selectedDate
        );
        
        setAvailability(availabilityData);
      } catch (error) {
        console.error('Error loading appointment availability:', error);
        setAvailability({
          available: false,
          message: 'Failed to load appointment information'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAvailability();
  }, [selectedDoctor, selectedDispensary, selectedDate]);
  
  const handleBooking = async (feesObj?: any) => {
    if (!selectedDoctor || !selectedDispensary || !selectedDate || !name || !phone || 
        !availability?.available || !availability.slots?.length) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Create booking
      const { transactionId } = await BookingService.createBooking({
        patientName: name,
        patientPhone: phone,
        patientEmail: email || undefined,
        symptoms: symptoms || undefined,
        doctorId: selectedDoctor,
        dispensaryId: selectedDispensary,
        bookingDate: selectedDate,
        fees: feesObj || fees
      });
      
      // Navigate to booking summary page
      navigate(`/booking-summary/${transactionId}`);
      
    } catch (error) {
      console.error('Error creating booking:', error);
      toast({
        title: 'Booking Failed',
        description: 'There was an error creating your booking. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to search for booking to adjust with enhanced search
  const handleSearchBookingToAdjust = async () => {
    if (!adjustBookingId.trim()) {
      const fieldName = searchType === 'transactionId' ? 'transaction ID' :
                       searchType === 'phone' ? 'phone number' : 'patient name';
      toast({
        title: 'Search Field Required',
        description: `Please enter a ${fieldName} to search for booking`,
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsLoading(true);
      setShowSearchResults(false);
      const results = await BookingService.searchBookings(adjustBookingId.trim(), searchType);
      
      if (results.length === 1) {
        // If only one result, directly load it
        await selectBookingForAdjustment(results[0]);
      } else if (results.length > 1) {
        // If multiple results, show them for selection
        setSearchResults(results);
        setShowSearchResults(true);
      } else {
        toast({
          title: 'No Bookings Found',
          description: `No bookings found matching "${adjustBookingId.trim()}"`,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error searching bookings:', error);
      toast({
        title: 'Search Failed',
        description: 'Could not search for bookings. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to select a booking from search results
  const selectBookingForAdjustment = async (selectedResult: any) => {
    try {
      setIsLoading(true);
      // Get full booking details using transaction ID
      const booking = await BookingService.getBookingSummary(selectedResult.transactionId);
      setCurrentBooking(booking);
      
      // Pre-populate the form with current booking details
      const foundDoctor = doctors.find(d => d.name === booking.doctor.name);
      const foundDispensary = dispensaries.find(d => d.name === booking.dispensary.name);
      setSelectedDoctor(foundDoctor?._id || '');
      setSelectedDispensary(foundDispensary?._id || '');
      setName(booking.patient.name || '');
      setPhone(booking.patient.phone || '');
      setEmail(booking.patient.email || '');
      setSymptoms(booking.symptoms || '');
      setAdjustStep(1);
      setShowSearchResults(false);
      
      toast({
        title: 'Booking Selected',
        description: `Selected booking for ${booking.patient.name}`,
      });
    } catch (error) {
      console.error('Error selecting booking:', error);
      toast({
        title: 'Error',
        description: 'Failed to load booking details',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to adjust booking to new date/time
  const handleAdjustBooking = async (feesObj?: any) => {
    if (!currentBooking || !selectedDate || !availability?.available) {
      toast({
        title: 'Missing information',
        description: 'Please select a new date and time for the appointment',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await api.patch(`/bookings/${currentBooking._id}/adjust`, {
        newDate: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null,
        doctorId: selectedDoctor,
        dispensaryId: selectedDispensary,
      });

      const updatedBooking = response.data;
      
      // Enhanced success message with specific time
      const newDateFormatted = format(selectedDate!, 'do MMM yyyy');
      const estimatedTime = updatedBooking.booking?.estimatedTime || 'time slot assigned';
      
      toast({
        title: '✅ Booking Successfully Adjusted',
        description: `Your appointment has been moved to ${newDateFormatted} at ${estimatedTime}`,
      });
      
      // Reset state
      setAdjustBookingId('');
      setCurrentBooking(null);
      setAdjustStep(0);
      setSelectedDate(undefined);
      setShowSearchResults(false);
      setSearchResults([]);
      
    } catch (error) {
      console.error('Error adjusting booking:', error);
      toast({
        title: 'Adjustment Failed',
        description: 'There was an error adjusting your booking. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to search for booking status
  const handleSearchBookingStatus = async () => {
    if (!searchTransactionId.trim()) {
      toast({
        title: 'Transaction ID Required',
        description: 'Please enter a transaction ID to check booking status',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSearchLoading(true);
      const booking = await BookingService.getBookingSummary(searchTransactionId);
      setFoundBooking(booking);
    } catch (error) {
      console.error('Error finding booking:', error);
      setFoundBooking(null);
      toast({
        title: 'Booking Not Found',
        description: 'Could not find booking with that transaction ID',
        variant: 'destructive'
      });
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardContent className="pt-6">
        {/* Role-based access notice */}
        {!canAccessAdvancedFeatures && userRole && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-800">
                <strong>Current Role:</strong> {userRole} | 
                <em> Additional features (Adjust Booking, Check Status) are available for Super Admin and Dispensary Admin roles.</em>
              </span>
            </div>
          </div>
        )}

        <Tabs defaultValue="appointment" className="w-full">
          <TabsList className={`grid w-full ${canAccessAdvancedFeatures ? 'grid-cols-3' : 'grid-cols-1'} mb-6`}>
            <TabsTrigger value="appointment">Book Appointment</TabsTrigger>
            {canAccessAdvancedFeatures && (
              <>
                <TabsTrigger value="adjust">Adjust Booking</TabsTrigger>
                <TabsTrigger value="check">Check Booking Status</TabsTrigger>
              </>
            )}
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
                />
              ) : (
                <BookingStep2
                  nextAppointment={availability?.slots?.[0] || null}
                  selectedDate={selectedDate}
                  name={name}
                  phone={phone}
                  email={email}
                  symptoms={symptoms}
                  setName={setName}
                  setPhone={setPhone}
                  setEmail={setEmail}
                  setSymptoms={setSymptoms}
                  isLoading={isLoading}
                  onBack={() => setCurrentStep(0)}
                  onConfirm={(feesObj) => handleBooking(feesObj)}
                  doctorId={selectedDoctor}
                  dispensaryId={selectedDispensary}
                />
              )}
            </div>
          </TabsContent>

          {canAccessAdvancedFeatures && (
            <TabsContent value="adjust">
            <div className="space-y-6">
              {adjustStep === 0 && !showSearchResults ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Adjust Existing Booking
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="search-type">Search By</Label>
                      <Select
                        value={searchType}
                        onValueChange={(value: 'transactionId' | 'phone' | 'name') => setSearchType(value)}
                      >
                        <SelectTrigger id="search-type" className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="transactionId">Transaction ID</SelectItem>
                          <SelectItem value="phone">Phone Number</SelectItem>
                          <SelectItem value="name">Patient Name</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="adjust-booking-id">
                        {searchType === 'transactionId' ? 'Transaction ID' :
                         searchType === 'phone' ? 'Phone Number' : 'Patient Name'}
                      </Label>
                      <Input
                        id="adjust-booking-id"
                        value={adjustBookingId}
                        onChange={(e) => setAdjustBookingId(e.target.value)}
                        placeholder={
                          searchType === 'transactionId' 
                            ? 'Enter transaction ID (e.g., TRX-123456789-123)'
                            : searchType === 'phone' 
                            ? 'Enter phone number (e.g., +94712345678)'
                            : 'Enter patient name (e.g., John Doe)'
                        }
                        className="mt-1"
                      />
                    </div>
                    <Button 
                      onClick={handleSearchBookingToAdjust}
                      disabled={isLoading || !adjustBookingId.trim()}
                      className="w-full"
                    >
                      {isLoading ? 'Searching...' : 'Search Bookings'}
                    </Button>
                  </CardContent>
                </Card>
              ) : showSearchResults ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Search className="h-5 w-5" />
                      Search Results ({searchResults.length} found)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600 mb-4">
                      Multiple bookings found. Please select the one you want to adjust:
                    </p>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {searchResults.map((result, index) => (
                        <Card key={result._id} className="border border-gray-200 hover:border-blue-300 cursor-pointer transition-colors">
                          <CardContent className="p-4" onClick={() => selectBookingForAdjustment(result)}>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <h4 className="font-semibold">{result.patientName}</h4>
                                <p className="text-sm text-gray-600">{result.patientPhone}</p>
                                {result.patientEmail && (
                                  <p className="text-sm text-gray-600">{result.patientEmail}</p>
                                )}
                              </div>
                              <div>
                                <p className="text-sm"><strong>Doctor:</strong> {result.doctorName}</p>
                                <p className="text-sm"><strong>Dispensary:</strong> {result.dispensaryName}</p>
                                <p className="text-sm"><strong>Date:</strong> {format(result.bookingDate, 'PPP')}</p>
                              </div>
                              <div>
                                <p className="text-sm"><strong>Time:</strong> {result.estimatedTime}</p>
                                <p className="text-sm"><strong>Status:</strong> 
                                  <span className={`ml-1 px-2 py-1 rounded text-xs ${
                                    result.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                                    result.status === 'completed' ? 'bg-green-100 text-green-800' :
                                    result.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {result.status.toUpperCase()}
                                  </span>
                                </p>
                                <p className="text-sm text-blue-600 font-medium">{result.transactionId}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    <Button variant="outline" onClick={() => {
                      setShowSearchResults(false);
                      setSearchResults([]);
                    }}>
                      Back to Search
                    </Button>
                  </CardContent>
                </Card>
              ) : currentBooking ? (
                <div className="space-y-6">
                  <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-2">Current Booking Details</h3>
                      <div className="space-y-2 text-sm">
                        <p><strong>Patient:</strong> {currentBooking.patient.name}</p>
                        <p><strong>Doctor:</strong> {currentBooking.doctor.name}</p>
                        <p><strong>Dispensary:</strong> {currentBooking.dispensary.name}</p>
                        <p><strong>Current Date:</strong> {format(new Date(currentBooking.bookingDate), 'PPP')}</p>
                        <p><strong>Current Time:</strong> {currentBooking.estimatedTime}</p>
                        <p><strong>Status:</strong> {currentBooking.status}</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Select New Date & Time</CardTitle>
                    </CardHeader>
                    <CardContent>
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
                        onContinue={() => handleAdjustBooking()}
                        readOnly={{
                          doctor: true,
                          dispensary: true
                        }}
                      />
                    </CardContent>
                  </Card>
                  
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => {
                      setAdjustStep(0);
                      setCurrentBooking(null);
                      setAdjustBookingId('');
                      setShowSearchResults(false);
                      setSearchResults([]);
                    }}>
                      Back to Search
                    </Button>
                    <Button 
                      onClick={() => handleAdjustBooking()}
                      disabled={isLoading || !selectedDate || !availability?.available}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isLoading ? 'Adjusting...' : 'Adjust Booking'}
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </TabsContent>
          )}

          {canAccessAdvancedFeatures && (
            <TabsContent value="check">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Check Booking Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="search-transaction-id">Transaction ID</Label>
                    <Input
                      id="search-transaction-id"
                      value={searchTransactionId}
                      onChange={(e) => setSearchTransactionId(e.target.value)}
                      placeholder="Enter your booking transaction ID (e.g., TRX-123456789-123)"
                      className="mt-1"
                    />
                  </div>
                  <Button 
                    onClick={handleSearchBookingStatus}
                    disabled={searchLoading || !searchTransactionId.trim()}
                    className="w-full"
                  >
                    {searchLoading ? 'Searching...' : 'Check Status'}
                  </Button>
                </CardContent>
              </Card>

              {foundBooking && (
                <Card className="border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-800">
                      <User className="h-5 w-5" />
                      Booking Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2">Patient Information</h4>
                        <div className="space-y-1 text-sm">
                          <p><strong>Name:</strong> {foundBooking.patient.name}</p>
                          <p><strong>Phone:</strong> {foundBooking.patient.phone}</p>
                          {foundBooking.patient.email && (
                            <p><strong>Email:</strong> {foundBooking.patient.email}</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Appointment Information</h4>
                        <div className="space-y-1 text-sm">
                          <p><strong>Doctor:</strong> {foundBooking.doctor.name}</p>
                          <p><strong>Specialization:</strong> {foundBooking.doctor.specialization}</p>
                          <p><strong>Dispensary:</strong> {foundBooking.dispensary.name}</p>
                          <p><strong>Address:</strong> {foundBooking.dispensary.address}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2">Schedule</h4>
                        <div className="space-y-1 text-sm">
                          <p><strong>Date:</strong> {format(new Date(foundBooking.bookingDate), 'PPP')}</p>
                          <p><strong>Time:</strong> {foundBooking.estimatedTime}</p>
                          <p><strong>Appointment #:</strong> {foundBooking.appointmentNumber}</p>
                          <p><strong>Status:</strong> 
                            <span className={`ml-1 px-2 py-1 rounded text-xs font-medium ${
                              foundBooking.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                              foundBooking.status === 'completed' ? 'bg-green-100 text-green-800' :
                              foundBooking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {foundBooking.status.toUpperCase()}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Payment Information</h4>
                        <div className="space-y-1 text-sm">
                          {foundBooking.fees ? (
                            <>
                              <p><strong>Doctor Fee:</strong> Rs {foundBooking.fees.doctorFee}</p>
                              <p><strong>Dispensary Fee:</strong> Rs {foundBooking.fees.dispensaryFee}</p>
                              <p><strong>Booking Commission:</strong> Rs {foundBooking.fees.bookingCommission}</p>
                              <p><strong>Total Amount:</strong> <span className="font-semibold">Rs {foundBooking.fees.totalAmount}</span></p>
                            </>
                          ) : (
                            <p>Fee information not available</p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {foundBooking.symptoms && (
                      <div>
                        <h4 className="font-semibold mb-2">Symptoms</h4>
                        <p className="text-sm bg-white p-3 rounded border">{foundBooking.symptoms}</p>
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-500 pt-4 border-t">
                      <p><strong>Transaction ID:</strong> {foundBooking.transactionId}</p>
                      <p><strong>Booked on:</strong> {format(new Date(foundBooking.createdAt), 'PPpp')}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default BookingForm;
