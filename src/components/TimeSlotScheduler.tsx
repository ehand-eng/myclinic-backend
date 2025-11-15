
import { useState, useEffect } from 'react';
import { TimeSlotService } from '@/api/services';
import { TimeSlotConfig } from '@/api/models';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Trash2, Save, Edit } from 'lucide-react';

const DAYS_OF_WEEK = [
  { value: '0', label: 'Sunday' },
  { value: '1', label: 'Monday' },
  { value: '2', label: 'Tuesday' },
  { value: '3', label: 'Wednesday' },
  { value: '4', label: 'Thursday' },
  { value: '5', label: 'Friday' },
  { value: '6', label: 'Saturday' },
];

interface TimeSlotSchedulerProps {
  doctorId: string;
  dispensaryId: string;
}

const TimeSlotScheduler = ({ doctorId, dispensaryId }: TimeSlotSchedulerProps) => {
  const { toast } = useToast();
  const [timeSlots, setTimeSlots] = useState<TimeSlotConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editMode, setEditMode] = useState<string | null>(null);
  
  // New time slot state
  const [dayOfWeek, setDayOfWeek] = useState<string>('1');
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('17:00');
  const [maxPatients, setMaxPatients] = useState<number>(10);
  const [minutesPerPatient, setMinutesPerPatient] = useState<number>(15);
  
  const fetchTimeSlots = async () => {
    try {
      setIsLoading(true);
      const fetchedTimeSlots = await TimeSlotService.getTimeSlotConfigsByDoctor(doctorId, dispensaryId);
      setTimeSlots(fetchedTimeSlots);
    } catch (error) {
      console.error('Error fetching time slots:', error);
      toast({
        title: 'Error',
        description: 'Failed to load time slots',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchTimeSlots();
  }, [doctorId, dispensaryId]);
  
  const handleAddTimeSlot = async () => {
    try {
      const newTimeSlot = await TimeSlotService.addTimeSlotConfig({
        doctorId,
        dispensaryId,
        dayOfWeek: parseInt(dayOfWeek),
        startTime,
        endTime,
        maxPatients,
        minutesPerPatient
      });
      
      toast({
        title: 'Success',
        description: 'Time slot added successfully'
      });
      
      // Reset form
      setDayOfWeek('1');
      setStartTime('09:00');
      setEndTime('17:00');
      setMaxPatients(10);
      setMinutesPerPatient(15);
      
      // Refresh time slots
      fetchTimeSlots();
    } catch (error) {
      console.error('Error adding time slot:', error);
      toast({
        title: 'Error',
        description: 'Failed to add time slot',
        variant: 'destructive'
      });
    }
  };
  
  const handleUpdateTimeSlot = async (id: string) => {
    try {
      const slotToUpdate = timeSlots.find(slot => slot.id === id);
      if (!slotToUpdate) return;
      
      await TimeSlotService.updateTimeSlotConfig(id, slotToUpdate);
      
      toast({
        title: 'Success',
        description: 'Time slot updated successfully'
      });
      
      setEditMode(null);
      fetchTimeSlots();
    } catch (error) {
      console.error('Error updating time slot:', error);
      toast({
        title: 'Error',
        description: 'Failed to update time slot',
        variant: 'destructive'
      });
    }
  };
  
  const handleDeleteTimeSlot = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this time slot?')) return;
    
    try {
      await TimeSlotService.deleteTimeSlotConfig(id);
      
      toast({
        title: 'Success',
        description: 'Time slot deleted successfully'
      });
      
      // Remove from local state
      setTimeSlots(prev => prev.filter(slot => slot.id !== id));
    } catch (error) {
      console.error('Error deleting time slot:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete time slot',
        variant: 'destructive'
      });
    }
  };
  
  const handleEditField = (id: string, field: keyof TimeSlotConfig, value: any) => {
    setTimeSlots(prev => 
      prev.map(slot => 
        slot.id === id 
          ? { ...slot, [field]: field === 'dayOfWeek' ? parseInt(value as string) : value }
          : slot
      )
    );
  };
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        <Card className="p-4 bg-gray-50">
          <h3 className="text-lg font-medium mb-4">Add New Time Slot</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div>
              <Label htmlFor="dayOfWeek">Day of Week</Label>
              <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                <SelectTrigger id="dayOfWeek">
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map((day) => (
                    <SelectItem key={day.value} value={day.value}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="maxPatients">Max Patients</Label>
              <Input
                id="maxPatients"
                type="number"
                min="1"
                value={maxPatients}
                onChange={(e) => setMaxPatients(parseInt(e.target.value))}
              />
            </div>
            
            <div>
              <Label htmlFor="minutesPerPatient">Minutes Per Patient</Label>
              <Input
                id="minutesPerPatient"
                type="number"
                min="5"
                value={minutesPerPatient}
                onChange={(e) => setMinutesPerPatient(parseInt(e.target.value))}
              />
            </div>
            
            <div className="flex items-end">
              <Button onClick={handleAddTimeSlot} className="w-full">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Slot
              </Button>
            </div>
          </div>
        </Card>
      </div>
      
      <div>
        <h3 className="text-lg font-medium mb-4">Current Time Slots</h3>
        
        {isLoading ? (
          <p>Loading time slots...</p>
        ) : timeSlots.length === 0 ? (
          <p className="text-center py-8 text-gray-500">No time slots configured yet</p>
        ) : (
          <div className="space-y-4">
            {timeSlots.map((slot) => (
              <Card key={slot.id} className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                  <div>
                    <Label>Day of Week</Label>
                    {editMode === slot.id ? (
                      <Select 
                        value={String(slot.dayOfWeek)} 
                        onValueChange={(value) => handleEditField(slot.id, 'dayOfWeek', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select day" />
                        </SelectTrigger>
                        <SelectContent>
                          {DAYS_OF_WEEK.map((day) => (
                            <SelectItem key={day.value} value={day.value}>
                              {day.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="mt-1">{DAYS_OF_WEEK.find(d => d.value === String(slot.dayOfWeek))?.label}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label>Start Time</Label>
                    {editMode === slot.id ? (
                      <Input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) => handleEditField(slot.id, 'startTime', e.target.value)}
                      />
                    ) : (
                      <p className="mt-1">{slot.startTime}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label>End Time</Label>
                    {editMode === slot.id ? (
                      <Input
                        type="time"
                        value={slot.endTime}
                        onChange={(e) => handleEditField(slot.id, 'endTime', e.target.value)}
                      />
                    ) : (
                      <p className="mt-1">{slot.endTime}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label>Max Patients</Label>
                    {editMode === slot.id ? (
                      <Input
                        type="number"
                        min="1"
                        value={slot.maxPatients}
                        onChange={(e) => handleEditField(slot.id, 'maxPatients', parseInt(e.target.value))}
                      />
                    ) : (
                      <p className="mt-1">{slot.maxPatients}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label>Minutes Per Patient</Label>
                    {editMode === slot.id ? (
                      <Input
                        type="number"
                        min="5"
                        value={slot.minutesPerPatient || 15}
                        onChange={(e) => handleEditField(slot.id, 'minutesPerPatient', parseInt(e.target.value))}
                      />
                    ) : (
                      <p className="mt-1">{slot.minutesPerPatient || 15}</p>
                    )}
                  </div>
                  
                  <div className="flex items-end space-x-2">
                    {editMode === slot.id ? (
                      <Button 
                        variant="default" 
                        className="flex-1"
                        onClick={() => handleUpdateTimeSlot(slot.id)}
                      >
                        <Save className="mr-2 h-4 w-4" /> Save
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => setEditMode(slot.id)}
                      >
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </Button>
                    )}
                    <Button 
                      variant="destructive" 
                      onClick={() => handleDeleteTimeSlot(slot.id)}
                    >
                      <Trash2 className="h-4 w-4" />
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

export default TimeSlotScheduler;
