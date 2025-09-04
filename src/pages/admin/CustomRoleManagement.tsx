import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CustomRoleAssignment from '@/components/admin/CustomRoleAssignment';

const CustomRoleManagement = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Role Management</h1>
          <p className="text-gray-500 mt-2">
            Manage users, roles, and permissions in the system
          </p>
        </div>
        <CustomRoleAssignment />
      </main>
      <Footer />
    </div>
  );
};

export default CustomRoleManagement;