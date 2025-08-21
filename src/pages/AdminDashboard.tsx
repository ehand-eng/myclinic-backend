import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle,CardDescription,CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  Building2, 
  Calendar, 
  TrendingUp, 
  UserCheck, 
  Stethoscope,
  ClipboardList,
  Settings,
  BarChart3,
  AlertCircle,
  Clock,
  DollarSign,
  Activity,
  Loader2,
  Shield
} from 'lucide-react';
import { User, UserRole, Doctor, Dispensary } from '@/api/models';
import { AuthService, DoctorService, DispensaryService, BookingService } from '@/api/services';
import UserManagement from '@/components/admin/UserManagement';
import RoleAssignment from '@/components/admin/RoleAssignment';
import ReportGenerator from '@/components/admin/ReportGenerator';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdminFeeManage from './AdminFeeManage';
// import DoctorDispensaryFeeManager from '@/components/AdminF';

// Get API URL from environment variables with fallback
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Detect environment - local by default
const IS_LOVABLE_ENVIRONMENT = window.location.hostname.includes('lovableproject.com') || 
                              window.location.hostname.includes('lovable.app');
// Force local development mode if needed
const LOCAL_DEV_MODE = false;

const AdminDashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check authentication on component mount
    const checkAuth = async () => {
      setIsLoading(true);
      console.log('Checking authentication...');

      //try {
        // Get token from local storage
        const token = localStorage.getItem('auth_token');
        const userStr = localStorage.getItem("current_user");
        setCurrentUser(userStr ? JSON.parse(userStr) : null);
        console.log(">>>>>. current user");
        console.log(currentUser);
        console.log("=======================");
        console.log('Auth token found:', !!token);
        setIsLoading(false);
        if (!token) {
          console.log('No auth token in localStorage');
          navigate('/login', { replace: true });
        }
    };

    checkAuth();
  }, [navigate, toast]);

  const handleLogout = () => {
    console.log("lLLLLLLLLLLL");
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
    toast({
      title: "Logged out",
      description: "You have been successfully logged out"
    });
    navigate('/login', { replace: true });
  };

 // Check if user has a specific permission
 const hasPermission = (permission: string) => {
  if (IS_LOVABLE_ENVIRONMENT || LOCAL_DEV_MODE) {
    // In development mode, allow all permissions
    return true;
  }

  if (!currentUser || !currentUser.permissions) {
    return false;
  }

  return currentUser.permissions.includes(permission);
};

if (isLoading) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow flex items-center justify-center">
        <p className="text-xl">Loading dashboard...</p>
      </main>
      <Footer />
    </div>
  );
}

return (
  <div className="flex flex-col min-h-screen">
    <Header />
    
    <main className="flex-grow container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        {/* <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-500">
            Welcome  {currentUser?.name} ({currentUser?.role.replace('_', ' ')})
          </p>
        </div> */}
        
        {/* <div className="mt-4 md:mt-0 space-x-2">
          <Button onClick={() => navigate('/admin/profile')} variant="outline">
            Profile
          </Button>
          <Button onClick={handleLogout} variant="outline" className="bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700">
            Logout
          </Button>
        </div> */}
      </div>
      
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-7 mb-8">
        {currentUser?.role === UserRole.SUPER_ADMIN && (
          <TabsTrigger value="overview">Overview</TabsTrigger>)}
          {currentUser?.role === UserRole.SUPER_ADMIN && (
            <TabsTrigger value="dispensaries">Dispensaries</TabsTrigger>)}
          {currentUser?.role === UserRole.SUPER_ADMIN && (
            <TabsTrigger value="doctors">Doctors</TabsTrigger>)}
          {(currentUser?.role === UserRole.SUPER_ADMIN || currentUser?.role === UserRole.HOSPITAL_ADMIN) && (
            <TabsTrigger value="timeslots">TimeSlots</TabsTrigger>)}
          {(currentUser?.role === UserRole.SUPER_ADMIN || currentUser?.role === UserRole.HOSPITAL_ADMIN) && (
            <TabsTrigger value="bookings">Bookings</TabsTrigger>)}
          {(currentUser?.role === UserRole.SUPER_ADMIN || currentUser?.role === UserRole.HOSPITAL_ADMIN) && (
            <TabsTrigger value="reports">Reports</TabsTrigger>)}
          {currentUser?.role === UserRole.SUPER_ADMIN && (
            <TabsTrigger value="fee-management">Fee Management</TabsTrigger>)}
          {currentUser?.role === UserRole.SUPER_ADMIN && (
            <TabsTrigger value="user-dispensary">Assign Users</TabsTrigger>)}
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Dispensaries
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">4</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Doctors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">3</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Today's Appointments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">12</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Completed Appointments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">45</div>
              </CardContent>
            </Card>
          </div>
          
          {/* Add a new Time Slot Management card */}
          
          
          {/* More dashboard content based on role */}
          {currentUser?.role === UserRole.SUPER_ADMIN && (
            <div className="mt-8">
              <Card>
                <CardHeader>
                  <CardTitle>System Administration</CardTitle>
                  <CardDescription>Manage users and system settings</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Button onClick={() => navigate('/admin/users')} className="w-full">
                    Manage Users
                  </Button>
                  <Button onClick={() => navigate('/admin/roles')} className="w-full">
                    Manage Roles
                  </Button>
                  <Button onClick={() => navigate('/admin/settings')} className="w-full">
                    System Settings
                  </Button>
                  <Button onClick={() => navigate('/admin/user-dispensary')} className="w-full">
                    User-Dispensary Assignment
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
          
          {currentUser?.role === UserRole.HOSPITAL_ADMIN && (
            <div className="mt-8">
              <Card>
                <CardHeader>
                  <CardTitle>Dispensary Management</CardTitle>
                  <CardDescription>Manage your dispensary operations</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Button onClick={() => navigate('/admin/doctors')} className="w-full">
                    Manage Doctors
                  </Button>
                  <Button onClick={() => navigate('/admin/dispensary/timeslots')} className="w-full">
                    Manage Time Slots
                  </Button>
                  <Button onClick={() => navigate('/admin/dispensary/staff')} className="w-full">
                    Manage Staff
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
          
          {currentUser?.role === UserRole.hospital_staff && (
            <div className="mt-8">
              <Card>
                <CardHeader>
                  <CardTitle>Patient Management</CardTitle>
                  <CardDescription>Manage patient check-ins and appointments</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button onClick={() => navigate('/admin/patients/check-in')} className="w-full">
                    Patient Check-In
                  </Button>
                  <Button onClick={() => navigate('/admin/appointments')} className="w-full">
                    Today's Appointments
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="dispensaries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dispensaries Management</CardTitle>
              <CardDescription>View and manage all dispensaries in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Manage dispensary locations, contact information, and associated doctors.</p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button onClick={() => navigate('/admin/dispensaries')} className="bg-medical-600 hover:bg-medical-700">
                View All Dispensaries
              </Button>
              <Button onClick={() => navigate('/admin/dispensaries/create')} variant="outline">
                Add New Dispensary
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="doctors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Doctors Management</CardTitle>
              <CardDescription>View and manage all doctors in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Manage doctor profiles, specializations, qualifications, and dispensary assignments.</p>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
              <Button onClick={() => navigate('/admin/doctors')} className="bg-medical-600 hover:bg-medical-700">
                View All Doctors
              </Button>
              <Button onClick={() => navigate('/admin/doctors/create')} variant="outline">
                Add New Doctor
              </Button>
              <Button onClick={() => navigate('/admin/time-slots')} variant="outline">
                Manage Time Slots
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="timeslots" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Time Slot Management</CardTitle>
              <CardDescription>
                Manage doctor time slots and availability at dispensaries
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4">
              <Button onClick={() => navigate('/admin/time-slots')} className="bg-medical-600 hover:bg-medical-700">
                Manage Time Slots
              </Button>
            </CardContent>
          </Card>
          </TabsContent>
        
        <TabsContent value="bookings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bookings Management</CardTitle>
              <CardDescription>View and manage all bookings in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Bookings list will be displayed here based on user role permissions.</p>
            </CardContent>
            <CardFooter>
              <Button onClick={() => navigate('/booking')}>View All Bookings</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reports</CardTitle>
              <CardDescription>Generate and view system reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button onClick={() => navigate('/reports/daily-bookings')}>
                  Daily Bookings Report
                </Button>
                <Button onClick={() => navigate('/reports/monthly-summary')}>
                  Monthly Summary Report
                </Button>
                <Button onClick={() => navigate('/reports/doctor-performance')}>
                  Doctor Performance Report
                </Button>
                {currentUser?.role === UserRole.SUPER_ADMIN && (
                  <Button onClick={() => navigate('/reports/dispensary-revenue')}>
                    Dispensary Revenue Report
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fee-management" className="space-y-6">
          <AdminFeeManage />
        </TabsContent>

        <TabsContent value="user-dispensary" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User-Dispensary Assignment</CardTitle>
              <CardDescription>
                Manage user assignments to dispensaries and their roles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button 
                  onClick={() => navigate('/admin/user-dispensary')}
                  className="w-full bg-medical-600 hover:bg-medical-700"
                >
                  Manage Assignments
                </Button>
                <Button 
                  onClick={() => navigate('/admin/users')}
                  className="w-full"
                >
                  Manage Users
                </Button>
                <Button 
                  onClick={() => navigate('/admin/dispensaries')}
                  className="w-full"
                >
                  Manage Dispensaries
                </Button>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <div className="text-sm text-muted-foreground">
                <p>Quick Actions:</p>
                <ul className="list-disc list-inside mt-2">
                  <li>Assign users to dispensaries</li>
                  <li>Manage user roles and permissions</li>
                  <li>View current assignments</li>
                  <li>Update or remove assignments</li>
                </ul>
              </div>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Assignments</CardTitle>
              <CardDescription>
                Latest user-dispensary assignments and changes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* This would be populated with actual data */}
                <div className="text-sm text-muted-foreground">
                  No recent assignments to display
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
    
    <Footer />
  </div>
);
};

export default AdminDashboard;
