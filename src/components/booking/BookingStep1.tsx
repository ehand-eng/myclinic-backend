import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Doctor, Dispensary } from '@/api/models';
import { TimeSlotAvailability, AvailableTimeSlot } from '@/api/services/TimeSlotService';
import { User, Clock, CalendarX, CalendarClock, CalendarIcon } from 'lucide-react';
import { addDays, format } from 'date-fns';
import { cn } from '@/lib/utils';

interface BookingStep1Props {
  doctors: Doctor[];
  dispensaries: Dispensary[];
  selectedDoctor: string;
  selectedDispensary: string;
  selectedDate: Date | undefined;
  setSelectedDoctor: (doctorId: string) => void;
  setSelectedDispensary: (dispensaryId: string) => void;
  setSelectedDate: (date: Date | undefined) => void;
  availability: TimeSlotAvailability | null;
  isLoading: boolean;
  onContinue: () => void;
  readOnly?: {
    doctor?: boolean;
    dispensary?: boolean;
  };
  showCalendar?: boolean; // when false, hide inline calendar
}

const BookingStep1: React.FC<BookingStep1Props> = ({
  doctors,
  dispensaries,
  selectedDoctor,
  selectedDispensary,
  selectedDate,
  setSelectedDoctor,
  setSelectedDispensary,
  setSelectedDate,
  availability,
  isLoading,
  onContinue,
  readOnly,
  showCalendar
}) => {
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-4">
          <Label htmlFor="doctor">Select Doctor</Label>
          <Select
            value={selectedDoctor}
            onValueChange={setSelectedDoctor}
            disabled={isLoading || readOnly?.doctor}
          >
            <SelectTrigger id="doctor" className="w-full">
              <SelectValue placeholder="Choose a doctor" />
            </SelectTrigger>
            <SelectContent>
              {doctors.map((doctor) => (
                <SelectItem key={doctor.id} value={doctor.id}>
                  {doctor.name} - {doctor.specialization}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-4">
          <Label htmlFor="dispensary">Select Dispensary</Label>
          <Select
            value={selectedDispensary}
            onValueChange={setSelectedDispensary}
            disabled={isLoading || readOnly?.dispensary}
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
        </div>
      </div>
      
      <div className="space-y-4">
        <Label htmlFor="date">Select Date</Label>
        <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
          <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-left font-normal h-10 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 border border-input bg-white hover:bg-gray-50",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, 'MMM dd, yyyy') : 'Select Date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                setSelectedDate(date);
                setDatePickerOpen(false);
              }}
              disabled={(date) => {
                // Disable past dates and dates more than 30 days in the future
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
              <AppointmentCard appointment={availability.slots[0]} />
            </div>
          ) : (
            <Alert variant="destructive" className="my-4">
              <AlertTitle>Not Available</AlertTitle>
              <AlertDescription>No appointments available for this date. Please select another date.</AlertDescription>
            </Alert>
          )}
        </div>
      )}
      
      <div className="mt-6 flex justify-end">
        <Button
          onClick={onContinue}
          disabled={!selectedDoctor || !selectedDispensary || !selectedDate || !availability?.available || !availability.slots?.length}
          className="bg-medical-600 hover:bg-medical-700"
        >
          Continue
        </Button>
      </div>
    </>
  );
};

// Extracted appointment card component
const AppointmentCard: React.FC<{ appointment: AvailableTimeSlot }> = ({ appointment }) => (
  <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg hover:shadow-xl transition-all duration-300">
    <CardContent className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="bg-green-500 p-2 rounded-full">
            <User className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-green-800">Appointment #{appointment.appointmentNumber}</h3>
            <p className="text-sm text-green-600">Your appointment is confirmed</p>
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
            <p className="font-bold text-lg text-blue-700">{appointment.estimatedTime}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="bg-orange-100 p-2 rounded-lg">
            <Clock className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Duration</p>
            <p className="font-bold text-lg text-orange-700">{appointment.minutesPerPatient} minutes</p>
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
);

export default BookingStep1;
