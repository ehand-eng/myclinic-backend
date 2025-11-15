import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle } from "lucide-react";
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface FormData {
  nationality: string;
  signupMethod: string; // 'mobile' or 'email' for Sri Lankan users
  email: string;
  mobile: string;
  name: string;
  password: string;
  confirmPassword: string;
  otp: string;
}

const Signup = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [otpSent, setOtpSent] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    nationality: '',
    signupMethod: '',
    email: '',
    mobile: '',
    name: '',
    password: '',
    confirmPassword: '',
    otp: ''
  });

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNationalityChange = (value: string) => {
    handleChange('nationality', value);
    // Reset all fields when nationality changes
    handleChange('signupMethod', '');
    handleChange('mobile', '');
    handleChange('email', '');
    setOtpSent(false);
  };

  const handleSignupMethodChange = (value: string) => {
    handleChange('signupMethod', value);
    // Reset contact fields when signup method changes
    handleChange('mobile', '');
    handleChange('email', '');
    setOtpSent(false);
  };

  const sendOTP = async () => {
    if (!formData.nationality) {
      toast({
        title: "Error",
        description: "Please select your nationality first",
        variant: "destructive"
      });
      return;
    }

    if (formData.nationality === 'sri_lanka' && !formData.signupMethod) {
      toast({
        title: "Error",
        description: "Please select signup method first",
        variant: "destructive"
      });
      return;
    }

    if (formData.nationality === 'sri_lanka' && formData.signupMethod === 'mobile' && !formData.mobile) {
      toast({
        title: "Error",
        description: "Please enter your mobile number",
        variant: "destructive"
      });
      return;
    }

    if (formData.nationality === 'sri_lanka' && formData.signupMethod === 'email' && !formData.email) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive"
      });
      return;
    }

    // For foreign users (email) or Sri Lankan email users, skip OTP and go directly to step 2
    if (formData.nationality === 'other' || 
        (formData.nationality === 'sri_lanka' && formData.signupMethod === 'email')) {
      setCurrentStep(2);
      return;
    }

    // For Sri Lankan mobile users, send OTP
    try {
      setIsLoading(true);
      
      const otpData = {
        nationality: formData.nationality,
        mobile: formData.mobile
      };

      await axios.post(`${API_URL}/mobile/auth/send-otp`, otpData);
      
      setOtpSent(true);
      toast({
        title: "Success",
        description: "OTP sent to your mobile number",
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

  const verifyOTP = async () => {
    if (!formData.otp) {
      toast({
        title: "Error",
        description: "Please enter the OTP",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      
      const verifyData = {
        nationality: formData.nationality,
        otp: formData.otp,
        ...(formData.nationality === 'sri_lanka' 
          ? { mobile: formData.mobile }
          : { email: formData.email }
        )
      };

      await axios.post(`${API_URL}/auth/verify-otp`, verifyData);
      
      setCurrentStep(2);
      toast({
        title: "Success",
        description: "OTP verified successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Invalid OTP",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name || !formData.password || !formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      
      let response;
      
      if (formData.nationality === 'sri_lanka' && formData.signupMethod === 'mobile') {
        // Use mobile signup for Sri Lankan mobile users
        const signupData = {
          name: formData.name,
          password: formData.password,
          nationality: formData.nationality,
          mobile: formData.mobile
        };
        response = await axios.post(`${API_URL}/auth/signup-mobile`, signupData);
      } else {
        // Use existing custom auth for foreign users and Sri Lankan email users
        const signupData = {
          name: formData.name,
          email: formData.email,
          password: formData.password
        };
        response = await axios.post(`${API_URL}/custom-auth/register`, signupData);
      }

      // Store the token
      localStorage.setItem('auth_token', response.data.token);
      localStorage.setItem('current_user', JSON.stringify(response.data.user));

      toast({
        title: "Success",
        description: "Account created successfully"
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
        title: "Error",
        description: error.response?.data?.message || "Failed to create account",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-center space-x-2 mb-6">
        {[1, 2, 3, 4, 5].map((step) => (
          <div
            key={step}
            className={`w-8 h-2 rounded-full ${
              step === 1 ? 'bg-[#0a1f44]' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>

      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Nationality</h1>
        <p className="text-gray-500 text-sm">
          Select your nationality and enter your mobile number or email
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="nationality" className="text-gray-700 font-medium">
            Nationality
          </Label>
          <Select value={formData.nationality} onValueChange={handleNationalityChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select nationality" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sri_lanka">Sri Lanka</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.nationality === 'sri_lanka' && (
          <div className="space-y-2">
            <Label htmlFor="signupMethod" className="text-gray-700 font-medium">
              Signup Method
            </Label>
            <Select value={formData.signupMethod} onValueChange={handleSignupMethodChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose how to create your account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mobile">Mobile Number</SelectItem>
                <SelectItem value="email">Email Address</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="contact" className="text-gray-700 font-medium">
            {formData.nationality === 'sri_lanka' 
              ? (formData.signupMethod === 'mobile' ? 'Mobile Number' : 'Email Address')
              : 'Email Address'
            }
          </Label>
          <Input
            id="contact"
            type={
              formData.nationality === 'sri_lanka' 
                ? (formData.signupMethod === 'mobile' ? 'tel' : 'email')
                : 'email'
            }
            placeholder={
              formData.nationality === 'sri_lanka' 
                ? (formData.signupMethod === 'mobile' 
                    ? 'Enter your mobile number' 
                    : 'Enter your email address')
                : 'Enter your email address'
            }
            value={
              formData.nationality === 'sri_lanka' 
                ? (formData.signupMethod === 'mobile' ? formData.mobile : formData.email)
                : formData.email
            }
            onChange={(e) => {
              if (formData.nationality === 'sri_lanka') {
                handleChange(formData.signupMethod === 'mobile' ? 'mobile' : 'email', e.target.value);
              } else {
                handleChange('email', e.target.value);
              }
            }}
            disabled={!formData.nationality || (formData.nationality === 'sri_lanka' && !formData.signupMethod)}
          />
        </div>
      </div>

      {formData.nationality === 'other' && (
        <div className="flex items-start space-x-2 p-3 bg-gray-50 rounded-lg">
          <AlertCircle className="h-5 w-5 text-gray-500 mt-0.5" />
          <p className="text-sm text-gray-600">
            Please note that foreign users will not receive any SMS notifications
          </p>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Button
          type="button"
          variant="outline"
          className="border-[#0a1f44] text-[#0a1f44] hover:bg-[#0a1f44] hover:text-white"
          onClick={() => navigate('/login')}
        >
          Back
        </Button>
        
        {!otpSent ? (
          <Button
            type="button"
            onClick={sendOTP}
            disabled={
              isLoading || 
              !formData.nationality || 
              (formData.nationality === 'sri_lanka' && !formData.signupMethod) ||
              (formData.nationality === 'sri_lanka' && formData.signupMethod === 'mobile' && !formData.mobile) ||
              (formData.nationality === 'sri_lanka' && formData.signupMethod === 'email' && !formData.email) ||
              (formData.nationality === 'other' && !formData.email)
            }
            className="bg-[#0a1f44] hover:bg-[#0a1f44]/90 text-white"
          >
            {isLoading 
              ? 'Sending...' 
              : (formData.nationality === 'sri_lanka' && formData.signupMethod === 'mobile') 
                ? 'Send OTP' 
                : 'Next'
            }
          </Button>
        ) : (
          <div className="space-y-3">
            <Input
              placeholder="Enter OTP"
              value={formData.otp}
              onChange={(e) => handleChange('otp', e.target.value)}
              className="mb-2"
            />
            <Button
              type="button"
              onClick={verifyOTP}
              disabled={isLoading || !formData.otp}
              className="bg-[#0a1f44] hover:bg-[#0a1f44]/90 text-white"
            >
              {isLoading ? 'Verifying...' : 'Verify OTP'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-center space-x-2 mb-6">
        {[1, 2, 3, 4, 5].map((step) => (
          <div
            key={step}
            className={`w-8 h-2 rounded-full ${
              step <= 2 ? 'bg-[#0a1f44]' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>

      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Create Account</h1>
        <p className="text-gray-500 text-sm">
          Enter your details to complete registration
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-gray-700 font-medium">
            Full Name
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="Enter your full name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-gray-700 font-medium">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={(e) => handleChange('password', e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">
            Confirm Password
          </Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChange={(e) => handleChange('confirmPassword', e.target.value)}
            required
          />
        </div>

        <div className="flex justify-between pt-4">
          <Button
            type="button"
            variant="outline"
            className="border-[#0a1f44] text-[#0a1f44] hover:bg-[#0a1f44] hover:text-white"
            onClick={() => setCurrentStep(1)}
          >
            Back
          </Button>
          
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-[#0a1f44] hover:bg-[#0a1f44]/90 text-white"
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </div>
      </form>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <Header />
      
      <main className="flex-grow flex items-center justify-center py-12">
        <div className="w-full max-w-2xl px-4">
          <Card className="bg-white shadow-lg rounded-lg">
            <CardContent className="p-8">
              {currentStep === 1 ? renderStep1() : renderStep2()}
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Signup; 