import 'package:flutter/material.dart';

// Helper to get localized strings
// Usage: context.l10n.appName
// This wraps the generated AppLocalizations for convenience
class L10n {
  static const supportedLocales = [
    Locale('en'),
    Locale('si'),
    Locale('ta'),
  ];

  static String getLanguageName(String code) {
    switch (code) {
      case 'si':
        return 'සිංහල';
      case 'ta':
        return 'தமிழ்';
      default:
        return 'English';
    }
  }

  static String getLanguageFlag(String code) {
    switch (code) {
      case 'si':
        return '🇱🇰';
      case 'ta':
        return '🇱🇰';
      default:
        return '🇬🇧';
    }
  }
}
