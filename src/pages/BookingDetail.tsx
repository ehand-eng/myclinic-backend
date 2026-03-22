import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminHeader from '@/components/AdminHeader';
import AdminFooter from '@/components/AdminFooter';
import { BookingService } from '@/api/services';
import { BookingStatus } from '@/api/models';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Calendar,
  User,
  Building2,
  Clock,
  Stethoscope,
  CreditCard,
  Loader2,
  LogOut,
  TimerReset,
  CheckCircle2
} from 'lucide-react';

const getStatusBadge = (status: string) => {
  switch (status) {
    case BookingStatus.CHECKED_IN:
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Checked In</Badge>;
    case BookingStatus.SCHEDULED:
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Booked</Badge>;
    case BookingStatus.COMPLETED:
      return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Completed</Badge>;
    case BookingStatus.CANCELLED:
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Cancelled</Badge>;
    case BookingStatus.NO_SHOW:
      return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">No Show</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

const BookingDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [booking, setBooking] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [now, setNow] = useState(new Date());

  // Tick every second for checkout timer
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchBooking = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const data = await BookingService.getBookingById(id);
        setBooking(data);
      } catch (error) {
        console.error('Error fetching booking:', error);
        toast({
          title: 'Error',
          description: 'Failed to load booking details',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchBooking();
  }, [id, toast]);

  const navigateBack = () => {
    const dateStr = booking?.bookingDate
      ? format(new Date(booking.bookingDate), 'yyyy-MM-dd')
      : undefined;
    navigate(dateStr ? `/admin/bookings?date=${dateStr}` : '/admin/bookings');
  };

  const handleCheckIn = async () => {
    if (!id) return;
    try {
      setIsCheckingIn(true);
      const updated = await BookingService.checkInBooking(id);
      setBooking((prev: any) => prev ? { ...prev, status: updated.status, checkedInTime: updated.checkedInTime } : prev);
      toast({ title: 'Success', description: 'Patient checked in successfully.' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to check in patient',
        variant: 'destructive'
      });
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    if (!id) return;
    try {
      setIsCheckingOut(true);
      const updated = await BookingService.checkOutBooking(id);
      setBooking((prev: any) => prev ? { ...prev, status: updated.status, checkedInTime: updated.checkedInTime, completedTime: updated.completedTime } : prev);
      toast({
        title: 'Success',
        description: updated.status === BookingStatus.SCHEDULED
          ? 'Patient check-in has been reverted.'
          : 'Patient checked out successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to check out patient',
        variant: 'destructive'
      });
    } finally {
      setIsCheckingOut(false);
    }
  };

  const getCheckoutRemainingSeconds = (): number => {
    if (!booking?.checkedInTime) return 0;
    const checkedInAt = new Date(booking.checkedInTime);
    const expiresAt = new Date(checkedInAt.getTime() + 5 * 60 * 1000);
    const diffMs = expiresAt.getTime() - now.getTime();
    if (diffMs <= 0) return 0;
    return Math.floor(diffMs / 1000);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <AdminHeader />
        <main className="flex-grow bg-gradient-to-br from-medicalBlue-50 via-white to-medicalTeal-50">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-3" />
              <p>Loading booking details...</p>
            </div>
          </div>
        </main>
        <AdminFooter />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex flex-col min-h-screen">
        <AdminHeader />
        <main className="flex-grow bg-gradient-to-br from-medicalBlue-50 via-white to-medicalTeal-50">
          <div className="container mx-auto px-4 py-8">
            <Card>
              <CardHeader>
                <CardTitle>Booking Not Found</CardTitle>
                <CardDescription>The booking may have been removed or the ID is invalid.</CardDescription>
              </CardHeader>
              <CardFooter>
                <Button onClick={() => navigate('/admin/bookings')}>Back to Bookings</Button>
              </CardFooter>
            </Card>
          </div>
        </main>
        <AdminFooter />
      </div>
    );
  }

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const bookingDateStr = booking.bookingDate ? format(new Date(booking.bookingDate), 'yyyy-MM-dd') : '';
  const isToday = bookingDateStr === todayStr;
  const isFuture = bookingDateStr > todayStr;

  const doctorName = typeof booking.doctorId === 'object' ? booking.doctorId?.name : '—';
  const doctorSpec = typeof booking.doctorId === 'object' ? booking.doctorId?.specialization : '—';
  const dispensaryName = typeof booking.dispensaryId === 'object' ? booking.dispensaryId?.name : '—';
  const dispensaryAddress = typeof booking.dispensaryId === 'object' ? booking.dispensaryId?.address : '—';
  const remaining = getCheckoutRemainingSeconds();
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  return (
    <div className="flex flex-col min-h-screen">
      <AdminHeader />
      <main className="flex-grow bg-gradient-to-br from-medicalBlue-50 via-white to-medicalTeal-50">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Back button + Title row */}
          <div className="mb-6 flex items-center justify-between">
            <Button variant="ghost" onClick={navigateBack} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Bookings
            </Button>
            <div className="flex items-center gap-2">
              {getStatusBadge(booking.status)}
            </div>
          </div>

          {/* Title card */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle className="text-xl">Booking Details</CardTitle>
                  <CardDescription className="mt-1">
                    Transaction ID: {booking.transactionId || booking.id}
                    {booking.appointmentNumber != null && ` • Appointment #${booking.appointmentNumber}`}
                  </CardDescription>
                </div>
                {/* Action buttons */}
                <div className="flex items-center gap-2">
                  {booking.status === BookingStatus.SCHEDULED && (
                    <div className="flex flex-col items-end gap-1">
                      <Button onClick={handleCheckIn} disabled={!isToday || isCheckingIn}>
                        {isCheckingIn ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Checking In...</>
                        ) : (
                          <><CheckCircle2 className="h-4 w-4 mr-2" />Check-In Patient</>
                        )}
                      </Button>
                      {!isToday && (
                        <span className="text-xs text-muted-foreground">Cannot check in {isFuture ? 'future' : 'past'} bookings</span>
                      )}
                    </div>
                  )}
                  {booking.status === BookingStatus.CHECKED_IN && (
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-3">
                        {isToday && (
                          <div className="flex items-center gap-1 text-sm text-red-600">
                            <TimerReset className="h-4 w-4" />
                            {remaining > 0 ? (
                              <span>{minutes}:{seconds.toString().padStart(2, '0')} left</span>
                            ) : (
                              <span>Checkout window expired</span>
                            )}
                          </div>
                        )}
                        <Button
                          variant="outline"
                          onClick={handleCheckOut}
                          disabled={!isToday || remaining <= 0 || isCheckingOut}
                        >
                          {isCheckingOut ? (
                            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Checking Out...</>
                          ) : (
                            <><LogOut className="h-4 w-4 mr-2" />Check-Out</>
                          )}
                        </Button>
                      </div>
                      {!isToday && (
                        <span className="text-xs text-muted-foreground">Cannot check out {isFuture ? 'future' : 'past'} bookings</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Info cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Date & Time */}
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-blue-50 p-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Date & Time</p>
                    <p className="font-semibold">
                      {booking.bookingDate ? format(new Date(booking.bookingDate), 'EEEE, MMM d, yyyy') : '—'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {booking.estimatedTime || booking.timeSlot || '—'}
                      {booking.appointmentNumber != null && ` • Appt #${booking.appointmentNumber}`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status */}
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-green-50 p-2">
                    <Clock className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Status</p>
                    <div className="mb-1">{getStatusBadge(booking.status)}</div>
                    {booking.checkedInTime && (
                      <p className="text-sm text-muted-foreground">
                        Checked in: {format(new Date(booking.checkedInTime), 'h:mm a')}
                      </p>
                    )}
                    {booking.completedTime && (
                      <p className="text-sm text-muted-foreground">
                        Completed: {format(new Date(booking.completedTime), 'h:mm a')}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Patient */}
            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-purple-50 p-2">
                    <User className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Patient</p>
                    <p className="font-semibold">{booking.patientName || '—'}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {booking.patientPhone || '—'}
                      {booking.patientEmail && ` • ${booking.patientEmail}`}
                    </p>
                    {booking.symptoms && (
                      <p className="text-sm text-muted-foreground mt-1">Symptoms: {booking.symptoms}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Doctor */}
            <Card className="border-l-4 border-l-teal-500">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-teal-50 p-2">
                    <Stethoscope className="h-5 w-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Doctor</p>
                    <p className="font-semibold">{doctorName}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{doctorSpec}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Dispensary */}
          <Card className="border-l-4 border-l-amber-500 mb-6">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-amber-50 p-2">
                  <Building2 className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Dispensary</p>
                  <p className="font-semibold">{dispensaryName}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{dispensaryAddress}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fees */}
          {booking.fees && (
            <Card className="border-l-4 border-l-emerald-500 mb-6">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-emerald-50 p-2">
                    <CreditCard className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="w-full">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Fee Breakdown</p>
                    <div className="space-y-1.5">
                      {booking.fees.doctorFee != null && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Doctor Fee</span>
                          <span>LKR {booking.fees.doctorFee}</span>
                        </div>
                      )}
                      {booking.fees.dispensaryFee != null && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Dispensary Fee</span>
                          <span>LKR {booking.fees.dispensaryFee}</span>
                        </div>
                      )}
                      {booking.fees.bookingCommission != null && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Booking Commission</span>
                          <span>LKR {booking.fees.bookingCommission}</span>
                        </div>
                      )}
                      <div className="border-t pt-1.5 flex justify-between text-sm font-semibold">
                        <span>Total</span>
                        <span>LKR {booking.fees.totalFee ?? booking.fees.totalAmount ?? '—'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Back button at bottom */}
          <div className="flex justify-start">
            <Button onClick={navigateBack} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Bookings List
            </Button>
          </div>
        </div>
      </main>
      <AdminFooter />
    </div>
  );
};

export default BookingDetail;
