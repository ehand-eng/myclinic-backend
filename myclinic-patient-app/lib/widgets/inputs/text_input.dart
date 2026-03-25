import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:myclinic_patient_app/config/theme.dart';

class AppTextInput extends StatelessWidget {
  final String? label;
  final String? hint;
  final TextEditingController? controller;
  final String? Function(String?)? validator;
  final bool obscureText;
  final TextInputType? keyboardType;
  final IconData? prefixIcon;
  final Widget? prefix;
  final Widget? suffixIcon;
  final int? maxLines;
  final int? maxLength;
  final bool enabled;
  final ValueChanged<String>? onChanged;
  final TextInputAction? textInputAction;
  final bool onDarkBackground;
  final List<TextInputFormatter>? inputFormatters;

  const AppTextInput({
    super.key,
    this.label,
    this.hint,
    this.controller,
    this.validator,
    this.obscureText = false,
    this.keyboardType,
    this.prefixIcon,
    this.prefix,
    this.suffixIcon,
    this.maxLines = 1,
    this.maxLength,
    this.enabled = true,
    this.onChanged,
    this.textInputAction,
    this.onDarkBackground = false,
    this.inputFormatters,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = onDarkBackground;

    return TextFormField(
      controller: controller,
      validator: validator,
      obscureText: obscureText,
      keyboardType: obscureText ? TextInputType.visiblePassword : keyboardType,
      enableSuggestions: !obscureText,
      autocorrect: !obscureText,
      maxLines: obscureText ? 1 : maxLines,
      maxLength: maxLength,
      enabled: enabled,
      onChanged: onChanged,
      textInputAction: textInputAction,
      inputFormatters: inputFormatters,
      style: isDark ? const TextStyle(color: Colors.white, fontSize: 15) : const TextStyle(fontSize: 15),
      cursorColor: isDark ? Colors.white : AppTheme.primary,
      decoration: isDark
          ? InputDecoration(
              labelText: label,
              hintText: hint,
              prefixIcon: prefix ?? (prefixIcon != null ? Icon(prefixIcon, color: Colors.white70) : null),
              suffixIcon: suffixIcon,
              counterText: '',
              // Unfocused label
              labelStyle: TextStyle(color: Colors.white.withValues(alpha: 0.7), fontSize: 14),
              // Floating label (when focused or has text) — bright white, slightly larger
              floatingLabelStyle: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w600),
              hintStyle: TextStyle(color: Colors.white.withValues(alpha: 0.4)),
              filled: true,
              fillColor: Colors.white.withValues(alpha: 0.12),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.3)),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.3)),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: Colors.white, width: 2),
              ),
              errorBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: Colors.red.shade300),
              ),
              focusedErrorBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: Colors.red.shade300, width: 2),
              ),
              errorStyle: TextStyle(color: Colors.red.shade200),
            )
          : InputDecoration(
              labelText: label,
              hintText: hint,
              prefixIcon: prefix ?? (prefixIcon != null ? Icon(prefixIcon, color: AppTheme.primary) : null),
              suffixIcon: suffixIcon,
              counterText: '',
              // Floating label on light background — use primary color so it's clearly visible
              floatingLabelStyle: const TextStyle(color: AppTheme.primary, fontSize: 16, fontWeight: FontWeight.w600),
            ),
    );
  }
}
