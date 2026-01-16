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
import { format, addDays } from 'date-fns';
import { Search, User, ClipboardList, AlertCircle, Clock, CheckCircle, CalendarIcon, CalendarX, CalendarClock } from 'lucide-react';
import { isDispensaryAdmin, isDispensaryStaff } from '@/lib/roleUtils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { TimeSlotService } from '@/api/services/TimeSlotService';

interface AdminBookingFormProps {
  initialDoctorId?: string;
  initialDispensaryId?: string;
  initialDate?: Date;
}

const AdminBookingForm = ({ initialDoctorId, initialDispensaryId, initialDate }: AdminBookingFormProps) => {
  const { toast } = useToast();

  // Form state
  const [searchMode, setSearchMode] = useState<'doctor' | 'dispensary'>('doctor');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [dispensaries, setDispensaries] = useState<Dispensary[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string>(initialDoctorId || '');
  const [selectedDispensary, setSelectedDispensary] = useState<string>(initialDispensaryId || '');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(initialDate);
  const [availability, setAvailability] = useState<TimeSlotAvailability | null>(null);
  const [availabilityPreview, setAvailabilityPreview] = useState<any>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

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

  // Completed booking receipt state
  const [completedBooking, setCompletedBooking] = useState<any>(null);

  // User context for role-based restrictions
  const [userDispensaryId, setUserDispensaryId] = useState<string | null>(null);
  const [isDispensaryUser, setIsDispensaryUser] = useState(false);

  // Load initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);

        // Get current user from localStorage
        const userStr = localStorage.getItem('current_user');
        const user = userStr ? JSON.parse(userStr) : null;
        const userRole = user?.role;

        // Check if user is dispensary-admin or dispensary-staff
        const isDispensary = isDispensaryAdmin(userRole) || isDispensaryStaff(userRole);
        setIsDispensaryUser(isDispensary);

        // Get user's dispensaryIds
        const dispensaryIds = user?.dispensaryIds || [];
        // For processing, normalize to array of strings if they are objects
        const normalizedDispensaryIds = dispensaryIds.map((d: any) => typeof d === 'string' ? d : d._id || d.id);
        const primaryDispensaryId = normalizedDispensaryIds.length > 0 ? normalizedDispensaryIds[0] : null;
        setUserDispensaryId(primaryDispensaryId);

        if (isDispensary) {
          // For dispensary users: use "Find by Dispensary" mode to allow selection first
          setSearchMode('dispensary');

          if (normalizedDispensaryIds.length > 0) {
            // Fetch details for ALL assigned dispensaries
            const dispensariesData = await Promise.all(
              normalizedDispensaryIds.map((id: string) => DispensaryService.getDispensaryById(id))
            );

            // Filter out any nulls if fetch failed
            const validDispensaries = dispensariesData.filter(d => d !== null);
            setDispensaries(validDispensaries);
            setDoctors([]); // Will load when dispensary is selected

            // If only one dispensary, auto-select it
            if (validDispensaries.length === 1) {
              setSelectedDispensary(validDispensaries[0].id);
              // Trigger doctor loading for this dispensary
              const doctorsData = await DoctorService.getDoctorsByDispensaryId(validDispensaries[0].id);
              setDoctors(doctorsData);
            }
          } else {
            // Dispensary user but no dispensaries assigned?
            // Should not show ANY dispensaries.
            setDispensaries([]);
            setDoctors([]);
            toast({
              title: 'Access Restricted',
              description: 'You are not assigned to any dispensaries. Please contact an administrator.',
              variant: 'destructive',
            });
          }
        } else {
          // For super-admin: load data based on search mode
          if (searchMode === 'doctor') {
            // Load all doctors
            const doctorsData = await DoctorService.getAllDoctors();
            setDoctors(doctorsData);
            setDispensaries([]); // Will load when doctor is selected
          } else {
            // Load all dispensaries
            const dispensariesData = await DispensaryService.getAllDispensaries();
            setDispensaries(dispensariesData);
            setDoctors([]); // Will load when dispensary is selected
          }
        }
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
  }, [toast, searchMode]);

  // Load dispensaries when doctor is selected (Find by Doctor mode)
  useEffect(() => {
    const loadDispensariesForDoctor = async () => {
      if (searchMode === 'doctor' && selectedDoctor && !isDispensaryUser) {
        try {
          setIsLoading(true);
          const dispensariesData = await DispensaryService.getDispensariesByDoctorId(selectedDoctor);
          setDispensaries(dispensariesData);
          // Clear selected dispensary if it's not in the new list
          if (selectedDispensary && !dispensariesData.find(d => d.id === selectedDispensary)) {
            setSelectedDispensary('');
          }
        } catch (error) {
          console.error('Error loading dispensaries for doctor:', error);
          toast({
            title: 'Error',
            description: 'Failed to load dispensaries for selected doctor',
            variant: 'destructive',
          });
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadDispensariesForDoctor();
  }, [selectedDoctor, searchMode, isDispensaryUser, toast, selectedDispensary]);

  // Load doctors when dispensary is selected (Find by Dispensary mode)
  useEffect(() => {
    const loadDoctorsForDispensary = async () => {
      // Allow for dispensary users too, so they can switch dispensaries
      if (searchMode === 'dispensary' && selectedDispensary) {
        try {
          setIsLoading(true);
          const doctorsData = await DoctorService.getDoctorsByDispensaryId(selectedDispensary);
          setDoctors(doctorsData);
          // Clear selected doctor if it's not in the new list
          if (selectedDoctor && !doctorsData.find(d => d.id === selectedDoctor)) {
            setSelectedDoctor('');
          }
        } catch (error) {
          console.error('Error loading doctors for dispensary:', error);
          toast({
            title: 'Error',
            description: 'Failed to load doctors for selected dispensary',
            variant: 'destructive',
          });
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadDoctorsForDispensary();
  }, [selectedDispensary, searchMode, isDispensaryUser, toast, selectedDoctor]);

  // Load availability preview when both doctor and dispensary are selected (before date selection)
  useEffect(() => {
    const loadAvailabilityPreview = async () => {
      if (selectedDoctor && selectedDispensary && !selectedDate) {
        try {
          setIsLoadingPreview(true);
          const preview = await TimeSlotService.getNextAvailableDays(selectedDoctor, selectedDispensary);
          setAvailabilityPreview(preview);
        } catch (error) {
          console.error('Error loading availability preview:', error);
          setAvailabilityPreview(null);
        } finally {
          setIsLoadingPreview(false);
        }
      } else {
        setAvailabilityPreview(null);
      }
    };

    loadAvailabilityPreview();
  }, [selectedDoctor, selectedDispensary, selectedDate]);

  // Reset selections when search mode changes
  useEffect(() => {
    if (!isDispensaryUser) {
      setSelectedDoctor('');
      setSelectedDispensary('');
      setSelectedDate(undefined);
      setAvailability(null);
      setAvailabilityPreview(null);
    }
  }, [searchMode, isDispensaryUser]);

  // Fetch availability when doctor, dispensary, and date are selected
  useEffect(() => {
    const fetchAvailability = async () => {
      if (!selectedDoctor || !selectedDispensary || !selectedDate) {
        setAvailability(null);
        return;
      }

      // If user changes date/doctor/dispensary while receipt is showing, clear receipt and reset
      if (completedBooking) {
        setCompletedBooking(null);
        setCurrentStep(0);
        setName('');
        setPhone('');
        setEmail('');
      }

      // Reset step to 0 when date/doctor/dispensary changes (to allow new booking)
      if (currentStep > 0) {
        setCurrentStep(0);
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

      // Fetch full booking details with populated doctor and dispensary for receipt
      let bookingReceipt = null;
      try {
        const summary = await BookingService.getBookingSummary(response.transactionId);
        bookingReceipt = summary;
      } catch (error) {
        console.error('Error fetching booking summary:', error);
        // Fallback: construct receipt from response data
        const selectedDoctorData = doctors.find(d => d.id === selectedDoctor);
        const selectedDispensaryData = dispensaries.find(d => d.id === selectedDispensary);
        bookingReceipt = {
          transactionId: response.transactionId,
          bookingDate: selectedDate,
          timeSlot: availability.slots[0].timeSlot,
          appointmentNumber: availability.slots[0].appointmentNumber,
          estimatedTime: availability.slots[0].estimatedTime,
          status: 'scheduled',
          patient: {
            name: name,
            phone: phone,
            email: email
          },
          doctor: {
            name: selectedDoctorData?.name || 'Unknown',
            specialization: selectedDoctorData?.specialization || 'Unknown'
          },
          dispensary: {
            name: selectedDispensaryData?.name || 'Unknown',
            address: selectedDispensaryData?.address || 'Unknown'
          },
          fees: feesObj
        };
      }

      // Store completed booking for receipt display
      setCompletedBooking(bookingReceipt);

      // Show success message
      toast({
        title: 'Success',
        description: `Booking created successfully! Transaction ID: ${response.transactionId}`,
        variant: 'default',
      });

      // Reset form completely (but keep receipt visible)
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
    <div className="w-full space-y-6 relative" style={{ overflow: 'visible' }}>
      <Card className="relative" style={{ overflow: 'visible' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {/* <Calendar className="h-5 w-5" /> */}
            Admin Booking Management11
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Create, adjust, and check booking status as an administrator
          </p>
        </CardHeader>
        <CardContent style={{ overflow: 'visible' }}>
          <Tabs defaultValue="appointment" className="w-full" style={{ overflow: 'visible' }}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="appointment">Create Booking</TabsTrigger>
              <TabsTrigger value="adjust">Adjust Booking</TabsTrigger>
              <TabsTrigger value="check">Check Status</TabsTrigger>
            </TabsList>

            <TabsContent value="appointment" style={{ overflow: 'visible' }}>
              <div className="space-y-6" style={{ overflow: 'visible' }}>
                {completedBooking ? (
                  <div className="space-y-6">
                    {/* Booking Receipt */}
                    <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-800">
                          <CheckCircle className="h-5 w-5" />
                          Booking Confirmed
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Transaction ID</p>
                            <p className="font-semibold text-lg">{completedBooking.transactionId}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Booking Date</p>
                            <p className="font-semibold text-lg">
                              {format(new Date(completedBooking.bookingDate), 'PPP')}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Doctor</p>
                            <p className="font-semibold text-lg">
                              {completedBooking.doctor?.name || 'Unknown'} - {completedBooking.doctor?.specialization || 'Unknown'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Dispensary</p>
                            <p className="font-semibold text-lg">{completedBooking.dispensary?.name || 'Unknown'}</p>
                            <p className="text-sm text-gray-500">{completedBooking.dispensary?.address || ''}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Patient Name</p>
                            <p className="font-semibold text-lg">{completedBooking.patient?.name || 'Unknown'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Phone</p>
                            <p className="font-semibold text-lg">{completedBooking.patient?.phone || 'Unknown'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Appointment Number</p>
                            <p className="font-semibold text-lg">#{completedBooking.appointmentNumber}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Time Slot</p>
                            <p className="font-semibold text-lg">{completedBooking.estimatedTime || completedBooking.timeSlot}</p>
                          </div>
                        </div>

                        {completedBooking.fees && (
                          <div className="mt-6 pt-4 border-t border-green-200">
                            <p className="text-sm font-semibold text-gray-700 mb-2">Fee Breakdown</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-gray-600">Doctor Fee</p>
                                <p className="font-semibold">Rs {completedBooking.fees.doctorFee || 0}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Dispensary Fee</p>
                                <p className="font-semibold">Rs {completedBooking.fees.dispensaryFee || 0}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Commission</p>
                                <p className="font-semibold">Rs {completedBooking.fees.bookingCommission || 0}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Total</p>
                                <p className="font-semibold text-lg text-green-700">
                                  Rs {completedBooking.fees.totalFee || completedBooking.fees.totalAmount || 0}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="mt-6 flex justify-end">
                          <Button
                            onClick={() => {
                              setCompletedBooking(null);
                              // Reset all form states
                              setName('');
                              setPhone('');
                              setEmail('');
                              setSelectedDoctor('');
                              setSelectedDispensary('');
                              setSelectedDate(undefined);
                              setCurrentStep(0);
                              setAvailability(null);
                            }}
                            className="bg-medical-600 hover:bg-medical-700"
                          >
                            Create New Booking
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : currentStep === 0 ? (
                  <div className="space-y-6">
                    {/* Search Mode Toggle - Only for Super Admin */}
                    {!isDispensaryUser && (
                      <div className="space-y-2">
                        <Label htmlFor="search-mode">Search Mode</Label>
                        <Select value={searchMode} onValueChange={(value: 'doctor' | 'dispensary') => setSearchMode(value)}>
                          <SelectTrigger id="search-mode" className="w-full md:w-64">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="doctor">Find by Doctor</SelectItem>
                            <SelectItem value="dispensary">Find by Dispensary</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          {searchMode === 'doctor'
                            ? 'Select a doctor first, then choose from their assigned dispensaries'
                            : 'Select a dispensary first, then choose from doctors assigned to it'}
                        </p>
                      </div>
                    )}

                    {/* Doctor and Dispensary Selection */}
                    <div className={`grid gap-6 mb-6 ${isDispensaryUser ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2'}`}>
                      {searchMode === 'doctor' ? (
                        <>
                          <div className="space-y-4">
                            <Label htmlFor="doctor">Select Doctor {isDispensaryUser ? '*' : ''}</Label>
                            <Select
                              value={selectedDoctor}
                              onValueChange={setSelectedDoctor}
                              disabled={isLoading}
                            >
                              <SelectTrigger id="doctor" className="w-full">
                                <SelectValue placeholder="Choose a doctor" />
                              </SelectTrigger>
                              <SelectContent>
                                {doctors.length === 0 ? (
                                  <div className="px-2 py-1.5 text-sm text-gray-500">No doctors available</div>
                                ) : (
                                  doctors.map((doctor) => (
                                    <SelectItem key={doctor.id} value={doctor.id}>
                                      {doctor.name} - {doctor.specialization}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                          </div>

                          {!isDispensaryUser && (
                            <div className="space-y-4">
                              <Label htmlFor="dispensary">Select Dispensary *</Label>
                              <Select
                                value={selectedDispensary}
                                onValueChange={setSelectedDispensary}
                                disabled={isLoading || !selectedDoctor}
                              >
                                <SelectTrigger id="dispensary" className="w-full">
                                  <SelectValue placeholder={!selectedDoctor ? "Select doctor first" : "Choose a dispensary"} />
                                </SelectTrigger>
                                <SelectContent>
                                  {dispensaries.length === 0 ? (
                                    <div className="px-2 py-1.5 text-sm text-gray-500">
                                      {!selectedDoctor ? "Select a doctor first" : "No dispensaries available"}
                                    </div>
                                  ) : (
                                    dispensaries.map((dispensary) => (
                                      <SelectItem key={dispensary.id} value={dispensary.id}>
                                        {dispensary.name}
                                      </SelectItem>
                                    ))
                                  )}
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          {isDispensaryUser && (
                            <div className="space-y-4">
                              <Label htmlFor="dispensary">Dispensary {dispensaries.length > 1 ? '*' : ''}</Label>
                              {dispensaries.length > 1 ? (
                                <Select
                                  value={selectedDispensary}
                                  onValueChange={setSelectedDispensary}
                                  disabled={isLoading}
                                >
                                  <SelectTrigger id="dispensary" className="w-full">
                                    <SelectValue placeholder="Choose a dispensary" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {dispensaries.map((dispensary) => (
                                      <SelectItem key={dispensary.id} value={dispensary.id}>
                                        {dispensary.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : dispensaries.length === 1 ? (
                                <>
                                  <div className="px-3 py-2 border border-input bg-muted rounded-md text-sm text-muted-foreground">
                                    {dispensaries[0].name}
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    Your assigned dispensary
                                  </p>
                                </>
                              ) : (
                                <div className="text-sm text-red-500">No dispensaries assigned</div>
                              )}
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="space-y-4">
                            <Label htmlFor="dispensary">Select Dispensary *</Label>
                            <Select
                              value={selectedDispensary}
                              onValueChange={setSelectedDispensary}
                              disabled={isLoading}
                            >
                              <SelectTrigger id="dispensary" className="w-full">
                                <SelectValue placeholder="Choose a dispensary" />
                              </SelectTrigger>
                              <SelectContent>
                                {dispensaries.length === 0 ? (
                                  <div className="px-2 py-1.5 text-sm text-gray-500">No dispensaries available</div>
                                ) : (
                                  dispensaries.map((dispensary) => (
                                    <SelectItem key={dispensary.id} value={dispensary.id}>
                                      {dispensary.name}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-4">
                            <Label htmlFor="doctor">Select Doctor *</Label>
                            <Select
                              value={selectedDoctor}
                              onValueChange={setSelectedDoctor}
                              disabled={isLoading || !selectedDispensary}
                            >
                              <SelectTrigger id="doctor" className="w-full">
                                <SelectValue placeholder={!selectedDispensary ? "Select dispensary first" : "Choose a doctor"} />
                              </SelectTrigger>
                              <SelectContent>
                                {doctors.length === 0 ? (
                                  <div className="px-2 py-1.5 text-sm text-gray-500">
                                    {!selectedDispensary ? "Select a dispensary first" : "No doctors available"}
                                  </div>
                                ) : (
                                  doctors.map((doctor) => (
                                    <SelectItem key={doctor.id} value={doctor.id}>
                                      {doctor.name} - {doctor.specialization}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Availability Preview - Show when both doctor and dispensary are selected, but no date yet */}
                    {selectedDoctor && selectedDispensary && !selectedDate && (
                      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                        <CardHeader>
                          <CardTitle className="text-blue-800">Doctor Availability Preview</CardTitle>
                          <p className="text-sm text-blue-600">Next available days and session times</p>
                        </CardHeader>
                        <CardContent>
                          {isLoadingPreview ? (
                            <div className="flex items-center justify-center py-8">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                              <span className="ml-3 text-blue-600 font-medium">Loading availability...</span>
                            </div>
                          ) : availabilityPreview?.available && availabilityPreview.availableDays?.length > 0 ? (
                            <div className="space-y-3">
                              {availabilityPreview.availableDays.slice(0, 5).map((day: any, index: number) => (
                                <div key={index} className="p-4 bg-white rounded-lg border border-blue-200">
                                  <div className="flex items-center justify-between mb-2">
                                    <div>
                                      <p className="font-semibold text-blue-800">
                                        {new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                      </p>
                                      <p className="text-sm text-gray-600">
                                        Session: {day.startTime} - {day.endTime}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-sm font-semibold text-green-700">
                                        {day.remainingSlots > 0 ? `${day.remainingSlots} slots available` : 'Fully booked'}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {day.bookingsDone}/{day.maxPatients} booked
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              <p className="text-xs text-gray-500 mt-2">
                                Select a date from the calendar below to proceed with booking
                              </p>
                            </div>
                          ) : (
                            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <p className="text-yellow-800">
                                {availabilityPreview?.message || 'No availability information available'}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* Date Selection - Only enabled when both doctor and dispensary are selected */}
                    <div className="space-y-4">
                      <Label htmlFor="date">Select Date {selectedDoctor && selectedDispensary ? '*' : '(Select doctor and dispensary first)'}</Label>
                      <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen} modal={true}>
                        <PopoverTrigger asChild>
                          <Button
                            id="date"
                            variant="ghost"
                            disabled={!selectedDoctor || !selectedDispensary}
                            className={cn(
                              "w-full justify-start text-left font-normal h-10 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 border border-input bg-white hover:bg-gray-50",
                              !selectedDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {selectedDate ? format(selectedDate, 'MMM dd, yyyy') : 'Select Date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-auto p-0 z-[99999]"
                          align="start"
                          side="bottom"
                          sideOffset={8}
                          avoidCollisions={true}
                          collisionPadding={8}
                          onOpenAutoFocus={(e) => e.preventDefault()}
                        >
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={(date) => {
                              setSelectedDate(date);
                              setDatePickerOpen(false);
                            }}
                            disabled={(date) => {
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              return date < today || date > addDays(today, 30);
                            }}
                            initialFocus
                            className="rounded-xl border border-medicalGreen-200 shadow-lg"
                          />
                        </PopoverContent>
                      </Popover>
                      {selectedDate && (
                        <p className="text-sm text-gray-500">
                          Selected: {format(selectedDate, 'yyyy-MM-dd')}
                        </p>
                      )}
                    </div>

                    {/* Availability Display */}
                    {selectedDoctor && selectedDispensary && selectedDate && (
                      <div className="space-y-4 mt-6">
                        <Label>Available Appointment</Label>

                        {isLoading ? (
                          <div className="text-center py-8">Loading appointment information...</div>
                        ) : !availability ? (
                          <Alert variant="destructive" className="my-4">
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>Failed to load appointment information.</AlertDescription>
                          </Alert>
                        ) : !availability.available ? (
                          <Alert variant={availability.reason === 'absent' ? 'destructive' : 'default'} className="my-4">
                            <AlertTitle>
                              {availability.reason === 'absent' ? (
                                <div className="flex items-center">
                                  <CalendarX className="h-4 w-4 mr-2" />
                                  Not Available
                                </div>
                              ) : (
                                <div className="flex items-center">
                                  <CalendarClock className="h-4 w-4 mr-2" />
                                  No Schedule
                                </div>
                              )}
                            </AlertTitle>
                            <AlertDescription>{availability.message}</AlertDescription>
                          </Alert>
                        ) : availability.slots && availability.slots.length > 0 ? (
                          <div className="space-y-4">
                            {availability.isModified && (
                              <Alert className="my-4 bg-amber-50 border-amber-200">
                                <AlertTitle className="text-amber-800 flex items-center">
                                  <CalendarClock className="h-4 w-4 mr-2" />
                                  Modified Schedule
                                </AlertTitle>
                                <AlertDescription className="text-amber-700">
                                  The doctor's schedule has been adjusted for this date.
                                  Time: {availability.sessionInfo?.startTime} - {availability.sessionInfo?.endTime}
                                </AlertDescription>
                              </Alert>
                            )}
                            <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg hover:shadow-xl transition-all duration-300">
                              <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center space-x-3">
                                    <div className="bg-green-500 p-2 rounded-full">
                                      <User className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                      <h3 className="font-bold text-lg text-green-800">Appointment #{availability.slots[0].appointmentNumber}</h3>
                                    </div>
                                  </div>
                                  <div className="bg-green-100 px-3 py-1 rounded-full">
                                    <span className="text-sm font-semibold text-green-800">Available</span>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div className="flex items-center space-x-3">
                                    <div className="bg-blue-100 p-2 rounded-lg">
                                      <Clock className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                      <p className="text-sm text-gray-600">Appointment Time</p>
                                      <p className="font-bold text-lg text-blue-700">{availability.slots[0].estimatedTime}</p>
                                    </div>
                                  </div>

                                  <div className="flex items-center space-x-3">
                                    <div className="bg-orange-100 p-2 rounded-lg">
                                      <Clock className="h-5 w-5 text-orange-600" />
                                    </div>
                                    <div>
                                      <p className="text-sm text-gray-600">Duration</p>
                                      <p className="font-bold text-lg text-orange-700">{availability.slots[0].minutesPerPatient} minutes</p>
                                    </div>
                                  </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-green-200">
                                  <div className="flex items-center justify-center space-x-2 text-green-700">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                    <span className="text-sm font-medium">Ready for booking</span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        ) : (
                          <Alert variant="destructive" className="my-4">
                            <AlertTitle>Not Available</AlertTitle>
                            <AlertDescription>No appointments available for this date. Please select another date.</AlertDescription>
                          </Alert>
                        )}
                      </div>
                    )}

                    {/* Continue Button */}
                    <div className="mt-6 flex justify-end">
                      <Button
                        onClick={() => setCurrentStep(1)}
                        disabled={!selectedDoctor || !selectedDispensary || !selectedDate || !availability?.available || !availability.slots?.length}
                        className="bg-medical-600 hover:bg-medical-700"
                      >
                        Continue
                      </Button>
                    </div>
                  </div>
                ) : (
                  <BookingStep2
                    key={`${selectedDoctor}-${selectedDispensary}-${selectedDate?.getTime()}-${currentStep}`}
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
                      key={`adjust-${selectedDoctor}-${selectedDispensary}-${selectedDate?.getTime()}`}
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
                      disableDispensarySelection={isDispensaryUser}
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
