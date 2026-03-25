import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:myclinic_patient_app/models/doctor.dart';
import 'package:myclinic_patient_app/services/doctor_service.dart';

final doctorsProvider = FutureProvider<List<Doctor>>((ref) async {
  final service = ref.watch(doctorServiceProvider);
  return service.getAllDoctors();
});

final doctorByIdProvider = FutureProvider.family<Doctor, String>((ref, id) async {
  final service = ref.watch(doctorServiceProvider);
  return service.getDoctorById(id);
});

final doctorSearchProvider = StateProvider<String>((ref) => '');
final specializationFilterProvider = StateProvider<String?>((ref) => null);

final specializationsProvider = Provider<List<String>>((ref) {
  final doctors = ref.watch(doctorsProvider);
  return doctors.maybeWhen(
    data: (list) {
      final specs = list.map((d) => d.specialization).toSet().toList();
      specs.sort();
      return specs;
    },
    orElse: () => [],
  );
});

final filteredDoctorsProvider = Provider<AsyncValue<List<Doctor>>>((ref) {
  final doctors = ref.watch(doctorsProvider);
  final search = ref.watch(doctorSearchProvider).toLowerCase();
  final specFilter = ref.watch(specializationFilterProvider);

  return doctors.whenData((list) {
    var filtered = list.where((d) => !d.disabled).toList();

    if (search.isNotEmpty) {
      filtered = filtered.where((d) =>
          d.name.toLowerCase().contains(search) ||
          d.specialization.toLowerCase().contains(search) ||
          d.qualifications.any((q) => q.toLowerCase().contains(search))).toList();
    }

    if (specFilter != null && specFilter.isNotEmpty) {
      filtered = filtered.where((d) => d.specialization == specFilter).toList();
    }

    return filtered;
  });
});
