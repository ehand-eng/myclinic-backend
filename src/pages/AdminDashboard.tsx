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
import CustomRoleAssignment from '@/components/admin/CustomRoleAssignment';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdminFeeManage from './AdminFeeManage';
import { 
  isSuperAdmin, 
  canManageDispensaries, 
  canManageDoctors, 
  canManageTimeslots, 
  canManageBookings, 
  canViewReports, 
  canManageFees 
} from '@/lib/roleUtils';
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
        const user = userStr ? JSON.parse(userStr) : null;
        setCurrentUser(user);
        console.log(">>>>>. current user");
        console.log(user);
        console.log("User role:", user?.role);
        console.log("Role type:", typeof user?.role);
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
    
    <main className="flex-grow bg-gradient-to-br from-medicalBlue-50 via-white to-medicalTeal-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div className="fade-in-up">
            <h1 className="text-4xl font-bold medical-text-gradient mb-2">Admin Dashboard</h1>
            <p className="text-medicalGray-600 text-lg">
              Welcome {currentUser?.name} ({currentUser?.role.replace('_', ' ')})
            </p>
          </div>
          
          <div className="mt-4 md:mt-0 space-x-3 fade-in-up" style={{ animationDelay: '0.2s' }}>
            <Button onClick={() => navigate('/admin/profile')} variant="outline" className="medical-button-outline">
              Profile
            </Button>
            <Button onClick={handleLogout} variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">
              Logout
            </Button>
          </div>
        </div>
      
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-7 mb-8 bg-white/80 backdrop-blur-sm border border-medicalBlue-100 shadow-lg">
          <TabsTrigger value="overview" className="data-[state=active]:bg-medicalBlue-600 data-[state=active]:text-white">Overview</TabsTrigger>
          {canManageDispensaries(currentUser?.role) && (
            <TabsTrigger value="dispensaries" className="data-[state=active]:bg-medicalBlue-600 data-[state=active]:text-white">Dispensaries</TabsTrigger>)}
          {canManageDoctors(currentUser?.role) && (
            <TabsTrigger value="doctors" className="data-[state=active]:bg-medicalBlue-600 data-[state=active]:text-white">Doctors</TabsTrigger>)}
          {canManageTimeslots(currentUser?.role) && (
            <TabsTrigger value="timeslots" className="data-[state=active]:bg-medicalBlue-600 data-[state=active]:text-white">TimeSlots</TabsTrigger>)}
          {canManageBookings(currentUser?.role) && (
            <TabsTrigger value="bookings" className="data-[state=active]:bg-medicalBlue-600 data-[state=active]:text-white">Bookings</TabsTrigger>)}
          {canViewReports(currentUser?.role) && (
            <TabsTrigger value="reports" className="data-[state=active]:bg-medicalBlue-600 data-[state=active]:text-white">Reports</TabsTrigger>)}
          {canManageFees(currentUser?.role) && (
            <TabsTrigger value="fee-management" className="data-[state=active]:bg-medicalBlue-600 data-[state=active]:text-white">Fee Management</TabsTrigger>)}
          {isSuperAdmin(currentUser?.role) && (
            <TabsTrigger value="user-dispensary" className="data-[state=active]:bg-medicalBlue-600 data-[state=active]:text-white">Assign Users</TabsTrigger>)}
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="medical-card group hover:scale-105 transition-all duration-300 fade-in-up">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-medicalGray-600">
                    Total Dispensaries
                  </CardTitle>
                  <Building2 className="h-5 w-5 text-medicalBlue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-medicalBlue-600">4</div>
                <p className="text-xs text-medicalGray-500 mt-1">+2 from last month</p>
              </CardContent>
            </Card>
            
            <Card className="medical-card group hover:scale-105 transition-all duration-300 fade-in-up" style={{ animationDelay: '0.1s' }}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-medicalGray-600">
                    Active Doctors
                  </CardTitle>
                  <Stethoscope className="h-5 w-5 text-medicalTeal-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-medicalTeal-600">3</div>
                <p className="text-xs text-medicalGray-500 mt-1">All available</p>
              </CardContent>
            </Card>
            
            <Card className="medical-card group hover:scale-105 transition-all duration-300 fade-in-up" style={{ animationDelay: '0.2s' }}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-medicalGray-600">
                    Today's Appointments
                  </CardTitle>
                  <Calendar className="h-5 w-5 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">12</div>
                <p className="text-xs text-medicalGray-500 mt-1">8 completed, 4 pending</p>
              </CardContent>
            </Card>
            
            <Card className="medical-card group hover:scale-105 transition-all duration-300 fade-in-up" style={{ animationDelay: '0.3s' }}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-medicalGray-600">
                    Completed Appointments
                  </CardTitle>
                  <CheckCircle className="h-5 w-5 text-medicalGreen-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-medicalGreen-600">45</div>
                <p className="text-xs text-medicalGray-500 mt-1">This month</p>
              </CardContent>
            </Card>
          </div>
          
          {/* Add a new Time Slot Management card */}
          
          
          {/* More dashboard content based on role */}
          {isSuperAdmin(currentUser?.role) && (
            <div className="mt-8 fade-in-up" style={{ animationDelay: '0.4s' }}>
              <Card className="medical-card">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="medical-icon-bg">
                      <Shield className="h-6 w-6 text-medicalBlue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold text-medicalGray-800">System Administration</CardTitle>
                      <CardDescription className="text-medicalGray-600">Manage users and system settings</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Button onClick={() => navigate('/admin/users')} className="w-full medical-button">
                    <Users className="h-4 w-4 mr-2" />
                    Manage Users
                  </Button>
                  <Button onClick={() => navigate('/admin/roles')} className="w-full medical-button">
                    <UserCheck className="h-4 w-4 mr-2" />
                    Manage Roles
                  </Button>
                  <Button onClick={() => navigate('/admin/settings')} className="w-full medical-button">
                    <Settings className="h-4 w-4 mr-2" />
                    System Settings
                  </Button>
                  <Button onClick={() => navigate('/admin/user-dispensary')} className="w-full medical-button">
                    <Building2 className="h-4 w-4 mr-2" />
                    User-Dispensary Assignment
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
          
          {currentUser?.role === UserRole.HOSPITAL_ADMIN && (
            <div className="mt-8 fade-in-up" style={{ animationDelay: '0.5s' }}>
              <Card className="medical-card">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="medical-icon-bg">
                      <Building2 className="h-6 w-6 text-medicalTeal-600" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold text-medicalGray-800">Dispensary Management</CardTitle>
                      <CardDescription className="text-medicalGray-600">Manage your dispensary operations</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Button onClick={() => navigate('/admin/doctors')} className="w-full medical-button">
                    <Stethoscope className="h-4 w-4 mr-2" />
                    Manage Doctors
                  </Button>
                  <Button onClick={() => navigate('/admin/dispensary/timeslots')} className="w-full medical-button">
                    <Clock className="h-4 w-4 mr-2" />
                    Manage Time Slots
                  </Button>
                  <Button onClick={() => navigate('/admin/dispensary/staff')} className="w-full medical-button">
                    <Users className="h-4 w-4 mr-2" />
                    Manage Staff
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
          
          {currentUser?.role === UserRole.hospital_staff && (
            <div className="mt-8 fade-in-up" style={{ animationDelay: '0.6s' }}>
              <Card className="medical-card">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="medical-icon-bg">
                      <Activity className="h-6 w-6 text-medicalGreen-600" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold text-medicalGray-800">Patient Management</CardTitle>
                      <CardDescription className="text-medicalGray-600">Manage patient check-ins and appointments</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button onClick={() => navigate('/admin/patients/check-in')} className="w-full medical-button">
                    <UserCheck className="h-4 w-4 mr-2" />
                    Patient Check-In
                  </Button>
                  <Button onClick={() => navigate('/admin/appointments')} className="w-full medical-button">
                    <Calendar className="h-4 w-4 mr-2" />
                    Today's Appointments
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="dispensaries" className="space-y-4">
          <Card className="medical-card">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="medical-icon-bg">
                  <Building2 className="h-6 w-6 text-medicalBlue-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-medicalGray-800">Dispensaries Management</CardTitle>
                  <CardDescription className="text-medicalGray-600">View and manage all dispensaries in the system</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-medicalGray-600">Manage dispensary locations, contact information, and associated doctors.</p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button onClick={() => navigate('/admin/dispensaries')} className="medical-button">
                <Building2 className="h-4 w-4 mr-2" />
                View All Dispensaries
              </Button>
              <Button onClick={() => navigate('/admin/dispensaries/create')} variant="outline" className="medical-button-outline">
                <Building2 className="h-4 w-4 mr-2" />
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
                {isSuperAdmin(currentUser?.role) && (
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
          <Tabs defaultValue="manage-users" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manage-users">Manage Users</TabsTrigger>
              <TabsTrigger value="assign-roles">Assign Roles</TabsTrigger>
            </TabsList>
            
            <TabsContent value="manage-users" className="space-y-4">
              <CustomRoleAssignment />
            </TabsContent>
            
            <TabsContent value="assign-roles" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Role Assignment Management</CardTitle>
                  <CardDescription>
                    View and manage existing user-role assignments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RoleAssignment />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
      </div>
    </main>
    
    <Footer />
  </div>
);
};

export default AdminDashboard;
