import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, addMonths, subMonths } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { Card, LoadingSpinner, EmptyState } from '../../components';
import { reportService } from '../../api/services';
import { MonthlyReport, DailyStats } from '../../types';
import { colors, spacing, fontSizes, borderRadius, commonStyles } from '../../styles/theme';

const MonthlyReportScreen: React.FC = () => {
    const { selectedDispensary } = useAuth();

    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [report, setReport] = useState<MonthlyReport | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const loadReport = useCallback(async () => {
        if (!selectedDispensary) return;

        try {
            const data = await reportService.getMonthlySummary({
                month: currentMonth.getMonth() + 1,
                year: currentMonth.getFullYear(),
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
    }, [selectedDispensary, currentMonth]);

    useEffect(() => {
        setIsLoading(true);
        loadReport();
    }, [loadReport]);

    const handlePreviousMonth = () => {
        setCurrentMonth(subMonths(currentMonth, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(addMonths(currentMonth, 1));
    };

    const handleRefresh = () => {
        setIsRefreshing(true);
        loadReport();
    };

    if (isLoading) {
        return <LoadingSpinner message="Loading report..." />;
    }

    const completionRate = report
        ? ((report.completedBookings / report.totalBookings) * 100).toFixed(1)
        : 0;

    return (
        <View style={commonStyles.container}>
            {/* Month Navigation */}
            <View style={styles.monthNav}>
                <TouchableOpacity onPress={handlePreviousMonth} style={styles.navBtn}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.monthText}>{format(currentMonth, 'MMMM yyyy')}</Text>
                <TouchableOpacity onPress={handleNextMonth} style={styles.navBtn}>
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
                        <Card title="Monthly Summary">
                            <View style={styles.statsGrid}>
                                <View style={[styles.statBox, { backgroundColor: colors.info + '20' }]}>
                                    <Text style={[styles.statNum, { color: colors.info }]}>
                                        {report.totalBookings}
                                    </Text>
                                    <Text style={styles.statLabel}>Total Bookings</Text>
                                </View>
                                <View style={[styles.statBox, { backgroundColor: colors.success + '20' }]}>
                                    <Text style={[styles.statNum, { color: colors.success }]}>
                                        {report.completedBookings}
                                    </Text>
                                    <Text style={styles.statLabel}>Completed</Text>
                                </View>
                                <View style={[styles.statBox, { backgroundColor: colors.error + '20' }]}>
                                    <Text style={[styles.statNum, { color: colors.error }]}>
                                        {report.cancelledBookings}
                                    </Text>
                                    <Text style={styles.statLabel}>Cancelled</Text>
                                </View>
                                <View style={[styles.statBox, { backgroundColor: colors.warning + '20' }]}>
                                    <Text style={[styles.statNum, { color: colors.warning }]}>
                                        {report.noShowBookings}
                                    </Text>
                                    <Text style={styles.statLabel}>No Shows</Text>
                                </View>
                            </View>
                        </Card>

                        {/* Completion Rate */}
                        <Card title="Completion Rate">
                            <View style={styles.rateContainer}>
                                <View style={styles.rateCircle}>
                                    <Text style={styles.rateValue}>{completionRate}%</Text>
                                </View>
                                <Text style={styles.rateLabel}>
                                    {report.completedBookings} of {report.totalBookings} bookings completed
                                </Text>
                            </View>
                        </Card>

                        {/* Daily Breakdown */}
                        <Card title="Daily Breakdown">
                            {report.dailyStats && report.dailyStats.length > 0 ? (
                                report.dailyStats.map((day, index) => (
                                    <View key={day.date || index} style={styles.dayRow}>
                                        <Text style={styles.dayDate}>
                                            {format(new Date(day.date), 'MMM d')}
                                        </Text>
                                        <View style={styles.dayStats}>
                                            <View style={styles.dayStat}>
                                                <Text style={[styles.dayStatNum, { color: colors.info }]}>{day.total}</Text>
                                                <Text style={styles.dayStatLabel}>Total</Text>
                                            </View>
                                            <View style={styles.dayStat}>
                                                <Text style={[styles.dayStatNum, { color: colors.success }]}>
                                                    {day.completed}
                                                </Text>
                                                <Text style={styles.dayStatLabel}>Done</Text>
                                            </View>
                                            <View style={styles.dayStat}>
                                                <Text style={[styles.dayStatNum, { color: colors.error }]}>
                                                    {day.cancelled}
                                                </Text>
                                                <Text style={styles.dayStatLabel}>Cancel</Text>
                                            </View>
                                        </View>
                                    </View>
                                ))
                            ) : (
                                <Text style={styles.noData}>No daily data available</Text>
                            )}
                        </Card>
                    </>
                ) : (
                    <EmptyState
                        icon="document-text-outline"
                        title="No Data"
                        message="No report data available for this month"
                    />
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    monthNav: {
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
    monthText: {
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
        textAlign: 'center',
    },
    rateContainer: {
        alignItems: 'center',
        paddingVertical: spacing.md,
    },
    rateCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: colors.success + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    rateValue: {
        fontSize: fontSizes.xxl,
        fontWeight: 'bold',
        color: colors.success,
    },
    rateLabel: {
        fontSize: fontSizes.md,
        color: colors.textSecondary,
        textAlign: 'center',
    },
    dayRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
    },
    dayDate: {
        fontSize: fontSizes.md,
        fontWeight: '600',
        color: colors.text,
        width: 60,
    },
    dayStats: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    dayStat: {
        alignItems: 'center',
    },
    dayStatNum: {
        fontSize: fontSizes.md,
        fontWeight: '600',
    },
    dayStatLabel: {
        fontSize: fontSizes.xs,
        color: colors.textSecondary,
    },
    noData: {
        fontSize: fontSizes.md,
        color: colors.textSecondary,
        textAlign: 'center',
        padding: spacing.md,
    },
});

export default MonthlyReportScreen;
