import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import 'theme.dart';
import '../screens/auth/login_screen.dart';
import '../screens/auth/change_password_screen.dart';
import '../screens/auth/dispensary_select_screen.dart';
import '../screens/main_shell.dart';
import '../screens/dispensaries/dispensary_detail_screen.dart';
import '../screens/doctors/doctor_detail_screen.dart';
import '../screens/doctors/doctor_form_screen.dart';
import '../screens/doctors/replacement_screen.dart';
import '../screens/timeslots/timeslot_selector_screen.dart';
import '../screens/timeslots/timeslot_manage_screen.dart';
import '../screens/bookings/booking_detail_screen.dart';
import '../screens/reports/reports_screen.dart';

class _RouterRefreshNotifier extends ChangeNotifier {
  void notify() => notifyListeners();
}

final _routerRefreshNotifier = _RouterRefreshNotifier();

final routerProvider = Provider<GoRouter>((ref) {
  // Trigger router refresh on auth status changes or when loading completes
  bool? wasAuthenticated;
  bool wasLoading = true;
  ref.listen(authProvider, (prev, next) {
    final isNowAuth = next.isAuthenticated;
    final isNowLoading = next.isLoading;

    // Fire when loading finishes (splash → login or dashboard)
    if (wasLoading && !isNowLoading) {
      wasLoading = false;
      wasAuthenticated = isNowAuth;
      _routerRefreshNotifier.notify();
      return;
    }
    wasLoading = isNowLoading;

    // Fire on login/logout transitions
    if (wasAuthenticated != isNowAuth && !isNowLoading) {
      wasAuthenticated = isNowAuth;
      _routerRefreshNotifier.notify();
    }
  });

  return GoRouter(
    initialLocation: '/splash',
    refreshListenable: _routerRefreshNotifier,
    redirect: (context, state) {
      final authState = ref.read(authProvider);
      final isLoggedIn = authState.isAuthenticated;
      final isLoading = authState.isLoading;
      final path = state.uri.path;

      // While checking auth, stay on splash
      if (isLoading) {
        if (path != '/splash') return '/splash';
        return null;
      }

      // Done loading — redirect away from splash
      if (path == '/splash') {
        return isLoggedIn ? '/dashboard' : '/login';
      }

      final publicRoutes = ['/login'];
      final isPublicRoute = publicRoutes.contains(path);

      if (!isLoggedIn && !isPublicRoute) return '/login';

      if (isLoggedIn && path == '/login') {
        if (authState.user?.mustChangePassword == true) {
          return '/change-password';
        }
        if (authState.selectedDispensary == null &&
            authState.dispensaries.length > 1) {
          return '/select-dispensary';
        }
        return '/dashboard';
      }

      return null;
    },
    routes: [
      // Splash
      GoRoute(
        path: '/splash',
        builder: (_, __) => const _SplashScreen(),
      ),

      // Auth
      GoRoute(
        path: '/login',
        builder: (_, __) => const LoginScreen(),
      ),
      GoRoute(
        path: '/change-password',
        builder: (_, __) => const ChangePasswordScreen(),
      ),
      GoRoute(
        path: '/select-dispensary',
        builder: (_, __) => const DispensarySelectScreen(),
      ),

      // Main shell with bottom nav
      GoRoute(
        path: '/dashboard',
        builder: (_, __) => const MainShell(),
      ),

      // Dispensary detail
      GoRoute(
        path: '/dispensaries/:id',
        builder: (_, state) => DispensaryDetailScreen(
          dispensaryId: state.pathParameters['id']!,
        ),
      ),

      // Doctor screens
      GoRoute(
        path: '/doctors/create',
        builder: (_, __) => const DoctorFormScreen(),
      ),
      GoRoute(
        path: '/doctors/edit/:id',
        builder: (_, state) => DoctorFormScreen(
          doctorId: state.pathParameters['id'],
        ),
      ),
      GoRoute(
        path: '/doctors/:id',
        builder: (_, state) => DoctorDetailScreen(
          doctorId: state.pathParameters['id']!,
        ),
      ),
      GoRoute(
        path: '/doctors/:doctorId/replacements/:dispensaryId',
        builder: (_, state) => ReplacementScreen(
          doctorId: state.pathParameters['doctorId']!,
          dispensaryId: state.pathParameters['dispensaryId']!,
        ),
      ),

      // Time slots
      GoRoute(
        path: '/timeslots',
        builder: (_, __) => Scaffold(
          appBar: AppBar(title: const Text('Time Slots')),
          body: const TimeSlotSelectorScreen(),
        ),
      ),
      GoRoute(
        path: '/timeslots/manage/:doctorId/:dispensaryId',
        builder: (_, state) => TimeSlotManageScreen(
          doctorId: state.pathParameters['doctorId']!,
          dispensaryId: state.pathParameters['dispensaryId']!,
        ),
      ),

      // Booking detail
      GoRoute(
        path: '/bookings/:id',
        builder: (_, state) => BookingDetailScreen(
          bookingId: state.pathParameters['id']!,
        ),
      ),

      // Reports
      GoRoute(
        path: '/reports',
        builder: (_, __) => Scaffold(
          appBar: AppBar(title: const Text('Reports')),
          body: const ReportsScreen(),
        ),
      ),
    ],
  );
});

class _SplashScreen extends StatelessWidget {
  const _SplashScreen();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: AppColors.primaryGradient,
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Icon(
                Icons.local_hospital_rounded,
                size: 48,
                color: AppColors.textWhite,
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'MyClinic Admin',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: AppColors.text,
              ),
            ),
            const SizedBox(height: 24),
            const CircularProgressIndicator(color: AppColors.primary),
          ],
        ),
      ),
    );
  }
}
