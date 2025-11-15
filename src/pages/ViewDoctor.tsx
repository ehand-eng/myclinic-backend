import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminHeader from '@/components/AdminHeader';
import AdminFooter from '@/components/AdminFooter';
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
import { useToast } from '@/hooks/use-toast';
import { DoctorService, DispensaryService } from '@/api/services';
import { Doctor, Dispensary } from '@/api/models';
import { Calendar } from 'lucide-react';

const ViewDoctor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [dispensaries, setDispensaries] = useState<Dispensary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDoctor = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        const doctorData = await DoctorService.getDoctorById(id);
        setDoctor(doctorData);

        if (doctorData.dispensaries && doctorData.dispensaries.length > 0) {
          const dispensaryPromises = doctorData.dispensaries.map(
            (dispensaryId) => DispensaryService.getDispensaryById(dispensaryId)
          );
          const dispensariesData = await Promise.all(dispensaryPromises);
          setDispensaries(dispensariesData.filter(Boolean) as Dispensary[]);
        }
      } catch (error) {
        console.error('Error fetching doctor:', error);
        toast({
          title: 'Error',
          description: 'Failed to load doctor information',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDoctor();
  }, [id, toast]);

  const handleDelete = async () => {
    if (!id) return;

    if (window.confirm('Are you sure you want to delete this doctor?')) {
      try {
        await DoctorService.deleteDoctor(id);
        toast({
          title: 'Success',
          description: 'Doctor deleted successfully',
        });
        navigate('/admin/doctors');
      } catch (error) {
        console.error('Error deleting doctor:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete doctor',
          variant: 'destructive',
        });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <AdminHeader />
        <main className="flex-grow bg-gradient-to-br from-medicalBlue-50 via-white to-medicalTeal-50">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-center">
              <p className="text-medicalGray-600">Loading doctor information...</p>
            </div>
          </div>
        </main>
        <AdminFooter />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="flex flex-col min-h-screen">
        <AdminHeader />
        <main className="flex-grow bg-gradient-to-br from-medicalBlue-50 via-white to-medicalTeal-50">
          <div className="container mx-auto px-4 py-8">
            <Card className="medical-card">
              <CardHeader>
                <CardTitle>Doctor Not Found</CardTitle>
                <CardDescription>
                  The doctor you are looking for doesn't exist or has been removed
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button onClick={() => navigate('/admin/doctors')} className="medical-button">
                  Back to Doctors
                </Button>
              </CardFooter>
            </Card>
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
            <h1 className="text-3xl font-bold medical-text-gradient">Doctor Profile</h1>
            <Button onClick={() => navigate('/admin/doctors')} variant="outline">
              Back to Doctors
            </Button>
          </div> {/* ✅ This closing tag was missing */}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Card>
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    {doctor.profilePicture ? (
                      <img
                        src={doctor.profilePicture}
                        alt={doctor.name}
                        className="rounded-full w-32 h-32 object-cover"
                      />
                    ) : (
                      <div className="rounded-full w-32 h-32 bg-gray-200 flex items-center justify-center">
                        <span className="text-4xl font-light text-gray-500">
                          {doctor.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  <CardTitle>{doctor.name}</CardTitle>
                  <CardDescription>{doctor.specialization}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Qualifications</h3>
                      <p>{doctor.qualifications.join(', ')}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Contact</h3>
                      <p>{doctor.contactNumber}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Email</h3>
                      <p>{doctor.email}</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    onClick={() => navigate(`/admin/doctors/edit/${id}`)}
                    variant="outline"
                  >
                    Edit Profile
                  </Button>
                  <Button
                    onClick={handleDelete}
                    variant="destructive"
                  >
                    Delete
                  </Button>
                </CardFooter>
              </Card>
            </div>

            <div className="lg:col-span-2">
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Associated Dispensaries</CardTitle>
                  <CardDescription>
                    Dispensaries where this doctor provides services
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {dispensaries.length === 0 ? (
                    <p className="text-gray-500 italic">
                      This doctor is not associated with any dispensaries yet
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {dispensaries.map((dispensary) => (
                        <div key={dispensary.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{dispensary.name}</h3>
                              <p className="text-sm text-gray-500">{dispensary.address}</p>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate(`/admin/dispensaries/view/${dispensary.id}`)}
                              >
                                View
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => navigate(`/doctor/${doctor.id}/dispensary/${dispensary.id}/time-slots`)}
                                className="bg-medical-600 hover:bg-medical-700"
                              >
                                <Calendar className="mr-2 h-4 w-4" />
                                Manage Time Slots
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <AdminFooter />
    </div>
  );
};

export default ViewDoctor;
