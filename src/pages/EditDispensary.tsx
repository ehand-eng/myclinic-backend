
import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminHeader from '@/components/AdminHeader';
import AdminFooter from '@/components/AdminFooter';
import DispensaryForm from '@/components/DispensaryForm';
import { canEditDispensaries } from '@/lib/roleUtils';

const EditDispensary = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const userStr = typeof window !== 'undefined' ? localStorage.getItem('current_user') : null;
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const canEdit = canEditDispensaries(currentUser?.role);

  useEffect(() => {
    if (!canEdit) {
      navigate('/admin/dispensaries', { replace: true });
    }
  }, [canEdit, navigate]);

  if (!canEdit) {
    return null;
  }

  if (!id) {
    return (
      <div className="flex flex-col min-h-screen">
        <AdminHeader />
        <main className="flex-grow bg-gradient-to-br from-medicalBlue-50 via-white to-medicalTeal-50">
          <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold medical-text-gradient mb-6">Error: Dispensary ID not provided</h1>
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
          <h1 className="text-3xl font-bold medical-text-gradient mb-6">Edit Dispensary</h1>
          <DispensaryForm dispensaryId={id} isEdit={true} />
        </div>
      </main>
      <AdminFooter />
    </div>
  );
};

export default EditDispensary;
