import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:myclinic_patient_app/config/theme.dart';
import 'package:myclinic_patient_app/l10n/translations.dart';
import 'package:myclinic_patient_app/models/booking.dart';
import 'package:myclinic_patient_app/providers/booking_provider.dart';
import 'package:myclinic_patient_app/widgets/cards/booking_card.dart';
import 'package:myclinic_patient_app/widgets/common/empty_state.dart';
import 'package:myclinic_patient_app/widgets/common/error_widget.dart';
import 'package:myclinic_patient_app/widgets/common/loading_widget.dart';

// Local search provider (not persisted)
final _searchQueryProvider = StateProvider<String>((ref) => '');

class MyBookingsScreen extends ConsumerStatefulWidget {
  const MyBookingsScreen({super.key});

  @override
  ConsumerState<MyBookingsScreen> createState() => _MyBookingsScreenState();
}

class _MyBookingsScreenState extends ConsumerState<MyBookingsScreen> {
  final _searchCtrl = TextEditingController();
  bool _showSearch = false;

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  List<Booking> _applySearch(List<Booking> list, String query) {
    if (query.isEmpty) return list;
    final q = query.toLowerCase();
    return list.where((b) =>
        b.transactionId.toLowerCase().contains(q) ||
        b.doctorName.toLowerCase().contains(q) ||
        b.dispensaryName.toLowerCase().contains(q) ||
        b.patientName.toLowerCase().contains(q)).toList();
  }

  @override
  Widget build(BuildContext context) {
    final bookings = ref.watch(filteredBookingsProvider);
    final allBookings = ref.watch(myBookingsProvider);
    final filter = ref.watch(bookingFilterProvider);
    final searchQuery = ref.watch(_searchQueryProvider);

    final filters = ['all', 'upcoming', 'completed', 'cancelled'];
    final labels = [context.tr('all'), context.tr('upcoming'), context.tr('completed'), context.tr('cancelled')];

    // Counts for tabs
    final counts = allBookings.whenOrNull(data: (list) => {
      'all': list.length,
      'upcoming': list.where((b) => b.status == 'scheduled').length,
      'completed': list.where((b) => b.status == 'completed').length,
      'cancelled': list.where((b) => b.status == 'cancelled').length,
    }) ?? {};

    return Scaffold(
      appBar: AppBar(
        title: Text(context.tr('myBookings')),
        actions: [
          IconButton(
            icon: Icon(_showSearch ? Icons.close_rounded : Icons.search_rounded),
            onPressed: () {
              setState(() {
                _showSearch = !_showSearch;
                if (!_showSearch) {
                  _searchCtrl.clear();
                  ref.read(_searchQueryProvider.notifier).state = '';
                }
              });
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Search bar
          if (_showSearch)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
              child: TextField(
                controller: _searchCtrl,
                autofocus: true,
                decoration: InputDecoration(
                  hintText: '${context.tr('search')}... (ID, ${context.tr('doctor')}, ${context.tr('dispensary')})',
                  prefixIcon: const Icon(Icons.search_rounded, color: AppTheme.textLight),
                  suffixIcon: _searchCtrl.text.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear_rounded, color: AppTheme.textLight),
                          onPressed: () {
                            _searchCtrl.clear();
                            ref.read(_searchQueryProvider.notifier).state = '';
                          },
                        )
                      : null,
                  filled: true,
                  fillColor: AppTheme.background,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                ),
                onChanged: (v) => ref.read(_searchQueryProvider.notifier).state = v,
              ),
            ),

          // Filter tabs with counts
          SizedBox(
            height: 46,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              itemCount: filters.length,
              itemBuilder: (_, i) {
                final count = counts[filters[i]] ?? 0;
                final isSelected = filter == filters[i];
                return Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: ChoiceChip(
                    label: Text('${labels[i]} ($count)'),
                    selected: isSelected,
                    onSelected: (_) => ref.read(bookingFilterProvider.notifier).state = filters[i],
                    selectedColor: AppTheme.primarySurface,
                    labelStyle: TextStyle(
                      color: isSelected ? AppTheme.primary : AppTheme.textSecondary,
                      fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                      fontSize: 13,
                    ),
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 4),

          // Bookings list
          Expanded(
            child: bookings.when(
              data: (list) {
                final filtered = _applySearch(list, searchQuery);
                if (filtered.isEmpty) {
                  if (searchQuery.isNotEmpty) {
                    return EmptyState(
                      icon: Icons.search_off_rounded,
                      title: context.tr('noBookingsFound'),
                      subtitle: 'No results for "$searchQuery"',
                    );
                  }
                  return EmptyState(
                    icon: Icons.calendar_today_outlined,
                    title: context.tr('noBookingsFound'),
                    subtitle: filter == 'all' ? context.tr('bookFirst') : null,
                    actionText: filter == 'all' ? context.tr('bookNow') : null,
                    onAction: filter == 'all' ? () => context.push('/booking') : null,
                  );
                }
                return RefreshIndicator(
                  onRefresh: () async => ref.invalidate(myBookingsProvider),
                  child: ListView.builder(
                    itemCount: filtered.length,
                    padding: const EdgeInsets.only(bottom: 80),
                    itemBuilder: (_, i) => BookingCard(
                      booking: filtered[i],
                      index: i,
                      onTap: () => context.push('/booking-detail/${filtered[i].id}'),
                    ),
                  ),
                );
              },
              loading: () => const LoadingWidget(),
              error: (e, _) => AppErrorWidget(
                message: context.tr('error'),
                onRetry: () => ref.invalidate(myBookingsProvider),
              ),
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.push('/booking'),
        backgroundColor: AppTheme.primary,
        foregroundColor: Colors.white,
        child: const Icon(Icons.add_rounded, size: 28),
      ),
    );
  }
}
