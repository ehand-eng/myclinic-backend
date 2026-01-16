import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Users, Shield, UserCheck, AlertCircle } from 'lucide-react';
import { User, UserRole, Dispensary } from '@/api/models';
import { AuthService, DispensaryService, UserDispensaryService } from '@/api/services';
import { toast } from 'sonner';

const RoleAssignment = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showDispensaryAssignment, setShowDispensaryAssignment] = useState(false);
  const [dispensaries, setDispensaries] = useState<Dispensary[]>([]);
  const [assignedDispensaryId, setAssignedDispensaryId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const token = AuthService.getToken();
        console.log("++++++++++++++ token ++++++++++++++", token);
        if (!token) {
          setError('Authentication required');
          return;
        }

        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001'}/api/admin/users`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }

        const data = await response.json();
        const mappedUsers = data.map((user: any) => ({
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role || 'patient'
        }));
        setUsers(mappedUsers);
      } catch (error: any) {
        console.error('Error fetching users:', error);
        setError(error.message || 'Failed to fetch users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchDispensaries = async () => {
      try {
        const token = AuthService.getToken();
        console.log("++++fetchDispensaries++++++++++ token ++++++++++++++", token);
        if (!token) {
          toast.error('Authentication required');
          return;
        }

        const dispensariesData = await DispensaryService.getAllDispensaries(token);
        setDispensaries(dispensariesData);
      } catch (error: any) {
        console.error('Error fetching dispensaries:', error);
        toast.error('Failed to fetch dispensaries');
      }
    };

    if (showDispensaryAssignment && selectedUserId) {
      fetchDispensaries();
      fetchAssignedDispensary(selectedUserId);
    }
  }, [showDispensaryAssignment, selectedUserId]);

  const fetchAssignedDispensary = async (userId: string) => {
    try {
      const token = AuthService.getToken();
      console.log("++++fetchAssignedDispensary++++++++++ token ++++++++++++++", token);
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      const assignedDispensary = await UserDispensaryService.getDispensaryByUserId(userId, token);
      setAssignedDispensaryId(assignedDispensary?.dispensaryId || null);
    } catch (error: any) {
      console.error('Error fetching assigned dispensary:', error);
      setAssignedDispensaryId(null);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      setIsUpdating(true);
      
      const token = AuthService.getToken();
      console.log("++++handleRoleChange++++++++++ token ++++++++++++++", token);
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001'}/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });

      if (!response.ok) {
        throw new Error('Failed to update role');
      }

      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, role: newRole } : user
        )
      );

      // If role is changed to dispensary-admin, show dispensary assignment
      if (newRole === 'dispensary-admin') {
        setSelectedUserId(userId);
        setShowDispensaryAssignment(true);
      }

      toast.success('Role updated successfully');
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDispensaryAssignment = async (dispensaryId: string) => {
    if (!selectedUserId) {
      toast.error('No user selected');
      return;
    }

    try {
      setIsUpdating(true);
      const token = AuthService.getToken();
      console.log("++++handleDispensaryAssignment++++++++++ token ++++++++++++++", token);
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      // Check if the user is already assigned to a dispensary
      if (assignedDispensaryId) {
        // If yes, unassign the user from the current dispensary
        await UserDispensaryService.unassignDispensaryFromUser(selectedUserId, token);
      }

      // Assign the user to the new dispensary
      await UserDispensaryService.assignDispensaryToUser(selectedUserId, dispensaryId, token);

      setAssignedDispensaryId(dispensaryId);
      toast.success('Dispensary assigned successfully');
    } catch (error: any) {
      console.error('Error assigning dispensary:', error);
      toast.error('Failed to assign dispensary');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCloseDispensaryAssignment = () => {
    setShowDispensaryAssignment(false);
    setSelectedUserId(null);
    setAssignedDispensaryId(null);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super-admin':
        return 'bg-red-100 text-red-800';
      case 'dispensary-admin':
        return 'bg-blue-100 text-blue-800';
      case 'dispensary-staff':
        return 'bg-green-100 text-green-800';
      case 'doctor':
        return 'bg-purple-100 text-purple-800';
      case 'patient':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Role Assignment
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge className={getRoleBadgeColor(user.role)}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Select onValueChange={(newRole) => handleRoleChange(user.id, newRole)}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Change Role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="super-admin">Super Admin</SelectItem>
                          <SelectItem value="dispensary-admin">Dispensary Admin</SelectItem>
                          <SelectItem value="dispensary-staff">Dispensary Staff</SelectItem>
                          <SelectItem value="doctor">Doctor</SelectItem>
                          <SelectItem value="patient">Patient</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {showDispensaryAssignment && selectedUserId && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Assign Dispensary to User
              </h3>
              <div className="mt-2 px-7 py-3">
                <Select onValueChange={handleDispensaryAssignment}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Dispensary" />
                  </SelectTrigger>
                  <SelectContent>
                    {dispensaries.map((dispensary) => (
                      <SelectItem key={dispensary.id} value={dispensary.id}>
                        {dispensary.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="items-center px-4 py-3">
                <Button
                  variant="secondary"
                  className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  onClick={handleCloseDispensaryAssignment}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default RoleAssignment;
