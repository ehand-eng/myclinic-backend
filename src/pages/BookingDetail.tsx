import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminHeader from '@/components/AdminHeader';
import AdminFooter from '@/components/AdminFooter';
import { BookingService } from '@/api/services';
import { Button } from '@/components/ui/button';
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
import { ArrowLeft, Calendar, User, Building2, Clock } from 'lucide-react';

const BookingDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [booking, setBooking] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <AdminHeader />
        <main className="flex-grow container mx-auto px-4 py-8">
          <p className="text-medicalGray-600">Loading booking details...</p>
        </main>
        <AdminFooter />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex flex-col min-h-screen">
        <AdminHeader />
        <main className="flex-grow container mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Booking Not Found</CardTitle>
              <CardDescription>The booking may have been removed or the ID is invalid.</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button onClick={() => navigate('/admin/bookings')}>Back to Bookings</Button>
            </CardFooter>
          </Card>
        </main>
        <AdminFooter />
      </div>
    );
  }

  const doctorName = typeof booking.doctorId === 'object' ? booking.doctorId?.name : '—';
  const doctorSpec = typeof booking.doctorId === 'object' ? booking.doctorId?.specialization : '—';
  const dispensaryName = typeof booking.dispensaryId === 'object' ? booking.dispensaryId?.name : '—';
  const dispensaryAddress = typeof booking.dispensaryId === 'object' ? booking.dispensaryId?.address : '—';

  return (
    <div className="flex flex-col min-h-screen">
      <AdminHeader />
      <main className="flex-grow bg-gradient-to-br from-medicalBlue-50 via-white to-medicalTeal-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6 flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate('/admin/bookings')} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Bookings
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Booking Details</CardTitle>
              <CardDescription>
                Transaction ID: {booking.transactionId || booking.id}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> Date & Time
                  </h3>
                  <p className="font-medium">
                    {booking.bookingDate ? format(new Date(booking.bookingDate), 'EEEE, MMM d, yyyy') : '—'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {booking.estimatedTime || booking.timeSlot || '—'}
                    {booking.appointmentNumber != null && ` • Appointment #${booking.appointmentNumber}`}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4" /> Status
                  </h3>
                  <p className="font-medium capitalize">{booking.status || '—'}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                  <User className="h-4 w-4" /> Patient
                </h3>
                <p className="font-medium">{booking.patientName || '—'}</p>
                <p className="text-sm text-gray-600">
                  {booking.patientPhone || '—'}
                  {booking.patientEmail && ` • ${booking.patientEmail}`}
                </p>
                {booking.symptoms && (
                  <p className="text-sm text-gray-600 mt-1">Symptoms: {booking.symptoms}</p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                  <User className="h-4 w-4" /> Doctor
                </h3>
                <p className="font-medium">{doctorName}</p>
                <p className="text-sm text-gray-600">{doctorSpec}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                  <Building2 className="h-4 w-4" /> Dispensary
                </h3>
                <p className="font-medium">{dispensaryName}</p>
                <p className="text-sm text-gray-600">{dispensaryAddress}</p>
              </div>

              {booking.fees && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Fees</h3>
                  <p className="text-sm">
                    Total: LKR {booking.fees.totalFee ?? '—'}
                    {booking.fees.doctorFee != null && ` (Doctor: ${booking.fees.doctorFee}, Dispensary: ${booking.fees.dispensaryFee ?? 0})`}
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={() => navigate('/admin/bookings')} variant="outline">
                Back to Bookings List
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
      <AdminFooter />
    </div>
  );
};

export default BookingDetail;
