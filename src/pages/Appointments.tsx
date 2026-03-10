import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminHeader from '@/components/AdminHeader';
import AdminFooter from '@/components/AdminFooter';
import AdminBookingForm from '@/components/admin/AdminBookingForm';
import { BookingService } from '@/api/services';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { canCreateBookings } from '@/lib/roleUtils';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const Appointments = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const userStr = typeof window !== 'undefined' ? localStorage.getItem('current_user') : null;
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const canCreate = canCreateBookings(currentUser?.role);

  // View-only state (for dispensary admin)
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const dispensaryIds = currentUser?.dispensaryIds ?? [];
  const normalizedDispensaryIds = dispensaryIds.map((d: any) => typeof d === 'string' ? d : d._id || d.id).filter(Boolean);

  useEffect(() => {
    if (!canCreate) {
      const fetchBookings = async () => {
        try {
          setIsLoadingBookings(true);
          if (normalizedDispensaryIds.length === 0) {
            const list = await BookingService.getBookingsByDate(selectedDate);
            setBookings(list);
          } else {
            const results = await Promise.all(
              normalizedDispensaryIds.map((id: string) =>
                BookingService.getBookingsByDate(selectedDate, id)
              )
            );
            const merged = results.flat();
            const byId = new Map();
            merged.forEach((b) => byId.set(b.id || b._id, b));
            setBookings(Array.from(byId.values()));
          }
        } catch (error) {
          console.error('Error fetching bookings:', error);
          toast({
            title: 'Error',
            description: 'Failed to load bookings',
            variant: 'destructive'
          });
          setBookings([]);
        } finally {
          setIsLoadingBookings(false);
        }
      };
      fetchBookings();
    }
  }, [canCreate, selectedDate, normalizedDispensaryIds.join(','), toast]);

  if (canCreate) {
    return (
      <div className="flex flex-col min-h-screen">
        <AdminHeader />
        <main className="flex-grow bg-gradient-to-br from-medicalBlue-50 via-white to-medicalTeal-50">
          <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold medical-text-gradient">Admin Bookings</h1>
              <p className="text-medicalGray-600 mt-2">Manage all appointments and bookings</p>
            </div>
            <AdminBookingForm />
          </div>
        </main>
        <AdminFooter />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <AdminHeader />
      <main className="flex-grow bg-gradient-to-br from-medicalBlue-50 via-white to-medicalTeal-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold medical-text-gradient">Bookings</h1>
              <p className="text-medicalGray-600 mt-1">View bookings for the selected date</p>
            </div>
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full sm:w-auto justify-start text-left font-normal',
                    !selectedDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, 'PPP') : 'Pick date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => {
                    if (d) setSelectedDate(d);
                    setDatePickerOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Bookings for {format(selectedDate, 'EEEE, MMM d, yyyy')}</CardTitle>
              <CardDescription>
                Click a row to view booking details
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingBookings ? (
                <p className="text-medicalGray-600 py-8 text-center">Loading bookings...</p>
              ) : bookings.length === 0 ? (
                <p className="text-medicalGray-600 py-8 text-center">No bookings for this date.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead>Doctor</TableHead>
                        <TableHead>Dispensary</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bookings.map((b) => (
                        <TableRow
                          key={b.id || b._id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/admin/bookings/${b.id || b._id}`)}
                        >
                          <TableCell>{b.estimatedTime || b.timeSlot || '—'}</TableCell>
                          <TableCell>
                            <span className="font-medium">{b.patientName || '—'}</span>
                            {b.patientPhone && (
                              <span className="block text-sm text-gray-500">{b.patientPhone}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {b.doctorName || b.doctorId?.name || '—'}
                            {b.doctorSpecialization != null && (
                              <span className="block text-sm text-gray-500">{b.doctorSpecialization}</span>
                            )}
                          </TableCell>
                          <TableCell>{b.dispensaryName || b.dispensaryId?.name || '—'}</TableCell>
                          <TableCell className="capitalize">{b.status || '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <AdminFooter />
    </div>
  );
};

export default Appointments;
