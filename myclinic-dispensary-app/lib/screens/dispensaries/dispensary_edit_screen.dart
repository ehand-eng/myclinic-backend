import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../config/theme.dart';
import '../../services/dispensary_service.dart';
import 'dispensary_detail_screen.dart';

class DispensaryEditScreen extends ConsumerStatefulWidget {
  final String dispensaryId;
  const DispensaryEditScreen({super.key, required this.dispensaryId});

  @override
  ConsumerState<DispensaryEditScreen> createState() =>
      _DispensaryEditScreenState();
}

class _DispensaryEditScreenState extends ConsumerState<DispensaryEditScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _addressCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  final _visibleDaysCtrl = TextEditingController();
  final _cutoffCtrl = TextEditingController();
  bool _isLoading = true;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final disp =
          await DispensaryService().getDispensaryById(widget.dispensaryId);
      _nameCtrl.text = disp.name;
      _addressCtrl.text = disp.address ?? '';
      _phoneCtrl.text = disp.contactNumber ?? '';
      _emailCtrl.text = disp.email ?? '';
      _descCtrl.text = disp.description ?? '';
      _visibleDaysCtrl.text = '${disp.bookingVisibleDays}';
      _cutoffCtrl.text = '${disp.bookingCutoffMinutes}';
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSaving = true);
    try {
      await DispensaryService().updateDispensary(widget.dispensaryId, {
        'name': _nameCtrl.text.trim(),
        'address': _addressCtrl.text.trim(),
        'contactNumber': _phoneCtrl.text.trim(),
        'email': _emailCtrl.text.trim(),
        'description': _descCtrl.text.trim(),
        'bookingVisibleDays': int.tryParse(_visibleDaysCtrl.text) ?? 30,
        'bookingCutoffMinutes': int.tryParse(_cutoffCtrl.text) ?? 60,
      });

      ref.invalidate(dispensaryDetailProvider(widget.dispensaryId));

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('Dispensary updated'),
              backgroundColor: AppColors.success),
        );
        context.pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _addressCtrl.dispose();
    _phoneCtrl.dispose();
    _emailCtrl.dispose();
    _descCtrl.dispose();
    _visibleDaysCtrl.dispose();
    _cutoffCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Edit Dispensary')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    TextFormField(
                      controller: _nameCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Name *',
                        prefixIcon: Icon(Icons.local_hospital_outlined),
                      ),
                      validator: (v) => v == null || v.trim().isEmpty
                          ? 'Name is required'
                          : null,
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _addressCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Address *',
                        prefixIcon: Icon(Icons.location_on_outlined),
                      ),
                      validator: (v) => v == null || v.trim().isEmpty
                          ? 'Address is required'
                          : null,
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _phoneCtrl,
                      keyboardType: TextInputType.phone,
                      decoration: const InputDecoration(
                        labelText: 'Contact Number',
                        prefixIcon: Icon(Icons.phone_outlined),
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _emailCtrl,
                      keyboardType: TextInputType.emailAddress,
                      decoration: const InputDecoration(
                        labelText: 'Email',
                        prefixIcon: Icon(Icons.email_outlined),
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _descCtrl,
                      maxLines: 3,
                      decoration: const InputDecoration(
                        labelText: 'Description',
                        prefixIcon: Icon(Icons.description_outlined),
                        alignLabelWithHint: true,
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _visibleDaysCtrl,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
                        labelText: 'Booking Visible Days',
                        prefixIcon: Icon(Icons.calendar_month_outlined),
                        helperText:
                            'Doctors with the current default will be auto-updated',
                      ),
                      validator: (v) {
                        if (v == null || v.trim().isEmpty) return null;
                        final n = int.tryParse(v);
                        if (n == null || n < 1 || n > 365) {
                          return 'Enter 1–365';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _cutoffCtrl,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
                        labelText: 'Booking Cutoff (minutes)',
                        prefixIcon: Icon(Icons.timer_outlined),
                        helperText:
                            'How many minutes before a session booking closes',
                      ),
                    ),
                    const SizedBox(height: 24),
                    SizedBox(
                      height: 50,
                      child: ElevatedButton(
                        onPressed: _isSaving ? null : _save,
                        child: _isSaving
                            ? const SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: AppColors.textWhite),
                              )
                            : const Text('Update Dispensary',
                                style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w600)),
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }
}
