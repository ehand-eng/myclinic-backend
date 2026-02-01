import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { format } from 'date-fns';
import { Card, Button, StatusBadge } from '../../components';
import { bookingService } from '../../api/services';
import { FormattedBooking } from '../../types';
import { colors, spacing, fontSizes, commonStyles } from '../../styles/theme';
import { Ionicons } from '@expo/vector-icons';

interface RouteParams {
    booking: FormattedBooking;
}

const BookingDetailScreen: React.FC = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { booking } = route.params as RouteParams;

    const handleCheckIn = async () => {
        Alert.alert('Check In', `Mark ${booking.patientName} as checked in?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Check In',
                onPress: async () => {
                    try {
                        await bookingService.checkIn(booking._id);
                        Alert.alert('Success', 'Patient checked in successfully');
                        navigation.goBack();
                    } catch (error) {
                        Alert.alert('Error', 'Failed to check in patient');
                    }
                },
            },
        ]);
    };

    const handleComplete = async () => {
        Alert.alert('Complete', 'Mark this booking as completed?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Complete',
                onPress: async () => {
                    try {
                        await bookingService.updateStatus(booking._id, {
                            status: 'completed',
                            completedTime: new Date().toISOString(),
                            isPaid: true,
                            isPatientVisited: true,
                        });
                        Alert.alert('Success', 'Booking completed successfully');
                        navigation.goBack();
                    } catch (error) {
                        Alert.alert('Error', 'Failed to complete booking');
                    }
                },
            },
        ]);
    };

    const handleCancel = async () => {
        Alert.alert('Cancel Booking', 'Are you sure you want to cancel this booking?', [
            { text: 'No', style: 'cancel' },
            {
                text: 'Yes, Cancel',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await bookingService.cancel(booking._id, 'Cancelled by admin');
                        Alert.alert('Success', 'Booking cancelled successfully');
                        navigation.goBack();
                    } catch (error) {
                        Alert.alert('Error', 'Failed to cancel booking');
                    }
                },
            },
        ]);
    };

    const handleMarkNoShow = async () => {
        Alert.alert('No Show', 'Mark patient as no-show?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Mark No Show',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await bookingService.updateStatus(booking._id, { status: 'no_show' });
                        Alert.alert('Success', 'Patient marked as no-show');
                        navigation.goBack();
                    } catch (error) {
                        Alert.alert('Error', 'Failed to update status');
                    }
                },
            },
        ]);
    };

    const DetailRow: React.FC<{ icon: string; label: string; value: string }> = ({
        icon,
        label,
        value,
    }) => (
        <View style={styles.detailRow}>
            <Ionicons name={icon as any} size={20} color={colors.primary} style={styles.detailIcon} />
            <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>{label}</Text>
                <Text style={styles.detailValue}>{value}</Text>
            </View>
        </View>
    );

    return (
        <ScrollView style={commonStyles.container} contentContainerStyle={styles.content}>
            {/* Header */}
            <Card>
                <View style={styles.header}>
                    <View style={styles.appointmentBadge}>
                        <Text style={styles.appointmentText}>#{booking.appointmentNumber}</Text>
                    </View>
                    <StatusBadge status={booking.status} />
                </View>
                <Text style={styles.reference}>Ref: {booking.transactionId}</Text>
            </Card>

            {/* Patient Info */}
            <Card title="Patient Information">
                <DetailRow icon="person" label="Name" value={booking.patientName} />
                <DetailRow icon="call" label="Phone" value={booking.patientPhone} />
                {booking.patientEmail && (
                    <DetailRow icon="mail" label="Email" value={booking.patientEmail} />
                )}
                {booking.symptoms && (
                    <DetailRow icon="medkit" label="Symptoms" value={booking.symptoms} />
                )}
            </Card>

            {/* Appointment Info */}
            <Card title="Appointment Details">
                <DetailRow
                    icon="calendar"
                    label="Date"
                    value={format(new Date(booking.bookingDate), 'EEEE, MMMM d, yyyy')}
                />
                <DetailRow icon="time" label="Time Slot" value={booking.timeSlot} />
                <DetailRow icon="alarm" label="Estimated Time" value={booking.estimatedTime} />
                {booking.doctor && (
                    <DetailRow
                        icon="medical"
                        label="Doctor"
                        value={`${booking.doctor.name} - ${booking.doctor.specialization}`}
                    />
                )}
                {booking.dispensary && (
                    <DetailRow icon="business" label="Dispensary" value={booking.dispensary.name} />
                )}
            </Card>

            {/* Status Info */}
            {booking.checkedInTime && (
                <Card title="Check-in Information">
                    <DetailRow
                        icon="checkmark-circle"
                        label="Checked In At"
                        value={format(new Date(booking.checkedInTime), 'h:mm a')}
                    />
                </Card>
            )}

            {/* Payment Info */}
            <Card title="Payment Status">
                <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>Payment Status</Text>
                    <View style={[styles.paymentBadge, { backgroundColor: booking.isPaid ? colors.success : colors.warning }]}>
                        <Text style={styles.paymentBadgeText}>{booking.isPaid ? 'Paid' : 'Pending'}</Text>
                    </View>
                </View>
            </Card>

            {/* Actions */}
            {booking.status !== 'completed' && booking.status !== 'cancelled' && booking.status !== 'no_show' && (
                <Card title="Actions">
                    {booking.status === 'scheduled' && (
                        <>
                            <Button
                                title="Check In Patient"
                                onPress={handleCheckIn}
                                variant="success"
                                style={styles.actionBtn}
                            />
                            <Button
                                title="Cancel Booking"
                                onPress={handleCancel}
                                variant="danger"
                                style={styles.actionBtn}
                            />
                            <Button
                                title="Mark as No Show"
                                onPress={handleMarkNoShow}
                                variant="outline"
                                style={styles.actionBtn}
                            />
                        </>
                    )}
                    {booking.status === 'checked_in' && (
                        <>
                            <Button
                                title="Mark as Completed"
                                onPress={handleComplete}
                                variant="success"
                                style={styles.actionBtn}
                            />
                            <Button
                                title="Mark as No Show"
                                onPress={handleMarkNoShow}
                                variant="outline"
                                style={styles.actionBtn}
                            />
                        </>
                    )}
                </Card>
            )}

            <View style={styles.bottomPadding} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    content: {
        padding: spacing.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    appointmentBadge: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: spacing.sm,
    },
    appointmentText: {
        fontSize: fontSizes.xl,
        fontWeight: 'bold',
        color: colors.textWhite,
    },
    reference: {
        fontSize: fontSizes.sm,
        color: colors.textSecondary,
        marginTop: spacing.sm,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
    },
    detailIcon: {
        marginRight: spacing.md,
        marginTop: 2,
    },
    detailContent: {
        flex: 1,
    },
    detailLabel: {
        fontSize: fontSizes.sm,
        color: colors.textSecondary,
    },
    detailValue: {
        fontSize: fontSizes.md,
        color: colors.text,
        fontWeight: '500',
        marginTop: 2,
    },
    paymentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    paymentLabel: {
        fontSize: fontSizes.md,
        color: colors.text,
    },
    paymentBadge: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: spacing.full,
    },
    paymentBadgeText: {
        fontSize: fontSizes.sm,
        fontWeight: '600',
        color: colors.textWhite,
    },
    actionBtn: {
        marginBottom: spacing.sm,
    },
    bottomPadding: {
        height: spacing.xxl,
    },
});

export default BookingDetailScreen;
