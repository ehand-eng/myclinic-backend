import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, Calendar, Clock, User, Receipt, Download, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';

interface BookingDetails {
    _id: string;
    transactionId: string;
    patientName: string;
    patientPhone: string;
    appointmentNumber: number;
    estimatedTime: string;
    bookingDate: string;
    timeSlot: string;
    fees: {
        doctorFee: number;
        dispensaryFee: number;
        bookingCommission: number;
        totalFee: number;
    };
    paymentStatus: string;
    paidAt: string;
    doctorId: {
        name: string;
        specialization: string;
    };
    dispensaryId: {
        name: string;
        address: string;
    };
}

const PaymentSuccess: React.FC = () => {
    const { bookingId } = useParams<{ bookingId: string }>();
    const navigate = useNavigate();
    const [booking, setBooking] = useState<BookingDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchBookingDetails = async () => {
            if (!bookingId) {
                setError('Booking ID not found');
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`/api/bookings/${bookingId}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch booking details');
                }
                const data = await response.json();
                setBooking(data);
            } catch (err) {
                console.error('Error fetching booking:', err);
                setError('Failed to load booking details');
            } finally {
                setLoading(false);
            }
        };

        fetchBookingDetails();
    }, [bookingId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                    <p className="text-green-700">Loading booking details...</p>
                </div>
            </div>
        );
    }

    if (error || !booking) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
                <Card className="max-w-md w-full">
                    <CardContent className="pt-6 text-center">
                        <div className="bg-yellow-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                            <Receipt className="h-8 w-8 text-yellow-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800 mb-2">Booking Details Unavailable</h2>
                        <p className="text-gray-600 mb-6">{error || 'Could not load booking information'}</p>
                        <Button onClick={() => navigate('/')} className="w-full">
                            <Home className="h-4 w-4 mr-2" />
                            Return Home
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Success Header */}
                <div className="text-center mb-8">
                    <div className="bg-green-500 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center shadow-lg animate-bounce">
                        <CheckCircle className="h-12 w-12 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-green-800 mb-2">Payment Successful!</h1>
                    <p className="text-green-600">Your appointment has been confirmed and paid.</p>
                </div>

                {/* Booking Confirmation Card */}
                <Card className="mb-6 border-2 border-green-200 shadow-xl">
                    <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-t-lg">
                        <CardTitle className="flex items-center justify-between">
                            <span>Booking Confirmation</span>
                            <span className="text-sm font-normal bg-white/20 px-3 py-1 rounded-full">
                                #{booking.transactionId}
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        {/* Appointment Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center space-x-3">
                                <div className="bg-blue-100 p-2 rounded-lg">
                                    <User className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Patient Name</p>
                                    <p className="font-semibold text-gray-800">{booking.patientName}</p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3">
                                <div className="bg-purple-100 p-2 rounded-lg">
                                    <Calendar className="h-5 w-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Appointment Date</p>
                                    <p className="font-semibold text-gray-800">
                                        {format(new Date(booking.bookingDate), 'PPP')}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3">
                                <div className="bg-orange-100 p-2 rounded-lg">
                                    <Clock className="h-5 w-5 text-orange-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Estimated Time</p>
                                    <p className="font-semibold text-gray-800">{booking.estimatedTime}</p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3">
                                <div className="bg-green-100 p-2 rounded-lg">
                                    <Receipt className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Appointment Number</p>
                                    <p className="font-bold text-2xl text-green-700">#{booking.appointmentNumber}</p>
                                </div>
                            </div>
                        </div>

                        {/* Doctor & Location */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-semibold text-gray-800 mb-2">Doctor & Location</h4>
                            <p className="text-gray-700">{booking.doctorId?.name || 'Doctor'}</p>
                            <p className="text-gray-500 text-sm">{booking.doctorId?.specialization || ''}</p>
                            <p className="text-gray-600 mt-2">{booking.dispensaryId?.name || 'Clinic'}</p>
                            <p className="text-gray-500 text-sm">{booking.dispensaryId?.address || ''}</p>
                        </div>

                        {/* Payment Receipt */}
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                            <h4 className="font-semibold text-green-800 mb-3 flex items-center">
                                <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                                Payment Receipt
                            </h4>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Doctor Fee</span>
                                    <span className="text-gray-800">Rs {booking.fees?.doctorFee || 0}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Dispensary Fee</span>
                                    <span className="text-gray-800">Rs {booking.fees?.dispensaryFee || 0}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Booking Commission</span>
                                    <span className="text-gray-800">Rs {booking.fees?.bookingCommission || 0}</span>
                                </div>
                                <div className="border-t border-green-200 pt-2 mt-2">
                                    <div className="flex justify-between font-bold">
                                        <span className="text-green-800">Total Paid</span>
                                        <span className="text-green-700 text-lg">Rs {booking.fees?.totalFee || 0}</span>
                                    </div>
                                </div>
                                {booking.paidAt && (
                                    <p className="text-xs text-green-600 text-right mt-2">
                                        Paid on {format(new Date(booking.paidAt), 'PPpp')}
                                    </p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                        variant="outline"
                        onClick={() => navigate('/')}
                        className="flex-1"
                    >
                        <Home className="h-4 w-4 mr-2" />
                        Return Home
                    </Button>
                    <Button
                        onClick={() => window.print()}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Print Receipt
                    </Button>
                </div>

                {/* SMS Notice */}
                <div className="mt-6 text-center text-sm text-gray-600">
                    <p>A confirmation SMS has been sent to <strong>{booking.patientPhone}</strong></p>
                    <p className="mt-1">Please save your appointment number: <strong>#{booking.appointmentNumber}</strong></p>
                </div>
            </div>
        </div>
    );
};

export default PaymentSuccess;
