
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Star, MapPin, Clock } from 'lucide-react';

const DoctorsList = () => {
  const navigate = useNavigate();

  const doctors = [
    {
      id: 1,
      name: 'Dr. Sarah Johnson',
      specialty: 'Cardiology',
      rating: 4.8,
      distance: '0.5 miles',
      availability: 'Available Today',
      image: '👩‍⚕️'
    },
    {
      id: 2,
      name: 'Dr. Michael Chen',
      specialty: 'General Medicine',
      rating: 4.9,
      distance: '1.2 miles',
      availability: 'Next Available: Tomorrow',
      image: '👨‍⚕️'
    },
    {
      id: 3,
      name: 'Dr. Emily Davis',
      specialty: 'Pediatrics',
      rating: 4.7,
      distance: '2.1 miles',
      availability: 'Available Today',
      image: '👩‍⚕️'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="flex items-center mb-6 pt-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/')}
          className="mr-3"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold text-gray-800">Find Doctors</h1>
      </div>

      {/* Search/Filter placeholder */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <p className="text-center text-gray-600">
            📍 Showing doctors near your location
          </p>
        </CardContent>
      </Card>

      {/* Doctors List */}
      <div className="space-y-4">
        {doctors.map((doctor) => (
          <Card key={doctor.id} className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{doctor.image}</div>
                  <div>
                    <CardTitle className="text-lg">{doctor.name}</CardTitle>
                    <Badge variant="secondary" className="mt-1">
                      {doctor.specialty}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-yellow-500">
                  <Star className="h-4 w-4 fill-current" />
                  <span className="text-sm font-medium">{doctor.rating}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {doctor.distance}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {doctor.availability}
                </div>
              </div>
              <Button className="w-full" size="sm">
                Book Appointment
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DoctorsList;
