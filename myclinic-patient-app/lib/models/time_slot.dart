class TimeSlotConfig {
  final String id;
  final String doctorId;
  final String dispensaryId;
  final int dayOfWeek;
  final String startTime;
  final String endTime;
  final int maxPatients;
  final int minutesPerPatient;
  final int? bookingCutoverTime;
  final bool isActive;

  const TimeSlotConfig({
    required this.id,
    required this.doctorId,
    required this.dispensaryId,
    required this.dayOfWeek,
    required this.startTime,
    required this.endTime,
    this.maxPatients = 20,
    this.minutesPerPatient = 15,
    this.bookingCutoverTime,
    this.isActive = true,
  });

  factory TimeSlotConfig.fromJson(Map<String, dynamic> json) {
    return TimeSlotConfig(
      id: json['_id'] ?? json['id'] ?? '',
      doctorId: json['doctorId'] is Map
          ? json['doctorId']['_id'] ?? ''
          : json['doctorId'] ?? '',
      dispensaryId: json['dispensaryId'] is Map
          ? json['dispensaryId']['_id'] ?? ''
          : json['dispensaryId'] ?? '',
      dayOfWeek: json['dayOfWeek'] ?? 0,
      startTime: json['startTime'] ?? '',
      endTime: json['endTime'] ?? '',
      maxPatients: json['maxPatients'] ?? 20,
      minutesPerPatient: json['minutesPerPatient'] ?? 15,
      bookingCutoverTime: json['bookingCutoverTime'],
      isActive: json['isActive'] ?? true,
    );
  }

  Map<String, dynamic> toJson() => {
        '_id': id,
        'doctorId': doctorId,
        'dispensaryId': dispensaryId,
        'dayOfWeek': dayOfWeek,
        'startTime': startTime,
        'endTime': endTime,
        'maxPatients': maxPatients,
        'minutesPerPatient': minutesPerPatient,
        'bookingCutoverTime': bookingCutoverTime,
        'isActive': isActive,
      };
}

class Session {
  final String startTime;
  final String endTime;
  final String timeSlot;
  final String timeSlotConfigId;
  final bool isModified;
  final int? maxPatients;
  final int? currentBookings;
  final int? availableSlots;

  const Session({
    required this.startTime,
    required this.endTime,
    required this.timeSlot,
    required this.timeSlotConfigId,
    this.isModified = false,
    this.maxPatients,
    this.currentBookings,
    this.availableSlots,
  });

  factory Session.fromJson(Map<String, dynamic> json) {
    return Session(
      startTime: json['startTime'] ?? '',
      endTime: json['endTime'] ?? '',
      timeSlot: json['timeSlot'] ?? '${json['startTime']} - ${json['endTime']}',
      timeSlotConfigId: json['timeSlotConfigId'] ?? '',
      isModified: json['isModified'] ?? json['isModifiedSession'] ?? false,
      maxPatients: json['maxPatients'],
      currentBookings: json['currentBookings'],
      availableSlots: json['availableSlots'],
    );
  }

  bool get isFull =>
      maxPatients != null &&
      currentBookings != null &&
      currentBookings! >= maxPatients!;

  int get slotsRemaining =>
      (maxPatients ?? 0) - (currentBookings ?? 0);
}

class AbsentTimeSlot {
  final String id;
  final String doctorId;
  final String dispensaryId;
  final String date;
  final String? startTime;
  final String? endTime;
  final String? reason;
  final bool isModifiedSession;
  final int? maxPatients;
  final int? minutesPerPatient;
  final bool isDateRange;
  final String? startDate;
  final String? endDate;
  final String? timeSlotConfigId;

  const AbsentTimeSlot({
    required this.id,
    required this.doctorId,
    required this.dispensaryId,
    required this.date,
    this.startTime,
    this.endTime,
    this.reason,
    this.isModifiedSession = false,
    this.maxPatients,
    this.minutesPerPatient,
    this.isDateRange = false,
    this.startDate,
    this.endDate,
    this.timeSlotConfigId,
  });

  factory AbsentTimeSlot.fromJson(Map<String, dynamic> json) {
    return AbsentTimeSlot(
      id: json['_id'] ?? json['id'] ?? '',
      doctorId: json['doctorId'] ?? '',
      dispensaryId: json['dispensaryId'] ?? '',
      date: json['date'] ?? '',
      startTime: json['startTime'],
      endTime: json['endTime'],
      reason: json['reason'],
      isModifiedSession: json['isModifiedSession'] ?? false,
      maxPatients: json['maxPatients'],
      minutesPerPatient: json['minutesPerPatient'],
      isDateRange: json['isDateRange'] ?? false,
      startDate: json['startDate'],
      endDate: json['endDate'],
      timeSlotConfigId: json['timeSlotConfigId'],
    );
  }
}
