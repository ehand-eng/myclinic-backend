import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableRow, TableHeader } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'react-toastify';
import { Pencil, Trash2, Plus, AlertCircle } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

interface Doctor {
  id: string;
  name: string;
  specialization: string;
}

interface Dispensary {
  id: string;
  name: string;
  address: string;
}

interface Fee {
  id: string;
  doctorId: string;
  dispensaryId: string;
  doctorFee: number;
  dispensaryFee: number;
  onlineFee: number;
  doctorName: string;
  dispensaryName: string;
  dispensaryAddress: string;
  createdAt: Date;
  updatedAt: Date;
}

interface FeeFormData {
  dispensaryId: string;
  doctorFee: string;
  dispensaryFee: string;
  onlineFee: string;
}

const FeeManagement: React.FC = () => {
  // Main state
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [dispensaries, setDispensaries] = useState<Dispensary[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Add fee form state
  const [addFeeForm, setAddFeeForm] = useState<FeeFormData>({
    dispensaryId: '',
    doctorFee: '',
    dispensaryFee: '',
    onlineFee: ''
  });

  // Update fee modal state
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateFeeId, setUpdateFeeId] = useState<string>('');
  const [updateFeeForm, setUpdateFeeForm] = useState<Omit<FeeFormData, 'dispensaryId'>>({
    doctorFee: '',
    dispensaryFee: '',
    onlineFee: ''
  });

  // Load doctors on component mount
  useEffect(() => {
    fetchDoctors();
  }, []);

  // Load dispensaries and fees when doctor is selected
  useEffect(() => {
    if (selectedDoctorId) {
      fetchDispensariesForDoctor(selectedDoctorId);
      fetchFeesForDoctor(selectedDoctorId);
    } else {
      setDispensaries([]);
      setFees([]);
      resetAddForm();
    }
  }, [selectedDoctorId]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`${API_BASE_URL}/api/doctors`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch doctors: ${response.status}`);
      }
      
      const data = await response.json();
      setDoctors(data);
    } catch (error: any) {
      console.error('Error fetching doctors:', error);
      setError(`Failed to load doctors: ${error.message}`);
      toast.error('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  const fetchDispensariesForDoctor = async (doctorId: string) => {
    try {
      setLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/api/dispensaries/${doctorId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch dispensaries: ${response.status}`);
      }
      
      const data = await response.json();
      setDispensaries(data);
    } catch (error: any) {
      console.error('Error fetching dispensaries:', error);
      setError(`Failed to load dispensaries: ${error.message}`);
      toast.error('Failed to load dispensaries');
      setDispensaries([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeesForDoctor = async (doctorId: string) => {
    try {
      setLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/api/doctor-dispensaries/fees/${doctorId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          // No fees found for this doctor - this is normal
          setFees([]);
          return;
        }
        throw new Error(`Failed to fetch fees: ${response.status}`);
      }
      
      const data = await response.json();
      setFees(data);
    } catch (error: any) {
      console.error('Error fetching fees:', error);
      setError(`Failed to load fees: ${error.message}`);
      toast.error('Failed to load fees');
      setFees([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDoctorChange = (doctorId: string) => {
    console.log('Doctor selected:', doctorId); // Debug log
    setSelectedDoctorId(doctorId);
    resetAddForm();
  };

  const resetAddForm = () => {
    setAddFeeForm({
      dispensaryId: '',
      doctorFee: '',
      dispensaryFee: '',
      onlineFee: ''
    });
  };

  const handleAddFeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDoctorId) {
      toast.error('Please select a doctor first');
      return;
    }
    
    if (!addFeeForm.dispensaryId) {
      toast.error('Please select a dispensary');
      return;
    }
    
    if (!addFeeForm.doctorFee || !addFeeForm.dispensaryFee || !addFeeForm.onlineFee) {
      toast.error('Please fill in all fee amounts');
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/api/doctor-dispensaries/fees/${selectedDoctorId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dispensaryId: addFeeForm.dispensaryId,
          doctorFee: parseFloat(addFeeForm.doctorFee),
          dispensaryFee: parseFloat(addFeeForm.dispensaryFee),
          onlineFee: parseFloat(addFeeForm.onlineFee),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create fee');
      }

      toast.success('Fee configuration created successfully');
      resetAddForm();
      await fetchFeesForDoctor(selectedDoctorId); // Refresh fees list
    } catch (error: any) {
      console.error('Error creating fee:', error);
      toast.error(error.message || 'Failed to create fee configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFee = (fee: Fee) => {
    setUpdateFeeId(fee.id);
    setUpdateFeeForm({
      doctorFee: fee.doctorFee.toString(),
      dispensaryFee: fee.dispensaryFee.toString(),
      onlineFee: fee.onlineFee.toString(),
    });
    setShowUpdateModal(true);
  };

  const handleUpdateFeeSubmit = async () => {
    if (!selectedDoctorId || !updateFeeId) {
      toast.error('Invalid update request');
      return;
    }
    
    if (!updateFeeForm.doctorFee || !updateFeeForm.dispensaryFee || !updateFeeForm.onlineFee) {
      toast.error('Please fill in all fee amounts');
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/api/doctor-dispensaries/fees/${selectedDoctorId}/${updateFeeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          doctorFee: parseFloat(updateFeeForm.doctorFee),
          dispensaryFee: parseFloat(updateFeeForm.dispensaryFee),
          onlineFee: parseFloat(updateFeeForm.onlineFee),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update fee');
      }

      toast.success('Fee configuration updated successfully');
      setShowUpdateModal(false);
      setUpdateFeeId('');
      await fetchFeesForDoctor(selectedDoctorId); // Refresh fees list
    } catch (error: any) {
      console.error('Error updating fee:', error);
      toast.error(error.message || 'Failed to update fee configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFee = async (feeId: string) => {
    if (!selectedDoctorId) {
      toast.error('Invalid delete request');
      return;
    }
    
    if (!confirm('Are you sure you want to delete this fee configuration?')) {
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/api/doctor-dispensaries/fees/${selectedDoctorId}/${feeId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to delete fee');
      }

      toast.success('Fee configuration deleted successfully');
      await fetchFeesForDoctor(selectedDoctorId); // Refresh fees list
    } catch (error: any) {
      console.error('Error deleting fee:', error);
      toast.error(error.message || 'Failed to delete fee configuration');
    } finally {
      setLoading(false);
    }
  };

  const selectedDoctor = doctors.find(d => d.id === selectedDoctorId);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Doctor-Dispensary Fee Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Doctor Selection */}
          <div className="mb-6">
            <Label htmlFor="doctor-select">Select Doctor</Label>
            <Select
              value={selectedDoctorId}
              onValueChange={handleDoctorChange}
              disabled={loading}
            >
              <SelectTrigger id="doctor-select">
                <SelectValue placeholder="Choose a doctor..." />
              </SelectTrigger>
              <SelectContent>
                {doctors.map((doctor) => (
                  <SelectItem key={doctor.id} value={doctor.id}>
                    {doctor.name} - {doctor.specialization}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedDoctor && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900">
                Managing fees for: {selectedDoctor.name} ({selectedDoctor.specialization})
              </h3>
              <p className="text-blue-700 text-sm">
                {dispensaries.length} dispensaries available, {fees.length} fee configurations found
              </p>
            </div>
          )}

          {/* Add Fee Form */}
          {selectedDoctorId && dispensaries.length > 0 && (
            <form onSubmit={handleAddFeeSubmit} className="mb-8 p-6 border rounded-lg bg-gray-50">
              <h3 className="text-lg font-semibold mb-4">Add New Fee Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dispensary-select">Dispensary</Label>
                  <Select
                    value={addFeeForm.dispensaryId}
                    onValueChange={(value) => setAddFeeForm(prev => ({ ...prev, dispensaryId: value }))}
                    disabled={loading}
                  >
                    <SelectTrigger id="dispensary-select">
                      <SelectValue placeholder="Select dispensary..." />
                    </SelectTrigger>
                    <SelectContent>
                      {dispensaries.map((dispensary) => (
                        <SelectItem key={dispensary.id} value={dispensary.id}>
                          {dispensary.name} - {dispensary.address}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="doctor-fee">Doctor Fee (Rs)</Label>
                  <Input
                    id="doctor-fee"
                    type="number"
                    min="0"
                    step="0.01"
                    value={addFeeForm.doctorFee}
                    onChange={(e) => setAddFeeForm(prev => ({ ...prev, doctorFee: e.target.value }))}
                    placeholder="Enter doctor fee"
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label htmlFor="dispensary-fee">Dispensary Fee (Rs)</Label>
                  <Input
                    id="dispensary-fee"
                    type="number"
                    min="0"
                    step="0.01"
                    value={addFeeForm.dispensaryFee}
                    onChange={(e) => setAddFeeForm(prev => ({ ...prev, dispensaryFee: e.target.value }))}
                    placeholder="Enter dispensary fee"
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label htmlFor="online-fee">Online Fee (Rs)</Label>
                  <Input
                    id="online-fee"
                    type="number"
                    min="0"
                    step="0.01"
                    value={addFeeForm.onlineFee}
                    onChange={(e) => setAddFeeForm(prev => ({ ...prev, onlineFee: e.target.value }))}
                    placeholder="Enter online fee"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="mt-4">
                <Button
                  type="submit"
                  disabled={
                    loading ||
                    !addFeeForm.dispensaryId ||
                    !addFeeForm.doctorFee ||
                    !addFeeForm.dispensaryFee ||
                    !addFeeForm.onlineFee
                  }
                  className="w-full md:w-auto"
                >
                  {loading ? 'Adding...' : 'Add Fee Configuration'}
                </Button>
              </div>
            </form>
          )}

          {/* Fee List */}
          {selectedDoctorId && (
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Existing Fee Configurations {fees.length > 0 && `(${fees.length})`}
              </h3>
              
              {fees.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No fee configurations found for this doctor.
                  {dispensaries.length > 0 && ' Use the form above to add one.'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-left">Dispensary</TableHead>
                        <TableHead className="text-left">Address</TableHead>
                        <TableHead className="text-right">Doctor Fee</TableHead>
                        <TableHead className="text-right">Dispensary Fee</TableHead>
                        <TableHead className="text-right">Online Fee</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fees.map((fee) => (
                        <TableRow key={fee.id}>
                          <TableCell className="font-medium">{fee.dispensaryName}</TableCell>
                          <TableCell className="text-sm text-gray-600">{fee.dispensaryAddress}</TableCell>
                          <TableCell className="text-right font-mono">Rs {fee.doctorFee}</TableCell>
                          <TableCell className="text-right font-mono">Rs {fee.dispensaryFee}</TableCell>
                          <TableCell className="text-right font-mono">Rs {fee.onlineFee}</TableCell>
                          <TableCell className="text-right font-mono font-semibold">
                            Rs {fee.doctorFee + fee.dispensaryFee + fee.onlineFee}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdateFee(fee)}
                                disabled={loading}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteFee(fee.id)}
                                disabled={loading}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}

          {!selectedDoctorId && (
            <div className="text-center py-8 text-gray-500">
              Please select a doctor to view and manage fee configurations.
            </div>
          )}

          {selectedDoctorId && dispensaries.length === 0 && !loading && (
            <div className="text-center py-8 text-yellow-600">
              No dispensaries found for this doctor.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Update Fee Modal */}
      <Dialog open={showUpdateModal} onOpenChange={setShowUpdateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Fee Configuration</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="update-doctor-fee">Doctor Fee (Rs)</Label>
              <Input
                id="update-doctor-fee"
                type="number"
                min="0"
                step="0.01"
                value={updateFeeForm.doctorFee}
                onChange={(e) => setUpdateFeeForm(prev => ({ ...prev, doctorFee: e.target.value }))}
                placeholder="Enter doctor fee"
                disabled={loading}
              />
            </div>
            <div>
              <Label htmlFor="update-dispensary-fee">Dispensary Fee (Rs)</Label>
              <Input
                id="update-dispensary-fee"
                type="number"
                min="0"
                step="0.01"
                value={updateFeeForm.dispensaryFee}
                onChange={(e) => setUpdateFeeForm(prev => ({ ...prev, dispensaryFee: e.target.value }))}
                placeholder="Enter dispensary fee"
                disabled={loading}
              />
            </div>
            <div>
              <Label htmlFor="update-online-fee">Online Fee (Rs)</Label>
              <Input
                id="update-online-fee"
                type="number"
                min="0"
                step="0.01"
                value={updateFeeForm.onlineFee}
                onChange={(e) => setUpdateFeeForm(prev => ({ ...prev, onlineFee: e.target.value }))}
                placeholder="Enter online fee"
                disabled={loading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowUpdateModal(false)} 
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateFeeSubmit} 
              disabled={
                loading || 
                !updateFeeForm.doctorFee || 
                !updateFeeForm.dispensaryFee || 
                !updateFeeForm.onlineFee
              }
            >
              {loading ? 'Updating...' : 'Update Fee'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FeeManagement;