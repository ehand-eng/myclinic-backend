import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SimpleFeeManagement from '@/components/SimpleFeeManagement';

const AdminFeeManage: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8 flex-grow">
        <SimpleFeeManagement />
      </main>
      <Footer />
    </div>
  );
};

export default AdminFeeManage;