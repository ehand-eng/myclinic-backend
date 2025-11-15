
import { useNavigate } from 'react-router-dom';
import AdminHeader from '@/components/AdminHeader';
import AdminFooter from '@/components/AdminFooter';
import AdminBookingForm from '@/components/admin/AdminBookingForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const Appointments = () => {
  const navigate = useNavigate();

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
};

export default Appointments;
