class Doctor {
  final String id;
  final String name;
  final String? specialization;
  final List<String> qualifications;
  final String? contactNumber;
  final String? email;
  final String? profilePicture;
  final List<String> dispensaryIds;
  final bool disabled;

  Doctor({
    required this.id,
    required this.name,
    this.specialization,
    this.qualifications = const [],
    this.contactNumber,
    this.email,
    this.profilePicture,
    this.dispensaryIds = const [],
    this.disabled = false,
  });

  factory Doctor.fromJson(Map<String, dynamic> json) {
    return Doctor(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      specialization: json['specialization'],
      qualifications: json['qualifications'] != null
          ? List<String>.from(json['qualifications'])
          : [],
      contactNumber: json['contactNumber'],
      email: json['email'],
      profilePicture: json['profilePicture'],
      dispensaryIds: json['dispensaries'] != null
          ? List<String>.from((json['dispensaries'] as List).map((e) {
              if (e is Map) return e['_id'] ?? e['id'] ?? '';
              return e.toString();
            }))
          : [],
      disabled: json['disabled'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'specialization': specialization,
      'qualifications': qualifications,
      'contactNumber': contactNumber,
      'email': email,
      'profilePicture': profilePicture,
      'dispensaries': dispensaryIds,
    };
  }
}
