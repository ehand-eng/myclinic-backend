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
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { Card, LoadingSpinner, EmptyState, Button } from '../../components';
import { timeSlotService, doctorService } from '../../api/services';
import { TimeSlotConfig, Doctor, DAYS_OF_WEEK } from '../../types';
import { colors, spacing, fontSizes, borderRadius, commonStyles } from '../../styles/theme';

interface RouteParams {
    doctor?: Doctor;
}

const TimeSlotsListScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const route = useRoute();
    const params = route.params as RouteParams | undefined;
    const { selectedDispensary } = useAuth();

    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(params?.doctor || null);
    const [timeSlots, setTimeSlots] = useState<TimeSlotConfig[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const loadData = useCallback(async () => {
        if (!selectedDispensary) return;

        try {
            if (!selectedDoctor) {
                const doctorList = await doctorService.getByDispensary(selectedDispensary._id);
                setDoctors(doctorList);
                setTimeSlots([]);
            } else {
                const slots = await timeSlotService.getByDoctorAndDispensary(
                    selectedDoctor._id,
                    selectedDispensary._id
                );
                setTimeSlots(slots);
            }
        } catch (error) {
            console.error('Error loading data:', error);
            Alert.alert('Error', 'Failed to load time slots');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [selectedDispensary, selectedDoctor]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        navigation.setOptions({
            title: selectedDoctor ? `${selectedDoctor.name}'s Schedule` : 'Time Slots',
        });
    }, [selectedDoctor, navigation]);

    const handleRefresh = () => {
        setIsRefreshing(true);
        loadData();
    };

    const handleSelectDoctor = (doctor: Doctor) => {
        setSelectedDoctor(doctor);
        setIsLoading(true);
    };

    const handleBackToDoctors = () => {
        setSelectedDoctor(null);
        setTimeSlots([]);
        setIsLoading(true);
    };

    const handleAddTimeSlot = () => {
        if (!selectedDoctor) return;
        navigation.navigate('TimeSlotForm', { mode: 'add', doctor: selectedDoctor });
    };

    const handleEditTimeSlot = (slot: TimeSlotConfig) => {
        navigation.navigate('TimeSlotForm', {
            mode: 'edit',
            doctor: selectedDoctor,
            timeSlot: slot,
        });
    };

    const handleDeleteTimeSlot = (slot: TimeSlotConfig) => {
        Alert.alert(
            'Delete Time Slot',
            `Are you sure you want to delete this time slot for ${DAYS_OF_WEEK[slot.dayOfWeek]}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await timeSlotService.delete(slot._id);
                            loadData();
                            Alert.alert('Success', 'Time slot deleted successfully');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete time slot');
                        }
                    },
                },
            ]
        );
    };

    const handleManageAbsent = () => {
        if (!selectedDoctor) return;
        navigation.navigate('AbsentList', { doctor: selectedDoctor });
    };

    if (isLoading) {
        return <LoadingSpinner message="Loading..." />;
    }

    // If no doctor selected, show doctor list
    if (!selectedDoctor) {
        return (
            <View style={commonStyles.container}>
                <FlatList
                    data={doctors}
                    renderItem={({ item }) => (
                        <TouchableOpacity onPress={() => handleSelectDoctor(item)}>
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
                    refreshControl={
                        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
                    }
                    ListEmptyComponent={
                        <EmptyState
                            icon="people-outline"
                            title="No Doctors"
                            message="Add doctors first to manage their time slots"
                        />
                    }
                />
            </View>
        );
    }

    // Show time slots for selected doctor
    const groupedSlots = timeSlots.reduce((acc, slot) => {
        if (!acc[slot.dayOfWeek]) acc[slot.dayOfWeek] = [];
        acc[slot.dayOfWeek].push(slot);
        return acc;
    }, {} as Record<number, TimeSlotConfig[]>);

    const renderTimeSlotItem = ({ item }: { item: TimeSlotConfig }) => (
        <Card>
            <View style={styles.slotHeader}>
                <View style={styles.dayBadge}>
                    <Text style={styles.dayText}>{DAYS_OF_WEEK[item.dayOfWeek].substring(0, 3)}</Text>
                </View>
                <View style={styles.slotInfo}>
                    <Text style={styles.timeText}>
                        {item.startTime} - {item.endTime}
                    </Text>
                    <Text style={styles.slotDetails}>
                        {item.maxPatients} patients • {item.minutesPerPatient} min/patient
                    </Text>
                </View>
                <View style={[styles.statusIndicator, { backgroundColor: item.isActive ? colors.success : colors.error }]} />
            </View>

            <View style={styles.slotActions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleEditTimeSlot(item)}>
                    <Ionicons name="create-outline" size={18} color={colors.primary} />
                    <Text style={[styles.actionText, { color: colors.primary }]}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleDeleteTimeSlot(item)}>
                    <Ionicons name="trash-outline" size={18} color={colors.error} />
                    <Text style={[styles.actionText, { color: colors.error }]}>Delete</Text>
                </TouchableOpacity>
            </View>
        </Card>
    );

    return (
        <View style={commonStyles.container}>
            {/* Header with back button */}
            <View style={styles.headerRow}>
                <TouchableOpacity onPress={handleBackToDoctors} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerTitle}>{selectedDoctor.name}</Text>
                    <Text style={styles.headerSubtitle}>{selectedDoctor.specialization}</Text>
                </View>
                <TouchableOpacity onPress={handleManageAbsent} style={styles.absentBtn}>
                    <Ionicons name="calendar-outline" size={20} color={colors.warning} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={timeSlots.sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime))}
                renderItem={renderTimeSlotItem}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
                }
                ListEmptyComponent={
                    <EmptyState
                        icon="time-outline"
                        title="No Time Slots"
                        message="Add time slots to enable bookings for this doctor"
                        action={<Button title="Add Time Slot" onPress={handleAddTimeSlot} />}
                    />
                }
            />

            <TouchableOpacity style={styles.fab} onPress={handleAddTimeSlot}>
                <Ionicons name="add" size={28} color={colors.textWhite} />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    list: {
        padding: spacing.md,
        paddingBottom: spacing.xxl * 2,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backBtn: {
        padding: spacing.sm,
    },
    headerInfo: {
        flex: 1,
        marginLeft: spacing.sm,
    },
    headerTitle: {
        fontSize: fontSizes.lg,
        fontWeight: '600',
        color: colors.text,
    },
    headerSubtitle: {
        fontSize: fontSizes.sm,
        color: colors.textSecondary,
    },
    absentBtn: {
        padding: spacing.sm,
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
    slotHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dayBadge: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
        marginRight: spacing.md,
    },
    dayText: {
        color: colors.textWhite,
        fontSize: fontSizes.sm,
        fontWeight: '600',
    },
    slotInfo: {
        flex: 1,
    },
    timeText: {
        fontSize: fontSizes.lg,
        fontWeight: '600',
        color: colors.text,
    },
    slotDetails: {
        fontSize: fontSizes.sm,
        color: colors.textSecondary,
        marginTop: 2,
    },
    statusIndicator: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    slotActions: {
        flexDirection: 'row',
        marginTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.borderLight,
        paddingTop: spacing.md,
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

export default TimeSlotsListScreen;
