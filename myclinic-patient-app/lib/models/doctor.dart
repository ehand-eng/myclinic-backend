class Doctor {
  final String id;
  final String name;
  final String specialization;
  final List<String> qualifications;
  final String? contactNumber;
  final String? email;
  final String? profilePicture;
  final List<String> dispensaries;
  final int? bookingVisibleDays;
  final bool disabled;

  const Doctor({
    required this.id,
    required this.name,
    required this.specialization,
    this.qualifications = const [],
    this.contactNumber,
    this.email,
    this.profilePicture,
    this.dispensaries = const [],
    this.bookingVisibleDays,
    this.disabled = false,
  });

  factory Doctor.fromJson(Map<String, dynamic> json) {
    return Doctor(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      specialization: json['specialization'] ?? '',
      qualifications: List<String>.from(json['qualifications'] ?? []),
      contactNumber: json['contactNumber'],
      email: json['email'],
      profilePicture: json['profilePicture'],
      dispensaries: (json['dispensaries'] as List?)
              ?.map((d) => d is Map ? (d['_id'] ?? d['id'] ?? '').toString() : d.toString())
              .toList() ??
          [],
      bookingVisibleDays: json['bookingVisibleDays'],
      disabled: json['disabled'] ?? false,
    );
  }

  Map<String, dynamic> toJson() => {
        '_id': id,
        'name': name,
        'specialization': specialization,
        'qualifications': qualifications,
        'contactNumber': contactNumber,
        'email': email,
        'profilePicture': profilePicture,
        'dispensaries': dispensaries,
        'bookingVisibleDays': bookingVisibleDays,
        'disabled': disabled,
      };

  String get initials {
    final parts = name.split(' ');
    if (parts.length >= 2) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    return name.isNotEmpty ? name[0].toUpperCase() : '?';
  }

  Doctor copyWith({
    String? id,
    String? name,
    String? specialization,
    List<String>? qualifications,
    String? contactNumber,
    String? email,
    String? profilePicture,
    List<String>? dispensaries,
    int? bookingVisibleDays,
    bool? disabled,
  }) {
    return Doctor(
      id: id ?? this.id,
      name: name ?? this.name,
      specialization: specialization ?? this.specialization,
      qualifications: qualifications ?? this.qualifications,
      contactNumber: contactNumber ?? this.contactNumber,
      email: email ?? this.email,
      profilePicture: profilePicture ?? this.profilePicture,
      dispensaries: dispensaries ?? this.dispensaries,
      bookingVisibleDays: bookingVisibleDays ?? this.bookingVisibleDays,
      disabled: disabled ?? this.disabled,
    );
  }
}
