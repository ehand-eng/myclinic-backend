
import { useState, useEffect } from 'react';
import AdminHeader from '@/components/AdminHeader';
import AdminFooter from '@/components/AdminFooter';
import ReportGenerator from '@/components/admin/ReportGenerator';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { AuthService } from '@/api/services';

const AdminReports = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      
      // Get token from local storage
      const token = localStorage.getItem('auth_token');
      const userStr = localStorage.getItem('current_user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      if (!token || !user) {
        toast({
          title: "Authentication required",
          description: "Please log in to access the reports",
          variant: "destructive"
        });
        navigate('/login');
        return;
      }
      
      setCurrentUser(user);
      setIsLoading(false);
    };
    
    checkAuth();
  }, [navigate, toast]);
  
  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <AdminHeader />
        <main className="flex-grow flex items-center justify-center">
          <p className="text-xl">Loading reports...</p>
        </main>
        <AdminFooter />
      </div>
    );
  }
  
  return (
    <div className="flex flex-col min-h-screen">
      <AdminHeader />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold medical-text-gradient">Reports</h1>
          <p className="text-medicalGray-600 mt-2">Generate and view system reports</p>
        </div>
        
        <ReportGenerator />
      </main>
      
      <AdminFooter />
    </div>
  );
};

export default AdminReports;
