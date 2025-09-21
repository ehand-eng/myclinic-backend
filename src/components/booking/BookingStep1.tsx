import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Doctor, Dispensary } from '@/api/models';
import { TimeSlotAvailability, AvailableTimeSlot } from '@/api/services/TimeSlotService';
import { User, Clock, CalendarX, CalendarClock } from 'lucide-react';
import { addDays, format } from 'date-fns';

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
  readOnly
}) => {
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
        <Label>Select Date</Label>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          disabled={(date) => {
            // Disable past dates and dates more than 30 days in the future
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return date < today || date > addDays(today, 30);
          }}
          className="rounded-xl border border-medicalGreen-200 shadow-lg mx-auto medical-card"
          formatters={{
            formatCaption: (date) => format(date, 'yyyy-MM-dd'),
            formatDay: (date) => format(date, 'd'),
            formatMonthCaption: (date) => format(date, 'yyyy-MM'),
            formatWeekdayName: (date) => format(date, 'EEE'),
            formatYearCaption: (date) => format(date, 'yyyy')
          }}
        />
        {selectedDate && (
          <p className="text-sm text-gray-500 text-center">
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
  <Card className="border-primary">
    <CardContent className="p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <User className="h-5 w-5 mr-2 text-primary" />
          <span className="font-medium">Appointment #{appointment.appointmentNumber}</span>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center text-gray-600">
          <Clock className="h-4 w-4 mr-1" />
          <span>{appointment.estimatedTime}</span>
        </div>
        <span className="text-sm bg-gray-100 px-2 py-1 rounded">
          {appointment.minutesPerPatient} mins
        </span>
      </div>
    </CardContent>
  </Card>
);

export default BookingStep1;
