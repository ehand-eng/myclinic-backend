
import { useState, useEffect, useMemo } from 'react';
import { TimeSlotService } from '@/api/services';
import { TimeSlotConfig } from '@/api/models';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { PlusCircle, Trash2, Save, Edit, Clock, Users, Timer } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const DAYS_OF_WEEK = [
  { value: '0', label: 'Sunday', short: 'Sun' },
  { value: '1', label: 'Monday', short: 'Mon' },
  { value: '2', label: 'Tuesday', short: 'Tue' },
  { value: '3', label: 'Wednesday', short: 'Wed' },
  { value: '4', label: 'Thursday', short: 'Thu' },
  { value: '5', label: 'Friday', short: 'Fri' },
  { value: '6', label: 'Saturday', short: 'Sat' },
];

interface TimeSlotSchedulerProps {
  doctorId: string;
  dispensaryId: string;
}

const TimeSlotScheduler = ({ doctorId, dispensaryId }: TimeSlotSchedulerProps) => {
  const { toast } = useToast();
  const [timeSlots, setTimeSlots] = useState<TimeSlotConfig[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [slotToDelete, setSlotToDelete] = useState<string | null>(null);
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
      toast({ title: 'Error', description: 'Failed to load time slots', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeSlots();
  }, [doctorId, dispensaryId]);

  // Group time slots by day of week
  const slotsByDay = useMemo(() => {
    const grouped: Record<number, TimeSlotConfig[]> = {};
    for (const slot of timeSlots) {
      if (!grouped[slot.dayOfWeek]) grouped[slot.dayOfWeek] = [];
      grouped[slot.dayOfWeek].push(slot);
    }
    // Sort sessions within each day by startTime
    for (const day in grouped) {
      grouped[day].sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    return grouped;
  }, [timeSlots]);

  // Days that have at least one slot, sorted Mon-Sun
  const activeDays = useMemo(() => {
    return Object.keys(slotsByDay)
      .map(Number)
      .sort((a, b) => {
        // Sort: Monday(1) first, Sunday(0) last
        const aSorted = a === 0 ? 7 : a;
        const bSorted = b === 0 ? 7 : b;
        return aSorted - bSorted;
      });
  }, [slotsByDay]);

  const handleAddTimeSlot = async () => {
    try {
      await TimeSlotService.addTimeSlotConfig({
        doctorId,
        dispensaryId,
        dayOfWeek: parseInt(dayOfWeek),
        startTime,
        endTime,
        maxPatients,
        minutesPerPatient
      });

      toast({ title: 'Success', description: 'Time slot added successfully' });

      setDayOfWeek('1');
      setStartTime('09:00');
      setEndTime('17:00');
      setMaxPatients(10);
      setMinutesPerPatient(15);
      fetchTimeSlots();
    } catch (error) {
      console.error('Error adding time slot:', error);
      toast({ title: 'Error', description: 'Failed to add time slot', variant: 'destructive' });
    }
  };

  const handleUpdateTimeSlot = async (id: string) => {
    try {
      const slotToUpdate = timeSlots.find(slot => slot.id === id);
      if (!slotToUpdate) return;

      await TimeSlotService.updateTimeSlotConfig(id, slotToUpdate);

      toast({ title: 'Success', description: 'Time slot updated successfully' });
      setEditMode(null);
      fetchTimeSlots();
    } catch (error) {
      console.error('Error updating time slot:', error);
      toast({ title: 'Error', description: 'Failed to update time slot', variant: 'destructive' });
    }
  };

  const handleDeleteTimeSlot = (id: string) => {
    setSlotToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteTimeSlot = async () => {
    if (!slotToDelete) return;
    setDeleteDialogOpen(false);

    try {
      await TimeSlotService.deleteTimeSlotConfig(slotToDelete);
      toast({ title: 'Success', description: 'Time slot deleted successfully' });
      setTimeSlots(prev => prev.filter(slot => slot.id !== slotToDelete));
    } catch (error) {
      console.error('Error deleting time slot:', error);
      toast({ title: 'Error', description: 'Failed to delete time slot', variant: 'destructive' });
    } finally {
      setSlotToDelete(null);
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
      {/* Add New Time Slot */}
      <Card className="p-4 bg-gray-50">
        <h3 className="text-lg font-medium mb-4">Add New Session</h3>
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
            <Input id="startTime" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="endTime">End Time</Label>
            <Input id="endTime" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="maxPatients">Max Patients</Label>
            <Input id="maxPatients" type="number" min="1" value={maxPatients} onChange={(e) => setMaxPatients(parseInt(e.target.value))} />
          </div>
          <div>
            <Label htmlFor="minutesPerPatient">Min/Patient</Label>
            <Input id="minutesPerPatient" type="number" min="5" value={minutesPerPatient} onChange={(e) => setMinutesPerPatient(parseInt(e.target.value))} />
          </div>
          <div className="flex items-end">
            <Button onClick={handleAddTimeSlot} className="w-full">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Session
            </Button>
          </div>
        </div>
      </Card>

      {/* Current Time Slots - Grouped by Day */}
      <div>
        <h3 className="text-lg font-medium mb-4">Weekly Schedule</h3>

        {isLoading ? (
          <p>Loading time slots...</p>
        ) : timeSlots.length === 0 ? (
          <p className="text-center py-8 text-gray-500">No sessions configured yet</p>
        ) : (
          <Accordion type="multiple" defaultValue={activeDays.map(String)} className="space-y-2">
            {activeDays.map((dayNum) => {
              const dayInfo = DAYS_OF_WEEK.find(d => d.value === String(dayNum));
              const daySessions = slotsByDay[dayNum] || [];
              const totalPatients = daySessions.reduce((sum, s) => sum + s.maxPatients, 0);

              return (
                <AccordionItem
                  key={dayNum}
                  value={String(dayNum)}
                  className="border rounded-xl overflow-hidden bg-white shadow-sm"
                >
                  <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-gray-50">
                    <div className="flex items-center gap-3 text-left">
                      <span className="font-semibold text-base text-gray-800">
                        {dayInfo?.label}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {daySessions.length} session{daySessions.length !== 1 ? 's' : ''}
                      </Badge>
                      <span className="text-xs text-gray-500 hidden sm:inline">
                        {totalPatients} total patients
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4">
                    <div className="space-y-3">
                      {daySessions.map((slot, idx) => (
                        <div
                          key={slot.id}
                          className={`p-4 rounded-lg border ${
                            editMode === slot.id ? 'border-blue-300 bg-blue-50' : 'border-gray-100 bg-gray-50'
                          }`}
                        >
                          {editMode === slot.id ? (
                            /* Edit Mode */
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div>
                                  <Label className="text-xs">Start Time</Label>
                                  <Input
                                    type="time"
                                    value={slot.startTime}
                                    onChange={(e) => handleEditField(slot.id, 'startTime', e.target.value)}
                                    className="mt-1 h-9"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">End Time</Label>
                                  <Input
                                    type="time"
                                    value={slot.endTime}
                                    onChange={(e) => handleEditField(slot.id, 'endTime', e.target.value)}
                                    className="mt-1 h-9"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Max Patients</Label>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={slot.maxPatients}
                                    onChange={(e) => handleEditField(slot.id, 'maxPatients', parseInt(e.target.value))}
                                    className="mt-1 h-9"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Min/Patient</Label>
                                  <Input
                                    type="number"
                                    min="5"
                                    value={slot.minutesPerPatient || 15}
                                    onChange={(e) => handleEditField(slot.id, 'minutesPerPatient', parseInt(e.target.value))}
                                    className="mt-1 h-9"
                                  />
                                </div>
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" size="sm" onClick={() => { setEditMode(null); fetchTimeSlots(); }}>
                                  Cancel
                                </Button>
                                <Button size="sm" onClick={() => handleUpdateTimeSlot(slot.id)}>
                                  <Save className="mr-1 h-3.5 w-3.5" /> Save
                                </Button>
                              </div>
                            </div>
                          ) : (
                            /* View Mode */
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 flex-wrap">
                                <div className="flex items-center gap-1.5">
                                  <Clock className="h-4 w-4 text-blue-600" />
                                  <span className="font-semibold text-gray-800">
                                    {slot.startTime} - {slot.endTime}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Users className="h-4 w-4 text-green-600" />
                                  <span className="text-sm text-gray-600">
                                    {slot.maxPatients} patients
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Timer className="h-4 w-4 text-orange-600" />
                                  <span className="text-sm text-gray-600">
                                    {slot.minutesPerPatient || 15} min each
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditMode(slot.id)}
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDeleteTimeSlot(slot.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Session</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this session? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteTimeSlot} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TimeSlotScheduler;
