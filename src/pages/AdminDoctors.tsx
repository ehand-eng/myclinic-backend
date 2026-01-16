
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminHeader from '@/components/AdminHeader';
import AdminFooter from '@/components/AdminFooter';
import { Button } from '@/components/ui/button';
import { DoctorService } from '@/api/services';
import { Doctor } from '@/api/models';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Eye, Edit, Trash2, Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

const AdminDoctors = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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

  const handleDeleteDoctor = async (doctorId: string) => {
    if (!window.confirm('Are you sure you want to delete this doctor?')) return;

    try {
      await DoctorService.deleteDoctor(doctorId);
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
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDoctors.map((doctor) => (
                      <TableRow key={doctor.id}>
                        <TableCell className="font-medium">{doctor.name}</TableCell>
                        <TableCell>{doctor.specialization}</TableCell>
                        <TableCell>{doctor.email}</TableCell>
                        <TableCell>{doctor.contactNumber}</TableCell>
                        <TableCell className="space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/admin/doctors/view/${doctor.id}`)}
                          >
                            <Eye className="h-4 w-4" />
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
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <AdminFooter />
    </div>
  );
};

export default AdminDoctors;
