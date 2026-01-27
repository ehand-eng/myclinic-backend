const express = require('express');
const router = express.Router();
const Dispensary = require('../models/Dispensary');
const Doctor = require('../models/Doctor');
const DoctorDispensary = require('../models/DoctorDispensary');

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
}

function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

/**
 * Find doctors near a location
 * GET /api/location/doctors-nearby
 * Query params: latitude, longitude, limit (optional, default 10), maxDistance (optional, default 50km)
 */
router.get('/doctors-nearby', async (req, res) => {
    try {
        const { latitude, longitude, limit = 10, maxDistance = 50 } = req.query;

        // Validate input
        if (!latitude || !longitude) {
            return res.status(400).json({
                message: 'Latitude and longitude are required'
            });
        }

        const lat = parseFloat(latitude);
        const lon = parseFloat(longitude);
        const maxLimit = Math.min(parseInt(limit), 50); // Cap at 50
        const maxDist = parseFloat(maxDistance);

        if (isNaN(lat) || isNaN(lon)) {
            return res.status(400).json({
                message: 'Invalid latitude or longitude'
            });
        }

        // 1. Get all dispensaries with location data
        const allDispensaries = await Dispensary.find({
            'location.latitude': { $exists: true },
            'location.longitude': { $exists: true }
        });

        // 2. Calculate distances and sort
        const dispensariesWithDistance = allDispensaries
            .map(dispensary => ({
                ...dispensary.toObject(),
                distance: calculateDistance(
                    lat,
                    lon,
                    dispensary.location.latitude,
                    dispensary.location.longitude
                )
            }))
            .filter(d => d.distance <= maxDist) // Filter by max distance
            .sort((a, b) => a.distance - b.distance) // Sort by distance
            .slice(0, maxLimit); // Limit results

        if (dispensariesWithDistance.length === 0) {
            return res.json({
                message: 'No dispensaries found within the specified distance',
                doctors: [],
                dispensaries: []
            });
        }

        // 3. Get dispensary IDs
        const dispensaryIds = dispensariesWithDistance.map(d => d._id);

        // 4. Find active doctor-dispensary relationships
        const activeDoctorDispensaries = await DoctorDispensary.find({
            dispensaryId: { $in: dispensaryIds },
            isActive: true
        }).populate('doctorId');

        // 5. Build unique doctors list with their dispensaries and fees
        const doctorMap = new Map();

        for (const dd of activeDoctorDispensaries) {
            if (!dd.doctorId) continue; // Skip if doctor not found

            const doctorId = dd.doctorId._id.toString();
            const dispensary = dispensariesWithDistance.find(
                d => d._id.toString() === dd.dispensaryId.toString()
            );

            if (!doctorMap.has(doctorId)) {
                doctorMap.set(doctorId, {
                    _id: dd.doctorId._id,
                    name: dd.doctorId.name,
                    specialization: dd.doctorId.specialization,
                    qualifications: dd.doctorId.qualifications,
                    contactNumber: dd.doctorId.contactNumber,
                    email: dd.doctorId.email,
                    profilePicture: dd.doctorId.profilePicture,
                    availableAt: []
                });
            }

            // Add dispensary info to doctor
            if (dispensary) {
                doctorMap.get(doctorId).availableAt.push({
                    dispensaryId: dispensary._id,
                    dispensaryName: dispensary.name,
                    dispensaryAddress: dispensary.address,
                    distance: parseFloat(dispensary.distance.toFixed(2)),
                    location: dispensary.location,
                    fees: {
                        doctorFee: dd.doctorFee || 0,
                        dispensaryFee: dd.dispensaryFee || 0,
                        totalFee: (dd.doctorFee || 0) + (dd.dispensaryFee || 0)
                    }
                });
            }
        }

        // Convert map to array
        const doctors = Array.from(doctorMap.values());

        // Sort doctors by nearest dispensary distance
        doctors.forEach(doctor => {
            doctor.availableAt.sort((a, b) => a.distance - b.distance);
            doctor.nearestDistance = doctor.availableAt[0]?.distance || 0;
        });
        doctors.sort((a, b) => a.nearestDistance - b.nearestDistance);

        res.json({
            success: true,
            count: doctors.length,
            userLocation: { latitude: lat, longitude: lon },
            searchRadius: maxDist,
            doctors,
            nearbyDispensaries: dispensariesWithDistance.map(d => ({
                _id: d._id,
                name: d.name,
                address: d.address,
                distance: parseFloat(d.distance.toFixed(2)),
                location: d.location
            }))
        });

    } catch (error) {
        console.error('Error finding nearby doctors:', error);
        res.status(500).json({
            message: 'Failed to find nearby doctors',
            error: error.message
        });
    }
});

/**
 * Find nearest dispensaries only
 * GET /api/location/dispensaries-nearby
 * Query params: latitude, longitude, limit (optional, default 10), maxDistance (optional, default 50km)
 */
router.get('/dispensaries-nearby', async (req, res) => {
    try {
        const { latitude, longitude, limit = 10, maxDistance = 50 } = req.query;

        if (!latitude || !longitude) {
            return res.status(400).json({
                message: 'Latitude and longitude are required'
            });
        }

        const lat = parseFloat(latitude);
        const lon = parseFloat(longitude);
        const maxLimit = Math.min(parseInt(limit), 50);
        const maxDist = parseFloat(maxDistance);

        if (isNaN(lat) || isNaN(lon)) {
            return res.status(400).json({
                message: 'Invalid latitude or longitude'
            });
        }

        // Get all dispensaries with location
        const allDispensaries = await Dispensary.find({
            'location.latitude': { $exists: true },
            'location.longitude': { $exists: true }
        }).populate('doctors');

        // Calculate distances and sort
        const dispensariesWithDistance = allDispensaries
            .map(dispensary => ({
                _id: dispensary._id,
                name: dispensary.name,
                address: dispensary.address,
                contactNumber: dispensary.contactNumber,
                email: dispensary.email,
                description: dispensary.description,
                location: dispensary.location,
                doctorCount: dispensary.doctors?.length || 0,
                distance: calculateDistance(
                    lat,
                    lon,
                    dispensary.location.latitude,
                    dispensary.location.longitude
                )
            }))
            .filter(d => d.distance <= maxDist)
            .sort((a, b) => a.distance - b.distance)
            .slice(0, maxLimit);

        res.json({
            success: true,
            count: dispensariesWithDistance.length,
            userLocation: { latitude: lat, longitude: lon },
            searchRadius: maxDist,
            dispensaries: dispensariesWithDistance.map(d => ({
                ...d,
                distance: parseFloat(d.distance.toFixed(2))
            }))
        });

    } catch (error) {
        console.error('Error finding nearby dispensaries:', error);
        res.status(500).json({
            message: 'Failed to find nearby dispensaries',
            error: error.message
        });
    }
});

/**
 * Get doctors at specific dispensaries
 * POST /api/location/doctors-at-dispensaries
 * Body: { dispensaryIds: [...] }
 */
router.post('/doctors-at-dispensaries', async (req, res) => {
    try {
        const { dispensaryIds } = req.body;

        if (!dispensaryIds || !Array.isArray(dispensaryIds) || dispensaryIds.length === 0) {
            return res.status(400).json({
                message: 'dispensaryIds array is required'
            });
        }

        // Find active doctor-dispensary relationships
        const doctorDispensaries = await DoctorDispensary.find({
            dispensaryId: { $in: dispensaryIds },
            isActive: true
        }).populate('doctorId').populate('dispensaryId');

        // Group by doctor
        const doctorMap = new Map();

        for (const dd of doctorDispensaries) {
            if (!dd.doctorId) continue;

            const doctorId = dd.doctorId._id.toString();

            if (!doctorMap.has(doctorId)) {
                doctorMap.set(doctorId, {
                    _id: dd.doctorId._id,
                    name: dd.doctorId.name,
                    specialization: dd.doctorId.specialization,
                    qualifications: dd.doctorId.qualifications,
                    contactNumber: dd.doctorId.contactNumber,
                    email: dd.doctorId.email,
                    profilePicture: dd.doctorId.profilePicture,
                    availableAt: []
                });
            }

            doctorMap.get(doctorId).availableAt.push({
                dispensaryId: dd.dispensaryId._id,
                dispensaryName: dd.dispensaryId.name,
                dispensaryAddress: dd.dispensaryId.address,
                fees: {
                    doctorFee: dd.doctorFee || 0,
                    dispensaryFee: dd.dispensaryFee || 0,
                    totalFee: (dd.doctorFee || 0) + (dd.dispensaryFee || 0)
                }
            });
        }

        const doctors = Array.from(doctorMap.values());

        res.json({
            success: true,
            count: doctors.length,
            doctors
        });

    } catch (error) {
        console.error('Error finding doctors at dispensaries:', error);
        res.status(500).json({
            message: 'Failed to find doctors',
            error: error.message
        });
    }
});

module.exports = router;
