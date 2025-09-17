import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon, DownloadIcon, BarChart3 } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { isChannelPartner } from '@/lib/roleUtils';

const ChannelPartnerReports = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      
      const token = localStorage.getItem('auth_token');
      const userStr = localStorage.getItem('current_user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      if (!token || !user) {
        toast({
          title: "Authentication required",
          description: "Please log in to access reports",
          variant: "destructive"
        });
        navigate('/login');
        return;
      }
      
      if (!isChannelPartner(user.role)) {
        toast({
          title: "Access denied",
          description: "You don't have permission to view these reports",
          variant: "destructive"
        });
        navigate('/admin/dashboard');
        return;
      }
      
      setCurrentUser(user);
      
      // Set default date range (last 30 days)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      setDateRange({
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      });
      
      setIsLoading(false);
    };
    
    checkAuth();
  }, [navigate, toast]);

  const generateReport = async () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      toast({
        title: "Date range required",
        description: "Please select both start and end dates",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingReport(true);
    
    try {
      const token = localStorage.getItem('auth_token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(
        `${API_URL}/channel-partners/reports?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const data = await response.json();
      setReports(data.reportData || []);
      
      toast({
        title: "Report generated",
        description: `Found ${data.reportData?.length || 0} bookings in the selected date range`
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const exportToCsv = () => {
    if (reports.length === 0) {
      toast({
        title: "No data to export",
        description: "Please generate a report first",
        variant: "destructive"
      });
      return;
    }

    const csvHeaders = [
      'Booking ID',
      'Patient Name', 
      'Doctor Name',
      'Dispensary Name',
      'Appointment Date',
      'Appointment Time',
      'Status',
      'Channel Partner Fee',
      'Total Fee'
    ];

    const csvData = reports.map(booking => [
      booking._id,
      booking.patientName,
      booking.doctorName,
      booking.dispensaryName,
      new Date(booking.bookingDate).toLocaleDateString(),
      booking.estimatedTime,
      booking.status,
      booking.fees?.channelPartnerFee || 0,
      booking.fees?.totalFee || 0
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `channel-partner-report-${dateRange.startDate}-to-${dateRange.endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <p className="text-xl">Loading reports...</p>
        </main>
        <Footer />
      </div>
    );
  }

  const totalBookings = reports.length;
  const totalCommission = reports.reduce((sum, booking) => sum + (booking.fees?.channelPartnerFee || 0), 0);
  const totalRevenue = reports.reduce((sum, booking) => sum + (booking.fees?.totalFee || 0), 0);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Reports</h1>
            <p className="text-gray-500">View your booking performance and commission reports</p>
          </div>
          
          <Button onClick={() => navigate('/admin/dashboard')}>
            Back to Dashboard
          </Button>
        </div>

        {/* Date Range Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Report Parameters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={generateReport} 
                  disabled={isGeneratingReport}
                  className="bg-medical-600 hover:bg-medical-700"
                >
                  {isGeneratingReport ? 'Generating...' : 'Generate Report'}
                </Button>
                {reports.length > 0 && (
                  <Button onClick={exportToCsv} variant="outline">
                    <DownloadIcon className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        {reports.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Bookings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalBookings}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Commission
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">Rs. {totalCommission.toFixed(2)}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Revenue Generated
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">Rs. {totalRevenue.toFixed(2)}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Bookings Table */}
        {reports.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Booking Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-4 py-2 text-left">Patient</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Doctor</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Dispensary</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Date & Time</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
                      <th className="border border-gray-300 px-4 py-2 text-right">Commission</th>
                      <th className="border border-gray-300 px-4 py-2 text-right">Total Fee</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((booking) => (
                      <tr key={booking._id} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-4 py-2">{booking.patientName}</td>
                        <td className="border border-gray-300 px-4 py-2">{booking.doctorName}</td>
                        <td className="border border-gray-300 px-4 py-2">{booking.dispensaryName}</td>
                        <td className="border border-gray-300 px-4 py-2">
                          {new Date(booking.bookingDate).toLocaleDateString()} {booking.estimatedTime}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                            booking.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                            booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {booking.status}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-right">
                          Rs. {(booking.fees?.channelPartnerFee || 0).toFixed(2)}
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-right">
                          Rs. {(booking.fees?.totalFee || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {reports.length === 0 && !isGeneratingReport && (
          <Card>
            <CardContent className="text-center py-12">
              <BarChart3 className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No Reports Generated</h3>
              <p className="text-gray-500">Select a date range and click "Generate Report" to view your booking performance.</p>
            </CardContent>
          </Card>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default ChannelPartnerReports;