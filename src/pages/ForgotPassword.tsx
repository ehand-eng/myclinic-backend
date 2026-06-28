import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useToast } from '@/hooks/use-toast';
import { API_URL } from '@/config';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const ForgotPassword = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validateStrongPassword = (password: string) => {
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasDigit = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    const categories = [hasLower, hasUpper, hasDigit, hasSpecial].filter(Boolean).length;
    return password.length >= 8 && categories >= 3;
  };

  const sendOtp = async () => {
    if (!mobile) {
      toast({
        title: 'Error',
        description: 'Please enter your mobile number',
        variant: 'destructive'
      });
      return;
    }

    if (mobile.length !== 9) {
      toast({
        title: 'Error',
        description: 'Please enter 9 digits after +94',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsLoading(true);
      await axios.post(`${API_URL}/custom-auth/forgot-password/send-otp`, { mobile: `+94${mobile}` });
      setOtpSent(true);
      toast({
        title: 'Success',
        description: 'OTP sent to your mobile number'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to send OTP',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp || !newPassword || !confirmPassword) {
      toast({
        title: 'Error',
        description: 'Please complete all fields',
        variant: 'destructive'
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'New password and confirmation do not match',
        variant: 'destructive'
      });
      return;
    }

    if (!validateStrongPassword(newPassword)) {
      toast({
        title: 'Weak password',
        description:
          'Use at least 8 characters and include three of the following: lowercase, uppercase, number, special character.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsLoading(true);
      await axios.post(`${API_URL}/custom-auth/forgot-password/reset`, {
        mobile: `+94${mobile}`,
        otp: otp.trim(),
        newPassword
      });

      toast({
        title: 'Password reset successful',
        description: 'You can now sign in with your new password.'
      });

      navigate('/login');
    } catch (error: any) {
      toast({
        title: 'Reset failed',
        description: error.response?.data?.message || 'Unable to reset password',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <Header />

      <main className="flex-grow flex items-center justify-center py-12">
        <div className="w-full max-w-md px-4">
          <Card className="bg-white shadow-lg rounded-lg">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Forgot Password</h1>
                <p className="text-gray-500 text-sm">Reset your password using OTP sent to your mobile number</p>
              </div>

              <form onSubmit={resetPassword} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="mobile" className="text-gray-700 font-medium">
                    Mobile Number
                  </Label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 bg-gray-100 text-gray-700 text-sm font-medium">
                      +94
                    </span>
                    <Input
                      id="mobile"
                      type="tel"
                      placeholder="7XXXXXXXX"
                      value={mobile}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').replace(/^0/, '');
                        if (val.length <= 9) setMobile(val);
                      }}
                      maxLength={9}
                      disabled={otpSent}
                      className="rounded-l-none"
                    />
                  </div>
                </div>

                {!otpSent ? (
                  <Button
                    type="button"
                    onClick={sendOtp}
                    disabled={isLoading || mobile.length !== 9}
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
                        maxLength={6}
                        placeholder="Enter OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword" className="text-gray-700 font-medium">
                        New Password
                      </Label>
                      <Input
                        id="newPassword"
                        type="password"
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">
                        Confirm New Password
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading || !otp || !newPassword || !confirmPassword}
                      className="w-full bg-[#0a1f44] hover:bg-[#0a1f44]/90 text-white py-3"
                    >
                      {isLoading ? 'Resetting...' : 'Reset Password'}
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setOtp('');
                        setOtpSent(false);
                      }}
                      className="w-full text-[#0a1f44] hover:text-[#0a1f44]/80"
                    >
                      Use different mobile number / Resend OTP
                    </Button>
                  </>
                )}

                <div className="text-center">
                  <Link to="/login" className="text-sm text-[#0a1f44] hover:underline">
                    Back to Sign In
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ForgotPassword;
