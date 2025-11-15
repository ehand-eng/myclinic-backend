
import { useState, useEffect } from 'react';
import { TimeSlotService } from '@/api/services';
import { AbsentTimeSlot } from '@/api/models';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { format, addDays, subDays } from 'date-fns';
import { CalendarClock, Plus, Trash2 } from 'lucide-react';

interface AbsentSlotManagerProps {
  doctorId: string;
  dispensaryId: string;
}

const AbsentSlotManager = ({ doctorId, dispensaryId }: AbsentSlotManagerProps) => {
  const { toast } = useToast();
  const [absentSlots, setAbsentSlots] = useState<AbsentTimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // New absent time slot state
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(addDays(new Date(), 1));
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('17:00');
  const [reason, setReason] = useState<string>('');
  const [isModifiedSession, setIsModifiedSession] = useState<boolean>(false);
  const [maxPatients, setMaxPatients] = useState<number>(0);
  
  // Date range for fetching absent slots
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 7)); // 1 week ago
  const [endDate, setEndDate] = useState<Date>(addDays(new Date(), 30)); // 1 month from now
  
  const fetchAbsentSlots = async () => {
    try {
      setIsLoading(true);
      const fetchedAbsentSlots = await TimeSlotService.getAbsentTimeSlots(
        doctorId, 
        dispensaryId, 
        startDate, 
        endDate
      );
      setAbsentSlots(fetchedAbsentSlots);
    } catch (error) {
      console.error('Error fetching absent slots:', error);
      toast({
        title: 'Error',
        description: 'Failed to load absent time slots',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchAbsentSlots();
  }, [doctorId, dispensaryId, startDate, endDate]);
  
  const handleAddAbsentSlot = async () => {
    if (!selectedDate) {
      toast({
        title: 'Error',
        description: 'Please select a date',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      const newAbsentSlot: Omit<AbsentTimeSlot, 'id' | 'createdAt' | 'updatedAt'> = {
        doctorId,
        dispensaryId,
        date: selectedDate,
        startTime,
        endTime,
        reason,
        isModifiedSession,
        ...(isModifiedSession && { maxPatients })
      };
      
      await TimeSlotService.addAbsentTimeSlot(newAbsentSlot);
      
      toast({
        title: 'Success',
        description: isModifiedSession ? 
          'Modified session added successfully' : 
          'Absent slot added successfully'
      });
      
      // Reset form
      setStartTime('09:00');
      setEndTime('17:00');
      setReason('');
      setIsModifiedSession(false);
      setMaxPatients(0);
      
      // Refresh absent slots
      fetchAbsentSlots();
    } catch (error) {
      console.error('Error adding absent slot:', error);
      toast({
        title: 'Error',
        description: 'Failed to add absent slot',
        variant: 'destructive'
      });
    }
  };
  
  const handleDeleteAbsentSlot = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this absent time slot?')) return;
    
    try {
      await TimeSlotService.deleteAbsentTimeSlot(id);
      
      toast({
        title: 'Success',
        description: 'Absent slot deleted successfully'
      });
      
      // Remove from local state
      setAbsentSlots(prev => prev.filter(slot => slot.id !== id));
    } catch (error) {
      console.error('Error deleting absent slot:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete absent slot',
        variant: 'destructive'
      });
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        <Card className="p-4 bg-gray-50">
          <h3 className="text-lg font-medium mb-4">
            {isModifiedSession ? 'Add Modified Session Schedule' : 'Add Absent Time Slot'}
          </h3>
          
          <div className="mb-4 flex items-center space-x-2">
            <Switch 
              id="modified-session"
              checked={isModifiedSession}
              onCheckedChange={setIsModifiedSession}
            />
            <Label htmlFor="modified-session">
              This is a modified session (changes to regular schedule)
            </Label>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Select Date</Label>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="border border-medicalGreen-200 rounded-xl shadow-lg mt-2 medical-card"
                disabled={(date) => {
                  // Can't select dates in the past
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return date < today;
                }}
              />
              <p className="text-sm text-gray-500 mt-2">
                {selectedDate && `Selected: ${format(selectedDate, 'MMMM dd, yyyy')}`}
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              {isModifiedSession && (
                <div>
                  <Label htmlFor="maxPatients">Max Patients for Modified Session</Label>
                  <Input
                    id="maxPatients"
                    type="number"
                    min="1"
                    value={maxPatients || ''}
                    onChange={(e) => setMaxPatients(parseInt(e.target.value))}
                    className="mt-1"
                    placeholder="Enter maximum patient count"
                  />
                </div>
              )}
              
              <div>
                <Label htmlFor="reason">
                  {isModifiedSession ? 'Reason for Schedule Change' : 'Reason for Absence'}
                </Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={isModifiedSession ? "Why is the schedule modified?" : "Why is the doctor absent?"}
                  className="mt-1"
                  rows={3}
                />
              </div>
              
              <Button onClick={handleAddAbsentSlot} className="w-full mt-4">
                <Plus className="mr-2 h-4 w-4" />
                {isModifiedSession ? 'Add Modified Session' : 'Add Absent Slot'}
              </Button>
            </div>
          </div>
        </Card>
      </div>
      
      <div>
        <h3 className="text-lg font-medium mb-4">
          Upcoming Absences & Modified Sessions
        </h3>
        
        {isLoading ? (
          <p>Loading data...</p>
        ) : absentSlots.length === 0 ? (
          <p className="text-center py-8 text-gray-500">No absences or modified sessions scheduled</p>
        ) : (
          <div className="space-y-4">
            {absentSlots.map((slot) => (
              <Card key={slot.id} className="p-4">
                <div className="flex flex-col md:flex-row justify-between">
                  <div className="flex-grow space-y-2">
                    <div className="flex items-start">
                      <CalendarClock className="h-5 w-5 mr-2 text-gray-500 mt-0.5" />
                      <div>
                        <h4 className="font-medium">
                          {slot.isModifiedSession ? 'Modified Session:' : 'Absence:'} {format(new Date(slot.date), 'MMMM dd, yyyy')}
                        </h4>
                        <p className="text-sm text-gray-600">
                          Time: {slot.startTime} - {slot.endTime}
                        </p>
                        {slot.isModifiedSession && slot.maxPatients && (
                          <p className="text-sm text-gray-600">
                            Maximum patients: {slot.maxPatients}
                          </p>
                        )}
                        {slot.reason && (
                          <p className="text-sm text-gray-600">
                            Reason: {slot.reason}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center mt-4 md:mt-0">
                    <Button 
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteAbsentSlot(slot.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="ml-2">Delete</span>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AbsentSlotManager;
