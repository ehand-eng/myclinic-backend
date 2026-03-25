import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:myclinic_patient_app/config/theme.dart';
import 'package:myclinic_patient_app/l10n/translations.dart';
import 'package:myclinic_patient_app/providers/doctor_provider.dart';
import 'package:myclinic_patient_app/widgets/cards/doctor_card.dart';
import 'package:myclinic_patient_app/widgets/common/empty_state.dart';
import 'package:myclinic_patient_app/widgets/common/error_widget.dart';
import 'package:myclinic_patient_app/widgets/common/loading_widget.dart';
import 'package:myclinic_patient_app/widgets/inputs/search_input.dart';

class DoctorsListScreen extends ConsumerWidget {
  const DoctorsListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final doctors = ref.watch(filteredDoctorsProvider);
    final specializations = ref.watch(specializationsProvider);
    final selectedSpec = ref.watch(specializationFilterProvider);

    return Scaffold(
      appBar: AppBar(title: Text(context.tr('doctors'))),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
            child: SearchInput(
              hint: context.tr('searchDoctors'),
              onChanged: (v) => ref.read(doctorSearchProvider.notifier).state = v,
            ),
          ),
          if (specializations.isNotEmpty)
            SizedBox(
              height: 42,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 12),
                children: [
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: ChoiceChip(
                      label: Text(context.tr('allSpecializations')),
                      selected: selectedSpec == null,
                      onSelected: (_) => ref.read(specializationFilterProvider.notifier).state = null,
                      selectedColor: AppTheme.primarySurface,
                      labelStyle: TextStyle(
                        color: selectedSpec == null ? AppTheme.primary : AppTheme.textSecondary,
                        fontWeight: selectedSpec == null ? FontWeight.w600 : FontWeight.w400,
                      ),
                    ),
                  ),
                  ...specializations.map((s) => Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 4),
                        child: ChoiceChip(
                          label: Text(s),
                          selected: selectedSpec == s,
                          onSelected: (_) => ref.read(specializationFilterProvider.notifier).state = s,
                          selectedColor: AppTheme.primarySurface,
                          labelStyle: TextStyle(
                            color: selectedSpec == s ? AppTheme.primary : AppTheme.textSecondary,
                            fontWeight: selectedSpec == s ? FontWeight.w600 : FontWeight.w400,
                          ),
                        ),
                      )),
                ],
              ),
            ),
          const SizedBox(height: 8),
          Expanded(
            child: doctors.when(
              data: (list) {
                if (list.isEmpty) {
                  return EmptyState(
                    icon: Icons.medical_services_outlined,
                    title: context.tr('noDoctorsFound'),
                    subtitle: 'Try adjusting your search or filter',
                  );
                }
                return RefreshIndicator(
                  onRefresh: () async => ref.invalidate(doctorsProvider),
                  child: ListView.builder(
                    itemCount: list.length,
                    padding: const EdgeInsets.only(bottom: 16),
                    itemBuilder: (_, i) => DoctorCard(
                      doctor: list[i],
                      index: i,
                      onTap: () => context.push('/doctor/${list[i].id}'),
                      onBook: () => context.push('/booking', extra: list[i]),
                    ),
                  ),
                );
              },
              loading: () => const LoadingWidget(),
              error: (e, _) => AppErrorWidget(
                message: context.tr('error'),
                onRetry: () => ref.invalidate(doctorsProvider),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
