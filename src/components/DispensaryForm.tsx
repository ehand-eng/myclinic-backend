import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dispensary, Doctor } from '@/api/models';
import { DispensaryService, DoctorService } from '@/api/services';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

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

// Email validation regex (optional field - must be valid if provided)
const validateOptionalEmail = (email: string): boolean | string => {
  if (!email || email.trim() === '') return true; // Allow empty
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }
  
  return true;
};

interface DispensaryFormProps {
  dispensaryId?: string;
  isEdit?: boolean;
}

interface DispensaryFormValues {
  name: string;
  address: string;
  contactNumber: string;
  email: string;
  description: string;
  doctors: string[];
  latitude?: number;
  longitude?: number;
}

const DispensaryForm = ({ dispensaryId, isEdit = false }: DispensaryFormProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctors, setSelectedDoctors] = useState<string[]>([]);
  
  const form = useForm<DispensaryFormValues>({
    defaultValues: {
      name: '',
      address: '',
      contactNumber: '',
      email: '',
      description: '',
      doctors: [],
      latitude: undefined,
      longitude: undefined
    }
  });
  
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load doctors for selection
        const doctorsData = await DoctorService.getAllDoctors();
        setDoctors(doctorsData);
        
        // If editing, load dispensary data
        if (isEdit && dispensaryId) {
          const dispensaryData = await DispensaryService.getDispensaryById(dispensaryId);
          if (dispensaryData) {
            const doctorIds = dispensaryData.doctors || [];
            setSelectedDoctors(doctorIds);
            form.reset({
              name: dispensaryData.name,
              address: dispensaryData.address,
              contactNumber: dispensaryData.contactNumber,
              email: dispensaryData.email,
              description: dispensaryData.description || '',
              doctors: doctorIds,
              latitude: dispensaryData.location?.latitude,
              longitude: dispensaryData.location?.longitude
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
  }, [dispensaryId, isEdit, form, toast]);
  
  const onSubmit = async (data: DispensaryFormValues) => {
    try {
      setIsLoading(true);
      
      const dispensaryData: Partial<Dispensary> = {
        name: data.name,
        address: data.address,
        contactNumber: data.contactNumber,
        email: data.email,
        description: data.description,
        doctors: selectedDoctors
      };
      
      // Add location if both latitude and longitude are provided
      if (data.latitude && data.longitude) {
        dispensaryData.location = {
          latitude: data.latitude,
          longitude: data.longitude
        };
      }
      
      if (isEdit && dispensaryId) {
        await DispensaryService.updateDispensary(dispensaryId, dispensaryData);
        toast({
          title: 'Success',
          description: 'Dispensary updated successfully',
        });
      } else {
        await DispensaryService.addDispensary(dispensaryData as Omit<Dispensary, 'id' | 'createdAt' | 'updatedAt'>);
        toast({
          title: 'Success',
          description: 'Dispensary created successfully',
        });
      }
      
      navigate('/admin/dispensaries');
    } catch (error) {
      console.error('Error saving dispensary:', error);
      toast({
        title: 'Error',
        description: isEdit ? 'Failed to update dispensary' : 'Failed to create dispensary',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSelectedDoctorsChange = (doctorId: string) => {
    // Update local state
    setSelectedDoctors(prev => {
      if (prev.includes(doctorId)) {
        return prev.filter(id => id !== doctorId);
      } else {
        return [...prev, doctorId];
      }
    });
    
    // Also update the form values
    const currentSelected = form.getValues('doctors');
    const updatedSelected = currentSelected.includes(doctorId)
      ? currentSelected.filter(id => id !== doctorId)
      : [...currentSelected, doctorId];
      
    form.setValue('doctors', updatedSelected);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? 'Edit Dispensary' : 'Add New Dispensary'}</CardTitle>
        <CardDescription>
          {isEdit ? 'Update dispensary information' : 'Enter dispensary details to add to the system'}
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
                    <Input placeholder="Dispensary name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Full address" {...field} />
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
                validate: validateOptionalEmail
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="dispensary@example.com (optional)" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Brief description of the dispensary" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="latitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Latitude</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g. 37.7749" 
                        type="number" 
                        step="any"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="longitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Longitude</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g. -122.4194" 
                        type="number" 
                        step="any"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div>
              <FormLabel className="block mb-2">Associated Doctors</FormLabel>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 border rounded-md p-4">
                {doctors.length === 0 ? (
                  <p className="text-sm text-gray-500">No doctors available</p>
                ) : (
                  doctors.map((doctor) => (
                    <div key={doctor.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`doctor-${doctor.id}`}
                        checked={JSON.stringify(selectedDoctors).includes(doctor.id)}
                        onCheckedChange={() => handleSelectedDoctorsChange(doctor.id)}
                      />
                      <label
                        htmlFor={`doctor-${doctor.id}`}
                        className="text-sm cursor-pointer"
                      >
                        {doctor.name} ({doctor.specialization})
                      </label>
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/admin/dispensaries')}
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
                'Update Dispensary'
              ) : (
                'Add Dispensary'
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};

export default DispensaryForm;
