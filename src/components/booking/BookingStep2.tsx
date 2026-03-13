import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AvailableTimeSlot } from '@/api/services/TimeSlotService';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { BookingService } from '@/api/services/BookingService';
import { Calendar, Clock, User, DollarSign, Building, Receipt, CreditCard, Wallet } from 'lucide-react';

interface BookingStep2Props {
  nextAppointment: AvailableTimeSlot | null;
  selectedDate: Date | undefined;
  name: string;
  phone: string;
  email: string;
  setName: (name: string) => void;
  setPhone: (phone: string) => void;
  setEmail: (email: string) => void;
  isLoading: boolean;
  isPayOnlineLoading?: boolean;
  onBack: () => void;
  onConfirm: (fees: any, paymentMethod: 'cash' | 'online') => void;
  onPayOnline?: (fees: any) => void;
  doctorId: string;
  dispensaryId: string;
}

const BookingStep2: React.FC<BookingStep2Props> = ({
  nextAppointment,
  selectedDate,
  name,
  phone,
  email,
  setName,
  setPhone,
  setEmail,
  isLoading,
  isPayOnlineLoading = false,
  onBack,
  onConfirm,
  onPayOnline,
  doctorId,
  dispensaryId
}) => {
  const [fees, setFees] = useState<any>(null);
  const [feesLoading, setFeesLoading] = useState(false);
  const [feesError, setFeesError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    name?: string;
    phone?: string;
    email?: string;
  }>({});

  // Reset validation errors when form fields are cleared (after booking completion)
  useEffect(() => {
    if (!name && !phone && !email) {
      setValidationErrors({});
    }
  }, [name, phone, email]);

  // Validation functions
  const validateName = (value: string) => {
    if (!value || typeof value !== 'string' || !value.trim()) {
      return 'Full name is required';
    }
    if (value.length > 25) {
      return 'Full name must be 25 characters or less';
    }
    return null;
  };

  const validatePhone = (value: string) => {
    if (!value || typeof value !== 'string' || !value.trim()) {
      return 'Phone number is required';
    }
    // Allow + at the beginning, then digits, spaces, and hyphens
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    if (!phoneRegex.test(value)) {
      return 'Please enter a valid phone number';
    }
    // Remove all non-digit characters except + at the beginning
    const digitsOnly = value.replace(/[^\d]/g, '');
    if (digitsOnly.length < 7 || digitsOnly.length > 15) {
      return 'Phone number must be between 7 and 15 digits';
    }
    return null;
  };

  const validateEmail = (value: string) => {
    if (!value || typeof value !== 'string' || !value.trim()) {
      return null; // Email is optional
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'Please enter a valid email address';
    }
    return null;
  };

  const handleNameChange = (value: string) => {
    const safeValue = (value || '').toString();
    if (safeValue.length <= 25) {
      setName(safeValue);
      setValidationErrors(prev => ({ ...prev, name: validateName(safeValue) }));
    }
  };

  const handlePhoneChange = (value: string) => {
    // Strip all whitespace characters immediately as the user types
    const rawValue = value || '';
    const normalizedValue = rawValue.replace(/\s+/g, '');
    setPhone(normalizedValue);
    setValidationErrors(prev => ({ ...prev, phone: validatePhone(normalizedValue) }));
  };

  const handleEmailChange = (value: string) => {
    const safeValue = value || '';
    setEmail(safeValue);
    setValidationErrors(prev => ({ ...prev, email: validateEmail(safeValue) }));
  };

  const isFormValid = () => {
    const safeName = name || '';
    const safePhone = phone || '';
    const safeEmail = email || '';

    const nameError = validateName(safeName);
    const phoneError = validatePhone(safePhone);
    const emailError = validateEmail(safeEmail);

    setValidationErrors({
      name: nameError,
      phone: phoneError,
      email: emailError
    });

    return !nameError && !phoneError && !emailError;
  };

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
        <Card className="mb-6 border border-[#1977cc]/20 bg-gradient-to-r from-[#f1f7fd] to-blue-50 shadow-md hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="bg-[#1977cc] p-3 rounded-full">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-medilab-heading font-poppins">Appointment Summary</h3>
                  <p className="text-sm text-[#1977cc]">Your appointment details</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3">
                <div className="bg-[#1977cc]/10 p-2 rounded-lg">
                  <Calendar className="h-5 w-5 text-[#1977cc]" />
                </div>
                <div>
                  <p className="text-sm text-medilab-body">Appointment Date</p>
                  <p className="font-bold text-lg text-medilab-heading">{format(selectedDate, 'PPP')}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="bg-[#2c4964]/10 p-2 rounded-lg">
                  <User className="h-5 w-5 text-[#2c4964]" />
                </div>
                <div>
                  <p className="text-sm text-medilab-body">Appointment Number</p>
                  <p className="font-bold text-lg text-medilab-heading">#{nextAppointment.appointmentNumber}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="bg-[#1977cc]/10 p-2 rounded-lg">
                  <Clock className="h-5 w-5 text-[#1977cc]" />
                </div>
                <div>
                  <p className="text-sm text-medilab-body">Estimated Time</p>
                  <p className="font-bold text-lg text-[#1977cc]">{nextAppointment.estimatedTime}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#1977cc]/20">
              <div className="flex items-center justify-center space-x-2 text-[#1977cc]">
                <div className="w-2 h-2 bg-[#1977cc] rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Ready for final confirmation</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6 border border-[#1977cc]/20 bg-gradient-to-r from-[#f1f7fd] to-blue-50 shadow-md hover:shadow-lg transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="bg-[#1977cc] p-3 rounded-full">
                <Receipt className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-xl text-medilab-heading font-poppins">Fee Breakdown</h3>
                <p className="text-sm text-[#1977cc]">Complete payment details</p>
              </div>
            </div>
            <div className="bg-[#1977cc]/10 px-4 py-2 rounded-full">
              <span className="text-sm font-semibold text-[#1977cc]">Transparent Pricing</span>
            </div>
          </div>

          {feesLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1977cc]"></div>
              <span className="ml-3 text-[#1977cc] font-medium">Loading fees...</span>
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
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-center space-x-3">
                    <div className="bg-[#1977cc]/10 p-2 rounded-lg">
                      <User className="h-5 w-5 text-[#1977cc]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-medilab-body">Doctor Fee</p>
                      <p className="font-bold text-lg text-medilab-heading">Rs {fees.doctorFee}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-center space-x-3">
                    <div className="bg-[#2c4964]/10 p-2 rounded-lg">
                      <Building className="h-5 w-5 text-[#2c4964]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-medilab-body">Dispensary Fee</p>
                      <p className="font-bold text-lg text-medilab-heading">Rs {fees.dispensaryFee}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-center space-x-3">
                    <div className="bg-[#1977cc]/10 p-2 rounded-lg">
                      <DollarSign className="h-5 w-5 text-[#1977cc]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-medilab-body">Booking Commission</p>
                      <p className="font-bold text-lg text-medilab-heading">Rs {fees.bookingCommission}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-[#1977cc]/10 to-[#1977cc]/5 p-6 rounded-lg border-2 border-[#1977cc]/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-[#1977cc] p-3 rounded-full">
                      <Receipt className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-medilab-heading">Total Amount</p>
                      <p className="text-sm text-[#1977cc]">Inclusive of all charges</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-[#1977cc]">Rs {fees.totalFee}</p>
                    <p className="text-sm text-medilab-body">One-time payment</p>
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
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Enter your full name"
            required
            className={`mt-1 ${validationErrors.name ? 'border-red-500' : ''}`}
            maxLength={25}
          />
          {validationErrors.name && (
            <p className="text-red-500 text-sm mt-1">{validationErrors.name}</p>
          )}
          <p className="text-gray-500 text-xs mt-1">{(name?.length || 0)}/25 characters</p>
        </div>

        <div>
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            value={phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            placeholder="Enter your phone number"
            required
            className={`mt-1 ${validationErrors.phone ? 'border-red-500' : ''}`}
          />
          {validationErrors.phone && (
            <p className="text-red-500 text-sm mt-1">{validationErrors.phone}</p>
          )}
          <p className="text-gray-500 text-xs mt-1">
            Enter a valid phone number because we are using this number to send you the SMS with OTP/booking details/etc...
            (Ex: +94 777 123 456 or 0777123456)
          </p>
        </div>

        <div>
          <Label htmlFor="email">Email (Optional)</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            placeholder="Enter your email"
            className={`mt-1 ${validationErrors.email ? 'border-red-500' : ''}`}
          />
          {validationErrors.email && (
            <p className="text-red-500 text-sm mt-1">{validationErrors.email}</p>
          )}
        </div>

        <div className="pt-6 space-y-4">
          {/* Payment Options Info */}
          <div className="bg-gradient-to-r from-[#f1f7fd] to-blue-50 p-4 rounded-lg border border-[#1977cc]/20">
            <h4 className="font-semibold text-medilab-heading mb-2 flex items-center font-poppins">
              <CreditCard className="h-5 w-5 mr-2" />
              Choose Payment Method
            </h4>
            <p className="text-sm text-[#1977cc]">
              You can pay online now or pay at the clinic during your visit.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" onClick={onBack} className="order-3 sm:order-1">
              Back
            </Button>

            {/* Pay Online Button */}
            {onPayOnline && (
              <Button
                onClick={() => {
                  if (isFormValid()) {
                    onPayOnline(fees);
                  }
                }}
                disabled={isPayOnlineLoading || isLoading || !name || !phone || !fees || !!validationErrors.name || !!validationErrors.phone || !!validationErrors.email}
                className="flex-1 order-1 sm:order-2 bg-[#1977cc] hover:bg-[#3291e6] text-white rounded-full"
              >
                {isPayOnlineLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pay Online (Rs {fees?.totalFee || 0})
                  </>
                )}
              </Button>
            )}

            {/* Confirm Booking (Pay at Clinic) Button */}
            <Button
              onClick={() => {
                if (isFormValid()) {
                  onConfirm(fees, 'cash');
                }
              }}
              disabled={isLoading || isPayOnlineLoading || !name || !phone || !fees || !!validationErrors.name || !!validationErrors.phone || !!validationErrors.email}
              variant="outline"
              className="flex-1 order-2 sm:order-3 border-[#1977cc] text-[#1977cc] hover:bg-[#f1f7fd] rounded-full"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-medical-600 mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Wallet className="h-4 w-4 mr-2" />
                  Confirm (Pay at Clinic)
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default BookingStep2;

