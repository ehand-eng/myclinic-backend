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
  Shield,
  Home,
  MapPin,
  User as UserIcon,
  BookOpen,
  FileText,
  UserPlus
} from 'lucide-react';
import DashboardNavigation from '@/components/admin/DashboardNavigation';
import { User, UserRole, Doctor, Dispensary } from '@/api/models';
import { AuthService, DoctorService, DispensaryService, BookingService } from '@/api/services';
import UserManagement from '@/components/admin/UserManagement';
import RoleAssignment from '@/components/admin/RoleAssignment';
import ReportGenerator from '@/components/admin/ReportGenerator';
import CustomRoleAssignment from '@/components/admin/CustomRoleAssignment';
import AdminHeader from '@/components/AdminHeader';
import AdminFooter from '@/components/AdminFooter';
import AdminFeeManage from './AdminFeeManage';
import AdminBookingForm from '@/components/admin/AdminBookingForm';
import { 
  isSuperAdmin, 
  isChannelPartner,
  canManageDispensaries, 
  canManageDoctors, 
  canManageTimeslots, 
  canManageBookings, 
  canCreateBookings,
  canViewReports, 
  canViewOwnReports,
  canManageFees, 
  canManagePatientCheckIn
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

  // Define navigation tabs with icons and visibility logic
  const getNavigationTabs = () => [
    {
      id: "overview",
      label: "Overview",
      icon: <Home className="w-4 h-4" />,
      visible: true,
    },
    {
      id: "dispensaries",
      label: "Dispensaries",
      icon: <MapPin className="w-4 h-4" />,
      visible: canManageDispensaries(currentUser?.role),
    },
    {
      id: "doctors",
      label: "Doctors",
      icon: <UserIcon className="w-4 h-4" />,
      visible: canManageDoctors(currentUser?.role),
    },
    {
      id: "timeslots",
      label: "TimeSlots",
      icon: <Clock className="w-4 h-4" />,
      visible: canManageTimeslots(currentUser?.role),
    },
    {
      id: "bookings",
      label: "Bookings",
      icon: <Calendar className="w-4 h-4" />,
      visible: canManageBookings(currentUser?.role),
    },
    {
      id: "create-booking",
      label: "Create Booking",
      icon: <BookOpen className="w-4 h-4" />,
      visible: canCreateBookings(currentUser?.role) && !canManageBookings(currentUser?.role),
    },
    {
      id: "reports",
      label: "Reports",
      icon: <FileText className="w-4 h-4" />,
      visible: canViewReports(currentUser?.role) || canViewOwnReports(currentUser?.role),
    },
    {
      id: "fee-management",
      label: "Fee Management",
      icon: <DollarSign className="w-4 h-4" />,
      visible: canManageFees(currentUser?.role),
    },
    {
      id: "user-dispensary",
      label: "Assign Users vvv",
      icon: <UserPlus className="w-4 h-4" />,
      visible: isSuperAdmin(currentUser?.role),
    },
    {
      id: "check-in",
      label: "Check-In",
      icon: <UserPlus className="w-4 h-4" />,
      visible: canManagePatientCheckIn(currentUser?.role),
    },
  ];

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
      <AdminHeader />
      <main className="flex-grow flex items-center justify-center">
        <p className="text-xl">Loading dashboard...</p>
      </main>
      <AdminFooter />
    </div>
  );
}

return (
  <div className="flex flex-col min-h-screen">
    <AdminHeader />
    
    <main className="flex-grow bg-gradient-to-br from-medicalBlue-50 via-white to-medicalTeal-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
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
        </div> */}
      
      <div className="space-y-6">
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
                  {/* <CheckCircle className="h-5 w-5 text-medicalGreen-600" /> */}
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
          
          {isChannelPartner(currentUser?.role) && (
            <div className="mt-8">
              <Card>
                <CardHeader>
                  <CardTitle>Channel Partner Operations</CardTitle>
                  <CardDescription>Create bookings and view your performance reports</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button onClick={() => setActiveTab('create-booking')} className="w-full bg-medical-600 hover:bg-medical-700">
                    Create New Booking
                  </Button>
                  <Button onClick={() => setActiveTab('reports')} className="w-full">
                    View My Reports
                  </Button>
                </CardContent>
              </Card>
            </div>
        )}
          

        

        

        


      </div>
      </div>
    </main>
    
    <AdminFooter />
  </div>
);
};

export default AdminDashboard;
