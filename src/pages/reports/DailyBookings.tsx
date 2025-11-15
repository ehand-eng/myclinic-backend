import React, { useState, useEffect } from 'react';
import { ReportService } from '@/api/services/ReportService';
import { DispensaryService } from '@/api/services/DispensaryService';
import { DoctorService } from '@/api/services/DoctorService';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Calendar as CalendarIcon, FileText, Users, Clock } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import Header from '@/components/Header';

const BookingReports: React.FC = () => {
  const [mode, setMode] = useState<'daily' | 'advance'>('daily');
  const [dispensaries, setDispensaries] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDispensary, setSelectedDispensary] = useState('all');
  const [selectedDoctor, setSelectedDoctor] = useState('all');
  const [date, setDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Load dispensaries (filtered by user)
  useEffect(() => {
    const userStr = localStorage.getItem('current_user');
    const user = userStr ? JSON.parse(userStr) : null;
    if (user?.dispensaryIds?.length) {
      DispensaryService.getDispensariesByIds(user.dispensaryIds).then(setDispensaries);
    } else {
      DispensaryService.getAllDispensaries().then(setDispensaries);
    }
  }, []);

  // Load doctors when dispensary changes
  useEffect(() => {
    if (selectedDispensary) {
      DoctorService.getDoctorsByDispensaryId(selectedDispensary).then(setDoctors);
    } else {
      setDoctors([]);
    }
  }, [selectedDispensary]);

  // Search handlers
  const handleDailySearch = async () => {
    setLoading(true);
    try {
      const params: any = { date };
      if (selectedDispensary && selectedDispensary !== 'all') params.dispensaryId = selectedDispensary;
      if (selectedDoctor && selectedDoctor !== 'all') params.doctorId = selectedDoctor;
      const data = await ReportService.getDailyBookingsWithParams(params);
      setReport(data);
    } catch (error) {
      console.error('Error fetching daily bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdvanceSearch = async () => {
    setLoading(true);
    try {
      const params: any = { startDate, endDate };
      if (selectedDispensary && selectedDispensary !== 'all') params.dispensaryId = selectedDispensary;
      if (selectedDoctor && selectedDoctor !== 'all') params.doctorId = selectedDoctor;
      const data = await ReportService.getAdvanceBookings(params);
      setReport(data);
    } catch (error) {
      console.error('Error fetching advance bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Cancelled</Badge>;
      case 'no_show':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">No Show</Badge>;
      case 'confirmed':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Confirmed</Badge>;
      default:
        return <Badge variant="secondary">{status || 'Pending'}</Badge>;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Booking Reports</h1>
          <p className="text-muted-foreground">
            View and analyze booking data across dispensaries and doctors
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <FileText className="h-8 w-8 text-primary" />
        </div>
      </div>

      <Separator />

      {/* Mode Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Report Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <Button
              variant={mode === 'daily' ? 'default' : 'outline'}
              onClick={() => setMode('daily')}
              className="flex items-center space-x-2"
            >
              <CalendarIcon className="h-4 w-4" />
              <span>Daily Bookings</span>
            </Button>
            <Button
              variant={mode === 'advance' ? 'default' : 'outline'}
              onClick={() => setMode('advance')}
              className="flex items-center space-x-2"
            >
              <Clock className="h-4 w-4" />
              <span>Advance Booking</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {mode === 'daily' ? (
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full"
                />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full"
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="dispensary">Dispensary</Label>
              <Select value={selectedDispensary} onValueChange={setSelectedDispensary}>
                <SelectTrigger>
                  <SelectValue placeholder="All Dispensaries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dispensaries</SelectItem>
                  {dispensaries.map((dispensary) => (
                    <SelectItem key={dispensary._id || dispensary.id} value={dispensary._id || dispensary.id}>
                      {dispensary.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="doctor">Doctor</Label>
              <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                <SelectTrigger>
                  <SelectValue placeholder="All Doctors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Doctors</SelectItem>
                  {doctors.map((doctor) => (
                    <SelectItem key={doctor._id || doctor.id} value={doctor._id || doctor.id}>
                      {doctor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={mode === 'daily' ? handleDailySearch : handleAdvanceSearch}
            disabled={loading}
            className="w-full md:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Search
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground">Loading booking data...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Results */}
      {report && !loading && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{report?.total || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {mode === 'daily' ? 'Today' : 'Date Range'}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <div className="h-4 w-4 rounded-full bg-green-100" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{report?.completed || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {report?.total ? `${Math.round((report.completed / report.total) * 100)}%` : '0%'} completion rate
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
                <div className="h-4 w-4 rounded-full bg-red-100" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{report?.cancelled || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {report?.total ? `${Math.round((report.cancelled / report.total) * 100)}%` : '0%'} cancellation rate
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">No Shows</CardTitle>
                <div className="h-4 w-4 rounded-full bg-yellow-100" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{report?.noShow || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {report?.total ? `${Math.round((report.noShow / report.total) * 100)}%` : '0%'} no-show rate
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Booking Details Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Booking Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Time Slot</th>
                      <th className="text-left p-3 font-medium">Patient Name</th>
                      <th className="text-left p-3 font-medium">Phone</th>
                      <th className="text-left p-3 font-medium">Doctor</th>
                      <th className="text-left p-3 font-medium">Dispensary</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-left p-3 font-medium">Booked Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report?.bookings?.map((booking: any, index: number) => (
                      <tr key={booking.id || index} className="border-b hover:bg-muted/50">
                        <td className="p-3">{booking.timeSlot || '-'}</td>
                        <td className="p-3 font-medium">{booking.patientName || '-'}</td>
                        <td className="p-3">{booking.patientPhone || '-'}</td>
                        <td className="p-3">{booking.doctor?.name || '-'}</td>
                        <td className="p-3">{booking.dispensary?.name || '-'}</td>
                        <td className="p-3">{getStatusBadge(booking.status)}</td>
                        <td className="p-3">
                          {booking.bookingDate ? format(new Date(booking.bookingDate), 'MMM dd, yyyy') : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {(!report?.bookings || report.bookings.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No bookings found for the selected criteria</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
    </div>
  );
};

export default BookingReports;
