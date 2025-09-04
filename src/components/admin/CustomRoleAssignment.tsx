import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Users, Shield, UserPlus, Edit, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Role {
  _id: string;
  name: string;
  displayName: string;
  permissions: string[];
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  roleDisplayName: string;
  dispensaries: Array<{
    id: string;
    name: string;
    address: string;
  }>;
  isActive: boolean;
  lastLogin: string;
  createdAt: string;
}

interface Dispensary {
  _id: string;
  name: string;
  address: string;
}

const CustomRoleAssignment = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [dispensaries, setDispensaries] = useState<Dispensary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Create user modal state
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [createUserForm, setCreateUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: '',
    dispensaryId: ''
  });
  
  // Edit user modal state
  const [showEditUser, setShowEditUser] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUserForm, setEditUserForm] = useState({
    role: '',
    dispensaryId: ''
  });

  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const [usersRes, rolesRes, dispensariesRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001'}/api/admin/users`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001'}/api/admin/roles`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001'}/api/dispensaries`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!usersRes.ok || !rolesRes.ok || !dispensariesRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const [usersData, rolesData, dispensariesData] = await Promise.all([
        usersRes.json(),
        rolesRes.json(),
        dispensariesRes.json()
      ]);

      setUsers(usersData);
      setRoles(rolesData);
      setDispensaries(dispensariesData);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      setError(error.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    try {
      setIsUpdating(true);
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001'}/api/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(createUserForm)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create user');
      }

      toast.success('User created successfully');
      setShowCreateUser(false);
      setCreateUserForm({ name: '', email: '', password: '', role: '', dispensaryId: '' });
      await fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create user');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditUserForm({
      role: user.role,
      dispensaryId: user.dispensaries.length > 0 ? user.dispensaries[0].id : ''
    });
    setShowEditUser(true);
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      setIsUpdating(true);
      const token = localStorage.getItem('auth_token');

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001'}/api/admin/users/${editingUser._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editUserForm)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update user');
      }

      toast.success('User updated successfully');
      setShowEditUser(false);
      setEditingUser(null);
      await fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update user');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`Are you sure you want to delete ${user.name}?`)) return;

    try {
      const token = localStorage.getItem('auth_token');

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001'}/api/admin/users/${user._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete user');
      }

      toast.success('User deleted successfully');
      await fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete user');
    }
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
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Role Management
          </CardTitle>
          <Button onClick={() => setShowCreateUser(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Create User
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Dispensary</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user._id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge className={getRoleBadgeColor(user.role)}>
                      {user.roleDisplayName}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.dispensaries.length > 0 ? user.dispensaries[0].name : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? "default" : "secondary"}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditUser(user)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {user.role !== 'super-admin' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteUser(user)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Create User Modal */}
        <Dialog open={showCreateUser} onOpenChange={setShowCreateUser}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={createUserForm.name}
                  onChange={(e) => setCreateUserForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter user name"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={createUserForm.email}
                  onChange={(e) => setCreateUserForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={createUserForm.password}
                  onChange={(e) => setCreateUserForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter password (min 6 characters)"
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={createUserForm.role} onValueChange={(value) => setCreateUserForm(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.filter(role => role.name !== 'super-admin').map((role) => (
                      <SelectItem key={role._id} value={role.name}>
                        {role.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {['dispensary-admin', 'dispensary-staff'].includes(createUserForm.role) && (
                <div>
                  <Label htmlFor="dispensary">Dispensary</Label>
                  <Select value={createUserForm.dispensaryId} onValueChange={(value) => setCreateUserForm(prev => ({ ...prev, dispensaryId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select dispensary" />
                    </SelectTrigger>
                    <SelectContent>
                      {dispensaries.map((dispensary) => (
                        <SelectItem key={dispensary._id} value={dispensary._id}>
                          {dispensary.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateUser(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateUser}
                disabled={isUpdating || !createUserForm.name || !createUserForm.email || !createUserForm.password || !createUserForm.role}
              >
                {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit User Modal */}
        <Dialog open={showEditUser} onOpenChange={setShowEditUser}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User: {editingUser?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="editRole">Role</Label>
                <Select value={editUserForm.role} onValueChange={(value) => setEditUserForm(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.filter(role => role.name !== 'super-admin').map((role) => (
                      <SelectItem key={role._id} value={role.name}>
                        {role.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {['dispensary-admin', 'dispensary-staff'].includes(editUserForm.role) && (
                <div>
                  <Label htmlFor="editDispensary">Dispensary</Label>
                  <Select value={editUserForm.dispensaryId} onValueChange={(value) => setEditUserForm(prev => ({ ...prev, dispensaryId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select dispensary" />
                    </SelectTrigger>
                    <SelectContent>
                      {dispensaries.map((dispensary) => (
                        <SelectItem key={dispensary._id} value={dispensary._id}>
                          {dispensary.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditUser(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateUser}
                disabled={isUpdating || !editUserForm.role}
              >
                {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Update User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default CustomRoleAssignment;