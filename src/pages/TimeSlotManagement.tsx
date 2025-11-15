import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminHeader from '@/components/AdminHeader';
import AdminFooter from '@/components/AdminFooter';
import { DoctorService, DispensaryService } from '@/api/services';
import { Doctor, Dispensary } from '@/api/models';
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
import TimeSlotScheduler from '@/components/TimeSlotScheduler';
import AbsentSlotManager from '@/components/AbsentSlotManager';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';

const TimeSlotManagement = () => {
  const { doctorId, dispensaryId } = useParams<{ doctorId: string; dispensaryId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [dispensary, setDispensary] = useState<Dispensary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!doctorId || !dispensaryId) return;

      try {
        setIsLoading(true);

        const [doctorData, dispensaryData] = await Promise.all([
          DoctorService.getDoctorById(doctorId),
          DispensaryService.getDispensaryById(dispensaryId)
        ]);

        setDoctor(doctorData);
        setDispensary(dispensaryData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load data. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [doctorId, dispensaryId, toast]);

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <AdminHeader />
        <main className="flex-grow bg-gradient-to-br from-medicalBlue-50 via-white to-medicalTeal-50">
          <div className="container mx-auto px-4 py-8">
            <div className="flex justify-center items-center h-full">
              <p className="text-medicalGray-600">Loading time slot management...</p>
            </div>
          </div>
        </main>
        <AdminFooter />
      </div>
    );
  }

  if (!doctor || !dispensary) {
    return (
      <div className="flex flex-col min-h-screen">
        <AdminHeader />
        <main className="flex-grow bg-gradient-to-br from-medicalBlue-50 via-white to-medicalTeal-50">
          <div className="container mx-auto px-4 py-8">
            <Card className="medical-card">
              <CardHeader>
                <CardTitle>Data Not Found</CardTitle>
                <CardDescription>
                  The doctor or dispensary you are looking for doesn't exist or has been removed
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
            <div>
              <h1 className="text-3xl font-bold medical-text-gradient">Time Slot Management</h1>
              <p className="text-medicalGray-600 mt-1">
                {doctor.name} at {dispensary.name}
              </p>
            </div>
            <Button onClick={() => navigate(-1)} variant="outline">
              Back
            </Button>
          </div>

          <Tabs defaultValue="regular" className="w-full">
            <TabsList className="grid grid-cols-2 mb-6">
              <TabsTrigger value="regular">Regular Schedule</TabsTrigger>
              <TabsTrigger value="absent">Absent Management</TabsTrigger>
            </TabsList>

            <TabsContent value="regular">
              <Card>
                <CardHeader>
                  <CardTitle>Regular Timeslot Configuration</CardTitle>
                  <CardDescription>
                    Set up the doctor's regular weekly schedule at this dispensary
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TimeSlotScheduler doctorId={doctorId} dispensaryId={dispensaryId} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="absent">
              <Card>
                <CardHeader>
                  <CardTitle>Absent Time Slots</CardTitle>
                  <CardDescription>
                    Manage days when the doctor will be absent
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AbsentSlotManager doctorId={doctorId} dispensaryId={dispensaryId} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div> {/* ✅ This div was missing (container close) */}
      </main>
      <AdminFooter />
    </div>
  );
};

export default TimeSlotManagement;
