
import Index from './pages/Index';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NotFound from './pages/NotFound';
import AdminDashboard from './pages/AdminDashboard';
import AdminDoctors from './pages/AdminDoctors';
import AdminReports from './pages/AdminReports';
import AdminTimeSlots from './pages/AdminTimeSlots';
import Booking from './pages/Booking';
import Contact from './pages/Contact';
import Doctors from './pages/Doctors';
import Login from './pages/Login';
import CreateDoctor from './pages/CreateDoctor';
import EditDoctor from './pages/EditDoctor';
import ViewDoctor from './pages/ViewDoctor';
import CreateDispensary from './pages/CreateDispensary';
import EditDispensary from './pages/EditDispensary';
import ViewDispensary from './pages/ViewDispensary';
import AdminDispensaries from './pages/AdminDispensaries';
import BookingSummary from '@/components/booking/BookingSummary';
import Callback from './pages/Callback';
import DailyBookings from '@/pages/reports/DailyBookings';
import MonthlySummary from '@/pages/reports/MonthlySummary';
import DoctorPerformance from '@/pages/reports/DoctorPerformance';
import UserDispensaryAssignment from '@/pages/UserDispensaryAssignment';
// import DoctorDispensaryFeeManager from './components/admin/DoctorDispensaryFeeManager';
import Signup from './pages/Signup';
import AdminFeeManage from './pages/AdminFeeManage';
import MobileHome from './pages/MobileHome';
import TimeSlotManagement from './pages/TimeSlotManagement';
import CustomRoleManagement from './pages/admin/CustomRoleManagement';
import { Dashboard } from '@mui/icons-material';

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Index />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/doctors" element={<Doctors />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/callback" element={<Callback />} />
        
        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/doctors" element={<AdminDoctors />} />
        <Route path="/admin/dispensaries" element={<AdminDispensaries />} />
        <Route path="/admin/reports" element={<AdminReports />} />
        <Route path="/admin/time-slots" element={<AdminTimeSlots />} />
        <Route path="/admin/doctors/create" element={<CreateDoctor />} />
        <Route path="/admin/doctors/edit/:id" element={<EditDoctor />} />
        <Route path="/admin/doctors/view/:id" element={<ViewDoctor />} />
        <Route path="/admin/dispensaries/create" element={<CreateDispensary />} />
        <Route path="/admin/dispensaries/edit/:id" element={<EditDispensary />} />
        <Route path="/admin/dispensaries/view/:id" element={<ViewDispensary />} />
        <Route path="/admin/user-dispensary" element={<UserDispensaryAssignment />} />
        <Route path="/admin/roles" element={<CustomRoleManagement />} />
        <Route path='/admin/fees' element={<AdminFeeManage/>}/>
        
        {/* Specific Routes */}
        <Route path="/doctor/:doctorId/dispensary/:dispensaryId/time-slots" element={<TimeSlotManagement />} />
        
        {/* Booking Summary Route */}
        <Route path="/booking-summary/:transactionId" element={<BookingSummary />} />
        
        {/* Reports Routes */}
        <Route path="/reports/daily-bookings" element={<DailyBookings />} />
        <Route path="/reports/monthly-summary" element={<MonthlySummary />} />
        <Route path="/reports/doctor-performance" element={<DoctorPerformance />} />
        
        {/* Catch All - 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

export default App;
