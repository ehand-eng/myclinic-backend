
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, User, Calendar, Stethoscope } from 'lucide-react';

const MobileHome = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      {/* Header */}
      <div className="text-center mb-8 pt-8">
        <div className="flex justify-center mb-4">
          <div className="bg-blue-600 p-3 rounded-full">
            <Heart className="h-8 w-8 text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">HealthCare+</h1>
        <p className="text-gray-600">Your Health Management Companion</p>
      </div>

      {/* Quick Actions */}
      <div className="space-y-4 mb-8">
        <Card className="shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Patient Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">View your health records and vitals</p>
            <Button 
              onClick={() => navigate('/dashboard')} 
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Open Dashboard
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-green-600" />
              Find Doctors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">Browse available healthcare providers</p>
            <Button 
              onClick={() => navigate('/doctors')} 
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Browse Doctors
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">Manage your medical appointments</p>
            <Button 
              onClick={() => navigate('/appointments')} 
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              View Appointments
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Status */}
      <div className="text-center text-sm text-gray-500">
        <p>Mobile Health Management System</p>
        <p>Version 1.0 - Ready for Android & iOS</p>
      </div>
    </div>
  );
};

export default MobileHome;
