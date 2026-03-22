import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Building2 } from 'lucide-react';
import api from '@/lib/axios';

const ADMIN_ROLES = ['super-admin', 'dispensary-admin', 'dispensary-staff', 'doctor', 'channel-partner'];
const isAdminRole = (role: string) => role && ADMIN_ROLES.includes(role.toLowerCase().replace(/_/g, '-'));

const AdminLogin = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('current_user');
    const token = localStorage.getItem('auth_token');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        if (isAdminRole(user?.role)) {
          if (user.mustChangePassword) {
            navigate('/admin/change-password', { replace: true });
          } else {
            navigate('/admin/dashboard', { replace: true });
          }
        }
      } catch (_) {}
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast({
        title: 'Error',
        description: 'Please enter email and password',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.post('/custom-auth/login-admin', {
        email: email.trim(),
        password
      });

      const { token, user: userData } = response.data;
      localStorage.setItem('auth_token', token);
      localStorage.setItem('current_user', JSON.stringify(userData));

      toast({
        title: 'Login Successful',
        description: userData.mustChangePassword ? 'Please set your new password.' : 'Welcome back!'
      });

      if (userData.mustChangePassword) {
        navigate('/admin/change-password', { replace: true });
      } else {
        navigate('/admin/dashboard', { replace: true });
      }
    } catch (error: any) {
      const data = error.response?.data;
      const code = data?.code;
      const message = data?.message || 'Invalid credentials';

      if (code === 'USE_REGULAR_LOGIN') {
        toast({
          title: 'Use regular login',
          description: message,
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Login Failed',
          description: message,
          variant: 'destructive'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-medicalBlue-500 via-medicalBlue-600 to-medicalBlue-800">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-2 text-white">
              <Building2 className="h-10 w-10 text-white" />
              <span className="text-2xl font-bold">Admin Portal</span>
            </div>
          </div>

          <Card className="border-white/20 bg-white/95 shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl text-center">Sign in</CardTitle>
              <CardDescription className="text-center">
                Enter your admin email and password
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Email</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    disabled={isLoading}
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="admin-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      disabled={isLoading}
                      className="bg-white pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-500" />
                      )}
                    </Button>
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-medicalBlue-500 hover:bg-medicalBlue-600 text-white"
                >
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </Button>
              </form>

              <p className="text-center text-sm text-gray-500 mt-4">
                Not an admin?{' '}
                <Link to="/login" className="text-medicalBlue-500 hover:underline font-medium">
                  Use regular login
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
