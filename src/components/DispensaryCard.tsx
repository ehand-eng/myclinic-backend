
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail } from 'lucide-react';
import { Dispensary } from '@/api/models';

interface DispensaryCardProps {
  dispensary: Dispensary;
  doctorCount?: number;
}

const DispensaryCard = ({ dispensary, doctorCount }: DispensaryCardProps) => {
  return (
    <Card className="medical-card group hover:scale-105 transition-all duration-300">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <div className="medical-icon-bg">
            <MapPin className="h-6 w-6 text-medicalTeal-600" />
          </div>
          <h3 className="font-bold text-xl text-medicalGray-800 group-hover:text-medicalTeal-600 transition-colors">
            {dispensary.name}
          </h3>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4 text-sm">
          <div className="flex items-start space-x-3">
            <MapPin className="h-5 w-5 text-medicalGray-500 mt-0.5" />
            <span className="text-medicalGray-600 leading-relaxed">{dispensary.address}</span>
          </div>
          
          <div className="flex items-center space-x-3">
            <Phone className="h-5 w-5 text-medicalGray-500" />
            <a href={`tel:${dispensary.contactNumber}`} className="text-medicalBlue-600 hover:text-medicalBlue-700 hover:underline font-medium">
              {dispensary.contactNumber}
            </a>
          </div>
          
          {dispensary.email && (
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-medicalGray-500" />
              <a href={`mailto:${dispensary.email}`} className="text-medicalBlue-600 hover:text-medicalBlue-700 hover:underline font-medium">
                {dispensary.email}
              </a>
            </div>
          )}
        </div>
        
        {doctorCount !== undefined && (
          <div className="bg-medicalTeal-50 border border-medicalTeal-200 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-medicalTeal-500 rounded-full"></div>
              <span className="text-sm text-medicalTeal-700 font-medium">
                {doctorCount} {doctorCount === 1 ? 'doctor' : 'doctors'} available
              </span>
            </div>
          </div>
        )}
        
        <Button asChild className="w-full medical-button">
          <Link to={`/booking?dispensaryId=${dispensary.id}`}>
            <MapPin className="h-4 w-4 mr-2" />
            View Available Doctors
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default DispensaryCard;
