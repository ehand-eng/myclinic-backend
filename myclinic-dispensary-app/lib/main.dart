import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'config/theme.dart';
import 'config/routes.dart';
import 'providers/auth_provider.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const ProviderScope(child: MyClinicDispensaryApp()));
}

class MyClinicDispensaryApp extends ConsumerStatefulWidget {
  const MyClinicDispensaryApp({super.key});

  @override
  ConsumerState<MyClinicDispensaryApp> createState() =>
      _MyClinicDispensaryAppState();
}

class _MyClinicDispensaryAppState
    extends ConsumerState<MyClinicDispensaryApp> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      ref.read(authProvider.notifier).init();
    });
  }

  @override
  Widget build(BuildContext context) {
    final router = ref.watch(routerProvider);

    return MaterialApp.router(
      title: 'MyClinic Dispensary',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      routerConfig: router,
    );
  }
}
