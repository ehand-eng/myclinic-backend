import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Card, LoadingSpinner } from '../../components';
import { timeSlotService } from '../../api/services';
import { DoctorSession } from '../../types';
import { colors, spacing, fontSizes, borderRadius, shadows, commonStyles } from '../../styles/theme';
import { format } from 'date-fns';

const OngoingNumberScreen: React.FC = () => {
    const { selectedDispensary } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [sessions, setSessions] = useState<DoctorSession[]>([]);
    const [selectedSession, setSelectedSession] = useState<DoctorSession | null>(null);
    const [ongoingCount, setOngoingCount] = useState(0);

    const today = format(new Date(), 'yyyy-MM-dd');
    const todayDisplay = format(new Date(), 'EEEE, MMM d, yyyy');

    const loadSessions = useCallback(async () => {
        if (!selectedDispensary) return;
        try {
            const result = await timeSlotService.getSessionsByDispensary(
                selectedDispensary._id,
                today
            );
            setSessions(result.sessions);

            // Auto-select if only one session
            if (result.sessions.length === 1) {
                setSelectedSession(result.sessions[0]);
                setOngoingCount(result.sessions[0].bookingStats.checkedIn || 0);
            }
        } catch (error) {
            console.error('Error loading sessions:', error);
        } finally {
            setIsLoading(false);
        }
    }, [selectedDispensary, today]);

    useEffect(() => {
        loadSessions();
    }, [loadSessions]);

    const handleSelectSession = (session: DoctorSession) => {
        setSelectedSession(session);
        setOngoingCount(session.bookingStats.checkedIn || 0);
    };

    const formatTime = (time: string) => {
        const [h, m] = time.split(':').map(Number);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const hour = h % 12 || 12;
        return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
    };

    if (isLoading) {
        return <LoadingSpinner message="Loading sessions..." />;
    }

    // Session selection view
    if (!selectedSession) {
        return (
            <View style={commonStyles.container}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <Text style={styles.dateText}>📅 {todayDisplay}</Text>

                    {sessions.length === 0 ? (
                        <Card title="" subtitle="">
                            <View style={styles.emptyState}>
                                <Ionicons name="calendar-outline" size={48} color={colors.textSecondary} />
                                <Text style={styles.emptyText}>No sessions today</Text>
                            </View>
                        </Card>
                    ) : (
                        <>
                            <Text style={styles.sectionTitle}>Select a Session</Text>
                            {sessions.map((session, idx) => (
                                <TouchableOpacity
                                    key={`${session.doctorId}-${session.startTime}-${idx}`}
                                    style={styles.sessionCard}
                                    onPress={() => handleSelectSession(session)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.sessionInfo}>
                                        <View style={styles.sessionIconWrap}>
                                            <Ionicons name="medical" size={24} color={colors.primary} />
                                        </View>
                                        <View style={styles.sessionDetails}>
                                            <Text style={styles.sessionDoctor}>{session.doctorName}</Text>
                                            <Text style={styles.sessionSpec}>{session.specialization}</Text>
                                            <Text style={styles.sessionTime}>
                                                🕐 {formatTime(session.startTime)} - {formatTime(session.endTime)}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.sessionBadge}>
                                        <Text style={styles.sessionBadgeText}>
                                            {session.bookingStats.total} bookings
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </>
                    )}
                </ScrollView>
            </View>
        );
    }

    // Ongoing number counter view
    return (
        <View style={commonStyles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.dateText}>📅 {todayDisplay}</Text>

                {/* Selected session info */}
                <TouchableOpacity
                    style={styles.selectedSessionBar}
                    onPress={() => setSelectedSession(null)}
                >
                    <View>
                        <Text style={styles.selectedDoctorName}>{selectedSession.doctorName}</Text>
                        <Text style={styles.selectedSessionTime}>
                            {formatTime(selectedSession.startTime)} - {formatTime(selectedSession.endTime)}
                        </Text>
                    </View>
                    {sessions.length > 1 && (
                        <View style={styles.changeBtn}>
                            <Text style={styles.changeBtnText}>Change</Text>
                            <Ionicons name="chevron-down" size={16} color={colors.primary} />
                        </View>
                    )}
                </TouchableOpacity>

                {/* Big counter */}
                <View style={[styles.counterBox, { backgroundColor: colors.primary }]}>
                    <Text style={styles.counterLabel}>Ongoing Number</Text>
                    <View style={styles.counterControls}>
                        <TouchableOpacity
                            style={styles.counterBtn}
                            onPress={() => setOngoingCount(prev => Math.max(0, prev - 1))}
                        >
                            <Ionicons name="remove-circle-outline" size={48} color="rgba(255,255,255,0.8)" />
                        </TouchableOpacity>

                        <Text style={styles.counterNumber}>{ongoingCount}</Text>

                        <TouchableOpacity
                            style={styles.counterBtn}
                            onPress={() => setOngoingCount(prev => prev + 1)}
                        >
                            <Ionicons name="add-circle-outline" size={48} color="white" />
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity onPress={() => setOngoingCount(0)}>
                        <Text style={styles.resetText}>Reset Counter</Text>
                    </TouchableOpacity>
                </View>

                {/* Session stats */}
                <Card title="Session Stats" subtitle="">
                    <View style={styles.miniStats}>
                        <View style={[styles.miniStatBox, { backgroundColor: colors.info + '20' }]}>
                            <Text style={[styles.miniStatNum, { color: colors.info }]}>
                                {selectedSession.bookingStats.total}
                            </Text>
                            <Text style={styles.miniStatLabel}>Total</Text>
                        </View>
                        <View style={[styles.miniStatBox, { backgroundColor: colors.success + '20' }]}>
                            <Text style={[styles.miniStatNum, { color: colors.success }]}>
                                {selectedSession.bookingStats.checkedIn}
                            </Text>
                            <Text style={styles.miniStatLabel}>Checked-In</Text>
                        </View>
                        <View style={[styles.miniStatBox, { backgroundColor: colors.warning + '20' }]}>
                            <Text style={[styles.miniStatNum, { color: colors.warning }]}>
                                {selectedSession.bookingStats.scheduled}
                            </Text>
                            <Text style={styles.miniStatLabel}>Scheduled</Text>
                        </View>
                        <View style={[styles.miniStatBox, { backgroundColor: colors.error + '20' }]}>
                            <Text style={[styles.miniStatNum, { color: colors.error }]}>
                                {selectedSession.bookingStats.cancelled}
                            </Text>
                            <Text style={styles.miniStatLabel}>Cancelled</Text>
                        </View>
                    </View>
                </Card>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    scrollContent: {
        padding: spacing.md,
        paddingTop: spacing.lg,
    },
    dateText: {
        fontSize: fontSizes.md,
        color: colors.textSecondary,
        marginBottom: spacing.md,
        fontWeight: '500',
    },
    sectionTitle: {
        fontSize: fontSizes.lg,
        fontWeight: '600',
        color: colors.text,
        marginBottom: spacing.md,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: spacing.xl,
    },
    emptyText: {
        fontSize: fontSizes.md,
        color: colors.textSecondary,
        marginTop: spacing.md,
    },
    sessionCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        ...shadows.md,
    },
    sessionInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    sessionIconWrap: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    sessionDetails: {
        flex: 1,
    },
    sessionDoctor: {
        fontSize: fontSizes.md,
        fontWeight: '600',
        color: colors.text,
    },
    sessionSpec: {
        fontSize: fontSizes.sm,
        color: colors.textSecondary,
    },
    sessionTime: {
        fontSize: fontSizes.sm,
        color: colors.primary,
        marginTop: 2,
    },
    sessionBadge: {
        backgroundColor: colors.info + '20',
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
    },
    sessionBadgeText: {
        fontSize: fontSizes.xs,
        color: colors.info,
        fontWeight: '600',
    },
    selectedSessionBar: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        ...shadows.sm,
    },
    selectedDoctorName: {
        fontSize: fontSizes.md,
        fontWeight: '600',
        color: colors.text,
    },
    selectedSessionTime: {
        fontSize: fontSizes.sm,
        color: colors.primary,
        marginTop: 2,
    },
    changeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    changeBtnText: {
        fontSize: fontSizes.sm,
        color: colors.primary,
        fontWeight: '500',
        marginRight: 4,
    },
    counterBox: {
        borderRadius: borderRadius.lg,
        padding: spacing.xl,
        alignItems: 'center',
        marginBottom: spacing.md,
        ...shadows.md,
    },
    counterLabel: {
        fontSize: fontSizes.lg,
        fontWeight: '600',
        color: '#FFFFFF',
        opacity: 0.9,
        marginBottom: spacing.md,
    },
    counterControls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    counterBtn: {
        padding: spacing.xs,
    },
    counterNumber: {
        fontSize: 64,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginHorizontal: spacing.xl,
        minWidth: 80,
        textAlign: 'center',
    },
    resetText: {
        fontSize: fontSizes.sm,
        color: '#FFFFFF',
        opacity: 0.7,
        textDecorationLine: 'underline',
        marginTop: spacing.md,
    },
    miniStats: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -spacing.xs,
    },
    miniStatBox: {
        width: '48%',
        marginHorizontal: '1%',
        padding: spacing.sm,
        borderRadius: borderRadius.md,
        marginBottom: spacing.sm,
        alignItems: 'center',
    },
    miniStatNum: {
        fontSize: fontSizes.xl,
        fontWeight: 'bold',
    },
    miniStatLabel: {
        fontSize: fontSizes.xs,
        color: colors.textSecondary,
        marginTop: 2,
    },
});

export default OngoingNumberScreen;
