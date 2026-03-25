class DispensaryLocation {
  final double latitude;
  final double longitude;

  const DispensaryLocation({required this.latitude, required this.longitude});

  factory DispensaryLocation.fromJson(Map<String, dynamic> json) {
    return DispensaryLocation(
      latitude: (json['latitude'] ?? json['lat'] ?? 0).toDouble(),
      longitude: (json['longitude'] ?? json['lng'] ?? 0).toDouble(),
    );
  }

  Map<String, dynamic> toJson() => {
        'latitude': latitude,
        'longitude': longitude,
      };
}

class Dispensary {
  final String id;
  final String name;
  final String address;
  final String? contactNumber;
  final String? email;
  final String? description;
  final List<String> doctors;
  final DispensaryLocation? location;
  final int? bookingVisibleDays;
  final int? bookingCutoffMinutes;

  const Dispensary({
    required this.id,
    required this.name,
    required this.address,
    this.contactNumber,
    this.email,
    this.description,
    this.doctors = const [],
    this.location,
    this.bookingVisibleDays,
    this.bookingCutoffMinutes,
  });

  factory Dispensary.fromJson(Map<String, dynamic> json) {
    return Dispensary(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      address: json['address'] ?? '',
      contactNumber: json['contactNumber'],
      email: json['email'],
      description: json['description'],
      doctors: (json['doctors'] as List?)
              ?.map((d) => d is Map ? (d['_id'] ?? d['id'] ?? '').toString() : d.toString())
              .toList() ??
          [],
      location: json['location'] != null
          ? DispensaryLocation.fromJson(json['location'])
          : null,
      bookingVisibleDays: json['bookingVisibleDays'],
      bookingCutoffMinutes: json['bookingCutoffMinutes'],
    );
  }

  Map<String, dynamic> toJson() => {
        '_id': id,
        'name': name,
        'address': address,
        'contactNumber': contactNumber,
        'email': email,
        'description': description,
        'doctors': doctors,
        'location': location?.toJson(),
        'bookingVisibleDays': bookingVisibleDays,
        'bookingCutoffMinutes': bookingCutoffMinutes,
      };

  int get doctorCount => doctors.length;

  Dispensary copyWith({
    String? id,
    String? name,
    String? address,
    String? contactNumber,
    String? email,
    String? description,
    List<String>? doctors,
    DispensaryLocation? location,
    int? bookingVisibleDays,
    int? bookingCutoffMinutes,
  }) {
    return Dispensary(
      id: id ?? this.id,
      name: name ?? this.name,
      address: address ?? this.address,
      contactNumber: contactNumber ?? this.contactNumber,
      email: email ?? this.email,
      description: description ?? this.description,
      doctors: doctors ?? this.doctors,
      location: location ?? this.location,
      bookingVisibleDays: bookingVisibleDays ?? this.bookingVisibleDays,
      bookingCutoffMinutes: bookingCutoffMinutes ?? this.bookingCutoffMinutes,
    );
  }
}
