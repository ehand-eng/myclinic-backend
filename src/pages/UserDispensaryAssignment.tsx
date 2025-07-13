import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  CircularProgress,
  SelectChangeEvent
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { UserDispensaryService, UserWithDispensaryInfo, Dispensary } from '../api/services/UserDispensaryService';

const UserDispensaryAssignment: React.FC = () => {
  const [users, setUsers] = useState<UserWithDispensaryInfo[]>([]);
  const [dispensaries, setDispensaries] = useState<Dispensary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedDispensary, setSelectedDispensary] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<'hospital_admin' | 'hospital_staff'>('hospital_staff');
  const [error, setError] = useState<string | null>(null);
  
  // Edit dialog state
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
      console.log('Fetched users:', usersData);
      
      console.log('Fetched dispensaries:', dispensariesData);
      setUsers(usersData);
      setDispensaries(dispensariesData);
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleUserChange = (event: SelectChangeEvent<string>) => {
    const userId = event.target.value;
    console.log('Selected user ID:', userId);
    const user = users.find(u => u._id === userId);
    console.log('Found user:', user);
    setSelectedUser(userId);
  };

  const handleDispensaryChange = (event: SelectChangeEvent<string>) => {
    const dispensaryId = event.target.value;
    console.log('Selected dispensary ID:', dispensaryId);
    const dispensary = dispensaries.find(d => d._id === dispensaryId);
    console.log('Found dispensary:', dispensary);
    setSelectedDispensary(dispensaryId);
  };

  const handleRoleChange = (event: SelectChangeEvent<'hospital_admin' | 'hospital_staff'>) => {
    setSelectedRole(event.target.value as 'hospital_admin' | 'hospital_staff');
  };

  const handleAssign = async () => {
    try {
      if (!selectedUser || !selectedDispensary) {
        setError('Please select both a user and a dispensary');
        return;
      }

      console.log('Assigning user:', {
        userId: selectedUser,
        dispensaryId: selectedDispensary,
        role: selectedRole
      });

      await UserDispensaryService.assignUserToDispensary(
        selectedUser,
        selectedDispensary,
        selectedRole
      );

      // Refresh the data
      await fetchData();

      // Clear selections
      setSelectedUser('');
      setSelectedDispensary('');
      setSelectedRole('hospital_staff');
      setError(null);
      toast.success('User assigned successfully');
    } catch (err) {
      console.error('Error assigning user:', err);
      setError('Failed to assign user to dispensary');
      toast.error('Failed to assign user to dispensary');
    }
  };

  const handleEdit = (userId: string, dispensaryId: string, role: 'hospital_admin' | 'hospital_staff') => {
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
      toast.success('Role updated successfully');
      setEditDialogOpen(false);
      await fetchData();
    } catch (error) {
      toast.error('Failed to update role');
      console.error('Error updating role:', error);
    }
  };

  const handleRemoveAssignment = async (userId: string, dispensaryId: string) => {
    try {
      await UserDispensaryService.removeUserFromDispensary(userId, dispensaryId);
      await fetchData();
      toast.success('Assignment removed successfully');
      setError(null);
    } catch (err) {
      console.error('Error removing assignment:', err);
      setError('Failed to remove user from dispensary');
      toast.error('Failed to remove user from dispensary');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box py={4}>
        <Typography variant="h4" gutterBottom>
          User-Dispensary Assignment
        </Typography>

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        {/* Assignment Form */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Assign User to Dispensary
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel id="user-select-label">User</InputLabel>
                <Select
                  labelId="user-select-label"
                  id="user-select"
                  value={selectedUser}
                  onChange={handleUserChange}
                  label="User"
                >
                  {users.map((user) => (
                    <MenuItem key={user._id} value={user._id}>
                      {user.name} ({user.email})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel id="dispensary-select-label">Dispensary</InputLabel>
                <Select
                  labelId="dispensary-select-label"
                  id="dispensary-select"
                  value={selectedDispensary}
                  onChange={handleDispensaryChange}
                  label="Dispensary"
                >
                  {dispensaries.map((dispensary) => (
                    <MenuItem key={dispensary._id} value={dispensary._id}>
                      {dispensary.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel id="role-select-label">Role</InputLabel>
                <Select
                  labelId="role-select-label"
                  id="role-select"
                  value={selectedRole}
                  onChange={handleRoleChange}
                  label="Role"
                >
                  <MenuItem value="hospital_admin">Admin</MenuItem>
                  <MenuItem value="hospital_staff">Staff</MenuItem>
                </Select>
              </FormControl>
              <Button
                variant="contained"
                color="primary"
                onClick={handleAssign}
                fullWidth
                disabled={!selectedUser || !selectedDispensary}
              >
                Assign
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Assignments Table */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Current Assignments
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Dispensary</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) =>
                    (user.dispensaryAssignments || []).map((assignment) => (
                      <TableRow key={`${user._id}-${assignment.dispensaryId}`}>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{assignment.dispensaryName}</TableCell>
                        <TableCell>{assignment.role}</TableCell>
                        <TableCell align="right">
                          <IconButton
                            color="primary"
                            onClick={() => handleEdit(user._id, assignment.dispensaryId, assignment.role)}
                            size="small"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            color="error"
                            onClick={() => handleRemoveAssignment(user._id, assignment.dispensaryId)}
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>

      {/* Edit Role Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>Edit User Role</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Role</InputLabel>
            <Select
              value={editingRole}
              onChange={(e) => setEditingRole(e.target.value as 'hospital_admin' | 'hospital_staff')}
              label="Role"
            >
              <MenuItem value="hospital_admin">Admin</MenuItem>
              <MenuItem value="hospital_staff">Staff</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateRole} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UserDispensaryAssignment; 