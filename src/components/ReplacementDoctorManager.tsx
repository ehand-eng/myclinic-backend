import { useState, useEffect } from 'react';
import { DoctorService } from '@/api/services';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { UserCheck, Plus, Trash2, CalendarRange } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ReplacementDoctorManagerProps {
  doctorId: string;
  dispensaryId: string;
  doctorName: string;
  dispensaryName: string;
}

const ReplacementDoctorManager = ({ doctorId, dispensaryId, doctorName, dispensaryName }: ReplacementDoctorManagerProps) => {
  const { toast } = useToast();
  const [replacements, setReplacements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [idToDelete, setIdToDelete] = useState<string | null>(null);

  // Form state
  const [replacementName, setReplacementName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchReplacements = async () => {
    try {
      setIsLoading(true);
      const data = await DoctorService.getReplacements(doctorId, dispensaryId);
      setReplacements(data);
    } catch (error) {
      console.error('Error fetching replacements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReplacements();
  }, [doctorId, dispensaryId]);

  const handleCreate = async () => {
    if (!replacementName.trim() || !startDate || !endDate) {
      toast({ title: 'Error', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      await DoctorService.createReplacement(doctorId, dispensaryId, {
        replacementName: replacementName.trim(),
        startDate,
        endDate,
        reason: reason.trim() || undefined
      });

      toast({ title: 'Success', description: 'Replacement doctor added successfully' });
      setReplacementName('');
      setStartDate('');
      setEndDate('');
      setReason('');
      setShowForm(false);
      fetchReplacements();
    } catch (error: any) {
      if (error.response?.status === 409) {
        toast({ title: 'Overlap', description: 'There is already a replacement for this period', variant: 'destructive' });
      } else {
        toast({ title: 'Error', description: 'Failed to add replacement', variant: 'destructive' });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    setIdToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!idToDelete) return;
    setDeleteDialogOpen(false);
    try {
      await DoctorService.deleteReplacement(idToDelete);
      toast({ title: 'Success', description: 'Replacement removed' });
      setReplacements(prev => prev.filter(r => r._id !== idToDelete));
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to remove replacement', variant: 'destructive' });
    } finally {
      setIdToDelete(null);
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isActive = (r: any) => {
    const start = new Date(r.startDate);
    const end = new Date(r.endDate);
    end.setHours(23, 59, 59, 999);
    return start <= today && end >= today;
  };

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
          <UserCheck className="h-4 w-4" />
          Replacement Doctor
        </div>
        {!showForm && (
          <Button size="sm" variant="outline" onClick={() => setShowForm(true)} className="h-7 text-xs">
            <Plus className="h-3 w-3 mr-1" /> Add
          </Button>
        )}
      </div>

      {/* Add Form */}
      {showForm && (
        <Card className="p-3 bg-blue-50 border-blue-200 mb-3">
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Replacement Doctor Name *</Label>
              <Input
                value={replacementName}
                onChange={(e) => setReplacementName(e.target.value)}
                placeholder="e.g. Dr. Smith"
                className="mt-1 h-8 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">From *</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 h-8 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">To *</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  className="mt-1 h-8 text-sm"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Reason (optional)</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Doctor on leave"
                className="mt-1 text-sm"
                rows={2}
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleCreate} disabled={isSaving} className="h-7 text-xs">
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowForm(false)} className="h-7 text-xs">
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* List */}
      {isLoading ? (
        <p className="text-xs text-gray-400">Loading...</p>
      ) : replacements.length === 0 ? (
        <p className="text-xs text-gray-400 italic">No replacement doctors assigned</p>
      ) : (
        <div className="space-y-2">
          {replacements.map((r) => {
            const active = isActive(r);
            return (
              <div
                key={r._id}
                className={`flex items-center justify-between p-2 rounded-lg text-sm ${
                  active ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-100'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{r.replacementName}</span>
                    {active && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">Active</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <CalendarRange className="h-3 w-3" />
                    {format(new Date(r.startDate), 'MMM dd, yyyy')} - {format(new Date(r.endDate), 'MMM dd, yyyy')}
                  </div>
                  {r.reason && <p className="text-xs text-gray-400 mt-0.5 italic">{r.reason}</p>}
                </div>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(r._id)} className="h-7 w-7 p-0 text-red-500 hover:text-red-700">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Replacement</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this replacement doctor entry?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ReplacementDoctorManager;
