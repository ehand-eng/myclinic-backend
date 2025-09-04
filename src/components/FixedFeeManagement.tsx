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
import { Pencil, Trash2, Plus, AlertCircle, Loader2 } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  email?: string;
  contactNumber?: string;
}

interface Dispensary {
  id: string;
  name: string;
  address: string;
  contactNumber?: string;
  email?: string;
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
  doctorSpecialization?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface FeeFormData {
  dispensaryId: string;
  doctorFee: string;
  dispensaryFee: string;
  onlineFee: string;
}

const FixedFeeManagement: React.FC = () => {
  // Main state
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [dispensaries, setDispensaries] = useState<Dispensary[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Loading states for specific operations
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingDispensaries, setLoadingDispensaries] = useState(false);
  const [loadingFees, setLoadingFees] = useState(false);

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
      console.log('Doctor selected, loading data for:', selectedDoctorId);
      fetchDispensariesForDoctor(selectedDoctorId);
      fetchFeesForDoctor(selectedDoctorId);
    } else {
      console.log('No doctor selected, clearing data');
      setDispensaries([]);
      setFees([]);
      resetAddForm();
    }
  }, [selectedDoctorId]);

  const fetchDoctors = async () => {
    try {
      setLoadingDoctors(true);
      setError('');
      
      console.log('Fetching doctors from API...');
      const response = await fetch(`${API_BASE_URL}/api/doctors`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch doctors: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Doctors fetched successfully:', data);
      setDoctors(data);
    } catch (error: any) {
      console.error('Error fetching doctors:', error);
      const errorMessage = `Failed to load doctors: ${error.message}`;
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoadingDoctors(false);
    }
  };

  const fetchDispensariesForDoctor = async (doctorId: string) => {
    try {
      setLoadingDispensaries(true);
      
      console.log(`Fetching dispensaries for doctor ${doctorId}...`);
      const response = await fetch(`${API_BASE_URL}/api/dispensaries/${doctorId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log('No dispensaries found for this doctor');
          setDispensaries([]);
          return;
        }
        throw new Error(`Failed to fetch dispensaries: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Dispensaries fetched successfully:', data);
      setDispensaries(data);
      
      // Reset dispensary selection if the previously selected one is not in the new list
      if (addFeeForm.dispensaryId && !data.some((d: Dispensary) => d.id === addFeeForm.dispensaryId)) {
        setAddFeeForm(prev => ({ ...prev, dispensaryId: '' }));
      }
    } catch (error: any) {
      console.error('Error fetching dispensaries:', error);
      const errorMessage = `Failed to load dispensaries: ${error.message}`;
      setError(errorMessage);
      toast.error(errorMessage);
      setDispensaries([]);
    } finally {
      setLoadingDispensaries(false);
    }
  };

  const fetchFeesForDoctor = async (doctorId: string) => {
    try {
      setLoadingFees(true);
      
      console.log(`Fetching fees for doctor ${doctorId}...`);
      const response = await fetch(`${API_BASE_URL}/api/doctor-dispensaries/fees/${doctorId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log('No fees found for this doctor');
          setFees([]);
          return;
        }
        throw new Error(`Failed to fetch fees: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Fees fetched successfully:', data);
      setFees(data);
    } catch (error: any) {
      console.error('Error fetching fees:', error);
      // Don't show toast error for fees as it's optional data
      console.log('No fees found or error occurred, setting empty array');
      setFees([]);
    } finally {
      setLoadingFees(false);
    }
  };

  const handleDoctorChange = (doctorId: string) => {
    console.log('Doctor selection changed to:', doctorId);
    setSelectedDoctorId(doctorId);
    resetAddForm();
    setError(''); // Clear any previous errors
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
    
    console.log('Submitting add fee form...');
    
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
      
      const requestData = {
        dispensaryId: addFeeForm.dispensaryId,
        doctorFee: parseFloat(addFeeForm.doctorFee),
        dispensaryFee: parseFloat(addFeeForm.dispensaryFee),
        onlineFee: parseFloat(addFeeForm.onlineFee),
      };
      
      console.log('Sending request to create fee:', requestData);
      
      const response = await fetch(`${API_BASE_URL}/api/doctor-dispensaries/fees/${selectedDoctorId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();
      console.log('Create fee response:', result);

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
    console.log('Opening update modal for fee:', fee);
    setUpdateFeeId(fee.id);
    setUpdateFeeForm({
      doctorFee: fee.doctorFee.toString(),
      dispensaryFee: fee.dispensaryFee.toString(),
      onlineFee: fee.onlineFee.toString(),
    });
    setShowUpdateModal(true);
  };

  const handleUpdateFeeSubmit = async () => {
    console.log('Submitting update fee form...');
    
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
      
      const requestData = {
        doctorFee: parseFloat(updateFeeForm.doctorFee),
        dispensaryFee: parseFloat(updateFeeForm.dispensaryFee),
        onlineFee: parseFloat(updateFeeForm.onlineFee),
      };
      
      console.log('Sending request to update fee:', requestData);
      
      const response = await fetch(`${API_BASE_URL}/api/doctor-dispensaries/fees/${selectedDoctorId}/${updateFeeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();
      console.log('Update fee response:', result);

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
    console.log('Attempting to delete fee:', feeId);
    
    if (!selectedDoctorId) {
      toast.error('Invalid delete request');
      return;
    }
    
    if (!confirm('Are you sure you want to delete this fee configuration?')) {
      return;
    }

    try {
      setLoading(true);
      
      console.log(`Sending delete request for fee ${feeId}`);
      
      const response = await fetch(`${API_BASE_URL}/api/doctor-dispensaries/fees/${selectedDoctorId}/${feeId}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      console.log('Delete fee response:', result);

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
              disabled={loadingDoctors}
            >
              <SelectTrigger id="doctor-select">
                <SelectValue placeholder={loadingDoctors ? "Loading doctors..." : "Choose a doctor..."} />
              </SelectTrigger>
              <SelectContent>
                {doctors.map((doctor) => (
                  <SelectItem key={doctor.id} value={doctor.id}>
                    {doctor.name} - {doctor.specialization}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {loadingDoctors && (
              <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading doctors...
              </div>
            )}
          </div>

          {/* Doctor Information */}
          {selectedDoctor && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900">
                Managing fees for: {selectedDoctor.name} ({selectedDoctor.specialization})
              </h3>
              <div className="text-blue-700 text-sm mt-2">
                {loadingDispensaries && (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading dispensaries...
                  </div>
                )}
                {!loadingDispensaries && (
                  <div>
                    {dispensaries.length} dispensaries available
                    {loadingFees ? (
                      <span className="ml-2 flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Loading fees...
                      </span>
                    ) : (
                      <span>, {fees.length} fee configurations found</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Add Fee Form */}
          {selectedDoctorId && dispensaries.length > 0 && !loadingDispensaries && (
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
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Adding...
                    </>
                  ) : (
                    'Add Fee Configuration'
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* No dispensaries message */}
          {selectedDoctorId && !loadingDispensaries && dispensaries.length === 0 && (
            <div className="text-center py-8 text-yellow-600 bg-yellow-50 rounded-lg border border-yellow-200">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
              <h3 className="font-semibold mb-2">No Dispensaries Found</h3>
              <p className="text-sm">
                No dispensaries are associated with the selected doctor.
                Please ensure the doctor is assigned to at least one dispensary to manage fees.
              </p>
            </div>
          )}

          {/* Fee List */}
          {selectedDoctorId && !loadingFees && (
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

          {/* Loading fees message */}
          {loadingFees && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Loading fee configurations...
            </div>
          )}

          {/* Initial state message */}
          {!selectedDoctorId && (
            <div className="text-center py-8 text-gray-500">
              Please select a doctor to view and manage fee configurations.
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
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                'Update Fee'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FixedFeeManagement;