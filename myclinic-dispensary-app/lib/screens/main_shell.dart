import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../config/theme.dart';
import '../providers/auth_provider.dart';
import 'dashboard/dashboard_screen.dart';
import 'bookings/bookings_list_screen.dart';
import 'checkin/checkin_screen.dart';
import 'doctors/doctors_list_screen.dart';
import 'profile/profile_screen.dart';

class MainShell extends ConsumerStatefulWidget {
  const MainShell({super.key});

  @override
  ConsumerState<MainShell> createState() => _MainShellState();
}

class _MainShellState extends ConsumerState<MainShell> {
  int _currentIndex = 0;

  final _screens = const [
    DashboardScreen(),
    BookingsListScreen(),
    CheckInScreen(),
    DoctorsListScreen(),
    ProfileScreen(),
  ];

  static const _titles = [
    'Dashboard',
    'Bookings',
    'Check-In',
    'Doctors',
    'Profile',
  ];

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);

    return Scaffold(
      appBar: AppBar(
        leading: Builder(
          builder: (ctx) => IconButton(
            icon: const Icon(Icons.menu),
            onPressed: () => Scaffold.of(ctx).openDrawer(),
          ),
        ),
        title: Column(
          children: [
            Text(
              _titles[_currentIndex],
              style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w600),
            ),
            if (auth.selectedDispensary != null)
              Text(
                auth.selectedDispensary!.name,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.normal,
                  color: AppColors.textWhite.withAlpha(190),
                ),
              ),
          ],
        ),
        centerTitle: true,
      ),
      drawer: _AppDrawer(auth: auth),
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (index) =>
            setState(() => _currentIndex = index),
        backgroundColor: AppColors.card,
        indicatorColor: AppColors.primarySurface,
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.dashboard_outlined),
            selectedIcon: Icon(Icons.dashboard, color: AppColors.primary),
            label: 'Dashboard',
          ),
          NavigationDestination(
            icon: Icon(Icons.event_note_outlined),
            selectedIcon: Icon(Icons.event_note, color: AppColors.primary),
            label: 'Bookings',
          ),
          NavigationDestination(
            icon: Icon(Icons.how_to_reg_outlined),
            selectedIcon: Icon(Icons.how_to_reg, color: AppColors.primary),
            label: 'Check-In',
          ),
          NavigationDestination(
            icon: Icon(Icons.medical_services_outlined),
            selectedIcon:
                Icon(Icons.medical_services, color: AppColors.primary),
            label: 'Doctors',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outlined),
            selectedIcon: Icon(Icons.person, color: AppColors.primary),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}

class _AppDrawer extends ConsumerWidget {
  final AuthState auth;
  const _AppDrawer({required this.auth});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Drawer(
      child: Column(
        children: [
          // Header
          Container(
            width: double.infinity,
            padding: EdgeInsets.fromLTRB(
                20, MediaQuery.of(context).padding.top + 20, 20, 20),
            decoration: const BoxDecoration(
              gradient: AppColors.primaryGradient,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                CircleAvatar(
                  radius: 28,
                  backgroundColor: AppColors.textWhite.withAlpha(50),
                  child: Text(
                    auth.user?.name.isNotEmpty == true
                        ? auth.user!.name[0].toUpperCase()
                        : 'A',
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textWhite,
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  auth.user?.name ?? 'Admin',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textWhite,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  auth.user?.email ?? '',
                  style: TextStyle(
                    fontSize: 13,
                    color: AppColors.textWhite.withAlpha(180),
                  ),
                ),
                if (auth.selectedDispensary != null) ...[
                  const SizedBox(height: 8),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.textWhite.withAlpha(30),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.local_hospital,
                            size: 13, color: AppColors.textWhite),
                        const SizedBox(width: 4),
                        Flexible(
                          child: Text(
                            auth.selectedDispensary!.name,
                            style: TextStyle(
                              fontSize: 12,
                              color: AppColors.textWhite.withAlpha(220),
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),

          // Menu items
          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(vertical: 8),
              children: [
                _DrawerItem(
                  icon: Icons.assessment_outlined,
                  label: 'Reports',
                  onTap: () {
                    Navigator.pop(context);
                    context.push('/reports');
                  },
                ),
                _DrawerItem(
                  icon: Icons.local_hospital_outlined,
                  label: 'Dispensaries',
                  onTap: () {
                    Navigator.pop(context);
                    context.push('/dispensaries-list');
                  },
                ),
                _DrawerItem(
                  icon: Icons.schedule_outlined,
                  label: 'Time Slots',
                  onTap: () {
                    Navigator.pop(context);
                    context.push('/timeslots');
                  },
                ),
                const Divider(height: 24),
                if (auth.dispensaries.length > 1)
                  _DrawerItem(
                    icon: Icons.swap_horiz,
                    label: 'Switch Dispensary',
                    onTap: () {
                      Navigator.pop(context);
                      context.go('/select-dispensary');
                    },
                  ),
                _DrawerItem(
                  icon: Icons.lock_outline,
                  label: 'Change Password',
                  onTap: () {
                    Navigator.pop(context);
                    context.push('/change-password');
                  },
                ),
                const Divider(height: 24),
                _DrawerItem(
                  icon: Icons.logout,
                  label: 'Logout',
                  color: AppColors.error,
                  onTap: () async {
                    Navigator.pop(context);
                    final confirm = await showDialog<bool>(
                      context: context,
                      builder: (ctx) => AlertDialog(
                        title: const Text('Logout'),
                        content:
                            const Text('Are you sure you want to logout?'),
                        actions: [
                          TextButton(
                            onPressed: () => Navigator.pop(ctx, false),
                            child: const Text('Cancel'),
                          ),
                          TextButton(
                            onPressed: () => Navigator.pop(ctx, true),
                            style: TextButton.styleFrom(
                                foregroundColor: AppColors.error),
                            child: const Text('Logout'),
                          ),
                        ],
                      ),
                    );
                    if (confirm == true && context.mounted) {
                      await ref.read(authProvider.notifier).logout();
                      if (context.mounted) context.go('/login');
                    }
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _DrawerItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final Color? color;

  const _DrawerItem({
    required this.icon,
    required this.label,
    required this.onTap,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    final c = color ?? AppColors.text;
    return ListTile(
      leading: Icon(icon, color: c, size: 22),
      title: Text(label,
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w500,
            color: c,
          )),
      onTap: onTap,
      dense: true,
      visualDensity: const VisualDensity(vertical: -1),
    );
  }
}
