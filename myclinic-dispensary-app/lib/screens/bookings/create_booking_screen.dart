import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../config/theme.dart';
import '../../providers/auth_provider.dart';
import '../../services/booking_service.dart';
import '../../services/doctor_service.dart';
import '../../services/timeslot_service.dart';
import '../../models/doctor.dart';
import '../../models/time_slot.dart';

class CreateBookingScreen extends ConsumerStatefulWidget {
  const CreateBookingScreen({super.key});

  @override
  ConsumerState<CreateBookingScreen> createState() => _CreateBookingScreenState();
}

class _CreateBookingScreenState extends ConsumerState<CreateBookingScreen> {
  final _formKey = GlobalKey<FormState>();
  final _patientNameController = TextEditingController();
  final _patientPhoneController = TextEditingController();

  DateTime _selectedDate = DateTime.now();
  String? _selectedDoctorId;
  String? _selectedTimeSlot;
  String? _selectedConfigId;

  List<Doctor> _doctors = [];
  List<Session> _sessions = [];

  bool _isLoading = false;
  bool _isLoadingSessions = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadDoctors();
  }

  @override
  void dispose() {
    _patientNameController.dispose();
    _patientPhoneController.dispose();
    super.dispose();
  }

  Future<void> _loadDoctors() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    
    try {
      final auth = ref.read(authProvider);
      final dispensaryId = auth.selectedDispensary?.id;
      if (dispensaryId != null) {
        final doctors = await DoctorService().getDoctorsByDispensary(dispensaryId);
        setState(() {
          _doctors = doctors;
        });
      }
    } catch (e) {
      setState(() => _errorMessage = 'Failed to load doctors: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _loadSessions() async {
    if (_selectedDoctorId == null) return;
    
    setState(() {
      _isLoadingSessions = true;
      _selectedTimeSlot = null;
      _selectedConfigId = null;
      _sessions = [];
    });

    try {
      final auth = ref.read(authProvider);
      final dispensaryId = auth.selectedDispensary?.id;
      
      if (dispensaryId != null) {
        final dateStr = DateFormat('yyyy-MM-dd').format(_selectedDate);
        final sessions = await TimeSlotService().getSessions(_selectedDoctorId!, dispensaryId, dateStr);
        
        setState(() {
          _sessions = sessions;
        });
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to load slots: $e')),
      );
    } finally {
      if (mounted) setState(() => _isLoadingSessions = false);
    }
  }

  Future<void> _selectDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (picked != null && picked != _selectedDate) {
      setState(() => _selectedDate = picked);
      _loadSessions();
    }
  }

  Future<void> _submitBooking() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedDoctorId == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select a doctor')));
      return;
    }
    if (_selectedTimeSlot == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select a time slot')));
      return;
    }

    setState(() => _isLoading = true);

    try {
      final auth = ref.read(authProvider);
      final dispensaryId = auth.selectedDispensary?.id;
      
      if (dispensaryId == null) throw Exception('No dispensary selected');

      // The timeSlot is passed directly
      // Need to format date to ISO 8601 UTC just like web app, or native date string
      // Web passes: bookingDate: new Date(date).toISOString() but normalized to zero hour
      // Server normalizes it anyway
      final DateFormat formatter = DateFormat('yyyy-MM-dd');
      final String dateStr = formatter.format(_selectedDate);
      final String bookingDate = "${dateStr}T00:00:00.000Z";

      await BookingService().createBooking({
        'doctorId': _selectedDoctorId,
        'dispensaryId': dispensaryId,
        'bookingDate': bookingDate,
        'timeSlotConfigId': _selectedConfigId,
        'timeSlot': _selectedTimeSlot,
        'patientName': _patientNameController.text.trim(),
        'patientPhone': _patientPhoneController.text.trim(),
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Booking created successfully!'), backgroundColor: AppColors.success),
        );
        context.pop(true); // Return true to signal success and refresh list
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to book: $e'), backgroundColor: AppColors.error),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Book Appointment'),
      ),
      backgroundColor: AppColors.background,
      body: _isLoading && _doctors.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    if (_errorMessage != null)
                      Container(
                        padding: const EdgeInsets.all(12),
                        margin: const EdgeInsets.only(bottom: 16),
                        decoration: BoxDecoration(
                          color: AppColors.error.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: AppColors.error),
                        ),
                        child: Text(_errorMessage!, style: const TextStyle(color: AppColors.error)),
                      ),

                    // Doctor Selection
                    const Text('1. Select Doctor', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<String>(
                      isExpanded: true,
                      decoration: const InputDecoration(
                        labelText: 'Doctor',
                        prefixIcon: Icon(Icons.medical_services_outlined),
                      ),
                      value: _selectedDoctorId,
                      items: _doctors.map((doc) {
                        return DropdownMenuItem(
                          value: doc.id,
                          child: Text("${doc.name} - ${doc.specialization}"),
                        );
                      }).toList(),
                      onChanged: (val) {
                        setState(() => _selectedDoctorId = val);
                        _loadSessions();
                      },
                      validator: (v) => v == null ? 'Required' : null,
                    ),
                    const SizedBox(height: 24),

                    // Date Selection
                    const Text('2. Select Date', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    InkWell(
                      onTap: () => _selectDate(context),
                      child: InputDecorator(
                        decoration: const InputDecoration(
                          labelText: 'Appointment Date',
                          prefixIcon: Icon(Icons.calendar_today),
                        ),
                        child: Text(
                          DateFormat('MMM dd, yyyy').format(_selectedDate),
                          style: const TextStyle(fontSize: 16),
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Session/TimeSlot Selection
                    const Text('3. Select Time Slot', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    if (_selectedDoctorId == null)
                      const Text('Please select a doctor first.', style: TextStyle(color: AppColors.textSecondary))
                    else if (_isLoadingSessions)
                      const Center(child: Padding(padding: EdgeInsets.all(16), child: CircularProgressIndicator()))
                    else if (_sessions.isEmpty)
                      const Text('No slots available for this date.', style: TextStyle(color: AppColors.error))
                    else
                      DropdownButtonFormField<String>(
                        isExpanded: true,
                        decoration: const InputDecoration(
                          labelText: 'Time Slot',
                          prefixIcon: Icon(Icons.access_time),
                        ),
                        value: _selectedTimeSlot,
                        items: _sessions.where((s) => s.availableSlots > 0).map((session) {
                          return DropdownMenuItem(
                            value: session.display,
                            child: Text("${session.display} (${session.availableSlots} available)"),
                          );
                        }).toList(),
                        onChanged: (val) {
                          if (val != null) {
                            final sessionConfig = _sessions.firstWhere((s) => s.display == val);
                            setState(() {
                              _selectedTimeSlot = val;
                              _selectedConfigId = sessionConfig.configId;
                            });
                          }
                        },
                        validator: (v) => v == null ? 'Required' : null,
                      ),
                    
                    const SizedBox(height: 24),

                    // Patient Details
                    const Text('4. Patient Details', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _patientNameController,
                      decoration: const InputDecoration(
                        labelText: 'Patient Name *',
                        prefixIcon: Icon(Icons.person_outline),
                      ),
                      validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null,
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _patientPhoneController,
                      keyboardType: TextInputType.phone,
                      decoration: const InputDecoration(
                        labelText: 'Patient Phone *',
                        prefixIcon: Icon(Icons.phone_outlined),
                        hintText: '0761234567 or +94761234567',
                      ),
                      validator: (v) {
                        if (v == null || v.trim().isEmpty) return 'Required';
                        final clean = v.replaceAll(RegExp(r'[\s\-+]'), '');
                        if (!RegExp(r'^\d{9,12}$').hasMatch(clean)) return 'Invalid phone number';
                        return null;
                      },
                    ),

                    const SizedBox(height: 32),
                    
                    SizedBox(
                      height: 50,
                      child: ElevatedButton(
                        onPressed: _isLoading ? null : _submitBooking,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: AppColors.textWhite,
                        ),
                        child: _isLoading
                            ? const CircularProgressIndicator(color: AppColors.textWhite)
                            : const Text('Book Appointment', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }
}
