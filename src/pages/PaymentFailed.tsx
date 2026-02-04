import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { XCircle, RefreshCw, Wallet, Home, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BookingDetails {
    _id: string;
    transactionId: string;
    patientName: string;
    appointmentNumber: number;
    fees: {
        totalFee: number;
    };
    paymentStatus: string;
}

const PaymentFailed: React.FC = () => {
    const { bookingId } = useParams<{ bookingId: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [booking, setBooking] = useState<BookingDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [retrying, setRetrying] = useState(false);

    const errorMessage = searchParams.get('error') || 'Payment could not be processed';

    useEffect(() => {
        const fetchBookingDetails = async () => {
            if (!bookingId || bookingId === 'error') {
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`/api/bookings/${bookingId}`);
                if (response.ok) {
                    const data = await response.json();
                    setBooking(data);
                }
            } catch (err) {
                console.error('Error fetching booking:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchBookingDetails();
    }, [bookingId]);

    const handleRetryPayment = async () => {
        if (!booking) return;

        setRetrying(true);
        try {
            const response = await fetch(`/api/payments/dialog-genie/create-intent/${booking._id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    customer: {
                        name: booking.patientName,
                    },
                }),
            });

            if (response.ok) {
                const data = await response.json();
                if (data.paymentUrl) {
                    window.location.href = data.paymentUrl;
                    return;
                }
            }
            throw new Error('Failed to initiate payment');
        } catch (err) {
            console.error('Error retrying payment:', err);
            alert('Failed to initiate payment. Please try again.');
        } finally {
            setRetrying(false);
        }
    };

    const handlePayAtClinic = async () => {
        if (!booking) {
            navigate('/');
            return;
        }

        try {
            // Update booking to pay at clinic
            await fetch(`/api/bookings/${booking._id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    paymentMethod: 'cash',
                    paymentStatus: 'pending',
                }),
            });

            navigate(`/booking/payment-success/${booking._id}`);
        } catch (err) {
            console.error('Error updating booking:', err);
            navigate('/');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
                    <p className="text-red-700">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 py-8 px-4">
            <div className="max-w-lg mx-auto">
                {/* Failure Header */}
                <div className="text-center mb-8">
                    <div className="bg-red-500 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center shadow-lg">
                        <XCircle className="h-12 w-12 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-red-800 mb-2">Payment Failed</h1>
                    <p className="text-red-600">We couldn't process your payment.</p>
                </div>

                {/* Error Details Card */}
                <Card className="mb-6 border-2 border-red-200 shadow-xl">
                    <CardHeader className="bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-t-lg">
                        <CardTitle className="flex items-center">
                            <AlertTriangle className="h-5 w-5 mr-2" />
                            Payment Error
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-red-700 font-medium">
                                {errorMessage === 'payment_failed'
                                    ? 'Your payment was declined or cancelled.'
                                    : errorMessage === 'booking_not_found'
                                        ? 'We could not find your booking.'
                                        : errorMessage
                                }
                            </p>
                        </div>

                        {booking && (
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h4 className="font-semibold text-gray-800 mb-2">Booking Details</h4>
                                <div className="space-y-1 text-sm">
                                    <p><span className="text-gray-500">Transaction ID:</span> {booking.transactionId}</p>
                                    <p><span className="text-gray-500">Patient:</span> {booking.patientName}</p>
                                    <p><span className="text-gray-500">Appointment #:</span> {booking.appointmentNumber}</p>
                                    <p><span className="text-gray-500">Amount:</span> Rs {booking.fees?.totalFee || 0}</p>
                                </div>
                            </div>
                        )}

                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <h4 className="font-semibold text-yellow-800 mb-2 flex items-center">
                                <AlertTriangle className="h-4 w-4 mr-2" />
                                What can you do?
                            </h4>
                            <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                                <li>Try paying again with a different card or method</li>
                                <li>Choose to pay at the clinic instead</li>
                                <li>Contact support if the problem persists</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="space-y-3">
                    {booking && (
                        <>
                            <Button
                                onClick={handleRetryPayment}
                                disabled={retrying}
                                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                            >
                                {retrying ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                        Try Payment Again
                                    </>
                                )}
                            </Button>

                            <Button
                                onClick={handlePayAtClinic}
                                variant="outline"
                                className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
                            >
                                <Wallet className="h-4 w-4 mr-2" />
                                Pay at Clinic Instead
                            </Button>
                        </>
                    )}

                    <Button
                        onClick={() => navigate('/')}
                        variant="ghost"
                        className="w-full"
                    >
                        <Home className="h-4 w-4 mr-2" />
                        Return Home
                    </Button>
                </div>

                {/* Help Text */}
                <div className="mt-6 text-center text-sm text-gray-600">
                    <p>Need help? Contact our support team</p>
                    <p className="text-gray-500 mt-1">Your booking is still reserved. Don't worry!</p>
                </div>
            </div>
        </div>
    );
};

export default PaymentFailed;
