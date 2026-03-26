import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:myclinic_patient_app/config/theme.dart';

class OtpInput extends StatefulWidget {
  final TextEditingController controller;
  const OtpInput({super.key, required this.controller});

  @override
  State<OtpInput> createState() => _OtpInputState();
}

class _OtpInputState extends State<OtpInput> {
  late FocusNode _focusNode;

  @override
  void initState() {
    super.initState();
    _focusNode = FocusNode();
    widget.controller.addListener(_onChanged);
    WidgetsBinding.instance.addPostFrameCallback((_) => _focusNode.requestFocus());
  }

  void _onChanged() => setState(() {});

  @override
  void dispose() {
    widget.controller.removeListener(_onChanged);
    _focusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final text = widget.controller.text;
    return GestureDetector(
      onTap: () => _focusNode.requestFocus(),
      child: SizedBox(
        height: 50,
        child: Stack(
          children: [
            // Visual boxes
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(6, (i) {
                final hasDigit = i < text.length;
                final isActive = i == text.length && _focusNode.hasFocus;
                return Container(
                  width: 44,
                  height: 50,
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  decoration: BoxDecoration(
                    color: hasDigit
                        ? Colors.white
                        : Colors.white.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: isActive
                          ? Colors.white
                          : hasDigit
                              ? Colors.white
                              : Colors.white.withValues(alpha: 0.4),
                      width: isActive ? 2 : 1,
                    ),
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    hasDigit ? text[i] : '',
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.text,
                    ),
                  ),
                );
              }),
            ),
            // Invisible text field stretched over the boxes to capture input.
            // Wrapped in Theme to override the global inputDecorationTheme
            // which sets filled:true + white fillColor.
            Positioned.fill(
              child: Theme(
                data: Theme.of(context).copyWith(
                  inputDecorationTheme: const InputDecorationTheme(
                    filled: false,
                    border: InputBorder.none,
                  ),
                ),
                child: TextField(
                  controller: widget.controller,
                  focusNode: _focusNode,
                  keyboardType: TextInputType.number,
                  maxLength: 6,
                  showCursor: false,
                  style: const TextStyle(color: Colors.transparent, fontSize: 1),
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                  decoration: const InputDecoration(
                    counterText: '',
                    border: InputBorder.none,
                    enabledBorder: InputBorder.none,
                    focusedBorder: InputBorder.none,
                    disabledBorder: InputBorder.none,
                    errorBorder: InputBorder.none,
                    focusedErrorBorder: InputBorder.none,
                    contentPadding: EdgeInsets.zero,
                    isDense: true,
                    filled: false,
                    isCollapsed: true,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
