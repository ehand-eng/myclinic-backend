
import { useParams } from 'react-router-dom';
import AdminHeader from '@/components/AdminHeader';
import AdminFooter from '@/components/AdminFooter';
import DoctorForm from '@/components/DoctorForm';

const EditDoctor = () => {
  const { id } = useParams<{ id: string }>();
  
  if (!id) {
    return (
      <div className="flex flex-col min-h-screen">
        <AdminHeader />
        <main className="flex-grow bg-gradient-to-br from-medicalBlue-50 via-white to-medicalTeal-50">
          <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold medical-text-gradient mb-6">Error: Doctor ID not provided</h1>
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
          <h1 className="text-3xl font-bold medical-text-gradient mb-6">Edit Doctor</h1>
          <DoctorForm doctorId={id} isEdit={true} />
        </div>
      </main>
      <AdminFooter />
    </div>
  );
};

export default EditDoctor;
