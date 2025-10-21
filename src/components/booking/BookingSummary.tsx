
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BookingService, type BookingSummary as BookingSummaryType } from '@/api/services/BookingService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Calendar, Clock, User, Phone, Mail, MapPin, Building, Receipt, CheckCircle, DollarSign, Stethoscope } from 'lucide-react';

const BookingSummary = () => {
  const { transactionId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [summary, setSummary] = useState<BookingSummaryType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  useEffect(() => {
    const fetchSummary = async () => {
      if (!transactionId) return;
      
      try {
        setIsLoading(true);
        const data = await BookingService.getBookingSummary(transactionId);
        setSummary(data);
      } catch (error) {
        console.error('Error fetching booking summary:', error);
        toast({
          title: 'Error',
          description: 'Failed to load booking summary',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummary();
  }, [transactionId, toast]);

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!summary) {
    return <div className="flex justify-center items-center min-h-screen">Booking not found</div>;
  }

  return (
    <>
      {/* Print styles */}
      <style jsx>{`
        @media print {
          @page {
            margin: 2cm 1.5cm;
            size: A4;
          }
          
          .no-print {
            display: none !important;
          }
          
          .print-only {
            display: block !important;
          }
          
          .print-break {
            page-break-after: always;
          }
          
          .print-content {
            color: #000 !important;
            background: #fff !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          
          .print-content .bg-gradient-to-br,
          .print-content .bg-gradient-to-r {
            background: #fff !important;
          }
          
          .print-content .border-2,
          .print-content .border {
            border: 1px solid #000 !important;
          }
          
          .print-content .text-blue-800,
          .print-content .text-green-800,
          .print-content .text-purple-800,
          .print-content .text-orange-800,
          .print-content .text-emerald-800,
          .print-content .text-indigo-800,
          .print-content .text-gray-600 {
            color: #000 !important;
          }
          
          .print-content .shadow-lg,
          .print-content .shadow-xl {
            box-shadow: none !important;
          }
          
          .print-content .bg-blue-100,
          .print-content .bg-green-100,
          .print-content .bg-orange-100,
          .print-content .bg-purple-100,
          .print-content .bg-emerald-100,
          .print-content .bg-indigo-100 {
            background: #f8f9fa !important;
          }
          
          .print-content h1,
          .print-content h2,
          .print-content h3 {
            color: #000 !important;
          }
          
          .print-content p,
          .print-content span,
          .print-content div {
            color: #000 !important;
          }
          
          /* Table-like layout for print */
          .print-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          
          .print-table th,
          .print-table td {
            border: 1px solid #000;
            padding: 8px 12px;
            text-align: left;
            vertical-align: top;
          }
          
          .print-table th {
            background: #f8f9fa !important;
            font-weight: bold;
          }
          
          .print-table tr:nth-child(even) {
            background: #f8f9fa !important;
          }
          
          .print-section {
            margin-bottom: 25px;
            page-break-inside: avoid;
          }
          
          .print-section h3 {
            background: #f8f9fa !important;
            padding: 10px;
            margin: 0 0 10px 0;
            border: 1px solid #000;
            font-size: 16px;
            font-weight: bold;
          }
          
          .print-info-grid {
            display: table;
            width: 100%;
            border-collapse: collapse;
          }
          
          .print-info-row {
            display: table-row;
          }
          
          .print-info-label {
            display: table-cell;
            width: 30%;
            padding: 8px 12px;
            border: 1px solid #000;
            background: #f8f9fa !important;
            font-weight: bold;
          }
          
          .print-info-value {
            display: table-cell;
            width: 70%;
            padding: 8px 12px;
            border: 1px solid #000;
          }
          
          .print-fee-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
          }
          
          .print-fee-table th,
          .print-fee-table td {
            border: 1px solid #000;
            padding: 10px;
            text-align: left;
          }
          
          .print-fee-table th {
            background: #f8f9fa !important;
            font-weight: bold;
          }
          
          .print-fee-table .fee-total {
            background: #e9ecef !important;
            font-weight: bold;
            font-size: 16px;
          }
          
          .print-fee-table .amount {
            text-align: right;
            font-weight: bold;
          }
        }
        
        @media screen {
          .print-only {
            display: none !important;
          }
          
          .print-table,
          .print-info-grid,
          .print-fee-table {
            display: none !important;
          }
        }
      `}</style>
      
      <div className="flex flex-col min-h-screen">
        <div className="no-print">
          <Header />
        </div>
      
      <main className="flex-grow py-12 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 print-content">
        <div className="container mx-auto px-4">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4 no-print">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              <span className="no-print">Booking Confirmed!</span>
              <span className="print-only hidden">DOCSPOT CONNECT - BOOKING CONFIRMATION</span>
            </h1>
            <p className="text-lg text-gray-600 no-print">Your appointment has been successfully booked</p>
            <div className="mt-4 inline-flex items-center bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
              <strong>Transaction ID: {summary.transactionId}</strong>
            </div>
            <div className="print-only hidden text-center">
              <p><strong>Booking Date:</strong> {new Date().toLocaleDateString()}</p>
              <p><strong>Confirmation Time:</strong> {new Date().toLocaleTimeString()}</p>
            </div>
          </div>

          <div className="max-w-6xl mx-auto space-y-8">
            {/* Appointment Details Card */}
            <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-500 p-3 rounded-full">
                      <Calendar className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl text-blue-800">Appointment Details</h3>
                      <p className="text-sm text-blue-600">Your scheduled appointment information</p>
                    </div>
                  </div>
                  <div className="bg-green-100 px-4 py-2 rounded-full">
                    <span className="text-sm font-semibold text-green-800 capitalize">{summary.status}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white p-4 rounded-lg border border-blue-200 shadow-sm">
                    <div className="flex items-center space-x-3">
                      <div className="bg-green-100 p-2 rounded-lg">
                        <Calendar className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Appointment Date</p>
                        <p className="font-bold text-lg text-green-700">{format(summary.bookingDate, 'PPP')}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border border-blue-200 shadow-sm">
                    <div className="flex items-center space-x-3">
                      <div className="bg-orange-100 p-2 rounded-lg">
                        <Clock className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Time Slot</p>
                        <p className="font-bold text-lg text-orange-700">{summary.timeSlot}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border border-blue-200 shadow-sm">
                    <div className="flex items-center space-x-3">
                      <div className="bg-purple-100 p-2 rounded-lg">
                        <User className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Appointment #</p>
                        <p className="font-bold text-lg text-purple-700">#{summary.appointmentNumber}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border border-blue-200 shadow-sm">
                    <div className="flex items-center space-x-3">
                      <div className="bg-indigo-100 p-2 rounded-lg">
                        <Clock className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Estimated Time</p>
                        <p className="font-bold text-lg text-indigo-700">{summary.estimatedTime}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Print-only Appointment Details Table */}
            <div className="print-only print-section">
              <h3>Appointment Details</h3>
              <div className="print-info-grid">
                <div className="print-info-row">
                  <div className="print-info-label">Appointment Date</div>
                  <div className="print-info-value">{format(summary.bookingDate, 'PPP')}</div>
                </div>
                <div className="print-info-row">
                  <div className="print-info-label">Time Slot</div>
                  <div className="print-info-value">{summary.timeSlot}</div>
                </div>
                <div className="print-info-row">
                  <div className="print-info-label">Appointment Number</div>
                  <div className="print-info-value">#{summary.appointmentNumber}</div>
                </div>
                <div className="print-info-row">
                  <div className="print-info-label">Estimated Time</div>
                  <div className="print-info-value">{summary.estimatedTime}</div>
                </div>
                <div className="print-info-row">
                  <div className="print-info-label">Status</div>
                  <div className="print-info-value">{summary.status}</div>
                </div>
              </div>
            </div>

            {/* Patient & Doctor Information Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Patient Information */}
              <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="bg-green-500 p-3 rounded-full">
                      <User className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl text-green-800">Patient Information</h3>
                      <p className="text-sm text-green-600">Your personal details</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-white p-2 rounded-lg">
                        <User className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Full Name</p>
                        <p className="font-semibold text-green-800">{summary.patient.name}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="bg-white p-2 rounded-lg">
                        <Phone className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Phone Number</p>
                        <p className="font-semibold text-green-800">{summary.patient.phone}</p>
                      </div>
                    </div>
                    
                    {summary.patient.email && (
                      <div className="flex items-center space-x-3">
                        <div className="bg-white p-2 rounded-lg">
                          <Mail className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Email Address</p>
                          <p className="font-semibold text-green-800">{summary.patient.email}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Doctor Information */}
              <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="bg-purple-500 p-3 rounded-full">
                      <Stethoscope className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl text-purple-800">Doctor Information</h3>
                      <p className="text-sm text-purple-600">Your healthcare provider</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-white p-2 rounded-lg">
                        <User className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Doctor Name</p>
                        <p className="font-semibold text-purple-800">{summary.doctor.name}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="bg-white p-2 rounded-lg">
                        <Stethoscope className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Specialization</p>
                        <p className="font-semibold text-purple-800">{summary.doctor.specialization}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Print-only Patient & Doctor Information Tables */}
            <div className="print-only">
              <div className="print-section">
                <h3>Patient Information</h3>
                <div className="print-info-grid">
                  <div className="print-info-row">
                    <div className="print-info-label">Full Name</div>
                    <div className="print-info-value">{summary.patient.name}</div>
                  </div>
                  <div className="print-info-row">
                    <div className="print-info-label">Phone Number</div>
                    <div className="print-info-value">{summary.patient.phone}</div>
                  </div>
                  {summary.patient.email && (
                    <div className="print-info-row">
                      <div className="print-info-label">Email Address</div>
                      <div className="print-info-value">{summary.patient.email}</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="print-section">
                <h3>Doctor Information</h3>
                <div className="print-info-grid">
                  <div className="print-info-row">
                    <div className="print-info-label">Doctor Name</div>
                    <div className="print-info-value">{summary.doctor.name}</div>
                  </div>
                  <div className="print-info-row">
                    <div className="print-info-label">Specialization</div>
                    <div className="print-info-value">{summary.doctor.specialization}</div>
                  </div>
                </div>
              </div>

              <div className="print-section">
                <h3>Dispensary Information</h3>
                <div className="print-info-grid">
                  <div className="print-info-row">
                    <div className="print-info-label">Dispensary Name</div>
                    <div className="print-info-value">{summary.dispensary.name}</div>
                  </div>
                  <div className="print-info-row">
                    <div className="print-info-label">Address</div>
                    <div className="print-info-value">{summary.dispensary.address}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dispensary Information */}
            <Card className="border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="bg-orange-500 p-3 rounded-full">
                    <Building className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-orange-800">Dispensary Information</h3>
                    <p className="text-sm text-orange-600">Appointment location details</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center space-x-3">
                    <div className="bg-white p-2 rounded-lg">
                      <Building className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Dispensary Name</p>
                      <p className="font-semibold text-orange-800">{summary.dispensary.name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="bg-white p-2 rounded-lg">
                      <MapPin className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Address</p>
                      <p className="font-semibold text-orange-800">{summary.dispensary.address}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Fee Breakdown */}
            {summary.fees && (
              <Card className="border-2 border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50 shadow-lg hover:shadow-xl transition-all duration-300">
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
                      <span className="text-sm font-semibold text-emerald-800">Payment Summary</span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white p-4 rounded-lg border border-green-200 shadow-sm">
                        <div className="flex items-center space-x-3">
                          <div className="bg-blue-100 p-2 rounded-lg">
                            <Stethoscope className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-600">Doctor Fee</p>
                            <p className="font-bold text-lg text-blue-700">Rs {summary.fees.doctorFee.toFixed(2)}</p>
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
                            <p className="font-bold text-lg text-orange-700">Rs {summary.fees.dispensaryFee.toFixed(2)}</p>
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
                            <p className="font-bold text-lg text-purple-700">Rs {summary.fees.bookingCommission.toFixed(2)}</p>
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
                          <p className="text-3xl font-bold text-emerald-800">Rs {summary.fees.totalAmount.toFixed(2)}</p>
                          <p className="text-sm text-emerald-600">Payment completed</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Print-only Fee Breakdown Table */}
            {summary.fees && (
              <div className="print-only print-section">
                <h3>Fee Breakdown</h3>
                <table className="print-fee-table">
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Doctor Fee</td>
                      <td className="amount">Rs {summary.fees.doctorFee.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td>Dispensary Fee</td>
                      <td className="amount">Rs {summary.fees.dispensaryFee.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td>Booking Commission</td>
                      <td className="amount">Rs {summary.fees.bookingCommission.toFixed(2)}</td>
                    </tr>
                    <tr className="fee-total">
                      <td><strong>TOTAL AMOUNT</strong></td>
                      <td className="amount"><strong>Rs {summary.fees.totalAmount.toFixed(2)}</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Symptoms Section */}
            {summary.symptoms && (
              <Card className="border-2 border-indigo-200 bg-gradient-to-r from-indigo-50 to-blue-50 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="bg-indigo-500 p-3 rounded-full">
                      <Stethoscope className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl text-indigo-800">Symptoms Reported</h3>
                      <p className="text-sm text-indigo-600">Information provided during booking</p>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-indigo-200">
                    <p className="text-indigo-800">{summary.symptoms}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Print-only Symptoms Section */}
            {summary.symptoms && (
              <div className="print-only print-section">
                <h3>Symptoms Reported</h3>
                <div className="print-info-grid">
                  <div className="print-info-row">
                    <div className="print-info-label">Symptoms</div>
                    <div className="print-info-value">{summary.symptoms}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6 no-print">
              <Button 
                onClick={() => navigate('/')}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 text-lg shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Back to Home
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.print()}
                className="border-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 px-8 py-3 text-lg shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Print Summary
              </Button>
            </div>
          </div>
        </div>
      </main>

        <div className="no-print">
          <Footer />
        </div>
      </div>
    </>
  );
};

export default BookingSummary;
