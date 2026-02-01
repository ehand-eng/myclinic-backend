import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { format, addDays, subDays } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { Card, LoadingSpinner, EmptyState, Button, StatusBadge } from '../../components';
import { bookingService, doctorService } from '../../api/services';
import { FormattedBooking, Doctor } from '../../types';
import { colors, spacing, fontSizes, borderRadius, commonStyles } from '../../styles/theme';

const BookingsListScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const { selectedDispensary } = useAuth();

    const [bookings, setBookings] = useState<FormattedBooking[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const loadDoctors = useCallback(async () => {
        if (!selectedDispensary) return;
        try {
            const data = await doctorService.getByDispensary(selectedDispensary._id);
            setDoctors(data);
        } catch (error) {
            console.error('Error loading doctors:', error);
        }
    }, [selectedDispensary]);

    const loadBookings = useCallback(async () => {
        if (!selectedDispensary) return;

        try {
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            const params: any = {
                date: dateStr,
                dispensaryId: selectedDispensary._id,
            };

            if (selectedDoctor) {
                params.doctorId = selectedDoctor._id;
            }

            const response = await bookingService.search(params);
            setBookings(response.bookings || []);
        } catch (error) {
            console.error('Error loading bookings:', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [selectedDispensary, selectedDate, selectedDoctor]);

    useEffect(() => {
        loadDoctors();
    }, [loadDoctors]);

    useEffect(() => {
        setIsLoading(true);
        loadBookings();
    }, [loadBookings]);

    const handleRefresh = () => {
        setIsRefreshing(true);
        loadBookings();
    };

    const handlePreviousDay = () => {
        setSelectedDate(subDays(selectedDate, 1));
    };

    const handleNextDay = () => {
        setSelectedDate(addDays(selectedDate, 1));
    };

    const handleToday = () => {
        setSelectedDate(new Date());
    };

    const handleViewBooking = (booking: FormattedBooking) => {
        navigation.navigate('BookingDetail', { booking });
    };

    const handleAddWalkIn = () => {
        navigation.navigate('WalkInBooking');
    };

    const handleCancelBooking = (booking: FormattedBooking) => {
        Alert.alert('Cancel Booking', `Cancel booking for ${booking.patientName}?`, [
            { text: 'No', style: 'cancel' },
            {
                text: 'Yes, Cancel',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await bookingService.cancel(booking._id, 'Cancelled by admin');
                        loadBookings();
                        Alert.alert('Success', 'Booking cancelled successfully');
                    } catch (error) {
                        Alert.alert('Error', 'Failed to cancel booking');
                    }
                },
            },
        ]);
    };

    if (isLoading && bookings.length === 0) {
        return <LoadingSpinner message="Loading bookings..." />;
    }

    const renderBookingItem = ({ item }: { item: FormattedBooking }) => (
        <TouchableOpacity onPress={() => handleViewBooking(item)}>
            <Card>
                <View style={styles.bookingHeader}>
                    <View style={styles.appointmentBadge}>
                        <Text style={styles.appointmentNumber}>#{item.appointmentNumber}</Text>
                    </View>
                    <StatusBadge status={item.status} />
                </View>

                <View style={styles.bookingContent}>
                    <View style={styles.row}>
                        <Ionicons name="person" size={16} color={colors.textSecondary} />
                        <Text style={styles.patientName}>{item.patientName}</Text>
                    </View>
                    <View style={styles.row}>
                        <Ionicons name="call" size={16} color={colors.textSecondary} />
                        <Text style={styles.detailText}>{item.patientPhone}</Text>
                    </View>
                    <View style={styles.row}>
                        <Ionicons name="time" size={16} color={colors.textSecondary} />
                        <Text style={styles.detailText}>{item.timeSlot} • Est. {item.estimatedTime}</Text>
                    </View>
                    {item.doctor && (
                        <View style={styles.row}>
                            <Ionicons name="medical" size={16} color={colors.textSecondary} />
                            <Text style={styles.detailText}>{item.doctor.name}</Text>
                        </View>
                    )}
                </View>

                {item.status === 'scheduled' && (
                    <View style={styles.actionRow}>
                        <TouchableOpacity
                            style={styles.actionBtn}
                            onPress={() => handleCancelBooking(item)}
                        >
                            <Ionicons name="close-circle-outline" size={18} color={colors.error} />
                            <Text style={[styles.actionText, { color: colors.error }]}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </Card>
        </TouchableOpacity>
    );

    return (
        <View style={commonStyles.container}>
            {/* Date Navigation */}
            <View style={styles.dateNav}>
                <TouchableOpacity onPress={handlePreviousDay} style={styles.navBtn}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleToday}>
                    <Text style={styles.dateText}>{format(selectedDate, 'EEE, MMM d, yyyy')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleNextDay} style={styles.navBtn}>
                    <Ionicons name="chevron-forward" size={24} color={colors.text} />
                </TouchableOpacity>
            </View>

            {/* Doctor Filter */}
            <View style={styles.filterContainer}>
                <ScrollableFilter
                    options={[{ _id: '', name: 'All Doctors' }, ...doctors]}
                    selected={selectedDoctor?._id || ''}
                    onSelect={(id) => {
                        setSelectedDoctor(doctors.find((d) => d._id === id) || null);
                    }}
                />
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
                <View style={styles.stat}>
                    <Text style={styles.statNum}>{bookings.length}</Text>
                    <Text style={styles.statLabel}>Total</Text>
                </View>
                <View style={styles.stat}>
                    <Text style={[styles.statNum, { color: colors.success }]}>
                        {bookings.filter((b) => b.status === 'completed').length}
                    </Text>
                    <Text style={styles.statLabel}>Completed</Text>
                </View>
                <View style={styles.stat}>
                    <Text style={[styles.statNum, { color: colors.warning }]}>
                        {bookings.filter((b) => b.status === 'scheduled' || b.status === 'checked_in').length}
                    </Text>
                    <Text style={styles.statLabel}>Pending</Text>
                </View>
                <View style={styles.stat}>
                    <Text style={[styles.statNum, { color: colors.error }]}>
                        {bookings.filter((b) => b.status === 'cancelled').length}
                    </Text>
                    <Text style={styles.statLabel}>Cancelled</Text>
                </View>
            </View>

            <FlatList
                data={bookings.sort((a, b) => a.appointmentNumber - b.appointmentNumber)}
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
                        message={`No bookings found for ${format(selectedDate, 'MMM d, yyyy')}`}
                        action={<Button title="Add Walk-in" onPress={handleAddWalkIn} />}
                    />
                }
            />

            <TouchableOpacity style={styles.fab} onPress={handleAddWalkIn}>
                <Ionicons name="add" size={28} color={colors.textWhite} />
            </TouchableOpacity>
        </View>
    );
};

// Simple scrollable filter component
const ScrollableFilter: React.FC<{
    options: { _id: string; name: string }[];
    selected: string;
    onSelect: (id: string) => void;
}> = ({ options, selected, onSelect }) => (
    <View style={styles.filterScroll}>
        {options.map((option) => (
            <TouchableOpacity
                key={option._id}
                style={[styles.filterChip, selected === option._id && styles.filterChipActive]}
                onPress={() => onSelect(option._id)}
            >
                <Text style={[styles.filterText, selected === option._id && styles.filterTextActive]}>
                    {option.name}
                </Text>
            </TouchableOpacity>
        ))}
    </View>
);

const styles = StyleSheet.create({
    dateNav: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.md,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    navBtn: {
        padding: spacing.sm,
    },
    dateText: {
        fontSize: fontSizes.lg,
        fontWeight: '600',
        color: colors.text,
    },
    filterContainer: {
        backgroundColor: colors.surface,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
    },
    filterScroll: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    filterChip: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        borderWidth: 1,
        borderColor: colors.border,
        marginRight: spacing.sm,
        marginBottom: spacing.xs,
    },
    filterChipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    filterText: {
        fontSize: fontSizes.sm,
        color: colors.text,
    },
    filterTextActive: {
        color: colors.textWhite,
        fontWeight: '600',
    },
    statsRow: {
        flexDirection: 'row',
        backgroundColor: colors.surface,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    stat: {
        flex: 1,
        alignItems: 'center',
    },
    statNum: {
        fontSize: fontSizes.xl,
        fontWeight: 'bold',
        color: colors.text,
    },
    statLabel: {
        fontSize: fontSizes.xs,
        color: colors.textSecondary,
    },
    list: {
        padding: spacing.md,
        paddingBottom: spacing.xxl * 2,
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
        marginBottom: spacing.sm,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    patientName: {
        fontSize: fontSizes.md,
        fontWeight: '600',
        color: colors.text,
        marginLeft: spacing.sm,
    },
    detailText: {
        fontSize: fontSizes.sm,
        color: colors.textSecondary,
        marginLeft: spacing.sm,
    },
    actionRow: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: colors.borderLight,
        paddingTop: spacing.sm,
        marginTop: spacing.sm,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.xs,
    },
    actionText: {
        fontSize: fontSizes.sm,
        marginLeft: spacing.xs,
        fontWeight: '500',
    },
    fab: {
        position: 'absolute',
        right: spacing.lg,
        bottom: spacing.lg,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
});

export default BookingsListScreen;
