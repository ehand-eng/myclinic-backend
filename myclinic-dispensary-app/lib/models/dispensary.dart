class Dispensary {
  final String id;
  final String name;
  final String? address;
  final String? contactNumber;
  final String? email;
  final String? description;
  final List<String> doctorIds;
  final double? latitude;
  final double? longitude;
  final int bookingVisibleDays;
  final int bookingCutoffMinutes;

  Dispensary({
    required this.id,
    required this.name,
    this.address,
    this.contactNumber,
    this.email,
    this.description,
    this.doctorIds = const [],
    this.latitude,
    this.longitude,
    this.bookingVisibleDays = 30,
    this.bookingCutoffMinutes = 60,
  });

  factory Dispensary.fromJson(Map<String, dynamic> json) {
    return Dispensary(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      address: json['address'],
      contactNumber: json['contactNumber'],
      email: json['email'],
      description: json['description'],
      doctorIds: json['doctors'] != null
          ? List<String>.from((json['doctors'] as List).map((e) {
              if (e is Map) return e['_id'] ?? e['id'] ?? '';
              return e.toString();
            }))
          : [],
      latitude: json['location']?['coordinates'] != null
          ? (json['location']['coordinates'][1] as num?)?.toDouble()
          : null,
      longitude: json['location']?['coordinates'] != null
          ? (json['location']['coordinates'][0] as num?)?.toDouble()
          : null,
      bookingVisibleDays: json['bookingVisibleDays'] ?? 30,
      bookingCutoffMinutes: json['bookingCutoffMinutes'] ?? 60,
    );
  }
}
