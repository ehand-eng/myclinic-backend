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
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-medicalBlue-50 via-white to-medicalTeal-50">
      <Header />
      
      <main className="flex-grow flex items-center justify-center py-12">
        <div className="w-full max-w-md px-4">
          <Card className="medical-card fade-in-up">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-6">
                <div className="medical-icon-bg">
                  <Lock className="h-8 w-8 text-medicalBlue-600" />
                </div>
              </div>
              <CardTitle className="text-3xl font-bold medical-text-gradient mb-2">Admin Login</CardTitle>
              <p className="text-medicalGray-600">Welcome to DocSpot Connect</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="username" className="text-medicalGray-700 font-medium">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    disabled={isLoading}
                  />
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="password" className="text-medicalGray-700 font-medium">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    disabled={isLoading}
                  />
                </div>

                <CardFooter className="flex flex-col space-y-6 pt-6">
                  <Button type="submit" className="w-full medical-button text-lg py-6" disabled={isLoading}>
                    <Lock className="h-5 w-5 mr-2" />
                    {isLoading ? "Logging in..." : "Login"}
                  </Button>
                  
                  <p className="text-sm text-center text-medicalGray-600">
                    Don't have an account?{' '}
                    <Link to="/signup" className="text-medicalBlue-600 hover:text-medicalBlue-700 font-medium hover:underline">
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
