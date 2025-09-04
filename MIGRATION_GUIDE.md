# 🔐 Auth0 to MongoDB Migration Guide

This guide documents the migration from Auth0 to custom MongoDB-based authentication implemented for the MyClinic application.

## ✅ Migration Status: COMPLETED

### What Was Implemented:

1. **✅ Custom Authentication System**
   - MongoDB-based user authentication
   - Password hashing with bcryptjs
   - JWT token generation and validation
   - Custom login/register endpoints

2. **✅ Roles Management**
   - Separate `roles` collection in MongoDB
   - Pre-defined roles: super-admin, dispensary-admin, dispensary-staff, doctor
   - Permission-based access control

3. **✅ User Management APIs**
   - Create, read, update, delete users (Super Admin only)
   - Role assignment and dispensary assignment
   - Hybrid authentication (supports both Auth0 and custom JWT during transition)

4. **✅ Frontend Integration**
   - Updated login flow to try custom auth first, fallback to Auth0
   - New role management UI component
   - Backward compatibility maintained

5. **✅ Database Schema**
   - Updated User model with role field
   - New Role model with permissions
   - Maintained backward compatibility with existing Auth0 users

---

## 🚀 How to Use the New System

### 1. Set Up Environment Variables

Add to your `.env` file:
```bash
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
MONGODB_URI=mongodb://localhost:27017/doctor-reservation
```

### 2. Initialize Database

```bash
# Seed roles into database
npm run seed:roles

# Create initial super admin user
npm run create:super-admin
```

### 3. Default Super Admin Credentials
- **Email**: `admin@myclinic.com`
- **Password**: `admin123`
- **⚠️ IMPORTANT**: Change this password after first login!

### 4. Start the Server

```bash
npm run dev
```

---

## 🔧 API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/custom-auth/login` | Login with email/password |
| POST | `/api/custom-auth/register` | Register new user |
| GET | `/api/custom-auth/me` | Get current user profile |

### Admin Endpoints (Super Admin Only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | Get all users |
| POST | `/api/admin/users` | Create new user |
| PUT | `/api/admin/users/:id` | Update user |
| DELETE | `/api/admin/users/:id` | Delete user |
| GET | `/api/admin/roles` | Get all roles |
| GET | `/api/admin/dispensaries` | Get all dispensaries |

---

## 👥 Role System

### Available Roles:

1. **Super Administrator** (`super-admin`)
   - Full system access
   - Can manage all users, roles, dispensaries
   - Cannot be deleted

2. **Dispensary Administrator** (`dispensary-admin`)  
   - Manages specific dispensary
   - Can manage doctors, time slots, bookings
   - Requires dispensary assignment

3. **Dispensary Staff** (`dispensary-staff`)
   - Basic dispensary operations
   - Can create and manage bookings
   - Requires dispensary assignment

4. **Doctor** (`doctor`)
   - Can view and update bookings
   - Medical practitioner role

### Permissions System:

Each role has specific permissions:
- `manage:users` - Create, edit, delete users
- `manage:roles` - Manage role assignments  
- `manage:dispensaries` - Manage dispensaries
- `manage:doctors` - Manage doctors
- `manage:fees` - Manage fee structures
- `view:reports` - Access reports
- `manage:timeslots` - Manage time slots
- `create:bookings` - Create bookings
- `view:bookings` - View bookings
- `update:bookings` - Update bookings

---

## 🔄 Migration Features

### Hybrid Authentication
During the transition period, the system supports both:
- **New Custom JWT tokens** (for new users)
- **Auth0 tokens** (for existing users - backward compatibility)

### Existing User Handling
- Existing Auth0 users remain in the system
- They appear without roles initially (role = null)
- Super admins can assign roles to existing users through the UI

### Fallback Strategy
1. Login attempts try custom authentication first
2. If custom auth fails, falls back to Auth0
3. This allows smooth transition without breaking existing users

---

## 🎨 Frontend Updates

### New Components:
- `CustomRoleAssignment.tsx` - Complete role management interface
- Updated login flow in `Login.tsx`
- Enhanced auth functions in `auth0.ts`

### UI Features:
- **User Management Table** - View all users with roles and dispensaries
- **Create User Dialog** - Add new users with role assignment
- **Edit User Dialog** - Update roles and dispensary assignments  
- **Role-based Badges** - Visual role indicators
- **Dispensary Assignment** - For dispensary roles

---

## ⚡ Testing the Migration

### Test Authentication:
```bash
# Test super admin login
curl -X POST http://localhost:5001/api/custom-auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@myclinic.com","password":"admin123"}'

# Test getting user profile (use token from login response)  
curl -X GET http://localhost:5001/api/custom-auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Test User Management:
```bash
# Create new user
curl -X POST http://localhost:5001/api/admin/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"name":"Test User","email":"test@example.com","password":"test123","role":"doctor"}'
```

---

## 🛠️ System Architecture

### Database Collections:

1. **users** - User accounts with authentication
   ```javascript
   {
     name: String,
     email: String, 
     passwordHash: String,
     role: ObjectId (ref: Role),
     dispensaryIds: [ObjectId],
     isActive: Boolean,
     auth0Id: String // For backward compatibility
   }
   ```

2. **roles** - Available system roles
   ```javascript
   {
     name: String,
     displayName: String,
     description: String,
     permissions: [String],
     isActive: Boolean
   }
   ```

### Security Features:
- **Password Hashing**: bcryptjs with salt rounds = 10
- **JWT Tokens**: 24-hour expiration
- **Role-based Access Control**: Permission-based authorization
- **Input Validation**: Email format, password length, role validation

---

## 📋 Next Steps (Optional)

### Complete Auth0 Removal:
1. Remove Auth0 packages from `package.json`
2. Remove Auth0 environment variables
3. Clean up Auth0-related code in `authRoutes.js`
4. Remove Auth0 fallback logic from middleware

### Production Checklist:
- [ ] Change default super admin password
- [ ] Set strong JWT_SECRET
- [ ] Configure HTTPS
- [ ] Add rate limiting
- [ ] Set up proper logging
- [ ] Configure backup strategy

---

## 🎯 Benefits Achieved

✅ **Full Control**: No dependency on external Auth0 service  
✅ **Cost Savings**: No more Auth0 subscription fees  
✅ **Custom Roles**: Tailored permission system for clinic needs  
✅ **Better Integration**: Direct MongoDB integration  
✅ **Scalability**: No Auth0 user limits  
✅ **Data Privacy**: All user data stays in your database  
✅ **Flexibility**: Easy to customize authentication logic  

## 🔧 Troubleshooting

### Common Issues:

1. **Token Expired**: JWT tokens expire after 24 hours - users need to log in again
2. **Role Not Found**: Ensure roles are seeded with `npm run seed:roles`
3. **Permission Denied**: Check user role has required permissions
4. **Database Connection**: Verify MONGODB_URI in .env file

### Support:
For issues or questions about the migration, check:
- Server logs for authentication errors
- Database connectivity
- Environment variable configuration
- Role and permission assignments

---

**Migration Completed Successfully!** 🎉

The system now supports custom MongoDB authentication with full backward compatibility. Users can immediately start using the new authentication system while existing Auth0 users continue to work during the transition period.