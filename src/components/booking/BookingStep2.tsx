import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AvailableTimeSlot } from '@/api/services/TimeSlotService';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { BookingService } from '@/api/services/BookingService';

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
        <Card className="mb-6 border-primary">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2">Appointment Summary</h3>
            <p>Date: {format(selectedDate, 'PPP')}</p>
            <p>Appointment #: {nextAppointment.appointmentNumber}</p>
            <p>Estimated Time: {nextAppointment.estimatedTime}</p>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardContent className="p-4">
          <h3 className="font-semibold mb-2">Fee Breakdown</h3>
          {feesLoading && <p>Loading fees...</p>}
          {feesError && <p className="text-red-500">{feesError}</p>}
          {fees && (
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Doctor Fee</span>
                <span>Rs {fees.doctorFee}</span>
              </div>
              <div className="flex justify-between">
                <span>Dispensary Fee</span>
                <span>Rs {fees.dispensaryFee}</span>
              </div>
              <div className="flex justify-between">
                <span>Booking Commission</span>
                <span>Rs {fees.bookingCommission}</span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-2 mt-2">
                <span>Total</span>
                <span>Rs {fees.totalFee}</span>
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

