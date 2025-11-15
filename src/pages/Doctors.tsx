
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import DoctorCard from '@/components/DoctorCard';
import { useState, useEffect } from 'react';
import { Doctor } from '@/api/models';
import { DoctorService } from '@/api/services';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Search } from 'lucide-react';

const Doctors = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [specializationFilter, setSpecializationFilter] = useState('all');
  
  // Get unique specializations for the filter
  const specializations = [...new Set(doctors.map(doctor => doctor.specialization))];
  
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setIsLoading(true);
        const allDoctors = await DoctorService.getAllDoctors();
        setDoctors(allDoctors);
        setFilteredDoctors(allDoctors);
      } catch (error) {
        console.error('Error fetching doctors:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDoctors();
  }, []);
  
  useEffect(() => {
    // Filter doctors based on search term and specialization
    let result = doctors;
    
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      result = result.filter(doctor => 
        doctor.name.toLowerCase().includes(lowerSearchTerm) ||
        doctor.qualifications.some(q => q.toLowerCase().includes(lowerSearchTerm))
      );
    }
    
    if (specializationFilter !== 'all') {
      result = result.filter(doctor => doctor.specialization === specializationFilter);
    }
    
    setFilteredDoctors(result);
  }, [searchTerm, specializationFilter, doctors]);
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow">
        <div className="bg-medical-700 text-white py-12">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl font-bold">Our Medical Team</h1>
            <p className="mt-2 text-medical-100">
              Meet our team of experienced and qualified doctors
            </p>
          </div>
        </div>
        
        <div className="container mx-auto px-4 py-12">
          {/* Filters */}
          <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Label htmlFor="search" className="mb-2 block">Search Doctors</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input 
                  id="search"
                  placeholder="Search by name or qualification" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="specialization" className="mb-2 block">Filter by Specialization</Label>
              <Select 
                value={specializationFilter} 
                onValueChange={setSpecializationFilter}
              >
                <SelectTrigger id="specialization">
                  <SelectValue placeholder="All Specializations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Specializations</SelectItem>
                  {specializations.map((specialization) => (
                    <SelectItem key={specialization} value={specialization}>
                      {specialization}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {isLoading ? (
            <div className="text-center py-12">Loading doctors...</div>
          ) : filteredDoctors.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No doctors found matching your criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDoctors.map((doctor) => (
                <DoctorCard key={doctor.id} doctor={doctor} />
              ))}
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Doctors;
