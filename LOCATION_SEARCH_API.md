# Location-Based Doctor Search API

## Overview

Geospatial search API to find doctors and dispensaries based on user's location coordinates. Uses Haversine formula to calculate distances accurately.

---

## Endpoints

### 1. Find Doctors Nearby 🎯 **RECOMMENDED**

**Endpoint:** `GET /api/location/doctors-nearby`

**Description:** Finds nearest dispensaries and returns all available doctors at those locations with distance and fee information.

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `latitude` | number | ✅ Yes | - | User's latitude |
| `longitude` | number | ✅ Yes | - | User's longitude |
| `limit` | number | No | 10 | Max dispensaries to search (max 50) |
| `maxDistance` | number | No | 50 | Max search radius in km |

**Example Request:**
```bash
GET /api/location/doctors-nearby?latitude=6.9271&longitude=79.8612&limit=5&maxDistance=20
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "count": 12,
  "userLocation": {
    "latitude": 6.9271,
    "longitude": 79.8612
  },
  "searchRadius": 20,
  "doctors": [
    {
      "_id": "doctor_id",
      "name": "Dr. John Silva",
      "specialization": "Cardiologist",
      "qualifications": ["MBBS", "MD"],
      "contactNumber": "+94771234567",
      "email": "drjohn@example.com",
      "profilePicture": "url_here",
      "nearestDistance": 2.5,
      "availableAt": [
        {
          "dispensaryId": "dispensary_id",
          "dispensaryName": "City Medical Center",
          "dispensaryAddress": "123 Main St, Colombo",
          "distance": 2.5,
          "location": {
            "latitude": 6.9300,
            "longitude": 79.8650
          },
          "fees": {
            "doctorFee": 2000,
            "dispensaryFee": 500,
            "totalFee": 2500
          }
        }
      ]
    }
  ],
  "nearbyDispensaries": [
    {
      "_id": "dispensary_id",
      "name": "City Medical Center",
      "address": "123 Main St, Colombo",
      "distance": 2.5,
      "location": {
        "latitude": 6.9300,
        "longitude": 79.8650
      }
    }
  ]
}
```

**Key Features:**
- ✅ Doctors sorted by nearest dispensary distance
- ✅ Each doctor shows all dispensaries they're available at
- ✅ Includes fees per dispensary location
- ✅ Distance in kilometers (rounded to 2 decimals)
- ✅ Only shows active doctor-dispensary relationships

---

### 2. Find Dispensaries Nearby

**Endpoint:** `GET /api/location/dispensaries-nearby`

**Description:** Finds nearest dispensaries with basic information.

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `latitude` | number | ✅ Yes | - | User's latitude |
| `longitude` | number | ✅ Yes | - | User's longitude |
| `limit` | number | No | 10 | Max results (max 50) |
| `maxDistance` | number | No | 50 | Max search radius in km |

**Example Request:**
```bash
GET /api/location/dispensaries-nearby?latitude=6.9271&longitude=79.8612&limit=10
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "count": 8,
  "userLocation": {
    "latitude": 6.9271,
    "longitude": 79.8612
  },
  "searchRadius": 50,
  "dispensaries": [
    {
      "_id": "dispensary_id",
      "name": "City Medical Center",
      "address": "123 Main St, Colombo",
      "contactNumber": "+94112345678",
      "email": "info@citymedical.lk",
      "description": "Premium healthcare facility",
      "location": {
        "latitude": 6.9300,
        "longitude": 79.8650
      },
      "doctorCount": 15,
      "distance": 2.5
    }
  ]
}
```

---

### 3. Get Doctors at Specific Dispensaries

**Endpoint:** `POST /api/location/doctors-at-dispensaries`

**Description:** Gets all doctors available at specified dispensaries (useful after finding nearby dispensaries).

**Request Body:**
```json
{
  "dispensaryIds": [
    "dispensary_id_1",
    "dispensary_id_2"
  ]
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "count": 8,
  "doctors": [
    {
      "_id": "doctor_id",
      "name": "Dr. John Silva",
      "specialization": "Cardiologist",
      "qualifications": ["MBBS", "MD"],
      "contactNumber": "+94771234567",
      "email": "drjohn@example.com",
      "profilePicture": "url",
      "availableAt": [
        {
          "dispensaryId": "disp_id",
          "dispensaryName": "City Medical",
          "dispensaryAddress": "123 Main St",
          "fees": {
            "doctorFee": 2000,
            "dispensaryFee": 500,
            "totalFee": 2500
          }
        }
      ]
    }
  ]
}
```

---

## Usage Examples

### JavaScript/Node.js

```javascript
const axios = require('axios');

// Find nearby doctors
async function findNearbyDoctors(lat, lon) {
  const response = await axios.get('http://localhost:5001/api/location/doctors-nearby', {
    params: {
      latitude: lat,
      longitude: lon,
      limit: 10,
      maxDistance: 20
    }
  });
  
  return response.data.doctors;
}

// Usage
const doctors = await findNearbyDoctors(6.9271, 79.8612);
doctors.forEach(doctor => {
  console.log(`${doctor.name} - ${doctor.specialization}`);
  console.log(`  Nearest: ${doctor.nearestDistance}km`);
  doctor.availableAt.forEach(loc => {
    console.log(`  - ${loc.dispensaryName}: Rs. ${loc.fees.totalFee}`);
  });
});
```

### Flutter/Dart

```dart
import 'package:dio/dio.dart';

class LocationService {
  final Dio _dio = Dio(BaseOptions(baseUrl: 'http://localhost:5001/api/location'));
  
  Future<List<dynamic>> findNearbyDoctors(double lat, double lon) async {
    final response = await _dio.get('/doctors-nearby', queryParameters: {
      'latitude': lat,
      'longitude': lon,
      'limit': 10,
      'maxDistance': 20,
    });
    
    return response.data['doctors'];
  }
  
  Future<List<dynamic>> findNearbyDispensaries(double lat, double lon) async {
    final response = await _dio.get('/dispensaries-nearby', queryParameters: {
      'latitude': lat,
      'longitude': lon,
      'limit': 10,
    });
    
    return response.data['dispensaries'];
  }
}

// Usage
final locationService = LocationService();
final doctors = await locationService.findNearbyDoctors(6.9271, 79.8612);
```

### cURL Examples

```bash
# Find nearby doctors (Colombo coordinates)
curl "http://localhost:5001/api/location/doctors-nearby?latitude=6.9271&longitude=79.8612&limit=5&maxDistance=20"

# Find nearby dispensaries
curl "http://localhost:5001/api/location/dispensaries-nearby?latitude=6.9271&longitude=79.8612&limit=10"

# Get doctors at specific dispensaries
curl -X POST http://localhost:5001/api/location/doctors-at-dispensaries \
  -H "Content-Type: application/json" \
  -d '{"dispensaryIds":["dispensary_id_1","dispensary_id_2"]}'
```

---

## Distance Calculation

Uses **Haversine formula** for accurate distance calculation:

```javascript
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c; // Distance in kilometers
}
```

**Accuracy:** ±0.5% for distances up to 100km

---

## Recommended Workflow

### Option 1: Direct Doctor Search (Simplest)
```javascript
// 1. Get user's location
const location = await getCurrentLocation();

// 2. Find nearby doctors
const result = await findNearbyDoctors(
  location.latitude, 
  location.longitude
);

// 3. Display doctors sorted by distance
result.doctors.forEach(doctor => {
  // Show doctor card with nearest location
});
```

### Option 2: Two-Step Search
```javascript
// 1. Find nearby dispensaries first
const dispensaries = await findNearbyDispensaries(lat, lon);

// 2. Get doctors at those dispensaries
const doctors = await getDoctorsAtDispensaries(
  dispensaries.map(d => d._id)
);

// 3. Display results
```

---

## Common Coordinates (Sri Lanka)

| Location | Latitude | Longitude |
|----------|----------|-----------|
| Colombo Fort | 6.9271 | 79.8612 |
| Kandy | 7.2906 | 80.6337 |
| Galle | 6.0535 | 80.2210 |
| Jaffna | 9.6615 | 80.0255 |
| Negombo | 7.2008 | 79.8736 |

---

## Performance Considerations

### Current Implementation
- ✅ Simple calculation-based approach
- ✅ Works with existing schema
- ⚠️ Scans all dispensaries in memory
- 📊 Fast for < 1000 dispensaries

### For Large Scale (Future)
Consider MongoDB geospatial indexes:

```javascript
// Update Dispensary schema
location: {
  type: {
    type: String,
    enum: ['Point'],
    default: 'Point'
  },
  coordinates: {
    type: [Number], // [longitude, latitude]
    index: '2dsphere'
  }
}

// Query with $near
const dispensaries = await Dispensary.find({
  location: {
    $near: {
      $geometry: {
        type: 'Point',
        coordinates: [longitude, latitude]
      },
      $maxDistance: maxDistance * 1000 // meters
    }
  }
}).limit(10);
```

---

## Error Responses

**400 Bad Request:**
```json
{
  "message": "Latitude and longitude are required"
}
```

**400 Bad Request (Invalid coordinates):**
```json
{
  "message": "Invalid latitude or longitude"
}
```

**500 Internal Server Error:**
```json
{
  "message": "Failed to find nearby doctors",
  "error": "error details here"
}
```

---

## Testing

```bash
# Test with Colombo coordinates
curl "http://localhost:5001/api/location/doctors-nearby?latitude=6.9271&longitude=79.8612&limit=5"

# Test with maxDistance filter
curl "http://localhost:5001/api/location/doctors-nearby?latitude=6.9271&longitude=79.8612&maxDistance=10"

# Test dispensaries only
curl "http://localhost:5001/api/location/dispensaries-nearby?latitude=6.9271&longitude=79.8612"
```

---

## Notes

- Distances are in **kilometers**
- Coordinates use **decimal degrees** format
- Results sorted by distance (nearest first)
- Only shows **active** doctor-dispensary relationships
- Fee information included per location
- Maximum search radius: configurable (default 50km)
- Results are capped at 50 items max

---

## Support

For issues or questions, contact the development team.
