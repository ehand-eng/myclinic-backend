import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminHeader from '@/components/AdminHeader';
import AdminFooter from '@/components/AdminFooter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Edit, Trash2, Loader2 } from 'lucide-react';
import { UserDispensaryService, UserWithDispensaryInfo, Dispensary } from '../api/services/UserDispensaryService';

const UserDispensaryAssignment: React.FC = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithDispensaryInfo[]>([]);
  const [dispensaries, setDispensaries] = useState<Dispensary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedDispensary, setSelectedDispensary] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<'hospital_admin' | 'hospital_staff'>('hospital_staff');
  const [error, setError] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<{
    userId: string;
    dispensaryId: string;
    role: 'hospital_admin' | 'hospital_staff';
  } | null>(null);
  const [editingRole, setEditingRole] = useState<'hospital_admin' | 'hospital_staff'>('hospital_staff');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersData, dispensariesData] = await Promise.all([
        UserDispensaryService.getAllUsers(),
        UserDispensaryService.getAllDispensaries()
      ]);
      setUsers(usersData);
      setDispensaries(dispensariesData);
      setError(null);
    } catch (err) {
      setError('Failed to fetch data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleUserChange = (value: string) => {
    setSelectedUser(value);
  };
  
  const handleDispensaryChange = (value: string) => {
    setSelectedDispensary(value);
  };
  
  const handleRoleChange = (value: 'hospital_admin' | 'hospital_staff') => {
    setSelectedRole(value);
  };

  const handleAssign = async () => {
    try {
      if (!selectedUser || !selectedDispensary) {
        toast({
          title: 'Error',
          description: 'Please select both user and dispensary',
          variant: 'destructive',
        });
        return;
      }

      await UserDispensaryService.assignUserToDispensary(
        selectedUser,
        selectedDispensary,
        selectedRole
      );
      
      toast({
        title: 'Success',
        description: 'User assigned to dispensary successfully',
      });
      
      setSelectedUser('');
      setSelectedDispensary('');
      setSelectedRole('hospital_staff');
      setError(null);
      await fetchData();
    } catch (err) {
      setError('Failed to assign user to dispensary');
      toast({
        title: 'Error',
        description: 'Failed to assign user to dispensary',
        variant: 'destructive',
      });
    }
  };

  const handleEditRole = (userId: string, dispensaryId: string, role: 'hospital_admin' | 'hospital_staff') => {
    setEditingAssignment({ userId, dispensaryId, role });
    setEditingRole(role);
    setEditDialogOpen(true);
  };

  const handleUpdateRole = async () => {
    if (!editingAssignment) return;
    try {
      await UserDispensaryService.updateUserRole(
        editingAssignment.userId,
        editingAssignment.dispensaryId,
        editingRole
      );
      toast({
        title: 'Success',
        description: 'Role updated successfully',
      });
      setEditDialogOpen(false);
      await fetchData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update role',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveAssignment = async (userId: string, dispensaryId: string) => {
    try {
      await UserDispensaryService.removeUserFromDispensary(userId, dispensaryId);
      await fetchData();
      toast({
        title: 'Success',
        description: 'Assignment removed successfully',
      });
      setError(null);
    } catch (err) {
      setError('Failed to remove user from dispensary');
      toast({
        title: 'Error',
        description: 'Failed to remove user from dispensary',
        variant: 'destructive',
      });
    }
  };

  // Check if there are any user assignments
  const hasAssignments = users.some(user => user.dispensaryAssignments && user.dispensaryAssignments.length > 0);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <AdminHeader />
        <main className="flex-grow flex items-center justify-center bg-gradient-to-br from-medicalBlue-50 via-white to-medicalTeal-50">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-xl">Loading assignments...</p>
          </div>
        </main>
        <AdminFooter />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <AdminHeader />
      <main className="flex-grow bg-gradient-to-br from-medicalBlue-50 via-white to-medicalTeal-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold medical-text-gradient">User-Dispensary Assignment</h1>
          </div>
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}
          {/* Assignment Form */}
          <Card className="mb-6 medical-card">
            <CardHeader>
              <CardTitle>Assign User to Dispensary</CardTitle>
              <CardDescription>
                Select a user, dispensary, and role to create a new assignment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">User</label>
                  <Select value={selectedUser} onValueChange={handleUserChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Dispensary</label>
                  <Select value={selectedDispensary} onValueChange={handleDispensaryChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select dispensary" />
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
                <div className="space-y-2">
                  <label className="text-sm font-medium">Role</label>
                  <Select value={selectedRole} onValueChange={handleRoleChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hospital_staff">Hospital Staff</SelectItem>
                      <SelectItem value="hospital_admin">Hospital Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={handleAssign} className="w-full">
                    Assign
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Assignments Table */}
          <Card className="medical-card">
            <CardHeader>
              <CardTitle>Current Assignments</CardTitle>
              <CardDescription>
                View and manage existing user-dispensary assignments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!hasAssignments ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-lg">No records exist</p>
                  <p className="text-gray-400 text-sm mt-2">No user assignments have been created yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Dispensary</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) =>
                        (user.dispensaryAssignments || []).map((assignment) => (
                          <TableRow key={`${user.id}-${assignment.dispensaryId}`}>
                            <TableCell className="font-medium">{user.name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              {dispensaries.find(d => d.id === assignment.dispensaryId)?.name || 'Unknown'}
                            </TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                assignment.role === 'hospital_admin' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {assignment.role === 'hospital_admin' ? 'Admin' : 'Staff'}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditRole(user.id, assignment.dispensaryId, assignment.role)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRemoveAssignment(user.id, assignment.dispensaryId)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Role</DialogTitle>
            <DialogDescription>
              Update the role for this user-dispensary assignment
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Select value={editingRole} onValueChange={(value: 'hospital_admin' | 'hospital_staff') => setEditingRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hospital_staff">Hospital Staff</SelectItem>
                  <SelectItem value="hospital_admin">Hospital Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRole} className="bg-medical-600 hover:bg-medical-700">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AdminFooter />
    </div>
  );
};

export default UserDispensaryAssignment;