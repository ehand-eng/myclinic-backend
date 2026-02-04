import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    Alert,
    TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { Card, LoadingSpinner, EmptyState, StatusBadge, Button } from '../../components';
import { bookingService, doctorService, timeSlotService } from '../../api/services';
import { FormattedBooking, Doctor, Session } from '../../types';
import { colors, spacing, fontSizes, borderRadius, commonStyles } from '../../styles/theme';

const CheckInSessionScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const { selectedDispensary } = useAuth();

    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [selectedSession, setSelectedSession] = useState<Session | null>(null);
    const [bookings, setBookings] = useState<FormattedBooking[]>([]);
    const [filteredBookings, setFilteredBookings] = useState<FormattedBooking[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Global Search State
    const [globalSearchQuery, setGlobalSearchQuery] = useState('');
    const [globalSearchResults, setGlobalSearchResults] = useState<FormattedBooking[]>([]);
    const [isGlobalSearching, setIsGlobalSearching] = useState(false);
    const [showGlobalResults, setShowGlobalResults] = useState(false);

    // Load doctors
    const loadDoctors = useCallback(async () => {
        if (!selectedDispensary) return;
        try {
            const data = await doctorService.getByDispensary(selectedDispensary._id);
            setDoctors(data);
        } catch (error) {
            console.error('Error loading doctors:', error);
        } finally {
            setIsLoading(false);
        }
    }, [selectedDispensary]);

    useEffect(() => {
        loadDoctors();
    }, [loadDoctors]);

    // Load sessions for selected doctor
    const loadSessions = useCallback(async () => {
        if (!selectedDispensary || !selectedDoctor) {
            setSessions([]);
            return;
        }
        try {
            const today = format(new Date(), 'yyyy-MM-dd');
            const response = await timeSlotService.getSessions(
                selectedDoctor._id,
                selectedDispensary._id,
                today
            );
            setSessions(response.sessions || []);
        } catch (error) {
            console.error('Error loading sessions:', error);
        }
    }, [selectedDispensary, selectedDoctor]);

    useEffect(() => {
        loadSessions();
    }, [loadSessions]);

    // Load bookings for selected session
    const loadBookings = useCallback(async () => {
        if (!selectedDispensary || !selectedDoctor) {
            setBookings([]);
            return;
        }
        setIsRefreshing(true);
        try {
            const today = format(new Date(), 'yyyy-MM-dd');
            const response = await bookingService.getSessionBookings({
                dispensaryId: selectedDispensary._id,
                doctorId: selectedDoctor._id,
                date: today,
                sessionId: selectedSession?.timeSlotConfigId,
            });
            setBookings(response.bookings || []);
            setFilteredBookings(response.bookings || []);
        } catch (error) {
            console.error('Error loading bookings:', error);
        } finally {
            setIsRefreshing(false);
        }
    }, [selectedDispensary, selectedDoctor, selectedSession]);

    useEffect(() => {
        if (selectedDoctor) {
            loadBookings();
        }
    }, [loadBookings, selectedDoctor]);

    // Filter bookings based on search
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredBookings(bookings);
        } else {
            const query = searchQuery.toLowerCase();
            setFilteredBookings(
                bookings.filter(
                    (b) =>
                        b.patientName.toLowerCase().includes(query) ||
                        b.patientPhone.includes(query) ||
                        b.transactionId.toLowerCase().includes(query) ||
                        b.appointmentNumber.toString() === query
                )
            );
        }
    }, [searchQuery, bookings]);

    const handleCheckIn = async (booking: FormattedBooking) => {
        if (booking.status !== 'scheduled') {
            Alert.alert('Cannot Check In', 'This booking cannot be checked in.');
            return;
        }

        Alert.alert('Check In', `Check in ${booking.patientName}?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Check In',
                onPress: async () => {
                    try {
                        await bookingService.checkIn(booking._id);
                        Alert.alert('Success', `${booking.patientName} checked in successfully!`);
                        loadBookings();
                    } catch (error: any) {
                        const message = error.response?.data?.message || 'Failed to check in';
                        Alert.alert('Error', message);
                    }
                },
            },
        ]);
    };

    const handleRefresh = () => {
        loadBookings();
    };

    const performGlobalSearch = async () => {
        if (!globalSearchQuery.trim() || !selectedDispensary) return;

        setIsGlobalSearching(true);
        setShowGlobalResults(true);

        try {
            const searchParams: any = {
                dispensaryId: selectedDispensary._id,
                patientName: globalSearchQuery,
                patientPhone: globalSearchQuery,
                bookingReference: globalSearchQuery
            };

            // If query is numeric, it could be appointment number
            if (!isNaN(Number(globalSearchQuery))) {
                searchParams.appointmentNumber = globalSearchQuery;
            }

            const response = await bookingService.search(searchParams);
            setGlobalSearchResults(response.bookings || []);
        } catch (error) {
            console.error('Global search error:', error);
            Alert.alert('Error', 'Failed to search bookings');
        } finally {
            setIsGlobalSearching(false);
        }
    };

    const handleGlobalCheckIn = async (booking: FormattedBooking) => {
        if (booking.status !== 'scheduled') {
            Alert.alert('Cannot Check In', 'This booking cannot be checked in.');
            return;
        }

        Alert.alert('Check In', `Check in ${booking.patientName}?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Check In',
                onPress: async () => {
                    try {
                        await bookingService.checkIn(booking._id);
                        Alert.alert('Success', `${booking.patientName} checked in successfully!`);
                        // Refresh search results
                        performGlobalSearch();
                    } catch (error: any) {
                        const message = error.response?.data?.message || 'Failed to check in';
                        Alert.alert('Error', message);
                    }
                },
            },
        ]);
    };

    const clearGlobalSearch = () => {
        setGlobalSearchQuery('');
        setGlobalSearchResults([]);
        setShowGlobalResults(false);
    };

    // Step 1: Doctor Selection
    if (!selectedDoctor) {
        if (isLoading) {
            return <LoadingSpinner message="Loading doctors..." />;
        }

        return (
            <View style={commonStyles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Check-In</Text>
                    <Text style={styles.headerSubtitle}>Select a doctor to view today's bookings or search globally</Text>
                </View>

                {/* Global Search Bar */}
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by phone, name, or ID"
                        value={globalSearchQuery}
                        onChangeText={setGlobalSearchQuery}
                        placeholderTextColor={colors.textLight}
                        onSubmitEditing={performGlobalSearch}
                        returnKeyType="search"
                    />
                    {globalSearchQuery.length > 0 && (
                        <TouchableOpacity onPress={clearGlobalSearch}>
                            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        style={styles.searchButton}
                        onPress={performGlobalSearch}
                    >
                        <Text style={styles.searchButtonText}>Search</Text>
                    </TouchableOpacity>
                </View>

                {showGlobalResults ? (
                    <View style={{ flex: 1 }}>
                        <View style={styles.resultsHeader}>
                            <Text style={styles.resultsTitle}>Found {globalSearchResults.length} bookings</Text>
                            <TouchableOpacity onPress={clearGlobalSearch}>
                                <Text style={styles.clearSearchText}>Clear Results</Text>
                            </TouchableOpacity>
                        </View>

                        {isGlobalSearching ? (
                            <LoadingSpinner message="Searching..." />
                        ) : (
                            <FlatList
                                data={globalSearchResults}
                                renderItem={({ item }) => (
                                    <Card>
                                        <View style={styles.bookingHeader}>
                                            <View style={styles.appointmentBadge}>
                                                <Text style={styles.appointmentNumber}>#{item.appointmentNumber}</Text>
                                            </View>
                                            <StatusBadge status={item.status} />
                                        </View>

                                        <View style={styles.bookingContent}>
                                            <Text style={styles.patientName}>{item.patientName}</Text>
                                            <Text style={styles.patientPhone}>{item.patientPhone}</Text>
                                            <Text style={styles.timeText}>
                                                Date: {format(new Date(item.bookingDate), 'MMM d')} • {item.doctor.name}
                                            </Text>
                                        </View>

                                        {item.status === 'scheduled' && (
                                            <Button
                                                title="Check In"
                                                onPress={() => handleGlobalCheckIn(item)}
                                                variant="success"
                                                size="small"
                                            />
                                        )}

                                        {item.status === 'checked_in' && (
                                            <View style={styles.checkedInBadge}>
                                                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                                                <Text style={styles.checkedInText}>
                                                    Checked in at {item.checkedInTime ? format(new Date(item.checkedInTime), 'h:mm a') : ''}
                                                </Text>
                                            </View>
                                        )}
                                    </Card>
                                )}
                                keyExtractor={(item) => item._id}
                                contentContainerStyle={styles.list}
                                ListEmptyComponent={
                                    <EmptyState
                                        icon="search"
                                        title="No bookings found"
                                        message={`No bookings found matching "${globalSearchQuery}"`}
                                    />
                                }
                            />
                        )}
                    </View>
                ) : (

                    <FlatList
                        data={doctors}
                        renderItem={({ item }) => (
                            <TouchableOpacity onPress={() => setSelectedDoctor(item)}>
                                <Card>
                                    <View style={styles.doctorRow}>
                                        <View style={styles.doctorIcon}>
                                            <Ionicons name="person" size={24} color={colors.primary} />
                                        </View>
                                        <View style={styles.doctorInfo}>
                                            <Text style={styles.doctorName}>{item.name}</Text>
                                            <Text style={styles.doctorSpec}>{item.specialization}</Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={24} color={colors.textLight} />
                                    </View>
                                </Card>
                            </TouchableOpacity>
                        )}
                        keyExtractor={(item) => item._id}
                        contentContainerStyle={styles.list}
                        ListEmptyComponent={
                            <EmptyState
                                icon="people-outline"
                                title="No Doctors"
                                message="No doctors found for this dispensary"
                            />
                        }
                    />
                )}
            </View>
        );
    }

    // Step 2: Session Selection and Booking List
    const renderBookingItem = ({ item }: { item: FormattedBooking }) => (
        <Card>
            <View style={styles.bookingHeader}>
                <View style={styles.appointmentBadge}>
                    <Text style={styles.appointmentNumber}>#{item.appointmentNumber}</Text>
                </View>
                <StatusBadge status={item.status} />
            </View>

            <View style={styles.bookingContent}>
                <Text style={styles.patientName}>{item.patientName}</Text>
                <Text style={styles.patientPhone}>{item.patientPhone}</Text>
                <Text style={styles.timeText}>
                    Estimated: {item.estimatedTime} • Slot: {item.timeSlot}
                </Text>
            </View>

            {item.status === 'scheduled' && (
                <Button
                    title="Check In"
                    onPress={() => handleCheckIn(item)}
                    variant="success"
                    size="small"
                />
            )}

            {item.status === 'checked_in' && (
                <View style={styles.checkedInBadge}>
                    <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                    <Text style={styles.checkedInText}>
                        Checked in at {item.checkedInTime ? format(new Date(item.checkedInTime), 'h:mm a') : ''}
                    </Text>
                </View>
            )}
        </Card>
    );

    return (
        <View style={commonStyles.container}>
            {/* Doctor Header */}
            <View style={styles.doctorHeader}>
                <TouchableOpacity onPress={() => setSelectedDoctor(null)} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.doctorHeaderInfo}>
                    <Text style={styles.doctorHeaderName}>{selectedDoctor.name}</Text>
                    <Text style={styles.doctorHeaderDate}>{format(new Date(), 'EEEE, MMMM d, yyyy')}</Text>
                </View>
            </View>

            {/* Session Filter */}
            {sessions.length > 0 && (
                <View style={styles.sessionFilter}>
                    <TouchableOpacity
                        style={[styles.sessionChip, !selectedSession && styles.sessionChipActive]}
                        onPress={() => setSelectedSession(null)}
                    >
                        <Text style={[styles.sessionChipText, !selectedSession && styles.sessionChipTextActive]}>
                            All Sessions
                        </Text>
                    </TouchableOpacity>
                    {sessions.map((session, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.sessionChip,
                                selectedSession?.timeSlotConfigId === session.timeSlotConfigId && styles.sessionChipActive,
                            ]}
                            onPress={() => setSelectedSession(session)}
                        >
                            <Text
                                style={[
                                    styles.sessionChipText,
                                    selectedSession?.timeSlotConfigId === session.timeSlotConfigId && styles.sessionChipTextActive,
                                ]}
                            >
                                {session.timeSlot}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Search */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by name, phone, or appointment #"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholderTextColor={colors.textLight}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
                <View style={styles.stat}>
                    <Text style={[styles.statNum, { color: colors.info }]}>
                        {filteredBookings.filter((b) => b.status === 'scheduled').length}
                    </Text>
                    <Text style={styles.statLabel}>Waiting</Text>
                </View>
                <View style={styles.stat}>
                    <Text style={[styles.statNum, { color: colors.warning }]}>
                        {filteredBookings.filter((b) => b.status === 'checked_in').length}
                    </Text>
                    <Text style={styles.statLabel}>Checked In</Text>
                </View>
                <View style={styles.stat}>
                    <Text style={[styles.statNum, { color: colors.success }]}>
                        {filteredBookings.filter((b) => b.status === 'completed').length}
                    </Text>
                    <Text style={styles.statLabel}>Completed</Text>
                </View>
            </View>

            {/* Bookings List */}
            <FlatList
                data={filteredBookings.sort((a, b) => a.appointmentNumber - b.appointmentNumber)}
                renderItem={renderBookingItem}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
                }
                ListEmptyComponent={
                    <EmptyState
                        icon="calendar-outline"
                        title="No Bookings"
                        message="No bookings found for this session"
                    />
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        padding: spacing.lg,
        paddingTop: spacing.xl,
    },
    headerTitle: {
        fontSize: fontSizes.xxl,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: spacing.xs,
    },
    headerSubtitle: {
        fontSize: fontSizes.md,
        color: colors.textSecondary,
    },
    list: {
        padding: spacing.md,
        paddingBottom: spacing.xxl,
    },
    doctorRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    doctorIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.primaryLight + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    doctorInfo: {
        flex: 1,
    },
    doctorName: {
        fontSize: fontSizes.lg,
        fontWeight: '600',
        color: colors.text,
    },
    doctorSpec: {
        fontSize: fontSizes.sm,
        color: colors.textSecondary,
    },
    doctorHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backBtn: {
        padding: spacing.sm,
        marginRight: spacing.sm,
    },
    doctorHeaderInfo: {
        flex: 1,
    },
    doctorHeaderName: {
        fontSize: fontSizes.lg,
        fontWeight: '600',
        color: colors.text,
    },
    doctorHeaderDate: {
        fontSize: fontSizes.sm,
        color: colors.textSecondary,
    },
    sessionFilter: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: spacing.md,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    sessionChip: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        borderWidth: 1,
        borderColor: colors.border,
        marginRight: spacing.sm,
        marginBottom: spacing.xs,
    },
    sessionChipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    sessionChipText: {
        fontSize: fontSizes.sm,
        color: colors.text,
    },
    sessionChipTextActive: {
        color: colors.textWhite,
        fontWeight: '600',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        marginHorizontal: spacing.md,
        marginTop: spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: spacing.md,
    },
    searchIcon: {
        marginRight: spacing.sm,
    },
    searchInput: {
        flex: 1,
        paddingVertical: spacing.md,
        fontSize: fontSizes.md,
        color: colors.text,
    },
    statsRow: {
        flexDirection: 'row',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
    },
    stat: {
        flex: 1,
        alignItems: 'center',
    },
    statNum: {
        fontSize: fontSizes.xl,
        fontWeight: 'bold',
    },
    statLabel: {
        fontSize: fontSizes.xs,
        color: colors.textSecondary,
        marginTop: 2,
    },
    bookingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    appointmentBadge: {
        backgroundColor: colors.primary + '20',
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
    },
    appointmentNumber: {
        fontSize: fontSizes.md,
        fontWeight: '600',
        color: colors.primary,
    },
    bookingContent: {
        marginBottom: spacing.md,
    },
    patientName: {
        fontSize: fontSizes.lg,
        fontWeight: '600',
        color: colors.text,
    },
    patientPhone: {
        fontSize: fontSizes.md,
        color: colors.textSecondary,
        marginTop: 2,
    },
    timeText: {
        fontSize: fontSizes.sm,
        color: colors.textSecondary,
        marginTop: spacing.xs,
    },
    checkedInBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.success + '20',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
    },
    checkedInText: {
        fontSize: fontSizes.sm,
        color: colors.success,
        fontWeight: '500',
        marginLeft: spacing.sm,
    },
    searchButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.sm,
        marginLeft: spacing.sm,
    },
    searchButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: fontSizes.sm,
    },
    resultsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.sm,
    },
    resultsTitle: {
        fontSize: fontSizes.md,
        fontWeight: '600',
        color: colors.text,
    },
    clearSearchText: {
        color: colors.primary,
        fontSize: fontSizes.sm,
        fontWeight: '600',
    },
});

export default CheckInSessionScreen;
