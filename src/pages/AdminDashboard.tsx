import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle,CardDescription,CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  UserPlus,
} from 'lucide-react';
import DashboardNavigation from '@/components/admin/DashboardNavigation';
import { User, UserRole, Doctor, Dispensary } from '@/api/models';
import { AuthService, DoctorService, DispensaryService, BookingService, DashboardService } from '@/api/services';
import type { DashboardStats, DashboardRange } from '@/api/services/DashboardService';
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
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

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
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [bookingsTableLoading, setBookingsTableLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [statsRange, setStatsRange] = useState<DashboardRange>('last_month');
  const [recentBookingsPage, setRecentBookingsPage] = useState(1);
  const recentBookingsLimit = 10;
  const prevRangeRef = useRef<DashboardRange>(statsRange);

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

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    let cancelled = false;
    const isRangeChange = prevRangeRef.current !== statsRange;
    prevRangeRef.current = statsRange;
    // Only show full loading on initial load or range change, not pagination
    if (isRangeChange || !dashboardStats) {
      setStatsLoading(true);
    } else {
      setBookingsTableLoading(true);
    }
    setStatsError(null);
    DashboardService.getStats({
      range: statsRange,
      page: recentBookingsPage,
      limit: recentBookingsLimit,
    })
      .then((data) => {
        if (!cancelled) setDashboardStats(data);
      })
      .catch((err) => {
        if (!cancelled) setStatsError(err?.response?.data?.message || err?.message || 'Failed to load dashboard stats');
      })
      .finally(() => {
        if (!cancelled) {
          setStatsLoading(false);
          setBookingsTableLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [statsRange, recentBookingsPage]);

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
          {/* Date range filter for dashboard blocks */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-medicalGray-600">Period:</span>
            <div className="flex rounded-lg border border-medicalGray-200 bg-white p-0.5">
              {(['last_week', 'last_month', 'all_time'] as const).map((r) => (
                <Button
                  key={r}
                  variant={statsRange === r ? 'default' : 'ghost'}
                  size="sm"
                  className="rounded-md"
                  onClick={() => {
                    setStatsRange(r);
                    setRecentBookingsPage(1);
                  }}
                >
                  {r === 'last_week' ? 'Last 7 days' : r === 'last_month' ? 'Last 30 days' : 'All time'}
                </Button>
              ))}
            </div>
            {dashboardStats?.dateFrom != null && dashboardStats?.dateTo != null && (
              <span className="text-xs text-medicalGray-500">
                {new Date(dashboardStats.dateFrom).toLocaleDateString()} – {new Date(dashboardStats.dateTo).toLocaleDateString()}
              </span>
            )}
          </div>

          {/* Overview KPI cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="medical-card animate-pulse">
                  <CardHeader className="pb-2">
                    <div className="h-4 bg-medicalGray-200 rounded w-2/3" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-8 bg-medicalGray-200 rounded w-1/3" />
                  </CardContent>
                </Card>
              ))
            ) : statsError ? (
              <div className="col-span-full">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{statsError}</AlertDescription>
                </Alert>
              </div>
            ) : dashboardStats ? (
              <>
                <Card className="medical-card group hover:scale-105 transition-all duration-300 fade-in-up">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-medicalGray-600">Total Dispensaries</CardTitle>
                      <Building2 className="h-5 w-5 text-medicalBlue-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-medicalBlue-600">{dashboardStats.totalDispensaries}</div>
                    <p className="text-xs text-medicalGray-500 mt-1">In your scope</p>
                  </CardContent>
                </Card>
                <Card className="medical-card group hover:scale-105 transition-all duration-300 fade-in-up" style={{ animationDelay: '0.1s' }}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-medicalGray-600">Active Doctors</CardTitle>
                      <Stethoscope className="h-5 w-5 text-medicalTeal-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-medicalTeal-600">{dashboardStats.totalDoctors}</div>
                    <p className="text-xs text-medicalGray-500 mt-1">Available</p>
                  </CardContent>
                </Card>
                <Card className="medical-card group hover:scale-105 transition-all duration-300 fade-in-up" style={{ animationDelay: '0.2s' }}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-medicalGray-600">Today&apos;s Appointments</CardTitle>
                      <Calendar className="h-5 w-5 text-purple-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-600">{dashboardStats.todayBookings}</div>
                    <p className="text-xs text-medicalGray-500 mt-1">Scheduled today</p>
                  </CardContent>
                </Card>
                <Card className="medical-card group hover:scale-105 transition-all duration-300 fade-in-up" style={{ animationDelay: '0.3s' }}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-medicalGray-600">
                        {statsRange === 'last_week' ? 'In period (7d)' : statsRange === 'last_month' ? 'In period (30d)' : 'Completed (all time)'}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-medicalGreen-600">{dashboardStats.completedThisMonth}</div>
                    <p className="text-xs text-medicalGray-500 mt-1">{dashboardStats.weekBookings ?? dashboardStats.monthBookings} total in period</p>
                  </CardContent>
                </Card>
              </>
            ) : null}
          </div>

          {/* Charts and tables - real data */}
          {dashboardStats && !statsLoading && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bookings last 7 days */}
              <Card className="medical-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Bookings (Last 7 Days)
                  </CardTitle>
                  <CardDescription>Daily appointment count</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      count: { label: 'Bookings', color: 'hsl(var(--chart-1))' },
                    }}
                    className="h-[240px] w-full"
                  >
                    <BarChart data={dashboardStats.bookingsLast7Days} margin={{ left: 12, right: 12 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} name="Bookings" />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Bookings by status (this month) */}
              <Card className="medical-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Bookings by Status ({statsRange === 'last_week' ? 'Last 7 days' : statsRange === 'last_month' ? 'Last 30 days' : 'All time'})
                  </CardTitle>
                  <CardDescription>Breakdown by status</CardDescription>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const statusData = Object.entries(dashboardStats.bookingsByStatus).map(([name, count]) => ({ name, count }));
                    const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];
                    if (statusData.length === 0) {
                      return <p className="text-sm text-muted-foreground py-8 text-center">No booking data this month</p>;
                    }
                    return (
                      <ChartContainer
                        config={Object.fromEntries(statusData.map((s) => [s.name, { label: s.name.replace(/_/g, ' '), color: COLORS[statusData.indexOf(s) % COLORS.length] }]))}
                        className="h-[240px] w-full"
                      >
                        <PieChart>
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Pie
                            data={statusData}
                            dataKey="count"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={2}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {statusData.map((_, i) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                        </PieChart>
                      </ChartContainer>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Bookings by dispensary */}
              {dashboardStats.bookingsByDispensary && dashboardStats.bookingsByDispensary.length > 0 && (
                <Card className="medical-card lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Bookings by Dispensary ({statsRange === 'last_week' ? 'Last 7 days' : statsRange === 'last_month' ? 'Last 30 days' : 'All time'})
                    </CardTitle>
                    <CardDescription>Appointments per location</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        count: { label: 'Bookings', color: 'hsl(var(--chart-1))' },
                      }}
                      className="h-[240px] w-full"
                    >
                      <BarChart
                        data={dashboardStats.bookingsByDispensary}
                        layout="vertical"
                        margin={{ left: 80, right: 12 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" width={72} tick={{ fontSize: 12 }} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="count" fill="var(--color-count)" radius={[0, 4, 4, 0]} name="Bookings" />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Recent bookings table with pagination */}
          {dashboardStats && !statsLoading && (
            <Card className="medical-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  Recent Bookings
                </CardTitle>
                <CardDescription>
                  {dashboardStats.recentBookingsTotal != null
                    ? `${dashboardStats.recentBookingsTotal} booking${dashboardStats.recentBookingsTotal !== 1 ? 's' : ''} in period`
                    : 'Latest appointments'}
                </CardDescription>
              </CardHeader>
              <CardContent className="relative">
                {bookingsTableLoading && (
                  <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center rounded-lg">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-medicalBlue-600" />
                      <span className="text-sm text-medicalGray-600">Loading bookings...</span>
                    </div>
                  </div>
                )}
                {(dashboardStats.recentBookingsTotal ?? 0) === 0 && dashboardStats.recentBookings.length === 0 ? (
                  <p className="text-center text-medicalGray-500 py-8">No bookings in selected period</p>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ref</TableHead>
                          <TableHead>Patient</TableHead>
                          <TableHead>Doctor</TableHead>
                          <TableHead>Dispensary</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dashboardStats.recentBookings.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-medicalGray-500 py-8">
                              No bookings on this page
                            </TableCell>
                          </TableRow>
                        ) : (
                          dashboardStats.recentBookings.map((b) => (
                            <TableRow key={b._id}>
                              <TableCell className="font-mono text-xs">{b.transactionId}</TableCell>
                              <TableCell>{b.patientName}</TableCell>
                              <TableCell>{b.doctorName ?? '—'}</TableCell>
                              <TableCell>{b.dispensaryName ?? '—'}</TableCell>
                              <TableCell>{b.bookingDate ? new Date(b.bookingDate).toLocaleString() : '—'}</TableCell>
                              <TableCell>
                                <Badge variant={b.status === 'completed' ? 'default' : b.status === 'cancelled' ? 'destructive' : 'secondary'}>
                                  {b.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                    {dashboardStats.recentBookingsTotal != null && dashboardStats.recentBookingsTotal > 0 && (
                      <div className="flex items-center justify-between mt-4">
                        <p className="text-sm text-medicalGray-600">
                          Page {dashboardStats.recentBookingsPage ?? 1} of{' '}
                          {Math.max(1, Math.ceil((dashboardStats.recentBookingsTotal ?? 0) / (dashboardStats.recentBookingsLimit ?? 10)))}
                          {' '}({dashboardStats.recentBookingsTotal} total)
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={(dashboardStats.recentBookingsPage ?? 1) <= 1}
                            onClick={() => setRecentBookingsPage((p) => Math.max(1, p - 1))}
                          >
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={
                              (dashboardStats.recentBookingsPage ?? 1) >=
                              Math.ceil((dashboardStats.recentBookingsTotal ?? 0) / (dashboardStats.recentBookingsLimit ?? 10))
                            }
                            onClick={() => setRecentBookingsPage((p) => p + 1)}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}
          
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
