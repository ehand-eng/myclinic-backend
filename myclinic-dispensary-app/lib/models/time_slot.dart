class TimeSlotConfig {
  final String id;
  final String doctorId;
  final String dispensaryId;
  final int dayOfWeek; // 0=Sunday, 1=Monday, ..., 6=Saturday
  final String startTime;
  final String endTime;
  final int maxPatients;
  final int minutesPerPatient;
  final int bookingCutoverTime;
  final bool isActive;

  TimeSlotConfig({
    required this.id,
    required this.doctorId,
    required this.dispensaryId,
    required this.dayOfWeek,
    required this.startTime,
    required this.endTime,
    this.maxPatients = 20,
    this.minutesPerPatient = 15,
    this.bookingCutoverTime = 60,
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
      bookingCutoverTime: json['bookingCutoverTime'] ?? 60,
      isActive: json['isActive'] ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'doctorId': doctorId,
      'dispensaryId': dispensaryId,
      'dayOfWeek': dayOfWeek,
      'startTime': startTime,
      'endTime': endTime,
      'maxPatients': maxPatients,
      'minutesPerPatient': minutesPerPatient,
      'bookingCutoverTime': bookingCutoverTime,
    };
  }

  String get dayName {
    const days = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday'
    ];
    return days[dayOfWeek];
  }
}

class AbsentTimeSlot {
  final String id;
  final String doctorId;
  final String dispensaryId;
  final DateTime? date;
  final String? startTime;
  final String? endTime;
  final String? reason;
  final bool isModifiedSession;
  final int? maxPatients;
  final int? minutesPerPatient;
  final String? timeSlotConfigId;
  final bool isDateRange;
  final DateTime? startDate;
  final DateTime? endDate;

  AbsentTimeSlot({
    required this.id,
    required this.doctorId,
    required this.dispensaryId,
    this.date,
    this.startTime,
    this.endTime,
    this.reason,
    this.isModifiedSession = false,
    this.maxPatients,
    this.minutesPerPatient,
    this.timeSlotConfigId,
    this.isDateRange = false,
    this.startDate,
    this.endDate,
  });

  factory AbsentTimeSlot.fromJson(Map<String, dynamic> json) {
    return AbsentTimeSlot(
      id: json['_id'] ?? json['id'] ?? '',
      doctorId: json['doctorId'] is Map
          ? json['doctorId']['_id'] ?? ''
          : json['doctorId'] ?? '',
      dispensaryId: json['dispensaryId'] is Map
          ? json['dispensaryId']['_id'] ?? ''
          : json['dispensaryId'] ?? '',
      date: json['date'] != null ? DateTime.tryParse(json['date']) : null,
      startTime: json['startTime'],
      endTime: json['endTime'],
      reason: json['reason'],
      isModifiedSession: json['isModifiedSession'] ?? false,
      maxPatients: json['maxPatients'],
      minutesPerPatient: json['minutesPerPatient'],
      timeSlotConfigId: json['timeSlotConfigId'] is Map
          ? json['timeSlotConfigId']['_id']
          : json['timeSlotConfigId'],
      isDateRange: json['isDateRange'] ?? false,
      startDate: json['startDate'] != null
          ? DateTime.tryParse(json['startDate'])
          : null,
      endDate: json['endDate'] != null
          ? DateTime.tryParse(json['endDate'])
          : null,
    );
  }
}

class Session {
  final String? configId;
  final String startTime;
  final String endTime;
  final int maxPatients;
  final int bookedCount;
  final int availableSlots;
  final int minutesPerPatient;

  Session({
    this.configId,
    required this.startTime,
    required this.endTime,
    this.maxPatients = 20,
    this.bookedCount = 0,
    this.availableSlots = 0,
    this.minutesPerPatient = 15,
  });

  factory Session.fromJson(Map<String, dynamic> json) {
    return Session(
      configId: json['configId'] ?? json['_id'],
      startTime: json['startTime'] ?? '',
      endTime: json['endTime'] ?? '',
      maxPatients: json['maxPatients'] ?? 20,
      bookedCount: json['bookedCount'] ?? json['currentBookings'] ?? 0,
      availableSlots: json['availableSlots'] ?? 0,
      minutesPerPatient: json['minutesPerPatient'] ?? 15,
    );
  }

  String get display => '$startTime - $endTime';
}

class ReplacementDoctor {
  final String id;
  final String doctorId;
  final String dispensaryId;
  final String replacementName;
  final DateTime startDate;
  final DateTime endDate;
  final String? reason;

  ReplacementDoctor({
    required this.id,
    required this.doctorId,
    required this.dispensaryId,
    required this.replacementName,
    required this.startDate,
    required this.endDate,
    this.reason,
  });

  factory ReplacementDoctor.fromJson(Map<String, dynamic> json) {
    return ReplacementDoctor(
      id: json['_id'] ?? json['id'] ?? '',
      doctorId: json['doctorId'] is Map
          ? json['doctorId']['_id'] ?? ''
          : json['doctorId'] ?? '',
      dispensaryId: json['dispensaryId'] is Map
          ? json['dispensaryId']['_id'] ?? ''
          : json['dispensaryId'] ?? '',
      replacementName: json['replacementName'] ?? '',
      startDate: DateTime.parse(json['startDate']),
      endDate: DateTime.parse(json['endDate']),
      reason: json['reason'],
    );
  }
}
