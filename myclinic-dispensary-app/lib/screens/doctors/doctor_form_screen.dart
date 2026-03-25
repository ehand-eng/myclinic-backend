import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../config/theme.dart';
import '../../providers/auth_provider.dart';
import '../../services/doctor_service.dart';
import 'doctor_detail_screen.dart' show doctorDetailProvider;
import 'doctors_list_screen.dart' show doctorsListProvider;

class DoctorFormScreen extends ConsumerStatefulWidget {
  final String? doctorId;
  const DoctorFormScreen({super.key, this.doctorId});

  @override
  ConsumerState<DoctorFormScreen> createState() => _DoctorFormScreenState();
}

class _DoctorFormScreenState extends ConsumerState<DoctorFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _specController = TextEditingController();
  final _qualController = TextEditingController();
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  List<String> _selectedDispensaryIds = [];
  bool _isLoading = false;
  bool _isEdit = false;

  @override
  void initState() {
    super.initState();
    if (widget.doctorId != null) {
      _isEdit = true;
      _loadDoctor();
    } else {
      final auth = ref.read(authProvider);
      if (auth.selectedDispensary != null) {
        _selectedDispensaryIds = [auth.selectedDispensary!.id];
      }
    }
  }

  Future<void> _loadDoctor() async {
    setState(() => _isLoading = true);
    try {
      final doctor = await DoctorService().getDoctorById(widget.doctorId!);
      _nameController.text = doctor.name;
      _specController.text = doctor.specialization ?? '';
      _qualController.text = doctor.qualifications.join(', ');
      _phoneController.text = doctor.contactNumber ?? '';
      _emailController.text = doctor.email ?? '';
      _selectedDispensaryIds = List.from(doctor.dispensaryIds);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('Error loading doctor: $e')));
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);
    try {
      final data = {
        'name': _nameController.text.trim(),
        'specialization': _specController.text.trim(),
        'qualifications': _qualController.text
            .split(',')
            .map((e) => e.trim())
            .where((e) => e.isNotEmpty)
            .toList(),
        'contactNumber': _phoneController.text.trim(),
        'email': _emailController.text.trim(),
        'dispensaries': _selectedDispensaryIds,
      };

      if (_isEdit) {
        await DoctorService().updateDoctor(widget.doctorId!, data);
      } else {
        await DoctorService().createDoctor(data);
      }

      if (mounted) {
        // Invalidate the doctor detail cache so it re-fetches on return
        if (_isEdit && widget.doctorId != null) {
          ref.invalidate(doctorDetailProvider(widget.doctorId!));
        }
        // Also invalidate doctors list
        final dispensaryId = ref.read(authProvider).selectedDispensary?.id;
        if (dispensaryId != null) {
          ref.invalidate(doctorsListProvider(dispensaryId));
        }

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Doctor ${_isEdit ? 'updated' : 'created'} successfully'),
            backgroundColor: AppColors.success,
          ),
        );
        context.pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _specController.dispose();
    _qualController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(_isEdit ? 'Edit Doctor' : 'Add Doctor'),
      ),
      body: _isLoading && _isEdit && _nameController.text.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    TextFormField(
                      controller: _nameController,
                      decoration: const InputDecoration(
                        labelText: 'Name *',
                        prefixIcon: Icon(Icons.person_outlined),
                      ),
                      validator: (v) => v == null || v.trim().isEmpty
                          ? 'Name is required'
                          : null,
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _specController,
                      decoration: const InputDecoration(
                        labelText: 'Specialization *',
                        prefixIcon: Icon(Icons.medical_services_outlined),
                      ),
                      validator: (v) => v == null || v.trim().isEmpty
                          ? 'Specialization is required'
                          : null,
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _qualController,
                      decoration: const InputDecoration(
                        labelText: 'Qualifications (comma separated)',
                        prefixIcon: Icon(Icons.school_outlined),
                        hintText: 'MBBS, MD, FRCS',
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _phoneController,
                      keyboardType: TextInputType.phone,
                      decoration: const InputDecoration(
                        labelText: 'Contact Number *',
                        prefixIcon: Icon(Icons.phone_outlined),
                      ),
                      validator: (v) {
                        if (v == null || v.trim().isEmpty) {
                          return 'Contact number is required';
                        }
                        final cleaned = v.replaceAll(RegExp(r'[\s\-+]'), '');
                        if (!RegExp(r'^\d{9,12}$').hasMatch(cleaned)) {
                          return 'Enter a valid phone number';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _emailController,
                      keyboardType: TextInputType.emailAddress,
                      decoration: const InputDecoration(
                        labelText: 'Email *',
                        prefixIcon: Icon(Icons.email_outlined),
                      ),
                      validator: (v) {
                        if (v == null || v.trim().isEmpty) {
                          return 'Email is required';
                        }
                        if (!v.contains('@')) return 'Enter a valid email';
                        return null;
                      },
                    ),
                    const SizedBox(height: 24),

                    // Dispensary selection
                    const Text(
                      'Dispensaries',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: AppColors.text,
                      ),
                    ),
                    const SizedBox(height: 8),
                    ...auth.dispensaries.map((disp) => CheckboxListTile(
                          title: Text(disp.name),
                          subtitle: disp.address != null
                              ? Text(disp.address!,
                                  style: const TextStyle(fontSize: 12))
                              : null,
                          value: _selectedDispensaryIds.contains(disp.id),
                          onChanged: (checked) {
                            setState(() {
                              if (checked == true) {
                                _selectedDispensaryIds.add(disp.id);
                              } else {
                                _selectedDispensaryIds.remove(disp.id);
                              }
                            });
                          },
                          controlAffinity: ListTileControlAffinity.leading,
                          contentPadding: EdgeInsets.zero,
                        )),
                    const SizedBox(height: 24),

                    SizedBox(
                      height: 50,
                      child: ElevatedButton(
                        onPressed: _isLoading ? null : _save,
                        child: _isLoading
                            ? const SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: AppColors.textWhite),
                              )
                            : Text(
                                _isEdit ? 'Update Doctor' : 'Create Doctor',
                                style: const TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w600),
                              ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }
}
