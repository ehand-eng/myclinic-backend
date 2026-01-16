
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminHeader from '@/components/AdminHeader';
import AdminFooter from '@/components/AdminFooter';
import { Button } from '@/components/ui/button';
import { DispensaryService } from '@/api/services';
import { Dispensary } from '@/api/models';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Eye, Edit, Trash2, Plus, Search, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';

const AdminDispensaries = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [dispensaries, setDispensaries] = useState<Dispensary[]>([]);
  const [filteredDispensaries, setFilteredDispensaries] = useState<Dispensary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDispensaries();
  }, []);

  const fetchDispensaries = async () => {
    try {
      setIsLoading(true);

      // Get current user for role-based filtering
      const userStr = localStorage.getItem('current_user');
      const user = userStr ? JSON.parse(userStr) : null;

      const isSuper = user?.role === 'super-admin' || (user?.roles && user.roles.includes('super-admin'));

      let data: Dispensary[] = [];

      if (isSuper) {
        // Super admin sees all
        data = await DispensaryService.getAllDispensaries();
      } else if (user?.dispensaryIds && user.dispensaryIds.length > 0) {
        // Dispensary user sees only assigned
        const normalizedIds = user.dispensaryIds.map((d: any) => typeof d === 'string' ? d : d._id || d.id);

        const results = await Promise.all(
          normalizedIds.map((id: string) => DispensaryService.getDispensaryById(id))
        );

        data = results.filter((d): d is Dispensary => d !== null);
      } else {
        // No access
        data = [];
      }

      console.log('Fetched dispensaries:', data);
      setDispensaries(data);
      setFilteredDispensaries(data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dispensaries. Please try again later.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (searchTerm) {
      const lowercasedSearch = searchTerm.toLowerCase();
      const filtered = dispensaries.filter(dispensary =>
        dispensary.name.toLowerCase().includes(lowercasedSearch) ||
        dispensary.address.toLowerCase().includes(lowercasedSearch) ||
        dispensary.email.toLowerCase().includes(lowercasedSearch)
      );
      setFilteredDispensaries(filtered);
    } else {
      setFilteredDispensaries(dispensaries);
    }
  }, [searchTerm, dispensaries]);

  const handleDeleteDispensary = async (dispensaryId: string) => {
    if (!window.confirm('Are you sure you want to delete this dispensary?')) return;

    try {
      await DispensaryService.deleteDispensary(dispensaryId);
      toast({
        title: 'Success',
        description: 'Dispensary has been deleted successfully'
      });
      fetchDispensaries();
    } catch (error) {
      console.error('Error deleting dispensary:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete dispensary',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <AdminHeader />
      <main className="container mx-auto px-4 py-8 flex-grow">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Manage Dispensaries</h1>
          <Button onClick={() => navigate('/admin/dispensaries/create')} className="bg-medical-600 hover:bg-medical-700">
            <Plus className="mr-2 h-4 w-4" /> Add New Dispensary
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Dispensaries Directory</CardTitle>
            <CardDescription>
              View, edit or delete dispensary information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search by name, address or email"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <p>Loading dispensaries...</p>
              </div>
            ) : filteredDispensaries.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No dispensaries found</p>
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
                      <TableHead>Address</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDispensaries.map((dispensary) => (
                      <TableRow key={dispensary.id}>
                        <TableCell className="font-medium">{dispensary.name}</TableCell>
                        <TableCell>
                          <div className="flex items-start">
                            <MapPin className="h-4 w-4 mr-1 mt-1 flex-shrink-0" />
                            <span>{dispensary.address}</span>
                          </div>
                        </TableCell>
                        <TableCell>{dispensary.email}</TableCell>
                        <TableCell>{dispensary.contactNumber}</TableCell>
                        <TableCell className="space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/admin/dispensaries/view/${dispensary.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/admin/dispensaries/edit/${dispensary.id}`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteDispensary(dispensary.id)}
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

export default AdminDispensaries;
