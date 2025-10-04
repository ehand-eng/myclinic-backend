import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, Phone } from "lucide-react";
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import axios from 'axios';

// Get API URL from environment variables with fallback
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

interface LoginData {
  loginType: 'mobile' | 'email';
  mobile: string;
  email: string;
  password: string;
  otp: string;
  keepSignedIn: boolean;
}

const Login = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [loginData, setLoginData] = useState<LoginData>({
    loginType: 'mobile',
    mobile: '',
    email: '',
    password: '',
    otp: '',
    keepSignedIn: false
  });

  const handleChange = (field: keyof LoginData, value: string | boolean) => {
    setLoginData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const sendOTP = async () => {
    if (loginData.loginType === 'mobile' && !loginData.mobile) {
      toast({
        title: "Error",
        description: "Please enter your mobile number",
        variant: "destructive"
      });
      return;
    }

    if (loginData.loginType === 'email' && !loginData.email) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      
      const otpData = {
        loginType: loginData.loginType,
        ...(loginData.loginType === 'mobile' 
          ? { mobile: loginData.mobile }
          : { email: loginData.email }
        )
      };

      await axios.post(`${API_URL}/auth/send-login-otp`, otpData);
      
      setOtpSent(true);
      toast({
        title: "Success",
        description: `OTP sent to your ${loginData.loginType === 'mobile' ? 'mobile number' : 'email address'}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to send OTP",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMobileLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginData.otp) {
      toast({
        title: "Error",
        description: "Please enter the OTP",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      
      const loginPayload = {
        loginType: 'mobile',
        mobile: loginData.mobile,
        otp: loginData.otp,
        keepSignedIn: loginData.keepSignedIn
      };

      const response = await axios.post(`${API_URL}/auth/login-mobile`, loginPayload);

      // Store the token
      localStorage.setItem('auth_token', response.data.token);
      localStorage.setItem('current_user', JSON.stringify(response.data.user));

      toast({
        title: "Login Successful",
        description: "Welcome back!"
      });

      // Redirect based on user role
      const user = response.data.user;
      if (!user.role || user.role === 'online') {
        navigate('/');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.response?.data?.message || "Invalid OTP",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginData.email || !loginData.password) {
      toast({
        title: "Error",
        description: "Please enter both email and password",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Try the new mobile auth first, then fallback to existing custom auth
      let response;
      try {
        const loginPayload = {
          loginType: 'email',
          email: loginData.email,
          password: loginData.password,
          keepSignedIn: loginData.keepSignedIn
        };
        response = await axios.post(`${API_URL}/auth/login-email`, loginPayload);
      } catch (mobileAuthError) {
        // Fallback to existing custom auth for backward compatibility
        response = await axios.post(`${API_URL}/custom-auth/login`, {
          email: loginData.email,
          password: loginData.password
        });
      }

      // Store the token
      const { token, access_token, user } = response.data;
      localStorage.setItem('auth_token', token || access_token);
      localStorage.setItem('current_user', JSON.stringify(user));

      toast({
        title: "Login Successful",
        description: "Welcome back!"
      });

      // Redirect based on user role
      const userData = response.data.user;
      if (!userData.role || userData.role === 'online') {
        navigate('/');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.response?.data?.message || "Invalid credentials",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderMobileLogin = () => (
    <form onSubmit={handleMobileLogin} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="mobile" className="text-gray-700 font-medium">
          Mobile Number
        </Label>
        <Input
          id="mobile"
          type="tel"
          placeholder="Enter your mobile number"
          value={loginData.mobile}
          onChange={(e) => handleChange('mobile', e.target.value)}
          disabled={otpSent}
        />
      </div>

      {!otpSent ? (
        <Button
          type="button"
          onClick={sendOTP}
          disabled={isLoading || !loginData.mobile}
          className="w-full bg-[#0a1f44] hover:bg-[#0a1f44]/90 text-white py-3"
        >
          {isLoading ? 'Sending OTP...' : 'Send OTP'}
        </Button>
      ) : (
        <>
          <div className="space-y-2">
            <Label htmlFor="otp" className="text-gray-700 font-medium">
              Enter OTP
            </Label>
            <Input
              id="otp"
              type="text"
              placeholder="Enter the OTP sent to your mobile"
              value={loginData.otp}
              onChange={(e) => handleChange('otp', e.target.value)}
              maxLength={6}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="keepSignedIn"
              checked={loginData.keepSignedIn}
              onCheckedChange={(checked) => handleChange('keepSignedIn', checked as boolean)}
            />
            <Label htmlFor="keepSignedIn" className="text-sm text-gray-600">
              Keep me signed in
            </Label>
          </div>

          <Button
            type="submit"
            disabled={isLoading || !loginData.otp}
            className="w-full bg-[#0a1f44] hover:bg-[#0a1f44]/90 text-white py-3"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setOtpSent(false);
              handleChange('otp', '');
            }}
            className="w-full text-[#0a1f44] hover:text-[#0a1f44]/80"
          >
            Resend OTP
          </Button>
        </>
      )}
    </form>
  );

  const renderEmailLogin = () => (
    <form onSubmit={handleEmailLogin} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-gray-700 font-medium">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email address"
          value={loginData.email}
          onChange={(e) => handleChange('email', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-gray-700 font-medium">
          Password
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            value={loginData.password}
            onChange={(e) => handleChange('password', e.target.value)}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-gray-400" />
            ) : (
              <Eye className="h-4 w-4 text-gray-400" />
            )}
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="keepSignedIn"
            checked={loginData.keepSignedIn}
            onCheckedChange={(checked) => handleChange('keepSignedIn', checked as boolean)}
          />
          <Label htmlFor="keepSignedIn" className="text-sm text-gray-600">
            Keep me signed in
          </Label>
        </div>
        <Link
          to="/forgot-password"
          className="text-sm text-[#0a1f44] hover:text-[#0a1f44]/80 hover:underline"
        >
          Forgot password?
        </Link>
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full bg-[#0a1f44] hover:bg-[#0a1f44]/90 text-white py-3"
      >
        {isLoading ? 'Signing In...' : 'Sign In'}
      </Button>
    </form>
  );

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <Header />
      
      <main className="flex-grow flex items-center justify-center py-12">
        <div className="w-full max-w-md px-4">
          <Card className="bg-white shadow-lg rounded-lg">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Sign in</h1>
                <p className="text-gray-500 text-sm">
                  Please enter your user name and the password to login or login with your mobile number
                </p>
              </div>

              <div className="space-y-6">
                {loginData.loginType === 'mobile' ? renderMobileLogin() : renderEmailLogin()}

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">Or</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    handleChange('loginType', loginData.loginType === 'mobile' ? 'email' : 'mobile');
                    setOtpSent(false);
                    handleChange('otp', '');
                  }}
                  className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-700 py-3"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  {loginData.loginType === 'mobile' ? 'Use Email Instead' : 'Use Mobile Number'}
                </Button>

                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Don't have an account?{' '}
                    <Link
                      to="/signup"
                      className="text-[#0a1f44] hover:text-[#0a1f44]/80 font-medium hover:underline"
                    >
                      Sign up
                    </Link>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Login;
