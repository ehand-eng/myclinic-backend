class User {
  final String id;
  final String name;
  final String? email;
  final String? mobile;
  final String? nationality;
  final String? role;
  final List<String> dispensaryIds;
  final bool isActive;
  final bool isProfileComplete;
  final String? lastLogin;

  const User({
    required this.id,
    required this.name,
    this.email,
    this.mobile,
    this.nationality,
    this.role,
    this.dispensaryIds = const [],
    this.isActive = true,
    this.isProfileComplete = false,
    this.lastLogin,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      email: json['email'],
      mobile: json['mobile'],
      nationality: json['nationality'],
      role: json['role'] is Map ? json['role']['name'] : json['role'],
      dispensaryIds: List<String>.from(json['dispensaryIds'] ?? []),
      isActive: json['isActive'] ?? true,
      isProfileComplete: json['isProfileComplete'] ?? false,
      lastLogin: json['lastLogin'],
    );
  }

  Map<String, dynamic> toJson() => {
        '_id': id,
        'name': name,
        'email': email,
        'mobile': mobile,
        'nationality': nationality,
        'role': role,
        'dispensaryIds': dispensaryIds,
        'isActive': isActive,
        'isProfileComplete': isProfileComplete,
        'lastLogin': lastLogin,
      };

  User copyWith({
    String? id,
    String? name,
    String? email,
    String? mobile,
    String? nationality,
    String? role,
    List<String>? dispensaryIds,
    bool? isActive,
    bool? isProfileComplete,
    String? lastLogin,
  }) {
    return User(
      id: id ?? this.id,
      name: name ?? this.name,
      email: email ?? this.email,
      mobile: mobile ?? this.mobile,
      nationality: nationality ?? this.nationality,
      role: role ?? this.role,
      dispensaryIds: dispensaryIds ?? this.dispensaryIds,
      isActive: isActive ?? this.isActive,
      isProfileComplete: isProfileComplete ?? this.isProfileComplete,
      lastLogin: lastLogin ?? this.lastLogin,
    );
  }
}

class AuthResponse {
  final String message;
  final String token;
  final User user;
  final bool isNewUser;

  const AuthResponse({
    required this.message,
    required this.token,
    required this.user,
    this.isNewUser = false,
  });

  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    return AuthResponse(
      message: json['message'] ?? '',
      token: json['token'] ?? '',
      user: User.fromJson(json['user'] ?? {}),
      isNewUser: json['isNewUser'] ?? false,
    );
  }
}
