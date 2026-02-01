import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { Card, LoadingSpinner } from '../../components';
import { doctorService, bookingService, reportService } from '../../api/services';
import { Doctor, DailyBookingsReport } from '../../types';
import { colors, spacing, fontSizes, borderRadius, shadows, commonStyles } from '../../styles/theme';
import { format } from 'date-fns';

const DashboardScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const { user, selectedDispensary, logout } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [todayReport, setTodayReport] = useState<DailyBookingsReport | null>(null);

    const loadDashboardData = useCallback(async () => {
        if (!selectedDispensary) return;

        try {
            const today = format(new Date(), 'yyyy-MM-dd');

            const [doctorList, report] = await Promise.all([
                doctorService.getByDispensary(selectedDispensary._id),
                reportService.getDailyBookings({
                    date: today,
                    dispensaryId: selectedDispensary._id,
                }).catch(() => null),
            ]);

            setDoctors(doctorList);
            setTodayReport(report);
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
                    // Navigation will automatically switch to AuthStack via AppNavigator
                },
            },
        ]);
    };

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

                {/* Today's Summary */}
                {todayReport && (
                    <Card title="Today's Summary" subtitle={format(new Date(), 'EEEE, MMM d, yyyy')}>
                        <View style={styles.statsGrid}>
                            <View style={[styles.statBox, { backgroundColor: colors.info + '20' }]}>
                                <Text style={[styles.statNumber, { color: colors.info }]}>
                                    {todayReport.total}
                                </Text>
                                <Text style={styles.statLabel}>Total</Text>
                            </View>
                            <View style={[styles.statBox, { backgroundColor: colors.success + '20' }]}>
                                <Text style={[styles.statNumber, { color: colors.success }]}>
                                    {todayReport.completed}
                                </Text>
                                <Text style={styles.statLabel}>Completed</Text>
                            </View>
                            <View style={[styles.statBox, { backgroundColor: colors.warning + '20' }]}>
                                <Text style={[styles.statNumber, { color: colors.warning }]}>
                                    {todayReport.total - todayReport.completed - todayReport.cancelled}
                                </Text>
                                <Text style={styles.statLabel}>Pending</Text>
                            </View>
                            <View style={[styles.statBox, { backgroundColor: colors.error + '20' }]}>
                                <Text style={[styles.statNumber, { color: colors.error }]}>
                                    {todayReport.cancelled}
                                </Text>
                                <Text style={styles.statLabel}>Cancelled</Text>
                            </View>
                        </View>
                    </Card>
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
