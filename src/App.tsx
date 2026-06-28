
import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { Loader2 } from 'lucide-react';
import RequireAuth from '@/components/RequireAuth';

// Eagerly load the landing page (first thing users see)
import Index from './pages/Index';
import NotFound from './pages/NotFound';

// Lazy-load everything else — each becomes its own chunk
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminDoctors = lazy(() => import('./pages/AdminDoctors'));
const AdminTimeSlots = lazy(() => import('./pages/AdminTimeSlots'));
const Booking = lazy(() => import('./pages/Booking'));
const Contact = lazy(() => import('./pages/Contact'));
const AboutUs = lazy(() => import('./pages/AboutUs'));
const Doctors = lazy(() => import('./pages/Doctors'));
const Login = lazy(() => import('./pages/Login'));
const CreateDoctor = lazy(() => import('./pages/CreateDoctor'));
const EditDoctor = lazy(() => import('./pages/EditDoctor'));
const ViewDoctor = lazy(() => import('./pages/ViewDoctor'));
const CreateDispensary = lazy(() => import('./pages/CreateDispensary'));
const EditDispensary = lazy(() => import('./pages/EditDispensary'));
const ViewDispensary = lazy(() => import('./pages/ViewDispensary'));
const AdminDispensaries = lazy(() => import('./pages/AdminDispensaries'));
const BookingSummary = lazy(() => import('@/components/booking/BookingSummary'));
const Callback = lazy(() => import('./pages/Callback'));
const ComprehensiveReport = lazy(() => import('@/pages/reports/ComprehensiveReport'));
const ChannelPartnerReports = lazy(() => import('@/pages/reports/ChannelPartnerReports'));
const Signup = lazy(() => import('./pages/Signup'));
const AdminFeeManage = lazy(() => import('./pages/AdminFeeManage'));
const MobileHome = lazy(() => import('./pages/MobileHome'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const TimeSlotManagement = lazy(() => import('./pages/TimeSlotManagement'));
const CustomRoleManagement = lazy(() => import('./pages/admin/CustomRoleManagement'));
const Appointments = lazy(() => import('./pages/Appointments'));
const BookingDetail = lazy(() => import('./pages/BookingDetail'));
const DispensaryCheckIn = lazy(() => import('./pages/DispensaryCheckIn'));
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'));
const PaymentFailed = lazy(() => import('./pages/PaymentFailed'));
const Profile = lazy(() => import('./pages/Profile'));
const MyBookings = lazy(() => import('./pages/MyBookings'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminChangePassword = lazy(() => import('./pages/AdminChangePassword'));

// Minimal full-page loading fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  </div>
);

// Scroll to top on route change — single immediate call only
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
};

const App = () => {
  useEffect(() => {
    if (window.history.scrollRestoration) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  return (
    <Router>
      <ScrollToTop />
      <Toaster />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Index />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/doctors" element={<Doctors />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/callback" element={<Callback />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/my-bookings" element={<MyBookings />} />

          {/* Booking Summary (public — accessed via transaction link) */}
          <Route path="/booking-summary/:transactionId" element={<BookingSummary />} />

          {/* Payment Result Routes (public — user returns from payment gateway) */}
          <Route path="/booking/payment-success/:bookingId" element={<PaymentSuccess />} />
          <Route path="/booking/payment-failed/:bookingId" element={<PaymentFailed />} />

          {/* Admin login (public — unauthenticated users land here) */}
          <Route path="/admin" element={<AdminLogin />} />

          {/* All admin routes — protected by RequireAuth */}
          <Route element={<RequireAuth />}>
            <Route path="/admin/change-password" element={<AdminChangePassword />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/doctors" element={<AdminDoctors />} />
            <Route path="/admin/dispensaries" element={<AdminDispensaries />} />
            <Route path="/admin/reports" element={<ComprehensiveReport />} />
            <Route path="/admin/time-slots" element={<AdminTimeSlots />} />
            <Route path="/admin/bookings" element={<Appointments />} />
            <Route path="/admin/bookings/:id" element={<BookingDetail />} />
            <Route path="/admin/doctors/create" element={<CreateDoctor />} />
            <Route path="/admin/doctors/edit/:id" element={<EditDoctor />} />
            <Route path="/admin/doctors/view/:id" element={<ViewDoctor />} />
            <Route path="/admin/dispensaries/create" element={<CreateDispensary />} />
            <Route path="/admin/dispensaries/edit/:id" element={<EditDispensary />} />
            <Route path="/admin/dispensaries/view/:id" element={<ViewDispensary />} />
            <Route path="/admin/user-dispensary" element={<CustomRoleManagement />} />
            <Route path="/admin/roles" element={<CustomRoleManagement />} />
            <Route path="/admin/fees" element={<AdminFeeManage />} />
            <Route path="/admin/profile" element={<Profile />} />

            {/* Dispensary check-in (was /dispensary/check-in, now under /admin/) */}
            <Route path="/admin/dispensary/check-in" element={<DispensaryCheckIn />} />

            {/* Time slot management (was /doctor/:id/dispensary/:id/time-slots) */}
            <Route path="/admin/doctor/:doctorId/dispensary/:dispensaryId/time-slots" element={<TimeSlotManagement />} />

            {/* Reports */}
            <Route path="/admin/reports/comprehensive" element={<ComprehensiveReport />} />
            <Route path="/admin/reports/channel-partner" element={<ChannelPartnerReports />} />
          </Route>

          {/* Catch All - 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Router>
  );
};

export default App;
