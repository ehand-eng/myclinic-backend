import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DoctorService, DispensaryService } from '@/api/services';
import { Doctor, Dispensary } from '@/api/models';
import { format, addDays } from 'date-fns';
import { CalendarIcon, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

const HeroBookingForm = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [dispensaries, setDispensaries] = useState<Dispensary[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [selectedDispensary, setSelectedDispensary] = useState<string>('');
  const [selectedDoctorData, setSelectedDoctorData] = useState<Doctor | null>(null);
  const [selectedDispensaryData, setSelectedDispensaryData] = useState<Dispensary | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDispensaries, setIsLoadingDispensaries] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // Load only doctors on initial page load — dispensaries are NOT loaded here
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setIsLoading(true);
        const userStr = localStorage.getItem('current_user');
        const user = userStr ? JSON.parse(userStr) : null;

        let doctorsData: Doctor[];
        if (user?.dispensaryIds && user.dispensaryIds.length > 0) {
          doctorsData = await DoctorService.getDoctorsByDispensaryIds(user.dispensaryIds);
        } else {
          doctorsData = await DoctorService.getAllDoctors();
        }
        setDoctors(doctorsData);
      } catch (error) {
        console.error('Error loading doctors:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  // Handle doctor selection — fetch dispensaries for the chosen doctor
  const handleDoctorChange = async (doctorId: string) => {
    setSelectedDoctor(doctorId);
    setSelectedDispensary('');
    setSelectedDispensaryData(null);
    setSelectedDate(undefined); // clear date since allowed range may change
    setDispensaries([]);

    // Store the full doctor object for bookingVisibleDays
    const doctorObj = doctors.find(d => d.id === doctorId) || null;
    setSelectedDoctorData(doctorObj);

    if (!doctorId) return;

    try {
      setIsLoadingDispensaries(true);
      const doctorDispensaries = await DispensaryService.getDispensariesByDoctorId(doctorId);
      setDispensaries(doctorDispensaries);

      // Auto-select if the doctor has exactly one dispensary
      if (doctorDispensaries.length === 1) {
        setSelectedDispensary(doctorDispensaries[0].id);
        setSelectedDispensaryData(doctorDispensaries[0]);
      }
    } catch (error) {
      console.error('Error loading doctor dispensaries:', error);
    } finally {
      setIsLoadingDispensaries(false);
    }
  };

  // Handle dispensary selection
  const handleDispensaryChange = (dispensaryId: string) => {
    setSelectedDispensary(dispensaryId);
    setSelectedDate(undefined); // clear date since allowed range may change
    const dispObj = dispensaries.find(d => d.id === dispensaryId) || null;
    setSelectedDispensaryData(dispObj);
  };

  // Compute dynamic max booking days from doctor and dispensary settings
  const maxBookingDays = (() => {
    const doctorDays = selectedDoctorData?.bookingVisibleDays;
    const dispensaryDays = selectedDispensaryData?.bookingVisibleDays;

    if (doctorDays && dispensaryDays) return Math.min(doctorDays, dispensaryDays);
    if (doctorDays) return doctorDays;
    if (dispensaryDays) return dispensaryDays;
    return 30; // default
  })();

  const handleSubmit = () => {
    const params = new URLSearchParams();
    if (selectedDoctor) params.set('doctorId', selectedDoctor);
    if (selectedDispensary) params.set('dispensaryId', selectedDispensary);
    if (selectedDate) params.set('date', format(selectedDate, 'yyyy-MM-dd'));

    navigate(`/booking?${params.toString()}`);
  };

  const isFormValid = selectedDoctor && selectedDispensary && selectedDate;

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 md:p-8 border border-white/20 hover:shadow-3xl transition-all duration-300">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {/* Doctor Selection — always visible */}
          <div className="space-y-2">
            <Label htmlFor="hero-doctor" className="text-gray-900 text-sm font-semibold">
              Choose a Doctor
            </Label>
            <Select
              value={selectedDoctor}
              onValueChange={handleDoctorChange}
              disabled={isLoading}
            >
              <SelectTrigger
                id="hero-doctor"
                className="w-full h-12 bg-white/90 border-white/30 text-gray-900 placeholder:text-gray-500 hover:bg-white focus:bg-white shadow-lg"
              >
                <SelectValue placeholder="Select Doctor" />
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

          {/* Dispensary Selection — enabled only after doctor is selected */}
          <div className="space-y-2">
            <Label htmlFor="hero-dispensary" className="text-gray-900 text-sm font-semibold">
              Choose a Dispensary
            </Label>
            <Select
              value={selectedDispensary}
              onValueChange={handleDispensaryChange}
              disabled={!selectedDoctor || isLoadingDispensaries}
            >
              <SelectTrigger
                id="hero-dispensary"
                className="w-full h-12 bg-white/90 border-white/30 text-gray-900 placeholder:text-gray-500 hover:bg-white focus:bg-white shadow-lg"
              >
                <SelectValue
                  placeholder={
                    !selectedDoctor
                      ? 'Select a doctor'
                      : isLoadingDispensaries
                        ? 'Loading dispensaries...'
                        : 'Select Dispensary'
                  }
                />
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

          {/* Date Selection */}
          <div className="space-y-2">
            <Label htmlFor="hero-date" className="text-gray-900 text-sm font-semibold">
              Select Date
            </Label>
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="hero-date"
                  variant="outline"
                  className={cn(
                    "w-full h-12 bg-white/90 border-white/30 text-gray-900 hover:bg-white focus:bg-white hover:text-gray-900 focus:text-gray-900 justify-start text-left font-normal shadow-lg",
                    !selectedDate && "text-gray-500"
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
                    return date < today || date > addDays(today, maxBookingDays);
                  }}
                  initialFocus
                  className="rounded-xl border border-medicalGreen-200 shadow-lg"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-6 flex justify-center">
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid || isLoading}
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-lg px-8 py-3 shadow-xl hover:shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Loading...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Search className="h-5 w-5" />
                <span>Find Appointments</span>
              </div>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HeroBookingForm;
