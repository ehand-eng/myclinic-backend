
import React, { useState, useEffect } from 'react';
import { ReportService, type DoctorPerformance as DoctorPerformanceType } from '@/api/services/ReportService';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const DoctorPerformance: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<DoctorPerformanceType | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());

  useEffect(() => {
    if (selectedDoctor) {
      fetchReport();
    }
  }, [selectedDoctor, startDate, endDate]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ReportService.getDoctorPerformance(
        selectedDoctor,
        startDate,
        endDate
      );
      setReport(data);
    } catch (err) {
      setError('Failed to load doctor performance report');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Doctor Performance Report</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <Label htmlFor="doctor">Doctor</Label>
          <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
            <SelectTrigger>
              <SelectValue placeholder="Select Doctor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="doctor1">Dr. John Doe</SelectItem>
              <SelectItem value="doctor2">Dr. Jane Smith</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label>Start Date</Label>
          <Calendar
            mode="single"
            selected={startDate}
            onSelect={(date) => date && setStartDate(date)}
            className="rounded-xl border border-medicalGreen-200 shadow-lg medical-card"
          />
        </div>
        
        <div>
          <Label>End Date</Label>
          <Calendar
            mode="single"
            selected={endDate}
            onSelect={(date) => date && setEndDate(date)}
            className="rounded-xl border border-medicalGreen-200 shadow-lg medical-card"
          />
        </div>
      </div>

      {report && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{report.totalBookings || 0}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Completion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">
                  {report.completionRate?.toFixed(1) || 0}%
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Cancellation Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600">
                  {report.cancellationRate?.toFixed(1) || 0}%
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Avg. Consultation Time</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-600">
                  {report.averageConsultationTime?.toFixed(0) || 0} min
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Booking Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Time Slot</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Dispensary</TableHead>
                      <TableHead>Checked In</TableHead>
                      <TableHead>Completed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.bookings?.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell>
                          {format(new Date(booking.bookingDate), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>{booking.timeSlot}</TableCell>
                        <TableCell>{booking.status}</TableCell>
                        <TableCell>{booking.dispensary.name}</TableCell>
                        <TableCell>
                          {booking.checkedInTime
                            ? format(new Date(booking.checkedInTime), 'HH:mm')
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {booking.completedTime
                            ? format(new Date(booking.completedTime), 'HH:mm')
                            : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default DoctorPerformance;
