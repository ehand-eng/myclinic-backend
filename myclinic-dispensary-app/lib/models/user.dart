class User {
  final String id;
  final String name;
  final String email;
  final String? mobile;
  final String role;
  final List<String> dispensaryIds;
  final List<String>? permissions;
  final bool isActive;
  final bool mustChangePassword;
  final DateTime? lastLogin;

  User({
    required this.id,
    required this.name,
    required this.email,
    this.mobile,
    required this.role,
    required this.dispensaryIds,
    this.permissions,
    this.isActive = true,
    this.mustChangePassword = false,
    this.lastLogin,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      mobile: json['mobile'],
      role: _extractRole(json),
      dispensaryIds: _extractDispensaryIds(json),
      permissions: json['permissions'] != null
          ? List<String>.from(json['permissions'])
          : null,
      isActive: json['isActive'] ?? true,
      mustChangePassword: json['mustChangePassword'] ?? false,
      lastLogin: json['lastLogin'] != null
          ? DateTime.tryParse(json['lastLogin'])
          : null,
    );
  }

  static String _extractRole(Map<String, dynamic> json) {
    if (json['role'] is Map) {
      return json['role']['name'] ?? '';
    }
    return json['role'] ?? '';
  }

  static List<String> _extractDispensaryIds(Map<String, dynamic> json) {
    if (json['dispensaryIds'] == null) return [];
    return List<String>.from(
      (json['dispensaryIds'] as List).map((e) {
        if (e is Map) return e['_id'] ?? e['id'] ?? '';
        return e.toString();
      }),
    );
  }

  bool get isDispensaryAdmin =>
      role == 'dispensary-admin' ||
      role == 'dispensary_admin' ||
      role == 'hospital_admin' ||
      role == 'hospital-admin';

  bool get canManageDoctors => isDispensaryAdmin;
  bool get canManageTimeslots => isDispensaryAdmin;
  bool get canManageBookings => isDispensaryAdmin;
  bool get canViewReports => isDispensaryAdmin;
  bool get canManagePatientCheckIn => isDispensaryAdmin;
  bool get canCreateBookings => false; // dispensary-admin cannot create
}
