import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { exportBookingSummaryToPDF } from '@/lib/bookingPdfExport';
import { DoctorService } from '@/api/services';
import { format } from 'date-fns';
import axios from 'axios';
import {
  CalendarDays, Clock, MapPin, Stethoscope, Phone, Mail, ArrowLeft,
  Download, Edit3, XCircle, Search, ChevronLeft, ChevronRight,
  FileText, AlertTriangle, CheckCircle2, Hash, Filter, QrCode
} from 'lucide-react';
import BookingQrDialog, { type BookingQrData } from '@/components/BookingQrDialog';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
const ITEMS_PER_PAGE = 8;

interface Booking {
  _id: string;
  transactionId: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  doctor: { _id: string; name: string; specialization: string };
  dispensary: { _id: string; name: string; address: string };
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

interface AvailableSlot {
  appointmentNumber: number;
  estimatedTime: string;
  timeSlot: string;
}

type View = 'list' | 'detail';
type StatusFilter = 'all' | 'upcoming' | 'completed' | 'cancelled';

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'scheduled': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'checked_in':
    case 'checked-in': return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
    case 'no_show': return 'bg-gray-100 text-gray-700 border-gray-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

const getStatusLabel = (status: string) => {
  switch (status.toLowerCase()) {
    case 'scheduled': return 'Scheduled';
    case 'checked_in':
    case 'checked-in': return 'Checked In';
    case 'completed': return 'Completed';
    case 'cancelled': return 'Cancelled';
    case 'no_show': return 'No Show';
    default: return status;
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
  });
};

const formatDateLong = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
};

const isWithin24Hours = (booking: Booking) => {
  const [hours, minutes] = booking.estimatedTime.split(':').map(Number);
  const apptDate = new Date(booking.bookingDate);
  apptDate.setHours(hours, minutes, 0, 0);
  return apptDate.getTime() - Date.now() < 24 * 60 * 60 * 1000;
};

const isPastBooking = (booking: Booking) => {
  const [hours, minutes] = booking.estimatedTime.split(':').map(Number);
  const apptDate = new Date(booking.bookingDate);
  apptDate.setHours(hours, minutes, 0, 0);
  return apptDate.getTime() < Date.now();
};

const MyBookings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Core state
  const [view, setView] = useState<View>('list');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Amend state
  const [showQr, setShowQr] = useState(false);
  const [qrData, setQrData] = useState<BookingQrData | null>(null);
  const [showAmendModal, setShowAmendModal] = useState(false);
  const [amendDate, setAmendDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsMessage, setSlotsMessage] = useState('');
  const [isAmending, setIsAmending] = useState(false);

  // Cancel state
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  const token = localStorage.getItem('auth_token');

  const fetchBookings = async () => {
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/bookings/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(response.data.bookings || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to fetch bookings',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  // Filtering logic
  const filteredBookings = bookings.filter(b => {
    if (statusFilter === 'upcoming' && b.status !== 'scheduled') return false;
    if (statusFilter === 'completed' && b.status !== 'completed') return false;
    if (statusFilter === 'cancelled' && b.status !== 'cancelled') return false;

    if (dateFrom) {
      const bookDate = new Date(b.bookingDate).toISOString().split('T')[0];
      if (bookDate < dateFrom) return false;
    }
    if (dateTo) {
      const bookDate = new Date(b.bookingDate).toISOString().split('T')[0];
      if (bookDate > dateTo) return false;
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesTransaction = b.transactionId.toLowerCase().includes(q);
      const matchesDoctor = b.doctor.name.toLowerCase().includes(q);
      const matchesDispensary = b.dispensary.name.toLowerCase().includes(q);
      if (!matchesTransaction && !matchesDoctor && !matchesDispensary) return false;
    }

    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredBookings.length / ITEMS_PER_PAGE);
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => { setCurrentPage(1); }, [statusFilter, searchQuery, dateFrom, dateTo]);

  // --- Handlers ---

  const handleViewDetail = (booking: Booking) => {
    setSelectedBooking(booking);
    setView('detail');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleBackToList = () => {
    setView('list');
    setSelectedBooking(null);
  };

  const handleDownloadPDF = async (booking: Booking) => {
    try {
      const response = await axios.get(`${API_URL}/bookings/summary/${booking.transactionId}`);
      const summary = response.data;

      // Fetch replacement doctor info for the booking date
      let replacementData: any = undefined;
      try {
        const doctorId = summary.doctor?.id || summary.doctor?._id;
        const dispensaryId = summary.dispensary?.id || summary.dispensary?._id;
        if (doctorId && dispensaryId) {
          const dateStr = format(new Date(summary.bookingDate), 'yyyy-MM-dd');
          const r = await DoctorService.getActiveReplacement(doctorId, dispensaryId, dateStr);
          if (r) {
            replacementData = {
              name: r.replacementName,
              startDate: format(new Date(r.startDate), 'MMM dd, yyyy'),
              endDate: format(new Date(r.endDate), 'MMM dd, yyyy'),
            };
          }
        }
      } catch { /* ignore */ }

      exportBookingSummaryToPDF({
        ...summary,
        bookingDate: new Date(summary.bookingDate),
        fees: summary.fees ? {
          doctorFee: summary.fees.doctorFee,
          dispensaryFee: summary.fees.dispensaryFee,
          bookingCommission: summary.fees.bookingCommission,
          totalAmount: summary.fees.totalAmount
        } : undefined,
        replacementDoctor: replacementData
      });
      toast({ title: 'Success', description: 'PDF downloaded successfully' });
    } catch {
      toast({ title: 'Error', description: 'Failed to generate PDF', variant: 'destructive' });
    }
  };

  // Amend flow
  const openAmendModal = () => {
    setAmendDate('');
    setAvailableSlots([]);
    setSelectedSlot(null);
    setSlotsMessage('');
    setShowAmendModal(true);
  };

  const fetchAvailableSlots = async (date: string) => {
    if (!selectedBooking) return;
    try {
      setLoadingSlots(true);
      setSlotsMessage('');
      setAvailableSlots([]);
      setSelectedSlot(null);

      const response = await axios.get(
        `${API_URL}/bookings/available-slots/${selectedBooking.doctor._id}/${selectedBooking.dispensary._id}/${date}`,
        { params: { excludeBookingId: selectedBooking._id } }
      );

      const data = response.data;
      if (!data.available) {
        setSlotsMessage(data.message || 'No slots available');
      } else {
        setAvailableSlots(data.slots);
      }
    } catch {
      setSlotsMessage('Failed to fetch available slots');
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleAmendDateChange = (date: string) => {
    setAmendDate(date);
    if (date) fetchAvailableSlots(date);
  };

  const handleConfirmAmend = async () => {
    if (!selectedBooking || !amendDate || !selectedSlot) return;
    try {
      setIsAmending(true);
      await axios.patch(
        `${API_URL}/bookings/${selectedBooking._id}/user-amend`,
        { newDate: amendDate, appointmentNumber: selectedSlot.appointmentNumber },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast({ title: 'Success', description: 'Booking amended successfully' });
      setShowAmendModal(false);
      await fetchBookings();
      // Update the selected booking from refreshed data
      const updated = bookings.find(b => b._id === selectedBooking._id);
      if (updated) setSelectedBooking(updated);
      else handleBackToList();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to amend booking',
        variant: 'destructive'
      });
    } finally {
      setIsAmending(false);
    }
  };

  // Cancel flow
  const handleConfirmCancel = async () => {
    if (!selectedBooking) return;
    try {
      setIsCancelling(true);
      await axios.patch(
        `${API_URL}/bookings/${selectedBooking._id}/cancel`,
        { reason: cancelReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast({ title: 'Booking cancelled', description: 'Your booking has been cancelled.' });
      setShowCancelDialog(false);
      setCancelReason('');
      await fetchBookings();
      handleBackToList();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to cancel booking',
        variant: 'destructive'
      });
    } finally {
      setIsCancelling(false);
    }
  };

  // --- Status filter tabs ---
  const statusTabs: { key: StatusFilter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: bookings.length },
    { key: 'upcoming', label: 'Upcoming', count: bookings.filter(b => b.status === 'scheduled').length },
    { key: 'completed', label: 'Completed', count: bookings.filter(b => b.status === 'completed').length },
    { key: 'cancelled', label: 'Cancelled', count: bookings.filter(b => b.status === 'cancelled').length },
  ];

  // --- Render helpers ---

  const renderBookingCard = (booking: Booking) => (
    <Card
      key={booking._id}
      className="group cursor-pointer border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200"
      onClick={() => handleViewDetail(booking)}
    >
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          {/* Date badge */}
          <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex flex-col items-center justify-center border border-blue-200">
            <span className="text-xs font-medium text-blue-600 uppercase">
              {new Date(booking.bookingDate).toLocaleDateString('en-US', { month: 'short' })}
            </span>
            <span className="text-xl font-bold text-blue-800">
              {new Date(booking.bookingDate).getDate()}
            </span>
          </div>

          {/* Main info */}
          <div className="flex-grow min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 truncate">
                {booking.doctor.name}
              </h3>
              <Badge className={`${getStatusColor(booking.status)} text-xs flex-shrink-0 border`}>
                {getStatusLabel(booking.status)}
              </Badge>
            </div>
            <p className="text-sm text-gray-500 truncate">{booking.doctor.specialization}</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {booking.dispensary.name}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {booking.estimatedTime}
              </span>
              <span className="flex items-center gap-1">
                <Hash className="h-3 w-3" />
                Appt #{booking.appointmentNumber}
              </span>
            </div>
          </div>

          {/* Arrow */}
          <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-blue-500 transition-colors hidden sm:block flex-shrink-0" />
        </div>
      </CardContent>
    </Card>
  );

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);

    return (
      <div className="flex items-center justify-between pt-6">
        <p className="text-sm text-gray-500">
          Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredBookings.length)} of {filteredBookings.length}
        </p>
        <div className="flex items-center gap-1">
          <Button
            variant="outline" size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {pages.map(p => (
            <Button
              key={p} variant={p === currentPage ? 'default' : 'outline'} size="sm"
              onClick={() => setCurrentPage(p)}
              className={`h-8 w-8 p-0 ${p === currentPage ? 'bg-[#0a1f44] hover:bg-[#0a1f44]/90 text-white' : ''}`}
            >
              {p}
            </Button>
          ))}
          <Button
            variant="outline" size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  // --- DETAIL VIEW ---
  const renderDetailView = () => {
    if (!selectedBooking) return null;
    const b = selectedBooking;
    const canModify = b.status === 'scheduled' && !isWithin24Hours(b) && !isPastBooking(b);
    const past = isPastBooking(b);
    const within24 = isWithin24Hours(b) && !past;

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Back + actions header */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleBackToList}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Bookings
          </button>
          <Badge className={`${getStatusColor(b.status)} text-sm px-3 py-1 border`}>
            {getStatusLabel(b.status)}
          </Badge>
        </div>

        {/* Main card */}
        <Card className="border border-gray-200 shadow-sm overflow-hidden">
          {/* Header band */}
          <div className="bg-gradient-to-r from-[#0a1f44] to-[#1a3a6e] px-6 py-5 text-white">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Appointment #{b.appointmentNumber}</h2>
                <p className="text-blue-200 text-sm mt-1">Ref: {b.transactionId}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{b.estimatedTime}</div>
                <div className="text-blue-200 text-sm">{b.timeSlot}</div>
              </div>
            </div>
          </div>

          <CardContent className="p-6 space-y-6">
            {/* Quick info cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: CalendarDays, label: 'Date', value: formatDate(b.bookingDate) },
                { icon: Clock, label: 'Time Slot', value: b.timeSlot },
                { icon: Hash, label: 'Queue No.', value: `#${b.appointmentNumber}` },
                { icon: Clock, label: 'Est. Time', value: b.estimatedTime },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100">
                  <Icon className="h-4 w-4 mx-auto text-blue-600 mb-1" />
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="text-sm font-semibold text-gray-900">{value}</p>
                </div>
              ))}
            </div>

            {/* Doctor & Dispensary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                <Stethoscope className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900">{b.doctor.name}</p>
                  <p className="text-sm text-gray-500">{b.doctor.specialization}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                <MapPin className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900">{b.dispensary.name}</p>
                  <p className="text-sm text-gray-500">{b.dispensary.address}</p>
                </div>
              </div>
            </div>

            {/* Patient info */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Patient Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500 w-16">Name:</span>
                  <span className="font-medium text-gray-900">{b.patientName}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-gray-900">{b.patientPhone}</span>
                </div>
                {b.patientEmail && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-3.5 w-3.5 text-gray-400" />
                    <span className="text-gray-900">{b.patientEmail}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Symptoms */}
            {b.symptoms && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">Symptoms</h3>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100">{b.symptoms}</p>
              </div>
            )}

            {/* Fee breakdown */}
            {b.fees && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Fee Breakdown</h3>
                <div className="bg-gray-50 rounded-lg border border-gray-100 overflow-hidden">
                  {[
                    { label: 'Doctor Fee', value: b.fees.doctorFee },
                    { label: 'Dispensary Fee', value: b.fees.dispensaryFee },
                    { label: 'Booking Fee', value: b.fees.bookingCommission },
                  ].filter(f => f.value).map((fee, i) => (
                    <div key={fee.label} className={`flex justify-between px-4 py-2.5 text-sm ${i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                      <span className="text-gray-600">{fee.label}</span>
                      <span className="font-medium text-gray-900">Rs. {fee.value?.toFixed(2)}</span>
                    </div>
                  ))}
                  {b.fees.totalFee && (
                    <div className="flex justify-between px-4 py-3 bg-[#0a1f44] text-white font-semibold">
                      <span>Total</span>
                      <span>Rs. {b.fees.totalFee.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Status indicators */}
            <div className="flex flex-wrap gap-3">
              <div className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-full ${b.isPaid ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                <div className={`w-2 h-2 rounded-full ${b.isPaid ? 'bg-emerald-500' : 'bg-red-500'}`} />
                {b.isPaid ? 'Paid' : 'Not Paid'}
              </div>
              <div className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-full ${b.isPatientVisited ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-600'}`}>
                <div className={`w-2 h-2 rounded-full ${b.isPatientVisited ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                {b.isPatientVisited ? 'Visited' : 'Not Visited'}
              </div>
            </div>

            {/* 24-hour warning */}
            {b.status === 'scheduled' && within24 && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-amber-800">
                  This appointment is within 24 hours. Amendment and cancellation are no longer available.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => {
              setQrData({
                bookingId: b._id || '',
                transactionId: b.transactionId,
                phone: b.patientPhone,
                doctor: b.doctor?.name || '',
                dispensary: b.dispensary?.name || '',
                date: b.bookingDate?.split('T')[0] || '',
                time: b.timeSlot || '',
                aptNo: b.appointmentNumber,
                estTime: b.estimatedTime || '',
              });
              setShowQr(true);
            }}
            variant="outline"
            className="flex items-center gap-2 border-gray-300"
          >
            <QrCode className="h-4 w-4" />
            QR Code
          </Button>
          <Button
            onClick={() => handleDownloadPDF(b)}
            variant="outline"
            className="flex items-center gap-2 border-gray-300"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </Button>

          {b.status === 'scheduled' && (
            <>
              <Button
                onClick={openAmendModal}
                disabled={!canModify}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
              >
                <Edit3 className="h-4 w-4" />
                Amend Booking
              </Button>
              <Button
                onClick={() => setShowCancelDialog(true)}
                disabled={!canModify}
                variant="outline"
                className="flex items-center gap-2 border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                <XCircle className="h-4 w-4" />
                Cancel Booking
              </Button>
            </>
          )}
        </div>
      </div>
    );
  };

  // --- AMEND MODAL ---
  const renderAmendModal = () => {
    if (!selectedBooking) return null;
    const today = new Date().toISOString().split('T')[0];

    return (
      <Dialog open={showAmendModal} onOpenChange={setShowAmendModal}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-blue-600" />
              Amend Booking
            </DialogTitle>
          </DialogHeader>

          {/* Current booking summary */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Current Appointment</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">{selectedBooking.doctor.name}</p>
                <p className="text-sm text-gray-500">{selectedBooking.dispensary.name}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">{formatDate(selectedBooking.bookingDate)}</p>
                <p className="text-sm text-gray-500">#{selectedBooking.appointmentNumber} at {selectedBooking.estimatedTime}</p>
              </div>
            </div>
          </div>

          {/* Date picker */}
          <div className="space-y-2">
            <Label className="font-medium">Select New Date</Label>
            <Input
              type="date"
              value={amendDate}
              min={today}
              onChange={(e) => handleAmendDateChange(e.target.value)}
            />
          </div>

          {/* Available slots */}
          {amendDate && (
            <div className="space-y-3">
              <Label className="font-medium">Available Time Slots</Label>

              {loadingSlots ? (
                <div className="text-center py-6 text-gray-500">Loading available slots...</div>
              ) : slotsMessage ? (
                <div className="text-center py-6">
                  <AlertTriangle className="h-8 w-8 text-amber-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">{slotsMessage}</p>
                </div>
              ) : availableSlots.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                  {availableSlots.map(slot => (
                    <button
                      key={slot.appointmentNumber}
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        selectedSlot?.appointmentNumber === slot.appointmentNumber
                          ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                          selectedSlot?.appointmentNumber === slot.appointmentNumber
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700'
                        }`}>
                          #{slot.appointmentNumber}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{slot.estimatedTime}</p>
                      <p className="text-xs text-gray-500">{slot.timeSlot}</p>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          )}

          {/* Confirm */}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowAmendModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmAmend}
              disabled={!selectedSlot || isAmending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isAmending ? 'Amending...' : 'Confirm Amendment'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // --- CANCEL DIALOG ---
  const renderCancelDialog = () => (
    <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <XCircle className="h-5 w-5" />
            Cancel Booking
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
            <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-800">
              Are you sure you want to cancel this appointment? This action cannot be undone.
            </p>
          </div>

          <div className="space-y-2">
            <Label className="font-medium">Reason for cancellation (optional)</Label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Please let us know why you're cancelling..."
              className="w-full min-h-[80px] px-3 py-2 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => { setShowCancelDialog(false); setCancelReason(''); }}>
              Keep Booking
            </Button>
            <Button
              onClick={handleConfirmCancel}
              disabled={isCancelling}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isCancelling ? 'Cancelling...' : 'Yes, Cancel Booking'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  // --- MAIN RENDER ---
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <Header />

      <main className="flex-grow py-8">
        <div className="container mx-auto px-4">
          {view === 'detail' ? (
            renderDetailView()
          ) : (
            <div className="max-w-4xl mx-auto">
              {/* Page header */}
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <CalendarDays className="h-6 w-6 text-blue-600" />
                  My Bookings
                </h1>
                <p className="text-gray-500 mt-1">
                  {bookings.length} total booking{bookings.length !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Status tabs */}
              <div className="flex flex-wrap gap-2 mb-4">
                {statusTabs.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setStatusFilter(tab.key)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      statusFilter === tab.key
                        ? 'bg-[#0a1f44] text-white shadow-sm'
                        : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {tab.label}
                    <span className={`ml-1.5 text-xs ${
                      statusFilter === tab.key ? 'text-blue-200' : 'text-gray-400'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Filters row */}
              <Card className="mb-4 border border-gray-200">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-grow relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search by transaction ID, doctor, or dispensary..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="w-36"
                        title="From date"
                      />
                      <Input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="w-36"
                        title="To date"
                      />
                      {(searchQuery || dateFrom || dateTo) && (
                        <Button
                          variant="ghost" size="sm"
                          onClick={() => { setSearchQuery(''); setDateFrom(''); setDateTo(''); }}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Booking list */}
              {loading ? (
                <div className="flex justify-center items-center py-16">
                  <div className="text-gray-500">Loading your bookings...</div>
                </div>
              ) : filteredBookings.length === 0 ? (
                <div className="text-center py-16">
                  <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {bookings.length === 0 ? 'No bookings yet' : 'No matching bookings'}
                  </h3>
                  <p className="text-gray-500 mb-6">
                    {bookings.length === 0
                      ? "You haven't made any appointments yet."
                      : 'Try adjusting your filters to find what you\'re looking for.'
                    }
                  </p>
                  {bookings.length === 0 && (
                    <Button
                      onClick={() => navigate('/booking')}
                      className="bg-[#0a1f44] hover:bg-[#0a1f44]/90 text-white"
                    >
                      Book an Appointment
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {paginatedBookings.map(renderBookingCard)}
                </div>
              )}

              {/* Pagination */}
              {renderPagination()}
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Modals */}
      {renderAmendModal()}
      {renderCancelDialog()}
      {qrData && (
        <BookingQrDialog
          open={showQr}
          onClose={() => setShowQr(false)}
          data={qrData}
        />
      )}
    </div>
  );
};

export default MyBookings;
