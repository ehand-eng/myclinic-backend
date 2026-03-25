import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:myclinic_patient_app/models/doctor.dart';
import 'package:myclinic_patient_app/providers/auth_provider.dart';
import 'package:myclinic_patient_app/screens/splash/splash_screen.dart';
import 'package:myclinic_patient_app/screens/onboarding/onboarding_screen.dart';
import 'package:myclinic_patient_app/screens/auth/login_screen.dart';
import 'package:myclinic_patient_app/screens/auth/signup_screen.dart';
import 'package:myclinic_patient_app/screens/home/home_screen.dart';
import 'package:myclinic_patient_app/screens/home/main_shell.dart';
import 'package:myclinic_patient_app/screens/booking/booking_step1_screen.dart';
import 'package:myclinic_patient_app/screens/booking/booking_step2_screen.dart';
import 'package:myclinic_patient_app/screens/booking/booking_confirmation_screen.dart';
import 'package:myclinic_patient_app/screens/payment/payment_webview_screen.dart';
import 'package:myclinic_patient_app/screens/payment/payment_success_screen.dart';
import 'package:myclinic_patient_app/screens/payment/payment_failed_screen.dart';
import 'package:myclinic_patient_app/screens/my_bookings/my_bookings_screen.dart';
import 'package:myclinic_patient_app/screens/my_bookings/booking_detail_screen.dart';
import 'package:myclinic_patient_app/screens/my_bookings/amend_booking_screen.dart';
import 'package:myclinic_patient_app/screens/profile/profile_screen.dart';
import 'package:myclinic_patient_app/screens/profile/change_password_screen.dart';
import 'package:myclinic_patient_app/screens/settings/settings_screen.dart';
import 'package:myclinic_patient_app/screens/about/about_screen.dart';
import 'package:myclinic_patient_app/screens/contact/contact_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/splash',
    redirect: (context, state) {
      final container = ProviderScope.containerOf(context, listen: false);
      final auth = container.read(authProvider);
      final isLoggedIn = auth.isAuthenticated;
      final path = state.uri.path;

      // Public routes that don't need auth
      final publicRoutes = ['/splash', '/onboarding', '/login', '/signup', '/booking', '/booking/details', '/about', '/contact', '/settings'];
      final isPublicRoute = publicRoutes.contains(path) || path.startsWith('/booking/confirmation');

      // If not logged in and trying to access protected route
      if (!isLoggedIn && !isPublicRoute) {
        return '/login';
      }

      return null;
    },
    routes: [
      GoRoute(path: '/splash', builder: (_, __) => const SplashScreen()),
      GoRoute(path: '/onboarding', builder: (_, __) => const OnboardingScreen()),
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(path: '/signup', builder: (_, __) => const SignupScreen()),

      // Main shell — 3 tabs: Home, My Bookings, Profile
      StatefulShellRoute.indexedStack(
        builder: (_, __, navigationShell) => MainShell(navigationShell: navigationShell),
        branches: [
          StatefulShellBranch(routes: [
            GoRoute(path: '/', builder: (_, __) => const HomeScreen()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/my-bookings', builder: (_, __) => const MyBookingsScreen()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen()),
          ]),
        ],
      ),

      // Booking flow (standalone, outside shell — gets back button)
      GoRoute(
        path: '/booking',
        builder: (_, state) => BookingStep1Screen(
          preSelectedDoctor: state.extra is Doctor ? state.extra as Doctor : null,
        ),
      ),
      GoRoute(path: '/booking/details', builder: (_, __) => const BookingStep2Screen()),
      GoRoute(
        path: '/booking/confirmation/:transactionId',
        builder: (_, state) => BookingConfirmationScreen(transactionId: state.pathParameters['transactionId']!),
      ),

      // Payment
      GoRoute(
        path: '/payment/:bookingId',
        builder: (_, state) => PaymentWebViewScreen(
          bookingId: state.pathParameters['bookingId']!,
          paymentUrl: state.extra as String? ?? '',
        ),
      ),
      GoRoute(
        path: '/payment/success/:bookingId',
        builder: (_, state) => PaymentSuccessScreen(bookingId: state.pathParameters['bookingId']!),
      ),
      GoRoute(
        path: '/payment/failed/:bookingId',
        builder: (_, state) => PaymentFailedScreen(bookingId: state.pathParameters['bookingId']!),
      ),

      // Booking detail / amend
      GoRoute(
        path: '/booking-detail/:id',
        builder: (_, state) => BookingDetailScreen(bookingId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/amend-booking/:id',
        builder: (_, state) => AmendBookingScreen(bookingId: state.pathParameters['id']!),
      ),

      // Other
      GoRoute(path: '/change-password', builder: (_, __) => const ChangePasswordScreen()),
      GoRoute(path: '/settings', builder: (_, __) => const SettingsScreen()),
      GoRoute(path: '/about', builder: (_, __) => const AboutScreen()),
      GoRoute(path: '/contact', builder: (_, __) => const ContactScreen()),
    ],
  );
});
