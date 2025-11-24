import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  Stethoscope, 
  Clock, 
  Calendar, 
  BarChart3, 
  DollarSign, 
  Users,
  LogOut,
  Menu,
  X,
  LayoutDashboard
} from 'lucide-react';
import { getRoleDisplayName } from '@/lib/roleUtils';
import { useState } from 'react';

const AdminHeader = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const userStr = localStorage.getItem('current_user');
  const user = userStr ? JSON.parse(userStr) : null;

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
    navigate('/login');
  };

  const normalizedRole = user?.role?.toLowerCase() || null;

  const navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
    { key: 'dispensaries', label: 'Dispensaries', icon: Building2, path: '/admin/dispensaries' },
    { key: 'doctors', label: 'Doctors', icon: Stethoscope, path: '/admin/doctors' },
    { key: 'time-slots', label: 'Time Slots', icon: Clock, path: '/admin/time-slots' },
    { key: 'reports', label: 'Reports', icon: BarChart3, path: '/admin/reports' },
    { key: 'bookings', label: 'Bookings', icon: Calendar, path: '/admin/bookings' },
    { key: 'fees', label: 'Fee Management', icon: DollarSign, path: '/admin/fees' },
    { key: 'assign-users', label: 'Assign Users', icon: Users, path: '/admin/user-dispensary' },
  ];

  const getFilteredNavItems = () => {
    if (!normalizedRole) {
      return navItems;
    }

    if (normalizedRole === 'channel-partner') {
      const allowed = new Set(['bookings', 'reports']);
      return navItems.filter(item => allowed.has(item.key));
    }

    if (normalizedRole === 'dispensary-admin' || normalizedRole === 'dispensary-staff') {
      const allowed = new Set(['dashboard', 'dispensaries', 'doctors', 'time-slots', 'reports', 'bookings']);
      return navItems.filter(item => allowed.has(item.key));
    }

    return navItems;
  };

  const filteredNavItems = getFilteredNavItems();

  return (
    <header className="sticky top-0 z-50">
      {/* Top Bar - Logo and User Info */}
      <div className="bg-gradient-to-br from-medicalGray-900 via-medicalBlue-900 to-medicalTeal-900 text-white shadow-lg">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo/Brand */}
            <div className="flex items-center space-x-3">
              <div className="medical-icon-bg-dark">
                <Building2 className="h-6 w-6 text-medicalBlue-400" />
              </div>
              <Link to="/admin/dashboard" className="font-bold text-2xl text-white hover:text-medicalBlue-300 transition-colors">
                Admin Dashboard
              </Link>
            </div>

            {/* User Info & Actions */}
            <div className="flex items-center space-x-4">
              {user && (
                <>
                  <div className="hidden md:block text-right">
                    <div className="text-sm font-medium text-medicalGray-300">
                      {user.email}
                    </div>
                    {user.role && (
                      <div className="text-xs text-medicalBlue-400 font-medium">
                        {getRoleDisplayName(user.role)}
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    size="sm"
                    className="border-red-400 text-red-300 hover:bg-red-500/20 hover:text-red-200"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </>
              )}
              
              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg text-medicalGray-300 hover:bg-white/10 hover:text-white transition-colors"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar - Navigation Menu */}
      <div className="bg-gradient-to-r from-medicalBlue-800 to-medicalTeal-800 text-white shadow-md">
        <div className="container mx-auto px-4 py-2">
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center justify-center space-x-1">
            {filteredNavItems.map(item => {
              const Icon = item.icon;
              return (
                <Link 
                  key={item.key}
                  to={item.path}
                  className="flex flex-col items-center space-y-1 px-3 py-2 rounded-lg text-medicalGray-200 hover:bg-white/10 hover:text-white transition-colors min-w-[100px]"
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-xs font-medium text-center">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <nav className="lg:hidden">
              <div className="grid grid-cols-2 gap-2 pt-2">
                {filteredNavItems.map(item => {
                  const Icon = item.icon;
                  return (
                    <Link 
                      key={item.key}
                      to={item.path}
                      className="flex items-center space-x-2 px-3 py-2 rounded-lg text-medicalGray-200 hover:bg-white/10 hover:text-white transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </nav>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;

