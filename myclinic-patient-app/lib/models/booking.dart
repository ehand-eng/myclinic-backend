class BookingFees {
  final double doctorFee;
  final double dispensaryFee;
  final double bookingCommission;
  final double? channelPartnerFee;
  final double totalFee;

  const BookingFees({
    this.doctorFee = 0,
    this.dispensaryFee = 0,
    this.bookingCommission = 0,
    this.channelPartnerFee,
    this.totalFee = 0,
  });

  factory BookingFees.fromJson(dynamic json) {
    if (json == null || json is! Map) return const BookingFees();
    return BookingFees(
      doctorFee: _parseDouble(json['doctorFee']),
      dispensaryFee: _parseDouble(json['dispensaryFee']),
      bookingCommission: _parseDouble(json['bookingCommission']),
      channelPartnerFee: json['channelPartnerFee'] != null ? _parseDouble(json['channelPartnerFee']) : null,
      totalFee: _parseDouble(json['totalFee']),
    );
  }

  static double _parseDouble(dynamic value) {
    if (value == null) return 0.0;
    if (value is num) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? 0.0;
    return 0.0;
  }

  Map<String, dynamic> toJson() => {
        'doctorFee': doctorFee,
        'dispensaryFee': dispensaryFee,
        'bookingCommission': bookingCommission,
        'channelPartnerFee': channelPartnerFee,
        'totalFee': totalFee,
      };
}

class Booking {
  final String id;
  final String transactionId;
  final String? patientId;
  final String patientName;
  final String patientPhone;
  final String? patientEmail;
  final dynamic doctorId;
  final dynamic dispensaryId;
  final int appointmentNumber;
  final String bookingDate;
  final String timeSlot;
  final String? timeSlotConfigId;
  final String estimatedTime;
  final String status;
  final String? symptoms;
  final String? notes;
  final String? checkedInTime;
  final String? completedTime;
  final BookingFees fees;
  final bool isPaid;
  final String? paymentStatus;
  final String? paymentMethod;
  final bool isPatientVisited;
  final String? bookedBy;
  final String createdAt;

  const Booking({
    required this.id,
    required this.transactionId,
    this.patientId,
    required this.patientName,
    required this.patientPhone,
    this.patientEmail,
    required this.doctorId,
    required this.dispensaryId,
    required this.appointmentNumber,
    required this.bookingDate,
    required this.timeSlot,
    this.timeSlotConfigId,
    required this.estimatedTime,
    required this.status,
    this.symptoms,
    this.notes,
    this.checkedInTime,
    this.completedTime,
    required this.fees,
    this.isPaid = false,
    this.paymentStatus,
    this.paymentMethod,
    this.isPatientVisited = false,
    this.bookedBy,
    required this.createdAt,
  });

  static String _parseStr(dynamic value) {
    if (value == null) return '';
    if (value is String) return value;
    return value.toString();
  }

  static int _parseInt(dynamic value) {
    if (value == null) return 0;
    if (value is int) return value;
    if (value is double) return value.toInt();
    if (value is String) return int.tryParse(value) ?? 0;
    return 0;
  }

  factory Booking.fromJson(Map<String, dynamic> json) {
    return Booking(
      id: _parseStr(json['_id'] ?? json['id']),
      transactionId: _parseStr(json['transactionId']),
      patientId: json['patientId']?.toString(),
      patientName: _parseStr(json['patientName']),
      patientPhone: _parseStr(json['patientPhone']),
      patientEmail: json['patientEmail']?.toString(),
      doctorId: json['doctorId'] ?? json['doctor'],
      dispensaryId: json['dispensaryId'] ?? json['dispensary'],
      appointmentNumber: _parseInt(json['appointmentNumber']),
      bookingDate: _parseStr(json['bookingDate']),
      timeSlot: _parseStr(json['timeSlot']),
      timeSlotConfigId: json['timeSlotConfigId']?.toString(),
      estimatedTime: _parseStr(json['estimatedTime']),
      status: _parseStr(json['status'] ?? 'scheduled'),
      symptoms: json['symptoms']?.toString(),
      notes: json['notes']?.toString(),
      checkedInTime: json['checkedInTime']?.toString(),
      completedTime: json['completedTime']?.toString(),
      fees: BookingFees.fromJson(json['fees']),
      isPaid: json['isPaid'] == true || json['isPaid'] == 'true',
      paymentStatus: json['paymentStatus']?.toString(),
      paymentMethod: json['paymentMethod']?.toString(),
      isPatientVisited: json['isPatientVisited'] == true || json['isPatientVisited'] == 'true',
      bookedBy: json['bookedBy']?.toString(),
      createdAt: _parseStr(json['createdAt']),
    );
  }

  Map<String, dynamic> toJson() => {
        '_id': id,
        'transactionId': transactionId,
        'patientId': patientId,
        'patientName': patientName,
        'patientPhone': patientPhone,
        'patientEmail': patientEmail,
        'doctorId': doctorId,
        'dispensaryId': dispensaryId,
        'appointmentNumber': appointmentNumber,
        'bookingDate': bookingDate,
        'timeSlot': timeSlot,
        'timeSlotConfigId': timeSlotConfigId,
        'estimatedTime': estimatedTime,
        'status': status,
        'symptoms': symptoms,
        'notes': notes,
        'fees': fees.toJson(),
        'isPaid': isPaid,
        'paymentStatus': paymentStatus,
        'paymentMethod': paymentMethod,
        'isPatientVisited': isPatientVisited,
        'bookedBy': bookedBy,
        'createdAt': createdAt,
      };

  String get doctorName {
    if (doctorId is Map) return doctorId['name'] ?? '';
    return '';
  }

  String get doctorSpecialization {
    if (doctorId is Map) return doctorId['specialization'] ?? '';
    return '';
  }

  String get doctorIdStr {
    if (doctorId is Map) return doctorId['_id'] ?? doctorId['id'] ?? '';
    return doctorId?.toString() ?? '';
  }

  String get dispensaryName {
    if (dispensaryId is Map) return dispensaryId['name'] ?? '';
    return '';
  }

  String get dispensaryAddress {
    if (dispensaryId is Map) return dispensaryId['address'] ?? '';
    return '';
  }

  String get dispensaryIdStr {
    if (dispensaryId is Map) return dispensaryId['_id'] ?? dispensaryId['id'] ?? '';
    return dispensaryId?.toString() ?? '';
  }

  String get dispensaryContact {
    if (dispensaryId is Map) return dispensaryId['contactNumber'] ?? '';
    return '';
  }

  bool get isUpcoming => status == 'scheduled' || status == 'checked_in';

  /// Get the actual appointment DateTime from bookingDate + estimatedTime
  DateTime? get appointmentDateTime {
    try {
      final date = DateTime.parse(bookingDate);
      if (estimatedTime.isNotEmpty && estimatedTime.contains(':')) {
        final parts = estimatedTime.split(':').map(int.parse).toList();
        return DateTime(date.year, date.month, date.day, parts[0], parts.length > 1 ? parts[1] : 0);
      }
      return DateTime(date.year, date.month, date.day, 23, 59);
    } catch (_) {
      return null;
    }
  }

  /// Whether the booking appointment time has already passed
  bool get isPastBooking {
    final apptDt = appointmentDateTime;
    if (apptDt == null) return false;
    return apptDt.isBefore(DateTime.now());
  }

  /// Whether the booking is within 24 hours of the appointment time
  bool get isWithin24Hours {
    final apptDt = appointmentDateTime;
    if (apptDt == null) return false;
    final diff = apptDt.millisecondsSinceEpoch - DateTime.now().millisecondsSinceEpoch;
    return diff < 24 * 60 * 60 * 1000;
  }

  /// Can amend: status is scheduled AND not within 24 hours AND not past
  bool get canAmend => status == 'scheduled' && !isWithin24Hours && !isPastBooking;

  /// Can cancel: status is scheduled AND not within 24 hours AND not past
  bool get canCancel => status == 'scheduled' && !isWithin24Hours && !isPastBooking;

  /// Is scheduled but within 24 hours (show warning message)
  bool get isScheduledButLocked => status == 'scheduled' && (isWithin24Hours || isPastBooking);

  Booking copyWith({
    String? id,
    String? transactionId,
    String? patientId,
    String? patientName,
    String? patientPhone,
    String? patientEmail,
    dynamic doctorId,
    dynamic dispensaryId,
    int? appointmentNumber,
    String? bookingDate,
    String? timeSlot,
    String? timeSlotConfigId,
    String? estimatedTime,
    String? status,
    String? symptoms,
    String? notes,
    String? checkedInTime,
    String? completedTime,
    BookingFees? fees,
    bool? isPaid,
    String? paymentStatus,
    String? paymentMethod,
    bool? isPatientVisited,
    String? bookedBy,
    String? createdAt,
  }) {
    return Booking(
      id: id ?? this.id,
      transactionId: transactionId ?? this.transactionId,
      patientId: patientId ?? this.patientId,
      patientName: patientName ?? this.patientName,
      patientPhone: patientPhone ?? this.patientPhone,
      patientEmail: patientEmail ?? this.patientEmail,
      doctorId: doctorId ?? this.doctorId,
      dispensaryId: dispensaryId ?? this.dispensaryId,
      appointmentNumber: appointmentNumber ?? this.appointmentNumber,
      bookingDate: bookingDate ?? this.bookingDate,
      timeSlot: timeSlot ?? this.timeSlot,
      timeSlotConfigId: timeSlotConfigId ?? this.timeSlotConfigId,
      estimatedTime: estimatedTime ?? this.estimatedTime,
      status: status ?? this.status,
      symptoms: symptoms ?? this.symptoms,
      notes: notes ?? this.notes,
      checkedInTime: checkedInTime ?? this.checkedInTime,
      completedTime: completedTime ?? this.completedTime,
      fees: fees ?? this.fees,
      isPaid: isPaid ?? this.isPaid,
      paymentStatus: paymentStatus ?? this.paymentStatus,
      paymentMethod: paymentMethod ?? this.paymentMethod,
      isPatientVisited: isPatientVisited ?? this.isPatientVisited,
      bookedBy: bookedBy ?? this.bookedBy,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
