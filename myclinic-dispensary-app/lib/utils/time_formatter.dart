import 'package:flutter/services.dart';

class TimeTextInputFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    // Return empty if empty
    if (newValue.text.isEmpty) {
      return newValue;
    }

    // Keep only digits
    String numericStr = newValue.text.replaceAll(RegExp(r'[^0-9]'), '');

    // Limit to 4 digits (HHMM)
    if (numericStr.length > 4) {
      numericStr = numericStr.substring(0, 4);
    }

    // Insert colon if length > 2
    String formattedStr = numericStr;
    if (numericStr.length > 2) {
      formattedStr = '${numericStr.substring(0, 2)}:${numericStr.substring(2)}';
    }

    return TextEditingValue(
      text: formattedStr,
      selection: TextSelection.collapsed(offset: formattedStr.length),
    );
  }
}
