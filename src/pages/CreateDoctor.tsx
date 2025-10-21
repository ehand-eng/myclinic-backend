
import AdminHeader from '@/components/AdminHeader';
import AdminFooter from '@/components/AdminFooter';
import DoctorForm from '@/components/DoctorForm';

const CreateDoctor = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <AdminHeader />
      <main className="container mx-auto px-4 py-8 flex-grow">
        <h1 className="text-3xl font-bold mb-6">Add New Doctor</h1>
        <DoctorForm />
      </main>
      <AdminFooter />
    </div>
  );
};

export default CreateDoctor;
