// import React, { useState, useEffect } from 'react';
// import {
//   Box,
//   Container,
//   FormControl,
//   InputLabel,
//   MenuItem,
//   Select,
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   Typography,
//   Paper
// } from '@mui/material';
// import { TimeSlotService, TimeSlotConfig, Dispensary } from '@/api/services/TimeSlotService';
// import { toast } from 'react-toastify';

// const AdminTimeSlots: React.FC = () => {
//   const [timeSlots, setTimeSlots] = useState<TimeSlotConfig[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [selectedDispensaryId, setSelectedDispensaryId] = useState<string>('');
//   const [dispensaries, setDispensaries] = useState<Dispensary[]>([]);

//   useEffect(() => {
//     const fetchDispensaries = async () => {
//       try {
//         const dispensaries = await TimeSlotService.getAllDispensaries();
//         setDispensaries(dispensaries);
//       } catch (error) {
//         toast.error('Failed to fetch dispensaries');
//       }
//     };
//     fetchDispensaries();
//   }, []);

//   const fetchTimeSlots = async () => {
//     try {
//       setLoading(true);
//       setError(null);
//       const slots = await TimeSlotService.getTimeSlotConfigsByDispensary(selectedDispensaryId);
//       setTimeSlots(slots);
//     } catch (error) {
//       setError('Failed to fetch time slots');
//       toast.error('Failed to fetch time slots');
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (selectedDispensaryId) {
//       fetchTimeSlots();
//     }
//   }, [selectedDispensaryId]);

//   return (
//     <Container maxWidth="lg">
//       <Box sx={{ mb: 4 }}>
//         <Typography variant="h4" gutterBottom>
//           Time Slot Management
//         </Typography>
        
//         <FormControl fullWidth sx={{ mb: 2 }}>
//           <InputLabel>Select Dispensary</InputLabel>
//           <Select
//             value={selectedDispensaryId}
//             onChange={(e) => setSelectedDispensaryId(e.target.value)}
//             label="Select Dispensary"
//           >
//             {dispensaries.map((dispensary) => (
//               <MenuItem key={dispensary._id} value={dispensary._id}>
//                 {dispensary.name}
//               </MenuItem>
//             ))}
//           </Select>
//         </FormControl>

//         {loading && <Typography>Loading...</Typography>}
//         {error && <Typography color="error">{error}</Typography>}

//         <TableContainer component={Paper}>
//           <Table>
//             <TableHead>
//               <TableRow>
//                 <TableCell>Doctor</TableCell>
//                 <TableCell>Dispensary</TableCell>
//                 <TableCell>Minutes per Patient</TableCell>
//               </TableRow>
//             </TableHead>
//             <TableBody>
//               {timeSlots.map((slot) => (
//                 <TableRow key={slot.id}>
//                   <TableCell>{slot.doctorName}</TableCell>
//                   <TableCell>{slot.dispensaryName}</TableCell>
//                   <TableCell>{slot.minutesPerPatient}</TableCell>
//                 </TableRow>
//               ))}
//             </TableBody>
//           </Table>
//         </TableContainer>
//       </Box>
//     </Container>
//   );
// };

// export default AdminTimeSlots; 