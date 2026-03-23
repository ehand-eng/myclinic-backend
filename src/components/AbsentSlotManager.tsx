
import { useState, useEffect } from 'react';
import { TimeSlotService } from '@/api/services';
import { AbsentTimeSlot } from '@/api/models';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { format, addDays, subDays } from 'date-fns';
import { CalendarClock, CalendarRange, Plus, Trash2, AlertTriangle } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface AbsentSlotManagerProps {
  doctorId: string;
  dispensaryId: string;
}

type EntryMode = 'absent' | 'dateRange' | 'modified';

const AbsentSlotManager = ({ doctorId, dispensaryId }: AbsentSlotManagerProps) => {
  const { toast } = useToast();
  const [absentSlots, setAbsentSlots] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [slotToDelete, setSlotToDelete] = useState<string | null>(null);

  // Entry mode state
  const [entryMode, setEntryMode] = useState<EntryMode>('absent');

  // Single date absent state
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(addDays(new Date(), 1));
  const [reason, setReason] = useState<string>('');

  // Modified session state - per-session editable overrides
  const [modifiedSessions, setModifiedSessions] = useState<Record<string, {
    selected: boolean;
    startTime: string;
    endTime: string;
    maxPatients: number;
  }>>({});

  // All time slot configs for doctor-dispensary pair
  const [timeSlotConfigs, setTimeSlotConfigs] = useState<any[]>([]);
  // Sessions available for the selected date (filtered by dayOfWeek)
  const [daySessions, setDaySessions] = useState<any[]>([]);
  // Selected session IDs (multi-select)
  const [selectedSessionIds, setSelectedSessionIds] = useState<Set<string>>(new Set());
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Date range state
  const [rangeStartDate, setRangeStartDate] = useState<Date | undefined>(addDays(new Date(), 1));
  const [rangeEndDate, setRangeEndDate] = useState<Date | undefined>(addDays(new Date(), 2));
  const [rangeReason, setRangeReason] = useState<string>('');

  // Conflict dialog state
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const [conflictingBookings, setConflictingBookings] = useState<any[]>([]);

  // Date range for fetching absent slots
  const [fetchStartDate] = useState<Date>(subDays(new Date(), 7));
  const [fetchEndDate] = useState<Date>(addDays(new Date(), 90));

  const fetchAbsentSlots = async () => {
    try {
      setIsLoading(true);
      const fetchedAbsentSlots = await TimeSlotService.getAbsentTimeSlots(
        doctorId,
        dispensaryId,
        fetchStartDate,
        fetchEndDate
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
  }, [doctorId, dispensaryId]);

  // Fetch all time slot configs
  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        const configs = await TimeSlotService.getTimeSlotConfigsByDoctor(doctorId, dispensaryId);
        setTimeSlotConfigs(configs);
      } catch (error) {
        console.error('Error fetching time slot configs:', error);
      }
    };
    fetchConfigs();
  }, [doctorId, dispensaryId]);

  // When date changes, filter sessions for that day's dayOfWeek
  useEffect(() => {
    if (!selectedDate || timeSlotConfigs.length === 0) {
      setDaySessions([]);
      setSelectedSessionIds(new Set());
      return;
    }
    const dayOfWeek = selectedDate.getDay();
    const sessionsForDay = timeSlotConfigs
      .filter((c: any) => c.dayOfWeek === dayOfWeek)
      .sort((a: any, b: any) => a.startTime.localeCompare(b.startTime));
    setDaySessions(sessionsForDay);
    setSelectedSessionIds(new Set());
    // Initialize modifiedSessions with current config values
    const mods: Record<string, any> = {};
    sessionsForDay.forEach((s: any) => {
      const id = s.id || s._id;
      mods[id] = {
        selected: false,
        startTime: s.startTime,
        endTime: s.endTime,
        maxPatients: s.maxPatients,
      };
    });
    setModifiedSessions(mods);
  }, [selectedDate, timeSlotConfigs]);

  const toggleSessionSelection = (configId: string) => {
    setSelectedSessionIds(prev => {
      const next = new Set(prev);
      if (next.has(configId)) {
        next.delete(configId);
      } else {
        next.add(configId);
      }
      return next;
    });
  };

  const toggleAllSessions = () => {
    if (selectedSessionIds.size === daySessions.length) {
      setSelectedSessionIds(new Set());
    } else {
      setSelectedSessionIds(new Set(daySessions.map((s: any) => s.id || s._id)));
    }
  };

  const handleMarkAbsent = async () => {
    if (!selectedDate) {
      toast({ title: 'Error', description: 'Please select a date', variant: 'destructive' });
      return;
    }
    if (daySessions.length > 0 && selectedSessionIds.size === 0) {
      toast({ title: 'Error', description: 'Please select at least one session', variant: 'destructive' });
      return;
    }

    setLoadingSessions(true);
    try {
      const allSelected = selectedSessionIds.size === daySessions.length;

      if (daySessions.length === 0 || allSelected) {
        // Mark entire day absent (no timeSlotConfigId)
        await TimeSlotService.addAbsentTimeSlot({
          doctorId,
          dispensaryId,
          date: selectedDate,
          startTime: daySessions.length > 0 ? daySessions[0].startTime : '00:00',
          endTime: daySessions.length > 0 ? daySessions[daySessions.length - 1].endTime : '23:59',
          reason,
          isModifiedSession: false,
        } as any);
      } else {
        // Mark selected sessions absent individually
        for (const configId of selectedSessionIds) {
          const config = daySessions.find((s: any) => (s.id || s._id) === configId);
          if (!config) continue;
          await TimeSlotService.addAbsentTimeSlot({
            doctorId,
            dispensaryId,
            date: selectedDate,
            startTime: config.startTime,
            endTime: config.endTime,
            reason,
            isModifiedSession: false,
            timeSlotConfigId: configId,
          } as any);
        }
      }

      toast({ title: 'Success', description: 'Absence marked successfully' });
      setReason('');
      setSelectedSessionIds(new Set());
      fetchAbsentSlots();
    } catch (error) {
      console.error('Error marking absent:', error);
      toast({ title: 'Error', description: 'Failed to mark absent', variant: 'destructive' });
    } finally {
      setLoadingSessions(false);
    }
  };

  const updateModifiedSession = (configId: string, field: string, value: any) => {
    setModifiedSessions(prev => ({
      ...prev,
      [configId]: { ...prev[configId], [field]: value }
    }));
  };

  const toggleModifiedSession = (configId: string) => {
    setModifiedSessions(prev => ({
      ...prev,
      [configId]: { ...prev[configId], selected: !prev[configId]?.selected }
    }));
  };

  const handleSaveModifiedSessions = async () => {
    if (!selectedDate) {
      toast({ title: 'Error', description: 'Please select a date', variant: 'destructive' });
      return;
    }

    const selected = Object.entries(modifiedSessions).filter(([_, v]) => v.selected);
    if (selected.length === 0) {
      toast({ title: 'Error', description: 'Please select at least one session to modify', variant: 'destructive' });
      return;
    }

    setLoadingSessions(true);
    try {
      for (const [configId, mod] of selected) {
        await TimeSlotService.addAbsentTimeSlot({
          doctorId,
          dispensaryId,
          date: selectedDate,
          startTime: mod.startTime,
          endTime: mod.endTime,
          reason,
          isModifiedSession: true,
          maxPatients: mod.maxPatients,
          timeSlotConfigId: configId,
        } as any);
      }

      toast({ title: 'Success', description: `${selected.length} modified session(s) saved successfully` });
      setReason('');
      fetchAbsentSlots();
    } catch (error) {
      console.error('Error saving modified sessions:', error);
      toast({ title: 'Error', description: 'Failed to save modified sessions', variant: 'destructive' });
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleAddDateRangeAbsence = async (force = false) => {
    if (!rangeStartDate || !rangeEndDate) {
      toast({
        title: 'Error',
        description: 'Please select both start and end dates',
        variant: 'destructive'
      });
      return;
    }

    if (rangeStartDate > rangeEndDate) {
      toast({
        title: 'Error',
        description: 'Start date must be before end date',
        variant: 'destructive'
      });
      return;
    }

    try {
      const startStr = format(rangeStartDate, 'yyyy-MM-dd');
      const endStr = format(rangeEndDate, 'yyyy-MM-dd');

      await TimeSlotService.createDateRangeAbsence({
        doctorId,
        dispensaryId,
        startDate: startStr,
        endDate: endStr,
        reason: rangeReason || undefined,
        force
      });

      toast({
        title: 'Success',
        description: 'Date range absence marked successfully'
      });

      setRangeReason('');
      setConflictDialogOpen(false);
      setConflictingBookings([]);
      fetchAbsentSlots();
    } catch (error: any) {
      if (error.response?.status === 409) {
        const data = error.response.data;
        if (data.requiresForce && data.conflictingBookings) {
          // Show conflict warning dialog
          setConflictingBookings(data.conflictingBookings);
          setConflictDialogOpen(true);
        } else if (data.overlappingAbsences) {
          toast({
            title: 'Overlap Detected',
            description: 'There are already absence records overlapping with this date range. Please delete them first.',
            variant: 'destructive'
          });
        } else {
          toast({
            title: 'Conflict',
            description: data.message || 'A conflict was detected',
            variant: 'destructive'
          });
        }
      } else {
        toast({
          title: 'Error',
          description: 'Failed to create date range absence',
          variant: 'destructive'
        });
      }
    }
  };

  const handleDeleteAbsentSlot = (id: string) => {
    setSlotToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteAbsentSlot = async () => {
    if (!slotToDelete) return;
    setDeleteDialogOpen(false);

    try {
      await TimeSlotService.deleteAbsentTimeSlot(slotToDelete);

      toast({
        title: 'Success',
        description: 'Absent slot deleted successfully'
      });

      setAbsentSlots(prev => prev.filter(slot => slot.id !== slotToDelete));
    } catch (error) {
      console.error('Error deleting absent slot:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete absent slot',
        variant: 'destructive'
      });
    } finally {
      setSlotToDelete(null);
    }
  };

  const getSortDate = (slot: any) => {
    if (slot.isDateRange && slot.startDate) return new Date(slot.startDate).getTime();
    if (slot.date) return new Date(slot.date).getTime();
    return 0;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        <Card className="p-4 bg-gray-50">
          <h3 className="text-lg font-medium mb-4">
            {entryMode === 'modified' ? 'Add Modified Session Schedule' :
             entryMode === 'dateRange' ? 'Add Date Range Absence' :
             'Add Absent Time Slot'}
          </h3>

          {/* Entry Type Selector */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              variant={entryMode === 'absent' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setEntryMode('absent')}
            >
              Mark Absent
            </Button>
            <Button
              variant={entryMode === 'dateRange' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setEntryMode('dateRange')}
            >
              <CalendarRange className="mr-2 h-4 w-4" />
              Date Range Absent
            </Button>
            <Button
              variant={entryMode === 'modified' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setEntryMode('modified')}
            >
              Modified Session
            </Button>
          </div>

          {/* Date Range Absence Form */}
          {entryMode === 'dateRange' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="mb-2 block">Start Date</Label>
                <Calendar
                  mode="single"
                  selected={rangeStartDate}
                  onSelect={setRangeStartDate}
                  className="border border-red-200 rounded-xl shadow-lg mt-2 w-full"
                  classNames={{
                    months: "flex flex-col w-full",
                    month: "space-y-4 w-full",
                    table: "w-full border-collapse space-y-1",
                    head_row: "flex w-full",
                    head_cell: "text-muted-foreground rounded-md flex-1 font-normal text-[0.8rem] text-center",
                    row: "flex w-full mt-2",
                    cell: "flex-1 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
                    day: "h-9 w-full p-0 font-normal aria-selected:opacity-100 rounded-lg hover:bg-accent hover:text-accent-foreground",
                    day_selected: "bg-red-600 text-white hover:bg-red-700 hover:text-white focus:bg-red-600 focus:text-white rounded-lg",
                    day_today: "bg-red-50 text-red-700 font-semibold rounded-lg",
                  }}
                  disabled={(date) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return date < today;
                  }}
                />
                <p className="text-sm text-gray-500 mt-2">
                  {rangeStartDate && `From: ${format(rangeStartDate, 'MMMM dd, yyyy')}`}
                </p>
              </div>
              <div>
                <Label className="mb-2 block">End Date</Label>
                <Calendar
                  mode="single"
                  selected={rangeEndDate}
                  onSelect={setRangeEndDate}
                  className="border border-red-200 rounded-xl shadow-lg mt-2 w-full"
                  classNames={{
                    months: "flex flex-col w-full",
                    month: "space-y-4 w-full",
                    table: "w-full border-collapse space-y-1",
                    head_row: "flex w-full",
                    head_cell: "text-muted-foreground rounded-md flex-1 font-normal text-[0.8rem] text-center",
                    row: "flex w-full mt-2",
                    cell: "flex-1 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
                    day: "h-9 w-full p-0 font-normal aria-selected:opacity-100 rounded-lg hover:bg-accent hover:text-accent-foreground",
                    day_selected: "bg-red-600 text-white hover:bg-red-700 hover:text-white focus:bg-red-600 focus:text-white rounded-lg",
                    day_today: "bg-red-50 text-red-700 font-semibold rounded-lg",
                  }}
                  disabled={(date) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return date < today || (rangeStartDate ? date < rangeStartDate : false);
                  }}
                />
                <p className="text-sm text-gray-500 mt-2">
                  {rangeEndDate && `To: ${format(rangeEndDate, 'MMMM dd, yyyy')}`}
                </p>
              </div>
              <div className="md:col-span-2 space-y-4">
                <div>
                  <Label htmlFor="rangeReason">Reason for Absence (Optional)</Label>
                  <Textarea
                    id="rangeReason"
                    value={rangeReason}
                    onChange={(e) => setRangeReason(e.target.value)}
                    placeholder="Why is the doctor absent for this period?"
                    className="mt-1"
                    rows={3}
                  />
                </div>
                <Button onClick={() => handleAddDateRangeAbsence(false)} className="w-full bg-red-600 hover:bg-red-700">
                  <CalendarRange className="mr-2 h-4 w-4" />
                  Mark Absent for Date Range
                </Button>
              </div>
            </div>
          )}

          {/* Single Date Absent Form */}
          {entryMode === 'absent' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Select Date</Label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="border border-red-200 rounded-xl shadow-lg mt-2 w-full"
                  classNames={{
                    months: "flex flex-col w-full",
                    month: "space-y-4 w-full",
                    table: "w-full border-collapse space-y-1",
                    head_row: "flex w-full",
                    head_cell: "text-muted-foreground rounded-md flex-1 font-normal text-[0.8rem] text-center",
                    row: "flex w-full mt-2",
                    cell: "flex-1 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
                    day: "h-9 w-full p-0 font-normal aria-selected:opacity-100 rounded-lg hover:bg-accent hover:text-accent-foreground",
                    day_selected: "bg-red-600 text-white hover:bg-red-700 hover:text-white focus:bg-red-600 focus:text-white rounded-lg",
                    day_today: "bg-red-50 text-red-700 font-semibold rounded-lg",
                  }}
                  disabled={(date) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return date < today;
                  }}
                />
                {selectedDate && (
                  <p className="text-sm text-gray-500 mt-2">
                    Selected: {format(selectedDate, 'EEEE, MMMM dd, yyyy')}
                  </p>
                )}
              </div>

              <div className="space-y-4">
                {/* Sessions for the selected day */}
                {selectedDate && (
                  <>
                    <Label className="font-semibold">Available Sessions</Label>
                    {daySessions.length === 0 ? (
                      <p className="text-sm text-gray-500 py-4">No sessions configured for this day.</p>
                    ) : (
                      <>
                        {/* Select All toggle */}
                        <button
                          onClick={toggleAllSessions}
                          className={`w-full p-3 rounded-lg border-2 text-left text-sm font-medium transition-all ${
                            selectedSessionIds.size === daySessions.length
                              ? 'border-red-500 bg-red-50 text-red-700'
                              : 'border-gray-200 hover:border-red-300 text-gray-600'
                          }`}
                        >
                          <div className="flex items-center">
                            <div className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center ${
                              selectedSessionIds.size === daySessions.length
                                ? 'border-red-500 bg-red-500'
                                : 'border-gray-300'
                            }`}>
                              {selectedSessionIds.size === daySessions.length && (
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            Select All Sessions (Entire Day)
                          </div>
                        </button>

                        {/* Individual sessions */}
                        <div className="space-y-2">
                          {daySessions.map((session: any) => {
                            const id = session.id || session._id;
                            const isSelected = selectedSessionIds.has(id);
                            return (
                              <button
                                key={id}
                                onClick={() => toggleSessionSelection(id)}
                                className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                                  isSelected
                                    ? 'border-red-500 bg-red-50'
                                    : 'border-gray-200 hover:border-red-300'
                                }`}
                              >
                                <div className="flex items-center">
                                  <div className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center ${
                                    isSelected ? 'border-red-500 bg-red-500' : 'border-gray-300'
                                  }`}>
                                    {isSelected && (
                                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                      </svg>
                                    )}
                                  </div>
                                  <div>
                                    <span className={`font-semibold ${isSelected ? 'text-red-700' : 'text-gray-700'}`}>
                                      {session.startTime} - {session.endTime}
                                    </span>
                                    <span className="text-xs text-gray-500 ml-2">
                                      ({session.maxPatients} patients max)
                                    </span>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}

                    <div>
                      <Label htmlFor="absentReason">Reason (Optional)</Label>
                      <Textarea
                        id="absentReason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Why is the doctor absent?"
                        className="mt-1"
                        rows={2}
                      />
                    </div>

                    <Button
                      onClick={handleMarkAbsent}
                      disabled={loadingSessions || (daySessions.length > 0 && selectedSessionIds.size === 0)}
                      className="w-full bg-red-600 hover:bg-red-700"
                    >
                      {loadingSessions ? 'Marking...' : (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          Mark Absent ({selectedSessionIds.size === daySessions.length ? 'Entire Day' : `${selectedSessionIds.size} Session${selectedSessionIds.size !== 1 ? 's' : ''}`})
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Modified Session Form */}
          {entryMode === 'modified' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Select Date</Label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="border border-amber-200 rounded-xl shadow-lg mt-2 w-full"
                  classNames={{
                    months: "flex flex-col w-full",
                    month: "space-y-4 w-full",
                    table: "w-full border-collapse space-y-1",
                    head_row: "flex w-full",
                    head_cell: "text-muted-foreground rounded-md flex-1 font-normal text-[0.8rem] text-center",
                    row: "flex w-full mt-2",
                    cell: "flex-1 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
                    day: "h-9 w-full p-0 font-normal aria-selected:opacity-100 rounded-lg hover:bg-accent hover:text-accent-foreground",
                    day_selected: "bg-amber-600 text-white hover:bg-amber-700 hover:text-white focus:bg-amber-600 focus:text-white rounded-lg",
                    day_today: "bg-amber-50 text-amber-700 font-semibold rounded-lg",
                  }}
                  disabled={(date) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return date < today;
                  }}
                />
                {selectedDate && (
                  <p className="text-sm text-gray-500 mt-2">
                    Selected: {format(selectedDate, 'EEEE, MMMM dd, yyyy')}
                  </p>
                )}
              </div>

              <div className="space-y-4">
                {selectedDate && (
                  <>
                    <Label className="font-semibold">Sessions - Edit & Select to Modify</Label>
                    {daySessions.length === 0 ? (
                      <p className="text-sm text-gray-500 py-4">No sessions configured for this day.</p>
                    ) : (
                      <div className="space-y-3">
                        {daySessions.map((session: any) => {
                          const id = session.id || session._id;
                          const mod = modifiedSessions[id];
                          if (!mod) return null;
                          return (
                            <div
                              key={id}
                              className={`rounded-xl border-2 transition-all ${
                                mod.selected
                                  ? 'border-amber-500 bg-amber-50'
                                  : 'border-gray-200'
                              }`}
                            >
                              {/* Session header with toggle */}
                              <button
                                onClick={() => toggleModifiedSession(id)}
                                className="w-full p-3 flex items-center text-left"
                              >
                                <div className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center flex-shrink-0 ${
                                  mod.selected ? 'border-amber-500 bg-amber-500' : 'border-gray-300'
                                }`}>
                                  {mod.selected && (
                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                                <div>
                                  <span className={`font-semibold ${mod.selected ? 'text-amber-700' : 'text-gray-700'}`}>
                                    {session.startTime} - {session.endTime}
                                  </span>
                                  <span className="text-xs text-gray-500 ml-2">
                                    (Original: {session.maxPatients} patients max)
                                  </span>
                                </div>
                              </button>

                              {/* Editable fields when selected */}
                              {mod.selected && (
                                <div className="px-3 pb-3 pt-1 border-t border-amber-200 space-y-3">
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <Label className="text-xs">Start Time</Label>
                                      <Input
                                        type="time"
                                        value={mod.startTime}
                                        onChange={(e) => updateModifiedSession(id, 'startTime', e.target.value)}
                                        className="mt-1 h-8 text-sm"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs">End Time</Label>
                                      <Input
                                        type="time"
                                        value={mod.endTime}
                                        onChange={(e) => updateModifiedSession(id, 'endTime', e.target.value)}
                                        className="mt-1 h-8 text-sm"
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-xs">Max Patients</Label>
                                    <Input
                                      type="number"
                                      min="1"
                                      value={mod.maxPatients || ''}
                                      onChange={(e) => updateModifiedSession(id, 'maxPatients', parseInt(e.target.value) || 0)}
                                      className="mt-1 h-8 text-sm"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div>
                      <Label htmlFor="modReason">Reason (Optional)</Label>
                      <Textarea
                        id="modReason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Why is the schedule modified?"
                        className="mt-1"
                        rows={2}
                      />
                    </div>

                    <Button
                      onClick={handleSaveModifiedSessions}
                      disabled={loadingSessions || !Object.values(modifiedSessions).some(m => m.selected)}
                      className="w-full bg-amber-600 hover:bg-amber-700"
                    >
                      {loadingSessions ? 'Saving...' : (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          Save Modified Session{Object.values(modifiedSessions).filter(m => m.selected).length !== 1 ? 's' : ''}
                          {' '}({Object.values(modifiedSessions).filter(m => m.selected).length})
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
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
            {[...absentSlots].sort((a, b) => getSortDate(a) - getSortDate(b)).map((slot) => (
              <Card key={slot.id || slot._id} className="p-4">
                <div className="flex flex-col md:flex-row justify-between">
                  <div className="flex-grow space-y-2">
                    <div className="flex items-start">
                      {slot.isDateRange ? (
                        <CalendarRange className="h-5 w-5 mr-2 text-red-500 mt-0.5" />
                      ) : (
                        <CalendarClock className="h-5 w-5 mr-2 text-gray-500 mt-0.5" />
                      )}
                      <div>
                        {slot.isDateRange ? (
                          <h4 className="font-medium text-red-700">
                            Date Range Absence: {format(new Date(slot.startDate), 'MMM dd, yyyy')} - {format(new Date(slot.endDate), 'MMM dd, yyyy')}
                          </h4>
                        ) : (
                          <>
                            <h4 className="font-medium">
                              {slot.isModifiedSession ? 'Modified Session:' : 'Absence:'} {format(new Date(slot.date), 'MMMM dd, yyyy')}
                            </h4>
                            {slot.startTime && slot.endTime && (
                              <p className="text-sm text-gray-600">
                                Time: {slot.startTime} - {slot.endTime}
                              </p>
                            )}
                          </>
                        )}
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
                      onClick={() => handleDeleteAbsentSlot(slot.id || slot._id)}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Absent Slot</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this absent time slot? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteAbsentSlot} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Booking Conflict Warning Dialog */}
      <AlertDialog open={conflictDialogOpen} onOpenChange={setConflictDialogOpen}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-amber-600">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Existing Bookings Found
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p className="mb-3">
                  There are <strong>{conflictingBookings.length}</strong> existing booking(s) in this date range.
                  The bookings will remain, but the dates will show as unavailable for new bookings.
                  Please contact patients to reschedule.
                </p>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {conflictingBookings.map((booking) => (
                    <div key={booking._id} className="p-2 bg-amber-50 rounded border border-amber-200 text-sm">
                      <p className="font-medium">{booking.patientName} - {booking.patientPhone}</p>
                      <p className="text-gray-600">
                        {format(new Date(booking.bookingDate), 'MMM dd, yyyy')} at {booking.estimatedTime} |
                        Apt #{booking.appointmentNumber} | {booking.transactionId}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleAddDateRangeAbsence(true)}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Proceed & Mark Absent
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AbsentSlotManager;
