class BookingFees {
  final double doctorFee;
  final double dispensaryFee;
  final double bookingCommission;
  final double channelPartnerFee;
  final double totalFee;

  BookingFees({
    this.doctorFee = 0,
    this.dispensaryFee = 0,
    this.bookingCommission = 0,
    this.channelPartnerFee = 0,
    this.totalFee = 0,
  });

  factory BookingFees.fromJson(Map<String, dynamic>? json) {
    if (json == null) return BookingFees();
    return BookingFees(
      doctorFee: (json['doctorFee'] as num?)?.toDouble() ?? 0,
      dispensaryFee: (json['dispensaryFee'] as num?)?.toDouble() ?? 0,
      bookingCommission: (json['bookingCommission'] as num?)?.toDouble() ?? 0,
      channelPartnerFee: (json['channelPartnerFee'] as num?)?.toDouble() ?? 0,
      totalFee: (json['totalFee'] as num?)?.toDouble() ?? 0,
    );
  }
}

class Booking {
  final String id;
  final String? transactionId;
  final String? patientName;
  final String? patientPhone;
  final String? patientEmail;
  final String? symptoms;
  final String? notes;
  final String? doctorId;
  final String? doctorName;
  final String? doctorSpecialization;
  final String? dispensaryId;
  final String? dispensaryName;
  final String? dispensaryAddress;
  final DateTime? bookingDate;
  final String? timeSlot;
  final String? estimatedTime;
  final int? appointmentNumber;
  final String status;
  final BookingFees fees;
  final String? paymentStatus;
  final String? paymentMethod;
  final bool isPaid;
  final bool isPatientVisited;
  final String? bookedBy;
  final DateTime? checkedInTime;
  final DateTime? completedTime;
  final DateTime? createdAt;

  Booking({
    required this.id,
    this.transactionId,
    this.patientName,
    this.patientPhone,
    this.patientEmail,
    this.symptoms,
    this.notes,
    this.doctorId,
    this.doctorName,
    this.doctorSpecialization,
    this.dispensaryId,
    this.dispensaryName,
    this.dispensaryAddress,
    this.bookingDate,
    this.timeSlot,
    this.estimatedTime,
    this.appointmentNumber,
    this.status = 'scheduled',
    this.fees = const _EmptyFees(),
    this.paymentStatus,
    this.paymentMethod,
    this.isPaid = false,
    this.isPatientVisited = false,
    this.bookedBy,
    this.checkedInTime,
    this.completedTime,
    this.createdAt,
  });

  factory Booking.fromJson(Map<String, dynamic> json) {
    final doctor = json['doctorId'] is Map ? json['doctorId'] : null;
    final dispensary =
        json['dispensaryId'] is Map ? json['dispensaryId'] : null;

    return Booking(
      id: json['_id'] ?? json['id'] ?? '',
      transactionId: json['transactionId'],
      patientName: json['patientName'],
      patientPhone: json['patientPhone'],
      patientEmail: json['patientEmail'],
      symptoms: json['symptoms'],
      notes: json['notes'],
      doctorId: doctor != null
          ? (doctor['_id'] ?? doctor['id'])
          : json['doctorId']?.toString(),
      doctorName: doctor?['name'] ?? json['doctorName'],
      doctorSpecialization: doctor?['specialization'],
      dispensaryId: dispensary != null
          ? (dispensary['_id'] ?? dispensary['id'])
          : json['dispensaryId']?.toString(),
      dispensaryName: dispensary?['name'] ?? json['dispensaryName'],
      dispensaryAddress: dispensary?['address'],
      bookingDate: json['bookingDate'] != null
          ? DateTime.tryParse(json['bookingDate'])
          : null,
      timeSlot: json['timeSlot'],
      estimatedTime: json['estimatedTime'],
      appointmentNumber: json['appointmentNumber'],
      status: json['status'] ?? 'scheduled',
      fees: BookingFees.fromJson(json['fees']),
      paymentStatus: json['paymentStatus'],
      paymentMethod: json['paymentMethod'],
      isPaid: json['isPaid'] ?? false,
      isPatientVisited: json['isPatientVisited'] ?? false,
      bookedBy: json['bookedBy'],
      checkedInTime: json['checkedInTime'] != null
          ? DateTime.tryParse(json['checkedInTime'])
          : null,
      completedTime: json['completedTime'] != null
          ? DateTime.tryParse(json['completedTime'])
          : null,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'])
          : null,
    );
  }

  String get statusDisplay {
    switch (status) {
      case 'scheduled':
        return 'Scheduled';
      case 'checked_in':
        return 'Checked In';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      case 'no_show':
        return 'No Show';
      default:
        return status;
    }
  }
}

class _EmptyFees implements BookingFees {
  const _EmptyFees();
  @override
  double get doctorFee => 0;
  @override
  double get dispensaryFee => 0;
  @override
  double get bookingCommission => 0;
  @override
  double get channelPartnerFee => 0;
  @override
  double get totalFee => 0;
}
