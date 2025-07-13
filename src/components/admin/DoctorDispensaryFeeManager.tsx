// import React, { useState, useEffect } from 'react';
// import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
// import { Table, TableBody, TableCell, TableHead, TableRow } from '@/components/ui/table';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { Button } from '@/components/ui/button';
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { TimeSlotService, TimeSlotFees, DoctorDispensaryFee, Dispensary } from '@/api/services/TimeSlotService';
// import { toast } from 'react-toastify';
// import { Edit, Trash2 } from 'lucide-react';
// import { DoctorService } from '@/api/services/DoctorService';

// const DoctorDispensaryFeeManager: React.FC = () => {
//   const [fees, setFees] = useState<DoctorDispensaryFee[]>([]);
//   const [selectedDispensaryId, setSelectedDispensaryId] = useState<string>('');
//   const [dispensaries, setDispensaries] = useState<Dispensary[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
//   const [selectedFee, setSelectedFee] = useState<{
//     doctorId: string;
//     dispensaryId: string;
//     fees: TimeSlotFees;
//   } | null>(null);
//   const [addDialogOpen, setAddDialogOpen] = useState(false);
//   const [newFee, setNewFee] = useState({
//     doctorId: '',
//     dispensaryId: '',
//     doctorFee: '',
//     dispensaryFee: '',
//     bookingCommission: '',
//   });
//   const [allDoctors, setAllDoctors] = useState<Doctor[]>([]);
//   const [allDispensaries, setAllDispensaries] = useState<Dispensary[]>([]);

//   // Fetch dispensaries on component mount
//   useEffect(() => {
//     const fetchDispensaries = async () => {
//       try {
//         const dispensaries = await TimeSlotService.getAllDispensaries();
//         setDispensaries(dispensaries);
//       } catch (error) {
//         console.error('Error fetching dispensaries:', error);
//         toast.error('Failed to fetch dispensaries');
//       }
//     };
//     fetchDispensaries();
//   }, []);

//   // Fetch fees when dispensary is selected
//   useEffect(() => {
//     const fetchFees = async () => {
//       if (!selectedDispensaryId) return;
      
//       try {
//         setLoading(true);
//         setError(null);
//         console.log('Fetching fees for dispensary:', selectedDispensaryId);
//         const doctorDispensaryFees = await TimeSlotService.getDoctorDispensaryFees(selectedDispensaryId);
//         console.log('Received fees:', doctorDispensaryFees);
//         setFees(doctorDispensaryFees);
//       } catch (error) {
//         console.error('Error fetching fees:', error);
//         setError('Failed to fetch fees');
//         toast.error('Failed to fetch fees');
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchFees();
//   }, [selectedDispensaryId]);

//   useEffect(() => {
//     // Fetch all doctors and dispensaries for the add form
//     const fetchAll = async () => {
//       setAllDoctors(await DoctorService.getAllDoctors());
//       setAllDispensaries(await TimeSlotService.getAllDispensaries());
//     };
//     fetchAll();
//   }, []);

//   const handleEditFees = (fee: DoctorDispensaryFee) => {
//     setSelectedFee({
//       doctorId: fee.doctorId,
//       dispensaryId: fee.dispensaryId,
//       fees: {
//         doctorFee: fee.doctorFee,
//         dispensaryFee: fee.dispensaryFee,
//         bookingCommission: fee.bookingCommission
//       }
//     });
//     setIsEditDialogOpen(true);
//   };

//   const handleSaveFees = async (updatedFees: TimeSlotFees) => {
//     if (!selectedFee) return;

//     try {
//       await TimeSlotService.updateDoctorDispensaryFees(
//         selectedFee.doctorId,
//         selectedFee.dispensaryId,
//         updatedFees
//       );
//       toast.success('Fees updated successfully');
//       setIsEditDialogOpen(false);
//       // Refresh the fees list
//       const updatedFeesList = await TimeSlotService.getDoctorDispensaryFees(selectedDispensaryId);
//       setFees(updatedFeesList);
//     } catch (error) {
//       console.error('Error updating fees:', error);
//       toast.error('Failed to update fees');
//     }
//   };

//   const handleDeleteFees = async (doctorId: string, dispensaryId: string) => {
//     if (!window.confirm('Are you sure you want to reset these fees?')) return;

//     try {
//       await TimeSlotService.deleteDoctorDispensaryFees(doctorId, dispensaryId);
//       toast.success('Fees reset successfully');
//       // Refresh the fees list
//       const updatedFeesList = await TimeSlotService.getDoctorDispensaryFees(selectedDispensaryId);
//       setFees(updatedFeesList);
//     } catch (error) {
//       console.error('Error deleting fees:', error);
//       toast.error('Failed to reset fees');
//     }
//   };

//   const handleAddFee = async () => {
//     try {
//       await TimeSlotService.updateDoctorDispensaryFees(
//         newFee.doctorId,
//         newFee.dispensaryId,
//         {
//           doctorFee: Number(newFee.doctorFee),
//           dispensaryFee: Number(newFee.dispensaryFee),
//           bookingCommission: Number(newFee.bookingCommission),
//         }
//       );
//       toast.success('Fee added successfully');
//       setAddDialogOpen(false);
//       setNewFee({
//         doctorId: '',
//         dispensaryId: '',
//         doctorFee: '',
//         dispensaryFee: '',
//         bookingCommission: '',
//       });
//       // Refresh the list
//       if (selectedDispensaryId) {
//         const updatedFees = await TimeSlotService.getDoctorDispensaryFees(selectedDispensaryId);
//         setFees(updatedFees);
//       }
//     } catch (error) {
//       toast.error('Failed to add fee');
//     }
//   };

//   return (
//     <Card className="w-full">
//       <CardHeader>
//         <CardTitle>Fee Configurations</CardTitle>
//       </CardHeader>
//       <CardContent>
//         <div className="mb-6">
//           <Select
//             value={selectedDispensaryId}
//             onValueChange={(value) => {
//               console.log('Dispensary selected:', value);
//               setSelectedDispensaryId(value);
//             }}
//           >
//             <SelectTrigger className="w-[200px]">
//               <SelectValue placeholder="Select Dispensary" />
//             </SelectTrigger>
//             <SelectContent>
//               {dispensaries.map((dispensary) => (
//                 <SelectItem key={dispensary._id} value={dispensary._id}>
//                   {dispensary.name}
//                 </SelectItem>
//               ))}
//             </SelectContent>
//           </Select>
//         </div>

//         <div className="mb-4 flex justify-end">
//           <Button onClick={() => setAddDialogOpen(true)}>Add Fee</Button>
//         </div>

//         {loading && <p>Loading...</p>}
//         {error && <p className="text-red-500">{error}</p>}
        
//         {!loading && !error && fees.length === 0 && (
//           <p className="text-muted-foreground">
//             No fees found for this dispensary. Please select a different dispensary or add fees.
//           </p>
//         )}

//         {fees.length > 0 && (
//           <div className="rounded-md border">
//             <Table className="table-fixed">
//               <TableHead>
//                 <TableRow>
//                   <TableCell className="w-[20%] font-semibold text-gray-900 align-middle py-3 px-4">Doctor</TableCell>
//                   <TableCell className="w-[20%] font-semibold text-gray-900 align-middle py-3 px-4">Dispensary</TableCell>
//                   <TableCell className="w-[15%] font-semibold text-gray-900 align-middle py-3 px-4 text-right">Doctor Fee</TableCell>
//                   <TableCell className="w-[15%] font-semibold text-gray-900 align-middle py-3 px-4 text-right">Dispensary Fee</TableCell>
//                   <TableCell className="w-[15%] font-semibold text-gray-900 align-middle py-3 px-4 text-right">Booking Commission</TableCell>
//                   <TableCell className="w-[10%] font-semibold text-gray-900 align-middle py-3 px-4">Last Updated</TableCell>
//                   <TableCell className="w-[5%] font-semibold text-gray-900 align-middle py-3 px-4 text-center">Actions</TableCell>
//                 </TableRow>
//               </TableHead>
//               <TableBody>
//                 {fees.map((fee) => (
//                   <TableRow key={fee._id} className="hover:bg-gray-50">
//                     <TableCell className="w-[20%] font-normal text-gray-700 align-middle py-3 px-4">{fee.doctorName}</TableCell>
//                     <TableCell className="w-[20%] font-normal text-gray-700 align-middle py-3 px-4">{fee.dispensaryName}</TableCell>
//                     <TableCell className="w-[15%] font-normal text-gray-700 align-middle py-3 px-4 text-right">${fee.doctorFee || 0}</TableCell>
//                     <TableCell className="w-[15%] font-normal text-gray-700 align-middle py-3 px-4 text-right">${fee.dispensaryFee || 0}</TableCell>
//                     <TableCell className="w-[15%] font-normal text-gray-700 align-middle py-3 px-4 text-right">${fee.bookingCommission || 0}</TableCell>
//                     <TableCell className="w-[10%] font-normal text-gray-700 align-middle py-3 px-4">{new Date(fee.updatedAt).toLocaleDateString()}</TableCell>
//                     <TableCell className="w-[5%] align-middle py-3 px-4 text-center">
//                       <div className="flex justify-center items-center gap-2">
//                         <Button
//                           variant="ghost"
//                           size="icon"
//                           onClick={() => handleEditFees(fee)}
//                           className="h-8 w-8"
//                         >
//                           <Edit className="h-4 w-4" />
//                         </Button>
//                         <Button
//                           variant="ghost"
//                           size="icon"
//                           onClick={() => handleDeleteFees(fee.doctorId, fee.dispensaryId)}
//                           className="h-8 w-8 text-red-500 hover:text-red-700"
//                         >
//                           <Trash2 className="h-4 w-4" />
//                         </Button>
//                       </div>
//                     </TableCell>
//                   </TableRow>
//                 ))}
//               </TableBody>
//             </Table>
//           </div>
//         )}
//       </CardContent>

//       <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>Edit Fees</DialogTitle>
//           </DialogHeader>
//           {selectedFee && (
//             <div className="grid gap-4 py-4">
//               <div className="grid grid-cols-4 items-center gap-4">
//                 <Label htmlFor="doctorFee" className="text-right">
//                   Doctor Fee
//                 </Label>
//                 <Input
//                   id="doctorFee"
//                   type="number"
//                   defaultValue={selectedFee.fees.doctorFee}
//                   className="col-span-3"
//                   onChange={(e) => {
//                     setSelectedFee({
//                       ...selectedFee,
//                       fees: {
//                         ...selectedFee.fees,
//                         doctorFee: Number(e.target.value)
//                       }
//                     });
//                   }}
//                 />
//               </div>
//               <div className="grid grid-cols-4 items-center gap-4">
//                 <Label htmlFor="dispensaryFee" className="text-right">
//                   Dispensary Fee
//                 </Label>
//                 <Input
//                   id="dispensaryFee"
//                   type="number"
//                   defaultValue={selectedFee.fees.dispensaryFee}
//                   className="col-span-3"
//                   onChange={(e) => {
//                     setSelectedFee({
//                       ...selectedFee,
//                       fees: {
//                         ...selectedFee.fees,
//                         dispensaryFee: Number(e.target.value)
//                       }
//                     });
//                   }}
//                 />
//               </div>
//               <div className="grid grid-cols-4 items-center gap-4">
//                 <Label htmlFor="bookingCommission" className="text-right">
//                   Booking Commission
//                 </Label>
//                 <Input
//                   id="bookingCommission"
//                   type="number"
//                   defaultValue={selectedFee.fees.bookingCommission}
//                   className="col-span-3"
//                   onChange={(e) => {
//                     setSelectedFee({
//                       ...selectedFee,
//                       fees: {
//                         ...selectedFee.fees,
//                         bookingCommission: Number(e.target.value)
//                       }
//                     });
//                   }}
//                 />
//               </div>
//             </div>
//           )}
//           <DialogFooter>
//             <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
//               Cancel
//             </Button>
//             <Button
//               onClick={() => selectedFee && handleSaveFees(selectedFee.fees)}
//             >
//               Save Changes
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>Add Doctor-Dispensary Fee</DialogTitle>
//           </DialogHeader>
//           <div className="space-y-4">
//             <div>
//               <Label>Doctor</Label>
//               <Select
//                 value={newFee.doctorId}
//                 onValueChange={val => setNewFee(f => ({ ...f, doctorId: val }))}
//               >
//                 <SelectTrigger>
//                   <SelectValue placeholder="Select Doctor" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   {allDoctors.map(doc => (
//                     <SelectItem key={doc.id} value={doc.id}>{doc.name}</SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             </div>
//             <div>
//               <Label>Dispensary</Label>
//               <Select
//                 value={newFee.dispensaryId}
//                 onValueChange={val => setNewFee(f => ({ ...f, dispensaryId: val }))}
//               >
//                 <SelectTrigger>
//                   <SelectValue placeholder="Select Dispensary" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   {allDispensaries.map(d => (
//                     <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             </div>
//             <div>
//               <Label>Doctor Fee</Label>
//               <Input
//                 type="number"
//                 value={newFee.doctorFee}
//                 onChange={e => setNewFee(f => ({ ...f, doctorFee: e.target.value }))}
//               />
//             </div>
//             <div>
//               <Label>Dispensary Fee</Label>
//               <Input
//                 type="number"
//                 value={newFee.dispensaryFee}
//                 onChange={e => setNewFee(f => ({ ...f, dispensaryFee: e.target.value }))}
//               />
//             </div>
//             <div>
//               <Label>Booking Commission</Label>
//               <Input
//                 type="number"
//                 value={newFee.bookingCommission}
//                 onChange={e => setNewFee(f => ({ ...f, bookingCommission: e.target.value }))}
//               />
//             </div>
//           </div>
//           <DialogFooter>
//             <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
//               Cancel
//             </Button>
//             <Button onClick={handleAddFee} disabled={
//               !newFee.doctorId || !newFee.dispensaryId ||
//               !newFee.doctorFee || !newFee.dispensaryFee || !newFee.bookingCommission
//             }>
//               Add Fee
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </Card>
//   );
// };

// export default DoctorDispensaryFeeManager;
