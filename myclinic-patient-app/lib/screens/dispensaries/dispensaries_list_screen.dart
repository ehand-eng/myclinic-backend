import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:myclinic_patient_app/l10n/translations.dart';
import 'package:myclinic_patient_app/providers/dispensary_provider.dart';
import 'package:myclinic_patient_app/widgets/cards/dispensary_card.dart';
import 'package:myclinic_patient_app/widgets/common/empty_state.dart';
import 'package:myclinic_patient_app/widgets/common/error_widget.dart';
import 'package:myclinic_patient_app/widgets/common/loading_widget.dart';
import 'package:myclinic_patient_app/widgets/inputs/search_input.dart';

class DispensariesListScreen extends ConsumerWidget {
  const DispensariesListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dispensaries = ref.watch(filteredDispensariesProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(context.tr('dispensaries')),
        leading: Navigator.canPop(context) ? IconButton(icon: const Icon(Icons.arrow_back_rounded), onPressed: () => context.pop()) : null,
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
            child: SearchInput(
              hint: context.tr('searchDispensaries'),
              onChanged: (v) => ref.read(dispensarySearchProvider.notifier).state = v,
            ),
          ),
          Expanded(
            child: dispensaries.when(
              data: (list) {
                if (list.isEmpty) {
                  return EmptyState(
                    icon: Icons.local_hospital_outlined,
                    title: context.tr('noDispensariesFound'),
                  );
                }
                return RefreshIndicator(
                  onRefresh: () async => ref.invalidate(dispensariesProvider),
                  child: ListView.builder(
                    itemCount: list.length,
                    padding: const EdgeInsets.only(bottom: 16),
                    itemBuilder: (_, i) => DispensaryCard(
                      dispensary: list[i],
                      index: i,
                      onTap: () => context.push('/dispensary/${list[i].id}'),
                    ),
                  ),
                );
              },
              loading: () => const LoadingWidget(),
              error: (e, _) => AppErrorWidget(
                message: context.tr('error'),
                onRetry: () => ref.invalidate(dispensariesProvider),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
