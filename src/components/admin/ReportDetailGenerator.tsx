
import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from 'date-fns';
import { DoctorService, DispensaryService, TimeSlotService, BookingService } from '@/api/services';
import { Doctor, Dispensary, Booking } from '@/api/models';
import { TimeSlotAvailability } from '@/api/services/TimeSlotService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Printer, Download } from 'lucide-react';

const ReportDetailGenerator = () => {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [selectedDispensary, setSelectedDispensary] = useState<string>('');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [dispensaries, setDispensaries] = useState<Dispensary[]>([]);
  const [timeSlotInfo, setTimeSlotInfo] = useState<TimeSlotAvailability | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [isReportGenerated, setIsReportGenerated] = useState(false);

  // Load doctors and dispensaries
  React.useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch all doctors
        const allDoctors = await DoctorService.getAllDoctors();
        setDoctors(allDoctors);
        
        // Fetch all dispensaries
        const allDispensaries = await DispensaryService.getAllDispensaries();
        setDispensaries(allDispensaries);
      } catch (error) {
        console.error('Error loading initial data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load doctors and dispensaries',
          variant: 'destructive'
        });
      }
    };
    
    fetchInitialData();
  }, [toast]);

  // Filter dispensaries when doctor changes
  React.useEffect(() => {
    const fetchDoctorDispensaries = async () => {
      if (!selectedDoctor) return;
      
      try {
        setLoading(true);
        const doctorDispensaries = await DispensaryService.getDispensariesByDoctorId(selectedDoctor);
        setDispensaries(doctorDispensaries);
        
        // Reset selected dispensary if it's not in the filtered list
        if (selectedDispensary && !doctorDispensaries.some(d => d.id === selectedDispensary)) {
          setSelectedDispensary('');
        }
      } catch (error) {
        console.error('Error loading doctor dispensaries:', error);
        toast({
          title: 'Error',
          description: 'Failed to load doctor dispensaries',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchDoctorDispensaries();
  }, [selectedDoctor, selectedDispensary, toast]);

  // Filter doctors when dispensary changes
  React.useEffect(() => {
    const fetchDispensaryDoctors = async () => {
      if (!selectedDispensary) return;
      
      try {
        setLoading(true);
        const dispensaryDoctors = await DoctorService.getDoctorsByDispensaryId(selectedDispensary);
        setDoctors(dispensaryDoctors);
        
        // Reset selected doctor if it's not in the filtered list
        if (selectedDoctor && !dispensaryDoctors.some(d => d.id === selectedDoctor)) {
          setSelectedDoctor('');
        }
      } catch (error) {
        console.error('Error loading dispensary doctors:', error);
        toast({
          title: 'Error',
          description: 'Failed to load dispensary doctors',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchDispensaryDoctors();
  }, [selectedDispensary, selectedDoctor, toast]);

  // Load time slot info when doctor, dispensary, and date are selected
  React.useEffect(() => {
    const fetchTimeSlotInfo = async () => {
      if (!selectedDoctor || !selectedDispensary || !selectedDate) {
        setTimeSlotInfo(null);
        return;
      }
      
      try {
        setLoading(true);
        const availability = await TimeSlotService.getAvailableTimeSlots(
          selectedDoctor,
          selectedDispensary,
          selectedDate
        );
        
        setTimeSlotInfo(availability);
      } catch (error) {
        console.error('Error fetching time slot info:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch time slot information',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchTimeSlotInfo();
  }, [selectedDoctor, selectedDispensary, selectedDate, toast]);

  const handleGenerateReport = async () => {
    if (!selectedDoctor || !selectedDispensary || !selectedDate) {
      toast({
        title: 'Missing Information',
        description: 'Please select doctor, dispensary, and date',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);
      
      // Format date for API
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      
      // Fetch bookings for the selected doctor, dispensary, and date
      const result = await BookingService.getBookingsByDoctorDispensaryDate(
        selectedDoctor, 
        selectedDispensary, 
        formattedDate
      );
      
      setBookings(result);
      setIsReportGenerated(true);
      
      if (result.length === 0) {
        toast({
          title: 'No Bookings',
          description: 'No bookings found for the selected criteria',
        });
      } else {
        toast({
          title: 'Report Generated',
          description: `Found ${result.length} bookings for the selected session`,
        });
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate report',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    toast({
      title: "Export initiated",
      description: "Your report is being prepared for download."
    });
    // In a real implementation, this would generate a CSV or Excel file
  };

  // Find doctor and dispensary names
  const getDoctorName = () => {
    const doctor = doctors.find(d => d.id === selectedDoctor);
    return doctor ? doctor.name : 'Unknown Doctor';
  };

  const getDispensaryName = () => {
    const dispensary = dispensaries.find(d => d.id === selectedDispensary);
    return dispensary ? dispensary.name : 'Unknown Dispensary';
  };

  const getSessionDetails = () => {
    if (!timeSlotInfo || !timeSlotInfo.sessionInfo) return 'No session information available';
    
    const { startTime, endTime } = timeSlotInfo.sessionInfo;
    const isModified = timeSlotInfo.isModified;
    
    return (
      <div className="text-sm">
        <span className="font-medium">Session Time: </span> 
        {startTime} - {endTime}
        {isModified && <span className="ml-2 text-orange-500">(Modified Schedule)</span>}
      </div>
    );
  };

  // Calculate session statistics
  const getSessionStatistics = () => {
    if (!bookings || bookings.length === 0) return null;
    
    const total = bookings.length;
    const completed = bookings.filter(b => b.status === 'completed').length;
    const checkedIn = bookings.filter(b => b.status === 'checked_in').length;
    const cancelled = bookings.filter(b => b.status === 'cancelled').length;
    const noShow = bookings.filter(b => b.status === 'no_show').length;
    const scheduled = bookings.filter(b => b.status === 'scheduled').length;
    
    return (
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 mb-6">
        <div className="bg-gray-50 p-3 rounded-md text-center">
          <div className="text-sm text-gray-500">Total</div>
          <div className="text-xl font-bold">{total}</div>
        </div>
        <div className="bg-blue-50 p-3 rounded-md text-center">
          <div className="text-sm text-blue-500">Scheduled</div>
          <div className="text-xl font-bold text-blue-600">{scheduled}</div>
        </div>
        <div className="bg-amber-50 p-3 rounded-md text-center">
          <div className="text-sm text-amber-500">Checked In</div>
          <div className="text-xl font-bold text-amber-600">{checkedIn}</div>
        </div>
        <div className="bg-green-50 p-3 rounded-md text-center">
          <div className="text-sm text-green-500">Completed</div>
          <div className="text-xl font-bold text-green-600">{completed}</div>
        </div>
        <div className="bg-red-50 p-3 rounded-md text-center">
          <div className="text-sm text-red-500">Cancelled</div>
          <div className="text-xl font-bold text-red-600">{cancelled}</div>
        </div>
        <div className="bg-gray-100 p-3 rounded-md text-center">
          <div className="text-sm text-gray-500">No Show</div>
          <div className="text-xl font-bold text-gray-600">{noShow}</div>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Session Report Generator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="doctor">Doctor</Label>
            <Select 
              value={selectedDoctor} 
              onValueChange={setSelectedDoctor}
              disabled={loading}
            >
              <SelectTrigger id="doctor">
                <SelectValue placeholder="Select Doctor" />
              </SelectTrigger>
              <SelectContent>
                {doctors.map((doctor) => (
                  <SelectItem key={doctor.id} value={doctor.id}>
                    {doctor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="dispensary">Dispensary</Label>
            <Select 
              value={selectedDispensary} 
              onValueChange={setSelectedDispensary}
              disabled={loading}
            >
              <SelectTrigger id="dispensary">
                <SelectValue placeholder="Select Dispensary" />
              </SelectTrigger>
              <SelectContent>
                {dispensaries.map((dispensary) => (
                  <SelectItem key={dispensary.id} value={dispensary.id}>
                    {dispensary.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left"
                  disabled={loading}
                >
                  {selectedDate ? format(selectedDate, 'PPP') : 'Select Date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                  className="rounded-xl border border-medicalGreen-200 shadow-lg medical-card"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {timeSlotInfo && (
          <div className="p-4 rounded-md border border-border">
            <h3 className="font-medium mb-2">Session Information</h3>
            {timeSlotInfo.available ? (
              <>
                {getSessionDetails()}
                <div className="text-sm mt-2">
                  <span className="font-medium">Minutes Per Patient: </span> 
                  {timeSlotInfo.sessionInfo?.minutesPerPatient || 15}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Max Patients: </span> 
                  {timeSlotInfo.sessionInfo?.maxPatients || 'Not specified'}
                </div>
              </>
            ) : (
              <div className="text-red-500">
                {timeSlotInfo.reason === 'absent' 
                  ? 'Doctor is not available on this date' 
                  : timeSlotInfo.message || 'No session available'}
              </div>
            )}
          </div>
        )}

        <Button 
          onClick={handleGenerateReport} 
          disabled={!selectedDoctor || !selectedDispensary || !selectedDate || loading || (timeSlotInfo && !timeSlotInfo.available)}
          className="w-full"
        >
          {loading ? 'Generating...' : 'Generate Report'}
        </Button>

        {isReportGenerated && (
          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                Session Report: {getDoctorName()} at {getDispensaryName()} on {selectedDate ? format(selectedDate, 'PPP') : ''}
              </h3>
              
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handlePrint}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
                <Button size="sm" variant="outline" onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
            
            {getSessionStatistics()}
            
            {bookings.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No bookings found for this session
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Appointment #</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Patient Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell>{booking.appointmentNumber}</TableCell>
                        <TableCell>{booking.estimatedTime}</TableCell>
                        <TableCell>{booking.patientName}</TableCell>
                        <TableCell>{booking.patientPhone}</TableCell>
                        <TableCell>{booking.patientEmail || '-'}</TableCell>
                        <TableCell>
                          <span className={`capitalize ${
                            booking.status === 'scheduled' ? 'text-blue-500' :
                            booking.status === 'completed' ? 'text-green-500' :
                            booking.status === 'cancelled' ? 'text-red-500' :
                            booking.status === 'checked_in' ? 'text-amber-500' : 
                            'text-gray-500'
                          }`}>
                            {booking.status.replace('_', ' ')}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReportDetailGenerator;
