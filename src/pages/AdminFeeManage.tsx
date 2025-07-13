import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TimeSlotService, DoctorDispensaryFee } from '@/api/services/TimeSlotService';
import { DoctorService } from '@/api/services/DoctorService';
import { DispensaryService } from '@/api/services/DispensaryService';
import { Dispensary } from '@/api/models';
import { toast } from 'react-toastify';
import Header from '@/components/Header';

const AdminFeeManage: React.FC = () => {
  const [fees, setFees] = useState<DoctorDispensaryFee[]>([]);
  const [dispensaries, setDispensaries] = useState<Dispensary[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Add Fee form state
  const [form, setForm] = useState({
    doctorId: '',
    dispensaryId: '',
    doctorFee: '',
    dispensaryFee: '',
    bookingCommission: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        setDoctors(await DoctorService.getAllDoctors());
        // Don't load all dispensaries initially - only load when doctor is selected
        setDispensaries([]);
        setFees([]); // Clear fees initially
      } catch (error) {
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Load dispensaries when doctor is selected
  useEffect(() => {
    const fetchDoctorDispensaries = async () => {
      if (!form.doctorId) {
        setDispensaries([]);
        setFees([]);
        return;
      }
      
      try {
        setLoading(true);
        const doctorDispensaries = await DispensaryService.getDispensariesByDoctorId(form.doctorId);
        setDispensaries(doctorDispensaries);
        
        // Reset dispensary selection if current selection is not in the new list
        if (form.dispensaryId && !doctorDispensaries.some(d => d.id === form.dispensaryId)) {
          setForm(prev => ({ ...prev, dispensaryId: '' }));
        }
        
        // Load fees for the selected doctor
        if (doctorDispensaries.length > 0) {
          const doctorFees = await TimeSlotService.getDoctorDispensaryFees(doctorDispensaries[0].id);
          setFees(doctorFees);
        }
      } catch (error) {
        console.error('Error loading doctor dispensaries:', error);
        toast.error('Failed to load dispensaries for selected doctor');
        setDispensaries([]);
        setFees([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDoctorDispensaries();
  }, [form.doctorId]);

  const handleFormChange = (field: string, value: string) => {
    setForm(f => ({ ...f, [field]: value }));
  };

  const handleAddFee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await TimeSlotService.assignDoctorDispensaryFees(
        form.doctorId,
        form.dispensaryId,
        {
          doctorFee: Number(form.doctorFee),
          dispensaryFee: Number(form.dispensaryFee),
          bookingCommission: Number(form.bookingCommission),
        }
      );
      toast.success('Fee added successfully');
      setForm({
        doctorId: '',
        dispensaryId: '',
        doctorFee: '',
        dispensaryFee: '',
        bookingCommission: '',
      });
      // Refresh the fees list
      if (form.dispensaryId) {
        setFees(await TimeSlotService.getDoctorDispensaryFees(form.dispensaryId));
      }
    } catch (error) {
      toast.error('Failed to add fee');
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8 flex-grow">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Add Doctor-Dispensary Fee</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddFee} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <Label>Doctor</Label>
                <Select
                  value={form.doctorId}
                  onValueChange={val => handleFormChange('doctorId', val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map(doc => (
                      <SelectItem key={doc.id} value={doc.id}>{doc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Dispensary</Label>
                <Select
                  value={form.dispensaryId}
                  onValueChange={val => handleFormChange('dispensaryId', val)}
                  disabled={!form.doctorId || dispensaries.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={!form.doctorId ? "Select Doctor First" : dispensaries.length === 0 ? "No Dispensaries Available" : "Select Dispensary"} />
                  </SelectTrigger>
                  <SelectContent>
                    {dispensaries.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Doctor Fee</Label>
                <Input
                  type="number"
                  value={form.doctorFee}
                  onChange={e => handleFormChange('doctorFee', e.target.value)}
                />
              </div>
              <div>
                <Label>Dispensary Fee</Label>
                <Input
                  type="number"
                  value={form.dispensaryFee}
                  onChange={e => handleFormChange('dispensaryFee', e.target.value)}
                />
              </div>
              <div>
                <Label>Booking Commission</Label>
                <Input
                  type="number"
                  value={form.bookingCommission}
                  onChange={e => handleFormChange('bookingCommission', e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="submit"
                  disabled={
                    !form.doctorId ||
                    !form.dispensaryId ||
                    !form.doctorFee ||
                    !form.dispensaryFee ||
                    !form.bookingCommission ||
                    loading
                  }
                >
                  {loading ? 'Adding...' : 'Add Fee'}
                </Button>
              </div>
            </form>
            
            {/* Display existing fees */}
            {fees.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Existing Fees</h3>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHead>Doctor</TableHead>
                      <TableHead>Dispensary</TableHead>
                      <TableHead>Doctor Fee</TableHead>
                      <TableHead>Dispensary Fee</TableHead>
                      <TableHead>Booking Commission</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {fees.map((fee) => (
                      <TableRow key={fee._id}>
                    <TableCell>{fee.doctorName || '-'}</TableCell>
                    <TableCell>{fee.dispensaryName || '-'}</TableCell>
                    <TableCell>{fee.doctorFee != null ? `$${fee.doctorFee}` : '-'}</TableCell>
                    <TableCell>{fee.dispensaryFee != null ? `$${fee.dispensaryFee}` : '-'}</TableCell>
                    <TableCell>{fee.bookingCommission != null ? `$${fee.bookingCommission}` : '-'}</TableCell>
                        <TableCell>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={async () => {
                              try {
                                await TimeSlotService.deleteDoctorDispensaryFees(fee.doctorId, fee.dispensaryId);
                                toast.success('Fee deleted successfully');
                                // Refresh the list
                                if (form.dispensaryId) {
                                  setFees(await TimeSlotService.getDoctorDispensaryFees(form.dispensaryId));
                                }
                              } catch (error) {
                                toast.error('Failed to delete fee');
                              }
                            }}
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminFeeManage;
