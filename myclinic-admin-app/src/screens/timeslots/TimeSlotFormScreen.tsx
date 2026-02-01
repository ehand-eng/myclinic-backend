import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Alert,
    Switch,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { Button, Input, Card } from '../../components';
import { timeSlotService } from '../../api/services';
import { Doctor, TimeSlotConfig, DAYS_OF_WEEK } from '../../types';
import { colors, spacing, fontSizes, borderRadius, commonStyles } from '../../styles/theme';

interface RouteParams {
    mode: 'add' | 'edit';
    doctor: Doctor;
    timeSlot?: TimeSlotConfig;
}

const TimeSlotFormScreen: React.FC = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { mode, doctor, timeSlot } = route.params as RouteParams;
    const { selectedDispensary } = useAuth();

    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        dayOfWeek: timeSlot?.dayOfWeek ?? 1,
        startTime: timeSlot?.startTime || '09:00',
        endTime: timeSlot?.endTime || '12:00',
        maxPatients: timeSlot?.maxPatients?.toString() || '20',
        minutesPerPatient: timeSlot?.minutesPerPatient?.toString() || '15',
        bookingCutoverTime: timeSlot?.bookingCutoverTime?.toString() || '60',
        isActive: timeSlot?.isActive ?? true,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        navigation.setOptions({
            title: mode === 'add' ? 'Add Time Slot' : 'Edit Time Slot',
        });
    }, [mode, navigation]);

    const validate = () => {
        const newErrors: Record<string, string> = {};

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

        if (!formData.minutesPerPatient || isNaN(Number(formData.minutesPerPatient))) {
            newErrors.minutesPerPatient = 'Valid minutes per patient is required';
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

        setIsLoading(true);

        try {
            const data = {
                doctorId: doctor._id,
                dispensaryId: selectedDispensary._id,
                dayOfWeek: formData.dayOfWeek,
                startTime: formData.startTime,
                endTime: formData.endTime,
                maxPatients: Number(formData.maxPatients),
                minutesPerPatient: Number(formData.minutesPerPatient),
                bookingCutoverTime: Number(formData.bookingCutoverTime || 60),
                isActive: formData.isActive,
            };

            if (mode === 'add') {
                await timeSlotService.create(data);
                Alert.alert('Success', 'Time slot created successfully');
            } else if (timeSlot) {
                await timeSlotService.update(timeSlot._id, data);
                Alert.alert('Success', 'Time slot updated successfully');
            }

            navigation.goBack();
        } catch (error: any) {
            const message = error.response?.data?.message || 'Failed to save time slot';
            Alert.alert('Error', message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={commonStyles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <Card title="Schedule Configuration" subtitle={`For ${doctor.name}`}>
                    {/* Day Selection */}
                    <Text style={styles.label}>Day of Week *</Text>
                    <View style={styles.daySelector}>
                        {DAYS_OF_WEEK.map((day, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.dayBtn,
                                    formData.dayOfWeek === index && styles.dayBtnActive,
                                ]}
                                onPress={() => setFormData({ ...formData, dayOfWeek: index })}
                            >
                                <Text
                                    style={[
                                        styles.dayBtnText,
                                        formData.dayOfWeek === index && styles.dayBtnTextActive,
                                    ]}
                                >
                                    {day.substring(0, 3)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Time Inputs */}
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
                        label="Minutes Per Patient *"
                        value={formData.minutesPerPatient}
                        onChangeText={(text) => setFormData({ ...formData, minutesPerPatient: text })}
                        error={errors.minutesPerPatient}
                        placeholder="Average consultation time"
                        keyboardType="numeric"
                    />

                    <Input
                        label="Booking Cutover Time (minutes)"
                        value={formData.bookingCutoverTime}
                        onChangeText={(text) => setFormData({ ...formData, bookingCutoverTime: text })}
                        placeholder="Time before session to stop bookings"
                        keyboardType="numeric"
                    />

                    <View style={styles.switchRow}>
                        <View style={styles.switchLabel}>
                            <Text style={styles.switchLabelText}>Active</Text>
                            <Text style={styles.helperText}>
                                Inactive slots won't accept new bookings
                            </Text>
                        </View>
                        <Switch
                            value={formData.isActive}
                            onValueChange={(value) => setFormData({ ...formData, isActive: value })}
                            trackColor={{ false: colors.border, true: colors.primaryLight }}
                            thumbColor={formData.isActive ? colors.primary : colors.textLight}
                        />
                    </View>
                </Card>

                <View style={styles.buttonContainer}>
                    <Button
                        title={mode === 'add' ? 'Create Time Slot' : 'Save Changes'}
                        onPress={handleSubmit}
                        loading={isLoading}
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
    label: {
        fontSize: fontSizes.sm,
        fontWeight: '600',
        color: colors.text,
        marginBottom: spacing.sm,
    },
    daySelector: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: spacing.md,
    },
    dayBtn: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border,
        marginRight: spacing.xs,
        marginBottom: spacing.xs,
    },
    dayBtnActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    dayBtnText: {
        fontSize: fontSizes.sm,
        color: colors.text,
    },
    dayBtnTextActive: {
        color: colors.textWhite,
        fontWeight: '600',
    },
    timeRow: {
        flexDirection: 'row',
        marginHorizontal: -spacing.xs,
    },
    timeInput: {
        flex: 1,
        paddingHorizontal: spacing.xs,
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.borderLight,
        marginTop: spacing.md,
    },
    switchLabel: {
        flex: 1,
    },
    switchLabelText: {
        fontSize: fontSizes.md,
        fontWeight: '500',
        color: colors.text,
    },
    helperText: {
        fontSize: fontSizes.sm,
        color: colors.textSecondary,
        marginTop: 2,
    },
    buttonContainer: {
        marginTop: spacing.md,
    },
    cancelBtn: {
        marginTop: spacing.sm,
    },
});

export default TimeSlotFormScreen;
