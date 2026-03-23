import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Doctor, Dispensary } from '@/api/models';
import { DoctorService } from '@/api/services';
import { TimeSlotAvailability, AvailableTimeSlot, SessionAvailability } from '@/api/services/TimeSlotService';
import { User, Clock, CalendarX, CalendarClock, CalendarIcon, UserRoundCheck } from 'lucide-react';
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
  showCalendar?: boolean;
  disableDispensarySelection?: boolean;
  disabledDates?: string[];
  // Session selection callback for multi-session support
  selectedSession?: string;
  onSessionChange?: (sessionId: string) => void;
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
  showCalendar,
  disableDispensarySelection = false,
  disabledDates = [],
  selectedSession,
  onSessionChange,
}) => {
  const disabledDateSet = new Set(disabledDates);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [activeReplacement, setActiveReplacement] = useState<any>(null);

  // Fetch active replacement when doctor, dispensary and date are all selected
  useEffect(() => {
    const fetchReplacement = async () => {
      if (!selectedDoctor || !selectedDispensary || !selectedDate) {
        setActiveReplacement(null);
        return;
      }
      try {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const replacement = await DoctorService.getActiveReplacement(selectedDoctor, selectedDispensary, dateStr);
        setActiveReplacement(replacement || null);
      } catch {
        setActiveReplacement(null);
      }
    };
    fetchReplacement();
  }, [selectedDoctor, selectedDispensary, selectedDate]);

  const hasMultipleSessions = availability?.sessions && availability.sessions.length > 1;
  const availableSessions = availability?.sessions?.filter(s => s.availableSlots > 0) || [];

  // Auto-select first available session when sessions change
  useEffect(() => {
    if (hasMultipleSessions && availableSessions.length > 0 && onSessionChange) {
      if (!selectedSession || !availableSessions.find(s => s.timeSlotConfigId === selectedSession)) {
        onSessionChange(availableSessions[0].timeSlotConfigId);
      }
    }
  }, [availability?.sessions]);

  // Get the currently active session's slot
  const getActiveSlot = (): AvailableTimeSlot | null => {
    if (hasMultipleSessions && selectedSession) {
      const session = availability?.sessions?.find(s => s.timeSlotConfigId === selectedSession);
      return session?.slots?.[0] || null;
    }
    return availability?.slots?.[0] || null;
  };

  const getActiveSessionInfo = (): SessionAvailability | null => {
    if (hasMultipleSessions && selectedSession) {
      return availability?.sessions?.find(s => s.timeSlotConfigId === selectedSession) || null;
    }
    return null;
  };

  const activeSlot = getActiveSlot();

  return (
    <>
      <div className={`grid gap-6 mb-6 ${disableDispensarySelection ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
        <div className="space-y-4">
          <Label htmlFor="doctor" className="text-medilab-heading font-semibold font-poppins">Select Doctor</Label>
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

        {!disableDispensarySelection && (
          <div className="space-y-4">
          <Label htmlFor="dispensary" className="text-medilab-heading font-semibold font-poppins">Select Dispensary</Label>
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
        )}

        {disableDispensarySelection && dispensaries.length > 0 && (
          <div className="space-y-4">
            <Label htmlFor="dispensary">Dispensary</Label>
            <div className="px-3 py-2 border border-input bg-muted rounded-md text-sm text-muted-foreground">
              {dispensaries[0].name}
            </div>
            <p className="text-xs text-muted-foreground">
              Your assigned dispensary (cannot be changed)
            </p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <Label htmlFor="date" className="text-medilab-heading font-semibold font-poppins">Select Date</Label>
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
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (date < today || date > addDays(today, 30)) return true;
                const dateStr = format(date, 'yyyy-MM-dd');
                return disabledDateSet.has(dateStr);
              }}
              initialFocus
              className="rounded-xl border border-gray-200 shadow-lg"
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
            <Alert
              variant={availability.reason === 'absent' || availability.reason === 'session_expired' ? 'destructive' : 'default'}
              className={`my-4 ${availability.reason === 'fully_booked' ? 'border-orange-300 bg-orange-50' : ''} ${availability.reason === 'session_expired' ? 'border-amber-300 bg-amber-50' : ''}`}
            >
              <AlertTitle>
                {availability.reason === 'absent' ? (
                  <div className="flex items-center">
                    <CalendarX className="h-4 w-4 mr-2" />
                    Not Available
                  </div>
                ) : availability.reason === 'session_expired' ? (
                  <div className="flex items-center text-amber-800">
                    <Clock className="h-4 w-4 mr-2" />
                    Session Expired
                  </div>
                ) : availability.reason === 'fully_booked' ? (
                  <div className="flex items-center text-orange-800">
                    <CalendarClock className="h-4 w-4 mr-2" />
                    Fully Booked
                  </div>
                ) : (
                  <div className="flex items-center">
                    <CalendarClock className="h-4 w-4 mr-2" />
                    No Schedule
                  </div>
                )}
              </AlertTitle>
              <AlertDescription className={
                availability.reason === 'session_expired' ? 'text-amber-700' :
                availability.reason === 'fully_booked' ? 'text-orange-700' : ''
              }>
                {availability.message}
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {/* Replacement Doctor Warning */}
              {activeReplacement && (
                <Alert className="border-amber-300 bg-amber-50">
                  <AlertTitle className="text-amber-800 flex items-center">
                    <UserRoundCheck className="h-4 w-4 mr-2" />
                    Replacement Doctor
                  </AlertTitle>
                  <AlertDescription className="text-amber-700">
                    Please note: <strong>{activeReplacement.replacementName}</strong> will be attending
                    in place of <strong>{doctors.find(d => d.id === selectedDoctor)?.name}</strong> from{' '}
                    {format(new Date(activeReplacement.startDate), 'MMM dd, yyyy')} to{' '}
                    {format(new Date(activeReplacement.endDate), 'MMM dd, yyyy')}.
                  </AlertDescription>
                </Alert>
              )}

              {/* Session Selector - shown when multiple sessions exist */}
              {hasMultipleSessions && (
                <div className="space-y-2">
                  <Label className="text-medilab-heading font-semibold font-poppins">Select Session</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {availability.sessions!.map((session) => {
                      const isSelected = selectedSession === session.timeSlotConfigId;
                      const hasSlots = session.availableSlots > 0;
                      return (
                        <button
                          key={session.timeSlotConfigId}
                          onClick={() => hasSlots && onSessionChange?.(session.timeSlotConfigId)}
                          disabled={!hasSlots}
                          className={cn(
                            "p-4 rounded-xl border-2 text-left transition-all duration-200",
                            isSelected
                              ? "border-[#1977cc] bg-[#f1f7fd] shadow-md"
                              : hasSlots
                                ? "border-gray-200 hover:border-[#1977cc]/50 hover:bg-gray-50"
                                : "border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed"
                          )}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className={cn(
                              "font-semibold text-sm",
                              isSelected ? "text-[#1977cc]" : "text-gray-700"
                            )}>
                              {session.startTime} - {session.endTime}
                            </span>
                            {session.isModified && (
                              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Modified</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {hasSlots ? (
                              <span>{session.availableSlots} slot{session.availableSlots !== 1 ? 's' : ''} available</span>
                            ) : (
                              <span className="text-red-500">Fully booked</span>
                            )}
                            <span className="mx-1">|</span>
                            <span>{session.bookedSlots}/{session.totalSlots} booked</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Modified schedule alert */}
              {(hasMultipleSessions ? getActiveSessionInfo()?.isModified : availability.isModified) && (
                <Alert className="my-4 bg-amber-50 border-amber-200">
                  <AlertTitle className="text-amber-800 flex items-center">
                    <CalendarClock className="h-4 w-4 mr-2" />
                    Modified Schedule
                  </AlertTitle>
                  <AlertDescription className="text-amber-700">
                    The doctor's schedule has been adjusted for this date.
                    {hasMultipleSessions && getActiveSessionInfo() && (
                      <> Time: {getActiveSessionInfo()!.startTime} - {getActiveSessionInfo()!.endTime}</>
                    )}
                    {!hasMultipleSessions && availability.sessionInfo && (
                      <> Time: {availability.sessionInfo.startTime} - {availability.sessionInfo.endTime}</>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {/* Appointment card */}
              {activeSlot ? (
                <AppointmentCard appointment={activeSlot} />
              ) : (
                <Alert variant="destructive" className="my-4">
                  <AlertTitle>Not Available</AlertTitle>
                  <AlertDescription>No appointments available for this session. Please select another session or date.</AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <Button
          onClick={onContinue}
          disabled={!selectedDoctor || !selectedDispensary || !selectedDate || !availability?.available || !activeSlot}
          className="bg-[#1977cc] hover:bg-[#3291e6] text-white rounded-full px-8"
        >
          Continue
        </Button>
      </div>
    </>
  );
};

// Extracted appointment card component
const AppointmentCard: React.FC<{ appointment: AvailableTimeSlot }> = ({ appointment }) => (
  <Card className="border-2 border-[#1977cc]/30 bg-gradient-to-r from-[#f1f7fd] to-blue-50 shadow-lg hover:shadow-xl transition-all duration-300">
    <CardContent className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="bg-[#1977cc] p-2 rounded-full">
            <User className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-medilab-heading font-poppins">Appointment #{appointment.appointmentNumber}</h3>
          </div>
        </div>
        <div className="bg-[#1977cc]/10 px-3 py-1 rounded-full">
          <span className="text-sm font-semibold text-[#1977cc]">Available</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center space-x-3">
          <div className="bg-[#1977cc]/10 p-2 rounded-lg">
            <Clock className="h-5 w-5 text-[#1977cc]" />
          </div>
          <div>
            <p className="text-sm text-medilab-body">Appointment Time</p>
            <p className="font-bold text-lg text-[#1977cc]">{appointment.estimatedTime}</p>
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

      <div className="mt-4 pt-4 border-t border-[#1977cc]/20">
        <div className="flex items-center justify-center space-x-2 text-[#1977cc]">
          <div className="w-2 h-2 bg-[#1977cc] rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">Ready for booking</span>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default BookingStep1;
