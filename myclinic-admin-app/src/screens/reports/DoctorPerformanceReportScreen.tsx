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
import { format, subDays } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { Card, LoadingSpinner, EmptyState } from '../../components';
import { reportService, doctorService } from '../../api/services';
import { DoctorPerformance, Doctor } from '../../types';
import { colors, spacing, fontSizes, borderRadius, commonStyles } from '../../styles/theme';

const DoctorPerformanceReportScreen: React.FC = () => {
    const { selectedDispensary } = useAuth();

    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
    const [report, setReport] = useState<DoctorPerformance | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Date range: last 30 days
    const endDate = new Date();
    const startDate = subDays(endDate, 30);

    const loadDoctors = useCallback(async () => {
        if (!selectedDispensary) return;
        try {
            const data = await doctorService.getByDispensary(selectedDispensary._id);
            setDoctors(data);
            if (data.length > 0 && !selectedDoctor) {
                setSelectedDoctor(data[0]);
            }
        } catch (error) {
            console.error('Error loading doctors:', error);
        }
    }, [selectedDispensary]);

    const loadReport = useCallback(async () => {
        if (!selectedDispensary || !selectedDoctor) return;

        try {
            const data = await reportService.getDoctorPerformance({
                doctorId: selectedDoctor._id,
                startDate: format(startDate, 'yyyy-MM-dd'),
                endDate: format(endDate, 'yyyy-MM-dd'),
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
    }, [selectedDispensary, selectedDoctor, startDate, endDate]);

    useEffect(() => {
        loadDoctors();
    }, [loadDoctors]);

    useEffect(() => {
        if (selectedDoctor) {
            setIsLoading(true);
            loadReport();
        }
    }, [loadReport, selectedDoctor]);

    const handleRefresh = () => {
        setIsRefreshing(true);
        loadReport();
    };

    if (isLoading && doctors.length === 0) {
        return <LoadingSpinner message="Loading..." />;
    }

    return (
        <View style={commonStyles.container}>
            {/* Doctor Selector */}
            <View style={styles.doctorSelector}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {doctors.map((doctor) => (
                        <TouchableOpacity
                            key={doctor._id}
                            style={[
                                styles.doctorChip,
                                selectedDoctor?._id === doctor._id && styles.doctorChipActive,
                            ]}
                            onPress={() => setSelectedDoctor(doctor)}
                        >
                            <Text
                                style={[
                                    styles.doctorChipText,
                                    selectedDoctor?._id === doctor._id && styles.doctorChipTextActive,
                                ]}
                            >
                                {doctor.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Date Range Info */}
            <View style={styles.dateRangeInfo}>
                <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.dateRangeText}>
                    {format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')} (Last 30 days)
                </Text>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
                }
            >
                {isLoading ? (
                    <LoadingSpinner message="Loading report..." fullScreen={false} />
                ) : report ? (
                    <>
                        {/* Summary Stats */}
                        <Card title="Performance Summary">
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

                        {/* Performance Metrics */}
                        <Card title="Performance Metrics">
                            <View style={styles.metricRow}>
                                <Text style={styles.metricLabel}>Completion Rate</Text>
                                <View style={styles.metricValueContainer}>
                                    <View
                                        style={[
                                            styles.progressBar,
                                            {
                                                width: `${Math.min(report.completionRate, 100)}%`,
                                                backgroundColor: colors.success,
                                            },
                                        ]}
                                    />
                                    <Text style={[styles.metricValue, { color: colors.success }]}>
                                        {report.completionRate?.toFixed(1)}%
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.metricRow}>
                                <Text style={styles.metricLabel}>Cancellation Rate</Text>
                                <View style={styles.metricValueContainer}>
                                    <View
                                        style={[
                                            styles.progressBar,
                                            {
                                                width: `${Math.min(report.cancellationRate, 100)}%`,
                                                backgroundColor: colors.error,
                                            },
                                        ]}
                                    />
                                    <Text style={[styles.metricValue, { color: colors.error }]}>
                                        {report.cancellationRate?.toFixed(1)}%
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.metricRow}>
                                <Text style={styles.metricLabel}>No-Show Rate</Text>
                                <View style={styles.metricValueContainer}>
                                    <View
                                        style={[
                                            styles.progressBar,
                                            {
                                                width: `${Math.min(report.noShowRate, 100)}%`,
                                                backgroundColor: colors.warning,
                                            },
                                        ]}
                                    />
                                    <Text style={[styles.metricValue, { color: colors.warning }]}>
                                        {report.noShowRate?.toFixed(1)}%
                                    </Text>
                                </View>
                            </View>

                            {report.averageConsultationTime > 0 && (
                                <View style={styles.avgTimeContainer}>
                                    <Ionicons name="time-outline" size={24} color={colors.primary} />
                                    <View style={styles.avgTimeText}>
                                        <Text style={styles.avgTimeLabel}>Avg. Consultation Time</Text>
                                        <Text style={styles.avgTimeValue}>
                                            {report.averageConsultationTime} minutes
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </Card>
                    </>
                ) : (
                    <EmptyState
                        icon="bar-chart-outline"
                        title="No Data"
                        message="No performance data available for this doctor"
                    />
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    doctorSelector: {
        backgroundColor: colors.surface,
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    doctorChip: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        borderWidth: 1,
        borderColor: colors.border,
        marginRight: spacing.sm,
    },
    doctorChipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    doctorChipText: {
        fontSize: fontSizes.sm,
        color: colors.text,
    },
    doctorChipTextActive: {
        color: colors.textWhite,
        fontWeight: '600',
    },
    dateRangeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.sm,
        backgroundColor: colors.borderLight,
    },
    dateRangeText: {
        fontSize: fontSizes.sm,
        color: colors.textSecondary,
        marginLeft: spacing.xs,
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
    metricRow: {
        marginBottom: spacing.md,
    },
    metricLabel: {
        fontSize: fontSizes.md,
        color: colors.text,
        marginBottom: spacing.xs,
    },
    metricValueContainer: {
        height: 24,
        backgroundColor: colors.borderLight,
        borderRadius: borderRadius.full,
        overflow: 'hidden',
        position: 'relative',
        justifyContent: 'center',
    },
    progressBar: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        borderRadius: borderRadius.full,
    },
    metricValue: {
        fontSize: fontSizes.sm,
        fontWeight: '600',
        textAlign: 'center',
    },
    avgTimeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        backgroundColor: colors.primary + '10',
        borderRadius: borderRadius.md,
        marginTop: spacing.md,
    },
    avgTimeText: {
        marginLeft: spacing.md,
    },
    avgTimeLabel: {
        fontSize: fontSizes.sm,
        color: colors.textSecondary,
    },
    avgTimeValue: {
        fontSize: fontSizes.lg,
        fontWeight: '600',
        color: colors.primary,
    },
});

export default DoctorPerformanceReportScreen;
