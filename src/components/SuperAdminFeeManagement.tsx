import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableRow, TableHeader } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'react-toastify';
import { Pencil, Loader2, Building2 } from 'lucide-react';
import { API_BASE_URL } from '@/config';

interface Dispensary {
  _id: string;
  name: string;
  address: string;
  bookingCommission?: number;
  channelPartnerFee?: number;
}

const SuperAdminFeeManagement: React.FC = () => {
  const [dispensaries, setDispensaries] = useState<Dispensary[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Update modal state
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateDispensaryId, setUpdateDispensaryId] = useState<string>('');
  const [updateForm, setUpdateForm] = useState({
    onlineFee: '',
    channelPartnerFee: ''
  });

  useEffect(() => {
    loadDispensaries();
  }, []);

  const loadDispensaries = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/dispensaries`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setDispensaries(data);
    } catch (error: any) {
      console.error('Error loading dispensaries:', error);
      toast.error(`Failed to load dispensaries: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateClick = (dispensary: Dispensary) => {
    setUpdateDispensaryId(dispensary._id);
    setUpdateForm({
      onlineFee: (dispensary.bookingCommission || 0).toString(),
      channelPartnerFee: (dispensary.channelPartnerFee || 0).toString(),
    });
    setShowUpdateModal(true);
  };

  const handleUpdateSubmit = async () => {
    if (!updateDispensaryId) {
      toast.error('Invalid dispensary selected'); return;
    }
    if (!updateForm.onlineFee) {
      toast.error('Please enter online fee (Booking Commission)'); return;
    }

    try {
      setLoading(true);
      
      const requestData = {
        onlineFee: parseFloat(updateForm.onlineFee),
        channelPartnerFee: parseFloat(updateForm.channelPartnerFee || '0'),
      };
      
      const response = await fetch(`${API_BASE_URL}/api/fees/dispensary-fees/${updateDispensaryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Best practice if needed
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      toast.success('Dispensary global fees updated and cascaded successfully');
      setShowUpdateModal(false);
      setUpdateDispensaryId('');
      
      // Reload dispensaries visually
      await loadDispensaries();
      
    } catch (error: any) {
      console.error('Error updating fee:', error);
      toast.error(`Failed to update fee: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Building2 className="h-6 w-6 text-medicalBlue-600" />
            Global Dispensary Fees
          </CardTitle>
          <p className="text-sm text-gray-500">
            Set the Online Fee (Booking Commission) and Channel Partner Fee per dispensary. These fees will automatically apply to all doctors associated with the selected dispensary.
          </p>
        </CardHeader>
        <CardContent>
          {loading && dispensaries.length === 0 ? (
            <div className="flex justify-center items-center py-12 text-gray-500">
              <Loader2 className="h-8 w-8 animate-spin mr-2" />
              Loading dispensaries...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Dispensary Name</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead className="text-right font-medium">Online Fee (Commission)</TableHead>
                    <TableHead className="text-right font-medium">Channel Partner Fee</TableHead>
                    <TableHead className="text-center font-medium">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dispensaries.map((dispensary) => (
                    <TableRow key={dispensary._id} className="hover:bg-gray-50/50">
                      <TableCell className="font-semibold text-gray-900">{dispensary.name}</TableCell>
                      <TableCell className="text-sm text-gray-600">{dispensary.address}</TableCell>
                      <TableCell className="text-right font-mono text-blue-600 font-bold">
                        Rs {dispensary.bookingCommission || 0}
                      </TableCell>
                      <TableCell className="text-right font-mono text-teal-600 font-bold">
                        Rs {dispensary.channelPartnerFee || 0}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateClick(dispensary)}
                          disabled={loading}
                          className="hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors"
                        >
                          <Pencil className="h-4 w-4 mr-1" /> Edit Fees
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {dispensaries.length === 0 && !loading && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        No dispensaries found in the system.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Update Modal */}
      <Dialog open={showUpdateModal} onOpenChange={(open) => !loading && setShowUpdateModal(open)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Global Fees</DialogTitle>
            <p className="text-sm text-gray-500 mt-1">
              Updating these fees will cascade to all doctor configurations in this dispensary.
            </p>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="update-online-fee" className="font-semibold">Online Fee (Rs)</Label>
              <Input
                id="update-online-fee"
                type="number"
                min="0"
                step="0.01"
                value={updateForm.onlineFee}
                onChange={(e) => setUpdateForm(prev => ({ ...prev, onlineFee: e.target.value }))}
                disabled={loading}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="update-channel-partner-fee" className="font-semibold">Channel Partner Fee (Rs)</Label>
              <Input
                id="update-channel-partner-fee"
                type="number"
                min="0"
                step="0.01"
                value={updateForm.channelPartnerFee}
                onChange={(e) => setUpdateForm(prev => ({ ...prev, channelPartnerFee: e.target.value }))}
                placeholder="Optional"
                disabled={loading}
                className="font-mono"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpdateModal(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleUpdateSubmit} disabled={loading} className="bg-medicalBlue-600 hover:bg-medicalBlue-700 text-white">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperAdminFeeManagement;
