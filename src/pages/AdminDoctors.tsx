
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminHeader from '@/components/AdminHeader';
import AdminFooter from '@/components/AdminFooter';
import { Button } from '@/components/ui/button';
import { DoctorService, DispensaryService } from '@/api/services';
import { Doctor, Dispensary } from '@/api/models';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Eye, Edit, Trash2, Plus, Search, UserX, UserCheck, UserCog } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { canManageDoctors } from '@/lib/roleUtils';
import ReplacementDoctorManager from '@/components/ReplacementDoctorManager';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const AdminDoctors = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [doctorToDelete, setDoctorToDelete] = useState<string | null>(null);
  const [expandedReplacementDoctor, setExpandedReplacementDoctor] = useState<string | null>(null);
  const [dispensaryMap, setDispensaryMap] = useState<Record<string, Dispensary>>({});

  const userStr = typeof window !== 'undefined' ? localStorage.getItem('current_user') : null;
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const canManage = canManageDoctors(currentUser?.role);
  const userDispensaryIds: string[] = (currentUser?.dispensaryIds || []).map((d: any) => typeof d === 'string' ? d : d._id || d.id);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setIsLoading(true);

      // Get current user for role-based filtering
      const userStr = localStorage.getItem('current_user');
      const user = userStr ? JSON.parse(userStr) : null;

      const isSuper = user?.role === 'super-admin' || (user?.roles && user.roles.includes('super-admin'));

      let data: Doctor[] = [];

      if (isSuper) {
        // Super admin sees all
        data = await DoctorService.getAllDoctors();
      } else if (user?.dispensaryIds && user.dispensaryIds.length > 0) {
        // Dispensary user sees doctors from assigned dispensaries
        const normalizedIds = user.dispensaryIds.map((d: any) => typeof d === 'string' ? d : d._id || d.id);

        // Fetch doctors for each assigned dispensary
        const results = await Promise.all(
          normalizedIds.map((id: string) => DoctorService.getDoctorsByDispensaryId(id))
        );

        // Flatten array and remove duplicates based on ID
        const allDoctors = results.flat();
        const uniqueDoctors = Array.from(new Map(allDoctors.map(item => [item.id, item])).values());

        data = uniqueDoctors;
      } else {
        // No access
        data = [];
      }

      console.log('Fetched doctors:', data);
      setDoctors(data);
      setFilteredDoctors(data);

      // Fetch dispensary names for replacement manager
      try {
        let dispensaries: Dispensary[];
        if (userDispensaryIds.length > 0) {
          dispensaries = await DispensaryService.getDispensariesByIds(userDispensaryIds);
        } else {
          dispensaries = await DispensaryService.getAllDispensaries();
        }
        const map: Record<string, Dispensary> = {};
        dispensaries.forEach((d: Dispensary) => { map[d.id] = d; });
        setDispensaryMap(map);
      } catch (e) { /* ignore */ }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load doctors. Please try again later.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (searchTerm) {
      const lowercasedSearch = searchTerm.toLowerCase();
      const filtered = doctors.filter(doctor =>
        doctor.name.toLowerCase().includes(lowercasedSearch) ||
        doctor.specialization.toLowerCase().includes(lowercasedSearch) ||
        doctor.email.toLowerCase().includes(lowercasedSearch)
      );
      setFilteredDoctors(filtered);
    } else {
      setFilteredDoctors(doctors);
    }
  }, [searchTerm, doctors]);

  const handleToggleDisabled = async (doctorId: string, currentlyDisabled: boolean) => {
    try {
      await DoctorService.setDoctorDisabled(doctorId, !currentlyDisabled);
      toast({
        title: 'Success',
        description: currentlyDisabled ? 'Doctor has been enabled' : 'Doctor has been disabled'
      });
      fetchDoctors();
    } catch (error) {
      console.error('Error toggling doctor:', error);
      toast({
        title: 'Error',
        description: 'Failed to update doctor status',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteDoctor = (doctorId: string) => {
    setDoctorToDelete(doctorId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteDoctor = async () => {
    if (!doctorToDelete) return;
    setDeleteDialogOpen(false);

    try {
      await DoctorService.deleteDoctor(doctorToDelete);
      toast({
        title: 'Success',
        description: 'Doctor has been deleted successfully'
      });
      fetchDoctors();
    } catch (error) {
      console.error('Error deleting doctor:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete doctor',
        variant: 'destructive'
      });
    } finally {
      setDoctorToDelete(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <AdminHeader />
      <main className="container mx-auto px-4 py-8 flex-grow">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Manage Doctors</h1>
          <Button onClick={() => navigate('/admin/doctors/create')} className="bg-medical-600 hover:bg-medical-700">
            <Plus className="mr-2 h-4 w-4" /> Add New Doctor
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Doctors Directory</CardTitle>
            <CardDescription>
              View, edit or delete doctor information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search by name, specialization or email"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <p>Loading doctors...</p>
              </div>
            ) : filteredDoctors.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No doctors found</p>
                {searchTerm && (
                  <Button
                    variant="outline"
                    onClick={() => setSearchTerm('')}
                    className="mt-2"
                  >
                    Clear search
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Specialization</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDoctors.map((doctor) => (
                      <React.Fragment key={doctor.id}>
                        <TableRow className={doctor.disabled ? 'opacity-60 bg-gray-50' : ''}>
                          <TableCell className="font-medium">{doctor.name}</TableCell>
                          <TableCell>{doctor.specialization}</TableCell>
                          <TableCell>{doctor.email}</TableCell>
                          <TableCell>{doctor.contactNumber}</TableCell>
                          <TableCell>
                            {doctor.disabled ? (
                              <span className="text-amber-600 font-medium">Disabled</span>
                            ) : (
                              <span className="text-green-600 font-medium">Active</span>
                            )}
                          </TableCell>
                          <TableCell className="space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/admin/doctors/view/${doctor.id}`)}
                              title="View doctor"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {canManage && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setExpandedReplacementDoctor(
                                    expandedReplacementDoctor === doctor.id ? null : doctor.id
                                  )}
                                  title="Manage replacement doctor"
                                  className={expandedReplacementDoctor === doctor.id ? 'bg-blue-100' : ''}
                                >
                                  <UserCog className="h-4 w-4 text-blue-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleToggleDisabled(doctor.id, !!doctor.disabled)}
                                  title={doctor.disabled ? 'Enable doctor' : 'Disable doctor'}
                                >
                                  {doctor.disabled ? (
                                    <UserCheck className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <UserX className="h-4 w-4 text-amber-600" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => navigate(`/admin/doctors/edit/${doctor.id}`)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteDoctor(doctor.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </>
                            )}
                          </TableCell>
                        </TableRow>

                        {/* Expanded replacement doctor section */}
                        {expandedReplacementDoctor === doctor.id && canManage && (
                          <TableRow key={`${doctor.id}-replacement`}>
                            <TableCell colSpan={6} className="bg-blue-50/50 p-4">
                              <div className="space-y-4">
                                <h4 className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                                  <UserCog className="h-4 w-4" />
                                  Replacement Doctor Management - {doctor.name}
                                </h4>
                                {userDispensaryIds.length > 0 ? (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {userDispensaryIds
                                      .filter(dId => doctor.dispensaries.includes(dId))
                                      .map(dId => (
                                        <div key={dId} className="bg-white rounded-lg p-3 border">
                                          <h5 className="text-sm font-medium mb-1">{dispensaryMap[dId]?.name || dId}</h5>
                                          <ReplacementDoctorManager
                                            doctorId={doctor.id}
                                            dispensaryId={dId}
                                            doctorName={doctor.name}
                                            dispensaryName={dispensaryMap[dId]?.name || ''}
                                          />
                                        </div>
                                    ))}
                                    {userDispensaryIds.filter(dId => doctor.dispensaries.includes(dId)).length === 0 && (
                                      <p className="text-sm text-gray-500 italic">This doctor is not associated with your dispensary</p>
                                    )}
                                  </div>
                                ) : (
                                  /* Super admin: show all dispensaries */
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {doctor.dispensaries.map(dId => (
                                      <div key={dId} className="bg-white rounded-lg p-3 border">
                                        <h5 className="text-sm font-medium mb-1">{dispensaryMap[dId]?.name || dId}</h5>
                                        <ReplacementDoctorManager
                                          doctorId={doctor.id}
                                          dispensaryId={dId}
                                          doctorName={doctor.name}
                                          dispensaryName={dispensaryMap[dId]?.name || ''}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <AdminFooter />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Doctor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this doctor? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteDoctor} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminDoctors;
