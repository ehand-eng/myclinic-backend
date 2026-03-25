import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:myclinic_patient_app/config/routes.dart';
import 'package:myclinic_patient_app/config/theme.dart';
import 'package:myclinic_patient_app/providers/locale_provider.dart';

class MyClinicApp extends ConsumerWidget {
  const MyClinicApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    final locale = ref.watch(localeProvider);

    return MaterialApp.router(
      title: 'MyClinic',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme(),
      locale: locale,
      supportedLocales: const [
        Locale('en'),
        Locale('si'),
        Locale('ta'),
      ],
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      routerConfig: router,
      builder: (context, child) {
        // This forces rebuild when locale changes
        return KeyedSubtree(
          key: ValueKey(locale.languageCode),
          child: child ?? const SizedBox.shrink(),
        );
      },
    );
  }
}
