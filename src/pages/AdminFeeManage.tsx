import React from 'react';
import AdminHeader from '@/components/AdminHeader';
import AdminFooter from '@/components/AdminFooter';
import SimpleFeeManagement from '@/components/SimpleFeeManagement';
import SuperAdminFeeManagement from '@/components/SuperAdminFeeManagement';
import { isSuperAdmin } from '@/lib/roleUtils';

const AdminFeeManage: React.FC = () => {
  const currentUserStr = localStorage.getItem("current_user");
  const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
  const superAdminMode = isSuperAdmin(currentUser?.role);
  return (
    <div className="flex flex-col min-h-screen">
      <AdminHeader />
      
      <main className="flex-grow bg-gradient-to-br from-medicalBlue-50 via-white to-medicalTeal-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold medical-text-gradient">Fee Management</h1>
            <p className="text-medicalGray-600 mt-2">
              {superAdminMode ? 'Manage global dispensary fees' : 'Manage dispensary and doctor fees'}
            </p>
          </div>
          
          {superAdminMode ? <SuperAdminFeeManagement /> : <SimpleFeeManagement />}
        </div>
      </main>
      
      <AdminFooter />
    </div>
  );
};

export default AdminFeeManage;