import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminHeader from '@/components/AdminHeader';
import AdminFooter from '@/components/AdminFooter';
import { Dispensary, Doctor } from '@/api/models';
import { DispensaryService, DoctorService } from '@/api/services';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Edit, Trash2, MapPin, CalendarDays } from 'lucide-react';

const ViewDispensary = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [dispensary, setDispensary] = useState<Dispensary | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDispensaryData = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        const dispensaryData = await DispensaryService.getDispensaryById(id);
        setDispensary(dispensaryData);

        if (dispensaryData?.doctors?.length > 0) {
          const doctorsData = await DoctorService.getDoctorsByDispensaryId(id);
          setDoctors(doctorsData);
        }
      } catch (error) {
        console.error('Error fetching dispensary data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load dispensary information',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDispensaryData();
  }, [id, toast]);

  const handleDelete = async () => {
    if (!id) return;

    if (!window.confirm('Are you sure you want to delete this dispensary?')) return;

    try {
      await DispensaryService.deleteDispensary(id);
      toast({
        title: 'Success',
        description: 'Dispensary deleted successfully'
      });
      navigate('/admin/dispensaries');
    } catch (error) {
      console.error('Error deleting dispensary:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete dispensary',
        variant: 'destructive'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <AdminHeader />
        <main className="flex-grow bg-gradient-to-br from-medicalBlue-50 via-white to-medicalTeal-50">
          <div className="container mx-auto px-4 py-8">
            <div className="flex justify-center items-center h-full">
              <p className="text-medicalGray-600">Loading dispensary information...</p>
            </div>
          </div>
        </main>
        <AdminFooter />
      </div>
    );
  }

  if (!dispensary) {
    return (
      <div className="flex flex-col min-h-screen">
        <AdminHeader />
        <main className="container mx-auto px-4 py-8 flex-grow">
          <Card>
            <CardHeader>
              <CardTitle>Dispensary Not Found</CardTitle>
              <CardDescription>
                The dispensary you are looking for doesn't exist or has been removed
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button onClick={() => navigate('/admin/dispensaries')}>
                Back to Dispensaries
              </Button>
            </CardFooter>
          </Card>
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
            <h1 className="text-3xl font-bold medical-text-gradient">Dispensary Details</h1>
            <div className="space-x-2">
              <Button
                variant="outline"
                onClick={() => navigate(`/admin/dispensaries/edit/${id}`)}
              >
                <Edit className="mr-2 h-4 w-4" /> Edit
              </Button>
              <Button
                variant="outline"
                onClick={handleDelete}
                className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>{dispensary.name}</CardTitle>
                  <CardDescription>
                    {dispensary.description || 'No description provided'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Contact Information</h3>
                    <div className="mt-1">
                      <p>
                        <span className="font-medium">Address:</span>{' '}
                        <div className="flex items-start mt-1 text-sm text-gray-500">
                          <MapPin className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                          <span>{dispensary.address}</span>
                        </div>
                      </p>
                      <p>
                        <span className="font-medium">Email:</span>{' '}
                        <a href={`mailto:${dispensary.email}`} className="text-medical-600 hover:underline">
                          {dispensary.email}
                        </a>
                      </p>
                      <p>
                        <span className="font-medium">Phone:</span>{' '}
                        <a href={`tel:${dispensary.contactNumber}`} className="text-medical-600 hover:underline">
                          {dispensary.contactNumber}
                        </a>
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Associated Doctors</h3>
                    <div className="mt-1">
                      {doctors.length === 0 ? (
                        <p className="text-gray-400">No associated doctors</p>
                      ) : (
                        <div className="space-y-2 mt-2">
                          {doctors.map(doctor => (
                            <div
                              key={doctor.id}
                              className="p-3 bg-gray-50 rounded-md"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium">{doctor.name}</h4>
                                  <p className="text-sm text-gray-500">{doctor.specialization}</p>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => navigate(`/admin/timeslots/${doctor.id}/${dispensary.id}`)}
                                >
                                  <CalendarDays className="h-4 w-4 mr-1" />
                                  Manage Slots
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={() => navigate('/admin/dispensaries')}
                    className="w-full"
                  >
                    Back to Dispensaries List
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div> {/* ✅ This div was missing — closes the container */}
      </main>
      <AdminFooter />
    </div>
  );
};

export default ViewDispensary;
