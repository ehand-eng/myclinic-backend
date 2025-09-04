import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Lock } from 'lucide-react';
import axios from 'axios';

// Get API URL from environment variables with fallback
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const Login = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast({
        title: 'Error',
        description: 'Please enter both username and password',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Try custom auth first, fallback to Auth0 for backward compatibility
      let response;
      try {
        response = await axios.post(`${API_URL}/custom-auth/login`, {
          email: username,
          password
        });
      } catch (customAuthError) {
        // Fallback to Auth0 authentication
        response = await axios.post(`${API_URL}/auth/login`, {
          username,
          password
        });
      }

      // Store the token and user info
      const { token, access_token, user } = response.data;
      localStorage.setItem('auth_token', token || access_token);
      localStorage.setItem('current_user', JSON.stringify(user));
      
      toast({
        title: 'Login Successful',
        description: 'Welcome back!'
      });
      navigate('/admin/dashboard', { replace: true });
    } catch (error) {
      console.error('Login failed:', error);
      toast({
        title: 'Login Failed',
        description: 'Invalid username or password',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow flex items-center justify-center bg-gray-50 py-12">
        <div className="w-full max-w-md px-4">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-medical-100 p-3 rounded-full">
                  <Lock className="h-6 w-6 text-medical-600" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold">Admin Login - My Clinic</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    disabled={isLoading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    disabled={isLoading}
                  />
                </div>

                <CardFooter className="flex flex-col space-y-4">
                  <Button type="submit" className="w-full bg-medical-600 hover:bg-medical-700" disabled={isLoading}>
                    {isLoading ? "Logging in..." : "Login"}
                  </Button>
                  
                  <p className="text-sm text-center text-gray-500">
                    Don't have an account?{' '}
                    <Link to="/signup" className="text-medical-600 hover:text-medical-700">
                      Sign up
                    </Link>
                  </p>
                </CardFooter>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Login;
