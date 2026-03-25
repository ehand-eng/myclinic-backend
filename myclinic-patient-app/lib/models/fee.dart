class DoctorDispensaryFee {
  final String id;
  final String doctorId;
  final String? doctorName;
  final String dispensaryId;
  final String? dispensaryName;
  final double doctorFee;
  final double dispensaryFee;
  final double bookingCommission;
  final double? channelPartnerFee;
  final double totalFee;

  const DoctorDispensaryFee({
    required this.id,
    required this.doctorId,
    this.doctorName,
    required this.dispensaryId,
    this.dispensaryName,
    this.doctorFee = 0,
    this.dispensaryFee = 0,
    this.bookingCommission = 0,
    this.channelPartnerFee,
    this.totalFee = 0,
  });

  factory DoctorDispensaryFee.fromJson(Map<String, dynamic> json) {
    final df = (json['doctorFee'] ?? 0).toDouble();
    final dpf = (json['dispensaryFee'] ?? 0).toDouble();
    final bc = (json['bookingCommission'] ?? 0).toDouble();
    final cpf = json['channelPartnerFee']?.toDouble();
    return DoctorDispensaryFee(
      id: json['_id'] ?? json['id'] ?? '',
      doctorId: json['doctorId'] is Map
          ? json['doctorId']['_id'] ?? ''
          : json['doctorId'] ?? '',
      doctorName: json['doctorName'] ?? (json['doctorId'] is Map ? json['doctorId']['name'] : null),
      dispensaryId: json['dispensaryId'] is Map
          ? json['dispensaryId']['_id'] ?? ''
          : json['dispensaryId'] ?? '',
      dispensaryName: json['dispensaryName'] ?? (json['dispensaryId'] is Map ? json['dispensaryId']['name'] : null),
      doctorFee: df,
      dispensaryFee: dpf,
      bookingCommission: bc,
      channelPartnerFee: cpf,
      totalFee: (json['totalFee'] ?? (df + dpf + bc)).toDouble(),
    );
  }

  Map<String, dynamic> toJson() => {
        '_id': id,
        'doctorId': doctorId,
        'doctorName': doctorName,
        'dispensaryId': dispensaryId,
        'dispensaryName': dispensaryName,
        'doctorFee': doctorFee,
        'dispensaryFee': dispensaryFee,
        'bookingCommission': bookingCommission,
        'channelPartnerFee': channelPartnerFee,
        'totalFee': totalFee,
      };
}
