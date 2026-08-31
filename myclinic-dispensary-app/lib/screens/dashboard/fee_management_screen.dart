import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../config/theme.dart';
import '../../providers/auth_provider.dart';
import '../../services/doctor_service.dart';
import '../../services/fee_service.dart';
import '../../models/doctor.dart';
import '../../widgets/loading_widget.dart';

class FeeManagementScreen extends ConsumerStatefulWidget {
  const FeeManagementScreen({super.key});

  @override
  ConsumerState<FeeManagementScreen> createState() => _FeeManagementScreenState();
}

class _FeeManagementScreenState extends ConsumerState<FeeManagementScreen> {
  final _doctorService = DoctorService();
  final _feeService = FeeService();
  
  bool _loadingDoctors = false;
  bool _loadingFees = false;
  bool _isSaving = false;
  bool _isModified = false;
  
  List<Doctor> _doctors = [];
  Doctor? _selectedDoctor;
  List<Map<String, dynamic>> _fees = [];
  Map<String, dynamic>? _currentFee;

  final _doctorFeeController = TextEditingController();
  final _dispensaryFeeController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadDoctors();
    
    _doctorFeeController.addListener(_checkIfModified);
    _dispensaryFeeController.addListener(_checkIfModified);
  }

  void _checkIfModified() {
    if (_currentFee == null) {
      final docFee = _doctorFeeController.text.trim();
      final dispFee = _dispensaryFeeController.text.trim();
      final isModified = docFee.isNotEmpty || dispFee.isNotEmpty;
      if (_isModified != isModified) setState(() => _isModified = isModified);
      return;
    }

    final initialDocFee = _currentFee!['doctorFee']?.toString() ?? '';
    final initialDispFee = _currentFee!['dispensaryFee']?.toString() ?? '';
    
    // Compare string lengths and contents loosely
    final currentDocFee = _doctorFeeController.text.trim();
    final currentDispFee = _dispensaryFeeController.text.trim();
    
    final isModified = (initialDocFee != currentDocFee) || (initialDispFee != currentDispFee);
    if (_isModified != isModified) {
      setState(() => _isModified = isModified);
    }
  }

  @override
  void dispose() {
    _doctorFeeController.dispose();
    _dispensaryFeeController.dispose();
    super.dispose();
  }

  Future<void> _loadDoctors() async {
    final auth = ref.read(authProvider);
    if (auth.selectedDispensary == null) return;

    setState(() => _loadingDoctors = true);
    try {
      final doctors = await _doctorService.getDoctorsByDispensary(auth.selectedDispensary!.id);
      setState(() {
        _doctors = doctors;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load doctors: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _loadingDoctors = false);
    }
  }

  Future<void> _onDoctorSelected(Doctor? doctor) async {
    setState(() {
      _selectedDoctor = doctor;
      _fees = [];
      _currentFee = null;
    });

    if (doctor == null) return;

    setState(() => _loadingFees = true);
    try {
      final fees = await _feeService.getFeesForDoctor(doctor.id);
      setState(() {
        _fees = fees;
        // See if there's an existing fee configuration for this dispensary explicitly
        final auth = ref.read(authProvider);
        try {
          _currentFee = fees.firstWhere((f) => f['dispensaryId'] == auth.selectedDispensary?.id);
        } catch (_) {
          _currentFee = null;
        }

        if (_currentFee != null) {
          _doctorFeeController.text = _currentFee!['doctorFee'].toString();
          _dispensaryFeeController.text = _currentFee!['dispensaryFee'].toString();
        } else {
          _doctorFeeController.text = '';
          _dispensaryFeeController.text = '';
        }
        _isModified = false;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load fees: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _loadingFees = false);
    }
  }

  Future<void> _saveFees() async {
    if (_selectedDoctor == null) return;
    final auth = ref.read(authProvider);
    if (auth.selectedDispensary == null) return;

    final doctorFee = double.tryParse(_doctorFeeController.text);
    final dispensaryFee = double.tryParse(_dispensaryFeeController.text);

    if (doctorFee == null || dispensaryFee == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter valid numeric fees')),
      );
      return;
    }

    setState(() => _isSaving = true);
    try {
      final data = {
        'dispensaryId': auth.selectedDispensary!.id,
        'doctorFee': doctorFee,
        'dispensaryFee': dispensaryFee,
      };

      if (_currentFee != null) {
        await _feeService.updateFee(_selectedDoctor!.id, _currentFee!['id'], data);
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Fee updated successfully')));
      } else {
        await _feeService.createFee(_selectedDoctor!.id, data);
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Fee created successfully')));
      }
      
      await _onDoctorSelected(_selectedDoctor); // Refresh
    } on DioException catch (e) {
      if (mounted) {
        String msg = 'Failed to save fee';
        if (e.response?.data != null && e.response!.data['message'] != null) {
          msg = e.response!.data['message'];
        }
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg), backgroundColor: AppColors.error));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to save fee: $e'), backgroundColor: AppColors.error),
        );
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Fee Management'),
        backgroundColor: AppColors.primary,
        foregroundColor: AppColors.textWhite,
      ),
      backgroundColor: AppColors.background,
      body: _loadingDoctors
          ? const LoadingWidget(message: 'Loading doctors...')
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text(
                    'Select Doctor',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.text),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    decoration: BoxDecoration(
                      color: AppColors.card,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<Doctor>(
                        value: _selectedDoctor,
                        hint: const Text('Choose a doctor'),
                        isExpanded: true,
                        items: _doctors.map((doc) {
                          return DropdownMenuItem<Doctor>(
                            value: doc,
                            child: Text(doc.name),
                          );
                        }).toList(),
                        onChanged: _onDoctorSelected,
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  if (_loadingFees)
                    const Center(child: Padding(padding: EdgeInsets.all(24.0), child: CircularProgressIndicator()))
                  else if (_selectedDoctor != null)
                    Card(
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                        side: const BorderSide(color: AppColors.border),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Text(
                              _currentFee != null ? 'Update Fees' : 'Configure New Fees',
                              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 16),
                            TextField(
                              controller: _doctorFeeController,
                              keyboardType: const TextInputType.numberWithOptions(decimal: true),
                              decoration: const InputDecoration(
                                labelText: 'Doctor Fee (Rs)',
                                border: OutlineInputBorder(),
                                prefixIcon: Icon(Icons.money),
                              ),
                            ),
                            const SizedBox(height: 16),
                            TextField(
                              controller: _dispensaryFeeController,
                              keyboardType: const TextInputType.numberWithOptions(decimal: true),
                              decoration: const InputDecoration(
                                labelText: 'Dispensary Fee (Rs)',
                                border: OutlineInputBorder(),
                                prefixIcon: Icon(Icons.local_hospital),
                              ),
                            ),
                            const SizedBox(height: 24),
                            ElevatedButton(
                              onPressed: (_isSaving || !_isModified) ? null : _saveFees,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.primary,
                                foregroundColor: AppColors.textWhite,
                                padding: const EdgeInsets.symmetric(vertical: 16),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                              ),
                              child: _isSaving
                                  ? const SizedBox(
                                      width: 24,
                                      height: 24,
                                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                                    )
                                  : const Text('Save Fees', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                            ),
                          ],
                        ),
                      ),
                    ),
                ],
              ),
            ),
    );
  }
}
