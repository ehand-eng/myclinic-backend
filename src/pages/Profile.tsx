import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdminHeader from '@/components/AdminHeader';
import AdminFooter from '@/components/AdminFooter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getRoleDisplayName } from '@/lib/roleUtils';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

interface ProfileResponse {
  id: string;
  name: string;
  email: string;
  role: string;
  dispensaryIds: string[];
  permissions: string[];
  lastLogin?: string;
}

const Profile = () => {
  const { toast } = useToast();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [name, setName] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const currentUserStr = typeof window !== 'undefined' ? localStorage.getItem('current_user') : null;
  const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
  const isAdminUser = currentUser && currentUser.role && currentUser.role !== 'online';

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!token) {
          toast({
            title: 'Not authenticated',
            description: 'Please log in again.',
            variant: 'destructive',
          });
          return;
        }

        const response = await fetch(`${API_URL}/custom-auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to load profile');
        }

        const data: ProfileResponse = await response.json();
        setProfile(data);
        setName(data.name || '');
      } catch (error: any) {
        console.error('Failed to load profile:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to load profile',
          variant: 'destructive',
        });
      }
    };

    fetchProfile();
  }, [token, toast]);

  const handleSaveProfile = async () => {
    if (!profile) return;

    try {
      if (!token) {
        toast({
          title: 'Not authenticated',
          description: 'Please log in again.',
          variant: 'destructive',
        });
        return;
      }

      setIsSavingProfile(true);

      const response = await fetch(`${API_URL}/custom-auth/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update profile');
      }

      const updated: ProfileResponse = await response.json();
      setProfile(updated);

      // Keep localStorage user in sync for future role-based checks
      const currentUserStr = localStorage.getItem('current_user');
      if (currentUserStr) {
        try {
          const currentUser = JSON.parse(currentUserStr);
          currentUser.name = updated.name;
          localStorage.setItem('current_user', JSON.stringify(currentUser));
        } catch {
          // ignore parse errors
        }
      }

      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!profile) return;

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: 'Validation error',
        description: 'Please fill in all password fields.',
        variant: 'destructive',
      });
      return;
    }

    if (currentPassword === newPassword) {
      toast({
        title: 'Validation error',
        description: 'New password must be different from your current password.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Validation error',
        description: 'New password and confirmation do not match.',
        variant: 'destructive',
      });
      return;
    }

    // Frontend mirror of backend password rules
    const hasLower = /[a-z]/.test(newPassword);
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasDigit = /[0-9]/.test(newPassword);
    const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
    const categories = [hasLower, hasUpper, hasDigit, hasSpecial].filter(Boolean).length;

    if (newPassword.length < 8 || categories < 3) {
      toast({
        title: 'Password too weak',
        description:
          'Use at least 8 characters and include three of the following: lowercase, uppercase, number, special character.',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (!token) {
        toast({
          title: 'Not authenticated',
          description: 'Please log in again.',
          variant: 'destructive',
        });
        return;
      }

      setIsChangingPassword(true);

      const response = await fetch(`${API_URL}/custom-auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = data.message || 'Failed to change password';

        // Special-case message for accounts that cannot change password
        if (message.includes('Password change is not available for this account')) {
          toast({
            title: 'Password change unavailable',
            description: 'This account is managed externally, so the password cannot be changed here.',
            variant: 'destructive',
          });
          return;
        }

        throw new Error(message);
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      toast({
        title: 'Password changed',
        description: 'Your password has been updated successfully.',
      });
    } catch (error: any) {
      console.error('Failed to change password:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to change password',
        variant: 'destructive',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const renderContent = () => {
    if (!profile) {
      return (
        <div className="flex items-center justify-center py-16">
          <p className="text-gray-600 text-lg">Loading profile...</p>
        </div>
      );
    }

    return (
      <div className="max-w-3xl mx-auto space-y-8">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl">My Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={profile.email} disabled />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Role</Label>
                <Input
                  value={getRoleDisplayName(profile.role)}
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label>Last Login</Label>
                <Input
                  value={
                    profile.lastLogin
                      ? new Date(profile.lastLogin).toLocaleString()
                      : 'N/A'
                  }
                  disabled
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Dispensary IDs</Label>
              <Input
                value={
                  profile.dispensaryIds && profile.dispensaryIds.length > 0
                    ? profile.dispensaryIds.join(', ')
                    : 'No dispensary assigned'
                }
                disabled
              />
            </div>

            <div className="pt-4">
              <Button
                onClick={handleSaveProfile}
                disabled={isSavingProfile}
                className="bg-medicalBlue-700 hover:bg-medicalBlue-800 text-white"
              >
                {isSavingProfile ? 'Saving...' : 'Save Profile'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl">Change Password</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
              <div className="mt-1 text-xs text-gray-600 space-y-1">
                <p>Password must meet all of the following:</p>
                {(() => {
                  const pwd = newPassword || '';
                  const hasLower = /[a-z]/.test(pwd);
                  const hasUpper = /[A-Z]/.test(pwd);
                  const hasDigit = /[0-9]/.test(pwd);
                  const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
                  const categories = [hasLower, hasUpper, hasDigit, hasSpecial].filter(Boolean).length;
                  const strong = pwd.length >= 8 && categories >= 3;
                  return (
                    <ul className="space-y-0.5">
                      <li className={pwd.length >= 8 ? 'text-green-600' : 'text-gray-500'}>
                        • At least 8 characters
                      </li>
                      <li className={hasLower ? 'text-green-600' : 'text-gray-500'}>
                        • Contains a lowercase letter
                      </li>
                      <li className={hasUpper ? 'text-green-600' : 'text-gray-500'}>
                        • Contains an uppercase letter
                      </li>
                      <li className={hasDigit ? 'text-green-600' : 'text-gray-500'}>
                        • Contains a number
                      </li>
                      <li className={hasSpecial ? 'text-green-600' : 'text-gray-500'}>
                        • Contains a special character
                      </li>
                      <li className={strong ? 'text-green-600' : 'text-gray-500'}>
                        • Uses at least three of the character types above
                      </li>
                    </ul>
                  );
                })()}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
              {confirmPassword && (
                <p
                  className={`text-xs ${
                    newPassword === confirmPassword ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {newPassword === confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                </p>
              )}
            </div>
            <div className="pt-4">
              <Button
                onClick={handleChangePassword}
                disabled={isChangingPassword}
                className="bg-medicalTeal-700 hover:bg-medicalTeal-800 text-white"
              >
                {isChangingPassword ? 'Updating Password...' : 'Change Password'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (isAdminUser) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-medicalBlue-50 via-white to-medicalTeal-50">
        <AdminHeader />
        <main className="flex-grow py-10">
          <div className="container mx-auto px-4">
            {renderContent()}
          </div>
        </main>
        <AdminFooter />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <Header />
      <main className="flex-grow py-10">
        <div className="container mx-auto px-4">
          {renderContent()}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;

