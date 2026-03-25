import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

class FadeInAnimation extends StatelessWidget {
  final Widget child;
  final Duration delay;
  final Duration duration;
  final int index;

  const FadeInAnimation({
    super.key,
    required this.child,
    this.delay = Duration.zero,
    this.duration = const Duration(milliseconds: 400),
    this.index = 0,
  });

  @override
  Widget build(BuildContext context) {
    return child
        .animate()
        .fadeIn(
          delay: delay + Duration(milliseconds: 50 * index),
          duration: duration,
        )
        .slideY(begin: 0.05, end: 0, duration: duration);
  }
}
