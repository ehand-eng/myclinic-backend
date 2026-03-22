import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableRow, TableHeader } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'react-toastify';
import { Pencil, Trash2, Plus, AlertCircle, Loader2 } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

interface Doctor {
  _id: string;
  name: string;
  specialization: string;
}

interface Dispensary {
  _id: string;
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
  channelPartnerFee: number;
  doctorName: string;
  dispensaryName: string;
  dispensaryAddress: string;
}

const SimpleFeeManagement: React.FC = () => {
  // State
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [dispensaries, setDispensaries] = useState<Dispensary[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingDispensaries, setLoadingDispensaries] = useState(false);
  const [loadingFees, setLoadingFees] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [feeToDelete, setFeeToDelete] = useState<string | null>(null);

  // Form state
  const [feeForm, setFeeForm] = useState({
    dispensaryId: '',
    doctorFee: '',
    dispensaryFee: '',
    onlineFee: '',
    channelPartnerFee: ''
  });

  // Update modal state
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateFeeId, setUpdateFeeId] = useState<string>('');
  const [updateForm, setUpdateForm] = useState({
    doctorFee: '',
    dispensaryFee: '',
    onlineFee: '',
    channelPartnerFee: ''
  });

  // Load doctors when component mounts
  useEffect(() => {
    loadDoctors();
  }, []);

  // Backup useEffect to trigger API calls when selectedDoctorId changes
  useEffect(() => {
    console.log('🎯 useEffect triggered with selectedDoctorId:', selectedDoctorId);
    
    if (selectedDoctorId && selectedDoctorId !== '') {
      console.log('🔄 useEffect calling API functions for doctor:', selectedDoctorId);
      loadDispensariesForDoctor(selectedDoctorId);
      loadFeesForDoctor(selectedDoctorId);
    } else {
      console.log('⚠️ useEffect: No valid doctor ID');
      setDispensaries([]);
      setFees([]);
    }
  }, [selectedDoctorId]);

  const loadDoctors = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading doctors...');
      
      const response = await fetch(`${API_BASE_URL}/api/doctors`);
      console.log('📡 Doctors API response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Doctors loaded:', data);
      setDoctors(data);
    } catch (error: any) {
      console.error('❌ Error loading doctors:', error);
      toast.error(`Failed to load doctors: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // This function is called when doctor dropdown changes
  const handleDoctorSelect = (doctorId: string) => {
    console.log('🎯🎯🎯 HANDLE DOCTOR SELECT CALLED WITH:', doctorId);
    console.log('🎯 Current state - selectedDoctorId:', selectedDoctorId);
    console.log('🎯 Doctors available:', doctors.map(d => d._id));
    
    // Update selected doctor ID FIRST
    setSelectedDoctorId(doctorId);
    console.log('✅ Updated selectedDoctorId to:', doctorId);
    
    // Clear previous data
    setDispensaries([]);
    setFees([]);
    setFeeForm({
      dispensaryId: '',
      doctorFee: '',
      dispensaryFee: '',
      onlineFee: '',
      channelPartnerFee: ''
    });
    console.log('🧹 Cleared previous data');
    
    // If a doctor was selected, load their dispensaries and fees IMMEDIATELY
    if (doctorId && doctorId !== '' && doctorId !== 'undefined' && doctorId !== 'null') {
      console.log('🔄🔄🔄 TRIGGERING API CALLS FOR DOCTOR:', doctorId);
      
      // Call APIs immediately
      console.log('📞 Calling APIs immediately...');
      loadDispensariesForDoctor(doctorId);
      loadFeesForDoctor(doctorId);
      
      // Also use setTimeout as backup
      setTimeout(() => {
        console.log('⏰ Timeout backup - calling APIs again for doctor:', doctorId);
        loadDispensariesForDoctor(doctorId);
        loadFeesForDoctor(doctorId);
      }, 200);
    } else {
      console.log('⚠️⚠️⚠️ NO VALID DOCTOR ID, SKIPPING API CALLS');
      console.log('⚠️ doctorId value:', doctorId, 'type:', typeof doctorId);
    }
  };

  const loadDispensariesForDoctor = async (doctorId: string) => {
    try {
      setLoadingDispensaries(true);
      console.log(`🔄 Loading dispensaries for doctor ${doctorId}...`);
      
      const url = `${API_BASE_URL}/api/dispensaries/doctor/${doctorId}`;
      console.log('📡 Dispensaries API URL:', url);
      
      const response = await fetch(url);
      console.log('📡 Dispensaries API response status:', response.status);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log('⚠️ No dispensaries found for this doctor (404)');
          setDispensaries([]);
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Dispensaries loaded:', data);
      setDispensaries(data);
      
    } catch (error: any) {
      console.error('❌ Error loading dispensaries:', error);
      toast.error(`Failed to load dispensaries: ${error.message}`);
      setDispensaries([]);
    } finally {
      setLoadingDispensaries(false);
    }
  };

  const loadFeesForDoctor = async (doctorId: string) => {
    try {
      setLoadingFees(true);
      console.log(`🔄 Loading fees for doctor ${doctorId}...`);
      
      const url = `${API_BASE_URL}/api/fees/${doctorId}`;
      console.log('📡 Fees API URL:', url);
      
      const response = await fetch(url);
      console.log('📡 Fees API response status:', response.status);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log('⚠️ No fees found for this doctor (404)');
          setFees([]);
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Fees loaded:', data);
      setFees(data);
      
    } catch (error: any) {
      console.error('❌ Error loading fees:', error);
      // Don't show toast for fees as they may not exist yet
      setFees([]);
    } finally {
      setLoadingFees(false);
    }
  };

  const handleAddFee = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDoctorId || !feeForm.dispensaryId || !feeForm.doctorFee || !feeForm.dispensaryFee || !feeForm.onlineFee) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      const requestData = {
        dispensaryId: feeForm.dispensaryId,
        doctorFee: parseFloat(feeForm.doctorFee),
        dispensaryFee: parseFloat(feeForm.dispensaryFee),
        onlineFee: parseFloat(feeForm.onlineFee),
        channelPartnerFee: parseFloat(feeForm.channelPartnerFee) || 0,
      };
      
      console.log('📡 Creating fee:', requestData);
      
      const response = await fetch(`${API_BASE_URL}/api/fees/${selectedDoctorId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      toast.success('Fee created successfully');
      
      // Reset form
      setFeeForm({
        dispensaryId: '',
        doctorFee: '',
        dispensaryFee: '',
        onlineFee: '',
        channelPartnerFee: ''
      });
      
      // Reload fees
      await loadFeesForDoctor(selectedDoctorId);
      
    } catch (error: any) {
      console.error('❌ Error creating fee:', error);
      toast.error(`Failed to create fee: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFee = (fee: Fee) => {
    setUpdateFeeId(fee.id);
    setUpdateForm({
      doctorFee: fee.doctorFee.toString(),
      dispensaryFee: fee.dispensaryFee.toString(),
      onlineFee: fee.onlineFee.toString(),
      channelPartnerFee: (fee.channelPartnerFee || 0).toString(),
    });
    setShowUpdateModal(true);
  };

  const handleUpdateSubmit = async () => {
    if (!selectedDoctorId || !updateFeeId || !updateForm.doctorFee || !updateForm.dispensaryFee || !updateForm.onlineFee) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      const requestData = {
        doctorFee: parseFloat(updateForm.doctorFee),
        dispensaryFee: parseFloat(updateForm.dispensaryFee),
        onlineFee: parseFloat(updateForm.onlineFee),
        channelPartnerFee: parseFloat(updateForm.channelPartnerFee) || 0,
      };
      
      const response = await fetch(`${API_BASE_URL}/api/fees/${selectedDoctorId}/${updateFeeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      toast.success('Fee updated successfully');
      setShowUpdateModal(false);
      setUpdateFeeId('');
      
      // Reload fees
      await loadFeesForDoctor(selectedDoctorId);
      
    } catch (error: any) {
      console.error('❌ Error updating fee:', error);
      toast.error(`Failed to update fee: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFee = (feeId: string) => {
    if (!selectedDoctorId) return;
    setFeeToDelete(feeId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteFee = async () => {
    if (!feeToDelete || !selectedDoctorId) return;
    setDeleteDialogOpen(false);

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/api/fees/${selectedDoctorId}/${feeToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      toast.success('Fee deleted successfully');
      await loadFeesForDoctor(selectedDoctorId);
    } catch (error: any) {
      console.error('Error deleting fee:', error);
      toast.error(`Failed to delete fee: ${error.message}`);
    } finally {
      setLoading(false);
      setFeeToDelete(null);
    }
  };

  const selectedDoctor = doctors.find(d => d._id === selectedDoctorId);

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
          {/* Debug Info */}
          <div className="mb-4 p-3 bg-gray-100 rounded text-sm space-y-2">
            <div><strong>Debug Status:</strong></div>
            <div>• Doctors loaded: {doctors.length} ({doctors.map(d => `${d.name}(${d._id})`).join(', ')})</div>
            <div>• Selected Doctor ID: "{selectedDoctorId}" (type: {typeof selectedDoctorId})</div>
            <div>• Dispensaries: {dispensaries.length} | Fees: {fees.length}</div>
            <div>• Loading states: {loadingDispensaries ? 'Dispensaries' : ''} {loadingFees ? 'Fees' : ''}</div>
            
            {/* Manual Test Button */}
            {selectedDoctorId && (
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    console.log('🧪 MANUAL TEST: Calling APIs for doctor:', selectedDoctorId);
                    loadDispensariesForDoctor(selectedDoctorId);
                    loadFeesForDoctor(selectedDoctorId);
                  }}
                >
                  🧪 Test API Calls
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    console.log('🎯 MANUAL TEST: Simulating doctor select');
                    handleDoctorSelect(selectedDoctorId);
                  }}
                >
                  🎯 Test handleDoctorSelect
                </Button>
              </div>
            )}
          </div>

          {/* Doctor Selection */}
          <div className="mb-6">
            <Label htmlFor="doctor-select">Select Doctor</Label>
            <Select
              value={selectedDoctorId}
              onValueChange={(value) => {
                console.log('🎯🎯🎯 SELECT onValueChange triggered with value:', value);
                console.log('🎯 Type of value:', typeof value);
                console.log('🎯 Value === undefined:', value === undefined);
                console.log('🎯 Value === null:', value === null);
                console.log('🎯 Value === "":', value === '');
                
                handleDoctorSelect(value);
              }}
              disabled={loading}
            >
              <SelectTrigger id="doctor-select">
                <SelectValue placeholder="Choose a doctor..." />
              </SelectTrigger>
              <SelectContent>
                {doctors.map((doctor) => (
                  <SelectItem key={doctor._id} value={doctor._id}>
                    {doctor.name} - {doctor.specialization}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selected Doctor Info */}
          {selectedDoctor && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900">
                Managing fees for: {selectedDoctor.name} ({selectedDoctor.specialization})
              </h3>
              <div className="text-blue-700 text-sm mt-2">
                {loadingDispensaries ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading dispensaries...
                  </span>
                ) : loadingFees ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading fees...
                  </span>
                ) : (
                  <span>
                    {dispensaries.length} dispensaries available, {fees.length} fee configurations found
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Show dispensaries list for debugging */}
          {selectedDoctorId && dispensaries.length > 0 && (
            <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-800 mb-2">✅ Found Dispensaries:</h4>
              <ul className="text-sm text-green-700">
                {dispensaries.map((dispensary) => (
                  <li key={dispensary._id}>
                    • ID: {dispensary._id} - {dispensary.name} ({dispensary.address})
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Add Fee Form */}
          {selectedDoctorId && dispensaries.length > 0 && (
            <form onSubmit={handleAddFee} className="mb-8 p-6 border rounded-lg bg-gray-50">
              <h3 className="text-lg font-semibold mb-4">Add New Fee Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dispensary-select">Dispensary</Label>
                  <Select
                    value={feeForm.dispensaryId}
                    onValueChange={(value) => setFeeForm(prev => ({ ...prev, dispensaryId: value }))}
                    disabled={loading}
                  >
                    <SelectTrigger id="dispensary-select">
                      <SelectValue placeholder="Select dispensary..." />
                    </SelectTrigger>
                    <SelectContent>
                      {dispensaries.map((dispensary) => (
                        <SelectItem key={dispensary._id} value={dispensary._id}>
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
                    value={feeForm.doctorFee}
                    onChange={(e) => setFeeForm(prev => ({ ...prev, doctorFee: e.target.value }))}
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
                    value={feeForm.dispensaryFee}
                    onChange={(e) => setFeeForm(prev => ({ ...prev, dispensaryFee: e.target.value }))}
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
                    value={feeForm.onlineFee}
                    onChange={(e) => setFeeForm(prev => ({ ...prev, onlineFee: e.target.value }))}
                    placeholder="Enter online fee"
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label htmlFor="channel-partner-fee">Channel Partner Fee (Rs)</Label>
                  <Input
                    id="channel-partner-fee"
                    type="number"
                    min="0"
                    step="0.01"
                    value={feeForm.channelPartnerFee}
                    onChange={(e) => setFeeForm(prev => ({ ...prev, channelPartnerFee: e.target.value }))}
                    placeholder="Enter channel partner fee (optional)"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="mt-4">
                <Button
                  type="submit"
                  disabled={loading || !feeForm.dispensaryId || !feeForm.doctorFee || !feeForm.dispensaryFee || !feeForm.onlineFee}
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

          {/* No Dispensaries Message - only show if we're not loading and truly have none */}
          {selectedDoctorId && !loadingDispensaries && dispensaries.length === 0 && (
            <div className="text-center py-8 text-yellow-600 bg-yellow-50 rounded-lg border border-yellow-200">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
              <h3 className="font-semibold mb-2">No Dispensaries Found</h3>
              <p className="text-sm">
                No dispensaries are associated with Dr {selectedDoctor?.name}.
                Please ensure the doctor is assigned to at least one dispensary in the database.
              </p>
            </div>
          )}

          {/* Fees Table */}
          {selectedDoctorId && fees.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Existing Fee Configurations ({fees.length})
              </h3>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dispensary</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead className="text-right">Doctor Fee</TableHead>
                      <TableHead className="text-right">Dispensary Fee</TableHead>
                      <TableHead className="text-right">Online Fee</TableHead>
                      <TableHead className="text-right">Channel Partner Fee</TableHead>
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
                        <TableCell className="text-right font-mono">Rs {fee.channelPartnerFee || 0}</TableCell>
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
            </div>
          )}

          {/* Initial State Message */}
          {!selectedDoctorId && (
            <div className="text-center py-8 text-gray-500">
              Please select a doctor to view and manage fee configurations.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Update Modal */}
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
                value={updateForm.doctorFee}
                onChange={(e) => setUpdateForm(prev => ({ ...prev, doctorFee: e.target.value }))}
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
                value={updateForm.dispensaryFee}
                onChange={(e) => setUpdateForm(prev => ({ ...prev, dispensaryFee: e.target.value }))}
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
                value={updateForm.onlineFee}
                onChange={(e) => setUpdateForm(prev => ({ ...prev, onlineFee: e.target.value }))}
                disabled={loading}
              />
            </div>
            <div>
              <Label htmlFor="update-channel-partner-fee">Channel Partner Fee (Rs)</Label>
              <Input
                id="update-channel-partner-fee"
                type="number"
                min="0"
                step="0.01"
                value={updateForm.channelPartnerFee}
                onChange={(e) => setUpdateForm(prev => ({ ...prev, channelPartnerFee: e.target.value }))}
                placeholder="Optional"
                disabled={loading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpdateModal(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleUpdateSubmit} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Update Fee
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Fee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this fee? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteFee} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SimpleFeeManagement;