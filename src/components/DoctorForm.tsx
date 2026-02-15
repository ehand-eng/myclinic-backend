
import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Doctor, Dispensary } from '@/api/models';
import { DoctorService, DispensaryService } from '@/api/services';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload } from 'lucide-react';

interface DoctorFormProps {
  doctorId?: string;
  isEdit?: boolean;
}

interface DoctorFormValues {
  name: string;
  specialization: string;
  qualifications: string;
  contactNumber: string;
  email: string;
  profilePicture?: string;
  dispensaries: string[];
  bookingVisibleDays: number;
}

// Phone number validation: accepts 0762199100, 762199100, or +94762199100
const validatePhoneNumber = (phone: string): boolean | string => {
  if (!phone) return true; // Allow empty for optional fields

  // Remove spaces
  const cleanPhone = phone.trim();

  // Check formats: 0762199100, 762199100, +94762199100
  const phoneRegex = /^(\+94|0)?7\d{8}$/;

  if (!phoneRegex.test(cleanPhone)) {
    return 'Phone number must be in format: 0762199100, 762199100, or +94762199100';
  }

  return true;
};

// Email validation regex
const validateEmail = (email: string): boolean | string => {
  if (!email) return 'Email is required';

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }

  return true;
};

const DoctorForm = ({ doctorId, isEdit = false }: DoctorFormProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [dispensaries, setDispensaries] = useState<Dispensary[]>([]);
  const [selectedDispensaries, setSelectedDispensaries] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<DoctorFormValues>({
    defaultValues: {
      name: '',
      specialization: '',
      qualifications: '',
      contactNumber: '',
      email: '',
      profilePicture: '',
      dispensaries: [],
      bookingVisibleDays: 30
    }
  });

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load dispensaries for selection
        const dispensariesData = await DispensaryService.getAllDispensaries();
        setDispensaries(dispensariesData);

        // If editing, load doctor data
        if (isEdit && doctorId) {
          const doctorData = await DoctorService.getDoctorById(doctorId);
          if (doctorData) {
            const dispensaryIds = doctorData.dispensaries || [];
            console.log("selected dis " + JSON.stringify(dispensaryIds));
            setSelectedDispensaries(dispensaryIds);
            form.reset({
              name: doctorData.name,
              specialization: doctorData.specialization,
              qualifications: doctorData.qualifications.join(', '),
              contactNumber: doctorData.contactNumber,
              email: doctorData.email,
              profilePicture: doctorData.profilePicture || '',
              dispensaries: dispensaryIds,
              bookingVisibleDays: doctorData.bookingVisibleDays ?? 30
            });
          }
        }
      } catch (error) {
        console.error('Error loading form data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load necessary data',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [doctorId, isEdit, form, toast]);

  const onSubmit = async (data: DoctorFormValues) => {
    try {
      setIsLoading(true);

      // Convert comma-separated qualifications to array
      const qualificationsArray = data.qualifications
        .split(',')
        .map(q => q.trim())
        .filter(Boolean);

      const doctorData: Partial<Doctor> = {
        name: data.name,
        specialization: data.specialization,
        qualifications: qualificationsArray,
        contactNumber: data.contactNumber,
        email: data.email,
        dispensaries: selectedDispensaries,
        bookingVisibleDays: selectedDispensaries.length > 0 ? data.bookingVisibleDays : undefined
      };

      if (data.profilePicture) {
        doctorData.profilePicture = data.profilePicture;
      }

      if (isEdit && doctorId) {
        await DoctorService.updateDoctor(doctorId, doctorData);
        toast({
          title: 'Success',
          description: 'Doctor updated successfully',
        });
      } else {
        await DoctorService.addDoctor(doctorData as Omit<Doctor, 'id' | 'createdAt' | 'updatedAt'>);
        toast({
          title: 'Success',
          description: 'Doctor created successfully',
        });
      }

      navigate('/admin/doctors');
    } catch (error) {
      console.error('Error saving doctor:', error);
      toast({
        title: 'Error',
        description: isEdit ? 'Failed to update doctor' : 'Failed to create doctor',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectedDispensariesChange = (dispensaryId: string) => {
    // Update local state
    setSelectedDispensaries(prev => {
      if (prev.includes(dispensaryId)) {
        return prev.filter(id => id !== dispensaryId);
      } else {
        return [...prev, dispensaryId];
      }
    });

    // Also update form values
    const currentSelected = form.getValues('dispensaries');
    const updatedSelected = currentSelected.includes(dispensaryId)
      ? currentSelected.filter(id => id !== dispensaryId)
      : [...currentSelected, dispensaryId];

    form.setValue('dispensaries', updatedSelected);
  };

  const handleProfilePictureUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check if it's an image file
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Error',
          description: 'Please select an image file',
          variant: 'destructive'
        });
        return;
      }

      // Convert to data URL
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        form.setValue('profilePicture', result);
      };
      reader.onerror = () => {
        toast({
          title: 'Error',
          description: 'Failed to read image file',
          variant: 'destructive'
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? 'Edit Doctor' : 'Add New Doctor'}</CardTitle>
        <CardDescription>
          {isEdit ? 'Update doctor information' : 'Enter doctor details to add them to the system'}
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Doctor's full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="specialization"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Specialization</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select specialization" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Cardiologist">Cardiologist</SelectItem>
                      <SelectItem value="Dermatologist">Dermatologist</SelectItem>
                      <SelectItem value="Neurologist">Neurologist</SelectItem>
                      <SelectItem value="Orthopedic Surgeon">Orthopedic Surgeon</SelectItem>
                      <SelectItem value="Pediatrician">Pediatrician</SelectItem>
                      <SelectItem value="Psychiatrist">Psychiatrist</SelectItem>
                      <SelectItem value="General Practitioner">General Practitioner</SelectItem>
                      <SelectItem value="Gynecologist">Gynecologist</SelectItem>
                      <SelectItem value="Ophthalmologist">Ophthalmologist</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="qualifications"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Qualifications</FormLabel>
                  <FormControl>
                    <Input placeholder="MBBS, MD, etc (comma separated)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactNumber"
              rules={{
                validate: validatePhoneNumber
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Number</FormLabel>
                  <FormControl>
                    <Input placeholder="0762199100, 762199100, or +94762199100" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              rules={{
                validate: validateEmail
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="doctor@example.com" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="profilePicture"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profile Picture</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input placeholder="http://example.com/image.jpg or upload file" {...field} />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleProfilePictureUpload}
                      className="flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Upload
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel className="block mb-2">Associated Dispensaries</FormLabel>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 border rounded-md p-4">
                {dispensaries.length === 0 ? (
                  <p className="text-sm text-gray-500">No dispensaries available</p>
                ) : (
                  dispensaries.map((dispensary) => (
                    <div key={dispensary.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`dispensary-${dispensary.id}`}
                        checked={JSON.stringify(selectedDispensaries).includes(dispensary.id)}
                        onCheckedChange={() => handleSelectedDispensariesChange(dispensary.id)}
                      />
                      <label
                        htmlFor={`dispensary-${dispensary.id}`}
                        className="text-sm cursor-pointer"
                      >
                        {dispensary.name}
                      </label>
                    </div>
                  ))
                )}
              </div>
            </div>

            {selectedDispensaries.length > 0 && (
              <FormField
                control={form.control}
                name="bookingVisibleDays"
                rules={{
                  required: 'Online Booking Visible Days is required',
                  min: { value: 1, message: 'Must be at least 1 day' },
                  max: { value: 365, message: 'Must be at most 365 days' }
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Online Booking Visible Days</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={365}
                        placeholder="30"
                        {...field}
                        value={field.value ?? 30}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value, 10) : 30)}
                      />
                    </FormControl>
                    <p className="text-xs text-gray-500">Number of future days patients can book online for this doctor</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/admin/doctors')}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-medical-600 hover:bg-medical-700"
            >
              {isLoading ? (
                'Saving...'
              ) : isEdit ? (
                'Update Doctor'
              ) : (
                'Add Doctor'
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};

export default DoctorForm;
