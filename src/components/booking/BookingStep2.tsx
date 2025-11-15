import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AvailableTimeSlot } from '@/api/services/TimeSlotService';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { BookingService } from '@/api/services/BookingService';
import { Calendar, Clock, User, DollarSign, Building, Receipt } from 'lucide-react';

interface BookingStep2Props {
  nextAppointment: AvailableTimeSlot | null;
  selectedDate: Date | undefined;
  name: string;
  phone: string;
  email: string;
  symptoms: string;
  setName: (name: string) => void;
  setPhone: (phone: string) => void;
  setEmail: (email: string) => void;
  setSymptoms: (symptoms: string) => void;
  isLoading: boolean;
  onBack: () => void;
  onConfirm: (fees: any) => void;
  doctorId: string;
  dispensaryId: string;
}

const BookingStep2: React.FC<BookingStep2Props> = ({
  nextAppointment,
  selectedDate,
  name,
  phone,
  email,
  symptoms,
  setName,
  setPhone,
  setEmail,
  setSymptoms,
  isLoading,
  onBack,
  onConfirm,
  doctorId,
  dispensaryId
}) => {
  const [fees, setFees] = useState<any>(null);
  const [feesLoading, setFeesLoading] = useState(false);
  const [feesError, setFeesError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFees = async () => {
      if (!doctorId || !dispensaryId) return;
      setFeesLoading(true);
      setFeesError(null);
      try {
        const data = await BookingService.fetchDoctorDispensaryFees(doctorId, dispensaryId);
        setFees(data);
      } catch (err) {
        setFeesError('Could not fetch fees.');
      } finally {
        setFeesLoading(false);
      }
    };
    fetchFees();
  }, [doctorId, dispensaryId]);

  return (
    <>
      {nextAppointment && selectedDate && (
        <Card className="mb-6 border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-500 p-3 rounded-full">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-blue-800">Appointment Summary</h3>
                  <p className="text-sm text-blue-600">Your appointment details are confirmed</p>
                </div>
              </div>
              <div className="bg-blue-100 px-4 py-2 rounded-full">
                <span className="text-sm font-semibold text-blue-800">Confirmed</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <Calendar className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Appointment Date</p>
                  <p className="font-bold text-lg text-green-700">{format(selectedDate, 'PPP')}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="bg-orange-100 p-2 rounded-lg">
                  <User className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Appointment Number</p>
                  <p className="font-bold text-lg text-orange-700">#{nextAppointment.appointmentNumber}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Clock className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Estimated Time</p>
                  <p className="font-bold text-lg text-purple-700">{nextAppointment.estimatedTime}</p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-blue-200">
              <div className="flex items-center justify-center space-x-2 text-blue-700">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Ready for final confirmation</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6 border-2 border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="bg-emerald-500 p-3 rounded-full">
                <Receipt className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-xl text-emerald-800">Fee Breakdown</h3>
                <p className="text-sm text-emerald-600">Complete payment details</p>
              </div>
            </div>
            <div className="bg-emerald-100 px-4 py-2 rounded-full">
              <span className="text-sm font-semibold text-emerald-800">Transparent Pricing</span>
            </div>
          </div>

          {feesLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              <span className="ml-3 text-emerald-600 font-medium">Loading fees...</span>
            </div>
          )}
          
          {feesError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <div className="bg-red-100 p-2 rounded-full">
                  <DollarSign className="h-5 w-5 text-red-600" />
                </div>
                <span className="text-red-700 font-medium">{feesError}</span>
              </div>
            </div>
          )}
          
          {fees && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg border border-green-200 shadow-sm">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">Doctor Fee</p>
                      <p className="font-bold text-lg text-blue-700">Rs {fees.doctorFee}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-green-200 shadow-sm">
                  <div className="flex items-center space-x-3">
                    <div className="bg-orange-100 p-2 rounded-lg">
                      <Building className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">Dispensary Fee</p>
                      <p className="font-bold text-lg text-orange-700">Rs {fees.dispensaryFee}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-green-200 shadow-sm">
                  <div className="flex items-center space-x-3">
                    <div className="bg-purple-100 p-2 rounded-lg">
                      <DollarSign className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">Booking Commission</p>
                      <p className="font-bold text-lg text-purple-700">Rs {fees.bookingCommission}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-emerald-100 to-green-100 p-6 rounded-lg border-2 border-emerald-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-emerald-500 p-3 rounded-full">
                      <Receipt className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-emerald-800">Total Amount</p>
                      <p className="text-sm text-emerald-600">Inclusive of all charges</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-emerald-800">Rs {fees.totalFee}</p>
                    <p className="text-sm text-emerald-600">One-time payment</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-6">
        <div>
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your full name"
            required
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter your phone number"
            required
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="email">Email (Optional)</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="symptoms">Symptoms (Optional)</Label>
          <Input
            id="symptoms"
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="Briefly describe your symptoms"
            className="mt-1"
          />
        </div>
        <div className="pt-4 flex justify-between">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button
            onClick={() => onConfirm(fees)}
            disabled={isLoading || !name || !phone || !fees}
            className="bg-medical-600 hover:bg-medical-700"
          >
            {isLoading ? 'Processing...' : 'Confirm Booking'}
          </Button>
        </div>
      </div>
    </>
  );
};

export default BookingStep2;

