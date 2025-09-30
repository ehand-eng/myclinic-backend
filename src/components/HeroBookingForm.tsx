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
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // Load initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        const userStr = localStorage.getItem('current_user');
        const user = userStr ? JSON.parse(userStr) : null;
        
        if (user?.dispensaryIds && user.dispensaryIds.length > 0) {
          const [doctorsData, dispensariesData] = await Promise.all([
            DoctorService.getDoctorsByDispensaryIds(user.dispensaryIds),
            DispensaryService.getDispensariesByIds(user.dispensaryIds)
          ]);
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
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInitialData();
  }, []);

  // Filter dispensaries when doctor changes
  useEffect(() => {
    const fetchDoctorDispensaries = async () => {
      if (!selectedDoctor || selectedDispensary) return;
      
      try {
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
      if (!selectedDispensary || selectedDoctor) return;
      
      try {
        setIsLoading(true);
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

  const handleSubmit = () => {
    // Navigate to booking page with selected values
    const params = new URLSearchParams();
    if (selectedDoctor) params.set('doctorId', selectedDoctor);
    if (selectedDispensary) params.set('dispensaryId', selectedDispensary);
    if (selectedDate) params.set('date', format(selectedDate, 'yyyy-MM-dd'));
    
    navigate(`/booking?${params.toString()}`);
  };

  const isFormValid = selectedDoctor && selectedDispensary && selectedDate;

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 md:p-8 border border-white/20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {/* Doctor Selection */}
          <div className="space-y-2">
            <Label htmlFor="hero-doctor" className="text-gray-900 text-sm font-semibold">
              Choose a Doctor
            </Label>
            <Select
              value={selectedDoctor}
              onValueChange={setSelectedDoctor}
              disabled={isLoading}
            >
              <SelectTrigger 
                id="hero-doctor" 
                className="w-full h-12 bg-white/90 border-white/30 text-gray-900 placeholder:text-gray-500 hover:bg-white focus:bg-white"
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

          {/* Dispensary Selection */}
          <div className="space-y-2">
            <Label htmlFor="hero-dispensary" className="text-gray-900 text-sm font-semibold">
              Choose a Dispensary
            </Label>
            <Select
              value={selectedDispensary}
              onValueChange={setSelectedDispensary}
              disabled={isLoading}
            >
              <SelectTrigger 
                id="hero-dispensary" 
                className="w-full h-12 bg-white/90 border-white/30 text-gray-900 placeholder:text-gray-500 hover:bg-white focus:bg-white"
              >
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
                    "w-full h-12 bg-white/90 border-white/30 text-gray-900 placeholder:text-gray-500 hover:bg-white focus:bg-white justify-start text-left font-normal",
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
