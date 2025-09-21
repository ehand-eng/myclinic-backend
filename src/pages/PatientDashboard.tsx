
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Heart, Activity, Thermometer, Scale } from 'lucide-react';

const PatientDashboard = () => {
  const navigate = useNavigate();

  const vitals = [
    { icon: Heart, label: 'Heart Rate', value: '72 bpm', color: 'text-red-600' },
    { icon: Activity, label: 'Blood Pressure', value: '120/80', color: 'text-green-600' },
    { icon: Thermometer, label: 'Temperature', value: '98.6°F', color: 'text-blue-600' },
    { icon: Scale, label: 'Weight', value: '165 lbs', color: 'text-purple-600' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-medicalBlue-50 via-white to-medicalTeal-50 p-4">
      {/* Header */}
      <div className="flex items-center mb-8 pt-4 fade-in-up">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/')}
          className="mr-4 hover:bg-medicalBlue-50"
        >
          <ArrowLeft className="h-5 w-5 text-medicalBlue-600" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold medical-text-gradient">Patient Dashboard</h1>
          <p className="text-medicalGray-600">Your health information at a glance</p>
        </div>
      </div>

      {/* Patient Info */}
      <Card className="mb-8 medical-card fade-in-up" style={{ animationDelay: '0.1s' }}>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="medical-icon-bg">
              <Heart className="h-6 w-6 text-medicalBlue-600" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-medicalGray-800">Welcome back, John Doe</CardTitle>
              <p className="text-medicalGray-600 mt-1">Last visit: March 15, 2024</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-medicalGreen-500 rounded-full"></div>
            <span className="text-medicalGreen-600 font-medium">Healthy Status</span>
          </div>
        </CardContent>
      </Card>

      {/* Vitals Grid */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {vitals.map((vital, index) => (
          <Card key={index} className="medical-card group hover:scale-105 transition-all duration-300 fade-in-up" style={{ animationDelay: `${0.2 + index * 0.1}s` }}>
            <CardContent className="p-6 text-center">
              <div className="medical-icon-bg mb-4 group-hover:scale-110 transition-transform duration-300">
                <vital.icon className={`h-8 w-8 ${vital.color}`} />
              </div>
              <p className="text-sm text-medicalGray-600 mb-2 font-medium">{vital.label}</p>
              <p className="text-2xl font-bold text-medicalGray-800">{vital.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="space-y-4 fade-in-up" style={{ animationDelay: '0.6s' }}>
        <Button 
          onClick={() => navigate('/appointments')} 
          className="w-full medical-button text-lg py-6"
        >
          <Calendar className="h-5 w-5 mr-2" />
          Book New Appointment
        </Button>
        <Button 
          onClick={() => navigate('/doctors')} 
          variant="outline" 
          className="w-full medical-button-outline text-lg py-6"
        >
          <Heart className="h-5 w-5 mr-2" />
          Find Specialists
        </Button>
      </div>
    </div>
  );
};

export default PatientDashboard;
