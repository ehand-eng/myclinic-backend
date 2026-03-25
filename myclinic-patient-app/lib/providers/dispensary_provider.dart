import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:myclinic_patient_app/models/dispensary.dart';
import 'package:myclinic_patient_app/services/dispensary_service.dart';

final dispensariesProvider = FutureProvider<List<Dispensary>>((ref) async {
  final service = ref.watch(dispensaryServiceProvider);
  return service.getAllDispensaries();
});

final dispensaryByIdProvider = FutureProvider.family<Dispensary, String>((ref, id) async {
  final service = ref.watch(dispensaryServiceProvider);
  return service.getDispensaryById(id);
});

final dispensarySearchProvider = StateProvider<String>((ref) => '');

final filteredDispensariesProvider = Provider<AsyncValue<List<Dispensary>>>((ref) {
  final dispensaries = ref.watch(dispensariesProvider);
  final search = ref.watch(dispensarySearchProvider).toLowerCase();

  return dispensaries.whenData((list) {
    if (search.isEmpty) return list;
    return list.where((d) =>
        d.name.toLowerCase().contains(search) ||
        d.address.toLowerCase().contains(search)).toList();
  });
});
