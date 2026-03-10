
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminHeader from '@/components/AdminHeader';
import AdminFooter from '@/components/AdminFooter';
import DispensaryForm from '@/components/DispensaryForm';
import { canManageDispensaries } from '@/lib/roleUtils';

const CreateDispensary = () => {
  const navigate = useNavigate();
  const userStr = typeof window !== 'undefined' ? localStorage.getItem('current_user') : null;
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const canManage = canManageDispensaries(currentUser?.role);

  useEffect(() => {
    if (!canManage) {
      navigate('/admin/dispensaries', { replace: true });
    }
  }, [canManage, navigate]);

  if (!canManage) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <AdminHeader />
      <main className="flex-grow bg-gradient-to-br from-medicalBlue-50 via-white to-medicalTeal-50">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold medical-text-gradient mb-6">Add New Dispensary</h1>
          <DispensaryForm />
        </div>
      </main>
      <AdminFooter />
    </div>
  );
};

export default CreateDispensary;
