import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Alert,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity,
    FlatList,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { format, addDays } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { Button, Input, Card } from '../../components';
import { timeSlotService } from '../../api/services';
import { Doctor, ConflictingBooking } from '../../types';
import { colors, spacing, fontSizes, borderRadius, commonStyles } from '../../styles/theme';

interface RouteParams {
    doctor: Doctor;
}

type EntryMode = 'absent' | 'dateRange' | 'modified';

const AbsentFormScreen: React.FC = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { doctor } = route.params as RouteParams;
    const { selectedDispensary } = useAuth();

    const [isLoading, setIsLoading] = useState(false);
    const [entryMode, setEntryMode] = useState<EntryMode>('absent');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [formData, setFormData] = useState({
        startTime: '09:00',
        endTime: '12:00',
        maxPatients: '20',
        minutesPerPatient: '15',
        reason: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Date range state
    const [rangeStartDate, setRangeStartDate] = useState(addDays(new Date(), 1));
    const [rangeEndDate, setRangeEndDate] = useState(addDays(new Date(), 2));
    const [rangeReason, setRangeReason] = useState('');

    useEffect(() => {
        navigation.setOptions({
            title: 'Add Absence / Modified Session',
        });
    }, [navigation]);

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (entryMode === 'modified') {
            if (!formData.startTime) {
                newErrors.startTime = 'Start time is required';
            }
            if (!formData.endTime) {
                newErrors.endTime = 'End time is required';
            }
            if (formData.startTime >= formData.endTime) {
                newErrors.endTime = 'End time must be after start time';
            }
            if (!formData.maxPatients || isNaN(Number(formData.maxPatients))) {
                newErrors.maxPatients = 'Valid max patients is required';
            }
        }

        if (entryMode === 'dateRange') {
            if (rangeStartDate >= rangeEndDate) {
                newErrors.rangeEndDate = 'End date must be after start date';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        if (!selectedDispensary) {
            Alert.alert('Error', 'Please select a dispensary');
            return;
        }

        if (entryMode === 'dateRange') {
            await handleDateRangeSubmit(false);
            return;
        }

        setIsLoading(true);

        try {
            const isModifiedSession = entryMode === 'modified';
            const data: any = {
                doctorId: doctor._id,
                dispensaryId: selectedDispensary._id,
                date: format(selectedDate, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"),
                isModifiedSession,
                reason: formData.reason || undefined,
            };

            if (isModifiedSession) {
                data.startTime = formData.startTime;
                data.endTime = formData.endTime;
                data.maxPatients = Number(formData.maxPatients);
                data.minutesPerPatient = Number(formData.minutesPerPatient);
            }

            await timeSlotService.createAbsent(data);
            Alert.alert(
                'Success',
                isModifiedSession
                    ? 'Modified session created successfully'
                    : 'Absence marked successfully'
            );
            navigation.goBack();
        } catch (error: any) {
            const message = error.response?.data?.message || 'Failed to save';
            Alert.alert('Error', message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDateRangeSubmit = async (force: boolean) => {
        if (!selectedDispensary) return;

        setIsLoading(true);

        try {
            const startStr = format(rangeStartDate, 'yyyy-MM-dd');
            const endStr = format(rangeEndDate, 'yyyy-MM-dd');

            await timeSlotService.createDateRangeAbsent({
                doctorId: doctor._id,
                dispensaryId: selectedDispensary._id,
                startDate: startStr,
                endDate: endStr,
                reason: rangeReason || undefined,
                force,
            });

            Alert.alert('Success', 'Date range absence marked successfully');
            navigation.goBack();
        } catch (error: any) {
            if (error.response?.status === 409) {
                const data = error.response.data;
                if (data.requiresForce && data.conflictingBookings) {
                    const bookingsList = data.conflictingBookings
                        .map((b: ConflictingBooking) =>
                            `${b.patientName} - ${b.patientPhone}\n  ${format(new Date(b.bookingDate), 'MMM dd')} at ${b.estimatedTime} (${b.transactionId})`
                        )
                        .join('\n\n');

                    Alert.alert(
                        'Existing Bookings Found',
                        `There are ${data.conflictingBookings.length} booking(s) in this range. Dates will show as unavailable for new bookings. Please contact patients to reschedule.\n\n${bookingsList}`,
                        [
                            { text: 'Cancel', style: 'cancel' },
                            {
                                text: 'Proceed & Mark Absent',
                                style: 'destructive',
                                onPress: () => handleDateRangeSubmit(true),
                            },
                        ]
                    );
                } else if (data.overlappingAbsences) {
                    Alert.alert('Overlap Detected', 'There are already absence records overlapping with this date range. Please delete them first.');
                } else {
                    Alert.alert('Conflict', data.message || 'A conflict was detected');
                }
            } else {
                const message = error.response?.data?.message || 'Failed to create date range absence';
                Alert.alert('Error', message);
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Simple date selection - next 30 days
    const dates = Array.from({ length: 30 }, (_, i) => addDays(new Date(), i));

    return (
        <KeyboardAvoidingView
            style={commonStyles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                {/* Entry Type Selector */}
                <Card title="Entry Type">
                    <View style={styles.typeRow}>
                        <TouchableOpacity
                            style={[styles.typeBtn, entryMode === 'absent' && styles.typeBtnActive]}
                            onPress={() => setEntryMode('absent')}
                        >
                            <Text style={[styles.typeText, entryMode === 'absent' && styles.typeTextActive]}>
                                Mark Absent
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.typeBtn, entryMode === 'dateRange' && styles.typeBtnDateRangeActive]}
                            onPress={() => setEntryMode('dateRange')}
                        >
                            <Text style={[styles.typeText, entryMode === 'dateRange' && styles.typeTextActive]}>
                                Date Range
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.typeBtn, entryMode === 'modified' && styles.typeBtnActive]}
                            onPress={() => setEntryMode('modified')}
                        >
                            <Text style={[styles.typeText, entryMode === 'modified' && styles.typeTextActive]}>
                                Modified
                            </Text>
                        </TouchableOpacity>
                    </View>
                </Card>

                {/* Date Range Form */}
                {entryMode === 'dateRange' && (
                    <>
                        <Card title="Select Start Date">
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <View style={styles.dateRow}>
                                    {dates.map((date) => (
                                        <TouchableOpacity
                                            key={`start-${date.toISOString()}`}
                                            style={[
                                                styles.dateItem,
                                                format(date, 'yyyy-MM-dd') === format(rangeStartDate, 'yyyy-MM-dd') &&
                                                styles.dateItemDateRangeActive,
                                            ]}
                                            onPress={() => {
                                                setRangeStartDate(date);
                                                if (date >= rangeEndDate) {
                                                    setRangeEndDate(addDays(date, 1));
                                                }
                                            }}
                                        >
                                            <Text style={[styles.dateDay, format(date, 'yyyy-MM-dd') === format(rangeStartDate, 'yyyy-MM-dd') && styles.dateTextActive]}>
                                                {format(date, 'EEE')}
                                            </Text>
                                            <Text style={[styles.dateNum, format(date, 'yyyy-MM-dd') === format(rangeStartDate, 'yyyy-MM-dd') && styles.dateTextActive]}>
                                                {format(date, 'd')}
                                            </Text>
                                            <Text style={[styles.dateMonth, format(date, 'yyyy-MM-dd') === format(rangeStartDate, 'yyyy-MM-dd') && styles.dateTextActive]}>
                                                {format(date, 'MMM')}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </ScrollView>
                        </Card>

                        <Card title="Select End Date">
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <View style={styles.dateRow}>
                                    {dates.filter(d => d > rangeStartDate).map((date) => (
                                        <TouchableOpacity
                                            key={`end-${date.toISOString()}`}
                                            style={[
                                                styles.dateItem,
                                                format(date, 'yyyy-MM-dd') === format(rangeEndDate, 'yyyy-MM-dd') &&
                                                styles.dateItemDateRangeActive,
                                            ]}
                                            onPress={() => setRangeEndDate(date)}
                                        >
                                            <Text style={[styles.dateDay, format(date, 'yyyy-MM-dd') === format(rangeEndDate, 'yyyy-MM-dd') && styles.dateTextActive]}>
                                                {format(date, 'EEE')}
                                            </Text>
                                            <Text style={[styles.dateNum, format(date, 'yyyy-MM-dd') === format(rangeEndDate, 'yyyy-MM-dd') && styles.dateTextActive]}>
                                                {format(date, 'd')}
                                            </Text>
                                            <Text style={[styles.dateMonth, format(date, 'yyyy-MM-dd') === format(rangeEndDate, 'yyyy-MM-dd') && styles.dateTextActive]}>
                                                {format(date, 'MMM')}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </ScrollView>
                        </Card>

                        <Card title="Details">
                            <View style={styles.rangeSummary}>
                                <Text style={styles.rangeSummaryText}>
                                    Absent from {format(rangeStartDate, 'MMM dd, yyyy')} to {format(rangeEndDate, 'MMM dd, yyyy')}
                                </Text>
                            </View>

                            <Input
                                label="Reason (Optional)"
                                value={rangeReason}
                                onChangeText={setRangeReason}
                                placeholder="Why is the doctor absent?"
                                multiline
                                numberOfLines={3}
                            />
                        </Card>
                    </>
                )}

                {/* Single Date Absent / Modified Session Forms */}
                {(entryMode === 'absent' || entryMode === 'modified') && (
                    <>
                        <Card title="Select Date">
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <View style={styles.dateRow}>
                                    {dates.map((date) => (
                                        <TouchableOpacity
                                            key={date.toISOString()}
                                            style={[
                                                styles.dateItem,
                                                format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd') &&
                                                styles.dateItemActive,
                                            ]}
                                            onPress={() => setSelectedDate(date)}
                                        >
                                            <Text style={[styles.dateDay, format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd') && styles.dateTextActive]}>
                                                {format(date, 'EEE')}
                                            </Text>
                                            <Text style={[styles.dateNum, format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd') && styles.dateTextActive]}>
                                                {format(date, 'd')}
                                            </Text>
                                            <Text style={[styles.dateMonth, format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd') && styles.dateTextActive]}>
                                                {format(date, 'MMM')}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </ScrollView>
                        </Card>

                        <Card title="Session Details">
                            {entryMode === 'modified' && (
                                <>
                                    <View style={styles.timeRow}>
                                        <View style={styles.timeInput}>
                                            <Input
                                                label="Start Time *"
                                                value={formData.startTime}
                                                onChangeText={(text) => setFormData({ ...formData, startTime: text })}
                                                error={errors.startTime}
                                                placeholder="09:00"
                                            />
                                        </View>
                                        <View style={styles.timeInput}>
                                            <Input
                                                label="End Time *"
                                                value={formData.endTime}
                                                onChangeText={(text) => setFormData({ ...formData, endTime: text })}
                                                error={errors.endTime}
                                                placeholder="12:00"
                                            />
                                        </View>
                                    </View>

                                    <Input
                                        label="Maximum Patients *"
                                        value={formData.maxPatients}
                                        onChangeText={(text) => setFormData({ ...formData, maxPatients: text })}
                                        error={errors.maxPatients}
                                        placeholder="Maximum number of patients"
                                        keyboardType="numeric"
                                    />

                                    <Input
                                        label="Minutes Per Patient"
                                        value={formData.minutesPerPatient}
                                        onChangeText={(text) => setFormData({ ...formData, minutesPerPatient: text })}
                                        placeholder="Average consultation time"
                                        keyboardType="numeric"
                                    />
                                </>
                            )}

                            <Input
                                label="Reason (Optional)"
                                value={formData.reason}
                                onChangeText={(text) => setFormData({ ...formData, reason: text })}
                                placeholder="Enter reason..."
                                multiline
                                numberOfLines={3}
                            />
                        </Card>
                    </>
                )}

                <View style={styles.buttonContainer}>
                    <Button
                        title={
                            entryMode === 'modified'
                                ? 'Create Modified Session'
                                : entryMode === 'dateRange'
                                    ? 'Mark Absent for Date Range'
                                    : 'Mark as Absent'
                        }
                        onPress={handleSubmit}
                        loading={isLoading}
                        style={entryMode === 'dateRange' ? styles.dateRangeBtn : undefined}
                    />
                    <Button
                        title="Cancel"
                        variant="outline"
                        onPress={() => navigation.goBack()}
                        style={styles.cancelBtn}
                    />
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    content: {
        padding: spacing.md,
    },
    dateRow: {
        flexDirection: 'row',
        paddingVertical: spacing.sm,
    },
    dateItem: {
        alignItems: 'center',
        padding: spacing.sm,
        marginRight: spacing.sm,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border,
        minWidth: 60,
    },
    dateItemActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    dateItemDateRangeActive: {
        backgroundColor: '#dc2626',
        borderColor: '#dc2626',
    },
    dateDay: {
        fontSize: fontSizes.sm,
        color: colors.textSecondary,
    },
    dateNum: {
        fontSize: fontSizes.xl,
        fontWeight: 'bold',
        color: colors.text,
        marginVertical: 2,
    },
    dateMonth: {
        fontSize: fontSizes.sm,
        color: colors.textSecondary,
    },
    dateTextActive: {
        color: colors.textWhite,
    },
    typeRow: {
        flexDirection: 'row',
        marginBottom: spacing.md,
    },
    typeBtn: {
        flex: 1,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        marginHorizontal: spacing.xs,
    },
    typeBtnActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    typeBtnDateRangeActive: {
        backgroundColor: '#dc2626',
        borderColor: '#dc2626',
    },
    typeText: {
        fontSize: fontSizes.sm,
        fontWeight: '500',
        color: colors.text,
    },
    typeTextActive: {
        color: colors.textWhite,
    },
    timeRow: {
        flexDirection: 'row',
        marginHorizontal: -spacing.xs,
    },
    timeInput: {
        flex: 1,
        paddingHorizontal: spacing.xs,
    },
    buttonContainer: {
        marginTop: spacing.md,
    },
    cancelBtn: {
        marginTop: spacing.sm,
    },
    dateRangeBtn: {
        backgroundColor: '#dc2626',
    },
    rangeSummary: {
        backgroundColor: '#fef2f2',
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: '#fecaca',
    },
    rangeSummaryText: {
        fontSize: fontSizes.md,
        fontWeight: '600',
        color: '#dc2626',
        textAlign: 'center',
    },
});

export default AbsentFormScreen;
