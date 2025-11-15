import React from 'react';
import AdminHeader from '@/components/AdminHeader';
import AdminFooter from '@/components/AdminFooter';
import SimpleFeeManagement from '@/components/SimpleFeeManagement';

const AdminFeeManage: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <AdminHeader />
      
      <main className="flex-grow bg-gradient-to-br from-medicalBlue-50 via-white to-medicalTeal-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold medical-text-gradient">Fee Management</h1>
            <p className="text-medicalGray-600 mt-2">Manage dispensary and doctor fees</p>
          </div>
          
          <SimpleFeeManagement />
        </div>
      </main>
      
      <AdminFooter />
    </div>
  );
};

export default AdminFeeManage;