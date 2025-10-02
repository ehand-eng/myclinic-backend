import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, Clock, MapPin, Stethoscope, Phone, Mail, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Booking {
  _id: string;
  transactionId: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  doctor: {
    name: string;
    specialization: string;
  };
  dispensary: {
    name: string;
    address: string;
  };
  bookingDate: string;
  timeSlot: string;
  estimatedTime: string;
  appointmentNumber: number;
  status: string;
  symptoms?: string;
  fees: any;
  createdAt: string;
  isPaid: boolean;
  isPatientVisited: boolean;
}

interface MyBookingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MyBookingsModal = ({ isOpen, onClose }: MyBookingsModalProps) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchMyBookings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');

      if (!token) {
        toast({
          title: "Error",
          description: "Please log in to view your bookings",
          variant: "destructive"
        });
        return;
      }

      const response = await axios.get(`${API_URL}/bookings/my`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setBookings(response.data.bookings || []);
    } catch (error: any) {
      console.error('Error fetching bookings:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch your bookings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMyBookings();
    }
  }, [isOpen]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'checked-in':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            My Bookings
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="text-gray-500">Loading your bookings...</div>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-8">
            <CalendarDays className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-500">You haven't made any appointments yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <Card key={booking._id} className="border border-gray-200">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-semibold">
                      Appointment #{booking.appointmentNumber}
                    </CardTitle>
                    <Badge className={getStatusColor(booking.status)}>
                      {booking.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-500">
                    Transaction ID: {booking.transactionId}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Date and Time */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-medicalBlue-600" />
                      <div>
                        <div className="font-medium">{formatDate(booking.bookingDate)}</div>
                        <div className="text-sm text-gray-500">
                          {booking.timeSlot} (Est: {booking.estimatedTime})
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-medicalBlue-600" />
                      <div>
                        <div className="font-medium">Estimated Time</div>
                        <div className="text-sm text-gray-500">{booking.estimatedTime}</div>
                      </div>
                    </div>
                  </div>

                  {/* Doctor and Dispensary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-2">
                      <Stethoscope className="h-4 w-4 text-medicalBlue-600 mt-1" />
                      <div>
                        <div className="font-medium">{booking.doctor.name}</div>
                        <div className="text-sm text-gray-500">{booking.doctor.specialization}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-medicalBlue-600 mt-1" />
                      <div>
                        <div className="font-medium">{booking.dispensary.name}</div>
                        <div className="text-sm text-gray-500">{booking.dispensary.address}</div>
                      </div>
                    </div>
                  </div>

                  {/* Patient Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-medicalBlue-600" />
                      <div>
                        <div className="font-medium">Contact</div>
                        <div className="text-sm text-gray-500">{booking.patientPhone}</div>
                      </div>
                    </div>

                    {booking.patientEmail && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-medicalBlue-600" />
                        <div>
                          <div className="font-medium">Email</div>
                          <div className="text-sm text-gray-500">{booking.patientEmail}</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Symptoms */}
                  {booking.symptoms && (
                    <div>
                      <div className="font-medium mb-1">Symptoms</div>
                      <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        {booking.symptoms}
                      </div>
                    </div>
                  )}

                  {/* Fees */}
                  {booking.fees && (
                    <div className="bg-medicalBlue-50 p-3 rounded-lg">
                      <div className="font-medium mb-2">Fee Details</div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {booking.fees.doctorFee && (
                          <div className="flex justify-between">
                            <span>Doctor Fee:</span>
                            <span>Rs. {booking.fees.doctorFee}</span>
                          </div>
                        )}
                        {booking.fees.dispensaryFee && (
                          <div className="flex justify-between">
                            <span>Dispensary Fee:</span>
                            <span>Rs. {booking.fees.dispensaryFee}</span>
                          </div>
                        )}
                        {booking.fees.bookingCommission && (
                          <div className="flex justify-between">
                            <span>Booking Fee:</span>
                            <span>Rs. {booking.fees.bookingCommission}</span>
                          </div>
                        )}
                        {booking.fees.totalFee && (
                          <div className="flex justify-between font-medium border-t pt-1 col-span-2">
                            <span>Total:</span>
                            <span>Rs. {booking.fees.totalFee}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Status indicators */}
                  <div className="flex gap-4 text-sm">
                    <div className={`flex items-center gap-1 ${booking.isPaid ? 'text-green-600' : 'text-red-600'}`}>
                      <div className={`w-2 h-2 rounded-full ${booking.isPaid ? 'bg-green-600' : 'bg-red-600'}`}></div>
                      {booking.isPaid ? 'Paid' : 'Not Paid'}
                    </div>
                    <div className={`flex items-center gap-1 ${booking.isPatientVisited ? 'text-green-600' : 'text-gray-600'}`}>
                      <div className={`w-2 h-2 rounded-full ${booking.isPatientVisited ? 'bg-green-600' : 'bg-gray-600'}`}></div>
                      {booking.isPatientVisited ? 'Visited' : 'Not Visited'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-4">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MyBookingsModal;