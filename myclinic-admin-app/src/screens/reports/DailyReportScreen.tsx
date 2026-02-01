import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    FlatList,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, addDays, subDays } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { Card, LoadingSpinner, EmptyState, StatusBadge } from '../../components';
import { reportService } from '../../api/services';
import { DailyBookingsReport, ReportBooking } from '../../types';
import { colors, spacing, fontSizes, borderRadius, commonStyles } from '../../styles/theme';

const DailyReportScreen: React.FC = () => {
    const { selectedDispensary } = useAuth();

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [report, setReport] = useState<DailyBookingsReport | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const loadReport = useCallback(async () => {
        if (!selectedDispensary) return;

        try {
            const data = await reportService.getDailyBookings({
                date: format(selectedDate, 'yyyy-MM-dd'),
                dispensaryId: selectedDispensary._id,
            });
            setReport(data);
        } catch (error) {
            console.error('Error loading report:', error);
            setReport(null);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [selectedDispensary, selectedDate]);

    useEffect(() => {
        setIsLoading(true);
        loadReport();
    }, [loadReport]);

    const handlePreviousDay = () => {
        setSelectedDate(subDays(selectedDate, 1));
    };

    const handleNextDay = () => {
        setSelectedDate(addDays(selectedDate, 1));
    };

    const handleRefresh = () => {
        setIsRefreshing(true);
        loadReport();
    };

    if (isLoading) {
        return <LoadingSpinner message="Loading report..." />;
    }

    const renderBookingItem = ({ item }: { item: ReportBooking }) => (
        <View style={styles.bookingItem}>
            <View style={styles.bookingHeader}>
                <Text style={styles.timeSlot}>{item.timeSlot}</Text>
                <StatusBadge status={item.status} />
            </View>
            <Text style={styles.patientName}>{item.patientName}</Text>
            <Text style={styles.patientPhone}>{item.patientPhone}</Text>
            <Text style={styles.doctorName}>{item.doctorName}</Text>
        </View>
    );

    return (
        <View style={commonStyles.container}>
            {/* Date Navigation */}
            <View style={styles.dateNav}>
                <TouchableOpacity onPress={handlePreviousDay} style={styles.navBtn}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setSelectedDate(new Date())}>
                    <Text style={styles.dateText}>{format(selectedDate, 'EEE, MMM d, yyyy')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleNextDay} style={styles.navBtn}>
                    <Ionicons name="chevron-forward" size={24} color={colors.text} />
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
                }
            >
                {report ? (
                    <>
                        {/* Summary Stats */}
                        <Card title="Summary">
                            <View style={styles.statsGrid}>
                                <View style={[styles.statBox, { backgroundColor: colors.info + '20' }]}>
                                    <Text style={[styles.statNum, { color: colors.info }]}>{report.total}</Text>
                                    <Text style={styles.statLabel}>Total</Text>
                                </View>
                                <View style={[styles.statBox, { backgroundColor: colors.success + '20' }]}>
                                    <Text style={[styles.statNum, { color: colors.success }]}>{report.completed}</Text>
                                    <Text style={styles.statLabel}>Completed</Text>
                                </View>
                                <View style={[styles.statBox, { backgroundColor: colors.error + '20' }]}>
                                    <Text style={[styles.statNum, { color: colors.error }]}>{report.cancelled}</Text>
                                    <Text style={styles.statLabel}>Cancelled</Text>
                                </View>
                                <View style={[styles.statBox, { backgroundColor: colors.warning + '20' }]}>
                                    <Text style={[styles.statNum, { color: colors.warning }]}>{report.noShow}</Text>
                                    <Text style={styles.statLabel}>No Show</Text>
                                </View>
                            </View>
                        </Card>

                        {/* Revenue Summary */}
                        <Card title="Revenue">
                            <View style={styles.revenueRow}>
                                <Text style={styles.revenueLabel}>Total Amount</Text>
                                <Text style={styles.revenueValue}>
                                    Rs. {report.totalAmount?.toLocaleString() || 0}
                                </Text>
                            </View>
                            <View style={styles.revenueRow}>
                                <Text style={styles.revenueLabel}>Total Commission</Text>
                                <Text style={styles.revenueValue}>
                                    Rs. {report.totalCommission?.toLocaleString() || 0}
                                </Text>
                            </View>
                        </Card>

                        {/* Bookings List */}
                        <Card title={`Bookings (${report.bookings?.length || 0})`}>
                            {report.bookings && report.bookings.length > 0 ? (
                                report.bookings.map((booking, index) => (
                                    <React.Fragment key={booking.id || index}>
                                        {renderBookingItem({ item: booking })}
                                        {index < report.bookings.length - 1 && <View style={styles.divider} />}
                                    </React.Fragment>
                                ))
                            ) : (
                                <Text style={styles.noBookings}>No bookings for this day</Text>
                            )}
                        </Card>
                    </>
                ) : (
                    <EmptyState
                        icon="document-text-outline"
                        title="No Data"
                        message="No report data available for this date"
                    />
                )}
            </ScrollView>
        </View>
    );
};

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
    content: {
        padding: spacing.md,
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
    statNum: {
        fontSize: fontSizes.xxl,
        fontWeight: 'bold',
    },
    statLabel: {
        fontSize: fontSizes.sm,
        color: colors.textSecondary,
        marginTop: spacing.xs,
    },
    revenueRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
    },
    revenueLabel: {
        fontSize: fontSizes.md,
        color: colors.textSecondary,
    },
    revenueValue: {
        fontSize: fontSizes.md,
        fontWeight: '600',
        color: colors.text,
    },
    bookingItem: {
        paddingVertical: spacing.sm,
    },
    bookingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    timeSlot: {
        fontSize: fontSizes.md,
        fontWeight: '600',
        color: colors.primary,
    },
    patientName: {
        fontSize: fontSizes.md,
        fontWeight: '500',
        color: colors.text,
    },
    patientPhone: {
        fontSize: fontSizes.sm,
        color: colors.textSecondary,
    },
    doctorName: {
        fontSize: fontSizes.sm,
        color: colors.textSecondary,
        fontStyle: 'italic',
    },
    divider: {
        height: 1,
        backgroundColor: colors.borderLight,
        marginVertical: spacing.sm,
    },
    noBookings: {
        fontSize: fontSizes.md,
        color: colors.textSecondary,
        textAlign: 'center',
        padding: spacing.md,
    },
});

export default DailyReportScreen;
