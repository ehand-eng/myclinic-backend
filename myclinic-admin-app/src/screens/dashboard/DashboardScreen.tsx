import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { Card, LoadingSpinner } from '../../components';
import { doctorService, timeSlotService } from '../../api/services';
import { Doctor, DoctorSession } from '../../types';
import { colors, spacing, fontSizes, borderRadius, shadows, commonStyles } from '../../styles/theme';
import { format } from 'date-fns';

const DashboardScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const { user, selectedDispensary, logout } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [sessions, setSessions] = useState<DoctorSession[]>([]);

    const loadDashboardData = useCallback(async () => {
        if (!selectedDispensary) return;

        try {
            const today = format(new Date(), 'yyyy-MM-dd');

            const [doctorList, sessionResult] = await Promise.all([
                doctorService.getByDispensary(selectedDispensary._id),
                timeSlotService
                    .getSessionsByDispensary(selectedDispensary._id, today)
                    .catch(() => ({ sessions: [] })),
            ]);

            setDoctors(doctorList);
            setSessions(sessionResult.sessions);
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [selectedDispensary]);

    useEffect(() => {
        loadDashboardData();
    }, [loadDashboardData]);

    const handleRefresh = () => {
        setIsRefreshing(true);
        loadDashboardData();
    };

    const handleLogout = async () => {
        Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Sign Out',
                style: 'destructive',
                onPress: async () => {
                    await logout();
                },
            },
        ]);
    };

    const formatTime = (time: string) => {
        const [h, m] = time.split(':').map(Number);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const hour = h % 12 || 12;
        return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
    };

    // Compute aggregate totals across all sessions
    const totals = sessions.reduce(
        (acc, s) => ({
            total: acc.total + s.bookingStats.total,
            checkedIn: acc.checkedIn + s.bookingStats.checkedIn,
            scheduled: acc.scheduled + s.bookingStats.scheduled,
            cancelled: acc.cancelled + s.bookingStats.cancelled,
        }),
        { total: 0, checkedIn: 0, scheduled: 0, cancelled: 0 }
    );

    if (isLoading) {
        return <LoadingSpinner message="Loading dashboard..." />;
    }

    const menuItems = [
        {
            id: 'doctors',
            title: 'Doctors',
            subtitle: `${doctors.length} doctors`,
            icon: 'medical',
            color: colors.primary,
            screen: 'DoctorsList',
        },
        {
            id: 'timeslots',
            title: 'Time Slots',
            subtitle: 'Manage schedules',
            icon: 'time',
            color: colors.info,
            screen: 'TimeSlotsList',
        },
        {
            id: 'bookings',
            title: 'Bookings',
            subtitle: "Today's appointments",
            icon: 'calendar',
            color: colors.success,
            screen: 'BookingsList',
        },
        {
            id: 'checkin',
            title: 'Check-In',
            subtitle: 'Patient check-in',
            icon: 'checkmark-circle',
            color: colors.warning,
            screen: 'CheckInSession',
        },
        {
            id: 'ongoing',
            title: 'Ongoing Number',
            subtitle: 'Live counter',
            icon: 'speedometer',
            color: '#f97316',
            screen: 'OngoingNumber',
        },
        {
            id: 'reports',
            title: 'Reports',
            subtitle: 'View reports',
            icon: 'bar-chart',
            color: '#8b5cf6',
            screen: 'ReportsMenu',
        },
    ];

    return (
        <View style={commonStyles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0]}</Text>
                        <Text style={styles.dispensaryName}>{selectedDispensary?.name}</Text>
                    </View>
                    <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                        <Ionicons name="log-out-outline" size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>

                {/* Today's Summary Header */}
                <Card title="" subtitle="">
                    <View style={styles.summaryHeader}>
                        <View>
                            <Text style={styles.summaryTitle}>Today's Summary</Text>
                            <Text style={styles.summarySubtitle}>
                                {format(new Date(), 'EEEE, MMM d, yyyy')}
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={handleRefresh}
                            style={[styles.refreshBtn, isRefreshing && styles.refreshBtnActive]}
                            disabled={isRefreshing}
                        >
                            {isRefreshing ? (
                                <ActivityIndicator size="small" color={colors.primary} />
                            ) : (
                                <Ionicons name="refresh" size={22} color={colors.primary} />
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Aggregate totals row */}
                    <View style={[styles.statsGrid, isRefreshing && { opacity: 0.4 }]}>
                        <View style={[styles.statBox, { backgroundColor: colors.info + '20' }]}>
                            <Text style={[styles.statNumber, { color: colors.info }]}>
                                {totals.total}
                            </Text>
                            <Text style={styles.statLabel}>Total</Text>
                        </View>
                        <View style={[styles.statBox, { backgroundColor: colors.success + '20' }]}>
                            <Text style={[styles.statNumber, { color: colors.success }]}>
                                {totals.checkedIn}
                            </Text>
                            <Text style={styles.statLabel}>Checked-In</Text>
                        </View>
                        <View style={[styles.statBox, { backgroundColor: colors.warning + '20' }]}>
                            <Text style={[styles.statNumber, { color: colors.warning }]}>
                                {totals.scheduled}
                            </Text>
                            <Text style={styles.statLabel}>Scheduled</Text>
                        </View>
                        <View style={[styles.statBox, { backgroundColor: colors.error + '20' }]}>
                            <Text style={[styles.statNumber, { color: colors.error }]}>
                                {totals.cancelled}
                            </Text>
                            <Text style={styles.statLabel}>Cancelled</Text>
                        </View>
                    </View>
                    {isRefreshing && (
                        <View style={styles.refreshingOverlay}>
                            <ActivityIndicator size="small" color={colors.primary} />
                            <Text style={styles.refreshingText}>Updating...</Text>
                        </View>
                    )}
                </Card>

                {/* Session-wise breakdown */}
                {sessions.length > 0 && (
                    <>
                        <Text style={styles.sectionTitle}>Sessions</Text>
                        {sessions.map((session, idx) => (
                            <View
                                key={`${session.doctorId}-${session.startTime}-${idx}`}
                                style={styles.sessionCard}
                            >
                                <View style={styles.sessionHeader}>
                                    <View style={styles.sessionIconWrap}>
                                        <Ionicons name="medical" size={20} color={colors.primary} />
                                    </View>
                                    <View style={styles.sessionInfo}>
                                        <Text style={styles.sessionDoctor}>
                                            {session.doctorName}
                                        </Text>
                                        <Text style={styles.sessionTime}>
                                            {formatTime(session.startTime)} - {formatTime(session.endTime)}
                                            {session.specialization ? ` • ${session.specialization}` : ''}
                                        </Text>
                                    </View>
                                    {session.isModified && (
                                        <View style={styles.modifiedBadge}>
                                            <Text style={styles.modifiedText}>Modified</Text>
                                        </View>
                                    )}
                                </View>
                                <View style={styles.sessionStats}>
                                    <View style={styles.sessionStatItem}>
                                        <Text style={[styles.sessionStatNum, { color: colors.info }]}>
                                            {session.bookingStats.total}
                                        </Text>
                                        <Text style={styles.sessionStatLabel}>Total</Text>
                                    </View>
                                    <View style={styles.sessionStatItem}>
                                        <Text style={[styles.sessionStatNum, { color: colors.success }]}>
                                            {session.bookingStats.checkedIn}
                                        </Text>
                                        <Text style={styles.sessionStatLabel}>Checked-In</Text>
                                    </View>
                                    <View style={styles.sessionStatItem}>
                                        <Text style={[styles.sessionStatNum, { color: colors.warning }]}>
                                            {session.bookingStats.scheduled}
                                        </Text>
                                        <Text style={styles.sessionStatLabel}>Scheduled</Text>
                                    </View>
                                    <View style={styles.sessionStatItem}>
                                        <Text style={[styles.sessionStatNum, { color: colors.error }]}>
                                            {session.bookingStats.cancelled}
                                        </Text>
                                        <Text style={styles.sessionStatLabel}>Cancelled</Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </>
                )}

                {sessions.length === 0 && !isLoading && (
                    <View style={styles.noSessions}>
                        <Ionicons name="calendar-outline" size={40} color={colors.textSecondary} />
                        <Text style={styles.noSessionsText}>No sessions scheduled for today</Text>
                    </View>
                )}

                {/* Quick Actions */}
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.menuGrid}>
                    {menuItems.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={styles.menuCard}
                            onPress={() => navigation.navigate(item.screen)}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.menuIconContainer, { backgroundColor: item.color + '20' }]}>
                                <Ionicons name={item.icon as any} size={28} color={item.color} />
                            </View>
                            <Text style={styles.menuTitle}>{item.title}</Text>
                            <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    scrollContent: {
        padding: spacing.md,
        paddingTop: spacing.lg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    greeting: {
        fontSize: fontSizes.lg,
        color: colors.textSecondary,
    },
    dispensaryName: {
        fontSize: fontSizes.xxl,
        fontWeight: 'bold',
        color: colors.text,
    },
    logoutBtn: {
        padding: spacing.sm,
    },
    summaryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    summaryTitle: {
        fontSize: fontSizes.lg,
        fontWeight: '600',
        color: colors.text,
    },
    summarySubtitle: {
        fontSize: fontSizes.sm,
        color: colors.textSecondary,
        marginTop: 2,
    },
    refreshBtn: {
        padding: spacing.sm,
        borderRadius: borderRadius.md,
        backgroundColor: colors.primary + '15',
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    refreshBtnActive: {
        backgroundColor: colors.primary + '25',
    },
    refreshingOverlay: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.sm,
    },
    refreshingText: {
        fontSize: fontSizes.sm,
        color: colors.primary,
        marginLeft: spacing.sm,
        fontWeight: '500',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -spacing.xs,
    },
    statBox: {
        width: '48%',
        marginHorizontal: '1%',
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginBottom: spacing.sm,
        alignItems: 'center',
    },
    statNumber: {
        fontSize: fontSizes.xxl,
        fontWeight: 'bold',
    },
    statLabel: {
        fontSize: fontSizes.sm,
        color: colors.textSecondary,
        marginTop: spacing.xs,
    },
    sectionTitle: {
        fontSize: fontSizes.lg,
        fontWeight: '600',
        color: colors.text,
        marginTop: spacing.md,
        marginBottom: spacing.md,
    },
    // Session cards
    sessionCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.sm,
        ...shadows.sm,
    },
    sessionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    sessionIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.sm,
    },
    sessionInfo: {
        flex: 1,
    },
    sessionDoctor: {
        fontSize: fontSizes.md,
        fontWeight: '600',
        color: colors.text,
    },
    sessionTime: {
        fontSize: fontSizes.sm,
        color: colors.textSecondary,
    },
    modifiedBadge: {
        backgroundColor: colors.warning + '20',
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: borderRadius.sm,
    },
    modifiedText: {
        fontSize: fontSizes.xs,
        color: colors.warning,
        fontWeight: '600',
    },
    sessionStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: colors.background,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.sm,
    },
    sessionStatItem: {
        alignItems: 'center',
    },
    sessionStatNum: {
        fontSize: fontSizes.lg,
        fontWeight: 'bold',
    },
    sessionStatLabel: {
        fontSize: fontSizes.xs,
        color: colors.textSecondary,
        marginTop: 2,
    },
    noSessions: {
        alignItems: 'center',
        paddingVertical: spacing.xl,
    },
    noSessionsText: {
        fontSize: fontSizes.md,
        color: colors.textSecondary,
        marginTop: spacing.sm,
    },
    // Menu grid
    menuGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -spacing.sm,
    },
    menuCard: {
        width: '47%',
        marginHorizontal: '1.5%',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
        alignItems: 'center',
        ...shadows.md,
    },
    menuIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    menuTitle: {
        fontSize: fontSizes.md,
        fontWeight: '600',
        color: colors.text,
        marginBottom: spacing.xs,
    },
    menuSubtitle: {
        fontSize: fontSizes.sm,
        color: colors.textSecondary,
        textAlign: 'center',
    },
});

export default DashboardScreen;
