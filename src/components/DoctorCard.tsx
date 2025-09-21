
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Doctor } from '@/api/models';

interface DoctorCardProps {
  doctor: Doctor;
}

const DoctorCard = ({ doctor }: DoctorCardProps) => {
  return (
    <Card className="medical-card group hover:scale-105 transition-all duration-300 overflow-hidden">
      <div className="aspect-[4/3] relative overflow-hidden">
        <img 
          src={doctor.profilePicture || 'https://randomuser.me/api/portraits/lego/0.jpg'} 
          alt={doctor.name} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      <CardHeader className="pb-3">
        <div className="flex flex-col space-y-2">
          <h3 className="font-bold text-xl text-medicalGray-800 group-hover:text-medicalBlue-600 transition-colors">
            {doctor.name}
          </h3>
          <Badge variant="outline" className="text-xs self-start bg-medicalBlue-50 text-medicalBlue-700 border-medicalBlue-200">
            {doctor.specialization}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="text-sm text-medicalGray-600 mb-3 font-medium">
            Qualifications:
          </div>
          <div className="flex flex-wrap gap-2">
            {doctor.qualifications.map((qualification, index) => (
              <Badge key={index} variant="secondary" className="text-xs bg-medicalTeal-50 text-medicalTeal-700 border-medicalTeal-200">
                {qualification}
              </Badge>
            ))}
          </div>
        </div>
        <Button asChild className="w-full medical-button">
          <Link to={`/booking?doctorId=${doctor.id}`}>
            <Stethoscope className="h-4 w-4 mr-2" />
            Book Appointment
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default DoctorCard;
